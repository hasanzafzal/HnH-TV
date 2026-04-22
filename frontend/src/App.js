import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import ContentDetail from './pages/ContentDetail';
import Watch from './pages/Watch';
import Watchlist from './pages/Watchlist';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explore from './pages/Explore';
import NotFound from './pages/NotFound';

function App() {
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Check API connectivity
    fetch(`${apiBaseUrl}/health`)
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [apiBaseUrl]);

  if (loading) {
    return <div className="loading">Initializing HnH TV...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/detail/:contentId" element={<ContentDetail />} />
          <Route path="/watch/:contentId" element={<Watch />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
