/**
 * AUTH UTILITY
 * 
 * This file handles saving the logged-in user's information so they stay logged in 
 * even if they refresh the page.
 */

const STORAGE_KEY = 'miestilo_user';

// Get the logged-in user from the browser's storage
export const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
};

// Save the user info to the browser's storage when they log in
export const setStoredUser = (user) => {
    if (typeof window === 'undefined') return;
    
    // We remove the password before saving for security
    const { password, ...safeUser } = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
};

// Remove the user info when they log out
export const clearStoredUser = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
};

// Check if anyone is currently logged in
export const isAuthenticated = () => {
    return !!getStoredUser();
};
