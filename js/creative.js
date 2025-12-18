/**
 * Portfolio — Fonction Publique Française
 * Clément Plançon — 2024
 */

// ---- Translations ----
const translations = {
    fr: {
        // Navigation
        'nav.work': 'Projets',
        'nav.about': 'À propos',
        'nav.contact': 'Contact',

        // Hero
        'hero.tag1': 'Développement',
        'hero.tag2': 'Data & IA',
        'hero.tag3': 'Management',
        'hero.intro': 'Je suis Clément Plançon,',
        'hero.title1': 'Ingénieur',
        'hero.title2': 'Logiciel',
        'hero.title3': '& IA',
        'hero.marquee': 'CREATIVE DEVELOPMENT — FULLSTACK — AI SOLUTIONS — UX DESIGN — ',
        'hero.scroll': 'Scroll',
        'hero.tagline1': 'Solutions sur mesure,',
        'hero.tagline2': 'boostées par l\'IA',

        // Work
        'work.title1': 'Projets',
        'work.title2': 'sélectionnés',
        'work.project1.title': 'QuiPaieQuoi',
        'work.project1.cat': 'Application Mobile — IA',
        'work.project2.title': 'Référentiel Indicateurs',
        'work.project2.cat': 'Application Web',
        'work.project3.title': 'Assistant IA Métier',
        'work.project3.cat': 'Agent IA — RAG',
        'work.project4.title': 'Veille Stratégique',
        'work.project4.cat': 'Outil Interne',

        // About
        'about.title': 'À propos',
        'about.text1': 'Ingénieur logiciel spécialisé dans le développement web fullstack, je combine <em>expertise technique</em> et <em>sensibilité design</em> pour créer des solutions numériques performantes.',
        'about.text2': 'Actuellement Chef adjoint de la section informatique au Laboratoire de Police Scientifique de Paris, je conçois des solutions techniques innovantes pour les enquêtes judiciaires.',
        'about.since': 'Depuis 2014',
        'about.stat1.num': '10',
        'about.stat1.label': 'Années d\'exp.',
        'about.stat2.num': '50',
        'about.stat2.label': 'Projets',
        'about.stat3.num': '∞',
        'about.stat3.label': 'Curiosité',
        'about.experience': 'Parcours',
        'about.job1.date': '2022 — Présent',
        'about.job1.company': 'Laboratoire Police Scientifique',
        'about.job1.role': 'Chef adjoint IT — Ingénieur SIC',
        'about.job2.date': '2020 — Présent',
        'about.job2.company': 'Point Virgule',
        'about.job2.role': 'Fondateur — Dev Fullstack & IA',
        'about.job3.date': '2019 — 2022',
        'about.job3.company': 'Ministère de l\'Économie',
        'about.job3.role': 'Analyste Dev — Labo Transformation',

        // Contact
        'contact.title1': 'Un projet ?',
        'contact.title2': 'Parlons-en',
        'contact.footer1': '© 2024 Clément Plançon',
        'contact.footer2': 'Fait avec passion'
    },
    en: {
        // Navigation
        'nav.work': 'Work',
        'nav.about': 'About',
        'nav.contact': 'Contact',

        // Hero
        'hero.tag1': 'Development',
        'hero.tag2': 'Data & AI',
        'hero.tag3': 'Management',
        'hero.intro': 'I am Clément Plançon,',
        'hero.title1': 'Software',
        'hero.title2': 'Engineer',
        'hero.title3': '& AI',
        'hero.marquee': 'CREATIVE DEVELOPMENT — FULLSTACK — AI SOLUTIONS — UX DESIGN — ',
        'hero.scroll': 'Scroll',
        'hero.tagline1': 'Custom solutions,',
        'hero.tagline2': 'powered by AI',

        // Work
        'work.title1': 'Selected',
        'work.title2': 'projects',
        'work.project1.title': 'QuiPaieQuoi',
        'work.project1.cat': 'Mobile App — AI',
        'work.project2.title': 'Indicators Dashboard',
        'work.project2.cat': 'Web Application',
        'work.project3.title': 'Business AI Assistant',
        'work.project3.cat': 'AI Agent — RAG',
        'work.project4.title': 'Strategic Watch',
        'work.project4.cat': 'Internal Tool',

        // About
        'about.title': 'About',
        'about.text1': 'Software engineer specialized in fullstack web development, I combine <em>technical expertise</em> and <em>design sensitivity</em> to create high-performance digital solutions.',
        'about.text2': 'Currently Deputy Head of the IT section at the Paris Forensic Science Laboratory, I design innovative technical solutions for judicial investigations.',
        'about.since': 'Since 2014',
        'about.stat1.num': '10',
        'about.stat1.label': 'Years exp.',
        'about.stat2.num': '50',
        'about.stat2.label': 'Projects',
        'about.stat3.num': '∞',
        'about.stat3.label': 'Curiosity',
        'about.experience': 'Experience',
        'about.job1.date': '2022 — Present',
        'about.job1.company': 'Forensic Science Laboratory',
        'about.job1.role': 'Deputy IT Head — ICT Engineer',
        'about.job2.date': '2020 — Present',
        'about.job2.company': 'Point Virgule',
        'about.job2.role': 'Founder — Fullstack & AI Dev',
        'about.job3.date': '2019 — 2022',
        'about.job3.company': 'Ministry of Economy',
        'about.job3.role': 'Dev Analyst — Transformation Lab',

        // Contact
        'contact.title1': 'Got a project?',
        'contact.title2': 'Let\'s talk',
        'contact.footer1': '© 2024 Clément Plançon',
        'contact.footer2': 'Made with passion'
    }
};

