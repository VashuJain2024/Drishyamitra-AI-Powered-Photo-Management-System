import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Mic, MicOff, ImageIcon, Trash2 } from 'lucide-react';
export default function ChatAssistant({ messages, isOpen, onToggle, input, onInputChange, onSendMessage, loading, onClearHistory }) {
    const messagesEndRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const newText = input + (input ? ' ' : '') + transcript;
                onInputChange(newText);
                setIsListening(false);
                setTimeout(() => {
                    if (onSendMessage) {
                        onSendMessage({ preventDefault: () => { } }, newText);
                    }
                }, 100);
            };
            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [input, onInputChange, onSendMessage]);
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error("Microphone access failed", e);
            }
        }
    };
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, loading]);
    const renderMessageData = (data) => {
        if (!data) return null;
        if (data.type === 'photos' && data.photos && data.photos.length > 0) {
            return (
                <div className="mt-3 grid grid-cols-2 gap-2">
                    {data.photos.slice(0, 4).map((p, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-600">
                            <img
                                src={`http://localhost:5000/api/dashboard/media/${p.filename}`}
                                alt="Result"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                    {data.photos.length > 4 && (
                        <div className="relative aspect-square rounded-xl overflow-hidden border border-slate-600 bg-slate-800 flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-xs font-semibold">+{data.photos.length - 4} more</span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-3xl w-[380px] h-[550px] flex flex-col mb-4 overflow-hidden relative"
                    >
                        { }
                        <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center border border-primary-500/30 shadow-inner">
                                    <Bot className="w-5 h-5 text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white tracking-tight text-sm">
                                        Drishyamitra<span className="text-primary-500">AI</span>
                                    </h3>
                                    <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={onClearHistory}
                                    type="button"
                                    title="Clear chat history"
                                    className="text-slate-400 hover:text-rose-400 p-2 rounded-full hover:bg-rose-500/10 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onToggle}
                                    type="button"
                                    className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-5 relative z-0">
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex flex-col ${m.role === 'bot' ? 'items-start' : 'items-end'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-md ${m.role === 'bot'
                                        ? 'bg-slate-700/50 text-slate-200 rounded-tl-none border border-slate-600/50'
                                        : 'bg-primary-600 text-white rounded-tr-none'
                                        }`}>
                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                        { }
                                        {m.role === 'bot' && renderMessageData(m.data)}
                                        <span className={`text-[9px] mt-2 block opacity-60 ${m.role === 'bot' ? 'text-left' : 'text-right'}`}>
                                            {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-slate-700/50 backdrop-blur-md rounded-2xl rounded-tl-none p-4 border border-slate-600/50 flex flex-col gap-2 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-primary-500/10 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                                        <div className="flex gap-1.5 items-center relative z-10">
                                            <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-widest text-primary-400 uppercase opacity-70 animate-pulse relative z-10">Drishyamitra is thinking</span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} className="h-2" />
                        </div>
                        { }
                        <form onSubmit={onSendMessage} className="p-3 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700 z-10 flex gap-2 items-center">
                            <button
                                type="button"
                                onClick={toggleListening}
                                disabled={loading}
                                className={`p-2.5 rounded-full transition-all flex-shrink-0 ${isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                title={isListening ? "Stop listening" : "Start voice input"}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <input
                                type="text"
                                placeholder={isListening ? "Listening..." : "Ask me anything..."}
                                value={input}
                                onChange={(e) => onInputChange(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="bg-primary-600 hover:bg-primary-500 text-white p-2.5 rounded-full transition-all disabled:opacity-50 disabled:scale-95 flex items-center justify-center flex-shrink-0 shadow-lg"
                            >
                                <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggle}
                className="w-14 h-14 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.3)] shadow-primary-500/20 z-50 transition-all outline-none focus:ring-4 focus:ring-primary-500/50"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>
        </div>
    );
}