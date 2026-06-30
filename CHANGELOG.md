# Changelog

## 2026-06-30
- security(RRX-050): CI deploys now route through Tailscale (`tailscale/github-action@v3`, OAuth `tag:ci`); port 22 closed to the public internet via UFW; SSH accessible only on `tailscale0` interface (Tailscale IP `100.73.70.66`). Rollback path via IONOS console documented in `docs/deployment.md`.
- docs: establish AI onboarding, account registry, and standing commit/documentation workflow.
- feat: add per-brand logo assets and isolated local dev servers (`npm run dev:roofrx` / `dev:intermtn`) — logos served directly from `brands/<brand>/images/` without file copying; fixes Windows `spawn EINVAL` in watch-css.
- infra: install Tailscale on IONOS server for out-of-band admin access.
