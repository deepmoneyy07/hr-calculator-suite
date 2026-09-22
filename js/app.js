/* Dashboard: a searchable grid of calculator cards (like a tools directory).
 * Clicking a card opens that one calculator in a detail view.
 * All calculators come from CALCULATORS (js/data.js). */

(function () {
  'use strict';

  const state = { category: 'All', query: '' };

  const homeView = document.getElementById('home-view');
  const detailView = document.getElementById('detail-view');
  const pills = document.getElementById('filter-pills');
  const grid = document.getElementById('calc-grid');
  const emptyMsg = document.getElementById('empty-msg');
  const search = document.getElementById('search');
  const panel = document.getElementById('calc-panel');
  const backBtn = document.getElementById('back-btn');

  const byId = Object.fromEntries(CALCULATORS.map((c) => [c.id, c]));
  const color = (cat) => (typeof CATEGORY_COLORS !== 'undefined' && CATEGORY_COLORS[cat]) || '#FF6D05';

  /* ---------- Category filter pills ---------- */
  function buildPills() {
    const cats = ['All', ...CATEGORIES];
    pills.innerHTML = '';
    cats.forEach((cat) => {
      const count = cat === 'All'
        ? CALCULATORS.length
        : CALCULATORS.filter((c) => c.category === cat).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill' + (cat === state.category ? ' active' : '');
      btn.textContent = `${cat} (${count})`;
      if (cat !== 'All') btn.style.setProperty('--pill', color(cat));
      btn.addEventListener('click', () => {
        state.category = cat;
        buildPills();
        renderGrid();
      });
      pills.appendChild(btn);
    });
  }

  /* ---------- Grid of cards ---------- */
  function renderGrid() {
    const q = state.query.toLowerCase();
    grid.innerHTML = '';
    let shown = 0;
    CALCULATORS.forEach((calc) => {
      const inCat = state.category === 'All' || calc.category === state.category;
      const inQuery = !q ||
        calc.name.toLowerCase().includes(q) ||
        (calc.desc || '').toLowerCase().includes(q) ||
        calc.formula.toLowerCase().includes(q) ||
        calc.category.toLowerCase().includes(q);
      if (!inCat || !inQuery) return;

      const c = color(calc.category);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'tool-card';
      card.dataset.id = calc.id;
      card.innerHTML = `
        <span class="tool-icon" style="background:${c}1a">${calc.icon || '🧮'}</span>
        <span class="tool-body">
          <span class="tool-name">${calc.name}</span>
          <span class="tool-tag" style="color:${c}">${calc.category}</span>
          <span class="tool-desc">${calc.desc || ''}</span>
        </span>`;
      card.addEventListener('click', () => { location.hash = calc.id; });
      grid.appendChild(card);
      shown++;
    });
    emptyMsg.hidden = shown > 0;
  }

  /* ---------- Routing: home <-> detail ---------- */
  function route() {
    const id = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (id && byId[id]) {
      showDetail(byId[id]);
    } else {
      detailView.hidden = true;
      homeView.hidden = false;
      window.scrollTo(0, 0);
    }
  }

  function showDetail(calc) {
    homeView.hidden = true;
    detailView.hidden = false;
    panel.innerHTML = '';
    panel.appendChild(buildCard(calc));
    window.scrollTo(0, 0);
  }

  backBtn.addEventListener('click', () => {
    if (location.hash) location.hash = ''; else route();
  });
  window.addEventListener('hashchange', route);

  search.addEventListener('input', (e) => {
    state.query = e.target.value;
    renderGrid();
  });

  /* ---------- Build one calculator card (detail) ---------- */
  function buildCard(calc) {
    const card = document.createElement('section');
    card.className = 'calc-card';
    card.dataset.id = calc.id;
    card.style.setProperty('--accent', color(calc.category));

    const inputsHtml = calc.inputs.map((inp) => {
      const id = `${calc.id}__${inp.key}`;
      const unit = inp.unit ? `<span class="unit">${inp.unit}</span>` : '';
      const val = inp.default !== undefined ? ` value="${inp.default}"` : '';
      const min = inp.min !== undefined ? ` min="${inp.min}"` : '';
      const max = inp.max !== undefined ? ` max="${inp.max}"` : '';
      const step = inp.step !== undefined ? ` step="${inp.step}"` : ' step="any"';
      const help = inp.help ? `<span class="help">${inp.help}</span>` : '';
      return `
        <label class="field" for="${id}">
          <span class="field-label">${inp.label}</span>
          <span class="input-wrap">${unit}
            <input id="${id}" type="number" inputmode="decimal"
                   data-key="${inp.key}" placeholder="0"${val}${min}${max}${step}>
          </span>
          ${help}
        </label>`;
    }).join('');

    card.innerHTML = `
      <header class="calc-head">
        <span class="calc-icon">${calc.icon || '🧮'}</span>
        <div>
          <h2>${calc.name}</h2>
          <span class="calc-cat">${calc.category}</span>
        </div>
      </header>
      <p class="calc-formula"><strong>Formula:</strong> ${calc.formula}</p>
      <div class="calc-inputs">${inputsHtml}</div>
      <div class="calc-output" aria-live="polite">
        <p class="output-hint">Enter the values above to see the result.</p>
      </div>
      <p class="calc-example"><strong>Example:</strong> ${calc.example}</p>`;

    const output = card.querySelector('.calc-output');
    const inputs = Array.from(card.querySelectorAll('input'));
    inputs.forEach((el) => el.addEventListener('input', () => update(calc, inputs, output)));
    update(calc, inputs, output);
    return card;
  }

  /* ---------- Read, validate, compute, render ---------- */
  function update(calc, inputs, output) {
    const values = {};
    let missing = false;
    let rangeError = '';

    calc.inputs.forEach((inp) => {
      const el = inputs.find((i) => i.dataset.key === inp.key);
      const raw = el.value.trim();
      if (raw === '') { missing = true; return; }
      const n = toNumber(raw);
      if (isNaN(n)) { missing = true; return; }
      if (inp.min !== undefined && n < inp.min) rangeError = `"${inp.label}" must be ${inp.min} or more.`;
      if (inp.max !== undefined && n > inp.max) rangeError = `"${inp.label}" must be ${inp.max} or less.`;
      values[inp.key] = n;
    });

    if (missing) {
      output.innerHTML = '<p class="output-hint">Enter the values above to see the result.</p>';
      return;
    }
    if (rangeError) {
      output.innerHTML = `<p class="output-error">${rangeError}</p>`;
      return;
    }

    let result;
    try {
      result = calc.compute(values);
    } catch (e) {
      output.innerHTML = '<p class="output-error">Could not calculate — please check your inputs.</p>';
      return;
    }

    if (result && result.error) {
      output.innerHTML = `<p class="output-error">${result.error}</p>`;
      return;
    }
    if (!result || result.display === '—' || result.display == null) {
      output.innerHTML = '<p class="output-error">Check your inputs — the result is not a valid number (division by zero?).</p>';
      return;
    }

    const rowsHtml = (result.rows || []).map(
      (r) => `<div class="output-row"><span>${r.label}</span><span>${r.value}</span></div>`
    ).join('');

    output.innerHTML = `
      <div class="output-value">${result.display}</div>
      ${rowsHtml ? `<div class="output-rows">${rowsHtml}</div>` : ''}
      <p class="output-insight">${result.insight || ''}</p>`;
  }

  buildPills();
  renderGrid();
  route();
})();
