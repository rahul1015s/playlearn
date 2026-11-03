const $app = document.getElementById('app');
const SECTION_SIZE = 10;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDur = (s) => {
  s = Math.round(s || 0);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}min`;
  return sec ? `${sec}s` : '–';
};
const pct = (c) => (c.lessons.length ? Math.round((c.lessons.filter((l) => l.done).length / c.lessons.length) * 100) : 0);
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const I = {
  play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#1c1d1f"><path d="M8 5v14l11-7z"/></svg>',
  playSm: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z" fill="currentColor"/></svg>',
  chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4"><path d="M4 12l5 5 11-11"/></svg>',
  panel: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  pplay: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M7 4.5v15l13-7.5z"/></svg>',
  ppause: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4.5" width="4.2" height="15" rx="1"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1"/></svg>',
  back10: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/><text x="12" y="15.5" text-anchor="middle" font-size="7.5" fill="#fff" stroke="none" font-weight="700">10</text></svg>',
  fwd10: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-9-9 9 9 0 016.4 2.6L21 8"/><path d="M21 3v5h-5"/><text x="12" y="15.5" text-anchor="middle" font-size="7.5" fill="#fff" stroke="none" font-weight="700">10</text></svg>',
  vol: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="#fff"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
  muted: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="#fff"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  full: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  focus: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3"/></svg>',
  note: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10l4 4v14H5z"/><path d="M9 11h6M9 15h4"/></svg>',
  timer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
  cc: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10.5 10.2a2.2 2.2 0 100 3.6M17 10.2a2.2 2.2 0 100 3.6"/></svg>',
  dub: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  logo: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>',
  book: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#a435f0" stroke-width="1.5"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19V5M9 8h6"/></svg>',
};

function toast(msg, err) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast' + (err ? ' err' : ''); t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), err ? 6000 : 3000);
}

// ---------- import ----------
let importing = false;
async function doImport(url) {
  if (importing) return;
  importing = true;
  const btn = document.getElementById('addBtn'), st = document.getElementById('status');
  if (btn) btn.disabled = true;
  if (st) st.textContent = 'Working…';
  const r = await api.importPlaylist(url);
  importing = false;
  if (r.ok) { openCourse(r.course.id); toast('Course ready: ' + r.course.title); }
  else { toast(r.error, true); if (st) st.textContent = r.error; if (btn) btn.disabled = false; }
}
api.onStatus((m) => { const st = document.getElementById('status'); if (st) st.textContent = m; });
api.onIncomingUrl((u) => { goHome().then(() => doImport(u)); });

// ---------- home ----------
async function goHome() {
  destroyPlayer();
  const courses = await api.list();
  const last = courses.find((c) => pct(c) < 100 && c.lessons.some((l) => l.done || l.pos));
  $app.innerHTML = `
  <div class="home">
    <div class="hero">
      <div class="logo" style="margin-bottom:28px"><img src="icon.svg" width="30" height="30" alt="" style="border-radius:8px">Playlearn</div>
      <h1>Turn any YouTube playlist into a course.</h1>
      <p>Paste a playlist link. Get a Udemy-style classroom with sections, progress tracking and notes – saved on this computer.</p>
      <form class="add" id="addForm">
        <input id="url" placeholder="https://www.youtube.com/playlist?list=…" autocomplete="off" spellcheck="false" autofocus>
        <button class="btn" id="addBtn" type="submit">Create course</button>
      </form>
      <div class="status" id="status"></div>
    </div>
    <div class="wrap">
      ${last ? `<h2>Continue learning</h2>
      <div class="cont" data-open="${esc(last.id)}">
        <div class="thumb" style="background-image:url(${esc(last.thumbnail)})"><div class="play"><b>${I.play}</b></div></div>
        <div style="flex:1"><h3>${esc(last.title)}</h3>
          <p>${last.lessons.filter((l) => l.done).length} of ${last.lessons.length} lessons complete</p>
          <div class="bar"><i style="width:${pct(last)}%"></i></div></div>
        <button class="btn">Resume</button>
      </div>` : ''}
      <h2>My courses</h2>
      ${courses.length ? `<div class="grid">${courses.map(card).join('')}</div>` : `
      <div class="empty">${I.book}<h3>No courses yet</h3><p>Paste a playlist link above, or drag a link onto this window.</p></div>`}
    </div>
  </div>`;
  document.getElementById('addForm').onsubmit = (e) => { e.preventDefault(); doImport(document.getElementById('url').value); };
  $app.querySelectorAll('[data-open]').forEach((el) => (el.onclick = () => openCourse(el.dataset.open)));
  $app.querySelectorAll('[data-del]').forEach((el) => (el.onclick = async (e) => {
    e.stopPropagation();
    if (el.dataset.confirm !== '1') { el.dataset.confirm = '1'; el.style.width = 'auto'; el.style.padding = '0 10px'; el.textContent = 'Click again to delete'; setTimeout(goHome, 2500); return; }
    await api.remove(el.dataset.del); goHome();
  }));
}
function card(c) {
  const total = c.lessons.reduce((a, l) => a + l.duration, 0), p = pct(c);
  return `<div class="card" data-open="${esc(c.id)}">
    <div class="thumb" style="background-image:url(${esc(c.thumbnail)})"><div class="play"><b>${I.play}</b></div></div>
    <button class="del" data-del="${esc(c.id)}" title="Delete course">${I.trash}</button>
    <div class="card-body"><h3>${esc(c.title)}</h3><small>${esc(c.channel)}</small>
      <div class="meta"><span>${c.lessons.length} lessons · ${fmtDur(total)}</span><span>${p}%</span></div>
      <div class="bar"><i style="width:${p}%"></i></div></div></div>`;
}
// drag & drop a link anywhere
window.addEventListener('dragover', (e) => { e.preventDefault(); document.body.classList.add('drop-over'); });
window.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('drop-over'); });
window.addEventListener('drop', (e) => {
  e.preventDefault(); document.body.classList.remove('drop-over');
  const t = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
  if (t) goHome().then(() => doImport(t.trim()));
});

// ---------- course ----------
let C = null, cur = 0, uiTick = null, player = null, saveTimer = null, tick = null, autoNext = true, tab = 'overview', sideOpen = true;
const openSecs = new Set();

function destroyPlayer() {
  clearInterval(tick); tick = null; clearInterval(uiTick); uiTick = null;
  if (player && player.destroy) { try { player.destroy(); } catch {} }
  player = null;
  flushSave();
}
function flushSave() { if (C && saveTimer) { clearTimeout(saveTimer); saveTimer = null; api.save(C); } }
function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { saveTimer = null; api.save(C); }, 400); }

async function openCourse(id) {
  destroyPlayer();
  C = await api.get(id);
  C.lastOpened = Date.now();
  cur = Math.max(0, C.lessons.findIndex((l) => l.id === C.lastLesson));
  openSecs.clear(); openSecs.add(Math.floor(cur / SECTION_SIZE));
  tab = 'overview';
  renderCourse();
  queueSave();
}

function ringSvg(p) {
  const r = 16, c = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="${r}" fill="none" stroke="#6a6f73" stroke-width="3"/>
  <circle cx="20" cy="20" r="${r}" fill="none" stroke="#c0c4fc" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" transform="rotate(-90 20 20)"/>
  <text x="20" y="24" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">${p}</text></svg>`;
}

