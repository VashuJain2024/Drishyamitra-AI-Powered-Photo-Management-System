import React from 'react';
import { X, Calendar, FileType, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';
export default function PhotoModal({ photo, onClose }) {
    if (!photo) return null;
    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };
    return (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 md:p-8">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all z-10 shadow-lg"
            >
                <X className="w-6 h-6" />
            </button>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl border border-slate-700 relative"
            >
                {}
                <div className="w-full md:w-3/4 bg-slate-950 flex items-center justify-center relative p-4 group">
                    <img
                        src={`http://localhost:5000/api/dashboard/media/${photo.filename}`}
                        alt={photo.filename}
                        className="max-w-full max-h-[85vh] object-contain shadow-2xl drop-shadow-2xl"
                    />
                </div>
                {}
                <div className="w-full md:w-1/4 bg-slate-800 flex flex-col p-6 overflow-y-auto border-l border-slate-700/50">
                    <h3 className="text-xl font-bold text-white mb-6">Photo Details</h3>
                    <div className="space-y-6">
                        {/* Meta Data */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <FileType className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-200 break-all">{photo.filename}</p>
                                    <p className="text-xs text-slate-500">Filename</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-200">
                                        {new Date(photo.upload_date).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-500">Upload Date</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <HardDrive className="w-5 h-5 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{formatSize(photo.size)}</p>
                                    <p className="text-xs text-slate-500">Size</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full h-px bg-slate-700/50 my-6" />
                        {/* People in photo */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                                People in this photo
                            </h4>
                            {!photo.faces || photo.faces.length === 0 ? (
                                <p className="text-sm text-slate-500 italic bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                                    No faces detected by AI.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {photo.faces.map((f, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg border border-slate-600">
                                                <span className="text-sm font-bold text-white">
                                                    {f.person_name ? f.person_name.charAt(0).toUpperCase() : '?'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {f.person_name || 'Unknown Person'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {f.person_id ? `ID: ${f.person_id}` : 'Needs Label'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}