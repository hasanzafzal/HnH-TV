import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import VideoCard from '../components/VideoCard';
import '../styles/pages.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

function Watchlist() {
  const navigate = useNavigate();
  const user = getUser();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWatchlist();
  }, [user, navigate]);

  const fetchWatchlist = async () => {
    try {
      const res = await apiClient.get('/watchlist');
      setWatchlist(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setLoading(false);
    }
  };

  const handleRemove = async (contentId) => {
    try {
      await apiClient.delete(`/watchlist/${contentId}`);
      setWatchlist(watchlist.filter((item) => item.content._id !== contentId));
      alert('Removed from watchlist');
    } catch (error) {
      alert(error.response?.data?.message || 'Error removing from watchlist');
    }
  };

  const handleWatch = (contentId) => {
    navigate(`/watch/${contentId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="watchlist">
      <Header />
      
      <div className="watchlist-container">
        <h1>My Watchlist</h1>
        
        {watchlist.length > 0 ? (
          <div className="watchlist-grid">
            {watchlist.map((item) => (
              <div key={item._id} className="watchlist-item">
                <VideoCard
                  content={item.content}
                  onWatchClick={handleWatch}
                  onAddWatchlist={() => {}}
                />
                <button
                  className="btn btn-danger"
                  onClick={() => handleRemove(item.content._id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-message">Your watchlist is empty. Start adding content!</p>
        )}
      </div>
    </div>
  );
}

export default Watchlist;
