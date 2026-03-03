import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Gallery from '../components/Gallery';
import { motion } from 'framer-motion';

export default function GalleryPage() {
    const { token, waStatus } = useOutletContext();
    const [photos, setPhotos] = useState([]);
    const [waQr, setWaQr] = useState(null);

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

    useEffect(() => {
        fetchPhotos();

    }, [token]);

    useEffect(() => {
        if (!waStatus?.ready) {
            const interval = setInterval(fetchWhatsAppQr, 3000);
            fetchWhatsAppQr();
            return () => clearInterval(interval);
        } else {
            setWaQr(null);
        }

    }, [waStatus?.ready]);

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`${baseUrl}/photos/`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.status === 'success') setPhotos(data.data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchWhatsAppQr = async () => {
        if (waStatus?.ready) return;
        try {
            const qrRes = await fetch(`http://localhost:3001/qr`);
            const qrData = await qrRes.json();
            if (qrData.success) {
                setWaQr(qrData.qr);
            } else {
                setWaQr(null);
            }
        } catch (e) {

        }
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
            if (data.status === 'success') {
                alert("Enqueued for WhatsApp delivery!");
            } else alert(data.message || "Sharing failed");
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
            if (data.status === 'success') {
                alert("Email dispatched successfully!");
            } else alert(data.message || "Email failed");
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

                setPhotos(current => current.filter(p => p.id !== photoId));
            } else {
                alert(data.message || "Failed to delete photo");
            }
        } catch (err) { alert("Network error while deleting photo."); }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
            </div>

            <Gallery
                photos={photos}
                onWhatsAppShare={handleWhatsAppShare}
                onEmailShare={handleEmailShare}
                onPhotoDelete={handlePhotoDelete}
            />

            {waQr && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-800/80 backdrop-blur-xl border border-warning/50 p-10 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden mt-12"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-warning/10 rounded-full blur-[80px]" />
                    <h3 className="text-2xl font-bold text-white mb-4">Link Your Mobile</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Scan this secure QR code with WhatsApp to enable instant mobile sharing across all your devices.
                    </p>
                    <div className="bg-white p-6 inline-block rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waQr)}`}
                            alt="QR Code"
                            className="block rounded-lg"
                        />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
