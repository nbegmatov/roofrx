# Roofing Company Website (Static Showcase Site)

Static multi-page site built with **HTML** + **Tailwind CSS v4**. CSS is compiled through the CLI; local development runs a server and rebuilds styles when files change.

## Requirements

- **[Node.js](https://nodejs.org/)** — the latest **LTS** is recommended (or at least Node 18+ for native ES module support used by this project).

## Installation and First Run

```bash
git clone git@github.com:nbegmatov/roofrx.git
cd roofrx
npm install
```

Build the CSS first (this is required before any deployment; when using `npm run dev`, the build runs automatically):

```bash
npm run build:css
```

## Development Mode (Recommended)

This command starts the local site on **port 5173**, watches `css/source.css`, and rereads the Tailwind HTML bundles to rebuild **all** required files listed in `scripts/css-bundles.mjs`.

```bash
npm run dev
```

Open in your browser: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

- Home page: `/index.html` (may open automatically).
- Content editor admin page (local only): [http://127.0.0.1:5173/admin/index.html](http://127.0.0.1:5173/admin/index.html).

Stop the server with **Ctrl+C** in the terminal.

## Current Roofrx Refresh Status (Handoff)

This section is a handoff note for the next agent picking up the current Roofrx website refresh.

### Current Service Taxonomy

The active service structure is now:

- Group 1: Core roofing
  - Roof Replacement
  - Roof Repairs / Maintenance
  - Flat Roofs
  - Metal Roofs
- Group 2: Solar
  - Solar Panels
- Group 3: Claims & storm
  - Insurance Claims
  - Storm Damage

### Completed Website Changes

- `index.html`
  - Homepage services section refactored into the 3 grouped service bands above.
  - Header updated toward the target conversion funnel with `Services`, `Projects`, `Reviews`, `Areas Served`, and `Blog`.
  - Hero CTA updated to `Book your free roof inspection`.
  - Added post-hero trust bar, stronger `Why Choose Us`, a homepage blog/learning section, and a final CTA band before the footer.
- `services.html`
  - Services page refactored to the 7-service grouped taxonomy with anchors for each service.
- `content/editable.json`
  - Homepage/services metadata updated to match the new service positioning.
- Generated files
  - Tailwind CSS outputs in `css/pages/*.css` were rebuilt.
  - `sitemap.xml` was regenerated during the local build flow.

### Local Preview

To resume quickly:

```bash
npm install
npm run dev
```

Then review:

- Homepage: `http://127.0.0.1:5173/index.html`
- Services page: `http://127.0.0.1:5173/services.html`

### Recommended Next Steps

- Visually review the homepage and services page together after the grouped-service changes.
- Decide whether `Roof Replacement`, `Solar Panels`, and `Insurance Claims` should remain section-only on `services.html` or get dedicated detail pages.
- Prepare a focused commit for the site-facing changes when ready.
- Follow `docs/deployment.md` for the preferred production deployment model.

### Port Already in Use

If something is already running on `5173`, temporarily change the `dev` script in `package.json` by replacing `--port=5173` with any free port.

## Main Commands

| Command | Purpose |
|--------|------------|
| `npm run dev` | Build CSS + watch + local server (`live-server`) |
| `npm run build:css` | One-time build of all bundles into `css/pages/*.css` |
| `npm run watch:css` | CSS watch only (no server) |
| `npm run content:scan` | Update `content/editable.json`: pull keys from `data-editable*` in HTML |
| `npm run content:apply` | Write `content/editable.json` back into HTML (+ updates `content/page-meta.json`) |

For more on the content pipeline, see the scripts `scripts/apply-editable.mjs` and `scripts/scan-editable.mjs` in the codebase.

## Structure (Important)

```
css/source.css              — Tailwind entry file (@theme, custom classes in @layer components)
scripts/css-bundles.mjs     — which HTML files feed which output file in css/pages/
css/pages/*.css             — generated CSS (rebuild through npm)
content/                    — editable.json and supporting page data
admin/                      — simple local admin UI for editing text in JSON
```

The build input list is defined in **`scripts/css-bundles.mjs`**. When you add new pages with Tailwind classes, you may need to include them there and then run `npm run build:css`.

## Deployment

The site is a set of static files. Before uploading to hosting:

1. Run `npm install` and `npm run build:css` in a clean build environment if needed.
2. Upload the **project root without** the `node_modules/` directory (it is in `.gitignore`).

For portable startup and repeatable deployment from any server, see `docs/deployment.md`.

## Not Included in the Repository

The **`node_modules/`** directory is installed locally with `npm install`; it is not stored in Git because of `.gitignore`.

---

If something does not start, check your Node version (`node -v`) and make sure you are running the commands from the repository root (where `package.json` is located).
