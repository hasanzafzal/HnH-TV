import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

function Profile() {
  const navigate = useNavigate();
  const user = getUser();
  const [subscription, setSubscription] = useState(null);
  const [watchStats, setWatchStats] = useState({
    totalWatched: 0,
    continueWatching: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    // Fetch subscription — 404 just means no record yet (treat as free)
    try {
      const subRes = await apiClient.get('/subscription');
      setSubscription(subRes.data.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Subscription fetch error:', error);
      }
      // 404 = no subscription record; leave as null (handled in render)
    }

    // Fetch watch history separately so subscription error doesn't break it
    try {
      const historyRes = await apiClient.get('/watch-history?limit=5');
      setWatchStats({
        totalWatched: historyRes.data.total,
        continueWatching: historyRes.data.data,
      });
    } catch (error) {
      console.error('Watch history fetch error:', error);
    }

    setLoading(false);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page">
      <Header />

      <div className="profile-container">
        <h1>My Profile</h1>

        <div className="profile-main">
          <section className="profile-section">
            <h2>Account Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <p>{user.name}</p>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <p>{user.email}</p>
              </div>
            </div>
            <button className="btn btn-secondary">Edit Profile</button>
          </section>

          <section className="profile-section">
            <h2>Subscription</h2>
            {subscription ? (
              <div className="subscription-info">
                <div className="info-item">
                  <label>Plan:</label>
                  <p className="plan-badge">{subscription.plan.toUpperCase()}</p>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <p style={{ color: subscription.isActive ? '#4ade80' : '#e50914' }}>
                    {subscription.isActive ? '✅ Active' : '❌ Cancelled'}
                  </p>
                </div>
                <div className="info-item">
                  <label>Max Screens:</label>
                  <p>{subscription.maxScreens}</p>
                </div>
                <div className="info-item">
                  <label>Max Quality:</label>
                  <p>{subscription.maxQuality}</p>
                </div>
              </div>
            ) : (
              <div className="subscription-info">
                <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '12px' }}>
                  You are on the <strong style={{ color: '#FFD700' }}>Free</strong> tier. Subscribe to unlock all content.
                </p>
              </div>
            )}
            <button
              className="btn btn-primary"
              onClick={() => navigate('/subscription')}
            >
              {subscription && subscription.plan !== 'free' ? 'Manage Subscription' : 'View Plans'}
            </button>
          </section>

          <section className="profile-section">
            <h2>Watch Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{watchStats.totalWatched}</h3>
                <p>Total Content Watched</p>
              </div>
            </div>
          </section>

          {watchStats.continueWatching.length > 0 && (
            <section className="profile-section">
              <h2>Continue Watching</h2>
              <ul className="continue-list">
                {watchStats.continueWatching.map((item) => (
                  <li key={item._id}>
                    {item.content.title} - {item.progress}% watched
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
