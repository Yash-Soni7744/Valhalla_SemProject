"use client";

import { useAuth } from '@/components/providers/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (user && user.role !== 'admin' && pathname !== '/') {
            // Employees should only access the main dashboard
            router.push('/');
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null; // Will redirect

    return (
        <div className="flex h-screen bg-gray-50">
            {user.role === 'admin' && <Sidebar />}
            <main className="flex-1 overflow-auto bg-gray-50/50">
                <div className={user.role === 'admin' ? "container mx-auto max-w-7xl p-6 lg:p-8" : "w-full"}>
                    {children}
                </div>
            </main>
        </div>
    );
}
