import React from 'react';
import './jobFeed.css';

export default function SjJobFilterBar({
  filters = [],
  activeFilters = [],
  onToggleFilter,
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

      <span className="sj-filter-count">
        {showingCount} of {totalCount} jobs
      </span>
    </div>
  );
}

