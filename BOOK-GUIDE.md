# Interactive Book Guide — الرياضيات 1-1

Ye file is kitab ke har naye chapter ke liye **rulebook** hai, taa ke saare chapters ek jaise dikhen aur chalen.
Naya chapter banane se pehle ye poori file parh lein.

- **Source book:** `../45458adb-8680-4f9c-9762-850ebfcdd39e.pdf` (Saudi Math 1-1, 274 pages, Arabic)
- **Printed page number = PDF page number** (e.g. book page 12 = PDF page 12)
- **Language:** Arabic, right-to-left (RTL), same as the book. Extra UI text (hints, buttons) is also in Arabic.

---

## 1. Folder structure

```
interactive-book/
├── index.html          ← home page: book cover + all chapters linked
├── chapter-1.html      ← one file per chapter (chapter-2.html, chapter-3.html …)
├── css/
│   ├── book.css        ← shared styles for every chapter (don't copy per chapter)
│   └── home.css        ← home page only
├── js/
│   ├── book.js         ← page-curl engine, navigation, solutions, answer checks
│   ├── widgets.js      ← all interactive tools (data-widget="…")
│   └── math.js         ← MathJax setup + Unicode → TeX conversion
├── BOOK-GUIDE.md       ← this file
└── CLAUDE.md           ← points Claude Code to this file
```

**Rule:** CSS and JS are shared. A chapter file contains only HTML content. A new widget goes into `js/widgets.js` (never inline in a chapter), so every chapter can use it.

---

## 2. Adding a new chapter (checklist)

1. Copy `chapter-1.html` to `chapter-N.html`.
2. Change `<title>` and `<body data-chapter="N">` (the number is used to save progress).
3. Delete all `<section class="page">` blocks inside `#book` and write the new chapter's pages (templates in section 4).
4. Change the chapter name in `.brand` in the topbar.
5. In `index.html`'s `CHAPTERS` array, set that chapter's `file: 'chapter-N.html'` and add `true` to ready lessons, e.g. `['2-1', 'المستقيمات والقاطع', true]`.
6. On the chapter's last page, link "next chapter" to `chapter-(N+1).html` (or mark it «قريبًا» if not ready yet).
7. Test (section 9).

### Chapter → PDF pages

| Chapter | Name | Book pages |
|---|---|---|
| 1 | التبرير والبرهان | 10 – 83 (التهيئة 11، 1-1 = 12، 1-2 = 19، 1-3 = 26، 1-4 = 37، 1-5 = 45، 1-6 = 53، 1-7 = 60، 1-8 = 66) |
| 2 | التوازي والتعامد | 84 – 143 (2-1 = 86، 2-2 = 94، 2-3 = 102، 2-4 = 109، 2-5 = 117، 2-6 = 126) |
| 3 | المثلثات المتطابقة | 144 – 211 (3-1 = 146، 3-2 = 154، 3-3 = 162، 3-4 = 170، 3-5 = 179، 3-6 = 188، 3-7 = 196) |
| 4 | العلاقات في المثلث | 212 – 274 (4-1 = 215، 4-2 = 225، 4-3 = 233، 4-4 = 241، 4-5 = 249، 4-6 = 255) |

Reading the PDF: render the pages as images (`pdftoppm -f 86 -l 93 -r 90 -jpeg …`) and look at them. Arabic text extraction (`pdftotext`) gets garbled.

---

## 3. Content order within a chapter

Keep the book's order:

1. **Chapter cover** (page 0): `.cover-full` design; only the title changes
2. **How to use** (page 1): same in every chapter
3. **Chapter contents** (page 2): lesson list, `data-goto` = page index of each lesson
4. For each lesson:
   - Lesson intro page: `.lesson-head` + فيما سبق / والآن + لماذا؟ + definitions + المفردات
   - One page per مثال (example): the example + an interactive widget + «تحقق من فهمك» on the same page
   - تأكد / تدرب وحل المسائل exercises page
5. **ملخص المفهوم** (concept summary) + final page (link to the home page and the next chapter)

**Page size:** a page shouldn't get too long. On a phone, 2–3 screens of scroll at most. If it's longer, split it into two pages.

**Page index:** `data-goto="10"` means the 11th `<section class="page">` (counting from 0). If you add or remove a page, update the `data-goto` values on the contents page.

---

## 4. HTML templates

