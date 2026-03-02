# Drishyamitra - Quick Start Guide

To restart the complete project, open 5 separate terminal windows and run these commands:

### 1. Redis Server (Root)
```powershell
.\redis\redis-server.exe
```

### 2. Backend API
```powershell
cd backend
python app.py
```

### 3. Celery Worker
```powershell
cd backend
celery -A celery_app.celery worker --loglevel=info -P solo
```

### 4. WhatsApp Bridge
```powershell
cd whatsapp-service
npm start
```

### 5. Frontend
```powershell
cd frontend
npm start
```

---

### Accessing the App
1.  Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2.  Login to your dashboard.
3.  You will see a **WhatsApp Connection** section. Scan the QR code shown there using your phone!
