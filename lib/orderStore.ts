import fs from 'fs';
import path from 'path';
import { Order, PaymentTransaction, RazorpaySettings } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const RAZORPAY_SETTINGS_FILE = path.join(DATA_DIR, 'razorpay-settings.json');

const DEFAULT_RAZORPAY_SETTINGS: RazorpaySettings = {
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    currency: 'INR',
    companyName: 'BANNNED',
    companyLogo: '/angel.jpeg',
    testMode: true,
};

function ensureDir() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch {}
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export function getAllOrders(): Order[] {
    try {
        ensureDir();
        if (!fs.existsSync(ORDERS_FILE)) return [];
        return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8')) as Order[];
    } catch {
        return [];
    }
}

export function getOrderById(id: string): Order | null {
    return getAllOrders().find((o) => o.id === id) || null;
}

export function getOrderByRazorpayId(razorpayOrderId: string): Order | null {
    return getAllOrders().find((o) => o.razorpayOrderId === razorpayOrderId) || null;
}

export function createOrder(order: Order): Order {
    const orders = getAllOrders();
    orders.unshift(order);
    try {
        ensureDir();
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    } catch (e) {
        console.warn('[orderStore] Could not write order to local disk (e.g. read-only serverless environment):', e);
    }
    return order;
}

export function updateOrder(id: string, updates: Partial<Order>): Order | null {
    const orders = getAllOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], ...updates, updatedAt: new Date().toISOString() };
    try {
        ensureDir();
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    } catch (e) {
        console.warn('[orderStore] Could not update order on local disk:', e);
    }
    return orders[idx];
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export function getAllTransactions(): PaymentTransaction[] {
    try {
        ensureDir();
        if (!fs.existsSync(TRANSACTIONS_FILE)) return [];
        return JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, 'utf-8')) as PaymentTransaction[];
    } catch {
        return [];
    }
}

export function createTransaction(tx: PaymentTransaction): PaymentTransaction {
    const txs = getAllTransactions();
    txs.unshift(tx);
    try {
        ensureDir();
        fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(txs, null, 2), 'utf-8');
    } catch (e) {
        console.warn('[orderStore] Could not write transaction to local disk:', e);
    }
    return tx;
}

// ─── RAZORPAY CONFIGURATION ───────────────────────────────────────────────────

export function getRazorpaySettings(): RazorpaySettings {
    const envKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const envCurrency = process.env.RAZORPAY_CURRENCY || 'INR';

    let fileSettings = DEFAULT_RAZORPAY_SETTINGS;
    try {
        ensureDir();
        if (fs.existsSync(RAZORPAY_SETTINGS_FILE)) {
            fileSettings = JSON.parse(fs.readFileSync(RAZORPAY_SETTINGS_FILE, 'utf-8')) as RazorpaySettings;
        }
    } catch {
        fileSettings = DEFAULT_RAZORPAY_SETTINGS;
    }

    return {
        keyId: envKeyId || fileSettings.keyId || '',
        keySecret: envKeySecret || fileSettings.keySecret || '',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || fileSettings.webhookSecret || '',
        currency: envCurrency || fileSettings.currency || 'INR',
        companyName: 'BANNNED',
        companyLogo: '/angel.jpeg',
        testMode: !envKeyId || envKeyId.startsWith('rzp_test_'),
    };
}

export function saveRazorpaySettings(settings: RazorpaySettings): RazorpaySettings {
    ensureDir();
    fs.writeFileSync(RAZORPAY_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    return settings;
}

// ─── ANALYTICS HELPERS ────────────────────────────────────────────────────────

export function getRevenueStats() {
    const orders = getAllOrders();
    const paidOrders = orders.filter((o) => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = paidOrders.length;
    const allOrdersCount = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Real units sold & category breakdown
    let totalUnitsSold = 0;
    const categorySales: Record<string, { units: number; revenue: number; label: string }> = {
        tees: { units: 0, revenue: 0, label: 'Graphic Tees' },
        hoodies: { units: 0, revenue: 0, label: 'Heavy Hoodies' },
        sweatshirts: { units: 0, revenue: 0, label: 'Sweatshirts' },
        caps: { units: 0, revenue: 0, label: 'Caps & Headwear' },
        accessories: { units: 0, revenue: 0, label: 'Accessories' },
    };

    paidOrders.forEach((o) => {
        (o.items || []).forEach((item) => {
            const qty = item.quantity || 1;
            totalUnitsSold += qty;
            const nameLower = (item.productName || item.productId || '').toLowerCase();
            let cat = 'tees';
            if (nameLower.includes('hoodie')) cat = 'hoodies';
            else if (nameLower.includes('sweat') || nameLower.includes('crewneck')) cat = 'sweatshirts';
            else if (nameLower.includes('cap') || nameLower.includes('snapback') || nameLower.includes('hat')) cat = 'caps';
            else if (nameLower.includes('tote') || nameLower.includes('bag') || nameLower.includes('accessory')) cat = 'accessories';

            if (categorySales[cat]) {
                categorySales[cat].units += qty;
                categorySales[cat].revenue += (item.price || 0) * qty;
            }
        });
    });

    // Unique customers
    const uniqueEmails = new Set(orders.map((o) => (o.customerEmail || '').toLowerCase().trim()).filter(Boolean));
    const uniqueCustomers = uniqueEmails.size;

    // Monthly breakdown for Customer Habits (past 7 months up to current month)
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyHabits: { month: string; seen: number; sales: number; productsCount: number; salesAmount: number }[] = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mName = months[d.getMonth()];
        const y = d.getFullYear();
        const mIdx = d.getMonth();

        const monthOrders = paidOrders.filter((o) => {
            const od = new Date(o.createdAt);
            return od.getFullYear() === y && od.getMonth() === mIdx;
        });

        const monthUnits = monthOrders.reduce((s, o) => s + (o.items?.reduce((is, it) => is + (it.quantity || 1), 0) || 1), 0);
        const monthRev = monthOrders.reduce((s, o) => s + o.totalAmount, 0);

        monthlyHabits.push({
            month: mName,
            seen: monthUnits > 0 ? Math.min(100, Math.max(25, monthUnits * 15)) : 10,
            sales: monthOrders.length > 0 ? Math.min(100, Math.max(30, monthOrders.length * 20)) : 15,
            productsCount: monthUnits,
            salesAmount: monthRev,
        });
    }

    // Daily revenue for last 7 days
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayOrders = paidOrders.filter((o) => o.createdAt.slice(0, 10) === dateStr);
        dailyRevenue.push({
            date: dateStr,
            revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
            orders: dayOrders.length,
        });
    }

    return {
        totalRevenue,
        totalOrders,
        allOrdersCount,
        avgOrderValue,
        totalUnitsSold,
        categorySales,
        uniqueCustomers,
        monthlyHabits,
        dailyRevenue,
    };
}
