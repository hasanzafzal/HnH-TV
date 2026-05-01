const express = require('express');
const router = express.Router();
const {
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  searchContent,
  getTrendingContent,
  getFeaturedContent,
  getContentByGenre,
  advancedSearch,
} = require('../controllers/contentController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/', getAllContent);
router.get('/trending', getTrendingContent);
router.get('/featured', getFeaturedContent);
router.get('/genre/:genreId', getContentByGenre);
router.get('/search/:query', searchContent);
router.get('/advanced-search', advancedSearch);
router.get('/:id', getContentById);

// Admin routes (protected)
router.post('/', protect, adminOnly, createContent);
router.put('/:id', protect, adminOnly, updateContent);
router.delete('/:id', protect, adminOnly, deleteContent);

module.exports = router;