### Page shell (every page)
```html
<section class="page" data-title="مثال 1: الأنماط والتخمين">
  <div class="face front"><div class="scroll"><div class="pg">
    … content …
  </div></div><button class="curl" data-next aria-label="الصفحة التالية"></button><div class="pg-foot"><span>الدرس <span class="num">2-1</span> · المستقيمات والقاطع</span><b class="pno"></b></div></div>
  <div class="face back"></div>
</section>
```
- `data-title` shows up in the contents drawer (☰).
- `.pno` gets the page number automatically.
- Remove `.curl` from the last page.

### Lesson header
```html
<div class="lesson-head">
  <div class="no">2-1</div>
  <h1>المستقيمات والقاطع</h1>
  <div class="en">Lines and Transversals</div>
</div>
<div class="side-grid">
  <div class="mini before"><h4>فيما سبق</h4>…</div>
  <div class="mini now"><h4>والآن</h4><ul><li>…</li></ul></div>
</div>
```

### Boxes
| Purpose | Class |
|---|---|
| لماذا؟ | `<div class="card why"><h3>لماذا؟</h3>…</div>` |
| Definition / key concept | `<div class="card def"><h3>…</h3>…</div>` |
| Vocabulary word highlight | `<span class="hl">التخمين</span>` |
| المفردات list | `<div class="vocab"><span><b>العبارة</b><i>statement</i></span>…</div>` |
| إرشادات للدراسة / ربط المفردات | `<div class="card tip"><h4>…</h4>…</div>` |
| تنبيه / تاريخ الرياضيات | `<div class="card tip warn"><h4>…</h4>…</div>` |
| مثال | see below |
| تحقق من فهمك | `<div class="card check"><h3>تحقق من فهمك</h3>…</div>` |
| تأكد / تدرب وحل المسائل heading | `<div class="exercise-head">✓ تأكَّد</div>` |
| Ready-made table | `<div class="tbl-wrap"><table class="data">…</table></div>` |

### Example
```html
<div class="card example">
  <header><span class="tag">مثال 1</span><h3>الأنماط والتخمين</h3></header>
  <div class="body">
    <p class="q">…question…</p>
    <div class="part"><span class="lbl">a</span> …part…
      <div class="widget" data-widget="…">…</div>
      <div class="sol" data-sol>…</div>
    </div>
  </div>
</div>
```
For real-life examples: `<span class="tag">مثال 3 من واقع الحياة</span>`.

### Exercise
```html
<div class="ex-group">المثال 1 — …instruction…</div>
<div class="ex"><span class="exn">5</span> <span class="num">3, 3, 6, 9, 15, ......</span>
  <div class="ans" data-answer="24"><input inputmode="numeric" placeholder="الحد التالي"><button class="btn sm">تحقق</button><span class="fb"></span></div>
  <div class="sol" data-sol>…</div>
</div>
```

---

## 5. Step-by-step solution (most important)

**Every** question, example and exercise gets a solution. Students study on their own, so every step must be clear.

```html
<div class="sol" data-sol><ol class="steps">
  <li><b>الخطوة 1: ابحث عن نمط.</b> …</li>
  <li><b>الخطوة 2: ضع تخمينًا.</b> …</li>
  <li class="final">الحد التالي هو: <b>54</b>.</li>
</ol></div>
```
- JS adds the «💡 عرض الحل خطوة بخطوة» button and «الخطوة التالية» automatically.
- One idea per `<li>`. 2–5 steps is ideal.
- The final answer goes in `<li class="final">` (shown green with ✓).
- If the book gives a solution, keep its words. If you write your own solution, keep it in the book's style and get it checked by a teacher.
- If there's a widget, add a line like "جرّب بنفسك في الأداة أعلاه" (try it yourself in the tool above).

### Answer box (try it yourself)
For answers that are one number or one word: `<div class="ans" data-answer="-14|−14">`
- Multiple accepted answers are separated by `|`.
- Arabic digits (٠-٩), `−` and harakat are normalized automatically.
- For long or written answers, use only a solution, no `.ans`.

### Compact reading (book.js does this automatically)
To keep text from overwhelming students, these collapse on their own:
| Block | What it becomes |
|---|---|
| `.card.why` (لماذا؟) | Closed «🤔 لماذا؟» bar |
| `.card.tip` / `.tip.warn` | Closed «📌 / ⚠️ heading» bar |
| `.side-grid` (فيما سبق / والآن) | Closed «🎯 أهداف الدرس» bar |
| `.card.def` with 4+ paragraphs | First 2 visible, the rest under «اقرأ المزيد» |

