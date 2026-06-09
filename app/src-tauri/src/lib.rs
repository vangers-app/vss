use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};

use futures_util::StreamExt;
use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager};

// The release archive must contain `mods.json` (new declarative schema, see the
// `mods` orphan branch of vss-geerah-super-set) alongside the mod data folders.
const MODS_URL: &str =
    "https://github.com/vangers-app/vss-geerah-super-set/releases/download/v1.3/vss-mods.zip";

static CANCEL_DOWNLOAD: AtomicBool = AtomicBool::new(false);

#[derive(Serialize)]
struct LocalFile {
    rel: String,
    abs: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AddonMeta {
    id: String,
    // Localized text: a plain string or `{ "en": ..., "ru": ... }` — passed through
    // verbatim, the frontend picks the locale.
    name: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<serde_json::Value>,
    // Absolute path to a preview image (mods.json `image` field or preview.jpg fallback).
    #[serde(skip_serializing_if = "Option::is_none")]
    image: Option<String>,
    // Absolute path to a README (resolved from the mods.json `readme` field).
    #[serde(skip_serializing_if = "Option::is_none")]
    readme: Option<String>,
    // Absolute path to a background image (mods.json `background` field).
    #[serde(skip_serializing_if = "Option::is_none")]
    background: Option<String>,
    default_enabled: bool,
    // Mutual-exclusion group: only one enabled mod per group.
    #[serde(skip_serializing_if = "Option::is_none")]
    group: Option<String>,
    // Data folders overlaid over the game install (defaults to `[id]`).
    folders: Vec<String>,
    // Runtime behavior `{ "type": ..., ...params }` dispatched in the app by type.
    #[serde(skip_serializing_if = "Option::is_none")]
    behavior: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct ModsManifest {
    // Mod metadata declared in ls.json (order preserved).
    addons: Vec<AddonMeta>,
    // Files of every top-level data folder under scripts/, keyed by folder name.
    // `rel` is the game-relative path inside that folder.
    folders: std::collections::HashMap<String, Vec<LocalFile>>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct DownloadProgress {
    phase: String,
    label: String,
    loaded: u64,
    total: Option<u64>,
}

fn get_vangers_steam_path() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    let paths = vec![
        PathBuf::from("C:/Program Files (x86)/Steam/steamapps/common/Vangers"),
        PathBuf::from("C:/Program Files/Steam/steamapps/common/Vangers"),
    ];

    #[cfg(target_os = "macos")]
    let paths = vec![PathBuf::from(format!(
        "{}/Library/Application Support/Steam/steamapps/common/Vangers",
        std::env::var("HOME").unwrap_or_default()
    ))];

    #[cfg(target_os = "linux")]
    let paths = vec![
        PathBuf::from(format!(
            "{}/.steam/steam/steamapps/common/Vangers",
            std::env::var("HOME").unwrap_or_default()
        )),
        PathBuf::from(format!(
            "{}/.local/share/Steam/steamapps/common/Vangers",
            std::env::var("HOME").unwrap_or_default()
        )),
    ];

    paths.into_iter().find(|p| p.exists())
}

fn mods_dir(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_data_dir().ok().map(|p| p.join("mods"))
}

// Root of the unpacked legacy scripts bundle (archive contains a top-level `scripts/`).
fn scripts_root(app: &AppHandle) -> Option<PathBuf> {
    mods_dir(app).map(|p| p.join("scripts"))
}

fn allowed_local_file(app: &AppHandle, decoded: &str) -> Result<PathBuf, String> {
    let path =
        fs::canonicalize(PathBuf::from(decoded)).map_err(|_| "file not found".to_string())?;
    let is_under = |root: PathBuf| {
        fs::canonicalize(root)
            .map(|root| path.starts_with(root))
            .unwrap_or(false)
    };
    // Allow files from either the Steam install or the downloaded mods dir.
    let allowed = get_vangers_steam_path().map(&is_under).unwrap_or(false)
        || mods_dir(app).map(&is_under).unwrap_or(false);
    if allowed {
        Ok(path)
    } else {
        Err("file access denied".to_string())
    }
}

fn walk_dir(root: &Path, dir: &Path, out: &mut Vec<LocalFile>) {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            walk_dir(root, &path, out);
        } else if path.is_file() {
            if let Ok(rel) = path.strip_prefix(root) {
                out.push(LocalFile {
                    rel: rel.to_string_lossy().replace('\\', "/").to_lowercase(),
                    abs: path.to_string_lossy().to_string(),
                });
            }
        }
    }
}

#[tauri::command]
fn find_steam_install() -> Option<Vec<LocalFile>> {
    let root = get_vangers_steam_path()?;
    let data = root.join("data");
    let mut files = Vec::new();
    walk_dir(&data, &data, &mut files);
    Some(files)
}

fn open_main_devtools(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        window.open_devtools();
    }
}

#[tauri::command]
fn toggle_devtools(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
    }
}

