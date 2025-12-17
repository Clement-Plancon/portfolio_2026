/* ===========================================
   Theme Manager Module
   =========================================== */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getSavedTheme() || this.detectSystemTheme();
        this.init();
    }

    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    getSavedTheme() {
        return localStorage.getItem('portfolio-theme');
    }

    saveTheme(theme) {
        localStorage.setItem('portfolio-theme', theme);
    }

    init() {
        // Apply theme
        this.applyTheme(this.currentTheme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getSavedTheme()) {
                // Only auto-switch if user hasn't manually set a preference
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f0f14' : '#f5f3ef');
        }
    }

    updateThemeIcon(theme) {
        const themeBtn = document.querySelector('[data-theme-toggle]');
        if (themeBtn) {
            const sunIcon = themeBtn.querySelector('.icon-sun');
            const moonIcon = themeBtn.querySelector('.icon-moon');

            if (sunIcon && moonIcon) {
                if (theme === 'dark') {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                } else {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                }
            }
        }
    }

    setTheme(theme) {
        this.currentTheme = theme;
        this.saveTheme(theme);
        this.applyTheme(theme);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDark() {
        return this.currentTheme === 'dark';
    }
}

// Export as singleton
const themeManager = new ThemeManager();
export default themeManager;
