/* ===========================================
   Internationalization (i18n) Module
   =========================================== */

const translations = {
    fr: {
        // Navigation
        'nav.about': 'À propos',
        'nav.skills': 'Compétences',
        'nav.experience': 'Parcours',
        'nav.projects': 'Projets',
        'nav.contact': 'Contact',

        // Hero
        'hero.tag.dev': 'Développement',
        'hero.tag.data': 'Data',
        'hero.tag.management': 'Management',
        'hero.intro': 'Je suis',
        'hero.title': 'Ingénieur logiciel',
        'hero.subtitle': "J'accompagne entreprises et porteurs de projets dans la conception de solutions sur mesure, robustes et boostées par l'intelligence artificielle.",
        'hero.cta.contact': 'Discutons de votre projet',
        'hero.cta.projects': 'Voir mes réalisations',
        'hero.scroll': 'Défiler',
        'hero.stamp.available': 'Disponible',
        'hero.stamp.paris': 'Paris, FR',

        // About
        'about.number': '01 — À propos',
        'about.title': 'Expertise technique &',
        'about.title.em': 'vision produit',
        'about.heading': 'Développeur passionné, créateur de solutions',
        'about.p1': "Ingénieur logiciel spécialisé dans le web, je conçois des systèmes numériques pensés pour durer.",
        'about.p2': "Mon travail se situe à l’interface entre développement, compréhension des usages et structuration des systèmes. J’interviens sur des contextes complexes et contraints, où la fiabilité, la clarté et la maintenabilité sont essentielles. Je m’appuie sur une forte acculturation au design (recherche utilisateur, design system, conception par scénarios) et sur l’exploration de la donnée et de la cartographie pour éclairer les choix techniques et rendre l’information plus lisible.",
        'about.p3': 'Formé au design fiction par le laboratoire "Où sont les Dragons" et Max Mollon (Sciences Po), j\'apporte une approche prospective unique à mes projets.',
        'about.stat.years': "Années d'expérience",
        'about.stat.projects': 'Projets réalisés',
        'about.stat.satisfaction': 'Satisfaction client',
        'about.decoration.expert': 'Expert LLM',
        'about.decoration.years': '+10 ans exp.',

        // Skills
        'skills.number': '02 — Compétences',
        'skills.title': 'Ce que je',
        'skills.title.em': 'maîtrise',
        'skills.ai.title': 'Intelligence Artificielle',
        'skills.ai.desc': "Intégration de modèles de langage dans des applications métier. Agents intelligents, systèmes RAG, assistants contextuels.",
        'skills.frontend.title': 'Développement Frontend',
        'skills.frontend.desc': "Applications web complexes et performantes. State management, lazy loading, architecture modulaire.",
        'skills.backend.title': 'Développement Backend',
        'skills.backend.desc': "APIs RESTful robustes et scalables. Architectures microservices, gestion de bases de données.",
        'skills.mobile.title': 'Applications Mobiles',
        'skills.mobile.desc': "Apps cross-platform performantes. De la conception à la publication sur les stores.",
        'skills.design.title': 'UX/UI Design',
        'skills.design.desc': "Interfaces intuitives et esthétiques. Recherche utilisateur, prototypes, design systems.",
        'skills.devops.title': 'DevOps & Cloud',
        'skills.devops.desc': "CI/CD, containerisation, infrastructure as code. Déploiements automatisés et monitoring.",

        // Experience
        'experience.number': '03 — Parcours',
        'experience.title': 'Une trajectoire',
        'experience.title.em': 'innovation → impact',
        'experience.job1.company': 'Laboratoire de Police Scientifique',
        'experience.job1.role': 'Chef adjoint IT — Ingénieur SIC',
        'experience.job1.desc': "Conception de solutions techniques innovantes pour les enquêtes judiciaires. Veille stratégique et structuration des processus.",
        'experience.job1.date': '2022 — Présent',
        'experience.job2.company': 'Point Virgule',
        'experience.job2.role': 'Coordinateur technique – Données & développement',
        'experience.job2.desc': "Le collectif Outils Publics est spécialisé dans la recherche, l'exploration et création d’outils numériques applicatifs.",
        'experience.job2.date': '2020 — Présent',
        'experience.job3.company': "Ministère de l'Économie",
        'experience.job3.role': 'Analyste Dev — Labo Transformation',
        'experience.job3.desc': "Conception de logiciels pour optimiser les processus ministériels. Design de service, UX/UI, data visualisation.",
        'experience.job3.date': '2019 — 2022',

        // Projects
        'projects.number': '04 — Projets',
        'projects.title': 'Solutions',
        'projects.title.em': 'concrètes',
        'projects.title.end': ', impact réel',
        'projects.view': 'Voir le projet',
        'projects.1.title': 'Bercy Vert',
        'projects.1.type': 'Conception de logiciel – Transition écologique',
        'projects.1.desc': "Projet de conception d’un logiciel destiné à accompagner la démarche de transition verte et écologique.",
        'projects.2.title': 'Référentiel Indicateurs',
        'projects.2.type': 'Web App',
        'projects.2.desc': "Outil collaboratif de suivi des indicateurs ministériels avec visualisations interactives.",
        'projects.3.title': 'Veille Stratégique',
        'projects.3.type': 'Outil interne',
        'projects.3.desc': "Suite d'outils d'analyse des tendances et de veille technologique automatisée.",
        'projects.4.title': 'Assistant IA Métier',
        'projects.4.type': 'AI Agent',
        'projects.4.desc': "Agent IA personnalisé intégré aux processus clients pour automatiser les tâches répétitives.",

        // Contact
        'contact.number': '05 — Contact',
        'contact.title': 'Un projet ?',
        'contact.title.em': 'Parlons-en',
        'contact.subtitle': "Développeur fullstack, expert IA ou conseil technique — je suis à votre écoute.",

        // Footer
        'footer.copyright': '© 2025 Clément Plançon — Tous droits réservés',
        'footer.legal': 'Mentions légales',

        // Marquee
        'marquee.available': 'Disponible pour projets'
    },
    en: {
        // Navigation
        'nav.about': 'About',
        'nav.skills': 'Skills',
        'nav.experience': 'Experience',
        'nav.projects': 'Projects',
        'nav.contact': 'Contact',

        // Hero
        'hero.tag.dev': 'Development',
        'hero.tag.data': 'Data',
        'hero.tag.management': 'Management',
        'hero.intro': "I'm",
        'hero.title': 'Software Engineer',
        'hero.subtitle': 'I help companies and project leaders design custom, robust solutions powered by artificial intelligence.',
        'hero.cta.contact': "Let's discuss your project",
        'hero.cta.projects': 'View my work',
        'hero.scroll': 'Scroll',
        'hero.stamp.available': 'Available',
        'hero.stamp.paris': 'Paris, FR',

        // About
        'about.number': '01 — About',
        'about.title': 'Technical expertise &',
        'about.title.em': 'product vision',
        'about.heading': 'Passionate developer, solution creator',
        'about.p1': 'Software engineer specialized in fullstack web development, I combine technical expertise with UX/UI sensibility to create high-performance digital solutions.',
        'about.p2': 'My work lies at the intersection of development, understanding usage, and structuring systems. I work in complex and constrained contexts where reliability, clarity, and maintainability are essential. I draw on my strong background in design (user research, design systems, scenario-based design) and on data exploration and mapping to inform technical choices and make information more readable.',
        'about.p3': 'Trained in design fiction by "Où sont les Dragons" lab and Max Mollon (Sciences Po), I bring a unique forward-thinking approach to my projects.',
        'about.stat.years': 'Years of experience',
        'about.stat.projects': 'Projects completed',
        'about.stat.satisfaction': 'Client satisfaction',
        'about.decoration.expert': 'LLM Expert',
        'about.decoration.years': '+10 yrs exp.',

        // Skills
        'skills.number': '02 — Skills',
        'skills.title': 'What I',
        'skills.title.em': 'master',
        'skills.ai.title': 'Artificial Intelligence',
        'skills.ai.desc': 'Integrating language models into business apps. Intelligent agents, RAG systems, contextual assistants.',
        'skills.frontend.title': 'Frontend Development',
        'skills.frontend.desc': 'Complex and high-performance web apps. State management, lazy loading, modular architecture.',
        'skills.backend.title': 'Backend Development',
        'skills.backend.desc': 'Robust and scalable RESTful APIs. Microservices architectures, database management.',
        'skills.mobile.title': 'Mobile Applications',
        'skills.mobile.desc': 'High-performance cross-platform apps. From design to store publication.',
        'skills.design.title': 'UX/UI Design',
        'skills.design.desc': 'Intuitive and aesthetic interfaces. User research, prototypes, design systems.',
        'skills.devops.title': 'DevOps & Cloud',
        'skills.devops.desc': 'CI/CD, containerization, infrastructure as code. Automated deployments and monitoring.',

        // Experience
        'experience.number': '03 — Experience',
        'experience.title': 'A journey from',
        'experience.title.em': 'innovation → impact',
        'experience.job1.company': 'Forensic Science Laboratory',
        'experience.job1.role': 'Deputy Head IT — ICT Engineer',
        'experience.job1.desc': 'Design of innovative technical solutions for judicial investigations. Strategic monitoring and process structuring.',
        'experience.job1.date': '2022 — Present',
        'experience.job2.company': 'Point Virgule',
        'experience.job2.role': 'Technical Coordinator – Data & Development',
        'experience.job2.desc': 'Supporting companies. Specializing in AI, intelligent agents and custom business solutions.',
        'experience.job2.date': '2020 — Present',
        'experience.job3.company': 'Ministry of Economy',
        'experience.job3.role': 'Analyst Dev — Transformation Lab',
        'experience.job3.desc': 'Software design to optimize ministerial processes. Service design, UX/UI, data visualization.',
        'experience.job3.date': '2019 — 2022',

        // Projects
        'projects.number': '04 — Projects',
        'projects.title': '',
        'projects.title.em': 'Concrete',
        'projects.title.end': ' solutions, real impact',
        'projects.view': 'View project',
        'projects.1.title': 'Bercy Vert',
        'projects.1.type': 'Software design – Ecological transition',
        'projects.1.desc': 'Project to design software to support the green and ecological transition process of the Ministry of Economy and Finance.',
        'projects.2.title': 'Indicators Dashboard',
        'projects.2.type': 'Web App',
        'projects.2.desc': 'Collaborative ministerial indicators tracking tool with interactive visualizations.',
        'projects.3.title': 'Strategic Watch',
        'projects.3.type': 'Internal tool',
        'projects.3.desc': 'Trend analysis tool suite and automated technology monitoring.',
        'projects.4.title': 'Software design for referrals to the Court of Auditors',
        'projects.4.type': 'User research & solution design',
        'projects.4.desc': 'Design project aimed at improving and structuring tools related to the processing of referrals to the Court of Auditors.',

        // Contact
        'contact.number': '05 — Contact',
        'contact.title': 'Have a project?',
        'contact.title.em': "Let's talk",
        'contact.subtitle': "Fullstack developer, AI expert or technical consulting — I'm here for you.",

        // Footer
        'footer.copyright': '© 2025 Clément Plançon — All rights reserved',
        'footer.legal': 'Legal',

        // Marquee
        'marquee.available': 'Available for projects'
    }
};

