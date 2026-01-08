//! Session Commands
//!
//! Commands for managing chat sessions and messages.

use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{AppHandle, State};

use crate::error::AppError;
use crate::state::AppState;

/// Request to create a new session
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionCreateRequest {
    pub working_directory: String,
    pub project_id: Option<String>,
    pub title: Option<String>,
}

/// Session data returned to frontend
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionResponse {
    pub id: String,
    pub title: String,
    pub working_directory: String,
    pub project_id: Option<String>,
    pub claude_status: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Message data returned to frontend
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageResponse {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub tool_usage: Option<serde_json::Value>,
    pub created_at: String,
}

/// Session with messages response
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionWithMessagesResponse {
    pub session: SessionResponse,
    pub messages: Vec<MessageResponse>,
}

/// Session summary for listing
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSummaryResponse {
    pub id: String,
    pub title: String,
    pub working_directory: String,
    pub project_id: Option<String>,
    pub project_name: Option<String>,
    pub message_count: i32,
    pub last_message: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Create a new session
#[tauri::command]
pub async fn session_create(
    state: State<'_, AppState>,
    request: SessionCreateRequest,
) -> Result<SessionResponse, AppError> {
    // Validate working directory
    let dir_path = Path::new(&request.working_directory);
    if !dir_path.is_absolute() {
        return Err(AppError::invalid_input("Working directory must be an absolute path"));
    }
    if !dir_path.exists() {
        return Err(AppError::directory_not_found(&request.working_directory));
    }

    // Generate ID and timestamps
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let title = request.title.unwrap_or_else(|| "New Session".to_string());

    // Insert into database
    sqlx::query(
        r#"
        INSERT INTO sessions (id, title, working_directory, project_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&title)
    .bind(&request.working_directory)
    .bind(&request.project_id)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await?;

    Ok(SessionResponse {
        id,
        title,
        working_directory: request.working_directory,
        project_id: request.project_id,
        claude_status: "stopped".to_string(),
        created_at: now.clone(),
        updated_at: now,
    })
}

/// Load a session with all its messages
#[tauri::command]
pub async fn session_load(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<SessionWithMessagesResponse, AppError> {
    // Load session
    let session = sqlx::query_as::<_, (String, String, String, Option<String>, String, String)>(
        r#"
        SELECT id, title, working_directory, project_id, created_at, updated_at
        FROM sessions
        WHERE id = ?
        "#,
    )
    .bind(&session_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::database_not_found("Session", &session_id))?;

    // Load messages
    let messages = sqlx::query_as::<_, (String, String, String, String, Option<String>, String)>(
        r#"
        SELECT id, session_id, role, content, tool_usage, created_at
        FROM messages
        WHERE session_id = ?
        ORDER BY created_at ASC
        "#,
    )
    .bind(&session_id)
    .fetch_all(&state.db)
    .await?;

    // Get current CLI status
    let status = state.get_cli_status(&session_id).await;

    Ok(SessionWithMessagesResponse {
        session: SessionResponse {
            id: session.0,
            title: session.1,
            working_directory: session.2,
            project_id: session.3,
            claude_status: format!("{:?}", status).to_lowercase(),
            created_at: session.4,
            updated_at: session.5,
        },
        messages: messages
            .into_iter()
            .map(|m| MessageResponse {
                id: m.0,
                session_id: m.1,
                role: m.2,
                content: m.3,
                tool_usage: m.4.and_then(|s| serde_json::from_str(&s).ok()),
                created_at: m.5,
            })
            .collect(),
    })
}

/// Start the Claude CLI for a session
#[tauri::command]
pub async fn session_start_cli(
    app: AppHandle,
    state: State<'_, AppState>,
    session_id: String,
    resume: Option<bool>,
) -> Result<(), AppError> {
    // Get session working directory
    let session = sqlx::query_as::<_, (String, String, String, Option<String>, String, String)>(
        r#"
        SELECT id, title, working_directory, project_id, created_at, updated_at
        FROM sessions
        WHERE id = ?
        "#,
    )
    .bind(&session_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::database_not_found("Session", &session_id))?;

    let working_dir = Path::new(&session.2);

    // Build resume context if requested
    let resume_context = if resume.unwrap_or(false) {
        // Load recent messages for context
        let messages = sqlx::query_as::<_, (String, String, String)>(
            r#"
            SELECT role, content, created_at
            FROM messages
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT 20
            "#,
        )
        .bind(&session_id)
        .fetch_all(&state.db)
        .await?;

        if !messages.is_empty() {
            let mut context = String::from("You are resuming a previous conversation. Here is the context:\n\n");
            for (role, content, _) in messages.iter().rev() {
                let label = if role == "user" { "User" } else { "Assistant" };
                let truncated = if content.len() > 500 {
                    format!("{}... [truncated]", &content[..500])
                } else {
                    content.clone()
                };
                context.push_str(&format!("{}: {}\n\n", label, truncated));
            }
            context.push_str("Continue the conversation from where it left off.\n");
            Some(context)
        } else {
            None
        }
    } else {
        None
    };

    // Start CLI
    state
        .cli_manager
        .start(app, session_id, working_dir, resume_context)
        .await
}

/// Stop the Claude CLI for a session
#[tauri::command]
pub async fn session_stop_cli(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), AppError> {
    state.cli_manager.stop(&session_id).await
}

/// Send a message to Claude
#[tauri::command]
pub async fn session_send_message(
    state: State<'_, AppState>,
    session_id: String,
    content: String,
) -> Result<String, AppError> {
    // Validate content
    if content.trim().is_empty() {
        return Err(AppError::invalid_input("Message content cannot be empty"));
    }

    // Check if CLI is running
    if !state.cli_manager.is_running(&session_id).await {
        return Err(AppError::claude_cli_error("CLI is not running for this session"));
    }

    // Generate message ID
    let message_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Store user message in database
    sqlx::query(
        r#"
        INSERT INTO messages (id, session_id, role, content, created_at)
        VALUES (?, ?, 'user', ?, ?)
        "#,
    )
    .bind(&message_id)
    .bind(&session_id)
    .bind(&content)
    .bind(&now)
    .execute(&state.db)
    .await?;

    // Update session updated_at
    sqlx::query(
        r#"
        UPDATE sessions SET updated_at = ? WHERE id = ?
        "#,
    )
    .bind(&now)
    .bind(&session_id)
    .execute(&state.db)
    .await?;

    // Send to CLI
    state.cli_manager.send_message(&session_id, &content).await?;

    Ok(message_id)
}

/// Cancel the current Claude response
#[tauri::command]
pub async fn session_cancel_response(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), AppError> {
    state.cli_manager.cancel(&session_id).await
}

/// Delete a session
#[tauri::command]
pub async fn session_delete(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), AppError> {
    // Stop CLI if running
    let _ = state.cli_manager.stop(&session_id).await;

    // Delete from database (messages will cascade)
    let result = sqlx::query("DELETE FROM sessions WHERE id = ?")
        .bind(&session_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::database_not_found("Session", &session_id));
    }

    Ok(())
}

/// Rename a session
#[tauri::command]
pub async fn session_rename(
    state: State<'_, AppState>,
    session_id: String,
    title: String,
) -> Result<(), AppError> {
    // Validate title
    if title.trim().is_empty() {
        return Err(AppError::invalid_input("Title cannot be empty"));
    }
    if title.len() > 100 {
        return Err(AppError::invalid_input("Title must be 100 characters or less"));
    }

    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query("UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?")
        .bind(&title)
        .bind(&now)
        .bind(&session_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::database_not_found("Session", &session_id));
    }

    Ok(())
}

/// List all sessions with message counts and last message preview
#[tauri::command]
pub async fn session_list(
    state: State<'_, AppState>,
    project_id: Option<String>,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<Vec<SessionSummaryResponse>, AppError> {
    let limit = limit.unwrap_or(50).min(200);
    let offset = offset.unwrap_or(0);

    // Query sessions with message count and last message using subqueries
    let query = if project_id.is_some() {
        r#"
        SELECT
            s.id,
            s.title,
            s.working_directory,
            s.project_id,
            s.created_at,
            s.updated_at,
            COALESCE((SELECT COUNT(*) FROM messages WHERE session_id = s.id), 0) as message_count,
            (SELECT content FROM messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM sessions s
        WHERE s.project_id = ?
        ORDER BY s.updated_at DESC
        LIMIT ? OFFSET ?
        "#
    } else {
        r#"
        SELECT
            s.id,
            s.title,
            s.working_directory,
            s.project_id,
            s.created_at,
            s.updated_at,
            COALESCE((SELECT COUNT(*) FROM messages WHERE session_id = s.id), 0) as message_count,
            (SELECT content FROM messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM sessions s
        ORDER BY s.updated_at DESC
        LIMIT ? OFFSET ?
        "#
    };

    let sessions = if let Some(proj_id) = project_id {
        sqlx::query_as::<_, (String, String, String, Option<String>, String, String, i32, Option<String>)>(query)
            .bind(&proj_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.db)
            .await?
    } else {
        sqlx::query_as::<_, (String, String, String, Option<String>, String, String, i32, Option<String>)>(query)
            .bind(limit)
            .bind(offset)
            .fetch_all(&state.db)
            .await?
    };

    Ok(sessions
        .into_iter()
        .map(|s| {
            // Truncate last message to 100 chars for preview
            let last_message = s.7.map(|msg| {
                if msg.len() > 100 {
                    format!("{}...", &msg[..100])
                } else {
                    msg
                }
            });

            SessionSummaryResponse {
                id: s.0,
                title: s.1,
                working_directory: s.2,
                project_id: s.3.clone(),
                project_name: None, // TODO: Join with projects table when implemented
                message_count: s.6,
                last_message,
                created_at: s.4,
                updated_at: s.5,
            }
        })
        .collect())
}

/// Save a message to the database
#[tauri::command]
pub async fn session_save_message(
    state: State<'_, AppState>,
    session_id: String,
    message_id: String,
    role: String,
    content: String,
    tool_usage: Option<serde_json::Value>,
) -> Result<(), AppError> {
    // Validate role
    if role != "user" && role != "assistant" {
        return Err(AppError::invalid_input("Role must be 'user' or 'assistant'"));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let tool_usage_str = tool_usage.map(|t| t.to_string());

    // Insert or update message (upsert)
    sqlx::query(
        r#"
        INSERT INTO messages (id, session_id, role, content, tool_usage, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            content = excluded.content,
            tool_usage = excluded.tool_usage
        "#,
    )
    .bind(&message_id)
    .bind(&session_id)
    .bind(&role)
    .bind(&content)
    .bind(&tool_usage_str)
    .bind(&now)
    .execute(&state.db)
    .await?;

    // Update session updated_at
    sqlx::query("UPDATE sessions SET updated_at = ? WHERE id = ?")
        .bind(&now)
        .bind(&session_id)
        .execute(&state.db)
        .await?;

    Ok(())
}
