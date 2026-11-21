// Progressive enhancement of the one-page site. Without this script the page is complete: every project
// article is printed under its project, every link is a plain anchor, the posters stay where they are.
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
root.classList.add('js');
// "still" (Site → Apparence): the same page without moving posters
const still = root.hasAttribute('data-still');
if (!reduceMotion.matches && !still) root.classList.add('motion');
const motion = () => !reduceMotion.matches && !still;
const finePointer = matchMedia('(pointer: fine)');

/* ---------- Where am I: the current part in the navigation, the header in its colours ---------- */
const header = document.querySelector<HTMLElement>('[data-top]');
const navLinks = new Map([...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')].map((a) => [a.dataset.nav!, a]));
const parts = [...document.querySelectorAll<HTMLElement>('[data-hero], [data-part]')];
const kinetics = [...document.querySelectorAll<HTMLElement>('[data-project]')].filter((el) => el.querySelector('[data-kinetic]'));
const hero = document.querySelector<HTMLElement>('[data-hero]');

let ticking = false;
let headTone = '';
const update = () => {
  ticking = false;
  const vh = innerHeight;
  root.classList.toggle('is-scrolled', scrollY > 8);
  // the part under the middle of the screen (navigation) and the one under the header (colours)
  let current = '';
  let under: HTMLElement | undefined;
  const headY = (header?.offsetHeight ?? 64) / 2;
  for (const p of parts) {
    const r = p.getBoundingClientRect();
    if (r.top <= vh * 0.45) current = p.id;
    if (r.top <= headY && r.bottom > headY) under = p;
  }
  for (const [id, a] of navLinks) a.setAttribute('aria-current', String(id === current));
  if (header && under && under.dataset.tone !== headTone) {
    headTone = under.dataset.tone ?? '';
    const cs = getComputedStyle(under);
    header.style.setProperty('--head-bg', cs.backgroundColor);
    header.style.setProperty('--head-fg', cs.color);
    header.style.setProperty('--head-solid', cs.backgroundColor);
  }
  if (!motion()) return;
  // the projects in large: how far each has come in (0 → 1), for its title that stretches and its poster
  for (const el of kinetics) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue;
    const k = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
    el.style.setProperty('--k', k.toFixed(3));
  }
  // the pile drifts apart as the introduction scrolls away
  if (hero) {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--out', Math.min(1, Math.max(0, -r.top / r.height)).toFixed(3));
  }
};
const request = () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(update);
  }
};
addEventListener('scroll', request, { passive: true });
addEventListener('resize', request);
update();

/* ---------- Things that come into place once ---------- */
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

