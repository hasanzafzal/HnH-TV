import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="back-link">Go back to Home</Link>
    </div>
  );
}

export default NotFound;
