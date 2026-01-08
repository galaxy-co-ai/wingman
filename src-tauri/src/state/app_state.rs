//! Application State
//!
//! Centralized application state accessible from all commands.

use sqlx::SqlitePool;

use crate::claude::CliManager;
use super::file_watcher::FileWatcherManager;

/// Claude CLI process status
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
#[serde(rename_all = "lowercase")]
#[allow(dead_code)]
pub enum ClaudeStatus {
    Starting,
    Ready,
    Busy,
    Stopped,
    Error,
}

/// Application state shared across all commands
pub struct AppState {
    /// Database connection pool
    pub db: SqlitePool,
    /// CLI process manager
    pub cli_manager: CliManager,
    /// File watcher manager
    pub file_watcher: FileWatcherManager,
}

impl AppState {
    /// Create new application state
    pub fn new(db: SqlitePool) -> Self {
        Self {
            db,
            cli_manager: CliManager::new(),
            file_watcher: FileWatcherManager::new(),
        }
    }

    /// Get the status of a CLI session
    pub async fn get_cli_status(&self, session_id: &str) -> ClaudeStatus {
        self.cli_manager.get_status(session_id).await
    }
}
