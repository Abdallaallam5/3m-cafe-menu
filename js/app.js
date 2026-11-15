/* 3M cafe — digital menu app (no dependencies) */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ICONS = new Set(['cup', 'bean', 'leaf', 'snow', 'iced', 'mojito', 'shake', 'can', 'cocktail', 'croissant', 'waffle', 'icecream', 'cake', 'plus', 'shisha', 'frappe', 'juice']);
  const icon = (name) => `<svg class="ico" aria-hidden="true"><use href="#i-${ICONS.has(name) ? name : 'cup'}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Arabic-tolerant search normalisation ---------- */
  const norm = (s) => String(s)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '') // tashkeel + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();

  /* ---------- Loader ---------- */
  const loaderStart = performance.now();
  function hideLoader() {
    const wait = Math.max(0, 900 - (performance.now() - loaderStart));
    setTimeout(() => {
      $('#loader').classList.add('is-done');
      document.body.classList.remove('is-loading');
    }, reduceMotion.matches ? 0 : wait);
  }
  // Safety net: never trap the user behind the loader
  setTimeout(hideLoader, 4000);

  /* ---------- Render ---------- */
  let data = null;
  const itemsIndex = []; // { li, nameEl, name, key }

  function countItems(cat) {
    return cat.groups ? cat.groups.reduce((n, g) => n + g.items.length, 0) : cat.items.length;
  }

  function itemsHTML(items, iconName) {
    return `<ul class="items">${items.map((it, i) => `
      <li class="card reveal" style="--i:${i % 8}" data-name="${esc(it.name)}">
        <span class="card__icon">${icon(iconName)}</span>
        <span class="card__name">${esc(it.name)}</span>
        <span class="card__price" aria-label="السعر ${it.price}">${it.price}</span>
      </li>`).join('')}</ul>`;
  }

  function visualHTML(cat) {
    const imgs = [cat.image, cat.image2].filter(Boolean);
    const steam = cat.steam ? '<svg class="v-steam" viewBox="0 0 60 90" aria-hidden="true"><use href="#steam"/></svg>' : '';
    return `<div class="sec-visual reveal ${imgs.length > 1 ? 'two' : ''}">${steam}${imgs.map((src) =>
      `<img src="${esc(src)}" alt="${esc(cat.name_ar)} — ${esc(cat.name_en)}" loading="lazy" decoding="async" width="400" height="400">`).join('')}</div>`;
  }

  function render(menu) {
    data = menu;
    const cats = menu.categories;

    // Category tiles
    $('#catsGrid').innerHTML = cats.map((c, i) => `
      <a class="cat-tile reveal" style="--i:${i}" href="#${esc(c.id)}">
        <span class="cat-tile__count">${countItems(c)}</span>
        <img class="cat-tile__img" src="${esc(c.image)}" alt="" loading="lazy" decoding="async" width="300" height="260">
        <span class="cat-tile__ar">${esc(c.name_ar)}</span>
        <span class="cat-tile__en" lang="en">${esc(c.name_en)}</span>
      </a>`).join('');

    // Chips
    $('#chips').innerHTML = cats.map((c) =>
      `<a class="chip" href="#${esc(c.id)}" data-id="${esc(c.id)}">${icon(c.icon)}<span>${esc(c.name_ar)}</span></a>`).join('');

    // Sections
    $('#sections').innerHTML = cats.map((c) => {
      const body = c.groups
        ? c.groups.map((g) => `
          <div class="group">
            <div class="group__head"><h3 class="group__title">${icon(g.icon || c.icon)}${esc(g.name_ar)}</h3></div>
            ${itemsHTML(g.items, g.icon || c.icon)}
          </div>`).join('')
        : itemsHTML(c.items, c.icon);
      return `
        <section class="menu-sec" id="${esc(c.id)}" aria-labelledby="h-${esc(c.id)}">
          <div class="plaque reveal">
            <span class="plaque__icon">${icon(c.icon)}</span>
            <div><h2 class="plaque__ar" id="h-${esc(c.id)}">${esc(c.name_ar)}</h2><span class="plaque__en" lang="en">${esc(c.name_en)}</span></div>
          </div>
          <div class="sec-body">
            ${visualHTML(c)}
            <div class="sec-list">${body}</div>
          </div>
        </section>`;
    }).join('');

    document.querySelectorAll('.card').forEach((li) => {
      const nameEl = li.querySelector('.card__name');
      const sec = li.closest('.menu-sec');
      const cat = cats.find((c) => c.id === sec.id);
      itemsIndex.push({ li, nameEl, name: li.dataset.name, key: norm(li.dataset.name + ' ' + cat.name_ar + ' ' + cat.name_en) });
    });

    setupReveal();
    setupScrollSpy();
    hideLoader();
  }

  /* ---------- Reveal on scroll ---------- */
  function setupReveal() {
    const els = document.querySelectorAll('.reveal');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- Scroll spy for chips ---------- */
  let activeId = null;
  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    document.querySelectorAll('.chip').forEach((ch) => {
      const on = ch.dataset.id === id;
      ch.classList.toggle('is-active', on);
      if (on) {
        ch.setAttribute('aria-current', 'true');
        const bar = $('#chips');
        const target = ch.offsetLeft - (bar.clientWidth - ch.clientWidth) / 2;
        bar.scrollTo({ left: target, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      } else ch.removeAttribute('aria-current');
    });
  }
  function setupScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('.menu-sec').forEach((s) => io.observe(s));
  }

  /* ---------- Search ---------- */
  function applySearch(q) {
    const nq = norm(q);
    $('#searchClear').hidden = !q;
    let any = false;
    itemsIndex.forEach(({ li, nameEl, name, key }) => {
      const hit = !nq || key.includes(nq);
      li.hidden = !hit;
      if (hit) li.classList.add('is-in');
      // highlight
      if (nq && hit) {
        const i = norm(name).indexOf(nq);
        nameEl.innerHTML = i > -1 && norm(name).length === name.length
          ? esc(name.slice(0, i)) + '<mark>' + esc(name.slice(i, i + nq.length)) + '</mark>' + esc(name.slice(i + nq.length))
          : esc(name);
      } else nameEl.textContent = name;
    });
    document.querySelectorAll('.group').forEach((g) => { g.hidden = !g.querySelector('.card:not([hidden])'); });
    document.querySelectorAll('.menu-sec').forEach((s) => {
      const vis = !!s.querySelector('.card:not([hidden])');
      s.hidden = !vis;
      if (vis) { any = true; s.querySelectorAll('.reveal').forEach((r) => r.classList.add('is-in')); }
      const chip = document.querySelector(`.chip[data-id="${s.id}"]`);
      if (chip) chip.hidden = !vis;
    });
    $('#empty').hidden = any;
  }
  let searchTimer;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      applySearch(e.target.value);
      if (e.target.value) {
        const tb = $('#toolbar');
        const y = tb.getBoundingClientRect().top + window.scrollY;
        if (window.scrollY < y - 2) window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 120);
  });
  $('#searchClear').addEventListener('click', () => {
    const s = $('#search'); s.value = ''; applySearch(''); s.focus();
  });

  /* ---------- Parallax + FAB visibility (single rAF loop) ---------- */
  const parallaxEls = Array.from(document.querySelectorAll('[data-speed]'));
  const hero = $('.hero');
  const fabs = $('.fabs');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = hero.offsetHeight;
      if (!reduceMotion.matches && y < h * 1.2) {
        parallaxEls.forEach((el) => { el.style.translate = `0 ${(y * parseFloat(el.dataset.speed)).toFixed(1)}px`; });
      }
      fabs.classList.toggle('is-visible', y > h * 0.75);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' }));

  /* ---------- Data load ---------- */
  fetch('data/menu.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .catch(() => caches.match('data/menu.json').then((r) => r && r.json()))
    .then((menu) => {
      if (!menu) throw new Error('no menu');
      render(menu);
    })
    .catch(() => {
      $('#sections').innerHTML = '<p class="empty">تعذّر تحميل المنيو. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.</p>';
      hideLoader();
    });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Online / offline indicator ---------- */
  const pill = $('#offlinePill');
  const updateOnline = () => { pill.hidden = navigator.onLine; };
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  /* ---------- Install to home screen ---------- */
  let deferredPrompt = null;
  const installBtn = $('#installBtn');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installBtn.hidden = true; });
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone) $('#iosHint').hidden = false;

  /* ---------- Service worker + update flow ---------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        const showUpdate = (worker) => {
          const t = $('#updateToast');
          t.hidden = false;
          $('#updateBtn').onclick = () => worker.postMessage({ type: 'SKIP_WAITING' });
        };
        if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          nw && nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdate(nw);
          });
        });
        // check for a new menu version when the app comes back to the foreground
        document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
      }).catch(() => {});
      // Reload only when an existing worker is replaced (user tapped "تحديث"), never on the very first install.
      const hadController = !!navigator.serviceWorker.controller;
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing || !hadController) return;
        refreshing = true;
        location.reload();
      });
    });
  }
})();
