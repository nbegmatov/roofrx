# RoofRx — GitHub Secrets and Variables Registry

Every secret and variable currently referenced in the GitHub Actions workflows for this repo. Names, descriptions, and usage only — never values.

Set secrets at: **GitHub repo → Settings → Secrets and variables → Actions → Secrets**
Set variables at: **GitHub repo → Settings → Secrets and variables → Actions → Variables**

---

## GitHub Secrets

Encrypted at rest. Not visible after being set. Rotated by deleting and re-adding.

### `IONOS_SSH_KEY`

| Field | Value |
|---|---|
| **Contains** | The private SSH key (PEM format) for the deploy user on the VPS |
| **Used by** | `deploy-ionos.yml`, `deploy-ionos-intermtnroofing.yml` |
| **Loaded via** | `webfactory/ssh-agent@v0.10.0` |
| **If missing** | Workflow fails at the `ssh-agent` step; rsync cannot authenticate to the VPS |
| **Key location** | Private half at `~/.ssh/roofrx` (or `~/.ssh/ionos_deploy`) on the owner's machine |

The matching public key must be in `~/.ssh/authorized_keys` (or `/home/deploy/.ssh/authorized_keys` once Phase 2 is complete) on the VPS. The private key is never committed to the repo.

---

### `TS_OAUTH_CLIENT_ID`

| Field | Value |
|---|---|
| **Contains** | Tailscale OAuth client ID, scoped to `tag:ci` |
| **Used by** | `deploy-ionos.yml`, `deploy-ionos-intermtnroofing.yml` |
| **Loaded via** | `tailscale/github-action@v3` |
| **If missing** | Workflow fails at the Tailscale join step; the runner cannot reach the VPS (port 22 is not open to the public internet) |
| **Generated at** | Tailscale admin console → Settings → OAuth clients |

Paired with `TS_OAUTH_SECRET`. The `tag:ci` scope means ephemeral runner nodes are automatically tagged and can be restricted by Tailscale ACLs.

---

### `TS_OAUTH_SECRET`

| Field | Value |
|---|---|
| **Contains** | Tailscale OAuth client secret (password-equivalent for the CI OAuth client) |
| **Used by** | `deploy-ionos.yml`, `deploy-ionos-intermtnroofing.yml` |
| **Loaded via** | `tailscale/github-action@v3` |
| **If missing** | Same failure as `TS_OAUTH_CLIENT_ID` — Tailscale join fails, VPS unreachable |
| **Generated at** | Tailscale admin console → Settings → OAuth clients (same operation as Client ID) |

Treat as a password. Never commit. Rotate if compromised by deleting the OAuth client and creating a new one, then updating both this secret and `TS_OAUTH_CLIENT_ID`.

---

## GitHub Variables

Plain text, visible after being set. Used for non-sensitive configuration that varies by environment.

### `IONOS_HOST`

| Field | Value |
|---|---|
| **Contains** | Public IP address of the IONOS VPS (`74.208.208.140`) |
| **Used by** | `deploy-ionos.yml`, `deploy-ionos-intermtnroofing.yml` (loaded into env but not used in SSH commands) |
| **If missing** | Workflow continues without it; CI now uses `IONOS_TAILSCALE_IP` for SSH |
| **Purpose** | Rollback reference — retained in case Tailscale fails and public SSH must be temporarily re-opened |

---

### `IONOS_TAILSCALE_IP`

| Field | Value |
|---|---|
| **Contains** | Tailscale IP of the IONOS VPS (`100.73.70.66`) |
| **Used by** | `deploy-ionos.yml`, `deploy-ionos-intermtnroofing.yml` |
| **If missing** | Workflow fails the validation step ("Missing IONOS_TAILSCALE_IP"); no SSH connection is attempted |
| **Purpose** | The actual SSH target for both deploy workflows; CI connects here, not to the public IP |

This is the address assigned to the VPS when it joined the Tailscale network. If the VPS is ever re-provisioned and re-joined to Tailscale, the Tailscale IP may change — update this variable if it does.

