import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import JobApplicationModal from '../JobApplicationModal';
import EmployeeNavbar from '../../common/EmployeeNavbar';
import { getEmployeeStoredValue, setEmployeeStoredValue } from '../../../utils/employeeStorage';
import { formatJobLocation } from '../../../data/preferredLocations';
import './MyJobs.css';

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

  const [internalJobs, setInternalJobs] = useState(jobs);

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
    const updated = savedJobs.filter(id => String(id) !== String(jobId));
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

  // SVG Verified Icon
  const verifiedIcon = (
    <svg className="myjobs-ver" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="myjobs-container">
      {/* Navbar kept exactly as on homepage */}
      <EmployeeNavbar />

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

        {/* Tab 1: Saved Jobs */}
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
                {savedList.map((job, index) => {
                  const appliedData = appliedJobs.find(a => String(a.id) === String(job.id || job._id));
                  const displaySalary = job.salary || job.salaryNote || job.details?.salaryNote;

                  return (
                    <div 
                      key={job.id || job._id} 
                      className={`myjobs-jc ${index === 0 ? 'highlighted' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => job.status !== 'Closed' && navigate('/employee', { state: { selectedJobId: job.id || job._id } })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          job.status !== 'Closed' && navigate('/employee', { state: { selectedJobId: job.id || job._id } });
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
                        <span className="co">
                          {job.company}
                          {verifiedIcon}
                        </span>
                        <span>{formatJobLocation(job)}</span>
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
                          <b>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Submitted
                          </b>
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

        {/* Tab 2: Applied Jobs */}
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

                  const displaySalary = job.salary || job.salaryNote || job.details?.salaryNote;

                  return (
                    <div 
                      key={targetId || index} 
                      className={`myjobs-jc ${index === 0 ? 'highlighted' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => job.status !== 'Closed' && navigate('/employee', { state: { selectedJobId: job.id || job._id } })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          job.status !== 'Closed' && navigate('/employee', { state: { selectedJobId: job.id || job._id } });
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
                        <span className="co">
                          {job.company || 'amazone'}
                          {verifiedIcon}
                        </span>
                        <span>{formatJobLocation(job) || 'Remote'}</span>
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
                        <b>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Submitted
                        </b>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

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
