/* ===========================================
   Animations Module
   =========================================== */

class AnimationManager {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupParallax();
        this.setupCounterAnimations();
        this.setupMagneticButtons();
        this.setupTextReveal();
        this.setupImageReveal();
        this.setupSmoothScroll();
    }

    // Intersection Observer for scroll animations
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');

                    // Optionally unobserve after animation
                    if (entry.target.dataset.animateOnce !== 'false') {
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, this.observerOptions);

        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    }

    // Parallax effect
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');

        if (parallaxElements.length === 0) return;

        // Use requestAnimationFrame for smooth performance
        let ticking = false;

        const updateParallax = () => {
            const scrollY = window.scrollY;

            parallaxElements.forEach(el => {
                const speed = el.dataset.parallaxSpeed || 0.5;
                const offset = scrollY * speed;
                el.style.transform = `translateY(${offset}px)`;
            });

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }

    // Counter animation
    setupCounterAnimations() {
        const counters = document.querySelectorAll('[data-counter]');

        if (counters.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const target = parseInt(element.dataset.counter, 10);
        const duration = parseInt(element.dataset.counterDuration, 10) || 2000;
        const suffix = element.dataset.counterSuffix || '';
        const start = 0;
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);

            element.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target + suffix;
            }
        };

        requestAnimationFrame(updateCounter);
    }

    // Magnetic effect for buttons
    setupMagneticButtons() {
        const magneticElements = document.querySelectorAll('.magnetic');

        magneticElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translate(0, 0)';
            });
        });
    }

    // Text reveal animation
    setupTextReveal() {
        const textRevealElements = document.querySelectorAll('.text-reveal');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        textRevealElements.forEach(el => observer.observe(el));
    }

    // Image reveal animation
    setupImageReveal() {
        const imageRevealElements = document.querySelectorAll('.image-reveal');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animated');
                    }, 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        imageRevealElements.forEach(el => observer.observe(el));
    }

    // Smooth scroll for anchor links
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');

                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL without jump
                    history.pushState(null, '', targetId);
                }
            });
        });
    }

    // Staggered animation helper
    staggerElements(elements, baseDelay = 100) {
        elements.forEach((el, index) => {
            el.style.transitionDelay = `${index * baseDelay}ms`;
        });
    }

    // Typing effect
    typeText(element, text, speed = 50) {
        return new Promise((resolve) => {
            let i = 0;
            element.textContent = '';

            const type = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            };

            type();
        });
    }

    // Shuffle text effect
    shuffleText(element, finalText, duration = 1000) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            let result = '';
            for (let i = 0; i < finalText.length; i++) {
                if (i < finalText.length * progress) {
                    result += finalText[i];
                } else {
                    result += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            element.textContent = result;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}

// Export as singleton
const animationManager = new AnimationManager();
export default animationManager;
