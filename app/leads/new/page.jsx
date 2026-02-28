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
