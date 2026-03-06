import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Mail, Edit3, ArrowLeft } from 'lucide-react';
import Gallery from './Gallery';
export default function FolderDetails({
    folder,
    photos,
    onBack,
    onRename,
    onWhatsAppShare,
    onEmailShare,
    onPhotoWhatsAppShare,
    onPhotoEmailShare,
    onPhotoDelete
}) {
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
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-slate-800/40 border border-slate-700 p-8 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="flex flex-col gap-6 z-10 w-full md:w-auto">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700 transition-colors w-max"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Folders
                    </button>
                    <div className="flex flex-col gap-2">
                        <AnimatePresence mode="wait">
                            {isEditing ? (
                                <motion.form
                                    key="editing"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    onSubmit={handleRenameSubmit}
                                    className="flex items-center gap-3"
                                >
                                    <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                        className="text-3xl font-extrabold bg-slate-900/50 border border-primary-500 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-full md:w-80 transition-all"
                                    />
                                    <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white font-medium px-5 py-2.5 rounded-xl transition-colors">
                                        Save
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-5 py-2.5 rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="viewing"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex flex-wrap items-center gap-4"
                                >
                                    <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight flex items-center gap-4">
                                        {folder.name}
                                        <span className="text-xs font-bold uppercase tracking-widest text-primary-400 bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">
                                            Collection
                                        </span>
                                    </h2>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-slate-400 hover:text-primary-400 p-2 rounded-xl hover:bg-slate-800 transition-all"
                                        title="Rename Folder"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <p className="text-lg text-slate-400 font-medium">
                            {photos.length} memories captured in this folder
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 z-10 w-full md:w-auto">
                    <button
                        onClick={() => onWhatsAppShare(folder.id)}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all outline-none focus:ring-4 focus:ring-emerald-500/30"
                    >
                        <Share2 className="w-5 h-5" />
                        Bulk WhatsApp
                    </button>
                    <button
                        onClick={() => onEmailShare(folder.id)}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all outline-none focus:ring-4 focus:ring-blue-500/30"
                    >
                        <Mail className="w-5 h-5" />
                        Bulk Email
                    </button>
                </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700 p-6 md:p-10 rounded-3xl shadow-xl">
                <Gallery
                    photos={photos}
                    onWhatsAppShare={onPhotoWhatsAppShare}
                    onEmailShare={onPhotoEmailShare}
                    onPhotoDelete={onPhotoDelete}
                />
            </div>
        </div>
    );
}