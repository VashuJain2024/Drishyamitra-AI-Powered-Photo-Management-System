import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { UploadCloud, Zap } from 'lucide-react';
import ChatAssistant from '../components/ChatAssistant';

export default function DashboardLayout({ token, onLogout, organizing, onOrganize, uploading, onUpload }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [waStatus, setWaStatus] = useState({ ready: false, status: 'Checking...' });
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'bot', content: 'Hello! I am Drishyamitra AI. How can I help you manage your photos today?' }]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/auth');
            return;
        }
        const interval = setInterval(fetchWhatsAppStatus, 5000);
        fetchWhatsAppStatus();
        return () => clearInterval(interval);

    }, [token, navigate]);

    const fetchWhatsAppStatus = async () => {
        try {
            const res = await fetch(`http://localhost:3001/status`);
            const data = await res.json();
            setWaStatus({ ready: data.ready, status: data.status });
        } catch (err) {
            setWaStatus({ ready: false, status: 'Offline' });
        }
    };

    const handleWhatsAppReset = async () => {
        if (!window.confirm("Are you sure you want to disconnect WhatsApp and generate a new QR code?")) return;
        try {
            setWaStatus({ ready: false, status: 'Resetting...' });
            await fetch(`http://localhost:3001/reset`, { method: 'POST' });

        } catch (err) {
            console.error("Failed to reset WhatsApp", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || chatLoading) return;
        const msg = chatInput;
        setChatInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setChatLoading(true);

        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

        try {
            const res = await fetch(`${baseUrl}/chat/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, history: messages })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setMessages(prev => [...prev, { role: 'bot', content: data.data.response }]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
            <Sidebar
                currentPath={location.pathname}
                onNavigate={navigate}
                onLogout={onLogout}
                waStatus={waStatus}
                onResetWhatsApp={handleWhatsAppReset}
            />

            <div className="flex-1 flex flex-col relative pb-8">
                <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 z-10 sticky top-0">
                    <div>
                        {/* Header Title based on route can go here if needed */}
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onOrganize}
                            disabled={organizing}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
                        >
                            <Zap className="w-4 h-4 text-warning" />
                            {organizing ? 'Organizing...' : 'Organize AI'}
                        </button>
                        <div className="relative">
                            <button
                                disabled={uploading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white shadow-lg transition-all disabled:opacity-50"
                            >
                                <UploadCloud className="w-4 h-4" />
                                {uploading ? 'Uploading...' : 'Add Photos'}
                            </button>
                            <input
                                type="file"
                                multiple
                                onChange={onUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 relative">
                    {/* Decorative background gradients */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-900/10 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10 h-full">
                        <Outlet context={{ token, waStatus }} />
                    </div>
                </main>
            </div>

            <ChatAssistant
                messages={messages}
                isOpen={chatOpen}
                onToggle={() => setChatOpen(!chatOpen)}
                input={chatInput}
                onInputChange={setChatInput}
                onSendMessage={handleSendMessage}
                loading={chatLoading}
            />
        </div>
    );
}
