//! Project Commands
//!
//! Commands for managing projects, milestones, sprints, and tasks.

use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::State;

use crate::error::AppError;
use crate::state::AppState;

// ============================================================================
// Request/Response Types
// ============================================================================

/// Project response
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectResponse {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub root_path: String,
    pub preview_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Milestone response
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MilestoneResponse {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub target_date: Option<String>,
    pub status: String,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

/// Sprint response
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SprintResponse {
    pub id: String,
    pub project_id: String,
    pub milestone_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Task response
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskResponse {
    pub id: String,
    pub project_id: String,
    pub sprint_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub estimated_hours: Option<f64>,
    pub created_at: String,
    pub updated_at: String,
}

/// Sprint with progress stats
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SprintWithProgressResponse {
    #[serde(flatten)]
    pub sprint: SprintResponse,
    pub task_count: i32,
    pub completed_count: i32,
    pub progress: f64,
}

/// Dashboard stats response
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardStatsResponse {
    pub active_sprint: Option<SprintWithProgressResponse>,
    pub tasks_completed_today: i32,
    pub total_tasks: i32,
    pub completed_tasks: i32,
    pub next_milestone: Option<MilestoneResponse>,
}

// ============================================================================
// Project Commands
// ============================================================================

/// Create a new project
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectCreateRequest {
    pub name: String,
    pub description: Option<String>,
    pub root_path: String,
    pub preview_url: Option<String>,
}

#[tauri::command]
pub async fn project_create(
    state: State<'_, AppState>,
    request: ProjectCreateRequest,
) -> Result<ProjectResponse, AppError> {
    // Validate name
    if request.name.trim().is_empty() {
        return Err(AppError::invalid_input("Project name cannot be empty"));
    }

    // Validate root path
    let dir_path = Path::new(&request.root_path);
    if !dir_path.is_absolute() {
        return Err(AppError::invalid_input("Root path must be an absolute path"));
    }
    if !dir_path.exists() {
        return Err(AppError::directory_not_found(&request.root_path));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO projects (id, name, description, root_path, preview_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.root_path)
    .bind(&request.preview_url)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await?;

    Ok(ProjectResponse {
        id,
        name: request.name,
        description: request.description,
        root_path: request.root_path,
        preview_url: request.preview_url,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// Get all projects
#[tauri::command]
pub async fn project_get_all(
    state: State<'_, AppState>,
) -> Result<Vec<ProjectResponse>, AppError> {
    let projects = sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, String, String)>(
        r#"
        SELECT id, name, description, root_path, preview_url, created_at, updated_at
        FROM projects
        ORDER BY updated_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await?;

    Ok(projects
        .into_iter()
        .map(|p| ProjectResponse {
            id: p.0,
            name: p.1,
            description: p.2,
            root_path: p.3,
            preview_url: p.4,
            created_at: p.5,
            updated_at: p.6,
        })
        .collect())
}

/// Get a single project
#[tauri::command]
pub async fn project_get(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<ProjectResponse, AppError> {
    let project = sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, String, String)>(
        r#"
        SELECT id, name, description, root_path, preview_url, created_at, updated_at
        FROM projects
        WHERE id = ?
        "#,
    )
    .bind(&project_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::database_not_found("Project", &project_id))?;

    Ok(ProjectResponse {
        id: project.0,
        name: project.1,
        description: project.2,
        root_path: project.3,
        preview_url: project.4,
        created_at: project.5,
        updated_at: project.6,
    })
}

/// Update a project
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectUpdateRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub root_path: Option<String>,
    pub preview_url: Option<String>,
}

#[tauri::command]
pub async fn project_update(
    state: State<'_, AppState>,
    project_id: String,
    request: ProjectUpdateRequest,
) -> Result<ProjectResponse, AppError> {
    // Build update query dynamically
    let now = chrono::Utc::now().to_rfc3339();

    // Fetch current values first
    let current = sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, String, String)>(
        "SELECT id, name, description, root_path, preview_url, created_at, updated_at FROM projects WHERE id = ?",
    )
    .bind(&project_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::database_not_found("Project", &project_id))?;

    let name = request.name.unwrap_or(current.1);
    let description = request.description.or(current.2);
    let root_path = request.root_path.unwrap_or(current.3);
    let preview_url = request.preview_url.or(current.4);

    // Validate
    if name.trim().is_empty() {
        return Err(AppError::invalid_input("Project name cannot be empty"));
    }

    sqlx::query(
        r#"
        UPDATE projects
        SET name = ?, description = ?, root_path = ?, preview_url = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&name)
    .bind(&description)
    .bind(&root_path)
    .bind(&preview_url)
    .bind(&now)
    .bind(&project_id)
    .execute(&state.db)
    .await?;

    Ok(ProjectResponse {
        id: project_id,
        name,
        description,
        root_path,
        preview_url,
        created_at: current.5,
        updated_at: now,
    })
}

/// Delete a project
#[tauri::command]
pub async fn project_delete(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(&project_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::database_not_found("Project", &project_id));
    }

    Ok(())
}

// ============================================================================
// Milestone Commands
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MilestoneCreateRequest {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub target_date: Option<String>,
}

#[tauri::command]
pub async fn milestone_create(
    state: State<'_, AppState>,
    request: MilestoneCreateRequest,
) -> Result<MilestoneResponse, AppError> {
    if request.name.trim().is_empty() {
        return Err(AppError::invalid_input("Milestone name cannot be empty"));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Get max sort_order for this project
    let max_order: Option<i32> = sqlx::query_scalar(
        "SELECT MAX(sort_order) FROM milestones WHERE project_id = ?",
    )
    .bind(&request.project_id)
    .fetch_one(&state.db)
    .await?;

    let sort_order = max_order.unwrap_or(0) + 1;

    sqlx::query(
        r#"
        INSERT INTO milestones (id, project_id, name, description, target_date, status, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'planned', ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.project_id)
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.target_date)
    .bind(sort_order)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await?;

    Ok(MilestoneResponse {
        id,
        project_id: request.project_id,
        name: request.name,
        description: request.description,
        target_date: request.target_date,
        status: "planned".to_string(),
        sort_order,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// Get all milestones for a project
#[tauri::command]
pub async fn milestone_get_all(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<MilestoneResponse>, AppError> {
    let milestones = sqlx::query_as::<_, (String, String, String, Option<String>, Option<String>, String, i32, String, String)>(
        r#"
        SELECT id, project_id, name, description, target_date, status, sort_order, created_at, updated_at
        FROM milestones
        WHERE project_id = ?
        ORDER BY sort_order ASC
        "#,
    )
    .bind(&project_id)
    .fetch_all(&state.db)
    .await?;

    Ok(milestones
        .into_iter()
        .map(|m| MilestoneResponse {
            id: m.0,
            project_id: m.1,
            name: m.2,
            description: m.3,
            target_date: m.4,
            status: m.5,
            sort_order: m.6,
            created_at: m.7,
            updated_at: m.8,
        })
        .collect())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MilestoneUpdateRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub target_date: Option<String>,
    pub status: Option<String>,
}

#[tauri::command]
pub async fn milestone_update(
    state: State<'_, AppState>,
    milestone_id: String,
    request: MilestoneUpdateRequest,
) -> Result<MilestoneResponse, AppError> {
    let now = chrono::Utc::now().to_rfc3339();

    let current = sqlx::query_as::<_, (String, String, String, Option<String>, Option<String>, String, i32, String, String)>(
        "SELECT id, project_id, name, description, target_date, status, sort_order, created_at, updated_at FROM milestones WHERE id = ?",
    )
    .bind(&milestone_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::database_not_found("Milestone", &milestone_id))?;

    let name = request.name.unwrap_or(current.2);
    let description = request.description.or(current.3);
    let target_date = request.target_date.or(current.4);
    let status = request.status.unwrap_or(current.5);

    // Validate status
    if !["planned", "in_progress", "completed"].contains(&status.as_str()) {
        return Err(AppError::invalid_input("Invalid milestone status"));
    }

    sqlx::query(
        r#"
        UPDATE milestones
        SET name = ?, description = ?, target_date = ?, status = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&name)
    .bind(&description)
    .bind(&target_date)
    .bind(&status)
    .bind(&now)
    .bind(&milestone_id)
    .execute(&state.db)
    .await?;

    Ok(MilestoneResponse {
        id: milestone_id,
        project_id: current.1,
        name,
        description,
        target_date,
        status,
        sort_order: current.6,
        created_at: current.7,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn milestone_delete(
    state: State<'_, AppState>,
    milestone_id: String,
) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM milestones WHERE id = ?")
        .bind(&milestone_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::database_not_found("Milestone", &milestone_id));
    }

    Ok(())
}

#[tauri::command]
pub async fn milestone_reorder(
    state: State<'_, AppState>,
    milestone_ids: Vec<String>,
) -> Result<(), AppError> {
    for (index, id) in milestone_ids.iter().enumerate() {
        sqlx::query("UPDATE milestones SET sort_order = ? WHERE id = ?")
            .bind(index as i32)
            .bind(id)
            .execute(&state.db)
            .await?;
    }

    Ok(())
}

// ============================================================================
// Sprint Commands
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SprintCreateRequest {
    pub project_id: String,
    pub milestone_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[tauri::command]
pub async fn sprint_create(
    state: State<'_, AppState>,
    request: SprintCreateRequest,
) -> Result<SprintResponse, AppError> {
    if request.name.trim().is_empty() {
        return Err(AppError::invalid_input("Sprint name cannot be empty"));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO sprints (id, project_id, milestone_id, name, description, start_date, end_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.project_id)
    .bind(&request.milestone_id)
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.start_date)
    .bind(&request.end_date)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await?;

    Ok(SprintResponse {
        id,
        project_id: request.project_id,
        milestone_id: request.milestone_id,
        name: request.name,
        description: request.description,
        start_date: request.start_date,
        end_date: request.end_date,
        status: "planned".to_string(),
        created_at: now.clone(),
        updated_at: now,
    })
}

/// Get all sprints for a project
#[tauri::command]
pub async fn sprint_get_all(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<SprintWithProgressResponse>, AppError> {
    let sprints = sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, Option<String>, Option<String>, String, String, String)>(
        r#"
        SELECT id, project_id, milestone_id, name, description, start_date, end_date, status, created_at, updated_at
        FROM sprints
        WHERE project_id = ?
        ORDER BY created_at ASC
        "#,
    )
    .bind(&project_id)
    .fetch_all(&state.db)
    .await?;

    let mut result = Vec::new();
    for s in sprints {
        // Get task counts
        let (task_count, completed_count): (i32, i32) = sqlx::query_as(
            r#"
            SELECT
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) as completed
            FROM tasks
            WHERE sprint_id = ?
            "#,
        )
        .bind(&s.0)
        .fetch_one(&state.db)
        .await?;

        let progress = if task_count > 0 {
            (completed_count as f64 / task_count as f64) * 100.0
        } else {
            0.0
        };

        result.push(SprintWithProgressResponse {
            sprint: SprintResponse {
                id: s.0,
                project_id: s.1,
                milestone_id: s.2,
                name: s.3,
                description: s.4,
                start_date: s.5,
                end_date: s.6,
                status: s.7,
                created_at: s.8,
                updated_at: s.9,
            },
            task_count,
            completed_count,
            progress,
        });
    }

    Ok(result)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SprintUpdateRequest {
    pub milestone_id: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: Option<String>,
}

#[tauri::command]
pub async fn sprint_update(
    state: State<'_, AppState>,
    sprint_id: String,
    request: SprintUpdateRequest,
) -> Result<SprintResponse, AppError> {
    let now = chrono::Utc::now().to_rfc3339();

    let current = sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, Option<String>, Option<String>, String, String, String)>(
        "SELECT id, project_id, milestone_id, name, description, start_date, end_date, status, created_at, updated_at FROM sprints WHERE id = ?",
    )
    .bind(&sprint_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::database_not_found("Sprint", &sprint_id))?;

    let milestone_id = request.milestone_id.or(current.2);
    let name = request.name.unwrap_or(current.3);
    let description = request.description.or(current.4);
    let start_date = request.start_date.or(current.5);
    let end_date = request.end_date.or(current.6);
    let status = request.status.unwrap_or(current.7);

    // Validate status
    if !["planned", "active", "completed"].contains(&status.as_str()) {
        return Err(AppError::invalid_input("Invalid sprint status"));
    }

    sqlx::query(
        r#"
        UPDATE sprints
        SET milestone_id = ?, name = ?, description = ?, start_date = ?, end_date = ?, status = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&milestone_id)
    .bind(&name)
    .bind(&description)
    .bind(&start_date)
    .bind(&end_date)
    .bind(&status)
    .bind(&now)
    .bind(&sprint_id)
    .execute(&state.db)
    .await?;

    Ok(SprintResponse {
        id: sprint_id,
        project_id: current.1,
        milestone_id,
        name,
        description,
        start_date,
        end_date,
        status,
        created_at: current.8,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn sprint_delete(
    state: State<'_, AppState>,
    sprint_id: String,
) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM sprints WHERE id = ?")
        .bind(&sprint_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::database_not_found("Sprint", &sprint_id));
    }

    Ok(())
}

// ============================================================================
// Task Commands
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskCreateRequest {
    pub project_id: String,
    pub sprint_id: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub estimated_hours: Option<f64>,
}

#[tauri::command]
pub async fn task_create(
    state: State<'_, AppState>,
    request: TaskCreateRequest,
) -> Result<TaskResponse, AppError> {
    if request.title.trim().is_empty() {
        return Err(AppError::invalid_input("Task title cannot be empty"));
    }

    let priority = request.priority.unwrap_or_else(|| "medium".to_string());
    if !["low", "medium", "high"].contains(&priority.as_str()) {
        return Err(AppError::invalid_input("Invalid task priority"));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO tasks (id, project_id, sprint_id, title, description, status, priority, estimated_hours, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'todo', ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.project_id)
    .bind(&request.sprint_id)
    .bind(&request.title)
    .bind(&request.description)
    .bind(&priority)
    .bind(&request.estimated_hours)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await?;

    Ok(TaskResponse {
        id,
        project_id: request.project_id,
        sprint_id: request.sprint_id,
        title: request.title,
        description: request.description,
        status: "todo".to_string(),
        priority,
        estimated_hours: request.estimated_hours,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// Get all tasks for a project
#[tauri::command]
pub async fn task_get_all(
    state: State<'_, AppState>,
    project_id: String,
    sprint_id: Option<String>,
) -> Result<Vec<TaskResponse>, AppError> {
    let tasks = if let Some(sid) = sprint_id {
        sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, String, String, Option<f64>, String, String)>(
            r#"
            SELECT id, project_id, sprint_id, title, description, status, priority, estimated_hours, created_at, updated_at
            FROM tasks
            WHERE project_id = ? AND sprint_id = ?
            ORDER BY created_at ASC
            "#,
        )
        .bind(&project_id)
        .bind(&sid)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, String, String, Option<f64>, String, String)>(
            r#"
            SELECT id, project_id, sprint_id, title, description, status, priority, estimated_hours, created_at, updated_at
            FROM tasks
            WHERE project_id = ?
            ORDER BY created_at ASC
            "#,
        )
        .bind(&project_id)
        .fetch_all(&state.db)
        .await?
    };

    Ok(tasks
        .into_iter()
        .map(|t| TaskResponse {
            id: t.0,
            project_id: t.1,
            sprint_id: t.2,
            title: t.3,
            description: t.4,
            status: t.5,
            priority: t.6,
            estimated_hours: t.7,
            created_at: t.8,
            updated_at: t.9,
        })
        .collect())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskUpdateRequest {
    pub sprint_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub estimated_hours: Option<f64>,
}

#[tauri::command]
pub async fn task_update(
    state: State<'_, AppState>,
    task_id: String,
    request: TaskUpdateRequest,
) -> Result<TaskResponse, AppError> {
    let now = chrono::Utc::now().to_rfc3339();

    let current = sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, String, String, Option<f64>, String, String)>(
        "SELECT id, project_id, sprint_id, title, description, status, priority, estimated_hours, created_at, updated_at FROM tasks WHERE id = ?",
    )
    .bind(&task_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::database_not_found("Task", &task_id))?;

    let sprint_id = request.sprint_id.or(current.2);
    let title = request.title.unwrap_or(current.3);
    let description = request.description.or(current.4);
    let status = request.status.unwrap_or(current.5);
    let priority = request.priority.unwrap_or(current.6);
    let estimated_hours = request.estimated_hours.or(current.7);

    // Validate
    if !["todo", "in_progress", "done"].contains(&status.as_str()) {
        return Err(AppError::invalid_input("Invalid task status"));
    }
    if !["low", "medium", "high"].contains(&priority.as_str()) {
        return Err(AppError::invalid_input("Invalid task priority"));
    }

    sqlx::query(
        r#"
        UPDATE tasks
        SET sprint_id = ?, title = ?, description = ?, status = ?, priority = ?, estimated_hours = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&sprint_id)
    .bind(&title)
    .bind(&description)
    .bind(&status)
    .bind(&priority)
    .bind(&estimated_hours)
    .bind(&now)
    .bind(&task_id)
    .execute(&state.db)
    .await?;

    Ok(TaskResponse {
        id: task_id,
        project_id: current.1,
        sprint_id,
        title,
        description,
        status,
        priority,
        estimated_hours,
        created_at: current.8,
        updated_at: now,
    })
}

/// Move a task to a different sprint
#[tauri::command]
pub async fn task_move(
    state: State<'_, AppState>,
    task_id: String,
    sprint_id: Option<String>,
) -> Result<(), AppError> {
    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query(
        "UPDATE tasks SET sprint_id = ?, updated_at = ? WHERE id = ?",
    )
    .bind(&sprint_id)
    .bind(&now)
    .bind(&task_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::database_not_found("Task", &task_id));
    }

    Ok(())
}

#[tauri::command]
pub async fn task_delete(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM tasks WHERE id = ?")
        .bind(&task_id)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::database_not_found("Task", &task_id));
    }

    Ok(())
}

// ============================================================================
// Task Dependencies Commands
// ============================================================================

#[tauri::command]
pub async fn task_add_dependency(
    state: State<'_, AppState>,
    task_id: String,
    depends_on_task_id: String,
) -> Result<(), AppError> {
    // Prevent self-dependency
    if task_id == depends_on_task_id {
        return Err(AppError::invalid_input("A task cannot depend on itself"));
    }

    sqlx::query(
        "INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_task_id) VALUES (?, ?)",
    )
    .bind(&task_id)
    .bind(&depends_on_task_id)
    .execute(&state.db)
    .await?;

    Ok(())
}

#[tauri::command]
pub async fn task_remove_dependency(
    state: State<'_, AppState>,
    task_id: String,
    depends_on_task_id: String,
) -> Result<(), AppError> {
    sqlx::query(
        "DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_task_id = ?",
    )
    .bind(&task_id)
    .bind(&depends_on_task_id)
    .execute(&state.db)
    .await?;

    Ok(())
}

#[tauri::command]
pub async fn task_get_dependencies(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<Vec<String>, AppError> {
    let deps: Vec<(String,)> = sqlx::query_as(
        "SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?",
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await?;

    Ok(deps.into_iter().map(|d| d.0).collect())
}

// ============================================================================
// Dashboard Commands
// ============================================================================

#[tauri::command]
pub async fn dashboard_stats(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<DashboardStatsResponse, AppError> {
    // Get active sprint
    let active_sprint = sqlx::query_as::<_, (String, String, Option<String>, String, Option<String>, Option<String>, Option<String>, String, String, String)>(
        r#"
        SELECT id, project_id, milestone_id, name, description, start_date, end_date, status, created_at, updated_at
        FROM sprints
        WHERE project_id = ? AND status = 'active'
        LIMIT 1
        "#,
    )
    .bind(&project_id)
    .fetch_optional(&state.db)
    .await?;

    let active_sprint_response = if let Some(s) = active_sprint {
        let (task_count, completed_count): (i32, i32) = sqlx::query_as(
            r#"
            SELECT
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) as completed
            FROM tasks
            WHERE sprint_id = ?
            "#,
        )
        .bind(&s.0)
        .fetch_one(&state.db)
        .await?;

        let progress = if task_count > 0 {
            (completed_count as f64 / task_count as f64) * 100.0
        } else {
            0.0
        };

        Some(SprintWithProgressResponse {
            sprint: SprintResponse {
                id: s.0,
                project_id: s.1,
                milestone_id: s.2,
                name: s.3,
                description: s.4,
                start_date: s.5,
                end_date: s.6,
                status: s.7,
                created_at: s.8,
                updated_at: s.9,
            },
            task_count,
            completed_count,
            progress,
        })
    } else {
        None
    };

    // Get tasks completed today
    let today_start = chrono::Utc::now()
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc()
        .to_rfc3339();

    let tasks_completed_today: (i32,) = sqlx::query_as(
        r#"
        SELECT COUNT(*) FROM tasks
        WHERE project_id = ? AND status = 'done' AND updated_at >= ?
        "#,
    )
    .bind(&project_id)
    .bind(&today_start)
    .fetch_one(&state.db)
    .await?;

    // Get total task counts
    let (total_tasks, completed_tasks): (i32, i32) = sqlx::query_as(
        r#"
        SELECT
            COUNT(*) as total,
            COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) as completed
        FROM tasks
        WHERE project_id = ?
        "#,
    )
    .bind(&project_id)
    .fetch_one(&state.db)
    .await?;

    // Get next milestone
    let next_milestone = sqlx::query_as::<_, (String, String, String, Option<String>, Option<String>, String, i32, String, String)>(
        r#"
        SELECT id, project_id, name, description, target_date, status, sort_order, created_at, updated_at
        FROM milestones
        WHERE project_id = ? AND status != 'completed'
        ORDER BY sort_order ASC
        LIMIT 1
        "#,
    )
    .bind(&project_id)
    .fetch_optional(&state.db)
    .await?;

    let next_milestone_response = next_milestone.map(|m| MilestoneResponse {
        id: m.0,
        project_id: m.1,
        name: m.2,
        description: m.3,
        target_date: m.4,
        status: m.5,
        sort_order: m.6,
        created_at: m.7,
        updated_at: m.8,
    });

    Ok(DashboardStatsResponse {
        active_sprint: active_sprint_response,
        tasks_completed_today: tasks_completed_today.0,
        total_tasks,
        completed_tasks,
        next_milestone: next_milestone_response,
    })
}
