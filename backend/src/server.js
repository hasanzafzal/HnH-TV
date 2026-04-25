const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://192.168.18.18:3001', '*'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = require('../config/database');
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const genreRoutes = require('./routes/genre');
const watchlistRoutes = require('./routes/watchlist');
const reviewRoutes = require('./routes/review');
const watchHistoryRoutes = require('./routes/watchHistory');
const subscriptionRoutes = require('./routes/subscription');
const downloadRoutes = require('./routes/download');
const errorHandler = require('./middleware/errorHandler');

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'HnH TV API Server is running' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// OneDrive video proxy - streams video from OneDrive sharing links
const { resolveOneDriveUrl, proxyOneDriveStream, getCachedUrl, setCachedUrl } = require('./utils/onedriveProxy');

app.get('/api/stream', async (req, res) => {
  const { url: shareUrl } = req.query;
  
  if (!shareUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Check cache first
    let downloadUrl = getCachedUrl(shareUrl);
    
    if (!downloadUrl) {
      downloadUrl = await resolveOneDriveUrl(shareUrl);
      setCachedUrl(shareUrl, downloadUrl);
    }

    await proxyOneDriveStream(req, res, downloadUrl);
  } catch (error) {
    console.error('Stream proxy error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream video: ' + error.message });
    }
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/downloads', downloadRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }

  console.error('Server error:', error);
  process.exit(1);
});

const gracefulShutdown = (signal) => {
  server.close(async () => {
    try {
      await mongoose.connection.close();
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    } finally {
      process.kill(process.pid, signal);
    }
  });
};

process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
