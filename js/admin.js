/**
 * Admin Page — Content Management System
 * Local-only access with full CRUD for articles and dataviz
 */

// ===================== DATA STORE =====================
const DataStore = {
    ARTICLES_KEY: 'portfolio_articles',
    DATAVIZ_KEY: 'portfolio_dataviz',
    SEEDED_KEY: 'portfolio_seeded',

    getArticles() {
        return JSON.parse(localStorage.getItem(this.ARTICLES_KEY) || '[]');
    },

    saveArticles(articles) {
        localStorage.setItem(this.ARTICLES_KEY, JSON.stringify(articles));
    },

    getDataviz() {
        return JSON.parse(localStorage.getItem(this.DATAVIZ_KEY) || '[]');
    },

    saveDataviz(dataviz) {
        localStorage.setItem(this.DATAVIZ_KEY, JSON.stringify(dataviz));
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Seed initial data from existing HTML if not already done
    seedInitialData() {
        if (localStorage.getItem(this.SEEDED_KEY)) return;

        // Initial articles from articles.html
        const initialArticles = [
            {
                id: 'art1',
                title: "Comment j'ai intégré ChatGPT dans mon workflow de développement",
                desc: "Découvrez comment l'IA générative peut transformer votre productivité quotidienne en tant que développeur, avec des exemples concrets et des bonnes pratiques.",
                category: 'ia',
                date: '2024-12-15',
                readTime: '8',
                link: 'https://medium.com',
                gradient1: '#667eea',
                gradient2: '#764ba2',
                titleEn: "How I integrated ChatGPT into my development workflow",
                descEn: "Discover how generative AI can transform your daily productivity as a developer, with concrete examples and best practices.",
                archived: false
            },
            {
                id: 'art2',
                title: "Architecture Angular : Patterns et bonnes pratiques en 2024",
                desc: "Un guide complet sur les patterns d'architecture modernes pour Angular, du lazy loading aux standalone components en passant par les signals.",
                category: 'dev',
                date: '2024-11-28',
                readTime: '12',
                link: 'https://medium.com',
                gradient1: '#f093fb',
                gradient2: '#f5576c',
                titleEn: "Angular Architecture: Patterns and best practices in 2024",
                descEn: "A complete guide on modern architecture patterns for Angular, from lazy loading to standalone components and signals.",
                archived: false
            },
            {
                id: 'art3',
                title: "Construire un chatbot RAG avec LangChain et Pinecone",
                desc: "Tutorial pas à pas pour créer un assistant IA capable de répondre à des questions en s'appuyant sur votre propre base documentaire.",
                category: 'ia',
                date: '2024-11-10',
                readTime: '15',
                link: 'https://medium.com',
                gradient1: '#4facfe',
                gradient2: '#00f2fe',
                titleEn: "Building a RAG chatbot with LangChain and Pinecone",
                descEn: "Step-by-step tutorial to create an AI assistant that can answer questions based on your own document base.",
                archived: false
            },
            {
                id: 'art4',
                title: "De développeur à tech lead : les compétences clés",
                desc: "Retour d'expérience sur la transition du rôle de développeur à celui de manager technique, et les soft skills indispensables.",
                category: 'career',
                date: '2024-10-25',
                readTime: '6',
                link: 'https://medium.com',
                gradient1: '#fa709a',
                gradient2: '#fee140',
                titleEn: "From developer to tech lead: key skills",
                descEn: "Feedback on transitioning from developer to technical manager role, and essential soft skills.",
                archived: false
            },
            {
                id: 'art5',
                title: "Ma stack d'outils de développement en 2024",
                desc: "VSCode, extensions, terminal, CLI, et autres outils qui me font gagner des heures chaque semaine.",
                category: 'tools',
                date: '2024-10-12',
                readTime: '10',
                link: 'https://medium.com',
                gradient1: '#a8edea',
                gradient2: '#fed6e3',
                titleEn: "My development tools stack in 2024",
                descEn: "VSCode, extensions, terminal, CLI, and other tools that save me hours every week.",
                archived: false
            },
            {
                id: 'art6',
                title: "Flutter vs React Native en 2024 : le verdict",
                desc: "Comparaison objective des deux frameworks de développement mobile cross-platform, avec benchmarks et cas d'usage.",
                category: 'dev',
                date: '2024-09-28',
                readTime: '9',
                link: 'https://medium.com',
                gradient1: '#ff9a9e',
                gradient2: '#fecfef',
                titleEn: "Flutter vs React Native in 2024: the verdict",
                descEn: "Objective comparison of both cross-platform mobile development frameworks, with benchmarks and use cases.",
                archived: false
            },
            {
                id: 'art7',
                title: "Prompt Engineering : l'art de parler aux LLMs",
                desc: "Techniques avancées pour obtenir les meilleurs résultats de ChatGPT, Claude, et autres modèles de langage.",
                category: 'ia',
                date: '2024-09-15',
                readTime: '11',
                link: 'https://medium.com',
                gradient1: '#a18cd1',
                gradient2: '#fbc2eb',
                titleEn: "Prompt Engineering: the art of talking to LLMs",
                descEn: "Advanced techniques to get the best results from ChatGPT, Claude, and other language models.",
                archived: false
            },
            {
                id: 'art8',
                title: "Travailler dans le secteur public comme développeur",
                desc: "Retour d'expérience sur le métier de développeur dans l'administration publique française : avantages, défis et opportunités.",
                category: 'career',
                date: '2024-09-01',
                readTime: '7',
                link: 'https://medium.com',
                gradient1: '#ffecd2',
                gradient2: '#fcb69f',
                titleEn: "Working in the public sector as a developer",
                descEn: "Feedback on working as a developer in French public administration: advantages, challenges and opportunities.",
                archived: false
            },
            {
                id: 'art9',
                title: "Docker pour les développeurs : guide de survie",
                desc: "Les commandes essentielles, les bonnes pratiques, et comment éviter les erreurs courantes avec Docker.",
                category: 'tools',
                date: '2024-08-20',
                readTime: '8',
                link: 'https://medium.com',
                gradient1: '#89f7fe',
                gradient2: '#66a6ff',
                titleEn: "Docker for developers: survival guide",
                descEn: "Essential commands, best practices, and how to avoid common mistakes with Docker.",
                archived: false
            }
        ];

        // Initial dataviz from dataviz.html
        const initialDataviz = [
            {
                id: 'dv1',
                title: "Évolution du marché tech en France",
                desc: "Analyse des tendances d'emploi dans le secteur technologique français sur 5 ans.",
                platform: 'linkedin',
                chartType: 'bars',
                link: 'https://linkedin.com',
                layout: 'featured',
                tags: 'Python, Matplotlib, Emploi',
                titleEn: "Evolution of the tech market in France",
                descEn: "Analysis of employment trends in the French tech sector over 5 years.",
                archived: false
            },
            {
                id: 'dv2',
                title: "Répartition des langages 2024",
                desc: "Les langages de programmation les plus utilisés cette année.",
                platform: 'instagram',
                chartType: 'pie',
                link: 'https://instagram.com',
                layout: 'normal',
                tags: 'D3.js, Survey',
                titleEn: "Programming languages distribution 2024",
                descEn: "The most used programming languages this year.",
                archived: false
            },
            {
                id: 'dv3',
                title: "Croissance des startups IA",
                desc: "Évolution du nombre de startups IA en Europe depuis 2020.",
                platform: 'linkedin',
                chartType: 'line',
                link: 'https://linkedin.com',
                layout: 'normal',
                tags: 'Plotly, Startups',
                titleEn: "AI startups growth",
                descEn: "Evolution of the number of AI startups in Europe since 2020.",
                archived: false
            },
            {
                id: 'dv4',
                title: "Corrélation salaires / expérience",
                desc: "Analyse de la relation entre années d'expérience et rémunération dans la tech.",
                platform: 'instagram',
                chartType: 'scatter',
                link: 'https://instagram.com',
                layout: 'wide',
                tags: 'R, ggplot2, Salaires',
                titleEn: "Salary / experience correlation",
                descEn: "Analysis of the relationship between years of experience and compensation in tech.",
                archived: false
            },
            {
                id: 'dv5',
                title: "Compétences dev full-stack",
                desc: "Radar des compétences attendues pour un développeur full-stack en 2024.",
                platform: 'linkedin',
                chartType: 'radar',
                link: 'https://linkedin.com',
                layout: 'normal',
                tags: 'Chart.js, Skills',
                titleEn: "Full-stack dev skills",
                descEn: "Radar of expected skills for a full-stack developer in 2024.",
                archived: false
            },
            {
                id: 'dv6',
                title: "Activité GitHub annuelle",
                desc: "Heatmap de mes contributions GitHub sur l'année 2024.",
                platform: 'instagram',
                chartType: 'heatmap',
                link: 'https://instagram.com',
                layout: 'normal',
                tags: 'GitHub API, Contributions',
                titleEn: "Annual GitHub activity",
                descEn: "Heatmap of my GitHub contributions for 2024.",
                archived: false
            }
        ];

        this.saveArticles(initialArticles);
        this.saveDataviz(initialDataviz);
        localStorage.setItem(this.SEEDED_KEY, 'true');
    }
};

// ===================== LOCALHOST PROTECTION =====================
class LocalhostGuard {
    constructor() {
        this.allowedHosts = ['localhost', '127.0.0.1', ''];
        this.accessDenied = document.getElementById('accessDenied');
        this.adminContent = document.getElementById('adminContent');
        this.checkAccess();
    }

    checkAccess() {
        const hostname = window.location.hostname;
        const isLocal = this.allowedHosts.includes(hostname) ||
                        hostname.startsWith('192.168.') ||
                        hostname.startsWith('10.') ||
                        window.location.protocol === 'file:';

        if (isLocal) {
            this.accessDenied.style.display = 'none';
            this.adminContent.style.display = 'flex';
        } else {
            this.accessDenied.style.display = 'flex';
            this.adminContent.style.display = 'none';
            throw new Error('Access denied: Admin page is localhost-only');
        }
    }
}

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
        this.dotX += (this.mouseX - this.dotX) * 0.35;
        this.dotY += (this.mouseY - this.dotY) * 0.35;
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

// ===================== MODAL MANAGER =====================
class ModalManager {
    constructor() {
        this.modals = document.querySelectorAll('.admin-modal');
        this.init();
    }

    init() {
        this.modals.forEach(modal => {
            const backdrop = modal.querySelector('.admin-modal__backdrop');
            const closeBtn = modal.querySelector('.admin-modal__close');
            const closeBtns = modal.querySelectorAll('[data-close-modal]');

            backdrop?.addEventListener('click', () => this.close(modal));
            closeBtn?.addEventListener('click', () => this.close(modal));
            closeBtns.forEach(btn => btn.addEventListener('click', () => this.close(modal)));
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.admin-modal.active');
                if (activeModal) this.close(activeModal);
            }
        });
    }

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    close(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

// ===================== SECTION TABS =====================
class SectionTabs {
    constructor() {
        this.tabs = document.querySelectorAll('.section-tab');
        this.sections = {
            articles: document.getElementById('articlesSection'),
            dataviz: document.getElementById('datavizSection')
        };
        this.init();
    }

    init() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const section = tab.dataset.section;
                this.switchSection(section);
            });
        });
    }

    switchSection(sectionId) {
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === sectionId);
        });
        Object.keys(this.sections).forEach(key => {
            if (this.sections[key]) {
                this.sections[key].style.display = key === sectionId ? 'block' : 'none';
            }
        });
    }
}

