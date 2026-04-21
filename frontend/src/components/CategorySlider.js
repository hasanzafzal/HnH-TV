import React from 'react';
import '../styles/components.css';

function CategorySlider({ title, content, onItemClick }) {
  const scroll = (direction) => {
    const slider = document.querySelector('.slider-content');
    const scrollAmount = 400;
    if (direction === 'left') {
      slider.scrollLeft -= scrollAmount;
    } else {
      slider.scrollLeft += scrollAmount;
    }
  };

  return (
    <div className="category-slider">
      <h2 className="slider-title">{title}</h2>
      <div className="slider-container">
        <button className="slider-btn left" onClick={() => scroll('left')}>
          ‹
        </button>
        <div className="slider-content">
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
        <button className="slider-btn right" onClick={() => scroll('right')}>
          ›
        </button>
      </div>
    </div>
  );
}

export default CategorySlider;
