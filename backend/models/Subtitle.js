const mongoose = require('mongoose');

const subtitleSchema = new mongoose.Schema(
  {
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
    language: {
      type: String,
      required: true,
    },
    languageCode: {
      type: String,
      required: true,
    },
    subtitleType: {
      type: String,
      enum: ['default', 'uploaded', 'auto_generated'],
      default: 'default',
    },
    subtitleFile: {
      type: String,
      required: true,
    },
    fileFormat: {
      type: String,
      enum: ['srt', 'vtt', 'ass', 'ssa'],
      default: 'vtt',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subtitle', subtitleSchema);
