# RoofRx — VPS Infrastructure Reproduction Guide

This document is a step-by-step record of every action taken on the IONOS VPS (`74.208.208.140`). If the VPS were wiped today and replaced with a clean Ubuntu 24.04 box, executing these phases in order reproduces the current state.

**Phases marked TODO** describe planned work that has not been executed. When a ticket completes, replace the TODO block with the actual commands used.

---

## Starting point

A clean IONOS VPS with:
- Ubuntu 24.04.4 LTS
- SSH listening on port 22 (public)
- No Nginx, no Docker, no Certbot, no Tailscale
- `git`, `rsync`, `curl` pre-installed
- `ufw` installed but inactive
- Root login enabled via SSH key

---

## Phase 1 — Tailscale + SSH hardening

**Status: COMPLETE**

This phase locks down the public SSH attack surface and gives CI/CD secure access to the VPS via Tailscale.

### 1.1 Install Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey <tskey-auth-...>
```

The auth key is a one-time-use key generated in the Tailscale admin console under **Settings → Keys → Generate auth key**. Never commit it. Store it in the password manager.

After joining, the server appears at [login.tailscale.com/admin/machines](https://login.tailscale.com/admin/machines). The assigned Tailscale IP is `100.73.70.66`. This value is set as the `IONOS_TAILSCALE_IP` GitHub Actions variable.

Verify the node joined and note the IP:

```bash
tailscale status
```

### 1.2 Configure UFW — restrict SSH to Tailscale only

```bash
# Allow web traffic
ufw allow 'Nginx Full'

# Allow SSH only on the Tailscale interface
ufw allow in on tailscale0 to any port 22 proto tcp

# Enable the firewall
ufw enable

# Remove the broad public-internet SSH rule (added implicitly or previously)
ufw delete allow OpenSSH
ufw reload

# Verify
ufw status verbose
```

Expected output includes:

```
80,443/tcp (Nginx Full)    ALLOW IN    Anywhere
22/tcp on tailscale0       ALLOW IN    Anywhere
```

Port 22 must not appear as allowed on any non-Tailscale interface.

### 1.3 Add `IONOS_TAILSCALE_IP` GitHub Actions variable

In the GitHub repo **Settings → Secrets and variables → Actions → Variables**, add:

```
IONOS_TAILSCALE_IP = 100.73.70.66
```

### 1.4 Update deploy workflows to connect via Tailscale

Both `deploy-ionos.yml` and `deploy-ionos-intermtnroofing.yml` were updated to:
- Add the `tailscale/github-action@v3` step using `TS_OAUTH_CLIENT_ID` and `TS_OAUTH_SECRET`
- Use `$IONOS_TAILSCALE_IP` as the SSH host instead of `$IONOS_HOST`
- Retain `IONOS_HOST` as an env var for rollback reference (not used in SSH commands)

### 1.5 Create the Tailscale OAuth client for CI

In the Tailscale admin console under **Settings → OAuth clients**, create a client scoped to `tag:ci`. This gives GitHub Actions ephemeral tailnet membership. Store the credentials as GitHub secrets:

- `TS_OAUTH_CLIENT_ID`
- `TS_OAUTH_SECRET`

---

## Phase 2 — OS hardening (RRX-008)

**Status: COMPLETE** (2026-07-02)

### 2.1 Install and configure fail2ban

`unattended-upgrades` was already present on the base image. `fail2ban` was not.

```bash
apt install -y fail2ban
systemctl enable --now fail2ban
```

Created `/etc/fail2ban/jail.d/sshd.local`:

```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
```

```bash
systemctl restart fail2ban
fail2ban-client status sshd
```

Verified output:

```
Status for the jail: sshd
|- Filter
|  |- Currently failed: 0
|  |- Total failed:     0
|  `- Journal matches:  _SYSTEMD_UNIT=sshd.service + _COMM=sshd
`- Actions
   |- Currently banned: 0
   |- Total banned:     0
   `- Banned IP list:
```

### 2.2 Enable unattended security upgrades

Already installed. Re-ran reconfigure to confirm it is enabled:

```bash
DEBIAN_FRONTEND=noninteractive dpkg-reconfigure --priority=low unattended-upgrades
systemctl status unattended-upgrades
```

Service confirmed `active (running)` since initial server provisioning.

### 2.3 Scope deploy user sudo

The `deploy` user already existed (uid=1000, in `sudo` group). Wrote a scoped sudoers drop-in restricting passwordless sudo to Nginx reload/restart and PM2 restart (inert until PM2 is installed in RRX-011):

```bash
tee /etc/sudoers.d/deploy << 'EOF'
# Scoped sudo for the deploy user — service restarts only (RRX-008)
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/systemctl restart nginx, /usr/bin/pm2 restart all, /usr/bin/pm2 reload all
EOF
chmod 440 /etc/sudoers.d/deploy
visudo -c
```

`visudo -c` output: all files parsed OK.

Tested:
- `sudo /usr/bin/systemctl reload nginx` as `deploy` → exit 0 (NOPASSWD granted, nginx reloaded)
- `sudo -n apt update` as `deploy` → exit 1 (password required — not in scoped allow list)

