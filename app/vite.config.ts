import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { steamFsPlugin } from "./vite-plugin-steam-fs";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// Points the emscripten build at an installed copy of the game so it can be
// run in a plain browser during development, instead of going through the
// Tauri installer. Mirrors the Steam path that app/src-tauri/src/lib.rs probes.
// @ts-expect-error process is a nodejs global
const steamData = process.env.VANGERS_STEAM_DATA;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: steamData ? [preact(), steamFsPlugin(steamData)] : [preact()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
