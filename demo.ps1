#!/usr/bin/env pwsh
# demo.ps1 — walk the Snip CLI through add -> ls -> (redirect) -> ls using the snip wrapper.
# Usage:
#   ./demo.ps1                         # against http://localhost:3000 (or $env:SNIP_API)
#   ./demo.ps1 -Api http://host:port   # against another backend
#   ./demo.ps1 -Open                   # also run `snip open <code>` (launches a browser)
[CmdletBinding()]
param(
  [string]$Api = $(if ($env:SNIP_API) { $env:SNIP_API } else { 'http://localhost:3000' }),
  [switch]$Open
)
$ErrorActionPreference = 'Stop'
$env:SNIP_API = $Api
$snip = Join-Path $PSScriptRoot 'snip.ps1'

function Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }

Write-Host "Snip CLI demo -> $Api" -ForegroundColor Green

# 0 — make sure the backend is up before we drive the CLI at it
Step 0 'Checking the backend is reachable...'
try {
  Invoke-RestMethod "$Api/api/links" -TimeoutSec 5 | Out-Null
} catch {
  Write-Host "Backend not reachable at $Api." -ForegroundColor Red
  Write-Host 'Start it first:  cd ../bundle ; bun start' -ForegroundColor Red
  exit 1
}

# 1/2 — shorten a couple of URLs
Step 1 'snip add https://anthropic.com'
$short = & $snip add https://anthropic.com
Write-Host "   -> $short"

Step 2 'snip add https://example.com'
Write-Host "   -> $(& $snip add https://example.com)"

# 3 — list them with hit counts
Step 3 'snip ls'
& $snip ls

# 4 — follow the first short link once so its hit count ticks up
$code = ($short -split '/')[-1]
Step 4 "Visiting /$code once to register a hit..."
try { Invoke-WebRequest "$Api/$code" -MaximumRedirection 0 -ErrorAction SilentlyContinue | Out-Null } catch {}

Step 5 "snip ls  (HITS for $code is now 1)"
& $snip ls

if ($Open) {
  Step 6 "snip open $code  (launches your browser)"
  & $snip open $code
} else {
  Write-Host "`nTip: ./demo.ps1 -Open  also runs 'snip open $code' to launch the browser." -ForegroundColor DarkGray
}

Write-Host "`nDone." -ForegroundColor Green
