import React, { useRef, useState } from 'react';
import { UploadCloud, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { photoAPI } from '../api';
import toast from 'react-hot-toast';
export default function PhotoUpload({ uploading, setUploading, onUploadSuccess }) {
    const fileInputRef = useRef();
    const [isDragging, setIsDragging] = useState(false);
    const [, setUploadProgress] = useState(0);
    const processFiles = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setUploadProgress(0);
        const toastId = toast.loading(`Uploading ${files.length} photo(s)... 0%`);
        const formData = new FormData();
        const isBulk = files.length > 1;
        for (let i = 0; i < files.length; i++) {
            formData.append(isBulk ? 'photos' : 'photo', files[i]);
        }
        try {
            const onProgress = (percent) => {
                setUploadProgress(percent);
                toast.loading(`Uploading ${files.length} photo(s)... ${percent}%`, { id: toastId });
            };
            const res = isBulk
                ? await photoAPI.bulkUpload(formData, onProgress)
                : await photoAPI.upload(formData, onProgress);
            if (res.data.status === 'success') {
                toast.success("Upload complete! AI is now processing faces...", { id: toastId });
                if (onUploadSuccess) {
                    onUploadSuccess(res.data.data || res.data);
                }
            } else {
                toast.error(res.data.message || "Upload failed", { id: toastId });
            }
        } catch (err) {
            toast.error("Upload failed. Please check connection.", { id: toastId });
            console.error(err);
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    const handleFileSelect = (e) => {
        processFiles(e.target.files);
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    };
    return (
        <div
            className="relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <button
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white shadow-lg transition-all disabled:opacity-50 active:scale-95"
            >
                <UploadCloud className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Photos'}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-primary-600/20 backdrop-blur-[2px] border-4 border-dashed border-primary-500 flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-primary-600/20 flex items-center justify-center">
                                <FileImage className="w-10 h-10 text-primary-400 animate-bounce" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-white">Drop your memories</h3>
                                <p className="text-slate-400 text-sm">Release to upload your photos instantly</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}