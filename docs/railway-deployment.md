# Deploying Snip to Railway

This guide walks through deploying **Snip** to [Railway](https://railway.app), step by
step, using the screenshots in [`screens/`](screens/). The deploy target is the
**`bundle` branch** — the generated, self-contained release (Bun server + built
Angular UI + CLI) that ships its own `Dockerfile` and `railway.json`.

> **Why not `main`?** `main` is the docs-only starter branch — it has no app code and
> no Dockerfile, so a deploy from it *will fail*. The screenshots below show that
> failure on purpose, then how to fix it.

## Prerequisites

- A Railway account with the **Railway GitHub App** installed and granted access to
  `kenken64/submodules-demo`.
- The `bundle` branch pushed to GitHub (regenerate it with
  `node scripts/build-bundle.mjs --push` if needed).

## Step 1 — Create a new project

From the Railway dashboard, click **New Project**. A menu appears with several
sources (GitHub Repository, Database, Template, Docker Image, …).

Choose **GitHub Repository**. Although a Docker *image* deploy is offered, we deploy
from the repo instead — the `bundle` branch already contains the `Dockerfile`, and
connecting the repo gives us automatic redeploys on push.

![New Project menu with source options](screens/Screenshot%202026-07-23%20at%201.08.57%20PM.png)

## Step 2 — Pick the repository

A repository picker opens. If the repo isn't listed, click **Configure GitHub App**
to grant Railway access, then **Refresh**.

![Repository picker](screens/Screenshot%202026-07-23%20at%201.09.02%20PM.png)

Select **`kenken64/submodules-demo`**.

![Selecting kenken64/submodules-demo](screens/Screenshot%202026-07-23%20at%201.09.12%20PM.png)

## Step 3 — Railway builds… the wrong branch

Railway immediately creates a service and starts building the repo's default branch
(`main`).

![First build starting](screens/Screenshot%202026-07-23%20at%201.09.21%20PM.png)

The build **fails** — expected. `main` is the docs-only starter: there's nothing to
build and no Dockerfile, so the *Build image* step aborts with
*"Failed to build an image"*.

![Failed deployment on main](screens/Screenshot%202026-07-23%20at%201.09.27%20PM.png)

## Step 4 — Point the service at the `bundle` branch

Open the service and go to **Settings → Source**. Under **Branch connected to
production**, change `main` to **`bundle`** using the dropdown. Leave
**Auto deploys when pushed to GitHub** enabled — every future push to `bundle`
(i.e. every `build-bundle.mjs --push` release) redeploys automatically.

![Settings → Source: repo, root directory, and branch](screens/Screenshot%202026-07-23%20at%201.09.36%20PM.png)

> **Alternative:** deploy the `solution` branch instead and use **Add Root
> Directory** (visible in the same screen) to set the root to `bundle/`. That relies
> on Railway checking out the git submodules, so the branch-switch approach above is
> the simpler and more reliable one.

## Step 5 — Confirm the Dockerfile builder

Go to **Settings → Build**. The **Builder** should read **Dockerfile** with
**Dockerfile Path** `/Dockerfile`. Railway picks this up automatically from the
`railway.json` on the `bundle` branch (`"builder": "DOCKERFILE"`), so normally
there's nothing to change — just verify.

![Settings → Build: Dockerfile builder](screens/Screenshot%202026-07-23%20at%201.10.10%20PM.png)

## Step 6 — Apply the staged changes

Railway *stages* settings edits rather than applying them instantly — notice the
service card marked **Edited · 1 Change** and the purple **Deploy (⇧+Enter)** button
in the top bar. Click **Deploy** to apply the changes and trigger a fresh build from
the `bundle` branch.

## Step 7 — Expose the service with a public domain

The service starts **unexposed**. Go to **Settings → Networking** and under
**Public Networking** click **Generate Domain**.

![Settings → Networking: Generate Domain](screens/Screenshot%202026-07-23%20at%201.09.49%20PM.png)

Railway asks which port the app listens on and mints a domain such as
`submodules-demo-production.up.railway.app`.

![Generated public domain](screens/Screenshot%202026-07-23%20at%201.09.59%20PM.png)

> **Port check — the one gotcha.** The bundle server binds to `$PORT`
> (Dockerfile default `3000`). The domain's target port must match, or the site
> returns *"Application failed to respond"*. Two valid setups:
>
> - Set the domain's target port to **3000** (edit it via the pencil icon), **or**
> - Keep Railway's suggested port (e.g. `8080` as in the screenshot) and add a
>   service variable `PORT=8080` under the **Variables** tab so the server binds to
>   the same port.

## Step 8 — Verify

Open the generated URL — the Angular UI should load. Then exercise the API contract:

```bash
BASE=https://submodules-demo-production.up.railway.app

# shorten a URL → 201 { code, url, shortUrl, hits, createdAt }
curl -s -X POST "$BASE/api/links" \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com"}'

# list links → 200 [...]
curl -s "$BASE/api/links"

# follow a short code → 302 to the original
curl -si "$BASE/<code>" | head -3
```

The CLI works against the deployment too:

```bash
SNIP_API=$BASE node cli/cli.js ls
```

## Notes

- **Storage is in-memory by design** — every redeploy or restart wipes all links.
  Don't "fix" this with a database.
- **Releases auto-deploy**: `node scripts/build-bundle.mjs --push` updates the
  `bundle` branch, which Railway is watching, so publishing a release is also a
  deploy.
