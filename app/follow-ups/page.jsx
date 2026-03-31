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

    // SPLIT DATA INTO CATEGORIES
    const todaysFollowUps = followUps.filter(f => f.follow_up_date?.startsWith(today));
    const upcomingFollowUps = followUps.filter(f => f.follow_up_date > today);
    const overdueFollowUps = followUps.filter(f => f.follow_up_date < today && f.status !== 'Completed');

    /**
     * Reusable component to show a single follow-up task
     */
    const FollowUpCard = ({ item, isOverdue = false }) => (
        <div className={`p-4 rounded-lg border bg-white shadow-sm flex justify-between items-start transition-all hover:shadow-md ${isOverdue ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
            <div className="space-y-1">
                <h4 className="font-bold text-gray-900">{item.leads?.company_name}</h4>
                <p className="text-xs text-gray-500 font-medium">Contact: {item.leads?.contact_person}</p>
                <div className="bg-slate-50 p-2 rounded mt-2 border border-slate-100 italic text-sm text-gray-700">
                    "{item.notes}"
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    Due: {new Date(item.follow_up_date).toLocaleDateString()}
                </div>
            </div>
            <div className="flex flex-col items-end gap-3">
                <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter border
                ${item.status === 'Completed' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-yellow-100 border-yellow-200 text-yellow-700'}`}>
                    {item.status}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-300 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(item.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Follow-up Schedule</h1>
                    <p className="text-muted-foreground italic">List of calls and meetings you need to attend to.</p>
                </div>

                {loading ? <p className="text-gray-400 italic">Checking your schedule...</p> : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

                        {/* OVERDUE SECTION */}
                        <section className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-red-600 bg-red-50 w-fit px-3 py-1 rounded-full text-sm border border-red-100">
                                <Clock className="w-4 h-4" /> Overdue Tasks
                            </h3>
                            <div className="space-y-3">
                                {overdueFollowUps.length === 0 && <p className="text-xs text-gray-400 italic ml-2">Clean slate! No overdue tasks.</p>}
                                {overdueFollowUps.map(f => <FollowUpCard key={f.id} item={f} isOverdue />)}
                            </div>
                        </section>

                        {/* TODAY SECTION */}
                        <section className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded-full text-sm border border-blue-100">
                                <CheckCircle2 className="w-4 h-4" /> Today's Focus
                            </h3>
                            <div className="space-y-3">
                                {todaysFollowUps.length === 0 && <p className="text-xs text-gray-400 italic ml-2">Nothing scheduled for today yet.</p>}
                                {todaysFollowUps.map(f => <FollowUpCard key={f.id} item={f} />)}
                            </div>
                        </section>

                        {/* UPCOMING SECTION */}
                        <section className="space-y-4">
                            <h3 className="flex items-center gap-2 font-bold text-gray-600 bg-gray-50 w-fit px-3 py-1 rounded-full text-sm border border-gray-200">
                                <Calendar className="w-4 h-4" /> Upcoming Future
                            </h3>
                            <div className="space-y-3">
                                {upcomingFollowUps.length === 0 && <p className="text-xs text-gray-400 italic ml-2">No future tasks set.</p>}
                                {upcomingFollowUps.map(f => <FollowUpCard key={f.id} item={f} />)}
                            </div>
                        </section>

                    </div>
                )}
            </div>
        </DashboardLayout>
    );

}
