# EHRBase Client

A web-based client for [EHRBase](https://ehrbase.org), an open-source openEHR Clinical Data Repository. Manage EHRs, templates, and compositions, and run AQL queries — all from your browser.

## Features

- **EHR Management** — create EHRs, look them up by ID or subject, browse all EHRs on the server
- **Template Management** — upload OPT files, list templates, generate example compositions from a template
- **Composition Management** — post compositions in JSON, STRUCTURED, FLAT, or XML format; retrieve and list compositions per EHR
- **AQL Queries** — run Archetype Query Language queries with a built-in editor, view tabular results, and save/version queries on the server
- **Active context** — the selected EHR and composition are remembered across pages and persisted in `localStorage`
- **Dark mode** — system preference is detected automatically, with a manual toggle
- **Configurable server** — point the client at any EHRBase instance via the Settings page

## Getting started

### Prerequisites

- Node.js 18+
- A running EHRBase instance (see [EHRBase Docker quickstart](https://ehrbase.org/get-started))

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The dev server proxies `/ehrbase` to `http://localhost:8080` by default, matching a standard local EHRBase Docker setup.

### Configure the server

Go to **Settings** and enter your EHRBase base URL, username, and password. Use **Test Connection** to verify. Settings are saved in `localStorage`.

Common URLs:

| Setup | URL |
|---|---|
| Default Docker | `http://localhost:8080/ehrbase/rest/openehr/v1` |
| EHRBase Cloud sandbox | `https://sandbox.ehrbase.org/ehrbase/rest/openehr/v1` |

## Deployment

### Build

```bash
npm run build
# output in dist/
```

Serve the `dist/` directory from any static host (Nginx, Caddy, S3, Netlify, Vercel, etc.).

> **CORS:** the browser makes requests directly to your EHRBase server, so EHRBase must allow your hosting origin. Set `CORS_ALLOWED_ORIGINS` in your EHRBase configuration accordingly.

### GitHub Pages

Push to `main` and the included GitHub Actions workflow (`.github/workflows/deploy.yml`) will build and deploy automatically. Enable GitHub Pages in your repository settings under **Settings → Pages → Source: GitHub Actions**.

## Tech stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Data fetching | TanStack Query v5 |
| HTTP | Axios |
| Routing | React Router v7 |
