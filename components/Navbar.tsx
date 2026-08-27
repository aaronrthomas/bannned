'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const NAV_LINKS = ['Hoodies', 'Caps & Bags', 'Outwear', 'Jeans', 'Sale'];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            <motion.nav
                className={`navbar ${scrolled ? 'scrolled' : ''}`}
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Left: nav links (desktop) */}
                <ul className="navbar-links">
                    {NAV_LINKS.slice(0, 3).map((link) => (
                        <li key={link}>
                            <Link href="#">{link}</Link>
                        </li>
                    ))}
                </ul>

                {/* Center: logo */}
                <Link href="/" className="navbar-logo">BANNNED</Link>

                {/* Right: nav links + icons (desktop) + hamburger (mobile) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <ul className="navbar-links">
                        {NAV_LINKS.slice(3).map((link) => (
                            <li key={link}>
                                <Link href="#">{link}</Link>
                            </li>
                        ))}
                    </ul>
                    <div className="navbar-icons">
                        {/* Search */}
                        <button className="navbar-icon-btn" aria-label="Search">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                        </button>
                        {/* Cart */}
                        <button className="navbar-icon-btn" aria-label="Cart">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                        </button>
                    </div>

                    {/* Hamburger button — only visible on mobile via CSS */}
                    <button
                        className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
                        onClick={toggleMenu}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                    >
                        <span className="hamburger-line" />
                        <span className="hamburger-line" />
                        <span className="hamburger-line" />
                    </button>
                </div>
            </motion.nav>

            {/* Mobile nav overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        className="mobile-nav-overlay open"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        <ul className="mobile-nav-links">
                            {NAV_LINKS.map((link, i) => (
                                <motion.li
                                    key={link}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.05 + i * 0.06,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    <Link href="#" onClick={closeMenu}>{link}</Link>
                                </motion.li>
                            ))}
                        </ul>
                        <motion.div
                            className="mobile-nav-bottom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                        >
                            <a href="#">Instagram</a>
                            <a href="#">Twitter</a>
                            <a href="#">Telegram</a>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
