/**
 * ماژول گزارش‌گیری و مدیریت سوابق تردد پرسنل
 * مسیر پایه: /api/attendance
 */

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

/**
 * @route   GET /api/attendance
 * @desc    دریافت لیست ترددها (پرسنل عادی فقط تردد خود، مدیر/سرپرست همه)
 */
router.get('/', async (req, res) => {
  const { start_date, end_date, user_id } = req.query;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    let query = `
      SELECT a.id, a.user_id, u.full_name, u.role, a.check_in, a.check_out,
             a.total_hours, a.device_info, a.note, a.created_at
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // اگر مدیر یا سرپرست نبود، فقط رکوردهای خودش
    if (currentUserRole !== 'manager' && currentUserRole !== 'supervisor') {
      params.push(currentUserId);
      query += ` AND a.user_id = $${params.length}`;
    } else if (user_id) {
      params.push(parseInt(user_id, 10));
      query += ` AND a.user_id = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND a.check_in >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND a.check_in <= $${params.length}`;
    }

    query += ' ORDER BY a.check_in DESC';

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ خطا در دریافت ترددها:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت لیست تردد' });
  }
});

/**
 * @route   PUT /api/attendance/:id
 * @desc    اصلاح دستی رکورد تردد پرسنل توسط مدیر یا سرپرست
 */
router.put('/:id', checkRole('manager', 'supervisor'), async (req, res) => {
  const recordId = parseInt(req.params.id, 10);
  const { check_in, check_out, note } = req.body;

  if (isNaN(recordId)) {
    return res.status(400).json({ success: false, message: 'شناسه رکورد نامعتبر است' });
  }

  try {
    let totalHours = null;
    if (check_in && check_out) {
      const diffMs = new Date(check_out) - new Date(check_in);
      if (diffMs > 0) {
        totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      }
    }

    const updateQuery = `
      UPDATE attendance
      SET check_in = COALESCE($1, check_in),
          check_out = COALESCE($2, check_out),
          total_hours = COALESCE($3, total_hours),
          note = COALESCE($4, note)
      WHERE id = $5
      RETURNING *
    `;

    const { rows } = await pool.query(updateQuery, [
      check_in || null,
      check_out || null,
      totalHours,
      note ? String(note).trim() : null,
      recordId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'رکورد تردد یافت نشد' });
    }

    return res.status(200).json({
      success: true,
      message: 'رکورد تردد با موفقیت ویرایش شد',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در ویرایش تردد:', error);
    return res.status(500).json({ success: false, message: 'خطا در ویرایش رکورد تردد' });
  }
});

module.exports = router;
