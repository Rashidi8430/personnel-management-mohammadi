/**
 * مدیریت مرخصی
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// درخواست مرخصی (پرسنل)
router.post('/request', verifyToken, checkRole('employee'), async (req, res) => {
  try {
    const { start_date, end_date, leave_type, reason } = req.body;

    if (!start_date || !end_date || !leave_type) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات الزامی را پر کنید'
      });
    }

    const result = await pool.query(
      `INSERT INTO leave_requests (user_id, start_date, end_date, leave_type, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, start_date, end_date, leave_type, reason || null, 'pending']
    );

    res.status(201).json({
      success: true,
      message: 'درخواست مرخصی ثبت شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Request leave error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// دریافت درخواست‌های مرخصی
router.get('/requests/:status?', verifyToken, async (req, res) => {
  try {
    const { status } = req.params;
    let query = `SELECT lr.*, u.first_name, u.last_name FROM leave_requests lr
                 JOIN users u ON lr.user_id = u.id`;
    const params = [];

    if (req.user.role === 'employee') {
      query += ` WHERE lr.user_id = $1`;
      params.push(req.user.id);
      if (status) {
        query += ` AND lr.status = $2`;
        params.push(status);
      }
    } else if (req.user.role === 'supervisor') {
      if (status) {
        query += ` WHERE lr.status = $1`;
        params.push(status);
      }
    } else if (req.user.role === 'admin') {
      if (status) {
        query += ` WHERE lr.status = $1`;
        params.push(status);
      }
    }

    query += ` ORDER BY lr.created_at DESC`;
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// تایید توسط سرپرست
router.put('/:id/supervisor-approve', verifyToken, checkRole('supervisor'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE leave_requests 
       SET supervisor_approved_by = $1, supervisor_approved_at = CURRENT_TIMESTAMP, 
           status = 'approved_supervisor', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'درخواست یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'درخواست توسط سرپرست تایید شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Supervisor approve error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// تایید توسط عامل
router.put('/:id/admin-approve', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE leave_requests 
       SET admin_approved_by = $1, admin_approved_at = CURRENT_TIMESTAMP, 
           status = 'approved_admin', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'درخواست یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'درخواست توسط عامل تایید شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Admin approve error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// رد کردن درخواست
router.put('/:id/reject', verifyToken, checkRole('supervisor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE leave_requests 
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'درخواست یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'درخواست رد شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

module.exports = router;