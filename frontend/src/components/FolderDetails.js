import React, { useState } from 'react';
import Gallery from './Gallery';

const FolderDetails = ({ 
    folder, 
    photos, 
    onBack, 
    onRename,
    onWhatsAppShare, 
    onEmailShare, 
    onPhotoWhatsAppShare, 
    onPhotoEmailShare 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(folder.name);

    const handleRenameSubmit = (e) => {
        e.preventDefault();
        if (newName.trim() && newName !== folder.name) {
            onRename(folder.id, newName);
        }
        setIsEditing(false);
    };

    return (
        <div className="animate-fade-in folder-details-page">
            <div className="section-header" style={{ 
                marginBottom: '3rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '2rem'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <button 
                        className="btn-primary" 
                        onClick={onBack} 
                        style={{ 
                            width: 'fit-content',
                            padding: '8px 20px', 
                            background: 'var(--glass)', 
                            border: '1px solid var(--glass-border)', 
                            boxShadow: 'none',
                            fontSize: '0.9rem'
                        }}
                    >
                        ← Back to Folders
                    </button>

                    <div className="folder-title-area">
                        {isEditing ? (
                            <form onSubmit={handleRenameSubmit} style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    className="glass-card"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                    style={{ 
                                        fontSize: '2rem', 
                                        fontWeight: 700, 
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--primary)',
                                        padding: '5px 15px',
                                        borderRadius: '12px',
                                        color: 'white'
                                    }}
                                />
                                <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>Save</button>
                                <button type="button" className="btn-primary" onClick={() => setIsEditing(false)} style={{ background: 'var(--danger)' }}>Cancel</button>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 800 }}>
                                    {folder.name} 
                                    <span style={{ 
                                        fontSize: '1rem', 
                                        color: 'var(--primary-light)', 
                                        marginLeft: '15px', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '2px',
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        padding: '4px 12px',
                                        borderRadius: '20px'
                                    }}>Collection</span>
                                </h2>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        fontSize: '1.5rem', 
                                        opacity: 0.6,
                                        transition: 'opacity 0.3s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                                    title="Rename Folder"
                                >
                                    ✏️
                                </button>
                            </div>
                        )}
                        <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                            {photos.length} memories captured in this folder
                        </p>
                    </div>
                </div>

                <div className="folder-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={() => onWhatsAppShare(folder.id)} style={{ padding: '15px 25px' }}>
                        Bulk WhatsApp 📱
                    </button>
                    <button className="btn-primary" onClick={() => onEmailShare(folder.id)} style={{ padding: '15px 25px', backgroundColor: '#5865F2' }}>
                        Bulk Email 📧
                    </button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', borderRadius: '30px' }}>
                <Gallery
                    photos={photos}
                    onWhatsAppShare={onPhotoWhatsAppShare}
                    onEmailShare={onPhotoEmailShare}
                />
            </div>
        </div>
    );
};

export default FolderDetails;
