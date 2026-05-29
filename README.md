# Snip — a Multi-Project Git Submodule Demo

A single Git repository whose pieces are the three layers of **Snip**, a tiny URL
shortener. The teaching point: **one backend serving an identical API contract to two
very different clients** — an Angular web app and a terminal CLI.

Each layer lives on its **own branch** (`backend`, `frontend`, `cli`) with files at the
branch root. The **`main`** branch aggregates all three as **git submodules**, so they
appear as folders under `main` on GitHub while staying independent branches that teams
(or AI agents) can work on in isolation.

> These folders started life as **git worktrees** (great for parallel local work, but
> local-only — they never appear on the remote), then were converted to **submodules**
> so the folders also show up under `main` on GitHub.

## Snip — the app

| Layer | Branch | Stack | Job |
|-------|--------|-------|-----|
| Backend | `backend` | Bun (`Bun.serve`, in-memory `Map`, zero deps) | The API + short-code redirects |
| Frontend | `frontend` | Angular 19 (standalone, HttpClient) | Paste-a-URL form + links table with hit counts |
| CLI | `cli` | Node (zero deps, global `fetch`) | `snip add` / `snip ls` / `snip open` |

Both clients consume the **same** contract (backend at `http://localhost:3000`):

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `201` `{ code, url, shortUrl, hits, createdAt }` · `400` on invalid URL |
| `GET`  | `/api/links` | — | `200` array of all links |
| `GET`  | `/:code` | — | `302` redirect to the original URL (increments `hits`) · `404` if unknown |

Storage is an in-memory `Map` — restarting the backend clears all links (it's a demo).

## Disk Layout (main branch)

```
submodules-demo/          ← main branch
├── .gitmodules           ← maps each folder to a branch of this repo
├── README.md
├── backend/   @ <sha>    ← submodule, tracks branch `backend`  (Bun API)
├── frontend/  @ <sha>    ← submodule, tracks branch `frontend` (Angular app)
└── cli/       @ <sha>    ← submodule, tracks branch `cli`      (snip CLI)
```

Each `@ <sha>` is a *gitlink* — `main` pins each submodule to a specific commit on its
branch. In `main`'s tree these are `160000 commit` entries, which GitHub renders as
clickable folders.

## Cloning

Submodule folders are empty after a plain `git clone`. Populate them:

```bash
# Clone and pull submodules in one step
git clone --recurse-submodules https://github.com/kenken64/submodules-demo.git

# ...or, after a plain clone:
git submodule update --init --recursive
```

## Running Snip (dev)

Three terminals, from the `main` checkout (after submodules are populated):

```bash
# 1 — Backend (http://localhost:3000)
cd backend && bun start

# 2 — Frontend (http://localhost:4200)
cd frontend && npm install && npx ng serve

# 3 — CLI (talks to the same backend)
cd cli
node cli.js add https://anthropic.com
node cli.js ls
node cli.js open <code>
```

Open the web app at `http://localhost:4200`, shorten a URL, then watch the same link
show up via `node cli.js ls` — one backend, two clients.

## Working on a project (team / agent workflow)

Each submodule folder is a full checkout of its branch — work in it directly:

```bash
cd backend                 # you're now on the `backend` branch
# ...edit, then...
git add -A && git commit -m "..." && git push   # updates origin/backend
```

Then publish the advance by bumping the pointer in `main`:

```bash
cd ..
git submodule update --remote backend     # fast-forward the folder to latest origin/backend
git add backend && git commit -m "Bump backend submodule" && git push
```

That pointer-bump is the one extra step submodules add: the project commit and the
superproject commit are recorded separately.

## How the submodule layout was built

Each project is an orphan branch (independent history, files at root); `main` is an
orphan branch that wires them in as submodules of this same repo:

```bash
# one orphan branch per project, each with its own files at the root
git checkout --orphan backend   # add server.js, package.json …
git checkout --orphan frontend  # add the Angular project …
git checkout --orphan cli        # add cli.js, package.json …
git push -u origin backend frontend cli

# main aggregates them as submodules pinned to each branch
git checkout --orphan main
git rm --cached -r .
git submodule add -b backend  https://github.com/kenken64/submodules-demo.git backend
git submodule add -b frontend https://github.com/kenken64/submodules-demo.git frontend
git submodule add -b cli      https://github.com/kenken64/submodules-demo.git cli
git add .gitmodules backend frontend cli README.md
git commit -m "Add backend, frontend, cli as submodules"
git push -u origin main
```

The `-b <branch>` flag records the tracked branch in `.gitmodules`, so
`git submodule update --remote` can follow it later.

Per-project details live in each submodule's own README (`backend/README.md`,
`cli/README.md`).
