import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import JobApplicationModal from './JobApplicationModal';
import EmployeeNavbar from '../common/EmployeeNavbar';
import CustomDropdown from '../common/CustomDropdown';

const EmployeeHomepage = ({ jobs = [], applyToJob }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState(location.state?.selectedJobId || (jobs.length > 0 ? jobs[0].id : null));
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [showToast, setShowToast] = useState(location.state?.profileCreated || location.state?.loggedIn || false);
  const [toastType, setToastType] = useState(location.state?.profileCreated ? 'created' : (location.state?.loggedIn ? 'login' : ''));
  const [toastName, setToastName] = useState('');
  
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const mobileSearchRef = React.useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setShowMobileSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeJobs = jobs.filter(job => job.status !== 'Closed');

  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    experience: 'All',
    postingDate: 'Any time'
  });

  let displayedJobs = activeJobs;

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    displayedJobs = displayedJobs.filter(job => 
      job.title.toLowerCase().includes(kw) || 
      job.company.toLowerCase().includes(kw) ||
      (job.details?.skillsRequired || '').toLowerCase().includes(kw)
    );
  }

  if (filters.location) {
    const loc = filters.location.toLowerCase();
    displayedJobs = displayedJobs.filter(job => 
      job.location.toLowerCase().includes(loc) || 
      (job.details?.workLocation || '').toLowerCase().includes(loc)
    );
  }

  if (filters.experience !== 'All') {
    displayedJobs = displayedJobs.filter(job => 
      job.details?.experience && job.details.experience.includes(filters.experience)
    );
  }

  if (filters.postingDate !== 'Any time') {
    const now = new Date();
    let timeLimit = new Date();
    if (filters.postingDate === 'Past 24 hours') timeLimit.setDate(now.getDate() - 1);
    if (filters.postingDate === 'Past week') timeLimit.setDate(now.getDate() - 7);
    if (filters.postingDate === 'Past month') timeLimit.setMonth(now.getMonth() - 1);
    
    displayedJobs = displayedJobs.filter(job => job.createdAt && new Date(job.createdAt) >= timeLimit);
  }

  const filteredMobileJobs = mobileSearchTerm 
    ? activeJobs.filter(job => job.title.toLowerCase().includes(mobileSearchTerm.toLowerCase()) || job.company.toLowerCase().includes(mobileSearchTerm.toLowerCase()))
    : [];

  useEffect(() => {
    if (showToast) {
      const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      setToastName(profile.firstName || 'User');
      
      const timer = setTimeout(() => {
        setShowToast(false);
        // Clean up state so refresh doesn't show it again
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast, navigate, location.pathname]);
  
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('savedJobs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleSaveJob = (jobId, e) => {
    if (e) e.stopPropagation();
    setSavedJobs(prev => {
      const newSaved = prev.includes(jobId) 
        ? prev.filter(id => id !== jobId) 
        : [...prev, jobId];
      localStorage.setItem('savedJobs', JSON.stringify(newSaved));
      return newSaved;
    });
  };



  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Navbar */}
      <EmployeeNavbar jobs={jobs} />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="relative overflow-hidden bg-[#b8ecc6] rounded-[20px] shadow-lg w-[380px] p-4 flex items-center gap-4 border border-[#a8e2b8]">
            {/* Background Blobs */}
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-[#9be2ae] rounded-full mix-blend-multiply opacity-60"></div>
            <div className="absolute -left-2 -top-4 w-16 h-16 bg-[#8ddc9f] rounded-full mix-blend-multiply opacity-50"></div>
            <div className="absolute top-2 right-12 w-20 h-20 bg-[#c7f4d2] rounded-full mix-blend-multiply opacity-70"></div>
            
            {/* Content */}
            <div className="relative z-10 w-11 h-11 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-[#299555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="relative z-10 flex-1">
              <h4 className="text-[#153a23] font-extrabold text-[15px] leading-tight mb-1">
                {toastType === 'login' ? `Welcome back, ${toastName}!` : `Hyy ${toastName}, your account created`}
              </h4>
              <p className="text-[#2b6542] text-xs font-semibold">
                {toastType === 'login' ? "We're glad to see you again." : "Welcome to your new employee profile!"}
              </p>
            </div>
            
            <button onClick={() => setShowToast(false)} className="relative z-10 shrink-0 text-[#2b6542] hover:text-[#153a23] transition-colors self-start mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex md:gap-6 items-start min-h-[calc(100vh-100px)]">
        
        {/* Left Column (Job List) */}
        <div className={`w-full md:w-[400px] flex-shrink-0 flex-col gap-3 pb-24 md:pb-0 ${isMobileDetailsOpen ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Mobile Search Bar */}
          <div className="md:hidden flex flex-col gap-2 mb-2">
            <div className="relative" ref={mobileSearchRef}>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="Job title, keywords..." 
                  value={mobileSearchTerm}
                  onChange={(e) => {
                    setMobileSearchTerm(e.target.value);
                    setShowMobileSuggestions(true);
                  }}
                  onFocus={() => setShowMobileSuggestions(true)}
                  className="w-full bg-transparent border-none outline-none text-sm text-gray-900" 
                />
              </div>
              {showMobileSuggestions && mobileSearchTerm && (
                <div className="absolute top-[110%] left-0 w-full bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] max-h-64 overflow-y-auto">
                  {filteredMobileJobs.length > 0 ? filteredMobileJobs.slice(0, 5).map(job => (
                    <div key={job.id} onClick={() => { setMobileSearchTerm(job.title); setShowMobileSuggestions(false); }} className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600 text-xs shrink-0">
                        {job.companyInitial}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{job.title}</div>
                        <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">No jobs found</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500">
              <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input 
                type="text" 
                placeholder="City, state, or country..." 
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full bg-transparent border-none outline-none text-sm text-gray-900" 
              />
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 shadow-sm">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Filters
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Keyword</label>
                <input 
                  type="text" 
                  value={filters.keyword}
                  onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                  placeholder="Job title, company, skill"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Experience</label>
                <CustomDropdown
                  value={filters.experience}
                  onChange={(val) => setFilters({...filters, experience: val})}
                  options={[
                    { label: 'Any Experience', value: 'All' },
                    { label: '0 - 1 Yrs', value: '0 - 1 Yrs' },
                    { label: '2 - 3 Yrs', value: '2 - 3 Yrs' },
                    { label: '4 - 6 Yrs', value: '4 - 6 Yrs' },
                    { label: '7 - 10 Yrs', value: '7 - 10 Yrs' },
                    { label: '11 - 15 Yrs', value: '11 - 15 Yrs' },
                    { label: '16 - 20 Yrs', value: '16 - 20 Yrs' },
                    { label: '21 - 25 Yrs', value: '21 - 25 Yrs' },
                    { label: '25+ yrs', value: '25+ yrs' }
                  ]}
                  placeholder="Select experience"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date Posted</label>
                <CustomDropdown
                  value={filters.postingDate}
                  onChange={(val) => setFilters({...filters, postingDate: val})}
                  options={[
                    { label: 'Any time', value: 'Any time' },
                    { label: 'Past 24 hours', value: 'Past 24 hours' },
                    { label: 'Past week', value: 'Past week' },
                    { label: 'Past month', value: 'Past month' }
                  ]}
                  placeholder="Select posting date"
                />
              </div>
            </div>
          </div>

          {displayedJobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => { setSelectedJobId(job.id); setIsMobileDetailsOpen(true); }}
              className={`p-4 bg-white border rounded-xl cursor-pointer transition-all ${
                selectedJobId === job.id ? 'border-green-600 shadow-md' : 'border-gray-200 hover:shadow-sm hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded font-bold text-gray-600 flex items-center justify-center text-xs">
                    {job.companyInitial}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      {job.company} {job.rating && <span className="text-xs text-gray-500">{job.rating}★</span>}
                    </h4>
                    <h3 className="text-base font-bold text-gray-900 leading-snug mt-0.5">{job.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{job.location} • {job.details.workLocation}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">
                      {job.salary} {job.employerProvided && <span className="text-gray-500 font-normal">(Employer provided)</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-full min-h-[80px]">
                  <button 
                    onClick={(e) => toggleSaveJob(job.id, e)} 
                    className={`transition-colors ${savedJobs.includes(job.id) ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {savedJobs.includes(job.id) ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    )}
                  </button>
                  <span className="text-xs text-gray-400 font-medium">{job.postedAt}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                {job.status === 'Closed' ? (
                  <span className="w-full inline-flex justify-center items-center px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">
                    Closed
                  </span>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedJobId(job.id); setIsApplicationModalOpen(true); }}
                    className="w-full inline-flex justify-center items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-bold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    Apply now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column (Job Details) */}
        {selectedJob && (
          <div className={`flex-1 w-full bg-white border border-gray-200 rounded-xl sticky top-24 h-[calc(100vh-120px)] overflow-hidden flex-col ${!isMobileDetailsOpen ? 'hidden md:flex' : 'flex'}`}>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col pb-24 md:pb-0">
              {/* Mobile Back Button */}
              <div className="p-4 border-b border-gray-200 md:hidden flex items-center bg-gray-50 sticky top-0 z-10">
                <button onClick={() => setIsMobileDetailsOpen(false)} className="text-gray-500 hover:text-gray-900 font-semibold text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Back to jobs
                </button>
              </div>

              <div className="p-6 border-b border-gray-200">
                {/* DESKTOP HEADER */}
                <div className="hidden md:block">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded font-bold text-gray-600 flex items-center justify-center text-lg">
                        {selectedJob.companyInitial}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{selectedJob.company}</h2>
                      </div>
                    </div>
                    <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    </button>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h1>
                  
                  <div className="flex items-center gap-3 mb-6 text-sm">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">{selectedJob.location}</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">{selectedJob.details.workLocation}</span>
                    <span className="text-gray-900 font-semibold">
                      {selectedJob.salary} {selectedJob.employerProvided && <span className="text-gray-500 font-normal">(Employer provided)</span>}
                    </span>
                  </div>

                  {/* DESKTOP ONLY Inline Buttons */}
                  <div className="flex gap-3">
                    {selectedJob.status === 'Closed' ? (
                      <button 
                        disabled
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-gray-500 rounded-lg font-bold cursor-not-allowed"
                      >
                        Closed
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsApplicationModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        Apply
                      </button>
                    )}
                    <button 
                      onClick={() => toggleSaveJob(selectedJobId)}
                      className={`px-3 py-2.5 border rounded-lg transition-colors ${savedJobs.includes(selectedJobId) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {savedJobs.includes(selectedJobId) ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* MOBILE HEADER */}
                <div className="md:hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg font-bold text-gray-800 flex items-center justify-center text-xl">
                        {selectedJob.companyInitial}
                      </div>
                      <div>
                        <h2 className="text-xl font-medium text-gray-900">{selectedJob.company}</h2>
                      </div>
                    </div>
                    <button className="w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M6 12c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm6-2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    </button>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedJob.title}</h1>
                  
                  <div className="flex flex-col gap-3 mb-4 w-full">
                    <div className="flex gap-2 text-sm w-full">
                      <div className="bg-gray-50 text-gray-800 px-3 py-2 rounded-md font-medium flex-1 text-center flex items-center justify-center">
                        {selectedJob.location}
                      </div>
                      <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md font-medium flex-1 text-center flex items-center justify-center">
                        {selectedJob.details.workLocation}
                      </div>
                    </div>
                    <div className="flex flex-col text-sm w-full">
                      <span className="text-gray-900 font-semibold text-base">{selectedJob.salary}</span>
                      {selectedJob.employerProvided && <span className="text-gray-500 font-normal text-xs mt-0.5">(Employer provided)</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Your qualifications for this job</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                  {selectedJob.qualifications.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      {q.met ? (
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      )}
                      {q.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                  {selectedJob.details.employmentType && <p><strong>Employment Type:</strong> {selectedJob.details.employmentType}</p>}
                  {selectedJob.details.experience && <p><strong>Experience:</strong> {selectedJob.details.experience}</p>}
                  {selectedJob.details.aboutRole && <p><strong>About Role:</strong> {selectedJob.details.aboutRole}</p>}
                  {selectedJob.details.responsibilities && <p><strong>Responsibilities:</strong> {selectedJob.details.responsibilities}</p>}
                  {selectedJob.details.qualification && <p><strong>Qualification:</strong> {selectedJob.details.qualification}</p>}
                  {selectedJob.details.stream && <p><strong>Stream:</strong> {selectedJob.details.stream}</p>}
                  {selectedJob.details.jobCategory && <p><strong>Job Category:</strong> {selectedJob.details.jobCategory}</p>}
                </div>

                {/* MOBILE ONLY Save Button at bottom of scroll */}
                <div className="mt-8 md:hidden">
                  <button 
                    onClick={() => toggleSaveJob(selectedJobId)}
                    className={`w-full py-3 rounded-lg font-bold transition-colors text-base flex items-center justify-center gap-2 ${savedJobs.includes(selectedJobId) ? 'border border-blue-600 bg-blue-50 text-blue-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-transparent'}`}
                  >
                    {savedJobs.includes(selectedJobId) ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    )}
                    {savedJobs.includes(selectedJobId) ? 'Saved' : 'Save job'}
                  </button>
                </div>
              </div>
            </div>

            {/* MOBILE ONLY Sticky Bottom Apply Button */}
            {!isApplicationModalOpen && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-8px_15px_rgba(0,0,0,0.08)] md:hidden z-50">
                {selectedJob.status === 'Closed' ? (
                  <button 
                    disabled
                    className="w-full py-3 bg-gray-200 text-gray-500 rounded-lg font-bold cursor-not-allowed shadow-sm"
                  >
                    Closed
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsApplicationModalOpen(true)}
                    className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold transition-colors text-base shadow-sm"
                  >
                    Apply now
                  </button>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      <JobApplicationModal 
        isOpen={isApplicationModalOpen} 
        onClose={() => setIsApplicationModalOpen(false)} 
        job={selectedJob}
        applyToJob={applyToJob}
      />
    </div>
  );
};

export default EmployeeHomepage;
