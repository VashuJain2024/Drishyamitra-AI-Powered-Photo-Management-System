import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authAPI = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (data) => api.post('/auth/register', data),
    refresh: () => api.post('/auth/refresh'),
};

export const chatAPI = {
    sendMessage: (message, history) => api.post('/chat/', { message, history }),
};

export const photoAPI = {
    upload: (formData, onProgress) => api.post('/photos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        },
    }),
    bulkUpload: (formData, onProgress) => api.post('/photos/bulk_upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
            if (onProgress) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        },
    }),
    delete: (id) => api.delete(`/photos/${id}`),
    getPhotos: () => api.get('/photos/'),
};

export const deliveryAPI = {
    shareWhatsApp: (data) => api.post('/delivery/share/whatsapp', data),
    shareEmail: (data) => api.post('/delivery/share/email', data),
};

export const faceAPI = {
    getFacesByPhoto: (photoId) => api.get(`/face/photo/${photoId}`),
    labelFace: (data) => api.post('/face/label', data),
    getPersons: () => api.get('/face/persons'),
};

export default api;
