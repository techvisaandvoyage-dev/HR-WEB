import React from 'react';
import './jobFeed.css';

export default function SjJobFilterBar({
  filters = [],
  activeFilters = [],
  onToggleFilter,
  onClearFilters,
  showingCount = 0,
  totalCount = 0,
}) {
  const isFilterActive = (filter) => {
    if (activeFilters instanceof Set) {
      return activeFilters.has(filter);
    }
    if (Array.isArray(activeFilters)) {
      return activeFilters.includes(filter);
    }
    return false;
  };

  const hasActive = (activeFilters instanceof Set ? activeFilters.size : activeFilters.length) > 0;

  return (
    <div className="sj-filter-bar">
      {filters.map((filter) => {
        const active = isFilterActive(filter);
        return (
          <button
            key={filter}
            type="button"
            className="sj-filter-btn"
            aria-pressed={active}
            onClick={() => onToggleFilter(filter)}
          >
            {filter}
          </button>
        );
      })}

      {hasActive && (
        <button
          type="button"
          className="sj-filter-btn"
          onClick={onClearFilters}
          style={{ color: '#e11d48', fontWeight: 700 }}
        >
          Clear filters ✕
        </button>
      )}

      <span className="sj-filter-count">
        {showingCount} of {totalCount} jobs
      </span>
    </div>
  );
}

