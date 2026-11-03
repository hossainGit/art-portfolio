/* Maruf · Sketchbook — behaviour.
   Everything here is progressive: without this file the page shows every
   piece at full value and every link opens the large image directly. */
(() => {
  'use strict';
  window.__sketchbook = true;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const ready = (img) => {
    if (!img) return Promise.resolve();
    if (img.complete && img.naturalWidth) return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    return new Promise((res) => {
      img.addEventListener('load', () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(res), { once: true });
      img.addEventListener('error', res, { once: true });
    });
  };

  /* ---------- the first spread opens ---------- */
  const spread = $('.spread');
  if (spread) {
    const photo = $('.photo-shade', spread);
    const open = () => requestAnimationFrame(() => requestAnimationFrame(() => spread.classList.add('is-open', 'is-shaded')));
    if (reduce) spread.classList.add('is-open', 'is-shaded');
    else Promise.race([ready(photo), new Promise((r) => setTimeout(r, 2500))]).then(open);
  }

  /* ---------- every artwork shades in from its underdrawing ---------- */
  const shadeTargets = $$('.work, .compare, .book-stage');
  const shade = (el) => {
    const imgs = $$('img', el);
    Promise.all(imgs.map(ready)).then(() => el.classList.add('is-shaded'));
  };

  if (reduce || !('IntersectionObserver' in window)) {
    shadeTargets.forEach((el) => el.classList.add('is-shaded'));
    $$('.chapter__title').forEach((el) => el.classList.add('is-drawn'));
  } else {
    const shadeObs = new IntersectionObserver((entries) => {
      const arriving = entries.filter((e) => e.isIntersecting);
      arriving.forEach((entry, i) => {
        entry.target.style.setProperty('--d', `${Math.min(i, 4) * 0.12}s`);
        shade(entry.target);
        shadeObs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.18 });
    shadeTargets.forEach((el) => shadeObs.observe(el));

    const drawObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-drawn');
        drawObs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.6 });
    $$('.chapter__title').forEach((el) => drawObs.observe(el));
  }

  /* ---------- index tabs ---------- */
  const tabs = $('.tabs');
  const tabLinks = $$('.tabs a');
  // on phones the tabs run along the bottom; keep the current one in view if they overflow
  const reveal = (a) => {
    if (!tabs || !a || tabs.scrollWidth <= tabs.clientWidth) return;
    tabs.scrollTo({ left: a.offsetLeft - (tabs.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  };

  if ('IntersectionObserver' in window) {
    const chapters = $$('[data-tab]');
    const current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tabLinks.forEach((a) => a.setAttribute('aria-current', String(a.dataset.for === entry.target.id)));
        reveal(tabLinks.find((a) => a.dataset.for === entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    chapters.forEach((c) => current.observe(c));

    if (spread) {
      const top = new IntersectionObserver(([entry]) => {
        const atTop = entry.intersectionRatio > 0.35;
        tabs && tabs.classList.toggle('is-visible', !atTop);
        if (atTop) tabLinks.forEach((a) => a.setAttribute('aria-current', 'false'));
      }, { threshold: [0, 0.35, 0.6] });
      top.observe(spread);
    }
  } else if (tabs) {
    tabs.classList.add('is-visible');
  }

  /* ---------- viewer ---------- */
  const viewer = $('.viewer');
  if (viewer && typeof viewer.showModal === 'function') {
    const stage = $('.viewer__stage', viewer);
    const title = $('#viewer-title', viewer);
    const meta = $('.viewer__meta', viewer);
    const count = $('.viewer__count', viewer);
    const stepBtns = $$('[data-step]', viewer);
    const img = document.createElement('img');
    img.className = 'viewer__img';
    img.decoding = 'async';
    stage.appendChild(img);

    let group = [];
    let index = 0;
    let chapterName = '';
    let opener = null;

    const itemFrom = (a) => {
      const fig = a.closest('figure');
      const thumb = $('img', a);
      return {
        src: a.getAttribute('href'),
        alt: a.dataset.alt || (thumb ? thumb.alt : ''),
        title: a.dataset.title || (fig ? ($('.label__title', fig) || {}).textContent : '') || '',
        meta: a.dataset.meta || (fig ? ($('.label__meta', fig) || {}).textContent : '') || '',
        lang: fig && $('.label__title', fig) ? $('.label__title', fig).getAttribute('lang') : null,
      };
    };

    const show = (i) => {
      index = (i + group.length) % group.length;
      const item = group[index];
      img.classList.remove('is-shaded');
      img.alt = item.alt;
      img.src = item.src;
      title.textContent = item.title;
      if (item.lang) title.setAttribute('lang', item.lang); else title.removeAttribute('lang');
      meta.textContent = item.meta;
      count.textContent = group.length > 1 ? `${index + 1} of ${group.length}${chapterName ? ` · ${chapterName}` : ''}` : '';
      stepBtns.forEach((b) => { b.hidden = group.length < 2; });
      ready(img).then(() => {
        if (group[index] === item) requestAnimationFrame(() => img.classList.add('is-shaded'));
      });
      // warm the neighbours
      [index + 1, index - 1].forEach((n) => {
        const next = group[(n + group.length) % group.length];
        if (next) { const p = new Image(); p.src = next.src; }
      });
    };

    const openViewer = (items, i, name, from) => {
      group = items;
      chapterName = name || '';
      opener = from;
      show(i);
      document.documentElement.classList.add('has-viewer');
      viewer.showModal();
      $('.viewer__close', viewer).focus();
    };

    viewer.addEventListener('close', () => {
      document.documentElement.classList.remove('has-viewer');
      img.removeAttribute('src');
      if (opener) opener.focus({ preventScroll: true });
    });

    document.addEventListener('click', (e) => {
      const single = e.target.closest('[data-open-single]');
      if (single) {
        e.preventDefault();
        openViewer([itemFrom(single)], 0, '', single);
        return;
      }
      const a = e.target.closest('.work > a, .panorama__track > a');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const section = a.closest('section');
      const links = $$('.work > a, .panorama__track > a', section);
      const name = section ? (($('.chapter__title', section) || {}).textContent || '').trim() : '';
      openViewer(links.map(itemFrom), links.indexOf(a), name, a);
    });

    stepBtns.forEach((b) => b.addEventListener('click', () => show(index + Number(b.dataset.step))));
    $('.viewer__close', viewer).addEventListener('click', () => viewer.close());

    viewer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    });

    // click on the dark around the image closes
    stage.addEventListener('click', (e) => { if (e.target === stage) viewer.close(); });

    // swipe between pieces
    let sx = null, sy = null;
    stage.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = sy = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && group.length > 1) show(index + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- the Waltz book turns ---------- */
  const bookStage = $('[data-book]');
  if (bookStage) {
    const book = $('.book', bookStage);
    const buttons = $$('[data-turn]');
    const presets = buttons.map((b) => Number(b.dataset.turn));
    let ry = -24;

    const norm = (deg) => ((deg % 360) + 540) % 360 - 180;
    const setTurn = (deg) => {
      ry = deg;
      book.style.setProperty('--ry', `${deg}deg`);
      const n = norm(deg);
      let best = 0, bestD = Infinity;
      presets.forEach((p, i) => { const d = Math.abs(norm(n - p)); if (d < bestD) { bestD = d; best = i; } });
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === best && bestD < 40)));
    };

    buttons.forEach((b) => b.addEventListener('click', () => {
      // turn the short way round to the preset
      const target = Number(b.dataset.turn);
      setTurn(ry + norm(target - ry));
    }));

    let startX = 0, startRy = 0, dragging = false, moved = false;
    bookStage.addEventListener('dragstart', (e) => e.preventDefault());
    bookStage.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.pointerType === 'mouse') e.preventDefault();
      dragging = true; moved = false;
      startX = e.clientX; startRy = ry;
      bookStage.setPointerCapture(e.pointerId);
    });
    bookStage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 4) return;
      if (!moved) { moved = true; bookStage.classList.add('is-dragging', 'was-turned'); }
      setTurn(startRy + dx * 0.5);
    });
    const end = () => { dragging = false; bookStage.classList.remove('is-dragging'); };
    bookStage.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      bookStage.classList.add('was-turned');
      setTurn(ry + (e.key === 'ArrowRight' ? 45 : -45));
    });
    bookStage.addEventListener('pointerup', end);
    bookStage.addEventListener('pointercancel', end);

    // the first time it comes into view, the book is taken off the shelf: spine first
    if (!reduce && 'IntersectionObserver' in window) {
      book.style.transition = 'none';
      setTurn(78);
      const intro = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        intro.disconnect();
        requestAnimationFrame(() => {
          book.style.transition = 'transform 2.2s cubic-bezier(.16, 1, .3, 1) .35s';
          setTurn(-24);
          setTimeout(() => { book.style.transition = ''; }, 2700);
        });
      }, { threshold: 0.45 });
      intro.observe(bookStage);
    }
  }

  /* ---------- painting / cover comparison ---------- */
  $$('[data-compare]').forEach((box) => {
    const range = $('input[type="range"]', box);
    const set = () => box.style.setProperty('--pos', `${range.value}%`);
    range.addEventListener('input', set);
    set();
  });
})();
