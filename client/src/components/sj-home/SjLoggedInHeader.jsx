import React, { useState, useEffect, useRef, useMemo } from 'react';
import './headers.css';
import SjProfileDropdown from './SjProfileDropdown';
import LocationAutocomplete from '../common/LocationAutocomplete';
import BrandLogo from '../common/BrandLogo';

const EXPERIENCE_OPTIONS = [
  { label: 'Any Experience', value: 'All' },
  { label: '0 - 1 Yrs', value: '0 - 1 Yrs' },
  { label: '1 - 2 Yrs', value: '1 - 2 Yrs' },
  { label: '2 - 3 Yrs', value: '2 - 3 Yrs' },
  { label: '3 - 5 Yrs', value: '3 - 5 Yrs' },
  { label: '4 - 6 Yrs', value: '4 - 6 Yrs' },
  { label: '5 - 8 Yrs', value: '5 - 8 Yrs' },
  { label: '7 - 10 Yrs', value: '7 - 10 Yrs' },
  { label: '11 - 15 Yrs', value: '11 - 15 Yrs' },
  { label: '16 - 20 Yrs', value: '16 - 20 Yrs' },
  { label: '21 - 25 Yrs', value: '21 - 25 Yrs' },
  { label: '25+ yrs', value: '25+ yrs' },
];

const POSTING_DATE_OPTIONS = [
  { label: 'Any time', value: 'Any time' },
  { label: 'Past 24 hours', value: 'Past 24 hours' },
  { label: 'Past 3 days', value: 'Past 3 days' },
  { label: 'Past week', value: 'Past week' },
  { label: 'Past month', value: 'Past month' },
];

