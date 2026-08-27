import React, { useState, useEffect } from 'react';

// Mapping algorithm to categorize employee designations into broader industries
const designationToIndustryMap = {
  // IT & Software
  'Software Engineer': 'IT & Software',
  'Senior Software Engineer': 'IT & Software',
  'Frontend Developer': 'IT & Software',
  'Backend Developer': 'IT & Software',
  'Full Stack Developer': 'IT & Software',
  'Mobile App Developer': 'IT & Software',
  'DevOps Engineer': 'IT & Software',
  'QA Engineer': 'IT & Software',
  'System Administrator': 'IT & Software',
  'Database Administrator': 'IT & Software',
  'Cloud Architect': 'IT & Software',
  'Data Scientist': 'IT & Software',
  'Data Analyst': 'IT & Software',
  'Machine Learning Engineer': 'IT & Software',
  'Network Engineer': 'IT & Software',
  'Security Analyst': 'IT & Software',
  'UI/UX Designer': 'IT & Software',
  'Product Designer': 'IT & Software',
  
  // Marketing
  'Marketing Executive': 'Marketing',
  'Digital Marketing Manager': 'Marketing',
  'Content Writer': 'Marketing',
  'SEO Specialist': 'Marketing',
  
  // Sales
  'Sales Manager': 'Sales',
  'Sales Executive': 'Sales',
  'Business Development Manager': 'Sales',
  'Account Manager': 'Sales',
  'Customer Success Manager': 'Sales',
  
  // HR
  'HR Manager': 'HR',
  'HR Executive': 'HR',
  'Talent Acquisition Specialist': 'HR',
  
  // Finance & Accounts
  'Financial Analyst': 'Finance & Accounts',
  'Accountant': 'Finance & Accounts',
  
  // Other Corporate Roles
  'Operations Manager': 'Other',
  'Business Analyst': 'Other',
  'Consultant': 'Other',
  'Legal Advisor': 'Other',
  'Product Manager': 'IT & Software',
  'Project Manager': 'IT & Software',
  'Scrum Master': 'IT & Software',
  'Graphic Designer': 'Other',
};

