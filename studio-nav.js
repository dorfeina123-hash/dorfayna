(() => {
  const nav = document.querySelector('.unified-nav');
  const toggle = nav?.querySelector('.menu-toggle');
  if (!toggle) return;
  const close = () => { nav.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('menu-open')) { close(); toggle.focus(); }
  });
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 32);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
