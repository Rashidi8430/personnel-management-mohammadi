/**
 * ماژول ارزیابی عملکرد و ثبت امتیاز پرسنل
 * مسیر پایه: /api/performance
 */

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

/**
 * @route   GET /api/performance
 * @desc    دریافت سوابق ارزیابی عملکرد
 */
router.get('/', async (req, res) => {
  const { user_id, month, year } = req.query;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    let query = `
      SELECT p.id, p.user_id, u.full_name, u.role, p.eval_month, p.eval_year,
             p.score, p.criteria, p.feedback, p.created_at,
             evaluator.full_name AS evaluated_by_name
      FROM performance_reviews p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN users evaluator ON p.evaluated_by = evaluator.id
      WHERE 1=1
    `;
    const params = [];

    // پرسنل عادی فقط ارزیابی‌های خود را می‌بینند
    if (currentUserRole !== 'manager' && currentUserRole !== 'supervisor') {
      params.push(currentUserId);
      query += ` AND p.user_id = $${params.length}`;
    } else if (user_id) {
      params.push(parseInt(user_id, 10));
      query += ` AND p.user_id = $${params.length}`;
    }

    if (month) {
      params.push(parseInt(month, 10));
      query += ` AND p.eval_month = $${params.length}`;
    }

    if (year) {
      params.push(parseInt(year, 10));
      query += ` AND p.eval_year = $${params.length}`;
    }

    query += ' ORDER BY p.eval_year DESC, p.eval_month DESC, p.created_at DESC';

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ خطا در دریافت ارزیابی‌ها:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت ارزیابی عملکرد' });
  }
});

/**
 * @route   POST /api/performance
 * @desc    ثبت ارزیابی عملکرد جدید توسط مدیر یا سرپرست
 */
router.post('/', checkRole('manager', 'supervisor'), async (req, res) => {
  const { user_id, eval_month, eval_year, score, criteria, feedback } = req.body;

  if (!user_id || !eval_month || !eval_year || score === undefined) {
    return res.status(400).json({
      success: false,
      message: 'ورود شناسه پرسنل، ماه، سال و امتیاز الزامی است'
    });
  }

  const numScore = Number(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 100) {
    return res.status(400).json({
      success: false,
      message: 'امتیاز باید عددی بین ۰ تا ۱۰۰ باشد'
    });
  }

  try {
    const insertQuery = `
      INSERT INTO performance_reviews (user_id, eval_month, eval_year, score, criteria, feedback, evaluated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, eval_month, eval_year)
      DO UPDATE SET
        score = EXCLUDED.score,
        criteria = EXCLUDED.criteria,
        feedback = EXCLUDED.feedback,
        evaluated_by = EXCLUDED.evaluated_by,
        updated_at = NOW()
      RETURNING *
    `;

    const { rows } = await pool.query(insertQuery, [
      parseInt(user_id, 10),
      parseInt(eval_month, 10),
      parseInt(eval_year, 10),
      numScore,
      criteria ? JSON.stringify(criteria) : null,
      feedback ? String(feedback).trim() : null,
      req.user.id
    ]);

    return res.status(201).json({
      success: true,
      message: 'ارزیابی عملکرد با موفقیت ثبت شد',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در ثبت ارزیابی:', error);
    return res.status(500).json({ success: false, message: 'خطا در ذخیره‌سازی ارزیابی عملکرد' });
  }
});

module.exports = router;