function renderCourse() {
  const L = C.lessons[cur];
  $app.innerHTML = `
  <div class="course ${focusMode ? 'focus' : ''}">
    <div class="topbar">
      <button class="back" id="back" title="Back to home (Esc)">${I.back} Back</button>
      <div class="logo" id="goHome" title="Home"><img src="icon.svg" width="28" height="28" alt="" style="border-radius:7px">Playlearn</div>
      <div class="sep"></div>
      <div class="ctitle">${esc(C.title)}</div>
      <div class="prog" id="prog">${ringSvg(pct(C))}<span>${C.lessons.filter((l) => l.done).length}/${C.lessons.length} done</span></div>
      <div class="timerwrap"><button class="tb-btn" id="timerBtn" title="Study timer">${I.timer}<span id="timerTxt">Timer</span></button><div class="pop" id="timerPop" hidden></div></div>
      <button class="tb-btn" id="toggleSide" title="Course content">${I.panel}</button>
    </div>
    <div class="main">
      <div class="left">
        <div class="player idle0" id="playerBox">
          <div id="yt"></div>
          <div class="shield" id="shield"></div>
          <div class="bigplay" id="bigplay"></div>
          <div class="tchip" id="tchip" hidden></div>
          <div class="endcard" id="endcard" hidden></div>
          <div class="qnote" id="qnote" hidden></div>
          <div class="controls" id="controls">
            <input type="range" class="seek" id="seek" min="0" max="1000" value="0" step="1">
            <div class="crow">
              <button class="cb2" id="pp" title="Play/Pause (Space)"></button>
              <button class="cb2" id="back10" title="Back 10s (J)">${I.back10}</button>
              <button class="cb2" id="fwd10" title="Forward 10s (L)">${I.fwd10}</button>
              <button class="cb2" id="mute" title="Mute (M)"></button>
              <input type="range" class="vol" id="vol" min="0" max="100" value="100">
              <span class="time"><span id="tcur">0:00</span> / <span id="tdur">0:00</span></span>
              <span class="grow"></span>
              <button class="cb2" id="noteBtn" title="Add note at this moment (N)">${I.note}</button>
              <div class="speedwrap"><button class="cb2" id="ccBtn" title="Captions (C)">${I.cc}</button><div class="menu" id="ccMenu" hidden></div></div>
              <div class="speedwrap"><button class="cb2" id="dubBtn" title="Audio / auto-dubbed">${I.dub}</button><div class="menu" id="dubMenu" hidden></div></div>
              <div class="speedwrap"><button class="cb2 txt" id="speed" title="Speed (&lt; &gt;)">1x</button><div class="menu" id="speedMenu" hidden></div></div>
              <button class="cb2" id="focusBtn" title="Focus mode (Z)">${I.focus}</button>
              <button class="cb2" id="fs" title="Fullscreen (F)">${I.full}</button>
            </div>
          </div>
        </div>
        <div class="lesson-bar">
          <span class="t">${cur + 1}. ${esc(L.title)}</span>
          <label class="switch"><input type="checkbox" id="auto" ${autoNext ? 'checked' : ''}> Autoplay next</label>
          <button id="prev" ${cur === 0 ? 'disabled' : ''}>‹ Prev</button>
          <button id="next" ${cur === C.lessons.length - 1 ? 'disabled' : ''}>Next ›</button>
        </div>
        <div class="tabs">
          <button class="tab ${tab === 'overview' ? 'on' : ''}" data-tab="overview">Overview</button>
          <button class="tab ${tab === 'notes' ? 'on' : ''}" data-tab="notes">Notes</button>
        </div>
        <div class="pane" id="pane"></div>
      </div>
      <aside class="side ${sideOpen ? '' : 'closed'}" id="side">
        <div class="side-h"><b>Course content</b><button class="x" id="closeSide" title="Close">${I.x}</button></div>
        <div class="list" id="list"></div>
      </aside>
    </div>
  </div>`;
  document.getElementById('goHome').onclick = goHome;
  document.getElementById('back').onclick = goHome;
  document.getElementById('toggleSide').onclick = () => { sideOpen = !sideOpen; document.getElementById('side').classList.toggle('closed', !sideOpen); };
  document.getElementById('closeSide').onclick = () => { sideOpen = false; document.getElementById('side').classList.add('closed'); };
  document.getElementById('auto').onchange = (e) => (autoNext = e.target.checked);
  document.getElementById('prev').onclick = () => select(cur - 1);
  document.getElementById('next').onclick = () => select(cur + 1);
  $app.querySelectorAll('.tab').forEach((b) => (b.onclick = () => { saveNotes(); tab = b.dataset.tab; $app.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b)); renderPane(); }));
  renderList(); renderPane(); wireTimer(); mountPlayer();
}