/* ---------- The pile of posters: drag (mouse, pen), shuffle (button), open (click, tap) ---------- */
const pile = document.querySelector<HTMLElement>('[data-pile]');
if (pile) {
  const cards = [...pile.querySelectorAll<HTMLElement>('[data-pile-card]')];
  let zTop = cards.length + 1;
  const front = (card: HTMLElement) => card.style.setProperty('--z', String(++zTop));

  // Shuffle: the top poster goes to the bottom of the pile, the others come up.
  const shuffle = pile.querySelector<HTMLButtonElement>('[data-shuffle]');
  if (shuffle) {
    shuffle.hidden = false;
    shuffle.addEventListener('click', () => {
      const order = [...cards].sort((a, b) => Number(b.style.getPropertyValue('--z') || 0) - Number(a.style.getPropertyValue('--z') || 0));
      const topCard = order[0];
      for (const c of cards) {
        c.style.removeProperty('--dx');
        c.style.removeProperty('--dy');
      }
      const lift = () => {
        for (const [i, c] of order.slice(1).entries()) c.style.setProperty('--z', String(cards.length - i + 1));
        topCard.style.setProperty('--z', '1');
        zTop = cards.length + 1;
      };
      if (!motion()) {
        lift();
        return;
      }
      // the top poster slides out, goes under, and comes back
      topCard.animate([{ transform: 'none' }, { transform: 'translate(118%, -6%) rotate(14deg)', offset: 0.45 }, { transform: 'none' }], {
        duration: 720,
        easing: 'cubic-bezier(0.5, 0, 0.2, 1)',
      });
      setTimeout(lift, 320);
    });
  }

  // Drag: only with a mouse or a pen (on touch screens a finger scrolls the page).
  let drag: { card: HTMLElement; id: number; x: number; y: number; dx: number; dy: number; moved: boolean } | null = null;
  let suppressClick = false;
  for (const card of cards) {
    card.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0 || !motion()) return;
      const dx = Number.parseFloat(card.style.getPropertyValue('--dx')) || 0;
      const dy = Number.parseFloat(card.style.getPropertyValue('--dy')) || 0;
      drag = { card, id: e.pointerId, x: e.clientX, y: e.clientY, dx, dy, moved: false };
    });
    card.addEventListener('pointermove', (e) => {
      if (!drag || drag.card !== card || e.pointerId !== drag.id) return;
      const mx = e.clientX - drag.x;
      const my = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(mx, my) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        card.setPointerCapture(e.pointerId);
        card.classList.add('is-dragging');
        front(card);
      }
      card.style.setProperty('--dx', `${drag.dx + mx}px`);
      card.style.setProperty('--dy', `${drag.dy + my}px`);
    });
    const end = (e: PointerEvent) => {
      if (!drag || drag.card !== card || e.pointerId !== drag.id) return;
      if (drag.moved) suppressClick = true;
      card.classList.remove('is-dragging');
      drag = null;
    };
    card.addEventListener('pointerup', end);
    card.addEventListener('pointercancel', end);
    card.addEventListener(
      'click',
      (e) => {
        if (suppressClick) {
          e.preventDefault();
          e.stopImmediatePropagation();
          suppressClick = false;
        }
      },
      true,
    );
    card.addEventListener('dragstart', (e) => e.preventDefault());
  }

  // The pile leans towards the pointer (fine pointers only).
  if (finePointer.matches && motion() && hero) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      pile.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      pile.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
  }
}

/* ---------- The strip of the other projects: arrows for mouse users ---------- */
const strip = document.querySelector<HTMLElement>('[data-strip-list]');
const stripNav = document.querySelector<HTMLElement>('[data-strip-nav]');
if (strip && stripNav) {
  const [prev, next] = [...stripNav.querySelectorAll<HTMLButtonElement>('[data-strip]')];
  const sync = () => {
    const overflow = strip.scrollWidth > strip.clientWidth + 4;
    stripNav.hidden = !overflow;
    prev.disabled = strip.scrollLeft < 4;
    next.disabled = strip.scrollLeft + strip.clientWidth > strip.scrollWidth - 4;
  };
  for (const b of [prev, next]) {
    b.addEventListener('click', () => strip.scrollBy({ left: Number(b.dataset.strip) * strip.clientWidth * 0.8, behavior: motion() ? 'smooth' : 'auto' }));
  }
  strip.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  sync();
}

/* ---------- Projects: each one opens its article over the page ---------- */
const projectsEls = [...document.querySelectorAll<HTMLElement>('[data-project]')];
const dialogs = projectsEls.map((el) => el.querySelector<HTMLDialogElement>('[data-detail]')!);
const originOf = (i: number) => projectsEls[i].querySelector<HTMLElement>('[data-origin]') ?? projectsEls[i];
const linkOf = (i: number) => projectsEls[i].querySelector<HTMLAnchorElement>('[data-open]:not([tabindex="-1"])') ?? projectsEls[i].querySelector<HTMLAnchorElement>('[data-open]')!;
const indexOfHash = (hash: string) => projectsEls.findIndex((el) => `#${el.id}` === hash);
let current = -1;
let closing = false;

const insetOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return null;
  return `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px)`;
};
const FULL = 'inset(0px 0px 0px 0px)';
const EASE = 'cubic-bezier(0.7, 0, 0.2, 1)';

