/* ═══════════════════════════════════════════════════════════════
   DEMON — Premium Scroll-linked Canvas Engine
   Canvas image-sequence playback, storytelling beats,
   scroll-reveal, and interactive UI logic
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── CONFIGURATION ───
    const CONFIG = {
        totalFrames: 240,
        framePath: 't-shirt/ezgif-frame-',
        frameExt: '.png',
        heroScrollMultiplier: 1, // 1 = use full hero height
        preloadBatchSize: 10,
        // Storytelling beat ranges (as % of hero scroll)
        beats: [
            { id: 'beat-1', start: 0.00, end: 0.15, peak: 0.07  },
            { id: 'beat-2', start: 0.14, end: 0.40, peak: 0.27  },
            { id: 'beat-3', start: 0.39, end: 0.65, peak: 0.52  },
            { id: 'beat-4', start: 0.64, end: 0.85, peak: 0.74  },
            { id: 'beat-5', start: 0.84, end: 1.00, peak: 0.92  },
        ],
    };

    // ─── STATE ───
    const state = {
        images: [],
        loadedCount: 0,
        currentFrame: 0,
        canvasReady: false,
        heroSection: null,
        canvas: null,
        ctx: null,
        rafId: null,
        lastScrollY: -1,
    };

    // ─── LOADING SCREEN ───
    function createLoadingScreen() {
        const loader = document.createElement('div');
        loader.className = 'loading-screen';
        loader.id = 'loading-screen';
        loader.innerHTML = `
            <div class="loading-logo">DEMON<span style="color: var(--accent-primary)">.</span></div>
            <div class="loading-bar-track">
                <div class="loading-bar-fill" id="loading-bar-fill"></div>
            </div>
            <div class="loading-percent" id="loading-percent">0%</div>
        `;
        document.body.prepend(loader);
    }

    function updateLoadingProgress(percent) {
        const fill = document.getElementById('loading-bar-fill');
        const text = document.getElementById('loading-percent');
        if (fill) fill.style.width = percent + '%';
        if (text) text.textContent = Math.round(percent) + '%';
    }

    function hideLoadingScreen() {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 800);
            }, 400);
        }
    }

    // ─── IMAGE PRELOADING ───
    function getFramePath(index) {
        const num = String(index).padStart(3, '0');
        return CONFIG.framePath + num + CONFIG.frameExt;
    }

    function preloadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const total = CONFIG.totalFrames;

            for (let i = 1; i <= total; i++) {
                const img = new Image();
                img.src = getFramePath(i);

                img.onload = img.onerror = () => {
                    loaded++;
                    state.loadedCount = loaded;
                    const percent = (loaded / total) * 100;
                    updateLoadingProgress(percent);

                    if (loaded === total) {
                        resolve();
                    }
                };

                state.images[i - 1] = img;
            }
        });
    }

    // ─── CANVAS SETUP ───
    function setupCanvas() {
        state.canvas = document.getElementById('hero-canvas');
        state.ctx = state.canvas.getContext('2d');
        state.heroSection = document.getElementById('hero');

        resizeCanvas();
        window.addEventListener('resize', debounce(resizeCanvas, 150));
        state.canvasReady = true;
    }

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;

        state.canvas.width = w * dpr;
        state.canvas.height = h * dpr;
        state.canvas.style.width = w + 'px';
        state.canvas.style.height = h + 'px';
        state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Redraw current frame
        drawFrame(state.currentFrame);
    }

    // ─── FRAME RENDERING ───
    function drawFrame(index) {
        if (!state.canvasReady) return;
        const img = state.images[index];
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const ctx = state.ctx;
        const cw = window.innerWidth;
        const ch = window.innerHeight;

        // Clear
        ctx.clearRect(0, 0, cw, ch);

        // Fill background to match page
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, cw, ch);

        // Draw image — cover fit, centered
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = cw / ch;

        let drawW, drawH, drawX, drawY;

        if (canvasAspect > imgAspect) {
            // Canvas is wider — fit width
            drawW = cw;
            drawH = cw / imgAspect;
            drawX = 0;
            drawY = (ch - drawH) / 2;
        } else {
            // Canvas is taller — fit height
            drawH = ch;
            drawW = ch * imgAspect;
            drawX = (cw - drawW) / 2;
            drawY = 0;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // ─── SCROLL ENGINE ───
    function getHeroScrollProgress() {
        const hero = state.heroSection;
        if (!hero) return 0;

        const rect = hero.getBoundingClientRect();
        const heroHeight = hero.offsetHeight - window.innerHeight;

        if (heroHeight <= 0) return 0;

        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / heroHeight));

        return progress;
    }

    function onScroll() {
        if (state.rafId) return;
        state.rafId = requestAnimationFrame(processScroll);
    }

    function processScroll() {
        state.rafId = null;

        const scrollY = window.scrollY;
        if (scrollY === state.lastScrollY) return;
        state.lastScrollY = scrollY;

        const progress = getHeroScrollProgress();

        // ─ Update canvas frame ─
        const frameIndex = Math.min(
            CONFIG.totalFrames - 1,
            Math.floor(progress * (CONFIG.totalFrames - 1))
        );

        if (frameIndex !== state.currentFrame) {
            state.currentFrame = frameIndex;
            drawFrame(frameIndex);
        }

        // ─ Update storytelling beats ─
        updateBeats(progress);

        // ─ Update navbar ─
        updateNavbar(scrollY);
    }

    // ─── STORYTELLING BEATS ───
    function updateBeats(progress) {
        CONFIG.beats.forEach((beat) => {
            const el = document.getElementById(beat.id);
            if (!el) return;

            // Calculate visibility
            const fadeInStart = beat.start;
            const fadeInEnd = beat.start + (beat.peak - beat.start) * 0.5;
            const fadeOutStart = beat.peak + (beat.end - beat.peak) * 0.5;
            const fadeOutEnd = beat.end;

            let opacity = 0;

            if (progress >= fadeInStart && progress <= fadeInEnd) {
                // Fading in
                opacity = (progress - fadeInStart) / (fadeInEnd - fadeInStart);
            } else if (progress > fadeInEnd && progress < fadeOutStart) {
                // Fully visible
                opacity = 1;
            } else if (progress >= fadeOutStart && progress <= fadeOutEnd) {
                // Fading out
                opacity = 1 - (progress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
            }

            opacity = Math.max(0, Math.min(1, opacity));

            el.style.opacity = opacity;
            el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';

            // Toggle "visible" class for CSS transitions
            if (opacity > 0.1) {
                el.classList.add('visible');
            } else {
                el.classList.remove('visible');
            }
        });
    }

    // ─── NAVBAR ───
    function updateNavbar(scrollY) {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // ─── MOBILE MENU ───
    function setupMobileMenu() {
        const toggle = document.getElementById('nav-mobile-toggle');
        const menu = document.getElementById('mobile-menu');
        const links = menu ? menu.querySelectorAll('.mobile-link') : [];

        if (!toggle || !menu) return;

        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            menu.classList.toggle('active');
            document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
        });

        links.forEach((link) => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                menu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ─── INTERACTIVE SELECTORS ───
    function setupSelectors() {
        // Color swatches
        const colorBtns = document.querySelectorAll('.color-swatch');
        colorBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                colorBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Size buttons
        const sizeBtns = document.querySelectorAll('.size-btn');
        sizeBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // ─── SCROLL-REVEAL FOR BELOW-HERO SECTIONS ───
    function setupScrollReveal() {
        const revealTargets = document.querySelectorAll(
            '.section-header, .feature-card, .collection-visual, .collection-info, ' +
            '.spec-item, .lookbook-item, .cta-content, .footer-top, .footer-bottom'
        );

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -60px 0px',
            }
        );

        revealTargets.forEach((el) => observer.observe(el));
    }

    // ─── SMOOTH SCROLL FOR NAV LINKS ───
    function setupSmoothScroll() {
        const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
        navLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });

        // Active state tracking
        const sections = document.querySelectorAll('section[id]');
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        navLinks.forEach((link) => {
                            const linkSection = link.getAttribute('data-section');
                            if (linkSection) {
                                link.classList.toggle('active', linkSection === id);
                            }
                        });
                    }
                });
            },
            { threshold: 0.3 }
        );

        sections.forEach((section) => sectionObserver.observe(section));
    }

    // ─── UTILITIES ───
    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ─── INIT ───
    async function init() {
        createLoadingScreen();
        setupCanvas();
        setupMobileMenu();
        setupSelectors();
        setupSmoothScroll();

        // Draw first frame immediately if available
        drawFrame(0);

        // Preload all frames
        await preloadImages();

        // Draw first frame again after load
        drawFrame(0);

        // Hide loader
        hideLoadingScreen();

        // Start scroll-listening
        window.addEventListener('scroll', onScroll, { passive: true });

        // Setup reveal animations for below-hero content
        setupScrollReveal();

        // Initial scroll process (in case user refreshed mid-page)
        processScroll();

        console.log('[DEMON] Ready — 240 frames loaded, scroll engine active.');
    }

    // ─── BOOT ───
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
