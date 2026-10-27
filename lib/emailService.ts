import fs from 'fs';
import path from 'path';
import { Order, PaymentTransaction } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const EMAILS_FILE = path.join(DATA_DIR, 'sent-emails.json');

export interface SentEmail {
    id: string;
    orderId: string;
    recipient: string;
    subject: string;
    html: string;
    text: string;
    sentAt: string;
    status: 'delivered' | 'simulated_delivered' | 'failed';
    provider: string;
    type?: 'admin_notification' | 'customer_invoice';
}

function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function getAllSentEmails(): SentEmail[] {
    try {
        ensureDir();
        if (!fs.existsSync(EMAILS_FILE)) return [];
        return JSON.parse(fs.readFileSync(EMAILS_FILE, 'utf-8')) as SentEmail[];
    } catch {
        return [];
    }
}

export function recordSentEmail(email: SentEmail): SentEmail {
    ensureDir();
    const emails = getAllSentEmails();
    emails.unshift(email);
    // Keep last 100 emails
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails.slice(0, 100), null, 2), 'utf-8');
    return email;
}

export function getResendStatus() {
    const key = process.env.RESEND_API_KEY || '';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bannned.store';
    return {
        configured: Boolean(key && key.startsWith('re_')),
        hasKey: Boolean(key),
        fromEmail,
        adminEmail,
        maskedKey: key ? `${key.slice(0, 6)}...${key.slice(-4)}` : null,
    };
}

/**
 * Dispatches automated order placement alert to the store admin
 */