To keep a block always open, add `data-open`: `<div class="card tip" data-open>`.
**Writing rule:** keep the visible text short. Lead with the key idea in one or two lines; detail goes in later paragraphs (which collapse). Solutions are already collapsed.

---

## 6. Math, numbers and RTL (always follow these)

| What | How | Example |
|---|---|---|
| Variables, equations, logic | `<span class="m">…</span>` with Unicode | `<span class="m">p ∧ q</span>`, `<span class="m">n² &gt; n</span>` |
| With units (upright) | `<span class="m up">…</span>` | `<span class="m up">AB = 5 cm</span>` |
| Plain numbers / sequences / times | `<span class="num">…</span>` | `<span class="num">10, 4, −2, −8, ......</span>` |
| Lesson number in text | `<span class="num">1-2</span>` | otherwise RTL shows "2-1" |

- MathJax (`js/math.js`) converts `.m`, and any `.num` that contains an operator, to TeX automatically. Never write `\( … \)` yourself.
- Supported symbols: `∧ ∨ ~ ≅ ∠ ≯ ≈ × ÷ − ² ⁿ ° ......`. Add a new symbol to the `MAP` in `math.js`.
- Write `>` as `&gt;` and `<` as `&lt;`.
- Times (`8:30`) and lesson numbers are never converted.
- Math labels inside widgets: put them in `<span class="m">` in the innerHTML, then call `tex(el)` (see widgets.js).
- Without internet, the Unicode version shows. That's why the Unicode version must also read correctly.

---

## 7. Widgets (interactive tools)

Mark it in HTML, JS does the rest:
```html
<div class="widget" data-widget="nestedSquares">
  <div class="hint">حرّك المنزلق لبناء الشكل التالي</div>
  <svg viewBox="0 0 240 200"></svg>
  <div class="ctrl"><label>رقم الشكل</label><input type="range" min="1" max="7" value="3"><output></output></div>
  <div class="readout"></div>
</div>
```

