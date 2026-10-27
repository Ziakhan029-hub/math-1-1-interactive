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

  function convert(root) {
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
