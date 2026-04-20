const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/database');
const authRoutes = require('./routes/auth');
const expensesRoutes = require('./routes/expenses');

const app = express();

// Middleware'ler
app.use(cors());
app.use(express.json());

// ============================================
// Ana sayfa - API hakkinda bilgi
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'Harcama Takip API calisiyor!',
    status: 'OK',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      categories: 'GET /api/categories',
      expenses: {
        list: 'GET /api/expenses',
        create: 'POST /api/expenses',
        summary: 'GET /api/expenses/summary',
        byCategory: 'GET /api/expenses/by-category',
        delete: 'DELETE /api/expenses/:id'
      }
    }
  });
});

// ============================================
// Health check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// ============================================
// DB baglanti testi
// ============================================
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as simdi');
    res.json({ status: 'OK', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// ============================================
// Kategorileri listele (herkes erisebilir)
// ============================================
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json({ 
      status: 'OK', 
      count: result.rows.length, 
      data: result.rows 
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: error.message });
  }
});

// ============================================
// Route'lar
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expensesRoutes);

// ============================================
// Sunucuyu baslat
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Sunucu http://localhost:${PORT} adresinde calisiyor`);
});