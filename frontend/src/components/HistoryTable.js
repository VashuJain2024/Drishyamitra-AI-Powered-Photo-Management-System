import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function HistoryTable({ data }) {
    const getStatusInfo = (status) => {
        if (!status) return { text: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock };
        const s = status.toLowerCase();
        if (s.includes('success') || s === 'delivered' || s === 'sent') {
            return { text: 'Success', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 };
        }
        if (s.includes('fail') || s === 'error') {
            return { text: 'Failed', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: XCircle };
        }
        return { text: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock };
    };

    return (
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 text-sm tracking-wide uppercase">
                            <th className="py-5 px-6 font-semibold">Date</th>
                            <th className="py-5 px-6 font-semibold">Type</th>
                            <th className="py-5 px-6 font-semibold">Recipient</th>
                            <th className="py-5 px-6 font-semibold">Photo</th>
                            <th className="py-5 px-6 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-slate-400">
                                    No delivery history available yet.
                                </td>
                            </tr>
                        ) : (
                            data.map((item, idx) => {
                                const statusInfo = getStatusInfo(item.details?.status);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-slate-700/20 transition-colors"
                                    >
                                        <td className="py-4 px-6 text-slate-300 whitespace-nowrap">
                                            {new Date(item.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-4 px-6 text-slate-300 capitalize font-medium">
                                            {item.details?.delivery_medium || item.action.split('_')[0]}
                                        </td>
                                        <td className="py-4 px-6 text-slate-300 font-medium">
                                            {item.details?.recipient || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6 text-slate-400 text-sm max-w-[200px] truncate">
                                            {item.details?.photo_name || 'N/A'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.bg} ${statusInfo.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {statusInfo.text}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
