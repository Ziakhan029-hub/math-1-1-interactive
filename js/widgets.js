/* ===== Interactive widgets. Each element with data-widget="name" is set up by Widgets[name](el). ===== */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = { teal: '#0f766e', blue: '#1d4ed8', red: '#dc2626', orange: '#f59e0b', green: '#16a34a', purple: '#7c3aed', pink: '#db2777', ink: '#1e293b', muted: '#94a3b8', grid: '#e2e8f0' };

  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, str, attrs) {
    const t = s('text', Object.assign({ x, y, 'font-size': 14, 'text-anchor': 'middle', fill: C.ink, 'font-family': 'Tajawal, sans-serif' }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }
  function clear(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }
  const tex = (root) => { if (window.renderMath) window.renderMath(root); };
  const fmt = (n, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toString();

  /* Draggable point helper: returns svg coordinates on move */
  function draggable(svg, el, onMove) {
    el.classList.add('handle');
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      const move = (ev) => {
        const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        onMove(p.x, p.y);
      };
      const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }
  function handle(svg, color) {
    const g = s('g', {}, svg);
    s('circle', { r: 14, fill: color, opacity: .35, class: 'handle-ring' }, g);
    s('circle', { r: 9, fill: color, stroke: '#fff', 'stroke-width': 3 }, g);
    s('circle', { r: 22, fill: 'transparent' }, g); // larger touch target
    return g;
  }
  const place = (g, x, y) => g.setAttribute('transform', `translate(${x},${y})`);

  function range(el, onInput) {
    const r = el.querySelector('input[type=range]'), out = el.querySelector('output');
    const upd = () => { if (out) out.textContent = r.value; onInput(+r.value); };
    r.addEventListener('input', upd);
    upd();
    return r;
  }

  const W = {};

  /* ---------- a) bus times sequence ---------- */
  W.timeSeq = function (el) {
    const box = el.querySelector('.seq');
    const start = +el.dataset.start, step = +el.dataset.step, base = +el.dataset.count;
    let count = base;
    const clock = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${h > 12 ? h - 12 : h}:${String(mm).padStart(2, '0')}`; };
    const period = (m) => (m < 720 ? 'ص' : 'م');
    function render(animateLast) {
      box.innerHTML = '';
      for (let i = 0; i < count; i++) {
        if (i) { const d = document.createElement('span'); d.className = 'd'; d.textContent = `+${step}د →`; box.appendChild(d); }
        const m = start + i * step;
        const t = document.createElement('span');
        t.className = 't' + (i >= base ? ' new' : '');
        t.textContent = `${clock(m)} ${period(m)}`;
        box.appendChild(t);
      }
    }
    el.querySelector('[data-act=add]').addEventListener('click', () => { if (count < 9) { count++; render(); } });
    el.querySelector('[data-act=reset]').addEventListener('click', () => { count = base; render(); });
    render();
  };

  /* ---------- b) nested squares segment pattern ---------- */
  W.nestedSquares = function (el) {
    const svg = el.querySelector('svg'), seq = el.querySelector('.seq'), ro = el.querySelector('.readout');
    const count = (n) => n * n + 3 * n;
    range(el, (n) => {
      clear(svg);
      const u = Math.min(36, 170 / n), ox = 120 - (n * u) / 2, oy = 100 - (n * u) / 2;
      // unit segments of all nested squares, de-duplicated
      const seen = new Map();
      for (let k = 1; k <= n; k++) {
        for (let i = 0; i < k; i++) {
          [[i, 0, i + 1, 0], [i, k, i + 1, k], [0, i, 0, i + 1], [k, i, k, i + 1]].forEach((sg) => {
            const key = sg.join(',');
            if (!seen.has(key)) seen.set(key, k);
          });
        }
      }
      seen.forEach((k, key) => {
        const [x1, y1, x2, y2] = key.split(',').map(Number);
        const last = k === n && n > 1;
        s('line', { x1: ox + x1 * u, y1: oy + y1 * u, x2: ox + x2 * u, y2: oy + y2 * u, stroke: last ? C.orange : C.blue, 'stroke-width': last ? 3.5 : 2.5, 'stroke-linecap': 'round' }, svg);
      });
      seen.forEach((k, key) => {
        const [x1, y1, x2, y2] = key.split(',').map(Number);
        s('circle', { cx: ox + x1 * u, cy: oy + y1 * u, r: 2, fill: C.ink }, svg);
        s('circle', { cx: ox + x2 * u, cy: oy + y2 * u, r: 2, fill: C.ink }, svg);
      });
      // sequence chips
      seq.innerHTML = '';
      for (let i = 1; i <= Math.max(n, 5); i++) {
        if (i > 1) { const d = document.createElement('span'); d.className = 'd'; d.textContent = '+' + (count(i) - count(i - 1)); seq.appendChild(d); }
        const t = document.createElement('span');
        t.className = 't' + (i > 5 && i <= n ? ' new' : '');
        t.textContent = i <= n || i <= 5 ? count(i) : '?';
        t.style.opacity = i <= n ? 1 : .45;
        seq.appendChild(t);
      }
      ro.innerHTML = `<span class="pill big">الشكل ${n}: <b>${count(n)}</b> قطعة مستقيمة</span>` +
        (n > 1 ? `<span class="pill" style="color:${C.orange}">القطع الجديدة (برتقالي): ${count(n) - count(n - 1)}</span>` : '');
    });
  };

  /* ---------- 1C) Sierpinski triangles ---------- */
  W.sierpinski = function (el) {
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    function tri(a, b, c, lvl) {
      if (lvl === 0) { s('polygon', { points: [a, b, c].map((p) => p.join(',')).join(' '), fill: '#7dd3fc', stroke: C.blue, 'stroke-width': .8 }, svg); return; }
      const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const ab = m(a, b), bc = m(b, c), ca = m(c, a);
      tri(a, ab, ca, lvl - 1); tri(ab, b, bc, lvl - 1); tri(ca, bc, c, lvl - 1);
    }
    range(el, (k) => {
      clear(svg);
      s('polygon', { points: '130,10 250,218 10,218', fill: '#fff', stroke: C.blue, 'stroke-width': 1.5 }, svg);
      tri([130, 10], [250, 218], [10, 218], k - 1);
      ro.innerHTML = `<span class="pill big">عدد المثلثات المظللة: <b>${3 ** (k - 1)}</b></span><span class="pill">${Array.from({ length: k }, (_, i) => 3 ** i).join(' ← ')}</span>`;
    });
  };

  /* ---------- 2a) parity of a sum, shown with paired dots ---------- */
  W.parity = function (el) {
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const ra = el.querySelector('[data-k=a]'), rb = el.querySelector('[data-k=b]');
    function draw() {
      const a = +ra.value, b = +rb.value;
      ra.nextElementSibling.textContent = a; rb.nextElementSibling.textContent = b;
      clear(svg);
      const cols = [];
      for (let i = 0; i < Math.floor(a / 2); i++) cols.push(['a', 'a']);
      for (let i = 0; i < Math.floor(b / 2); i++) cols.push(['b', 'b']);
      const singles = [];
      if (a % 2) singles.push('a');
      if (b % 2) singles.push('b');
      if (singles.length === 2) cols.push(['a', 'b', 'join']);
      else if (singles.length === 1) cols.push([singles[0], null, 'lone']);
      const gap = Math.min(20, 300 / cols.length), x0 = 160 + ((cols.length - 1) * gap) / 2;
      cols.forEach((c, i) => {
        const x = x0 - i * gap;   // fill right-to-left
        if (c[2] === 'join') s('rect', { x: x - 9, y: 12, width: 18, height: 52, rx: 9, fill: '#dcfce7', stroke: C.green, 'stroke-width': 2 }, svg);
        if (c[2] === 'lone') s('rect', { x: x - 9, y: 12, width: 18, height: 52, rx: 9, fill: 'none', stroke: C.red, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, svg);
        [0, 1].forEach((r) => { if (c[r]) s('circle', { cx: x, cy: 26 + r * 24, r: 8, fill: c[r] === 'a' ? C.blue : C.orange }, svg); });
      });
      const sum = a + b, even = sum % 2 === 0;
      const kind = (n) => (n % 2 ? 'فردي' : 'زوجي');
      txt(svg, 160, 84, `${a} + ${b} = ${sum}`, { 'font-size': 14, 'font-weight': 700, direction: 'ltr' });
      ro.innerHTML = `<span class="pill">${kind(a)} + ${kind(b)}</span><span class="pill big ${even ? 'ok' : 'no'}">المجموع ${sum} ${kind(sum)}</span>` +
        (a % 2 && b % 2 ? '<span class="pill ok">النقطتان الوحيدتان كوّنتا زوجًا جديدًا!</span>' : '');
    }
    ra.addEventListener('input', draw); rb.addEventListener('input', draw);
    draw();
  };

  /* ---------- 2b) rectangle diagonals ---------- */
  W.rectDiag = function (el) {
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    let mode = 'rect';
    let P = { A: [40, 30], B: [250, 30], C: [250, 170], D: [40, 170] };
    const U = 20; // px per unit
    const len = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) / U;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // static layers
    const poly = s('polygon', { fill: '#ecfeff', stroke: C.teal, 'stroke-width': 3, 'stroke-linejoin': 'round' }, svg);
    const d1 = s('line', { stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, svg);
    const d2 = s('line', { stroke: C.purple, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, svg);
    const labels = {}, handles = {};
    ['A', 'B', 'C', 'D'].forEach((k) => { labels[k] = txt(svg, 0, 0, k, { 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700, 'font-size': 16 }); });
    ['A', 'B', 'C', 'D'].forEach((k) => {
      handles[k] = handle(svg, k === 'C' ? C.orange : C.purple);
      draggable(svg, handles[k], (x, y) => {
        x = clamp(x, 15, 305); y = clamp(y, 15, 205);
        if (mode === 'rect') {
          // keep a rectangle anchored at A
          if (k === 'C') { P.C = [Math.max(x, P.A[0] + 40), Math.max(y, P.A[1] + 40)]; P.B = [P.C[0], P.A[1]]; P.D = [P.A[0], P.C[1]]; }
        } else { P[k] = [x, y]; }
        draw();
      });
    });
    function draw() {
      poly.setAttribute('points', ['A', 'B', 'C', 'D'].map((k) => P[k].join(',')).join(' '));
      [[d1, 'A', 'C'], [d2, 'B', 'D']].forEach(([l, a, b]) => { l.setAttribute('x1', P[a][0]); l.setAttribute('y1', P[a][1]); l.setAttribute('x2', P[b][0]); l.setAttribute('y2', P[b][1]); });
      const cx = (P.A[0] + P.C[0]) / 2, cy = (P.A[1] + P.C[1]) / 2;
      ['A', 'B', 'C', 'D'].forEach((k) => {
        const dx = P[k][0] - cx, dy = P[k][1] - cy, m = Math.hypot(dx, dy) || 1;
        labels[k].setAttribute('x', P[k][0] + (dx / m) * 18); labels[k].setAttribute('y', P[k][1] + (dy / m) * 18 + 5);
        place(handles[k], P[k][0], P[k][1]);
        handles[k].style.display = mode === 'rect' && k !== 'C' ? 'none' : '';
      });
      const ac = len(P.A, P.C), bd = len(P.B, P.D), eq = Math.abs(ac - bd) < 0.05;
      ro.innerHTML = `<span class="pill" style="color:${C.pink}"><span class="m">AC = ${fmt(ac)}</span></span><span class="pill" style="color:${C.purple}"><span class="m">BD = ${fmt(bd)}</span></span>` +
        `<span class="pill ${eq ? 'ok' : 'no'}">${eq ? '✓ القطران متطابقان' : '✗ القطران غير متطابقين'}</span>`;
      tex(ro);
    }
    el.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      el.querySelectorAll('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      if (mode === 'rect') P = { A: [40, 30], B: [250, 30], C: [250, 170], D: [40, 170] };
      else P = { A: [40, 40], B: [260, 25], C: [230, 180], D: [70, 160] };
      el.querySelector('.hint').innerHTML = mode === 'rect' ? 'اسحب الرأس <b>C</b> لتغيير المستطيل وراقب طولي القطرين' : 'اسحب أي رأس — هل يبقى القطران متساويين؟';
      draw();
    }));
    draw();
  };

  /* ---------- generic scatter chart ---------- */
  function chart(svg, o) {
    // o: {x0,x1,y0,y1,xs:[ticks],ys:[ticks],xl,yl}
    const L = 50, R = 330, T = 14, B = 196;
    const X = (v) => L + ((v - o.x0) / (o.x1 - o.x0)) * (R - L);
    const Y = (v) => B - ((v - o.y0) / (o.y1 - o.y0)) * (B - T);
    o.ys.forEach((v) => { s('line', { x1: L, x2: R, y1: Y(v), y2: Y(v), stroke: C.grid }, svg); txt(svg, L - 6, Y(v) + 4, v, { 'text-anchor': 'end', 'font-size': 10, fill: '#64748b' }); });
    o.xs.forEach((v) => { txt(svg, X(v), B + 14, v, { 'font-size': 10, fill: '#64748b' }); });
    s('line', { x1: L, x2: R, y1: B, y2: B, stroke: C.ink, 'stroke-width': 1.5 }, svg);
    s('line', { x1: L, x2: L, y1: T, y2: B, stroke: C.ink, 'stroke-width': 1.5 }, svg);
    txt(svg, (L + R) / 2, B + 32, o.xl, { 'font-size': 12, 'font-weight': 700 });
    txt(svg, 12, (T + B) / 2, o.yl, { 'font-size': 12, 'font-weight': 700, transform: `rotate(-90 12 ${(T + B) / 2})` });
    return { X, Y, L, R, T, B };
  }

  /* ---------- Example 3: salon customers ---------- */
  W.salon = function (el) {
    const svg = el.querySelector('svg'), chips = el.querySelector('.chips');
    svg.setAttribute('viewBox', '0 0 340 236');
    const series = [
      { n: 'الخميس', c: C.red, d: [225, 255, 321, 406, 540, 450] },
      { n: 'الجمعة', c: C.orange, d: [552, 635, 642, 692, 685, 705] },
      { n: 'السبت', c: C.green, d: [603, 658, 652, 712, 746, 832] },
      { n: 'المجموع', c: C.blue, d: [1380, 1548, 1615, 1810, 1971, 1987] },
    ];
    const on = series.map(() => true);
    series.forEach((sr, i) => {
      const b = document.createElement('button');
      b.className = 'chip'; b.style.color = sr.c; b.setAttribute('aria-pressed', 'true');
      b.innerHTML = `<span>● ${sr.n}</span>`;
      b.addEventListener('click', () => { on[i] = !on[i]; b.setAttribute('aria-pressed', on[i]); draw(); });
      chips.appendChild(b);
    });
    function draw() {
      clear(svg);
      const g = chart(svg, { x0: 0.5, x1: 6.5, y0: 0, y1: 2100, xs: [1, 2, 3, 4, 5, 6], ys: [0, 400, 800, 1200, 1600, 2000], xl: 'الشهر', yl: 'عدد الزبائن' });
      series.forEach((sr, i) => {
        if (!on[i]) return;
        sr.d.forEach((v, j) => {
          const c = s('circle', { cx: g.X(j + 1), cy: g.Y(v), r: 0, fill: sr.c, stroke: '#fff', 'stroke-width': 1.5 }, svg);
          const t = s('title', {}, c); t.textContent = `${sr.n} — الشهر ${j + 1}: ${v}`;
          setTimeout(() => c.setAttribute('r', 6), 40 * j);
          c.style.transition = 'r .3s';
        });
      });
    }
    draw();
  };

  /* ---------- Check 3: price prediction ---------- */
  W.price = function (el) {
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    svg.setAttribute('viewBox', '0 0 340 236');
    const data = [[1414, 20], [1419, 22], [1424, 29], [1429, 32], [1434, 37], [1439, 41]];
    let guess = 30, showTrend = false, checked = false;
    let g;
    const h = handle(svg, C.orange);
    function draw() {
      [...svg.childNodes].forEach((n) => { if (n !== h) svg.removeChild(n); });
      const tmp = s('g', {}, null);
      svg.insertBefore(tmp, h);
      g = chart(tmp, { x0: 1410, x1: 1448, y0: 0, y1: 60, xs: [1414, 1424, 1434, 1444], ys: [0, 10, 20, 30, 40, 50, 60], xl: 'السنة (هـ)', yl: 'السعر (ريال)' });
      if (showTrend) {
        // least squares line
        const n = data.length, sx = data.reduce((a, d) => a + d[0], 0), sy = data.reduce((a, d) => a + d[1], 0);
        const sxx = data.reduce((a, d) => a + d[0] * d[0], 0), sxy = data.reduce((a, d) => a + d[0] * d[1], 0);
        const m = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - m * sx) / n;
        s('line', { x1: g.X(1412), y1: g.Y(m * 1412 + b), x2: g.X(1446), y2: g.Y(m * 1446 + b), stroke: C.teal, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, tmp);
      }
      data.forEach(([x, y]) => s('circle', { cx: g.X(x), cy: g.Y(y), r: 6, fill: C.blue, stroke: '#fff', 'stroke-width': 1.5 }, tmp));
      s('line', { x1: g.X(1444), x2: g.X(1444), y1: g.T, y2: g.B, stroke: C.orange, 'stroke-dasharray': '3 3' }, tmp);
      place(h, g.X(1444), g.Y(guess));
      const ok = guess >= 44 && guess <= 47;
      ro.innerHTML = `<span class="pill big">تخمينك لعام 1444هـ: <b>${guess}</b> ريالًا</span>` +
        (checked ? `<span class="pill ${ok ? 'ok' : 'no'}">${ok ? '✓ تخمين معقول! يتفق مع النمط' : guess < 44 ? '✗ منخفض — الأسعار تزداد حوالي 4 ريالات كل 5 سنوات' : '✗ مرتفع — الزيادة حوالي 4 ريالات كل 5 سنوات'}</span>` : '');
    }
    draggable(svg, h, (x, y) => { guess = Math.round(Math.max(0, Math.min(60, 60 * (g.B - y) / (g.B - g.T)))); checked = false; draw(); });
    el.querySelector('[data-act=check]').addEventListener('click', () => { checked = true; draw(); });
    el.querySelector('[data-act=trend]').addEventListener('click', (e) => { showTrend = !showTrend; e.target.textContent = showTrend ? 'أخفِ خط النمط' : 'أظهر خط النمط'; draw(); });
    draw();
  };

  /* ---------- Example 4a: n^2 > n ? ---------- */
  W.squareVsN = function (el) {
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const L = 30, R = 310, T = 10, B = 180;
    const x0 = -2, x1 = 3, y0 = -2, y1 = 9;
    const X = (v) => L + ((v - x0) / (x1 - x0)) * (R - L), Y = (v) => B - ((v - y0) / (y1 - y0)) * (B - T);
    range(el, (n) => {
      clear(svg);
      // counterexample zone 0..1
      s('rect', { x: X(0), y: T, width: X(1) - X(0), height: B - T, fill: '#fee2e2' }, svg);
      txt(svg, (X(0) + X(1)) / 2, T + 14, 'هنا!', { 'font-size': 11, fill: C.red, 'font-weight': 700 });
      s('line', { x1: L, x2: R, y1: Y(0), y2: Y(0), stroke: C.ink }, svg);
      s('line', { x1: X(0), x2: X(0), y1: T, y2: B, stroke: C.ink }, svg);
      [-2, -1, 1, 2, 3].forEach((v) => txt(svg, X(v), Y(0) + 14, v, { 'font-size': 10, fill: '#64748b' }));
      let d1 = '', d2 = '';
      for (let v = x0; v <= x1 + 1e-9; v += 0.05) {
        d1 += (d1 ? 'L' : 'M') + X(v) + ',' + Y(Math.min(v * v, y1 + 1));
        d2 += (d2 ? 'L' : 'M') + X(v) + ',' + Y(Math.max(v, y0));
      }
      s('path', { d: d1, fill: 'none', stroke: C.blue, 'stroke-width': 3 }, svg);
      s('path', { d: d2, fill: 'none', stroke: C.orange, 'stroke-width': 3 }, svg);
      txt(svg, X(2.75), Y(7.6) - 4, 'n²', { fill: C.blue, 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700 });
      txt(svg, X(2.8), Y(2.8) + 16, 'n', { fill: C.orange, 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700 });
      s('line', { x1: X(n), x2: X(n), y1: T, y2: B, stroke: C.purple, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
      s('circle', { cx: X(n), cy: Y(n * n), r: 6, fill: C.blue, stroke: '#fff', 'stroke-width': 2 }, svg);
      s('circle', { cx: X(n), cy: Y(n), r: 6, fill: C.orange, stroke: '#fff', 'stroke-width': 2 }, svg);
      const sq = n * n, ok = sq > n;
      ro.innerHTML = `<span class="pill"><span class="m">n = ${n}</span></span><span class="pill"><span class="m">n² = ${fmt(sq, 4)}</span></span>` +
        `<span class="pill big ${ok ? 'ok' : 'no'}"><span class="m">${fmt(sq, 4)} ${ok ? '>' : sq === n ? '=' : '<'} ${n}</span></span>` +
        `<span class="pill ${ok ? 'ok' : 'no'}">${ok ? 'التخمين صحيح هنا — استمر في البحث' : '🎯 وجدت مثالًا مضادًا! التخمين خاطئ'}</span>`;
      tex(ro);
    });
  };

  /* ---------- Example 4b: JK = KL but K not midpoint ---------- */
  W.midpoint = function (el) {
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const J = [40, 50], Lp = [280, 50], mx = 160;
    let ky = 130;
    const layer = s('g', {}, svg);
    const h = handle(svg, C.orange);
    const seg = (a, b, col) => s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }, layer);
    function tick(a, b, col) {
      const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
      s('line', { x1: cx - Math.cos(ang) * 7, y1: cy - Math.sin(ang) * 7, x2: cx + Math.cos(ang) * 7, y2: cy + Math.sin(ang) * 7, stroke: col, 'stroke-width': 2.5 }, layer);
    }
    const italic = { 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700, 'font-size': 17 };
    function draw() {
      clear(layer);
      const K = [mx, ky], onLine = ky < 52;
      s('line', { x1: mx, y1: 20, x2: mx, y2: 185, stroke: C.muted, 'stroke-dasharray': '2 4' }, layer);
      seg(J, Lp, onLine ? C.green : C.ink);
      if (!onLine) { seg(J, K, C.blue); seg(K, Lp, C.blue); }
      tick(J, K, C.pink); tick(K, Lp, C.pink);
      [['J', J, -14], ['L', Lp, 14]].forEach(([n, p, dx]) => {
        s('circle', { cx: p[0], cy: p[1], r: 4, fill: C.ink }, layer);
        txt(layer, p[0] + dx, p[1] + 5, n, italic);
      });
      txt(layer, mx + 24, ky + 6, 'K', Object.assign({}, italic, { fill: '#b45309' }));
      place(h, mx, ky);
      const jk = Math.hypot(mx - J[0], ky - J[1]) / 20;
      ro.innerHTML = `<span class="pill"><span class="m">JK = ${fmt(jk)}</span></span><span class="pill"><span class="m">KL = ${fmt(jk)}</span></span>` +
        `<span class="pill big ${onLine ? 'ok' : 'no'}">${onLine ? '✓ هنا فقط <span class="m">K</span> منتصف <span class="m">JL</span> (النقاط على استقامة واحدة)' : '✗ <span class="m">K</span> ليست منتصف <span class="m">JL</span> رغم أن <span class="m">JK = KL</span> — مثال مضاد!'}</span>`;
      tex(ro);
    }
    draggable(svg, h, (x, y) => { ky = Math.max(50, Math.min(175, y)); if (ky < 56) ky = 50; draw(); });
    draw();
  };

  /* ---------- Exercise 10: AP vs PB ---------- */
  W.quarter = function (el) {
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    range(el, (ab) => {
      clear(svg);
      const L = 20, R = 300, u = (R - L) / 16, A = L + (16 - ab) * u / 2, Bx = A + ab * u;
      const M = A + (ab / 2) * u, P = A + (ab / 4) * u;
      s('line', { x1: A, x2: Bx, y1: 40, y2: 40, stroke: C.ink, 'stroke-width': 3 }, svg);
      s('line', { x1: A, x2: P, y1: 40, y2: 40, stroke: C.orange, 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
      s('line', { x1: P, x2: Bx, y1: 40, y2: 40, stroke: C.blue, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .55 }, svg);
      [['A', A], ['P', P], ['M', M], ['B', Bx]].forEach(([n, x]) => {
        s('circle', { cx: x, cy: 40, r: 5, fill: '#fff', stroke: C.ink, 'stroke-width': 2 }, svg);
        txt(svg, x, 24, n, { 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700 });
      });
      txt(svg, (A + P) / 2, 66, ab / 4, { fill: '#b45309', 'font-weight': 700, 'font-size': 13 });
      txt(svg, (P + Bx) / 2, 66, (3 * ab) / 4, { fill: C.blue, 'font-weight': 700, 'font-size': 13 });
      ro.innerHTML = `<span class="pill" style="color:#b45309"><span class="m">AP = ${ab / 4}</span></span><span class="pill" style="color:${C.blue}"><span class="m">PB = ${(3 * ab) / 4}</span></span><span class="pill big ok"><span class="m">PB = 3 × AP</span></span>`;
      tex(ro);
    });
  };

  /* ---------- Logic lab: negation, AND (series), OR (parallel) ---------- */
  const STATEMENTS = [
    ['المستطيل شكل رباعي', true],
    ['المثلث له أربعة أضلاع', false],
    ['أبها مدينة سعودية', true],
    ['عدد أيام الأسبوع 8 أيام', false],
    ['العدد 7 عدد فردي', true],
    ['يناير من أشهر فصل الربيع', false],
    ['المستطيل مضلع محدب', true],
  ];
  W.logicLab = function (el) {
    const sp = el.querySelector('[data-k=p]'), sq = el.querySelector('[data-k=q]');
    [sp, sq].forEach((sel, j) => {
      STATEMENTS.forEach(([t, v], i) => { const o = document.createElement('option'); o.value = i; o.textContent = `${t}  (${v ? 'T' : 'F'})`; sel.appendChild(o); });
      sel.value = j === 0 ? 0 : 6;
      sel.addEventListener('change', draw);
    });
    const tv = (b) => `<span class="tv ${b ? 'T' : 'F'}">${b ? 'T' : 'F'}</span>`;
    function sw(svg, x1, y, x2, closed, label) {
      s('circle', { cx: x1, cy: y, r: 4, fill: C.ink }, svg);
      s('circle', { cx: x2, cy: y, r: 4, fill: C.ink }, svg);
      const ang = closed ? 0 : -32 * Math.PI / 180, len = x2 - x1;
      s('line', { x1, y1: y, x2: x1 + Math.cos(ang) * len, y2: y + Math.sin(ang) * len, stroke: closed ? C.green : C.red, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      txt(svg, (x1 + x2) / 2, y + 22, label, { 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700, fill: closed ? C.green : C.red });
    }
    function bulb(svg, x, y, on) {
      if (on) s('circle', { cx: x, cy: y, r: 22, fill: '#fde047', opacity: .45 }, svg);
      s('circle', { cx: x, cy: y, r: 13, fill: on ? '#facc15' : '#e2e8f0', stroke: C.ink, 'stroke-width': 2 }, svg);
      s('rect', { x: x - 6, y: y + 12, width: 12, height: 8, fill: C.muted }, svg);
    }
    const wire = (svg, d, on) => s('path', { d, fill: 'none', stroke: on ? '#f59e0b' : C.muted, 'stroke-width': 3, 'stroke-linejoin': 'round' }, svg);
    function draw() {
      const p = STATEMENTS[sp.value][1], q = STATEMENTS[sq.value][1];
      el.querySelector('[data-out=np]').innerHTML = `<p style="margin:6px 0"><span class="m">p</span> ${tv(p)} ← <span class="m">~p</span> ${tv(!p)}</p><small><span class="m">~p</span>: ليس صحيحًا أن «${STATEMENTS[sp.value][0]}»</small>`;
      const and = el.querySelector('[data-svg=and]'), or = el.querySelector('[data-svg=or]');
      clear(and); clear(or);
      // series circuit
      const a = p && q;
      wire(and, 'M20,40 L20,90 L220,90 L220,40', a);
      wire(and, 'M20,40 L45,40 M95,40 L135,40 M185,40 L220,40', a);
      sw(and, 45, 40, 95, p, 'p'); sw(and, 135, 40, 185, q, 'q');
      bulb(and, 120, 82, a);
      el.querySelector('[data-out=and]').innerHTML = `<span class="m">p ∧ q</span> = ${tv(a)} <small>${a ? 'المصباح يضيء لأن المفتاحين مغلقان' : 'يكفي أن يكون مفتاح واحد مفتوحًا فلا يضيء'}</small>`;
      // parallel circuit
      const o = p || q;
      wire(or, 'M20,30 L20,110 L220,110 L220,30', o);
      wire(or, 'M20,30 L95,30 M145,30 L220,30', o);
      wire(or, 'M20,30 L20,62 L95,62 M145,62 L220,62 L220,30', o);
      sw(or, 95, 30, 145, p, ''); txt(or, 80, 34, 'p', { 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700, fill: p ? C.green : C.red });
      sw(or, 95, 62, 145, q, ''); txt(or, 80, 66, 'q', { 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700, fill: q ? C.green : C.red });
      bulb(or, 120, 100, o);
      el.querySelector('[data-out=or]').innerHTML = `<span class="m">p ∨ q</span> = ${tv(o)} <small>${o ? 'يكفي مفتاح واحد مغلق ليضيء المصباح' : 'المفتاحان مفتوحان فلا يضيء'}</small>`;
      tex(el);
    }
    draw();
  };

  /* ---------- Truth table quiz ---------- */
  const EXPRS = [
    { k: '~p', cols: [['~p', (p) => !p]] },
    { k: 'p ∧ q', cols: [['p∧q', (p, q) => p && q]] },
    { k: 'p ∨ q', cols: [['p∨q', (p, q) => p || q]] },
    { k: '~p ∨ q', cols: [['~p', (p) => !p], ['~p∨q', (p, q) => !p || q]] },
    { k: '~p ∧ ~q', cols: [['~p', (p) => !p], ['~q', (p, q) => !q], ['~p∧~q', (p, q) => !p && !q]] },
    { k: 'p ∧ ~q', cols: [['~q', (p, q) => !q], ['p∧~q', (p, q) => p && !q]] },
    { k: '~p ∨ ~q', cols: [['~p', (p) => !p], ['~q', (p, q) => !q], ['~p∨~q', (p, q) => !p || !q]] },
  ];
  W.truthQuiz = function (el) {
    const sel = el.querySelector('select'), table = el.querySelector('table'), ro = el.querySelector('.readout');
    sel.dir = 'ltr';
    EXPRS.forEach((e, i) => { const o = document.createElement('option'); o.value = i; o.textContent = e.k; sel.appendChild(o); });
    sel.value = 3;
    const rows = [[true, true], [true, false], [false, true], [false, false]];
    let cells = [];
    function build() {
      const ex = EXPRS[sel.value], onlyP = ex.k === '~p';
      const rs = onlyP ? [[true], [false]] : rows;
      table.innerHTML = '';
      const hr = table.insertRow();
      (onlyP ? ['p'] : ['p', 'q']).concat(ex.cols.map((c) => c[0])).forEach((h) => { const th = document.createElement('th'); th.innerHTML = `<span class="m">${h}</span>`; hr.appendChild(th); });
      cells = [];
      rs.forEach(([p, q]) => {
        const tr = table.insertRow();
        (onlyP ? [p] : [p, q]).forEach((v) => { const td = tr.insertCell(); td.className = 'given'; td.textContent = v ? 'T' : 'F'; });
        ex.cols.forEach(([, f]) => {
          const td = tr.insertCell(), b = document.createElement('button');
          b.textContent = '؟'; b.dataset.v = ''; b.dataset.ans = f(p, q) ? 'T' : 'F';
          b.addEventListener('click', () => { b.dataset.v = b.dataset.v === 'T' ? 'F' : 'T'; b.textContent = b.dataset.v; b.className = ''; ro.innerHTML = ''; });
          td.appendChild(b); cells.push(b);
        });
      });
      ro.innerHTML = '';
      tex(table);
    }
    sel.addEventListener('change', build);
    el.querySelector('[data-act=check]').addEventListener('click', () => {
      let right = 0, empty = 0;
      cells.forEach((b) => { if (!b.dataset.v) { empty++; b.className = ''; return; } const ok = b.dataset.v === b.dataset.ans; b.className = ok ? 'right' : 'wrong'; if (ok) right++; });
      const all = right === cells.length;
      ro.innerHTML = all ? '<span class="pill big ok">🎉 ممتاز! الجدول كله صحيح</span>'
        : `<span class="pill ${right ? '' : 'no'}">صحيح: ${right} من ${cells.length}</span>` + (empty ? `<span class="pill">خانات فارغة: ${empty}</span>` : '');
    });
    el.querySelector('[data-act=show]').addEventListener('click', () => { cells.forEach((b) => { b.dataset.v = b.dataset.ans; b.textContent = b.dataset.ans; b.className = 'right'; }); ro.innerHTML = '<span class="pill">هذا هو الحل — اضغط «مسح» وحاول بنفسك</span>'; });
    el.querySelector('[data-act=clear]').addEventListener('click', build);
    build();
  };

  /* ---------- Venn region highlighter ---------- */
  W.venn = function (el) {
    const svg = el.querySelector('svg'), chips = el.querySelector('.chips'), ro = el.querySelector('.readout');
    const A = [125, 112], B = [195, 112], r = 68;
    const defs = s('defs', {}, svg);
    const id = 'v' + Math.random().toString(36).slice(2, 7);
    const cp = (name, c) => { const p = s('clipPath', { id: id + name }, defs); s('circle', { cx: c[0], cy: c[1], r }, p); };
    cp('A', A); cp('B', B);
    const mk = (name, c) => { const m = s('mask', { id: id + 'n' + name }, defs); s('rect', { x: 0, y: 0, width: 320, height: 210, fill: '#fff' }, m); s('circle', { cx: c[0], cy: c[1], r, fill: '#000' }, m); };
    mk('A', A); mk('B', B);
    const mOut = s('mask', { id: id + 'out' }, defs);
    s('rect', { x: 0, y: 0, width: 320, height: 210, fill: '#fff' }, mOut);
    s('circle', { cx: A[0], cy: A[1], r, fill: '#000' }, mOut); s('circle', { cx: B[0], cy: B[1], r, fill: '#000' }, mOut);

    const regions = {
      out: { el: s('rect', { x: 6, y: 30, width: 308, height: 174, rx: 10, mask: `url(#${id}out)` }, svg), p: false, q: false, name: 'ليس سداسيًّا وليس محدبًا', ex: '~p ∧ ~q' },
      a: { el: s('circle', { cx: A[0], cy: A[1], r, mask: `url(#${id}nB)` }, svg), p: true, q: false, name: 'مضلعات سداسية غير محدبة', ex: 'p ∧ ~q' },
      b: { el: s('circle', { cx: B[0], cy: B[1], r, mask: `url(#${id}nA)` }, svg), p: false, q: true, name: 'مضلعات محدبة غير سداسية', ex: '~p ∧ q' },
      ab: { el: s('circle', { cx: B[0], cy: B[1], r, 'clip-path': `url(#${id}A)` }, svg), p: true, q: true, name: 'مضلعات سداسية ومحدبة', ex: 'p ∧ q' },
    };
    s('rect', { x: 6, y: 30, width: 308, height: 174, rx: 10, fill: 'none', stroke: C.ink, 'stroke-width': 2 }, svg);
    s('circle', { cx: A[0], cy: A[1], r, fill: 'none', stroke: C.blue, 'stroke-width': 2.5 }, svg);
    s('circle', { cx: B[0], cy: B[1], r, fill: 'none', stroke: C.orange, 'stroke-width': 2.5 }, svg);
    txt(svg, 160, 20, 'جميع المضلعات', { 'font-weight': 700 });
    txt(svg, 85, 50, 'سداسية (p)', { fill: C.blue, 'font-weight': 700, 'font-size': 12 });
    txt(svg, 238, 50, 'محدبة (q)', { fill: '#b45309', 'font-weight': 700, 'font-size': 12 });
    const lbl = { a: [95, 116], ab: [160, 116], b: [226, 116], out: [290, 192] };
    Object.keys(regions).forEach((k) => {
      const R = regions[k];
      R.el.style.cursor = 'pointer'; R.el.style.transition = 'fill .3s';
      R.el.addEventListener('click', () => { highlight((p, q) => p === R.p && q === R.q); ro.innerHTML = `<span class="pill big"><span class="m">${R.ex}</span></span><span class="pill">${R.name}</span>`; tex(ro); setChip(-1); });
      const t = txt(svg, lbl[k][0], lbl[k][1], R.ex, { 'font-family': 'Georgia', 'font-style': 'italic', 'font-size': 12, 'pointer-events': 'none' });
      t.setAttribute('direction', 'ltr');
    });
    const ops = [
      ['p', (p) => p, 'جميع المضلعات السداسية'],
      ['q', (p, q) => q, 'جميع المضلعات المحدبة'],
      ['~p', (p) => !p, 'كل ما ليس سداسيًّا'],
      ['p ∧ q', (p, q) => p && q, 'التقاطع: سداسية ومحدبة معًا'],
      ['p ∨ q', (p, q) => p || q, 'الاتحاد: سداسية أو محدبة أو كلاهما (ثلاث مناطق)'],
      ['p ∧ ~q', (p, q) => p && !q, 'سداسية غير محدبة'],
      ['~(p ∨ q)', (p, q) => !(p || q), 'خارج الدائرتين'],
    ];
    const chipEls = ops.map(([k, f, d], i) => {
      const b = document.createElement('button'); b.className = 'chip'; b.style.color = C.purple; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="m">${k}</span>`;
      b.addEventListener('click', () => { highlight(f); setChip(i); ro.innerHTML = `<span class="pill big"><span class="m">${k}</span></span><span class="pill">${d}</span>`; tex(ro); });
      chips.appendChild(b); return b;
    });
    function setChip(i) { chipEls.forEach((b, j) => b.setAttribute('aria-pressed', i === j)); }
    function highlight(f) { Object.values(regions).forEach((R) => R.el.setAttribute('fill', f(R.p, R.q) ? 'rgba(124,58,237,.45)' : 'rgba(255,255,255,0)')); }
    chipEls[4].click();
  };

  /* ---------- Venn with counts ---------- */
  W.vennCount = function (el) {
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), sl = el.querySelector('.sliders');
    const d = el.dataset, v = { a: +d.va, ab: +d.vab, b: +d.vb, out: +d.vout };
    const A = [190, 98], B = [130, 98], r = 62;   // RTL: first set on the right
    function draw() {
      clear(svg);
      s('rect', { x: 6, y: 6, width: 308, height: 168, rx: 10, fill: '#fff', stroke: C.ink, 'stroke-width': 1.5 }, svg);
      s('circle', { cx: A[0], cy: A[1], r, fill: 'rgba(220,38,38,.18)', stroke: C.red, 'stroke-width': 2.5 }, svg);
      s('circle', { cx: B[0], cy: B[1], r, fill: 'rgba(29,78,216,.18)', stroke: C.blue, 'stroke-width': 2.5 }, svg);
      txt(svg, A[0] + 30, 28, d.a, { fill: C.red, 'font-weight': 800 });
      txt(svg, B[0] - 30, 28, d.b, { fill: C.blue, 'font-weight': 800 });
      txt(svg, A[0] + 25, A[1] + 6, v.a, { 'font-size': 20, 'font-weight': 800 });
      txt(svg, 160, A[1] + 6, v.ab, { 'font-size': 20, 'font-weight': 800, fill: C.purple });
      txt(svg, B[0] - 25, B[1] + 6, v.b, { 'font-size': 20, 'font-weight': 800 });
      if (v.out >= 0) txt(svg, 290, 160, v.out, { 'font-size': 16, 'font-weight': 800 });
      if (ro) ro.innerHTML = `<span class="pill">الاتحاد (أو): <span class="m">${v.a} + ${v.ab} + ${v.b} = ${v.a + v.ab + v.b}</span></span><span class="pill" style="color:${C.purple}">التقاطع (و): <b>${v.ab}</b></span>`;
      tex(ro);
    }
    if (!d.fixed && sl) {
      [['a', `${d.a} فقط`, 30], ['ab', 'كلاهما', 30], ['b', `${d.b} فقط`, 30]].forEach(([k, label, max]) => {
        const row = document.createElement('div'); row.className = 'ctrl';
        row.innerHTML = `<label>${label}</label><input type="range" min="0" max="${max}" value="${v[k]}"><output>${v[k]}</output>`;
        const inp = row.querySelector('input');
        inp.addEventListener('input', () => { v[k] = +inp.value; row.querySelector('output').textContent = inp.value; draw(); });
        sl.appendChild(row);
      });
    }
    draw();
  };

  /* ===================== Lessons 1-3 … 1-8 ===================== */
  const tvTag = (b) => `<span class="tv ${b ? 'T' : 'F'}">${b ? 'T' : 'F'}</span>`;
  const deg = (r) => r * 180 / Math.PI;
  // angle (math convention, y up) of point p seen from o, in degrees 0..360
  const angAt = (o, p) => (deg(Math.atan2(o[1] - p[1], p[0] - o[0])) + 360) % 360;
  function arcPath(o, r, a1, a2) {   // counter-clockwise from a1 to a2 (degrees)
    let d = ((a2 - a1) % 360 + 360) % 360;
    const p = (a) => [o[0] + r * Math.cos(a * Math.PI / 180), o[1] - r * Math.sin(a * Math.PI / 180)];
    const s0 = p(a1), s1 = p(a1 + d);
    return `M${o[0]},${o[1]} L${s0[0]},${s0[1]} A${r},${r} 0 ${d > 180 ? 1 : 0} 0 ${s1[0]},${s1[1]} Z`;
  }
  const ray = (svg, o, a, len, col, w) => s('line', { x1: o[0], y1: o[1], x2: o[0] + len * Math.cos(a * Math.PI / 180), y2: o[1] - len * Math.sin(a * Math.PI / 180), stroke: col, 'stroke-width': w || 3, 'stroke-linecap': 'round' }, svg);
  function fit(o, a, W, H, pad) {
    const c = Math.cos(a * Math.PI / 180), sn = -Math.sin(a * Math.PI / 180);
    let t = 1e9;
    if (c > 1e-6) t = Math.min(t, (W - pad - o[0]) / c); else if (c < -1e-6) t = Math.min(t, (pad - o[0]) / c);
    if (sn > 1e-6) t = Math.min(t, (H - pad - o[1]) / sn); else if (sn < -1e-6) t = Math.min(t, (pad - o[1]) / sn);
    return t;
  }
  const italic = (extra) => Object.assign({ 'font-family': 'Georgia', 'font-style': 'italic', 'font-weight': 700, 'font-size': 15 }, extra || {});

  /* ---------- 1-3: truth value of a conditional (Omar's promise) ---------- */
  W.condTruth = function (el) {
    el.innerHTML = `<div class="hint">اضغط لتغيير ما حدث، وراقب: هل أوفى عمر بوعده؟</div>
      <p style="text-align:center;margin:4px 0"><b>«إذا أنهيت واجبي المنزلي، فإني سوف ألعب الكرة معكم.»</b></p>
      <div class="ctrl" style="justify-content:center;gap:8px">
        <button class="chip" data-k="p" style="color:var(--teal)"><span></span></button>
        <button class="chip" data-k="q" style="color:var(--blue)"><span></span></button>
      </div>
      <div class="tbl-wrap" style="border:0"><table class="tt"><tr><th>p</th><th>q</th><th>p → q</th></tr></table></div>
      <div class="readout"></div>`;
    const st = { p: true, q: true }, table = el.querySelector('table'), ro = el.querySelector('.readout');
    const rows = [[true, true], [true, false], [false, true], [false, false]].map(([p, q]) => {
      const tr = table.insertRow();
      [p, q, !p || q].forEach((v) => { const td = tr.insertCell(); td.className = 'given'; td.innerHTML = `<b class="${v ? 'T' : 'F'}">${v ? 'T' : 'F'}</b>`; });
      return { tr, p, q };
    });
    const label = { p: ['p: أنهى واجبه ✓', 'p: لم يُنهِ واجبه ✗'], q: ['q: لعب الكرة ✓', 'q: لم يلعب الكرة ✗'] };
    const why = {
      TT: 'أنهى واجبه ولعب الكرة: أوفى بوعده، فالعبارة صائبة.',
      TF: 'أنهى واجبه ولم يلعب الكرة: لم يفِ بوعده، فالعبارة <b>خاطئة</b>. هذه هي الحالة الوحيدة!',
      FT: 'لم يُنهِ واجبه، فوعده لم يُختبر أصلًا؛ لعبه للكرة لا ينقض وعده، فالعبارة صائبة.',
      FF: 'لم يُنهِ واجبه ولم يلعب: لم يكذب في شيء، فالعبارة صائبة.',
    };
    function draw() {
      el.querySelectorAll('[data-k]').forEach((b) => { const k = b.dataset.k; b.setAttribute('aria-pressed', st[k]); b.firstChild.textContent = label[k][st[k] ? 0 : 1]; });
      rows.forEach((r) => { r.tr.style.outline = r.p === st.p && r.q === st.q ? '3px solid var(--orange)' : ''; });
      const v = !st.p || st.q;
      ro.innerHTML = `<span class="pill big ${v ? 'ok' : 'no'}"><span class="m">p → q</span> = ${tvTag(v)}</span><span class="pill">${why[(st.p ? 'T' : 'F') + (st.q ? 'T' : 'F')]}</span>`;
      tex(ro);
    }
    el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { st[b.dataset.k] = !st[b.dataset.k]; draw(); }));
    draw(); tex(table);
  };

  /* ---------- 1-3: related conditionals ---------- */
  const RELATED = [
    { s: 'الأسود هي قطط تستطيع أن تزأر.', f: [
      ['إذا كان الحيوان أسدًا، فإنه قط يستطيع أن يزأر.', true],
      ['إذا كان الحيوان قطًّا يستطيع أن يزأر، فإنه يكون أسدًا.', false, 'النمر قط يستطيع أن يزأر، لكنه ليس أسدًا.'],
      ['إذا لم يكن الحيوان أسدًا، فإنه لا يكون قطًّا يستطيع أن يزأر.', false, 'النمر ليس أسدًا، ولكنه قط يستطيع أن يزأر.'],
      ['إذا لم يكن الحيوان قطًّا يستطيع أن يزأر، فإنه لا يكون أسدًا.', true]] },
    { s: 'إذا كان m∠A = 35°، فإن ∠A حادة.', f: [
      ['إذا كان m∠A = 35°، فإن ∠A حادة.', true],
      ['إذا كانت ∠A حادة، فإن m∠A = 35°.', false, 'm∠A = 50° زاوية حادة.'],
      ['إذا كان m∠A ≠ 35°، فإن ∠A ليست حادة.', false, 'm∠A = 50° ليست 35° لكنها حادة.'],
      ['إذا لم تكن ∠A حادة، فإن m∠A ≠ 35°.', true]] },
    { s: 'إذا كان العدد يقبل القسمة على 2، فإنه يقبل القسمة على 4.', f: [
      ['إذا كان العدد يقبل القسمة على 2، فإنه يقبل القسمة على 4.', false, 'العدد 6 يقبل القسمة على 2 ولا يقبلها على 4.'],
      ['إذا كان العدد يقبل القسمة على 4، فإنه يقبل القسمة على 2.', true],
      ['إذا كان العدد لا يقبل القسمة على 2، فإنه لا يقبل القسمة على 4.', true],
      ['إذا كان العدد لا يقبل القسمة على 4، فإنه لا يقبل القسمة على 2.', false, 'العدد 6 لا يقبل القسمة على 4 لكنه يقبلها على 2.']] },
    { s: 'الفأر من القوارض.', f: [
      ['إذا كان الحيوان فأرًا، فإنه من القوارض.', true],
      ['إذا كان الحيوان من القوارض، فإنه فأر.', false, 'السنجاب من القوارض وليس فأرًا.'],
      ['إذا لم يكن الحيوان فأرًا، فإنه ليس من القوارض.', false, 'السنجاب ليس فأرًا لكنه من القوارض.'],
      ['إذا لم يكن الحيوان من القوارض، فإنه ليس فأرًا.', true]] },
  ];
  W.relatedCond = function (el) {
    el.innerHTML = `<div class="hint">اختر عبارة: العبارات ذات اللون نفسه متكافئة منطقيًّا (لها قيمة الصواب نفسها دائمًا)</div>
      <div class="ctrl"><select style="flex:1;font:inherit;padding:6px;border-radius:10px;border:2px solid var(--line)"></select></div>
      <div class="rel-grid"></div>`;
    const sel = el.querySelector('select'), grid = el.querySelector('.rel-grid');
    RELATED.forEach((r, i) => { const o = document.createElement('option'); o.value = i; o.textContent = r.s; sel.appendChild(o); });
    const names = [['العبارة الشرطية', 'p → q', 'a'], ['العكس', 'q → p', 'b'], ['المعكوس', '~p → ~q', 'b'], ['المعاكس الإيجابي', '~q → ~p', 'a']];
    function draw() {
      const r = RELATED[sel.value];
      grid.innerHTML = r.f.map(([t, v, ce], i) => `<div class="rel ${names[i][2]}"><div class="rel-h"><b>${names[i][0]}</b> <span class="m">${names[i][1]}</span> ${tvTag(v)}</div><p>${t}</p>${ce ? `<small>✗ مثال مضاد: ${ce}</small>` : ''}</div>`).join('');
      tex(grid);
    }
    sel.addEventListener('change', draw);
    draw();
  };

  /* ---------- 1-4: testing a deduction with a Venn diagram ---------- */
  W.vennDeduce = function (el) {
    el.innerHTML = `<div class="hint">اسحب «محمد» إلى أي مكان يتفق مع المعطيات. هل يوجد مكان واحد فقط؟</div><svg viewBox="0 0 320 230"></svg><div class="readout"></div>`;
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const O = [160, 122], R1 = 96, R2 = 46, I = [176, 104];
    s('rect', { x: 4, y: 4, width: 312, height: 222, rx: 12, fill: '#fff', stroke: C.ink, 'stroke-width': 1.5 }, svg);
    txt(svg, 160, 20, 'موظفو الشركة', { 'font-weight': 700, 'font-size': 13 });
    s('circle', { cx: O[0], cy: O[1], r: R1, fill: 'rgba(29,78,216,.10)', stroke: C.blue, 'stroke-width': 2.5 }, svg);
    s('circle', { cx: I[0], cy: I[1], r: R2, fill: 'rgba(245,158,11,.25)', stroke: C.orange, 'stroke-width': 2.5 }, svg);
    txt(svg, I[0], I[1] - 4, 'صُرفت لهم', { 'font-size': 12, 'font-weight': 700, fill: '#92400e' });
    txt(svg, I[0], I[1] + 12, 'مكافآت', { 'font-size': 12, 'font-weight': 700, fill: '#92400e' });
    txt(svg, 112, 196, 'عملوا أكثر من 175 ساعة', { 'font-size': 12, 'font-weight': 700, fill: C.blue });
    const h = handle(svg, C.purple), lbl = txt(svg, 0, 0, 'محمد', { 'font-size': 13, 'font-weight': 800, fill: C.purple });
    let P = [292, 208];
    const seen = new Set();
    function draw() {
      place(h, P[0], P[1]); lbl.setAttribute('x', P[0]); lbl.setAttribute('y', P[1] - 16);
      const d1 = Math.hypot(P[0] - O[0], P[1] - O[1]), d2 = Math.hypot(P[0] - I[0], P[1] - I[1]);
      let msg;
      if (d1 > R1) msg = '<span class="pill no">✗ هنا يخالف المعطيات: محمد عمل أكثر من 175 ساعة، فيجب أن يكون داخل الدائرة الزرقاء.</span>';
      else if (d2 <= R2) { seen.add('in'); msg = '<span class="pill ok">ممكن: داخل الدائرتين ← صُرفت له مكافأة.</span>'; }
      else { seen.add('ring'); msg = '<span class="pill ok">ممكن أيضًا: داخل الزرقاء فقط ← لم تُصرف له مكافأة!</span>'; }
      if (seen.size === 2) msg += '<span class="pill big no">الموقعان ممكنان، إذن الاستنتاج «صُرف لمحمد مكافأة» غير صائب.</span>';
      ro.innerHTML = msg;
    }
    draggable(svg, h, (x, y) => { P = [Math.max(14, Math.min(306, x)), Math.max(30, Math.min(216, y))]; draw(); });
    draw();
  };

  /* ---------- 1-5: postulates about points, lines and planes ---------- */
  W.twoPoints = function (el) {
    el.innerHTML = `<div class="hint">اسحب النقاط A و B و C. ضع C على المستقيم ثم أبعدها عنه</div><svg viewBox="0 0 320 220"></svg><div class="readout"></div>`;
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const layer = s('g', {}, svg);
    const pts = { A: [70, 150], B: [230, 110], C: [180, 40] }, hs = {};
    ['A', 'B', 'C'].forEach((k) => {
      hs[k] = handle(svg, k === 'C' ? C.orange : C.purple);
      draggable(svg, hs[k], (x, y) => {
        let p = [Math.max(12, Math.min(308, x)), Math.max(12, Math.min(208, y))];
        if (k === 'C') { const q = proj(p); if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 9) p = q; }
        pts[k] = p; draw();
      });
    });
    function proj(p) {
      const [a, b] = [pts.A, pts.B], dx = b[0] - a[0], dy = b[1] - a[1], t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
      return [a[0] + t * dx, a[1] + t * dy];
    }
    function draw() {
      clear(layer);
      const [a, b, c] = [pts.A, pts.B, pts.C], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const q = proj(c), on = Math.hypot(q[0] - c[0], q[1] - c[1]) < 1;
      if (!on) {
        // a plane through A, B, C drawn as a parallelogram around the triangle
        const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3, grow = (p) => [cx + (p[0] - cx) * 1.6, cy + (p[1] - cy) * 1.6];
        s('polygon', { points: [a, b, c].map(grow).map((p) => p.join(',')).join(' '), fill: 'rgba(14,165,233,.15)', stroke: '#0ea5e9', 'stroke-dasharray': '5 4', 'stroke-linejoin': 'round' }, layer);
        txt(layer, grow(c)[0], grow(c)[1] - 6, '𝒫', { 'font-size': 18, fill: '#0369a1' });
      }
      s('line', { x1: a[0] - dx / L * 400, y1: a[1] - dy / L * 400, x2: a[0] + dx / L * 400, y2: a[1] + dy / L * 400, stroke: on ? C.green : C.teal, 'stroke-width': 3 }, layer);
      ['A', 'B', 'C'].forEach((k) => { place(hs[k], pts[k][0], pts[k][1]); txt(layer, pts[k][0] + 16, pts[k][1] - 12, k, italic()); });
      ro.innerHTML = '<span class="pill">مسلّمة 1.1: يمر بالنقطتين A و B مستقيم واحد فقط.</span>' +
        (on ? '<span class="pill no">A, B, C على استقامة واحدة ← لا تحدد مستوى وحيدًا (يمر بها عدد لا نهائي من المستويات).</span>'
            : '<span class="pill ok">مسلّمة 1.2: ثلاث نقاط ليست على استقامة واحدة يمر بها مستوى واحد فقط.</span>');
    }
    draw();
  };

  /* ---------- 1-6: choose the reason for each step of a proof ---------- */
  const REASONS = ['المعطيات', 'خاصية التوزيع', 'خاصية الجمع للمساواة', 'خاصية الطرح للمساواة', 'خاصية الضرب للمساواة', 'خاصية القسمة للمساواة', 'بالتبسيط', 'خاصية التعويض', 'خاصية التماثل', 'خاصية التعدي', 'تعريف تطابق الزوايا'];
  const PROOFS = {
    eq: [['−5(x + 4) = 70', 0], ['−5x − 20 = 70', 1], ['−5x − 20 + 20 = 70 + 20', 2], ['−5x = 90', 6], ['−5x ÷ (−5) = 90 ÷ (−5)', 5], ['x = −18', 6]],
    angle: [['∠FGJ ≅ ∠JGK, ∠JGK ≅ ∠KGH', 0], ['m∠FGJ = m∠JGK, m∠JGK = m∠KGH', 10], ['m∠FGJ = m∠KGH', 9], ['6x + 7 = 8x − 5', 7], ['6x + 12 = 8x', 2], ['12 = 2x', 3], ['6 = x', 5], ['x = 6', 8]],
  };
  W.reasonQuiz = function (el) {
    const steps = PROOFS[el.dataset.proof];
    el.insertAdjacentHTML('beforeend', `<div class="tbl-wrap" style="border:0"><table class="data proof"><tr><th>العبارات</th><th>المبررات</th></tr></table></div>
      <div class="readout"></div><div class="ctrl" style="justify-content:center"><button class="btn sm" data-act="check">تحقق</button><button class="btn sm ghost" data-act="show">أظهر الحل</button></div>`);
    const table = el.querySelector('table'), ro = el.querySelector('.readout');
    const sels = steps.map(([st], i) => {
      const tr = table.insertRow();
      tr.insertCell().innerHTML = `${i + 1}) <span class="m">${st}</span>`;
      const sel = document.createElement('select');
      sel.innerHTML = '<option value="">— اختر المبرر —</option>' + REASONS.map((r, j) => `<option value="${j}">${r}</option>`).join('');
      sel.addEventListener('change', () => { sel.className = ''; ro.innerHTML = ''; });
      tr.insertCell().appendChild(sel);
      return sel;
    });
    el.querySelector('[data-act=check]').addEventListener('click', () => {
      let ok = 0;
      sels.forEach((sel, i) => { const r = sel.value !== '' && +sel.value === steps[i][1]; sel.className = sel.value === '' ? '' : r ? 'right' : 'wrong'; if (r) ok++; });
      ro.innerHTML = ok === steps.length ? '<span class="pill big ok">🎉 ممتاز! كل المبررات صحيحة</span>' : `<span class="pill">صحيح: ${ok} من ${steps.length}</span>`;
    });
    el.querySelector('[data-act=show]').addEventListener('click', () => { sels.forEach((sel, i) => { sel.value = steps[i][1]; sel.className = 'right'; }); });
    tex(table);
  };

  /* ---------- 1-6: Celsius → Fahrenheit ---------- */
  W.tempConvert = function (el) {
    el.innerHTML = `<div class="hint">حرّك المنزلق: درجة الحرارة بالسيليزي، وشاهد قيمتها بالفهرنهايتي</div>
      <div class="ctrl"><label>°C</label><input type="range" min="-40" max="100" value="20"><output></output></div>
      <svg viewBox="0 0 320 70"></svg><div class="readout"></div>`;
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    range(el, (c) => {
      clear(svg);
      const f = 9 / 5 * c + 32, X = (v) => 20 + (v + 40) / 140 * 280;
      s('rect', { x: 20, y: 26, width: 280, height: 14, rx: 7, fill: '#e2e8f0' }, svg);
      s('rect', { x: 20, y: 26, width: X(c) - 20, height: 14, rx: 7, fill: c <= 0 ? '#38bdf8' : c >= 100 ? '#dc2626' : '#f97316' }, svg);
      [[0, 'تجمد الماء'], [100, 'غليان الماء']].forEach(([v, t]) => { s('line', { x1: X(v), x2: X(v), y1: 20, y2: 46, stroke: C.ink }, svg); txt(svg, X(v), 62, t, { 'font-size': 11 }); });
      ro.innerHTML = `<span class="pill big"><span class="m">F = (9/5)(${c}) + 32 = ${fmt(f)}</span></span>` +
        (c === 0 ? '<span class="pill ok">الماء يتجمد عند 32°F</span>' : c === 100 ? '<span class="pill ok">الماء يغلي عند 212°F</span>' : '');
      tex(ro);
    });
  };

  /* ---------- 1-7: segment addition postulate ---------- */
  W.segmentAdd = function (el) {
    el.innerHTML = `<div class="hint">اسحب النقطة B على المستقيم: متى يكون AB + BC = AC ؟</div><svg viewBox="0 0 320 100"></svg><div class="readout"></div>`;
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const A = 40, Cx = 260, y = 50, U = 20;
    let B = 120;
    const h = handle(svg, C.orange);
    function draw() {
      clear(layer);
      s('line', { x1: 8, x2: 312, y1: y, y2: y, stroke: C.muted, 'stroke-width': 2 }, layer);
      s('line', { x1: A, x2: Cx, y1: y + 22, y2: y + 22, stroke: C.teal, 'stroke-width': 3 }, layer);
      txt(layer, (A + Cx) / 2, y + 40, `AC = ${fmt((Cx - A) / U)}`, italic({ fill: C.teal, 'font-size': 13 }));
      s('line', { x1: Math.min(A, B), x2: Math.max(A, B), y1: y - 16, y2: y - 16, stroke: C.blue, 'stroke-width': 3 }, layer);
      s('line', { x1: Math.min(B, Cx), x2: Math.max(B, Cx), y1: y - 24, y2: y - 24, stroke: C.pink, 'stroke-width': 3 }, layer);
      [['A', A], ['C', Cx]].forEach(([n, x]) => { s('circle', { cx: x, cy: y, r: 5, fill: C.ink }, layer); txt(layer, x, y + 20, n, italic()); });
      txt(layer, B, y + 20, 'B', italic({ fill: '#b45309' }));
      place(h, B, y);
      const ab = Math.abs(B - A) / U, bc = Math.abs(Cx - B) / U, ac = (Cx - A) / U, ok = Math.abs(ab + bc - ac) < 0.05;
      ro.innerHTML = `<span class="pill" style="color:${C.blue}"><span class="m">AB = ${fmt(ab)}</span></span><span class="pill" style="color:${C.pink}"><span class="m">BC = ${fmt(bc)}</span></span>` +
        `<span class="pill big ${ok ? 'ok' : 'no'}"><span class="m">AB + BC = ${fmt(ab + bc)}</span> ${ok ? '= AC ✓ (B تقع بين A و C)' : '≠ AC ✗ (B ليست بين A و C)'}</span>`;
      tex(ro);
    }
    draggable(svg, h, (x) => { B = Math.max(10, Math.min(310, x)); draw(); });
    draw();
  };

  /* ---------- 1-8: angle addition postulate ---------- */
  W.angleAdd = function (el) {
    el.innerHTML = `<div class="hint">اسحب نهايات الأشعة A و C و D وراقب قياسات الزوايا</div><svg viewBox="0 0 320 220"></svg><div class="readout"></div>`;
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const O = [160, 196], VW = 320, VH = 220;
    const a = { A: 150, D: 95, C: 25 }, hs = {};
    ['A', 'D', 'C'].forEach((k) => {
      hs[k] = handle(svg, k === 'D' ? C.orange : C.purple);
      draggable(svg, hs[k], (x, y) => { let t = angAt(O, [x, y]); if (t > 180 && t < 270) t = 178; if (t >= 270) t = 2; a[k] = Math.round(Math.max(2, Math.min(178, t))); draw(); });
    });
    function draw() {
      clear(layer);
      const lo = Math.min(a.A, a.C), hi = Math.max(a.A, a.C), inside = a.D > lo && a.D < hi;
      s('path', { d: arcPath(O, 46, lo, inside ? a.D : hi), fill: 'rgba(29,78,216,.25)' }, layer);
      if (inside) s('path', { d: arcPath(O, 56, a.D, hi), fill: 'rgba(219,39,119,.22)' }, layer);
      ['A', 'D', 'C'].forEach((k) => {
        const L = fit(O, a[k], VW, VH, 6), r = Math.min(L - 22, 150);
        ray(layer, O, a[k], L, k === 'D' ? C.orange : C.ink);
        const p = [O[0] + r * Math.cos(a[k] * Math.PI / 180), O[1] - r * Math.sin(a[k] * Math.PI / 180)];
        place(hs[k], p[0], p[1]); txt(layer, p[0] + 18 * Math.cos((a[k] + 90) * Math.PI / 180), p[1] - 18 * Math.sin((a[k] + 90) * Math.PI / 180) + 5, k, italic());
      });
      s('circle', { cx: O[0], cy: O[1], r: 4, fill: C.ink }, layer); txt(layer, O[0] - 12, O[1] + 16, 'B', italic());
      const abc = hi - lo, abd = Math.abs(a.A - a.D), dbc = Math.abs(a.D - a.C);
      ro.innerHTML = inside
        ? `<span class="pill"><span class="m">m∠ABD = ${abd}°</span></span><span class="pill"><span class="m">m∠DBC = ${dbc}°</span></span><span class="pill big ok"><span class="m">${abd}° + ${dbc}° = ${abc}° = m∠ABC</span> ✓</span>`
        : `<span class="pill no">D ليست داخل <span class="m">∠ABC</span>، فلا تنطبق المسلّمة: <span class="m">${abd}° + ${dbc}° ≠ ${abc}°</span></span>`;
      tex(ro);
    }
    draw();
  };

  /* ---------- 1-8: supplementary / complementary adjacent angles ---------- */
  W.compSupp = function (el) {
    el.innerHTML = `<div class="hint">اسحب الشعاع البرتقالي</div><svg viewBox="0 0 320 190"></svg>
      <div class="chips" style="margin-top:6px"><button class="chip" data-m="s" aria-pressed="true" style="color:var(--teal)"><span>متكاملتان (على مستقيم)</span></button><button class="chip" data-m="c" aria-pressed="false" style="color:var(--purple)"><span>متتامتان (زاوية قائمة)</span></button></div>
      <div class="readout"></div>`;
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const O = [160, 160], L = 140;
    let mode = 's', t = 60;
    const h = handle(svg, C.orange);
    draggable(svg, h, (x, y) => { let v = angAt(O, [x, y]); if (v > 180) v = v > 270 ? 0 : 180; const max = mode === 's' ? 180 : 90; t = Math.round(Math.max(0, Math.min(max, mode === 'c' ? v : v))); if (mode === 'c' && t > 90) t = 90; draw(); });
    function draw() {
      clear(layer);
      const top = mode === 's' ? 180 : 90;
      s('path', { d: arcPath(O, 40, 0, t), fill: 'rgba(29,78,216,.25)' }, layer);
      s('path', { d: arcPath(O, 50, t, top), fill: 'rgba(219,39,119,.22)' }, layer);
      if (mode === 's') s('line', { x1: 10, x2: 310, y1: O[1], y2: O[1], stroke: C.ink, 'stroke-width': 3 }, layer);
      else { ray(layer, O, 0, L, C.ink); ray(layer, O, 90, L, C.ink); s('rect', { x: O[0], y: O[1] - 14, width: 14, height: 14, fill: 'none', stroke: C.red, 'stroke-width': 2 }, layer); }
      const fl = Math.min(fit(O, t, 320, 190, 4), L);
      ray(layer, O, t, fl, C.orange);
      const p = [O[0] + (fl - 18) * Math.cos(t * Math.PI / 180), O[1] - (fl - 18) * Math.sin(t * Math.PI / 180)];
      place(h, p[0], p[1]);
      const m1 = t, m2 = top - t;
      const l1 = [O[0] + 64 * Math.cos(t / 2 * Math.PI / 180), O[1] - 64 * Math.sin(t / 2 * Math.PI / 180)], l2 = [O[0] + 74 * Math.cos((t + top) / 2 * Math.PI / 180), O[1] - 74 * Math.sin((t + top) / 2 * Math.PI / 180)];
      txt(layer, l1[0], l1[1] + 5, '1', italic({ fill: C.blue })); txt(layer, l2[0], l2[1] + 5, '2', italic({ fill: C.pink }));
      ro.innerHTML = `<span class="pill" style="color:${C.blue}"><span class="m">m∠1 = ${m1}°</span></span><span class="pill" style="color:${C.pink}"><span class="m">m∠2 = ${m2}°</span></span><span class="pill big ok"><span class="m">m∠1 + m∠2 = ${top}°</span> ← ${mode === 's' ? 'نظرية الزاويتين المتكاملتين 1.3' : 'نظرية الزاويتين المتتامتين 1.4'}</span>`;
      tex(ro);
    }
    el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      mode = b.dataset.m; t = mode === 's' ? 60 : 35;
      el.querySelectorAll('[data-m]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      draw();
    }));
    draw();
  };

  /* ---------- 1-8: vertical angles ---------- */
  W.vertical = function (el) {
    el.innerHTML = `<div class="hint">اسحب النقطة لتدوير أحد المستقيمين</div><svg viewBox="0 0 320 210"></svg><div class="readout"></div>`;
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const O = [160, 105], VW = 320, VH = 210, base = 20;
    let t = 120;
    const h = handle(svg, C.orange);
    draggable(svg, h, (x, y) => { let v = angAt(O, [x, y]); v = v > 180 ? v - 180 : v; t = Math.round(Math.max(base + 15, Math.min(base + 165, v))); draw(); });
    function draw() {
      clear(layer);
      const cols = ['rgba(29,78,216,.25)', 'rgba(219,39,119,.22)'];
      const angs = [[base, t], [t, base + 180], [base + 180, t + 180], [t + 180, base + 360]];
      angs.forEach(([a1, a2], i) => s('path', { d: arcPath(O, 34 + (i % 2) * 8, a1, a2), fill: cols[i % 2] }, layer));
      [[base, C.ink], [base + 180, C.ink], [t, C.orange], [t + 180, C.orange]].forEach(([g, col]) => ray(layer, O, g, fit(O, g, VW, VH, 4), col));
      angs.forEach(([a1, a2], i) => { const m = (a1 + a2) / 2; txt(layer, O[0] + 58 * Math.cos(m * Math.PI / 180), O[1] - 58 * Math.sin(m * Math.PI / 180) + 5, String(i + 1), italic({ fill: i % 2 ? C.pink : C.blue })); });
      const r = Math.min(fit(O, t, VW, VH, 4) - 20, 120);
      place(h, O[0] + r * Math.cos(t * Math.PI / 180), O[1] - r * Math.sin(t * Math.PI / 180));
      const a = t - base, b = 180 - a;
      ro.innerHTML = `<span class="pill" style="color:${C.blue}"><span class="m">m∠1 = m∠3 = ${a}°</span></span><span class="pill" style="color:${C.pink}"><span class="m">m∠2 = m∠4 = ${b}°</span></span><span class="pill ok"><span class="m">m∠1 + m∠2 = 180°</span></span><span class="pill big ok">الزاويتان المتقابلتان بالرأس متطابقتان (نظرية 1.8)</span>`;
      tex(ro);
    }
    draw();
  };

  /* ===================== Chapter 2 ===================== */

  /* ---------- 2-1: rectangular prism — tap an edge to see parallel / intersecting / skew edges ----------
     data-labels: 8 vertex names in the order top-front-left, top-front-right, top-back-right, top-back-left,
     bottom-front-left, bottom-front-right, bottom-back-right, bottom-back-left */
  W.box3d = function (el) {
    const names = (el.dataset.labels || 'A,D,C,B,F,E,H,G').split(',');
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 230"></svg><div class="readout"></div>
      <div class="chips" style="margin-top:6px"><span class="chip" style="color:${C.blue}"><span>متوازية</span></span><span class="chip" style="color:${C.green}"><span>متقاطعة</span></span><span class="chip" style="color:${C.red}"><span>متخالفة</span></span></div>`);
    el.querySelectorAll('.chips .chip').forEach((c) => c.setAttribute('aria-pressed', 'true'));
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const P3 = [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]];   // x right, y up, z back
    const proj = ([x, y, z]) => [70 + x * 150 + z * 70, 190 - y * 120 - z * 55];
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const dir = (e) => P3[e[1]].map((v, i) => Math.abs(v - P3[e[0]][i])).join('');
    let sel = 0;
    const layer = s('g', {}, svg);
    function rel(a, b) {
      if (a === b) return 'self';
      const share = E[a].some((v) => E[b].includes(v));
      if (share) return 'meet';
      if (dir(E[a]) === dir(E[b])) return 'par';
      // same face and not sharing a vertex and not parallel is impossible in a box; otherwise skew
      return 'skew';
    }
    function draw() {
      clear(layer);
      const col = { self: C.orange, par: C.blue, meet: C.green, skew: C.red };
      const groups = { par: [], meet: [], skew: [] };
      E.forEach((e, i) => {
        const r = rel(sel, i), a = proj(P3[e[0]]), b = proj(P3[e[1]]);
        const hidden = P3[e[0]][2] && P3[e[1]][2] && (P3[e[0]][0] === 0 || P3[e[1]][0] === 0) && (P3[e[0]][1] === 0 || P3[e[1]][1] === 0);
        if (r !== 'self') groups[r].push(names[e[0]] + names[e[1]]);
        s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: col[r], 'stroke-width': r === 'self' ? 6 : 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': hidden ? '6 5' : '' }, layer);
        const hit = s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'transparent', 'stroke-width': 18, style: 'cursor:pointer' }, layer);
        hit.addEventListener('click', () => { sel = i; draw(); });
      });
      P3.forEach((p, i) => { const q = proj(p); s('circle', { cx: q[0], cy: q[1], r: 3.5, fill: C.ink }, layer); txt(layer, q[0] + (p[0] ? 12 : -12), q[1] + (p[1] ? -6 : 16), names[i], italic()); });
      const segs = (arr) => arr.map((x) => `<span class="m">${x}</span>`).join('، ');
      const e = E[sel];
      ro.innerHTML = `<span class="pill big" style="color:${C.orange}">القطعة <span class="m">${names[e[0]] + names[e[1]]}</span></span>` +
        `<span class="pill" style="color:${C.blue}">توازيها: ${segs(groups.par)}</span><span class="pill" style="color:${C.red}">تخالفها: ${segs(groups.skew)}</span><span class="pill" style="color:${C.green}">تقطعها: ${segs(groups.meet)}</span>`;
      tex(ro);
    }
    draw();
  };

  /* ---------- 2-1 … 2-3: two lines cut by a transversal ----------
     data-orient: "h" (lines horizontal, transversal steep) or "v" (lines vertical, transversal gentle)
     data-labels: "TL,TR,BR,BL|TL,TR,BR,BL" angle numbers at the first and second intersection
     data-given:  "5:72" (optional) — lines are parallel and this angle is known; tap any angle to see its measure
     data-names:  "t,n,p" (optional) transversal and line names */
  W.transFig = function (el) {
    const orient = el.dataset.orient || 'h';
    const labels = (el.dataset.labels || '1,2,3,4|5,6,7,8').split('|').map((g) => g.split(','));
    const nm = (el.dataset.names || 't,,').split(',');
    let given = el.dataset.given ? el.dataset.given.split(':').map(Number) : null;
    const POS = ['TL', 'TR', 'BR', 'BL'];
    const all = [];
    labels.forEach((g, i) => g.forEach((n, k) => all.push({ n, i, p: POS[k] })));
    const find = (n) => all.find((a) => String(a.n) === String(n));
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 210"></svg>${given ? '<div class="ctrl"><label>القياس المعطى</label><input type="range" min="20" max="160" step="1"><output></output></div>' : ''}<div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const cls = (p) => (p === 'TL' || p === 'BR' ? 0 : 1);
    const interior = (a) => (orient === 'h' ? (a.i === 0 ? ['BL', 'BR'] : ['TL', 'TR']) : (a.i === 0 ? ['TR', 'BR'] : ['TL', 'BL'])).includes(a.p);
    const side = (p) => (orient === 'h' ? (p === 'TL' || p === 'BL' ? 'L' : 'R') : (p === 'TL' || p === 'TR' ? 'T' : 'B'));
    function relation(a, b) {
      if (a.i === b.i) return cls(a.p) === cls(b.p) ? 'متقابلتان بالرأس' : 'متجاورتان على مستقيم (متكاملتان)';
      if (a.p === b.p) return 'متناظرتان';
      const ia = interior(a), ib = interior(b), same = side(a.p) === side(b.p);
      if (ia && ib) return same ? 'متحالفتان (داخليتان في جهة واحدة)' : 'متبادلتان داخليًّا';
      if (!ia && !ib) return same ? 'خارجيتان في جهة واحدة' : 'متبادلتان خارجيًّا';
      return 'ليس لهما اسم خاص';
    }
    // tr = measure of the TR/BL angle class; the other class is 180 − tr
    let tr = given ? (cls(find(given[0]).p) === 1 ? given[1] : 180 - given[1]) : 62;
    let showDeg = !!given;
    const mOf = (a) => (cls(a.p) === 1 ? tr : 180 - tr);
    const COLS = [['rgba(219,39,119,.22)', '#db2777'], ['rgba(29,78,216,.20)', '#1d4ed8']];   // class 0 (TL/BR), class 1 (TR/BL)
    let picks = [];
    const hT = handle(svg, C.orange);
    function draw() {
      clear(layer);
      const th = orient === 'h' ? tr : 90 - tr, rad = th * Math.PI / 180;
      const I = orient === 'h'
        ? [[160 + (105 - 70) / Math.tan(rad), 70], [160 - (150 - 105) / Math.tan(rad), 150]]
        : [[110, 105 - (110 - 160) * Math.tan(rad)], [220, 105 - (220 - 160) * Math.tan(rad)]];
      const arrow = (x, y, a) => s('path', { d: `M${x},${y} l${-9 * Math.cos(a - 0.5)},${9 * Math.sin(a - 0.5)} M${x},${y} l${-9 * Math.cos(a + 0.5)},${9 * Math.sin(a + 0.5)}`, stroke: C.pink, 'stroke-width': 2.5, fill: 'none' }, layer);
      const lineDir = orient === 'h' ? 0 : 90;
      const rays = [lineDir, th, lineDir + 180, th + 180].map((x) => (x + 360) % 360).sort((x, y) => x - y);
      const wedges = rays.map((r, k) => { const r2 = rays[(k + 1) % 4] + (k === 3 ? 360 : 0); return [r, r2, (r + r2) / 2]; });
      const wedgeOf = (pos) => {
        const want = { TL: [-1, -1], TR: [1, -1], BR: [1, 1], BL: [-1, 1] }[pos];
        return wedges.find(([, , m]) => Math.sign(Math.round(Math.cos(m * Math.PI / 180) * 1000)) === want[0] && Math.sign(Math.round(-Math.sin(m * Math.PI / 180) * 1000)) === want[1]) || wedges[0];
      };
      // arcs first, so lines sit on top of them
      all.forEach((a) => {
        const w = wedgeOf(a.p), c = COLS[cls(a.p)], picked = picks.includes(a);
        s('path', { d: arcPath(I[a.i], picked ? 30 : 24, w[0], w[1]), fill: picked ? (picks[0] === a ? 'rgba(245,158,11,.45)' : 'rgba(124,58,237,.4)') : c[0], stroke: picked ? C.ink : c[1], 'stroke-width': picked ? 2 : 1.2 }, layer);
      });
      if (orient === 'h') {
        [70, 150].forEach((y, i) => { s('line', { x1: 8, x2: 312, y1: y, y2: y, stroke: C.blue, 'stroke-width': 3 }, layer); if (given) arrow(290, y, 0); if (nm[i + 1]) txt(layer, 304, y - 8, nm[i + 1], italic()); });
      } else {
        [110, 220].forEach((x, i) => { s('line', { x1: x, x2: x, y1: 6, y2: 204, stroke: C.blue, 'stroke-width': 3 }, layer); if (given) arrow(x, 22, Math.PI / 2); if (nm[i + 1]) txt(layer, x + 12, 16, nm[i + 1], italic()); });
      }
      const L = 400, mid = [(I[0][0] + I[1][0]) / 2, (I[0][1] + I[1][1]) / 2];
      const u = [Math.cos(rad), -Math.sin(rad)];
      s('line', { x1: mid[0] - L * u[0], y1: mid[1] - L * u[1], x2: mid[0] + L * u[0], y2: mid[1] + L * u[1], stroke: C.ink, 'stroke-width': 3 }, layer);
      // handle on the transversal (beyond the first intersection) to rotate it
      const hr = Math.min(fit(mid, th, 320, 210, 8) - 14, 96);
      place(hT, mid[0] + hr * u[0], mid[1] + hr * u[1]);
      if (nm[0]) txt(layer, mid[0] + (hr + 2) * u[0] - 16 * u[1], mid[1] + (hr + 2) * u[1] + 16 * u[0] + 5, nm[0], italic());
      all.forEach((a) => {
        const P = I[a.i], w = wedgeOf(a.p), picked = picks.includes(a), c = COLS[cls(a.p)];
        const q = [P[0] + 37 * Math.cos(w[2] * Math.PI / 180), P[1] - 37 * Math.sin(w[2] * Math.PI / 180)];
        txt(layer, q[0], q[1] + (showDeg ? 0 : 5), a.n, { 'font-size': 14, 'font-weight': 800, fill: picked ? C.ink : c[1], 'pointer-events': 'none' });
        if (showDeg) txt(layer, q[0], q[1] + 13, mOf(a) + '°', { 'font-size': 10, 'font-weight': 700, fill: c[1], 'pointer-events': 'none' });
        const hit = s('circle', { cx: q[0], cy: q[1] + 3, r: 14, fill: 'transparent', style: 'cursor:pointer' }, layer);
        hit.addEventListener('click', () => { picks = picks.length >= 2 || picks.includes(a) ? [a] : picks.concat(a); draw(); });
      });
      let html = '';
      if (picks.length === 0) html = `<span class="pill">${given ? 'اضغط على رقم أي زاوية لمعرفة قياسها' : 'اضغط على رقمَي زاويتين لمعرفة نوع العلاقة بينهما'}</span><span class="pill">الزوايا ذات اللون نفسه متطابقة، والزاويتان مختلفتا اللون متكاملتان</span>`;
      if (given && picks[0]) { const a = picks[0], g = find(given[0]); html += `<span class="pill big ok"><span class="m">m∠${a.n} = ${mOf(a)}°</span></span>` + (String(a.n) !== String(g.n) ? `<span class="pill">∠${a.n} و ∠${g.n}: ${relation(a, g)}</span>` : '<span class="pill">هذه هي الزاوية المعطاة</span>'); }
      if (picks.length === 2) html += `<span class="pill big" style="color:${C.purple}">∠${picks[0].n} و ∠${picks[1].n}: ${relation(picks[0], picks[1])}</span>` + (showDeg && !given ? `<span class="pill"><span class="m">${mOf(picks[0])}°</span> و <span class="m">${mOf(picks[1])}°</span></span>` : '');
      ro.innerHTML = html;
      tex(ro);
    }
    const rng = el.querySelector('input[type=range]'), out = el.querySelector('output');
    function syncGiven() {
      if (!given) return;
      given[1] = cls(find(given[0]).p) === 1 ? tr : 180 - tr;
      rng.value = given[1]; out.textContent = given[1] + '°';
    }
    draggable(svg, hT, (x, y) => {
      const I0 = orient === 'h' ? 105 : 160;   // the figure pivots around its centre
      let a = angAt(orient === 'h' ? [160, 105] : [165, 105], [x, y]);
      if (a > 180) a -= 180;
      if (orient === 'h') tr = Math.round(Math.max(22, Math.min(158, a)));
      else { const t = a > 90 ? a - 180 : a; tr = Math.round(90 - Math.max(-68, Math.min(68, t))); }
      showDeg = true; syncGiven(); draw();
    });
    if (given) {
      syncGiven();
      rng.addEventListener('input', () => { given[1] = +rng.value; out.textContent = rng.value + '°'; tr = cls(find(given[0]).p) === 1 ? given[1] : 180 - given[1]; draw(); });
    }
    draw();
  };

  /* ---------- 2-4: slope on a grid ---------- */
  function grid(svg, n, S0) {
    const g = s('g', {}, svg), c = S0 / 2, u = S0 / (2 * n);
    for (let i = -n; i <= n; i++) {
      s('line', { x1: c + i * u, x2: c + i * u, y1: 0, y2: S0, stroke: i ? C.grid : C.ink, 'stroke-width': i ? 1 : 1.6 }, g);
      s('line', { y1: c + i * u, y2: c + i * u, x1: 0, x2: S0, stroke: i ? C.grid : C.ink, 'stroke-width': i ? 1 : 1.6 }, g);
    }
    txt(g, S0 - 8, c - 6, 'x', italic({ 'font-size': 13 })); txt(g, c + 9, 12, 'y', italic({ 'font-size': 13 }));
    return { X: (x) => c + x * u, Y: (y) => c - y * u, inv: (px, py) => [Math.round((px - c) / u), Math.round((c - py) / u)], u };
  }
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const frac = (p, q) => { if (q === 0) return null; if (q < 0) { p = -p; q = -q; } const g = gcd(Math.abs(p), q) || 1; return q / g === 1 ? String(p / g) : `${p / g}/${q / g}`; };
  W.slope = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 260 260"></svg><label class="ctrl" style="justify-content:center"><input type="checkbox" data-k="pp"> أظهر مستقيمًا موازيًا وآخر عموديًّا</label><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const G = grid(svg, 6, 260), layer = s('g', {}, svg);
    const pts = [[-2, -1], [3, 3]], hs = [handle(svg, C.purple), handle(svg, C.orange)];
    const pp = el.querySelector('[data-k=pp]');
    pp.addEventListener('change', draw);
    hs.forEach((h, i) => draggable(svg, h, (x, y) => { const q = G.inv(x, y).map((v) => Math.max(-6, Math.min(6, v))); if (q[0] === pts[1 - i][0] && q[1] === pts[1 - i][1]) return; pts[i] = q; draw(); }));
    const lineThrough = (p, m, col, dash) => {
      if (m === null) { s('line', { x1: G.X(p[0]), x2: G.X(p[0]), y1: 0, y2: 260, stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': dash || '' }, layer); return; }
      s('line', { x1: G.X(-7), y1: G.Y(p[1] + m * (-7 - p[0])), x2: G.X(7), y2: G.Y(p[1] + m * (7 - p[0])), stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': dash || '' }, layer);
    };
    function draw() {
      clear(layer);
      const [a, b] = pts, dy = b[1] - a[1], dx = b[0] - a[0], m = dx ? dy / dx : null;
      lineThrough(a, m, C.teal);
      if (pp.checked) {
        lineThrough([a[0], a[1] + 3], m, C.blue, '6 4');
        lineThrough(a, m === null ? 0 : m === 0 ? null : -1 / m, C.pink, '6 4');
      }
      if (dx && dy) {
        s('line', { x1: G.X(a[0]), y1: G.Y(a[1]), x2: G.X(b[0]), y2: G.Y(a[1]), stroke: C.red, 'stroke-width': 3 }, layer);
        s('line', { x1: G.X(b[0]), y1: G.Y(a[1]), x2: G.X(b[0]), y2: G.Y(b[1]), stroke: C.blue, 'stroke-width': 3 }, layer);
        txt(layer, (G.X(a[0]) + G.X(b[0])) / 2, G.Y(a[1]) + (dy > 0 ? 16 : -6), String(dx), { fill: C.red, 'font-weight': 800, 'font-size': 13 });
        txt(layer, G.X(b[0]) + 14, (G.Y(a[1]) + G.Y(b[1])) / 2 + 4, String(dy), { fill: C.blue, 'font-weight': 800, 'font-size': 13 });
      }
      pts.forEach((p, i) => { place(hs[i], G.X(p[0]), G.Y(p[1])); });
      const kind = m === null ? 'غير معرّف (مستقيم رأسي)' : m > 0 ? 'موجب (يصعد نحو اليمين)' : m < 0 ? 'سالب (ينزل نحو اليمين)' : 'صفر (مستقيم أفقي)';
      const fs = frac(dy, dx);
      ro.innerHTML = `<span class="pill"><span class="m">(${a[0]}, ${a[1]})</span> و <span class="m">(${b[0]}, ${b[1]})</span></span>` +
        `<span class="pill big ${m === null ? 'no' : 'ok'}"><span class="m">m = (${b[1]} − ${a[1] < 0 ? '(' + a[1] + ')' : a[1]}) / (${b[0]} − ${a[0] < 0 ? '(' + a[0] + ')' : a[0]}) = ${fs === null ? dy + '/0' : fs}</span></span><span class="pill">الميل ${kind}</span>` +
        (pp.checked && m !== null && m !== 0 ? `<span class="pill" style="color:${C.blue}">الموازي: الميل نفسه <span class="m">${fs}</span></span><span class="pill" style="color:${C.pink}">العمودي: <span class="m">${frac(-dx, dy)}</span>، والناتج <span class="m">${fs} × ${frac(-dx, dy)} = −1</span></span>` : '');
      tex(ro);
    }
    draw();
  };

  /* ---------- 2-5: y = mx + b with sliders ---------- */
  W.lineEq = function (el) {
    el.insertAdjacentHTML('beforeend', `<div class="ctrl"><label>الميل m</label><input type="range" min="-4" max="4" step="0.5" value="3" data-k="m"><output></output></div>
      <div class="ctrl"><label>المقطع b</label><input type="range" min="-5" max="5" step="1" value="-2" data-k="b"><output></output></div>
      <svg viewBox="0 0 260 260"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), G = grid(svg, 6, 260), layer = s('g', {}, svg);
    const rm = el.querySelector('[data-k=m]'), rb = el.querySelector('[data-k=b]');
    function draw() {
      const m = +rm.value, b = +rb.value;
      rm.nextElementSibling.textContent = m; rb.nextElementSibling.textContent = b;
      clear(layer);
      s('line', { x1: G.X(-7), y1: G.Y(m * -7 + b), x2: G.X(7), y2: G.Y(m * 7 + b), stroke: C.teal, 'stroke-width': 3 }, layer);
      s('circle', { cx: G.X(0), cy: G.Y(b), r: 6, fill: C.orange, stroke: '#fff', 'stroke-width': 2 }, layer);
      if (m) {
        const [rise, run] = Number.isInteger(m) ? [m, 1] : [m * 2, 2];
        s('path', { d: `M${G.X(0)},${G.Y(b)} H${G.X(run)} V${G.Y(b + rise)}`, fill: 'none', stroke: C.red, 'stroke-width': 2.5, 'stroke-dasharray': '5 3' }, layer);
      }
      const eq = `y = ${m === 0 ? '' : m === 1 ? 'x' : m === -1 ? '−x' : m + 'x'}${b === 0 ? (m === 0 ? '0' : '') : b > 0 ? (m === 0 ? b : ' + ' + b) : (m === 0 ? '−' + -b : ' − ' + -b)}`;
      ro.innerHTML = `<span class="pill big ok"><span class="m">${eq}</span></span><span class="pill" style="color:#b45309">مقطع المحور y: <span class="m">(0, ${b})</span></span><span class="pill">${m === 0 ? 'مستقيم أفقي' : m > 0 ? 'يصعد' : 'ينزل'}</span>`;
      tex(ro);
    }
    rm.addEventListener('input', draw); rb.addEventListener('input', draw);
    draw();
  };

  /* ---------- 2-5: compare two linear offers ---------- */
  W.plans = function (el) {
    const A = el.dataset.a.split(',').map(Number), B = el.dataset.b.split(',').map(Number);   // [rate, fixed]
    const max = +el.dataset.max, unit = el.dataset.unit || '', names = (el.dataset.names || 'العرض X,العرض Y').split(',');
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 220"></svg><div class="ctrl"><label>${el.dataset.label || 'العدد'}</label><input type="range" min="0" max="${max}" step="${el.dataset.step || 1}" value="${Math.round(max / 3)}"><output></output></div><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const cost = (p, t) => p[0] * t + p[1];
    const ymax = Math.ceil(Math.max(cost(A, max), cost(B, max)) / 20) * 20;
    range(el, (t) => {
      clear(layer);
      const g = chart(layer, { x0: 0, x1: max, y0: 0, y1: ymax, xs: [0, max / 4, max / 2, 3 * max / 4, max].map(Math.round), ys: [0, ymax / 4, ymax / 2, 3 * ymax / 4, ymax], xl: el.dataset.label || '', yl: 'التكلفة' });
      [[A, C.blue], [B, C.orange]].forEach(([p, col]) => s('line', { x1: g.X(0), y1: g.Y(cost(p, 0)), x2: g.X(max), y2: g.Y(cost(p, max)), stroke: col, 'stroke-width': 3 }, layer));
      s('line', { x1: g.X(t), x2: g.X(t), y1: g.T, y2: g.B, stroke: C.purple, 'stroke-dasharray': '4 3' }, layer);
      [[A, C.blue], [B, C.orange]].forEach(([p, col]) => s('circle', { cx: g.X(t), cy: g.Y(cost(p, t)), r: 5, fill: col, stroke: '#fff', 'stroke-width': 2 }, layer));
      const ca = cost(A, t), cb = cost(B, t), eqT = A[0] !== B[0] ? (B[1] - A[1]) / (A[0] - B[0]) : null;
      ro.innerHTML = `<span class="pill" style="color:${C.blue}">${names[0]}: <b>${fmt(ca, 2)}</b> ${unit}</span><span class="pill" style="color:#b45309">${names[1]}: <b>${fmt(cb, 2)}</b> ${unit}</span>` +
        `<span class="pill big ${Math.abs(ca - cb) < 1e-9 ? '' : 'ok'}">${Math.abs(ca - cb) < 1e-9 ? 'التكلفتان متساويتان' : (ca < cb ? names[0] : names[1]) + ' أقل تكلفة'}</span>` +
        (eqT !== null ? `<span class="pill">تتساوى التكلفتان عند ${fmt(eqT, 2)}</span>` : '');
    });
  };

  /* ---------- 2-6: distance from a point to a line ---------- */
  W.pointLine = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 260 260"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), G = grid(svg, 7, 260), layer = s('g', {}, svg);
    const m = -1, b = -2;   // line ℓ: y = −x − 2
    let P = [2, 4], Rx = 4;
    const hP = handle(svg, C.orange), hR = handle(svg, C.purple);
    draggable(svg, hP, (x, y) => { P = G.inv(x, y).map((v) => Math.max(-7, Math.min(7, v))); if (P[1] === m * P[0] + b) P[1] += 1; draw(); });
    draggable(svg, hR, (x) => { Rx = Math.max(-7, Math.min(5, G.inv(x, 0)[0])); draw(); });
    function draw() {
      clear(layer);
      s('line', { x1: G.X(-8), y1: G.Y(m * -8 + b), x2: G.X(8), y2: G.Y(m * 8 + b), stroke: C.teal, 'stroke-width': 3 }, layer);
      txt(layer, G.X(-6.2), G.Y(m * -6.2 + b) - 8, 'ℓ', italic({ fill: C.teal }));
      const fx = (P[0] + m * (P[1] - b)) / (1 + m * m), F = [fx, m * fx + b];
      const R = [Rx, m * Rx + b];
      s('line', { x1: G.X(P[0]), y1: G.Y(P[1]), x2: G.X(R[0]), y2: G.Y(R[1]), stroke: C.purple, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }, layer);
      s('line', { x1: G.X(P[0]), y1: G.Y(P[1]), x2: G.X(F[0]), y2: G.Y(F[1]), stroke: C.orange, 'stroke-width': 3.5 }, layer);
      // right-angle mark
      const ux = Math.SQRT1_2, uy = -Math.SQRT1_2, vx = (P[0] - F[0]), vy = (P[1] - F[1]), vl = Math.hypot(vx, vy) || 1, k = 0.45;
      const c1 = [F[0] + ux * k, F[1] + uy * k], c3 = [F[0] + vx / vl * k, F[1] + vy / vl * k], c2 = [c1[0] + vx / vl * k, c1[1] + vy / vl * k];
      s('path', { d: `M${G.X(c1[0])},${G.Y(c1[1])} L${G.X(c2[0])},${G.Y(c2[1])} L${G.X(c3[0])},${G.Y(c3[1])}`, fill: 'none', stroke: C.red, 'stroke-width': 2 }, layer);
      place(hP, G.X(P[0]), G.Y(P[1])); place(hR, G.X(R[0]), G.Y(R[1]));
      txt(layer, G.X(P[0]) + 14, G.Y(P[1]) - 10, 'P', italic());
      const d = Math.hypot(P[0] - F[0], P[1] - F[1]), dr = Math.hypot(P[0] - R[0], P[1] - R[1]);
      const sq = Math.round(d * d * 1000) / 1000;
      ro.innerHTML = `<span class="pill big ok">البعد العمودي <span class="m">d = √${fmt(sq, 2)} ≈ ${fmt(d, 2)}</span></span><span class="pill" style="color:${C.purple}">قطعة مائلة: ${fmt(dr, 2)} ${dr > d + 0.01 ? '(أطول)' : ''}</span><span class="pill">المستقيم <span class="m">ℓ: y = −x − 2</span></span>`;
      tex(ro);
    }
    draw();
  };

  /* ===================== Chapter 3 ===================== */
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  // interior angle at vertex b of triangle a-b-c (degrees)
  const angleAt = (a, b, c) => { const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]]; return deg(Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v)))))); };
  // filled arc for the interior angle at b
  function angleArc(g, a, b, c, r, fill, stroke) {
    let a1 = angAt(b, a), a2 = angAt(b, c);
    if (((a2 - a1 + 360) % 360) > 180) [a1, a2] = [a2, a1];
    return s('path', { d: arcPath(b, r, a1, a2), fill, stroke: stroke || 'none', 'stroke-width': 1.5 }, g);
  }
  function ticks(g, p, q, n, col) {
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], L = dist(p, q) || 1, u = [(q[0] - p[0]) / L, (q[1] - p[1]) / L], nrm = [-u[1], u[0]];
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 5; s('line', { x1: m[0] + u[0] * o - nrm[0] * 7, y1: m[1] + u[1] * o - nrm[1] * 7, x2: m[0] + u[0] * o + nrm[0] * 7, y2: m[1] + u[1] * o + nrm[1] * 7, stroke: col || C.pink, 'stroke-width': 2.5 }, g); }
  }
  const sideLabel = (g, p, q, t, inside, col) => { const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], L = dist(p, q) || 1, nrm = [-(q[1] - p[1]) / L, (q[0] - p[0]) / L]; const k = inside ? -14 : 16; txt(g, m[0] + nrm[0] * k, m[1] + nrm[1] * k + 4, t, { 'font-size': 11, 'font-weight': 700, fill: col || '#334155' }); };

  /* ---------- 3-1: classify a triangle by its angles and sides ---------- */
  W.triClassify = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 230"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    let P = [[60, 190], [260, 190], [130, 50]];
    const names = ['A', 'B', 'C'], hs = P.map(() => handle(svg, C.orange));
    hs.forEach((h, i) => draggable(svg, h, (x, y) => { P[i] = [Math.round(Math.max(16, Math.min(304, x)) / 5) * 5, Math.round(Math.max(16, Math.min(214, y)) / 5) * 5]; draw(); }));
    function draw() {
      clear(layer);
      const ang = [angleAt(P[2], P[0], P[1]), angleAt(P[0], P[1], P[2]), angleAt(P[1], P[2], P[0])].map((v) => Math.round(v));
      const fix = 180 - ang[0] - ang[1] - ang[2]; ang[ang.indexOf(Math.max(...ang))] += fix;   // keep the sum exactly 180 after rounding
      const sides = [dist(P[1], P[2]), dist(P[2], P[0]), dist(P[0], P[1])].map((v) => v / 20);   // a=BC, b=CA, c=AB
      const eq = (x, y) => Math.abs(x - y) < 0.15;
      s('polygon', { points: P.map((p) => p.join(',')).join(' '), fill: '#ecfeff', stroke: C.teal, 'stroke-width': 3, 'stroke-linejoin': 'round' }, layer);
      P.forEach((p, i) => {
        const a = ang[i], col = a === 90 ? C.red : a > 90 ? C.orange : C.blue;
        angleArc(layer, P[(i + 2) % 3], p, P[(i + 1) % 3], 24, col === C.red ? 'rgba(220,38,38,.25)' : col === C.orange ? 'rgba(245,158,11,.3)' : 'rgba(29,78,216,.18)', col);
      });
      // equal sides get the same tick marks
      const pairs = [[1, 2], [2, 0], [0, 1]];
      const groups = [];
      sides.forEach((L, i) => { const g = groups.find((gr) => eq(sides[gr[0]], L)); if (g) g.push(i); else groups.push([i]); });
      let tk = 1;
      groups.forEach((gr) => { if (gr.length > 1) { gr.forEach((i) => ticks(layer, P[pairs[i][0]], P[pairs[i][1]], tk)); tk++; } });
      const cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
      P.forEach((p, i) => {
        const d = [p[0] - cx, p[1] - cy], L = Math.hypot(...d) || 1;
        txt(layer, p[0] + d[0] / L * 20, p[1] + d[1] / L * 20 + 5, names[i], italic());
        txt(layer, p[0] - d[0] / L * 40, p[1] - d[1] / L * 40 + 4, ang[i] + '°', { 'font-size': 11, 'font-weight': 800, fill: '#334155' });
        place(hs[i], p[0], p[1]);
      });
      pairs.forEach(([a, b], i) => sideLabel(layer, P[a], P[b], fmt(sides[i]), false));
      const mx = Math.max(...ang), byA = mx === 90 ? 'قائم الزاوية' : mx > 90 ? 'منفرج الزاوية' : ang.every((v) => v === 60) ? 'حاد الزوايا ومتطابق الزوايا' : 'حاد الزوايا';
      const n = Math.max(...groups.map((g) => g.length)), byS = n === 3 ? 'متطابق الأضلاع' : n === 2 ? 'متطابق الضلعين' : 'مختلف الأضلاع';
      ro.innerHTML = `<span class="pill">زواياه: ${ang.join('° + ')}° = 180°</span><span class="pill big ok">وفقًا لزواياه: ${byA}</span><span class="pill big" style="color:${C.pink}">وفقًا لأضلاعه: ${byS}</span>`;
    }
    draw();
  };

  /* ---------- 3-2: angle sum (auxiliary line) and the exterior angle ---------- */
  W.triAngles = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 220"></svg>
      <div class="chips" style="margin-top:6px"><button class="chip" data-m="aux" aria-pressed="true" style="color:var(--teal)"><span>المستقيم المساعد (مجموع الزوايا)</span></button><button class="chip" data-m="ext" aria-pressed="false" style="color:var(--purple)"><span>الزاوية الخارجية</span></button></div><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    let mode = 'aux', A = [120, 60];
    const B = [50, 180], Cc = [230, 180];
    const h = handle(svg, C.orange);
    draggable(svg, h, (x, y) => { A = [Math.max(30, Math.min(260, x)), Math.max(30, Math.min(150, y))]; draw(); });
    const colB = ['rgba(29,78,216,.25)', C.blue], colC = ['rgba(219,39,119,.25)', C.pink], colA = ['rgba(245,158,11,.35)', '#b45309'];
    function draw() {
      clear(layer);
      const aA = Math.round(angleAt(B, A, Cc)), aB = Math.round(angleAt(A, B, Cc)), aC = 180 - aA - aB;
      if (mode === 'aux') s('line', { x1: 6, x2: 314, y1: A[1], y2: A[1], stroke: C.teal, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, layer);
      else s('line', { x1: Cc[0], y1: Cc[1], x2: 314, y2: Cc[1], stroke: C.purple, 'stroke-width': 3, 'stroke-dasharray': '7 5' }, layer);
      angleArc(layer, A, B, Cc, 28, colB[0], colB[1]);
      angleArc(layer, B, Cc, A, 28, colC[0], colC[1]);
      angleArc(layer, B, A, Cc, 26, colA[0], colA[1]);
      if (mode === 'aux') {
        // the two angles on the auxiliary line equal ∠B and ∠C (alternate interior angles)
        s('path', { d: arcPath(A, 30, 180 - aB, 180), fill: colB[0], stroke: colB[1], 'stroke-width': 1.5 }, layer);
        s('path', { d: arcPath(A, 30, 0, aC), fill: colC[0], stroke: colC[1], 'stroke-width': 1.5 }, layer);
        txt(layer, A[0] - 44, A[1] - 6, aB + '°', { 'font-size': 11, 'font-weight': 800, fill: C.blue });
        txt(layer, A[0] + 44, A[1] - 6, aC + '°', { 'font-size': 11, 'font-weight': 800, fill: C.pink });
      } else {
        s('path', { d: arcPath(Cc, 22, 0, 180 - aC), fill: 'rgba(124,58,237,.25)', stroke: C.purple, 'stroke-width': 1.5 }, layer);
        txt(layer, Cc[0] + 36, Cc[1] - 18, (aA + aB) + '°', { 'font-size': 12, 'font-weight': 800, fill: C.purple });
      }
      s('polygon', { points: [A, B, Cc].map((p) => p.join(',')).join(' '), fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }, layer);
      txt(layer, A[0], A[1] + 34, aA + '°', { 'font-size': 11, 'font-weight': 800, fill: '#b45309' });
      txt(layer, B[0] + 40, B[1] - 8, aB + '°', { 'font-size': 11, 'font-weight': 800, fill: C.blue });
      txt(layer, Cc[0] - 40, Cc[1] - 8, aC + '°', { 'font-size': 11, 'font-weight': 800, fill: C.pink });
      [['A', A, 0, -14], ['B', B, -12, 16], ['C', Cc, -6, 18]].forEach(([n, p, dx, dy]) => txt(layer, p[0] + dx, p[1] + dy, n, italic()));
      place(h, A[0], A[1]);
      ro.innerHTML = mode === 'aux'
        ? `<span class="pill big ok"><span class="m">${aA}° + ${aB}° + ${aC}° = 180°</span></span><span class="pill">الزوايا الثلاث تكوّن زاوية مستقيمة على المستقيم المساعد (الموازي لـ <span class="m">BC</span>)</span>`
        : `<span class="pill big ok">الزاوية الخارجية = <span class="m">${aA}° + ${aB}° = ${aA + aB}°</span></span><span class="pill">تساوي مجموع الزاويتين الداخليتين البعيدتين</span>`;
      tex(ro);
    }
    el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.m; el.querySelectorAll('[data-m]').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); }));
    draw();
  };

  /* ---------- 3-3: write a correct congruence statement ---------- */
  W.congMatch = function (el) {
    const L1 = ['A', 'B', 'C'], L2 = ['H', 'J', 'K'];
    const T1 = [[30, 150], [70, 50], [140, 120]];
    // H↔A, J↔B, K↔C: an exact rotated copy of the first triangle
    const cg = [(T1[0][0] + T1[1][0] + T1[2][0]) / 3, (T1[0][1] + T1[1][1] + T1[2][1]) / 3], rot = 205 * Math.PI / 180;
    const T2 = T1.map(([x, y]) => [235 + (x - cg[0]) * Math.cos(rot) - (y - cg[1]) * Math.sin(rot), 105 + (x - cg[0]) * Math.sin(rot) + (y - cg[1]) * Math.cos(rot)]);
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 200"></svg>
      <div class="ctrl" style="justify-content:center;direction:ltr;font-family:Georgia,serif;font-size:18px"><b>△ABC ≅ △</b><select data-k="o"></select></div><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), sel = el.querySelector('select');
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    perms.forEach((p, i) => { const o = document.createElement('option'); o.value = i; o.textContent = p.map((k) => L2[k]).join(''); sel.appendChild(o); });
    sel.value = 1; sel.style.cssText = 'font:inherit;padding:4px 8px;border-radius:10px;border:2px solid var(--line)';
    const cols = [C.blue, C.pink, C.orange];
    function tri(T, names, sideCols, angCols) {
      s('polygon', { points: T.map((p) => p.join(',')).join(' '), fill: '#f8fafc', stroke: C.ink, 'stroke-width': 2.5 }, svg);
      [[0, 1], [1, 2], [2, 0]].forEach(([a, b], i) => s('line', { x1: T[a][0], y1: T[a][1], x2: T[b][0], y2: T[b][1], stroke: sideCols[i], 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .85 }, svg));
      T.forEach((p, i) => angleArc(svg, T[(i + 2) % 3], p, T[(i + 1) % 3], 18, angCols[i] + '55', angCols[i]));
      const cx = (T[0][0] + T[1][0] + T[2][0]) / 3, cy = (T[0][1] + T[1][1] + T[2][1]) / 3;
      T.forEach((p, i) => { const d = [p[0] - cx, p[1] - cy], L = Math.hypot(...d); txt(svg, p[0] + d[0] / L * 16, p[1] + d[1] / L * 16 + 5, names[i], italic()); });
    }
    function draw() {
      clear(svg);
      const p = perms[sel.value];                // A↔L2[p[0]], B↔L2[p[1]], C↔L2[p[2]]
      tri(T1, L1, cols, cols);
      // colour the second triangle by what the chosen statement claims corresponds
      const angCols2 = [0, 1, 2].map((k) => cols[p.indexOf(k)]);
      const sideCols2 = [[0, 1], [1, 2], [2, 0]].map(([a, b]) => { const i = [[0, 1], [1, 2], [2, 0]].findIndex(([x, y]) => (p[x] === a && p[y] === b) || (p[x] === b && p[y] === a)); return cols[i]; });
      tri(T2, L2, sideCols2, angCols2);
      const ok = p.join('') === '012';
      const corr = [0, 1, 2].map((i) => `<span class="m">∠${L1[i]} ≅ ∠${L2[p[i]]}</span>`).join('، ');
      ro.innerHTML = `<span class="pill">تعني العبارة: ${corr}</span><span class="pill big ${ok ? 'ok' : 'no'}">${ok ? '✓ عبارة صحيحة: الألوان المتماثلة متطابقة فعلًا' : '✗ عبارة غير صحيحة: قارن قياسات الزوايا ذات اللون نفسه'}</span>`;
      tex(ro);
    }
    sel.addEventListener('change', draw);
    draw();
  };

  /* ---------- 3-4 / 3-5: which given parts fix a triangle? ---------- */
  W.congTest = function (el) {
    el.insertAdjacentHTML('beforeend', `<div class="chips"></div><svg viewBox="0 0 320 210"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), chips = el.querySelector('.chips');
    const base = [[40, 170], [170, 170], [110, 70]];   // original triangle A, B, C
    const tests = {
      SSS: { ok: true, txt: 'ثلاثة أضلاع ← مثلث واحد فقط (المسلّمة 3.1)' },
      SAS: { ok: true, txt: 'ضلعان والزاوية المحصورة بينهما ← مثلث واحد فقط (المسلّمة 3.2)' },
      ASA: { ok: true, txt: 'زاويتان والضلع المحصور بينهما ← مثلث واحد فقط (المسلّمة 3.3)' },
      AAS: { ok: true, txt: 'زاويتان وضلع غير محصور ← مثلث واحد فقط (النظرية 3.5)' },
      SSA: { ok: false, txt: 'ضلعان وزاوية غير محصورة ← قد يوجد مثلثان مختلفان! لا يكفي' },
      AAA: { ok: false, txt: 'ثلاث زوايا ← مثلثات بالشكل نفسه وبأحجام مختلفة! لا يكفي' },
    };
    let cur = 'SSS';
    Object.keys(tests).forEach((k) => {
      const b = document.createElement('button'); b.className = 'chip'; b.style.color = tests[k].ok ? C.teal : C.red; b.innerHTML = `<span>${k}</span>`;
      b.addEventListener('click', () => { cur = k; chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); });
      chips.appendChild(b);
    });
    chips.firstChild.setAttribute('aria-pressed', 'true');
    const poly = (T, stroke, dash, fill) => s('polygon', { points: T.map((p) => p.join(',')).join(' '), fill: fill || 'none', stroke, 'stroke-width': 3, 'stroke-dasharray': dash || '', 'stroke-linejoin': 'round' }, svg);
    function marks(T, which) {
      const sides = { a: [1, 2], b: [2, 0], c: [0, 1] };
      which.forEach((w) => {
        if (sides[w]) { const [i, j] = sides[w]; s('line', { x1: T[i][0], y1: T[i][1], x2: T[j][0], y2: T[j][1], stroke: C.orange, 'stroke-width': 6, 'stroke-linecap': 'round' }, svg); }
        else { const i = { A: 0, B: 1, C: 2 }[w]; angleArc(svg, T[(i + 2) % 3], T[i], T[(i + 1) % 3], 20, 'rgba(124,58,237,.35)', C.purple); }
      });
    }
    function draw() {
      clear(svg);
      const shift = (T, dx) => T.map((p) => [p[0] + dx, p[1]]);
      const given = { SSS: ['a', 'b', 'c'], SAS: ['c', 'A', 'b'], ASA: ['A', 'c', 'B'], AAS: ['A', 'B', 'a'], SSA: ['c', 'a', 'A'], AAA: ['A', 'B', 'C'] }[cur];
      poly(base, C.ink, '', '#f8fafc'); marks(base, given);
      txt(svg, 105, 196, 'المثلث الأصلي', { 'font-size': 11, fill: C.muted });
      if (tests[cur].ok) {
        const T2 = shift(base, 140); poly(T2, C.teal, '', '#ecfdf5'); marks(T2, given);
        txt(svg, 245, 196, 'المثلث الوحيد الممكن', { 'font-size': 11, fill: C.teal });
      } else if (cur === 'SSA') {
        // same AB, same BC, same ∠A — but C can sit at two places on the ray from A
        const A2 = [180, 170], ang = angleAt(base[1], base[0], base[2]) * Math.PI / 180, ab = dist(base[0], base[1]), bc = dist(base[1], base[2]);
        const B2 = [A2[0] + ab, 170];
        const dir = [Math.cos(ang), -Math.sin(ang)];
        // solve |A2 + t·dir − B2| = bc
        const w = [A2[0] - B2[0], A2[1] - B2[1]], bq = 2 * (w[0] * dir[0] + w[1] * dir[1]), cq = w[0] ** 2 + w[1] ** 2 - bc ** 2;
        const disc = Math.sqrt(Math.max(0, bq * bq - 4 * cq)), t1 = (-bq - disc) / 2, t2 = (-bq + disc) / 2;
        const C1 = [A2[0] + t1 * dir[0], A2[1] + t1 * dir[1]], C2 = [A2[0] + t2 * dir[0], A2[1] + t2 * dir[1]];
        poly([A2, B2, C2], C.teal, '', '#ecfdf5'); poly([A2, B2, C1], C.red, '6 4');
        txt(svg, 245, 196, 'مثلثان مختلفان!', { 'font-size': 11, fill: C.red, 'font-weight': 700 });
      } else {
        const big = base.map((p) => [190 + (p[0] - 40) * 0.95, 170 - (170 - p[1]) * 0.95]), small = base.map((p) => [205 + (p[0] - 40) * 0.6, 170 - (170 - p[1]) * 0.6]);
        poly(big, C.teal, '', '#ecfdf5'); poly(small, C.red, '6 4');
        txt(svg, 250, 196, 'الزوايا نفسها، والحجم مختلف', { 'font-size': 11, fill: C.red, 'font-weight': 700 });
      }
      ro.innerHTML = `<span class="pill big ${tests[cur].ok ? 'ok' : 'no'}">${tests[cur].ok ? '✓' : '✗'} ${tests[cur].txt}</span><span class="pill">المعطيات مظللة: الأضلاع بالبرتقالي، والزوايا بالبنفسجي</span>`;
    }
    draw();
  };

  /* ---------- 3-6: isosceles triangle ---------- */
  W.isoTri = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 220"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const B = [70, 190], Cc = [250, 190];
    let A = [175, 60];
    const h = handle(svg, C.orange);
    draggable(svg, h, (x, y) => { A = [Math.max(30, Math.min(290, x)), Math.max(20, Math.min(160, y))]; if (Math.abs(A[0] - 160) < 6) A[0] = 160; draw(); });
    function draw() {
      clear(layer);
      const ab = dist(A, B) / 20, ac = dist(A, Cc) / 20, bc = dist(B, Cc) / 20, iso = Math.abs(ab - ac) < 0.08;
      const aB = Math.round(angleAt(A, B, Cc)), aC = Math.round(angleAt(A, Cc, B)), aA = 180 - aB - aC;
      if (iso) s('line', { x1: A[0], y1: A[1], x2: 160, y2: 190, stroke: C.muted, 'stroke-dasharray': '4 4' }, layer);
      angleArc(layer, A, B, Cc, 26, iso ? 'rgba(22,163,74,.3)' : 'rgba(29,78,216,.2)', iso ? C.green : C.blue);
      angleArc(layer, A, Cc, B, 26, iso ? 'rgba(22,163,74,.3)' : 'rgba(219,39,119,.2)', iso ? C.green : C.pink);
      angleArc(layer, B, A, Cc, 22, 'rgba(245,158,11,.3)', '#b45309');
      s('polygon', { points: [A, B, Cc].map((p) => p.join(',')).join(' '), fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }, layer);
      if (iso) { ticks(layer, A, B, 1); ticks(layer, A, Cc, 1); }
      sideLabel(layer, B, A, fmt(ab), false); sideLabel(layer, A, Cc, fmt(ac), false);
      txt(layer, B[0] + 42, B[1] - 8, aB + '°', { 'font-size': 12, 'font-weight': 800, fill: iso ? C.green : C.blue });
      txt(layer, Cc[0] - 42, Cc[1] - 8, aC + '°', { 'font-size': 12, 'font-weight': 800, fill: iso ? C.green : C.pink });
      txt(layer, A[0], A[1] + 36, aA + '°', { 'font-size': 12, 'font-weight': 800, fill: '#b45309' });
      place(h, A[0], A[1]);
      const eqAll = iso && Math.abs(ab - bc) < 0.1;
      ro.innerHTML = iso
        ? `<span class="pill big ok">✓ الساقان متطابقان ← زاويتا القاعدة متطابقتان: <span class="m">${aB}° = ${aC}°</span></span>` + (eqAll ? '<span class="pill ok">ومتطابق الأضلاع: كل زاوية 60°</span>' : '<span class="pill">زاوية الرأس هي الزاوية بين الساقين</span>')
        : `<span class="pill no">الساقان غير متطابقين (${fmt(ab)} ≠ ${fmt(ac)}) ← زاويتا القاعدة غير متطابقتين</span><span class="pill">اسحب الرأس إلى المنتصف ليتطابق الساقان</span>`;
      tex(ro);
    }
    draw();
  };

  /* ---------- 3-7: coordinate proof — the midsegment of a triangle ---------- */
  W.midsegment = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 260 260"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const G = grid(svg, 6, 260), layer = s('g', {}, svg);
    let Cc = [2, 5], Bx = 5;
    const hC = handle(svg, C.orange), hB = handle(svg, C.purple);
    draggable(svg, hC, (x, y) => { const q = G.inv(x, y); Cc = [Math.max(-6, Math.min(6, q[0])), Math.max(1, Math.min(6, q[1]))]; draw(); });
    draggable(svg, hB, (x) => { Bx = Math.max(2, Math.min(6, G.inv(x, 0)[0])); draw(); });
    function draw() {
      clear(layer);
      const A = [0, 0], B = [Bx, 0], S = [(A[0] + Cc[0]) / 2, (A[1] + Cc[1]) / 2], T = [(B[0] + Cc[0]) / 2, (B[1] + Cc[1]) / 2];
      const px = (p) => [G.X(p[0]), G.Y(p[1])];
      s('polygon', { points: [A, B, Cc].map(px).map((p) => p.join(',')).join(' '), fill: 'rgba(14,165,233,.12)', stroke: C.blue, 'stroke-width': 3 }, layer);
      s('line', { x1: px(S)[0], y1: px(S)[1], x2: px(T)[0], y2: px(T)[1], stroke: C.pink, 'stroke-width': 3.5 }, layer);
      [[S, 'S'], [T, 'T'], [A, 'A']].forEach(([p, n]) => { s('circle', { cx: px(p)[0], cy: px(p)[1], r: 4, fill: C.ink }, layer); txt(layer, px(p)[0] - 12, px(p)[1] - 8, n, italic()); });
      txt(layer, px(B)[0] + 4, px(B)[1] + 18, 'B', italic()); txt(layer, px(Cc)[0] + 14, px(Cc)[1] - 10, 'C', italic());
      place(hC, ...px(Cc)); place(hB, ...px(B));
      const f = (v) => fmt(v, 2);
      ro.innerHTML = `<span class="pill"><span class="m">S(${f(S[0])}, ${f(S[1])})</span> ، <span class="m">T(${f(T[0])}, ${f(T[1])})</span></span>` +
        `<span class="pill ok">ميل <span class="m">ST = 0</span> = ميل <span class="m">AB</span> ← <span class="m">ST ∥ AB</span></span>` +
        `<span class="pill big ok"><span class="m">ST = ${f(T[0] - S[0])}</span> = نصف <span class="m">AB = ${Bx}</span></span>`;
      tex(ro);
    }
    draw();
  };

  /* ===================== Chapter 4 ===================== */
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]], sub = (p, q) => [p[0] - q[0], p[1] - q[1]], mul = (p, k) => [p[0] * k, p[1] * k];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  // foot of the perpendicular from p to the line through a, b
  const foot = (p, a, b) => { const d = sub(b, a), t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2); return add(a, mul(d, t)); };
  // long line through p with direction d (clipped by the svg)
  const longLine = (g, p, d, attrs) => { const L = Math.hypot(...d) || 1, u = mul(d, 900 / L); return s('line', Object.assign({ x1: p[0] - u[0], y1: p[1] - u[1], x2: p[0] + u[0], y2: p[1] + u[1] }, attrs), g); };
  // small right-angle square at foot f, along directions u and v
  function rightMark(g, f, u, v, col) {
    const n = (w) => { const L = Math.hypot(...w) || 1; return mul(w, 9 / L); }, a = n(u), b = n(v);
    s('path', { d: `M${f[0] + a[0]},${f[1] + a[1]} L${f[0] + a[0] + b[0]},${f[1] + a[1] + b[1]} L${f[0] + b[0]},${f[1] + b[1]}`, fill: 'none', stroke: col || C.pink, 'stroke-width': 1.8 }, g);
  }
  const dot = (g, p, col, r) => s('circle', { cx: p[0], cy: p[1], r: r || 4.5, fill: col || C.ink, stroke: '#fff', 'stroke-width': 1.5 }, g);
  // vertex labels pushed away from the triangle's centre
  function vLabels(g, T, names) {
    const c = [(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3];
    T.forEach((p, i) => { const d = sub(p, c), L = Math.hypot(...d) || 1; txt(g, Math.max(10, Math.min(310, p[0] + d[0] / L * 20)), Math.max(14, p[1] + d[1] / L * 20 + 5), names[i], italic()); });
  }
  function dragTri(svg, P, box, draw) {
    const hs = P.map(() => handle(svg, C.orange));
    hs.forEach((h, i) => draggable(svg, h, (x, y) => { P[i] = [Math.max(box[0], Math.min(box[2], x)), Math.max(box[1], Math.min(box[3], y))]; draw(); }));
    return hs;
  }

  /* ---------- 4-1: points on a perpendicular bisector / an angle bisector ---------- */
  W.bisector = function (el) {
    const angle = el.dataset.mode === 'angle';
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 220"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const h = handle(svg, C.orange);
    const A = [70, 180], B = [250, 180], V = [40, 196], half = 26;      // angle mode: vertex V, sides at 0° and 52°
    const dirA = [1, 0], dirB = [Math.cos(2 * half * Math.PI / 180), -Math.sin(2 * half * Math.PI / 180)], dirM = [Math.cos(half * Math.PI / 180), -Math.sin(half * Math.PI / 180)];
    let P = angle ? add(V, mul(dirM, 170)) : [160, 70];
    draggable(svg, h, (x, y) => {
      P = [Math.max(14, Math.min(306, x)), Math.max(14, Math.min(angle ? 190 : 206, y))];
      if (angle) { const t = (P[0] - V[0]) * dirM[0] + (P[1] - V[1]) * dirM[1], q = add(V, mul(dirM, t)); if (t > 30 && dist(q, P) < 7) P = q; }
      else if (Math.abs(P[0] - 160) < 7) P[0] = 160;
      draw();
    });
    function draw() {
      clear(layer);
      if (!angle) {
        s('line', { x1: 160, y1: 6, x2: 160, y2: 214, stroke: C.teal, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, layer);
        s('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: C.ink, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, layer);
        rightMark(layer, [160, 180], [1, 0], [0, -1]); ticks(layer, A, [160, 180], 1); ticks(layer, [160, 180], B, 1);
        const pa = dist(P, A) / 20, pb = dist(P, B) / 20, on = Math.abs(P[0] - 160) < 0.5;
        s('line', { x1: P[0], y1: P[1], x2: A[0], y2: A[1], stroke: C.blue, 'stroke-width': 3 }, layer);
        s('line', { x1: P[0], y1: P[1], x2: B[0], y2: B[1], stroke: C.pink, 'stroke-width': 3 }, layer);
        sideLabel(layer, A, P, fmt(pa), false, C.blue); sideLabel(layer, P, B, fmt(pb), false, C.pink);
        dot(layer, A); dot(layer, B); dot(layer, [160, 180], C.teal, 3.5);
        txt(layer, A[0] - 4, A[1] + 22, 'A', italic()); txt(layer, B[0] + 4, B[1] + 22, 'B', italic()); txt(layer, 172, 198, 'M', italic({ 'font-size': 13 }));
        txt(layer, P[0] + 16, P[1] - 10, 'P', italic());
        ro.innerHTML = on
          ? `<span class="pill big ok">✓ <span class="m">P</span> على العمود المنصّف ← <span class="m">PA = PB = ${fmt(pa)}</span></span>`
          : `<span class="pill no"><span class="m">PA = ${fmt(pa)}</span> ، <span class="m">PB = ${fmt(pb)}</span> ← غير متساويين</span><span class="pill">أعد <span class="m">P</span> إلى المستقيم المتقطع</span>`;
      } else {
        s('line', { x1: V[0], y1: V[1], x2: V[0] + 300 * dirM[0], y2: V[1] + 300 * dirM[1], stroke: C.teal, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }, layer);
        [dirA, dirB].forEach((d) => s('line', { x1: V[0], y1: V[1], x2: V[0] + fit(V, angAt(V, add(V, d)), 320, 220, 6) * d[0], y2: V[1] + fit(V, angAt(V, add(V, d)), 320, 220, 6) * d[1], stroke: C.ink, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, layer));
        s('path', { d: arcPath(V, 40, 0, half), fill: 'rgba(29,78,216,.18)', stroke: C.blue, 'stroke-width': 1.5 }, layer);
        s('path', { d: arcPath(V, 44, half, 2 * half), fill: 'rgba(219,39,119,.18)', stroke: C.pink, 'stroke-width': 1.5 }, layer);
        // perpendiculars from P to both sides (feet clamped to the rays)
        const proj = (d) => { const t = Math.max(0, (P[0] - V[0]) * d[0] + (P[1] - V[1]) * d[1]); return add(V, mul(d, t)); };
        const F1 = proj(dirA), F2 = proj(dirB), d1 = dist(P, F1) / 20, d2 = dist(P, F2) / 20;
        const t = (P[0] - V[0]) * dirM[0] + (P[1] - V[1]) * dirM[1], on = t > 30 && dist(add(V, mul(dirM, t)), P) < 0.5;
        s('line', { x1: P[0], y1: P[1], x2: F1[0], y2: F1[1], stroke: C.blue, 'stroke-width': 3 }, layer);
        s('line', { x1: P[0], y1: P[1], x2: F2[0], y2: F2[1], stroke: C.pink, 'stroke-width': 3 }, layer);
        if (dist(P, F1) > 12) rightMark(layer, F1, sub(P, F1), dirA.map((v) => -v));
        if (dist(P, F2) > 12) rightMark(layer, F2, sub(P, F2), dirB.map((v) => -v));
        sideLabel(layer, F1, P, fmt(d1), false, C.blue); sideLabel(layer, P, F2, fmt(d2), false, C.pink);
        dot(layer, V); txt(layer, V[0] - 10, V[1] + 4, 'B', italic());
        txt(layer, P[0] + 16, P[1] - 8, 'P', italic());
        ro.innerHTML = on
          ? `<span class="pill big ok">✓ <span class="m">P</span> على منصّف الزاوية ← بُعداه عن الضلعين متساويان: <span class="m">${fmt(d1)} = ${fmt(d2)}</span></span>`
          : `<span class="pill no">البعدان: <span class="m">${fmt(d1)}</span> و <span class="m">${fmt(d2)}</span> ← غير متساويين</span><span class="pill">أعد <span class="m">P</span> إلى منصّف الزاوية (المتقطع)</span>`;
      }
      place(h, P[0], P[1]);
      tex(ro);
    }
    draw();
  };

  /* ---------- 4-1 / 4-2: the four points of concurrency ---------- */
  W.centers = function (el) {
    const M = {
      circ: { name: 'مركز الدائرة الخارجية', by: 'الأعمدة المنصفة', col: C.teal },
      inc: { name: 'مركز الدائرة الداخلية', by: 'منصفات الزوايا', col: C.purple },
      cent: { name: 'مركز المثلث', by: 'القطع المتوسطة', col: C.blue },
      orth: { name: 'ملتقى الارتفاعات', by: 'الارتفاعات', col: C.red },
    };
    const keys = (el.dataset.modes || 'circ,inc,cent,orth').split(',');
    let mode = el.dataset.mode || keys[0];
    el.insertAdjacentHTML('beforeend', `<div class="chips">${keys.map((k) => `<button class="chip" data-m="${k}" aria-pressed="${k === mode}" style="color:${M[k].col}"><span>${M[k].by}</span></button>`).join('')}</div><svg viewBox="0 0 320 250"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const P = [[50, 205], [275, 205], [120, 50]], names = ['A', 'B', 'C'];
    const hs = dragTri(svg, P, [16, 16, 304, 234], draw);
    function draw() {
      clear(layer);
      const [A, B, Cc] = P, col = M[mode].col, thin = { stroke: col, 'stroke-width': 1.8, opacity: .85 };
      const a = dist(B, Cc), b = dist(Cc, A), c = dist(A, B);
      const D = 2 * (A[0] * (B[1] - Cc[1]) + B[0] * (Cc[1] - A[1]) + Cc[0] * (A[1] - B[1]));
      if (Math.abs(D) < 200) { ro.innerHTML = '<span class="pill no">الرؤوس الثلاثة على استقامة واحدة تقريبًا! اسحب أحدها</span>'; s('polygon', { points: P.map((p) => p.join(',')).join(' '), fill: 'none', stroke: C.ink, 'stroke-width': 3 }, layer); P.forEach((p, i) => place(hs[i], ...p)); return; }
      const sq = (p) => p[0] ** 2 + p[1] ** 2;
      const O = [(sq(A) * (B[1] - Cc[1]) + sq(B) * (Cc[1] - A[1]) + sq(Cc) * (A[1] - B[1])) / D, (sq(A) * (Cc[0] - B[0]) + sq(B) * (A[0] - Cc[0]) + sq(Cc) * (B[0] - A[0])) / D];
      const angs = [angleAt(B, A, Cc), angleAt(A, B, Cc), angleAt(A, Cc, B)], mx = Math.max(...angs);
      const kind = Math.abs(mx - 90) < 1.5 ? 'right' : mx > 90 ? 'obtuse' : 'acute';
      let X, extra = '';
      s('polygon', { points: P.map((p) => p.join(',')).join(' '), fill: '#f8fafc', stroke: 'none' }, layer);
      if (mode === 'circ') {
        X = O;
        s('circle', { cx: O[0], cy: O[1], r: dist(O, A), fill: 'none', stroke: col, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: .7 }, layer);
        [[A, B], [B, Cc], [Cc, A]].forEach(([p, q]) => { const m = mid(p, q), d = sub(q, p); longLine(layer, m, [-d[1], d[0]], thin); rightMark(layer, m, d, [-d[1], d[0]], col); ticks(layer, p, m, 1, col); ticks(layer, m, q, 1, col); });
        [A, B, Cc].forEach((p) => s('line', { x1: X[0], y1: X[1], x2: p[0], y2: p[1], stroke: C.orange, 'stroke-width': 2, 'stroke-dasharray': '3 3' }, layer));
        extra = `<span class="pill ok"><span class="m">PA = PB = PC = ${fmt(dist(O, A) / 20)}</span></span>`;
      } else if (mode === 'inc') {
        X = [(a * A[0] + b * B[0] + c * Cc[0]) / (a + b + c), (a * A[1] + b * B[1] + c * Cc[1]) / (a + b + c)];
        const r = Math.abs((B[0] - A[0]) * (Cc[1] - A[1]) - (Cc[0] - A[0]) * (B[1] - A[1])) / (a + b + c);
        s('circle', { cx: X[0], cy: X[1], r, fill: 'none', stroke: col, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: .7 }, layer);
        P.forEach((p) => s('line', { x1: p[0], y1: p[1], x2: X[0] + (X[0] - p[0]) * .25, y2: X[1] + (X[1] - p[1]) * .25, stroke: col, 'stroke-width': 1.8 }, layer));
        [[A, B], [B, Cc], [Cc, A]].forEach(([p, q]) => { const f = foot(X, p, q); s('line', { x1: X[0], y1: X[1], x2: f[0], y2: f[1], stroke: C.orange, 'stroke-width': 2, 'stroke-dasharray': '3 3' }, layer); rightMark(layer, f, sub(X, f), sub(q, p), col); });
        // the two equal halves of each angle
        P.forEach((p, i) => { const h1 = angleAt(P[(i + 1) % 3], p, X), th = angAt(p, X); s('path', { d: arcPath(p, 20, th - h1, th), fill: 'none', stroke: col, 'stroke-width': 1.3 }, layer); s('path', { d: arcPath(p, 23, th, th + h1), fill: 'none', stroke: col, 'stroke-width': 1.3 }, layer); });
        extra = `<span class="pill ok">بُعده عن الأضلاع الثلاثة متساوٍ: <span class="m">${fmt(r / 20)}</span></span>`;
      } else if (mode === 'cent') {
        X = [(A[0] + B[0] + Cc[0]) / 3, (A[1] + B[1] + Cc[1]) / 3];
        P.forEach((p, i) => { const q = P[(i + 1) % 3], o = P[(i + 2) % 3], m = mid(q, o); s('line', { x1: p[0], y1: p[1], x2: m[0], y2: m[1], stroke: col, 'stroke-width': 2 }, layer); ticks(layer, q, m, i + 1, C.pink); ticks(layer, m, o, i + 1, C.pink); dot(layer, m, col, 3); });
        const K = mid(A, B);   // median from C
        s('line', { x1: Cc[0], y1: Cc[1], x2: X[0], y2: X[1], stroke: C.orange, 'stroke-width': 4, opacity: .8 }, layer);
        txt(layer, K[0], K[1] + 18, 'K', italic({ 'font-size': 13 }));
        const cp = dist(Cc, X) / 20, ck = dist(Cc, K) / 20;
        extra = `<span class="pill ok"><span class="m">CK = ${fmt(ck)}</span> ، <span class="m">CP = ${fmt(cp)}</span> ← <span class="m">CP</span> ثلثا <span class="m">CK</span></span><span class="pill"><span class="m">CP : PK = 2 : 1</span></span>`;
      } else {
        X = sub(add(add(A, B), Cc), mul(O, 2));      // H = A + B + C − 2·O
        P.forEach((p, i) => {
          const q = P[(i + 1) % 3], o = P[(i + 2) % 3], f = foot(p, q, o), d = sub(o, q);
          longLine(layer, p, sub(f, p).every((v) => Math.abs(v) < .01) ? [-d[1], d[0]] : sub(f, p), { stroke: col, 'stroke-width': 1.3, opacity: .45, 'stroke-dasharray': '4 4' });
          s('line', { x1: p[0], y1: p[1], x2: f[0], y2: f[1], stroke: col, 'stroke-width': 2 }, layer);
          // extend the opposite side when the foot falls outside it
          const t = ((f[0] - q[0]) * d[0] + (f[1] - q[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2);
          if (t < 0 || t > 1) s('line', { x1: t < 0 ? q[0] : o[0], y1: t < 0 ? q[1] : o[1], x2: f[0], y2: f[1], stroke: C.ink, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, layer);
          if (dist(p, f) > 12) rightMark(layer, f, sub(p, f), t > 0.5 ? mul(d, -1) : d, col);
        });
        extra = `<span class="pill">الارتفاع عمودي على الضلع المقابل (أو امتداده)</span>`;
      }
      s('polygon', { points: P.map((p) => p.join(',')).join(' '), fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linejoin': 'round' }, layer);
      // where is the point?
      const sgn = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      const s1 = sgn(A, B, X), s2 = sgn(B, Cc, X), s3 = sgn(Cc, A, X), tol = 300;
      const onEdge = [s1, s2, s3].some((v) => Math.abs(v) < tol * 2) && kind === 'right';
      const inside = (s1 > 0 && s2 > 0 && s3 > 0) || (s1 < 0 && s2 < 0 && s3 < 0);
      const where = onEdge ? (mode === 'orth' ? 'على رأس الزاوية القائمة' : 'على أحد الأضلاع (منتصف الوتر)') : inside ? 'داخل المثلث' : 'خارج المثلث';
      if (X[0] > -20 && X[0] < 340 && X[1] > -20 && X[1] < 270) { dot(layer, X, C.orange, 6); txt(layer, X[0] + 13, X[1] - 9, 'P', italic({ fill: '#b45309' })); }
      vLabels(layer, P, names);
      P.forEach((p, i) => place(hs[i], ...p));
      const kname = { acute: 'حاد الزوايا', right: 'قائم الزاوية', obtuse: 'منفرج الزاوية' }[kind];
      ro.innerHTML = `<span class="pill big" style="color:${col}">${M[mode].by} تتلاقى في <b>${M[mode].name}</b> <span class="m">P</span></span>${extra}<span class="pill ${inside || onEdge ? 'ok' : 'no'}">المثلث ${kname} ← <span class="m">P</span> ${where}</span>`;
      tex(ro);
    }
    el.querySelectorAll('[data-m]').forEach((bt) => bt.addEventListener('click', () => { mode = bt.dataset.m; el.querySelectorAll('[data-m]').forEach((x) => x.setAttribute('aria-pressed', x === bt)); draw(); }));
    draw();
  };

  /* ---------- 4-3: the longest side is opposite the largest angle ---------- */
  W.sideAngle = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 230"></svg><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout'), layer = s('g', {}, svg);
    const P = [[45, 195], [285, 195], [110, 55]], names = ['A', 'B', 'C'];
    const hs = dragTri(svg, P, [16, 16, 304, 214], draw);
    const rankCol = [[C.blue, 'rgba(29,78,216,.22)', 'الأصغر'], [C.orange, 'rgba(245,158,11,.3)', 'الأوسط'], [C.pink, 'rgba(219,39,119,.25)', 'الأكبر']];
    function draw() {
      clear(layer);
      const ang = [angleAt(P[2], P[0], P[1]), angleAt(P[0], P[1], P[2]), angleAt(P[1], P[2], P[0])];
      const deg0 = ang.map((v) => Math.round(v)); deg0[deg0.indexOf(Math.max(...deg0))] += 180 - deg0[0] - deg0[1] - deg0[2];
      const order = [0, 1, 2].sort((i, j) => ang[i] - ang[j]), rank = []; order.forEach((v, r) => { rank[v] = r; });
      const opp = [[1, 2], [2, 0], [0, 1]];   // side opposite vertex i
      s('polygon', { points: P.map((p) => p.join(',')).join(' '), fill: '#f8fafc', stroke: 'none' }, layer);
      opp.forEach(([a, b], i) => s('line', { x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1], stroke: rankCol[rank[i]][0], 'stroke-width': 5, 'stroke-linecap': 'round' }, layer));
      P.forEach((p, i) => angleArc(layer, P[(i + 2) % 3], p, P[(i + 1) % 3], 24, rankCol[rank[i]][1], rankCol[rank[i]][0]));
      const cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
      P.forEach((p, i) => { const d = sub(p, [cx, cy]), L = Math.hypot(...d) || 1; txt(layer, p[0] - d[0] / L * 40, p[1] - d[1] / L * 40 + 4, deg0[i] + '°', { 'font-size': 11, 'font-weight': 800, fill: rankCol[rank[i]][0] }); });
      opp.forEach(([a, b], i) => sideLabel(layer, P[a], P[b], fmt(dist(P[a], P[b]) / 20), false, rankCol[rank[i]][0]));
      vLabels(layer, P, names);
      P.forEach((p, i) => place(hs[i], ...p));
      const sideName = (i) => names[opp[i][0]] + names[opp[i][1]];
      ro.innerHTML = `<span class="pill">الزوايا من الأصغر إلى الأكبر: <span class="m">${order.map((i) => '∠' + names[i]).join(' , ')}</span></span>` +
        `<span class="pill">الأضلاع المقابلة لها: <span class="m">${order.map(sideName).join(' , ')}</span></span>` +
        `<span class="pill big ok">أكبر زاوية <span class="m">∠${names[order[2]]}</span> تقابل أطول ضلع <span class="m">${sideName(order[2])}</span> (اللون نفسه)</span>`;
      tex(ro);
    }
    draw();
  };

  /* ---------- 4-5: can three lengths make a triangle? ---------- */
  W.triIneq = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 200"></svg>
      <div class="ctrl"><label style="color:var(--blue)">a</label><input type="range" min="1" max="12" value="5" data-k="a"><output></output></div>
      <div class="ctrl"><label style="color:var(--pink,#db2777)">b</label><input type="range" min="1" max="12" value="7" data-k="b"><output></output></div>
      <div class="ctrl"><label>c</label><input type="range" min="1" max="12" value="9" data-k="c"><output></output></div><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const inp = {}; el.querySelectorAll('input[data-k]').forEach((r) => { inp[r.dataset.k] = r; r.addEventListener('input', draw); });
    function draw() {
      el.querySelectorAll('input[data-k]').forEach((r) => { r.nextElementSibling.textContent = r.value; });
      clear(svg);
      const a = +inp.a.value, b = +inp.b.value, c = +inp.c.value, k = Math.min(20, 280 / Math.max(c, 1));
      const A = [160 - c * k / 2, 178], B = [160 + c * k / 2, 178];
      // compass arcs: radius b around A, radius a around B
      s('path', { d: `M${A[0] + b * k},${A[1]} A${b * k},${b * k} 0 0 0 ${A[0] - b * k},${A[1]}`, fill: 'none', stroke: '#db2777', 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: .6 }, svg);
      s('path', { d: `M${B[0] + a * k},${B[1]} A${a * k},${a * k} 0 0 0 ${B[0] - a * k},${B[1]}`, fill: 'none', stroke: C.blue, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: .6 }, svg);
      s('line', { x1: A[0], y1: A[1], x2: B[0], y2: B[1], stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      txt(svg, 160, 196, 'c = ' + c, italic({ 'font-size': 13 }));
      const ok = a + b > c && a + c > b && b + c > a;
      if (ok) {
        const x = (b * b - a * a + c * c) / (2 * c), y = Math.sqrt(Math.max(0, b * b - x * x));
        const Cc = [A[0] + x * k, A[1] - y * k];
        s('polygon', { points: [A, B, Cc].map((p) => p.join(',')).join(' '), fill: 'rgba(22,163,74,.12)', stroke: 'none' }, svg);
        s('line', { x1: A[0], y1: A[1], x2: Cc[0], y2: Cc[1], stroke: '#db2777', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
        s('line', { x1: B[0], y1: B[1], x2: Cc[0], y2: Cc[1], stroke: C.blue, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
        dot(svg, Cc, C.green, 5);
      } else {
        // lay the two sides along their arcs, pointing at each other, to show the gap
        const ga = Math.PI * 0.3;
        s('line', { x1: A[0], y1: A[1], x2: A[0] + b * k * Math.cos(ga), y2: A[1] - b * k * Math.sin(ga), stroke: '#db2777', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
        s('line', { x1: B[0], y1: B[1], x2: B[0] - a * k * Math.cos(ga), y2: B[1] - a * k * Math.sin(ga), stroke: C.blue, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      }
      [A, B].forEach((p) => dot(svg, p));
      const row = (l, r, x) => { const g = l > r; return `<span class="pill ${g ? 'ok' : 'no'}"><span class="m">${x} = ${l} ${g ? '&gt;' : '≯'} ${r}</span> ${g ? '✓' : '✗'}</span>`; };
      ro.innerHTML = row(a + b, c, 'a + b') + row(a + c, b, 'a + c') + row(b + c, a, 'b + c') +
        `<span class="pill big ${ok ? 'ok' : 'no'}">${ok ? '✓ تتحقق المتباينات الثلاث ← تكوّن مثلثًا' : '✗ القوسان لا يلتقيان ← لا تكوّن مثلثًا'}</span>`;
      tex(ro);
    }
    draw();
  };

  /* ---------- 4-6: the hinge theorem (SAS inequality) ---------- */
  W.hinge = function (el) {
    el.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 320 200"></svg>
      <div class="ctrl"><label>∠A</label><input type="range" min="15" max="165" value="95"><output></output></div><div class="readout"></div>`);
    const svg = el.querySelector('svg'), ro = el.querySelector('.readout');
    const A = [150, 170], AB = 5, AC = 4, k = 30, ref = 60;
    const Bp = [A[0] + AB * k, A[1]];
    const third = (t) => Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos(t * Math.PI / 180));
    range(el, (t) => {
      clear(svg);
      const Cr = [A[0] + AC * k * Math.cos(ref * Math.PI / 180), A[1] - AC * k * Math.sin(ref * Math.PI / 180)];
      const Cc = [A[0] + AC * k * Math.cos(t * Math.PI / 180), A[1] - AC * k * Math.sin(t * Math.PI / 180)];
      // reference triangle (fixed 60°), dashed
      s('polygon', { points: [A, Bp, Cr].map((p) => p.join(',')).join(' '), fill: 'none', stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);
      s('path', { d: arcPath(A, 26, 0, t), fill: t > ref ? 'rgba(219,39,119,.22)' : 'rgba(29,78,216,.2)', stroke: t > ref ? C.pink : C.blue, 'stroke-width': 1.5 }, svg);
      s('polygon', { points: [A, Bp, Cc].map((p) => p.join(',')).join(' '), fill: 'rgba(14,165,233,.08)', stroke: 'none' }, svg);
      s('line', { x1: A[0], y1: A[1], x2: Bp[0], y2: Bp[1], stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      s('line', { x1: A[0], y1: A[1], x2: Cc[0], y2: Cc[1], stroke: C.ink, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      s('line', { x1: Bp[0], y1: Bp[1], x2: Cc[0], y2: Cc[1], stroke: C.orange, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, svg);
      ticks(svg, A, Bp, 1, C.pink); ticks(svg, A, Cc, 2, C.pink);
      txt(svg, A[0] + AB * k * .72, A[1] + 20, '5', { 'font-size': 12, 'font-weight': 700, fill: '#334155' }); sideLabel(svg, Cc, A, '4', false);
      txt(svg, A[0] + 34 * Math.cos(t * Math.PI / 360), A[1] - 34 * Math.sin(t * Math.PI / 360) + 4, t + '°', { 'font-size': 11, 'font-weight': 800, fill: t > ref ? C.pink : C.blue });
      txt(svg, Cr[0] + 10, Cr[1] - 6, '60°', { 'font-size': 10, fill: C.muted });
      dot(svg, Cc, C.orange); dot(svg, A); dot(svg, Bp);
      txt(svg, A[0] - 4, A[1] + 16, 'A', italic({ 'font-size': 13 })); txt(svg, Bp[0] + 4, Bp[1] + 16, 'B', italic({ 'font-size': 13 })); txt(svg, Cc[0] + (t > 90 ? -12 : 12), Cc[1] - 8, 'C', italic({ 'font-size': 13 }));
      const bc = third(t), br = third(ref), cmp = t > ref ? '&gt;' : t < ref ? '&lt;' : '=';
      ro.innerHTML = `<span class="pill">الضلعان ثابتان: <span class="m">AB = 5</span> ، <span class="m">AC = 4</span></span>` +
        `<span class="pill big ${t === ref ? '' : 'ok'}"><span class="m">${t}° ${cmp} 60°</span> ← <span class="m">BC = ${fmt(bc, 2)} ${cmp} ${fmt(br, 2)}</span></span>` +
        `<span class="pill">كلما كبرت الزاوية المحصورة، طال الضلع الثالث (البرتقالي)</span>`;
      tex(ro);
    });
  };

  /* ---------- 4-4: choose the right assumption for an indirect proof ---------- */
  const m_ = (x) => `<span class="m">${x}</span>`;
  const ASSUME = {
    c4: [
      [m_('∠ABC ≇ ∠XYZ'), [m_('∠ABC ≅ ∠XYZ'), m_('m∠ABC &gt; m∠XYZ'), m_('∠ABC ≇ ∠XYZ')], 0, 'نقيض «غير متطابقتين» هو «متطابقتان».'],
      [m_('x &gt; 5'), [m_('x &lt; 5'), m_('x ≤ 5'), m_('x ≥ 5')], 1, `نقيض ${m_('x &gt; 5')} يشمل المساواة: ${m_('x ≤ 5')}.`],
      [m_('∠3') + ' زاوية منفرجة', [m_('∠3') + ' حادة', m_('∠3') + ' قائمة', m_('∠3') + ' ليست منفرجة'], 2, 'إذا لم تكن منفرجة فقد تكون حادة أو قائمة؛ لذا نفترض «ليست منفرجة».'],
      [m_('△XYZ') + ' متطابق الأضلاع', [m_('△XYZ') + ' مختلف الأضلاع', m_('△XYZ') + ' ليس متطابق الأضلاع', m_('△XYZ') + ' متطابق الضلعين'], 1, 'النفي هو «ليس متطابق الأضلاع» (فقد يكون متطابق الضلعين أو مختلف الأضلاع).'],
      ['إذا كان ' + m_('7x &gt; 56') + ' ، فإن ' + m_('x &gt; 8'), [m_('7x ≤ 56'), m_('x ≤ 8'), m_('x &lt; 8')], 1, 'نفترض نفي النتيجة ' + m_('x &gt; 8') + ' ، أي ' + m_('x ≤ 8') + ' ، ونبقي المعطى صحيحًا.'],
    ],
  };
  W.assumeQuiz = function (el) {
    const items = ASSUME[el.dataset.set];
    el.insertAdjacentHTML('beforeend', `<div class="aq"></div><div class="readout"></div>`);
    const box = el.querySelector('.aq'), ro = el.querySelector('.readout');
    let right = 0;
    items.forEach(([st, opts, ans, why], i) => {
      const d = document.createElement('div');
      d.style.cssText = 'margin:8px 0;padding:8px;border:1px dashed var(--line);border-radius:12px';
      d.innerHTML = `<div style="margin-bottom:6px">${i + 1}) العبارة: ${st} ← الافتراض هو:</div><div class="chips">${opts.map((o, j) => `<button class="chip" data-j="${j}" style="color:var(--blue)"><span>${o}</span></button>`).join('')}</div><div class="fbk" style="margin-top:6px;font-size:14px"></div>`;
      let done = false;
      d.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
        const ok = +b.dataset.j === ans;
        b.style.color = ok ? C.green : C.red; b.setAttribute('aria-pressed', 'true');
        d.querySelector('.fbk').innerHTML = (ok ? '✓ صحيح. ' : '✗ ليس هذا. ') + why;
        if (ok && !done) { done = true; right++; ro.innerHTML = `<span class="pill ${right === items.length ? 'big ok' : ''}">${right === items.length ? '🎉 ممتاز! أتقنت صياغة الافتراض' : `صحيح: ${right} من ${items.length}`}</span>`; }
        tex(d);
      }));
      box.appendChild(d);
    });
    tex(box);
  };

  document.querySelectorAll('[data-widget]').forEach((el) => {
    const f = W[el.dataset.widget];
    if (f) { try { f(el); } catch (e) { console.error('widget', el.dataset.widget, e); } }
  });
})();
