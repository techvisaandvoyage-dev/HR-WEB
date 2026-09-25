import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  MessageSquare,
  Building2,
  Settings,
  LogOut,
  Save,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Search,
  Plus,
  Briefcase,
  Layers,
  Sparkles,
  FileText
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_EMPLOYER_PORTAL_CONFIG = {
  sidebar: {
    dashboardLabel: 'Dashboard',
    applicationsLabel: 'Applications',
    candidatesLabel: 'Candidates',
    messagesLabel: 'Messages',
    accountLabel: 'Account',
    settingsLabel: 'Settings',
    signOutLabel: 'Sign Out'
  },
  dashboard: {
    welcomePrefix: 'Welcome back,',
    subtitle: "Here's what's happening with your job posting today.",
    postJobBtnText: '+ Post New Job',
    searchPlaceholder: 'Search job by title, location...',
    stats: {
      activeJobsLabel: 'Active Job',
      totalApplicationsLabel: 'Total Applications',
      totalCandidatesLabel: 'Total Candidates',
      shortlistedLabel: 'Shortlisted'
    }
  },
  applications: {
    title: 'Applications',
    subtitle: 'Browse and manage all applications.',
    searchPlaceholder: 'Search applications by name or email...',
    jobFilterLabel: 'Job',
    statusFilterLabel: 'Status'
  },
  candidates: {
    title: 'Candidates',
    subtitle: 'Browse and discover qualified candidates & talent on the platform.',
    searchPlaceholder: 'Search by name or email...',
    functionFilterLabel: 'Function',
    locationFilterLabel: 'Location',
    experienceFilterLabel: 'Experience',
    lastUpdateFilterLabel: 'Last Update'
  },
  messages: {
    candidatesColumnTitle: 'Candidates',
    candidatesSearchPlaceholder: 'Search candidates...',
    noCandidatesFoundText: 'No candidates found.',
    selectCandidateTitle: 'Select a Candidate',
    selectCandidateSubtitle: 'Choose a candidate from the list to view their job applications & chats.',
    emptyChatTitle: 'Employer Messages',
    emptyChatSubtitle: 'Select an application to view its conversation.'
  },
  account: {
    title: 'Company Profile',
    subtitle: 'Manage your company information, branding, and details.',
    consultantTitle: 'Consultant Profile',
    consultantSubtitle: 'Manage your consultant profile, staffing details and branding.'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage your account preferences and notification settings.'
  }
};

