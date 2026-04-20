const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Bu router'daki TUM endpoint'ler icin token zorunlu
router.use(authMiddleware);

// ============================================
// POST /api/expenses - Yeni harcama ekle
// ============================================
router.post('/', async (req, res) => {
  try {
    const { category_id, amount, description, expense_date } = req.body;
    const userId = req.user.userId;

    // Validasyon
    if (!category_id || !amount) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Kategori ve miktar zorunludur'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Miktar 0\'dan buyuk olmalidir'
      });
    }

    // Kategori gercekten var mi?
    const categoryCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1',
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Gecersiz kategori'
      });
    }

    // Harcamayi ekle
    const result = await pool.query(
      `INSERT INTO expenses (user_id, category_id, amount, description, expense_date)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE))
       RETURNING *`,
      [userId, category_id, amount, description || null, expense_date || null]
    );

    res.status(201).json({
      status: 'OK',
      message: 'Harcama basariyla eklendi',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Harcama ekleme hatasi:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Harcama eklenemedi',
      error: error.message
    });
  }
});

// ============================================
// GET /api/expenses - Tum harcamalari listele
// ============================================
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
         e.id, 
         e.amount, 
         e.description, 
         e.expense_date,
         e.created_at,
         c.id AS category_id,
         c.name AS category_name,
         c.icon AS category_icon,
         c.color AS category_color
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = $1
       ORDER BY e.expense_date DESC, e.created_at DESC`,
      [userId]
    );

    res.json({
      status: 'OK',
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Harcama listeleme hatasi:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Harcamalar getirilemedi',
      error: error.message
    });
  }
});

// ============================================
// GET /api/expenses/summary - Toplam ozet
// ============================================
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
         COUNT(*) AS total_count,
         COALESCE(SUM(amount), 0) AS total_amount,
         COALESCE(AVG(amount), 0) AS average_amount,
         COALESCE(MAX(amount), 0) AS max_amount,
         COALESCE(MIN(amount), 0) AS min_amount
       FROM expenses
       WHERE user_id = $1`,
      [userId]
    );

    // Bu ayki harcamalar
    const monthResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS this_month_total
       FROM expenses
       WHERE user_id = $1
         AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );

    res.json({
      status: 'OK',
      data: {
        total_count: parseInt(result.rows[0].total_count),
        total_amount: parseFloat(result.rows[0].total_amount),
        average_amount: parseFloat(result.rows[0].average_amount),
        max_amount: parseFloat(result.rows[0].max_amount),
        min_amount: parseFloat(result.rows[0].min_amount),
        this_month_total: parseFloat(monthResult.rows[0].this_month_total)
      }
    });

  } catch (error) {
    console.error('Ozet hatasi:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Ozet alinamadi',
      error: error.message
    });
  }
});

// ============================================
// GET /api/expenses/by-category - Pasta grafik icin
// ============================================
router.get('/by-category', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
         c.id AS category_id,
         c.name AS category_name,
         c.icon AS category_icon,
         c.color AS category_color,
         COUNT(e.id) AS expense_count,
         COALESCE(SUM(e.amount), 0) AS total_amount
       FROM categories c
       LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = $1
       GROUP BY c.id, c.name, c.icon, c.color
       HAVING COALESCE(SUM(e.amount), 0) > 0
       ORDER BY total_amount DESC`,
      [userId]
    );

    // Her kategorinin yuzde payini hesapla
    const totalSum = result.rows.reduce(
      (sum, row) => sum + parseFloat(row.total_amount), 
      0
    );

    const data = result.rows.map(row => ({
      category_id: row.category_id,
      category_name: row.category_name,
      category_icon: row.category_icon,
      category_color: row.category_color,
      expense_count: parseInt(row.expense_count),
      total_amount: parseFloat(row.total_amount),
      percentage: totalSum > 0 
        ? parseFloat(((parseFloat(row.total_amount) / totalSum) * 100).toFixed(2))
        : 0
    }));

    res.json({
      status: 'OK',
      total_sum: totalSum,
      data: data
    });

  } catch (error) {
    console.error('Kategori bazli hata:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Kategori verileri alinamadi',
      error: error.message
    });
  }
});

// ============================================
// DELETE /api/expenses/:id - Harcama sil
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const expenseId = req.params.id;

    // Sadece kendi harcamasini silebilsin
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [expenseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Harcama bulunamadi veya size ait degil'
      });
    }

    res.json({
      status: 'OK',
      message: 'Harcama silindi',
      deletedId: result.rows[0].id
    });

  } catch (error) {
    console.error('Silme hatasi:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Harcama silinemedi',
      error: error.message
    });
  }
});

module.exports = router;