"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse'; // For handling CSV files
import * as XLSX from 'xlsx'; // For handling Excel (.xlsx) files
import { Button } from '../../../components/ui/Button';
import FileUpload from '../../../components/ui/file-upload/FileUpload';
import { ChevronRight, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createLeads } from '../../../services/api';
import DashboardLayout from '../../../components/layout/DashboardLayout';


/**
 * IMPORT LEADS PAGE
 * 
 * This page allows users to upload an Excel or CSV file.
 * The system automatically maps the columns (like 'Company' or 'Phone')
 * and imports them in bulk to the CRM.
 * 
 * Flow: 
 * 1. Upload -> 2. Verify (Preview) -> 3. Success
 */
export default function ImportLeadsPage() {
    const router = useRouter();
    
    // STATE: Track which step we are on
    const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'importing' | 'success'
    
    const [parsedData, setParsedData] = useState([]); // Raw data from file
    const [mappedLeads, setMappedLeads] = useState([]); // Formatted data for CRM
    const [fileName, setFileName] = useState('');
    const [stats, setStats] = useState({ total: 0, success: 0 });

    /**
     * FILE SELECT HANDLER
     * Detects if it is CSV or Excel and parses it accordingly.
     */
    const handleFileSelect = (file) => {
        setFileName(file.name);
        
        if (file.name.endsWith('.csv')) {
            // Handle CSV using PapaParse
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setParsedData(results.data);
                    processData(results.data);
                    setStep('preview');
                }
            });
        } else {
            // Handle Excel using XLSX library
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0]; // Take the first sheet
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet);
                setParsedData(json);
                processData(json);
                setStep('preview');
            };
            reader.readAsBinaryString(file);
        }
    };

    /**
     * AUTO-MAPPING LOGIC
     * This function tries to guess which column in the Excel file 
     * matches our CRM fields (e.g. 'Business Name' should be 'company_name').
     */
    const processData = (data) => {
        // Helper to clean column names for matching
        const normalize = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

        const mapped = data.map(row => {
            // Helper to find a value by checking multiple possible column headers
            const findValue = (possibleKeys) => {
                for (const k of Object.keys(row)) {
                    if (possibleKeys.includes(normalize(k))) {
                        return row[k];
                    }
                }
                return undefined;
            };

            return {
                company_name: findValue(['companyname', 'company', 'businessname']) || row['Company'] || 'Unknown Company',
                contact_person: findValue(['contactperson', 'contact', 'fullname']) || row['Contact'] || '-',
                phone: findValue(['phone', 'phonenumber', 'mobile', 'whatsapp', 'cell']) || row['Phone'] || '00000',
                email: findValue(['email', 'emailaddress', 'mail']) || '',
                product_interest: findValue(['productinterest', 'product', 'category', 'productcategory']) || 'Undergarments',
                quantity: Number(findValue(['quantity', 'qty', 'count'])) || 0,
                expected_price: Number(findValue(['expectedprice', 'expectedamount', 'price', 'amount', 'value'])) || 0,
                lead_source: 'Imported File',
                city: findValue(['city', 'town', 'location']) || '',
                state: findValue(['state', 'region', 'province']) || '',
                assigned_to: findValue(['assignedto', 'owner', 'salesperson']) || '',
                status: 'New',
                notes: findValue(['notes', 'remarks', 'comment']) || ''
            };
        });

        setMappedLeads(mapped);
    };

    /**
     * FINAL IMPORT
     * Sends the mapped list to the API to be saved.
     */
    const handleImport = async () => {
        setStep('importing');
        try {
            const count = await createLeads(mappedLeads);
            setStats({ total: mappedLeads.length, success: count });
            setStep('success');
        } catch (e) {
            alert('Bulk import failed. Please check your file format.');
            setStep('preview');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 lowercase uppercase">Bulk Import Leads</h1>
                    <p className="text-muted-foreground font-medium italic">Upload your existing Excel or CSV database to the CRM.</p>
                </div>

                {/* Visual Progress Steps: Upload -> Verify -> Done */}
                <div className="flex items-center justify-center gap-4 text-xs font-bold font-mono">
                    <div className={`flex items-center gap-2 ${step !== 'upload' ? 'text-green-600' : 'text-primary'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step !== 'upload' ? 'border-green-600 bg-green-50' : 'border-primary bg-primary/10'}`}>1</div>
                        FILE UPLOAD
                    </div>
                    <div className="w-10 h-0.5 bg-gray-200" />
                    <div className={`flex items-center gap-2 ${['preview', 'importing', 'success'].includes(step) ? (step === 'success' ? 'text-green-600' : 'text-primary') : 'text-gray-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${['preview', 'importing', 'success'].includes(step) ? (step === 'success' ? 'border-green-600 bg-green-50' : 'border-primary bg-primary/10') : 'border-gray-200'}`}>2</div>
                        VERIFY DATA
                    </div>
                    <div className="w-10 h-0.5 bg-gray-200" />
                    <div className={`flex items-center gap-2 ${step === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === 'success' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>3</div>
                        FINISHED
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border min-h-[400px]">

                    {/* STEP 1: UPLOAD SECTION */}
                    {step === 'upload' && (
                        <div className="max-w-xl mx-auto space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-900 uppercase">Select your database file</h3>
                                <p className="text-sm text-gray-500 font-medium italic">
                                    Supports <span className="text-primary">.CSV</span> and <span className="text-primary">.XLSX</span> formats.
                                </p>
                            </div>
                            <FileUpload onFileSelect={handleFileSelect} />
                            <div className="flex justify-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 p-3 rounded-lg border border-dashed">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Smart Mapping</span>
