import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import BrandLogo from '../../common/BrandLogo';
import DashboardOverview from './DashboardOverview';
import PostJob from './PostJob';
import ManageJobs from './ManageJobs';
import CandidatesTab from './CandidatesTab';
import ApplicationsTab from './ApplicationsTab';
import CompanyProfileTab from './CompanyProfileTab';
import AllEmployeesTab from './AllEmployeesTab';
import EmployerMessages from '../messages/EmployerMessages';
import EmployerSettingsTab from './EmployerSettingsTab';

import EmployerUserMenu from './EmployerUserMenu';
import { socket } from '../../../utils/socket';

const EmployerDashboard = ({ onLogout, jobs, addJob, updateJob, candidates, rawAppsData, updateCandidateStatus, toggleJobStatus }) => {
  const location = useLocation();
  const [totalUnread, setTotalUnread] = React.useState(0);
  const [refreshNav, setRefreshNav] = React.useState(false);
  const [employerProfile, setEmployerProfile] = React.useState(null);
  const [portalConfig, setPortalConfig] = React.useState(null);

  React.useEffect(() => {
    const fetchPortalConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data && data.data.employerPortal) {
          setPortalConfig(data.data.employerPortal);
        }
      } catch (err) {
        console.error("Error fetching employer portal config:", err);
      }
    };
    fetchPortalConfig();
  }, []);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('employerToken');
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setEmployerProfile(data.data);
        }
      } catch (err) {
        console.error("Error fetching employer profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const fetchUnreadCount = async () => {
    if (!localStorage.getItem('employerToken')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/unread-count`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setTotalUnread(data.count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  React.useEffect(() => {
    fetchUnreadCount();
  }, [refreshNav]);

  React.useEffect(() => {
    const handleConversationUpdate = (data) => {
      fetchUnreadCount();
    };

    socket.on('conversation_updated', handleConversationUpdate);
    return () => {
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, []);


  const sidebarCfg = portalConfig?.sidebar || {};
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  const navItems = [
    { key: 'dashboard', name: sidebarCfg.dashboardLabel || sidebarCfg.dashboard || 'Dashboard', path: '/employer', icon: (
      <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>
    )},
    { key: 'applications', name: sidebarCfg.applicationsLabel || sidebarCfg.applications || 'Applications', path: '/employer/applications', icon: (
      <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/></svg>
    )},
    { key: 'candidates', name: sidebarCfg.candidatesLabel || sidebarCfg.candidates || 'Candidates', path: '/employer/candidates', icon: (
      <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
    )},
    { key: 'messages', name: sidebarCfg.messagesLabel || sidebarCfg.messages || 'Messages', path: '/employer/messages', icon: (
      <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>
    )}
  ];

  const displayName = employerProfile?.fullName || employerProfile?.companyName || 'Recruiter';
  const displayCompany = employerProfile?.companyName || 'Employer';
  const displayInitial = ((employerProfile?.fullName || employerProfile?.companyName || displayName || 'C')[0] || 'C').toUpperCase();

  return (
    <div className="min-h-screen bg-white flex font-sans text-[#101828]">
      {/* Mobile Drawer Overlay / Scrim */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-[#101828]/40 z-40 min-[860px]:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Sidebar (~248px) */}
      <aside className={`w-[248px] bg-white border-r border-[#eaecf0] flex flex-col shrink-0 z-50 transition-transform duration-200 ease-in-out max-[860px]:fixed max-[860px]:left-0 max-[860px]:top-0 max-[860px]:bottom-0 max-[860px]:w-[264px] ${isMobileNavOpen ? 'max-[860px]:translate-x-0' : 'max-[860px]:-translate-x-full'} min-[860px]:sticky min-[860px]:top-0 min-[860px]:h-screen`}>
        {/* Logo */}
        <div className="pt-7 pb-6 px-4 flex items-center justify-between">
          <Link to="/employer" className="text-[21px] font-[800] tracking-[-0.03em] text-[#101828] select-none block">
            sahijob<b className="text-[#16a34a]">.com</b>
          </Link>
          <button 
            type="button" 
            onClick={() => setIsMobileNavOpen(false)}
            className="p-1 text-[#667085] hover:text-[#101828] min-[860px]:hidden"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setIsMobileNavOpen(false)}
                className={`flex items-center gap-3 px-3 py-[9px] rounded-[8px] font-semibold text-[14.5px] transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#ecfdf3] text-[#15803d]'
                    : 'text-[#667085] hover:bg-[#f9fafb] hover:text-[#101828]'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.name}</span>
                {item.key === 'messages' && totalUnread > 0 && !isActive && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full ml-auto bg-[#16a34a] text-white">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto border-t border-[#eaecf0] pt-4 pb-5 px-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 px-3 py-1">
            <div className="w-[34px] h-[34px] rounded-full bg-[#ecfdf3] text-[#15803d] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
              {employerProfile?.companyLogo ? (
                <img src={employerProfile.companyLogo} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayInitial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="font-semibold text-[14px] text-[#101828] block truncate leading-tight">{displayName}</strong>
              <small className="block text-[#667085] text-[12.5px] truncate leading-snug mt-0.5">{displayCompany}</small>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('employerToken');
              window.location.href = '/';
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-[#667085] font-semibold text-[14px] rounded-[8px] hover:bg-[#f9fafb] hover:text-[#d92d20] transition-colors w-full text-left cursor-pointer group"
          >
            <svg className="w-[18px] h-[18px] text-[#667085] group-hover:text-[#d92d20] shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Permanent Sticky Top Bar Header */}
        <header className="bg-white border-b border-[#eaecf0] px-6 lg:px-10 py-5 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu burger */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-2 border border-[#eaecf0] rounded-[8px] text-[#101828] hover:bg-[#f9fafb] min-[860px]:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <div>
              <h1 className="text-[22px] sm:text-[25px] lg:text-[28px] font-bold text-[#101828] tracking-[-0.025em] leading-[1.2] flex items-center gap-2.5 flex-wrap">
                <span>{portalConfig?.dashboard?.welcomePrefix || 'Welcome back,'} {displayName}</span>
                {employerProfile?.isConsultant === true && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ecfdf3] text-[#15803d] border border-[#eaecf0]">
                    Consultant
                  </span>
                )}
              </h1>
              <p className="text-[#667085] text-[13.5px] sm:text-[14px] mt-1">
                {portalConfig?.dashboard?.subtitle || "Here's what's happening with your job postings today."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link 
              to="/employer/post-job"
              className="inline-flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-[14px] px-4 py-2.5 rounded-[8px] transition-colors shadow-none cursor-pointer"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              <span className="hidden sm:inline">Post new job</span>
            </Link>
            <EmployerUserMenu employerProfile={employerProfile} />
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 relative">
          <div className="max-w-[1180px] w-full">
            <Routes>
              <Route index element={<DashboardOverview portalConfig={portalConfig?.dashboard} employerProfile={employerProfile} jobs={jobs} candidates={candidates} toggleJobStatus={toggleJobStatus} />} />
              <Route path="/post-job" element={<PostJob addJob={addJob} updateJob={updateJob} />} />
              <Route path="/manage-jobs" element={<ManageJobs portalConfig={portalConfig?.dashboard} jobs={jobs} candidates={candidates} toggleJobStatus={toggleJobStatus} />} />
              <Route path="/applications" element={<CandidatesTab portalConfig={portalConfig?.applications} candidates={candidates} jobs={jobs} updateCandidateStatus={updateCandidateStatus} />} />
              <Route path="/candidates" element={<AllEmployeesTab portalConfig={portalConfig?.candidates} />} />
              <Route path="/all-employees" element={<AllEmployeesTab portalConfig={portalConfig?.candidates} />} />
              <Route path="/company-profile" element={<CompanyProfileTab portalConfig={portalConfig?.account} employerProfile={employerProfile} />} />
              {/* Placeholders for Messages and Settings */}
              <Route path="/messages" element={<EmployerMessages portalConfig={portalConfig?.messages} candidates={candidates} triggerNavRefresh={() => setRefreshNav(prev => !prev)} updateCandidateStatus={updateCandidateStatus} />} />
              <Route path="/settings" element={<EmployerSettingsTab portalConfig={portalConfig?.settings} />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;
