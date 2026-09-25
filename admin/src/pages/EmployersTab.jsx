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
  Link2
} from 'lucide-react';

import EmployerPostJobEditor, { DEFAULT_EMPLOYER_POST_JOB_CONFIG } from './homepage-cms/components/EmployerPostJobEditor';
import EmployerPortalEditor, { DEFAULT_EMPLOYER_PORTAL_CONFIG } from './homepage-cms/components/EmployerPortalEditor';
import DirectJobApplyEditor from './homepage-cms/components/DirectJobApplyEditor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_EMPLOYER_INDUSTRIES_DATA = {
  'Information Technology': [
    'CTO (Chief Technology Officer)',
    'VP of Engineering',
    'Engineering Manager',
    'Technical Lead',
    'Software Development Manager',
    'IT Manager',
    'Product Manager',
    'Scrum Master / Agile Coach',
    'HR Manager – Tech',
    'Talent Acquisition Lead – Tech',
    'Technical Recruiter',
    'Hiring Manager',
    'Founder / CEO',
    'Co-Founder',
    'Director – Engineering',
    'Director – Product',
    'Head of Technology',
    'Other'
  ],
  'Finance & Banking': [
    'CFO (Chief Financial Officer)',
    'Finance Manager',
    'Head of Finance',
    'Finance Director',
    'Accounts Manager',
    'VP – Finance',
    'Financial Controller',
    'Treasury Manager',
    'Audit Manager',
    'Tax Manager',
    'HR Manager – Finance',
    'Talent Acquisition – Finance',
    'Founder / CEO',
    'Managing Director',
    'Other'
  ],
  'Healthcare & Pharma': [
    'Medical Director',
    'Hospital Administrator',
    'Chief Medical Officer',
    'Head of Clinical Operations',
    'HR Manager – Healthcare',
    'Talent Acquisition – Healthcare',
    'Pharmacy Manager',
    'Operations Manager – Hospital',
    'Director – Medical Affairs',
    'VP – Clinical Research',
    'Founder / CEO',
    'Managing Director',
    'Other'
  ],
  'Manufacturing': [
    'Plant Manager',
    'Production Manager',
    'Operations Manager',
    'Manufacturing Director',
    'VP – Operations',
    'Quality Assurance Manager',
    'Supply Chain Manager',
    'Procurement Head',
    'Maintenance Manager',
    'EHS Manager',
    'HR Manager – Manufacturing',
    'Talent Acquisition – Manufacturing',
    'Founder / CEO',
    'General Manager',
    'Other'
  ],
  'Education & EdTech': [
    'Principal / Director',
    'Head of Academics',
    'Academic Coordinator',
    'Training Manager',
    'L&D Head',
    'HR Manager – Education',
    'Talent Acquisition – Education',
    'Operations Manager',
    'Founder / CEO',
    'Other'
  ],
  'E-commerce & Retail': [
    'Head of Retail',
    'Retail Operations Manager',
    'Store Manager',
    'VP – Retail',
    'Category Manager',
    'E-Commerce Manager',
    'Supply Chain Manager',
    'HR Manager – Retail',
    'Talent Acquisition – Retail',
    'Founder / CEO',
    'Managing Director',
    'Other'
  ],
  'Marketing & Media': [
    'CMO (Chief Marketing Officer)',
    'Marketing Director',
    'VP – Marketing',
    'Head of Marketing',
    'Brand Manager',
    'Digital Marketing Manager',
    'Performance Marketing Manager',
    'Content Marketing Manager',
    'Growth Manager',
    'PR Manager',
    'HR Manager – Marketing',
    'Founder / CEO',
    'Other'
  ],
  'Consulting & Professional Services': [
    'Managing Partner',
    'Partner',
    'Principal Consultant',
    'Senior Consultant',
    'Director – Consulting',
    'Practice Head',
    'Engagement Manager',
    'Business Development Manager',
    'HR Manager',
    'Talent Acquisition',
    'Founder / CEO',
    'Other'
  ],
  'Real Estate & Construction': [
    'Project Manager',
    'Site Manager',
    'Construction Director',
    'Civil Engineering Manager',
    'VP – Projects',
    'Real Estate Manager',
    'Business Development Manager',
    'HR Manager – Construction',
    'Founder / CEO',
    'Managing Director',
    'Other'
  ],
  'Automobile & EV': [
    'Plant Head',
    'Operations Manager',
    'R&D Manager',
    'Design Lead',
    'Quality Lead',
    'Supply Chain Head',
    'HR Manager – Automotive',
    'Founder / CEO',
    'Other'
  ],
  'Logistics & Supply Chain': [
    'Head of Logistics',
    'Supply Chain Director',
    'VP – Supply Chain',
    'Logistics Manager',
    'Fleet Manager',
    'Warehouse Manager',
    'Procurement Manager',
    'Operations Manager',
    'HR Manager – Logistics',
    'Founder / CEO',
    'Other'
  ],
  'Hospitality & Tourism': [
    'General Manager',
    'Hotel Manager',
    'Operations Manager',
    'F&B Manager',
    'Front Office Manager',
    'Revenue Manager',
    'HR Manager – Hospitality',
    'Founder / CEO',
    'Other'
  ],
  'Legal & Compliance': [
    'General Counsel',
    'Chief Legal Officer',
    'Legal Manager',
    'Compliance Manager',
    'VP – Legal',
    'Head of Legal',
    'HR Manager – Legal',
    'Founder / CEO',
    'Other'
  ],
  'Other': [
    'Founder / CEO',
    'Co-Founder',
    'Managing Director',
    'Director',
    'General Manager',
    'Operations Manager',
    'HR Manager',
    'Talent Acquisition',
    'Hiring Manager',
    'Business Development Manager',
    'Other'
  ]
};

export const DEFAULT_EMPLOYER_INDUSTRY_OPTIONS = Object.keys(DEFAULT_EMPLOYER_INDUSTRIES_DATA);

export const DEFAULT_EMPLOYER_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees'
];

export const DEFAULT_EMPLOYER_DESIGNATION_OPTIONS = [
  'HR Manager',
  'Talent Acquisition Lead',
  'Recruiter',
  'Founder / CEO',
  'Director / VP',
  'Hiring Manager',
  'Operations Head',
  'Other'
];

export const DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS = [
  { id: 'your_company', value: 'your_company', label: 'Your Company' },
  { id: 'consultant', value: 'consultant', label: 'Consultant' }
];

