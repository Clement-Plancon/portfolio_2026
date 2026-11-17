// Progressive enhancement of the one-page site. Without this script every fold is already flat
// and every project detail is open: nothing here is needed to read the content.
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
root.classList.add('js');
if (!reduceMotion.matches) root.classList.add('motion');

/* ---------- Table of contents (small screens) ---------- */
const menuButton = document.querySelector<HTMLButtonElement>('.top__menu');
const nav = document.getElementById('sommaire');
if (menuButton && nav) {
  menuButton.hidden = false;
  const setMenu = (open: boolean) => {
    menuButton.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
}

/* ---------- Active section in the header ---------- */
const navLinks = new Map([...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')].map((a) => [a.dataset.nav!, a]));
if (navLinks.size) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const [id, a] of navLinks) a.setAttribute('aria-current', String(id === e.target.id));
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const id of navLinks.keys()) {
    const s = document.getElementById(id);
    if (s) spy.observe(s);
  }
}

/* ---------- Folds that open once, when they come into view ---------- */
const folds = document.querySelectorAll<HTMLElement>('[data-fold], [data-unfold], [data-card]');
if (root.classList.contains('motion')) {
  const opener = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-flat');
        opener.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const el of folds) opener.observe(el);
} else {
  for (const el of folds) el.classList.add('is-flat');
}

/* ---------- Cover: the strip of projects unfolds with the scroll ---------- */
const strip = document.querySelector<HTMLElement>('[data-scrub]');
if (strip) {
  const stage = strip.parentElement!;
  const MAX = 70;
  let ticking = false;
  const update = () => {
    ticking = false;
    if (reduceMotion.matches) {
      strip.style.setProperty('--a', '0deg');
      return;
    }
    const r = stage.getBoundingClientRect();
    const vh = window.innerHeight;
    // Folded while the strip sits in the lower part of the screen (the first view); flat once it has risen to the top fifth.
    const progress = Math.min(1, Math.max(0, (vh * 0.72 - r.top) / (vh * 0.52)));
    const eased = 1 - (1 - progress) ** 2;
    strip.style.setProperty('--a', `${(MAX * (1 - eased)).toFixed(2)}deg`);
  };
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  reduceMotion.addEventListener('change', request);
  update();

  // A slight tilt under the pointer: the strip is an object on the desk.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const cover = stage.closest('section')!;
    cover.addEventListener('pointermove', (e) => {
      if (reduceMotion.matches) return;
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      strip.style.setProperty('--tx', (x * 6).toFixed(2));
      strip.style.setProperty('--ty', (-y * 4).toFixed(2));
    });
    cover.addEventListener('pointerleave', () => {
      strip.style.setProperty('--tx', '0');
      strip.style.setProperty('--ty', '0');
    });
  }
}

/* ---------- Projects: a folded map, each panel unfolds its detail under its row ---------- */
const map = document.querySelector<HTMLElement>('[data-map]');
if (map) {
  const panels = [...map.querySelectorAll<HTMLElement>('[data-panel]')];
  const flaps = [...map.querySelectorAll<HTMLElement>('[data-flap]')];
  const toggles = panels.map((p) => p.querySelector<HTMLButtonElement>('.panel__toggle')!);
  const idOf = (i: number) => panels[i].id.replace(/^projet-/, '');

  const columns = () => getComputedStyle(map).gridTemplateColumns.split(' ').filter(Boolean).length || 1;
  const layout = () => {
    const c = columns();
    panels.forEach((p, i) => {
      p.style.order = String(i * 2);
      p.dataset.col = String((i % c) + 1);
    });
    // A detail sits right after the last panel of its row.
    flaps.forEach((f, i) => {
      const rowEnd = Math.min(panels.length - 1, Math.floor(i / c) * c + c - 1);
      f.style.order = String(rowEnd * 2 + 1);
    });
  };

  const setOpen = (i: number, open: boolean) => {
    toggles[i].setAttribute('aria-expanded', String(open));
    panels[i].classList.toggle('is-open', open);
    flaps[i].classList.toggle('is-closed', !open);
    (flaps[i].firstElementChild as HTMLElement).inert = !open;
  };

  const open = (i: number, { scroll = false } = {}) => {
    for (let j = 0; j < toggles.length; j++) {
      if (j !== i && toggles[j].getAttribute('aria-expanded') === 'true') setOpen(j, false);
    }
    setOpen(i, true);
    history.replaceState(null, '', `#projet-${idOf(i)}`);
    if (scroll) panels[i].scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  };
  const close = (i: number) => {
    setOpen(i, false);
    history.replaceState(null, '', '#projets');
  };

  layout();
  addEventListener('resize', layout);
  // The details arrive open (readable without JS) and are folded here at once, without the folding
  // animation: otherwise the page keeps shrinking for a moment and a scroll to #projet-x lands too far.
  map.classList.add('is-settling');
  for (let i = 0; i < flaps.length; i++) setOpen(i, false);
  void map.offsetHeight;
  requestAnimationFrame(() => map.classList.remove('is-settling'));

  toggles.forEach((t, i) => {
    t.addEventListener('click', () => (t.getAttribute('aria-expanded') === 'true' ? close(i) : open(i)));
  });
  flaps.forEach((f, i) => {
    f.querySelector('[data-close]')?.addEventListener('click', () => {
      close(i);
      toggles[i].focus({ preventScroll: true });
      panels[i].scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    });
    const next = f.querySelector<HTMLButtonElement>('[data-next]');
    next?.addEventListener('click', () => {
      const j = panels.findIndex((p) => p.id === `projet-${next.dataset.next}`);
      if (j >= 0) {
        open(j, { scroll: true });
        toggles[j].focus({ preventScroll: true });
      }
    });
  });

  // #projet-x opens that project (links in the cover, shared links, back/forward).
  const fromHash = () => {
    const i = panels.findIndex((p) => `#${p.id}` === location.hash);
    if (i >= 0) {
      panels[i].classList.add('is-flat');
      open(i, { scroll: true });
    }
  };
  addEventListener('hashchange', fromHash);
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#projet-"]');
    if (!a) return;
    e.preventDefault();
    history.pushState(null, '', a.hash);
    fromHash();
    const i = panels.findIndex((p) => `#${p.id}` === a.hash);
    if (i >= 0) toggles[i].focus({ preventScroll: true });
  });
  if (location.hash.startsWith('#projet-')) fromHash();
}

/* ---------- Copy the e-mail address ---------- */
const copy = document.querySelector<HTMLButtonElement>('[data-copy]');
const copyStatus = document.querySelector<HTMLElement>('.card__status');
if (copy && navigator.clipboard) {
  copy.hidden = false;
  let timer = 0;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copy.dataset.copy!);
      if (copyStatus) copyStatus.textContent = 'Adresse copiée.';
    } catch {
      if (copyStatus) copyStatus.textContent = 'Copie impossible : sélectionnez l’adresse.';
    }
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (copyStatus) copyStatus.textContent = '';
    }, 3000);
  });
}
