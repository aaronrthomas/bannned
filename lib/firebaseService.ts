import { Order } from './types';

export interface FirebaseConfigStatus {
    configured: boolean;
    databaseUrl: string | null;
    hasAuthSecret: boolean;
    provider: 'firebase_rtdb' | 'local_fallback';
    message: string;
}

export function getFirebaseDatabaseUrl(): string | null {
    const raw = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '';
    if (!raw) return null;
    // Strip trailing slash
    return raw.replace(/\/+$/, '');
}

export function getFirebaseStatus(): FirebaseConfigStatus {
    const dbUrl = getFirebaseDatabaseUrl();
    const hasSecret = Boolean(process.env.FIREBASE_DATABASE_SECRET);

    if (!dbUrl) {
        return {
            configured: false,
            databaseUrl: null,
            hasAuthSecret: false,
            provider: 'local_fallback',
            message: 'Firebase Realtime Database URL not set in .env.local (using ultra-fast local sync)',
        };
    }

    return {
        configured: true,
        databaseUrl: dbUrl,
        hasAuthSecret: hasSecret,
        provider: 'firebase_rtdb',
        message: `Connected to Firebase Realtime Database: ${dbUrl}`,
    };
}

function getAuthQuery(): string {
    const secret = process.env.FIREBASE_DATABASE_SECRET;
    return secret ? `?auth=${encodeURIComponent(secret)}` : '';
}

/**
 * Synchronize a single order into Firebase Realtime Database
 */
export async function syncOrderToFirebase(order: Order): Promise<{ success: boolean; error?: string }> {
    const dbUrl = getFirebaseDatabaseUrl();
    if (!dbUrl) {
        return { success: false, error: 'Firebase RTDB URL not configured' };
    }

    try {
        const url = `${dbUrl}/orders/${order.id}.json${getAuthQuery()}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('[Firebase RTDB] Order sync error:', res.status, errText);
            return { success: false, error: `Firebase HTTP ${res.status}: ${errText}` };
        }

        console.log(`🔥 [Firebase RTDB] Order synced successfully: ${order.id}`);
        return { success: true };
    } catch (err: any) {
        console.error('[Firebase RTDB] Network error syncing order:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Synchronize store analytics & totals into Firebase Realtime Database
 */
export async function syncStatsToFirebase(stats: any): Promise<{ success: boolean; error?: string }> {
    const dbUrl = getFirebaseDatabaseUrl();
    if (!dbUrl) return { success: false, error: 'Firebase RTDB URL not configured' };

    try {
        const url = `${dbUrl}/analytics.json${getAuthQuery()}`;
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...stats,
                lastUpdated: new Date().toISOString(),
            }),
        });

        return { success: res.ok };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Fetch all orders from Firebase Realtime Database
 */
export async function fetchOrdersFromFirebase(): Promise<Order[] | null> {
    const dbUrl = getFirebaseDatabaseUrl();
    if (!dbUrl) return null;

    try {
        const url = `${dbUrl}/orders.json${getAuthQuery()}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        });

        if (!res.ok) return null;
        const data = await res.json();
        if (!data) return [];

        // Firebase RTDB stores objects with keys
        if (Array.isArray(data)) {
            return data.filter(Boolean);
        } else if (typeof data === 'object') {
            return Object.values(data);
        }
        return [];
    } catch {
        return null;
    }
}
