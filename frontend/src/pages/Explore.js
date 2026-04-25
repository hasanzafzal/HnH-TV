import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import VideoCard from '../components/VideoCard';
import apiClient from '../utils/api';

const Explore = () => {
  const [filters, setFilters] = useState({
    query: '',
    type: '',
    genre: '',
    minRating: '',
    minYear: '',
    language: '',
    ageRating: '',
    sortBy: '-rating',
    page: 1,
  });

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState([]);

  // Fetch genres for filter dropdown
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await apiClient.get('/genres');
        if (response.data.success) {
          setGenres(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };

    fetchGenres();
  }, []);

  // Fetch content based on filters
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach((key) => {
          if (filters[key]) {
            queryParams.append(key, filters[key]);
          }
        });

        const response = await apiClient.get(
          `/content/advanced-search?${queryParams.toString()}`
        );

        if (response.data.success) {
          setResults(response.data.data || []);
          setTotal(response.data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to page 1 on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo(0, 0);
  };

  const pages = Math.ceil(total / 20);

  return (
    <div className="explore-page">
      <Header />

      <div className="explore-hero">
        <div className="explore-hero-content">
          <h1>Explore Content</h1>
          <p>Find your next favorite show or movie</p>
        </div>
      </div>

      <div className="explore-container">
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          <div className="filter-group">
            <label htmlFor="query">Search</label>
            <input
              id="query"
              type="text"
              name="query"
              placeholder="Search title, cast, director..."
              value={filters.query}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="movie">Movie</option>
              <option value="tv_series">TV Series</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="genre">Genre</label>
            <select
              id="genre"
              name="genre"
              value={filters.genre}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="minRating">Minimum Rating</label>
            <input
              id="minRating"
              type="number"
              name="minRating"
              min="0"
              max="10"
              step="0.5"
              placeholder="0-10"
              value={filters.minRating}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="minYear">Released After</label>
            <input
              id="minYear"
              type="number"
              name="minYear"
              min="1900"
              max={new Date().getFullYear()}
              placeholder="Year"
              value={filters.minYear}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={filters.language}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Hindi">Hindi</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="ageRating">Age Rating</label>
            <select
              id="ageRating"
              name="ageRating"
              value={filters.ageRating}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Ratings</option>
              <option value="G">G</option>
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
              <option value="NC-17">NC-17</option>
              <option value="18+">18+</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortBy">Sort By</label>
            <select
              id="sortBy"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="-rating">Highest Rating</option>
              <option value="rating">Lowest Rating</option>
              <option value="-createdAt">Newest</option>
              <option value="createdAt">Oldest</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>

          <button
            className="btn btn-secondary btn-block"
            onClick={() =>
              setFilters({
                query: '',
                type: '',
                genre: '',
                minRating: '',
                minYear: '',
                language: '',
                ageRating: '',
                sortBy: '-rating',
                page: 1,
              })
            }
          >
            Clear Filters
          </button>
        </aside>

        <main className="explore-content">
          <div className="results-header">
            <h2>
              {total} Result{total !== 1 ? 's' : ''} Found
            </h2>
          </div>

          {loading ? (
            <div className="loading">Loading content...</div>
          ) : results.length > 0 ? (
            <>
              <div className="content-grid">
                {results.map((content) => (
                  <Link
                    key={content._id}
                    to={`/detail/${content._id}`}
                    className="grid-item"
                  >
                    <VideoCard
                      content={content}
                      onWatchClick={(id) => window.location.href = `/watch/${id}`}
                      onAddWatchlist={(id) => {}}
                    />
                  </Link>
                ))}
              </div>

              {pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>

                  <span className="page-info">
                    Page {filters.page} of {pages}
                  </span>

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= pages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-results">
              <p>No content found matching your filters.</p>
              <button
                className="btn btn-primary"
                onClick={() =>
                  setFilters({
                    query: '',
                    type: '',
                    genre: '',
                    minRating: '',
                    minYear: '',
                    language: '',
                    ageRating: '',
                    sortBy: '-rating',
                    page: 1,
                  })
                }
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Explore;
