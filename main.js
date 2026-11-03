const { app, BrowserWindow, ipcMain, shell } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');

const RENDERER = path.join(__dirname, 'renderer');
let win = null;
let port = 0;
let pendingUrl = null;

// ---------- storage ----------
const dataDir = () => path.join(app.getPath('userData'), 'courses');
const ensureDir = () => fs.mkdirSync(dataDir(), { recursive: true });
const courseFile = (id) => path.join(dataDir(), id.replace(/[^\w-]/g, '') + '.json');
const readCourse = (id) => JSON.parse(fs.readFileSync(courseFile(id), 'utf8'));
const writeCourse = (c) => {
  ensureDir();
  const f = courseFile(c.id);
  fs.writeFileSync(f + '.tmp', JSON.stringify(c, null, 2));
  fs.renameSync(f + '.tmp', f);
};
const listCourses = () => {
  ensureDir();
  return fs.readdirSync(dataDir()).filter((f) => f.endsWith('.json'))
    .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(dataDir(), f), 'utf8')); } catch { return null; } })
    .filter(Boolean)
    .sort((a, b) => (b.lastOpened || b.createdAt) - (a.lastOpened || a.createdAt));
};

// ---------- yt-dlp ----------
const localBin = () => path.join(app.getPath('userData'), 'bin', 'yt-dlp');
function findYtDlp() {
  for (const p of (process.env.PATH || '').split(':')) {
    const f = path.join(p, 'yt-dlp');
    if (fs.existsSync(f)) return f;
  }
  return fs.existsSync(localBin()) ? localBin() : null;
}
async function ensureYtDlp(send) {
  let bin = findYtDlp();
  if (bin) return bin;
  send('Downloading yt-dlp (one time)…');
  const res = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux', { redirect: 'follow' });
  if (!res.ok) throw new Error('Could not download yt-dlp (HTTP ' + res.status + ')');
  fs.mkdirSync(path.dirname(localBin()), { recursive: true });
  fs.writeFileSync(localBin(), Buffer.from(await res.arrayBuffer()), { mode: 0o755 });
  return localBin();
}
const run = (bin, args) => new Promise((resolve, reject) => {
  execFile(bin, args, { maxBuffer: 256 * 1024 * 1024, timeout: 180000 }, (err, out, errout) =>
    err ? reject(new Error((errout || err.message).split('\n').filter(Boolean).pop())) : resolve(out));
});

function playlistId(input) {
  const s = String(input || '').trim();
  try {
    const u = new URL(s);
    const l = u.searchParams.get('list');
    if (l) return l;
  } catch {}
  return /^(PL|UU|OL|FL|LL)[\w-]{10,}$/.test(s) ? s : null;
}

async function importPlaylist(input, send) {
  const pid = playlistId(input);
  if (!pid) throw new Error('That does not look like a YouTube playlist link (needs ?list=…)');
  const existing = listCourses().find((c) => c.playlistId === pid);
  if (existing) return existing;
  const bin = await ensureYtDlp(send);
  send('Reading playlist…');
  const out = await run(bin, ['--flat-playlist', '-J', '--no-warnings', 'https://www.youtube.com/playlist?list=' + pid]);
  const j = JSON.parse(out);
  const lessons = (j.entries || [])
    .filter((e) => e && e.id && !/^\[(Private|Deleted) video\]$/i.test(e.title || ''))
    .map((e, i) => ({
      id: e.id, title: e.title || 'Lesson ' + (i + 1), duration: Math.round(e.duration || 0),
      done: false, pos: 0, notes: '',
    }));
  if (!lessons.length) throw new Error('No playable videos found in this playlist');
  const course = {
    id: pid, playlistId: pid,
    title: j.title || 'Untitled course',
    channel: j.channel || j.uploader || '',
    url: 'https://www.youtube.com/playlist?list=' + pid,
    thumbnail: 'https://i.ytimg.com/vi/' + lessons[0].id + '/hqdefault.jpg',
    createdAt: Date.now(), lastOpened: Date.now(), lastLesson: lessons[0].id, lessons,
  };
  writeCourse(course);
  return course;
}

// ---------- local server (YouTube embeds refuse file:// origins) ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const f = path.normalize(path.join(RENDERER, rel === '/' ? 'index.html' : rel));
      if (!f.startsWith(RENDERER) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv.address().port));
  });
}

