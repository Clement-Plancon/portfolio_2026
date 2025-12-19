/**
 * Admin Page — Publication Generator
 * Local-only access with code generation for articles and dataviz
 */

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
            // Block all further JS execution for security
            throw new Error('Access denied: Admin page is localhost-only');
        }
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

// ===================== TABS =====================
class TabManager {
    constructor() {
        this.tabs = document.querySelectorAll('.admin-tab');
        this.panels = {
            article: document.getElementById('articlePanel'),
            dataviz: document.getElementById('datavizPanel')
        };

        this.init();
    }

    init() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Update tabs
        this.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update panels
        Object.keys(this.panels).forEach(key => {
            this.panels[key].style.display = key === tabId ? 'block' : 'none';
        });

        // Hide output when switching
        document.getElementById('outputSection').style.display = 'none';
    }
}

// ===================== COLOR SYNC =====================
class ColorSync {
    constructor() {
        this.init();
    }

    init() {
        // Sync color picker with text input
        document.querySelectorAll('.color-input').forEach(group => {
            const colorInput = group.querySelector('input[type="color"]');
            const textInput = group.querySelector('input[type="text"]');

            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value.toUpperCase();
            });

            textInput.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                    colorInput.value = textInput.value;
                }
            });
        });
    }
}

// ===================== ARTICLE GENERATOR =====================
class ArticleGenerator {
    constructor() {
        this.form = document.getElementById('articleForm');
        this.counter = this.getNextArticleNumber();

        if (!this.form) return;

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generate();
        });

        // Set default date to today
        document.getElementById('articleDate').valueAsDate = new Date();
    }

    getNextArticleNumber() {
        // In a real scenario, this would check existing articles
        return parseInt(localStorage.getItem('articleCounter') || '10', 10);
    }

    getCategoryInfo(category) {
        const categories = {
            ia: { key: 'articles.cat.ia', fr: 'Intelligence Artificielle', en: 'Artificial Intelligence' },
            dev: { key: 'articles.cat.dev', fr: 'Développement', en: 'Development' },
            career: { key: 'articles.cat.career', fr: 'Carrière', en: 'Career' },
            tools: { key: 'articles.cat.tools', fr: 'Outils & Productivité', en: 'Tools & Productivity' }
        };
        return categories[category] || categories.dev;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    generate() {
        const data = {
            title: document.getElementById('articleTitle').value,
            desc: document.getElementById('articleDesc').value,
            category: document.getElementById('articleCategory').value,
            date: document.getElementById('articleDate').value,
            readTime: document.getElementById('articleReadTime').value,
            link: document.getElementById('articleLink').value,
            gradient1: document.getElementById('articleGradient1').value,
            gradient2: document.getElementById('articleGradient2').value,
            titleEn: document.getElementById('articleTitleEn').value,
            descEn: document.getElementById('articleDescEn').value
        };

        const catInfo = this.getCategoryInfo(data.category);
        const articleId = `article${this.counter}`;

        const html = `<!-- Article ${this.counter} -->
<article class="article-card" data-category="${data.category}">
    <a href="${data.link}" target="_blank" rel="noopener" class="article-card__link">
        <div class="article-card__img">
            <div class="article-card__img-bg" style="--gradient: linear-gradient(135deg, ${data.gradient1} 0%, ${data.gradient2} 100%);"></div>
            <span class="article-card__read-time">${data.readTime} min</span>
        </div>
        <div class="article-card__content">
            <div class="article-card__meta">
                <span class="article-card__category" data-i18n="${catInfo.key}">${catInfo.fr}</span>
                <span class="article-card__date">${this.formatDate(data.date)}</span>
            </div>
            <h3 class="article-card__title" data-i18n="${articleId}.title">${data.title}</h3>
            <p class="article-card__desc" data-i18n="${articleId}.desc">${data.desc}</p>
            <span class="article-card__cta">
                Lire l'article
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </span>
        </div>
    </a>
</article>`;

        // Generate translations
        let translations = '';
        if (data.titleEn || data.descEn) {
            translations = `// FR
'${articleId}.title': '${this.escapeQuotes(data.title)}',
'${articleId}.desc': '${this.escapeQuotes(data.desc)}',

// EN
'${articleId}.title': '${this.escapeQuotes(data.titleEn || data.title)}',
'${articleId}.desc': '${this.escapeQuotes(data.descEn || data.desc)}',`;
        }

        this.showOutput(html, translations, data, 'article');
        this.counter++;
        localStorage.setItem('articleCounter', this.counter.toString());
    }

    escapeQuotes(str) {
        return str.replace(/'/g, "\\'");
    }

    showOutput(html, translations, data, type) {
        const outputSection = document.getElementById('outputSection');
        const outputCode = document.getElementById('outputCode');
        const translationsSection = document.getElementById('translationsSection');
        const translationsCode = document.getElementById('translationsCode');
        const previewContainer = document.getElementById('previewContainer');

        outputCode.textContent = html;
        outputSection.style.display = 'block';

        if (translations) {
            translationsCode.textContent = translations;
            translationsSection.style.display = 'block';
        } else {
            translationsSection.style.display = 'none';
        }

        // Generate preview
        previewContainer.innerHTML = this.generatePreview(data, type);

        // Scroll to output
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Save draft
        this.saveDraft(data, type);
    }

    generatePreview(data, type) {
        const catInfo = this.getCategoryInfo(data.category);
        return `
            <div class="article-card" style="max-width: 350px;">
                <div class="article-card__img" style="height: 160px; background: linear-gradient(135deg, ${data.gradient1} 0%, ${data.gradient2} 100%); border-radius: 8px; position: relative;">
                    <span style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px;">${data.readTime} min</span>
                </div>
                <div style="padding: 16px 0;">
                    <div style="display: flex; gap: 12px; margin-bottom: 8px; font-size: 12px; color: var(--text-light);">
                        <span style="color: var(--accent); font-weight: 600;">${catInfo.fr}</span>
                        <span>${this.formatDate(data.date)}</span>
                    </div>
                    <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; line-height: 1.3;">${data.title}</h3>
                    <p style="font-size: 14px; color: var(--text-light); line-height: 1.5;">${data.desc}</p>
                </div>
            </div>
        `;
    }

    saveDraft(data, type) {
        const drafts = JSON.parse(localStorage.getItem('adminDrafts') || '[]');
        drafts.unshift({
            type,
            title: data.title,
            data,
            date: new Date().toISOString()
        });
        // Keep only last 10 drafts
        localStorage.setItem('adminDrafts', JSON.stringify(drafts.slice(0, 10)));
        DraftManager.refresh();
    }
}

// ===================== DATAVIZ GENERATOR =====================
class DatavizGenerator {
    constructor() {
        this.form = document.getElementById('datavizForm');
        this.counter = this.getNextDatavizNumber();

        if (!this.form) return;

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.generate();
        });
    }

    getNextDatavizNumber() {
        return parseInt(localStorage.getItem('datavizCounter') || '7', 10);
    }

    getPlatformIcon(platform) {
        const icons = {
            linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
            instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
        };
        return icons[platform] || icons.linkedin;
    }

    getChartHTML(chartType) {
        const charts = {
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
                                <polyline points="0,40 15,35 30,25 45,30 60,15 75,20 90,10 100,5"
                                    fill="none" stroke="var(--dataviz-1)" stroke-width="2" class="dataviz-line"/>
                                <polyline points="0,45 15,40 30,38 45,42 60,35 75,38 90,30 100,25"
                                    fill="none" stroke="var(--dataviz-2)" stroke-width="2" class="dataviz-line" style="--delay: 0.2s"/>
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
                                <span style="--opacity: 0.2"></span>
                                <span style="--opacity: 0.5"></span>
                                <span style="--opacity: 0.8"></span>
                                <span style="--opacity: 0.3"></span>
                                <span style="--opacity: 0.9"></span>
                                <span style="--opacity: 0.4"></span>
                                <span style="--opacity: 0.7"></span>
                                <span style="--opacity: 0.6"></span>
                                <span style="--opacity: 0.1"></span>
                                <span style="--opacity: 0.6"></span>
                                <span style="--opacity: 0.3"></span>
                                <span style="--opacity: 0.9"></span>
                                <span style="--opacity: 0.5"></span>
                                <span style="--opacity: 0.2"></span>
                                <span style="--opacity: 0.8"></span>
                                <span style="--opacity: 0.4"></span>
                            </div>
                        </div>`
        };
        return charts[chartType] || charts.bars;
    }

    getLayoutClass(layout) {
        const classes = {
            featured: ' dataviz-card--featured',
            wide: ' dataviz-card--wide',
            normal: ''
        };
        return classes[layout] || '';
    }

    generate() {
        const data = {
            title: document.getElementById('datavizTitle').value,
            desc: document.getElementById('datavizDesc').value,
            platform: document.getElementById('datavizPlatform').value,
            chartType: document.getElementById('datavizChartType').value,
            link: document.getElementById('datavizLink').value,
            layout: document.getElementById('datavizLayout').value,
            tags: document.getElementById('datavizTags').value,
            titleEn: document.getElementById('datavizTitleEn').value,
            descEn: document.getElementById('datavizDescEn').value
        };

        const datavizId = `dataviz${this.counter}`;
        const tagsArray = data.tags.split(',').map(t => t.trim());
        const tagsHtml = tagsArray.map(tag => `<span>${tag}</span>`).join('\n                            ');

        const html = `<!-- Dataviz ${this.counter} -->
<a href="${data.link}" target="_blank" rel="noopener" class="dataviz-card${this.getLayoutClass(data.layout)}">
    <div class="dataviz-card__visual">
        ${this.getChartHTML(data.chartType)}
    </div>
    <div class="dataviz-card__content">
        <span class="dataviz-card__platform">
            ${this.getPlatformIcon(data.platform)}
            ${data.platform.charAt(0).toUpperCase() + data.platform.slice(1)}
        </span>
        <h3 class="dataviz-card__title" data-i18n="${datavizId}.title">${data.title}</h3>
        <p class="dataviz-card__desc" data-i18n="${datavizId}.desc">${data.desc}</p>
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

        // Generate translations
        let translations = '';
        if (data.titleEn || data.descEn) {
            translations = `// Add to js/dataviz.js translations

// FR
'${datavizId}.title': '${this.escapeQuotes(data.title)}',
'${datavizId}.desc': '${this.escapeQuotes(data.desc)}',

// EN
'${datavizId}.title': '${this.escapeQuotes(data.titleEn || data.title)}',
'${datavizId}.desc': '${this.escapeQuotes(data.descEn || data.desc)}',`;
        }

        this.showOutput(html, translations, data, 'dataviz');
        this.counter++;
        localStorage.setItem('datavizCounter', this.counter.toString());
    }

    escapeQuotes(str) {
        return str.replace(/'/g, "\\'");
    }

    showOutput(html, translations, data, type) {
        const outputSection = document.getElementById('outputSection');
        const outputCode = document.getElementById('outputCode');
        const translationsSection = document.getElementById('translationsSection');
        const translationsCode = document.getElementById('translationsCode');
        const previewContainer = document.getElementById('previewContainer');

        outputCode.textContent = html;
        outputSection.style.display = 'block';

        if (translations) {
            translationsCode.textContent = translations;
            translationsSection.style.display = 'block';
        } else {
            translationsSection.style.display = 'none';
        }

        // Generate simple preview
        previewContainer.innerHTML = `
            <div style="max-width: 350px; padding: 20px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px;">
                <div style="height: 120px; background: linear-gradient(135deg, var(--dataviz-1), var(--dataviz-2)); border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                    ${data.chartType.toUpperCase()} CHART
                </div>
                <div style="font-size: 12px; color: var(--text-light); margin-bottom: 8px; font-weight: 600;">
                    ${data.platform.toUpperCase()}
                </div>
                <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">${data.title}</h3>
                <p style="font-size: 14px; color: var(--text-light); margin-bottom: 12px;">${data.desc}</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${data.tags.split(',').map(t => `<span style="padding: 4px 12px; background: var(--bg-alt); border-radius: 20px; font-size: 12px;">${t.trim()}</span>`).join('')}
                </div>
            </div>
        `;

        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Save draft
        this.saveDraft(data, type);
    }

    saveDraft(data, type) {
        const drafts = JSON.parse(localStorage.getItem('adminDrafts') || '[]');
        drafts.unshift({
            type,
            title: data.title,
            data,
            date: new Date().toISOString()
        });
        localStorage.setItem('adminDrafts', JSON.stringify(drafts.slice(0, 10)));
        DraftManager.refresh();
    }
}

// ===================== DRAFT MANAGER =====================
const DraftManager = {
    refresh() {
        const savedList = document.getElementById('savedList');
        const drafts = JSON.parse(localStorage.getItem('adminDrafts') || '[]');

        if (drafts.length === 0) {
            savedList.innerHTML = '<p class="saved-empty">Aucun brouillon sauvegardé</p>';
            return;
        }

        savedList.innerHTML = drafts.map((draft, index) => `
            <div class="saved-item">
                <div class="saved-item__info">
                    <span class="saved-item__title">${draft.title}</span>
                    <span class="saved-item__meta">${draft.type === 'article' ? 'Article' : 'Dataviz'} — ${new Date(draft.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div class="saved-item__actions">
                    <button class="btn btn--ghost btn--sm" onclick="DraftManager.load(${index})">Charger</button>
                    <button class="btn btn--ghost btn--sm" onclick="DraftManager.delete(${index})">Supprimer</button>
                </div>
            </div>
        `).join('');
    },

    load(index) {
        const drafts = JSON.parse(localStorage.getItem('adminDrafts') || '[]');
        const draft = drafts[index];

        if (!draft) return;

        // Switch to correct tab
        document.querySelector(`[data-tab="${draft.type}"]`).click();

        // Fill form
        if (draft.type === 'article') {
            document.getElementById('articleTitle').value = draft.data.title || '';
            document.getElementById('articleDesc').value = draft.data.desc || '';
            document.getElementById('articleCategory').value = draft.data.category || '';
            document.getElementById('articleDate').value = draft.data.date || '';
            document.getElementById('articleReadTime').value = draft.data.readTime || '';
            document.getElementById('articleLink').value = draft.data.link || '';
            document.getElementById('articleGradient1').value = draft.data.gradient1 || '#667eea';
            document.getElementById('articleGradient1Text').value = draft.data.gradient1 || '#667eea';
            document.getElementById('articleGradient2').value = draft.data.gradient2 || '#764ba2';
            document.getElementById('articleGradient2Text').value = draft.data.gradient2 || '#764ba2';
            document.getElementById('articleTitleEn').value = draft.data.titleEn || '';
            document.getElementById('articleDescEn').value = draft.data.descEn || '';
        } else {
            document.getElementById('datavizTitle').value = draft.data.title || '';
            document.getElementById('datavizDesc').value = draft.data.desc || '';
            document.getElementById('datavizPlatform').value = draft.data.platform || '';
            document.getElementById('datavizChartType').value = draft.data.chartType || '';
            document.getElementById('datavizLink').value = draft.data.link || '';
            document.getElementById('datavizLayout').value = draft.data.layout || 'normal';
            document.getElementById('datavizTags').value = draft.data.tags || '';
            document.getElementById('datavizTitleEn').value = draft.data.titleEn || '';
            document.getElementById('datavizDescEn').value = draft.data.descEn || '';
        }

        Toast.show('Brouillon chargé', 'success');
    },

    delete(index) {
        const drafts = JSON.parse(localStorage.getItem('adminDrafts') || '[]');
        drafts.splice(index, 1);
        localStorage.setItem('adminDrafts', JSON.stringify(drafts));
        this.refresh();
        Toast.show('Brouillon supprimé', 'success');
    },

    clearAll() {
        localStorage.removeItem('adminDrafts');
        this.refresh();
        Toast.show('Tous les brouillons ont été supprimés', 'success');
    }
};

// ===================== TOAST =====================
const Toast = {
    show(message, type = 'success') {
        // Remove existing toast
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

// ===================== COPY FUNCTIONALITY =====================
class CopyManager {
    constructor() {
        this.copyBtn = document.getElementById('copyBtn');
        this.copyTransBtn = document.getElementById('copyTransBtn');

        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyCode('outputCode'));
        }
        if (this.copyTransBtn) {
            this.copyTransBtn.addEventListener('click', () => this.copyCode('translationsCode'));
        }
    }

    async copyCode(elementId) {
        const code = document.getElementById(elementId).textContent;

        try {
            await navigator.clipboard.writeText(code);
            Toast.show('Code copié !', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Toast.show('Code copié !', 'success');
        }
    }
}

// ===================== RESET FORM =====================
function resetForm(type) {
    if (type === 'article') {
        document.getElementById('articleForm').reset();
        document.getElementById('articleGradient1').value = '#667eea';
        document.getElementById('articleGradient1Text').value = '#667eea';
        document.getElementById('articleGradient2').value = '#764ba2';
        document.getElementById('articleGradient2Text').value = '#764ba2';
        document.getElementById('articleDate').valueAsDate = new Date();
    } else {
        document.getElementById('datavizForm').reset();
    }
    document.getElementById('outputSection').style.display = 'none';
    Toast.show('Formulaire réinitialisé', 'success');
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    // Check localhost access first
    new LocalhostGuard();

    // Initialize components
    new ThemeToggle();
    new TabManager();
    new ColorSync();
    new ArticleGenerator();
    new DatavizGenerator();
    new CopyManager();

    // Load saved drafts
    DraftManager.refresh();

    // Clear all button
    document.getElementById('clearSavedBtn')?.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment supprimer tous les brouillons ?')) {
            DraftManager.clearAll();
        }
    });
});
