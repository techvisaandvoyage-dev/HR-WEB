const idscuService = require('../services/idscuService');

/**
 * @route   GET /api/education/search
 * @desc    Search schools, colleges, universities, and postsecondary institutions via IDSCU
 * @access  Public
 */
const searchInstitutions = async (req, res) => {
  try {
    const { q, country, sector, type, cursor } = req.query;

    // Validate parameters
    const safeQ = typeof q === 'string' ? q.slice(0, 150) : '';
    const safeCountry = typeof country === 'string' ? country.slice(0, 50) : '';
    let safeSector = typeof sector === 'string' ? sector.toUpperCase() : '';
    if (safeSector && safeSector !== 'K12' && safeSector !== 'POSTSECONDARY') {
      safeSector = '';
    }
    const safeType = typeof type === 'string' ? type.slice(0, 50) : '';
    const safeCursor = typeof cursor === 'string' ? cursor.slice(0, 200) : '';

    if (!safeQ && !safeCountry && !safeSector && !safeType && !safeCursor) {
      return res.status(200).json({
        success: true,
        data: [],
        nextCursor: null,
        message: 'Please provide search criteria.'
      });
    }

    const result = await idscuService.searchInstitutions({
      q: safeQ,
      country: safeCountry,
      sector: safeSector,
      type: safeType,
      cursor: safeCursor
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in searchInstitutions controller:', error);
    return res.status(500).json({
      success: false,
      data: [],
      nextCursor: null,
      message: 'Internal server error while searching education directory.'
    });
  }
};

/**
 * @route   GET /api/education/meta
 * @desc    Get directory release metadata
 * @access  Public
 */
const getMeta = async (req, res) => {
  try {
    const result = await idscuService.getMetadata();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getMeta controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving metadata.'
    });
  }
};

module.exports = {
  searchInstitutions,
  getMeta
};
