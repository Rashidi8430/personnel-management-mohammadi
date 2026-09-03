/**
 * ماژول مدیریت و زمان‌بندی شیفت‌های کاری پرسنل
 * مسیر پایه: /api/schedules
 */

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

/**
 * @route   GET /api/schedules
 * @desc    دریافت لیست شیفت‌ها بر اساس بازه تاریخ
 * @access  تمام پرسنل (دیدن شیفت‌های فروشگاه)
 */
router.get('/', async (req, res) => {
  const { start_date, end_date, user_id } = req.query;

  try {
    let query = `
      SELECT s.id, s.user_id, u.full_name, u.role, s.shift_date, s.shift_type,
             s.start_time, s.end_time, s.note, s.created_at
      FROM schedules s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      params.push(start_date);
      query += ` AND s.shift_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND s.shift_date <= $${params.length}`;
    }

    if (user_id) {
      params.push(parseInt(user_id, 10));
      query += ` AND s.user_id = $${params.length}`;
    }

    query += ' ORDER BY s.shift_date DESC, s.start_time ASC';

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ خطا در واکشی شیفت‌ها:', error);
    return res.status(500).json({ success: false, message: 'خطای سرور در دریافت شیفت‌ها' });
  }
});

/**
 * @route   POST /api/schedules
 * @desc    تعریف شیفت کاری جدید برای پرسنل
 * @access  مدیر و سرپرست (manager, supervisor)
 */
router.post('/', checkRole('manager', 'supervisor'), async (req, res) => {
  const { user_id, shift_date, shift_type, start_time, end_time, note } = req.body;

  if (!user_id || !shift_date || !shift_type || !start_time || !end_time) {
    return res.status(400).json({
      success: false,
      message: 'ورود شناسه پرسنل، تاریخ، نوع شیفت، ساعت شروع و پایان الزامی است'
    });
  }

  try {
    // بررسی تکراری نبودن شیفت در همان تاریخ برای همان فرد
    const checkDuplicate = await pool.query(
      'SELECT id FROM schedules WHERE user_id = $1 AND shift_date = $2',
      [user_id, shift_date]
    );

    if (checkDuplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'برای این پرسنل در تاریخ انتخاب‌شده شیفت ثبت شده است'
      });
    }

    const insertQuery = `
      INSERT INTO schedules (user_id, shift_date, shift_type, start_time, end_time, note)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const { rows } = await pool.query(insertQuery, [
      user_id,
      shift_date,
      shift_type,
      start_time,
      end_time,
      note ? String(note).trim() : null
    ]);

    return res.status(201).json({
      success: true,
      message: 'شیفت کاری با موفقیت ثبت شد',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در ثبت شیفت:', error);
    return res.status(500).json({ success: false, message: 'خطا در ذخیره‌سازی شیفت' });
  }
});

/**
 * @route   DELETE /api/schedules/:id
 * @desc    حذف شیفت کاری
 * @access  مدیر و سرپرست
 */
router.delete('/:id', checkRole('manager', 'supervisor'), async (req, res) => {
  const shiftId = parseInt(req.params.id, 10);

  if (isNaN(shiftId)) {
    return res.status(400).json({ success: false, message: 'شناسه شیفت نامعتبر است' });
  }

  try {
    const result = await pool.query('DELETE FROM schedules WHERE id = $1 RETURNING id', [shiftId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'شیفت مورد نظر یافت نشد' });
    }

    return res.status(200).json({
      success: true,
      message: 'شیفت با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('❌ خطا در حذف شیفت:', error);
    return res.status(500).json({ success: false, message: 'خطا در حذف شیفت' });
  }
});

module.exports = router;
