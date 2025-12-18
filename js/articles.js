/**
 * Articles Page - Search & Filter Functionality
 */

// ===================== ARTICLES TRANSLATIONS =====================
const articlesTranslations = {
    fr: {
        // Articles page
        'nav.articles': 'Articles',
        'articles.label': 'Blog & Réflexions',
        'articles.title': 'Articles Medium',
        'articles.desc': 'Je partage ici mes réflexions sur le développement, l\'intelligence artificielle, et les bonnes pratiques tech.',
        'articles.search': 'Rechercher un article...',
        'articles.cat.all': 'Tous',
        'articles.cat.dev': 'Développement',
        'articles.cat.ia': 'Intelligence Artificielle',
        'articles.cat.career': 'Carrière',
        'articles.cat.tools': 'Outils & Productivité',
        'articles.readmore': 'Lire l\'article',
        'articles.noresults': 'Aucun article trouvé pour cette recherche.',
        'articles.cta.title': 'Retrouvez tous mes articles sur Medium',
        'articles.cta.desc': 'Suivez-moi pour ne manquer aucun nouveau contenu sur le développement et l\'IA.',
        'articles.cta.button': 'Suivre sur Medium',

        // Articles content
        'article1.title': 'Comment j\'ai intégré ChatGPT dans mon workflow de développement',
        'article1.excerpt': 'Découvrez comment l\'IA générative peut transformer votre productivité quotidienne en tant que développeur, avec des exemples concrets et des bonnes pratiques.',
        'article2.title': 'Architecture Angular : Patterns et bonnes pratiques en 2024',
        'article2.excerpt': 'Un guide complet sur les patterns d\'architecture modernes pour Angular, du lazy loading aux standalone components en passant par les signals.',
        'article3.title': 'Construire un chatbot RAG avec LangChain et Pinecone',
        'article3.excerpt': 'Tutorial pas à pas pour créer un assistant IA capable de répondre à des questions en s\'appuyant sur votre propre base documentaire.',
        'article4.title': 'De développeur à tech lead : les compétences clés',
        'article4.excerpt': 'Retour d\'expérience sur la transition du rôle de développeur à celui de manager technique, et les soft skills indispensables.',
        'article5.title': 'Ma stack d\'outils de développement en 2024',
        'article5.excerpt': 'VSCode, extensions, terminal, CLI, et autres outils qui me font gagner des heures chaque semaine.',
        'article6.title': 'Flutter vs React Native en 2024 : le verdict',
        'article6.excerpt': 'Comparaison objective des deux frameworks de développement mobile cross-platform, avec benchmarks et cas d\'usage.',
        'article7.title': 'Prompt Engineering : l\'art de parler aux LLMs',
        'article7.excerpt': 'Techniques avancées pour obtenir les meilleurs résultats de ChatGPT, Claude, et autres modèles de langage.',
        'article8.title': 'Travailler dans le secteur public comme développeur',
        'article8.excerpt': 'Retour d\'expérience sur le métier de développeur dans l\'administration publique française : avantages, défis et opportunités.',
        'article9.title': 'Docker pour les développeurs : guide de survie',
        'article9.excerpt': 'Les commandes essentielles, les bonnes pratiques, et comment éviter les erreurs courantes avec Docker.'
    },
    en: {
        // Articles page
        'nav.articles': 'Articles',
        'articles.label': 'Blog & Thoughts',
        'articles.title': 'Medium Articles',
        'articles.desc': 'I share here my thoughts on development, artificial intelligence, and tech best practices.',
        'articles.search': 'Search articles...',
        'articles.cat.all': 'All',
        'articles.cat.dev': 'Development',
        'articles.cat.ia': 'Artificial Intelligence',
        'articles.cat.career': 'Career',
        'articles.cat.tools': 'Tools & Productivity',
        'articles.readmore': 'Read article',
        'articles.noresults': 'No articles found for this search.',
        'articles.cta.title': 'Find all my articles on Medium',
        'articles.cta.desc': 'Follow me to never miss new content about development and AI.',
        'articles.cta.button': 'Follow on Medium',

        // Articles content
        'article1.title': 'How I integrated ChatGPT into my development workflow',
        'article1.excerpt': 'Discover how generative AI can transform your daily productivity as a developer, with concrete examples and best practices.',
        'article2.title': 'Angular Architecture: Patterns and best practices in 2024',
        'article2.excerpt': 'A complete guide on modern architecture patterns for Angular, from lazy loading to standalone components and signals.',
        'article3.title': 'Building a RAG chatbot with LangChain and Pinecone',
        'article3.excerpt': 'Step-by-step tutorial to create an AI assistant that can answer questions based on your own document base.',
        'article4.title': 'From developer to tech lead: key skills',
        'article4.excerpt': 'Feedback on the transition from developer to technical manager role, and the essential soft skills.',
        'article5.title': 'My development tool stack in 2024',
        'article5.excerpt': 'VSCode, extensions, terminal, CLI, and other tools that save me hours every week.',
        'article6.title': 'Flutter vs React Native in 2024: the verdict',
        'article6.excerpt': 'Objective comparison of the two cross-platform mobile development frameworks, with benchmarks and use cases.',
        'article7.title': 'Prompt Engineering: the art of talking to LLMs',
        'article7.excerpt': 'Advanced techniques to get the best results from ChatGPT, Claude, and other language models.',
        'article8.title': 'Working in the public sector as a developer',
        'article8.excerpt': 'Feedback on working as a developer in the French public administration: advantages, challenges and opportunities.',
        'article9.title': 'Docker for developers: survival guide',
        'article9.excerpt': 'Essential commands, best practices, and how to avoid common Docker mistakes.'
    }
};

