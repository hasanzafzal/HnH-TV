const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'vip'],
    default: 'free',
  },
  monthlyPrice: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  autoRenew: {
    type: Boolean,
    default: true,
  },
  maxScreens: {
    type: Number,
    default: 1, // number of simultaneous streams
  },
  maxQuality: {
    type: String,
    enum: ['480p', '720p', '1080p', '4K'],
    default: '720p',
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

module.exports = mongoose.model('Subscription', SubscriptionSchema);