---

### `IONOS_USER`

| Field | Value |
|---|---|
| **Contains** | SSH username used by CI to connect to the VPS (currently `root`; will become `deploy` after RRX-008) |
| **Used by** | `deploy-ionos.yml`, `deploy-ionos-intermtnroofing.yml` |
| **If missing** | Workflow fails the validation step; SSH command has no username |
| **Purpose** | The OS user under which rsync writes files to the VPS |

---

### `IONOS_PORT`

| Field | Value |
|---|---|
| **Contains** | SSH port number (`22`) |
| **Used by** | `deploy-ionos.yml`, `deploy-ionos-intermtnroofing.yml` |
| **If missing** | Workflow falls back to default value `22` (hardcoded in workflow: `${{ vars.IONOS_PORT \|\| '22' }}`) |
| **Purpose** | Allows the SSH port to be changed without editing workflow files |

---

### `IONOS_PATH`

| Field | Value |
|---|---|
| **Contains** | Absolute path on the VPS where RoofRx static files are deployed (`/var/www/roofrxservices.com/current`) |
| **Used by** | `deploy-ionos.yml` only |
| **If missing** | Workflow fails the validation step; rsync has no target directory |
| **Purpose** | Web root for `roofrxservices.com`; must be writable by `IONOS_USER` |

---

### `IONOS_PATH_INTERMTN`

| Field | Value |
|---|---|
| **Contains** | Absolute path on the VPS where Intermountain Roofing static files are deployed (`/var/www/intermtnroofing.com/current`) |
| **Used by** | `deploy-ionos-intermtnroofing.yml` only (referenced as `IONOS_PATH` inside that workflow) |
| **If missing** | Workflow fails the validation step; rsync has no target directory for the Intermtn brand |
| **Purpose** | Web root for `intermtnroofing.com`; must be writable by `IONOS_USER` |

---

## Summary table

| Name | Type | Used by workflow(s) | Breaks if missing? |
|---|---|---|---|
| `IONOS_SSH_KEY` | Secret | deploy-ionos, deploy-ionos-intermtnroofing | Yes — cannot SSH |
| `TS_OAUTH_CLIENT_ID` | Secret | deploy-ionos, deploy-ionos-intermtnroofing | Yes — cannot reach VPS via Tailscale |
| `TS_OAUTH_SECRET` | Secret | deploy-ionos, deploy-ionos-intermtnroofing | Yes — cannot reach VPS via Tailscale |
| `IONOS_HOST` | Variable | deploy-ionos, deploy-ionos-intermtnroofing | No — kept for rollback reference only |
| `IONOS_TAILSCALE_IP` | Variable | deploy-ionos, deploy-ionos-intermtnroofing | Yes — explicit validation check |
| `IONOS_USER` | Variable | deploy-ionos, deploy-ionos-intermtnroofing | Yes — explicit validation check |
| `IONOS_PORT` | Variable | deploy-ionos, deploy-ionos-intermtnroofing | No — defaults to `22` |
| `IONOS_PATH` | Variable | deploy-ionos | Yes — explicit validation check |
| `IONOS_PATH_INTERMTN` | Variable | deploy-ionos-intermtnroofing | Yes — explicit validation check |

---

## Rotation procedures

**Rotating `IONOS_SSH_KEY`:**
1. Generate a new keypair locally.
2. Add the new public key to `authorized_keys` on the VPS.
3. Update the `IONOS_SSH_KEY` secret in GitHub.
4. Trigger a test deploy to confirm the new key works.
5. Remove the old public key from `authorized_keys` on the VPS.

**Rotating Tailscale OAuth credentials:**
1. Create a new OAuth client in the Tailscale admin console (same `tag:ci` scope).
2. Update both `TS_OAUTH_CLIENT_ID` and `TS_OAUTH_SECRET` in GitHub secrets simultaneously.
3. Trigger a test deploy to confirm the new credentials work.
4. Delete the old OAuth client in the Tailscale admin console.
