"use client";

import { useEffect, useState } from 'react';
import { getFollowUps, deleteFollowUp } from '../../services/api';
import { Calendar, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import DashboardLayout from '../../components/layout/DashboardLayout';


/**
 * FOLLOW-UPS PAGE
 * 
 * This page acts as a 'To-Do' list for the sales team.
 * It shows calls/meetings that were scheduled.
 * The tasks are automatically split into:
 * 1. OVERDUE: Dates in the past that were not completed.
 * 2. TODAY: Scheduled for the current date.
 * 3. UPCOMING: Dates in the future.
 */
export default function FollowUpsPage() {
    const [followUps, setFollowUps] = useState([]); 
    const [loading, setLoading] = useState(true);

    // Initial load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getFollowUps();
            setFollowUps(data || []);
        } catch (e) {
            console.error("Failed to load follow-ups:", e);
        } finally {
            setLoading(false);
        }
    };

    // Helper to remove a task
    const handleDelete = async (id) => {
        if (!confirm('Discard this follow-up?')) return;
        try {
            await deleteFollowUp(id);
            setFollowUps(prev => prev.filter(f => f.id !== id));
        } catch (e) {
            alert('Failed to delete');
        }
    };

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
