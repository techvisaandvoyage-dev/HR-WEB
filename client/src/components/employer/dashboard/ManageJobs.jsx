import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ManageJobs = ({ jobs = [], candidates = [], toggleJobStatus, hideHeader = false }) => {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div className={`animate-in fade-in duration-300 ${hideHeader ? '' : 'space-y-6 pb-10'}`}>
      
      {!hideHeader && (
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[26px] font-bold text-[#147a2e] tracking-tight">MY JOBS</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and track all your job postings.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/employer/post-job"
              className="px-5 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="text-lg leading-none">+</span> Post New Job
            </Link>
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-green-700 shadow-sm cursor-pointer">
              C
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:w-[350px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search jobs by title..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f] transition-all placeholder-gray-400"
            />
          </div>
          
          <select className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-[#29953f] transition-all bg-white cursor-pointer">
            <option>All Status</option>
            <option>Active</option>
            <option>Closed</option>
          </select>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.map(job => {
            const isClosed = job.status === 'Closed';
            const statusColor = job.statusColor || (isClosed ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700');
            const displayStatus = job.status || 'Active';
            const iconColor = job.iconColor || 'text-green-500 bg-green-50';
            const jobType = job.type || `${job.details?.employmentType || 'Full-time'} • ${job.details?.workLocation || 'Remote'} • ${job.salary || 'Not specified'}`;
            const appsCount = Math.max(job.applications || 0, candidates?.filter(c => c.history?.some(h => h.title === job.title))?.length || 0);
            const postedDate = job.date || job.postedAt || 'Recently';

            return (
              <div key={job.id} className={`flex flex-col sm:flex-row items-center justify-between p-5 rounded-xl border transition-all gap-4 ${isClosed ? 'border-gray-100 bg-gray-50/50 opacity-75' : 'border-gray-100 hover:border-green-200 hover:shadow-sm'}`}>
                
                {/* Job Info */}
                <div className="flex items-center gap-4 w-full sm:w-[30%]">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-current opacity-80 ${iconColor}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{job.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{jobType}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-row items-center justify-between w-full sm:w-[70%]">
                  
                  <div className="text-center w-1/4">
                    <h4 className="font-bold text-gray-900 text-sm">
                      {appsCount}
                    </h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mt-0.5">Applications</p>
                  </div>

                  <div className="text-center w-1/4">
                    <select 
                      value={isClosed ? 'Closed' : 'Active'}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (toggleJobStatus) toggleJobStatus(job.id);
                      }}
                      className={`inline-flex items-center pl-2 pr-6 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide cursor-pointer hover:opacity-80 transition-opacity outline-none text-center ${statusColor}`}
                    >
                      <option value="Active" className="text-gray-900 bg-white font-bold">ACTIVE</option>
                      <option value="Closed" className="text-gray-900 bg-white font-bold">CLOSED</option>
                    </select>
                  </div>

                  <div className="text-center w-1/4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">{isClosed ? 'Closed on' : 'Posted on'}</p>
                    <p className="font-bold text-gray-900 text-xs mt-0.5">{postedDate}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 w-1/4 shrink-0">
                    <Link
                      to="/employer/post-job"
                      state={{ jobToEdit: job }}
                      className="p-2 text-gray-400 hover:text-[#29953f] hover:bg-green-50 rounded-lg transition-colors flex"
                      title="Edit Job"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H5a2 2 0 00-2 2v13a1 1 0 001 1h13a2 2 0 001-1v-6M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </Link>
                    <Link to="/employer/applications" state={{ jobTitle: job.title }} className="p-2 text-gray-400 hover:text-[#29953f] hover:bg-green-50 rounded-lg transition-colors flex" title="View Applications">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </Link>
                    <button onClick={() => setSelectedJob(job)} className="hidden lg:flex p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Job Info">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-8">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-green-700 bg-green-50 font-bold text-sm">1</button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold text-sm">2</button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

      </div>

      {/* Overlapping Right Sidebar Drawer for Job Details */}
      {selectedJob && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-300"
            onClick={() => setSelectedJob(null)}
          ></div>

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 p-6 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full border-l border-gray-100">
            
            {/* Sidebar Header (Fixed) */}
            <div className="flex justify-between items-start mb-6 shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">Job Details</h3>
              <button 
                onClick={() => setSelectedJob(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              
              {/* Basic Info */}
              <div className="border-b border-gray-100 pb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                    {selectedJob.type || `${selectedJob.details?.employmentType || 'Full-time'} • ${selectedJob.details?.workLocation || 'Remote'}`}
                  </span>
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${selectedJob.status === 'Closed' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                    {selectedJob.status || 'Active'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Applicants</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{Math.max(selectedJob.applications || 0, candidates?.filter(c => c.history?.some(h => h.title === selectedJob.title))?.length || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Posted On</p>
                    <p className="text-sm font-bold text-gray-900 mt-2">{selectedJob.date || selectedJob.postedAt || 'Recently'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Salary</p>
                    <p className="text-sm font-bold text-gray-900 mt-2">{selectedJob.salary || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              {/* Job Details Container */}
              <div className="space-y-4 pt-2">
                {selectedJob.details?.jobTitle && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2">Job Title:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.jobTitle}</span>
                  </div>
                )}
                
                {selectedJob.details?.employmentType && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2">Employment Type:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.employmentType}</span>
                  </div>
                )}
                
                {selectedJob.details?.experience && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2">Experience:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.experience}</span>
                  </div>
                )}

                {selectedJob.details?.aboutRole && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2">About Role:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.aboutRole}</span>
                  </div>
                )}
                
                {selectedJob.details?.responsibilities && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2 block mb-1">Responsibilities:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.responsibilities}</span>
                  </div>
                )}
                
                {selectedJob.qualifications && selectedJob.qualifications.length > 0 ? (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2 block mb-2">Skills Required:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.qualifications.map((q, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {q.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : selectedJob.details?.skills ? (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2 block mb-1">Skills Required:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.skills}</span>
                  </div>
                ) : null}

                {selectedJob.salary && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2">Salary:</span>
                    <span className="text-sm text-gray-600">{selectedJob.salary}</span>
                  </div>
                )}

                {selectedJob.details?.qualification && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2">Qualification:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.qualification}</span>
                  </div>
                )}
                
                {selectedJob.details?.stream && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2">Stream:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.stream}</span>
                  </div>
                )}

                {selectedJob.details?.category && (
                  <div>
                    <span className="text-sm font-bold text-gray-900 mr-2">Job Category:</span>
                    <span className="text-sm text-gray-600">{selectedJob.details.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Footer Actions (Fixed) */}
            <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3 shrink-0">
              <Link 
                to="/employer/applications" 
                state={{ jobTitle: selectedJob.title }}
                className="w-full py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm text-center"
              >
                View Applications
              </Link>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default ManageJobs;
