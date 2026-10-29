import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import JobShareModal from '../../common/JobShareModal';

const sanitizeHtml = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'h2', 'h3', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
};

const ManageJobs = ({ portalConfig, employerProfile, jobs = [], candidates = [], toggleJobStatus, hideHeader = false }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobToShare, setJobToShare] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const closeButtonRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  useEffect(() => {
    if (selectedJob) {
      lastActiveElementRef.current = document.activeElement;
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setSelectedJob(null);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
          lastActiveElementRef.current.focus();
        }
      };
    }
  }, [selectedJob]);

  // Filter jobs by search term and status
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.details?.jobTitle && job.details.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All Status' || 
      (statusFilter === 'Active' && job.status !== 'Closed') ||
      (statusFilter === 'Closed' && job.status === 'Closed');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={`animate-in fade-in duration-150 ${hideHeader ? '' : 'space-y-6 pb-10'}`}>
      
      {!hideHeader && (
        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-[#101828] tracking-[-0.025em]">Jobs</h1>
          <p className="text-[#667085] text-[14px] mt-1">Manage and track all your job postings and applicant analytics.</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex gap-3 justify-between flex-wrap mb-4">
        {/* Search input (max 360px, search icon, green focus ring) */}
        <label className="flex items-center gap-2.5 border border-[#d0d5dd] rounded-[8px] px-3 flex-1 max-w-[360px] text-[#98a2b3] focus-within:border-[#16a34a] focus-within:ring-2 focus-within:ring-[#ecfdf3] transition-all bg-white">
          <svg className="w-[18px] h-[18px] shrink-0 text-[#98a2b3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by title or location" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="border-0 bg-transparent outline-none py-2 w-full text-[#101828] text-[14px] placeholder:text-[#98a2b3]"
            aria-label="Search jobs"
          />
        </label>

        {/* Status filter select */}
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[#d0d5dd] rounded-[8px] py-2 px-3 bg-white font-medium text-[14px] text-[#101828] outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#ecfdf3] transition-all cursor-pointer"
          aria-label="Filter by status"
        >
          <option value="All Status">All statuses</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Table-style Jobs List */}
      <div className="border-t border-[#eaecf0]">
        {/* Header Row (Desktop >= 1000px) */}
        <div className="hidden min-[1000px]:grid grid-cols-[minmax(0,2.4fr)_80px_110px_150px_140px] gap-4 items-center py-2.5 px-2 text-[#98a2b3] text-[13px] font-semibold border-b border-[#eaecf0]">
          <span>Job</span>
          <span>Views</span>
          <span>Applications</span>
          <span>Status</span>
          <span></span>
        </div>

        {/* Rows */}
        {filteredJobs.length === 0 ? (
          <div className="py-16 px-5 text-center text-[#667085] border border-dashed border-[#d0d5dd] rounded-[12px] my-6">
            <div className="w-12 h-12 rounded-full bg-[#ecfdf3] text-[#15803d] flex items-center justify-center mx-auto mb-3.5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </div>
            <h3 className="m-0 mb-1 text-[#101828] font-semibold text-[17px]">No jobs match your search</h3>
            <p className="m-0 text-[#667085] text-[14px]">Try a different title or clear the status filter.</p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const isClosed = job.status === 'Closed';
            const appsCount = Math.max(job.applications || 0, candidates?.filter(c => c.history?.some(h => h.title === job.title))?.length || 0);
            const viewsCount = job.views || 0;
            const postedDate = job.date || job.postedAt || (job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently');
            const openingsCount = Number(job.details?.openings || job.openings || '1');
            const mode = job.details?.workLocation || job.location || 'Hybrid';
            const empType = job.details?.employmentType || 'Full-time';
            const payText = job.salary || '';

            return (
              <div 
                key={job.id || job._id}
                className="grid min-[1000px]:grid-cols-[minmax(0,2.4fr)_80px_110px_150px_140px] grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 items-center py-4 px-2 border-b border-[#eaecf0] hover:bg-[#f9fafb] transition-colors"
              >
                {/* 1. Job Title & Meta */}
                <div className="min-w-0 min-[1000px]:col-auto col-span-1">
                  <h3 className="m-0 font-semibold text-[15.5px] text-[#101828] leading-[1.35] flex items-center gap-2 flex-wrap">
                    <span className="truncate">{job.title}</span>
                    <span className="font-semibold text-[12px] text-[#667085] bg-[#f9fafb] border border-[#eaecf0] px-2 py-0.5 rounded-full shrink-0">
                      {openingsCount} {openingsCount > 1 ? 'openings' : 'opening'}
                    </span>
                  </h3>
                  <p className="text-[#667085] text-[13.5px] mt-0.5 mb-0 truncate">
                    {empType} · {mode}{payText ? ` · ${payText}` : ''}
                  </p>
                </div>

                {/* 2. Status (Mobile moves to top right, Desktop 4th col) */}
                <div className="min-[1000px]:order-4 min-[1000px]:col-auto col-span-1 justify-self-end min-[1000px]:justify-self-start">
                  <div className="relative inline-flex items-center">
                    <select
                      value={isClosed ? 'Closed' : 'Active'}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (toggleJobStatus) toggleJobStatus(job.id || job._id);
                      }}
                      className={`appearance-none text-[11px] font-bold rounded-full pl-4.5 pr-5 py-0 !h-[22px] !min-h-0 cursor-pointer outline-none border transition-colors !leading-none shadow-2xs ${
                        isClosed 
                          ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      style={{ height: '22px', minHeight: '22px', lineHeight: '20px' }}
                      aria-label="Job status"
                    >
                      <option value="Active">Active</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none ${isClosed ? 'bg-gray-400' : 'bg-emerald-500'}`} />
                    <svg className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <small className="block text-[#98a2b3] text-[11px] mt-0.5 pl-0.5 whitespace-nowrap">
                    {isClosed ? 'Closed' : 'Posted'} {postedDate}
                  </small>
                </div>

                {/* 3. Views */}
                <div className="min-[1000px]:order-2 font-semibold text-[14.5px] text-[#101828]">
                  {viewsCount} <span className="min-[1000px]:hidden text-[#667085] font-normal text-[13px]">views</span>
                </div>

                {/* 4. Applications */}
                <div className="min-[1000px]:order-3 font-semibold text-[14.5px] text-[#101828]">
                  {appsCount} <span className="min-[1000px]:hidden text-[#667085] font-normal text-[13px]">applications</span>
                </div>

                {/* 5. Actions (34px borderless icon buttons) */}
                <div className="min-[1000px]:order-5 flex items-center justify-end gap-1 shrink-0 col-span-2 min-[1000px]:col-span-1 pt-1 min-[1000px]:pt-0">
                  <button
                    type="button"
                    onClick={() => { setJobToShare(job); setShowShareModal(true); }}
                    className="w-[34px] h-[34px] rounded-[8px] border-0 bg-transparent text-[#98a2b3] hover:text-[#15803d] hover:bg-[#ecfdf3] flex items-center justify-center transition-all cursor-pointer"
                    title="Share"
                    aria-label="Share"
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
                    </svg>
                  </button>

                  <Link
                    to="/employer/post-job"
                    state={{ jobToEdit: job }}
                    className="w-[34px] h-[34px] rounded-[8px] border-0 bg-transparent text-[#98a2b3] hover:text-[#15803d] hover:bg-[#ecfdf3] flex items-center justify-center transition-all cursor-pointer"
                    title="Edit"
                    aria-label="Edit"
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                    </svg>
                  </Link>

                  <Link 
                    to="/employer/applications" 
                    state={{ jobTitle: job.title }} 
                    className="w-[34px] h-[34px] rounded-[8px] border-0 bg-transparent text-[#98a2b3] hover:text-[#15803d] hover:bg-[#ecfdf3] flex items-center justify-center transition-all cursor-pointer" 
                    title="Applicants"
                    aria-label="Applicants"
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="8" r="3.5" />
                      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
                    </svg>
                  </Link>

                  <button 
                    type="button"
                    onClick={() => setSelectedJob(job)} 
                    className="w-[34px] h-[34px] rounded-[8px] border-0 bg-transparent text-[#98a2b3] hover:text-[#15803d] hover:bg-[#ecfdf3] flex items-center justify-center transition-all cursor-pointer" 
                    title="Details"
                    aria-label="Details"
                  >
                    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 11v5M12 8h.01" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Overlapping Right Sidebar Drawer for Job Details */}
      {selectedJob && (() => {
        const openingsCount = Number(selectedJob.details?.openings || selectedJob.openings || 1);
        const skillsList = selectedJob.qualifications && selectedJob.qualifications.length > 0
          ? selectedJob.qualifications.map(q => (typeof q === 'object' ? (q.name || q.title || '') : String(q))).filter(Boolean)
          : (typeof selectedJob.details?.skills === 'string'
              ? selectedJob.details.skills.split(',').map(s => s.trim()).filter(Boolean)
              : (Array.isArray(selectedJob.details?.skills) ? selectedJob.details.skills : []));

        return (
          <>
            {/* Backdrop: no blur, transparent dim rgba(16,24,40,0.14), does not cover sidebar on desktop (248px), covers full screen on <860px */}
            <div 
              className="fixed inset-0 left-0 min-[860px]:left-[248px] bg-[#101828]/[0.14] z-40 transition-opacity duration-250 animate-in fade-in cursor-pointer"
              onClick={() => setSelectedJob(null)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <div 
              role="dialog"
              aria-modal="true"
              aria-label="Job details"
              className="fixed inset-y-0 right-0 w-full min-[620px]:w-[620px] max-w-full bg-white z-50 flex flex-col h-full border-l border-[#eaecf0] shadow-[-16px_0_48px_rgba(16,24,40,0.08)] animate-in slide-in-from-right duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden"
            >
              
              {/* Header (Fixed) */}
              <div className="px-5 min-[860px]:px-7 py-[18px] border-b border-[#eaecf0] flex items-center justify-between shrink-0">
                <h2 className="text-[17px] font-bold text-[#101828] m-0">Job details</h2>
                <button 
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  aria-label="Close"
                  className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center text-[#98a2b3] hover:text-[#15803d] hover:bg-[#ecfdf3] transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content Body (Fixed: overflow-x-hidden to eliminate horizontal scroll completely) */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 min-[860px]:px-7 py-[26px] custom-scrollbar w-full max-w-full min-w-0">
                
                {/* 1. Job Title */}
                <h3 className="text-[26px] font-[800] text-[#101828] tracking-[-0.025em] leading-[1.2] break-words mb-3 w-full max-w-full">
                  {selectedJob.title}
                </h3>

                {/* 2. Tag Row */}
                <div className="flex flex-wrap items-center gap-2 mb-6 w-full max-w-full">
                  {/* Neutral Pill: Employment type · Work mode */}
                  <span className="border border-[#eaecf0] bg-white text-[#667085] text-[13px] font-semibold px-3 py-[3px] rounded-full max-w-full truncate">
                    {selectedJob.type || `${selectedJob.details?.employmentType || 'Full-time'} · ${selectedJob.details?.workLocation || selectedJob.location || 'Hybrid'}`}
                  </span>
                  
                  {/* Status Pill with Leading Dot */}
                  <span className={`text-[13px] font-semibold px-3 py-[3px] rounded-full inline-flex items-center gap-1.5 ${
                    selectedJob.status === 'Closed' 
                      ? 'bg-[#f2f4f7] text-[#667085]' 
                      : 'bg-[#ecfdf3] text-[#15803d]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedJob.status === 'Closed' ? 'bg-[#98a2b3]' : 'bg-[#16a34a]'
                    }`} />
                    {selectedJob.status === 'Closed' ? 'Closed' : 'Active'}
                  </span>

                  {/* Openings Neutral Pill */}
                  <span className="border border-[#eaecf0] bg-white text-[#667085] text-[13px] font-semibold px-3 py-[3px] rounded-full">
                    {openingsCount} {openingsCount === 1 ? 'opening' : 'openings'}
                  </span>
                </div>

                {/* 3. Stats Strip (minmax(0, 1fr) for columns to prevent overflow, min-w-0 on all cells) */}
                <div className="grid grid-cols-2 min-[860px]:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)] border border-[#eaecf0] rounded-[12px] mb-6 overflow-hidden w-full max-w-full">
                  <div className="p-3.5 min-[860px]:p-4 flex flex-col justify-start min-w-0">
                    <span className="text-[12.5px] font-medium text-[#667085] whitespace-nowrap">Total views</span>
                    <span className="text-[22px] font-bold text-[#101828] leading-[1.25] tracking-[-0.02em] mt-1 truncate">
                      {selectedJob.views || 0}
                    </span>
                  </div>
                  <div className="p-3.5 min-[860px]:p-4 border-l border-[#eaecf0] flex flex-col justify-start min-w-0">
                    <span className="text-[12.5px] font-medium text-[#667085] whitespace-nowrap">Applications</span>
                    <span className="text-[22px] font-bold text-[#101828] leading-[1.25] tracking-[-0.02em] mt-1 truncate">
                      {Math.max(selectedJob.applications || 0, candidates?.filter(c => c.history?.some(h => h.title === selectedJob.title))?.length || 0)}
                    </span>
                  </div>
                  <div className="p-3.5 min-[860px]:p-4 border-t min-[860px]:border-t-0 min-[860px]:border-l border-[#eaecf0] flex flex-col justify-start min-w-0">
                    <span className="text-[12.5px] font-medium text-[#667085] whitespace-nowrap">Openings</span>
                    <span className="text-[22px] font-bold text-[#101828] leading-[1.25] tracking-[-0.02em] mt-1 truncate">
                      {openingsCount}
                    </span>
                  </div>
                  <div className="p-3.5 min-[860px]:p-4 border-t min-[860px]:border-t-0 border-l border-[#eaecf0] flex flex-col justify-start min-w-0">
                    <span className="text-[12.5px] font-medium text-[#667085] whitespace-nowrap">Salary</span>
                    <span className="text-[15px] font-bold text-[#101828] leading-[1.4] mt-1 break-words">
                      {selectedJob.salary || 'Negotiable'}
                    </span>
                  </div>
                </div>

                {/* 4. Detail Rows (minmax(0, 1fr) for value column, min-w-0 on all items) */}
                {/* Job title */}
                <div className="grid grid-cols-1 min-[860px]:grid-cols-[150px_minmax(0,1fr)] gap-1 min-[860px]:gap-4 py-[15px] border-t border-[#eaecf0] items-baseline w-full max-w-full min-w-0">
                  <span className="text-[14px] font-medium text-[#667085] shrink-0">Job title</span>
                  <div className="text-[14.5px] font-medium text-[#101828] min-w-0 max-w-full break-words">
                    {selectedJob.details?.jobTitle || selectedJob.title || (
                      <span className="text-[#98a2b3]">Not specified</span>
                    )}
                  </div>
                </div>

                {/* Employment type */}
                <div className="grid grid-cols-1 min-[860px]:grid-cols-[150px_minmax(0,1fr)] gap-1 min-[860px]:gap-4 py-[15px] border-t border-[#eaecf0] items-baseline w-full max-w-full min-w-0">
                  <span className="text-[14px] font-medium text-[#667085] shrink-0">Employment type</span>
                  <div className="text-[14.5px] font-medium text-[#101828] min-w-0 max-w-full break-words">
                    {selectedJob.details?.employmentType || selectedJob.type || (
                      <span className="text-[#98a2b3]">Not specified</span>
                    )}
                  </div>
                </div>

                {/* Experience */}
                <div className="grid grid-cols-1 min-[860px]:grid-cols-[150px_minmax(0,1fr)] gap-1 min-[860px]:gap-4 py-[15px] border-t border-[#eaecf0] items-baseline w-full max-w-full min-w-0">
                  <span className="text-[14px] font-medium text-[#667085] shrink-0">Experience</span>
                  <div className="text-[14.5px] font-medium text-[#101828] min-w-0 max-w-full break-words">
                    {selectedJob.details?.experience || (
                      <span className="text-[#98a2b3]">Not specified</span>
                    )}
                  </div>
                </div>

                {/* Openings (if defined in details) */}
                {(selectedJob.details?.openings || selectedJob.openings) && (
                  <div className="grid grid-cols-1 min-[860px]:grid-cols-[150px_minmax(0,1fr)] gap-1 min-[860px]:gap-4 py-[15px] border-t border-[#eaecf0] items-baseline w-full max-w-full min-w-0">
                    <span className="text-[14px] font-medium text-[#667085] shrink-0">Openings</span>
                    <div className="text-[14.5px] font-medium text-[#101828] min-w-0 max-w-full break-words">
                      {selectedJob.details?.openings || selectedJob.openings}
                    </div>
                  </div>
                )}

                {/* Qualification (if defined) */}
                {selectedJob.details?.qualification && (
                  <div className="grid grid-cols-1 min-[860px]:grid-cols-[150px_minmax(0,1fr)] gap-1 min-[860px]:gap-4 py-[15px] border-t border-[#eaecf0] items-baseline w-full max-w-full min-w-0">
                    <span className="text-[14px] font-medium text-[#667085] shrink-0">Qualification</span>
                    <div className="text-[14.5px] font-medium text-[#101828] min-w-0 max-w-full break-words">
                      {selectedJob.details.qualification}
                    </div>
                  </div>
                )}

                {/* Stream (if defined) */}
                {selectedJob.details?.stream && (
                  <div className="grid grid-cols-1 min-[860px]:grid-cols-[150px_minmax(0,1fr)] gap-1 min-[860px]:gap-4 py-[15px] border-t border-[#eaecf0] items-baseline w-full max-w-full min-w-0">
                    <span className="text-[14px] font-medium text-[#667085] shrink-0">Stream</span>
                    <div className="text-[14.5px] font-medium text-[#101828] min-w-0 max-w-full break-words">
                      {selectedJob.details.stream}
                    </div>
                  </div>
                )}

                {/* Job category (if defined) */}
                {selectedJob.details?.category && (
                  <div className="grid grid-cols-1 min-[860px]:grid-cols-[150px_minmax(0,1fr)] gap-1 min-[860px]:gap-4 py-[15px] border-t border-[#eaecf0] items-baseline w-full max-w-full min-w-0">
                    <span className="text-[14px] font-medium text-[#667085] shrink-0">Job category</span>
                    <div className="text-[14.5px] font-medium text-[#101828] min-w-0 max-w-full break-words">
                      {selectedJob.details.category}
                    </div>
                  </div>
                )}

                {/* About role (Stacked block) */}
                <div className="py-[15px] border-t border-[#eaecf0] w-full max-w-full min-w-0 overflow-hidden">
                  <span className="text-[14px] font-medium text-[#667085] block mb-2">About role</span>
                  {selectedJob.details?.aboutRole ? (
                    <div 
                      className="rich-text-content w-full max-w-full min-w-0 break-words"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedJob.details.aboutRole) }}
                    />
                  ) : (
                    <span className="text-[#98a2b3] font-normal text-[14.5px]">Not provided</span>
                  )}
                </div>

                {/* Responsibilities (Stacked block) */}
                <div className="py-[15px] border-t border-[#eaecf0] w-full max-w-full min-w-0 overflow-hidden">
                  <span className="text-[14px] font-medium text-[#667085] block mb-2">Responsibilities</span>
                  {selectedJob.details?.responsibilities ? (
                    <div 
                      className="rich-text-content w-full max-w-full min-w-0 break-words"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedJob.details.responsibilities) }}
                    />
                  ) : (
                    <span className="text-[#98a2b3] font-normal text-[14.5px]">Not provided</span>
                  )}
                </div>

                {/* Skills required (Stacked block) */}
                <div className="py-[15px] border-t border-[#eaecf0] w-full max-w-full min-w-0 overflow-hidden">
                  <span className="text-[14px] font-medium text-[#667085] block mb-2">Skills required</span>
                  {skillsList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1 w-full max-w-full">
                      {skillsList.map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ecfdf3] text-[#15803d] text-[13px] font-semibold rounded-full max-w-full break-words"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span className="break-words">{skill}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#98a2b3] font-normal text-[14.5px]">Not provided</span>
                  )}
                </div>

                {/* Salary (Two-column row) */}
                <div className="grid grid-cols-1 min-[860px]:grid-cols-[150px_minmax(0,1fr)] gap-1 min-[860px]:gap-4 py-[15px] border-t border-[#eaecf0] items-baseline w-full max-w-full min-w-0">
                  <span className="text-[14px] font-medium text-[#667085] shrink-0">Salary</span>
                  <div className="text-[14.5px] font-medium text-[#101828] min-w-0 max-w-full break-words">
                    {selectedJob.salary || <span className="text-[#98a2b3]">Not specified</span>}
                  </div>
                </div>

              </div>

              {/* Fixed Footer */}
              <div className="px-5 min-[860px]:px-7 py-4 border-t border-[#eaecf0] flex items-center gap-3 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setJobToShare(selectedJob);
                    setShowShareModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-white hover:bg-[#f9fafb] text-[#101828] border border-[#d0d5dd] font-semibold text-[14px] rounded-[8px] transition-colors text-center cursor-pointer shadow-none"
                >
                  Share apply link
                </button>
                <Link 
                  to="/employer/applications" 
                  state={{ jobTitle: selectedJob.title }}
                  className="flex-1 py-2.5 px-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-[14px] rounded-[8px] transition-colors text-center cursor-pointer shadow-none"
                >
                  View applications
                </Link>
              </div>

            </div>
          </>
        );
      })()}

      {/* Share Apply Link Modal */}
      {jobToShare && (
        <JobShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setJobToShare(null);
          }}
          job={jobToShare}
        />
      )}

    </div>
  );
};

export default ManageJobs;
