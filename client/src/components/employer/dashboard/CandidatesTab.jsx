import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DateRangePicker from '../../common/DateRangePicker';
import VideoPlayer from '../../common/VideoPlayer';

const CandidatesTab = ({ portalConfig, candidates: globalCandidates = [], jobs = [], updateCandidateStatus }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialJob = location.state?.jobTitle || 'All Jobs';

  const [selectedJob, setSelectedJob] = useState(initialJob);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [previewCoverLetter, setPreviewCoverLetter] = useState(null);
  const [previewScreeningQA, setPreviewScreeningQA] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const allJobs = ['All Jobs', ...new Set([...jobs.map(j => j.title), ...(initialJob !== 'All Jobs' && initialJob !== 'All Job' ? [initialJob] : [])])];

  const getStatusBadgeStyles = (status) => {
    const map = {
      'new': 'bg-blue-50 text-blue-700 border-blue-200',
      'applied': 'bg-blue-50 text-blue-700 border-blue-200',
      'viewed': 'bg-amber-50 text-amber-700 border-amber-200',
      'under review': 'bg-amber-50 text-amber-700 border-amber-200',
      'shortlisted': 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
      'interview scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
      'technical round': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'hr round': 'bg-pink-50 text-pink-700 border-pink-200',
      'offer sent': 'bg-teal-50 text-teal-700 border-teal-200',
      'hired': 'bg-green-100 text-green-800 border-green-300 font-bold',
      'rejected': 'bg-red-50 text-red-600 border-red-200',
      'withdrawn': 'bg-stone-100 text-stone-600 border-stone-200',
    };
    const key = status?.toLowerCase() || 'new';
    return map[key] || map['new'];
  };

  const statusOptions = ['New', 'Viewed', 'Shortlisted', 'Rejected'];

  // Helper extraction methods
  const getWorkExp = (cand) => {
    if (cand.totalExperience && cand.totalExperience !== 'N/A' && cand.totalExperience !== '') {
      return cand.totalExperience;
    }
    if (cand.isFresher) return 'Fresher';
    if (cand.experience && cand.experience.length > 0) {
      const count = cand.experience.length;
      return `${count} ${count === 1 ? 'Year' : 'Years'}`;
    }
    return 'Fresher';
  };

  const getFunction = (cand) => {
    return cand.industry || cand.professionalDetails?.functionalArea || cand.function || 'N/A';
  };

  const getCurrentDesignation = (cand) => {
    if (cand.designation && cand.designation !== 'N/A' && cand.designation !== '') {
      return cand.designation;
    }
    if (cand.experience && cand.experience.length > 0) {
      const exp = cand.experience[0];
      const title = exp.roles?.[0]?.jobTitle || exp.title || exp.role;
      if (title) return title;
    }
    return cand.isFresher ? 'Fresher' : 'N/A';
  };

  const getCurrentCompany = (cand) => {
    if (cand.experience && cand.experience.length > 0) {
      const comp = cand.experience[0].companyName || cand.experience[0].company;
      if (comp) return comp;
    }
    if (cand.professionalDetails?.currentCompany) {
      return cand.professionalDetails.currentCompany;
    }
    return cand.isFresher ? 'N/A (Fresher)' : 'N/A';
  };

  const getHighestQualification = (cand) => {
    if (cand.education && cand.education.length > 0) {
      const edu = cand.education[0];
      return edu.degree || edu.institution || 'Graduate';
    }
    if (cand.qualifications && cand.qualifications.length > 0) {
      const q = cand.qualifications[0];
      return q.course || q.educationType || q.degree || 'Graduate';
    }
    return 'N/A';
  };

  // Flatten every application into its own individual record
  const flattenedApplications = useMemo(() => {
    const list = [];
    (globalCandidates || []).forEach(cand => {
      const history = cand.history || [];
      if (history.length === 0) {
        list.push({
          appId: cand.id || `app-${cand.email}`,
          jobTitle: cand.appliedJob || 'General Application',
          status: cand.status || 'New',
          statusColor: cand.statusColor || '',
          appliedDate: cand.date || new Date().toLocaleDateString(),
          screeningAnswers: cand.screeningAnswers || [],
          resume: cand.resume || cand.documents?.resume || '',
          coverLetter: cand.coverLetter || cand.documents?.coverLetter || '',
          introVideo: cand.introVideo || cand.documents?.introVideo || '',
          candidate: cand
        });
      } else {
        history.forEach(app => {
          list.push({
            appId: app.appId || `${cand.id}-${app.title}`,
            jobTitle: app.title || 'Unknown Job',
            status: app.status || 'New',
            statusColor: app.color || '',
            appliedDate: app.date || cand.date,
            screeningAnswers: app.screeningAnswers || [],
            resume: app.resume || cand.resume || cand.documents?.resume || '',
            coverLetter: app.coverLetter || cand.coverLetter || cand.documents?.coverLetter || '',
            introVideo: app.introVideo || cand.introVideo || cand.documents?.introVideo || '',
            candidate: cand
          });
        });
      }
    });
    return list;
  }, [globalCandidates]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return flattenedApplications.filter(item => {
      const cand = item.candidate;

      // 1. Job Filter
      if (selectedJob !== 'All Jobs' && selectedJob !== 'All Job') {
        if (item.jobTitle?.trim().toLowerCase() !== selectedJob?.trim().toLowerCase()) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'All') {
        if (item.status?.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Date Filter
      if (dateRange.start || dateRange.end) {
        try {
          const appDate = new Date(item.appliedDate);
          appDate.setHours(0, 0, 0, 0);

          if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            if (appDate < startDate) return false;
          }
          if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (appDate > endDate) return false;
          }
        } catch (e) {
          // ignore date parse errors
        }
      }

      // 4. Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = cand.name?.toLowerCase().includes(q);
        const matchesEmail = cand.email?.toLowerCase().includes(q);
        const matchesPhone = cand.phone?.toLowerCase().includes(q);
        const matchesJob = item.jobTitle?.toLowerCase().includes(q);
        const matchesDesignation = getCurrentDesignation(cand).toLowerCase().includes(q);
        const matchesCompany = getCurrentCompany(cand).toLowerCase().includes(q);
        const matchesQualification = getHighestQualification(cand).toLowerCase().includes(q);
        const matchesFunction = getFunction(cand).toLowerCase().includes(q);

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesJob && !matchesDesignation && !matchesCompany && !matchesQualification && !matchesFunction) {
          return false;
        }
      }

      return true;
    });
  }, [flattenedApplications, selectedJob, statusFilter, dateRange, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage) || 1;
  const paginatedApplications = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredApplications, currentPage, itemsPerPage]);

  const clearFilters = () => {
    setSelectedJob('All Jobs');
    setStatusFilter('All');
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = (selectedJob !== 'All Jobs' && selectedJob !== 'All Job') || statusFilter !== 'All' || dateRange.start || dateRange.end || searchQuery;

  // Status breakdown metrics
  const stats = useMemo(() => {
    const total = filteredApplications.length;
    const newCount = filteredApplications.filter(a => (a.status || 'New').toLowerCase() === 'new').length;
    const shortlistedCount = filteredApplications.filter(a => (a.status || '').toLowerCase() === 'shortlisted').length;
    const viewedCount = filteredApplications.filter(a => (a.status || '').toLowerCase() === 'viewed').length;
    const rejectedCount = filteredApplications.filter(a => (a.status || '').toLowerCase() === 'rejected').length;
    return { total, newCount, shortlistedCount, viewedCount, rejectedCount };
  }, [filteredApplications]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {selectedJob === 'All Jobs' || selectedJob === 'All Job' ? (portalConfig?.title || 'Job Applications') : selectedJob}
            </h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-full border border-emerald-200">
              {filteredApplications.length} {filteredApplications.length === 1 ? 'Application' : 'Applications'}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {selectedJob !== 'All Jobs' && selectedJob !== 'All Job'
              ? `Direct tabular overview of all received applications for ${selectedJob}.`
              : (portalConfig?.subtitle || 'Direct overview of all candidate applications across all jobs.')}
          </p>
        </div>

        {/* Quick Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => { setStatusFilter('All'); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${statusFilter === 'All' ? 'bg-gray-900 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All: {stats.total}
          </button>
          <button 
            onClick={() => { setStatusFilter('New'); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${statusFilter === 'New' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          >
            New: {stats.newCount}
          </button>
          <button 
            onClick={() => { setStatusFilter('Shortlisted'); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${statusFilter === 'Shortlisted' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            Shortlisted: {stats.shortlistedCount}
          </button>
          <button 
            onClick={() => { setStatusFilter('Viewed'); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${statusFilter === 'Viewed' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          >
            Viewed: {stats.viewedCount}
          </button>
          <button 
            onClick={() => { setStatusFilter('Rejected'); setCurrentPage(1); }} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${statusFilter === 'Rejected' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
          >
            Rejected: {stats.rejectedCount}
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={portalConfig?.searchPlaceholder || "Search by candidate name, email, designation, company, qualification..."} 
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder-gray-400 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Job Filter */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 h-[40px] relative">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-2 shrink-0">Job:</span>
            <select 
              className="bg-transparent border-none text-xs font-bold text-gray-800 focus:ring-0 cursor-pointer outline-none appearance-none pr-6 max-w-[180px] truncate"
              value={selectedJob}
              onChange={(e) => { setSelectedJob(e.target.value); setCurrentPage(1); }}
            >
              {allJobs.map(job => <option key={job} value={job}>{job}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="w-[230px]">
            <DateRangePicker 
              dateRange={dateRange}
              onRangeChange={(dr) => { setDateRange(dr); setCurrentPage(1); }}
              className="h-[40px]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 h-[40px] relative">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-2 shrink-0">Status:</span>
            <select 
              className="bg-transparent border-none text-xs font-bold text-gray-800 focus:ring-0 cursor-pointer outline-none appearance-none pr-6"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Statuses</option>
              {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Applications Table (Clean, Direct, Full Columns) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-200 text-gray-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No applications found</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm">No candidate application records match the selected job, status, or search filters.</p>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters} 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-gray-700 font-black uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-4 whitespace-nowrap">Candidate</th>
                  <th className="py-4 px-4 whitespace-nowrap">Job Applied</th>
                  <th className="py-4 px-4 whitespace-nowrap">Work Exp</th>
                  <th className="py-4 px-4 whitespace-nowrap">Function</th>
                  <th className="py-4 px-4 whitespace-nowrap">Current Designation</th>
                  <th className="py-4 px-4 whitespace-nowrap">Current Company</th>
                  <th className="py-4 px-4 whitespace-nowrap">Primary Qualification</th>
                  <th className="py-4 px-4 whitespace-nowrap">Applied Date</th>
                  <th className="py-4 px-4 whitespace-nowrap text-center">Status</th>
                  <th className="py-4 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedApplications.map((item, idx) => {
                  const cand = item.candidate;
                  const workExp = getWorkExp(cand);
                  const func = getFunction(cand);
                  const desig = getCurrentDesignation(cand);
                  const comp = getCurrentCompany(cand);
                  const qual = getHighestQualification(cand);

                  return (
                    <tr 
                      key={item.appId || idx} 
                      className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedCandidate(cand);
                        setSelectedApplication(item);
                      }}
                    >
                      {/* 1. Candidate Name, Email & Avatar */}
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs ${cand.bg || 'bg-emerald-600'}`}>
                            {cand.initials || (cand.name ? cand.name.charAt(0).toUpperCase() : 'C')}
                          </div>
                          <div className="min-w-[140px]">
                            <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors text-[13px] leading-tight">
                              {cand.name}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{cand.email}</p>
                            {cand.phone && (
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{cand.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Job Applied */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="font-bold text-gray-900 text-xs">
                            {item.jobTitle}
                          </span>
                        </div>
                      </td>

                      {/* 3. Work Exp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block whitespace-nowrap ${workExp === 'Fresher' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-800 border border-gray-200/60'}`}>
                          {workExp}
                        </span>
                      </td>

                      {/* 4. Function */}
                      <td className="py-3.5 px-4 text-gray-700 font-medium whitespace-nowrap">
                        {func}
                      </td>

                      {/* 5. Current Designation */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {desig}
                      </td>

                      {/* 6. Current Company */}
                      <td className="py-3.5 px-4 text-gray-700 font-medium whitespace-nowrap">
                        {comp}
                      </td>

                      {/* 7. Primary Qualification */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200/60 inline-block">
                          {qual}
                        </span>
                      </td>

                      {/* 8. Applied Date */}
                      <td className="py-3.5 px-4 text-gray-500 text-xs font-medium whitespace-nowrap">
                        {item.appliedDate}
                      </td>

                      {/* 9. Status (Dropdown) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select 
                          className={`appearance-none cursor-pointer outline-none transition-all px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-2xs ${getStatusBadgeStyles(item.status)}`}
                          value={item.status || 'New'}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (updateCandidateStatus) {
                              updateCandidateStatus(item.appId, newStatus);
                            }
                            item.status = newStatus;
                            if (cand.history) {
                              cand.history = cand.history.map(h => h.appId === item.appId ? { ...h, status: newStatus } : h);
                            }
                          }}
                        >
                          {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Screening Q&A icon */}
                          {item.screeningAnswers && item.screeningAnswers.length > 0 && (
                            <button 
                              onClick={() => setPreviewScreeningQA({ candidateName: cand.name, jobTitle: item.jobTitle, answers: item.screeningAnswers })}
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                              title={`View ${item.screeningAnswers.length} Screening Answers`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}

                          {/* View Profile Drawer */}
                          <button 
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setSelectedApplication(item);
                            }}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="View Full Profile Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Resume Preview */}
                          <button 
                            onClick={() => {
                              const resUrl = item.resume || cand.resume || cand.documents?.resume;
                              if (resUrl && resUrl.startsWith('http')) {
                                window.open(resUrl, '_blank');
                              } else {
                                setPreviewResume(cand);
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Resume"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>

                          {/* Message */}
                          <button 
                            onClick={() => {
                              navigate('/employer/messages', { state: { initialEmployee: cand } });
                            }}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Chat / Message"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Real Working Pagination */}
        {filteredApplications.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredApplications.length)}</span> of{' '}
              <span className="font-bold text-gray-800">{filteredApplications.length}</span> application{filteredApplications.length === 1 ? '' : 's'}
            </p>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-all text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-all text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Profile Slide-over Drawer */}
      {selectedCandidate && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 animate-in fade-in duration-200"
            onClick={() => { setSelectedCandidate(null); setSelectedApplication(null); }}
          ></div>
          <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] bg-white shadow-2xl z-50 p-6 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full border-l border-gray-200 font-sans">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-start mb-6 shrink-0 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                  Candidate Profile
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg mt-1">
                  {selectedApplication ? selectedApplication.jobTitle : selectedCandidate.name}
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedCandidate(null); setSelectedApplication(null); }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center bg-gray-50/70 p-6 rounded-2xl border border-gray-100">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-3 shadow-xs ring-4 ring-white ${selectedCandidate.bg || 'bg-emerald-600'}`}>
                  {selectedCandidate.initials || (selectedCandidate.name ? selectedCandidate.name.charAt(0).toUpperCase() : 'C')}
                </div>
                <h2 className="text-lg font-black text-gray-900">{selectedCandidate.name}</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedCandidate.email}</p>
                <p className="text-xs font-semibold text-gray-400 mt-1">
                  {selectedCandidate.phone || 'Phone not provided'} • {selectedCandidate.location || 'Location not specified'}
                </p>

                {/* Status selector inside drawer */}
                {selectedApplication && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Status:</span>
                    <select 
                      className={`appearance-none cursor-pointer outline-none transition-all px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-2xs ${getStatusBadgeStyles(selectedApplication.status)}`}
                      value={selectedApplication.status || 'New'}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        if (updateCandidateStatus) {
                          updateCandidateStatus(selectedApplication.appId, newStatus);
                        }
                        selectedApplication.status = newStatus;
                        setSelectedApplication({ ...selectedApplication, status: newStatus });
                      }}
                    >
                      {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Grid of Key Candidate Attributes */}
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-gray-200/80">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Work Experience</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getWorkExp(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Function / Industry</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getFunction(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Designation</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getCurrentDesignation(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Company</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getCurrentCompany(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Highest Qualification</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getHighestQualification(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Applied Date</h4>
                  <p className="text-xs font-extrabold text-gray-900">{selectedApplication?.appliedDate || selectedCandidate.date}</p>
                </div>
              </div>

              {/* Screening Questions Section */}
              {selectedApplication && selectedApplication.screeningAnswers && selectedApplication.screeningAnswers.length > 0 && (
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-3">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Screening Questions & Answers ({selectedApplication.screeningAnswers.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedApplication.screeningAnswers.map((item, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <p className="text-xs font-bold text-gray-900 mb-1">Q{idx + 1}. {item.question}</p>
                        <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg font-medium">
                          {item.answer || <span className="italic text-gray-400">No answer provided</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Player */}
              {(selectedApplication?.introVideo || selectedCandidate.introVideo || selectedCandidate.documents?.introVideo) && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Introductory Video</h4>
                  <VideoPlayer url={selectedApplication?.introVideo || selectedCandidate.introVideo || selectedCandidate.documents?.introVideo} maxPlayerHeight="200px" />
                </div>
              )}

              {/* Resume & Documents */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3">Documents</h4>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Resume / CV Document</p>
                      <p className="text-[10px] text-gray-500">Applicant CV File</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const resUrl = selectedApplication?.resume || selectedCandidate.resume || selectedCandidate.documents?.resume;
                        if (resUrl && resUrl.startsWith('http')) {
                          window.open(resUrl, '_blank');
                        } else {
                          setPreviewResume(selectedCandidate);
                        }
                      }}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              {selectedCandidate.summary && (
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Summary</h4>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedCandidate.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.skills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button 
                onClick={() => {
                  navigate('/employer/messages', { state: { initialEmployee: selectedCandidate } });
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Message / Chat with Candidate</span>
              </button>
            </div>

          </div>
        </>
      )}

      {/* Screening Q&A Quick Modal */}
      {previewScreeningQA && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">
                  Screening Questions - {previewScreeningQA.candidateName}
                </h3>
                <p className="text-[11px] text-gray-500">{previewScreeningQA.jobTitle}</p>
              </div>
              <button 
                onClick={() => setPreviewScreeningQA(null)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {previewScreeningQA.answers.map((qa, i) => (
                <div key={i} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                  <p className="text-xs font-bold text-gray-900 mb-1.5">Q{i + 1}. {qa.question}</p>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-xs text-gray-800 font-medium">
                    {qa.answer || <span className="italic text-gray-400">No answer provided</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resume Preview Modal */}
      {previewResume && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">{previewResume.name} - Resume</h3>
              <button onClick={() => setPreviewResume(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                ✕
              </button>
            </div>
            <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
              <div className="bg-white max-w-3xl mx-auto shadow-sm min-h-full p-8 rounded-xl text-gray-800 space-y-6">
                <div className="border-b-2 border-gray-800 pb-4">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{previewResume.name}</h1>
                  <p className="text-gray-600 mt-1 text-xs font-semibold">{previewResume.email} • {previewResume.phone || '+91 98765 43210'} • {previewResume.location || 'Location'}</p>
                </div>
                
                {previewResume.summary && (
                  <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Professional Summary</h2>
                    <p className="text-xs leading-relaxed text-gray-700 font-medium">{previewResume.summary}</p>
                  </div>
                )}
                
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Work Experience</h2>
                  <p className="text-xs text-gray-700">{getWorkExp(previewResume)} • {getCurrentDesignation(previewResume)} at {getCurrentCompany(previewResume)}</p>
                </div>
                
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Qualification</h2>
                  <p className="text-xs text-gray-700">{getHighestQualification(previewResume)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CandidatesTab;
