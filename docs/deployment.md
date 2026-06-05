# Roofrx Deployment Guide

This repo is set up so the same code pushed to GitHub can be run on any machine in one of two ways:

- local development with Node.js
- production-style deployment with Docker + nginx

## Current production shape from the earlier server inspection

The earlier live setup appeared to be a simple static-site runtime:

- one `nginx:alpine` container serving the site
- the container was referred to as `intermtn-nginx`
- the site files were served from `/home/intermtnroofing/html`
- nginx config lived under `/home/intermtnroofing/nginx`
- TLS certificates were managed outside the app code with Docker volumes and Certbot

That setup worked, but it depended on machine-specific state. The goal of the files in this repo is to move that knowledge into version-controlled deployment artifacts so the site can be rebuilt on any future machine.

## What is in the repo

- `Dockerfile` builds the static site and packages it into an `nginx` image
- `docker-compose.yml` runs that image as the standard production runtime
- `nginx/default.conf` defines how the static files are served
- `package.json` defines the local development and verification commands

## Run on any machine for development

Requirements:

- Node.js 20+ recommended
- npm

Commands:

```bash
git clone git@github.com:nbegmatov/roofrx.git
cd roofrx
npm ci
npm run dev
```

Useful commands:

```bash
npm run build:css
npm run verify
```

## Run on any machine in a production-style container

Requirements:

- Docker
- Docker Compose

Commands:

```bash
git clone git@github.com:nbegmatov/roofrx.git
cd roofrx
docker compose up -d --build
```

Open the site at:

```text
http://127.0.0.1:8080
```

To use a different host port:

```bash
ROOFRX_PORT=9090 docker compose up -d --build
```

## Redeploy after new changes are pushed to GitHub

On the target machine:

```bash
git pull
docker compose up -d --build
```

That rebuilds the image from the latest repo state and restarts the container with the new files.

## Stop the running site

```bash
docker compose down
```

## Notes about production hosting

This repo now contains the portable application runtime, but a public production deployment still needs host-specific infrastructure such as:

- DNS pointing the domain to the machine
- TLS certificate management
- firewall and network rules
- backups and monitoring if desired

A simple first production setup is:

- one Linux VM
- Docker installed
- this repo cloned onto the VM
- `docker compose up -d --build`
- optional reverse proxy / TLS in front if you want HTTPS on the public domain
