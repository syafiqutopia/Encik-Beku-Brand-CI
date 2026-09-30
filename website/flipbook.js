/* ── Flip-book viewer ─────────────────────────────────────────────
   Shared by the Service Catalogue (What we do) and the Company Profile (Who
   we are). Each book is a <dialog class="cb" data-dir data-pages>; the link
   that opens it carries data-flipbook="<dialog id>" and points at the PDF, so
   without this script or StPageFlip it simply opens the PDF.

   StPageFlip does the turning. This only builds the pages, sizes the book,
   wires the controls and keeps the count. */
(function () {
  if (!window.St) return;
  [].forEach.call(document.querySelectorAll('[data-flipbook]'), function (opener) {
    var dlg = document.getElementById(opener.getAttribute('data-flipbook'));
    if (dlg && dlg.showModal) setUp(opener, dlg);
  });

  function setUp(opener, dlg) {
    var PAGES = Number(dlg.dataset.pages), dir = dlg.dataset.dir;
    var book = dlg.querySelector('.cb-book'), count = dlg.querySelector('.cb-count');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)');
    var pages = [], flip = null, flipping = false;

    function url(n) { return dir + '/p' + (n < 10 ? '0' : '') + n + '.jpg'; }
    for (var n = 1; n <= PAGES; n++) {
      var pg = document.createElement('div'), im = document.createElement('img');
      pg.className = 'cb-page'; im.alt = ''; im.decoding = 'async';
      pg.appendChild(im); book.appendChild(pg); pages.push(pg);
    }
    // Only the pages around the one in view are fetched - a reader who opens the
    // book and closes it again should not have paid for every page. Never unset, so
    // a page seen once stays.
    function load(i) {
      for (var k = Math.max(0, i - 3); k <= Math.min(PAGES - 1, i + 4); k++) {
        var im = pages[k].firstChild;
        if (!im.getAttribute('src')) im.setAttribute('src', url(k + 1));
      }
    }
    // i is the library's 0-based index. With showCover the cover and the last
    // page stand alone; every spread in between starts on an odd index.
    function label(i) {
      if (flip.getOrientation() === 'portrait') return 'Page ' + (i + 1) + ' of ' + PAGES;
      if (i === 0) return 'Cover \u00b7 ' + PAGES + ' pages';
      var l = i % 2 ? i : i - 1, r = l + 1;
      return r >= PAGES ? 'Page ' + (l + 1) + ' of ' + PAGES
                        : 'Pages ' + (l + 1) + '\u2013' + (r + 1) + ' of ' + PAGES;
    }
    function refresh() {
      var i = flip.getCurrentPageIndex();
      load(i); count.textContent = label(i);
      dlg.querySelector('[data-step="-1"]').disabled = i <= 0;
      dlg.querySelector('[data-step="1"]').disabled = i >= PAGES - 1;
    }
    function build() {
      flip = new St.PageFlip(book, {
        width: 595, height: 842, size: 'stretch',
        minWidth: 300, maxWidth: 900, minHeight: 300, maxHeight: 1273,
        showCover: true, usePortrait: true, autoSize: false,
        flippingTime: 600, maxShadowOpacity: 0.35, mobileScrollSupport: false,
        useMouseEvents: !still.matches         // no drag-to-turn when motion is off
      });
      flip.on('flip', refresh);
      flip.on('changeOrientation', refresh);
      flip.on('changeState', function (e) { flipping = e.data === 'flipping'; });
      flip.loadFromHTML(pages);
      refresh();
    }
    // A click while a page is still turning is dropped, not queued: queued clicks
    // keep the book moving after the reader has stopped. One click, one turn.
    function turn(d) {
      if (flipping) return;
      if (still.matches) { d > 0 ? flip.turnToNextPage() : flip.turnToPrevPage(); refresh(); }
      else d > 0 ? flip.flipNext() : flip.flipPrev();
    }

    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) return dlg.close();                        // the surround
      if (e.target.closest('.cb-x')) return dlg.close();
      var b = e.target.closest('[data-step]');
      if (b) turn(Number(b.dataset.step));
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') turn(1);
      else if (e.key === 'ArrowLeft') turn(-1);
      else if (e.key === 'Home') { flip.turnToPage(0); refresh(); }
      else if (e.key === 'End') { flip.turnToPage(PAGES - 1); refresh(); }
      else return;
      e.preventDefault();
    });
    opener.addEventListener('click', function (e) {
      e.preventDefault();
      dlg.showModal();
      document.documentElement.style.overflow = 'hidden';   // showModal does not lock the page
      if (!flip) build();                                    // the box has a size only once open
    });
    dlg.addEventListener('close', function () { document.documentElement.style.overflow = ''; });
  }
})();
