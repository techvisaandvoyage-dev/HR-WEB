import React, { useState, useEffect, useRef } from 'react';
import './headers.css';

export default function SjGuestHeader({
  logoConfig,
  onOpenEmployeeLogin,
  onOpenEmployerLogin,
  onOpenConsultantLogin,
  onLogoClick,
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);

  const isImage = logoConfig?.type === 'image' && Boolean(logoConfig.imageUrl);
  const isCustomText =
    logoConfig?.type === 'text' &&
    Boolean(logoConfig.text) &&
    logoConfig.text.trim().toLowerCase() !== 'sahijob';
  const logoText = logoConfig?.text || 'SahiJob';
  const accentText =
    logoConfig?.accentText !== undefined ? logoConfig.accentText : '.com';

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const handleEmployee = () => {
    setIsMobileMenuOpen(false);
    if (onOpenEmployeeLogin) onOpenEmployeeLogin();
  };

  const handleEmployer = () => {
    setIsMobileMenuOpen(false);
    if (onOpenEmployerLogin) onOpenEmployerLogin();
  };

  const handleConsultant = () => {
    setIsMobileMenuOpen(false);
    if (onOpenConsultantLogin) onOpenConsultantLogin();
  };

  return (
    <header className="sj-header" id="gh" ref={headerRef}>
      <div className="sj-nav-inner">
        {/* Brand Logo */}
        <a
          href="/"
          className="sj-logo mr-auto inline-flex items-center"
          onClick={(e) => {
            if (onLogoClick) {
              e.preventDefault();
              onLogoClick();
            }
          }}
          aria-label={logoConfig?.altText || 'SahiJob Home'}
        >
          {isImage ? (
            <img
              src={logoConfig.imageUrl}
              alt={logoConfig.altText || logoText}
              style={{
                height: `${logoConfig.height || 36}px`,
                maxWidth: '180px',
                objectFit: 'contain',
              }}
            />
          ) : isCustomText ? (
            <span className="inline-flex items-center tracking-tight">
              <span style={{ color: 'var(--sj-ink)' }}>{logoText}</span>
              <span style={{ color: 'var(--sj-acc)' }}>{accentText}</span>
            </span>
          ) : (
            <>
              Sahi<b>Job</b>
              <span style={{ color: 'var(--sj-acc)' }}>{accentText}</span>
            </>
          )}
        </a>

        {/* Desktop Navigation (>= 768px) */}
        <div className="sj-guest-desktop-actions flex items-center gap-3">
          <button
            type="button"
            className="sj-guest-btn-pill sj-guest-btn-employee"
            onClick={onOpenEmployeeLogin}
          >
            Employee Login
          </button>

          <button
            type="button"
            className="sj-guest-btn-pill sj-guest-btn-employer"
            onClick={onOpenEmployerLogin}
          >
            Employer Login
          </button>

          <button
            type="button"
            className="sj-guest-btn-pill sj-guest-btn-consultant"
            onClick={onOpenConsultantLogin}
          >
            Consultant Login
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button (< 768px) */}
        <button
          type="button"
          className="sj-hamburger-btn"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Dropdown Drawer with all 3 Buttons */}
      {isMobileMenuOpen && (
        <div className="sj-mobile-menu-drawer">
          <div className="sj-mobile-menu-inner">
            <button
              type="button"
              className="sj-mobile-menu-btn sj-mobile-menu-btn-employee"
              onClick={handleEmployee}
            >
              Employee Login
            </button>

            <button
              type="button"
              className="sj-mobile-menu-btn sj-mobile-menu-btn-employer"
              onClick={handleEmployer}
            >
              Employer Login
            </button>

            <button
              type="button"
              className="sj-mobile-menu-btn sj-mobile-menu-btn-consultant"
              onClick={handleConsultant}
            >
              Consultant Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
