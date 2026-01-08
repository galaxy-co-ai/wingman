//! IPC Command Handlers
//!
//! All Tauri commands are defined here and organized by domain.

pub mod activity;
pub mod project;
pub mod session;
pub mod system;

pub use activity::*;
pub use project::*;
pub use session::*;
pub use system::*;
