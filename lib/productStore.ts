import fs from 'fs';
import path from 'path';
import { Product, AdminStats } from './types';
import { INITIAL_PRODUCTS } from './initialProducts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'products.json');

// In-memory cache for fast access
let memoryProducts: Product[] | null = null;

function ensureDataFile(): Product[] {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_PRODUCTS, null, 2), 'utf-8');
            memoryProducts = [...INITIAL_PRODUCTS];
            return memoryProducts;
        }
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(content) as Product[];
        memoryProducts = parsed;
        return parsed;
    } catch (err) {
        console.error('Error reading/initializing products.json, using fallback:', err);
        if (!memoryProducts) {
            memoryProducts = [...INITIAL_PRODUCTS];
        }
        return memoryProducts;
    }
}

function persistProducts(products: Product[]): boolean {
    memoryProducts = products;
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Error persisting products to disk:', err);
        return false;
    }
}

export function getAllProducts(): Product[] {
    if (memoryProducts) return memoryProducts;
    return ensureDataFile();
}

export function getProductById(id: string): Product | null {
    const list = getAllProducts();
    return list.find((p) => p.id === id) || null;
}

export function createProduct(input: Partial<Product> & { name: string; price: string }): Product {
    const list = getAllProducts();

    // Auto-derive ID if not provided
    const baseSlug = (input.id || input.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    let uniqueId = baseSlug || 'new-drop';
    let counter = 1;
    while (list.some((p) => p.id === uniqueId)) {
        uniqueId = `${baseSlug}-${counter}`;
        counter++;
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
        id: uniqueId,
        name: input.name,
        price: input.price.startsWith('₹') ? input.price : `₹${input.price}`,
        originalPrice: input.originalPrice || '',
        badge: input.badge || { text: 'NEW', bg: '#274724' },
        src: input.src || '/angel.jpeg',
        category: input.category || 'tees',
        description: input.description || 'Exclusive heavyweight garment engineered for modern silhouette.',
        tags: input.tags || [{ text: 'NEW' }, { text: 'OVERSIZED' }],
        filters: input.filters || ['White', 'Black', 'Popular'],
        specs: {
            gsm: input.specs?.gsm || '240 GSM',
            fit: input.specs?.fit || 'Relaxed Drop-Shoulder',
            material: input.specs?.material || '100% Combed Cotton',
            wash: input.specs?.wash || 'Pre-shrunk silicone soft wash',
            print: input.specs?.print || 'Direct-to-garment high density',
            origin: input.specs?.origin || 'Engineered by BANNNED',
            details: input.specs?.details || 'Ribbed collar, custom inner label',
        },
        hyperlink: input.hyperlink || `/pages/demon/index.html?product=${uniqueId}`,
        stock: typeof input.stock === 'number' ? input.stock : 50,
        totalPieces: typeof input.totalPieces === 'number' ? input.totalPieces : 200,
        status: input.status || 'active',
        sku: input.sku || `BNND-DP-${Math.floor(100 + Math.random() * 900)}`,
        bonusPoints: typeof input.bonusPoints === 'number' ? input.bonusPoints : 0,
        colors: input.colors || [
            { name: 'Pitch Black', hex: '#111111', active: true },
            { name: 'Chalk White', hex: '#f0ebe3' },
        ],
        createdAt: now,
        updatedAt: now,
    };

    const updated = [newProduct, ...list];
    persistProducts(updated);
    return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
    const list = getAllProducts();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const updatedProduct: Product = {
        ...existing,
        ...updates,
        specs: {
            ...existing.specs,
            ...(updates.specs || {}),
        },
        badge: {
            ...existing.badge,
            ...(updates.badge || {}),
        },
        updatedAt: new Date().toISOString(),
    };

    list[index] = updatedProduct;
    persistProducts([...list]);
    return updatedProduct;
}

export function deleteProduct(id: string): boolean {
    const list = getAllProducts();
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length === list.length) return false;
    persistProducts(filtered);
    return true;
}

export function resetToSeedProducts(): Product[] {
    persistProducts(INITIAL_PRODUCTS);
    return [...INITIAL_PRODUCTS];
}

export function getAdminStats(): AdminStats {
    const list = getAllProducts();
    const activeProducts = list.filter((p) => p.status === 'active').length;
    const draftProducts = list.filter((p) => p.status === 'draft').length;
    const outOfStockProducts = list.filter((p) => p.status === 'out_of_stock' || p.stock <= 0).length;
    const lowStockProducts = list.filter((p) => p.stock > 0 && p.stock <= 25).length;
    
    let totalInventoryUnits = 0;
    let totalCatalogValue = 0;
    const categoryCounts: Record<string, number> = {};

    for (const p of list) {
        totalInventoryUnits += p.stock || 0;
        
        // Parse price e.g. "₹250.00" -> 250
        const numericPrice = parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || 0;
        totalCatalogValue += numericPrice * (p.stock || 0);

        const cat = p.category || 'other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    return {
        totalProducts: list.length,
        activeProducts,
        draftProducts,
        outOfStockProducts,
        lowStockProducts,
        totalInventoryUnits,
        totalCatalogValue,
        categoryCounts,
    };
}
