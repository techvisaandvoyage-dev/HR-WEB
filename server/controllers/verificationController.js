const fs = require('fs');
const path = require('path');
const Employer = require('../employer/models/Employer');
const { notifyAdminOnDocumentSubmission } = require('../services/verificationNotificationService');

// Document types mapping per category
const VERIFICATION_DOC_TYPES = {
  tax: [
    'gst_certificate',
    'pan_card_company',
    'tan_certificate',
    'itr_acknowledgement',
    'professional_tax_certificate'
  ],
  incorporation: [
    'certificate_of_incorporation',
    'cin_document',
    'moa_aoa',
    'partnership_deed',
    'llp_agreement',
    'msme_udyam_certificate',
    'shop_establishment_license',
    'gumasta_trade_license'
  ],
  address: [
    'address_proof'
  ],
  authorized_signatory: [
    'authorization_letter',
    'authorized_person_id'
  ],
  license: [
    'staffing_license'
  ],
  other: [
    'other'
  ]
};

// Friendly display labels
const DOC_TYPE_LABELS = {
  gst_certificate: 'GST Certificate',
  pan_card_company: 'Company PAN Card',
  tan_certificate: 'TAN Certificate',
  itr_acknowledgement: 'ITR Acknowledgement',
  professional_tax_certificate: 'Professional Tax Certificate',
  certificate_of_incorporation: 'Certificate of Incorporation (COI)',
  cin_document: 'CIN / MCA Master Data',
  moa_aoa: 'MOA & AOA',
  partnership_deed: 'Partnership Deed',
  llp_agreement: 'LLP Agreement',
  msme_udyam_certificate: 'MSME / Udyam Certificate',
  shop_establishment_license: 'Shop & Establishment License',
  gumasta_trade_license: 'Gumasta / Trade License',
  address_proof: 'Company Address Proof',
  authorization_letter: 'Board Authorization Letter',
  authorized_person_id: 'Authorized Signatory Govt ID',
  staffing_license: 'Staffing / Recruitment Agency License',
  other: 'Other Supporting Document'
};

// Ensure secure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, '../uploads/verification_docs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * @desc    Get current verification status & documents
 * @route   GET /api/verification/status
 * @access  Private (Employer/Consultant)
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id).select('verification companyName fullName email isConsultant');
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer account not found' });
    }

    const verification = employer.verification || {
      status: 'unverified',
      documents: []
    };

    const documents = Array.isArray(verification.documents) ? verification.documents : [];
    const taxDocs = documents.filter(d => d.category === 'tax');
    const incorporationDocs = documents.filter(d => d.category === 'incorporation');

    const counts = {
      tax: taxDocs.length,
      incorporation: incorporationDocs.length,
      address: documents.filter(d => d.category === 'address').length,
      authorized_signatory: documents.filter(d => d.category === 'authorized_signatory').length,
      license: documents.filter(d => d.category === 'license').length,
      other: documents.filter(d => d.category === 'other').length,
      total: documents.length
    };

    const hasTaxDoc = counts.tax > 0;
    const hasIncorporationDoc = counts.incorporation > 0;
    const currentStatus = verification.status || 'unverified';
    const canSubmit = hasTaxDoc && hasIncorporationDoc && (currentStatus === 'unverified' || currentStatus === 'rejected');

    res.json({
      success: true,
      status: currentStatus,
      verification,
      counts,
      hasTaxDoc,
      hasIncorporationDoc,
      canSubmit,
      rejectionReason: verification.rejectionReason || '',
      isConsultant: Boolean(employer.isConsultant),
      docTypeLabels: DOC_TYPE_LABELS
    });
  } catch (err) {
    console.error('getVerificationStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving verification status' });
  }
};

/**
 * @desc    Upload a verification document
 * @route   POST /api/verification/upload
 * @access  Private (Employer/Consultant)
 */
