// Dev-only Vite plugin: serves the installed game files over HTTP so the
// emscripten build can run in a plain browser, without the Tauri installer.
//
// The browser client normally reads game data through Tauri's `vfile://`
// custom scheme. A browser cannot fetch a scheme it does not understand, so
// instead of touching app code we stand in for the Tauri IPC layer: a tiny
// script injected before the bundle defines `window.__TAURI_INTERNALS__`, which
// makes compat.ts take its Tauri branch, and answers the two commands the
// client actually needs:
//
//   find_install       -> the relative/absolute file list of the data folder
//   read_local_file    -> raw bytes of one file
//
// Both are proxied to the endpoints below, which read from disk. Only the
// emscripten data folder is served, mirroring the path allow-list in
// app/src-tauri/src/lib.rs.

import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { Dirent } from "node:fs";
import type { Connect, Plugin } from "vite";

type LocalFile = { rel: string; abs: string };

const WALK_IGNORE = new Set([
  "logfile.txt",
  "settings.toml",
  "options.dat",
  "state.dat",
]);

function collect(root: string, dir: string, out: LocalFile[]): void {
  let entries: Dirent[];
  try {
    entries = Array.from(
      readdirSync(dir, { withFileTypes: true }),
    );
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collect(root, full, out);
    } else if (entry.isFile() && !WALK_IGNORE.has(entry.name.toLowerCase())) {
      const rel = path.relative(root, full).split(path.sep).join("/").toLowerCase();
      out.push({ rel, abs: full });
    }
  }
}

// Rejects anything that resolves outside the data folder.
function resolveInside(root: string, requested: string): string | null {
  const resolved = path.resolve(requested);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    return null;
  }
  if (!existsSync(resolved) || !statSync(resolved).isFile()) {
    return null;
  }
  return resolved;
}

export function steamFsPlugin(dataDir: string): Plugin {
  const root = path.resolve(dataDir);

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url ?? "";

    if (url === "/__steamfs/find_install") {
      console.log("[steam-fs] find_install");
      const files: LocalFile[] = [];
      collect(root, root, files);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(files));
      return;
    }

    if (url.startsWith("/__steamfs/read_local_file")) {
      console.log("[steam-fs] read", url.slice(40, 130));
      const requested = new URL(url, "http://localhost").searchParams.get("path") ?? "";
      const resolved = resolveInside(root, requested);
      if (resolved === null) {
        res.statusCode = 404;
        res.end("not found");
        return;
      }
      res.setHeader("Content-Type", "application/octet-stream");
      createReadStream(resolved).pipe(res);
      return;
    }

    next();
  };

  const shim = `
window.__TAURI_INTERNALS__ = {
  transformCallback: (cb) => { const id = Math.floor(Math.random() * 1e9); window[id] = cb; return id; },
  unregisterCallback: () => {},
  invoke: async (cmd, args) => {
    console.log('[steam-fs-shim] invoke', cmd);
    if (cmd === 'find_install') {
      const r = await fetch('/__steamfs/find_install');
      return r.json();
    }
    if (cmd === 'list_mods') {
      return { addons: [], folders: {} };
    }
    if (cmd === 'read_local_file') {
      const r = await fetch('/__steamfs/read_local_file?path=' + encodeURIComponent(args.path));
      if (!r.ok) { throw new Error('vfile fetch failed: ' + r.status); }
      return r.arrayBuffer();
    }
    return null;
  },
  plugins: {},
  events: {},
};
`;

  return {
    name: "steam-fs-dev",
    apply: "serve",

    configureServer(devServer) {
      devServer.middlewares.use(middleware);
    },

    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if (!existsSync(root)) {
          return {
            html,
            tags: [
              {
                tag: "script",
                injectTo: "head",
                children: `console.error("[steam-fs] data folder missing: ${root.replace(/</g, "")}");`,
              },
            ],
          };
        }
        return {
          html,
          tags: [{ tag: "script", injectTo: "head", children: shim }],
        };
      },
    },
  };
}

export default steamFsPlugin;
