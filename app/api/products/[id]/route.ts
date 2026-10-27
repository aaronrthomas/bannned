import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/productStore';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = getProductById(id);

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updated = updateProduct(id, body);
        if (!updated) {
            return NextResponse.json(
                { success: false, error: 'Product not found or could not be updated' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Product updated successfully',
            product: updated,
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update product' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const deleted = deleteProduct(id);

        if (!deleted) {
            return NextResponse.json(
                { success: false, error: 'Product not found or could not be deleted' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}
