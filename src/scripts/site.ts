// Progressive enhancements for the public site. Every page is complete without this script.
import { flap } from './flap';

// Netlify Identity e-mails (invitation, password reset) link to the site root: forward them to the admin.
if (/^#(invite_token|recovery_token|confirmation_token|email_change_token)=/.test(location.hash)) {
  location.replace(`/admin/${location.hash}`);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Light alternative for modest devices or data-saver mode: no flap animation.
const lowPower =
  (navigator.hardwareConcurrency ?? 8) <= 2 || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
const animate = !reducedMotion && !lowPower;

/* Copy e-mail address */
for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  btn.addEventListener('click', async () => {
    const label = btn.querySelector('[data-copy-label]');
    const status = btn.parentElement?.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(btn.dataset.copy ?? '');
      if (label) label.textContent = 'Adresse copiée';
      if (status) status.textContent = 'Adresse e-mail copiée dans le presse-papiers';
    } catch {
      if (label) label.textContent = 'Copie impossible';
    }
    setTimeout(() => {
      if (label) label.textContent = "Copier l'adresse";
    }, 2400);
  });
}

/* Project board: split-flap names when the board comes into view, summary strip on hover/focus. */
// The board flips once per page and per visit: coming back to it should not replay the show.
const seenKey = `flap:${location.pathname}`;
let seen = false;
try {
  seen = sessionStorage.getItem(seenKey) === '1';
  sessionStorage.setItem(seenKey, '1');
} catch {
  /* storage unavailable: animate every time */
}
for (const board of document.querySelectorAll<HTMLElement>('[data-board]')) {
  if (animate && !seen) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        board.querySelectorAll<HTMLElement>('.flaps').forEach((el, i) => {
          flap(el, i * 70);
        });
      },
      { threshold: 0.15 },
    );
    io.observe(board);
  }

  const strip = board.querySelector<HTMLElement>('[data-strip]');
  const stripCode = board.querySelector<HTMLElement>('[data-strip-code]');
  const stripText = board.querySelector<HTMLElement>('[data-strip-text]');
  const rows = [...board.querySelectorAll<HTMLAnchorElement>('[data-row]')];
  const show = (row: HTMLAnchorElement) => {
    if (!strip || !stripText || !stripCode || row.classList.contains('is-active')) return;
    for (const r of rows) r.classList.toggle('is-active', r === row);
    strip.setAttribute('style', row.getAttribute('style') ?? '');
    stripCode.textContent = row.dataset.code ?? '';
    stripText.textContent = row.dataset.summary ?? '';
    if (animate) {
      strip.animate([{ transform: 'rotateX(70deg)', opacity: 0.2 }, { transform: 'none', opacity: 1 }], {
        duration: 180,
        easing: 'cubic-bezier(.2,.7,.2,1)',
      });
    }
  };
  for (const row of rows) {
    row.addEventListener('pointerenter', () => show(row));
    row.addEventListener('focus', () => show(row));
  }
  board.addEventListener('pointerleave', () => {
    for (const r of rows) r.classList.remove('is-active');
  });
}

/* Project page "line map": mark the stop (section) currently being read. */
const route = document.querySelector<HTMLElement>('[data-route]');
if (route) {
  const links = new Map(
    [...route.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => [a.hash.slice(1), a]),
  );
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter((s): s is HTMLElement => !!s);
  const setHere = (id: string) => {
    for (const [key, a] of links) {
      if (key === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
    links.get(id)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: animate ? 'smooth' : 'auto' });
  };
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setHere(visible[0].target.id);
    },
    { rootMargin: '-25% 0px -65% 0px' },
  );
  for (const s of sections) io.observe(s);
}
