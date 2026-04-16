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
    try {
      const subRes = await apiClient.get('/subscription');
      setSubscription(subRes.data.data);

      const historyRes = await apiClient.get('/watch-history?limit=5');
      setWatchStats({
        totalWatched: historyRes.data.total,
        continueWatching: historyRes.data.data,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
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
                  <p>{subscription.isActive ? 'Active' : 'Inactive'}</p>
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
              <p>No active subscription</p>
            )}
            <button className="btn btn-primary">Manage Subscription</button>
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
