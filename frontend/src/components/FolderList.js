import React from 'react';
import { motion } from 'framer-motion';
import { FolderHeart } from 'lucide-react';

export default function FolderList({ folders, onFolderClick }) {
    if (folders.length === 0) {
        return (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-16 text-center shadow-lg">
                <FolderHeart className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 text-lg">No folders yet. Try organizing your photos!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {folders.map((folder, i) => (
                <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onFolderClick(folder)}
                    className="bg-slate-800/60 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 cursor-pointer shadow-lg hover:border-primary-500/50 hover:shadow-primary-500/20 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors" />

                    <div className="bg-slate-700/50 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FolderHeart className="w-10 h-10 text-primary-400" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 truncate">{folder.name}</h3>
                    <p className="text-sm text-slate-400 font-medium">
                        {folder.photo_count} {folder.photo_count === 1 ? 'Photo' : 'Photos'}
                    </p>
                </motion.div>
            ))}
        </div>
    );
}
