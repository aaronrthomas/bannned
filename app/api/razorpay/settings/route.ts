import { NextRequest, NextResponse } from 'next/server';
import { getRazorpaySettings, saveRazorpaySettings } from '@/lib/orderStore';
import { RazorpaySettings } from '@/lib/types';

// GET /api/razorpay/settings — Fetch settings (keys are masked in response)
export async function GET() {
    const settings = getRazorpaySettings();
    const masked: RazorpaySettings = {
        ...settings,
        keySecret: settings.keySecret ? `${settings.keySecret.slice(0, 8)}${'*'.repeat(Math.max(0, settings.keySecret.length - 8))}` : '',
        webhookSecret: settings.webhookSecret ? '●●●●●●●●●●●●' : '',
    };
    return NextResponse.json({ success: true, settings: masked, configured: !!settings.keyId && !!settings.keySecret });
}

// PUT /api/razorpay/settings — Save settings
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json() as Partial<RazorpaySettings>;
        const current = getRazorpaySettings();

        const updated: RazorpaySettings = {
            ...current,
            keyId: body.keyId ?? current.keyId,
            currency: body.currency ?? current.currency,
            companyName: body.companyName ?? current.companyName,
            companyLogo: body.companyLogo ?? current.companyLogo,
            testMode: body.testMode ?? current.testMode,
            // Only update secrets if not masked placeholder
            keySecret: body.keySecret && !body.keySecret.includes('*') && !body.keySecret.includes('●')
                ? body.keySecret
                : current.keySecret,
            webhookSecret: body.webhookSecret && !body.webhookSecret.includes('●')
                ? body.webhookSecret
                : current.webhookSecret,
        };

        saveRazorpaySettings(updated);

        return NextResponse.json({ success: true, message: 'Razorpay settings saved successfully' });
    } catch (error) {
        console.error('Failed to save settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save Razorpay settings' },
            { status: 500 }
        );
    }
}
