const express = require('express');
const router = express.Router();
const {
  getContentReviews,
  createReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/:contentId', getContentReviews);

// Protected routes
router.post('/:contentId', protect, createReview);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
