import React from 'react';

const Gallery = ({ photos, onWhatsAppShare, onEmailShare }) => {
    if (photos.length === 0) {
        return (
            <div className="glass-card animate-fade-in" style={{ padding: '4rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-dim)' }}>No photos found. Start by uploading some!</p>
            </div>
        );
    }

    return (
        <div className="photo-grid">
            {photos.map((p) => (
                <div key={p.id} className="glass-card photo-card animate-fade-in">
                    <div className="photo-wrapper">
                        <img
                            src={`http://localhost:5000/api/dashboard/media/${p.filename}`}
                            alt={p.filename}
                            className="photo-img"
                            loading="lazy"
                        />
                        <div className="photo-overlay">
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <button
                                    className="btn-primary"
                                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
                                    onClick={() => onWhatsAppShare(p.id)}
                                >
                                    WhatsApp 📱
                                </button>
                                <button
                                    className="btn-primary"
                                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px', backgroundColor: '#5865F2' }}
                                    onClick={() => onEmailShare(p.id)}
                                >
                                    Email 📧
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="photo-info" style={{ padding: '0 8px 8px' }}>
                        <div className="photo-name" style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                            {p.filename.split('_').slice(2).join('_')}
                        </div>
                        <small style={{ color: 'var(--text-dim)' }}>{new Date(p.upload_date).toLocaleDateString()}</small>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Gallery;
