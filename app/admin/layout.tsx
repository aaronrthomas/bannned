import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
    title: 'BANNNED SaaS Admin — Products, Catalog & Inventory Management',
    description: 'Enterprise merchandise and drop management dashboard for BANNNED streetwear.',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="admin-body-lock">
            {children}
        </div>
    );
}