export const DEFAULT_EMPLOYER_REGISTER_CONFIG = {
  modalTitle: 'Create Employer Account',
  modalSubtitle: 'Hire top talent faster with verified candidate profiles & smart hiring tools.',
  googleBtnText: 'Sign up with Google',
  dividerText: 'Or continue with email',
  submitBtnText: 'Continue to Company Details',
  finalSubmitBtnText: 'Complete Registration',
  termsText: 'By registering, you agree to our Terms of Service & Privacy Policy',
  loginLinkText: 'Already registered? Login here',
  accountTypeCompanyLabel: 'Company / Business',
  accountTypeIndividualLabel: 'Individual / Proprietor',
  hiringForLabel: 'Hiring For',
  hiringForCompanyLabel: 'Your Company',
  hiringForConsultantLabel: 'Consultant',
  hiringForOptions: DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS,
  step1: {
    title: 'Account Information',
    subtitle: 'Enter your basic recruiter credentials',
    fields: {
      fullName: { label: 'Full Name / Contact Person', placeholder: 'e.g. John Doe', isRequired: true },
      email: { label: 'Official Email ID', placeholder: 'name@company.com', isRequired: true },
      mobile: { label: 'Mobile Number', placeholder: 'e.g. 9876543210', isRequired: true },
      password: { label: 'Create Password', placeholder: 'Enter strong password', isRequired: true },
      confirmPassword: { label: 'Confirm Password', placeholder: 'Re-enter password', isRequired: true }
    }
  },
  step2: {
    title: 'Company Details',
    subtitle: 'Tell us about your organization & hiring requirements',
    industriesData: DEFAULT_EMPLOYER_INDUSTRIES_DATA,
    industryOptions: DEFAULT_EMPLOYER_INDUSTRY_OPTIONS,
    employeeSizeOptions: DEFAULT_EMPLOYER_SIZE_OPTIONS,
    designationOptions: DEFAULT_EMPLOYER_DESIGNATION_OPTIONS,
    fields: {
      companyName: { label: 'Company / Business Name', placeholder: 'Enter registered company or organization name', isRequired: true },
      industry: { label: 'Industry', placeholder: 'Select company industry', isRequired: true },
      employees: { label: 'Company Size', placeholder: 'Select number of employees', isRequired: true },
      designation: { label: 'Your Designation', placeholder: 'Select your role (e.g. HR Manager)', isRequired: true },
      location: { label: 'Company Location', placeholder: 'Enter primary city / head office location', isRequired: true },
      website: { label: 'Company Website', placeholder: 'https://yourcompany.com (optional)', isRequired: false },
      aboutCompany: { label: 'About Company', placeholder: 'Brief overview of your company, mission and culture...', isRequired: false }
    }
  }
};

export const DEFAULT_EMPLOYER_LOGIN_CONFIG = {
  modalTitle: 'Welcome to Employer Portal',
  modalSubtitle: 'Sign in to manage job posts, review candidates, and hire top talent.',
  googleBtnText: 'Continue with Google',
  dividerText: 'Or with email',
  submitBtnText: 'Sign In',
  otpBtnText: 'Use OTP to Login',
  forgotPasswordText: 'Forgot Password?',
  registerCtaText: "Don't have an employer account? Register now",
  fields: {
    email: { label: 'Official Email ID', placeholder: 'name@company.com', isRequired: true },
    password: { label: 'Password', placeholder: 'Enter your password', isRequired: true },
    mobile: { label: 'Mobile Number', placeholder: 'Enter 10-digit mobile number for OTP', isRequired: false }
  }
};

