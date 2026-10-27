'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

const STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export default function CompleteProfilePage() {
    const router = useRouter();
    const { user, bannedUser, loading, completeProfile, error, clearError } = useAuth();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');

    // Form state
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [state, setState] = useState('');

    // Redirect if not logged in or already complete
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth');
            } else if (bannedUser?.profileComplete) {
                router.push('/');
            } else if (bannedUser) {
                // Pre-fill known data
                setFullName(bannedUser.fullName || bannedUser.displayName || '');
                setPhone(bannedUser.phone || '');
                setUsername(bannedUser.username || '');
                setDateOfBirth(bannedUser.dateOfBirth || '');
                setGender(bannedUser.gender || '');
                setAddress(bannedUser.address || '');
                setCity(bannedUser.city || '');
                setPincode(bannedUser.pincode || '');
                setState(bannedUser.state || '');
            }
        }
    }, [user, bannedUser, loading, router]);

    const handleStep1Next = () => {
        setLocalError('');
        if (!fullName.trim()) { setLocalError('Full name is required'); return; }
        if (!username.trim() || username.length < 3) { setLocalError('Username must be at least 3 characters'); return; }
        if (!dateOfBirth) { setLocalError('Date of birth is required'); return; }
        if (!gender) { setLocalError('Please select your gender'); return; }
        setStep(2);
    };

    const handleSubmit = async () => {
        setLocalError('');
        clearError();
        if (!address.trim()) { setLocalError('Address is required'); return; }
        if (!city.trim()) { setLocalError('City is required'); return; }
        if (!pincode || pincode.length !== 6) { setLocalError('Enter a valid 6-digit pincode'); return; }
        if (!state) { setLocalError('Please select your state'); return; }

        try {
            setSubmitting(true);
            await completeProfile({
                fullName: fullName.trim(),
                username: username.trim().toLowerCase(),
                dateOfBirth,
                gender,
                phone: phone || bannedUser?.phone || '',
                address: address.trim(),
                city: city.trim(),
                pincode,
                state,
                profileComplete: true,
            });
            router.push('/');
        } catch (e: any) {
            setLocalError(e.message || 'Failed to save profile');
        } finally {
            setSubmitting(false);
        }
    };

    const displayError = localError || error;
    const progress = step === 1 ? 50 : 100;

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070d' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #333', borderTop: '3px solid #c8b89a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="complete-page">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Bebas+Neue&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }

                .complete-page {
                    min-height: 100vh;
                    background: #07070d;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Space Grotesk', sans-serif;
                    padding: 40px 20px;
                    position: relative;
                    overflow: hidden;
                }

                .complete-page::before {
                    content: '';
                    position: fixed;
                    top: -20%;
                    right: -10%;
                    width: 50vw;
                    height: 50vw;
                    background: radial-gradient(circle, rgba(200,184,154,0.05) 0%, transparent 70%);
                    pointer-events: none;
                }

                .complete-card {
                    width: 100%;
                    max-width: 520px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 24px;
                    padding: 48px 44px;
                    position: relative;
                    z-index: 1;
                }

                .complete-brand {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.5rem;
                    letter-spacing: 5px;
                    color: #c8b89a;
                    text-decoration: none;
                    display: block;
                    margin-bottom: 32px;
                }

                .complete-progress-track {
                    height: 4px;
                    background: rgba(255,255,255,0.07);
                    border-radius: 4px;
                    margin-bottom: 36px;
                    overflow: hidden;
                }

                .complete-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #c8b89a, #ddd0b8);
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }

                .complete-step-label {
                    font-size: 0.75rem;
                    color: #5a5a6a;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                }

                .complete-title {
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #f0f0f0;
                    margin-bottom: 8px;
                }

                .complete-sub {
                    font-size: 0.88rem;
                    color: #6b6b80;
                    margin-bottom: 28px;
                    line-height: 1.6;
                }

                .complete-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .complete-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .complete-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .complete-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #6b6b80;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                }

                .complete-input {
                    width: 100%;
                    padding: 11px 14px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 10px;
                    color: #f0f0f0;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.92rem;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .complete-input:focus {
                    border-color: rgba(200,184,154,0.4);
                }

                .complete-input::placeholder {
                    color: #3a3a4a;
                }

                .complete-select {
                    width: 100%;
                    padding: 11px 14px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 10px;
                    color: #f0f0f0;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.92rem;
                    outline: none;
                    cursor: pointer;
                    appearance: none;
                    -webkit-appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 14px center;
                    padding-right: 36px;
                }

                .complete-select option {
                    background: #1a1a2a;
                    color: #f0f0f0;
                }

                .complete-gender-row {
                    display: flex;
                    gap: 8px;
                }

                .complete-gender-btn {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 8px;
                    background: transparent;
                    color: #6b6b80;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.18s;
                }

                .complete-gender-btn.selected {
                    background: rgba(200,184,154,0.12);
                    border-color: rgba(200,184,154,0.4);
                    color: #c8b89a;
                }

                .complete-error {
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.25);
                    border-radius: 8px;
                    padding: 10px 14px;
                    color: #f87171;
                    font-size: 0.85rem;
                }

                .complete-btn {
                    width: 100%;
                    padding: 14px;
                    background: #c8b89a;
                    color: #07070d;
                    border: none;
                    border-radius: 10px;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 6px;
                }

                .complete-btn:hover:not(:disabled) {
                    background: #ddd0b8;
                    transform: translateY(-1px);
                }

                .complete-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .complete-back {
                    background: none;
                    border: none;
                    color: #5a5a6a;
                    font-family: 'Space Grotesk', sans-serif;
                    font-size: 0.85rem;
                    cursor: pointer;
                    padding: 8px 0;
                    text-align: left;
                    text-decoration: underline;
                }

                .complete-back:hover { color: #c8b89a; }

                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 560px) {
                    .complete-card { padding: 32px 24px; }
                    .complete-row { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="complete-card">
                <span className="complete-brand">BANNNED</span>

                {/* Progress Bar */}
                <div className="complete-progress-track">
                    <div className="complete-progress-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="complete-step-label">Step {step} of 2</div>

                {step === 1 ? (
                    <>
                        <h1 className="complete-title">Tell us about yourself</h1>
                        <p className="complete-sub">Fill in your basic info to personalize your BANNNED experience.</p>

                        {displayError && <div className="complete-error" style={{ marginBottom: 16 }}>{displayError}</div>}

                        <div className="complete-form">
                            <div className="complete-group">
                                <label className="complete-label">Full Name</label>
                                <input
                                    className="complete-input"
                                    type="text"
                                    placeholder="Your full name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>

                            <div className="complete-group">
                                <label className="complete-label">Username</label>
                                <input
                                    className="complete-input"
                                    type="text"
                                    placeholder="@yourhandle"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                                />
                            </div>

                            <div className="complete-row">
                                <div className="complete-group">
                                    <label className="complete-label">Date of Birth</label>
                                    <input
                                        className="complete-input"
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div className="complete-group">
                                    <label className="complete-label">Phone (Optional)</label>
                                    <input
                                        className="complete-input"
                                        type="tel"
                                        placeholder="+91XXXXXXXXXX"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="complete-group">
                                <label className="complete-label">Gender</label>
                                <div className="complete-gender-row">
                                    {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            className={`complete-gender-btn ${gender === g ? 'selected' : ''}`}
                                            onClick={() => setGender(g)}
                                        >
                                            {g === 'Prefer not to say' ? 'N/A' : g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="complete-btn" onClick={handleStep1Next}>
                                Continue →
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="complete-title">Delivery address</h1>
                        <p className="complete-sub">Add your address so we can ship your orders lightning fast.</p>

                        {displayError && <div className="complete-error" style={{ marginBottom: 16 }}>{displayError}</div>}

                        <div className="complete-form">
                            <div className="complete-group">
                                <label className="complete-label">Street Address</label>
                                <input
                                    className="complete-input"
                                    type="text"
                                    placeholder="Flat no., Building, Street"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>

                            <div className="complete-row">
                                <div className="complete-group">
                                    <label className="complete-label">City</label>
                                    <input
                                        className="complete-input"
                                        type="text"
                                        placeholder="Mumbai"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>
                                <div className="complete-group">
                                    <label className="complete-label">Pincode</label>
                                    <input
                                        className="complete-input"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="400001"
                                        maxLength={6}
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                </div>
                            </div>

                            <div className="complete-group">
                                <label className="complete-label">State</label>
                                <select
                                    className="complete-select"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                >
                                    <option value="">Select state</option>
                                    {STATES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className="complete-btn"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? 'Saving profile...' : 'Complete My Account ✓'}
                            </button>

                            <button className="complete-back" onClick={() => { setStep(1); setLocalError(''); clearError(); }}>
                                ← Back to personal info
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
