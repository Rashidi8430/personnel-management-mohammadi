/**
 * حقوق و دستمزد (فیش حقوقی)
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// دریافت فیش حقوقی (عامل کامل، سرپرست و پرسنل فقط خودشان)
router.get('/:userId/:year/:month', verifyToken, async (req, res) => {
  try {
    const { userId, year, month } = req.params;

    // بررسی دسترسی
    if (req.user.role === 'employee' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'تنها می‌توانید فیش خود را مشاهده کنید'
      });
    }

    if (req.user.role === 'supervisor' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'تنها می‌توانید فیش خود را مشاهده کنید'
      });
    }

    const salaryDate = new Date(year, month - 1, 1);

    const result = await pool.query(
      `SELECT s.*, u.first_name, u.last_name, u.position FROM salaries s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1 AND s.salary_month = $2`,
      [userId, salaryDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: true,
        data: null,
        message: 'فیش حقوقی برای این ماه ثبت نشده'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// ثبت/بروزرسانی فیش حقوقی (فقط عامل)
router.post('/create', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { user_id, salary_month, base_salary, bonus, deductions, insurance, notes } = req.body;

    if (!user_id || !salary_month) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات الزامی را پر کنید'
      });
    }

    const salaryDate = new Date(salary_month);
    const total_salary = (base_salary || 0) + (bonus || 0) - (deductions || 0);

    const result = await pool.query(
      `INSERT INTO salaries (user_id, salary_month, base_salary, bonus, deductions, insurance, total_salary, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, salary_month) DO UPDATE SET
       base_salary = EXCLUDED.base_salary,
       bonus = EXCLUDED.bonus,
       deductions = EXCLUDED.deductions,
       insurance = EXCLUDED.insurance,
       total_salary = EXCLUDED.total_salary,
       notes = EXCLUDED.notes,
       updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, salaryDate, base_salary || 0, bonus || 0, deductions || 0, insurance || 0, total_salary, notes || null, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'فیش حقوقی ثبت شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// دریافت تمام فیش‌های یک پرسنل (فقط عامل)
router.get('/history/:userId', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT s.*, u.first_name, u.last_name FROM salaries s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = $1
       ORDER BY s.salary_month DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

module.exports = router;