const mongoose = require('mongoose');

const DownloadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  },
  quality: {
    type: String,
    enum: ['480p', '720p', '1080p', '4K'],
    required: true,
    default: '720p',
  },
  status: {
    type: String,
    enum: ['pending', 'downloading', 'completed', 'failed'],
    default: 'pending',
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  fileSize: {
    type: Number, // in bytes
  },
  downloadedAt: {
    type: Date,
  },
  expiryDate: {
    type: Date,
    // Typically 30 days from download for offline viewing
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  isOfflineAvailable: {
    type: Boolean,
    default: false,
  },
  storageLocation: {
    type: String, // URL or local storage path
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for uniqueness
DownloadSchema.index({ userId: 1, contentId: 1, quality: 1 }, { unique: true });

// Auto-delete expired downloads
DownloadSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Download', DownloadSchema);
