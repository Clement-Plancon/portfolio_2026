/* ===========================================
   Main JavaScript Entry Point
   =========================================== */

import i18n from './i18n.js';
import themeManager from './theme.js';
import animationManager from './animations.js';

class Portfolio {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupLanguageToggle();
        this.setupMobileMenu();
        this.setupMarquee();
        this.setupScrollEffects();

        // Add loaded class for initial animations
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);

        console.log('Portfolio initialized');
    }

    // Navigation scroll effect
    setupNavigation() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        let lastScroll = 0;

        const handleScroll = () => {
            const currentScroll = window.scrollY;

            // Add scrolled class
            if (currentScroll > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            // Hide/show on scroll direction (optional)
            if (currentScroll > lastScroll && currentScroll > 200) {
                nav.classList.add('nav--hidden');
            } else {
                nav.classList.remove('nav--hidden');
            }

            lastScroll = currentScroll;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial call
    }

    // Theme toggle
    setupThemeToggle() {
        const themeBtn = document.querySelector('[data-theme-toggle]');
        if (!themeBtn) return;

        themeBtn.addEventListener('click', () => {
            themeManager.toggleTheme();

            // Add animation
            themeBtn.classList.add('animate');
            setTimeout(() => themeBtn.classList.remove('animate'), 300);
        });
    }

    // Language toggle
    setupLanguageToggle() {
        const langBtn = document.querySelector('[data-lang-toggle]');
        if (!langBtn) return;

        // Update button text based on current lang
        const updateLangButton = () => {
            const currentLang = i18n.getCurrentLanguage();
            const langText = langBtn.querySelector('.lang-text');
            if (langText) {
                langText.textContent = currentLang === 'fr' ? 'EN' : 'FR';
            }
        };

        langBtn.addEventListener('click', () => {
            i18n.toggleLanguage();
            updateLangButton();
        });

        // Listen for language changes from other sources
        window.addEventListener('languageChanged', updateLangButton);

        // Initial update
        updateLangButton();
    }

    // Mobile menu
    setupMobileMenu() {
        const toggle = document.querySelector('.nav__toggle');
        const menu = document.querySelector('.nav__menu');
        const closeBtn = document.querySelector('.nav__menu-close');
        const links = document.querySelectorAll('.nav__menu .nav__link');

        if (!toggle || !menu) return;

        const openMenu = () => {
            menu.classList.add('active');
            document.body.style.overflow = 'hidden';
            toggle.setAttribute('aria-expanded', 'true');
        };

        const closeMenu = () => {
            menu.classList.remove('active');
            document.body.style.overflow = '';
            toggle.setAttribute('aria-expanded', 'false');
        };

        toggle.addEventListener('click', openMenu);

        if (closeBtn) {
            closeBtn.addEventListener('click', closeMenu);
        }

        links.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('active')) {
                closeMenu();
            }
        });

        // Close on click outside
        menu.addEventListener('click', (e) => {
            if (e.target === menu) {
                closeMenu();
            }
        });
    }

    // Marquee duplication for seamless loop
    setupMarquee() {
        const marquees = document.querySelectorAll('.marquee__content');

        marquees.forEach(marquee => {
            // Clone content for seamless loop
            const clone = marquee.cloneNode(true);
            marquee.parentElement.appendChild(clone);
        });
    }

    // Scroll-based effects
    setupScrollEffects() {
        // Active nav link based on scroll position
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav__link');

        if (sections.length === 0 || navLinks.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');

                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-20% 0px -20% 0px'
        });

        sections.forEach(section => observer.observe(section));
    }
}

// Initialize
const portfolio = new Portfolio();

// Export for potential external use
export default portfolio;
