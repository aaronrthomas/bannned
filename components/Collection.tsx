'use client';
import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';

const FILTERS = ['Hoodie', 'Caps & Bags', 'Outwear', 'Jeans', 'Popular'];

const ALL_PRODUCTS = [
    { name: 'Classic Cream Hoodie', price: '$89.00', tag: 'New', src: '/hero-models.png', filter: 'Hoodie' },
    { name: 'Sage Green Oversized', price: '$94.00', tag: 'Hot', src: '/hoodie-green.png', filter: 'Hoodie' },
    { name: 'Navy Astro Hoodie', price: '$99.00', tag: 'Limited', src: '/hoodie-navy.png', filter: 'Hoodie' },
    { name: 'Five-Panel Cap', price: '$45.00', tag: 'New', src: '/product-caps.png', filter: 'Caps & Bags' },
    { name: 'Canvas Tote Bag', price: '$38.00', tag: 'Sale', src: '/tote-bag.png', filter: 'Caps & Bags' },
    { name: 'Mountain Sweatshirt', price: '$79.00', tag: 'New', src: '/model-sweatshirt.png', filter: 'Outwear' },
    { name: 'Athletic Runner', price: '$110.00', tag: 'Hot', src: '/hoodie-green.png', filter: 'Popular' },
    { name: 'Street Jeans', price: '$120.00', tag: 'New', src: '/hoodie-navy.png', filter: 'Jeans' },
];

export default function Collection() {
    const [activeFilter, setActiveFilter] = useState('Hoodie');
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    const filtered = ALL_PRODUCTS.filter(p => p.filter === activeFilter).slice(0, 4);

    return (
        <section className="collection-section" ref={ref}>
            <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
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
                animate={inView ? { opacity: 1, y: 0 } : {}}
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
                        className="product-card"
                        initial={{ opacity: 0, y: 50 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="product-image-wrap">
                            <Image src={product.src} alt={product.name} fill style={{ objectFit: 'cover' }} />
                            <span className="product-tag">{product.tag}</span>
                        </div>
                        <div className="product-name">{product.name}</div>
                        <div className="product-price">{product.price}</div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
