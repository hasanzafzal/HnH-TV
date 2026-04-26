import React, { useState } from 'react';
import '../styles/components.css';

function VideoCard({ content, onWatchClick, onAddWatchlist }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!content) return null;

  return (
    <div
      className="video-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-image">
        <img src={content.posterUrl} alt={content.title} />
        {content.isCompleted && <div className="watched-badge">✓ Watched</div>}
        {isHovered && (
          <div className="card-overlay">
            <button className="play-btn" onClick={() => onWatchClick(content._id)}>
              ▶ Play
            </button>
            <button
              className="watchlist-btn"
              onClick={() => onAddWatchlist(content._id)}
            >
              ♡ Watchlist
            </button>
          </div>
        )}
      </div>
      <div className="card-info">
        <h3>{content.title}</h3>
        <div className="card-meta">
          <span className="rating">⭐ {content.rating}</span>
          <span className="type">{content.contentType}</span>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;
