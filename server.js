const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Ensure music folder exists
const musicDir = path.join(__dirname, 'music');
if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, musicDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'audio/mpeg' || file.originalname.endsWith('.mp3')) {
        cb(null, true);
    } else {
        cb(new Error('Only MP3 files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const validUser = process.env.ADMIN_USERNAME || 'Admin';
    const validPass = process.env.ADMIN_PASSWORD || 'CPark@123';

    if (username === validUser && password === validPass) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Verify endpoint
app.get('/api/auth/verify', (req, res) => {
    res.json({ authenticated: true });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true });
});

// Music upload endpoint with proper error handling
app.post('/api/upload-music', (req, res) => {
    upload.single('musicFile')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, error: 'File too large. Max 5MB' });
            }
            return res.status(400).json({ success: false, error: err.message });
        } else if (err) {
            return res.status(400).json({ success: false, error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const fileUrl = `/music/${req.file.filename}`;
        res.setHeader('Content-Type', 'application/json');
        return res.json({
            success: true,
            url: fileUrl,
            filename: req.file.filename
        });
    });
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[v0] Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n🎵 YogaCoach Admin Dashboard`);
    console.log(`📍 http://localhost:${PORT}/admin.html`);
    console.log(`🏠 http://localhost:${PORT}/index.html`);
    console.log(`📁 Music folder: ${musicDir}\n`);
});