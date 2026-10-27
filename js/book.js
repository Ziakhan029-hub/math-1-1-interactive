/* ===== Book engine: page turning (single page on phones, two-page spread on wide screens),
   navigation, step-by-step solutions, answer checks ===== */
(function () {
  const $ = (id) => document.getElementById(id);
  const book = $('book');
  const stage = book.parentElement;
  const sections = [...book.querySelectorAll(':scope > .page')];
  const P = sections.length;
  const prevBtn = $('prevBtn'), nextBtn = $('nextBtn'), pageInd = $('pageInd'), prog = $('prog');

  // Each page's content lives in its front face; we move these nodes between layouts.
  const homes = sections.map((s) => s.querySelector('.face.front'));
  const content = homes.map((f) => [...f.childNodes]);
  content.forEach((nodes, i) => nodes.forEach((n) => { if (n.querySelector) { const pn = n.querySelector('.pno'); if (pn) pn.textContent = i + 1; } }));

  let mode = null;          // 'single' | 'spread'
  let units = [];           // the elements that flip
  let cur = 0;              // number of turned units
  let busy = false;
  let spreadLayer = null, baseL = null, baseR = null;

  // per-chapter keys (ib.ch1.page), read by the home page to show progress
  const KEY = 'ib.ch' + (document.body.dataset.chapter || '0') + '.';
  function store(k, v) { try { localStorage.setItem(k === 'sound' ? 'ib.sound' : KEY + k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k === 'sound' ? 'ib.sound' : KEY + k); } catch (e) { return null; } }

  /* ---------- layouts ---------- */
  const firstPage = () => (mode === 'single' ? cur : Math.min(P - 1, cur * 2));
  const unitOf = (page) => (mode === 'single' ? page : Math.floor(page / 2));
  const maxCur = () => (mode === 'single' ? P - 1 : units.length - (content[units.length * 2] ? 0 : 1));

  function face(cls, nodes) {
    const f = document.createElement('div');
    f.className = 'face ' + cls;
    if (nodes) nodes.forEach((n) => f.appendChild(n));
    return f;
  }

  function buildSingle() {
    content.forEach((nodes, i) => nodes.forEach((n) => homes[i].appendChild(n)));
    sections.forEach((s) => { s.hidden = false; });
    units = sections;
  }

  function buildSpread() {
    sections.forEach((s) => { s.hidden = true; });
    spreadLayer = document.createElement('div');
    spreadLayer.className = 'spread-layer';
    baseR = document.createElement('div'); baseR.className = 'base base-r';
    baseR.appendChild(face('paper', content[0]));
    baseL = document.createElement('div'); baseL.className = 'base base-l';
    baseL.appendChild(face('paper back-cover', null));
    baseL.firstChild.innerHTML = '<div class="bc-inner"><div class="bc-logo">∴</div><p>نهاية النسخة التجريبية</p></div>';
    spreadLayer.append(baseL, baseR);
    units = [];
    for (let i = 1; i < P; i += 2) {
      const sheet = document.createElement('div');
      sheet.className = 'page sheet';
      sheet.append(face('front', content[i]), face('back', content[i + 1] || null));
      spreadLayer.appendChild(sheet);
      units.push(sheet);
    }
    const spine = document.createElement('div'); spine.className = 'spine';
    spreadLayer.appendChild(spine);
    book.appendChild(spreadLayer);
  }

  function teardown() {
    if (spreadLayer) { spreadLayer.remove(); spreadLayer = baseL = baseR = null; }
  }

  function setMode(m) {
    if (m === mode) return;
    const page = mode ? firstPage() : startPage();
    teardown();
    mode = m;
    book.classList.toggle('spread', m === 'spread');
    book.classList.toggle('single', m === 'single');
    if (m === 'spread') buildSpread(); else buildSingle();
    cur = Math.min(maxCur(), unitOf(page));
    layout();
  }

  function size() {
    const W = stage.clientWidth - 24, H = stage.clientHeight - 16;
    const wantSpread = W >= 840 && W / H >= 1.0;
    if (wantSpread) {
      const ratio = 0.74 * 2;                 // two pages, each ~ A4-ish
      let h = H, w = h * ratio;
      if (w > W) { w = W; h = w / ratio; }
      book.style.width = Math.round(w) + 'px';
      book.style.height = Math.round(h) + 'px';
    } else {
      book.style.width = ''; book.style.height = '';
    }
    setMode(wantSpread ? 'spread' : 'single');
  }

  function edges() {
    if (mode !== 'spread') return;
    const stack = (n, side) => {
      const out = [];
      for (let i = 1; i <= Math.min(n, 8); i++) out.push(`${side * i * 1.2}px ${i * 0.9}px 0 ${i % 2 ? '#efe7d2' : '#fbf7ec'}`);
      out.push(`${side * 6}px 18px 30px rgba(0,0,0,.35)`);
      return out.join(',');
    };
    baseL.style.boxShadow = stack(units.length - cur + 1, -1);
    baseR.style.boxShadow = stack(cur + 1, 1);
  }

  function layout() {
    const n = units.length;
    units.forEach((u, i) => {
      const t = i < cur;
      u.classList.toggle('turned', t);
      u.setAttribute('aria-hidden', String(mode === 'single' ? i !== cur : !(i === cur || i === cur - 1)));
      if (mode === 'single') {
        u.classList.toggle('gone', t || i > cur + 1);
        u.style.zIndex = t ? 0 : n - i;
      } else {
        u.classList.toggle('gone', i < cur - 1 || i > cur + 1);
        u.style.zIndex = t ? 10 + i : 10 + 2 * n - i;
      }
    });
    const fp = firstPage(), lp = mode === 'spread' ? Math.min(P - 1, fp + 1) : fp;
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur >= maxCur();
    pageInd.innerHTML = fp === lp ? `صفحة ${fp + 1} من ${P}` : `صفحة <span class="num">${fp + 1}–${lp + 1}</span> من ${P}`;
    prog.style.width = ((lp + 1) / P * 100) + '%';
    drawerItems.forEach((b, i) => b.classList.toggle('cur', i >= fp && i <= lp));
    edges();
    store('page', fp);
    store('pages', P);
    const seen = Math.max(+load('max') || 0, lp + 1); store('max', seen);
    if (location.hash !== '#p' + fp) history.replaceState(null, '', '#p' + fp);
  }

  /* ---------- page curl engine (Apple Books style) ----------
     A unit's corner C is pulled to point P. The fold line is the perpendicular bisector of C–P.
     The part of the front beyond the fold is clipped away (revealing the page beneath) and the
     back face is drawn there as a flap: mirrored across the fold, so its content reads correctly.
     Coordinates are px inside the unit; in this RTL book the free edge is at x = 0, spine at x = w. */
  const CURL_MS = 1000;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const polyCss = (pts) => 'polygon(' + pts.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',') + ')';
  const NONE = 'polygon(0 0, 0 0, 0 0)';

  function clipHalf(poly, M, v, sign) {
    const side = (p) => sign * ((p[0] - M[0]) * v[0] + (p[1] - M[1]) * v[1]);
    const out = [];
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length], sa = side(a), sb = side(b);
      if (sa >= 0) out.push(a);
      if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    });
    return out;
  }

  function parts(u) {
    if (u._curl) return u._curl;
    const mk = (cls, parent) => { const d = document.createElement('div'); d.className = cls; parent.appendChild(d); return d; };
    const front = u.querySelector(':scope > .front'), back = u.querySelector(':scope > .back');
    const shade = mk('curl-shade', u);
    u._curl = { front, back, shade, under: mk('band under', shade), fb: mk('band fold-f', front), bb: mk('band fold-b', back) };
    return u._curl;
  }

  // place a gradient band whose top edge lies on the line through M, extending along normal n
  function band(el, M, n, len) {
    const th = Math.atan2(-n[0], n[1]) * 180 / Math.PI;
    el.style.width = len + 'px';
    el.style.transform = `translate(${M[0]}px,${M[1]}px) rotate(${th}deg) translate(${-len / 2}px,0)`;
    el.style.display = 'block';
  }

  function render(u, C, P) {
    const k = parts(u), w = u.offsetWidth, h = u.offsetHeight;
    const dx = C[0] - P[0], dy = C[1] - P[1], d = Math.hypot(dx, dy);
    u._P = P; u._C = C;
    if (d < 0.5) { clearCurl(u); return; }
    const v = [dx / d, dy / d], M = [(C[0] + P[0]) / 2, (C[1] + P[1]) / 2];
    const rect = [[0, 0], [w, 0], [w, h], [0, h]];
    const lifted = clipHalf(rect, M, v, 1), rest = clipHalf(rect, M, v, -1);
    k.front.style.clipPath = rest.length > 2 ? polyCss(rest) : NONE;
    // reflection across the fold, composed with a horizontal flip of the back face
    const ux = -v[1], uy = v[0];
    const a = ux * ux - uy * uy, b = 2 * ux * uy, dd = uy * uy - ux * ux;
    const e = M[0] - (a * M[0] + b * M[1]), f = M[1] - (b * M[0] + dd * M[1]);
    k.back.style.display = 'block';
    k.back.style.visibility = 'visible';
    k.back.style.transform = `matrix(${-a},${-b},${b},${dd},${a * w + e},${b * w + f})`;
    k.back.style.clipPath = lifted.length > 2 ? polyCss(lifted.map((p) => [w - p[0], p[1]])) : NONE;
    // shadows
    const len = 4 * Math.hypot(w, h);
    const strength = Math.min(1, d / (w * 0.35)) * Math.min(1, (2 * w - Math.abs(P[0] - C[0])) / (w * 0.5) + 0.15);
    k.shade.style.display = 'block';
    k.shade.style.opacity = strength;
    k.shade.style.clipPath = lifted.length > 2 ? polyCss(lifted) : NONE;
    band(k.under, M, v, len);
    band(k.fb, M, [-v[0], -v[1]], len);
    band(k.bb, [w - M[0], M[1]], [-v[0], v[1]], len);
    k.fb.style.opacity = strength; k.bb.style.opacity = 0.6 + 0.4 * strength;
  }

  function clearCurl(u) {
    const k = parts(u);
    k.front.style.clipPath = '';
    k.back.style.display = k.back.style.visibility = k.back.style.transform = k.back.style.clipPath = '';
    k.shade.style.display = 'none';
    [k.under, k.fb, k.bb].forEach((b) => { b.style.display = 'none'; });
    u._P = null;
  }

  // keep the paper from "tearing": the corner stays within reach of the spine corners
  function constrain(u, C, P) {
    const w = u.offsetWidth, h = u.offsetHeight;
    const S1 = [w, C[1]], S2 = [w, h - C[1]], diag = Math.hypot(w, h);
    const lim = (S, r) => { const dx = P[0] - S[0], dy = P[1] - S[1], dd = Math.hypot(dx, dy); if (dd > r) P = [S[0] + dx * r / dd, S[1] + dy * r / dd]; };
    lim(S1, w); lim(S2, diag);
    return P;
  }

  let anim = null;
  function animateCurl(u, C, from, to, ms, done) {
    cancelAnimationFrame(anim);
    const h = u.offsetHeight, lift = (C[1] > 0 ? -1 : 1) * h * 0.12;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), k = ease(t);
      const P = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(Math.PI * k) * lift * (Math.abs(to[0] - from[0]) / (u.offsetWidth * 2))];
      render(u, C, P);
      if (t < 1) anim = requestAnimationFrame(step); else if (done) done();
    };
    anim = requestAnimationFrame(step);
  }

  function reveal(i) { const u = units[i]; if (u) u.classList.remove('gone'); }

  function lift(u) { u.classList.remove('gone'); u.style.zIndex = 999; }

  function turnForward(u, C, done, from) {
    lift(u);
    const w = u.offsetWidth;
    animateCurl(u, C, from || u._P || C, [2 * w, C[1]], CURL_MS, () => { clearCurl(u); done(); });
  }
  function turnBack(u, C, done, from) {
    lift(u);
    u.classList.remove('turned');
    const w = u.offsetWidth, start = from || [2 * w, C[1]];
    render(u, C, start);
    animateCurl(u, C, start, C, CURL_MS, () => { clearCurl(u); done(); });
  }

  function goToUnit(t) {
    t = Math.max(0, Math.min(maxCur(), t));
    if (busy || t === cur) return;
    busy = true;
    const finish = () => { cur = t; busy = false; layout(); };
    flipSound();
    if (t > cur) {
      const u = units[cur];
      for (let i = cur + 1; i < t; i++) units[i].classList.add('turned');
      reveal(t); reveal(t + 1);
      turnForward(u, u._C || [0, u.offsetHeight], finish);
    } else {
      for (let i = t + 1; i < cur; i++) units[i].classList.remove('turned', 'gone');
      reveal(t - 1);
      const u = units[t];
      turnBack(u, [0, u.offsetHeight], finish);
    }
  }
  const goToPage = (p) => goToUnit(unitOf(p));
  const next = () => goToUnit(cur + 1);
  const prev = () => goToUnit(cur - 1);

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  book.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) next();
    const g = e.target.closest('[data-goto]');
    if (g) goToPage(+g.dataset.goto);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowLeft' || e.key === 'PageDown') next();   // RTL book: left = forward
    if (e.key === 'ArrowRight' || e.key === 'PageUp') prev();
  });

  /* hovering the folded corner peels the page a little */
  book.addEventListener('pointerover', (e) => {
    const c = e.target.closest('.curl');
    if (!c || busy || drag || e.pointerType !== 'mouse') return;
    const u = units[cur]; if (!u || !u.contains(c)) return;
    const h = u.offsetHeight, C = [0, h];
    lift(u); reveal(cur + 1);
    animateCurl(u, C, u._P || C, [70, h - 55], 260);
  });
  book.addEventListener('pointerout', (e) => {
    const c = e.target.closest('.curl');
    if (!c || busy || drag || e.relatedTarget && c.contains(e.relatedTarget)) return;
    const u = units[cur]; if (!u || !u._P) return;
    animateCurl(u, u._C, u._P, u._C, 260, () => { clearCurl(u); layout(); });
  });

  /* ---------- drag: the page curls under your finger ---------- */
  const NO_SWIPE = 'input, button:not(.curl), select, textarea, a, svg, summary, .no-swipe, .tbl-wrap';
  let drag = null;
  book.addEventListener('pointerdown', (e) => {
    if (busy || e.button > 0 || e.target.closest(NO_SWIPE)) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, active: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      const dir = dx > 0 ? 1 : -1;          // RTL: dragging right turns forward
      if ((dir === 1 && cur >= maxCur()) || (dir === -1 && cur <= 0)) { drag = null; return; }
      const u = dir === 1 ? units[cur] : units[cur - 1];
      const r = u.getBoundingClientRect(), h = u.offsetHeight, w = u.offsetWidth;
      const C = [0, (drag.y - r.top) < h * 0.4 ? 0 : h];     // grab top or bottom corner
      Object.assign(drag, { active: true, dir, u, C, w, start: dir === 1 ? C : [2 * w, C[1]] });
      lift(u);
      if (dir === 1) { reveal(cur + 1); reveal(cur + 2); } else { reveal(cur - 2); u.classList.remove('turned'); }
      book.classList.add('grabbing');
      const sel = window.getSelection && window.getSelection(); if (sel) sel.removeAllRanges();
      cancelAnimationFrame(anim);
    }
    // the fold follows the finger: the corner moves twice as far as the finger
    let P = [drag.start[0] + dx * 2, drag.start[1] + dy * 1.1];
    P = constrain(drag.u, drag.C, P);
    drag.vx = e.clientX - (drag.lx || e.clientX); drag.lx = e.clientX;
    render(drag.u, drag.C, P);
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.active) return;
    book.classList.remove('grabbing');
    const u = d.u, P = u._P || d.start;
    busy = true;
    const fling = (d.vx || 0) * d.dir > 6;
    if (d.dir === 1) {
      if (P[0] > d.w * 0.6 || fling) { flipSound(); turnForward(u, d.C, () => { cur += 1; busy = false; layout(); }, P); }
      else animateCurl(u, d.C, P, d.C, 450, () => { clearCurl(u); busy = false; layout(); });
    } else if (P[0] < d.w * 1.4 || fling) {
      flipSound(); animateCurl(u, d.C, P, d.C, CURL_MS * 0.8, () => { clearCurl(u); cur -= 1; busy = false; layout(); });
    } else {
      animateCurl(u, d.C, P, [2 * d.w, d.C[1]], 450, () => { clearCurl(u); busy = false; layout(); });
    }
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  /* ---------- jump to a page: tap the page indicator ---------- */
  const jump = document.createElement('div');
  jump.className = 'jump'; jump.hidden = true;
  jump.innerHTML = `<div class="jump-t"></div><div class="ctrl"><input type="range" min="1" max="${P}" step="1"><output></output></div>
    <div class="ctrl" style="justify-content:center"><button class="btn" data-j="go">اذهب</button><button class="btn ghost" data-j="x">إلغاء</button></div>`;
  document.body.appendChild(jump);
  const jr = jump.querySelector('input'), jo = jump.querySelector('output'), jt = jump.querySelector('.jump-t');
  const jsync = () => { jo.textContent = jr.value; jt.innerHTML = `صفحة ${jr.value}: <b>${(sections[jr.value - 1].dataset.title || '').replace(/^(\d-\d)/, '<span class="num">$1</span>')}</b>`; };
  jr.addEventListener('input', jsync);
  pageInd.setAttribute('role', 'button'); pageInd.tabIndex = 0; pageInd.title = 'اذهب إلى صفحة';
  const openJump = () => { jr.value = firstPage() + 1; jsync(); jump.hidden = !jump.hidden; };
  pageInd.addEventListener('click', openJump);
  pageInd.addEventListener('keydown', (e) => { if (e.key === 'Enter') openJump(); });
  jump.querySelector('[data-j=go]').addEventListener('click', () => { jump.hidden = true; goToPage(jr.value - 1); });
  jump.querySelector('[data-j=x]').addEventListener('click', () => { jump.hidden = true; });

  /* ---------- flip sound: a soft paper swish ---------- */
  const soundBtn = $('soundBtn');
  let soundOn = load('sound') !== '0', actx = null;
  function syncSound() { soundBtn.setAttribute('aria-pressed', soundOn); soundBtn.textContent = soundOn ? '🔊' : '🔇'; }
  soundBtn.addEventListener('click', () => { soundOn = !soundOn; store('sound', soundOn ? '1' : '0'); syncSound(); });
  syncSound();
  function flipSound() {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const dur = 0.7, len = Math.floor(actx.sampleRate * dur);
      const buf = actx.createBuffer(1, len, actx.sampleRate), ch = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const env = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 2 * (1 - t);
        last = last * 0.6 + (Math.random() * 2 - 1) * 0.4;     // softened noise
        ch[i] = last * env;
      }
      const src = actx.createBufferSource(); src.buffer = buf;
      const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.5;
      f.frequency.setValueAtTime(900, actx.currentTime);
      f.frequency.linearRampToValueAtTime(2600, actx.currentTime + dur * 0.6);
      const g = actx.createGain(); g.gain.value = 0.22;
      src.connect(f).connect(g).connect(actx.destination);
      src.start();
    } catch (e) {}
  }

  /* ---------- contents drawer ---------- */
  const drawer = $('drawer'), drawerBg = $('drawerBg'), list = $('drawerList');
  const drawerItems = sections.map((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.innerHTML = `<span class="pn">${i + 1}</span><span>${(p.dataset.title || '').replace(/^(\d-\d)/, '<span class="num">$1</span>')}</span>`;
    b.addEventListener('click', () => { closeDrawer(); setTimeout(() => goToPage(i), 300); });
    li.appendChild(b); list.appendChild(li);
    return b;
  });
  function closeDrawer() { drawer.classList.remove('open'); drawerBg.classList.remove('show'); }
  $('tocBtn').addEventListener('click', () => { drawer.classList.add('open'); drawerBg.classList.add('show'); });
  drawerBg.addEventListener('click', closeDrawer);

  /* ---------- compact reading: secondary text collapses behind a tap ----------
     Authors write normal cards; this keeps every chapter equally light. Add data-open to opt out. */
  function toDetails(el, title, keepCls) {
    const d = document.createElement('details');
    d.className = (keepCls ? el.className + ' ' : '') + 'more';
    const sm = document.createElement('summary');
    sm.innerHTML = title;
    el.replaceWith(d);
    d.appendChild(sm);
    return d;
  }
  document.querySelectorAll('.card.why:not([data-open]), .card.tip:not([data-open])').forEach((el) => {
    const h = el.querySelector(':scope > h3, :scope > h4');
    const icon = el.classList.contains('why') ? '🤔' : el.classList.contains('warn') ? '⚠️' : '📌';
    const d = toDetails(el, `${icon} ${h ? h.innerHTML : 'اقرأ المزيد'}`, true);
    if (h) h.remove();
    const body = document.createElement('div'); body.className = 'more-body';
    while (el.firstChild) body.appendChild(el.firstChild);
    d.appendChild(body);
  });
  document.querySelectorAll('.side-grid:not([data-open])').forEach((el) => {
    const d = toDetails(el, '🎯 أهداف الدرس', false);
    d.classList.add('goals');
    d.appendChild(el);
  });
  document.querySelectorAll('.card.def:not([data-open])').forEach((el) => {
    const kids = [...el.children].filter((c) => !/^H[34]$/.test(c.tagName));
    if (kids.length < 4) return;   // short concepts stay fully visible; long ones show their first two points
    const d = document.createElement('details'); d.className = 'more inner';
    d.innerHTML = '<summary>اقرأ المزيد</summary>';
    kids.slice(2).forEach((k) => d.appendChild(k));
    el.appendChild(d);
  });

  /* ---------- step-by-step solutions ---------- */
  document.querySelectorAll('[data-sol]').forEach((sol) => {
    const steps = sol.querySelector('.steps');
    const items = [...steps.children];
    sol.classList.add('sol');
    sol.innerHTML = '';
    const toggle = document.createElement('button');
    toggle.className = 'sol-toggle';
    toggle.innerHTML = '<span>💡 عرض الحل خطوة بخطوة</span><span class="chev">▾</span>';
    const wrap = document.createElement('div'); wrap.className = 'sol-wrap';
    const inner = document.createElement('div');
    const body = document.createElement('div'); body.className = 'sol-body';
    const ctrl = document.createElement('div'); ctrl.className = 'sol-ctrl';
    const nextStep = document.createElement('button'); nextStep.className = 'btn sm'; nextStep.textContent = 'الخطوة التالية ↓';
    const all = document.createElement('button'); all.className = 'btn sm ghost'; all.textContent = 'عرض كل الخطوات';
    ctrl.append(nextStep, all);
    body.append(steps, ctrl); inner.append(body); wrap.append(inner);
    sol.append(toggle, wrap);

    let shown = 1;
    function render() {
      items.forEach((li, i) => li.classList.toggle('hidden', i >= shown));
      const done = shown >= items.length;
      nextStep.hidden = done; all.hidden = done;
    }
    nextStep.addEventListener('click', () => {
      shown++; render();
      const li = items[shown - 1];
      li.classList.remove('reveal'); void li.offsetWidth; li.classList.add('reveal');
    });
    all.addEventListener('click', () => { shown = items.length; render(); });
    toggle.addEventListener('click', () => {
      const open = sol.classList.toggle('open');
      toggle.firstChild.textContent = open ? '💡 إخفاء الحل' : '💡 عرض الحل خطوة بخطوة';
      if (!open) { shown = 1; setTimeout(render, 350); }
    });
    render();
  });

  /* ---------- "try it" answer checks ---------- */
  const normalize = (s) => s.trim()
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[٫,]/g, '.').replace(/[−–]/g, '-').replace(/\s+/g, '')
    .replace(/[ًٌٍَُِّْ]/g, '');
  document.querySelectorAll('.ans').forEach((box) => {
    const input = box.querySelector('input'), btn = box.querySelector('button'), fb = box.querySelector('.fb');
    const answers = box.dataset.answer.split('|').map(normalize);
    function check() {
      const v = normalize(input.value);
      if (!v) return;
      const ok = answers.some((a) => a === v || (!isNaN(a) && !isNaN(v) && Math.abs(+a - +v) < 1e-9));
      box.classList.remove('ok', 'no'); void box.offsetWidth;
      box.classList.add(ok ? 'ok' : 'no');
      fb.className = 'fb ' + (ok ? 'ok' : 'no');
      fb.textContent = ok ? '✓ إجابة صحيحة، أحسنت!' : '✗ حاول مرة أخرى، أو افتح الحل';
    }
    btn.addEventListener('click', check);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
  });

  /* ---------- start ---------- */
  function startPage() {
    const h = /^#p(\d+)$/.exec(location.hash);
    return Math.min(P - 1, +(h ? h[1] : load('page') || 0) || 0);
  }
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!busy) size(); }, 150); });
  size();
})();
