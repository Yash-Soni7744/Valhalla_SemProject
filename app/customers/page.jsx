"use client";

import { useEffect, useState } from 'react';
import { getCustomers, deleteCustomer } from '../../services/api';
import { Search, ShoppingBag, Trash2, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import DashboardLayout from '../../components/layout/DashboardLayout';

import Papa from 'papaparse'; // Library to convert JSON data to CSV format

/**
 * CUSTOMERS PAGE
 * 
 * This is the "Wall of Fame". It lists only those leads who actually bought something.
 * Once a Lead reaches the 'Converted' status, they appear here as a Customer.
 * 
 * Features for the Evaluation:
 * 1. Search by Company Name.
 * 2. Filter by the date they joined.
 * 3. Export data to an Excel-friendly CSV file.
 */
export default function CustomersPage() {
    // 1. STATE (Memory for the page)
    // 'customers' holds the list of people who have placed orders
    const [customers, setCustomers] = useState([]);
    
    // 'loading' is TRUE while we wait for localStorage to respond
    const [loading, setLoading] = useState(true);
    
    // 2. FILTER STATE
    const [search, setSearch] = useState(''); // Text in search box
    const [startDate, setStartDate] = useState(''); // "From" date picker
    const [endDate, setEndDate] = useState(''); // "To" date picker

    /**
     * INITIAL LOAD
     * Fetch the customer list as soon as the user opens this page.
     */
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getCustomers();
                setCustomers(data); // Save the list to memory
            } catch (e) {
                console.error("Error loading customers:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    /**
     * DELETE HANDLER
     * Removes a customer from the database.
     */
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to permanently delete this customer record?')) return;
        try {
            await deleteCustomer(id); // Delete from storage
            // Remove from the screen immediately
            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            alert('Failed to delete customer');
        }
    };

    /**
     * FILTER LOGIC
     * We calculate which customers to show based on the Search text and Date Range.
     */
    const filteredCustomers = customers.filter(c => {
        // Step A: Check if company name matches search
        const matchesSearch = c.company_name.toLowerCase().includes(search.toLowerCase());

        // Step B: Check if the join date is within the selected range
        let matchesDate = true;
        if (startDate || endDate) {
            const custDate = new Date(c.created_at);
            custDate.setHours(0, 0, 0, 0); // Ignore exact time, focus on the day

            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (custDate < sDate) matchesDate = false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                if (custDate > eDate) matchesDate = false;
            }
        }

        // Only show if BOTH conditions (Search + Date) are met
        return matchesSearch && matchesDate;
    });

    /**
     * EXPORT TO CSV (Excel Support)
     * This takes the list you see on screen and turns it into a downloadable file.
     */
    const exportToCSV = () => {
        if (filteredCustomers.length === 0) return alert("Nothing to export! Try changing your filters.");

        // 1. Prepare the data (Give it nice Column Headers)
        const csvData = filteredCustomers.map(c => ({
            'Company Name': c.company_name,
            'Total Orders': c.total_orders,
            'Total Business Value (INR)': c.total_order_value || 0,
            'Customer Joined On': new Date(c.created_at).toLocaleDateString(),
            'Internal Notes': c.notes || 'None'
        }));

        // 2. Convert JS data to CSV text using PapaParse
        const csvString = Papa.unparse(csvData);
        
        // 3. Create a "fake" link in the background and click it to download the file
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `miestilo_customers_report_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Clean up the fake link
    };

    /**
     * THE UI (RENDER)
     * Using <DashboardLayout> for consistency.
     */
    return (
        <DashboardLayout>
            <div className="space-y-6 pt-4">
                
                {/* A. PAGE HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900">Customer Database</h1>
                        <p className="text-muted-foreground italic font-medium">All leads that successfully turned into paying clients.</p>
                    </div>
                    {/* DOWNLOAD BUTTON */}
                    <Button onClick={exportToCSV} variant="outline" className="shrink-0 font-bold border-2 hover:bg-gray-50 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download Excel (CSV)
                    </Button>
                </div>

                {/* B. SEARCH & DATE FILTERS SECTION */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    {/* Search by Name */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Company Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 placeholder:text-gray-300 font-medium"
                        />
                    </div>
                    {/* Date Range Selection */}
                    <div className="flex gap-2 items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Joined From:</span>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-[150px] text-sm font-bold border-gray-200"
                        />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">To:</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-[150px] text-sm font-bold border-gray-200"
                        />
                    </div>
                </div>

                {/* C. CUSTOMERS DATA TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b font-mono uppercase text-[10px] tracking-widest text-gray-500 font-black">
                                <tr>
                                    <th className="px-6 py-4">Company Profile</th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4">Revenue Generated</th>
                                    <th className="px-6 py-4">Onboarding Date</th>
                                    <th className="px-6 py-4 text-right">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 italic">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Searching the database...</td></tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No customers match your filters.</td></tr>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                                            {/* Column 1: Company Name */}
                                            <td className="px-6 py-4 text-gray-900 flex items-center gap-3 not-italic">
                                                <div className="p-2 bg-purple-100 rounded-full text-purple-700 border border-purple-200">
                                                    <ShoppingBag className="w-4 h-4" />
                                                </div>
                                                <span className="font-black text-lg">{c.company_name}</span>
                                            </td>
                                            {/* Column 2: Orders Count */}
                                            <td className="px-6 py-4 font-bold text-gray-600 not-italic">
                                                {c.total_orders} Shipments
                                            </td>
                                            {/* Column 3: Money Value */}
                                            <td className="px-6 py-4 text-green-700 font-black text-lg not-italic">
                                                ₹{c.total_order_value?.toLocaleString() || '0'}
                                            </td>
                                            {/* Column 4: Date */}
                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </td>
                                            {/* Column 5: Trash Button */}
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-200 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(c.id)}
                                                    title="Delete Record"
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
                </div>
            </div>
        </DashboardLayout>
    );
}


