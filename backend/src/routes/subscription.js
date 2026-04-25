const express = require('express');
const router = express.Router();
const {
  getSubscription,
  createSubscription,
  cancelSubscription,
  getSubscriptionPlans,
  getAllSubscriptions,
  updateUserSubscription,
  deleteUserSubscription,
} = require('../controllers/subscriptionController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/plans', getSubscriptionPlans);

// Protected routes
router.get('/', protect, getSubscription);
router.post('/', protect, createSubscription);
router.delete('/', protect, cancelSubscription);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllSubscriptions);
router.put('/admin/:userId', protect, adminOnly, updateUserSubscription);
router.delete('/admin/:userId', protect, adminOnly, deleteUserSubscription);

module.exports = router;
