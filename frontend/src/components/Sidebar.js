import React from 'react';

const Sidebar = ({ currentView, setView, onLogout, waStatus }) => {
    const menuItems = [
        { id: 'gallery', label: 'Gallery', icon: '🖼️' },
        { id: 'folders', label: 'Folders', icon: '📂' },
        { id: 'history', label: 'Delivery History', icon: '📜' },
        { id: 'stats', label: 'Analytics', icon: '📊' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                Drishyamitra<span>AI</span>
            </div>

            <nav className="nav-menu">
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => setView(item.id)}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div style={{ padding: '12px', marginBottom: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: waStatus.ready ? 'var(--success)' : 'var(--danger)' }}></div>
                        <span style={{ color: waStatus.ready ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>WhatsApp {waStatus.ready ? 'Ready' : 'Offline'}</span>
                    </div>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{waStatus.status}</p>
                </div>

                <button
                    className="btn-primary"
                    style={{ width: '100%', background: 'var(--glass)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}
                    onClick={onLogout}
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
