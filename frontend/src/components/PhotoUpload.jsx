import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { useGlobalState } from '../context/GlobalStateContext';
import axios from 'axios';

export default function PhotoUpload({ uploading, setUploading, onUploadSuccess }) {
    const { token, baseUrl, getAxiosConfig } = useGlobalState();
    const fileInputRef = useRef();

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        const formData = new FormData();
        const isBulk = files.length > 1;

        for (let i = 0; i < files.length; i++) {
            formData.append(isBulk ? 'photos' : 'photo', files[i]);
        }

        try {
            const res = await axios.post(`${baseUrl}/photos/${isBulk ? 'bulk_upload' : 'upload'}`, formData, {
                headers: {
                    ...getAxiosConfig().headers,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (res.data.status === 'success') {
                if (onUploadSuccess) {
                    onUploadSuccess(res.data.data || res.data);
                }
            }
        } catch (err) {
            alert("Upload failed");
            console.error(err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative">
            <button
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white shadow-lg transition-all disabled:opacity-50"
            >
                <UploadCloud className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Add Photos'}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
            />
        </div>
    );
}
