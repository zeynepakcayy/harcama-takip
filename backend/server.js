// Gerekli paketleri yukle
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Veritabani havuzunu yukle (baglantiyi test eder)
const pool = require('./config/database');

// Express uygulamasini olustur
const app = express();

// Middleware'ler
app.use(cors());
app.use(express.json());

// Test endpoint'i
app.get('/', (req, res) => {
  res.json({
    message: 'Harcama Takip API calisiyor!',
    status: 'OK'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Veritabani baglanti testi endpoint'i
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as simdi, version() as surum');
    res.json({
      status: 'OK',
      message: 'Veritabani baglantisi basarili!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('DB test hatasi:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Veritabanina baglanilamadi',
      error: error.message
    });
  }
});

// Kategorileri listele (DB'den gercek veri!)
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json({
      status: 'OK',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Kategori listeleme hatasi:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Kategoriler getirilemedi',
      error: error.message
    });
  }
});

// Sunucuyu baslat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu http://localhost:${PORT} adresinde calisiyor`);
});