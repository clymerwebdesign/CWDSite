(function () {
  'use strict';

  /* ---- Nav: top (navy) → scrolled (frosted) ---- */
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  function navState() {
    var threshold = (hero ? hero.offsetHeight : window.innerHeight) - 90;
    nav.setAttribute('data-state', window.scrollY > threshold ? 'scrolled' : 'top');
  }
  navState();
  window.addEventListener('scroll', navState, { passive: true });
  window.addEventListener('resize', navState);

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- 3D tilt toward cursor (lightweight) ---- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fine && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var rect = null, raf = null, tx = 0, ty = 0, lift = 0;
      function onMove(e) {
        rect = rect || card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        tx = (-py * 7).toFixed(2);
        ty = (px * 9).toFixed(2);
        lift = -6;
        schedule();
      }
      function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          card.style.transform = 'perspective(900px) rotateX(' + tx + 'deg) rotateY(' + ty + 'deg) translateY(' + lift + 'px)';
        });
      }
      card.addEventListener('mouseenter', function () { rect = card.getBoundingClientRect(); card.style.transition = 'transform .12s ease, box-shadow .3s ease'; });
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', function () {
        rect = null;
        card.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease';
        card.style.transform = '';
      });
    });
  }

  /* ---- Ticker: slow on hover, resume on leave — no position jump ---- */
  var tickerArea = document.querySelector('.tickers');
  if (tickerArea && !reduce) {
    var tracks = tickerArea.querySelectorAll('.ticker-track');
    var BASE = 46, SLOW = 80;
    var tDur = BASE, tRef = performance.now() / 1000, tProg = 0;
    function setTickerSpeed(newDur) {
      var now = performance.now() / 1000;
      var progress = (tProg + (now - tRef) / tDur) % 1;
      var delay = -(progress * newDur);
      tracks.forEach(function (t) {
        t.style.animationDuration = newDur + 's';
        t.style.animationDelay = delay + 's';
      });
      tDur = newDur; tRef = now; tProg = progress;
    }
    tickerArea.addEventListener('mouseenter', function () { setTickerSpeed(SLOW); });
    tickerArea.addEventListener('mouseleave', function () { setTickerSpeed(BASE); });
  }

  /* ---- Pause tickers when tab hidden (perf) ---- */
  document.addEventListener('visibilitychange', function () {
    var tracks = document.querySelectorAll('.ticker-track');
    tracks.forEach(function (t) { t.style.animationPlayState = document.hidden ? 'paused' : 'running'; });
  });
})();
