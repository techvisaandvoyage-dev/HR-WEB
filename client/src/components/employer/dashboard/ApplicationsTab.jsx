import React from 'react';

const ApplicationsTab = () => {
  const applications = [
    { id: 1, name: 'John Smith', email: 'john.smith@email.com', initials: 'JS', bg: 'bg-green-600', job: 'UI/UX Designer', date: 'May 24, 2025', status: 'New', statusColor: 'bg-blue-50 text-blue-600 border border-blue-100' },
    { id: 2, name: 'Alice Martin', email: 'alice.martin@email.com', initials: 'AM', bg: 'bg-blue-600', job: 'Frontend Developer', date: 'May 23, 2025', status: 'Shortlisted', statusColor: 'bg-green-50 text-green-600 border border-green-100' },
    { id: 3, name: 'Robert Johnson', email: 'robert.j@email.com', initials: 'RJ', bg: 'bg-orange-500', job: 'Frontend Developer', date: 'May 23, 2025', status: 'Viewed', statusColor: 'bg-orange-50 text-orange-600 border border-orange-100' },
    { id: 4, name: 'Neha Sharma', email: 'neha.sharma@email.com', initials: 'NS', bg: 'bg-pink-500', job: 'Content Writer', date: 'May 22, 2025', status: 'Interview Scheduled', statusColor: 'bg-purple-50 text-purple-600 border border-purple-100' },
    { id: 5, name: 'Daniel Williams', email: 'daniel.w@email.com', initials: 'DW', bg: 'bg-purple-600', job: 'UI/UX Designer', date: 'May 22, 2025', status: 'Rejected', statusColor: 'bg-red-50 text-red-600 border border-red-100' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-bold text-[#147a2e] tracking-tight uppercase">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage applications for all your jobs.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:w-[350px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search applications..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f] transition-all placeholder-gray-400"
            />
          </div>
          
          <div className="flex w-full sm:w-auto gap-3">
            <select className="flex-1 sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-[#29953f] transition-all bg-white cursor-pointer min-w-[150px]">
              <option>All Jobs</option>
              <option>UI/UX Designer</option>
              <option>Frontend Developer</option>
              <option>Content Writer</option>
            </select>
            <select className="flex-1 sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-[#29953f] transition-all bg-white cursor-pointer min-w-[150px]">
              <option>All Status</option>
              <option>New</option>
              <option>Shortlisted</option>
              <option>Viewed</option>
              <option>Interview</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold pb-4">Candidate</th>
                <th className="px-6 py-4 font-semibold pb-4">Job Title</th>
                <th className="px-6 py-4 font-semibold pb-4">Applied On</th>
                <th className="px-6 py-4 font-semibold pb-4 text-center">Status</th>
                <th className="px-6 py-4 font-semibold pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applications.map((app, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${app.bg}`}>
                        {app.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{app.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{app.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800 text-sm">{app.job}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">{app.date}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide min-w-[100px] ${app.statusColor}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Application">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-[#29953f] hover:bg-green-50 rounded-lg transition-colors" title="Resume">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Message">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="More">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default ApplicationsTab;
