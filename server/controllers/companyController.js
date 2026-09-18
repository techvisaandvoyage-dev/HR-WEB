const companyService = require('../services/companyService');

/**
 * @route   GET /api/companies/search
 * @desc    Search companies via OpenCorporates & Master registry
 * @access  Public
 */
const searchCompanies = async (req, res) => {
  try {
    const { q, limit } = req.query;
    const result = await companyService.searchMasterCompanies(q, limit);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in searchCompanies controller:', error);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Internal server error while searching companies.'
    });
  }
};

module.exports = {
  searchCompanies
};
