/**
 * Clément Plançon — Portfolio 2024
 * JavaScript - Interactions, i18n & Modals
 */

// ===================== TRANSLATIONS =====================
const translations = {
    fr: {
        // Navigation
        'nav.work': 'Projets',
        'nav.about': 'À propos',
        'nav.skills': 'Compétences',
        'nav.articles': 'Articles',
        'nav.dataviz': 'Dataviz',
        'nav.contact': 'Contact',

        // Hero
        'hero.tag1': 'Développement',
        'hero.tag2': 'Data & IA',
        'hero.tag3': 'Management',
        'hero.intro': 'Je suis Clément Plançon,',
        'hero.title1': 'Ingénieur',
        'hero.title2': 'logiciel',
        'hero.desc': ' Je conçois des solutions numériques innovantes, alliant expertise technique et curiosité pour transformer les idées en produits performants.',
        'hero.cta': 'Discutons de votre projet',
        'hero.cta2': 'Voir mes réalisations',
        'hero.badge.years': 'ans',
        'hero.badge.label': 'd\'expérience',
        'hero.scroll': 'Scroll',
        'hero.stat1': 'Années d\'expérience',
        'hero.stat2': 'Projets réalisés',
        'hero.stat3': 'Technologies maîtrisées',

        // About
        'about.title': 'À propos',
        'about.since': 'Depuis 2020',
        'about.lead': 'Ingénieur logiciel spécialisé dans le web, je conçois des systèmes numériques pensés pour durer.',
        'about.text': 'Mon travail se situe à l’interface entre développement, compréhension des usages et structuration des systèmes. J’interviens sur des contextes complexes et contraints, où la fiabilité, la clarté et la maintenabilité sont essentielles. Je m’appuie sur une forte acculturation au design (recherche utilisateur, design system, conception par scénarios) et sur l’exploration de la donnée et de la cartographie pour éclairer les choix techniques et rendre l’information plus lisible.',
        'about.stat1': 'Années d\'expérience',
        'about.stat2': 'Projets réalisés',
        'about.stat3': 'Curiosité',
        'about.experience': 'Parcours',
        'about.experience.subtitle': 'Cliquez sur une expérience pour en savoir plus',

        // Timeline / Experience
        'date.present': 'Présent',
        'exp1.title': 'Laboratoire de Police Scientifique',
        'exp1.role': 'Chef adjoint IT — Ingénieur SIC',
        'exp2.title': 'Outils Publics',
        'exp2.role': 'Coordinateur technique – Données & développement',
        'exp3.title': 'Ministère de l\'Économie',
        'exp3.role': 'Ingénieur logiciel et chef de projet technique  — Laboratoire de la Transformation',

        // Skills
        'skills.title': 'Compétences',
        'skills.dev.title': 'Développement Web',
        'skills.dev.desc': 'Applications web modernes avec React, Node.js. APIs REST et GraphQL.',
        'skills.ia.title': 'Intelligence Artificielle',
        'skills.ia.desc': 'Intégration de LLM, systèmes RAG, chatbots intelligents et automatisation par IA.',
        'skills.mobile.title': 'Applications Mobiles',
        'skills.mobile.desc': 'Développement cross-platform avec Flutter et Dart. UI/UX mobile natives.',
        'skills.data.title': 'Data & Backend',
        'skills.data.desc': 'Architecture backend, bases de données SQL/NoSQL, ETL et analyse de données.',
        'skills.ux.title': 'UX/UI Design',
        'skills.ux.desc': 'Conception d\'interfaces utilisateur, prototypage et design systems.',
        'skills.management.title': 'Management',
        'skills.management.desc': 'Gestion d\'équipe technique, méthodologies agiles et pilotage de projets.',

        // Projects
        'projects.title': 'Projets sélectionnés',
        'projects.subtitle': 'Cliquez sur un projet pour voir les détails',
        'proj1.cat': 'Conception de logiciel – Transition écologique',
        'proj1.title': 'Bercy Vert',
        'proj1.desc': 'Projet de conception d’un logiciel destiné à accompagner la démarche de transition verte et écologique.',
        'proj2.cat': 'Application Web',
        'proj2.title': 'Référentiel Indicateurs',
        'proj2.desc': 'Plateforme de centralisation et visualisation des indicateurs métiers pour la prise de décision.',
        'proj3.cat': 'Recherche utilisateurs & conception de solutions',
        'proj3.title': 'Conception de logiciel pour les saisines de la Cour des Comptes',
        'proj3.desc': 'Projet de conception visant à améliorer et structurer les outils liés au traitement des saisines de la Cour des Comptes.',
        'proj4.cat': 'Outil Interne',
        'proj4.title': 'Veille Stratégique',
        'proj4.desc': 'Système automatisé de veille technologique et concurrentielle avec agrégation et analyse de contenus.',

        // Contact
        'contact.title': 'Un projet en tête ?<br><span class="text--accent">Travaillons ensemble.</span>',

        // Footer
        'footer.made': 'Conçu avec passion',

        // Modal
        'modal.close': 'Fermer',
        'modal.technologies': 'Technologies',
        'modal.responsibilities': 'Responsabilités',
        'modal.features': 'Fonctionnalités'
    },
    en: {
        // Navigation
        'nav.work': 'Work',
        'nav.about': 'About',
        'nav.skills': 'Skills',
        'nav.articles': 'Articles',
        'nav.dataviz': 'Dataviz',
        'nav.contact': 'Contact',

        // Hero
        'hero.tag1': 'Development',
        'hero.tag2': 'Data & AI',
        'hero.tag3': 'Management',
        'hero.intro': 'I am Clément Plançon,',
        'hero.title1': 'Software',
        'hero.title2': 'engineer',
        'hero.desc': ' I design innovative digital solutions, combining technical expertise and curiosity to transform ideas into high-performance products.',
        'hero.cta': 'Let\'s discuss your project',
        'hero.cta2': 'See my work',
        'hero.badge.years': 'years',
        'hero.badge.label': 'of experience',
        'hero.scroll': 'Scroll',
        'hero.stat1': 'Years of experience',
        'hero.stat2': 'Projects completed',
        'hero.stat3': 'Technologies mastered',

        // About
        'about.title': 'About',
        'about.since': 'Since 2020',
        'about.lead': 'As a software engineer specializing in web development, I design digital systems built to last.',
        'about.text': 'My work lies at the intersection of development, understanding usage, and structuring systems. I work in complex and constrained contexts where reliability, clarity, and maintainability are essential. I draw on my strong background in design (user research, design systems, scenario-based design) and on data exploration and mapping to inform technical choices and make information more readable.',
        'about.stat1': 'Years of experience',
        'about.stat2': 'Projects completed',
        'about.stat3': 'Curiosity',
        'about.experience': 'Career',
        'about.experience.subtitle': 'Click on an experience to learn more',

        // Timeline / Experience
        'date.present': 'Present',
        'exp1.title': 'Paris Forensic Science Laboratory',
        'exp1.role': 'Deputy IT Head — ICT Engineer',
        'exp2.title': 'Outils Publics',
        'exp2.role': 'Technical Coordinator – Data & Development',
        'exp3.title': 'Ministry of Economy',
        'exp3.role': 'Software Engineer and Technical Project Manager  — Transformation Lab',

        // Skills
        'skills.title': 'Skills',
        'skills.dev.title': 'Web Development',
        'skills.dev.desc': 'Modern web applications with React, Node.js. REST and GraphQL APIs.',
        'skills.ia.title': 'Artificial Intelligence',
        'skills.ia.desc': 'LLM integration, RAG systems, intelligent chatbots and AI automation.',
        'skills.mobile.title': 'Mobile Applications',
        'skills.mobile.desc': 'Cross-platform development with Flutter and Dart. Native mobile UI/UX.',
        'skills.data.title': 'Data & Backend',
        'skills.data.desc': 'Backend architecture, SQL/NoSQL databases, ETL and data analysis.',
        'skills.ux.title': 'UX/UI Design',
        'skills.ux.desc': 'User interface design, prototyping and design systems.',
        'skills.management.title': 'Management',
        'skills.management.desc': 'Technical team management, agile methodologies and project leadership.',

        // Projects
        'projects.title': 'Selected projects',
        'projects.subtitle': 'Click on a project for details',
        'proj1.cat': 'Software design – Ecological transition',
        'proj1.title': 'Bercy Vert',
        'proj1.desc': 'Software design project to support the green and ecological transition process.',
        'proj2.cat': 'Web Application',
        'proj2.title': 'Indicators Dashboard',
        'proj2.desc': 'Platform for centralizing and visualizing business indicators for decision-making.',
        'proj3.cat': 'User research & solution design',
        'proj3.title': 'Software design for referrals to the Court of Auditors',
        'proj3.desc': 'Design project aimed at improving and structuring tools related to the processing of referrals to the Court of Auditors.',
        'proj4.cat': 'Internal Tool',
        'proj4.title': 'Strategic Intelligence',
        'proj4.desc': 'Automated technology and competitive intelligence system with content aggregation and analysis.',

        // Contact
        'contact.title': 'Got a project?<br><span class="text--accent">Let\'s work together.</span>',

        // Footer
        'footer.made': 'Made with passion',

        // Modal
        'modal.close': 'Close',
        'modal.technologies': 'Technologies',
        'modal.responsibilities': 'Responsibilities',
        'modal.features': 'Features'
    }
};

