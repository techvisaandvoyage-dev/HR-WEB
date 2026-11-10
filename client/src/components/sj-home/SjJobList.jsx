import React from 'react';
import './jobFeed.css';
import SjJobCard from './SjJobCard';

export default function SjJobList({
  jobs = [],
  matchedJobs = [],
  otherJobs = [],
  userRole = '',
  appliedJobIds = new Set(),
  savedJobIds = new Set(),
  loading = false,
  onSelectJob,
  onToggleSave,
}) {
  const isApplied = (id) => {
    if (!id) return false;
    if (appliedJobIds instanceof Set) return appliedJobIds.has(String(id));
    if (Array.isArray(appliedJobIds)) return appliedJobIds.includes(String(id));
    return false;
  };

  const isSaved = (id) => {
    if (!id) return false;
    if (savedJobIds instanceof Set) return savedJobIds.has(String(id));
    if (Array.isArray(savedJobIds)) return savedJobIds.includes(String(id));
    return false;
  };

  if (loading) {
    return (
      <div className="py-12 space-y-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-24 bg-[var(--sj-soft)] rounded-2xl animate-pulse w-full border border-[var(--sj-line)]"
          />
        ))}
      </div>
    );
  }

  const hasMatched = matchedJobs && matchedJobs.length > 0;
  const hasOther = otherJobs && otherJobs.length > 0;
  const totalRendered = (matchedJobs?.length || 0) + (otherJobs?.length || 0);

  if (totalRendered === 0) {
    return (
      <div className="sj-empty-state">
        <h2>Nothing here.</h2>
        <p>Try searching for different keywords or clear a filter.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 1. Matched Jobs Section */}
      {hasMatched && (
        <section aria-label="Matched jobs">
          <div className="sj-list-label sj-matched-label">
            Matched for {userRole || 'Your Profile'}
          </div>
          <div>
            {matchedJobs.map((job) => {
              const id = job._id || job.id;
              return (
                <SjJobCard
                  key={id}
                  job={job}
                  isMatched={true}
                  matchedRole={userRole}
                  isApplied={isApplied(id)}
                  isSaved={isSaved(id)}
                  onSelectJob={onSelectJob}
                  onToggleSave={onToggleSave}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Other Jobs Section */}
      {hasOther && (
        <section aria-label="More opportunities">
          {hasMatched && (
            <div className="sj-list-label">
              More jobs
            </div>
          )}
          <div>
            {otherJobs.map((job) => {
              const id = job._id || job.id;
              return (
                <SjJobCard
                  key={id}
                  job={job}
                  isMatched={false}
                  matchedRole={userRole}
                  isApplied={isApplied(id)}
                  isSaved={isSaved(id)}
                  onSelectJob={onSelectJob}
                  onToggleSave={onToggleSave}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

