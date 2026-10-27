import { NextResponse } from 'next/server';
import { resetToSeedProducts } from '@/lib/productStore';

export async function POST() {
    try {
        const products = resetToSeedProducts();
        return NextResponse.json({
            success: true,
            message: 'Catalog reset to original seed products successfully',
            count: products.length,
            products,
        });
    } catch (error) {
        console.error('Error resetting products:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to reset catalog' },
            { status: 500 }
        );
    }
}
