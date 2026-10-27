export interface ProductTag {
    text: string;
    iconBefore?: boolean;
    iconAfter?: boolean;
}

export interface ProductBadge {
    text: string;
    bg: string;
}

export interface ProductSpecs {
    gsm: string;
    fit: string;
    material: string;
    wash?: string;
    print?: string;
    origin?: string;
    details?: string;
}

export interface ProductColor {
    name: string;
    hex: string;
    active?: boolean;
}

export type ProductCategory = 'tees' | 'hoodies' | 'sweatshirts' | 'caps' | 'accessories';

export type ProductStatus = 'active' | 'draft' | 'archived' | 'out_of_stock';

export interface Product {
    id: string; // unique slug e.g. 'demon-tee'
    name: string;
    price: string; // e.g. '₹250.00'
    originalPrice?: string;
    badge: ProductBadge;
    src: string; // image url e.g. '/red.jpeg'
    category: ProductCategory;
    description: string;
    tags: ProductTag[];
    filters: string[]; // e.g. ['White', 'Black', 'Grey', 'Blue', 'Popular']
    specs: ProductSpecs;
    hyperlink: string;
    stock: number;
    totalPieces: number;
    status: ProductStatus;
    sku: string;
    colors?: ProductColor[];
    bonusPoints?: number; // admin-assigned bonus points for this product
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminStats {
    totalProducts: number;
    activeProducts: number;
    draftProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    totalInventoryUnits: number;
    totalCatalogValue: number;
    categoryCounts: Record<string, number>;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    bonusPoints: number;
}

export interface Order {
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentTransaction {
    id: string;
    orderId: string;
    razorpayPaymentId: string;
    amount: number;
    currency: string;
    status: 'captured' | 'failed' | 'refunded';
    method: string;
    customerEmail: string;
    createdAt: string;
}

export interface RazorpaySettings {
    keyId: string;
    keySecret: string; // stored masked in frontend
    webhookSecret: string;
    currency: string;
    companyName: string;
    companyLogo: string;
    testMode: boolean;
}
