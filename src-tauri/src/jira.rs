//! Read-only JIRA Cloud integration.
//!
//! The API token is read from the OS keychain here so it never crosses into the
//! webview/JS layer. Requests use HTTP Basic auth (email + API token), which is
//! the standard scheme for JIRA Cloud. On macOS, reqwest's native-tls backend
//! trusts the system keychain, so corporate root CAs work automatically.

/// Account name under which the JIRA API token is stored in the keychain.
pub const JIRA_TOKEN_ACCOUNT: &str = "jira_api_token";

fn normalize_site(site: &str) -> String {
    site.trim()
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_end_matches('/')
        .to_string()
}

/// Fetch issues matching a JQL query (defaults to issues assigned to the
/// authenticated user, most-recently-updated first). Returns the raw JIRA JSON
/// response so the frontend can map and cache it.
#[tauri::command]
pub async fn jira_fetch_issues(
    site: String,
    email: String,
    jql: Option<String>,
    max_results: Option<u32>,
) -> Result<serde_json::Value, String> {
    let token = crate::secrets::read_secret(JIRA_TOKEN_ACCOUNT)?
        .ok_or_else(|| "No JIRA API token saved. Add one in Settings.".to_string())?;

    let site = normalize_site(&site);
    if site.is_empty() {
        return Err("JIRA site is required (e.g. yourcompany.atlassian.net).".into());
    }
    if email.trim().is_empty() {
        return Err("JIRA email is required.".into());
    }

    let jql = jql.unwrap_or_else(|| "assignee = currentUser() ORDER BY updated DESC".to_string());
    let max_str = max_results.unwrap_or(50).to_string();
    let fields = "summary,status,priority,issuetype,assignee,project,updated";
    let url = format!("https://{site}/rest/api/3/search/jql");

    let client = reqwest::Client::builder()
        .user_agent("career-os/0.1")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .get(&url)
        .basic_auth(&email, Some(&token))
        .header("Accept", "application/json")
        .query(&[
            ("jql", jql.as_str()),
            ("maxResults", max_str.as_str()),
            ("fields", fields),
        ])
        .send()
        .await
        .map_err(|e| format!("Request to JIRA failed: {e}"))?;

    let status = resp.status();
    let body = resp.text().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        let hint = match status.as_u16() {
            401 => " (check your email + API token)",
            403 => " (token lacks permission, or CAPTCHA required)",
            404 => " (check the site URL / API path)",
            _ => "",
        };
        return Err(format!("JIRA returned {}{hint}: {}", status.as_u16(), body));
    }

    serde_json::from_str::<serde_json::Value>(&body)
        .map_err(|e| format!("Could not parse JIRA response: {e}"))
}
