use crate::pty::manager::{PtyManager, PtyProcessStatus};
use log::{debug, error, info};
use std::collections::HashMap;
use tauri::AppHandle;
use uuid::Uuid;

#[tauri::command]
pub async fn pty_create(
    app_handle: AppHandle,
    pty_manager: tauri::State<'_, PtyManager>,
    cwd: Option<String>,
    env_vars: Option<HashMap<String, String>>,
    shell: Option<String>,
) -> Result<String, String> {
    let session_id = Uuid::new_v4().to_string();
    let env_count = env_vars.as_ref().map(|vars| vars.len()).unwrap_or(0);
    info!(
        "pty_create requested: session_id={}, cwd={:?}, shell={:?}, env_vars={}",
        session_id, cwd, shell, env_count
    );
    pty_manager
        .create(&session_id, cwd.as_deref(), env_vars, shell.as_deref(), app_handle)
        .map_err(|err| {
            error!("pty_create failed: session_id={}, error={}", session_id, err);
            err
        })?;
    info!("pty_create succeeded: session_id={}", session_id);
    Ok(session_id)
}

#[tauri::command]
pub async fn pty_write(
    pty_manager: tauri::State<'_, PtyManager>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    pty_manager.write(&session_id, &data).map_err(|err| {
        error!("pty_write failed: session_id={}, error={}", session_id, err);
        err
    })
}

#[tauri::command]
pub async fn pty_resize(
    pty_manager: tauri::State<'_, PtyManager>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    debug!(
        "pty_resize requested: session_id={}, cols={}, rows={}",
        session_id, cols, rows
    );
    pty_manager.resize(&session_id, cols, rows).map_err(|err| {
        error!("pty_resize failed: session_id={}, error={}", session_id, err);
        err
    })
}

#[tauri::command]
pub async fn pty_close(
    pty_manager: tauri::State<'_, PtyManager>,
    session_id: String,
) -> Result<(), String> {
    debug!("pty_close requested: session_id={}", session_id);
    pty_manager.close(&session_id).map_err(|err| {
        error!("pty_close failed: session_id={}, error={}", session_id, err);
        err
    })
}

#[tauri::command]
pub async fn pty_status(
    pty_manager: tauri::State<'_, PtyManager>,
) -> Result<HashMap<String, PtyProcessStatus>, String> {
    debug!("pty_status requested");
    Ok(pty_manager.status_all())
}
