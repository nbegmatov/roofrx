# Changelog

## 2026-06-30 (pending merge — branch security/ci-over-tailscale)
- security: route both deploy workflows through Tailscale — adds `tailscale/github-action@v3` step authenticating via OAuth `tag:ci`; ssh-keyscan, mkdir, and rsync now target `$IONOS_TAILSCALE_IP` instead of `$IONOS_HOST`. Prerequisite for closing port 22 to the public internet.

## 2026-06-30
- docs: establish AI onboarding, account registry, and standing commit/documentation workflow.
- feat: add per-brand logo assets and isolated local dev servers (`npm run dev:roofrx` / `dev:intermtn`) — logos served directly from `brands/<brand>/images/` without file copying; fixes Windows `spawn EINVAL` in watch-css.
- infra: install Tailscale on IONOS server for out-of-band admin access.
