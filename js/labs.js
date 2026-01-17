// Labs Page JavaScript
// Loads experiments from localStorage (managed by admin) and displays them

const LabsDataStore = {
    LABS_KEY: 'portfolio_labs',

    getLabs() {
        return JSON.parse(localStorage.getItem(this.LABS_KEY) || '[]');
    },

    // Get visible labs only (not hidden)
    getVisibleLabs() {
        return this.getLabs().filter(lab => !lab.hidden);
    }
};

// Category configurations
const categoryConfig = {
    ia: {
        label: 'Intelligence Artificielle',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
            <path d="M16 14v1a4 4 0 0 1-8 0v-1"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="8" y1="22" x2="16" y2="22"/>
        </svg>`,
        filter: 'ai'
    },
    web: {
        label: 'Web / App',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>`,
        filter: 'web'
    },
    hardware: {
        label: 'Hardware / IoT',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
            <rect x="9" y="9" width="6" height="6"/>
            <line x1="9" y1="1" x2="9" y2="4"/>
            <line x1="15" y1="1" x2="15" y2="4"/>
            <line x1="9" y1="20" x2="9" y2="23"/>
            <line x1="15" y1="20" x2="15" y2="23"/>
        </svg>`,
        filter: 'hardware'
    },
    tools: {
        label: 'CLI / DevTools',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4 17 10 11 4 5"/>
            <line x1="12" y1="19" x2="20" y2="19"/>
        </svg>`,
        filter: 'tools'
    },
    game: {
        label: 'Gaming / Créatif',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <line x1="6" y1="12" x2="10" y2="12"/>
            <line x1="8" y1="10" x2="8" y2="14"/>
            <circle cx="17" cy="10" r="1"/>
            <circle cx="15" cy="14" r="1"/>
        </svg>`,
        filter: 'game'
    }
};

// Status configurations
const statusConfig = {
    idea: { label: 'Idée', class: 'idea' },
    prototype: { label: 'Prototype', class: 'prototype' },
    beta: { label: 'Beta', class: 'beta' },
    active: { label: 'En développement', class: 'active' },
    archived: { label: 'Archivé', class: 'archived' }
};

// Render a single lab card
function renderLabCard(lab, index) {
    const category = categoryConfig[lab.category] || categoryConfig.web;
    const status = statusConfig[lab.status] || statusConfig.active;
    const filterCategory = category.filter;
    const isFeatured = lab.featured && index === 0;

    // Parse technologies
    const techTags = lab.tech ? lab.tech.split(',').map(t => `<span>${t.trim()}</span>`).join('') : '';

    return `
        <article class="lab-card ${isFeatured ? 'lab-card--featured' : ''}" data-category="${filterCategory}">
            <div class="lab-card__status">
                <span class="lab-card__status-dot lab-card__status-dot--${status.class}"></span>
                <span>${status.label}</span>
            </div>
            <div class="lab-card__number">${String(index + 1).padStart(2, '0')}</div>
            <div class="lab-card__content">
                <span class="lab-card__category">
                    ${category.icon}
                    ${category.label}
                </span>
                <h3 class="lab-card__title">${lab.title}</h3>
                <p class="lab-card__desc">${lab.desc}</p>
                <div class="lab-card__tech">${techTags}</div>
                <div class="lab-card__progress">
                    <div class="lab-card__progress-bar">
                        <div class="lab-card__progress-fill" style="width: ${lab.progress}%"></div>
                    </div>
                    <span class="lab-card__progress-value">${lab.progress}%</span>
                </div>
            </div>
            ${isFeatured ? `
            <div class="lab-card__visual">
                <div class="lab-visual lab-visual--brain">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="35" class="brain-circle"/>
                        <path d="M30 50 Q40 30 50 50 T70 50" class="brain-wave brain-wave--1"/>
                        <path d="M25 50 Q37 35 50 50 T75 50" class="brain-wave brain-wave--2"/>
                        <path d="M35 50 Q42 40 50 50 T65 50" class="brain-wave brain-wave--3"/>
                    </svg>
                </div>
            </div>
            ` : ''}
        </article>
    `;
}

// Render all labs
function renderLabs() {
    const grid = document.querySelector('.labs-grid');
    if (!grid) return;

    const labs = LabsDataStore.getVisibleLabs();

    if (labs.length === 0) {
        grid.innerHTML = `
            <div class="labs-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 3h6v2H9zM8 5v5l-3 9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-3-9V5"/>
                    <path d="M7 14h10"/>
                </svg>
                <p>Aucune expérience en cours</p>
            </div>
        `;
        return;
    }

    // Sort: featured first, then by progress
    const sortedLabs = [...labs].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.progress - a.progress;
    });

    grid.innerHTML = sortedLabs.map((lab, i) => renderLabCard(lab, i)).join('');

    // Update experiment count in status bar
    updateExperimentCount(labs.length);

    // Update terminal output
    updateTerminalOutput(labs.length);

    // Reattach filter events
    attachFilterEvents();

    // Animate progress bars
    animateProgressBars();
}

// Update experiment count in status bar
function updateExperimentCount(count) {
    const countEl = document.getElementById('experimentCount');
    if (countEl) {
        countEl.textContent = count;
    }
}

// Update terminal output
function updateTerminalOutput(count) {
    const outputLines = document.querySelectorAll('.terminal-output');
    if (outputLines.length >= 2) {
        const lastOutput = outputLines[outputLines.length - 1];
        const highlight = lastOutput.querySelector('.terminal-highlight');
        if (highlight) {
            highlight.textContent = `total ${count} experiments loaded`;
        }
    }
}

// Attach filter events
function attachFilterEvents() {
    const filterButtons = document.querySelectorAll('.labs-filter');
    const labCards = document.querySelectorAll('.lab-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('labs-filter--active'));
            button.classList.add('labs-filter--active');

            const filter = button.dataset.filter;

            // Filter cards with animation
            labCards.forEach(card => {
                const cardCategory = card.dataset.category;
                const shouldShow = filter === 'all' || cardCategory === filter ||
                    (filter === 'ai' && cardCategory === 'ai') ||
                    (filter === 'web' && (cardCategory === 'web' || cardCategory === 'game' || cardCategory === 'tools'));

                if (shouldShow) {
                    card.style.display = '';
                    card.style.opacity = '1';
                    card.style.transform = '';
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });

            // Update visible count
            setTimeout(() => {
                const visibleCards = document.querySelectorAll('.lab-card:not([style*="display: none"])');
                updateExperimentCount(visibleCards.length);
            }, 350);
        });
    });
}

// Animate progress bars on scroll
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.lab-card__progress-fill');

    const animateProgress = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.style.width;
                entry.target.style.width = '0%';
                setTimeout(() => {
                    entry.target.style.width = width;
                }, 100);
                observer.unobserve(entry.target);
            }
        });
    };

    const progressObserver = new IntersectionObserver(animateProgress, {
        threshold: 0.5
    });

    progressBars.forEach(bar => {
        progressObserver.observe(bar);
    });
}

// Terminal typing effect
function initTerminalEffect() {
    const terminalLines = document.querySelectorAll('.terminal-output');
    terminalLines.forEach((line, index) => {
        line.style.opacity = '0';
        setTimeout(() => {
            line.style.transition = 'opacity 0.3s ease';
            line.style.opacity = '1';
        }, 2000 + (index * 300));
    });
}

// Matrix rain effect for dark mode
function initMatrixEffect() {
    const matrixContainer = document.querySelector('.labs-bg__matrix');
    if (matrixContainer && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        // Create matrix columns
        const columns = 40;
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.cssText = `
                position: absolute;
                top: -100%;
                left: ${(i / columns) * 100}%;
                width: 2px;
                height: ${50 + Math.random() * 100}px;
                background: linear-gradient(180deg, transparent, var(--labs-primary), transparent);
                opacity: ${0.05 + Math.random() * 0.15};
                animation: matrix-fall ${5 + Math.random() * 10}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            matrixContainer.appendChild(column);
        }

        // Add matrix fall animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes matrix-fall {
                0% { transform: translateY(0); }
                100% { transform: translateY(200vh); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Create floating particles for dark mode
function initParticles() {
    const isDark = document.documentElement.dataset.theme === 'dark';
    if (!isDark) return;

    let particleContainer = document.querySelector('.labs-particles');
    if (!particleContainer) {
        particleContainer = document.createElement('div');
        particleContainer.className = 'labs-particles';
        document.querySelector('.labs-bg')?.appendChild(particleContainer);
    }

    // Create particles
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            --x: ${Math.random() * 100}%;
            --y: ${Math.random() * 100}%;
            --size: ${2 + Math.random() * 4}px;
            --duration: ${10 + Math.random() * 20}s;
            --delay: ${Math.random() * 5}s;
        `;
        particleContainer.appendChild(particle);
    }
}

// Hover effects for cards
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.lab-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const number = card.querySelector('.lab-card__number');
            if (number) {
                number.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', () => {
            const number = card.querySelector('.lab-card__number');
            if (number && document.documentElement.dataset.theme === 'dark') {
                number.style.opacity = '0.7';
            }
        });
    });
}

// Theme change handler
function onThemeChange() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                const isDark = document.documentElement.dataset.theme === 'dark';
                if (isDark) {
                    initParticles();
                }
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Render labs from localStorage
    renderLabs();

    // Initialize effects
    initTerminalEffect();
    initMatrixEffect();
    initParticles();
    initCardHoverEffects();
    onThemeChange();
});
