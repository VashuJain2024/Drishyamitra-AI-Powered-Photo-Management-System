import React from 'react';

const ChatAssistant = ({ messages, isOpen, onToggle, input, onInputChange, onSendMessage, loading }) => {
    return (
        <div className="chat-drawer">
            {!isOpen ? (
                <button className="chat-btn" onClick={onToggle}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                </button>
            ) : (
                <div className="glass-card chat-popup animate-fade-in">
                    <div className="sidebar-logo" style={{ padding: '1.5rem', marginBottom: 0, borderBottom: '1px solid var(--glass-border)' }}>
                        Drishyamitra<span>AI</span>
                        <button
                            onClick={onToggle}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`message-bubble ${m.role === 'bot' ? 'msg-bot' : 'msg-user'}`}>
                                {m.content}
                            </div>
                        ))}
                        {loading && (
                            <div className="message-bubble msg-bot" style={{ display: 'flex', gap: '4px' }}>
                                <span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                            </div>
                        )}
                    </div>

                    <form onSubmit={onSendMessage} style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Ask me anything..."
                                value={input}
                                onChange={(e) => onInputChange(e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                            <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '0 16px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatAssistant;
