import React, { useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
            <ChevronLeft />
          </button>
        )}
        <div className="slider-content" ref={sliderRef}>
          {content.map((item) => (
            <div
              key={item._id}
              className="slider-item"
              onClick={() => onItemClick(item._id)}
            >
              <img 
                src={item.posterUrl} 
                alt={item.title} 
                loading="lazy" 
                className="slider-item-img"
              />
              <div className="item-overlay">
                <h3>{item.title}</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={14} color="#FFD700" fill="#FFD700" /> {item.rating}
                </p>
              </div>
            </div>
          ))}
        </div>
        {showArrows && (
          <button className="slider-btn right" onClick={() => scroll('right')}>
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}

export default CategorySlider;
