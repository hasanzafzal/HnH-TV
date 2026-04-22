const Download = require('../models/Download');
const Content = require('../models/Content');

// @desc Get user's downloads
// @route GET /api/downloads
// @access Private
exports.getDownloads = async (req, res) => {
  try {
    const downloads = await Download.find({ userId: req.userId })
      .populate('contentId', 'title posterUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: downloads.length,
      data: downloads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get offline available downloads
// @route GET /api/downloads/offline
// @access Private
exports.getOfflineDownloads = async (req, res) => {
  try {
    const downloads = await Download.find({
      userId: req.userId,
      isOfflineAvailable: true,
      expiryDate: { $gt: new Date() },
    })
      .populate('contentId', 'title posterUrl videoUrl')
      .sort({ downloadedAt: -1 });

    res.status(200).json({
      success: true,
      count: downloads.length,
      data: downloads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Start download
// @route POST /api/downloads
// @access Private
exports.startDownload = async (req, res) => {
  try {
    const { contentId, quality } = req.body;

    // Validate content exists and is downloadable
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    if (!content.downloadable) {
      return res.status(403).json({
        success: false,
        message: 'This content cannot be downloaded',
      });
    }

    // Check if quality is available
    if (!content.qualityOptions.includes(quality)) {
      return res.status(400).json({
        success: false,
        message: `Quality ${quality} not available for this content`,
      });
    }

    // Check for existing download
    let download = await Download.findOne({
      userId: req.userId,
      contentId,
      quality,
    });

    if (download) {
      if (download.isOfflineAvailable && download.expiryDate > new Date()) {
        return res.status(200).json({
          success: true,
          message: 'Content already downloaded',
          data: download,
        });
      }
      // Update if expired
      download.status = 'downloading';
      download.progress = 0;
      download.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Create new download
      download = new Download({
        userId: req.userId,
        contentId,
        quality,
        status: 'downloading',
      });
    }

    await download.save();

    // Simulate download progress (in production, use stream/job queue)
    simulateDownloadProgress(download._id);

    res.status(201).json({
      success: true,
      message: 'Download started',
      data: download,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get download progress
// @route GET /api/downloads/:id/progress
// @access Private
exports.getDownloadProgress = async (req, res) => {
  try {
    const download = await Download.findById(req.params.id);

    if (!download) {
      return res.status(404).json({
        success: false,
        message: 'Download not found',
      });
    }

    if (download.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this download',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: download._id,
        status: download.status,
        progress: download.progress,
        quality: download.quality,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Delete download
// @route DELETE /api/downloads/:id
// @access Private
exports.deleteDownload = async (req, res) => {
  try {
    const download = await Download.findById(req.params.id);

    if (!download) {
      return res.status(404).json({
        success: false,
        message: 'Download not found',
      });
    }

    if (download.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this download',
      });
    }

    await Download.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Download deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Cancel download
// @route POST /api/downloads/:id/cancel
// @access Private
exports.cancelDownload = async (req, res) => {
  try {
    const download = await Download.findById(req.params.id);

    if (!download) {
      return res.status(404).json({
        success: false,
        message: 'Download not found',
      });
    }

    if (download.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this download',
      });
    }

    download.status = 'failed';
    download.progress = 0;
    await download.save();

    res.status(200).json({
      success: true,
      message: 'Download cancelled',
      data: download,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Simulate download progress (replace with actual implementation)
function simulateDownloadProgress(downloadId) {
  let progress = 0;
  const interval = setInterval(async () => {
    progress += Math.random() * 30;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      await Download.findByIdAndUpdate(downloadId, {
        status: 'completed',
        progress: 100,
        isOfflineAvailable: true,
        downloadedAt: new Date(),
      });
    } else {
      await Download.findByIdAndUpdate(downloadId, {
        progress: Math.min(progress, 99),
      });
    }
  }, 2000);
}
