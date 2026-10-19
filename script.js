/* Subrata Jana portfolio: vanilla JavaScript */
document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 1. Footer year */
document.getElementById('year').textContent = new Date().getFullYear();

/* 2. Typing animation in the hero code window (edit the text below) */
const codeText =
`const developer = {
  name: "Subrata Jana",
  role: "Web Developer",
  frontend: ["HTML5", "CSS3", "JavaScript", "Bootstrap"],
  backend: ["PHP", "MySQL"],
  learning: "every day",
  openTo: ["internships", "junior roles", "freelance"]
};`;
const codeEl = document.getElementById('typedCode');
if (reduceMotion) {
  codeEl.textContent = codeText;
} else {
  let i = 0;
  (function type() {
    codeEl.textContent = codeText.slice(0, ++i);
    if (i < codeText.length) setTimeout(type, 28);
  })();
}

/* 3. Reveal sections as they scroll into view */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

/* 4. Active nav link while scrolling */
const navLinks = document.querySelectorAll('.nav-link');
const sections = [...navLinks].map(l => document.querySelector(l.getAttribute('href')));
function setActive() {
  const y = window.scrollY + 120;
  let current = sections[0];
  sections.forEach(s => { if (s && s.offsetTop <= y) current = s; });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current.id));
}

/* 5. Back-to-top button */
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  setActive();
  toTop.classList.toggle('show', window.scrollY > 500);
}, { passive: true });
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
setActive();

/* 6. Close the mobile menu after choosing a link */
const menu = document.getElementById('navMenu');
navLinks.forEach(l => l.addEventListener('click', () => {
  if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
}));

/* 7. Placeholder project links do nothing until you add real URLs */
document.querySelectorAll('[data-placeholder]').forEach(a => a.addEventListener('click', e => {
  if (a.getAttribute('href') === '#') e.preventDefault();
}));

/* 8. Contact form: validation + mailto
   This opens the visitor's email app with the message filled in. It does NOT store messages.
   TO MAKE IT A REAL FORM (free options):
   a) Formspree: sign up at formspree.io, create a form, then set
      <form action="https://formspree.io/f/YOUR_ID" method="POST"> and remove the mailto code below.
   b) EmailJS or Web3Forms work the same way with their own setup steps.
   c) PHP: write a send-mail.php script and point the form action to it (needs PHP hosting; GitHub Pages cannot run PHP). */
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const rules = {
  name:    v => v.trim().length >= 2 || 'Enter your name.',
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address, like name@example.com.',
  subject: v => v.trim().length >= 3 || 'Enter a subject.',
  message: v => v.trim().length >= 10 || 'Write a message of at least 10 characters.'
};
function check(field) {
  const input = form.elements[field];
  const result = rules[field](input.value);
  document.getElementById('err-' + field).textContent = result === true ? '' : result;
  input.classList.toggle('invalid', result !== true);
  input.setAttribute('aria-invalid', result !== true);
  return result === true;
}
Object.keys(rules).forEach(f => form.elements[f].addEventListener('blur', () => check(f)));
form.addEventListener('submit', e => {
  e.preventDefault();
  const ok = Object.keys(rules).map(check).every(Boolean);
  if (!ok) { status.textContent = 'Fix the highlighted fields and try again.'; return; }
  const d = new FormData(form);
  const body = `Name: ${d.get('name')}\nEmail: ${d.get('email')}\n\n${d.get('message')}`;
  window.location.href = `mailto:digititanic@gmail.com?subject=${encodeURIComponent(d.get('subject'))}&body=${encodeURIComponent(body)}`;
  status.textContent = 'Your email app should open with the message ready to send.';
});
