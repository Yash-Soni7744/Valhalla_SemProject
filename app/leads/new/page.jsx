"use client";

import LeadForm from '../../../components/leads/LeadForm';
import { createLeadWithLog } from '../../../services/api';
import { useAuth } from '../../../components/providers/AuthProvider';
import DashboardLayout from '../../../components/layout/DashboardLayout';


/**
 * ADD NEW LEAD PAGE
 * 
 * This is the page where employees enter a new sales enquiry.
 */
export default function NewLeadPage() {
    const { user } = useAuth();
    
    /**
     * SUBMIT HANDLER:
     * This function runs when the user clicks 'Save Lead' at the bottom of the form.
     */
    const handleSubmit = async (data) => {
        try {
            // Use withLog version to record this action in Activity Log
            await createLeadWithLog(data, user?.id);
            
            // Note: We don't need a redirect here because the LeadForm component
            // handles moving the user back to the list page after success!
        } catch (e) {
            console.error("Save failed:", e);
            alert("Could not save lead. Please try again.");
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6 pt-6">
                
                {/* A. PAGE HEADER */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 border-b-4 border-primary/20 pb-2 uppercase italic">Register New Sale Lead</h1>
                    <p className="text-muted-foreground font-bold mt-2">Enter the prospect's company details and requirement specs below.</p>
                </div>

                {/* B. THE FORM COMPONENT */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                     <LeadForm onSubmit={handleSubmit} />
                </div>
                
            </div>
        </DashboardLayout>
    );
}


