import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { formatPhoneWithCountryCode } from '../../../data/countryCodes';
import CandidateVideoCard from '../../common/CandidateVideoCard';
import { 
  exportCandidateProfileAsPdf, 
  exportCandidateProfileAsDoc 
} from '../../../utils/candidateProfileExporter';

const CandidateProfileFullScreen = ({
  isOpen = false,
  onClose,
  candidate,
  application,
  updateCandidateStatus,
  employerProfile = null,
  backLabel = 'Applications',
  isCandidatesDirectory = false,
  onOpenMessage = null
}) => {
  const isFromCandidates = isCandidatesDirectory || backLabel === 'Candidates';
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState('New');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (application?.status) {
      setCurrentStatus(application.status);
    } else if (candidate?.status) {
      setCurrentStatus(candidate.status);
    }
  }, [application?.status, candidate?.status]);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  const cand = candidate;
  const app = application || {};

  const displayAppId = app.displayAppId || app.applicationNumber || cand.applicationNumber || cand.displayAppId || 500101;
  const jobTitle = isFromCandidates
    ? (cand.designation || cand.currentDesignation || cand.professionalDetails?.designation || 'Candidate Profile')
    : (app.jobTitle || cand.appliedJob || 'Job Application');
  const appliedDate = app.appliedDate || cand.date || 'Recent';
  const sourceLink = app.sourceLink || cand.sourceLink || 'Direct Apply';
  const resumeUrl = app.resume || cand.resume || cand.documents?.resume || '';
  const coverLetterUrl = app.coverLetter || cand.coverLetter || cand.documents?.coverLetter || '';

  // Helpers for candidate info
  const getWorkExp = () => {
    if (cand.professionalDetails?.totalExperience && cand.professionalDetails.totalExperience !== 'N/A' && cand.professionalDetails.totalExperience !== '') {
      return cand.professionalDetails.totalExperience;
    }
    if (cand.totalExperience && cand.totalExperience !== 'N/A' && cand.totalExperience !== '') {
      return cand.totalExperience;
    }
    if (cand.isFresher) return 'Fresher';
    if (cand.experience && cand.experience.length > 0) {
      return `${cand.experience.length} - ${cand.experience.length + 2} Yrs`;
    }
    return 'Fresher';
  };

  const getCurrentDesignation = () => {
    if (cand.currentDesignation) return cand.currentDesignation;
    if (cand.designation && cand.designation !== 'N/A' && cand.designation !== '') {
      return cand.designation;
    }
    const exps = cand.experience || [];
    if (Array.isArray(exps)) {
      const currentRole = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob))?.roles?.find(r => r.currentCompany || r.currentJob);
      if (currentRole?.jobTitle || currentRole?.title || currentRole?.role) return currentRole.jobTitle || currentRole.title || currentRole.role;
      if (exps[0]?.roles?.[0]?.jobTitle) return exps[0].roles[0].jobTitle;
      if (exps[0]?.role) return exps[0].role;
    }
    return 'Job Seeker';
  };

  const getCurrentCompany = () => {
    if (cand.currentCompany) return cand.currentCompany;
    const exps = cand.experience || [];
    if (Array.isArray(exps)) {
      const currentExp = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob) || e.currentCompany || e.currentJob) || exps[0];
      if (currentExp?.companyName || currentExp?.company) return currentExp.companyName || currentExp.company;
    }
    if (cand.professionalDetails?.currentCompany) {
      return cand.professionalDetails.currentCompany;
    }
    return cand.company || 'Fresher / Independent';
  };

  const getHighestQualification = () => {
    const quals = cand.qualifications || cand.education || [];
    if (!Array.isArray(quals) || quals.length === 0) return 'Graduate';
    const primary = quals.find(q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1)) || quals[0];
    return primary?.course || primary?.educationType || primary?.degree || primary?.university || 'Graduate';
  };

  const getInitials = (name = '') => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const candAvatar = cand.avatar || cand.profilePhoto || cand.profilePicture || cand.photo || cand.personalDetails?.profilePhoto;

  const handleStatusChange = (newStatus) => {
    setCurrentStatus(newStatus);
    setIsStatusDropdownOpen(false);

    if (app.appId && updateCandidateStatus) {
      updateCandidateStatus(app.appId, newStatus);
    }
    if (app) {
      app.status = newStatus;
    }
    if (cand.history && app.appId) {
      cand.history = cand.history.map(h => h.appId === app.appId ? { ...h, status: newStatus } : h);
    }
  };

  const handleDownloadPdf = () => {
    exportCandidateProfileAsPdf(cand, [], { 
      hasApplied: true, 
      jobTitle, 
      status: currentStatus,
      appliedDate 
    });
  };

  const handleDownloadDoc = () => {
    exportCandidateProfileAsDoc(cand, [], { 
      hasApplied: true, 
      jobTitle, 
      status: currentStatus,
      appliedDate 
    });
  };

  const handleOpenMessage = () => {
    if (onOpenMessage) {
      onOpenMessage(app, cand);
      return;
    }
    onClose();
    navigate('/employer/messages', { 
      state: { 
        initialApplication: app, 
        initialEmployee: cand 
      } 
    });
  };

  // Extract skills array
  const skillsList = (() => {
    if (Array.isArray(cand.skills)) return cand.skills.filter(Boolean);
    if (typeof cand.skills === 'string') return cand.skills.split(',').map(s => s.trim()).filter(Boolean);
    if (Array.isArray(cand.keySkills)) return cand.keySkills.filter(Boolean);
    if (typeof cand.keySkills === 'string') return cand.keySkills.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  })();

  const qualificationsList = Array.isArray(cand.qualifications) 
    ? cand.qualifications 
    : (Array.isArray(cand.education) ? cand.education : []);

  const experienceList = Array.isArray(cand.experience) ? cand.experience : [];
  const screeningAnswers = Array.isArray(app.screeningAnswers) ? app.screeningAnswers : (Array.isArray(cand.screeningAnswers) ? cand.screeningAnswers : []);

  return createPortal(
    <div 
      className="fixed inset-y-0 right-0 left-0 min-[860px]:left-[248px] z-40 bg-white overflow-y-auto font-sans shadow-lg border-l border-gray-100" 
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      
      {/* 1. STICKY TOPBAR */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-gray-200 px-6 py-3">
        <div className="max-w-[980px] mx-auto flex items-center justify-between gap-4">
          
          {/* Back Pill Button */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-900 bg-white text-gray-900 text-xs font-bold hover:bg-gray-900 hover:text-white transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>{backLabel}</span>
          </button>

          {/* Centered Identifier */}
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:inline-block">
            Candidate Profile #{displayAppId}
          </span>

          {/* Right Action Buttons: Download PDF, DOC, Close (NO drop shadow) */}
          <div className="flex items-center gap-2">
            {!isFromCandidates && (
              <>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download SahiJob Candidate Profile (PDF)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDoc}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-full border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download SahiJob Candidate Profile (Word .doc)"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>DOC</span>
            </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer text-xl font-bold leading-none ml-1"
              title="Close (Esc)"
            >
              &times;
            </button>
          </div>

        </div>
      </div>

      {/* 2. FULLSCREEN MAIN BODY CONTAINER */}
      <div className="max-w-[980px] mx-auto px-6 sm:px-10 py-10">
        
        {/* Applied Job Title First */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">
          {jobTitle}
        </h1>

        {/* Candidate Meta Row (Avatar, Name, Verified Tick, Current Role) */}
        <div className="flex items-center gap-4 mb-6">
          {candAvatar && !avatarFailed ? (
            <img 
              src={candAvatar} 
              alt={cand.name} 
              onError={() => setAvatarFailed(true)}
              className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-2 ring-gray-100" 
            />
          ) : (
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shrink-0 ring-2 ring-gray-100 ${cand.bg || 'bg-slate-900'}`}>
              {getInitials(cand.name)}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-[#0f172a] leading-tight">
                {cand.name}
              </span>
              <svg
                className="w-5 h-5 text-sky-600 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-label="Verified candidate"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.548 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.548 4.49 4.49 0 01-3.498-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                />
              </svg>
            </div>

            <span className="text-sm text-gray-500 font-medium mt-0.5">
              {getCurrentDesignation()} at {getCurrentCompany()}
            </span>

            <span className="text-xs text-gray-400 font-medium mt-1">
              Applied on {appliedDate} • Application #{displayAppId} • via {sourceLink}
            </span>
          </div>
        </div>

        {/* Action Buttons Row (NO drop shadow) */}
        {!isFromCandidates && (
        <div className="flex flex-wrap items-center gap-3 my-6">
          {/* Status Dropdown Pill Button */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(prev => !prev)}
              className="h-10 px-4 rounded-full border border-gray-900 bg-white text-gray-900 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span>Status: {currentStatus}</span>
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                {['New', 'Viewed', 'Shortlisted', 'Rejected', 'Hired'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{st}</span>
                    {currentStatus.toLowerCase() === st.toLowerCase() && (
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortlist / Select Pill Button */}
          <button
            type="button"
            onClick={() => handleStatusChange('Shortlisted')}
            className={`h-10 px-5 rounded-full font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              currentStatus.toLowerCase() === 'shortlisted'
                ? 'bg-emerald-800 text-white'
                : 'bg-[#059669] hover:bg-[#047857] text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{currentStatus.toLowerCase() === 'shortlisted' ? 'Shortlisted ✓' : 'Shortlist Candidate'}</span>
          </button>

          {/* Quick Reject Pill Button */}
          <button
            type="button"
            onClick={() => handleStatusChange('Rejected')}
            className={`h-10 px-5 rounded-full font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer ${
              currentStatus.toLowerCase() === 'rejected'
                ? 'bg-rose-600 text-white border border-rose-600'
                : 'border border-rose-300 text-rose-600 hover:bg-rose-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{currentStatus.toLowerCase() === 'rejected' ? 'Rejected ✓' : 'Reject'}</span>
          </button>

          {/* Message Candidate Pill Button */}
          <button
            type="button"
            onClick={handleOpenMessage}
            className="h-10 px-5 rounded-full border border-gray-900 bg-white hover:bg-gray-900 hover:text-white text-gray-900 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Message Candidate</span>
          </button>
        </div>
        )}

        {/* SECTION 1: REQUIRED SKILLS / KEY SKILLS */}
        {skillsList.length > 0 && (
          <div className="border-t-[1.5px] border-[#0f172a] mt-9 pt-5">
            <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#0f172a] mb-4">
              Key Skills & Competencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-4 py-1.5 rounded-full border border-gray-900 text-gray-900 font-semibold text-sm bg-white"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: APPLICATION & CANDIDATE DETAILS (Exact Key-Value Table from Image 1) */}
        <div className="border-t-[1.5px] border-[#0f172a] mt-9 pt-5">
          <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#0f172a] mb-4">
            {isFromCandidates ? 'Candidate Details' : 'Application Details'}
          </h3>
          <dl className="grid grid-cols-[180px_1fr] sm:grid-cols-[220px_1fr] text-[14.5px]">
            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">{isFromCandidates ? 'Candidate ID' : 'Application ID'}</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold font-mono">#{displayAppId}</dd>

            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">{isFromCandidates ? 'Primary Role' : 'Applied Role'}</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold">{jobTitle}</dd>

            {!isFromCandidates && (
              <>
                <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Applied Date</dt>
                <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold">{appliedDate}</dd>

                <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Application Source</dt>
                <dd className="py-3 border-b border-gray-200 text-emerald-800 font-bold">
                  <span className="bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                    {sourceLink}
                  </span>
                </dd>

                <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Current Status</dt>
                <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold uppercase">{currentStatus}</dd>
              </>
            )}

            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Total Experience</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold">{getWorkExp()}</dd>

            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Current Designation</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold">{getCurrentDesignation()}</dd>

            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Current Company</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold">{getCurrentCompany()}</dd>

            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Highest Qualification</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold">{getHighestQualification()}</dd>

            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Location</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold">{cand.location || cand.city || 'Bangalore, Karnataka'}</dd>

            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Official Email</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold break-all">{cand.email || 'N/A'}</dd>

            <dt className="py-3 border-b border-gray-200 text-gray-500 font-normal">Phone Number</dt>
            <dd className="py-3 border-b border-gray-200 text-gray-900 font-bold">{formatPhoneWithCountryCode(cand.phone || cand.mobile || cand.mobileNumber)}</dd>
          </dl>
        </div>

        {/* SECTION 3: BRIEF ABOUT CANDIDATE / PROFESSIONAL SUMMARY */}
        <div className="border-t-[1.5px] border-[#0f172a] mt-9 pt-5">
          <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#0f172a] mb-4">
            Brief About Candidate / Professional Summary
          </h3>
          <div className="text-[15px] leading-relaxed text-[#2a2a2a] whitespace-pre-line break-words">
            {cand.brief || cand.summary || cand.bio || cand.professionalDetails?.about || (
              <span className="text-gray-400 italic">No professional summary provided.</span>
            )}
          </div>
        </div>

        {/* SECTION 4: WORK EXPERIENCE */}
        {experienceList.length > 0 && (
          <div className="border-t-[1.5px] border-[#0f172a] mt-9 pt-5">
            <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#0f172a] mb-4 flex items-center justify-between">
              <span>Work Experience</span>
              <span className="text-xs font-semibold text-gray-500 lowercase">({experienceList.length} record{experienceList.length > 1 ? 's' : ''})</span>
            </h3>

            <div className="space-y-6">
              {experienceList.map((exp, idx) => {
                const roles = exp.roles && exp.roles.length > 0 ? exp.roles : [{
                  jobTitle: exp.designation || exp.jobTitle || 'Role',
                  isCurrentCompany: exp.isCurrentCompany || exp.isCurrent,
                  startDate: exp.startDate,
                  endDate: exp.endDate,
                  description: exp.description || exp.responsibilities || exp.rolesAndResponsibilities
                }];

                return (
                  <div key={idx} className="pb-5 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <h4 className="text-base font-extrabold text-gray-900">
                        {exp.companyName || exp.company || 'Company'}
                      </h4>
                      {exp.location && (
                        <span className="text-xs text-gray-500 font-medium">{exp.location}</span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {roles.map((r, rIdx) => (
                        <div key={rIdx} className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              {r.jobTitle || 'Designation'}
                              {r.isCurrentCompany && (
                                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Current Role
                                </span>
                              )}
                            </span>
                            {(r.startDate || r.endDate) && (
                              <span className="text-xs text-gray-500 font-medium">
                                {r.startDate || 'N/A'} – {r.isCurrentCompany ? 'Present' : (r.endDate || 'N/A')}
                              </span>
                            )}
                          </div>
                          {r.description && (
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line mt-2">
                              {r.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 5: EDUCATION */}
        {qualificationsList.length > 0 && (
          <div className="border-t-[1.5px] border-[#0f172a] mt-9 pt-5">
            <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#0f172a] mb-4 flex items-center justify-between">
              <span>Education</span>
              <span className="text-xs font-semibold text-gray-500 lowercase">({qualificationsList.length} qualification{qualificationsList.length > 1 ? 's' : ''})</span>
            </h3>

            <div className="space-y-3">
              {qualificationsList.map((q, idx) => (
                <div key={idx} className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                      {q.course || q.degree || q.educationType || 'Degree / Course'}
                      {q.isPrimary && (
                        <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          Primary
                        </span>
                      )}
                    </span>
                    <p className="text-xs font-medium text-gray-600 mt-0.5">
                      {q.university || q.institute || q.college || q.school || 'University / Institution'}
                    </p>
                  </div>
                  {(q.yearOfPassing || q.passingYear || q.year || q.cgpa || q.percentage) && (
                    <span className="text-xs font-bold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 shrink-0">
                      {[q.yearOfPassing || q.passingYear || q.year, q.cgpa ? `${q.cgpa} CGPA` : q.percentage ? `${q.percentage}%` : null].filter(Boolean).join(' • ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: DOCUMENTS & RESUME */}
        {(resumeUrl || coverLetterUrl || cand.introVideo || app.introVideo || cand.hasIntroVideo || app.hasIntroVideo) && (
          <div className="border-t-[1.5px] border-[#0f172a] mt-9 pt-5">
            <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#0f172a] mb-4">
              Documents & Media
            </h3>

            <div className="space-y-4">
              {/* Resume Card */}
              {resumeUrl && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Applicant Resume / CV</h4>
                      <p className="text-xs text-gray-400">PDF / Document attachment</p>
                    </div>
                  </div>

                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
                  >
                    View Resume
                  </a>
                </div>
              )}

              {/* Cover Letter */}
              {coverLetterUrl && (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Cover Letter</h4>
                      <p className="text-xs text-gray-400">Applicant Cover Letter</p>
                    </div>
                  </div>

                  <a
                    href={coverLetterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
                  >
                    View Letter
                  </a>
                </div>
              )}

              {/* Video Card */}
              {(app.introVideo || cand.introVideo || app.hasIntroVideo || cand.hasIntroVideo) && (
                <div className="mt-2">
                  <CandidateVideoCard
                    videoUrl={app.introVideo || cand.introVideo || cand.documents?.introVideo}
                    hasVideo={Boolean(app.hasIntroVideo || cand.hasIntroVideo || app.introVideo || cand.introVideo)}
                    isVideoLocked={Boolean(app.isVideoLocked || cand.isVideoLocked)}
                    videoVisibility={cand.videoVisibility || cand.documents?.videoVisibility || 'everyone'}
                    appliedToYou={true}
                    employerProfile={employerProfile}
                    candidateName={cand.fullName || cand.name}
                    maxPlayerHeight="280px"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 7: SCREENING QUESTIONS & ANSWERS */}
        {screeningAnswers.length > 0 && (
          <div className="border-t-[1.5px] border-[#0f172a] mt-9 pt-5">
            <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#0f172a] mb-4 flex items-center justify-between">
              <span>Screening Questions & Answers</span>
              <span className="text-xs font-semibold text-gray-500 lowercase">({screeningAnswers.length} question{screeningAnswers.length > 1 ? 's' : ''})</span>
            </h3>

            <div className="space-y-3">
              {screeningAnswers.map((item, idx) => (
                <div key={idx} className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80">
                  <p className="text-xs font-bold text-gray-900 mb-1.5">
                    Q{idx + 1}. {item.question}
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-800 font-medium">
                    {item.answer || <span className="italic text-gray-400">No answer provided</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};

export default CandidateProfileFullScreen;
