import React from 'react';
import './guestAndFooter.css';

/**
 * Modern Guest Hero Section matching SahiJob mockup.
 * Includes glowing radial backdrop, headline with highlight underline,
 * and pill-shaped unified search bar.
 */
export default function SjGuestHero({
  query = '',
  location = '',
  onQueryChange,
  onLocationChange,
  onSearch,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch({ query, location });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSearch) onSearch({ query, location });
    }
  };

  return (
    <section className="sj-hero">
      <h1>
        Find Your <em>Dream</em> Job
      </h1>
      <p>
        Discover opportunities that align with your passion and expertise.
      </p>

      <form className="sj-sbar" onSubmit={handleSubmit} role="search">
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
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="sj-guest-query"
            type="text"
            placeholder="Job title, keyword, or company…"
            value={query}
            onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Job title or keyword"
            autoComplete="off"
          />
        </div>

        <span className="sj-dvl" aria-hidden="true" />

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
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <input
            id="sj-guest-location"
            type="text"
            placeholder="City, state, or country…"
            value={location}
            onChange={(e) => onLocationChange && onLocationChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Location"
            autoComplete="off"
          />
        </div>

        <button type="submit" className="sj-sbar-btn" aria-label="Search jobs">
          <span>Search Jobs</span>
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
        </button>
      </form>
    </section>
  );
}

