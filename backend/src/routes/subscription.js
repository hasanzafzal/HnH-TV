const express = require('express');
const router = express.Router();
const {
  getSubscription,
  createSubscription,
  cancelSubscription,
  getSubscriptionPlans,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/plans', getSubscriptionPlans);

// Protected routes
router.get('/', protect, getSubscription);
router.post('/', protect, createSubscription);
router.delete('/', protect, cancelSubscription);

module.exports = router;
