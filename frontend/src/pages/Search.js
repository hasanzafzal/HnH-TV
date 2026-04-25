import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import VideoCard from '../components/VideoCard';
import '../styles/pages.css';
import apiClient from '../utils/api';

function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await apiClient.get(`/content/search/${encodeURIComponent(query.trim())}`);
      setResults(res.data.data || []);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleWatch = (contentId) => {
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

  return (
    <div className="search-page">
      <Header />
      
      <div className="search-container">
        <h1>
          {query.trim()
            ? `Search Results for "${query}"`
            : 'Search'}
        </h1>

        {loading ? (
          <div className="loading">Searching...</div>
        ) : !query.trim() ? (
          <p className="empty-message">Enter a search term to find movies and TV series.</p>
        ) : results.length > 0 ? (
          <div className="results-grid">
            {results.map((content) => (
              <VideoCard
                key={content._id}
                content={content}
                onWatchClick={handleWatch}
                onAddWatchlist={handleAddWatchlist}
              />
            ))}
          </div>
        ) : (
          <div className="empty-message">
            <p>Sorry, looks like we currently don't have what you're looking for.</p>
            <p>Chat with our <strong>AI assistant</strong> for recommendations and we'll probably have something here you'll like!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
