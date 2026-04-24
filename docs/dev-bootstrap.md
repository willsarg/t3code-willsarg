# Dev Bootstrap

## Purpose

Use this when a fresh local session needs to go from "repo exists" to "verification commands work".

For this fork, preferred package manager order is:

1. Homebrew
2. npm

## Required Tooling

This repo expects:

- Node `^24.13.1`
- Bun `1.3.11`

Source of truth:

- `package.json` -> `engines.node`
- `package.json` -> `packageManager`
- `.mise.toml`

## Preferred Install Path: Homebrew

### Node 24

Install Node 24 with Homebrew:

```bash
brew install node@24
```

`node@24` is keg-only, so ensure it is on `PATH`:

```bash
echo 'export PATH="$(brew --prefix node@24)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Verify:

```bash
node --version
npm --version
```

### Bun

Bun's official Homebrew tap is `oven-sh/bun`. Install with:

```bash
brew tap oven-sh/bun
brew install bun
```

Verify:

```bash
bun --version
bun --revision
```

If Bun was installed with Homebrew, upgrade it with:

```bash
brew upgrade bun
```

## Fallback Path: npm

Use this only if Homebrew is not available and Node/npm already exist.

Bun's official docs support global install with npm:

```bash
npm install -g bun
```

Then verify:

```bash
bun --version
bun --revision
```

## Install Repo Dependencies

From the repository root:

```bash
bun install
```

## Required Verification Commands

From the repository root:

```bash
bun fmt
bun lint
bun typecheck
bun run test
```

Important:

- Never use `bun test` in this repo.
- Use `bun run test` so the repo script runs through Turbo as intended.

## If Commands Still Fail

Check the current tool versions:

```bash
which node
node --version
which bun
bun --version
```

If `bun` is still missing after install, open a new shell or verify your shell `PATH`.

## Fresh Session Shortcut

For a clean agent session, this prompt is sufficient:

```text
Work in /Users/will/Documents/Github/willsarg/t3code-willsarg. Follow AGENTS.md, docs/dev-bootstrap.md, and docs/willsarg-fork-workflow.md before making changes.
```
