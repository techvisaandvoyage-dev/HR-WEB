import React from 'react';
import './guestAndFooter.css';

/**
 * Format salary from various job schema structures into a clean string.
 */
function formatSalary(job) {
  if (job?.salary) return job.salary;
  if (job?.pay) return job.pay;
  const min = job?.minSalary || job?.salaryMin;
  const max = job?.maxSalary || job?.salaryMax;
  if (min && max) {
    const fmtMin = min >= 100000 ? `₹${(min / 100000).toFixed(1).replace('.0', '')}L` : `₹${Math.round(min / 1000)}K`;
    const fmtMax = max >= 100000 ? `₹${(max / 100000).toFixed(1).replace('.0', '')}L` : `₹${Math.round(max / 1000)}K`;
    return `${fmtMin} - ${fmtMax} / yr`;
  }
  if (min) {
    const fmtMin = min >= 100000 ? `₹${(min / 100000).toFixed(1).replace('.0', '')}L` : `₹${Math.round(min / 1000)}K`;
    return `${fmtMin}+ / yr`;
  }
  return 'Competitive';
}

/**
 * Extract clean company name
 */
function getCompanyName(job) {
  return (
    job?.company ||
    job?.companyName ||
    job?.employerId?.companyName ||
    job?.employerId?.name ||
    'Leading Employer'
  );
}

/**
 * Extract industry or category
 */
function getJobIndustry(job) {
  return (
    job?.details?.industry ||
    job?.industry ||
    job?.jobCategory ||
    job?.details?.jobCategory ||
    'Professional Services'
  );
}

/**
 * Extract clean location
 */
function getJobLocation(job) {
  const loc = job?.location || job?.details?.workLocation || job?.workLocation || 'Pan India';
  return loc.split(' • ')[0].trim();
}

/**
 * Modern Guest Opportunity Grid
 */
export default function SjGuestGrid({
  jobs = [],
  onJobClick,
  onApplyClick,
  onBookmarkClick,
}) {
  return (
    <section className="sj-gw" id="sj-opportunities">
      <div className="sj-gw-head">
        <h2 className="sj-lo">
          Latest Opportunities
          <span className="sj-sparkle-box" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
            </svg>
          </span>
        </h2>
        <p className="sj-gw-sub">
          Showing {jobs.length} job{jobs.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="sj-gg">
        {jobs.length > 0 ? (
          jobs.map((job, idx) => {
            const company = getCompanyName(job);
            const initial = company.charAt(0).toUpperCase();
            const title = job.title || job.t || 'Opportunity';
            const location = getJobLocation(job);
            const industry = getJobIndustry(job);
            const salary = formatSalary(job);
            const jobType = job.jobType || job.type || 'Full-time';
            const jobId = job._id || job.id || idx;

            return (
              <article
                key={jobId}
                className="sj-gc2"
                onClick={() => onJobClick && onJobClick(job)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onJobClick && onJobClick(job);
                  }
                }}
                aria-label={`${title} at ${company}`}
              >
                <div className="sj-gc2-ch">
                  <div className="sj-gc2-lt" aria-hidden="true">
                    {initial}
                  </div>
                  <div className="sj-gc2-info">
                    <span className="sj-gc2-company">{company}</span>
                    <div className="sj-gc2-industry">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect x="5" y="3" width="14" height="18" rx="1.5" />
                        <path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4" />
                      </svg>
                      <span>{industry}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sj-gc2-save"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onBookmarkClick) onBookmarkClick(job);
                    }}
                    aria-label={`Bookmark ${title}`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </div>

                <h3 className="sj-gt">{title}</h3>

                <div className="sj-gc2-tags">
                  <span className="sj-chp">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {location}
                  </span>
                  <span className="sj-chp">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    {jobType}
                  </span>
                </div>

                <div className="sj-sal">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="6" width="18" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                  <div>
                    <small>SALARY</small>
                    <b>{salary}</b>
                  </div>
                  <span
                    className="sj-ap"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onApplyClick) onApplyClick(job);
                      else if (onJobClick) onJobClick(job);
                    }}
                  >
                    Apply Now
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </article>
            );
          })
        ) : (
          <div className="sj-empty-guest">
            <h3>No jobs found</h3>
            <p>Try searching with different keywords or location.</p>
          </div>
        )}
      </div>
    </section>
  );
}

