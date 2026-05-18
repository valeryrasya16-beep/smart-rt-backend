const express = require('express');
const cors = require('cors');
const multer = require('multer'); // Tambahkan ini
const authController = require('./controllers/authController');
const reportController = require('./controllers/reportController'); // Tambahkan ini

const app = express();
const upload = multer({ dest: 'uploads/' }); // Folder sementara simpan foto

app.use(cors());
app.use(express.json());

// --- AUTH ROUTES ---
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);
app.put('/api/approve/:userId', authController.approveUser);

// --- REPORT ROUTES ---
// upload.single('foto') artinya kita ngirim 1 file dengan nama field 'foto'
app.post('/api/report', upload.single('foto'), reportController.createReport);
app.get('/api/reports', reportController.getAllReports);
// ... route report yang lama ...
app.post('/api/report', upload.single('foto'), reportController.createReport);
app.get('/api/reports', reportController.getAllReports);

// TAMBAHKAN INI (Route untuk Petugas)
app.get('/api/reports/pending', reportController.getPendingReports); // Petugas liat daftar sampah
app.put('/api/report/take/:reportId', reportController.takeReport); // Petugas ambil tugas

// Tambahkan di bawah route report lainnya
app.put('/api/report/complete/:reportId', reportController.completeReport);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server nyala di port ${PORT}`);
});