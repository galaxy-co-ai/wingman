//! System Commands
//!
//! Commands for system-level operations.

use serde::Serialize;
use tauri::AppHandle;

use crate::error::AppError;

/// Application info returned by system_get_app_info
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub version: String,
    pub name: String,
    pub tauri_version: String,
}

/// Get application information
#[tauri::command]
pub fn system_get_app_info(app: AppHandle) -> Result<AppInfo, AppError> {
    let config = app.config();

    Ok(AppInfo {
        version: config.version.clone().unwrap_or_else(|| "0.1.0".to_string()),
        name: config.product_name.clone().unwrap_or_else(|| "Wingman".to_string()),
        tauri_version: tauri::VERSION.to_string(),
    })
}

/// CLI status check result
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CliStatus {
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub error: Option<String>,
}

/// Check if Claude CLI is installed
#[tauri::command]
pub async fn system_check_cli() -> Result<CliStatus, AppError> {
    // Try to run `claude --version` to check if CLI is installed
    let output = tokio::process::Command::new("claude")
        .arg("--version")
        .output()
        .await;

    match output {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout)
                    .trim()
                    .to_string();

                // Try to find the path
                let path = which_claude().await;

                Ok(CliStatus {
                    installed: true,
                    version: Some(version),
                    path,
                    error: None,
                })
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                Ok(CliStatus {
                    installed: false,
                    version: None,
                    path: None,
                    error: Some(stderr),
                })
            }
        }
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                Ok(CliStatus {
                    installed: false,
                    version: None,
                    path: None,
                    error: Some("Claude CLI not found in PATH".to_string()),
                })
            } else {
                Ok(CliStatus {
                    installed: false,
                    version: None,
                    path: None,
                    error: Some(e.to_string()),
                })
            }
        }
    }
}

/// Try to find the path to the claude executable
async fn which_claude() -> Option<String> {
    #[cfg(windows)]
    let cmd = "where";
    #[cfg(not(windows))]
    let cmd = "which";

    let output = tokio::process::Command::new(cmd)
        .arg("claude")
        .output()
        .await
        .ok()?;

    if output.status.success() {
        Some(
            String::from_utf8_lossy(&output.stdout)
                .lines()
                .next()?
                .trim()
                .to_string(),
        )
    } else {
        None
    }
}

/// Open a URL in the default browser
#[tauri::command]
pub async fn system_open_external(url: String) -> Result<(), AppError> {
    open::that(&url).map_err(|e| {
        AppError::with_details(
            crate::error::ErrorCode::Unknown,
            "Failed to open URL",
            e.to_string(),
        )
    })
}

/// Open a file or folder in the system file manager
#[tauri::command]
pub async fn system_open_path(path: String) -> Result<(), AppError> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Err(AppError::file_not_found(path.display().to_string()));
    }

    // If it's a file, open its parent directory
    let target = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };

    open::that(target).map_err(|e| {
        AppError::with_details(
            crate::error::ErrorCode::Unknown,
            "Failed to open path",
            e.to_string(),
        )
    })
}

/// Open a directory picker dialog
#[tauri::command]
pub async fn system_select_directory(
    app: tauri::AppHandle,
    title: Option<String>,
) -> Result<Option<String>, AppError> {
    use tauri_plugin_dialog::DialogExt;

    let dialog = app.dialog().file();
    let dialog = if let Some(t) = title {
        dialog.set_title(t)
    } else {
        dialog.set_title("Select Directory")
    };

    let result = dialog.blocking_pick_folder();

    Ok(result.map(|p| p.to_string()))
}
