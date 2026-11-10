import React, { useState, useEffect } from 'react';
import './headers.css';
import SjProfileDropdown from './SjProfileDropdown';

export default function SjLoggedInHeader({
  searchLabel = 'Search jobs here',
  onOpenSearch,
  userProfile = null,
  hasUnreadMessages = false,
  savedCount = 0,
  onNavigateSaved,
  onNavigateMessages,
  onNavigateProfile,
  onNavigateSecurity,
  onSignOut,
  onLogoClick,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Keyboard shortcut listener: press '/' to open search modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      const isInputFocused = /INPUT|TEXTAREA|SELECT/.test(activeTag) || (document.activeElement && document.activeElement.isContentEditable);
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        if (onOpenSearch) onOpenSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const userEmail = userProfile?.email || localStorage.getItem('employeeUser') || '';
  const userName = userProfile?.name || [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || 'User';
  const initial = (userName.charAt(0) || 'U').toUpperCase();

  return (
    <header className="sj-header" id="mh">
      <div className="sj-nav-inner">
        {/* Brand Logo */}
        <a
          href="/"
          className="sj-logo"
          onClick={(e) => {
            if (onLogoClick) {
              e.preventDefault();
              onLogoClick();
            }
          }}
          aria-label="SahiJob Home"
        >
          Sahi<b>Job</b>.com
        </a>

        {/* Center Search Pill */}
        <button
          type="button"
          className="sj-search-pill"
          onClick={onOpenSearch}
          aria-haspopup="dialog"
          aria-label="Search jobs"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sj-sp-text">{searchLabel || 'Search jobs here'}</span>
          <kbd aria-label="Press forward slash to search">/</kbd>
        </button>

        {/* Action Buttons */}
        <div className="sj-actions-cluster">
          {/* Saved Jobs Icon */}
          <button
            type="button"
            className="sj-icon-btn sj-hide-mobile"
            onClick={onNavigateSaved}
            aria-label={`Saved jobs ${savedCount > 0 ? `(${savedCount})` : ''}`}
            title="Saved Jobs"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 3h12v18l-6-4-6 4Z" />
            </svg>
          </button>

          {/* Messages Icon */}
          <button
            type="button"
            className="sj-icon-btn"
            onClick={onNavigateMessages}
            aria-label="Messages"
            title="Messages"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16v12H8l-4 4Z" />
            </svg>
            {hasUnreadMessages && <span className="sj-ping-dot" />}
          </button>

          {/* Profile Menu Trigger */}
          <button
            type="button"
            className="sj-icon-btn"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
            aria-label="Profile Account Menu"
            title="Account"
          >
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover border border-[var(--sj-line)]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--sj-ink)] text-white text-xs font-bold flex items-center justify-center">
                {initial}
              </div>
            )}
          </button>

          {/* Profile Dropdown Component */}
          <SjProfileDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            email={userEmail}
            onNavigateProfile={onNavigateProfile}
            onNavigateSecurity={onNavigateSecurity}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </header>
  );
}

