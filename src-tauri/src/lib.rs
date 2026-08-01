use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::{fs, path::PathBuf, sync::Mutex};
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize};

const DEFAULT_HORIZONTAL_HEIGHT: f64 = 300.0;
const DEFAULT_VERTICAL_WIDTH: f64 = 580.0;

struct CssWatcher {
    _watcher: Mutex<RecommendedWatcher>,
}

#[derive(Default)]
struct DockState {
    edge: Option<String>,
    compact_mode: bool,
    normal_horizontal_height: Option<u32>,
    normal_vertical_width: Option<u32>,
    compact_horizontal_height: Option<u32>,
    compact_vertical_width: Option<u32>,
}

impl DockState {
    fn remember_current_size(&mut self, size: PhysicalSize<u32>) {
        let Some(edge) = self.edge.as_deref() else {
            return;
        };
        match (self.compact_mode, edge) {
            (true, "top" | "bottom") => self.compact_horizontal_height = Some(size.height),
            (true, "left" | "right") => self.compact_vertical_width = Some(size.width),
            (false, "top" | "bottom") => self.normal_horizontal_height = Some(size.height),
            (false, "left" | "right") => self.normal_vertical_width = Some(size.width),
            _ => {}
        }
    }

    fn remember_initial_size(
        &mut self,
        edge: &str,
        compact_mode: bool,
        size: PhysicalSize<u32>,
        monitor_size: PhysicalSize<u32>,
    ) {
        if self.edge.is_some() {
            return;
        }

        let spans_horizontal = size.width >= monitor_size.width.saturating_mul(9) / 10;
        let spans_vertical = size.height >= monitor_size.height.saturating_mul(9) / 10;
        match (compact_mode, edge) {
            (true, "top" | "bottom") if spans_horizontal => {
                self.compact_horizontal_height = Some(size.height)
            }
            (true, "left" | "right") if spans_vertical => {
                self.compact_vertical_width = Some(size.width)
            }
            (false, "top" | "bottom") if spans_horizontal => {
                self.normal_horizontal_height = Some(size.height)
            }
            (false, "left" | "right") if spans_vertical => {
                self.normal_vertical_width = Some(size.width)
            }
            _ => {}
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FilePayload {
    path: String,
    content: String,
}

fn custom_css_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|directory| directory.join("custom.css"))
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn load_custom_css(app: tauri::AppHandle) -> Result<FilePayload, String> {
    let path = custom_css_path(&app)?;
    let content = fs::read_to_string(&path).unwrap_or_default();
    Ok(FilePayload {
        path: path.to_string_lossy().into_owned(),
        content,
    })
}

#[tauri::command]
fn set_always_on_top(window: tauri::WebviewWindow, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn dock_window(
    window: tauri::WebviewWindow,
    dock_state: tauri::State<'_, Mutex<DockState>>,
    edge: String,
    compact_mode: bool,
    compact_label_chars: u32,
) -> Result<(), String> {
    let monitor = match window
        .current_monitor()
        .map_err(|error| error.to_string())?
    {
        Some(monitor) => monitor,
        None => window
            .primary_monitor()
            .map_err(|error| error.to_string())?
            .ok_or_else(|| "No monitor is available".to_string())?,
    };

    let origin = monitor.position();
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();
    let current_size = window.inner_size().map_err(|error| error.to_string())?;
    let horizontal_width = monitor_size.width;
    let default_horizontal_height = (DEFAULT_HORIZONTAL_HEIGHT * scale_factor).round() as u32;
    let default_vertical_width = (DEFAULT_VERTICAL_WIDTH * scale_factor).round() as u32;
    let default_compact_horizontal_height = (76.0 * scale_factor).round() as u32;
    let logical_compact_vertical_width =
        (72 + compact_label_chars.clamp(4, 40) * 7).clamp(116, 352);
    let default_compact_vertical_width =
        (logical_compact_vertical_width as f64 * scale_factor).round() as u32;

    let mut state = dock_state.lock().map_err(|error| error.to_string())?;
    state.remember_initial_size(&edge, compact_mode, current_size, *monitor_size);
    state.remember_current_size(current_size);

    let horizontal_height = if compact_mode {
        state
            .compact_horizontal_height
            .unwrap_or(default_compact_horizontal_height)
    } else {
        state
            .normal_horizontal_height
            .unwrap_or(default_horizontal_height)
    }
    .min(monitor_size.height);
    let vertical_width = if compact_mode {
        state
            .compact_vertical_width
            .unwrap_or(default_compact_vertical_width)
    } else {
        state
            .normal_vertical_width
            .unwrap_or(default_vertical_width)
    }
    .min(monitor_size.width);
    let vertical_height = monitor_size.height;

    state.edge = Some(edge.clone());
    state.compact_mode = compact_mode;
    drop(state);

    let (size, position) = match edge.as_str() {
        "top" => (
            PhysicalSize::new(horizontal_width, horizontal_height),
            PhysicalPosition::new(origin.x, origin.y),
        ),
        "bottom" => (
            PhysicalSize::new(horizontal_width, horizontal_height),
            PhysicalPosition::new(
                origin.x,
                origin.y + monitor_size.height as i32 - horizontal_height as i32,
            ),
        ),
        "left" => (
            PhysicalSize::new(vertical_width, vertical_height),
            PhysicalPosition::new(origin.x, origin.y),
        ),
        "right" => (
            PhysicalSize::new(vertical_width, vertical_height),
            PhysicalPosition::new(
                origin.x + monitor_size.width as i32 - vertical_width as i32,
                origin.y,
            ),
        ),
        _ => return Err(format!("Unsupported dock edge: {edge}")),
    };

    window
        .set_min_size(Some(PhysicalSize::new(80, 60)))
        .map_err(|error| error.to_string())?;
    window.set_size(size).map_err(|error| error.to_string())?;
    window
        .set_position(position)
        .map_err(|error| error.to_string())?;
    if !compact_mode {
        window
            .set_min_size(Some(PhysicalSize::new(280, 180)))
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let handle = app.handle().clone();
            let css_path = custom_css_path(&handle).map_err(std::io::Error::other)?;
            let config_dir = css_path
                .parent()
                .ok_or_else(|| std::io::Error::other("Invalid custom CSS path"))?
                .to_path_buf();
            fs::create_dir_all(&config_dir)?;
            if !css_path.exists() {
                fs::write(
                    &css_path,
                    "/* Timeline Timer overrides. This file hot reloads when saved. */\n:root {\n  /* Change the base RGB channels to update all derived shades. */\n  /* --accent-rgb: 216 242 107; */\n  /* --hud-rgb: 19 19 17; */\n}\n",
                )?;
            }

            let watched_css_path = css_path.clone();
            let event_handle = handle.clone();
            let mut watcher = notify::recommended_watcher(
                move |result: notify::Result<notify::Event>| {
                    let Ok(event) = result else { return };
                    if !event.paths.iter().any(|path| path == &watched_css_path) {
                        return;
                    }
                    if let Ok(css) = fs::read_to_string(&watched_css_path) {
                        let _ = event_handle.emit("custom-css-changed", css);
                    }
                },
            )?;
            watcher.watch(&config_dir, RecursiveMode::NonRecursive)?;
            app.manage(CssWatcher {
                _watcher: Mutex::new(watcher),
            });
            app.manage(Mutex::new(DockState::default()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            dock_window,
            load_custom_css,
            set_always_on_top
        ])
        .run(tauri::generate_context!())
        .expect("error while running Timeline Timer");
}
