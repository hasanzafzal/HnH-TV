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
  watchedAt: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number, // watched duration in seconds
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

module.exports = mongoose.model('WatchHistory', WatchHistorySchema);
