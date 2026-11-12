// Progressive enhancements for the public site. Every page is complete without this script.

// Netlify Identity e-mails (invitation, password reset) link to the site root: forward them to the admin.
if (/^#(invite_token|recovery_token|confirmation_token|email_change_token)=/.test(location.hash)) {
  location.replace(`/admin/${location.hash}`);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Light alternative for modest devices or data-saver mode: prints are shown developed, no pointer light.
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

/* Prints develop when they first come into the light: the sensitised layer fades (opacity only).
   Once per project and per visit, so coming back to a page does not replay it. */
const developed = (() => {
  try {
    return new Set<string>(JSON.parse(sessionStorage.getItem('developed') ?? '[]'));
  } catch {
    return new Set<string>();
  }
})();
const remember = (id: string) => {
  developed.add(id);
  try {
    sessionStorage.setItem('developed', JSON.stringify([...developed]));
  } catch {
    /* storage unavailable: prints will develop again next time */
  }
};
const prints = [...document.querySelectorAll<HTMLElement>('.print[data-print]')];
if (animate && prints.length) {
  const first = new WeakSet<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        const id = el.dataset.print ?? '';
        if (!first.has(el)) {
          first.add(el);
          // Already on screen at load, or seen earlier in this visit: show it developed.
          if (e.isIntersecting || developed.has(id)) {
            io.unobserve(el);
            continue;
          }
          el.classList.add('is-raw');
        }
        if (e.isIntersecting && e.intersectionRatio >= 0.3) {
          io.unobserve(el);
          remember(id);
          requestAnimationFrame(() => {
            el.classList.add('is-developing');
            el.classList.remove('is-raw');
          });
        }
      }
    },
    { threshold: [0, 0.3] },
  );
  for (const p of prints) io.observe(p);
}

/* Light under the pointer on prints (fine pointers only). */
if (animate && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.addEventListener(
    'pointermove',
    (ev) => {
      const card = (ev.target as Element).closest?.('[data-card]');
      const light = card?.querySelector<HTMLElement>('.print__light');
      if (!card || !light) return;
      const r = card.querySelector('.print__emulsion')!.getBoundingClientRect();
      light.style.setProperty('--lx', `${((ev.clientX - r.left) / r.width) * 100 - 15}%`);
      light.style.setProperty('--ly', `${((ev.clientY - r.top) / r.height) * 100 - 15}%`);
    },
    { passive: true },
  );
}

/* Home gallery. Desktop: pinned, the vertical scroll moves the prints sideways. Elsewhere: native swipe. */
const gallery = document.querySelector<HTMLElement>('[data-gallery]');
if (gallery) {
  const track = gallery.querySelector<HTMLElement>('[data-track]')!;
  const items = [...track.children] as HTMLElement[];
  const count = gallery.querySelector('[data-count]');
  const bar = gallery.querySelector<HTMLElement>('[data-progress]');
  const pinQuery = matchMedia('(min-width: 64rem) and (hover: hover) and (min-height: 36rem)');
  let travel = 0;
  let top = 0;

  const show = (k: number) => {
    bar?.style.setProperty('--p', String(Math.max(0.08, k)));
    if (count) count.textContent = String(Math.min(items.length, Math.round(k * (items.length - 1)) + 1)).padStart(2, '0');
  };
  const measure = () => {
    const pinned = pinQuery.matches;
    gallery.classList.toggle('is-pinned', pinned);
    track.style.removeProperty('--x');
    if (!pinned) {
      gallery.style.removeProperty('--pin-h');
      return;
    }
    travel = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    gallery.style.setProperty('--pin-h', `${travel + innerHeight}px`);
    top = gallery.getBoundingClientRect().top + scrollY;
    onScroll();
  };
  const onScroll = () => {
    if (!gallery.classList.contains('is-pinned') || !travel) return;
    const k = Math.min(1, Math.max(0, (scrollY - top) / travel));
    track.style.setProperty('--x', `${-k * travel}px`);
    show(k);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure);
  pinQuery.addEventListener('change', measure);
  document.fonts?.ready.then(measure);
  measure();

  track.addEventListener(
    'scroll',
    () => {
      const max = track.scrollWidth - track.clientWidth;
      show(max > 0 ? track.scrollLeft / max : 0);
    },
    { passive: true },
  );
  // Keyboard: a focused print that is off to the side brings the page to it.
  track.addEventListener('focusin', (ev) => {
    if (!gallery.classList.contains('is-pinned')) return;
    const item = (ev.target as Element).closest('li') as HTMLElement | null;
    if (!item) return;
    const k = Math.min(1, Math.max(0, (item.offsetLeft - items[0].offsetLeft) / (travel || 1)));
    window.scrollTo({ top: top + k * travel, behavior: 'instant' as ScrollBehavior });
  });
}

/* Project page: see a real capture in its true colours. */
for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-true-colors]')) {
  const target = document.getElementById(btn.getAttribute('aria-controls') ?? '');
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    target?.classList.toggle('is-true-colors', on);
  });
}

/* Project page contents: mark the section being read. */
const toc = document.querySelector<HTMLElement>('[data-toc]');
if (toc) {
  const links = new Map([...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => [a.hash.slice(1), a]));
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter((s): s is HTMLElement => !!s);
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible[0]) return;
      for (const [key, a] of links) {
        if (key === visible[0].target.id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      }
    },
    { rootMargin: '-20% 0px -70% 0px' },
  );
  for (const s of sections) io.observe(s);
}
