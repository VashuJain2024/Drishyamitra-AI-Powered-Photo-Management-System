import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, User, Check, Loader2 } from 'lucide-react';
import { useGlobalState } from '../context/GlobalStateContext';
import { faceAPI, API_URL } from '../api';
import toast from 'react-hot-toast';
export default function FaceLabelingModal({ photo, onClose, onComplete }) {
    const { fetchPersons } = useGlobalState();
    const [faces, setFaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [personName, setPersonName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const imgRef = useRef(null);
    const [imgRenderSize, setImgRenderSize] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
    const fetchFaces = useCallback(async () => {
        try {
            const res = await faceAPI.getFacesByPhoto(photo.id);
            if (res.data.status === 'success') {
                if (res.data.data.length > 0) {
                    setFaces(res.data.data);
                    setLoading(false);
                } else {
                    setTimeout(fetchFaces, 2000);
                }
            }
        } catch (err) {
            console.error("Failed to fetch faces", err);
            setLoading(false);
        }
    }, [photo.id]);
    useEffect(() => {
        fetchFaces();
    }, [fetchFaces]);
    const unlabeledFaces = faces.filter(f => f.person_id === null);
    const handleImageLoad = (e) => {
        setImgRenderSize({
            width: e.target.width,
            height: e.target.height,
            naturalWidth: e.target.naturalWidth,
            naturalHeight: e.target.naturalHeight
        });
    };
    const handleLabelFace = async () => {
        if (!personName.trim() || submitting) return;
        setSubmitting(true);
        const currentFace = unlabeledFaces[currentFaceIndex];
        try {
            const res = await faceAPI.labelFace({
                photo_id: photo.id,
                face_id: currentFace.id,
                person_name: personName.trim()
            });
            if (res.data.status === 'success') {
                toast.success(`Labeled as ${personName.trim()}`);
                setPersonName('');
                await fetchPersons();
                if (currentFaceIndex + 1 < unlabeledFaces.length) {
                    setCurrentFaceIndex(currentFaceIndex + 1);
                } else {
                    onComplete();
                }
            }
        } catch (err) {
            toast.error("Failed to label face");
        } finally {
            setSubmitting(false);
        }
    };
    const getBoundingBoxStyle = (face) => {
        if (!face.bounding_box || !imgRenderSize.naturalWidth) return { display: 'none' };
        const [x1, y1, x2, y2] = face.bounding_box;
        const scaleX = imgRenderSize.width / imgRenderSize.naturalWidth;
        const scaleY = imgRenderSize.height / imgRenderSize.naturalHeight;
        return {
            left: `${x1 * scaleX}px`,
            top: `${y1 * scaleY}px`,
            width: `${(x2 - x1) * scaleX}px`,
            height: `${(y2 - y1) * scaleY}px`
        };
    };
    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl border border-slate-700">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Analyzing Faces...</h3>
                    <p className="text-slate-400 text-sm">Our AI is detecting faces in this photo.</p>
                </div>
            </div>
        );
    }
    if (unlabeledFaces.length === 0) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl border border-slate-700">
                    <Check className="w-12 h-12 text-emerald-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No New Faces Found</h3>
                    <p className="text-slate-400 text-sm mb-6 text-center">
                        All faces in this photo are already known or no faces were detected.
                    </p>
                    <button onClick={onComplete} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
                        Close
                    </button>
                </div>
            </div>
        );
    }
    const currentFace = unlabeledFaces[currentFaceIndex];
    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-3xl w-full max-w-4xl flex overflow-hidden shadow-2xl border border-slate-700">
                {/* Image Section */}
                <div className="w-2/3 bg-slate-950 flex items-center justify-center relative p-8">
                    <div className="relative inline-block">
                        <img
                            ref={imgRef}
                            src={`${API_URL}/dashboard/media/${photo.filename}`}
                            alt="Uploaded"
                            className="max-h-[70vh] object-contain rounded-lg shadow-xl"
                            onLoad={handleImageLoad}
                        />
                        {/* Draw box for current face */}
                        <div
                            className="absolute border-4 border-warning shadow-[0_0_15px_rgba(251,191,36,0.5)] rounded-lg transition-all duration-300 pointer-events-none"
                            style={getBoundingBoxStyle(currentFace)}
                        />
                    </div>
                </div>
                {/* Form Section */}
                <div className="w-1/3 p-8 flex flex-col justify-center bg-slate-800 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700 transition">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="mb-2 text-xs font-semibold tracking-wider text-warning uppercase">
                        Face {currentFaceIndex + 1} of {unlabeledFaces.length}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Who is this?</h3>
                    <p className="text-sm text-slate-400 mb-8">
                        Label this person so we can automatically group their photos in the future.
                    </p>
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-500" />
                            </div>
                            <input
                                type="text"
                                value={personName}
                                onChange={(e) => setPersonName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLabelFace()}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl leading-5 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all shadow-inner"
                                placeholder="Enter person's name..."
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleLabelFace}
                            disabled={!personName.trim() || submitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-slate-900 bg-warning hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warning focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? 'Saving...' : 'Save Label'}
                        </button>
                    </div>
                    <div className="mt-8 flex justify-center gap-2">
                        {unlabeledFaces.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all ${idx === currentFaceIndex ? 'w-6 bg-warning' : 'w-2 bg-slate-600'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}