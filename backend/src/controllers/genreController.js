const Genre = require('../models/Genre');

// @desc Get all genres
// @route GET /api/genres
// @access Public
exports.getAllGenres = async (req, res) => {
  try {
    const genres = await Genre.find({ isActive: true });
    res.status(200).json({ success: true, data: genres });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Get single genre
// @route GET /api/genres/:id
// @access Public
exports.getGenreById = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({ success: false, message: 'Genre not found' });
    }

    res.status(200).json({ success: true, data: genre });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Create genre (Admin only)
// @route POST /api/genres
// @access Private/Admin
exports.createGenre = async (req, res) => {
  try {
    const genre = await Genre.create(req.body);
    res.status(201).json({ success: true, data: genre });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update genre (Admin only)
// @route PUT /api/genres/:id
// @access Private/Admin
exports.updateGenre = async (req, res) => {
  try {
    let genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({ success: false, message: 'Genre not found' });
    }

    genre = await Genre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: genre });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Delete genre (Admin only)
// @route DELETE /api/genres/:id
// @access Private/Admin
exports.deleteGenre = async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);

    if (!genre) {
      return res.status(404).json({ success: false, message: 'Genre not found' });
    }

    await Genre.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Genre deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
