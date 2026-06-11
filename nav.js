(function () {
  'use strict';
  var burger = document.getElementById('nav-burger');
  var overlay = document.getElementById('nav-mobile-overlay');
  var nav = document.getElementById('nav');
  if (!burger || !overlay) return;

  function openMenu() {
    overlay.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    if (nav) nav.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    if (nav) nav.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', function () {
    if (overlay.classList.contains('open')) closeMenu(); else openMenu();
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.closest('a, button')) closeMenu();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();
