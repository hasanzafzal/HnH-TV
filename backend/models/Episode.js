const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  tvSeries: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  },
  season: {
    type: Number,
    required: true,
  },
  episodeNumber: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  releaseDate: {
    type: Date,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for unique episodes
EpisodeSchema.index({ tvSeries: 1, season: 1, episodeNumber: 1 }, { unique: true });

module.exports = mongoose.model('Episode', EpisodeSchema);
