import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import './drawerAndSupport.css';
import SjAvatar from './primitives/SjAvatar';
import SjPill from './primitives/SjPill';
import SjButton from './primitives/SjButton';
import SjJobDetailsContent from './SjJobDetailsContent';

const sanitizeHtml = (html) => {
  if (!html) return '';
  // Replace non-breaking spaces with standard space so sentences wrap naturally
  const normalized = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00A0/g, ' ');

  return DOMPurify.sanitize(normalized, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
  });
};

const getInitials = (str) => {
  if (!str) return 'HR';
  const parts = str.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return str.slice(0, 2).toUpperCase();
};

const renderFormattedContent = (content, isListPreferred = false) => {
  if (!content) return null;

  // If array of items (like job.resp)
  if (Array.isArray(content)) {
    if (content.length === 0) return null;
    return (
      <ul className="sj-rich-text list-disc pl-5 space-y-2 m-0 max-w-full">
        {content.map((item, idx) => (
          <li key={idx} className="text-[15px] leading-relaxed text-[#2a2a2a] break-words">
            {typeof item === 'string'
              ? item.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' ')
              : item}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof content === 'string') {
    const normalized = content.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' ');
    const trimmed = normalized.trim();
    if (!trimmed) return null;

    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(trimmed);
    if (hasHtmlTags) {
      return (
        <div
          className="sj-rich-text text-[15px] leading-relaxed text-[#2a2a2a] break-words max-w-full"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(trimmed) }}
        />
      );
    }

    // If plain text and multiple lines
    if (isListPreferred) {
      const lines = trimmed
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 1) {
        return (
          <ul className="sj-rich-text list-disc pl-5 space-y-2 m-0 max-w-full">
            {lines.map((line, idx) => (
              <li key={idx} className="text-[15px] leading-relaxed text-[#2a2a2a] break-words">
                {line.replace(/^[•\-\*]\s*/, '')}
              </li>
            ))}
          </ul>
        );
      }
    }

    // Plain text preserving whitespace and linebreaks
    return (
      <div className="sj-rich-text text-[15px] leading-relaxed text-[#2a2a2a] whitespace-pre-line break-words max-w-full">
        {trimmed}
      </div>
    );
  }

  return null;
};

