const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
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
    recommendationType: {
      type: String,
      enum: ['mood_based', 'genre_based', 'watch_history', 'trending', 'similar_content', 'chatbot_suggested'],
      required: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    userMood: {
      type: String,
      enum: ['happy', 'sad', 'excited', 'relaxed', 'thoughtful', 'scared', 'romantic', 'neutral'],
      default: 'neutral',
    },
    watchingContext: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'evening',
    },
    isClicked: {
      type: Boolean,
      default: false,
    },
    clickedAt: {
      type: Date,
      default: null,
    },
    isWatched: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
