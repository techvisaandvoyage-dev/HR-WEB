import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import EmployeeHomepage from './components/employee/EmployeeHomepage';
import EmployeeProfile from './components/employee/EmployeeProfile';
import EmployeeLoginModal from './components/employee/EmployeeLoginModal';
import EmployeeRegisterModal from './components/employee/EmployeeRegisterModal';
import EmployeeOnboarding from './components/employee/EmployeeOnboarding';
import EmployerLoginModal from './components/employer/EmployerLoginModal';
import EmployerRegisterModal from './components/employer/EmployerRegisterModal';
import MyJobs from './components/employee/myjobs/MyJobs';
import EmployeeMessages from './components/employee/messages/EmployeeMessages';
import EmployerDashboard from './components/employer/dashboard/EmployerDashboard';
import LocationAutocomplete from './components/common/LocationAutocomplete';
import { dummyJobs } from './data/dummyJobs';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('employeeToken') || !!localStorage.getItem('employerToken'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(() => {
    const isEmployerRoute = window.location.pathname.startsWith('/employer');
    if (isEmployerRoute && localStorage.getItem('employerToken')) return 'employer';
    if (!isEmployerRoute && localStorage.getItem('employeeToken')) return 'employee';
    // Fallbacks
    if (localStorage.getItem('employerToken')) return 'employer';
    if (localStorage.getItem('employeeToken')) return 'employee';
    return null;
  });
  const [searchJobTitle, setSearchJobTitle] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = React.useRef(null);
  const [searchLocation, setSearchLocation] = useState('');

  React.useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, []);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const location = useLocation();

  useEffect(() => {
    const isEmployerRoute = location.pathname.startsWith('/employer');
    if (isEmployerRoute && localStorage.getItem('employerToken')) {
      setUserRole('employer');
    } else if (!isEmployerRoute && localStorage.getItem('employeeToken')) {
      setUserRole('employee');
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userRole === 'employer') {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/jobs`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
          });
          const data = await res.json();
          if (data.success) {
            setJobs(data.data.map(job => ({ ...job, id: job._id })));
          }
          
          const appRes = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/jobs/applications`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
          });
          const appData = await appRes.json();
          if (appData.success) {
            const candidatesMap = {};
            
            appData.data.forEach(app => {
              try {
                const emp = app.employeeId;
                if (!emp || !app.jobId) return;
                if (!candidatesMap[emp._id]) {
                  candidatesMap[emp._id] = {
                    id: emp._id,
                    name: emp.name || 'Unknown Candidate',
                    email: emp.email,
                    phone: emp.mobile,
                    location: emp.location,
                    initials: emp.name ? emp.name.charAt(0).toUpperCase() : 'C',
                    bg: 'bg-green-600',
                    date: new Date(app.createdAt).toLocaleDateString(),
                    history: [],
                    // Additional profile data for the Candidate Profile sidebar
                    summary: emp.brief || (emp.professionalDetails && emp.professionalDetails.majorAchievements) || '',
                    skills: (emp.professionalDetails && emp.professionalDetails.skills) ? emp.professionalDetails.skills.split(',').map(s => s.trim()) : [],
                    experience: emp.experience || [],
                    education: (emp.qualifications || []).map(q => ({
                      degree: q.course || q.educationType || 'Degree',
                      year: (q.startYear && q.endYear) ? `${q.startYear} - ${q.endYear}` : (q.endYear || 'Year'),
                      institution: q.university || q.board || 'Institution'
                    })),
                    currentCTC: (emp.professionalDetails && emp.professionalDetails.currentSalary) || 'N/A',
                    expectedCTC: (emp.professionalDetails && emp.professionalDetails.expectedSalary) || 'N/A',
                  };
                }
                
                candidatesMap[emp._id].history.push({
                  appId: app._id,
                  title: app.jobId?.title || 'Unknown Job',
                  status: app.status,
                  color: app.statusColor,
                  date: new Date(app.createdAt).toLocaleDateString()
                });
                
                // Update last active date to most recent application
                if (new Date(app.createdAt) > new Date(candidatesMap[emp._id].date)) {
                  candidatesMap[emp._id].date = new Date(app.createdAt).toLocaleDateString();
                }
              } catch (err) {
                console.error("Error processing application:", app, err);
              }
            });
            
            setCandidates(Object.values(candidatesMap));
          }
        } else {
          // Employee or Public
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs`);
          const data = await res.json();
          if (data.success) {
            setJobs(data.data.map(job => ({ ...job, id: job._id })));
          }
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      }
    };
    fetchData();
  }, [userRole, isLoggedIn]);

  const addJob = (newJob) => {
    setJobs(prev => [newJob, ...prev]);
  };

  const toggleJobStatus = async (jobId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prevJobs => prevJobs.map(job => 
          job.id === jobId ? { ...job, status: data.data.status, statusColor: data.data.statusColor } : job
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const applyToJob = async (jobId, candidateData) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`
        },
        body: JSON.stringify(candidateData)
      });
      const data = await res.json();
      if (data.success) {
        // Optimistically increment application count in jobs
        setJobs(prevJobs => prevJobs.map(job => 
          job.id === jobId ? { ...job, applications: (job.applications || 0) + 1 } : job
        ));
        return true;
      } else {
        alert(data.message);
        return false;
      }
    } catch (e) {
      console.error(e);
      alert("Failed to apply for job.");
      return false;
    }
  };

  const updateCandidateStatus = async (appId, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/jobs/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('employerToken')}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (data.success) {
        setCandidates(prev => prev.map(c => {
          const updatedHistory = c.history.map(h => 
            h.appId === appId ? { ...h, status: data.data.status, color: data.data.statusColor } : h
          );
          return { ...c, history: updatedHistory };
        }));
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update status.");
    }
  };



  const [isEmployeeLoginOpen, setIsEmployeeLoginOpen] = useState(false);
  const [isEmployeeRegisterOpen, setIsEmployeeRegisterOpen] = useState(false);
  const [isEmployerLoginOpen, setIsEmployerLoginOpen] = useState(false);
  const [isEmployerRegisterOpen, setIsEmployerRegisterOpen] = useState(false);
  const navigate = useNavigate();

  const openRegister = () => {
    setIsEmployeeLoginOpen(false);
    setIsEmployeeRegisterOpen(true);
  };

  const openLogin = () => {
    setIsEmployeeRegisterOpen(false);
    setIsEmployeeLoginOpen(true);
  };

  const openEmployerRegister = () => {
    setIsEmployerLoginOpen(false);
    setIsEmployerRegisterOpen(true);
  };

  const openEmployerLogin = () => {
    setIsEmployerRegisterOpen(false);
    setIsEmployerLoginOpen(true);
  };

  const handleEmployeeLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setUserRole('employee');
    setIsEmployeeLoginOpen(false);
    setIsEmployeeRegisterOpen(false);
    if (data?.isNewUser) {
      navigate('/employee/onboarding');
    } else {
      navigate('/employee', { state: { loggedIn: true } });
    }
  };

  const handleEmployerLoginSuccess = () => {
    setIsLoggedIn(true);
    setUserRole('employer');
    setIsEmployerLoginOpen(false);
    setIsEmployerRegisterOpen(false);
    navigate('/employer');
  };

  const filteredHomepageJobs = jobs.filter(job => {
    const matchTitle = !searchJobTitle || job.title.toLowerCase().includes(searchJobTitle.toLowerCase()) || job.company.toLowerCase().includes(searchJobTitle.toLowerCase());
    const matchLocation = !searchLocation || job.location.toLowerCase().includes(searchLocation.split(',')[0].trim().toLowerCase());
    return matchTitle && matchLocation;
  });

  return (
    <>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-white font-sans text-palette-900 flex flex-col selection:bg-palette-200 selection:text-palette-900">
            {/* Navbar */}
      <nav className="w-full px-6 py-4 md:px-8 md:py-6 flex justify-between md:justify-end items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-palette-100 shadow-sm">
        {/* Mobile Logo */}
        <div className="text-2xl font-black text-palette-900 md:hidden">
          DreamJob
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => setIsEmployeeLoginOpen(true)}
            className="px-6 py-2.5 rounded-full font-medium text-palette-900 hover:text-white hover:bg-palette-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-palette-200 focus:outline-none focus:ring-2 focus:ring-palette-400 focus:ring-offset-2"
          >
            Employee Login
          </button>
          <button 
            onClick={() => setIsEmployerLoginOpen(true)}
            className="px-6 py-2.5 rounded-full font-medium bg-palette-900 text-white hover:bg-palette-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-palette-200 focus:outline-none focus:ring-2 focus:ring-palette-900 focus:ring-offset-2"
          >
            Employer Login
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-palette-900 focus:outline-none"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {/* Mobile Menu Dropdown */}
        <div 
          className={`md:hidden bg-white border-b border-palette-100 absolute top-full left-0 w-full z-40 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 border-transparent'
          }`}
        >
          <div className="flex flex-col p-6 gap-4">
            <button 
              onClick={() => { setIsMobileMenuOpen(false); setIsEmployeeLoginOpen(true); }}
              className="w-full px-6 py-3 rounded-xl font-bold text-palette-900 bg-palette-100/50 hover:bg-palette-100 transition-colors"
            >
              Employee Login
            </button>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); setIsEmployerLoginOpen(true); }}
              className="w-full px-6 py-3 rounded-xl font-bold bg-palette-900 text-white hover:bg-palette-800 transition-colors"
            >
              Employer Login
            </button>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center p-6 relative w-full overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-palette-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-palette-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-palette-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        {/* Hero Section */}
        <div className="w-full max-w-4xl relative z-30 flex flex-col items-center text-center space-y-12 min-h-[45vh] justify-center mb-6 mt-8">
          <div className="space-y-4 px-4">
            <h1 className="text-4xl md:text-7xl font-roboto font-black tracking-tight text-palette-900 leading-tight">
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-palette-400 to-palette-900">Dream Job</span>
            </h1>
            <p className="text-lg md:text-xl text-palette-900/70 font-medium max-w-2xl mx-auto">
              Discover opportunities that align with your passion and expertise.
            </p>
          </div>

          <div className="w-full max-w-4xl bg-white p-2 md:p-3 rounded-3xl md:rounded-full shadow-2xl shadow-palette-200/50 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 border border-palette-100 transition-all duration-500 z-20 relative">
            <div className="flex-1 w-full flex items-center px-4 md:px-6 py-3 bg-palette-100/30 rounded-2xl md:rounded-full border-b md:border-b-0 md:border-r border-palette-100/50 relative" ref={searchRef}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-palette-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                value={searchJobTitle}
                onChange={(e) => {
                  setSearchJobTitle(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Job title, keywords..." 
                className="w-full bg-transparent border-none outline-none px-3 md:px-4 text-palette-900 placeholder-palette-900/40 text-base md:text-lg font-medium"
              />
              {showSuggestions && searchJobTitle && (
                <div className="absolute top-[110%] left-0 w-[120%] bg-white rounded-2xl shadow-xl border border-palette-100 py-2 z-[100] max-h-64 overflow-y-auto text-left">
                  {filteredHomepageJobs.length > 0 ? filteredHomepageJobs.slice(0, 5).map(job => (
                    <div key={job.id} onClick={() => { setSearchJobTitle(job.title); setShowSuggestions(false); }} className="px-5 py-3 hover:bg-palette-50 cursor-pointer flex items-center gap-4 border-b border-palette-50 last:border-0 transition-colors">
                      <div className="w-10 h-10 bg-palette-100 rounded-xl flex items-center justify-center font-bold text-palette-900 text-sm shrink-0">
                        {job.companyInitial}
                      </div>
                      <div>
                        <div className="font-bold text-palette-900 text-base">{job.title}</div>
                        <div className="text-sm text-palette-900/70">{job.company} • {job.location}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="px-5 py-4 text-base text-palette-900/60 text-center font-medium">No jobs found for "{searchJobTitle}"</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full flex items-center px-4 md:px-6 py-3 bg-palette-100/30 rounded-2xl md:rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-palette-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <LocationAutocomplete 
                value={searchLocation}
                onChange={setSearchLocation}
                placeholder="City, state, or country..."
                className="w-full bg-transparent border-none outline-none px-3 md:px-4 text-palette-900 placeholder-palette-900/40 text-base md:text-lg font-medium"
              />
            </div>
            
            <button 
              onClick={() => {
                // If we want to scroll to jobs, we could do it here
                document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full md:w-auto px-10 py-3 md:py-4 bg-palette-400 text-white rounded-full font-bold text-base md:text-lg shadow-lg shadow-palette-400/40 hover:bg-palette-900 hover:shadow-xl hover:shadow-palette-900/30 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-palette-400 focus:ring-offset-2 flex items-center justify-center gap-2 group">
              Search Jobs
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Jobs List Section */}
        <div id="jobs-section" className="w-full max-w-6xl relative z-10 flex flex-col space-y-6 pb-12 mt-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-green-900 flex items-center gap-2">
                Latest Opportunities 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </h2>
              <p className="text-gray-500 mt-2 font-medium">
                {filteredHomepageJobs.length > 0 ? `Showing ${filteredHomepageJobs.length} jobs` : "No jobs found matching your criteria."}
              </p>
            </div>
            <button className="border border-green-200 text-green-800 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-green-50 transition-colors flex items-center gap-2 shadow-sm">
              View All Jobs &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHomepageJobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center font-bold text-green-800 text-2xl flex-shrink-0">
                    {job.companyInitial || job.company.charAt(0)}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-bold text-gray-900">{job.company}</span>
                    <div className="flex items-center text-gray-500 text-sm mt-1 gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {job.details?.industry || job.industry || 'Company'}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg mb-4 leading-snug">{job.title}</h3>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {job.details?.employmentType || 'Full-Time'}
                  </span>
                </div>
                
                <hr className="mt-auto border-gray-100 mb-4" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div>
                      <span className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold block mb-0.5">Salary</span>
                      <span className="font-bold text-gray-900 text-sm">{job.salary || 'Not specified'}</span>
                    </div>
                  </div>
                  <button onClick={() => setIsEmployeeLoginOpen(true)} className="text-sm font-bold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1">
                    Apply Now &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-12 mb-4 relative before:absolute before:h-px before:bg-gray-100 before:w-1/3 before:left-0 before:-z-10 after:absolute after:h-px after:bg-gray-100 after:w-1/3 after:right-0 after:-z-10">
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-9 h-9 rounded-full bg-green-800 text-white font-bold flex items-center justify-center text-sm shadow-md">
              1
            </button>
            <button className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-700 font-bold text-sm transition-colors bg-white">
              2
            </button>
            <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>
          </div>
        } />
        
        <Route 
          path="/employee" 
          element={isLoggedIn && userRole === 'employee' ? <EmployeeHomepage jobs={jobs} applyToJob={applyToJob} /> : <Navigate to="/" />} 
        />

        <Route 
          path="/employee/onboarding" 
          element={isLoggedIn && userRole === 'employee' ? <EmployeeOnboarding /> : <Navigate to="/" />} 
        />

        <Route 
          path="/profile" 
          element={isLoggedIn && userRole === 'employee' ? <EmployeeProfile /> : <Navigate to="/" />} 
        />

        <Route 
          path="/my-jobs" 
          element={isLoggedIn && userRole === 'employee' ? <MyJobs jobs={jobs} /> : <Navigate to="/" />} 
        />

        <Route 
          path="/employee/messages" 
          element={isLoggedIn && userRole === 'employee' ? <EmployeeMessages /> : <Navigate to="/" />} 
        />

        {/* Employer Routes */}
        <Route 
          path="/employer/*" 
          element={
            isLoggedIn && userRole === 'employer' ? (
              <EmployerDashboard 
                jobs={jobs} 
                addJob={addJob}
                candidates={candidates}
                updateCandidateStatus={updateCandidateStatus}
                toggleJobStatus={toggleJobStatus}
              />
            ) : <Navigate to="/" />
          } 
        />
      </Routes>

      <EmployeeLoginModal 
        isOpen={isEmployeeLoginOpen} 
        onClose={() => setIsEmployeeLoginOpen(false)} 
        onRegisterClick={openRegister}
        onLoginSuccess={handleEmployeeLoginSuccess}
      />
      <EmployeeRegisterModal 
        isOpen={isEmployeeRegisterOpen}
        onClose={() => setIsEmployeeRegisterOpen(false)}
        onLoginClick={openLogin}
        onLoginSuccess={handleEmployeeLoginSuccess}
      />
      <EmployerLoginModal 
        isOpen={isEmployerLoginOpen} 
        onClose={() => setIsEmployerLoginOpen(false)} 
        onRegisterClick={openEmployerRegister}
        onLoginSuccess={handleEmployerLoginSuccess}
      />
      <EmployerRegisterModal 
        isOpen={isEmployerRegisterOpen}
        onClose={() => setIsEmployerRegisterOpen(false)}
        onLoginClick={openEmployerLogin}
        onLoginSuccess={handleEmployerLoginSuccess}
      />
    </>
  )
}

export default App
