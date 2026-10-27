'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { ConfirmationResult } from 'firebase/auth';

type AuthMode = 'login' | 'signup';
type LoginTab = 'email' | 'phone' | 'google';

export default function AuthPage() {
    const router = useRouter();
    const {
        user,
        bannedUser,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPhoneOtp,
        confirmPhoneOtp,
        error,
        clearError,
    } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [tab, setTab] = useState<LoginTab>('email');

    // Email/password form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    // Phone OTP
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
    const [otpTimer, setOtpTimer] = useState(0);

    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');

    // Redirect if already signed in
    useEffect(() => {
        if (!loading && user) {
            if (bannedUser && !bannedUser.profileComplete) {
                router.push('/auth/complete');
            } else if (bannedUser?.profileComplete) {
                router.push('/');
            }
        }
    }, [user, bannedUser, loading, router]);

    // OTP countdown
    useEffect(() => {
        if (otpTimer > 0) {
            const t = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [otpTimer]);

    const handleError = (e: any) => {
        setLocalError(e?.message || 'Something went wrong');
    };

    const handleGoogleSignIn = async () => {
        try {
            setSubmitting(true);
            clearError();
            setLocalError('');
            await signInWithGoogle();
            // redirect handled by useEffect
        } catch (e) {
            handleError(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        clearError();
        if (!email || !password) { setLocalError('Email and password are required'); return; }
        if (mode === 'signup' && !name.trim()) { setLocalError('Please enter your name'); return; }
        if (password.length < 6) { setLocalError('Password must be at least 6 characters'); return; }
        try {
            setSubmitting(true);
            if (mode === 'signup') {
                await signUpWithEmail(email, password, name.trim());
            } else {
                await signInWithEmail(email, password);
            }
        } catch (e) {
            handleError(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) { setLocalError('Enter a valid phone number with country code (e.g. +91XXXXXXXXXX)'); return; }
        try {
            setSubmitting(true);
            setLocalError('');
            clearError();
            const result = await sendPhoneOtp(phone);
            setConfirmation(result);
            setOtpSent(true);
            setOtpTimer(60);
        } catch (e) {
            handleError(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!confirmation || otp.length !== 6) { setLocalError('Enter the 6-digit OTP'); return; }
        try {
            setSubmitting(true);
            setLocalError('');
            clearError();
            await confirmPhoneOtp(confirmation, otp);
        } catch (e) {
            handleError(e);
        } finally {
            setSubmitting(false);
        }
    };

    const displayError = localError || error;

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #333', borderTop: '3px solid #c8b89a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="auth-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Bebas+Neue&display=swap');
                
                * { box-sizing: border-box; margin: 0; padding: 0; }

                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    background: #07070d;
                    font-family: 'Space Grotesk', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                .auth-bg-glow {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }
                .auth-bg-glow::before {
                    content: '';
                    position: absolute;
                    top: -15%;
                    left: -10%;
                    width: 60vw;
                    height: 60vw;
                    background: radial-gradient(circle, rgba(200,184,154,0.07) 0%, transparent 70%);
                    border-radius: 50%;
                }
                .auth-bg-glow::after {
                    content: '';
                    position: absolute;
                    bottom: -20%;
                    right: -10%;
                    width: 50vw;
                    height: 50vw;
                    background: radial-gradient(circle, rgba(59,91,245,0.06) 0%, transparent 70%);
                    border-radius: 50%;
                }

                .auth-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 60px;
                    position: relative;
                    z-index: 1;
                    max-width: 480px;
                }

                .auth-brand {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 2.2rem;
                    letter-spacing: 6px;
                    color: #c8b89a;
                    text-decoration: none;
                    margin-bottom: 48px;
                    display: block;
                }

                .auth-headline {
                    font-size: 2.8rem;
                    font-weight: 700;
                    color: #f8f8f8;
                    line-height: 1.15;
                    margin-bottom: 16px;
                }

                .auth-headline span {
                    color: #c8b89a;
                }

                .auth-sub {
                    font-size: 1rem;
                    color: #8a8a9a;
                    line-height: 1.7;
                    margin-bottom: 40px;
                }

                .auth-perks {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .auth-perk {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.9rem;
                    color: #a0a0b4;
                }

                .auth-perk-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #c8b89a;
                    flex-shrink: 0;
                }

                .auth-right {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 60px;
                    position: relative;
                    z-index: 1;
                }

                .auth-card {
                    width: 100%;
                    max-width: 420px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 20px;
                    padding: 40px;
                    backdrop-filter: blur(20px);
                }

                .auth-mode-toggle {
                    display: flex;
                    background: rgba(255,255,255,0.04);
                    border-radius: 10px;
                    padding: 4px;
                    margin-bottom: 28px;
                    gap: 4px;
                }

                .auth-mode-btn {
                    flex: 1;
                    padding: 9px 0;
                    border: none;
                    border-radius: 7px;
                    cursor: pointer;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.87rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    background: transparent;
                    color: #6b6b80;
                }

                .auth-mode-btn.active {
                    background: #c8b89a;
                    color: #07070d;
                    font-weight: 600;
                }

                .auth-tabs {
                    display: flex;
                    gap: 4px;
                    margin-bottom: 24px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 10px;
                    padding: 4px;
                }

                .auth-tab {
                    flex: 1;
                    padding: 8px 0;
                    border: none;
                    border-radius: 7px;
                    cursor: pointer;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.8rem;
                    font-weight: 500;
                    transition: all 0.2s;
                    background: transparent;
                    color: #6b6b80;
                }

                .auth-tab.active {
                    background: rgba(200,184,154,0.15);
                    color: #c8b89a;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .auth-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .auth-label {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #8a8a9a;
                    letter-spacing: 0.5px;
                }

                .auth-input-wrap {
                    position: relative;
                }

                .auth-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 10px;
                    color: #f0f0f0;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.95rem;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .auth-input:focus {
                    border-color: rgba(200,184,154,0.5);
                }

                .auth-input::placeholder {
                    color: #3a3a4a;
                }

                .auth-input-icon {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    cursor: pointer;
                    color: #5a5a6a;
                    font-size: 0.9rem;
                    background: none;
                    border: none;
                    padding: 0;
                }

                .auth-btn {
                    width: 100%;
                    padding: 13px;
                    background: #c8b89a;
                    color: #07070d;
                    border: none;
                    border-radius: 10px;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.5px;
                    margin-top: 4px;
                }

                .auth-btn:hover:not(:disabled) {
                    background: #ddd0b8;
                    transform: translateY(-1px);
                }

                .auth-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .auth-btn-secondary {
                    background: rgba(255,255,255,0.05);
                    color: #c8b89a;
                    border: 1px solid rgba(200,184,154,0.25);
                }

                .auth-btn-secondary:hover:not(:disabled) {
                    background: rgba(200,184,154,0.1);
                    transform: translateY(-1px);
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 6px 0;
                    color: #3a3a4a;
                    font-size: 0.8rem;
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255,255,255,0.07);
                }

                .auth-google-btn {
                    width: 100%;
                    padding: 13px;
                    background: rgba(255,255,255,0.04);
                    color: #e0e0e0;
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 10px;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.93rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .auth-google-btn:hover:not(:disabled) {
                    background: rgba(255,255,255,0.08);
                    transform: translateY(-1px);
                }

                .auth-google-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .auth-error {
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.25);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: #f87171;
                    font-size: 0.85rem;
                    line-height: 1.4;
                }

                .auth-otp-row {
                    display: flex;
                    gap: 8px;
                }

                .auth-otp-row .auth-input {
                    letter-spacing: 4px;
                    text-align: center;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .auth-phone-prefix {
                    display: flex;
                    align-items: center;
                    gap: 0;
                }

                .auth-country-code {
                    padding: 12px 12px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-right: none;
                    border-radius: 10px 0 0 10px;
                    color: #c8b89a;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 600;
                    white-space: nowrap;
                }

                .auth-phone-input {
                    border-radius: 0 10px 10px 0 !important;
                }

                .auth-resend {
                    font-size: 0.82rem;
                    color: #6b6b80;
                    text-align: center;
                }

                .auth-resend button {
                    background: none;
                    border: none;
                    color: #c8b89a;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: inherit;
                    text-decoration: underline;
                }

                .auth-footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 0.84rem;
                    color: #5a5a6a;
                }

                .auth-footer a {
                    color: #c8b89a;
                    text-decoration: none;
                }

                @media (max-width: 768px) {
                    .auth-left { display: none; }
                    .auth-right { padding: 24px 20px; }
                    .auth-card { padding: 28px 24px; }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div className="auth-bg-glow" />

            {/* Left Panel */}
            <div className="auth-left">
                <Link href="/" className="auth-brand">BANNNED</Link>
                <h1 className="auth-headline">
                    Your style,<br />your <span>identity</span>.
                </h1>
                <p className="auth-sub">
                    Join thousands of streetwear enthusiasts. Get early access to drops, exclusive offers, and earn loyalty points on every order.
                </p>
                <div className="auth-perks">
                    {[
                        'Early access to limited drops & new collections',
                        'Earn loyalty points redeemable on future orders',
                        'Track orders and manage returns effortlessly',
                        'Exclusive member-only discount codes',
                    ].map((perk) => (
                        <div key={perk} className="auth-perk">
                            <div className="auth-perk-dot" />
                            <span>{perk}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel */}
            <div className="auth-right">
                <div className="auth-card">
                    {/* Mode Toggle */}
                    <div className="auth-mode-toggle">
                        <button
                            className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => { setMode('login'); clearError(); setLocalError(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
                            onClick={() => { setMode('signup'); setTab('email'); clearError(); setLocalError(''); }}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Tab Selector (only for login) */}
                    {mode === 'login' && (
                        <div className="auth-tabs">
                            {(['email', 'phone', 'google'] as LoginTab[]).map((t) => (
                                <button
                                    key={t}
                                    className={`auth-tab ${tab === t ? 'active' : ''}`}
                                    onClick={() => { setTab(t); clearError(); setLocalError(''); setOtpSent(false); setOtp(''); }}
                                >
                                    {t === 'email' ? '✉ Email' : t === 'phone' ? '📱 Phone' : '🔵 Google'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Error Display */}
                    {displayError && (
                        <div className="auth-error" style={{ marginBottom: 14 }}>
                            {displayError}
                        </div>
                    )}

                    {/* ── Email / Password Form ── */}
                    {(tab === 'email' || mode === 'signup') && tab !== 'phone' && tab !== 'google' && (
                        <form className="auth-form" onSubmit={handleEmailSubmit}>
                            {mode === 'signup' && (
                                <div className="auth-input-group">
                                    <label className="auth-label">FULL NAME</label>
                                    <input
                                        className="auth-input"
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoComplete="name"
                                    />
                                </div>
                            )}
                            <div className="auth-input-group">
                                <label className="auth-label">EMAIL ADDRESS</label>
                                <input
                                    className="auth-input"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                            <div className="auth-input-group">
                                <label className="auth-label">PASSWORD</label>
                                <div className="auth-input-wrap">
                                    <input
                                        className="auth-input"
                                        type={showPass ? 'text' : 'password'}
                                        placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Your password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        className="auth-input-icon"
                                        onClick={() => setShowPass(p => !p)}
                                    >
                                        {showPass ? '🙈' : '👁'}
                                    </button>
                                </div>
                            </div>
                            <button className="auth-btn" type="submit" disabled={submitting}>
                                {submitting ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                            </button>

                            <div className="auth-divider">or</div>

                            <button
                                type="button"
                                className="auth-google-btn"
                                onClick={handleGoogleSignIn}
                                disabled={submitting}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </button>
                        </form>
                    )}

                    {/* ── Phone OTP Form ── */}
                    {tab === 'phone' && mode === 'login' && (
                        <div className="auth-form">
                            {!otpSent ? (
                                <>
                                    <div className="auth-input-group">
                                        <label className="auth-label">PHONE NUMBER</label>
                                        <div className="auth-phone-prefix">
                                            <div className="auth-country-code">🇮🇳 +91</div>
                                            <input
                                                className="auth-input auth-phone-input"
                                                type="tel"
                                                placeholder="9876543210"
                                                value={phone.replace('+91', '')}
                                                onChange={(e) => setPhone('+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                maxLength={10}
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: '#5a5a6a', marginTop: 4 }}>
                                            OTP will be sent via SMS
                                        </p>
                                    </div>
                                    <button className="auth-btn" onClick={handleSendOtp} disabled={submitting}>
                                        {submitting ? 'Sending OTP...' : 'Send OTP'}
                                    </button>
                                    <div className="auth-divider">or</div>
                                    <button
                                        type="button"
                                        className="auth-google-btn"
                                        onClick={handleGoogleSignIn}
                                        disabled={submitting}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                        Continue with Google
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p style={{ fontSize: '0.88rem', color: '#8a8a9a', marginBottom: 4 }}>
                                        OTP sent to <strong style={{ color: '#c8b89a' }}>{phone}</strong>
                                    </p>
                                    <div className="auth-input-group">
                                        <label className="auth-label">ENTER 6-DIGIT OTP</label>
                                        <div className="auth-otp-row">
                                            <input
                                                className="auth-input"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="• • • • • •"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            />
                                        </div>
                                    </div>
                                    <button className="auth-btn" onClick={handleVerifyOtp} disabled={submitting || otp.length !== 6}>
                                        {submitting ? 'Verifying...' : 'Verify & Sign In'}
                                    </button>
                                    <div className="auth-resend">
                                        {otpTimer > 0 ? (
                                            <span>Resend OTP in {otpTimer}s</span>
                                        ) : (
                                            <span>Didn't receive it? <button onClick={() => { setOtpSent(false); setOtp(''); }}>Resend OTP</button></span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Google Tab ── */}
                    {tab === 'google' && mode === 'login' && (
                        <div className="auth-form">
                            <p style={{ fontSize: '0.9rem', color: '#8a8a9a', textAlign: 'center', lineHeight: 1.6 }}>
                                Sign in instantly using your Google account. No password required.
                            </p>
                            <button
                                type="button"
                                className="auth-google-btn"
                                style={{ padding: '16px', fontSize: '1rem' }}
                                onClick={handleGoogleSignIn}
                                disabled={submitting}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                {submitting ? 'Redirecting...' : 'Continue with Google'}
                            </button>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="auth-footer">
                        {mode === 'login' ? (
                            <>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('signup'); setTab('email'); }}>Sign up free</a></>
                        ) : (
                            <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Sign in</a></>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
