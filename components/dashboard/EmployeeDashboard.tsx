"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getDashboardStats, getLeads, updateUser } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lead } from '@/types';
import { LeadStatusChart, LeadProductChart } from '@/components/dashboard/LeadCharts';
import { Target, Trophy, XCircle, DollarSign, Camera, LogOut, Megaphone, User } from 'lucide-react';

export default function EmployeeDashboard() {
    const { user, logout } = useAuth();

    // Auth & Profile Data
    const [profilePicture, setProfilePicture] = useState(user?.profile_picture || '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Dashboard Data
    const [myLeads, setMyLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    // Security Form
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [savingPass, setSavingPass] = useState(false);

    useEffect(() => {
        async function loadMyData() {
            if (!user) return;
            try {
                // Fetch all leads and filter to simply those assigned to this user
                const allLeads = await getLeads();
                const filteredLeads = allLeads.filter(lead => lead.assigned_to === user.id);
                setMyLeads(filteredLeads);
            } catch (error) {
                console.error("Failed to load employee dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        loadMyData();
    }, [user]);

    if (!user) return null;

    // Derived Stats
    const totalAssigned = myLeads.length;
    const convertedLeads = myLeads.filter(l => l.status === 'Converted');
    const lostLeads = myLeads.filter(l => l.status === 'Lost');
    const totalRevenue = convertedLeads.reduce((acc, curr) => acc + (Number(curr.expected_price) || 0), 0);

    const statCards = [
        { title: 'My Leads', value: totalAssigned, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Deals Won', value: convertedLeads.length, icon: Trophy, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Deals Lost', value: lostLeads.length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        { title: 'My Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setProfilePicture(base64String);
            try {
                // Persist the change
                await updateUser(user.id, { profile_picture: base64String });
                alert('Profile picture updated!');
            } catch (error) {
                alert('Failed to update picture.');
            }
            setUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        // Since it's a mock, we retrieve users to verify current pass
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const storedUser = users.find((u: any) => u.id === user.id);

        if (storedUser?.password !== currentPass) {
            alert('Current password is incorrect.');
            return;
        }

        if (newPass.length < 6) {
            alert('New password must be at least 6 characters.');
            return;
        }

        setSavingPass(true);
        try {
            await updateUser(user.id, { password: newPass });
            alert('Password updated successfully!');
            setCurrentPass('');
            setNewPass('');
        } catch (error) {
            alert('Failed to update password.');
        } finally {
            setSavingPass(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header Area */}
            <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md">
                <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        {/* Profile Image Component */}
                        <div className="relative group">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center shadow-inner">
                                {profilePicture ? (
                                    <img src={profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-slate-400" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
                                title="Update Profile Picture"
                            >
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>

                        {/* Welcome Text */}
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h1>
                            <p className="text-slate-400 text-sm">{user.email} • <span className="uppercase text-xs tracking-wider font-semibold text-primary">{user.role}</span></p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={logout}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-none shadow-none font-medium gap-2 hidden sm:flex"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                        className="text-slate-400 hover:text-red-400 hover:bg-transparent sm:hidden p-2"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Notice Board */}
                <Card className="bg-indigo-50/50 border-indigo-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg">
                            <Megaphone className="w-5 h-5 text-indigo-600" />
                            Notice Board
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-sm">
                                <span className="font-semibold text-indigo-700 whitespace-nowrap">Today:</span>
                                <span className="text-slate-700">Team meeting at 3 PM in the main conference room regarding the new product line.</span>
                            </li>
                            <li className="flex gap-3 text-sm">
                                <span className="font-semibold text-indigo-700 whitespace-nowrap">Yesterday:</span>
                                <span className="text-slate-700">Updated sales targets for this quarter have been emailed. Please review them carefully.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Account Security (Password Reset) */}
                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Account Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4 sm:max-w-md">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Current Password</label>
                                <Input
                                    type="password"
                                    value={currentPass}
                                    onChange={(e) => setCurrentPass(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">New Password</label>
                                <Input
                                    type="password"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" isLoading={savingPass} disabled={savingPass}>
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Performance Stats */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 px-1">My Performance</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((stat, i) => (
                            <Card key={i} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                        <p className="text-2xl font-bold text-slate-900">{loading ? '-' : stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm border-slate-200/60">
                        <CardHeader>
                            <CardTitle className="text-lg">My Leads by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">Loading chart...</div>
                            ) : myLeads.length === 0 ? (
                                <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">No leads assigned yet.</div>
                            ) : (
                                <LeadStatusChart leads={myLeads} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200/60">
                        <CardHeader>
                            <CardTitle className="text-lg">My Leads by Product Interest</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">Loading chart...</div>
                            ) : myLeads.length === 0 ? (
                                <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">No leads assigned yet.</div>
                            ) : (
                                <LeadProductChart leads={myLeads} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
