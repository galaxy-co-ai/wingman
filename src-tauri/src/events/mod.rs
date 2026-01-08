//! Backend Event Emission Module
//!
//! Handles emitting events to the frontend.

use tauri::{AppHandle, Emitter};
use serde::Serialize;

/// Event names matching the frontend EVENTS constant
#[allow(dead_code)]
pub mod event_names {
    pub const CLAUDE_OUTPUT: &str = "claude_output";
    pub const CLAUDE_STATUS: &str = "claude_status";
    pub const CLAUDE_ERROR: &str = "claude_error";
    pub const FILE_CHANGED: &str = "file_changed";
    pub const SESSION_SAVED: &str = "session_saved";
    pub const THEME_CHANGED: &str = "theme_changed";
    pub const UPDATE_AVAILABLE: &str = "update_available";
    pub const UPDATE_PROGRESS: &str = "update_progress";
}

/// Emit an event to all windows
pub fn emit_event<T: Serialize + Clone>(app: &AppHandle, event: &str, payload: T) -> Result<(), tauri::Error> {
    app.emit(event, payload)
}

/// Claude output event payload
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeOutputPayload {
    pub session_id: String,
    pub message_id: String,
    pub chunk: String,
    pub is_complete: bool,
}

/// Claude status event payload
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeStatusPayload {
    pub session_id: String,
    pub status: String,
    pub error: Option<String>,
}

/// File changed event payload
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileChangedPayload {
    pub session_id: String,
    pub path: String,
    pub operation: String,
    pub source: String,
    pub timestamp: String,
}
