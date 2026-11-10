import React from 'react';
import './jobFeed.css';
import SjAvatar from './primitives/SjAvatar';
import SjPill from './primitives/SjPill';

export default function SjJobCard({
  job,
  isMatched = false,
  matchedRole = '',
  isApplied = false,
  isSaved = false,
  onSelectJob,
  onToggleSave,
}) {
  if (!job) return null;

  const companyName = job.company || job.employerId?.companyName || 'Company';
  const logoUrl = job.companyLogo || job.employerId?.companyLogo || '';
  const location = job.location || job.employerId?.location || job.details?.workLocation || 'Remote';
  const openings = job.openings || job.details?.openings || job.n || 1;
  const title = job.title || job.t || 'Job Title';

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

  const handleRowClick = () => {
    if (onSelectJob) onSelectJob(job);
  };

  const handleRowKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick();
    }
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onToggleSave) onToggleSave(job._id || job.id, e);
  };

  return (
    <div
      className={`sj-job-row ${isMatched ? 'mt' : ''}`}
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      aria-label={`${title} at ${companyName}`}
    >
      {/* 1. Company Avatar */}
      <SjAvatar
        src={logoUrl}
        name={companyName}
        size="md"
        alt={`${companyName} Logo`}
      />

      {/* 2. Job Info */}
      <div className="min-w-0">
        <h2 className="sj-job-title truncate">{title}</h2>
        <div className="sj-job-sub">
          <span className="sj-company-name">
            {companyName}
            <svg
              className="sj-verified-check"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Verified"
            >
              <path d="M12 2l2.4 2 3.1-.3.9 3 2.7 1.6-1 3 1 3-2.7 1.6-.9 3-3.1-.3L12 22l-2.4-2-3.1.3-.9-3L2.9 15.7l1-3-1-3 2.7-1.6.9-3 3.1.3Zm-1 13 5-5-1.4-1.4L11 12.2 9.4 10.6 8 12Z" />
            </svg>
          </span>

          <span className="truncate">{location}</span>

          <SjPill variant="default">Easily apply</SjPill>

          {isMatched && matchedRole && (
            <SjPill variant="accent">
              ◎ Matched for {matchedRole}
            </SjPill>
          )}
        </div>
      </div>

      {/* 3. Salary & Status */}
      <div className="sj-job-right">
        <div className="sj-job-pay">{salaryDisplay}</div>
        <div className="sj-job-stat">
          {openings} Opening{openings > 1 ? 's' : ''}
        </div>
        {isApplied && (
          <div className="sj-job-stat sj-applied">
            ✓ Already applied
          </div>
        )}
      </div>

      {/* 4. Bookmark Action */}
      <button
        type="button"
        className={`sj-bookmark-btn ${isSaved ? 'sj-bookmarked' : ''}`}
        onClick={handleSaveClick}
        aria-label={isSaved ? 'Remove from saved' : 'Save job'}
        title={isSaved ? 'Saved' : 'Save job'}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h12v18l-6-4-6 4Z" />
        </svg>
      </button>
    </div>
  );
}

