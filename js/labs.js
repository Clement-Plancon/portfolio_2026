// Labs Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Filter functionality
    const filterButtons = document.querySelectorAll('.labs-filter');
    const labCards = document.querySelectorAll('.lab-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('labs-filter--active'));
            button.classList.add('labs-filter--active');

            const filter = button.dataset.filter;

            // Filter cards
            labCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
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
        });
    });

    // Animate progress bars on scroll
    const progressBars = document.querySelectorAll('.lab-card__progress-bar');

    const animateProgress = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.setProperty('--progress-animated', 'true');
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

    // Terminal typing effect
    const terminalLines = document.querySelectorAll('.terminal-output');
    terminalLines.forEach((line, index) => {
        line.style.opacity = '0';
        setTimeout(() => {
            line.style.transition = 'opacity 0.3s ease';
            line.style.opacity = '1';
        }, 2000 + (index * 300));
    });

    // Update experiment count
    const experimentCount = document.getElementById('experimentCount');
    if (experimentCount) {
        const visibleCards = document.querySelectorAll('.lab-card:not([style*="display: none"])');
        experimentCount.textContent = visibleCards.length;
    }

    // Matrix rain effect for dark mode (subtle)
    const matrixContainer = document.querySelector('.labs-bg__matrix');
    if (matrixContainer && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        // Create matrix columns
        const columns = 30;
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.cssText = `
                position: absolute;
                top: -100%;
                left: ${(i / columns) * 100}%;
                width: 2px;
                height: 100px;
                background: linear-gradient(180deg, transparent, var(--labs-primary), transparent);
                opacity: 0.1;
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

    // Hover effects for cards in dark mode
    const cards = document.querySelectorAll('.lab-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Add glow effect
            const number = card.querySelector('.lab-card__number');
            if (number) {
                number.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', () => {
            const number = card.querySelector('.lab-card__number');
            if (number && document.documentElement.dataset.theme === 'dark') {
                number.style.opacity = '0.5';
            }
        });
    });
});
