/* Clément Plançon — minimal interactions */
(() => {
    'use strict';

    document.documentElement.classList.add('js');

    // ---------- Active nav on scroll ----------
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-nav-to]');

    if (sections.length && navLinks.length) {
        const setActive = (id) => {
            navLinks.forEach((l) => {
                l.classList.toggle('is-active', l.dataset.navTo === id);
            });
        };
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActive(entry.target.id);
                });
            },
            { rootMargin: '-30% 0px -65% 0px', threshold: 0 }
        );
        sections.forEach((s) => io.observe(s));
    }

    // ---------- Reveal on view ----------
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
        );
        reveals.forEach((el) => io.observe(el));
    }

    // ---------- Year ----------
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
})();
