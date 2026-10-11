(() => {
    'use strict';

    const links = document.querySelectorAll('.top__nav a[data-nav-to]');
    const sections = document.querySelectorAll('main section[id]');

    if (links.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((l) => {
                    if (l.dataset.navTo === entry.target.id) l.setAttribute('aria-current', 'location');
                    else l.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-35% 0px -60% 0px' });
        sections.forEach((s) => io.observe(s));
    }

    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
})();
