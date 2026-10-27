import { NextResponse } from 'next/server';
import { getAllOrders } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://bannned-default-rtdb.firebaseio.com';

async function fetchUsersFromFirebase(): Promise<any[]> {
    try {
        const url = `${FIREBASE_DATABASE_URL.replace(/\/+$/, '')}/users.json`;
        const res = await fetch(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-store' },
            signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (!data || typeof data !== 'object') return [];
        
        return Object.entries(data).map(([key, val]: [string, any]) => {
            if (!val || typeof val !== 'object') return null;
            return {
                uid: val.uid || key,
                ...val,
            };
        }).filter(Boolean) as any[];
    } catch {
        return [];
    }
}

export async function GET() {
    try {
        const [firebaseUsers, orders] = await Promise.all([
            fetchUsersFromFirebase(),
            Promise.resolve().then(() => getAllOrders()).catch(() => []),
        ]);

        // Key map to unify users across Firebase auth and Store Orders
        const userMap = new Map<string, any>();

        // 1. Populate registered Firebase accounts
        firebaseUsers.forEach(u => {
            const key = (u.email || u.uid || '').toLowerCase().trim();
            if (key) {
                userMap.set(key, {
                    ...u,
                    loyaltyPoints: Number(u.loyaltyPoints) || 0,
                    totalOrders: Number(u.totalOrders) || 0,
                    totalSpent: Number(u.totalSpent) || 0,
                });
            }
        });

        // 2. Synthesize & merge customer accounts from store orders
        orders.forEach((order: any) => {
            const emailKey = (order.customerEmail || '').toLowerCase().trim();
            const phoneKey = (order.customerPhone || '').trim();
            const matchedUser = (emailKey ? userMap.get(emailKey) : null) || (phoneKey ? userMap.get(phoneKey) : null);

            const orderAmount = Number(order.totalAmount) || 0;
            const orderBonus = Array.isArray(order.items)
                ? order.items.reduce((sum: number, it: any) => sum + (Number(it.bonusPoints) || 0) * (Number(it.quantity) || 1), 0)
                : 0;

            if (matchedUser) {
                // Enrich existing registered user
                if (!matchedUser.phone && order.customerPhone) matchedUser.phone = order.customerPhone;
                if (!matchedUser.fullName && order.customerName) matchedUser.fullName = order.customerName;
                if (!matchedUser.displayName && order.customerName) matchedUser.displayName = order.customerName;
                if (!matchedUser.city && order.shippingAddress?.city) matchedUser.city = order.shippingAddress.city;
                if (!matchedUser.state && order.shippingAddress?.state) matchedUser.state = order.shippingAddress.state;
            } else if (emailKey || phoneKey) {
                // Create unified customer profile
                const custKey = emailKey || phoneKey;
                userMap.set(custKey, {
                    uid: `cust-${order.id}`,
                    email: order.customerEmail || '',
                    fullName: order.customerName || 'Store Customer',
                    displayName: order.customerName || 'Store Customer',
                    phone: order.customerPhone || '',
                    provider: 'guest',
                    profileComplete: Boolean(order.customerEmail && order.customerName),
                    totalOrders: 0,
                    totalSpent: 0,
                    loyaltyPoints: orderBonus,
                    createdAt: order.createdAt || new Date().toISOString(),
                    city: order.shippingAddress?.city || '',
                    state: order.shippingAddress?.state || '',
                });
            }
        });

        // 3. Accurately calculate order counts and spend from real order history
        userMap.forEach((user) => {
            const email = (user.email || '').toLowerCase().trim();
            const phone = (user.phone || '').trim();
            const matchingOrders = orders.filter((o: any) => {
                const oEmail = (o.customerEmail || '').toLowerCase().trim();
                const oPhone = (o.customerPhone || '').trim();
                return (email && oEmail === email) || (phone && oPhone === phone);
            });

            if (matchingOrders.length > 0) {
                user.totalOrders = matchingOrders.length;
                user.totalSpent = matchingOrders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
            }
        });

        const allUsers = Array.from(userMap.values());

        // Sort: newest joined first
        const sorted = allUsers.sort((a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        const stats = {
            total: allUsers.length,
            profileComplete: allUsers.filter((u: any) => u.profileComplete).length,
            profileIncomplete: allUsers.filter((u: any) => !u.profileComplete).length,
            googleUsers: allUsers.filter((u: any) => u.provider === 'google').length,
            phoneUsers: allUsers.filter((u: any) => u.provider === 'phone').length,
            emailUsers: allUsers.filter((u: any) => u.provider === 'email').length,
            guestUsers: allUsers.filter((u: any) => u.provider === 'guest' || !u.provider).length,
            totalLoyaltyPoints: allUsers.reduce((sum: number, u: any) => sum + (Number(u.loyaltyPoints) || 0), 0),
            totalOrders: allUsers.reduce((sum: number, u: any) => sum + (Number(u.totalOrders) || 0), 0),
            totalSpent: allUsers.reduce((sum: number, u: any) => sum + (Number(u.totalSpent) || 0), 0),
        };

        return NextResponse.json({
            success: true,
            users: sorted,
            stats,
        }, {
            headers: { 'Cache-Control': 'no-store, max-age=0' },
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

// Update user loyalty points
export async function PATCH(request: Request) {
    try {
        const { uid, loyaltyPoints } = await request.json();
        if (!uid) return NextResponse.json({ success: false, error: 'UID required' }, { status: 400 });

        const pts = Math.max(0, parseInt(String(loyaltyPoints), 10) || 0);
        const url = `${FIREBASE_DATABASE_URL.replace(/\/+$/, '')}/users/${uid}.json`;
        
        const res = await fetch(url, {
            method: 'PATCH',
            body: JSON.stringify({
                uid,
                loyaltyPoints: pts,
                updatedAt: new Date().toISOString(),
            }),
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) throw new Error('Firebase update failed');
        return NextResponse.json({ success: true, loyaltyPoints: pts });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
