const Watchlist = require('../models/Watchlist');
const Content = require('../models/Content');

// @desc Get user's watchlist
// @route GET /api/watchlist
// @access Private
exports.getWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ user: req.userId })
      .populate({
        path: 'content',
        select: 'title posterUrl rating contentType',
      })
      .sort('-addedAt');

    res.status(200).json({ success: true, data: watchlist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Add to watchlist
// @route POST /api/watchlist/:contentId
// @access Private
exports.addToWatchlist = async (req, res) => {
  try {
    const { contentId } = req.params;

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Check if already in watchlist
    let watchlistItem = await Watchlist.findOne({
      user: req.userId,
      content: contentId,
    });

    if (watchlistItem) {
      return res.status(400).json({ success: false, message: 'Already in watchlist' });
    }

    watchlistItem = await Watchlist.create({
      user: req.userId,
      content: contentId,
    });

    await watchlistItem.populate({
      path: 'content',
      select: 'title posterUrl rating contentType',
    });

    res.status(201).json({ success: true, data: watchlistItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Remove from watchlist
// @route DELETE /api/watchlist/:contentId
// @access Private
exports.removeFromWatchlist = async (req, res) => {
  try {
    const watchlistItem = await Watchlist.findOneAndDelete({
      user: req.userId,
      content: req.params.contentId,
    });

    if (!watchlistItem) {
      return res.status(404).json({ success: false, message: 'Not in watchlist' });
    }

    res.status(200).json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Check if content is in watchlist
// @route GET /api/watchlist/check/:contentId
// @access Private
exports.checkWatchlist = async (req, res) => {
  try {
    const inWatchlist = await Watchlist.findOne({
      user: req.userId,
      content: req.params.contentId,
    });

    res.status(200).json({ success: true, inWatchlist: !!inWatchlist });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