function renderPane() {
  const pane = document.getElementById('pane'), L = C.lessons[cur];
  if (tab === 'notes') {
    renderNotesPane(pane, L);
  } else {
    const total = C.lessons.reduce((a, l) => a + l.duration, 0);
    const left = C.lessons.filter((l) => !l.done).reduce((a, l) => a + l.duration, 0);
    pane.innerHTML = `<h2>${esc(C.title)}</h2>
      <p>${esc(C.channel ? 'By ' + C.channel : '')}</p>
      <div class="stats">
        <div><b>${C.lessons.length}</b><span>Lessons</span></div>
        <div><b>${fmtDur(total)}</b><span>Total length</span></div>
        <div><b>${fmtDur(left)}</b><span>Left to watch</span></div>
        <div><b>${pct(C)}%</b><span>Complete</span></div>
      </div>
      <button class="btn ghost" id="syncBtn">Source playlist ↗</button>`;
    document.getElementById('syncBtn').onclick = () => api.openExternal(C.url);
  }
}
function saveNotes() { const ta = document.getElementById('notes'); if (ta) { C.lessons[cur].notes = ta.value; queueSave(); } }

function renderList() {
  const list = document.getElementById('list');
  const n = Math.ceil(C.lessons.length / SECTION_SIZE);
  let html = '';
  for (let s = 0; s < n; s++) {
    const a = s * SECTION_SIZE, items = C.lessons.slice(a, a + SECTION_SIZE);
    const done = items.filter((l) => l.done).length, dur = items.reduce((x, l) => x + l.duration, 0);
    html += `<div class="sec ${openSecs.has(s) ? 'open' : ''}" data-s="${s}">
      <button class="sec-h"><div><b>Section ${s + 1}: Lessons ${a + 1}–${a + items.length}</b><small>${done} / ${items.length} | ${fmtDur(dur)}</small></div>${I.chev}</button>
      <div class="items">${items.map((l, k) => {
        const i = a + k;
        return `<div class="item ${i === cur ? 'on' : ''}" data-i="${i}">
          <div class="cb ${l.done ? 'done' : ''}" data-cb="${i}">${l.done ? I.check : ''}</div>
          <div><div class="t">${i + 1}. ${esc(l.title)}</div><div class="d">${I.playSm}${fmtDur(l.duration)}</div></div></div>`;
      }).join('')}</div></div>`;
  }
  const st = list.scrollTop;
  list.innerHTML = html;
  list.scrollTop = st;
  list.querySelectorAll('.sec-h').forEach((b) => (b.onclick = () => {
    const s = +b.parentElement.dataset.s; openSecs.has(s) ? openSecs.delete(s) : openSecs.add(s); b.parentElement.classList.toggle('open');
  }));
  list.querySelectorAll('.item').forEach((el) => (el.onclick = () => select(+el.dataset.i)));
  list.querySelectorAll('[data-cb]').forEach((el) => (el.onclick = (e) => { e.stopPropagation(); setDone(+el.dataset.cb, !C.lessons[+el.dataset.cb].done); }));
}

