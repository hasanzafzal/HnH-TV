import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import RatingComponent from '../components/RatingComponent';
import '../styles/pages.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

function ContentDetail() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [content, setContent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(0);

  const fetchContent = useCallback(async () => {
    try {
      const res = await apiClient.get(`/content/${contentId}`);
      setContent(res.data.data);
      
      const reviewsRes = await apiClient.get(`/reviews/${contentId}`);
      setReviews(reviewsRes.data.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
    }
  }, [contentId]);

  const checkWatchlist = useCallback(async () => {
    try {
      const res = await apiClient.get(`/watchlist/check/${contentId}`);
      setInWatchlist(res.data.inWatchlist);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  }, [contentId]);

  useEffect(() => {
    fetchContent();
    if (user) {
      checkWatchlist();
    }
  }, [contentId, user, fetchContent, checkWatchlist]);



  const handleAddWatchlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await apiClient.post(`/watchlist/${contentId}`);
      setInWatchlist(true);
      alert('Added to watchlist!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding to watchlist');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await apiClient.post(`/reviews/${contentId}`, {
        rating: userRating,
        comment: reviewText,
      });
      setUserRating(0);
      setReviewText('');
      fetchContent();
      alert('Review submitted!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting review');
    }
  };

  const handleWatch = () => {
    navigate(`/watch/${contentId}`);
  };

  const handleWatchEpisode = (seasonNum, episodeNum) => {
    navigate(`/watch/${contentId}?season=${seasonNum}&episode=${episodeNum}`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!content) return <div className="error">Content not found</div>;

  const isTvSeries = content.contentType === 'tv_series' && content.seasons && content.seasons.length > 0;
  const currentSeason = isTvSeries ? content.seasons[selectedSeason] : null;

  return (
    <div className="content-detail">
      <Header />

      <div className="detail-hero">
        <img src={content.bannerUrl || content.posterUrl} alt={content.title} />
        <div className="detail-overlay"></div>
      </div>

      <div className="detail-container">
        <div className="detail-main">
          <h1>{content.title}</h1>
          
          <div className="detail-meta">
            <span className="rating">⭐ {content.rating}/10</span>
            <span className="type">{content.contentType === 'tv_series' ? 'TV Series' : 'Movie'}</span>
            <span className="year">{new Date(content.releaseDate).getFullYear()}</span>
            {content.contentType === 'tv_series' && content.seasons && content.seasons.length > 0
              ? <span className="duration">{content.seasons.length} Season{content.seasons.length !== 1 ? 's' : ''}</span>
              : content.duration && <span className="duration">{content.duration} min</span>
            }
            {content.genre && content.genre.length > 0 && (
              content.genre.map(g => (
                <span key={g._id || g} className="genre-tag">{g.name || g}</span>
              ))
            )}
          </div>

          <p className="description">{content.description}</p>

          {content.cast.length > 0 && (
            <div className="detail-section">
              <h3>Cast</h3>
              <p>{content.cast.join(', ')}</p>
            </div>
          )}

          {content.directors.length > 0 && (
            <div className="detail-section">
              <h3>Directors</h3>
              <p>{content.directors.join(', ')}</p>
            </div>
          )}

          <div className="action-buttons">
            {!isTvSeries && (
              <button className="btn btn-primary" onClick={handleWatch}>
                ▶ Watch Now
              </button>
            )}
            <button
              className={`btn ${inWatchlist ? 'btn-added' : 'btn-secondary'}`}
              onClick={handleAddWatchlist}
            >
              {inWatchlist ? '✓ In Watchlist' : '+ Watchlist'}
            </button>
          </div>

          {/* Season/Episode Selector for TV Series */}
          {isTvSeries && (
            <div className="seasons-section">
              <div className="season-tabs">
                {content.seasons.map((season, idx) => (
                  <button
                    key={idx}
                    className={`season-tab ${selectedSeason === idx ? 'active' : ''}`}
                    onClick={() => setSelectedSeason(idx)}
                  >
                    {season.title || `Season ${season.seasonNumber}`}
                  </button>
                ))}
              </div>

              {currentSeason && (
                <div className="episodes-list">
                  {currentSeason.episodes
                    .sort((a, b) => a.episodeNumber - b.episodeNumber)
                    .map((ep) => (
                      <div
                        key={ep._id || ep.episodeNumber}
                        className="episode-item"
                        onClick={() => handleWatchEpisode(currentSeason.seasonNumber, ep.episodeNumber)}
                      >
                        <div className="episode-info">
                          <span className="ep-number">E{ep.episodeNumber}</span>
                          <span className="ep-title">{ep.title}</span>
                        </div>
                        <div className="episode-meta">
                          {ep.duration > 0 && <span className="ep-duration">{ep.duration} min</span>}
                          <span className="ep-play">▶ Play</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {user && (
            <div className="review-form">
              <h3>Write a Review</h3>
              <RatingComponent rating={userRating} onRatingChange={setUserRating} />
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts about this content..."
                maxLength={500}
              />
              <button className="btn btn-primary" onClick={handleSubmitReview}>
                Submit Review
              </button>
            </div>
          )}
        </div>

        <div className="detail-sidebar">
          <div className="content-poster">
            <img src={content.posterUrl} alt={content.title} />
          </div>
        </div>
      </div>

      <div className="reviews-section">
        <h2>Reviews</h2>
        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <h4>{review.user.name}</h4>
                  <span className="review-rating">⭐ {review.rating}/10</span>
                </div>
                {review.title && <p className="review-title">{review.title}</p>}
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
}

export default ContentDetail;
