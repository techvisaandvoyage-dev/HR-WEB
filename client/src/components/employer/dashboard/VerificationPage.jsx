import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { uploadFileToStorage, deleteFileFromStorage } from '../../../utils/firebaseStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const FINAL_UPLOAD_TARGET_BYTES = 295 * 1024; // Strictly under 300 KB (295 KB)

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TAX_DOC_OPTIONS = [
  { type: 'gst_certificate', label: 'GST Certificate', fullLabel: 'GST Registration Certificate (Form GST REG-06)' },
  { type: 'pan_card_company', label: 'Company PAN', fullLabel: 'Company PAN Card' },
  { type: 'tan_certificate', label: 'TAN', fullLabel: 'TAN Allotment Certificate' },
  { type: 'itr_acknowledgement', label: 'ITR-V', fullLabel: 'Latest ITR-V / Acknowledgement' },
  { type: 'professional_tax_certificate', label: 'Professional Tax', fullLabel: 'Professional Tax Certificate' }
];

const INCORPORATION_DOC_OPTIONS = [
  { type: 'certificate_of_incorporation', label: 'Certificate of Incorporation', fullLabel: 'Certificate of Incorporation (COI)' },
  { type: 'cin_document', label: 'CIN / MCA Master Data', fullLabel: 'CIN / MCA Company Master Data' },
  { type: 'moa_aoa', label: 'MOA / AOA', fullLabel: 'Memorandum & Articles of Association (MOA/AOA)' },
  { type: 'partnership_deed', label: 'Partnership Deed', fullLabel: 'Registered Partnership Deed' },
  { type: 'llp_agreement', label: 'LLP Agreement', fullLabel: 'LLP Agreement' },
  { type: 'msme_udyam_certificate', label: 'Udyam / MSME', fullLabel: 'Udyam / MSME Registration Certificate' },
  { type: 'shop_establishment_license', label: 'Shop & Establishment', fullLabel: 'Shop & Establishment License' },
  { type: 'gumasta_trade_license', label: 'Trade License', fullLabel: 'Gumasta / Trade License' }
];

const EXTRA_DOC_OPTIONS = [
  { type: 'address_proof', label: 'Address Proof', category: 'address', fullLabel: 'Company Address Proof (Utility Bill / Lease)' },
  { type: 'authorization_letter', label: 'Authorization Letter', category: 'authorized_signatory', fullLabel: 'Board / Owner Authorization Letter' },
  { type: 'authorized_person_id', label: 'Signatory ID', category: 'authorized_signatory', fullLabel: 'Authorized Signatory Govt ID' },
  { type: 'staffing_license', label: 'Staffing License', category: 'license', consultantOnly: true, fullLabel: 'Staffing / Recruitment Agency License' },
  { type: 'other', label: 'Other Document', category: 'other', fullLabel: 'Other Supporting Business Proof' }
];

