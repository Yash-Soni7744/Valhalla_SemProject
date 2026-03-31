"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { getDashboardStats, getLeads, updateUser, createLeadWithLog, deleteLeadWithLog } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LeadStatusChart, LeadProductChart } from './LeadCharts';
import Link from 'next/link'; // Standard Link is usually better
import { Target, Trophy, XCircle, DollarSign, Camera, LogOut, Megaphone, User, Plus, Clock, Upload, Search, Edit, Trash2, Phone, Filter } from 'lucide-react';
import LeadForm from '../leads/LeadForm';
import FollowUpModal from '../leads/FollowUpModal';

import Papa from 'papaparse';

/**
 * EMPLOYEE DASHBOARD COMPONENT
 * 
 * This is the main screen for Employees (Sales Team).
 * It shows:
 * 1. Personal Profile (Picture & Password)
 * 2. Performance Stats (Leads assigned, Deals won)
 * 3. Interactive Charts (Lead Status & Product Interest)
 * 4. Lead Management Table (Filtering & Searching)
 */
export default function EmployeeDashboard() {
    const { user, logout } = useAuth(); // Auth context gives us user info and logout function
    const [isAddingLead, setIsAddingLead] = useState(false); // Controls the 'Add Lead' popup

    // --- PROFILE & PICTURE STATE ---
    const [profilePicture, setProfilePicture] = useState(user?.profile_picture || '');
    const fileInputRef = useRef(null); // Reference to the hidden file input
    const [uploading, setUploading] = useState(false);

    // --- DASHBOARD DATA STATE ---
    const [myLeads, setMyLeads] = useState([]); // List of leads assigned to this specific employee
    const [loading, setLoading] = useState(true); // Shows 'Loading...' while fetching data
    const [search, setSearch] = useState(''); // Text search for lead table
    const [statusFilter, setStatusFilter] = useState('All'); // Filter leads by status
    const [productFilter, setProductFilter] = useState('All'); // Filter leads by product
    const [selectedLead, setSelectedLead] = useState(null); // Which lead is being 'Followed up'
    const [editingLead, setEditingLead] = useState(null); // Which lead is being 'Edited'
    const leadsTableRef = useRef(null);

    // --- SECURITY STATE (Password Reset) ---
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [savingPass, setSavingPass] = useState(false);

    /**
     * BULK CSV IMPORT
     * Allows employees to upload a CSV file to add multiple leads at once.
     */
    const handleBulkImport = (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                let successCount = 0;
                for (const row of results.data) {
                    if (row.company_name && row.contact_person) {
                        try {
                            // Assign each imported lead to the current employee
                            await createLeadWithLog({
                                ...row,
                                assigned_to: user.id
                            }, user.id);
                            successCount++;
                        } catch (err) {
                            console.error(`Import error for ${row.company_name}`, err);
                        }
                    }
                }
                alert(`Successfully imported ${successCount} leads into your list.`);
                window.location.reload(); // Refresh to see new data
            },
            error: (error) => {
                alert('Invalid CSV file format.');
            }
        });
    };

    /**
     * DATA LOADING
     * Fetches all leads from the API and filters them to only show 
     * leads belonging to the logged-in employee.
     */
    useEffect(() => {
        async function loadMyData() {
            if (!user) return;
            try {
                const allLeads = await getLeads();
                // We only want leads where 'assigned_to' matches current user's ID
                const filtered = allLeads.filter(lead => lead.assigned_to === user.id);
                setMyLeads(filtered);
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        }
        loadMyData();
    }, [user]);

    if (!user) return null;

    // --- CALCULATE STATS ON THE FLY ---
    const totalAssigned = myLeads.length;
    const convertedLeads = myLeads.filter(l => l.status === 'Converted');
    const lostLeads = myLeads.filter(l => l.status === 'Lost');
    const totalRevenue = convertedLeads.reduce((acc, curr) => acc + (Number(curr.expected_price) || 0), 0);

    const statCards = [
        { title: 'Total Leads', value: totalAssigned, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Deals Won', value: convertedLeads.length, icon: Trophy, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Deals Lost', value: lostLeads.length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { title: 'My Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    /**
     * PROFILE PICTURE UPLOAD
     * Converts the selected image into a Base64 string and saves it to localStorage.
     */
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Only image files are allowed.');
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            setProfilePicture(base64String);
            try {
                await updateUser(user.id, { profile_picture: base64String });
                alert('Image updated successfully!');
            } catch (error) {
                alert('Failed to update picture.');
            }
            setUploading(false);
        };
        reader.readAsDataURL(file);
    };

    /**
     * PASSWORD CHANGE logic (Simulation)
     */
    const handleChangePassword = async (e) => {
        e.preventDefault();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const storedUser = users.find((u) => u.id === user.id);

        if (storedUser?.password !== currentPass) {
            alert('Your current password doesn\'t match.');
            return;
        }

        if (newPass.length < 5) {
            alert('Password must be at least 5 characters long for security.');
            return;
        }

        setSavingPass(true);
        try {
            await updateUser(user.id, { password: newPass });
            alert('Security password updated!');
            setCurrentPass('');
            setNewPass('');
        } catch (error) {
            alert('Operation failed.');
        } finally {
            setSavingPass(false);
        }
    };

    /**
     * DELETE LEAD
     * Asks for confirmation before deleting.
     */
    const handleDeleteLead = async (id) => {
        if (!window.confirm('Are you sure? This action cannot be undone.')) return;
        try {
            await deleteLeadWithLog(id, user.id);
            setMyLeads(myLeads.filter(l => l.id !== id));
        } catch (err) {
            alert('Error deleting lead');
        }
    };

    // --- APPLY TABLE FILTERS ---
    const filteredLeads = myLeads.filter(lead => {
        const matchesSearch = 
            lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
            lead.contact_person.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        const matchesProduct = productFilter === 'All' || lead.product_interest === productFilter;
        return matchesSearch && matchesStatus && matchesProduct;
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            
            {/* --- TOP BAR (Employee Profile) --- */}
            <header className="bg-slate-900 border-b border-slate-800 text-white shadow-lg">
                <div className="container mx-auto max-w-7xl px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-700 bg-slate-800 flex items-center justify-center shadow-xl">
                                {profilePicture ? (
                                    <img src={profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-slate-500" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                                title="Change Avatar"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>

                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight uppercase">Hi, {user.name}!</h1>
                                <span className="bg-primary/20 text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full border border-primary/40">
                                    ID: {user.employee_id}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm italic">{user.email} | <span className="font-bold text-primary">OFFICIAL {user.role?.toUpperCase()}</span></p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button 
                            onClick={() => setIsAddingLead(true)} 
                            className="bg-primary border-none text-white font-bold h-11 px-6 shadow-primary/30"
                        >
                            <Plus className="w-5 h-5 mr-1" /> CREATE LEAD
                        </Button>
                        <Link href="/activity-log">
                            <Button variant="outline" className="bg-slate-800 border-none text-slate-300 font-bold h-11 px-6">
                                <Clock className="w-5 h-5 mr-1" /> AUDIT LOG
                            </Button>
                        </Link>
                        <Button onClick={logout} variant="destructive" className="bg-red-900/40 text-red-500 h-11 px-6 border-none font-bold">
                            <LogOut className="w-5 h-5 mr-1" /> EXIT
                        </Button>
                    </div>
                </div>
            </header>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 container mx-auto max-w-7xl px-4 py-10 space-y-10">

                {/* --- NOTICE BOARD --- */}
                <Card className="bg-white border-none shadow-xl relative overflow-hidden ring-1 ring-slate-100">
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-slate-900 text-xl font-black uppercase">
                            <Megaphone className="w-6 h-6 text-primary" />
                            Important Notices
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Today's Meeting</p>
                                <p className="text-slate-700 text-sm font-medium">Monthly sales strategy review at <span className="font-bold underline">04:00 PM</span>. Be prepared with your reports.</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Incentive Alert</p>
                                <p className="text-slate-700 text-sm font-medium">20% extra bonus for every "Converted" lead this week! Go get 'em!</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- ANALYTICS CARDS --- */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat, i) => (
                        <Card key={i} className="border-none shadow-md hover:translate-y-[-4px] transition-all cursor-default">
                            <CardContent className="p-8 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{loading ? '...' : stat.value}</p>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-sm border`}>
                                    <stat.icon className="w-8 h-8" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* --- CHARTS SECTION --- */}
                <div className="grid gap-8 lg:grid-cols-2">
                    <Card className="border-none shadow-lg">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-600">Lead Status Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            {loading ? <div className="h-64 flex items-center justify-center italic text-slate-400">Loading...</div> : <LeadStatusChart leads={myLeads} />}
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-lg">
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-600">Leads by Product interest</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            {loading ? <div className="h-64 flex items-center justify-center italic text-slate-400">Loading...</div> : <LeadProductChart leads={myLeads} />}
                        </CardContent>
                    </Card>
                </div>

                {/* --- LEADS TABLE SECTION --- */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b pb-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">My Lead Database</h2>
                            <p className="text-slate-500 text-sm font-bold">Manage and update your personal sales pipeline</p>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search company or person..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-12 rounded-xl"
                                />
                            </div>
                            <select
                                className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold focus:ring-primary"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Converted">Converted</option>
                                <option value="Lost">Lost</option>
                            </select>
                        </div>
                    </div>

                    <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-[0.2em]">
                                    <tr>
                                        <th className="px-8 py-5">Company & Contact</th>
                                        <th className="px-8 py-5">Product Category</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5">Potential Value</th>
                                        <th className="px-8 py-5 text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center font-bold text-slate-300 italic uppercase">Syncing with server...</td></tr>
                                    ) : filteredLeads.length === 0 ? (
                                        <tr><td colSpan={5} className="px-8 py-20 text-center font-bold text-slate-300 italic uppercase">No matching leads found</td></tr>
                                    ) : (
                                        filteredLeads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-slate-900 text-base">{lead.company_name}</div>
                                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{lead.contact_person} • {lead.phone}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-600 border ring-1 ring-slate-200">
                                                        {lead.product_interest}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm
                                                        ${lead.status === 'New' ? 'bg-blue-600 text-white' :
                                                          lead.status === 'Converted' ? 'bg-green-600 text-white' :
                                                          lead.status === 'Lost' ? 'bg-red-600 text-white' :
                                                          'bg-amber-500 text-white'}`}>
                                                        {lead.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 font-mono font-bold text-slate-700 text-lg">
                                                    ${Number(lead.expected_price || 0).toLocaleString()}
                                                </td>
                                                 <td className="px-8 py-6 text-right space-x-2">
                                                     <Button 
                                                        variant="ghost" 
                                                        className="h-10 w-10 p-0 bg-slate-50 hover:bg-slate-200"
                                                        onClick={() => setEditingLead(lead)}
                                                     >
                                                         <Edit className="h-4 w-4 text-slate-600" />
                                                     </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        className="h-10 w-10 p-0 bg-blue-50 hover:bg-blue-600 hover:text-white"
                                                        onClick={() => setSelectedLead(lead)}
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        className="h-10 w-10 p-0 bg-red-50 hover:bg-red-600 hover:text-white"
                                                        onClick={() => handleDeleteLead(lead.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* --- ACCOUNT SECURITY SECTION --- */}
                <Card className="border-none shadow-lg bg-slate-900 text-white rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Security Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="grid md:grid-cols-3 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Password</label>
                                <Input 
                                    type="password" 
                                    value={currentPass} 
                                    onChange={(e) => setCurrentPass(e.target.value)} 
                                    className="bg-slate-800 border-none text-white h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">New Password</label>
                                <Input 
                                    type="password" 
                                    value={newPass} 
                                    onChange={(e) => setNewPass(e.target.value)} 
                                    className="bg-slate-800 border-none text-white h-12"
                                />
                            </div>
                            <Button type="submit" className="h-12 font-black uppercase bg-white text-slate-900 hover:bg-slate-200" isLoading={savingPass}>
                                Apply Changes
                            </Button>
                        </form>
                    </CardContent>
                </Card>

            </main>

             {/* --- MODALS --- */}
             {selectedLead && (
                 <FollowUpModal 
                     isOpen={!!selectedLead} 
                     onClose={() => setSelectedLead(null)} 
                     lead={selectedLead} 
                 />
             )}
 
             {(isAddingLead || editingLead) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border-none shadow-2xl animate-in zoom-in-95 duration-300">
                        <CardHeader className="flex flex-row items-center justify-between border-b p-8 bg-slate-50">
                            <div>
                                 <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">
                                     {editingLead ? `Update: ${editingLead.company_name}` : 'Quick Entry: New Lead'}
                                 </CardTitle>
                                 <p className="text-sm font-bold text-slate-500 uppercase">
                                     {editingLead ? 'Adjusting existing record' : 'Adding prospective client into database'}
                                 </p>
                             </div>
                             <div className="flex items-center gap-4">
                                 {!editingLead && (
                                     <Button variant="outline" className="h-12 px-6 font-black uppercase border-2 flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                                         <Upload className="w-5 h-5" /> CSV Upload
                                     </Button>
                                 )}
                                 <Button variant="ghost" onClick={() => { setIsAddingLead(false); setEditingLead(null); }}>
                                     <XCircle className="w-8 h-8 text-gray-400" />
                                 </Button>
                             </div>
                        </CardHeader>
                         <CardContent className="pt-8 overflow-y-auto p-8">
                             <LeadForm 
                                 initialData={editingLead}
                                 isEditing={!!editingLead}
                                 onSubmit={async (data) => {
                                     if (!user) return;
                                     if (editingLead) {
                                         // Update Mode
                                         const { updateLeadWithLog } = await import('../../services/api');
                                         await updateLeadWithLog(editingLead.id, data, user.id);
                                     } else {
                                         // Create Mode
                                         await createLeadWithLog({ ...data, assigned_to: user.id }, user.id);
                                     }
                                     setIsAddingLead(false);
                                     setEditingLead(null);
                                     window.location.reload();
                                 }} 
                             />
                         </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
