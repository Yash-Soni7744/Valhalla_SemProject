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
