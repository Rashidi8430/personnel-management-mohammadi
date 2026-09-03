# سیستم مدیریت پرسنل فروشگاه مطهری

🏪 **Personnel Management System for Mohammadi Shop**

## 📋 مشخصات سیستم

سیستم جامع مدیریت پرسنل فروشگاه مطهری شامل:

- ✅ مدیریت پرسنل (ثبت، ویرایش، حذف)
- 📋 حضور و غیاب
- 📅 برنامه شیفت (هفتگی)
- 🗓️ مدیریت مرخصی‌ها
- ⭐ ارزیابی عملکرد
- 💰 مدیریت حقوق و دستمزد
- 🔐 کنترل دسترسی بر اساس نقش

## 🏗️ ساختار پروژه

```
personnel-management-mohammadi/
├── server/                 # Backend (Node.js + Express)
│   ├── config/            # تنظیمات
│   ├── middleware/        # Middleware‌ها
│   ├── routes/            # API Routes
│   └── index.js          # فایل اصلی
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/   # React Components
│   │   ├── App.jsx
│   │   └── index.js
│   └── public/
├── database/              # SQL Schemas
└── README.md
```

## 🚀 راه‌اندازی سیستم

### الزامات
- Node.js 14+
- PostgreSQL 12+
- npm یا yarn

### مرحله 1: نصب PostgreSQL

#### Windows:
```bash
# دانلود و نصب از:
https://www.postgresql.org/download/windows/
```

#### macOS:
```bash
brew install postgresql@15
```

#### Linux (Ubuntu):
```bash
sudo apt-get install postgresql postgresql-contrib
```

### مرحله 2: ایجاد دیتابیس

```bash
# وارد PostgreSQL شوید
psql -U postgres

# دستورات SQL:
CREATE DATABASE personnel_management;
CREATE USER shop_user WITH PASSWORD 'your_password';
ALTER ROLE shop_user SET client_encoding TO 'utf8';
ALTER ROLE shop_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE shop_user SET default_transaction_deferrable TO on;
ALTER ROLE shop_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE personnel_management TO shop_user;
\q
```

### مرحله 3: دانلود پروژه

```bash
git clone https://github.com/Rashidi8430/personnel-management-mohammadi.git
cd personnel-management-mohammadi
```

### مرحله 4: تنظیم متغیرهای محیطی

```bash
# کپی کنید:
cp .env.example .env

# ویرایش کنید:
nano .env

# مقادیر:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=personnel_management
DB_USER=shop_user
DB_PASSWORD=your_password
SERVER_PORT=5000
JWT_SECRET=your_secret_key_here
```

### مرحله 5: اجرای مایگریشن دیتابیس

```bash
# اتصال به دیتابیس:
psql -U shop_user -d personnel_management -f database/schema.sql
```

### مرحله 6: نصب وابستگی‌ها

```bash
# Backend:
npm install

# Frontend:
cd client
npm install
cd ..
```

### مرحله 7: اجرای برنامه

#### گزینه 1: اجرای جداگانه

```bash
# Terminal 1 - Backend:
npm run dev

# Terminal 2 - Frontend:
cd client
npm start
```

#### گزینه 2: اجرای با Docker (آسان‌تر)

```bash
# نصب Docker
# سپس:
docker-compose up
```

## 🔐 کاربران پیش‌فرض

بعد از ایجاد دیتابیس، این کاربران را اضافه کنید:

### 1. عامل فروشگاه (Admin)
```sql
INSERT INTO users (username, password, role, first_name, last_name, position, salary, insurance_amount)
VALUES (
  'admin',
  '$2a$10$...', -- bcrypt hash of: admin123
  'admin',
  'احمد',
  'علی‌پور',
  'عامل فروشگاه',
  5000000,
  200000
);
```

### 2. سرپرست (Supervisor)
```sql
INSERT INTO users (username, password, role, first_name, last_name, position, salary, insurance_amount)
VALUES (
  'supervisor',
  '$2a$10$...', -- bcrypt hash of: supervisor123
  'supervisor',
  'فاطمه',
  'محمدی',
  'سرپرست فروش',
  3000000,
  150000
);
```

