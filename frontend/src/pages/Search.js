import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import VideoCard from '../components/VideoCard';
import '../styles/pages.css';
import apiClient from '../utils/api';

function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/content/search/${query}`);
      setResults(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error searching:', error);
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, performSearch]);

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

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="search-page">
      <Header />
      
      <div className="search-container">
        <h1>Search Results for "{query}"</h1>
        
        {results.length > 0 ? (
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
          <p className="empty-message">No results found for "{query}"</p>
        )}
      </div>
    </div>
  );
}

export default Search;
