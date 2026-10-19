/* Subrata Jana portfolio: vanilla JavaScript (the 3D scene lives in three-background.js) */
document.documentElement.classList.add('js');
var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.getElementById('year').textContent = new Date().getFullYear();

/* 1. THEME TOGGLE
   The saved/OS theme is already applied by the small script in <head>. Here we handle clicks. */
var root = document.documentElement;
var toggle = document.getElementById('themeToggle');
function updateToggleLabel() {
  var dark = root.getAttribute('data-theme') === 'dark';
  toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
function setTheme(theme, save) {
  if (!reduceMotion) { root.classList.add('theme-anim'); setTimeout(function () { root.classList.remove('theme-anim'); }, 600); }
  root.setAttribute('data-theme', theme);
  if (save) { try { localStorage.setItem('theme', theme); } catch (e) {} }
  updateToggleLabel();
  document.dispatchEvent(new Event('themechange'));   // lets the 3D scene recolour itself
}
toggle.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true); });
updateToggleLabel();
// If the user never chose a theme, follow the OS when it changes
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
  var saved = null; try { saved = localStorage.getItem('theme'); } catch (err) {}
  if (!saved) setTheme(e.matches ? 'light' : 'dark', false);
});

/* 2. Reveal sections on scroll */
var revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  var rio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); rio.unobserve(e.target); } });
  }, { threshold: 0.12 });
  revealEls.forEach(function (el) { rio.observe(el); });
} else { revealEls.forEach(function (el) { el.classList.add('visible'); }); }

/* 3. Active nav link, back-to-top button */
var navLinks = document.querySelectorAll('.nav-link');
var sections = Array.prototype.map.call(navLinks, function (l) { return document.querySelector(l.getAttribute('href')); });
var toTop = document.getElementById('toTop');
function onScroll() {
  var y = window.scrollY + 120, current = sections[0];
  sections.forEach(function (s) { if (s && s.offsetTop <= y) current = s; });
  navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + current.id); });
  toTop.classList.toggle('show', window.scrollY > 500);
}
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

/* 4. Close the mobile menu after choosing a link */
var menu = document.getElementById('navMenu');
navLinks.forEach(function (l) { l.addEventListener('click', function () {
  if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
}); });

/* 5. Subtle 3D tilt on project cards (mouse only, off for reduced motion) */
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.tilt').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 8).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  });
}

/* 6. Placeholder project links do nothing until you add real URLs */
document.querySelectorAll('[data-placeholder]').forEach(function (a) {
  a.addEventListener('click', function (e) { if (a.getAttribute('href') === '#') e.preventDefault(); });
});

/* 7. CONTACT FORM: validation + mailto
   Right now the form only opens the visitor's email app with the message filled in. Nothing is saved or sent by the website.
   TO MAKE IT A REAL FORM (free options):
   a) Formspree: create a form at formspree.io, then use <form action="https://formspree.io/f/YOUR_ID" method="POST">
      and delete the mailto lines inside the submit handler below.
   b) Web3Forms or EmailJS work the same way with their own setup steps.
   c) PHP: write a send-mail.php and point the form action to it. This needs PHP hosting; GitHub Pages cannot run PHP. */
var form = document.getElementById('contactForm');
var statusEl = document.getElementById('formStatus');
var rules = {
  name: function (v) { return v.trim().length >= 2 || 'Enter your name.'; },
  email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address, like name@example.com.'; },
  subject: function (v) { return v.trim().length >= 3 || 'Enter a subject.'; },
  message: function (v) { return v.trim().length >= 10 || 'Write a message of at least 10 characters.'; }
};
function check(field) {
  var input = form.elements[field], result = rules[field](input.value);
  document.getElementById('err-' + field).textContent = result === true ? '' : result;
  input.classList.toggle('invalid', result !== true);
  input.setAttribute('aria-invalid', String(result !== true));
  return result === true;
}
Object.keys(rules).forEach(function (f) { form.elements[f].addEventListener('blur', function () { check(f); }); });
form.addEventListener('submit', function (e) {
  e.preventDefault();
  var ok = Object.keys(rules).map(check).every(Boolean);
  if (!ok) { statusEl.textContent = 'Fix the highlighted fields and try again.'; return; }
  var d = new FormData(form);
  var body = 'Name: ' + d.get('name') + '\nEmail: ' + d.get('email') + '\n\n' + d.get('message');
  window.location.href = 'mailto:digititanic@gmail.com?subject=' + encodeURIComponent(d.get('subject')) + '&body=' + encodeURIComponent(body);
  statusEl.textContent = 'Your email app should open with the message ready to send.';
});