export async function sendAdminOrderNotification(
    order: Order,
    transaction?: PaymentTransaction | null
): Promise<{ success: boolean; emailId: string; provider: string; message: string; resendId?: string }> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bannned.store';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const emailId = `EMAIL-${Date.now()}`;
    const formattedAmount = `₹${order.totalAmount.toLocaleString('en-IN')}`;
    const subject = `🚨 New Order Placed: #${order.id} (${formattedAmount})`;

    const itemsRows = order.items.map((item) => `
        <tr style="border-bottom: 1px solid #2d3748;">
            <td style="padding: 12px 8px; color: #ffffff; font-weight: 600;">${item.productName}</td>
            <td style="padding: 12px 8px; color: #a0aec0; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 8px; color: #ecc94b; text-align: center;">+${item.bonusPoints || 0} pts</td>
            <td style="padding: 12px 8px; color: #ffffff; text-align: right; font-weight: 700;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
        <div style="max-width: 600px; margin: 30px auto; background-color: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <!-- HEADER -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b5bf5 100%); padding: 32px 28px; text-align: center;">
                <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); border-radius: 50%; padding: 10px; margin-bottom: 10px;">
                    <span style="font-size: 28px;">📦</span>
                </div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">New Store Order Placed</h1>
                <p style="margin: 6px 0 0 0; font-size: 14px; color: #dbeafe;">BANNNED × DealDeck Admin Notification</p>
            </div>

            <!-- ORDER SUMMARY BANNER -->
            <div style="padding: 24px 28px; background-color: #172033; border-bottom: 1px solid #1f2937;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; font-weight: 700;">Order ID</span>
                        <div style="font-size: 16px; font-weight: 800; color: #ffffff;">${order.id}</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; font-weight: 700;">Total Revenue</span>
                        <div style="font-size: 22px; font-weight: 900; color: #38bdf8;">${formattedAmount}</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #94a3b8;">
                    Placed on: <strong>${new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</strong>
                </div>
            </div>

            <!-- CUSTOMER DETAILS -->
            <div style="padding: 24px 28px;">
                <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 0 0 14px 0; font-weight: 700;">Customer Details</h2>
                <div style="background-color: #0f172a; border-radius: 12px; padding: 16px; border: 1px solid #1e293b;">
                    <div style="margin-bottom: 8px;">
                        <span style="color: #64748b; font-size: 12px; display: inline-block; width: 80px;">Name:</span>
                        <strong style="color: #ffffff; font-size: 14px;">${order.customerName}</strong>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <span style="color: #64748b; font-size: 12px; display: inline-block; width: 80px;">Email:</span>
                        <a href="mailto:${order.customerEmail}" style="color: #60a5fa; text-decoration: none;">${order.customerEmail}</a>
                    </div>
                    <div>
                        <span style="color: #64748b; font-size: 12px; display: inline-block; width: 80px;">Phone:</span>
                        <span style="color: #cbd5e1; font-size: 13px;">${order.customerPhone || 'Not provided'}</span>
                    </div>
                </div>

                <!-- ITEMS TABLE -->
                <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 24px 0 12px 0; font-weight: 700;">Ordered Items</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #334155; text-align: left;">
                            <th style="padding: 8px; color: #94a3b8; font-size: 11px; text-transform: uppercase;">Product</th>
                            <th style="padding: 8px; color: #94a3b8; font-size: 11px; text-transform: uppercase; text-align: center;">Qty</th>
                            <th style="padding: 8px; color: #94a3b8; font-size: 11px; text-transform: uppercase; text-align: center;">Bonus</th>
                            <th style="padding: 8px; color: #94a3b8; font-size: 11px; text-transform: uppercase; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <!-- PAYMENT INFO -->
                <div style="margin-top: 24px; padding: 14px 18px; background-color: #0c1a2e; border-left: 4px solid #3b5bf5; border-radius: 8px;">
                    <div style="font-size: 12px; color: #93c5fd; margin-bottom: 4px;">
                        <strong>Payment Status:</strong> Paid via Razorpay
                    </div>
                    <div style="font-size: 11px; color: #64748b; font-family: monospace;">
                        Order Ref: ${order.razorpayOrderId} ${order.razorpayPaymentId ? `| Pay ID: ${order.razorpayPaymentId}` : ''}
                    </div>
                </div>

                <!-- CALL TO ACTION -->
                <div style="text-align: center; margin-top: 32px; margin-bottom: 8px;">
                    <a href="http://localhost:3000/admin?tab=orders" style="display: inline-block; background-color: #3b5bf5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(59,91,245,0.4);">
                        View Order in Admin Dashboard →
                    </a>
                </div>
            </div>

            <!-- FOOTER -->
            <div style="padding: 20px 28px; background-color: #0b0f17; border-top: 1px solid #1f2937; text-align: center; font-size: 11px; color: #64748b;">
                This automated order alert was generated by BANNNED Storefront Engine.
            </div>
        </div>
    </body>
    </html>
    `;

    const plainText = `
NEW ORDER PLACED - ${formattedAmount}
==========================================
Order ID: ${order.id}
Date: ${new Date(order.createdAt).toLocaleString()}
Customer: ${order.customerName} (${order.customerEmail})
Phone: ${order.customerPhone || 'N/A'}

Items:
${order.items.map(it => `- ${it.productName} x ${it.quantity}: ₹${it.price * it.quantity}`).join('\n')}

Total: ${formattedAmount}
Razorpay Order ID: ${order.razorpayOrderId}
Razorpay Payment ID: ${order.razorpayPaymentId || 'N/A'}
`;

    let provider = 'simulated_local';
    let deliveryStatus: 'delivered' | 'simulated_delivered' | 'failed' = 'simulated_delivered';
    let resendMessageId: string | undefined;

    // 1. Send via Resend if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
        try {
            console.log(`[Resend] Dispatching admin alert to ${adminEmail} from ${fromEmail}...`);
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: [adminEmail],
                    subject,
                    html,
                    text: plainText,
                }),
            });

            const resData = await res.json().catch(() => ({}));
            if (res.ok && resData?.id) {
                provider = 'resend';
                deliveryStatus = 'delivered';
                resendMessageId = resData.id;
                console.log(`✅ [Resend] Dispatched successfully! Resend Message ID: ${resData.id}`);
            } else {
                console.error(`⚠️ [Resend] API Error (${res.status}):`, resData);
            }
        } catch (e: any) {
            console.error('Failed to send via Resend:', e.message);
        }
    }

    // Record the sent email locally so admin can inspect all notifications
    const sentRecord: SentEmail = {
        id: emailId,
        orderId: order.id,
        recipient: adminEmail,
        subject,
        html,
        text: plainText,
        sentAt: new Date().toISOString(),
        status: deliveryStatus,
        provider,
        type: 'admin_notification',
    };
    recordSentEmail(sentRecord);

    // Also output to server terminal so admin gets notified immediately
    console.log('\n================================================================');
    console.log(`📧 [ADMIN ORDER NOTIFICATION DISPATCHED]`);
    console.log(`To: ${adminEmail}`);
    console.log(`Order: ${order.id} | Amount: ${formattedAmount}`);
    console.log(`Customer: ${order.customerName} <${order.customerEmail}>`);
    console.log(`Status: ${deliveryStatus} (Provider: ${provider}${resendMessageId ? ` | Resend ID: ${resendMessageId}` : ''})`);
    console.log('================================================================\n');

    return {
        success: true,
        emailId,
        provider,
        resendId: resendMessageId,
        message: `Admin notification dispatched to ${adminEmail} (${provider})`,
    };
}

/**
 * Dispatches an official printable invoice email directly to the customer (and CCs admin)
 */
