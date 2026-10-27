import { NextRequest, NextResponse } from 'next/server';
import { getVisitorCount, recordVisit } from '@/lib/visitorStore';

export async function GET() {
    const count = getVisitorCount();
    return NextResponse.json({ success: true, count });
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'visitor';
    const count = recordVisit(ip);
    return NextResponse.json({ success: true, count });
}
