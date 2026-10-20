import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const EmployerUserMenu = ({ employerProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const displayName = employerProfile?.fullName || employerProfile?.companyName || 'Recruiter';
  const displayEmail = employerProfile?.email || '';
  const displayCompany = employerProfile?.companyName || '';
  const displayInitial = ((employerProfile?.fullName || employerProfile?.companyName || displayName || 'C')[0] || 'C').toUpperCase();
  const isConsultant = employerProfile?.isConsultant === true;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setIsOpen(false);
    localStorage.removeItem('employerToken');
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border border-[#eaecf0] bg-white text-[#15803d] font-bold text-sm flex items-center justify-center hover:bg-[#f9fafb] transition-all cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-[#16a34a]"
        title={displayName}
        aria-label="Account menu"
        aria-expanded={isOpen}
      >
        {employerProfile?.companyLogo ? (
          <img src={employerProfile.companyLogo} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          displayInitial
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 mt-1 w-[272px] bg-white border border-[#eaecf0] rounded-[12px] shadow-[0_12px_32px_rgba(16,24,40,0.12)] p-1.5 z-50">
          
          {/* User Info Header */}
          <div className="flex items-center gap-3 p-2.5 pb-3 border-b border-[#eaecf0] mb-1">
            <div className="w-[34px] h-[34px] rounded-full bg-[#ecfdf3] text-[#15803d] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
              {employerProfile?.companyLogo ? (
                <img src={employerProfile.companyLogo} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayInitial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <strong className="font-semibold text-[14px] text-[#101828] truncate block leading-tight">{displayName}</strong>
                {isConsultant && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ecfdf3] text-[#15803d] border border-[#eaecf0]">
                    Consultant
                  </span>
                )}
              </div>
              <div className="text-[#667085] text-[13px] truncate mt-0.5 leading-snug">{displayCompany || displayEmail}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-0.5">
            <Link
              to="/employer/company-profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-2.5 py-2 rounded-[8px] text-[#101828] font-semibold text-[14px] hover:bg-[#f9fafb] transition-colors"
            >
              <svg className="w-[18px] h-[18px] text-[#667085] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="3" width="14" height="18" rx="1.5" />
                <path d="M9 7h2M13 7h2M9 11h2M13 11h2M10 21v-4h4v4" />
              </svg>
              <div className="min-w-0">
                <div className="leading-tight text-[14px]">Account</div>
                <small className="block font-normal text-[#667085] text-[12.5px] leading-snug mt-0.5">Company &amp; profile details</small>
              </div>
            </Link>

            <Link
              to="/employer/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-2.5 py-2 rounded-[8px] text-[#101828] font-semibold text-[14px] hover:bg-[#f9fafb] transition-colors"
            >
              <svg className="w-[18px] h-[18px] text-[#667085] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
              </svg>
              <div className="min-w-0">
                <div className="leading-tight text-[14px]">Settings</div>
                <small className="block font-normal text-[#667085] text-[12.5px] leading-snug mt-0.5">Preferences &amp; security</small>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-[8px] text-[#101828] font-semibold text-[14px] hover:bg-[#f9fafb] hover:text-[#d92d20] transition-colors cursor-pointer text-left group"
            >
              <svg className="w-[18px] h-[18px] text-[#667085] group-hover:text-[#d92d20] shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <div className="min-w-0">
                <div className="leading-tight text-[14px]">Sign out</div>
                <small className="block font-normal text-[#667085] text-[12.5px] leading-snug mt-0.5">Log out of your account</small>
              </div>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default EmployerUserMenu;
