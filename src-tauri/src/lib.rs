mod ai;
mod github;
mod jira;
mod secrets;

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Schema is authored in Drizzle (src/db/schema.ts); `drizzle-kit generate`
    // emits the SQL embedded below. tauri-plugin-sql applies pending migrations
    // when the database is first loaded from the frontend.
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/0000_unique_prodigy.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "github_feedback_oneonone_and_brag_links",
            sql: include_str!("../migrations/0001_naive_norman_osborn.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add_sort_indexes",
            sql: include_str!("../migrations/0002_pink_scarlet_witch.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "inbox_items_and_brag_size",
            sql: include_str!("../migrations/0003_sudden_secret_warriors.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "links_daily_notes_and_tags",
            sql: include_str!("../migrations/0004_fluffy_synch.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "drop_vision_items",
            sql: include_str!("../migrations/0005_typical_stingray.sql"),
            kind: MigrationKind::Up,
        },
    ];

    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:career_os.db", migrations)
                .build(),
        );

    // Desktop-only plugins.
    #[cfg(desktop)]
    {
        builder = builder
            .plugin(tauri_plugin_updater::Builder::new().build())
            .plugin(tauri_plugin_global_shortcut::Builder::new().build());
    }

    // The global quick-bar shortcut is registered from the frontend (so it's
    // user-configurable in Settings); the plugin above just exposes the API.
    builder
        .invoke_handler(tauri::generate_handler![
            secrets::set_secret,
            secrets::has_secret,
            secrets::delete_secret,
            jira::jira_fetch_issues,
            github::github_sync,
            ai::ai_categorize,
            hide_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Hide the whole app (macOS), returning focus to the previously-active app.
/// Used when the quick bar is dismissed so it doesn't reveal the main window.
#[tauri::command]
fn hide_app(app: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let _ = app.hide();
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = &app;
    }
}
