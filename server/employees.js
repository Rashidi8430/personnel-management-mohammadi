/**
 * ماژول مدیریت اطلاعات و دسترسی پرسنل فروشگاه
 * مسیر پایه: /api/employees
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../database');
const { verifyToken, checkRole } = require('../middleware/auth');

// تمام اندپوینت‌های این روت نیازمند احراز هویت اولیه هستند
router.use(verifyToken);

/**
 * @route   GET /api/employees
 * @desc    دریافت لیست تمام پرسنل همراه با فیلتر وضعیت
 * @access  مدیر و سرپرست (manager, supervisor)
 */
router.get('/', checkRole('manager', 'supervisor'), async (req, res) => {
  const { is_active, role } = req.query;

  try {
    let query = `
      SELECT id, username, full_name, role, phone, is_active, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (typeof is_active !== 'undefined') {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    query += ' ORDER BY role ASC, full_name ASC';

    const { rows } = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('❌ خطا در دریافت لیست پرسنل:', error);
    return res.status(500).json({
      success: false,
      message: 'خطای سرور در دریافت فهرست پرسنل'
    });
  }
});

/**
 * @route   GET /api/employees/:id
 * @desc    مشاهده جزییات یک کارمند
 * @access  مدیر و سرپرست، یا خودِ کارمند برای پروفایل خودش
 */
router.get('/:id', async (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (isNaN(targetId)) {
    return res.status(400).json({ success: false, message: 'شناسه پرسنل نامعتبر است' });
  }

  // پرسنل عادی فقط به اطلاعات خودشان دسترسی دارند
  if (['cashier', 'shelf_keeper'].includes(req.user.role) && req.user.id !== targetId) {
    return res.status(403).json({ success: false, message: 'عدم دسترسی مجاز' });
  }

  try {
    const query = `
      SELECT id, username, full_name, role, phone, is_active, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const { rows } = await pool.query(query, [targetId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'پرسنل مورد نظر یافت نشد' });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در دریافت مشخصات پرسنل:', error);
    return res.status(500).json({ success: false, message: 'خطای سرور در واکشی پرسنل' });
  }
});

/**
 * @route   POST /api/employees
 * @desc    افزودن پرسنل جدید به فروشگاه
 * @access  مدیر و سرپرست (manager, supervisor)
 */
router.post('/', checkRole('manager', 'supervisor'), async (req, res) => {
  const { username, password, full_name, role, phone } = req.body;

  if (!username || !password || !full_name || !role) {
    return res.status(400).json({
      success: false,
      message: 'ورود نام کاربری، رمز عبور، نام و نقش الزامی است'
    });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const validRoles = ['manager', 'supervisor', 'cashier', 'shelf_keeper'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'نقش انتخابی معتبر نیست'
    });
  }

  try {
    // جلوگیری از ثبت نام کاربری تکراری
    const checkUser = await pool.query('SELECT id FROM users WHERE username = $1', [cleanUsername]);
    if (checkUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'این نام کاربری از قبل در سیستم وجود دارد'
      });
    }

    // هش کردن ایمن رمز عبور
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(password).trim(), salt);

    const insertQuery = `
      INSERT INTO users (username, password_hash, full_name, role, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, username, full_name, role, phone, is_active, created_at
    `;
    const { rows } = await pool.query(insertQuery, [
      cleanUsername,
      passwordHash,
      String(full_name).trim(),
      role,
      phone ? String(phone).trim() : null
    ]);

    return res.status(201).json({
      success: true,
      message: 'نیروی جدید با موفقیت در سامانه ثبت شد',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در ثبت پرسنل:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ذخیره‌سازی اطلاعات در پایگاه داده'
    });
  }
});

/**
 * @route   PUT /api/employees/:id
 * @desc    ویرایش اطلاعات، وضعیت و رمز عبور پرسنل
 * @access  مدیر و سرپرست
 */
router.put('/:id', checkRole('manager', 'supervisor'), async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { full_name, role, phone, is_active, password } = req.body;

  if (isNaN(targetId)) {
    return res.status(400).json({ success: false, message: 'شناسه نامعتبر است' });
  }

  try {
    const userExist = await pool.query('SELECT id, password_hash FROM users WHERE id = $1', [targetId]);
    if (userExist.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
    }

    let finalPasswordHash = userExist.rows[0].password_hash;
    if (password && String(password).trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      finalPasswordHash = await bcrypt.hash(String(password).trim(), salt);
    }

    const updateQuery = `
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          role = COALESCE($2, role),
          phone = COALESCE($3, phone),
          is_active = COALESCE($4, is_active),
          password_hash = $5,
          updated_at = NOW()
      WHERE id = $6
      RETURNING id, username, full_name, role, phone, is_active, updated_at
    `;

    const { rows } = await pool.query(updateQuery, [
      full_name ? String(full_name).trim() : null,
      role || null,
      phone ? String(phone).trim() : null,
      typeof is_active === 'boolean' ? is_active : null,
      finalPasswordHash,
      targetId
    ]);

    return res.status(200).json({
      success: true,
      message: 'اطلاعات پرسنل با موفقیت به‌روزرسانی شد',
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ خطا در به‌روزرسانی پرسنل:', error);
    return res.status(500).json({
      success: false,
      message: 'خطا در ثبت تغییرات در دیتابیس'
    });
  }
});

module.exports = router;
