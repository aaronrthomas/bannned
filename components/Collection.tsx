'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';

const FILTERS = ['White', 'Black', 'Grey', 'Blue', 'Popular'];

const ALL_PRODUCTS = [
    {
        name: 'Angel Tee',
        price: '₹250.00',
        tag: 'New',
        src: '/angel.jpeg',
        filter: 'Black',
        description: 'Premium cotton tee with an angelic graphic print. Relaxed fit with drop shoulders for effortless street style.',
        hyperlink: '/products/angel-tee',
    },
    {
        name: 'Neymar Tee',
        price: '₹250.00',
        tag: 'Hot',
        src: '/neymar.jpeg',
        filter: 'Black',
        description: 'Bold oversized silhouette featuring an iconic Neymar-inspired design. Heavyweight 240gsm cotton.',
        hyperlink: '/products/neymar-tee',
    },
    {
        name: 'Demon Tee',
        price: '₹250.00',
        tag: 'Limited',
        src: '/red.jpeg',
        filter: 'Black',
        description: 'Limited edition dark-themed graphic tee. Screen-printed artwork on premium red-washed fabric.',
        hyperlink: '/pages/demon/index.html',
    },
];

export default function Collection() {
    const [activeFilter, setActiveFilter] = useState('Hoodie');
    const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    useEffect(() => { setMounted(true); }, []);

    const filtered = ALL_PRODUCTS.filter(p => p.filter === activeFilter).slice(0, 4);

    const toggleFlip = (name: string) => {
        setFlippedCards(prev => ({ ...prev, [name]: !prev[name] }));
    };

    return (
        <section className="collection-section" ref={ref}>
            <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 40 }}
                animate={mounted && inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                <h2 className="section-title">Our Collection</h2>
                <p className="section-subtitle">
                    Discover our curated selection of premium streetwear. Quality craftsmanship and unique designs for the modern wardrobe.
                </p>
            </motion.div>

            <motion.div
                className="collection-filters"
                initial={{ opacity: 0, y: 20 }}
                animate={mounted && inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                        onClick={() => setActiveFilter(f)}
                    >
                        {f}
                    </button>
                ))}
            </motion.div>

            <div className="products-grid">
                {(filtered.length > 0 ? filtered : ALL_PRODUCTS.slice(0, 4)).map((product, i) => (
                    <motion.div
                        key={product.name}
                        className="flip-card-wrapper"
                        initial={{ opacity: 0, y: 50 }}
                        animate={mounted && inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div
                            className={`flip-card ${flippedCards[product.name] ? 'flipped' : ''}`}
                            onClick={() => toggleFlip(product.name)}
                        >
                            {/* ── FRONT ── */}
                            <div className="flip-card-front">
                                <div className="product-image-wrap">
                                    <Image src={product.src} alt={product.name} fill style={{ objectFit: 'cover' }} />
                                    <span className="product-tag">{product.tag}</span>
                                </div>
                                <div className="product-info-front">
                                    <div className="product-name">{product.name}</div>
                                    <div className="product-price">{product.price}</div>
                                </div>
                                <div className="flip-hint">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 1l4 4-4 4" />
                                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                        <path d="M7 23l-4-4 4-4" />
                                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                    </svg>
                                    <span>Tap to flip</span>
                                </div>
                            </div>

                            {/* ── BACK ── */}
                            <div className="flip-card-back">
                                <div className="flip-back-content">
                                    <span className="flip-back-tag">{product.tag}</span>
                                    <h3 className="flip-back-name">{product.name}</h3>
                                    <div className="flip-back-divider" />
                                    <p className="flip-back-desc">{product.description}</p>
                                    <div className="flip-back-price">{product.price}</div>
                                    <button
                                        className="flip-buy-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // handle buy logic
                                        }}
                                    >
                                        Buy Now
                                    </button>
                                    <a
                                        href={product.hyperlink}
                                        className="flip-more-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        More Details →
                                    </a>
                                </div>
                                <div className="flip-hint flip-hint-back">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 1l4 4-4 4" />
                                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                        <path d="M7 23l-4-4 4-4" />
                                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                    </svg>
                                    <span>Tap to flip back</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
