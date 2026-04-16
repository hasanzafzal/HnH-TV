const Content = require('../models/Content');
const Review = require('../models/Review');

// @desc Get all content with filters
// @route GET /api/content
// @access Public
exports.getAllContent = async (req, res) => {
  try {
    const { type, genre, sort, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (type) query.contentType = type;
    if (genre) query.genre = genre;

    const skip = (page - 1) * limit;
    const total = await Content.countDocuments(query);

    const content = await Content.find(query)
      .populate('genre', 'name')
      .sort(sort || '-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: content.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: content,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get single content by ID
// @route GET /api/content/:id
// @access Public
exports.getContentById = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id).populate('genre', 'name');

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    // Increment view count
    content.views += 1;
    await content.save();

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Create content (Admin only)
// @route POST /api/content
// @access Private/Admin
exports.createContent = async (req, res) => {
  try {
    const content = await Content.create(req.body);
    await content.populate('genre', 'name');

    res.status(201).json({ success: true, data: content });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update content (Admin only)
// @route PUT /api/content/:id
// @access Private/Admin
exports.updateContent = async (req, res) => {
  try {
    let content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    content = await Content.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('genre', 'name');

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Delete content (Admin only)
// @route DELETE /api/content/:id
// @access Private/Admin
exports.deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    await Content.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Search content
// @route GET /api/content/search/:query
// @access Public
exports.searchContent = async (req, res) => {
  try {
    const { query, type } = req.params;
    const searchQuery = {
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { cast: { $regex: query, $options: 'i' } },
        { directors: { $regex: query, $options: 'i' } },
      ],
    };

    if (type) searchQuery.contentType = type;

    const content = await Content.find(searchQuery)
      .populate('genre', 'name')
      .limit(20);

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get trending content
// @route GET /api/content/trending
// @access Public
exports.getTrendingContent = async (req, res) => {
  try {
    const content = await Content.find({ isActive: true })
      .populate('genre', 'name')
      .sort('-views')
      .limit(10);

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get content by genre
// @route GET /api/content/genre/:genreId
// @access Public
exports.getContentByGenre = async (req, res) => {
  try {
    const content = await Content.find({
      isActive: true,
      genre: req.params.genreId,
    })
      .populate('genre', 'name')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: content });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
