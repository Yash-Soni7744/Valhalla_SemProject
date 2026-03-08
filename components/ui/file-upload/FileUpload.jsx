"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, X, FileText } from 'lucide-react';
import { cn } from '../../../utils/cn';


/**
 * FILE UPLOAD COMPONENT
 * 
 * This allows employees to drag and drop Excel or CSV files to import 
 * hundreds of leads at once! 
 * It uses a library called 'react-dropzone' to handle the drag-and-drop logic.
 */
export default function FileUpload({
    onFileSelect,
    accept = {
        'text/csv': ['.csv'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls']
    },
    maxSize = 5 * 1024 * 1024, // Limiting file size to 5MB
    label = "Drag & drop CSV or Excel file here"
}) {
    const [selectedFile, setSelectedFile] = useState(null); // Stores the file chosen
    const [error, setError] = useState(null); // Stores any error messages

    // This function runs when a file is 'dropped' or selected
    const onDrop = useCallback((acceptedFiles, fileRejections) => {
        setError(null);
        
        // If the file is too big or wrong type, show an error
        if (fileRejections.length > 0) {
            const msg = fileRejections[0].errors[0].message;
            setError(msg);
            return;
        }

        // If the file is good, save it
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setSelectedFile(file);
            onFileSelect(file); // Tell the parent component which file was picked
        }
    }, [onFileSelect]);

    // Setting up the dropzone logic
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        maxFiles: 1
    });

    // Function to remove the selected file
    const clearFile = (e) => {
        e.stopPropagation(); // Prevents the 'click' from opening the file picker again
        setSelectedFile(null);
    };

    return (
        <div className="w-full">
            {/* The actual drop area */}
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-xl transition-all cursor-pointer bg-gray-50/50 hover:bg-gray-50",
                    isDragActive ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-gray-300 hover:border-primary/50",
                    error ? "border-red-300 bg-red-50" : "",
                    selectedFile ? "border-green-300 bg-green-50/30" : ""
                )}
            >
                <input {...getInputProps()} />

                {/* If a file is selected, show its name and size */}
                {selectedFile ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                            {selectedFile.name.endsWith('.csv') ? <FileText className="w-8 h-8" /> : <FileSpreadsheet className="w-8 h-8" />}
                        </div>
                        <p className="font-medium text-gray-900 text-lg">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500 mb-4">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        <button
                            onClick={clearFile}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-full shadow-sm border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                        >
                            <X className="w-4 h-4" /> Change File
                        </button>
                    </div>
                ) : (
                    /* If no file is selected, show the upload icon and labels */
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                            <Upload className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-lg font-semibold text-gray-700">
                                {isDragActive ? "Drop it now!" : label}
                            </p>
                            <p className="text-sm text-gray-500">
                                Supports .csv, .xlsx, .xls (Max 5MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>
            {/* Show error message if something went wrong */}
            {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    {error}
                </p>
            )}
        </div>
    );
