import React, { useEffect, useRef } from 'react';
import './drawerAndSupport.css';
import SjAvatar from './primitives/SjAvatar';
import SjPill from './primitives/SjPill';
import SjButton from './primitives/SjButton';

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
}) {
  const panelRef = useRef(null);

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

  const responsibilities = Array.isArray(job.resp)
    ? job.resp
    : job.details?.responsibilities
    ? job.details.responsibilities
        .split('\n')
        .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
        .filter(Boolean)
    : [];

  const aboutRole = job.about || job.details?.aboutRole || job.description || '';

  const poster = job.poster || (job.employerId ? {
    name: job.employerId.name || job.employerId.contactPerson || companyName,
    role: job.employerId.designation || `Recruiter at ${companyName}`,
    type: job.employerId.industry || 'Company / Business',
    size: job.employerId.companySize || 'Growing Team',
    active: 'Recently active',
    stats: [job.views || 12, job.applications || 4, 2],
  } : null);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sj-drawer-backdrop ${isOpen ? 'sj-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={panelRef}
        className={`sj-drawer-panel ${isOpen ? 'sj-open' : ''}`}
        aria-label="Job details"
        aria-hidden={!isOpen}
        role="dialog"
      >
        {/* Sticky Toolbar */}
        <div className="sj-drawer-topbar">
          <span className="sj-pagination-info">Job Details</span>

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
            className="sj-drawer-icon-btn"
            onClick={onClose}
            aria-label="Close details"
            title="Close (Esc)"
          >
            &times;
          </button>
        </div>

        {/* Drawer Body */}
        <div className="sj-drawer-body">
          {/* Company branding */}
          <div className="sj-drawer-company">
            <SjAvatar
              src={logoUrl}
              name={companyName}
              size="lg"
              alt={companyName}
            />
            <span>{companyName}</span>
          </div>

          {/* Title */}
          <h2 className="sj-drawer-title">{title}</h2>

          {/* Tag Pills */}
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

          {/* Action Buttons */}
          <div className="sj-drawer-actions">
            {isApplied ? (
              <SjButton variant="applied" disabled>
                &check; Already applied
              </SjButton>
            ) : (
              <SjButton
                variant="primary"
                onClick={() => onApply && onApply(id)}
              >
                Apply now
              </SjButton>
            )}

            <SjButton
              variant="outline"
              onClick={() => onToggleSave && onToggleSave(id)}
            >
              {isSaved ? 'Saved \u2713' : 'Save'}
            </SjButton>
          </div>

          {/* Recruiter / Posted by */}
          {poster && (
            <div className="sj-drawer-section">
              <h3>Posted by</h3>
              <div className="sj-recruiter-card">
                <SjAvatar
                  name={poster.name}
                  size="md"
                  isCircle={true}
                  className="bg-[var(--sj-accS)] text-[var(--sj-ink)]"
                />
                <div>
                  <b className="text-base text-[var(--sj-ink)]">{poster.name}</b>
                  <div className="text-sm text-[var(--sj-mute)]">{poster.role}</div>
                  <div className="flex gap-2 items-center text-xs text-[var(--sj-mute)] mt-1">
                    <span className="font-semibold text-[var(--sj-ink)]">{poster.type}</span>
                    <span>&bull;</span>
                    <span>{poster.size}</span>
                  </div>
                </div>
              </div>

              {Array.isArray(poster.stats) && (
                <div className="sj-stats-grid">
                  <div>
                    <b>{poster.stats[0] || 0}</b>
                    <small>Job views</small>
                  </div>
                  <div>
                    <b>{poster.stats[1] || 0}</b>
                    <small>Applications</small>
                  </div>
                  <div>
                    <b>{poster.stats[2] || 0}</b>
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
          {aboutRole && (
            <div className="sj-drawer-section">
              <h3>About Role</h3>
              <p className="text-[15px] leading-relaxed text-[#2a2a2a] whitespace-pre-line m-0">
                {aboutRole}
              </p>
            </div>
          )}

          {/* Key Responsibilities */}
          {responsibilities.length > 0 && (
            <div className="sj-drawer-section">
              <h3>Key Responsibilities</h3>
              <ol className="sj-resp-list">
                {responsibilities.map((resp, idx) => (
                  <li key={idx}>
                    <span>{resp}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

