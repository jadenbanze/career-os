//! Secure secret storage backed by the OS keychain (macOS Keychain via the
//! `apple-native` keyring backend). Used to keep the JIRA API token out of the
//! SQLite database and off the frontend.

use keyring::{Entry, Error as KeyringError};

const SERVICE: &str = "com.careeros.app";

fn entry(account: &str) -> Result<Entry, String> {
    Entry::new(SERVICE, account).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_secret(account: String, secret: String) -> Result<(), String> {
    entry(&account)?
        .set_password(&secret)
        .map_err(|e| e.to_string())
}

/// Returns whether a secret exists for the given account, without exposing it.
#[tauri::command]
pub fn has_secret(account: String) -> Result<bool, String> {
    match entry(&account)?.get_password() {
        Ok(_) => Ok(true),
        Err(KeyringError::NoEntry) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn delete_secret(account: String) -> Result<(), String> {
    match entry(&account)?.delete_credential() {
        Ok(_) | Err(KeyringError::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

/// Internal helper (not a command) for other modules to read a secret.
pub fn read_secret(account: &str) -> Result<Option<String>, String> {
    match entry(account)?.get_password() {
        Ok(s) => Ok(Some(s)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}
