# AGENTS.md

## Will Fork Workflow

This repository is Will's fork of `pingdotgg/t3code`.

Primary goal: make meaningful product improvements without drifting so far from upstream that upstream updates become painful.

Branch policy:

- `main` is the upstream-sync branch. Treat it as the clean mirror lane.
- `dev` is Will's integration branch and the default branch for ongoing fork work.
- `feat/*` branches are for task-specific work and should branch from `dev`.
- Never do feature work directly on `main`.
- If you start a session on `main`, stop and switch to `dev` or a new `feat/*` branch before making edits.

First steps for every non-trivial task:

1. Run `git status -sb`.
2. Run `git branch --show-current`.
3. Read this file and `docs/willsarg-fork-workflow.md`.
4. Read only the files relevant to the task before editing.
5. Prefer a new `feat/*` branch from `dev` for substantial work.
6. If `bun` or `node` are missing, read `docs/dev-bootstrap.md` before trying to install dependencies or run checks.

## Task Completion Requirements

- All of `bun fmt`, `bun lint`, and `bun typecheck` must pass before considering tasks completed.
- NEVER run `bun test`. Always use `bun run test` (runs Vitest).
- If behavior changed in a targeted area, run the narrowest relevant verification in addition to the root checks above.

## Project Snapshot

T3 Code is a minimal web GUI for using coding agents like Codex and Claude.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

For Will's fork, prefer additive changes over sweeping rewrites unless the rewrite is clearly worth the future merge cost.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

Fork-specific maintainability rules:

- Keep branding changes isolated from behavioral changes when practical.
- Keep provider changes isolated from UI changes when practical.
- Avoid broad renames, mass moves, or style-only churn unless there is a strong reason.
- Before making a structural change, ask: "Can this be implemented as a small patch on top of upstream?" If yes, do that.
- If a change could plausibly be sent upstream, keep that slice small and separate from Will-specific fork behavior.

## Package Roles

- `apps/server`: Node.js WebSocket server. Wraps Codex app-server (JSON-RPC over stdio), serves the React web app, and manages provider sessions.
- `apps/web`: React/Vite UI. Owns session UX, conversation/event rendering, and client-side state. Connects to the server via WebSocket.
- `packages/contracts`: Shared effect/Schema schemas and TypeScript contracts for provider events, WebSocket protocol, and model/session types. Keep this package schema-only — no runtime logic.
- `packages/shared`: Shared runtime utilities consumed by both server and web. Uses explicit subpath exports (e.g. `@t3tools/shared/git`) — no barrel index.

## Codex App Server (Important)

T3 Code is currently Codex-first. The server starts `codex app-server` (JSON-RPC over stdio) per provider session, then streams structured events to the browser through WebSocket push messages.

How we use it in this codebase:

- Session startup/resume and turn lifecycle are brokered in `apps/server/src/codexAppServerManager.ts`.
- Provider dispatch and thread event logging are coordinated in `apps/server/src/providerManager.ts`.
- WebSocket server routes NativeApi methods in `apps/server/src/wsServer.ts`.
- Web app consumes orchestration domain events via WebSocket push on channel `orchestration.domainEvent` (provider runtime activity is projected into orchestration events server-side).

Docs:

- Codex App Server docs: https://developers.openai.com/codex/sdk/#app-server

## Reference Repos

- Open-source Codex repo: https://github.com/openai/codex
- Codex-Monitor (Tauri, feature-complete, strong reference implementation): https://github.com/Dimillian/CodexMonitor

Use these as implementation references when designing protocol handling, UX flows, and operational safeguards.

## Fork References

- Upstream repo: https://github.com/pingdotgg/t3code
- Fork workflow: `docs/willsarg-fork-workflow.md`
- Bootstrap guide: `docs/dev-bootstrap.md`
- Upstream is most likely to accept small, focused bug, reliability, and performance fixes. Keep that in mind when structuring changes.
