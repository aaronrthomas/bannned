'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
    LayoutDashboard, FileText, Package, Users, Receipt, CreditCard,
    Sliders, HelpCircle, Search, Bell, Plus, Star, Edit3, Trash2,
    Copy, ExternalLink, X, Save, RotateCcw, CheckCircle, AlertCircle,
    ArrowUpRight, ShoppingBag, Truck, Eye, EyeOff, ChevronDown, Check,
    Sparkles, Shield, Tag, Box, Layers, Headphones, Gamepad2, Armchair, MessageSquare, Mail,
    Printer, Flame, Send, Download, Lock, KeyRound, LogOut, ArrowLeft, Fingerprint
} from 'lucide-react';
import { Product, ProductCategory, ProductStatus, AdminStats, Order, PaymentTransaction } from '@/lib/types';
import { subscribeToOrders } from '@/lib/firebase';
import {
    getAuth, signInWithEmailAndPassword, signOut,
    onAuthStateChanged, updatePassword, User as FirebaseUser,
    EmailAuthProvider, reauthenticateWithCredential,
    GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import AdminLoginGateUI from '@/components/AdminLoginGate';

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN GATE — only bannnedshop@gmail.com can access
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'bannnedshop@gmail.com';
const DEFAULT_ADMIN_ID = 'BANNNED-ADMIN-01';



function AdminLoginGate({ onAuthenticated }: { onAuthenticated: (user: FirebaseUser) => void }) {
    return <AdminLoginGateUI onAuthenticated={onAuthenticated} />;
}



// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CREDENTIALS & SECURITY MODAL
// STRICT RULE: Can ONLY be modified if user is logged in via bannnedshop@gmail.com
// ─────────────────────────────────────────────────────────────────────────────
function AdminCredentialsModal({
    user,
    currentAdminId,
    onIdUpdated,
    onClose,
}: {
    user: FirebaseUser;
    currentAdminId: string;
    onIdUpdated: (newId: string) => void;
    onClose: () => void;
}) {
    const isAuthorized = user?.email?.toLowerCase() === ADMIN_EMAIL;
    const [activeTab, setActiveTab] = useState<'id' | 'password'>('id');

    // Admin ID state
    const [adminIdInput, setAdminIdInput] = useState(currentAdminId || DEFAULT_ADMIN_ID);
    const [savingId, setSavingId] = useState(false);
    const [idError, setIdError] = useState('');
    const [idSuccess, setIdSuccess] = useState('');

    // Password state
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');
    const [savingPass, setSavingPass] = useState(false);

    if (!isAuthorized) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
                <div style={{ background: '#0f0f1a', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 18, padding: '36px 32px', maxWidth: 440, textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>⛔</div>
                    <h2 style={{ color: '#f87171', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 10px' }}>Access Prohibited</h2>
                    <p style={{ color: '#a0a0b0', fontSize: '0.86rem', lineHeight: 1.5, margin: '0 0 20px' }}>
                        Admin credentials can <strong>only</strong> be accessed and changed by the authorized master administrator.
                    </p>
                    <button onClick={onClose} style={{ padding: '10px 24px', background: '#2a2a3e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const handleSaveId = async (e: React.FormEvent) => {
        e.preventDefault();
        setIdError(''); setIdSuccess('');
        if (!adminIdInput.trim() || adminIdInput.trim().length < 3) {
            setIdError('Unique Admin ID must be at least 3 characters long');
            return;
        }

        try {
            setSavingId(true);
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callerEmail: user.email,
                    adminId: adminIdInput.trim(),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setIdSuccess(`Unique Admin ID successfully updated to "${data.adminId}"!`);
                onIdUpdated(data.adminId);
            } else {
                setIdError(data.error || 'Failed to update Admin ID');
            }
        } catch (err: any) {
            setIdError(err.message || 'Error updating Admin ID');
        } finally {
            setSavingId(false);
        }
    };

    const handleChangePass = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError(''); setPassSuccess('');
        if (!currentPass || !newPass || !confirmPass) {
            setPassError('All password fields are required');
            return;
        }
        if (newPass !== confirmPass) {
            setPassError('New passwords do not match');
            return;
        }
        if (newPass.length < 8) {
            setPassError('New password must be at least 8 characters long');
            return;
        }

        try {
            setSavingPass(true);
            const auth = getAuth(app);
            const credential = EmailAuthProvider.credential(user.email!, currentPass);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPass);
            setPassSuccess('Admin password updated successfully!');
            setCurrentPass(''); setNewPass(''); setConfirmPass('');
        } catch (err: any) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setPassError('Current password is incorrect');
            } else {
                setPassError(err.message || 'Failed to update password');
            }
        } finally {
            setSavingPass(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
            <div style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '34px 32px', width: '100%', maxWidth: 460, position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
                {/* Close Button */}
                <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#6b6b80', cursor: 'pointer', fontSize: '1.2rem', padding: 4 }} title="Close">
                    ✕
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,184,154,0.12)', border: '1px solid rgba(200,184,154,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <KeyRound size={18} color="#c8b89a" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f0f0f0', margin: 0 }}>Admin Security & Credentials</h2>
                        <div style={{ fontSize: '0.72rem', color: '#8a8aa0', marginTop: 2 }}>Manage Unique Admin ID and master password</div>
                    </div>
                </div>

                {/* Verified Account Banner */}
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={16} color="#34d399" />
                    <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                        Authenticated as <strong>Master Administrator</strong>
                        <div style={{ fontSize: '0.7rem', color: '#6ee7b7', opacity: 0.85 }}>Verified clearance to manage administrator credentials &amp; unique ID</div>
                    </div>
                </div>

                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10, marginBottom: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={() => setActiveTab('id')}
                        style={{
                            flex: 1, padding: '9px 12px', border: 'none', borderRadius: 8,
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            background: activeTab === 'id' ? '#c8b89a' : 'transparent',
                            color: activeTab === 'id' ? '#07070d' : '#8a8aa0',
                            transition: 'all 0.15s',
                        }}
                    >
                        Unique Admin ID
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        style={{
                            flex: 1, padding: '9px 12px', border: 'none', borderRadius: 8,
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            background: activeTab === 'password' ? '#c8b89a' : 'transparent',
                            color: activeTab === 'password' ? '#07070d' : '#8a8aa0',
                            transition: 'all 0.15s',
                        }}
                    >
                        Change Password
                    </button>
                </div>

                {/* TAB 1: UNIQUE ADMIN ID */}
                {activeTab === 'id' && (
                    <form onSubmit={handleSaveId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#6b6b80', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Current Unique Admin ID</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#c8b89a', marginTop: 4, letterSpacing: '1px' }}>
                                {currentAdminId || DEFAULT_ADMIN_ID}
                            </div>
                        </div>

                        {idError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '9px 12px', color: '#f87171', fontSize: '0.8rem' }}>{idError}</div>}
                        {idSuccess && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '9px 12px', color: '#34d399', fontSize: '0.8rem' }}>{idSuccess}</div>}

                        <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#8a8aa0', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 6 }}>
                                New Unique Admin ID
                            </label>
                            <input
                                type="text"
                                value={adminIdInput}
                                onChange={e => setAdminIdInput(e.target.value.toUpperCase())}
                                placeholder="e.g. BANNNED-ADMIN-01"
                                style={{ width: '100%', padding: '11px 13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, color: '#f0f0f0', fontFamily: 'inherit', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box' }}
                            />
                            <div style={{ fontSize: '0.72rem', color: '#6b6b80', marginTop: 5 }}>
                                Used to sign in without entering your full email address.
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={savingId}
                            style={{ padding: '12px', background: '#c8b89a', color: '#07070d', border: 'none', borderRadius: 9, fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 700, cursor: savingId ? 'not-allowed' : 'pointer', opacity: savingId ? 0.6 : 1, marginTop: 4 }}
                        >
                            {savingId ? 'Updating Admin ID...' : 'Save New Admin ID'}
                        </button>
                    </form>
                )}

                {/* TAB 2: CHANGE PASSWORD */}
                {activeTab === 'password' && (
                    <form onSubmit={handleChangePass} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {passError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '9px 12px', color: '#f87171', fontSize: '0.8rem' }}>{passError}</div>}
                        {passSuccess && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '9px 12px', color: '#34d399', fontSize: '0.8rem' }}>{passSuccess}</div>}

                        {[
                            ['Current Password', currentPass, setCurrentPass, 'Enter your current password'],
                            ['New Password', newPass, setNewPass, 'At least 8 characters'],
                            ['Confirm New Password', confirmPass, setConfirmPass, 'Re-enter new password'],
                        ].map(([label, val, setter, ph]: any) => (
                            <div key={label as string}>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#8a8aa0', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 5 }}>{label as string}</label>
                                <input
                                    type="password"
                                    value={val as string}
                                    onChange={e => setter(e.target.value)}
                                    placeholder={ph as string}
                                    style={{ width: '100%', padding: '10px 13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#f0f0f0', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={savingPass}
                            style={{ padding: '12px', background: '#c8b89a', color: '#07070d', border: 'none', borderRadius: 9, fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 700, cursor: savingPass ? 'not-allowed' : 'pointer', opacity: savingPass ? 0.6 : 1, marginTop: 4 }}
                        >
                            {savingPass ? 'Updating Password...' : 'Update Admin Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}


const STORE_ASSETS = [
    { label: 'Demon Tee', path: '/red.jpeg' },
    { label: 'Angel Tee', path: '/angel.jpeg' },
    { label: 'Neymar Tee', path: '/neymar.jpeg' },
    { label: 'Sage Hoodie', path: '/hoodie-green.png' },
    { label: 'Navy Hoodie', path: '/hoodie-navy.png' },
    { label: 'Sweatshirt', path: '/model-sweatshirt.png' },
    { label: 'Snapback Cap', path: '/product-caps.png' },
    { label: 'Canvas Tote', path: '/tote-bag.png' },
    { label: 'Lookbook 1', path: '/new-arrival-1.jpg' },
    { label: 'Lookbook 2', path: '/new-arrival-2.jpg' },
];

const PRESET_BADGE_COLORS = [
    { label: 'Crimson', hex: '#821515' },
    { label: 'Sage', hex: '#274724' },
    { label: 'Flame', hex: '#BA4C16' },
    { label: 'Navy', hex: '#1b3a5c' },
    { label: 'Stone', hex: '#474554' },
    { label: 'Purple', hex: '#3d2b56' },
];

const CATEGORIES: { label: string; value: ProductCategory }[] = [
    { label: 'Graphic Tees', value: 'tees' },
    { label: 'Heavy Hoodies', value: 'hoodies' },
    { label: 'Sweatshirts', value: 'sweatshirts' },
    { label: 'Caps & Headwear', value: 'caps' },
    { label: 'Accessories & Totes', value: 'accessories' },
];

type ActiveTab = 'report' | 'dashboard' | 'products' | 'points' | 'orders' | 'transactions' | 'inventory' | 'emails' | 'users';

export default function AdminDashboard() {
    const [adminUser, setAdminUser] = useState<FirebaseUser | null>(null);
    const [adminAuthLoading, setAdminAuthLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth(app);
        const unsub = onAuthStateChanged(auth, (u) => {
            setAdminUser(u && u.email?.toLowerCase() === ADMIN_EMAIL ? u : null);
            setAdminAuthLoading(false);
        });
        return () => unsub();
    }, []);

    if (adminAuthLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070d' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #1a1a2e', borderTop: '3px solid #c8b89a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!adminUser) {
        return <AdminLoginGate onAuthenticated={(u) => setAdminUser(u)} />;
    }

    return <AdminDashboardContent adminUser={adminUser} onSignOut={async () => { await signOut(getAuth(app)); setAdminUser(null); }} />;
}

function AdminDashboardContent({ adminUser, onSignOut }: { adminUser: FirebaseUser; onSignOut: () => void }) {
    const [currentAdminId, setCurrentAdminId] = useState(DEFAULT_ADMIN_ID);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('report');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number; orders: number }[]>([]);
    const [revenueStats, setRevenueStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 });
    const [visitorCount, setVisitorCount] = useState<number>(18);
    const [sentEmails, setSentEmails] = useState<any[]>([]);
    const [lastKnownOrderId, setLastKnownOrderId] = useState<string | null>(null);
    const [richRevenue, setRichRevenue] = useState<any>(null);
    const [selectedEmailPreview, setSelectedEmailPreview] = useState<any | null>(null);
    const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
    const [sendingInvoice, setSendingInvoice] = useState(false);
    const [sendingTestEmail, setSendingTestEmail] = useState(false);
    const [firebaseStatus, setFirebaseStatus] = useState<any>(null);
    const [resendStatus, setResendStatus] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [editingPoints, setEditingPoints] = useState<Record<string, number>>({});
    const [hoveredMonth, setHoveredMonth] = useState<string>('Apr');
    const [users, setUsers] = useState<any[]>([]);
    const [userStats, setUserStats] = useState<any>({});
    const [userSearch, setUserSearch] = useState('');
    const [userFilter, setUserFilter] = useState<'all' | 'google' | 'phone' | 'email' | 'guest'>('all');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [editingUserPoints, setEditingUserPoints] = useState<Record<string, number>>({});
    const [savingUserPoints, setSavingUserPoints] = useState<Record<string, boolean>>({});

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3800);
    }, []);

    const playOrderChime = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch {}
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/products');
            const data = await res.json();
            if (data.success) setProducts(data.products);
        } catch {
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = useCallback(async () => {
        try {
            setLoadingUsers(true);
            const res = await fetch('/api/admin/users', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setUsers(data.users || []);
                setUserStats(data.stats || {});
            } else {
                showToast(data.error || 'Failed to load user accounts', 'error');
            }
        } catch {
            showToast('Unable to reach users database', 'error');
        } finally {
            setLoadingUsers(false);
        }
    }, [showToast]);

    const handleSaveUserPoints = async (uid: string) => {
        const pts = editingUserPoints[uid];
        if (pts === undefined || !uid) return;
        try {
            setSavingUserPoints(prev => ({ ...prev, [uid]: true }));
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, loyaltyPoints: pts }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`✅ Loyalty points updated to ${pts} pts`);
                setUsers(prev => prev.map(u => u.uid === uid ? { ...u, loyaltyPoints: pts } : u));
            } else {
                showToast(data.error || 'Failed to update points', 'error');
            }
        } catch {
            showToast('Error updating points', 'error');
        } finally {
            setSavingUserPoints(prev => ({ ...prev, [uid]: false }));
        }
    };

    const loadAnalytics = useCallback(async (isSilent = false) => {
        try {
            const res = await fetch('/api/admin/analytics');
            const data = await res.json();
            if (data.success) {
                const newOrders: Order[] = data.orders || [];
                // Detect new incoming order during real-time polling
                if (isSilent && lastKnownOrderId && newOrders.length > 0 && newOrders[0].id !== lastKnownOrderId) {
                    const latest = newOrders[0];
                    playOrderChime();
                    showToast(`🔔 New Order Received: #${latest.id.slice(-6)} from ${latest.customerName} (₹${latest.totalAmount.toLocaleString('en-IN')}) — Admin Email Dispatched 📧`);
                }
                if (newOrders.length > 0) {
                    setLastKnownOrderId(newOrders[0].id);
                }
                setOrders(newOrders);
                setTransactions(data.transactions || []);
                setDailyRevenue(data.revenue?.dailyRevenue || []);
                setVisitorCount(data.visitorCount || 18);
                setSentEmails(data.sentEmails || []);
                setRichRevenue(data.revenue || null);
                setRevenueStats({
                    totalRevenue: data.revenue?.totalRevenue || 0,
                    totalOrders: data.revenue?.totalOrders || 0,
                    avgOrderValue: data.revenue?.avgOrderValue || 0,
                });
            }
        } catch (err) {
            if (!isSilent) console.error('Analytics load failed:', err);
        }
    }, [lastKnownOrderId, showToast]);

    const loadAdminConfig = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/config', { cache: 'no-store' });
            const data = await res.json();
            if (data.success && data.adminId) {
                setCurrentAdminId(data.adminId);
            }
        } catch {}
    }, []);

    const loadIntegrationStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/firebase-status');
            const data = await res.json();
            if (data.success) {
                setFirebaseStatus(data.firebase);
                setResendStatus(data.resend);
            }
        } catch {}
    }, []);

    useEffect(() => {
        loadAdminConfig();
        loadProducts();
        loadAnalytics(false);
        loadIntegrationStatus();
        loadUsers();

        // 1. Continuous Real-Time Updates Every 2 Seconds
        const interval = setInterval(() => {
            loadAnalytics(true);
        }, 2000);

        // 2. Firebase SDK Realtime Database Subscription
        let unsubscribeFirebase = () => {};
        try {
            unsubscribeFirebase = subscribeToOrders((firebaseOrders) => {
                if (firebaseOrders && firebaseOrders.length > 0) {
                    loadAnalytics(true);
                }
            });
        } catch {}

        // 3. Firebase Realtime Database SSE Push Listener (HTTP Fallback)
        let eventSource: EventSource | null = null;
        const fbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
        if (fbUrl) {
            try {
                const cleanUrl = fbUrl.replace(/\/+$/, '');
                eventSource = new EventSource(`${cleanUrl}/orders.json`);
                eventSource.addEventListener('put', () => loadAnalytics(true));
                eventSource.addEventListener('patch', () => loadAnalytics(true));
            } catch (err) {
                console.warn('[Firebase RTDB] SSE connect notice:', err);
            }
        }

        return () => {
            clearInterval(interval);
            unsubscribeFirebase();
            if (eventSource) eventSource.close();
        };
    }, [loadAnalytics, loadIntegrationStatus]);

    const handleSendInvoiceEmail = async (orderId: string, email: string) => {
        try {
            setSendingInvoice(true);
            const res = await fetch('/api/admin/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, recipientEmail: email }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`📄 Tax Invoice sent to ${email} (${data.provider})!`);
                await loadAnalytics(true);
            } else {
                showToast(data.error || 'Failed to dispatch invoice', 'error');
            }
        } catch {
            showToast('Failed to trigger invoice email', 'error');
        } finally {
            setSendingInvoice(false);
        }
    };

    // Computed catalog statistics
    const stats: AdminStats = useMemo(() => {
        const activeProducts = products.filter(p => p.status === 'active').length;
        const draftProducts = products.filter(p => p.status === 'draft').length;
        const outOfStockProducts = products.filter(p => p.status === 'out_of_stock' || (p.stock || 0) <= 0).length;
        const lowStockProducts = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 25).length;
        let totalInventoryUnits = 0;
        let totalCatalogValue = 0;
        const categoryCounts: Record<string, number> = {};

        products.forEach(p => {
            const stk = p.stock || 0;
            totalInventoryUnits += stk;
            const priceNum = parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || 0;
            totalCatalogValue += priceNum * stk;
            const c = p.category || 'tees';
            categoryCounts[c] = (categoryCounts[c] || 0) + 1;
        });

        return {
            totalProducts: products.length,
            activeProducts,
            draftProducts,
            outOfStockProducts,
            lowStockProducts,
            totalInventoryUnits,
            totalCatalogValue,
            categoryCounts,
        };
    }, [products]);

    // Filter & Sort products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.tags && p.tags.some(t => t.text.toLowerCase().includes(searchQuery.toLowerCase())));
            const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesCat && matchesStatus;
        }).sort((a, b) => {
            if (sortBy === 'points') return (b.bonusPoints || 0) - (a.bonusPoints || 0);
            if (sortBy === 'stock_low') return (a.stock || 0) - (b.stock || 0);
            if (sortBy === 'stock_high') return (b.stock || 0) - (a.stock || 0);
            if (sortBy === 'price_high') {
                const pa = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
                const pb = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
                return pb - pa;
            }
            if (sortBy === 'price_low') {
                const pa = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0;
                const pb = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0;
                return pa - pb;
            }
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
    }, [products, searchQuery, categoryFilter, statusFilter, sortBy]);

    const handleEditProduct = (prod: Product) => {
        setSelectedProduct(prod);
        setEditForm(JSON.parse(JSON.stringify(prod)));
        setIsCreatingNew(false);
        setIsDrawerOpen(true);
    };

    const handleAddNewDrop = () => {
        const rnd = Math.floor(100 + Math.random() * 900);
        setSelectedProduct(null);
        setEditForm({
            id: `drop-${rnd}`,
            name: '',
            price: '₹250.00',
            originalPrice: '₹350.00',
            badge: { text: 'NEW DROP', bg: '#274724' },
            src: '/hoodie-green.png',
            category: 'hoodies',
            description: 'Exclusive streetwear piece engineered for superior fit.',
            tags: [{ text: 'NEW' }, { text: 'OVERSIZED' }],
            filters: ['Black', 'Popular'],
            specs: {
                gsm: '400 GSM',
                fit: 'Relaxed Oversized Drop-Shoulder',
                material: '100% Combed Heavyweight Cotton',
                wash: 'Pre-shrunk silicone soft wash',
                print: 'DTG Multi-layer infusion',
                origin: 'Engineered by BANNNED',
                details: 'Heavy ribbed trims, reinforced inner stitching',
            },
            stock: 50,
            totalPieces: 150,
            status: 'active',
            sku: `BNND-DP-${rnd}`,
            bonusPoints: 100,
            colors: [{ name: 'Pitch Black', hex: '#111111', active: true }],
        });
        setIsCreatingNew(true);
        setIsDrawerOpen(true);
    };

    const handleSaveProduct = async () => {
        if (!editForm.name || !editForm.price) {
            showToast('Product name and price are required', 'error');
            return;
        }
        try {
            setSaving(true);
            if (isCreatingNew) {
                const res = await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editForm),
                });
                const data = await res.json();
                if (data.success) {
                    setProducts(p => [data.product, ...p]);
                    showToast(`Product "${editForm.name}" created!`);
                    setIsDrawerOpen(false);
                } else {
                    showToast(data.error || 'Failed to create product', 'error');
                }
            } else if (selectedProduct) {
                const res = await fetch(`/api/products/${selectedProduct.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editForm),
                });
                const data = await res.json();
                if (data.success) {
                    setProducts(p => p.map(x => (x.id === selectedProduct.id ? data.product : x)));
                    showToast(`Updated "${data.product.name}"!`);
                    setIsDrawerOpen(false);
                } else {
                    showToast(data.error || 'Failed to update', 'error');
                }
            }
        } catch {
            showToast('Network error while saving', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setProducts(p => p.filter(x => x.id !== id));
                showToast(`Deleted "${name}"`);
                if (isDrawerOpen && selectedProduct?.id === id) setIsDrawerOpen(false);
            }
        } catch {
            showToast('Error deleting', 'error');
        }
    };

    const handleDuplicateProduct = async (prod: Product) => {
        const rnd = Math.floor(100 + Math.random() * 900);
        const cloned: Partial<Product> = {
            ...JSON.parse(JSON.stringify(prod)),
            name: `${prod.name} (Copy)`,
            id: `${prod.id}-cp-${rnd}`,
            sku: `${prod.sku}-CP`,
            status: 'draft',
            stock: prod.totalPieces || 50,
        };
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cloned),
            });
            const data = await res.json();
            if (data.success) {
                setProducts(p => [data.product, ...p]);
                showToast(`Cloned "${prod.name}"`);
            }
        } catch {
            showToast('Clone failed', 'error');
        }
    };

    const handleInlineStockChange = async (id: string, delta: number) => {
        const target = products.find(p => p.id === id);
        if (!target) return;
        const newStock = Math.max(0, (target.stock || 0) + delta);
        const newStatus: ProductStatus = newStock === 0 ? 'out_of_stock' : target.status === 'out_of_stock' ? 'active' : target.status;
        setProducts(p => p.map(x => (x.id === id ? { ...x, stock: newStock, status: newStatus } : x)));
        try {
            await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock, status: newStatus }),
            });
        } catch (err) {
            console.error('Stock change failed:', err);
        }
    };

    const handleSavePoints = async (productId: string) => {
        const pts = editingPoints[productId];
        if (pts === undefined) return;
        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bonusPoints: pts }),
            });
            const data = await res.json();
            if (data.success) {
                setProducts(p => p.map(x => (x.id === productId ? { ...x, bonusPoints: pts } : x)));
                const ep = { ...editingPoints };
                delete ep[productId];
                setEditingPoints(ep);
                showToast(`Bonus points saved: ${pts} pts`);
            }
        } catch {
            showToast('Points save failed', 'error');
        }
    };

    const handleSendTestEmail = async () => {
        try {
            setSendingTestEmail(true);
            const res = await fetch('/api/admin/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: 'Aarav Sharma',
                    customerEmail: 'aarav.sharma@example.com',
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('📧 Order notification email dispatched to admin!');
                await loadAnalytics(true);
            } else {
                showToast(data.error || 'Failed to dispatch email', 'error');
            }
        } catch {
            showToast('Failed to trigger email notification', 'error');
        } finally {
            setSendingTestEmail(false);
        }
    };

    // Customer habits bars dynamically computed from real store orders
    const habitBars = useMemo(() => {
        if (richRevenue?.monthlyHabits && richRevenue.monthlyHabits.length > 0) {
            return richRevenue.monthlyHabits.map((h: any) => ({
                month: h.month,
                seen: h.seen,
                sales: h.sales,
                tooltip: {
                    products: `${h.productsCount} Products`,
                    sales: `₹${(h.salesAmount || 0).toLocaleString('en-IN')}`,
                },
            }));
        }
        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
        return mNames.map((m) => ({
            month: m,
            seen: 18,
            sales: 24,
            tooltip: { products: '0 Products', sales: '₹0.00' },
        }));
    }, [richRevenue]);

    return (
        <div className="dd-app-shell">
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className="dd-toast">
                    {toast.type === 'success' ? <CheckCircle size={16} color="#10b981" /> : <AlertCircle size={16} color="#ef4444" />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* ════ LEFT SIDEBAR ════ */}
            <aside className="dd-sidebar">
                <div>
                    {/* Logo matching DealDeck symbol */}
                    <Link href="/" className="dd-logo-row">
                        <div className="dd-logo-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M7 16C7 18.2091 8.79086 20 11 20H15C17.2091 20 19 18.2091 19 16V14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                                <path d="M17 8C17 5.79086 15.2091 4 13 4H9C6.79086 4 5 5.79086 5 8V10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                                <circle cx="12" cy="12" r="3" fill="#3b5bf5" />
                            </svg>
                        </div>
                        <span className="dd-logo-text">DealDeck</span>
                    </Link>

                    {/* MENU GROUP */}
                    <div className="dd-nav-group">
                        <div className="dd-nav-title">MENU</div>
                        <button
                            className={`dd-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </button>
                        <button
                            className={`dd-nav-item ${activeTab === 'report' ? 'active' : ''}`}
                            onClick={() => setActiveTab('report')}
                        >
                            <FileText size={18} />
                            <span>Report</span>
                        </button>
                        <button
                            className={`dd-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                            onClick={() => setActiveTab('products')}
                        >
                            <Package size={18} />
                            <span>Products</span>
                            <span className="dd-nav-badge">{products.length}</span>
                        </button>
                        <button
                            className={`dd-nav-item ${activeTab === 'points' ? 'active' : ''}`}
                            onClick={() => setActiveTab('points')}
                        >
                            <Star size={18} />
                            <span>Consumer</span>
                        </button>
                        <button
                            className={`dd-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('users'); loadUsers(); }}
                        >
                            <Users size={18} />
                            <span>Users</span>
                            <span className="dd-nav-badge">{users.length}</span>
                        </button>
                    </div>

                    {/* FINANCIAL GROUP */}
                    <div className="dd-nav-group">
                        <div className="dd-nav-title">FINANCIAL</div>
                        <button
                            className={`dd-nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('transactions')}
                        >
                            <Receipt size={18} />
                            <span>Transactions</span>
                        </button>
                        <button
                            className={`dd-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <ShoppingBag size={18} />
                            <span>Invoices</span>
                            <span className="dd-nav-badge">{orders.length}</span>
                        </button>
                        <button
                            className={`dd-nav-item ${activeTab === 'emails' ? 'active' : ''}`}
                            onClick={() => setActiveTab('emails')}
                        >
                            <Mail size={18} />
                            <span>Order Emails</span>
                            <span className="dd-nav-badge">{sentEmails.length}</span>
                        </button>
                    </div>

                    {/* TOOLS GROUP */}
                    <div className="dd-nav-group">
                        <div className="dd-nav-title">TOOLS</div>
                        <button
                            className={`dd-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('inventory'); showToast('Store settings configured'); }}
                        >
                            <Sliders size={18} />
                            <span>Settings</span>
                        </button>
                        <button
                            className="dd-nav-item"
                            onClick={() => showToast('Feedback submitted to DealDeck team')}
                        >
                            <MessageSquare size={18} />
                            <span>Feedback</span>
                        </button>
                        <button
                            className="dd-nav-item"
                            onClick={() => showToast('Help Desk: Documentation & 24/7 Live Support')}
                        >
                            <HelpCircle size={18} />
                            <span>Help</span>
                        </button>
                        <Link href="/" target="_blank" className="dd-nav-item" style={{ textDecoration: 'none' }}>
                            <ExternalLink size={18} />
                            <span>Storefront</span>
                        </Link>
                    </div>
                </div>

                {/* Upgrade Pro Card exactly like screenshot */}
                <div className="dd-pro-card">
                    <div className="dd-pro-icon-box">
                        <Sparkles size={16} color="#ffffff" />
                    </div>
                    <div className="dd-pro-title">Upgrade Pro</div>
                    <div className="dd-pro-desc">Discover the benefits of an upgraded account</div>
                    <button className="dd-pro-btn" onClick={() => showToast('Pro Plan: Active with Razorpay')}>
                        Upgrade $30
                    </button>
                </div>
            </aside>

            {/* ════ MAIN CONTENT WORKSPACE ════ */}
            <main className="dd-main-area">
                {/* TOP HEADER ROW */}
                <header className="dd-header">
                    <div className="dd-header-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <h1>
                                {activeTab === 'report' && 'Sales Report'}
                                {activeTab === 'dashboard' && 'Operations Dashboard'}
                                {activeTab === 'products' && 'Product Catalog'}
                                {activeTab === 'points' && 'Consumer & Points'}
                                {activeTab === 'users' && 'Customer Accounts'}
                                {activeTab === 'transactions' && 'Payment Transactions'}
                                {activeTab === 'orders' && 'Invoices & Orders'}
                                {activeTab === 'emails' && 'Order Notifications'}
                                {activeTab === 'inventory' && 'Store Settings'}
                            </h1>
                            <div className="dd-live-pill">
                                <span className="dd-live-pulse-dot" />
                                <span>Realtime Live</span>
                            </div>
                            <button
                                className="dd-pill-badge"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: firebaseStatus?.configured ? '#fff7ed' : '#f8fafc',
                                    color: firebaseStatus?.configured ? '#ea580c' : '#64748b',
                                    border: `1px solid ${firebaseStatus?.configured ? '#fdba74' : '#e2e8f0'}`,
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                                onClick={() => showToast(firebaseStatus?.message || 'Firebase Realtime Database configured via .env.local')}
                                title={firebaseStatus?.databaseUrl || 'Add NEXT_PUBLIC_FIREBASE_DATABASE_URL in .env.local'}
                            >
                                <Flame size={12} color="#f97316" />
                                <span>{firebaseStatus?.configured ? 'Firebase RTDB: Connected' : 'Firebase RTDB: Ready'}</span>
                            </button>
                            <button
                                className="dd-pill-badge"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: resendStatus?.configured ? '#0f172a' : '#f8fafc',
                                    color: resendStatus?.configured ? '#ffffff' : '#64748b',
                                    border: `1px solid ${resendStatus?.configured ? '#1e293b' : '#e2e8f0'}`,
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                                onClick={() => showToast(resendStatus?.configured ? `Resend active (${resendStatus.maskedKey})` : 'Add RESEND_API_KEY in .env.local for live dispatching')}
                                title="Resend Email Delivery Engine"
                            >
                                <Mail size={12} />
                                <span>{resendStatus?.configured ? 'Resend: Active' : 'Resend: Ready'}</span>
                            </button>
                        </div>
                        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>

                    <div className="dd-header-right">
                        <button className="dd-circle-btn" onClick={() => setActiveTab('products')} title="Search Catalog">
                            <Search size={17} />
                        </button>
                        <button className="dd-circle-btn" onClick={() => showToast(orders.length > 0 ? `Total ${orders.length} orders recorded` : 'All store orders synced')} title="Notifications">
                            <Bell size={17} />
                            {orders.length > 0 && <span className="dd-bell-dot" />}
                        </button>

                        {/* Admin Security / Credentials Button */}
                        <button
                            id="admin-security-btn"
                            onClick={() => setShowPasswordModal(true)}
                            title="Admin Credentials & Security"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 7,
                                padding: '8px 14px',
                                background: 'rgba(200, 184, 154, 0.12)',
                                border: '1px solid rgba(200, 184, 154, 0.3)',
                                borderRadius: 10,
                                color: '#c8b89a',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                            }}
                        >
                            <KeyRound size={15} />
                            <span>Security & ID</span>
                        </button>

                        {/* Admin User Info Pill */}
                        <div
                            className="dd-user-pill"
                            onClick={() => setShowPasswordModal(true)}
                            style={{ cursor: 'pointer' }}
                            title="Click to manage admin credentials & security keys"
                        >
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3b5bf5, #1e3a8a)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                border: '1px solid rgba(255,255,255,0.15)',
                                flexShrink: 0,
                            }}>
                                BA
                            </div>
                            <div>
                                <div className="dd-user-info-name">BANNNED Admin</div>
                                <div className="dd-user-info-role" style={{ color: '#c8b89a', fontWeight: 700 }}>
                                    {currentAdminId}
                                </div>
                            </div>
                        </div>

                        {/* Sign Out Button */}
                        <button
                            id="admin-logout-btn"
                            onClick={onSignOut}
                            title="Sign Out of Admin Console"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: 10,
                                color: '#f87171',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                            }}
                        >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </header>

                {/* ════ TAB: REPORT / DASHBOARD (EXACT MATCH TO SCREENSHOT) ════ */}
                {(activeTab === 'report' || activeTab === 'dashboard') && (
                    <div className="dd-report-grid">
                        {/* ── LEFT COLUMN ── */}
                        <div>
                            {/* 4 KPI Metric Cards in 2x2 grid */}
                            <div className="dd-metrics-grid-2x2">
                                {/* CARD 1: Solid Royal Blue Card */}
                                <div className="dd-card dd-card-primary">
                                    <div className="dd-metric-top">
                                        <div className="dd-metric-icon-box">
                                            <FileText size={18} />
                                        </div>
                                        <span className="dd-pill-badge green">
                                            {revenueStats.totalRevenue > 0 ? '+Live' : '₹0.00'}
                                        </span>
                                    </div>
                                    <div className="dd-metric-label">Total Sales</div>
                                    <div className="dd-metric-value">
                                        ₹{(revenueStats.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="dd-metric-subtext">Gross captured store revenue</div>
                                </div>

                                {/* CARD 2: Total Orders */}
                                <div className="dd-card">
                                    <div className="dd-metric-top">
                                        <div className="dd-metric-icon-box">
                                            <Receipt size={18} />
                                        </div>
                                        <span className="dd-pill-badge green">
                                            +{orders.length} Placed
                                        </span>
                                    </div>
                                    <div className="dd-metric-label">Total Orders</div>
                                    <div className="dd-metric-value">
                                        {(revenueStats.totalOrders || orders.filter(o => o.status === 'paid').length || 0).toLocaleString()}
                                    </div>
                                    <div className="dd-metric-subtext">Completed orders via Razorpay</div>
                                </div>

                                {/* CARD 3: Visitor */}
                                <div className="dd-card">
                                    <div className="dd-metric-top">
                                        <div className="dd-metric-icon-box">
                                            <Users size={18} />
                                        </div>
                                        <span className="dd-pill-badge green">+Realtime</span>
                                    </div>
                                    <div className="dd-metric-label">Visitor</div>
                                    <div className="dd-metric-value">
                                        {visitorCount.toLocaleString()}
                                    </div>
                                    <div className="dd-metric-subtext">Live storefront traffic</div>
                                </div>

                                {/* CARD 4: Total Sold Products */}
                                <div className="dd-card">
                                    <div className="dd-metric-top">
                                        <div className="dd-metric-icon-box">
                                            <Truck size={18} />
                                        </div>
                                        <span className="dd-pill-badge green">
                                            +{richRevenue?.totalUnitsSold || 0} Units
                                        </span>
                                    </div>
                                    <div className="dd-metric-label">Total Sold Products</div>
                                    <div className="dd-metric-value">
                                        {(richRevenue?.totalUnitsSold || 0).toLocaleString()}
                                    </div>
                                    <div className="dd-metric-subtext">Units fulfilled across orders</div>
                                </div>
                            </div>

                            {/* CUSTOMER HABBITS DUAL BAR CHART */}
                            <div className="dd-chart-card">
                                <div className="dd-card-header">
                                    <div>
                                        <h3 className="dd-card-title">Customer Habbits</h3>
                                        <p className="dd-card-subtitle">Track your customer habbits</p>
                                    </div>
                                    <select className="dd-select-pill" defaultValue="This year">
                                        <option value="This year">This year</option>
                                        <option value="Last year">Last year</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>

                                {/* Legend */}
                                <div className="dd-legend-row">
                                    <div className="dd-legend-item">
                                        <span className="dd-legend-dot" style={{ backgroundColor: '#cbd5e1' }} />
                                        <span>Seen product</span>
                                    </div>
                                    <div className="dd-legend-item">
                                        <span className="dd-legend-dot" style={{ backgroundColor: '#3b5bf5' }} />
                                        <span>Sales</span>
                                    </div>
                                </div>

                                {/* Chart Body with Y-Axis and horizontal gridlines */}
                                <div className="dd-habits-chart-wrap">
                                    {/* Y-Axis */}
                                    <div className="dd-habits-yaxis">
                                        <span>60K</span>
                                        <span>40K</span>
                                        <span>20K</span>
                                        <span>10K</span>
                                        <span>0K</span>
                                    </div>

                                    {/* Plot Area with Gridlines and Bars */}
                                    <div className="dd-habits-plot">
                                        <div className="dd-chart-gridline" style={{ bottom: '100%' }} />
                                        <div className="dd-chart-gridline" style={{ bottom: '75%' }} />
                                        <div className="dd-chart-gridline" style={{ bottom: '50%' }} />
                                        <div className="dd-chart-gridline" style={{ bottom: '25%' }} />
                                        <div className="dd-chart-gridline" style={{ bottom: '0%' }} />

                                        <div className="dd-barchart-container">
                                            {habitBars.map((bar) => {
                                                const isSelected = hoveredMonth === bar.month;
                                                return (
                                                    <div
                                                        key={bar.month}
                                                        className="dd-bar-group"
                                                        onMouseEnter={() => setHoveredMonth(bar.month)}
                                                        onMouseLeave={() => setHoveredMonth('Apr')}
                                                    >
                                                        {/* Floating Tooltip matching screenshot on Apr or hovered */}
                                                        {isSelected && (
                                                            <div className="dd-floating-tooltip">
                                                                <div className="dd-tooltip-row">
                                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />
                                                                    <span>{bar.tooltip ? bar.tooltip.products : '43.787'} Products</span>
                                                                </div>
                                                                <div className="dd-tooltip-row">
                                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b5bf5' }} />
                                                                    <span>{bar.tooltip ? bar.tooltip.sales : '39.784'} Products</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="dd-bar-pair">
                                                            <div className="dd-pill-bar grey" style={{ height: `${bar.seen}%` }}>
                                                                {bar.month === 'Apr' && <div className="dd-bar-dot-pin" />}
                                                            </div>
                                                            <div className="dd-pill-bar blue" style={{ height: `${bar.sales}%` }} />
                                                        </div>
                                                        <span className="dd-bar-month">{bar.month}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN ── */}
                        <div>
                            {/* PRODUCT STATISTIC CARD */}
                            <div className="dd-card">
                                <div className="dd-card-header">
                                    <div>
                                        <h3 className="dd-card-title">Product Statistic</h3>
                                        <p className="dd-card-subtitle">Track your product sales</p>
                                    </div>
                                    <select className="dd-select-pill" defaultValue="Today">
                                        <option value="Today">Today</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                    </select>
                                </div>

                                {/* Triple Concentric Donut Arcs */}
                                <div className="dd-donut-wrapper">
                                    <svg width="190" height="190" viewBox="0 0 190 190">
                                        {/* Outer Arc - Royal Blue */}
                                        <circle
                                            cx="95"
                                            cy="95"
                                            r="75"
                                            fill="none"
                                            stroke="#3b5bf5"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray="348 472"
                                            transform="rotate(130 95 95)"
                                        />
                                        {/* Middle Arc - Crimson Red */}
                                        <circle
                                            cx="95"
                                            cy="95"
                                            r="58"
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray="235 365"
                                            transform="rotate(145 95 95)"
                                        />
                                        {/* Inner Arc - Soft Grey */}
                                        <circle
                                            cx="95"
                                            cy="95"
                                            r="41"
                                            fill="none"
                                            stroke="#cbd5e1"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray="140 258"
                                            transform="rotate(160 95 95)"
                                        />
                                    </svg>
                                    <div className="dd-donut-center-info">
                                        <span className="dd-donut-center-number">
                                            {richRevenue?.totalUnitsSold ? richRevenue.totalUnitsSold.toLocaleString() : stats.totalProducts}
                                        </span>
                                        <span className="dd-donut-center-label">
                                            {richRevenue?.totalUnitsSold > 0 ? 'Units Sold' : 'Catalog Items'}
                                        </span>
                                        <span className="dd-pill-badge green">
                                            {revenueStats.totalOrders > 0 ? `${revenueStats.totalOrders} Orders` : `${stats.activeProducts} Active`}
                                        </span>
                                    </div>
                                </div>

                                {/* Category list below donut */}
                                <div>
                                    <div className="dd-category-stat-row">
                                        <div className="dd-category-name-group">
                                            <span style={{ color: '#475569', display: 'flex', alignItems: 'center' }}>
                                                <Headphones size={15} />
                                            </span>
                                            <span>Graphic Tees</span>
                                        </div>
                                        <div className="dd-category-values">
                                            <span style={{ fontWeight: 700 }}>{richRevenue?.categorySales?.tees?.units || 0} Sold</span>
                                            <span className="dd-pill-badge green">{stats.categoryCounts['tees'] || 0} In Stock</span>
                                        </div>
                                    </div>
                                    <div className="dd-category-stat-row">
                                        <div className="dd-category-name-group">
                                            <span style={{ color: '#475569', display: 'flex', alignItems: 'center' }}>
                                                <Gamepad2 size={15} />
                                            </span>
                                            <span>Heavy Hoodies</span>
                                        </div>
                                        <div className="dd-category-values">
                                            <span style={{ fontWeight: 700 }}>{richRevenue?.categorySales?.hoodies?.units || 0} Sold</span>
                                            <span className="dd-pill-badge green">{stats.categoryCounts['hoodies'] || 0} In Stock</span>
                                        </div>
                                    </div>
                                    <div className="dd-category-stat-row">
                                        <div className="dd-category-name-group">
                                            <span style={{ color: '#475569', display: 'flex', alignItems: 'center' }}>
                                                <Armchair size={15} />
                                            </span>
                                            <span>Sweatshirts &amp; Caps</span>
                                        </div>
                                        <div className="dd-category-values">
                                            <span style={{ fontWeight: 700 }}>
                                                {(richRevenue?.categorySales?.sweatshirts?.units || 0) + (richRevenue?.categorySales?.caps?.units || 0)} Sold
                                            </span>
                                            <span className="dd-pill-badge green">
                                                {(stats.categoryCounts['sweatshirts'] || 0) + (stats.categoryCounts['caps'] || 0)} In Stock
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CUSTOMER GROWTH CARD */}
                            <div className="dd-card" style={{ marginTop: '20px' }}>
                                <div className="dd-card-header">
                                    <div>
                                        <h3 className="dd-card-title">Customer Growth</h3>
                                        <p className="dd-card-subtitle">Track customer by locations</p>
                                    </div>
                                    <select className="dd-select-pill" defaultValue="Today">
                                        <option value="Today">Today</option>
                                        <option value="Weekly">Weekly</option>
                                    </select>
                                </div>

                                <div className="dd-growth-layout">
                                    {/* Overlapping Blue Bubbles Visual */}
                                    <div className="dd-bubbles-box">
                                        <div className="dd-bubble dd-bubble-4" title="Live Drops in Catalog">{stats.totalProducts}</div>
                                        <div className="dd-bubble dd-bubble-1" title="Unique Customers">{richRevenue?.uniqueCustomers || (orders.length > 0 ? 1 : 0)}</div>
                                        <div className="dd-bubble dd-bubble-2" title="Total Paid Orders">{revenueStats.totalOrders || orders.length || 0}</div>
                                        <div className="dd-bubble dd-bubble-3" title="Avg Order Value">₹{Math.round(revenueStats.avgOrderValue || 0)}</div>
                                    </div>

                                    {/* Countries List with Circular SVG Flags */}
                                    <div>
                                        <div className="dd-location-item">
                                            <div className="dd-flag-circle">
                                                <svg width="20" height="20" viewBox="0 0 24 24">
                                                    <rect width="24" height="24" fill="#b91c1c" />
                                                    <line x1="0" y1="3.7" x2="24" y2="3.7" stroke="#fff" strokeWidth="1.8" />
                                                    <line x1="0" y1="7.4" x2="24" y2="7.4" stroke="#fff" strokeWidth="1.8" />
                                                    <line x1="0" y1="11.1" x2="24" y2="11.1" stroke="#fff" strokeWidth="1.8" />
                                                    <line x1="0" y1="14.8" x2="24" y2="14.8" stroke="#fff" strokeWidth="1.8" />
                                                    <line x1="0" y1="18.5" x2="24" y2="18.5" stroke="#fff" strokeWidth="1.8" />
                                                    <line x1="0" y1="22.2" x2="24" y2="22.2" stroke="#fff" strokeWidth="1.8" />
                                                    <rect width="11" height="11" fill="#1e3a8a" />
                                                    <circle cx="3" cy="3" r="0.9" fill="#fff" />
                                                    <circle cx="8" cy="3" r="0.9" fill="#fff" />
                                                    <circle cx="5.5" cy="5.5" r="0.9" fill="#fff" />
                                                    <circle cx="3" cy="8" r="0.9" fill="#fff" />
                                                    <circle cx="8" cy="8" r="0.9" fill="#fff" />
                                                </svg>
                                            </div>
                                            <span className="dd-location-name">United States</span>
                                            <div className="dd-location-bar">
                                                <div className="dd-location-fill" style={{ width: '82%' }} />
                                            </div>
                                        </div>
                                        <div className="dd-location-item">
                                            <div className="dd-flag-circle">
                                                <svg width="20" height="20" viewBox="0 0 24 24">
                                                    <rect width="24" height="8" fill="#111827" />
                                                    <rect y="8" width="24" height="8" fill="#dc2626" />
                                                    <rect y="16" width="24" height="8" fill="#facc15" />
                                                </svg>
                                            </div>
                                            <span className="dd-location-name">Germany</span>
                                            <div className="dd-location-bar">
                                                <div className="dd-location-fill" style={{ width: '65%' }} />
                                            </div>
                                        </div>
                                        <div className="dd-location-item">
                                            <div className="dd-flag-circle">
                                                <svg width="20" height="20" viewBox="0 0 24 24">
                                                    <rect width="24" height="24" fill="#1e3a8a" />
                                                    <path d="M0 0 L11 11 M11 0 L0 11" stroke="#fff" strokeWidth="2.4" />
                                                    <path d="M0 0 L11 11 M11 0 L0 11" stroke="#dc2626" strokeWidth="1.2" />
                                                    <path d="M5.5 0 V11 M0 5.5 H11" stroke="#fff" strokeWidth="3" />
                                                    <path d="M5.5 0 V11 M0 5.5 H11" stroke="#dc2626" strokeWidth="1.6" />
                                                    <circle cx="17" cy="4" r="0.9" fill="#fff" />
                                                    <circle cx="20" cy="9" r="0.9" fill="#fff" />
                                                    <circle cx="16" cy="11" r="0.9" fill="#fff" />
                                                    <circle cx="18" cy="16" r="1.1" fill="#fff" />
                                                    <circle cx="6" cy="18" r="1.4" fill="#fff" />
                                                </svg>
                                            </div>
                                            <span className="dd-location-name">Australia</span>
                                            <div className="dd-location-bar">
                                                <div className="dd-location-fill" style={{ width: '48%' }} />
                                            </div>
                                        </div>
                                        <div className="dd-location-item">
                                            <div className="dd-flag-circle">
                                                <svg width="20" height="20" viewBox="0 0 24 24">
                                                    <rect width="8" height="24" fill="#1d4ed8" />
                                                    <rect x="8" width="8" height="24" fill="#ffffff" />
                                                    <rect x="16" width="8" height="24" fill="#dc2626" />
                                                </svg>
                                            </div>
                                            <span className="dd-location-name">France</span>
                                            <div className="dd-location-bar">
                                                <div className="dd-location-fill" style={{ width: '30%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════ TAB: PRODUCTS ════ */}
                {activeTab === 'products' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Product Catalog</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--dd-text-faint)', margin: '2px 0 0' }}>Manage drops, pricing, inventory and imagery</p>
                            </div>
                            <button className="dd-btn-primary" onClick={handleAddNewDrop}>
                                <Plus size={15} />
                                <span>Add New Product</span>
                            </button>
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--dd-border-strong)', flex: 1, minWidth: '220px' }}>
                                <Search size={15} color="var(--dd-text-faint)" />
                                <input
                                    type="text"
                                    placeholder="Search title, SKU, tag..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.85rem' }}
                                />
                            </div>
                            <select
                                className="dd-select-pill"
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                            >
                                <option value="all">All Categories</option>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                            <select
                                className="dd-select-pill"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="newest">Sort: Newest</option>
                                <option value="points">Sort: Bonus Points</option>
                                <option value="price_high">Sort: Price High-Low</option>
                                <option value="price_low">Sort: Price Low-High</option>
                            </select>
                        </div>

                        {/* Table */}
                        <div className="dd-table-container">
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Bonus Points</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img src={p.src} alt={p.name} style={{ width: 42, height: 42, borderRadius: '10px', objectFit: 'cover' }} />
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--dd-text-faint)' }}>{p.sku}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textTransform: 'capitalize', color: 'var(--dd-text-muted)' }}>{p.category}</td>
                                            <td><strong style={{ fontFamily: 'var(--dd-font-mono)', color: 'var(--dd-primary)' }}>{p.price}</strong></td>
                                            <td>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '8px' }}>
                                                    <button onClick={() => handleInlineStockChange(p.id, -1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>-</button>
                                                    <span style={{ fontWeight: 700, fontSize: '0.82rem', minWidth: '20px', textAlign: 'center' }}>{p.stock}</span>
                                                    <button onClick={() => handleInlineStockChange(p.id, 1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>+</button>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: 700, fontSize: '0.82rem' }}>
                                                    <Star size={13} fill="#f59e0b" />
                                                    {p.bonusPoints || 0} pts
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`dd-pill-badge ${p.status === 'active' ? 'green' : 'red'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button className="dd-btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleEditProduct(p)}>
                                                        <Edit3 size={13} />
                                                    </button>
                                                    <button className="dd-btn-secondary" style={{ padding: '6px 10px' }} onClick={() => handleDuplicateProduct(p)}>
                                                        <Copy size={13} />
                                                    </button>
                                                    <button className="dd-btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeleteProduct(p.id, p.name)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ════ TAB: POINTS SYSTEM ════ */}
                {activeTab === 'points' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Product Points Manager</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--dd-text-faint)', margin: '2px 0 0' }}>
                                    Higher points rank items higher in the customer-facing store
                                </p>
                            </div>
                        </div>

                        <div className="dd-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderColor: '#fde68a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Star size={20} fill="#f59e0b" color="#f59e0b" />
                                <div>
                                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>Admin Bonus Points System</div>
                                    <div style={{ fontSize: '0.78rem', color: '#b45309' }}>
                                        Adjust points from 0 to 1000. Products with the highest points appear first in the customer storefront.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dd-table-container">
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th style={{ textAlign: 'center' }}>Points (0-1000)</th>
                                        <th style={{ textAlign: 'center' }}>Quick Boost</th>
                                        <th style={{ textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...products]
                                        .sort((a, b) => (b.bonusPoints || 0) - (a.bonusPoints || 0))
                                        .map((p, rIdx) => {
                                            const pts = editingPoints[p.id] !== undefined ? editingPoints[p.id] : (p.bonusPoints || 0);
                                            const isDirty = editingPoints[p.id] !== undefined;
                                            return (
                                                <tr key={p.id}>
                                                    <td>
                                                        <strong style={{ color: rIdx === 0 ? '#f59e0b' : 'var(--dd-text-muted)' }}>
                                                            #{rIdx + 1}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <img src={p.src} alt={p.name} style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover' }} />
                                                            <div>
                                                                <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--dd-text-faint)' }}>{p.sku}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                                                    <td><strong style={{ fontFamily: 'var(--dd-font-mono)' }}>{p.price}</strong></td>
                                                    <td style={{ minWidth: '160px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="1000"
                                                                className="dd-points-input"
                                                                value={pts}
                                                                onChange={e => setEditingPoints({
                                                                    ...editingPoints,
                                                                    [p.id]: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0))
                                                                })}
                                                            />
                                                            <div className="dd-points-bar-wrap" style={{ width: 100 }}>
                                                                <div className="dd-points-bar-fill" style={{ width: `${(pts / 1000) * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button className="dd-btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }} onClick={() => setEditingPoints({ ...editingPoints, [p.id]: Math.min(1000, pts + 50) })}>+50</button>
                                                            <button className="dd-btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }} onClick={() => setEditingPoints({ ...editingPoints, [p.id]: Math.min(1000, pts + 200) })}>+200</button>
                                                            <button className="dd-btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }} onClick={() => setEditingPoints({ ...editingPoints, [p.id]: 1000 })}>Max</button>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {isDirty ? (
                                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                <button className="dd-btn-primary" style={{ padding: '5px 10px', fontSize: '0.75rem' }} onClick={() => handleSavePoints(p.id)}>
                                                                    Save
                                                                </button>
                                                                <button className="dd-btn-secondary" style={{ padding: '5px 8px' }} onClick={() => { const ep = { ...editingPoints }; delete ep[p.id]; setEditingPoints(ep); }}>
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.78rem', color: pts > 0 ? '#f59e0b' : 'var(--dd-text-faint)', fontWeight: 600 }}>
                                                                {pts > 0 ? `${pts} pts` : '—'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ════ TAB: INVOICES / ORDERS ════ */}
                {activeTab === 'orders' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Customer Invoices &amp; Orders</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--dd-text-faint)', margin: '2px 0 0' }}>Captured via Razorpay Payment Gateway</p>
                            </div>
                            <button className="dd-btn-secondary" onClick={loadAnalytics}>
                                Refresh
                            </button>
                        </div>

                        <div className="dd-table-container">
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Razorpay Payment ID</th>
                                        <th>Date</th>
                                        <th style={{ textAlign: 'right' }}>Tax Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--dd-text-faint)' }}>
                                                No customer orders recorded yet. Make a purchase on the storefront to test.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map(o => (
                                            <tr key={o.id}>
                                                <td><code style={{ color: 'var(--dd-primary)', fontWeight: 700 }}>{o.id}</code></td>
                                                <td>
                                                    <div style={{ fontWeight: 700 }}>{o.customerName}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--dd-text-faint)' }}>{o.customerEmail}</div>
                                                </td>
                                                <td style={{ fontSize: '0.8rem' }}>{o.items?.map(it => `${it.productName} (x${it.quantity})`).join(', ') || '1 item'}</td>
                                                <td><strong style={{ fontFamily: 'var(--dd-font-mono)', color: '#16a34a' }}>₹{o.totalAmount?.toLocaleString('en-IN')}</strong></td>
                                                <td><span className={`dd-pill-badge ${o.status === 'paid' ? 'green' : 'red'}`}>{o.status}</span></td>
                                                <td><code style={{ fontSize: '0.75rem' }}>{o.razorpayPaymentId || '—'}</code></td>
                                                <td style={{ fontSize: '0.75rem', color: 'var(--dd-text-faint)' }}>{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            className="dd-btn-primary"
                                                            style={{ padding: '5px 11px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                            onClick={() => setSelectedInvoiceOrder(o)}
                                                            title="View & Print Official Tax Invoice"
                                                        >
                                                            <Receipt size={13} />
                                                            <span>Invoice</span>
                                                        </button>
                                                        <button
                                                            className="dd-btn-secondary"
                                                            style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                                            onClick={() => handleSendInvoiceEmail(o.id, o.customerEmail)}
                                                            disabled={sendingInvoice}
                                                            title="Send Tax Invoice via Resend"
                                                        >
                                                            <Send size={12} />
                                                            <span>Email</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ════ TAB: TRANSACTIONS ════ */}
                {activeTab === 'transactions' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Razorpay Transactions</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--dd-text-faint)', margin: '2px 0 0' }}>Captured payment intents</p>
                            </div>
                        </div>

                        <div className="dd-table-container">
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Txn ID</th>
                                        <th>Order Ref</th>
                                        <th>Payment ID</th>
                                        <th>Amount</th>
                                        <th>Customer</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                        <th>Captured Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--dd-text-faint)' }}>
                                                No captured transactions yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map(t => (
                                            <tr key={t.id}>
                                                <td><code>{t.id}</code></td>
                                                <td>{t.orderId}</td>
                                                <td><code style={{ color: 'var(--dd-primary)' }}>{t.razorpayPaymentId}</code></td>
                                                <td><strong style={{ fontFamily: 'var(--dd-font-mono)' }}>₹{t.amount?.toLocaleString('en-IN')}</strong></td>
                                                <td>{t.customerEmail}</td>
                                                <td><span className="dd-pill-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{t.method}</span></td>
                                                <td><span className="dd-pill-badge green">Captured</span></td>
                                                <td style={{ fontSize: '0.75rem', color: 'var(--dd-text-faint)' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ════ TAB: INVENTORY ════ */}
                {activeTab === 'inventory' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Stock &amp; Inventory Matrix</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--dd-text-faint)', margin: '2px 0 0' }}>Adjust batch quantities</p>
                            </div>
                        </div>

                        <div className="dd-table-container">
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Edition Size</th>
                                        <th>In Stock</th>
                                        <th>Stock Ratio</th>
                                        <th>Status</th>
                                        <th>Adjust Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
                                        const pct = Math.min(100, Math.round(((p.stock || 0) / (p.totalPieces || 100)) * 100));
                                        return (
                                            <tr key={p.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <img src={p.src} alt={p.name} style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover' }} />
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--dd-text-faint)' }}>{p.sku}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{p.totalPieces || 200} units</td>
                                                <td><strong style={{ fontFamily: 'var(--dd-font-mono)' }}>{p.stock} units</strong></td>
                                                <td style={{ minWidth: 120 }}>
                                                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ width: `${pct}%`, height: '100%', background: pct > 40 ? 'var(--dd-primary)' : '#ef4444' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--dd-text-faint)' }}>{pct}%</span>
                                                </td>
                                                <td><span className={`dd-pill-badge ${p.status === 'active' ? 'green' : 'red'}`}>{p.status}</span></td>
                                                <td>
                                                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                                                        <button className="dd-btn-secondary" style={{ padding: '3px 8px' }} onClick={() => handleInlineStockChange(p.id, -5)}>-5</button>
                                                        <button className="dd-btn-secondary" style={{ padding: '3px 8px' }} onClick={() => handleInlineStockChange(p.id, 1)}>+1</button>
                                                        <button className="dd-btn-secondary" style={{ padding: '3px 8px' }} onClick={() => handleInlineStockChange(p.id, 10)}>+10</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ════ TAB: ORDER NOTIFICATION EMAILS ════ */}
                {activeTab === 'emails' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Dispatched Order Emails</h2>
                                    <span className="dd-pill-badge green" style={{ padding: '3px 10px' }}>
                                        {sentEmails.length} Sent
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--dd-text-faint)', margin: '4px 0 0' }}>
                                    Automated order alerts dispatched to store admin upon customer payment
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="dd-btn-secondary"
                                    onClick={() => loadAnalytics(false)}
                                    title="Reload sent email logs"
                                >
                                    <RotateCcw size={14} />
                                    <span>Refresh Logs</span>
                                </button>
                                <button
                                    className="dd-btn-primary"
                                    onClick={handleSendTestEmail}
                                    disabled={sendingTestEmail}
                                >
                                    <Mail size={14} />
                                    <span>{sendingTestEmail ? 'Sending...' : 'Send Test Order Email'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Informational banner */}
                        <div className="dd-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderColor: '#bfdbfe' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#3b5bf5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Mail size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.9rem' }}>Real-time Admin Order Dispatch Engine</div>
                                    <div style={{ fontSize: '0.78rem', color: '#3b82f6', marginTop: '2px' }}>
                                        Recipient: <strong>admin@bannned.store</strong> (Configurable via <code>ADMIN_EMAIL</code> / <code>RESEND_API_KEY</code>). All customer orders automatically log a copy here and alert the admin terminal.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dd-table-container">
                            <table className="dd-table">
                                <thead>
                                    <tr>
                                        <th>Email ID</th>
                                        <th>Order ID</th>
                                        <th>Recipient</th>
                                        <th>Subject</th>
                                        <th>Delivery Status</th>
                                        <th>Date &amp; Time</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sentEmails.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--dd-text-faint)' }}>
                                                <Mail size={32} style={{ margin: '0 auto 10px', opacity: 0.4, display: 'block' }} />
                                                No notification emails logged yet. Click &quot;Send Test Order Email&quot; or place a checkout order.
                                            </td>
                                        </tr>
                                    ) : (
                                        sentEmails.map(em => (
                                            <tr key={em.id}>
                                                <td><code style={{ fontSize: '0.75rem', color: 'var(--dd-text-muted)' }}>{em.id}</code></td>
                                                <td><code style={{ color: 'var(--dd-primary)', fontWeight: 700 }}>{em.orderId}</code></td>
                                                <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{em.recipient}</td>
                                                <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 600 }}>
                                                    {em.subject}
                                                </td>
                                                <td>
                                                    <span className={`dd-pill-badge ${em.status === 'delivered' ? 'green' : 'blue'}`}>
                                                        {em.provider === 'resend' ? 'Delivered via Resend' : 'Simulated (Logged)'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.75rem', color: 'var(--dd-text-faint)' }}>
                                                    {new Date(em.sentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        className="dd-btn-secondary"
                                                        style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                                                        onClick={() => setSelectedEmailPreview(em)}
                                                    >
                                                        <Eye size={12} />
                                                        <span>Preview HTML</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ════ TAB: CUSTOMER ACCOUNTS (USERS) ════ */}
                {activeTab === 'users' && (
                    <div>
                        {/* Header Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--dd-text-main)' }}>Customer Accounts</h2>
                                <p style={{ fontSize: '0.82rem', color: 'var(--dd-text-muted)', margin: '4px 0 0' }}>
                                    All authenticated users and store buyers synced across Firebase &amp; Razorpay orders
                                </p>
                            </div>
                            <button
                                className="dd-btn-primary"
                                onClick={loadUsers}
                                disabled={loadingUsers}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', opacity: loadingUsers ? 0.7 : 1 }}
                            >
                                <RotateCcw size={15} style={{ animation: loadingUsers ? 'spin 1s linear infinite' : 'none' }} />
                                <span>{loadingUsers ? 'Syncing...' : 'Refresh'}</span>
                            </button>
                        </div>

                        {/* Metric Stat Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
                            {[
                                { label: 'Total Customers', value: userStats.total || users.length || 0, icon: '👥', color: '#3b5bf5', bg: '#eff6ff' },
                                { label: 'Complete Profiles', value: userStats.profileComplete || 0, icon: '✅', color: '#10b981', bg: '#ecfdf5' },
                                { label: 'Google Auth', value: userStats.googleUsers || 0, icon: '🔵', color: '#4285F4', bg: '#eff6ff' },
                                { label: 'Phone & Guest', value: (userStats.phoneUsers || 0) + (userStats.guestUsers || 0), icon: '📱', color: '#f59e0b', bg: '#fffbeb' },
                                { label: 'Total Orders', value: (userStats.totalOrders || 0).toLocaleString('en-IN'), icon: '🛍', color: '#8b5cf6', bg: '#f5f3ff' },
                                { label: 'Total Points Issued', value: (userStats.totalLoyaltyPoints || 0).toLocaleString('en-IN'), icon: '⭐', color: '#f59e0b', bg: '#fffbeb' },
                            ].map(card => (
                                <div
                                    key={card.label}
                                    style={{
                                        background: 'var(--dd-bg-card)',
                                        border: '1px solid var(--dd-border)',
                                        borderRadius: 16,
                                        padding: '16px 18px',
                                        boxShadow: 'var(--dd-shadow-card)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                            {card.icon}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color, letterSpacing: '-0.5px' }}>
                                        {card.value}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--dd-text-muted)', fontWeight: 600, marginTop: 4 }}>
                                        {card.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Search & Method Filter Toolbar */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--dd-bg-card)', padding: '9px 16px', borderRadius: 12, border: '1px solid var(--dd-border-strong)', flex: 1, minWidth: 260, boxShadow: 'var(--dd-shadow-card)' }}>
                                <Search size={16} color="var(--dd-text-faint)" />
                                <input
                                    type="text"
                                    placeholder="Search by customer name, email, phone, city, username..."
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.88rem', color: 'var(--dd-text-main)', fontFamily: 'inherit' }}
                                />
                                {userSearch && (
                                    <button
                                        onClick={() => setUserSearch('')}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--dd-text-muted)' }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <select
                                className="dd-select-pill"
                                value={userFilter}
                                onChange={e => setUserFilter(e.target.value as any)}
                                style={{ height: '42px', paddingRight: '28px' }}
                            >
                                <option value="all">All Methods ({users.length})</option>
                                <option value="google">Google Auth ({userStats.googleUsers || 0})</option>
                                <option value="phone">Phone Auth ({userStats.phoneUsers || 0})</option>
                                <option value="email">Email Auth ({userStats.emailUsers || 0})</option>
                                <option value="guest">Store Orders ({userStats.guestUsers || 0})</option>
                            </select>
                        </div>

                        {/* Customer Accounts Table */}
                        <div className="dd-table-container" style={{ background: 'var(--dd-bg-card)', borderRadius: 16, border: '1px solid var(--dd-border)', boxShadow: 'var(--dd-shadow-card)', overflow: 'hidden' }}>
                            <table className="dd-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--dd-bg-card-subtle)', borderBottom: '1px solid var(--dd-border)' }}>
                                        {['Customer', 'Auth Method', 'Contact', 'Profile Status', 'Location', 'Orders & Spent', 'Loyalty Points', 'Joined', 'Actions'].map(h => (
                                            <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--dd-text-muted)', letterSpacing: '0.6px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users
                                        .filter(u => {
                                            if (userFilter !== 'all' && u.provider !== userFilter) return false;
                                            const q = userSearch.toLowerCase().trim();
                                            if (!q) return true;
                                            const name = String(u.fullName || u.displayName || '').toLowerCase();
                                            const email = String(u.email || '').toLowerCase();
                                            const uname = String(u.username || '').toLowerCase();
                                            const phone = String(u.phone || '');
                                            const city = String(u.city || '').toLowerCase();
                                            const state = String(u.state || '').toLowerCase();
                                            return name.includes(q) || email.includes(q) || uname.includes(q) || phone.includes(q) || city.includes(q) || state.includes(q);
                                        })
                                        .map((u, idx) => {
                                            const displayName = String(u.fullName || u.displayName || 'Store Customer');
                                            const initials = displayName.trim().split(/\s+/).filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
                                            const providerColors: Record<string, { bg: string; color: string; label: string }> = {
                                                google: { bg: 'rgba(66, 133, 244, 0.1)', color: '#2563eb', label: '🔵 Google' },
                                                phone: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', label: '📱 Phone' },
                                                email: { bg: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', label: '✉ Email' },
                                                guest: { bg: 'rgba(100, 116, 139, 0.1)', color: '#475569', label: '🛍 Buyer' },
                                            };
                                            const prov = providerColors[u.provider] || { bg: 'rgba(100, 116, 139, 0.1)', color: '#475569', label: u.provider || 'Customer' };
                                            const editedPts = editingUserPoints[u.uid] !== undefined ? editingUserPoints[u.uid] : (Number(u.loyaltyPoints) || 0);

                                            return (
                                                <tr
                                                    key={u.uid || `user-${idx}`}
                                                    style={{ borderBottom: '1px solid var(--dd-border)', transition: 'background 0.15s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--dd-bg-hover)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    {/* User Identity */}
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                                            {u.photoURL ? (
                                                                <img src={u.photoURL} alt={displayName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                                                            ) : (
                                                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3b5bf5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', flexShrink: 0, boxShadow: '0 2px 6px rgba(59, 91, 245, 0.25)' }}>
                                                                    {initials}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--dd-text-main)' }}>{displayName}</div>
                                                                {u.username ? (
                                                                    <div style={{ fontSize: '0.72rem', color: 'var(--dd-text-muted)' }}>@{u.username}</div>
                                                                ) : (
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--dd-text-faint)', fontFamily: 'var(--dd-font-mono)' }}>{String(u.uid || '').slice(0, 14)}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Auth Method */}
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: prov.color, background: prov.bg, padding: '4px 11px', borderRadius: 20, whiteSpace: 'nowrap', display: 'inline-block' }}>
                                                            {prov.label}
                                                        </span>
                                                    </td>

                                                    {/* Contact */}
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <div style={{ fontSize: '0.84rem', color: 'var(--dd-text-main)', fontWeight: 500 }}>{u.email || '—'}</div>
                                                        {u.phone && <div style={{ fontSize: '0.74rem', color: 'var(--dd-text-muted)', marginTop: 2 }}>{u.phone}</div>}
                                                    </td>

                                                    {/* Profile Status */}
                                                    <td style={{ padding: '14px 16px' }}>
                                                        {u.profileComplete ? (
                                                            <span className="dd-pill-badge green" style={{ fontSize: '0.75rem', fontWeight: 700 }}>✓ Complete</span>
                                                        ) : (
                                                            <span className="dd-pill-badge" style={{ fontSize: '0.75rem', fontWeight: 700, background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' }}>Pending</span>
                                                        )}
                                                    </td>

                                                    {/* Location */}
                                                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--dd-text-muted)' }}>
                                                        {u.city && u.state ? `${u.city}, ${u.state}` : u.city || u.state || '—'}
                                                    </td>

                                                    {/* Orders & Spent */}
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dd-text-main)' }}>
                                                            {u.totalOrders ? `${u.totalOrders} order${u.totalOrders > 1 ? 's' : ''}` : '0 orders'}
                                                        </div>
                                                        {u.totalSpent ? (
                                                            <div style={{ fontSize: '0.74rem', color: 'var(--dd-primary)', fontWeight: 600, fontFamily: 'var(--dd-font-mono)' }}>
                                                                ₹{Number(u.totalSpent).toLocaleString('en-IN')}
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--dd-text-faint)' }}>₹0</div>
                                                        )}
                                                    </td>

                                                    {/* Loyalty Points — Editable */}
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                value={editedPts}
                                                                onChange={e => setEditingUserPoints(prev => ({ ...prev, [u.uid]: parseInt(e.target.value) || 0 }))}
                                                                style={{ width: 68, padding: '5px 8px', background: 'var(--dd-bg-shell)', border: '1px solid var(--dd-border-strong)', borderRadius: 8, color: 'var(--dd-text-main)', fontFamily: 'inherit', fontSize: '0.84rem', outline: 'none' }}
                                                            />
                                                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>pts</span>
                                                            {editingUserPoints[u.uid] !== undefined && editingUserPoints[u.uid] !== u.loyaltyPoints && (
                                                                <button
                                                                    onClick={() => handleSaveUserPoints(u.uid)}
                                                                    disabled={savingUserPoints[u.uid]}
                                                                    style={{ padding: '4px 10px', background: 'var(--dd-primary)', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(59, 91, 245, 0.3)' }}
                                                                >
                                                                    {savingUserPoints[u.uid] ? '...' : 'Save'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Joined Date */}
                                                    <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: 'var(--dd-text-muted)', whiteSpace: 'nowrap' }}>
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                    </td>

                                                    {/* Actions */}
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(u.uid || u.email || '');
                                                                showToast(`UID copied: ${String(u.uid || '').slice(0, 10)}...`);
                                                            }}
                                                            style={{ padding: '6px 10px', background: 'var(--dd-bg-shell)', border: '1px solid var(--dd-border)', borderRadius: 8, color: 'var(--dd-text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
                                                            title="Copy User UID"
                                                        >
                                                            <Copy size={12} />
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>UID</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>

                            {/* Loading State */}
                            {loadingUsers && users.length === 0 && (
                                <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--dd-text-muted)' }}>
                                    <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid var(--dd-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                                    <div style={{ fontWeight: 700, color: 'var(--dd-text-main)', marginBottom: 4 }}>Loading Customer Accounts...</div>
                                    <div style={{ fontSize: '0.82rem' }}>Syncing with Firebase Authentication and Store Orders</div>
                                </div>
                            )}

                            {/* Empty Database State */}
                            {!loadingUsers && users.length === 0 && (
                                <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--dd-text-muted)' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59, 91, 245, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--dd-primary)' }}>
                                        <Users size={28} />
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--dd-text-main)', marginBottom: 6 }}>No Customers Registered Yet</div>
                                    <div style={{ fontSize: '0.85rem', maxWidth: 420, margin: '0 auto' }}>
                                        Customer profiles will automatically appear here once buyers place orders or authenticate via Google, Phone, or Email.
                                    </div>
                                </div>
                            )}

                            {/* No Search Matches */}
                            {!loadingUsers && users.length > 0 && users.filter(u => {
                                if (userFilter !== 'all' && u.provider !== userFilter) return false;
                                const q = userSearch.toLowerCase().trim();
                                if (!q) return true;
                                const name = String(u.fullName || u.displayName || '').toLowerCase();
                                const email = String(u.email || '').toLowerCase();
                                const uname = String(u.username || '').toLowerCase();
                                const phone = String(u.phone || '');
                                const city = String(u.city || '').toLowerCase();
                                const state = String(u.state || '').toLowerCase();
                                return name.includes(q) || email.includes(q) || uname.includes(q) || phone.includes(q) || city.includes(q) || state.includes(q);
                            }).length === 0 && (
                                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--dd-text-muted)' }}>
                                    <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔍</div>
                                    <div style={{ fontWeight: 700, color: 'var(--dd-text-main)', marginBottom: 4 }}>No matching customers found</div>
                                    <div style={{ fontSize: '0.82rem', marginBottom: 16 }}>No accounts match "{userSearch}".</div>
                                    <button
                                        onClick={() => { setUserSearch(''); setUserFilter('all'); }}
                                        className="dd-btn-secondary"
                                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                                    >
                                        Clear Search &amp; Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* ════ PRODUCT EDIT / CREATE DRAWER MODAL ════ */}
            {isDrawerOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                    onClick={() => setIsDrawerOpen(false)}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '480px',
                            background: '#ffffff',
                            height: '100vh',
                            boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto',
                            padding: '24px',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                                    {isCreatingNew ? 'Add New Product' : `Edit "${editForm.name}"`}
                                </h3>
                                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--dd-text-faint)' }}>
                                    Configure drop specifications and details
                                </p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                <X size={20} color="var(--dd-text-muted)" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dd-text-muted)', marginBottom: '4px' }}>Title *</label>
                                <input
                                    type="text"
                                    value={editForm.name || ''}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--dd-border-strong)', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dd-text-muted)', marginBottom: '4px' }}>Price (INR) *</label>
                                    <input
                                        type="text"
                                        value={editForm.price || ''}
                                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--dd-border-strong)', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dd-text-muted)', marginBottom: '4px' }}>Bonus Points (0-1000)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1000"
                                        value={editForm.bonusPoints ?? 0}
                                        onChange={e => setEditForm({ ...editForm, bonusPoints: Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)) })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--dd-border-strong)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dd-text-muted)', marginBottom: '4px' }}>Category</label>
                                    <select
                                        value={editForm.category || 'hoodies'}
                                        onChange={e => setEditForm({ ...editForm, category: e.target.value as ProductCategory })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--dd-border-strong)', outline: 'none' }}
                                    >
                                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dd-text-muted)', marginBottom: '4px' }}>Stock Qty</label>
                                    <input
                                        type="number"
                                        value={editForm.stock ?? 50}
                                        onChange={e => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--dd-border-strong)', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dd-text-muted)', marginBottom: '4px' }}>Image Asset</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                                    {STORE_ASSETS.map(asset => (
                                        <button
                                            type="button"
                                            key={asset.path}
                                            onClick={() => setEditForm({ ...editForm, src: asset.path })}
                                            style={{
                                                padding: '2px',
                                                borderRadius: '8px',
                                                border: editForm.src === asset.path ? '2px solid var(--dd-primary)' : '1px solid var(--dd-border-strong)',
                                                background: '#f8fafc',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <img src={asset.path} alt={asset.label} style={{ width: '100%', height: 38, objectFit: 'cover', borderRadius: '6px' }} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dd-text-muted)', marginBottom: '4px' }}>Description</label>
                                <textarea
                                    rows={3}
                                    value={editForm.description || ''}
                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--dd-border-strong)', outline: 'none', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--dd-border)' }}>
                            <button className="dd-btn-secondary" style={{ flex: 1 }} onClick={() => setIsDrawerOpen(false)}>
                                Cancel
                            </button>
                            <button className="dd-btn-primary" style={{ flex: 1 }} onClick={handleSaveProduct} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ EMAIL PREVIEW MODAL ════ */}
            {selectedEmailPreview && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.55)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                    }}
                    onClick={() => setSelectedEmailPreview(null)}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '680px',
                            maxHeight: '90vh',
                            background: '#ffffff',
                            borderRadius: '20px',
                            boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--dd-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--dd-text-faint)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Admin Notification Receipt</div>
                                <h3 style={{ margin: '3px 0 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--dd-text-main)' }}>{selectedEmailPreview.subject}</h3>
                                <div style={{ fontSize: '0.74rem', color: 'var(--dd-text-muted)', marginTop: '2px' }}>
                                    Delivered to: <strong style={{ color: 'var(--dd-primary)' }}>{selectedEmailPreview.recipient}</strong> • {new Date(selectedEmailPreview.sentAt).toLocaleString()}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEmailPreview(null)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px' }}
                            >
                                <X size={20} color="var(--dd-text-muted)" />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#0b0f17' }}>
                            <iframe
                                title="Admin Notification Preview"
                                srcDoc={selectedEmailPreview.html}
                                style={{
                                    width: '100%',
                                    height: '520px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    background: '#0b0f17',
                                }}
                            />
                        </div>
                        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--dd-border-strong)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--dd-text-faint)' }}>
                                Provider: <strong>{selectedEmailPreview.provider}</strong> • Order <strong>{selectedEmailPreview.orderId}</strong>
                            </span>
                            <button className="dd-btn-secondary" onClick={() => setSelectedEmailPreview(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ OFFICIAL TAX INVOICE MODAL ════ */}
            {selectedInvoiceOrder && (
                <div
                    className="dd-invoice-modal-backdrop"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        overflowY: 'auto',
                    }}
                    onClick={() => setSelectedInvoiceOrder(null)}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '820px',
                            maxHeight: '94vh',
                            background: '#ffffff',
                            borderRadius: '24px',
                            boxShadow: '0 30px 70px rgba(15, 23, 42, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header & Controls (Hidden in Print) */}
                        <div
                            className="dd-modal-header-controls"
                            style={{
                                padding: '16px 24px',
                                borderBottom: '1px solid var(--dd-border-strong)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#f8fafc',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Receipt size={18} color="var(--dd-primary)" />
                                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Official Tax Invoice Preview</span>
                                <span className="dd-pill-badge green">Verified</span>
                            </div>

                            <div className="dd-modal-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    className="dd-btn-primary"
                                    style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    onClick={() => window.print()}
                                    title="Print or Save as PDF"
                                >
                                    <Printer size={15} />
                                    <span>Print / Save PDF</span>
                                </button>
                                <button
                                    className="dd-btn-secondary"
                                    style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    onClick={() => handleSendInvoiceEmail(selectedInvoiceOrder.id, selectedInvoiceOrder.customerEmail)}
                                    disabled={sendingInvoice}
                                    title="Email copy to customer"
                                >
                                    <Send size={14} />
                                    <span>{sendingInvoice ? 'Sending...' : 'Send via Resend'}</span>
                                </button>
                                <button
                                    onClick={() => setSelectedInvoiceOrder(null)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px', marginLeft: '6px' }}
                                >
                                    <X size={20} color="var(--dd-text-muted)" />
                                </button>
                            </div>
                        </div>

                        {/* Printable Invoice Sheet */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f1f5f9' }}>
                            <div className="dd-invoice-sheet">
                                {/* Top Branding & Status */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '2px solid #0f172a' }}>
                                    <div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1px', color: '#0f172a' }}>BANNNED</div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--dd-primary)', textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '2px' }}>
                                            Apparel &amp; Streetwear Studio
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', lineHeight: 1.4 }}>
                                            100ft Road, Indiranagar, Bengaluru, KA 560038<br />
                                            GSTIN: <strong>29AAACB1234F1Z8</strong> • PAN: AACB1234F<br />
                                            Contact: orders@bannned.store | +91 80 4912 3400
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-block', background: '#e8f9ee', color: '#16a34a', border: '1px solid rgba(22, 163, 74, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
                                            PAID • RAZORPAY VERIFIED
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', marginTop: '8px' }}>
                                            INV-{selectedInvoiceOrder.id.replace(/[^0-9]/g, '').slice(-6) || '2026'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                            Date: {new Date(selectedInvoiceOrder.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                                            Order Ref: {selectedInvoiceOrder.id}
                                        </div>
                                    </div>
                                </div>

                                {/* Bill To Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px 0', borderBottom: '1px solid #e2e8f0' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>BILLED TO</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{selectedInvoiceOrder.customerName}</div>
                                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>{selectedInvoiceOrder.customerEmail}</div>
                                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>Phone: {selectedInvoiceOrder.customerPhone || 'Not provided'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>PAYMENT DETAILS</div>
                                        <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700, marginTop: '4px' }}>Gateway: Razorpay Payments</div>
                                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--dd-primary)', marginTop: '2px' }}>
                                            {selectedInvoiceOrder.razorpayPaymentId || 'pay_verified'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                                            Order: {selectedInvoiceOrder.razorpayOrderId}
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div style={{ padding: '20px 0' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #0f172a', textAlign: 'left' }}>
                                                <th style={{ padding: '8px 4px', color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem' }}>#</th>
                                                <th style={{ padding: '8px 6px', color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem' }}>Item &amp; Description</th>
                                                <th style={{ padding: '8px 6px', color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', textAlign: 'center' }}>Qty</th>
                                                <th style={{ padding: '8px 6px', color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', textAlign: 'center' }}>Bonus Points</th>
                                                <th style={{ padding: '8px 6px', color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', textAlign: 'right' }}>Unit Price</th>
                                                <th style={{ padding: '8px 6px', color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', textAlign: 'right' }}>Line Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedInvoiceOrder.items.map((it, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '12px 4px', color: '#94a3b8' }}>{idx + 1}</td>
                                                    <td style={{ padding: '12px 6px', fontWeight: 700, color: '#0f172a' }}>{it.productName}</td>
                                                    <td style={{ padding: '12px 6px', textAlign: 'center', color: '#475569' }}>{it.quantity}</td>
                                                    <td style={{ padding: '12px 6px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>+{it.bonusPoints || 0} pts</td>
                                                    <td style={{ padding: '12px 6px', textAlign: 'right', fontFamily: 'monospace' }}>₹{it.price?.toLocaleString('en-IN')}</td>
                                                    <td style={{ padding: '12px 6px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                                                        ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Financial Summary */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ width: '280px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '6px' }}>
                                            <span>Subtotal</span>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{selectedInvoiceOrder.totalAmount?.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '6px' }}>
                                            <span>Central GST (9% CGST)</span>
                                            <span>₹{(selectedInvoiceOrder.totalAmount * 0.09).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '6px' }}>
                                            <span>State GST (9% SGST)</span>
                                            <span>₹{(selectedInvoiceOrder.totalAmount * 0.09).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>
                                            <span>Shipping &amp; Handling</span>
                                            <span style={{ fontWeight: 700, color: '#16a34a' }}>FREE</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', paddingTop: '10px', borderTop: '2px solid #0f172a' }}>
                                            <span>Total Paid</span>
                                            <span style={{ color: 'var(--dd-primary)', fontFamily: 'monospace' }}>₹{selectedInvoiceOrder.totalAmount?.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Signature Footer */}
                                <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.72rem', color: '#94a3b8' }}>
                                    <div>
                                        <strong>Notes &amp; Return Terms:</strong><br />
                                        All items are subject to a 7-day exchange window.<br />
                                        This is a computer-generated invoice authenticated via Razorpay.
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ borderBottom: '1px solid #94a3b8', width: '150px', marginBottom: '4px' }} />
                                        <div style={{ fontWeight: 700, color: '#0f172a' }}>BANNNED Studio Ltd</div>
                                        <div>Authorized Signatory</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ ADMIN CREDENTIALS & SECURITY MODAL ════ */}
            {showPasswordModal && (
                <AdminCredentialsModal
                    user={adminUser}
                    currentAdminId={currentAdminId}
                    onIdUpdated={(newId) => {
                        setCurrentAdminId(newId);
                        showToast(`Unique Admin ID updated to ${newId}`);
                    }}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}
        </div>
    );
}
