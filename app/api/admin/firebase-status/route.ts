import { NextResponse } from 'next/server';
import { getFirebaseStatus } from '@/lib/firebaseService';
import { getResendStatus } from '@/lib/emailService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const firebase = getFirebaseStatus();
    const resend = getResendStatus();

    return NextResponse.json({
        success: true,
        firebase,
        resend,
        serverTime: new Date().toISOString(),
    });
}
