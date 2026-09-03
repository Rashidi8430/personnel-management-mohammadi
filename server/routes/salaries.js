/**
 * ماژول محاسبه، ثبت و مشاهده فیش حقوقی پرسنل
 * مسیر پایه: /api/salaries
 */

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

router.use(verifyToken);

/**
 * @route   GET /api/salaries
 * @desc    دریافت لیست فیش‌های حقوقی
 */
router.get('/', async (req, res) => {
  const { user_id, month, year } = req.query;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  try {
    let query = `
      SELECT s.id, s.user_id, u.full_name, u.role, s.salary_month, s.salary_year,
             s.base_salary, s.overtime_pay, s.bonuses, s.deductions, s.net_salary,
             s.payment_status, s.payment_date, s.note, s.created_at
      FROM salaries s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // پرسنل فقط فیش حقوقی خود را می‌بینند
    if (currentUserRole !== 'manager') {
      params.push(currentUserId);
      query += ` AND s.user_id = $${params.length}`;
    } else if (user_id) {
      params.push(parseInt(user_id, 10));
      query += ` AND s.user_id = $${params.length}`;
    }

    if (month) {
      params.push(parseInt(month, 10));
      query += ` AND s.salary_month = $${params.length}`;
    }

    if (year) {
      params.push(parseInt(year, 10));
      query += ` AND s.salary_year = $${params.length}`;
    }

    query += ' ORDER BY s.salary_year DESC, s.salary_month DESC';

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ خطا در واکشی فیش‌های حقوق:', error);
    return res.status(500).json({ success: false, message: 'خطا در دریافت لیست فیش‌های حقوق' });
  }
});

/**
 * @route   POST /api/salaries
 * @desc    صدور فیش حقوقی جدید (فقط مدیر)
 */
router.post('/', checkRole('manager'), async (req, res) => {
  const {
    user_id,
    salary_month,
    salary_year,
    base_salary,
    overtime_pay = 0,
    bonuses = 0,
    deductions = 0,
    note
  } = req.body;

  if (!user_id || !salary_month || !salary_year || base_salary === undefined) {
    return res.status(400).json({
      success: false,
      message: 'ورود پرسنل، ماه، سال و حقوق پایه الزامی است'
    });
  }

  const base = Number(base_salary);
  const overtime = Number(overtime_pay);
  const bonus = Number(bonuses);
  const deduct = Number(deductions);
  const net = base + overtime + bonus - deduct;

  try {
    const insertQuery = `
      INSERT INTO salaries (
        user_id, salary_month, salary_year, base_salary,
        overtime_pay, bonuses, deductions, net_salary,
        payment_status, note
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
      ON CONFLICT (user_id, salary_month, salary_year)
      DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        overtime_pay = EXCLUDED.overtime_pay,
        bonuses = EXCLUDED.bonuses,
        deductions = EXCLUDED.deductions,
        net_salary = EXCLUDED.net_salary,
        note = EXCLUDED.note,
        updated_at = NOW()
      RETURNING *
    `;

    const { rows } = await pool.query(insertQuery, [
      parseInt(user_id, 10),
      parseInt(salary_month, 10),
      parseInt(salary_year, 10),
      base,
      overtime,
      bonus,
      deduct,
      net,
      note ? String(note).trim() : null
    ]);

    return res.status(201).json({
      success: true,
      message: 'فیش حقوقی با موفقیت صادر شد',
      data: rows[0]
    });
  } catch (error) {
    console.time_pay);
  const bonus = Number(bonuses);
  const deduct = Number(deductions);
  const net = base + overtime + bonus - deduct;

  try {
    const insertQuery = `
      INSERT INTO salaries (
        user_id, salary_month, salary_year, base_salary,
        overtime_pay, bonuses, deductions, net_salary,
        payment_status, note
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
      ON CONFLICT (user_id, salary_month, salary_year)
      DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        overtime_pay = EXCLUDED.overtime_pay,
        bonuses = EXCLUDED.bonuses,
        deductions = EXCLUDED.deductions,
        net_salary = EXCLUDED.net_salary,
        note = EXCLUDED.note,
        updated_at = NOW()
      RETURNING *
    `;

    const { rows } = await pool.query(insertQuery, [
      parseInt(user_id, 10),
      parseInt(salary_month, 10),
      parseInt(salary_year, 10),
      base,
      overtime,
      bonus,
      deduct,
      net,
      note ? String(note).trim() : null
    ]);

    return res.status(201).json({
      success: true,
      message: 'فیش حقوقی با موفقیت صادر شد',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در صدور فیش حقوق:', error);
    return res.status(500).json({ success: false, message: 'خطا در ثبت فیش حقوقی' });
  }
});

/**
 * @route   PUT /api/salaries/:id/pay
 * @desc    تغییر وضعیت پرداخت به پرداخت‌شده (Paid)
 */
router.put('/:
