import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import FolderList from '../components/FolderList';
import { motion } from 'framer-motion';

export default function FoldersPage() {
    const { token } = useOutletContext();
    const [folders, setFolders] = useState([]);
    const navigate = useNavigate();

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

    useEffect(() => {
        fetchFolders();

    }, [token]);

    const fetchFolders = async () => {
        try {
            const res = await fetch(`${baseUrl}/dashboard/folders`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'success') setFolders(data.data);
        } catch (err) { console.error("Fetch folders failed", err); }
    };

    const handleFolderClick = (folder) => {
        navigate(`/dashboard/folders/${folder.id}`, { state: { folder } });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Your Folders</h2>
            </div>
            <FolderList folders={folders} onFolderClick={handleFolderClick} />
        </motion.div>
    );
}
