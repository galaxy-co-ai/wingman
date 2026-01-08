//! Claude CLI Process Management
//!
//! Handles spawning, communicating with, and terminating Claude CLI processes.

use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;
use std::sync::Arc;

use tauri::AppHandle;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::RwLock;

use crate::error::AppError;
use crate::events::{emit_event, event_names, ClaudeOutputPayload, ClaudeStatusPayload};
use crate::state::ClaudeStatus;

use super::parser::parse_claude_output;

/// Manages active CLI processes for sessions
pub struct CliManager {
    /// Map of session_id -> CLI process
    processes: Arc<RwLock<HashMap<String, CliProcess>>>,
}

/// A single CLI process instance
struct CliProcess {
    child: Child,
    status: ClaudeStatus,
}

impl CliManager {
    /// Create a new CLI manager
    pub fn new() -> Self {
        Self {
            processes: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Start a CLI process for a session
    pub async fn start(
        &self,
        app: AppHandle,
        session_id: String,
        working_dir: &Path,
        resume_context: Option<String>,
    ) -> Result<(), AppError> {
        // Check if already running
        {
            let processes = self.processes.read().await;
            if processes.contains_key(&session_id) {
                return Ok(());
            }
        }

        // Emit starting status
        emit_status(&app, &session_id, "starting");

        // Find Claude CLI in PATH
        let claude_path = which::which("claude").map_err(|_| AppError::claude_cli_not_found())?;

        // Build command
        let mut cmd = Command::new(claude_path);
        cmd.arg("--print")
            .current_dir(working_dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        // Spawn process
        let mut child = cmd
            .spawn()
            .map_err(|e| AppError::claude_cli_error(format!("Failed to spawn CLI: {}", e)))?;

        // Send resume context if provided
        if let Some(context) = resume_context {
            if let Some(stdin) = child.stdin.as_mut() {
                stdin
                    .write_all(context.as_bytes())
                    .await
                    .map_err(|e| AppError::claude_cli_error(format!("Failed to write context: {}", e)))?;
                stdin
                    .write_all(b"\n")
                    .await
                    .map_err(|e| AppError::claude_cli_error(format!("Failed to write: {}", e)))?;
            }
        }

        // Store process
        {
            let mut processes = self.processes.write().await;
            processes.insert(
                session_id.clone(),
                CliProcess {
                    child,
                    status: ClaudeStatus::Ready,
                },
            );
        }

        // Emit ready status
        emit_status(&app, &session_id, "ready");

        // Start output streaming in background
        let session_id_clone = session_id.clone();
        let app_clone = app.clone();
        let processes_clone = self.processes.clone();

        tokio::spawn(async move {
            stream_output(app_clone, session_id_clone, processes_clone).await;
        });

        Ok(())
    }

    /// Stop a CLI process for a session
    pub async fn stop(&self, session_id: &str) -> Result<(), AppError> {
        let mut processes = self.processes.write().await;
        if let Some(mut process) = processes.remove(session_id) {
            let _ = process.child.kill().await;
        }
        Ok(())
    }

    /// Send a message to the CLI process
    pub async fn send_message(&self, session_id: &str, content: &str) -> Result<(), AppError> {
        let mut processes = self.processes.write().await;
        if let Some(process) = processes.get_mut(session_id) {
            if let Some(stdin) = process.child.stdin.as_mut() {
                stdin
                    .write_all(content.as_bytes())
                    .await
                    .map_err(|e| AppError::claude_cli_error(format!("Failed to write: {}", e)))?;
                stdin
                    .write_all(b"\n")
                    .await
                    .map_err(|e| AppError::claude_cli_error(format!("Failed to write: {}", e)))?;
                stdin
                    .flush()
                    .await
                    .map_err(|e| AppError::claude_cli_error(format!("Failed to flush: {}", e)))?;

                process.status = ClaudeStatus::Busy;
                Ok(())
            } else {
                Err(AppError::claude_cli_error("CLI stdin not available"))
            }
        } else {
            Err(AppError::claude_cli_error("CLI not running for session"))
        }
    }

    /// Cancel an in-progress response (send interrupt signal)
    pub async fn cancel(&self, session_id: &str) -> Result<(), AppError> {
        let processes = self.processes.read().await;
        if let Some(process) = processes.get(session_id) {
            // Get process ID
            if let Some(_pid) = process.child.id() {
                // On Windows, we can't easily send SIGINT, so we'll just let it complete
                // For now, we'll mark it as ready
                // TODO: Implement proper cancellation on Windows
                #[cfg(unix)]
                {
                    use nix::sys::signal::{kill, Signal};
                    use nix::unistd::Pid;
                    let _ = kill(Pid::from_raw(_pid as i32), Signal::SIGINT);
                }

                #[cfg(windows)]
                {
                    // On Windows, we'll need to use a different approach
                    // For now, log a warning
                    log::warn!("Cancellation not fully supported on Windows");
                }
            }
        }
        Ok(())
    }

    /// Get the status of a CLI session
    pub async fn get_status(&self, session_id: &str) -> ClaudeStatus {
        let processes = self.processes.read().await;
        processes
            .get(session_id)
            .map(|p| p.status.clone())
            .unwrap_or(ClaudeStatus::Stopped)
    }

    /// Check if a session has an active CLI process
    pub async fn is_running(&self, session_id: &str) -> bool {
        let processes = self.processes.read().await;
        processes.contains_key(session_id)
    }
}

impl Default for CliManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Stream output from the CLI process
async fn stream_output(
    app: AppHandle,
    session_id: String,
    processes: Arc<RwLock<HashMap<String, CliProcess>>>,
) {
    // Take stdout from the process
    let stdout = {
        let mut procs = processes.write().await;
        if let Some(process) = procs.get_mut(&session_id) {
            process.child.stdout.take()
        } else {
            return;
        }
    };

    let Some(stdout) = stdout else {
        return;
    };

    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();

    let mut message_id = format!("msg-{}", uuid::Uuid::new_v4());
    let mut current_text = String::new();

    while let Ok(Some(line)) = lines.next_line().await {
        if line.is_empty() {
            continue;
        }

        // Parse the NDJSON line
        match parse_claude_output(&line) {
            Ok(event) => {
                match event {
                    super::parser::ClaudeEvent::Assistant { message_id: new_id } => {
                        // New message started
                        message_id = new_id.unwrap_or_else(|| format!("msg-{}", uuid::Uuid::new_v4()));
                        current_text.clear();
                    }
                    super::parser::ClaudeEvent::TextDelta { text } => {
                        current_text.push_str(&text);
                        let _ = emit_event(
                            &app,
                            event_names::CLAUDE_OUTPUT,
                            ClaudeOutputPayload {
                                session_id: session_id.clone(),
                                message_id: message_id.clone(),
                                chunk: text,
                                is_complete: false,
                            },
                        );
                    }
                    super::parser::ClaudeEvent::ToolUse { name, input } => {
                        // Emit tool use as a special chunk
                        // The frontend will parse this
                        log::debug!("Tool use: {} with {:?}", name, input);
                    }
                    super::parser::ClaudeEvent::ToolResult { tool_use_id, content } => {
                        // Tool result received
                        log::debug!("Tool result for {}: {}", tool_use_id, content);
                    }
                    super::parser::ClaudeEvent::MessageStop => {
                        // Message complete
                        let _ = emit_event(
                            &app,
                            event_names::CLAUDE_OUTPUT,
                            ClaudeOutputPayload {
                                session_id: session_id.clone(),
                                message_id: message_id.clone(),
                                chunk: String::new(),
                                is_complete: true,
                            },
                        );
                        emit_status(&app, &session_id, "ready");

                        // Update process status
                        let mut procs = processes.write().await;
                        if let Some(process) = procs.get_mut(&session_id) {
                            process.status = ClaudeStatus::Ready;
                        }
                    }
                    super::parser::ClaudeEvent::Error { message } => {
                        let _ = emit_event(
                            &app,
                            event_names::CLAUDE_ERROR,
                            serde_json::json!({
                                "sessionId": session_id,
                                "error": message,
                                "recoverable": true,
                            }),
                        );
                    }
                    super::parser::ClaudeEvent::Unknown => {
                        // Ignore unknown events
                    }
                }
            }
            Err(e) => {
                log::warn!("Failed to parse CLI output: {} - line: {}", e, line);
            }
        }
    }

    // Process ended - clean up
    {
        let mut procs = processes.write().await;
        procs.remove(&session_id);
    }

    emit_status(&app, &session_id, "stopped");
}

/// Emit a status event
fn emit_status(app: &AppHandle, session_id: &str, status: &str) {
    let _ = emit_event(
        app,
        event_names::CLAUDE_STATUS,
        ClaudeStatusPayload {
            session_id: session_id.to_string(),
            status: status.to_string(),
            error: None,
        },
    );
}
