import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CategorySlider from '../components/CategorySlider';
import ContinueWatching from '../components/ContinueWatching';
import '../styles/pages.css';
import apiClient from '../utils/api';

function Home() {
  const navigate = useNavigate();
  const [trendingContent, setTrendingContent] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Fetch trending
      const trendingRes = await apiClient.get('/content/trending');
      setTrendingContent(trendingRes.data.data || []);

      // Fetch all content
      const allRes = await apiClient.get('/content?limit=50');
      setNewReleases((allRes.data.data || []).slice(0, 20));
      setPopularMovies((allRes.data.data || []).slice(20, 40));
    } catch (error) {
      console.warn('Content fetch failed (expected without DB):', error.message);
      // Continue anyway - show empty state
    } finally {
      setLoading(false);
    }
  };

  const handleWatchClick = (contentId) => {
    navigate(`/watch/${contentId}`);
  };

  const handleAddWatchlist = async (contentId) => {
    try {
      await apiClient.post(`/watchlist/${contentId}`);
      alert('Added to watchlist!');
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert(error.response?.data?.message || 'Error adding to watchlist');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const featuredContent = trendingContent[0];

  return (
    <div className="home">
      <Header />

      {featuredContent && (
        <section className="hero-banner" style={{ backgroundImage: `url(${featuredContent.bannerUrl})` }}>
          <div className="hero-content">
            <h1>{featuredContent.title}</h1>
            <p>{featuredContent.description}</p>
            <div className="hero-buttons">
              <button
                className="btn btn-primary"
                onClick={() => handleWatchClick(featuredContent._id)}
              >
                ▶ Play
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleAddWatchlist(featuredContent._id)}
              >
                + Watchlist
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="content-section">
        {/* Continue Watching — only shown when user has in-progress content */}
        <ContinueWatching />
        {trendingContent.length > 0 && (
          <CategorySlider
            title="Trending Now"
            content={trendingContent}
            onItemClick={handleWatchClick}
          />
        )}

        {newReleases.length > 0 && (
          <CategorySlider
            title="Latest on HnH TV"
            content={newReleases}
            onItemClick={handleWatchClick}
          />
        )}

        {popularMovies.length > 0 && (
          <CategorySlider
            title="Popular Movies"
            content={popularMovies}
            onItemClick={handleWatchClick}
          />
        )}
      </div>
    </div>
  );
}

export default Home;
