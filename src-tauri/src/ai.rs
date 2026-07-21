//! Local, free, private AI categorization via Ollama (on-device).
//!
//! Sends a quick-capture note to a local Ollama model and gets back a
//! structured category + enrichment. Nothing leaves the machine.

use std::time::Duration;

use serde_json::{json, Value};

const SYSTEM_PROMPT: &str = r#"You are a categorization assistant for a personal work and career journal. Classify the user's quick note into exactly one category and enrich it.

Categories:
- "win": an accomplishment or brag-worthy moment (shipped/launched something, led an effort, spoke at or attended a notable industry event, received recognition).
- "task": something the user still needs to do (an action item or todo).
- "event": a dated happening to remember (a meeting, trip, or personal/work milestone date).
- "goal": a longer-term development or career goal.
- "feedback": feedback or praise the user received from someone.
- "milestone": a concrete step on the path toward a promotion.

Respond ONLY with a JSON object of exactly this shape:
{"category":"win|task|event|goal|feedback|milestone","title":"concise title, max ~10 words","details":"1-2 sentences of helpful context, or an empty string","size":"small|medium|large or null (wins only)","tags":["lowercase","keywords"]}"#;

/// Categorize + enrich a note using a local Ollama model. Returns the parsed
/// JSON suggestion, or an error the frontend can fall back from.
#[tauri::command]
pub async fn ai_categorize(
    text: String,
    model: String,
    endpoint: String,
) -> Result<Value, String> {
    let base = endpoint.trim().trim_end_matches('/');
    let url = format!("{base}/api/chat");
    let body = json!({
        "model": model,
        "stream": false,
        "format": "json",
        "options": { "temperature": 0.2 },
        "messages": [
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": text },
        ],
    });

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Could not reach Ollama at {base}: {e}"))?;

    let status = resp.status();
    let raw = resp.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!("Ollama returned {}: {}", status.as_u16(), raw));
    }

    // Chat response shape: { "message": { "content": "<json string>" }, ... }
    let parsed: Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    let content = parsed
        .get("message")
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .ok_or_else(|| "Unexpected Ollama response shape".to_string())?;

    serde_json::from_str::<Value>(content)
        .map_err(|e| format!("Model did not return valid JSON: {e}"))
}
