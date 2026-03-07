"use client";

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '../providers/AuthProvider';
import { Input } from '../ui/Input';
import { useRouter } from 'next/navigation';
import { getUsers } from '../../services/api';


/**
 * LEAD FORM COMPONENT
 * 
 * This is the 'Big Form' used for both creating a new lead AND editing an old one.
 * It's modular, meaning we write the code once and use it in two different pages.
 * 
 * Key Concepts for the Evaluation:
 * 1. useState: Stores every single character the user types into the input boxes.
 * 2. useEffect: When editing, it fetches the existing data and 'auto-fills' the boxes.
 * 3. Event Handlers: Functions that run when you type (handleChange) or click save (handleSubmit).
 */
export default function LeadForm({ initialData, onSubmit, isEditing = false }) {
    const router = useRouter(); // Tool to change pages (navigation)
    const { user: currentUser } = useAuth(); // Tool to see who is logged in
    
    // 'loading' is true while the 'Save' button is spinning
    const [loading, setLoading] = useState(false); 
    
    // 'users' stores the list of employees (so an Admin can pick one to assign the lead)
    const [users, setUsers] = useState([]); 

    // 1. INITIAL STATE (The starting values for all the boxes)
    const [formData, setFormData] = useState({
        company_name: '',
        contact_person: '',
        phone: '',
        whatsapp: '',
        email: '',
        product_interest: 'Undergarments',
        quantity: 0,
        expected_price: 0,
        lead_source: '',
        city: '',
        state: '',
        country: 'India',
        status: 'New',
        notes: '',
        assigned_to: '',
    });

    /**
     * AUTO-FILL LOGIC:
     * This runs when the page opens. If we provided 'initialData' (because we are editing),
     * this function fills all the boxes with that data.
     */
    useEffect(() => {
        if (initialData) {
            setFormData(initialData); // "Put the old values into the state"
        }
        
        // Also fetch the list of employees for the 'Assigned To' dropdown
        const fetchUsers = async () => {
            try {
                const data = await getUsers();
                setUsers(data);
            } catch (e) {
                console.error("Failed to load users", e);
            }
        }
        fetchUsers();
    }, [initialData]);

    /**
     * TYPING HANDLER:
     * Every time you type a letter in a box, this function runs.
     * It updates our 'formData' memory with the new character.
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        // "...prev" means "keep the other boxes exactly as they are"
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * SAVE HANDLER:
     * Runs when you click the 'Save/Update' button.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // This stops the browser from refreshing the page
        setLoading(true); // Start the spinner
        try {
            // Send the data back to the Page that called this component
            await onSubmit(formData); 
            
            // Go back to the main list page automatically
            router.push('/leads'); 
        } catch (error) {
            console.error(error);
            alert('Failed to save lead information. Check console for details.');
        } finally {
            setLoading(false); // Stop the spinner
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            
            {/* GRID LAYOUT: Splits the form into 2 columns on big screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* --- Section 1: Basic Identity --- */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Company Name *</label>
                    <Input name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="e.g. Acme Corp" className="font-bold" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Primary Contact *</label>
                    <Input name="contact_person" value={formData.contact_person} onChange={handleChange} required placeholder="Person's Full Name" />
                </div>

                {/* --- Section 2: Communication --- */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Mobile Number *</label>
                    <Input name="phone" value={formData.phone} onChange={handleChange} required placeholder="10-digit number" />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">WhatsApp Link</label>
                    <Input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Optional contact link" />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Official Email</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="example@company.com" />
                </div>

                {/* --- Section 3: Product & Logistics --- */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Product Catalog Choice</label>
                    <select
                        name="product_interest"
                        value={formData.product_interest}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border-2 border-slate-100 bg-white px-3 py-2 text-sm font-bold focus:border-primary focus:outline-none"
                    >
                        <option value="Undergarments">Undergarments</option>
                        <option value="Cushion Covers">Cushion Covers</option>
                        <option value="Blankets">Blankets</option>
                        <option value="Bedsheet">Bedsheet</option>
                        <option value="Curtains">Curtains</option>
                        <option value="Towels">Towels</option>
                        <option value="Bath Linen">Bath Linen</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Order Quantity</label>
                    <Input name="quantity" type="number" value={formData.quantity} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Offered Price (Per Unit)</label>
                    <Input name="expected_price" type="number" value={formData.expected_price} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Market Source</label>
                    <Input name="lead_source" placeholder="Indiamart / FB / Referral" value={formData.lead_source} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">City</label>
                    <Input name="city" value={formData.city} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">State/Region</label>
                    <Input name="state" value={formData.state} onChange={handleChange} />
                </div>

                {/* --- Section 4: Administration --- */}
                
                {/* ROLE-BASED UI: Only the boss (Admin) can pick an employee to handle this lead */}
                {currentUser?.role === 'admin' && (
                    <div className="space-y-2 md:col-span-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <label className="text-xs font-black uppercase text-blue-600 tracking-widest">Assign Ownership to Employee</label>
                        <select
                            name="assigned_to"
                            value={formData.assigned_to}
                            onChange={handleChange}
                            className="mt-1 flex h-10 w-full rounded-md border-2 border-blue-200 bg-white px-3 py-2 text-sm font-bold focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">-- Unassigned (Available for All) --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} [{u.role.toUpperCase()}]</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* STATUS TOGGLES: Fancy buttons instead of a boring dropdown */}
                <div className="space-y-3 md:col-span-2 pt-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Lead Stage / Status</label>
                    <div className="flex gap-2 flex-wrap">
                        {['New', 'Contacted', 'Follow-up', 'Negotiation', 'Converted', 'Lost'].map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, status: status }))}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all border-2 ${formData.status === status
                                    ? 'bg-primary text-white border-primary shadow-md transform scale-105'
                                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FINAL NOTES */}
                <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Internal Narrative / Context</label>
