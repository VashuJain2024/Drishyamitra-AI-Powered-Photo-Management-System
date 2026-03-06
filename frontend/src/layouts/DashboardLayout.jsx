import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Zap } from 'lucide-react';
import ChatAssistant from '../components/ChatAssistant';
import { useGlobalState } from '../context/GlobalStateContext';
import PhotoUpload from '../components/PhotoUpload';
import FaceLabelingModal from '../components/FaceLabelingModal';
import PhotoModal from '../components/PhotoModal';
import { chatAPI } from '../api';
import toast from 'react-hot-toast';
export default function DashboardLayout({ token, onLogout, organizing, onOrganize, uploading, onUpload }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { activeModal, setActiveModal, fetchPhotos } = useGlobalState();
    const [localUploading, setLocalUploading] = useState(false);
    const [waStatus, setWaStatus] = useState({ ready: false, status: 'Checking...' });
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse chat history:", e);
            }
        }
        return [{ role: 'bot', content: 'Hello! I am Drishyamitra AI. How can I help you manage your photos today?' }];
    });
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    useEffect(() => {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }, [messages]);
    const fetchWhatsAppStatus = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:3001/status`);
            const data = await res.json();
            setWaStatus({ ready: data.ready, status: data.status });
        } catch (err) {
            setWaStatus({ ready: false, status: 'Offline' });
        }
    }, []);
    useEffect(() => {
        if (!token) {
            navigate('/auth');
            return;
        }
        const interval = setInterval(fetchWhatsAppStatus, 5000);
        fetchWhatsAppStatus();
        return () => clearInterval(interval);
    }, [token, navigate, fetchWhatsAppStatus]);
    const handleWhatsAppReset = async () => {
        if (!window.confirm("Are you sure you want to disconnect WhatsApp and generate a new QR code?")) return;
        try {
            setWaStatus({ ready: false, status: 'Resetting...' });
            await fetch(`http://localhost:3001/reset`, { method: 'POST' });
            toast.success("WhatsApp service reset triggered");
        } catch (err) {
            toast.error("Failed to reset WhatsApp");
            console.error("Failed to reset WhatsApp", err);
        }
    };
    const handleClearChat = useCallback(async () => {
        if (!window.confirm("Are you sure you want to clear your chat history?")) return;
        try {
            await chatAPI.clearHistory();
            const initialMsg = [{ role: 'bot', content: 'Hello! I am Drishyamitra AI. How can I help you manage your photos today?', timestamp: new Date().toISOString() }];
            setMessages(initialMsg);
            localStorage.setItem('chatHistory', JSON.stringify(initialMsg));
            toast.success("Chat history cleared");
        } catch (err) {
            toast.error("Failed to clear chat history");
            console.error(err);
        }
    }, []);
    const handleSendMessage = useCallback(async (e, forcedText = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const messageToSend = forcedText || chatInput;
        if (!messageToSend.trim()) return;
        const newMsg = { role: 'user', content: messageToSend, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, newMsg]);
        setChatInput('');
        setChatLoading(true);
        try {
            const res = await chatAPI.sendMessage(messageToSend, messages.slice(-5));
            if (res.data.status === 'success') {
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: res.data.data.response,
                    data: res.data.data.data,
                    timestamp: new Date().toISOString()
                }]);
            } else {
                throw new Error(res.data.message || "API failure");
            }
        } catch (err) {
            console.error(err);
            toast.error("Chat service is being slow, please wait...");
            setMessages(prev => [...prev, {
                role: 'bot',
                content: "I'm having trouble connecting to the server. Please try again later.",
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setChatLoading(false);
        }
    }, [chatInput, messages]);
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
                        <PhotoUpload
                            uploading={localUploading}
                            setUploading={setLocalUploading}
                            onUploadSuccess={(data) => {
                                fetchPhotos();
                                const uploadedPhoto = data.uploaded ? data.uploaded[0] : data;
                                if (uploadedPhoto) {
                                    setActiveModal({ type: 'label', photo: uploadedPhoto });
                                }
                            }}
                        />
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
                onClearHistory={handleClearChat}
                loading={chatLoading}
                onLogout={onLogout}
            />
            {activeModal?.type === 'label' && (
                <FaceLabelingModal
                    photo={activeModal.photo}
                    onClose={() => setActiveModal(null)}
                    onComplete={() => {
                        setActiveModal(null);
                        setTimeout(() => alert("Face labeling complete!"), 300);
                    }}
                />
            )}
            {activeModal?.type === 'photo' && (
                <PhotoModal
                    photo={activeModal.payload}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </div>
    );
}