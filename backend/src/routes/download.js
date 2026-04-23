const express = require('express');
const router = express.Router();
const {
  getDownloads,
  getOfflineDownloads,
  startDownload,
  getDownloadProgress,
  deleteDownload,
  cancelDownload,
} = require('../controllers/downloadController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all downloads
router.get('/', getDownloads);

// Get offline downloads
router.get('/offline', getOfflineDownloads);

// Start new download
router.post('/', startDownload);

// Get download progress
router.get('/:id/progress', getDownloadProgress);

// Cancel download
router.post('/:id/cancel', cancelDownload);

// Delete download
router.delete('/:id', deleteDownload);

module.exports = router;
