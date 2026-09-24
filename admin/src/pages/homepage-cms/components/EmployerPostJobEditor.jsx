import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  FileText,
  DollarSign,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  GripVertical,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Layers,
  Tag,
  Building2,
  MapPin,
  Clock,
  GraduationCap,
  BookOpen,
  RefreshCw,
  ChevronDown,
  Lock,
  UserCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_POST_JOB_CATEGORIES = [
  'Accounting & Finance', 'Administration & Office Support', 'Advertising & Media', 'Agriculture & Farming',
  'Analytics & Data Science', 'Architecture & Interior Design', 'Artificial Intelligence & ML', 'Arts & Creative',
  'Automotive', 'Aviation & Aerospace', 'Banking & Financial Services', 'BPO & Call Centre',
  'Civil & Structural Engineering', 'Cloud & DevOps', 'Community & Social Services', 'Construction & Real Estate',
  'Content & Copywriting', 'Customer Service & Support', 'Cybersecurity', 'Data Entry & Back Office',
  'Defence & Government', 'Design & UI/UX', 'E-commerce & Retail', 'Education & Training',
  'Electrical Engineering', 'Electronics & Embedded Systems', 'Energy & Utilities', 'Engineering & Manufacturing',
  'Entertainment & Events', 'Environmental Science', 'Fashion & Apparel', 'Food & Beverage',
  'Freelance & Consulting', 'Full Stack Development', 'Game Development', 'Healthcare & Medical',
  'Hospitality & Tourism', 'Human Resources', 'Information Technology', 'Insurance',
  'Interior Design', 'IT Support & Networking', 'Legal & Compliance', 'Logistics & Supply Chain',
  'Management Consulting', 'Marketing & Digital Marketing', 'Mechanical Engineering', 'Media & Journalism',
  'Mobile App Development', 'NGO & Non-profit', 'Operations & Supply Chain', 'Pharmaceutical & Biotech',
  'Photography & Videography', 'Product Management', 'Project Management', 'Public Relations',
  'Quality Assurance & Testing', 'Research & Development', 'Retail & Consumer Goods', 'Sales & Business Development',
  'Security & Surveillance', 'Social Media & Content Creation', 'Software Development', 'Sports & Fitness',
  'Telecommunications', 'Transportation & Driving', 'Travel & Immigration', 'UI/UX & Graphic Design', 'Other'
];

export const DEFAULT_POST_JOB_QUALIFICATIONS = [
  'Any Graduate', 'Any Post Graduate', 'High School (10th)', 'Intermediate (12th)', 'Diploma',
  'ITI', 'Polytechnic', "Bachelor's Degree (Any)", 'B.Tech / B.E.', 'B.Sc', 'B.Com', 'B.A',
  'BBA', 'BCA', 'B.Pharma', 'MBBS', 'BDS', 'LLB', 'B.Ed', 'B.Arch',
  "Master's Degree (Any)", 'M.Tech / M.E.', 'MBA / PGDM', 'MCA', 'M.Sc', 'M.Com', 'M.A',
  'M.Pharma', 'LLM', 'M.Ed', 'MS (Medical)', 'Doctorate (PhD)', 'MD (Doctor of Medicine)', 'Not Required'
];

export const DEFAULT_POST_JOB_STREAMS = [
  'Any Stream', 'Computer Science / IT', 'Information Technology', 'Software Engineering',
  'Data Science / AI / ML', 'Cybersecurity', 'Electronics & Communication (ECE)',
  'Electrical Engineering (EEE)', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Aerospace Engineering', 'Automobile Engineering',
  'Production / Industrial Engineering', 'Business Administration / Management',
  'Marketing & Sales', 'Finance & Accounting', 'Human Resources', 'Operations Management',
  'International Business', 'Commerce / Finance', 'Economics', 'Accounting & Taxation',
  'Arts / Humanities', 'English / Literature', 'Journalism & Mass Communication',
  'Psychology', 'Sociology', 'Political Science', 'Physics', 'Chemistry',
  'Mathematics / Statistics', 'Biotechnology', 'Life Sciences / Biology',
  'Medicine (MBBS / MD)', 'Pharmacy', 'Nursing', 'Dentistry', 'Law (LLB / LLM)',
  'Architecture & Urban Planning', 'Interior Design', 'Fashion Design',
  'Fine Arts / Visual Arts', 'Education / Teaching (B.Ed)',
  'Hotel Management / Hospitality', 'Agriculture & Food Science',
  'Environmental Science', 'Other'
];

export const DEFAULT_POST_JOB_EMPLOYMENT_TYPES = [
  'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'
];

export const DEFAULT_POST_JOB_EXPERIENCE_OPTIONS = [
  '0 - 1 Yrs', '2 - 3 Yrs', '4 - 6 Yrs', '7 - 10 Yrs', '11 - 15 Yrs', '16 - 20 Yrs', '21 - 25 Yrs', '25+ yrs'
];

export const DEFAULT_POST_JOB_WORKPLACE_TYPES = [
  'On-site', 'Hybrid', 'Remote'
];

export const DEFAULT_POST_JOB_SALARY_TYPES = [
  'Yearly', 'Monthly', 'Hourly'
];

