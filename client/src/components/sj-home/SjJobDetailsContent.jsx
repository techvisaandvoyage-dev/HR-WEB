import React from 'react';
import DOMPurify from 'dompurify';
import './drawerAndSupport.css';
import SjAvatar from './primitives/SjAvatar';
import SjPill from './primitives/SjPill';

const sanitizeHtml = (html) => {
  if (!html) return '';
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

    return (
      <div className="sj-rich-text text-[15px] leading-relaxed text-[#2a2a2a] whitespace-pre-line break-words max-w-full">
        {trimmed}
      </div>
    );
  }

  return null;
};

export default function SjJobDetailsContent({
  job,
  showActions = false,
  isApplied = false,
  isSaved = false,
  onApply,
  onToggleSave,
  className = '',
}) {
  if (!job) return null;

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
    job.recruiterName ||
    job.details?.recruiterName ||
    '';
  const posterDesignation =
    employer.designation ||
    employer.title ||
    employer.role ||
    job.recruiterDesignation ||
    job.details?.recruiterDesignation ||
    '';
  const posterRole = compName
    ? (posterDesignation ? `${posterDesignation} at ${compName}` : compName)
    : (posterDesignation || 'Recruiter');
  const posterLogo = employer.photo || employer.avatar || employer.profilePicture || '';

  // Real job analytics from database (no mock/fake data)
  const realViews = typeof job.views === 'number' ? job.views : (Array.isArray(job.viewedBy) ? job.viewedBy.length : 0);
  const realApplications = typeof job.applications === 'number' ? job.applications : (Array.isArray(job.appliedCandidates) ? job.appliedCandidates.length : 0);
  const realActions = typeof job.recruiterActions === 'number' ? job.recruiterActions : 0;

  return (
    <div className={`sj-job-details-content ${className}`}>
      {/* 1. Job Title First */}
      <h2 className="sj-drawer-title">{title}</h2>

      {/* 2. Company Name with Logo & Blue Tick */}
      <div className="sj-drawer-company">
        <SjAvatar
          src={logoUrl}
          name={companyName}
          size="lg"
          alt={companyName}
        />
        <div className="sj-drawer-company-meta">
          <div className="sj-drawer-company-name-row">
            <span className="sj-drawer-company-name">{companyName}</span>
            <svg
              className="sj-verified-tick shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Verified company"
              title="Verified Employer"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.548 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.548 4.49 4.49 0 01-3.498-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              />
            </svg>
          </div>
          {location && (
            <span className="sj-drawer-company-sub">{location}</span>
          )}
        </div>
      </div>

      {/* 3. Tag Pills */}
      <div className="sj-drawer-tags">
        <SjPill variant="default">{employmentType}</SjPill>
        <SjPill variant="default">{workplaceMode} &bull; {location}</SjPill>
        <SjPill variant="accent">{openings} Opening{openings > 1 ? 's' : ''}</SjPill>
        <SjPill variant="default" className="font-bold border-[var(--sj-ink)]">
          {salaryDisplay}
        </SjPill>
        {salaryNote && (
          <span className="text-xs text-[var(--sj-mute)]">({salaryNote})</span>
        )}
      </div>

      {/* Optional Action Buttons */}
      {showActions && (
        <div className="sj-drawer-actions">
          {isApplied ? (
            <button type="button" className="sj-drawer-btn-applied" disabled>
              ✓ Already applied
            </button>
          ) : (
            <button
              type="button"
              className="sj-drawer-btn-apply"
              onClick={() => onApply && onApply(id)}
            >
              Apply now
            </button>
          )}

          <button
            type="button"
            className={`sj-drawer-btn-save ${isSaved ? 'sj-saved' : ''}`}
            onClick={() => onToggleSave && onToggleSave(id)}
          >
            {isSaved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      )}

      {/* Recruiter / Posted by (Shows real person who posted) */}
      {!employer.hidePostedByCard && !job.hidePostedByCard && (
        <div className="sj-drawer-section">
          <h3>Posted by</h3>
          <div className="sj-recruiter-card">
            <div className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-gray-700 shadow-sm shrink-0 overflow-hidden text-sm">
              {posterLogo ? (
                <img src={posterLogo} alt={posterName} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(posterName)}</span>
              )}
            </div>
            <div>
              <b className="text-base font-bold text-[var(--sj-ink)]">{posterName}</b>
              <div className="text-sm text-[var(--sj-mute)] font-medium">{posterRole}</div>
              <div className="flex gap-2 items-center text-xs text-[var(--sj-mute)] mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${isConsultant ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {isConsultant ? 'Consultant' : (employer.industry || 'Company / Business')}
                </span>
                {compSize && (
                  <>
                    <span>&bull;</span>
                    <span>{compSize}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {!employer.hideJobAnalytics && !job.hideJobAnalytics && (
            <div className="sj-stats-grid">
              <div>
                <b>{realViews}</b>
                <small>Job views</small>
              </div>
              <div>
                <b>{realApplications}</b>
                <small>Applications</small>
              </div>
              <div>
                <b>{realActions}</b>
                <small>Recruiter actions</small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skills Required */}
      {skills.length > 0 && (
        <div className="sj-drawer-section">
          <h3>Required Skills</h3>
          <div className="sj-skills-wrap">
            {skills.map((skill, idx) => (
              <span key={idx}>{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Overview Key-Value Details */}
      <div className="sj-drawer-section">
        <h3>Job Details</h3>
        <dl className="sj-kv-table">
          <dt>Employment Type</dt>
          <dd>{employmentType}</dd>
          <dt>Workplace Mode</dt>
          <dd>{workplaceMode}</dd>
          <dt>Location</dt>
          <dd>{location}</dd>
          <dt>Openings</dt>
          <dd>{openings}</dd>
          {job.details?.experience && (
            <>
              <dt>Experience</dt>
              <dd>{job.details.experience}</dd>
            </>
          )}
          {job.details?.qualification && (
            <>
              <dt>Qualification</dt>
              <dd>{job.details.qualification}</dd>
            </>
          )}
        </dl>
      </div>

      {/* About Role */}
      {rawAboutRole && (
        <div className="sj-drawer-section">
          <h3>About Role</h3>
          {renderFormattedContent(rawAboutRole)}
        </div>
      )}

      {/* Key Responsibilities */}
      {rawResponsibilities && (
        <div className="sj-drawer-section">
          <h3>Key Responsibilities</h3>
          {renderFormattedContent(rawResponsibilities, true)}
        </div>
      )}

      {/* Dedicated Company Details (matching theme) */}
      <div className="sj-company-card">
        <div className="sj-company-head">
          <div className="sj-company-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01" />
              <path d="M16 6h.01" />
              <path d="M12 6h.01" />
              <path d="M12 10h.01" />
              <path d="M12 14h.01" />
              <path d="M16 10h.01" />
              <path d="M16 14h.01" />
              <path d="M8 10h.01" />
              <path d="M8 14h.01" />
            </svg>
          </div>
          <h3 className="sj-company-title">Company Details</h3>
        </div>

        <div className="sj-company-grid">
          <div className="sj-company-row">
            <span className="sj-company-label">Company Name:</span>
            <span className="sj-company-value font-semibold">{compName}</span>
          </div>

          {posterName && (
            <div className="sj-company-row">
              <span className="sj-company-label">Posted By:</span>
              <span className="sj-company-value font-semibold text-[var(--sj-ink)]">
                {posterName}
                {posterDesignation && (
                  <span className="text-[var(--sj-mute)] font-medium ml-1">({posterDesignation})</span>
                )}
              </span>
            </div>
          )}

          <div className="sj-company-row">
            <span className="sj-company-label">Hiring Type:</span>
            {isConsultant ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Consultant
              </span>
            ) : (
              <span className="sj-company-value">{hiringType}</span>
            )}
          </div>

          {compSize && (
            <div className="sj-company-row">
              <span className="sj-company-label">Company Size:</span>
              <span className="sj-company-value">{compSize}</span>
            </div>
          )}

          {compIndustry && (
            <div className="sj-company-row">
              <span className="sj-company-label">Industry:</span>
              <span className="sj-company-value">{compIndustry}</span>
            </div>
          )}

          {compLocation && (
            <div className="sj-company-row">
              <span className="sj-company-label">Location:</span>
              <span className="sj-company-value">{compLocation}</span>
            </div>
          )}

          {compWebsite && (
            <div className="sj-company-row">
              <span className="sj-company-label">Website:</span>
              <a
                href={compWebsite.startsWith('http') ? compWebsite : `https://${compWebsite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sj-company-link"
              >
                {compWebsite}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {compAbout && (
            <div className="mt-2 pt-3 border-t border-gray-200/70">
              <span className="sj-company-label block mb-1">About Company:</span>
              <p className="text-[14px] text-gray-600 leading-relaxed m-0 whitespace-pre-line">
                {compAbout}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