// ===================== ARTICLES MANAGER =====================
class ArticlesManager {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.list = document.getElementById('articlesList');
        this.countEl = document.getElementById('articlesCount');
        this.form = document.getElementById('articleForm');
        this.modal = document.getElementById('articleModal');
        this.modalTitle = document.getElementById('articleModalTitle');

        this.init();
    }

    init() {
        document.getElementById('addArticleBtn')?.addEventListener('click', () => this.openForm());
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });

        // Color sync
        this.setupColorSync('articleGradient1');
        this.setupColorSync('articleGradient2');

        this.render();
    }

    setupColorSync(id) {
        const colorInput = document.getElementById(id);
        const textInput = document.getElementById(id + 'Text');
        if (colorInput && textInput) {
            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value.toUpperCase();
            });
            textInput.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                    colorInput.value = textInput.value;
                }
            });
        }
    }

    render() {
        const articles = DataStore.getArticles();
        this.countEl.textContent = articles.length;

        if (articles.length === 0) {
            this.list.innerHTML = `
                <div class="content-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>Aucun article</p>
                    <button class="btn btn--ghost" onclick="document.getElementById('addArticleBtn').click()">Créer le premier article</button>
                </div>
            `;
            return;
        }

        this.list.innerHTML = articles.map(article => this.renderItem(article)).join('');
        this.attachItemEvents();
    }

    renderItem(article) {
        const categoryLabels = {
            ia: 'IA', dev: 'Dev', career: 'Carrière', tools: 'Outils'
        };
        return `
            <div class="content-item ${article.archived ? 'archived' : ''}" data-id="${article.id}">
                <div class="content-item__preview" style="background: linear-gradient(135deg, ${article.gradient1}, ${article.gradient2});">
                    ${article.readTime}min
                </div>
                <div class="content-item__info">
                    <div class="content-item__title">${article.title}</div>
                    <div class="content-item__meta">
                        <span class="content-item__badge">${categoryLabels[article.category] || article.category}</span>
                        <span>${article.date}</span>
                        ${article.archived ? '<span class="content-item__badge content-item__badge--archived">Archivé</span>' : ''}
                    </div>
                </div>
                <div class="content-item__actions">
                    <button class="edit" title="Modifier">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="delete" title="Supprimer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    attachItemEvents() {
        this.list.querySelectorAll('.content-item').forEach(item => {
            const id = item.dataset.id;
            item.querySelector('.edit')?.addEventListener('click', () => this.openForm(id));
            item.querySelector('.delete')?.addEventListener('click', () => this.confirmDelete(id));
        });
    }

    openForm(id = null) {
        const articles = DataStore.getArticles();
        const article = id ? articles.find(a => a.id === id) : null;

        this.modalTitle.textContent = article ? 'Modifier l\'article' : 'Nouvel article';

        document.getElementById('articleId').value = article?.id || '';
        document.getElementById('articleTitle').value = article?.title || '';
        document.getElementById('articleDesc').value = article?.desc || '';
        document.getElementById('articleCategory').value = article?.category || '';
        document.getElementById('articleDate').value = article?.date || new Date().toISOString().split('T')[0];
        document.getElementById('articleReadTime').value = article?.readTime || '';
        document.getElementById('articleLink').value = article?.link || '';
        document.getElementById('articleGradient1').value = article?.gradient1 || '#667eea';
        document.getElementById('articleGradient1Text').value = article?.gradient1 || '#667eea';
        document.getElementById('articleGradient2').value = article?.gradient2 || '#764ba2';
        document.getElementById('articleGradient2Text').value = article?.gradient2 || '#764ba2';
        document.getElementById('articleTitleEn').value = article?.titleEn || '';
        document.getElementById('articleDescEn').value = article?.descEn || '';
        document.getElementById('articleArchived').checked = article?.archived || false;

        this.modalManager.open('articleModal');
    }

    save() {
        const articles = DataStore.getArticles();
        const id = document.getElementById('articleId').value;

        const articleData = {
            id: id || DataStore.generateId(),
            title: document.getElementById('articleTitle').value,
            desc: document.getElementById('articleDesc').value,
            category: document.getElementById('articleCategory').value,
            date: document.getElementById('articleDate').value,
            readTime: document.getElementById('articleReadTime').value,
            link: document.getElementById('articleLink').value,
            gradient1: document.getElementById('articleGradient1').value,
            gradient2: document.getElementById('articleGradient2').value,
            titleEn: document.getElementById('articleTitleEn').value,
            descEn: document.getElementById('articleDescEn').value,
            archived: document.getElementById('articleArchived').checked
        };

        if (id) {
            const index = articles.findIndex(a => a.id === id);
            if (index !== -1) articles[index] = articleData;
        } else {
            articles.unshift(articleData);
        }

        DataStore.saveArticles(articles);
        this.modalManager.close('articleModal');
        this.render();
        Toast.show(id ? 'Article modifié' : 'Article créé', 'success');
    }

    confirmDelete(id) {
        const article = DataStore.getArticles().find(a => a.id === id);
        document.getElementById('confirmMessage').textContent =
            `Êtes-vous sûr de vouloir supprimer "${article?.title}" ?`;

        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

        newBtn.addEventListener('click', () => {
            this.delete(id);
            modalManager.close('confirmModal');
        });

        modalManager.open('confirmModal');
    }

    delete(id) {
        const articles = DataStore.getArticles().filter(a => a.id !== id);
        DataStore.saveArticles(articles);
        this.render();
        Toast.show('Article supprimé', 'success');
    }
}

// ===================== DATAVIZ MANAGER =====================
class DatavizManager {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.list = document.getElementById('datavizList');
        this.countEl = document.getElementById('datavizCount');
        this.form = document.getElementById('datavizForm');
        this.modal = document.getElementById('datavizModal');
        this.modalTitle = document.getElementById('datavizModalTitle');

        this.init();
    }

    init() {
        document.getElementById('addDatavizBtn')?.addEventListener('click', () => this.openForm());
        this.form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.save();
        });
        this.render();
    }

    render() {
        const dataviz = DataStore.getDataviz();
        this.countEl.textContent = dataviz.length;

        if (dataviz.length === 0) {
            this.list.innerHTML = `
                <div class="content-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 20V10M12 20V4M6 20v-6"/>
                    </svg>
                    <p>Aucune dataviz</p>
                    <button class="btn btn--ghost" onclick="document.getElementById('addDatavizBtn').click()">Créer la première dataviz</button>
                </div>
            `;
            return;
        }

        this.list.innerHTML = dataviz.map(item => this.renderItem(item)).join('');
        this.attachItemEvents();
    }

    renderItem(item) {
        const chartLabels = {
            bars: 'Bar', pie: 'Pie', line: 'Line', scatter: 'Scatter', radar: 'Radar', heatmap: 'Heatmap'
        };
        return `
            <div class="content-item ${item.archived ? 'archived' : ''}" data-id="${item.id}">
                <div class="content-item__preview" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                    ${chartLabels[item.chartType] || item.chartType}
                </div>
                <div class="content-item__info">
                    <div class="content-item__title">${item.title}</div>
                    <div class="content-item__meta">
                        <span class="content-item__badge">${item.platform}</span>
                        <span>${item.tags?.split(',')[0] || ''}</span>
                        ${item.archived ? '<span class="content-item__badge content-item__badge--archived">Archivé</span>' : ''}
                    </div>
                </div>
                <div class="content-item__actions">
                    <button class="edit" title="Modifier">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="delete" title="Supprimer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    attachItemEvents() {
        this.list.querySelectorAll('.content-item').forEach(item => {
            const id = item.dataset.id;
            item.querySelector('.edit')?.addEventListener('click', () => this.openForm(id));
            item.querySelector('.delete')?.addEventListener('click', () => this.confirmDelete(id));
        });
    }

    openForm(id = null) {
        const dataviz = DataStore.getDataviz();
        const item = id ? dataviz.find(d => d.id === id) : null;

        this.modalTitle.textContent = item ? 'Modifier la dataviz' : 'Nouvelle dataviz';

        document.getElementById('datavizId').value = item?.id || '';
        document.getElementById('datavizTitle').value = item?.title || '';
        document.getElementById('datavizDesc').value = item?.desc || '';
        document.getElementById('datavizPlatform').value = item?.platform || '';
        document.getElementById('datavizChartType').value = item?.chartType || '';
        document.getElementById('datavizLink').value = item?.link || '';
        document.getElementById('datavizLayout').value = item?.layout || 'normal';
        document.getElementById('datavizTags').value = item?.tags || '';
        document.getElementById('datavizTitleEn').value = item?.titleEn || '';
        document.getElementById('datavizDescEn').value = item?.descEn || '';
        document.getElementById('datavizArchived').checked = item?.archived || false;

        this.modalManager.open('datavizModal');
    }

    save() {
        const dataviz = DataStore.getDataviz();
        const id = document.getElementById('datavizId').value;

        const itemData = {
            id: id || DataStore.generateId(),
            title: document.getElementById('datavizTitle').value,
            desc: document.getElementById('datavizDesc').value,
            platform: document.getElementById('datavizPlatform').value,
            chartType: document.getElementById('datavizChartType').value,
            link: document.getElementById('datavizLink').value,
            layout: document.getElementById('datavizLayout').value,
            tags: document.getElementById('datavizTags').value,
            titleEn: document.getElementById('datavizTitleEn').value,
            descEn: document.getElementById('datavizDescEn').value,
            archived: document.getElementById('datavizArchived').checked
        };

        if (id) {
            const index = dataviz.findIndex(d => d.id === id);
            if (index !== -1) dataviz[index] = itemData;
        } else {
            dataviz.unshift(itemData);
        }

        DataStore.saveDataviz(dataviz);
        this.modalManager.close('datavizModal');
        this.render();
        Toast.show(id ? 'Dataviz modifiée' : 'Dataviz créée', 'success');
    }

    confirmDelete(id) {
        const item = DataStore.getDataviz().find(d => d.id === id);
        document.getElementById('confirmMessage').textContent =
            `Êtes-vous sûr de vouloir supprimer "${item?.title}" ?`;

        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

        newBtn.addEventListener('click', () => {
            this.delete(id);
            modalManager.close('confirmModal');
        });

        modalManager.open('confirmModal');
    }

    delete(id) {
        const dataviz = DataStore.getDataviz().filter(d => d.id !== id);
        DataStore.saveDataviz(dataviz);
        this.render();
        Toast.show('Dataviz supprimée', 'success');
    }
}

