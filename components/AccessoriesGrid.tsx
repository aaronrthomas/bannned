'use client';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

const ACCESSORIES = [
    { src: '/product-caps.png', alt: 'Caps Collection', price: '$45.00', label: 'Caps' },
    { src: '/tote-bag.png', alt: 'Tote Bag', price: '$38.00', label: 'Bags' },
    { src: '/product-caps.png', alt: 'Accessories', price: '$52.00', label: 'Hats' },
];

export default function AccessoriesGrid() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section className="accessories-section" ref={ref}>
            <div className="accessories-grid">
                {ACCESSORIES.map((item, i) => (
                    <motion.div
                        key={item.label}
                        className="accessory-card"
                        initial={{ opacity: 0, y: 50 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <Image src={item.src} alt={item.alt} fill style={{ objectFit: 'cover' }} />
                        <span className="accessory-price">{item.price}</span>
                        <div className="accessory-overlay">
                            <button className="explore-btn">Explore</button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
