'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';

export default function FullWinters() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section className="winters-section" ref={ref}>
            <motion.h2
                className="winters-title"
                initial={{ opacity: 0, y: 60 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
                Full Winters
            </motion.h2>

            <div className="winters-content">
                <motion.div
                    className="winters-image-wrap"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Image
                        src="/hoodie-green.png"
                        alt="Full winters collection hoodie"
                        width={600}
                        height={750}
                        style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                    />
                </motion.div>

                <motion.div
                    className="winters-text"
                    initial={{ opacity: 0, x: 60 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h3>A Fuller Full Winters</h3>
                    <p>
                        A fuller full winter ready piece. Crafted from premium heavyweight fleece, this season&apos;s edit brings warmth and style in equal measure. Every stitch designed to outlast the coldest days while keeping your look sharp.
                    </p>
                    <p style={{ marginBottom: '2rem' }}>
                        Limited production runs ensure exclusivity. Once they&apos;re gone, they&apos;re gone.
                    </p>
                    <button className="btn-outlined">
                        New Collection // Limited Edition
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
