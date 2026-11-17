import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateProfileFullScreen from './CandidateProfileFullScreen';
import { currentLocationOptions, preferredLocationOptions, isEmployeeCurrentLocationMatch, isEmployeePreferredLocationMatch } from '../../../data/preferredLocations';
import MultiSelectLocationDropdown from '../../common/MultiSelectLocationDropdown';
import { formatPhoneWithCountryCode } from '../../../data/countryCodes';
import { isExperienceMatch } from '../../../utils/experienceMatcher';
import { 
  exportCandidateProfileAsPdf, 
  exportCandidateProfileAsDoc 
} from '../../../utils/candidateProfileExporter';

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
  'Senior Accountant': 'Finance & Accounts',
  'Financial Controller': 'Finance & Accounts',
  'Quality Analyst': 'Manufacturing',
  
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

const AllEmployeesTab = ({ portalConfig, candidates = [], jobs = [], employerProfile = null }) => {
  const navigate = useNavigate();
  const [isInitiatingChat, setIsInitiatingChat] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [previewScreeningQA, setPreviewScreeningQA] = useState(null);
  const [previewDownloads, setPreviewDownloads] = useState(null);
  const [docModalTab, setDocModalTab] = useState('resume');
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [preferredLocationFilter, setPreferredLocationFilter] = useState('');
  const [avatarFailedMap, setAvatarFailedMap] = useState({});
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
    if (!emp) return 'Not specified';
    if (emp.designation) return emp.designation;
    if (emp.currentDesignation) return emp.currentDesignation;
    const exps = emp.experience || [];
    if (Array.isArray(exps)) {
      const currentRole = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob))?.roles?.find(r => r.currentCompany || r.currentJob);
      if (currentRole?.jobTitle || currentRole?.title || currentRole?.role) return currentRole.jobTitle || currentRole.title || currentRole.role;
      if (exps[0]?.roles?.[0]?.jobTitle) return exps[0].roles[0].jobTitle;
      if (exps[0]?.title || exps[0]?.designation) return exps[0].title || exps[0].designation;
    }
    return emp.professionalDetails?.designation || 'Not specified';
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

  // Helper to extract candidate profile avatar
  const getCandidateAvatar = (emp) => {
    if (!emp) return '';
    const empId = emp._id || emp.id;
    const empEmail = (emp.email || '').toLowerCase().trim();
    
    // 1. Direct fields on emp
    const directAvatar = emp.avatar || emp.profilePhoto || emp.profilePicture || emp.photo || emp.personalDetails?.profilePhoto;
    if (directAvatar && typeof directAvatar === 'string' && directAvatar.trim()) {
      return directAvatar.trim();
    }

    // 2. Cross-match in candidates prop (which has application data + enriched candidate profiles)
    if (Array.isArray(candidates)) {
      const matched = candidates.find(c => {
        const cId = c._id || c.id;
        const cEmail = (c.email || '').toLowerCase().trim();
        return (empId && cId && String(empId) === String(cId)) || (empEmail && cEmail && empEmail === cEmail);
      });
      if (matched) {
        const matchedAvatar = matched.avatar || matched.profilePhoto || matched.profilePicture || matched.photo || matched.personalDetails?.profilePhoto;
        if (matchedAvatar && typeof matchedAvatar === 'string' && matchedAvatar.trim()) {
          return matchedAvatar.trim();
        }
      }
    }

    return '';
  };

  const getCandidateInitials = (name = '') => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const isCandidateVerified = (emp) => {
    if (emp.isVerified || emp.verified || emp.verification?.isVerified) return true;
    const empId = emp._id || emp.id;
    const empEmail = (emp.email || '').toLowerCase().trim();
    if (Array.isArray(candidates)) {
      const matched = candidates.find(c => {
        const cId = c._id || c.id;
        const cEmail = (c.email || '').toLowerCase().trim();
        return (empId && cId && String(empId) === String(cId)) || (empEmail && cEmail && empEmail === cEmail);
      });
      if (matched && (matched.isVerified || matched.verified || matched.verification?.isVerified)) {
        return true;
      }
    }
    return false;
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
      const q = searchQuery.toLowerCase().trim();
      const matchesName = emp.name?.toLowerCase().includes(q);
      const matchesEmail = emp.email?.toLowerCase().includes(q);
      const matchesDesig = (emp.designation || '').toLowerCase().includes(q) || (emp.currentDesignation || '').toLowerCase().includes(q);
      const matchesIndustry = (emp.industry || '').toLowerCase().includes(q);
      const matchesLocation = (emp.location || '').toLowerCase().includes(q);
      if (!matchesName && !matchesEmail && !matchesDesig && !matchesIndustry && !matchesLocation) return false;
    }

    // Experience Filter
    if (experienceFilter !== 'All') {
      const empExp = emp.totalExperience || (emp.experience?.length ? `${emp.experience.length} Years` : '');
      if (!isExperienceMatch(empExp, experienceFilter)) return false;
    }

    // Industry Filter
    if (industryFilter !== 'All') {
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
      
      {/* 1. Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {portalConfig?.title || 'Candidates'}
            </h1>
            {!loading && (
              <span className="px-3 py-1 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full text-xs font-bold whitespace-nowrap">
                {hasActiveFilters 
                  ? `${filteredEmployees.length} of ${employees.length} Candidates` 
                  : `${employees.length} Candidates`}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {portalConfig?.subtitle || 'Browse and discover qualified candidates & talent on the platform.'}
          </p>
        </div>

        {hasActiveFilters && (
          <button 
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start md:self-auto shadow-none"
            title="Reset all filters"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* 2. Main Content Card (Filters + Candidates Table) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-visible relative">
        
        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          
          {/* Search bar */}
          <div className="relative max-w-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={portalConfig?.searchPlaceholder || "Search by candidate name, role, email or location..."} 
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-800 focus:outline-none focus:border-[#059669] transition-all placeholder-gray-400 shadow-none"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Function Filter */}
            <div className="min-w-0">
              <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Function</span>
              <MultiSelectLocationDropdown
                options={[{ value: 'All', label: 'All Functions' }, ...industryOptions.map(ind => ({ value: ind, label: ind }))]}
                value={industryFilter}
                onChange={(val) => setIndustryFilter(val)}
                multiple={false}
                placeholder="All Functions"
                className="w-full px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-gray-300 transition-colors shadow-none"
              />
            </div>

            {/* Location Filter */}
            <div className="min-w-0">
              <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Location</span>
              <MultiSelectLocationDropdown
                options={[{ value: 'All', label: 'All Locations' }, ...preferredLocationOptions]}
                value={locationFilter}
                onChange={(val) => setLocationFilter(val)}
                multiple={false}
                placeholder="All Locations"
                className="w-full px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-gray-300 transition-colors shadow-none"
              />
            </div>

            {/* Experience Filter */}
            <div className="min-w-0">
              <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Experience</span>
              <MultiSelectLocationDropdown
                options={[{ value: 'All', label: 'All Exp' }, ...experienceOptions.map(exp => ({ value: exp, label: exp }))]}
                value={experienceFilter}
                onChange={(val) => setExperienceFilter(val)}
                multiple={false}
                placeholder="All Exp"
                className="w-full px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-gray-300 transition-colors shadow-none"
              />
            </div>

            {/* Preferred Location Filter */}
            <div className="min-w-0">
              <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Preferred Location</span>
              <MultiSelectLocationDropdown
                options={preferredLocationOptions}
                value={preferredLocationFilter}
                onChange={(val) => setPreferredLocationFilter(val)}
                multiple={true}
                placeholder="Any Location"
                className="w-full px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-gray-300 transition-colors shadow-none"
              />
            </div>

            {/* Last Update Filter */}
            <div className="min-w-0">
              <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Update</span>
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
                className="w-full px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-gray-300 transition-colors shadow-none"
              />
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 text-xs font-medium">Loading candidates...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-xs font-semibold">{error}</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-900 font-bold text-sm">No candidates found</p>
              <p className="text-gray-500 text-xs mt-1">Try adjusting or clearing your filters to see more results.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-bold bg-[#059669] text-white hover:bg-[#047857] transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/75 border-b border-gray-200">
                  <th className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">Candidate</th>
                  <th className="px-5 py-3.5 min-w-[190px] whitespace-nowrap">Role & Exp</th>
                  <th className="px-5 py-3.5 min-w-[150px] whitespace-nowrap">Function</th>
                  <th className="px-5 py-3.5 min-w-[140px] whitespace-nowrap">Phone</th>
                  <th className="px-5 py-3.5 min-w-[130px] whitespace-nowrap">Location</th>
                  <th className="px-5 py-3.5 min-w-[130px] whitespace-nowrap">Account Created</th>
                  <th className="px-5 py-3.5 w-[110px] text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp) => {
                  const isPrivate = Boolean(emp.isPrivate || (emp.isProfilePrivate && !emp.appliedToYou));
                  const candAvatar = getCandidateAvatar(emp);
                  const candKey = emp._id || emp.id || emp.email;
                  const verified = isCandidateVerified(emp);

                  return (
                    <tr 
                      key={emp._id || emp.id} 
                      onClick={() => setSelectedEmployee(emp)}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Candidate Name & Avatar */}
                      <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {candAvatar && !avatarFailedMap[candKey] ? (
                            <img 
                              src={candAvatar} 
                              alt={emp.name || 'Candidate'} 
                              onError={() => setAvatarFailedMap(prev => ({ ...prev, [candKey]: true }))}
                              className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-gray-200 shadow-none" 
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-none ${emp.bg || 'bg-slate-900'}`}>
                              {getCandidateInitials(emp.name)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-gray-900 text-sm leading-tight truncate group-hover:text-[#059669] transition-colors">
                                {emp.name}
                              </h4>
                              {verified && (
                                <svg
                                  className="w-4 h-4 text-sky-600 shrink-0"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-label="Verified candidate"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.548 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.548 4.49 4.49 0 01-3.498-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497A4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                  />
                                </svg>
                              )}
                              {isPrivate && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                                  🔒 Private
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {isPrivate ? (
                                <span className="text-gray-400 italic">Confidential profile</span>
                              ) : (
                                emp.email
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Experience */}
                      <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                        {isPrivate ? (
                          <span className="text-xs text-gray-400 font-medium italic">Confidential</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm leading-tight">
                              {getCurrentDesignation(emp)}
                            </span>
                            <span className="inline-block mt-1">
                              <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200/60">
                                {getWorkExp(emp)}
                              </span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Function */}
                      <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                        {isPrivate ? (
                          <span className="text-xs text-gray-400 font-medium italic">Private</span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                            {emp.industry || designationToIndustryMap[emp.designation] || 'General'}
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                        {isPrivate ? (
                          <span className="text-xs text-gray-400 font-medium italic">Hidden</span>
                        ) : (
                          <span className="font-mono text-xs text-gray-700 font-semibold">
                            {formatPhoneWithCountryCode(emp.mobile, emp.countryCode) || 'N/A'}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-5 py-3.5 align-middle whitespace-nowrap">
                        {isPrivate ? (
                          <span className="text-xs text-gray-400 font-medium italic">Hidden</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-gray-700 font-medium">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate max-w-[150px]">{emp.location || 'N/A'}</span>
                          </span>
                        )}
                      </td>

                      {/* Account Created Date */}
                      <td className="px-5 py-3.5 align-middle text-xs text-gray-500 font-medium whitespace-nowrap">
                        {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>

                      {/* Actions: ONLY Eye Button to View Profile */}
                      <td className="px-5 py-3.5 align-middle text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <div className="relative group/tip inline-flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={() => setSelectedEmployee(emp)}
                              className="w-8 h-8 inline-flex items-center justify-center text-gray-600 hover:text-[#059669] hover:bg-emerald-50 rounded-full border border-gray-200 hover:border-emerald-300 bg-white transition-colors cursor-pointer shadow-none"
                              aria-label="View Profile"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <div className="absolute bottom-[calc(100%+7px)] right-0 bg-[#0f172a] text-white text-[11px] font-bold px-2.5 py-1 rounded-[8px] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:-translate-y-0.5 transition-all duration-150 z-50">
                              View Profile
                              <span className="absolute top-full right-3 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#0f172a]" />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Screening Q&A Quick Modal */}
      {previewScreeningQA && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewScreeningQA(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">
                  Screening Questions - {previewScreeningQA.candidateName}
                </h3>
                <p className="text-[11px] text-gray-500">{previewScreeningQA.jobTitle}</p>
              </div>
              <button 
                type="button"
                onClick={() => setPreviewScreeningQA(null)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {previewScreeningQA.answers && previewScreeningQA.answers.length > 0 ? (
                previewScreeningQA.answers.map((qa, i) => (
                  <div key={i} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-900 mb-1.5">Q{i + 1}. {qa.question}</p>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-xs text-gray-800 font-medium">
                      {qa.answer || <span className="italic text-gray-400">No answer provided</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs font-medium">
                  No screening questions were specified or answered for this candidate.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Download Documents & Profile Modal with In-App Preview */}
      {previewDownloads && (() => {
        const cand = previewDownloads.cand || {};
        const item = previewDownloads.item || {};
        const resUrl = item.resume || cand.resume || cand.documents?.resume || '';
        const hasResume = Boolean(resUrl);
        
        const clUrl = item.coverLetter || cand.coverLetter || cand.documents?.coverLetter || '';
        const clText = item.coverLetterText || cand.coverLetterText || 
          (typeof clUrl === 'string' && !clUrl.startsWith('http') && clUrl.length > 20 ? clUrl : '');
        const isClFile = Boolean(clUrl && clUrl.startsWith('http'));
        const hasCoverLetter = Boolean(clText || isClFile);

        const handleDownloadResume = () => {
          if (resUrl) {
            const a = document.createElement('a');
            a.href = resUrl;
            a.download = `${(cand.name || 'Candidate').replace(/\s+/g, '_')}_Resume`;
            a.target = '_blank';
            a.rel = 'noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            exportCandidateProfileAsPdf(cand, [], { 
              hasApplied: true, 
              jobTitle: item.jobTitle || cand.designation, 
              status: 'Active', 
              appliedDate: 'Recent' 
            });
          }
        };

        const handleDownloadCoverLetter = () => {
          if (isClFile) {
            const a = document.createElement('a');
            a.href = clUrl;
            a.download = `${(cand.name || 'Candidate').replace(/\s+/g, '_')}_Cover_Letter`;
            a.target = '_blank';
            a.rel = 'noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else if (clText) {
            const txt = `COVER LETTER\n\nCandidate: ${cand.name || 'Candidate'}\nApplied Role: ${item.jobTitle || cand.designation || 'Not specified'}\nEmail: ${cand.email || ''}\nPhone: ${cand.phone || cand.mobile || ''}\nDate: ${new Date().toLocaleDateString()}\n\n--------------------------------------------------\n\n${clText}\n\n--------------------------------------------------\nGenerated via SahiJob.com`;
            const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(cand.name || 'Candidate').replace(/\s+/g, '_')}_Cover_Letter.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        };

        const candAvatar = getCandidateAvatar(cand);

        return (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
            onClick={() => setPreviewDownloads(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[860px] flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/90 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {candAvatar && !avatarFailedMap[cand._id || cand.id || cand.email] ? (
                    <img 
                      src={candAvatar} 
                      alt={cand.name} 
                      onError={() => setAvatarFailedMap(prev => ({ ...prev, [cand._id || cand.id || cand.email]: true }))}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 shrink-0" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-none">
                      {getCandidateInitials(cand.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight truncate">
                        {cand.name || 'Candidate'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#059669] border border-emerald-200 shrink-0">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {item.jobTitle || getCurrentDesignation(cand)} • {cand.location || cand.currentLocation || 'India'}
                    </p>
                  </div>
                </div>

                {/* Document View Switcher Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-200/70 rounded-full border border-gray-300/60">
                  <button
                    type="button"
                    onClick={() => setDocModalTab('resume')}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      docModalTab === 'resume'
                        ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Resume</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocModalTab('coverLetter')}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      docModalTab === 'coverLetter'
                        ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Cover Letter</span>
                    {hasCoverLetter ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-normal">None</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocModalTab('profile')}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      docModalTab === 'profile'
                        ? 'bg-white text-gray-900 shadow-xs border border-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#059669] text-white text-[9px] font-black flex items-center justify-center">SJ</span>
                    <span className="hidden sm:inline">SahiJob Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </button>
                </div>

                {/* Close Button */}
                <button 
                  type="button"
                  onClick={() => setPreviewDownloads(null)} 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer text-lg leading-none"
                  title="Close (Esc)"
                >
                  &times;
                </button>
              </div>

              {/* Document Action Toolbar */}
              <div className="px-5 sm:px-6 py-2.5 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  {docModalTab === 'resume' && (
                    <>
                      <span className="text-xs font-extrabold text-gray-800">
                        {hasResume ? 'Original Candidate Resume' : 'SahiJob Standardized Resume'}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {hasResume ? 'Uploaded attachment' : 'Auto-generated verified resume'}
                      </span>
                    </>
                  )}
                  {docModalTab === 'coverLetter' && (
                    <>
                      <span className="text-xs font-extrabold text-gray-800">
                        Personal Cover Letter
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className={`text-xs font-semibold ${hasCoverLetter ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {hasCoverLetter ? 'Submitted with application' : 'Not submitted by candidate'}
                      </span>
                    </>
                  )}
                  {docModalTab === 'profile' && (
                    <>
                      <span className="text-xs font-extrabold text-gray-800">
                        SahiJob Verified Profile Report
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-medium">
                        Complete candidate portfolio
                      </span>
                    </>
                  )}
                </div>

                {/* Toolbar Download Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {docModalTab === 'resume' && (
                    <>
                      <button
                        type="button"
                        onClick={handleDownloadResume}
                        className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-none"
                        title="Download Candidate Resume"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download Resume</span>
                      </button>
                      {hasResume && (
                        <a
                          href={resUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Open resume in full window"
                        >
                          <span>Open ↗</span>
                        </a>
                      )}
                    </>
                  )}

                  {docModalTab === 'coverLetter' && (
                    hasCoverLetter ? (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadCoverLetter}
                          className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-none"
                          title="Download Candidate Cover Letter"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download Cover Letter</span>
                        </button>
                        {isClFile && (
                          <a
                            href={clUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open ↗</span>
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400">
                        No Cover Letter
                      </span>
                    )
                  )}

                  {docModalTab === 'profile' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          exportCandidateProfileAsPdf(cand, [], { 
                            hasApplied: true, 
                            jobTitle: item.jobTitle || cand.designation, 
                            status: 'Active', 
                            appliedDate: 'Recent' 
                          });
                        }}
                        className="px-4 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-none"
                        title="Download SahiJob Candidate Profile (PDF)"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          exportCandidateProfileAsDoc(cand, [], { 
                            hasApplied: true, 
                            jobTitle: item.jobTitle || cand.designation, 
                            status: 'Active', 
                            appliedDate: 'Recent' 
                          });
                        }}
                        className="px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-full border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-none"
                        title="Download SahiJob Candidate Profile (Word .doc)"
                      >
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download DOC</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Document Preview Stage */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100/70">
                {/* 1. RESUME PREVIEW */}
                {docModalTab === 'resume' && (
                  hasResume ? (
                    <div className="w-full h-full min-h-[540px] flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium truncate max-w-md">Attachment: {resUrl.split('/').pop() || 'Candidate_Resume.pdf'}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                            Attachment Ready
                          </span>
                        </div>
                      </div>
                      <iframe
                        src={resUrl}
                        title="Candidate Resume Preview"
                        className="w-full flex-1 min-h-[520px] bg-white border-none"
                      />
                    </div>
                  ) : (
                    /* Standardized SahiJob Resume Profile Sheet */
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10 text-gray-800 space-y-6">
                      {/* Sheet Header */}
                      <div className="border-b-2 border-gray-900 pb-5 flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">
                            {cand.name || 'Candidate Name'}
                          </h2>
                          <p className="text-xs sm:text-sm font-bold text-[#059669] mt-0.5">
                            {getCurrentDesignation(cand)} • {getCurrentCompany(cand)}
                          </p>
                          <p className="text-xs text-gray-500 mt-2 font-medium">
                            {cand.email} • {formatPhoneWithCountryCode(cand.phone || cand.mobile, cand.countryCode)} • {cand.location || cand.currentLocation || 'India'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-3 py-1 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full text-xs font-bold">
                            Standardized Profile Resume
                          </span>
                        </div>
                      </div>

                      {/* Summary */}
                      {(cand.summary || cand.professionalDetails?.summary || cand.about) && (
                        <div className="space-y-1.5">
                          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Professional Summary</h3>
                          <p className="text-xs sm:text-[13px] leading-relaxed text-gray-700 font-medium bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                            {cand.summary || cand.professionalDetails?.summary || cand.about}
                          </p>
                        </div>
                      )}

                      {/* Work Experience */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Experience History</h3>
                        {Array.isArray(cand.experience) && cand.experience.length > 0 ? (
                          <div className="space-y-3">
                            {cand.experience.map((exp, idx) => (
                              <div key={idx} className="p-3.5 bg-gray-50/60 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-sm font-bold text-gray-900">{exp.designation || exp.title || exp.role || getCurrentDesignation(cand)}</h4>
                                  <span className="text-[11px] font-semibold text-gray-500">{exp.duration || exp.period || exp.years || 'Past'}</span>
                                </div>
                                <p className="text-xs font-medium text-gray-600 mt-0.5">{exp.companyName || exp.company || getCurrentCompany(cand)}</p>
                                {exp.description && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{exp.description}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-gray-700 p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                            {getWorkExp(cand)} • {cand.isFresher ? 'Fresher' : 'Direct Experience Record'}
                          </p>
                        )}
                      </div>

                      {/* Key Skills */}
                      {Array.isArray(cand.skills) && cand.skills.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Key Competencies & Skills</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {cand.skills.map((s, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full border border-gray-200">
                                {typeof s === 'string' ? s : s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Education & Qualifications</h3>
                        <p className="text-xs font-medium text-gray-800 p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                          {getPrimaryQualification(cand)}
                        </p>
                      </div>

                      {/* Bottom Download Banner */}
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400">SahiJob Verified Document System</p>
                        <button
                          type="button"
                          onClick={handleDownloadResume}
                          className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-none"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download Profile Resume (PDF)</span>
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* 2. COVER LETTER PREVIEW */}
                {docModalTab === 'coverLetter' && (
                  hasCoverLetter ? (
                    isClFile ? (
                      <div className="w-full h-full min-h-[540px] flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium truncate max-w-md">Attachment: {clUrl.split('/').pop() || 'Cover_Letter.pdf'}</span>
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                            Document Ready
                          </span>
                        </div>
                        <iframe
                          src={clUrl}
                          title="Candidate Cover Letter Preview"
                          className="w-full flex-1 min-h-[520px] bg-white border-none"
                        />
                      </div>
                    ) : (
                      /* Elegant Letter Paper Layout */
                      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-gray-800 space-y-6">
                        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                          <div>
                            <h3 className="font-extrabold text-base text-gray-900">{cand.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{cand.email} • {cand.phone || cand.mobile}</p>
                          </div>
                          <span className="text-xs font-semibold text-gray-400">
                            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-gray-600 space-y-1">
                          <p>To: Hiring Manager & Recruiting Team</p>
                          <p className="text-gray-900 font-extrabold">Re: Application for {item?.jobTitle || cand.designation || 'Open Role'}</p>
                        </div>

                        <div className="text-sm leading-relaxed text-gray-800 space-y-3 whitespace-pre-line font-normal bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                          {clText}
                        </div>

                        <div className="pt-4 border-t border-gray-100 text-xs font-semibold text-gray-600 flex justify-between items-end">
                          <div>
                            <p>Sincerely,</p>
                            <p className="font-bold text-sm text-gray-900 mt-1">{cand.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleDownloadCoverLetter}
                            className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-none"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download Letter</span>
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    /* Empty state when no cover letter was attached */
                    <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4 shadow-xs">
                      <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl border border-amber-200">
                        ✉️
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-base">No Cover Letter Submitted</h4>
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                          This candidate applied without an optional cover letter. You can view their full resume and verified work history.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDocModalTab('resume')}
                        className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-full transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-none"
                      >
                        <span>View Candidate Resume</span>
                        <span>→</span>
                      </button>
                    </div>
                  )
                )}

                {/* 3. SAHIJOB VERIFIED PROFILE REPORT PREVIEW */}
                {docModalTab === 'profile' && (
                  <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 sm:p-10 space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center font-black text-base shadow-xs">
                          SJ
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-gray-900 text-lg">{cand.name}</h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#059669]">
                              Verified Report
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Application Role: <span className="font-bold text-gray-800">{item.jobTitle || cand.designation}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            exportCandidateProfileAsPdf(cand, [], { 
                              hasApplied: true, 
                              jobTitle: item.jobTitle || cand.designation, 
                              status: 'Active', 
                              appliedDate: 'Recent' 
                            });
                          }}
                          className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-none"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            exportCandidateProfileAsDoc(cand, [], { 
                              hasApplied: true, 
                              jobTitle: item.jobTitle || cand.designation, 
                              status: 'Active', 
                              appliedDate: 'Recent' 
                            });
                          }}
                          className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-full border border-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-none"
                        >
                          <span>DOC</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[11px] font-bold text-gray-400 uppercase">Total Experience</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{getWorkExp(cand)}</p>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[11px] font-bold text-gray-400 uppercase">Education</p>
                        <p className="text-sm font-black text-gray-900 mt-1 truncate">{getPrimaryQualification(cand)}</p>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[11px] font-bold text-gray-400 uppercase">Location</p>
                        <p className="text-sm font-black text-gray-900 mt-1 truncate">{cand.location || 'India'}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-3">
                      <span className="text-base text-[#059669]">✓</span>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">Standardized & Verified Candidate File</p>
                        <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                          This verified profile format can be exported directly to official PDF and Microsoft Word DOC for interview panelists and HR records.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-400 hidden sm:inline">
                  Press <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-300 rounded font-mono">Esc</kbd> to exit
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewDownloads(null)}
                  className="px-6 py-2 rounded-full border border-gray-900 bg-white hover:bg-gray-900 hover:text-white text-gray-900 font-bold text-xs transition-colors cursor-pointer shadow-none ml-auto"
                >
                  Done
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Full Screen Candidate Profile View */}
      {selectedEmployee && (
        <CandidateProfileFullScreen
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          candidate={selectedEmployee}
          application={selectedEmployee.history?.[0] || null}
          employerProfile={employerProfile}
          backLabel="Candidates"
          isCandidatesDirectory={true}
        />
      )}
    </div>
  );
};

export default AllEmployeesTab;
