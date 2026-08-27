import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DashboardOverview from './DashboardOverview';
import PostJob from './PostJob';
import ManageJobs from './ManageJobs';
import CandidatesTab from './CandidatesTab';
import ApplicationsTab from './ApplicationsTab';
import CompanyProfileTab from './CompanyProfileTab';
import AllEmployeesTab from './AllEmployeesTab';
import EmployerMessages from '../messages/EmployerMessages';

const EmployerDashboard = ({ onLogout, jobs, addJob, candidates, rawAppsData, updateCandidateStatus, toggleJobStatus }) => {
  const location = useLocation();
  const [totalUnread, setTotalUnread] = React.useState(0);
  const [refreshNav, setRefreshNav] = React.useState(false);

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

  const navItems = [
    { name: 'Dashboard', path: '/employer', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { name: 'Applications', path: '/employer/applications', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { name: 'All Employees', path: '/employer/all-employees', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    )},
    { name: 'Messages', path: '/employer/messages', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
    )},
    { name: 'Account', path: '/employer/company-profile', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    )},
    { name: 'Settings', path: '/employer/settings', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )}
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white flex flex-col shrink-0 border-r border-gray-100">
        <div className="h-24 flex items-center px-8">
          <span className="text-xl font-bold tracking-tight text-[#3ca152]">Jobs</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
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
                {item.name === 'Messages' && totalUnread > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ml-auto ${location.pathname === item.path ? 'bg-white text-[#29953f]' : 'bg-[#29953f] text-white'}`}>
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Sign Out Block */}
        <div className="p-6 border-t border-gray-100 mt-auto">
          <button 
            onClick={() => {
              localStorage.removeItem('employerToken');
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-lg font-bold text-sm text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10 relative">
          <div className="max-w-[1200px] mx-auto w-full">
            <Routes>
              <Route index element={<DashboardOverview jobs={jobs} candidates={candidates} toggleJobStatus={toggleJobStatus} />} />
              <Route path="/post-job" element={<PostJob addJob={addJob} />} />
              <Route path="/manage-jobs" element={<ManageJobs jobs={jobs} candidates={candidates} toggleJobStatus={toggleJobStatus} />} />
              <Route path="/applications" element={<CandidatesTab candidates={candidates} jobs={jobs} updateCandidateStatus={updateCandidateStatus} />} />
              <Route path="/all-employees" element={<AllEmployeesTab />} />
              <Route path="/company-profile" element={<CompanyProfileTab />} />
              {/* Placeholders for Messages and Settings */}
              <Route path="/messages" element={<EmployerMessages candidates={candidates} triggerNavRefresh={() => setRefreshNav(prev => !prev)} updateCandidateStatus={updateCandidateStatus} />} />
              <Route path="/settings" element={<div className="p-8 text-center text-gray-500 font-bold">Settings - Coming Soon</div>} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;
