const fs = require('fs');
const path = require('path');
const Employer = require('../employer/models/Employer');
const { 
  notifyEmployerOnApproval, 
  notifyEmployerOnRejection,
  sendVerificationStatusEmail 
} = require('../services/verificationNotificationService');
const { DOC_TYPE_LABELS } = require('./verificationController');

const UPLOAD_DIR = path.join(__dirname, '../uploads/verification_docs');

/**
 * @desc    Get paginated verification list with stats for Admin
 * @route   GET /api/admin/verifications
 * @access  Private (Admin)
 */
exports.getAdminVerifications = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Filter by verification status
    if (status && status !== 'All') {
      filter['verification.status'] = status.toLowerCase();
    }

    // Filter by type (employer or consultant)
    if (type && type !== 'All') {
      if (type === 'consultant') {
        filter.isConsultant = true;
      } else if (type === 'employer' || type === 'company') {
        filter.isConsultant = { $ne: true };
      }
    }

    // Search by companyName, fullName, or email
    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { companyName: { $regex: s, $options: 'i' } },
        { fullName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { mobile: { $regex: s, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageLimit = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * pageLimit;

    // Run query and counts in parallel
    const [employers, totalMatching, statsCounts] = await Promise.all([
      Employer.find(filter)
        .select('employerId fullName email mobile companyName companyLogo isConsultant createdAt verification')
        .sort({ 'verification.submittedAt': -1, updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      Employer.countDocuments(filter),
      Employer.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$verification.status', 'unverified'] },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const counts = {
      all: 0,
      unverified: 0,
      pending: 0,
      verified: 0,
      rejected: 0
    };

    statsCounts.forEach(sc => {
      const st = (sc._id || 'unverified').toLowerCase();
      if (counts[st] !== undefined) counts[st] = sc.count;
      counts.all += sc.count;
    });

    const enrichedEmployers = employers.map(emp => {
      const verif = emp.verification || { status: 'unverified', documents: [] };
      const docs = Array.isArray(verif.documents) ? verif.documents : [];
      return {
        _id: emp._id,
        employerId: emp.employerId,
        fullName: emp.fullName,
        email: emp.email,
        mobile: emp.mobile,
        companyName: emp.companyName || emp.fullName,
        companyLogo: emp.companyLogo,
        isConsultant: Boolean(emp.isConsultant),
        registeredAt: emp.createdAt,
        verificationStatus: verif.status || 'unverified',
        submittedAt: verif.submittedAt || null,
        reviewedAt: verif.reviewedAt || null,
        rejectionReason: verif.rejectionReason || '',
        documentsCount: docs.length,
        hasTaxDoc: docs.some(d => d.category === 'tax'),
        hasIncorporationDoc: docs.some(d => d.category === 'incorporation'),
        documentsSummary: {
          tax: docs.filter(d => d.category === 'tax').map(d => DOC_TYPE_LABELS[d.docType] || d.docType),
          incorporation: docs.filter(d => d.category === 'incorporation').map(d => DOC_TYPE_LABELS[d.docType] || d.docType),
          additional: docs.filter(d => d.category !== 'tax' && d.category !== 'incorporation').map(d => DOC_TYPE_LABELS[d.docType] || d.docType)
        }
      };
    });

    res.json({
      success: true,
      data: enrichedEmployers,
      pagination: {
        total: totalMatching,
        page: pageNum,
        limit: pageLimit,
        pages: Math.ceil(totalMatching / pageLimit)
      },
      counts
    });
  } catch (err) {
    console.error('getAdminVerifications error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving verifications' });
  }
};

/**
 * @desc    Get detailed verification record for a specific employer
 * @route   GET /api/admin/verifications/:userId
 * @access  Private (Admin)
 */
exports.getAdminVerificationDetails = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.userId)
      .select('employerId fullName email mobile countryCode accountType companyName companyLogo isConsultant hiringFor industry employees designation location aboutCompany website createdAt verification')
      .lean();

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const verification = employer.verification || { status: 'unverified', documents: [] };
    const rawDocs = Array.isArray(verification.documents) ? verification.documents : [];

    const formatDoc = (d) => ({
      _id: d._id,
      category: d.category,
      docType: d.docType,
      docTypeLabel: DOC_TYPE_LABELS[d.docType] || d.docType,
      fileName: d.fileName,
      fileUrl: (d.fileUrl && d.fileUrl.startsWith('http')) ? d.fileUrl : `/api/admin/verifications/${employer._id}/documents/${d._id}/file`,
      mimeType: d.mimeType,
      fileSize: d.fileSize || 0,
      uploadedAt: d.uploadedAt
    });

    const groupedDocuments = {
      tax: rawDocs.filter(d => d.category === 'tax').map(formatDoc),
      incorporation: rawDocs.filter(d => d.category === 'incorporation').map(formatDoc),
      additional: rawDocs.filter(d => d.category !== 'tax' && d.category !== 'incorporation').map(formatDoc)
    };

    res.json({
      success: true,
      data: {
        _id: employer._id,
        employerId: employer.employerId,
        companyName: employer.companyName || employer.fullName,
        fullName: employer.fullName,
        email: employer.email,
        mobile: employer.mobile,
        countryCode: employer.countryCode || '+91',
        isConsultant: Boolean(employer.isConsultant),
        industry: employer.industry || '',
        employees: employer.employees || '',
        location: employer.location || '',
        website: employer.website || '',
        aboutCompany: employer.aboutCompany || '',
        companyLogo: employer.companyLogo || '',
        registeredAt: employer.createdAt,
        status: verification.status || 'unverified',
        submittedAt: verification.submittedAt || null,
        reviewedAt: verification.reviewedAt || null,
        rejectionReason: verification.rejectionReason || '',
        verifiedAt: verification.verifiedAt || null,
        documents: groupedDocuments,
        totalDocs: rawDocs.length,
        hasRequiredTax: groupedDocuments.tax.length > 0,
        hasRequiredIncorporation: groupedDocuments.incorporation.length > 0
      }
    });
  } catch (err) {
    console.error('getAdminVerificationDetails error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving verification details' });
  }
};

