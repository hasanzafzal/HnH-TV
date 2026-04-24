import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/components.css';

function Logo() {
  return (
    <Link to="/" className="logo">
      HnH TV
    </Link>
  );
}

export default Logo;
