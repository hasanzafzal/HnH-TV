const mongoose = require('mongoose');

const sentimentAnalysisSchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewText: {
      type: String,
      required: true,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      required: true,
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    emotions: [
      {
        emotion: {
          type: String,
          enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'trust', 'anticipation', 'disgust'],
        },
        score: {
          type: Number,
          min: 0,
          max: 1,
        },
      },
    ],
    keyPhrases: [
      {
        type: String,
      },
    ],
    aspectBased: {
      plot: Number,
      acting: Number,
      cinematography: Number,
      musicScore: Number,
      pacing: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SentimentAnalysis', sentimentAnalysisSchema);
