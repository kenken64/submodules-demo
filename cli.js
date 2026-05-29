#!/usr/bin/env node
// snip — a tiny CLI client for the Snip URL shortener.
// It talks to the exact same API as the web app: one backend, two clients.

const { spawn } = require("child_process");

const API = process.env.SNIP_API ?? "http://localhost:3000";

const USAGE = `snip — URL shortener CLI

Usage:
  snip add <url>     Shorten a URL and print the short link
  snip ls            List all links with their hit counts
  snip open <code>   Open a short code's target URL in your browser

Environment:
  SNIP_API           Backend base URL (default ${API})`;

async function add(url) {
  if (!url) return fail("Usage: snip add <url>");
  const res = await fetch(`${API}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return fail(data.error ?? `Request failed (${res.status})`);
  if (!data.shortUrl) return fail("Unexpected response from server");
  console.log(data.shortUrl);
}

async function ls() {
  const res = await fetch(`${API}/api/links`);
  if (!res.ok) return fail(`Request failed (${res.status})`);
  const links = await res.json();
  if (!Array.isArray(links)) return fail("Unexpected response from server");
  if (links.length === 0) {
    console.log("No links yet. Add one with: snip add <url>");
    return;
  }
  console.log(`${"CODE".padEnd(8)}${"HITS".padStart(5)}  URL`);
  for (const l of links) {
    console.log(`${l.code.padEnd(8)}${String(l.hits).padStart(5)}  ${l.url}`);
  }
}

async function open(code) {
  if (!code) return fail("Usage: snip open <code>");
  // Ask the backend where the code points; don't follow the redirect ourselves.
  const res = await fetch(`${API}/${code}`, { redirect: "manual" });
  if (res.status === 404) return fail(`Unknown short code: ${code}`);
  const target = res.headers.get("location");
  if (res.status !== 302 || !target) {
    return fail(`Unexpected response (${res.status}) for code: ${code}`);
  }
  launchBrowser(target);
  console.log(`Opening ${target}`);
}

function launchBrowser(url) {
  const platform = process.platform;
  const [cmd, args] =
    platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  switch (cmd) {
    case "add":
      return add(arg);
    case "ls":
      return ls();
    case "open":
      return open(arg);
    case undefined:
    case "help":
    case "-h":
    case "--help":
      return console.log(USAGE);
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(USAGE);
      process.exitCode = 1;
  }
}

main().catch((err) => fail(err.message));
