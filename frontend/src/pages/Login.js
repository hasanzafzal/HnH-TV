import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import apiClient from '../utils/api';
import Toast from '../components/Toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Show login toast then redirect
        const userName = response.data.user.name ? ` ${response.data.user.name}` : '';
        setToast({ message: `Welcome back${userName}! You're now logged in.`, type: 'success' });
        setTimeout(() => {
          if (response.data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Logo />
      <div className="auth-container login-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>HnH TV</h1>
            <p>Welcome Back</p>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
