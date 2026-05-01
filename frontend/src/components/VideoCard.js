import React, { useState } from 'react';
import { Play, Heart, Star, CheckCircle2 } from 'lucide-react';
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
        {content.isCompleted && (
          <div className="watched-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Watched
          </div>
        )}
        {isHovered && (
          <div className="card-overlay">
            <button className="play-btn" onClick={() => onWatchClick(content._id)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Play size={16} fill="currentColor" /> Play
            </button>
            <button
              className="watchlist-btn"
              onClick={() => onAddWatchlist(content._id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Heart size={16} /> Watchlist
            </button>
          </div>
        )}
      </div>
      <div className="card-info">
        <h3>{content.title}</h3>
        <div className="card-meta">
          <span className="rating" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={14} color="#FFD700" fill="#FFD700" /> {content.rating}
          </span>
          <span className="type">{content.contentType}</span>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;
