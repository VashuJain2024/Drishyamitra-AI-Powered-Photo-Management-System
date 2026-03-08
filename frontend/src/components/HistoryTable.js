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
        <div className="bg-transparent md:bg-slate-800/60 md:backdrop-blur-xl md:border md:border-slate-700 md:rounded-3xl md:shadow-xl md:overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {data.length === 0 ? (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center text-slate-400">
                        No delivery history available yet.
                    </div>
                ) : (
                    data.map((item, idx) => {
                        const statusInfo = getStatusInfo(item.details?.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 xs:p-4 shadow-lg"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusInfo.bg} ${statusInfo.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {statusInfo.text}
                                        </span>
                                        <p className="text-slate-400 text-[10px] mt-1">
                                            {new Date(item.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-primary-400 px-2 py-0.5 bg-primary-500/10 rounded-md border border-primary-500/20 capitalize">
                                        {item.details?.delivery_medium || item.action.split('_')[0]}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <span className="text-xs text-slate-500 font-medium">Recipient:</span>
                                        <span className="text-xs text-slate-200 font-semibold truncate max-w-[150px]">{item.details?.recipient || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-2">
                                        <span className="text-xs text-slate-500 font-medium">Photo:</span>
                                        <span className="text-xs text-slate-400 italic truncate max-w-[150px]">{item.details?.photo_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}