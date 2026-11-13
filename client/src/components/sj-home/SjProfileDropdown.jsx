import React, { useEffect, useRef } from 'react';
import './headers.css';

export default function SjProfileDropdown({
  isOpen,
  onClose,
  email = '',
  name = '',
  onNavigateProfile,
  onNavigateSaved,
  onNavigateApplied,
  onNavigateSecurity,
  onSignOut,
}) {
  const ref = useRef(null);

  // Sanitize email and name in case a raw JSON string or object was passed
  let displayEmail = email;
  let displayName = name || '';

  if (typeof displayEmail === 'string' && displayEmail.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(displayEmail);
      displayEmail = parsed?.email || parsed?.profile?.email || '';
      if (!displayName) {
        displayName = parsed?.name || [parsed?.profile?.firstName, parsed?.profile?.lastName].filter(Boolean).join(' ') || '';
      }
    } catch (_) {
      displayEmail = '';
    }
  } else if (typeof displayEmail === 'object' && displayEmail !== null) {
    const obj = displayEmail;
    displayEmail = obj?.email || obj?.profile?.email || '';
    if (!displayName) {
      displayName = obj?.name || [obj?.profile?.firstName, obj?.profile?.lastName].filter(Boolean).join(' ') || '';
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="sj-dropdown-menu" role="menu" aria-label="User Account Menu">
      {(displayName || displayEmail) && (
        <div className="sj-dm-header-info">
          {displayName && <div className="sj-dm-user-name">{displayName}</div>}
          {displayEmail && <div className="sj-dm-email" title={displayEmail}>{displayEmail}</div>}
        </div>
      )}

      <button
        type="button"
        className="sj-dm-item"
        onClick={() => {
          onClose();
          if (onNavigateProfile) onNavigateProfile();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
      </button>

      <button
        type="button"
        className="sj-dm-item"
        onClick={() => {
          onClose();
          if (onNavigateSaved) onNavigateSaved();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span>Saved Jobs</span>
      </button>

      <button
        type="button"
        className="sj-dm-item"
        onClick={() => {
          onClose();
          if (onNavigateApplied) onNavigateApplied();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span>Applied Jobs</span>
      </button>

      <button
        type="button"
        className="sj-dm-item"
        onClick={() => {
          onClose();
          if (onNavigateSecurity) onNavigateSecurity();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Security &amp; Password</span>
      </button>

      <button
        type="button"
        className="sj-dm-item sj-dm-signout"
        onClick={() => {
          onClose();
          if (onSignOut) onSignOut();
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Sign out</span>
      </button>
    </div>
  );
}

