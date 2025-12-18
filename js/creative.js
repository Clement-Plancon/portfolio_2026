/**
 * Clément Plançon — Portfolio 2024
 * JavaScript - Interactions & i18n
 */

// ===================== TRANSLATIONS =====================
const translations = {
    fr: {
        'nav.work': 'Projets',
        'nav.about': 'À propos',
        'nav.contact': 'Contact',
        'hero.tag1': 'Développement',
        'hero.tag2': 'Data & IA',
        'hero.tag3': 'Management',
        'hero.intro': 'Je suis Clément Plançon,',
        'hero.title1': 'Ingénieur',
        'hero.title2': 'logiciel',
        'hero.desc': 'Je conçois des solutions numériques innovantes, alliant expertise technique et intelligence artificielle pour transformer vos idées en produits performants.',
        'hero.cta': 'Discutons de votre projet',
        'hero.cta2': 'Voir mes réalisations',
        'projects.title': 'Projets sélectionnés',
        'about.title': 'À propos',
        'about.lead': 'Ingénieur logiciel passionné par l\'innovation, je transforme des idées complexes en solutions élégantes et performantes.',
        'about.text': 'Actuellement Chef adjoint de la section informatique au Laboratoire de Police Scientifique de Paris, je conçois des solutions techniques innovantes pour les enquêtes judiciaires. En parallèle, je développe des projets personnels et accompagne des entreprises dans leur transformation numérique.',
        'contact.title': 'Un projet en tête ?<br><span class="text--accent">Travaillons ensemble.</span>'
    },
    en: {
        'nav.work': 'Work',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'hero.tag1': 'Development',
        'hero.tag2': 'Data & AI',
        'hero.tag3': 'Management',
        'hero.intro': 'I am Clément Plançon,',
        'hero.title1': 'Software',
        'hero.title2': 'engineer',
        'hero.desc': 'I design innovative digital solutions, combining technical expertise and artificial intelligence to transform your ideas into high-performance products.',
        'hero.cta': 'Let\'s discuss your project',
        'hero.cta2': 'See my work',
        'projects.title': 'Selected projects',
        'about.title': 'About',
        'about.lead': 'Software engineer passionate about innovation, I transform complex ideas into elegant and efficient solutions.',
        'about.text': 'Currently Deputy Head of IT at the Paris Forensic Science Laboratory, I design innovative technical solutions for judicial investigations. In parallel, I develop personal projects and support companies in their digital transformation.',
        'contact.title': 'Got a project?<br><span class="text--accent">Let\'s work together.</span>'
    }
};

// ===================== CURSOR =====================
class Cursor {
    constructor() {
        this.dot = document.querySelector('.cursor__dot');
        this.circle = document.querySelector('.cursor__circle');

        if (!this.dot || !this.circle || window.innerWidth < 768) return;

        this.mouseX = 0;
        this.mouseY = 0;
        this.dotX = 0;
        this.dotY = 0;
        this.circleX = 0;
        this.circleY = 0;

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
        // Dot follows faster
        this.dotX += (this.mouseX - this.dotX) * 0.35;
        this.dotY += (this.mouseY - this.dotY) * 0.35;

        // Circle follows slower
        this.circleX += (this.mouseX - this.circleX) * 0.15;
        this.circleY += (this.mouseY - this.circleY) * 0.15;

        this.dot.style.left = `${this.dotX}px`;
        this.dot.style.top = `${this.dotY}px`;

        this.circle.style.left = `${this.circleX}px`;
        this.circle.style.top = `${this.circleY}px`;

        requestAnimationFrame(() => this.animate());
    }
}

// ===================== THEME TOGGLE =====================
class ThemeToggle {
    constructor() {
        this.toggle = document.querySelector('[data-theme-toggle]');
        this.html = document.documentElement;

        if (!this.toggle) return;

        this.init();
    }

    init() {
        // Check saved preference or system preference
        const saved = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (saved) {
            this.html.dataset.theme = saved;
        } else if (systemDark) {
            this.html.dataset.theme = 'dark';
        }

        this.toggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const current = this.html.dataset.theme || 'light';
        const next = current === 'dark' ? 'light' : 'dark';

        this.html.dataset.theme = next;
        localStorage.setItem('theme', next);
    }
}

// ===================== LANGUAGE TOGGLE =====================
class LanguageToggle {
    constructor() {
        this.toggle = document.querySelector('[data-lang-toggle]');
        this.html = document.documentElement;

        if (!this.toggle) return;

        this.init();
    }

    init() {
        const saved = localStorage.getItem('lang') || 'fr';
        this.html.dataset.lang = saved;
        this.updateToggleText(saved);
        this.updatePage(saved);

        this.toggle.addEventListener('click', () => this.toggleLang());
    }

    toggleLang() {
        const current = this.html.dataset.lang || 'fr';
        const next = current === 'fr' ? 'en' : 'fr';

        this.html.dataset.lang = next;
        localStorage.setItem('lang', next);
        this.updateToggleText(next);
        this.updatePage(next);
    }

    updateToggleText(lang) {
        const span = this.toggle.querySelector('span');
        if (span) {
            span.textContent = lang.toUpperCase();
        }
    }

    updatePage(lang) {
        const t = translations[lang];

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                if (key === 'contact.title') {
                    el.innerHTML = t[key];
                } else {
                    el.textContent = t[key];
                }
            }
        });

        // Update nav links text
        document.querySelectorAll('.nav__link').forEach(link => {
            const key = link.dataset.i18n;
            const textEl = link.querySelector('.nav__text');
            if (key && t[key] && textEl) {
                textEl.textContent = t[key];
            }
        });
    }
}

// ===================== SMOOTH SCROLL =====================
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

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// ===================== SCROLL ANIMATIONS =====================
class ScrollAnimations {
    constructor() {
        this.elements = document.querySelectorAll('.project, .stat, .timeline__item');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        this.elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    new Cursor();
    new ThemeToggle();
    new LanguageToggle();
    new SmoothScroll();
    new ScrollAnimations();
});
