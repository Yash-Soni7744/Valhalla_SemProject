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
