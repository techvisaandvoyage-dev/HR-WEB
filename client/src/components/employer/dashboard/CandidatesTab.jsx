import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const [showOnlineSheetModal, setShowOnlineSheetModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Column Filters State (Filter for every single column)
  const initialFilters = {
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

  // Flatten every application into its own individual record
  const flattenedApplications = useMemo(() => {
    const list = [];
    (globalCandidates || []).forEach(cand => {
      const history = cand.history || [];
      if (history.length === 0) {
        list.push({
          appId: cand.id || `app-${cand.email}`,
          jobTitle: cand.appliedJob || 'General Application',
          status: cand.status || 'New',
          statusColor: cand.statusColor || '',
          appliedDate: cand.date || new Date().toLocaleDateString(),
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
            jobTitle: app.title || 'Unknown Job',
            status: app.status || 'New',
            statusColor: app.color || '',
            appliedDate: app.date || cand.date,
            screeningAnswers: app.screeningAnswers || [],
            resume: app.resume || cand.resume || cand.documents?.resume || '',
            coverLetter: app.coverLetter || cand.coverLetter || cand.documents?.coverLetter || '',
            introVideo: app.introVideo || cand.introVideo || cand.documents?.introVideo || '',
            candidate: cand
          });
        });
      }
    });
    return list;
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

  // Pagination calculation
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage) || 1;
  const paginatedApplications = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredApplications, currentPage, itemsPerPage]);

  // Status breakdown metrics
  const stats = useMemo(() => {
    const total = flattenedApplications.length;
    const newCount = flattenedApplications.filter(a => (a.status || 'New').toLowerCase() === 'new').length;
    const shortlistedCount = flattenedApplications.filter(a => (a.status || '').toLowerCase() === 'shortlisted').length;
    const viewedCount = flattenedApplications.filter(a => (a.status || '').toLowerCase() === 'viewed').length;
    const rejectedCount = flattenedApplications.filter(a => (a.status || '').toLowerCase() === 'rejected').length;
    return { total, newCount, shortlistedCount, viewedCount, rejectedCount };
  }, [flattenedApplications]);

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

  // Dynamic Sheet File Name: Job Name with Date (e.g. Frontend Devloper - 26-09-2026)
  const getSheetFileName = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const dateStr = `${d}-${m}-${y}`;
    
    let jobName = 'All Applications';
    if (colFilters.job && colFilters.job !== 'All') {
      jobName = colFilters.job;
    } else if (selectedJob && selectedJob !== 'All Jobs' && selectedJob !== 'All') {
      jobName = selectedJob;
    }
    const cleanJobName = jobName.replace(/[/\\?%*:|"<>]/g, ' ').trim();
    return `${cleanJobName} - ${dateStr}`;
  };

  // Helper to get raw application data array
  const getExportData = () => {
    return filteredApplications.length > 0 ? filteredApplications : flattenedApplications;
  };

  // Exact Google Sheet Headers (Column A to P)
  const exportHeaders = [
    'Name',
    'Email ID',
    'Mobile No.',
    'Work Experience',
    'Function',
    'Current designation',
    'Current company',
    'Highest/primary Qualification',
    'Institute',
    'current salary',
    'expected salary',
    'Question 1',
    'Question 2',
    'Question 3',
    'Question 4',
    'Question 5'
  ];

  // Helper to format rows
  const getExportRows = (dataToExport, delimiter = '\t', isCsv = false) => {
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
      const currentSalary = cand.currentCTC && cand.currentCTC !== 'N/A' ? cand.currentCTC : (cand.professionalDetails?.currentSalary || 'N/A');
      const expectedSalary = cand.expectedCTC && cand.expectedCTC !== 'N/A' ? cand.expectedCTC : (cand.professionalDetails?.expectedSalary || 'N/A');
      
      const qa = item.screeningAnswers || [];
      const q1 = qa[0]?.answer || '';
      const q2 = qa[1]?.answer || '';
      const q3 = qa[2]?.answer || '';
      const q4 = qa[3]?.answer || '';
      const q5 = qa[4]?.answer || '';

      return [
        escapeCsv(cand.name || ''),
        escapeCsv(cand.email || ''),
        escapeCsv(cand.phone || ''),
        escapeCsv(workExp),
        escapeCsv(func),
        escapeCsv(desig),
        escapeCsv(comp),
        escapeCsv(qual),
        escapeCsv(institute),
        escapeCsv(currentSalary),
        escapeCsv(expectedSalary),
        escapeCsv(q1),
        escapeCsv(q2),
        escapeCsv(q3),
        escapeCsv(q4),
        escapeCsv(q5)
      ].join(delimiter);
    });
  };

  // 1. Export & Open in Google Sheets (Opens Google Sheets directly in new tab & opens interactive viewer)
  const handleExportGoogleSheets = async () => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
      alert('No application data to export.');
      return;
    }

    const fileName = getSheetFileName();
    const rows = getExportRows(dataToExport, '\t', false);
    const tsvContent = [exportHeaders.join('\t'), ...rows].join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(tsvContent);
      }
    } catch (_) {}

    // 1. Directly open official Google Sheets in a new tab
    try {
      window.open('https://sheets.new', '_blank');
    } catch (_) {}

    // 2. Open interactive Google Sheets viewer modal in-app
    setShowOnlineSheetModal(true);
    setShowExportMenu(false);

    // 3. Show notification
    setExportNotice({
      title: 'Google Sheet Opened & Data Copied!',
      message: `Google Sheets (sheets.new) has been opened in a new tab. All ${dataToExport.length} candidates' data is copied to your clipboard. Simply press Ctrl + V in the Google Sheet to paste!`
    });
  };

  // 2. Export to CSV / Excel File with Exact Job Name & Date
  const handleExportCSV = (showNotification = true) => {
    const dataToExport = getExportData();
    if (dataToExport.length === 0) {
      if (showNotification) alert('No application data to export.');
      return;
    }

    const fileName = getSheetFileName();
    const rows = getExportRows(dataToExport, ',', true);
    const csvContent = '\uFEFF' + [exportHeaders.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fullFilename = `${fileName}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fullFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showNotification) {
      setExportNotice({
        title: 'Spreadsheet File Downloaded!',
        message: `Saved "${fullFilename}" with ${dataToExport.length} applications. You can open directly in Excel or import into Google Sheets.`
      });
      setShowExportMenu(false);
    }
  };

  // 3. Copy Table Data to Clipboard
  const handleCopyClipboard = async () => {
    const dataToExport = getExportData();
    const rows = getExportRows(dataToExport, '\t', false);
    const tsvContent = [exportHeaders.join('\t'), ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(tsvContent);
      setExportNotice({
        title: 'Copied to Clipboard!',
        message: `All ${dataToExport.length} application rows copied! You can now paste directly with Ctrl + V into any Google Sheet or Excel.`
      });
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

          {/* Direct 1-Click Google Sheet Open Button */}
          <button
            onClick={handleExportGoogleSheets}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-md shadow-emerald-600/25 cursor-pointer ml-1"
            title="Directly open applications in Google Sheet (sheets.new)"
          >
            <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H6v-2h3v2zm0-4H6v-2h3v2zm0-4H6V7h3v2zm4 8h-3v-2h3v2zm0-4h-3v-2h3v2zm0-4h-3V7h3v2zm5 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z" />
            </svg>
            <span>Open in Google Sheets</span>
          </button>

          {/* More Export Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-gray-200"
              title="More Export Options (.CSV / Copy Data)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowExportMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-[11px] font-black text-gray-800 uppercase tracking-wider">Export Applications</p>
                    <p className="text-[10px] text-gray-500">Export {filteredApplications.length} application records</p>
                  </div>

                  {/* 1. Google Sheets Option */}
                  <button
                    onClick={handleExportGoogleSheets}
                    className="w-full mt-1.5 flex items-center gap-2.5 px-3 py-2.5 hover:bg-emerald-50 text-gray-800 hover:text-emerald-800 rounded-xl transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H6v-2h3v2zm0-4H6v-2h3v2zm0-4H6V7h3v2zm4 8h-3v-2h3v2zm0-4h-3v-2h3v2zm0-4h-3V7h3v2zm5 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Open in Google Sheets</p>
                      <p className="text-[10px] text-gray-500">Copies data & opens sheets.new</p>
                    </div>
                  </button>

                  {/* 2. Download CSV Option */}
                  <button
                    onClick={() => handleExportCSV(true)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 text-gray-800 hover:text-blue-800 rounded-xl transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Download Spreadsheet (.csv)</p>
                      <p className="text-[10px] text-gray-500">{getSheetFileName()}.csv</p>
                    </div>
                  </button>

                  {/* 3. Copy to Clipboard Option */}
                  <button
                    onClick={handleCopyClipboard}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-purple-50 text-gray-800 hover:text-purple-800 rounded-xl transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Copy Table to Clipboard</p>
                      <p className="text-[10px] text-gray-500">Paste anywhere in Excel / Sheets</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

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
                <th className="py-3 px-3 min-w-[200px] whitespace-nowrap">Candidate</th>
                <th className="py-3 px-3 min-w-[160px] whitespace-nowrap">Job Applied</th>
                <th className="py-3 px-3 min-w-[110px] whitespace-nowrap">Work Exp</th>
                <th className="py-3 px-3 min-w-[130px] whitespace-nowrap">Function</th>
                <th className="py-3 px-3 min-w-[150px] whitespace-nowrap">Current Designation</th>
                <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">Current Company</th>
                <th className="py-3 px-3 min-w-[140px] whitespace-nowrap">Primary Qualification</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">Applied Date</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap text-center">Status</th>
                <th className="py-3 px-3 min-w-[130px] text-right whitespace-nowrap">Actions</th>
              </tr>

              {/* Row 2: In-Column Dedicated Filter Inputs & Dropdowns */}
              <tr className="bg-gray-50/95 border-b border-gray-200">
                
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

                {/* 3. Work Exp Filter */}
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

                {/* 5. Current Designation Filter */}
                <th className="p-2">
                  <input 
                    type="text"
                    value={colFilters.designation}
                    onChange={(e) => handleFilterChange('designation', e.target.value)}
                    placeholder="🔍 Filter role..."
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400"
                  />
                </th>

                {/* 6. Current Company Filter */}
                <th className="p-2">
                  <input 
                    type="text"
                    value={colFilters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    placeholder="🔍 Filter company..."
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400"
                  />
                </th>

                {/* 7. Primary Qualification Filter */}
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
                  <td colSpan="10" className="py-14 text-center">
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
                paginatedApplications.map((item, idx) => {
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
                      onClick={() => {
                        setSelectedCandidate(cand);
                        setSelectedApplication(item);
                      }}
                    >
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

                      {/* 3. Work Exp */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block whitespace-nowrap ${workExp === 'Fresher' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-800 border border-gray-200/60'}`}>
                          {workExp}
                        </span>
                      </td>

                      {/* 4. Function */}
                      <td className="py-3.5 px-3 text-gray-700 font-medium whitespace-nowrap">
                        {func}
                      </td>

                      {/* 5. Current Designation */}
                      <td className="py-3.5 px-3 font-semibold text-gray-900 whitespace-nowrap">
                        {desig}
                      </td>

                      {/* 6. Current Company */}
                      <td className="py-3.5 px-3 text-gray-700 font-medium whitespace-nowrap">
                        {comp}
                      </td>

                      {/* 7. Primary Qualification */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200/60 inline-block">
                          {qual}
                        </span>
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
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setSelectedApplication(item);
                            }}
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

        {/* Real Working Pagination */}
        {filteredApplications.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredApplications.length)}</span> of{' '}
              <span className="font-bold text-gray-800">{filteredApplications.length}</span> application{filteredApplications.length === 1 ? '' : 's'}
            </p>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-all text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-all text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Profile Slide-over Drawer */}
      {selectedCandidate && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 animate-in fade-in duration-200"
            onClick={() => { setSelectedCandidate(null); setSelectedApplication(null); }}
          ></div>
          <div className="fixed inset-y-0 right-0 w-full sm:w-[540px] bg-white shadow-2xl z-50 p-6 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full border-l border-gray-200 font-sans">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-start mb-6 shrink-0 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                  Candidate Profile
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg mt-1">
                  {selectedApplication ? selectedApplication.jobTitle : selectedCandidate.name}
                </h3>
              </div>
              <button 
                onClick={() => { setSelectedCandidate(null); setSelectedApplication(null); }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center bg-gray-50/70 p-6 rounded-2xl border border-gray-100">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-3 shadow-xs ring-4 ring-white ${selectedCandidate.bg || 'bg-emerald-600'}`}>
                  {selectedCandidate.initials || (selectedCandidate.name ? selectedCandidate.name.charAt(0).toUpperCase() : 'C')}
                </div>
                <h2 className="text-lg font-black text-gray-900">{selectedCandidate.name}</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedCandidate.email}</p>
                <p className="text-xs font-semibold text-gray-400 mt-1">
                  {selectedCandidate.phone || 'Phone not provided'} • {selectedCandidate.location || 'Location not specified'}
                </p>

                {/* Status selector inside drawer */}
                {selectedApplication && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Status:</span>
                    <select 
                      className={`appearance-none cursor-pointer outline-none transition-all px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border shadow-2xs ${getStatusBadgeStyles(selectedApplication.status)}`}
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

              {/* Grid of Key Candidate Attributes */}
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-gray-200/80">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Work Experience</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getWorkExp(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Function / Industry</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getFunction(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Designation</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getCurrentDesignation(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Company</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getCurrentCompany(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Qualification</h4>
                  <p className="text-xs font-extrabold text-gray-900">{getHighestQualification(selectedCandidate)}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Applied Date</h4>
                  <p className="text-xs font-extrabold text-gray-900">{selectedApplication?.appliedDate || selectedCandidate.date}</p>
                </div>
              </div>

              {/* Screening Questions Section */}
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
                        <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded-lg font-medium">
                          {item.answer || <span className="italic text-gray-400">No answer provided</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Player */}
              {(selectedApplication?.introVideo || selectedCandidate.introVideo || selectedCandidate.documents?.introVideo) && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Introductory Video</h4>
                  <VideoPlayer url={selectedApplication?.introVideo || selectedCandidate.introVideo || selectedCandidate.documents?.introVideo} maxPlayerHeight="200px" />
                </div>
              )}

              {/* Resume & Documents */}
              <div>
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3">Documents</h4>
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
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
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              {selectedCandidate.summary && (
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Summary</h4>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedCandidate.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.skills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-100">
                        {skill}
                      </span>
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

      {/* Interactive Google Spreadsheet Online Viewer Modal */}
      {showOnlineSheetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            
            {/* 1. Google Sheets App Header */}
            <div className="bg-[#f9fbfd] border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                {/* Google Sheets Green Icon */}
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H6v-2h3v2zm0-4H6v-2h3v2zm0-4H6V7h3v2zm4 8h-3v-2h3v2zm0-4h-3v-2h3v2zm0-4h-3V7h3v2zm5 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-gray-900 tracking-tight">
                      {getSheetFileName()}
                    </h2>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      Google Sheets
                    </span>
                  </div>
                  {/* Google Sheets Mock Menu */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 font-medium">
                    <span className="hover:bg-gray-200/70 px-1.5 py-0.5 rounded cursor-pointer">File</span>
                    <span className="hover:bg-gray-200/70 px-1.5 py-0.5 rounded cursor-pointer">Edit</span>
                    <span className="hover:bg-gray-200/70 px-1.5 py-0.5 rounded cursor-pointer">View</span>
                    <span className="hover:bg-gray-200/70 px-1.5 py-0.5 rounded cursor-pointer">Insert</span>
                    <span className="hover:bg-gray-200/70 px-1.5 py-0.5 rounded cursor-pointer">Format</span>
                    <span className="hover:bg-gray-200/70 px-1.5 py-0.5 rounded cursor-pointer">Data</span>
                    <span className="hover:bg-gray-200/70 px-1.5 py-0.5 rounded cursor-pointer">Tools</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Google Sheets Header */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1-Click Open in Official sheets.new */}
                <button
                  onClick={() => {
                    handleCopyClipboard();
                    window.open('https://sheets.new', '_blank');
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                  title="Open brand new Google Sheet in new tab"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H6v-2h3v2zm0-4H6v-2h3v2zm0-4H6V7h3v2zm4 8h-3v-2h3v2zm0-4h-3v-2h3v2zm0-4h-3V7h3v2zm5 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z" />
                  </svg>
                  <span>Open in sheets.new</span>
                </button>

                {/* Copy All Data */}
                <button
                  onClick={handleCopyClipboard}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy all rows formatted for Google Sheets"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copy Data</span>
                </button>

                {/* Download CSV */}
                <button
                  onClick={() => handleExportCSV(true)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Download offline CSV file"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download .CSV</span>
                </button>

                {/* Close Modal */}
                <button
                  onClick={() => setShowOnlineSheetModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 2. Info Banner with Quick Tip */}
            <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2 flex items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="font-extrabold flex items-center gap-1 text-emerald-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pre-filled Data Ready:
                </span>
                <span>All <b>{getExportData().length} candidate records</b> are loaded with Columns A to P. Click <b>"Open in sheets.new"</b> and press <b>Ctrl + V</b> to paste anytime.</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-bold shrink-0">16 Columns (A - P)</span>
            </div>

            {/* 3. Formula Bar */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-1.5 flex items-center gap-2 text-xs font-mono text-gray-600">
              <span className="font-bold text-gray-400">fx</span>
              <div className="w-[1px] h-4 bg-gray-300"></div>
              <span className="font-bold text-gray-700">A1</span>
              <div className="w-[1px] h-4 bg-gray-300"></div>
              <span className="text-gray-500 font-sans truncate">{getSheetFileName()} ({getExportData().length} Applications)</span>
            </div>

            {/* 4. Live Spreadsheet Grid */}
            <div className="flex-1 overflow-auto bg-white font-sans text-xs select-text">
              <table className="w-full border-collapse border border-gray-300 text-left min-w-[1700px]">
                
                {/* Column Letters Bar (A, B, C, D, E...) */}
                <thead className="sticky top-0 bg-[#f3f4f6] text-gray-600 font-semibold z-20 shadow-xs">
                  <tr className="divide-x divide-gray-300 border-b border-gray-300">
                    <th className="w-12 bg-gray-200 text-center py-1 text-[11px] font-bold text-gray-500 sticky left-0 z-30"></th>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].map((col, idx) => (
                      <th key={idx} className="px-3 py-1 text-center text-[11px] font-bold bg-[#f3f4f6] text-gray-600 min-w-[120px]">
                        {col}
                      </th>
                    ))}
                  </tr>

                  {/* Row 1: Header Row in Google Sheets */}
                  <tr className="divide-x divide-gray-300 border-b-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-black">
                    <td className="w-12 text-center py-2 bg-gray-200 font-bold text-gray-500 sticky left-0 z-20">1</td>
                    {exportHeaders.map((hdr, idx) => (
                      <td key={idx} className="px-3 py-2 font-black text-xs text-emerald-950 bg-emerald-50/80 whitespace-nowrap">
                        {hdr}
                      </td>
                    ))}
                  </tr>
                </thead>

                {/* Spreadsheet Data Rows */}
                <tbody className="divide-y divide-gray-200">
                  {getExportData().map((item, rowIdx) => {
                    const cand = item.candidate || {};
                    const qa = item.screeningAnswers || [];

                    return (
                      <tr key={rowIdx} className="hover:bg-blue-50/60 transition-colors divide-x divide-gray-200 group">
                        {/* Row Index on Left (2, 3, 4...) */}
                        <td className="w-12 text-center py-2 bg-gray-100 font-semibold text-gray-500 group-hover:bg-blue-100 sticky left-0 z-10 text-[11px]">
                          {rowIdx + 2}
                        </td>
                        {/* A: Name */}
                        <td className="px-3 py-2 font-bold text-gray-900 whitespace-nowrap">{cand.name || 'N/A'}</td>
                        {/* B: Email ID */}
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{cand.email || 'N/A'}</td>
                        {/* C: Mobile No. */}
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{cand.phone || '+91 98765 43210'}</td>
                        {/* D: Work Exp */}
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{getWorkExp(cand)}</td>
                        {/* E: Function */}
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{getFunction(cand)}</td>
                        {/* F: Current designation */}
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{getCurrentDesignation(cand)}</td>
                        {/* G: Current company */}
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{getCurrentCompany(cand)}</td>
                        {/* H: Highest/primary Qualification */}
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{getHighestQualification(cand)}</td>
                        {/* I: Institute */}
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{getInstitute(cand)}</td>
                        {/* J: Current Salary */}
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{cand.currentCTC && cand.currentCTC !== 'N/A' ? cand.currentCTC : (cand.professionalDetails?.currentSalary || 'N/A')}</td>
                        {/* K: Expected Salary */}
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{cand.expectedCTC && cand.expectedCTC !== 'N/A' ? cand.expectedCTC : (cand.professionalDetails?.expectedSalary || 'N/A')}</td>
                        {/* L: Question 1 */}
                        <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={qa[0]?.answer || ''}>{qa[0]?.answer || '-'}</td>
                        {/* M: Question 2 */}
                        <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={qa[1]?.answer || ''}>{qa[1]?.answer || '-'}</td>
                        {/* N: Question 3 */}
                        <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={qa[2]?.answer || ''}>{qa[2]?.answer || '-'}</td>
                        {/* O: Question 4 */}
                        <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={qa[3]?.answer || ''}>{qa[3]?.answer || '-'}</td>
                        {/* P: Question 5 */}
                        <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate" title={qa[4]?.answer || ''}>{qa[4]?.answer || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5. Google Sheets Bottom Tab Bar */}
            <div className="bg-[#f0f3f4] border-t border-gray-300 px-4 py-2 flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-gray-300 rounded text-gray-700 font-bold">+</button>
                <div className="flex items-center gap-1 bg-white border border-gray-300 px-3 py-1 rounded-t shadow-xs border-b-2 border-b-emerald-600 font-bold text-gray-900">
                  <span>Sheet1</span>
                  <span className="text-[9px] text-gray-400">▼</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span>{getExportData().length} Applications loaded</span>
                <span>•</span>
                <span>Columns: A to P (16)</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CandidatesTab;
