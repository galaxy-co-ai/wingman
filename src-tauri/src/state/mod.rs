//! Application State Module
//!
//! Manages the global application state shared across commands.

pub mod app_state;
pub mod file_watcher;

pub use app_state::*;
// Re-export file watcher types that are used externally
#[allow(unused_imports)]
pub use file_watcher::FileWatcherManager;