### Existing widgets
| `data-widget` | What it does | Chapter |
|---|---|---|
| `timeSeq` | Time sequence + "next term" button (`data-start` minutes, `data-step`, `data-count`) | 1-1 |
| `nestedSquares` | Segment-counting pattern, slider | 1-1 |
| `sierpinski` | Triangle pattern 1, 3, 9 … | 1-1 |
| `parity` | Odd/even addition with dots | 1-1 |
| `rectDiag` | Drag a rectangle's corner, diagonals; quadrilateral mode | 1-1 |
| `salon` | Scatter chart with series toggles | 1-1 |
| `price` | Drag a point to make a prediction + trend line | 1-1 |
| `squareVsN` | n² vs n graph, find a counterexample | 1-1 |
| `midpoint` | Drag K, JK = KL but not the midpoint | 1-1 |
| `quarter` | AP / PB ratio on a segment | 1-1 |
| `logicLab` | Statements + series/parallel circuit (∧, ∨, ~) | 1-2 |
| `truthQuiz` | Fill-in truth table quiz | 1-2 |
| `venn` | Highlight Venn regions by expression | 1-2 |
| `vennCount` | Venn with numbers + sliders (`data-a/b`, `data-va/vab/vb/vout`, `data-fixed`) | 1-2 |
| `condTruth` | Conditional p → q truth with toggles (Omar's promise) | 1-3 |
| `relatedCond` | Conditional / converse / inverse / contrapositive, equivalent ones colored the same | 1-3 |
| `vennDeduce` | Drag a point in a Venn diagram to judge a deduction | 1-4 |
| `twoPoints` | Postulates 1.1/1.2: line through 2 points, plane through 3 | 1-5 |
| `reasonQuiz` | Choose each proof step's reason (`data-proof` = key in `PROOFS`) | 1-6 |
| `tempConvert` | °C → °F slider | 1-6 |
| `segmentAdd` | Segment addition AB + BC = AC | 1-7 |
| `angleAdd` | Angle addition (drag rays) | 1-8 |
| `compSupp` | Supplementary / complementary adjacent angles | 1-8 |
| `vertical` | Vertical angles | 1-8 |
| `box3d` | Rectangular prism: tap an edge → parallel / skew / intersecting (`data-labels` = 8 vertices) | 2-1 |
| `transFig` | Two lines + transversal: tap 2 angles → relationship; `data-given="5:72"` → measures + slider (`data-orient` h/v, `data-labels` "TL,TR,BR,BL\|…", `data-names`) | 2-1, 2-2 |
| `slope` | Slope on a grid with rise/run triangle; optional parallel and perpendicular lines | 2-4 |
| `lineEq` | y = mx + b with m and b sliders | 2-5 |
| `plans` | Compare two linear offers (`data-a`/`data-b` = "rate,fixed", `data-max`, `data-label`, `data-names`) | 2-5 |
| `pointLine` | Distance from a point to a line (perpendicular vs slanted segment) | 2-6 |
| `triClassify` | Drag triangle vertices: angles, sides, equal-side ticks, classification by angles and sides | 3-1 |
| `triAngles` | Angle sum with the auxiliary parallel line; exterior angle mode | 3-2 |
| `congMatch` | Pick the vertex order of a congruence statement; colors show the claimed correspondences | 3-3 |
| `congTest` | SSS / SAS / ASA / AAS (one triangle) vs SSA / AAA (not enough) | 3-4, 3-5 |
| `isoTri` | Isosceles triangle: equal legs ⟺ equal base angles | 3-6 |
| `midsegment` | Coordinate proof: the midsegment is parallel to the base and half its length | 3-7 |

### Rules for a new widget
- Write it as `W.myWidget = function (el) { … }` in `js/widgets.js`.
- Helpers: `s()` (SVG element), `txt()`, `handle()` + `draggable()` (draggable point), `range()`, `chart()`, `tex()`.
- Draggable points always use `handle()`: orange/purple, pulsing ring, large touch target.
- Always start with a `.hint` line («☝ اسحب… / حرّك…») so students know what to do.
- Show results in `.readout` as `.pill`s: `.pill.ok` (green) when correct, `.pill.no` (red) when wrong.
- SVG uses a `viewBox` (no fixed width), so it works on phones automatically.
- Ask yourself: "Does this tool actually show the concept, or is it just decoration?" Only build tools for a concept that becomes clear by playing with it.

---

## 8. Design (keep it consistent)

**Colors** (`:root` in `css/book.css`):
| Token | Color | Used for |
|---|---|---|
| `--teal` #0f766e | Lesson header, definitions, primary buttons |
| `--blue` #1d4ed8 | تحقق من فهمك, part labels (a, b) |
| `--red` #dc2626 | تأكد / exercises heading, wrong answer |
| `--orange` #f59e0b | Draggable points, next button, section marker |
| `--hl` #fef08a | Vocabulary word highlight |
| `--green` #16a34a | Correct answer, final step |
| `--purple` #7c3aed | Solution steps, Venn highlight |

Chapter colors on the home page: 1 teal, 2 blue, 3 orange-red, 4 purple.

**Fonts:** headings `Cairo`, text `Tajawal`, math MathJax.

**Layout:**
- Mobile first. Check at 390px phone width first.
- Wide screen (≥ 840px and landscape): two-page spread (book.js switches automatically).
- Inside a page, use `@container page (min-width: 600px)` for two columns, **not** `@media`, because in spread view the page is narrower than the screen.
- Don't add new colors or fonts; use the tokens.

**Navigation:** «التالي/السابق» buttons, swipe/drag, the ☰ contents list, and the page indicator (tap it → slider to jump to any page). All automatic.

**Performance:** only the current page and its neighbours are rendered (`.page.gone { display:none }`). Never add heavy effects (SVG filters, backdrop-filter, large images) to every page, or iPhone Safari will crash.

**Page flip:** Apple Books-style curl (`book.js`). Don't change it per chapter. `.curl` (the folded corner) goes on every page.

---

## 9. Testing before finishing

- [ ] Phone (390×844) and laptop (1280×800) size: every page opens, no JS errors in the console
- [ ] Every widget works with drag/slider, and the readout updates
- [ ] Every solution opens and reveals step by step
- [ ] Every `.ans` accepts the correct answer
- [ ] MathJax renders all math, with nothing like `\land` showing as raw text
- [ ] The `data-goto` links on the contents page open the right lesson
- [ ] The chapter is linked in `index.html` and its progress shows

Headless test (Playwright with Chrome): open each `#pN` and screenshot it. Example scripts were in the scratchpad.

---

## 10. Things to remember

- Solution accuracy matters more than anything. Check every number against the book.
- If a figure in the book isn't clear (as with chapter 1, exercise 3), leave it out and note it.
- Don't copy the Ministry's logo or branding into the project.
- Progress is saved in `localStorage` as `ib.chN.page` / `ib.chN.max` / `ib.chN.pages`.
