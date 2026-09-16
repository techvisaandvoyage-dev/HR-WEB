import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  Mail, 
  Phone, 
  Briefcase, 
  Globe, 
  FileText, 
  X, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers,
  Tag,
  HelpCircle,
  Sparkles,
  Sliders,
  Shield,
  BarChart2,
  UserX,
  UserCheck,
  Settings,
  Check
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EmployersTab() {
  const [activeMainTab, setActiveMainTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subtab');
    if (sub && ['list', 'controls'].includes(sub)) return sub;
    const saved = localStorage.getItem('adminEmployersSubtab');
    if (saved && ['list', 'controls'].includes(saved)) return saved;
    return 'list';
  });

  const setActiveMainTab = (newSubTab) => {
    setActiveMainTabState(newSubTab);
    localStorage.setItem('adminEmployersSubtab', newSubTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'employers');
    params.set('subtab', newSubTab);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab');
      if (sub && ['list', 'controls'].includes(sub)) {
        setActiveMainTabState(sub);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEmployer, setDetailEmployer] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview'); // 'overview' or 'controls'
  const [togglingJobId, setTogglingJobId] = useState(null);
  const [updatingControlId, setUpdatingControlId] = useState(null);
  const [expandedJobs, setExpandedJobs] = useState({});

  const [expandedEmployers, setExpandedEmployers] = useState({});
  const [loadingJobsMap, setLoadingJobsMap] = useState({});

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleExpandJob = (jobId) => {
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const toggleExpandEmployer = async (empId) => {
    setExpandedEmployers(prev => {
      const willExpand = !prev[empId];
      if (willExpand) {
        // If employer jobs not loaded yet, fetch in background
        const empr = employers.find(e => (e._id === empId || e.id === empId));
        if (!empr?.jobs || empr.jobs.length === 0) {
          fetchEmployerJobs(empId);
        }
      }
      return {
        ...prev,
        [empId]: willExpand
      };
    });
  };

  const fetchEmployerJobs = async (empId) => {
    try {
      setLoadingJobsMap(prev => ({ ...prev, [empId]: true }));
      const res = await fetch(`${API_URL}/api/admin/employers/${empId}`);
      const data = await res.json();
      if (data.success && data.data?.jobs) {
        setEmployers(prev => prev.map(e => 
          (e._id === empId || e.id === empId) 
            ? { ...e, ...data.data, jobs: data.data.jobs } 
            : e
        ));
      }
    } catch (err) {
      console.error('Error fetching employer jobs for dropdown:', err);
    } finally {
      setLoadingJobsMap(prev => ({ ...prev, [empId]: false }));
    }
  };

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (industryFilter !== 'All') queryParams.append('industry', industryFilter);

      const res = await fetch(`${API_URL}/api/admin/employers?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEmployers(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch employers');
      }
    } catch (err) {
      console.error('Error fetching employers:', err);
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, [industryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployers();
  };

  const handleViewEmployer = async (employer, initialTab = 'overview') => {
    setSelectedEmployer(employer);
    setDrawerTab(initialTab);
    try {
      setDetailLoading(true);
      const res = await fetch(`${API_URL}/api/admin/employers/${employer._id || employer.id}`);
      const data = await res.json();
      if (data.success) {
        setDetailEmployer(data.data);
      } else {
        setDetailEmployer(employer);
      }
    } catch (err) {
      console.error('Error fetching employer detail:', err);
      setDetailEmployer(employer);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleJobStatus = async (jobId, employerId) => {
    try {
      setTogglingJobId(jobId);
      const res = await fetch(`${API_URL}/api/admin/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        const newStatus = data.data.status;
        // Update employers state in list/dropdown
        setEmployers(prev => prev.map(empr => {
          if ((empr._id === employerId || empr.id === employerId) && empr.jobs) {
            const updatedJobs = empr.jobs.map(j => 
              (j._id === jobId || j.id === jobId) ? { ...j, status: newStatus } : j
            );
            const activeCount = updatedJobs.filter(j => j.status === 'Active').length;
            const closedCount = updatedJobs.filter(j => j.status === 'Closed').length;
            return {
              ...empr,
              jobs: updatedJobs,
              activeJobs: activeCount,
              closedJobs: closedCount
            };
          }
          return empr;
        }));

        if (detailEmployer?.jobs) {
          const updatedJobs = detailEmployer.jobs.map(j => 
            (j._id === jobId || j.id === jobId) ? { ...j, status: newStatus } : j
          );
          setDetailEmployer({ ...detailEmployer, jobs: updatedJobs });
        }
        showToast(`Job status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error toggling job status:', err);
    } finally {
      setTogglingJobId(null);
    }
  };

  const handleToggleEmployerControl = async (employerId, field, currentValue) => {
    const newValue = !currentValue;
    const updateKey = `${employerId}-${field}`;
    try {
      setUpdatingControlId(updateKey);
      const res = await fetch(`${API_URL}/api/admin/employers/${employerId}/controls`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      });
      const data = await res.json();
      if (data.success) {
        if (detailEmployer && (detailEmployer._id === employerId || detailEmployer.id === employerId)) {
          setDetailEmployer(prev => ({
            ...prev,
            [field]: newValue
          }));
        }
        setEmployers(prev => prev.map(e => 
          (e._id === employerId || e.id === employerId) ? { ...e, [field]: newValue } : e
        ));
        showToast(newValue ? 'Recruiter Card Hidden for this employer' : 'Recruiter Card Visible for this employer');
      } else {
        alert(data.message || 'Failed to update control');
      }
    } catch (err) {
      console.error('Error updating employer control:', err);
      alert('Failed to connect to server');
    } finally {
      setUpdatingControlId(null);
    }
  };

  const [globalCardVisible, setGlobalCardVisible] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/site-settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setGlobalCardVisible(!data.data.hidePostedByCardGlobally);
      }
    } catch (err) {
      console.error('Error fetching site settings:', err);
    }
  };

  useEffect(() => {
    fetchGlobalSettings();
  }, []);

  const handleToggleGlobalVisibility = async (currentVisibleState) => {
    const newVisibleState = !currentVisibleState;
    const hideGlobally = !newVisibleState;
    try {
      setGlobalLoading(true);
      const res = await fetch(`${API_URL}/api/admin/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidePostedByCardGlobally: hideGlobally })
      });
      const data = await res.json();
      if (data.success) {
        setGlobalCardVisible(newVisibleState);
        setEmployers(prev => prev.map(e => ({ ...e, hidePostedByCard: hideGlobally })));
        showToast(newVisibleState ? 'Recruiter Card ENABLED website-wide' : 'Recruiter Card DISABLED website-wide');
      } else {
        alert(data.message || 'Failed to update global site setting');
      }
    } catch (err) {
      console.error('Error updating global site settings:', err);
      alert('Failed to connect to server');
    } finally {
      setGlobalLoading(false);
    }
  };

  const industryOptions = [
    'All',
    'IT & Software',
    'Finance & Banking',
    'Healthcare & Pharma',
    'Education & EdTech',
    'Manufacturing',
    'E-commerce & Retail',
    'Marketing & Media',
    'Consulting',
    'Other'
  ];

  const currentEmployer = detailEmployer || selectedEmployer;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[999] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-gray-800 flex items-center gap-3 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Registered Employers
          </h1>
          <p className="text-gray-500 mt-1">
            Manage registered companies, recruiters, their posted job vacancies, and public card display visibility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl text-sm border border-blue-100">
            {employers.length} Companies
          </span>
          <button
            onClick={fetchEmployers}
            disabled={loading}
            className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveMainTab('list')}
          className={`px-5 py-3 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'list'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          All Employers Directory
        </button>
        <button
          onClick={() => setActiveMainTab('controls')}
          className={`px-5 py-3 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'controls'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-600" />
          Display & Visibility Controls
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black rounded-full uppercase">
            New
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL EMPLOYERS DIRECTORY                                            */}
      {/* ========================================================================= */}
      {activeMainTab === 'list' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by company name, contact person, email, phone, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shrink-0 cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <Filter className="w-4 h-4 text-gray-400" />
                <span>Industry:</span>
              </div>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {industryOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt === 'All' ? 'All Industries' : opt}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Employers Data Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-gray-400 text-sm flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <span>Loading registered employers...</span>
              </div>
            ) : employers.length === 0 ? (
              <div className="py-20 text-center text-gray-400 text-sm">
                No employers found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Company / Recruiter</th>
                      <th className="py-3.5 px-6">Contact Details</th>
                      <th className="py-3.5 px-6">Industry & Size</th>
                      <th className="py-3.5 px-6">Location</th>
                      <th className="py-3.5 px-6 text-center">Jobs Posted</th>
                      <th className="py-3.5 px-6">Registered Date</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {employers.map((empr) => {
                      const empId = empr._id || empr.id;
                      const isExpanded = !!expandedEmployers[empId];
                      const empJobs = empr.jobs || [];
                      const isLoadingThisJobs = !!loadingJobsMap[empId];

                      return (
                        <React.Fragment key={empId}>
                          <tr 
                            onClick={() => toggleExpandEmployer(empId)}
                            className={`transition-colors cursor-pointer group select-none ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}`}
                          >
                            {/* Company */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                  {empr.companyName 
                                    ? empr.companyName.charAt(0).toUpperCase() 
                                    : (empr.fullName ? empr.fullName.charAt(0).toUpperCase() : 'C')}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                      {empr.companyName || empr.fullName}
                                    </p>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180 text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 font-normal">
                                    {empr.fullName} {empr.designation ? `(${empr.designation})` : ''}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="py-4 px-6 text-xs text-gray-600 space-y-1" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 font-medium text-gray-800">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <span className="select-all">{empr.email}</span>
                              </div>
                              {empr.mobile && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{empr.mobile}</span>
                                </div>
                              )}
                            </td>

                            {/* Industry & Size */}
                            <td className="py-4 px-6">
                              <p className="font-semibold text-gray-900 text-xs">{empr.industry || 'Company'}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{empr.employees ? `${empr.employees} employees` : 'Size not set'}</p>
                            </td>

                            {/* Location */}
                            <td className="py-4 px-6 text-xs">
                              <div className="flex items-center gap-1 font-medium text-gray-800">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{empr.location || 'Not set'}</span>
                              </div>
                            </td>

                            {/* Jobs Posted */}
                            <td className="py-4 px-6 text-center">
                              <div className="inline-flex flex-col items-center px-2 py-1 rounded-lg">
                                <span className="font-bold text-gray-900 text-sm">{empr.totalJobs || 0}</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">{empr.activeJobs || 0} active</span>
                              </div>
                            </td>

                            {/* Registered Date */}
                            <td className="py-4 px-6 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>{new Date(empr.createdAt).toLocaleDateString()}</span>
                              </div>
                              {empr.lastLogin && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Active: {new Date(empr.lastLogin).toLocaleDateString()}
                                </p>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewEmployer(empr, 'overview');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-xl transition-all duration-150 border border-blue-200 hover:border-blue-600 cursor-pointer shadow-xs"
                                title="Open sidebar preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Jobs</span>
                              </button>
                            </td>
                          </tr>

                          {/* ========================================================================= */}
                          {/* INLINE DROPDOWN: COMPANY DETAILS & POSTED JOBS (SMOOTH ACCORDION)         */}
                          {/* ========================================================================= */}
                          <tr className={`border-b transition-colors duration-300 ${isExpanded ? 'bg-slate-50/90 border-gray-200' : 'border-transparent'}`}>
                            <td colSpan={7} className="p-0 border-0">
                              <div
                                className={`grid transition-all duration-300 ease-in-out ${
                                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                                }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="p-4 sm:p-6 transition-all duration-300">
                                    <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm space-y-6">
                                      
                                      {/* Company Details Frame */}
                                      <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 pb-2">
                                          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                            Company Details & Contact Overview
                                          </h4>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-medium text-gray-500">
                                              Registered: <strong className="text-gray-800">{new Date(empr.createdAt).toLocaleDateString()}</strong>
                                            </span>
                                            {empr.website && (
                                              <a
                                                href={empr.website.startsWith('http') ? empr.website : `https://${empr.website}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100"
                                              >
                                                <Globe className="w-3 h-3" /> Visit Website <ExternalLink className="w-2.5 h-2.5" />
                                              </a>
                                            )}
                                          </div>
                                        </div>

                                        {/* Company Details Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                          <div>
                                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Company / Recruiter</span>
                                            <span className="font-bold text-gray-900 block mt-0.5">{empr.companyName || 'Not Set'}</span>
                                            <span className="text-[11px] text-gray-500 font-normal">{empr.fullName} {empr.designation ? `(${empr.designation})` : ''}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Contact Email & Phone</span>
                                            <span className="font-semibold text-gray-900 block mt-0.5 select-all">{empr.email}</span>
                                            <span className="text-[11px] text-gray-500">{empr.mobile || 'No phone'}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Industry & Size</span>
                                            <span className="font-bold text-gray-900 block mt-0.5">{empr.industry || 'General'}</span>
                                            <span className="text-[11px] text-gray-500">{empr.employees ? `${empr.employees} employees` : 'Size not specified'}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Location</span>
                                            <span className="font-bold text-gray-900 block mt-0.5 flex items-center gap-1">
                                              <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                              {empr.location || 'Not set'}
                                            </span>
                                          </div>
                                        </div>

                                        {/* About Company snippet */}
                                        {empr.aboutCompany && (
                                          <div className="pt-2 border-t border-gray-100">
                                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-1">About Company</span>
                                            <p className="text-xs text-gray-600 leading-relaxed bg-white p-3 rounded-lg border border-gray-200/70">
                                              {empr.aboutCompany}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Posted Jobs Section */}
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                                            Posted Job Vacancies ({empJobs.length})
                                          </h4>
                                          <span className="text-xs font-semibold text-gray-500">
                                            {empJobs.filter(j => j.status === 'Active').length} Live Vacancies
                                          </span>
                                        </div>

                                        {isLoadingThisJobs ? (
                                          <div className="py-8 text-center text-xs text-blue-600 font-medium flex items-center justify-center gap-2">
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            Loading jobs for {empr.companyName || empr.fullName}...
                                          </div>
                                        ) : empJobs.length === 0 ? (
                                          <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 text-center text-xs text-gray-400">
                                            No job vacancies posted yet by this employer.
                                          </div>
                                        ) : (
                                          <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                            <table className="w-full text-left border-collapse text-xs">
                                              <thead>
                                                <tr className="bg-gray-50/90 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                  <th className="py-2.5 px-4">Job Title & Category</th>
                                                  <th className="py-2.5 px-3">Openings</th>
                                                  <th className="py-2.5 px-3">Salary & Exp</th>
                                                  <th className="py-2.5 px-3 text-center">Applications & Views</th>
                                                  <th className="py-2.5 px-3">Posted Date</th>
                                                  <th className="py-2.5 px-3 text-center">Status</th>
                                                  <th className="py-2.5 px-4 text-right">Actions</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-100 bg-white">
                                                {empJobs.map((job) => {
                                                  const jId = job._id || job.id;
                                                  const isJobDescExpanded = !!expandedJobs[jId];
                                                  const isActive = job.status === 'Active';

                                                  return (
                                                    <React.Fragment key={jId}>
                                                      <tr className="hover:bg-blue-50/30 transition-colors">
                                                        {/* Job Title */}
                                                        <td className="py-3 px-4">
                                                          <div className="flex items-start gap-2">
                                                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-400'}`} />
                                                            <div>
                                                              <p className="font-bold text-gray-900 text-xs leading-snug">{job.title}</p>
                                                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-100">
                                                                  {job.details?.employmentType || 'Full-time'}
                                                                </span>
                                                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-100">
                                                                  {job.details?.workLocation || 'On-site'}
                                                                </span>
                                                                {job.details?.jobCategory && (
                                                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold text-[10px] border border-amber-100">
                                                                    {job.details.jobCategory}
                                                                  </span>
                                                                )}
                                                                {job.location && (
                                                                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                                                    <MapPin className="w-2.5 h-2.5 text-gray-400" /> {job.location}
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </td>

                                                        {/* Openings */}
                                                        <td className="py-3 px-3">
                                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                            <Users className="w-3 h-3 text-purple-600" />
                                                            {(job.details?.openings || job.openings || '1')} {Number(job.details?.openings || job.openings || 1) === 1 ? 'Opening' : 'Openings'}
                                                          </span>
                                                        </td>

                                                        {/* Salary & Exp */}
                                                        <td className="py-3 px-3">
                                                          <p className="font-bold text-gray-900 text-[11px]">{job.salary || 'Negotiable'}</p>
                                                          <p className="text-[10px] text-gray-500">{job.details?.experience || 'Any Exp'}</p>
                                                        </td>

                                                        {/* Applications & Views */}
                                                        <td className="py-3 px-3 text-center">
                                                          <div className="inline-flex flex-col items-center">
                                                            <span className="font-bold text-blue-600 text-[11px]">
                                                             {job.applications || 0} applications
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">
                                                              {job.views || 0} views • {job.recruiterActions || 0} actions
                                                            </span>
                                                          </div>
                                                        </td>

                                                        {/* Posted Date */}
                                                        <td className="py-3 px-3 text-gray-500 text-[11px]">
                                                          {new Date(job.createdAt).toLocaleDateString()}
                                                        </td>

                                                        {/* Status Capsule */}
                                                        <td className="py-3 px-3 text-center">
                                                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                                                            isActive
                                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                          }`}>
                                                            {isActive ? 'ACTIVE' : 'CLOSED'}
                                                          </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="py-3 px-4 text-right space-x-1.5">
                                                          <button
                                                            onClick={() => handleToggleJobStatus(jId, empId)}
                                                            disabled={togglingJobId === jId}
                                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 border cursor-pointer ${
                                                              isActive
                                                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                            }`}
                                                            title={isActive ? 'Close this job' : 'Reactivate this job'}
                                                          >
                                                            {togglingJobId === jId ? 'Updating...' : (isActive ? 'Close' : 'Reopen')}
                                                          </button>

                                                          {job.details?.aboutRole && (
                                                            <button
                                                              onClick={() => toggleExpandJob(jId)}
                                                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-[11px] font-medium transition-colors border border-gray-200 cursor-pointer"
                                                              title="Toggle description"
                                                            >
                                                              {isJobDescExpanded ? 'Hide' : 'Details'}
                                                            </button>
                                                          )}
                                                        </td>
                                                      </tr>

                                                      {/* Collapsible job details / about role (Smooth Grid) */}
                                                      {job.details?.aboutRole && (
                                                        <tr className="bg-blue-50/20">
                                                          <td colSpan={7} className="p-0 border-0">
                                                            <div className={`grid transition-all duration-300 ease-in-out ${isJobDescExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                                                              <div className="overflow-hidden">
                                                                <div className="p-3.5 border-t border-gray-100">
                                                                  <div className="space-y-1 text-xs">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Role Description</span>
                                                                    <div 
                                                                      className="prose prose-xs max-w-none text-gray-700 bg-white p-3 rounded-lg border border-gray-200 leading-relaxed"
                                                                      dangerouslySetInnerHTML={{ __html: job.details.aboutRole }}
                                                                    />
                                                                  </div>
                                                                </div>
                                                             </div>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      )}
                                                    </React.Fragment>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>

                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WEBSITE-WIDE DISPLAY & VISIBILITY CONTROLS                         */}
      {/* ========================================================================= */}
      {activeMainTab === 'controls' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
          
          {/* Main Website-Wide Master Control Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">
            
            {/* Top Header Banner */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 p-8 text-white relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="px-3.5 py-1 bg-white/20 text-purple-200 text-xs font-black rounded-full uppercase tracking-wider inline-flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> Website-Wide Master Control
                </span>
                <h2 className="text-3xl font-black tracking-tight">
                  Recruiter Card & Analytics Display
                </h2>
                <p className="text-purple-200 text-sm max-w-xl leading-relaxed">
                  Toggle whether candidate job seekers see the <strong>"Posted by" Recruiter Card and Analytics</strong> across all job vacancies on the entire website.
                </p>
              </div>
            </div>

            {/* Master Toggle Area */}
            <div className="p-8 space-y-8">
              
              {/* Single Master Switch Box */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-lg">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-gray-900 text-lg">
                      "Posted by" Recruiter Card Display
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      globalCardVisible 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {globalCardVisible ? '● ENABLED (VISIBLE)' : '○ DISABLED (HIDDEN)'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {globalCardVisible 
                      ? 'By default, this feature is Turned ON (Visible). All job vacancies across the entire website currently display the recruiter card, company profile, and analytics.'
                      : 'This feature is Turned OFF (Hidden). The recruiter card and analytics are disabled and hidden across the entire website.'}
                  </p>
                </div>

                {/* Master Switch Button */}
                <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleGlobalVisibility(globalCardVisible)}
                    disabled={globalLoading}
                    className={`relative inline-flex h-9 w-18 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-sm ${
                      globalCardVisible ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                    title={globalCardVisible ? 'Click to disable for entire website' : 'Click to enable for entire website'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        globalCardVisible ? 'translate-x-9' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-[11px] font-bold text-gray-500">
                    {globalCardVisible ? 'Turn OFF to Disable' : 'Turn ON to Enable'}
                  </span>
                </div>
              </div>

              {/* Live Preview on Public Job Page */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Live Website Preview:
                  </h4>
                  <span className={`text-xs font-bold ${globalCardVisible ? 'text-green-600' : 'text-amber-600'}`}>
                    {globalCardVisible ? '● Public View: Card Visible' : '○ Public View: Card Hidden'}
                  </span>
                </div>

                {globalCardVisible ? (
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Posted by</span>
                      <div className="flex items-center gap-3.5 mt-2">
                        <div className="w-12 h-12 bg-blue-100 text-blue-800 border border-blue-200 rounded-full flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                          HR
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900">Demo Recruiter</h4>
                          <p className="text-xs text-gray-600">HR Manager at Demo Technologies</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-green-50 text-green-700 border border-green-200">
                              Company / Business
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              • 51-200 Employees
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">Last Active: Today</p>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Bar */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-around items-center text-center">
                        <div>
                          <div className="text-xl font-bold font-serif text-gray-900">142</div>
                          <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Job Views</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold font-serif text-gray-900">38</div>
                          <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Applications</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold font-serif text-gray-900">24</div>
                          <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Recruiter Actions</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-center gap-3 font-medium text-sm">
                    <EyeOff className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">Recruiter Card is Disabled Website-Wide</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        The entire "Posted by" recruiter card and analytics stats are hidden from all job seekers browsing jobs on the website.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER EMPLOYER DETAILS & CONTROLS DRAWER                             */}
      {/* ========================================================================= */}
      {selectedEmployer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-white sticky top-0 z-10 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                  {currentEmployer.companyName 
                    ? currentEmployer.companyName.charAt(0).toUpperCase() 
                    : (currentEmployer.fullName ? currentEmployer.fullName.charAt(0).toUpperCase() : 'C')}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">{currentEmployer.companyName || currentEmployer.fullName}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {currentEmployer.fullName} • {currentEmployer.industry || 'Company'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {currentEmployer.location && (
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-600" /> {currentEmployer.location}
                      </span>
                    )}
                    {currentEmployer.website && (
                      <a 
                        href={currentEmployer.website.startsWith('http') ? currentEmployer.website : `https://${currentEmployer.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" /> Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEmployer(null); setDetailEmployer(null); }}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs inside Drawer */}
            <div className="flex items-center gap-4 px-6 pt-3 border-b border-gray-200 bg-gray-50/70">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`pb-3 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  drawerTab === 'overview'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Overview & Vacancies ({currentEmployer.jobs?.length || 0})
              </button>
              <button
                onClick={() => setDrawerTab('controls')}
                className={`pb-3 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  drawerTab === 'controls'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                Display & Visibility Controls
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {detailLoading && (
                <div className="py-4 text-center text-xs text-blue-600 font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Loading latest details...
                </div>
              )}

              {/* ============================================================= */}
              {/* DRAWER TAB 1: OVERVIEW & JOBS                                 */}
              {/* ============================================================= */}
              {drawerTab === 'overview' && (
                <div className="space-y-6">
                  {/* Company Info Overview Card */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company & Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 block">Contact Email</span>
                        <span className="font-semibold text-gray-900 select-all">{currentEmployer.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Contact Mobile</span>
                        <span className="font-semibold text-gray-900">{currentEmployer.mobile || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Representative Designation</span>
                        <span className="font-semibold text-gray-900">{currentEmployer.designation || 'Recruiter'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Company Size</span>
                        <span className="font-semibold text-gray-900">{currentEmployer.employees || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Registered On</span>
                        <span className="font-semibold text-gray-900">{new Date(currentEmployer.createdAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Last Active / Login</span>
                        <span className="font-semibold text-gray-900">
                          {currentEmployer.lastLogin ? new Date(currentEmployer.lastLogin).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* About Company */}
                  {currentEmployer.aboutCompany && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">About Company</h3>
                      <p className="text-xs text-gray-700 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/60 leading-relaxed">
                        {currentEmployer.aboutCompany}
                      </p>
                    </div>
                  )}

                  {/* Posted Jobs Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        Posted Job Vacancies ({currentEmployer.jobs?.length || 0})
                      </h3>
                    </div>

                    {(!currentEmployer.jobs || currentEmployer.jobs.length === 0) ? (
                      <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center text-xs text-gray-400">
                        This employer has not posted any jobs yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentEmployer.jobs.map((job) => {
                          const isExpanded = !!expandedJobs[job._id || job.id];
                          return (
                            <div 
                              key={job._id || job.id} 
                              className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3.5 hover:border-blue-300 transition-colors"
                            >
                              {/* Header: Title, Badges, Toggle Status */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-bold text-gray-900 text-base">{job.title}</h4>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      job.status === 'Active' 
                                        ? 'bg-green-100 text-green-700 border border-green-200' 
                                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                                    }`}>
                                      {job.status || 'Active'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 shadow-sm">
                                      <Users className="w-3 h-3 text-purple-600" />
                                      {(job.details?.openings || job.openings || '1')} {Number(job.details?.openings || job.openings || 1) === 1 ? 'Opening' : 'Openings'}
                                    </span>
                                  </div>

                                  {/* Subtitle meta */}
                                  <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs text-gray-600">
                                    <span className="flex items-center gap-1 font-medium text-gray-800">
                                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {job.location}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-100">
                                      {job.details?.employmentType || 'Full-time'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-100">
                                      {job.details?.workLocation || 'On-site'}
                                    </span>
                                    {job.details?.jobCategory && (
                                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium text-[11px] border border-amber-100 flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-amber-600" /> {job.details.jobCategory}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleToggleJobStatus(job._id || job.id)}
                                    disabled={togglingJobId === (job._id || job.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                      job.status === 'Active'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                    }`}
                                  >
                                    {job.status === 'Active' ? 'Close Job' : 'Reactivate Job'}
                                  </button>
                                </div>
                              </div>

                              {/* Key stats pills */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-xs">
                                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                  <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Salary</span>
                                  <span className="font-bold text-gray-900 block mt-0.5">{job.salary || 'Negotiable'}</span>
                                  {job.employerProvided && <span className="text-[10px] text-gray-500 font-normal">(Employer provided)</span>}
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                  <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Experience</span>
                                  <span className="font-bold text-gray-900 block mt-0.5">{job.details?.experience || 'Any Experience'}</span>
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                  <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Applications</span>
                                  <span className="font-bold text-blue-600 block mt-0.5">{job.applications || 0} candidates</span>
                                </div>
                                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                  <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block">Views & Actions</span>
                                  <span className="font-bold text-gray-900 block mt-0.5">{job.views || 0} views • {job.recruiterActions || 0} actions</span>
                                </div>
                              </div>

                              {/* Footer with Posted date & Expand Button */}
                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-gray-400" /> Posted on {new Date(job.createdAt).toLocaleDateString()}
                                  </span>
                                  {job.details?.openings && (
                                    <span className="font-bold text-purple-700">
                                      • {job.details.openings} Openings
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => toggleExpandJob(job._id || job.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors border border-blue-200 cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Hide Full Details' : 'View Full Details'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {/* Collapsible Full Details */}
                              {isExpanded && (
                                <div className="pt-4 mt-3 border-t border-gray-200 space-y-4 text-xs animate-in fade-in duration-200 bg-gray-50/70 p-4 rounded-xl border border-gray-200/80">
                                  {job.details?.aboutRole && (
                                    <div className="space-y-1.5">
                                      <h5 className="font-bold text-gray-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-blue-700">
                                        <Sparkles className="w-3.5 h-3.5" /> About Role
                                      </h5>
                                      <div 
                                        className="prose prose-xs max-w-none text-gray-700 bg-white p-3.5 rounded-xl border border-gray-200/80 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: job.details.aboutRole }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* DRAWER TAB 2: DISPLAY & VISIBILITY CONTROLS                   */}
              {/* ============================================================= */}
              {drawerTab === 'controls' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-purple-50/70 border border-purple-200/70 rounded-2xl p-5 space-y-2">
                    <h3 className="font-bold text-purple-950 text-sm flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-purple-600" />
                      Public Display Configuration for {currentEmployer.companyName || currentEmployer.fullName}
                    </h3>
                    <p className="text-xs text-purple-800 leading-relaxed">
                      Control visibility of recruiter information on public job vacancies posted by this employer.
                    </p>
                  </div>

                  {/* Single Toggle Card: "Posted by" Recruiter Card */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-base">"Posted by" Recruiter Card Display</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            !currentEmployer.hidePostedByCard
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {!currentEmployer.hidePostedByCard ? 'TURNED ON (VISIBLE)' : 'TURNED OFF (HIDDEN)'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Default is <strong>Turned ON (Visible)</strong>, displaying the recruiter profile, name, designation, and company details to candidates. Switch to <strong>OFF (Hidden)</strong> to remove the card from public job pages.
                        </p>
                      </div>

                      {/* Switch Button: ON (Green) = Visible, OFF (Gray) = Hidden */}
                      <button
                        type="button"
                        onClick={() => handleToggleEmployerControl(currentEmployer._id || currentEmployer.id, 'hidePostedByCard', currentEmployer.hidePostedByCard)}
                        disabled={updatingControlId === `${currentEmployer._id || currentEmployer.id}-hidePostedByCard`}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          !currentEmployer.hidePostedByCard ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                        title={!currentEmployer.hidePostedByCard ? 'Turn OFF to hide recruiter card' : 'Turn ON to show recruiter card'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            !currentEmployer.hidePostedByCard ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Visual Preview Box */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                          Live Preview on Public Job Page:
                        </span>
                        <span className={`text-[11px] font-bold ${!currentEmployer.hidePostedByCard ? 'text-green-700' : 'text-amber-700'}`}>
                          {!currentEmployer.hidePostedByCard ? '● Visible to candidates' : '○ Hidden from candidates'}
                        </span>
                      </div>
                      {!currentEmployer.hidePostedByCard ? (
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold text-sm flex items-center justify-center shrink-0">
                            {currentEmployer.companyName ? currentEmployer.companyName.substring(0, 2).toUpperCase() : 'HR'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{currentEmployer.fullName || 'Recruiter'}</p>
                            <p className="text-[11px] text-gray-600">{currentEmployer.designation || 'HR'} at {currentEmployer.companyName || 'Company'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center gap-2 font-medium">
                          <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>The 'Posted by' recruiter card is <strong>hidden</strong> from job seekers.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => { setSelectedEmployer(null); setDetailEmployer(null); }}
                className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
