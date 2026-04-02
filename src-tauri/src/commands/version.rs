use serde::Serialize;

/// 应用版本信息
#[derive(Serialize)]
pub struct AppVersion {
    pub version: String,
    pub name: String,
}

/// 获取应用版本号
#[tauri::command]
pub fn get_app_version(app: tauri::AppHandle) -> AppVersion {
    let config = app.config();
    AppVersion {
        version: config.version.clone().unwrap_or_else(|| "unknown".to_string()),
        name: config
            .product_name
            .clone()
            .unwrap_or_else(|| "CLI-Manager".to_string()),
    }
}