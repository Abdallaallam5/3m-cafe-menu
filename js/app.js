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

  /* ---------- Language ---------- */
  const STR = {
    ar: {
      skip: 'انتقل للمنيو', offline: 'أنت غير متصل — المنيو يعمل من النسخة المحفوظة', updateMsg: 'نسخة جديدة من المنيو متاحة', update: 'تحديث',
      nights: 'ليالي بيروت', explore: 'استكشف المنيو', exploreSub: 'Explore Our Menu', cats: 'الأقسام', catsSub: 'Our Menu',
      searchLabel: 'ابحث في المنيو', searchPh: 'ابحث عن مشروب أو صنف…', clear: 'مسح البحث', empty: 'لا توجد نتائج مطابقة — جرّب كلمة أخرى ☕',
      install: 'أضف المنيو للشاشة الرئيسية', ios: 'على iPhone: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».', note: 'بعد أول زيارة يعمل المنيو حتى بدون إنترنت.',
      backCats: 'الرجوع إلى الأقسام', toTop: 'العودة لأعلى', scrollDown: 'انزل للأقسام', price: 'السعر', loadError: 'تعذّر تحميل المنيو. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.',
      langBtn: 'EN', langAria: 'Switch to English'
    },
    en: {
      skip: 'Skip to menu', offline: 'You are offline — showing the saved menu', updateMsg: 'A new version of the menu is available', update: 'Update',
      nights: 'Beirut Nights', explore: 'Explore Our Menu', exploreSub: 'استكشف المنيو', cats: 'Categories', catsSub: 'الأقسام',
      searchLabel: 'Search the menu', searchPh: 'Search for a drink or item…', clear: 'Clear search', empty: 'No matching items — try another word ☕',
      install: 'Add the menu to your home screen', ios: 'On iPhone: tap Share, then “Add to Home Screen”.', note: 'After your first visit, the menu works even without internet.',
      backCats: 'Back to categories', toTop: 'Back to top', scrollDown: 'Scroll to categories', price: 'Price', loadError: 'Could not load the menu. Check your connection and try again.',
      langBtn: 'عربي', langAria: 'التبديل إلى العربية'
    }
  };
  let lang = 'ar';
  try { if (localStorage.getItem('lang') === 'en') lang = 'en'; } catch (e) { /* storage unavailable */ }
  const t = (k) => STR[lang][k];
  const nm = (o) => (lang === 'en' && o.name_en) ? o.name_en : (o.name_ar || o.name);

  function applyStatic() {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    const btn = $('#langBtn');
    btn.textContent = t('langBtn');
    btn.setAttribute('aria-label', t('langAria'));
    btn.lang = lang === 'en' ? 'ar' : 'en';
    btn.classList.toggle('is-ar', lang === 'en');
  }
  applyStatic();

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
  let itemsIndex = []; // { li, nameEl, name, key }

  function countItems(cat) {
    return cat.groups ? cat.groups.reduce((n, g) => n + g.items.length, 0) : cat.items.length;
  }

  function itemsHTML(items, iconName) {
    return `<ul class="items">${items.map((it, i) => `
      <li class="card reveal" style="--i:${i % 8}" data-name="${esc(nm(it))}" data-alt="${esc(lang === 'en' ? it.name : (it.name_en || ''))}">
        <span class="card__icon">${icon(iconName)}</span>
        <span class="card__name">${esc(nm(it))}</span>
        <span class="card__price" aria-label="${t('price')} ${it.price}">${it.price}</span>
      </li>`).join('')}</ul>`;
  }

  function visualHTML(cat) {
    const imgs = [cat.image, cat.image2].filter(Boolean);
    const steam = cat.steam ? '<svg class="v-steam" viewBox="0 0 60 90" aria-hidden="true"><use href="#steam"/></svg>' : '';
    return `<div class="sec-visual reveal ${imgs.length > 1 ? 'two' : ''}">${steam}${imgs.map((src) =>
      `<img src="${esc(src)}" alt="${esc(nm(cat))}" loading="lazy" decoding="async" width="400" height="400">`).join('')}</div>`;
  }

  function render(menu) {
    data = menu;
    const cats = menu.categories;

    // Category tiles
    $('#catsGrid').innerHTML = cats.map((c, i) => `
      <a class="cat-tile reveal" style="--i:${i}" href="#${esc(c.id)}">
        <span class="cat-tile__count">${countItems(c)}</span>
        <img class="cat-tile__img" src="${esc(c.image)}" alt="" loading="lazy" decoding="async" width="300" height="260">
        <span class="cat-tile__ar">${esc(nm(c))}</span>
        <span class="cat-tile__en" lang="${lang === 'en' ? 'ar' : 'en'}">${esc(lang === 'en' ? c.name_ar : c.name_en)}</span>
      </a>`).join('');

    // Chips
    $('#chips').innerHTML = cats.map((c) =>
      `<a class="chip" href="#${esc(c.id)}" data-id="${esc(c.id)}">${icon(c.icon)}<span>${esc(nm(c))}</span></a>`).join('');

    // Sections
    $('#sections').innerHTML = cats.map((c) => {
      const body = c.groups
        ? c.groups.map((g) => `
          <div class="group">
            <div class="group__head"><h3 class="group__title">${icon(g.icon || c.icon)}${esc(nm(g))}</h3></div>
            ${itemsHTML(g.items, g.icon || c.icon)}
          </div>`).join('')
        : itemsHTML(c.items, c.icon);
      return `
        <section class="menu-sec" id="${esc(c.id)}" aria-labelledby="h-${esc(c.id)}">
          <div class="plaque reveal">
            <span class="plaque__icon">${icon(c.icon)}</span>
            <div><h2 class="plaque__ar" id="h-${esc(c.id)}">${esc(nm(c))}</h2><span class="plaque__en" lang="${lang === 'en' ? 'ar' : 'en'}">${esc(lang === 'en' ? c.name_ar : c.name_en)}</span></div>
          </div>
          <div class="sec-body">
            ${visualHTML(c)}
            <div class="sec-list">${body}</div>
          </div>
        </section>`;
    }).join('');

    itemsIndex = [];
    document.querySelectorAll('.card').forEach((li) => {
      const nameEl = li.querySelector('.card__name');
      const sec = li.closest('.menu-sec');
      const cat = cats.find((c) => c.id === sec.id);
      itemsIndex.push({ li, nameEl, name: li.dataset.name, key: norm(li.dataset.name + ' ' + li.dataset.alt + ' ' + cat.name_ar + ' ' + cat.name_en) });
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
      $('#sections').innerHTML = `<p class="empty">${t('loadError')}</p>`;
      hideLoader();
    });

  /* ---------- Language switch ---------- */
  $('#langBtn').addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
    applyStatic();
    if (!data) return;
    // keep the reader on the same section
    const anchor = Array.from(document.querySelectorAll('.menu-sec')).find((s) => s.getBoundingClientRect().bottom > 140);
    const inMenu = anchor && window.scrollY > $('#sections').offsetTop - 200;
    const anchorId = anchor && anchor.id;
    const offset = anchor ? anchor.getBoundingClientRect().top : 0;
    activeId = null;
    render(data);
    document.querySelectorAll('.reveal').forEach((r) => r.classList.add('is-in'));
    const q = $('#search').value;
    if (q) applySearch(q);
    if (inMenu && anchorId) {
      const el = document.getElementById(anchorId);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'auto' });
    }
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
