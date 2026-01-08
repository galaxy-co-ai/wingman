//! File Watcher Module
//!
//! Cross-platform file system watching with debouncing and source attribution.

use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher, Event, EventKind};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, RwLock, Mutex};
use tauri::AppHandle;

use crate::error::AppError;
use crate::events::{emit_event, event_names, FileChangedPayload};

/// Default debounce duration in milliseconds
const DEBOUNCE_MS: u64 = 100;

/// Attribution window - changes within this time of CLI write are attributed to Claude
const ATTRIBUTION_WINDOW_MS: u64 = 2000;

/// Default ignore patterns
const DEFAULT_IGNORE_PATTERNS: &[&str] = &[
    ".git",
    "node_modules",
    ".next",
    "target",
    "dist",
    "build",
    ".DS_Store",
    "Thumbs.db",
    "*.swp",
    "*.swo",
    "*~",
    ".idea",
    ".vscode",
    "__pycache__",
    ".pytest_cache",
    "*.pyc",
    ".cargo",
];

/// File operation types
#[derive(Debug, Clone, PartialEq)]
pub enum FileOperation {
    Created,
    Modified,
    Deleted,
}

impl FileOperation {
    pub fn as_str(&self) -> &'static str {
        match self {
            FileOperation::Created => "created",
            FileOperation::Modified => "modified",
            FileOperation::Deleted => "deleted",
        }
    }
}

/// Source attribution for file changes
#[derive(Debug, Clone, PartialEq)]
pub enum ChangeSource {
    Claude,
    External,
}

impl ChangeSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            ChangeSource::Claude => "claude",
            ChangeSource::External => "external",
        }
    }
}

/// Tracks files recently modified by Claude for source attribution
pub struct SourceTracker {
    /// Map of file path to last modification time by Claude
    claude_modifications: HashMap<String, Instant>,
    /// Attribution window duration
    window: Duration,
}

impl SourceTracker {
    fn new() -> Self {
        Self {
            claude_modifications: HashMap::new(),
            window: Duration::from_millis(ATTRIBUTION_WINDOW_MS),
        }
    }

    /// Record that Claude modified a file
    pub fn record_claude_modification(&mut self, path: &str) {
        self.claude_modifications.insert(path.to_string(), Instant::now());
    }

    /// Determine the source of a file change
    pub fn determine_source(&mut self, path: &str) -> ChangeSource {
        let now = Instant::now();

        // Clean up old entries
        self.claude_modifications.retain(|_, timestamp| {
            now.duration_since(*timestamp) < self.window
        });

        // Check if Claude recently modified this file
        if let Some(timestamp) = self.claude_modifications.remove(path) {
            if now.duration_since(timestamp) < self.window {
                return ChangeSource::Claude;
            }
        }

        ChangeSource::External
    }
}

/// Watcher state for a single session
struct WatcherState {
    /// The notify watcher
    _watcher: RecommendedWatcher,
    /// Root path being watched (kept for potential future use)
    _root_path: PathBuf,
}

/// Internal event for the event loop
struct FileEvent {
    session_id: String,
    path: PathBuf,
    operation: FileOperation,
    root_path: PathBuf,
}

/// Shared state that can be accessed across async boundaries
struct SharedState {
    /// Source attribution tracker per session
    source_trackers: RwLock<HashMap<String, SourceTracker>>,
}

impl SharedState {
    fn new() -> Self {
        Self {
            source_trackers: RwLock::new(HashMap::new()),
        }
    }
}

/// File watcher manager
pub struct FileWatcherManager {
    /// Active watchers keyed by session ID
    watchers: RwLock<HashMap<String, WatcherState>>,
    /// Shared state for async access
    shared: Arc<SharedState>,
    /// App handle for emitting events (set on first use)
    app_handle: Mutex<Option<AppHandle>>,
    /// Processing task handle
    processing_task: Mutex<Option<tokio::task::JoinHandle<()>>>,
    /// Event sender for processing
    event_tx: mpsc::Sender<FileEvent>,
    /// Event receiver (taken when processing starts)
    event_rx: Mutex<Option<mpsc::Receiver<FileEvent>>>,
}

