"use client";

import { useEffect, useState } from 'react';
import { getDashboardStats, getLeads } from '../services/api';
import { useAuth } from '../components/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, UserPlus, Phone, ShoppingBag, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { LeadStatusChart, LeadProductChart } from '../components/dashboard/LeadCharts';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import DashboardLayout from '../components/layout/DashboardLayout';


/**
 * MAIN DASHBOARD PAGE (HOME PAGE)
 * 
 * This is the FIRST screen you see after logging in.
 * - If Admin: It shows charts (Data Analysis), stats, and recent leads.
 * - If Employee: It shows the 'EmployeeDashboard' instead.
 * 
 * The purpose of this page is to give a "Bird's Eye View" of the business.
 */
export default function DashboardPage() {
    // 1. GET USER INFO
    const { user } = useAuth(); // This hook tells us if who is logged in (Name, Role, etc.)

    // 2. STATE (Memory for this page)
    // We use 'useState' to store numbers and lists that we fetch from the database.
    const [stats, setStats] = useState({
        totalLeads: 0,
        newLeads: 0,
        convertedCustomers: 0,
        followUpsToday: 0
    });
    
    // RecentLeads holds a list of the 5 most recent people we added to the system
    const [recentLeads, setRecentLeads] = useState([]); 
    
    // AllLeads holds everything (used to draw the charts)
    const [allLeads, setAllLeads] = useState([]); 
    
    // Loading state is TRUE while the page is "thinking" or waiting for the database
    const [loading, setLoading] = useState(true);

    /**
     * FETCHING DATA FROM THE DATABASE
     * We use 'useEffect' to say: "Run this code as soon as the page loads"
     */
    useEffect(() => {
        // If the user is an employee (not an admin), we skip the admin stats and show their specific view
        if (user?.role !== 'admin') {
            setLoading(false);
            return;
        }

        /**
         * The 'loadData' function is like going to a library to get books.
         * We have to wait (await) for each piece of info.
         */
        async function loadData() {
            try {
                // FETCH 1: Get the stats numbers (Total Leads, etc.)
                const statsData = await getDashboardStats();
                setStats(statsData); // Save the numbers into our 'stats' variable

                // FETCH 2: Get all leads for the list and charts
                const leadsData = await getLeads();
                setAllLeads(leadsData); // Save all leads
                
                // We only want the most recent 5 to show on the main dashboard
                setRecentLeads(leadsData.slice(0, 5)); 
            } catch (error) {
                // If something goes wrong, we print an error in the console
                console.error("Failed to load dashboard data", error);
            } finally {
                // No matter if it worked or failed, we are done loading
                setLoading(false);
            }
        }
        
        loadData(); // Actually run the function we just defined
    }, [user]); // Re-run if the user changes (e.g. they log out)

    // SAFETY CHECK: If the user information isn't ready, just show an empty screen
    if (!user) return null;

    // IF USER IS NOT ADMIN: 
    // We don't show the graphs and stats. We show the simplified 'EmployeeDashboard'.
    if (user.role !== 'admin') {
        return (
            <DashboardLayout>
                <EmployeeDashboard />
            </DashboardLayout>
        );
    }

    /**
     * PREPARING DATA FOR THE UI (USER INTERFACE)
     * We create a list (Array) of objects to make it easier to display the 4 stat cards.
     */
    const statCards = [
        { title: 'Total Leads', value: stats.totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Follow-ups Today', value: stats.followUpsToday, icon: Phone, color: 'text-orange-600', bg: 'bg-orange-50' },
        { title: 'Converted Customers', value: stats.convertedCustomers, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    /**
     * THE RETURN STATEMENT
     * This is the HTML-like code that draws the page.
     * We wrap everything in <DashboardLayout> to get the Sidebar and Security automatically!
     */
    return (
        <DashboardLayout>
            <div className="space-y-8">
                
                {/* 1. WELCOME SECTION */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Hello {user.name}, here is a quick summary of your business performance.</p>
                </div>

                {/* 2. STAT CARDS (GRID VIEW) */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full ${stat.bg}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Loading logic: If waiting, show '-', otherwise show the number */}
                                <div className="text-2xl font-bold">{loading ? '-' : stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* 3. CHARTS SECTION (DATA ANALYSIS) */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* LEFT CHART: Lead Status (What stage they are at) */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-3">
                        {loading ? (
                            <div className="h-[380px] bg-white rounded-xl border flex items-center justify-center text-sm text-gray-500 italic">
                                Loading Status Chart...
                            </div>
                        ) : (
                            <LeadStatusChart leads={allLeads} />
                        )}
                    </div>
                    
                    {/* RIGHT CHART: Product Interest (What they want to buy) */}
                    <div className="col-span-1 md:col-span-4 lg:col-span-4">
                        {loading ? (
                            <div className="h-[380px] bg-white rounded-xl border flex items-center justify-center text-sm text-gray-500 italic">
                                Loading Product Analysis Chart...
                            </div>
                        ) : (
                            <LeadProductChart leads={allLeads} />
                        )}
                    </div>
                </div>

                {/* 4. RECENT LEADS & LINKS */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    
                    {/* RECENT LEADS (Quick Table) */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Recently Added Leads</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <p className="italic text-gray-400">Loading recent history...</p> : (
                                <div className="space-y-4">
                                    {recentLeads.map(lead => (
                                        <div key={lead.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{lead.company_name}</p>
                                                <p className="text-xs text-gray-500">{lead.contact_person} • {lead.product_interest}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Status Color Badge */}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                    ${lead.status === 'New' ? 'bg-green-100 text-green-800' :
                                                      lead.status === 'Converted' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {lead.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {recentLeads.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No leads found in the system yet.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* QUICK NAVIGATION (Buttons to other pages) */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Jump To Page</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {/* Link component helps move between pages without refreshing (SPA behavior) */}
                            <Link href="/leads" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                                <span className="text-sm font-medium">View Full Lead List</span>
                                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                            </Link>
                            <Link href="/activity-log" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                                <span className="text-sm font-medium">Check Employee Work Log</span>
                                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                            </Link>
                            <Link href="/customers" className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                                <span className="text-sm font-medium">See Converted Customers</span>
                                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900" />
                            </Link>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </DashboardLayout>
    );
}


