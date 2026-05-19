import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE_URL = 'https://smart-rt-backend.vercel.app/api'; // URL VERCEL KAMU

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State untuk Laporan
  const [foto, setFoto] = useState(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/login`, { username, password });
      const newToken = res.data.token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      alert('Login Berhasil!');
    } catch (err) {
      alert('Login Gagal: ' + (err.response?.data?.message || err.message));
    }
  }

  const handleLapor = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Ambil Lokasi GPS
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      // 2. Bungkus data ke FormData (Karena ada Foto)
      const formData = new FormData();
      formData.append('user_id', 1); // ID Budi tadi
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('deskripsi', deskripsi);
      formData.append('foto', foto);

      try {
        await axios.post(`${BASE_URL}/report`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Laporan Berhasil Terkirim!');
        setDeskripsi('');
        setFoto(null);
      } catch (err) {
        alert('Gagal Lapor: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      alert('Gagal ambil lokasi: ' + err.message);
      setLoading(false);
    });
  }

  if (!token) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Smart RT Login</h2>
        <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} style={styles.input} /><br/>
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={styles.input} /><br/>
        <button onClick={handleLogin} style={styles.button}>Masuk</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>Halo, Warga! 👋</h3>
        <button onClick={() => { localStorage.clear(); setToken(null); }} style={styles.logout}>Keluar</button>
      </div>

      <div style={styles.card}>
        <h4>Lapor Sampah Belum Diangkut</h4>
        <form onSubmit={handleLapor}>
          <label>Ambil Foto Sampah:</label><br/>
          {/* capture="environment" akan otomatis buka kamera belakang di HP */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={(e) => setFoto(e.target.files[0])} 
            required 
            style={{ margin: '10px 0' }}
          /><br/>

          <textarea 
            placeholder="Contoh: Sampah di depan blok A menumpuk" 
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            style={{ ...styles.input, height: '80px' }}
            required
          /><br/>

          <button type="submit" disabled={loading} style={styles.buttonLapor}>
            {loading ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  input: { padding: '10px', width: '100%', maxWidth: '300px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc' },
  button: { padding: '10px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  buttonLapor: { padding: '15px', width: '100%', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
  logout: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' },
  card: { border: '1px solid #ddd', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
}

export default App