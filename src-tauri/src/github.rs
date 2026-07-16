//! Read-only GitHub integration (github.com, classic PAT).
//!
//! The token is read from the OS keychain here so it never reaches the webview.
//! Uses GraphQL for the contribution calendar and REST for PR search + events.

use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, AUTHORIZATION};
use serde_json::{json, Value};

pub const GITHUB_TOKEN_ACCOUNT: &str = "github_token";
const API: &str = "https://api.github.com";
const GRAPHQL: &str = "https://api.github.com/graphql";

const CONTRIB_QUERY: &str = r#"query {
  viewer {
    login
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}"#;

fn client(token: &str) -> Result<reqwest::Client, String> {
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {token}")).map_err(|e| e.to_string())?,
    );
    headers.insert(ACCEPT, HeaderValue::from_static("application/vnd.github+json"));
    headers.insert(
        "X-GitHub-Api-Version",
        HeaderValue::from_static("2022-11-28"),
    );
    reqwest::Client::builder()
        .user_agent("career-os/0.1")
        .default_headers(headers)
        .build()
        .map_err(|e| e.to_string())
}

/// GitHub sets `X-GitHub-SSO` when results are hidden or blocked because the
/// token isn't authorized for a SAML/enterprise org.
fn sso_header(resp: &reqwest::Response) -> Option<String> {
    resp.headers()
        .get("x-github-sso")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

async fn get_json(
    client: &reqwest::Client,
    url: String,
) -> Result<(Value, Option<String>), String> {
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("GitHub request failed: {e}"))?;
    let sso = sso_header(&resp);
    let status = resp.status();
    let text = resp.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        let hint = if status.as_u16() == 401 {
            " (check your token)"
        } else {
            ""
        };
        return Err(format!("GitHub {}{hint}: {}", status.as_u16(), text));
    }
    Ok((serde_json::from_str(&text).map_err(|e| e.to_string())?, sso))
}

async fn search_prs(
    client: &reqwest::Client,
    q: &str,
) -> Result<(Value, Option<String>), String> {
    let resp = client
        .get(format!("{API}/search/issues"))
        .query(&[("q", q), ("per_page", "30"), ("sort", "updated")])
        .send()
        .await
        .map_err(|e| format!("GitHub search failed: {e}"))?;
    let sso = sso_header(&resp);
    let status = resp.status();
    let text = resp.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!("GitHub search {}: {}", status.as_u16(), text));
    }
    Ok((serde_json::from_str(&text).map_err(|e| e.to_string())?, sso))
}

/// Fetches the user's contribution calendar, PR lists (authored / reviewed /
/// commented) and recent events. Returns raw JSON for the frontend to map.
#[tauri::command]
pub async fn github_sync(user: String) -> Result<Value, String> {
    let token = crate::secrets::read_secret(GITHUB_TOKEN_ACCOUNT)?
        .ok_or_else(|| "No GitHub token saved. Add one in Settings.".to_string())?;
    let user = user.trim().to_string();
    let client = client(&token)?;

    // GraphQL: contribution calendar + the authenticated user's login.
    let contrib_resp = client
        .post(GRAPHQL)
        .json(&json!({ "query": CONTRIB_QUERY }))
        .send()
        .await
        .map_err(|e| format!("GitHub GraphQL failed: {e}"))?;
    let cstatus = contrib_resp.status();
    let sso_gql = sso_header(&contrib_resp);
    let ctext = contrib_resp.text().await.map_err(|e| e.to_string())?;
    if !cstatus.is_success() {
        return Err(format!("GitHub GraphQL {}: {}", cstatus.as_u16(), ctext));
    }
    let contributions: Value = serde_json::from_str(&ctext).map_err(|e| e.to_string())?;
    if let Some(errors) = contributions.get("errors").and_then(|e| e.as_array()) {
        if !errors.is_empty() {
            return Err(format!(
                "GitHub GraphQL error: {}",
                Value::Array(errors.clone())
            ));
        }
    }

    // Prefer the authenticated login so a mistyped username still works.
    let login = contributions
        .pointer("/data/viewer/login")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let who = if !login.is_empty() { login } else { user };
    if who.is_empty() {
        return Err("Could not determine your GitHub username. Set it in Settings.".into());
    }

    let (authored, sso1) = search_prs(&client, &format!("type:pr author:{who}")).await?;
    let (reviewed, sso2) = search_prs(&client, &format!("type:pr reviewed-by:{who}")).await?;
    let (commented, sso3) =
        search_prs(&client, &format!("type:pr commenter:{who}")).await?;
    let (events, sso4) =
        get_json(&client, format!("{API}/users/{who}/events?per_page=30")).await?;

    let sso = sso_gql.or(sso1).or(sso2).or(sso3).or(sso4);

    Ok(json!({
        "login": who,
        "sso": sso,
        "contributions": contributions,
        "authored": authored,
        "reviewed": reviewed,
        "commented": commented,
        "events": events,
    }))
}
