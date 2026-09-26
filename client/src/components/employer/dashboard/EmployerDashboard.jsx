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

  React.useEffect(() => {
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
    fetchUnreadCount();
  }, [refreshNav]);

  const sidebarCfg = portalConfig?.sidebar || {};

  const navItems = [
    { key: 'dashboard', name: sidebarCfg.dashboardLabel || sidebarCfg.dashboard || 'Dashboard', path: '/employer', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { key: 'applications', name: sidebarCfg.applicationsLabel || sidebarCfg.applications || 'Applications', path: '/employer/applications', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { key: 'candidates', name: sidebarCfg.candidatesLabel || sidebarCfg.candidates || 'Candidates', path: '/employer/candidates', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    )},
    { key: 'messages', name: sidebarCfg.messagesLabel || sidebarCfg.messages || 'Messages', path: '/employer/messages', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
    )},
    { key: 'account', name: sidebarCfg.accountLabel || sidebarCfg.account || 'Account', path: '/employer/company-profile', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    )},
    { key: 'settings', name: sidebarCfg.settingsLabel || sidebarCfg.settings || 'Settings', path: '/employer/settings', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )}
  ];

  const displayName = employerProfile?.fullName || employerProfile?.companyName || 'Recruiter';
  const displayInitial = ((employerProfile?.fullName || employerProfile?.companyName || displayName || 'C')[0] || 'C').toUpperCase();

  return (
    <div className="min-h-screen bg-[#fafbfc] flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white flex flex-col shrink-0 border-r border-gray-100">
        <div className="h-24 flex items-center px-6">
          <BrandLogo />
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-[#29953f] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3 relative w-full">
                {item.icon}
                <span className="flex-1">{item.name}</span>
                {item.key === 'messages' && totalUnread > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ml-auto ${location.pathname === item.path ? 'bg-white text-[#29953f]' : 'bg-[#29953f] text-white'}`}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* User Card & Sign Out Block */}
        <div className="p-4 border-t border-gray-100 mt-auto space-y-3">
          {employerProfile && (
            <Link 
              to="/employer/company-profile"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                {employerProfile.companyLogo ? (
                  <img src={employerProfile.companyLogo} alt={displayName} className="w-full h-full object-cover bg-white" />
                ) : (
                  displayInitial
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-extrabold text-gray-900 truncate">{displayName}</p>
                  {employerProfile.hiringFor === 'consultant' && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <svg className="w-2 h-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                      Consultant
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 truncate">{employerProfile.companyName || employerProfile.email}</p>
              </div>
            </Link>
          )}

          <button 
            onClick={() => {
              localStorage.removeItem('employerToken');
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-xs text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {sidebarCfg.signOutLabel || sidebarCfg.signOut || 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <div className="max-w-[1600px] mx-auto w-full space-y-6">
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
