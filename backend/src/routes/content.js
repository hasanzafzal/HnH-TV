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
  getContentByGenre,
} = require('../controllers/contentController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllContent);
router.get('/trending', getTrendingContent);
router.get('/genre/:genreId', getContentByGenre);
router.get('/search/:query', searchContent);
router.get('/:id', getContentById);

// Admin routes (protected)
router.post('/', protect, createContent);
router.put('/:id', protect, updateContent);
router.delete('/:id', protect, deleteContent);

module.exports = router;
