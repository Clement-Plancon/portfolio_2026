// Progressive enhancement of the one-page site. Without this script every project article is printed
// under its line and every link is a plain anchor: nothing here is needed to read the content.
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
root.classList.add('js');
if (!reduceMotion.matches) root.classList.add('motion');
const motion = () => !reduceMotion.matches;

/* ---------- Table of contents on phones ---------- */
const menuButton = document.querySelector<HTMLButtonElement>('.top__menu');
const nav = document.getElementById('sommaire');
const setMenu = (open: boolean) => {
  if (!menuButton || !nav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  root.classList.toggle('menu-open', open);
};
if (menuButton && nav) {
  menuButton.hidden = false;
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
  matchMedia('(min-width: 48rem)').addEventListener('change', () => setMenu(false));
}

/* ---------- Header: current section, hides while reading down, returns when scrolling up ---------- */
const navLinks = new Map([...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')].map((a) => [a.dataset.nav!, a]));
if (navLinks.size) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const [id, a] of navLinks) a.setAttribute('aria-current', String(id === e.target.id));
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  for (const id of navLinks.keys()) {
    const s = document.getElementById(id);
    if (s) spy.observe(s);
  }
}
const header = document.querySelector<HTMLElement>('[data-top]');
let lastY = scrollY;
let ticking = false;
const onScroll = () => {
  ticking = false;
  const y = scrollY;
  root.classList.toggle('is-scrolled', y > 8);
  const busy = root.classList.contains('menu-open') || header?.contains(document.activeElement);
  if (busy || y < innerHeight * 0.6 || y < lastY - 6) root.classList.remove('header-hidden');
  else if (y > lastY + 6) root.classList.add('header-hidden');
  lastY = y;
};
addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true },
);
header?.addEventListener('focusin', () => root.classList.remove('header-hidden'));
onScroll();

/* ---------- Elements that rise into place once ---------- */
const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (root.classList.contains('motion') && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const el of reveals) io.observe(el);
} else {
  for (const el of reveals) el.classList.add('is-in');
}

/* ---------- Projects: each line opens its article over the page ---------- */
const items = [...document.querySelectorAll<HTMLElement>('[data-project]')];
const dialogs = items.map((el) => el.querySelector<HTMLDialogElement>('[data-detail]')!);
const rowOf = (i: number) => items[i].querySelector<HTMLElement>('.pj__row')!;
const linkOf = (i: number) => items[i].querySelector<HTMLAnchorElement>('[data-open]')!;
const indexOfHash = (hash: string) => items.findIndex((el) => `#${el.id}` === hash);
let current = -1;
let closing = false;

// The clip of the line on screen, as an inset of the viewport: the article grows out of it.
const insetOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return null;
  return `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px)`;
};
const FULL = 'inset(0px 0px 0px 0px)';
const EASE = 'cubic-bezier(0.65, 0, 0.25, 1)';

function show(i: number, { from = true } = {}) {
  const dlg = dialogs[i];
  if (current >= 0 && current !== i) {
    dialogs[current].close();
    dialogs[current].querySelectorAll('.plate').forEach((p) => {
    p.classList.remove('is-open');
  });
  }
  current = i;
  if (!dlg.open) dlg.showModal();
  root.classList.add('has-dialog');
  dlg.scrollTop = 0;
  const clip = from ? insetOf(rowOf(i)) : null;
  if (motion()) {
    if (clip) dlg.animate([{ clipPath: clip }, { clipPath: FULL }], { duration: 760, easing: EASE });
    else dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
  }
  // The plate spreads its layers once the article has settled.
  window.setTimeout(() => dlg.querySelectorAll('.plate').forEach((p) => {
    p.classList.add('is-open');
  }), motion() ? 420 : 0);
  dlg.querySelector<HTMLElement>('[data-close]')?.focus({ preventScroll: true });
}

async function hide({ animate = true } = {}) {
  if (current < 0 || closing) return;
  const i = current;
  const dlg = dialogs[i];
  closing = true;
  // Bring the line under the article first, so it closes back into it.
  const row = rowOf(i);
  const r = row.getBoundingClientRect();
  if (r.top < 0 || r.bottom > innerHeight) row.scrollIntoView({ block: 'center', behavior: 'instant' });
  const clip = insetOf(row);
  if (animate && motion()) {
    const a = clip
      ? dlg.animate([{ clipPath: FULL }, { clipPath: clip }], { duration: 560, easing: EASE, fill: 'forwards' })
      : dlg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
    await a.finished.catch(() => {});
    dlg.close();
    a.cancel();
  } else {
    dlg.close();
  }
  dlg.querySelectorAll('.plate').forEach((p) => {
    p.classList.remove('is-open');
  });
  root.classList.remove('has-dialog');
  current = -1;
  closing = false;
  linkOf(i).focus({ preventScroll: true });
}

