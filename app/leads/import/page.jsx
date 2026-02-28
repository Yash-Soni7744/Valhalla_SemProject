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