// ===================== CODE GENERATOR =====================
const CodeGenerator = {
    generateArticlesHTML() {
        const articles = DataStore.getArticles().filter(a => !a.archived);

        const categoryLabels = {
            ia: { key: 'articles.cat.ia', fr: 'Intelligence Artificielle' },
            dev: { key: 'articles.cat.dev', fr: 'Développement' },
            career: { key: 'articles.cat.career', fr: 'Carrière' },
            tools: { key: 'articles.cat.tools', fr: 'Outils & Productivité' }
        };

        return articles.map((article, index) => {
            const cat = categoryLabels[article.category] || categoryLabels.dev;
            const date = new Date(article.date);
            const formattedDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

            return `<!-- Article ${index + 1} -->
<article class="article-card" data-category="${article.category}">
    <a href="${article.link}" target="_blank" rel="noopener" class="article-card__link">
        <div class="article-card__img">
            <div class="article-card__img-bg" style="--gradient: linear-gradient(135deg, ${article.gradient1} 0%, ${article.gradient2} 100%);"></div>
            <span class="article-card__read-time">${article.readTime} min</span>
        </div>
        <div class="article-card__content">
            <div class="article-card__meta">
                <span class="article-card__category" data-i18n="${cat.key}">${cat.fr}</span>
                <span class="article-card__date">${formattedDate}</span>
            </div>
            <h3 class="article-card__title">${article.title}</h3>
            <p class="article-card__desc">${article.desc}</p>
            <span class="article-card__cta">
                Lire l'article
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </span>
        </div>
    </a>
</article>`;
        }).join('\n\n');
    },

    generateDatavizHTML() {
        const dataviz = DataStore.getDataviz().filter(d => !d.archived);

        const platformIcons = {
            linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
            instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
        };

        const chartTemplates = {
            bars: `<div class="dataviz-card__chart dataviz-card__chart--bars">
                            <span style="--height: 60%"></span>
                            <span style="--height: 80%"></span>
                            <span style="--height: 45%"></span>
                            <span style="--height: 90%"></span>
                            <span style="--height: 70%"></span>
                            <span style="--height: 55%"></span>
                            <span style="--height: 85%"></span>
                        </div>`,
            pie: `<div class="dataviz-card__chart dataviz-card__chart--pie">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--dataviz-1)" stroke-width="20" stroke-dasharray="75 251" transform="rotate(-90 50 50)"/>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--dataviz-2)" stroke-width="20" stroke-dasharray="50 251" stroke-dashoffset="-75" transform="rotate(-90 50 50)"/>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--dataviz-3)" stroke-width="20" stroke-dasharray="60 251" stroke-dashoffset="-125" transform="rotate(-90 50 50)"/>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--dataviz-4)" stroke-width="20" stroke-dasharray="66 251" stroke-dashoffset="-185" transform="rotate(-90 50 50)"/>
                            </svg>
                        </div>`,
            line: `<div class="dataviz-card__chart dataviz-card__chart--line">
                            <svg viewBox="0 0 100 50" preserveAspectRatio="none">
                                <polyline points="0,40 15,35 30,25 45,30 60,15 75,20 90,10 100,5" fill="none" stroke="var(--dataviz-1)" stroke-width="2" class="dataviz-line"/>
                                <polyline points="0,45 15,40 30,38 45,42 60,35 75,38 90,30 100,25" fill="none" stroke="var(--dataviz-2)" stroke-width="2" class="dataviz-line" style="--delay: 0.2s"/>
                            </svg>
                        </div>`,
            scatter: `<div class="dataviz-card__chart dataviz-card__chart--scatter">
                            <span style="--x: 10%; --y: 30%; --size: 12px"></span>
                            <span style="--x: 25%; --y: 60%; --size: 18px"></span>
                            <span style="--x: 40%; --y: 25%; --size: 10px"></span>
                            <span style="--x: 55%; --y: 70%; --size: 22px"></span>
                            <span style="--x: 70%; --y: 40%; --size: 14px"></span>
                            <span style="--x: 85%; --y: 55%; --size: 16px"></span>
                        </div>`,
            radar: `<div class="dataviz-card__chart dataviz-card__chart--radar">
                            <svg viewBox="0 0 100 100">
                                <polygon points="50,10 90,35 75,85 25,85 10,35" fill="none" stroke="var(--dataviz-bg)" stroke-width="1"/>
                                <polygon points="50,25 75,40 65,75 35,75 25,40" fill="none" stroke="var(--dataviz-bg)" stroke-width="1"/>
                                <polygon points="50,20 80,38 70,80 30,80 20,38" fill="var(--dataviz-1)" fill-opacity="0.3" stroke="var(--dataviz-1)" stroke-width="2" class="dataviz-radar"/>
                            </svg>
                        </div>`,
            heatmap: `<div class="dataviz-card__chart dataviz-card__chart--heatmap">
                            <div class="heatmap-grid">
                                <span style="--opacity: 0.2"></span><span style="--opacity: 0.5"></span><span style="--opacity: 0.8"></span><span style="--opacity: 0.3"></span>
                                <span style="--opacity: 0.9"></span><span style="--opacity: 0.4"></span><span style="--opacity: 0.7"></span><span style="--opacity: 0.6"></span>
                                <span style="--opacity: 0.1"></span><span style="--opacity: 0.6"></span><span style="--opacity: 0.3"></span><span style="--opacity: 0.9"></span>
                                <span style="--opacity: 0.5"></span><span style="--opacity: 0.2"></span><span style="--opacity: 0.8"></span><span style="--opacity: 0.4"></span>
                            </div>
                        </div>`
        };

        return dataviz.map((item, index) => {
            const layoutClass = item.layout === 'featured' ? ' dataviz-card--featured' :
                               item.layout === 'wide' ? ' dataviz-card--wide' : '';
            const tagsHtml = item.tags.split(',').map(t => `<span>${t.trim()}</span>`).join('\n                            ');

            return `<!-- Dataviz ${index + 1} -->
<a href="${item.link}" target="_blank" rel="noopener" class="dataviz-card${layoutClass}">
    <div class="dataviz-card__visual">
        ${chartTemplates[item.chartType] || chartTemplates.bars}
    </div>
    <div class="dataviz-card__content">
        <span class="dataviz-card__platform">
            ${platformIcons[item.platform] || platformIcons.linkedin}
            ${item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
        </span>
        <h3 class="dataviz-card__title">${item.title}</h3>
        <p class="dataviz-card__desc">${item.desc}</p>
        <div class="dataviz-card__tags">
            ${tagsHtml}
        </div>
    </div>
    <div class="dataviz-card__arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M17 7H7M17 7V17"/>
        </svg>
    </div>
</a>`;
        }).join('\n\n');
    }
};

