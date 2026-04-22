const express = require('express');
const router = express.Router();
const {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
} = require('../controllers/genreController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllGenres);
router.get('/:id', getGenreById);

// Admin routes (protected)
router.post('/', protect, createGenre);
router.put('/:id', protect, updateGenre);
router.delete('/:id', protect, deleteGenre);

module.exports = router;
