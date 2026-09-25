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
  SlidersHorizontal,
  Shield,
  ShieldCheck,
  BarChart2,
  UserX,
  UserCheck,
  Settings,
  Check,
  LogIn,
  Save,
  Lock,
  Plus,
  Trash2,
  RotateCcw,
  LayoutDashboard,
  GripVertical,
  FolderPlus,
  Award
} from 'lucide-react';

import { DEFAULT_EMPLOYER_INDUSTRIES_DATA, DEFAULT_EMPLOYER_INDUSTRY_OPTIONS, DEFAULT_EMPLOYER_SIZE_OPTIONS, DEFAULT_EMPLOYER_DESIGNATION_OPTIONS } from './EmployersTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_CONSULTANT_REGISTER_CONFIG = {
  modalTitle: 'Create Consultant Account',
  modalSubtitle: 'Register to find qualified talent and post jobs for clients on sahijob.com',
  googleBtnText: 'Sign up with Google',
  dividerText: 'OR CONTINUE WITH EMAIL',
  submitBtnText: 'Continue to Company Details',
  finalSubmitBtnText: 'Complete Registration',
  termsText: 'By registering, you agree to our Terms of Service & Privacy Policy',
  loginLinkText: 'Already registered? Consultant Login',
  accountTypeCompanyLabel: 'Company / Business',
  accountTypeIndividualLabel: 'Individual / Proprietor',
  hiringForLabel: 'Hiring For',
  hiringForConsultantLabel: 'Consultant',
  step1: {
    title: 'Account Information',
    subtitle: 'Enter your basic consultant contact details',
    fields: {
      fullName: { label: 'Full Name', placeholder: 'Enter your full name', isRequired: true },
      email: { label: 'Official Email ID', placeholder: 'name@company.com', isRequired: true },
      mobile: { label: 'Mobile Number', placeholder: 'e.g. 9876543210', isRequired: true },
      password: { label: 'Password', placeholder: 'Enter password', isRequired: true },
      confirmPassword: { label: 'Confirm Password', placeholder: 'Confirm password', isRequired: true }
    }
  },
  step2: {
    title: 'Company Details',
    subtitle: 'Tell us about your organization & client hiring requirements',
    industriesData: DEFAULT_EMPLOYER_INDUSTRIES_DATA,
    industryOptions: DEFAULT_EMPLOYER_INDUSTRY_OPTIONS,
    employeeSizeOptions: DEFAULT_EMPLOYER_SIZE_OPTIONS,
    designationOptions: DEFAULT_EMPLOYER_DESIGNATION_OPTIONS,
    fields: {
      companyName: { label: 'Company / Business Name', placeholder: 'Enter registered company or organization name', isRequired: true },
      industry: { label: 'Industry Domain', placeholder: 'Select Industry', isRequired: true },
      employees: { label: 'Company Size (Employees)', placeholder: 'Select Number of Employees', isRequired: true },
      designation: { label: 'Your Designation / Role', placeholder: 'Select designation', isRequired: true },
      location: { label: 'Headquarters / Primary Location', placeholder: 'Select City / Location', isRequired: true },
      website: { label: 'Company Website', placeholder: 'https://yourcompany.com (optional)', isRequired: false },
      aboutCompany: { label: 'About Company', placeholder: 'Briefly describe what your organization does...', isRequired: false }
    }
  }
};

export const DEFAULT_CONSULTANT_LOGIN_CONFIG = {
  modalTitle: 'Welcome to Consultant Portal',
  modalSubtitle: 'Sign in to access your consultant dashboard and manage job postings',
  googleBtnText: 'Continue with Google',
  dividerText: 'OR WITH EMAIL',
  submitBtnText: 'Sign In',
  otpBtnText: 'Use OTP to Login',
  forgotPasswordText: 'Forgot Password?',
  registerCtaText: "Don't have a consultant account? Register as Consultant",
  fields: {
    email: { label: 'Official Email ID', placeholder: 'name@company.com', isRequired: true },
    password: { label: 'Password', placeholder: 'Enter your password', isRequired: true },
    mobile: { label: 'Mobile Number', placeholder: 'Enter 10-digit mobile number for OTP', isRequired: false }
  }
};

