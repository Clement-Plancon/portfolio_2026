// Progressive enhancement of the one-page site. Without this script the page is complete: every project
// article is printed under its scene, every link is a plain anchor, the threads are drawn as SVG.
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
root.classList.add('js');
if (!reduceMotion.matches) root.classList.add('motion');
const motion = () => !reduceMotion.matches;

/* ---------- Where am I: current section in the navigation, act and project in the marker ---------- */
const navLinks = new Map([...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')].map((a) => [a.dataset.nav!, a]));
const where = document.querySelector<HTMLElement>('[data-where]');
// The acts, as the page declares them (their number and name come from the content).
const acts = [...document.querySelectorAll<HTMLElement>('[data-act]')].map((el) => ({ id: el.id, el, act: el.dataset.act! }));
const projectsEls = [...document.querySelectorAll<HTMLElement>('[data-project]')];
const railLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-rail] a')];
const gallery = document.getElementById('projets');

let ticking = false;
const update = () => {
  ticking = false;
  const mid = innerHeight * 0.45;
  root.classList.toggle('is-scrolled', scrollY > 8);
  // the section under the middle of the screen
  let current = 'top';
  let act = '01 — Découverte';
  for (const a of acts) {
    if (a.el.getBoundingClientRect().top <= mid) {
      current = a.id;
      act = a.act;
    }
  }
  // skills right after the path are reached through it in the navigation
  const navId = navLinks.has(current) ? current : current === 'competences' ? 'parcours' : current;
  for (const [id, a] of navLinks) a.setAttribute('aria-current', String(id === navId));
  // the project under the middle of the screen
  let project = -1;
  projectsEls.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) project = i;
  });
  railLinks.forEach((a, i) => {
    a.setAttribute('aria-current', String(i === project));
  });
  if (gallery) {
    const r = gallery.getBoundingClientRect();
    root.classList.toggle('in-gallery', project >= 0 && r.top < innerHeight * 0.2 && r.bottom > innerHeight * 0.6);
  }
  if (where) {
    const name = project >= 0 ? projectsEls[project].querySelector('[data-open]')?.textContent?.trim() : '';
    where.textContent = name ? `${act} · ${name}` : act;
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

/* ---------- Rail and quick index: go to a project's scene ---------- */
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-jump]');
  if (!a) return;
  // The index above the gallery opens the article at once; the rail scrolls to the scene.
  if (!a.closest('[data-rail]')) return;
  e.preventDefault();
  const el = document.getElementById(`projet-${a.dataset.jump}`);
  el?.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto', block: 'start' });
});

/* ---------- Projects: each scene opens its article over the page ---------- */
const dialogs = projectsEls.map((el) => el.querySelector<HTMLDialogElement>('[data-detail]')!);
const originOf = (i: number) => projectsEls[i].querySelector<HTMLElement>('[data-origin]') ?? projectsEls[i];
const linkOf = (i: number) => projectsEls[i].querySelector<HTMLAnchorElement>('[data-open]')!;
const indexOfHash = (hash: string) => projectsEls.findIndex((el) => `#${el.id}` === hash);
let current = -1;
let closing = false;

const insetOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return null;
  return `inset(${Math.max(0, r.top)}px ${Math.max(0, innerWidth - r.right)}px ${Math.max(0, innerHeight - r.bottom)}px ${Math.max(0, r.left)}px round 12px)`;
};
const FULL = 'inset(0px 0px 0px 0px round 0px)';
const EASE = 'cubic-bezier(0.65, 0, 0.25, 1)';

function show(i: number, { from = true } = {}) {
  const dlg = dialogs[i];
  if (current >= 0 && current !== i) dialogs[current].close();
  current = i;
  if (!dlg.open) dlg.showModal();
  root.classList.add('has-dialog');
  dlg.scrollTop = 0;
  const clip = from ? insetOf(originOf(i)) : null;
  if (motion()) {
    if (clip) dlg.animate([{ clipPath: clip }, { clipPath: FULL }], { duration: 800, easing: EASE });
    else dlg.animate([{ opacity: 0, transform: 'translateY(2rem)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22, 0.8, 0.12, 1)' });
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
  if (r.top < 0 || r.bottom > innerHeight) projectsEls[i].scrollIntoView({ block: 'start', behavior: 'instant' });
  const clip = insetOf(origin);
  if (motion()) {
    const a = clip
      ? dlg.animate([{ clipPath: FULL }, { clipPath: clip }], { duration: 600, easing: EASE, fill: 'forwards' })
      : dlg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
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
        projectsEls[j].scrollIntoView({ block: 'start', behavior: 'instant' });
      }
    });
  });

  addEventListener('popstate', () => {
    const i = indexOfHash(location.hash);
    if (i >= 0) show(i, { from: false });
    else hide();
  });

  // Links to #projet-x elsewhere (the quick index, other sites) open the article.
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#projet-"]');
    if (!a || a.hasAttribute('data-open') || a.hasAttribute('data-go') || a.closest('[data-rail]') || a.origin !== location.origin) return;
    const i = indexOfHash(a.hash);
    if (i < 0) return;
    e.preventDefault();
    history.pushState({ project: true }, '', a.hash);
    projectsEls[i].scrollIntoView({ block: 'start', behavior: 'instant' });
    show(i, { from: false });
  });

  const initial = indexOfHash(location.hash);
  if (initial >= 0) {
    projectsEls[initial].scrollIntoView({ block: 'start', behavior: 'instant' });
    show(initial, { from: false });
  }
}

/* ---------- The WebGL scene: after the page, only where it can run well ---------- */
const canvas = document.querySelector<HTMLCanvasElement>('[data-scene-canvas]');
const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
const capable = () =>
  !!canvas &&
  motion() &&
  !nav.connection?.saveData &&
  (nav.deviceMemory ?? 8) >= 3 &&
  (navigator.hardwareConcurrency ?? 8) >= 4 &&
  !new URLSearchParams(location.search).has('nogl');
if (capable()) {
  const start = () =>
    import('./scene/engine')
      .then(({ startScene }) => {
        const scene = startScene(canvas!, {
          // ?glforce keeps the scene at full quality whatever the frame rate (screenshots on software rendering)
          adaptive: !new URLSearchParams(location.search).has('glforce'),
          onFirstFrame: () => root.classList.add('gl-on'),
          onGiveUp: () => root.classList.remove('gl-on'),
        });
        if (!scene) return;
        reduceMotion.addEventListener('change', () => {
          if (reduceMotion.matches) {
            scene.stop();
            root.classList.remove('gl-on');
          }
        });
      })
      .catch(() => root.classList.remove('gl-on'));
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  const later = () => (idle ? idle(start, { timeout: 1500 }) : setTimeout(start, 300));
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
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
  if (motion()) {
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