function refreshProgress() {
  const p = document.getElementById('prog');
  if (p) p.innerHTML = `${ringSvg(pct(C))}<span>${C.lessons.filter((l) => l.done).length}/${C.lessons.length} done</span>`;
  renderList();
  if (tab === 'overview') renderPane();
}
function setDone(i, v) { C.lessons[i].done = v; queueSave(); refreshProgress(); }

function select(i) {
  if (i < 0 || i >= C.lessons.length) return;
  saveNotes(); persistPos();
  cur = i; C.lastLesson = C.lessons[i].id; openSecs.add(Math.floor(i / SECTION_SIZE));
  queueSave();
  renderCourse();
}

// ---------- player ----------
function persistPos() {
  try {
    if (player && player.getCurrentTime) {
      const L = C.lessons[cur], t = Math.floor(player.getCurrentTime());
      if (t > 0) L.pos = t;
    }
  } catch {}
}
function mountPlayer() {
  const L = C.lessons[cur];
  const make = () => {
    player = new YT.Player('yt', {
      videoId: L.id, width: '100%', height: '100%',
      playerVars: { rel: 0, modestbranding: 1, autoplay: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, playsinline: 1, start: L.done ? 0 : L.pos || 0, enablejsapi: 1, origin: location.origin },
      events: {
        onReady: () => wireControls(),
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) applyPrefsOnce();
          setPlayingUI(e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING);
          showEnd(e.data === YT.PlayerState.ENDED);
          if (e.data === YT.PlayerState.PLAYING) {
            clearInterval(tick);
            tick = setInterval(() => {
              persistPos();
              try { // auto-complete at 92%
                const d = player.getDuration(), t = player.getCurrentTime();
                if (!L.done && d > 30 && t / d > 0.92) setDone(cur, true);
              } catch {}
              queueSave();
            }, 4000);
          } else clearInterval(tick);
          if (e.data === YT.PlayerState.ENDED) {
            L.pos = 0;
            if (!L.done) setDone(cur, true);
            if (autoNext && cur < C.lessons.length - 1) select(cur + 1);
          }
        },
        onError: () => toast('This video cannot be played in the embedded player (embedding may be disabled by its owner). Try the next lesson.', true),
      },
    });
  };
  if (window.YT && YT.Player) make();
  else {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev && prev(); make(); };
  }
}

window.addEventListener('beforeunload', () => { persistPos(); flushSave(); });

// ---------- custom controls ----------
const fmtT = (t) => { t = Math.max(0, Math.floor(t || 0)); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), x = t % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
let isPlaying = false, dragging = false, idleT = null;
const $ = (id) => document.getElementById(id);

