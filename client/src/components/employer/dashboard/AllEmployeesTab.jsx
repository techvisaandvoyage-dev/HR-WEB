import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { currentLocationOptions, preferredLocationOptions, isEmployeeCurrentLocationMatch, isEmployeePreferredLocationMatch } from '../../../data/preferredLocations';
import MultiSelectLocationDropdown from '../../common/MultiSelectLocationDropdown';
import VideoPlayer from '../../common/VideoPlayer';
import { formatPhoneWithCountryCode } from '../../../data/countryCodes';
import { isExperienceMatch } from '../../../utils/experienceMatcher';

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

const AllEmployeesTab = ({ portalConfig, candidates = [], jobs = [] }) => {
  const navigate = useNavigate();
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [preferredLocationFilter, setPreferredLocationFilter] = useState('');
  const [lastUpdateFilter, setLastUpdateFilter] = useState('All');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('employerToken');
        if (!token) throw new Error('No employer token found');

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/employees`, {
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
    'IT & Software', 'Finance & Accounts', 'Healthcare',
    'Manufacturing', 'Marketing', 'Sales', 'HR', 'Other'
  ].sort();
  
  const locationOptions = currentLocationOptions.map(opt => opt.value);

  const experienceOptions = [
    '0 - 1 Yrs', '2 - 3 Yrs', '4 - 6 Yrs', '7 - 10 Yrs', '11 - 15 Yrs', '16 - 20 Yrs', '21 - 25 Yrs', '25+ yrs'
  ];

  const getWorkExp = (emp) => {
    if (!emp) return 'Fresher';
    if (emp.professionalDetails?.totalExperience) return emp.professionalDetails.totalExperience;
    if (emp.totalExperience && emp.totalExperience !== 'N/A' && emp.totalExperience !== '') return emp.totalExperience;
    if (emp.workExp || emp.experienceYears) return emp.workExp || emp.experienceYears;
    if (emp.isFresher) return 'Fresher';
    if (Array.isArray(emp.experience) && emp.experience.length > 0) return `${emp.experience.length} ${emp.experience.length === 1 ? 'Year' : 'Years'}`;
    return 'Fresher';
  };

  const getPrimaryQualification = (emp) => {
    if (!emp) return 'N/A';
    if (emp.primaryQualification) return emp.primaryQualification;
    const quals = emp.qualifications || emp.education || [];
    if (!Array.isArray(quals) || quals.length === 0) return 'N/A';
    const primary = quals.find(q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1)) || quals[0];
    return primary?.course || primary?.educationType || primary?.degree || primary?.university || 'N/A';
  };

  const getCurrentDesignation = (emp) => {
    if (!emp) return 'N/A';
    if (emp.currentDesignation) return emp.currentDesignation;
    if (emp.designation) return emp.designation;
    const exps = emp.experience || [];
    if (Array.isArray(exps)) {
      const currentRole = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob))?.roles?.find(r => r.currentCompany || r.currentJob);
      if (currentRole?.jobTitle || currentRole?.title || currentRole?.role) return currentRole.jobTitle || currentRole.title || currentRole.role;
      if (exps[0]?.roles?.[0]?.jobTitle) return exps[0].roles[0].jobTitle;
      if (exps[0]?.title || exps[0]?.designation) return exps[0].title || exps[0].designation;
    }
    return emp.professionalDetails?.designation || 'N/A';
  };

  const getCurrentCompany = (emp) => {
    if (!emp) return 'N/A';
    if (emp.currentCompany) return emp.currentCompany;
    const exps = emp.experience || [];
    if (Array.isArray(exps)) {
      const currentExp = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob) || e.currentCompany || e.currentJob) || exps[0];
      if (currentExp?.companyName || currentExp?.company) return currentExp.companyName || currentExp.company;
    }
    return emp.professionalDetails?.currentCompany || 'N/A';
  };

  const formatExperienceDate = (value, fallback) => {
    if (!value) return fallback;
    const match = String(value).match(/^(\d{4})-(\d{1,2})$/);
    if (!match) {
      const d = new Date(value);
      return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return new Date(Number(match[1]), Number(match[2]) - 1, 1)
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const formatEducationYear = (qual) => {
    if (!qual) return '';
    const start = qual.startYear || qual.startingYear;
    const end = qual.endYear || qual.yearOfPassing || qual.passingYear || qual.graduationYear || qual.passingOutYear || qual.year;
    if (start && end) {
      return `${start} – ${end}`;
    }
    if (end) {
      return String(end);
    }
    if (start) {
      return `${start} – Present`;
    }
    return '';
  };

  const formatEducationScore = (qual) => {
    if (!qual) return '';
    const raw = qual.percentage ?? qual.cgpa ?? qual.score ?? qual.grade;
    if (raw === undefined || raw === null || raw === '') return '';
    
    const scoreStr = String(raw).trim();
    if (!scoreStr) return '';

    const system = (qual.gradingSystem || '').toLowerCase();

    // If already formatted with %, CGPA, or Grade
    if (scoreStr.includes('%') || scoreStr.toLowerCase().includes('cgpa') || scoreStr.toLowerCase().includes('grade')) {
      return scoreStr;
    }

    // Explicit grading system check
    if (system.includes('percent')) {
      return `${scoreStr}%`;
    }
    if (system.includes('4')) {
      return `${scoreStr} / 4 CGPA`;
    }
    if (system.includes('10') || system.includes('cgpa')) {
      return `${scoreStr} CGPA`;
    }
    if (system.includes('grade')) {
      return `Grade ${scoreStr}`;
    }

    // Automatic heuristic when gradingSystem is not explicitly set
    const num = parseFloat(scoreStr);
    if (!isNaN(num)) {
      if (num > 10) {
        return `${scoreStr}%`;
      } else {
        return `${scoreStr} CGPA`;
      }
    }

    // Letter grades (e.g. A, A+, B, Distinction)
    if (/^[A-DFa-df][+-]?$/.test(scoreStr)) {
      return `Grade ${scoreStr}`;
    }

    return scoreStr;
  };

  const handleMessageCandidate = async (emp) => {
    if (!emp) return;
    setIsInitiatingChat(true);
    try {
      const token = localStorage.getItem('employerToken');
      const targetId = emp._id || emp.id;
      const targetEmail = (emp.email || '').toLowerCase();

      // Check if candidate already has applications in candidates prop
      const matchedCand = candidates?.find(c => 
        (targetId && (c.id === targetId || c._id === targetId)) ||
        (targetEmail && c.email && c.email.toLowerCase() === targetEmail)
      );

      if (matchedCand && matchedCand.history && matchedCand.history.length > 0) {
        setSelectedEmployee(null);
        navigate('/employer/messages', { 
          state: { 
            initialEmployee: matchedCand,
            initialApplication: matchedCand.history[0]
          } 
        });
        return;
      }

      // Initiate or find conversation on backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/employer/messages/initiate/${targetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && data.application) {
        const appRecord = {
          appId: data.application._id,
          applicationNumber: data.application.applicationNumber || 500101,
          title: data.application.jobId?.title || 'Direct Candidate Outreach',
          status: data.application.status || 'Contacted',
          date: new Date(data.application.createdAt).toLocaleDateString(),
          createdAt: data.application.createdAt
        };
        const enrichedCand = {
          ...emp,
          id: targetId,
          history: [appRecord]
        };
        setSelectedEmployee(null);
        navigate('/employer/messages', {
          state: {
            initialEmployee: enrichedCand,
            initialApplication: appRecord
          }
        });
        return;
      }

      setSelectedEmployee(null);
      navigate('/employer/messages', { 
        state: { 
          initialEmployee: matchedCand || emp 
        } 
      });
    } catch (err) {
      console.error('Error initiating chat with candidate:', err);
      setSelectedEmployee(null);
      navigate('/employer/messages', { 
        state: { 
          initialEmployee: emp 
        } 
      });
    } finally {
      setIsInitiatingChat(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setExperienceFilter('All');
    setIndustryFilter('All');
    setLocationFilter('All');
    setPreferredLocationFilter('');
    setLastUpdateFilter('All');
  };

  const hasActiveFilters = searchQuery || experienceFilter !== 'All' || industryFilter !== 'All' || locationFilter !== 'All' || preferredLocationFilter || lastUpdateFilter !== 'All';

  const filteredEmployees = employees.filter(emp => {
    // Completely hide candidate row if profile is private and candidate has not applied to this employer
    if (Boolean(emp.isPrivate || (emp.isProfilePrivate && !emp.appliedToYou))) {
      return false;
    }

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = emp.name?.toLowerCase().includes(q);
      const matchesEmail = emp.email?.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail) return false;
    }

    // Experience Filter
    if (experienceFilter !== 'All') {
      const empExp = emp.totalExperience || (emp.experience?.length ? `${emp.experience.length} Years` : '');
      if (!isExperienceMatch(empExp, experienceFilter)) return false;
    }

    // Industry Filter
    if (industryFilter !== 'All') {
      // Get the explicit industry, or derive it using our algorithm, defaulting to 'Other'
      const derivedIndustry = emp.industry || designationToIndustryMap[emp.designation] || 'Other';
      if (!derivedIndustry.toLowerCase().includes(industryFilter.toLowerCase())) return false;
    }

    // Location Filter (Filters Candidate's Current Location)
    if (locationFilter !== 'All') {
      if (!isEmployeeCurrentLocationMatch(emp, locationFilter)) return false;
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

    // Preferred Location Filter (multi-select, filters Preferred Location)
    if (preferredLocationFilter) {
      const selectedLocs = preferredLocationFilter.split(',').map(v => v.trim()).filter(v => v);
      if (selectedLocs.length > 0) {
        const matchesAny = selectedLocs.some(loc => isEmployeePreferredLocationMatch(emp, loc));
        if (!matchesAny) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-bold text-[#147a2e] tracking-tight uppercase">
              {portalConfig?.title || 'Candidates'}
            </h1>
            {!loading && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/90 rounded-full text-xs font-black tracking-wide shadow-2xs">
                {hasActiveFilters 
                  ? `${filteredEmployees.length} of ${employees.length} Total` 
                  : `${employees.length} Total`}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {portalConfig?.subtitle || 'Browse and discover qualified candidates & talent on the platform.'}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-visible relative">
        
        {/* Filters Bar */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-[#ECECEC] shadow-sm relative z-30">
          <div className="flex gap-4 items-center flex-1 min-w-[280px] max-w-[500px]">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={portalConfig?.searchPlaceholder || "Search by name or email..."} 
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
            <div className="relative" style={{ minWidth: '220px' }}>
              <span className="block text-[11px] font-bold text-[#888888] tracking-wider uppercase mb-1">
                {portalConfig?.functionFilterLabel || 'Function'}
              </span>
              <MultiSelectLocationDropdown
                options={[{ value: 'All', label: 'All Functions' }, ...industryOptions.map(ind => ({ value: ind, label: ind }))]}
                value={industryFilter}
                onChange={(val) => setIndustryFilter(val)}
                multiple={false}
                placeholder="All Functions"
                className="w-full px-4 py-2.5 bg-[#FDFDFD] border border-[#ECECEC] rounded-xl text-[14px] font-semibold text-[#111111] transition-all hover:border-[#D1D1D1] focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999]"
              />
            </div>

            {/* Location Filter */}
            <div className="relative" style={{ minWidth: '280px' }}>
              <span className="block text-[11px] font-bold text-[#888888] tracking-wider uppercase mb-1">
                {portalConfig?.locationFilterLabel || 'Location'}
              </span>
              <MultiSelectLocationDropdown
                options={[{ value: 'All', label: 'All Locations' }, ...preferredLocationOptions]}
                value={locationFilter}
                onChange={(val) => setLocationFilter(val)}
                multiple={false}
                placeholder="All Locations"
                className="w-full px-4 py-2.5 bg-[#FDFDFD] border border-[#ECECEC] rounded-xl text-[14px] font-semibold text-[#111111] transition-all hover:border-[#D1D1D1] focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999]"
              />
            </div>

            {/* Experience Filter */}
            <div className="relative" style={{ minWidth: '180px' }}>
              <span className="block text-[11px] font-bold text-[#888888] tracking-wider uppercase mb-1">
                {portalConfig?.experienceFilterLabel || 'Experience'}
              </span>
              <MultiSelectLocationDropdown
                options={[{ value: 'All', label: 'All Exp' }, ...experienceOptions.map(exp => ({ value: exp, label: exp }))]}
                value={experienceFilter}
                onChange={(val) => setExperienceFilter(val)}
                multiple={false}
                placeholder="All Exp"
                className="w-full px-4 py-2.5 bg-[#FDFDFD] border border-[#ECECEC] rounded-xl text-[14px] font-semibold text-[#111111] transition-all hover:border-[#D1D1D1] focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999]"
              />
            </div>

            {/* Last Update Filter */}
            <div className="relative" style={{ minWidth: '180px' }}>
              <span className="block text-[11px] font-bold text-[#888888] tracking-wider uppercase mb-1">
                {portalConfig?.lastUpdateFilterLabel || 'Last Update'}
              </span>
              <MultiSelectLocationDropdown
                options={[
                  { value: 'All', label: 'Any time' },
                  { value: 'Past 24 hours', label: 'Past 24 hours' },
                  { value: 'Past week', label: 'Past week' },
                  { value: 'Past month', label: 'Past month' },
                ]}
                value={lastUpdateFilter}
                onChange={(val) => setLastUpdateFilter(val)}
                multiple={false}
                placeholder="Any time"
                className="w-full px-4 py-2.5 bg-[#FDFDFD] border border-[#ECECEC] rounded-xl text-[14px] font-semibold text-[#111111] transition-all hover:border-[#D1D1D1] focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999]"
              />
            </div>

            {/* Preferred Location Filter (Multi-select) */}
            <div className="relative" style={{ minWidth: '280px' }}>
              <span className="block text-[11px] font-bold text-[#888888] tracking-wider uppercase mb-1">Preferred Location</span>
              <MultiSelectLocationDropdown
                options={preferredLocationOptions}
                value={preferredLocationFilter}
                onChange={(val) => setPreferredLocationFilter(val)}
                multiple={true}
                placeholder="Any Preferred Location"
                className="w-full px-4 py-2.5 bg-[#FDFDFD] border border-[#ECECEC] rounded-xl text-[14px] font-semibold text-[#111111] transition-all hover:border-[#D1D1D1] focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999]"
              />
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading candidates...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-8">{error}</p>
          ) : filteredEmployees.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No candidates found.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold pb-4">Candidate</th>
                  <th className="px-6 py-4 font-semibold pb-4">Role & Exp</th>
                  <th className="px-6 py-4 font-semibold pb-4">Function</th>
                  <th className="px-6 py-4 font-semibold pb-4">Phone</th>
                  <th className="px-6 py-4 font-semibold pb-4">Location</th>
                  <th className="px-6 py-4 font-semibold pb-4">Account Created</th>
                  <th className="px-6 py-4 font-semibold pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEmployees.map((emp) => {
                  const isPrivate = Boolean(emp.isPrivate || (emp.isProfilePrivate && !emp.appliedToYou));

                  return (
                    <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#29953f] flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-sm">{emp.name}</h4>
                              {isPrivate && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                  🔒 Private
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {isPrivate ? (
                                <span className="text-gray-400 italic">Confidential profile</span>
                              ) : (
                                emp.email
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isPrivate ? (
                          <span className="text-xs text-gray-400 font-medium italic">Confidential</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-sm">{emp.designation || 'Not specified'}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{emp.totalExperience ? `${emp.totalExperience} Exp.` : 'N/A Exp.'}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {isPrivate ? (
                          <span className="text-xs text-gray-400 font-medium italic">Private</span>
                        ) : (
                          emp.industry || 'Not specified'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {isPrivate ? (
                          <span className="text-xs text-gray-400 font-medium italic">Hidden</span>
                        ) : (
                          formatPhoneWithCountryCode(emp.mobile, emp.countryCode) || 'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {isPrivate ? (
                          <span className="text-xs text-gray-400 font-medium italic">Hidden</span>
                        ) : (
                          emp.location || 'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        {new Date(emp.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedEmployee(emp)}
                          className={`p-2 rounded-lg transition-colors inline-flex ${
                            isPrivate ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`} 
                          title={isPrivate ? "Confidential Profile" : "View Profile"}
                        >
                          {isPrivate ? (
                            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Slide-over Profile Details Sidebar */}
      {selectedEmployee && (() => {
        const isSelectedPrivate = Boolean(selectedEmployee.isPrivate || (selectedEmployee.isProfilePrivate && !selectedEmployee.appliedToYou));
        return createPortal(
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedEmployee(null)}></div>
            <div className="fixed inset-y-0 right-0 max-w-full flex">
              <div className="relative w-screen max-w-md transform transition ease-in-out duration-500 bg-white shadow-xl flex flex-col">
                
                <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {isSelectedPrivate ? 'Confidential Candidate' : 'Profile Details'}
                  </h2>
                  <button 
                    onClick={() => setSelectedEmployee(null)}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  
                  {isSelectedPrivate ? (
                    <div className="flex flex-col items-center justify-center text-center py-8 px-2 space-y-5">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h3>
                        <span className="inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          🔒 Confidential / Private Profile
                        </span>
                      </div>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 max-w-sm leading-relaxed text-left space-y-2">
                        <p className="font-bold text-gray-800">Privacy Notice:</p>
                        <p>
                          This candidate has set their profile visibility to <strong>Private</strong>. Their contact info, work history, education, and resume are confidential.
                        </p>
                        <p className="text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/70 font-medium">
                          ✓ Candidate profile details will automatically unlock and become viewable once they submit an application to any of your active job listings.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                {/* Header (Avatar, Name, Email, Location) */}
                <div className="flex flex-col items-center text-center mb-6">
                  {selectedEmployee.avatar ? (
                    <img 
                      src={selectedEmployee.avatar} 
                      alt={selectedEmployee.name || 'Candidate'} 
                      className="w-20 h-20 rounded-full object-cover mb-3 shadow-sm ring-4 ring-emerald-50 border border-emerald-100" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#18a058] flex items-center justify-center text-white font-bold text-3xl mb-3 shadow-sm">
                      {selectedEmployee.name ? selectedEmployee.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h3>

                  {(getCurrentDesignation(selectedEmployee) !== 'N/A' || getCurrentCompany(selectedEmployee) !== 'N/A') && (
                    <p className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/80 mt-1.5 inline-block">
                      {getCurrentDesignation(selectedEmployee) !== 'N/A' ? getCurrentDesignation(selectedEmployee) : ''}
                      {getCurrentDesignation(selectedEmployee) !== 'N/A' && getCurrentCompany(selectedEmployee) !== 'N/A' ? ' • ' : ''}
                      {getCurrentCompany(selectedEmployee) !== 'N/A' ? getCurrentCompany(selectedEmployee) : ''}
                    </p>
                  )}

                  <p className="text-sm text-gray-500 mt-1">{selectedEmployee.email}</p>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">
                    {selectedEmployee.mobile && `${formatPhoneWithCountryCode(selectedEmployee.mobile, selectedEmployee.countryCode)} • `}
                    {selectedEmployee.location || selectedEmployee.preferredLocation || 'Location not provided'}
                  </p>
                </div>
                
                <hr className="border-gray-100 mb-6" />

                {/* Sections in exact Employee Profile order */}
                <div className="space-y-6">
                  
                  {/* 1. Basic Details - Professional Summary */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Brief About Candidate / Professional Summary</h4>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                      {selectedEmployee.brief || selectedEmployee.summary || selectedEmployee.bio || selectedEmployee.professionalDetails?.about || (
                        <span className="text-gray-400 italic">No professional summary provided.</span>
                      )}
                    </p>
                  </div>

                  <hr className="border-gray-100" />

                  {/* 2. Education */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Education &amp; Qualifications</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        Primary: {getPrimaryQualification(selectedEmployee)}
                      </span>
                    </div>

                    <div className="space-y-3 ml-1 pt-1">
                      {(selectedEmployee.qualifications || selectedEmployee.education) && (selectedEmployee.qualifications || selectedEmployee.education).length > 0 ? (
                        (() => {
                          const qualsList = selectedEmployee.qualifications || selectedEmployee.education;
                          const hasExplicitPrimary = qualsList.some(
                            q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1)
                          );

                          return qualsList.map((qual, i) => {
                            const isPrimary = Boolean(
                              qual.isPrimary === true ||
                              qual.isPrimary === 'true' ||
                              qual.isPrimary === 1 ||
                              (!hasExplicitPrimary && i === 0)
                            );
                            const eduYear = formatEducationYear(qual);
                            const eduScore = formatEducationScore(qual);
                            const title = qual.degree || qual.course || qual.educationType || 'Degree / Course';
                            const spec = qual.fieldOfStudy || qual.specialization;
                            const institute = qual.institution || qual.college || qual.university || qual.board || 'Institution / Board not specified';

                            return (
                              <div key={i} className="relative pl-4 mb-3 border-l-2 border-[#18a058] ml-1.5 py-0.5 space-y-1">
                                <div className="absolute w-2.5 h-2.5 bg-[#18a058] rounded-full -left-[6px] top-1.5 ring-4 ring-emerald-50"></div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-extrabold text-gray-900 text-xs">
                                    {title} {spec ? `in ${spec}` : ''}
                                  </h5>
                                  {isPrimary && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      Primary Education
                                    </span>
                                  )}
                                </div>
                                {(eduYear || eduScore) && (
                                  <p className="text-[11px] text-emerald-700 font-bold">
                                    {eduYear}
                                    {eduYear && eduScore ? ` • ${eduScore}` : eduScore}
                                    {qual.courseType ? ` • ${qual.courseType}` : ''}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {institute}
                                </p>
                              </div>
                            );
                          });
                        })()
                      ) : (
                        <span className="text-gray-400 italic text-xs">No education details provided.</span>
                      )}
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* 3. Work Experience */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Work Experience</h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        Total: {getWorkExp(selectedEmployee)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-gray-50/70 p-3 rounded-xl mb-4 border border-gray-100">
                      <div>
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase">Current Designation</h5>
                        <p className="text-xs font-extrabold text-gray-900 truncate">{getCurrentDesignation(selectedEmployee)}</p>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase">Current Company</h5>
                        <p className="text-xs font-extrabold text-gray-900 truncate">{getCurrentCompany(selectedEmployee)}</p>
                      </div>
                    </div>

                    <div className="space-y-4 ml-1">
                      {selectedEmployee.experience && selectedEmployee.experience.length > 0 ? (
                        selectedEmployee.experience.map((exp, i) => {
                          const isCurrent = Boolean(
                            exp.currentCompany ||
                            exp.currentJob ||
                            (Array.isArray(exp.roles) && exp.roles.some(r => r.currentCompany || r.currentJob || String(r.leavingDate || '').toLowerCase() === 'present')) ||
                            (i === 0 && getCurrentCompany(selectedEmployee) !== 'N/A' && (exp.company || exp.companyName || '').toLowerCase() === getCurrentCompany(selectedEmployee).toLowerCase())
                          );
                          const candidateNotice = (isCurrent && exp.noticePeriod) || selectedEmployee.noticePeriod || selectedEmployee.professionalDetails?.noticePeriod;

                          return (
                            <div key={i} className="mb-4">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h5 className="font-extrabold text-gray-900 text-xs">
                                  {exp.company || exp.companyName || 'Company Name'}
                                </h5>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Current Company
                                  </span>
                                )}
                                {isCurrent && candidateNotice && candidateNotice !== 'N/A' && (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                    Notice Period: {candidateNotice}
                                  </span>
                                )}
                              </div>

                              <div className="border-l-2 border-[#18a058] ml-1.5 space-y-3 py-1">
                                {(exp.roles && exp.roles.length > 0 ? exp.roles : [exp]).map((role, rIndex) => {
                                  const start = formatExperienceDate(role.joiningDate || role.startDate || exp.joiningDate || exp.startDate, 'Start');
                                  const isRoleCurrent = role.currentCompany || role.currentJob || exp.currentCompany || exp.currentJob || String(role.leavingDate || '').toLowerCase() === 'present';
                                  const end = isRoleCurrent ? 'Present' : formatExperienceDate(role.leavingDate || role.endDate || exp.leavingDate || exp.endDate, 'End');

                                  return (
                                    <div key={rIndex} className="relative pl-4 space-y-0.5">
                                      <div className="absolute w-2.5 h-2.5 bg-[#18a058] rounded-full -left-[6px] top-1.5 ring-4 ring-emerald-50"></div>
                                      <h5 className="font-bold text-emerald-800 text-xs">
                                        {role.jobTitle || role.title || role.role || exp.title || exp.designation || 'Position'}
                                      </h5>
                                      <p className="text-[11px] text-gray-400 font-medium">
                                        {start} – {end} {role.employmentType && ` • ${role.employmentType}`}
                                      </p>
                                      {(role.roleDescription || role.description || exp.roleDescription || exp.description) && (
                                        <p className="text-xs text-gray-600 leading-relaxed mt-1">
                                          {role.roleDescription || role.description || exp.roleDescription || exp.description}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 italic text-xs">No prior work experience recorded (Fresher).</span>
                      )}
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* 4. Key Skills & Preferences */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">
                      Key Skills &amp; Preferences
                    </h4>
                    
                    {/* Skills pills */}
                    <div className="mb-4">
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Key Skills</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const rawSkills = selectedEmployee.professionalDetails?.skills || selectedEmployee.skills;
                          const list = Array.isArray(rawSkills) 
                            ? rawSkills.map(s => (typeof s === 'string' ? s : s?.name || s?.label || String(s || ''))).filter(Boolean)
                            : typeof rawSkills === 'string' 
                              ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
                              : [];

                          if (list.length === 0) {
                            return <span className="text-gray-400 italic text-xs">No skills listed.</span>;
                          }

                          return list.map((skill, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-100/80">
                              {skill}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Preferences Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Function / Industry</span>
                        <span className="font-extrabold text-gray-900 text-xs">
                          {selectedEmployee.industry || selectedEmployee.function || selectedEmployee.professionalDetails?.functionalArea || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Experience</span>
                        <span className="font-extrabold text-gray-900 text-xs">{getWorkExp(selectedEmployee)}</span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Current {selectedEmployee.professionalDetails?.salaryType === 'Monthly' ? 'Monthly' : 'Annual'} CTC
                        </span>
                        <span className="font-extrabold text-gray-900 text-xs">
                          {selectedEmployee.professionalDetails?.currentSalary 
                            ? `₹ ${selectedEmployee.professionalDetails.currentSalary}` 
                            : (selectedEmployee.currentCTC ? `₹ ${selectedEmployee.currentCTC}` : 'N/A')}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                          Expected {selectedEmployee.professionalDetails?.salaryType === 'Monthly' ? 'Monthly' : 'Annual'} CTC
                        </span>
                        <span className="font-extrabold text-gray-900 text-xs">
                          {selectedEmployee.professionalDetails?.expectedSalary 
                            ? `₹ ${selectedEmployee.professionalDetails.expectedSalary}` 
                            : (selectedEmployee.expectedCTC ? `₹ ${selectedEmployee.expectedCTC}` : 'N/A')}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Preferred Location</span>
                        <span className="font-extrabold text-gray-900 text-xs">
                          {selectedEmployee.preferredLocation || selectedEmployee.professionalDetails?.preferredLocation || selectedEmployee.location || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Notice Period</span>
                        <span className="font-extrabold text-gray-900 text-xs">
                          {selectedEmployee.noticePeriod || selectedEmployee.professionalDetails?.noticePeriod || 'Immediate / N/A'}
                        </span>
                      </div>

                      {selectedEmployee.professionalDetails?.linkedinUrl && (
                        <div className="col-span-2 pt-1 border-t border-gray-200/50">
                          <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">LinkedIn Profile</span>
                          <a 
                            href={selectedEmployee.professionalDetails.linkedinUrl.startsWith('http') ? selectedEmployee.professionalDetails.linkedinUrl : `https://${selectedEmployee.professionalDetails.linkedinUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline truncate block"
                          >
                            {selectedEmployee.professionalDetails.linkedinUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr className="border-gray-100" />
                  
                  {/* 5. Documents & Media */}
                  {(selectedEmployee.resume || selectedEmployee.coverLetter || selectedEmployee.introVideo) && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Documents & Media</h4>
                      <div className="space-y-3">
                        {selectedEmployee.introVideo && selectedEmployee.videoVisibility !== 'applied' && (
                          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">Introductory Video</p>
                                  <p className="text-xs text-gray-500">Public Video Introduction</p>
                                </div>
                              </div>
                              <a 
                                href={selectedEmployee.introVideo} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="px-3 py-1.5 bg-[#0c7844] hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                              >
                                Watch Video
                              </a>
                            </div>
                            <VideoPlayer url={selectedEmployee.introVideo} maxPlayerHeight="220px" className="mt-2" />
                          </div>
                        )}
                        {selectedEmployee.resume && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">Resume</p>
                                <p className="text-xs text-gray-500">Document</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={selectedEmployee.resume} target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </a>
                              <a href={selectedEmployee.resume} download className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </a>
                            </div>
                          </div>
                        )}
                        {selectedEmployee.coverLetter && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">Cover Letter</p>
                                <p className="text-xs text-gray-500">Document</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={selectedEmployee.coverLetter} target="_blank" rel="noreferrer" className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </a>
                              <a href={selectedEmployee.coverLetter} download className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
                </>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-[#ECECEC] flex gap-3 shrink-0 p-6 bg-white">
                <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      );
    })()}
    </div>
  );
};

export default AllEmployeesTab;
