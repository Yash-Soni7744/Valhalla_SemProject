"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import LeadForm from '../../../components/leads/LeadForm';
import { getLead, updateLeadWithLog } from '../../../services/api';
import { useAuth } from '../../../components/providers/AuthProvider';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';


/**
 * EDIT LEAD PAGE
 * 
 * This page allows users to update an existing lead's Profile. 
 * How it works (Simplified):
 * 1. It grabs the 'ID' of the lead from the website URL (e.g. /leads/123).
 * 2. It searches the database for that ID.
 * 3. It shows a Form pre-filled with the current data.
 */
export default function EditLeadPage() {
    // A. SETUP: Get the ID and user info
    const params = useParams();
    const id = params.id; // Unique ID hidden in the URL
    const { user } = useAuth(); // Info about who is clicking 'Save'
    
    // B. STATE: Memory for the current lead
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * FETCHING THE LEAD:
     * This runs automatically when you open the edit page.
     */
    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            try {
                // Fetch the lead details using the ID from the URL
                const data = await getLead(id);
                setLead(data);
            } catch (e) {
                console.error("Error loading lead:", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    /**
     * SUBMIT HANDLER:
     * When the user finishes editing and clicks 'Confirm Changes'.
     */
    const handleSubmit = async (updatedData) => {
        if (!user) return;
        
        // updateLeadWithLog is a special function that:
        // 1. Saves the new data.
        // 2. Automatically writes a 'Log' entry saying: "User X edited this Lead".
        await updateLeadWithLog(id, updatedData, user.id);
    };

    // 1. IF LOADING: Show a nice spinning icon
    if (loading) return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <Loader2 className="animate-spin text-primary w-12 h-12" />
                <p className="text-gray-400 italic font-bold">Fetching lead profile from storage...</p>
            </div>
        </DashboardLayout>
    );

    // 2. IF NOT FOUND: Show an error message
    if (!lead) return (
        <DashboardLayout>
            <div className="p-12 text-center font-black text-red-500 bg-red-50 rounded-xl border-2 border-red-100 uppercase">
                ERROR: Lead not found in the database.
            </div>
        </DashboardLayout>
    );

    // 3. MAIN UI: Show the Edit Title and the Form
    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6 pt-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 border-b-4 border-primary/20 pb-2">Edit Lead Profile</h1>
                    <p className="text-muted-foreground font-bold mt-2 italic">
                        Updating record for: <span className="text-primary uppercase tracking-widest">{lead.company_name}</span>
                    </p>
                </div>
                
                {/* The Form Component: Pre-filled with 'lead' data */}
                <LeadForm initialData={lead} onSubmit={handleSubmit} isEditing />
            </div>
        </DashboardLayout>
    );
}


