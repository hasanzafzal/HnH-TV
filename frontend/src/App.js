import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import Home from './pages/Home';
import ContentDetail from './pages/ContentDetail';
import Watch from './pages/Watch';
import Watchlist from './pages/Watchlist';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Subscription from './pages/Subscription';
import NotFound from './pages/NotFound';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check API connectivity
    fetch('http://localhost:5000/api/health')
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Initializing HnH TV...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
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
