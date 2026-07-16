# Career OS

A local-first desktop app for managing your work and career in one place:
work tasks (with read-only JIRA), a GitHub activity/velocity view, a brag sheet,
promotion timeline, career-development goals, a vision board, a personal
timeline, and 1:1 / feedback notes — with a Notion-style UI and a ⌘K command
palette.

Everything is stored **locally** in SQLite. API tokens are kept in the OS
keychain and never written to disk or committed.

## Tech stack

- **Tauri v2** (Rust) desktop shell
- **React 19 + TypeScript + Vite**
- **Tailwind v4 + shadcn/ui** (Radix)
- **SQLite** via `tauri-plugin-sql`, typed with **Drizzle ORM**
- **TanStack Query** for data, **Recharts** for charts

## Prerequisites

- **Node.js** ≥ 22.12 (18/20 also fine)
- **Rust** (stable) — https://rustup.rs
- **macOS:** Xcode Command Line Tools (`xcode-select --install`)

## Development

```bash
npm install
npm run tauri dev
```

If `cargo` isn't found, add it to your shell: `. "$HOME/.cargo/env"`.

## Build a distributable

```bash
npm run tauri build
```

Output (macOS) lands in `src-tauri/target/release/bundle/` — a `.app` under
`macos/` and a `.dmg` under `dmg/`.

## Integrations (optional)

Configure in **Settings** — both are read-only and store their token in the OS
keychain:

- **JIRA Cloud** — site, email, API token → shows issues assigned to you.
- **GitHub** — username + a classic PAT with the `repo` scope → PRs, reviews,
  and contribution activity. For SAML/enterprise (EMU) orgs, authorize the token
  for SSO.

## Data & privacy

- Database: `~/Library/Application Support/com.careeros.app/career_os.db` (macOS).
- Secrets: OS keychain (service `com.careeros.app`).
- Back up or export a promo packet from **Settings → Export & backup**.

## Project notes

See [`AGENTS.md`](./AGENTS.md) for architecture, the schema-migration flow, and
common commands.
