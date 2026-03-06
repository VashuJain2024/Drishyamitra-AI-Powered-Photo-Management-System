import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Gallery from '../components/Gallery';
import { motion } from 'framer-motion';
import { useGlobalState } from '../context/GlobalStateContext';
import { Search, Filter, SortDesc, Calendar } from 'lucide-react';
import Loader from '../components/Loader';
import { deliveryAPI, photoAPI } from '../api';
import toast from 'react-hot-toast';

export default function GalleryPage() {
    const { waStatus } = useOutletContext();
    const { photos, globalLoading, fetchPhotos, setActiveModal } = useGlobalState();

    const [waQr, setWaQr] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    const fetchWhatsAppQr = useCallback(async () => {
        if (waStatus?.ready) return;
        try {
            const qrRes = await fetch(`http://localhost:3001/qr`);
            const qrData = await qrRes.json();
            if (qrData.success) {
                setWaQr(qrData.qr);
            } else {
                setWaQr(null);
            }
        } catch (e) { }
    }, [waStatus?.ready]);

    useEffect(() => {
        if (!waStatus?.ready) {
            const interval = setInterval(fetchWhatsAppQr, 3000);
            fetchWhatsAppQr();
            return () => clearInterval(interval);
        } else {
            setWaQr(null);
        }
    }, [waStatus?.ready, fetchWhatsAppQr]);

    const handleWhatsAppShare = async (photoId) => {
        const recipient = prompt("Enter phone number (with country code):");
        if (!recipient) return;
        const message = prompt("Optional message:", "Here is your photo from Drishyamitra!");
        if (message === null) return;

        try {
            const res = await deliveryAPI.shareWhatsApp({ photo_id: photoId, recipient, message });
            if (res.data.status === 'success') {
                toast.success("Enqueued for WhatsApp delivery!");
            } else {
                toast.error(res.data.message || "Sharing failed");
            }
        } catch (err) {
            toast.error("Network error during sharing.");
        }
    };

    const handleEmailShare = async (photoId) => {
        const recipient = prompt("Enter recipient email:");
        if (!recipient) return;
        const body = prompt("Personal message:", "Sent via Drishyamitra AI.");
        if (body === null) return;

        try {
            const res = await deliveryAPI.shareEmail({ photo_id: photoId, recipient, body });
            if (res.data.status === 'success') {
                toast.success("Email dispatched successfully!");
            } else {
                toast.error(res.data.message || "Email failed");
            }
        } catch (err) {
            toast.error("Network error during sharing.");
        }
    };

    const handlePhotoDelete = async (photoId) => {
        if (!window.confirm("Are you sure you want to permanently delete this photo? This will also remove all associated AI face data and sharing history.")) return;

        try {
            const res = await photoAPI.delete(photoId);
            if (res.data.status === 'success') {
                toast.success("Photo deleted");
                fetchPhotos();
            } else {
                toast.error(res.data.message || "Failed to delete photo");
            }
        } catch (err) {
            toast.error("Network error while deleting photo.");
        }
    };

    const processedPhotos = useMemo(() => {
        let result = [...photos];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(photo =>
                photo.faces?.some(f => f.person_name && f.person_name.toLowerCase().includes(term))
            );
        }

        if (filterStatus === 'recognized') {
            result = result.filter(photo => photo.faces?.some(f => f.person_id !== null));
        } else if (filterStatus === 'unrecognized') {
            result = result.filter(photo => photo.faces?.some(f => f.person_id === null));
        }

        result.sort((a, b) => {
            const dateA = new Date(a.upload_date).getTime();
            const dateB = new Date(b.upload_date).getTime();
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [photos, searchTerm, filterStatus, sortBy]);

    if (globalLoading && photos.length === 0) {
        return <Loader text="Loading your collection..." />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >

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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Collections</h2>

                <div className="flex flex-wrap items-center gap-3 bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900/50 border border-slate-700 text-sm rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none w-48 transition-all focus:w-64"
                        />
                    </div>

                    <div className="h-6 w-px bg-slate-700/50 mx-1"></div>

                    <button
                        onClick={() => setFilterStatus(prev => prev === 'all' ? 'recognized' : prev === 'recognized' ? 'unrecognized' : 'all')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filterStatus !== 'all' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'bg-slate-900/50 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    >
                        <Filter className="w-4 h-4" />
                        Status: {filterStatus === 'all' ? 'All' : filterStatus === 'recognized' ? 'Recognized' : 'Unknown'}
                    </button>

                    <button
                        onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-slate-900/50 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                        {sortBy === 'newest' ? <SortDesc className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                        {sortBy === 'newest' ? 'Newest' : 'Oldest'}
                    </button>
                </div>
            </div>

            <Gallery
                photos={processedPhotos}
                onWhatsAppShare={handleWhatsAppShare}
                onEmailShare={handleEmailShare}
                onPhotoDelete={handlePhotoDelete}
                onPhotoClick={(photo) => setActiveModal({ type: 'photo', payload: photo })}
            />
        </motion.div>
    );
}
