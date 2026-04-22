const express = require('express');
const router = express.Router();
const {
  getWatchHistory,
  addToWatchHistory,
  getWatchProgress,
  getContinueWatching,
} = require('../controllers/watchHistoryController');
const { protect } = require('../middleware/auth');

// All routes protected
router.use(protect);

router.get('/', getWatchHistory);
router.get('/continue-watching', getContinueWatching);
router.get('/:contentId', getWatchProgress);
router.post('/:contentId', addToWatchHistory);

module.exports = router;
