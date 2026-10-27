'use client';

import { useEffect } from 'react';

export default function VisitorTracker() {
    useEffect(() => {
        // Track visit only once per session
        try {
            const hasTracked = sessionStorage.getItem('bannned_visited');
            if (!hasTracked) {
                fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: window.location.pathname }),
                }).catch(() => {});
                sessionStorage.setItem('bannned_visited', 'true');
            }
        } catch {}
    }, []);

    return null;
}
