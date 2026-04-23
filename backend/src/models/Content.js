const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  contentType: {
    type: String,
    enum: ['movie', 'tv_series'],
    required: true,
  },
  genre: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Genre',
    required: true,
  }],
  releaseDate: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in minutes for movies
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  directors: [String],
  cast: [String],
  posterUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  bannerUrl: {
    type: String,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  ageRating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'],
    default: 'PG-13',
  },
  language: [String],
  subtitles: [String],
  downloadable: {
    type: Boolean,
    default: true,
  },
  qualityOptions: {
    type: [String],
    enum: ['480p', '720p', '1080p', '4K'],
    default: ['720p', '1080p'],
  },
  quality: {
    type: String,
    enum: ['240p', '480p', '720p', '1080p', '4K'],
    default: '1080p',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Content', ContentSchema);
