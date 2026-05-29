use std::path::PathBuf;

use serde::Serialize;

#[derive(Serialize)]
struct LocalFile {
    rel: String,
    abs: String,
}

fn get_vangers_steam_path() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    let paths = vec![
        PathBuf::from("C:/Program Files (x86)/Steam/steamapps/common/Vangers"),
        PathBuf::from("C:/Program Files/Steam/steamapps/common/Vangers"),
    ];

    #[cfg(target_os = "macos")]
    let paths = vec![
        PathBuf::from(format!(
            "{}/Library/Application Support/Steam/steamapps/common/Vangers",
            std::env::var("HOME").unwrap_or_default()
        )),
    ];

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

fn walk_dir(root: &PathBuf, dir: &PathBuf, out: &mut Vec<LocalFile>) {
    let entries = match std::fs::read_dir(dir) {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    std::env::set_var("JSC_useOMGJIT", "false");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![find_steam_install])
        .register_uri_scheme_protocol("vfile", |_ctx, request| {
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
            let install = match get_vangers_steam_path() {
                Some(p) => p,
                None => return build(StatusCode::NOT_FOUND, Vec::new()),
            };
            let uri = request.uri();
            let encoded = uri.path().trim_start_matches('/');
            let decoded = match percent_decode(encoded) {
                Some(s) => s,
                None => return build(StatusCode::BAD_REQUEST, Vec::new()),
            };
            let path = PathBuf::from(&decoded);
            if !path.starts_with(&install) {
                return build(StatusCode::FORBIDDEN, Vec::new());
            }
            match std::fs::read(&path) {
                Ok(bytes) => build(StatusCode::OK, bytes),
                Err(_) => build(StatusCode::NOT_FOUND, Vec::new()),
            }
        })
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
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