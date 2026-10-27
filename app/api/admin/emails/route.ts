import { NextResponse, NextRequest } from 'next/server';
import { getAllSentEmails, sendAdminOrderNotification } from '@/lib/emailService';
import { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/emails — List all sent email notifications
export async function GET() {
    const emails = getAllSentEmails();
    return NextResponse.json({
        success: true,
        emails,
        count: emails.length,
        adminEmail: process.env.ADMIN_EMAIL || 'admin@bannned.store',
    });
}

// POST /api/admin/emails — Send a test notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const testOrder: Order = {
            id: `ORD-TEST-${Date.now().toString().slice(-4)}`,
            razorpayOrderId: `order_test_${Date.now()}`,
            razorpayPaymentId: `pay_test_${Date.now()}`,
            customerName: body.customerName || 'Test Customer',
            customerEmail: body.customerEmail || 'buyer@example.com',
            customerPhone: '+91 98765 43210',
            items: [
                {
                    productId: 'demon-tee',
                    productName: 'Demon Tee (L)',
                    price: 250,
                    quantity: 1,
                    bonusPoints: 850,
                },
            ],
            totalAmount: 250,
            status: 'paid',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const result = await sendAdminOrderNotification(testOrder);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to send test email' },
            { status: 500 }
        );
    }
}
