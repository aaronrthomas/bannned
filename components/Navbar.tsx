'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useCart } from '@/lib/cartContext';

const NAV_LINKS = ['Hoodies', 'Caps & Bags', 'Outwear', 'Jeans', 'Sale'];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const { user, bannedUser, signOutUser } = useAuth();
    const { totalItems, openCart } = useCart();

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

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleMenu = () => setMenuOpen((prev) => !prev);
    const closeMenu = () => setMenuOpen(false);

    const displayName = bannedUser?.fullName || bannedUser?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Guest';
    const avatarLetter = displayName.charAt(0).toUpperCase();
    const photoURL = bannedUser?.photoURL || user?.photoURL;

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
                        <button
                            id="navbar-cart-btn"
                            className="navbar-icon-btn"
                            aria-label={`Cart with ${totalItems} items`}
                            onClick={openCart}
                            style={{ position: 'relative' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                            {totalItems > 0 && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        background: '#c8b89a',
                                        color: '#0a0c10',
                                        fontSize: '0.62rem',
                                        fontWeight: 900,
                                        minWidth: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 2px',
                                        border: '1px solid #0c0e14',
                                        boxShadow: '0 0 8px rgba(200, 184, 154, 0.6)',
                                    }}
                                >
                                    {totalItems > 99 ? '99+' : totalItems}
                                </span>
                            )}
                        </button>

                        {/* ─── AUTH BUTTON ─────────────────────────────────── */}
                        {user ? (
                            <div ref={userMenuRef} style={{ position: 'relative' }}>
                                <button
                                    id="navbar-user-avatar"
                                    onClick={() => setUserMenuOpen(p => !p)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'rgba(200,184,154,0.1)',
                                        border: '1px solid rgba(200,184,154,0.3)',
                                        borderRadius: '24px',
                                        padding: '4px 12px 4px 4px',
                                        cursor: 'pointer',
                                        color: '#c8b89a',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.4px',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {photoURL ? (
                                        <img
                                            src={photoURL}
                                            alt={displayName}
                                            style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div style={{
                                            width: 26, height: 26, borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #c8b89a, #8a7a5a)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, color: '#07070d'
                                        }}>
                                            {avatarLetter}
                                        </div>
                                    )}
                                    <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {displayName.split(' ')[0]}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 10px)',
                                                right: 0,
                                                minWidth: 200,
                                                background: 'rgba(14, 14, 22, 0.96)',
                                                border: '1px solid rgba(255,255,255,0.09)',
                                                borderRadius: 12,
                                                backdropFilter: 'blur(20px)',
                                                overflow: 'hidden',
                                                zIndex: 1000,
                                                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                                            }}
                                        >
                                            {/* User Info */}
                                            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e0e0e0' }}>{displayName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#5a5a6a', marginTop: 2 }}>
                                                    {user.email || user.phoneNumber || 'Connected'}
                                                </div>
                                                {!bannedUser?.profileComplete && (
                                                    <div style={{
                                                        marginTop: 8,
                                                        fontSize: '0.72rem',
                                                        color: '#f59e0b',
                                                        background: 'rgba(245,158,11,0.1)',
                                                        borderRadius: 6,
                                                        padding: '4px 8px',
                                                        display: 'inline-block'
                                                    }}>
                                                        ⚠ Profile incomplete
                                                    </div>
                                                )}
                                            </div>
                                            {/* Menu Items */}
                                            {[
                                                { label: '👤 My Profile', href: '/auth/complete' },
                                                { label: '📦 My Orders', href: '#' },
                                                { label: '⭐ Loyalty Points', href: '#' },
                                            ].map((item) => (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    style={{
                                                        display: 'block',
                                                        padding: '10px 16px',
                                                        fontSize: '0.85rem',
                                                        color: '#c0c0d0',
                                                        textDecoration: 'none',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                <button
                                                    onClick={() => { setUserMenuOpen(false); signOutUser(); }}
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        padding: '10px 16px',
                                                        fontSize: '0.85rem',
                                                        color: '#f87171',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontFamily: 'inherit',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    🚪 Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                href="/auth"
                                id="navbar-login-btn"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 14px',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(200, 184, 154, 0.4)',
                                    background: 'rgba(200, 184, 154, 0.08)',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.5px',
                                    color: '#c8b89a',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                                Sign In
                            </Link>
                        )}
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
                            <motion.li
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5, delay: 0.32 }}
                            >
                                <button
                                    onClick={() => { closeMenu(); openCart(); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <span>Shopping Bag {totalItems > 0 ? `(${totalItems})` : ''}</span>
                                </button>
                            </motion.li>
                            <motion.li
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5, delay: 0.38 }}
                            >
                                {user ? (
                                    <button onClick={() => { closeMenu(); signOutUser(); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit' }}>
                                        Sign Out
                                    </button>
                                ) : (
                                    <Link href="/auth" onClick={closeMenu}>Sign In / Join</Link>
                                )}
                            </motion.li>
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
