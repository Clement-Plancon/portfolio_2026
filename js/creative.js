/**
 * Clément Plançon — Portfolio 2024
 * JavaScript - Interactions & Modals
 */

// ===================== MODAL CONTENT =====================
const modalContent = {
    // Experiences
    exp1: {
        title: 'Laboratoire de Police Scientifique de Paris',
        subtitle: 'Chef adjoint · Section informatique — Ingénieur SIC',
        period: '2022 — Présent',
        location: 'Paris',
        description: "Au sein du Laboratoire de police scientifique, je pilote une équipe de quatre développeurs logiciel et j'arbitre les choix techniques au service des outils utilisés par les enquêteurs.",
        responsibilities: [
            "Encadrement technique d'une équipe de 4 développeurs : priorisation, accompagnement, revues",
            "Conception et arbitrage des choix techniques en lien avec les besoins métiers et les contraintes opérationnelles",
            "Maintien en condition opérationnelle, évolution et fiabilisation d'applications métiers critiques",
            "Structuration des pratiques de développement et des processus techniques de la section"
        ],
        technologies: ['PHP', 'PostgreSQL', 'Docker', 'Kubernetes', 'CI/CD']
    },
    exp2: {
        title: 'Outils Publics',
        subtitle: 'Coordinateur technique · Données & développement',
        period: '2024 — Présent',
        location: 'France · Distance',
        description: "Outils Publics est un collectif dédié à la recherche, l'exploration et la création d'outils numériques applicatifs autour de la donnée publique.",
        responsibilities: [
            "Développement de prototypes, outils et visualisations à partir de données publiques",
            "Structuration des pratiques, des outils et des méthodes techniques du collectif",
            "Interface entre recherche, design et implémentation logicielle"
        ],
        technologies: ['React', 'Node.js', 'Flutter', 'Python', 'Open data']
    },
    exp3: {
        title: "Ministère de l'Économie et des Finances",
        subtitle: 'Ingénieur logiciel & chef de projet — Laboratoire de la Transformation',
        period: '2022 — 2024',
        location: 'Paris — Bercy',
        description: "Au sein du Lab de la Transformation, j'ai contribué à la modernisation des services publics : applications internes, ateliers d'innovation et accompagnement des agents dans l'adoption de nouveaux outils numériques.",
        responsibilities: [
            "Développement d'applications internes en React et Next.js",
            "Analyse des besoins et rédaction de spécifications fonctionnelles",
            "Animation d'ateliers d'innovation et de design thinking auprès des équipes métier",
            "Veille technologique, expérimentation et industrialisation des prototypes retenus"
        ],
        technologies: ['C# .NET', 'Power Platform', 'SQL Server', 'Azure', 'React']
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

        const kind = isExperience ? 'Expérience' : 'Projet';
        const meta = [];
        if (data.period) meta.push(`<span class="modal__meta-item modal__meta-item--period">${data.period}</span>`);
        if (data.location) meta.push(`<span class="modal__meta-item modal__meta-item--loc">${data.location}</span>`);

        this.content.innerHTML = `
            <article class="modal__article">
                <header class="modal__header">
                    <div class="modal__eyebrow">
                        <span class="modal__kind">— ${kind}</span>
                    </div>
                    <h3 class="modal__title">${data.title}</h3>
                    <p class="modal__subtitle">${data.subtitle}</p>
                    ${meta.length ? `<div class="modal__meta">${meta.join('')}</div>` : ''}
                </header>

                <div class="modal__body">
                    <p class="modal__desc">${data.description}</p>

                    <section class="modal__section">
                        <h4 class="modal__section-title"><span aria-hidden="true">→</span> ${listTitle}</h4>
                        <ul class="modal__list">
                            ${listItems.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </section>

                    <section class="modal__section">
                        <h4 class="modal__section-title"><span aria-hidden="true">→</span> Stack &amp; outils</h4>
                        <ul class="modal__tags">
                            ${data.technologies.map(tech => `<li class="modal__tag">${tech}</li>`).join('')}
                        </ul>
                    </section>
                </div>

                <footer class="modal__foot">
                    <span class="modal__sig">CP / Portfolio</span>
                    <button type="button" class="modal__foot-close" data-modal-close>Fermer</button>
                </footer>
            </article>
        `;

        const footClose = this.content.querySelector('[data-modal-close]');
        if (footClose) footClose.addEventListener('click', () => this.close());

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

// ===================== VIEW ROUTER =====================
class ViewRouter {
    constructor() {
        this.container = document.querySelector('.views');
        this.views = document.querySelectorAll('.view');
        this.navLinks = document.querySelectorAll('.nav a[href^="#"]');
        this.defaultView = 'home';
        this.exitMs = 320;
        this.enterMs = 520;
        this.transitioning = false;

        if (!this.container || this.views.length === 0) return;

        this.viewMap = new Map();
        this.views.forEach(v => this.viewMap.set(v.dataset.view, v));

        this.init();
    }

    init() {
        // Intercept all internal hash links that target a view
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;
            const href = link.getAttribute('href');
            if (!href || href.length < 1) return;

            const targetId = href === '#' ? this.defaultView : href.slice(1);
            if (!this.viewMap.has(targetId)) return;

            e.preventDefault();
            this.navigate(targetId);
        });

        // Hashchange (back/forward)
        window.addEventListener('popstate', () => this.syncFromUrl(true));
        window.addEventListener('hashchange', () => this.syncFromUrl(true));

        // Initial state
        this.syncFromUrl(false);

        // Mark active link on load
        this.updateActiveLinks(this.currentView());
    }

    currentView() {
        const active = document.querySelector('.view.is-active');
        return active ? active.dataset.view : this.defaultView;
    }

    syncFromUrl(animate) {
        const hash = (location.hash || '').replace(/^#/, '');
        const target = this.viewMap.has(hash) ? hash : this.defaultView;
        if (animate) {
            this.navigate(target, { skipUrl: true });
        } else {
            this.setActive(target, false);
        }
    }

    setActive(viewId, animate) {
        this.views.forEach(v => {
            const active = v.dataset.view === viewId;
            v.classList.toggle('is-active', active);
            v.classList.remove('is-leaving');
            v.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
        this.updateActiveLinks(viewId);
    }

    updateActiveLinks(viewId) {
        document.querySelectorAll('.nav a[href^="#"]').forEach(a => {
            const href = a.getAttribute('href');
            const id = href === '#' ? this.defaultView : href.slice(1);
            const match = id === viewId && this.viewMap.has(id);
            a.classList.toggle('nav__link--current', match);
            if (match) {
                a.setAttribute('aria-current', 'page');
            } else {
                a.removeAttribute('aria-current');
            }
        });
    }

    navigate(viewId, opts = {}) {
        if (this.transitioning) return;
        const target = this.viewMap.get(viewId);
        if (!target) return;
        const current = document.querySelector('.view.is-active');
        if (current === target) {
            if (!opts.skipUrl) {
                const newHash = viewId === this.defaultView ? location.pathname + location.search : `#${viewId}`;
                history.replaceState({ view: viewId }, '', newHash);
            }
            return;
        }

        this.transitioning = true;
        this.container.classList.add('is-transitioning');

        // Update URL immediately
        if (!opts.skipUrl) {
            const newHash = viewId === this.defaultView ? location.pathname + location.search : `#${viewId}`;
            history.pushState({ view: viewId }, '', newHash);
        }

        // Close mobile nav if open
        document.body.classList.remove('nav-open');
        document.querySelector('.nav')?.classList.remove('active');

        // Update active link immediately for feedback
        this.updateActiveLinks(viewId);

        // 1. Mark current as leaving (absolute-positioned fade/slide out)
        if (current) {
            current.classList.remove('is-active');
            current.classList.add('is-leaving');
            current.setAttribute('aria-hidden', 'true');
        }

        // 2. Reset scroll instantly (bypass smooth scroll)
        const htmlEl = document.documentElement;
        const prevBehavior = htmlEl.style.scrollBehavior;
        htmlEl.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
        htmlEl.style.scrollBehavior = prevBehavior;

        // 3. Activate target (enter animation plays concurrently for smooth crossfade)
        target.classList.add('is-active');
        target.setAttribute('aria-hidden', 'false');

        // 4. Cleanup timers
        if (current) {
            setTimeout(() => {
                current.classList.remove('is-leaving');
            }, this.exitMs);
        }

        setTimeout(() => {
            this.container.classList.remove('is-transitioning');
            this.transitioning = false;
        }, this.enterMs);
    }
}

// ===================== SCROLL ANIMATIONS =====================
class ScrollAnimations {
    constructor() {
        this.elements = document.querySelectorAll('.proj-feat, .proj-card, .skill-card, .skill-block, .principle, .journey-item, .toolbox-group, .signature-item, .purpose, .collab-item, .presence-card, .faq-item, .home-what__item, .running-prep, .running-metric, .running-race, .home-portal');
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

// ===================== CONTACT COPY =====================
class ContactCopy {
    constructor() {
        this.btns = document.querySelectorAll('[data-copy-email]');
        if (!this.btns.length) return;
        this.btns.forEach(btn => btn.addEventListener('click', (e) => this.copy(e)));
    }

    async copy(e) {
        const btn = e.currentTarget;
        const email = btn.dataset.copyEmail;
        const label = btn.querySelector('.contact-card__copy-label');
        try {
            await navigator.clipboard.writeText(email);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = email;
            ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        btn.classList.add('is-copied');
        if (label) label.textContent = 'Copié';
        setTimeout(() => {
            btn.classList.remove('is-copied');
            if (label) label.textContent = 'Copier';
        }, 2000);
    }
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    new Cursor();
    new ThemeToggle();
    new Modal();
    new MobileNav();
    new ViewRouter();
    new ScrollAnimations();
    new CounterAnimation();
    new ContactCopy();
});
