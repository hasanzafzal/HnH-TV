const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    favoriteGenres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
      },
    ],
    currentMood: {
      type: String,
      enum: ['happy', 'sad', 'excited', 'relaxed', 'thoughtful', 'scared', 'romantic', 'neutral'],
      default: 'neutral',
    },
    watchingTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'evening',
    },
    preferredLanguage: [
      {
        type: String,
        default: 'English',
      },
    ],
    contentPreference: {
      type: String,
      enum: ['movies', 'series', 'both'],
      default: 'both',
    },
    ageRatingPreference: [
      {
        type: String,
        enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
      },
    ],
    dislikedGenres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
      },
    ],
    notificationPreference: {
      newReleases: {
        type: Boolean,
        default: true,
      },
      recommendations: {
        type: Boolean,
        default: true,
      },
      watchlistReminders: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
