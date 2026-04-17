'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const HeroBackground3D = dynamic(() => import('./HeroBackground3D'), { ssr: false });

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

// Spring config for buttery-smooth scroll movement
const smoothConfig = { stiffness: 50, damping: 20, mass: 0.5 };

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);

    // Detect mobile (<720px) to disable scroll animations
    // Start as null so server + first client render are identical (no hydration mismatch)
    const [isMobile, setIsMobile] = useState<boolean | null>(null);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 720);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start'],
    });

    // Smooth the scroll progress itself first
    const smoothProgress = useSpring(scrollYProgress, smoothConfig);

    // Derive transforms — disabled on mobile (static '0%')
    const xLeft = useTransform(smoothProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '-15%']);
    const xRight = useTransform(smoothProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '15%']);
    const textureY = useTransform(smoothProgress, [0, 1], isMobile ? ['0%', '0%'] : ['0%', '30%']);

    // Track scroll progress as a number for Three.js (disabled on mobile)
    const [scroll3D, setScroll3D] = useState(0);
    useMotionValueEvent(smoothProgress, 'change', (v: number) => {
        if (!isMobile) setScroll3D(v);
    });

    return (
        <section className="hero-v2" ref={sectionRef}>
            {/* 3D background — floating wireframe shapes (hidden on mobile) */}
            {isMobile === false && <HeroBackground3D scrollProgress={scroll3D} />}

            {/* Noise texture overlay — moves with scroll */}
            <motion.div className="hero-v2-texture" style={{ y: textureY }} aria-hidden="true" />

            {/* Background: 2 outline title rows behind the image */}
            <div className="hero-v2-banner-bg" aria-hidden="true" style={{ marginTop: '250px' }}>
                {/* Outline row 1 — moves left */}
                <motion.div className="hero-v2-outline-title" style={{ x: xLeft }}>
                    {HERO_LETTERS.map((char, i) => (
                        <span key={i} className="hero-v2-outline-letter">{char}</span>
                    ))}
                </motion.div>

                {/* Outline row 2 — moves right */}
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

            {/* Giant filled title */}
            <div className="hero-v2-title-wrap" aria-hidden="true">
                <motion.div
                    className="hero-v2-title"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {HERO_LETTERS.map((char, i) => (
                        <motion.span key={i} className="hero-v2-letter" variants={letterVariants}>
                            {char}
                        </motion.span>
                    ))}
                </motion.div>
            </div>

            {/* Center image — the focal point */}
            <motion.div
                className="hero-v2-image-wrap"
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
            >
                <Image
                    src="/hero-models-dark 1.png"
                    alt="HOODIE models wearing premium streetwear"
                    width={820}
                    height={1020}
                    priority
                    unoptimized={true}
                    className="hero-v2-img"
                />

                {/* Floating CTA */}
                <motion.div
                    className="hero-v2-cta-block"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1, duration: 0.6, ease: 'easeOut' }}
                >
                    <span className="hero-v2-swipe">Swipe</span>
                    <div className="hero-v2-divider" />
                    <button className="hero-v2-discover">Discover Now</button>
                </motion.div>
            </motion.div>

            {/* Bottom bar */}
            <div className="hero-v2-bottom">
                <motion.p
                    className="hero-v2-tagline"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.9, ease: 'easeOut' }}
                >
                    The Best Hoodies Are Only Here
                </motion.p>

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
