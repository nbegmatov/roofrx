/**
 * Shared estimate + availability modals (same markup as index.html).
 * Injects markup if missing, then wires open/close, Escape, and form demo submit.
 */
(function () {
  var MODALS_HTML =
    '<div id="site-modal-estimate" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 sm:p-6" aria-hidden="true">' +
    '<div class="absolute inset-0 bg-roof-900/70 backdrop-blur-sm" data-modal-backdrop tabindex="-1" aria-hidden="true"></div>' +
    '<div role="dialog" aria-modal="true" aria-labelledby="modal-estimate-heading" class="relative z-10 w-full max-w-lg max-h-[min(90vh,720px)] overflow-y-auto rounded-[1.75rem] bg-white p-6 sm:p-8 shadow-2xl shadow-roof-900/20 ring-1 ring-slate-200/80">' +
    '<button type="button" class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-roof-900" data-modal-close aria-label="Close dialog">' +
    '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' +
    '</button>' +
    '<p class="text-roof-accent text-xs font-medium uppercase tracking-[0.2em] mb-2">No obligation</p>' +
    '<h2 id="modal-estimate-heading" class="text-2xl font-medium text-roof-900 tracking-tight pr-10">Free estimate</h2>' +
    '<p class="mt-3 text-slate-600 text-[15px] leading-relaxed">Tell us a bit about the job — we’ll follow up with next steps and timing.</p>' +
    '<form id="modal-estimate-form" class="mt-6 space-y-4">' +
    '<div><label for="estimate-name" class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Name</label>' +
    '<input id="estimate-name" name="name" type="text" required autocomplete="name" data-modal-initial-focus class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-shadow focus:border-roof-accent focus:ring-2 focus:ring-roof-accent/20" placeholder="Your name" /></div>' +
    '<div class="grid gap-4 sm:grid-cols-2">' +
    '<div><label for="estimate-phone" class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Phone</label>' +
    '<input id="estimate-phone" name="phone" type="tel" required autocomplete="tel" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-shadow focus:border-roof-accent focus:ring-2 focus:ring-roof-accent/20" placeholder="(303) 555-0100" /></div>' +
    '<div><label for="estimate-email" class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Email</label>' +
    '<input id="estimate-email" name="email" type="email" autocomplete="email" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-shadow focus:border-roof-accent focus:ring-2 focus:ring-roof-accent/20" placeholder="you@email.com" /></div></div>' +
    '<div><label for="estimate-zip" class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">City or ZIP</label>' +
    '<input id="estimate-zip" name="location" type="text" autocomplete="address-level2" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-shadow focus:border-roof-accent focus:ring-2 focus:ring-roof-accent/20" placeholder="e.g. Denver or 80202" /></div>' +
    '<div><label for="estimate-type" class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Project type</label>' +
    '<select id="estimate-type" name="type" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-shadow focus:border-roof-accent focus:ring-2 focus:ring-roof-accent/20">' +
    '<option value="">Select…</option><option value="residential">Residential roof</option><option value="commercial">Commercial roof</option><option value="repair">Repair / leak</option><option value="storm">Storm or insurance</option><option value="other">Other</option></select></div>' +
    '<div><label for="estimate-notes" class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Notes <span class="font-normal normal-case tracking-normal text-slate-400">(optional)</span></label>' +
    '<textarea id="estimate-notes" name="notes" rows="3" class="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-shadow focus:border-roof-accent focus:ring-2 focus:ring-roof-accent/20" placeholder="Rough size, timeline, photos by email…"></textarea></div>' +
    '<button type="submit" class="w-full rounded-2xl bg-roof-accent py-3.5 text-sm font-medium text-white shadow-lg shadow-roof-accent/25 transition-colors hover:bg-roof-accent-hover">Send request</button>' +
    '<p class="text-center text-xs text-slate-500">Prefer to talk? <a href="tel:+12676167534" class="font-semibold text-roof-accent hover:underline">(267) 616-7534</a></p></form>' +
    '<div id="modal-estimate-success" class="hidden mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center">' +
    '<p class="text-lg font-medium text-roof-900">Thanks — we got it.</p>' +
    '<p class="mt-2 text-slate-600 text-[15px] leading-relaxed">We’ll reach out shortly. For urgent leaks, call dispatch now.</p>' +
    '<a href="tel:+12676167534" class="mt-5 inline-flex w-full justify-center rounded-2xl bg-roof-accent py-3.5 text-sm font-medium text-white hover:bg-roof-accent-hover transition-colors">Call (267) 616-7534</a>' +
    '<button type="button" class="mt-3 w-full rounded-2xl border-2 border-slate-200 py-3 text-sm font-medium text-roof-900 hover:border-roof-accent transition-colors" data-modal-close>Close</button></div></div></div>' +
    '<div id="site-modal-availability" class="fixed inset-0 z-[100] hidden items-center justify-center p-4 sm:p-6" aria-hidden="true">' +
    '<div class="absolute inset-0 bg-roof-900/70 backdrop-blur-sm" data-modal-backdrop tabindex="-1" aria-hidden="true"></div>' +
    '<div role="dialog" aria-modal="true" aria-labelledby="modal-availability-heading" class="relative z-10 w-full max-w-lg max-h-[min(90vh,680px)] overflow-y-auto rounded-[1.75rem] bg-white p-6 sm:p-8 shadow-2xl shadow-roof-900/20 ring-1 ring-slate-200/80">' +
    '<button type="button" class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-roof-900" data-modal-close aria-label="Close dialog">' +
    '<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>' +
    '<p class="text-roof-accent text-xs font-medium uppercase tracking-[0.2em] mb-2">Front Range</p>' +
    '<h2 id="modal-availability-heading" class="text-2xl font-medium text-roof-900 tracking-tight pr-10">Check availability</h2>' +
    '<p class="mt-3 text-slate-600 text-[15px] leading-relaxed">We stage crews across Colorado. Pick your area — we’ll confirm whether we can get to you this week.</p>' +
    '<div class="mt-6 space-y-4">' +
    '<div><label for="availability-area" class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Your area</label>' +
    '<select id="availability-area" data-modal-initial-focus class="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-shadow focus:border-roof-accent focus:ring-2 focus:ring-roof-accent/20">' +
    '<option value="">Choose a region…</option><option value="denver">Denver Metro</option><option value="springs">Colorado Springs</option><option value="fort-collins">Fort Collins</option><option value="boulder">Boulder &amp; Longmont</option><option value="aurora">Aurora &amp; Centennial</option><option value="castle-rock">Castle Rock</option><option value="mountain">Mountain / other</option></select></div>' +
    '<p class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-relaxed">Typical response: <strong class="text-roof-900">one business day</strong> for scheduling. Same-week visits when routes allow.</p>' +
    '<a href="tel:+12676167534" class="flex w-full items-center justify-center gap-2 rounded-2xl bg-roof-accent py-3.5 text-sm font-medium text-white shadow-lg shadow-roof-accent/25 transition-colors hover:bg-roof-accent-hover">Call dispatch — fastest</a>' +
    '<button type="button" class="w-full rounded-2xl border-2 border-roof-900 bg-roof-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-roof-accent hover:border-roof-accent" data-open-estimate-from-availability>Request a written estimate</button></div></div></div>';

  function titleFromTrigger(el) {
    var explicit = el.getAttribute('data-modal-title');
    if (explicit) return explicit;
    var raw = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    return raw || 'Free estimate';
  }

  function ensureModalsInDom() {
    if (document.getElementById('site-modal-estimate')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = MODALS_HTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  function wireModals() {
    var estimateEl = document.getElementById('site-modal-estimate');
    var availabilityEl = document.getElementById('site-modal-availability');
    var estimateHeading = document.getElementById('modal-estimate-heading');
    var availabilityHeading = document.getElementById('modal-availability-heading');
    var estimateForm = document.getElementById('modal-estimate-form');
    var estimateSuccess = document.getElementById('modal-estimate-success');
    var lastFocus = null;

    if (!estimateEl || !availabilityEl) return;

    function showModal(el) {
      if (!el) return;
      lastFocus = document.activeElement;
      el.classList.remove('hidden');
      el.classList.add('flex');
      el.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');
      var focusTarget =
        el.querySelector('[data-modal-initial-focus]') || el.querySelector('input, select, textarea, [data-modal-close]');
      if (focusTarget) focusTarget.focus();
    }

    function hideModal(el) {
      if (!el) return;
      el.classList.add('hidden');
      el.classList.remove('flex');
      el.setAttribute('aria-hidden', 'true');
      if (!estimateEl.classList.contains('flex') && !availabilityEl.classList.contains('flex')) {
        document.body.classList.remove('overflow-hidden');
      }
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function resetEstimateForm() {
      if (!estimateForm || !estimateSuccess) return;
      estimateForm.reset();
      estimateForm.classList.remove('hidden');
      estimateSuccess.classList.add('hidden');
    }

    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-open-modal]');
      if (!opener) return;
      e.preventDefault();
      var kind = opener.getAttribute('data-open-modal');
      var title = titleFromTrigger(opener);
      if (kind === 'estimate') {
        resetEstimateForm();
        if (estimateHeading) estimateHeading.textContent = title;
        hideModal(availabilityEl);
        showModal(estimateEl);
      } else if (kind === 'availability') {
        if (availabilityHeading) availabilityHeading.textContent = title;
        hideModal(estimateEl);
        showModal(availabilityEl);
      }
    });

    var fromAvail = document.querySelector('[data-open-estimate-from-availability]');
    if (fromAvail) {
      fromAvail.addEventListener('click', function () {
        hideModal(availabilityEl);
        resetEstimateForm();
        if (estimateHeading) estimateHeading.textContent = 'Request a written estimate';
        showModal(estimateEl);
      });
    }

    document.querySelectorAll('#site-modal-estimate [data-modal-close], #site-modal-estimate [data-modal-backdrop]').forEach(function (el) {
      el.addEventListener('click', function () {
        hideModal(estimateEl);
      });
    });
    document.querySelectorAll('#site-modal-availability [data-modal-close], #site-modal-availability [data-modal-backdrop]').forEach(function (el) {
      el.addEventListener('click', function () {
        hideModal(availabilityEl);
      });
    });

    if (estimateForm) {
      estimateForm.addEventListener('submit', function (e) {
        e.preventDefault();
        estimateForm.classList.add('hidden');
        estimateSuccess.classList.remove('hidden');
        var okBtn = estimateSuccess.querySelector('button[data-modal-close]');
        if (okBtn) okBtn.focus();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (estimateEl.classList.contains('flex')) hideModal(estimateEl);
      else if (availabilityEl.classList.contains('flex')) hideModal(availabilityEl);
    });
  }

  function init() {
    ensureModalsInDom();
    wireModals();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
