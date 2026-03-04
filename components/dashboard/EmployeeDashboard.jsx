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