**Note — PM2 path:** PM2 installs to `/usr/local/bin/pm2` via npm, not `/usr/bin/pm2`. Verify with `which pm2` after RRX-011 and update this file if the path differs.

**Pending:** Removal of `deploy` from the `sudo` group is a separate approval step. Full restriction takes effect only after that removal.

### 2.4 SSH key separation

Separated admin and CI/CD SSH keys:

| Key | Purpose | Authorized on |
|---|---|---|
| `roofrx` (`~/.ssh/roofrx`) | Human admin SSH | `root`, `deploy` |
| `ionos_deploy` (`~/.ssh/ionos_deploy`) | CI/CD only (`IONOS_SSH_KEY` secret) | `deploy` only |

```bash
# Add ionos_deploy public key to deploy authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJtKNpicnZep1+/7KVQXSERSBlI0HU8V2KNen7W/HTex ionos-deploy" \
  >> /home/deploy/.ssh/authorized_keys

# Remove ionos_deploy from root (CI key must not reach root)
sed -i "/ionos-deploy/d" /root/.ssh/authorized_keys

# Fix web root ownership so deploy user can write files
chown -R deploy:deploy /var/www/roofrxservices.com /var/www/intermtnroofing.com
```

CI/CD verified end-to-end: GitHub Actions deploy workflow connected as `deploy` using `ionos_deploy` key and completed successfully.

---

## Phase 3 — Nginx + SSL (TODO — RRX-009)

**Status: NOT STARTED**

This phase installs the web server and issues TLS certificates for both public domains and the API subdomain.

### 3.1 Install Nginx and Certbot

```bash
# TODO: fill in after RRX-009 is executed
apt install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx
```

### 3.2 Create site directories

```bash
# TODO: fill in after RRX-009 is executed
mkdir -p /var/www/roofrxservices.com/current
mkdir -p /var/www/intermtnroofing.com/current
chown -R deploy:deploy /var/www/roofrxservices.com /var/www/intermtnroofing.com
chmod -R 755 /var/www/roofrxservices.com /var/www/intermtnroofing.com
```

### 3.3 Nginx vhost for roofrxservices.com

```bash
# TODO: fill in actual config path and content after RRX-009 is executed
# Reference config from docs/deployment.md:
# /etc/nginx/sites-available/roofrxservices.com
```

See [docs/deployment.md](deployment.md) for the recommended Nginx configuration block (covers HTTP, static file caching, and `try_files` routing).

### 3.4 Nginx vhost for intermtnroofing.com

```bash
# TODO: mirror the roofrxservices.com config with the correct server_name and root path
```

### 3.5 Nginx vhost for api.roofrxservices.com

```bash
# TODO: configure reverse proxy to Node.js backend (port TBD) after RRX-011 is ready
```

### 3.6 Issue TLS certificates

```bash
# TODO: fill in after DNS is pointed and propagated
certbot --nginx \
  -d roofrxservices.com -d www.roofrxservices.com \
  -d intermtnroofing.com -d www.intermtnroofing.com

# API subdomain cert issued separately after backend vhost is in place
certbot --nginx -d api.roofrxservices.com

systemctl status certbot.timer
```

---

## Phase 4 — PostgreSQL (TODO — RRX-010)

**Status: NOT STARTED**

```bash
# TODO: fill in after RRX-010 is executed
apt install -y postgresql postgresql-contrib
systemctl enable --now postgresql

# Create application database and user (credentials go in .env on server, never committed)
sudo -u postgres psql <<'SQL'
CREATE USER roofrx WITH PASSWORD '<password>';
CREATE DATABASE roofrxdb OWNER roofrx;
SQL
```

Schema migrations will be documented in a separate file when the schema is defined.

---

## Phase 5 — Node.js backend + PM2 (TODO — RRX-011)

**Status: NOT STARTED**

```bash
# TODO: fill in after RRX-011 is executed

# Install Node.js 24 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Set up application directory
mkdir -p /srv/roofrx-api
# Deploy backend code (CI/CD step to be added to deploy workflow)

# Start with PM2 and save process list
pm2 start /srv/roofrx-api/server.js --name roofrx-api
pm2 save
pm2 startup systemd
# Run the generated systemctl command to enable PM2 on boot
```

---

## Key file paths on the VPS

Once fully built out, the important paths will be:

| Path | Purpose |
|---|---|
| `/var/www/roofrxservices.com/current/` | RoofRx static site web root |
| `/var/www/intermtnroofing.com/current/` | Intermountain Roofing static site web root |
| `/etc/nginx/sites-available/` | Nginx vhost configs (not yet created) |
| `/etc/nginx/sites-enabled/` | Symlinks to active vhosts |
| `/etc/letsencrypt/` | TLS certificates managed by Certbot |
| `/srv/roofrx-api/` | Backend API application (not yet created) |
| `/etc/fail2ban/jail.d/sshd.local` | fail2ban SSH jail config (not yet created) |

---

## How to SSH into the VPS

Your workstation must be connected to Tailscale. If not:

```bash
tailscale up
```

Then connect as `deploy`:

```bash
ssh -i ~/.ssh/roofrx deploy@100.73.70.66
```
