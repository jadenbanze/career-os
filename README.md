<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="112" alt="Career OS" />
</p>

<h1 align="center">Career OS</h1>

<p align="center">
  A local-first desktop app to run your work &amp; career — capture fast, organize later, and build your promotion case over time.
</p>

<p align="center">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-local--first-003B57?logo=sqlite&logoColor=white" />
  <img alt="Platform" src="https://img.shields.io/badge/macOS-Apple%20Silicon%20%2B%20Intel-black?logo=apple&logoColor=white" />
</p>

---

**Career OS** keeps the scattered pieces of your work life in one fast, private place: your tasks, the wins you'll forget by review season, your development goals and promotion path, notes from 1:1s, and your GitHub/JIRA activity. It looks like Notion, runs like a native app, and everything stays **on your machine**.

Three ideas drive it:

- **Local-first & private.** All data lives in a local SQLite file. No account, no server, works offline. API tokens are stored in the OS keychain — never on disk or in git.
- **Lightweight.** A small, focused set of sections instead of a sprawling workspace.
- **Optional connections.** JIRA and GitHub are read-only, opt-in integrations — the app is fully useful without them.

## Features

- **Home** — a daily overview: focus tasks, upcoming dates, promotion progress, recent wins, and a daily journal.
- **Inbox with local AI** — capture anything in one keystroke; a local [Ollama](https://ollama.com) model categorizes and enriches it (win / task / event / goal / feedback), so you organize later. Free and private — nothing leaves your machine.
- **Global quick-capture bar** — a Raycast-style spotlight (global hotkey) to jot a thought or run a quick action without leaving what you're doing.
- **Tasks** — a kanban board with color-coded urgency, plus your assigned **JIRA** issues.
- **Brag Sheet** — log wins (with size + tags) and export a **promotion packet** (Markdown / print-to-PDF).
- **Growth** — development goals and your promotion milestones in one place.
- **Feedback** — 1:1 notes and feedback you've received; promote any of it into a win.
- **Activity** — your **GitHub** PRs, reviews, and a contribution/velocity graph.
- **Connections** — link any item to any other (Obsidian-style backlinks), browse by **Tags**, and see how it all connects in the **Graph**.
- **Timeline** + **calendar export** — important dates, exportable to Apple/Google Calendar via `.ics` (no API needed).
- **⌘K command palette**, signed **auto-updates**, light/dark themes.

## Install

**Download** the latest signed `.dmg` from [Releases](https://github.com/jadenbanze/career-os/releases) and drag Career OS to Applications. Installed copies **update themselves** automatically.

> First launch shows an "unidentified developer" prompt (the app isn't notarized): right-click → **Open**, or run `xattr -dr com.apple.quarantine "/Applications/career-os.app"`.

## Build from source

```bash
npm install
npm run tauri dev      # develop
npm run tauri build    # produce a .dmg / .app
```

**Prerequisites:** Node ≥ 22.12, [Rust](https://rustup.rs) (stable), and (macOS) Xcode Command Line Tools. If `cargo` isn't found: `. "$HOME/.cargo/env"`.

## Integrations (optional)

Configure in **Settings** — both are read-only and store their token in the OS keychain:

- **JIRA Cloud** — site, email, API token → issues assigned to you.
- **GitHub** — a classic PAT with the `repo` scope → PRs, reviews, and contributions. For SAML/enterprise (EMU) orgs, authorize the token for SSO.
- **AI (local)** — point at your Ollama endpoint/model (defaults to `http://localhost:11434`, `llama3.1`). Turn it off to fall back to a keyword heuristic.

## Data & privacy

- **Database:** `~/Library/Application Support/com.careeros.app/career_os.db`
- **Secrets:** OS keychain (service `com.careeros.app`)
- **Backup / export:** Settings → Export & backup (JSON backup, Markdown promo packet, `.ics` calendar)

## Contributing

Contributions welcome — it's a clean, modern Tauri + React codebase. Clone, `npm install`, `npm run tauri dev`. Good first PRs: more integrations (Linear, GitLab), Windows/Linux CI builds, or richer charts. See [`AGENTS.md`](./AGENTS.md) for architecture and the schema-migration flow.