impl FileWatcherManager {
    /// Create a new file watcher manager
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel(1000);

        Self {
            watchers: RwLock::new(HashMap::new()),
            shared: Arc::new(SharedState::new()),
            app_handle: Mutex::new(None),
            processing_task: Mutex::new(None),
            event_tx: tx,
            event_rx: Mutex::new(Some(rx)),
        }
    }

    /// Initialize with app handle (called on first watcher start)
    async fn ensure_initialized(&self, app: AppHandle) {
        let mut handle = self.app_handle.lock().await;
        if handle.is_none() {
            *handle = Some(app.clone());

            // Start the processing task
            let mut rx_guard = self.event_rx.lock().await;
            if let Some(rx) = rx_guard.take() {
                // Clone the shared state Arc for the async task
                let shared = Arc::clone(&self.shared);

                let mut task_guard = self.processing_task.lock().await;
                *task_guard = Some(tokio::spawn(async move {
                    Self::process_events(app, rx, shared).await;
                }));
            }
        }
    }

    /// Process file events
    async fn process_events(
        app: AppHandle,
        mut rx: mpsc::Receiver<FileEvent>,
        shared: Arc<SharedState>,
    ) {
        // Simple debouncing: collect events and emit after quiet period
        let mut pending: HashMap<(String, PathBuf), (FileOperation, PathBuf, Instant)> = HashMap::new();
        let debounce_duration = Duration::from_millis(DEBOUNCE_MS);

        loop {
            // Check for new events with timeout
            match tokio::time::timeout(Duration::from_millis(50), rx.recv()).await {
                Ok(Some(event)) => {
                    pending.insert(
                        (event.session_id, event.path),
                        (event.operation, event.root_path, Instant::now())
                    );
                }
                Ok(None) => break, // Channel closed
                Err(_) => {
                    // Timeout - check for events ready to emit
                }
            }

            // Emit events that have been debounced
            let now = Instant::now();
            let ready: Vec<_> = pending
                .iter()
                .filter(|(_, (_, _, time))| now.duration_since(*time) >= debounce_duration)
                .map(|((session_id, path), (op, root, _))| (session_id.clone(), path.clone(), op.clone(), root.clone()))
                .collect();

            for (session_id, path, operation, _root_path) in ready {
                pending.remove(&(session_id.clone(), path.clone()));

                // Determine source attribution
                let source = {
                    let mut trackers = shared.source_trackers.write().await;
                    let tracker = trackers.entry(session_id.clone()).or_insert_with(SourceTracker::new);
                    tracker.determine_source(path.to_string_lossy().as_ref())
                };

                // Emit the file changed event
                let payload = FileChangedPayload {
                    session_id: session_id.clone(),
                    path: path.to_string_lossy().to_string(),
                    operation: operation.as_str().to_string(),
                    source: source.as_str().to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                };

                if let Err(e) = emit_event(&app, event_names::FILE_CHANGED, payload) {
                    log::error!("Failed to emit file_changed event: {}", e);
                }
            }
        }
    }

    /// Start watching a directory for a session
    pub async fn start_watching(
        &self,
        app: AppHandle,
        session_id: String,
        path: PathBuf,
        ignore_patterns: Option<Vec<String>>,
    ) -> Result<(), AppError> {
        // Ensure initialized
        self.ensure_initialized(app).await;

        // Validate path exists and is a directory
        if !path.exists() {
            return Err(AppError::directory_not_found(path.to_string_lossy()));
        }
        if !path.is_dir() {
            return Err(AppError::invalid_input("Path must be a directory"));
        }

        // Combine default and custom ignore patterns
        let patterns: Vec<String> = DEFAULT_IGNORE_PATTERNS
            .iter()
            .map(|s| s.to_string())
            .chain(ignore_patterns.unwrap_or_default())
            .collect();

        // Create the watcher
        let session_id_clone = session_id.clone();
        let root_path = path.clone();
        let patterns_clone = patterns.clone();
        let tx = self.event_tx.clone();

        let watcher = RecommendedWatcher::new(
            move |result: Result<Event, notify::Error>| {
                if let Ok(event) = result {
                    let operation = match event.kind {
                        EventKind::Create(_) => Some(FileOperation::Created),
                        EventKind::Modify(_) => Some(FileOperation::Modified),
                        EventKind::Remove(_) => Some(FileOperation::Deleted),
                        _ => None,
                    };

                    if let Some(op) = operation {
                        for event_path in event.paths {
                            // Check ignore patterns
                            if Self::should_ignore(&event_path, &patterns_clone) {
                                continue;
                            }

                            // Only watch files, not directories (for modify/delete)
                            // For create, we can't always check if it's a dir yet
                            if matches!(op, FileOperation::Modified | FileOperation::Deleted)
                                && event_path.is_dir() {
                                continue;
                            }

                            // Send to processing task
                            let _ = tx.blocking_send(FileEvent {
                                session_id: session_id_clone.clone(),
                                path: event_path,
                                operation: op.clone(),
                                root_path: root_path.clone(),
                            });
                        }
                    }
                }
            },
            Config::default(),
        ).map_err(|e| AppError::new(crate::error::ErrorCode::Unknown, format!("Failed to create watcher: {}", e)))?;

        // Start watching
        let mut watcher = watcher;
        watcher.watch(&path, RecursiveMode::Recursive)
            .map_err(|e| AppError::new(crate::error::ErrorCode::Unknown, format!("Failed to watch directory: {}", e)))?;

        // Store the watcher state
        let state = WatcherState {
            _watcher: watcher,
            _root_path: path,
        };

        let mut watchers = self.watchers.write().await;
        watchers.insert(session_id.clone(), state);

        // Initialize source tracker for this session
        let mut trackers = self.shared.source_trackers.write().await;
        trackers.entry(session_id).or_insert_with(SourceTracker::new);

        log::info!("Started file watcher for session");

        Ok(())
    }

    /// Stop watching for a session
    pub async fn stop_watching(&self, session_id: &str) -> Result<(), AppError> {
        let mut watchers = self.watchers.write().await;
        watchers.remove(session_id);

        // Also clean up source tracker
        let mut trackers = self.shared.source_trackers.write().await;
        trackers.remove(session_id);

        log::info!("Stopped file watcher for session");

        Ok(())
    }

    /// Record that Claude modified a file (for source attribution)
    pub async fn record_claude_modification(&self, session_id: &str, path: &str) {
        let mut trackers = self.shared.source_trackers.write().await;
        if let Some(tracker) = trackers.get_mut(session_id) {
            tracker.record_claude_modification(path);
        }
    }

    /// Check if a path matches ignore patterns
    fn should_ignore(path: &Path, patterns: &[String]) -> bool {
        let path_str = path.to_string_lossy();

        for pattern in patterns {
            // Simple pattern matching
            if pattern.starts_with('*') {
                // Suffix match (e.g., *.swp)
                let suffix = &pattern[1..];
                if path_str.ends_with(suffix) {
                    return true;
                }
            } else if pattern.ends_with('*') {
                // Prefix match
                let prefix = &pattern[..pattern.len() - 1];
                if path_str.contains(prefix) {
                    return true;
                }
            } else {
                // Exact component match
                if path.components().any(|c| {
                    c.as_os_str().to_string_lossy() == pattern.as_str()
                }) {
                    return true;
                }
            }
        }

        false
    }

    /// Check if we're watching a specific session
    #[allow(dead_code)]
    pub async fn is_watching(&self, session_id: &str) -> bool {
        let watchers = self.watchers.read().await;
        watchers.contains_key(session_id)
    }
}

impl Default for FileWatcherManager {
    fn default() -> Self {
        Self::new()
    }
}
