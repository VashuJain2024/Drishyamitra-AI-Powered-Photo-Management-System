import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import GalleryPage from './pages/GalleryPage';
import FoldersPage from './pages/FoldersPage';
import FolderDetailsPage from './pages/FolderDetailsPage';
import HistoryPage from './pages/HistoryPage';
import StatsPage from './pages/StatsPage';
import { GlobalStateProvider } from './context/GlobalStateContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const baseUrl = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [organizing, setOrganizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };
  const handleOrganize = async () => {
    setOrganizing(true);
    try {
      const res = await fetch(`${baseUrl}/photos/organize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Magic organization in progress! I'm grouping your photos by person.");
      } else alert(data.message || "Organization failed");
    } catch (err) {
      alert("Connection error during folder organization.");
    } finally {
      setOrganizing(false);
    }
  };
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    const isBulk = files.length > 1;
    for (let i = 0; i < files.length; i++) {
      formData.append(isBulk ? 'photos' : 'photo', files[i]);
    }
    try {
      const res = await fetch(`${baseUrl}/photos/${isBulk ? 'bulk_upload' : 'upload'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Upload completed successfully!");
      }
    } catch (err) { alert("Upload failed"); }
    finally { setUploading(false); }
  };
  return (
    <GlobalStateProvider token={token}>
      <Toaster position="top-right" reverseOrder={false} />
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/auth" element={token ? <Navigate to="/dashboard" /> : <AuthPage onLoginComplete={setToken} />} />
            <Route path="/dashboard" element={
              <DashboardLayout
                token={token}
                onLogout={handleLogout}
                organizing={organizing}
                onOrganize={handleOrganize}
                uploading={uploading}
                onUpload={handleUpload}
              />
            }>
              <Route index element={<GalleryPage />} />
              <Route path="folders" element={<FoldersPage />} />
              <Route path="folders/:id" element={<FolderDetailsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="stats" element={<StatsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </GlobalStateProvider>
  );
}
export default App;