// ===================== MODAL CONTENT =====================
const modalContent = {
    // Experiences
    exp1: {
        fr: {
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
        en: {
            title: 'Paris Forensic Science Laboratory',
            subtitle: 'Deputy IT Head — ICT Engineer',
            period: '2022 — Present',
            description: 'At the Paris Forensic Science Laboratory, I lead a development team of four software developers.',
            responsibilities: [
                "Lead a team of 4 developers (technical supervision, prioritization, support)",
                "Design and arbitration of technical choices, in line with business needs and operational constraints",
                "Maintain operational conditions, evolve and improve the reliability of existing business applications",
                "Contribute to the structuring of development practices and technical processes,"
            ],
            technologies: ['Docker', 'PHP', 'K8S', 'PostgreSQL']
        }
    },
    exp2: {
        fr: {
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
        en: {
            title: 'Outils Publics',
            subtitle: 'Technical Coordinator – Data & Development',
            period: '2024 — Present',
            description: 'The Outils Publics collective specializes in researching, exploring, and creating digital application tools.',
            responsibilities: [
                'Development of prototypes, tools, and visualizations based on public data',
                'Structuring of practices, tools, and technical methods',
                'Interface between research, design, and software implementation',
            ],
            technologies: ['React', 'Node.js', 'Flutter', 'Python', 'OpenAI']
        }
    },
    exp3: {
        fr: {
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
        en: {
            title: 'Ministry of Economy and Finance',
            subtitle: 'Software Engineer and Technical Project Manager — Transformation Lab',
            period: '2019 — 2022',
            description: 'Within the Digital Transformation Lab, I participated in modernizing public services by developing innovative solutions and supporting staff in adopting new tools.',
            responsibilities: [
                'Development of internal applications in React and Next.js',
                'Needs analysis and specification writing',
                'Facilitation of innovation and design thinking workshops',
                'Technology monitoring and experimentation'
            ],
            technologies: ['Next', 'React', 'Power Platform', 'SQL Server', 'Azure']
        }
    },
    // Projects
    proj1: {
        fr: {
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
        en: {
            title: 'Bercy Vert',
            subtitle: 'Software design – Ecological transition',
            description: "Project to design software to support the Ministry of Economy and Finance's green and ecological transition initiative. The aim was to meet the needs of ministry representatives by centralizing and structuring the actions resulting from the BEGES and SPE measures.",
            features: [
                'Project scoping and expression of functional requirements in consultation with stakeholders',
                'Definition of the development methodology and structuring of the project cycle',
                'Multi-group management and expenditure history',
                'Design and development of the proof of concept interface',
                'Collection, analysis, and reporting of user feedback to guide product development'
            ],
            technologies: ['Flutter', 'Dart', 'Firebase', 'Google Vision AI', 'Node.js']
        }
    },
    proj2: {
        fr: {
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
        en: {
            title: 'Indicators Dashboard',
            subtitle: 'Web Application',
            description: 'Web platform for centralizing, visualizing and analyzing key business indicators to facilitate decision-making for managers and executives.',
            features: [
                'Interactive dashboard with dynamic charts',
                'Automatic multi-source data import',
                'Configurable alerts on critical thresholds',
                'Automated reports and PDF/Excel export',
                'User rights and scope management'
            ],
            technologies: ['Node.js', 'PostgreSQL', 'Chart.js', 'Docker']
        }
    },
    proj3: {
        fr: {
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
        en: {
            title: 'Software design for referrals to the Court of Auditors',
            subtitle: 'User research & solution design',
            description: 'Design project aimed at improving and structuring tools related to the processing of referrals to the Court of Auditors, based on a detailed understanding of user needs and institutional constraints.',
            features: [
                'Exploration and analysis of existing solutions that could meet user needs',
                'Technical scoping and identification of software design approaches suited to the context',
                'Support for the design team (User Studio) in user research and conducting interviews',
                'Analysis and synthesis of user feedback to guide design choices and technical decisions',
            ],
            technologies: ['Python', 'LangChain', 'OpenAI GPT-4', 'Pinecone', 'FastAPI']
        }
    },
    proj4: {
        fr: {
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
        },
        en: {
            title: 'Strategic Intelligence',
            subtitle: 'Internal Tool',
            description: 'Automated technology and competitive intelligence system that aggregates, analyzes and synthesizes information from multiple web sources.',
            features: [
                'Automatic crawling of configurable sources',
                'Sentiment analysis and entity extraction',
                'AI-powered automatic summaries',
                'Weekly personalized newsletter',
                'Trends dashboard and alerts'
            ],
            technologies: ['Python', 'Scrapy', 'OpenAI', 'MongoDB', 'React']
        }
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

        // Dispatch language change event for other scripts
        document.dispatchEvent(new CustomEvent('langChange', { detail: { lang } }));
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
        const lang = document.documentElement.dataset.lang || 'fr';
        const data = modalContent[id]?.[lang];

        if (!data) return;

        // Build modal content
        const isExperience = id.startsWith('exp');
        const listTitle = isExperience
            ? translations[lang]['modal.responsibilities']
            : translations[lang]['modal.features'];
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
                    <h4 class="modal__section-title">${translations[lang]['modal.technologies']}</h4>
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
    new LanguageToggle();
    new Modal();
    new MobileNav();
    new SmoothScroll();
    new ScrollAnimations();
    new CounterAnimation();
});
