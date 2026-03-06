import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const GlobalStateContext = createContext();

export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children, token }) => {
    const [photos, setPhotos] = useState([]);
    const [persons, setPersons] = useState([]);
    const [activeModal, setActiveModal] = useState(null);
    const [globalLoading, setGlobalLoading] = useState(false);

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

    const getAxiosConfig = useCallback(() => ({
        headers: { Authorization: `Bearer ${token}` }
    }), [token]);

    const fetchPhotos = useCallback(async () => {
        if (!token) return;
        try {
            setGlobalLoading(true);
            const res = await axios.get(`${baseUrl}/photos/`, getAxiosConfig());
            if (res.data.status === 'success') {
                setPhotos(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch photos:', error);
        } finally {
            setGlobalLoading(false);
        }
    }, [token, baseUrl, getAxiosConfig]);

    const fetchPersons = useCallback(async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${baseUrl}/face/persons`, getAxiosConfig());
            if (res.data.status === 'success') {
                setPersons(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch persons:', error);
        }
    }, [token, baseUrl, getAxiosConfig]);

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
        token,
        baseUrl,
        getAxiosConfig
    };

    return (
        <GlobalStateContext.Provider value={value}>
            {children}
        </GlobalStateContext.Provider>
    );
};
