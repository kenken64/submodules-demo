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