function show(i: number, { from = true } = {}) {
  const dlg = dialogs[i];
  if (current >= 0 && current !== i) dialogs[current].close();
  current = i;
  if (!dlg.open) dlg.showModal();
  root.classList.add('has-dialog');
  dlg.scrollTop = 0;
  // the article grows out of the poster
  const clip = from ? insetOf(originOf(i)) : null;
  if (motion()) {
    if (clip) dlg.animate([{ clipPath: clip }, { clipPath: FULL }], { duration: 700, easing: EASE });
    else dlg.animate([{ opacity: 0, transform: 'translateY(3rem)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.2, 0.85, 0.1, 1)' });
  }
  dlg.querySelector<HTMLElement>('[data-close]')?.focus({ preventScroll: true });
}

async function hide() {
  if (current < 0 || closing) return;
  const i = current;
  const dlg = dialogs[i];
  closing = true;
  const origin = originOf(i);
  const r = origin.getBoundingClientRect();
  if (r.top < 0 || r.bottom > innerHeight) projectsEls[i].scrollIntoView({ block: 'center', behavior: 'instant' });
  const clip = insetOf(origin);
  if (motion()) {
    const a = clip
      ? dlg.animate([{ clipPath: FULL }, { clipPath: clip }], { duration: 520, easing: EASE, fill: 'forwards' })
      : dlg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
    await a.finished.catch(() => {});
    dlg.close();
    a.cancel();
  } else {
    dlg.close();
  }
  root.classList.remove('has-dialog');
  current = -1;
  closing = false;
  linkOf(i).focus({ preventScroll: true });
}

// Opening adds #projet-x to the history (Back closes it); previous/next replace it; closing goes back.
function requestClose() {
  if (history.state?.project) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    hide();
  }
}

if (projectsEls.length) {
  projectsEls.forEach((el, i) => {
    for (const link of el.querySelectorAll<HTMLAnchorElement>('[data-open]')) {
      // the links inside the article itself are not openers
      if (link.closest('[data-detail]')) continue;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState({ project: true }, '', `#${el.id}`);
        show(i);
      });
    }
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
        // keep the page behind on the current project, so closing lands on it
        projectsEls[j].scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    });
  });

  addEventListener('popstate', () => {
    const i = indexOfHash(location.hash);
    if (i >= 0) show(i, { from: false });
    else hide();
  });

  // Links to #projet-x elsewhere (the pile of the introduction, other sites) open the article.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#projet-"]');
    if (!a || a.hasAttribute('data-open') || a.hasAttribute('data-go') || a.origin !== location.origin) return;
    const i = indexOfHash(a.hash);
    if (i < 0) return;
    e.preventDefault();
    history.pushState({ project: true }, '', a.hash);
    const clip = insetOf(a);
    projectsEls[i].scrollIntoView({ block: 'center', behavior: 'instant' });
    // from the poster that was clicked, when it is still on screen
    if (clip && motion()) {
      show(i, { from: false });
      for (const an of dialogs[i].getAnimations()) an.cancel();
      dialogs[i].animate([{ clipPath: clip }, { clipPath: FULL }], { duration: 700, easing: EASE });
    } else show(i, { from: false });
  });

  const initial = indexOfHash(location.hash);
  if (initial >= 0) {
    projectsEls[initial].scrollIntoView({ block: 'center', behavior: 'instant' });
    show(initial, { from: false });
  }
}

/* ---------- Videos: muted loops, a pause button, nothing plays by itself when motion is reduced ---------- */
for (const video of document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]')) {
  const button = video.parentElement?.querySelector<HTMLButtonElement>('[data-video-toggle]');
  const sync = () => {
    if (!button) return;
    button.setAttribute('aria-pressed', String(video.paused));
    button.setAttribute('aria-label', video.paused ? 'Lire la vidéo' : 'Mettre la vidéo en pause');
  };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => (video.paused ? video.play().catch(() => {}) : video.pause()));
  }
  if (!reduceMotion.matches) {
    // play only while on screen
    new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())).observe(video);
  }
  sync();
}

/* ---------- Copy the e-mail address ---------- */
const copy = document.querySelector<HTMLButtonElement>('[data-copy]');
const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');
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
