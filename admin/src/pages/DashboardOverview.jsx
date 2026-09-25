import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  ArrowUpRight, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone,
  RefreshCw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  LayoutDashboard,
  Search,
  Filter,
  X,
  Award,
  GraduationCap,
  Eye,
  EyeOff,
  Globe,
  Sliders,
  SlidersHorizontal,
  Check,
  AlertCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DashboardOverview({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);

  const [activeSubTab, setActiveSubTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('subtab') || 'overview';
  });

  // Employer Sub-Section State ('list' or 'controls')
  const [employerSubTab, setEmployerSubTab] = useState('list');
  const [globalCardVisible, setGlobalCardVisible] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [updatingControlId, setUpdatingControlId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Employers List State
  const [employers, setEmployers] = useState([]);
  const [loadingEmployers, setLoadingEmployers] = useState(false);
  const [employerSearch, setEmployerSearch] = useState('');
  const [employerTypeFilter, setEmployerTypeFilter] = useState('All');
  const [employerIndustryFilter, setEmployerIndustryFilter] = useState('All');
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [detailEmployer, setDetailEmployer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Employees List State
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeExpFilter, setEmployeeExpFilter] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const handleOpenEmployerDrawer = async (employer) => {
    setSelectedEmployer(employer);
    setDetailEmployer(employer);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/employers/${employer._id || employer.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDetailEmployer(data.data);
        setSelectedEmployer(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) {
      console.error('Error fetching employer detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSubTabChange = (tabKey) => {
    setActiveSubTab(tabKey);
    const params = new URLSearchParams(window.location.search);
    params.set('subtab', tabKey);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setErrorStats(null);
      const res = await fetch(`${API_URL}/api/admin/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setErrorStats(data.message || 'Failed to fetch dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setErrorStats('Unable to connect to server.');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Site Settings (Global Visibility)
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

  // Fetch Employers Directory List
  const fetchEmployers = async () => {
    try {
      setLoadingEmployers(true);
      const res = await fetch(`${API_URL}/api/admin/employers`);
      const data = await res.json();
      if (data.success) {
        setEmployers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching employers list:', err);
    } finally {
      setLoadingEmployers(false);
    }
  };

  // Fetch Employees Directory List
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await fetch(`${API_URL}/api/admin/employees`);
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching employees list:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Toggle Global Visibility
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
        if (selectedEmployer) {
          setSelectedEmployer(prev => prev ? { ...prev, hidePostedByCard: hideGlobally } : null);
        }
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

  // Toggle Employer Specific Control
  const handleToggleEmployerControl = async (employerId, field, currentValue) => {
    const newValue = !currentValue;
    try {
      setUpdatingControlId(employerId);
      const res = await fetch(`${API_URL}/api/admin/employers/${employerId}/controls`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      });
      const data = await res.json();
      if (data.success) {
        setEmployers(prev => prev.map(e => {
          if ((e._id || e.id) === employerId) {
            return { ...e, [field]: newValue };
          }
          return e;
        }));
        if (selectedEmployer && (selectedEmployer._id || selectedEmployer.id) === employerId) {
          setSelectedEmployer(prev => ({ ...prev, [field]: newValue }));
        }
        showToast(newValue ? 'Recruiter Card HIDDEN for this employer' : 'Recruiter Card VISIBLE for this employer');
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

  useEffect(() => {
    fetchStats();
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'employers' && employers.length === 0) {
      fetchEmployers();
      fetchGlobalSettings();
    } else if (activeSubTab === 'employees' && employees.length === 0) {
      fetchEmployees();
    }
  }, [activeSubTab]);

  const totals = stats?.totals || {
    totalEmployees: 0,
    totalEmployers: 0,
    totalJobs: 0,
    activeJobs: 0,
    closedJobs: 0,
    totalApplications: 0
  };

  const trends = stats?.registrationTrends || [];
  const maxTrend = Math.max(...trends.map(t => Math.max(t.employees, t.employers, 1)), 5);

  // Helper for Employer type label
  const getEmployerTypeLabel = (empr) => {
    if (empr?.hiringFor === 'consultant' || empr?.isConsultant) return 'Consultant';
    if (empr?.accountType === 'individual') return 'Individual / Proprietor';
    return 'Company';
  };

  // Filter Employers
  const filteredEmployers = useMemo(() => {
    return employers.filter(empr => {
      const q = employerSearch.toLowerCase().trim();
      const comp = (empr.companyName || '').toLowerCase();
      const name = (empr.fullName || '').toLowerCase();
      const email = (empr.email || '').toLowerCase();
      const phone = (empr.mobile || '').toLowerCase();
      const loc = (empr.location || '').toLowerCase();
      const ind = (empr.industry || '').toLowerCase();
      const typeStr = getEmployerTypeLabel(empr).toLowerCase();

      const matchSearch = !q || comp.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q) || loc.includes(q) || ind.includes(q) || typeStr.includes(q);
      
      const isConsultant = empr?.hiringFor === 'consultant' || empr?.isConsultant;
      const matchType = employerTypeFilter === 'All' || 
        (employerTypeFilter === 'consultant' && isConsultant) || 
        (employerTypeFilter === 'company' && !isConsultant);

      const matchIndustry = employerIndustryFilter === 'All' || (empr.industry && empr.industry.toLowerCase().includes(employerIndustryFilter.toLowerCase()));

      return matchSearch && matchType && matchIndustry;
    });
  }, [employers, employerSearch, employerTypeFilter, employerIndustryFilter]);

  const employerIndustries = useMemo(() => {
    return ['All', ...new Set(employers.map(e => e.industry).filter(Boolean))];
  }, [employers]);

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = employeeSearch.toLowerCase().trim();
      const name = (emp.name || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const mobile = (emp.mobile || '').toLowerCase();
      const desig = (emp.designation || '').toLowerCase();
      const loc = (emp.location || '').toLowerCase();
      const skills = (Array.isArray(emp.skills) ? emp.skills.join(' ') : (emp.skills || '')).toLowerCase();

      const matchSearch = !q || name.includes(q) || email.includes(q) || mobile.includes(q) || desig.includes(q) || loc.includes(q) || skills.includes(q);

      const matchExp = employeeExpFilter === 'All' || emp.totalExperience === employeeExpFilter;

      return matchSearch && matchExp;
    });
  }, [employees, employeeSearch, employeeExpFilter]);

  return (
    <div className="p-6 lg:p-8 w-full h-full overflow-y-auto space-y-8 animate-in fade-in duration-300 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">sahijob.com Portal Overview</h1>
          <p className="text-gray-500 mt-1">Real-time statistics for registered employers, job seekers, and portal activity.</p>
        </div>
        {activeSubTab === 'overview' && (
          <button
            onClick={fetchStats}
            disabled={loadingStats}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${loadingStats ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-2 overflow-x-auto w-fit">
        <button
          onClick={() => handleSubTabChange('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>

        <button
          onClick={() => handleSubTabChange('employees')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'employees'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <Users className="w-4 h-4" />
          Employees ({totals.totalEmployees})
        </button>

        <button
          onClick={() => handleSubTabChange('employers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'employers'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Employers ({totals.totalEmployers})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW STATS TAB                                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {errorStats && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
              <span>{errorStats}</span>
              <button onClick={fetchStats} className="font-semibold underline">Retry</button>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Total Employees */}
            <div 
              onClick={() => handleSubTabChange('employees')}
              className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <span className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Registered Candidates</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-black text-gray-900">
                    {loadingStats ? '...' : totals.totalEmployees.toLocaleString()}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Job Seekers
                  </span>
                </div>
              </div>
            </div>

            {/* Total Employers */}
            <div 
              onClick={() => handleSubTabChange('employers')}
              className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Registered Employers & Recruiters</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-black text-gray-900">
                    {loadingStats ? '...' : totals.totalEmployers.toLocaleString()}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Companies
                  </span>
                </div>
              </div>
            </div>

            {/* Active Jobs */}
            <div 
              onClick={() => onNavigateTab && onNavigateTab('all-jobs')}
              className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Job Listings</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-black text-gray-900">
                    {loadingStats ? '...' : totals.activeJobs.toLocaleString()}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    of {totals.totalJobs} Total
                  </span>
                </div>
              </div>
            </div>

            {/* Total Applications */}
            <div 
              onClick={() => onNavigateTab && onNavigateTab('applications')}
              className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Submitted Applications</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-black text-gray-900">
                    {loadingStats ? '...' : totals.totalApplications.toLocaleString()}
                  </h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Total Processed
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Registration Activity Trends (Last 7 Days) */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-100/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-gray-900">7-Day Registration Activity</h3>
                <p className="text-xs text-gray-400 mt-0.5">New employees vs. employers registrations over the last week</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-gray-600">Candidates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-700"></span>
                  <span className="text-gray-600">Employers</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6 border-b border-gray-100 pb-2">
              {trends.map((day, idx) => {
                const empHeight = Math.round((day.employees / maxTrend) * 100);
                const emprHeight = Math.round((day.employers / maxTrend) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Employee Bar */}
                      <div 
                        style={{ height: `${Math.max(empHeight, 4)}%` }} 
                        className="w-1/2 max-w-[24px] bg-emerald-500 rounded-t-md transition-all duration-300 group-hover:bg-emerald-600 relative"
                        title={`${day.employees} Candidates on ${day.label}`}
                      >
                        {day.employees > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.employees}
                          </span>
                        )}
                      </div>
                      {/* Employer Bar */}
                      <div 
                        style={{ height: `${Math.max(emprHeight, 4)}%` }} 
                        className="w-1/2 max-w-[24px] bg-emerald-700 rounded-t-md transition-all duration-300 group-hover:bg-emerald-800 relative"
                        title={`${day.employers} Employers on ${day.label}`}
                      >
                        {day.employers > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-900 opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.employers}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-gray-900">Job Seekers Database</h4>
                <p className="text-xs text-gray-500 mt-1">Browse and search registered candidates, qualifications, and resumes.</p>
                <button
                  onClick={() => handleSubTabChange('employees')}
                  className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  View All Candidates ({totals.totalEmployees})
                </button>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <GraduationCap className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-gray-900">Employers & Recruiters Directory</h4>
                <p className="text-xs text-gray-500 mt-1">Manage companies, consultants, job postings, and recruiter card controls.</p>
                <button
                  onClick={() => handleSubTabChange('employers')}
                  className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  View All Employers ({totals.totalEmployers})
                </button>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Briefcase className="w-8 h-8" />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EMPLOYEES DIRECTORY TAB                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'employees' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                <Users className="w-7 h-7 text-emerald-600" />
                Registered Candidates & Job Seekers
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                View all registered users looking for jobs, their career profile, contact info, and applied positions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-xl border border-emerald-200">
                {filteredEmployees.length} Candidates
              </span>
              <button
                onClick={fetchEmployees}
                disabled={loadingEmployees}
                className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-600 ${loadingEmployees ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search candidates by name, email, phone, designation, or skills..."
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              {employeeSearch && (
                <button
                  onClick={() => setEmployeeSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={employeeExpFilter}
                onChange={(e) => setEmployeeExpFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="All">All Experience Levels</option>
                <option value="Fresher">Fresher (0 Years)</option>
                <option value="1-2 Years">1-2 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Candidate Name</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Role / Designation</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Applications</th>
                    <th className="px-5 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {loadingEmployees ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-2" />
                        Loading candidate records...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-gray-400">
                        No candidate records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp._id || emp.id} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                              {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-xs">{emp.name || 'Candidate'}</div>
                              <span className="text-[11px] text-gray-400">{emp.totalExperience || 'Fresher'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-800">{emp.email}</div>
                          {emp.mobile && (
                            <div className="text-[11px] text-gray-400">{emp.mobile}</div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-100">
                            {emp.designation || 'Job Seeker'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{emp.location || emp.preferredLocation || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-full text-[11px]">
                            {emp.applicationsCount || 0} applied
                          </span>
                        </td>

                        <td className="px-5 py-4 text-gray-400 text-[11px]">
                          {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EMPLOYERS DIRECTORY & VISIBILITY CONTROLS TAB                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'employers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                <Building2 className="w-7 h-7 text-emerald-600" />
                Registered Employers & Recruiters Directory
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                View all registered companies, staffing agencies, active job posts, and recruiter display visibility controls.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-xl border border-emerald-200">
                {filteredEmployers.length} Companies
              </span>
              <button
                onClick={() => { fetchEmployers(); fetchGlobalSettings(); }}
                disabled={loadingEmployers}
                className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-600 ${loadingEmployers ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sub-Tab Navigation for Employers Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-2 overflow-x-auto w-fit">
            <button
              onClick={() => setEmployerSubTab('list')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                employerSubTab === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              All Employers Directory
            </button>

            <button
              onClick={() => setEmployerSubTab('controls')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                employerSubTab === 'controls'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Display & Visibility Controls
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                globalCardVisible 
                  ? (employerSubTab === 'controls' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800')
                  : (employerSubTab === 'controls' ? 'bg-amber-400 text-gray-900' : 'bg-amber-100 text-amber-800')
              }`}>
                {globalCardVisible ? 'Global: ON' : 'Global: OFF'}
              </span>
            </button>
          </div>

          {/* SUB-VIEW 1: EMPLOYERS DIRECTORY LIST */}
          {employerSubTab === 'list' && (
            <div className="space-y-6">
              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={employerSearch}
                    onChange={(e) => setEmployerSearch(e.target.value)}
                    placeholder="Search by company name, recruiter name, email, phone, or location..."
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  {employerSearch && (
                    <button
                      onClick={() => setEmployerSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <select
                    value={employerTypeFilter}
                    onChange={(e) => setEmployerTypeFilter(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="company">Direct Companies</option>
                    <option value="consultant">Consultants / Agencies</option>
                  </select>

                  <select
                    value={employerIndustryFilter}
                    onChange={(e) => setEmployerIndustryFilter(e.target.value)}
                    className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[180px] truncate"
                  >
                    {employerIndustries.map(ind => (
                      <option key={ind} value={ind}>{ind === 'All' ? 'All Industries' : ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employers Table */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Company / Business</th>
                        <th className="px-5 py-3.5">Recruiter Info</th>
                        <th className="px-5 py-3.5">Industry</th>
                        <th className="px-5 py-3.5">Location</th>
                        <th className="px-5 py-3.5">Recruiter Card</th>
                        <th className="px-5 py-3.5">Active Jobs</th>
                        <th className="px-5 py-3.5">Joined On</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {loadingEmployers ? (
                        <tr>
                          <td colSpan="8" className="py-16 text-center text-gray-400">
                            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-2" />
                            Loading employer records...
                          </td>
                        </tr>
                      ) : filteredEmployers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-16 text-center text-gray-400">
                            No employer records found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployers.map((empr) => {
                          const isConsultant = empr?.hiringFor === 'consultant' || empr?.isConsultant;
                          const isCardVisible = !empr.hidePostedByCard;
                          const isUpdating = updatingControlId === (empr._id || empr.id);

                          return (
                            <tr key={empr._id || empr.id} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                                    {empr.companyName ? empr.companyName.charAt(0).toUpperCase() : 'C'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                      <span>{empr.companyName || empr.fullName || 'N/A'}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                        isConsultant ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {getEmployerTypeLabel(empr)}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-gray-400">{empr.employees || 'Team'}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <div className="font-bold text-gray-900">{empr.fullName || 'Recruiter'}</div>
                                <div className="text-[11px] text-gray-500">{empr.email}</div>
                                {empr.mobile && (
                                  <div className="text-[10px] text-gray-400">{empr.mobile}</div>
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-bold">
                                  {empr.industry || 'General'}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{empr.location || 'N/A'}</span>
                                </div>
                              </td>

                              {/* Recruiter Card Toggle in Table */}
                              <td className="px-5 py-4">
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleToggleEmployerControl(empr._id || empr.id, 'hidePostedByCard', empr.hidePostedByCard)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                    isCardVisible 
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                  title="Click to toggle recruiter card visibility for this employer"
                                >
                                  {isUpdating ? (
                                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                                  ) : isCardVisible ? (
                                    <Eye className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <EyeOff className="w-3 h-3 text-gray-400" />
                                  )}
                                  <span>{isCardVisible ? 'Visible' : 'Hidden'}</span>
                                </button>
                              </td>

                              <td className="px-5 py-4">
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[11px]">
                                  {empr.activeJobs || 0} active
                                </span>
                              </td>

                              <td className="px-5 py-4 text-gray-400 text-[11px]">
                                {empr.createdAt ? new Date(empr.createdAt).toLocaleDateString() : 'N/A'}
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => handleOpenEmployerDrawer(empr)}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: GLOBAL & PER-EMPLOYER VISIBILITY CONTROLS */}
          {employerSubTab === 'controls' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Master Global Switch Card */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 lg:p-8 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-extrabold text-gray-900 text-base">
                        Website-wide "Posted by" Recruiter Card Visibility
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Control whether recruiter identity cards (recruiter name, avatar, designation, company info) are displayed publicly on job posting detail pages across the entire platform.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleGlobalVisibility(globalCardVisible)}
                      disabled={globalLoading}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        globalCardVisible ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          globalCardVisible ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${globalCardVisible ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    <span>Global Master Status: <strong>{globalCardVisible ? 'ENABLED (Recruiter cards visible on job posts)' : 'DISABLED (Recruiter cards hidden globally)'}</strong></span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-normal">
                    Toggling this updates all employers simultaneously
                  </span>
                </div>
              </div>

              {/* Per-Employer Custom Visibility Settings */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 lg:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-600" />
                    Individual Employer Recruiter Card Overrides
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Fine-tune card visibility for specific companies or consultants individually.
                  </p>
                </div>

                {/* Search Bar for Controls Table */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={employerSearch}
                    onChange={(e) => setEmployerSearch(e.target.value)}
                    placeholder="Search employer to adjust visibility..."
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Table with switches */}
                <div className="border border-gray-200/80 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                        <tr>
                          <th className="px-5 py-3.5">Company / Recruiter</th>
                          <th className="px-5 py-3.5">Type & Industry</th>
                          <th className="px-5 py-3.5">Location</th>
                          <th className="px-5 py-3.5 text-center">"Posted By" Card Display</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {loadingEmployers ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-gray-400">
                              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-2" />
                              Loading employers...
                            </td>
                          </tr>
                        ) : filteredEmployers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-gray-400">
                              No employers found.
                            </td>
                          </tr>
                        ) : (
                          filteredEmployers.map((empr) => {
                            const isVisible = !empr.hidePostedByCard;
                            const isUpdating = updatingControlId === (empr._id || empr.id);

                            return (
                              <tr key={empr._id || empr.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="font-bold text-gray-900 text-xs">{empr.companyName || empr.fullName}</div>
                                  <div className="text-[11px] text-gray-500">{empr.email}</div>
                                </td>

                                <td className="px-5 py-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2 ${
                                    empr.hiringFor === 'consultant' || empr.isConsultant ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {getEmployerTypeLabel(empr)}
                                  </span>
                                  <span className="text-gray-500 text-[11px]">{empr.industry || 'General'}</span>
                                </td>

                                <td className="px-5 py-4 text-gray-600">
                                  {empr.location || 'N/A'}
                                </td>

                                <td className="px-5 py-4 text-center">
                                  <div className="flex items-center justify-center gap-3">
                                    <button
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleToggleEmployerControl(empr._id || empr.id, 'hidePostedByCard', empr.hidePostedByCard)}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                        isVisible ? 'bg-emerald-600' : 'bg-gray-300'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          isVisible ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                    <span className={`text-[11px] font-bold ${isVisible ? 'text-emerald-700' : 'text-gray-400'}`}>
                                      {isVisible ? 'Visible' : 'Hidden'}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <button
                                    onClick={() => handleOpenEmployerDrawer(empr)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS & SIDEBAR DRAWERS                                                */}
      {/* ========================================================================= */}
      
      {/* Slide-out Employer Details Sidebar Drawer */}
      {selectedEmployer && (
        <div className="fixed inset-0 z-[200] flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => { setSelectedEmployer(null); setDetailEmployer(null); }}
          />

          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center tracking-wider shrink-0 shadow-xs">
                  {(selectedEmployer.companyName || selectedEmployer.fullName || 'TE').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                    {selectedEmployer.companyName || selectedEmployer.fullName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedEmployer.email}</p>
                </div>
              </div>

              <button
                onClick={() => { setSelectedEmployer(null); setDetailEmployer(null); }}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Info Card Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Contact Name</span>
                  <span className="font-bold text-gray-900 text-xs">{selectedEmployer.fullName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Designation</span>
                  <span className="font-bold text-gray-900 text-xs">{selectedEmployer.designation || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Industry</span>
                  <span className="font-bold text-gray-900 text-xs">{selectedEmployer.industry || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Location</span>
                  <span className="font-bold text-gray-900 text-xs">{selectedEmployer.location || 'N/A'}</span>
                </div>
                {selectedEmployer.mobile && (
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Mobile</span>
                    <span className="font-bold text-gray-900 text-xs">{selectedEmployer.mobile}</span>
                  </div>
                )}
                {selectedEmployer.employees && (
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Company Size</span>
                    <span className="font-bold text-gray-900 text-xs">{selectedEmployer.employees}</span>
                  </div>
                )}
                {selectedEmployer.website && (
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Website</span>
                    <a href={selectedEmployer.website} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                      {selectedEmployer.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Recruiter Card Display Toggle */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-950 text-xs">"Posted by" Recruiter Card Display</p>
                  <p className="text-[11px] text-emerald-700">Toggle recruiter card visibility on job postings for this employer.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleEmployerControl(selectedEmployer._id || selectedEmployer.id, 'hidePostedByCard', selectedEmployer.hidePostedByCard)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    !selectedEmployer.hidePostedByCard ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      !selectedEmployer.hidePostedByCard ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Posted Job Openings Section */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">Posted Job Openings</h4>
                {detailLoading ? (
                  <div className="py-6 text-center text-gray-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Loading jobs...</span>
                  </div>
                ) : !(detailEmployer?.jobs || selectedEmployer?.jobs) || (detailEmployer?.jobs || selectedEmployer?.jobs).length === 0 ? (
                  <div className="p-5 bg-gray-50 rounded-2xl text-center text-gray-400 font-medium border border-gray-100">
                    No jobs posted yet.
                  </div>
                ) : (
                  (detailEmployer?.jobs || selectedEmployer?.jobs).map((job) => (
                    <div key={job._id || job.id} className="p-3.5 bg-white border border-gray-200/80 rounded-2xl flex items-center justify-between shadow-xs">
                      <div>
                        <p className="font-bold text-gray-900 text-xs">{job.jobTitle || job.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {job.location || 'Remote'} • {job.jobType || 'Full-time'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        (job.status || 'Active') === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {job.status || 'Active'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => { setSelectedEmployer(null); setDetailEmployer(null); }}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {selectedEmployee.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{selectedEmployee.name || 'Candidate Profile'}</h3>
                  <span className="text-[11px] text-emerald-700 font-bold uppercase">{selectedEmployee.designation || 'Job Seeker'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Email</span>
                <span className="font-bold text-gray-900">{selectedEmployee.email}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Mobile</span>
                <span className="font-bold text-gray-900">{selectedEmployee.mobile || 'N/A'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Experience</span>
                <span className="font-bold text-gray-900">{selectedEmployee.totalExperience || 'Fresher'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Location</span>
                <span className="font-bold text-gray-900">{selectedEmployee.location || selectedEmployee.preferredLocation || 'N/A'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl col-span-2">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Applications Submitted</span>
                <span className="font-bold text-emerald-700">{selectedEmployee.applicationsCount || 0} job applications</span>
              </div>
            </div>

            {selectedEmployee.skills && (
              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Key Skills</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(Array.isArray(selectedEmployee.skills) ? selectedEmployee.skills : selectedEmployee.skills.split(',')).map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md font-bold text-gray-700 text-[11px]">
                      {sk.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedEmployee.resumeUrl && (
              <div className="pt-2">
                <a
                  href={selectedEmployee.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Candidate Resume</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
