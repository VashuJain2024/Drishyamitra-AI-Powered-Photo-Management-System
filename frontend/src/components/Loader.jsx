import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function Loader({ size = 'medium', text = 'Loading...', fullScreen = false }) {
    const sizes = {
        small: 'w-5 h-5',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    const loaderContent = (
        <div className="flex flex-col items-center justify-center space-y-4">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
                <Loader2 className={`${sizes[size]} text-primary-500`} />
            </motion.div>
            {text && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-slate-400 font-medium tracking-wide animate-pulse"
                >
                    {text}
                </motion.p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                {loaderContent}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8 w-full h-full min-h-[200px]">
            {loaderContent}
        </div>
    );
}
