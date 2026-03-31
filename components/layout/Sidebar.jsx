"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { cn } from '../../utils/cn';

import {
    LayoutDashboard,
    Users,
    Phone,   // For Follow-ups
    NotebookPen, // For Leads
    ShoppingBag, // For Customers
    Settings,
    User,
    LogOut,
    ShieldAlert // For Admin Users
} from 'lucide-react';

/**
 * SIDEBAR COMPONENT
 * 
 * This is the vertical menu on the left side of the screen.
 * It helps users navigate between different parts of the CRM.
 */
export default function Sidebar() {
    const pathname = usePathname(); // Tells us which page we are currently on
    const { user, logout } = useAuth(); // Get user info and logout function from our AuthProvider

    // List of menu items
    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Leads', href: '/leads', icon: NotebookPen },
        { name: 'Follow-ups', href: '/follow-ups', icon: Phone },
        { name: 'Customers', href: '/customers', icon: ShoppingBag },
    ];

    // If the user is an Admin, show the 'Users' menu item too
    if (user?.role === 'admin') {
        navigation.push({ name: 'Users', href: '/users', icon: ShieldAlert });
    }

    return (
        <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
            {/* Project Logo */}
            <div className="flex items-center h-16 px-6 border-b border-slate-800">
                <span className="text-xl font-bold text-white tracking-widest">MIESTILO</span>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3">
                {navigation.map((item) => {
                    // Check if this link is the 'active' one (the page the user is looking at)
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white" // Highlight if active
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Settings and Logout at the bottom */}
            <div className="p-3 border-t border-slate-800 space-y-1">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50",
                        pathname === '/settings' && "bg-slate-800 text-white"
                    )}
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors text-left"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>

            {/* User Profile Info at the very bottom */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase overflow-hidden ring-2 ring-primary/20">
                        {user?.profile_picture ? (
                            <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span>{user?.name?.slice(0, 2) || 'US'}</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{user?.name}</span>
                        <span className="text-xs text-slate-500 capitalize">{user?.role}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
