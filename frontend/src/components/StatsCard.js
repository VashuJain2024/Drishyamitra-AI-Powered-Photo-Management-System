import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ label, value, icon }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 p-6 rounded-3xl shadow-lg relative overflow-hidden"
        >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 font-medium text-lg">{label}</h3>
                {icon && <div className="text-primary-400">{icon}</div>}
            </div>
            <p className="text-4xl font-extrabold text-white tracking-tight">{value}</p>
        </motion.div>
    );
}
