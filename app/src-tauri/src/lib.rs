use std::path::PathBuf;

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

#[tauri::command]
fn find_steam_install() -> Option<Vec<String>> {
    let path = get_vangers_steam_path()?;

    let files = std::fs::read_dir(&path.join("data"))
        .ok()?
        .filter_map(|e| e.ok())
        .map(|e| e.file_name().to_string_lossy().to_string())
        .collect();

    Some(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![find_steam_install])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}