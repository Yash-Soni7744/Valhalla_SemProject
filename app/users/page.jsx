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
