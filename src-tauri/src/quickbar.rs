use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{webview::Color, AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

static RETURN_TO_MAIN: AtomicBool = AtomicBool::new(false);

fn dismiss_quickbar(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("quickbar") {
        let _ = window.close();
    }

    if RETURN_TO_MAIN.swap(false, Ordering::SeqCst) {
        #[cfg(target_os = "macos")]
        let _ = app.show();
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.show();
            let _ = main.unminimize();
            let _ = main.set_focus();
        }
    } else {
        #[cfg(target_os = "macos")]
        let _ = app.hide();
    }
}

fn toggle_quickbar(app: AppHandle) {
    let handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        if handle.get_webview_window("quickbar").is_some() {
            dismiss_quickbar(&handle);
            return;
        }

        let return_to_main = handle
            .get_webview_window("main")
            .map(|main| {
                let active = main.is_visible().unwrap_or(false)
                    && main.is_focused().unwrap_or(false);
                if !active {
                    let _ = main.hide();
                }
                active
            })
            .unwrap_or(false);
        RETURN_TO_MAIN.store(return_to_main, Ordering::SeqCst);

        #[cfg(target_os = "macos")]
        let _ = handle.show();

        if let Err(error) = WebviewWindowBuilder::new(
            &handle,
            "quickbar",
            WebviewUrl::App("quickbar.html".into()),
        )
        .title("Quick Capture")
        .inner_size(640.0, 380.0)
        .center()
        .focused(true)
        .background_color(Color(0, 0, 0, 0))
        .initialization_script(
            "document.documentElement.style.backgroundColor = 'transparent';",
        )
        .resizable(false)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .build()
        {
            eprintln!("failed to create quickbar: {error}");
            dismiss_quickbar(&handle);
        }
    });
}

#[tauri::command]
pub fn set_quickbar_shortcut(
    app: AppHandle,
    accelerator: String,
) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|error| error.to_string())?;

    let handle = app.clone();
    app.global_shortcut()
        .on_shortcut(accelerator.as_str(), move |_app, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                toggle_quickbar(handle.clone());
            }
        })
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn dismiss_quickbar_window(app: AppHandle) {
    dismiss_quickbar(&app);
}

#[tauri::command]
pub fn show_main_app(app: AppHandle) {
    RETURN_TO_MAIN.store(false, Ordering::SeqCst);
    if let Some(window) = app.get_webview_window("quickbar") {
        let _ = window.close();
    }
    #[cfg(target_os = "macos")]
    let _ = app.show();
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.unminimize();
        let _ = main.set_focus();
    }
}
