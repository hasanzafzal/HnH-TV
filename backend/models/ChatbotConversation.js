const mongoose = require('mongoose');

const chatbotConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
      unique: true,
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['user', 'bot'],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        intent: {
          type: String,
          enum: ['search', 'recommendation', 'filter', 'question', 'feedback', 'other'],
          default: 'other',
        },
        confidence: {
          type: Number,
          min: 0,
          max: 1,
        },
      },
    ],
    recommendedContents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
      },
    ],
    userMood: {
      type: String,
      enum: ['happy', 'sad', 'excited', 'relaxed', 'thoughtful', 'scared', 'romantic', 'neutral'],
      default: null,
    },
    searchQuery: {
      type: String,
      default: null,
    },
    conversationStatus: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatbotConversation', chatbotConversationSchema);