function setPlayingUI(p) {
  isPlaying = p;
  const b = $('pp'); if (b) b.innerHTML = p ? I.ppause : I.pplay;
  bumpControls();
}
function togglePlay() { if (!player || !player.getPlayerState) return; isPlaying ? player.pauseVideo() : player.playVideo(); flash(); }
function flash() { const b = $('bigplay'); if (!b) return; b.innerHTML = isPlaying ? I.ppause : I.pplay; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
function seekBy(d) { if (!player) return; const t = Math.max(0, Math.min(player.getDuration() || 1e9, player.getCurrentTime() + d)); player.seekTo(t, true); }
function setVolume(v) { v = Math.max(0, Math.min(100, v)); player.setVolume(v); v > 0 ? player.unMute() : player.mute(); LS.set('vol', v); syncVol(); }
function toggleMute() { player.isMuted() ? (player.unMute(), player.getVolume() === 0 && player.setVolume(50)) : player.mute(); syncVol(); }
function syncVol() { const m = player.isMuted() || player.getVolume() === 0; $('mute').innerHTML = m ? I.muted : I.vol; $('vol').value = m ? 0 : player.getVolume(); }
function setSpeed(r) { player.setPlaybackRate(r); LS.set('rate', r); $('speed').textContent = r + 'x'; }
function stepSpeed(dir) { const rs = player.getAvailablePlaybackRates(), i = rs.indexOf(player.getPlaybackRate()); const n = rs[Math.max(0, Math.min(rs.length - 1, i + dir))]; setSpeed(n); }
function toggleFs() { const el = $('playerBox'); document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen(); }
function bumpControls() {
  const box = $('playerBox'); if (!box) return;
  box.classList.remove('idle'); clearTimeout(idleT);
  if (isPlaying) idleT = setTimeout(() => { closeMenus(); box.classList.add('idle'); }, 2500);
}

function wireControls() {
  $('pp').onclick = togglePlay; $('shield').onclick = togglePlay; $('shield').ondblclick = toggleFs;
  $('back10').onclick = () => seekBy(-10); $('fwd10').onclick = () => seekBy(10);
  $('mute').onclick = toggleMute; $('vol').oninput = (e) => setVolume(+e.target.value);
  $('fs').onclick = toggleFs;
  $('focusBtn').onclick = toggleFocus; $('noteBtn').onclick = () => quickNote();
  $('speed').onclick = () => {
    const m = $('speedMenu');
    m.innerHTML = player.getAvailablePlaybackRates().map((r) => `<button data-r="${r}" class="${r === player.getPlaybackRate() ? 'on' : ''}">${r}x</button>`).join('');
    m.querySelectorAll('button').forEach((b) => (b.onclick = () => { setSpeed(+b.dataset.r); m.hidden = true; }));
    m.hidden = !m.hidden;
  };
  $('ccBtn').onclick = () => openCcMenu();
  $('dubBtn').onclick = () => openDubMenu();
  const seek = $('seek');
  seek.oninput = () => { dragging = true; $('tcur').textContent = fmtT((seek.value / 1000) * player.getDuration()); };
  seek.onchange = () => { player.seekTo((seek.value / 1000) * player.getDuration(), true); dragging = false; };
  const box = $('playerBox');
  box.onmousemove = bumpControls; box.onmouseleave = () => isPlaying && box.classList.add('idle');
  // restore prefs
  player.setVolume(LS.get('vol', 100)); player.setPlaybackRate(LS.get('rate', 1)); $('speed').textContent = player.getPlaybackRate() + 'x';
  syncVol(); setPlayingUI(isPlaying);
  clearInterval(uiTick);
  uiTick = setInterval(() => {
    if (!player || !player.getDuration) return;
    const d = player.getDuration() || 0, t = player.getCurrentTime() || 0;
    $('tcur') && ($('tcur').textContent = fmtT(t)); $('tdur') && ($('tdur').textContent = fmtT(d));
    if (!dragging && d) {
      seek.value = (t / d) * 1000;
      const f = (player.getVideoLoadedFraction() || 0) * 100;
      seek.style.setProperty('--p', (t / d) * 100 + '%'); seek.style.setProperty('--b', f + '%');
    }
  }, 250);
}

// ----- captions & audio (dubbed) -----
// prefs: cc = {on, lang}   audio = {name|null}  (null => original)
const closeMenus = () => ['speedMenu', 'ccMenu', 'dubMenu'].forEach((m) => $(m) && ($(m).hidden = true));
function toggleMenu(id, html, bind) {
  const m = $(id), wasHidden = m.hidden; closeMenus();
  if (!wasHidden) return;
  m.innerHTML = html; m.hidden = false; bind(m);
}
async function openCcMenu() {
  const d = await api.playerOp('ccList');
  const pref = LS.get('cc', { on: false, lang: null });
  let html = `<button data-c="" class="${!d || !d.cur ? 'on' : ''}">Off</button>`;
  if (!d || !d.tracks.length) html += `<button disabled style="opacity:.6">No captions available</button>`;
  else html += d.tracks.map((t) => `<button data-c="${esc(t.code)}" class="${d.cur === t.code ? 'on' : ''}">${esc(t.name)}</button>`).join('');
  toggleMenu('ccMenu', html, (m) => m.querySelectorAll('button[data-c]').forEach((b) => (b.onclick = async () => {
    const code = b.dataset.c;
    if (code) { await api.playerOp('ccSet', code); LS.set('cc', { on: true, lang: code }); } else { await api.playerOp('ccOff'); LS.set('cc', { on: false, lang: pref.lang }); }
    closeMenus(); markCc();
  })));
}
async function toggleCaptions() {
  const pref = LS.get('cc', { on: false, lang: null });
  if (pref.on) { await api.playerOp('ccOff'); LS.set('cc', { on: false, lang: pref.lang }); }
  else { await applyCaptions(true); }
  markCc();
}
function markCc() { const b = $('ccBtn'); if (b) b.classList.toggle('active', LS.get('cc', { on: false }).on); }
async function applyCaptions(force) {
  const pref = LS.get('cc', { on: false, lang: null });
  if (!pref.on && !force) return true;
  const d = await api.playerOp('ccList');
  if (!d || !d.tracks.length) return false;
  const pick = d.tracks.find((t) => t.code === pref.lang) || d.tracks.find((t) => /^en/.test(t.code)) || d.tracks[0];
  await api.playerOp('ccSet', pick.code); LS.set('cc', { on: true, lang: pick.code });
  return true;
}
async function openDubMenu() {
  const d = await api.playerOp('audioList');
  const pref = LS.get('audio', { name: null });
  let html;
  if (!d || d.tracks.length < 2) html = `<button disabled style="opacity:.6">No other audio tracks for this video</button>`;
  else html = d.tracks.map((t) => `<button data-a="${t.i}" class="${d.cur === t.i ? 'on' : ''}">${esc(t.name)}${t.dubbed ? ' <small style="opacity:.7">· auto-dubbed</small>' : ''}</button>`).join('');
  toggleMenu('dubMenu', html, (m) => m.querySelectorAll('button[data-a]').forEach((b) => (b.onclick = async () => {
    const t = d.tracks[+b.dataset.a];
    await api.playerOp('audioSet', t.i);
    LS.set('audio', { name: t.dubbed ? t.name : null }); // original => no preference
    closeMenus(); markDub(t.dubbed);
    toast(t.dubbed ? 'Audio: ' + t.name + ' (auto-dubbed) – used for all lessons when available' : 'Audio: original');
  })));
}
function markDub(on) { const b = $('dubBtn'); if (b) b.classList.toggle('active', !!on); }
async function applyAudio() {
  const pref = LS.get('audio', { name: null });
  if (!pref.name) return true;
  const d = await api.playerOp('audioList');
  if (!d || !d.tracks.length) return false;
  const t = d.tracks.find((x) => x.name === pref.name);
  if (t && d.cur !== t.i) await api.playerOp('audioSet', t.i);
  markDub(!!t);
  return true;
}
// apply saved prefs once per lesson, retrying while the player finishes loading
let prefsFor = null;
async function applyPrefsOnce() {
  const key = C.lessons[cur].id; if (prefsFor === key) return; prefsFor = key;
  for (let n = 0; n < 12 && prefsFor === key; n++) {
    const a = await applyAudio(), c = await applyCaptions(false);
    if (a && c) break;
    await new Promise((r) => setTimeout(r, 1200));
  }
  markCc();
}

// keyboard
window.addEventListener('keydown', (e) => {
  if (!C || !document.querySelector('.course') || /INPUT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.type !== 'range') return;
  if (document.activeElement.type === 'range') document.activeElement.blur();
  const k = e.key;
  if (e.shiftKey && k === 'N') return select(cur + 1);
  if (e.shiftKey && k === 'P') return select(cur - 1);
  if (e.altKey && k === 'ArrowLeft') return goHome();
  if (k === 'Escape' && !document.fullscreenElement) return focusMode ? toggleFocus() : goHome();
  if (!player || !player.getPlayerState) return;
  const map = { ' ': togglePlay, k: togglePlay, j: () => seekBy(-10), l: () => seekBy(10), ArrowLeft: () => seekBy(-5), ArrowRight: () => seekBy(5),
    ArrowUp: () => setVolume(player.getVolume() + 5), ArrowDown: () => setVolume(player.getVolume() - 5), m: toggleMute, f: toggleFs, c: toggleCaptions, z: toggleFocus, n: () => quickNote(),
    '<': () => stepSpeed(-1), ',': () => stepSpeed(-1), '>': () => stepSpeed(1), '.': () => stepSpeed(1) };
  if (map[k]) { e.preventDefault(); map[k](); bumpControls(); }
});

// ---------- focus mode ----------
let focusMode = false;
function toggleFocus() {
  focusMode = !focusMode;
  const c = document.querySelector('.course'); if (c) c.classList.toggle('focus', focusMode);
  if (focusMode) toast('Focus mode – press Z or Esc to exit');
  bumpControls();
}

// ---------- end-of-lesson card (replaces YouTube's suggestion wall) ----------
function showEnd(on) {
  const c = $('endcard'); if (!c) return;
  if (!on) { c.hidden = true; return; }
  const last = cur >= C.lessons.length - 1, nxt = C.lessons[cur + 1];
  c.innerHTML = `<div class="ec"><div class="ect">${last ? 'Course complete' : 'Lesson complete'}</div>
    <div class="ecs">${esc(C.lessons[cur].title)}</div>
    <div class="ecb">${last ? '' : `<button class="btn" id="ecNext">Next: ${esc(nxt.title)} ›</button>`}<button class="btn ghost light" id="ecAgain">Replay</button></div></div>`;
  c.hidden = false;
  const n = $('ecNext'); if (n) n.onclick = () => select(cur + 1);
  $('ecAgain').onclick = () => { c.hidden = true; player.seekTo(0, true); player.playVideo(); };
}

// ---------- timestamped notes ----------
let qnWasPlaying = false;
function quickNote() {
  if (!player || !player.getCurrentTime) return;
  const box = $('qnote'); if (!box || !box.hidden) return;
  const t = Math.floor(player.getCurrentTime()); qnWasPlaying = isPlaying; if (isPlaying) player.pauseVideo();
  box.innerHTML = `<span class="qt">${fmtT(t)}</span><input id="qnIn" placeholder="Note at ${fmtT(t)} – Enter to save, Esc to cancel" maxlength="400" autocomplete="off"><button id="qnSave">Save</button>`;
  box.hidden = false;
  const inp = $('qnIn'); inp.focus();
  const close = (save) => {
    const v = inp.value.trim(); box.hidden = true;
    if (save && v) {
      const L = C.lessons[cur]; (L.marks = L.marks || []).push({ t, text: v }); L.marks.sort((x, y) => x.t - y.t);
      queueSave(); if (tab === 'notes') renderPane(); toast('Note saved at ' + fmtT(t));
    }
    if (qnWasPlaying) player.playVideo();
  };
  inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') close(true); else if (e.key === 'Escape') close(false); };
  $('qnSave').onclick = () => close(true);
}
function renderNotesPane(pane, L) {
  L.marks = L.marks || [];
  pane.innerHTML = `<h2>Notes for lesson ${cur + 1}</h2>
    <div class="nrow"><button class="btn ghost" id="addMark">＋ Note at current time <kbd>N</kbd></button><button class="btn ghost" id="expNotes">Export all notes (.md)</button></div>
    <div id="marks">${L.marks.length ? L.marks.map((m, i) => `<div class="mark"><button class="mt" data-seek="${m.t}" title="Jump to this moment">${fmtT(m.t)}</button><input class="mx" data-i="${i}" value="${esc(m.text)}"><button class="x" data-rm="${i}" title="Delete">${I.x}</button></div>`).join('') : '<div class="hint">No timestamped notes yet – press N while watching.</div>'}</div>
    <h3 class="nh">General notes</h3>
    <textarea class="notes" id="notes" placeholder="Write anything you want to remember…">${esc(L.notes)}</textarea>
    <div class="hint">Saved automatically on this computer.</div>`;
  $('addMark').onclick = () => quickNote();
  $('expNotes').onclick = exportNotes;
  pane.querySelectorAll('[data-seek]').forEach((b) => (b.onclick = () => { player && player.seekTo(+b.dataset.seek, true); }));
  pane.querySelectorAll('.mx').forEach((inp) => (inp.oninput = () => { L.marks[+inp.dataset.i].text = inp.value; queueSave(); }));
  pane.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { L.marks.splice(+b.dataset.rm, 1); queueSave(); renderNotesPane(pane, L); }));
  const ta = $('notes'); ta.oninput = () => { L.notes = ta.value; queueSave(); };
}
function exportNotes() {
  let md = `# ${C.title}\n\n`, any = false;
  C.lessons.forEach((l, i) => {
    const n = (l.notes || '').trim(); if (!n && !(l.marks && l.marks.length)) return;
    any = true; md += `## ${i + 1}. ${l.title}\n\n`;
    (l.marks || []).forEach((m) => (md += `- [${fmtT(m.t)}](https://youtu.be/${l.id}?t=${m.t}) ${m.text}\n`));
    if (n) md += `\n${n}\n`;
    md += '\n';
  });
  if (!any) return toast('No notes to export yet');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
  a.download = (C.title.replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'course') + ' - notes.md';
  a.click();
}

