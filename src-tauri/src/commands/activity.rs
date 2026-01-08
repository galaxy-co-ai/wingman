//! Activity and File Watcher Commands
//!
//! Commands for file watching and activity feed management.

use std::path::PathBuf;
use tauri::{AppHandle, State};
use serde::Serialize;
use sqlx::Row;

use crate::error::AppError;
use crate::state::AppState;

/// Activity entry from database
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEntry {
    pub id: String,
    pub session_id: String,
    pub path: String,
    pub operation: String,
    pub source: String,
    pub timestamp: String,
}

/// Start watching a directory for file changes
#[tauri::command]
pub async fn file_watcher_start(
    app: AppHandle,
    state: State<'_, AppState>,
    session_id: String,
    path: String,
    ignore_patterns: Option<Vec<String>>,
) -> Result<(), AppError> {
    let path = PathBuf::from(&path);

    state.file_watcher
        .start_watching(app, session_id, path, ignore_patterns)
        .await
}

/// Stop watching for a session
#[tauri::command]
pub async fn file_watcher_stop(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), AppError> {
    state.file_watcher
        .stop_watching(&session_id)
        .await
}

/// Get activity entries for a session
#[tauri::command]
pub async fn activity_get(
    state: State<'_, AppState>,
    session_id: String,
    filter: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<ActivityEntry>, AppError> {
    let limit = limit.unwrap_or(100);
    let offset = offset.unwrap_or(0);

    // Build query based on filter
    let rows = if let Some(ref op_filter) = filter {
        if op_filter == "all" {
            sqlx::query(
                r#"
                SELECT id, session_id, path, operation, source, timestamp
                FROM activity_log
                WHERE session_id = ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
                "#
            )
            .bind(&session_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.db)
            .await?
        } else {
            sqlx::query(
                r#"
                SELECT id, session_id, path, operation, source, timestamp
                FROM activity_log
                WHERE session_id = ? AND operation = ?
                ORDER BY timestamp DESC
                LIMIT ? OFFSET ?
                "#
            )
            .bind(&session_id)
            .bind(op_filter)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.db)
            .await?
        }
    } else {
        sqlx::query(
            r#"
            SELECT id, session_id, path, operation, source, timestamp
            FROM activity_log
            WHERE session_id = ?
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?
            "#
        )
        .bind(&session_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    // Map rows to ActivityEntry
    let entries: Vec<ActivityEntry> = rows
        .iter()
        .map(|row| ActivityEntry {
            id: row.get("id"),
            session_id: row.get("session_id"),
            path: row.get("path"),
            operation: row.get("operation"),
            source: row.get("source"),
            timestamp: row.get("timestamp"),
        })
        .collect();

    Ok(entries)
}

/// Clear activity for a session
#[tauri::command]
pub async fn activity_clear(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), AppError> {
    sqlx::query("DELETE FROM activity_log WHERE session_id = ?")
        .bind(&session_id)
        .execute(&state.db)
        .await?;

    Ok(())
}

/// Save an activity entry to the database
#[tauri::command]
pub async fn activity_save(
    state: State<'_, AppState>,
    session_id: String,
    path: String,
    operation: String,
    source: String,
) -> Result<String, AppError> {
    let id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO activity_log (id, session_id, path, operation, source, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
        "#
    )
    .bind(&id)
    .bind(&session_id)
    .bind(&path)
    .bind(&operation)
    .bind(&source)
    .bind(&timestamp)
    .execute(&state.db)
    .await?;

    Ok(id)
}

/// Record that Claude modified a file (for source attribution)
/// Call this when Claude uses a file-writing tool (Write, Edit, etc.)
#[tauri::command]
pub async fn file_watcher_record_claude_write(
    state: State<'_, AppState>,
    session_id: String,
    path: String,
) -> Result<(), AppError> {
    state.file_watcher
        .record_claude_modification(&session_id, &path)
        .await;
    Ok(()
    )
}
