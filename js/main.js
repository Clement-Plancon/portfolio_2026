(() => {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Header: background once the page scrolls ----------
    const bar = document.getElementById('top-bar');
    const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---------- Navigation: active section + sliding pill ----------
    const nav = document.querySelector('.top__nav');
    const pill = nav.querySelector('.top__pill');
    const links = [...nav.querySelectorAll('a[data-nav-to]')];

    const movePill = (link) => {
        if (!link) { pill.style.opacity = '0'; return; }
        pill.style.width = `${link.offsetWidth}px`;
        pill.style.transform = `translateX(${link.offsetLeft}px)`;
        pill.style.opacity = '1';
    };
    const setActive = (id) => {
        let current = null;
        links.forEach((l) => {
            const on = l.dataset.navTo === id;
            if (on) { l.setAttribute('aria-current', 'location'); current = l; }
            else l.removeAttribute('aria-current');
        });
        movePill(current);
    };
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('main > section[id]').forEach((s) => spy.observe(s));
    window.addEventListener('resize', () => movePill(nav.querySelector('a[aria-current]')));

    // ---------- Scroll reveal ----------
    // Elements entering the viewport together cascade; later ones start without delay.
    const revealer = new IntersectionObserver((entries) => {
        let n = 0;
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.style.setProperty('--i', n++);
            e.target.classList.add('is-in');
            revealer.unobserve(e.target);
        });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.reveal, .chart').forEach((el) => revealer.observe(el));

    // ---------- Project details (open by default without JS) ----------
    document.querySelectorAll('.more').forEach((btn) => {
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        const inner = panel.firstElementChild;
        const set = (open) => {
            btn.setAttribute('aria-expanded', String(open));
            panel.classList.toggle('is-closed', !open);
            inner.inert = !open;
        };
        set(false);
        btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    });

    // ---------- Experience: list and timeline highlight each other ----------
    const journey = document.querySelector('.journey');
    const linked = journey.querySelectorAll('[data-job]');
    const highlight = (key) => {
        journey.classList.toggle('is-linked', Boolean(key));
        linked.forEach((el) => el.classList.toggle('is-on', el.dataset.job === key));
    };
    linked.forEach((el) => {
        el.addEventListener('mouseenter', () => highlight(el.dataset.job));
        el.addEventListener('mouseleave', () => highlight(null));
        el.addEventListener('focusin', () => highlight(el.dataset.job));
        el.addEventListener('focusout', () => highlight(null));
    });

    // ---------- Copy e-mail ----------
    const copy = document.querySelector('.copy');
    const status = document.querySelector('.copy__status');
    if (copy && navigator.clipboard) {
        let timer;
        copy.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(copy.dataset.copy);
                status.textContent = 'Adresse copiée';
            } catch {
                status.textContent = 'Copie impossible, sélectionnez l’adresse';
            }
            clearTimeout(timer);
            timer = setTimeout(() => { status.textContent = ''; }, reduceMotion ? 4000 : 2500);
        });
    } else if (copy) {
        copy.hidden = true;
    }

    // ---------- Year ----------
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
})();
