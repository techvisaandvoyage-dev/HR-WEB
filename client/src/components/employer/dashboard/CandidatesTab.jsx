import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import DateRangePicker from '../../common/DateRangePicker';
import VideoPlayer from '../../common/VideoPlayer';

const CandidatesTab = ({ portalConfig, candidates: globalCandidates = [], jobs = [], updateCandidateStatus }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialJob = location.state?.jobTitle || 'All';

  // Modals & Drawer States
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [previewCoverLetter, setPreviewCoverLetter] = useState(null);
  const [previewScreeningQA, setPreviewScreeningQA] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotice, setExportNotice] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

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
    status: 'All',
    sortDate: 'desc' // 'desc' | 'asc'
  };

  const [colFilters, setColFilters] = useState(initialFilters);

  const handleFilterChange = (key, value) => {
    setColFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setColFilters({
      appId: '',
      candidate: '',
      job: 'All',
      workExp: 'All',
      functionArea: 'All',
      designation: '',
      company: '',
      qualification: 'All',
      status: 'All',
      sortDate: 'desc'
    });
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters = 
    colFilters.appId !== '' ||
    colFilters.candidate !== '' ||
    colFilters.job !== 'All' ||
    colFilters.workExp !== 'All' ||
    colFilters.functionArea !== 'All' ||
    colFilters.designation !== '' ||
    colFilters.company !== '' ||
    colFilters.qualification !== 'All' ||
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
    if (cand.designation && cand.designation !== 'N/A' && cand.designation !== '') {
      return cand.designation;
    }
    if (cand.experience && cand.experience.length > 0) {
      const exp = cand.experience[0];
      const title = exp.roles?.[0]?.jobTitle || exp.title || exp.role;
      if (title) return title;
    }
    return cand.isFresher ? 'Fresher' : 'N/A';
  };

  const getCurrentCompany = (cand) => {
    if (!cand) return 'N/A';
    if (cand.experience && cand.experience.length > 0) {
      const comp = cand.experience[0].companyName || cand.experience[0].company;
      if (comp) return comp;
    }
    if (cand.professionalDetails?.currentCompany) {
      return cand.professionalDetails.currentCompany;
    }
    return cand.isFresher ? 'N/A (Fresher)' : 'N/A';
  };

  const getHighestQualification = (cand) => {
    if (!cand) return 'N/A';
    if (cand.education && cand.education.length > 0) {
      const edu = cand.education[0];
      return edu.degree || edu.institution || 'Graduate';
    }
    if (cand.qualifications && cand.qualifications.length > 0) {
      const q = cand.qualifications[0];
      return q.course || q.educationType || q.degree || 'Graduate';
    }
    return 'N/A';
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
          resume: cand.resume || cand.documents?.resume || '',
          coverLetter: cand.coverLetter || cand.documents?.coverLetter || '',
          introVideo: cand.introVideo || cand.documents?.introVideo || '',
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
            resume: app.resume || cand.resume || cand.documents?.resume || '',
            coverLetter: app.coverLetter || cand.coverLetter || cand.documents?.coverLetter || '',
            introVideo: app.introVideo || cand.introVideo || cand.documents?.introVideo || '',
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
    const list = flattenedApplications.map(a => a.jobTitle).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [flattenedApplications]);

  const uniqueWorkExps = useMemo(() => {
    const list = flattenedApplications.map(a => getWorkExp(a.candidate)).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [flattenedApplications]);

  const uniqueFunctions = useMemo(() => {
    const list = flattenedApplications.map(a => getFunction(a.candidate)).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [flattenedApplications]);

  const uniqueQualifications = useMemo(() => {
    const list = flattenedApplications.map(a => getHighestQualification(a.candidate)).filter(Boolean);
    return ['All', ...new Set(list)];
  }, [flattenedApplications]);

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
        escapeCsv(cand.phone || cand.mobile || ''),
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
          'Mobile Number': cand.phone || cand.mobile || '',
          'Primary Qualification': qual,
          'Institute Name': institute,
          'Functional Area': func,
          'Work Experience': workExp,
          'Current Designation': desig,
          'Current Company': comp,
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
          'Mobile Number': cand.phone || cand.mobile || '',
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

      {/* Top Header & Quick Status Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {portalConfig?.title || 'Job Applications Management'}
            </h1>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-full border border-emerald-200">
              {filteredApplications.length} of {flattenedApplications.length} Applications
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {portalConfig?.subtitle || 'Direct overview of all candidate applications with individual column filters.'}
          </p>
        </div>

        {/* Quick Status Buttons & Export Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => handleFilterChange('status', 'All')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'All' ? 'bg-gray-900 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All: {stats.total}
          </button>
          <button 
            onClick={() => handleFilterChange('status', 'New')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'New' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          >
            New: {stats.newCount}
          </button>
          <button 
            onClick={() => handleFilterChange('status', 'Shortlisted')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'Shortlisted' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            Shortlisted: {stats.shortlistedCount}
          </button>
          <button 
            onClick={() => handleFilterChange('status', 'Viewed')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'Viewed' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          >
            Viewed: {stats.viewedCount}
          </button>
          <button 
            onClick={() => handleFilterChange('status', 'Rejected')} 
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${colFilters.status === 'Rejected' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
          >
            Rejected: {stats.rejectedCount}
          </button>

          {/* Direct 1-Click Export to Excel (.xlsx) Button */}
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer ml-1"
            title="Download native Excel file (.xlsx) with all candidate details and Application ID in Column A"
          >
            <svg className="w-4 h-4 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export to Excel</span>
          </button>


          {hasActiveFilters && (
            <button 
              onClick={resetAllFilters} 
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ml-1"
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

      {/* Main Applications Table with Column Filter Controls */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Row 1: Main Column Headers */}
              <tr className="bg-gray-100/90 border-b border-gray-200 text-gray-800 font-black uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">Application ID</th>
                <th className="py-3 px-3 min-w-[200px] whitespace-nowrap">Candidate Name</th>
                <th className="py-3 px-3 min-w-[160px] whitespace-nowrap">Job Applied</th>
                <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">Primary Qualification</th>
                <th className="py-3 px-3 min-w-[130px] whitespace-nowrap">Functional Area</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">Work Experience</th>
                <th className="py-3 px-3 min-w-[150px] whitespace-nowrap">Current Designation</th>
                <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">Current Company</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">Applied Date</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap text-center">Status</th>
                <th className="py-3 px-3 min-w-[130px] text-right whitespace-nowrap">Actions</th>
              </tr>

              {/* Row 2: In-Column Dedicated Filter Inputs & Dropdowns */}
              <tr className="bg-gray-50/95 border-b border-gray-200">
                
                {/* 0. Application ID Filter */}
                <th className="p-2">
                  <div className="relative">
                    <input 
                      type="text"
                      value={colFilters.appId}
                      onChange={(e) => handleFilterChange('appId', e.target.value)}
                      placeholder="🔍 500101..."
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400 font-mono"
                    />
                  </div>
                </th>

                {/* 1. Candidate Filter */}
                <th className="p-2">
                  <div className="relative">
                    <input 
                      type="text"
                      value={colFilters.candidate}
                      onChange={(e) => handleFilterChange('candidate', e.target.value)}
                      placeholder="🔍 Name / Email..."
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400"
                    />
                  </div>
                </th>

                {/* 2. Job Applied Filter */}
                <th className="p-2">
                  <select
                    value={colFilters.job}
                    onChange={(e) => handleFilterChange('job', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {uniqueJobs.map(j => (
                      <option key={j} value={j}>{j === 'All' ? 'All Jobs' : j}</option>
                    ))}
                  </select>
                </th>

                {/* 3. Primary Qualification Filter (Education) */}
                <th className="p-2">
                  <select
                    value={colFilters.qualification}
                    onChange={(e) => handleFilterChange('qualification', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[130px] truncate"
                  >
                    {uniqueQualifications.map(q => (
                      <option key={q} value={q}>{q === 'All' ? 'All Quals' : q}</option>
                    ))}
                  </select>
                </th>

                {/* 4. Function Filter */}
                <th className="p-2">
                  <select
                    value={colFilters.functionArea}
                    onChange={(e) => handleFilterChange('functionArea', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[130px] truncate"
                  >
                    {uniqueFunctions.map(f => (
                      <option key={f} value={f}>{f === 'All' ? 'All Functions' : f}</option>
                    ))}
                  </select>
                </th>

                {/* 5. Work Exp Filter */}
                <th className="p-2">
                  <select
                    value={colFilters.workExp}
                    onChange={(e) => handleFilterChange('workExp', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {uniqueWorkExps.map(exp => (
                      <option key={exp} value={exp}>{exp === 'All' ? 'All Exp' : exp}</option>
                    ))}
                  </select>
                </th>

                {/* 6. Current Designation Filter */}
                <th className="p-2">
                  <input 
                    type="text"
                    value={colFilters.designation}
                    onChange={(e) => handleFilterChange('designation', e.target.value)}
                    placeholder="🔍 Filter role..."
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400"
                  />
                </th>

                {/* 7. Current Company Filter */}
                <th className="p-2">
                  <input 
                    type="text"
                    value={colFilters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    placeholder="🔍 Filter company..."
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400"
                  />
                </th>

                {/* 8. Applied Date Sort Toggle */}
                <th className="p-2">
                  <button
                    onClick={() => handleFilterChange('sortDate', colFilters.sortDate === 'desc' ? 'asc' : 'desc')}
                    className="w-full px-2 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Toggle Date Sort Order"
                  >
                    <span>{colFilters.sortDate === 'desc' ? '⬇ Newest' : '⬆ Oldest'}</span>
                  </button>
                </th>

                {/* 9. Status Filter */}
                <th className="p-2">
                  <select
                    value={colFilters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </th>

                {/* 10. Actions Filter Reset */}
                <th className="p-2 text-right">
                  {hasActiveFilters ? (
                    <button 
                      onClick={resetAllFilters}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-red-200 whitespace-nowrap"
                    >
                      Clear
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-normal px-2">Filters Ready</span>
                  )}
                </th>

              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-14 text-center">
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
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-black text-gray-900 bg-gray-100/90 text-emerald-800 px-2.5 py-1 rounded-lg text-[12px] border border-gray-200/80 shadow-2xs">
                          #{item.displayAppId}
                        </span>
                      </td>

                      {/* 1. Candidate Name, Email & Avatar */}
                      <td className="py-3.5 px-3 font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs ${cand.bg || 'bg-emerald-600'}`}>
                            {cand.initials || (cand.name ? cand.name.charAt(0).toUpperCase() : 'C')}
                          </div>
                          <div className="min-w-[130px]">
                            <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors text-[13px] leading-tight">
                              {cand.name}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{cand.email}</p>
                            {cand.phone && (
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{cand.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Job Applied */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="font-bold text-gray-900 text-xs">
                            {item.jobTitle}
                          </span>
                        </div>
                      </td>

                      {/* 3. Primary Qualification (Education) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200/60 inline-block">
                          {qual}
                        </span>
                      </td>

                      {/* 4. Functional Area (Function) */}
                      <td className="py-3.5 px-3 text-gray-700 font-medium whitespace-nowrap">
                        {func}
                      </td>

                      {/* 5. Work Experience (Work Exp) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block whitespace-nowrap ${workExp === 'Fresher' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-800 border border-gray-200/60'}`}>
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
                      <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select 
                          className={`appearance-none cursor-pointer outline-none transition-all px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-2xs ${getStatusBadgeStyles(item.status)}`}
                          value={item.status || 'New'}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (updateCandidateStatus) {
                              updateCandidateStatus(item.appId, newStatus);
                            }
                            item.status = newStatus;
                            if (cand.history) {
                              cand.history = cand.history.map(h => h.appId === item.appId ? { ...h, status: newStatus } : h);
                            }
                          }}
                        >
                          {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>

                      {/* 10. Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Screening Q&A icon */}
                          {item.screeningAnswers && item.screeningAnswers.length > 0 && (
                            <button 
                              onClick={() => setPreviewScreeningQA({ candidateName: cand.name, jobTitle: item.jobTitle, answers: item.screeningAnswers })}
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                              title={`View ${item.screeningAnswers.length} Screening Answers`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}

                          {/* View Profile Drawer */}
                          <button 
                            onClick={() => handleOpenCandidate(cand, item)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="View Full Profile Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Resume Preview */}
                          <button 
                            onClick={() => {
                              const resUrl = item.resume || cand.resume || cand.documents?.resume;
                              if (resUrl && resUrl.startsWith('http')) {
                                window.open(resUrl, '_blank');
                              } else {
                                setPreviewResume(cand);
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Resume"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>

                          {/* Message */}
                          <button 
                            onClick={() => {
                              navigate('/employer/messages', { state: { initialEmployee: cand } });
                            }}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Chat / Message"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          </button>

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
              Showing all <span className="font-bold text-gray-900">{filteredApplications.length}</span> application{filteredApplications.length === 1 ? '' : 's'} (scroll down to view all)
            </p>
            <span className="text-[11px] text-gray-400">
              Total Database Records: {flattenedApplications.length}
            </span>
          </div>
        )}
      </div>

      {/* Candidate Profile Slide-over Drawer */}
      {selectedCandidate && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
            onClick={() => { setSelectedCandidate(null); setSelectedApplication(null); }}
          ></div>
          <div className="fixed inset-y-0 right-0 w-full sm:w-[560px] bg-white shadow-2xl z-50 p-6 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full border-l border-gray-200 font-sans">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-start mb-5 shrink-0 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                    Candidate Profile
                  </span>
                  {selectedApplication?.appId && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      #{selectedApplication.displayAppId || selectedApplication.applicationNumber || selectedApplication.appId}
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-gray-900 text-xl mt-1">
                  {selectedApplication ? selectedApplication.jobTitle : selectedCandidate.name}
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedCandidate(null); setSelectedApplication(null); }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              
              {/* SECTION 1: BASIC DETAILS */}
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center bg-gray-50/80 p-6 rounded-2xl border border-gray-100 shadow-2xs">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-3xl mb-3 shadow-sm ring-4 ring-white ${selectedCandidate.bg || 'bg-[#18a058]'}`}>
                    {selectedCandidate.initials || (selectedCandidate.name ? selectedCandidate.name.charAt(0).toUpperCase() : 'C')}
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">{selectedCandidate.name}</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedCandidate.email}</p>
                  <p className="text-xs font-semibold text-gray-400 mt-1">
                    {(selectedCandidate.mobile || selectedCandidate.phone || 'Phone not provided')} • {(selectedCandidate.location || selectedCandidate.preferredLocation || 'Location not specified')}
                  </p>

                  {/* Status selector inside drawer */}
                  {selectedApplication && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">Status:</span>
                      <select 
                        className={`appearance-none cursor-pointer outline-none transition-all px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-2xs ${getStatusBadgeStyles(selectedApplication.status)}`}
                        value={selectedApplication.status || 'New'}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (updateCandidateStatus) {
                            updateCandidateStatus(selectedApplication.appId, newStatus);
                          }
                          selectedApplication.status = newStatus;
                          setSelectedApplication({ ...selectedApplication, status: newStatus });
                        }}
                      >
                        {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Brief about yourself / Professional Summary */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Brief About Candidate / Summary</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {selectedCandidate.brief || selectedCandidate.summary || selectedCandidate.bio || (
                      <span className="text-gray-400 italic">No professional summary provided.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* SECTION 2: EDUCATION */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                    Education
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Highest: {getHighestQualification(selectedCandidate)}
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {(selectedCandidate.qualifications || selectedCandidate.education) && (selectedCandidate.qualifications || selectedCandidate.education).length > 0 ? (
                    (selectedCandidate.qualifications || selectedCandidate.education).map((qual, i) => (
                      <div key={i} className="relative pl-4 border-l-2 border-[#18a058] ml-1.5 py-0.5">
                        <div className="absolute w-2 h-2 bg-[#18a058] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                        <h5 className="font-bold text-gray-900 text-xs">
                          {qual.degree || qual.course || qual.educationType || 'Degree'} {qual.fieldOfStudy || qual.specialization ? `in ${qual.fieldOfStudy || qual.specialization}` : ''}
                        </h5>
                        <p className="text-[11px] text-[#18a058] font-bold mb-0.5">{qual.graduationYear || qual.passingYear || qual.year || 'Graduation Year'}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{qual.institution || qual.college || qual.university || 'Institution / University'}</p>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 italic text-xs">No education details provided.</span>
                  )}
                </div>
              </div>

              {/* SECTION 3: WORK EXPERIENCE */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Work Experience
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    Total: {getWorkExp(selectedCandidate)}
                  </span>
                </div>

                {/* Experience overview chips */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50/70 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Current Designation</span>
                    <p className="text-xs font-extrabold text-gray-900 truncate">{getCurrentDesignation(selectedCandidate)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Current Company</span>
                    <p className="text-xs font-extrabold text-gray-900 truncate">{getCurrentCompany(selectedCandidate)}</p>
                  </div>
                </div>

                {/* Experience Timeline */}
                <div className="space-y-4 ml-1">
                  {selectedCandidate.experience && selectedCandidate.experience.length > 0 ? (
                    selectedCandidate.experience.map((exp, i) => (
                      <div key={i} className="mb-3">
                        <h5 className="font-bold text-gray-900 text-xs mb-1.5">{exp.company || exp.companyName || 'Company'}</h5>
                        <div className="border-l-2 border-[#18a058] ml-1.5 space-y-3 py-1">
                          {(exp.roles && exp.roles.length > 0 ? exp.roles : [exp]).map((role, rIndex) => {
                            const formatDate = (dateStr) => {
                              if (!dateStr) return '';
                              const d = new Date(dateStr);
                              return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                            };
                            const startDate = role.startDate ? formatDate(role.startDate) : (exp.startDate ? formatDate(exp.startDate) : 'Start');
                            const endDate = role.currentJob || exp.currentJob ? 'Present' : (role.endDate ? formatDate(role.endDate) : (exp.endDate ? formatDate(exp.endDate) : 'Present'));

                            return (
                              <div key={rIndex} className="relative pl-4">
                                <div className="absolute w-2 h-2 bg-[#18a058] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                                <h5 className="font-bold text-gray-900 text-xs">{role.jobTitle || role.title || role.role || exp.title || 'Role'}</h5>
                                <p className="text-[11px] text-gray-500 font-medium mb-1">
                                  {startDate} - {endDate} <span className="text-gray-300 mx-1">|</span> {role.employmentType || exp.employmentType || 'Full-time'}
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed">{role.description || exp.description || 'No description provided.'}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 italic text-xs">No work experience provided (Fresher).</span>
                  )}
                </div>
              </div>

              {/* SECTION 4: KEY SKILLS & PREFERENCES */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Key Skills & Preferences
                </h4>

                {/* Skills tags */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Key Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      const rawSkills = selectedCandidate.professionalDetails?.skills || selectedCandidate.skills;
                      const skillsArray = typeof rawSkills === 'string' 
                        ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
                        : Array.isArray(rawSkills) 
                          ? rawSkills 
                          : [];
                      
                      if (skillsArray.length === 0) {
                        return <span className="text-gray-400 italic text-xs">No skills listed.</span>;
                      }

                      return skillsArray.map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-100">
                          {skill}
                        </span>
                      ));
                    })()}
                  </div>
                </div>

                {/* Preferences Grid */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Function / Industry</h4>
                    <p className="text-xs font-extrabold text-gray-900">{getFunction(selectedCandidate)}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Preferred Location</h4>
                    <p className="text-xs font-extrabold text-gray-900">{selectedCandidate.preferredLocation || selectedCandidate.location || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Current {selectedCandidate.professionalDetails?.salaryType === 'Monthly' ? 'Monthly' : 'Annual'} Salary
                    </h4>
                    <p className="text-xs font-extrabold text-gray-900">
                      {selectedCandidate.professionalDetails?.currentSalary 
                        ? `₹ ${selectedCandidate.professionalDetails.currentSalary}` 
                        : (selectedCandidate.currentCTC ? `₹ ${selectedCandidate.currentCTC}` : 'N/A')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Expected {selectedCandidate.professionalDetails?.salaryType === 'Monthly' ? 'Monthly' : 'Annual'} Salary
                    </h4>
                    <p className="text-xs font-extrabold text-gray-900">
                      {selectedCandidate.professionalDetails?.expectedSalary 
                        ? `₹ ${selectedCandidate.professionalDetails.expectedSalary}` 
                        : (selectedCandidate.expectedCTC ? `₹ ${selectedCandidate.expectedCTC}` : 'N/A')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Applied Date</h4>
                    <p className="text-xs font-extrabold text-gray-900">{selectedApplication?.appliedDate || selectedCandidate.date || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Registered On</h4>
                    <p className="text-xs font-extrabold text-gray-900">
                      {getRegisteredDate(selectedCandidate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 5: DOCUMENTS & MEDIA */}
              {(selectedCandidate.resume || selectedApplication?.resume || selectedCandidate.introVideo || selectedApplication?.introVideo || selectedCandidate.coverLetter || selectedCandidate.documents) && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-4">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Documents & Media
                  </h4>
                  
                  <div className="space-y-3">
                    
                    {/* Introductory Video */}
                    {(selectedApplication?.introVideo || selectedCandidate.introVideo || selectedCandidate.documents?.introVideo) && (
                      <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">Introductory Video</p>
                              <p className="text-[10px] text-gray-500">Candidate Video Introduction</p>
                            </div>
                          </div>
                          <a 
                            href={selectedApplication?.introVideo || selectedCandidate.introVideo || selectedCandidate.documents?.introVideo} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-3 py-1.5 bg-[#0c7844] hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            Watch Video
                          </a>
                        </div>
                        <VideoPlayer url={selectedApplication?.introVideo || selectedCandidate.introVideo || selectedCandidate.documents?.introVideo} maxPlayerHeight="220px" className="mt-2" />
                      </div>
                    )}

                    {/* Resume */}
                    {(selectedApplication?.resume || selectedCandidate.resume || selectedCandidate.documents?.resume) && (
                      <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">Resume / CV Document</p>
                            <p className="text-[10px] text-gray-500">Applicant CV File</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const resUrl = selectedApplication?.resume || selectedCandidate.resume || selectedCandidate.documents?.resume;
                              if (resUrl && resUrl.startsWith('http')) {
                                window.open(resUrl, '_blank');
                              } else {
                                setPreviewResume(selectedCandidate);
                              }
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Preview
                          </button>
                          {(selectedApplication?.resume || selectedCandidate.resume || selectedCandidate.documents?.resume) && (
                            <a 
                              href={selectedApplication?.resume || selectedCandidate.resume || selectedCandidate.documents?.resume} 
                              download 
                              className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors"
                              title="Download"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cover Letter */}
                    {(selectedApplication?.coverLetter || selectedCandidate.coverLetter || selectedCandidate.documents?.coverLetter) && (
                      <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">Cover Letter</p>
                            <p className="text-[10px] text-gray-500">Applicant Cover Letter</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const covUrl = selectedApplication?.coverLetter || selectedCandidate.coverLetter || selectedCandidate.documents?.coverLetter;
                              if (covUrl && covUrl.startsWith('http')) {
                                window.open(covUrl, '_blank');
                              } else {
                                setPreviewCoverLetter(selectedCandidate);
                              }
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* SECTION 6: SCREENING QUESTIONS & ANSWERS */}
              {selectedApplication && selectedApplication.screeningAnswers && selectedApplication.screeningAnswers.length > 0 && (
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-3">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Screening Questions & Answers ({selectedApplication.screeningAnswers.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedApplication.screeningAnswers.map((item, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                        <p className="text-xs font-bold text-gray-900 mb-1">Q{idx + 1}. {item.question}</p>
                        <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg font-medium">
                          {item.answer || <span className="italic text-gray-400">No answer provided</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button 
                onClick={() => {
                  navigate('/employer/messages', { state: { initialEmployee: selectedCandidate } });
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Message / Chat with Candidate</span>
              </button>
            </div>

          </div>
        </>
      )}

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
              {previewScreeningQA.answers.map((qa, i) => (
                <div key={i} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                  <p className="text-xs font-bold text-gray-900 mb-1.5">Q{i + 1}. {qa.question}</p>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-xs text-gray-800 font-medium">
                    {qa.answer || <span className="italic text-gray-400">No answer provided</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-gray-600 mt-1 text-xs font-semibold">{previewResume.email} • {previewResume.phone || '+91 98765 43210'} • {previewResume.location || 'Location'}</p>
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
