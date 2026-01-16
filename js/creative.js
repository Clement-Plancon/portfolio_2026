/**
 * Clément Plançon — Portfolio 2024
 * JavaScript - Interactions & Modals
 */

// ===================== MODAL CONTENT =====================
const modalContent = {
    // Experiences
    exp1: {
        title: 'Laboratoire de Police Scientifique de Paris',
        subtitle: 'Chef adjoint de la section informatique — Ingénieur SIC',
        period: '2022 — Présent',
        description: 'Au sein du Laboratoire de police scientifique de Paris, je pilote une équipe de 4 développeurs logiciel.',
        responsibilities: [
            "Lead d'une équipe de 4 développeurs (encadrement technique, priorisation, accompagnement)",
            'Conception et arbitrage des choix techniques, en lien avec les besoins métiers et les contraintes opérationnelles',
            'Maintien en condition opérationnelle, évolution et fiabilisation d’applications métiers existantes',
            'Contribution à la structuration des pratiques de développement et des processus techniques',
        ],
        technologies: ['Docker', 'PHP', 'K8S', 'PostgreSQL']
    },
    exp2: {
        title: 'Outils Publics',
        subtitle: 'Coordinateur technique – Données & développement',
        period: '2024 — Présent',
        description: "Le collectif Outils Publics est spécialisé dans la recherche, l'exploration et création d’outils numériques applicatifs.",
        responsibilities: [
            'Développement de prototypes, outils et visualisations à partir de données publiques',
            'Structuration des pratiques, des outils et des méthodes techniques',
            'Interface entre recherche, design et implémentation logicielle',
        ],
        technologies: ['React', 'Node.js', 'Flutter', 'Python']
    },
    exp3: {
        title: 'Ministère de l\'Économie et des Finances',
        subtitle: 'Ingénieur logiciel et chef de projet technique — Laboratoire de la Transformation',
        period: '2022 — 2024',
        description: 'Au sein du Lab de la Transformation, j\'ai participé à la modernisation des services publics en développant des solutions innovantes et en accompagnant les agents dans l\'adoption de nouveaux outils.',
        responsibilities: [
            'Développement d\'applications internes en react et next.js',
            'Analyse des besoins et rédaction de spécifications',
            'Animation d\'ateliers d\'innovation et de design thinking',
            'Veille technologique et expérimentation'
        ],
        technologies: ['C# .NET', 'Power Platform', 'SQL Server', 'Azure']
    },
    // Projects
    proj1: {
        title: 'Bercy Vert',
        subtitle: 'Conception de logiciel – Transition écologique',
        description: 'Projet de conception d’un logiciel destiné à accompagner la démarche de transition verte et écologique du ministère de l’Économie et des Finances. L’objectif était de répondre aux besoins des référents ministériels en centralisant et structurant les actions issues du BEGES et les mesures SPE.',
        features: [
            'Cadrage du projet et expression des besoins fonctionnels en lien avec les parties prenantes',
            'Définition de la méthodologie de développement et structuration du cycle projet',
            'Gestion multi-groupes et historique des dépenses',
            'Conception et développement de l’interface du proof of concept',
            'Recueil, analyse et restitution des retours utilisateurs pour orienter les évolutions du produit'
        ],
        technologies: ['Flutter', 'Dart', 'Firebase', 'Google Vision AI', 'Node.js']
    },
    proj2: {
        title: 'Référentiel Indicateurs',
        subtitle: 'Application Web',
        description: 'Plateforme web permettant de centraliser, visualiser et analyser les indicateurs métiers clés pour faciliter la prise de décision des managers et dirigeants.',
        features: [
            'Dashboard interactif avec graphiques dynamiques',
            'Import automatique de données multi-sources',
            'Alertes configurables sur seuils critiques',
            'Rapports automatisés et export PDF/Excel',
            'Gestion des droits et périmètres utilisateurs'
        ],
        technologies: ['Next', 'Node.js', 'PostgreSQL', 'Chart.js', 'Docker']
    },
    proj3: {
        title: 'Conception de logiciel pour les saisines de la Cour des Comptes',
        subtitle: 'Recherche utilisateurs & conception de solutions',
        description: 'Projet de conception visant à améliorer et structurer les outils liés au traitement des saisines de la Cour des Comptes, en s’appuyant sur une compréhension fine des besoins des usagers et des contraintes institutionnelles.',
        features: [
            'Exploration et analyse des solutions existantes pouvant répondre aux besoins des usagers',
            'Cadrage technique et identification des pistes de conception logicielle adaptées au contexte',
            'Accompagnement de l’équipe de designers (User Studio) dans la recherche utilisateur et la conduite des entretiens',
            'Analyse et synthèse des retours utilisateurs pour orienter les choix de conception et les arbitrages techniques',
        ],
        technologies: ['UX research', 'Design centré utilisateur', 'Cadrage technique', 'Prototypage', 'Co-conception']
    },
    proj4: {
        title: 'Veille Stratégique',
        subtitle: 'Outil Interne',
        description: 'Système automatisé de veille technologique et concurrentielle qui agrège, analyse et synthétise les informations provenant de multiples sources web.',
        features: [
            'Crawling automatique de sources configurables',
            'Analyse de sentiment et extraction d\'entités',
            'Résumés automatiques par IA',
            'Newsletter personnalisée hebdomadaire',
            'Tableau de bord des tendances et alertes'
        ],
        technologies: ['Python', 'Scrapy', 'OpenAI', 'MongoDB', 'React']
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

// ===================== MODAL =====================
class Modal {
    constructor() {
        this.modal = document.getElementById('modal');
        this.content = this.modal?.querySelector('.modal__content');
        this.closeBtn = this.modal?.querySelector('.modal__close');
        this.backdrop = this.modal?.querySelector('.modal__backdrop');

        if (!this.modal) return;

        this.init();
    }

    init() {
        // Add click events to all modal triggers
        document.querySelectorAll('[data-modal]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const id = trigger.dataset.modal;
                this.open(id);
            });
        });

        // Close events
        this.closeBtn?.addEventListener('click', () => this.close());
        this.backdrop?.addEventListener('click', () => this.close());

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    open(id) {
        const data = modalContent[id];

        if (!data) return;

        // Build modal content
        const isExperience = id.startsWith('exp');
        const listTitle = isExperience ? 'Responsabilités' : 'Fonctionnalités';
        const listItems = isExperience ? data.responsibilities : data.features;

        this.content.innerHTML = `
            <div class="modal__header">
                <span class="modal__subtitle">${data.subtitle}</span>
                <h3 class="modal__title">${data.title}</h3>
                ${data.period ? `<span class="modal__period">${data.period}</span>` : ''}
            </div>
            <div class="modal__body">
                <p class="modal__desc">${data.description}</p>

                <div class="modal__section">
                    <h4 class="modal__section-title">${listTitle}</h4>
                    <ul class="modal__list">
                        ${listItems.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>

                <div class="modal__section">
                    <h4 class="modal__section-title">Technologies</h4>
                    <div class="modal__tags">
                        ${data.technologies.map(tech => `<span class="modal__tag">${tech}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        // Show modal
        this.modal.classList.add('active');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
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
        this.elements = document.querySelectorAll('.project, .stat, .timeline__item, .skill-card');
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: '50px 0px 0px 0px'
        });

        this.elements.forEach((el) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    }
}