export default function EmployersTab() {
  // Navigation State
  const [activeSection, setActiveSectionState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section');
    if (sec && ['auth', 'post-job', 'portal'].includes(sec)) return sec;
    const saved = localStorage.getItem('adminEmployerSection');
    if (saved && ['auth', 'post-job', 'portal'].includes(saved)) return saved;
    return 'auth';
  });

  const setActiveSection = (newSec) => {
    setActiveSectionState(newSec);
    localStorage.setItem('adminEmployerSection', newSec);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'employers');
    params.set('section', newSec);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const [authSubTab, setAuthSubTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('authSub');
    if (sub && ['register', 'login'].includes(sub)) return sub;
    const saved = localStorage.getItem('adminEmployerAuthSub');
    if (saved && ['register', 'login'].includes(saved)) return saved;
    return 'login';
  });

  const setAuthSubTab = (newSub) => {
    setAuthSubTabState(newSub);
    localStorage.setItem('adminEmployerAuthSub', newSub);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'employers');
    params.set('section', 'auth');
    params.set('authSub', newSub);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  // Register Form Config State
  const [registerConfig, setRegisterConfig] = useState(DEFAULT_EMPLOYER_REGISTER_CONFIG);
  const [loginConfig, setLoginConfig] = useState(DEFAULT_EMPLOYER_LOGIN_CONFIG);

  // Preview Switcher for Register
  const [previewRegisterStep, setPreviewRegisterStep] = useState(1);
  const [previewAccountType, setPreviewAccountType] = useState('company');
  const [previewHiringFor, setPreviewHiringFor] = useState('your_company');

  // Option modal / addition states
  const [newIndustryInput, setNewIndustryInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newDesignationInput, setNewDesignationInput] = useState('');

  // Industries & Roles Modal State
  const [isIndustriesModalOpen, setIsIndustriesModalOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('Information Technology');
  const [newIndustryName, setNewIndustryName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [draggedIndustryIndex, setDraggedIndustryIndex] = useState(null);
  const [dragOverIndustryIndex, setDragOverIndustryIndex] = useState(null);

  // Hiring For Modal State
  const [isHiringForModalOpen, setIsHiringForModalOpen] = useState(false);
  const [modalHiringForLabel, setModalHiringForLabel] = useState('Hiring For');
  const [hiringForModalList, setHiringForModalList] = useState([]);
  const [newHiringForLabel, setNewHiringForLabel] = useState('');
  const [hiringForModalError, setHiringForModalError] = useState('');

  // Company Sizes Modal State
  const [isCompanySizesModalOpen, setIsCompanySizesModalOpen] = useState(false);
  const [companySizesModalList, setCompanySizesModalList] = useState([]);
  const [newCompanySizeInput, setNewCompanySizeInput] = useState('');
  const [companySizeModalError, setCompanySizeModalError] = useState('');

  // Status & Loading states
  const [cmsLoading, setCmsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Overview / Directory state
  const [activeMainTab, setActiveMainTabState] = useState('list'); // 'list' or 'controls'
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [jobsFilter, setJobsFilter] = useState('All');
  const [contactFilter, setContactFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [hiringForFilter, setHiringForFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Popover & Drawer
  const [openColumnFilter, setOpenColumnFilter] = useState(null);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailEmployer, setDetailEmployer] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [togglingJobId, setTogglingJobId] = useState(null);
  const [updatingControlId, setUpdatingControlId] = useState(null);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [expandedEmployers, setExpandedEmployers] = useState({});
  const [loadingJobsMap, setLoadingJobsMap] = useState({});

  // Global display setting
  const [globalCardVisible, setGlobalCardVisible] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Fetch Homepage CMS Config (Employer Register & Login)
  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        setCmsLoading(true);
        const res = await fetch(`${API_URL}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.employerRegister) {
            setRegisterConfig({
              ...DEFAULT_EMPLOYER_REGISTER_CONFIG,
              ...data.data.employerRegister,
              hiringForLabel: data.data.employerRegister.hiringForLabel || DEFAULT_EMPLOYER_REGISTER_CONFIG.hiringForLabel || 'Hiring For',
              hiringForOptions: (data.data.employerRegister.hiringForOptions && data.data.employerRegister.hiringForOptions.length > 0)
                ? data.data.employerRegister.hiringForOptions
                : DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS,
              step1: {
                ...DEFAULT_EMPLOYER_REGISTER_CONFIG.step1,
                ...(data.data.employerRegister.step1 || {}),
                fields: {
                  ...DEFAULT_EMPLOYER_REGISTER_CONFIG.step1.fields,
                  ...(data.data.employerRegister.step1?.fields || {})
                }
              },
              step2: {
                ...DEFAULT_EMPLOYER_REGISTER_CONFIG.step2,
                ...(data.data.employerRegister.step2 || {}),
                industriesData: data.data.employerRegister.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA,
                industryOptions: data.data.employerRegister.step2?.industryOptions || DEFAULT_EMPLOYER_INDUSTRY_OPTIONS,
                employeeSizeOptions: data.data.employerRegister.step2?.employeeSizeOptions || DEFAULT_EMPLOYER_SIZE_OPTIONS,
                designationOptions: data.data.employerRegister.step2?.designationOptions || DEFAULT_EMPLOYER_DESIGNATION_OPTIONS,
                fields: {
                  ...DEFAULT_EMPLOYER_REGISTER_CONFIG.step2.fields,
                  ...(data.data.employerRegister.step2?.fields || {})
                }
              }
            });
          }
          if (data.data.employerLogin) {
            setLoginConfig({
              ...DEFAULT_EMPLOYER_LOGIN_CONFIG,
              ...data.data.employerLogin,
              fields: {
                ...DEFAULT_EMPLOYER_LOGIN_CONFIG.fields,
                ...(data.data.employerLogin.fields || {})
              }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching employer CMS config:', err);
      } finally {
        setCmsLoading(false);
      }
    };

    fetchCmsConfig();
  }, []);

  // Fetch Employers Directory & Global Settings
  const fetchEmployers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/admin/employers`);
      const data = await res.json();
      if (data.success) {
        setEmployers(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch employers');
      }
    } catch (err) {
      console.error('Error fetching employers:', err);
      setError('Unable to connect to the server');
    } finally {
      setLoading(false);
    }
  };

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
    fetchEmployers();
    fetchGlobalSettings();
  }, []);

  // URL PopState Listener
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sec = params.get('section');
      if (sec && ['auth', 'post-job'].includes(sec)) {
        setActiveSectionState(sec);
      }
      const sub = params.get('authSub');
      if (sub && ['register', 'login'].includes(sub)) {
        setAuthSubTabState(sub);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Click outside filter popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openColumnFilter && !e.target.closest('.column-filter-popover') && !e.target.closest('.column-filter-trigger')) {
        setOpenColumnFilter(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openColumnFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Save Employer CMS Config
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setToastMessage('');
      setErrorMessage('');

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerRegister: registerConfig,
          employerLogin: loginConfig
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Employer authentication & controls settings saved successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving employer config:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  // Helper Handlers for Register Step 1 Fields
  const handleStep1FieldChange = (key, prop, value) => {
    setRegisterConfig(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        fields: {
          ...prev.step1.fields,
          [key]: {
            ...prev.step1.fields[key],
            [prop]: value
          }
        }
      }
    }));
  };

  const handleToggleStep1Mandatory = (key) => {
    setRegisterConfig(prev => {
      const current = prev.step1?.fields?.[key]?.isRequired !== false;
      return {
        ...prev,
        step1: {
          ...prev.step1,
          fields: {
            ...prev.step1.fields,
            [key]: {
              ...prev.step1.fields[key],
              isRequired: !current
            }
          }
        }
      };
    });
  };

  // Helper Handlers for Register Step 2 Fields
  const handleStep2FieldChange = (key, prop, value) => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        fields: {
          ...prev.step2.fields,
          [key]: {
            ...prev.step2.fields[key],
            [prop]: value
          }
        }
      }
    }));
  };

  const handleToggleStep2Mandatory = (key) => {
    setRegisterConfig(prev => {
      const current = prev.step2?.fields?.[key]?.isRequired !== false;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          fields: {
            ...prev.step2.fields,
            [key]: {
              ...prev.step2.fields[key],
              isRequired: !current
            }
          }
        }
      };
    });
  };

  // Industries & Designation Roles Modal Handlers
  const handleAddIndustryModal = () => {
    const trimmed = newIndustryName.trim();
    if (!trimmed) return;
    const currentData = registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA;
    if (currentData[trimmed]) {
      setSelectedIndustry(trimmed);
      setNewIndustryName('');
      return;
    }
    const updated = { ...currentData, [trimmed]: [] };
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        industriesData: updated,
        industryOptions: Object.keys(updated)
      }
    }));
    setSelectedIndustry(trimmed);
    setNewIndustryName('');
  };

  const handleDeleteIndustryModal = (indName) => {
    const currentData = { ...(registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA) };
    delete currentData[indName];
    const remainingKeys = Object.keys(currentData);
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        industriesData: currentData,
        industryOptions: remainingKeys
      }
    }));
    if (selectedIndustry === indName) {
      setSelectedIndustry(remainingKeys[0] || '');
    }
  };

  const handleAddRoleModal = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed || !selectedIndustry) return;
    const currentData = { ...(registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA) };
    const currentRoles = currentData[selectedIndustry] || [];
    if (currentRoles.includes(trimmed)) {
      setNewRoleName('');
      return;
    }
    currentData[selectedIndustry] = [...currentRoles, trimmed];
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        industriesData: currentData
      }
    }));
    setNewRoleName('');
  };

  const handleDeleteRoleModal = (indName, roleIdx) => {
    const currentData = { ...(registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA) };
    const currentRoles = currentData[indName] || [];
    currentData[indName] = currentRoles.filter((_, i) => i !== roleIdx);
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        industriesData: currentData
      }
    }));
  };

  const handleResetIndustriesModal = () => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        industriesData: DEFAULT_EMPLOYER_INDUSTRIES_DATA,
        industryOptions: Object.keys(DEFAULT_EMPLOYER_INDUSTRIES_DATA)
      }
    }));
    setSelectedIndustry(Object.keys(DEFAULT_EMPLOYER_INDUSTRIES_DATA)[0]);
  };

  const handleIndustryDragStart = (e, index) => {
    setDraggedIndustryIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleIndustryDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndustryIndex !== index) {
      setDragOverIndustryIndex(index);
    }
  };

  const handleIndustryDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndustryIndex === null || draggedIndustryIndex === dropIndex) {
      setDraggedIndustryIndex(null);
      setDragOverIndustryIndex(null);
      return;
    }
    const currentData = registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA;
    const keys = Object.keys(currentData);
    const draggedKey = keys[draggedIndustryIndex];
    keys.splice(draggedIndustryIndex, 1);
    keys.splice(dropIndex, 0, draggedKey);

    const reorderedData = {};
    keys.forEach(k => {
      reorderedData[k] = currentData[k];
    });

    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        industriesData: reorderedData,
        industryOptions: keys
      }
    }));
    setDraggedIndustryIndex(null);
    setDragOverIndustryIndex(null);
  };

  const handleIndustryDragEnd = () => {
    setDraggedIndustryIndex(null);
    setDragOverIndustryIndex(null);
  };

  // Hiring For Modal Handlers
  const handleOpenHiringForModal = () => {
    const current = registerConfig.hiringForOptions && registerConfig.hiringForOptions.length > 0
      ? registerConfig.hiringForOptions
      : DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS;
    setModalHiringForLabel(registerConfig.hiringForLabel || 'Hiring For');
    setHiringForModalList(JSON.parse(JSON.stringify(current)));
    setNewHiringForLabel('');
    setHiringForModalError('');
    setIsHiringForModalOpen(true);
  };

  const handleAddHiringForOption = () => {
    const trimmed = newHiringForLabel.trim();
    if (!trimmed) {
      setHiringForModalError('Please enter an option label');
      return;
    }
    if (hiringForModalList.some(opt => opt.label.trim().toLowerCase() === trimmed.toLowerCase())) {
      setHiringForModalError('An option with this label already exists');
      return;
    }
    const slugVal = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `opt_${Date.now()}`;
    const newOpt = {
      id: `hf_${Date.now()}`,
      value: slugVal,
      label: trimmed
    };
    setHiringForModalList(prev => [...prev, newOpt]);
    setNewHiringForLabel('');
    setHiringForModalError('');
  };

  const handleDeleteHiringForOption = (indexToDelete) => {
    if (hiringForModalList.length <= 1) {
      setHiringForModalError('At least one hiring option is required');
      return;
    }
    setHiringForModalList(prev => prev.filter((_, idx) => idx !== indexToDelete));
    setHiringForModalError('');
  };

  const handleEditHiringForLabel = (index, newLabel) => {
    setHiringForModalList(prev => prev.map((opt, idx) => idx === index ? { ...opt, label: newLabel } : opt));
  };

  const handleResetHiringForOptions = () => {
    setModalHiringForLabel('Hiring For');
    setHiringForModalList(JSON.parse(JSON.stringify(DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS)));
    setHiringForModalError('');
  };

  const handleSaveHiringForModal = async () => {
    if (hiringForModalList.length === 0) {
      setHiringForModalError('Please have at least one option.');
      return;
    }
    const updatedConfig = {
      ...registerConfig,
      hiringForLabel: modalHiringForLabel.trim() || 'Hiring For',
      hiringForOptions: hiringForModalList
    };
    setRegisterConfig(updatedConfig);
    setIsHiringForModalOpen(false);

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerRegister: updatedConfig,
          employerLogin: loginConfig
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Hiring For settings saved & published successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving hiring for options:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  // Company Sizes Modal Handlers
  const handleOpenCompanySizesModal = () => {
    const current = registerConfig.step2?.employeeSizeOptions && registerConfig.step2.employeeSizeOptions.length > 0
      ? registerConfig.step2.employeeSizeOptions
      : DEFAULT_EMPLOYER_SIZE_OPTIONS;
    setCompanySizesModalList(JSON.parse(JSON.stringify(current)));
    setNewCompanySizeInput('');
    setCompanySizeModalError('');
    setIsCompanySizesModalOpen(true);
  };

  const handleAddCompanySizeModal = () => {
    const trimmed = newCompanySizeInput.trim();
    if (!trimmed) {
      setCompanySizeModalError('Please enter a company size range');
      return;
    }
    if (companySizesModalList.some(item => item.trim().toLowerCase() === trimmed.toLowerCase())) {
      setCompanySizeModalError('An option with this size range already exists');
      return;
    }
    setCompanySizesModalList(prev => [...prev, trimmed]);
    setNewCompanySizeInput('');
    setCompanySizeModalError('');
  };

  const handleDeleteCompanySizeModal = (indexToDelete) => {
    if (companySizesModalList.length <= 1) {
      setCompanySizeModalError('At least one company size option is required');
      return;
    }
    setCompanySizesModalList(prev => prev.filter((_, idx) => idx !== indexToDelete));
    setCompanySizeModalError('');
  };

  const handleEditCompanySizeModal = (index, newText) => {
    setCompanySizesModalList(prev => prev.map((item, idx) => idx === index ? newText : item));
  };

  const handleResetCompanySizesModal = () => {
    setCompanySizesModalList(JSON.parse(JSON.stringify(DEFAULT_EMPLOYER_SIZE_OPTIONS)));
    setCompanySizeModalError('');
  };

  const handleSaveCompanySizesModal = async () => {
    const filteredList = companySizesModalList.filter(item => item && item.trim());
    if (filteredList.length === 0) {
      setCompanySizeModalError('Please have at least one option.');
      return;
    }
    const updatedConfig = {
      ...registerConfig,
      step2: {
        ...registerConfig.step2,
        employeeSizeOptions: filteredList
      }
    };
    setRegisterConfig(updatedConfig);
    setIsCompanySizesModalOpen(false);

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerRegister: updatedConfig,
          employerLogin: loginConfig
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Company size options saved & published successfully!');
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving company size options:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  // Option lists handlers
  const handleAddIndustry = () => {
    const val = newIndustryInput.trim();
    if (!val) return;
    setRegisterConfig(prev => {
      const current = prev.step2?.industryOptions || DEFAULT_EMPLOYER_INDUSTRY_OPTIONS;
      if (current.some(item => item.toLowerCase() === val.toLowerCase())) return prev;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          industryOptions: [...current, val]
        }
      };
    });
    setNewIndustryInput('');
  };

  const handleDeleteIndustry = (idx) => {
    setRegisterConfig(prev => {
      const current = prev.step2?.industryOptions || DEFAULT_EMPLOYER_INDUSTRY_OPTIONS;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          industryOptions: current.filter((_, i) => i !== idx)
        }
      };
    });
  };

  const handleResetIndustries = () => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        industryOptions: DEFAULT_EMPLOYER_INDUSTRY_OPTIONS
      }
    }));
  };

  const handleAddCompanySize = () => {
    const val = newSizeInput.trim();
    if (!val) return;
    setRegisterConfig(prev => {
      const current = prev.step2?.employeeSizeOptions || DEFAULT_EMPLOYER_SIZE_OPTIONS;
      if (current.some(item => item.toLowerCase() === val.toLowerCase())) return prev;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          employeeSizeOptions: [...current, val]
        }
      };
    });
    setNewSizeInput('');
  };

  const handleDeleteCompanySize = (idx) => {
    setRegisterConfig(prev => {
      const current = prev.step2?.employeeSizeOptions || DEFAULT_EMPLOYER_SIZE_OPTIONS;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          employeeSizeOptions: current.filter((_, i) => i !== idx)
        }
      };
    });
  };

  const handleResetCompanySizes = () => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        employeeSizeOptions: DEFAULT_EMPLOYER_SIZE_OPTIONS
      }
    }));
  };

  const handleAddDesignation = () => {
    const val = newDesignationInput.trim();
    if (!val) return;
    setRegisterConfig(prev => {
      const current = prev.step2?.designationOptions || DEFAULT_EMPLOYER_DESIGNATION_OPTIONS;
      if (current.some(item => item.toLowerCase() === val.toLowerCase())) return prev;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          designationOptions: [...current, val]
        }
      };
    });
    setNewDesignationInput('');
  };

  const handleDeleteDesignation = (idx) => {
    setRegisterConfig(prev => {
      const current = prev.step2?.designationOptions || DEFAULT_EMPLOYER_DESIGNATION_OPTIONS;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          designationOptions: current.filter((_, i) => i !== idx)
        }
      };
    });
  };

  const handleResetDesignations = () => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        designationOptions: DEFAULT_EMPLOYER_DESIGNATION_OPTIONS
      }
    }));
  };

  // Login Field change handler
  const handleLoginFieldChange = (key, prop, value) => {
    setLoginConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: {
          ...prev.fields[key],
          [prop]: value
        }
      }
    }));
  };

  // Sidebar Sections
  const sidebarSections = [
    { id: 'auth', label: 'Authentication', icon: ShieldCheck },
    { id: 'post-job', label: 'Post a Job', icon: Briefcase },
    { id: 'portal', label: 'Portal & Dashboard', icon: LayoutDashboard },
    { id: 'direct-apply', label: 'Direct Job Apply', icon: Link2 }
  ];

  // Step 1 Field Keys definition
  const step1FieldKeys = [
    { key: 'fullName', title: 'Full Name / Contact Person' },
    { key: 'email', title: 'Official Email ID' },
    { key: 'mobile', title: 'Mobile Number' },
    { key: 'password', title: 'Create Password' },
    { key: 'confirmPassword', title: 'Confirm Password' }
  ];

  // Step 2 Field Keys definition
  const step2FieldKeys = [
    { key: 'companyName', title: 'Company / Business Name' },
    { key: 'industry', title: 'Industry (Dropdown)' },
    { key: 'employees', title: 'Company Size (Dropdown)' },
    { key: 'designation', title: 'Your Designation (Dropdown)' },
    { key: 'location', title: 'Company Location' },
    { key: 'website', title: 'Company Website' },
    { key: 'aboutCompany', title: 'About Company' }
  ];

  const loginFieldKeys = [
    { key: 'email', title: 'Official Email ID' },
    { key: 'password', title: 'Password' },
    { key: 'mobile', title: 'Mobile Number (for OTP)' }
  ];

  // Directory Helpers
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
          (e._id === empId || e.id === empId) ? { ...e, jobs: data.data.jobs } : e
        ));
      }
    } catch (err) {
      console.error('Error fetching jobs for employer:', err);
    } finally {
      setLoadingJobsMap(prev => ({ ...prev, [empId]: false }));
    }
  };

  const handleOpenDrawer = async (employer) => {
    setSelectedEmployer(employer);
    setDrawerTab('overview');
    setDetailLoading(true);
    try {
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

  const handleToggleJobStatus = async (jobId, currentStatus, employerId) => {
    const newStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
    try {
      setTogglingJobId(jobId);
      const res = await fetch(`${API_URL}/api/admin/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
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

  // Employer Type Label helper
  const getEmployerTypeLabel = (empr) => {
    if (empr?.hiringFor === 'consultant' || empr?.isConsultant) return 'Consultant';
    if (empr?.accountType === 'individual') return 'Individual / Proprietor';
    return 'Company';
  };

  const isIndividualHiring = (empr) => {
    return empr?.accountType === 'individual';
  };

  const filteredAndSortedEmployers = React.useMemo(() => {
    return employers.filter(empr => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const comp = (empr.companyName || '').toLowerCase();
        const name = (empr.fullName || '').toLowerCase();
        const email = (empr.email || '').toLowerCase();
        const phone = (empr.mobile || '').toLowerCase();
        const loc = (empr.location || '').toLowerCase();
        const ind = (empr.industry || '').toLowerCase();
        const desig = (empr.designation || '').toLowerCase();
        const hiringType = getEmployerTypeLabel(empr).toLowerCase();
        if (!comp.includes(q) && !name.includes(q) && !email.includes(q) && !phone.includes(q) && !loc.includes(q) && !ind.includes(q) && !desig.includes(q) && !hiringType.includes(q)) {
          return false;
        }
      }

      if (hiringForFilter !== 'All') {
        const isConsultant = empr?.hiringFor === 'consultant' || empr?.isConsultant;
        if (hiringForFilter === 'consultant' && !isConsultant) return false;
        if (hiringForFilter === 'your_company' && isConsultant) return false;
      }

      if (industryFilter !== 'All') {
        const ind = (empr.industry || '').toLowerCase();
        if (!ind.includes(industryFilter.toLowerCase())) return false;
      }

      if (sizeFilter !== 'All') {
        const empSize = (empr.employees || '').toLowerCase();
        const filterVal = sizeFilter.toLowerCase().replace(' employees', '');
        if (!empSize.includes(filterVal)) return false;
      }

      if (locationFilter !== 'All') {
        const loc = (empr.location || '').toLowerCase();
        if (!loc.includes(locationFilter.toLowerCase())) return false;
      }

      if (jobsFilter === 'has_active') {
        if ((empr.activeJobs || 0) < 1) return false;
      } else if (jobsFilter === 'no_active') {
        if ((empr.activeJobs || 0) > 0) return false;
      } else if (jobsFilter === 'zero_jobs') {
        if ((empr.totalJobs || 0) > 0) return false;
      } else if (jobsFilter === 'multiple_jobs') {
        if ((empr.totalJobs || 0) < 2) return false;
      }

      if (contactFilter === 'has_mobile') {
        if (!empr.mobile || !empr.mobile.trim()) return false;
      } else if (contactFilter === 'email_only') {
        if (empr.mobile && empr.mobile.trim()) return false;
      }

      if (dateFilter !== 'All' && empr.createdAt) {
        const created = new Date(empr.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          if (created.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === '7days') {
          const diffDays = (now - created) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        } else if (dateFilter === '30days') {
          const diffDays = (now - created) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) return false;
        } else if (dateFilter === '90days') {
          const diffDays = (now - created) / (1000 * 60 * 60 * 24);
          if (diffDays > 90) return false;
        } else if (dateFilter === 'year') {
          if (created.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'companyName') {
        const nameA = (a.companyName || a.fullName || '').toLowerCase();
        const nameB = (b.companyName || b.fullName || '').toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'hiringFor') {
        const typeA = isIndividualHiring(a) ? 'individual' : 'company';
        const typeB = isIndividualHiring(b) ? 'individual' : 'company';
        comparison = typeA.localeCompare(typeB);
      } else if (sortField === 'contact') {
        const emailA = (a.email || '').toLowerCase();
        const emailB = (b.email || '').toLowerCase();
        comparison = emailA.localeCompare(emailB);
      } else if (sortField === 'industry') {
        const indA = (a.industry || '').toLowerCase();
        const indB = (b.industry || '').toLowerCase();
        comparison = indA.localeCompare(indB);
      } else if (sortField === 'location') {
        const locA = (a.location || '').toLowerCase();
        const locB = (b.location || '').toLowerCase();
        comparison = locA.localeCompare(locB);
      } else if (sortField === 'jobs') {
        const jobsA = (a.activeJobs || 0) * 1000 + (a.totalJobs || 0);
        const jobsB = (b.activeJobs || 0) * 1000 + (b.totalJobs || 0);
        comparison = jobsA - jobsB;
      } else if (sortField === 'createdAt') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [employers, search, hiringForFilter, industryFilter, sizeFilter, locationFilter, jobsFilter, contactFilter, dateFilter, sortField, sortDirection]);

  const currentEmployer = detailEmployer || selectedEmployer;

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
            <Building2 className="w-5 h-5 text-emerald-600" />
            Employers
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Authentication & Directory Controls
          </p>
        </div>

        <nav className="space-y-1.5 flex-1">
          {sidebarSections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-gray-400'}`} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Stats / Info badge in sidebar */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100/80 rounded-2xl text-xs space-y-1">
          <p className="font-bold text-emerald-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Employer Portal CMS
          </p>
          <p className="text-[11px] text-emerald-700">
            Control register/login texts, mandatory fields, options, and live candidate visibility.
          </p>
        </div>
      </aside>

      {/* Right Content Area */}
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
                      Employer Register Page Controls
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
                    <span>Loading employer registration controls...</span>
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
                              Step 2: Company Details Fields & Options
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Configure company profile fields, hiring labels, and manage dropdown option lists.</p>
                          </div>
                        </div>

                        {/* Hiring For Options */}
                        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
                                "Hiring For" Radio Choices & Field Label
                              </label>
                              <p className="text-[11px] text-emerald-700/90 mt-0.5">
                                Configure heading text and choices shown to employers in Step 2
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleOpenHiringForModal}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                              title="Add, remove or edit Hiring For options"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>Edit Hiring For</span>
                            </button>
                          </div>

                          {/* Field Label Text Input */}
                          <div>
                            <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                              Section Title / Field Label
                            </label>
                            <input
                              type="text"
                              value={registerConfig.hiringForLabel || 'Hiring For'}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, hiringForLabel: e.target.value }))}
                              placeholder="e.g. Hiring For"
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Dynamic Active Tags */}
                          <div>
                            <span className="block text-[11px] font-semibold text-emerald-900/80 mb-1.5">
                              Active Radio Options ({(registerConfig.hiringForOptions && registerConfig.hiringForOptions.length > 0 ? registerConfig.hiringForOptions : DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS).length}):
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {(registerConfig.hiringForOptions && registerConfig.hiringForOptions.length > 0
                                ? registerConfig.hiringForOptions
                                : DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS
                              ).map((opt, idx) => (
                                <span
                                  key={opt.id || opt.value || idx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-200 text-emerald-900 rounded-lg text-xs font-bold shadow-2xs"
                                >
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>{opt.label}</span>
                                </span>
                              ))}
                            </div>
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

                                  <div className="flex items-center gap-2">
                                    {item.key === 'industry' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const allIndustries = Object.keys(registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA);
                                          if (!allIndustries.includes(selectedIndustry)) {
                                            setSelectedIndustry(allIndustries[0] || '');
                                          }
                                          setIsIndustriesModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                        title="Open Industries & Designation Roles Popup"
                                      >
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Edit Industries & Roles</span>
                                      </button>
                                    )}

                                    {item.key === 'employees' && (
                                      <button
                                        type="button"
                                        onClick={handleOpenCompanySizesModal}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                        title="Open Company Sizes Popup"
                                      >
                                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Edit Company Sizes</span>
                                      </button>
                                    )}

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
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Employer Portal
                            </span>
                            <h2 className="text-xl font-bold text-gray-900 mt-1">{registerConfig.modalTitle || 'Create Employer Account'}</h2>
                            {registerConfig.modalSubtitle && (
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{registerConfig.modalSubtitle}</p>
                            )}
                          </div>

                          {previewRegisterStep === 1 && (
                            <div className="space-y-4 text-xs animate-in fade-in duration-150">
                              {/* Google Sign Up */}
                              <div className="py-2.5 px-4 border border-gray-200 rounded-full text-xs font-bold text-gray-700 flex items-center justify-center gap-2 bg-gray-50/50">
                                <span>🌐</span> {registerConfig.googleBtnText || 'Sign up with Google'}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="flex-1 h-px bg-gray-200"></div>
                                <span className="uppercase tracking-widest">{registerConfig.dividerText || 'Or continue with email'}</span>
                                <div className="flex-1 h-px bg-gray-200"></div>
                              </div>

                              {/* Account Type Selector */}
                              <div className="space-y-1">
                                <label className="block font-bold text-gray-700 text-[11px]">Account Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAccountType('company')}
                                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all text-xs ${
                                      previewAccountType === 'company'
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                  >
                                    {registerConfig.accountTypeCompanyLabel || 'Company / Business'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAccountType('individual')}
                                    className={`py-2 px-3 rounded-xl font-bold text-center border transition-all text-xs ${
                                      previewAccountType === 'individual'
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                  >
                                    {registerConfig.accountTypeIndividualLabel || 'Individual / Proprietor'}
                                  </button>
                                </div>
                              </div>

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

                              {/* Hiring For Selector */}
                              <div className="space-y-1">
                                <label className="block font-bold text-gray-700 text-[11px]">{registerConfig.hiringForLabel || 'Hiring For'}</label>
                                <div className="flex flex-wrap gap-2">
                                  {(registerConfig.hiringForOptions && registerConfig.hiringForOptions.length > 0
                                    ? registerConfig.hiringForOptions
                                    : DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS
                                  ).map((opt, idx) => {
                                    const optVal = opt.value || opt.id;
                                    const isSelected = previewHiringFor === optVal || (idx === 0 && !previewHiringFor);
                                    return (
                                      <button
                                        key={optVal || idx}
                                        type="button"
                                        onClick={() => setPreviewHiringFor(optVal)}
                                        className={`py-2 px-3 rounded-xl font-bold text-center border transition-all text-xs truncate flex-1 min-w-[120px] ${
                                          isSelected
                                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                                            : 'border-gray-200 bg-white text-gray-600'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>
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
                      Employer Login Page Controls
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Customize modal titles, button texts, social logins, OTP controls, and field labels for recruiter sign-in.
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
                    <span>Loading employer login controls...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Form Controls (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Section 1: Modal Header & Button Texts */}
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Modal Header & Action Texts
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
                            <label className="block font-bold text-gray-700 mb-1">Google Sign-in Button Text</label>
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
                            <label className="block font-bold text-gray-700 mb-1">Login / Sign In Button Text</label>
                            <input
                              type="text"
                              value={loginConfig.submitBtnText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, submitBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Use OTP Button Text</label>
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
                            <label className="block font-bold text-gray-700 mb-1">Register Redirect Link Text</label>
                            <input
                              type="text"
                              value={loginConfig.registerCtaText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, registerCtaText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Login Fields Controls */}
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
                        <div className="pb-3 border-b border-gray-100">
                          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                            <Lock className="w-4 h-4 text-emerald-600" />
                            Login Form Fields Controls
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">Customize field labels and placeholders for employer credentials.</p>
                        </div>

                        <div className="space-y-4">
                          {loginFieldKeys.map(item => {
                            const fieldData = loginConfig.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                            return (
                              <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                    {item.title}
                                    <span className="text-red-500 text-sm font-bold">*</span>
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.label || ''}
                                      onChange={(e) => handleLoginFieldChange(item.key, 'label', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.placeholder || ''}
                                      onChange={(e) => handleLoginFieldChange(item.key, 'placeholder', e.target.value)}
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
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Real-time</span>
                        </div>

                        {/* Card Preview Container */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-5 text-left">
                          <div>
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Employer Portal
                            </span>
                            <h2 className="text-xl font-bold text-gray-900 mt-1">{loginConfig.modalTitle || 'Welcome to Employer Portal'}</h2>
                            {loginConfig.modalSubtitle && (
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{loginConfig.modalSubtitle}</p>
                            )}
                          </div>

                          {/* Google Sign In */}
                          <div className="py-2.5 px-4 border border-gray-200 rounded-full text-xs font-bold text-gray-700 flex items-center justify-center gap-2 bg-gray-50/50">
                            <span>🌐</span> {loginConfig.googleBtnText || 'Continue with Google'}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="uppercase tracking-widest">{loginConfig.dividerText || 'Or with email'}</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>

                          {/* Email & Password */}
                          <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-800">
                                {loginConfig.fields?.email?.label || 'Official Email ID'} <span className="text-red-500 font-bold">*</span>
                              </label>
                              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs truncate">
                                {loginConfig.fields?.email?.placeholder || 'name@company.com'}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="block font-bold text-gray-800">
                                  {loginConfig.fields?.password?.label || 'Password'} <span className="text-red-500 font-bold">*</span>
                                </label>
                                <span className="text-[11px] font-bold text-emerald-600 hover:underline">
                                  {loginConfig.forgotPasswordText || 'Forgot Password?'}
                                </span>
                              </div>
                              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs truncate">
                                {loginConfig.fields?.password?.placeholder || '••••••••'}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 space-y-2.5">
                            <div className="w-full py-3 bg-emerald-600 text-white font-bold text-xs text-center rounded-xl shadow-md">
                              {loginConfig.submitBtnText || 'Sign In'}
                            </div>

                            <div className="w-full py-2.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs text-center rounded-xl">
                              {loginConfig.otpBtnText || 'Use OTP to Login'}
                            </div>

                            {loginConfig.registerCtaText && (
                              <p className="text-[11px] text-gray-500 text-center font-medium pt-1">
                                {loginConfig.registerCtaText}
                              </p>
                            )}
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
        {/* 2. POST A JOB CMS & CONTROLS SECTION                                      */}
        {/* ========================================================================= */}
        {activeSection === 'post-job' && (
          <EmployerPostJobEditor
            registerConfig={registerConfig}
            loginConfig={loginConfig}
            onSaveSuccess={() => {
              showToast('Post a Job CMS settings updated successfully!');
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 3. PORTAL & DASHBOARD CMS SECTION                                         */}
        {/* ========================================================================= */}
        {activeSection === 'portal' && (
          <EmployerPortalEditor
            onSaveSuccess={() => {
              showToast('Employer Portal & Dashboard CMS settings updated successfully!');
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 4. DIRECT JOB APPLY LINK CMS SECTION                                      */}
        {/* ========================================================================= */}
        {activeSection === 'direct-apply' && (
          <DirectJobApplyEditor
            onSaveSuccess={() => {
              showToast('Direct Job Apply CMS settings updated successfully!');
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* 3. OVERVIEW & DIRECTORY SECTION                                           */}
        {/* ========================================================================= */}
        {false && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                  <Building2 className="w-7 h-7 text-emerald-600" />
                  Registered Employers Directory
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Manage registered companies, recruiters, their posted job vacancies, and public card display visibility.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs border border-emerald-100">
                  {employers.length} Companies
                </span>
                <button
                  onClick={fetchEmployers}
                  disabled={loading}
                  className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-xs cursor-pointer"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Top Sub Tabs for Directory */}
            <div className="flex items-center gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveMainTabState('list')}
                className={`px-5 py-3 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeMainTab === 'list'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/40 rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                All Employers Directory
              </button>
              <button
                onClick={() => setActiveMainTabState('controls')}
                className={`px-5 py-3 font-bold text-xs border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeMainTab === 'controls'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/40 rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Sliders className="w-4 h-4 text-emerald-600" />
                Display & Visibility Controls
              </button>
            </div>

            {/* DIRECTORY TAB 1: LIST */}
            {activeMainTab === 'list' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3">
                  <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search company, recruiter, email, phone, location, industry..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-all placeholder-gray-400"
                      />
                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-700 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-4">Company / Business</th>
                          <th className="py-3.5 px-4">Recruiter Info</th>
                          <th className="py-3.5 px-4">Industry</th>
                          <th className="py-3.5 px-4">Location</th>
                          <th className="py-3.5 px-4">Active Jobs</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loading ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-gray-400">
                              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-emerald-600 mb-2" />
                              Loading employers directory...
                            </td>
                          </tr>
                        ) : filteredAndSortedEmployers.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-gray-400">
                              No employer records found.
                            </td>
                          </tr>
                        ) : (
                          filteredAndSortedEmployers.map((empr) => {
                            const empId = empr._id || empr.id;
                            const isExpanded = expandedEmployers[empId];
                            return (
                              <React.Fragment key={empId}>
                                <tr className="hover:bg-emerald-50/30 transition-colors">
                                  <td className="py-3.5 px-4 font-bold text-gray-900">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0">
                                        {(empr.companyName || empr.fullName || 'CO').substring(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <span>{empr.companyName || empr.fullName || 'N/A'}</span>
                                        <p className="text-[10px] text-gray-400 font-normal">
                                          {getEmployerTypeLabel(empr)}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <p className="font-semibold text-gray-800">{empr.fullName || 'N/A'}</p>
                                    <p className="text-gray-500 text-[11px]">{empr.email}</p>
                                  </td>
                                  <td className="py-3.5 px-4 text-gray-600 font-medium">{empr.industry || 'N/A'}</td>
                                  <td className="py-3.5 px-4 text-gray-600">{empr.location || 'N/A'}</td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[11px]">
                                      {empr.activeJobs || 0} active
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <button
                                      onClick={() => handleOpenDrawer(empr)}
                                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* DIRECTORY TAB 2: GLOBAL VISIBILITY CONTROLS */}
            {activeMainTab === 'controls' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-emerald-600" />
                        Website-wide "Posted by" Recruiter Card Visibility
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                        Control whether recruiter identity cards (name, avatar, designation) appear on public job postings across the entire platform.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleGlobalVisibility(globalCardVisible)}
                      disabled={globalLoading}
                      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        globalCardVisible ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          globalCardVisible ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 bg-gray-50 rounded-xl text-xs font-medium text-gray-700 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${globalCardVisible ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span>Current Status: <strong>{globalCardVisible ? 'Enabled (Recruiter cards visible on job posts)' : 'Disabled (Recruiter cards hidden globally)'}</strong></span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Slide-out Details Drawer */}
      {selectedEmployer && (
        <div className="fixed inset-0 z-[200] flex justify-end animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => { setSelectedEmployer(null); setDetailEmployer(null); }}
          />

          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                  {(selectedEmployer.companyName || selectedEmployer.fullName || 'CO').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">{selectedEmployer.companyName || selectedEmployer.fullName}</h3>
                  <p className="text-xs text-gray-500">{selectedEmployer.email}</p>
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
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Contact Name</span>
                  <span className="font-bold text-gray-800">{selectedEmployer.fullName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Designation</span>
                  <span className="font-bold text-gray-800">{selectedEmployer.designation || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Industry</span>
                  <span className="font-bold text-gray-800">{selectedEmployer.industry || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Location</span>
                  <span className="font-bold text-gray-800">{selectedEmployer.location || 'N/A'}</span>
                </div>
                {selectedEmployer.website && (
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Website</span>
                    <a href={selectedEmployer.website} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                      {selectedEmployer.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Employer Public Display Toggle */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
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

              {/* Jobs List */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Posted Job Openings</h4>
                {detailLoading ? (
                  <div className="py-6 text-center text-gray-400">Loading jobs...</div>
                ) : !currentEmployer?.jobs || currentEmployer.jobs.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400">No jobs posted yet.</div>
                ) : (
                  currentEmployer.jobs.map(job => (
                    <div key={job._id || job.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{job.jobTitle || job.title}</p>
                        <p className="text-[11px] text-gray-400">{job.location || 'Remote'} • {job.jobType || 'Full-time'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {job.status || 'Active'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => { setSelectedEmployer(null); setDetailEmployer(null); }}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Industries & Roles Management Modal Popup */}
      {isIndustriesModalOpen && (
        <div 
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsIndustriesModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    Industries & Designation Roles
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add custom industries and configure their specific linked designation / job roles.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResetIndustriesModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  title="Reset all industries and roles to standard default dictionary"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleSaveSettings();
                    setIsIndustriesModalOpen(false);
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsIndustriesModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  title="Close popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: 2-Column Split Manager */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* Left Sub-Column (5 Cols): Industry List & Add Industry */}
                <div className="md:col-span-5 space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                      Industries ({Object.keys(registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA).length})
                    </span>
                  </div>

                  {/* Add Industry Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New industry..."
                      value={newIndustryName}
                      onChange={(e) => setNewIndustryName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddIndustryModal(); } }}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddIndustryModal}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Industry Items List with Drag & Drop Reordering */}
                  <div 
                    className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1"
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setDragOverIndustryIndex(null);
                      }
                    }}
                  >
                    {Object.keys(registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA).map((indName, fIdx) => {
                      const isSelected = selectedIndustry === indName;
                      const isDragging = draggedIndustryIndex === fIdx;
                      const isDragOver = dragOverIndustryIndex === fIdx && draggedIndustryIndex !== fIdx;
                      const roleCount = ((registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA)[indName] || []).length;
                      return (
                        <div
                          key={indName}
                          draggable
                          onDragStart={(e) => handleIndustryDragStart(e, fIdx)}
                          onDragOver={(e) => handleIndustryDragOver(e, fIdx)}
                          onDrop={(e) => handleIndustryDrop(e, fIdx)}
                          onDragEnd={handleIndustryDragEnd}
                          onClick={() => setSelectedIndustry(indName)}
                          className={`relative flex items-center justify-between p-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 select-none ${
                            isDragging
                              ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                              : isDragOver
                              ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                              : isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white hover:bg-emerald-50/60 text-gray-700 border border-gray-200/80 hover:border-emerald-300'
                          }`}
                        >
                          {/* Visual Drop Placement Preview Line */}
                          {isDragOver && (
                            <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                          )}

                          <div className="flex items-center gap-1.5 truncate">
                            {/* Drag Handle Icon */}
                            <span 
                              className={`cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors ${
                                isSelected ? 'text-emerald-200 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                              }`}
                              title="Drag to change position"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>

                            <span className="truncate">{indName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {roleCount}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteIndustryModal(indName);
                            }}
                            className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${
                              isSelected ? 'text-emerald-200' : 'text-gray-400 hover:text-red-600'
                            }`}
                            title={`Delete industry "${indName}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Sub-Column (7 Cols): Designation Roles for Selected Industry */}
                <div className="md:col-span-7 space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 truncate">
                      <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Roles in <span className="text-emerald-700 font-extrabold truncate">"{selectedIndustry || 'None'}"</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                        {((registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA)[selectedIndustry] || []).length} Roles
                      </span>
                    </span>
                  </div>

                  {/* Add Role Input */}
                  {selectedIndustry ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Add role to ${selectedIndustry}...`}
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRoleModal(); } }}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddRoleModal}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Role</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Select an industry from the left to manage designations.</p>
                  )}

                  {/* Roles Pills Grid */}
                  <div className="min-h-[160px] max-h-72 overflow-y-auto custom-scrollbar p-3 bg-white border border-gray-200/80 rounded-xl">
                    {((registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA)[selectedIndustry] || []).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-8">
                        <Tag className="w-6 h-6 text-gray-300 mb-1" />
                        <span className="text-xs font-medium">No designations added for this industry yet.</span>
                        <span className="text-[11px] text-gray-400 mt-0.5">Type above and click "Add Role"</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {((registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA)[selectedIndustry] || []).map((role, rIdx) => (
                          <span
                            key={rIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-[11px] font-bold"
                          >
                            <span>{role}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoleModal(selectedIndustry, rIdx)}
                              className="text-emerald-500 hover:text-red-600 transition-colors p-0.5 rounded cursor-pointer"
                              title="Remove designation"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Click <span className="font-bold text-gray-700">"Save & Apply"</span> to persist your industries & roles to the database.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsIndustriesModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleSaveSettings();
                    setIsIndustriesModalOpen(false);
                  }}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hiring For Options Manager Modal */}
      {isHiringForModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                    Manage "Hiring For" Options
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Add, edit, or remove radio choices shown on registration Step 2</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHiringForModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Section Heading Text Input */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1.5">
                <label className="block text-xs font-bold text-gray-800">
                  Section Title / Field Label Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hiring For"
                  value={modalHiringForLabel}
                  onChange={(e) => setModalHiringForLabel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <p className="text-[11px] text-gray-500">
                  The heading text displayed above the radio buttons in the registration form
                </p>
              </div>

              {/* Add New Option Box */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2.5">
                <label className="block text-xs font-bold text-emerald-950">Add New Hiring Option</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Consultant"
                    value={newHiringForLabel}
                    onChange={(e) => {
                      setNewHiringForLabel(e.target.value);
                      if (hiringForModalError) setHiringForModalError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHiringForOption();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddHiringForOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Option</span>
                  </button>
                </div>
                {hiringForModalError && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{hiringForModalError}</span>
                  </p>
                )}
              </div>

              {/* Existing Options List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Current Options ({hiringForModalList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetHiringForOptions}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Restore default 2 options"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {hiringForModalList.map((opt, idx) => (
                    <div
                      key={opt.id || opt.value || idx}
                      className="p-3 bg-gray-50/90 hover:bg-gray-100/80 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => handleEditHiringForLabel(idx, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHiringForOption(idx)}
                        disabled={hiringForModalList.length <= 1}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        title={hiringForModalList.length <= 1 ? "At least 1 option required" : "Delete option"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Click <span className="font-bold text-gray-700">"Save & Apply"</span> to publish changes.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsHiringForModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveHiringForModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Company Size Options Manager Modal */}
      {isCompanySizesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                    Manage Company Size Options
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Add, edit, or remove company size options for Step 2 dropdown</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompanySizesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Add New Size Box */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2.5">
                <label className="block text-xs font-bold text-emerald-950">Add New Company Size</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 500-1000 employees"
                    value={newCompanySizeInput}
                    onChange={(e) => {
                      setNewCompanySizeInput(e.target.value);
                      if (companySizeModalError) setCompanySizeModalError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCompanySizeModal();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCompanySizeModal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Size</span>
                  </button>
                </div>
                {companySizeModalError && (
                  <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{companySizeModalError}</span>
                  </p>
                )}
              </div>

              {/* Existing Sizes List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                    Current Size Ranges ({companySizesModalList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetCompanySizesModal}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Restore default 5 options"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {companySizesModalList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50/90 hover:bg-gray-100/80 rounded-xl border border-gray-200/80 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleEditCompanySizeModal(idx, e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompanySizeModal(idx)}
                        disabled={companySizesModalList.length <= 1}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                        title={companySizesModalList.length <= 1 ? "At least 1 option required" : "Delete option"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Click <span className="font-bold text-gray-700">"Save & Apply"</span> to publish changes.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompanySizesModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompanySizesModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
