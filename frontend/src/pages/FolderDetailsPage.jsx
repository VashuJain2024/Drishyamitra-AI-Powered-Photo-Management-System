import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, useLocation, useNavigate } from 'react-router-dom';
import FolderDetails from '../components/FolderDetails';
import { motion } from 'framer-motion';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

export default function FolderDetailsPage() {
    const { token } = useOutletContext();
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [folder, setFolder] = useState(location.state?.folder || null);
    const [folderPhotos, setFolderPhotos] = useState([]);

    useEffect(() => {
        if (!folder) {
            navigate('/dashboard/folders');
            return;
        }

        const fetchFolderPhotos = async (personId) => {
            try {
                const res = await fetch(`${baseUrl}/dashboard/folders/${personId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.status === 'success') setFolderPhotos(data.data);
            } catch (err) { console.error(err); }
        };

        fetchFolderPhotos(id);
    }, [id, folder, navigate, token]);

    const handleRenameFolder = async (personId, newName) => {
        try {
            const res = await fetch(`${baseUrl}/dashboard/folders/${personId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newName })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setFolder({ ...folder, name: newName });
            } else alert(data.message || "Rename failed");
        } catch (err) { alert("Network error"); }
    };

    const handleWhatsAppShare = async (photoId) => {
        const recipient = prompt("Enter phone number (with country code):");
        if (!recipient) return;
        const message = prompt("Optional message:", "Here is your photo from Drishyamitra!");
        if (message === null) return;
        try {
            const res = await fetch(`${baseUrl}/delivery/share/whatsapp`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_id: photoId, recipient, message })
            });
            const data = await res.json();
            if (data.status === 'success') alert("Enqueued for WhatsApp delivery!");
            else alert(data.message || "Sharing failed");
        } catch (err) { alert("Network error."); }
    };

    const handleEmailShare = async (photoId) => {
        const recipient = prompt("Enter recipient email:");
        if (!recipient) return;
        const body = prompt("Personal message:", "Sent via Drishyamitra AI.");
        if (body === null) return;
        try {
            const res = await fetch(`${baseUrl}/delivery/share/email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_id: photoId, recipient, body })
            });
            const data = await res.json();
            if (data.status === 'success') alert("Email dispatched successfully!");
            else alert(data.message || "Email failed");
        } catch (err) { alert("Network error."); }
    };

    const handlePhotoDelete = async (photoId) => {
        if (!window.confirm("Are you sure you want to permanently delete this photo? This will also remove all associated AI face data and sharing history.")) return;
        try {
            const res = await fetch(`${baseUrl}/photos/${photoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setFolderPhotos(current => current.filter(p => p.id !== photoId));
            } else {
                alert(data.message || "Failed to delete photo");
            }
        } catch (err) { alert("Network error while deleting photo."); }
    };

    const handleFolderWhatsAppShare = async (personId) => {
        const recipient = prompt("Enter phone number for Folder share (all photos):");
        if (!recipient) return;
        const message = prompt("Message for the folder:", `Check out these photos of ${folder?.name}!`);
        if (message === null) return;
        try {
            const res = await fetch(`${baseUrl}/delivery/share/folder/whatsapp`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ person_id: personId, recipient, message })
            });
            const data = await res.json();
            if (data.status === 'success') alert("Bulk WhatsApp delivery queued!");
            else alert(data.message || "Folder sharing failed");
        } catch (err) { alert("Network error."); }
    };

    const handleFolderEmailShare = async (personId) => {
        const recipient = prompt("Enter email for Folder share:");
        if (!recipient) return;
        const body = prompt("Message for the folder:", "Organized photos sent via Drishyamitra.");
        if (body === null) return;
        try {
            const res = await fetch(`${baseUrl}/delivery/share/folder/email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ person_id: personId, recipient, body })
            });
            const data = await res.json();
            if (data.status === 'success') alert("Folder emailed successfully!");
            else alert(data.message || "Folder email failed");
        } catch (err) { alert("Network error."); }
    };

    if (!folder) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <FolderDetails
                folder={folder}
                photos={folderPhotos}
                onBack={() => navigate('/dashboard/folders')}
                onRename={handleRenameFolder}
                onWhatsAppShare={handleFolderWhatsAppShare}
                onEmailShare={handleFolderEmailShare}
                onPhotoWhatsAppShare={handleWhatsAppShare}
                onPhotoEmailShare={handleEmailShare}
                onPhotoDelete={handlePhotoDelete}
            />
        </motion.div>
    );
}