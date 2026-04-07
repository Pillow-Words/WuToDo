use tauri::{
    Emitter,
    Manager,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    menu::{Menu, MenuItem},
    AppHandle, State,
};
use std::sync::{Arc, Mutex};
use serde::{Serialize, Deserialize};
use base64::{Engine as _, engine::general_purpose};

// Jira 相关结构体
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct JiraConfig {
    pub base_url: String,
    pub username: String,
    pub password: String,
    pub project_key: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct JiraIssue {
    pub id: String,
    pub summary: String,
    pub status: String,
    pub status_category: String,
    pub project_key: String,
    pub url: String,
    pub updated_at: String,
}

// 轮询状态管理
pub struct JiraPollState {
    pub config: Arc<Mutex<Option<JiraConfig>>>,
    pub running: Arc<Mutex<bool>>,
}

impl JiraPollState {
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(None)),
            running: Arc::new(Mutex::new(false)),
        }
    }
}

// 获取 Jira 工单
#[tauri::command]
async fn fetch_jira_issues(config: JiraConfig) -> Result<Vec<JiraIssue>, String> {
    let auth = format!("{}:{}", config.username, config.password);
    let encoded = general_purpose::STANDARD.encode(auth.as_bytes());

    let jql = if config.project_key.trim().is_empty() {
        "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC".to_string()
    } else {
        format!(
            "project = {} AND assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC",
            config.project_key.trim()
        )
    };

    let client = reqwest::Client::new();
    let url = format!("{}/rest/api/2/search", config.base_url.trim_end_matches('/'));

    println!("[Jira] 请求 URL: {}", url);
    println!("[Jira] JQL: {}", jql);

    let response = client
        .get(&url)
        .header("Authorization", format!("Basic {}", encoded))
        .header("Accept", "application/json")
        .query(&[
            ("jql", jql.as_str()),
            ("maxResults", "50"),
            ("fields", "summary,status,updated"),
        ])
        .send()
        .await
        .map_err(|e| format!("网络错误: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("请求失败 ({}): {}", status.as_u16(), status.canonical_reason().unwrap_or("Unknown")));
    }

    let data: serde_json::Value = response.json().await.map_err(|e| format!("解析错误: {}", e))?;
    let total = data.get("total").and_then(|v| v.as_u64()).unwrap_or(0);
    println!("[Jira] 查询成功，返回 {} 条工单", total);

    let issues = data.get("issues").and_then(|v| v.as_array()).ok_or("响应格式错误")?;

    let mut result = Vec::new();
    for issue in issues {
        let key = issue.get("key").and_then(|v| v.as_str()).unwrap_or("");
        let fields = issue.get("fields").unwrap_or(&serde_json::Value::Null);
        let summary = fields.get("summary").and_then(|v| v.as_str()).unwrap_or("");
        let status_obj = fields.get("status").unwrap_or(&serde_json::Value::Null);
        let status_name = status_obj.get("name").and_then(|v| v.as_str()).unwrap_or("");
        let status_category = status_obj
            .get("statusCategory")
            .and_then(|v| v.get("key"))
            .and_then(|v| v.as_str())
            .unwrap_or("indeterminate");
        let updated = fields.get("updated").and_then(|v| v.as_str()).unwrap_or("");

        // 映射状态类别
        let category = match status_category {
            "new" | "to-do" | "indeterminate" => "todo",
            "in-progress" => "in_progress",
            "done" => "done",
            _ => "todo",
        };

        // 从 key 中提取项目 key (如 "PROJ-123" -> "PROJ")
        let project_key = key.split('-').next().unwrap_or("").to_string();

        let issue_url = format!("{}/browse/{}", config.base_url.trim_end_matches('/'), key);

        result.push(JiraIssue {
            id: key.to_string(),
            summary: summary.to_string(),
            status: status_name.to_string(),
            status_category: category.to_string(),
            project_key,
            url: issue_url,
            updated_at: updated.to_string(),
        });
    }

    Ok(result)
}

// 启动轮询
#[tauri::command]
fn start_jira_poll(
    app: AppHandle,
    state: State<'_, JiraPollState>,
    config: JiraConfig,
    interval_sec: u32,
) {
    // 停止之前的轮询
    {
        let mut running = state.running.lock().unwrap();
        *running = false;
    }

    // 保存新配置
    {
        let mut cfg = state.config.lock().unwrap();
        *cfg = Some(config.clone());
    }

    // 标记为运行中
    {
        let mut running = state.running.lock().unwrap();
        *running = true;
    }

    println!("[Jira] 轮询已启动，间隔 {} 秒", interval_sec);

    let running = state.running.clone();
    let config_arc = state.config.clone();

    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(interval_sec as u64));

        loop {
            interval.tick().await;

            // 检查是否应该继续运行
            {
                let is_running = running.lock().unwrap();
                if !*is_running {
                    break;
                }
            }

            // 获取当前配置
            let cfg = {
                let cfg_guard = config_arc.lock().unwrap();
                cfg_guard.clone()
            };

            if let Some(cfg) = cfg {
                match fetch_jira_issues(cfg).await {
                    Ok(issues) => {
                        println!("[Jira] 轮询成功，发送 {} 条工单到前端", issues.len());
                        let _ = app.emit("jira-issues-updated", issues);
                    }
                    Err(e) => {
                        eprintln!("[Jira] 轮询错误: {}", e);
                    }
                }
            }
        }
    });
}

