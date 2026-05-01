import React, { useRef } from 'react';
import '../styles/components.css';

function CategorySlider({ title, content, onItemClick, showArrows = false }) {
  const sliderRef = useRef(null);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 400;
      if (direction === 'left') {
        sliderRef.current.scrollLeft -= scrollAmount;
      } else {
        sliderRef.current.scrollLeft += scrollAmount;
      }
    }
  };

  return (
    <div className="category-slider">
      <h2 className="slider-title">{title}</h2>
      <div className="slider-container">
        {showArrows && (
          <button className="slider-btn left" onClick={() => scroll('left')}>
            ‹
          </button>
        )}
        <div className="slider-content" ref={sliderRef}>
          {content.map((item) => (
            <div
              key={item._id}
              className="slider-item"
              onClick={() => onItemClick(item._id)}
              style={{ backgroundImage: `url(${item.posterUrl})` }}
            >
              <div className="item-overlay">
                <h3>{item.title}</h3>
                <p>⭐ {item.rating}</p>
              </div>
            </div>
          ))}
        </div>
        {showArrows && (
          <button className="slider-btn right" onClick={() => scroll('right')}>
            ›
          </button>
        )}
      </div>
    </div>
  );
}

export default CategorySlider;
