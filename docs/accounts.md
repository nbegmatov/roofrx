# RoofRx — Account Registry

Ownership and account facts only. Never put passwords, API keys, tokens, or secrets in this file. Credentials live in GitHub Secrets (for CI), a password manager (for interactive use), or `.env` on the server (for runtime config, never committed).

| Service | Account email | Purpose | Notes |
|---|---|---|---|
| IONOS | nursultan.begmatov@gmail.com | VPS hosting + Object Storage | VPS at `74.208.208.140`. Account holder for hosting and DNS. |
| GitHub | (add) | Code repo, Actions CI/CD | Repo: `github.com/nbegmatov/roofrx` (private) |
| GoHighLevel | (add) | CRM, lead pipeline, sequences | |
| Tailscale | nursultan.begmatov@gmail.com | VPN for server/admin access | IONOS server at `74.208.208.140` joined tailnet. Auth keys generated from Tailscale admin console — never committed. |
| Google Workspace | (pending setup) | Business email on `roofrxservices.com` | Not yet provisioned as of this doc |

When a new account is created for the business, add a row here in the same commit as whatever change introduced the need for it (e.g. adding Tailscale → add the Tailscale row in that PR). Keep this table the single source of truth for "what account owns what" so it doesn't have to be reconstructed from memory later.
