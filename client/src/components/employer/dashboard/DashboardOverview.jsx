import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ManageJobs from './ManageJobs';

const DashboardOverview = ({ portalConfig, employerProfile, employerName, jobs = [], candidates = [], toggleJobStatus }) => {
  const [selectedJob, setSelectedJob] = useState(null);

  const displayName = employerName || employerProfile?.fullName || employerProfile?.companyName || 'Recruiter';
  const displayInitial = ((employerProfile?.fullName || employerProfile?.companyName || displayName || 'C')[0] || 'C').toUpperCase();

  const chartData = [
    { name: 'Mon', apps: 12 },
    { name: 'Tue', apps: 22 },
    { name: 'Wed', apps: 25 },
    { name: 'Thu', apps: 38 },
    { name: 'Fri', apps: 32 },
    { name: 'Sat', apps: 25 },
    { name: 'Sun', apps: 15 },
  ];

  const activeJobsCount = jobs.filter(j => j.status !== 'Closed').length;
  const totalAppsCount = candidates.reduce((sum, c) => sum + (c.history?.length || 0), 0);
  const totalCandidatesCount = candidates.length;
  const shortlistedCount = candidates.reduce((sum, c) => sum + (c.history?.filter(h => h.status === 'Shortlisted').length || 0), 0);

  const stats = [
    { label: portalConfig?.stats?.activeJobsLabel || portalConfig?.stats?.activeJobLabel || 'Active Job', value: activeJobsCount.toString(), trend: 'Updated just now', trendColor: 'text-gray-500', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#147a2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    )},
    { label: portalConfig?.stats?.totalApplicationsLabel || 'Total Applications', value: totalAppsCount.toString(), trend: '+12 this week', trendColor: 'text-green-600', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#147a2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { label: portalConfig?.stats?.totalCandidatesLabel || 'Total Candidates', value: totalCandidatesCount.toString(), trend: '+8 this week', trendColor: 'text-green-600', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
    { label: portalConfig?.stats?.shortlistedLabel || 'Shortlisted', value: shortlistedCount.toString(), trend: '+5 this week', trendColor: 'text-green-600', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
    )}
  ];

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="animate-in fade-in duration-150">
      {/* Stats Horizontal Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-[#eaecf0] rounded-[12px] bg-white overflow-hidden mb-8">
        <div className="p-5 sm:px-6 sm:py-5 border-b md:border-b-0 border-r border-[#eaecf0]">
          <p className="m-0 text-[#667085] font-medium text-[14px]">Active jobs</p>
          <strong className="block font-bold text-[30px] leading-[1.2] tracking-[-0.03em] text-[#101828] mt-0.5">
            {activeJobsCount}
          </strong>
        </div>
        <div className="p-5 sm:px-6 sm:py-5 border-b md:border-b-0 md:border-r border-[#eaecf0]">
          <p className="m-0 text-[#667085] font-medium text-[14px]">Total applications</p>
          <strong className="block font-bold text-[30px] leading-[1.2] tracking-[-0.03em] text-[#101828] mt-0.5">
            {totalAppsCount}
          </strong>
        </div>
        <div className="p-5 sm:px-6 sm:py-5 border-r border-[#eaecf0] max-md:border-r-0">
          <p className="m-0 text-[#667085] font-medium text-[14px]">Total candidates</p>
          <strong className="block font-bold text-[30px] leading-[1.2] tracking-[-0.03em] text-[#101828] mt-0.5">
            {totalCandidatesCount}
          </strong>
        </div>
        <div className="p-5 sm:px-6 sm:py-5">
          <p className="m-0 text-[#667085] font-medium text-[14px]">Shortlisted</p>
          <strong className="block font-bold text-[30px] leading-[1.2] tracking-[-0.03em] text-[#101828] mt-0.5">
            {shortlistedCount}
          </strong>
        </div>
      </div>

      {/* Main Layout / Job List */}
      <div>
        <ManageJobs portalConfig={portalConfig} jobs={jobs} candidates={candidates} toggleJobStatus={toggleJobStatus} hideHeader={true} />
      </div>
    </div>
  );
};

export default DashboardOverview;
