import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { uploadFileToStorage, deleteFileFromStorage } from '../../../utils/firebaseStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FINAL_UPLOAD_TARGET_BYTES = 295 * 1024; // Strictly under 300 KB (295 KB)

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DEFAULT_KYC_CONFIG = {
  pageTitle: 'Get your company verified',
  pageSubtitle: 'Upload 2 documents. Our team reviews them and your jobs go live for candidates.',
  breadcrumbLabel: '/ Employer Verification',
  step1Label: 'Company KYC document',
  step2Label: 'User KYC document',
  step3Label: 'Submit for review',
  step3ResubmitLabel: 'Re-submit for review',
  verifiedBanner: {
    title: 'Account Verified Successfully!',
    description: 'Your business is verified. All your active jobs are now live and visible to candidates with the green Verified Employer badge.',
    badgeText: 'Verified'
  },
  pendingBanner: {
    title: 'Verification Under Review',
    description: 'Document uploads are locked while our compliance team reviews your business registration.',
    badgeText: 'Under Review'
  },
  rejectedBanner: {
    title: 'Verification Submission Rejected',
    descriptionPrefix: 'Reason from Admin:',
    defaultReason: 'Documents did not meet criteria. Please re-upload clearer documents.',
    helperText: 'Remove the rejected documents below, upload updated documents under 300 KB, and re-submit for review.',
    badgeText: 'Verification Rejected'
  },
  unverifiedBadgeText: 'Unverified',
  taxDoc: {
    title: 'Company KYC document',
    helpText: 'Any one is enough. Document must be in your registered company name.',
    isMandatory: true,
    requiredBadgeText: 'Required',
    optionalBadgeText: 'Optional',
    doneBadgeText: 'Done',
    options: [
      { type: 'gst_certificate', label: 'GST Certificate', fullLabel: 'GST Registration Certificate (Form GST REG-06)', enabled: true },
      { type: 'pan_card_company', label: 'Company PAN', fullLabel: 'Company PAN Card', enabled: true },
      { type: 'certificate_of_incorporation', label: 'Certificate of Incorporation', fullLabel: 'Certificate of Incorporation (COI)', enabled: true },
      { type: 'msme_udyam_certificate', label: 'Udyam / MSME', fullLabel: 'Udyam / MSME Registration Certificate', enabled: true },
      { type: 'cin_document', label: 'CIN / MCA Master Data', fullLabel: 'CIN / MCA Company Master Data', enabled: true },
      { type: 'shop_establishment_license', label: 'Shop & Establishment', fullLabel: 'Shop & Establishment License', enabled: true },
      { type: 'gumasta_trade_license', label: 'Trade License', fullLabel: 'Gumasta / Trade License', enabled: true },
      { type: 'tan_certificate', label: 'TAN', fullLabel: 'TAN Allotment Certificate', enabled: true },
      { type: 'itr_acknowledgement', label: 'ITR-V', fullLabel: 'Latest ITR-V / Acknowledgement', enabled: true },
      { type: 'llp_agreement', label: 'LLP Agreement', fullLabel: 'LLP Agreement', enabled: true },
      { type: 'partnership_deed', label: 'Partnership Deed', fullLabel: 'Registered Partnership Deed', enabled: true }
    ]
  },
  incorpDoc: {
    title: 'User KYC document',
    helpText: 'Identity proof of the authorized person, founder, or employer. Pick one and upload it.',
    isMandatory: true,
    requiredBadgeText: 'Required',
    optionalBadgeText: 'Optional',
    doneBadgeText: 'Done',
    options: [
      { type: 'aadhaar_card', label: 'Aadhaar Card', fullLabel: 'Aadhaar Card (Front & Back)', enabled: true },
      { type: 'pan_card_personal', label: 'Personal PAN', fullLabel: 'Personal PAN Card of Signatory / Founder', enabled: true },
      { type: 'passport', label: 'Passport', fullLabel: 'Passport (First & Last Page)', enabled: true },
      { type: 'voter_id', label: 'Voter ID', fullLabel: 'Voter Identity Card', enabled: true },
      { type: 'driving_license', label: 'Driving License', fullLabel: 'Driving License', enabled: true },
      { type: 'authorized_person_id', label: 'Signatory ID', fullLabel: 'Authorized Signatory Identity Proof', enabled: true },
      { type: 'authorization_letter', label: 'Authorization Letter', fullLabel: 'Company Authorization Letter / Board Resolution', enabled: true }
    ]
  },
  extraDoc: {
    title: 'Extra documents',
    helpText: 'Address proof, authorization letter, signatory ID, staffing license. Speeds up approval.',
    isMandatory: false,
    requiredBadgeText: 'Required',
    optionalBadgeText: 'Optional',
    options: [
      { type: 'address_proof', label: 'Address Proof', category: 'address', fullLabel: 'Company Address Proof (Utility Bill / Lease)', enabled: true },
      { type: 'authorization_letter', label: 'Authorization Letter', category: 'authorized_signatory', fullLabel: 'Board / Owner Authorization Letter', enabled: true },
      { type: 'authorized_person_id', label: 'Signatory ID', category: 'authorized_signatory', fullLabel: 'Authorized Signatory Govt ID', enabled: true },
      { type: 'staffing_license', label: 'Staffing License', category: 'license', consultantOnly: true, fullLabel: 'Staffing / Recruitment Agency License', enabled: true },
      { type: 'other', label: 'Other Document', category: 'other', fullLabel: 'Other Supporting Business Proof', enabled: true }
    ]
  },
  progressCard: {
    title: 'Your progress',
    submitButtonText: 'Submit for verification',
    resubmitButtonText: 'Re-submit for verification',
    submittingText: 'Submitting...',
    resubmittingText: 'Re-submitting...',
    requirementsMetText: 'All requirements met! Ready to submit.',
    resubmitReadyText: 'Updated documents ready! Click to re-submit for review.',
    lockedPendingTitle: 'Verification In Review',
    lockedPendingDesc: 'Our team is reviewing your documents.',
    lockedVerifiedTitle: 'Account Verified',
    lockedVerifiedDesc: 'All candidate visibility privileges are active.'
  },
  benefitsCard: {
    title: 'After approval you get',
    benefits: [
      'Green Verified Employer badge',
      'Your jobs visible to all candidates',
      'Tracked application links enabled'
    ]
  }
};

