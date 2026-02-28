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
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Auto Validation</span>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PREVIEW SECTION */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Previewing: <span className="text-primary">{fileName}</span></h3>
                                    <p className="text-sm font-medium text-gray-500">System detected <span className="text-black font-bold">{mappedLeads.length}</span> records for import.</p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto shadow-inner bg-gray-50/30">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-100/80 text-[10px] uppercase font-bold text-gray-600 sticky top-0 border-b">
                                        <tr>
                                            <th className="px-4 py-3">Company Name</th>
                                            <th className="px-4 py-3">Contact</th>
                                            <th className="px-4 py-3">Phone No.</th>
                                            <th className="px-4 py-3">Email</th>
                                            <th className="px-4 py-3">Interest</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium italic">
                                        {mappedLeads.slice(0, 15).map((lead, i) => (
                                            <tr key={i} className="bg-white hover:bg-gray-50/50">
                                                <td className="px-4 py-3 font-bold text-gray-900 not-italic">{lead.company_name}</td>
                                                <td className="px-4 py-3">{lead.contact_person}</td>
                                                <td className="px-4 py-3 text-gray-500 font-mono tracking-tighter">{lead.phone}</td>
                                                <td className="px-4 py-3 text-gray-500">{lead.email || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-700 uppercase border">
                                                        {lead.product_interest}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {mappedLeads.length > 15 && (
                                    <div className="px-4 py-3 bg-gray-100/50 text-[10px] font-bold text-center text-gray-400 border-t tracking-widest uppercase">
                                        ... showing top 15 rows of {mappedLeads.length} total ...
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => { setStep('upload'); setMappedLeads([]); }}>Change File</Button>
                                <Button onClick={handleImport} className="gap-2 font-bold px-8">
                                    <UploadCloud className="w-4 h-4" />
                                    CONFIRM & IMPORT
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2.5: IMPORTING ANIMATION */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-8 border-gray-100 rounded-full"></div>
                                <div className="absolute inset-0 border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Processing Database...</h3>
                            <p className="text-gray-400 italic font-medium">Please do not refresh the page while we save your data.</p>
                        </div>
                    )}

                    {/* STEP 3: SUCCESS SECTION */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center h-80 space-y-6 text-center">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center border-4 border-green-200">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Success!</h3>
                                <p className="text-gray-500 font-bold italic">Successfully injected {stats.success} new leads into your CRM pipeline.</p>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button variant="outline" className="font-bold" onClick={() => { setStep('upload'); setMappedLeads([]); }}>Import More Files</Button>
                                <Button className="font-bold px-10" onClick={() => router.push('/leads')}>GO TO LEAD LIST</Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DashboardLayout>
    );

}

