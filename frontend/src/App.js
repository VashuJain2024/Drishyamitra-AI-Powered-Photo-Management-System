import React, { useState, useEffect } from 'react';
import './App.css';

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
  const [view, setView] = useState(initialToken ? 'dashboard' : 'landing'); // landing, auth, dashboard, chat
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(initialToken);
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState({ photo_count: 0, person_count: 0, history_count: 0 });
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', content: 'Hello! How can I help you manage your photos today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [dashboardView, setDashboardView] = useState('gallery'); // gallery, history
  const [historyData, setHistoryData] = useState([]);
  const [organizing, setOrganizing] = useState(false);
  const [waStatus, setWaStatus] = useState({ ready: false, status: 'Checking...' });
  const [waQr, setWaQr] = useState(null);


  useEffect(() => {
    if (token) {
      fetchPhotos();
      fetchStats();
      fetchHistory();
    }
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchWhatsAppStatus();
    }, 5000);
    fetchWhatsAppStatus();
    return () => clearInterval(interval);
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
      setWaQr(null);
    }
  };

  const handleWaReset = async () => {
    if (!window.confirm("Are you sure you want to reset the WhatsApp connection? This will clear the current session and require a new QR scan.")) return;
    try {
      setWaStatus({ ready: false, status: 'Resetting...' });
      await fetch(`${WA_BASE}/reset`, { method: 'POST' });
      alert("Reset requested. Please wait a few seconds for a new QR code.");
    } catch (err) {
      alert("Reset failed: " + err.message);
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

  const handleOrganize = async () => {
    setOrganizing(true);
    try {
      const res = await fetch(`${API_BASE}/photos/organize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Folder organization has been queued in the background!");
      } else {
        alert(data.message || "Organization failed");
      }
    } catch (err) {
      console.error("Organize error:", err);
      alert("Connection error during folder organization.");
    } finally {
      setOrganizing(false);
    }
  };

  const handleWhatsAppShare = async (photoId) => {
    const recipient = prompt("Enter recipient phone number (with country code, e.g., 919876543210):");
    if (!recipient) return;
    const message = prompt("Enter caption:", "Here is your photo from Drishyamitra!");
    if (message === null) return;

    try {
      const res = await fetch(`${API_BASE}/delivery/share/whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photo_id: photoId, recipient, message })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("WhatsApp message queued successfully!");
        fetchHistory();
      } else {
        alert(data.message || "Sharing failed");
      }
    } catch (err) {
      console.error("WhatsApp share error:", err);
      alert("Connection error during WhatsApp sharing.");
    }
  };

  const handleEmailShare = async (photoId) => {
    const recipient = prompt("Enter recipient email address:");
    if (!recipient) return;
    const body = prompt("Enter custom message:", "Here is your photo from Drishyamitra!");
    if (body === null) return;

    try {
      const res = await fetch(`${API_BASE}/delivery/share/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photo_id: photoId, recipient, body })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("Email sent successfully!");
        fetchHistory();
      } else {
        alert(data.message || "Email sharing failed");
      }
    } catch (err) {
      console.error("Email share error:", err);
      alert("Connection error during Email sharing.");
    }
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    const isMultiple = files.length > 1;

    for (let i = 0; i < files.length; i++) {
      if (isMultiple) {
        formData.append('photos', files[i]);
      } else {
        formData.append('photo', files[i]);
      }
    }

    try {
      const endpoint = isMultiple ? '/photos/bulk_upload' : '/photos/upload';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchPhotos();
        fetchStats();
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Connection error during upload.");
    } finally {
      setUploading(false);
    }
  };

  const [authMode, setAuthMode] = useState('login'); // login, signup
  const [authError, setAuthError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    const fields = e.target;
    const username = fields[0].value;
    const password = authMode === 'login' ? fields[1].value : fields[2].value;
    const email = authMode === 'signup' ? fields[1].value : '';

    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const payload = authMode === 'login' ? { username, password } : { username, email, password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === 'success') {
        if (authMode === 'login') {
          setUser(data.data.user);
          setToken(data.data.access_token);
          document.cookie = `token=${data.data.access_token}; path=/; max-age=86400; SameSite=Lax`;
          setView('dashboard');
        } else {
          alert("Registration successful! Please login.");
          setAuthMode('login');
        }
      } else {
        setAuthError(data.message || `${authMode} failed`);
      }
    } catch (err) {
      console.error(`${authMode} error:`, err);
      setAuthError(`Connection error: ${err.message}. Is the backend running?`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_BASE}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage, history })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(prev => [...prev, { role: 'bot', content: data.data.response }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="App">
      <nav className="navbar animate-fade-in">
        <div className="logo">Drishyamitra<span>AI</span></div>
        <div className="nav-links">
          {token ? (
            <button className="btn-primary" onClick={() => { document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; setToken(null); setView('landing'); }}>Logout</button>
          ) : (
            <button className="btn-primary" onClick={() => setView('auth')}>Login</button>
          )}
        </div>
      </nav>

      <main className="container">
        {view === 'landing' && (
          <section className="hero animate-fade-in">
            <h1 className="hero-title">Intelligent Photo Management <span>Redefined</span></h1>
            <p className="hero-subtitle">Organize, recognize, and interact with your memories using cutting-edge AI.</p>
            <button className="btn-primary btn-large" onClick={() => setView('auth')}>Get Started Free</button>
          </section>
        )}

        {view === 'auth' && (
          <div className="auth-card glass-card animate-fade-in">
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            {authError && <div className="error-msg">{authError}</div>}
            <form onSubmit={handleAuth}>
              <input type="text" placeholder="Username" required />
              {authMode === 'signup' && <input type="email" placeholder="Email" required />}
              <input type="password" placeholder="Password" required />
              <button className="btn-primary w-full" type="submit" disabled={loading}>
                {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Sign Up')}
              </button>
            </form>
            <p className="toggle-auth">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}>
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </span>
            </p>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="dashboard animate-fade-in">
            <div className="stats-row">
              <div className="glass-card stat-box"><h3> {stats.photo_count} </h3> <p>Photos</p></div>
              <div className="glass-card stat-box"><h3> {stats.person_count} </h3> <p>Faces Recognized</p></div>
              <div className="glass-card stat-box"><h3> {stats.history_count} </h3> <p>Events Grouped</p></div>
            </div>

            <div className="glass-card wa-status-box" style={{ padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: waStatus.ready ? '#2ed573' : '#ff4757' }}></div>
                <h4 style={{ margin: 0 }}>WhatsApp Service: {waStatus.status || (waStatus.ready ? 'Connected' : 'Disconnected')}</h4>
              </div>

              {waQr && !waStatus.ready && (
                <div style={{ marginTop: '1.5rem' }}>
                  <p>Scan this QR code to connect WhatsApp:</p>
                  <div className="qr-container" style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '8px' }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(waQr)}`} alt="WhatsApp QR" />
                  </div>
                </div>
              )}
            </div>

            <div className="dashboard-tabs" style={{ display: 'flex', gap: '1rem', margin: '2rem 0', justifyContent: 'center' }}>
              <button
                className={`btn-primary ${dashboardView === 'gallery' ? '' : 'btn-outline'}`}
                onClick={() => setDashboardView('gallery')}
                style={dashboardView !== 'gallery' ? { background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' } : {}}
              >
                Gallery
              </button>
              <button
                className={`btn-primary ${dashboardView === 'history' ? '' : 'btn-outline'}`}
                onClick={() => setDashboardView('history')}
                style={dashboardView !== 'history' ? { background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' } : {}}
              >
                Delivery History
              </button>
            </div>

            {dashboardView === 'gallery' && (
              <div className="gallery-section">
                <div className="section-header">
                  <h2>Your Collection</h2>
                  <div className="action-buttons" style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={handleOrganize} disabled={organizing}>
                      {organizing ? 'Organizing...' : 'Organize Folders'}
                    </button>
                    <div className="upload-btn-wrapper">
                      <button className="btn-primary" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload Photos'}
                      </button>
                      <input type="file" onChange={handleUpload} accept="image/*" disabled={uploading} multiple />
                    </div>
                  </div>
                </div>
                <div className="photo-grid">
                  {photos.length > 0 ? photos.map(p => (
                    <div key={p.id} className="photo-card glass-card">
                      <img
                        src={`${API_BASE}/dashboard/media/${p.filename}`}
                        alt={p.filename}
                        className="photo-img"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=Photo+Error'}
                      />
                      <div className="photo-info">
                        <p className="photo-name">{p.filename.split('_').slice(2).join('_')}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <small>{new Date(p.upload_date).toLocaleDateString()}</small>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              onClick={() => handleWhatsAppShare(p.id)}
                            >
                              Share 📱
                            </button>
                            <button
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.7rem', backgroundColor: '#5865F2' }}
                              onClick={() => handleEmailShare(p.id)}
                            >
                              Share 📧
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state glass-card">
                      <p>No photos yet. Start by uploading some!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {dashboardView === 'history' && (
              <div className="history-section">
                <div className="section-header">
                  <h2>Delivery History</h2>
                </div>
                <div className="history-list glass-card" style={{ padding: '2rem' }}>
                  {historyData && historyData.length > 0 ? (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '1rem' }}>Date</th>
                          <th style={{ padding: '1rem' }}>Action</th>
                          <th style={{ padding: '1rem' }}>Medium</th>
                          <th style={{ padding: '1rem' }}>Recipient</th>
                          <th style={{ padding: '1rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '1rem' }}>{new Date(item.timestamp).toLocaleString()}</td>
                            <td style={{ padding: '1rem' }}>{item.action.replace(/_/g, ' ')}</td>
                            <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{item.details.delivery_medium || '-'}</td>
                            <td style={{ padding: '1rem' }}>{item.details.recipient || '-'}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                backgroundColor: (item.details.status === 'delivered' || item.details.status === 'sent' || item.action.includes('success')) ? 'rgba(46, 213, 115, 0.2)' :
                                  (item.details.status === 'failed' || item.action.includes('failed')) ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 165, 2, 0.2)',
                                color: (item.details.status === 'delivered' || item.details.status === 'sent' || item.action.includes('success')) ? '#2ed573' :
                                  (item.details.status === 'failed' || item.action.includes('failed')) ? '#ff4757' : '#ffa502'
                              }}>
                                {item.details.status === 'delivered' ? 'Success' :
                                  item.details.status === 'pending_whatsapp' ? 'Pending' :
                                    (item.details.status || 'Pending')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-state">
                      <p>No delivery records found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {token && (
        <div className={`chat-widget ${chatOpen ? 'open' : ''}`}>
          <button className="chat-toggle btn-primary" onClick={() => setChatOpen(!chatOpen)}>
            {chatOpen ? '✕' : '💬 Ask AI'}
          </button>
          {chatOpen && (
            <div className="chat-window glass-card animate-fade-in">
              <div className="chat-header">Assistant</div>
              <div className="chat-messages">
                {messages.map((m, idx) => (
                  <div key={idx} className={`msg ${m.role}`}>
                    {m.content}
                  </div>
                ))}
                {chatLoading && <div className="msg bot">...</div>}
              </div>
              <form className="chat-input" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                />
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
