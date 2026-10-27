'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Image from 'next/image';
import CheckoutModal from './CheckoutModal';
import { useCart } from '@/lib/cartContext';
import type { Product } from '@/lib/types';

const FILTERS = ['White', 'Black', 'Grey', 'Blue', 'Popular'];

const ALL_PRODUCTS: Product[] = [
    {
        id: 'angel-tee',
        name: 'Angel Tee',
        price: 'u{20B9}250.00',
        badge: { text: 'NEW', bg: '#274724' },
        src: '/angel.jpeg',
        category: 'tees',
        description: 'Premium cotton tee with an angelic graphic print. Relaxed fit with drop shoulders for effortless street style.',
        tags: [
            { text: 'NEW', iconBefore: true },
            { text: 'OVERSIZED FIT' },
        ],
        filters: ['White', 'Black', 'Grey', 'Popular'],
        specs: { gsm: '240 GSM', fit: 'Relaxed Drop-Shoulder', material: '100% Combed Heavyweight Cotton' },
        hyperlink: '/pages/demon/index.html?product=angel-tee',
        sku: 'ANGEL-TEE-001',
        stock: 50,
        totalPieces: 50,
        status: 'active',
    },
    {
        id: 'neymar-tee',
        name: 'Neymar Tee',
        price: 'u{20B9}250.00',
        badge: { text: 'HOT', bg: '#BA4C16' },
        src: '/neymar.jpeg',
        category: 'tees',
        description: 'Bold oversized silhouette featuring an iconic Neymar-inspired design. Heavyweight 240gsm cotton.',
        tags: [
            { text: 'HOT' },
            { text: '240 GSM' },
        ],
        filters: ['White', 'Black', 'Blue', 'Popular'],
        specs: { gsm: '240 GSM', fit: 'Oversized Boxy Silhouette', material: '100% Heavyweight Cotton' },
        hyperlink: '/pages/demon/index.html?product=neymar-tee',
        sku: 'NEYMAR-TEE-001',
        stock: 50,
        totalPieces: 50,
        status: 'active',
    },
    {
        id: 'demon-tee',
        name: 'Demon Tee',
        price: 'u{20B9}250.00',
        badge: { text: 'LIMITED', bg: '#821515' },
        src: '/red.jpeg',
        category: 'tees',
        description: 'Limited edition dark-themed graphic tee. Screen-printed artwork on premium red-washed fabric.',
        tags: [
            { text: 'LIMITED', iconAfter: true },
            { text: 'RED-WASHED' },
        ],
        filters: ['White', 'Black', 'Grey', 'Popular'],
        specs: { gsm: '280 GSM', fit: 'Oversized Drop-Cut Unisex', material: '100% Japanese Combed Cotton' },
        hyperlink: '/pages/demon/index.html?product=demon-tee',
        sku: 'DEMON-TEE-001',
        stock: 20,
        totalPieces: 20,
        status: 'active',
    },
]

// Clean Price Tag SVG Icon
function TagIcon() {
    return (
        <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
        >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
    );
}

// Plus Icon
function PlusIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

// Heart / Wishlist Icon
function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={filled ? '#E53E3E' : 'none'}
            stroke={filled ? '#E53E3E' : 'currentColor'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'transform 0.2s ease, fill 0.2s ease, stroke 0.2s ease' }}
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );
}

// Right Arrow Icon
function ArrowIcon() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="buy-arrow-icon"
        >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>
    );
}

// Close Icon
function CloseIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

// Shopping Bag Icon
function BagIcon() {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    );
}

