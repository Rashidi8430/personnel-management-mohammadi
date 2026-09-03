import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (user.role === 'admin' || user.role === 'supervisor') {
      fetchEmployees();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🏪 فروشگاه مطهری</h1>
          <p>سیستم مدیریت پرسنل</p>
        </div>
        <div className="header-right">
          <span>خوش آمدید: <strong>{user.first_name} {user.last_name}</strong></span>
          <button className="logout-btn" onClick={handleLogout}>خروج</button>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="sidebar">
          <ul>
            <li>
              <button 
                className={activeTab === 'home' ? 'active' : ''}
                onClick={() => setActiveTab('home')}
              >
                🏠 صفحه اصلی
              </button>
            </li>

            {(user.role === 'admin' || user.role === 'supervisor') && (
              <>
                <li>
                  <button 
                    className={activeTab === 'employees' ? 'active' : ''}
                    onClick={() => setActiveTab('employees')}
                  >
                    👥 مدیریت پرسنل
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'attendance' ? 'active' : ''}
                    onClick={() => setActiveTab('attendance')}
                  >
                    ✅ حضور و غیاب
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'schedule' ? 'active' : ''}
                    onClick={() => setActiveTab('schedule')}
                  >
                    📅 برنامه شیفت
                  </button>
                </li>
              </>
            )}

            {user.role === 'employee' && (
              <>
                <li>
                  <button 
                    className={activeTab === 'my-attendance' ? 'active' : ''}
                    onClick={() => setActiveTab('my-attendance')}
                  >
                    ✅ حضور و غیاب من
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'my-schedule' ? 'active' : ''}
                    onClick={() => setActiveTab('my-schedule')}
                  >
                    📅 برنامه من
                  </button>
                </li>
              </>
            )}

            {(user.role === 'admin' || user.role === 'supervisor') && (
              <>
                <li>
                  <button 
                    className={activeTab === 'leaves' ? 'active' : ''}
                    onClick={() => setActiveTab('leaves')}
                  >
                    🗓️ مرخصی‌ها
                  </button>
                </li>
                <li>
                  <button 
                    className={activeTab === 'performance' ? 'active' : ''}
                    onClick={() => setActiveTab('performance')}
                  >
                    ⭐ ارزیابی عملکرد
                  </button>
                </li>
              </>
            )}

            {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'employee') && (
              <li>
                <button 
                  className={activeTab === 'salary' ? 'active' : ''}
                  onClick={() => setActiveTab('salary')}
                >
                  💰 فیش حقوقی
                </button>
              </li>
            )}

            {user.role === 'admin' && (
              <li>
                <button 
                  className={activeTab === 'checkin' ? 'active' : ''}
                  onClick={() => setActiveTab('checkin')}
                >
                  🔐 ورود و خروج
                </button>
              </li>
            )}
          </ul>
        </nav>

        <main className="main-content">
          {activeTab === 'home' && (
            <div className="home-section">
              <h2>خوش آمدید به سیستم مدیریت پرسنل 👋</h2>
              <div className="welcome-cards">
                <div className="card">
                  <h3>👤 نقش شما</h3>
                  <p>{user.role === 'admin' ? 'عامل فروشگاه' : user.role === 'supervisor' ? 'سرپرست' : 'پرسنل'}</p>
                </div>
                <div className="card">
                  <h3>📍 فروشگاه</h3>
                  <p>شعبه مطهری</p>
                </div>
                <div className="card">
                  <h3>📊 پرسنل</h3>
                  <p>{employees.length} نفر</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (user.role === 'admin' || user.role === 'supervisor') && (
            <div className="employees-section">
              <h2>👥 مدیریت پرسنل</h2>
              {loading ? (
                <p>در حال بارگذاری...</p>
              ) : (
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>نام</th>
                      <th>نام خانوادگی</th>
                      <th>پست شغلی</th>
                      <th>شماره تماس</th>
                      <th>حقوق پایه</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td>{emp.first_name}</td>
                        <td>{emp.last_name}</td>
                        <td>{emp.position}</td>
                        <td>{emp.phone}</td>
                        <td>{emp.salary?.toLocaleString()} ریال</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'salary' && (
            <div className="salary-section">
              <h2>💰 فیش حقوقی</h2>
              <p>امکان مشاهده فیش حقوقی شما</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;