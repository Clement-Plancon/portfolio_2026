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
        'nav.contact': 'Contact',

        // Hero
        'hero.tag1': 'Développement',
        'hero.tag2': 'Data & IA',
        'hero.tag3': 'Management',
        'hero.intro': 'Je suis Clément Plançon,',
        'hero.title1': 'Ingénieur',
        'hero.title2': 'logiciel',
        'hero.desc': 'Je conçois des solutions numériques innovantes, alliant expertise technique et intelligence artificielle pour transformer vos idées en produits performants.',
        'hero.cta': 'Discutons de votre projet',
        'hero.cta2': 'Voir mes réalisations',
        'hero.badge.years': 'ans',
        'hero.badge.label': 'd\'expérience',
        'hero.scroll': 'Scroll',

        // About
        'about.title': 'À propos',
        'about.since': 'Depuis 2014',
        'about.lead': 'Ingénieur logiciel passionné par l\'innovation, je transforme des idées complexes en solutions élégantes et performantes.',
        'about.text': 'Actuellement Chef adjoint de la section informatique au Laboratoire de Police Scientifique de Paris, je conçois des solutions techniques innovantes pour les enquêtes judiciaires. En parallèle, je développe des projets personnels et accompagne des entreprises dans leur transformation numérique.',
        'about.stat1': 'Années d\'expérience',
        'about.stat2': 'Projets réalisés',
        'about.stat3': 'Curiosité',
        'about.experience': 'Parcours',
        'about.experience.subtitle': 'Cliquez sur une expérience pour en savoir plus',

        // Timeline / Experience
        'date.present': 'Présent',
        'exp1.title': 'Laboratoire de Police Scientifique',
        'exp1.role': 'Chef adjoint IT — Ingénieur SIC',
        'exp2.title': 'Point Virgule',
        'exp2.role': 'Fondateur — Développeur Fullstack & IA',
        'exp3.title': 'Ministère de l\'Économie',
        'exp3.role': 'Analyste Développeur — Laboratoire de la Transformation',

        // Skills
        'skills.title': 'Compétences',
        'skills.dev.title': 'Développement Web',
        'skills.dev.desc': 'Applications web modernes avec Angular, React, Node.js. APIs REST et GraphQL.',
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
        'proj1.cat': 'Application Mobile — IA',
        'proj1.title': 'QuiPaieQuoi',
        'proj1.desc': 'Application de gestion des dépenses partagées avec reconnaissance automatique des tickets par IA.',
        'proj2.cat': 'Application Web',
        'proj2.title': 'Référentiel Indicateurs',
        'proj2.desc': 'Plateforme de centralisation et visualisation des indicateurs métiers pour la prise de décision.',
        'proj3.cat': 'Agent IA — RAG',
        'proj3.title': 'Assistant IA Métier',
        'proj3.desc': 'Chatbot intelligent utilisant RAG pour répondre aux questions métiers à partir de la documentation interne.',
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
        'nav.contact': 'Contact',

        // Hero
        'hero.tag1': 'Development',
        'hero.tag2': 'Data & AI',
        'hero.tag3': 'Management',
        'hero.intro': 'I am Clément Plançon,',
        'hero.title1': 'Software',
        'hero.title2': 'engineer',
        'hero.desc': 'I design innovative digital solutions, combining technical expertise and artificial intelligence to transform your ideas into high-performance products.',
        'hero.cta': 'Let\'s discuss your project',
        'hero.cta2': 'See my work',
        'hero.badge.years': 'years',
        'hero.badge.label': 'of experience',
        'hero.scroll': 'Scroll',

        // About
        'about.title': 'About',
        'about.since': 'Since 2014',
        'about.lead': 'Software engineer passionate about innovation, I transform complex ideas into elegant and efficient solutions.',
        'about.text': 'Currently Deputy Head of IT at the Paris Forensic Science Laboratory, I design innovative technical solutions for judicial investigations. In parallel, I develop personal projects and support companies in their digital transformation.',
        'about.stat1': 'Years of experience',
        'about.stat2': 'Projects completed',
        'about.stat3': 'Curiosity',
        'about.experience': 'Career',
        'about.experience.subtitle': 'Click on an experience to learn more',

        // Timeline / Experience
        'date.present': 'Present',
        'exp1.title': 'Paris Forensic Science Laboratory',
        'exp1.role': 'Deputy IT Head — ICT Engineer',
        'exp2.title': 'Point Virgule',
        'exp2.role': 'Founder — Fullstack & AI Developer',
        'exp3.title': 'Ministry of Economy',
        'exp3.role': 'Developer Analyst — Transformation Lab',

        // Skills
        'skills.title': 'Skills',
        'skills.dev.title': 'Web Development',
        'skills.dev.desc': 'Modern web applications with Angular, React, Node.js. REST and GraphQL APIs.',
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
        'proj1.cat': 'Mobile App — AI',
        'proj1.title': 'QuiPaieQuoi',
        'proj1.desc': 'Shared expense management app with automatic AI-powered receipt recognition.',
        'proj2.cat': 'Web Application',
        'proj2.title': 'Indicators Dashboard',
        'proj2.desc': 'Platform for centralizing and visualizing business indicators for decision-making.',
        'proj3.cat': 'AI Agent — RAG',
        'proj3.title': 'Business AI Assistant',
        'proj3.desc': 'Intelligent chatbot using RAG to answer business questions from internal documentation.',
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
            description: 'Au sein de la Préfecture de Police de Paris, je pilote la transformation numérique du laboratoire et développe des outils innovants pour optimiser les processus d\'investigation.',
            responsibilities: [
                'Management d\'une équipe de 5 développeurs et techniciens',
                'Architecture et développement d\'applications métier critiques',
                'Intégration de solutions d\'IA pour l\'analyse de données',
                'Gestion du parc informatique et de l\'infrastructure',
                'Conduite du changement et formation des utilisateurs'
            ],
            technologies: ['Angular', 'C# .NET', 'Python', 'PostgreSQL', 'Docker']
        },
        en: {
            title: 'Paris Forensic Science Laboratory',
            subtitle: 'Deputy IT Head — ICT Engineer',
            period: '2022 — Present',
            description: 'Within the Paris Police Prefecture, I lead the digital transformation of the laboratory and develop innovative tools to optimize investigation processes.',
            responsibilities: [
                'Managing a team of 5 developers and technicians',
                'Architecture and development of critical business applications',
                'Integration of AI solutions for data analysis',
                'IT infrastructure and asset management',
                'Change management and user training'
            ],
            technologies: ['Angular', 'C# .NET', 'Python', 'PostgreSQL', 'Docker']
        }
    },
    exp2: {
        fr: {
            title: 'Point Virgule',
            subtitle: 'Fondateur — Développeur Fullstack & IA',
            period: '2020 — Présent',
            description: 'Entreprise de développement logiciel et conseil en transformation numérique. J\'accompagne des startups et PME dans la conception et le développement de leurs produits digitaux.',
            responsibilities: [
                'Développement d\'applications web et mobiles sur mesure',
                'Intégration de solutions d\'intelligence artificielle (LLM, RAG)',
                'Conseil en architecture technique et stratégie digitale',
                'Formation et accompagnement des équipes techniques',
                'Prototypage et POC pour validation de concepts'
            ],
            technologies: ['Angular', 'React', 'Node.js', 'Flutter', 'Python', 'OpenAI']
        },
        en: {
            title: 'Point Virgule',
            subtitle: 'Founder — Fullstack & AI Developer',
            period: '2020 — Present',
            description: 'Software development and digital transformation consulting company. I support startups and SMEs in designing and developing their digital products.',
            responsibilities: [
                'Custom web and mobile application development',
                'AI solutions integration (LLM, RAG)',
                'Technical architecture and digital strategy consulting',
                'Training and support for technical teams',
                'Prototyping and POC for concept validation'
            ],
            technologies: ['Angular', 'React', 'Node.js', 'Flutter', 'Python', 'OpenAI']
        }
    },
    exp3: {
        fr: {
            title: 'Ministère de l\'Économie et des Finances',
            subtitle: 'Analyste Développeur — Laboratoire de la Transformation',
            period: '2019 — 2022',
            description: 'Au sein du Lab de la Transformation Numérique, j\'ai participé à la modernisation des services publics en développant des solutions innovantes et en accompagnant les agents dans l\'adoption de nouveaux outils.',
            responsibilities: [
                'Développement d\'applications internes en Angular et .NET',
                'Automatisation de processus métier avec RPA',
                'Analyse des besoins et rédaction de spécifications',
                'Animation d\'ateliers d\'innovation et de design thinking',
                'Veille technologique et expérimentation'
            ],
            technologies: ['Angular', 'C# .NET', 'Power Platform', 'SQL Server', 'Azure']
        },
        en: {
            title: 'Ministry of Economy and Finance',
            subtitle: 'Developer Analyst — Digital Transformation Lab',
            period: '2019 — 2022',
            description: 'Within the Digital Transformation Lab, I participated in modernizing public services by developing innovative solutions and supporting staff in adopting new tools.',
            responsibilities: [
                'Internal application development in Angular and .NET',
                'Business process automation with RPA',
                'Requirements analysis and specification writing',
                'Innovation and design thinking workshop facilitation',
                'Technology watch and experimentation'
            ],
            technologies: ['Angular', 'C# .NET', 'Power Platform', 'SQL Server', 'Azure']
        }
    },
    // Projects
    proj1: {
        fr: {
            title: 'QuiPaieQuoi',
            subtitle: 'Application Mobile — IA',
            description: 'Application mobile de gestion des dépenses partagées entre amis, colocataires ou collègues. Elle intègre une fonctionnalité de reconnaissance automatique des tickets de caisse grâce à l\'IA.',
            features: [
                'Scan et reconnaissance automatique des tickets par OCR + IA',
                'Calcul automatique des remboursements optimisés',
                'Gestion multi-groupes et historique des dépenses',
                'Notifications et rappels de paiement',
                'Export des données et statistiques personnelles'
            ],
            technologies: ['Flutter', 'Dart', 'Firebase', 'Google Vision AI', 'Node.js']
        },
        en: {
            title: 'QuiPaieQuoi',
            subtitle: 'Mobile App — AI',
            description: 'Mobile application for managing shared expenses between friends, roommates or colleagues. It integrates automatic receipt recognition through AI.',
            features: [
                'Automatic receipt scanning and recognition via OCR + AI',
                'Optimized reimbursement calculation',
                'Multi-group management and expense history',
                'Payment notifications and reminders',
                'Data export and personal statistics'
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
            technologies: ['Angular', 'Node.js', 'PostgreSQL', 'Chart.js', 'Docker']
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
            technologies: ['Angular', 'Node.js', 'PostgreSQL', 'Chart.js', 'Docker']
        }
    },
    proj3: {
        fr: {
            title: 'Assistant IA Métier',
            subtitle: 'Agent IA — RAG',
            description: 'Chatbot intelligent basé sur l\'architecture RAG (Retrieval-Augmented Generation) permettant de répondre aux questions des utilisateurs en s\'appuyant sur la documentation interne de l\'entreprise.',
            features: [
                'Recherche sémantique dans la base documentaire',
                'Réponses contextualisées avec sources citées',
                'Apprentissage continu et feedback utilisateurs',
                'Interface conversationnelle intuitive',
                'Intégration avec les outils existants (Teams, Slack)'
            ],
            technologies: ['Python', 'LangChain', 'OpenAI GPT-4', 'Pinecone', 'FastAPI']
        },
        en: {
            title: 'Business AI Assistant',
            subtitle: 'AI Agent — RAG',
            description: 'Intelligent chatbot based on RAG (Retrieval-Augmented Generation) architecture to answer user questions using internal company documentation.',
            features: [
                'Semantic search in document database',
                'Contextualized answers with cited sources',
                'Continuous learning and user feedback',
                'Intuitive conversational interface',
                'Integration with existing tools (Teams, Slack)'
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

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    new Cursor();
    new ThemeToggle();
    new LanguageToggle();
    new Modal();
    new SmoothScroll();
    new ScrollAnimations();
});
