import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { username, password }
      );

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onLoginSuccess(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏪 فروشگاه مطهری</h1>
        <h2>سیستم مدیریت پرسنل</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>نام کاربری</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری خود را وارد کنید"
              required
            />
          </div>

          <div className="form-group">
            <label>رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور خود را وارد کنید"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <div className="login-info">
          <p>💡 نام کاربری و رمز عبور خود را وارد کنید</p>
          <p>📧 در صورت فراموشی رمز، با مدیر تماس بگیرید</p>
        </div>
      </div>
    </div>
  );
};

export default Login;