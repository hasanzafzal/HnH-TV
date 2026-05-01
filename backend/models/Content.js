const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
      },
    ],
    poster: {
      type: String,
      default: null,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    banner: {
      type: String,
      default: null,
    },
    releaseDate: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    contentType: {
      type: String,
      enum: ['movie', 'series', 'tv_series'],
      required: true,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    director: [
      {
        type: String,
      },
    ],
    cast: [
      {
        type: String,
      },
    ],
    language: [
      {
        type: String,
        default: 'English',
      },
    ],
    subtitle: [
      {
        type: String,
      },
    ],
    ageRating: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
      default: 'PG',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Content', contentSchema);
