const express = require('express');
const router = express.Router();
const {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
} = require('../controllers/genreController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/', getAllGenres);
router.get('/:id', getGenreById);

// Admin routes (protected)
router.post('/', protect, adminOnly, createGenre);
router.put('/:id', protect, adminOnly, updateGenre);
router.delete('/:id', protect, adminOnly, deleteGenre);

module.exports = router;
