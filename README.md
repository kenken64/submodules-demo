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
├── server.js     ← Bun server: /api + /:code redirects + serves ./public
├── public/       ← built Angular web app (ng build output)
├── cli.js        ← the snip CLI
├── .env          ← PUBLIC_DIR=./public (Bun auto-loads this)
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

## Regenerate

From the `main` checkout:

```bash
node scripts/build-bundle.mjs        # rebuild from latest source branches
```
