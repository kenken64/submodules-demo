#!/usr/bin/env bash
# demo.sh — walk the Snip CLI through add -> ls -> (redirect) -> ls using the snip wrapper.
# Usage:
#   ./demo.sh                     # against http://localhost:3000 (or $SNIP_API)
#   SNIP_API=http://host:port ./demo.sh
#   OPEN=1 ./demo.sh              # also run `snip open <code>` (launches a browser)
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API="${SNIP_API:-http://localhost:3000}"
export SNIP_API="$API"
snip="$DIR/snip"

step() { printf '\n[%s] %s\n' "$1" "$2"; }

echo "Snip CLI demo -> $API"

# 0 — make sure the backend is up before we drive the CLI at it
step 0 'Checking the backend is reachable...'
if ! curl -fsS "$API/api/links" >/dev/null 2>&1; then
  echo "Backend not reachable at $API." >&2
  echo 'Start it first:  (cd ../bundle && bun start)' >&2
  exit 1
fi

# 1/2 — shorten a couple of URLs
step 1 'snip add https://anthropic.com'
short="$("$snip" add https://anthropic.com)"
echo "   -> $short"

step 2 'snip add https://example.com'
echo "   -> $("$snip" add https://example.com)"

# 3 — list them with hit counts
step 3 'snip ls'
"$snip" ls

# 4 — follow the first short link once so its hit count ticks up
code="${short##*/}"
step 4 "Visiting /$code once to register a hit..."
curl -fsS -o /dev/null "$API/$code" || true

step 5 "snip ls  (HITS for $code is now 1)"
"$snip" ls

if [ "${OPEN:-}" = "1" ]; then
  step 6 "snip open $code  (launches your browser)"
  "$snip" open "$code"
else
  printf "\nTip: OPEN=1 ./demo.sh  also runs 'snip open %s' to launch the browser.\n" "$code"
fi

printf '\nDone.\n'
