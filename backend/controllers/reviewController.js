const Review = require('../models/Review');
const Content = require('../models/Content');

// @desc Get reviews for content
// @route GET /api/reviews/:contentId
// @access Public
exports.getContentReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments({ content: req.params.contentId });

    const reviews = await Review.find({ content: req.params.contentId })
      .populate('user', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: reviews,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Create review
// @route POST /api/reviews/:contentId
// @access Private
exports.createReview = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { rating, title, comment } = req.body;

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check if user already reviewed
    let existingReview = await Review.findOne({
      user: req.userId,
      content: contentId,
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Already reviewed this content' });
    }

    const review = await Review.create({
      user: req.userId,
      content: contentId,
      rating,
      title,
      comment,
    });

    await review.populate('user', 'name');

    // Update content rating average
    const allReviews = await Review.find({ content: contentId });
    const avgRating = (
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    ).toFixed(1);
    await Content.findByIdAndUpdate(contentId, { rating: avgRating });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update review
// @route PUT /api/reviews/:reviewId
// @access Private
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    review = await Review.findByIdAndUpdate(req.params.reviewId, req.body, {
      new: true,
      runValidators: true,
    }).populate('user', 'name');

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Delete review
// @route DELETE /api/reviews/:reviewId
// @access Private
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);

    // Recalculate average rating
    const allReviews = await Review.find({ content: review.content });
    if (allReviews.length > 0) {
      const avgRating = (
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      ).toFixed(1);
      await Content.findByIdAndUpdate(review.content, { rating: avgRating });
    } else {
      await Content.findByIdAndUpdate(review.content, { rating: 0 });
    }

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
