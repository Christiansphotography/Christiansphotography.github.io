/* Christian's Photography — site behaviour (no dependencies).
   1. Header: transparent over hero, solid cream after it   2. Mobile menu
   3. Hero slideshow   4. One-page portfolio categories (#sports / #weddings / #portraits)
   5. Sports filter   6. Lightbox (native <dialog>)
   Everything degrades gracefully: without JS every gallery panel is visible and links are plain anchors. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  /* ---------- 1 + 2. Header and mobile menu ---------- */
  var header = $('.site-header'), hero = $('.hero'), btn = $('.menu-btn'), nav = $('#site-nav');
  var pastHero = !hero;
  function paintHeader() {
    var open = btn && btn.getAttribute('aria-expanded') === 'true';
    header.classList.toggle('is-solid', pastHero || open);
  }
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      pastHero = !es[0].isIntersecting; paintHeader();
    }, { rootMargin: '-72px 0px 0px 0px', threshold: 0 }).observe(hero);
  } else if (hero) {
    var onScroll = function () { pastHero = window.scrollY > hero.offsetHeight - 72; paintHeader(); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  function setMenu(open) {
    if (!btn) return;
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    paintHeader();
  }
  if (btn) {
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 760) setMenu(false); });
  }
  paintHeader();

  /* ---------- 3. Hero slideshow ---------- */
  (function () {
    var slides = $$('.hero .slide');
    var controls = $('.hero-controls');
    if (slides.length < 2 || !controls) return;
    controls.hidden = false;
    var dotsWrap = $('.hero-dots'), cur = 0, timer = null, DELAY = 6000;
    var dots = slides.map(function (s, n) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', 'Show photo ' + (n + 1) + ' of ' + slides.length);
      d.addEventListener('click', function () { go(n); restart(); });
      dotsWrap.appendChild(d); return d;
    });
    function go(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === cur);
        s.setAttribute('aria-hidden', String(k !== cur));
        var im = s.querySelector('img'); if (im && k === cur) im.loading = 'eager';
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', String(k === cur)); });
      var nx = slides[(cur + 1) % slides.length].querySelector('img'); if (nx) nx.loading = 'eager';
    }
    function stop() { clearInterval(timer); timer = null; }
    function start() { if (!reduceMotion && !timer) timer = setInterval(function () { go(cur + 1); }, DELAY); }
    function restart() { stop(); start(); }
    $('.hero-arrow.prev').addEventListener('click', function () { go(cur - 1); restart(); });
    $('.hero-arrow.next').addEventListener('click', function () { go(cur + 1); restart(); });
    hero.addEventListener('mouseenter', stop); hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop); hero.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    var x0 = null;
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) { go(dx < 0 ? cur + 1 : cur - 1); restart(); }
    });
    go(0); start();
  })();

  /* ---------- 4. Portfolio categories on one page ---------- */
  var CATS = ['sports', 'weddings', 'portraits'], DEFAULT = 'sports';
  var panels = $$('.gallery-panel'), tiles = $$('.tile[data-cat]'), tabs = $$('.cat-switch a[data-cat]');
  var tileList = $('.tiles');
  function catFromHash() { var h = location.hash.replace('#', ''); return CATS.indexOf(h) > -1 ? h : null; }
  function select(cat) {
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-cat') !== cat; });
    tiles.forEach(function (t) {
      var on = t.getAttribute('data-cat') === cat;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
    tabs.forEach(function (t) { t.setAttribute('aria-current', String(t.getAttribute('data-cat') === cat)); });
    if (tileList) tileList.classList.add('has-active');
  }
  function scrollToPanel(cat) {
    var p = document.getElementById(cat); if (!p) return;
    p.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    try { p.focus({ preventScroll: true }); } catch (e) { /* old browsers */ }
  }
  function onCatClick(e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    var cat = this.getAttribute('data-cat') || this.getAttribute('href').slice(1);
    if (CATS.indexOf(cat) < 0) return;
    e.preventDefault();
    if (location.hash !== '#' + cat) history.pushState({ cat: cat }, '', '#' + cat);
    select(cat); scrollToPanel(cat);
  }
  $$('a[href="#sports"], a[href="#weddings"], a[href="#portraits"]').forEach(function (a) {
    a.addEventListener('click', onCatClick);
  });
  function fromHash() { var c = catFromHash(); if (c) { select(c); scrollToPanel(c); } }
  window.addEventListener('popstate', fromHash);     // back / forward
  window.addEventListener('hashchange', fromHash);   // typed or edited hash
  if (panels.length) {
    var initial = catFromHash();
    select(initial || DEFAULT);
    if (initial) {   // deep link: jump to that gallery once layout is ready
      window.addEventListener('load', function () { scrollToPanel(initial); });
      requestAnimationFrame(function () { scrollToPanel(initial); });
    }
  }

  /* ---------- 5. Filter buttons inside a panel (Sports: All / Football / Water polo) ---------- */
  $$('.filters').forEach(function (group) {
    var btns = $$('[data-filter]', group), scope = group.closest('.gallery-panel') || document;
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        btns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        $$('[data-lightbox] > li', scope).forEach(function (li) {
          li.hidden = !(f === 'all' || li.getAttribute('data-cat') === f);
        });
      });
    });
  });

  /* ---------- 6. Lightbox ---------- */
  var links = $$('[data-lightbox] a[href]');
  if (!links.length || typeof HTMLDialogElement !== 'function') return;
  var dlg = document.createElement('dialog');
  dlg.className = 'lb';
  dlg.setAttribute('aria-label', 'Photo viewer');
  dlg.innerHTML =
    '<div class="lb-top"><span class="lb-count" aria-live="polite"></span>' +
    '<button type="button" class="lb-close" aria-label="Close viewer">&times;</button></div>' +
    '<div class="lb-stage"><img alt=""></div>' +
    '<div class="lb-bottom"><button type="button" class="lb-prev" aria-label="Previous photo">&larr;</button>' +
    '<p class="lb-cap"></p>' +
    '<button type="button" class="lb-next" aria-label="Next photo">&rarr;</button></div>';
  document.body.appendChild(dlg);
  var img = $('img', dlg), cap = $('.lb-cap', dlg), count = $('.lb-count', dlg), i = 0, opener = null;
  function visible() { return links.filter(function (a) { return !a.closest('[hidden]'); }); }
  function show(n) {
    var set = visible(); if (!set.length) return;
    i = (n + set.length) % set.length;
    var a = set[i], t = $('img', a);
    img.src = a.getAttribute('href');
    img.alt = t ? t.alt : '';
    cap.textContent = t ? t.alt : '';
    count.textContent = (i + 1) + ' / ' + set.length;
    var nx = set[(i + 1) % set.length]; if (nx) { (new Image()).src = nx.getAttribute('href'); }
  }
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); opener = a;
      show(visible().indexOf(a)); dlg.showModal();
    });
  });
  $('.lb-close', dlg).addEventListener('click', function () { dlg.close(); });
  $('.lb-prev', dlg).addEventListener('click', function () { show(i - 1); });
  $('.lb-next', dlg).addEventListener('click', function () { show(i + 1); });
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
  $('.lb-stage', dlg).addEventListener('click', function (e) { if (e.target !== img) dlg.close(); });
  var x0 = null;
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
  });
  dlg.addEventListener('close', function () { img.removeAttribute('src'); if (opener) opener.focus({ preventScroll: true }); });
})();
