const Bowl = require('../models/Bowl');

/**
 * GET /api/bowls
 * Query: ?category=low-cal  (filter by category)
 *        ?q=keyword          (search by name or description)
 */
exports.getBowls = async (req, res) => {
  try {
    const { category, q } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    // Keyword search (case-insensitive) on name or description
    if (q && q.trim()) {
      filter.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } }
      ];
    }

    const bowls = await Bowl.find(filter).sort({ category: 1, _id: 1 });
    res.json(bowls);
  } catch (error) {
    console.error('Get bowls error:', error);
    res.status(500).json({ success: false, message: 'Failed to get bowls', error: error.message });
  }
};

/**
 * GET /api/bowls/featured
 * Query: ?limit=6  (default 6)
 * Returns bowls marked as isFeatured=true and inStock=true
 */
exports.getFeaturedBowls = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20); // max 20
    const bowls = await Bowl.find({ isFeatured: true, inStock: true })
      .sort({ _id: 1 })
      .limit(limit);

    res.json(bowls);
  } catch (error) {
    console.error('Get featured bowls error:', error);
    res.status(500).json({ success: false, message: 'Failed to get featured bowls', error: error.message });
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