// ===================== PUBLISH MANAGER =====================
class PublishManager {
    constructor(modalManager) {
        this.modalManager = modalManager;
        this.currentCode = 'articles';
        this.init();
    }

    init() {
        document.getElementById('publishAllBtn')?.addEventListener('click', () => {
            this.modalManager.open('publishModal');
        });

        document.getElementById('downloadFilesBtn')?.addEventListener('click', () => {
            this.downloadFiles();
        });

        document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
            this.modalManager.close('publishModal');
            this.showCode();
        });

        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentCode = tab.dataset.code;
                this.updateCodePreview();
            });
        });

        document.getElementById('copyCurrentCodeBtn')?.addEventListener('click', () => {
            this.copyCurrentCode();
        });
    }

    showCode() {
        this.updateCodePreview();
        this.modalManager.open('codeModal');
    }

    updateCodePreview() {
        const codePreview = document.getElementById('codePreview');
        if (this.currentCode === 'articles') {
            codePreview.textContent = CodeGenerator.generateArticlesHTML() || '<!-- Aucun article à afficher -->';
        } else {
            codePreview.textContent = CodeGenerator.generateDatavizHTML() || '<!-- Aucune dataviz à afficher -->';
        }
    }

    async copyCurrentCode() {
        const code = document.getElementById('codePreview').textContent;
        try {
            await navigator.clipboard.writeText(code);
            Toast.show('Code copié !', 'success');
        } catch (err) {
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Toast.show('Code copié !', 'success');
        }
    }

    downloadFiles() {
        const articlesCode = CodeGenerator.generateArticlesHTML();
        const datavizCode = CodeGenerator.generateDatavizHTML();

        // Download articles snippet
        this.downloadFile('articles-content.html', articlesCode);

        // Download dataviz snippet
        setTimeout(() => {
            this.downloadFile('dataviz-content.html', datavizCode);
        }, 500);

        Toast.show('Fichiers téléchargés', 'success');
        this.modalManager.close('publishModal');
    }

    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// ===================== TOAST =====================
const Toast = {
    show(message, type = 'success') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// ===================== INIT =====================
let modalManager;

document.addEventListener('DOMContentLoaded', () => {
    // Check localhost access first
    new LocalhostGuard();

    // Seed initial data from existing HTML if first visit
    DataStore.seedInitialData();

    // Initialize components
    new Cursor();
    new ThemeToggle();
    modalManager = new ModalManager();
    new SectionTabs();
    new ArticlesManager(modalManager);
    new DatavizManager(modalManager);
    new PublishManager(modalManager);
});
