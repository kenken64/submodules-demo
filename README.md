# Snip — Bundle (whole app, one process)

The entire Snip app packaged for deployment: a single **Bun** server that serves the
**API**, the **short-code redirects**, and the **built Angular web UI** — with the
**CLI** alongside.

This branch is **generated output**, assembled from the `backend`, `frontend`, and `cli`
branches by `scripts/build-bundle.mjs` (and the GitHub Action) on the `main` branch.
Don't hand-edit files here — they're overwritten on the next build.

## Layout

```
bundle/
├── server.js      ← Bun server: /api + /:code redirects + serves ./public
├── public/        ← built Angular web app (ng build output)
├── cli.js         ← the snip CLI
├── .env           ← PUBLIC_DIR=./public (Bun auto-loads this)
├── Dockerfile     ← one image runs the whole app (Bun on alpine)
├── .dockerignore
├── railway.json   ← Railway: build from the Dockerfile
└── package.json
```

## Run the whole app

```bash
cd bundle
bun start            # http://localhost:3000 — web UI + API + redirects, one process
```

Open `http://localhost:3000`, shorten a URL in the web UI, then from another terminal
the CLI talks to the very same server:

```bash
node cli.js add https://anthropic.com
node cli.js ls
node cli.js open <code>
```

## Docker

The whole app runs from one image — Bun serving the API, redirects, and web UI:

```bash
docker build -t snip-bundle .
docker run --rm -p 3000:3000 snip-bundle      # http://localhost:3000
```

The server honours `$PORT` (default `3000`) and Bun binds `0.0.0.0`, so the same image
runs unchanged on any container host.

## Deploy to Railway

Railway builds straight from the `Dockerfile` (`railway.json` selects the Dockerfile
builder). Two ways to deploy this folder:

- **From the `bundle` branch** — point a Railway service at this repo and set the
  deploy branch to `bundle` (the `Dockerfile` is at the branch root).
- **From `main`** — point the service at the repo and set the service **Root
  Directory** to `bundle/`.

Railway injects `$PORT` automatically (the server reads it). For correct short links,
the server uses Railway's `RAILWAY_PUBLIC_DOMAIN` to build `shortUrl`s as
`https://<your-app>.up.railway.app/<code>` — no config needed. To force a specific
host, set `BASE_URL` in the service variables; it takes precedence.

> Storage is an in-memory `Map`, so links reset whenever the container restarts or
> redeploys — fine for a demo, not for persistence.

## Regenerate

From the `main` checkout:

```bash
node scripts/build-bundle.mjs        # rebuild from latest source branches
```