// 停止轮询
#[tauri::command]
fn stop_jira_poll(state: State<'_, JiraPollState>) {
    let mut running = state.running.lock().unwrap();
    *running = false;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(JiraPollState::new())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            fetch_jira_issues,
            start_jira_poll,
            stop_jira_poll,
        ])
        .setup(|app| {
            // Build tray menu
            let show_item = MenuItem::with_id(app, "show", "显示面板", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Create tray icon
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("WuToDo")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(panel) = app.get_webview_window("panel") {
                            let _ = panel.show();
                            let _ = panel.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(panel) = app.get_webview_window("panel") {
                            let _ = panel.show();
                            let _ = panel.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Position windows at top-right of primary monitor
            let trigger_window = app.get_webview_window("trigger").unwrap();
            let panel_window = app.get_webview_window("panel").unwrap();

            // Use primary_monitor from app handle for reliable detection
            let monitor = app.primary_monitor()
                .ok().flatten()
                .or_else(|| app.available_monitors().ok().and_then(|m| m.into_iter().next()));

            if let Some(monitor) = monitor {
                let screen_size = monitor.size();
                let scale = monitor.scale_factor();
                let screen_w = screen_size.width as f64 / scale;

                let trigger_height = 6.0;
                let trigger_width = 200.0;
                let panel_width = 360.0;
                let panel_height = 500.0;

                // Trigger: top edge of screen, right-aligned
                let _ = trigger_window.set_position(tauri::LogicalPosition::new(
                    screen_w - trigger_width,
                    0.0,
                ));
                let _ = trigger_window.set_size(tauri::LogicalSize::new(
                    trigger_width,
                    trigger_height,
                ));
                let _ = trigger_window.show();

                // Panel: below trigger, right-aligned
                let _ = panel_window.set_position(tauri::LogicalPosition::new(
                    screen_w - panel_width,
                    0.0,
                ));
                let _ = panel_window.set_size(tauri::LogicalSize::new(
                    panel_width,
                    panel_height,
                ));
                // Panel starts hidden, shown on trigger hover
            } else {
                // Fallback
                let _ = trigger_window.set_position(tauri::LogicalPosition::new(1720.0, 0.0));
                let _ = trigger_window.set_size(tauri::LogicalSize::new(200.0, 10.0));
                let _ = trigger_window.show();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
