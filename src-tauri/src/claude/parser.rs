//! Claude CLI Output Parser
//!
//! Parses the NDJSON output from Claude CLI with --print flag.

use serde::Deserialize;
use serde_json::Value;

use crate::error::AppError;

/// Parsed Claude CLI event
#[derive(Debug)]
pub enum ClaudeEvent {
    /// Start of assistant response
    Assistant { message_id: Option<String> },
    /// Text delta (streaming content)
    TextDelta { text: String },
    /// Tool use event
    ToolUse { name: String, input: Value },
    /// Tool result event
    ToolResult { tool_use_id: String, content: String },
    /// Message complete
    MessageStop,
    /// Error event
    Error { message: String },
    /// Unknown/ignored event
    Unknown,
}

/// Raw event from Claude CLI
#[derive(Debug, Deserialize)]
struct RawEvent {
    #[serde(rename = "type")]
    event_type: String,
    #[serde(flatten)]
    data: Value,
}

/// Parse a single line of NDJSON output from Claude CLI
pub fn parse_claude_output(line: &str) -> Result<ClaudeEvent, AppError> {
    let raw: RawEvent = serde_json::from_str(line)
        .map_err(|e| AppError::claude_cli_error(format!("JSON parse error: {}", e)))?;

    match raw.event_type.as_str() {
        "assistant" => {
            // Start of assistant message
            let message_id = raw.data
                .get("message")
                .and_then(|m| m.get("id"))
                .and_then(|id| id.as_str())
                .map(|s| s.to_string());
            Ok(ClaudeEvent::Assistant { message_id })
        }

        "content_block_start" => {
            // Content block starting - we can ignore this
            Ok(ClaudeEvent::Unknown)
        }

        "content_block_delta" => {
            // Text delta
            if let Some(delta) = raw.data.get("delta") {
                if let Some(text) = delta.get("text").and_then(|t| t.as_str()) {
                    return Ok(ClaudeEvent::TextDelta {
                        text: text.to_string(),
                    });
                }
            }
            Ok(ClaudeEvent::Unknown)
        }

        "content_block_stop" => {
            // Content block ended - we can ignore this
            Ok(ClaudeEvent::Unknown)
        }

        "tool_use" => {
            // Tool being used
            let name = raw.data
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("unknown")
                .to_string();
            let input = raw.data.get("input").cloned().unwrap_or(Value::Null);
            Ok(ClaudeEvent::ToolUse { name, input })
        }

        "tool_result" => {
            // Tool result
            let tool_use_id = raw.data
                .get("tool_use_id")
                .and_then(|id| id.as_str())
                .unwrap_or("")
                .to_string();
            let content = raw.data
                .get("content")
                .and_then(|c| c.as_str())
                .unwrap_or("")
                .to_string();
            Ok(ClaudeEvent::ToolResult { tool_use_id, content })
        }

        "message_stop" => {
            // Message complete
            Ok(ClaudeEvent::MessageStop)
        }

        "message_delta" => {
            // Message metadata delta - we can ignore this
            Ok(ClaudeEvent::Unknown)
        }

        "message_start" => {
            // Message metadata start - we can ignore this
            Ok(ClaudeEvent::Unknown)
        }

        "error" => {
            // Error event
            let message = raw.data
                .get("error")
                .and_then(|e| e.get("message"))
                .and_then(|m| m.as_str())
                .unwrap_or("Unknown error")
                .to_string();
            Ok(ClaudeEvent::Error { message })
        }

        "ping" => {
            // Keep-alive ping - ignore
            Ok(ClaudeEvent::Unknown)
        }

        _ => {
            // Unknown event type
            log::debug!("Unknown CLI event type: {}", raw.event_type);
            Ok(ClaudeEvent::Unknown)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_text_delta() {
        let line = r#"{"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello "}}"#;
        let result = parse_claude_output(line).unwrap();
        match result {
            ClaudeEvent::TextDelta { text } => assert_eq!(text, "Hello "),
            _ => panic!("Expected TextDelta"),
        }
    }

    #[test]
    fn test_parse_message_stop() {
        let line = r#"{"type":"message_stop"}"#;
        let result = parse_claude_output(line).unwrap();
        assert!(matches!(result, ClaudeEvent::MessageStop));
    }

    #[test]
    fn test_parse_tool_use() {
        let line = r#"{"type":"tool_use","id":"123","name":"write_file","input":{"path":"test.txt"}}"#;
        let result = parse_claude_output(line).unwrap();
        match result {
            ClaudeEvent::ToolUse { name, input } => {
                assert_eq!(name, "write_file");
                assert_eq!(input.get("path").and_then(|p| p.as_str()), Some("test.txt"));
            }
            _ => panic!("Expected ToolUse"),
        }
    }

    #[test]
    fn test_parse_error() {
        let line = r#"{"type":"error","error":{"message":"Rate limited"}}"#;
        let result = parse_claude_output(line).unwrap();
        match result {
            ClaudeEvent::Error { message } => assert_eq!(message, "Rate limited"),
            _ => panic!("Expected Error"),
        }
    }
}
