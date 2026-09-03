/**
 * ورود و خروج پرسنل
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// دریافت ورود و خروج پرسنل (عامل)
router.get('/today', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT c.*, u.first_name, u.last_name, u.position FROM check_in_out c
       JOIN users u ON c.user_id = u.id
       WHERE DATE(c.check_in_time) = $1
       ORDER BY c.check_in_time DESC`,
      [today]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get check in/out error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// ورود پرسنل
router.post('/check-in', verifyToken, checkRole('employee'), async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO check_in_out (user_id, check_in_time, is_active)
       VALUES ($1, CURRENT_TIMESTAMP, TRUE)
       RETURNING *`,
      [req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'ورود ثبت شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// خروج پرسنل
router.put('/:id/check-out', verifyToken, checkRole('employee'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE check_in_out
       SET check_out_time = CURRENT_TIMESTAMP, is_active = FALSE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ورود یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'خروج ثبت شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

module.exports = router;