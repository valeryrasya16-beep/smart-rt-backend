const pool = require('../config/db');
const supabase = require('../config/supabase');
const fs = require('fs');

// 1. Fungsi Warga Lapor Sampah (Upload ke Cloud)
exports.createReport = async (req, res) => {
    const { user_id, latitude, longitude, deskripsi } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "Foto sampah wajib ada!" });
    }

    try {
        const fileContent = fs.readFileSync(file.path);
        const fileName = `${Date.now()}-${file.originalname}`;

        const { data, error } = await supabase.storage
            .from('waste-photos')
            .upload(fileName, fileContent, { contentType: file.mimetype });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from('waste-photos')
            .getPublicUrl(fileName);

        const photo_url = urlData.publicUrl;

        const newReport = await pool.query(
            'INSERT INTO reports (user_id, latitude, longitude, deskripsi, photo_url, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [user_id, latitude, longitude, deskripsi, photo_url, 'pending']
        );

        fs.unlinkSync(file.path); // Hapus file temporary di laptop

        res.status(201).json({
            message: "Laporan berhasil dibuat (Foto tersimpan di Cloud)!",
            report: newReport.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Fungsi Lihat Semua Laporan
exports.getAllReports = async (req, res) => {
    try {
        const reports = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
        res.json(reports.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Fungsi Petugas Lihat Laporan Pending
exports.getPendingReports = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT reports.*, users.nama_lengkap as nama_warga, users.alamat_rumah FROM reports JOIN users ON reports.user_id = users.id WHERE reports.status = $1 ORDER BY reports.created_at ASC',
            ['pending']
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Fungsi Petugas Ambil Tugas
exports.takeReport = async (req, res) => {
    const { reportId } = req.params;
    const { officerId } = req.body;
    try {
        const updatedReport = await pool.query(
            'UPDATE reports SET officer_id = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
            [officerId, 'pickup', reportId]
        );
        res.json({ message: "Tugas diambil!", report: updatedReport.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Fungsi Petugas Selesaikan Tugas & Kasih Poin
exports.completeReport = async (req, res) => {
    const { reportId } = req.params;
    const pointsToGive = 100;
    try {
        await pool.query('BEGIN');
        const reportResult = await pool.query(
            'UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING user_id',
            ['completed', reportId]
        );
        const userId = reportResult.rows[0].user_id;
        await pool.query('UPDATE users SET total_poin = total_poin + $1 WHERE id = $2', [pointsToGive, userId]);
        await pool.query('INSERT INTO point_logs (user_id, report_id, amount, keterangan) VALUES ($1, $2, $3, $4)', [userId, reportId, pointsToGive, 'Laporan sampah selesai diangkut']);
        await pool.query('COMMIT');
        res.json({ message: "Sampah selesai diangkut! Warga dapat 100 poin." });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
};