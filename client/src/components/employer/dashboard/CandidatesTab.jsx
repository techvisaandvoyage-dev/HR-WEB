import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DateRangePicker from '../../common/DateRangePicker';

const CandidatesTab = ({ candidates: globalCandidates = [], jobs = [], updateCandidateStatus }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialJob = location.state?.jobTitle || 'All Jobs';
  const [selectedJob, setSelectedJob] = useState(initialJob);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('All');
  const [appsFilter, setAppsFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCandidates, setExpandedCandidates] = useState(new Set());

  const toggleCandidate = (id) => {
    const newSet = new Set(expandedCandidates);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCandidates(newSet);
  };

  const allJobs = ['All Jobs', ...new Set([...jobs.map(j => j.title), ...(initialJob !== 'All Jobs' ? [initialJob] : [])])];

  const candidates = globalCandidates;

  const getStatusBadgeStyles = (status) => {
    const map = {
      'new': 'bg-blue-50 text-blue-600 border-blue-100',
      'applied': 'bg-blue-50 text-blue-600 border-blue-100',
      'viewed': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'under review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'shortlisted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'interview scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
      'technical round': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'hr round': 'bg-pink-50 text-pink-700 border-pink-200',
      'offer sent': 'bg-teal-50 text-teal-700 border-teal-200',
      'hired': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-50 text-red-600 border-red-100',
      'withdrawn': 'bg-stone-100 text-stone-600 border-stone-200',
    };
    const key = status?.toLowerCase() || 'new';
    return map[key] || map['new'];
  };

  const statusOptions = ['New', 'Viewed', 'Shortlisted', 'Rejected'];

  const filteredCandidates = candidates.map(candidate => {
    // 1. Application-level filtering
    const matchingHistory = (candidate.history || []).filter(app => {
      // Job Filter
      if (selectedJob !== 'All Jobs' && app.title?.trim().toLowerCase() !== selectedJob?.trim().toLowerCase()) return false;
      
      // Status Filter
      if (statusFilter !== 'All' && app.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      
      // Date Filter
      if (dateRange.start || dateRange.end) {
        try {
          const appDate = new Date(app.date);
          appDate.setHours(0,0,0,0);
          
          if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0,0,0,0);
            if (appDate < startDate) return false;
          }
          if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23,59,59,999);
            if (appDate > endDate) return false;
          }
        } catch (e) {
          // ignore
        }
      }
      return true;
    });

    if (matchingHistory.length === 0) return null;

    // 2. Candidate-level filtering (Apps Count)
    if (appsFilter !== 'All') {
      if (appsFilter === '1' && matchingHistory.length !== 1) return null;
      if (appsFilter === '2' && matchingHistory.length !== 2) return null;
      if (appsFilter === '3+' && matchingHistory.length < 3) return null;
    }

    // 3. Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = candidate.name?.toLowerCase().includes(q);
      const matchesEmail = candidate.email?.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail) return null;
    }

    return {
      ...candidate,
      history: matchingHistory,
      apps: matchingHistory.length // Update dynamic count
    };
  }).filter(Boolean);

  const clearFilters = () => {
    setSelectedJob('All Jobs');
    setStatusFilter('All');
    setAppsFilter('All');
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
  };
  
  const hasActiveFilters = selectedJob !== 'All Jobs' || statusFilter !== 'All' || appsFilter !== 'All' || dateRange.start || dateRange.end || searchQuery;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {selectedJob === 'All Jobs' ? 'Applications' : selectedJob}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {selectedJob !== 'All Jobs' 
              ? `Showing applications for ${selectedJob}` 
              : 'Browse and manage all applications.'}
          </p>
        </div>
      </div>

      {/* Content Layout */}
      <div className="relative">
        
        {/* Main Content Area */}
        <div className="w-full">
        
          {/* Filters Bar */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-[#ECECEC] shadow-sm">
            <div className="flex gap-4 items-center flex-1 min-w-[280px] max-w-[500px]">
              <div className="relative flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applications by name or email..." 
                  className="w-full pl-9 pr-4 py-2 border border-[#ECECEC] rounded-lg text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-400"
                />
              </div>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="text-sm font-semibold text-[#888888] hover:text-[#111111] transition-colors whitespace-nowrap px-2"
                >
                  Clear filters
                </button>
              )}
            </div>
            
            <div className="flex gap-3 flex-wrap items-center">
              {/* Job Filter */}
              <div className="flex items-center bg-[#FDFDFD] border border-[#ECECEC] rounded-xl px-4 py-2 hover:border-[#D1D1D1] transition-colors focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999] h-[42px] relative overflow-hidden">
                <span className="text-[12px] font-bold text-[#666666] tracking-wider uppercase mr-3 shrink-0">Job</span>
                <select 
                  className="bg-transparent border-none text-[14px] font-semibold text-[#111111] focus:ring-0 cursor-pointer outline-none appearance-none pr-6 relative w-32 truncate"
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                >
                  {allJobs.map(job => <option key={job} value={job}>{job}</option>)}
                </select>
                <div className="pointer-events-none absolute right-4 text-[#888888]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Date Filter */}
              <div className="w-[260px]">
                <DateRangePicker 
                  dateRange={dateRange}
                  onRangeChange={setDateRange}
                  className="h-[42px]"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-[#FDFDFD] border border-[#ECECEC] rounded-xl px-4 py-2 hover:border-[#D1D1D1] transition-colors focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999] h-[42px] relative overflow-hidden">
                <span className="text-[12px] font-bold text-[#666666] tracking-wider uppercase mr-3 shrink-0">Status</span>
                <select 
                  className="bg-transparent border-none text-[14px] font-semibold text-[#111111] focus:ring-0 cursor-pointer outline-none appearance-none pr-6 relative"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <div className="pointer-events-none absolute right-4 text-[#888888]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Apps Filter */}
              <div className="flex items-center bg-[#FDFDFD] border border-[#ECECEC] rounded-xl px-4 py-2 hover:border-[#D1D1D1] transition-colors focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999] h-[42px] relative overflow-hidden">
                <span className="text-[12px] font-bold text-[#666666] tracking-wider uppercase mr-3 shrink-0">Apps</span>
                <select 
                  className="bg-transparent border-none text-[14px] font-semibold text-[#111111] focus:ring-0 cursor-pointer outline-none appearance-none pr-6 relative"
                  value={appsFilter}
                  onChange={(e) => setAppsFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
                <div className="pointer-events-none absolute right-4 text-[#888888]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Candidates Accordion List */}
          <div className="space-y-3">
            {filteredCandidates.length === 0 ? (
              <div className="bg-white border border-[#ECECEC] rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-[#ECECEC]">
                  <svg className="w-8 h-8 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-[#111111] mb-2">No matching applications found</h3>
                <p className="text-[#666666] mb-6">Try changing your filters or searching with different keywords.</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-6 py-2.5 bg-[#111111] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition-colors shadow-sm">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              filteredCandidates.map((cand) => {
              const isExpanded = expandedCandidates.has(cand.id);
              const historyCount = cand.history?.length || 1;
              
              return (
                <div 
                  key={cand.id} 
                  className={`bg-white rounded-[16px] border border-[#ECECEC] shadow-sm hover:shadow-md transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${isExpanded ? 'ring-1 ring-gray-200' : 'hover:-translate-y-[1px]'}`}
                >
                  {/* Parent Card Header */}
                  <div 
                    className="flex justify-between items-center p-5 cursor-pointer group"
                    onClick={() => toggleCandidate(cand.id)}
                  >
                    {/* Left Side */}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm ${cand.bg}`}>
                        {cand.initials}
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-bold text-gray-900 text-[15px] group-hover:text-blue-600 transition-colors">{cand.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[13px] text-gray-500 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {cand.email}
                          </span>
                          {cand.phone && (
                            <span className="text-[13px] text-gray-500 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {cand.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                          {historyCount} {historyCount === 1 ? 'Application' : 'Applications'}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1.5 font-medium tracking-wide uppercase">
                          Last Active: {cand.date}
                        </span>
                      </div>
                      
                      <div className={`p-2 rounded-full border border-gray-100 bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-all duration-300 ${isExpanded ? 'rotate-180 bg-gray-100 text-gray-700' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Applications Table */}
                  <div 
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-[#ECECEC] bg-[#FAFAFA] p-4 sm:p-6 pb-8">
                        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 pl-2">Application History</h5>
                        
                        <div className="bg-white rounded-xl border border-[#ECECEC] shadow-sm overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="text-[11px] text-gray-400 uppercase tracking-wider border-b border-[#ECECEC] bg-gray-50/50">
                                <th className="px-5 py-3 font-semibold">Job Title</th>
                                <th className="px-5 py-3 font-semibold">Applied</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#ECECEC]">
                              {(cand.history || []).map((hist, i) => (
                                <tr key={i} className="hover:bg-blue-50/30 transition-colors group/row">
                                  <td className="px-5 py-3.5 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 ring-4 ring-blue-50"></div>
                                    <span className="font-semibold text-gray-800 text-[13px]">{hist.title}</span>
                                  </td>
                                  <td className="px-5 py-3.5 text-[13px] text-gray-500 font-medium">
                                    {hist.date || cand.date}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <select 
                                      className={`appearance-none cursor-pointer outline-none transition-all inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadgeStyles(hist.status)}`}
                                      value={hist.status || 'New'}
                                      onChange={(e) => {
                                        const newStatus = e.target.value;
                                        const newHistory = cand.history.map((h, index) => 
                                          index === i ? { ...h, status: newStatus } : h
                                        );
                                        
                                        if (updateCandidateStatus) {
                                          updateCandidateStatus(hist.appId, newStatus);
                                        }
                                        
                                        // Update local mock data temporarily for UX
                                        cand.history = newHistory;
                                        setExpandedCandidates(new Set(expandedCandidates)); // trigger re-render
                                      }}
                                    >
                                      {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover/row:opacity-100 transition-opacity">
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          if (hist.status?.toLowerCase() === 'new' || hist.status?.toLowerCase() === 'applied') {
                                            if (updateCandidateStatus) updateCandidateStatus(hist.appId, 'Viewed');
                                            cand.history = cand.history.map(h => h.appId === hist.appId ? { ...h, status: 'Viewed', color: getStatusBadgeStyles('Viewed') } : h);
                                            setExpandedCandidates(new Set(expandedCandidates));
                                          }
                                          setSelectedCandidate(cand);
                                          setSelectedApplication(hist);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                                        title="View Profile"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                      </button>
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          if (hist.status?.toLowerCase() === 'new' || hist.status?.toLowerCase() === 'applied') {
                                            if (updateCandidateStatus) updateCandidateStatus(hist.appId, 'Viewed');
                                            cand.history = cand.history.map(h => h.appId === hist.appId ? { ...h, status: 'Viewed', color: getStatusBadgeStyles('Viewed') } : h);
                                            setExpandedCandidates(new Set(expandedCandidates));
                                          }
                                          setPreviewResume(cand); 
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-[#29953f] hover:bg-green-50 rounded-md transition-colors" 
                                        title="Resume"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                      </button>
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          navigate('/employer/messages', { state: { initialEmployee: cand } });
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors" 
                                        title="Message"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); console.log("Open more menu"); }}
                                        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors" 
                                        title="More"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-800 bg-white border border-gray-200 shadow-sm font-bold text-sm">1</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:border hover:border-gray-200 hover:shadow-sm transition-all font-bold text-sm">2</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:border hover:border-gray-200 hover:shadow-sm transition-all font-bold text-sm">3</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

        </div>

        {/* Overlapping Right Sidebar Drawer (Unchanged structure, refined aesthetics) */}
        {selectedCandidate && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
              onClick={() => { setSelectedCandidate(null); setSelectedApplication(null); }}
            ></div>
            <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 p-6 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full border-l border-[#ECECEC] font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="flex justify-between items-start mb-6 shrink-0">
                <h3 className="font-bold text-gray-900 text-lg">
                  {selectedApplication ? `Candidate Profile - ${selectedApplication.title}` : 'Candidate Profile'}
                </h3>
                <button 
                  onClick={() => { setSelectedCandidate(null); setSelectedApplication(null); }}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                <div className="flex flex-col items-center text-center border-b border-[#ECECEC] pb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm ring-4 ring-white ${selectedCandidate.bg}`}>
                    {selectedCandidate.initials}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCandidate.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedCandidate.email}</p>
                  <p className="text-xs font-semibold text-gray-400 mt-1">{selectedCandidate.phone || '+91 98765 43210'} • {selectedCandidate.location || 'Bangalore, India'}</p>
                </div>

                <div className="flex flex-col gap-4 border-b border-[#ECECEC] pb-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Function</h4>
                      <p className="text-sm font-bold text-gray-900">{selectedCandidate.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Designation</h4>
                      <p className="text-sm font-bold text-gray-900">{selectedCandidate.designation || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Experience</h4>
                      <p className="text-sm font-bold text-gray-900">{selectedCandidate.totalExperience || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preferred Location</h4>
                      <p className="text-sm font-bold text-gray-900">{selectedCandidate.preferredLocation || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <hr className="border-gray-100" />
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Current {selectedCandidate.salaryType === 'Monthly' ? 'Monthly Salary' : selectedCandidate.salaryType === 'Hourly' ? 'Hourly Salary' : 'Annual Salary'}
                      </h4>
                      <p className="text-sm font-bold text-gray-900">{selectedCandidate.currentCTC ? `₹ ${selectedCandidate.currentCTC}` : 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Expected {selectedCandidate.salaryType === 'Monthly' ? 'Monthly Salary' : selectedCandidate.salaryType === 'Hourly' ? 'Hourly Salary' : 'Annual Salary'}
                      </h4>
                      <p className="text-sm font-bold text-gray-900">{selectedCandidate.expectedCTC ? `₹ ${selectedCandidate.expectedCTC}` : 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <hr className="border-gray-100" />
                  
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Applied On</h4>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedApplication ? selectedApplication.date : selectedCandidate.date}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resume</h4>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewResume(selectedCandidate);
                          }}
                          className="text-sm font-bold text-[#29953f] hover:text-green-700 flex items-center gap-1.5 transition-colors"
                          title="Preview Resume"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Preview
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert('Downloading Resume...');
                          }}
                          className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                          title="Download Resume"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Screening Questions Section */}
                {selectedApplication && selectedApplication.screeningAnswers && selectedApplication.screeningAnswers.length > 0 && (
                  <div className="bg-[#f8fbfa] p-5 rounded-xl border border-[#e8f3ec] mb-2">
                    <h4 className="text-xs font-bold text-[#29953f] uppercase tracking-wider mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Screening Questions
                    </h4>
                    <div className="space-y-4">
                      {selectedApplication.screeningAnswers.map((item, idx) => (
                        <div key={idx} className="relative">
                          {idx !== 0 && <hr className="border-gray-200/60 mb-4" />}
                          <p className="text-sm font-semibold text-gray-900 mb-1.5">{item.question}</p>
                          <p className="text-[13px] text-gray-600 leading-relaxed bg-white p-3 rounded-lg border border-gray-100 shadow-sm">{item.answer || <span className="italic text-gray-400">No answer provided</span>}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standard sidebar content follows */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Professional Summary</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedCandidate.summary || <span className="text-gray-400 italic">No professional summary provided.</span>}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills?.length > 0 ? selectedCandidate.skills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-semibold border border-gray-100">
                        {skill}
                      </span>
                    )) : (
                      <span className="text-gray-400 italic text-sm">No skills provided.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Work Experience</h4>
                  <div className="space-y-4 ml-2">
                    {selectedCandidate.experience?.length > 0 && selectedCandidate.experience[0].companyName ? (
                      selectedCandidate.experience.map((exp, i) => (
                        <div key={i} className="mb-4">
                          <h5 className="font-bold text-gray-900 text-sm mb-2">{exp.companyName || 'Company'}</h5>
                          <div className="border-l-2 border-[#29953f] ml-1.5 space-y-4 py-1">
                            {(exp.roles && exp.roles.length > 0 ? exp.roles : [{}]).map((role, rIndex) => {
                                const formatDate = (dateStr) => {
                                  if (!dateStr) return '';
                                  const d = new Date(dateStr);
                                  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                };
                                const startDate = role.joiningDate ? formatDate(role.joiningDate) : 'Start';
                                const endDate = role.leavingDate ? formatDate(role.leavingDate) : 'Present';
                                
                                return (
                                  <div key={rIndex} className="relative pl-4">
                                    <div className="absolute w-2 h-2 bg-[#29953f] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                                    <h5 className="font-bold text-gray-900 text-sm">{role.jobTitle || 'Role'}</h5>
                                    <p className="text-[13px] text-gray-500 font-medium mb-1">
                                      {startDate} - {endDate} <span className="text-gray-300 mx-1">|</span> {role.employmentType || 'Full-time'}
                                    </p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{role.roleDescription || 'No description provided.'}</p>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-sm">No work experience provided.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Education</h4>
                  <div className="space-y-4 ml-2">
                    {selectedCandidate.education?.length > 0 ? (
                      selectedCandidate.education.map((edu, i) => (
                        <div key={i} className="relative pl-4">
                          <div className="absolute w-2 h-2 bg-[#29953f] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                          <h5 className="font-bold text-gray-900 text-sm">{edu.degree || 'Degree'}</h5>
                          <p className="text-xs text-[#29953f] font-semibold mb-1">{edu.year || 'Year'}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{edu.institution || 'Institution'}</p>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-sm">No education details provided.</span>
                    )}
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-6 border-t border-[#ECECEC] flex gap-3 shrink-0">
                <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm">
                  Message Candidate
                </button>
              </div>
            </div>
          </>
        )}

        {/* Resume Preview Modal (Unchanged) */}
        {previewResume && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="flex justify-between items-center p-4 border-b border-[#ECECEC] bg-gray-50">
                <h3 className="font-bold text-gray-900">{previewResume.name} - Resume</h3>
                <button onClick={() => setPreviewResume(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 bg-gray-100 p-4 sm:p-8 overflow-y-auto">
                <div className="bg-white max-w-3xl mx-auto shadow-sm min-h-full p-8 sm:p-12 text-gray-800">
                  <div className="border-b-2 border-gray-800 pb-6 mb-6">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">{previewResume.name}</h1>
                    <p className="text-gray-600 mt-2 font-medium">{previewResume.email} • {previewResume.phone || '+91 98765 43210'} • {previewResume.location || 'Bangalore, India'}</p>
                  </div>
                  
                  <div className="mb-8">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Professional Summary</h2>
                    <p className="text-sm leading-relaxed text-gray-700 font-medium">
                      {previewResume.summary || "Results-driven professional with a proven track record of delivering high-quality work. Experienced in leading teams and managing complex projects from conception to completion. Adept at problem-solving and optimizing processes to achieve organizational goals."}
                    </p>
                  </div>
                  
                  <div className="mb-8">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Experience</h2>
                    <div className="space-y-6">
                      {previewResume.experience ? previewResume.experience.map((exp, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-gray-900">{exp.company}</h3>
                            <span className="text-sm font-semibold text-gray-500">{exp.duration}</span>
                          </div>
                          {exp.roles && exp.roles.length > 0 ? exp.roles.map((role, r) => (
                            <div key={r} className="mb-3">
                              <p className="text-sm font-bold text-gray-700">{role.title}</p>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{role.description || "Led key initiatives and managed cross-functional teams to deliver impactful solutions."}</p>
                            </div>
                          )) : (
                            <div className="mb-3">
                              <p className="text-sm font-bold text-gray-700">{previewResume.role || previewResume.exp || 'Professional'}</p>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">Successfully executed core responsibilities and exceeded performance targets.</p>
                            </div>
                          )}
                        </div>
                      )) : (
                        <div>
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-gray-900">Tech Solutions Inc.</h3>
                            <span className="text-sm font-semibold text-gray-500">2020 - Present</span>
                          </div>
                          <p className="text-sm font-bold text-gray-700">{previewResume.exp || 'Senior Developer'}</p>
                          <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1 font-medium">
                            <li>Spearheaded the development of a scalable architecture.</li>
                            <li>Mentored junior team members and established best practices for code quality.</li>
                            <li>Collaborated with product managers to define technical roadmaps.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Education</h2>
                    <div className="space-y-4">
                      {previewResume.education ? previewResume.education.map((edu, i) => (
                        <div key={i} className="flex justify-between items-baseline">
                          <div>
                            <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                            <p className="text-sm text-gray-600 font-medium">{edu.institution}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-500">{edu.year}</span>
                        </div>
                      )) : (
                        <div className="flex justify-between items-baseline">
                          <div>
                            <h3 className="font-bold text-gray-900">Bachelor's Degree</h3>
                            <p className="text-sm text-gray-600 font-medium">National Institute of Technology</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-500">2016 - 2020</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidatesTab;
