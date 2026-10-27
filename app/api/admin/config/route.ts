import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://bannned-default-rtdb.firebaseio.com';
const ADMIN_EMAIL = 'bannnedshop@gmail.com';
const DEFAULT_ADMIN_ID = 'BANNNED-ADMIN-01';

export async function GET() {
    try {
        const url = `${FIREBASE_DATABASE_URL.replace(/\/+$/, '')}/admin_config.json`;
        const res = await fetch(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-store' }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
                return NextResponse.json({
                    success: true,
                    adminId: data.adminId || DEFAULT_ADMIN_ID,
                    adminEmail: ADMIN_EMAIL,
                    updatedAt: data.updatedAt || null,
                });
            }
        }
        return NextResponse.json({
            success: true,
            adminId: DEFAULT_ADMIN_ID,
            adminEmail: ADMIN_EMAIL,
            updatedAt: null,
        });
    } catch {
        return NextResponse.json({
            success: true,
            adminId: DEFAULT_ADMIN_ID,
            adminEmail: ADMIN_EMAIL,
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { adminId, callerEmail } = body;

        // Security check: only bannnedshop@gmail.com can change admin credentials
        if (!callerEmail || callerEmail.toLowerCase() !== ADMIN_EMAIL) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorised. Only the master administrator can change admin credentials.'
            }, { status: 403 });
        }

        if (!adminId || typeof adminId !== 'string' || adminId.trim().length < 3) {
            return NextResponse.json({
                success: false,
                error: 'Admin ID must be at least 3 characters long.'
            }, { status: 400 });
        }

        const cleanAdminId = adminId.trim().toUpperCase();

        const url = `${FIREBASE_DATABASE_URL.replace(/\/+$/, '')}/admin_config.json`;
        const res = await fetch(url, {
            method: 'PATCH',
            body: JSON.stringify({
                adminId: cleanAdminId,
                updatedAt: new Date().toISOString(),
                updatedBy: callerEmail.toLowerCase(),
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            throw new Error('Failed to update admin config in Firebase');
        }

        return NextResponse.json({
            success: true,
            adminId: cleanAdminId,
            message: 'Admin ID updated successfully'
        });
    } catch (err: any) {
        return NextResponse.json({
            success: false,
            error: err.message || 'Failed to update admin config'
        }, { status: 500 });
    }
}
