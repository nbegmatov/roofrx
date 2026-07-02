# RoofRx — System Architecture

This document describes every machine, network boundary, code path, and build decision in the RoofRx system. Read it before touching infrastructure, CI/CD config, or the brand build system.

---

## System overview

One IONOS VPS runs everything:

| Role | Details |
|---|---|
| Machine | IONOS VPS — Ubuntu 24.04 |
| Public IP | `74.208.208.140` |
| Tailscale IP | `100.73.70.66` |
| Static sites | `/var/www/roofrxservices.com/current` and `/var/www/intermtnroofing.com/current` |
| Future backend | Node.js API + PostgreSQL (not yet built — see below) |

The VPS serves both static sites today (via Nginx) and will also run the backend API and database when those are built. There is no separate hosting machine — a single VPS is the entire production environment.

The domain `roofrxservices.com` — not `roofrx.com` — is the primary brand domain. This has historically caused errors. Verify it in every DNS record, environment variable, and config file you touch.

---

## Network topology

```
                 ┌──────────────────────────────────────┐
                 │           Tailscale mesh              │
                 │                                       │
  GitHub Actions ├─── ephemeral node (tag:ci) ──────────┤
  (runner)       │         OAuth join per run            │
                 │                                       │
  Dev workstation├─── persistent node ──────────────────┤
                 │         tailscale up                  │
                 │                                       │
                 │      IONOS VPS 100.73.70.66           │
                 │      (tailscale0 interface)           │
                 └──────────────────────────────────────┘

Public internet ──► VPS:80 (HTTP)   ─► Nginx ─► static files
                ──► VPS:443 (HTTPS) ─► Nginx ─► static files
                 ✗  VPS:22          ─► BLOCKED (UFW)
```

**Port 22 is not reachable from the public internet.** UFW allows SSH only on the `tailscale0` interface. Any agent or person attempting to SSH must first be on the Tailscale network.

**How GitHub Actions gets in:** Each deploy run uses the `tailscale/github-action@v3` action to join the tailnet ephemerally, authenticated via an OAuth client scoped to `tag:ci`. The node exists only for the duration of the workflow run and is then automatically removed. The OAuth credentials (`TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`) are stored as GitHub repository secrets.

**How a human admin gets in:** Connect your workstation to Tailscale (`tailscale up`), then SSH to the Tailscale IP directly:

```bash
ssh -i ~/.ssh/roofrx deploy@100.73.70.66
```

**Emergency fallback (no Tailscale):** IONOS Cloud Panel at cloud.ionos.com provides VNC/console access that does not go through SSH. See [docs/runbook.md](runbook.md) for the full emergency procedure.

Active UFW rules on the VPS:

```
80,443/tcp (Nginx Full)    ALLOW IN    Anywhere
22/tcp on tailscale0       ALLOW IN    Anywhere
22/tcp                     DENY IN     Anywhere (default)
```

---

## CI/CD pipeline

Three workflows exist in `.github/workflows/`:

### `ci.yml` — runs on every push to `main` and all PRs

Validates the build without deploying. Steps:
1. Checkout repo
2. Set up Node.js 24
3. `npm ci`
4. `BRAND=roofrxservices npm run apply:brand`
5. `npm run verify`

No secrets or variables required. Safe to run on PRs from forks.

### `deploy-ionos.yml` — deploys `roofrxservices.com`

Triggers on push to `main` and `workflow_dispatch`. Uses concurrency group `roofrx-ionos-deploy` (cancels any in-progress run when a new one starts).

Steps:
1. Checkout repo
2. Node.js 24 + `npm ci`
3. `BRAND=roofrxservices npm run apply:brand` — swaps in RoofRx brand assets
4. `npm run build:css` — compiles Tailwind CSS bundles
5. `docker build -t roofrx:test .` — validates the Dockerfile (does not push or run the image)
6. Validate required variables are set
7. `tailscale/github-action@v3` — join tailnet as ephemeral `tag:ci` node
8. `webfactory/ssh-agent@v0.10.0` — load `IONOS_SSH_KEY`
9. `ssh-keyscan` — add VPS to known_hosts (using Tailscale IP)
10. `ssh` — create `IONOS_PATH` on the server if it does not exist
11. `rsync` — sync built files to `/var/www/roofrxservices.com/current`

### `deploy-ionos-intermtnroofing.yml` — deploys `intermtnroofing.com`

Identical to the RoofRx workflow except:
- Step 3 uses `BRAND=intermtnroofing`
- Concurrency group: `intermtnroofing-ionos-deploy`
- `IONOS_PATH` is sourced from `vars.IONOS_PATH_INTERMTN` → `/var/www/intermtnroofing.com/current`

Both deploy workflows share the same SSH key, Tailscale credentials, user, and VPS. They run concurrently; the concurrency groups prevent a brand from deploying over itself, but the two brands can deploy simultaneously.

