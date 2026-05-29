#!/usr/bin/env node
// Regenerate the `bundle` submodule: assemble the whole Snip app — the Bun server
// (serving API + short-code redirects + the built Angular web UI) plus the CLI —
// from the `backend`, `frontend`, and `cli` source branches.
//
// Usage:
//   node scripts/build-bundle.mjs            rebuild + commit the bundle locally
//   node scripts/build-bundle.mjs --push     also push the bundle branch and bump main
//
// Runs the same locally (Windows/macOS/Linux) and in CI (.github/workflows/bundle.yml).

import { execFileSync, execSync } from 'node:child_process';
import { cpSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUSH = process.argv.includes('--push');

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
const capture = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts }).trim();
// npm must go through a shell so Windows resolves npm.cmd; use a single command string
// (execSync) to dodge the execFile+shell args deprecation. The quoted path has no spaces.
const FE = join(ROOT, 'frontend');
const npm = (argStr) => execSync(`npm ${argStr}`, { cwd: ROOT, stdio: 'inherit' });

const BUNDLE = join(ROOT, 'bundle');
const DIST = join(ROOT, 'frontend', 'dist', 'snip-frontend', 'browser');

console.log('> Updating source submodules to their branch tips...');
run('git', ['submodule', 'update', '--init', '--remote', 'backend', 'frontend', 'cli']);

console.log('> Building the Angular frontend...');
npm(`--prefix "${FE}" install --no-audit --no-fund`);
npm(`--prefix "${FE}" run build`);
if (!existsSync(join(DIST, 'index.html'))) {
  throw new Error('ng build output not found at ' + DIST);
}

console.log('> Assembling bundle/ ...');
rmSync(join(BUNDLE, 'public'), { recursive: true, force: true });
for (const f of ['server.js', 'cli.js']) rmSync(join(BUNDLE, f), { force: true });

cpSync(join(ROOT, 'backend', 'server.js'), join(BUNDLE, 'server.js'));
cpSync(join(ROOT, 'cli', 'cli.js'), join(BUNDLE, 'cli.js'));
cpSync(DIST, join(BUNDLE, 'public'), { recursive: true });

writeFileSync(
  join(BUNDLE, '.env'),
  '# Loaded automatically by Bun. Tells the server to also serve the built web app.\nPUBLIC_DIR=./public\n',
);
writeFileSync(
  join(BUNDLE, 'package.json'),
  JSON.stringify(
    {
      name: 'snip-bundle',
      version: '1.0.0',
      private: true,
      description:
        'Snip — the whole app bundled: one Bun server serving the API, short-code redirects, and the built Angular web UI. CLI included.',
      scripts: { start: 'bun server.js' },
    },
    null,
    2,
  ) + '\n',
);

// Commit the bundle submodule (idempotent: git commit errors when nothing is staged,
// and the hourly CI usually finds nothing changed, so guard on the staged diff).
run('git', ['-C', BUNDLE, 'add', '-A']);
if (capture('git', ['-C', BUNDLE, 'diff', '--cached', '--name-only'])) {
  run('git', ['-C', BUNDLE, 'commit', '-m', 'Rebuild bundle from source branches']);
  if (PUSH) run('git', ['-C', BUNDLE, 'push', 'origin', 'HEAD:bundle']);
  console.log('> bundle updated.');
} else {
  console.log('> bundle unchanged.');
}

// Bump the pointers in the superproject (bundle + any advanced source submodules)
run('git', ['add', '--', 'backend', 'frontend', 'cli', 'bundle']);
if (capture('git', ['diff', '--cached', '--name-only', '--', 'backend', 'frontend', 'cli', 'bundle'])) {
  run('git', ['commit', '-m', 'Bump submodule pointers (bundle release)']);
  if (PUSH) run('git', ['push']);
  console.log('> superproject pointers bumped.');
} else {
  console.log('> superproject pointers unchanged.');
}

console.log(
  PUSH
    ? '✓ Bundle rebuilt, committed, and pushed.'
    : '✓ Bundle rebuilt and committed locally (run with --push to publish).',
);
