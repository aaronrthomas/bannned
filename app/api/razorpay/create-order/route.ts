import { NextRequest, NextResponse } from 'next/server';
import { getRazorpaySettings, createOrder, getAllOrders } from '@/lib/orderStore';
import { Order } from '@/lib/types';

// POST /api/razorpay/create-order — Create a Razorpay order server-side
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, currency = 'INR', customerName, customerEmail, customerPhone, items } = body;

        if (!amount || !customerName || !customerEmail) {
            return NextResponse.json(
                { success: false, error: 'Amount, customer name and email are required' },
                { status: 400 }
            );
        }

        const settings = getRazorpaySettings();
        const hasLiveKeys = Boolean(settings.keyId && settings.keySecret);

        let rzpOrderId = '';
        let isSimulated = false;

        if (hasLiveKeys) {
            // Live Razorpay order via REST API
            const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${Buffer.from(`${settings.keyId}:${settings.keySecret}`).toString('base64')}`,
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100), // Razorpay uses paise
                    currency,
                    receipt: `rcpt_${Date.now()}`,
                }),
            });

            if (razorpayResponse.ok) {
                const rzpOrder = await razorpayResponse.json();
                rzpOrderId = rzpOrder.id;
            } else {
                console.warn('Razorpay live API order creation failed, falling back to test order');
                rzpOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                isSimulated = true;
            }
        } else {
            // Simulated / sandbox test order
            rzpOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            isSimulated = true;
        }

        // Persist pending order in order store
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const now = new Date().toISOString();
        const newOrder: Order = {
            id: orderId,
            razorpayOrderId: rzpOrderId,
            customerName,
            customerEmail,
            customerPhone: customerPhone || '',
            items: items || [],
            totalAmount: amount,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        };

        createOrder(newOrder);

        return NextResponse.json({
            success: true,
            orderId,
            razorpayOrderId: rzpOrderId,
            amount: Math.round(amount * 100),
            currency,
            keyId: settings.keyId || 'rzp_test_simulated',
            companyName: settings.companyName,
            companyLogo: settings.companyLogo,
            isSimulated,
        });
    } catch (error) {
        console.error('Error creating payment order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create payment order' },
            { status: 500 }
        );
    }
}

// GET /api/razorpay/create-order — list all orders (admin use)
export async function GET() {
    const orders = getAllOrders();
    return NextResponse.json({ success: true, orders, count: orders.length });
}
