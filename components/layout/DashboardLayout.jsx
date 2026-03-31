"use client";

import { useAuth } from '../providers/AuthProvider';
import Sidebar from './Sidebar';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * DASHBOARD LAYOUT COMPONENT
 * 
 * This is a "Wrapper" component. We use it to wrap our pages so they all have:
 * 1. Simple Security: It checks if a user is logged in. If not, it kicks them to the login page.
 * 2. Sidebar Menu: It shows the navigation menu on the left side of the screen.
 * 3. Consistent Look: It makes sure every page has the same background and spacing.
 * 
 * Think of this as the "Frame" of our dashboard window.
 */
export default function DashboardLayout({ children }) {
    // We get 'user' and 'loading' from our AuthProvider (Context)
    // 'user' tells us who is logged in. 'loading' tells us if we are still checking their credentials.
    const { user, loading } = useAuth();
    
    // useRouter helps us move the user to different pages (like redirecting to /login)
    const router = useRouter();
    
    // usePathname tells us which URL the user is currently looking at (e.g. /leads or /customers)
    const pathname = usePathname();

    /**
     * SECURITY CHECK (useEffect)
     * This function runs every time the page loads or the user changes.
     */
    useEffect(() => {
        // STEP 1: If the system finished loading and NO user is found, 
        // it means they aren't logged in. We send them to the Login page.
        if (!loading && !user) {
            router.push('/login');
        } 
        
        // STEP 2: Role-based Security
        // If the user is an 'employee' (not admin), they should only see their own dashboard or activity log.
        // If they try to go to pages like 'leads' or 'users', we send them back to the home page.
        else if (user && user.role !== 'admin' && pathname !== '/' && pathname !== '/activity-log') {
            router.push('/');
        }
    }, [user, loading, router, pathname]);

    /**
     * LOADING SCREEN
     * While the website is still checking if you are logged in, we show a spinning circles.
     * This prevents the "flash" of seeing the dashboard before the security check is done.
     */
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                {/* Loader2 is a simple icon from the 'lucide-react' library */}
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="ml-2 text-gray-500">Securing your session...</p>
            </div>
        );
    }

    /**
     * NO USER CASE
     * If there's no user, we return null (nothing) because the security check above 
     * is already redirecting them to the Login page.
     */
    if (!user) return null;

    // THE ACTUAL LAYOUT
    return (
        <div className="flex h-screen bg-gray-50">
            {/* 1. SIDEBAR: Only show the menu to Admin users. 
                Regular employees don't need the full menu. */}
            {user.role === 'admin' && <Sidebar />}
            
            {/* 2. MAIN CONTENT AREA: This is where the actual page content goes. */}
            <main className="flex-1 overflow-auto bg-gray-50/50">
                {/* We use a container to keep our content centered and pretty */}
                <div className={user.role === 'admin' ? "container mx-auto max-w-7xl p-6 lg:p-8" : "w-full"}>
                    {/* 'children' is a special React word for "put the page content right here" */}
                    {children}
                </div>
            </main>
        </div>
    );
}
