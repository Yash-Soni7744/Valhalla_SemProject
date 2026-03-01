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

    /**
     * DELETE HANDLER
     * When you click the Red Trash icon, this runs.
     */
    const handleDelete = async (id) => {
        // Step 1: Ask for permission (Show a popup)
        if (!confirm('Are you sure you want to delete this lead?')) return;
        
        if (!user) return;
        
        try {
            // Step 2: Call the API to delete it from storage
            await deleteLeadWithLog(id, user.id);
            
            // Step 3: Remove it from our screen list immediately
            setLeads(leads.filter(l => l.id !== id));
        } catch (err) {
            alert('Failed to delete lead');
        }
    };

    /**
     * SEARCH & FILTER LOGIC
     * This part calculates which leads should be visible based on what you typed.
     */
    const filteredLeads = leads.filter(lead => {
        // Check if name or phone matches the search box
        const matchesSearch = lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
            lead.contact_person.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone.includes(search);
            
        // Check if the status matches the dropdown
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        
        // Check if the product matches the dropdown
        const matchesProduct = productFilter === 'All' || lead.product_interest === productFilter;

        // Only return 'true' if EVERYTHING matches
        return matchesSearch && matchesStatus && matchesProduct;
    });

    /**
     * THE UI (RENDER)
     * We wrap everything in <DashboardLayout> to get the Sidebar and Security!
     */
    return (
        <DashboardLayout>
            <div className="space-y-6">
                
                {/* A. PAGE TITLE & HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Leads Management</h1>
                        <p className="text-muted-foreground italic">Track every potential customer here.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/activity-log">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                View Full Activity Log
                            </Button>
                        </Link>
                        <Link href="/leads/new">
                            <Button className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Add New Lead
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* B. BULK ACTION BAR (Only appears when checkboxes are checked) */}
                {selectedLeadIds.size > 0 && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-blue-800 text-sm font-bold">
                            <CheckSquare className="w-5 h-5" />
                            {selectedLeadIds.size} Leads Selected
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className="text-xs text-blue-600 font-medium">Assign Selected To:</span>
                            <select
                                className="h-9 rounded-md border border-blue-200 bg-white px-3 py-1 text-sm focus:outline-none"
                                value={assignUser}
                                onChange={(e) => setAssignUser(e.target.value)}
                            >
                                <option value="">-- Choose Employee --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <Button
                                size="sm"
                                disabled={!assignUser}
                                onClick={async () => {
                                    if (!confirm(`Assign these ${selectedLeadIds.size} leads?`)) return;
                                    setLoading(true);
                                    try {
                                        await bulkAssignLeads(Array.from(selectedLeadIds), assignUser);
                                        await loadLeads(); // Refresh the list
                                        setSelectedLeadIds(new Set()); // Reset checkboxes
                                        setAssignUser('');
                                        alert('Leads assigned successfully!');
                                    } catch (e) {
                                        alert('Error assigning leads');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                Apply Changes
                            </Button>
                        </div>
                    </div>
                )}

                {/* C. SEARCH AND FILTERS SECTION */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Company Name or Phone Number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Status Dropdown */}
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none ring-offset-background"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="New">New Enquiry</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Follow-up">In Follow-up</option>
                            <option value="Negotiation">In Negotiation</option>
                            <option value="Converted">Converted (Customer)</option>
                            <option value="Lost">Lost Lead</option>
                        </select>
                        {/* Product Dropdown */}
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none ring-offset-background"
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                        >
                            <option value="All">All Products</option>
                            <option value="Undergarments">Undergarments</option>
                            <option value="Cushion Covers">Cushion Covers</option>
                            <option value="Blankets">Blankets</option>
                            <option value="Bedsheet">Bedsheet</option>
                            <option value="Curtains">Curtains</option>
                            <option value="Towels">Towels</option>
                            <option value="Bath Linen">Bath Linen</option>
                        </select>
                    </div>
                </div>

                {/* D. THE LEADS TABLE */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b font-black">
                                <tr>
                                    <th className="px-6 py-4 w-10 text-center">
                                        {/* Main Checkbox to select ALL visible leads */}
                                        <input
                                            type="checkbox"
                                            checked={filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
                                                else setSelectedLeadIds(new Set());
                                            }}
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-primary">Company & Contact</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4 text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">Please wait, loading leads...</td></tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">No leads match your current filters.</td></tr>
                                ) : (
                                    filteredLeads.map((lead) => (
                                        <tr key={lead.id} className={`hover:bg-gray-50 bg-white transition-colors ${selectedLeadIds.has(lead.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                {/* Checkbox for identifying a single row */}
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeadIds.has(lead.id)}
                                                    onChange={(e) => {
                                                        const newSet = new Set(selectedLeadIds);
                                                        if (e.target.checked) newSet.add(lead.id);
                                                        else newSet.delete(lead.id);
                                                        setSelectedLeadIds(newSet);
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{lead.company_name}</div>
                                                <div className="text-xs text-gray-500">{lead.contact_person} • {lead.phone}</div>
                                                {/* Tag showing who this lead belongs to */}
                                                {lead.assigned_to_name && (
                                                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-bold uppercase">
                                                        Assigned to: {lead.assigned_to_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-md bg-slate-100 border text-slate-700">
                                                    {lead.product_interest}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* Status Color Badge Logic */}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border
                                            ${lead.status === 'New' ? 'bg-blue-100 border-blue-200 text-blue-700' :
                                                        lead.status === 'Converted' ? 'bg-green-100 border-green-200 text-green-700' :
                                                            lead.status === 'Lost' ? 'bg-red-100 border-red-200 text-red-700' :
                                                                'bg-yellow-100 border-yellow-200 text-yellow-700'}`}>
                                                    {lead.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 italic">
                                                {lead.lead_source || 'Direct Entry'}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {/* BUTTON: Edit Lead */}
                                                <Link href={`/leads/${lead.id}`}>