export default function VerificationPage({ employerProfile }) {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [selectedTaxDocType, setSelectedTaxDocType] = useState('gst_certificate');
  const [selectedIncorpDocType, setSelectedIncorpDocType] = useState('certificate_of_incorporation');
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
  }, []);

  const verification = statusData?.verification || {};
  const status = verification.status || 'unverified';
  const documents = Array.isArray(verification.documents) ? verification.documents : [];
  const isLocked = status === 'pending' || status === 'verified';

  // Grouped documents
  const taxDocs = documents.filter(d => d.category === 'tax');
  const incorpDocs = documents.filter(d => d.category === 'incorporation');
  const extraDocs = documents.filter(d => d.category !== 'tax' && d.category !== 'incorporation');

  const hasTax = taxDocs.length > 0;
  const hasIncorp = incorpDocs.length > 0;
  const progressCount = (hasTax ? 1 : 0) + (hasIncorp ? 1 : 0);
  const canSubmit = hasTax && hasIncorp && !isLocked;

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
      showToast('Please upload at least 1 Tax document and 1 Incorporation document before submitting.', 'error');
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

  const getDocTypeDisplayLabel = (docType) => {
    const all = [...TAX_DOC_OPTIONS, ...INCORPORATION_DOC_OPTIONS, ...EXTRA_DOC_OPTIONS];
    const match = all.find(d => d.type === docType);
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

      {/* Top Header Bar */}
      <div className="bg-white border-b border-[#e3e8e5] px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/employer" className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            sahijob<span className="text-[#1f9d4c]">.com</span>
          </Link>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">/ Employer Verification</span>
        </div>

        {/* Status Pill in Header */}
        <div>
          {status === 'verified' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#e4f6ea] text-[#14753a] border border-[#bce4cb]">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
          {status === 'pending' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Under Review
            </span>
          )}
          {status === 'rejected' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Verification Rejected
            </span>
          )}
          {status === 'unverified' && (
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fff1e3] text-[#b4540a] border border-[#fbd8b5]">
              Unverified
            </span>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-8">

        {/* Rejection Alert Banner */}
        {status === 'rejected' && (
          <div className="mb-6 p-4 sm:p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-bold">
              !
            </div>
            <div>
              <h4 className="font-bold text-red-900 text-sm">Verification Submission Rejected</h4>
              <p className="text-xs text-red-700 mt-1">
                <strong>Reason from Admin:</strong> {verification.rejectionReason || 'Documents did not meet criteria. Please re-upload clearer documents.'}
              </p>
              <p className="text-[11px] text-red-600 mt-1">
                Remove the rejected documents below, upload updated documents under 300 KB, and re-submit for review.
              </p>
            </div>
          </div>
        )}

        {/* Pending Notice */}
        {status === 'pending' && (
          <div className="mb-6 p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
              ⏱
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Verification Under Review</h4>
              <p className="text-xs text-amber-800 mt-1">
                Your documents were submitted on {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : 'recently'}. Document uploads are locked while our compliance team reviews your business registration.
              </p>
            </div>
          </div>
        )}

        {/* Verified Notice */}
        {status === 'verified' && (
          <div className="mb-6 p-4 sm:p-5 bg-[#e4f6ea] border border-[#cfe9d8] rounded-2xl flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#c5ebd1] text-[#14753a] flex items-center justify-center shrink-0 font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-[#14753a] text-sm">Account Verified Successfully!</h4>
              <p className="text-xs text-[#216b3d] mt-1">
                Your business is verified. All your active jobs are now live and visible to candidates with the green Verified Employer badge.
              </p>
            </div>
          </div>
        )}

        {/* Page Titles */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a] mb-1">
          Get your company verified
        </h1>
        <p className="text-sm sm:text-base text-[#5a6a61] mb-7">
          Upload 2 documents. Our team reviews them and your jobs go live for candidates.
        </p>

        {/* Stepper Bar */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
              hasTax ? 'bg-[#1f9d4c] text-white' : 'bg-[#0f172a] text-white'
            }`}>
              {hasTax ? (
                <svg className="w-4 h-4 fill-none stroke-current stroke-3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : '1'}
            </div>
            <span className={`text-sm ${hasTax ? 'font-bold text-[#0f172a]' : 'font-semibold text-gray-700'}`}>
              Tax document
            </span>
          </div>

          <div className={`flex-1 h-0.5 min-w-[30px] transition-colors ${hasTax ? 'bg-[#1f9d4c]' : 'bg-[#d3dbd6]'}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
              hasIncorp ? 'bg-[#1f9d4c] text-white' : (hasTax ? 'bg-[#0f172a] text-white' : 'bg-[#e3e8e5] text-[#5a6a61]')
            }`}>
              {hasIncorp ? (
                <svg className="w-4 h-4 fill-none stroke-current stroke-3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : '2'}
            </div>
            <span className={`text-sm ${hasIncorp ? 'font-bold text-[#0f172a]' : 'font-semibold text-gray-700'}`}>
              Incorporation document
            </span>
          </div>

          <div className={`flex-1 h-0.5 min-w-[30px] transition-colors ${hasIncorp ? 'bg-[#1f9d4c]' : 'bg-[#d3dbd6]'}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
              isLocked 
                ? 'bg-[#1f9d4c] text-white' 
                : (hasTax && hasIncorp ? 'bg-[#0f172a] text-white' : 'bg-[#e3e8e5] text-[#5a6a61]')
            }`}>
              {isLocked ? (
                <svg className="w-4 h-4 fill-none stroke-current stroke-3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : '3'}
            </div>
            <span className={`text-sm ${hasTax && hasIncorp ? 'font-bold text-[#0f172a]' : 'font-medium text-[#5a6a61]'}`}>
              {status === 'rejected' ? 'Re-submit for review' : 'Submit for review'}
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          
          {/* ================= LEFT COLUMN: UPLOAD CARDS ================= */}
          <div className="flex flex-col gap-5">

            {/* CARD 1: TAX DOCUMENT */}
            <div className={`bg-white rounded-2xl p-6 border transition-all ${
              hasTax ? 'border-[#1f9d4c] shadow-xs' : 'border-[#e3e8e5]'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    hasTax ? 'bg-[#1f9d4c] text-white' : 'bg-[#0f172a] text-white'
                  }`}>
                    1
                  </div>
                  <h2 className="text-lg font-bold text-[#0f172a]">Tax document</h2>
                </div>
                {hasTax ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e4f6ea] text-[#14753a]">
                    Done
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fdecec] text-[#b42318]">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-[#5a6a61] ml-11 mb-4">
                Any one is enough. Document must be in your company name.
              </p>

              {/* Doc Type Selector Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {TAX_DOC_OPTIONS.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedTaxDocType(item.type)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                      selectedTaxDocType === item.type
                        ? 'bg-[#e4f6ea] border-[#1f9d4c] text-[#14753a] font-bold shadow-2xs'
                        : 'bg-white border-[#d3dbd6] text-[#2b3a32] hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Uploaded Documents List (Strict 1 Document) */}
              {taxDocs.length > 0 && (
                <div className="space-y-2 mb-3">
                  {taxDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between gap-3 border border-[#cfe9d8] bg-[#f2fbf5] rounded-xl p-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#e4f6ea] text-[#14753a] flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                            {doc.fileName || 'Tax Document'}
                          </p>
                          <p className="text-xs text-[#5a6a61]">
                            {getDocTypeDisplayLabel(doc.docType)} · {doc.fileSize ? formatBytes(doc.fileSize) : 'under 300 KB'} · Uploaded
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-3 py-1.5 bg-white border border-[#d3dbd6] text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer shadow-2xs"
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
                              className="px-3 py-1.5 bg-white border border-[#1f9d4c] text-[#14753a] text-xs font-semibold rounded-lg hover:bg-[#e4f6ea] cursor-pointer shadow-2xs"
                              title="Replace this document with another file"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc._id)}
                              disabled={deletingDocId === doc._id}
                              className="px-3 py-1.5 bg-white border border-[#f0c4c0] text-[#b42318] text-xs font-semibold rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50 shadow-2xs"
                            >
                              {deletingDocId === doc._id ? '...' : 'Remove'}
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
                <div className="mb-3 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
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

              {/* Upload Dropzone - ONLY shown if NO tax document has been uploaded yet */}
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
                  className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all ${
                    dragOverTax
                      ? 'border-[#1f9d4c] bg-[#e4f6ea]/30'
                      : 'border-[#b9c6bf] bg-[#fafcfb] hover:border-[#1f9d4c]/60 hover:bg-white'
                  }`}
                >
                  {compressingDocType === selectedTaxDocType || uploadingDocType === selectedTaxDocType ? (
                    <div className="py-2 flex flex-col items-center gap-2 text-emerald-700">
                      <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold">{compressingMessage || 'Uploading document...'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#e4f6ea] text-[#1f9d4c] flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="font-semibold text-sm text-[#0f172a] mb-0.5">
                        Drag & drop {TAX_DOC_OPTIONS.find(d => d.type === selectedTaxDocType)?.label || 'Tax Document'} here
                      </p>
                      <p className="text-xs text-[#5a6a61] mb-3">
                        PDF, JPG or PNG · <strong className="text-emerald-700 font-semibold">under 300 KB</strong> (Auto-compressed)
                      </p>
                      <button
                        type="button"
                        onClick={() => taxFileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#1f9d4c] hover:bg-[#18803e] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Choose file
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* CARD 2: INCORPORATION DOCUMENT */}
            <div className={`bg-white rounded-2xl p-6 border transition-all ${
              hasIncorp ? 'border-[#1f9d4c] shadow-xs' : 'border-[#0f172a] shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    hasIncorp ? 'bg-[#1f9d4c] text-white' : 'bg-[#0f172a] text-white'
                  }`}>
                    2
                  </div>
                  <h2 className="text-lg font-bold text-[#0f172a]">Incorporation document</h2>
                </div>
                {hasIncorp ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e4f6ea] text-[#14753a]">
                    Done
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fdecec] text-[#b42318]">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-[#5a6a61] ml-11 mb-4">
                Proof that your business is legally registered. Pick one and upload it.
              </p>

              {/* Doc Type Selector Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {INCORPORATION_DOC_OPTIONS.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedIncorpDocType(item.type)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                      selectedIncorpDocType === item.type
                        ? 'bg-[#e4f6ea] border-[#1f9d4c] text-[#14753a] font-bold shadow-2xs'
                        : 'bg-white border-[#d3dbd6] text-[#2b3a32] hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Uploaded Documents List (Strict 1 Document) */}
              {incorpDocs.length > 0 && (
                <div className="space-y-2 mb-3">
                  {incorpDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between gap-3 border border-[#cfe9d8] bg-[#f2fbf5] rounded-xl p-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#e4f6ea] text-[#14753a] flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                            {doc.fileName || 'Incorporation Document'}
                          </p>
                          <p className="text-xs text-[#5a6a61]">
                            {getDocTypeDisplayLabel(doc.docType)} · {doc.fileSize ? formatBytes(doc.fileSize) : 'under 300 KB'} · Uploaded
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-3 py-1.5 bg-white border border-[#d3dbd6] text-xs font-semibold rounded-lg hover:bg-gray-50 cursor-pointer shadow-2xs"
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
                              className="px-3 py-1.5 bg-white border border-[#1f9d4c] text-[#14753a] text-xs font-semibold rounded-lg hover:bg-[#e4f6ea] cursor-pointer shadow-2xs"
                              title="Replace this document with another file"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc._id)}
                              disabled={deletingDocId === doc._id}
                              className="px-3 py-1.5 bg-white border border-[#f0c4c0] text-[#b42318] text-xs font-semibold rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50 shadow-2xs"
                            >
                              {deletingDocId === doc._id ? '...' : 'Remove'}
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
                <div className="mb-3 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
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

              {/* Upload Dropzone - ONLY shown if NO incorporation document has been uploaded yet */}
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
                  className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center transition-all ${
                    dragOverIncorp
                      ? 'border-[#1f9d4c] bg-[#e4f6ea]/30'
                      : 'border-[#b9c6bf] bg-[#fafcfb] hover:border-[#1f9d4c]/60 hover:bg-white'
                  }`}
                >
                  {compressingDocType === selectedIncorpDocType || uploadingDocType === selectedIncorpDocType ? (
                    <div className="py-2 flex flex-col items-center gap-2 text-emerald-700">
                      <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold">{compressingMessage || 'Uploading document...'}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#e4f6ea] text-[#1f9d4c] flex items-center justify-center mb-2">
                        <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="font-semibold text-sm text-[#0f172a] mb-0.5">
                        Drag & drop {INCORPORATION_DOC_OPTIONS.find(d => d.type === selectedIncorpDocType)?.label || 'Incorporation Document'} here
                      </p>
                      <p className="text-xs text-[#5a6a61] mb-3">
                        PDF, JPG or PNG · <strong className="text-emerald-700 font-semibold">under 300 KB</strong> (Auto-compressed)
                      </p>
                      <button
                        type="button"
                        onClick={() => incorpFileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#1f9d4c] hover:bg-[#18803e] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        Choose file
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* CARD 3: EXTRA DOCUMENTS (OPTIONAL) */}
            <div className="bg-white rounded-2xl p-6 border border-[#e3e8e5]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#e3e8e5] text-[#5a6a61] flex items-center justify-center font-bold text-sm shrink-0">
                    +
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-base text-[#0f172a]">Extra documents</b>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#eef1ef] text-[#4b5a52]">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#5a6a61] mt-0.5">
                      Address proof, authorization letter, signatory ID, staffing license. Speeds up approval.
                    </p>
                  </div>
                </div>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => setExtraDocsOpen(prev => !prev)}
                    className="px-3.5 py-1.5 bg-white border border-[#d3dbd6] hover:bg-gray-50 text-[#0f172a] text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {extraDocsOpen ? 'Close' : 'Add'}
                  </button>
                )}
              </div>

              {/* Uploaded Extra Documents */}
              {extraDocs.length > 0 && (
                <div className="space-y-2 mt-4 pt-3 border-t border-gray-100">
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
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {EXTRA_DOC_OPTIONS.filter(o => !o.consultantOnly || employerProfile?.isConsultant || statusData?.isConsultant).map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setSelectedExtraDocType(item.type)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          selectedExtraDocType === item.type
                            ? 'bg-[#e4f6ea] border-[#1f9d4c] text-[#14753a] font-bold'
                            : 'bg-white border-[#d3dbd6] text-[#2b3a32] hover:bg-gray-50'
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
                      const activeOpt = EXTRA_DOC_OPTIONS.find(d => d.type === selectedExtraDocType);
                      if (file && activeOpt) processAndUploadFile(file, activeOpt.category, selectedExtraDocType);
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center transition-all ${
                      dragOverExtra
                        ? 'border-[#1f9d4c] bg-[#e4f6ea]/30'
                        : 'border-[#b9c6bf] bg-[#fafcfb] hover:border-[#1f9d4c]/60 hover:bg-white'
                    }`}
                  >
                    <input
                      ref={extraFileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        const activeOpt = EXTRA_DOC_OPTIONS.find(d => d.type === selectedExtraDocType);
                        if (file && activeOpt) processAndUploadFile(file, activeOpt.category, selectedExtraDocType);
                        e.target.value = '';
                      }}
                    />

                    {compressingDocType === selectedExtraDocType || uploadingDocType === selectedExtraDocType ? (
                      <div className="py-2 flex flex-col items-center gap-2 text-emerald-700">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold">{compressingMessage || 'Uploading document...'}</span>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-xs sm:text-sm text-[#0f172a] mb-0.5">
                          Upload {EXTRA_DOC_OPTIONS.find(d => d.type === selectedExtraDocType)?.label}
                        </p>
                        <p className="text-[11px] text-[#5a6a61] mb-2.5">
                          PDF, JPG or PNG · under 300 KB (Auto-compressed)
                        </p>
                        <button
                          type="button"
                          onClick={() => extraFileInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-[#1f9d4c] hover:bg-[#18803e] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
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

          {/* ================= RIGHT COLUMN: PROGRESS & SUBMIT (STICKY) ================= */}
          <div className="flex flex-col gap-5 lg:sticky lg:top-5">

            {/* PROGRESS CARD */}
            <div className="bg-white rounded-2xl p-6 border border-[#e3e8e5] shadow-xs">
              <div className="flex justify-between items-baseline mb-2">
                <b className="text-base text-[#0f172a]">Your progress</b>
                <span className="text-xs font-medium text-[#5a6a61]">
                  {progressCount} of 2 done
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-[#e3e8e5] rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[#1f9d4c] transition-all duration-300 rounded-full"
                  style={{ width: `${(progressCount / 2) * 100}%` }}
                />
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-2.5 text-sm mb-5">
                <div className="flex items-center gap-2.5">
                  {hasTax ? (
                    <span className="text-[#14753a] font-bold text-base">✓</span>
                  ) : (
                    <span className="text-[#b42318] text-base font-bold">○</span>
                  )}
                  <span className={hasTax ? 'font-semibold text-[#0f172a]' : 'text-gray-600'}>
                    Tax document
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {hasIncorp ? (
                    <span className="text-[#14753a] font-bold text-base">✓</span>
                  ) : (
                    <span className="text-[#b42318] text-base font-bold">○</span>
                  )}
                  <span className={hasIncorp ? 'font-semibold text-[#0f172a]' : 'text-gray-600'}>
                    Incorporation document
                  </span>
                </div>
              </div>

              {/* Submit for Verification Button */}
              {isLocked ? (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-xs font-bold text-gray-700">
                    {status === 'pending' ? 'Verification In Review' : 'Account Verified'}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {status === 'pending'
                      ? 'Our team is reviewing your documents.'
                      : 'All candidate visibility privileges are active.'}
                  </p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={!canSubmit || submitting}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer ${
                      canSubmit
                        ? 'bg-[#1f9d4c] hover:bg-[#18803e] text-white active:scale-98'
                        : 'bg-[#e3e8e5] text-[#7b8a82] cursor-not-allowed'
                    }`}
                  >
                    {submitting 
                      ? (status === 'rejected' ? 'Re-submitting...' : 'Submitting...') 
                      : (status === 'rejected' ? 'Re-submit for verification' : 'Submit for verification')}
                  </button>

                  <p className="text-xs text-[#5a6a61] text-center mt-2.5">
                    {!hasTax && !hasIncorp
                      ? 'Upload 1 tax and 1 incorporation document to continue'
                      : !hasTax
                      ? 'Upload 1 tax document to continue'
                      : !hasIncorp
                      ? 'Upload 1 incorporation document to continue'
                      : (status === 'rejected'
                          ? 'Updated documents ready! Click to re-submit for review.'
                          : 'All requirements met! Ready to submit.')}
                  </p>
                </>
              )}
            </div>

            {/* BENEFITS CARD */}
            <div className="bg-[#f2fbf5] border border-[#cfe9d8] rounded-2xl p-6">
              <b className="text-base text-[#0f172a] block mb-3.5">
                After approval you get
              </b>
              <div className="flex flex-col gap-3 text-xs sm:text-sm text-gray-800 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#14753a] font-bold text-base leading-none">✓</span>
                  <span>Green Verified Employer badge</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#14753a] font-bold text-base leading-none">✓</span>
                  <span>Your jobs visible to all candidates</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[#14753a] font-bold text-base leading-none">✓</span>
                  <span>Tracked application links enabled</span>
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
                <span className="text-gray-500">Tax Documents:</span>
                <span className="font-semibold">{taxDocs.length} uploaded</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Incorporation Documents:</span>
                <span className="font-semibold">{incorpDocs.length} uploaded</span>
              </div>
              {extraDocs.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Additional Documents:</span>
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
