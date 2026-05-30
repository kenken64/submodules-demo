# Snip — CLI

A terminal client for the **Snip** URL shortener. It hits the *same* HTTP API as the
Angular web app — that's the teaching point: one backend, two very different clients.
Zero dependencies (uses Node's global `fetch`).

## Use

```bash
node cli.js add https://anthropic.com   # → http://localhost:3000/Ab3xK9
node cli.js ls                          # table of links + hit counts
node cli.js open Ab3xK9                 # open the target in your browser
```

Or link it as a real `snip` command:

```bash
npm link        # then: snip add <url> | snip ls | snip open <code>
```

Point it at a non-default backend with the `SNIP_API` env var:

```bash
SNIP_API=http://localhost:4000 node cli.js ls
```

## Wrapper scripts

Convenience wrappers so you can type `snip …` instead of `node cli.js …` — no
`npm link` needed. Pick the one for your shell:

```powershell
# Windows (cmd or PowerShell)
.\snip add https://anthropic.com     # snip.cmd — works on PATH from anywhere
.\snip.ps1 ls                        # PowerShell variant
```

```bash
# Linux / macOS / Git Bash
./snip add https://anthropic.com     # ./snip ls | ./snip open <code>
```

All three forward their arguments straight to `cli.js` and honour `SNIP_API`.
Add this folder to your `PATH` to call `snip` from any directory.

## Demo script

A guided end-to-end run that drives the wrapper through add → ls → redirect → ls,
showing a hit count tick up. Start the backend first (`cd ../bundle && bun start`),
then:

```powershell
.\demo.ps1            # -Api http://host:port to retarget; -Open to launch the browser
```

```bash
./demo.sh             # SNIP_API=http://host:port to retarget; OPEN=1 to launch the browser
```
