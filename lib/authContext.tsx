'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from 'react';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithPhoneNumber,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    User,
    RecaptchaVerifier,
    ConfirmationResult,
    Auth,
} from 'firebase/auth';
import { getDatabase, ref, set, get, onValue } from 'firebase/database';
import { app } from './firebase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BannedUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phone: string | null;
    provider: 'google' | 'phone' | 'email';
    profileComplete: boolean;
    // Profile completion fields
    fullName?: string;
    username?: string;
    address?: string;
    city?: string;
    pincode?: string;
    state?: string;
    dateOfBirth?: string;
    gender?: string;
    // Metadata
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
    totalOrders?: number;
    totalSpent?: number;
    loyaltyPoints?: number;
}

export interface AuthContextType {
    user: User | null;
    bannedUser: BannedUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
    sendPhoneOtp: (phone: string) => Promise<ConfirmationResult>;
    confirmPhoneOtp: (result: ConfirmationResult, otp: string) => Promise<void>;
    signOutUser: () => Promise<void>;
    completeProfile: (data: Partial<BannedUser>) => Promise<void>;
    error: string | null;
    clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

let authInstance: Auth | null = null;
const getAuthInstance = () => {
    if (!authInstance) {
        authInstance = getAuth(app);
    }
    return authInstance;
};

async function saveUserToRTDB(user: User, extraData: Partial<BannedUser> = {}) {
    try {
        const db = getDatabase(app);
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const now = new Date().toISOString();

        const providerRaw = user.providerData[0]?.providerId;
        const provider = (extraData.provider ||
            (providerRaw === 'google.com' ? 'google' :
                providerRaw === 'phone' ? 'phone' : 'email')) as BannedUser['provider'];

        const existingData: Partial<BannedUser> = snapshot.exists() ? snapshot.val() : {};

        const userData: BannedUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            phone: user.phoneNumber,
            provider,
            profileComplete: existingData.profileComplete || false,
            fullName: existingData.fullName || user.displayName || '',
            username: existingData.username || '',
            address: existingData.address || '',
            city: existingData.city || '',
            pincode: existingData.pincode || '',
            state: existingData.state || '',
            dateOfBirth: existingData.dateOfBirth || '',
            gender: existingData.gender || '',
            createdAt: existingData.createdAt || now,
            updatedAt: now,
            lastLoginAt: now,
            totalOrders: existingData.totalOrders || 0,
            totalSpent: existingData.totalSpent || 0,
            loyaltyPoints: existingData.loyaltyPoints || 0,
            ...extraData,
        };

        await set(userRef, userData);
        return userData;
    } catch (err) {
        console.warn('[Auth] saveUserToRTDB error:', err);
        return null;
    }
}

async function fetchUserFromRTDB(uid: string): Promise<BannedUser | null> {
    try {
        const db = getDatabase(app);
        const snap = await get(ref(db, `users/${uid}`));
        return snap.exists() ? (snap.val() as BannedUser) : null;
    } catch {
        return null;
    }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [bannedUser, setBannedUser] = useState<BannedUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const clearError = useCallback(() => setError(null), []);

    // Auth state listener
    useEffect(() => {
        const auth = getAuthInstance();
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                const stored = await fetchUserFromRTDB(firebaseUser.uid);
                setBannedUser(stored);
            } else {
                setBannedUser(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Subscribe to live user updates in RTDB
    useEffect(() => {
        if (!user) return;
        const db = getDatabase(app);
        const userRef = ref(db, `users/${user.uid}`);
        const unsub = onValue(userRef, (snap) => {
            if (snap.exists()) {
                setBannedUser(snap.val() as BannedUser);
            }
        });
        return () => unsub();
    }, [user]);

    const signInWithGoogle = useCallback(async () => {
        try {
            clearError();
            const auth = getAuthInstance();
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            const result = await signInWithPopup(auth, provider);
            await saveUserToRTDB(result.user, { provider: 'google' });
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
            throw err;
        }
    }, [clearError]);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        try {
            clearError();
            const auth = getAuthInstance();
            const result = await signInWithEmailAndPassword(auth, email, password);
            await saveUserToRTDB(result.user, { provider: 'email', lastLoginAt: new Date().toISOString() });
        } catch (err: any) {
            const msg = err.code === 'auth/invalid-credential'
                ? 'Invalid email or password'
                : err.code === 'auth/too-many-requests'
                    ? 'Too many attempts. Try again later.'
                    : err.message || 'Sign-in failed';
            setError(msg);
            throw err;
        }
    }, [clearError]);

    const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
        try {
            clearError();
            const auth = getAuthInstance();
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName: name });
            await saveUserToRTDB(result.user, {
                provider: 'email',
                fullName: name,
                displayName: name,
            } as any);
        } catch (err: any) {
            const msg = err.code === 'auth/email-already-in-use'
                ? 'An account already exists with this email'
                : err.code === 'auth/weak-password'
                    ? 'Password must be at least 6 characters'
                    : err.message || 'Sign-up failed';
            setError(msg);
            throw err;
        }
    }, [clearError]);

    const sendPhoneOtp = useCallback(async (phone: string): Promise<ConfirmationResult> => {
        clearError();
        const auth = getAuthInstance();
        const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
        });
        try {
            const result = await signInWithPhoneNumber(auth, phone, recaptcha);
            return result;
        } catch (err: any) {
            recaptcha.clear();
            setError(err.message || 'Failed to send OTP');
            throw err;
        }
    }, [clearError]);

    const confirmPhoneOtp = useCallback(async (confirmationResult: ConfirmationResult, otp: string) => {
        try {
            clearError();
            const result = await confirmationResult.confirm(otp);
            await saveUserToRTDB(result.user, { provider: 'phone' });
        } catch (err: any) {
            setError(err.code === 'auth/invalid-verification-code' ? 'Invalid OTP. Please try again.' : err.message || 'OTP verification failed');
            throw err;
        }
    }, [clearError]);

    const signOutUser = useCallback(async () => {
        const auth = getAuthInstance();
        await signOut(auth);
        setUser(null);
        setBannedUser(null);
    }, []);

    const completeProfile = useCallback(async (data: Partial<BannedUser>) => {
        if (!user) throw new Error('Not authenticated');
        try {
            const db = getDatabase(app);
            const userRef = ref(db, `users/${user.uid}`);
            const snap = await get(userRef);
            const existing: Partial<BannedUser> = snap.exists() ? snap.val() : {};
            const updated: BannedUser = {
                ...existing,
                ...data,
                uid: user.uid,
                profileComplete: true,
                updatedAt: new Date().toISOString(),
            } as BannedUser;
            await set(userRef, updated);
            setBannedUser(updated);
            if (data.fullName) {
                await updateProfile(user, { displayName: data.fullName });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
            throw err;
        }
    }, [user]);

    const value: AuthContextType = {
        user,
        bannedUser,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPhoneOtp,
        confirmPhoneOtp,
        signOutUser,
        completeProfile,
        error,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            <div id="recaptcha-container" />
            {children}
        </AuthContext.Provider>
    );
}
