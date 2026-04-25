import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

function MyList() {
  const navigate = useNavigate();
  const user = getUser();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWatchlist();
  }, [user, navigate]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/watchlist');
      // Unwrap: API returns [{content: {…}}, …] — flatten to content objects
      const items = (response.data.data || [])
        .map(item => item.content)
        .filter(Boolean);
      setWatchlist(items);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromList = async (contentId) => {
    try {
      await apiClient.delete(`/watchlist/${contentId}`);
      setWatchlist(watchlist.filter(item => item._id !== contentId));
    } catch (error) {
      console.error('Error removing from list:', error);
      alert('Failed to remove from list');
    }
  };

  const handlePlayContent = (contentId) => {
    navigate(`/watch/${contentId}`);
  };

  const filterContent = () => {
    if (filter === 'all') return watchlist;
    return watchlist.filter(item => item.contentType === filter);
  };

  const filteredContent = filterContent();

  if (loading) {
    return (
      <div className="mylist-page">
        <Header />
        <div className="mylist-container">
          <div className="loading">Loading your list...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mylist-page">
      <Header />

      <div className="mylist-container">
        <div className="mylist-header">
          <h1>📋 My List</h1>
          <p>{watchlist.length} items saved</p>
        </div>

        {watchlist.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h2>Your list is empty</h2>
              <p>Add movies and shows to your list to save them for later</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/explore')}
              >
                Explore Content
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="filter-section">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({watchlist.length})
              </button>
              <button
                className={`filter-btn ${filter === 'movie' ? 'active' : ''}`}
                onClick={() => setFilter('movie')}
              >
                🎬 Movies ({watchlist.filter(item => item.contentType === 'movie').length})
              </button>
              <button
                className={`filter-btn ${filter === 'tv_series' ? 'active' : ''}`}
                onClick={() => setFilter('tv_series')}
              >
                📺 Series ({watchlist.filter(item => item.contentType === 'tv_series').length})
              </button>
            </div>

            <div className="watchlist-grid">
              {filteredContent.map(content => (
                <div key={content._id} className="watchlist-card">
                  <div className="card-poster">
                    <img 
                      src={content.posterUrl || 'https://via.placeholder.com/200x300'} 
                      alt={content.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x300';
                      }}
                    />
                    <div className="card-overlay">
                      <button
                        className="btn-play"
                        onClick={() => handlePlayContent(content._id)}
                        title="Play now"
                      >
                        ▶️ Play
                      </button>
                      <button
                        className="btn-remove"
                        onClick={() => removeFromList(content._id)}
                        title="Remove from list"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <div className="card-badge">
                      {content.contentType === 'movie' ? '🎬 Movie' : '📺 Series'}
                    </div>
                  </div>
                  <div className="card-info">
                    <h3>{content.title}</h3>
                    <div className="card-meta">
                      <span className="rating">⭐ {content.rating || 'N/A'}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyList;
