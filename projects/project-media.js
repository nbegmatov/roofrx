/**
 * Portfolio project pages: before/after slider + image album lightbox.
 */
(function () {
  function initBeforeAfter(root) {
    var range = root.querySelector('[data-ba-range]');
    var clip = root.querySelector('[data-ba-clip]');
    var handle = root.querySelector('[data-ba-handle]');
    var beforeImg = root.querySelector('[data-ba-before]');
    if (!range || !clip || !beforeImg) return;

    function setPct(pct) {
      var p = Math.min(98, Math.max(2, Number(pct)));
      clip.style.width = p + '%';
      if (handle) handle.style.left = p + '%';
      beforeImg.style.width = 10000 / p + '%';
      range.value = String(Math.round(p));
    }

    range.addEventListener('input', function () {
      setPct(range.value);
    });
    setPct(range.value);
  }

  function buildModal() {
    var el = document.getElementById('project-album-modal');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'project-album-modal';
    el.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-roof-900/95 p-4 opacity-0 pointer-events-none transition-opacity duration-200';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Project photo gallery');
    el.innerHTML =
      '<button type="button" class="project-album-close absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-roof-accent" aria-label="Close gallery">' +
      '<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>' +
      '<button type="button" class="project-album-prev absolute left-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-roof-accent md:left-6" aria-label="Previous photo">' +
      '<svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>' +
      '<button type="button" class="project-album-next absolute right-2 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-roof-accent md:right-6" aria-label="Next photo">' +
      '<svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></button>' +
      '<div class="flex max-h-[85vh] max-w-5xl flex-col items-center gap-3">' +
      '<img class="project-album-img max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl" src="" alt="" />' +
      '<p class="project-album-caption text-center text-sm text-slate-300"></p>' +
      '<p class="text-xs text-slate-500"><span class="project-album-count font-semibold text-white"></span></p>' +
      '</div>';
    document.body.appendChild(el);

    var state = { items: [], index: 0, open: false };
    var imgEl = el.querySelector('.project-album-img');
    var capEl = el.querySelector('.project-album-caption');
    var cntEl = el.querySelector('.project-album-count');

    function render() {
      if (!state.items.length) return;
      var it = state.items[state.index];
      imgEl.src = it.src;
      imgEl.alt = it.alt || '';
      capEl.textContent = it.alt || '';
      cntEl.textContent = state.index + 1 + ' / ' + state.items.length;
    }

    function open(items, start) {
      state.items = items;
      state.index = Math.max(0, Math.min(start, items.length - 1));
      state.open = true;
      el.classList.remove('opacity-0', 'pointer-events-none');
      document.body.style.overflow = 'hidden';
      render();
    }

    function close() {
      state.open = false;
      el.classList.add('opacity-0', 'pointer-events-none');
      document.body.style.overflow = '';
      imgEl.removeAttribute('src');
    }

    function prev() {
      if (state.items.length < 2) return;
      state.index = (state.index - 1 + state.items.length) % state.items.length;
      render();
    }

    function next() {
      if (state.items.length < 2) return;
      state.index = (state.index + 1) % state.items.length;
      render();
    }

    el.querySelector('.project-album-close').addEventListener('click', close);
    el.querySelector('.project-album-prev').addEventListener('click', function (e) {
      e.stopPropagation();
      prev();
    });
    el.querySelector('.project-album-next').addEventListener('click', function (e) {
      e.stopPropagation();
      next();
    });
    el.addEventListener('click', function (e) {
      if (e.target === el) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!state.open) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    return { open: open, close: close };
  }

  function collectAlbumItems(section) {
    var buttons = section.querySelectorAll('[data-album-src]');
    var items = [];
    buttons.forEach(function (btn) {
      var src = btn.getAttribute('data-album-src');
      if (!src) return;
      var thumb = btn.querySelector('img');
      items.push({
        src: src,
        alt: btn.getAttribute('data-album-alt') || (thumb && thumb.getAttribute('alt')) || '',
      });
    });
    return items;
  }

  function initAlbum(section, modalApi) {
    var items = collectAlbumItems(section);
    if (!items.length) return;

    section.querySelectorAll('[data-album-src]').forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        var fresh = collectAlbumItems(section);
        var idx = fresh.findIndex(function (it) {
          return it.src === btn.getAttribute('data-album-src');
        });
        modalApi.open(fresh.length ? fresh : items, idx >= 0 ? idx : i);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-before-after]').forEach(initBeforeAfter);
    var modalApi = buildModal();
    document.querySelectorAll('[data-project-album]').forEach(function (sec) {
      initAlbum(sec, modalApi);
    });
  });
})();
