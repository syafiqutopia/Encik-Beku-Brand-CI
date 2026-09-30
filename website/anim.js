/* ─────────────────────────────────────────────────────────────
 * Encik Beku — scroll reveals
 *
 * Reproduces the praxis4.vercel.app motion language in ~90 lines of
 * vanilla JS instead of its stack (GSAP + ScrollTrigger + SplitText +
 * CustomEase + Lenis + Swup, ~150KB). Matched to their actual values,
 * read from their bundle:
 *
 *   ease          easeOutQuart = cubic-bezier(.165, .84, .44, 1)
 *   masked lines  y:100%, stagger 0.1s, duration 1.2s, at "center 90%"
 *   block rise    yPercent:111, duration 0.8s, at "top 90%"
 *   image clip    duration ~2s (trimmed to 1.6s here — 2s on a page this
 *                 dense reads as sluggish rather than considered)
 *
 * Not reproduced deliberately: Lenis smooth-scroll hijacking (it fights
 * trackpads and breaks find-in-page) and Swup page transitions (this is a
 * four-page static site; a transition library would be the heaviest thing
 * on it).
 *
 * FAILURE BEHAVIOUR: the reveal styles are scoped to .has-anim on <html>,
 * which only this script sets. If it never runs, nothing is ever hidden
 * and the page is simply static — content is never trapped invisible.
 * ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var root = document.documentElement;

  // Reduced motion: opt out entirely rather than shortening durations.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  root.classList.add('has-anim');

  /* ── Split a plain-text element into per-line masks ───────────
   * Mirrors SplitText({type:"lines", mask:"lines"}): each visual line
   * gets an overflow-hidden wrapper so the text can slide in from below
   * its own baseline rather than fading in place.
   * Only safe on plain-text elements — it discards inline markup, so it
   * is applied solely to headings tagged data-anim="lines".
   */
  function splitLines(el) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return false;

    var probes = text.split(' ').map(function (w) {
      var s = document.createElement('span');
      s.style.display = 'inline-block';
      s.textContent = w;
      return s;
    });

    el.textContent = '';
    probes.forEach(function (s, i) {
      el.appendChild(s);
      if (i < probes.length - 1) el.appendChild(document.createTextNode(' '));
    });

    // Group words by their vertical offset — that is where lines break.
    var lines = [], top = null, cur = null;
    probes.forEach(function (s) {
      if (s.offsetTop !== top) { top = s.offsetTop; cur = []; lines.push(cur); }
      cur.push(s.textContent);
    });

    el.textContent = '';
    lines.forEach(function (words, i) {
      var mask = document.createElement('span');
      mask.className = 'anim-line';
      var inner = document.createElement('span');
      inner.className = 'anim-line-i';
      inner.style.transitionDelay = (i * 0.1) + 's';   // their stagger
      inner.textContent = words.join(' ');
      mask.appendChild(inner);
      el.appendChild(mask);
    });
    return true;
  }

  document.querySelectorAll('[data-anim="lines"]').forEach(function (el) {
    if (!splitLines(el)) el.removeAttribute('data-anim');
  });

  // Stagger children of a group, capped so a long list does not crawl.
  document.querySelectorAll('[data-anim="stagger"]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.transitionDelay = Math.min(i * 0.08, 0.48) + 's';
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);          // reveal once, never re-hide
    });
  }, {
    // Their triggers fire around "center 90%" / "top 90%" — roughly when
    // the element is a tenth of the way into the viewport.
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.01
  });

  function observe(scope) {
    (scope || document).querySelectorAll('[data-anim]').forEach(function (el) {
      if (!el.classList.contains('is-in')) io.observe(el);
    });
  }
  observe();

  /* The tabbed preview build hides whole panels with [hidden]; an element
     inside one never intersects, so it would stay invisible after a tab
     switch. The preview calls this after showing a panel. */
  window.__ebAnimRefresh = function (scope) {
    (scope || document).querySelectorAll('[data-anim]:not(.is-in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      else io.observe(el);
    });
  };

  // Re-split headings on resize: line breaks move with the column width.
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      document.querySelectorAll('[data-anim="lines"].is-in').forEach(function (el) {
        el.querySelectorAll('.anim-line-i').forEach(function (i) { i.style.transitionDelay = '0s'; });
      });
    }, 200);
  });
})();
