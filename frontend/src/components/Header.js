import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/components.css';
import { getUser, logout } from '../utils/storage';

function Header() {
  const navigate = useNavigate();
  const user = getUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          HnH TV
        </Link>

        <nav className="nav-menu">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/explore" className="nav-link">
            Explore
          </Link>
          <Link to="/about" className="nav-link">
            About
          </Link>
          <Link to="/help" className="nav-link">
            Help
          </Link>
          {user && (
            <>
              <Link to="/watchlist" className="nav-link">
                Watchlist
              </Link>
              <Link to="/my-list" className="nav-link">
                My List
              </Link>
            </>
          )}
        </nav>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search movies, shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">🔍</button>
        </form>

        <div className="header-actions">
          {user ? (
            <div className="user-menu">
              <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                👤 {user.name}
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-link">
                    Profile
                  </Link>
                  <Link to="/account" className="dropdown-link">
                    Account
                  </Link>
                  <Link to="/subscription" className="dropdown-link">
                    Subscription
                  </Link>
                  {user.role === 'admin' && (
                    <>
                      <div className="dropdown-divider"></div>
                      <Link to="/admin" className="dropdown-link admin-link">
                        ⚙️ Admin Panel
                      </Link>
                    </>
                  )}
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
