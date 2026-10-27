import { NextResponse } from 'next/server';
import { getAllOrders, getAllTransactions, getRevenueStats } from '@/lib/orderStore';
import { getAdminStats } from '@/lib/productStore';
import { getVisitorCount } from '@/lib/visitorStore';
import { getAllSentEmails } from '@/lib/emailService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/analytics — Full real-time analytics for the dashboard
export async function GET() {
    const adminStats = getAdminStats();
    const revenueStats = getRevenueStats();
    const orders = getAllOrders();
    const transactions = getAllTransactions();
    const visitorCount = getVisitorCount();
    const sentEmails = getAllSentEmails();

    return NextResponse.json({
        success: true,
        catalog: adminStats,
        revenue: revenueStats,
        visitorCount,
        sentEmails: sentEmails.slice(0, 20),
        orders: orders.slice(0, 100), // latest 100
        transactions: transactions.slice(0, 100), // latest 100
        serverTime: new Date().toISOString(),
    }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        }
    });
}
