import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, getAllOrders } from '@/lib/orderStore';
import { sendCustomerInvoiceEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/invoices?orderId=...
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
        const orders = getAllOrders();
        return NextResponse.json({
            success: true,
            invoices: orders.map(o => ({
                invoiceNumber: `INV-${o.id.replace(/[^0-9]/g, '').slice(-6) || '2026'}`,
                orderId: o.id,
                customerName: o.customerName,
                customerEmail: o.customerEmail,
                amount: o.totalAmount,
                status: o.status,
                createdAt: o.createdAt,
            }))
        });
    }

    const order = getOrderById(orderId);
    if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const invoiceNumber = `INV-${order.id.replace(/[^0-9]/g, '').slice(-6) || '2026'}`;
    const formattedAmount = `₹${order.totalAmount.toLocaleString('en-IN')}`;
    const taxAmount = Math.round(order.totalAmount * 0.18 * 100) / 100;
    const subtotal = order.totalAmount;

    return NextResponse.json({
        success: true,
        invoice: {
            invoiceNumber,
            order,
            subtotal,
            taxAmount,
            formattedAmount,
            issuedDate: order.createdAt,
            company: {
                name: 'BANNNED STUDIO LTD',
                address: '100ft Rd, Indiranagar, Bengaluru, Karnataka 560038',
                gstin: '29AAACB1234F1Z8',
                email: 'orders@bannned.store',
                phone: '+91 80 4912 3400',
            },
        }
    });
}

// POST /api/admin/invoices — Send invoice via Resend
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, recipientEmail } = body;

        if (!orderId) {
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
        }

        const order = getOrderById(orderId);
        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        const result = await sendCustomerInvoiceEmail(order, recipientEmail);
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
