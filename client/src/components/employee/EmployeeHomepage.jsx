import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import JobApplicationModal from './JobApplicationModal';
import EmployeeNavbar from '../common/EmployeeNavbar';
import CustomDropdown from '../common/CustomDropdown';
import Footer from '../common/Footer';
import { getEmployeeStoredValue, setEmployeeStoredValue } from '../../utils/employeeStorage';
import { isLocationMatch, getJobLocationBadges, formatJobLocation } from '../../data/preferredLocations';
import LocationAutocomplete from '../common/LocationAutocomplete';

const parseProfileData = (profile) => {
  if (!profile || typeof profile !== 'object') return null;

  // Extract designation from all possible fields used across old & new versions
  let designation = (
    profile.designation ||
    profile.currentDesignation ||
    profile.professionalDetails?.currentDesignation ||
    profile.professionalDetails?.designation ||
    profile.professionalDetails?.role ||
    profile.professionalDetails?.jobTitle ||
    profile.role ||
    profile.jobTitle ||
    profile.title ||
    ''
  ).trim();

  // If still empty, check past experience roles
  if (!designation && Array.isArray(profile.experience) && profile.experience.length > 0) {
    const currentRole = profile.experience.find(e => e.roles?.some(r => r.currentCompany))?.roles?.find(r => r.currentCompany);
    if (currentRole && currentRole.jobTitle) {
      designation = currentRole.jobTitle.trim();
    } else if (profile.experience[0]?.roles?.[0]?.jobTitle) {
      designation = profile.experience[0].roles[0].jobTitle.trim();
    } else if (profile.experience[0]?.designation) {
      designation = profile.experience[0].designation.trim();
    } else if (profile.experience[0]?.title) {
      designation = profile.experience[0].title.trim();
    }
  }

  let skills = [];
  if (Array.isArray(profile.skills)) {
    skills = profile.skills.map(s => (typeof s === 'string' ? s : s.name || '')).filter(Boolean);
  } else if (typeof profile.skills === 'string') {
    skills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (profile.professionalDetails?.skills) {
    const profSkills = Array.isArray(profile.professionalDetails.skills)
      ? profile.professionalDetails.skills
      : profile.professionalDetails.skills.split(',').map(s => s.trim()).filter(Boolean);
    skills = Array.from(new Set([...skills, ...profSkills]));
  }
  if (Array.isArray(profile.qualifications)) {
    const qSkills = profile.qualifications.map(q => (typeof q === 'string' ? q : q.name || '')).filter(Boolean);
    skills = Array.from(new Set([...skills, ...qSkills]));
  }
  if (Array.isArray(profile.keySkills)) {
    skills = Array.from(new Set([...skills, ...profile.keySkills.filter(Boolean)]));
  }

  const industry = (profile.industry || profile.department || profile.jobCategory || profile.roleCategory || profile.professionalDetails?.industry || '').trim();
  const location = (profile.preferredLocation || profile.location || profile.city || profile.address?.city || '').trim();
  const experience = (profile.workExperience || profile.experience || profile.totalExperience || profile.professionalDetails?.experience || '').toString().trim();
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.name || profile.fullName || 'Candidate';
  const expectedSalary = (
    profile.expectedSalary ||
    profile.professionalDetails?.expectedSalary ||
    profile.currentSalary ||
    profile.professionalDetails?.currentSalary ||
    ''
  ).toString().trim();
  const salaryType = (
    profile.salaryType ||
    profile.professionalDetails?.salaryType ||
    'Monthly'
  ).toString().trim();

  return {
    exists: Boolean(designation || skills.length > 0 || industry || profile.email),
    designation,
    skills,
    industry,
    location,
    experience,
    fullName,
    expectedSalary,
    salaryType
  };
};

const formatCandidateSalary = (profile) => {
  if (!profile) return '₹15K / mo';
  const val = profile.expectedSalary || profile.currentSalary;
  if (!val) return '₹15K / mo';
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  if (!num || isNaN(num)) return '₹15K / mo';
  const isMonthly = (profile.salaryType || '').toLowerCase() === 'monthly';
  if (num >= 100000 && !isMonthly) {
    return `₹${(num / 100000).toFixed(1).replace('.0', '')}L / yr`;
  }
  if (num >= 1000) {
    return `₹${Math.round(num / 1000)}K / mo`;
  }
  return `₹${val} / mo`;
};

const isJobNew = (job) => {
  let jobTime = 0;
  if (job?.createdAt) jobTime = new Date(job.createdAt).getTime();
  else if (job?.date) jobTime = new Date(job.date).getTime();
  else if (job?._id || job?.id) {
    const hex = String(job._id || job.id).trim();
    if (hex.length === 24) jobTime = parseInt(hex.substring(0, 8), 16) * 1000;
  }
  if (!jobTime || isNaN(jobTime)) return false;
  // Disappear after 1 day (24 hours)
  return (Date.now() - jobTime) <= 24 * 60 * 60 * 1000;
};

const getCandidateProfile = () => {
  try {
    const raw = localStorage.getItem('userProfile');
    if (!raw) return null;
    const profile = JSON.parse(raw);
    return parseProfileData(profile);
  } catch (err) {
    console.error('Error parsing candidate profile:', err);
    return null;
  }
};

const synonymGroups = [
  ['qa', 'quality', 'analyst', 'tester', 'testing', 'automation', 'qc', 'quality assurance'],
  ['hr', 'human resources', 'recruiter', 'recruitment', 'talent', 'talent acquisition', 'hiring'],
  ['developer', 'engineer', 'programmer', 'software', 'full stack', 'frontend', 'backend', 'web developer', 'coder'],
  ['designer', 'graphic', 'ui', 'ux', 'motion', 'animator', 'video editor', 'editor', 'creative'],
  ['sales', 'business development', 'bde', 'bda', 'telecaller', 'inside sales', 'account executive', 'client relationship'],
  ['marketing', 'digital marketing', 'seo', 'sem', 'content', 'social media', 'growth'],
  ['finance', 'accountant', 'accounts', 'accounting', 'auditor', 'taxation', 'banking', 'financial'],
  ['counselor', 'admissions', 'academic counselor', 'education', 'student advisor', 'career counselor'],
  ['support', 'customer support', 'customer success', 'customer care', 'service desk', 'helpdesk', 'support specialist'],
  ['manager', 'lead', 'operations', 'supervisor', 'head', 'general manager', 'coordinator']
];

const computeJobMatch = (job, candidateProfile) => {
  if (!candidateProfile || (!candidateProfile.designation && (!candidateProfile.skills || candidateProfile.skills.length === 0) && !candidateProfile.industry)) {
    return { isMatched: false, score: 0, matchPercentage: 0, matchedDesignation: false, matchedSkills: [], matchReason: '' };
  }

  let score = 0;
  let matchedDesignation = false;
  let matchedSkills = [];
  let matchedIndustry = false;
  let matchedLocation = false;

  const jobTitleLower = (job.title || '').toLowerCase();
  const jobCategoryLower = (job.details?.jobCategory || job.jobCategory || '').toLowerCase();
  const jobIndustryLower = (job.details?.industry || '').toLowerCase();
  const jobAboutRole = (job.details?.aboutRole || '').toLowerCase();
  const jobLocationLower = (job.location || job.details?.workLocation || '').toLowerCase();

  // 1. Designation & Role Matching
  if (candidateProfile.designation) {
    const desigLower = candidateProfile.designation.toLowerCase().trim();
    
    // Direct exact or substring match
    if (jobTitleLower.includes(desigLower) || desigLower.includes(jobTitleLower)) {
      score += 120;
      matchedDesignation = true;
    } else if (jobCategoryLower.includes(desigLower) || desigLower.includes(jobCategoryLower)) {
      score += 90;
      matchedDesignation = true;
    } else {
      // Token & Stop word analysis
      const stopWords = new Set(['and', '&', 'or', 'in', 'of', 'for', 'the', 'a', 'an', 'at', 'to', 'with', 'on', 'senior', 'junior', 'lead', 'associate', 'executive', 'specialist', 'officer']);
      const desigTokens = desigLower.split(/[\s,/-]+/).map(t => t.trim()).filter(t => t.length > 1 && !stopWords.has(t));
      
      let tokenMatches = 0;
      for (const token of desigTokens) {
        if (jobTitleLower.includes(token) || jobCategoryLower.includes(token)) {
          tokenMatches++;
        }
      }
      
      if (desigTokens.length > 0 && tokenMatches > 0) {
        const ratio = tokenMatches / desigTokens.length;
        score += Math.round(ratio * 90);
        if (ratio >= 0.35 || tokenMatches >= 1) {
          matchedDesignation = true;
        }
      }

      // Synonym group matching (e.g. QA <-> Quality Analyst)
      if (!matchedDesignation) {
        for (const group of synonymGroups) {
          const hasCandidate = group.some(term => desigLower.includes(term));
          const hasJob = group.some(term => jobTitleLower.includes(term) || jobCategoryLower.includes(term));
          if (hasCandidate && hasJob) {
            score += 85;
            matchedDesignation = true;
            break;
          }
        }
      }
    }
  }

  // 2. Skills matching
  const jobSkillText = [
    job.details?.skillsRequired || '',
    ...(Array.isArray(job.qualifications) ? job.qualifications.map(q => (typeof q === 'string' ? q : q.name || '')) : []),
    jobTitleLower,
    jobAboutRole
  ].join(' ').toLowerCase();

  if (candidateProfile.skills && candidateProfile.skills.length > 0) {
    candidateProfile.skills.forEach(skill => {
      const sLower = skill.toLowerCase().trim();
      if (sLower.length >= 2 && jobSkillText.includes(sLower)) {
        score += 25;
        matchedSkills.push(skill);
      }
    });
  }

  // 3. Industry / Category matching
  if (candidateProfile.industry) {
    const indLower = candidateProfile.industry.toLowerCase().trim();
    if (jobIndustryLower.includes(indLower) || jobCategoryLower.includes(indLower) || indLower.includes(jobCategoryLower)) {
      score += 30;
      matchedIndustry = true;
    }
  }

  // 4. Location matching
  if (candidateProfile.location) {
    if (isLocationMatch(job.location || job.employerId?.location, candidateProfile.location, job.details?.workLocation)) {
      score += 15;
      matchedLocation = true;
    }
  }

  // If candidate has designation, strictly match when designation matches!
  const isMatched = candidateProfile.designation
    ? matchedDesignation
    : (matchedSkills.length >= 2 || (matchedSkills.length >= 1 && matchedIndustry));
  
  // Calculate a human-friendly match percentage (e.g. 70% to 98%)
  let matchPercentage = 0;
  if (isMatched) {
    matchPercentage = Math.min(98, Math.max(75, Math.round(70 + Math.min(score, 120) * 0.24)));
  }

  // Primary match reason
  let matchReason = '';
  if (candidateProfile.designation) {
    matchReason = `Matches your designation (${candidateProfile.designation})`;
  } else if (matchedSkills.length > 0) {
    matchReason = `Matches your skills: ${matchedSkills.slice(0, 2).join(', ')}`;
  } else if (matchedIndustry) {
    matchReason = `Matches your industry domain`;
  }

  return {
    isMatched,
    score,
    matchPercentage,
    matchedDesignation,
    matchedSkills,
    matchedIndustry,
    matchedLocation,
    matchReason
  };
};

const EmployeeHomepage = ({ jobs = [], applyToJob }) => {
  const [internalJobs, setInternalJobs] = useState(jobs);

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      setInternalJobs(jobs);
    }
  }, [jobs]);

  useEffect(() => {
    if (!jobs || jobs.length === 0) {
      const fetchDirectJobs = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${apiUrl}/api/employee/jobs`);
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const formatted = data.data.map(job => ({ ...job, id: job._id }));
            setInternalJobs(formatted);
          }
        } catch (err) {
          console.error("Failed to fetch jobs in EmployeeHomepage fallback:", err);
        }
      };
      fetchDirectJobs();
    }
  }, [jobs]);

  const effectiveJobs = (jobs && jobs.length > 0) ? jobs : internalJobs;

  const location = useLocation();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState(location.state?.selectedJobId || (effectiveJobs.length > 0 ? (effectiveJobs[0].id || effectiveJobs[0]._id) : null));
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(
    Boolean(location.state?.selectedJobId || location.state?.openDetails)
  );
  const [showToast, setShowToast] = useState(location.state?.profileCreated || location.state?.loggedIn || false);
  const [toastType, setToastType] = useState(location.state?.profileCreated ? 'created' : (location.state?.loggedIn ? 'login' : ''));
  const [toastName, setToastName] = useState('');
  const [showOnboardingPopup, setShowOnboardingPopup] = useState(location.state?.showOnboardingPrompt || false);
  const [profileModalConfig, setProfileModalConfig] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(() => getCandidateProfile());

  useEffect(() => {
    const targetId = location.state?.selectedJobId;
    const targetTitle = location.state?.jobTitle;
    const targetCompany = location.state?.companyName;

    if (targetId || (targetTitle && targetCompany)) {
      if (location.state?.clearFilters && setFilters) {
        setFilters({ keyword: '', location: '', experience: 'All', postingDate: 'Any time' });
      }

      const matched = effectiveJobs.find(j => 
        (targetId && (String(j.id) === String(targetId) || String(j._id) === String(targetId))) ||
        (targetTitle && targetCompany && 
          j.company?.trim().toLowerCase() === targetCompany.trim().toLowerCase() && 
          j.title?.trim().toLowerCase() === targetTitle.trim().toLowerCase())
      );

      if (matched) {
        setSelectedJobId(matched.id || matched._id);
        setIsMobileDetailsOpen(true);
      } else if (targetId) {
        setSelectedJobId(targetId);
        setIsMobileDetailsOpen(true);
      }
    }
  }, [location.state, effectiveJobs]);

  useEffect(() => {
    setCandidateProfile(getCandidateProfile());
  }, [location]);

  // Sync profile from backend for old & returning accounts
  useEffect(() => {
    const syncProfileFromBackend = async () => {
      try {
        const token = localStorage.getItem('employeeToken') || localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/employee/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const freshData = await res.json();
          if (freshData && typeof freshData === 'object') {
            const existing = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const merged = { ...existing, ...freshData };
            localStorage.setItem('userProfile', JSON.stringify(merged));
            const parsed = parseProfileData(merged);
            if (parsed) {
              setCandidateProfile(parsed);
            }
          }
        }
      } catch (err) {
        console.error('Error syncing candidate profile from backend:', err);
      }
    };
    syncProfileFromBackend();
  }, []);

  const [hidePostedByCardGlobally, setHidePostedByCardGlobally] = useState(false);
  const [matchBannerConfig, setMatchBannerConfig] = useState({
    enabled: true,
    headerPrefix: 'MATCHED FOR',
    subheading: 'Matches your designation ({designation})',
    emptyMatchReason: 'This job matches your designation and role criteria.',
    designationChipText: '✓ Designation: {designation}',
    skillsChipText: '✓ Skills: {skills}',
    industryChipText: '✓ Industry Fit',
    cardBadgeText: '🎯 Matched for {designation}',
    cardBadgeEnabled: true,
    showDesignationChip: true,
    showSkillsChip: true,
    showIndustryChip: true
  });

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.profilePromptModal) {
            setProfileModalConfig(json.data.profilePromptModal);
          }
          if (json.data.jobMatchBanner) {
            setMatchBannerConfig(prev => ({ ...prev, ...json.data.jobMatchBanner }));
          } else if (json.data.employerPostJob?.step6) {
            setMatchBannerConfig(prev => ({ ...prev, ...json.data.employerPostJob.step6 }));
          }
          if (typeof json.data.hidePostedByCardGlobally !== 'undefined') {
            setHidePostedByCardGlobally(Boolean(json.data.hidePostedByCardGlobally));
          }
        }
      } catch (err) {
        console.error('Error fetching modal config in EmployeeHomepage:', err);
      }
    };
    fetchCms();
  }, []);
  
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const mobileSearchRef = React.useRef(null);
  
  const [viewedJobs, setViewedJobs] = useState(new Set());

  useEffect(() => {
    let viewerEmail = null;
    try {
      const profileStr = localStorage.getItem('userProfile');
      if (profileStr) {
        viewerEmail = JSON.parse(profileStr).email;
      }
    } catch (e) {}

    // Only count the view if the user is logged in (has an email)
    if (viewerEmail && selectedJobId && !viewedJobs.has(selectedJobId)) {
      setViewedJobs(prev => new Set(prev).add(selectedJobId));
      fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs/${selectedJobId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerId: viewerEmail })
      }).catch(err => console.error("Failed to increment view:", err));
    }
  }, [selectedJobId, viewedJobs]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setShowMobileSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeJobs = effectiveJobs.filter(job => job.status !== 'Closed');

  useEffect(() => {
    if (!selectedJobId && activeJobs.length > 0) {
      setSelectedJobId(activeJobs[0].id || activeJobs[0]._id);
    }
  }, [activeJobs, selectedJobId]);

  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    experience: 'All',
    postingDate: 'Any time'
  });

  let rawFilteredJobs = activeJobs;

  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    rawFilteredJobs = rawFilteredJobs.filter(job => 
      job.title.toLowerCase().includes(kw) || 
      job.company.toLowerCase().includes(kw) ||
      (job.details?.skillsRequired || '').toLowerCase().includes(kw)
    );
  }

  if (filters.location) {
    rawFilteredJobs = rawFilteredJobs.filter(job => 
      isLocationMatch(
        job.location || job.employerId?.location, 
        filters.location, 
        job.details?.workLocation, 
        job.workplaceMode || job.details?.workplaceMode,
        job
      )
    );
  }

  if (filters.experience !== 'All') {
    rawFilteredJobs = rawFilteredJobs.filter(job => 
      job.details?.experience && job.details.experience.includes(filters.experience)
    );
  }

  if (filters.postingDate && filters.postingDate !== 'Any time') {
    const now = Date.now();
    let maxAgeMs = Infinity;

    if (filters.postingDate.includes('24') || filters.postingDate.toLowerCase().includes('today')) {
      maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
    } else if (filters.postingDate.includes('3')) {
      maxAgeMs = 3 * 24 * 60 * 60 * 1000; // 3 days
    } else if (filters.postingDate.toLowerCase().includes('week')) {
      maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    } else if (filters.postingDate.toLowerCase().includes('month')) {
      maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    if (maxAgeMs !== Infinity) {
      rawFilteredJobs = rawFilteredJobs.filter(job => {
        let jobTime = 0;
        if (job.createdAt) {
          const t = new Date(job.createdAt).getTime();
          if (!isNaN(t)) jobTime = t;
        }
        if (!jobTime && job.date) {
          const t = new Date(job.date).getTime();
          if (!isNaN(t)) jobTime = t;
        }
        if (!jobTime && (job._id || job.id)) {
          const hex = String(job._id || job.id).trim();
          if (hex.length === 24) {
            const t = parseInt(hex.substring(0, 8), 16) * 1000;
            if (!isNaN(t)) jobTime = t;
          }
        }
        return jobTime > 0 && (now - jobTime) <= maxAgeMs;
      });
    }
  }

  // Augment jobs with smart matching against candidate profile
  const jobsWithMatch = rawFilteredJobs.map(job => ({
    ...job,
    _match: computeJobMatch(job, candidateProfile)
  }));

  // If candidate profile exists with designation or skills, prioritize matched jobs to the very top!
  if (candidateProfile && (candidateProfile.designation || (candidateProfile.skills && candidateProfile.skills.length > 0))) {
    jobsWithMatch.sort((a, b) => {
      // 1. Profile matched jobs first
      if (a._match.isMatched && !b._match.isMatched) return -1;
      if (!a._match.isMatched && b._match.isMatched) return 1;
      // 2. Higher match score first
      if (a._match.isMatched && b._match.isMatched) {
        if (b._match.score !== a._match.score) {
          return b._match.score - a._match.score;
        }
      }
      // 3. Fallback to newest posting date
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  const [dismissedJobIds, setDismissedJobIds] = useState(() => getEmployeeStoredValue('dismissedJobIds', []));

  const toggleDismissJob = (jobId, e) => {
    if (e) e.stopPropagation();
    setDismissedJobIds(prev => {
      const next = prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId];
      setEmployeeStoredValue('dismissedJobIds', next);
      return next;
    });
  };

  const displayedJobs = jobsWithMatch.filter(j => !dismissedJobIds.includes(j.id));
  const matchedJobsCount = displayedJobs.filter(j => j._match?.isMatched).length;

  const filteredMobileJobs = mobileSearchTerm 
    ? activeJobs.filter(job => job.title.toLowerCase().includes(mobileSearchTerm.toLowerCase()) || job.company.toLowerCase().includes(mobileSearchTerm.toLowerCase()))
    : [];

  useEffect(() => {
    if (showToast) {
      const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      setToastName(profile.firstName || 'User');
      
      const timer = setTimeout(() => {
        setShowToast(false);
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast, navigate, location.pathname]);
  
  const [savedJobs, setSavedJobs] = useState(() => getEmployeeStoredValue('savedJobs', []));

  const [appliedJobs, setAppliedJobs] = useState(() => getEmployeeStoredValue('appliedJobs', []));

  // Extracted so it can also be called after modal close to refresh applied state
  const fetchAppliedJobs = React.useCallback(async () => {
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
        const apiAppliedJobs = data.data.map(app => {
          const jId = app.jobId?._id || app.jobId?.id || app.jobId;
          return {
            id: jId,
            _id: jId,
            status: app.status || 'Applied',
            date: new Date(app.createdAt).toLocaleDateString(),
            jobDetails: typeof app.jobId === 'object' ? app.jobId : null
          };
        });
        setAppliedJobs(apiAppliedJobs);
        setEmployeeStoredValue('appliedJobs', apiAppliedJobs);
      }
    } catch (err) {
      console.error('Error fetching applied jobs in homepage:', err);
    }
  }, []);

  useEffect(() => {
    fetchAppliedJobs();
  }, [fetchAppliedJobs]);

  const isJobApplied = (jobTarget) => {
    if (!jobTarget) return false;
    const targetId = typeof jobTarget === 'object'
      ? String(jobTarget._id || jobTarget.id || '')
      : String(jobTarget);
    if (!targetId) return false;
    return appliedJobs.some(a => {
      const aid = typeof a === 'object' ? String(a.id || a._id || '') : String(a);
      return aid === targetId;
    });
  };

  const toggleSaveJob = (jobId, e) => {
    if (e) e.stopPropagation();
    setSavedJobs(prev => {
      const newSaved = prev.includes(jobId) 
        ? prev.filter(id => id !== jobId) 
        : [...prev, jobId];
      setEmployeeStoredValue('savedJobs', newSaved);
      return newSaved;
    });
  };

  // Keep selectedJobId in sync with displayedJobs
  useEffect(() => {
    if (displayedJobs.length > 0) {
      const existsInDisplayed = displayedJobs.some(j => 
        String(j.id) === String(selectedJobId) || String(j._id) === String(selectedJobId)
      );
      if (!selectedJobId || !existsInDisplayed) {
        const inAll = effectiveJobs.some(j => 
          String(j.id) === String(selectedJobId) || String(j._id) === String(selectedJobId)
        );
        if (!inAll) {
          setSelectedJobId(displayedJobs[0].id || displayedJobs[0]._id);
        }
      }
    } else {
      setSelectedJobId(null);
    }
  }, [displayedJobs, selectedJobId, effectiveJobs]);

  const selectedJob = displayedJobs.find(j => 
    String(j.id) === String(selectedJobId) || String(j._id) === String(selectedJobId)
  ) || effectiveJobs.find(j => 
    String(j.id) === String(selectedJobId) || String(j._id) === String(selectedJobId)
  ) || (displayedJobs.length > 0 ? displayedJobs[0] : null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Navbar */}
      <EmployeeNavbar jobs={jobs} filters={filters} setFilters={setFilters} hideBottomNav={isMobileDetailsOpen} />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="relative overflow-hidden bg-[#b8ecc6] rounded-[20px] shadow-lg w-[380px] p-4 flex items-center gap-4 border border-[#a8e2b8]">
            {/* Background Blobs */}
            <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-[#9be2ae] rounded-full mix-blend-multiply opacity-60"></div>
            <div className="absolute -left-2 -top-4 w-16 h-16 bg-[#8ddc9f] rounded-full mix-blend-multiply opacity-50"></div>
            <div className="absolute top-2 right-12 w-20 h-20 bg-[#c7f4d2] rounded-full mix-blend-multiply opacity-70"></div>
            
            {/* Content */}
            <div className="relative z-10 w-11 h-11 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-[#299555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="relative z-10 flex-1">
              <h4 className="text-[#153a23] font-extrabold text-[15px] leading-tight mb-1">
                {toastType === 'login' ? `Welcome back, ${toastName}!` : `Hyy ${toastName}, your account created`}
              </h4>
              <p className="text-[#2b6542] text-xs font-semibold">
                {toastType === 'login' ? "We're glad to see you again." : "Welcome to your new employee profile!"}
              </p>
            </div>
            
            <button onClick={() => setShowToast(false)} className="relative z-10 shrink-0 text-[#2b6542] hover:text-[#153a23] transition-colors self-start mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex md:gap-6 items-start min-h-[calc(100vh-100px)]">
        {displayedJobs.length === 0 && !(filters.keyword || filters.location || filters.experience !== 'All' || filters.postingDate !== 'Any time') ? (
          <div className="w-full bg-white rounded-2xl border border-gray-200 p-12 text-center my-8 shadow-xs flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No job posted yet</h3>
            <p className="text-gray-500 text-sm max-w-md mb-6 leading-relaxed">
              Employers have not posted any jobs yet. Please check back later for new opportunities!
            </p>
          </div>
        ) : (
          <>
            {/* Left Column (Job List) */}
            <div className={`w-full md:w-[400px] flex-shrink-0 flex-col gap-3 pb-24 md:pb-0 ${isMobileDetailsOpen ? 'hidden md:flex' : 'flex'}`}>
              
              {/* Mobile Unified Search Card (Indeed Style) */}
              <div className="md:hidden flex flex-col gap-3 mb-2">
                <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-3.5 flex flex-col gap-2.5 relative z-40">
                  {/* Row 1: Keyword / Job title */}
                  <div className="relative" ref={mobileSearchRef}>
                    <div className="flex items-center px-1 py-1">
                      <svg className="w-5 h-5 text-gray-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Job title, keywords, or comp..." 
                        value={filters.keyword || mobileSearchTerm}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMobileSearchTerm(val);
                          setFilters(prev => ({ ...prev, keyword: val }));
                          setShowMobileSuggestions(true);
                        }}
                        onFocus={() => setShowMobileSuggestions(true)}
                        className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400" 
                      />
                      {(filters.keyword || mobileSearchTerm) && (
                        <button 
                          onClick={() => {
                            setMobileSearchTerm('');
                            setFilters(prev => ({ ...prev, keyword: '' }));
                          }} 
                          className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>

                    {showMobileSuggestions && mobileSearchTerm && (
                      <div className="absolute top-[115%] left-0 right-0 w-full bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[200] max-h-64 overflow-y-auto">
                        {filteredMobileJobs.length > 0 ? filteredMobileJobs.slice(0, 5).map(job => (
                          <div 
                            key={job.id} 
                            onClick={() => { 
                              setMobileSearchTerm(job.title); 
                              setFilters(prev => ({ ...prev, keyword: job.title }));
                              setShowMobileSuggestions(false); 
                            }} 
                            className="px-4 py-2.5 hover:bg-emerald-50/60 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600 text-xs shrink-0 overflow-hidden border border-gray-100">
                              {(job.companyLogo || job.employerId?.companyLogo) ? (
                                <img src={job.companyLogo || job.employerId?.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                              ) : (
                                job.companyInitial
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{job.title}</div>
                              <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
                            </div>
                          </div>
                        )) : (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">No jobs found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-150 -mx-3.5 my-0.5"></div>

                  {/* Row 2: Location */}
                  <div className="flex items-center px-1 py-1">
                    <svg className="w-5 h-5 text-gray-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <LocationAutocomplete 
                      value={filters.location}
                      onChange={(val) => setFilters(prev => ({ ...prev, location: typeof val === 'object' && val !== null ? (val.label || val.value || '') : (val || '') }))}
                      placeholder='City, state, zip code, or "remote"' 
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400" 
                    />
                    {filters.location && (
                      <button onClick={() => setFilters(prev => ({ ...prev, location: '' }))} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>

                  {/* Find jobs Button (Rich Green #1b5e20, NO BLUE!) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileSuggestions(false);
                    }}
                    className="w-full mt-1.5 py-3 px-4 bg-[#1b5e20] hover:bg-[#15541b] active:scale-[0.99] text-white font-bold rounded-xl text-center text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Find jobs
                  </button>
                </div>

                {/* Candidate Welcome Banner (Clean, without chips) */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/70 via-emerald-50/20 to-white border border-emerald-100/80 px-4 py-3.5 shadow-2xs mt-1">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-200/25 rounded-full blur-xl pointer-events-none"></div>

                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    Welcome, {candidateProfile?.fullName || toastName || 'Yash raj'}
                  </h1>
                </div>

                {/* Section Header & Sleek Horizontal Filter Pills */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                      Jobs for you
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                        {displayedJobs.length}
                      </span>
                    </h2>
                    {(filters.keyword || filters.location || filters.experience !== 'All' || filters.postingDate !== 'Any time') && (
                      <button
                        onClick={() => setFilters({ keyword: '', location: '', experience: 'All', postingDate: 'Any time' })}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {/* Filter Chips Row (No overflow clipping, comfortable width) */}
                  <div className="flex items-center gap-2.5 relative z-30">
                    {/* Experience Dropdown Pill */}
                    <div className="flex-1 min-w-[130px] relative">
                      <CustomDropdown
                        value={filters.experience}
                        onChange={(val) => setFilters(prev => ({ ...prev, experience: val }))}
                        options={[
                          { label: 'Any Experience', value: 'All' },
                          { label: '0 - 1 Yrs', value: '0 - 1 Yrs' },
                          { label: '2 - 3 Yrs', value: '2 - 3 Yrs' },
                          { label: '4 - 6 Yrs', value: '4 - 6 Yrs' },
                          { label: '7 - 10 Yrs', value: '7 - 10 Yrs' },
                          { label: '11 - 15 Yrs', value: '11 - 15 Yrs' },
                          { label: '16 - 20 Yrs', value: '16 - 20 Yrs' },
                          { label: '21 - 25 Yrs', value: '21 - 25 Yrs' },
                          { label: '25+ yrs', value: '25+ yrs' }
                        ]}
                        placeholder="Experience"
                        rounded="rounded-full"
                        dropdownClassName="w-52 shadow-2xl z-[120]"
                        className={`!py-2 !px-3 text-xs border transition-colors flex items-center font-semibold ${
                          filters.experience !== 'All' 
                            ? 'bg-emerald-50 !border-emerald-300 text-emerald-800 font-bold' 
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      />
                    </div>

                    {/* Date Posted Dropdown Pill */}
                    <div className="flex-1 min-w-[130px] relative">
                      <CustomDropdown
                        value={filters.postingDate}
                        onChange={(val) => setFilters(prev => ({ ...prev, postingDate: val }))}
                        options={[
                          { label: 'Any time', value: 'Any time' },
                          { label: 'Past 24 hours', value: 'Past 24 hours' },
                          { label: 'Past 3 days', value: 'Past 3 days' },
                          { label: 'Past week', value: 'Past week' },
                          { label: 'Past month', value: 'Past month' }
                        ]}
                        placeholder="Date Posted"
                        rounded="rounded-full"
                        dropdownClassName="w-52 shadow-2xl z-[120]"
                        className={`!py-2 !px-3 text-xs border transition-colors flex items-center font-semibold ${
                          filters.postingDate !== 'Any time' 
                            ? 'bg-emerald-50 !border-emerald-300 text-emerald-800 font-bold' 
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {displayedJobs.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3 mt-2">
                  <div className="text-4xl mb-1">🔍</div>
                  <h3 className="text-base font-bold text-gray-900">No results found</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    {filters.postingDate !== 'Any time'
                      ? 'No jobs found for "' + filters.postingDate + '". Try selecting "Past week" or "Any time".'
                      : filters.location
                      ? 'No jobs found in "' + filters.location + '". Try a different city or "Remote".'
                      : filters.keyword
                      ? 'No jobs found for "' + filters.keyword + '". Try a different keyword.'
                      : 'No jobs match your current filter settings.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilters({ keyword: '', location: '', experience: 'All', postingDate: 'Any time' })}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1b5e20] hover:bg-[#15541b] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer mt-1"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Indeed Style Clean Job Cards */}
              {displayedJobs.map(job => (
                <div 
                  key={job.id} 
                  onClick={() => { setSelectedJobId(job.id); setIsMobileDetailsOpen(true); }}
                  className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all ${
                    selectedJobId === job.id 
                      ? 'border-emerald-600 shadow-sm ring-1 ring-emerald-600/30' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Badges & Right Actions Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedJobId(job.id); 
                          setIsApplicationModalOpen(true); 
                        }} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-colors cursor-pointer active:scale-95"
                      >
                        Easily apply
                      </button>
                      {isJobNew(job) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70">
                          New
                        </span>
                      )}
                      {matchBannerConfig?.cardBadgeEnabled !== false && job._match?.isMatched && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f4ea] text-[#0d652d] border border-emerald-300/80 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>🎯</span>
                          <span>
                            {candidateProfile?.designation
                              ? `Matched for ${candidateProfile.designation}`
                              : (matchBannerConfig?.cardBadgeText
                                  ? matchBannerConfig.cardBadgeText.replace('{designation}', 'your profile').replace(/^🎯\s*/, '')
                                  : 'Matched for your profile')}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Bookmark Button */}
                    <div className="flex items-center gap-1 shrink-0 -mr-1">
                      <button 
                        onClick={(e) => toggleSaveJob(job.id, e)} 
                        className={`p-1.5 transition-colors cursor-pointer ${savedJobs.includes(job.id) ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                        title={savedJobs.includes(job.id) ? "Saved job" : "Save job"}
                      >
                        {savedJobs.includes(job.id) ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-[17px] font-black text-gray-900 hover:text-emerald-800 leading-snug mt-2">
                    {job.title}
                  </h3>

                  {/* Company & Location */}
                  <div className="mt-1">
                    <p className="text-sm font-medium text-gray-700">{job.company}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatJobLocation(job)}</p>
                  </div>

                  {/* Salary & Workplace Mode Badges */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-md text-xs font-semibold">
                      ✓ {job.salary}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-50 text-stone-700 border border-stone-200/80 rounded-md text-xs font-medium">
                      ✓ {job.workplaceMode || (job.details?.openings ? `${job.details.openings} Openings` : 'Full-time')}
                    </span>
                  </div>

                  {/* Early Applicant / Status Badge */}
                  {isJobApplied(job) ? (
                    <div className="mt-2.5 flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-800">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Already applied</span>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex items-center gap-2 bg-stone-100/90 text-stone-700 text-xs font-medium px-3 py-1.5 rounded-xl">
                      <svg className="w-3.5 h-3.5 text-stone-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>Be an early applicant</span>
                    </div>
                  )}

                  {/* Apply Action Bar on the Home Card */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    {isJobApplied(job) ? (
                      <span className="w-full inline-flex justify-center items-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        Already applied
                      </span>
                    ) : job.status === 'Closed' ? (
                      <span className="w-full inline-flex justify-center items-center py-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold">
                        Job closed
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJobId(job.id);
                          setIsApplicationModalOpen(true);
                        }}
                        className="w-full inline-flex justify-center items-center gap-1.5 py-2.5 bg-[#1b5e20] hover:bg-[#15541b] active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        Apply now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column (Job Details) */}
            {selectedJob && (
              <div className={`bg-white border-gray-200 flex-col ${
                !isMobileDetailsOpen 
                  ? 'hidden md:flex flex-1 w-full border rounded-xl sticky top-24 h-[calc(100vh-120px)] overflow-hidden' 
                  : 'fixed inset-0 z-50 flex flex-col h-full w-full overflow-hidden md:static md:sticky md:top-24 md:h-[calc(100vh-120px)] md:z-auto md:border md:rounded-xl md:flex-1'
              }`}>
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col pb-28 md:pb-6">
                  {/* Mobile Back Button */}
                  <div className="p-4 border-b border-gray-100 md:hidden flex items-center bg-white sticky top-0 z-20">
                    <button 
                      type="button"
                      onClick={() => setIsMobileDetailsOpen(false)} 
                      className="text-gray-900 hover:text-emerald-700 font-bold text-base flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Back to jobs</span>
                    </button>
                  </div>

                  <div className="p-6 border-b border-gray-200">
                    {/* DESKTOP HEADER */}
                    <div className="hidden md:block">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3 items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded font-bold text-gray-600 flex items-center justify-center text-lg shrink-0 overflow-hidden border border-gray-200">
                            {(selectedJob.companyLogo || selectedJob.employerId?.companyLogo) ? (
                              <img src={selectedJob.companyLogo || selectedJob.employerId?.companyLogo} alt={selectedJob.company} className="w-full h-full object-cover" />
                            ) : (
                              selectedJob.companyInitial
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-semibold text-gray-900">{selectedJob.company}</h2>
                          </div>
                        </div>
                      </div>
                      
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h1>
                      
                      {(() => {
                        const { displayLocation, workplaceMode } = getJobLocationBadges(selectedJob);
                        return (
                          <div className="flex items-center gap-3 mb-4 text-sm flex-wrap">
                            <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded font-medium">{displayLocation}</span>
                            {workplaceMode && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded font-medium">{workplaceMode}</span>
                            )}
                            <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded font-medium flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                              {(selectedJob.details?.openings || selectedJob.openings || '1')} {Number(selectedJob.details?.openings || selectedJob.openings || 1) === 1 ? 'Opening' : 'Openings'}
                            </span>
                            <span className="text-gray-900 font-semibold">
                              {selectedJob.salary} {selectedJob.employerProvided && <span className="text-gray-500 font-normal">(Employer provided)</span>}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Profile Match Highlight Box for Selected Job */}
                      {selectedJob._match?.isMatched && matchBannerConfig.enabled !== false && (
                        <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200 shadow-2xs">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                  🎯 {(matchBannerConfig.headerPrefix || 'MATCHED FOR').trim()} {((candidateProfile?.designation || selectedJob.title || '')).toUpperCase()}
                                </h4>
                              </div>
                              <p className="text-xs font-medium text-emerald-950">
                                {selectedJob._match.matchReason || (matchBannerConfig.subheading || 'Matches your designation ({designation})').replace(/\{designation\}/gi, candidateProfile?.designation || selectedJob.title) || (matchBannerConfig.emptyMatchReason || 'This job matches your designation and role criteria.')}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {matchBannerConfig.showDesignationChip !== false && selectedJob._match.matchedDesignation && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                                    {(matchBannerConfig.designationChipText || '✓ Designation: {designation}').replace(/\{designation\}/gi, candidateProfile?.designation || selectedJob.title)}
                                  </span>
                                )}
                                {matchBannerConfig.showSkillsChip !== false && selectedJob._match.matchedSkills && selectedJob._match.matchedSkills.length > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                                    {(matchBannerConfig.skillsChipText || '✓ Skills: {skills}').replace(/\{skills\}/gi, selectedJob._match.matchedSkills.slice(0, 3).join(', '))}
                                  </span>
                                )}
                                {matchBannerConfig.showIndustryChip !== false && selectedJob._match.matchedIndustry && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                                    {matchBannerConfig.industryChipText || '✓ Industry Fit'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DESKTOP ONLY Inline Buttons */}
                      <div className="flex gap-3">
                        {selectedJob.status === 'Closed' ? (
                          <button 
                            disabled
                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-gray-500 rounded-lg font-bold cursor-not-allowed"
                          >
                            Closed
                          </button>
                        ) : isJobApplied(selectedJob) ? (
                          <button 
                            disabled
                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg font-bold cursor-not-allowed shadow-none"
                          >
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Already applied
                          </button>
                        ) : (
                          <button 
                            onClick={() => setIsApplicationModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                            Apply
                          </button>
                        )}
                        <button 
                          onClick={() => toggleSaveJob(selectedJobId)}
                          className={`px-3 py-2.5 border rounded-lg transition-colors ${savedJobs.includes(selectedJobId) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                          {savedJobs.includes(selectedJobId) ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                          )}
                        </button>
                      </div>

                      {/* Analytics Card (Desktop) */}
                      {!hidePostedByCardGlobally && !selectedJob.employerId?.hidePostedByCard && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                          <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <div className="mb-4">
                              <h3 className="text-sm text-gray-500 font-medium mb-3">Posted by</h3>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 shadow-sm shrink-0 overflow-hidden">
                                  {(selectedJob.employerId?.companyLogo || selectedJob.companyLogo) ? (
                                    <img src={selectedJob.employerId?.companyLogo || selectedJob.companyLogo} alt={selectedJob.company} className="w-full h-full object-cover" />
                                  ) : (
                                    selectedJob.employerId?.companyName ? selectedJob.employerId.companyName.substring(0, 2).toUpperCase() : (selectedJob.companyInitial || 'HR')
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-gray-900">{selectedJob.employerId?.fullName || 'Recruiter'}</h4>
                                  <p className="text-sm text-gray-700">
                                    {selectedJob.employerId?.designation || 'HR Professional'} {selectedJob.employerId?.companyName ? `at ${selectedJob.employerId.companyName}` : ''}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ${selectedJob.employerId?.isConsultant === true ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                      {selectedJob.employerId?.isConsultant === true ? 'Consultant' : 'Company / Business'}
                                    </span>
                                    {selectedJob.employerId?.employees && (
                                      <span className="text-xs text-gray-500 font-medium">
                                        • {selectedJob.employerId.employees} Employees
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">Last Active: Today</p>
                                </div>
                              </div>
                            </div>

                            {/* Job Analytics Stats Bar */}
                            <div className="bg-gray-50 rounded-xl p-4 mt-4">
                              <div className="flex justify-around items-center text-center">
                                <div>
                                  <div className="text-2xl font-bold font-serif text-gray-900">{selectedJob.views || 0}</div>
                                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Job Views</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold font-serif text-gray-900">{selectedJob.applications || 0}</div>
                                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Applications</div>
                                </div>
                                <div>
                                  <div className="text-2xl font-bold font-serif text-gray-900">{selectedJob.recruiterActions || 0}</div>
                                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-1">Recruiter<br/>Actions</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MOBILE HEADER */}
                    <div className="md:hidden">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-lg overflow-hidden shrink-0">
                          {(selectedJob.companyLogo || selectedJob.employerId?.companyLogo) ? (
                            <img src={selectedJob.companyLogo || selectedJob.employerId?.companyLogo} alt={selectedJob.company} className="w-full h-full object-cover" />
                          ) : (
                            selectedJob.companyInitial || (selectedJob.company ? selectedJob.company.charAt(0).toUpperCase() : 'G')
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{selectedJob.company}</h2>
                      </div>
                      
                      <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{selectedJob.title}</h1>
                      
                      {/* Pill Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {(() => {
                          const { displayLocation, workplaceMode } = getJobLocationBadges(selectedJob);
                          return (
                            <>
                              {displayLocation && (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center">
                                  {displayLocation}
                                </span>
                              )}
                              {workplaceMode && (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center">
                                  {workplaceMode}
                                </span>
                              )}
                              <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center">
                                {(selectedJob.details?.openings || selectedJob.openings || '1')} {Number(selectedJob.details?.openings || selectedJob.openings || 1) === 1 ? 'Opening' : 'Openings'}
                              </span>
                            </>
                          );
                        })()}
                      </div>

                      {/* Salary */}
                      <div className="mb-6">
                        <span className="text-base font-bold text-gray-900">{selectedJob.salary}</span>
                        {selectedJob.employerProvided && <span className="text-gray-500 font-normal text-xs ml-1.5">(Employer provided)</span>}
                      </div>

                      {/* Mobile Profile Match Highlight Box */}
                      {selectedJob._match?.isMatched && matchBannerConfig.enabled !== false && (
                        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200 shadow-2xs">
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                                  🎯 {(matchBannerConfig.headerPrefix || 'MATCHED FOR').trim()} {((candidateProfile?.designation || selectedJob.title || '')).toUpperCase()}
                                </h4>
                              </div>
                              <p className="text-[11px] font-medium text-emerald-950">
                                {selectedJob._match.matchReason || (matchBannerConfig.subheading || 'Matches your designation ({designation})').replace(/\{designation\}/gi, candidateProfile?.designation || selectedJob.title) || (matchBannerConfig.emptyMatchReason || 'This job matches your designation and role criteria.')}
                              </p>
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {matchBannerConfig.showDesignationChip !== false && selectedJob._match.matchedDesignation && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                                    {(matchBannerConfig.designationChipText || '✓ Designation: {designation}').replace(/\{designation\}/gi, candidateProfile?.designation || selectedJob.title)}
                                  </span>
                                )}
                                {matchBannerConfig.showSkillsChip !== false && selectedJob._match.matchedSkills && selectedJob._match.matchedSkills.length > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                                    {(matchBannerConfig.skillsChipText || '✓ Skills: {skills}').replace(/\{skills\}/gi, selectedJob._match.matchedSkills.slice(0, 3).join(', '))}
                                  </span>
                                )}
                                {matchBannerConfig.showIndustryChip !== false && selectedJob._match.matchedIndustry && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                                    {matchBannerConfig.industryChipText || '✓ Industry Fit'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Clean Posted by Card (Mobile) */}
                      {!hidePostedByCardGlobally && !selectedJob.employerId?.hidePostedByCard && (
                        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs mb-6">
                          <h3 className="text-xs text-gray-500 font-medium mb-3">Posted by</h3>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-gray-800 text-base shadow-xs shrink-0 overflow-hidden">
                              {(selectedJob.employerId?.companyLogo || selectedJob.companyLogo) ? (
                                <img src={selectedJob.employerId?.companyLogo || selectedJob.companyLogo} alt={selectedJob.company} className="w-full h-full object-cover" />
                              ) : (
                                selectedJob.employerId?.fullName 
                                  ? selectedJob.employerId.fullName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()
                                  : (selectedJob.companyInitial || 'AM')
                              )}
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-gray-900 leading-tight">
                                {selectedJob.employerId?.fullName || selectedJob.postedBy || 'Yash Raj Singh'}
                              </h4>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {selectedJob.employerId?.designation || 'IT Manager'} at {selectedJob.employerId?.companyName || selectedJob.company || 'Amazone'}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {selectedJob.employerId?.isConsultant === true ? 'Consultant' : 'Company / Business'}
                                </span>
                                {selectedJob.employerId?.employees && (
                                  <span className="text-xs text-gray-500 font-medium">
                                    • {selectedJob.employerId.employees} Employees
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 font-medium">
                                  • Last Active: Today
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 3 Stats Bar (Mobile) */}
                          <div className="bg-gray-50/90 rounded-2xl p-4 mt-4 grid grid-cols-3 text-center border border-gray-100">
                            <div>
                              <div className="text-xl font-black text-gray-900">{selectedJob.views || 2}</div>
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">JOB VIEWS</div>
                            </div>
                            <div>
                              <div className="text-xl font-black text-gray-900">{selectedJob.applications || 0}</div>
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">APPLICATIONS</div>
                            </div>
                            <div>
                              <div className="text-xl font-black text-gray-900">{selectedJob.recruiterActions || 1}</div>
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">RECRUITER ACTIONS</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <span>Skills</span>
                        {candidateProfile?.designation && (
                          <span className="text-xs font-normal text-gray-500">
                            (Matching for {candidateProfile.designation})
                          </span>
                        )}
                      </h3>
                    </div>
                    {(() => {
                      const requiredSkills = selectedJob.qualifications && selectedJob.qualifications.length > 0
                        ? selectedJob.qualifications.map(q => (typeof q === 'string' ? q : q.name || ''))
                        : (selectedJob.details?.skillsRequired ? selectedJob.details.skillsRequired.split(',').map(s => s.trim()).filter(s => s) : []);

                      if (requiredSkills.length === 0) {
                        return <div className="text-sm text-gray-500">No specific skills listed.</div>;
                      }

                      return (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {requiredSkills.map((skillName, idx) => (
                            <span 
                              key={idx} 
                              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333] border border-emerald-200/80 shadow-2xs"
                            >
                              {skillName}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Job Details Section */}
                    <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                      {selectedJob.details?.employmentType && <p><strong>Employment Type:</strong> {selectedJob.details.employmentType}</p>}
                      {selectedJob.details?.experience && <p><strong>Experience:</strong> {selectedJob.details.experience}</p>}
                      {(selectedJob.details?.openings || selectedJob.openings) && <p><strong>Openings:</strong> {selectedJob.details?.openings || selectedJob.openings}</p>}
                      {selectedJob.details?.qualification && <p><strong>Qualification:</strong> {selectedJob.details.qualification}</p>}
                      {selectedJob.details?.stream && <p><strong>Stream:</strong> {selectedJob.details.stream}</p>}
                      {selectedJob.details?.jobCategory && <p><strong>Job Category:</strong> {selectedJob.details.jobCategory}</p>}
                      {selectedJob.details?.aboutRole && (
                        <div className="pt-2">
                          <strong>About Role:</strong>
                          <div 
                            className="mt-1 prose prose-sm max-w-none text-gray-800 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-1.5"
                            dangerouslySetInnerHTML={{ __html: selectedJob.details.aboutRole }}
                          />
                        </div>
                      )}
                      {selectedJob.details?.responsibilities && (
                        <div className="pt-2">
                          <strong>Responsibilities:</strong>
                          <div 
                            className="mt-1 prose prose-sm max-w-none text-gray-800 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-1.5"
                            dangerouslySetInnerHTML={{ __html: selectedJob.details.responsibilities }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Dedicated "Company Details" Frame at the Last */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="bg-gray-50/80 rounded-2xl border border-gray-200 p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3">
                          <svg className="w-5 h-5 text-green-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <h3 className="text-base font-bold text-gray-900">Company Details</h3>
                        </div>

                        <div className="space-y-3 text-sm text-gray-800">
                          <div>
                            <p><strong>Company Name:</strong> {selectedJob.employerId?.companyName || selectedJob.company || selectedJob.employerId?.fullName || 'Company'}</p>
                          </div>
                          <div>
                            <p className="flex items-center gap-1.5 flex-wrap">
                              <strong>Hiring Type:</strong>{' '}
                              {selectedJob.employerId?.isConsultant === true ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                                  Consultant
                                </span>
                              ) : (
                                'Company / Business'
                              )}
                            </p>
                          </div>
                          {selectedJob.employerId?.employees && (
                            <div>
                              <p><strong>Company Size:</strong> {selectedJob.employerId.employees.toLowerCase().includes('employee') ? selectedJob.employerId.employees : `${selectedJob.employerId.employees} Employees`}</p>
                            </div>
                          )}
                          {(selectedJob.employerId?.industry || selectedJob.details?.jobCategory) && (
                            <div>
                              <p><strong>Industry:</strong> {selectedJob.employerId?.industry || selectedJob.details?.jobCategory}</p>
                            </div>
                          )}
                          {(selectedJob.employerId?.location || selectedJob.location) && (
                            <div>
                              <p><strong>Location:</strong> {selectedJob.employerId?.location || selectedJob.location}</p>
                            </div>
                          )}
                          {selectedJob.employerId?.website && (
                            <div>
                              <p className="flex items-center gap-1.5">
                                <strong>Website:</strong>
                                <a 
                                  href={selectedJob.employerId.website.startsWith('http') ? selectedJob.employerId.website : `https://${selectedJob.employerId.website}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                  {selectedJob.employerId.website}
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </p>
                            </div>
                          )}
                          {selectedJob.employerId?.aboutCompany && (
                            <div className="pt-1">
                              <strong className="block mb-1">About Company:</strong>
                              <p className="text-xs text-gray-600 bg-white p-3.5 rounded-xl border border-gray-200/80 leading-relaxed">
                                {selectedJob.employerId.aboutCompany}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* MOBILE ONLY Sticky Bottom Action Bar (Apply + Bookmark) */}
                {!isApplicationModalOpen && isMobileDetailsOpen && (
                  <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-white border-t border-gray-200 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] md:hidden z-[120] flex items-center gap-3">
                    {selectedJob.status === 'Closed' ? (
                      <button 
                        disabled
                        className="flex-1 py-3.5 bg-gray-200 text-gray-500 rounded-full font-bold cursor-not-allowed shadow-none text-sm text-center"
                      >
                        Closed
                      </button>
                    ) : isJobApplied(selectedJob) ? (
                      <button 
                        disabled
                        className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-full font-bold cursor-not-allowed shadow-none border border-gray-200 flex items-center justify-center gap-2 text-sm"
                      >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Already applied
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setIsApplicationModalOpen(true)}
                        className="flex-1 py-3.5 bg-[#1b5e20] hover:bg-green-900 active:scale-[0.98] text-white rounded-full font-bold transition-all text-base shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        Apply now
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => toggleSaveJob(selectedJob.id || selectedJob._id)}
                      className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer ${
                        savedJobs.includes(selectedJob.id || selectedJob._id)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50 bg-white'
                      }`}
                      title={savedJobs.includes(selectedJob.id || selectedJob._id) ? 'Saved' : 'Save job'}
                    >
                      {savedJobs.includes(selectedJob.id || selectedJob._id) ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </main>

      <JobApplicationModal 
        isOpen={isApplicationModalOpen} 
        onClose={() => {
          setIsApplicationModalOpen(false);
          // Re-fetch from API so "Already applied" badge updates instantly
          fetchAppliedJobs();
        }} 
        job={selectedJob}
        applyToJob={applyToJob}
      />

      {/* Onboarding / Fill Details Prompt Modal */}
      {showOnboardingPopup && (profileModalConfig?.isEnabled !== false) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowOnboardingPopup(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {profileModalConfig?.showCloseButton !== false && (
              <button
                type="button"
                onClick={() => setShowOnboardingPopup(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
            
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-xs">
              {profileModalConfig?.modalIcon || '📝'}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900">
                {profileModalConfig?.title || 'Complete Your Profile Details'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {profileModalConfig?.subtitle || 'Apni education, experience aur personal details fill karein taaki recruiters aapko top matching jobs ke liye direct shortlist kar sakein!'}
              </p>
            </div>

            {profileModalConfig?.showBenefitBanner !== false && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-left flex items-start gap-2.5">
                <span className="text-base">{profileModalConfig?.benefitIcon || '⚡'}</span>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  {profileModalConfig?.benefitText || 'Complete profile hone se candidates ko 5x jyada interview calls aur direct employer messages milte hain.'}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowOnboardingPopup(false);
                  navigate(profileModalConfig?.primaryButtonLink || '/employee/onboarding');
                }}
                className="w-full py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{profileModalConfig?.primaryButtonText || 'Fill Details Now →'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOnboardingPopup(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {profileModalConfig?.secondaryButtonText || 'Explore Jobs First'}
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default EmployeeHomepage;
