import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  ExternalLink 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VerificationReviewModal = ({ isOpen, onClose, employerId, onVerificationUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const getAdminHeaders = () => {
    const token = localStorage.getItem('adminToken') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-admin-auth': 'true'
    };
  };

  const fetchDetails = async () => {
    if (!employerId) return;
    setLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/verifications/${employerId}`, {
        headers: getAdminHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setActionError(json.message || 'Failed to load verification details');
      }
    } catch (err) {
      console.error('Error fetching verification details:', err);
      setActionError('Network error loading verification documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employerId) {
      fetchDetails();
    } else {
      setData(null);
      setPreviewDoc(null);
      setRejectModalOpen(false);
      setConfirmApproveOpen(false);
      setRejectionReason('');
      setActionError('');
    }
  }, [isOpen, employerId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/verifications/${employerId}/approve`, {
        method: 'PATCH',
        headers: getAdminHeaders()
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setConfirmApproveOpen(false);
        if (onVerificationUpdated) {
          onVerificationUpdated(employerId, 'verified', '');
        }
        onClose();
      } else {
        setActionError(json.message || 'Approval failed');
      }
    } catch (err) {
      console.error('Approve error:', err);
      setActionError('Network error approving verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/verifications/${employerId}/reject`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setRejectModalOpen(false);
        if (onVerificationUpdated) {
          onVerificationUpdated(employerId, 'rejected', rejectionReason.trim());
        }
        onClose();
      } else {
        setActionError(json.message || 'Rejection failed');
      }
    } catch (err) {
      console.error('Reject error:', err);
      setActionError('Network error rejecting verification');
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocPreviewUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const adminToken = localStorage.getItem('adminToken') || '';
    return `${API_URL}${url}${url.includes('?') ? '&' : '?'}token=${adminToken}`;
  };

  const currentStatus = data?.status || 'unverified';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg shrink-0">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {data?.companyName || 'Verification Review'}
                </h2>
                {data?.isConsultant && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Consultant
                  </span>
                )}
                {/* Status Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentStatus === 'verified'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : currentStatus === 'pending'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                    : currentStatus === 'rejected'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {currentStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Recruiter: {data?.fullName} • {data?.email} • {data?.mobile || 'No phone'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">Loading documents...</p>
            </div>
          ) : !data ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p>Unable to load verification details.</p>
            </div>
          ) : (
            <>
              {/* Previous Rejection Notice if any */}
              {data.status === 'rejected' && data.rejectionReason && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
                  <span className="font-bold">Previous Rejection Reason:</span> {data.rejectionReason}
                </div>
              )}

              {/* SECTION 1: TAX DOCUMENTS (REQUIRED) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>1. Tax Documents</span>
                    <span className="text-xs text-gray-500 font-normal">(Required: at least 1)</span>
                  </h3>
                  {data.hasRequiredTax ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </div>

                {data.documents?.tax?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No tax documents uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.documents.tax.map(doc => (
                      <div key={doc._id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {doc.docTypeLabel}
                            </span>
                            <h4 className="text-xs font-semibold text-gray-900 mt-2 truncate" title={doc.fileName}>
                              {doc.fileName}
                            </h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <a
                              href={getDocPreviewUrl(doc.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.fileName}
                              className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: INCORPORATION DOCUMENTS (REQUIRED) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>2. Incorporation & Business Registration</span>
                    <span className="text-xs text-gray-500 font-normal">(Required: at least 1)</span>
                  </h3>
                  {data.hasRequiredIncorporation ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Satisfied
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing
                    </span>
                  )}
                </div>

                {data.documents?.incorporation?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No incorporation documents uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.documents.incorporation.map(doc => (
                      <div key={doc._id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {doc.docTypeLabel}
                            </span>
                            <h4 className="text-xs font-semibold text-gray-900 mt-2 truncate" title={doc.fileName}>
                              {doc.fileName}
                            </h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <a
                              href={getDocPreviewUrl(doc.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.fileName}
                              className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: ADDITIONAL SUPPORTING DOCUMENTS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span>3. Additional Documents</span>
                    <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    {data.documents?.additional?.length || 0} Uploaded
                  </span>
                </div>

                {data.documents?.additional?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">No additional documents uploaded.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.documents.additional.map(doc => (
                      <div key={doc._id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {doc.docTypeLabel}
                            </span>
                            <h4 className="text-xs font-semibold text-gray-900 mt-2 truncate" title={doc.fileName}>
                              {doc.fileName}
                            </h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <a
                              href={getDocPreviewUrl(doc.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={doc.fileName}
                              className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {/* Reject Button */}
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => { setRejectModalOpen(true); setActionError(''); }}
              className="px-4 py-2 text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Reject Verification</span>
            </button>

            {/* Approve Button */}
            <button
              type="button"
              disabled={actionLoading || currentStatus === 'verified'}
              onClick={() => { setConfirmApproveOpen(true); setActionError(''); }}
              className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                currentStatus === 'verified'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{currentStatus === 'verified' ? 'Already Verified' : 'Approve Verification'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Confirm Approve Dialog */}
      {confirmApproveOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Approve Account Verification?</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Approving verification for <strong>{data?.companyName}</strong> will award them the Verified Employer badge, activate all their posted jobs for candidates, and enable direct application link creation.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmApproveOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Reject Verification Submission</h3>
            <p className="text-xs text-gray-500 mt-1">
              Please enter the specific reason for rejecting the documents. This reason will be emailed to the employer and shown on their dashboard.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Rejection Reason (Mandatory)
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. GST Certificate is blurry/illegible. Please upload a clear official PDF from the GST portal."
                className="w-full text-xs p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={handleReject}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Lightbox / Preview */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-70 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="min-w-0 flex-1 pr-3">
                <h4 className="font-bold text-sm text-gray-900 truncate">{previewDoc.fileName}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{previewDoc.docTypeLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getDocPreviewUrl(previewDoc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewDoc.fileName}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-100 flex items-center justify-center p-2 overflow-auto">
              {previewDoc.mimeType?.startsWith('image/') ? (
                <img
                  src={getDocPreviewUrl(previewDoc.fileUrl)}
                  alt={previewDoc.fileName}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <iframe
                  src={getDocPreviewUrl(previewDoc.fileUrl)}
                  title={previewDoc.fileName}
                  className="w-full h-full border-none rounded-lg bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VerificationReviewModal;
