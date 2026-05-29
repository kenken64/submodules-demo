# Multi-Project Git Repo Using Submodules

A single Git repository hosting three independent projects — **backend**, **frontend**, and **cli** — each living on its own branch with files at the branch root. The **main** branch aggregates all three as **git submodules**, so they appear as folders under `main` on GitHub while remaining independent branches that teams (or AI agents) can work on in isolation.

> Previously these folders were wired up as **git worktrees** (great for parallel local work, but worktrees are local-only and never appear on the remote). They were converted to **submodules** so the folders also show up under `main` on GitHub.

## Branch Overview

| Branch | Purpose | File(s) at root |
|--------|---------|-----------------|
| `main` | Aggregates all projects as submodules | `.gitmodules`, `README.md`, + submodule pointers |
| `backend` | HTTP server (`GET /api`) plus demo pages | `server.js`, `index2.html`, `index3.html`, `README.md` |
| `frontend` | Web app(s) that fetch from the backend | `index.html`, `index4.html` |
| `cli` | CLI tool that prints the backend response | `cli.js` |

## Disk Layout (main branch)

```
worktree-demo/            ← main branch
├── .gitmodules           ← maps each folder to a branch of this repo
├── README.md
├── backend/   @ <sha>    ← submodule, tracks branch `backend`
├── frontend/  @ <sha>    ← submodule, tracks branch `frontend`
└── cli/       @ <sha>    ← submodule, tracks branch `cli`
```

Each `@ <sha>` is a *gitlink* — `main` pins each submodule to a specific commit on its branch. In `main`'s tree these show up as `160000 commit` entries, which GitHub renders as clickable folders.

## Cloning

Submodule folders are empty after a plain `git clone`. Pull them in one of two ways:

```bash
# Clone and populate submodules in one step
git clone --recurse-submodules https://github.com/kenken64/worktree-demo.git

# ...or, after a plain clone:
git submodule update --init --recursive
```

## How It Was Built

### Step 1 — Initialize the Repository

```bash
git init
```

### Step 2 — Create the `backend` Branch

Create an orphan branch (no parent commit) and add a simple HTTP server.

```bash
git checkout --orphan backend
```

Create `server.js`:

```js
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify({ message: "Hello World" }));
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}/api`);
});
```

Stage and commit:

```bash
git add server.js
git commit -m "Add backend HTTP server with GET /api endpoint"
```

### Step 3 — Create the `frontend` Branch

Create another orphan branch and clean up staged files from the previous branch.

```bash
git checkout --orphan frontend
git rm --cached server.js
```

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Frontend</title>
</head>
<body>
  <h1 id="output">Loading...</h1>
  <script>
    fetch("http://localhost:3000/api")
      .then(res => res.json())
      .then(data => {
        document.getElementById("output").textContent = data.message;
      })
      .catch(err => {
        document.getElementById("output").textContent = "Error: " + err.message;
      });
  </script>
</body>
</html>
```

Stage and commit:

```bash
git add index.html
git commit -m "Add frontend web app that fetches from backend"
```

### Step 4 — Create the `cli` Branch

Create a third orphan branch and clean up staged files.

```bash
git checkout --orphan cli
git rm --cached index.html
```

Create `cli.js`:

```js
const http = require("http");

http.get("http://localhost:3000/api", (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    const json = JSON.parse(data);
    console.log(json.message);
  });
}).on("error", (err) => {
  console.error("Error:", err.message);
});
```

Stage and commit:

```bash
git add cli.js
git commit -m "Add CLI tool that calls backend and prints response"
```

> The `backend`, `frontend`, and `cli` branches have since grown additional demo pages
> (`index2.html`, `index3.html`, `index4.html`) via pull requests.

### Step 5 — Push the Project Branches

```bash
git remote add origin https://github.com/kenken64/worktree-demo.git
git push -u origin backend frontend cli
```

### Step 6 — Create the `main` Branch and Wire Up Submodules

Create an orphan `main` branch, then add each project branch as a submodule of this
same repository, pinned to its branch:

```bash
git checkout --orphan main
git rm --cached -r .          # start main with an empty tree

git submodule add -b backend  https://github.com/kenken64/worktree-demo.git backend
git submodule add -b frontend https://github.com/kenken64/worktree-demo.git frontend
git submodule add -b cli      https://github.com/kenken64/worktree-demo.git cli

git add .gitmodules backend frontend cli README.md
git commit -m "Add backend, frontend, cli as submodules"
git push -u origin main
```

The `-b <branch>` flag records the tracked branch in `.gitmodules`, which lets
`git submodule update --remote` follow that branch later.

### Step 7 — Verify

```bash
git submodule status
git ls-tree HEAD        # backend/frontend/cli show as `160000 commit` (gitlinks)
```

## Working on a Project (team / agent workflow)

Each submodule folder is a full checkout of its branch — work in it directly:

```bash
cd backend                      # you're now on the `backend` branch
# ...edit files...
git add -A
git commit -m "Update backend"
git push                        # updates origin/backend
```

Then publish the advance by bumping the pointer in `main`:

```bash
cd ..
git submodule update --remote backend          # fast-forward folder to latest origin/backend
git add backend
git commit -m "Bump backend submodule"
git push                                        # updates main on GitHub
```

This pointer-bump is the one extra step submodules add: a project commit and a
superproject commit are recorded separately.

## Running the Projects

From the `main` checkout (after submodules are populated):

```bash
# Start the backend
node backend/server.js

# Open the frontend
open frontend/index.html

# Run the CLI
node cli/cli.js
```