export default function SjJobDetailsDrawer({
  job,
  isOpen = false,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  isApplied = false,
  isSaved = false,
  onApply,
  onToggleSave,
  variant = 'fullscreen', // 'fullscreen' (default for homepage) or 'sidebar' (for My Jobs)
  backLabel,
}) {
  const panelRef = useRef(null);
  const [headerHeight, setHeaderHeight] = React.useState(73);
  const isSidebar = variant === 'sidebar';

  // Dynamically measure navbar height so the fullscreen view starts seamlessly right underneath the navbar
  useEffect(() => {
    if (isSidebar) return;
    const updateHeaderHeight = () => {
      const header = document.querySelector('.sj-header') || document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [isOpen, isSidebar]);

  // Keyboard navigation & scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp' && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
        if (panelRef.current) panelRef.current.scrollTop = 0;
      } else if (e.key === 'ArrowDown' && hasNext && onNext) {
        e.preventDefault();
        onNext();
        if (panelRef.current) panelRef.current.scrollTop = 0;
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext]);

  if (!isOpen || !job) return null;

  const id = job._id || job.id;
  const companyName = job.company || job.employerId?.companyName || 'Company';
  const logoUrl = job.companyLogo || job.employerId?.companyLogo || '';
  const title = job.title || job.t || 'Job Title';
  const location = job.location || job.employerId?.location || job.details?.workLocation || 'Remote';
  const openings = job.openings || job.details?.openings || job.n || 1;
  const employmentType = job.employmentType || job.details?.employmentType || job.type || 'Full-time';
  const workplaceMode = job.workplaceMode || job.details?.workplaceMode || job.wp || 'On-site';

  const formatSalary = (val) => {
    if (!val) return 'As per industry standards';
    return String(val)
      .replace(/lacs\s*pa/gi, 'PA')
      .replace(/lac\s*pa/gi, 'PA')
      .replace(/lpa/gi, 'PA')
      .replace(/per\s*month/gi, 'PM')
      .replace(/per\s*hour/gi, 'PH')
      .trim();
  };

  const salaryDisplay = formatSalary(job.salary || job.pay || job.details?.salary);
  const salaryNote = job.salaryNote || job.payNote || job.details?.salaryNote || '';

  const skills = Array.isArray(job.skills)
    ? job.skills
    : job.details?.skillsRequired
    ? job.details.skillsRequired.split(',').map((s) => s.trim())
    : [];

  const rawResponsibilities =
    job.details?.responsibilities ||
    job.responsibilities ||
    job.resp ||
    null;

  const rawAboutRole =
    job.details?.aboutRole ||
    job.aboutRole ||
    job.about ||
    job.details?.description ||
    job.description ||
    null;

  // Company Details for the bottom frame
  const employer = job.employerId || {};
  const compName = employer.companyName || job.company || employer.fullName || companyName;
  const isConsultant = employer.isConsultant === true;
  const hiringType = isConsultant ? 'Consultant' : (employer.hiringType || 'Company / Business');
  const compSizeRaw = employer.employees || employer.companySize || job.details?.companySize || '';
  const compSize = compSizeRaw
    ? (compSizeRaw.toLowerCase().includes('employee') ? compSizeRaw : `${compSizeRaw} employees`)
    : '';
  const compIndustry = employer.industry || job.details?.jobCategory || job.jobCategory || '';
  const compLocation = employer.location || job.location || job.details?.workLocation || 'India';
  const compWebsite = employer.website || '';
  const compAbout = employer.aboutCompany || employer.companyDescription || '';

  // Recruiter / Person who actually posted the job (matches Image 2 ref)
  const posterName =
    employer.fullName ||
    employer.name ||
    job.contactPerson ||
    employer.contactPerson ||
    'Recruiter';
  const posterDesignation = employer.designation || 'Recruiter';
  const posterRole = compName ? `${posterDesignation} at ${compName}` : posterDesignation;
  const posterLogo = employer.photo || employer.avatar || employer.profilePicture || '';

  // Real job analytics from database (no mock/fake data)
  const realViews = typeof job.views === 'number' ? job.views : (Array.isArray(job.viewedBy) ? job.viewedBy.length : 0);
  const realApplications = typeof job.applications === 'number' ? job.applications : (Array.isArray(job.appliedCandidates) ? job.appliedCandidates.length : 0);
  const realActions = typeof job.recruiterActions === 'number' ? job.recruiterActions : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sj-drawer-backdrop ${isSidebar ? 'sj-drawer-sidebar' : ''} ${isOpen ? 'sj-open' : ''}`}
        style={!isSidebar ? { top: `${headerHeight}px` } : undefined}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer / Full-Screen Job Details View */}
      <aside
        ref={panelRef}
        className={`sj-drawer-panel ${isSidebar ? 'sj-drawer-sidebar' : ''} ${isOpen ? 'sj-open' : ''}`}
        style={!isSidebar ? {
          top: `${headerHeight}px`,
          height: `calc(100vh - ${headerHeight}px)`,
        } : undefined}
        aria-label="Job details"
        aria-hidden={!isOpen}
        role="dialog"
      >
        {/* Sticky Toolbar */}
        <div className="sj-drawer-topbar">
          <div className="sj-drawer-topbar-inner">
            <button
              type="button"
              className="sj-drawer-back-btn"
              onClick={onClose}
              aria-label={backLabel || (isSidebar ? 'Jobs' : 'Home')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>{backLabel || (isSidebar ? 'Jobs' : 'Home')}</span>
            </button>

            <span className="sj-pagination-info">Job Details</span>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                className="sj-drawer-icon-btn"
                onClick={onPrevious}
                disabled={!hasPrevious}
                aria-label="Previous job"
                title="Previous job (↑)"
              >
                &uarr;
              </button>

              <button
                type="button"
                className="sj-drawer-icon-btn"
                onClick={onNext}
                disabled={!hasNext}
                aria-label="Next job"
                title="Next job (↓)"
              >
                &darr;
              </button>

              <button
                type="button"
                className="sj-drawer-icon-btn sj-drawer-close-btn"
                onClick={onClose}
                aria-label="Close details"
                title="Close (Esc)"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="sj-drawer-body">
          <SjJobDetailsContent
            job={job}
            showActions={true}
            isApplied={isApplied}
            isSaved={isSaved}
            onApply={onApply}
            onToggleSave={onToggleSave}
          />
        </div>
      </aside>
    </>
  );
}