class I18n {
    constructor() {
        this.currentLang = this.getSavedLanguage() || this.detectLanguage();
        this.init();
    }

    detectLanguage() {
        const browserLang = navigator.language.split('-')[0];
        return translations[browserLang] ? browserLang : 'fr';
    }

    getSavedLanguage() {
        return localStorage.getItem('portfolio-lang');
    }

    saveLanguage(lang) {
        localStorage.setItem('portfolio-lang', lang);
    }

    init() {
        document.documentElement.setAttribute('data-lang', this.currentLang);
        this.updateAllTranslations();
    }

    translate(key) {
        return translations[this.currentLang][key] || key;
    }

    updateAllTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translate(key);

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Update HTML attributes (title, aria-label, etc.)
        document.querySelectorAll('[data-i18n-attr]').forEach(element => {
            const data = element.getAttribute('data-i18n-attr').split(':');
            const attr = data[0];
            const key = data[1];
            element.setAttribute(attr, this.translate(key));
        });
    }

    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
            this.saveLanguage(lang);
            document.documentElement.setAttribute('data-lang', lang);
            this.updateAllTranslations();

            // Dispatch custom event for other modules
            window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
        }
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'fr' ? 'en' : 'fr';
        this.setLanguage(newLang);
        return newLang;
    }

    getCurrentLanguage() {
        return this.currentLang;
    }
}

// Export as singleton
const i18n = new I18n();
export default i18n;