// Addresses: opening a project from its line adds #projet-x to the history (Back closes it);
// previous/next replace it; closing goes back to #projets.
function requestClose() {
  if (history.state?.project) history.back();
  else {
    history.replaceState(null, '', '#projets');
    hide();
  }
}

if (items.length) {
  items.forEach((_, i) => {
    linkOf(i).addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState({ project: true }, '', `#${items[i].id}`);
      show(i);
    });
    const dlg = dialogs[i];
    dlg.addEventListener('cancel', (e) => {
      e.preventDefault();
      requestClose();
    });
    dlg.addEventListener('click', (e) => {
      const t = e.target as Element;
      if (t.closest('[data-close]')) {
        requestClose();
        return;
      }
      const go = t.closest<HTMLAnchorElement>('a[data-go]');
      if (go) {
        e.preventDefault();
        const j = indexOfHash(go.hash);
        if (j < 0) return;
        history.replaceState(history.state, '', go.hash);
        show(j, { from: false });
        // Keep the page behind on the current project, so closing lands on it.
        rowOf(j).scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    });
  });

  addEventListener('popstate', () => {
    const i = indexOfHash(location.hash);
    if (i >= 0) show(i, { from: false });
    else hide();
  });

  // Links to #projet-x elsewhere on the page (or from another site) open the article.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#projet-"]');
    if (!a || a.hasAttribute('data-open') || a.hasAttribute('data-go') || a.origin !== location.origin) return;
    const i = indexOfHash(a.hash);
    if (i < 0) return;
    e.preventDefault();
    history.pushState({ project: true }, '', a.hash);
    show(i, { from: false });
  });

  const initial = indexOfHash(location.hash);
  if (initial >= 0) {
    rowOf(initial).scrollIntoView({ block: 'center', behavior: 'instant' });
    show(initial, { from: false });
  }
}

/* ---------- Preview under the pointer (desktop) ---------- */
if (items.length && finePointer.matches) {
  const peek = document.createElement('div');
  peek.className = 'peek';
  peek.setAttribute('aria-hidden', 'true');
  document.body.append(peek);
  let x = 0;
  let y = 0;
  let px = 0;
  let py = 0;
  let raf = 0;
  let active = false;
  let titleEnd = 0;
  const place = () => {
    const w = peek.offsetWidth;
    const h = peek.offsetHeight;
    // Beyond the end of the title being read (or beside the pointer), always inside the window.
    const tx = Math.min(innerWidth - w - 16, Math.max(16, x + 28, titleEnd + 32));
    const ty = Math.min(innerHeight - h - 16, Math.max(16, y - h / 2));
    if (motion()) {
      px += (tx - px) * 0.16;
      py += (ty - py) * 0.16;
    } else {
      px = tx;
      py = ty;
    }
    peek.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
    raf = active || Math.abs(tx - px) > 0.5 ? requestAnimationFrame(place) : 0;
  };
  addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX;
      y = e.clientY;
    },
    { passive: true },
  );
  items.forEach((el, i) => {
    const row = rowOf(i);
    row.addEventListener('pointerenter', (e) => {
      const source = dialogs[i].querySelector('.feat__shot img, .feat__plate .plate');
      if (!source) return;
      const clone = source.cloneNode(true) as HTMLElement;
      if (clone.tagName === 'IMG') (clone as HTMLImageElement).loading = 'eager';
      peek.replaceChildren(clone);
      peek.style.setProperty('--tint-d', el.style.getPropertyValue('--tint-d'));
      peek.style.setProperty('--tint-l', el.style.getPropertyValue('--tint-l'));
      const range = document.createRange();
      range.selectNodeContents(linkOf(i));
      titleEnd = range.getBoundingClientRect().right;
      if (!active) {
        x = e.clientX;
        y = e.clientY;
        px = Math.min(innerWidth - 400, Math.max(x + 28, titleEnd + 32));
        py = y - 150;
      }
      active = true;
      peek.classList.add('is-on');
      requestAnimationFrame(() => clone.classList?.add('is-open'));
      if (!raf) raf = requestAnimationFrame(place);
    });
    row.addEventListener('pointerleave', () => {
      active = false;
      peek.classList.remove('is-on');
    });
  });
  addEventListener('scroll', () => {
    if (!active) return;
    active = false;
    peek.classList.remove('is-on');
  }, { passive: true });
}

/* ---------- Copy the e-mail address ---------- */
const copy = document.querySelector<HTMLButtonElement>('[data-copy]');
const copyStatus = document.querySelector<HTMLElement>('.contact__status');
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
