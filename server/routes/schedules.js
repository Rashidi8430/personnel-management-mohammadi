/**
 * برنامه شیفت
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// دریافت برنامه شیفت
router.get('/week/:year/:week', verifyToken, async (req, res) => {
  try {
    const { year, week } = req.params;

    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const day = simple.getDay();
    const diff = simple.getDate() - day + (day === 0 ? -6 : 1);
    const startDate = new Date(simple.setDate(diff));

    const result = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.position FROM schedules s
       JOIN users u ON s.user_id = u.id
       WHERE s.schedule_date >= $1 AND s.schedule_date < $2 + interval '7 days'
       ORDER BY s.schedule_date, u.first_name`,
      [startDate, startDate]
    );

    res.json({
      success: true,
      data: result.rows,
      week_start: startDate
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// ثبت برنامه شیفت (فقط سرپرست)
router.post('/create', verifyToken, checkRole('supervisor'), async (req, res) => {
  try {
    const { user_id, schedule_date, shift } = req.body;

    if (!user_id || !schedule_date || !shift) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات الزامی را پر کنید'
      });
    }

    const result = await pool.query(
      `INSERT INTO schedules (user_id, schedule_date, shift, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, schedule_date) DO UPDATE SET
       shift = EXCLUDED.shift, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, schedule_date, shift, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'برنامه شیفت ثبت شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// دریافت برنامه شیفت یک پرسنل برای یک ماه
router.get('/employee/:userId/:year/:month', verifyToken, async (req, res) => {
  try {
    const { userId, year, month } = req.params;

    if (req.user.role === 'employee' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'دسترسی غیرمجاز'
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await pool.query(
      `SELECT * FROM schedules
       WHERE user_id = $1 AND schedule_date >= $2 AND schedule_date <= $3
       ORDER BY schedule_date`,
      [userId, startDate, endDate]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get employee schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

module.exports = router;