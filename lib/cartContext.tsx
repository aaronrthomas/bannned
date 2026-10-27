'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product } from './types';

export interface CartItem {
    id: string; // `${productId}-${size}`
    productId: string;
    name: string;
    price: string;
    unitPrice: number;
    src: string;
    sku: string;
    size: string;
    quantity: number;
    bonusPoints: number;
}

export interface CartContextType {
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
    totalBonusPoints: number;
    addToCart: (product: Product, size: string, quantity?: number) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    lastAddedItem: CartItem | null;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'bannned_shopping_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Initialize from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                }
            }
        } catch (e) {
            console.warn('[Cart] Failed to load local cart:', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // 2. Persist to localStorage on change
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.warn('[Cart] Failed to persist cart:', e);
        }
    }, [items, isLoaded]);

    const addToCart = useCallback((product: Product, size: string, quantity: number = 1) => {
        const unitPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 250;
        const itemId = `${product.id}-${size}`;
        const bonus = (product.bonusPoints || 50);

        setItems(prev => {
            const existingIdx = prev.findIndex(it => it.id === itemId);
            if (existingIdx > -1) {
                const updated = [...prev];
                const newQty = Math.min(10, updated[existingIdx].quantity + quantity);
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    quantity: newQty,
                };
                setLastAddedItem(updated[existingIdx]);
                return updated;
            } else {
                const newItem: CartItem = {
                    id: itemId,
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    unitPrice,
                    src: product.src,
                    sku: product.sku,
                    size,
                    quantity: Math.max(1, Math.min(10, quantity)),
                    bonusPoints: bonus,
                };
                setLastAddedItem(newItem);
                return [newItem, ...prev];
            }
        });

        // Automatically open the cart drawer to display the newly added item
        setIsCartOpen(true);
    }, []);

    const removeFromCart = useCallback((itemId: string) => {
        setItems(prev => prev.filter(it => it.id !== itemId));
    }, []);

    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        setItems(prev =>
            prev.map(it => (it.id === itemId ? { ...it, quantity: Math.min(10, quantity) } : it))
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setItems([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {}
    }, []);

    const openCart = useCallback(() => setIsCartOpen(true), []);
    const closeCart = useCallback(() => setIsCartOpen(false), []);
    const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);

    const totalItems = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    const totalAmount = items.reduce((sum, it) => sum + (it.unitPrice * (it.quantity || 1)), 0);
    const totalBonusPoints = items.reduce((sum, it) => sum + (it.bonusPoints * (it.quantity || 1)), 0);

    return (
        <CartContext.Provider
            value={{
                items,
                totalItems,
                totalAmount,
                totalBonusPoints,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                isCartOpen,
                openCart,
                closeCart,
                toggleCart,
                lastAddedItem,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
