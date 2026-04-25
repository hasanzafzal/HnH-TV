import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span className="site-footer-logo">HnH TV</span>
        <nav className="site-footer-links">
          <Link to="/about">About</Link>
          <Link to="/help">Help & FAQ</Link>
        </nav>
        <p className="site-footer-copy">© {new Date().getFullYear()} HnH TV. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
