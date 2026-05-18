const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Koneksi ke Postgres Supabase Berhasil!');
});

module.exports = pool;