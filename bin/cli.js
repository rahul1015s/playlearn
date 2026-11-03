#!/usr/bin/env node
// Playlearn installer / launcher.  Usage:
//   npx playlearn            install for the current user and launch
//   npx playlearn install    same, without launching (--no-launch)
//   npx playlearn uninstall  remove the app (add --purge to delete saved courses too)
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync, spawn } = require('child_process');

const SRC = path.join(__dirname, '..');
const pkg = require(path.join(SRC, 'package.json'));
const HOME = os.homedir();
const DATA = process.env.XDG_DATA_HOME || path.join(HOME, '.local', 'share');
const APP = path.join(DATA, 'playlearn');
const BIN = path.join(HOME, '.local', 'bin');
const APPS = path.join(DATA, 'applications');
const ICONS = path.join(DATA, 'icons', 'hicolor');
const LAUNCHER = path.join(BIN, 'playlearn');
const DESKTOP = path.join(APPS, 'playlearn.desktop');

const args = process.argv.slice(2);
const cmd = args.find((a) => !a.startsWith('-')) || 'install';
const has = (f) => args.includes(f);
const log = (m = '') => console.log(m);
const step = (m) => console.log('\x1b[35m▸\x1b[0m ' + m);
const which = (c) => spawnSync('sh', ['-c', `command -v ${c}`], { encoding: 'utf8' }).stdout.trim();

function die(m) { console.error('\x1b[31m✗ ' + m + '\x1b[0m'); process.exit(1); }

function install() {
  if (process.platform !== 'linux') die('Playlearn currently supports Linux desktops only.');
  if (!which('npm')) die('npm was not found. Install Node.js first (Fedora: sudo dnf install nodejs).');

  log('\n  Playlearn – YouTube playlists as Udemy-style courses\n');
  step('Installing app files to ' + APP);
  fs.mkdirSync(APP, { recursive: true });
  for (const d of ['renderer', 'assets']) {
    fs.rmSync(path.join(APP, d), { recursive: true, force: true });
    fs.cpSync(path.join(SRC, d), path.join(APP, d), { recursive: true });
  }
  for (const f of ['main.js', 'preload.js', 'LICENSE', 'README.md']) {
    if (fs.existsSync(path.join(SRC, f))) fs.copyFileSync(path.join(SRC, f), path.join(APP, f));
  }
  const appPkg = { name: pkg.name, productName: pkg.productName, version: pkg.version, description: pkg.description,
    main: 'main.js', license: pkg.license, dependencies: { electron: pkg.devDependencies.electron } };
  fs.writeFileSync(path.join(APP, 'package.json'), JSON.stringify(appPkg, null, 2) + '\n');

  step('Installing Electron (first time downloads ~100 MB)…');
  const r = spawnSync('npm', ['install', '--omit=dev', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: APP, stdio: 'inherit' });
  if (r.status !== 0) die('npm install failed.');
  const electron = path.join(APP, 'node_modules', 'electron');
  if (!fs.existsSync(path.join(electron, 'dist', 'electron'))) {
    spawnSync(process.execPath, [path.join(electron, 'install.js')], { stdio: 'inherit' });
  }
  if (!fs.existsSync(path.join(electron, 'dist', 'electron'))) die('Electron binary is missing (download failed?).');

  step('Creating the `playlearn` command and app-menu entry');
  fs.mkdirSync(BIN, { recursive: true });
  fs.writeFileSync(LAUNCHER, `#!/bin/bash\ncd "${APP}" && exec ./node_modules/.bin/electron . "$@"\n`, { mode: 0o755 });
  for (const s of [48, 64, 128, 256, 512]) {
    const d = path.join(ICONS, `${s}x${s}`, 'apps'); fs.mkdirSync(d, { recursive: true });
    fs.copyFileSync(path.join(SRC, 'assets', `icon-${s}.png`), path.join(d, 'playlearn.png'));
  }
  const sc = path.join(ICONS, 'scalable', 'apps'); fs.mkdirSync(sc, { recursive: true });
  fs.copyFileSync(path.join(SRC, 'assets', 'icon.svg'), path.join(sc, 'playlearn.svg'));
  fs.mkdirSync(APPS, { recursive: true });
  fs.writeFileSync(DESKTOP, `[Desktop Entry]
Name=Playlearn
Comment=Turn YouTube playlists into Udemy-style courses
Exec=${LAUNCHER} %u
Icon=playlearn
Terminal=false
Type=Application
Categories=Education;AudioVideo;
StartupWMClass=Playlearn
`);
  spawnSync('update-desktop-database', [APPS], { stdio: 'ignore' });
  spawnSync('gtk-update-icon-cache', ['-f', '-t', ICONS], { stdio: 'ignore' });

  log();
  log('\x1b[32m✓ Playlearn installed.\x1b[0m  Open it from your app menu, or run: playlearn');
  if (!(process.env.PATH || '').split(':').includes(BIN)) log(`  Note: add ${BIN} to your PATH to use the \`playlearn\` command.`);
  if (!which('yt-dlp')) log('  Tip: install yt-dlp for importing playlists:  sudo dnf install yt-dlp  (it is also auto-downloaded on first import)');

  if (!has('--no-launch') && (process.env.DISPLAY || process.env.WAYLAND_DISPLAY)) {
    spawn(LAUNCHER, [], { detached: true, stdio: 'ignore' }).unref();
  }
}

function uninstall() {
  step('Removing Playlearn');
  for (const p of [LAUNCHER, DESKTOP, APP]) fs.rmSync(p, { recursive: true, force: true });
  for (const s of ['48x48', '64x64', '128x128', '256x256', '512x512', 'scalable']) {
    for (const e of ['png', 'svg']) fs.rmSync(path.join(ICONS, s, 'apps', 'playlearn.' + e), { force: true });
  }
  spawnSync('update-desktop-database', [APPS], { stdio: 'ignore' });
  if (has('--purge')) {
    fs.rmSync(path.join(process.env.XDG_CONFIG_HOME || path.join(HOME, '.config'), 'Playlearn'), { recursive: true, force: true });
    log('Saved courses deleted.');
  } else log('Your saved courses were kept (~/.config/Playlearn). Use --purge to delete them too.');
  log('\x1b[32m✓ Uninstalled.\x1b[0m');
}

if (cmd === 'install') install();
else if (cmd === 'uninstall') uninstall();
else if (cmd === 'help' || has('--help') || has('-h')) {
  log('Usage: npx playlearn [install|uninstall] [--no-launch] [--purge]');
} else die('Unknown command: ' + cmd + '  (try: install, uninstall)');
