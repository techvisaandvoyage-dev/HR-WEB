import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import JobApplicationModal from '../JobApplicationModal';
import SjLoggedInHeader from '../../sj-home/SjLoggedInHeader';
import SjGuestHeader from '../../sj-home/SjGuestHeader';
import SjJobDetailsDrawer from '../../sj-home/SjJobDetailsDrawer';
import { getEmployeeStoredValue, setEmployeeStoredValue } from '../../../utils/employeeStorage';
import { formatJobLocation } from '../../../data/preferredLocations';
import { formatSalary } from '../../../utils/salaryUtils';
import './MyJobs.css';

function getCandidateProfile() {
  try {
    let profile = null;
    const raw = localStorage.getItem('userProfile');
    if (raw) {
      try {
        profile = JSON.parse(raw);
      } catch (_) {}
    }

    if (!profile) {
      const empRaw = localStorage.getItem('employeeUser');
      if (empRaw) {
        try {
          const empParsed = JSON.parse(empRaw);
          profile = empParsed?.profile || empParsed;
          if (profile && empParsed?.name && !profile.name) profile.name = empParsed.name;
          if (profile && empParsed?.email && !profile.email) profile.email = empParsed.email;
          if (profile && empParsed?.avatar && !profile.avatar) profile.avatar = empParsed.avatar;
        } catch (_) {}
      }
    }
    return profile;
  } catch (e) {
    return null;
  }
}