#[tauri::command]
fn read_local_file(app: AppHandle, path: String) -> Result<tauri::ipc::Response, String> {
    let path = allowed_local_file(&app, &path)?;
    let bytes = fs::read(&path).map_err(|_| "file not found".to_string())?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[tauri::command]
fn list_mods(app: AppHandle) -> ModsManifest {
    let empty = ModsManifest {
        addons: Vec::new(),
        folders: std::collections::HashMap::new(),
    };
    let scripts = match scripts_root(&app) {
        Some(p) => p,
        None => return empty,
    };
    let manifest = match fs::read_to_string(scripts.join("mods.json")) {
        Ok(s) => s,
        Err(_) => return empty,
    };
    let parsed: serde_json::Value = match serde_json::from_str(&manifest) {
        Ok(v) => v,
        Err(_) => return empty,
    };

    let mut addons = Vec::new();
    if let Some(list) = parsed.get("mods").and_then(|a| a.as_array()) {
        for addon in list {
            let id = match addon.get("id").and_then(|v| v.as_str()) {
                Some(id) => id.to_string(),
                None => continue,
            };
            let name = addon
                .get("name")
                .cloned()
                .unwrap_or_else(|| serde_json::Value::String(id.clone()));
            let description = addon.get("description").cloned();
            let resolve = |field: &str| {
                addon.get(field).and_then(|v| v.as_str()).and_then(|rel| {
                    let abs = scripts.join(rel);
                    if abs.is_file() {
                        Some(abs.to_string_lossy().to_string())
                    } else {
                        None
                    }
                })
            };
            let default_enabled = addon
                .get("enabled")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            let group = addon
                .get("group")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            let folders = addon
                .get("folders")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect::<Vec<_>>()
                })
                .unwrap_or_else(|| vec![id.clone()]);
            let behavior = addon.get("behavior").cloned();
            // The mod's data folders (incl. a random-file behavior folder), used to look
            // up conventional files like preview.jpg / README.md / background.jpg.
            let dirs = {
                let mut dirs = folders.clone();
                if let Some(f) = behavior
                    .as_ref()
                    .and_then(|b| b.get("folder"))
                    .and_then(|v| v.as_str())
                {
                    dirs.push(f.to_string());
                }
                dirs
            };
            let in_dirs = |filename: &str| {
                dirs.iter().find_map(|dir| {
                    let abs = scripts.join(dir).join(filename);
                    if abs.is_file() {
                        Some(abs.to_string_lossy().to_string())
                    } else {
                        None
                    }
                })
            };
            // Explicit path, else the conventional file in any of the mod's data folders.
            let image = resolve("image").or_else(|| in_dirs("preview.jpg"));
            let readme = resolve("readme").or_else(|| in_dirs("README.md"));
            let background = resolve("background").or_else(|| in_dirs("background.jpg"));
            addons.push(AddonMeta {
                id,
                name,
                description,
                image,
                readme,
                background,
                default_enabled,
                group,
                folders,
                behavior,
            });
        }
    }

    // Scan every top-level data folder so behaviors can merge files even when the
    // mod id differs from its data folder (e.g. jump mods).
    let mut folders = std::collections::HashMap::new();
    if let Ok(entries) = fs::read_dir(&scripts) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    let mut files = Vec::new();
                    walk_dir(&path, &path, &mut files);
                    folders.insert(name.to_string(), files);
                }
            }
        }
    }

    ModsManifest { addons, folders }
}

#[tauri::command]
fn cancel_download() {
    CANCEL_DOWNLOAD.store(true, Ordering::SeqCst);
}

