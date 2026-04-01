'use client';
import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setSubmitted(true);
            setEmail('');
        }
    };

    return (
        <section className="newsletter-section" ref={ref}>
            <motion.h2
                className="newsletter-title"
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
                Subscribe to Our
                <br />Newsletter
            </motion.h2>

            <motion.p
                className="newsletter-sub"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 }}
            >
                Get early access to new drops, exclusive offers, and style inspiration.
            </motion.p>

            <motion.form
                className="newsletter-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.35 }}
            >
                {submitted ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', letterSpacing: '0.1em', padding: '1rem' }}
                    >
                        ✓ You&apos;re in! Check your inbox soon.
                    </motion.div>
                ) : (
                    <>
                        <input
                            type="email"
                            className="newsletter-input"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            id="newsletter-email"
                        />
                        <button type="submit" className="newsletter-submit">Subscribe</button>
                    </>
                )}
            </motion.form>
        </section>
    );
}
