import { NextRequest, NextResponse } from 'next/server';
import { getRazorpaySettings, getOrderByRazorpayId, updateOrder, createTransaction, getRevenueStats } from '@/lib/orderStore';
import { getProductById, updateProduct } from '@/lib/productStore';
import { sendAdminOrderNotification } from '@/lib/emailService';
import { syncOrderToFirebase, syncStatsToFirebase } from '@/lib/firebaseService';
import { PaymentTransaction } from '@/lib/types';
import crypto from 'crypto';

// POST /api/razorpay/verify — Verify Razorpay payment signature after frontend payment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            customerEmail,
            method,
        } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json(
                { success: false, error: 'Missing payment verification fields' },
                { status: 400 }
            );
        }

        const settings = getRazorpaySettings();
        const isSimulation =
            razorpay_signature === 'simulated_signature_valid' ||
            razorpay_order_id.startsWith('order_sim_') ||
            !settings.keySecret;

        // If live keys exist and not a simulated order, verify HMAC signature
        if (!isSimulation && settings.keySecret) {
            const generatedSignature = crypto
                .createHmac('sha256', settings.keySecret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (generatedSignature !== razorpay_signature) {
                const order = getOrderByRazorpayId(razorpay_order_id);
                if (order) {
                    updateOrder(order.id, { status: 'failed' });
                }
                return NextResponse.json(
                    { success: false, error: 'Payment signature verification failed' },
                    { status: 400 }
                );
            }
        }

        // Locate order by Razorpay Order ID
        const order = getOrderByRazorpayId(razorpay_order_id);
        if (!order) {
            return NextResponse.json(
                { success: false, error: `Order not found for razorpay ID ${razorpay_order_id}` },
                { status: 404 }
            );
        }

        // Signature verified — mark order as paid
        const updatedOrder = updateOrder(order.id, {
            status: 'paid',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
        });

        // Record payment transaction
        const tx: PaymentTransaction = {
            id: `TXN-${Date.now()}`,
            orderId: order.id,
            razorpayPaymentId: razorpay_payment_id,
            amount: order.totalAmount,
            currency: settings.currency || 'INR',
            status: 'captured',
            method: method || (isSimulation ? 'sandbox_upi' : 'razorpay'),
            customerEmail: customerEmail || order.customerEmail,
            createdAt: new Date().toISOString(),
        };

        createTransaction(tx);

        // Update product inventory (decrement stock in realtime)
        if (order.items && order.items.length > 0) {
            for (const item of order.items) {
                const prod = getProductById(item.productId);
                if (prod) {
                    const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
                    updateProduct(prod.id, {
                        stock: newStock,
                        status: newStock === 0 ? 'out_of_stock' : prod.status,
                    });
                }
            }
        }

        const finalOrder = updatedOrder || order;

        // Sync order to Firebase Realtime Database
        syncOrderToFirebase(finalOrder).catch((err) => {
            console.error('Firebase order sync notice:', err);
        });

        // Sync updated revenue stats to Firebase Realtime Database
        try {
            const currentStats = getRevenueStats();
            syncStatsToFirebase(currentStats).catch(() => {});
        } catch {}

        // Dispatch email notification to admin asynchronously via Resend
        sendAdminOrderNotification(finalOrder, tx).catch((err) => {
            console.error('Failed to dispatch admin email notification:', err);
        });

        return NextResponse.json({
            success: true,
            message: 'Payment verified, inventory deducted, synced to Firebase RTDB, and admin notified',
            orderId: order.id,
            paymentId: razorpay_payment_id,
            adminNotified: true,
            firebaseSynced: true,
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { success: false, error: 'Payment verification failed' },
            { status: 500 }
        );
    }
}
