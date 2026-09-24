const idscuService = require('../services/idscuService');
const { SCHOOL_BOARDS, UGC_COURSES } = require('../data/educationData');

/**
 * @route   GET /api/education/boards
 * @desc    Get all Indian Central, State, and International School Boards with search & filtering
 * @access  Public
 */
const getSchoolBoards = async (req, res) => {
  try {
    const { q, state, type } = req.query;
    let filtered = SCHOOL_BOARDS;

    if (state && state.trim()) {
      const s = state.trim().toLowerCase();
      filtered = filtered.filter(b => b.state.toLowerCase().includes(s));
    }

    if (type && type.trim()) {
      const t = type.trim().toLowerCase();
      filtered = filtered.filter(b => b.type.toLowerCase() === t);
    }

    if (q && q.trim()) {
      const query = q.trim().toLowerCase();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(query) ||
        b.code.toLowerCase().includes(query) ||
        b.state.toLowerCase().includes(query)
      );
    }

    return res.status(200).json({
      success: true,
      total: filtered.length,
      data: filtered
    });
  } catch (error) {
    console.error('Error in getSchoolBoards controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve school boards.'
    });
  }
};

/**
 * @route   GET /api/education/courses
 * @desc    Get UGC / AISHE Courses by category, stream, or search query
 * @access  Public
 */
const getCourses = async (req, res) => {
  try {
    const { category, q, stream } = req.query;

    let coursesList = [];

    if (category && UGC_COURSES[category.toLowerCase()]) {
      coursesList = UGC_COURSES[category.toLowerCase()].map(c => ({
        ...c,
        category: category.toLowerCase()
      }));
    } else {
      // Flatten all categories
      Object.keys(UGC_COURSES).forEach(cat => {
        UGC_COURSES[cat].forEach(c => {
          coursesList.push({
            ...c,
            category: cat
          });
        });
      });
    }

    if (stream && stream.trim()) {
      const s = stream.trim().toLowerCase();
      coursesList = coursesList.filter(c => c.stream.toLowerCase().includes(s));
    }

    if (q && q.trim()) {
      const query = q.trim().toLowerCase();
      coursesList = coursesList.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.stream.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }

    return res.status(200).json({
      success: true,
      total: coursesList.length,
      data: coursesList
    });
  } catch (error) {
    console.error('Error in getCourses controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve courses.'
    });
  }
};

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
  getSchoolBoards,
  getCourses,
  searchInstitutions,
  getMeta
};