### 3. پرسنل (Employee)
```sql
INSERT INTO users (username, password, role, first_name, last_name, position, salary, insurance_amount)
VALUES (
  'employee1',
  '$2a$10$...', -- bcrypt hash of: employee123
  'employee',
  'علی',
  'احمدی',
  'صندوق‌دار',
  1500000,
  100000
);
```

### چگونه hash کنید:

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('password', 10);
console.log(hash);
```

## 🌐 دسترسی برنامه

```
Frontend:  http://localhost:3000
Backend:   http://localhost:5000
API:       http://localhost:5000/api
```

## 📚 API Endpoints

### احراز هویت
```
POST   /api/auth/login          ورود
POST   /api/auth/logout         خروج
```

### مدیریت پرسنل
```
GET    /api/employees           دریافت تمام پرسنل
GET    /api/employees/:id       دریافت یک پرسنل
POST   /api/employees           اضافه کردن پرسنل
PUT    /api/employees/:id       ویرایش پرسنل
DELETE /api/employees/:id       حذف پرسنل
```

### حضور و غیاب
```
GET    /api/attendance/month/:userId/:year/:month
POST   /api/attendance/record
PUT    /api/attendance/verify/:id
```

### برنامه شیفت
```
GET    /api/schedules/week/:year/:week
GET    /api/schedules/employee/:userId/:year/:month
POST   /api/schedules/create
```

### مرخصی
```
POST   /api/leaves/request
GET    /api/leaves/requests/:status?
PUT    /api/leaves/:id/supervisor-approve
PUT    /api/leaves/:id/admin-approve
PUT    /api/leaves/:id/reject
```

### ارزیابی عملکرد
```
GET    /api/performance/:userId/:year/:month
POST   /api/performance/supervisor-evaluate
POST   /api/performance/admin-evaluate
GET    /api/performance/best-employee/:year/:month
```

### فیش حقوقی
```
GET    /api/salaries/:userId/:year/:month
POST   /api/salaries/create
GET    /api/salaries/history/:userId
```

### ورود و خروج
```
GET    /api/checkin/today
POST   /api/checkin/check-in
PUT    /api/checkin/:id/check-out
```

## 🎯 نقش‌ها و دسترسی‌ها

| فيچر | عامل | سرپرست | پرسنل |
|------|------|---------|--------|
| مدیریت پرسنل | ✅ | 👁️ | ❌ |
| ثبت حضور/غیاب | ❌ | ✅ | ✅ (خودش) |
| تایید حضور/غیاب | ❌ | ✅ | ❌ |
| ورود/خروج | 👁️ | ❌ | ❌ |
| برنامه شیفت | 👁️ | ✅ | 👁️ |
| درخواست مرخصی | ❌ | ❌ | ✅ |
| تایید مرخصی (1) | ❌ | ✅ | ❌ |
| تایید مرخصی (2) | ✅ | ❌ | ❌ |
| ارزیابی عملکرد | ✅ نظر | ✅ نظر | ❌ |
| فیش حقوقی | ✅ ثبت | 👁️ خودش | 👁️ خودش |
| بهترین پرسنل | ✅ | 👁️ | ❌ |

**Legend:** ✅ = مجاز، 👁️ = مشاهده، ❌ = غیرمجاز

## 🐛 مشکلات و راه‌حل

### خطا: دیتابیس متصل نشود
```bash
# بررسی PostgreSQL:
sudo systemctl status postgresql

# اگر خاموش بود، فعال کنید:
sudo systemctl start postgresql
```

### خطا: پورت 5000 استفاده می‌شود
```bash
# یک پورت دیگر استفاده کنید:
SERVER_PORT=5001 npm run dev
```

### خطا: CORS issues
```bash
# اطمینان دهید که PROXY در client/package.json صحیح است:
"proxy": "http://localhost:5000"
```

## 📞 پشتیبانی

درصورت بروز مشکل:
1. Git Issues میں سوال کریں
2. یا با مدیر تماس بگیرید

## 📝 لیسنس

MIT License

---

**نسخه:** 1.0.0  
**آخرین بروزرسانی:** سپتامبر 2026