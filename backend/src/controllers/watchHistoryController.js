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

// @desc Save / update watch progress
// @route POST /api/watch-history/:contentId
// @access Private
exports.addToWatchHistory = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { duration, progress, watchedSeconds, isCompleted, seasonNumber, episodeNumber } = req.body;

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Build the filter — episode-aware for TV series
    const filter = {
      user: req.userId,
      content: contentId,
      seasonNumber: seasonNumber ?? null,
      episodeNumber: episodeNumber ?? null,
    };

    const update = {
      watchedAt: new Date(),
      duration: duration || 0,
      watchedSeconds: watchedSeconds || 0,
      progress: progress || 0,
      isCompleted: isCompleted || false,
    };

    let history = await WatchHistory.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
    });

    await history.populate('content', 'title posterUrl contentType');

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get watch progress for a specific content (and optional episode)
// @route GET /api/watch-history/:contentId?season=1&episode=2
// @access Private
exports.getWatchProgress = async (req, res) => {
  try {
    const { season, episode } = req.query;

    const filter = {
      user: req.userId,
      content: req.params.contentId,
      seasonNumber: season ? parseInt(season) : null,
      episodeNumber: episode ? parseInt(episode) : null,
    };

    const history = await WatchHistory.findOne(filter);

    if (!history) {
      return res.status(200).json({
        success: true,
        data: { progress: 0, duration: 0, watchedSeconds: 0, isCompleted: false },
      });
    }

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get continue watching list (not completed, progress > 5%)
// @route GET /api/watch-history/continue-watching
// @access Private
exports.getContinueWatching = async (req, res) => {
  try {
    const history = await WatchHistory.find({
      user: req.userId,
      progress: { $gt: 5 },
    })
      .populate('content', 'title posterUrl bannerUrl contentType duration seasons')
      .sort('-watchedAt')
      .limit(10);

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
