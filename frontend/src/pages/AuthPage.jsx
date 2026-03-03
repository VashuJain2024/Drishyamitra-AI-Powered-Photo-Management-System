import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function AuthPage({ onLoginComplete }) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        const fields = e.target;
        const username = fields[0].value;
        const password = fields[1].value;

        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

        try {
            const res = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.status === 'success') {
                document.cookie = `token=${data.data.access_token}; path=/; max-age=86400; SameSite=Lax`;
                onLoginComplete(data.data.access_token);
                navigate('/dashboard');
            } else {
                alert(data.message || "Authentication failed");
            }
        } catch (err) {
            alert("Auth error. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
            {}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700 p-10 rounded-3xl shadow-2xl"
            >
                <h2 className="text-3xl font-bold text-white mb-8 text-center tracking-tight">Welcome Back</h2>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                        <input
                            type="text"
                            placeholder="e.g. admin"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                        <input
                            type="password"
                            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Secure Sign In'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
