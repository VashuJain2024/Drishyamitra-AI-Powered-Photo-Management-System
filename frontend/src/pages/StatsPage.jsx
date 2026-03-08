import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import ActivityChart from '../components/ActivityChart';
import { motion } from 'framer-motion';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

export default function StatsPage() {
    const { token } = useOutletContext();
    const [stats, setStats] = useState({ photo_count: 0, person_count: 0, history_count: 0, recognized_faces_count: 0 });
    const [historyData, setHistoryData] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${baseUrl}/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.status === 'success') {
                    setStats(data.data);
                }
            } catch (err) { console.error("Fetch stats failed", err); }
        };

        const fetchHistory = async () => {
            try {
                const res = await fetch(`${baseUrl}/history/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.status === 'success') setHistoryData(data.data.history);
            } catch (err) { console.error("Fetch history failed for chart", err); }
        };

        fetchStats();
        fetchHistory();
    }, [token]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-3xl font-bold tracking-tight">System Analytics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard label="Total Photos" value={`${stats.photo_count}`} />
                <StatsCard label="Faces Recognized" value={stats.recognized_faces_count} />
                <StatsCard label="Total Shares" value={stats.history_count} />
            </div>
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-xl mt-8">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">Activity Trends</h3>
                    <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">Last 7 Days</span>
                </div>
                <p className="text-sm text-slate-400 mb-6 flex-1">Overview of your sharing activity across WhatsApp and Email.</p>
                <ActivityChart historyData={historyData} />
            </div>
        </motion.div>
    );
}