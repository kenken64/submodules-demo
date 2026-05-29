// Snip — a tiny URL shortener backend, powered by Bun.
// Storage is an in-memory Map (zero dependencies). Restarting clears all links.

const PORT = Number(Bun.env.PORT ?? 3000);
const BASE_URL = Bun.env.BASE_URL ?? `http://localhost:${PORT}`;

/** @type {Map<string, { url: string, hits: number, createdAt: string }>} */
const links = new Map();

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function makeCode(length = 6) {
  let code;
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  } while (links.has(code));
  return code;
}

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function toLink(code) {
  const { url, hits, createdAt } = links.get(code);
  return { code, url, shortUrl: `${BASE_URL}/${code}`, hits, createdAt };
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    const { method } = req;

    // CORS preflight for the browser (Angular) client
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Create a short link
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }
      const url = typeof body?.url === "string" ? body.url.trim() : "";
      if (!isValidUrl(url)) {
        return json({ error: 'Provide a valid http(s) URL in { "url": ... }' }, 400);
      }
      const code = makeCode();
      links.set(code, { url, hits: 0, createdAt: new Date().toISOString() });
      return json(toLink(code), 201);
    }

    // List every link with its hit count
    if (method === "GET" && pathname === "/api/links") {
      return json([...links.keys()].map(toLink));
    }

    // Redirect a short code to its original URL, counting the hit
    if (method === "GET" && /^\/[^/]+$/.test(pathname)) {
      const code = pathname.slice(1);
      const entry = links.get(code);
      if (!entry) return json({ error: "Unknown short code" }, 404);
      entry.hits += 1;
      return new Response(null, {
        status: 302,
        headers: { Location: entry.url, ...CORS },
      });
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip backend running on ${server.url.href.replace(/\/$/, "")}`);