export default function Collection() {
    const { addToCart } = useCart();
    const [activeFilter, setActiveFilter] = useState('White');
    const [liked, setLiked] = useState<Record<string, boolean>>({});
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>(ALL_PRODUCTS);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    useEffect(() => {
        setMounted(true);
        fetch('/api/products')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.products) && data.products.length > 0) {
                    setProducts(data.products);
                }
            })
            .catch(() => {
                // Fallback to local default array
            });
    }, []);

    // Close modal on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setQuickViewProduct(null);
                setCheckoutProduct(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleWishlist = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleQuickView = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setQuickViewProduct(product);
    };

    // Filter products based on selected tab and dynamically sort by admin bonusPoints (highest first)
    const filtered = products.filter((p) => p.filters && p.filters.includes(activeFilter));
    const baseList = filtered.length > 0 ? filtered : products;
    const displayProducts = [...baseList].sort((a, b) => (b.bonusPoints || 0) - (a.bonusPoints || 0));

    return (
        <section id="collection" className="collection-section" ref={ref}>
            <div className="collection-container">
                {/* ── HEADER ROW ── */}
                <div className="collection-header">
                    <motion.div
                        className="collection-header-text"
                        initial={{ opacity: 0, y: 30 }}
                        animate={mounted && inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="collection-eyebrow">COLLECTION</p>
                        <h2 className="collection-main-title">Graphic Tees</h2>
                        <p className="collection-header-subtitle">
                            Statement pieces for everyday wear. Designed to stand out.
                        </p>
                    </motion.div>

                    <motion.div
                        className="collection-filters-row"
                        initial={{ opacity: 0, y: 20 }}
                        animate={mounted && inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                type="button"
                                className={`collection-filter-btn ${activeFilter.toLowerCase() === f.toLowerCase() ? 'active' : ''}`}
                                onClick={() => setActiveFilter(f)}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </motion.div>
                </div>

                {/* ── PRODUCTS 3-COLUMN GRID ── */}
                <motion.div
                    className="collection-grid"
                    layout
                    initial={{ opacity: 0 }}
                    animate={mounted && inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <AnimatePresence mode="popLayout">
                        {displayProducts.map((product, i) => {
                            const isLiked = !!liked[product.id];
                            return (
                                <motion.div
                                    key={product.id}
                                    className="collection-card"
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: i * 0.08,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    {/* Image visual wrapper */}
                                    <div
                                        className="card-image-box"
                                        onClick={() => {
                                            window.location.href = product.hyperlink + '#collection';
                                        }}
                                    >
                                        <Image
                                            src={product.src}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            priority={i === 0}
                                        />

                                        {/* Status Badge (NEW / HOT / LIMITED) */}
                                        <span
                                            className="card-badge-tag"
                                            style={{ backgroundColor: product.badge.bg }}
                                        >
                                            {product.badge.text}
                                        </span>

                                        {/* Bonus Points Badge if set by admin */}
                                        {product.bonusPoints !== undefined && product.bonusPoints > 0 && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '12px',
                                                    left: '12px',
                                                    background: 'rgba(0, 0, 0, 0.75)',
                                                    backdropFilter: 'blur(4px)',
                                                    border: '1px solid rgba(245, 158, 11, 0.5)',
                                                    color: '#f59e0b',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    zIndex: 3,
                                                }}
                                            >
                                                ★ {product.bonusPoints} PTS
                                            </span>
                                        )}

                                        {/* Quick View "+" Circle Button */}
                                        <button
                                            type="button"
                                            className="card-plus-btn"
                                            onClick={(e) => handleQuickView(product, e)}
                                            aria-label={`Quick view ${product.name}`}
                                        >
                                            <PlusIcon />
                                        </button>
                                    </div>

                                    {/* Product Details */}
                                    <div className="card-details">
                                        {/* Title & Price */}
                                        <div className="card-title-price-row">
                                            <a
                                                href={product.hyperlink + '#collection'}
                                                className="card-product-title"
                                            >
                                                {product.name}
                                            </a>
                                            <span className="card-product-price">{product.price}</span>
                                        </div>

                                        {/* Description */}
                                        <p className="card-product-desc">{product.description}</p>

                                        {/* Tags Pill Row */}
                                        <div className="card-tags-list">
                                            {product.tags.map((tag, tIdx) => (
                                                <span key={tIdx} className="card-tag-pill">
                                                    {tag.iconBefore && <TagIcon />}
                                                    <span>{tag.text}</span>
                                                    {tag.iconAfter && <TagIcon />}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Actions: Buy Now, Add to Cart & Wishlist */}
                                        <div className="card-actions-row">
                                            <button
                                                type="button"
                                                className="card-buy-button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setCheckoutProduct(product);
                                                }}
                                                aria-label={`Buy ${product.name} now via Razorpay`}
                                            >
                                                <span>Buy Now</span>
                                                <ArrowIcon />
                                            </button>

                                            <button
                                                type="button"
                                                className="card-cart-button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    addToCart(product, 'L', 1);
                                                }}
                                                aria-label={`Add ${product.name} to shopping bag`}
                                                title="Add to Shopping Bag"
                                            >
                                                <BagIcon />
                                            </button>

                                            <button
                                                type="button"
                                                className={`card-wishlist-button ${isLiked ? 'active' : ''}`}
                                                onClick={(e) => toggleWishlist(product.id, e)}
                                                aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                                            >
                                                <HeartIcon filled={isLiked} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ── QUICK VIEW MODAL ── */}
            <AnimatePresence>
                {quickViewProduct && (
                    <motion.div
                        className="quickview-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setQuickViewProduct(null)}
                    >
                        <motion.div
                            className="quickview-modal"
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="quickview-close-btn"
                                onClick={() => setQuickViewProduct(null)}
                                aria-label="Close quick view"
                            >
                                <CloseIcon />
                            </button>

                            <div className="quickview-visual">
                                <Image
                                    src={quickViewProduct.src}
                                    alt={quickViewProduct.name}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                                <span
                                    className="card-badge-tag"
                                    style={{ backgroundColor: quickViewProduct.badge.bg }}
                                >
                                    {quickViewProduct.badge.text}
                                </span>
                            </div>

                            <div className="quickview-info">
                                <p className="collection-eyebrow">BANNNED APPAREL</p>
                                <h3 className="quickview-title">{quickViewProduct.name}</h3>
                                <p className="quickview-price">{quickViewProduct.price}</p>
                                <div className="quickview-divider" />
                                <p className="quickview-desc">{quickViewProduct.description}</p>

                                <div className="quickview-specs-box">
                                    <div className="spec-row">
                                        <span className="spec-label">Weight</span>
                                        <span className="spec-val">{quickViewProduct.specs.gsm}</span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Silhouette</span>
                                        <span className="spec-val">{quickViewProduct.specs.fit}</span>
                                    </div>
                                    <div className="spec-row">
                                        <span className="spec-label">Fabric</span>
                                        <span className="spec-val">{quickViewProduct.specs.material}</span>
                                    </div>
                                </div>

                                <div className="card-tags-list" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                                    {quickViewProduct.tags.map((tag, tIdx) => (
                                        <span key={tIdx} className="card-tag-pill">
                                            {tag.iconBefore && <TagIcon />}
                                            <span>{tag.text}</span>
                                            {tag.iconAfter && <TagIcon />}
                                        </span>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '0.65rem', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '4px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(200, 184, 154, 0.4)',
                                            color: '#c8b89a',
                                            fontWeight: 700,
                                            fontSize: '0.82rem',
                                            letterSpacing: '0.5px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onClick={() => {
                                            addToCart(quickViewProduct, 'L', 1);
                                            setQuickViewProduct(null);
                                        }}
                                    >
                                        <BagIcon />
                                        <span>Add to Cart</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="card-buy-button"
                                        style={{ width: '100%', cursor: 'pointer' }}
                                        onClick={() => {
                                            const p = quickViewProduct;
                                            setQuickViewProduct(null);
                                            setCheckoutProduct(p);
                                        }}
                                    >
                                        <span>Buy Now — {quickViewProduct.price}</span>
                                        <ArrowIcon />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── RAZORPAY CHECKOUT MODAL ── */}
            <CheckoutModal
                isOpen={!!checkoutProduct}
                onClose={() => setCheckoutProduct(null)}
                product={checkoutProduct}
            />
        </section>
    );
}
