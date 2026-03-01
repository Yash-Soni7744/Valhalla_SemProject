"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLeads, deleteLeadWithLog, getUsers, bulkAssignLeads } from '../../services/api';
import { useAuth } from '../../components/providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, Trash2, Edit, Phone, CheckSquare, UserPlus, Clock } from 'lucide-react';
import FollowUpModal from '../../components/leads/FollowUpModal';
import DashboardLayout from '../../components/layout/DashboardLayout';


/**
 * LEADS MANAGEMENT PAGE
 * 
 * This is the "Heart" of the CRM. It shows a big table of every potential customer (Leads).
 * Admins use this to:
 * 1. See all new enquiries.
 * 2. Search for specific companies or phone numbers.
 * 3. Assign leads to different employees.
 * 4. Record follow-ups (calls/notes).
 */
export default function LeadsPage() {
    // 1. AUTHENTICATION: Get the current user (Admin or Employee)
    const { user } = useAuth(); 
    
    // 2. STATE (Memory for the page):
    // 'leads' holds the main list of people we are trying to sell to
    const [leads, setLeads] = useState([]); 
    
    // 'loading' is true while we wait for data to come from localStorage
    const [loading, setLoading] = useState(true); 
    
    // 'users' holds a list of all employees (so Admin can assign leads to them)
    const [users, setUsers] = useState([]); 
    
    // 3. SEARCH & FILTER STATE:
    // What the user typed in the search box
    const [search, setSearch] = useState(''); 
    
    // Which status they selected (e.g. "New" or "Follow-up")
    const [statusFilter, setStatusFilter] = useState('All'); 
    
    // Which product the lead is interested in
    const [productFilter, setProductFilter] = useState('All'); 
    
    // 4. SELECTION STATE:
    // If you click 'Call', this stores which lead you are talking to
    const [selectedLead, setSelectedLead] = useState(null); 
    
    // This 'Set' keeps track of which rows have their checkbox checked
    const [selectedLeadIds, setSelectedLeadIds] = useState(new Set()); 
    
    // Which employee ID is selected in the 'Assign to...' dropdown
    const [assignUser, setAssignUser] = useState(''); 

    /**
     * INITIAL LOAD (useEffect)
     * This runs once when the page first pops up on the screen.
     */
    useEffect(() => {
        loadLeads(); // Get the leads list
        loadUsers(); // Get the employee list
    }, []);

    // FETCHING FUNCTIONS:
    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (e) {
            console.error("Failed to load users", e);
        }
    };

    const loadLeads = async () => {
        setLoading(true); // Show the loading message
        try {
            const data = await getLeads();
            setLeads(data); // Save the leads into our memory
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false); // Hide the loading message
        }
    };
