# Snip — Backend (Bun)

The API for **Snip**, a tiny URL shortener. A single `Bun.serve()` process holding an
in-memory `Map<code, { url, hits, createdAt }>`. **Zero dependencies.** Restarting the
server clears all links (by design — this is a demo, not a database).

This is the one backend that both clients — the Angular web app and the `snip` CLI —
talk to through the identical contract below.

## Run

```bash
bun start          # bun run server.js
# or, auto-reload while editing:
bun run dev        # bun --watch server.js
```

Listens on `http://localhost:3000` (override with `PORT`; set the public origin used in
`shortUrl` with `BASE_URL`).

## API

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `201` `{ code, url, shortUrl, hits, createdAt }` · `400` if the URL is missing/invalid |
| `GET`  | `/api/links` | — | `200` array of all links |
| `GET`  | `/:code` | — | `302` redirect to the original URL, increments `hits` · `404` if unknown |

Short codes are 6-character base62, generated with `crypto.getRandomValues`.
CORS is open (`Access-Control-Allow-Origin: *`) with `OPTIONS` preflight handling so the
browser client can call it.

## Examples

```bash
# create
curl -X POST localhost:3000/api/links \
  -H 'content-type: application/json' \
  -d '{"url":"https://anthropic.com"}'

# list
curl localhost:3000/api/links

# follow a short code (prints the 302 + Location)
curl -i localhost:3000/<code>
```
