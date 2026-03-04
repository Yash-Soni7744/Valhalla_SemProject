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