import EmployerPortalEditor, { DEFAULT_EMPLOYER_PORTAL_CONFIG } from './homepage-cms/components/EmployerPortalEditor';

export default function ConsultantsTab() {
  // Navigation State
  const [activeSection, setActiveSectionState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section');
    if (sec && ['auth', 'portal', 'overview'].includes(sec)) return sec;
    const saved = localStorage.getItem('adminConsultantSection');
    if (saved && ['auth', 'portal', 'overview'].includes(saved)) return saved;
    return 'auth';
  });

  const [authSubTab, setAuthSubTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('authSub');
    if (sub && ['login', 'register'].includes(sub)) return sub;
    const saved = localStorage.getItem('adminConsultantAuthSub');
    if (saved && ['login', 'register'].includes(saved)) return saved;
    return 'register';
  });

  const setActiveSection = (sec) => {
    setActiveSectionState(sec);
    localStorage.setItem('adminConsultantSection', sec);
    const params = new URLSearchParams(window.location.search);
    params.set('section', sec);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const setAuthSubTab = (sub) => {
    setAuthSubTabState(sub);
    localStorage.setItem('adminConsultantAuthSub', sub);
    const params = new URLSearchParams(window.location.search);
    params.set('authSub', sub);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  // Directory State
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedConsultant, setSelectedConsultant] = useState(null);

  // CMS Settings States
  const [cmsLoading, setCmsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [registerConfig, setRegisterConfig] = useState(DEFAULT_CONSULTANT_REGISTER_CONFIG);
  const [loginConfig, setLoginConfig] = useState(DEFAULT_CONSULTANT_LOGIN_CONFIG);

  // Live Preview states
  const [previewRegisterStep, setPreviewRegisterStep] = useState(1);
  const [previewAccountType, setPreviewAccountType] = useState('company');

  // Step 1 Field Keys
  const step1FieldKeys = [
    { key: 'fullName', title: 'Full Name' },
    { key: 'email', title: 'Official Email ID' },
    { key: 'mobile', title: 'Mobile Number' },
    { key: 'password', title: 'Password' },
    { key: 'confirmPassword', title: 'Confirm Password' }
  ];

  // Step 2 Field Keys
  const step2FieldKeys = [
    { key: 'companyName', title: 'Company / Business Name' },
    { key: 'industry', title: 'Industry Domain' },
    { key: 'employees', title: 'Company Size (Employees)' },
    { key: 'designation', title: 'Your Designation / Role' },
    { key: 'location', title: 'Headquarters / Primary Location' },
    { key: 'website', title: 'Company Website' },
    { key: 'aboutCompany', title: 'About Company' }
  ];

  // Fetch Consultants Directory
  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/admin/employers`, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const consultantList = data.data.filter(emp => emp.hiringFor === 'consultant');
        setConsultants(consultantList);
      } else {
        const directRes = await fetch(`${API_URL}/api/employer/all`, { headers });
        const directData = await directRes.json();
        if (directData.success && Array.isArray(directData.data)) {
          setConsultants(directData.data.filter(emp => emp.hiringFor === 'consultant'));
        }
      }
    } catch (err) {
      console.error('Error fetching consultants list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch CMS Config from Homepage
  const fetchCmsConfig = async () => {
    setCmsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/homepage`);
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.consultantRegister && Object.keys(data.data.consultantRegister).length > 0) {
          setRegisterConfig({
            ...DEFAULT_CONSULTANT_REGISTER_CONFIG,
            ...data.data.consultantRegister,
            step1: {
              ...DEFAULT_CONSULTANT_REGISTER_CONFIG.step1,
              ...(data.data.consultantRegister.step1 || {}),
              fields: {
                ...DEFAULT_CONSULTANT_REGISTER_CONFIG.step1.fields,
                ...(data.data.consultantRegister.step1?.fields || {})
              }
            },
            step2: {
              ...DEFAULT_CONSULTANT_REGISTER_CONFIG.step2,
              ...(data.data.consultantRegister.step2 || {}),
              fields: {
                ...DEFAULT_CONSULTANT_REGISTER_CONFIG.step2.fields,
                ...(data.data.consultantRegister.step2?.fields || {})
              }
            }
          });
        }
        if (data.data.consultantLogin && Object.keys(data.data.consultantLogin).length > 0) {
          setLoginConfig({
            ...DEFAULT_CONSULTANT_LOGIN_CONFIG,
            ...data.data.consultantLogin,
            fields: {
              ...DEFAULT_CONSULTANT_LOGIN_CONFIG.fields,
              ...(data.data.consultantLogin.fields || {})
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching consultant CMS config:', err);
    } finally {
      setCmsLoading(false);
    }
  };

  useEffect(() => {
    fetchCmsConfig();
    fetchConsultants();
  }, []);

  // Save Settings handler
  const handleSaveSettings = async () => {
    setSaving(true);
    setToastMessage(null);
    setErrorMessage(null);
    try {
      const payload = {
        consultantRegister: registerConfig,
        consultantLogin: loginConfig
      };

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage('Consultant settings saved successfully! Changes are live on the website.');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to save consultant settings');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error saving consultant settings:', err);
      setErrorMessage('Server error while saving settings');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  // Step 1 Field Handlers
  const handleStep1FieldChange = (key, prop, value) => {
    setRegisterConfig(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        fields: {
          ...prev.step1?.fields,
          [key]: {
            ...prev.step1?.fields?.[key],
            [prop]: value
          }
        }
      }
    }));
  };

  const handleToggleStep1Mandatory = (key) => {
    const current = registerConfig.step1?.fields?.[key]?.isRequired !== false;
    handleStep1FieldChange(key, 'isRequired', !current);
  };

  // Step 2 Field Handlers
  const handleStep2FieldChange = (key, prop, value) => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        fields: {
          ...prev.step2?.fields,
          [key]: {
            ...prev.step2?.fields?.[key],
            [prop]: value
          }
        }
      }
    }));
  };

  const handleToggleStep2Mandatory = (key) => {
    const current = registerConfig.step2?.fields?.[key]?.isRequired !== false;
    handleStep2FieldChange(key, 'isRequired', !current);
  };

  // Login Field Handlers
  const handleLoginFieldChange = (key, prop, value) => {
    setLoginConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: {
          ...prev.fields?.[key],
          [prop]: value
        }
      }
    }));
  };

  // Filtered consultants list
  const filteredConsultants = consultants.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || (
      (c.fullName && c.fullName.toLowerCase().includes(q)) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.mobile && c.mobile.includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    );
    const matchIndustry = selectedIndustry === 'All' || c.industry === selectedIndustry;
    const matchLocation = selectedLocation === 'All' || c.location === selectedLocation;
    return matchQuery && matchIndustry && matchLocation;
  });

  const industriesList = ['All', ...new Set(consultants.map(c => c.industry).filter(Boolean))];
  const locationsList = ['All', ...new Set(consultants.map(c => c.location).filter(Boolean))];

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-[#f8fafc]">
      
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
      
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-white border-r border-gray-200/80 p-5 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            Consultants
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Authentication & Directory Controls
          </p>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex flex-col gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveSection('auth')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'auth'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeSection === 'auth' ? 'text-emerald-700' : 'text-gray-400'}`} />
            <span>Authentication</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('portal')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'portal'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeSection === 'portal' ? 'text-emerald-700' : 'text-gray-400'}`} />
            <span>Portal & Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs font-extrabold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeSection === 'overview' ? 'text-emerald-700' : 'text-gray-400'}`} />
            <span>Overview & Directory</span>
          </button>
        </nav>

        {/* Footer Info Box */}
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900 space-y-1 mt-auto">
          <p className="text-xs font-extrabold flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-700" />
            Consultant Portal CMS
          </p>
          <p className="text-[11px] text-emerald-700">
            Control register/login texts, mandatory fields, options, and live candidate visibility.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-6 lg:p-8 space-y-8">
        
        {/* ========================================================================= */}
        {/* 1. AUTHENTICATION SECTION (Register & Login CMS)                          */}
        {/* ========================================================================= */}
        {activeSection === 'auth' && (
          <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
            
            {/* Top Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-xs w-fit">
              <button
                type="button"
                onClick={() => setAuthSubTab('login')}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  authSubTab === 'login'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthSubTab('register')}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  authSubTab === 'register'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Register</span>
              </button>
            </div>

            {/* SubTab 1: REGISTER CMS */}
            {authSubTab === 'register' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {/* Header card with Save button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                      <FileText className="w-7 h-7 text-emerald-600" />
                      Consultant Register Page Controls
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Customize modal headers, text labels, placeholders, dropdown options, and toggle mandatory (<span className="text-red-500 font-bold">*</span>) fields across Step 1 (Account) and Step 2 (Company Details).
                    </p>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving || cmsLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Register Settings</span>
                  </button>
                </div>

                {cmsLoading ? (
                  <div className="py-20 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                    <span>Loading consultant registration controls...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Form Controls (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Section 1: Modal Header & Button Texts */}
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Modal Header & Button Texts
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="sm:col-span-2">
                            <label className="block font-bold text-gray-700 mb-1">Modal Title</label>
                            <input
                              type="text"
                              value={registerConfig.modalTitle || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, modalTitle: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold text-gray-700 mb-1">Modal Subtitle</label>
                            <input
                              type="text"
                              value={registerConfig.modalSubtitle || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, modalSubtitle: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Google Button Text</label>
                            <input
                              type="text"
                              value={registerConfig.googleBtnText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, googleBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Divider Text</label>
                            <input
                              type="text"
                              value={registerConfig.dividerText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, dividerText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Step 1 Submit / Next Button</label>
                            <input
                              type="text"
                              value={registerConfig.submitBtnText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, submitBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Step 2 Complete Button</label>
                            <input
                              type="text"
                              value={registerConfig.finalSubmitBtnText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, finalSubmitBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold text-gray-700 mb-1">Terms Notice Text</label>
                            <input
                              type="text"
                              value={registerConfig.termsText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, termsText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold text-gray-700 mb-1">Login Redirect Link Text</label>
                            <input
                              type="text"
                              value={registerConfig.loginLinkText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, loginLinkText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Step 1 - Account Details Controls */}
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
                        <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <Lock className="w-4 h-4 text-emerald-600" />
                              Step 1: Account Details Fields
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Customize field labels, placeholders, and mandatory toggles for basic registration.</p>
                          </div>
                        </div>

                        {/* Step 1 Fields */}
                        <div className="space-y-4">
                          {step1FieldKeys.map(item => {
                            const fieldData = registerConfig.step1?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                            const isReq = fieldData.isRequired !== false;
                            return (
                              <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                    {item.title}
                                    {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleStep1Mandatory(item.key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                      isReq
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}
                                  >
                                    {isReq ? (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Mandatory (*)
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Optional
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.label || ''}
                                      onChange={(e) => handleStep1FieldChange(item.key, 'label', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.placeholder || ''}
                                      onChange={(e) => handleStep1FieldChange(item.key, 'placeholder', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 3: Step 2 - Company Details Controls */}
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
                        <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-600" />
                              Step 2: Company Details Fields
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Configure organization fields, domain options, and mandatory checks.</p>
                          </div>
                        </div>

                        {/* Step 2 Fields */}
                        <div className="space-y-4">
                          {step2FieldKeys.map(item => {
                            const fieldData = registerConfig.step2?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                            const isReq = fieldData.isRequired !== false;
                            return (
                              <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                    {item.title}
                                    {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleStep2Mandatory(item.key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                      isReq
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}
                                  >
                                    {isReq ? (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Mandatory (*)
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Optional
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.label || ''}
                                      onChange={(e) => handleStep2FieldChange(item.key, 'label', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.placeholder || ''}
                                      onChange={(e) => handleStep2FieldChange(item.key, 'placeholder', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    </div>

                    {/* Right Column: Live Modal Preview (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="sticky top-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Modal Preview</span>
                          
                          {/* Step preview switcher */}
                          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => setPreviewRegisterStep(1)}
                              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                previewRegisterStep === 1 ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600'
                              }`}
                            >
                              Step 1 Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewRegisterStep(2)}
                              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                previewRegisterStep === 2 ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600'
                              }`}
                            >
                              Step 2 Preview
                            </button>
                          </div>
                        </div>

                        {/* Card Preview Container */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-5 text-left">
                          <div>
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Consultant Portal
                            </span>
                            <h4 className="text-lg font-extrabold text-gray-900 mt-2 leading-snug">
                              {registerConfig.modalTitle || 'Create Consultant Account'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {registerConfig.modalSubtitle || 'Register to find qualified talent and post jobs for clients on sahijob.com'}
                            </p>
                          </div>

                          {/* Google Sign Up Preview */}
                          <div className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2 shadow-2xs">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>{registerConfig.googleBtnText || 'Sign up with Google'}</span>
                          </div>

                          <div className="flex items-center gap-3 my-1">
                            <div className="h-px bg-gray-100 flex-1"></div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                              {registerConfig.dividerText || 'OR CONTINUE WITH EMAIL'}
                            </span>
                            <div className="h-px bg-gray-100 flex-1"></div>
                          </div>

                          {/* Account Type Pills */}
                          <div className="space-y-1">
                            <label className="block font-bold text-gray-700 text-[11px]">Account Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewAccountType('company')}
                                className={`py-2 px-3 rounded-xl font-bold text-center border transition-all text-xs truncate ${
                                  previewAccountType === 'company'
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                    : 'border-gray-200 bg-white text-gray-600'
                                }`}
                              >
                                {registerConfig.accountTypeCompanyLabel || 'Company / Business'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewAccountType('individual')}
                                className={`py-2 px-3 rounded-xl font-bold text-center border transition-all text-xs truncate ${
                                  previewAccountType === 'individual'
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                    : 'border-gray-200 bg-white text-gray-600'
                                }`}
                              >
                                {registerConfig.accountTypeIndividualLabel || 'Individual / Proprietor'}
                              </button>
                            </div>
                          </div>

                          {previewRegisterStep === 1 && (
                            <div className="space-y-3 animate-in fade-in duration-150">
                              {/* Step 1 Fields */}
                              {step1FieldKeys.map(item => {
                                const fData = registerConfig.step1?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                                return (
                                  <div key={item.key} className="space-y-1">
                                    <label className="block font-bold text-gray-800 text-xs">
                                      {fData.label}
                                      {fData.isRequired !== false && (
                                        <span className="text-red-500 font-bold ml-1">*</span>
                                      )}
                                    </label>
                                    <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs truncate">
                                      {fData.placeholder || 'Enter value...'}
                                    </div>
                                  </div>
                                );
                              })}

                              <div className="pt-2 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewRegisterStep(2)}
                                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                  {registerConfig.submitBtnText || 'Continue to Company Details'} →
                                </button>
                                {registerConfig.termsText && (
                                  <p className="text-[10px] text-gray-400 text-center leading-tight">
                                    {registerConfig.termsText}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {previewRegisterStep === 2 && (
                            <div className="space-y-4 text-xs animate-in fade-in duration-150">
                              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-emerald-900 text-xs">Step 2: Company Details</p>
                                  <p className="text-[11px] text-emerald-700">Tell us about your organization</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPreviewRegisterStep(1)}
                                  className="text-[11px] text-emerald-700 underline font-bold"
                                >
                                  ← Back
                                </button>
                              </div>

                              {/* Step 2 Fields */}
                              {step2FieldKeys.slice(0, 5).map(item => {
                                const fData = registerConfig.step2?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                                return (
                                  <div key={item.key} className="space-y-1">
                                    <label className="block font-bold text-gray-800 text-xs">
                                      {fData.label}
                                      {fData.isRequired !== false && (
                                        <span className="text-red-500 font-bold ml-1">*</span>
                                      )}
                                    </label>
                                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs truncate">
                                      {fData.placeholder || 'Enter value...'}
                                    </div>
                                  </div>
                                );
                              })}

                              <div className="pt-2">
                                <div className="w-full py-3 bg-emerald-600 text-white font-bold text-xs text-center rounded-xl shadow-md">
                                  {registerConfig.finalSubmitBtnText || 'Complete Registration'} ✓
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* SubTab 2: LOGIN CMS */}
            {authSubTab === 'login' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                
                {/* Header card with Save button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                      <LogIn className="w-7 h-7 text-emerald-600" />
                      Consultant Login Page Controls
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Customize modal titles, button texts, social logins, OTP controls, and field labels for consultant sign-in.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving || cmsLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Login Settings</span>
                  </button>
                </div>

                {cmsLoading ? (
                  <div className="py-20 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                    <span>Loading consultant login controls...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Form Controls (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Modal Text & Button Labels
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="sm:col-span-2">
                            <label className="block font-bold text-gray-700 mb-1">Modal Title</label>
                            <input
                              type="text"
                              value={loginConfig.modalTitle || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, modalTitle: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold text-gray-700 mb-1">Modal Subtitle</label>
                            <input
                              type="text"
                              value={loginConfig.modalSubtitle || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, modalSubtitle: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Google Button Text</label>
                            <input
                              type="text"
                              value={loginConfig.googleBtnText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, googleBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Divider Text</label>
                            <input
                              type="text"
                              value={loginConfig.dividerText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, dividerText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Sign In Button Text</label>
                            <input
                              type="text"
                              value={loginConfig.submitBtnText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, submitBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">OTP Login Button Text</label>
                            <input
                              type="text"
                              value={loginConfig.otpBtnText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, otpBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Forgot Password Link Text</label>
                            <input
                              type="text"
                              value={loginConfig.forgotPasswordText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, forgotPasswordText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Register CTA Text</label>
                            <input
                              type="text"
                              value={loginConfig.registerCtaText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, registerCtaText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Login Fields */}
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-600" />
                          Login Input Fields
                        </h3>

                        <div className="space-y-4 text-xs">
                          {Object.entries(loginConfig.fields || {}).map(([key, field]) => (
                            <div key={key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                              <span className="font-extrabold text-gray-800 capitalize flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                {key} Field
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                  <input
                                    type="text"
                                    value={field.label || ''}
                                    onChange={(e) => handleLoginFieldChange(key, 'label', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                  <input
                                    type="text"
                                    value={field.placeholder || ''}
                                    onChange={(e) => handleLoginFieldChange(key, 'placeholder', e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Live Login Preview (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="sticky top-6 space-y-4">
                        <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Login Preview</span>

                        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-5 text-left">
                          <div>
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Consultant Portal
                            </span>
                            <h4 className="text-lg font-extrabold text-gray-900 mt-2 leading-snug">
                              {loginConfig.modalTitle || 'Welcome to Consultant Portal'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {loginConfig.modalSubtitle || 'Sign in to access your consultant dashboard and manage job postings'}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2 shadow-2xs">
                              <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span>{loginConfig.googleBtnText || 'Continue with Google'}</span>
                            </div>

                            <div className="flex items-center gap-3 my-1">
                              <div className="h-px bg-gray-100 flex-1"></div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                {loginConfig.dividerText || 'OR WITH EMAIL'}
                              </span>
                              <div className="h-px bg-gray-100 flex-1"></div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block font-bold text-gray-800 text-xs mb-1">
                                  {loginConfig.fields?.email?.label || 'Official Email ID'} <span className="text-red-500">*</span>
                                </label>
                                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs">
                                  {loginConfig.fields?.email?.placeholder || 'name@company.com'}
                                </div>
                              </div>

                              <div>
                                <label className="block font-bold text-gray-800 text-xs mb-1">
                                  {loginConfig.fields?.password?.label || 'Password'} <span className="text-red-500">*</span>
                                </label>
                                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs">
                                  {loginConfig.fields?.password?.placeholder || '••••••••'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer">
                                {loginConfig.forgotPasswordText || 'Forgot Password?'}
                              </span>
                            </div>

                            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center rounded-xl shadow-md transition-all">
                              {loginConfig.submitBtnText || 'Sign In'}
                            </button>

                            <button className="w-full py-2.5 bg-white border border-gray-200 text-emerald-700 font-bold text-xs text-center rounded-xl hover:bg-gray-50 transition-all">
                              {loginConfig.otpBtnText || 'Use OTP to Login'}
                            </button>

                            <p className="text-[11px] text-center text-gray-500 pt-1">
                              {loginConfig.registerCtaText || "Don't have a consultant account? Register as Consultant"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. PORTAL & DASHBOARD CMS SECTION                                         */}
        {/* ========================================================================= */}
        {activeSection === 'portal' && (
          <EmployerPortalEditor onSaveSuccess={() => {
            fetchCmsConfig();
            setToastMessage('Portal & Dashboard settings saved and live!');
            setTimeout(() => setToastMessage(null), 3000);
          }} />
        )}

        {/* ========================================================================= */}
        {/* 3. OVERVIEW & DIRECTORY SECTION                                           */}
        {/* ========================================================================= */}
        {activeSection === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                  <Briefcase className="w-7 h-7 text-emerald-600" />
                  Registered Consultants Directory
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  View and manage all recruitment agencies, consultant accounts, and their hiring specializations.
                </p>
              </div>

              <button
                onClick={fetchConsultants}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh List</span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search agency name, lead recruiter, email, phone, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                >
                  {industriesList.map(ind => (
                    <option key={ind} value={ind}>Specialization: {ind}</option>
                  ))}
                </select>

                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
                >
                  {locationsList.map(loc => (
                    <option key={loc} value={loc}>Location: {loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                  <span>Loading registered consultants...</span>
                </div>
              ) : filteredConsultants.length === 0 ? (
                <div className="py-16 text-center text-gray-400 space-y-2">
                  <Briefcase className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-sm font-bold text-gray-600">No consultants found</p>
                  <p className="text-xs text-gray-400">Try adjusting your search criteria or register a new consultant.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Agency / Consultant</th>
                        <th className="px-5 py-3.5">Recruiter Info</th>
                        <th className="px-5 py-3.5">Specialization</th>
                        <th className="px-5 py-3.5">Location</th>
                        <th className="px-5 py-3.5">Account Type</th>
                        <th className="px-5 py-3.5">Registered On</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {filteredConsultants.map((c) => (
                        <tr key={c._id || c.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                                {c.companyName ? c.companyName.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                  <span>{c.companyName || 'Consultant Firm'}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase">
                                    Consultant
                                  </span>
                                </div>
                                <span className="text-[11px] text-gray-400">{c.employees || 'Team'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-0.5">
                              <div className="font-bold text-gray-900">{c.fullName || 'Recruiter'}</div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                {c.email}
                              </div>
                              {c.mobile && (
                                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {c.mobile}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-bold">
                              {c.industry || 'General'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span>{c.location || 'N/A'}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="capitalize text-xs font-semibold text-gray-600">
                              {c.accountType || 'Company'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-gray-400 text-[11px]">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => setSelectedConsultant(c)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Details Modal */}
      {selectedConsultant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {selectedConsultant.companyName?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{selectedConsultant.companyName || 'Consultant Profile'}</h3>
                  <span className="text-[11px] text-emerald-700 font-bold uppercase">Consultant Account</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedConsultant(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Lead Recruiter</span>
                <span className="font-bold text-gray-900">{selectedConsultant.fullName}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Designation</span>
                <span className="font-bold text-gray-900">{selectedConsultant.designation || 'N/A'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Email</span>
                <span className="font-bold text-gray-900">{selectedConsultant.email}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Mobile</span>
                <span className="font-bold text-gray-900">{selectedConsultant.mobile || 'N/A'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Specialization</span>
                <span className="font-bold text-gray-900">{selectedConsultant.industry || 'N/A'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Headquarters</span>
                <span className="font-bold text-gray-900">{selectedConsultant.location || 'N/A'}</span>
              </div>
              {selectedConsultant.website && (
                <div className="col-span-2 p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">Website</span>
                  <a href={selectedConsultant.website} target="_blank" rel="noreferrer" className="font-bold text-emerald-600 hover:underline flex items-center gap-1">
                    {selectedConsultant.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {selectedConsultant.aboutCompany && (
                <div className="col-span-2 p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-400 font-bold block text-[10px] uppercase">About Agency</span>
                  <p className="text-gray-700 mt-1">{selectedConsultant.aboutCompany}</p>
                </div>
              )}
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedConsultant(null)}
                className="px-5 py-2 bg-gray-200 text-gray-800 font-bold text-xs rounded-xl hover:bg-gray-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
