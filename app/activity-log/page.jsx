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
                        />
                    </div>
                </div>

                {/* C. MAIN LOG TABLE */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/50 border-b text-[10px] uppercase text-gray-500 font-black tracking-widest font-mono">
                                <tr>
                                    <th className="px-6 py-4">Action Type / Time</th>
                                    <th className="px-6 py-4">Performed By</th>
                                    <th className="px-6 py-4">Related Lead</th>
                                    <th className="px-6 py-4">Details / Notes</th>
                                    {currentUser?.role === 'admin' && <th className="px-6 py-4 text-right">Edit</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Searching history log...</td></tr>
                                ) : filteredActivities.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No activity found yet.</td></tr>
                                ) : (
                                    filteredActivities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors">
                                            
                                            {/* Column 1: What happened and When */}
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 flex items-center gap-2 not-italic">
                                                    <div className={`p-1 rounded bg-slate-100 border`}>
                                                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                                                    </div>
                                                    {activity.type}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-1 font-mono uppercase font-bold">
                                                    {activity.date} @ {activity.timestamp}
                                                </div>
                                            </td>

                                            {/* Column 2: Who did it */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-black not-italic border border-blue-200">
                                                        {activity.employee_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 flex items-center gap-1.5 not-italic">
                                                            {activity.employee_name}
                                                            {activity.is_owner && (
                                                                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-green-200">Owner</span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase font-bold">Emp ID: {activity.employee_id}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 3: Which lead was affected */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-gray-900 font-bold not-italic">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                    {activity.company_name}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5 font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <UserIcon className="w-3 h-3 text-gray-300" />
                                                        {activity.contact_person}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3 text-gray-300" />
                                                        {activity.contact_no}
                                                    </span>
                                                </div>
                                                <div className="mt-2 inline-flex items-center bg-blue-50 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase border border-blue-100 italic">
                                                    Source: {activity.lead_source || 'Direct'}
                                                </div>
                                            </td>

                                            {/* Column 4: Notes and specific details */}
                                            <td className="px-6 py-4">
                                                {/* EDIT MODE: Only if you clicked the edit icon */}
                                                {editingId === activity.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            value={editNotes}
                                                            onChange={(e) => setEditNotes(e.target.value)}
                                                            className="h-8 text-xs min-w-[200px] border-primary"
                                                            autoFocus
                                                        />
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600" onClick={() => handleSaveEdit(activity.id)}>
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => setEditingId(null)}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    /* DISPLAY MODE: Click the text to see full details */
                                                    <div
                                                        className="text-gray-600 text-xs max-w-[250px] cursor-pointer hover:text-primary group transition-all"
                                                        onClick={() => setViewingNotes(activity)}
                                                    >
                                                        <div className="truncate font-medium group-hover:underline">
                                                            {activity.notes || `No extra notes for this ${activity.type.toLowerCase()} event.`}
                                                        </div>
                                                        <span className="text-[9px] text-gray-300 uppercase font-black tracking-widest">(Click to read more)</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Column 5: Edit button (Visible only to Admins) */}
                                            {currentUser?.role === 'admin' && (
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                                        onClick={() => {
