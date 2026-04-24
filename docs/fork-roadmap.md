# Fork Roadmap

## Purpose

This document records the intended direction of Will's fork so future sessions can distinguish deliberate product choices from accidental drift.

When this changes, update the file instead of relying on session memory.

## Current Operating Strategy

- Stay close enough to upstream `pingdotgg/t3code` that upstream updates remain mergeable.
- Keep `main` as the upstream-sync branch.
- Keep `dev` as the integration branch for Will's fork.
- Prefer additive changes over rewrites.
- Separate Will-specific product work from generic fixes whenever practical.

## Deliberate Divergence Areas

These are reasonable places for the fork to become opinionated over time:

- personal workflow optimizations for Will
- custom provider routing, model defaults, or local/cloud execution preferences
- UI changes that improve Will's daily usage
- tooling and prompts that make fresh agent sessions more consistent
- repo-local instructions that encode branch policy and task workflow

## Areas To Keep Close To Upstream

These should stay structurally close to upstream unless there is a strong reason not to:

- session lifecycle and provider orchestration
- WebSocket protocol and event flow
- shared contracts and schema boundaries
- core package layout
- build, release, and test entrypoints

## Decision Filter

Before a significant change, ask:

1. Is this solving a real repeated problem for Will?
2. Can this be implemented as a small patch on top of upstream?
3. If not, is the divergence worth the future merge cost?
4. Should part of this be split into a separate upstreamable patch?

If the answer to 3 is weak, do not diverge yet.

## Near-Term Fork Goals

- keep fresh GPT/Codex/Claude sessions consistent by relying on repo-local instructions
- improve usability without destabilizing the upstream architecture
- preserve a clean upstream sync path
- prefer a reviewable branch and PR history, even for solo work

## Update Rules

- If a change creates intentional long-term drift, record it here.
- If a change is meant to go upstream, do not list it as fork-only unless the upstream attempt fails or is no longer desired.
- Keep entries short and concrete.
