/* ===========================================
   Dataviz Page JavaScript
   =========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Counter Animation
    class CounterAnimation {
        constructor() {
            this.counters = document.querySelectorAll('[data-count]');
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
                threshold: 0.5,
                rootMargin: '50px 0px 0px 0px'
            });

            this.counters.forEach(counter => observer.observe(counter));
        }

        animateCounter(element) {
            const target = parseInt(element.dataset.count, 10);
            const duration = 2000;
            const start = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (ease-out-expo)
                const easeOutExpo = 1 - Math.pow(2, -10 * progress);
                const current = Math.floor(target * easeOutExpo);

                element.textContent = current + '+';

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    }

    // Chart Animations on Scroll
    class ChartAnimations {
        constructor() {
            this.cards = document.querySelectorAll('.dataviz-card');
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        this.triggerChartAnimation(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px 0px 0px 0px'
            });

            this.cards.forEach((card, index) => {
                card.style.setProperty('--delay', `${index * 0.1}s`);
                observer.observe(card);
            });
        }

        triggerChartAnimation(card) {
            // Re-trigger bar animations
            const bars = card.querySelectorAll('.dataviz-card__chart--bars span');
            bars.forEach((bar, i) => {
                bar.style.animation = 'none';
                bar.offsetHeight; // Trigger reflow
                bar.style.animation = `barGrow 1s ease-out forwards ${i * 0.05}s`;
            });

            // Re-trigger scatter animations
            const dots = card.querySelectorAll('.dataviz-card__chart--scatter span');
            dots.forEach((dot, i) => {
                dot.style.animation = 'none';
                dot.offsetHeight;
                dot.style.animation = `dotAppear 0.5s ease-out forwards ${i * 0.05}s`;
            });

            // Re-trigger line animations
            const lines = card.querySelectorAll('.dataviz-line');
            lines.forEach((line, i) => {
                line.style.animation = 'none';
                line.offsetHeight;
                line.style.animation = `lineReveal 1.5s ease-out forwards ${i * 0.2}s`;
            });
        }
    }

    // Donut Chart Animation
    class DonutAnimation {
        constructor() {
            this.donut = document.querySelector('.dataviz-chart__donut');
            this.segments = document.querySelectorAll('.dataviz-chart__segment');
            this.init();
        }

        init() {
            if (!this.donut) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateDonut();
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.3
            });

            observer.observe(this.donut);
        }

        animateDonut() {
            this.segments.forEach((segment, index) => {
                const dasharray = segment.getAttribute('stroke-dasharray');
                const values = dasharray.split(' ');
                const targetLength = parseFloat(values[0]);

                segment.style.strokeDasharray = `0 502`;
                segment.style.transition = 'stroke-dasharray 1s ease-out';
                segment.style.transitionDelay = `${index * 0.15}s`;

                setTimeout(() => {
                    segment.style.strokeDasharray = dasharray;
                }, 50);
            });
        }
    }

    // Parallax Background Nodes
    class BackgroundParallax {
        constructor() {
            this.nodes = document.querySelector('.dataviz-bg__nodes');
            this.blobs = document.querySelectorAll('.dataviz-bg__chart');
            this.init();
        }

        init() {
            if (!this.nodes) return;

            let ticking = false;

            window.addEventListener('mousemove', (e) => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.updateParallax(e);
                        ticking = false;
                    });
                    ticking = true;
                }
            });
        }

        updateParallax(e) {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;

            if (this.nodes) {
                this.nodes.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
            }

            this.blobs.forEach((blob, index) => {
                const factor = (index + 1) * 0.3;
                blob.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
            });
        }
    }

    // Dataviz I18n
    class DatavizI18n {
        constructor() {
            this.translations = {
                fr: {
                    'dataviz.badge': 'Data Stories',
                    'dataviz.title1': 'Visualiser',
                    'dataviz.title2': 'les données',
                    'dataviz.desc': 'Transformer des données complexes en histoires visuelles captivantes. Découvrez mes créations partagées sur les réseaux sociaux.',
                    'dataviz.stat1': 'Visualisations',
                    'dataviz.stat2': 'Datasets',
                    'dataviz.stat3': 'Outils',
                    'dataviz.grid.title': 'Créations',
                    'dataviz.grid.subtitle': 'Explorez mes visualisations de données partagées sur LinkedIn et Instagram',
                    'dataviz1.title': 'Évolution du marché tech en France',
                    'dataviz1.desc': 'Analyse des tendances d\'emploi dans le secteur technologique français sur 5 ans.',
                    'dataviz2.title': 'Répartition des langages 2024',
                    'dataviz2.desc': 'Les langages de programmation les plus utilisés cette année.',
                    'dataviz3.title': 'Croissance des startups IA',
                    'dataviz3.desc': 'Évolution du nombre de startups IA en Europe depuis 2020.',
                    'dataviz4.title': 'Corrélation salaires / expérience',
                    'dataviz4.desc': 'Analyse de la relation entre années d\'expérience et rémunération dans la tech.',
                    'dataviz5.title': 'Compétences dev full-stack',
                    'dataviz5.desc': 'Radar des compétences attendues pour un développeur full-stack en 2024.',
                    'dataviz6.title': 'Activité GitHub annuelle',
                    'dataviz6.desc': 'Heatmap de mes contributions GitHub sur l\'année 2024.',
                    'dataviz.tools.title': 'Outils',
                    'dataviz.cta.title': 'Besoin d\'une visualisation de données ?',
                    'dataviz.cta.desc': 'Je peux transformer vos données en histoires visuelles impactantes.',
                    'dataviz.cta.button': 'Me contacter'
                },
                en: {
                    'dataviz.badge': 'Data Stories',
                    'dataviz.title1': 'Visualize',
                    'dataviz.title2': 'the data',
                    'dataviz.desc': 'Transform complex data into captivating visual stories. Discover my creations shared on social media.',
                    'dataviz.stat1': 'Visualizations',
                    'dataviz.stat2': 'Datasets',
                    'dataviz.stat3': 'Tools',
                    'dataviz.grid.title': 'Creations',
                    'dataviz.grid.subtitle': 'Explore my data visualizations shared on LinkedIn and Instagram',
                    'dataviz1.title': 'French Tech Market Evolution',
                    'dataviz1.desc': 'Analysis of employment trends in the French tech sector over 5 years.',
                    'dataviz2.title': 'Programming Languages 2024',
                    'dataviz2.desc': 'The most used programming languages this year.',
                    'dataviz3.title': 'AI Startups Growth',
                    'dataviz3.desc': 'Evolution of AI startups in Europe since 2020.',
                    'dataviz4.title': 'Salary / Experience Correlation',
                    'dataviz4.desc': 'Analysis of the relationship between years of experience and compensation in tech.',
                    'dataviz5.title': 'Full-stack Dev Skills',
                    'dataviz5.desc': 'Radar of expected skills for a full-stack developer in 2024.',
                    'dataviz6.title': 'Annual GitHub Activity',
                    'dataviz6.desc': 'Heatmap of my GitHub contributions for 2024.',
                    'dataviz.tools.title': 'Tools',
                    'dataviz.cta.title': 'Need a data visualization?',
                    'dataviz.cta.desc': 'I can transform your data into impactful visual stories.',
                    'dataviz.cta.button': 'Contact me'
                }
            };

            this.init();
        }

        init() {
            // Listen for language changes from main script
            document.addEventListener('langChange', (e) => {
                this.updateLanguage(e.detail.lang);
            });

            // Check current language on load
            const currentLang = document.documentElement.dataset.lang || 'fr';
            this.updateLanguage(currentLang);
        }

        updateLanguage(lang) {
            const translations = this.translations[lang] || this.translations.fr;

            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.dataset.i18n;
                if (translations[key]) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.placeholder = translations[key];
                    } else {
                        element.textContent = translations[key];
                    }
                }
            });
        }
    }

    // Initialize all components
    new CounterAnimation();
    new ChartAnimations();
    new DonutAnimation();
    new BackgroundParallax();
    new DatavizI18n();
});
