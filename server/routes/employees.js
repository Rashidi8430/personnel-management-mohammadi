/**
 * مدیریت پرسنل
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// دریافت تمام پرسنل (فقط عامل و سرپرست)
router.get('/', verifyToken, checkRole('admin', 'supervisor'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, first_name, last_name, email, phone, position, hire_date, salary, insurance_amount, is_active FROM users WHERE role = $1 ORDER BY first_name',
      ['employee']
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// دریافت اطلاعات یک پرسنل
router.get('/:id', verifyToken, checkRole('admin', 'supervisor'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [req.params.id, 'employee']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پرسنل یافت نشد'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// اضافه کردن پرسنل جدید (فقط عامل)
router.post('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { username, password, first_name, last_name, email, phone, position, hire_date, salary, insurance_amount } = req.body;

    if (!username || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات الزامی را پر کنید'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, role, first_name, last_name, email, phone, position, hire_date, salary, insurance_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, username, first_name, last_name, email, phone, position, hire_date, salary, insurance_amount`,
      [username, hashedPassword, 'employee', first_name, last_name, email || null, phone || null, position || null, hire_date || null, salary || 0, insurance_amount || 0]
    );

    res.status(201).json({
      success: true,
      message: 'پرسنل با موفقیت اضافه شد',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'این نام کاربری قبلاً ثبت شده است'
      });
    }
    console.error('Add employee error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// ویرایش اطلاعات پرسنل (فقط عامل)
router.put('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { first_name, last_name, email, phone, position, salary, insurance_amount } = req.body;
    const userId = req.params.id;

    const result = await pool.query(
      `UPDATE users SET first_name = COALESCE($1, first_name), 
       last_name = COALESCE($2, last_name), 
       email = COALESCE($3, email), 
       phone = COALESCE($4, phone), 
       position = COALESCE($5, position), 
       salary = COALESCE($6, salary), 
       insurance_amount = COALESCE($7, insurance_amount),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND role = $9
       RETURNING id, username, first_name, last_name, email, phone, position, hire_date, salary, insurance_amount`,
      [first_name || null, last_name || null, email || null, phone || null, position || null, salary || null, insurance_amount || null, userId, 'employee']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پرسنل یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'اطلاعات به‌روزرسانی شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// حذف پرسنل (فقط عامل - غیرفعال سازی)
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = $2
       RETURNING id`,
      [req.params.id, 'employee']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'پرسنل یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'پرسنل حذف شد'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

module.exports = router;