"use client";

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { createFollowUp, updateLead } from '../../services/api';

import { X } from 'lucide-react';

/**
 * FOLLOW-UP MODAL (The Reminder Popup)
 * 
 * This is a 'dialog box' that appears when you want to schedule a 
 * call for later. It's a classic example of a React Modal.
 * 
 * Logic for the Evaluation:
 * 1. Conditional Rendering: If 'isOpen' is false, the component returns NULL (invisible).
 * 2. Multi-API Process: When you save, it creates a 'FollowUp' AND updates the Lead status.
 */
export default function FollowUpModal({ isOpen, onClose, lead }) {
    // 1. STATE: Temporary memory for the form inside the popup
    const [date, setDate] = useState(''); // When to call?
    const [notes, setNotes] = useState(''); // What to say?
    const [loading, setLoading] = useState(false); // Spinner for the 'Schedule' button

    // GUARD CLAUSE: If the popup isn't supposed to be open, stop here.
    if (!isOpen) return null;

    /**
     * SUBMIT HANDLER:
     * This saves the reminder to the database.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Don't refresh the page
        setLoading(true);
        try {
            // A. Create the reminder entry
            await createFollowUp({
                lead_id: lead.id,
                follow_up_date: date,
                notes: notes,
                status: 'Pending'
            });

            // B. Automatically update the main Lead to 'Follow-up' status
            // This is a "Business Logic" rule: Scheduling a call = Follow-up stage.
            if (lead.status !== 'Follow-up') {
                await updateLead(lead.id, { status: 'Follow-up' });
            }

            alert('Great! Reminder scheduled for: ' + date);
            onClose(); // Close the popup automatically
        } catch (err) {
            alert('Oops! Could not save the reminder.');
        } finally {
            setLoading(false);
        }
    };

    return (
        /* OVERLAY: The dark, blurry background that blocks the rest of the app */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            
            {/* THE MODAL BOX: The white center piece */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-4 border-primary/10">
                
                {/* 1. TOP HEADER */}
                <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Set Call Reminder</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 2. THE FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Context Hint */}
                    <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border-l-4 border-blue-500 font-bold italic">
                        You are scheduling a follow-up for: <br/>
                        <span className="text-lg not-italic text-blue-900 uppercase">{lead.company_name}</span>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Select Reminder Date</label>
                        <Input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full font-bold border-2 border-gray-100 focus:border-primary"
                        />
                    </div>

                    {/* Reminder Text */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Reminder Memo / Notes</label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-xl border-2 border-gray-100 bg-white px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none shadow-inner italic"
                            placeholder="Example: Call to discuss the bulk discount rate..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            required
                        />
                    </div>

