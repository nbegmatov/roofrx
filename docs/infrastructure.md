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

## Phase 2 — OS hardening (TODO — RRX-008)

**Status: NOT STARTED**

Complete this phase before connecting any public-facing backend services to the VPS.

### 2.1 Install and configure fail2ban

```bash
# TODO: fill in after RRX-008 is executed
apt install -y fail2ban

# Create a local override for the sshd jail
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

systemctl enable --now fail2ban
fail2ban-client status sshd
```

### 2.2 Enable unattended security upgrades

```bash
# TODO: fill in after RRX-008 is executed
apt install -y unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
# Confirm automatic reboot behavior and email notifications match operational requirements
```

### 2.3 Create a scoped deploy user

```bash
# TODO: fill in after RRX-008 is executed
adduser deploy
# Grant only the permissions needed for rsync and service restarts
# Do NOT give full sudo — scope it to specific commands via /etc/sudoers.d/deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Update the `IONOS_USER` GitHub Actions variable from `root` to `deploy` after verifying the user can write to all web roots and restart services.

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

Then:

```bash
ssh -i ~/.ssh/roofrx root@100.73.70.66
```

Once Phase 2 is complete and the `deploy` user is created, switch to:

```bash
ssh -i ~/.ssh/roofrx deploy@100.73.70.66
```