#[tauri::command]
fn delete_mods(app: AppHandle) -> Result<(), String> {
    if let Some(dir) = mods_dir(&app) {
        if dir.exists() {
            fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

// Finds the directory that directly contains `filename`, searching `root` up to
// `max_depth` levels deep. Used to locate the `scripts/` root regardless of whether
// the archive wraps it in an extra folder.
fn find_file_dir(root: &Path, filename: &str, max_depth: usize) -> Option<PathBuf> {
    if root.join(filename).is_file() {
        return Some(root.to_path_buf());
    }
    if max_depth == 0 {
        return None;
    }
    let entries = fs::read_dir(root).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_file_dir(&path, filename, max_depth - 1) {
                return Some(found);
            }
        }
    }
    None
}

fn extract_zip(zip_path: &Path, dest: &Path) -> Result<(), String> {
    let file = fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        if CANCEL_DOWNLOAD.load(Ordering::SeqCst) {
            return Err("cancelled".to_string());
        }
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        // Decode the raw entry name as UTF-8 directly: the archive stores UTF-8 names
        // without the UTF-8 flag, so the crate would otherwise mis-decode them as CP437
        // and inflate Cyrillic names past the filesystem limit (ENAMETOOLONG).
        let raw = String::from_utf8_lossy(entry.name_raw()).into_owned();
        let is_dir = raw.ends_with('/') || raw.ends_with('\\');
        let mut rel = PathBuf::new();
        for part in raw.split(|c| c == '/' || c == '\\') {
            match part {
                "" | "." => continue,
                ".." => {
                    rel.pop();
                }
                p => rel.push(p),
            }
        }
        if rel.as_os_str().is_empty() {
            continue;
        }
        let out_path = dest.join(&rel);
        if is_dir {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut out = fs::File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut entry, &mut out).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn download_mods(
    app: AppHandle,
    on_progress: Channel<DownloadProgress>,
) -> Result<(), String> {
    CANCEL_DOWNLOAD.store(false, Ordering::SeqCst);

    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;

    let zip_path = cache_dir.join("mods-download.zip");
    let tmp_dir = data_dir.join("mods-tmp");
    let final_dir = data_dir.join("mods");

    // Clean any leftovers from a previous interrupted run.
    let cleanup = || {
        let _ = fs::remove_file(&zip_path);
        let _ = fs::remove_dir_all(&tmp_dir);
    };
    cleanup();

    let result = download_and_extract(&app, &on_progress, &zip_path, &tmp_dir, &final_dir).await;
    if result.is_err() {
        cleanup();
    } else {
        let _ = fs::remove_file(&zip_path);
    }
    result
}

async fn download_and_extract(
    _app: &AppHandle,
    on_progress: &Channel<DownloadProgress>,
    zip_path: &Path,
    tmp_dir: &Path,
    final_dir: &Path,
) -> Result<(), String> {
    // 1. Download to a temp zip with streamed progress.
    let response = reqwest::get(MODS_URL).await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("download failed: HTTP {}", response.status()));
    }
    let total = response.content_length();
    let mut file = fs::File::create(zip_path).map_err(|e| e.to_string())?;
    let mut stream = response.bytes_stream();
    let mut loaded: u64 = 0;
    on_progress
        .send(DownloadProgress {
            phase: "downloading".into(),
            label: "Downloading mods".into(),
            loaded,
            total,
        })
        .ok();
    while let Some(chunk) = stream.next().await {
        if CANCEL_DOWNLOAD.load(Ordering::SeqCst) {
            return Err("cancelled".to_string());
        }
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        loaded += chunk.len() as u64;
        on_progress
            .send(DownloadProgress {
                phase: "downloading".into(),
                label: "Downloading mods".into(),
                loaded,
                total,
            })
            .ok();
    }
    file.flush().map_err(|e| e.to_string())?;
    drop(file);

    // 2. Extract into a temp dir next to the final dir (same filesystem → atomic rename).
    on_progress
        .send(DownloadProgress {
            phase: "extracting".into(),
            label: "Extracting mods".into(),
            loaded,
            total,
        })
        .ok();
    let _ = fs::remove_dir_all(tmp_dir);
    fs::create_dir_all(tmp_dir).map_err(|e| e.to_string())?;
    extract_zip(zip_path, tmp_dir)?;

    // 3. Locate the mods root (the dir containing mods.json) — the archive may wrap
    // it in an extra folder — and swap it into <mods>/scripts.
    let scripts_src = find_file_dir(tmp_dir, "mods.json", 4)
        .ok_or_else(|| "mods.json not found in archive".to_string())?;
    let _ = fs::remove_dir_all(final_dir);
    fs::create_dir_all(final_dir).map_err(|e| e.to_string())?;
    fs::rename(&scripts_src, final_dir.join("scripts")).map_err(|e| e.to_string())?;
    let _ = fs::remove_dir_all(tmp_dir);

    on_progress
        .send(DownloadProgress {
            phase: "done".into(),
            label: "Done".into(),
            loaded,
            total,
        })
        .ok();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    std::env::set_var("JSC_useOMGJIT", "false");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            find_steam_install,
            toggle_devtools,
            read_local_file,
            list_mods,
            download_mods,
            cancel_download,
            delete_mods
        ])
        .register_uri_scheme_protocol("vfile", |ctx, request| {
            use tauri::http::{Response, StatusCode};
            let build = |status: StatusCode, bytes: Vec<u8>| {
                Response::builder()
                    .status(status)
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                    .header("Access-Control-Allow-Headers", "*")
                    .header("Content-Type", "application/octet-stream")
                    .body(bytes)
                    .unwrap()
            };
            let uri = request.uri();
            let encoded = uri.path().trim_start_matches('/');
            let decoded = match percent_decode(encoded) {
                Some(s) => s,
                None => return build(StatusCode::BAD_REQUEST, Vec::new()),
            };
            let path = match allowed_local_file(ctx.app_handle(), &decoded) {
                Ok(path) => path,
                Err(err) if err == "file access denied" => {
                    return build(StatusCode::FORBIDDEN, Vec::new())
                }
                Err(_) => return build(StatusCode::NOT_FOUND, Vec::new()),
            };
            match fs::read(&path) {
                Ok(bytes) => build(StatusCode::OK, bytes),
                Err(_) => build(StatusCode::NOT_FOUND, Vec::new()),
            }
        })
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                open_main_devtools(app.handle());
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn percent_decode(s: &str) -> Option<String> {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            let hi = (bytes[i + 1] as char).to_digit(16)?;
            let lo = (bytes[i + 2] as char).to_digit(16)?;
            out.push((hi * 16 + lo) as u8);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8(out).ok()
}