// Merge with main translations if they exist
if (typeof translations !== 'undefined') {
    Object.keys(articlesTranslations.fr).forEach(key => {
        translations.fr[key] = articlesTranslations.fr[key];
    });
    Object.keys(articlesTranslations.en).forEach(key => {
        translations.en[key] = articlesTranslations.en[key];
    });
}

// ===================== ARTICLES FILTER =====================
class ArticlesFilter {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.categoryBtns = document.querySelectorAll('.category-btn');
        this.articles = document.querySelectorAll('.article-card');
        this.noResults = document.getElementById('noResults');
        this.currentCategory = 'all';
        this.searchTerm = '';

        if (!this.searchInput || !this.articles.length) return;

        this.init();
    }

    init() {
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase().trim();
            this.filterArticles();
        });

        // Category buttons
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.filterArticles();
            });
        });

        // Update placeholder on language change
        this.updatePlaceholder();
    }

    filterArticles() {
        let visibleCount = 0;

        this.articles.forEach(article => {
            const category = article.dataset.category;
            const title = article.querySelector('.article-card__title')?.textContent.toLowerCase() || '';
            const excerpt = article.querySelector('.article-card__excerpt')?.textContent.toLowerCase() || '';
            const categoryText = article.querySelector('.article-card__category')?.textContent.toLowerCase() || '';

            const matchesCategory = this.currentCategory === 'all' || category === this.currentCategory;
            const matchesSearch = !this.searchTerm ||
                title.includes(this.searchTerm) ||
                excerpt.includes(this.searchTerm) ||
                categoryText.includes(this.searchTerm);

            if (matchesCategory && matchesSearch) {
                article.classList.remove('hidden');
                article.style.animation = 'fadeInUp 0.4s ease forwards';
                visibleCount++;
            } else {
                article.classList.add('hidden');
            }
        });

        // Show/hide no results message
        if (this.noResults) {
            this.noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    updatePlaceholder() {
        const lang = document.documentElement.dataset.lang || 'fr';
        const placeholderKey = 'articles.search';
        const placeholder = articlesTranslations[lang]?.[placeholderKey];
        if (placeholder && this.searchInput) {
            this.searchInput.placeholder = placeholder;
        }
    }
}

// ===================== ARTICLES PAGE I18N =====================
class ArticlesI18n {
    constructor() {
        this.init();
    }

    init() {
        // Listen for language changes
        const langToggle = document.querySelector('[data-lang-toggle]');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                setTimeout(() => this.updateArticlesPage(), 50);
            });
        }

        // Initial update
        this.updateArticlesPage();
    }

    updateArticlesPage() {
        const lang = document.documentElement.dataset.lang || 'fr';
        const t = articlesTranslations[lang];

        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Update search placeholder
        const searchInput = document.getElementById('searchInput');
        if (searchInput && t['articles.search']) {
            searchInput.placeholder = t['articles.search'];
        }

        // Update nav links
        document.querySelectorAll('.nav__link').forEach(link => {
            const key = link.dataset.i18n;
            const textEl = link.querySelector('.nav__text');
            if (key && t[key] && textEl) {
                textEl.textContent = t[key];
            }
        });
    }
}

// ===================== ARTICLE CARDS ANIMATION =====================
class ArticleCardsAnimation {
    constructor() {
        this.cards = document.querySelectorAll('.article-card');
        if (!this.cards.length) return;
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
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

        this.cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(card);
        });
    }
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    new ArticlesFilter();
    new ArticlesI18n();
    new ArticleCardsAnimation();
});

// Add fadeInUp animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
