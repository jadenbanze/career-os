# Career OS

A local-first desktop app (Tauri v2 + React) for tracking work tasks (with read-only
JIRA), a brag sheet, promotion timeline, career development, a vision board, and a
personal timeline. All data is stored locally in SQLite; the JIRA API token is kept in
the macOS Keychain.

## Stack

- **Shell:** Tauri v2 (Rust) — `src-tauri/`
- **Frontend:** Vite + React 19 + TypeScript — `src/`
- **UI:** Tailwind v4 + shadcn/ui (Radix, "radix-nova" preset, neutral base, Geist font, lucide icons)
- **Routing:** react-router-dom (hash router) — `src/router.tsx`
- **Data:** SQLite via `tauri-plugin-sql`, typed with Drizzle ORM (`drizzle-orm/sqlite-proxy`)
- **Server state:** TanStack Query

## Commands

Rust must be on PATH — source it first: `. "$HOME/.cargo/env"`

- `npm run tauri dev` — run the desktop app (starts Vite + compiles/launches Rust)
- `npm run build` — typecheck + production frontend build
- `npx tsc --noEmit` — typecheck only
- `npm run tauri build` — package a distributable (macOS bundle)
- `npx drizzle-kit generate` — regenerate SQL migrations from the Drizzle schema

## Data layer

- Schema (source of truth): `src/db/schema.ts`
- Drizzle client + tauri-plugin-sql proxy adapter: `src/db/client.ts`
- DB file (macOS): `~/Library/Application Support/com.careeros.app/career_os.db`
- Feature hooks live in `src/features/<feature>/`

### Adding or changing a table

1. Edit `src/db/schema.ts`.
2. `npx drizzle-kit generate` → creates a new file in `src-tauri/migrations/` (e.g. `0001_*.sql`).
3. Add a new `Migration { version: N, ... sql: include_str!("../migrations/000N_*.sql") ... }`
   entry to the `migrations` vec in `src-tauri/src/lib.rs` (increment `version`).
4. Restart `npm run tauri dev`; the plugin applies pending migrations on load.

## JIRA (read-only)

- Rust command `jira_fetch_issues` (`src-tauri/src/jira.rs`) calls JIRA Cloud
  `GET /rest/api/3/search/jql` with Basic auth (email + API token).
- The token is read from the OS keychain in Rust and never crosses into JS.
- Configure in the app's **Settings** page (site, email, token).
- Frontend sync + cache: `src/features/jira/use-jira.ts` (caches into the `jira_issues` table).

## GitHub (read-only)

- Rust command `github_sync` (`src-tauri/src/github.rs`) uses GraphQL
  (`contributionsCollection`) for the activity graph and REST (`/search/issues`,
  `/users/{user}/events`) for PRs and events. Classic PAT, read from the keychain.
- Configure in **Settings** (username + token). Frontend sync/cache + charts:
  `src/features/github/use-github.ts`; the **Activity** page renders PRs, the
  contribution graph, and velocity charts (shadcn/Recharts).

## Secrets

- `src-tauri/src/secrets.rs` exposes `set_secret` / `has_secret` / `delete_secret`
  (macOS Keychain via the `keyring` crate, service `com.careeros.app`).
- Accounts in use: `jira_api_token`, `github_token`.

## Quick capture & local AI

- **Capture:** ⌘⇧N (or ⌘K → "Capture to Inbox") drops a raw note into `inbox_items`.
  The capture mutation lives on the always-mounted `AppActionsProvider` so AI
  enrichment finishes even after the dialog closes.
- **AI:** `ai_categorize` (`src-tauri/src/ai.rs`) calls a local **Ollama** model
  (`/api/chat`, forced JSON) to classify into win/task/event/goal/feedback/
  milestone + title, details, win size, and tags. Free & private; falls back to a
  keyword heuristic (`src/features/ai/use-ai.ts`) when AI is off/unreachable.
- Configure enable/endpoint/model in **Settings** (defaults: on, `http://localhost:11434`, `llama3.1`).
- **Inbox** (`src/routes/inbox.tsx`) reviews + files each capture into the right section.

## Other notes

- Migrations: currently 4 (see `src-tauri/src/lib.rs`). Increment `version` when adding more.
- Plugins enabled: sql, opener, dialog, fs, notification; `protocol-asset` is on
  (tauri feature + `assetProtocol` scope `$APPLOCALDATA/**`) so vision-board images
  copied into app-local-data render via `convertFileSrc`.
- Promo-packet PDF uses the webview print dialog (`window.print()` on the standalone
  `/packet` route); Markdown/JSON export uses the dialog + fs plugins.
- Reminders run once/day at startup (`src/features/reminders/reminders.ts`).

## Releases & auto-update

- **Updater signing key** lives at `~/.tauri/career-os-updater.key` (private — never
  committed; `.pub` holds the public key that's embedded in `tauri.conf.json`).
- **Config:** `plugins.updater` (endpoint + pubkey) and `bundle.createUpdaterArtifacts`
  in `tauri.conf.json`; on-launch check in `src/features/updates/update-checker.ts`.
- **CI:** `.github/workflows/release.yml` (tauri-action) builds a signed universal
  macOS release on `v*` tags. Requires two repo secrets:
  - `TAURI_SIGNING_PRIVATE_KEY` — contents of `~/.tauri/career-os-updater.key`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — empty (key was created without one)
- **Cut a release:** bump `version` in `tauri.conf.json`, then
  `git tag v0.2.0 && git push origin v0.2.0`. CI creates a **draft** release —
  publish it so `releases/latest` resolves and clients update.
- **Local signed build:**
  `TAURI_SIGNING_PRIVATE_KEY="$HOME/.tauri/career-os-updater.key" TAURI_SIGNING_PRIVATE_KEY_PASSWORD="" npm run tauri build`
- **Private-repo caveat:** the in-app updater downloads from GitHub Releases; on a
  **private** repo those assets need auth, so auto-update only works once the repo
  (or releases) are public, or you add an auth header to the updater request.

## Corporate network note (shadcn CLI)

`registry.npmjs.org` is reachable, but `ui.shadcn.com` is behind a TLS-inspecting proxy,
so `npx shadcn@latest add ...` fails with "unable to get local issuer certificate" unless
Node trusts the corporate root CA. Export the macOS trust store and point Node at it:

```bash
security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain > /tmp/corp-ca.pem
security find-certificate -a -p /Library/Keychains/System.keychain >> /tmp/corp-ca.pem
NODE_EXTRA_CA_CERTS=/tmp/corp-ca.pem npx shadcn@latest add <component>
```

reqwest uses `native-tls` (macOS Secure Transport), which already trusts this store, so
JIRA calls work without extra config.
