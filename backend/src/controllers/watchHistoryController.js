const WatchHistory = require('../models/WatchHistory');
const Content = require('../models/Content');

// @desc Get user's watch history
// @route GET /api/watch-history
// @access Private
exports.getWatchHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const total = await WatchHistory.countDocuments({ user: req.userId });

    const history = await WatchHistory.find({ user: req.userId })
      .populate('content', 'title posterUrl contentType')
      .sort('-watchedAt')
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: history,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Add to watch history
// @route POST /api/watch-history/:contentId
// @access Private
exports.addToWatchHistory = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { duration, progress, isCompleted } = req.body;

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Update if exists, create if not
    let history = await WatchHistory.findOneAndUpdate(
      { user: req.userId, content: contentId },
      {
        watchedAt: new Date(),
        duration: duration || 0,
        progress: progress || 0,
        isCompleted: isCompleted || false,
      },
      { upsert: true, new: true }
    );

    await history.populate('content', 'title posterUrl contentType');

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get watch progress for a content
// @route GET /api/watch-history/:contentId
// @access Private
exports.getWatchProgress = async (req, res) => {
  try {
    const history = await WatchHistory.findOne({
      user: req.userId,
      content: req.params.contentId,
    });

    if (!history) {
      return res.status(200).json({
        success: true,
        data: { progress: 0, duration: 0, isCompleted: false },
      });
    }

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get continue watching list
// @route GET /api/watch-history/continue-watching
// @access Private
exports.getContinueWatching = async (req, res) => {
  try {
    const history = await WatchHistory.find({
      user: req.userId,
      isCompleted: false,
      progress: { $gt: 0, $lt: 100 },
    })
      .populate('content', 'title posterUrl contentType')
      .sort('-watchedAt')
      .limit(10);

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
