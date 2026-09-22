/* Shared formatting + math helpers.
 * Declared as top-level functions so they are global in the browser
 * (loaded before data.js/app.js) and easy to load in the Node test harness. */

// Round to `dp` decimals, killing floating-point noise.
function roundTo(x, dp) {
  if (!isFinite(x)) return x;
  const f = Math.pow(10, dp);
  return Math.round((x + Number.EPSILON) * f) / f;
}

// Divide safely: NaN when the denominator is zero/invalid.
function safeDiv(a, b) {
  if (!b) return NaN;
  return a / b;
}

// Parse a raw input string into a number, or NaN when blank/invalid.
function toNumber(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  const n = Number(v);
  return isNaN(n) ? NaN : n;
}

// "20%", "16.67%", "-4.5%". Returns "—" when not computable.
function fmtPct(x, dp = 2) {
  if (!isFinite(x)) return '—';
  const r = roundTo(x, dp);
  return trimNum(r) + '%';
}

// Plain number with Indian grouping: 180000 -> "1,80,000".
function fmtNum(x, dp = 2) {
  if (!isFinite(x)) return '—';
  const r = roundTo(x, dp);
  return r.toLocaleString('en-IN', { maximumFractionDigits: dp });
}

// Rupees with Indian grouping: 180000 -> "₹1,80,000".
function fmtINR(x) {
  if (!isFinite(x)) return '—';
  // Whole rupees unless there is a real fractional part.
  const dp = Math.abs(x % 1) > 1e-9 ? 2 : 0;
  const r = roundTo(x, dp);
  return '₹' + r.toLocaleString('en-IN', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

function fmtDays(x, dp = 1) {
  if (!isFinite(x)) return '—';
  const r = roundTo(x, dp);
  return trimNum(r) + (r === 1 ? ' day' : ' days');
}

// Drop trailing zeros: 20.00 -> "20", 16.67 -> "16.67".
function trimNum(x) {
  return Number(x).toLocaleString('en-IN', { maximumFractionDigits: 6 });
}
