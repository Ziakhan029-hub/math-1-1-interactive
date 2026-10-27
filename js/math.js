/* ===== Math rendering with MathJax.
   The HTML keeps readable Unicode math (works offline); once MathJax loads, every .m element
   (and .num elements that hold an equation) is converted to TeX and typeset. ===== */
(function () {
  const MAP = [
    [/\.{3,}|…/g, '\\ldots '],
    [/∧/g, '\\land '], [/∨/g, '\\lor '], [/~/g, '{\\sim}'],
    [/≯/g, '\\not> '], [/≅/g, '\\cong '], [/∠/g, '\\angle '],
    [/≈/g, '\\approx '], [/×/g, '\\times '], [/÷/g, '\\div '],
    [/[−–]/g, '-'], [/²/g, '^{2}'], [/ⁿ/g, '^{n}'], [/°/g, '^{\\circ}'],
  ];

  function toTex(text) {
    let t = text.trim().replace(/\b([a-z]{2,})\b/g, '\\,\\text{$1}');   // units like cm, km
    MAP.forEach(([re, rep]) => { t = t.replace(re, rep); });
    return t;
  }

  // a .num is an equation only if it has an operator and is not a time, lesson number or Arabic text
  const isEquation = (s) => /[=+×²÷≈]|[−-]\d/.test(s) && !/[:؀-ۿ]/.test(s) && !/^\d-\d$/.test(s.trim());

  /* MathJax cannot line-break, so a long equation is split before relations (=, ≅, >, …) and after
     top-level commas into pieces inside one LTR wrapper; the line may then wrap between pieces. */
  function splitLong(root) {
    root.querySelectorAll('.m:not(.tex)').forEach((el) => {
      const s = el.textContent;
      if (s.length < 20 || el.closest('svg, .widget, .pg-foot')) return;
      const top = (test) => { let d = 0; return [...s].some((ch) => { if ('([{'.includes(ch)) d++; if (')]}'.includes(ch)) d--; return d === 0 && test(ch); }); };
      const byComma = top((ch) => ch === ',' || ch === '،');   // a list splits only at its commas
      const parts = []; let cur = '', depth = 0;
      for (const ch of s) {
        if ('([{'.includes(ch)) depth++;
        if (')]}'.includes(ch)) depth--;
        if (!byComma && depth === 0 && '=≅≈><≤≥≠'.includes(ch) && cur.trim()) { parts.push(cur); cur = ''; }
        cur += ch;
        if (byComma && depth === 0 && (ch === ',' || ch === '،')) { parts.push(cur); cur = ''; }
      }
      parts.push(cur);
      const ps = parts.map((x) => x.trim()).filter(Boolean);
      if (ps.length < 2) return;
      const wrap = document.createElement('span');
      wrap.className = 'm-wrap'; wrap.dir = 'ltr';
      ps.forEach((x, i) => {
        const piece = document.createElement('span');
        piece.className = el.className; piece.textContent = x;
        if (i) wrap.append(' ');
        wrap.append(piece);
      });
      el.replaceWith(wrap);
    });
  }

  function convert(root) {
    splitLong(root);
    const els = [...root.querySelectorAll('.m, .num')].filter((el) =>
      !el.classList.contains('tex') &&
      !el.closest('svg, .pg-foot, .page-ind, .brand, option') &&
      (el.classList.contains('m') || isEquation(el.textContent)));
    els.forEach((el) => {
      el.textContent = '\\(' + toTex(el.textContent) + '\\)';
      el.classList.add('tex');
    });
    return els;
  }

  /* Live labels inside widgets change constantly (while dragging, on every slider move), so they
     are converted synchronously with tex2chtml; results are cached by TeX string. */
  const cache = new Map();
  let ready = false, styleQueued = false;
  function refreshStyles() {
    if (styleQueued) return;
    styleQueued = true;
    requestAnimationFrame(() => {
      styleQueued = false;
      const doc = MathJax.startup.document;
      doc.clear(); doc.updateDocument();
    });
  }
  window.renderMath = function (root) {
    if (!ready || !root) return;
    let fresh = false;
    root.querySelectorAll('.m:not(.tex)').forEach((el) => {
      if (el.closest('svg, option')) return;
      const tex = toTex(el.textContent);
      let node = cache.get(tex);
      if (!node) {
        try { node = MathJax.tex2chtml(tex, { display: false }); } catch (e) { return; }
        cache.set(tex, node); fresh = true;
      }
      el.replaceChildren(node.cloneNode(true));
      el.classList.add('tex');
    });
    if (fresh) refreshStyles();
  };

  window.MathJax = {
    tex: { inlineMath: [['\\(', '\\)']] },
    chtml: { scale: 1.08, mtextInheritFont: true },
    options: { enableMenu: false },
    startup: {
      typeset: false,
      ready() {
        MathJax.startup.defaultReady();
        const els = convert(document);
        MathJax.typesetPromise(els).then(() => { ready = true; })
          .catch((e) => console.error('MathJax', e));
      },
    },
  };
})();
