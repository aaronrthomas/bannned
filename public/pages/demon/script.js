/* ═══════════════════════════════════════════════════════════════
   BANNNED — Universal Dynamic Product Detailed Page Engine
   Cinematic scroll-linked canvas, dynamic product metadata,
   progressive frame sequence or studio single-image parallax.
   ═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ─── PRODUCT CATALOG ───
    const PRODUCTS = {
        'demon-tee': {
            id: 'demon-tee',
            name: 'Demon Tee',
            brand: 'DEMON',
            heroTitleHtml: 'DEM<span class="accent">O</span>N',
            series: 'SS26 Collection',
            tagline: 'Wear the darkness.',
            heroTagline: "Premium streetwear forged in shadow. Designed for those who don't follow — they lead.",
            vol: 'Vol. I',
            price: '₹250.00',
            tag: 'Limited Edition',
            remaining: 47,
            totalPieces: 200,
            image: '/red.jpeg',
            hasFrameAnimation: true,
            totalFrames: 240,
            framePath: 't-shirt/ezgif-frame-',
            frameExt: '.webp',
            previewImages: [
                { src: 't-shirt/ezgif-frame-060.webp', caption: 'Back detail — "DEMON" graphic' },
                { src: 't-shirt/ezgif-frame-120.webp', caption: 'Three-quarter perspective' },
                { src: 't-shirt/ezgif-frame-180.webp', caption: 'Side profile & hem' },
            ],
            description: 'Limited edition dark-themed graphic tee. Screen-printed artwork on premium red-washed fabric.',
            beats: {
                craft: {
                    label: '01 — Craftsmanship',
                    heading: 'Precision-cut.<br>Hand-finished.',
                    body1: 'Every stitch is intentional. Premium 280GSM heavyweight cotton, enzyme-washed for a lived-in softness that only gets better with time.',
                    body2: "The artwork isn't printed — it's embedded. Multi-layer DTG infusion bonds pigment to fibre at a molecular level."
                },
                design: {
                    label: '02 — Design',
                    heading: 'Art meets<br>rebellion.',
                    features: [
                        'Original artwork by underground digital artists.',
                        'Each drop limited to 200 pieces worldwide.',
                        'Woven labels. Signature hem tags. Interior taping.'
                    ]
                },
                material: {
                    label: '03 — Material',
                    heading: 'Built to<br>last forever.',
                    body1: 'Premium Japanese-sourced cotton. Reinforced shoulder seams. Drop-cut silhouette for modern oversized fit.',
                    body2: "Fade-proof. Shrink-proof. Made for the long haul — because real fashion doesn't have an expiry date."
                },
                cta: {
                    heading: 'Own the<br>darkness.',
                    subheading: "DEMON SS26. Limited to 200 pieces. Once they're gone, they're gone."
                }
            },
            specs: {
                material: '100% Premium Japanese Cotton, 280GSM',
                fit: 'Oversized drop-cut, unisex',
                print: 'Multi-layer DTG infusion, fade-proof',
                wash: 'Enzyme pre-washed for softness',
                edition: 'Limited to 200 individually numbered pieces',
                details: 'Woven neck label, embroidered hem tag, interior taping',
                care: 'Machine wash cold, tumble dry low, iron inside out',
                origin: 'Designed in Tokyo, manufactured in Portugal'
            },
            colors: [
                { name: 'Black', hex: '#1a1a1a', active: true },
                { name: 'Blood Red', hex: '#8B0000' },
                { name: 'Phantom White', hex: '#E8E8E8' }
            ]
        },
        'angel-tee': {
            id: 'angel-tee',
            name: 'Angel Tee',
            brand: 'ANGEL',
            heroTitleHtml: 'ANG<span class="accent">E</span>L',
            series: 'SS26 Capsule',
            tagline: 'Heaven meets the street.',
            heroTagline: 'Pure street aesthetics infused with ethereal graphics. Tailored for comfort, styled for impact.',
            vol: 'Vol. II',
            price: '₹250.00',
            tag: 'New Arrival',
            remaining: 62,
            totalPieces: 250,
            image: '/angel.jpeg',
            hasFrameAnimation: false,
            totalFrames: 1,
            previewImages: [
                { src: '/angel.jpeg', caption: 'Front graphic detail — Angelic print' },
                { src: '/new-arrival-1.jpg', caption: 'Editorial drape & fit' },
                { src: '/new-arrival-3.jpg', caption: 'Street perspective & texture' },
            ],
            description: 'Premium cotton tee with an angelic graphic print. Relaxed fit with drop shoulders for effortless street style.',
            beats: {
                craft: {
                    label: '01 — Craftsmanship',
                    heading: 'Heavenly drape.<br>Engineered fit.',
                    body1: 'Crafted with premium combed 240GSM cotton. Double-needle sleeve and bottom hems ensure durability without compromising comfort.',
                    body2: 'High-density screen print with subtle metallic highlights that catch the light from every angle.'
                },
                design: {
                    label: '02 — Design',
                    heading: 'Ethereal yet<br>grounded.',
                    features: [
                        'Exclusive angelic motif designed in-house.',
                        'Relaxed drop-shoulder silhouette for an effortless modern drape.',
                        'Tonal stitching and custom woven collar label.'
                    ]
                },
                material: {
                    label: '03 — Material',
                    heading: 'Feather-soft,<br>heavyweight build.',
                    body1: 'Pre-shrunk ultra-fine combed cotton that stays soft and structured wear after wear.',
                    body2: 'Resistant to pilling and colour bleed. Designed to look pristine through every season.'
                },
                cta: {
                    heading: 'Ascend your<br>wardrobe.',
                    subheading: 'Angel SS26 edition. Premium streetwear created for those who stand out.'
                }
            },
            specs: {
                material: '100% Combed Heavyweight Cotton, 240GSM',
                fit: 'Relaxed drop-shoulder, unisex',
                print: 'High-density silk screen print with metallic accents',
                wash: 'Pre-shrunk, bio-washed for ultra-soft hand feel',
                edition: 'Limited drop, individually numbered tags',
                details: 'Ribbed collar, custom neck tape, woven side tab',
                care: 'Machine wash cold inside out, hang dry recommended',
                origin: 'Crafted with care, ethical premium manufacture'
            },
            colors: [
                { name: 'Onyx Black', hex: '#111111', active: true },
                { name: 'Pure White', hex: '#f5f5f5' },
                { name: 'Sky Tint', hex: '#cddde8' }
            ]
        },
        'neymar-tee': {
            id: 'neymar-tee',
            name: 'Neymar Tee',
            brand: 'NEYMAR',
            heroTitleHtml: 'NEYM<span class="accent">A</span>R',
            series: 'SS26 Icon Series',
            tagline: 'Ousadia e Alegria.',
            heroTagline: 'Unapologetic flair and Brazilian football heritage reimagined in iconic streetwear.',
            vol: 'Vol. III',
            price: '₹250.00',
            tag: 'Hot Item',
            remaining: 35,
            totalPieces: 150,
            image: '/neymar.jpeg',
            hasFrameAnimation: false,
            totalFrames: 1,
            previewImages: [
                { src: '/neymar.jpeg', caption: 'Front graphic detail — Neymar tribute' },
                { src: '/new-arrival-2.jpg', caption: 'Editorial silhouette & profile' },
                { src: '/new-arrival-4.jpg', caption: 'Street perspective & collar finish' },
            ],
            description: 'Bold oversized silhouette featuring an iconic Neymar-inspired design. Heavyweight 240gsm cotton.',
            beats: {
                craft: {
                    label: '01 — Craftsmanship',
                    heading: 'Iconic energy.<br>Uncompromising cut.',
                    body1: 'Engineered from 240GSM heavyweight breathable cotton with a dense weave that holds crisp street lines.',
                    body2: 'Vibrant graphic transfer with deep saturation that celebrates football culture and street identity.'
                },
                design: {
                    label: '02 — Design',
                    heading: 'Flair meets<br>boldness.',
                    features: [
                        'Dynamic tribute graphic capturing signature iconic flair.',
                        'Boxy oversized cut engineered for maximum movement and streetwear presence.',
                        'Custom signature patch and numbered certification label.'
                    ]
                },
                material: {
                    label: '03 — Material',
                    heading: 'Performance cotton<br>built for the streets.',
                    body1: 'Heavyweight jersey cotton featuring moisture-absorbent breathability.',
                    body2: 'Reinforced collar band that retains its shape wear after wear.'
                },
                cta: {
                    heading: 'Make your<br>statement.',
                    subheading: 'Limited Icon Drop. Once gone, this design will not be reproduced.'
                }
            },
            specs: {
                material: '100% Ring-Spun Heavyweight Cotton, 240GSM',
                fit: 'Boxy oversized silhouette, unisex',
                print: 'Vibrant multi-pass DTG print with high color fidelity',
                wash: 'Pre-washed against shrinking, silicone softened',
                edition: 'Icon Series limited to 150 units',
                details: 'Chunky 1-inch neck rib, custom jersey hem label',
                care: 'Machine wash warm, do not iron on print',
                origin: 'Designed for the bold, premium Portuguese manufacture'
            },
            colors: [
                { name: 'Pitch Black', hex: '#141414', active: true },
                { name: 'Canary Gold', hex: '#d4af37' },
                { name: 'Samba Green', hex: '#1e4d2b' }
            ]
        }
    };

    // ─── URL RESOLUTION ───
    function resolveProduct() {
        const urlParams = new URLSearchParams(window.location.search);
        const queryParam = urlParams.get('product') || urlParams.get('id') || urlParams.get('slug');

        if (queryParam) {
            const key = queryParam.toLowerCase().trim();
            if (PRODUCTS[key]) return PRODUCTS[key];
            if (key.includes('angel')) return PRODUCTS['angel-tee'];
            if (key.includes('neymar')) return PRODUCTS['neymar-tee'];
            if (key.includes('demon') || key.includes('red')) return PRODUCTS['demon-tee'];
        }

        // Custom parameters fallback
        if (urlParams.get('name')) {
            const name = urlParams.get('name');
            const price = urlParams.get('price') || '₹250.00';
            const img = urlParams.get('image') || urlParams.get('src') || '/hero-models.png';
            const desc = urlParams.get('desc') || 'Premium streetwear crafted for those who defy the ordinary.';
            return {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name: name,
                brand: name.toUpperCase().split(' ')[0] || 'BANNNED',
                heroTitleHtml: name.toUpperCase(),
                series: 'SS26 Collection',
                tagline: 'Defy the ordinary.',
                heroTagline: desc,
                vol: 'Edition',
                price: price,
                tag: 'Exclusive',
                remaining: 50,
                totalPieces: 200,
                image: img,
                hasFrameAnimation: false,
                totalFrames: 1,
                previewImages: [{ src: img, caption: name }],
                description: desc,
                beats: {
                    craft: {
                        label: '01 — Craftsmanship',
                        heading: 'Precision-cut.<br>Hand-finished.',
                        body1: 'Every stitch is intentional. Heavyweight premium cotton, enzyme-washed for a lived-in softness.',
                        body2: 'Engineered for street durability and high-definition graphic retention.'
                    },
                    design: {
                        label: '02 — Design',
                        heading: 'Art meets<br>rebellion.',
                        features: [
                            'Signature cut tailored for street silhouettes.',
                            'Limited quantity release worldwide.',
                            'Signature woven tags and labels.'
                        ]
                    },
                    material: {
                        label: '03 — Material',
                        heading: 'Built to<br>last forever.',
                        body1: 'Premium cotton construction with reinforced seams.',
                        body2: 'Shrink-proof and fade-proof for long-term wear.'
                    },
                    cta: {
                        heading: 'Own the<br>statement.',
                        subheading: 'Limited piece release. Once they are gone, they are gone.'
                    }
                },
                specs: {
                    material: '100% Heavyweight Cotton, 240GSM',
                    fit: 'Relaxed street fit, unisex',
                    print: 'High-density DTG print',
                    wash: 'Pre-washed for lasting softness',
                    edition: 'Limited release',
                    details: 'Woven neck label, hem tag',
                    care: 'Machine wash cold, iron inside out',
                    origin: 'Premium manufacture'
                },
                colors: [
                    { name: 'Black', hex: '#111111', active: true },
                    { name: 'Grey', hex: '#666666' },
                    { name: 'White', hex: '#f0f0f0' }
                ]
            };
        }

        // Default
        return PRODUCTS['demon-tee'];
    }

    const currentProduct = resolveProduct();

    // ─── CONFIGURATION ───
    const CONFIG = {
        totalFrames: currentProduct.hasFrameAnimation ? (currentProduct.totalFrames || 240) : 1,
        framePath: currentProduct.framePath || 't-shirt/ezgif-frame-',
        frameExt: currentProduct.frameExt || '.webp',
        initialBatch: 10,
        batchSize: 20,
        batchDelay: 120,
        beats: [
            { id: 'beat-1', start: 0.00, end: 0.15, peak: 0.07 },
            { id: 'beat-2', start: 0.14, end: 0.40, peak: 0.27 },
            { id: 'beat-3', start: 0.39, end: 0.65, peak: 0.52 },
            { id: 'beat-4', start: 0.64, end: 0.85, peak: 0.74 },
            { id: 'beat-5', start: 0.84, end: 1.00, peak: 0.92 },
        ],
    };

    // ─── STATE ───
    const state = {
        images: new Array(CONFIG.totalFrames).fill(null),
        singleImg: null,
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

    // ─── DOM POPULATION ───
    function populateProductDOM(p) {
        // Document head
        document.title = `${p.name} — Premium Dark Fashion | BANNNED`;
        const metaDesc = document.getElementById('meta-description');
        if (metaDesc) metaDesc.setAttribute('content', `${p.name} — ${p.description}`);

        // Navbar Brand
        const navBrand = document.getElementById('nav-brand-name');
        if (navBrand) navBrand.textContent = p.brand;

        // Hero Beat 1
        const overline = document.getElementById('hero-overline');
        if (overline) overline.textContent = p.series;

        const titleLine = document.getElementById('hero-title-line');
        if (titleLine) titleLine.innerHTML = p.heroTitleHtml;

        const subtitle = document.getElementById('hero-subtitle');
        if (subtitle) subtitle.textContent = p.tagline;

        const tagline = document.getElementById('hero-tagline');
        if (tagline) tagline.textContent = p.heroTagline;

        // Beat 2 (Craft)
        const b2Heading = document.getElementById('beat-2-heading');
        if (b2Heading) b2Heading.innerHTML = p.beats.craft.heading;
        const b2Body1 = document.getElementById('beat-2-body-1');
        if (b2Body1) b2Body1.textContent = p.beats.craft.body1;
        const b2Body2 = document.getElementById('beat-2-body-2');
        if (b2Body2) b2Body2.textContent = p.beats.craft.body2;

        // Beat 3 (Design)
        const b3Heading = document.getElementById('beat-3-heading');
        if (b3Heading) b3Heading.innerHTML = p.beats.design.heading;
        const b3Features = document.getElementById('beat-3-features');
        if (b3Features && p.beats.design.features) {
            b3Features.innerHTML = p.beats.design.features
                .map(feat => `
                    <div class="feature-item">
                        <span class="feature-dot"></span>
                        <p>${feat}</p>
                    </div>
                `).join('');
        }

        // Beat 4 (Material)
        const b4Heading = document.getElementById('beat-4-heading');
        if (b4Heading) b4Heading.innerHTML = p.beats.material.heading;
        const b4Body1 = document.getElementById('beat-4-body-1');
        if (b4Body1) b4Body1.textContent = p.beats.material.body1;
        const b4Body2 = document.getElementById('beat-4-body-2');
        if (b4Body2) b4Body2.textContent = p.beats.material.body2;

        // Beat 5 (CTA)
        const b5Heading = document.getElementById('beat-5-heading');
        if (b5Heading) b5Heading.innerHTML = p.beats.cta.heading;
        const b5Sub = document.getElementById('beat-5-subheading');
        if (b5Sub) b5Sub.textContent = p.beats.cta.subheading;
        const ctaPreorder = document.getElementById('cta-preorder');
        if (ctaPreorder) ctaPreorder.textContent = `Pre-order — ${p.price}`;

        // Collection section
        const colImg = document.getElementById('collection-img');
        if (colImg) {
            colImg.src = p.image;
            colImg.alt = `${p.name} front view`;
        }

        const colBadge = document.getElementById('collection-badge');
        if (colBadge) colBadge.innerHTML = p.tag.replace(' ', '<br>');

        const colTitle = document.getElementById('collection-product-title');
        if (colTitle) colTitle.innerHTML = `${p.name}<br><span class="accent-text">${p.vol}</span>`;

        const colPrice = document.getElementById('collection-product-price');
        if (colPrice) colPrice.innerHTML = `${p.price} <span class="price-note">Free worldwide shipping</span>`;

        const stockNote = document.getElementById('stock-note');
        if (stockNote) stockNote.textContent = `🔥 Only ${p.remaining} remaining in this drop`;

        // Color swatches
        const colorOptions = document.getElementById('color-options');
        if (colorOptions && p.colors) {
            colorOptions.innerHTML = p.colors.map(c => `
                <button class="color-swatch ${c.active ? 'active' : ''}" data-color="${c.name.toLowerCase()}" aria-label="${c.name}">
                    <span style="background: ${c.hex}"></span>
                </button>
            `).join('');
        }

        // Specifications
        const specMap = {
            'spec-material-val': p.specs.material,
            'spec-fit-val': p.specs.fit,
            'spec-print-val': p.specs.print,
            'spec-wash-val': p.specs.wash,
            'spec-edition-val': p.specs.edition,
            'spec-labels-val': p.specs.details,
            'spec-care-val': p.specs.care,
            'spec-origin-val': p.specs.origin,
        };
        Object.entries(specMap).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el && val) el.textContent = val;
        });

        // Lookbook
        const lookbookGrid = document.getElementById('lookbook-grid');
        if (lookbookGrid && p.previewImages && p.previewImages.length > 0) {
            lookbookGrid.innerHTML = p.previewImages.map((imgObj, idx) => `
                <div class="lookbook-item ${idx === 0 ? 'lookbook-large' : ''}" id="lookbook-${idx + 1}">
                    <img src="${imgObj.src}" alt="${p.name} preview ${idx + 1}" loading="lazy">
                    <div class="lookbook-caption">${imgObj.caption}</div>
                </div>
            `).join('');
        }

        // Final CTA
        const finalBody = document.getElementById('cta-body');
        if (finalBody) finalBody.textContent = `${p.totalPieces} pieces. Once they sell out, this design is retired forever. No restocks. No exceptions.`;
        const finalPreorder = document.getElementById('final-preorder');
        if (finalPreorder) finalPreorder.textContent = `Pre-order — ${p.price}`;

        // Footer brand
        const footerLogo = document.getElementById('footer-logo');
        if (footerLogo) footerLogo.innerHTML = `${p.brand}<span class="accent-text">.</span>`;
    }

    // ─── LOADING SCREEN ───
    function createLoadingScreen() {
        const loader = document.createElement('div');
        loader.className = 'loading-screen';
        loader.id = 'loading-screen';
        loader.innerHTML = `
            <div class="loading-logo">${currentProduct.brand}<span style="color: var(--accent-primary)">.</span></div>
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
                setTimeout(() => loader.remove(), 600);
            }, 300);
        }
    }

    // ─── IMAGE LOADING ───
    function getFramePath(index) {
        const num = String(index + 1).padStart(3, '0');
        return CONFIG.framePath + num + CONFIG.frameExt;
    }

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

    function loadRange(start, end) {
        const promises = [];
        for (let i = start; i < end && i < CONFIG.totalFrames; i++) {
            if (!state.images[i]) {
                promises.push(loadFrame(i));
            }
        }
        return Promise.all(promises);
    }

    async function loadInitialBatch() {
        if (!currentProduct.hasFrameAnimation) {
            // Load single image
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    state.singleImg = img;
                    updateLoadingProgress(100);
                    resolve();
                };
                img.onerror = () => {
                    resolve();
                };
                img.src = currentProduct.image;
            });
        }

        const n = Math.min(CONFIG.initialBatch, CONFIG.totalFrames);
        await loadRange(0, n);
        const pct = Math.round((n / CONFIG.totalFrames) * 100);
        updateLoadingProgress(pct);
    }

    async function loadRemainingBatches() {
        if (!currentProduct.hasFrameAnimation) {
            state.allLoaded = true;
            return;
        }

        const start = CONFIG.initialBatch;
        for (let i = start; i < CONFIG.totalFrames; i += CONFIG.batchSize) {
            const end = Math.min(i + CONFIG.batchSize, CONFIG.totalFrames);
            await loadRange(i, end);

            const pct = Math.round((state.loadedCount / CONFIG.totalFrames) * 100);
            updateLoadingProgress(pct);
            await new Promise((r) => setTimeout(r, CONFIG.batchDelay));
        }

        state.allLoaded = true;
    }

    // ─── CANVAS SETUP ───
    function setupCanvas() {
        state.canvas = document.getElementById('hero-canvas');
        if (!state.canvas) return;
        state.ctx = state.canvas.getContext('2d');
        state.heroSection = document.getElementById('hero');

        resizeCanvas();
        window.addEventListener('resize', debounce(resizeCanvas, 150));
        state.canvasReady = true;
    }

    function resizeCanvas() {
        if (!state.canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;

        state.canvas.width = w * dpr;
        state.canvas.height = h * dpr;
        state.canvas.style.width = w + 'px';
        state.canvas.style.height = h + 'px';
        state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const progress = getHeroScrollProgress();
        drawActiveView(progress);
    }

    // ─── FRAME / IMAGE RENDERING ───
    function drawActiveView(progress) {
        if (!state.canvasReady) return;

        if (currentProduct.hasFrameAnimation) {
            const frameIndex = Math.min(
                CONFIG.totalFrames - 1,
                Math.floor(progress * (CONFIG.totalFrames - 1))
            );
            drawFrameSequence(frameIndex);
        } else {
            drawSingleImage(progress);
        }
    }

    function drawFrameSequence(index) {
        let img = state.images[index];
        if (!img || !img.complete || img.naturalWidth === 0) {
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

    function drawSingleImage(progress) {
        const img = state.singleImg;
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const ctx = state.ctx;
        const cw = window.innerWidth;
        const ch = window.innerHeight;

        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, cw, ch);

        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = cw / ch;

        let baseW, baseH;
        if (canvasAspect > imgAspect) {
            baseH = ch * 0.76;
            baseW = baseH * imgAspect;
        } else {
            baseW = cw * 0.78;
            baseH = baseW / imgAspect;
        }

        // Smooth cinematic zoom and subtle parallax shift
        const zoom = 1.0 + Math.sin(progress * Math.PI) * 0.16;
        const drawW = baseW * zoom;
        const drawH = baseH * zoom;

        const panY = (0.5 - progress) * 35;
        const panX = Math.sin(progress * Math.PI * 1.5) * 12;

        const drawX = (cw - drawW) / 2 + panX;
        const drawY = (ch - drawH) / 2 + panY;

        // Radial ambient studio glow behind the garment
        const glowRadius = Math.max(drawW, drawH) * 0.65;
        const radial = ctx.createRadialGradient(
            cw / 2, ch / 2 + panY * 0.5, 30,
            cw / 2, ch / 2 + panY * 0.5, glowRadius
        );
        radial.addColorStop(0, 'rgba(220, 20, 60, 0.12)');
        radial.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
        radial.addColorStop(1, 'rgba(5, 5, 5, 0)');

        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(cw / 2, ch / 2 + panY * 0.5, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // High-end studio drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.70)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 24;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
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
        drawActiveView(progress);

        updateBeats(progress);
        updateNavbar(scrollY);
    }

    // ─── STORYTELLING BEATS ───
    function updateBeats(progress) {
        CONFIG.beats.forEach((beat) => {
            const el = document.getElementById(beat.id);
            if (!el) return;

            const fadeInStart = beat.start;
            const fadeInEnd = beat.start + (beat.peak - beat.start) * 0.5;
            const fadeOutStart = beat.peak + (beat.end - beat.peak) * 0.5;
            const fadeOutEnd = beat.end;

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

        // Add to Bag action feedback
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const activeSize = document.querySelector('.size-btn.active')?.dataset.size || 'L';
                const originalText = addToCartBtn.textContent;
                addToCartBtn.textContent = `Added (${activeSize}) to Bag ✓`;
                addToCartBtn.style.background = '#22c55e';
                addToCartBtn.style.color = '#fff';
                setTimeout(() => {
                    addToCartBtn.textContent = originalText;
                    addToCartBtn.style.background = '';
                    addToCartBtn.style.color = '';
                }, 2000);
            });
        }
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
        const navLinks = document.querySelectorAll('.nav-link, .mobile-link, #cta-preorder, #final-preorder, #nav-cta, #cta-details');
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
                        document.querySelectorAll('.nav-link').forEach((link) => {
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

        // 1. Populate dynamic product DOM
        populateProductDOM(currentProduct);

        // 2. Setup canvas & interactive elements
        setupCanvas();
        setupMobileMenu();
        setupSelectors();
        setupSmoothScroll();

        // 3. Load initial batch (or single image)
        await loadInitialBatch();

        // 4. Render initial view and show page
        drawActiveView(0);
        hideLoadingScreen();

        // 5. Attach scroll listeners and reveal observers
        window.addEventListener('scroll', onScroll, { passive: true });
        setupScrollReveal();
        processScroll();

        // 6. Background loader for remaining frames (if sequence)
        loadRemainingBatches();

        console.log(`[BANNNED] Loaded product: ${currentProduct.name} (${currentProduct.id})`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
