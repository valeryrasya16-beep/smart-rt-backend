const express = require('express');
const cors = require('cors');
const multer = require('multer');
const authController = require('./controllers/authController');
const reportController = require('./controllers/reportController');

const app = express();

// Konfigurasi Multer untuk Memory Storage (Wajib buat Vercel)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// --- AUTH ROUTES ---
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);
app.put('/api/approve/:userId', authController.approveUser);

// --- REPORT ROUTES ---
// Warga buat laporan
app.post('/api/report', upload.single('foto'), reportController.createReport);

// Petugas/Admin liat semua laporan
app.get('/api/reports', reportController.getAllReports);

// Petugas liat daftar sampah yang masih pending
app.get('/api/reports/pending', reportController.getPendingReports);

// Petugas ambil tugas
app.put('/api/report/take/:reportId', reportController.takeReport);

// Petugas selesaikan tugas & kasih poin
app.put('/api/report/complete/:reportId', reportController.completeReport);

const PORT = process.env.PORT || 3000;

// Supaya bisa jalan di lokal maupun Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server nyala di port ${PORT}`);
    });
}

module.exports = app;