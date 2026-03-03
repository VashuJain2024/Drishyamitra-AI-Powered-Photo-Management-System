import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

export default function ChatAssistant({ messages, isOpen, onToggle, input, onInputChange, onSendMessage, loading }) {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, loading]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="bg-slate-800/90 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-3xl w-[360px] h-[500px] flex flex-col mb-4 overflow-hidden relative"
                    >
                        {}
                        <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center z-10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center border border-primary-500/30">
                                    <Bot className="w-5 h-5 text-primary-400" />
                                </div>
                                <h3 className="font-bold text-white tracking-tight">
                                    Drishyamitra<span className="text-primary-500">AI</span>
                                </h3>
                            </div>
                            <button
                                onClick={onToggle}
                                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-0">
                            {messages.map((m, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex ${m.role === 'bot' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-md ${m.role === 'bot'
                                        ? 'bg-slate-700/50 text-slate-200 rounded-tl-none border border-slate-600/50'
                                        : 'bg-primary-600 text-white rounded-tr-none'
                                        }`}>
                                        {m.content}
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-slate-700/50 text-slate-400 rounded-2xl rounded-tl-none p-3 text-sm flex gap-1 items-center border border-slate-600/50">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={onSendMessage} className="p-4 bg-slate-900/50 border-t border-slate-700 z-10 flex gap-2">
                            <input
                                type="text"
                                placeholder="Ask me anything..."
                                value={input}
                                onChange={(e) => onInputChange(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="bg-primary-600 hover:bg-primary-500 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
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
