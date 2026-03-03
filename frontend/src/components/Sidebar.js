import React from 'react';
import { motion } from 'framer-motion';
import { Image, Folder, History, BarChart2, LogOut } from 'lucide-react';

export default function Sidebar({ currentPath, onNavigate, onLogout, waStatus, onResetWhatsApp }) {
    const menuItems = [
        { id: '/dashboard', label: 'Gallery', icon: Image },
        { id: '/dashboard/folders', label: 'Folders', icon: Folder },
        { id: '/dashboard/history', label: 'Delivery History', icon: History },
        { id: '/dashboard/stats', label: 'Analytics', icon: BarChart2 },
    ];

    return (
        <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col h-full z-20">
            <div className="p-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1 cursor-pointer">
                    Drishyamitra<span className="text-primary-500">AI</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = currentPath === item.id || (item.id !== '/dashboard' && currentPath.startsWith(item.id));
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive
                                ? 'bg-primary-600/20 text-primary-400 font-semibold'
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="p-4 mb-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${waStatus.ready ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={`text-sm font-semibold ${waStatus.ready ? 'text-emerald-500' : 'text-rose-500'}`}>
                                WhatsApp {waStatus.ready ? 'Ready' : 'Offline'}
                            </span>
                        </div>
                        <button
                            onClick={onResetWhatsApp}
                            title="Disconnect & Scan New QR"
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{waStatus.status}</p>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