exports.uploadVerificationDocument = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id);
    if (!employer) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Employer account not found' });
    }

    // Ensure verification object exists
    if (!employer.verification) {
      employer.verification = { status: 'unverified', documents: [] };
    }

    const currentStatus = employer.verification.status || 'unverified';
    if (currentStatus === 'pending' || currentStatus === 'verified') {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: currentStatus === 'pending'
          ? 'Your verification is currently under review. Document uploads are locked.'
          : 'Your account is already verified.'
      });
    }

    const isDirectCloudUpload = Boolean(req.body.fileUrl);

    if (!req.file && !isDirectCloudUpload) {
      return res.status(400).json({ success: false, message: 'Please attach a document file or cloud fileUrl' });
    }

    const { category, docType } = req.body;
    if (!category || !docType) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'category and docType are required' });
    }

    // Validate category
    if (!VERIFICATION_DOC_TYPES[category]) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: `Invalid category: ${category}` });
    }

    // Validate docType belongs to category
    if (!VERIFICATION_DOC_TYPES[category].includes(docType)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: `Document type "${docType}" is not valid for category "${category}"`
      });
    }

    // Restrict staffing_license to consultants only
    if (docType === 'staffing_license' && !employer.isConsultant) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Staffing license is only applicable for consultant accounts' });
    }

    // Max 10 docs enforcement
    if (Array.isArray(employer.verification.documents) && employer.verification.documents.length >= 10) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Maximum 10 verification documents allowed' });
    }

    // Strict 1 document per category rule (Tax & Incorporation):
    // Only 1 document is allowed for Tax, and only 1 for Incorporation.
    // Any new upload replaces all previous documents in that category.
    if (category === 'tax' || category === 'incorporation') {
      const oldDocs = employer.verification.documents.filter(d => d.category === category);
      oldDocs.forEach(oldDoc => {
        if (oldDoc.fileUrl && oldDoc.fileUrl.startsWith('/api/verification/document/')) {
          const oldFilename = path.basename(oldDoc.fileUrl);
          const oldFilePath = path.join(UPLOAD_DIR, oldFilename);
          if (fs.existsSync(oldFilePath)) {
            try { fs.unlinkSync(oldFilePath); } catch (_) {}
          }
        }
      });
      employer.verification.documents = employer.verification.documents.filter(d => d.category !== category);
    } else {
      // For other optional categories, replace if same docType
      const existingIdx = employer.verification.documents.findIndex(
        d => d.category === category && d.docType === docType
      );
      if (existingIdx !== -1) {
        const oldDoc = employer.verification.documents[existingIdx];
        if (oldDoc.fileUrl && oldDoc.fileUrl.startsWith('/api/verification/document/')) {
          const oldFilename = path.basename(oldDoc.fileUrl);
          const oldFilePath = path.join(UPLOAD_DIR, oldFilename);
          if (fs.existsSync(oldFilePath)) {
            try { fs.unlinkSync(oldFilePath); } catch (_) {}
          }
        }
        employer.verification.documents.splice(existingIdx, 1);
      }
    }

    const docId = new (require('mongoose').Types.ObjectId)();
    
    let docRecord;
    if (isDirectCloudUpload) {
      // Firebase Storage upload
      docRecord = {
        _id: docId,
        category,
        docType,
        fileName: req.body.fileName || 'Verification_Document.pdf',
        fileUrl: req.body.fileUrl,
        localPath: '',
        mimeType: req.body.mimeType || 'application/pdf',
        fileSize: Number(req.body.fileSize) || 0,
        uploadedAt: new Date()
      };
    } else {
      // Local fallback upload
      const relativeFileUrl = `/api/verification/document/${docId}/file`;
      docRecord = {
        _id: docId,
        category,
        docType,
        fileName: req.file.originalname,
        fileUrl: relativeFileUrl,
        localPath: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedAt: new Date()
      };
    }

    employer.verification.documents.push(docRecord);

    // Auto-pending ONLY on initial unverified submission.
    // If status was 'rejected', DO NOT auto-submit! Keep status as 'rejected' so the employer
    // can review, replace, or delete documents and MUST explicitly click the submit button.
    if (currentStatus === 'unverified') {
      const hasTax = employer.verification.documents.some(d => d.category === 'tax');
      const hasIncorp = employer.verification.documents.some(d => d.category === 'incorporation');
      if (hasTax && hasIncorp) {
        employer.verification.status = 'pending';
        employer.verification.submittedAt = new Date();
        employer.verification.rejectionReason = '';

        // Notify admin via email asynchronously
        notifyAdminOnDocumentSubmission(employer).catch(e => {
          console.warn('[VerificationNotification] Admin email error on auto-submit:', e.message);
        });
      }
    }

    await employer.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: docRecord,
      verification: employer.verification
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    console.error('uploadVerificationDocument error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error uploading document' });
  }
};

