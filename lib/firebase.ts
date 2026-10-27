import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database, ref, onValue, set, get, child } from "firebase/database";

export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD3STSPvUPxi_MKnYDtIGlsH00HAs_sJi8",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bannned.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bannned",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bannned.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "756818414955",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:756818414955:web:6cba7ae941f7fff8f3102e",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-QC8KN50VJS",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://bannned-default-rtdb.firebaseio.com",
};

// Initialize Firebase singleton
let app: FirebaseApp;
let database: Database | null = null;

try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    if (typeof window !== "undefined" || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
        database = getDatabase(app);
    }
} catch (error) {
    console.warn("[Firebase] Initialization notice:", error);
    app = (getApps().length > 0 ? getApp() : null) as any;
}

export { app, database };

/**
 * Subscribe to realtime order updates directly via Firebase SDK
 */
export function subscribeToOrders(callback: (orders: any[]) => void): () => void {
    if (!database) return () => {};

    try {
        const ordersRef = ref(database, 'orders');
        const unsubscribe = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                callback([]);
                return;
            }
            if (Array.isArray(data)) {
                callback(data.filter(Boolean));
            } else if (typeof data === 'object') {
                callback(Object.values(data));
            }
        }, (error) => {
            console.warn('[Firebase RTDB] onValue warning:', error.message);
        });

        return unsubscribe;
    } catch (err) {
        console.warn('[Firebase RTDB] Subscribe error:', err);
        return () => {};
    }
}

/**
 * Save or update an order in Firebase Realtime Database
 */
export async function pushOrderToFirebase(order: any): Promise<boolean> {
    if (!database) return false;
    try {
        const orderRef = ref(database, `orders/${order.id}`);
        await set(orderRef, order);
        return true;
    } catch (err) {
        console.warn('[Firebase RTDB] pushOrder error:', err);
        return false;
    }
}
