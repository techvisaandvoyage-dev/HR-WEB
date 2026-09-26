import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobApplicationModal from '../JobApplicationModal';
import EmployeeNavbar from '../../common/EmployeeNavbar';
import { getEmployeeStoredValue, setEmployeeStoredValue } from '../../../utils/employeeStorage';

const MyJobs = ({ jobs = [] }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('applied'); // default to applied based on user request
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateJobId, setStatusUpdateJobId] = useState(null);
  
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [savedJobs] = useState(() => getEmployeeStoredValue('savedJobs', []));

  const [appliedJobs, setAppliedJobs] = useState(() => getEmployeeStoredValue('appliedJobs', []));

  useEffect(() => {
    // Clear any legacy un-scoped appliedJobs key to prevent cross-user leak
    try {
      localStorage.removeItem('appliedJobs');
    } catch (e) {}

    const fetchMyApplications = async () => {
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
    };
    
    fetchMyApplications();
  }, []);

  const handleUpdateStatus = (newStatus) => {
    if (!statusUpdateJobId) return;
    
    setAppliedJobs(prev => {
      const updated = prev.map(job => 
        job.id === statusUpdateJobId ? { ...job, status: newStatus } : job
      );
      localStorage.setItem('appliedJobs', JSON.stringify(updated));
      return updated;
    });
    setIsStatusModalOpen(false);
    setStatusUpdateJobId(null);
  };
  
  const openStatusModal = (jobId) => {
    setStatusUpdateJobId(jobId);
    setIsStatusModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsApplicationModalOpen(false);
    try {
      const applied = localStorage.getItem('appliedJobs');
      if (applied) {
        setAppliedJobs(JSON.parse(applied));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col pb-16 md:pb-0">
      {/* Navbar */}
      <EmployeeNavbar />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:px-8 lg:px-0 lg:pt-10">
        <button 
          onClick={() => navigate('/employee')}
          className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Job
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-8 tracking-tight">My job</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('saved')} 
            className={`flex flex-col items-center px-4 pb-2 border-b-[3px] mr-4 min-w-[70px] transition-colors ${activeTab === 'saved' ? 'border-black text-gray-900 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium'}`}
          >
            <span className="text-sm">{jobs.filter(j => savedJobs.some(id => String(id) === String(j.id))).length}</span>
            <span>Saved</span>
          </button>
          <button 
            onClick={() => setActiveTab('applied')} 
            className={`flex flex-col items-center px-4 pb-2 border-b-[3px] mr-4 min-w-[70px] transition-colors ${activeTab === 'applied' ? 'border-black text-gray-900 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium'}`}
          >
            <span className="text-sm">{appliedJobs.length}</span>
            <span>Applied</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            {savedJobs.length === 0 ? (
              <p className="text-gray-500 py-4">No saved job.</p>
            ) : (
              jobs.filter(j => savedJobs.some(id => String(id) === String(j.id))).map(job => {
                const appliedData = appliedJobs.find(a => String(a.id) === String(job.id));
                return (
                  <div key={job.id} onClick={() => job.status !== 'Closed' && navigate('/employee', { state: { selectedJobId: job.id } })} className={`py-6 border-b border-gray-200 flex flex-col md:flex-row md:items-start gap-4 hover:bg-gray-50 transition-colors -mx-4 px-4 rounded-xl group ${job.status === 'Closed' ? 'cursor-default opacity-80' : 'cursor-pointer'}`}>
                    <div className="hidden md:flex w-12 h-12 bg-gray-100 rounded-lg items-center justify-center flex-shrink-0 text-gray-600 border border-gray-200 font-bold overflow-hidden">
                      {(job.companyLogo || job.employerId?.companyLogo) ? (
                        <img src={job.companyLogo || job.employerId?.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                      ) : (
                        job.companyInitial
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {appliedData && (
                        <span className={`inline-block px-3 py-1 font-bold text-xs rounded-full mb-2 ${appliedData.status === 'Applied' ? 'bg-blue-100 text-blue-800' : (appliedData.status === 'Hired' || appliedData.status?.toLowerCase() === 'shortlisted' || appliedData.status === 'Viewed') ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'}`}>
                          {appliedData.status}
                        </span>
                      )}
                      <h2 className="text-[17px] font-bold text-gray-900 group-hover:underline">{job.title}</h2>
                      <p className="text-[15px] text-gray-800 mt-1">{job.company}</p>
                      <p className="text-[15px] text-gray-800 mt-0.5">{job.location}, {job.details.workLocation}</p>
                      <p className="text-[13px] text-gray-500 mt-2">Saved {appliedData ? `• Applied on ${appliedData.date}` : ''}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      {!appliedData && (
                        job.status === 'Closed' ? (
                          <div className="flex items-center gap-2 bg-[#f3f2f1] text-[#4b4b4b] px-4 py-2.5 rounded-lg text-sm font-bold w-full md:w-auto">
                            <svg className="w-5 h-5 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            <span>Job closed</span>
                          </div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setIsApplicationModalOpen(true); }} className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition-colors text-[15px]">
                            Apply now
                          </button>
                        )
                      )}
                      <button className="text-gray-900 hover:text-black">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'applied' && (
          <div className="space-y-6">
            {appliedJobs.length === 0 ? (
              <p className="text-gray-500 py-4">You haven't applied to any job yet.</p>
            ) : (
              appliedJobs.map(applied => {
                const targetId = String(applied.id || applied._id || '');
                const foundJob = jobs.find(j => String(j.id || j._id) === targetId);
                const job = foundJob || applied.jobDetails || {
                  id: targetId,
                  _id: targetId,
                  title: applied.title || 'Applied Position',
                  company: applied.company || 'Company',
                  location: applied.location || 'Remote',
                  details: {}
                };

                const companyLogo = job.companyLogo || job.employerId?.companyLogo;
                const companyInitial = job.companyInitial || (job.company ? job.company.substring(0, 2).toUpperCase() : 'HR');

                return (
                  <div 
                    key={targetId || Math.random()} 
                    onClick={() => job.status !== 'Closed' && navigate('/employee', { state: { selectedJobId: job.id || job._id } })}
                    className={`pb-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 hover:bg-gray-50 transition-colors -mx-4 px-4 pt-4 rounded-xl group ${job.status === 'Closed' ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                  >
                    <div className="hidden md:flex w-12 h-12 items-center justify-center flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-600 overflow-hidden shadow-sm">
                        {companyLogo ? (
                          <img src={companyLogo} alt={job.company} className="w-full h-full object-cover" />
                        ) : (
                          companyInitial
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <span className={`inline-block px-3 py-1 font-bold text-xs rounded-full mb-2 ${job.status === 'Closed' ? 'bg-gray-200 text-gray-700' : (applied.status === 'Applied' || applied.status === 'New') ? 'bg-blue-100 text-blue-800' : (applied.status === 'Hired' || applied.status?.toLowerCase() === 'shortlisted' || applied.status === 'Viewed') ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'}`}>
                        {job.status === 'Closed' ? 'Closed' : (applied.status === 'New' ? 'Applied' : applied.status || 'Applied')}
                      </span>
                      <h2 className="text-[17px] font-bold text-gray-900 group-hover:underline">{job.title}</h2>
                      <p className="text-[15px] text-gray-800 mt-1">{job.company}</p>
                      <p className="text-[15px] text-gray-800 mt-0.5">{job.location}{job.details?.workLocation ? `, ${job.details.workLocation}` : ''}</p>
                      <p className="text-[13px] text-gray-500 mt-1">Applied on sahijob.com on {applied.date || 'recently'}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 mt-4 md:mt-0 w-full md:w-auto">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                      </div>
                      {job.status === 'Closed' && (
                        <div className="flex items-center gap-2 bg-[#f3f2f1] text-[#4b4b4b] px-4 py-2.5 rounded-lg text-sm font-bold w-full max-w-[300px]">
                          <svg className="w-5 h-5 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          <span>Job closed</span>
                        </div>
                      )}
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