// ---- Custom Cursor ----
class Cursor {
    constructor() {
        this.cursorBig = document.querySelector('.cursor__ball--big');
        this.cursorSmall = document.querySelector('.cursor__ball--small');

        if (!this.cursorBig || !this.cursorSmall) return;
        if (window.innerWidth < 768) return;

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
        this.bigX += (this.mouseX - this.bigX) * 0.15;
        this.bigY += (this.mouseY - this.bigY) * 0.15;

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
        if (window.innerWidth < 768) return;
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

        el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    }

    onMouseLeave(e, el) {
        el.style.transform = 'translate(0, 0)';
    }
}

// ---- Scroll Animations ----
class ScrollAnimations {
    constructor() {
        this.elements = document.querySelectorAll('[data-animate], .split-text');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => {
                        entry.target.classList.add('animated');
                    }, parseFloat(delay) * 1000);
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
        this.init();
    }

    init() {
        const savedLang = localStorage.getItem('lang') || 'fr';
        this.html.dataset.lang = savedLang;
        this.updatePage(savedLang);
        this.updateToggleText(savedLang);

        this.toggle.addEventListener('click', () => this.toggleLang());
    }

    toggleLang() {
        const current = this.html.dataset.lang;
        const next = current === 'fr' ? 'en' : 'fr';

        this.html.dataset.lang = next;
        localStorage.setItem('lang', next);
        this.updatePage(next);
        this.updateToggleText(next);
    }

    updateToggleText(lang) {
        const text = this.toggle.querySelector('span');
        if (text) {
            text.textContent = lang === 'fr' ? 'EN' : 'FR';
        }
    }

    updatePage(lang) {
        const t = translations[lang];

        // Navigation
        this.updateText('[data-i18n="nav.work"] .nav__link-text', t['nav.work']);
        this.updateText('[data-i18n="nav.about"] .nav__link-text', t['nav.about']);
        this.updateText('[data-i18n="nav.contact"] .nav__link-text', t['nav.contact']);

        // Hero tags
        const tags = document.querySelectorAll('.hero__tags .tag__inner');
        if (tags[0]) tags[0].textContent = t['hero.tag1'];
        if (tags[1]) tags[1].textContent = t['hero.tag2'];
        if (tags[2]) tags[2].textContent = t['hero.tag3'];

        // Hero intro & title
        const intro = document.querySelector('.hero__intro .split-text');
        if (intro) intro.textContent = t['hero.intro'];

        const titleLines = document.querySelectorAll('.hero__title .split-text');
        if (titleLines[0]) titleLines[0].textContent = t['hero.title1'];
        if (titleLines[1]) titleLines[1].textContent = t['hero.title2'];
        if (titleLines[2]) titleLines[2].textContent = t['hero.title3'];

        // Hero marquee
        const marqueeTexts = document.querySelectorAll('.hero__marquee .marquee__text');
        marqueeTexts.forEach(el => el.textContent = t['hero.marquee']);

        // Hero scroll & tagline
        this.updateText('.hero__scroll-text', t['hero.scroll']);
        const taglines = document.querySelectorAll('.hero__tagline [data-animate="fade"]');
        if (taglines[0]) taglines[0].textContent = t['hero.tagline1'];
        if (taglines[1]) taglines[1].textContent = t['hero.tagline2'];

        // Work section
        const workTitle = document.querySelectorAll('.work .section__title .split-text');
        if (workTitle[0]) workTitle[0].textContent = t['work.title1'];
        if (workTitle[1]) workTitle[1].textContent = t['work.title2'];

        const workItems = document.querySelectorAll('.work__item');
        const projectKeys = ['project1', 'project2', 'project3', 'project4'];
        workItems.forEach((item, i) => {
            const key = projectKeys[i];
            if (key) {
                const title = item.querySelector('.work__title');
                const cat = item.querySelector('.work__cat');
                if (title) title.textContent = t[`work.${key}.title`];
                if (cat) cat.textContent = t[`work.${key}.cat`];
            }
        });

        // About section
        const aboutTitle = document.querySelector('.about .section__title .split-text');
        if (aboutTitle) aboutTitle.textContent = t['about.title'];

        const aboutTexts = document.querySelectorAll('.about__text');
        if (aboutTexts[0]) aboutTexts[0].innerHTML = t['about.text1'];
        if (aboutTexts[1]) aboutTexts[1].textContent = t['about.text2'];

        this.updateText('.about__photo-label span', t['about.since']);

        const stats = document.querySelectorAll('.about__stats .stat');
        if (stats[0]) {
            const num = stats[0].querySelector('.stat__num');
            const label = stats[0].querySelector('.stat__label');
            if (num) num.textContent = t['about.stat1.num'];
            if (label) label.textContent = t['about.stat1.label'];
        }
        if (stats[1]) {
            const num = stats[1].querySelector('.stat__num');
            const label = stats[1].querySelector('.stat__label');
            if (num) num.textContent = t['about.stat2.num'];
            if (label) label.textContent = t['about.stat2.label'];
        }
        if (stats[2]) {
            const num = stats[2].querySelector('.stat__num');
            const label = stats[2].querySelector('.stat__label');
            if (num) num.textContent = t['about.stat3.num'];
            if (label) label.textContent = t['about.stat3.label'];
        }

        this.updateText('.about__subtitle', t['about.experience']);

        const timelineItems = document.querySelectorAll('.timeline__item');
        const jobKeys = ['job1', 'job2', 'job3'];
        timelineItems.forEach((item, i) => {
            const key = jobKeys[i];
            if (key) {
                const date = item.querySelector('.timeline__date');
                const company = item.querySelector('.timeline__content h4');
                const role = item.querySelector('.timeline__content p');
                if (date) date.textContent = t[`about.${key}.date`];
                if (company) company.textContent = t[`about.${key}.company`];
                if (role) role.textContent = t[`about.${key}.role`];
            }
        });

        // Contact section
        const contactTitles = document.querySelectorAll('.contact__title .split-text');
        if (contactTitles[0]) contactTitles[0].textContent = t['contact.title1'];
        if (contactTitles[1]) contactTitles[1].textContent = t['contact.title2'];

        const footerTexts = document.querySelectorAll('.contact__footer p');
        if (footerTexts[0]) footerTexts[0].textContent = t['contact.footer1'];
        if (footerTexts[1]) footerTexts[1].textContent = t['contact.footer2'];

        // Update cursor text based on language
        document.documentElement.style.setProperty('--cursor-view-text', lang === 'fr' ? '"VOIR"' : '"VIEW"');
        document.documentElement.style.setProperty('--cursor-email-text', lang === 'fr' ? '"EMAIL"' : '"EMAIL"');
    }

    updateText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
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
        if (window.innerWidth < 768) return;
        this.init();
    }

    init() {
        if (this.shapes.length === 0) return;

        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;

            this.shapes.forEach((shape, i) => {
                const speed = (i + 1) * 8;
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

    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});
