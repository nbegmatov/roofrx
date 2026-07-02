# RoofRx — Operations Runbook

Procedures for day-to-day operations and emergencies. Written for an agent or person who has SSH access via Tailscale and needs to operate the server without asking the owner.

**Before running any command on the VPS:** Connect your workstation to Tailscale (`tailscale up`) and SSH in:

```bash
ssh -i ~/.ssh/roofrx root@100.73.70.66
```

---

## Routine operations

### Check if Nginx is running

```bash
systemctl status nginx
```

Green `active (running)` means it is up and serving requests. If it shows `inactive` or `failed`, see "Restart Nginx" below.

### Check PM2 process list

```bash
pm2 list
```

Shows all managed processes, their status (`online` / `stopped` / `errored`), uptime, and restart count. A high restart count means the process is crash-looping — check logs.

```bash
pm2 logs roofrx-api --lines 100
```

### Check UFW firewall status

```bash
ufw status verbose
```

Expected output includes `80,443/tcp ALLOW IN Anywhere` and `22/tcp on tailscale0 ALLOW IN Anywhere`. If port 22 shows as open to `Anywhere` without the `on tailscale0` qualifier, the SSH restriction has been lost — re-apply it immediately (see [docs/infrastructure.md](infrastructure.md) Phase 1.2).

### Check fail2ban status

```bash
fail2ban-client status
fail2ban-client status sshd
```

Shows active jails and currently banned IPs. Run these after any suspected brute-force attempt.

### Unban an IP from fail2ban

```bash
fail2ban-client set sshd unbanip <IP_ADDRESS>
```

Do this if a legitimate admin's IP gets banned after failed SSH attempts.

### Tail application logs

Nginx access and error logs:

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

PM2 application logs (all processes):

```bash
pm2 logs
```

PM2 logs for a specific process:

```bash
pm2 logs roofrx-api
```

System auth log (useful for checking SSH attempts):

```bash
tail -f /var/log/auth.log
```

---

## Deployment

### Trigger a manual deploy

Go to the GitHub repo → **Actions** → select the workflow → **Run workflow** → choose `main` branch → **Run workflow**.

Two workflows can be run independently:
- `Deploy to IONOS` — deploys `roofrxservices.com`
- `Deploy intermtnroofing.com to IONOS` — deploys `intermtnroofing.com`

Both are also triggered automatically on every push to `main`.

### Verify a deploy succeeded

1. Check the workflow run in GitHub Actions — all steps should be green.
2. SSH into the VPS and check the file timestamps in the web root:

```bash
ls -lt /var/www/roofrxservices.com/current/ | head -20
```

The most recently modified files should match what you pushed.

3. Load the site in a browser and verify the change is visible.

### Restart Nginx safely

Never kill the Nginx master process directly. Use:

```bash
nginx -t           # test config for syntax errors first
systemctl reload nginx   # graceful reload (keeps connections alive)
```

Only use `restart` if `reload` does not pick up the change:

```bash
systemctl restart nginx
```

If `nginx -t` fails, there is a syntax error in a config file. Fix it before reloading — Nginx will refuse to reload with a bad config, which protects you from accidentally taking the site down.

### Restart a PM2 process

```bash
pm2 restart roofrx-api
```

This performs a graceful restart. For a hard restart (terminates and starts fresh):

```bash
pm2 stop roofrx-api
pm2 start roofrx-api
```

### Roll back to a previous deploy

The `rsync --delete` flag in the deploy workflow means each deploy is a full sync — there is no automatic rollback artifact on the server.

To roll back to a specific commit:

1. In the GitHub repo, find the commit you want to roll back to.
2. Go to **Actions** → `Deploy to IONOS` → find a successful run from that commit, or:
3. Create a temporary branch from that commit and trigger a `workflow_dispatch` run against it.

If you need to roll back urgently and cannot wait for a workflow run, the previous file state can be restored from the deploy that last succeeded — check GitHub Actions history for the last green run.

---

## Emergency procedures

### VPS is unreachable via Tailscale

If `ssh root@100.73.70.66` times out or refuses connection, Tailscale on the server may have stopped.

**Do not try to re-open port 22 publicly unless all other options are exhausted.**

**Step 1 — Use the IONOS console (no SSH required):**

1. Go to [cloud.ionos.com](https://cloud.ionos.com) and log in with `nursultan.begmatov@gmail.com`.
2. Navigate to **Server & Cloud** → find the VPS (IP `74.208.208.140`).
3. Click the **Console** button. This opens a VNC/browser terminal directly to the server — no SSH, no Tailscale needed.

**Step 2 — Diagnose and restart Tailscale from the console:**

```bash
systemctl status tailscaled
```

If stopped:

```bash
systemctl start tailscaled
tailscale up
```

If the auth key expired (node was removed from the tailnet):

```bash
tailscale up --authkey <new-tskey-auth-...>
```

Generate a new auth key from [login.tailscale.com/admin/keys](https://login.tailscale.com/admin/keys). Store it in the password manager — it only needs to be used once.

**Step 3 — Verify Tailscale is back:**

```bash
tailscale status
```

The node should appear as connected. Then confirm SSH access from your workstation before closing the console.

**Last resort only — temporarily re-open public SSH:**

If Tailscale cannot be restored via the console (e.g., `tailscaled` binary is corrupted), as a last resort:

```bash
ufw allow OpenSSH
ufw reload
```

SSH in via the public IP (`74.208.208.140`), fix the issue, then **immediately** re-apply the restriction:

```bash
ufw delete allow OpenSSH
ufw reload
ufw status verbose    # confirm 22 is no longer open publicly
```

Never leave public SSH open longer than necessary.

### Site is down (Nginx not serving)

1. SSH in via Tailscale.
2. Check Nginx status: `systemctl status nginx`
3. Check for config errors: `nginx -t`
4. Check error log: `tail -50 /var/log/nginx/error.log`
5. If config is valid and service is stopped: `systemctl start nginx`
6. If error log shows a port conflict (something else on 80/443): `ss -tlnp | grep -E ':80|:443'`

### Disk full

```bash
df -h          # check overall disk usage
du -sh /var/log/nginx/*   # often the biggest offender
du -sh /var/www/*         # check site directories
```

PM2 logs can also accumulate:

```bash
pm2 flush      # clear all PM2 log files
```

For Nginx logs, rotate manually if logrotate hasn't run:

```bash
logrotate -f /etc/logrotate.d/nginx
```

### TLS certificate expired or about to expire

Certbot auto-renewal is managed by a systemd timer. Check its status:

```bash
systemctl status certbot.timer
systemctl status certbot.service
```

To force a renewal test (does not issue a real cert):

```bash
certbot renew --dry-run
```

To force an actual renewal:

```bash
certbot renew --force-renewal
systemctl reload nginx
```
