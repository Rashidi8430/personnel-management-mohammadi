# سیستم مدیریت پرسنل فروشگاه مطهری
## راهنمای نصب و اجرا (فارسی)

### 🚀 شروع سریع

#### گزینه 1: Docker (پیشنهادی - آسان‌تر)

```bash
# 1. کلون کردن پروژه
git clone https://github.com/Rashidi8430/personnel-management-mohammadi.git
cd personnel-management-mohammadi

# 2. اجرا
docker-compose up

# سیستم در اینجا اجرا می‌شود:
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

#### گزینه 2: نصب دستی

```bash
# 1. نصب PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# macOS:   brew install postgresql@15
# Linux:   sudo apt-get install postgresql

# 2. ایجاد دیتابیس
psql -U postgres
# در داخل psql:
CREATE DATABASE personnel_management;
CREATE USER shop_user WITH PASSWORD 'shoppassword123';
GRANT ALL PRIVILEGES ON DATABASE personnel_management TO shop_user;
\q

# 3. مایگریشن دیتابیس
psql -U shop_user -d personnel_management -f database/schema.sql

# 4. تنظیم محیط
cp .env.example .env
# ویرایش .env و تغییر رمز عبور

# 5. نصب وابستگی‌ها
npm install
cd client && npm install && cd ..

# 6. اجرا
# Terminal 1:
npm run dev
# Terminal 2:
cd client && npm start
```

### 👤 کاربران پیش‌فرض

**عامل (Admin):**
- Username: `admin`
- Password: `admin123`

**سرپرست (Supervisor):**
- Username: `supervisor`
- Password: `supervisor123`

**پرسنل (Employee):**
- Username: `employee1`
- Password: `employee123`

> **نکته:** بعد از ورود اول، باید این کاربران را در دیتابیس اضافه کنید.

### 🔧 ایجاد کاربران

```bash
# توسط Script Node.js:
node -e "
const bcrypt = require('bcryptjs');
const pwd = 'admin123';
console.log('Hash:', bcrypt.hashSync(pwd, 10));
"

# یا از SQL:
INSERT INTO users (username, password, role, first_name, last_name, position, salary, insurance_amount)
VALUES (
  'admin',
  '\$2a\$10\$...',  -- bcrypt hash
  'admin',
  'احمد',
  'علی‌پور',
  'عامل فروشگاه',
  5000000,
  200000
);
```

### 📞 نمونه Curl برای API

```bash
# ورود
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# دریافت تمام پرسنل
curl -X GET http://localhost:5000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 🎯 مرحله بعدی

1. ورود به سیستم
2. اضافه کردن پرسنل
3. ثبت برنامه شیفت
4. ثبت حضور و غیاب
5. محاسبه حقوق

### ❓ سوالات متداول

**Q: دیتابیس متصل نمی‌شود؟**
A: PostgreSQL را بررسی کنید: `sudo systemctl start postgresql`

**Q: پورت 5000 استفاده می‌شود؟**
A: `SERVER_PORT=5001 npm run dev` استفاده کنید

**Q: فرانت‌اند بارگذاری نمی‌شود؟**
A: Backend در حال اجرا است مطمئن شوید: `http://localhost:5000/api/health`

### 📖 مستندات بیشتر

برای اطلاعات کامل، `README.md` را ببینید.

---

**نیاز کمک؟** مسائل را در GitHub گزارش دهید! 🐛