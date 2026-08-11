import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JobApplicationModal from '../JobApplicationModal';
import EmployeeNavbar from '../../common/EmployeeNavbar';

const MyJobs = ({ jobs = [] }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('applied'); // default to applied based on user request
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateJobId, setStatusUpdateJobId] = useState(null);
  
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const saved = localStorage.getItem('savedJobs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [appliedJobs, setAppliedJobs] = useState(() => {
    try {
      const applied = localStorage.getItem('appliedJobs');
      return applied ? JSON.parse(applied) : [];
    } catch (e) {
      return [];
    }
  });

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
        <h1 className="text-4xl font-bold text-gray-900 mb-8 tracking-tight">My jobs</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('saved')} 
            className={`flex flex-col items-center px-4 pb-2 border-b-[3px] mr-4 min-w-[70px] transition-colors ${activeTab === 'saved' ? 'border-black text-gray-900 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium'}`}
          >
            <span className="text-sm">{savedJobs.length}</span>
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
              <p className="text-gray-500 py-4">No saved jobs.</p>
            ) : (
              jobs.filter(j => savedJobs.some(id => String(id) === String(j.id))).map(job => {
                const appliedData = appliedJobs.find(a => String(a.id) === String(job.id));
                return (
                  <div key={job.id} onClick={() => navigate('/employee', { state: { selectedJobId: job.id } })} className="py-6 border-b border-gray-200 flex flex-col md:flex-row md:items-start gap-4 hover:bg-gray-50 transition-colors -mx-4 px-4 rounded-xl cursor-pointer group">
                    <div className="hidden md:flex w-12 h-12 bg-gray-100 rounded-lg items-center justify-center flex-shrink-0 text-gray-600 border border-gray-200 font-bold">
                      {job.companyInitial}
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
              <p className="text-gray-500 py-4">You haven't applied to any jobs yet.</p>
            ) : (
              appliedJobs.map(applied => {
                const job = jobs.find(j => String(j.id) === String(applied.id));
                if (!job) return null;
                return (
                  <div 
                    key={applied.id} 
                    onClick={() => navigate('/employee', { state: { selectedJobId: job.id } })}
                    className="pb-6 border-b border-gray-200 flex flex-col md:flex-row gap-4 hover:bg-gray-50 transition-colors -mx-4 px-4 pt-4 rounded-xl cursor-pointer group"
                  >
                    <div className="hidden md:flex w-12 h-12 items-center justify-center flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center font-bold text-gray-600 overflow-hidden shadow-sm">
                        {job.companyInitial}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <span className={`inline-block px-3 py-1 font-bold text-xs rounded-full mb-2 ${applied.status === 'Applied' ? 'bg-blue-100 text-blue-800' : (applied.status === 'Hired' || applied.status?.toLowerCase() === 'shortlisted' || applied.status === 'Viewed') ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'}`}>
                        {applied.status}
                      </span>
                      <h2 className="text-[17px] font-bold text-gray-900 group-hover:underline">{job.title}</h2>
                      <p className="text-[15px] text-gray-800 mt-1">{job.company}</p>
                      <p className="text-[15px] text-gray-800 mt-0.5">{job.location}, {job.details.workLocation}</p>
                      <p className="text-[13px] text-gray-500 mt-1">Applied on DreamJob on {applied.date}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 mt-4 md:mt-0 w-full md:w-auto">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button onClick={(e) => { e.stopPropagation(); openStatusModal(job.id); }} className="px-5 py-2 bg-white border border-blue-600 text-blue-700 font-bold rounded-xl transition-colors text-[15px] hover:bg-blue-50 w-full md:w-auto">
                          Update status
                        </button>
                        <button onClick={(e) => e.stopPropagation()} className="text-gray-900 hover:text-black p-1 hidden md:block">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
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

      {/* Update Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Update your application status</h3>
                <div className="flex items-center gap-2 mt-1 text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    <path fill="white" d="M2.71 3.16L1.29 4.58 4.2 7.49C2.78 8.78 1.69 10.33 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l2.04 2.04 1.41-1.41L2.71 3.16z"/>
                    <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2" />
                  </svg>
                  <span className="text-sm font-medium">Employers won't see this</span>
                </div>
              </div>
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Options */}
            <div className="flex flex-col">
              <button onClick={() => handleUpdateStatus('Hired')} className="flex items-center gap-4 p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900 group-hover:underline">Hired</span>
              </button>
              
              <button onClick={() => handleUpdateStatus('Not selected by employer')} className="flex items-center gap-4 p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900 group-hover:underline">Not selected by employer</span>
              </button>

              <button onClick={() => handleUpdateStatus('No longer interested')} className="flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors text-left group">
                <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900 group-hover:underline">No longer interested</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