### What rsync excludes from the deployed build

The following files are synced to the server; everything else is excluded:

- `index.html`, `services.html`, and all other HTML pages
- `css/pages/*.css` — compiled Tailwind output
- `images/` — brand images (already swapped by `apply-brand.mjs`)
- `content/` — `site-settings.json` (already swapped), `editable.json`, `page-meta.json`
- `admin/` — local content editor (served as static files)
- `sitemap.xml`, `robots.txt`, `favicon.ico`

Excluded (never sent to server):
`.git/`, `.github/`, `node_modules/`, `scripts/`, `brands/`, `package.json`, `package-lock.json`, `postcss.config.js`, `tailwind.config.js`, `README.md`, `.gitignore`, `.prettierrc`

---

## Dual-brand build system

One codebase, two brands: **RoofRx Services** (`roofrxservices`) and **Intermountain Roofing** (`intermtnroofing`).

**Strategic note:** Intermountain Roofing is a backup/insurance brand only. It is a near-identical clone — same codebase, same content strategy, just the logo and company name swapped. Never propose separate strategy or content for Intermtn. Any strategic decision about RoofRx applies equally to Intermtn by default.

### How `scripts/apply-brand.mjs` works

The script reads the `BRAND` environment variable and applies the brand by:

1. Reading `brands/<brand>/theme.json` → writing `css/brand-theme.css` (CSS custom properties for brand colors and fonts)
2. Copying `brands/<brand>/site-settings.json` → `content/site-settings.json` (brand name, domain, contact info)
3. Copying all files in `brands/<brand>/images/` → `images/` (logo and brand images)

The files it overwrites (`css/brand-theme.css`, `content/site-settings.json`, `images/*`) are generated artifacts — do not edit them directly. Edit the source files under `brands/<brand>/`.

Brand directories:

```
brands/
  roofrxservices/
    theme.json          — colors and fonts
    site-settings.json  — brand name, domain, contact
    images/             — logo files
  intermtnroofing/
    theme.json
    site-settings.json
    images/
```

To apply a brand locally:

```bash
BRAND=roofrxservices npm run apply:brand
# or
BRAND=intermtnroofing npm run apply:brand
```

Dedicated local dev servers exist for each brand:

```bash
npm run dev:roofrx    # serves RoofRx brand on localhost
npm run dev:intermtn  # serves Intermtn brand on localhost
```

---

## Tech stack

### Live (currently deployed)

| Layer | Technology | Notes |
|---|---|---|
| Markup | Static HTML | Hand-authored, no framework |
| Styling | Tailwind CSS v4 | Compiled via `@tailwindcss/cli`; no runtime JS framework |
| Build | Node.js 24 (build-time only) | Node is not in the runtime; it only builds CSS and runs scripts |
| VPN | Tailscale | Secures SSH and CI/CD access to the VPS |
| CI/CD | GitHub Actions | Three workflows; see CI/CD section above |

### Planned (not yet built)

| Layer | Technology | Ticket | Notes |
|---|---|---|---|
| Web server | Nginx | RRX-009 | Installed and active; vhost config and Certbot SSL still needed |
| Backend API | Node.js (runtime) | RRX-011 | Will serve `api.roofrxservices.com` |
| Process manager | PM2 | RRX-011 | Manages Node.js backend process |
| Database | PostgreSQL | RRX-010 | Schema TBD |
| Hardening | fail2ban, unattended-upgrades | RRX-008 | See [docs/infrastructure.md](infrastructure.md) |

### Present in repo but not in production runtime

The repo contains a `Dockerfile`, `docker-compose.yml`, and `nginx/default.conf`. These are valid for local testing and are used as a CI validation step (`docker build -t roofrx:test .`) but are **not** the current runtime on the VPS. When RRX-009 completes, production will use host-level Nginx — not Docker.

---

## What is NOT yet built

If you are a new agent picking up this repo, be aware of the following before touching infrastructure or adding integrations:

- **No backend API exists.** `api.roofrxservices.com` is planned but not yet set up. Do not build anything that assumes it is reachable.
- **No PostgreSQL instance exists.** Any schema, migration, or ORM work is premature until RRX-010.
- **No PM2 config exists.** Process management for Node.js services is planned under RRX-011.
- **Nginx is installed but not yet configured.** Nginx is running on the VPS but no vhosts exist yet — no domain is being served. Vhost config and Certbot SSL are the remaining RRX-009 work.
- **fail2ban and unattended-upgrades are installed** (RRX-008 complete). Deploy user sudo is scoped. Removal of `deploy` from the `sudo` group is a pending approval step.
- **GoHighLevel and Google Workspace are not yet integrated.** See `docs/accounts.md`.

Cross-check ticket status with the owner before assuming any of these items have been completed — the kanban board does not sync automatically to this repo.
