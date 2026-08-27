/* ═══════════════════════════════════════════════════════════════
   DEMON — Premium Scroll-linked Canvas Engine
   Optimised: progressive frame loading so page is interactive
   after just the first batch — not after all 240 frames.
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── CONFIGURATION ───
    const CONFIG = {
        totalFrames: 240,
        framePath: 't-shirt/ezgif-frame-',
        frameExt: '.webp',
        heroScrollMultiplier: 1,
        // How many frames to preload before showing the page
        initialBatch: 10,
        // How many frames to load per background batch
        batchSize: 20,
        // Delay between background batches (ms) — keeps bandwidth free for other assets
        batchDelay: 150,
        // How many frames ahead of current position to keep preloaded
        lookahead: 30,
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
        images: new Array(CONFIG.totalFrames).fill(null),
        loadedCount: 0,
        currentFrame: 0,
        canvasReady: false,
        heroSection: null,
        canvas: null,
        ctx: null,
        rafId: null,
        lastScrollY: -1,
        allLoaded: false,
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

    // ─── IMAGE LOADING ───
    function getFramePath(index) {
        const num = String(index + 1).padStart(3, '0'); // frames are 1-indexed files
        return CONFIG.framePath + num + CONFIG.frameExt;
    }

    /**
     * Load a single frame by 0-based index.
     * Returns a Promise that resolves when the image is loaded.
     */
    function loadFrame(index) {
        return new Promise((resolve) => {
            if (state.images[index] && state.images[index].complete) {
                return resolve(state.images[index]);
            }
            const img = new Image();
            img.onload = () => {
                state.images[index] = img;
                state.loadedCount++;
                resolve(img);
            };
            img.onerror = () => {
                state.images[index] = null;
                state.loadedCount++;
                resolve(null);
            };
            img.src = getFramePath(index);
        });
    }

    /**
     * Load a range of frames [start, end) in parallel.
     */
    function loadRange(start, end) {
        const promises = [];
        for (let i = start; i < end && i < CONFIG.totalFrames; i++) {
            if (!state.images[i]) {
                promises.push(loadFrame(i));
            }
        }
        return Promise.all(promises);
    }

    /**
     * PHASE 1 — Load just the first N frames so the page can show.
     */
    async function loadInitialBatch() {
        const n = Math.min(CONFIG.initialBatch, CONFIG.totalFrames);
        await loadRange(0, n);
        const pct = Math.round((n / CONFIG.totalFrames) * 100);
        updateLoadingProgress(pct);
    }

    /**
     * PHASE 2 — Load the rest in small batches in the background,
     * yielding between each batch so scroll/paint stays smooth.
     */
    async function loadRemainingBatches() {
        const start = CONFIG.initialBatch;

        for (let i = start; i < CONFIG.totalFrames; i += CONFIG.batchSize) {
            const end = Math.min(i + CONFIG.batchSize, CONFIG.totalFrames);
            await loadRange(i, end);

            const pct = Math.round((state.loadedCount / CONFIG.totalFrames) * 100);
            // Only update the bar if the loading screen is still visible
            updateLoadingProgress(pct);

            // Yield to the browser between batches
            await new Promise((r) => setTimeout(r, CONFIG.batchDelay));
        }

        state.allLoaded = true;
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

        drawFrame(state.currentFrame);
    }

    // ─── FRAME RENDERING ───
    function drawFrame(index) {
        if (!state.canvasReady) return;

        // Find the nearest loaded frame to avoid blank canvas during gaps
        let img = state.images[index];
        if (!img || !img.complete || img.naturalWidth === 0) {
            // Search backwards for the nearest loaded frame
            for (let k = index - 1; k >= 0; k--) {
                if (state.images[k] && state.images[k].complete && state.images[k].naturalWidth > 0) {
                    img = state.images[k];
                    break;
                }
            }
        }
        if (!img) return;

        const ctx = state.ctx;
        const cw = window.innerWidth;
        const ch = window.innerHeight;

        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, cw, ch);

        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = cw / ch;
        let drawW, drawH, drawX, drawY;

        if (canvasAspect > imgAspect) {
            drawW = cw;
            drawH = cw / imgAspect;
            drawX = 0;
            drawY = (ch - drawH) / 2;
        } else {
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
        return Math.max(0, Math.min(1, scrolled / heroHeight));
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

        const frameIndex = Math.min(
            CONFIG.totalFrames - 1,
            Math.floor(progress * (CONFIG.totalFrames - 1))
        );

        if (frameIndex !== state.currentFrame) {
            state.currentFrame = frameIndex;
            drawFrame(frameIndex);
        }

        updateBeats(progress);
        updateNavbar(scrollY);
    }

    // ─── STORYTELLING BEATS ───
    function updateBeats(progress) {
        CONFIG.beats.forEach((beat) => {
            const el = document.getElementById(beat.id);
            if (!el) return;

            const fadeInStart  = beat.start;
            const fadeInEnd    = beat.start + (beat.peak - beat.start) * 0.5;
            const fadeOutStart = beat.peak  + (beat.end  - beat.peak)  * 0.5;
            const fadeOutEnd   = beat.end;

            let opacity = 0;
            if (progress >= fadeInStart && progress <= fadeInEnd) {
                opacity = (progress - fadeInStart) / (fadeInEnd - fadeInStart);
            } else if (progress > fadeInEnd && progress < fadeOutStart) {
                opacity = 1;
            } else if (progress >= fadeOutStart && progress <= fadeOutEnd) {
                opacity = 1 - (progress - fadeOutStart) / (fadeOutEnd - fadeOutStart);
            }

            opacity = Math.max(0, Math.min(1, opacity));
            el.style.opacity = opacity;
            el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
            el.classList.toggle('visible', opacity > 0.1);
        });
    }

    // ─── NAVBAR ───
    function updateNavbar(scrollY) {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        navbar.classList.toggle('scrolled', scrollY > 50);
    }

    // ─── MOBILE MENU ───
    function setupMobileMenu() {
        const toggle = document.getElementById('nav-mobile-toggle');
        const menu   = document.getElementById('mobile-menu');
        const links  = menu ? menu.querySelectorAll('.mobile-link') : [];
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
        const colorBtns = document.querySelectorAll('.color-swatch');
        colorBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                colorBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        const sizeBtns = document.querySelectorAll('.size-btn');
        sizeBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // ─── SCROLL-REVEAL ───
    function setupScrollReveal() {
        const targets = document.querySelectorAll(
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
            { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
        );
        targets.forEach((el) => observer.observe(el));
    }

    // ─── SMOOTH SCROLL ───
    function setupSmoothScroll() {
        const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
        navLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

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

        // PHASE 1: Load only the first 10 frames — fast, shows page quickly
        await loadInitialBatch();

        // Show the page as soon as the first batch is ready
        drawFrame(0);
        hideLoadingScreen();

        // Start scroll immediately — fallback draws nearest loaded frame if ahead
        window.addEventListener('scroll', onScroll, { passive: true });
        setupScrollReveal();
        processScroll();

        // PHASE 2: Load the rest quietly in the background
        loadRemainingBatches();

        console.log('[DEMON] Ready — initial batch shown, remaining frames loading in background.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
