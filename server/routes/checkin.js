/**
 * ماژول ثبت تردد هوشمند (ورود و خروج پرسنل)
 * مسیر پایه: /api/checkin
 */

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

/**
 * @route   GET /api/checkin/status
 * @desc    دریافت آخرین وضعیت تردد کاربر وارد شده
 */
router.get('/status', async (req, res) => {
  const userId = req.user.id;

  try {
    const activeCheckin = await pool.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1 AND check_out IS NULL 
       ORDER BY check_in DESC LIMIT 1`,
      [userId]
    );

    if (activeCheckin.rows.length > 0) {
      return res.status(200).json({
        success: true,
        isCheckedIn: true,
        currentRecord: activeCheckin.rows[0]
      });
    }

    return res.status(200).json({
      success: true,
      isCheckedIn: false,
      currentRecord: null
    });
  } catch (error) {
    console.error('❌ خطا در دریافت وضعیت تردد:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت وضعیت تردد' });
  }
});

/**
 * @route   POST /api/checkin/toggle
 * @desc    ثبت هوشمند ورود یا خروج (سوئیچ خودکار)
 */
router.post('/toggle', async (req, res) => {
  const userId = req.user.id;
  const { note, device_info } = req.body;

  try {
    const activeCheckin = await pool.query(
      `SELECT * FROM attendance 
       WHERE user_id = $1 AND check_out IS NULL 
       ORDER BY check_in DESC LIMIT 1`,
      [userId]
    );

    const now = new Date();

    if (activeCheckin.rows.length > 0) {
      // ثبت خروج
      const recordId = activeCheckin.rows[0].id;
      const checkInTime = new Date(activeCheckin.rows[0].check_in);
      const hoursWorked = ((now - checkInTime) / (1000 * 60 * 60)).toFixed(2);

      const updateQuery = `
        UPDATE attendance 
        SET check_out = $1, total_hours = $2, note = COALESCE($3, note)
        WHERE id = $4
        RETURNING *
      `;

      const { rows } = await pool.query(updateQuery, [
        now,
        parseFloat(hoursWorked),
        note ? String(note).trim() : null,
        recordId
      ]);

      return res.status(200).json({
        success: true,
        action: 'check_out',
        message: 'ثبت خروج با موفقیت انجام شد',
        data: rows[0]
      });
    } else {
      // ثبت ورود
      const insertQuery = `
        INSERT INTO attendance (user_id, check_in, device_info, note)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const { rows } = await pool.query(insertQuery, [
        userId,
        now,
        device_info ? String(device_info).trim() : 'PWA App',
        note ? String(note).trim() : null
      ]);

      return res.status(201).json({
        success: true,
        action: 'check_in',
        message: 'ثبت ورود با موفقیت انجام شد',
        data: rows[0]
      });
    }
  } catch (error) {
    console.error('❌ خطا در پردازش تردد:', error);
    return res.status(500).json({ success: false, message: 'خطا در ثبت تردد' });
  }
});

module.exports = router;
