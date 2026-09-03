/**
 * ماژول درخواست و تأیید مرخصی پرسنل
 * مسیر پایه: /api/leaves
 */

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

/**
 * @route   GET /api/leaves
 * @desc    دریافت لیست درخواست‌های مرخصی
 */
router.get('/', async (req, res) => {
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    let query = `
      SELECT l.id, l.user_id, u.full_name, u.role, l.leave_type,
             l.start_date, l.end_date, l.status, l.reason, l.response_note,
             l.created_at
      FROM leaves l
      JOIN users u ON l.user_id = u.id
    `;
    const params = [];

    if (currentUserRole !== 'manager' && currentUserRole !== 'supervisor') {
      params.push(currentUserId);
      query += ` WHERE l.user_id = $1`;
    }

    query += ' ORDER BY l.created_at DESC';

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ خطا در دریافت مرخصی‌ها:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت لیست مرخصی‌ها' });
  }
});

/**
 * @route   POST /api/leaves
 * @desc    ثبت درخواست مرخصی جدید توسط پرسنل
 */
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { leave_type, start_date, end_date, reason } = req.body;

  if (!leave_type || !start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: 'نوع مرخصی، تاریخ شروع و پایان الزامی هستند'
    });
  }

  try {
    const insertQuery = `
      INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `;

    const { rows } = await pool.query(insertQuery, [
      userId,
      leave_type,
      start_date,
      end_date,
      reason ? String(reason).trim() : null
    ]);

    return res.status(201).json({
      success: true,
      message: 'درخواست مرخصی با موفقیت ثبت شد و در انتظار بررسی است',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در ثبت مرخصی:', error);
    return res.status(500).json({ success: false, message: 'خطا در ثبت درخواست مرخصی' });
  }
});

/**
 * @route   PUT /api/leaves/:id/status
 * @desc    تغییر وضعیت مرخصی (تأیید / رد) توسط مدیر یا سرپرست
 */
router.put('/:id/status', checkRole('manager', 'supervisor'), async (req, res) => {
  const leaveId = parseInt(req.params.id, 10);
  const { status, response_note } = req.body;

  if (isNaN(leaveId) || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'وضعیت باید approved یا rejected باشد'
    });
  }

  try {
    const updateQuery = `
      UPDATE leaves
      SET status = $1, response_note = $2, reviewed_by = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const { rows } = await pool.query(updateQuery, [
      status,
      response_note ? String(response_note).trim() : null,
      req.user.id,
      leaveId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'درخواست مرخصی یافت نشد' });
    }

    return res.status(200).json({
      success: true,
      message: `درخواست با موفقیت ${status === 'approved' ? 'تأیید' : 'رد'} شد`,
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در بررسی مرخصی:', error);
    return res.status(500).json({ success: false, message: 'خطا در ثبت وضعیت مرخصی' });
  }
});

module.exports = router;
