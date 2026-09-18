const occupationService = require('../services/occupationService');

/**
 * @route   GET /api/occupations/search
 * @desc    Search ESCO occupations / job titles
 * @access  Public
 */
const searchOccupations = async (req, res) => {
  try {
    const { q, limit } = req.query;
    const result = await occupationService.searchEscoOccupations(q, limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in searchOccupations controller:', error);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Internal server error while searching occupations.'
    });
  }
};

module.exports = {
  searchOccupations
};
