const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema(
  {
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
    episodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Episode',
      default: null,
    },
    watchedDuration: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    percentageWatched: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
    device: {
      type: String,
      default: 'web',
    },
    videoQuality: {
      type: String,
      enum: ['SD', '720p', '1080p', '4K'],
      default: '720p',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