/**
 * @desc    Approve employer verification
 * @route   PATCH /api/admin/verifications/:userId/approve
 * @access  Private (Admin)
 */
exports.approveVerification = async (req, res) => {
  try {
    const adminIdentity = (req.admin?.id && require('mongoose').Types.ObjectId.isValid(req.admin.id))
      ? req.admin.id
      : (req.admin?.email || 'admin');

    const updateFields = {
      'verification.status': 'verified',
      'verification.verifiedAt': new Date(),
      'verification.reviewedAt': new Date(),
      'verification.reviewedBy': adminIdentity,
      'verification.rejectionReason': ''
    };

    const employer = await Employer.findByIdAndUpdate(
      req.params.userId,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    // Trigger notification email asynchronously to employer
    try {
      notifyEmployerOnApproval(employer).catch(e => {
        console.warn('[AdminVerification] Mail error on approve:', e.message);
      });
    } catch (mailErr) {
      console.warn('[AdminVerification] Synchronous mail error:', mailErr.message);
    }

    res.json({
      success: true,
      message: `Account verification for "${employer.companyName || employer.fullName}" has been approved!`,
      verification: employer.verification
    });
  } catch (err) {
    console.error('approveVerification error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error approving verification' });
  }
};

/**
 * @desc    Reject employer verification with reason
 * @route   PATCH /api/admin/verifications/:userId/reject
 * @access  Private (Admin)
 */
exports.rejectVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A rejection reason is mandatory' });
    }

    const adminIdentity = (req.admin?.id && require('mongoose').Types.ObjectId.isValid(req.admin.id))
      ? req.admin.id
      : (req.admin?.email || 'admin');

    const updateFields = {
      'verification.status': 'rejected',
      'verification.rejectionReason': reason.trim(),
      'verification.reviewedAt': new Date(),
      'verification.reviewedBy': adminIdentity
    };

    const employer = await Employer.findByIdAndUpdate(
      req.params.userId,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    // Trigger notification email asynchronously to employer with rejection reason
    try {
      notifyEmployerOnRejection(employer, reason.trim()).catch(e => {
        console.warn('[AdminVerification] Mail error on reject:', e.message);
      });
    } catch (mailErr) {
      console.warn('[AdminVerification] Synchronous mail error:', mailErr.message);
    }

    res.json({
      success: true,
      message: `Verification rejected with feedback for "${employer.companyName || employer.fullName}"`,
      verification: employer.verification
    });
  } catch (err) {
    console.error('rejectVerification error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error rejecting verification' });
  }
};

/**
 * @desc    Revoke employer verification / set back to unverified
 * @route   PATCH /api/admin/verifications/:userId/unverify
 * @access  Private (Admin)
 */
exports.unverifyVerification = async (req, res) => {
  try {
    const updateFields = {
      'verification.status': 'unverified',
      'verification.verifiedAt': null,
      'verification.rejectionReason': ''
    };

    const employer = await Employer.findByIdAndUpdate(
      req.params.userId,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    res.json({
      success: true,
      message: `Account verification revoked for "${employer.companyName || employer.fullName}"`,
      verification: employer.verification
    });
  } catch (err) {
    console.error('unverifyVerification error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error revoking verification' });
  }
};

/**
 * @desc    Stream / download document file for Admin review
 * @route   GET /api/admin/verifications/:userId/documents/:docId/file
 * @access  Private (Admin)
 */
exports.streamAdminDocumentFile = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.userId);
    if (!employer) {
      return res.status(404).send('Employer not found');
    }

    const docId = req.params.docId;
    const doc = employer.verification?.documents?.find(d => String(d._id) === String(docId));

    if (!doc) {
      return res.status(404).send('Document not found');
    }

    if (doc.fileUrl && doc.fileUrl.startsWith('http')) {
      return res.redirect(doc.fileUrl);
    }

    const filePath = doc.localPath ? path.join(UPLOAD_DIR, doc.localPath) : null;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).send('File not found on server');
    }

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error('streamAdminDocumentFile error:', err);
    res.status(500).send('Error streaming document file');
  }
};
