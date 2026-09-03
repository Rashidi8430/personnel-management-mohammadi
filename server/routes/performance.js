/**
 * ارزیابی عملکرد
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// دریافت ارزیابی عملکرد
router.get('/:userId/:year/:month', verifyToken, checkRole('supervisor', 'admin'), async (req, res) => {
  try {
    const { userId, year, month } = req.params;
    const evaluationDate = new Date(year, month - 1, 1);

    const result = await pool.query(
      `SELECT * FROM performance_evaluations
       WHERE user_id = $1 AND evaluation_month = $2`,
      [userId, evaluationDate]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: true,
        data: null,
        message: 'ارزیابی هنوز ثبت نشده'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// ثبت/بروزرسانی ارزیابی توسط سرپرست
router.post('/supervisor-evaluate', verifyToken, checkRole('supervisor'), async (req, res) => {
  try {
    const { user_id, evaluation_month, sales_score, organization_score, behavior_score, notes } = req.body;

    if (!user_id || !evaluation_month) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات الزامی را پر کنید'
      });
    }

    const evaluationDate = new Date(evaluation_month);

    const result = await pool.query(
      `INSERT INTO performance_evaluations 
       (user_id, evaluation_month, sales_score, organization_score, behavior_score, 
        supervisor_notes, supervisor_evaluated_by, supervisor_evaluated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, evaluation_month) DO UPDATE SET
       sales_score = EXCLUDED.sales_score,
       organization_score = EXCLUDED.organization_score,
       behavior_score = EXCLUDED.behavior_score,
       supervisor_notes = EXCLUDED.supervisor_notes,
       supervisor_evaluated_by = EXCLUDED.supervisor_evaluated_by,
       supervisor_evaluated_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, evaluationDate, sales_score || null, organization_score || null, behavior_score || null, notes || null, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'ارزیابی سرپرست ثبت شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Supervisor evaluate error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// ثبت/بروزرسانی ارزیابی توسط عامل
router.post('/admin-evaluate', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { user_id, evaluation_month, admin_notes, is_best_employee } = req.body;

    if (!user_id || !evaluation_month) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات الزامی را پر کنید'
      });
    }

    const evaluationDate = new Date(evaluation_month);

    // محاسبه میانگین امتیازات
    const scoreResult = await pool.query(
      `SELECT 
       (COALESCE(sales_score, 0) + COALESCE(organization_score, 0) + COALESCE(behavior_score, 0)) / 3 as overall
       FROM performance_evaluations
       WHERE user_id = $1 AND evaluation_month = $2`,
      [user_id, evaluationDate]
    );

    const overallScore = scoreResult.rows.length > 0 ? scoreResult.rows[0].overall : null;

    const result = await pool.query(
      `INSERT INTO performance_evaluations 
       (user_id, evaluation_month, admin_notes, admin_evaluated_by, admin_evaluated_at, overall_score, is_best_employee)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
       ON CONFLICT (user_id, evaluation_month) DO UPDATE SET
       admin_notes = EXCLUDED.admin_notes,
       admin_evaluated_by = EXCLUDED.admin_evaluated_by,
       admin_evaluated_at = CURRENT_TIMESTAMP,
       overall_score = EXCLUDED.overall_score,
       is_best_employee = EXCLUDED.is_best_employee,
       updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, evaluationDate, admin_notes || null, req.user.id, overallScore, is_best_employee || false]
    );

    res.status(201).json({
      success: true,
      message: 'ارزیابی عامل ثبت شد',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Admin evaluate error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

// بهترین پرسنل ماه
router.get('/best-employee/:year/:month', verifyToken, checkRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { year, month } = req.params;
    const evaluationDate = new Date(year, month - 1, 1);

    const result = await pool.query(
      `SELECT pe.*, u.first_name, u.last_name, u.position FROM performance_evaluations pe
       JOIN users u ON pe.user_id = u.id
       WHERE pe.evaluation_month = $1 AND pe.is_best_employee = TRUE`,
      [evaluationDate]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get best employee error:', error);
    res.status(500).json({
      success: false,
      message: 'خطای سرور'
    });
  }
});

module.exports = router;