export const DEFAULT_POST_JOB_CURRENCIES = [
  { code: 'INR', label: 'INR (₹)', symbol: '₹' },
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
  { code: 'AED', label: 'AED (د.إ)', symbol: 'د.إ' },
  { code: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
  { code: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { code: 'SGD', label: 'SGD (S$)', symbol: 'S$' },
  { code: 'CHF', label: 'CHF (CHF)', symbol: 'CHF' },
  { code: 'CNY', label: 'CNY (¥)', symbol: '¥' },
  { code: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  { code: 'NZD', label: 'NZD (NZ$)', symbol: 'NZ$' },
  { code: 'ZAR', label: 'ZAR (R)', symbol: 'R' },
  { code: 'BRL', label: 'BRL (R$)', symbol: 'R$' },
  { code: 'RUB', label: 'RUB (₽)', symbol: '₽' },
  { code: 'KRW', label: 'KRW (₩)', symbol: '₩' },
  { code: 'SEK', label: 'SEK (kr)', symbol: 'kr' },
  { code: 'NOK', label: 'NOK (kr)', symbol: 'kr' },
  { code: 'MXN', label: 'MXN ($)', symbol: '$' },
  { code: 'HKD', label: 'HKD (HK$)', symbol: 'HK$' },
  { code: 'TRY', label: 'TRY (₺)', symbol: '₺' },
  { code: 'SAR', label: 'SAR (﷼)', symbol: '﷼' },
  { code: 'MYR', label: 'MYR (RM)', symbol: 'RM' },
  { code: 'IDR', label: 'IDR (Rp)', symbol: 'Rp' },
  { code: 'THB', label: 'THB (฿)', symbol: '฿' },
  { code: 'PHP', label: 'PHP (₱)', symbol: '₱' },
  { code: 'VND', label: 'VND (₫)', symbol: '₫' },
  { code: 'EGP', label: 'EGP (E£)', symbol: 'E£' },
  { code: 'NGN', label: 'NGN (₦)', symbol: '₦' },
  { code: 'ARS', label: 'ARS ($)', symbol: '$' },
  { code: 'COP', label: 'COP ($)', symbol: '$' },
  { code: 'CLP', label: 'CLP ($)', symbol: '$' },
  { code: 'PEN', label: 'PEN (S/)', symbol: 'S/' },
  { code: 'ILS', label: 'ILS (₪)', symbol: '₪' },
  { code: 'KWD', label: 'KWD (د.ك)', symbol: 'د.ك' },
  { code: 'QAR', label: 'QAR (﷼)', symbol: '﷼' },
  { code: 'BHD', label: 'BHD (.د.ب)', symbol: '.د.ب' },
  { code: 'OMR', label: 'OMR (ر.ع.)', symbol: 'ر.ع.' },
  { code: 'PKR', label: 'PKR (₨)', symbol: '₨' },
  { code: 'BDT', label: 'BDT (৳)', symbol: '৳' },
  { code: 'LKR', label: 'LKR (₨)', symbol: '₨' }
];

export const DEFAULT_POST_JOB_SCREENING_QUESTIONS = [
  { id: 'sq_1', question: "Do you have a Bachelor's degree or higher?", type: "Yes/No", required: true },
  { id: 'sq_2', question: "How many years of relevant work experience do you have?", type: "Short Text", required: true },
  { id: 'sq_3', question: "Are you comfortable with the specified job location / commuting?", type: "Yes/No", required: true },
  { id: 'sq_4', question: "What is your official notice period (in days)?", type: "Short Text", required: false },
  { id: 'sq_5', question: "What is your expected CTC / salary expectation?", type: "Short Text", required: false },
  { id: 'sq_6', question: "Are you willing to work in rotational / hybrid shifts?", type: "Yes/No", required: false }
];

export const DEFAULT_EMPLOYER_POST_JOB_CONFIG = {
  header: {
    title: 'POST A NEW JOB',
    subtitle: 'Fill in the details to create a new job posting.',
    editTitle: 'Edit Job',
    editSubtitle: 'Update the details of your job posting.'
  },
  buttons: {
    continueBtnText: 'Continue',
    backBtnText: 'Back',
    editBtnText: 'Edit',
    publishBtnText: 'Publish Job',
    updateBtnText: 'Update Job'
  },
  step1: {
    stepTitle: 'Job Details',
    stepNumberText: '1',
    fields: {
      title: { label: 'Job Title', placeholder: 'e.g. Frontend Developer', isRequired: true },
      employmentType: { label: 'Employment Type', placeholder: 'Select employment type', isRequired: true },
      experience: { label: 'Experience', placeholder: 'Select experience', isRequired: true },
      workplaceType: { label: 'Workplace Type', placeholder: 'Select type', isRequired: true },
      openings: { label: 'Openings', placeholder: 'Number of openings', isRequired: false },
      location: { label: 'Job Location', placeholder: 'Select Job Locations', isRequired: true }
    },
    employmentTypeOptions: [...DEFAULT_POST_JOB_EMPLOYMENT_TYPES],
    experienceOptions: [...DEFAULT_POST_JOB_EXPERIENCE_OPTIONS],
    workplaceTypeOptions: [...DEFAULT_POST_JOB_WORKPLACE_TYPES]
  },
  step2: {
    stepTitle: 'Job Description',
    stepNumberText: '2',
    fields: {
      aboutRole: { label: 'About Role', placeholder: 'Brief overview of the role, team, and expectations...', isRequired: true },
      responsibilities: { label: 'Responsibilities', placeholder: 'Key responsibilities, day-to-day tasks, bullet points, deliverables...', isRequired: true },
      skillsRequired: {
        label: 'Skills Required',
        placeholder: 'Search or select a skill to add...',
        suggestedHeading: 'Suggested based on your selection',
        isRequired: true
      }
    }
  },
  step3: {
    stepTitle: 'Salary & Requirements',
    stepNumberText: '3',
    sectionTitle: 'Salary Type',
    salaryTypeLabel: 'Salary Type',
    currencyLabel: 'Currency',
    yearlySalaryLabel: 'Annual Salary',
    monthlySalaryLabel: 'Monthly Salary',
    hourlyRateLabel: 'Hourly Rate',
    minSalaryPlaceholder: 'write the amount in LPA',
    maxSalaryPlaceholder: 'write the amount in LPA',
    minLabel: 'Minimum',
    maxLabel: 'Maximum',
    salaryDisclaimer: 'This salary will be shown to candidates on the job listing.',
    salaryTypeOptions: [...DEFAULT_POST_JOB_SALARY_TYPES],
    currencyOptions: [...DEFAULT_POST_JOB_CURRENCIES],
    fields: {
      category: { label: 'Job Category', placeholder: 'Select a job category...', isRequired: true },
      qualification: { label: 'Qualification', placeholder: 'Select qualification...', isRequired: true },
      stream: { label: 'Stream / Major', placeholder: 'Select stream / major...', isRequired: false }
    },
    categoryOptions: [...DEFAULT_POST_JOB_CATEGORIES],
    qualificationOptions: [...DEFAULT_POST_JOB_QUALIFICATIONS],
    streamOptions: [...DEFAULT_POST_JOB_STREAMS]
  },
  step4: {
    stepTitle: 'Screening Questions',
    stepNumberText: '4',
    heading: 'Applicant Screening Questions',
    subtitle: 'Add optional questions for candidates to answer when applying.',
    addBtnText: '+ Add Question',
    emptyTitle: 'No screening questions added yet.',
    emptySubtitle: 'Add questions to pre-screen applicants (e.g., "Do you have a Bachelor\'s degree?").',
    questionLabelPrefix: 'Question',
    questionPlaceholder: 'e.g., How many years of React experience do you have?',
    responseTypeLabel: 'Response Type',
    requiredLabel: 'Required',
    responseTypeOptions: ['Yes/No', 'Short Text'],
    recommendedTemplates: [...DEFAULT_POST_JOB_SCREENING_QUESTIONS]
  },
  step5: {
    stepTitle: 'Preview',
    stepNumberText: '5',
    heading: 'Job Preview',
    basicInfoLabel: 'Basic Information',
    requirementsLabel: 'Requirements & Info',
    aboutRoleLabel: 'About the Role',
    responsibilitiesLabel: 'Key Responsibilities',
    skillsLabel: 'Skills Required',
    screeningQuestionsLabel: 'Screening Questions',
    noDescriptionText: 'No description provided.',
    noResponsibilitiesText: 'No responsibilities listed.',
    noSkillsText: 'No specific skills requested.'
  }
};

export default function EmployerPostJobEditor({ onSaveSuccess, registerConfig, loginConfig }) {
  const [activeStep, setActiveStepState] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_employer_post_job_step');
      const num = parseInt(saved, 10);
      return (num >= 1 && num <= 5) ? num : 1;
    } catch (e) {
      return 1;
    }
  });

  const setActiveStep = (step) => {
    setActiveStepState(step);
    try {
      localStorage.setItem('admin_employer_post_job_step', String(step));
    } catch (e) {}
  };

  const [postJobConfig, setPostJobConfig] = useState(DEFAULT_EMPLOYER_POST_JOB_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sub-Editor Modals State
  const [isEmpTypesModalOpen, setIsEmpTypesModalOpen] = useState(false);
  const [empTypesModalList, setEmpTypesModalList] = useState([]);
  const [newEmpTypeInput, setNewEmpTypeInput] = useState('');
  const [empTypeError, setEmpTypeError] = useState('');

  const [isExpRangesModalOpen, setIsExpRangesModalOpen] = useState(false);
  const [expRangesModalList, setExpRangesModalList] = useState([]);
  const [newExpRangeInput, setNewExpRangeInput] = useState('');
  const [expRangeError, setExpRangeError] = useState('');

  const [isWorkplaceTypesModalOpen, setIsWorkplaceTypesModalOpen] = useState(false);
  const [workplaceTypesModalList, setWorkplaceTypesModalList] = useState([]);
  const [newWorkplaceTypeInput, setNewWorkplaceTypeInput] = useState('');
  const [workplaceTypeError, setWorkplaceTypeError] = useState('');

  const [isSalaryTypesModalOpen, setIsSalaryTypesModalOpen] = useState(false);
  const [salaryTypesModalList, setSalaryTypesModalList] = useState([]);
  const [newSalaryTypeInput, setNewSalaryTypeInput] = useState('');
  const [salaryTypeError, setSalaryTypeError] = useState('');

  const [isCurrenciesModalOpen, setIsCurrenciesModalOpen] = useState(false);
  const [currenciesModalList, setCurrenciesModalList] = useState([]);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyLabel, setNewCurrencyLabel] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [currencyError, setCurrencyError] = useState('');

  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categoriesModalList, setCategoriesModalList] = useState([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const [isQualificationsModalOpen, setIsQualificationsModalOpen] = useState(false);
  const [qualificationsModalList, setQualificationsModalList] = useState([]);
  const [newQualificationInput, setNewQualificationInput] = useState('');
  const [qualificationError, setQualificationError] = useState('');
  const [qualificationSearchQuery, setQualificationSearchQuery] = useState('');

  const [isStreamsModalOpen, setIsStreamsModalOpen] = useState(false);
  const [streamsModalList, setStreamsModalList] = useState([]);
  const [newStreamInput, setNewStreamInput] = useState('');
  const [streamError, setStreamError] = useState('');
  const [streamSearchQuery, setStreamSearchQuery] = useState('');

  const [isScreeningTemplatesModalOpen, setIsScreeningTemplatesModalOpen] = useState(false);
  const [screeningTemplatesModalList, setScreeningTemplatesModalList] = useState([]);
  const [newScreeningQuestionText, setNewScreeningQuestionText] = useState('');
  const [newScreeningQuestionType, setNewScreeningQuestionType] = useState('Yes/No');
  const [newScreeningQuestionRequired, setNewScreeningQuestionRequired] = useState(true);
  const [screeningTemplateError, setScreeningTemplateError] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Homepage Config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employerPostJob) {
          const fetched = data.data.employerPostJob;
          setPostJobConfig({
            ...DEFAULT_EMPLOYER_POST_JOB_CONFIG,
            ...fetched,
            header: {
              ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.header,
              ...(fetched.header || {})
            },
            buttons: {
              ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.buttons,
              ...(fetched.buttons || {})
            },
            step1: {
              ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.step1,
              ...(fetched.step1 || {}),
              fields: {
                ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.step1.fields,
                ...(fetched.step1?.fields || {})
              },
              employmentTypeOptions: (fetched.step1?.employmentTypeOptions && fetched.step1.employmentTypeOptions.length > 0)
                ? fetched.step1.employmentTypeOptions
                : DEFAULT_POST_JOB_EMPLOYMENT_TYPES,
              experienceOptions: (fetched.step1?.experienceOptions && fetched.step1.experienceOptions.length > 0)
                ? fetched.step1.experienceOptions
                : DEFAULT_POST_JOB_EXPERIENCE_OPTIONS,
              workplaceTypeOptions: (fetched.step1?.workplaceTypeOptions && fetched.step1.workplaceTypeOptions.length > 0)
                ? fetched.step1.workplaceTypeOptions
                : DEFAULT_POST_JOB_WORKPLACE_TYPES
            },
            step2: {
              ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.step2,
              ...(fetched.step2 || {}),
              fields: {
                ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.step2.fields,
                ...(fetched.step2?.fields || {})
              }
            },
            step3: {
              ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.step3,
              ...(fetched.step3 || {}),
              salaryTypeOptions: (fetched.step3?.salaryTypeOptions && fetched.step3.salaryTypeOptions.length > 0)
                ? fetched.step3.salaryTypeOptions
                : DEFAULT_POST_JOB_SALARY_TYPES,
              currencyOptions: (fetched.step3?.currencyOptions && fetched.step3.currencyOptions.length > 0)
                ? fetched.step3.currencyOptions
                : DEFAULT_POST_JOB_CURRENCIES,
              fields: {
                ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.step3.fields,
                ...(fetched.step3?.fields || {})
              },
              categoryOptions: (fetched.step3?.categoryOptions && fetched.step3.categoryOptions.length > 0)
                ? fetched.step3.categoryOptions
                : DEFAULT_POST_JOB_CATEGORIES,
              qualificationOptions: (fetched.step3?.qualificationOptions && fetched.step3.qualificationOptions.length > 0)
                ? fetched.step3.qualificationOptions
                : DEFAULT_POST_JOB_QUALIFICATIONS,
              streamOptions: (fetched.step3?.streamOptions && fetched.step3.streamOptions.length > 0)
                ? fetched.step3.streamOptions
                : DEFAULT_POST_JOB_STREAMS
            },
            step4: {
              ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.step4,
              ...(fetched.step4 || {}),
              recommendedTemplates: (fetched.step4?.recommendedTemplates && fetched.step4.recommendedTemplates.length > 0)
                ? fetched.step4.recommendedTemplates
                : DEFAULT_POST_JOB_SCREENING_QUESTIONS
            },
            step5: {
              ...DEFAULT_EMPLOYER_POST_JOB_CONFIG.step5,
              ...(fetched.step5 || {})
            }
          });
        }
      } catch (err) {
        console.error('Error fetching Post a Job CMS config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  // Save Settings Function
  const handleSavePostJobConfig = async (customConfig) => {
    const configToSave = customConfig || postJobConfig;
    try {
      setSaving(true);
      setToastMessage('');
      setErrorMessage('');

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerPostJob: configToSave,
          ...(registerConfig ? { employerRegister: registerConfig } : {}),
          ...(loginConfig ? { employerLogin: loginConfig } : {})
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Post a Job settings saved & published successfully!');
        if (onSaveSuccess) onSaveSuccess(configToSave);
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving Post a Job config:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  // Helper field change handlers
  const handleHeaderChange = (key, value) => {
    setPostJobConfig(prev => ({
      ...prev,
      header: { ...prev.header, [key]: value }
    }));
  };

  const handleButtonsChange = (key, value) => {
    setPostJobConfig(prev => ({
      ...prev,
      buttons: { ...prev.buttons, [key]: value }
    }));
  };

  const handleStep1FieldChange = (key, prop, value) => {
    setPostJobConfig(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        fields: {
          ...prev.step1.fields,
          [key]: { ...prev.step1.fields[key], [prop]: value }
        }
      }
    }));
  };

  const handleToggleStep1Required = (key) => {
    setPostJobConfig(prev => {
      const current = prev.step1?.fields?.[key]?.isRequired !== false;
      return {
        ...prev,
        step1: {
          ...prev.step1,
          fields: {
            ...prev.step1.fields,
            [key]: { ...prev.step1.fields[key], isRequired: !current }
          }
        }
      };
    });
  };

  const handleStep2FieldChange = (key, prop, value) => {
    setPostJobConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        fields: {
          ...prev.step2.fields,
          [key]: { ...prev.step2.fields[key], [prop]: value }
        }
      }
    }));
  };

  const handleToggleStep2Required = (key) => {
    setPostJobConfig(prev => {
      const current = prev.step2?.fields?.[key]?.isRequired !== false;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          fields: {
            ...prev.step2.fields,
            [key]: { ...prev.step2.fields[key], isRequired: !current }
          }
        }
      };
    });
  };

  const handleStep3PropChange = (key, value) => {
    setPostJobConfig(prev => ({
      ...prev,
      step3: { ...prev.step3, [key]: value }
    }));
  };

  const handleStep3FieldChange = (key, prop, value) => {
    setPostJobConfig(prev => ({
      ...prev,
      step3: {
        ...prev.step3,
        fields: {
          ...prev.step3.fields,
          [key]: { ...prev.step3.fields[key], [prop]: value }
        }
      }
    }));
  };

  const handleToggleStep3Required = (key) => {
    setPostJobConfig(prev => {
      const current = prev.step3?.fields?.[key]?.isRequired !== false;
      return {
        ...prev,
        step3: {
          ...prev.step3,
          fields: {
            ...prev.step3.fields,
            [key]: { ...prev.step3.fields[key], isRequired: !current }
          }
        }
      };
    });
  };

  const handleStep4PropChange = (key, value) => {
    setPostJobConfig(prev => ({
      ...prev,
      step4: { ...prev.step4, [key]: value }
    }));
  };

  const handleStep5PropChange = (key, value) => {
    setPostJobConfig(prev => ({
      ...prev,
      step5: { ...prev.step5, [key]: value }
    }));
  };

  // Sub-Editor Handlers
  const handleOpenEmpTypesModal = () => {
    setEmpTypesModalList([...(postJobConfig.step1?.employmentTypeOptions || DEFAULT_POST_JOB_EMPLOYMENT_TYPES)]);
    setNewEmpTypeInput('');
    setEmpTypeError('');
    setIsEmpTypesModalOpen(true);
  };

  const handleAddEmpTypeOption = () => {
    const trimmed = newEmpTypeInput.trim();
    if (!trimmed) return;
    if (empTypesModalList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setEmpTypeError('Option already exists');
      return;
    }
    setEmpTypesModalList(prev => [...prev, trimmed]);
    setNewEmpTypeInput('');
    setEmpTypeError('');
  };

  const handleDeleteEmpTypeOption = (idx) => {
    if (empTypesModalList.length <= 1) return;
    setEmpTypesModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveEmpTypesModal = async () => {
    const updated = {
      ...postJobConfig,
      step1: { ...postJobConfig.step1, employmentTypeOptions: empTypesModalList }
    };
    setPostJobConfig(updated);
    setIsEmpTypesModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const handleOpenExpRangesModal = () => {
    setExpRangesModalList([...(postJobConfig.step1?.experienceOptions || DEFAULT_POST_JOB_EXPERIENCE_OPTIONS)]);
    setNewExpRangeInput('');
    setExpRangeError('');
    setIsExpRangesModalOpen(true);
  };

  const handleAddExpRangeOption = () => {
    const trimmed = newExpRangeInput.trim();
    if (!trimmed) return;
    if (expRangesModalList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setExpRangeError('Option already exists');
      return;
    }
    setExpRangesModalList(prev => [...prev, trimmed]);
    setNewExpRangeInput('');
    setExpRangeError('');
  };

  const handleDeleteExpRangeOption = (idx) => {
    if (expRangesModalList.length <= 1) return;
    setExpRangesModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveExpRangesModal = async () => {
    const updated = {
      ...postJobConfig,
      step1: { ...postJobConfig.step1, experienceOptions: expRangesModalList }
    };
    setPostJobConfig(updated);
    setIsExpRangesModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const handleOpenWorkplaceTypesModal = () => {
    setWorkplaceTypesModalList([...(postJobConfig.step1?.workplaceTypeOptions || DEFAULT_POST_JOB_WORKPLACE_TYPES)]);
    setNewWorkplaceTypeInput('');
    setWorkplaceTypeError('');
    setIsWorkplaceTypesModalOpen(true);
  };

  const handleAddWorkplaceTypeOption = () => {
    const trimmed = newWorkplaceTypeInput.trim();
    if (!trimmed) return;
    if (workplaceTypesModalList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setWorkplaceTypeError('Option already exists');
      return;
    }
    setWorkplaceTypesModalList(prev => [...prev, trimmed]);
    setNewWorkplaceTypeInput('');
    setWorkplaceTypeError('');
  };

  const handleDeleteWorkplaceTypeOption = (idx) => {
    if (workplaceTypesModalList.length <= 1) return;
    setWorkplaceTypesModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveWorkplaceTypesModal = async () => {
    const updated = {
      ...postJobConfig,
      step1: { ...postJobConfig.step1, workplaceTypeOptions: workplaceTypesModalList }
    };
    setPostJobConfig(updated);
    setIsWorkplaceTypesModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const handleOpenCategoriesModal = () => {
    setCategoriesModalList([...(postJobConfig.step3?.categoryOptions || DEFAULT_POST_JOB_CATEGORIES)]);
    setNewCategoryInput('');
    setCategoryError('');
    setCategorySearchQuery('');
    setIsCategoriesModalOpen(true);
  };

  const handleAddCategoryOption = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categoriesModalList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError('Category already exists');
      return;
    }
    setCategoriesModalList(prev => [trimmed, ...prev]);
    setNewCategoryInput('');
    setCategoryError('');
  };

  const handleDeleteCategoryOption = (idx) => {
    if (categoriesModalList.length <= 1) return;
    setCategoriesModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveCategoriesModal = async () => {
    const updated = {
      ...postJobConfig,
      step3: { ...postJobConfig.step3, categoryOptions: categoriesModalList }
    };
    setPostJobConfig(updated);
    setIsCategoriesModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const handleOpenQualificationsModal = () => {
    setQualificationsModalList([...(postJobConfig.step3?.qualificationOptions || DEFAULT_POST_JOB_QUALIFICATIONS)]);
    setNewQualificationInput('');
    setQualificationError('');
    setQualificationSearchQuery('');
    setIsQualificationsModalOpen(true);
  };

  const handleAddQualificationOption = () => {
    const trimmed = newQualificationInput.trim();
    if (!trimmed) return;
    if (qualificationsModalList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setQualificationError('Qualification already exists');
      return;
    }
    setQualificationsModalList(prev => [trimmed, ...prev]);
    setNewQualificationInput('');
    setQualificationError('');
  };

  const handleDeleteQualificationOption = (idx) => {
    if (qualificationsModalList.length <= 1) return;
    setQualificationsModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveQualificationsModal = async () => {
    const updated = {
      ...postJobConfig,
      step3: { ...postJobConfig.step3, qualificationOptions: qualificationsModalList }
    };
    setPostJobConfig(updated);
    setIsQualificationsModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const handleOpenStreamsModal = () => {
    setStreamsModalList([...(postJobConfig.step3?.streamOptions || DEFAULT_POST_JOB_STREAMS)]);
    setNewStreamInput('');
    setStreamError('');
    setStreamSearchQuery('');
    setIsStreamsModalOpen(true);
  };

  const handleAddStreamOption = () => {
    const trimmed = newStreamInput.trim();
    if (!trimmed) return;
    if (streamsModalList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setStreamError('Stream already exists');
      return;
    }
    setStreamsModalList(prev => [trimmed, ...prev]);
    setNewStreamInput('');
    setStreamError('');
  };

  const handleDeleteStreamOption = (idx) => {
    if (streamsModalList.length <= 1) return;
    setStreamsModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveStreamsModal = async () => {
    const updated = {
      ...postJobConfig,
      step3: { ...postJobConfig.step3, streamOptions: streamsModalList }
    };
    setPostJobConfig(updated);
    setIsStreamsModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const handleOpenScreeningTemplatesModal = () => {
    setScreeningTemplatesModalList(JSON.parse(JSON.stringify(postJobConfig.step4?.recommendedTemplates || DEFAULT_POST_JOB_SCREENING_QUESTIONS)));
    setNewScreeningQuestionText('');
    setNewScreeningQuestionType('Yes/No');
    setNewScreeningQuestionRequired(true);
    setScreeningTemplateError('');
    setIsScreeningTemplatesModalOpen(true);
  };

  const handleAddScreeningTemplate = () => {
    const trimmed = newScreeningQuestionText.trim();
    if (!trimmed) return;
    const newTemplate = {
      id: `sq_${Date.now()}`,
      question: trimmed,
      type: newScreeningQuestionType,
      required: newScreeningQuestionRequired
    };
    setScreeningTemplatesModalList(prev => [...prev, newTemplate]);
    setNewScreeningQuestionText('');
    setScreeningTemplateError('');
  };

  const handleDeleteScreeningTemplate = (idx) => {
    if (screeningTemplatesModalList.length <= 1) return;
    setScreeningTemplatesModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveScreeningTemplatesModal = async () => {
    const updated = {
      ...postJobConfig,
      step4: { ...postJobConfig.step4, recommendedTemplates: screeningTemplatesModalList }
    };
    setPostJobConfig(updated);
    setIsScreeningTemplatesModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const handleOpenSalaryTypesModal = () => {
    setSalaryTypesModalList([...(postJobConfig.step3?.salaryTypeOptions || DEFAULT_POST_JOB_SALARY_TYPES)]);
    setNewSalaryTypeInput('');
    setSalaryTypeError('');
    setIsSalaryTypesModalOpen(true);
  };

  const handleAddSalaryTypeOption = () => {
    const trimmed = newSalaryTypeInput.trim();
    if (!trimmed) return;
    if (salaryTypesModalList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      setSalaryTypeError('This salary type already exists');
      return;
    }
    setSalaryTypesModalList(prev => [...prev, trimmed]);
    setNewSalaryTypeInput('');
    setSalaryTypeError('');
  };

  const handleDeleteSalaryTypeOption = (idx) => {
    if (salaryTypesModalList.length <= 1) return;
    setSalaryTypesModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveSalaryTypesModal = async () => {
    const updated = {
      ...postJobConfig,
      step3: { ...postJobConfig.step3, salaryTypeOptions: salaryTypesModalList }
    };
    setPostJobConfig(updated);
    setIsSalaryTypesModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const handleOpenCurrenciesModal = () => {
    setCurrenciesModalList([...(postJobConfig.step3?.currencyOptions || DEFAULT_POST_JOB_CURRENCIES)]);
    setNewCurrencyCode('');
    setNewCurrencyLabel('');
    setNewCurrencySymbol('');
    setCurrencyError('');
    setIsCurrenciesModalOpen(true);
  };

  const handleAddCurrencyOption = () => {
    const code = newCurrencyCode.trim().toUpperCase();
    const label = newCurrencyLabel.trim();
    const symbol = newCurrencySymbol.trim();
    
    if (!code || !label || !symbol) {
      setCurrencyError('All fields are required');
      return;
    }
    
    if (currenciesModalList.some(item => item.code.toUpperCase() === code)) {
      setCurrencyError('This currency code already exists');
      return;
    }
    
    setCurrenciesModalList(prev => [...prev, { code, label, symbol }]);
    setNewCurrencyCode('');
    setNewCurrencyLabel('');
    setNewCurrencySymbol('');
    setCurrencyError('');
  };

  const handleDeleteCurrencyOption = (idx) => {
    if (currenciesModalList.length <= 1) return;
    setCurrenciesModalList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveCurrenciesModal = async () => {
    const updated = {
      ...postJobConfig,
      step3: { ...postJobConfig.step3, currencyOptions: currenciesModalList }
    };
    setPostJobConfig(updated);
    setIsCurrenciesModalOpen(false);
    await handleSavePostJobConfig(updated);
  };

  const stepsList = [
    { id: 1, stepNumber: 'Step 1', title: postJobConfig.step1?.stepTitle || 'Job Details', icon: Briefcase },
    { id: 2, stepNumber: 'Step 2', title: postJobConfig.step2?.stepTitle || 'Job Description', icon: FileText },
    { id: 3, stepNumber: 'Step 3', title: postJobConfig.step3?.stepTitle || 'Salary & Requirements', icon: DollarSign },
    { id: 4, stepNumber: 'Step 4', title: postJobConfig.step4?.stepTitle || 'Screening Questions', icon: HelpCircle },
    { id: 5, stepNumber: 'Step 5', title: postJobConfig.step5?.stepTitle || 'Final Review', icon: Eye }
  ];

  const step1FieldKeys = [
    { key: 'title', title: 'Job Title' },
    { key: 'employmentType', title: 'Employment Type', hasModal: true, modalBtnText: 'Edit Employment Types', onOpenModal: handleOpenEmpTypesModal },
    { key: 'experience', title: 'Experience', hasModal: true, modalBtnText: 'Edit Experience Ranges', onOpenModal: handleOpenExpRangesModal },
    { key: 'workplaceType', title: 'Workplace Type', hasModal: true, modalBtnText: 'Edit Workplace Types', onOpenModal: handleOpenWorkplaceTypesModal },
    { key: 'openings', title: 'Openings' },
    { key: 'location', title: 'Job Location' }
  ];

  const step2FieldKeys = [
    { key: 'aboutRole', title: 'About Role' },
    { key: 'responsibilities', title: 'Responsibilities' },
    { key: 'skillsRequired', title: 'Skills Required' }
  ];

  const step3FieldKeys = [
    { key: 'category', title: 'Job Category', hasModal: true, modalBtnText: 'Edit Categories', onOpenModal: handleOpenCategoriesModal },
    { key: 'qualification', title: 'Qualification', hasModal: true, modalBtnText: 'Edit Qualifications', onOpenModal: handleOpenQualificationsModal },
    { key: 'stream', title: 'Stream / Major', hasModal: true, modalBtnText: 'Edit Streams', onOpenModal: handleOpenStreamsModal }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-3" />
        <p className="text-xs font-bold text-gray-500">Loading Employer Post a Job Controls...</p>
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

      {/* Header with Save Button (Exact Employee Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-emerald-600" />
            Employer Post a Job Controls
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Customize step headers, labels, placeholders, and toggle mandatory (<span className="text-red-500 font-bold">*</span>) fields across all post job steps.
          </p>
        </div>

        <button
          onClick={() => handleSavePostJobConfig()}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Post a Job Settings</span>
        </button>
      </div>

      {/* Top Sub-Navigation Steps Bar (Exact Employee Style) */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200/80 shadow-xs overflow-x-auto custom-scrollbar">
        {stepsList.map(step => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{step.stepNumber}: {step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Global Page Header & Action Buttons Control Card (Exact Employee Style) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Global Page Header & Navigation Button Texts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Page Title (New Job)</label>
            <input
              type="text"
              value={postJobConfig.header?.title || ''}
              onChange={(e) => handleHeaderChange('title', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Page Subtitle (New Job)</label>
            <input
              type="text"
              value={postJobConfig.header?.subtitle || ''}
              onChange={(e) => handleHeaderChange('subtitle', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Edit Job Page Title</label>
            <input
              type="text"
              value={postJobConfig.header?.editTitle || ''}
              onChange={(e) => handleHeaderChange('editTitle', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">Edit Job Page Subtitle</label>
            <input
              type="text"
              value={postJobConfig.header?.editSubtitle || ''}
              onChange={(e) => handleHeaderChange('editSubtitle', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs pt-2 border-t border-gray-100">
          <div>
            <label className="block font-bold text-gray-700 mb-1">"Continue" Button</label>
            <input
              type="text"
              value={postJobConfig.buttons?.continueBtnText || ''}
              onChange={(e) => handleButtonsChange('continueBtnText', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">"Back" Button</label>
            <input
              type="text"
              value={postJobConfig.buttons?.backBtnText || ''}
              onChange={(e) => handleButtonsChange('backBtnText', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">"Edit" Button (Preview)</label>
            <input
              type="text"
              value={postJobConfig.buttons?.editBtnText || ''}
              onChange={(e) => handleButtonsChange('editBtnText', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">"Publish Job" Button</label>
            <input
              type="text"
              value={postJobConfig.buttons?.publishBtnText || ''}
              onChange={(e) => handleButtonsChange('publishBtnText', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 mb-1">"Update Job" Button</label>
            <input
              type="text"
              value={postJobConfig.buttons?.updateBtnText || ''}
              onChange={(e) => handleButtonsChange('updateBtnText', e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* STEP 1: JOB DETAILS */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          {/* Left 7 Columns */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    Step 1: Job Details Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize labels, placeholders, and toggle required fields for Step 1.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Header Title</label>
                <input
                  type="text"
                  value={postJobConfig.step1?.stepTitle || 'Job Details'}
                  onChange={(e) => setPostJobConfig(prev => ({ ...prev, step1: { ...prev.step1, stepTitle: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-4 pt-2">
                {step1FieldKeys.map(item => {
                  const fieldData = postJobConfig.step1?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                  const isReq = fieldData.isRequired !== false;
                  return (
                    <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                          {item.title}
                          {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                        </span>

                        <div className="flex items-center gap-2">
                          {item.hasModal && (
                            <button
                              type="button"
                              onClick={item.onOpenModal}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{item.modalBtnText}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleStep1Required(item.key)}
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
          </div>

          {/* Right 5 Columns: Step 1 Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Post a Job Preview</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 1: 20% Completed</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                <div className="p-5 border-b border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-gray-900 text-base">{postJobConfig.header?.title || 'POST A NEW JOB'}</h3>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                      20% Completed
                    </span>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                  <div className="border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-gray-800 text-sm">{postJobConfig.step1?.stepTitle || 'Job Details'}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {step1FieldKeys.map(item => {
                      const fData = postJobConfig.step1?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                      const isColSpan2 = item.key === 'title';
                      return (
                        <div key={item.key} className={isColSpan2 ? 'col-span-2 space-y-1' : 'space-y-1'}>
                          <label className="block font-bold text-gray-700 text-[11px]">
                            {fData.label}
                            {fData.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                          </label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px] truncate shadow-2xs">
                            {fData.placeholder || 'Select or enter value...'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 flex justify-end">
                    <div className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md text-center">
                      {postJobConfig.buttons?.continueBtnText || 'Continue'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: JOB DESCRIPTION */}
      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Step 2: Job Description Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize labels and placeholders for About Role, Responsibilities, and Skills.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Header Title</label>
                <input
                  type="text"
                  value={postJobConfig.step2?.stepTitle || 'Job Description'}
                  onChange={(e) => setPostJobConfig(prev => ({ ...prev, step2: { ...prev.step2, stepTitle: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-4 pt-2">
                {step2FieldKeys.map(item => {
                  const fieldData = postJobConfig.step2?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
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
                          onClick={() => handleToggleStep2Required(item.key)}
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

                      <div className="space-y-2 text-xs">
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
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder / Description</label>
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

          {/* Right 5 Columns: Step 2 Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Post a Job Preview</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 2: 40% Completed</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                <div className="p-5 border-b border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-gray-900 text-base">{postJobConfig.header?.title || 'POST A NEW JOB'}</h3>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                      40% Completed
                    </span>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                  <div className="border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-gray-800 text-sm">{postJobConfig.step2?.stepTitle || 'Job Description'}</h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-gray-700 text-[11px] mb-1">
                        {postJobConfig.step2?.fields?.aboutRole?.label || 'About Role'} *
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px] min-h-[50px]">
                        {postJobConfig.step2?.fields?.aboutRole?.placeholder || 'Brief overview of the role, expectations...'}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 text-[11px] mb-1">
                        {postJobConfig.step2?.fields?.responsibilities?.label || 'Responsibilities'} *
                      </label>
                      <div className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px] min-h-[50px]">
                        {postJobConfig.step2?.fields?.responsibilities?.placeholder || 'Key responsibilities, tasks...'}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 text-[11px] mb-1">
                        {postJobConfig.step2?.fields?.skillsRequired?.label || 'Skills Required'} *
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {['React.js', 'Node.js', 'MongoDB'].map(s => (
                          <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">
                      {postJobConfig.buttons?.backBtnText || 'Back'}
                    </button>
                    <button onClick={() => setActiveStep(3)} className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
                      {postJobConfig.buttons?.continueBtnText || 'Continue'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: SALARY & REQUIREMENTS */}
      {activeStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Step 3: Salary & Requirements Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize compensation headers, currency options, categories, and qualifications.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Header Title</label>
                <input
                  type="text"
                  value={postJobConfig.step3?.stepTitle || 'Salary & Requirements'}
                  onChange={(e) => setPostJobConfig(prev => ({ ...prev, step3: { ...prev.step3, stepTitle: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Salary Type Settings Box */}
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-900">Salary Type Header & Disclaimer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={postJobConfig.step3?.sectionTitle || 'Compensation'}
                      onChange={(e) => handleStep3PropChange('sectionTitle', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Disclaimer Note</label>
                    <input
                      type="text"
                      value={postJobConfig.step3?.salaryDisclaimer || 'This salary will be shown to candidates on the job listing.'}
                      onChange={(e) => handleStep3PropChange('salaryDisclaimer', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Currency Label</label>
                    <input
                      type="text"
                      value={postJobConfig.step3?.currencyLabel || 'Currency'}
                      onChange={(e) => handleStep3PropChange('currencyLabel', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Annual Salary Label</label>
                    <input
                      type="text"
                      value={postJobConfig.step3?.yearlySalaryLabel || 'Annual Salary'}
                      onChange={(e) => handleStep3PropChange('yearlySalaryLabel', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Minimum Placeholder</label>
                    <input
                      type="text"
                      value={postJobConfig.step3?.minSalaryPlaceholder || 'write the amount in LPA'}
                      onChange={(e) => handleStep3PropChange('minSalaryPlaceholder', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Maximum Placeholder</label>
                    <input
                      type="text"
                      value={postJobConfig.step3?.maxSalaryPlaceholder || 'write the amount in LPA'}
                      onChange={(e) => handleStep3PropChange('maxSalaryPlaceholder', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 Fields */}
              <div className="space-y-4 pt-2">
                {step3FieldKeys.map(item => {
                  const fieldData = postJobConfig.step3?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                  const isReq = fieldData.isRequired !== false;
                  return (
                    <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                          {item.title}
                          {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                        </span>

                        <div className="flex items-center gap-2">
                          {item.hasModal && (
                            <button
                              type="button"
                              onClick={item.onOpenModal}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{item.modalBtnText}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleStep3Required(item.key)}
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
                            onChange={(e) => handleStep3FieldChange(item.key, 'label', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                          <input
                            type="text"
                            value={fieldData.placeholder || ''}
                            onChange={(e) => handleStep3FieldChange(item.key, 'placeholder', e.target.value)}
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

          {/* Right 5 Columns: Step 3 Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Post a Job Preview</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 3: 60% Completed</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                <div className="p-5 border-b border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-gray-900 text-base">{postJobConfig.header?.title || 'POST A NEW JOB'}</h3>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                      60% Completed
                    </span>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                  <div className="border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-gray-800 text-sm">{postJobConfig.step3?.sectionTitle || 'Compensation'}</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 text-[11px] mb-1">Salary Type</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 text-[11px] font-bold">Yearly</div>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 text-[11px] mb-1">Currency</label>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 text-[11px] font-bold">INR (₹)</div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 text-[11px] mb-1">Annual Salary (Min - Max)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px]">write the amount in LPA</div>
                        <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px]">write the amount in LPA</div>
                      </div>
                    </div>

                    {step3FieldKeys.map(item => {
                      const fData = postJobConfig.step3?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                      return (
                        <div key={item.key} className="space-y-1">
                          <label className="block font-bold text-gray-700 text-[11px]">
                            {fData.label}
                            {fData.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                          </label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px] truncate shadow-2xs">
                            {fData.placeholder || 'Select value...'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">
                      {postJobConfig.buttons?.backBtnText || 'Back'}
                    </button>
                    <button onClick={() => setActiveStep(4)} className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
                      {postJobConfig.buttons?.continueBtnText || 'Continue'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SCREENING QUESTIONS */}
      {activeStep === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    Step 4: Screening Questions Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize screening questions section title, subtitles, and template library.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Header Title</label>
                <input
                  type="text"
                  value={postJobConfig.step4?.stepTitle || 'Screening Questions'}
                  onChange={(e) => setPostJobConfig(prev => ({ ...prev, step4: { ...prev.step4, stepTitle: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Section Heading</label>
                    <input
                      type="text"
                      value={postJobConfig.step4?.heading || 'Applicant Screening Questions'}
                      onChange={(e) => handleStep4PropChange('heading', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">"+ Add Question" Button Text</label>
                    <input
                      type="text"
                      value={postJobConfig.step4?.addBtnText || '+ Add Question'}
                      onChange={(e) => handleStep4PropChange('addBtnText', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={postJobConfig.step4?.subtitle || 'Add optional questions for candidates to answer when applying.'}
                    onChange={(e) => handleStep4PropChange('subtitle', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              {/* Screening Question Templates Box */}
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Screening Question Library</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">Preconfigured templates available for 1-click addition</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenScreeningTemplatesModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Manage Templates</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(postJobConfig.step4?.recommendedTemplates || DEFAULT_POST_JOB_SCREENING_QUESTIONS).map((t, idx) => (
                    <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-gray-800">{t.question}</span>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                        {t.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Step 4 Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Post a Job Preview</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 4: 80% Completed</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                <div className="p-5 border-b border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-gray-900 text-base">{postJobConfig.header?.title || 'POST A NEW JOB'}</h3>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                      80% Completed
                    </span>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{postJobConfig.step4?.heading || 'Applicant Screening Questions'}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg">
                      {postJobConfig.step4?.addBtnText || '+ Add Question'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-800">Question 1</span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">Required</span>
                    </div>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-[11px] font-medium">
                      Do you have a Bachelor's degree or higher?
                    </div>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button onClick={() => setActiveStep(3)} className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">
                      {postJobConfig.buttons?.backBtnText || 'Back'}
                    </button>
                    <button onClick={() => setActiveStep(5)} className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">
                      {postJobConfig.buttons?.continueBtnText || 'Continue'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: PREVIEW & FINAL REVIEW */}
      {activeStep === 5 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    Step 5: Final Review Controls
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Customize preview headers and card titles for the final review step.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Header Title</label>
                <input
                  type="text"
                  value={postJobConfig.step5?.stepTitle || 'Final Review'}
                  onChange={(e) => setPostJobConfig(prev => ({ ...prev, step5: { ...prev.step5, stepTitle: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Preview Main Heading</label>
                  <input
                    type="text"
                    value={postJobConfig.step5?.heading || 'Job Preview'}
                    onChange={(e) => handleStep5PropChange('heading', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Basic Info Section Label</label>
                  <input
                    type="text"
                    value={postJobConfig.step5?.basicInfoLabel || 'Basic Information'}
                    onChange={(e) => handleStep5PropChange('basicInfoLabel', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Requirements Card Label</label>
                  <input
                    type="text"
                    value={postJobConfig.step5?.requirementsLabel || 'Requirements & Info'}
                    onChange={(e) => handleStep5PropChange('requirementsLabel', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">About Role Card Label</label>
                  <input
                    type="text"
                    value={postJobConfig.step5?.aboutRoleLabel || 'About the Role'}
                    onChange={(e) => handleStep5PropChange('aboutRoleLabel', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Step 5 Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Post a Job Preview</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 5: 100% Completed</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                <div className="p-5 border-b border-gray-100 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-black text-gray-900 text-base">{postJobConfig.header?.title || 'POST A NEW JOB'}</h3>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                      100% Completed
                    </span>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                  <div className="border-b border-gray-200 pb-2">
                    <h4 className="font-bold text-gray-800 text-sm">{postJobConfig.step5?.heading || 'Job Preview'}</h4>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                    <h5 className="font-bold text-emerald-700 text-sm">Senior Frontend Engineer</h5>
                    <p className="text-[11px] text-gray-600">Full-time • Remote • Bangalore • 4-6 Yrs • ₹ 12-18 Lacs PA</p>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button onClick={() => setActiveStep(4)} className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">
                      {postJobConfig.buttons?.backBtnText || 'Back'}
                    </button>
                    <div className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md text-center">
                      {postJobConfig.buttons?.publishBtnText || 'Publish Job'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-EDITOR MODALS                                                         */}
      {/* ========================================================================= */}

      {/* 1. EMPLOYMENT TYPES MODAL */}
      {isEmpTypesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Manage Employment Types</h3>
                  <p className="text-xs text-gray-500">Add, edit, or remove employment type options</p>
                </div>
              </div>
              <button onClick={() => setIsEmpTypesModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">Add New Employment Type</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Contract-to-Hire"
                    value={newEmpTypeInput}
                    onChange={(e) => setNewEmpTypeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmpTypeOption(); } }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmpTypeOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {empTypeError && <p className="text-xs text-red-600 font-semibold">{empTypeError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Current Options ({empTypesModalList.length})</span>
                  <button
                    onClick={() => { setEmpTypesModalList([...DEFAULT_POST_JOB_EMPLOYMENT_TYPES]); setEmpTypeError(''); }}
                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </button>
                </div>

                {empTypesModalList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmpTypesModalList(prev => prev.map((it, i) => i === idx ? val : it));
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteEmpTypeOption(idx)}
                      disabled={empTypesModalList.length <= 1}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsEmpTypesModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveEmpTypesModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EXPERIENCE RANGES MODAL */}
      {isExpRangesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Manage Experience Ranges</h3>
                  <p className="text-xs text-gray-500">Add, edit, or remove experience range choices</p>
                </div>
              </div>
              <button onClick={() => setIsExpRangesModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">Add New Experience Range</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 15 - 18 Yrs"
                    value={newExpRangeInput}
                    onChange={(e) => setNewExpRangeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddExpRangeOption(); } }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddExpRangeOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {expRangeError && <p className="text-xs text-red-600 font-semibold">{expRangeError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Current Ranges ({expRangesModalList.length})</span>
                  <button
                    onClick={() => { setExpRangesModalList([...DEFAULT_POST_JOB_EXPERIENCE_OPTIONS]); setExpRangeError(''); }}
                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </button>
                </div>

                {expRangesModalList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExpRangesModalList(prev => prev.map((it, i) => i === idx ? val : it));
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteExpRangeOption(idx)}
                      disabled={expRangesModalList.length <= 1}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsExpRangesModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveExpRangesModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. WORKPLACE TYPES MODAL */}
      {isWorkplaceTypesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Manage Workplace Types</h3>
                  <p className="text-xs text-gray-500">Add, edit, or remove workplace type options</p>
                </div>
              </div>
              <button onClick={() => setIsWorkplaceTypesModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">Add New Workplace Type</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Flexible / Shift Based"
                    value={newWorkplaceTypeInput}
                    onChange={(e) => setNewWorkplaceTypeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWorkplaceTypeOption(); } }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddWorkplaceTypeOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {workplaceTypeError && <p className="text-xs text-red-600 font-semibold">{workplaceTypeError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Current Options ({workplaceTypesModalList.length})</span>
                  <button
                    onClick={() => { setWorkplaceTypesModalList([...DEFAULT_POST_JOB_WORKPLACE_TYPES]); setWorkplaceTypeError(''); }}
                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </button>
                </div>

                {workplaceTypesModalList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkplaceTypesModalList(prev => prev.map((it, i) => i === idx ? val : it));
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkplaceTypeOption(idx)}
                      disabled={workplaceTypesModalList.length <= 1}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsWorkplaceTypesModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveWorkplaceTypesModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. JOB CATEGORIES MODAL */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Manage Job Categories</h3>
                  <p className="text-xs text-gray-500">Total {categoriesModalList.length} categories available in Step 3</p>
                </div>
              </div>
              <button onClick={() => setIsCategoriesModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">Add New Job Category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Biotechnology & Genetics"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategoryOption(); } }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategoryOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {categoryError && <p className="text-xs text-red-600 font-semibold">{categoryError}</p>}
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Filter categories list..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs flex-1"
                />
                <button
                  onClick={() => { setCategoriesModalList([...DEFAULT_POST_JOB_CATEGORIES]); setCategoryError(''); }}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset (65+)
                </button>
              </div>

              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {categoriesModalList
                  .filter(cat => !categorySearchQuery || cat.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                  .map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-800 flex-1">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategoryOption(idx)}
                        disabled={categoriesModalList.length <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsCategoriesModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategoriesModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. QUALIFICATIONS MODAL */}
      {isQualificationsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Manage Qualifications</h3>
                  <p className="text-xs text-gray-500">Total {qualificationsModalList.length} degrees and diplomas available</p>
                </div>
              </div>
              <button onClick={() => setIsQualificationsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">Add New Qualification</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. M.Des (Master of Design)"
                    value={newQualificationInput}
                    onChange={(e) => setNewQualificationInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddQualificationOption(); } }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddQualificationOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {qualificationError && <p className="text-xs text-red-600 font-semibold">{qualificationError}</p>}
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Filter qualifications..."
                  value={qualificationSearchQuery}
                  onChange={(e) => setQualificationSearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs flex-1"
                />
                <button
                  onClick={() => { setQualificationsModalList([...DEFAULT_POST_JOB_QUALIFICATIONS]); setQualificationError(''); }}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset (34+)
                </button>
              </div>

              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {qualificationsModalList
                  .filter(q => !qualificationSearchQuery || q.toLowerCase().includes(qualificationSearchQuery.toLowerCase()))
                  .map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-800 flex-1">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteQualificationOption(idx)}
                        disabled={qualificationsModalList.length <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsQualificationsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveQualificationsModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. STREAMS / MAJORS MODAL */}
      {isStreamsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Manage Streams & Majors</h3>
                  <p className="text-xs text-gray-500">Total {streamsModalList.length} stream specializations available</p>
                </div>
              </div>
              <button onClick={() => setIsStreamsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">Add New Stream / Major</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Mechatronics Engineering"
                    value={newStreamInput}
                    onChange={(e) => setNewStreamInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStreamOption(); } }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddStreamOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {streamError && <p className="text-xs text-red-600 font-semibold">{streamError}</p>}
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  placeholder="Filter streams..."
                  value={streamSearchQuery}
                  onChange={(e) => setStreamSearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs flex-1"
                />
                <button
                  onClick={() => { setStreamsModalList([...DEFAULT_POST_JOB_STREAMS]); setStreamError(''); }}
                  className="text-xs text-emerald-700 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset (48+)
                </button>
              </div>

              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {streamsModalList
                  .filter(st => !streamSearchQuery || st.toLowerCase().includes(streamSearchQuery.toLowerCase()))
                  .map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-gray-800 flex-1">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteStreamOption(idx)}
                        disabled={streamsModalList.length <= 1}
                        className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsStreamsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveStreamsModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SCREENING QUESTION TEMPLATES MODAL */}
      {isScreeningTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Screening Question Templates</h3>
                  <p className="text-xs text-gray-500">Manage preconfigured question library templates</p>
                </div>
              </div>
              <button onClick={() => setIsScreeningTemplatesModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <label className="block text-xs font-bold text-emerald-950">Add New Screening Template</label>
                <input
                  type="text"
                  placeholder="e.g. Do you have experience managing cross-functional teams?"
                  value={newScreeningQuestionText}
                  onChange={(e) => setNewScreeningQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-700">Type:</label>
                    <select
                      value={newScreeningQuestionType}
                      onChange={(e) => setNewScreeningQuestionType(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      <option value="Yes/No">Yes/No</option>
                      <option value="Short Text">Short Text</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddScreeningTemplate}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {screeningTemplateError && <p className="text-xs text-red-600 font-semibold">{screeningTemplateError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Current Library ({screeningTemplatesModalList.length})</span>
                  <button
                    onClick={() => { setScreeningTemplatesModalList([...DEFAULT_POST_JOB_SCREENING_QUESTIONS]); setScreeningTemplateError(''); }}
                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </button>
                </div>

                {screeningTemplatesModalList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start justify-between gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setScreeningTemplatesModalList(prev => prev.map((it, i) => i === idx ? { ...it, question: val } : it));
                        }}
                        className="w-full px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                      />
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-gray-500">Type: <b>{item.type}</b></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteScreeningTemplate(idx)}
                      disabled={screeningTemplatesModalList.length <= 1}
                      className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsScreeningTemplatesModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveScreeningTemplatesModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SALARY TYPES MODAL */}
      {isSalaryTypesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Manage Salary Types</h3>
                  <p className="text-xs text-gray-500">Add, edit, or remove salary payment periods</p>
                </div>
              </div>
              <button onClick={() => setIsSalaryTypesModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">Add New Salary Type</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Weekly, Project Based"
                    value={newSalaryTypeInput}
                    onChange={(e) => setNewSalaryTypeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSalaryTypeOption(); } }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddSalaryTypeOption}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                {salaryTypeError && <p className="text-xs text-red-600 font-semibold">{salaryTypeError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Current Salary Types ({salaryTypesModalList.length})</span>
                  <button
                    onClick={() => { setSalaryTypesModalList([...DEFAULT_POST_JOB_SALARY_TYPES]); setSalaryTypeError(''); }}
                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </button>
                </div>

                {salaryTypesModalList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSalaryTypesModalList(prev => prev.map((it, i) => i === idx ? val : it));
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteSalaryTypeOption(idx)}
                      disabled={salaryTypesModalList.length <= 1}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsSalaryTypesModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveSalaryTypesModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. CURRENCIES MODAL */}
      {isCurrenciesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">Manage Currencies</h3>
                  <p className="text-xs text-gray-500">Add, edit, or remove supported currencies</p>
                </div>
              </div>
              <button onClick={() => setIsCurrenciesModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <label className="block text-xs font-bold text-emerald-950">Add New Currency</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Code (CAD)"
                    value={newCurrencyCode}
                    onChange={(e) => setNewCurrencyCode(e.target.value)}
                    className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Label (CAD ($))"
                    value={newCurrencyLabel}
                    onChange={(e) => setNewCurrencyLabel(e.target.value)}
                    className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Symbol ($)"
                    value={newCurrencySymbol}
                    onChange={(e) => setNewCurrencySymbol(e.target.value)}
                    className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCurrencyOption}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Currency</span>
                  </button>
                </div>
                {currencyError && <p className="text-xs text-red-600 font-semibold">{currencyError}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase">Current Currencies ({currenciesModalList.length})</span>
                  <button
                    onClick={() => { setCurrenciesModalList([...DEFAULT_POST_JOB_CURRENCIES]); setCurrencyError(''); }}
                    className="text-xs text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </button>
                </div>

                {currenciesModalList.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {item.symbol || '$'}
                    </span>
                    <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrenciesModalList(prev => prev.map((c, i) => i === idx ? { ...c, label: val } : c));
                        }}
                        className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-semibold text-gray-900"
                      />
                      <input
                        type="text"
                        value={item.symbol}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrenciesModalList(prev => prev.map((c, i) => i === idx ? { ...c, symbol: val } : c));
                        }}
                        className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-semibold text-gray-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCurrencyOption(idx)}
                      disabled={currenciesModalList.length <= 1}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
              <div className="flex gap-2">
                <button onClick={() => setIsCurrenciesModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button
                  onClick={handleSaveCurrenciesModal}
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
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
