const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// LOGIKA REGISTER
exports.register = async (req, res) => {
    const { username, password, nama_lengkap, no_hp, role, alamat_rumah } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (username, password, nama_lengkap, no_hp, role, alamat_rumah, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username',
            [username, hashedPassword, nama_lengkap, no_hp, role, alamat_rumah, 'pending']
        );
        res.status(201).json({ message: "Daftar berhasil, tunggu approval RT", user: newUser.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// LOGIKA LOGIN
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) return res.status(400).json({ message: "User tidak ada" });

        if (user.rows[0].status !== 'active') return res.status(403).json({ message: "Akun belum aktif. Hubungi Pak RT." });

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) return res.status(400).json({ message: "Password salah" });

        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// LOGIKA APPROVAL (Hanya untuk Admin/RT)
exports.approveUser = async (req, res) => {
    const { userId } = req.params; // ID user yang mau di-approve
    const { status } = req.body;   // Isinya 'active' atau 'rejected'

    try {
        await pool.query(
            'UPDATE users SET status = $1 WHERE id = $2',
            [status, userId]
        );
        res.json({ message: `User status berhasil diubah ke ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};