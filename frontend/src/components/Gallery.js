import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Mail, ImageIcon, Trash2 } from 'lucide-react';
export default function Gallery({ photos, onWhatsAppShare, onEmailShare, onPhotoDelete, onPhotoClick }) {
    if (photos.length === 0) {
        return (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-16 text-center shadow-lg">
                <ImageIcon className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg">No photos found. Start by uploading some!</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence>
                {photos.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, delay: i * 0.03 }}
                        className="group relative bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-primary-500/10 transition-all"
                    >
                        {/* Image Container */}
                        <div
                            className="aspect-square w-full overflow-hidden bg-slate-900 relative cursor-pointer"
                            onClick={() => onPhotoClick && onPhotoClick(p)}
                        >
                            <img
                                src={`http://localhost:5000/api/dashboard/media/${p.filename}`}
                                alt={p.filename}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                            {/* Recognized Faces Badges */}
                            {p.faces && p.faces.length > 0 && (
                                <div className="absolute top-2 left-2 flex -space-x-2 z-10 transition-transform duration-300">
                                    {p.faces.slice(0, 3).map((f, idx) => (
                                        <div key={idx} className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-lg overflow-hidden tooltip-trigger" title={f.person_name || 'Unknown'}>
                                            {f.person_name ? f.person_name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    ))}
                                    {p.faces.length > 3 && (
                                        <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                            +{p.faces.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Hover Overlay with Action Buttons */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                                <div className="flex gap-2 w-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300 pointer-events-auto">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onWhatsAppShare(p.id); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-2 rounded-xl text-xs font-semibold shadow-lg transition-colors"
                                    >
                                        <Share2 className="w-3.5 h-3.5" /> WA
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEmailShare(p.id); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white py-2 px-2 rounded-xl text-xs font-semibold shadow-lg transition-colors"
                                    >
                                        <Mail className="w-3.5 h-3.5" /> Email
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onPhotoDelete && onPhotoDelete(p.id); }}
                                        className="flex-none flex items-center justify-center p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition-colors"
                                        title="Delete Photo"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        { }
                        <div className="p-4">
                            <p className="text-sm font-medium text-slate-200 truncate" title={p.filename}>
                                {p.filename.split('_').slice(2).join('_')}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-slate-500">
                                    {new Date(p.upload_date).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </p>
                                <span className="text-[10px] font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-md border border-primary-500/20">
                                    ID: {p.id}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}