/**
 * @desc    Delete a verification document
 * @route   DELETE /api/verification/document/:docId
 * @access  Private (Employer/Consultant)
 */
exports.deleteVerificationDocument = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id);
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const currentStatus = employer.verification?.status || 'unverified';
    if (currentStatus === 'pending' || currentStatus === 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete documents while verification is pending review or verified'
      });
    }

    const docId = req.params.docId;
    const docIdx = employer.verification?.documents?.findIndex(d => String(d._id) === String(docId));

    if (docIdx === -1 || docIdx === undefined) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const [deletedDoc] = employer.verification.documents.splice(docIdx, 1);

    // Delete file from disk if local
    if (deletedDoc.localPath) {
      const filePath = path.join(UPLOAD_DIR, deletedDoc.localPath);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
    }

    await employer.save();

    res.json({
      success: true,
      message: 'Document deleted successfully',
      deletedDocId: docId,
      verification: employer.verification
    });
  } catch (err) {
    console.error('deleteVerificationDocument error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting document' });
  }
};

/**
 * @desc    Submit verification documents for admin review
 * @route   POST /api/verification/submit
 * @access  Private (Employer/Consultant)
 */
exports.submitVerification = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id);
    if (!employer) {
      return res.status(404).json({ success: false, message: 'Employer not found' });
    }

    const currentStatus = employer.verification?.status || 'unverified';
    if (currentStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Verification has already been submitted and is pending review' });
    }
    if (currentStatus === 'verified') {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    const documents = employer.verification?.documents || [];
    const hasTaxDoc = documents.some(d => d.category === 'tax');
    const hasIncorporationDoc = documents.some(d => d.category === 'incorporation');

    const missing = [];
    if (!hasTaxDoc) missing.push('Tax Document (GST / Company PAN / TAN / ITR)');
    if (!hasIncorporationDoc) missing.push('Incorporation Document (COI / CIN / Udyam / Shop License)');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REQUIRED_DOCS',
        missing,
        message: `Please upload at least one Tax document and one Incorporation document before submitting. Missing: ${missing.join(', ')}`
      });
    }

    employer.verification.status = 'pending';
    employer.verification.submittedAt = new Date();
    employer.verification.rejectionReason = ''; // Clear previous rejection reason

    await employer.save();

    // Notify admin via email asynchronously
    notifyAdminOnDocumentSubmission(employer).catch(e => {
      console.warn('[VerificationNotification] Admin email error on submit:', e.message);
    });

    res.json({
      success: true,
      message: 'Documents submitted successfully for verification! Our team will review your account shortly.',
      verification: employer.verification
    });
  } catch (err) {
    console.error('submitVerification error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting verification' });
  }
};

/**
 * @desc    Stream / download an authenticated document file for employer owner
 * @route   GET /api/verification/document/:docId/file
 * @access  Private (Employer/Consultant)
 */
exports.streamDocumentFile = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id);
    if (!employer) {
      return res.status(404).send('Account not found');
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
    console.error('streamDocumentFile error:', err);
    res.status(500).send('Error streaming document file');
  }
};

module.exports.VERIFICATION_DOC_TYPES = VERIFICATION_DOC_TYPES;
module.exports.DOC_TYPE_LABELS = DOC_TYPE_LABELS;