const MyJobs = ({ jobs = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTab = () => {
    const queryTab = new URLSearchParams(location.search).get('tab');
    if (queryTab === 'applied' || queryTab === 'saved') return queryTab;
    if (location.state?.tab === 'applied' || location.state?.tab === 'saved') return location.state.tab;
    return 'saved';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const queryTab = new URLSearchParams(location.search).get('tab');
    const stateTab = location.state?.tab;
    const targetTab = queryTab || stateTab;
    if (targetTab && (targetTab === 'applied' || targetTab === 'saved')) {
      setActiveTab(targetTab);
    }
  }, [location.search, location.state]);

  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Profile and login state for header matching Homepage
  const [candidateProfile, setCandidateProfile] = useState(() => getCandidateProfile());
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem('employeeToken') || localStorage.getItem('token'))
  );
  const [homepageConfig, setHomepageConfig] = useState(null);

  // Header search state (navigates to /employee on search)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchExperience, setSearchExperience] = useState('All');
  const [searchPostingDate, setSearchPostingDate] = useState('Any time');

  // Right sidebar drawer preview state (ONLY for saved jobs)
  const [selectedDrawerJob, setSelectedDrawerJob] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [internalJobs, setInternalJobs] = useState(jobs);

  // Fetch homepage config (for brand logo)
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/homepage`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          setHomepageConfig(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch candidate profile to ensure avatar is fresh
  useEffect(() => {
    const token = localStorage.getItem('employeeToken') || localStorage.getItem('token');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/employee/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data) {
          setCandidateProfile(data.data);
          try {
            localStorage.setItem('userProfile', JSON.stringify(data.data));
          } catch (_) {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setInternalJobs(jobs);
    } else {
      const fetchJobs = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/employee/jobs`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setInternalJobs(data.data.map(j => ({ ...j, id: j._id })));
          }
        } catch (e) {
          console.error('Error fetching jobs in MyJobs:', e);
        }
      };
      fetchJobs();
    }
  }, [jobs]);

  const effectiveJobs = (jobs && jobs.length > 0) ? jobs : internalJobs;

  const [savedJobs, setSavedJobs] = useState(() => getEmployeeStoredValue('savedJobs', []));

  const handleToggleSave = (jobId) => {
    const isSaved = savedJobs.some(id => String(id) === String(jobId));
    let updated;
    if (isSaved) {
      updated = savedJobs.filter(id => String(id) !== String(jobId));
    } else {
      updated = [...savedJobs, jobId];
    }
    setSavedJobs(updated);
    setEmployeeStoredValue('savedJobs', updated);
  };

  const [appliedJobs, setAppliedJobs] = useState(() => getEmployeeStoredValue('appliedJobs', []));

  const fetchMyApplications = useCallback(async () => {
    try {
      const token = localStorage.getItem('employeeToken') || localStorage.getItem('token');
      if (!token) {
        setAppliedJobs([]);
        return;
      }
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        const sortedData = [...data.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const apiAppliedJobs = sortedData.map(app => {
          const populated = typeof app.jobId === 'object' && app.jobId !== null ? app.jobId : null;
          const jId = populated?._id || populated?.id || app.jobId;
          const rawDate = app.createdAt ? new Date(app.createdAt) : new Date();
          return {
            id: jId,
            _id: jId,
            status: app.status || 'Applied',
            date: `${rawDate.getMonth() + 1}/${rawDate.getDate()}/${rawDate.getFullYear()}`,
            jobDetails: populated
          };
        });
        
        setAppliedJobs(apiAppliedJobs);
        setEmployeeStoredValue('appliedJobs', apiAppliedJobs);
      }
    } catch (err) {
      console.error("Error fetching my applications:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.removeItem('appliedJobs');
    } catch (e) {}

    fetchMyApplications();
  }, [fetchMyApplications]);

  const handleCloseModal = () => {
    setIsApplicationModalOpen(false);
    fetchMyApplications();
  };

  const savedList = effectiveJobs.filter(j => savedJobs.some(id => String(id) === String(j.id || j._id)));

  const appliedList = appliedJobs.map((applied) => {
    const targetId = String(applied.id || applied._id || '');
    const foundJob = effectiveJobs.find(j => String(j.id || j._id) === targetId);
    return foundJob || applied.jobDetails || {
      id: targetId,
      _id: targetId,
      title: applied.title || 'Applied Position',
      company: applied.company || 'amazone',
      location: applied.location || 'Remote',
      details: {}
    };
  });

  const activeDrawerList = activeTab === 'applied' ? appliedList : savedList;

  // Drawer handlers (opens right sidebar preview for saved and applied jobs)
  const handleOpenDrawer = (job) => {
    setSelectedDrawerJob(job);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedDrawerJob(null);
  };

  const currentDrawerIndex = selectedDrawerJob
    ? activeDrawerList.findIndex(j => String(j.id || j._id) === String(selectedDrawerJob.id || selectedDrawerJob._id))
    : -1;

  const hasPreviousJob = currentDrawerIndex > 0;
  const hasNextJob = currentDrawerIndex >= 0 && currentDrawerIndex < activeDrawerList.length - 1;

  const handlePreviousJob = () => {
    if (hasPreviousJob) {
      setSelectedDrawerJob(activeDrawerList[currentDrawerIndex - 1]);
    }
  };

  const handleNextJob = () => {
    if (hasNextJob) {
      setSelectedDrawerJob(activeDrawerList[currentDrawerIndex + 1]);
    }
  };

  const isDrawerJobApplied = selectedDrawerJob
    ? appliedJobs.some(a => String(a.id || a._id) === String(selectedDrawerJob.id || selectedDrawerJob._id))
    : false;

  const isDrawerJobSaved = selectedDrawerJob
    ? savedJobs.some(sId => String(sId) === String(selectedDrawerJob.id || selectedDrawerJob._id))
    : false;

  const handleApplyFromDrawer = (jobToApply) => {
    setSelectedJob(jobToApply || selectedDrawerJob);
    setIsApplicationModalOpen(true);
  };

  const handleToggleSaveFromDrawer = (jobToSave) => {
    const target = jobToSave || selectedDrawerJob;
    if (target) {
      handleToggleSave(target.id || target._id);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('token');
    localStorage.removeItem('employeeUser');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    navigate('/employee');
  };

  const handleHeaderSearch = (q, loc, exp, date) => {
    navigate('/employee', {
      state: {
        searchFilters: {
          keyword: q !== undefined ? q : searchQuery,
          location: loc !== undefined ? loc : searchLocation,
          experience: exp !== undefined ? exp : searchExperience,
          postingDate: date !== undefined ? date : searchPostingDate,
        }
      }
    });
  };

  // SVG Verified Icon - Scalloped verified badge matching prototype exactly
  const verifiedIcon = (
    <svg className="myjobs-ver" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified">
      <path d="M12 2l2.4 2 3.1-.3.9 3 2.7 1.6-1 3 1 3-2.7 1.6-.9 3-3.1-.3L12 22l-2.4-2-3.1.3-.9-3L2.9 15.7l1-3-1-3 2.7-1.6.9-3 3.1.3Zm-1 13 5-5-1.4-1.4L11 12.2 9.4 10.6 8 12Z" />
    </svg>
  );

  return (
    <div className="myjobs-container">
      {/* Modern Navbar matching Homepage */}
      {isLoggedIn ? (
        <SjLoggedInHeader
          logoConfig={homepageConfig?.logo}
          searchTerm={searchQuery}
          onSearchTermChange={(val) => {
            setSearchQuery(val);
            handleHeaderSearch(val, searchLocation, searchExperience, searchPostingDate);
          }}
          searchLocation={searchLocation}
          onSearchLocationChange={(val) => {
            setSearchLocation(val);
            handleHeaderSearch(searchQuery, val, searchExperience, searchPostingDate);
          }}
          experience={searchExperience}
          onExperienceChange={(val) => {
            setSearchExperience(val);
            handleHeaderSearch(searchQuery, searchLocation, val, searchPostingDate);
          }}
          postingDate={searchPostingDate}
          onPostingDateChange={(val) => {
            setSearchPostingDate(val);
            handleHeaderSearch(searchQuery, searchLocation, searchExperience, val);
          }}
          jobs={effectiveJobs}
          userProfile={candidateProfile}
          savedCount={savedJobs.length}
          onNavigateSaved={() => setActiveTab('saved')}
          onNavigateApplied={() => setActiveTab('applied')}
          onNavigateMessages={() => navigate('/employee/messages')}
          onNavigateProfile={() => navigate('/employee/profile')}
          onNavigateSecurity={() => navigate('/employee/profile?tab=security')}
          onSignOut={handleSignOut}
          onLogoClick={() => navigate('/employee')}
        />
      ) : (
        <SjGuestHeader
          logoConfig={homepageConfig?.logo}
          onOpenEmployeeLogin={() => navigate('/employee')}
          onOpenEmployerLogin={() => navigate('/employer')}
          onLogoClick={() => navigate('/employee')}
        />
      )}

      {/* Main Container */}
      <main className="myjobs-pw">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/employee')}
          className="myjobs-back"
          aria-label="Back to jobs"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to jobs</span>
        </button>

        {/* Title */}
        <h1 className="myjobs-title">My jobs</h1>

        {/* Big Segmented Tab Buttons */}
        <div className="myjobs-jt" role="tablist">
          <button 
            role="tab"
            aria-selected={activeTab === 'saved'}
            onClick={() => setActiveTab('saved')} 
            className={activeTab === 'saved' ? 'on' : ''}
          >
            <span>Saved</span>
            <small>{savedList.length}</small>
          </button>
          
          <button 
            role="tab"
            aria-selected={activeTab === 'applied'}
            onClick={() => setActiveTab('applied')} 
            className={activeTab === 'applied' ? 'on' : ''}
          >
            <span>Applied</span>
            <small>{appliedJobs.length}</small>
          </button>
        </div>

        {/* Tab 1: Saved Jobs (Click opens right sidebar drawer preview) */}
        {activeTab === 'saved' && (
          <div>
            {savedList.length === 0 ? (
              <div className="myjobs-empt">
                <span className="ic2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <h2>No saved jobs</h2>
                <p>Jobs you bookmark will appear here so you can easily review and apply later.</p>
                <button
                  onClick={() => navigate('/employee')}
                  className="myjobs-go"
                >
                  Browse jobs
                </button>
              </div>
            ) : (
              <div className="myjobs-list">
                {savedList.map((job) => {
                  const appliedData = appliedJobs.find(a => String(a.id) === String(job.id || job._id));
                  const displaySalary = formatSalary(job.salary, job.salaryNote || job.details?.salaryNote);

                  return (
                    <div 
                      key={job.id || job._id} 
                      className="myjobs-jc"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenDrawer(job)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleOpenDrawer(job);
                        }
                      }}
                    >
                      {/* Top Row: Status badge & Unsave bookmark */}
                      <div className="r1">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`myjobs-pill ${job.status === 'Closed' ? 'closed' : 'a'}`}>
                            {job.status === 'Closed' ? 'Closed' : (appliedData ? (appliedData.status === 'New' ? 'Applied' : (appliedData.status || 'Applied')) : 'Saved')}
                          </span>
                        </div>

                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleToggleSave(job.id || job._id); 
                          }}
                          title="Remove bookmark"
                          className="myjobs-b2 sm"
                          style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Job Title */}
                      <h2>{job.title}</h2>

                      {/* Company & Location */}
                      <div className="myjobs-sub">
                        <span className="myjobs-company">
                          {job.company}
                          {verifiedIcon}
                        </span>
                        <span className="myjobs-loc">{formatJobLocation(job) || 'Remote'}</span>
                      </div>

                      {/* Salary Tag */}
                      {displaySalary && (
                        <div className="myjobs-tags-row">
                          <span className="myjobs-pill">
                            ✓ {displaySalary}
                          </span>
                        </div>
                      )}

                      {/* Footer Row */}
                      <div className="ft">
                        <span>
                          {appliedData ? `Applied on sahijob.com` : 'Saved on sahijob.com'}
                        </span>

                        {appliedData ? (
                          <b>✓ Submitted</b>
                        ) : job.status !== 'Closed' && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedJob(job); 
                              setIsApplicationModalOpen(true); 
                            }}
                            className="myjobs-b2 sm primary"
                          >
                            Apply now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Applied Jobs (Clean display without sidebar drawer opening) */}
        {activeTab === 'applied' && (
          <div>
            {appliedJobs.length === 0 ? (
              <div className="myjobs-empt">
                <span className="ic2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <h2>No applied jobs</h2>
                <p>Jobs you apply to will appear here.</p>
                <button
                  onClick={() => navigate('/employee')}
                  className="myjobs-go"
                >
                  Browse jobs
                </button>
              </div>
            ) : (
              <div className="myjobs-list">
                {appliedJobs.map((applied, index) => {
                  const targetId = String(applied.id || applied._id || '');
                  const foundJob = effectiveJobs.find(j => String(j.id || j._id) === targetId);
                  const job = foundJob || applied.jobDetails || {
                    id: targetId,
                    _id: targetId,
                    title: applied.title || 'Applied Position',
                    company: applied.company || 'amazone',
                    location: applied.location || 'Remote',
                    details: {}
                  };

                  const displaySalary = formatSalary(job.salary, job.salaryNote || job.details?.salaryNote);

                  return (
                    <div 
                      key={targetId || index} 
                      className="myjobs-jc applied-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenDrawer(job)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleOpenDrawer(job);
                        }
                      }}
                    >
                      {/* Top Row: Status pill on left, Date on right */}
                      <div className="r1">
                        <span className={`myjobs-pill ${job.status === 'Closed' ? 'closed' : 'a'}`}>
                          {job.status === 'Closed' 
                            ? 'Closed' 
                            : (applied.status === 'New' ? 'Applied' : (applied.status || 'Applied'))}
                        </span>

                        <span>{applied.date || '11/3/2026'}</span>
                      </div>

                      {/* Job Title */}
                      <h2>{job.title}</h2>

                      {/* Company & Location */}
                      <div className="myjobs-sub">
                        <span className="myjobs-company">
                          {job.company || 'amazone'}
                          {verifiedIcon}
                        </span>
                        <span className="myjobs-loc">{formatJobLocation(job) || 'Remote'}</span>
                      </div>

                      {/* Salary Tag */}
                      {displaySalary && (
                        <div className="myjobs-tags-row">
                          <span className="myjobs-pill">
                            ✓ {displaySalary}
                          </span>
                        </div>
                      )}

                      {/* Footer Row */}
                      <div className="ft">
                        <span>Applied on sahijob.com</span>
                        <b>✓ Submitted</b>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Right Sidebar Job Details Drawer Preview (specifically for My Jobs) */}
      <SjJobDetailsDrawer
        job={selectedDrawerJob}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onPrevious={handlePreviousJob}
        onNext={handleNextJob}
        hasPrevious={hasPreviousJob}
        hasNext={hasNextJob}
        isApplied={isDrawerJobApplied}
        isSaved={isDrawerJobSaved}
        onApply={() => handleApplyFromDrawer(selectedDrawerJob)}
        onToggleSave={() => handleToggleSaveFromDrawer(selectedDrawerJob)}
        variant="sidebar"
        backLabel="Jobs"
      />

      {/* Application Modal */}
      <JobApplicationModal 
        isOpen={isApplicationModalOpen} 
        onClose={handleCloseModal} 
        job={selectedJob} 
      />
    </div>
  );
};

export default MyJobs;
