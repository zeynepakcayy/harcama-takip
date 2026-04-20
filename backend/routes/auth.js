const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Email, sifre ve isim zorunludur'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Sifre en az 6 karakter olmali'
      });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Bu email zaten kayitli'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at`,
      [email, hashedPassword, full_name]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      status: 'OK',
      message: 'Kayit basarili',
      data: { user, token }
    });

  } catch (error) {
    console.error('Register hatasi:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Kayit sirasinda hata olustu',
      error: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Email ve sifre zorunludur'
      });
    }

    const result = await pool.query(
      'SELECT id, email, password, full_name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Email veya sifre hatali'
      });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Email veya sifre hatali'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    delete user.password;

    res.json({
      status: 'OK',
      message: 'Giris basarili',
      data: { user, token }
    });

  } catch (error) {
    console.error('Login hatasi:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Giris sirasinda hata olustu',
      error: error.message
    });
  }
});

module.exports = router;