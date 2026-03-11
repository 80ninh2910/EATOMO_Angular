const Bowl = require('../models/Bowl');

/**
 * GET /api/bowls
 * Query: ?category=low-cal
 */
exports.getBowls = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    const bowls = await Bowl.find(filter).sort({ category: 1, _id: 1 });
    res.json(bowls);
  } catch (error) {
    console.error('Get bowls error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bowls', error: error.message });
  }
};

/**
 * GET /api/bowls/:id
 */
exports.getBowlById = async (req, res) => {
  try {
    const bowl = await Bowl.findById(req.params.id);

    if (!bowl) {
      return res.status(404).json({ success: false, message: 'Bowl not found' });
    }

    res.json(bowl);
  } catch (error) {
    console.error('Get bowl error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bowl', error: error.message });
  }
};