// ---------- study timer (Pomodoro) + Do Not Disturb ----------
const T = { phase: 'idle', left: 0, paused: false, sessions: 0, study: 1500, brk: 300, tm: null, dnd: null };
const clock = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
function notify(title, body) { try { new Notification(title, { body, silent: false }); } catch {} toast(title + ' – ' + body); }
async function setDndState(on) { const ok = await api.dnd(on); if (on) T.dnd = ok; }
function beginPhase(ph) {
  T.phase = ph; T.left = ph === 'study' ? T.study : T.brk; T.paused = false;
  clearInterval(T.tm); T.tm = setInterval(timerTick, 1000);
  if (ph === 'study') setDndState(true);
  else { setDndState(false); try { player && player.pauseVideo(); } catch {} }
  renderTimerUI();
}
function timerStart(studyMin, breakMin) { T.study = studyMin * 60; T.brk = breakMin * 60; T.sessions = 0; LS.set('timerPreset', [studyMin, breakMin]); beginPhase('study'); }
function timerTick() {
  if (T.paused) return;
  if (--T.left > 0) return updateTimerChip();
  if (T.phase === 'study') { T.sessions++; beginPhase('break'); notify('Break time', `Session ${T.sessions} done. Rest for ${Math.round(T.brk / 60)} min.`); }
  else { beginPhase('study'); notify('Back to it', 'Break over – next study session started.'); }
}
function timerStop() { clearInterval(T.tm); T.phase = 'idle'; T.paused = false; setDndState(false); renderTimerUI(); }
function timerPause() { T.paused = !T.paused; setDndState(T.phase === 'study' && !T.paused); renderTimerUI(); }
function updateTimerChip() {
  const txt = T.phase === 'idle' ? 'Timer' : (T.phase === 'study' ? '● ' : '☕ ') + clock(T.left) + (T.paused ? ' ⏸' : '');
  const t = $('timerTxt'); if (t) t.textContent = txt;
  const c = $('tchip'); if (c) { c.hidden = T.phase === 'idle'; c.textContent = txt; }
}
function renderTimerPop() {
  const p = $('timerPop'); if (!p || p.hidden) return;
  if (T.phase === 'idle') {
    const last = LS.get('timerPreset', [25, 5]);
    p.innerHTML = `<b>Study timer</b><small>${T.dnd === false ? 'Notification muting is only available on GNOME.' : 'Notifications are muted (Do Not Disturb) while you study.'}</small>
      ${[[25, 5], [50, 10], [90, 15]].map(([s, b]) => `<button class="preset ${last[0] === s ? 'on' : ''}" data-s="${s}" data-b="${b}">${s} min study · ${b} min break</button>`).join('')}`;
    p.querySelectorAll('.preset').forEach((b) => (b.onclick = () => { timerStart(+b.dataset.s, +b.dataset.b); }));
  } else {
    p.innerHTML = `<b>${T.phase === 'study' ? 'Studying' : 'Break'}</b><div class="big">${clock(T.left)}</div><small>Sessions done: ${T.sessions}</small>
      <div class="prow"><button class="preset" id="tPause">${T.paused ? 'Resume' : 'Pause'}</button><button class="preset" id="tStop">Stop</button></div>`;
    $('tPause').onclick = timerPause; $('tStop').onclick = timerStop;
  }
}
function renderTimerUI() { updateTimerChip(); renderTimerPop(); }
function wireTimer() {
  const b = $('timerBtn'); if (!b) return;
  b.onclick = (e) => { e.stopPropagation(); const p = $('timerPop'); p.hidden = !p.hidden; renderTimerPop(); };
  updateTimerChip();
}
document.addEventListener('click', (e) => { const p = $('timerPop'); if (p && !p.hidden && !e.target.closest('.timerwrap')) p.hidden = true; });
setInterval(() => { const p = $('timerPop'); if (p && !p.hidden && T.phase !== 'idle') renderTimerPop(); }, 1000);

goHome();
