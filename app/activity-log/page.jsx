"use client";

import { useEffect, useState } from 'react';
import { getActivities, updateActivity } from '../../services/api';
import { useAuth } from '../../components/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Edit2, Check, X, Clock, User as UserIcon, Building2, Phone } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';


/**
 * ACTIVITY LOG PAGE
 * 
 * This page is like a "Black Box" or "Security Camera" for the CRM.
 * It automatically records every important action taken by employees, such as:
 * - When a new lead is created.
 * - When a lead's status is changed (e.g. from New to Converted).
 * - When a lead is deleted.
 * 
 * This helps the owner (Admin) keep track of who is doing what and when.
 */
export default function ActivityLogPage() {
    // 1. AUTHENTICATION: Get current user info
    const { user: currentUser } = useAuth(); 
    
    // 2. STATE (Page Memory):
    // 'activities' holds the full list of logged events from the database
    const [activities, setActivities] = useState([]);
    
    // 'loading' is TRUE while we fetch data from storage
    const [loading, setLoading] = useState(true);
    
    // 'search' stores whatever text you type in the search bar
    const [search, setSearch] = useState('');
    
    // 3. EDITING STATE (Admin Only):
    // 'editingId' stores which row is currently being edited
    const [editingId, setEditingId] = useState(null);
    
    // 'editNotes' stores the temporary text you type while editing a log
    const [editNotes, setEditNotes] = useState('');
    
    // 'viewingNotes' stores the log object for the full-screen popup
    const [viewingNotes, setViewingNotes] = useState(null);

    /**
     * INITIAL LOAD:
     * Fetch the logs as soon as the page opens.
     */
    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const data = await getActivities();
            setActivities(data); // Save results to our memory
        } catch (e) {
            console.error("Error loading logs:", e);
        } finally {
            setLoading(false);
        }
    };

    /**
     * SAVE EDITED NOTES (Admin Only)
     * This function saves the new note back to the database.
     */
    const handleSaveEdit = async (id) => {
        try {
            await updateActivity(id, { notes: editNotes });
            setEditingId(null); // Close the edit box
            loadActivities(); // Refresh the list to show the new note
        } catch (e) {
            alert("Failed to update note");
        }
    };

    /**
     * SEARCH FILTER LOGIC
     * We filter the list so it only shows rows that match the search text.
     */
    const filteredActivities = activities.filter(a =>
        a.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        a.employee_id.toLowerCase().includes(search.toLowerCase()) ||
        a.company_name.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase())
    );

    /**
     * THE UI (RENDER)
     * Wrapped in <DashboardLayout> for Sidebar and Security.
     */
    return (
        <DashboardLayout>
            <div className="space-y-6 pt-4">
                
                {/* A. PAGE HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Activity Log</h1>
                        <p className="text-muted-foreground italic font-medium">Automatic history of every action performed in the system.</p>
                    </div>
                </div>

                {/* B. SEARCH INPUT */}
                <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Type to search by Employee Name, Company, or Action..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 placeholder:italic"
