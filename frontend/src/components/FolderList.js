import React from 'react';

const FolderList = ({ folders, onFolderClick }) => {
    if (folders.length === 0) {
        return (
            <div className="glass-card animate-fade-in" style={{ padding: '4rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-dim)' }}>No folders yet. Try organizing your photos!</p>
            </div>
        );
    }

    return (
        <div className="photo-grid">
            {folders.map((folder) => (
                <div
                    key={folder.id}
                    className="glass-card folder-card animate-fade-in"
                    onClick={() => onFolderClick(folder)}
                    style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.3s ease', padding: '1rem' }}
                >
                    <div className="folder-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>📂</div>
                    <div className="folder-name" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{folder.name}</div>
                    <div className="folder-count" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '2.5rem' }}>
                        {folder.face_count} Photos
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FolderList;
