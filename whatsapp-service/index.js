const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup multer for handling form-data and retaining uploaded files temporarily
const upload = multer({ dest: 'uploads/' });

let qrCode = null;
let isReady = false;
let clientStatus = 'Initializing...';

// Create a new WhatsApp client with LocalAuth to persist session across restarts
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Use new headless mode
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
        ]
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

// Generate QR Code for authentication
client.on('qr', (qr) => {
    qrCode = qr;
    clientStatus = 'Waiting for Scan';
    console.log('\n======================================================');
    console.log('   SCAN THIS QR CODE TO AUTHENTICATE WHATSAPP');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
});

// Client is ready and authenticated
client.on('ready', () => {
    isReady = true;
    qrCode = null;
    clientStatus = 'Connected';
    console.log('WhatsApp Client is READY! You can now send messages and photos.');
});

client.on('authenticated', () => {
    clientStatus = 'Authenticated';
    console.log('Authentication Successful.');
});

client.on('auth_failure', () => {
    console.error('Authentication Failed. Please delete the .wwebjs_auth folder and try scanning again.');
    isReady = false;
    clientStatus = 'Auth Failed';
});

client.on('disconnected', (reason) => {
    console.warn('Client was disconnected', reason);
    isReady = false;
    clientStatus = 'Disconnected';
    // Attempt to restart
    client.initialize();
});

// Endpoint to send simple text messages
app.post('/send-message', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ success: false, error: 'WhatsApp client is not ready yet. Please authenticate.' });
    }

    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ success: false, error: 'number and message are required in the JSON body.' });
    }

    try {
        const msg = await client.sendMessage(number, message);
        return res.json({ success: true, messageId: msg.id.id });
    } catch (err) {
        console.error('Failed to send message:', err);
        return res.status(500).json({ success: false, error: err.toString() });
    }
});

// Endpoint to send media (photos)
app.post('/send-media', upload.single('file'), async (req, res) => {
    if (!isReady) {
        if (req.file) fs.unlinkSync(req.file.path); // cleanup
        return res.status(503).json({ success: false, error: 'WhatsApp client is not ready yet. Please authenticate.' });
    }

    const { number, caption } = req.body;

    if (!number || !req.file) {
        if (req.file) fs.unlinkSync(req.file.path); // cleanup
        return res.status(400).json({ success: false, error: 'number and file (multipart form data) are required.' });
    }

    try {
        // Read file and convert to MessageMedia with proper mimetype and filename
        const fileData = fs.readFileSync(req.file.path).toString('base64');
        const media = new MessageMedia(req.file.mimetype, fileData, req.file.originalname || 'image.jpg');

        // Let's preserve the original filename or mime type if needed, but fromFilePath tries to infer.
        // It's mostly reliable.

        // Send media
        const msg = await client.sendMessage(number, media, { caption: caption || '' });

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        return res.json({ success: true, messageId: msg.id.id });
    } catch (err) {
        console.error('Failed to send media:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ success: false, error: err.toString() });
    }
});

app.get('/qr', (req, res) => {
    if (qrCode) {
        res.json({ success: true, qr: qrCode });
    } else {
        res.json({ success: false, message: 'QR Code not available or already authenticated.' });
    }
});

app.get('/status', (req, res) => {
    res.json({
        success: true,
        ready: isReady,
        status: clientStatus,
        message: isReady ? 'WhatsApp Service is Online' : `Status: ${clientStatus}`
    });
});

app.post('/reset', async (req, res) => {
    console.log('Manual Reset Requested...');
    try {
        isReady = false;
        qrCode = null;
        clientStatus = 'Resetting...';

        // Attempt to destroy client if it exists
        try {
            await client.destroy();
        } catch (e) {
            console.log('Client already destroyed or not initialized');
        }

        // Clean auth folder to force fresh scan
        const authPath = './.wwebjs_auth';
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true });
            console.log('Cleared .wwebjs_auth folder');
        }

        // Re-initialize
        console.log('Re-initializing Client...');
        client.initialize();

        res.json({ success: true, message: 'WhatsApp Client Reset Started' });
    } catch (err) {
        console.error('Reset failed:', err);
        res.status(500).json({ success: false, error: err.toString() });
    }
});

// Start Express server and initialize WhatsApp WebJS
app.listen(port, () => {
    console.log(`WhatsApp API Microservice listening on port ${port}`);
    console.log('Initializing WhatsApp Client...');
    client.initialize();
});
