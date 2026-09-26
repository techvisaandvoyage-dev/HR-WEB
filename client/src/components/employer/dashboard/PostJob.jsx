import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MultiSelectLocationDropdown from '../../common/MultiSelectLocationDropdown';
import { currentLocationOptions, preferredLocationOptions } from '../../../data/preferredLocations';
import CustomDropdown from '../../common/CustomDropdown';
import RichTextEditor from '../../common/RichTextEditor';
import JobShareModal from '../../common/JobShareModal';
import { allSkillsOptions, getSuggestedSkills } from '../../../utils/skillsData';

const formatIndianNumber = (numStr) => {
  const digits = String(numStr).replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('en-IN').format(Number(digits));
};

const DEFAULT_CATEGORIES = [
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

const DEFAULT_QUALIFICATIONS = [
  'Any Graduate', 'Any Post Graduate', 'High School (10th)', 'Intermediate (12th)', 'Diploma',
  'ITI', 'Polytechnic', "Bachelor's Degree (Any)", 'B.Tech / B.E.', 'B.Sc', 'B.Com', 'B.A',
  'BBA', 'BCA', 'B.Pharma', 'MBBS', 'BDS', 'LLB', 'B.Ed', 'B.Arch',
  "Master's Degree (Any)", 'M.Tech / M.E.', 'MBA / PGDM', 'MCA', 'M.Sc', 'M.Com', 'M.A',
  'M.Pharma', 'LLM', 'M.Ed', 'MS (Medical)', 'Doctorate (PhD)', 'MD (Doctor of Medicine)', 'Not Required'
];

const DEFAULT_STREAMS = [
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

const PostJob = ({ addJob, updateJob }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingJob = location.state?.jobToEdit;
  const editingJobId = editingJob?._id || editingJob?.id;
  const isEditing = Boolean(editingJobId);

  const [activeStep, setActiveStep] = useState(() => {
    if (isEditing) return 1;
    const savedStep = localStorage.getItem('employer_post_job_step');
    const parsed = parseInt(savedStep, 10);
    return (parsed >= 1 && parsed <= 5) ? parsed : 1;
  });

  const [skillInput, setSkillInput] = useState('');
  const [publishedJob, setPublishedJob] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [skillsList, setSkillsList] = useState(() => {
    if (isEditing) return [];
    try {
      const saved = localStorage.getItem('employer_post_job_skills');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [salaryType, setSalaryType] = useState(() => {
    if (isEditing) return 'Yearly';
    return localStorage.getItem('employer_post_job_salary_type') || 'Yearly';
  });

  const [currency, setCurrency] = useState(() => {
    if (isEditing) return 'INR';
    return localStorage.getItem('employer_post_job_currency') || 'INR';
  });

  const [salaryValues, setSalaryValues] = useState(() => {
    if (isEditing) return {
      Yearly: { min: '', max: '' },
      Monthly: { min: '', max: '' },
      Hourly: { min: '', max: '' }
    };
    try {
      const saved = localStorage.getItem('employer_post_job_salary_values');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      Yearly: { min: '', max: '' },
      Monthly: { min: '', max: '' },
      Hourly: { min: '', max: '' }
    };
  });

  const [jobData, setJobData] = useState(() => {
    if (isEditing) return {
      title: '', employmentType: '', experience: '', openings: '', location: '', workplaceType: '',
      about: '', responsibilities: '', skills: '',
      qualification: '', stream: '', category: '',
      screeningQuestions: []
    };
    try {
      const saved = localStorage.getItem('employer_post_job_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          title: parsed.title || '',
          employmentType: parsed.employmentType || '',
          experience: parsed.experience || '',
          openings: parsed.openings || '',
          location: parsed.location || '',
          workplaceType: parsed.workplaceType || '',
          about: parsed.about || '',
          responsibilities: parsed.responsibilities || '',
          skills: parsed.skills || '',
          qualification: parsed.qualification || '',
          stream: parsed.stream || '',
          category: parsed.category || '',
          screeningQuestions: Array.isArray(parsed.screeningQuestions) ? parsed.screeningQuestions : []
        };
      }
    } catch (e) {}
    return {
      title: '', employmentType: '', experience: '', openings: '', location: '', workplaceType: '',
      about: '', responsibilities: '', skills: '',
      qualification: '', stream: '', category: '',
      screeningQuestions: []
    };
  });

  const [employerDetails, setEmployerDetails] = useState({ companyName: 'My Company', industry: 'Company', companyLogo: '' });
  const [cmsConfig, setCmsConfig] = useState(null);

  // Sync state changes to localStorage when creating a new job
  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('employer_post_job_step', activeStep.toString());
    }
  }, [activeStep, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('employer_post_job_draft', JSON.stringify(jobData));
    }
  }, [jobData, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('employer_post_job_skills', JSON.stringify(skillsList));
    }
  }, [skillsList, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('employer_post_job_salary_type', salaryType);
    }
  }, [salaryType, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('employer_post_job_currency', currency);
    }
  }, [currency, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('employer_post_job_salary_values', JSON.stringify(salaryValues));
    }
  }, [salaryValues, isEditing]);

  // Fetch Homepage CMS Config
  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employerPostJob) {
          setCmsConfig(data.data.employerPostJob);
        }
      } catch (err) {
        console.error("Failed to fetch Post Job CMS config", err);
      }
    };
    fetchCmsConfig();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('employerToken');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setEmployerDetails({
            companyName: data.data.companyName || 'My Company',
            industry: data.data.industry || 'Company',
            companyLogo: data.data.companyLogo || '',
            hiringFor: data.data.hiringFor || 'your_company'
          });
        }
      } catch (err) {
        console.error("Failed to fetch employer profile", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!editingJob) return;

    const details = editingJob.details || {};
    const storedSalary = editingJob.salary || '';
    const detectedSalaryType = details.salaryType
      || (storedSalary.includes('per month') ? 'Monthly' : storedSalary.includes('per hour') ? 'Hourly' : 'Yearly');
    const detectedCurrency = details.currency
      || (storedSalary.includes('$') ? 'USD' : storedSalary.includes('€') ? 'EUR' : storedSalary.includes('£') ? 'GBP' : 'INR');
    const salaryNumbers = storedSalary.match(/[\d,]+/g) || [];
    const min = details.salaryMin || salaryNumbers[0] || '';
    const max = details.salaryMax || salaryNumbers[1] || '';
    const qualifications = editingJob.qualifications || [];

    setJobData({
      title: editingJob.title || details.jobTitle || '',
      employmentType: details.employmentType || editingJob.employmentType || '',
      experience: details.experience || editingJob.experience || '',
      openings: details.openings || editingJob.openings || '',
      location: editingJob.location || details.workLocation || '',
      workplaceType: details.workLocation || editingJob.workplaceType || '',
      about: details.aboutRole || editingJob.aboutRole || details.about || editingJob.about || editingJob.description || '',
      responsibilities: details.responsibilities || editingJob.responsibilities || '',
      skills: details.skillsRequired || editingJob.skills || '',
      qualification: details.qualification || editingJob.qualification || '',
      stream: details.stream || editingJob.stream || '',
      category: details.jobCategory || details.category || editingJob.category || '',
      screeningQuestions: editingJob.screeningQuestions || []
    });
    setSkillsList(qualifications.length > 0
      ? qualifications.map((qualification) => qualification.name).filter(Boolean)
      : (details.skillsRequired || '').split(',').map((skill) => skill.trim()).filter(Boolean));
    setSalaryType(detectedSalaryType);
    setCurrency(detectedCurrency);
    setSalaryValues({
      Yearly: { min: detectedSalaryType === 'Yearly' ? min : '', max: detectedSalaryType === 'Yearly' ? max : '' },
      Monthly: { min: detectedSalaryType === 'Monthly' ? min : '', max: detectedSalaryType === 'Monthly' ? max : '' },
      Hourly: { min: detectedSalaryType === 'Hourly' ? min : '', max: detectedSalaryType === 'Hourly' ? max : '' }
    });
    setActiveStep(1);
  }, [editingJob]);
  
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const clearFieldError = (key) => {
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setValidationError('');
  };

  const getFieldConfig = (stepKey, fieldKey, defaultLabel, defaultPlaceholder, defaultRequired = true) => {
    const stepObj = cmsConfig?.[stepKey];
    const fieldObj = stepObj?.fields?.[fieldKey];
    return {
      label: fieldObj?.label || defaultLabel,
      placeholder: fieldObj?.placeholder || defaultPlaceholder,
      isRequired: fieldObj?.isRequired !== undefined ? fieldObj.isRequired : defaultRequired
    };
  };

  const steps = [
    { id: 1, name: cmsConfig?.step1?.stepTitle || 'Job Details' },
    { id: 2, name: cmsConfig?.step2?.stepTitle || 'Job Description' },
    { id: 3, name: cmsConfig?.step3?.stepTitle || 'Salary & Requirements' },
    { id: 4, name: cmsConfig?.step4?.stepTitle || 'Screening Questions' },
    { id: 5, name: cmsConfig?.step5?.stepTitle || 'Preview' }
  ];

  // Dynamic Options from CMS
  const employmentTypeOptions = useMemo(() => {
    if (cmsConfig?.step1?.employmentTypeOptions && cmsConfig.step1.employmentTypeOptions.length > 0) {
      return cmsConfig.step1.employmentTypeOptions.map(opt => 
        typeof opt === 'string' ? { value: opt, label: opt } : { value: opt.value || opt.label, label: opt.label || opt.value }
      );
    }
    return [
      { value: "Full-time", label: "Full-time" },
      { value: "Part-time", label: "Part-time" },
      { value: "Contract", label: "Contract" },
      { value: "Internship", label: "Internship" },
      { value: "Freelance", label: "Freelance" }
    ];
  }, [cmsConfig]);

  const experienceOptions = useMemo(() => {
    if (cmsConfig?.step1?.experienceOptions && cmsConfig.step1.experienceOptions.length > 0) {
      return cmsConfig.step1.experienceOptions.map(opt => 
        typeof opt === 'string' ? { value: opt, label: opt } : { value: opt.value || opt.label, label: opt.label || opt.value }
      );
    }
    return [
      { value: '0 - 1 Yrs', label: '0 - 1 Yrs (Fresher)' },
      { value: '2 - 3 Yrs', label: '2 - 3 Yrs' },
      { value: '4 - 6 Yrs', label: '4 - 6 Yrs' },
      { value: '7 - 10 Yrs', label: '7 - 10 Yrs' },
      { value: '11 - 15 Yrs', label: '11 - 15 Yrs' },
      { value: '16 - 20 Yrs', label: '16 - 20 Yrs' },
      { value: '21 - 25 Yrs', label: '21 - 25 Yrs' },
      { value: '25+ yrs', label: '25+ yrs' }
    ];
  }, [cmsConfig]);

  const workplaceTypeOptions = useMemo(() => {
    if (cmsConfig?.step1?.workplaceTypeOptions && cmsConfig.step1.workplaceTypeOptions.length > 0) {
      return cmsConfig.step1.workplaceTypeOptions.map(opt => 
        typeof opt === 'string' ? { value: opt, label: opt } : { value: opt.value || opt.label, label: opt.label || opt.value }
      );
    }
    return [
      { value: "On-site", label: "On-site" },
      { value: "Hybrid", label: "Hybrid" },
      { value: "Remote", label: "Remote" }
    ];
  }, [cmsConfig]);

  const salaryTypeOptions = useMemo(() => {
    if (cmsConfig?.step3?.salaryTypeOptions && cmsConfig.step3.salaryTypeOptions.length > 0) {
      return cmsConfig.step3.salaryTypeOptions;
    }
    return ['Yearly', 'Monthly', 'Hourly'];
  }, [cmsConfig]);

  const currencyOptions = useMemo(() => {
    return [
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
  }, []);

  const categoryOptions = useMemo(() => {
    const list = (cmsConfig?.step3?.categoryOptions && cmsConfig.step3.categoryOptions.length > 0)
      ? cmsConfig.step3.categoryOptions
      : DEFAULT_CATEGORIES;
    return list.map(c => ({ value: typeof c === 'string' ? c : c.label, label: typeof c === 'string' ? c : c.label }));
  }, [cmsConfig]);

  const qualificationOptions = useMemo(() => {
    const list = (cmsConfig?.step3?.qualificationOptions && cmsConfig.step3.qualificationOptions.length > 0)
      ? cmsConfig.step3.qualificationOptions
      : DEFAULT_QUALIFICATIONS;
    return list.map(q => ({ value: typeof q === 'string' ? q : q.label, label: typeof q === 'string' ? q : q.label }));
  }, [cmsConfig]);

  const streamOptions = useMemo(() => {
    const list = (cmsConfig?.step3?.streamOptions && cmsConfig.step3.streamOptions.length > 0)
      ? cmsConfig.step3.streamOptions
      : DEFAULT_STREAMS;
    return list.map(s => ({ value: typeof s === 'string' ? s : s.label, label: typeof s === 'string' ? s : s.label }));
  }, [cmsConfig]);

  const allSkillsList = useMemo(() => {
    if (Array.isArray(cmsConfig?.step2?.skillsOptions) && cmsConfig.step2.skillsOptions.length > 0) {
      return cmsConfig.step2.skillsOptions.map(s => 
        typeof s === 'string' ? { value: s, label: s } : { value: s.value || s.label, label: s.label || s.value }
      );
    }
    return allSkillsOptions;
  }, [cmsConfig]);

  const validateStep = (stepNumber) => {
    const errors = {};

    if (stepNumber === 1) {
      const titleCfg = getFieldConfig('step1', 'title', 'Job Title', '', true);
      if (titleCfg.isRequired && !jobData.title?.trim()) {
        errors.title = `Please enter ${titleCfg.label}.`;
      }
      const empCfg = getFieldConfig('step1', 'employmentType', 'Employment Type', '', true);
      if (empCfg.isRequired && !jobData.employmentType) {
        errors.employmentType = `Please select ${empCfg.label}.`;
      }
      const expCfg = getFieldConfig('step1', 'experience', 'Experience', '', true);
      if (expCfg.isRequired && !jobData.experience) {
        errors.experience = `Please select ${expCfg.label}.`;
      }
      const workCfg = getFieldConfig('step1', 'workplaceType', 'Workplace Type', '', true);
      if (workCfg.isRequired && !jobData.workplaceType) {
        errors.workplaceType = `Please select ${workCfg.label}.`;
      }
      const openingsCfg = getFieldConfig('step1', 'openings', 'Openings', '', false);
      if (openingsCfg.isRequired && (!jobData.openings || jobData.openings.toString().trim() === '')) {
        errors.openings = `Please enter ${openingsCfg.label}.`;
      }
      const locCfg = getFieldConfig('step1', 'location', 'Job Location', '', true);
      const hasLocation = Array.isArray(jobData.location) ? jobData.location.length > 0 : !!jobData.location?.toString().trim();
      if (locCfg.isRequired && !hasLocation) {
        errors.location = `Please select ${locCfg.label}.`;
      }
    }

    if (stepNumber === 2) {
      const aboutCfg = getFieldConfig('step2', 'aboutRole', 'About Role', '', true);
      const plainAbout = (jobData.about || '').replace(/<[^>]*>/g, '').trim();
      if (aboutCfg.isRequired && !plainAbout) {
        errors.about = `Please enter ${aboutCfg.label}.`;
      }
      const respCfg = getFieldConfig('step2', 'responsibilities', 'Responsibilities', '', true);
      const plainResp = (jobData.responsibilities || '').replace(/<[^>]*>/g, '').trim();
      if (respCfg.isRequired && !plainResp) {
        errors.responsibilities = `Please enter ${respCfg.label}.`;
      }
      const skillsCfg = getFieldConfig('step2', 'skillsRequired', 'Skills Required', '', true);
      if (skillsCfg.isRequired && (!skillsList || skillsList.length === 0)) {
        errors.skills = `Please add at least one skill for ${skillsCfg.label}.`;
      }
    }

    if (stepNumber === 3) {
      const catCfg = getFieldConfig('step3', 'category', 'Job Category', '', true);
      if (catCfg.isRequired && !jobData.category) {
        errors.category = `Please select ${catCfg.label}.`;
      }
      const qualCfg = getFieldConfig('step3', 'qualification', 'Qualification', '', true);
      if (qualCfg.isRequired && !jobData.qualification) {
        errors.qualification = `Please select ${qualCfg.label}.`;
      }
      const streamCfg = getFieldConfig('step3', 'stream', 'Stream / Major', '', false);
      if (streamCfg.isRequired && !jobData.stream) {
        errors.stream = `Please select ${streamCfg.label}.`;
      }
    }

    if (stepNumber === 4) {
      if (jobData.screeningQuestions && jobData.screeningQuestions.length > 5) {
        errors.screeningQuestions = 'Maximum 5 screening questions allowed.';
      }
      if (jobData.screeningQuestions && jobData.screeningQuestions.length > 0) {
        for (let i = 0; i < jobData.screeningQuestions.length; i++) {
          const sq = jobData.screeningQuestions[i];
          if (!sq.question?.trim()) {
            errors[`screening_${i}`] = `Please enter question text for Question ${i + 1}.`;
          }
        }
      }
    }

    return errors;
  };

  const handleNext = () => {
    const errs = validateStep(activeStep);
    const keys = Object.keys(errs);
    if (keys.length > 0) {
      setFieldErrors(errs);
      setValidationError(errs[keys[0]]);
      return;
    }
    setFieldErrors({});
    setValidationError('');
    setActiveStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setFieldErrors({});
    setValidationError('');
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (targetStep) => {
    if (targetStep < activeStep) {
      setFieldErrors({});
      setValidationError('');
      setActiveStep(targetStep);
    } else if (targetStep > activeStep) {
      for (let s = activeStep; s < targetStep; s++) {
        const errs = validateStep(s);
        const keys = Object.keys(errs);
        if (keys.length > 0) {
          setFieldErrors(errs);
          setValidationError(errs[keys[0]]);
          setActiveStep(s);
          return;
        }
      }
      setFieldErrors({});
      setValidationError('');
      setActiveStep(targetStep);
    }
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skillsList.includes(skillInput.trim())) {
        setSkillsList([...skillsList, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const getCurrencySymbol = (code) => {
    const found = currencyOptions.find(c => c.code === code);
    if (found && found.symbol) return found.symbol;
    switch(code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': default: return '₹';
    }
  };
  const cSym = getCurrencySymbol(currency);

  const titleConfig = getFieldConfig('step1', 'title', 'Job Title', 'e.g. Frontend Developer', true);
  const empTypeConfig = getFieldConfig('step1', 'employmentType', 'Employment Type', 'Select employment type', true);
  const expConfig = getFieldConfig('step1', 'experience', 'Experience', 'Select experience', true);
  const workplaceConfig = getFieldConfig('step1', 'workplaceType', 'Workplace Type', 'Select type', true);
  const openingsConfig = getFieldConfig('step1', 'openings', 'Openings', 'Number of openings', false);
  const locationConfig = getFieldConfig('step1', 'location', 'Job Location', 'Select Job Locations', true);

  const aboutConfig = getFieldConfig('step2', 'aboutRole', 'About Role', 'Brief overview of the role, team, and expectations...', true);
  const respConfig = getFieldConfig('step2', 'responsibilities', 'Responsibilities', 'Key responsibilities, day-to-day tasks, bullet points, deliverables...', true);
  const skillsConfig = getFieldConfig('step2', 'skillsRequired', 'Skills Required', 'Search or select a skill to add...', true);

  const categoryConfig = getFieldConfig('step3', 'category', 'Job Category', 'Select a job category...', true);
  const qualConfig = getFieldConfig('step3', 'qualification', 'Qualification', 'Select qualification...', true);
  const streamConfig = getFieldConfig('step3', 'stream', 'Stream / Major', 'Select stream / major...', false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-bold text-[#147a2e] tracking-tight uppercase">
            {isEditing ? (cmsConfig?.header?.editTitle || 'Edit Job') : (cmsConfig?.header?.title || 'POST A NEW JOB')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEditing ? (cmsConfig?.header?.editSubtitle || 'Update the details of your job posting.') : (cmsConfig?.header?.subtitle || 'Fill in the details to create a new job posting.')}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row min-h-[600px] relative">
        
        {/* Left Column - Steps */}
        <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-8 shrink-0 rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl">
          <div className="space-y-8">
            {steps.map((step) => {
              const isActive = activeStep === step.id;
              const isPast = activeStep > step.id;
              return (
                <div key={step.id} className="flex items-center gap-4 cursor-pointer" onClick={() => handleStepClick(step.id)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    isActive ? 'bg-green-100 text-[#29953f] border border-[#29953f]' :
                    isPast ? 'bg-[#29953f] text-white' : 'bg-white border border-gray-200 text-gray-400'
                  }`}>
                    {isPast ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`font-bold text-sm ${isActive ? 'text-[#29953f]' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex-1 min-w-0 p-8 md:p-10 flex flex-col rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl">

          {/* Step 1: Job Details */}
          {activeStep === 1 && (
            <div className="flex-1 min-w-0 space-y-6 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {titleConfig.label}
                  {titleConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
                <input 
                  type="text" 
                  placeholder={titleConfig.placeholder} 
                  value={jobData.title}
                  onChange={(e) => {
                    setJobData({...jobData, title: e.target.value});
                    clearFieldError('title');
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors outline-none ${
                    fieldErrors.title
                      ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                      : 'border-gray-200 focus:border-[#29953f]'
                  }`}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {empTypeConfig.label}
                    {empTypeConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <CustomDropdown
                    options={employmentTypeOptions}
                    value={jobData.employmentType}
                    error={!!fieldErrors.employmentType}
                    onChange={(val) => {
                      setJobData({...jobData, employmentType: val});
                      clearFieldError('employmentType');
                    }}
                    placeholder={empTypeConfig.placeholder}
                  />
                  {fieldErrors.employmentType && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.employmentType}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {expConfig.label}
                    {expConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <CustomDropdown
                    options={experienceOptions}
                    value={jobData.experience}
                    error={!!fieldErrors.experience}
                    onChange={(val) => {
                      setJobData({...jobData, experience: val});
                      clearFieldError('experience');
                    }}
                    placeholder={expConfig.placeholder}
                  />
                  {fieldErrors.experience && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.experience}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {workplaceConfig.label}
                    {workplaceConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <CustomDropdown
                    options={workplaceTypeOptions}
                    value={jobData.workplaceType}
                    error={!!fieldErrors.workplaceType}
                    onChange={(val) => {
                      setJobData({...jobData, workplaceType: val});
                      clearFieldError('workplaceType');
                    }}
                    placeholder={workplaceConfig.placeholder}
                  />
                  {fieldErrors.workplaceType && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.workplaceType}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {openingsConfig.label}
                    {openingsConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <input 
                    type="number" 
                    placeholder={openingsConfig.placeholder} 
                    value={jobData.openings}
                    onChange={(e) => {
                      setJobData({...jobData, openings: e.target.value.replace(/\D/g, '')});
                      clearFieldError('openings');
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors outline-none ${
                      fieldErrors.openings
                        ? 'border-red-500 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                        : 'border-gray-200 focus:border-[#29953f]'
                    }`}
                  />
                  {fieldErrors.openings && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.openings}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {locationConfig.label}
                    {locationConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <MultiSelectLocationDropdown 
                    options={preferredLocationOptions}
                    value={jobData.location}
                    onChange={(val) => {
                      setJobData({...jobData, location: val});
                      clearFieldError('location');
                    }}
                    multiple={true}
                    placeholder={locationConfig.placeholder}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors ${
                      fieldErrors.location
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-gray-200 focus:border-[#29953f]'
                    }`}
                  />
                  {fieldErrors.location && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Job Description */}
          {activeStep === 2 && (
            <div className="flex-1 min-w-0 space-y-6 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {aboutConfig.label}
                  {aboutConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
                <div className={fieldErrors.about ? 'border border-red-500 rounded-lg overflow-hidden' : ''}>
                  <RichTextEditor 
                    placeholder={aboutConfig.placeholder} 
                    value={jobData.about}
                    onChange={(val) => {
                      setJobData({...jobData, about: val});
                      clearFieldError('about');
                    }}
                    minHeight="140px"
                  />
                </div>
                {fieldErrors.about && (
                  <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.about}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {respConfig.label}
                  {respConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
                <div className={fieldErrors.responsibilities ? 'border border-red-500 rounded-lg overflow-hidden' : ''}>
                  <RichTextEditor 
                    placeholder={respConfig.placeholder} 
                    value={jobData.responsibilities}
                    onChange={(val) => {
                      setJobData({...jobData, responsibilities: val});
                      clearFieldError('responsibilities');
                    }}
                    minHeight="200px"
                  />
                </div>
                {fieldErrors.responsibilities && (
                  <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.responsibilities}
                  </p>
                )}
              </div>
              <div className="pb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {skillsConfig.label}
                  {skillsConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
                {skillsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skillsList.map((skill, index) => (
                      <span
                        key={index}
                        onClick={() => removeSkill(skill)}
                        title="Click to remove"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-[#1b732d] border border-green-200/80 rounded-lg text-xs font-semibold cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-2xs group"
                      >
                        <span>{skill}</span>
                        <span className="text-[11px] text-green-600 group-hover:text-red-500 transition-colors ml-0.5">✕</span>
                      </span>
                    ))}
                  </div>
                )}
                <CustomDropdown
                  options={allSkillsList.filter(opt => {
                    const optVal = typeof opt === 'object' ? (opt.value || opt.label) : opt;
                    return !skillsList.includes(optVal);
                  })}
                  value=""
                  error={!!fieldErrors.skills}
                  onChange={(val) => {
                    if (val && !skillsList.includes(val)) {
                      setSkillsList([...skillsList, val]);
                      clearFieldError('skills');
                    }
                  }}
                  placeholder={skillsConfig.placeholder}
                />
                {fieldErrors.skills && (
                  <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.skills}
                  </p>
                )}
                {(() => {
                  const suggested = getSuggestedSkills(skillsList).filter(s => !skillsList.includes(s));
                  if (suggested.length === 0) return null;
                  return (
                    <div className="mt-4">
                      <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-wide mb-2">
                        {cmsConfig?.step2?.fields?.skillsRequired?.suggestedHeading || 'Suggested based on your selection'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggested.map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (!skillsList.includes(suggestion)) {
                                setSkillsList([...skillsList, suggestion]);
                                clearFieldError('skills');
                              }
                            }}
                            className="px-3 py-1.5 bg-white text-gray-600 rounded-lg text-xs font-semibold border border-gray-200 hover:border-[#29953f] hover:text-[#29953f] hover:bg-green-50 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <span>{suggestion}</span> <span className="text-sm font-bold text-gray-400 group-hover:text-[#29953f]">+</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Step 3: Salary & Requirements */}
          {activeStep === 3 && (
            <div className="flex-1 min-w-0 space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                    {cmsConfig?.step3?.sectionTitle || 'Compensation'}
                  </h3>
                  
                  <div className="mb-6 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {cmsConfig?.step3?.salaryTypeLabel || 'Salary Type'}
                      </label>
                      <div className="relative w-full">
                        <select 
                          value={salaryType}
                          onChange={(e) => setSalaryType(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all appearance-none bg-white cursor-pointer"
                        >
                          {salaryTypeOptions.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {cmsConfig?.step3?.currencyLabel || 'Currency'}
                      </label>
                      <div className="relative w-full">
                        <select 
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all appearance-none bg-white cursor-pointer"
                        >
                          {currencyOptions.map((c) => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" key={salaryType}>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      {salaryType === 'Yearly' ? (cmsConfig?.step3?.yearlySalaryLabel || 'Annual Salary') : salaryType === 'Monthly' ? (cmsConfig?.step3?.monthlySalaryLabel || 'Monthly Salary') : (cmsConfig?.step3?.hourlyRateLabel || 'Hourly Rate')}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input 
                          type="text" 
                          placeholder={salaryType === 'Yearly' ? (cmsConfig?.step3?.minSalaryPlaceholder || 'write the amount in LPA') : salaryType === 'Monthly' ? `${cSym}40,000` : `${cSym}300`}
                          value={salaryValues[salaryType].min}
                          onChange={(e) => setSalaryValues({...salaryValues, [salaryType]: {...salaryValues[salaryType], min: formatIndianNumber(e.target.value)}})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5 ml-1 font-semibold uppercase tracking-wide">
                          {cmsConfig?.step3?.minLabel || 'Minimum'}
                        </p>
                      </div>
                      <div>
                        <input 
                          type="text" 
                          placeholder={salaryType === 'Yearly' ? (cmsConfig?.step3?.maxSalaryPlaceholder || 'write the amount in LPA') : salaryType === 'Monthly' ? `${cSym}60,000` : `${cSym}600`}
                          value={salaryValues[salaryType].max}
                          onChange={(e) => setSalaryValues({...salaryValues, [salaryType]: {...salaryValues[salaryType], max: formatIndianNumber(e.target.value)}})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5 ml-1 font-semibold uppercase tracking-wide">
                          {cmsConfig?.step3?.maxLabel || 'Maximum'}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-3 font-medium flex items-center gap-1.5 bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      {cmsConfig?.step3?.salaryDisclaimer || 'This salary will be shown to candidates on the job listing.'}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {categoryConfig.label}
                    {categoryConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <CustomDropdown
                    options={categoryOptions}
                    value={jobData.category}
                    error={!!fieldErrors.category}
                    onChange={(val) => {
                      setJobData({...jobData, category: val});
                      clearFieldError('category');
                    }}
                    placeholder={categoryConfig.placeholder}
                  />
                  {fieldErrors.category && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.category}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {qualConfig.label}
                    {qualConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <CustomDropdown
                    options={qualificationOptions}
                    value={jobData.qualification}
                    error={!!fieldErrors.qualification}
                    onChange={(val) => {
                      setJobData({...jobData, qualification: val});
                      clearFieldError('qualification');
                    }}
                    placeholder={qualConfig.placeholder}
                  />
                  {fieldErrors.qualification && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.qualification}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {streamConfig.label}
                    {streamConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <CustomDropdown
                    options={streamOptions}
                    value={jobData.stream}
                    error={!!fieldErrors.stream}
                    onChange={(val) => {
                      setJobData({...jobData, stream: val});
                      clearFieldError('stream');
                    }}
                    placeholder={streamConfig.placeholder}
                  />
                  {fieldErrors.stream && (
                    <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.stream}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Screening Questions */}
          {activeStep === 4 && (
            <div className="flex-1 min-w-0 space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {cmsConfig?.step4?.heading || 'Applicant Screening Questions'}
                    </h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      jobData.screeningQuestions.length >= 5
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {jobData.screeningQuestions.length}/5 added
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {cmsConfig?.step4?.subtitle || 'Add optional questions for candidates to answer when applying (Maximum 5 questions).'}
                  </p>
                </div>
                <button 
                  type="button"
                  disabled={jobData.screeningQuestions.length >= 5}
                  onClick={() => {
                    if (jobData.screeningQuestions.length < 5) {
                      setJobData({
                        ...jobData, 
                        screeningQuestions: [...jobData.screeningQuestions, { question: '', type: 'Yes/No', required: true }]
                      });
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                    jobData.screeningQuestions.length >= 5
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                      : 'bg-green-50 text-[#29953f] hover:bg-green-100'
                  }`}
                >
                  {jobData.screeningQuestions.length >= 5 ? 'Max 5 Limit Reached' : (cmsConfig?.step4?.addBtnText || '+ Add Question')}
                </button>
              </div>

              {/* Recommended Question Templates Quick Add */}
              {cmsConfig?.step4?.recommendedTemplates && cmsConfig.step4.recommendedTemplates.length > 0 && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                      Recommended Questions (Click to add):
                    </span>
                    {jobData.screeningQuestions.length >= 5 && (
                      <span className="text-[11px] font-bold text-amber-700">
                        ⚠️ Maximum 5 questions limit reached
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cmsConfig.step4.recommendedTemplates.map((template, tIdx) => {
                      const isAlreadyAdded = jobData.screeningQuestions.some(q => q.question.toLowerCase() === template.question.toLowerCase());
                      const isMaxReached = jobData.screeningQuestions.length >= 5 && !isAlreadyAdded;
                      return (
                        <button
                          key={tIdx}
                          type="button"
                          disabled={isAlreadyAdded || isMaxReached}
                          onClick={() => {
                            if (!isAlreadyAdded && jobData.screeningQuestions.length < 5) {
                              setJobData({
                                ...jobData, 
                                screeningQuestions: [...jobData.screeningQuestions, { question: template.question, type: template.type || 'Yes/No', required: template.required !== false }]
                              });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isAlreadyAdded
                              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                              : isMaxReached
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50'
                                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white shadow-2xs cursor-pointer'
                          }`}
                        >
                          <span>{isAlreadyAdded ? '✓ Added' : '+'}</span>
                          <span>{template.question}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {jobData.screeningQuestions.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <p className="text-gray-500 font-medium">
                    {cmsConfig?.step4?.emptyTitle || 'No screening questions added yet.'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {cmsConfig?.step4?.emptySubtitle || 'Add questions to pre-screen applicants (e.g., "Do you have a Bachelor\'s degree?").'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobData.screeningQuestions.map((q, index) => (
                    <div key={index} className="p-5 border border-gray-200 rounded-xl bg-white space-y-4 relative group">
                      <button 
                        onClick={() => {
                          const newQs = [...jobData.screeningQuestions];
                          newQs.splice(index, 1);
                          setJobData({...jobData, screeningQuestions: newQs});
                          clearFieldError(`screening_${index}`);
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove Question"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          {(cmsConfig?.step4?.questionLabelPrefix || 'Question')} {index + 1}
                        </label>
                        <input 
                          type="text" 
                          placeholder={cmsConfig?.step4?.questionPlaceholder || 'e.g., How many years of React experience do you have?'} 
                          value={q.question}
                          onChange={(e) => {
                            const newQs = [...jobData.screeningQuestions];
                            newQs[index].question = e.target.value;
                            setJobData({...jobData, screeningQuestions: newQs});
                            clearFieldError(`screening_${index}`);
                          }}
                          className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors pr-10 ${
                            fieldErrors[`screening_${index}`]
                              ? 'border-red-500 bg-red-50/20 focus:border-red-500'
                              : 'border-gray-200 focus:border-[#29953f]'
                          }`}
                        />
                        {fieldErrors[`screening_${index}`] && (
                          <p className="text-xs text-red-500 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {fieldErrors[`screening_${index}`]}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            {cmsConfig?.step4?.responseTypeLabel || 'Response Type'}
                          </label>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const newQs = [...jobData.screeningQuestions];
                              newQs[index].type = e.target.value;
                              setJobData({...jobData, screeningQuestions: newQs});
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors bg-white cursor-pointer"
                          >
                            {(cmsConfig?.step4?.responseTypeOptions || ['Yes/No', 'Short Text']).map((rt) => (
                              <option key={rt} value={rt}>{rt}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={q.required}
                              onChange={(e) => {
                                const newQs = [...jobData.screeningQuestions];
                                newQs[index].required = e.target.checked;
                                setJobData({...jobData, screeningQuestions: newQs});
                              }}
                              className="w-4 h-4 text-[#29953f] rounded border-gray-300 focus:ring-[#29953f] accent-[#29953f]"
                            />
                            <span className="text-sm font-bold text-gray-700">
                              {cmsConfig?.step4?.requiredLabel || 'Required'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Preview */}
          {activeStep === 5 && (
            <div className="flex-1 min-w-0 space-y-6 animate-in fade-in">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4 flex-wrap gap-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {cmsConfig?.step5?.heading || 'Job Preview'}
                  </h3>
                  {employerDetails.hiringFor === 'consultant' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
                      <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                      Posting as Consultant
                    </span>
                  )}
                </div>
                
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-2xl font-bold text-[#147a2e]">{jobData.title || 'Untitled Job'}</h4>
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600 font-medium">
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> {jobData.employmentType || 'Not specified'}</span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> {jobData.workplaceType || 'Not specified'}</span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {jobData.location || 'Not specified'}</span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg> {jobData.experience || 'Not specified'}</span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {salaryValues[salaryType].min && salaryValues[salaryType].max ? (salaryType === 'Yearly' ? `${cSym} ${salaryValues[salaryType].min}-${salaryValues[salaryType].max} PA` : `${cSym}${salaryValues[salaryType].min} - ${cSym}${salaryValues[salaryType].max} ${salaryType === 'Monthly' ? 'PM' : 'PH'}`) : 'Salary not specified'}</span>
                    </div>
                  </div>

                  {/* Requirements & Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                        {cmsConfig?.step3?.fields?.qualification?.label || 'Qualification'}
                      </span>
                      <span className="font-semibold text-gray-900">{jobData.qualification || 'Not specified'}</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                        {cmsConfig?.step3?.fields?.stream?.label || 'Stream / Major'}
                      </span>
                      <span className="font-semibold text-gray-900">{jobData.stream || 'Not specified'}</span>
                    </div>
                  </div>

                  {/* About */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-2">
                      {cmsConfig?.step5?.aboutRoleLabel || 'About the Role'}
                    </h5>
                    {jobData.about ? (
                      <div 
                        className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                        dangerouslySetInnerHTML={{ __html: jobData.about }}
                      />
                    ) : (
                      <p className="text-sm text-gray-400">
                        {cmsConfig?.step5?.noDescriptionText || 'No description provided.'}
                      </p>
                    )}
                  </div>

                  {/* Responsibilities */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-2">
                      {cmsConfig?.step5?.responsibilitiesLabel || 'Key Responsibilities'}
                    </h5>
                    {jobData.responsibilities ? (
                      <div 
                        className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                        dangerouslySetInnerHTML={{ __html: jobData.responsibilities }}
                      />
                    ) : (
                      <p className="text-sm text-gray-400">
                        {cmsConfig?.step5?.noResponsibilitiesText || 'No responsibilities listed.'}
                      </p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-3">
                      {cmsConfig?.step5?.skillsLabel || 'Skills Required'}
                    </h5>
                    {skillsList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillsList.map((skill, index) => (
                          <span key={index} className="px-3 py-1.5 bg-green-50 text-[#29953f] border border-green-100 rounded-md text-xs font-bold">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {cmsConfig?.step5?.noSkillsText || 'No specific skills requested.'}
                      </span>
                    )}
                  </div>

                  {/* Screening Questions Preview */}
                  {jobData.screeningQuestions && jobData.screeningQuestions.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h5 className="text-sm font-bold text-gray-900 mb-3">
                        {cmsConfig?.step5?.screeningQuestionsLabel || 'Screening Questions'} ({jobData.screeningQuestions.length})
                      </h5>
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {jobData.screeningQuestions.map((q, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{q.question || 'Empty Question'}</span> 
                            <span className="text-xs text-gray-400 ml-2">({q.type}{q.required ? ', Required' : ', Optional'})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
            {activeStep > 1 ? (
              <button onClick={handleBack} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer">
                {cmsConfig?.buttons?.backBtnText || 'Back'}
              </button>
            ) : <div></div>}
            
            <div className="flex gap-4">
              {activeStep === 5 && (
                <button onClick={() => setActiveStep(1)} className="px-6 py-2.5 text-sm font-bold text-[#29953f] bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer">
                  {cmsConfig?.buttons?.editBtnText || 'Edit'}
                </button>
              )}
              <button 
                onClick={activeStep === 5 ? async () => {
                  for (let s = 1; s <= 4; s++) {
                    const err = validateStep(s);
                    const keys = Object.keys(err);
                    if (keys.length > 0) {
                      setValidationError(err[keys[0]]);
                      setActiveStep(s);
                      return;
                    }
                  }

                  const jobPayload = {
                    company: employerDetails.companyName || 'Company',
                    companyInitial: (employerDetails.companyName || 'C').charAt(0).toUpperCase(),
                    companyLogo: employerDetails.companyLogo || '',
                    title: jobData.title || 'Untitled Job',
                    location: jobData.location || 'Not specified',
                    salary: salaryValues[salaryType].min && salaryValues[salaryType].max ? (salaryType === 'Yearly' ? `${cSym} ${salaryValues[salaryType].min}-${salaryValues[salaryType].max} PA` : `${cSym}${salaryValues[salaryType].min} - ${cSym}${salaryValues[salaryType].max} ${salaryType === 'Monthly' ? 'PM' : 'PH'}`) : 'Not specified',
                    employerProvided: true,
                    easyApply: true,
                    qualifications: skillsList.map(s => ({ name: s, met: true })),
                    screeningQuestions: jobData.screeningQuestions,
                    aboutRole: jobData.about || "",
                    responsibilities: jobData.responsibilities || "",
                    details: {
                      workLocation: jobData.workplaceType || "On-site",
                      jobTitle: jobData.title || 'Untitled Job',
                      employmentType: jobData.employmentType || "Full-Time",
                      experience: jobData.experience || "Not specified",
                      aboutRole: jobData.about || "",
                      responsibilities: jobData.responsibilities || "",
                      qualification: jobData.qualification || "",
                      stream: jobData.stream || "",
                      category: jobData.category || "General",
                      jobCategory: jobData.category || "General",
                      industry: employerDetails.industry,
                      skillsRequired: skillsList.join(', '),
                      salaryType,
                      currency,
                      salaryMin: salaryValues[salaryType].min,
                      salaryMax: salaryValues[salaryType].max,
                      openings: jobData.openings || ''
                    }
                  };
                  
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/jobs${isEditing ? `/${editingJobId}` : ''}`, {
                      method: isEditing ? 'PUT' : 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('employerToken')}`
                      },
                      body: JSON.stringify(jobPayload)
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                      if (isEditing) {
                        if (updateJob) updateJob(data.data);
                        alert("Job Updated Successfully!");
                        navigate('/employer/manage-jobs');
                      } else {
                        if (addJob) addJob(data.data);
                        localStorage.removeItem('employer_post_job_step');
                        localStorage.removeItem('employer_post_job_draft');
                        localStorage.removeItem('employer_post_job_skills');
                        localStorage.removeItem('employer_post_job_salary_type');
                        localStorage.removeItem('employer_post_job_currency');
                        localStorage.removeItem('employer_post_job_salary_values');
                        setPublishedJob(data.data);
                        setShowShareModal(true);
                      }
                    } else {
                      alert("Error: " + data.message);
                    }
                  } catch (e) {
                    console.error(e);
                    alert(isEditing ? "Error updating job" : "Error publishing job");
                  }
                } : handleNext}
                className="px-8 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {activeStep === 5 ? (isEditing ? (cmsConfig?.buttons?.updateBtnText || 'Update Job') : (cmsConfig?.buttons?.publishBtnText || 'Publish Job')) : (cmsConfig?.buttons?.continueBtnText || 'Continue')}
              </button>
            </div>
          </div>
        </div>
        
      </div>

      {/* Shareable Link Modal on Publish */}
      {publishedJob && (
        <JobShareModal 
          isOpen={showShareModal} 
          onClose={() => {
            setShowShareModal(false);
            navigate('/employer/manage-jobs');
          }} 
          job={publishedJob}
          isNewlyPublished={true}
        />
      )}

    </div>
  );
};

export default PostJob;
