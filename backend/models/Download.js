const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema(
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
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    videoQuality: {
      type: String,
      enum: ['SD', '720p', '1080p', '4K'],
      default: '720p',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['downloading', 'completed', 'expired', 'deleted'],
      default: 'downloading',
    },
    downloadProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    hasSubtitles: {
      type: Boolean,
      default: false,
    },
    subtitleLanguage: [
      {
        type: String,
      },
    ],
    deviceId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Download', downloadSchema);
