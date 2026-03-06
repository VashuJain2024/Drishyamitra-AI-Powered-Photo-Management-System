import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useGlobalState } from './GlobalStateContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { token, fetchPhotos, fetchPersons } = useGlobalState();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!token) return;

        const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
            newSocket.emit('join', { token });
        });

        newSocket.on('face_processed', (data) => {
            toast.success(data.message, {
                duration: 5000,
                icon: '🤖',
            });

            fetchPhotos();
            fetchPersons();
        });

        newSocket.on('delivery_update', (data) => {
            if (data.status === 'delivered') {
                toast.success(data.message || 'Delivery successful!');
            } else {
                toast.error(data.message || 'Delivery failed');
            }
        });

        newSocket.on('upload_progress', (data) => {

        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, [token, fetchPhotos, fetchPersons]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