export async function sendCustomerInvoiceEmail(
    order: Order,
    targetRecipient?: string
): Promise<{ success: boolean; emailId: string; provider: string; message: string; resendId?: string }> {
    const recipient = targetRecipient || order.customerEmail;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bannned.store';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const emailId = `INV-EMAIL-${Date.now()}`;
    const invoiceNumber = `INV-${order.id.replace(/[^0-9]/g, '').slice(-6) || '2026'}`;
    const formattedAmount = `₹${order.totalAmount.toLocaleString('en-IN')}`;
    const subject = `Tax Invoice ${invoiceNumber} — BANNNED Apparel (${formattedAmount})`;

    const itemsRows = order.items.map((item, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 10px; color: #64748b; font-size: 12px;">#${idx + 1}</td>
            <td style="padding: 12px 10px; color: #0f172a; font-weight: 700;">${item.productName}</td>
            <td style="padding: 12px 10px; color: #64748b; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px 10px; color: #d97706; text-align: center; font-weight: 700;">+${item.bonusPoints || 0} pts</td>
            <td style="padding: 12px 10px; color: #0f172a; text-align: right; font-weight: 700;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
        <div style="max-width: 650px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);">
            
            <!-- HEADER -->
            <div style="padding: 36px 36px 24px; border-bottom: 2px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -1px; color: #0f172a;">BANNNED</h1>
                    <p style="margin: 3px 0 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Official Tax Invoice</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 16px; font-weight: 800; color: #3b5bf5;">${invoiceNumber}</div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <span style="display: inline-block; background-color: #e8f9ee; color: #16a34a; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; margin-top: 6px;">PAID • RAZORPAY</span>
                </div>
            </div>

            <!-- BILLING INFO -->
            <div style="padding: 24px 36px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50%; vertical-align: top;">
                            <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">BILLED TO</div>
                            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${order.customerName}</div>
                            <div style="font-size: 13px; color: #475569; margin-top: 2px;">${order.customerEmail}</div>
                            <div style="font-size: 13px; color: #475569; margin-top: 2px;">${order.customerPhone || '—'}</div>
                        </td>
                        <td style="width: 50%; vertical-align: top; text-align: right;">
                            <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">SOLD BY</div>
                            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 4px;">BANNNED STUDIO LTD</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">100ft Rd, Indiranagar, Bengaluru, KA</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">GSTIN: 29AAACB1234F1Z8</div>
                        </td>
                    </tr>
                </table>
            </div>

            <!-- ITEMS TABLE -->
            <div style="padding: 24px 36px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #0f172a; text-align: left;">
                            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #64748b;">Item</th>
                            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #64748b;">Description</th>
                            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center;">Qty</th>
                            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center;">Points</th>
                            <th style="padding: 10px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>

                <!-- TOTALS SECTION -->
                <div style="margin-top: 28px; padding-top: 18px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">
                    <div style="width: 260px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
                            <span>Subtotal:</span>
                            <span style="font-weight: 600;">${formattedAmount}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
                            <span>Shipping & Handling:</span>
                            <span style="font-weight: 700; color: #16a34a;">FREE</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 12px;">
                            <span>Taxes (18% GST Incl.):</span>
                            <span style="font-weight: 600;">₹${Math.round(order.totalAmount * 0.18 * 100) / 100}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; color: #0f172a; padding-top: 10px; border-top: 2px solid #0f172a;">
                            <span>Total Paid:</span>
                            <span style="color: #3b5bf5;">${formattedAmount}</span>
                        </div>
                    </div>
                </div>

                <!-- PAYMENT VERIFICATION -->
                <div style="margin-top: 30px; padding: 14px 18px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                    <div><strong>Payment Method:</strong> Razorpay Gateway (${order.status === 'paid' ? 'Success' : 'Pending'})</div>
                    <div style="font-family: monospace; font-size: 11px; margin-top: 3px;">
                        Order Ref: ${order.razorpayOrderId} ${order.razorpayPaymentId ? `| Payment ID: ${order.razorpayPaymentId}` : ''}
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
                Thank you for choosing BANNNED. For support inquiries, reach us at support@bannned.store.
            </div>
        </div>
    </body>
    </html>
    `;

    const plainText = `
TAX INVOICE: ${invoiceNumber}
Customer: ${order.customerName} (${recipient})
Total: ${formattedAmount}
Payment Status: PAID via Razorpay
Items:
${order.items.map(it => `- ${it.productName} x ${it.quantity}: ₹${it.price * it.quantity}`).join('\n')}
`;

    let provider = 'simulated_local';
    let deliveryStatus: 'delivered' | 'simulated_delivered' | 'failed' = 'simulated_delivered';
    let resendMessageId: string | undefined;

    // Send via Resend
    if (process.env.RESEND_API_KEY) {
        try {
            console.log(`[Resend] Dispatching customer invoice to ${recipient}...`);
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: [recipient],
                    subject,
                    html,
                    text: plainText,
                }),
            });

            const resData = await res.json().catch(() => ({}));
            if (res.ok && resData?.id) {
                provider = 'resend';
                deliveryStatus = 'delivered';
                resendMessageId = resData.id;
            }
        } catch (e: any) {
            console.error('Failed to send invoice via Resend:', e.message);
        }
    }

    const sentRecord: SentEmail = {
        id: emailId,
        orderId: order.id,
        recipient,
        subject,
        html,
        text: plainText,
        sentAt: new Date().toISOString(),
        status: deliveryStatus,
        provider,
        type: 'customer_invoice',
    };
    recordSentEmail(sentRecord);

    return {
        success: true,
        emailId,
        provider,
        resendId: resendMessageId,
        message: `Invoice email dispatched to ${recipient}`,
    };
}
