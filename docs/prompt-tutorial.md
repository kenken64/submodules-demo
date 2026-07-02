# Recreate This Repo, Prompt by Prompt

This tutorial rebuilds **Snip** — the tiny URL shortener behind this demo — and the
**git-submodule architecture** it ships in, using nothing but a sequence of prompts you
paste into an AI coding agent (written for [Claude Code](https://claude.com/claude-code),
but any agent that can run shell commands works).

Each step gives you:

1. **Context** — what you're about to build and why.
2. **The prompt** — a self-contained block to paste into your agent, verbatim.
3. **Verify** — commands to confirm the step worked before moving on.

By the end you'll have recreated the final state of this repository: one Git repo whose
branches are the layers of a working app, aggregated by a `main` superproject, with a
generated release branch, a Docker image, and CI that keeps both fresh.

> The prompts recreate the repo's **final state**, not its commit-by-commit history.
> (Historically this repo evolved from a Hello-World worktree demo into Snip — see
> [Appendix A](#appendix-a--concepts-this-repo-teaches) for that story.)

---

## What you're building

**Snip** is deliberately tiny: paste a URL, get a short link, watch hit counts tick up.
The teaching point is architectural — **one backend serving an identical HTTP contract
to two very different clients**:

```
        ┌──────────────────────┐          ┌──────────────────────┐
        │   Angular web app    │          │   snip CLI (Node)    │
        │   localhost:4200     │          │   your terminal      │
        └──────────┬───────────┘          └───────────┬──────────┘
                   │        identical HTTP contract   │
                   └─────────────────┬────────────────┘
                                     ▼
                     ┌───────────────────────────────┐
                     │   Bun backend  :3000          │
                     │   POST /api/links   create    │
                     │   GET  /api/links   list      │
                     │   GET  /:code       302 + hit │
                     └───────────────────────────────┘
```

And the repo layout is the second teaching point — **every layer is an orphan branch of
the same repository**, and `main` mounts them all as submodules:

```
one repo ──┬── backend    (orphan branch)   Bun API server
           ├── frontend   (orphan branch)   Angular 19 web app
           ├── cli        (orphan branch)   zero-dep Node CLI
           ├── bundle     (orphan branch)   GENERATED whole-app release
           └── main       (orphan branch)   superproject:
                                            ├── .gitmodules  → mounts the 4 above
                                            ├── scripts/build-bundle.mjs
                                            └── .github/workflows/{bundle,docker}.yml
```

| Layer | Branch | Stack | Job |
|-------|--------|-------|-----|
| Backend | `backend` | Bun (`Bun.serve`, in-memory `Map`, zero deps) | API + short-code redirects |
| Frontend | `frontend` | Angular 19 (standalone, signals, HttpClient) | Paste-a-URL form + links table |
| CLI | `cli` | Node (zero deps, global `fetch`) | `snip add` / `snip ls` / `snip open` |
| Bundle | `bundle` | Generated: Bun server + built UI + CLI | The whole app, one process, one Docker image |
| Superproject | `main` | `.gitmodules` + build script + CI | Aggregates everything |

### The API contract (referenced throughout)

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `201` `{ code, url, shortUrl, hits, createdAt }` · `400` on invalid JSON/URL |
| `GET`  | `/api/links` | — | `200` array of all links (same shape) |
| `GET`  | `/:code` | — | `302` redirect to the original URL, increments `hits` · `404` if unknown |

Storage is an in-memory `Map` — restarting clears all links. That's by design; it's a
demo, not a database.

---

## Prerequisites

- **git** (2.30+), a **GitHub account**, and one **empty GitHub repo** to push into
  (create it now — no README, no license; call it e.g. `snip-demo`)
- **Bun** 1.x (`curl -fsSL https://bun.sh/install | bash`) — runs the backend
- **Node.js** 20+ (24 recommended — it's what CI uses) and **npm** — runs the CLI and the Angular build
- **Docker** (optional — Step 7 and local image builds)
- **`gh` CLI** (optional — handy for triggering workflows)

Throughout the prompts, replace:

- `<REPO_URL>` → your empty repo's URL, e.g. `https://github.com/you/snip-demo.git`

> **Note on this original repo:** here, `main` lives in `kenken64/submodules-demo` while
> `.gitmodules` points the submodules at branches of a *second* repo,
> `kenken64/worktree-demo` — a leftover from the demo's worktree origins. A submodule URL
> can point anywhere, so both arrangements work. This tutorial uses **one repo for
> everything** (the layout the README documents), which is simpler and self-contained.

---

## How to use the prompts

- Paste each prompt **whole** — they're deliberately self-contained (the API contract is
  repeated wherever an agent needs it, so no prompt depends on chat history).
- Run the **Verify** commands yourself between steps. Don't stack prompts on a broken base.
- The prompts tell the agent to commit and push; each step ends with a branch on GitHub.
- Steps 1–3 are order-independent. Everything from Step 4 on depends on 1–3.

---

## Step 1 — The backend, on its own branch

Everything starts with the API. It lives on a branch named `backend` with its files at
the **branch root** — no `backend/` subfolder. That's the trick that makes submodules
work later: each branch *is* a complete little project.

**The prompt:**

```text
Create a new directory called snip-demo and initialize a git repository in it whose
FIRST branch is named "backend" (git init -b backend). This repo will eventually hold
several independent orphan branches — one per project layer, each with its files at the
branch root. The backend is the first layer.

Build the backend of "Snip", a tiny URL shortener, using Bun with ZERO npm dependencies
(no package installs at all — only Bun built-ins and web-standard APIs).

File 1 — server.js, a single Bun.serve() HTTP server:

Configuration, read from environment variables via Bun.env:
- PORT: listen port, default 3000.
- BASE_URL: the public origin used to build the shortUrl values we hand out. If unset,
  fall back to RAILWAY_PUBLIC_DOMAIN (Railway injects this at runtime) as
  "https://<domain>"; if that's unset too, use "http://localhost:<PORT>".
- PUBLIC_DIR: optional, default null. When set, the server ALSO serves static files
  from this directory (used later by a bundled release that includes a built web app).

Storage: a module-level in-memory Map from code -> { url, hits, createdAt }. No
persistence: restarting the server clears all links, and that is intentional.

Short codes: 6 characters drawn from the base62 alphabet (A-Z, a-z, 0-9), generated
with crypto.getRandomValues, re-generating in a loop on the (unlikely) collision.

URL validation: accept only strings that parse with new URL() and whose protocol is
http: or https:.

CORS: every JSON response includes open CORS headers —
Access-Control-Allow-Origin: *, Access-Control-Allow-Methods: GET, POST, OPTIONS,
Access-Control-Allow-Headers: Content-Type — so a browser app on another origin
(the Angular dev server) can call the API. Handle OPTIONS preflight for any path by
returning 204 with those headers.

Routes, in this order:
1. OPTIONS (any path) -> 204 + CORS headers.
2. POST /api/links with JSON body { "url": "..." }:
   - unparseable JSON -> 400 { "error": "Invalid JSON body" }
   - missing/invalid URL -> 400 with an error message telling the caller to provide a
     valid http(s) URL in { "url": ... }
   - success -> 201 { code, url, shortUrl, hits, createdAt } where
     shortUrl = BASE_URL + "/" + code, hits starts at 0, createdAt is an ISO timestamp.
3. GET /api/links -> 200 JSON array of every stored link in that same shape.
4. GET <any path>: if PUBLIC_DIR is set, try to serve the static file at that path
   (serve index.html for "/"); if the file exists, return it. An existing asset WINS
   over a short code with the same name.
5. GET /<code> (a single path segment): if the code exists, increment its hits counter
   and return 302 with a Location header pointing at the original URL (include the CORS
   headers); otherwise 404 { "error": "Unknown short code" }.
6. Anything else -> 404 { "error": "Not found" }.

On startup, print a line like "Snip backend running on http://localhost:3000".

File 2 — package.json: name "snip-backend", version 1.0.0, description mentioning it's
an in-memory URL shortener backend on Bun, "type": "module", and scripts:
  "start": "bun run server.js"
  "dev":   "bun --watch server.js"

File 3 — README.md: title "Snip — Backend (Bun)". Briefly explain: single Bun.serve
process, in-memory Map, zero dependencies, restart clears links by design, and that
this one backend serves two clients (an Angular web app and a CLI) through the same
contract. Include: how to run (bun start / bun run dev), the PORT and BASE_URL env
vars, a markdown table of the three API routes above, a note that codes are 6-char
base62 from crypto.getRandomValues and that CORS is open with OPTIONS preflight
handling, and curl examples for create, list, and following a redirect with -i.

Then: commit everything on the backend branch with message
"Add Snip backend (Bun URL shortener)", add <REPO_URL> as the origin remote, and
push with: git push -u origin backend
```

**Verify:**

```bash
cd snip-demo
bun start                 # in terminal 1 → "Snip backend running on http://localhost:3000"

# terminal 2:
curl -X POST localhost:3000/api/links -H 'content-type: application/json' \
     -d '{"url":"https://anthropic.com"}'          # → 201 {"code":"...","shortUrl":...}
curl localhost:3000/api/links                      # → array with your link, hits: 0
curl -i localhost:3000/<code>                      # → 302, Location: https://anthropic.com
curl localhost:3000/api/links                      # → hits: 1
curl -X POST localhost:3000/api/links -H 'content-type: application/json' \
     -d '{"url":"not-a-url"}'                      # → 400
```

---

## Step 2 — The Angular frontend, on its own orphan branch

Now the first client. It lives on an **orphan branch** — a branch that shares *no
history* with `backend`, created with `git checkout --orphan`. Same repo, completely
independent contents.

**The prompt:**

```text
In the snip-demo repo (currently on the backend branch), create an ORPHAN branch named
"frontend" with a completely empty tree:

  git checkout --orphan frontend
  git rm -rf .

(The backend files disappear from the working tree — that's correct; they live safely
on the backend branch. Orphan = independent history, files at the branch root.)

Scaffold an Angular 19 app named "snip-frontend" in the CURRENT directory (not a
subfolder): use npx @angular/cli@19 ng new snip-frontend --directory . --skip-git
--routing=false --style=css --ssr=false. Keep the generated .gitignore, .editorconfig,
.vscode/, angular.json, tsconfig files, and the default Karma test setup.

Then replace the placeholder app with the Snip UI. It talks to the Snip backend at
http://localhost:3000, whose contract is:
  POST /api/links  body { "url": "..." }  -> 201 { code, url, shortUrl, hits, createdAt }
                                             or 400 { "error": "..." }
  GET  /api/links                         -> 200 array of those link objects

src/app/links.service.ts:
- export interface Link { code: string; url: string; shortUrl: string; hits: number;
  createdAt: string; }
- @Injectable({ providedIn: 'root' }) LinksService using inject(HttpClient), with a
  private api base 'http://localhost:3000' and two methods:
  list(): Observable<Link[]> (GET api + '/api/links') and
  create(url: string): Observable<Link> (POST api + '/api/links' with { url }).

src/app/app.config.ts: providers are provideZoneChangeDetection({ eventCoalescing:
true }) and provideHttpClient().

src/app/app.component.ts — a standalone component (selector app-root, templateUrl +
styleUrl) whose imports are [FormsModule]:
- inject LinksService as a private readonly field.
- Fields: url = '' (a plain string bound with ngModel), and three signals:
  links = signal<Link[]>([]), error = signal<string | null>(null),
  lastShort = signal<string | null>(null).
- The constructor calls refresh().
- refresh(): subscribe to list(); on next, set the links signal; on error, set the
  error signal to 'Cannot reach backend at http://localhost:3000'.
- shorten(): trim this.url; return silently if empty. Validate client-side that it
  parses as a URL with protocol http: or https: (a private isValidHttpUrl helper using
  new URL in a try/catch); if invalid, set error to 'Enter a valid http(s) URL' and
  stop. Otherwise clear the error, call create(url); on success set lastShort to the
  returned shortUrl, clear the input, and refresh(); on error set the error signal to
  the server's message (err?.error?.error) falling back to 'Failed to shorten URL'.

src/app/app.component.html — use the modern @if/@for control flow, no *ngIf:
- <main> with <h1>Snip</h1> and a subtitle paragraph (class "sub"):
  "Paste a URL, get a short link — the same API the CLI uses."
- A <form (ngSubmit)="shorten()"> with a required type="url" input named "url",
  placeholder "https://example.com/very/long/link", bound with [(ngModel)]="url",
  and a "Shorten" submit button.
- @if (lastShort(); as short) -> a paragraph (class "result") showing "Short link:"
  and an <a> to it with target="_blank" rel="noopener".
- @if (error(); as err) -> a paragraph (class "error") with the message.
- A <table> with header row Short | Original | Hits. @for (link of links(); track
  link.code) -> a row where: the Short cell links to link.shortUrl (target _blank,
  rel noopener) showing link.code; the Original cell has class "orig" and
  [title]="link.url" showing link.url; the Hits cell shows link.hits.
  @empty -> a single row with colspan 3, class "empty", saying "No links yet."

src/app/app.component.css — clean, minimal, modern:
- :host as a centered block column, max-width 640px, margin 3rem auto, system-ui font
  stack, near-black text (#1a1a1a).
- Muted subtitle (#666). The form is a flex row with 0.5rem gap; the input flexes,
  0.6rem/0.75rem padding, 1px #ccc border, 6px radius; the button is #2d6cdf with
  white text, no border, 6px radius, pointer cursor, darkening to #1f57bd on hover.
- .result is a soft blue box (#eef5ff, 6px radius, padded). .error is #b00020.
- Full-width collapsed table, left-aligned cells with 1px #eee bottom borders; muted
  bold headers; .orig capped at 320px with ellipsis overflow; .empty muted and
  centered. Links #2d6cdf, no underline until hover.

src/styles.css: just html, body { margin: 0; background: #fafafa; }
src/index.html keeps title "SnipFrontend".

The scaffolded app.component.spec.ts still tests the removed boilerplate (a `title`
property); tests are not this demo's focus — either update the spec minimally to
compile against the new component or leave it, but do not build the app around it.

Confirm `npx ng build` succeeds (output lands in dist/snip-frontend/browser — later
tooling depends on that exact path; do NOT rename the project or outputPath).

Commit everything on the frontend branch with message
"Add Snip Angular frontend (form + links table)" and push with:
git push -u origin frontend
```

**Verify:**

```bash
# terminal 1 — backend must be running:
git checkout backend && bun start
# (or run it from a second clone / worktree if you don't want to switch branches)

# terminal 2:
git checkout frontend
npm install && npx ng serve          # → http://localhost:4200
```

Open `http://localhost:4200`, shorten a URL, see it appear in the table. Click the
short link — a new tab opens the original URL, and after a refresh the hit count is 1.

> Annoyed by branch-switching to run backend + frontend together? That's the exact
> pain the submodule layout in Step 4 removes: on `main`, every branch is checked out
> side-by-side **at the same time**, each in its own folder.

---

## Step 3 — The CLI, on its own orphan branch

The second client: a zero-dependency Node CLI that consumes the *same* API — plus
cross-platform `snip` wrapper scripts and a scripted demo.

**The prompt:**

```text
In the snip-demo repo, create another empty orphan branch named "cli":

  git checkout --orphan cli
  git rm -rf .

Build a terminal client for the Snip URL shortener. It must have ZERO npm dependencies
— plain Node (18+) using the global fetch. It talks to the same backend as the web
app, whose contract is:
  POST /api/links  { "url": "..." } -> 201 { code, url, shortUrl, hits, createdAt }
                                       or 400/4xx { "error": "..." }
  GET  /api/links                   -> 200 array of those link objects
  GET  /<code>                      -> 302 with Location header, or 404

File 1 — cli.js (CommonJS — it will later also be run from a folder whose package.json
has no "type" field): starts with #!/usr/bin/env node. The backend base URL comes from
the SNIP_API environment variable, default http://localhost:3000.

Commands (parse process.argv, a small switch in an async main):
- snip add <url>   POST the url; on success print ONLY the shortUrl on stdout. On
                   failure print the server's error message if present (else "Request
                   failed (<status>)") to stderr and set process.exitCode = 1. Guard
                   against a missing arg ("Usage: snip add <url>") and against a
                   response with no shortUrl ("Unexpected response from server").
- snip ls          GET the list. If empty, print "No links yet. Add one with: snip add
                   <url>". Otherwise print an aligned table: header CODE (padEnd 8),
                   HITS (padStart 5), then URL; one row per link with the same padding.
- snip open <code> fetch(API + "/" + code, { redirect: "manual" }) — do NOT follow the
                   redirect; ask where it points. 404 -> "Unknown short code: <code>".
                   Anything other than a 302 with a Location header -> "Unexpected
                   response (<status>) for code: <code>". On success, launch the OS
                   browser at the target and print "Opening <target>". Browser launch:
                   win32 -> cmd /c start "" <url>; darwin -> open <url>; anything else
                   -> xdg-open <url>; spawn it detached with stdio "ignore" and
                   unref() so the CLI exits immediately.
- snip help / -h / --help / no args -> print a usage block covering the three commands
  and documenting SNIP_API with its default.
- Unknown command -> print "Unknown command: <cmd>" to stderr, then the usage, exit
  code 1.
All failures go through a small fail(message) helper that prints to stderr and sets
process.exitCode = 1 (never process.exit mid-flight). main().catch prints err.message
via fail.

File 2 — package.json: name "snip-cli", version 1.0.0, description "Snip — URL
shortener CLI client", and "bin": { "snip": "cli.js" } so npm link installs a real
snip command. Do NOT set "type": "module".

Files 3–5 — wrapper scripts so users can type `snip …` without npm link, each
forwarding all args to cli.js next to the script and honouring SNIP_API:
- snip      bash wrapper (#!/usr/bin/env bash): resolve the script's own directory
            from BASH_SOURCE and exec node "<dir>/cli.js" "$@". Make it executable.
- snip.cmd  Windows cmd wrapper: @echo off, node "%~dp0cli.js" %*, exit /b %errorlevel%
- snip.ps1  PowerShell wrapper (#!/usr/bin/env pwsh): node "$PSScriptRoot/cli.js"
            @args then exit $LASTEXITCODE
Each with a short header comment: what it is, that putting the folder on PATH gives a
global snip command, and how to point at another backend via SNIP_API.

Files 6–7 — a guided demo in two flavours, demo.sh (bash, set -euo pipefail,
executable) and demo.ps1 (pwsh with [CmdletBinding()] and params -Api defaulting to
$env:SNIP_API or http://localhost:3000, and a -Open switch). Both walk the wrapper
through the same numbered steps, printing a "[n] description" header before each:
  0. Check the backend is reachable (GET $API/api/links, short timeout); if not,
     print "Backend not reachable at <api>." plus a hint to start it first
     ("cd ../bundle && bun start") and exit 1.
  1. snip add https://anthropic.com   (capture and echo the short URL)
  2. snip add https://example.com
  3. snip ls
  4. Request the first short link once (curl -fsS -o /dev/null in bash;
     Invoke-WebRequest with -MaximumRedirection 0 and swallowed errors in pwsh) so its
     hit count ticks up. Derive the code from the captured short URL (text after the
     last "/").
  5. snip ls again — point out in the step text that HITS for that code is now 1.
  6. Only when opted in (OPEN=1 env var in bash, -Open switch in pwsh): snip open
     <code>; otherwise print a tip mentioning how to opt in.
The bash demo targets $SNIP_API or http://localhost:3000 and exports SNIP_API so the
wrapper inherits it; the pwsh demo sets $env:SNIP_API from -Api.

File 8 — README.md: title "Snip — CLI". Explain it hits the SAME HTTP API as the web
app (one backend, two clients — the teaching point), zero dependencies via Node's
global fetch. Document: the three node cli.js commands with example output, npm link
usage, SNIP_API, the three wrappers (which shell each is for, PATH tip), and both demo
scripts with their retarget/open options.

Commit on the cli branch with message "Add snip CLI (add/ls/open), wrappers, and demo
scripts" and push with: git push -u origin cli
```

**Verify:**

```bash
# with the backend running (git checkout backend && bun start in another terminal):
git checkout cli
node cli.js add https://anthropic.com     # → http://localhost:3000/<code>
node cli.js ls                            # → aligned CODE/HITS/URL table
./snip ls                                 # wrapper works too
./demo.sh                                 # full guided add → ls → hit → ls run
node cli.js open <code>                   # browser opens the original URL
SNIP_API=http://localhost:9999 node cli.js ls   # → clean failure, exit code 1
```

---

## Step 4 — `main`: aggregate the branches as submodules

Here's the heart of the demo. A fourth orphan branch, `main`, whose tree contains
**gitlinks** — special `160000 commit` entries that pin each folder to a commit on
another branch *of this same repo*. GitHub renders them as clickable folders; a clone
of `main` materializes the whole app side-by-side.

**The prompt:**

```text
In the snip-demo repo, create the aggregator branch. It must be an ORPHAN branch named
"main" that starts empty:

  git checkout --orphan main
  git rm -rf .

Now add the three project branches of THIS SAME repository as git submodules, each
tracking its branch (the -b flag records the branch in .gitmodules so
`git submodule update --remote` can follow it later):

  git submodule add -b backend  <REPO_URL> backend
  git submodule add -b frontend <REPO_URL> frontend
  git submodule add -b cli      <REPO_URL> cli

Write the top-level README.md for the whole repo, titled
"Snip — a Multi-Project Git Submodule Demo", covering:

- The pitch: a single Git repository whose pieces are the three layers of Snip, a tiny
  URL shortener; the teaching point is one backend serving an identical API contract
  to two very different clients (an Angular web app and a terminal CLI).
- The layout idea: each layer lives on its OWN branch (backend, frontend, cli) with
  files at the branch root; main aggregates all three as submodules, so they appear as
  folders under main on GitHub while remaining independent branches that teams or AI
  agents can work on in isolation.
- A table of the layers: Backend / branch backend / Bun (Bun.serve, in-memory Map,
  zero deps); Frontend / branch frontend / Angular 19; CLI / branch cli / Node with
  zero deps and global fetch.
- The shared API contract as a table (backend at http://localhost:3000):
  POST /api/links with { "url": "https://…" } -> 201 { code, url, shortUrl, hits,
  createdAt } or 400; GET /api/links -> 200 array; GET /:code -> 302 redirect that
  increments hits, or 404. Note storage is an in-memory Map and restarts clear it.
- A disk-layout tree of the main branch showing .gitmodules, README.md, and the three
  submodule folders each annotated "@ <sha>", with a short explanation that each
  gitlink is a 160000 commit entry pinning the submodule to an exact commit, rendered
  by GitHub as a clickable folder.
- Cloning: plain clones leave submodule folders EMPTY; show both
  git clone --recurse-submodules <REPO_URL> and, after a plain clone,
  git submodule update --init --recursive.
- Running Snip in dev — three terminals from the populated main checkout:
  (1) cd backend && bun start -> http://localhost:3000,
  (2) cd frontend && npm install && npx ng serve -> http://localhost:4200,
  (3) cd cli && node cli.js add https://anthropic.com, node cli.js ls,
      node cli.js open <code>.
  Mention: shorten a URL in the web app, then see the same link via the CLI — one
  backend, two clients.
- The team/agent workflow: each submodule folder is a full checkout of its branch, so
  you cd into it, edit, commit, and push (updating e.g. origin/backend); then in the
  superproject run git submodule update --remote backend, git add backend, and commit
  a pointer bump. Spell out that this pointer-bump is the one extra step submodules
  add: the project commit and the superproject commit are recorded separately.
- A "How the submodule layout was built" section showing the orphan-branch +
  submodule-add commands used above, and explaining the -b flag.

Stage .gitmodules, the three submodule gitlinks, and README.md; commit on main with
message "Add backend, frontend, cli as submodules"; push with:
git push -u origin main

Finally, prove the layout round-trips: in a THROWAWAY directory outside this repo, run
git clone --recurse-submodules <REPO_URL> and confirm backend/server.js,
frontend/angular.json, and cli/cli.js all exist in the fresh clone. Report the result,
then delete the throwaway clone.
```

**Verify:**

```bash
git checkout main
git submodule status            # three lines: backend, frontend, cli @ pinned SHAs
cat .gitmodules                 # each entry has path, url, branch

# the payoff — everything side-by-side, no branch switching:
cd backend  && bun start        # terminal 1 → :3000
cd frontend && npm i && npx ng serve   # terminal 2 → :4200
cd cli      && ./demo.sh        # terminal 3 → drives the same backend
```

On GitHub, the `main` branch now shows `backend/`, `frontend/`, `cli/` as folder links
with an `@ <sha>` suffix — those are the gitlinks.

---

## Step 5 — The `bundle` branch and its build script

Second submodule idea: a **generated release branch** (same spirit as `gh-pages`).
One Bun process serving the API, the redirects, *and* the built Angular UI, with the
CLI alongside — assembled from the three source branches by a script on `main`.

The flow you're about to build:

```
backend ──(server.js)──────────────┐
frontend ─(ng build → dist/…)──────┼──►  scripts/build-bundle.mjs  ──►  bundle branch
cli ──────(cli.js)─────────────────┘         (on main)                  (+ pointer bump
                                                                          on main)
```

**The prompt:**

```text
In the snip-demo repo, on the main superproject branch (with submodules initialized),
add a fourth, GENERATED branch called "bundle": the whole Snip app as one deployable —
a single Bun server serving the API, the short-code redirects, AND the built Angular
web UI, with the CLI alongside.

Part 1 — seed the branch. In a temporary clone of <REPO_URL> outside this checkout,
create an empty orphan branch named "bundle" (git checkout --orphan bundle; git rm
-rf .) containing ONLY a README.md, then push it (git push -u origin bundle) and
delete the temp clone. The README (title "Snip — Bundle (whole app, one process)")
must say: this branch is GENERATED OUTPUT assembled from the backend, frontend, and
cli branches by scripts/build-bundle.mjs on main — don't hand-edit, files are
overwritten on the next build. Document: the layout (server.js = Bun server for /api +
/:code redirects + static ./public; public/ = built Angular app; cli.js; .env with
PUBLIC_DIR=./public auto-loaded by Bun; Dockerfile; .dockerignore; railway.json;
package.json), how to run (cd bundle && bun start -> http://localhost:3000 serves web
UI + API + redirects in one process, and the CLI in another terminal talks to that
same server via node cli.js …), Docker usage (docker build -t snip-bundle . then
docker run --rm -p 3000:3000 snip-bundle; the server honours $PORT and Bun binds
0.0.0.0), Railway deployment (railway.json selects the DOCKERFILE builder; deploy
either from the bundle branch directly or from main with the service Root Directory
set to bundle/; Railway injects $PORT; the server uses RAILWAY_PUBLIC_DOMAIN for
correct shortUrls, and BASE_URL overrides it; in-memory storage resets on restart),
and how to regenerate (node scripts/build-bundle.mjs from the main checkout).

Part 2 — back in the superproject, mount it as the fourth submodule:

  git submodule add -b bundle <REPO_URL> bundle

Part 3 — write scripts/build-bundle.mjs on main (plain Node ESM, zero dependencies:
node:child_process, node:fs, node:path, node:url only). It must run identically on
Windows, macOS, Linux, and in CI. Behaviour, in order:

1. Resolve the repo root from import.meta.url (script lives in scripts/), so it works
   from any CWD. Parse a --push flag from argv.
2. Helpers: run(cmd, args) via execFileSync with stdio inherit and cwd = root;
   capture(cmd, args) same but returning trimmed utf8 output. For npm, go through a
   SHELL with a single command string (execSync) so Windows resolves npm.cmd — build
   commands like: npm --prefix "<abs frontend path>" install --no-audit --no-fund.
3. Log each phase with a "> ..." line:
   a. "Updating source submodules to their branch tips": git submodule update --init
      --remote backend frontend cli   (NOT bundle — never regenerate from output).
   b. "Building the Angular frontend": npm --prefix install, then npm --prefix run
      build. Afterwards assert frontend/dist/snip-frontend/browser/index.html exists;
      throw a clear error if not.
   c. "Assembling bundle/": delete bundle/public (recursive, force) plus
      bundle/server.js and bundle/cli.js; then copy backend/server.js ->
      bundle/server.js, cli/cli.js -> bundle/cli.js, and the entire
      frontend/dist/snip-frontend/browser -> bundle/public. (README.md survives —
      only generated files are cleaned.)
   d. Write bundle/.env: a comment saying Bun loads it automatically and it tells the
      server to also serve the built web app, then PUBLIC_DIR=./public
   e. Write bundle/package.json (2-space JSON + trailing newline): name snip-bundle,
      version 1.0.0, private true, description "Snip — the whole app bundled: one Bun
      server serving the API, short-code redirects, and the built Angular web UI. CLI
      included.", scripts { "start": "bun server.js" }. Deliberately NO "type":
      "module" — cli.js is CommonJS and must stay runnable via plain node.
   f. Write bundle/Dockerfile with explanatory comments, including "Generated by
      scripts/build-bundle.mjs — do not hand-edit":
        FROM oven/bun:1-alpine
        WORKDIR /app
        COPY . .
        ENV PORT=3000
        EXPOSE 3000
        CMD ["bun", "server.js"]
      Comments should note: the bundle is self-contained (zero runtime deps) so a
      plain COPY suffices; .env is included and auto-loaded by Bun; Railway/PaaS
      inject $PORT at runtime and the server reads it; Bun binds 0.0.0.0.
   g. Write bundle/.dockerignore keeping the image lean: .git, .gitignore,
      node_modules, npm-debug.log, Dockerfile, .dockerignore, README.md.
   h. Write bundle/railway.json: { "$schema":
      "https://railway.com/railway.schema.json", "build": { "builder": "DOCKERFILE",
      "dockerfilePath": "Dockerfile" }, "deploy": { "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 3 } }.
4. Commit the bundle IDEMPOTENTLY (git commit fails when nothing is staged, and a
   scheduled CI run usually finds no changes): git -C bundle add -A, then check
   git -C bundle diff --cached --name-only; only if non-empty, commit with message
   "Rebuild bundle from source branches" and, when --push, git -C bundle push origin
   HEAD:bundle (HEAD:bundle because submodule checkouts are often detached). Log
   "bundle updated." or "bundle unchanged.".
5. Bump the superproject pointers the same guarded way: git add -- backend frontend
   cli bundle; if git diff --cached --name-only over those four paths is non-empty,
   commit "Bump submodule pointers (bundle release)" and, when --push, git push. Log
   accordingly.
6. Finish with a ✓ summary line that differs for --push vs local-only.

Also add a short "The whole app, bundled" section to the top-level README.md: what the
bundle branch is (a generated release, same idea as a gh-pages branch — source layers
on their own branches, the assembled artifact on a bundle branch), how to run it
(cd bundle && bun start), both build-script invocations (plain = rebuild + commit
locally; --push = also publish the bundle branch and bump the pointer), and a pointer
to bundle/README.md.

Now RUN node scripts/build-bundle.mjs (no --push) and confirm it succeeds and that
bundle/ contains server.js, cli.js, public/index.html, .env, package.json, Dockerfile,
.dockerignore, railway.json. Then run it AGAIN and confirm it prints "bundle
unchanged." / "superproject pointers unchanged." (idempotence). Finally run node
scripts/build-bundle.mjs --push to publish, and commit + push the script and README
changes on main with message "Add bundle submodule and build script".
```

**Verify:**

```bash
cd bundle && bun start            # ONE process on :3000
# browser → http://localhost:3000  : the Angular UI, served by Bun
# shorten a link in the UI, then:
node cli.js ls                    # CLI sees it — same server, same Map

# the whole thing in Docker:
docker build -t snip-bundle . && docker run --rm -p 3000:3000 snip-bundle

# idempotence:
cd .. && node scripts/build-bundle.mjs     # → "bundle unchanged."
```

---

## Step 6 — CI: rebuild the bundle on a schedule

Automate Step 5. One wrinkle to understand first: GitHub runs a `push` workflow using
the file **as it exists on the pushed branch** — and this file only lives on `main`.
A `push:` trigger would never fire for pushes to `backend`/`frontend`/`cli`. So the
workflow uses an hourly schedule plus manual dispatch instead.

**The prompt:**

```text
In the snip-demo repo on the main branch, add .github/workflows/bundle.yml — a GitHub
Actions workflow named "Build bundle" that regenerates the bundle branch (the
whole-app release) by running scripts/build-bundle.mjs --push.

Triggers: workflow_dispatch (manual) and schedule with cron "0 * * * *" (hourly).
Include a comment block explaining WHY there is no push trigger: GitHub runs a push
workflow using the file as it exists ON the pushed branch, so a push trigger here
would not fire for pushes to backend/frontend/cli (the file isn't on those branches);
the hourly schedule + manual dispatch cover it from main, and for instant rebuilds
you'd copy the workflow onto the source branches too.

Config: permissions contents: write (the job pushes the bundle branch and main);
concurrency group "build-bundle" with cancel-in-progress: true.

One job "bundle" on ubuntu-latest:
1. actions/checkout@v4 with ref: main, submodules: true, fetch-depth: 0 (the script
   commits and pushes from both the submodule and the superproject, so it needs full
   history and real branch refs).
2. actions/setup-node@v4 with node-version: 24.
3. Configure the committer identity: git config user.name "github-actions[bot]" and
   git config user.email "github-actions[bot]@users.noreply.github.com".
4. Run: node scripts/build-bundle.mjs --push

Commit on main with message "Add CI to rebuild the bundle" and push. Then trigger it
once manually (gh workflow run "Build bundle", or tell me to click Run workflow in the
Actions tab), watch it complete, and report whether it pushed new bundle commits or
correctly detected "bundle unchanged.".
```

**Verify:**

```bash
gh workflow run "Build bundle" && gh run watch      # or use the Actions tab
git pull --recurse-submodules                       # if CI pushed a rebuild
```

An unchanged rebuild ends with `bundle unchanged.` — the idempotence guards from
Step 5 are what make this safe to run hourly.

---

## Step 7 — CI: build and push the Docker image

Last piece: every time `main`'s **bundle pointer** moves, build the bundle's
Dockerfile and push the image to GitHub Container Registry. The neat trick: the
workflow's `paths:` filter watches `bundle` — which on `main` is a *gitlink*, not a
folder — so the image is rebuilt exactly when a new bundle release is pinned.

**The prompt:**

```text
In the snip-demo repo on the main branch, add .github/workflows/docker.yml — a GitHub
Actions workflow named "Build and push image" that builds the bundled Snip app (the
bundle/ submodule) into a Docker image and pushes it to GitHub Container Registry.
Include a comment block up top explaining: it runs from main, where the bundle pointer
lives — the checkout pulls the pinned bundle commit via submodules, so the image
always matches the released bundle; images land at ghcr.io/<owner>/<repo>:latest plus
a :sha-<short> tag per build; auth is the built-in GITHUB_TOKEN, no extra secrets.

Triggers: push to branches [main] filtered to paths [bundle,
.github/workflows/docker.yml] — with a comment on the bundle line noting it matches
the submodule POINTER (the gitlink) being bumped — plus workflow_dispatch.

Config: permissions contents: read, packages: write; concurrency group
"docker-image-${{ github.ref }}" with cancel-in-progress: true.

One job "image" on ubuntu-latest:
1. actions/checkout@v4 with submodules: recursive (populates bundle/ at its pinned
   commit) and fetch-depth: 0.
2. docker/login-action@v3: registry ghcr.io, username ${{ github.actor }}, password
   ${{ secrets.GITHUB_TOKEN }}.
3. docker/metadata-action@v5 (id: meta) with images: ghcr.io/${{ github.repository }}
   and tags:
     type=raw,value=latest,enable={{is_default_branch}}
     type=sha,format=short
4. docker/setup-buildx-action@v3.
5. docker/build-push-action@v6: context ./bundle, file ./bundle/Dockerfile, push:
   true, tags and labels from the meta step outputs, cache-from type=gha and cache-to
   type=gha,mode=max.

Also extend the top-level README.md with a short "Container image" subsection: the
bundle ships a Dockerfile, CI builds it from the pinned bundle on every main update
and pushes to GHCR; show docker run --rm -p 3000:3000 ghcr.io/<owner>/<repo>:latest;
mention it's Railway-ready (the server honours the injected $PORT and uses
RAILWAY_PUBLIC_DOMAIN for correct short links) and point at bundle/README.md for
deploy steps.

Commit on main with message "Add CI to build and push the bundle Docker image" and
push. That push touches the workflow file itself, which is in the paths filter — so
this first run starts immediately. Watch it and report the pushed tags.
```

**Verify:**

```bash
gh run watch                                        # first build fires on the push itself
docker run --rm -p 3000:3000 ghcr.io/<you>/snip-demo:latest
# → http://localhost:3000 serves the whole app from the registry image
```

If the pull is denied: the first push creates the package as **private** — make it
public in the package settings, or `docker login ghcr.io` first.

---

## Step 8 — Live the workflow (day-2 loop)

Nothing new to build — this prompt walks the agent through the maintenance loop the
whole architecture exists to teach. Do it once by hand (or by prompt) so the
pointer-bump mechanic sticks.

**The prompt:**

```text
In the snip-demo repo main checkout, demonstrate the full submodule day-2 workflow
end to end with a tiny real change:

1. cd backend (a full checkout of the backend branch). Make a small visible change —
   e.g. include the total number of stored links in the startup log line. Commit with
   a sensible message and push to origin backend.
2. Back in the superproject: git submodule update --remote backend, then git add
   backend and commit "Bump backend submodule" — explain in your summary that the
   backend commit and this pointer-bump commit are two separate records, and that's
   the one extra step submodules add.
3. Rebuild the release so it picks the change up: node scripts/build-bundle.mjs
   --push. Confirm the script committed a new bundle and bumped pointers.
4. Push main, then check GitHub Actions: the "Build and push image" workflow should
   have triggered off the bundle pointer bump. Report the run status and the new
   image tags.
5. Wrap up with a short recap of the loop: edit in submodule -> push branch -> bump
   pointer on main -> rebuild bundle -> image ships automatically.
```

---

## Full verification checklist

Run through this once at the end — it exercises every artifact you built:

| # | Check | Expect |
|---|-------|--------|
| 1 | `git clone --recurse-submodules <REPO_URL>` in a fresh dir | `backend/`, `frontend/`, `cli/`, `bundle/` all populated |
| 2 | `git submodule status` on `main` | four pinned SHAs, no `+`/`-` prefixes after a fresh clone |
| 3 | `cd backend && bun start` + the curl trio (POST, GET, `/:code`) | 201 → 200 → 302, hits increment |
| 4 | `cd frontend && npm i && npx ng serve` with backend up | UI on :4200 shortens and lists links |
| 5 | `cd cli && ./demo.sh` (backend up) | scripted add → ls → hit → ls, HITS ticks to 1 |
| 6 | `cd bundle && bun start` | :3000 serves UI **and** API in one process |
| 7 | `node scripts/build-bundle.mjs` twice | second run: `bundle unchanged.` |
| 8 | `gh workflow run "Build bundle"` | green run; pushes only when sources changed |
| 9 | `docker run --rm -p 3000:3000 ghcr.io/<you>/<repo>:latest` | whole app from the registry |
| 10 | Web UI shortens a link → `cd cli && node cli.js ls` | same link visible — one backend, two clients |

---

## Appendix A — Concepts this repo teaches

**Orphan branches** (`git checkout --orphan`) start a branch with *no parent commit* —
independent history in the same repo. Each project layer is one, with its files at the
branch root, which is exactly what lets a submodule mount it as a folder.

**Gitlinks.** On `main`, `backend` isn't a directory of files — it's a tree entry of
mode `160000 commit`: a pointer to a specific commit. `.gitmodules` maps the path to a
URL (+ tracked branch); the gitlink pins the exact SHA. See them with
`git ls-tree main`.

**The pointer bump** is the one extra cost submodules charge: advancing a layer takes
a commit on its branch *and* a commit on `main` moving the gitlink
(`git submodule update --remote <path>` + `git add <path>` + commit). In exchange,
`main` is always a reproducible snapshot of exact versions that worked together.

**Worktrees vs submodules** — this repo's origin story (it grew out of
`worktree-demo`, which is why the original's `.gitmodules` still points there). Git
worktrees give parallel *local* checkouts of multiple branches, but they're invisible
on the remote. Converting the folders to submodules kept the parallel-checkout
ergonomics **and** made the layout exist on GitHub: the folders under `main` are real,
clickable, pinned.

**A generated release branch.** `bundle` is output, not source — the same pattern as
`gh-pages`. Source layers stay clean on their branches; the assembled artifact gets its
own branch, pinned by `main` like everything else, so CI can build a Docker image from
an exact released state.

**One contract, two clients.** The Angular app and the CLI consume byte-identical
endpoints. Nothing enforces it but discipline and the shared README table — which is
the honest version of most real-world API contracts.

## Appendix B — Gotchas the original hit (so your agent doesn't)

- **Empty folders after cloning** are not a bug: plain `git clone` leaves submodules
  unpopulated. `--recurse-submodules`, or `git submodule update --init --recursive`.
- **`push:` workflows only fire from branches that contain the workflow file.** That's
  why `bundle.yml` is schedule + dispatch, not `on: push: [backend, frontend, cli]`.
- **The `paths: [bundle]` filter in `docker.yml` watches a gitlink, not files** — it
  matches when the pointer bumps. Filtering on `bundle/**` would never match on `main`.
- **`git commit` fails when nothing is staged.** Anything that commits on a schedule
  (the build script, hourly CI) must guard on `git diff --cached --name-only` first —
  that's what makes the hourly rebuild a safe no-op.
- **Detached HEADs in submodules:** `git submodule update` checks out a commit, not a
  branch. The build script pushes with `git push origin HEAD:bundle` so it works
  regardless.
- **Windows + npm:** `npm` is `npm.cmd` on Windows and needs a shell. The build script
  runs npm via `execSync` with a single command string (and everything else via
  `execFileSync` with arg arrays) precisely for this.
- **Angular 19 build output** lands in `dist/<project>/browser/` — the `browser/`
  segment is easy to miss and the build script asserts `index.html` exists there.
- **CommonJS CLI in an ESM world:** `cli.js` uses `require()`, so the generated
  `bundle/package.json` must **not** carry `"type": "module"`, or `node cli.js` breaks
  inside the bundle. (The backend doesn't care — Bun.)
- **`shortUrl` must match where you're deployed:** `BASE_URL` wins, else
  `RAILWAY_PUBLIC_DOMAIN` (injected by Railway), else `http://localhost:<PORT>`.
  Without this, deployed short links say `localhost`.
- **First GHCR push is private** by default — flip the package to public (or log in)
  before `docker run` from another machine.
- **Static asset vs short code collision:** in the bundled server, an existing file in
  `public/` wins over a same-named short code — codes are 6-char base62, so real
  collisions are effectively theoretical, but the precedence is deliberate.
