#!/usr/bin/env pwsh
# snip — convenience wrapper for the Snip CLI (PowerShell).
# Lets you run `./snip.ps1 add <url>` instead of `node cli.js add <url>`.
# Point at another backend with:  $env:SNIP_API = 'http://host:port'
node "$PSScriptRoot/cli.js" @args
exit $LASTEXITCODE
