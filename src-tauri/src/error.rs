//! Application Error Types
//!
//! Defines the error types used throughout the application.
//! All errors are serializable for sending to the frontend.

use serde::Serialize;
use thiserror::Error;

/// Error codes matching the frontend ErrorCode type
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
#[allow(dead_code)]
pub enum ErrorCode {
    // General
    Unknown,
    NotFound,
    InvalidInput,
    PermissionDenied,

    // Claude CLI
    ClaudeCliNotFound,
    ClaudeCliError,
    ClaudeCliTimeout,
    ClaudeCliAuthRequired,

    // Database
    DatabaseError,
    DatabaseConstraint,
    DatabaseNotFound,

    // File System
    FileNotFound,
    FileAccessDenied,
    FileAlreadyExists,
    DirectoryNotFound,

    // Network
    NetworkError,
    Timeout,
}

/// Application error structure
#[derive(Debug, Error, Serialize)]
#[error("{message}")]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

impl AppError {
    /// Create a new AppError
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: None,
        }
    }

    /// Create a new AppError with details
    pub fn with_details(code: ErrorCode, message: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: Some(details.into()),
        }
    }

    // Convenience constructors

    #[allow(dead_code)]
    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::NotFound, message)
    }

    pub fn invalid_input(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::InvalidInput, message)
    }

    pub fn database(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::DatabaseError, message)
    }

    pub fn database_not_found(entity: &str, id: &str) -> Self {
        Self::new(
            ErrorCode::DatabaseNotFound,
            format!("{} with id '{}' not found", entity, id),
        )
    }

    pub fn claude_cli_not_found() -> Self {
        Self::new(
            ErrorCode::ClaudeCliNotFound,
            "Claude CLI is not installed or not in PATH",
        )
    }

    pub fn claude_cli_error(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::ClaudeCliError, message)
    }

    pub fn file_not_found(path: impl Into<String>) -> Self {
        Self::with_details(
            ErrorCode::FileNotFound,
            "File not found",
            path,
        )
    }

    pub fn directory_not_found(path: impl Into<String>) -> Self {
        Self::with_details(
            ErrorCode::DirectoryNotFound,
            "Directory not found",
            path,
        )
    }
}

// Implement From for common error types

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => Self::new(ErrorCode::DatabaseNotFound, "Record not found"),
            sqlx::Error::Database(db_err) => {
                if db_err.is_unique_violation() || db_err.is_foreign_key_violation() {
                    Self::with_details(
                        ErrorCode::DatabaseConstraint,
                        "Database constraint violation",
                        db_err.to_string(),
                    )
                } else {
                    Self::with_details(ErrorCode::DatabaseError, "Database error", db_err.to_string())
                }
            }
            _ => Self::with_details(ErrorCode::DatabaseError, "Database error", err.to_string()),
        }
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        use std::io::ErrorKind;
        match err.kind() {
            ErrorKind::NotFound => Self::new(ErrorCode::FileNotFound, "File not found"),
            ErrorKind::PermissionDenied => Self::new(ErrorCode::FileAccessDenied, "Permission denied"),
            ErrorKind::AlreadyExists => Self::new(ErrorCode::FileAlreadyExists, "File already exists"),
            _ => Self::with_details(ErrorCode::Unknown, "IO error", err.to_string()),
        }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        Self::with_details(ErrorCode::InvalidInput, "JSON parsing error", err.to_string())
    }
}
