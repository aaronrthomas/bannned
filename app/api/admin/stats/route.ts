import { NextResponse } from 'next/server';
import { getAdminStats } from '@/lib/productStore';

export async function GET() {
    try {
        const stats = getAdminStats();
        return NextResponse.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
