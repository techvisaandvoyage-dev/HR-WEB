const institutionService = require('../services/institutionService');

/**
 * @route   GET /api/institutions/search
 * @desc    Search Master Institution Database with multi-source fallback
 * @access  Public
 */
const searchInstitutions = async (req, res) => {
  try {
    const { q, country, state, city, type, limit, cursor } = req.query;

    const safeQ = typeof q === 'string' ? q.slice(0, 150) : '';
    const safeCountry = typeof country === 'string' ? country.slice(0, 80) : '';
    const safeState = typeof state === 'string' ? state.slice(0, 80) : '';
    const safeCity = typeof city === 'string' ? city.slice(0, 80) : '';
    const safeType = typeof type === 'string' ? type.slice(0, 50) : '';
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const safeCursor = parseInt(cursor, 10) || 0;

    const result = await institutionService.searchMasterInstitutions({
      q: safeQ,
      country: safeCountry,
      state: safeState,
      city: safeCity,
      type: safeType,
      limit: safeLimit,
      cursor: safeCursor
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in searchInstitutions controller:', error);
    return res.status(500).json({
      success: false,
      data: [],
      nextCursor: null,
      message: 'Internal server error while searching institutions.'
    });
  }
};

/**
 * @route   GET /api/institutions/:id
 * @desc    Get details of specific institution by ID
 * @access  Public
 */
const getInstitutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await institutionService.getInstitutionById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error in getInstitutionById controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving institution.'
    });
  }
};

module.exports = {
  searchInstitutions,
  getInstitutionById
};
