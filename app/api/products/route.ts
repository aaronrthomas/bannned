import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/lib/productStore';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search')?.toLowerCase().trim();
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        const sort = searchParams.get('sort') || 'newest';

        let products = getAllProducts();

        if (search) {
            products = products.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(search)) ||
                    (p.id && p.id.toLowerCase().includes(search)) ||
                    (p.sku && p.sku.toLowerCase().includes(search)) ||
                    (p.tags && p.tags.some((t) => t.text && t.text.toLowerCase().includes(search))) ||
                    (p.filters && p.filters.some((f) => f && f.toLowerCase().includes(search)))
            );
        }

        if (category && category !== 'all') {
            products = products.filter((p) => p.category === category);
        }

        if (status && status !== 'all') {
            products = products.filter((p) => p.status === status);
        }

        // Sorting
        products = [...products].sort((a, b) => {
            if (sort === 'points') {
                return (b.bonusPoints || 0) - (a.bonusPoints || 0);
            }
            if (sort === 'price-low') {
                const pA = parseFloat((a.price || '0').replace(/[^0-9.]/g, '')) || 0;
                const pB = parseFloat((b.price || '0').replace(/[^0-9.]/g, '')) || 0;
                return pA - pB;
            }
            if (sort === 'price-high') {
                const pA = parseFloat((a.price || '0').replace(/[^0-9.]/g, '')) || 0;
                const pB = parseFloat((b.price || '0').replace(/[^0-9.]/g, '')) || 0;
                return pB - pA;
            }
            if (sort === 'stock-low') {
                return (a.stock || 0) - (b.stock || 0);
            }
            if (sort === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            }
            // default: newest updated
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
        });

        return NextResponse.json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to fetch products', stack: error?.stack },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name || !body.price) {
            return NextResponse.json(
                { success: false, error: 'Product name and price are required' },
                { status: 400 }
            );
        }

        const newProduct = createProduct(body);
        return NextResponse.json(
            {
                success: true,
                message: 'Product created successfully',
                product: newProduct,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
