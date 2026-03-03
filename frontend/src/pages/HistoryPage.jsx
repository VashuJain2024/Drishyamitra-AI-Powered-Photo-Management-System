import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import HistoryTable from '../components/HistoryTable';
import { motion } from 'framer-motion';

export default function HistoryPage() {
    const { token } = useOutletContext();
    const [historyData, setHistoryData] = useState([]);

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

    useEffect(() => {
        fetchHistory();

    }, [token]);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${baseUrl}/history/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'success') setHistoryData(data.data.history);
        } catch (err) { console.error("Fetch history failed", err); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Delivery History</h2>
            </div>
            <HistoryTable data={historyData} />
        </motion.div>
    );
}
