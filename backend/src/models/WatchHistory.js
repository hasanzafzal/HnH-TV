const mongoose = require('mongoose');

const WatchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  },
  // For TV series episode-level tracking
  seasonNumber: { type: Number, default: null },
  episodeNumber: { type: Number, default: null },

  watchedAt: {
    type: Date,
    default: Date.now,
  },
  // Raw seconds into the video where the user left off
  watchedSeconds: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // total video duration in seconds
    default: 0,
  },
  progress: {
    type: Number, // percentage watched (0-100)
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

// Compound index so each user+content+episode combo is unique
WatchHistorySchema.index(
  { user: 1, content: 1, seasonNumber: 1, episodeNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('WatchHistory', WatchHistorySchema);

