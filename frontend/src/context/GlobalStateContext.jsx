import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { photoAPI, faceAPI } from '../api';

const GlobalStateContext = createContext();

export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children, token }) => {
    const [photos, setPhotos] = useState([]);
    const [persons, setPersons] = useState([]);
    const [activeModal, setActiveModal] = useState(null);
    const [globalLoading, setGlobalLoading] = useState(false);

    const fetchPhotos = useCallback(async () => {
        if (!token) return;
        try {
            setGlobalLoading(true);
            const res = await photoAPI.getPhotos();
            if (res.data.status === 'success') {
                setPhotos(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch photos:', error);
        } finally {
            setGlobalLoading(false);
        }
    }, [token]);

    const fetchPersons = useCallback(async () => {
        if (!token) return;
        try {
            const res = await faceAPI.getPersons();
            if (res.data.status === 'success') {
                setPersons(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch persons:', error);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchPhotos();
            fetchPersons();
        } else {
            setPhotos([]);
            setPersons([]);
            setActiveModal(null);
        }
    }, [token, fetchPhotos, fetchPersons]);

    const value = {
        photos,
        setPhotos,
        persons,
        setPersons,
        activeModal,
        setActiveModal,
        globalLoading,
        fetchPhotos,
        fetchPersons,
        token
    };

    return (
        <GlobalStateContext.Provider value={value}>
            {children}
        </GlobalStateContext.Provider>
    );
};
