/* =========================================================
   ATLAS — core interactions
   Theme · Command palette · Reveal · Nav
   ========================================================= */
(() => {
    'use strict';

    // Mark html with .js for progressive enhancement
    document.documentElement.classList.add('js');

    // ---------- THEME ----------
    const THEME_KEY = 'atlas-theme';
    const root = document.documentElement;

    const getPreferred = () => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const applyTheme = (t) => {
        root.setAttribute('data-theme', t);
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
            'content',
            t === 'dark' ? '#0f0e0c' : '#f6f4ee'
        );
    };

    const toggleTheme = () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
    };

    applyTheme(getPreferred());

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        btn.addEventListener('click', toggleTheme);
    });

    // Follow system when user hasn't picked
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // ---------- NAV ----------
    const nav = document.querySelector('.nav');
    const onScroll = () => {
        if (!nav) return;
        nav.classList.toggle('nav--scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile drawer
    const burger = document.querySelector('.nav__burger');
    if (burger) {
        burger.addEventListener('click', () => {
            document.body.classList.toggle('nav-open');
            burger.setAttribute(
                'aria-expanded',
                document.body.classList.contains('nav-open') ? 'true' : 'false'
            );
        });
        document.querySelectorAll('.drawer a').forEach((a) => {
            a.addEventListener('click', () => {
                document.body.classList.remove('nav-open');
                burger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Active nav link based on scroll section
    const sections = Array.from(document.querySelectorAll('[data-section]'));
    const navLinks = Array.from(document.querySelectorAll('.nav__link[data-nav-to]'));
    if (sections.length && navLinks.length) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('data-section');
                    navLinks.forEach((l) => {
                        l.setAttribute(
                            'aria-current',
                            l.getAttribute('data-nav-to') === id ? 'true' : 'false'
                        );
                    });
                }
            });
        }, { rootMargin: '-30% 0px -60% 0px' });
        sections.forEach((s) => obs.observe(s));
    }

    // ---------- REVEAL ----------
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
        reveals.forEach((el) => io.observe(el));
    }

    // ---------- COMMAND PALETTE ----------
    const cmdk = document.getElementById('cmdk');
    const cmdkInput = document.getElementById('cmdk-input');
    const cmdkList = document.getElementById('cmdk-list');

    const commands = [
        { group: 'Navigate', name: 'Home', hint: '/', run: () => scrollToId('top') },
        { group: 'Navigate', name: 'Work', hint: '#work', run: () => scrollToId('work') },
        { group: 'Navigate', name: 'Experience', hint: '#experience', run: () => scrollToId('experience') },
        { group: 'Navigate', name: 'About', hint: '#about', run: () => scrollToId('about') },
        { group: 'Navigate', name: 'Contact', hint: '#contact', run: () => scrollToId('contact') },
        { group: 'External', name: 'GitHub', hint: '↗', run: () => window.open('https://github.com/Clement-Plancon', '_blank', 'noopener') },
        { group: 'External', name: 'LinkedIn', hint: '↗', run: () => window.open('https://www.linkedin.com/in/cl%C3%A9ment-plan%C3%A7on-502b1b195/', '_blank', 'noopener') },
        { group: 'External', name: 'Email', hint: '✉', run: () => { window.location.href = 'mailto:plancon.clem.pro@gmail.com'; } },
        { group: 'Theme', name: 'Toggle theme', hint: 'light / dark', run: toggleTheme },
    ];

    const scrollToId = (id) => {
        if (id === 'top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const el = document.getElementById(id);
        if (!el) return;
        const navH = (document.querySelector('.nav')?.offsetHeight) || 0;
        const y = el.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top: y, behavior: 'smooth' });
    };

    let activeIdx = 0;
    let filtered = [...commands];

    const renderCmdk = () => {
        if (!cmdkList) return;
        cmdkList.innerHTML = '';
        if (filtered.length === 0) {
            cmdkList.innerHTML = `<li class="cmdk__item" aria-disabled="true" style="color: var(--ink-4);">No results</li>`;
            return;
        }
        const groups = {};
        filtered.forEach((c) => {
            (groups[c.group] = groups[c.group] || []).push(c);
        });
        let idx = 0;
        Object.entries(groups).forEach(([g, items]) => {
            const title = document.createElement('li');
            title.className = 'cmdk__group-title';
            title.textContent = g;
            cmdkList.appendChild(title);
            items.forEach((c) => {
                const li = document.createElement('li');
                li.className = 'cmdk__item';
                li.setAttribute('role', 'option');
                li.setAttribute('data-idx', idx);
                li.setAttribute('aria-selected', idx === activeIdx ? 'true' : 'false');
                li.innerHTML = `
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4"/>
                    </svg>
                    <span class="cmdk__item-name">${c.name}</span>
                    <span class="cmdk__item-hint">${c.hint}</span>
                `;
                li.addEventListener('click', () => runCommand(c));
                li.addEventListener('mouseenter', () => {
                    activeIdx = parseInt(li.getAttribute('data-idx'), 10);
                    updateSelected();
                });
                cmdkList.appendChild(li);
                idx++;
            });
        });
    };

    const updateSelected = () => {
        cmdkList?.querySelectorAll('.cmdk__item').forEach((item) => {
            item.setAttribute(
                'aria-selected',
                parseInt(item.getAttribute('data-idx'), 10) === activeIdx ? 'true' : 'false'
            );
        });
        const sel = cmdkList?.querySelector('[aria-selected="true"]');
        sel?.scrollIntoView({ block: 'nearest' });
    };

    const runCommand = (c) => {
        closeCmdk();
        setTimeout(() => c.run(), 60);
    };

    const openCmdk = () => {
        if (!cmdk) return;
        if (!cmdk.open) cmdk.showModal();
        if (cmdkInput) {
            cmdkInput.value = '';
            cmdkInput.focus();
        }
        filtered = [...commands];
        activeIdx = 0;
        renderCmdk();
    };

    const closeCmdk = () => {
        if (!cmdk) return;
        if (cmdk.open) cmdk.close();
    };

    cmdkInput?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        filtered = commands.filter(
            (c) => c.name.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)
        );
        activeIdx = 0;
        renderCmdk();
    });

    cmdkInput?.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = Math.min(activeIdx + 1, filtered.length - 1);
            updateSelected();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = Math.max(activeIdx - 1, 0);
            updateSelected();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[activeIdx]) runCommand(filtered[activeIdx]);
        } else if (e.key === 'Escape') {
            closeCmdk();
        }
    });

    cmdk?.addEventListener('click', (e) => {
        if (e.target === cmdk) closeCmdk();
    });

    document.querySelectorAll('[data-cmdk-open]').forEach((btn) => {
        btn.addEventListener('click', openCmdk);
    });

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (cmdk?.open) closeCmdk();
            else openCmdk();
        }
    });

    // ---------- SMOOTH LINKS ----------
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (href === '#' || href.length < 2) return;
            const id = href.slice(1);
            if (!document.getElementById(id)) return;
            e.preventDefault();
            scrollToId(id);
            if (history.replaceState) history.replaceState(null, '', href);
        });
    });

    // ---------- YEAR ----------
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
})();
