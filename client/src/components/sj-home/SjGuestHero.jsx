import React, { useState, useRef, useEffect, useMemo } from 'react';
import LocationAutocomplete from '../common/LocationAutocomplete';
import './guestAndFooter.css';

/**
 * Modern Guest Hero Section matching SahiJob mockup.
 * Fully integrated with Admin CMS (heroConfig and searchBarConfig)
 * and equipped with instant City suggestions & Job Title suggestions.
 */
export default function SjGuestHero({
  heroConfig,
  searchBarConfig,
  query = '',
  location = '',
  jobs = [],
  onQueryChange,
  onLocationChange,
  onSearch,
}) {
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const jobSuggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (jobSuggestionsRef.current && !jobSuggestionsRef.current.contains(e.target)) {
        setShowJobSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowJobSuggestions(false);
    if (onSearch) onSearch({ query, location });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowJobSuggestions(false);
      if (onSearch) onSearch({ query, location });
    }
  };

  const titlePrefix = heroConfig?.titlePrefix || 'Find Your';
  const titleHighlight = heroConfig?.titleHighlight || 'Dream Job';
  const subtitle =
    heroConfig?.subtitle ||
    'Discover opportunities that align with your passion and expertise.';

  const jobPlaceholder =
    searchBarConfig?.jobPlaceholder || 'Job title, keyword, or company…';
  const locationPlaceholder =
    searchBarConfig?.locationPlaceholder || 'City, state, or country…';
  const buttonText = searchBarConfig?.buttonText || 'Search Jobs';
  const showArrow = searchBarConfig?.showArrow !== false;

  // Filter dynamic job suggestions from available jobs
  const matchedJobSuggestions = useMemo(() => {
    if (!query || !query.trim() || !Array.isArray(jobs)) return [];
    const q = query.trim().toLowerCase();
    const matches = [];
    const seen = new Set();
    for (const j of jobs) {
      const title = j.title || '';
      const comp = j.company || j.employerId?.companyName || '';
      if (title.toLowerCase().includes(q) || comp.toLowerCase().includes(q)) {
        if (!seen.has(title.toLowerCase())) {
          seen.add(title.toLowerCase());
          matches.push(j);
        }
      }
      if (matches.length >= 6) break;
    }
    return matches;
  }, [jobs, query]);

  return (
    <section className="sj-hero">
      <h1>
        {titlePrefix} <em>{titleHighlight}</em>
      </h1>
      <p>{subtitle}</p>

      <form className="sj-sbar" onSubmit={handleSubmit} role="search">
        {/* Job Title Field with Suggestions Dropdown */}
        <div className="sj-sf" ref={jobSuggestionsRef}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="sj-guest-query"
            type="text"
            placeholder={jobPlaceholder}
            value={query}
            onChange={(e) => {
              if (onQueryChange) onQueryChange(e.target.value);
              setShowJobSuggestions(true);
            }}
            onFocus={() => setShowJobSuggestions(true)}
            onKeyDown={handleKeyDown}
            aria-label="Job title or keyword"
            autoComplete="off"
          />

          {showJobSuggestions && query.trim() && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[280px] sm:min-w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-[250] max-h-64 overflow-y-auto text-left animate-in fade-in duration-150">
              {matchedJobSuggestions.length > 0 ? (
                matchedJobSuggestions.map((j) => (
                  <div
                    key={j.id || j._id}
                    onClick={() => {
                      if (onQueryChange) onQueryChange(j.title);
                      setShowJobSuggestions(false);
                    }}
                    className="px-4 py-2.5 hover:bg-emerald-50/70 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {j.companyLogo || j.employerId?.companyLogo ? (
                        <img
                          src={j.companyLogo || j.employerId?.companyLogo}
                          alt={j.company}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (j.company || j.title || 'J').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-gray-900 truncate">{j.title}</div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {j.company || j.employerId?.companyName || ''}{' '}
                        {j.location ? `• ${j.location}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-500 text-center">
                  Press Enter to search for "{query}"
                </div>
              )}
            </div>
          )}
        </div>

        <span className="sj-dvl" aria-hidden="true" />

        {/* Location Field with City Suggestions Dropdown */}
        <div className="sj-sf">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <LocationAutocomplete
            id="sj-guest-location"
            value={location}
            onChange={(val) => onLocationChange && onLocationChange(val)}
            onSelect={(val) => {
              if (onLocationChange) onLocationChange(val);
            }}
            onKeyDown={handleKeyDown}
            placeholder={locationPlaceholder}
            className="w-full bg-transparent border-none outline-none text-[15px] text-[var(--sj-ink)] placeholder-[#9aa0a6] font-medium"
          />
        </div>

        <button type="submit" className="sj-sbar-btn" aria-label="Search jobs">
          <span>{buttonText}</span>
          {showArrow && (
            <svg
              width="18"
              height="18"
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
          )}
        </button>
      </form>
    </section>
  );
}
