'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, CreditCard, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { useAuth } from '@/lib/authContext';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CartDrawer() {
    const { items, totalItems, totalAmount, totalBonusPoints, updateQuantity, removeFromCart, clearCart, isCartOpen, closeCart } = useCart();
    const { user, bannedUser } = useAuth();
    const isLoggedIn = Boolean(user);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [showEditDetails, setShowEditDetails] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successOrder, setSuccessOrder] = useState<{ orderId: string; paymentId: string; amount: number } | null>(null);

    // Compute resolved customer details from auth
    const resolvedAuthName = bannedUser?.fullName || bannedUser?.displayName || user?.displayName || user?.email?.split('@')[0] || '';
    const resolvedAuthEmail = bannedUser?.email || user?.email || (user?.phoneNumber ? `${user.phoneNumber.replace(/[^0-9]/g, '')}@bannned.store` : '');
    const resolvedAuthPhone = bannedUser?.phone || user?.phoneNumber || '';

    useEffect(() => {
        if (isCartOpen) {
            setError(null);
            setSuccessOrder(null);
            if (user) {
                setName(resolvedAuthName);
                setEmail(resolvedAuthEmail);
                setPhone(resolvedAuthPhone);
            } else {
                setName('');
                setEmail('');
                setPhone('');
            }
        }
    }, [isCartOpen, user, bannedUser, resolvedAuthName, resolvedAuthEmail, resolvedAuthPhone]);

    // Lock body scroll when cart is open
    useEffect(() => {
        if (isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isCartOpen]);

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

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (items.length === 0) {
            setError('Your cart is empty.');
            return;
        }

        const finalName = (name || resolvedAuthName || 'Store Customer').trim();
        const finalEmail = (email || resolvedAuthEmail).trim();
        const finalPhone = (phone || resolvedAuthPhone).trim();

        if (!finalName || !finalEmail) {
            setError('Please provide your name and email address to proceed.');
            return;
        }

        try {
            setLoading(true);

            // Format cart items for order store
            const orderItems = items.map(it => ({
                productId: it.productId,
                productName: `${it.name} (${it.size})`,
                price: it.unitPrice,
                quantity: it.quantity,
                bonusPoints: it.bonusPoints || 0,
            }));

            // 1. Create multi-item order on backend
            const orderRes = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalAmount,
                    customerName: finalName,
                    customerEmail: finalEmail,
                    customerPhone: finalPhone,
                    items: orderItems,
                }),
            });

            const orderData = await orderRes.json();
            if (!orderData.success) {
                throw new Error(orderData.error || 'Failed to create Razorpay checkout order');
            }

            // Simulated sandbox order
            if (orderData.isSimulated) {
                await new Promise((r) => setTimeout(r, 900));
                const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 10)}`;

                const verifyRes = await fetch('/api/razorpay/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: orderData.razorpayOrderId,
                        razorpay_payment_id: mockPaymentId,
                        razorpay_signature: 'simulated_signature_valid',
                        customerEmail: finalEmail,
                        method: 'upi_sandbox',
                    }),
                });

                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                    setSuccessOrder({
                        orderId: orderData.orderId,
                        paymentId: mockPaymentId,
                        amount: totalAmount,
                    });
                    clearCart();
                } else {
                    throw new Error(verifyData.error || 'Payment verification failed');
                }
                setLoading(false);
                return;
            }

            // Live Razorpay SDK checkout
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Razorpay SDK failed to load. Please verify your connection.');
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || 'INR',
                name: orderData.companyName || 'BANNNED',
                description: `Shopping Bag Checkout — ${totalItems} Items`,
                image: orderData.companyLogo || items[0]?.src || '/angel.jpeg',
                order_id: orderData.razorpayOrderId,
                prefill: {
                    name: finalName,
                    email: finalEmail,
                    contact: finalPhone,
                },
                theme: {
                    color: '#c8b89a',
                    backdrop_color: 'rgba(10, 12, 16, 0.9)',
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
                            clearCart();
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
            setError(err.message || 'Checkout initiation failed.');
        } finally {
            setLoading(false);
        }
    };

    const finalName = (name || resolvedAuthName || 'Store Customer').trim();
    const finalEmail = (email || resolvedAuthEmail).trim();
    const finalPhone = (phone || resolvedAuthPhone).trim();

    return (
        <AnimatePresence>
            {isCartOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                    onClick={closeCart}
                >
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                        style={{
                            width: '100%',
                            maxWidth: '480px',
                            height: '100%',
                            backgroundColor: '#0c0e14',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            color: '#f3f4f6',
                            boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.8)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div
                            style={{
                                padding: '1.25rem 1.5rem',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255, 255, 255, 0.02)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <ShoppingBag size={20} color="#c8b89a" />
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                    Your Shopping Bag
                                </h3>
                                <span
                                    style={{
                                        background: 'rgba(200, 184, 154, 0.15)',
                                        color: '#c8b89a',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                    }}
                                >
                                    {totalItems}
                                </span>
                            </div>
                            <button
                                onClick={closeCart}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                aria-label="Close Bag"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
                            {successOrder ? (
                                <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
                                    <div
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                            border: '1px solid rgba(16, 185, 129, 0.4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1.25rem',
                                            color: '#10b981',
                                        }}
                                    >
                                        <CheckCircle2 size={36} />
                                    </div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem', color: '#fff' }}>
                                        Order Placed Successfully!
                                    </h2>
                                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                                        Your payment has been captured and your items are queued for priority production.
                                    </p>
                                    <div
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '10px',
                                            padding: '1rem',
                                            textAlign: 'left',
                                            fontSize: '0.82rem',
                                            marginBottom: '1.5rem',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#9ca3af' }}>Order Reference</span>
                                            <code style={{ color: '#c8b89a', fontWeight: 600 }}>{successOrder.orderId}</code>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#9ca3af' }}>Payment ID</span>
                                            <code style={{ color: '#10b981' }}>{successOrder.paymentId}</code>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#9ca3af' }}>Amount Paid</span>
                                            <strong style={{ color: '#fff' }}>₹{successOrder.amount.toLocaleString('en-IN')}</strong>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeCart}
                                        style={{
                                            width: '100%',
                                            padding: '0.85rem',
                                            borderRadius: '8px',
                                            background: '#c8b89a',
                                            color: '#0a0c10',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Back to Store
                                    </button>
                                </div>
                            ) : items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9ca3af' }}>
                                    <div
                                        style={{
                                            width: '68px',
                                            height: '68px',
                                            borderRadius: '50%',
                                            background: 'rgba(200, 184, 154, 0.08)',
                                            border: '1px solid rgba(200, 184, 154, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1.25rem',
                                            color: '#c8b89a',
                                        }}
                                    >
                                        <ShoppingBag size={30} />
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                                        Your Bag is Empty
                                    </h4>
                                    <p style={{ fontSize: '0.82rem', color: '#9ca3af', maxWidth: '280px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                                        Explore the collection and click "Add to Bag" on any drop to get started.
                                    </p>
                                    <button
                                        onClick={closeCart}
                                        style={{
                                            padding: '0.65rem 1.4rem',
                                            borderRadius: '8px',
                                            background: 'rgba(200, 184, 154, 0.15)',
                                            border: '1px solid #c8b89a',
                                            color: '#c8b89a',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Explore Drops
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {items.map((it) => (
                                        <div
                                            key={it.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.9rem',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                borderRadius: '10px',
                                                padding: '0.75rem',
                                                position: 'relative',
                                            }}
                                        >
                                            {/* Thumbnail */}
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    width: 54,
                                                    height: 54,
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    backgroundColor: '#161922',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Image src={it.src} alt={it.name} fill style={{ objectFit: 'cover' }} />
                                            </div>

                                            {/* Item Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                                    <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {it.name}
                                                    </h5>
                                                    <button
                                                        onClick={() => removeFromCart(it.id)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#6b7280',
                                                            cursor: 'pointer',
                                                            padding: '2px',
                                                        }}
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.74rem' }}>
                                                    <span style={{ background: 'rgba(200, 184, 154, 0.15)', color: '#c8b89a', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                        Size: {it.size}
                                                    </span>
                                                    <span style={{ color: '#9ca3af' }}>
                                                        ₹{it.unitPrice.toLocaleString('en-IN')}
                                                    </span>
                                                </div>

                                                {/* Stepper + Subtotal */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', height: '28px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '5px', padding: '0 2px' }}>
                                                        <button
                                                            onClick={() => updateQuantity(it.id, it.quantity - 1)}
                                                            style={{
                                                                width: '22px',
                                                                height: '22px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: '#c8b89a',
                                                                cursor: 'pointer',
                                                                fontWeight: 800,
                                                                fontSize: '0.9rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            −
                                                        </button>
                                                        <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>
                                                            {it.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(it.id, it.quantity + 1)}
                                                            disabled={it.quantity >= 10}
                                                            style={{
                                                                width: '22px',
                                                                height: '22px',
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color: it.quantity >= 10 ? '#4b5563' : '#c8b89a',
                                                                cursor: it.quantity >= 10 ? 'not-allowed' : 'pointer',
                                                                fontWeight: 800,
                                                                fontSize: '0.9rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <strong style={{ fontSize: '0.88rem', color: '#c8b89a', fontFamily: 'monospace' }}>
                                                        ₹{(it.unitPrice * it.quantity).toLocaleString('en-IN')}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer / Checkout Form */}
                        {items.length > 0 && !successOrder && (
                            <div
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                    background: 'rgba(255, 255, 255, 0.015)',
                                }}
                            >
                                {/* Customer Auth Summary */}
                                {isLoggedIn ? (
                                    <div
                                        style={{
                                            background: 'rgba(200, 184, 154, 0.06)',
                                            border: '1px solid rgba(200, 184, 154, 0.2)',
                                            borderRadius: '8px',
                                            padding: '0.65rem 0.85rem',
                                            marginBottom: '0.9rem',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #c8b89a, #821515)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: '#0a0c10' }}>
                                                    {(finalName || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{finalName}</span>
                                                <span style={{ fontSize: '0.64rem', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', padding: '1px 5px', borderRadius: '8px' }}>✓ Verified</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowEditDetails(p => !p)}
                                                style={{ background: 'transparent', border: 'none', color: '#c8b89a', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                {showEditDetails ? 'Hide' : 'Edit'}
                                            </button>
                                        </div>

                                        {showEditDetails && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    placeholder="Full Name"
                                                    style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '5px', backgroundColor: '#0a0c10', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.78rem' }}
                                                />
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        placeholder="Email"
                                                        style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '5px', backgroundColor: '#0a0c10', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.78rem' }}
                                                    />
                                                    <input
                                                        type="tel"
                                                        value={phone}
                                                        onChange={e => setPhone(e.target.value)}
                                                        placeholder="Phone"
                                                        style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '5px', backgroundColor: '#0a0c10', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.78rem' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '0.9rem' }}>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Your Full Name *"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', backgroundColor: '#0a0c10', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                                        />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <input
                                                type="email"
                                                required
                                                placeholder="Email Address *"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', backgroundColor: '#0a0c10', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Phone (Optional)"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', backgroundColor: '#0a0c10', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div
                                        style={{
                                            padding: '0.55rem 0.75rem',
                                            borderRadius: '6px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: '#ef4444',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            marginBottom: '0.75rem',
                                        }}
                                    >
                                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Price Breakdown */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.9rem', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                                        <span>Subtotal ({totalItems} items)</span>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                                        <span>Express Shipping</span>
                                        <span style={{ color: '#10b981', fontWeight: 700 }}>FREE</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontSize: '0.75rem' }}>
                                        <span>Loyalty Rewards Earned</span>
                                        <span style={{ fontWeight: 700 }}>+{totalBonusPoints} pts</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '1rem', fontWeight: 800 }}>
                                        <span>Total Amount</span>
                                        <span style={{ color: '#c8b89a', fontFamily: 'monospace' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '0.65rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleCheckout}
                                        disabled={loading}
                                        style={{
                                            flex: 1,
                                            padding: '0.85rem',
                                            borderRadius: '8px',
                                            background: 'linear-gradient(135deg, #c8b89a 0%, #a89270 100%)',
                                            color: '#0a0c10',
                                            fontWeight: 800,
                                            fontSize: '0.88rem',
                                            border: 'none',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            boxShadow: '0 4px 14px rgba(200, 184, 154, 0.3)',
                                            opacity: loading ? 0.7 : 1,
                                        }}
                                    >
                                        <CreditCard size={16} />
                                        <span>{loading ? 'Connecting...' : `Checkout ₹${totalAmount.toLocaleString('en-IN')}`}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearCart}
                                        style={{
                                            padding: '0.85rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: '#9ca3af',
                                            cursor: 'pointer',
                                        }}
                                        title="Clear all items from bag"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.66rem', color: '#6b7280' }}>
                                    <Lock size={11} />
                                    <span>Encrypted 256-bit checkout • Instant delivery</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
