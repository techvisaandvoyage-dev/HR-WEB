import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const JobShareModal = ({ isOpen, onClose, job, employerProfile, isNewlyPublished = false, onUpdateJobLinks }) => {
  const [links, setLinks] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  const jobId = job?._id || job?.id;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const jobTitle = job?.title || job?.details?.jobTitle || 'Job Opening';
  const companyName = job?.company || job?.companyName || 'Company';

  // Compute live verification status
  const getVerificationStatus = () => {
    if (employerProfile?.verification?.status) {
      return employerProfile.verification.status;
    }
    if (job?.employerVerificationStatus) {
      return job.employerVerificationStatus;
    }
    if (job?.isEmployerVerified === true) {
      return 'verified';
    }
    try {
      const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
      if (empInfo?.verification?.status) {
        return empInfo.verification.status;
      }
    } catch (_) {}
    return job?.isEmployerVerified ? 'verified' : 'unverified';
  };

  const verificationStatus = getVerificationStatus();
  const isVerified = verificationStatus === 'verified';

  // Sync links when modal opens or job changes
  useEffect(() => {
    if (job) {
      if (Array.isArray(job.shareLinks) && job.shareLinks.length > 0) {
        setLinks(job.shareLinks.map(l => {
          const lCode = l.name || l.linkId || '01';
          const fallbackCount = job.linkStats?.[lCode] ?? job.linkStats?.[l.linkId] ?? (job.shareLinks.length === 1 ? job.applications : 0);
          return {
            ...l,
            applicationsCount: l.applicationsCount !== undefined && l.applicationsCount !== null ? l.applicationsCount : fallbackCount
          };
        }));
      } else {
        // Default initial link 01
        const initialCount = job.linkStats?.['01'] ?? job.applications ?? 0;
        setLinks([
          {
            linkId: '01',
            name: '01',
            createdAt: job.createdAt || new Date(),
            applicationsCount: initialCount
          }
        ]);
      }
      setEditingIndex(null);
      setActionError('');
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const getFullUrl = (link) => {
    const trackingCode = link.name || link.linkId || '01';
    return `${baseUrl}/apply-job/${jobId}?src=${encodeURIComponent(trackingCode)}`;
  };

  const handleCopyLink = (index, url) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleStartRename = (index, currentName) => {
    setEditingIndex(index);
    setEditingName(currentName);
    setActionError('');
  };

  const handleSaveRename = async (index) => {
    if (!editingName.trim()) {
      setActionError('Link name cannot be empty');
      return;
    }

    const link = links[index];
    const token = localStorage.getItem('employerToken');
    setLoadingAction(true);
    setActionError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const targetId = link.linkId || link._id || index;
      const res = await fetch(`${apiUrl}/api/employer/jobs/${jobId}/share-links/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingName.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setLinks(data.data);
        setEditingIndex(null);
        if (onUpdateJobLinks) {
          onUpdateJobLinks(jobId, data.data);
        }
      } else {
        // Local update fallback if offline or server issue
        const updated = [...links];
        updated[index] = { ...updated[index], name: editingName.trim() };
        setLinks(updated);
        setEditingIndex(null);
        if (onUpdateJobLinks) {
          onUpdateJobLinks(jobId, updated);
        }
      }
    } catch (err) {
      console.error('Error renaming link:', err);
      // Local fallback
      const updated = [...links];
      updated[index] = { ...updated[index], name: editingName.trim() };
      setLinks(updated);
      setEditingIndex(null);
      if (onUpdateJobLinks) {
        onUpdateJobLinks(jobId, updated);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddNewLink = async () => {
    let isVerified = true;
    try {
      const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
      if (empInfo && empInfo.verification) {
        isVerified = empInfo.verification.status === 'verified';
      }
    } catch (_) {}

    if (!isVerified) {
      setShowVerificationPrompt(true);
      return;
    }

    setLoadingAction(true);
    setActionError('');
    const token = localStorage.getItem('employerToken');

    // Determine next sequential number like 01, 02, 03...
    let maxNum = 0;
    links.forEach(l => {
      const n = parseInt(l.name, 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    });
    const nextNum = maxNum > 0 ? maxNum + 1 : links.length + 1;
    const suggestedName = String(nextNum).padStart(2, '0');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/employer/jobs/${jobId}/share-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: suggestedName })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setLinks(data.data);
        if (onUpdateJobLinks) {
          onUpdateJobLinks(jobId, data.data);
        }
      } else {
        // Local fallback
        const newLinkObj = {
          linkId: suggestedName,
          name: suggestedName,
          createdAt: new Date(),
          applicationsCount: 0
        };
        const updated = [...links, newLinkObj];
        setLinks(updated);
        if (onUpdateJobLinks) {
          onUpdateJobLinks(jobId, updated);
        }
      }
    } catch (err) {
      console.error('Error creating link:', err);
      const newLinkObj = {
        linkId: suggestedName,
        name: suggestedName,
        createdAt: new Date(),
        applicationsCount: 0
      };
      const updated = [...links, newLinkObj];
      setLinks(updated);
      if (onUpdateJobLinks) {
        onUpdateJobLinks(jobId, updated);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteLink = async (index) => {
    if (links.length <= 1) return;
    const link = links[index];
    const token = localStorage.getItem('employerToken');
    setLoadingAction(true);
    setActionError('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const targetId = link.linkId || link._id || index;
      const res = await fetch(`${apiUrl}/api/employer/jobs/${jobId}/share-links/${targetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setLinks(data.data);
        if (onUpdateJobLinks) {
          onUpdateJobLinks(jobId, data.data);
        }
      } else {
        const updated = links.filter((_, i) => i !== index);
        setLinks(updated);
        if (onUpdateJobLinks) {
          onUpdateJobLinks(jobId, updated);
        }
      }
    } catch (err) {
      console.error('Error deleting link:', err);
      const updated = links.filter((_, i) => i !== index);
      setLinks(updated);
      if (onUpdateJobLinks) {
        onUpdateJobLinks(jobId, updated);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // If employer is not verified, render the Verification Required prompt first!
  if (!isVerified) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200 flex flex-col text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
              verificationStatus === 'pending'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {verificationStatus === 'pending' ? '⏳ Under Review' : '⚠️ Account Not Verified'}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Icon & Heading */}
          <div className="pt-1">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs mb-3.5">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 leading-snug">
              {verificationStatus === 'pending' 
                ? 'Verification is Under Review' 
                : 'Verify Account to Share Links'}
            </h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              {verificationStatus === 'pending' ? (
                <>
                  Your business documents have been submitted and are currently being reviewed by our admin team. Application links and candidate visibility will activate automatically upon approval.
                </>
              ) : (
                <>
                  Direct candidate application links are locked for unverified accounts. Complete your business verification to unlock custom application links and receive candidate applications.
                </>
              )}
            </p>
          </div>

          {/* Target Job preview */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
              {(companyName || 'CO').substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">{jobTitle}</p>
              <p className="text-[11px] text-gray-500 truncate">{companyName} • {job.location || 'Remote'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Link
              to="/employer/verification"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              <span>{verificationStatus === 'pending' ? 'Check Status →' : 'Verify Now →'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-start justify-between shrink-0">
          <div className="space-y-1">
            {isNewlyPublished ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-green-100 text-green-800">
                  🎉 Published Successfully!
                </span>
              </div>
            ) : (
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Direct Candidate Application Links
              </span>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
              {isNewlyPublished ? "Share Direct Apply Links" : `Share "${jobTitle}"`}
            </h3>
            <p className="text-xs text-gray-500">
              Generate multiple renamed links (e.g., 01, 02, 03) to track which link brings the most applications.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Job Mini Preview */}
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 font-black flex items-center justify-center text-sm shrink-0">
            {job.companyInitial || companyName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-gray-900 truncate">{jobTitle}</h4>
            <p className="text-[11px] text-gray-500 truncate">{companyName} • {job.location || 'Hybrid'}</p>
          </div>
          <button
            type="button"
            onClick={handleAddNewLink}
            disabled={loadingAction}
            className="px-3.5 py-1.5 bg-[#29953f] hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>+</span>
            <span>New Link</span>
          </button>
        </div>

        {actionError && (
          <div className="p-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {actionError}
          </div>
        )}

        {/* Scrollable Links List */}
        <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 py-1">
          {links.map((link, index) => {
            const url = getFullUrl(link);
            const isCopied = copiedIndex === index;
            const isEditing = editingIndex === index;
            const appsCount = link.applicationsCount || 0;

            return (
              <div 
                key={link._id || link.linkId || index}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-gray-200 space-y-2 hover:border-gray-300 transition-colors"
              >
                {/* Link Top Row: Label, Edit Button, Applications Count */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0">
                      🔗
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1 max-w-[220px]">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(index);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          autoFocus
                          className="px-2.5 py-1 bg-white border border-green-500 rounded-lg text-xs font-bold text-gray-900 outline-none w-full shadow-2xs"
                          placeholder="e.g. 01, 02, Indeed"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(index)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-extrabold text-sm text-gray-900 truncate">
                          Link: <span className="text-[#29953f] bg-green-50 px-2 py-0.5 rounded-md border border-green-200">{link.name || link.linkId || `0${index + 1}`}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartRename(index, link.name || link.linkId || `0${index + 1}`)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                          title="Rename link"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Applications count pill & delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      appsCount > 0 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      <span className="font-black">{appsCount}</span> {appsCount === 1 ? 'Application' : 'Applications'}
                    </span>

                    {appsCount > 0 && (
                      <Link
                        to="/employer/applications"
                        state={{ jobTitle: jobTitle, sourceLink: link.name || link.linkId }}
                        onClick={onClose}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-0.5"
                        title="View candidates who applied through this link"
                      >
                        View →
                      </Link>
                    )}

                    {links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(index)}
                        disabled={loadingAction}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete this link"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Link URL Box and Copy Button */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={url}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-700 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(index, url)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1 ${
                      isCopied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-[#29953f] hover:bg-green-700 text-white'
                    }`}
                  >
                    {isCopied ? "✓ Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={handleAddNewLink}
            disabled={loadingAction}
            className="text-xs font-bold text-[#29953f] hover:text-green-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span className="text-sm font-extrabold">+</span>
            <span>Add another link (02, 03...)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Verification Required Prompt Modal */}
        {showVerificationPrompt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3.5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Account Verification Required</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Verify your employer account to create custom application tracking links. Verified status activates candidate visibility and unique link tracking.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowVerificationPrompt(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <a
                  href="/employer/verification"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#16a34a] hover:bg-[#15803d] rounded-lg transition-colors shadow-sm"
                >
                  Verify Account Now
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default JobShareModal;
