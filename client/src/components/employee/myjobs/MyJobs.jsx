import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import JobApplicationModal from '../JobApplicationModal';
import EmployeeNavbar from '../../common/EmployeeNavbar';
import { getEmployeeStoredValue, setEmployeeStoredValue } from '../../../utils/employeeStorage';
import { formatJobLocation } from '../../../data/preferredLocations';

const MyJobs = ({ jobs = [] }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('saved');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateJobId, setStatusUpdateJobId] = useState(null);
  
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
          return {
            id: jId,
            _id: jId,
            status: app.status || 'Applied',
            date: new Date(app.createdAt).toLocaleDateString(),
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

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans flex flex-col pb-24 md:pb-12">
      {/* Navbar */}
      <EmployeeNavbar />

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-4 md:pt-8">
        
        {/* Top Back & Header */}
        <div className="mb-4">
          <button 
            onClick={() => navigate('/employee')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-800 mb-3 bg-white px-3 py-1.5 rounded-full border border-gray-200/90 shadow-2xs transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to jobs
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">My jobs</h1>
        </div>
        
        {/* Modern Segmented Tabs */}
        <div className="flex items-center p-1 bg-gray-200/70 rounded-2xl mb-5 max-w-xs border border-gray-200/60">
          <button 
            onClick={() => setActiveTab('saved')} 
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'saved' 
                ? 'bg-white text-gray-900 shadow-xs' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>Saved</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'saved' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-300/80 text-gray-700'
            }`}>
              {savedList.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab('applied')} 
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'applied' 
                ? 'bg-white text-gray-900 shadow-xs' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>Applied</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'applied' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-300/80 text-gray-700'
            }`}>
              {appliedJobs.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Saved Jobs */}
        {activeTab === 'saved' && (
          <div className="space-y-3">
            {savedList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-xl">
                  🔖
                </div>
                <h3 className="text-base font-bold text-gray-900">No saved jobs</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Jobs you bookmark will appear here so you can easily review and apply later.
                </p>
                <button
                  onClick={() => navigate('/employee')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b5e20] hover:bg-[#15541b] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Browse jobs
                </button>
              </div>
            ) : (
              savedList.map(job => {
                const appliedData = appliedJobs.find(a => String(a.id) === String(job.id || job._id));
                return (
                  <div 
                    key={job.id || job._id} 
                    onClick={() => job.status !== 'Closed' && navigate('/employee', { state: { selectedJobId: job.id || job._id } })} 
                    className={`bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs hover:shadow-xs transition-all relative ${
                      job.status === 'Closed' ? 'cursor-default opacity-85' : 'cursor-pointer hover:border-gray-300'
                    }`}
                  >
                    {/* Top Row: Left Status / Badges + Right Bookmark Icon */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {appliedData ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            {appliedData.status === 'New' ? 'Applied' : (appliedData.status || 'Applied')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            Saved
                          </span>
                        )}
                        {job.status === 'Closed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            Closed
                          </span>
                        )}
                      </div>

                      {/* Bookmark button pinned at top-right */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleSave(job.id || job._id); }}
                        title="Remove from saved jobs"
                        className="p-1.5 text-emerald-700 hover:text-emerald-800 cursor-pointer shrink-0 transition-transform active:scale-90"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                      </button>
                    </div>

                    {/* Job Title */}
                    <h2 className="text-[17px] font-black text-gray-900 hover:text-emerald-800 leading-snug mt-1.5">
                      {job.title}
                    </h2>

                    {/* Company & Location */}
                    <div className="mt-1">
                      <p className="text-sm font-semibold text-gray-800">{job.company}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatJobLocation(job)}</p>
                    </div>

                    {/* Salary & Mode Badges */}
                    {(job.salary || job.workplaceMode) && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        {job.salary && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-md text-xs font-semibold">
                            ✓ {job.salary}
                          </span>
                        )}
                        {job.workplaceMode && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-50 text-stone-700 border border-stone-200/80 rounded-md text-xs font-medium">
                            ✓ {job.workplaceMode}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer Row: Timestamp / Status + Action */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400 font-medium truncate">
                        {appliedData ? `Applied on ${appliedData.date}` : (job.postedAt ? `Posted ${job.postedAt}` : 'Saved')}
                      </span>

                      {!appliedData && job.status !== 'Closed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setIsApplicationModalOpen(true); }}
                          className="px-4 py-1.5 bg-[#1b5e20] hover:bg-[#15541b] text-white text-xs font-bold rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
                        >
                          Apply now
                        </button>
                      )}

                      {appliedData && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 shrink-0">
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          Applied
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Applied Jobs */}
        {activeTab === 'applied' && (
          <div className="space-y-3">
            {appliedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-xl">
                  📄
                </div>
                <h3 className="text-base font-bold text-gray-900">No applications yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When you apply for jobs, you will be able to track your application status right here.
                </p>
                <button
                  onClick={() => navigate('/employee')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b5e20] hover:bg-[#15541b] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Browse jobs
                </button>
              </div>
            ) : (
              appliedJobs.map(applied => {
                const targetId = String(applied.id || applied._id || '');
                const foundJob = effectiveJobs.find(j => String(j.id || j._id) === targetId);
                const job = foundJob || applied.jobDetails || {
                  id: targetId,
                  _id: targetId,
                  title: applied.title || 'Applied Position',
                  company: applied.company || 'Company',
                  location: applied.location || 'Remote',
                  details: {}
                };

                return (
                  <div 
                    key={targetId || Math.random()} 
                    onClick={() => job.status !== 'Closed' && navigate('/employee', { state: { selectedJobId: job.id || job._id } })}
                    className={`bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs hover:shadow-xs transition-all relative ${
                      job.status === 'Closed' ? 'cursor-default opacity-85' : 'cursor-pointer hover:border-gray-300'
                    }`}
                  >
                    {/* Top Row: Left Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        job.status === 'Closed' 
                          ? 'bg-stone-100 text-stone-600 border border-stone-200' 
                          : (applied.status === 'Hired' || applied.status?.toLowerCase() === 'shortlisted')
                            ? 'bg-teal-50 text-teal-800 border border-teal-200/80'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                      }`}>
                        {job.status === 'Closed' ? 'Closed' : (applied.status === 'New' ? 'Applied' : applied.status || 'Applied')}
                      </span>

                      <span className="text-xs text-gray-400 font-medium">
                        {applied.date || 'Recently'}
                      </span>
                    </div>

                    {/* Job Title */}
                    <h2 className="text-[17px] font-black text-gray-900 hover:text-emerald-800 leading-snug mt-1.5">
                      {job.title}
                    </h2>

                    {/* Company & Location */}
                    <div className="mt-1">
                      <p className="text-sm font-semibold text-gray-800">{job.company}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatJobLocation(job)}</p>
                    </div>

                    {/* Salary & Mode Badges */}
                    {(job.salary || job.workplaceMode) && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        {job.salary && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-md text-xs font-semibold">
                            ✓ {job.salary}
                          </span>
                        )}
                        {job.workplaceMode && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-50 text-stone-700 border border-stone-200/80 rounded-md text-xs font-medium">
                            ✓ {job.workplaceMode}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>Applied on sahijob.com</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Submitted
                      </span>
                    </div>
                  </div>
                );
              })
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
