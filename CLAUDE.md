# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repo.

Before anything else, read `docs/ai-onboarding.md` (business context) and `docs/deployment.md` (infra/deploy model) — they cover ground not otherwise in this file.

## Standing workflow rules

### Commit & push discipline
- When a change is made and confirmed working (build passes, local verification done, owner has reviewed if it's user-facing or infra), commit it with a clear, conventional message (`fix:`, `feat:`, `docs:`, `chore:`, `infra:`) before moving to the next task. Don't batch unrelated changes into one commit.
- Default to pushing to a feature branch, not `main`, for anything touching: infrastructure, deployment config, firewall/server access, environment variables, or anything that could break the live site or CI pipeline. Open these as a PR for the owner to review the diff.
- Direct push to `main` is acceptable only for low-risk, easily-reversible changes (content copy, docs-only updates, non-breaking CSS) — when in doubt, use a branch.
- Never push if local verification (`npm run verify`, `npm run build:css`) hasn't been run and passed.

### Documentation discipline
- Any change to deployment process, server config, or infrastructure gets reflected in `docs/deployment.md` in the same commit — not as a follow-up.
- Any new account, service, or credential-bearing integration gets a row added to `docs/accounts.md` in the same commit (ownership facts only, never the credential itself).
- Maintain `CHANGELOG.md` at repo root — one entry per merged change, dated, one line describing what changed and why, referencing the RRX ticket ID where applicable.
- If a change touches business logic or strategy (not just code) that a future AI agent would need to understand, add or update the relevant section in `docs/ai-onboarding.md` rather than letting that context live only in chat history.

### When to stop and ask
- Any firewall, SSH, DNS, or access-control change: propose the exact commands and rollback path, then stop and wait for explicit go-ahead before applying on the live server.
- Any change that would alter what GitHub Actions can access or how it authenticates: same — propose, then wait.
