/**
 * Ballpark roof cost helper — educational only; not a binding quote.
 * Expects a wrapper [data-roof-calc] with [data-calc-sqft], [data-calc-system], [data-calc-result], [data-calc-run].
 */
(function () {
  function money(n) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  }

  var RATES = {
    asphalt: { lo: 5.75, hi: 10.25, label: 'asphalt re-roof' },
    designer: { lo: 7.5, hi: 13.5, label: 'designer / Class 4 shingles' },
    metal: { lo: 13, hi: 24, label: 'standing seam metal' },
    commercial: { lo: 9, hi: 17.5, label: 'commercial low-slope (TPO/EPDM class)' },
    repair: { lo: 3.5, hi: 11, label: 'repair / partial replacement (varies widely)' },
  };

  function run(wrap) {
    var sqEl = wrap.querySelector('[data-calc-sqft]');
    var sysEl = wrap.querySelector('[data-calc-system]');
    var out = wrap.querySelector('[data-calc-result]');
    if (!sqEl || !sysEl || !out) return;

    var sq = parseFloat(String(sqEl.value).replace(/,/g, ''), 10);
    if (!sq || sq < 200) {
      out.classList.remove('hidden');
      out.innerHTML =
        '<p class="font-semibold text-red-700">Enter a realistic roof area (minimum ~400 sq.ft.).</p>';
      return;
    }

    var key = sysEl.value || 'asphalt';
    var r = RATES[key] || RATES.asphalt;
    var low = sq * r.lo;
    var high = sq * r.hi;

    out.classList.remove('hidden');
    out.innerHTML =
      '<p class="font-medium text-roof-900 text-lg mb-2">Ballpark for ' +
      money(low) +
      ' – ' +
      money(high) +
      '</p>' +
      '<p class="text-slate-600 text-sm leading-relaxed">Based on ~' +
      sq.toLocaleString() +
      ' sq.ft. and typical <strong>' +
      r.label +
      '</strong> assemblies in Colorado (tear-off, underlayment, code-compliant details). Steep pitch, access, decking repairs, or scope changes move the number.</p>' +
      '<p class="text-xs text-slate-500 mt-3">Not a contract. <a href="#" role="button" data-open-modal="estimate" data-modal-title="Schedule a field visit" class="cursor-pointer text-roof-accent font-semibold underline hover:no-underline">Schedule a field visit</a> for a fixed written quote.</p>';
  }

  function initWrap(wrap) {
    var def = wrap.getAttribute('data-default-sqft');
    var sqEl = wrap.querySelector('[data-calc-sqft]');
    if (def && sqEl) sqEl.value = def;

    var preset = wrap.getAttribute('data-calc-preset');
    var sysEl = wrap.querySelector('[data-calc-system]');
    if (preset && sysEl) {
      var opt = sysEl.querySelector('option[value="' + preset + '"]');
      if (opt) sysEl.value = preset;
    }

    var btn = wrap.querySelector('[data-calc-run]');
    if (btn) {
      btn.addEventListener('click', function () {
        run(wrap);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-roof-calc]').forEach(initWrap);
  });
})();