// ---------- ad blocking (network rules + in-player ad skipper) ----------
const AD_HOSTS = ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com',
  'google-analytics.com', 'googletagmanager.com', 'googletagservices.com', 'moatads.com', 'adsafeprotected.com',
  'imasdk.googleapis.com', 'pagead2.googlesyndication.com', 'static.doubleclick.net', 'ad.doubleclick.net'];
const AD_PATHS = [/\/pagead\//, /\/api\/stats\/ads/, /\/ptracking/, /\/get_midroll_/, /\/youtubei\/v1\/player\/ad_break/,
  /[?&]ad_type=/, /\/api\/stats\/qoe\?.*adformat/, /\/generate_204\?.*ad/];
const AD_SKIPPER = `(() => {
  if (window.__ytcAds) return; window.__ytcAds = true;
  const st = document.createElement('style');
  st.textContent = '.ytp-pause-overlay,.ytp-pause-overlay-container,.ytp-endscreen-content,.ytp-ce-element,.ytp-cards-teaser,.ytp-suggested-action,.ytp-videowall-still,.ytp-chrome-top,.ytp-gradient-top,.ytp-show-cards-title,.ytp-watermark,.ytp-impression-link,.iv-branding,.annotation{display:none!important}';
  document.head.appendChild(st);
  let mutedByUs = false;
  const tick = () => {
    const p = document.querySelector('.html5-video-player'); if (!p) return;
    const v = p.querySelector('video');
    document.querySelectorAll('.ytp-ad-overlay-container,.ytp-ad-module .ytp-ad-image-overlay,.ytp-paid-content-overlay,.video-ads')
      .forEach((e) => { e.style.display = 'none'; });
    if (p.classList.contains('ad-showing') && v) {
      if (!v.muted) { v.muted = true; mutedByUs = true; }
      v.playbackRate = 16;
      if (isFinite(v.duration) && v.duration > 0) v.currentTime = v.duration;
      document.querySelectorAll('.ytp-skip-ad-button,.ytp-ad-skip-button,.ytp-ad-skip-button-modern,.ytp-skip-ad-button__text')
        .forEach((b) => b.click());
    } else if (mutedByUs && v) { v.muted = false; v.playbackRate = 1; mutedByUs = false; }
  };
  setInterval(tick, 250);
})();`;
// ---------- Do Not Disturb while studying (GNOME) ----------
const DND_KEY = ['org.gnome.desktop.notifications', 'show-banners'];
const dndFile = () => path.join(app.getPath('userData'), 'dnd-prev');
let dndPrev = null;
const gs = (a) => new Promise((res) => execFile('gsettings', a, (e, out) => res(e ? null : out.trim())));
async function setDnd(on) {
  if (on) {
    const cur = await gs(['get', ...DND_KEY]);
    if (cur === null) return false; // not GNOME / gsettings missing
    if (dndPrev === null) { dndPrev = cur; try { fs.writeFileSync(dndFile(), cur); } catch {} }
    await gs(['set', ...DND_KEY, 'false']);
    return true;
  }
  if (dndPrev !== null) { await gs(['set', ...DND_KEY, dndPrev]); dndPrev = null; try { fs.rmSync(dndFile(), { force: true }); } catch {} }
  return true;
}
function restoreDndSync() { // also recovers after a crash
  try {
    const v = dndPrev !== null ? dndPrev : (fs.existsSync(dndFile()) ? fs.readFileSync(dndFile(), 'utf8').trim() : null);
    if (v === 'true' || v === 'false') execFileSync('gsettings', ['set', ...DND_KEY, v]);
    dndPrev = null; fs.rmSync(dndFile(), { force: true });
  } catch {}
}

