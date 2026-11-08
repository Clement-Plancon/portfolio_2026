export {};

// Progressive enhancements for the public site. Everything works without this script.

// Netlify Identity e-mails (invitation, password reset) link to the site root: forward them to the admin.
if (/^#(invite_token|recovery_token|confirmation_token|email_change_token)=/.test(location.hash)) {
  location.replace(`/admin/${location.hash}`);
}

const finePointer =window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

/* Project index: the viewer shows the project under the pointer or keyboard focus. */
for (const index of document.querySelectorAll<HTMLElement>('[data-pindex]')) {
  const panels = new Map(
    [...index.querySelectorAll<HTMLElement>('[data-panel]')].map((p) => [p.dataset.panel, p]),
  );
  let current = index.querySelector<HTMLElement>('[data-panel]:not([hidden])')?.dataset.panel;
  const show = (id?: string) => {
    if (!id || id === current || !panels.has(id)) return;
    if (current) panels.get(current)?.setAttribute('hidden', '');
    panels.get(id)?.removeAttribute('hidden');
    for (const link of index.querySelectorAll<HTMLElement>('[data-preview]')) {
      link.classList.toggle('is-active', link.dataset.preview === id);
    }
    current = id;
  };
  for (const link of index.querySelectorAll<HTMLElement>('[data-preview]')) {
    link.addEventListener('pointerenter', () => finePointer.matches && show(link.dataset.preview));
    link.addEventListener('focus', () => show(link.dataset.preview));
  }
}

/* Hero name: letters near the pointer get heavier. Desktop with a mouse only. */
const name = document.querySelector<HTMLElement>('[data-name]');
if (name && finePointer.matches && !reducedMotion.matches) {
  const letters = [...name.querySelectorAll<HTMLElement>('.l')];
  let frame = 0;
  let pointer: { x: number; y: number } | null = null;
  const update = () => {
    frame = 0;
    for (const l of letters) {
      let w = 0;
      if (pointer) {
        const r = l.getBoundingClientRect();
        const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
        w = Math.max(0, 1 - d / 260);
      }
      l.style.setProperty('--w', w.toFixed(3));
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  name.addEventListener('pointermove', (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    schedule();
  });
  name.addEventListener('pointerleave', () => {
    pointer = null;
    schedule();
  });
}
