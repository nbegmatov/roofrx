# Roofrx Deployment Guide

This document describes the recommended deployment model for the current `roofrx` site on a fresh IONOS Ubuntu server.

The current repo contains two different production approaches:

- a Docker-based runtime (`Dockerfile`, `docker-compose.yml`, `nginx/default.conf`)
- a GitHub Actions workflow that builds the site and deploys static files to IONOS via `rsync`

For the fresh IONOS server, the recommended path is:

- host-level `nginx` on Ubuntu
- the site served as static files from a directory on disk
- GitHub Actions pushing built files to that directory on every push to `main`

## Current state of the fresh IONOS server

Initial inspection of the new server at `74.208.208.140` showed:

- Ubuntu 24.04.4 LTS
- only SSH listening on port `22`
- no `nginx`
- no `docker`
- no `certbot`
- `git`, `rsync`, and `curl` already installed
- `ufw` installed but inactive
- no existing web root or nginx config on the machine

That means the box is effectively a clean slate and needs one-time host bootstrap before CI/CD can publish the site.

## What is currently in CI/CD

The active automation is in `.github/workflows/deploy-ionos.yml`.

On every push to `main` (or manual workflow dispatch), GitHub Actions currently:

1. checks out the repo
2. installs Node.js 20
3. runs `npm ci`
4. runs `npm run build:css`
5. runs `docker build -t roofrx:test .` as a validation step
6. loads an SSH private key from GitHub Secrets
7. creates the target directory on the server if needed
8. `rsync`s the project files to the remote server path

Important details of the current workflow:

- it deploys **static files**, not a Docker container
- it excludes `.git/`, `.github/`, `node_modules/`, `scripts/`, `package.json`, `package-lock.json`, and some local tooling files
- it expects these GitHub Actions variables:
  - `IONOS_HOST`
  - `IONOS_USER`
  - `IONOS_PORT`
  - `IONOS_PATH`
- it expects this GitHub Actions secret:
  - `IONOS_SSH_KEY`

## What is manual infrastructure work

These tasks are **not** handled by the current GitHub Action and must be done manually at least once:

- create and secure SSH access
- create a non-root deploy user if desired
- install and configure `nginx`
- choose the document root that matches `IONOS_PATH`
- point DNS for the domain to the server IP
- open firewall ports (`80` and `443`)
- install and configure TLS certificates with Certbot
- optional hardening, backups, monitoring, and fail2ban

## Recommended target layout on the server

Use a simple static-site layout:

```text
/var/www/roofrxservices.com/current
```

Recommended ownership model:

- `root` owns the parent directories
- a deploy user owns or can write to `current`
- `nginx` serves files read-only from that directory

Example:

```bash
mkdir -p /var/www/roofrxservices.com/current
chown -R deploy:deploy /var/www/roofrxservices.com
chmod -R 755 /var/www/roofrxservices.com
```

If you decide to keep deploying as `root`, that will work, but a dedicated deploy user is safer for long-term operation.

## One-time fresh server bootstrap

### 1. SSH access

Create a dedicated key locally and install the public key on the server.

Example local key name used for this project:

```text
~/.ssh/roofrx
```

Recommended SSH config entry on the local machine:

```sshconfig
Host roofrx
  HostName 74.208.208.140
  User root
  IdentityFile ~/.ssh/roofrx
  IdentitiesOnly yes
```

`IdentitiesOnly yes` is important when many SSH keys are loaded locally.

### 2. Create a deploy user

Recommended commands on the server:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Verify:

```bash
ssh -i ~/.ssh/roofrx deploy@74.208.208.140
```

### 3. Install nginx and firewall rules

On the server:

```bash
apt update
apt install -y nginx ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
systemctl enable --now nginx
```

### 4. Create the site root

On the server:

```bash
mkdir -p /var/www/roofrxservices.com/current
chown -R deploy:deploy /var/www/roofrxservices.com
chmod -R 755 /var/www/roofrxservices.com
```

### 5. Create the nginx site config

Recommended file:

```text
/etc/nginx/sites-available/roofrxservices.com
```

Recommended config:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name roofrxservices.com www.roofrxservices.com;

    root /var/www/roofrxservices.com/current;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    location ~* \.(css|js|svg|png|jpg|jpeg|gif|webp|ico)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files $uri =404;
    }

    location ~* \.html$ {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }
}
```

Enable it:

```bash
ln -s /etc/nginx/sites-available/roofrxservices.com /etc/nginx/sites-enabled/roofrxservices.com
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 6. Point DNS

At the DNS provider, create:

- `A` record for `roofrxservices.com` → `74.208.208.140`
- `A` record for `www.roofrxservices.com` → `74.208.208.140`

Wait until both resolve to the server before requesting TLS certificates.

### 7. Install TLS with Certbot

On the server:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d roofrxservices.com -d www.roofrxservices.com
```

Verify renewal timer:

```bash
systemctl status certbot.timer
```

### 8. Install Tailscale (VPN access)

Tailscale provides secure remote access to the server without exposing additional ports. Run on the server:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --authkey <tskey-auth-...>
```

The auth key is a one-time key generated from the Tailscale admin console under **Settings → Keys → Generate auth key**. Use an ephemeral or reusable key as appropriate. Never commit the key itself — store it in the password manager.

After joining, the server appears in the Tailscale admin console at [login.tailscale.com/admin/machines](https://login.tailscale.com/admin/machines) under the account in `docs/accounts.md`.

To verify it joined:

```bash
tailscale status
```

Tailscale is not required for GitHub Actions deploys (those use the public SSH key over port 22). It provides an out-of-band admin path that works even if the public IP or nginx is misconfigured.

## Configure GitHub Actions for this server

In GitHub repository settings, configure:

### Repository variables

- `IONOS_HOST=74.208.208.140`
- `IONOS_USER=deploy`
- `IONOS_PORT=22`
- `IONOS_PATH=/var/www/roofrxservices.com/current`

### Repository secret

- `IONOS_SSH_KEY`

Set `IONOS_SSH_KEY` to the **private key contents** of the deploy key, for example the contents of:

```text
~/.ssh/roofrx
```

If the workflow uses `deploy`, that user must be able to write to `IONOS_PATH`.

## First publish to the server

After nginx is configured and GitHub Actions secrets/variables are in place, either:

- push to `main`, or
- manually run the `Deploy to IONOS` workflow from GitHub Actions

The workflow will build the site and sync the static files to the configured server path.

Because this is a static-site deploy, nginx normally does **not** need a reload for content-only changes.

## What happens on each normal deploy

### Automated by GitHub Actions

- checkout of repo code
- Node setup
- dependency install with `npm ci`
- CSS/site build via `npm run build:css`
- deploy workflow validation via `docker build`
- SSH connection using the configured deploy key
- remote directory creation if missing
- `rsync` upload with deletion of removed files

### Manual only when infrastructure changes

- changing DNS
- changing nginx site config
- changing TLS certificates or domains
- changing firewall rules
- creating or rotating deploy users and SSH keys
- OS patching and server hardening

## Local development and verification

Useful local commands:

```bash
npm ci
npm run dev
npm run build:css
npm run verify
```

## Notes about the Docker files in the repo

The repo still includes:

- `Dockerfile`
- `docker-compose.yml`
- `nginx/default.conf`

Those files are still valid for local testing or for a future container-based hosting model, but they are **not** the runtime used by the current GitHub Actions deployment workflow to IONOS.

For the fresh IONOS box, the simpler and preferred production model is:

- Ubuntu host
- host-level nginx
- static files synced by GitHub Actions
