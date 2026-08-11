import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ManageJobs from './ManageJobs';
const DashboardOverview = ({ jobs = [], candidates = [], toggleJobStatus }) => {
  const [selectedJob, setSelectedJob] = useState(null);

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
  const totalAppsCount = candidates.reduce((sum, c) => sum + (c.history?.length || 0), 0) || 124; // Fallback if no candidates
  const totalCandidatesCount = candidates.length || 98;
  const shortlistedCount = candidates.reduce((sum, c) => sum + (c.history?.filter(h => h.status === 'Shortlisted').length || 0), 0) || 24;

  const stats = [
    { label: 'Active Jobs', value: activeJobsCount.toString(), trend: 'Updated just now', trendColor: 'text-gray-500', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#147a2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    )},
    { label: 'Total Applications', value: totalAppsCount.toString(), trend: '+12 this week', trendColor: 'text-green-600', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#147a2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { label: 'Total Candidates', value: totalCandidatesCount.toString(), trend: '+8 this week', trendColor: 'text-green-600', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
    { label: 'Shortlisted', value: shortlistedCount.toString(), trend: '+5 this week', trendColor: 'text-green-600', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
    )}
  ];

  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Welcome back, Recruiter! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your job postings today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/employer/post-job"
            className="px-5 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Post New Job
          </Link>
          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-green-700 shadow-sm cursor-pointer">
            C
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="pt-2">
        <ManageJobs jobs={jobs} toggleJobStatus={toggleJobStatus} hideHeader={true} />
      </div>
    </div>
  );
};

export default DashboardOverview;
