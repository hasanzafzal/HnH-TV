import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import ContentDetail from './pages/ContentDetail';
import Watch from './pages/Watch';
import Watchlist from './pages/Watchlist';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Account from './pages/Account';
import Subscription from './pages/Subscription';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explore from './pages/Explore';
import AdminPanel from './pages/AdminPanel';
import About from './pages/About';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import WatchHistory from './pages/WatchHistory';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

function App() {
  let apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  if (apiBaseUrl.includes('localhost') && window.location.hostname !== 'localhost') {
    apiBaseUrl = `http://${window.location.hostname}:5000/api`;
  }
  useEffect(() => {
    // Health check in background (non-blocking)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    fetch(`${apiBaseUrl}/health`, { signal: controller.signal })
      .then(() => console.log('✓ API connected'))
      .catch((error) => console.warn('⚠ API unreachable:', error.message))
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [apiBaseUrl]);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/detail/:contentId" element={<ContentDetail />} />
          <Route path="/watch/:contentId" element={<Watch />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/history" element={<WatchHistory />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/account" element={<Account />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
