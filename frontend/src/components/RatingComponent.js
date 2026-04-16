import React from 'react';
import '../styles/components.css';

function RatingComponent({ rating, onRatingChange }) {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="rating-component">
      <div className="stars">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            ★
          </button>
        ))}
      </div>
      <span className="rating-text">{hoverRating || rating} / 10</span>
    </div>
  );
}

export default RatingComponent;
