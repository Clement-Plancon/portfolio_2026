(() => {
    'use strict';

    const links = document.querySelectorAll('.nav-link[data-nav-to]');
    const sections = document.querySelectorAll('main section[id]');

    if (links.length && sections.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                // "skills" has no nav entry; keep "projects" highlighted there
                const id = entry.target.id === 'skills' ? 'projects' : entry.target.id;
                links.forEach((l) => {
                    const active = l.dataset.navTo === id;
                    l.classList.toggle('is-active', active);
                    if (active) l.setAttribute('aria-current', 'location');
                    else l.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-30% 0px -65% 0px' });
        sections.forEach((s) => io.observe(s));
    }

    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
})();
