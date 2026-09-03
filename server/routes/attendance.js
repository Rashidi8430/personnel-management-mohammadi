/**
 * حضور و غیاب
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// دریافت حضور و غیاب یک ماه
router.get('/month/:userId/:year/:month', verifyToken, async (req, res) => {
  try {
    const { userId, year, month } = req.params;

    // بررسی دسترسی
    if (req.user.role === 'employee' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'دسترسی غیرمجاز'
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await pool.query(
      `SELECT a.*, u.first_name, u.last_name FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = $1 AND a.attendance_date >= $2 AND a.attendance_date <= $3
       ORDER BY a.attendance_date`,
      [userId, startDate, endDate]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// ثبت حضور و غیاب
router.post('/record', verifyToken, async (req, res) => {
  try {
    const { user_id, attendance_date, status, check_in_time, check_out_time, notes } = req.body;

    // بررسی دسترسی
    if (req.user.role === 'employee' && req.user.id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'تنها می‌توانید حضور و غیاب خود را ثبت کنید'
      });
    }

    if (req.user.role === 'employee' && status !== 'present') {
      return res.status(403).json({
        success: false,
        message: 'تنها می‌توانید حضور را ثبت کنید'
      });
    }

    const result = await pool.query(
      `INSERT INTO attendance (user_id, attendance_date, status, check_in_time, check_out_time, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, attendance_date) DO UPDATE SET
       status = EXCLUDED.status, check_in_time = EXCLUDED.check_in_time, 
       check_out_time = EXCLUDED.check_out_time, notes = EXCLUDED.notes,
       updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, attendance_date, status, check_in_time || null, check_out_time || null, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'حضور و غیاب ثبت شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Record attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// تایید حضور و غیاب (فقط سرپرست)
router.put('/verify/:id', verifyToken, checkRole('supervisor'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE attendance SET verified_by = $1, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'حضور و غیاب یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'حضور و غیاب تایید شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Verify attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

module.exports = router;