import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import DateRangePicker from '../../common/DateRangePicker';
import VideoPlayer from '../../common/VideoPlayer';
import CustomDropdown from '../../common/CustomDropdown';
import CandidateVideoCard from '../../common/CandidateVideoCard';
import CandidateProfileFullScreen from './CandidateProfileFullScreen';
import EmployerChatDrawer from '../messages/EmployerChatDrawer';
import { formatPhoneWithCountryCode } from '../../../data/countryCodes';
import { 
  exportCandidateProfileAsPdf, 
  exportCandidateProfileAsDoc 
} from '../../../utils/candidateProfileExporter';

const CandidatesTab = ({ portalConfig, candidates: globalCandidates = [], jobs = [], updateCandidateStatus, employerProfile = null, triggerNavRefresh = null }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Mode: Job-specific Candidate View vs Generic Total Applications View
  const isJobSpecificView = Boolean(location.state?.fromJobCandidates && location.state?.jobTitle);
  const specificJobTitle = isJobSpecificView ? location.state.jobTitle : null;
  const initialJob = isJobSpecificView ? specificJobTitle : (location.state?.jobTitle || 'All');

  // Modals & Drawer States
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [chatDrawerApp, setChatDrawerApp] = useState(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [previewResume, setPreviewResume] = useState(null);
  const [previewCoverLetter, setPreviewCoverLetter] = useState(null);
  const [previewScreeningQA, setPreviewScreeningQA] = useState(null);
  const [previewDownloads, setPreviewDownloads] = useState(null);
  const [docModalTab, setDocModalTab] = useState('resume');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotice, setExportNotice] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [avatarFailedMap, setAvatarFailedMap] = useState({});

  // Column Filters State (Filter for every single column)
  const initialFilters = {
    appId: '',
    candidate: '',
    job: initialJob !== 'All Jobs' && initialJob !== 'All Job' ? initialJob : 'All',
    workExp: 'All',
    functionArea: 'All',
    designation: '',
    company: '',
    qualification: 'All',
    sourceLink: location.state?.sourceLink || 'All',
    status: 'All',
    sortDate: 'desc' // 'desc' | 'asc'
  };

  const [colFilters, setColFilters] = useState(initialFilters);

  // Synchronize filter when navigating between job candidate view and general applications
  useEffect(() => {
    if (location.state?.fromJobCandidates && location.state?.jobTitle) {
      setColFilters(prev => ({
        ...prev,
        job: location.state.jobTitle,
        sourceLink: location.state?.sourceLink || 'All'
      }));
    } else if (!location.state?.fromJobCandidates && !location.state?.jobTitle) {
      setColFilters(prev => ({
        ...prev,
        job: 'All',
        sourceLink: 'All'
      }));
    }
  }, [location.state?.fromJobCandidates, location.state?.jobTitle, location.state?.sourceLink]);

  const handleFilterChange = (key, value) => {
    setColFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setColFilters({
      appId: '',
      candidate: '',
      job: isJobSpecificView ? (specificJobTitle || 'All') : 'All',
      workExp: 'All',
      functionArea: 'All',
      designation: '',
      company: '',
      qualification: 'All',
      sourceLink: 'All',
      status: 'All',
      sortDate: 'desc'
    });
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    (!isJobSpecificView && colFilters.appId !== '') ||
    colFilters.candidate !== '' ||
    (!isJobSpecificView && colFilters.job !== 'All') ||
    colFilters.workExp !== 'All' ||
    colFilters.functionArea !== 'All' ||
    colFilters.designation !== '' ||
    colFilters.company !== '' ||
    colFilters.qualification !== 'All' ||
    colFilters.sourceLink !== 'All' ||
    colFilters.status !== 'All' ||
    dateRange.start !== '' ||
    dateRange.end !== '';

  const getStatusBadgeStyles = (status) => {
    const map = {
      'new': 'bg-blue-50 text-blue-700 border-blue-200',
      'applied': 'bg-blue-50 text-blue-700 border-blue-200',
      'viewed': 'bg-amber-50 text-amber-700 border-amber-200',
      'under review': 'bg-amber-50 text-amber-700 border-amber-200',
      'shortlisted': 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
      'interview scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
      'technical round': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'hr round': 'bg-pink-50 text-pink-700 border-pink-200',
      'offer sent': 'bg-teal-50 text-teal-700 border-teal-200',
      'hired': 'bg-green-100 text-green-800 border-green-300 font-bold',
      'rejected': 'bg-red-50 text-red-600 border-red-200',
      'withdrawn': 'bg-stone-100 text-stone-600 border-stone-200',
    };
    const key = status?.toLowerCase() || 'new';
    return map[key] || map['new'];
  };

  const statusOptions = ['New', 'Viewed', 'Shortlisted', 'Rejected'];

  // Helper extraction methods
  const getWorkExp = (cand) => {
    if (!cand) return 'Fresher';
    if (cand.professionalDetails?.totalExperience && cand.professionalDetails.totalExperience !== 'N/A' && cand.professionalDetails.totalExperience !== '') {
      return cand.professionalDetails.totalExperience;
    }
    if (cand.totalExperience && cand.totalExperience !== 'N/A' && cand.totalExperience !== '') {
      return cand.totalExperience;
    }
    if (cand.isFresher) return 'Fresher';
    if (cand.experience && cand.experience.length > 0) {
      const count = cand.experience.length;
      return `${count} ${count === 1 ? 'Year' : 'Years'}`;
    }
    return 'Fresher';
  };

  const getFunction = (cand) => {
    if (!cand) return 'N/A';
    return cand.industry || cand.professionalDetails?.functionalArea || cand.function || 'N/A';
  };

  const getCurrentDesignation = (cand) => {
    if (!cand) return 'N/A';
    if (cand.currentDesignation) return cand.currentDesignation;
    if (cand.designation && cand.designation !== 'N/A' && cand.designation !== '') {
      return cand.designation;
    }
    const exps = cand.experience || [];
    if (Array.isArray(exps)) {
      const currentRole = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob))?.roles?.find(r => r.currentCompany || r.currentJob);
      if (currentRole?.jobTitle || currentRole?.title || currentRole?.role) return currentRole.jobTitle || currentRole.title || currentRole.role;
      if (exps[0]?.roles?.[0]?.jobTitle) return exps[0].roles[0].jobTitle;
      if (exps[0]?.title || exps[0]?.designation) return exps[0].title || exps[0].designation;
    }
    return cand.professionalDetails?.designation || (cand.isFresher ? 'Fresher' : 'N/A');
  };

  const getCurrentCompany = (cand) => {
    if (!cand) return 'N/A';
    if (cand.currentCompany) return cand.currentCompany;
    const exps = cand.experience || [];
    if (Array.isArray(exps)) {
      const currentExp = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob) || e.currentCompany || e.currentJob) || exps[0];
      if (currentExp?.companyName || currentExp?.company) return currentExp.companyName || currentExp.company;
    }
    if (cand.professionalDetails?.currentCompany) {
      return cand.professionalDetails.currentCompany;
    }
    return cand.isFresher ? 'N/A (Fresher)' : 'N/A';
  };

  const getHighestQualification = (cand) => {
    if (!cand) return 'N/A';
    const quals = cand.qualifications || cand.education || [];
    if (!Array.isArray(quals) || quals.length === 0) return 'N/A';
    const primary = quals.find(q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1)) || quals[0];
    return primary?.course || primary?.educationType || primary?.degree || primary?.university || 'Graduate';
  };

  const formatExperienceDate = (value, fallback = '') => {
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

  const getRegisteredDate = (cand) => {
    if (!cand) return 'N/A';
    const raw = cand.createdAt || cand.registeredOn || cand.registrationDate || cand.date;
    if (!raw) return 'N/A';
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleDateString();
  };

  const handleOpenCandidate = (cand, item) => {
    setSelectedCandidate(cand);
    
    // Automatically transition 'New' or 'Applied' status to 'Viewed'
    if (item) {
      const currentStatus = (item.status || '').toLowerCase();
      if (currentStatus === 'new' || currentStatus === 'applied' || !item.status) {
        const updatedStatus = 'Viewed';
        if (updateCandidateStatus) {
          updateCandidateStatus(item.appId, updatedStatus);
        }
        item.status = updatedStatus;
        if (cand.history) {
          cand.history = cand.history.map(h => h.appId === item.appId ? { ...h, status: updatedStatus } : h);
        }
        setSelectedApplication({ ...item, status: updatedStatus });
      } else {
        setSelectedApplication(item);
      }
    } else {
      setSelectedApplication(null);
    }
  };

  const handleOpenChat = (item, cand) => {
    const candidateObj = cand || item?.candidate || {};
    const mergedApp = {
      ...item,
      appId: item?.appId || item?._id || item?.id || candidateObj._id || candidateObj.id,
      displayAppId: item?.displayAppId || item?.applicationNumber || candidateObj.applicationNumber || '500101',
      jobTitle: item?.jobTitle || candidateObj.appliedJob || 'General Application',
      status: item?.status || candidateObj.status || 'New',
      appliedDate: item?.appliedDate || item?.date || item?.createdAt || candidateObj.date || candidateObj.createdAt,
      sourceLink: item?.sourceLink || candidateObj.sourceLink || 'Direct Apply',
      candidate: candidateObj
    };

    // Auto mark viewed if new/applied
    const curStatus = (mergedApp.status || '').toLowerCase();
    if (curStatus === 'new' || curStatus === 'applied' || !mergedApp.status) {
      const updatedStatus = 'Viewed';
      if (updateCandidateStatus) {
        updateCandidateStatus(mergedApp.appId, updatedStatus);
      }
      mergedApp.status = updatedStatus;
      if (item) item.status = updatedStatus;
      if (candidateObj.history) {
        candidateObj.history = candidateObj.history.map(h => h.appId === mergedApp.appId ? { ...h, status: updatedStatus } : h);
      }
    }

    setChatDrawerApp(mergedApp);
    setIsChatDrawerOpen(true);
  };

  // Flatten every application into its own individual record
  const flattenedApplications = useMemo(() => {
    const list = [];
    (globalCandidates || []).forEach(cand => {
      const history = cand.history || [];
      if (history.length === 0) {
        list.push({
          appId: cand.id || `app-${cand.email}`,
          applicationNumber: cand.applicationNumber,
          jobTitle: cand.appliedJob || 'General Application',
          status: cand.status || 'New',
          statusColor: cand.statusColor || '',
          appliedDate: cand.date || new Date().toLocaleDateString(),
          createdAt: cand.createdAt || cand.date,
          screeningAnswers: cand.screeningAnswers || [],
          sourceLink: cand.sourceLink || 'Portal',
          resume: cand.resume || cand.documents?.resume || '',
          coverLetter: cand.coverLetter || cand.documents?.coverLetter || '',
          introVideo: cand.introVideo || cand.documents?.introVideo || '',
          hasIntroVideo: Boolean(cand.hasIntroVideo || cand.introVideo || cand.documents?.introVideo),
          isVideoLocked: Boolean(cand.isVideoLocked),
          candidate: cand
        });
      } else {
        history.forEach(app => {
          list.push({
            appId: app.appId || `${cand.id}-${app.title}`,
            applicationNumber: app.applicationNumber,
            jobTitle: app.title || 'Unknown Job',
            status: app.status || 'New',
            statusColor: app.color || '',
            appliedDate: app.date || cand.date,
            createdAt: app.createdAt || cand.createdAt || app.date,
            screeningAnswers: app.screeningAnswers || [],
            sourceLink: app.sourceLink || cand.sourceLink || 'Portal',
            resume: app.resume || cand.resume || cand.documents?.resume || '',
            coverLetter: app.coverLetter || cand.coverLetter || cand.documents?.coverLetter || '',
            introVideo: app.introVideo || cand.introVideo || cand.documents?.introVideo || '',
            hasIntroVideo: Boolean(app.hasIntroVideo || cand.hasIntroVideo || app.introVideo || cand.introVideo || cand.documents?.introVideo),
            isVideoLocked: Boolean(app.isVideoLocked || cand.isVideoLocked),
            candidate: cand
          });
        });
      }
    });

    // Chronological stable sort to assign sequential Application IDs starting from 500101
    const sortedChronological = [...list].sort((a, b) => new Date(a.createdAt || a.appliedDate || 0) - new Date(b.createdAt || b.appliedDate || 0));
    const appIdMap = new Map();
    sortedChronological.forEach((item, index) => {
      const seqId = 500101 + index;
      appIdMap.set(item.appId, item.applicationNumber || seqId);
    });

    return list.map(item => ({
      ...item,
      displayAppId: appIdMap.get(item.appId) || 500101
    }));
  }, [globalCandidates]);

  // Unique options for each dropdown filter
  const uniqueJobs = useMemo(() => {
    const list = [
      ...(jobs || []).map(j => j.title || j.jobTitle),
      ...flattenedApplications.map(a => a.jobTitle)
    ].filter(Boolean);
    return ['All', ...new Set(list)];
  }, [jobs, flattenedApplications]);

  const uniqueWorkExps = useMemo(() => {
    const list = flattenedApplications.map(a => getWorkExp(a.candidate)).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [jobs, flattenedApplications]);

  const uniqueFunctions = useMemo(() => {
    const list = flattenedApplications.map(a => getFunction(a.candidate)).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [jobs, flattenedApplications]);

  const uniqueQualifications = useMemo(() => {
    const list = flattenedApplications.map(a => getHighestQualification(a.candidate)).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [jobs, flattenedApplications]);

  const uniqueLinks = useMemo(() => {
    const jobLinkCodes = [];
    (jobs || []).forEach(j => {
      if (Array.isArray(j.shareLinks)) {
        j.shareLinks.forEach(l => {
          if (l.name) jobLinkCodes.push(l.name);
          if (l.linkId && l.linkId !== l.name) jobLinkCodes.push(l.linkId);
        });
      }
    });
    const appLinkCodes = flattenedApplications.map(a => a.sourceLink || 'Portal').filter(Boolean);
    const combined = ['01', ...jobLinkCodes, ...appLinkCodes, 'Portal'];
    const cleanList = Array.from(new Set(combined.map(s => (s === 'Direct' ? 'Portal' : s))));
    return ['All', ...cleanList];
  }, [jobs, flattenedApplications]);

  // Filter and sort applications based on all column filters
  const filteredApplications = useMemo(() => {
    const result = flattenedApplications.filter(item => {
      const cand = item.candidate;
      const workExp = getWorkExp(cand);
      const func = getFunction(cand);
      const desig = getCurrentDesignation(cand);
      const comp = getCurrentCompany(cand);
      const qual = getHighestQualification(cand);

      // 0. Application ID Search
      if (colFilters.appId.trim()) {
        const q = colFilters.appId.toLowerCase().trim().replace(/^#/, '');
        if (!String(item.displayAppId).toLowerCase().includes(q)) {
          return false;
        }
      }

      // 1. Candidate Name / Email / Phone Search
      if (colFilters.candidate.trim()) {
        const q = colFilters.candidate.toLowerCase().trim();
        const matchesName = (cand.name || '').toLowerCase().includes(q);
        const matchesEmail = (cand.email || '').toLowerCase().includes(q);
        const matchesPhone = (cand.phone || '').includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }


      // 2. Job Filter
      if (colFilters.job !== 'All') {
        if ((item.jobTitle || '').trim().toLowerCase() !== colFilters.job.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Work Exp Filter
      if (colFilters.workExp !== 'All') {
        if (workExp.trim().toLowerCase() !== colFilters.workExp.trim().toLowerCase()) {
          return false;
        }
      }

      // 4. Function Filter
      if (colFilters.functionArea !== 'All') {
        if (func.trim().toLowerCase() !== colFilters.functionArea.trim().toLowerCase()) {
          return false;
        }
      }

      // 5. Designation Filter
      if (colFilters.designation.trim()) {
        if (!desig.toLowerCase().includes(colFilters.designation.toLowerCase().trim())) {
          return false;
        }
      }

      // 6. Company Filter
      if (colFilters.company.trim()) {
        if (!comp.toLowerCase().includes(colFilters.company.toLowerCase().trim())) {
          return false;
        }
      }

      // 7. Qualification Filter
      if (colFilters.qualification !== 'All') {
        if (qual.trim().toLowerCase() !== colFilters.qualification.trim().toLowerCase()) {
          return false;
        }
      }

      // 8. Status Filter
      if (colFilters.status !== 'All') {
        if ((item.status || 'New').toLowerCase() !== colFilters.status.toLowerCase()) {
          return false;
        }
      }

      // 8.5. Source Link Filter
      if (colFilters.sourceLink !== 'All') {
        const itemSrc = String(item.sourceLink || 'Portal').trim().toLowerCase();
        const targetSrc = String(colFilters.sourceLink).trim().toLowerCase();
        if (itemSrc !== targetSrc) {
          if (!((targetSrc === 'portal' || targetSrc === 'direct') && (itemSrc === 'portal' || itemSrc === 'direct'))) {
            return false;
          }
        }
      }

      // 9. Date Filter
      if (dateRange.start || dateRange.end) {
        try {
          const appDate = new Date(item.appliedDate);
          appDate.setHours(0, 0, 0, 0);

          if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            if (appDate < startDate) return false;
          }
          if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (appDate > endDate) return false;
          }
        } catch (_) {}
      }

      return true;
    });

    // Sorting by date
    result.sort((a, b) => {
      const dateA = new Date(a.appliedDate).getTime() || 0;
      const dateB = new Date(b.appliedDate).getTime() || 0;
      return colFilters.sortDate === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [flattenedApplications, colFilters, dateRange]);

  // Status breakdown metrics - dynamically scoped to selected job and non-status filters
  const stats = useMemo(() => {
    // Filter applications by all active filters EXCEPT status so pills show accurate category counts
    const targetPool = flattenedApplications.filter(item => {
      const cand = item.candidate || {};
      const workExp = getWorkExp(cand);
      const func = getFunction(cand);
      const desig = getCurrentDesignation(cand);
      const comp = getCurrentCompany(cand);
      const qual = getHighestQualification(cand);

      // 1. Job Filter
      if (colFilters.job !== 'All') {
        if ((item.jobTitle || '').trim().toLowerCase() !== colFilters.job.trim().toLowerCase()) {
          return false;
        }
      }

      // 2. Work Exp Filter
      if (colFilters.workExp !== 'All') {
        if (workExp.trim().toLowerCase() !== colFilters.workExp.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Function Filter
      if (colFilters.functionArea !== 'All') {
        if (func.trim().toLowerCase() !== colFilters.functionArea.trim().toLowerCase()) {
          return false;
        }
      }

      // 4. Designation Filter
      if (colFilters.designation.trim()) {
        if (!desig.toLowerCase().includes(colFilters.designation.toLowerCase().trim())) {
          return false;
        }
      }

      // 5. Company Filter
      if (colFilters.company.trim()) {
        if (!comp.toLowerCase().includes(colFilters.company.toLowerCase().trim())) {
          return false;
        }
      }

      // 6. Qualification Filter
      if (colFilters.qualification !== 'All') {
        if (qual.trim().toLowerCase() !== colFilters.qualification.trim().toLowerCase()) {
          return false;
        }
      }

      // 7. Date Filter
      if (dateRange.start || dateRange.end) {
        try {
          const appDate = new Date(item.appliedDate);
          appDate.setHours(0, 0, 0, 0);

          if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            startDate.setHours(0, 0, 0, 0);
            if (appDate < startDate) return false;
          }
          if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (appDate > endDate) return false;
          }
        } catch (_) {}
      }

      return true;
    });

    const total = targetPool.length;
    const newCount = targetPool.filter(a => (a.status || 'New').toLowerCase() === 'new').length;
    const shortlistedCount = targetPool.filter(a => (a.status || '').toLowerCase() === 'shortlisted').length;
    const viewedCount = targetPool.filter(a => (a.status || '').toLowerCase() === 'viewed').length;
    const rejectedCount = targetPool.filter(a => (a.status || '').toLowerCase() === 'rejected').length;
    return { total, newCount, shortlistedCount, viewedCount, rejectedCount };
  }, [flattenedApplications, colFilters, dateRange]);

  const getInstitute = (cand) => {
    if (!cand) return 'N/A';
    if (cand.education && cand.education.length > 0) {
      const inst = cand.education[0].institution;
      if (inst && inst !== 'Institution') return inst;
    }
    if (cand.qualifications && cand.qualifications.length > 0) {
      const q = cand.qualifications[0];
      const u = q.university || q.board || q.institute || q.college;
      if (u) return u;
    }
    return 'N/A';
  };

  // Dynamic Sheet File Name: Job Name with Date (e.g. Frontend Developer - 28-09-2026)
  const getSheetFileName = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const dateStr = `${d}-${m}-${y}`;
    
    let jobName = 'All Applications';
    if (colFilters && colFilters.job && colFilters.job !== 'All') {
      jobName = colFilters.job;
    }
    const cleanJobName = jobName.replace(/[/\\?%*:|"<>]/g, ' ').trim();
    return `${cleanJobName} - ${dateStr}`;
  };

  // Helper to get raw application data array - strictly exports current filtered view
  const getExportData = () => {
    return filteredApplications;
  };

  // Helper to extract the 5 screening questions from the data to be exported
  const getExportQuestions = (data) => {
    const questions = [];
    for (let i = 0; i < 5; i++) {
      const found = (data || []).find(item => item.screeningAnswers && item.screeningAnswers[i]?.question)?.screeningAnswers?.[i]?.question;
      questions.push(found ? found.trim() : `Question ${i + 1}`);
    }
    return questions;
  };

  // Helper to format rows for TSV/CSV
  const getExportRows = (dataToExport, delimiter = '\t', isCsv = false, isJobFiltered = false) => {
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return isCsv ? '""' : '';
      const s = String(str).replace(/"/g, '""');
      return isCsv ? `"${s}"` : String(str).replace(/\t|\n|\r/g, ' ');
    };

    return dataToExport.map(item => {
      const cand = item.candidate || {};
      const workExp = getWorkExp(cand);
      const func = getFunction(cand);
      const desig = getCurrentDesignation(cand);
      const comp = getCurrentCompany(cand);
      const qual = getHighestQualification(cand);
      const institute = getInstitute(cand);
      const currentSalary = cand.currentCTC && cand.currentCTC !== 'N/A' ? cand.currentCTC : (cand.professionalDetails?.currentSalary ? `₹ ${cand.professionalDetails.currentSalary}` : 'N/A');
      const expectedSalary = cand.expectedCTC && cand.expectedCTC !== 'N/A' ? cand.expectedCTC : (cand.professionalDetails?.expectedSalary ? `₹ ${cand.professionalDetails.expectedSalary}` : 'N/A');
      
      const qa = item.screeningAnswers || [];
      const q1 = qa[0]?.question || '';
      const a1 = qa[0]?.answer || '';
      const q2 = qa[1]?.question || '';
      const a2 = qa[1]?.answer || '';
      const q3 = qa[2]?.question || '';
      const a3 = qa[2]?.answer || '';
      const q4 = qa[3]?.question || '';
      const a4 = qa[3]?.answer || '';
      const q5 = qa[4]?.question || '';
      const a5 = qa[4]?.answer || '';

      const appIdStr = item.displayAppId ? `${item.displayAppId}` : (item.applicationNumber ? `${item.applicationNumber}` : (item.appId || ''));

      const baseRow = [
        escapeCsv(appIdStr),
        escapeCsv(cand.name || ''),
        escapeCsv(item.jobTitle || ''),
        escapeCsv(cand.email || ''),
        escapeCsv(formatPhoneWithCountryCode(cand.phone || cand.mobile, cand.countryCode) || ''),
        escapeCsv(qual),
        escapeCsv(institute),
        escapeCsv(func),
        escapeCsv(workExp),
        escapeCsv(desig),
        escapeCsv(comp),
        escapeCsv(currentSalary),
        escapeCsv(expectedSalary),
        escapeCsv(item.appliedDate || ''),
        escapeCsv(item.status || 'New')
      ];

      if (isJobFiltered) {
        // Only 5 answer columns under question headers
        return [...baseRow, escapeCsv(a1), escapeCsv(a2), escapeCsv(a3), escapeCsv(a4), escapeCsv(a5)].join(delimiter);
      } else {
        // 10 Q&A paired columns for All jobs
        return [
          ...baseRow,
          escapeCsv(q1), escapeCsv(a1),
          escapeCsv(q2), escapeCsv(a2),
          escapeCsv(q3), escapeCsv(a3),
          escapeCsv(q4), escapeCsv(a4),
          escapeCsv(q5), escapeCsv(a5)
        ].join(delimiter);
      }
    });
  };

  // 1. Direct 1-Click Native Excel Export (.xlsx)
  const handleExportExcel = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const dataToExport = getExportData();
    if (!dataToExport || dataToExport.length === 0) {
      alert('No application data found matching the selected filters.');
      return;
    }

    try {
      const fileName = getSheetFileName();
      const isJobFiltered = Boolean(colFilters && colFilters.job && colFilters.job !== 'All');
      const questions = isJobFiltered ? getExportQuestions(dataToExport) : [];
      
      const sheetRows = dataToExport.map(item => {
        const cand = item.candidate || {};
        const workExp = getWorkExp(cand);
        const func = getFunction(cand);
        const desig = getCurrentDesignation(cand);
        const comp = getCurrentCompany(cand);
        const qual = getHighestQualification(cand);
        const institute = getInstitute(cand);
        const currentSalary = cand.currentCTC && cand.currentCTC !== 'N/A' ? cand.currentCTC : (cand.professionalDetails?.currentSalary ? `₹ ${cand.professionalDetails.currentSalary}` : 'N/A');
        const expectedSalary = cand.expectedCTC && cand.expectedCTC !== 'N/A' ? cand.expectedCTC : (cand.professionalDetails?.expectedSalary ? `₹ ${cand.professionalDetails.expectedSalary}` : 'N/A');
        
        const qa = item.screeningAnswers || [];
        const appIdStr = item.displayAppId ? `${item.displayAppId}` : (item.applicationNumber ? `${item.applicationNumber}` : (item.appId || ''));

        const rowObj = {
          'Application ID': appIdStr,
          'Candidate Name': cand.name || '',
          'Job Applied': item.jobTitle || '',
          'Email Address': cand.email || '',
          'Mobile Number': formatPhoneWithCountryCode(cand.phone || cand.mobile, cand.countryCode) || '',
          'Primary Qualification': qual,
          'Institute Name': institute,
          'Functional Area': func,
          'Work Experience': workExp,
          'Current Designation': desig,
          'Current Company': comp,
          'Source Link': item.sourceLink || 'Direct',
          'Current Salary': currentSalary,
          'Expected Salary': expectedSalary,
          'Applied Date': item.appliedDate || '',
          'Status': item.status || 'New'
        };

        if (isJobFiltered) {
          // 5 columns with exact Question as header and Answer as value
          rowObj[questions[0] || 'Question 1'] = qa[0]?.answer || '';
          rowObj[questions[1] || 'Question 2'] = qa[1]?.answer || '';
          rowObj[questions[2] || 'Question 3'] = qa[2]?.answer || '';
          rowObj[questions[3] || 'Question 4'] = qa[3]?.answer || '';
          rowObj[questions[4] || 'Question 5'] = qa[4]?.answer || '';
        } else {
          // All jobs: 10 columns with Question 1, Answer 1 ...
          rowObj['Question 1'] = qa[0]?.question || '';
          rowObj['Answer 1'] = qa[0]?.answer || '';
          rowObj['Question 2'] = qa[1]?.question || '';
          rowObj['Answer 2'] = qa[1]?.answer || '';
          rowObj['Question 3'] = qa[2]?.question || '';
          rowObj['Answer 3'] = qa[2]?.answer || '';
          rowObj['Question 4'] = qa[3]?.question || '';
          rowObj['Answer 4'] = qa[3]?.answer || '';
          rowObj['Question 5'] = qa[4]?.question || '';
          rowObj['Answer 5'] = qa[4]?.answer || '';
        }

        return rowObj;
      });

      // Create worksheet & auto-adjust column widths
      const worksheet = XLSX.utils.json_to_sheet(sheetRows);
      if (isJobFiltered) {
        worksheet['!cols'] = [
          { wch: 16 }, // Application ID
          { wch: 22 }, // Candidate Name
          { wch: 24 }, // Job Applied
          { wch: 26 }, // Email Address
          { wch: 16 }, // Mobile Number
          { wch: 22 }, // Primary Qualification
          { wch: 24 }, // Institute Name
          { wch: 20 }, // Functional Area
          { wch: 16 }, // Work Experience
          { wch: 22 }, // Current Designation
          { wch: 22 }, // Current Company
          { wch: 16 }, // Current Salary
          { wch: 16 }, // Expected Salary
          { wch: 14 }, // Applied Date
          { wch: 14 }, // Status
          { wch: 38 }, // Question 1
          { wch: 38 }, // Question 2
          { wch: 38 }, // Question 3
          { wch: 38 }, // Question 4
          { wch: 38 }  // Question 5
        ];
      } else {
        worksheet['!cols'] = [
          { wch: 16 }, // Application ID
          { wch: 22 }, // Candidate Name
          { wch: 24 }, // Job Applied
          { wch: 26 }, // Email Address
          { wch: 16 }, // Mobile Number
          { wch: 22 }, // Primary Qualification
          { wch: 24 }, // Institute Name
          { wch: 20 }, // Functional Area
          { wch: 16 }, // Work Experience
          { wch: 22 }, // Current Designation
          { wch: 22 }, // Current Company
          { wch: 16 }, // Current Salary
          { wch: 16 }, // Expected Salary
          { wch: 14 }, // Applied Date
          { wch: 14 }, // Status
          { wch: 30 }, // Question 1
          { wch: 30 }, // Answer 1
          { wch: 30 }, // Question 2
          { wch: 30 }, // Answer 2
          { wch: 30 }, // Question 3
          { wch: 30 }, // Answer 3
          { wch: 30 }, // Question 4
          { wch: 30 }, // Answer 4
          { wch: 30 }, // Question 5
          { wch: 30 }  // Answer 5
        ];
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');

      // Native .xlsx file download
      XLSX.writeFile(workbook, `${fileName}.xlsx`);

      setExportNotice({
        title: 'Excel (.xlsx) File Downloaded!',
        message: `Successfully downloaded "${fileName}.xlsx" (${dataToExport.length} applications).`
      });
      setTimeout(() => setExportNotice(null), 5000);
      setShowExportMenu(false);
    } catch (err) {
      console.error('Error exporting Excel file:', err);
      alert('Export failed: ' + err.message);
    }
  };

  // 2. Export to CSV File
  const handleExportCSV = () => {
    const dataToExport = getExportData();
    if (!dataToExport || dataToExport.length === 0) {
      alert('No application data found matching the selected filters.');
      return;
    }

    try {
      const fileName = getSheetFileName();
      const isJobFiltered = Boolean(colFilters && colFilters.job && colFilters.job !== 'All');
      const questions = isJobFiltered ? getExportQuestions(dataToExport) : [];

      const sheetRows = dataToExport.map(item => {
        const cand = item.candidate || {};
        const qa = item.screeningAnswers || [];
        const appIdStr = item.displayAppId ? `${item.displayAppId}` : (item.applicationNumber ? `${item.applicationNumber}` : (item.appId || ''));
        const rowObj = {
          'Application ID': appIdStr,
          'Candidate Name': cand.name || '',
          'Job Applied': item.jobTitle || '',
          'Email Address': cand.email || '',
          'Mobile Number': formatPhoneWithCountryCode(cand.phone || cand.mobile, cand.countryCode) || '',
          'Primary Qualification': getHighestQualification(cand),
          'Institute Name': getInstitute(cand),
          'Functional Area': getFunction(cand),
          'Work Experience': getWorkExp(cand),
          'Current Designation': getCurrentDesignation(cand),
          'Current Company': getCurrentCompany(cand),
          'Current Salary': cand.currentCTC && cand.currentCTC !== 'N/A' ? cand.currentCTC : (cand.professionalDetails?.currentSalary ? `₹ ${cand.professionalDetails.currentSalary}` : 'N/A'),
          'Expected Salary': cand.expectedCTC && cand.expectedCTC !== 'N/A' ? cand.expectedCTC : (cand.professionalDetails?.expectedSalary ? `₹ ${cand.professionalDetails.expectedSalary}` : 'N/A'),
          'Applied Date': item.appliedDate || '',
          'Status': item.status || 'New'
        };

        if (isJobFiltered) {
          rowObj[questions[0] || 'Question 1'] = qa[0]?.answer || '';
          rowObj[questions[1] || 'Question 2'] = qa[1]?.answer || '';
          rowObj[questions[2] || 'Question 3'] = qa[2]?.answer || '';
          rowObj[questions[3] || 'Question 4'] = qa[3]?.answer || '';
          rowObj[questions[4] || 'Question 5'] = qa[4]?.answer || '';
        } else {
          rowObj['Question 1'] = qa[0]?.question || '';
          rowObj['Answer 1'] = qa[0]?.answer || '';
          rowObj['Question 2'] = qa[1]?.question || '';
          rowObj['Answer 2'] = qa[1]?.answer || '';
          rowObj['Question 3'] = qa[2]?.question || '';
          rowObj['Answer 3'] = qa[2]?.answer || '';
          rowObj['Question 4'] = qa[3]?.question || '';
          rowObj['Answer 4'] = qa[3]?.answer || '';
          rowObj['Question 5'] = qa[4]?.question || '';
          rowObj['Answer 5'] = qa[4]?.answer || '';
        }

        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(sheetRows);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 250);

      setExportNotice({
        title: 'CSV File Downloaded!',
        message: `Successfully downloaded "${fileName}.csv" (${dataToExport.length} applications).`
      });
      setTimeout(() => setExportNotice(null), 5000);
      setShowExportMenu(false);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('CSV Export failed: ' + err.message);
    }
  };

  // 3. Copy Table Data to Clipboard
  const handleCopyClipboard = async () => {
    const dataToExport = getExportData();
    if (!dataToExport || dataToExport.length === 0) {
      alert('No application data found to copy.');
      return;
    }
    const isJobFiltered = Boolean(colFilters && colFilters.job && colFilters.job !== 'All');
    const questions = isJobFiltered ? getExportQuestions(dataToExport) : [];
    
    const baseHeaders = [
      'Application ID',
      'Candidate Name',
      'Job Applied',
      'Email Address',
      'Mobile Number',
      'Primary Qualification',
      'Institute Name',
      'Functional Area',
      'Work Experience',
      'Current Designation',
      'Current Company',
      'Current Salary',
      'Expected Salary',
      'Applied Date',
      'Status'
    ];

    const headers = isJobFiltered
      ? [...baseHeaders, questions[0], questions[1], questions[2], questions[3], questions[4]]
      : [
          ...baseHeaders,
          'Question 1', 'Answer 1',
          'Question 2', 'Answer 2',
          'Question 3', 'Answer 3',
          'Question 4', 'Answer 4',
          'Question 5', 'Answer 5'
        ];

    const rows = getExportRows(dataToExport, '\t', false, isJobFiltered);
    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(tsvContent);
      setExportNotice({
        title: 'Copied to Clipboard!',
        message: `All ${dataToExport.length} application rows copied! You can now paste directly with Ctrl + V into Google Sheets or Excel.`
      });
      setTimeout(() => setExportNotice(null), 5000);
    } catch (_) {
      alert('Could not copy to clipboard.');
    }
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Toast Notification Banner */}
      {exportNotice && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-extrabold text-sm">{exportNotice.title}</p>
              <p className="text-xs text-emerald-100 mt-0.5">{exportNotice.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setExportNotice(null)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Back to Dashboard Pill Button when viewing job-specific candidates */}
      {isJobSpecificView && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => navigate('/employer')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-900 bg-white text-slate-900 text-[13.5px] font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Top Header & Quick Status Filters */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-4">
        {/* Row 1: Title, Badge, Subtitle & Export Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {isJobSpecificView ? specificJobTitle : (portalConfig?.title || 'Total Applications')}
              </h1>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-full border border-emerald-200 whitespace-nowrap shrink-0 inline-flex items-center">
                {isJobSpecificView 
                  ? `${filteredApplications.length} Candidate${filteredApplications.length === 1 ? '' : 's'}`
                  : `${filteredApplications.length} of ${flattenedApplications.length} Applications`
                }
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              {isJobSpecificView
                ? `Reviewing candidate applications submitted specifically for ${specificJobTitle}.`
                : (portalConfig?.subtitle || 'Direct overview of all candidate applications with individual column filters.')
              }
            </p>
          </div>

          {/* Action Buttons: Export to Excel & Reset */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={handleExportExcel}
              className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-full text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-none"
              title="Download native Excel file (.xlsx) with all candidate details"
            >
              <svg className="w-4 h-4 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export to Excel</span>
            </button>

            {hasActiveFilters && (
              <button 
                onClick={resetAllFilters} 
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                title="Reset all applied filters"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Quick Status Filter Pills */}
        <div className="pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-400 mr-1">Status:</span>
          <button 
            onClick={() => handleFilterChange('status', 'All')} 
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'All' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All: {stats.total}
          </button>
          <button 
            onClick={() => handleFilterChange('status', 'New')} 
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'New' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          >
            New: {stats.newCount}
          </button>
          <button 
            onClick={() => handleFilterChange('status', 'Shortlisted')} 
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'Shortlisted' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            Shortlisted: {stats.shortlistedCount}
          </button>
          <button 
            onClick={() => handleFilterChange('status', 'Viewed')} 
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'Viewed' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          >
            Viewed: {stats.viewedCount}
          </button>
          <button 
            onClick={() => handleFilterChange('status', 'Rejected')} 
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'Rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
          >
            Rejected: {stats.rejectedCount}
          </button>
        </div>
      </div>

      {/* Main Applications Table with Column Filter Controls */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Row 1: Main Column Headers */}
              <tr className="bg-gray-100/90 border-b border-gray-200 text-gray-800 font-black uppercase tracking-wider text-[11px]">
                {!isJobSpecificView && (
                  <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">Application ID</th>
                )}
                <th className="py-3 px-3 min-w-[200px] whitespace-nowrap">Candidate Name</th>
                {!isJobSpecificView && (
                  <th className="py-3 px-3 min-w-[160px] whitespace-nowrap">Job Applied</th>
                )}
                <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">Primary Qualification</th>
                <th className="py-3 px-3 min-w-[130px] whitespace-nowrap">Functional Area</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">Work Experience</th>
                <th className="py-3 px-3 min-w-[150px] whitespace-nowrap">Current Designation</th>
                <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">Current Company</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">Applied Date</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap text-center">Status</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap text-center">Source Link</th>
                <th className="py-3 px-3 min-w-[130px] text-right whitespace-nowrap">Actions</th>
              </tr>

              {/* Row 2: In-Column Dedicated Filter Inputs & Dropdowns */}
              <tr className="bg-gray-50/95 border-b border-gray-200">
                
                {/* 0. Application ID Filter */}
                {!isJobSpecificView && (
                  <th className="p-1.5">
                    <input 
                      type="text"
                      value={colFilters.appId}
                      onChange={(e) => handleFilterChange('appId', e.target.value)}
                      placeholder="ID: 500101..."
                      className="w-full h-7 px-2 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-800 focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400 font-mono shadow-2xs"
                    />
                  </th>
                )}

                {/* 1. Candidate Filter */}
                <th className="p-1.5">
                  <input 
                    type="text"
                    value={colFilters.candidate}
                    onChange={(e) => handleFilterChange('candidate', e.target.value)}
                    placeholder="Name / Email..."
                    className="w-full h-7 px-2 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-800 focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400 shadow-2xs"
                  />
                </th>

                {/* 2. Job Applied Filter */}
                {!isJobSpecificView && (
                  <th className="p-1.5">
                    <CustomDropdown
                      options={uniqueJobs.map((jobTitle) => ({ value: jobTitle, label: jobTitle === 'All' ? 'All Jobs' : jobTitle }))}
                      value={colFilters.job}
                      onChange={(value) => handleFilterChange('job', value)}
                      allowCustomValue={false}
                      className="w-full !h-7 !px-2 !py-1 rounded-md text-[11px] font-semibold shadow-2xs"
                      dropdownClassName="w-56"
                    />
                  </th>
                )}

                {/* 3. Primary Qualification Filter (Education) */}
                <th className="p-1.5">
                  <CustomDropdown
                    options={uniqueQualifications.map((qualification) => ({ value: qualification, label: qualification === 'All' ? 'All Quals' : qualification }))}
                    value={colFilters.qualification}
                    onChange={(value) => handleFilterChange('qualification', value)}
                    allowCustomValue={false}
                    className="w-full !h-7 !px-2 !py-1 rounded-md text-[11px] font-semibold shadow-2xs"
                    dropdownClassName="w-56"
                  />
                </th>

                {/* 4. Function Filter */}
                <th className="p-1.5">
                  <CustomDropdown
                    options={uniqueFunctions.map((fn) => ({ value: fn, label: fn === 'All' ? 'All Functions' : fn }))}
                    value={colFilters.functionArea}
                    onChange={(value) => handleFilterChange('functionArea', value)}
                    allowCustomValue={false}
                    className="w-full !h-7 !px-2 !py-1 rounded-md text-[11px] font-semibold shadow-2xs"
                    dropdownClassName="w-56"
                  />
                </th>

                {/* 5. Work Exp Filter */}
                <th className="p-1.5">
                  <CustomDropdown
                    options={uniqueWorkExps.map((experience) => ({ value: experience, label: experience === 'All' ? 'All Exp' : experience }))}
                    value={colFilters.workExp}
                    onChange={(value) => handleFilterChange('workExp', value)}
                    allowCustomValue={false}
                    className="w-full !h-7 !px-2 !py-1 rounded-md text-[11px] font-semibold shadow-2xs"
                    dropdownClassName="w-56"
                  />
                </th>

                {/* 6. Current Designation Filter */}
                <th className="p-1.5">
                  <input 
                    type="text"
                    value={colFilters.designation}
                    onChange={(e) => handleFilterChange('designation', e.target.value)}
                    placeholder="Filter role..."
                    className="w-full h-7 px-2 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-800 focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400 shadow-2xs"
                  />
                </th>

                {/* 7. Current Company Filter */}
                <th className="p-1.5">
                  <input 
                    type="text"
                    value={colFilters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    placeholder="Filter company..."
                    className="w-full h-7 px-2 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-800 focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400 shadow-2xs"
                  />
                </th>

                {/* 8. Applied Date Sort Toggle */}
                <th className="p-1.5">
                  <button
                    onClick={() => handleFilterChange('sortDate', colFilters.sortDate === 'desc' ? 'asc' : 'desc')}
                    className="w-full h-7 px-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-md text-[11px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    title="Toggle Date Sort Order"
                  >
                    <span>{colFilters.sortDate === 'desc' ? '⬇ Newest' : '⬆ Oldest'}</span>
                  </button>
                </th>

                {/* 9. Status Filter */}
                <th className="p-1.5">
                  <CustomDropdown
                    options={[
                      { value: 'All', label: 'All Status' },
                      ...statusOptions.map((status) => ({ value: status, label: status }))
                    ]}
                    value={colFilters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                    allowCustomValue={false}
                    className="w-full !h-7 !px-2 !py-1 rounded-md text-[11px] font-semibold shadow-2xs"
                    dropdownClassName="w-44"
                  />
                </th>

                {/* Source Link Filter (Right side of Status) */}
                <th className="p-1.5">
                  <CustomDropdown
                    options={[
                      { value: 'All', label: 'All Sources' },
                      ...uniqueLinks.filter((link) => link !== 'All').map((link) => ({
                        value: link,
                        label: link === 'Portal' || link === 'Direct' ? '🌐 Portal' : `🔗 Link ${link}`
                      }))
                    ]}
                    value={colFilters.sourceLink}
                    onChange={(value) => handleFilterChange('sourceLink', value)}
                    allowCustomValue={false}
                    className="w-full !h-7 !px-2 !py-1 rounded-md text-[11px] font-semibold shadow-2xs"
                    dropdownClassName="w-44"
                  />
                </th>

                {/* 10. Actions Filter Reset */}
                <th className="p-1.5 text-right">
                  {hasActiveFilters ? (
                    <button 
                      onClick={resetAllFilters}
                      className="h-7 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold rounded-md transition-colors cursor-pointer border border-red-200 whitespace-nowrap shadow-2xs"
                    >
                      Clear
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-normal px-2 block text-center">Ready</span>
                  )}
                </th>

              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={isJobSpecificView ? 10 : 12} className="py-14 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">No matching candidate applications</h4>
                      <p className="text-xs text-gray-500 mb-3">No records match the active column filters. Try clearing some filters.</p>
                      {hasActiveFilters && (
                        <button 
                          onClick={resetAllFilters}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((item, idx) => {
                  const cand = item.candidate;
                  const workExp = getWorkExp(cand);
                  const func = getFunction(cand);
                  const desig = getCurrentDesignation(cand);
                  const comp = getCurrentCompany(cand);
                  const qual = getHighestQualification(cand);

                  return (
                    <tr 
                      key={item.appId || idx} 
                      className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                      onClick={() => handleOpenCandidate(cand, item)}
                    >
                      {/* 0. Application ID */}
                      {!isJobSpecificView && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-black text-gray-900 bg-gray-100/90 text-emerald-800 px-2.5 py-1 rounded-lg text-[12px] border border-gray-200/80 shadow-2xs">
                            #{item.displayAppId}
                          </span>
                        </td>
                      )}

                      {/* 1. Candidate Name, Email & Avatar */}
                      <td className="py-3.5 px-3 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const candAvatar = cand.avatar || cand.profilePhoto || cand.profilePicture || cand.photo || cand.personalDetails?.profilePhoto;
                            const candKey = cand._id || cand.id || cand.email;
                            if (candAvatar && !avatarFailedMap[candKey]) {
                              return (
                                <img
                                  src={candAvatar}
                                  alt={cand.name || 'Candidate'}
                                  onError={() => setAvatarFailedMap(prev => ({ ...prev, [candKey]: true }))}
                                  className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-2xs border border-gray-200"
                                />
                              );
                            }
                            return (
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs ${cand.bg || 'bg-emerald-600'}`}>
                                {cand.initials || (cand.name ? cand.name.charAt(0).toUpperCase() : 'C')}
                              </div>
                            );
                          })()}
                          <div className="min-w-[130px]">
                            <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors text-[13px] leading-tight">
                              {cand.name}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{cand.email}</p>
                            {(cand.phone || cand.mobile) && (
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{formatPhoneWithCountryCode(cand.phone || cand.mobile, cand.countryCode)}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Job Applied */}
                      {!isJobSpecificView && (
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                            <span className="font-bold text-gray-900 text-xs">
                              {item.jobTitle}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* 3. Primary Qualification (Education) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-3 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200/60 inline-block">
                          {qual}
                        </span>
                      </td>

                      {/* 4. Functional Area (Function) */}
                      <td className="py-3.5 px-3 text-gray-700 font-medium whitespace-nowrap">
                        {func}
                      </td>

                      {/* 5. Work Experience (Work Exp) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block whitespace-nowrap ${workExp === 'Fresher' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-800 border border-gray-200/60'}`}>
                          {workExp}
                        </span>
                      </td>

                      {/* 6. Current Designation */}
                      <td className="py-3.5 px-3 font-semibold text-gray-900 whitespace-nowrap">
                        {desig}
                      </td>

                      {/* 7. Current Company */}
                      <td className="py-3.5 px-3 text-gray-700 font-medium whitespace-nowrap">
                        {comp}
                      </td>

                      {/* 8. Applied Date */}
                      <td className="py-3.5 px-3 text-gray-500 text-xs font-medium whitespace-nowrap">
                        {item.appliedDate}
                      </td>

                      {/* 9. Status (Dropdown) */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-flex items-center min-w-[120px]">
                          <CustomDropdown
                            className={`!h-[22px] !px-2 !py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs !leading-none ${getStatusBadgeStyles(item.status)}`}
                            options={[...new Set([item.status || 'New', ...statusOptions])]}
                            allowCustomValue={false}
                            value={item.status || 'New'}
                            onChange={(newStatus) => {
                              if (updateCandidateStatus) {
                                updateCandidateStatus(item.appId, newStatus);
                              }
                              item.status = newStatus;
                              if (cand.history) {
                                cand.history = cand.history.map(h => h.appId === item.appId ? { ...h, status: newStatus } : h);
                              }
                            }}
                          />
                        </div>
                      </td>

                      {/* Link Source (Right side of Status) */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          item.sourceLink && item.sourceLink !== 'Portal' && item.sourceLink !== 'Direct'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {item.sourceLink && item.sourceLink !== 'Portal' && item.sourceLink !== 'Direct' ? `Link ${item.sourceLink}` : 'Portal'}
                        </span>
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3 px-3 text-right align-middle whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 1. Screening Q&A icon (Question) */}
                          <div className="relative group/tip inline-flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={() => setPreviewScreeningQA({ 
                                candidateName: cand.name, 
                                jobTitle: item.jobTitle, 
                                answers: item.screeningAnswers || [] 
                              })}
                              className="w-7 h-7 inline-flex items-center justify-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors cursor-pointer border border-emerald-200 shadow-none"
                              aria-label="Screening Questions"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <div className="absolute bottom-[calc(100%+7px)] left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[11px] font-bold px-2.5 py-1 rounded-[8px] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:-translate-y-0.5 transition-all duration-150 z-50">
                              Screening Questions
                              <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#0f172a]" />
                            </div>
                          </div>

                          {/* 2. View Profile (Eye) */}
                          <div className="relative group/tip inline-flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={() => handleOpenCandidate(cand, item)}
                              className="w-7 h-7 inline-flex items-center justify-center text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-full border border-gray-200 hover:border-emerald-300 bg-white transition-colors cursor-pointer shadow-none"
                              aria-label="View Profile"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <div className="absolute bottom-[calc(100%+7px)] left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[11px] font-bold px-2.5 py-1 rounded-[8px] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:-translate-y-0.5 transition-all duration-150 z-50">
                              View Profile
                              <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#0f172a]" />
                            </div>
                          </div>

                          {/* 3. Download Documents & Profile Popup (Download) */}
                          <div className="relative group/tip inline-flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocModalTab('resume');
                                setPreviewDownloads({ cand, item });
                              }}
                              className="w-7 h-7 inline-flex items-center justify-center text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-full border border-gray-200 hover:border-emerald-300 bg-white transition-colors cursor-pointer shadow-none"
                              aria-label="Download Documents"
                            >
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <div className="absolute bottom-[calc(100%+7px)] left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[11px] font-bold px-2.5 py-1 rounded-[8px] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:-translate-y-0.5 transition-all duration-150 z-50">
                              Download Documents
                              <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#0f172a]" />
                            </div>
                          </div>

                          {/* 4. Message / Chat */}
                          <div className="relative group/tip inline-flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChat(item, cand);
                              }}
                              className="w-7 h-7 inline-flex items-center justify-center text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full border border-gray-200 hover:border-purple-300 bg-white transition-colors cursor-pointer shadow-none"
                              aria-label="Message Candidate"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                            </button>
                            <div className="absolute bottom-[calc(100%+7px)] right-0 bg-[#0f172a] text-white text-[11px] font-bold px-2.5 py-1 rounded-[8px] shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:-translate-y-0.5 transition-all duration-150 z-50">
                              Message Candidate
                              <span className="absolute top-full right-2.5 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#0f172a]" />
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Scroll Info Footer */}
        {filteredApplications.length > 0 && (
          <div className="p-3.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500 font-medium">
            <p>
              Showing all <span className="font-bold text-gray-900">{filteredApplications.length}</span> {isJobSpecificView ? 'candidate' : 'application'}{filteredApplications.length === 1 ? '' : 's'} (scroll down to view all)
            </p>
            <span className="text-[11px] text-gray-400">
              {isJobSpecificView ? `Job: ${specificJobTitle}` : `Total Database Records: ${flattenedApplications.length}`}
            </span>
          </div>
        )}
      </div>

      {/* Candidate Profile Fullscreen View */}
      <CandidateProfileFullScreen
        isOpen={Boolean(selectedCandidate)}
        onClose={() => {
          setSelectedCandidate(null);
          setSelectedApplication(null);
        }}
        candidate={selectedCandidate}
        application={selectedApplication}
        updateCandidateStatus={updateCandidateStatus}
        employerProfile={employerProfile}
        backLabel={isJobSpecificView ? 'Jobs' : 'Applications'}
        onOpenMessage={(app, cand) => {
          setSelectedCandidate(null);
          setSelectedApplication(null);
          handleOpenChat(app, cand);
        }}
      />

      {/* Real-time Slide-in Chat Drawer */}
      <EmployerChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => {
          setIsChatDrawerOpen(false);
          setChatDrawerApp(null);
        }}
        application={chatDrawerApp}
        employerProfile={employerProfile}
        updateCandidateStatus={updateCandidateStatus}
        triggerNavRefresh={triggerNavRefresh}
      />

      {/* Screening Q&A Quick Modal */}
      {previewScreeningQA && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">
                  Screening Questions - {previewScreeningQA.candidateName}
                </h3>
                <p className="text-[11px] text-gray-500">{previewScreeningQA.jobTitle}</p>
              </div>
              <button 
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
                  No screening questions were specified or answered for this job application.
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
              status: item.status || 'Active', 
              appliedDate: item.appliedDate || item.date || 'Recent' 
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

        const candAvatar = cand.avatar || cand.profilePhoto || cand.profilePicture || cand.photo || cand.personalDetails?.profilePhoto;

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
                  {candAvatar ? (
                    <img src={candAvatar} alt={cand.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center text-sm font-black shrink-0">
                      {(cand.name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight truncate">
                        {cand.name || 'Candidate'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#059669] border border-emerald-200 shrink-0">
                        {item.status || 'Candidate'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {item.jobTitle || getCurrentDesignation(cand)} • App ID: {item.appId || '#500126'}
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
                            status: item.status || 'Active', 
                            appliedDate: item.appliedDate || item.date || 'Recent' 
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
                            status: item.status || 'Active', 
                            appliedDate: item.appliedDate || item.date || 'Recent' 
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
                          {getHighestQualification(cand)}
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
                              status: item.status || 'Active', 
                              appliedDate: item.appliedDate || item.date || 'Recent' 
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
                              status: item.status || 'Active', 
                              appliedDate: item.appliedDate || item.date || 'Recent' 
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
                        <p className="text-sm font-black text-gray-900 mt-1 truncate">{getHighestQualification(cand)}</p>
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

      {/* Resume Preview Modal */}
      {previewResume && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm">{previewResume.name} - Resume</h3>
              <button onClick={() => setPreviewResume(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                ✕
              </button>
            </div>
            <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
              <div className="bg-white max-w-3xl mx-auto shadow-sm min-h-full p-8 rounded-xl text-gray-800 space-y-6">
                <div className="border-b-2 border-gray-800 pb-4">
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{previewResume.name}</h1>
                  <p className="text-gray-600 mt-1 text-xs font-semibold">{previewResume.email} • {formatPhoneWithCountryCode(previewResume.phone || previewResume.mobile, previewResume.countryCode) || '+91 98765 43210'} • {previewResume.location || 'Location'}</p>
                </div>
                
                {previewResume.summary && (
                  <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Professional Summary</h2>
                    <p className="text-xs leading-relaxed text-gray-700 font-medium">{previewResume.summary}</p>
                  </div>
                )}
                
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Work Experience</h2>
                  <p className="text-xs text-gray-700">{getWorkExp(previewResume)} • {getCurrentDesignation(previewResume)} at {getCurrentCompany(previewResume)}</p>
                </div>
                
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Qualification</h2>
                  <p className="text-xs text-gray-700">{getHighestQualification(previewResume)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CandidatesTab;