const AllEmployeesTab = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [lastUpdateFilter, setLastUpdateFilter] = useState('All');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('employerToken');
        if (!token) throw new Error('No employer token found');

        const res = await fetch(`\${import.meta.env.VITE_API_URL}/api/employer/employees`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();
        if (data.success) {
          setEmployees(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch employees');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const industryOptions = [
    'IT & Software', 'BPO/KPO', 'Finance & Accounts', 'Healthcare',
    'Manufacturing', 'Education', 'Marketing', 'Sales', 'HR', 'Other'
  ].sort();
  
  const locationOptions = [
    'Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Remote'
  ].sort();

  const experienceOptions = [
    '0 - 1 Yrs', '2 - 3 Yrs', '4 - 6 Yrs', '7 - 10 Yrs', '11 - 15 Yrs', '16 - 20 Yrs', '21 - 25 Yrs', '25+ yrs'
  ];

  const clearFilters = () => {
    setSearchQuery('');
    setExperienceFilter('All');
    setIndustryFilter('All');
    setLocationFilter('All');
    setLastUpdateFilter('All');
  };

  const hasActiveFilters = searchQuery || experienceFilter !== 'All' || industryFilter !== 'All' || locationFilter !== 'All' || lastUpdateFilter !== 'All';

  const filteredEmployees = employees.filter(emp => {
    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = emp.name?.toLowerCase().includes(q);
      const matchesEmail = emp.email?.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail) return false;
    }

    // Experience Filter
    if (experienceFilter !== 'All') {
      if (emp.totalExperience !== experienceFilter) return false;
    }

    // Industry Filter
    if (industryFilter !== 'All') {
      // Get the explicit industry, or derive it using our algorithm, defaulting to 'Other'
      const derivedIndustry = emp.industry || designationToIndustryMap[emp.designation] || 'Other';
      if (!derivedIndustry.toLowerCase().includes(industryFilter.toLowerCase())) return false;
    }

    // Location Filter
    if (locationFilter !== 'All') {
      const empLoc = emp.location || emp.preferredLocation || '';
      if (!empLoc.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    }

    // Last Update Filter
    if (lastUpdateFilter !== 'All') {
      const updatedDate = new Date(emp.updatedAt || emp.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - updatedDate);
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (lastUpdateFilter === 'Past 24 hours' && diffHours > 24) return false;
      if (lastUpdateFilter === 'Past week' && diffDays > 7) return false;
      if (lastUpdateFilter === 'Past month' && diffDays > 30) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-bold text-[#147a2e] tracking-tight uppercase">All Employees</h1>
          <p className="text-gray-500 text-sm mt-1">Browse all registered employees on the platform.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        
        {/* Filters Bar */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-[#ECECEC] shadow-sm">
          <div className="flex gap-4 items-center flex-1 min-w-[280px] max-w-[500px]">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..." 
                className="w-full pl-9 pr-4 py-2 border border-[#ECECEC] rounded-lg text-sm focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all placeholder-gray-400"
              />
            </div>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="text-sm font-semibold text-[#888888] hover:text-[#111111] transition-colors whitespace-nowrap px-2"
              >
                Clear filters
              </button>
            )}
          </div>
          
          <div className="flex gap-3 flex-wrap items-center">
            {/* Industry Filter */}
            <div className="flex items-center bg-[#FDFDFD] border border-[#ECECEC] rounded-xl px-4 py-2 hover:border-[#D1D1D1] transition-colors focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999] h-[42px] relative overflow-hidden">
              <span className="text-[12px] font-bold text-[#666666] tracking-wider uppercase mr-3 shrink-0">Industry</span>
              <select 
                className="bg-transparent border-none text-[14px] font-semibold text-[#111111] focus:ring-0 cursor-pointer outline-none appearance-none pr-6 relative w-32 truncate"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="All">All Industries</option>
                {industryOptions.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#888888]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Location Filter */}
            <div className="flex items-center bg-[#FDFDFD] border border-[#ECECEC] rounded-xl px-4 py-2 hover:border-[#D1D1D1] transition-colors focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999] h-[42px] relative overflow-hidden">
              <span className="text-[12px] font-bold text-[#666666] tracking-wider uppercase mr-3 shrink-0">Location</span>
              <select 
                className="bg-transparent border-none text-[14px] font-semibold text-[#111111] focus:ring-0 cursor-pointer outline-none appearance-none pr-6 relative w-32 truncate"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="All">All Locations</option>
                {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#888888]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Experience Filter */}
            <div className="flex items-center bg-[#FDFDFD] border border-[#ECECEC] rounded-xl px-4 py-2 hover:border-[#D1D1D1] transition-colors focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999] h-[42px] relative overflow-hidden">
              <span className="text-[12px] font-bold text-[#666666] tracking-wider uppercase mr-3 shrink-0">Exp</span>
              <select 
                className="bg-transparent border-none text-[14px] font-semibold text-[#111111] focus:ring-0 cursor-pointer outline-none appearance-none pr-6 relative w-32 truncate"
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
              >
                <option value="All">All Exp</option>
                {experienceOptions.map(exp => <option key={exp} value={exp}>{exp}</option>)}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#888888]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Last Update Filter */}
            <div className="flex items-center bg-[#FDFDFD] border border-[#ECECEC] rounded-xl px-4 py-2 hover:border-[#D1D1D1] transition-colors focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999] h-[42px] relative overflow-hidden">
              <span className="text-[12px] font-bold text-[#666666] tracking-wider uppercase mr-3 shrink-0">Update</span>
              <select 
                className="bg-transparent border-none text-[14px] font-semibold text-[#111111] focus:ring-0 cursor-pointer outline-none appearance-none pr-6 relative w-32 truncate"
                value={lastUpdateFilter}
                onChange={(e) => setLastUpdateFilter(e.target.value)}
              >
                <option value="All">Any time</option>
                <option value="Past 24 hours">Past 24 hours</option>
                <option value="Past week">Past week</option>
                <option value="Past month">Past month</option>
              </select>
              <div className="pointer-events-none absolute right-4 text-[#888888]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading employees...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : filteredEmployees.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No employees found.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold pb-4">Employee</th>
                  <th className="px-6 py-4 font-semibold pb-4">Role & Exp</th>
                  <th className="px-6 py-4 font-semibold pb-4">Phone</th>
                  <th className="px-6 py-4 font-semibold pb-4">Location</th>
                  <th className="px-6 py-4 font-semibold pb-4">Account Created</th>
                  <th className="px-6 py-4 font-semibold pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#29953f] flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{emp.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 text-sm">{emp.designation || 'Not specified'}</span>
                        <span className="text-xs text-gray-500 mt-0.5">{emp.totalExperience ? `${emp.totalExperience} Exp.` : 'N/A Exp.'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {emp.mobile || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                      {emp.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {new Date(emp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedEmployee(emp)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex" 
                        title="View Profile"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Slide-over Profile Details Sidebar */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedEmployee(null)}></div>
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <div className="relative w-screen max-w-md transform transition ease-in-out duration-500 bg-white shadow-xl flex flex-col">
              
              <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                
                {/* Header (Avatar, Name, Email, Location) */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#18a058] flex items-center justify-center text-white font-bold text-3xl mb-3">
                    {selectedEmployee.name ? selectedEmployee.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedEmployee.email}</p>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">
                    {selectedEmployee.mobile && `${selectedEmployee.mobile} • `}
                    {selectedEmployee.location || 'Location not provided'}
                  </p>
                </div>
                
                <hr className="border-gray-100 mb-6" />

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Annual Salary</h4>
                    <p className="text-sm font-bold text-gray-900">{selectedEmployee.professionalDetails?.currentSalary || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expected Annual Salary</h4>
                    <p className="text-sm font-bold text-gray-900">{selectedEmployee.professionalDetails?.expectedSalary || 'N/A'}</p>
                  </div>
                </div>

                <hr className="border-gray-100 mb-6" />

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Applied On</h4>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedEmployee.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resume</h4>
                    {selectedEmployee.resume ? (
                      <div className="flex items-center gap-3">
                        <a href={selectedEmployee.resume} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#18a058] flex items-center gap-1 hover:underline">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Preview
                        </a>
                        <a href={selectedEmployee.resume} download className="text-sm font-bold text-gray-500 flex items-center gap-1 hover:text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Download
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-gray-900">N/A</p>
                    )}
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Professional Summary</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedEmployee.brief || <span className="text-gray-400 italic">No professional summary provided.</span>}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.professionalDetails?.skills && selectedEmployee.professionalDetails.skills.length > 0 ? (
                        (typeof selectedEmployee.professionalDetails.skills === 'string' 
                          ? selectedEmployee.professionalDetails.skills.split(',') 
                          : Array.isArray(selectedEmployee.professionalDetails.skills) 
                            ? selectedEmployee.professionalDetails.skills 
                            : []).map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-semibold border border-gray-100">
                            {skill.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">No skills provided.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Work Experience</h4>
                    <div className="space-y-4 ml-2">
                      {selectedEmployee.experience && selectedEmployee.experience.length > 0 ? (
                        selectedEmployee.experience.map((exp, i) => (
                          <div key={i} className="mb-4">
                            <h5 className="font-bold text-gray-900 text-sm mb-2">{exp.company || 'Company'}</h5>
                            <div className="border-l-2 border-[#29953f] ml-1.5 space-y-4 py-1">
                              {/* Using roles if they exist or fallback to the parent exp obj */}
                              {(exp.roles && exp.roles.length > 0 ? exp.roles : [exp]).map((role, rIndex) => {
                                const formatDate = (dateStr) => {
                                  if (!dateStr) return '';
                                  const d = new Date(dateStr);
                                  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                };
                                const startDate = role.startDate ? formatDate(role.startDate) : 'Start';
                                const endDate = role.currentJob ? 'Present' : (role.endDate ? formatDate(role.endDate) : 'Present');

                                return (
                                  <div key={rIndex} className="relative pl-4">
                                    <div className="absolute w-2 h-2 bg-[#29953f] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                                    <h5 className="font-bold text-gray-900 text-sm">{role.jobTitle || 'Role'}</h5>
                                    <p className="text-[13px] text-gray-500 font-medium mb-1">
                                      {startDate} - {endDate} <span className="text-gray-300 mx-1">|</span> {role.employmentType || 'Full-time'}
                                    </p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{role.description || 'No description provided.'}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">No work experience provided.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Education</h4>
                    <div className="space-y-4 ml-2">
                      {selectedEmployee.qualifications && selectedEmployee.qualifications.length > 0 ? (
                        selectedEmployee.qualifications.map((qual, i) => (
                          <div key={i} className="relative pl-4 mb-4">
                            <div className="absolute w-2 h-2 bg-[#18a058] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                            <h5 className="font-bold text-gray-900 text-sm">{qual.degree} {qual.fieldOfStudy ? `in ${qual.fieldOfStudy}` : ''}</h5>
                            <p className="text-xs text-[#18a058] font-semibold mb-1">{qual.graduationYear || 'Year'}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{qual.institution || 'Institution'}</p>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">No education details provided.</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-[#ECECEC] flex gap-3 shrink-0 p-6 bg-white">
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="w-full py-3 bg-[#111] hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                >
                  Message Candidate
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllEmployeesTab;
