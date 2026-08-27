'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const HeroBackground3D = dynamic(() => import('./HeroBackground3D'), { ssr: false });

/* ─── BANNNED letter animation ───────────────────── */
const HERO_LETTERS = ['B', 'A', 'N', 'N', 'N', 'E', 'D'];

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

const letterVariants = {
    hidden: { y: '110%', opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.75, ease: 'easeOut' as const },
    },
};

const smoothConfig = { stiffness: 50, damping: 20, mass: 0.5 };

/* ─── Product cards ───────────────────────────────── */
const CARDS = [
    { src: '/hoodie-green.png', label: 'Forest Green Hoodie', price: '$89' },
    { src: '/hoodie-navy.png', label: 'Navy Essential', price: '$89' },
    { src: '/model-sweatshirt.png', label: 'Classic Sweatshirt', price: '$75' },
    { src: '/hero-models.png', label: 'New Arrivals', price: 'View All' },
    { src: '/product-caps.png', label: 'Signature Cap', price: '$45' },
    { src: '/tote-bag.png', label: 'Canvas Tote', price: '$35' },
    { src: '/new-arrival-1.jpg', label: 'Angel Graphic Tee', price: '$40' },
    { src: '/new-arrival-2.jpg', label: 'Spider N7 Oversized', price: '$45' },
    { src: '/new-arrival-3.jpg', label: 'Angel Long Sleeve', price: '$55' },
    { src: '/new-arrival-4.jpg', label: 'Spider Classic Tee', price: '$35' },
];

type PosCfg = { x: number; rotY: number; scale: number; opacity: number; zIndex: number };

function getPos(rel: number): PosCfg {
    const abs = Math.abs(rel);
    const sign = rel === 0 ? 1 : Math.sign(rel);
    if (abs === 0) return { x: 0,           rotY: 0,  scale: 1.00, opacity: 1.00, zIndex: 10 };
    if (abs === 1) return { x: sign * 255,  rotY: 0,  scale: 0.87, opacity: 0.86, zIndex: 8  };
    if (abs === 2) return { x: sign * 470,  rotY: 0,  scale: 0.72, opacity: 0.62, zIndex: 6  };
    return              { x: sign * 660,  rotY: 0,  scale: 0.58, opacity: 0.30, zIndex: 4  };
}

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);

    /* Mobile detect */
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 720);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    /* Slideshow — start on the "Classic Sweatshirt" card (index 2) to match design */
    const [center, setCenter] = useState(2);
    const N = CARDS.length;
    useEffect(() => {
        const t = setInterval(() => setCenter(p => (p + 1) % N), 3000);
        return () => clearInterval(t);
    }, [N]);

    /* Scroll-driven parallax */
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start'],
    });
    const smoothProgress = useSpring(scrollYProgress, smoothConfig);

    const xLeft = useTransform(smoothProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '-15%']);
    const xRight = useTransform(smoothProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '15%']);
    const textureY = useTransform(smoothProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '30%']);

    const [scroll3D, setScroll3D] = useState(0);
    useMotionValueEvent(smoothProgress, 'change', (v: number) => {
        if (!isMobile) setScroll3D(v);
    });

    return (
        <section className="hero-v2" ref={sectionRef}>

            {/* ── 3D floating wireframe shapes ── */}
            {!isMobile && <HeroBackground3D scrollProgress={scroll3D} />}

            {/* ── Noise / grain texture overlay ── */}
            <motion.div className="hero-v2-texture" style={{ y: textureY }} aria-hidden="true" />

            {/* ── Full-height outline BANNNED rows (parallax) ── */}
            <div className="hero-v2-banner-bg" aria-hidden="true">
                <motion.div className="hero-v2-outline-title" style={{ x: xLeft }}>
                    {HERO_LETTERS.map((char, i) => (
                        <span key={i} className="hero-v2-outline-letter">{char}</span>
                    ))}
                </motion.div>
                <motion.div className="hero-v2-outline-title" style={{ x: xRight }}>
                    {HERO_LETTERS.map((char, i) => (
                        <span key={i} className="hero-v2-outline-letter">{char}</span>
                    ))}
                </motion.div>
                <motion.div className="hero-v2-outline-title" style={{ x: xLeft }}>
                    {HERO_LETTERS.map((char, i) => (
                        <span key={i} className="hero-v2-outline-letter">{char}</span>
                    ))}
                </motion.div>
            </div>

            {/* ── Split content: left text · right carousel ── */}
            <div className="hero-v2-content">

                {/* LEFT — eyebrow + headline + CTA */}
                <motion.div
                    className="hero-v2-left"
                    initial={{ opacity: 0, x: -32 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.85, ease: 'easeOut', delay: 0.15 }}
                >
                    <span className="hero-v2-eyebrow">Only the Real Ones</span>

                    <h1 className="hero-v2-headline">
                        The Best Hoodies<br />Are Only Here.
                    </h1>

                    <p className="hero-v2-desc">
                        Timeless fits. Premium quality.<br />Made for the streets.
                    </p>

                    <button className="hero-v2-shopnow" id="hero-shop-now">
                        Shop Now <span aria-hidden="true">→</span>
                    </button>
                </motion.div>

                {/* RIGHT — fan carousel + dots */}
                <div className="hero-v2-right">
                    <div className="hero-v2-carousel-stage">
                        <div className="hero-fb-carousel">
                            {CARDS.map((card, i) => {
                                let rel = i - center;
                                if (rel > N / 2) rel -= N;
                                if (rel < -N / 2) rel += N;
                                if (Math.abs(rel) > 3) return null;

                                const pos = getPos(rel);

                                return (
                                    <motion.div
                                        key={i}
                                        className="hero-fb-card"
                                        animate={{
                                            x: pos.x,
                                            rotateY: pos.rotY,
                                            scale: pos.scale,
                                            opacity: pos.opacity,
                                        }}
                                        transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
                                        style={{ zIndex: pos.zIndex }}
                                        onClick={() => setCenter(i)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`View ${card.label}`}
                                    >
                                        <div className="hero-fb-card-inner">
                                            <Image
                                                src={card.src}
                                                alt={card.label}
                                                fill
                                                sizes="200px"
                                                className="hero-fb-card-img"
                                                unoptimized
                                            />
                                            {rel === 0 && (
                                                <motion.div
                                                    className="hero-fb-card-badge"
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.35, delay: 0.15 }}
                                                >
                                                    <span className="hero-fb-badge-name">{card.label}</span>
                                                    <span className="hero-fb-badge-price">{card.price}</span>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>


                </div>
            </div>

            {/* ── Bottom bar ── */}
            <div className="hero-v2-bottom">
                {/* Left: shipping / quality badges */}
                <motion.div
                    className="hero-v2-badges"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.9, ease: 'easeOut' }}
                >
                    <span className="hero-v2-badge-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                        Worldwide Shipping
                    </span>
                    <span className="hero-v2-badge-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        Premium Quality
                    </span>
                </motion.div>

                {/* Right: social links */}
                <motion.div
                    className="hero-v2-socials"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 1.1, ease: 'easeOut' }}
                >
                    {['Instagram', 'Telegram', 'Facebook', 'Twitter'].map((s) => (
                        <a key={s} href="#" className="hero-v2-social-link">{s}</a>
                    ))}
                </motion.div>
            </div>

        </section>
    );
}
