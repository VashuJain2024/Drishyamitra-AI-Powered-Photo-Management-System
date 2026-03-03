import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center relative overflow-hidden">
            {}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-600/30 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px]" />

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 text-center px-6 max-w-4xl"
            >
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 flex items-center justify-center gap-2">
                    Drishyamitra<span className="text-primary-400">AI</span>
                </h1>
                <h2 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
                    Your Memories, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-blue-400">Perfectly</span> Organized.
                </h2>
                <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                    Experience the next generation of photo management with facial recognition and instant AI sharing.
                </p>
                <button
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-semibold py-4 px-10 rounded-full text-lg shadow-lg hover:shadow-primary-500/25 transition-all outline-none focus:ring-4 focus:ring-primary-500/50"
                >
                    Enter the Gallery &rarr;
                </button>
            </motion.section>
        </div>
    );
}
