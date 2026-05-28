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

#[tauri::command]
fn read_file(path: String) -> Result<tauri::ipc::Response, String> {
    let install = get_vangers_steam_path().ok_or_else(|| "steam install not found".to_string())?;
    let p = PathBuf::from(&path);
    if !p.starts_with(&install) {
        return Err("path outside steam install".to_string());
    }
    std::fs::read(&p)
        .map(tauri::ipc::Response::new)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![find_steam_install, read_file])
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