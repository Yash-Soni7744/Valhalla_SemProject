"use client";

import { useEffect, useState } from 'react';
import { getCustomers, deleteCustomer } from '@/services/api';
import { Customer } from '@/types';
import { Search, ShoppingBag, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Papa from 'papaparse';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const data = await getCustomers();
                setCustomers(data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        load();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
        try {
            await deleteCustomer(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            alert('Failed to delete customer');
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.company_name.toLowerCase().includes(search.toLowerCase());

        let matchesDate = true;
        if (startDate || endDate) {
            const custDate = new Date(c.created_at);
            // Reset times for accurate day comparison
            custDate.setHours(0, 0, 0, 0);

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

        return matchesSearch && matchesDate;
    });

    const exportToCSV = () => {
        if (filteredCustomers.length === 0) return alert("No data to export");

        const csvData = filteredCustomers.map(c => ({
            'Company Name': c.company_name,
            'Total Orders': c.total_orders,
            'Total Order Value': c.total_order_value || 0,
            'Join Date': new Date(c.created_at).toLocaleDateString(),
            'Notes': c.notes || ''
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customers</h1>
                    <p className="text-muted-foreground">List of converted clients.</p>
                </div>
                <Button onClick={exportToCSV} variant="outline" className="shrink-0">
                    <Download className="w-4 h-4 mr-2" />
                    Export to CSV
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by company name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <span className="text-sm text-gray-500 whitespace-nowrap">From:</span>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-[140px]"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">To:</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-[140px]"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">Company</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Total Orders</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Total Value</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Join Date</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr> :
                            filteredCustomers.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-500">No customers found.</td></tr> :
                                filteredCustomers.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                                                <ShoppingBag className="w-4 h-4" />
                                            </div>
                                            {c.company_name}
                                        </td>
                                        <td className="px-6 py-4">{c.total_orders}</td>
                                        <td className="px-6 py-4 text-green-600 font-medium">₹{c.total_order_value?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:text-red-600"
                                                onClick={() => handleDelete(c.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}
