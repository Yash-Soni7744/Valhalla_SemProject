"use client";

import { useEffect, useState, useRef } from 'react';
import { getUsers, createUser, deleteUser } from '../../services/api';
import { useAuth } from '../../components/providers/AuthProvider';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Trash2, ShieldAlert, BadgeCheck, CheckCircle2, XCircle, RefreshCw, Upload, Mail } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

import Papa from 'papaparse';
import emailjs from 'emailjs-com';

const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Replace these with actual Email JS credentials from the environment or dashboard
const EMAILJS_SERVICE = 'service_ysn0voi';
const EMAILJS_TEMPLATE = 'template_xjxlwjt';
const EMAILJS_PUBKEY = 'YcgjfyNQcPNIYDfdr';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // New User Form State
    const [newName, setNewName] = useState('');
    const [emailPrefix, setEmailPrefix] = useState('');
    const [password, setPassword] = useState(generatePassword());
    const [role, setRole] = useState('sales');
    const [creating, setCreating] = useState(false);

    // Bulk Import state
    const fileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fullEmail = emailPrefix ? `${emailPrefix}@miestilo.com`.toLowerCase() : '';
    const emailExists = users.some(u => u.email.toLowerCase() === fullEmail);
    const emailValid = emailPrefix.length > 0 && !emailExists;

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!emailValid) {
            alert("This email is already taken or invalid.");
            return;
        }

        setCreating(true);
        try {
            const newUserObj = {
                name: newName,
                email: fullEmail,
                password: password,
                role: role,
            };

            await createUser(newUserObj);

            // Attempt to send the email via EmailJS (Will route to vyash4846@gmail.com for testing)
            const templateParams = {
                to_email: 'vyash4846@gmail.com', // Override for testing as requested
                employee_name: newName,
                employee_email: fullEmail,
                employee_password: password,
            };

            try {
                const response = await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams, EMAILJS_PUBKEY);
                console.log('SUCCESS!', response.status, response.text);
                alert(`User created! Welcome email successfully sent to testing address.`);
            } catch (err) {
                console.warn('EmailJS failed (Likely missing credentials, but user was created in system):', err);
                alert(`User created! Note: Automated email failed (missing EmailJS credentials). The password is: ${password}`);
            }

            // Reset form
            setNewName('');
            setEmailPrefix('');
            setPassword(generatePassword());
            setRole('sales');
            loadUsers();
        } catch (e) {
            alert("Error creating user");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteUser(id);
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch (e) {
            alert("Error deleting user");
        }
    };

    const handleBulkImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                let successCount = 0;
                for (const row of results.data) {
                    if (row.name && row.email) {
                        const rowEmail = row.email.toLowerCase();
                        // Only add if not exists
                        if (!users.some(u => u.email.toLowerCase() === rowEmail)) {
                            const newPass = generatePassword();
                            const finalEmail = rowEmail.endsWith('@miestilo.com') ? rowEmail : `${rowEmail}@miestilo.com`;

                            await createUser({
                                name: row.name,
                                email: finalEmail,
                                password: row.password || newPass,
                                role: (row.role || 'sales').toLowerCase()
                            });

                            // Send automated email for this bulk user
                            try {
                                const templateParams = {
                                    to_email: 'vyash4846@gmail.com', // Override for testing
                                    employee_name: row.name,
                                    employee_email: finalEmail,
                                    employee_password: row.password || newPass,
                                };
                                await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams, EMAILJS_PUBKEY);
                                console.log(`Email sent for ${row.name}`);
                            } catch (err) {
                                console.warn(`Failed to send email for ${row.name}`, err);
                            }

                            successCount++;
                            // Wait 2 seconds between emails to prevent EmailJS from blocking us for spamming
                            await new Promise((resolve) => setTimeout(resolve, 2000));
                        }
                    }
                }
                alert(`Successfully imported ${successCount} new users.`);
                loadUsers();
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            error: (error) => {
                alert('Error parsing CSV file');
                console.error(error);
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        });
    };

    if (currentUser?.role !== 'admin') {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center p-20 text-center">
                    <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
                    <p className="text-gray-500 mt-2">
                        Only administrators can manage users.
                    </p>
                </div>
            </DashboardLayout>
        );
    }


    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
                        <p className="text-muted-foreground">Manage system access and onboard employees.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleBulkImport}
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            {importing ? 'Importing...' : 'Bulk Import CSV'}
                        </Button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Create User Form */}
                    <Card className="md:col-span-1 border-primary/20 shadow-sm h-fit">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Mail className="w-5 h-5 text-primary" />
                                Invite Employee
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2 relative">
                                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                                    <Input
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        required
                                        placeholder="e.g. John Doe"
                                        className="bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex justify-between items-center">
                                        <span>Company Email</span>
                                        {emailPrefix.length > 0 && (
                                            emailExists ? (
                                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Taken</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> Available</span>
                                            )
                                        )}
                                    </label>
                                    <div className="flex rounded-md shadow-sm">
                                        <input
                                            type="text"
                                            value={emailPrefix}
                                            onChange={e => setEmailPrefix(e.target.value.replace(/[^a-zA-Z0-9.-]/g, ''))}
                                            required
                                            placeholder="john.doe"
                                            className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border text-sm focus:ring-primary focus:border-primary ${emailPrefix && emailExists ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                        />
                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                            @miestilo.com
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                                        Temporary Password
                                        <button
                                            type="button"
                                            onClick={() => setPassword(generatePassword())}
                                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            Regenerate
                                        </button>
                                    </label>
                                    <Input
                                        type="text"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="font-mono bg-slate-50 text-slate-600"
                                    />
                                    <p className="text-xs text-slate-500">This password will be emailed to the new user.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Role</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                    >
                                        <option value="sales">Sales (Employee)</option>
                                        <option value="admin">Administrator</option>
