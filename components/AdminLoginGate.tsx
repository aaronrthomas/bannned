'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import {
    getAuth, signInWithEmailAndPassword, signOut,
    GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail,
    User as FirebaseUser
} from 'firebase/auth';
import { app } from '@/lib/firebase';

const ADMIN_EMAIL = 'bannnedshop@gmail.com';
const DEFAULT_ADMIN_ID = 'BANNNED-ADMIN-01';

// Social Icon SVGs
const AppleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.02-.49 2.64-1.24z"/>
    </svg>
);

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>
);

const FacebookIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

interface AdminLoginGateProps {
    onAuthenticated: (user: FirebaseUser) => void;
}

export default function AdminLoginGate({ onAuthenticated }: AdminLoginGateProps) {
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<'id' | 'password' | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNotice('');
        const trimmedId = loginIdentifier.trim();
        if (!trimmedId || !password) {
            setError('Please enter your email and password.');
            return;
        }

        try {
            setSubmitting(true);
            const auth = getAuth(app);
            let emailToAuth = trimmedId;

            // If the user entered an Admin ID instead of an email address
            if (!trimmedId.includes('@')) {
                let validAdminId = DEFAULT_ADMIN_ID;
                try {
                    const cfgRes = await fetch('/api/admin/config', { cache: 'no-store' });
                    const cfgData = await cfgRes.json();
                    if (cfgData.success && cfgData.adminId) {
                        validAdminId = cfgData.adminId;
                    }
                } catch {}

                const normalizedInput = trimmedId.toUpperCase();
                const normalizedValid = validAdminId.toUpperCase();

                if (
                    normalizedInput === normalizedValid ||
                    normalizedInput === 'BANNNED-ADMIN-01' ||
                    normalizedInput === 'ADMIN' ||
                    normalizedInput === 'BANNNED-ADMIN'
                ) {
                    emailToAuth = ADMIN_EMAIL;
                } else {
                    setError('Invalid credentials. Please verify your details.');
                    setSubmitting(false);
                    return;
                }
            } else {
                if (trimmedId.toLowerCase() !== ADMIN_EMAIL) {
                    setError('Invalid credentials. Only authorized administrators may log in.');
                    setSubmitting(false);
                    return;
                }
                emailToAuth = ADMIN_EMAIL;
            }

            const result = await signInWithEmailAndPassword(auth, emailToAuth, password);

            if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) {
                await signOut(auth);
                setError('Access denied. Unauthorised credentials.');
                return;
            }

            onAuthenticated(result.user);
        } catch (err: any) {
            const code = err.code;
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
                setError('Invalid credentials. Please verify your email and password.');
            } else if (code === 'auth/too-many-requests') {
                setError('Access locked due to excessive failed attempts. Please try again later.');
            } else {
                setError('Authentication error. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setNotice('');
            setSubmitting(true);
            const auth = getAuth(app);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            if (result.user.email?.toLowerCase() !== ADMIN_EMAIL) {
                await signOut(auth);
                setError(`Access denied (${result.user.email}). Only ${ADMIN_EMAIL} is authorized.`);
                return;
            }

            onAuthenticated(result.user);
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || 'Google authentication failed.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleForgotPassword = async () => {
        try {
            setError('');
            setNotice('');
            const auth = getAuth(app);
            await sendPasswordResetEmail(auth, ADMIN_EMAIL);
            setNotice(`Password reset instructions sent to ${ADMIN_EMAIL}.`);
        } catch (err: any) {
            setError('Could not send reset email. Please contact system administrator.');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#183fe5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            overflowY: 'auto',
            boxSizing: 'border-box',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
            {/* Top Navigation Link to Store */}
            <Link
                href="/"
                style={{
                    position: 'absolute',
                    top: 24,
                    left: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '7px 15px',
                    borderRadius: 9999,
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            >
                <ArrowLeft size={14} />
                <span>Store</span>
            </Link>

            {/* Main Rounded Frame Card */}
            <div className="admin-login-card" style={{
                background: '#ffffff',
                borderRadius: 44,
                width: '100%',
                maxWidth: 960,
                minHeight: 570,
                boxShadow: '0 35px 85px -15px rgba(5, 18, 92, 0.45)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}>
                {/* Left Column: Form Section */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '48px 44px',
                    boxSizing: 'border-box',
                }}>
                    <div style={{ width: '100%', maxWidth: 330, margin: '0 auto' }}>
                        {/* House Icon */}
                        <div style={{ textAlign: 'center', marginBottom: 12, userSelect: 'none' }}>
                            <span style={{ fontSize: '32px', display: 'inline-block' }}>
                                🏠
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 style={{
                            fontSize: '1.95rem',
                            fontWeight: 800,
                            color: '#111827',
                            margin: '0 0 6px',
                            textAlign: 'center',
                            letterSpacing: '-0.03em',
                            fontFamily: 'inherit',
                        }}>
                            Welcome home
                        </h1>

                        {/* Subtitle */}
                        <p style={{
                            fontSize: '0.86rem',
                            color: '#6b7280',
                            margin: '0 0 26px',
                            textAlign: 'center',
                            fontWeight: 400,
                        }}>
                            Please enter your details.
                        </p>

                        {/* Error Alert */}
                        {error && (
                            <div style={{
                                background: '#fef2f2',
                                border: '1px solid #fee2e2',
                                color: '#ef4444',
                                borderRadius: 12,
                                padding: '9px 13px',
                                fontSize: '0.8rem',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                lineHeight: 1.4,
                            }}>
                                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Info Notice */}
                        {notice && (
                            <div style={{
                                background: '#eff6ff',
                                border: '1px solid #dbeafe',
                                color: '#1d4ed8',
                                borderRadius: 12,
                                padding: '9px 13px',
                                fontSize: '0.8rem',
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                lineHeight: 1.4,
                            }}>
                                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                                <span>{notice}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* Email Input */}
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={loginIdentifier}
                                    onChange={e => setLoginIdentifier(e.target.value)}
                                    onFocus={() => setFocusedField('id')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Email"
                                    autoComplete="username"
                                    style={{
                                        width: '100%',
                                        height: '46px',
                                        borderRadius: '9999px',
                                        border: focusedField === 'id' ? '1.5px solid #183fe5' : '1.5px solid #e5e7eb',
                                        boxShadow: focusedField === 'id' ? '0 0 0 4px rgba(24, 63, 229, 0.08)' : 'none',
                                        padding: '0 46px 0 20px',
                                        fontSize: '0.9rem',
                                        color: '#111827',
                                        background: '#ffffff',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                <Mail
                                    size={16}
                                    color="#9ca3af"
                                    style={{
                                        position: 'absolute',
                                        right: 18,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none',
                                    }}
                                />
                            </div>

                            {/* Password Input */}
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    style={{
                                        width: '100%',
                                        height: '46px',
                                        borderRadius: '9999px',
                                        border: focusedField === 'password' ? '1.5px solid #183fe5' : '1.5px solid #e5e7eb',
                                        boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(24, 63, 229, 0.08)' : 'none',
                                        padding: '0 46px 0 20px',
                                        fontSize: '0.9rem',
                                        color: '#111827',
                                        background: '#ffffff',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    style={{
                                        position: 'absolute',
                                        right: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        padding: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#9ca3af',
                                    }}
                                    title={showPass ? 'Hide password' : 'Show password'}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Remember for 30 days & Forgot password */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.78rem',
                                color: '#6b7280',
                                marginTop: 2,
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={e => setRememberMe(e.target.checked)}
                                        style={{
                                            accentColor: '#183fe5',
                                            width: 14,
                                            height: 14,
                                            borderRadius: 3,
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <span style={{ color: '#6b7280', fontWeight: 500 }}>Remember for 30 days</span>
                                </label>

                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        fontSize: '0.78rem',
                                        color: '#9ca3af',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        transition: 'color 0.15s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#183fe5')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    borderRadius: '9999px',
                                    background: submitting ? '#6480f0' : '#183fe5',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontFamily: 'inherit',
                                    fontSize: '0.92rem',
                                    fontWeight: 600,
                                    cursor: submitting ? 'wait' : 'pointer',
                                    marginTop: 6,
                                    boxShadow: '0 6px 18px -2px rgba(24, 63, 229, 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                    if (!submitting) {
                                        e.currentTarget.style.background = '#1431bd';
                                        e.currentTarget.style.boxShadow = '0 8px 22px -2px rgba(24, 63, 229, 0.45)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!submitting) {
                                        e.currentTarget.style.background = '#183fe5';
                                        e.currentTarget.style.boxShadow = '0 6px 18px -2px rgba(24, 63, 229, 0.35)';
                                    }
                                }}
                            >
                                {submitting ? (
                                    <>
                                        <div style={{
                                            width: 15,
                                            height: 15,
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#ffffff',
                                            borderRadius: '50%',
                                            animation: 'adminSpin 0.7s linear infinite',
                                        }} />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>

                            {/* Divider "or" */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                margin: '8px 0 4px',
                            }}>
                                <div style={{ flex: 1, height: 1, background: '#f0f2f5' }} />
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500 }}>or</span>
                                <div style={{ flex: 1, height: 1, background: '#f0f2f5' }} />
                            </div>

                            {/* Social Login Buttons */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 14,
                            }}>
                                {/* Apple */}
                                <button
                                    type="button"
                                    onClick={() => setNotice('Apple authorization is not configured for Admin access. Please use your Admin credentials or Google.')}
                                    title="Sign in with Apple"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: '#ffffff',
                                        border: '1.5px solid #e5e7eb',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                    }}
                                >
                                    <AppleIcon />
                                </button>

                                {/* Google */}
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    title="Sign in with Google"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: '#ffffff',
                                        border: '1.5px solid #e5e7eb',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                    }}
                                >
                                    <GoogleIcon />
                                </button>

                                {/* Facebook */}
                                <button
                                    type="button"
                                    onClick={() => setNotice('Facebook authorization is not configured for Admin access. Please use your Admin credentials or Google.')}
                                    title="Sign in with Facebook"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: '#ffffff',
                                        border: '1.5px solid #e5e7eb',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                    }}
                                >
                                    <FacebookIcon />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Visual Art Section */}
                <div className="admin-art-panel" style={{
                    padding: '16px 16px 16px 0',
                    boxSizing: 'border-box',
                    display: 'flex',
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        minHeight: 520,
                        borderRadius: 34,
                        overflow: 'hidden',
                        position: 'relative',
                        background: 'linear-gradient(135deg, #183fe5 0%, #311899 50%, #0d123e 100%)',
                        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                    }}>
                        <img
                            src="/admin-login-art.jpg"
                            alt="Abstract Art"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes adminSpin {
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 840px) {
                    .admin-login-card {
                        grid-template-columns: 1fr !important;
                        max-width: 440px !important;
                        border-radius: 32px !important;
                    }
                    .admin-art-panel {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