function TopbarDropdown({
  placeholder,
  headerTitle,
  value,
  onChange,
  options,
  icon,
  isOpen,
  onToggle,
  onClose,
}) {
  const displayLabel = value === 'All' || value === 'Any time' ? placeholder : value;

  return (
    <div className="relative font-sans h-full flex items-center border-r border-gray-300 shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="px-3.5 py-1.5 h-full flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 bg-transparent cursor-pointer font-medium"
      >
        <span className="truncate max-w-[125px] text-left">{displayLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="sj-search-dropdown-menu">
          <div className="sj-search-dropdown-header">
            {headerTitle || placeholder} ({options.length})
          </div>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange?.(opt.value);
                  onClose();
                }}
                className={`sj-search-dropdown-item ${isSelected ? 'is-selected' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="sj-search-dropdown-icon">
                    {icon || (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SjLoggedInHeader({
  logoConfig,
  searchLabel = 'Search jobs here',
  onOpenSearch,
  searchTerm = '',
  onSearchTermChange,
  searchLocation = '',
  onSearchLocationChange,
  experience = 'All',
  onExperienceChange,
  postingDate = 'Any time',
  onPostingDateChange,
  jobs = [],
  userProfile = null,
  hasUnreadMessages = false,
  savedCount = 0,
  onNavigateSaved,
  onNavigateApplied,
  onNavigateMessages,
  onNavigateProfile,
  onNavigateSecurity,
  onSignOut,
  onLogoClick,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'experience' | 'datePosted' | 'suggestions' | null
  const searchRef = useRef(null);

  // Suggestions for job title input
  const matchingJobs = useMemo(() => {
    if (!searchTerm || !searchTerm.trim() || !Array.isArray(jobs) || jobs.length === 0) return [];
    const q = searchTerm.toLowerCase().trim();
    return jobs.filter((j) => {
      const title = (j.title || j.t || '').toLowerCase();
      const comp = (j.company || j.companyName || j.c || '').toLowerCase();
      return title.includes(q) || comp.includes(q);
    }).slice(0, 5);
  }, [searchTerm, jobs]);

  // Click outside to close all search dropdowns
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, []);

  // Keyboard shortcut listener: press '/' to focus or open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      const isInputFocused = /INPUT|TEXTAREA|SELECT/.test(activeTag) || (document.activeElement && document.activeElement.isContentEditable);
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input[type="text"]');
        if (input) {
          input.focus();
        } else if (onOpenSearch) {
          onOpenSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  let parsedEmployeeUser = null;
  try {
    const rawEmp = localStorage.getItem('employeeUser');
    if (rawEmp) parsedEmployeeUser = JSON.parse(rawEmp);
  } catch (e) {
    parsedEmployeeUser = null;
  }

  const userEmail = 
    userProfile?.email || 
    parsedEmployeeUser?.email || 
    parsedEmployeeUser?.profile?.email || 
    parsedEmployeeUser?.user?.email || 
    localStorage.getItem('employeeEmail') || 
    '';

  const userName = 
    userProfile?.fullName ||
    userProfile?.name || 
    [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || 
    parsedEmployeeUser?.name || 
    [parsedEmployeeUser?.profile?.firstName, parsedEmployeeUser?.profile?.lastName].filter(Boolean).join(' ') || 
    parsedEmployeeUser?.profile?.name || 
    (userEmail ? userEmail.split('@')[0] : 'User');

  const avatarUrl = 
    userProfile?.avatar || 
    parsedEmployeeUser?.avatar || 
    parsedEmployeeUser?.profile?.avatar || 
    '';

  const initial = (userName.charAt(0) || 'U').toUpperCase();

  const isImage = logoConfig?.type === 'image' && Boolean(logoConfig.imageUrl);
  const isCustomText =
    logoConfig?.type === 'text' &&
    Boolean(logoConfig.text) &&
    logoConfig.text.trim().toLowerCase() !== 'sahijob';
  const logoText = logoConfig?.text || 'SahiJob';
  const accentText =
    logoConfig?.accentText !== undefined ? logoConfig.accentText : '.com';

  return (
    <header className="sj-header" id="mh">
      <div className="sj-nav-inner">
        {/* Brand Logo (Matching EmployeeNavbar: single line, no wrapping) */}
        <div className="w-48 shrink-0 flex items-center">
          <BrandLogo onClick={onLogoClick} customConfig={logoConfig} />
        </div>

        {/* Multi-Segment Search Bar (Image 1 multi-segment + 3D Hover Only) */}
        <div className="sj-topbar-search" ref={searchRef}>
          <TopbarDropdown
            placeholder="Experience"
            headerTitle="Experience"
            value={experience}
            onChange={onExperienceChange}
            options={EXPERIENCE_OPTIONS}
            isOpen={openDropdown === 'experience'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'experience' ? null : 'experience'))}
            onClose={() => setOpenDropdown(null)}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <TopbarDropdown
            placeholder="Date Posted"
            headerTitle="Date Posted"
            value={postingDate}
            onChange={onPostingDateChange}
            options={POSTING_DATE_OPTIONS}
            isOpen={openDropdown === 'datePosted'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'datePosted' ? null : 'datePosted'))}
            onClose={() => setOpenDropdown(null)}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <div className="flex-1 flex items-center px-3 border-r border-gray-300 relative h-full min-w-0">
            <svg className="w-5 h-5 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Find your perfect job"
              value={searchTerm}
              onChange={(e) => {
                onSearchTermChange?.(e.target.value);
                setOpenDropdown(e.target.value.trim() ? 'suggestions' : null);
              }}
              onFocus={() => {
                if (searchTerm && searchTerm.trim()) {
                  setOpenDropdown('suggestions');
                } else {
                  setOpenDropdown(null);
                }
              }}
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent text-sm text-gray-900 placeholder-gray-500 shadow-none ring-0"
            />
            {openDropdown === 'suggestions' && searchTerm && searchTerm.trim() && (
              <div className="sj-search-dropdown-menu w-[125%] min-w-[300px]">
                <div className="sj-search-dropdown-header">
                  Matching Jobs ({matchingJobs.length})
                </div>
                {matchingJobs.length > 0 ? (
                  matchingJobs.map((job) => (
                    <div
                      key={job.id || job._id}
                      onClick={() => {
                        onSearchTermChange?.(job.title || job.t);
                        setOpenDropdown(null);
                      }}
                      className="sj-search-dropdown-item"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="sj-search-dropdown-icon text-xs font-bold">
                          {job.companyInitial || job.company?.charAt(0)?.toUpperCase() || 'J'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-bold text-gray-900 truncate leading-tight">
                            {job.title || job.t}
                          </div>
                          <div className="text-[11.5px] text-gray-500 truncate mt-0.5 font-medium">
                            {job.company || job.companyName} • {job.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
                    No jobs found for "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="flex-1 flex items-center px-3 h-full min-w-0"
            onClick={() => setOpenDropdown(null)}
          >
            <svg className="w-5 h-5 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <LocationAutocomplete
              value={searchLocation}
              onChange={(val) => {
                setOpenDropdown(null);
                onSearchLocationChange?.(typeof val === 'object' && val !== null ? (val.label || val.value || '') : (val || ''));
              }}
              onSelect={(val) => {
                setOpenDropdown(null);
                onSearchLocationChange?.(val);
              }}
              placeholder="City, state"
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent text-sm text-gray-900 placeholder-gray-500 shadow-none ring-0"
            />
          </div>
        </div>

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
            title={userName || 'Account'}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
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
            name={userName}
            onNavigateProfile={onNavigateProfile}
            onNavigateSaved={onNavigateSaved}
            onNavigateApplied={onNavigateApplied}
            onNavigateSecurity={onNavigateSecurity}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </header>
  );
}

