const Subscription = require('../models/Subscription');

// @desc Get user's subscription
// @route GET /api/subscription
// @access Private
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.userId });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found' });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Create or update subscription
// @route POST /api/subscription
// @access Private
exports.createSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, monthlyPrice } = req.body;

    let subscription = await Subscription.findOne({ user: req.userId });

    if (subscription) {
      subscription = await Subscription.findOneAndUpdate(
        { user: req.userId },
        { plan, billingCycle, monthlyPrice, startDate: new Date() },
        { new: true }
      );
    } else {
      subscription = await Subscription.create({
        user: req.userId,
        plan,
        billingCycle,
        monthlyPrice,
      });
    }

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Cancel subscription
// @route DELETE /api/subscription
// @access Private
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.userId });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found' });
    }

    subscription.isActive = false;
    await subscription.save();

    res.status(200).json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get subscription plans (Admin only)
// @route GET /api/subscription/plans
// @access Public
exports.getSubscriptionPlans = async (req, res) => {
  try {
    const plans = [
      {
        name: 'free',
        price: 0,
        maxScreens: 1,
        maxQuality: '480p',
        features: ['Limited content', 'Ad-supported', '1 screen'],
      },
      {
        name: 'basic',
        price: 99,
        maxScreens: 1,
        maxQuality: '720p',
        features: ['Full content library', 'No ads', '1 screen', 'HD quality'],
      },
      {
        name: 'premium',
        price: 199,
        maxScreens: 4,
        maxQuality: '1080p',
        features: ['Full content library', 'No ads', '4 screens', 'Full HD quality'],
      },
      {
        name: 'vip',
        price: 299,
        maxScreens: 6,
        maxQuality: '4K',
        features: ['Full content library', 'No ads', '6 screens', '4K quality', 'Priority support'],
      },
    ];

    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
