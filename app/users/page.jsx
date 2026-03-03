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
