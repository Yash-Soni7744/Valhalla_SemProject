"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, setStoredUser, clearStoredUser } from '../../utils/auth';
import { loginUserMock, loginEmployeeMock } from '../../services/api';

import { useRouter } from 'next/navigation';

/**
 * THE AUTH CONTEXT (The App's Memory)
 * 
 * Think of Context as a 'Global Variable'.
 * Normally, in React, you pass data from Parent to Child.
 * But because "Who is logged in?" is needed by EVERY page, 
 * we use Context so any page can just "ask" for the user info.
 */
const AuthContext = createContext({
    user: null, // Initial value: no one is logged in
    loading: true, // App starts by "checking" for a session
    login: async () => ({}),
    loginEmployee: async () => ({}),
    logout: () => { },
});

// useAuth is a 'shortcut' (Hook) for other components to use this context
export const useAuth = () => useContext(AuthContext);

/**
 * THE AUTH PROVIDER (The Guard)
 * 
 * This component wraps your whole website. It's like a security guard
 * sitting at the front gate (root of the app).
 */
export default function AuthProvider({ children }) {
    // 1. STATE: These variables live as long as the website is open
    const [user, setUser] = useState(null); // The current user (Admin or Employee)
    const [loading, setLoading] = useState(true); // Are we still loading from memory?
    const router = useRouter(); // The tool we use to redirect users (e.g. to /login)

    /**
     * AUTO-LOGIN LOGIC:
     * This runs exactly ONCE the first time you open the site.
     * It checks 'localStorage' (the browser's permanent memory) to see 
     * if you were logged in yesterday.
     */
    useEffect(() => {
        const stored = getStoredUser(); // Read from browser memory
        if (stored) {
            setUser(stored); // "Oh, I remember you! Logging you back in."
        }
        setLoading(false); // Stop showing the loading screen
    }, []);

    /**
     * ADMIN LOGIN FUNCTION:
     * Called when you submit the login form on the login page.
     */
    const login = async (email, pass) => {
        try {
            // Check credentials against our "Fake Database" (api.js)
            const { data, error } = await loginUserMock(email, pass);

            if (error || !data) {
                return { error: 'Invalid admin credentials.' };
            }

            // SUCCESS! Save the user in two places:
            setUser(data); // 1. In React State (for the current session)
            setStoredUser(data); // 2. In LocalStorage (so login persists if you refresh)

            // Everything is good, send them to the Dashboard
            router.push('/');
            return {};
        } catch (err) {
            return { error: 'Connection failed. Check your internet.' };
        }
    };

    /**
     * EMPLOYEE LOGIN FUNCTION:
     * Similar to Admin login, but allows staff members to enter.
     */
    const loginEmployee = async (email, pass) => {
        try {
            const { data, error } = await loginEmployeeMock(email, pass);

            if (error || !data) {
                return { error: error || 'Failed to login as employee.' };
            }

            setUser(data);
            setStoredUser(data);

            // Redirect to dashboard
            router.push('/');
            return {};
        } catch (err) {
            return { error: 'Employee login system error.' };
        }
    };

    /**
     * LOGOUT FUNCTION:
     * Clears all memory and kicks the user back to the login screen.
     */
    const logout = () => {
        setUser(null); // Forget the user in React State
        clearStoredUser(); // Wipe the browser's data for this site
        router.push('/login'); // Send them back to the start!
    };

    /**
     * WRAPPER:
     * We wrap all the 'children' (the rest of the app) in this Provider.
     * This makes 'user' and 'logout' available to every single page.
     */
    return (
        <AuthContext.Provider value={{ user, loading, login, loginEmployee, logout }}>
            {children}
        </AuthContext.Provider>
    );
}


