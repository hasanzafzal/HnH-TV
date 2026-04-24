const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['plan_to_watch', 'watching', 'completed'],
      default: 'plan_to_watch',
    },
    priority: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Unique constraint: Each user can add content only once
watchlistSchema.index({ userId: 1, contentId: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', watchlistSchema);
