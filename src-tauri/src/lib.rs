//! Wingman Tauri Backend
//!
//! This is the Rust backend for the Wingman application.

mod commands;
mod db;
mod error;
mod events;
mod state;
mod claude;

use state::AppState;
use tauri::Manager;

/// Initialize the application
async fn init_app() -> Result<AppState, error::AppError> {
    // Get the app data directory
    let data_dir = dirs::data_local_dir()
        .ok_or_else(|| error::AppError::new(
            error::ErrorCode::Unknown,
            "Could not determine app data directory",
        ))?
        .join("com.wingman.app");

    // Create database path
    let db_path = data_dir.join("wingman.db");

    // Initialize database
    let pool = db::create_pool(&db_path).await?;

    Ok(AppState::new(pool))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize app state asynchronously
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match init_app().await {
                    Ok(state) => {
                        handle.manage(state);
                        log::info!("Wingman initialized successfully");
                    }
                    Err(e) => {
                        log::error!("Failed to initialize Wingman: {}", e);
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // System commands
            commands::system_get_app_info,
            commands::system_check_cli,
            commands::system_open_external,
            commands::system_open_path,
            commands::system_select_directory,
            // Session commands
            commands::session_create,
            commands::session_load,
            commands::session_start_cli,
            commands::session_stop_cli,
            commands::session_send_message,
            commands::session_cancel_response,
            commands::session_delete,
            commands::session_rename,
            commands::session_list,
            commands::session_save_message,
            // Activity and file watcher commands
            commands::file_watcher_start,
            commands::file_watcher_stop,
            commands::file_watcher_record_claude_write,
            commands::activity_get,
            commands::activity_clear,
            commands::activity_save,
            // Project commands
            commands::project_create,
            commands::project_get_all,
            commands::project_get,
            commands::project_update,
            commands::project_delete,
            // Milestone commands
            commands::milestone_create,
            commands::milestone_get_all,
            commands::milestone_update,
            commands::milestone_delete,
            commands::milestone_reorder,
            // Sprint commands
            commands::sprint_create,
            commands::sprint_get_all,
            commands::sprint_update,
            commands::sprint_delete,
            // Task commands
            commands::task_create,
            commands::task_get_all,
            commands::task_update,
            commands::task_move,
            commands::task_delete,
            commands::task_add_dependency,
            commands::task_remove_dependency,
            commands::task_get_dependencies,
            // Dashboard commands
            commands::dashboard_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