const TAX_DOC_OPTIONS = DEFAULT_KYC_CONFIG.taxDoc.options;
const INCORPORATION_DOC_OPTIONS = DEFAULT_KYC_CONFIG.incorpDoc.options;
const EXTRA_DOC_OPTIONS = DEFAULT_KYC_CONFIG.extraDoc.options;

export default function VerificationPage({ employerProfile, portalConfig: propPortalConfig }) {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [portalConfig, setPortalConfig] = useState(propPortalConfig || null);
  const [kycConfig, setKycConfig] = useState(DEFAULT_KYC_CONFIG);
  const [selectedTaxDocType, setSelectedTaxDocType] = useState('gst_certificate');
  const [selectedIncorpDocType, setSelectedIncorpDocType] = useState('aadhaar_card');
  const [selectedExtraDocType, setSelectedExtraDocType] = useState('address_proof');
  const [extraDocsOpen, setExtraDocsOpen] = useState(false);

  // Upload & Compression States
  const [compressingDocType, setCompressingDocType] = useState(null);
  const [compressingMessage, setCompressingMessage] = useState('');
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [toast, setToast] = useState(null);

  // Drag over states
  const [dragOverTax, setDragOverTax] = useState(false);
  const [dragOverIncorp, setDragOverIncorp] = useState(false);
  const [dragOverExtra, setDragOverExtra] = useState(false);

  const taxFileInputRef = useRef(null);
  const incorpFileInputRef = useRef(null);
  const extraFileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getAuthToken = () => localStorage.getItem('employerToken') || '';

  const fetchKycConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/homepage`);
      const data = await res.json();
      if (data.success && data.data?.employerKyc) {
        const fetched = data.data.employerKyc;
        setKycConfig(prev => ({
          ...prev,
          ...fetched,
          verifiedBanner: { ...prev.verifiedBanner, ...(fetched.verifiedBanner || {}) },
          pendingBanner: { ...prev.pendingBanner, ...(fetched.pendingBanner || {}) },
          rejectedBanner: { ...prev.rejectedBanner, ...(fetched.rejectedBanner || {}) },
          taxDoc: {
            ...prev.taxDoc,
            ...(fetched.taxDoc || {}),
            options: Array.isArray(fetched.taxDoc?.options) && fetched.taxDoc.options.length > 0
              ? fetched.taxDoc.options
              : prev.taxDoc.options
          },
          incorpDoc: {
            ...prev.incorpDoc,
            ...(fetched.incorpDoc || {}),
            options: Array.isArray(fetched.incorpDoc?.options) && fetched.incorpDoc.options.length > 0
              ? fetched.incorpDoc.options
              : prev.incorpDoc.options
          },
          extraDoc: {
            ...prev.extraDoc,
            ...(fetched.extraDoc || {}),
            options: Array.isArray(fetched.extraDoc?.options) && fetched.extraDoc.options.length > 0
              ? fetched.extraDoc.options
              : prev.extraDoc.options
          },
          progressCard: {
            ...prev.progressCard,
            ...(fetched.progressCard || {})
          },
          benefitsCard: {
            ...prev.benefitsCard,
            ...(fetched.benefitsCard || {}),
            benefits: Array.isArray(fetched.benefitsCard?.benefits)
              ? fetched.benefitsCard.benefits
              : prev.benefitsCard.benefits
          }
        }));
        if (data.data?.portalConfig?.account) {
          setPortalConfig(data.data.portalConfig.account);
        }
      }
    } catch (err) {
      console.warn('Could not load dynamic KYC config:', err);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/verification/status`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        setStatusData(data);
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          if (empInfo && data.verification) {
            empInfo.verification = data.verification;
            localStorage.setItem('employerInfo', JSON.stringify(empInfo));
            window.dispatchEvent(new Event('employer-profile-updated'));
          }
        } catch (_) {}
      } else {
        showToast(data.message || 'Failed to fetch verification status', 'error');
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
      showToast('Network error loading verification status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchKycConfig();
  }, []);

  const verification = statusData?.verification || {};
  const status = verification.status || 'unverified';
  const documents = Array.isArray(verification.documents) ? verification.documents : [];
  const isLocked = status === 'pending' || status === 'verified';

  const isConsultant = Boolean(
    employerProfile?.isConsultant ||
    statusData?.isConsultant ||
    statusData?.employer?.isConsultant ||
    (() => {
      try {
        const stored = JSON.parse(localStorage.getItem('employerInfo') || '{}');
        return Boolean(stored.isConsultant);
      } catch (_) {
        return false;
      }
    })()
  );

  const pageTitle = isConsultant 
    ? (portalConfig?.consultantTitle || 'Consultant Profile')
    : (portalConfig?.title || 'Company Profile');

  const pageSubtitle = isConsultant
    ? (portalConfig?.consultantSubtitle || 'Manage your consultant profile, staffing details and branding.')
    : (portalConfig?.subtitle || 'Manage your company information, branding and details.');

  const accountTabLabel = portalConfig?.accountTabLabel || 'Account details';
  const detailsTabLabel = isConsultant 
    ? (portalConfig?.consultantTabLabel || 'Consultant details')
    : (portalConfig?.companyTabLabel || 'Company details');

  // Grouped documents
  const taxDocs = documents.filter(d => d.category === 'tax');
  const incorpDocs = documents.filter(d => d.category === 'incorporation');
  const extraDocs = documents.filter(d => d.category !== 'tax' && d.category !== 'incorporation');

  const hasTax = taxDocs.length > 0;
  const hasIncorp = incorpDocs.length > 0;
  const hasExtra = extraDocs.length > 0;

  // Active options lists filtered by enabled !== false
  const activeTaxOptions = useMemo(() => {
    const list = kycConfig.taxDoc?.options || DEFAULT_KYC_CONFIG.taxDoc.options;
    return list.filter(o => o.enabled !== false).map(o => ({ ...o, type: o.id || o.type }));
  }, [kycConfig.taxDoc?.options]);

  const activeIncorpOptions = useMemo(() => {
    const list = kycConfig.incorpDoc?.options || DEFAULT_KYC_CONFIG.incorpDoc.options;
    return list.filter(o => o.enabled !== false).map(o => ({ ...o, type: o.id || o.type }));
  }, [kycConfig.incorpDoc?.options]);

  const activeExtraOptions = useMemo(() => {
    const list = kycConfig.extraDoc?.options || DEFAULT_KYC_CONFIG.extraDoc.options;
    return list.filter(o => o.enabled !== false && (!o.consultantOnly || employerProfile?.isConsultant || statusData?.isConsultant))
      .map(o => ({ ...o, type: o.id || o.type }));
  }, [kycConfig.extraDoc?.options, employerProfile?.isConsultant, statusData?.isConsultant]);

  // Sync selected types to first available active option
  useEffect(() => {
    if (activeTaxOptions.length > 0 && !activeTaxOptions.some(o => o.type === selectedTaxDocType)) {
      setSelectedTaxDocType(activeTaxOptions[0].type);
    }
  }, [activeTaxOptions, selectedTaxDocType]);

  useEffect(() => {
    if (activeIncorpOptions.length > 0 && !activeIncorpOptions.some(o => o.type === selectedIncorpDocType)) {
      setSelectedIncorpDocType(activeIncorpOptions[0].type);
    }
  }, [activeIncorpOptions, selectedIncorpDocType]);

  useEffect(() => {
    if (activeExtraOptions.length > 0 && !activeExtraOptions.some(o => o.type === selectedExtraDocType)) {
      setSelectedExtraDocType(activeExtraOptions[0].type);
    }
  }, [activeExtraOptions, selectedExtraDocType]);

  // Mandatory checks & canSubmit logic
  const isTaxMandatory = kycConfig.taxDoc?.isMandatory !== false;
  const isIncorpMandatory = kycConfig.incorpDoc?.isMandatory !== false;
  const isExtraMandatory = kycConfig.extraDoc?.isMandatory === true;

  const canSubmit = !isLocked && (
    (!isTaxMandatory || hasTax) &&
    (!isIncorpMandatory || hasIncorp) &&
    (!isExtraMandatory || hasExtra) &&
    (hasTax || hasIncorp || hasExtra)
  );

  const totalMandatoryCount = (isTaxMandatory ? 1 : 0) + (isIncorpMandatory ? 1 : 0) + (isExtraMandatory ? 1 : 0);
  const doneMandatoryCount = (isTaxMandatory && hasTax ? 1 : 0) + 
                             (isIncorpMandatory && hasIncorp ? 1 : 0) + 
                             (isExtraMandatory && hasExtra ? 1 : 0);

  const displayTotalCount = totalMandatoryCount > 0 ? totalMandatoryCount : 2;
  const displayDoneCount = totalMandatoryCount > 0 ? doneMandatoryCount : (hasTax ? 1 : 0) + (hasIncorp ? 1 : 0);

  // Handles auto-compression and uploading
  const processAndUploadFile = async (rawFile, category, docType) => {
    if (!rawFile) return;

    if (isLocked) {
      showToast('Document uploads are locked while verification is pending or verified.', 'error');
      return;
    }

    const allowedMime = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = rawFile.name?.toLowerCase().slice(rawFile.name.lastIndexOf('.'));
    const isMimeOk = allowedMime.includes(rawFile.type) || ['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(ext);

    if (!isMimeOk) {
      showToast('Only PDF, JPG, PNG, and WEBP formats are allowed.', 'error');
      return;
    }

    // Safety guard on raw file (max 50 MB before compression)
    if (rawFile.size > 50 * 1024 * 1024) {
      showToast('Selected file exceeds 50 MB. Please select a smaller document.', 'error');
      return;
    }

    let fileToUpload = rawFile;

    // AUTO COMPRESSOR (PDF & Images under 300 KB)
    if (rawFile.size > FINAL_UPLOAD_TARGET_BYTES) {
      setCompressingDocType(docType);
      setCompressingMessage(`Compressing ${rawFile.name} under 300 KB...`);
      try {
        const { compressFileIfNeeded } = await import('../../../utils/fileCompressor');
        const compressed = await compressFileIfNeeded(rawFile, FINAL_UPLOAD_TARGET_BYTES);
        if (compressed) {
          fileToUpload = compressed;
          if (compressed.wasCompressed || compressed.size < rawFile.size) {
            showToast(`Document compressed: ${formatBytes(rawFile.size)} → ${formatBytes(compressed.size)} (under 300 KB)`, 'success');
          }
        }
      } catch (compErr) {
        console.warn('Compression error:', compErr);
      } finally {
        setCompressingDocType(null);
        setCompressingMessage('');
      }
    }

    // Strict 300 KB validation
    if (fileToUpload.size > 300 * 1024) {
      showToast(`Document size is ${formatBytes(fileToUpload.size)}. Must be strictly under 300 KB.`, 'error');
      return;
    }

    setUploadingDocType(docType);
    setCompressingDocType(docType);
    setCompressingMessage(`Uploading to Firebase storage...`);

    let downloadURL = null;
    try {
      downloadURL = await uploadFileToStorage(fileToUpload, 'employer_verifications', (progress) => {
        setCompressingMessage(`Uploading to cloud: ${progress}%`);
      });
    } catch (fbErr) {
      console.error('Firebase storage upload failed:', fbErr);
      showToast('Cloud upload failed: ' + (fbErr.message || 'Storage error'), 'error');
      setUploadingDocType(null);
      setCompressingDocType(null);
      setCompressingMessage('');
      return;
    } finally {
      setCompressingDocType(null);
      setCompressingMessage('');
    }

    // Save document record to server
    try {
      const res = await fetch(`${API_URL}/api/verification/upload`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}` 
        },
        body: JSON.stringify({
          category,
          docType,
          fileUrl: downloadURL,
          fileName: fileToUpload.name,
          fileSize: fileToUpload.size,
          mimeType: fileToUpload.type || 'application/pdf'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Document uploaded successfully to Firebase!', 'success');
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          if (empInfo && data.verification) {
            empInfo.verification = data.verification;
            localStorage.setItem('employerInfo', JSON.stringify(empInfo));
          }
        } catch (_) {}
        fetchStatus();
      } else {
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Network error during upload', 'error');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleDelete = async (docId) => {
    if (isLocked) {
      showToast('Cannot delete documents while verification is under review.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this document?')) return;

    // Clean up from Firebase Storage if it was uploaded to Firebase
    const docToDelete = (statusData?.verification?.documents || []).find(d => (d._id === docId || d.id === docId));
    if (docToDelete && docToDelete.fileUrl && docToDelete.fileUrl.startsWith('http')) {
      deleteFileFromStorage(docToDelete.fileUrl).catch(e => console.warn('Storage delete error:', e));
    }

    setDeletingDocId(docId);
    try {
      const res = await fetch(`${API_URL}/api/verification/document/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Document removed', 'success');
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          if (empInfo && data.verification) {
            empInfo.verification = data.verification;
            localStorage.setItem('employerInfo', JSON.stringify(empInfo));
          }
        } catch (_) {}
        fetchStatus();
      } else {
        showToast(data.message || 'Failed to delete document', 'error');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Network error deleting document', 'error');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      showToast('Please upload all required verification documents before submitting.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmSubmitOpen(false);
        showToast('Application submitted for verification! Our team will review your documents.', 'success');
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          if (empInfo && data.verification) {
            empInfo.verification = data.verification;
            localStorage.setItem('employerInfo', JSON.stringify(empInfo));
          }
        } catch (_) {}
        fetchStatus();
      } else {
        showToast(data.message || 'Failed to submit verification request', 'error');
      }
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Network error during submission', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const [cancellingSubmission, setCancellingSubmission] = useState(false);

  const handleCancelSubmission = async () => {
    if (!window.confirm('Do you want to edit your uploaded documents? This will unlock them so you can replace or remove files.')) return;
    setCancellingSubmission(true);
    try {
      const res = await fetch(`${API_URL}/api/verification/cancel-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Documents unlocked! You can now preview, replace, or remove files.', 'success');
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          if (empInfo && data.verification) {
            empInfo.verification = data.verification;
            localStorage.setItem('employerInfo', JSON.stringify(empInfo));
          }
        } catch (_) {}
        fetchStatus();
      } else {
        showToast(data.message || 'Failed to unlock documents', 'error');
      }
    } catch (err) {
      console.error('Cancel submission error:', err);
      showToast('Network error unlocking documents', 'error');
    } finally {
      setCancellingSubmission(false);
    }
  };

  const getDocTypeDisplayLabel = (docType) => {
    const all = [
      ...(kycConfig.taxDoc?.options || TAX_DOC_OPTIONS),
      ...(kycConfig.incorpDoc?.options || INCORPORATION_DOC_OPTIONS),
      ...(kycConfig.extraDoc?.options || EXTRA_DOC_OPTIONS)
    ];
    const match = all.find(d => (d.type === docType || d.id === docType));
    return match?.label || match?.fullLabel || docType;
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm">Loading verification status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#0f172a] font-['Inter',system-ui,sans-serif] pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 transition-all ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Verification Card matching Admin Live Preview */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Profile Page Header & Underline Navigation Tabs */}
        <div className="mb-7">
          <h1 className="text-[26px] sm:text-[28px] font-bold text-[#101828] tracking-[-0.025em] leading-[1.2]">
            {pageTitle}
          </h1>
          <p className="text-[#667085] text-[14px] mt-1">
            {pageSubtitle}
          </p>
        </div>

        {/* Underline Tabs matching CompanyProfileTab */}
        <div className="flex gap-6 border-b border-[#eaecf0] mb-7">
          <Link
            to="/employer/company-profile?tab=account"
            className="pb-3 text-[14.5px] font-semibold border-b-2 border-transparent text-[#667085] hover:text-[#101828] transition-colors cursor-pointer"
          >
            {accountTabLabel}
          </Link>
          <Link
            to="/employer/company-profile?tab=company"
            className="pb-3 text-[14.5px] font-semibold border-b-2 border-transparent text-[#667085] hover:text-[#101828] transition-colors cursor-pointer"
          >
            {detailsTabLabel}
          </Link>
          <div
            className="pb-3 text-[14.5px] font-semibold border-b-2 border-[#059669] text-[#047857] transition-colors flex items-center gap-1.5 cursor-default"
          >
            <span>Verification</span>
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
              status === 'verified'
                ? 'bg-[#ecfdf3] text-[#047857]'
                : status === 'pending'
                ? 'bg-[#fef0c7] text-[#b54708]'
                : status === 'rejected'
                ? 'bg-[#fef2f2] text-[#b91c1c]'
                : 'bg-[#fff7ed] text-[#c2410c]'
            }`}>
              {status === 'verified' ? 'Verified' : status === 'pending' ? 'Pending' : status === 'rejected' ? 'Rejected' : 'Verify'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 space-y-6">

          {/* Header Preview / Bar */}
          <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/employer" className="text-xl font-bold text-gray-900">
                sahijob<span className="text-emerald-600">.com</span>
              </Link>
              <span className="text-xs text-gray-400 font-medium">{kycConfig.breadcrumbLabel || (isConsultant ? '/ Consultant Verification' : '/ Employer Verification')}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              status === 'verified'
                ? 'bg-[#e4f6ea] text-[#14753a] border border-[#cfe9d8]'
                : status === 'pending'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : status === 'rejected'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-[#fff1e3] text-[#b4540a] border border-[#fbd8b5]'
            }`}>
              {status === 'verified'
                ? (kycConfig.verifiedBanner?.badgeText || 'Verified')
                : status === 'pending'
                  ? (kycConfig.pendingBanner?.badgeText || 'Under Review')
                  : status === 'rejected'
                    ? (kycConfig.rejectedBanner?.badgeText || 'Rejected')
                    : (kycConfig.unverifiedBadgeText || 'Unverified')}
            </span>
          </div>

          {/* Status Alert Banners */}
          {status === 'rejected' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-bold text-xs">
                !
              </div>
              <div>
                <h4 className="font-bold text-red-950 text-xs sm:text-sm">{kycConfig.rejectedBanner?.title || 'Verification Submission Rejected'}</h4>
                <p className="text-xs text-red-800 mt-0.5">
                  <strong>Reason from Admin:</strong> {verification.rejectionReason || 'Documents did not meet criteria. Please re-upload clearer documents.'}
                </p>
                <p className="text-[11px] text-red-600 mt-1">
                  {kycConfig.rejectedBanner?.helperText || kycConfig.rejectedBanner?.description || 'Remove the rejected documents below, upload updated documents under 300 KB, and re-submit for review.'}
                </p>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-xs">
                ⏱
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-xs sm:text-sm">{kycConfig.pendingBanner?.title || 'Verification Under Review'}</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {kycConfig.pendingBanner?.description || 'Document uploads are locked while our compliance team reviews your business registration.'}
                </p>
              </div>
            </div>
          )}

          {status === 'verified' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">{kycConfig.verifiedBanner?.title || 'Account Verified Successfully!'}</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {kycConfig.verifiedBanner?.description || 'Your business is verified. All your active jobs are now live and visible to candidates with the green Verified Employer badge.'}
                </p>
              </div>
            </div>
          )}

          {/* Title & Subtitle Preview */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{kycConfig.pageTitle || 'Get your company verified'}</h2>
            <p className="text-sm text-gray-500 mt-1">{kycConfig.pageSubtitle || 'Upload 2 documents. Our team reviews them and your jobs go live for candidates.'}</p>
          </div>

          {/* Stepper Preview */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 text-xs font-bold">
            <div className={`flex items-center gap-2 ${hasTax ? 'text-emerald-800' : 'text-emerald-800'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${hasTax ? 'bg-emerald-600' : 'bg-emerald-600'}`}>
                {hasTax ? '✓' : '1'}
              </span>
              <span>{kycConfig.step1Label || 'Company KYC document'}</span>
            </div>
            <div className={`flex-1 h-0.5 ${hasTax ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${hasIncorp ? 'text-emerald-800' : (hasTax ? 'text-gray-900' : 'text-gray-700')}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${hasIncorp ? 'bg-emerald-600' : (hasTax ? 'bg-gray-900' : 'bg-gray-900')}`}>
                {hasIncorp ? '✓' : '2'}
              </span>
              <span>{kycConfig.step2Label || 'User KYC document'}</span>
            </div>
            <div className={`flex-1 h-0.5 ${hasIncorp ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            <div className={`flex items-center gap-2 ${isLocked ? 'text-emerald-800' : 'text-gray-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${isLocked ? 'bg-emerald-600' : 'bg-gray-200 text-gray-600'}`}>
                {isLocked ? '✓' : '3'}
              </span>
              <span>{status === 'rejected' ? (kycConfig.step3ResubmitLabel || 'Re-submit for review') : (kycConfig.step3Label || 'Submit for review')}</span>
            </div>
          </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          
          {/* ================= LEFT COLUMN: UPLOAD CARDS ================= */}
          <div className="flex flex-col gap-5">

            {/* CARD 1: COMPANY KYC DOCUMENT */}
            <div className={`rounded-xl p-4 transition-all ${
              hasTax 
                ? 'border border-emerald-500 bg-white shadow-2xs' 
                : 'border border-emerald-500/80 bg-emerald-50/20 shadow-2xs'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <b className="text-sm font-bold text-gray-900">
                  {kycConfig.taxDoc?.title || 'Company KYC document'}
                </b>
                {hasTax ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {kycConfig.taxDoc?.doneBadgeText || 'Done'}
                  </span>
                ) : isTaxMandatory ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                    {kycConfig.taxDoc?.requiredBadgeText || 'Required'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                    {kycConfig.taxDoc?.optionalBadgeText || 'Optional'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {kycConfig.taxDoc?.helpText || 'Any one is enough. Document must be in your registered company name.'}
              </p>

              {/* Doc Type Selector Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {activeTaxOptions.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setSelectedTaxDocType(item.type)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedTaxDocType === item.type
                        ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 shadow-2xs'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Uploaded Documents List (Strict 1 Document) */}
              {taxDocs.length > 0 && (
                <div className="space-y-2 mb-2">
                  {taxDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50/50 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-900 truncate">
                            {doc.fileName || 'Company KYC Document'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {getDocTypeDisplayLabel(doc.docType)} · {doc.fileSize ? formatBytes(doc.fileSize) : 'under 300 KB'} · Uploaded
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer shadow-2xs"
                        >
                          Preview
                        </button>
                        {!isLocked && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTaxDocType(doc.docType);
                                taxFileInputRef.current?.click();
                              }}
                              className="px-2.5 py-1 bg-white border border-emerald-600 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-50 cursor-pointer shadow-2xs"
                              title="Replace this document with another file"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc._id)}
                              disabled={deletingDocId === doc._id}
                              className="px-2.5 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1 disabled:opacity-50"
                              title="Remove document"
                            >
                              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>{deletingDocId === doc._id ? 'Removing...' : 'Remove'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload in progress banner when replacing */}
              {taxDocs.length > 0 && (compressingDocType === selectedTaxDocType || uploadingDocType === selectedTaxDocType) && (
                <div className="mb-2 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{compressingMessage || 'Uploading replacement document...'}</span>
                </div>
              )}

              {/* Hidden file input for file selection & replace */}
              <input
                ref={taxFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processAndUploadFile(file, 'tax', selectedTaxDocType);
                  e.target.value = '';
                }}
              />

              {/* Upload Dropzone - ONLY shown if NO company KYC document has been uploaded yet */}
              {!isLocked && taxDocs.length === 0 && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverTax(true); }}
                  onDragLeave={() => setDragOverTax(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverTax(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processAndUploadFile(file, 'tax', selectedTaxDocType);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center flex flex-col items-center justify-center transition-all ${
                    dragOverTax
                      ? 'border-emerald-600 bg-emerald-50/40'
                      : 'border-gray-200 bg-[#fbfdfc] hover:border-emerald-500 hover:bg-white'
                  }`}
                >
                  {compressingDocType === selectedTaxDocType || uploadingDocType === selectedTaxDocType ? (
                    <div className="py-2 flex flex-col items-center gap-1.5 text-emerald-700">
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold">{compressingMessage || 'Uploading document...'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                        <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="font-semibold text-xs text-gray-900 mb-0.5">
                        Drag & drop {activeTaxOptions.find(d => d.type === selectedTaxDocType)?.label || 'Company KYC Document'} here
                      </p>
                      <p className="text-[11px] text-gray-400 mb-2">
                        PDF, JPG or PNG · <strong className="text-emerald-700 font-semibold">under 300 KB</strong> (Auto-compressed)
                      </p>
                      <button
                        type="button"
                        onClick={() => taxFileInputRef.current?.click()}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        Choose file
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* CARD 2: USER KYC DOCUMENT */}
            <div className={`rounded-xl p-4 transition-all ${
              hasIncorp 
                ? 'border border-emerald-500 bg-white shadow-2xs' 
                : 'border border-gray-200 bg-white shadow-2xs'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <b className="text-sm font-bold text-gray-900">
                  {kycConfig.incorpDoc?.title || 'User KYC document'}
                </b>
                {hasIncorp ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {kycConfig.incorpDoc?.doneBadgeText || 'Done'}
                  </span>
                ) : isIncorpMandatory ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                    {kycConfig.incorpDoc?.requiredBadgeText || 'Required'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                    {kycConfig.incorpDoc?.optionalBadgeText || 'Optional'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {kycConfig.incorpDoc?.helpText || 'Identity proof of the authorized person, founder, or employer. Pick one and upload it.'}
              </p>

              {/* Doc Type Selector Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {activeIncorpOptions.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setSelectedIncorpDocType(item.type)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedIncorpDocType === item.type
                        ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 shadow-2xs'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Uploaded Documents List (Strict 1 Document) */}
              {incorpDocs.length > 0 && (
                <div className="space-y-2 mb-2">
                  {incorpDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50/50 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-900 truncate">
                            {doc.fileName || 'User KYC Document'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {getDocTypeDisplayLabel(doc.docType)} · {doc.fileSize ? formatBytes(doc.fileSize) : 'under 300 KB'} · Uploaded
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer shadow-2xs"
                        >
                          Preview
                        </button>
                        {!isLocked && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIncorpDocType(doc.docType);
                                incorpFileInputRef.current?.click();
                              }}
                              className="px-2.5 py-1 bg-white border border-emerald-600 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-50 cursor-pointer shadow-2xs"
                              title="Replace this document with another file"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc._id)}
                              disabled={deletingDocId === doc._id}
                              className="px-2.5 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1 disabled:opacity-50"
                              title="Remove document"
                            >
                              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>{deletingDocId === doc._id ? 'Removing...' : 'Remove'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload in progress banner when replacing */}
              {incorpDocs.length > 0 && (compressingDocType === selectedIncorpDocType || uploadingDocType === selectedIncorpDocType) && (
                <div className="mb-2 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{compressingMessage || 'Uploading replacement document...'}</span>
                </div>
              )}

              {/* Hidden file input for file selection & replace */}
              <input
                ref={incorpFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processAndUploadFile(file, 'incorporation', selectedIncorpDocType);
                  e.target.value = '';
                }}
              />

              {/* Upload Dropzone - ONLY shown if NO user KYC document has been uploaded yet */}
              {!isLocked && incorpDocs.length === 0 && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverIncorp(true); }}
                  onDragLeave={() => setDragOverIncorp(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverIncorp(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processAndUploadFile(file, 'incorporation', selectedIncorpDocType);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center flex flex-col items-center justify-center transition-all ${
                    dragOverIncorp
                      ? 'border-emerald-600 bg-emerald-50/40'
                      : 'border-gray-200 bg-[#fbfdfc] hover:border-emerald-500 hover:bg-white'
                  }`}
                >
                  {compressingDocType === selectedIncorpDocType || uploadingDocType === selectedIncorpDocType ? (
                    <div className="py-2 flex flex-col items-center gap-1.5 text-emerald-700">
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold">{compressingMessage || 'Uploading document...'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                        <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="font-semibold text-xs text-gray-900 mb-0.5">
                        Drag & drop {activeIncorpOptions.find(d => d.type === selectedIncorpDocType)?.label || 'User KYC Document'} here
                      </p>
                      <p className="text-[11px] text-gray-400 mb-2">
                        PDF, JPG or PNG · <strong className="text-emerald-700 font-semibold">under 300 KB</strong> (Auto-compressed)
                      </p>
                      <button
                        type="button"
                        onClick={() => incorpFileInputRef.current?.click()}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        Choose file
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* CARD 3: EXTRA DOCUMENTS (OPTIONAL / CMS MANAGED) */}
            <div className="rounded-xl p-4 border border-gray-200 bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <b className="text-sm font-bold text-gray-900">
                      {kycConfig.extraDoc?.title || 'Extra documents'}
                    </b>
                    {hasExtra ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {kycConfig.extraDoc?.doneBadgeText || 'Done'}
                      </span>
                    ) : isExtraMandatory ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                        {kycConfig.extraDoc?.requiredBadgeText || 'Required'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                        {kycConfig.extraDoc?.optionalBadgeText || 'Optional'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {kycConfig.extraDoc?.helpText || 'Address proof, authorization letter, signatory ID, staffing license. Speeds up approval.'}
                  </p>
                </div>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => setExtraDocsOpen(prev => !prev)}
                    className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {extraDocsOpen ? 'Close' : 'Add'}
                  </button>
                )}
              </div>

              {/* Uploaded Extra Documents */}
              {extraDocs.length > 0 && (
                <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                  {extraDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between gap-3 border border-gray-200 bg-gray-50/70 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-gray-900 truncate">
                            {doc.fileName || 'Additional Document'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {getDocTypeDisplayLabel(doc.docType)} · {doc.fileSize ? formatBytes(doc.fileSize) : 'under 300 KB'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1 bg-white border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-100 cursor-pointer"
                        >
                          Preview
                        </button>
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc._id)}
                            disabled={deletingDocId === doc._id}
                            className="px-2.5 py-1 bg-white border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50"
                          >
                            {deletingDocId === doc._id ? '...' : 'Remove'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra Docs Upload Drawer */}
              {extraDocsOpen && !isLocked && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {activeExtraOptions.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setSelectedExtraDocType(item.type)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          selectedExtraDocType === item.type
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 shadow-2xs'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOverExtra(true); }}
                    onDragLeave={() => setDragOverExtra(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverExtra(false);
                      const file = e.dataTransfer.files?.[0];
                      const activeOpt = activeExtraOptions.find(d => d.type === selectedExtraDocType);
                      if (file && activeOpt) processAndUploadFile(file, activeOpt.category || 'other', selectedExtraDocType);
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center transition-all ${
                      dragOverExtra
                        ? 'border-emerald-600 bg-emerald-50/40'
                        : 'border-gray-200 bg-[#fbfdfc] hover:border-emerald-500 hover:bg-white'
                    }`}
                  >
                    <input
                      ref={extraFileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        const activeOpt = activeExtraOptions.find(d => d.type === selectedExtraDocType);
                        if (file && activeOpt) processAndUploadFile(file, activeOpt.category || 'other', selectedExtraDocType);
                        e.target.value = '';
                      }}
                    />

                    {compressingDocType === selectedExtraDocType || uploadingDocType === selectedExtraDocType ? (
                      <div className="py-2 flex flex-col items-center gap-1.5 text-emerald-700">
                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold">{compressingMessage || 'Uploading document...'}</span>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-xs text-gray-900 mb-0.5">
                          Drag & drop {activeExtraOptions.find(d => d.type === selectedExtraDocType)?.label || 'Document'} here
                        </p>
                        <p className="text-[11px] text-gray-400 mb-2">
                          PDF, JPG or PNG · <strong className="text-emerald-700 font-semibold">under 300 KB</strong>
                        </p>
                        <button
                          type="button"
                          onClick={() => extraFileInputRef.current?.click()}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          Choose file
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN: PROGRESS & BENEFITS SIDEBAR ================= */}
          <div className="space-y-4">

            {/* PROGRESS CARD */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs">
              <b className="text-xs font-bold text-gray-900 block mb-2">{kycConfig.progressCard?.title || 'Your progress'}</b>
              <div className="h-1.5 bg-gray-200 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((displayDoneCount / Math.max(1, displayTotalCount)) * 100))}%` }}
                />
              </div>

              {/* Checklist */}
              <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                {(isTaxMandatory || hasTax) && (
                  <div className="flex items-center gap-1.5">
                    {hasTax ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-gray-400">○</span>}
                    <span className={hasTax ? 'font-medium text-gray-900' : 'text-gray-600'}>
                      {kycConfig.taxDoc?.title || 'Company KYC document'} ({isTaxMandatory ? 'Required' : 'Optional'})
                    </span>
                  </div>
                )}

                {(isIncorpMandatory || hasIncorp) && (
                  <div className="flex items-center gap-1.5">
                    {hasIncorp ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-gray-400">○</span>}
                    <span className={hasIncorp ? 'font-medium text-gray-900' : 'text-gray-600'}>
                      {kycConfig.incorpDoc?.title || 'User KYC document'} ({isIncorpMandatory ? 'Required' : 'Optional'})
                    </span>
                  </div>
                )}

                {(isExtraMandatory || hasExtra) && (
                  <div className="flex items-center gap-1.5">
                    {hasExtra ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-gray-400">○</span>}
                    <span className={hasExtra ? 'font-medium text-gray-900' : 'text-gray-600'}>
                      {kycConfig.extraDoc?.title || 'Extra documents'} ({isExtraMandatory ? 'Required' : 'Optional'})
                    </span>
                  </div>
                )}
              </div>

              {/* Submit for Verification Button */}
              {isLocked ? (
                <div className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-center space-y-2.5">
                  <div>
                    <p className="text-xs font-bold text-gray-700">
                      {status === 'pending' ? (kycConfig.progressCard?.lockedPendingTitle || 'Verification In Review') : (kycConfig.progressCard?.lockedVerifiedTitle || 'Account Verified')}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {status === 'pending'
                        ? (kycConfig.progressCard?.lockedPendingDesc || 'Our team is reviewing your documents.')
                        : (kycConfig.progressCard?.lockedVerifiedDesc || 'All candidate visibility privileges are active.')}
                    </p>
                  </div>
                  {status === 'pending' && (
                    <button
                      type="button"
                      onClick={handleCancelSubmission}
                      disabled={cancellingSubmission}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>{cancellingSubmission ? 'Unlocking...' : 'Edit / Replace Documents'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={!canSubmit || submitting}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting 
                      ? (status === 'rejected' ? (kycConfig.progressCard?.resubmittingText || 'Re-submitting...') : (kycConfig.progressCard?.submittingText || 'Submitting...')) 
                      : (status === 'rejected' 
                          ? (kycConfig.progressCard?.resubmitButtonText || 'Re-submit for verification') 
                          : (kycConfig.progressCard?.submitButtonText || 'Submit for verification'))}
                  </button>

                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    {!canSubmit
                      ? 'Upload all required documents to continue'
                      : (status === 'rejected'
                          ? (kycConfig.progressCard?.resubmitReadyText || 'Updated documents ready! Click to re-submit for review.')
                          : (kycConfig.progressCard?.requirementsMetText || 'All requirements met! Ready to submit.'))}
                  </p>
                </>
              )}
            </div>

            {/* BENEFITS CARD */}
            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 text-xs shadow-2xs">
              <b className="text-gray-900 font-bold block mb-2">{kycConfig.benefitsCard?.title || 'After approval you get'}</b>
              <div className="space-y-1.5 text-gray-700">
                {(kycConfig.benefitsCard?.benefits && kycConfig.benefitsCard.benefits.length > 0 
                  ? kycConfig.benefitsCard.benefits 
                  : [
                      'Green Verified Employer badge',
                      'Your jobs visible to all candidates',
                      'Tracked application links enabled'
                    ]
                ).map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      </div>

      {/* ================= MODAL: SUBMISSION CONFIRMATION ================= */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl mb-4">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {status === 'rejected' ? 'Re-submit documents for review?' : 'Submit documents for review?'}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {status === 'rejected'
                ? 'Your updated documents will be sent to our compliance team for re-evaluation. Document uploads will be locked while under review.'
                : 'Once submitted, your documents will be locked while our compliance team verifies your company credentials. Review typically takes 24-48 business hours.'}
            </p>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs text-gray-700 space-y-1 mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">{kycConfig.taxDoc?.title || 'Company KYC Documents'}:</span>
                <span className="font-semibold">{taxDocs.length} uploaded</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{kycConfig.incorpDoc?.title || 'User KYC Documents'}:</span>
                <span className="font-semibold">{incorpDocs.length} uploaded</span>
              </div>
              {extraDocs.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{kycConfig.extraDoc?.title || 'Additional Documents'}:</span>
                  <span className="font-semibold">{extraDocs.length} uploaded</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-[#1f9d4c] hover:bg-[#18803e] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : (status === 'rejected' ? 'Yes, Re-submit for Review' : 'Yes, Submit for Review')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DOCUMENT PREVIEW ================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {previewDoc.fileName || 'Document Preview'}
                </h4>
                <p className="text-xs text-gray-500">
                  {getDocTypeDisplayLabel(previewDoc.docType)} · {previewDoc.fileSize ? formatBytes(previewDoc.fileSize) : 'under 300 KB'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl?.startsWith('http') ? previewDoc.fileUrl : `${API_URL}/api/verification/document/${previewDoc._id}/file?token=${getAuthToken()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center min-h-[350px]">
              {previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewDoc.fileUrl?.startsWith('http') ? previewDoc.fileUrl : `${API_URL}/api/verification/document/${previewDoc._id}/file?token=${getAuthToken()}`}
                  title={previewDoc.fileName}
                  className="w-full h-[65vh] rounded-lg border border-gray-200 bg-white"
                />
              ) : (
                <img
                  src={previewDoc.fileUrl?.startsWith('http') ? previewDoc.fileUrl : `${API_URL}/api/verification/document/${previewDoc._id}/file?token=${getAuthToken()}`}
                  alt={previewDoc.fileName}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
