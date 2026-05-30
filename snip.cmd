@echo off
REM snip — convenience wrapper for the Snip CLI (Windows cmd / PowerShell).
REM Lets you run `snip add <url>` instead of `node cli.js add <url>`.
REM Put this folder on PATH to call `snip` from anywhere.
REM Point at another backend with:  set SNIP_API=http://host:port
node "%~dp0cli.js" %*
exit /b %errorlevel%