export default function EmployerPortalEditor({ onSaveSuccess }) {
  const [activeTab, setActiveTab] = useState('sidebar'); // 'sidebar', 'dashboard', 'applications', 'candidates', 'messages', 'other'
  const [previewTab, setPreviewTab] = useState('dashboard'); // 'dashboard', 'applications', 'candidates', 'messages'
  const [portalConfig, setPortalConfig] = useState(DEFAULT_EMPLOYER_PORTAL_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employerPortal) {
          const fetched = data.data.employerPortal;
          setPortalConfig({
            sidebar: {
              ...DEFAULT_EMPLOYER_PORTAL_CONFIG.sidebar,
              ...(fetched.sidebar || {})
            },
            dashboard: {
              ...DEFAULT_EMPLOYER_PORTAL_CONFIG.dashboard,
              ...(fetched.dashboard || {}),
              stats: {
                ...DEFAULT_EMPLOYER_PORTAL_CONFIG.dashboard.stats,
                ...(fetched.dashboard?.stats || {})
              }
            },
            applications: {
              ...DEFAULT_EMPLOYER_PORTAL_CONFIG.applications,
              ...(fetched.applications || {})
            },
            candidates: {
              ...DEFAULT_EMPLOYER_PORTAL_CONFIG.candidates,
              ...(fetched.candidates || {})
            },
            messages: {
              ...DEFAULT_EMPLOYER_PORTAL_CONFIG.messages,
              ...(fetched.messages || {})
            },
            account: {
              ...DEFAULT_EMPLOYER_PORTAL_CONFIG.account,
              ...(fetched.account || {})
            },
            settings: {
              ...DEFAULT_EMPLOYER_PORTAL_CONFIG.settings,
              ...(fetched.settings || {})
            }
          });
        }
      } catch (err) {
        console.error('Error fetching Employer Portal CMS config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (customConfig) => {
    const toSave = customConfig || portalConfig;
    try {
      setSaving(true);
      setToastMessage(null);
      setErrorMessage(null);

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerPortal: toSave })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Employer Portal & Dashboard CMS saved successfully!');
        if (onSaveSuccess) onSaveSuccess(toSave);
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving Employer Portal config:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSection = (sectionKey) => {
    setPortalConfig(prev => ({
      ...prev,
      [sectionKey]: DEFAULT_EMPLOYER_PORTAL_CONFIG[sectionKey]
    }));
    showToast(`Reset ${sectionKey} settings to default.`);
  };

  const tabsList = [
    { id: 'sidebar', label: 'Sidebar Navigation', icon: Layers },
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications Page', icon: Users },
    { id: 'candidates', label: 'Candidates Page', icon: UserCheck },
    { id: 'messages', label: 'Messages Page', icon: MessageSquare },
    { id: 'other', label: 'Profile & Settings', icon: Building2 }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-3" />
        <p className="text-xs font-bold text-gray-500">Loading Employer Portal CMS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-[100] bg-emerald-700 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 right-8 z-[100] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80 inline-block mb-1.5">
            Employer Portal Customizer
          </span>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-5 h-5 text-emerald-600" />
            Portal & Dashboard CMS Editor
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Customize sidebar menu titles, dashboard welcome greetings, stat labels, application headers, and filter placeholders.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setPortalConfig(DEFAULT_EMPLOYER_PORTAL_CONFIG);
              showToast('All Employer Portal settings reset to defaults.');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="Reset all portal settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save & Publish</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {tabsList.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'sidebar' || tab.id === 'dashboard') setPreviewTab('dashboard');
                else if (tab.id === 'applications') setPreviewTab('applications');
                else if (tab.id === 'candidates') setPreviewTab('candidates');
                else if (tab.id === 'messages') setPreviewTab('messages');
                else if (tab.id === 'other') setPreviewTab('dashboard');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Controls (7 cols) + Right Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. SIDEBAR CONTROLS */}
          {activeTab === 'sidebar' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Sidebar Navigation Menu Labels
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize the text displayed for each sidebar menu item in the Employer Portal.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetSection('sidebar')}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5 text-gray-400" />
                    Dashboard Menu Label
                  </label>
                  <input
                    type="text"
                    value={portalConfig.sidebar?.dashboardLabel || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, sidebar: { ...prev.sidebar, dashboardLabel: e.target.value } }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Dashboard"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    Applications Menu Label
                  </label>
                  <input
                    type="text"
                    value={portalConfig.sidebar?.applicationsLabel || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, sidebar: { ...prev.sidebar, applicationsLabel: e.target.value } }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Applications"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                    Candidates Menu Label
                  </label>
                  <input
                    type="text"
                    value={portalConfig.sidebar?.candidatesLabel || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, sidebar: { ...prev.sidebar, candidatesLabel: e.target.value } }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Candidates"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    Messages Menu Label
                  </label>
                  <input
                    type="text"
                    value={portalConfig.sidebar?.messagesLabel || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, sidebar: { ...prev.sidebar, messagesLabel: e.target.value } }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Messages"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    Account / Profile Menu Label
                  </label>
                  <input
                    type="text"
                    value={portalConfig.sidebar?.accountLabel || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, sidebar: { ...prev.sidebar, accountLabel: e.target.value } }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Account"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-gray-400" />
                    Settings Menu Label
                  </label>
                  <input
                    type="text"
                    value={portalConfig.sidebar?.settingsLabel || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, sidebar: { ...prev.sidebar, settingsLabel: e.target.value } }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Settings"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-red-700 mb-1 flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Sign Out Button Label
                  </label>
                  <input
                    type="text"
                    value={portalConfig.sidebar?.signOutLabel || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, sidebar: { ...prev.sidebar, signOutLabel: e.target.value } }))}
                    className="w-full px-3 py-2 bg-red-50/40 border border-red-200 rounded-xl font-semibold text-red-900 text-xs focus:outline-none focus:bg-white focus:border-red-500"
                    placeholder="Sign Out"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. DASHBOARD OVERVIEW CONTROLS */}
          {activeTab === 'dashboard' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                    Dashboard Overview Page Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize greeting headers, subtitle text, stats card titles, and button labels.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetSection('dashboard')}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Greeting & Header Box */}
              <div className="p-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl space-y-3">
                <span className="text-xs font-extrabold text-gray-900 block">Top Header & Greeting</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Welcome Prefix</label>
                    <input
                      type="text"
                      value={portalConfig.dashboard?.welcomePrefix || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, dashboard: { ...prev.dashboard, welcomePrefix: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Welcome back,"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Rendered before employer's name e.g. "Welcome back, Sonic 16t! 👋"</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Post New Job Button Text</label>
                    <input
                      type="text"
                      value={portalConfig.dashboard?.postJobBtnText || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, dashboard: { ...prev.dashboard, postJobBtnText: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="+ Post New Job"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Dashboard Subtitle</label>
                    <input
                      type="text"
                      value={portalConfig.dashboard?.subtitle || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, dashboard: { ...prev.dashboard, subtitle: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Here's what's happening with your job posting today."
                    />
                  </div>
                </div>
              </div>

              {/* Stats Cards Box */}
              <div className="p-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl space-y-3">
                <span className="text-xs font-extrabold text-gray-900 block">4 Top Statistics Cards Labels</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Stat Card 1 (Active Jobs)</label>
                    <input
                      type="text"
                      value={portalConfig.dashboard?.stats?.activeJobsLabel || ''}
                      onChange={(e) => setPortalConfig(prev => ({
                        ...prev,
                        dashboard: { ...prev.dashboard, stats: { ...prev.dashboard?.stats, activeJobsLabel: e.target.value } }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Active Job"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Stat Card 2 (Total Applications)</label>
                    <input
                      type="text"
                      value={portalConfig.dashboard?.stats?.totalApplicationsLabel || ''}
                      onChange={(e) => setPortalConfig(prev => ({
                        ...prev,
                        dashboard: { ...prev.dashboard, stats: { ...prev.dashboard?.stats, totalApplicationsLabel: e.target.value } }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Total Applications"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Stat Card 3 (Total Candidates)</label>
                    <input
                      type="text"
                      value={portalConfig.dashboard?.stats?.totalCandidatesLabel || ''}
                      onChange={(e) => setPortalConfig(prev => ({
                        ...prev,
                        dashboard: { ...prev.dashboard, stats: { ...prev.dashboard?.stats, totalCandidatesLabel: e.target.value } }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Total Candidates"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Stat Card 4 (Shortlisted)</label>
                    <input
                      type="text"
                      value={portalConfig.dashboard?.stats?.shortlistedLabel || ''}
                      onChange={(e) => setPortalConfig(prev => ({
                        ...prev,
                        dashboard: { ...prev.dashboard, stats: { ...prev.dashboard?.stats, shortlistedLabel: e.target.value } }
                      }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Shortlisted"
                    />
                  </div>
                </div>
              </div>

              {/* Jobs Search Placeholder */}
              <div className="p-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl space-y-3">
                <span className="text-xs font-extrabold text-gray-900 block">Jobs Section & Search Filter</span>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Job Search Box Placeholder</label>
                  <input
                    type="text"
                    value={portalConfig.dashboard?.searchPlaceholder || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, dashboard: { ...prev.dashboard, searchPlaceholder: e.target.value } }))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="Search job by title, location..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. APPLICATIONS PAGE CONTROLS */}
          {activeTab === 'applications' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Applications Page Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize the page title, description, and search bar placeholder.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetSection('applications')}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Page Header Title</label>
                  <input
                    type="text"
                    value={portalConfig.applications?.title || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, applications: { ...prev.applications, title: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Applications"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Page Header Subtitle / Description</label>
                  <input
                    type="text"
                    value={portalConfig.applications?.subtitle || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, applications: { ...prev.applications, subtitle: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Browse and manage all applications."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Search Bar Placeholder</label>
                  <input
                    type="text"
                    value={portalConfig.applications?.searchPlaceholder || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, applications: { ...prev.applications, searchPlaceholder: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Search applications by name or email..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. CANDIDATES PAGE CONTROLS */}
          {activeTab === 'candidates' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    Candidates Directory Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize candidate search page headings and search placeholder.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetSection('candidates')}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Page Header Title</label>
                  <input
                    type="text"
                    value={portalConfig.candidates?.title || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, candidates: { ...prev.candidates, title: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Candidates"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Page Header Subtitle / Description</label>
                  <input
                    type="text"
                    value={portalConfig.candidates?.subtitle || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, candidates: { ...prev.candidates, subtitle: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Browse and discover qualified candidates & talent on the platform."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Search Placeholder Text</label>
                  <input
                    type="text"
                    value={portalConfig.candidates?.searchPlaceholder || ''}
                    onChange={(e) => setPortalConfig(prev => ({ ...prev, candidates: { ...prev.candidates, searchPlaceholder: e.target.value } }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:bg-white focus:border-emerald-500"
                    placeholder="Search by name or email..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. MESSAGES PAGE CONTROLS */}
          {activeTab === 'messages' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Messages Page Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize candidate column title in Messages screen.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetSection('messages')}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Candidates List Column */}
              <div className="p-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl space-y-3">
                <span className="text-xs font-extrabold text-gray-900 block">Candidate Column Heading</span>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Column Header Title</label>
                    <input
                      type="text"
                      value={portalConfig.messages?.candidatesColumnTitle || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, messages: { ...prev.messages, candidatesColumnTitle: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-bold text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Candidates"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. OTHER PAGES CONTROLS (Company Profile, Consultant Profile & Settings) */}
          {activeTab === 'other' && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Company & Consultant Profile & Settings Headings
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize headings and descriptions for Employer Profile, Consultant Profile and Settings.</p>
                </div>
              </div>

              {/* Employer / Company Profile Section */}
              <div className="p-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl space-y-3 text-xs">
                <span className="font-bold text-gray-900 block flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Company Profile (Standard Employer)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Page Title</label>
                    <input
                      type="text"
                      value={portalConfig.account?.title || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, account: { ...prev.account, title: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Company Profile"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Page Subtitle</label>
                    <input
                      type="text"
                      value={portalConfig.account?.subtitle || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, account: { ...prev.account, subtitle: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Manage your company information, branding, and details."
                    />
                  </div>
                </div>
              </div>

              {/* Consultant Profile Section */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200/70 rounded-2xl space-y-3 text-xs">
                <span className="font-bold text-indigo-900 block flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Consultant Profile
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Consultant Page Title</label>
                    <input
                      type="text"
                      value={portalConfig.account?.consultantTitle || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, account: { ...prev.account, consultantTitle: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-medium text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Consultant Profile"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Consultant Page Subtitle</label>
                    <input
                      type="text"
                      value={portalConfig.account?.consultantSubtitle || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, account: { ...prev.account, consultantSubtitle: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-medium text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Manage your consultant profile, staffing details and branding."
                    />
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="p-4 bg-gray-50/80 border border-gray-200/70 rounded-2xl space-y-3 text-xs">
                <span className="font-bold text-gray-900 block">Settings Page</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={portalConfig.settings?.title || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, settings: { ...prev.settings, title: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Settings"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={portalConfig.settings?.subtitle || ''}
                      onChange={(e) => setPortalConfig(prev => ({ ...prev, settings: { ...prev.settings, subtitle: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-emerald-500"
                      placeholder="Manage your account preferences and notification settings."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Interactive Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Live Portal Preview
              </span>
              
              {/* Preview Tab Switcher */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[10px] font-bold flex-wrap">
                {['dashboard', 'applications', 'candidates', 'messages', 'profile'].map(pKey => (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setPreviewTab(pKey)}
                    className={`px-2 py-1 rounded-md capitalize transition-all cursor-pointer ${
                      previewTab === pKey ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500'
                    }`}
                  >
                    {pKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Portal Device Mockup Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden flex flex-row min-h-[460px] text-left">
              
              {/* Left Mini Sidebar */}
              <div className="w-36 bg-white border-r border-gray-100 p-3 flex flex-col justify-between shrink-0">
                <div className="space-y-3">
                  <div className="px-1 py-1">
                    <span className="text-sm font-black text-gray-900 tracking-tight">
                      sahijob<span className="text-[#29953f]">.com</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                      previewTab === 'dashboard' ? 'bg-[#29953f] text-white shadow-2xs' : 'text-gray-600'
                    }`} onClick={() => setPreviewTab('dashboard')}>
                      <LayoutDashboard className="w-3 h-3 shrink-0" />
                      <span className="truncate">{portalConfig.sidebar?.dashboardLabel || 'Dashboard'}</span>
                    </div>

                    <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                      previewTab === 'applications' ? 'bg-[#29953f] text-white shadow-2xs' : 'text-gray-600'
                    }`} onClick={() => setPreviewTab('applications')}>
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">{portalConfig.sidebar?.applicationsLabel || 'Applications'}</span>
                    </div>

                    <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                      previewTab === 'candidates' ? 'bg-[#29953f] text-white shadow-2xs' : 'text-gray-600'
                    }`} onClick={() => setPreviewTab('candidates')}>
                      <UserCheck className="w-3 h-3 shrink-0" />
                      <span className="truncate">{portalConfig.sidebar?.candidatesLabel || 'Candidates'}</span>
                    </div>

                    <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ${
                      previewTab === 'messages' ? 'bg-[#29953f] text-white shadow-2xs' : 'text-gray-600'
                    }`} onClick={() => setPreviewTab('messages')}>
                      <MessageSquare className="w-3 h-3 shrink-0" />
                      <span className="truncate">{portalConfig.sidebar?.messagesLabel || 'Messages'}</span>
                    </div>

                    <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer ${
                      previewTab === 'profile' ? 'bg-[#29953f] text-white shadow-2xs' : 'text-gray-500'
                    }`} onClick={() => setPreviewTab('profile')}>
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{portalConfig.sidebar?.accountLabel || 'Account'}</span>
                    </div>

                    <div className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                      <Settings className="w-3 h-3 shrink-0" />
                      <span className="truncate">{portalConfig.sidebar?.settingsLabel || 'Settings'}</span>
                    </div>
                  </div>
                </div>

                {/* Sidebar Bottom */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px] flex items-center justify-center shrink-0">
                      S
                    </div>
                    <span className="text-[10px] font-bold text-gray-800 truncate">Sonic 16t</span>
                  </div>
                  <div className="text-[10px] font-bold text-red-500 flex items-center gap-1 px-1">
                    <LogOut className="w-2.5 h-2.5" />
                    <span>{portalConfig.sidebar?.signOutLabel || 'Sign Out'}</span>
                  </div>
                </div>
              </div>

              {/* Right Mini Content Area */}
              <div className="flex-1 bg-gray-50/50 p-3 overflow-y-auto space-y-3">
                
                {/* 1. Dashboard View */}
                {previewTab === 'dashboard' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-gray-900">
                            {portalConfig.dashboard?.welcomePrefix || 'Welcome back,'} Sonic 16t! 👋
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                            {portalConfig.dashboard?.subtitle || "Here's what's happening with your job posting today."}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-600 text-white rounded-full text-[8px] font-bold shrink-0">
                          {portalConfig.dashboard?.postJobBtnText || '+ Post New Job'}
                        </span>
                      </div>
                    </div>

                    {/* Stats 4 Cards Mini */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-2 bg-white rounded-xl border border-gray-200/70 shadow-2xs">
                        <span className="text-[8px] font-semibold text-gray-400 block truncate">
                          {portalConfig.dashboard?.stats?.activeJobsLabel || 'Active Job'}
                        </span>
                        <span className="text-xs font-black text-gray-900">1</span>
                      </div>

                      <div className="p-2 bg-white rounded-xl border border-gray-200/70 shadow-2xs">
                        <span className="text-[8px] font-semibold text-gray-400 block truncate">
                          {portalConfig.dashboard?.stats?.totalApplicationsLabel || 'Total Applications'}
                        </span>
                        <span className="text-xs font-black text-gray-900">0</span>
                      </div>

                      <div className="p-2 bg-white rounded-xl border border-gray-200/70 shadow-2xs">
                        <span className="text-[8px] font-semibold text-gray-400 block truncate">
                          {portalConfig.dashboard?.stats?.totalCandidatesLabel || 'Total Candidates'}
                        </span>
                        <span className="text-xs font-black text-gray-900">0</span>
                      </div>

                      <div className="p-2 bg-white rounded-xl border border-gray-200/70 shadow-2xs">
                        <span className="text-[8px] font-semibold text-gray-400 block truncate">
                          {portalConfig.dashboard?.stats?.shortlistedLabel || 'Shortlisted'}
                        </span>
                        <span className="text-xs font-black text-gray-900">0</span>
                      </div>
                    </div>

                    {/* Job search mini bar */}
                    <div className="p-2 bg-white rounded-xl border border-gray-200/70 flex items-center gap-1.5 text-[9px] text-gray-400">
                      <Search className="w-2.5 h-2.5" />
                      <span className="truncate">{portalConfig.dashboard?.searchPlaceholder || 'Search job by title, location...'}</span>
                    </div>

                    {/* Sample Job Card */}
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-2xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-900">Frontend Developer</span>
                        <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Active</span>
                      </div>
                      <p className="text-[9px] text-gray-400">Full-time • Hybrid • ₹ 12-18 LPA</p>
                    </div>
                  </div>
                )}

                {/* 2. Applications View */}
                {previewTab === 'applications' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div>
                      <h4 className="text-xs font-black text-gray-900">{portalConfig.applications?.title || 'Applications'}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                        {portalConfig.applications?.subtitle || 'Browse and manage all applications.'}
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-gray-200/70 flex items-center gap-1.5 text-[9px] text-gray-400">
                      <Search className="w-2.5 h-2.5" />
                      <span className="truncate">{portalConfig.applications?.searchPlaceholder || 'Search applications by name...'}</span>
                    </div>

                    <div className="flex gap-1">
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-700">
                        Job: All
                      </span>
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-700">
                        Status: All
                      </span>
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 text-[10px]">
                      No applications to display yet.
                    </div>
                  </div>
                )}

                {/* 3. Candidates View */}
                {previewTab === 'candidates' && (
                  <div className="space-y-3 animate-in fade-in">
                    <div>
                      <h4 className="text-xs font-black text-gray-900">{portalConfig.candidates?.title || 'Candidates'}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                        {portalConfig.candidates?.subtitle || 'Browse and discover qualified candidates.'}
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-gray-200/70 flex items-center gap-1.5 text-[9px] text-gray-400">
                      <Search className="w-2.5 h-2.5" />
                      <span className="truncate">{portalConfig.candidates?.searchPlaceholder || 'Search by name or email...'}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-700">
                        Function
                      </span>
                      <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-700">
                        Location
                      </span>
                      <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-700">
                        Exp
                      </span>
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-gray-200 text-center text-gray-400 text-[10px]">
                      Discovery candidate feed.
                    </div>
                  </div>
                )}

                {/* 4. Messages View */}
                {previewTab === 'messages' && (
                  <div className="h-full flex gap-1.5 animate-in fade-in text-left min-h-[380px]">
                    <div className="w-full bg-white rounded-xl border border-gray-200/80 p-3 flex flex-col">
                      <span className="text-[11px] font-black text-gray-900 block mb-2">
                        {portalConfig.messages?.candidatesColumnTitle || 'Candidates'}
                      </span>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-[9px] text-gray-400 mb-2">
                        Search candidates...
                      </div>
                      <div className="p-4 text-center text-gray-400 text-[9px] mt-4">
                        Candidates chat list preview.
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Profile View */}
                {previewTab === 'profile' && (
                  <div className="space-y-3 animate-in fade-in">
                    {/* Employer Profile Preview */}
                    <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#147a2e] uppercase">
                          {portalConfig.account?.title || 'Company Profile'}
                        </span>
                        <span className="text-[8px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold">Employer</span>
                      </div>
                      <p className="text-[9px] text-gray-500">
                        {portalConfig.account?.subtitle || 'Manage your company information and branding.'}
                      </p>
                    </div>

                    {/* Consultant Profile Preview */}
                    <div className="p-3 bg-white rounded-2xl border border-indigo-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-indigo-800 uppercase">
                          {portalConfig.account?.consultantTitle || 'Consultant Profile'}
                        </span>
                        <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Consultant</span>
                      </div>
                      <p className="text-[9px] text-gray-500">
                        {portalConfig.account?.consultantSubtitle || 'Manage your consultant profile, staffing details and branding.'}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
