# WillSarg Fork Workflow

## Intent

This fork should stay close enough to upstream `pingdotgg/t3code` that upstream updates can be merged without constant pain.

The default strategy is:

- keep `main` clean
- do active work on `dev`
- do task work on `feat/*`
- keep Will-specific product work separate from potentially upstreamable fixes

## Branch Model

- `upstream/main` = the original project
- `main` = local upstream-sync branch
- `dev` = Will's active integration branch
- `feat/*` = short-lived task branches from `dev`

## Start New Work

```bash
git checkout dev
git pull --ff-only origin dev
git checkout -b feat/<short-name>
```

If the task is tiny and local, working directly on `dev` is acceptable, but `feat/*` is preferred for anything substantial.

## Finish Work

Required checks from the repo root:

```bash
bun fmt
bun lint
bun typecheck
bun run test
```

Then review state:

```bash
git status -sb
git add .
git commit -m "feat(...): ..."
git push -u origin feat/<short-name>
```

Open a PR into `dev` if you want a reviewable history, even for solo work.

## Sync Upstream

Update the clean mirror first:

```bash
git fetch upstream
git checkout main
git merge --ff-only upstream/main
git push origin main
```

Then bring those changes into the fork branch:

```bash
git checkout dev
git merge main
git push origin dev
```

## Upstreamable Fixes

If part of a change is generic and could reasonably go upstream:

1. branch from `main`
2. keep the patch small
3. avoid Will-specific branding or product choices
4. keep screenshots or videos for UI changes
5. open a separate upstream PR only for that isolated slice

## Change Structuring Rules

- Keep branding changes separate from logic changes.
- Keep provider changes separate from UI changes when practical.
- Avoid unnecessary file moves and large renames.
- Avoid repo-wide cleanup churn unless it unlocks a specific change.
- Prefer additive extension points over replacing upstream structure.

## Session Prompt Shortcut

For a fresh coding session, this should be enough:

```text
Look at /Users/will/Documents/Github/willsarg/t3code-willsarg and follow AGENTS.md plus docs/willsarg-fork-workflow.md.
```

## Decision Rule

Before making a change, ask:

```text
Can this be implemented as a small patch on top of upstream?
```

If yes, do that.

If no, document the reason for the divergence in the task notes, PR description, or commit message.
