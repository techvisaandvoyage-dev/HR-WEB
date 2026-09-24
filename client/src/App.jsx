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
import Footer from './components/common/Footer';
import StaticPage from './components/common/StaticPage';
import BrandLogo from './components/common/BrandLogo';
import { isLocationMatch } from './data/preferredLocations';

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

  const [homepageConfig, setHomepageConfig] = useState(null);
  const [visibleJobsCount, setVisibleJobsCount] = useState(6);

  useEffect(() => {
    if (!location.state?.tab && !location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    const isEmployerRoute = location.pathname.startsWith('/employer');
    if (isEmployerRoute && localStorage.getItem('employerToken')) {
      setUserRole('employer');
    } else if (!isEmployerRoute && localStorage.getItem('employeeToken')) {
      setUserRole('employee');
    }
  }, [location.pathname, location.state]);

  // Fetch dynamic CMS homepage configuration
  useEffect(() => {
    const fetchHomepageConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const json = await res.json();
        if (json.success && json.data) {
          setHomepageConfig(json.data);
          if (json.data.jobCards?.initialCount !== undefined && json.data.jobCards?.initialCount !== null) {
            setVisibleJobsCount(json.data.jobCards.initialCount);
          }
        }
      } catch (err) {
        console.error('Failed to load homepage config:', err);
      }
    };
    fetchHomepageConfig();
  }, []);

  // Load all custom fonts from the library into @font-face so they are always available
  useEffect(() => {
    const library = homepageConfig?.customFontsLibrary;
    if (!Array.isArray(library)) return;
    library.forEach(({ family, customUrl }) => {
      if (!family || !customUrl) return;
      const styleId = `custom-font-lib-${family.replace(/\s+/g, '-').toLowerCase()}`;
      if (document.getElementById(styleId)) return; // already injected
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @font-face {
          font-family: '${family}';
          src: url('${customUrl}');
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
      try {
        if (typeof FontFace !== 'undefined') {
          const fontFace = new FontFace(family, `url('${customUrl}')`);
          fontFace.load().then(loaded => document.fonts.add(loaded)).catch(() => {});
        }
      } catch (_) {}
    });
  }, [homepageConfig?.customFontsLibrary]);

  // Dynamically load & apply typography configured in CMS
  useEffect(() => {
    if (!homepageConfig?.typography) return;
    const { primaryFont, headingFont, secondaryFont } = homepageConfig.typography;

    const applyFont = (font, defaultFamily, cssVar) => {
      if (!font) return;
      const family = (font.family || defaultFamily).trim();
      if (font.source === 'google' && family) {
        const linkId = `google-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
          link.onerror = () => {
            link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}&display=swap`;
          };
          document.head.appendChild(link);
        }
      } else if (font.source === 'custom' && font.customUrl) {
        if (font.urlType === 'stylesheet') {
          // Inject as a <link> stylesheet (Google Fonts link, CDN, etc.)
          const linkId = `font-link-${family.replace(/\s+/g, '-').toLowerCase()}`;
          if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = font.customUrl;
            document.head.appendChild(link);
          }
        } else {
          // Inject as @font-face (uploaded file)
          const styleId = `custom-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
          let style = document.getElementById(styleId);
          if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
          }
          style.innerHTML = `
            @font-face {
              font-family: '${family}';
              src: url('${font.customUrl}');
              font-display: swap;
            }
          `;
          try {
            if (typeof FontFace !== 'undefined') {
              const fontFace = new FontFace(family, `url('${font.customUrl}')`);
              fontFace.load().then(loaded => document.fonts.add(loaded)).catch(() => {});
            }
          } catch (_) {}
        }
      }
      document.documentElement.style.setProperty(cssVar, `'${family}', sans-serif`);
    };

    if (primaryFont) applyFont(primaryFont, 'Inter', '--font-primary');
    if (headingFont) applyFont(headingFont, 'Plus Jakarta Sans', '--font-heading');
    if (secondaryFont) applyFont(secondaryFont, 'Roboto', '--font-secondary');

    const pFamily = (primaryFont?.family || 'Inter').trim();
    const hFamily = (headingFont?.family || 'Plus Jakarta Sans').trim();
    const sFamily = (secondaryFont?.family || 'Roboto').trim();

    let dynamicStyle = document.getElementById('dynamic-typography-styles');
    if (!dynamicStyle) {
      dynamicStyle = document.createElement('style');
      dynamicStyle.id = 'dynamic-typography-styles';
      document.head.appendChild(dynamicStyle);
    }
    // Build Google Fonts @import only for google-sourced fonts
    const googleFamilies = [
      primaryFont?.source !== 'custom' ? pFamily : null,
      headingFont?.source !== 'custom' ? hFamily : null,
      secondaryFont?.source !== 'custom' ? sFamily : null,
    ].filter(Boolean);
    const googleImport = googleFamilies.length > 0
      ? `@import url('https://fonts.googleapis.com/css2?${googleFamilies.map(f => `family=${f.replace(/\s+/g, '+')}:ital,wght@0,300..900;1,300..900`).join('&')}&display=swap');`
      : '';

    dynamicStyle.innerHTML = `
      ${googleImport}
      :root {
        --font-primary: '${pFamily}', sans-serif;
        --font-heading: '${hFamily}', sans-serif;
        --font-secondary: '${sFamily}', serif, sans-serif;
      }
      body, button, input, select, textarea, p, div, a, li, label, table, td, th {
        font-family: '${pFamily}', sans-serif;
      }
      h1, h2, h3, h4, h5, h6, .font-heading {
        font-family: '${hFamily}', sans-serif !important;
      }
      .font-secondary, .font-accent, .hero-highlight, [data-typography="secondary"],
      .rounded-full, .rounded-full *, .tag, .badge, .chip, [class*="bg-green-50"], [class*="bg-emerald-50"], [class*="bg-blue-50"], [class*="bg-purple-50"] {
        font-family: '${sFamily}', serif, sans-serif !important;
      }
    `;
  }, [homepageConfig?.typography]);

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
                    salaryType: (emp.professionalDetails && emp.professionalDetails.salaryType) || 'Yearly',
                    industry: emp.industry || 'N/A',
                    designation: emp.designation || 'N/A',
                    totalExperience: emp.totalExperience || 'N/A',
                    preferredLocation: emp.preferredLocation || 'N/A',
                    resume: emp.resume || emp.documents?.resume || '',
                    coverLetter: emp.coverLetter || emp.documents?.coverLetter || '',
                    introVideo: emp.introVideo || emp.documents?.introVideo || '',
                    documents: emp.documents || {
                      resume: emp.resume || '',
                      coverLetter: emp.coverLetter || '',
                      introVideo: emp.introVideo || '',
                    },
                  };
                }
                
                candidatesMap[emp._id].history.push({
                  appId: app._id,
                  title: app.jobId?.title || 'Unknown Job',
                  status: app.status,
                  color: app.statusColor,
                  date: new Date(app.createdAt).toLocaleDateString(),
                  screeningAnswers: app.screeningAnswers || [],
                  resume: app.resume || emp.resume || emp.documents?.resume || '',
                  coverLetter: app.coverLetter || emp.coverLetter || emp.documents?.coverLetter || '',
                  introVideo: app.introVideo || emp.introVideo || emp.documents?.introVideo || '',
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

  const updateJob = (updatedJob) => {
    setJobs(prev => prev.map(job =>
      job.id === updatedJob._id || job.id === updatedJob.id
        ? { ...updatedJob, id: updatedJob._id || updatedJob.id }
        : job
    ));
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
        return { success: true };
      }
      return { success: false, message: data.message || 'Failed to apply' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Network error occurred' };
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
  const [employerRegisterInitialData, setEmployerRegisterInitialData] = useState(null);
  const navigate = useNavigate();

  const openRegister = () => {
    setIsEmployeeLoginOpen(false);
    setIsEmployeeRegisterOpen(true);
  };

  const openLogin = () => {
    setIsEmployeeRegisterOpen(false);
    setIsEmployeeLoginOpen(true);
  };

  const openEmployerRegister = (initialData = null) => {
    setIsEmployerLoginOpen(false);
    setEmployerRegisterInitialData(initialData);
    setIsEmployerRegisterOpen(true);
  };

  const openEmployerLogin = () => {
    setIsEmployerRegisterOpen(false);
    setEmployerRegisterInitialData(null);
    setIsEmployerLoginOpen(true);
  };

  const handleEmployeeLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setUserRole('employee');
    setIsEmployeeLoginOpen(false);
    setIsEmployeeRegisterOpen(false);

    const isComplete = data?.isOnboardingCompleted === true || (data?.hasProfile === true && !data?.isNewUser);
    if (!isComplete || data?.isNewUser) {
      const stepToNavigate = data?.onboardingStep || localStorage.getItem('onboardingCurrentStep') || 1;
      navigate(`/employee/onboarding?step=${stepToNavigate}`);
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
    const matchLocation = isLocationMatch(job.location, searchLocation, job.details?.workLocation);
    return matchTitle && matchLocation;
  });

  return (
    <>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-white font-sans text-palette-900 flex flex-col selection:bg-palette-200 selection:text-palette-900">
            {/* Navbar */}
      <nav className="w-full px-6 py-4 md:px-12 md:py-5 flex justify-between items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-palette-100 shadow-sm">
        {/* Brand / Logo */}
        <BrandLogo 
          onClick={() => navigate('/')} 
          customConfig={homepageConfig?.logo}
        />

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
            <h1 className="text-4xl md:text-7xl font-heading font-black tracking-tight text-palette-900 leading-tight">
              <span>{homepageConfig?.hero?.titlePrefix || 'Find Your'} </span>
              <span className="hero-highlight font-secondary text-transparent bg-clip-text bg-gradient-to-r from-palette-400 to-palette-900">
                {homepageConfig?.hero?.titleHighlight || 'Dream Job'}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-palette-900/70 font-medium max-w-2xl mx-auto">
              {homepageConfig?.hero?.subtitle || 'Discover opportunities that align with your passion and expertise.'}
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
                placeholder={homepageConfig?.searchBar?.jobPlaceholder || 'Job title...'} 
                className="w-full bg-transparent border-none outline-none px-3 md:px-4 text-palette-900 placeholder-palette-900/40 text-base md:text-lg font-medium"
              />
              {showSuggestions && searchJobTitle && (
                <div className="absolute top-[110%] left-0 w-[120%] bg-white rounded-2xl shadow-xl border border-palette-100 py-2 z-[100] max-h-64 overflow-y-auto text-left">
                  {filteredHomepageJobs.length > 0 ? filteredHomepageJobs.slice(0, 5).map(job => (
                    <div key={job.id} onClick={() => { setSearchJobTitle(job.title); setShowSuggestions(false); }} className="px-5 py-3 hover:bg-palette-50 cursor-pointer flex items-center gap-4 border-b border-palette-50 last:border-0 transition-colors">
                      <div className="w-10 h-10 bg-palette-100 rounded-full flex items-center justify-center font-bold text-palette-900 text-sm shrink-0 overflow-hidden border border-palette-100">
                        {(job.companyLogo || job.employerId?.companyLogo) ? (
                          <img src={job.companyLogo || job.employerId?.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                        ) : (
                          job.companyInitial
                        )}
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
                placeholder={homepageConfig?.searchBar?.locationPlaceholder || 'City, state, or country...'}
                className="w-full bg-transparent border-none outline-none px-3 md:px-4 text-palette-900 placeholder-palette-900/40 text-base md:text-lg font-medium"
              />
            </div>
            
            <button 
              onClick={() => {
                document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full md:w-auto px-10 py-3 md:py-4 bg-palette-400 text-white rounded-full font-bold text-base md:text-lg shadow-lg shadow-palette-400/40 hover:bg-palette-900 hover:shadow-xl hover:shadow-palette-900/30 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-palette-400 focus:ring-offset-2 flex items-center justify-center gap-2 group cursor-pointer">
              <span>{homepageConfig?.searchBar?.buttonText || 'Search Jobs'}</span>
              {(homepageConfig?.searchBar?.showArrow ?? true) && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Jobs List Section */}
        <div id="jobs-section" className="w-full max-w-6xl relative z-10 flex flex-col space-y-6 pb-12 mt-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-green-900 flex items-center gap-2">
                <span>{homepageConfig?.jobCards?.heading || 'Latest Opportunities'}</span>
                {(homepageConfig?.jobCards?.showSparkleIcon ?? true) && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )}
              </h2>
              <p className="text-gray-500 mt-2 font-medium">
                {filteredHomepageJobs.length > 0 
                  ? (homepageConfig?.jobCards?.subtextTemplate || 'Showing {count} jobs').replace('{count}', Math.min(visibleJobsCount, filteredHomepageJobs.length))
                  : "No jobs found matching your criteria."}
              </p>
            </div>
            {filteredHomepageJobs.length > visibleJobsCount ? (
              <button 
                onClick={() => setVisibleJobsCount(prev => prev + (homepageConfig?.jobCards?.showMoreCount || 6))}
                className="border border-green-200 text-green-800 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-green-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {homepageConfig?.jobCards?.viewAllButtonText || 'View All Jobs'} &rarr;
              </button>
            ) : filteredHomepageJobs.length > (homepageConfig?.jobCards?.initialCount ?? 6) ? (
              <button 
                onClick={() => setVisibleJobsCount(homepageConfig?.jobCards?.initialCount ?? 6)}
                className="border border-gray-200 text-gray-600 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                Show Less &uarr;
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHomepageJobs.slice(0, visibleJobsCount).map(job => (
              <div key={job.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center font-bold text-green-800 text-2xl flex-shrink-0 overflow-hidden border border-gray-100">
                    {(job.companyLogo || job.employerId?.companyLogo) ? (
                      <img src={job.companyLogo || job.employerId?.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                    ) : (
                      job.companyInitial || job.company.charAt(0)
                    )}
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
                      <span className="font-bold text-gray-900 text-sm">
                        {job.salary 
                          ? job.salary
                              .replace(/lacs\s*pa/gi, 'PA')
                              .replace(/lac\s*pa/gi, 'PA')
                              .replace(/lpa/gi, 'PA')
                              .replace(/per\s*month/gi, 'PM')
                              .replace(/per\s*hour/gi, 'PH')
                              .trim()
                          : 'Not specified'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setIsEmployeeLoginOpen(true)} className="text-sm font-bold text-green-700 hover:text-green-800 transition-colors flex items-center gap-1 cursor-pointer">
                    Apply Now &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Show More Pagination Button at bottom if more jobs exist */}
          {filteredHomepageJobs.length > visibleJobsCount && (
            <div className="flex justify-center pt-6">
              <button
                onClick={() => setVisibleJobsCount(prev => prev + (homepageConfig?.jobCards?.showMoreCount || 6))}
                className="px-8 py-3 bg-white border border-green-600/30 text-green-800 font-bold text-sm rounded-full shadow-sm hover:bg-green-50 hover:border-green-600 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Show More Jobs ({filteredHomepageJobs.length - visibleJobsCount} remaining)</span>
                <span>&darr;</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
          </div>
        } />
        
        <Route 
          path="/page/*" 
          element={<StaticPage />} 
        />
        
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
          path="/employee/profile" 
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
                updateJob={updateJob}
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
        initialData={employerRegisterInitialData}
        onClose={() => { setIsEmployerRegisterOpen(false); setEmployerRegisterInitialData(null); }}
        onLoginClick={openEmployerLogin}
        onLoginSuccess={handleEmployerLoginSuccess}
      />
    </>
  )
}

export default App
