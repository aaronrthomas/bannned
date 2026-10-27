'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    X,
    AlertCircle,
    Search,
    User as UserIcon,
    ShoppingCart,
    Plus,
    ShoppingBag,
} from 'lucide-react';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { useCart } from '@/lib/cartContext';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onOrderComplete?: (orderId: string) => void;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutModal({
    isOpen,
    onClose,
    product,
    onOrderComplete,
}: CheckoutModalProps) {
    const { user, bannedUser } = useAuth();
    const { addToCart, openCart } = useCart();
    const isLoggedIn = Boolean(user);

    // Order item configuration
    const [size, setSize] = useState('L');
    const [quantity, setQuantity] = useState(1);
    const [activeThumb, setActiveThumb] = useState(0);

    // Payment Form state matching the Duvera mockup
    const [cardholderName, setCardholderName] = useState('');
    const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
    const [expMonth, setExpMonth] = useState('12');
    const [expYear, setExpYear] = useState('28');
    const [cvv, setCvv] = useState('888');

    // Customer contact (for Razorpay backend order verification)
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successOrder, setSuccessOrder] = useState<{
        orderId: string;
        paymentId: string;
        amount: number;
    } | null>(null);

    // Interactive image rollover zoom state
    const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Compute resolved customer details from auth
    const resolvedAuthName =
        bannedUser?.fullName ||
        bannedUser?.displayName ||
        user?.displayName ||
        user?.email?.split('@')[0] ||
        '';
    const resolvedAuthEmail =
        bannedUser?.email ||
        user?.email ||
        (user?.phoneNumber ? `${user.phoneNumber.replace(/[^0-9]/g, '')}@bannned.store` : '');
    const resolvedAuthPhone = bannedUser?.phone || user?.phoneNumber || '';

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSuccessOrder(null);
            setQuantity(1);
            setActiveThumb(0);
            if (user) {
                setCardholderName(resolvedAuthName || 'Store Customer');
                setEmail(resolvedAuthEmail);
                setPhone(resolvedAuthPhone);
            } else {
                setCardholderName('');
                setEmail('');
                setPhone('');
            }
        }
    }, [isOpen, user, bannedUser, resolvedAuthName, resolvedAuthEmail, resolvedAuthPhone]);

    if (!isOpen || !product) return null;

    // Numeric price extraction
    const unitPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 250;
    const totalAmount = unitPrice * quantity;
    const subtotal = Math.round(totalAmount * 0.79);
    const vat = totalAmount - subtotal;
    const bonusPointsEarned = (product.bonusPoints || 50) * quantity;

    // Thumbnails for the left vertical strip (4 angles/views + plus button)
    const thumbnails = [
        { id: 0, label: 'Front Silhouette', crop: 'center' },
        { id: 1, label: 'Upper Chest & Print', crop: 'center 20%' },
        { id: 2, label: 'Hem & Fabric Texture', crop: 'center 80%' },
        { id: 3, label: 'Back & Silhouette', crop: 'top' },
    ];

    // Image rollover zoom handler
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setZoom({ x, y, active: true });
    };

    const handleMouseLeave = () => {
        setZoom((prev) => ({ ...prev, active: false }));
    };

    // Load Razorpay script
    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (typeof window !== 'undefined' && window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const finalName = (cardholderName || resolvedAuthName || 'Store Customer').trim();
        const finalEmail = (email || resolvedAuthEmail || 'guest@bannned.store').trim();
        const finalPhone = (phone || resolvedAuthPhone || '').trim();

        if (!finalName) {
            setError('Please provide a Cardholder Name.');
            return;
        }

        try {
            setLoading(true);

            // 1. Create order on server
            const orderRes = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalAmount,
                    customerName: finalName,
                    customerEmail: finalEmail,
                    customerPhone: finalPhone,
                    items: [
                        {
                            productId: product.id,
                            productName: `${product.name} (${size})`,
                            price: unitPrice,
                            quantity,
                            bonusPoints: product.bonusPoints || 0,
                        },
                    ],
                }),
            });

            const orderData = await orderRes.json();

            if (!orderData.success) {
                throw new Error(orderData.error || 'Failed to initialize payment checkout');
            }

            // Simulated sandbox test mode
            if (orderData.isSimulated) {
                await new Promise((r) => setTimeout(r, 850));
                const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 10)}`;

                const verifyRes = await fetch('/api/razorpay/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: orderData.razorpayOrderId,
                        razorpay_payment_id: mockPaymentId,
                        razorpay_signature: 'simulated_signature_valid',
                        customerEmail: finalEmail,
                        method: 'credit_card',
                    }),
                });

                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                    setSuccessOrder({
                        orderId: orderData.orderId,
                        paymentId: mockPaymentId,
                        amount: totalAmount,
                    });
                    if (onOrderComplete) onOrderComplete(orderData.orderId);
                } else {
                    throw new Error(verifyData.error || 'Payment verification failed');
                }
                setLoading(false);
                return;
            }

            // Live Razorpay SDK
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Razorpay SDK failed to load. Please verify your internet connection.');
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: orderData.companyName || 'BANNNED',
                description: `${product.name} — ${quantity}x Size ${size}`,
                image: orderData.companyLogo || product.src,
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: finalName,
                    email: finalEmail,
                    contact: finalPhone,
                },
                theme: {
                    color: '#f59e0b',
                    backdrop_color: 'rgba(10, 12, 16, 0.95)',
                },
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch('/api/razorpay/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                customerEmail: finalEmail,
                                method: 'razorpay_standard',
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyData.success) {
                            setSuccessOrder({
                                orderId: orderData.orderId,
                                paymentId: response.razorpay_payment_id,
                                amount: totalAmount,
                            });
                            if (onOrderComplete) onOrderComplete(orderData.orderId);
                        } else {
                            setError('Payment signature verification failed.');
                        }
                    } catch {
                        setError('Failed to verify payment with server.');
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                setError(response.error?.description || 'Payment was declined.');
                setLoading(false);
            });
            rzp.open();
        } catch (err: any) {
            setError(err.message || 'Payment initiation failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    backgroundColor: 'rgba(0, 0, 0, 0.78)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                }}
                onClick={onClose}
            >
                {/* ─── MAIN FROSTED GLASS CARD (DUVERA STYLE) ─── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 15 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '940px',
                        borderRadius: '26px',
                        background:
                            'radial-gradient(ellipse at 25% 45%, rgba(245, 158, 11, 0.16) 0%, rgba(200, 184, 154, 0.04) 45%, transparent 70%), rgba(26, 25, 27, 0.88)',
                        backdropFilter: 'blur(36px) saturate(190%)',
                        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow:
                            '0 30px 80px -10px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
                        color: '#f4f4f5',
                        overflow: 'hidden',
                        fontFamily: 'inherit',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── TOP HEADER BAR ── */}
                    <div
                        style={{
                            padding: '1.25rem 2rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* Brand Logo & Subtitle */}
                        <div>
                            <div
                                style={{
                                    fontSize: '1.45rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.3px',
                                    color: '#ffffff',
                                    lineHeight: 1.1,
                                    fontFamily: 'var(--font-heading), "Space Grotesk", sans-serif',
                                }}
                            >
                                BANNNED
                            </div>
                            <span
                                style={{
                                    fontSize: '0.72rem',
                                    color: '#a1a1aa',
                                    fontWeight: 400,
                                    letterSpacing: '0.2px',
                                }}
                            >
                                Ecommerce Store
                            </span>
                        </div>

                        {/* Right Action Pills (Search, User, Cart, Close) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {/* Search Pill */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: '20px',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    color: '#a1a1aa',
                                    fontSize: '0.78rem',
                                }}
                            >
                                <Search size={14} />
                                <span>Search</span>
                            </div>

                            {/* User Pill */}
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#e4e4e7',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                }}
                                title={isLoggedIn ? `Logged in as ${resolvedAuthName}` : 'User Profile'}
                            >
                                {isLoggedIn ? (
                                    <span>{(resolvedAuthName || 'U').charAt(0).toUpperCase()}</span>
                                ) : (
                                    <UserIcon size={14} />
                                )}
                            </div>

                            {/* Cart Pill with Red Badge */}
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    openCart();
                                }}
                                style={{
                                    position: 'relative',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#e4e4e7',
                                    cursor: 'pointer',
                                }}
                                title="Open Shopping Bag"
                                aria-label="Open Shopping Bag"
                            >
                                <ShoppingCart size={14} />
                                {/* Red Notification Dot */}
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ef4444',
                                        boxShadow: '0 0 6px #ef4444',
                                    }}
                                />
                            </button>

                            {/* Close Modal Pill */}
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#a1a1aa',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                                aria-label="Close Checkout"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* ── CARD BODY: 2-COLUMN LAYOUT ── */}
                    <div
                        style={{
                            padding: '1rem 2rem 2rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                            gap: '2.5rem',
                            alignItems: 'center',
                        }}
                    >
                        {/* ──────── LEFT: PRODUCT SHOWCASE & ZOOM ──────── */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.25rem',
                                position: 'relative',
                            }}
                        >
                            {/* Vertical Thumbnail Strip */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.65rem',
                                    zIndex: 2,
                                    flexShrink: 0,
                                }}
                            >
                                {thumbnails.map((thumb) => {
                                    const isActive = activeThumb === thumb.id;
                                    return (
                                        <button
                                            key={thumb.id}
                                            type="button"
                                            onClick={() => setActiveThumb(thumb.id)}
                                            style={{
                                                position: 'relative',
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '10px',
                                                overflow: 'hidden',
                                                background: '#18181b',
                                                border: isActive
                                                    ? '2px solid #f59e0b'
                                                    : '1px solid rgba(255, 255, 255, 0.15)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                padding: 0,
                                                boxShadow: isActive
                                                    ? '0 0 12px rgba(245, 158, 11, 0.4)'
                                                    : 'none',
                                            }}
                                            title={thumb.label}
                                        >
                                            <Image
                                                src={product.src}
                                                alt={thumb.label}
                                                fill
                                                style={{
                                                    objectFit: 'cover',
                                                    objectPosition: thumb.crop,
                                                }}
                                            />
                                        </button>
                                    );
                                })}

                                {/* Plus Button */}
                                <button
                                    type="button"
                                    onClick={() => setActiveThumb((prev) => (prev + 1) % thumbnails.length)}
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '10px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#a1a1aa',
                                        cursor: 'pointer',
                                    }}
                                    title="More Angles"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Main Product Display with Hover Zoom */}
                            <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                                <div
                                    ref={imageContainerRef}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={handleMouseLeave}
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '270px',
                                        borderRadius: '18px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'zoom-in',
                                    }}
                                >
                                    {/* Ambient Warm Glow behind product image */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            width: '200px',
                                            height: '200px',
                                            borderRadius: '50%',
                                            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
                                            filter: 'blur(20px)',
                                            pointerEvents: 'none',
                                        }}
                                    />

                                    <Image
                                        src={product.src}
                                        alt={product.name}
                                        fill
                                        style={{
                                            objectFit: 'contain',
                                            objectPosition: thumbnails[activeThumb].crop,
                                            transformOrigin: `${zoom.x}% ${zoom.y}%`,
                                            transform: zoom.active ? 'scale(1.5)' : 'scale(1)',
                                            transition: zoom.active
                                                ? 'transform 0.08s ease-out'
                                                : 'transform 0.3s ease-out',
                                            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.6))',
                                        }}
                                        priority
                                    />
                                </div>

                                {/* "Roll Over Image To Zoom In" text matching user mockup */}
                                <p
                                    style={{
                                        margin: '0.65rem 0 0.85rem',
                                        fontSize: '0.72rem',
                                        color: '#71717a',
                                        fontWeight: 500,
                                        letterSpacing: '0.4px',
                                    }}
                                >
                                    Roll Over Image To Zoom In
                                </p>

                                {/* Size & Quantity Controls */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.8rem',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {/* Size Pills */}
                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                        {['S', 'M', 'L', 'XL', 'XXL'].map((s) => {
                                            const isSelected = size === s;
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setSize(s)}
                                                    style={{
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700,
                                                        border: isSelected
                                                            ? '1px solid #f59e0b'
                                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                                        background: isSelected
                                                            ? 'rgba(245, 158, 11, 0.15)'
                                                            : 'rgba(255, 255, 255, 0.03)',
                                                        color: isSelected ? '#f59e0b' : '#a1a1aa',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {s}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Quantity Stepper */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            padding: '2px 4px',
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#f59e0b',
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                padding: '0 5px',
                                            }}
                                        >
                                            −
                                        </button>
                                        <span
                                            style={{
                                                fontSize: '0.74rem',
                                                fontWeight: 800,
                                                color: '#fff',
                                                minWidth: '18px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#f59e0b',
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                padding: '0 5px',
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ──────── RIGHT: CHECKOUT FORM & SUMMARY ──────── */}
                        <div>
                            {successOrder ? (
                                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                    <div
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                            border: '1px solid rgba(16, 185, 129, 0.4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem',
                                            color: '#10b981',
                                        }}
                                    >
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 0.3rem' }}>
                                        Payment Captured!
                                    </h3>
                                    <p style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '1.2rem' }}>
                                        Your order has been confirmed and queued for priority dispatch.
                                    </p>
                                    <div
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '12px',
                                            padding: '0.9rem',
                                            fontSize: '0.8rem',
                                            marginBottom: '1.25rem',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                            <span style={{ color: '#a1a1aa' }}>Order Reference</span>
                                            <code style={{ color: '#f59e0b', fontWeight: 600 }}>{successOrder.orderId}</code>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                            <span style={{ color: '#a1a1aa' }}>Payment ID</span>
                                            <code style={{ color: '#10b981' }}>{successOrder.paymentId}</code>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#a1a1aa' }}>Total Paid</span>
                                            <strong style={{ color: '#fff' }}>₹{successOrder.amount.toLocaleString('en-IN')}</strong>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)',
                                            border: 'none',
                                            color: '#0c0e14',
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                    {/* Checkout Title + Price Header */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.2rem',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    fontSize: '1.25rem',
                                                    fontWeight: 600,
                                                    letterSpacing: '-0.2px',
                                                    color: '#ffffff',
                                                }}
                                            >
                                                Checkout
                                            </h3>
                                            {isLoggedIn && (
                                                <span
                                                    style={{
                                                        fontSize: '0.64rem',
                                                        color: '#10b981',
                                                        fontWeight: 700,
                                                        background: 'rgba(16, 185, 129, 0.12)',
                                                        padding: '2px 6px',
                                                        borderRadius: '10px',
                                                    }}
                                                >
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: '1.3rem',
                                                fontWeight: 700,
                                                color: '#f59e0b',
                                                fontFamily: 'var(--font-heading), "Space Grotesk", sans-serif',
                                            }}
                                        >
                                            ₹{totalAmount.toLocaleString('en-IN')}
                                        </span>
                                    </div>

                                    {error && (
                                        <div
                                            style={{
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '8px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#ef4444',
                                                fontSize: '0.74rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                            }}
                                        >
                                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Field 1: Cardholder Name */}
                                    <div>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Cardholder Name"
                                            value={cardholderName}
                                            onChange={(e) => setCardholderName(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.68rem 1rem',
                                                borderRadius: '12px',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                color: '#ffffff',
                                                fontSize: '0.82rem',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                    </div>

                                    {/* Field 2: Card Number with Mastercard Icon */}
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            placeholder="Card Number"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.68rem 3.5rem 0.68rem 1rem',
                                                borderRadius: '12px',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                color: '#ffffff',
                                                fontSize: '0.82rem',
                                                letterSpacing: '1px',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                            }}
                                        />
                                        {/* Mastercard Overlapping Circles Logo */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                right: '14px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                pointerEvents: 'none',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#eb001b',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#f79e1b',
                                                    marginLeft: '-7px',
                                                    opacity: 0.92,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Row 3: Expiration & CVV */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1.2fr 0.8fr',
                                            gap: '1rem',
                                        }}
                                    >
                                        {/* Expiration (MM : / YY) */}
                                        <div>
                                            <label
                                                style={{
                                                    display: 'block',
                                                    fontSize: '0.7rem',
                                                    color: '#a1a1aa',
                                                    marginBottom: '0.3rem',
                                                }}
                                            >
                                                Expiration
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                {/* MM pill */}
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '0.55rem 0.65rem',
                                                        borderRadius: '12px',
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    }}
                                                >
                                                    <input
                                                        type="text"
                                                        maxLength={2}
                                                        value={expMonth}
                                                        onChange={(e) => setExpMonth(e.target.value)}
                                                        placeholder="MM"
                                                        style={{
                                                            width: '28px',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#fff',
                                                            fontSize: '0.8rem',
                                                            outline: 'none',
                                                            textAlign: 'center',
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '0.65rem', color: '#71717a' }}>↕</span>
                                                </div>

                                                <span style={{ color: '#71717a', fontSize: '0.85rem' }}>/</span>

                                                {/* YY pill */}
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '0.55rem 0.65rem',
                                                        borderRadius: '12px',
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    }}
                                                >
                                                    <input
                                                        type="text"
                                                        maxLength={2}
                                                        value={expYear}
                                                        onChange={(e) => setExpYear(e.target.value)}
                                                        placeholder="YY"
                                                        style={{
                                                            width: '100%',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#fff',
                                                            fontSize: '0.8rem',
                                                            outline: 'none',
                                                            textAlign: 'center',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* CVV */}
                                        <div>
                                            <label
                                                style={{
                                                    display: 'block',
                                                    fontSize: '0.7rem',
                                                    color: '#a1a1aa',
                                                    marginBottom: '0.3rem',
                                                }}
                                            >
                                                CVV
                                            </label>
                                            <div
                                                style={{
                                                    padding: '0.55rem 0.85rem',
                                                    borderRadius: '12px',
                                                    background: 'rgba(255, 255, 255, 0.04)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                }}
                                            >
                                                <input
                                                    type="password"
                                                    maxLength={4}
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value)}
                                                    placeholder="CVV"
                                                    style={{
                                                        width: '100%',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#fff',
                                                        fontSize: '0.8rem',
                                                        outline: 'none',
                                                        letterSpacing: '2px',
                                                        textAlign: 'center',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Breakdown matching mockup */}
                                    <div
                                        style={{
                                            marginTop: '0.4rem',
                                            paddingTop: '0.65rem',
                                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.35rem',
                                            fontSize: '0.78rem',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa' }}>
                                            <span>balance amount:</span>
                                            <span style={{ color: '#ffffff', fontWeight: 500 }}>
                                                ₹{subtotal.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa' }}>
                                            <span>Vat (21%):</span>
                                            <span style={{ color: '#ffffff', fontWeight: 500 }}>
                                                ₹{vat.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                paddingTop: '0.45rem',
                                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                                fontSize: '0.86rem',
                                                fontWeight: 700,
                                            }}
                                        >
                                            <span style={{ color: '#ffffff' }}>Total:</span>
                                            <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>
                                                ₹{totalAmount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons: Vibrant Amber "Buy" + Subtle "Add to Cart" */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                                        <button
                                            type="submit"
                                            id="modal-buy-now-btn"
                                            disabled={loading}
                                            style={{
                                                width: '100%',
                                                height: '46px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)',
                                                color: '#0c0e14',
                                                fontWeight: 800,
                                                fontSize: '0.98rem',
                                                letterSpacing: '0.3px',
                                                border: 'none',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
                                                transition: 'transform 0.15s ease, opacity 0.15s ease',
                                                opacity: loading ? 0.75 : 1,
                                            }}
                                        >
                                            <span>{loading ? 'Processing...' : 'Buy'}</span>
                                        </button>

                                        <button
                                            type="button"
                                            id="modal-add-to-cart-btn"
                                            onClick={() => {
                                                addToCart(product, size, quantity);
                                                onClose();
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#a1a1aa',
                                                fontSize: '0.74rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.4rem',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = '#f59e0b')}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                                        >
                                            <ShoppingBag size={13} />
                                            <span>Or Add to Shopping Bag</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
