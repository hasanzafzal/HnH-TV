const express = require('express');
const router = express.Router();
const {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/auth');

// All routes protected
router.use(protect);

router.get('/', getWatchlist);
router.post('/:contentId', addToWatchlist);
router.delete('/:contentId', removeFromWatchlist);
router.get('/check/:contentId', checkWatchlist);

module.exports = router;