// ---------- captions / audio-track control inside the embed frame ----------
const FP = `const p=document.getElementById('movie_player');`;
const FRAME_OPS = {
  audioList: () => `(()=>{${FP}if(!p||!p.getAvailableAudioTracks)return null;
    const info=(t)=>{for(const k of Object.keys(t)){const v=t[k];if(v&&typeof v==='object'&&'isAutoDubbed' in v)return v}return {}};
    const l=p.getAvailableAudioTracks()||[];const c=p.getAudioTrack&&p.getAudioTrack();
    return {tracks:l.map((t,i)=>{const x=info(t);return {i,name:x.name||('Track '+(i+1)),dubbed:!!x.isAutoDubbed,def:!!x.isDefault}}),cur:c?l.findIndex(t=>t.id===c.id):-1}})()`,
  audioSet: (i) => `(()=>{${FP}const l=p.getAvailableAudioTracks();if(!l[${+i}])return false;p.setAudioTrack(l[${+i}]);return true})()`,
  ccList: () => `(()=>{${FP}if(!p||!p.getOption)return null;try{p.loadModule('captions')}catch(e){}
    let l=p.getOption('captions','tracklist')||[];
    if(!l.length&&p.getAvailableAudioTracks){const a=p.getAvailableAudioTracks()||[];const c=p.getAudioTrack&&p.getAudioTrack();
      const t=(c&&a.find(x=>x.id===c.id))||a[0];l=(t&&t.captionTracks)||[]}
    const seen={};const out=[];for(const t of l){if(seen[t.languageCode])continue;seen[t.languageCode]=1;out.push({code:t.languageCode,name:t.displayName||t.languageName,kind:t.kind||'',tr:!!t.isTranslateable})}
    const c=p.getOption('captions','track')||{};return {tracks:out,cur:c.languageCode||null}})()`,
  ccSet: (code) => `(()=>{${FP}try{p.loadModule('captions')}catch(e){}p.setOption('captions','track',${JSON.stringify(code ? { languageCode: String(code) } : {})});return true})()`,
  ccOff: () => `(()=>{${FP}p.setOption('captions','track',{});try{p.unloadModule('captions')}catch(e){}return true})()`,
};
function embedFrame(wc) {
  return wc.mainFrame.framesInSubtree.find((f) => /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\//.test(f.url));
}
ipcMain.handle('player:op', async (e, op, arg) => {
  const f = embedFrame(e.sender), mk = FRAME_OPS[op];
  if (!f || !mk) return null;
  try { return await f.executeJavaScript(mk(arg)); } catch { return null; }
});

function setupAdBlock(session, getWin) {
  session.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (d, cb) => {
    let block = false;
    try {
      const u = new URL(d.url);
      if (u.hostname !== '127.0.0.1') {
        block = AD_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h)) ||
          (/(^|\.)youtube\.com$|(^|\.)googlevideo\.com$/.test(u.hostname) && AD_PATHS.some((r) => r.test(u.pathname + u.search)));
      }
    } catch {}
    cb({ cancel: block });
  });
  const w = getWin();
  w.webContents.on('did-frame-finish-load', (_e, isMain, pid, rid) => {
    if (isMain) return;
    const { webFrameMain } = require('electron');
    const f = webFrameMain.fromId(pid, rid);
    if (f && /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\//.test(f.url)) {
      f.executeJavaScript(AD_SKIPPER).catch(() => {});
    }
  });
}

// ---------- window ----------
function pushUrl(url) {
  if (win && !win.webContents.isLoading()) win.webContents.send('incoming-url', url);
  else pendingUrl = url;
}
function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 880, minWidth: 960, minHeight: 600, backgroundColor: '#1c1d1f',
    title: 'Playlearn', autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  setupAdBlock(win.webContents.session, () => win);
  win.loadURL(`http://127.0.0.1:${port}/`);
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('did-finish-load', () => {
    if (pendingUrl) { win.webContents.send('incoming-url', pendingUrl); pendingUrl = null; }
  });
}

const urlArg = (argv) => argv.find((a) => /^https?:\/\//.test(a) || /^ytcourse:/.test(a));

app.setDesktopName('playlearn.desktop');
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', (_e, argv) => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
    const u = urlArg(argv); if (u) pushUrl(u);
  });
  app.whenReady().then(async () => {
    // one-time migration from the old "YT Course" app name
    try {
      const old = path.join(app.getPath('appData'), 'YT Course', 'courses');
      if (fs.existsSync(old) && !fs.existsSync(dataDir())) fs.cpSync(old, dataDir(), { recursive: true });
    } catch {}
    restoreDndSync();
    port = await startServer();
    ipcMain.handle('courses:list', () => listCourses());
    ipcMain.handle('courses:get', (_e, id) => readCourse(id));
    ipcMain.handle('courses:save', (_e, c) => { writeCourse(c); return true; });
    ipcMain.handle('courses:delete', (_e, id) => { fs.rmSync(courseFile(id), { force: true }); return true; });
    ipcMain.handle('courses:import', async (e, url) => {
      try { return { ok: true, course: await importPlaylist(url, (m) => e.sender.send('import-status', m)) }; }
      catch (err) { return { ok: false, error: err.message }; }
    });
    ipcMain.handle('dnd:set', (_e, on) => setDnd(!!on));
    ipcMain.handle('open-external', (_e, u) => shell.openExternal(u));
    pendingUrl = urlArg(process.argv.slice(1)) || null;
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', restoreDndSync);
}
