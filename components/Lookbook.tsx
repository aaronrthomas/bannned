'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';

const LOOKS = [
    {
        num: '01',
        category: 'Sweatshirt',
        desc: 'Heavyweight brushed-fleece interior for ultimate comfort. Available in 8 colorways and oversized silhouette.',
        price: '$79.00',
        src: '/model-sweatshirt.png',
        fromLeft: true,
    },
    {
        num: '02',
        category: 'Athletic',
        desc: 'Technical performance fabric meets street aesthetic. Moisture-wicking, 4-way stretch, built to move.',
        price: '$94.00',
        src: '/hoodie-navy.png',
        fromLeft: false,
    },
];

export default function Lookbook() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section className="lookbook-section" ref={ref}>
            <div className="lookbook-grid">
                {LOOKS.map((look, i) => (
                    <motion.div
                        key={look.num}
                        className="lookbook-item"
                        initial={{ opacity: 0, x: look.fromLeft ? -60 : 60 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <span className="lookbook-number">{look.num}</span>
                        <Image
                            className="lookbook-image"
                            src={look.src}
                            alt={look.category}
                            width={600}
                            height={800}
                            style={{ objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '3/4' }}
                        />
                        <div className="lookbook-info">
                            <div className="lookbook-category">{look.category}</div>
                            <p className="lookbook-desc">{look.desc}</p>
                            <div className="lookbook-price">{look.price}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
