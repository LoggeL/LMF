// Logge Media Forge — interactions

(function () {
  'use strict';

  /* ---- LMF rotating meanings ---- */
  (function () {
    var el = document.getElementById('lmf-rotator');
    if (!el) return;
    var meanings = [
      'Logge Media Forge',
      "Let's Make Fun",
      'Lights, Motion, Film',
      'Learning Machines & Frames',
      'Lovingly Made Films',
      'Logic Meets Flair'
    ];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canAnimate = typeof el.animate === 'function' && !reduce;
    var i = 0;
    el.textContent = meanings[0];

    var EASE_OUT = 'cubic-bezier(0.4, 0, 1, 1)';
    var EASE_IN = 'cubic-bezier(0.16, 1, 0.3, 1)';

    function next() {
      i = (i + 1) % meanings.length;
      if (!canAnimate) { el.textContent = meanings[i]; return; }
      el.animate(
        [{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
         { opacity: 0, transform: 'translateY(-10px)', filter: 'blur(3px)' }],
        { duration: 380, easing: EASE_OUT, fill: 'forwards' }
      ).onfinish = function () {
        el.textContent = meanings[i];
        el.animate(
          [{ opacity: 0, transform: 'translateY(12px)', filter: 'blur(3px)' },
           { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }],
          { duration: 520, easing: EASE_IN, fill: 'forwards' }
        );
      };
    }

    setInterval(next, 3200);
  })();

  /* ---- Nav shadow on scroll ---- */
  var nav = document.getElementById('nav');
  var onScroll = function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Scroll reveal ---- */
  var revealIO = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;

  function revealObserve(nodes) {
    if (!revealIO) { nodes.forEach(function (n) { n.classList.add('in'); }); return; }
    nodes.forEach(function (n) { revealIO.observe(n); });
  }

  revealObserve(document.querySelectorAll('.reveal'));

  /* ---- Footer year ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Project preview modal ---- */
  var modal = (function () {
    var el = document.getElementById('modal');
    if (!el) return null;
    var media = document.getElementById('modal-media');
    var cat = document.getElementById('modal-cat');
    var title = document.getElementById('modal-title');
    var desc = document.getElementById('modal-desc');
    var tags = document.getElementById('modal-tags');
    var visit = document.getElementById('modal-visit');
    var lastFocus = null;

    function open(p, base) {
      lastFocus = document.activeElement;
      media.innerHTML = '';
      var pic = document.createElement('picture');
      [['avif', 'image/avif'], ['webp', 'image/webp']].forEach(function (f) {
        var s = document.createElement('source');
        s.srcset = base + '.' + f[0]; s.type = f[1]; pic.appendChild(s);
      });
      var img = document.createElement('img');
      img.src = base + '.jpg'; img.alt = p.title;
      pic.appendChild(img);
      media.appendChild(pic);

      cat.textContent = p.category;
      title.textContent = p.title;
      desc.textContent = p.description || '';
      tags.innerHTML = '';
      (p.tags || []).forEach(function (t) {
        var s = document.createElement('span');
        s.className = 'modal-tag'; s.textContent = t; tags.appendChild(s);
      });
      visit.href = p.link;

      el.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { el.classList.add('open'); });
      visit.focus();
    }

    function close() {
      el.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { el.hidden = true; }, 250);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    el.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.hidden) close();
    });
    return { open: open };
  })();

  /* ---- Projects ---- */
  var grid = document.getElementById('project-grid');
  if (grid) initProjects(grid);

  function initProjects(grid) {
    var filterBar = document.getElementById('filter-bar');
    var countEl = document.getElementById('project-count');
    var emptyEl = document.getElementById('project-empty');
    var fallbackEl = document.getElementById('project-fallback');

    var GROUP_ORDER = ['Websites', 'Games', 'Movies', 'Data', 'AI', 'Apps'];
    var all = [];
    var activeGroup = 'All';

    fetch('data/projects.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(render)
      .catch(showFallback);

    function groupOf(category) {
      var c = (category || '').toLowerCase();
      if (/movie|aftermovie|film/.test(c)) return 'Movies';
      if (/game|multiplayer/.test(c)) return 'Games';
      if (/\bai\b|a\.i\./.test(c)) return 'AI';
      if (/data science/.test(c)) return 'Data';
      if (/sport/.test(c)) return 'Apps';
      return 'Websites';
    }

    function render(data) {
      all = data.map(function (p) { p._group = groupOf(p.category); return p; });
      if (countEl) countEl.textContent = all.length;
      grid.setAttribute('aria-busy', 'false');
      buildFilters();
      draw();
    }

    function buildFilters() {
      if (!filterBar) return;
      var present = {};
      all.forEach(function (p) { present[p._group] = true; });
      var groups = ['All'].concat(GROUP_ORDER.filter(function (g) { return present[g]; }));
      groups.forEach(function (g) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'filter-chip' + (g === activeGroup ? ' active' : '');
        b.textContent = g;
        b.addEventListener('click', function () {
          if (g === activeGroup) return;
          activeGroup = g;
          Array.prototype.forEach.call(filterBar.children, function (c) {
            c.classList.toggle('active', c.textContent === g);
          });
          switchTo();
        });
        filterBar.appendChild(b);
      });
    }

    function draw() {
      var list = activeGroup === 'All'
        ? all
        : all.filter(function (p) { return p._group === activeGroup; });

      grid.innerHTML = '';
      if (emptyEl) emptyEl.hidden = list.length !== 0;
      list.forEach(function (p, i) { grid.appendChild(card(p, i)); });
      revealObserve(grid.querySelectorAll('.reveal'));
    }

    function switchTo() {
      var current = grid.querySelectorAll('.project');
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!current.length || reduce) { draw(); return; }
      grid.classList.add('is-leaving');
      setTimeout(function () {
        draw();
        grid.classList.remove('is-leaving');
      }, 240);
    }

    function card(p, i) {
      var base = 'assets/img/' + p.picture.split('/').pop();

      var a = document.createElement('a');
      a.className = 'project reveal';
      a.href = p.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = p.description || p.title;
      a.style.transitionDelay = Math.min(i, 9) * 45 + 'ms';

      var media = document.createElement('div');
      media.className = 'project-media';
      var pic = document.createElement('picture');
      pic.appendChild(source(base + '.avif', 'image/avif'));
      pic.appendChild(source(base + '.webp', 'image/webp'));
      var img = document.createElement('img');
      img.src = base + '.jpg';
      img.alt = p.title;
      img.loading = 'lazy';
      pic.appendChild(img);
      media.appendChild(pic);

      var open = document.createElement('span');
      open.className = 'project-open';
      open.textContent = 'Preview';
      media.appendChild(open);

      if (modal) {
        a.addEventListener('click', function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
          e.preventDefault();
          modal.open(p, base);
        });
      }

      var overlay = document.createElement('div');
      overlay.className = 'project-overlay';
      var cat = document.createElement('span');
      cat.className = 'project-cat';
      cat.textContent = p.category;
      var name = document.createElement('h3');
      name.className = 'projectName';
      name.textContent = p.title;
      overlay.appendChild(cat);
      overlay.appendChild(name);
      media.appendChild(overlay);

      a.appendChild(media);
      return a;
    }

    function source(srcset, type) {
      var s = document.createElement('source');
      s.srcset = srcset;
      s.type = type;
      return s;
    }

    function showFallback() {
      grid.innerHTML = '';
      grid.setAttribute('aria-busy', 'false');
      if (countEl) countEl.textContent = 'My';
      if (fallbackEl) fallbackEl.hidden = false;
    }
  }
})();
