/**
 * Creative Portfolio - Interactive JavaScript
 * Clément Plançon — 2024
 */

// ---- Custom Cursor ----
class Cursor {
    constructor() {
        this.cursorBig = document.querySelector('.cursor__ball--big');
        this.cursorSmall = document.querySelector('.cursor__ball--small');

        if (!this.cursorBig || !this.cursorSmall) return;

        this.mouseX = 0;
        this.mouseY = 0;
        this.bigX = 0;
        this.bigY = 0;
        this.smallX = 0;
        this.smallY = 0;

        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        this.animate();
    }

    animate() {
        // Smooth follow for big cursor
        this.bigX += (this.mouseX - this.bigX) * 0.15;
        this.bigY += (this.mouseY - this.bigY) * 0.15;

        // Faster follow for small cursor
        this.smallX += (this.mouseX - this.smallX) * 0.3;
        this.smallY += (this.mouseY - this.smallY) * 0.3;

        this.cursorBig.style.left = `${this.bigX}px`;
        this.cursorBig.style.top = `${this.bigY}px`;

        this.cursorSmall.style.left = `${this.smallX}px`;
        this.cursorSmall.style.top = `${this.smallY}px`;

        requestAnimationFrame(() => this.animate());
    }
}

// ---- Magnetic Elements ----
class MagneticElements {
    constructor() {
        this.elements = document.querySelectorAll('[data-magnetic]');
        this.init();
    }

    init() {
        this.elements.forEach(el => {
            el.addEventListener('mousemove', (e) => this.onMouseMove(e, el));
            el.addEventListener('mouseleave', (e) => this.onMouseLeave(e, el));
        });
    }

    onMouseMove(e, el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    }

    onMouseLeave(e, el) {
        el.style.transform = 'translate(0, 0)';
    }
}

// ---- Scroll Animations ----
class ScrollAnimations {
    constructor() {
        this.elements = document.querySelectorAll('[data-animate]');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('animated');
                    }, delay * 1000);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        this.elements.forEach(el => observer.observe(el));
    }
}

// ---- Theme Toggle ----
class ThemeToggle {
    constructor() {
        this.toggle = document.querySelector('[data-theme-toggle]');
        this.html = document.documentElement;

        if (!this.toggle) return;

        this.init();
    }

    init() {
        // Check saved theme or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme) {
            this.html.dataset.theme = savedTheme;
        } else if (systemDark) {
            this.html.dataset.theme = 'dark';
        }

        this.toggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const current = this.html.dataset.theme;
        const next = current === 'dark' ? 'light' : 'dark';

        this.html.dataset.theme = next;
        localStorage.setItem('theme', next);
    }
}

// ---- Language Toggle ----
class LanguageToggle {
    constructor() {
        this.toggle = document.querySelector('[data-lang-toggle]');
        this.html = document.documentElement;

        if (!this.toggle) return;

        this.translations = {
            fr: {
                'nav.work': 'Projets',
                'nav.about': 'À propos',
                'nav.contact': 'Contact'
            },
            en: {
                'nav.work': 'Work',
                'nav.about': 'About',
                'nav.contact': 'Contact'
            }
        };

        this.init();
    }

    init() {
        const savedLang = localStorage.getItem('lang') || 'fr';
        this.html.dataset.lang = savedLang;
        this.updateToggleText(savedLang);

        this.toggle.addEventListener('click', () => this.toggleLang());
    }

    toggleLang() {
        const current = this.html.dataset.lang;
        const next = current === 'fr' ? 'en' : 'fr';

        this.html.dataset.lang = next;
        localStorage.setItem('lang', next);
        this.updateToggleText(next);
    }

    updateToggleText(lang) {
        const text = this.toggle.querySelector('span');
        if (text) {
            text.textContent = lang === 'fr' ? 'EN' : 'FR';
        }
    }
}

// ---- Counter Animation ----
class CounterAnimation {
    constructor() {
        this.counters = document.querySelectorAll('[data-counter]');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        this.counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(el) {
        const target = parseInt(el.dataset.counter);
        const duration = 2000;
        const start = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);

            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}

// ---- Smooth Scroll ----
class SmoothScroll {
    constructor() {
        this.links = document.querySelectorAll('a[href^="#"]');
        this.init();
    }

    init() {
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// ---- Parallax Shapes ----
class ParallaxShapes {
    constructor() {
        this.shapes = document.querySelectorAll('.shape');
        this.init();
    }

    init() {
        if (this.shapes.length === 0) return;

        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;

            this.shapes.forEach((shape, i) => {
                const speed = (i + 1) * 10;
                const xOffset = x * speed;
                const yOffset = y * speed;

                shape.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
            });
        });
    }
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
    new Cursor();
    new MagneticElements();
    new ScrollAnimations();
    new ThemeToggle();
    new LanguageToggle();
    new CounterAnimation();
    new SmoothScroll();
    new ParallaxShapes();

    // Add loaded class after a short delay
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});
