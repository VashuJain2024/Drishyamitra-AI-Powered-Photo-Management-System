import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import Sidebar from './components/Sidebar';
import StatsCard from './components/StatsCard';
import Gallery from './components/Gallery';
import HistoryTable from './components/HistoryTable';
import ChatAssistant from './components/ChatAssistant';
import FolderList from './components/FolderList';
import FolderDetails from './components/FolderDetails';

let API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
if (!API_BASE.endsWith('/api')) {
  API_BASE = `${API_BASE}/api`;
}

const WA_BASE = 'http://localhost:3001';

function App() {
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const initialToken = getCookie('token');
  const [view, setView] = useState(initialToken ? 'dashboard' : 'landing');
  const [dashboardView, setDashboardView] = useState('gallery');
  const [token, setToken] = useState(initialToken);
  const [photos, setPhotos] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderPhotos, setFolderPhotos] = useState([]);
  const [stats, setStats] = useState({ photo_count: 0, person_count: 0, history_count: 0 });
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', content: 'Hello! I am Drishyamitra AI. How can I help you manage your photos today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [waStatus, setWaStatus] = useState({ ready: false, status: 'Checking...' });
  const [waQr, setWaQr] = useState(null);
  const [organizing, setOrganizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (token) {
      if (dashboardView === 'gallery') fetchPhotos();
      if (dashboardView === 'folders') fetchFolders();
      if (dashboardView === 'history') fetchHistory();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dashboardView]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWhatsAppStatus();
    }, 5000);
    fetchWhatsAppStatus();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch(`${WA_BASE}/status`);
      const data = await res.json();
      setWaStatus({ ready: data.ready, status: data.status });

      if (!data.ready) {
        const qrRes = await fetch(`${WA_BASE}/qr`);
        const qrData = await qrRes.json();
        if (qrData.success) setWaQr(qrData.qr);
        else setWaQr(null);
      } else {
        setWaQr(null);
      }
    } catch (err) {
      setWaStatus({ ready: false, status: 'Offline' });
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`${API_BASE}/photos/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') setPhotos(data.data);
    } catch (err) { console.error("Fetch photos failed", err); }
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') setFolders(data.data);
    } catch (err) { console.error("Fetch folders failed", err); }
  };

  const fetchFolderPhotos = async (personId) => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/folders/${personId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') setFolderPhotos(data.data);
    } catch (err) { console.error("Fetch folder photos failed", err); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') setStats(data.data);
    } catch (err) { console.error("Fetch stats failed", err); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') setHistoryData(data.data.history);
    } catch (err) { console.error("Fetch history failed", err); }
  };

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setToken(null);
    setView('landing');
  };

  const handleOrganize = async () => {
    setOrganizing(true);
    try {
      const res = await fetch(`${API_BASE}/photos/organize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Magic organization in progress! I'm grouping your photos by person.");
        setTimeout(fetchFolders, 3000);
      }
      else alert(data.message || "Organization failed");
    } catch (err) {
      alert("Connection error during folder organization.");
    } finally {
      setOrganizing(false);
    }
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setDashboardView('folder-details');
    fetchFolderPhotos(folder.id);
  };

  const handleRenameFolder = async (personId, newName) => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/folders/${personId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setFolders(prev => prev.map(f => f.id === personId ? { ...f, name: newName } : f));
        if (selectedFolder?.id === personId) {
          setSelectedFolder(prev => ({ ...prev, name: newName }));
        }
        fetchHistory();
      } else alert(data.message || "Rename failed");
    } catch (err) { alert("Network error"); }
  };

  const handleWhatsAppShare = async (photoId) => {
    const recipient = prompt("Enter phone number (with country code):");
    if (!recipient) return;
    const message = prompt("Optional message:", "Here is your photo from Drishyamitra!");
    if (message === null) return;

    try {
      const res = await fetch(`${API_BASE}/delivery/share/whatsapp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId, recipient, message })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Enqueued for WhatsApp delivery!");
        fetchHistory();
      } else alert(data.message || "Sharing failed");
    } catch (err) { alert("Network error."); }
  };

  const handleEmailShare = async (photoId) => {
    const recipient = prompt("Enter recipient email:");
    if (!recipient) return;
    const body = prompt("Personal message:", "Sent via Drishyamitra AI.");
    if (body === null) return;

    try {
      const res = await fetch(`${API_BASE}/delivery/share/email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId, recipient, body })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Email dispatched successfully!");
        fetchHistory();
      } else alert(data.message || "Email failed");
    } catch (err) { alert("Network error."); }
  };

  const handleFolderWhatsAppShare = async (personId) => {
    const recipient = prompt("Enter phone number for Folder share (all photos):");
    if (!recipient) return;
    const message = prompt("Message for the folder:", `Check out these photos of ${selectedFolder?.name}!`);
    if (message === null) return;

    try {
      const res = await fetch(`${API_BASE}/delivery/share/folder/whatsapp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: personId, recipient, message })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Bulk WhatsApp delivery queued!");
        fetchHistory();
      } else alert(data.message || "Folder sharing failed");
    } catch (err) { alert("Network error."); }
  };

  const handleFolderEmailShare = async (personId) => {
    const recipient = prompt("Enter email for Folder share:");
    if (!recipient) return;
    const body = prompt("Message for the folder:", "Organized photos sent via Drishyamitra.");
    if (body === null) return;

    try {
      const res = await fetch(`${API_BASE}/delivery/share/folder/email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: personId, recipient, body })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Folder emailed successfully!");
        fetchHistory();
      } else alert(data.message || "Folder email failed");
    } catch (err) { alert("Network error."); }
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
      const res = await fetch(`${API_BASE}/photos/${isBulk ? 'bulk_upload' : 'upload'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if ((await res.json()).status === 'success') {
        fetchPhotos();
        fetchStats();
      }
    } catch (err) { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleAuth = async (e, mode) => {
    e.preventDefault();
    setLoading(true);
    const fields = e.target;
    const username = fields[0].value;
    const password = mode === 'login' ? fields[1].value : fields[2].value;
    const payload = mode === 'login' ? { username, password } : { username, password, email: fields[1].value };

    try {
      const res = await fetch(`${API_BASE}/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (mode === 'login') {
          setToken(data.data.access_token);
          document.cookie = `token=${data.data.access_token}; path=/; max-age=86400; SameSite=Lax`;
          setView('dashboard');
        } else alert("Account created! Please sign in.");
      } else alert(data.message);
    } catch (err) { alert("Auth error"); }
    finally { setLoading(false); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages })
      });
      const data = await res.json();
      if (data.status === 'success') setMessages(prev => [...prev, { role: 'bot', content: data.data.response }]);
    } catch (err) { console.error(err); }
    finally { setChatLoading(false); }
  };

  return (
    <div className="App">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      {view === 'landing' && (
        <div className="main-content" style={{ marginLeft: 0 }}>
          <section className="landing-page animate-fade-in">
            <h1 className="sidebar-logo" style={{ fontSize: '3rem', justifyContent: 'center' }}>Drishyamitra<span>AI</span></h1>
            <h2 className="hero-title" style={{ fontSize: '4.2rem', marginTop: '2rem', lineHeight: '1.2' }}>Your Memories, <br /><span>Perfectly</span> Organized.</h2>
            <p className="hero-subtitle">Experience the next generation of photo management with facial recognition and instant AI sharing.</p>
            <button className="btn-primary" style={{ padding: '1.5rem 3rem', fontSize: '1.2rem', borderRadius: '20px' }} onClick={() => setView('auth')}>Enter the Gallery →</button>
          </section>
        </div>
      )}

      {view === 'auth' && (
        <div className="main-content" style={{ marginLeft: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="glass-card animate-fade-in" style={{ padding: '4rem', width: '100%', maxWidth: '450px' }}>
            <h2 style={{ marginBottom: '2.5rem', textAlign: 'center', fontSize: '2rem' }}>Welcome Back</h2>
            <form onSubmit={(e) => handleAuth(e, 'login')}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Username</label>
                <input type="text" placeholder="e.g. jdoe" required />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Password</label>
                <input type="password" placeholder="••••••••" required />
              </div>
              <button className="btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Secure Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {view === 'dashboard' && (
        <>
          <Sidebar currentView={dashboardView} setView={setDashboardView} onLogout={handleLogout} waStatus={waStatus} />

          <main className="main-content">
            <header className="navbar animate-fade-in">
              <div style={{ display: 'flex', gap: '1.2rem' }}>
                <button className="btn-primary" onClick={handleOrganize} disabled={organizing} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', boxShadow: 'none' }}>
                  {organizing ? 'Organizing...' : '⚡ Organize AI'}
                </button>
                <div style={{ position: 'relative' }}>
                  <button className="btn-primary" disabled={uploading}>
                    {uploading ? 'Uploading...' : '󰀻 Add Photos'}
                    <input type="file" multiple onChange={handleUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                  </button>
                </div>
              </div>
            </header>

            {dashboardView === 'stats' && (
              <div className="animate-fade-in">
                <h2 style={{ marginBottom: '2.5rem' }}>System Analytics</h2>
                <div className="stats-grid">
                  <StatsCard label="Total Photos" value={`${stats.photo_count}`} />
                  <StatsCard label="Faces Recognized" value={stats.person_count} />
                  <StatsCard label="Total Shares" value={stats.history_count} />
                </div>

                <div className="glass-card" style={{ marginTop: '2rem', padding: '3rem', textAlign: 'center' }}>
                  <h3 style={{ color: 'var(--text-dim)' }}>Activity trends coming soon...</h3>
                </div>
              </div>
            )}

            {dashboardView === 'gallery' && (
              <div className="animate-fade-in">
                <div className="gallery-controls">
                  <h2 style={{ fontSize: '2.2rem' }}>Collections</h2>
                </div>
                <Gallery photos={photos} onWhatsAppShare={handleWhatsAppShare} onEmailShare={handleEmailShare} />
              </div>
            )}

            {dashboardView === 'folders' && (
              <div className="animate-fade-in">
                <h2 style={{ marginBottom: '2.5rem', fontSize: '2.2rem' }}>Your Folders</h2>
                <FolderList folders={folders} onFolderClick={handleFolderClick} />
              </div>
            )}

            {dashboardView === 'folder-details' && selectedFolder && (
              <FolderDetails
                folder={selectedFolder}
                photos={folderPhotos}
                onBack={() => setDashboardView('folders')}
                onRename={handleRenameFolder}
                onWhatsAppShare={handleFolderWhatsAppShare}
                onEmailShare={handleFolderEmailShare}
                onPhotoWhatsAppShare={handleWhatsAppShare}
                onPhotoEmailShare={handleEmailShare}
              />
            )}

            {dashboardView === 'history' && (
              <div className="animate-fade-in">
                <h2 style={{ marginBottom: '2.5rem', fontSize: '2.2rem' }}>Delivery History</h2>
                <HistoryTable data={historyData} />
              </div>
            )}

            {waQr && dashboardView === 'gallery' && (
              <div className="glass-card animate-fade-in" style={{ marginTop: '3rem', padding: '3rem', textAlign: 'center', border: '1px solid var(--warning)' }}>
                <h3>Link Your Mobile</h3>
                <p style={{ color: 'var(--text-dim)', margin: '1.5rem 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Scan this secure QR code with WhatsApp to enable instant mobile sharing across all your devices.
                </p>
                <div style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waQr)}`} alt="QR" style={{ display: 'block' }} />
                </div>
              </div>
            )}
          </main>

          <ChatAssistant
            messages={messages}
            isOpen={chatOpen}
            onToggle={() => setChatOpen(!chatOpen)}
            input={chatInput}
            onInputChange={setChatInput}
            onSendMessage={handleSendMessage}
            loading={chatLoading}
          />
        </>
      )}
    </div>
  );
}

export default App;