// ===================== COUNTER ANIMATION =====================
class CounterAnimation {
    constructor() {
        this.counters = document.querySelectorAll('[data-count]');
        if (this.counters.length === 0) return;
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
        }, {
            threshold: 0.5
        });

        this.counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(el) {
        const target = parseInt(el.dataset.count, 10);
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const update = () => {
            current += step;
            if (current < target) {
                el.textContent = Math.floor(current);
                requestAnimationFrame(update);
            } else {
                el.textContent = target;
            }
        };

        update();
    }
}

// ===================== MOBILE NAV =====================
class MobileNav {
    constructor() {
        this.toggle = document.querySelector('.nav-toggle');
        this.nav = document.querySelector('.nav');
        this.body = document.body;
        this.links = document.querySelectorAll('.nav__link');

        if (!this.toggle || !this.nav) return;

        this.init();
    }

    init() {
        this.toggle.addEventListener('click', () => this.toggleNav());

        // Close on link click
        this.links.forEach(link => {
            link.addEventListener('click', () => {
                if (this.nav.classList.contains('active')) {
                    this.closeNav();
                }
            });
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.nav.classList.contains('active')) {
                this.closeNav();
            }
        });
    }

    toggleNav() {
        this.nav.classList.toggle('active');
        this.body.classList.toggle('nav-open');
    }

    closeNav() {
        this.nav.classList.remove('active');
        this.body.classList.remove('nav-open');
    }
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    new Cursor();
    new ThemeToggle();
    new Modal();
    new MobileNav();
    new SmoothScroll();
    new ScrollAnimations();
    new CounterAnimation();
});
