/**
 * پایگاه داده - شماتیک SQL
 * سیستم مدیریت پرسنل فروشگاه مطهری
 */

-- جدول کاربران
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'admin' (عامل), 'supervisor' (سرپرست), 'employee' (پرسنل)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  position VARCHAR(50), -- سرپرست، صندوق‌دار، شلف‌دار
  hire_date DATE,
  salary DECIMAL(10, 2), -- حقوق پایه
  insurance_amount DECIMAL(10, 2), -- بیمه
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول حضور و غیاب
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  attendance_date DATE NOT NULL,
  status VARCHAR(20), -- 'present' (حاضر), 'absent' (غایب), 'sick' (استعلاجی), 'leave' (مرخصی)
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  verified_by INTEGER REFERENCES users(id), -- سرپرست تایید می‌کند
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, attendance_date)
);

-- جدول برنامه شیفت (هفتگی)
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  schedule_date DATE NOT NULL,
  shift VARCHAR(20), -- 'morning' (7:30-15:30), 'evening' (15:30-23:30), 'off' (تعطیل)
  created_by INTEGER NOT NULL REFERENCES users(id), -- سرپرست ثبت می‌کند
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, schedule_date)
);

-- جدول درخواست مرخصی
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type VARCHAR(20), -- 'monthly' (ماهیانه), 'sick' (استعلاجی)
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved_supervisor', 'approved_admin', 'rejected'
  supervisor_approved_by INTEGER REFERENCES users(id),
  supervisor_approved_at TIMESTAMP,
  admin_approved_by INTEGER REFERENCES users(id),
  admin_approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول ارزیابی عملکرد
CREATE TABLE performance_evaluations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  evaluation_month DATE NOT NULL, -- تاریخ ارزیابی (اول ماه)
  sales_score DECIMAL(3, 1), -- امتیاز فروش (0-10)
  organization_score DECIMAL(3, 1), -- امتیاز مرتب‌بودن (0-10)
  behavior_score DECIMAL(3, 1), -- امتیاز خوش‌برخورد (0-10)
  supervisor_notes TEXT,
  supervisor_evaluated_by INTEGER REFERENCES users(id),
  supervisor_evaluated_at TIMESTAMP,
  admin_notes TEXT,
  admin_evaluated_by INTEGER REFERENCES users(id),
  admin_evaluated_at TIMESTAMP,
  overall_score DECIMAL(3, 1), -- میانگین نمرات
  is_best_employee BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, evaluation_month)
);

-- جدول حقوق و دستمزد
CREATE TABLE salaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  salary_month DATE NOT NULL, -- ماه حقوق
  base_salary DECIMAL(10, 2),
  bonus DECIMAL(10, 2), -- پاداش بر اساس فروش
  deductions DECIMAL(10, 2), -- کسورات
  insurance DECIMAL(10, 2), -- بیمه
  total_salary DECIMAL(10, 2),
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id), -- عامل ثبت می‌کند
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, salary_month)
);

-- جدول ورود و خروج
CREATE TABLE check_in_out (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ایندکس‌ها برای بهتری کردن کارایی
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, attendance_date);
CREATE INDEX idx_attendance_verified ON attendance(verified_by);
CREATE INDEX idx_schedules_user_date ON schedules(user_id, schedule_date);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_performance_user_month ON performance_evaluations(user_id, evaluation_month);
CREATE INDEX idx_salaries_user_month ON salaries(user_id, salary_month);
CREATE INDEX idx_checkin_user ON check_in_out(user_id);