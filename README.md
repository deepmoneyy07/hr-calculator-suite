# HR Calculator Suite — Vantage Circle

A single-page HR calculator tool in the **Vantage Circle brand identity**, laid out as a
**tools directory**: a searchable grid of calculator cards (icon, name, category tag,
one-line description). Clicking a card opens that one calculator — enter the values and the
tool returns the result, the formula used, and a plain-language insight. Covers both simple
metrics and the more complicated India payroll math (CTC, gratuity, PF, ESI, bonus).

Navigation: a hero search box and category filter pills narrow the grid; each calculator has
its own URL hash (e.g. `#gratuity`), so the browser back button and shareable links work.

Built from *How HR Formulas Work* (10 calculators) and extended with standard HR calculators
used across the web (Rippling / AIHR / BambooHR for metrics; factoHR / Jupiter / Quikchex for
India payroll). **36 calculators** in five categories.

## Brand

- Colors: Navy `#29294C` (dominant) · Orange `#FF6D05` (key numbers, highlights) · Purple
  `#654AB7` and Pink `#FD5595` (sparing accents) · White.
- Fonts (loaded from Google Fonts): **Playfair Display** for headings (stand-in for Albra),
  **Lato** for body, **Montserrat** for the wordmark. Needs internet for the exact fonts;
  falls back to system fonts offline.

## How to run

No build step, no dependencies. Either:

- **Open directly:** double-click `index.html` in a browser, **or**
- **Serve locally** (recommended, so all files load reliably):

```bash
cd /Users/deepmanibarman/project && python3 -m http.server 4599
```

Then open http://localhost:4599

## Categories

| Category | Count | Examples |
|---|---|---|
| Recruitment & Talent Acquisition | 10 | Vacancy Rate, Internal Fill, Offer Acceptance, Selection Ratio, Cost per Hire, Time to Hire/Fill, Yield Ratio, Cost of Vacancy |
| Workforce Planning & Analytics | 5 | Headcount Growth, Span of Control, Revenue per Employee, Promotion Rate, HR-to-Employee Ratio |
| Engagement & Retention | 6 | Attrition, Retention, Absenteeism, eNPS, Leave Utilization, Cost of Turnover |
| Learning & Development | 4 | Training Completion, Training Attendance, Training ROI, Cost per Trainee |
| Compensation & Benefits | 3 | Compa-Ratio, Gender Pay Gap, Pay Range Penetration |
| Payroll & Statutory (India) | 8 | CTC → In-Hand, Gratuity, EPF/PF, ESI, Bonus, Leave Encashment, Salary Hike, Overtime |

## Files

```
index.html        Page shell (hero + search, grid view, detail view)
css/styles.css     Styling (Vantage Circle brand, responsive)
js/format.js       Formatting + math helpers (INR/percent/days, safe divide)
js/data.js         ALL calculator definitions + card metadata — single source of truth
js/app.js          Renders the grid, filters, routing, and the detail calculator
```

## Adding a new calculator

Append one object to the `CALCULATORS` array in `js/data.js`. No UI code changes needed:

```js
{
  id: 'my-metric',
  category: 'General HR & People',      // must match a value in CATEGORIES
  name: 'My Metric',
  formula: 'A ÷ B × 100',
  inputs: [
    { key: 'a', label: 'A', min: 0 },
    { key: 'b', label: 'B', min: 1 },  // min: 1 on a denominator prevents divide-by-zero
  ],
  example: '20 ÷ 200 = 10%',
  compute: ({ a, b }) => {
    const pct = safeDiv(a, b) * 100;
    return { display: fmtPct(pct), insight: `Result is ${fmtPct(pct)}.` };
  },
}
```

Input options: `unit` (e.g. `'₹'` or `'%'`), `default`, `min`, `max`, `step`, `help`.
`compute` returns `{ display, insight, rows?, error? }` — return `{ error: '...' }` to show a
friendly message instead of a result.

Then add its card icon + description in the `CALC_META` map (also in `js/data.js`), keyed by
the same `id`:

```js
'my-metric': { icon: '🧮', desc: 'One line describing what it does.' },
```

New categories get a colour in `CATEGORY_COLORS` (in `js/data.js`).

## Notes

- Default currency is **INR (₹)** with Indian number grouping (e.g. `₹1,80,000`).
- Statutory rates (PF 12%, gratuity 15/26, ESI 0.75%/3.25% with the ₹21,000 ceiling, bonus
  8.33%) are pre-filled defaults and **editable** — always confirm against current regulations.
- Payroll outputs (especially CTC → In-Hand) are **estimates**, not tax advice; take-home
  depends on the exact salary structure and tax regime, so income tax (TDS) is a manual input.
