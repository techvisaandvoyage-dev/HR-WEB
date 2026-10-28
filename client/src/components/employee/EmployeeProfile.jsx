import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EmployeeNavbar from '../common/EmployeeNavbar';
import ImageCropperModal from '../common/ImageCropperModal';
import VideoPlayer from '../common/VideoPlayer';
import AccountSecuritySection from './AccountSecuritySection';
import PrivacySettingsSection from './PrivacySettingsSection';

import ProfileHero from './ProfileHero';
import ProfileSidebar from './ProfileSidebar';
import BasicDetailsModal from './BasicDetailsModal';
import EducationModal from './EducationModal';
import ExperienceModal from './ExperienceModal';
import SkillsModal from './SkillsModal';

import {
  IconPin,
  IconBag,
  IconPhone,
  IconMail,
  IconVerified,
  IconPen,
  IconPlus,
  IconClose,
  IconUpload,
  IconBack,
  IconTrash
} from './ProfileIcons';

import { uploadFileToStorage } from '../../utils/firebaseStorage';
import { uploadVideoToMux } from '../../utils/muxUpload';
import { compressFileIfNeeded } from '../../utils/fileCompressor';
import {
  sortQualifications,
  sortExperience
} from './EmployeeOnboarding';

import './EmployeeProfile.css';

const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  if (!year || !month) return dateStr;
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIdx = parseInt(month, 10) - 1;
  return `${monthsList[mIdx] || month} ${year}`;
};

const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ',
    CAD: '$', AUD: '$', SGD: '$', SAR: '﷼', QAR: '﷼',
    OMR: '﷼', KWD: 'د.ك', BHD: '.د.ب', JPY: '¥', CNY: '¥',
    CHF: 'Fr', HKD: '$', NZD: '$', MYR: 'RM', ZAR: 'R',
    THB: '฿', PHP: '₱', IDR: 'Rp', VND: '₫', BRL: 'R$',
    RUB: '₽', KRW: '₩', TRY: '₺', MXN: '$', EGP: 'E£',
    LKR: 'Rs', PKR: 'Rs', BDT: '৳', NPR: 'Rs'
  };
  return symbols[currencyCode || 'INR'] || '₹';
};

const calculateCompanyDuration = (co) => {
  if (!co || !co.roles || co.roles.length === 0) return '';
  const parseYearMonth = (str) => {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length < 2) return null;
    return parseInt(parts[0], 10) * 12 + parseInt(parts[1], 10) - 1;
  };

  let earliest = Infinity;
  let latest = -Infinity;
  const now = new Date();
  const currentMonthIdx = now.getFullYear() * 12 + now.getMonth();

  co.roles.forEach(r => {
    const j = parseYearMonth(r.joiningDate);
    if (j !== null && j < earliest) earliest = j;

    if (r.currentCompany) {
      if (currentMonthIdx > latest) latest = currentMonthIdx;
    } else {
      const l = parseYearMonth(r.leavingDate);
      if (l !== null && l > latest) latest = l;
    }
  });

  if (earliest === Infinity || latest === -Infinity || latest < earliest) return '';
  const totalMonths = Math.max(1, latest - earliest + 1);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let res = '';
  if (years > 0) res += `${years} yr${years > 1 ? 's' : ''}`;
  if (years > 0 && months > 0) res += ' ';
  if (months > 0) res += `${months} mo${months > 1 ? 's' : ''}`;
  return res || '1 mo';
};

const calculateRoleDuration = (joiningDate, leavingDate, isCurrent) => {
  if (!joiningDate) return '';
  const parseYearMonth = (str) => {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length < 2) return null;
    return parseInt(parts[0], 10) * 12 + parseInt(parts[1], 10) - 1;
  };
  const j = parseYearMonth(joiningDate);
  if (j === null) return '';
  const now = new Date();
  const currentMonthIdx = now.getFullYear() * 12 + now.getMonth();
  const l = isCurrent ? currentMonthIdx : parseYearMonth(leavingDate);
  if (l === null || l < j) return '';
  const totalMonths = Math.max(1, l - j + 1);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  let res = '';
  if (years > 0) res += `${years} yr${years > 1 ? 's' : ''}`;
  if (years > 0 && months > 0) res += ' ';
  if (months > 0) res += `${months} mo${months > 1 ? 's' : ''}`;
  return res || '1 mo';
};

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.tab === 'security' || location.search.includes('tab=security') || location.hash === '#security') {
      return 'security';
    }
    if (location.state?.tab === 'privacy' || location.search.includes('tab=privacy') || location.hash === '#privacy') {
      return 'privacy';
    }
    return location.state?.tab || 'basic';
  });

  // Modal states
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEduIdx, setEditingEduIdx] = useState(-1);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpIdx, setEditingExpIdx] = useState(-1);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [isMissingDetailsModalOpen, setIsMissingDetailsModalOpen] = useState(false);
  const [modalMissingItems, setModalMissingItems] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  // Uploading and file states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoProfileMode, setVideoProfileMode] = useState('upload');
  const [videoProfileLink, setVideoProfileLink] = useState('');
  const [docError, setDocError] = useState({ resume: '', coverLetter: '', introVideo: '' });

  // Main Form Data State
  const [formData, setFormData] = useState({
    firstName: 'Yash',
    lastName: 'Raj Singh',
    countryCode: '+91',
    phone: '',
    email: '',
    brief: '',
    avatar: '',
    qualifications: [],
    isFresher: false,
    experience: [],
    location: '',
    preferredLocation: '',
    industry: '',
    designation: '',
    totalExperience: '',
    isProfilePrivate: true,
    documents: {
      resume: '',
      coverLetter: '',
      introVideo: '',
      videoVisibility: 'everyone'
    },
    documentsMeta: {},
    professionalDetails: {
      currentSalary: '',
      expectedSalary: '',
      linkedinUrl: '',
      majorAchievements: '',
      skills: '',
      salaryType: 'Yearly',
      currency: 'INR'
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [cmsConfig, setCmsConfig] = useState(null);

  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage('');
    }, 2400);
  };

  // Tab click handler with smooth scroll
  const handleTabClick = (tabId) => {
    isProgrammaticScrollRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    setActiveTab(tabId);

    if (tabId === 'security' || tabId === 'privacy') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const el = document.getElementById(tabId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 40);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 850);
  };

  // Sync route query / hash / state
  useEffect(() => {
    if (location.state?.tab === 'security' || location.search.includes('tab=security') || location.hash === '#security') {
      setActiveTab('security');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (location.state?.tab === 'privacy' || location.search.includes('tab=privacy') || location.hash === '#privacy') {
      setActiveTab('privacy');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (location.state?.tab && location.state.tab !== 'security' && location.state.tab !== 'privacy') {
      setActiveTab(location.state.tab);
    }
  }, [location.state, location.search, location.hash]);

  // Fetch CMS config
  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employeeOnboarding) {
          setCmsConfig(data.data.employeeOnboarding);
        } else if (data?.employeeOnboarding) {
          setCmsConfig(data.employeeOnboarding);
        }
      } catch (err) {
        console.error("Failed to fetch CMS config in EmployeeProfile:", err);
      }
    };
    fetchCms();
  }, []);

  // Fetch initial profile from localStorage and API
  useEffect(() => {
    const fetchLatestProfile = async () => {
      const saved = localStorage.getItem('userProfile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.qualifications && Array.isArray(parsed.qualifications)) {
            parsed.qualifications = sortQualifications(
              parsed.qualifications.filter(q => q && (q.educationType || q.course || q.board || q.university))
            );
          }
          if (parsed.experience && Array.isArray(parsed.experience)) {
            parsed.experience = sortExperience(
              parsed.experience.filter(e => e && (e.companyName || e.roles?.some(r => r.jobTitle || r.employmentType)))
            );
          }
          setFormData(prev => ({
            ...prev,
            ...parsed,
            documents: { ...(prev.documents || {}), ...(parsed.documents || {}) }
          }));
        } catch (e) {
          console.error("Failed to parse local profile data");
        }
      }

      try {
        const token = localStorage.getItem('employeeToken');
        if (token) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data && data.email) {
            setFormData(prev => ({
              ...prev,
              ...data,
              countryCode: data.countryCode || prev.countryCode || '+91',
              qualifications: sortQualifications(
                (data.qualifications || prev.qualifications || []).filter(q => q && (q.educationType || q.course || q.board || q.university))
              ),
              experience: sortExperience(
                (data.experience || prev.experience || []).filter(e => e && (e.companyName || e.roles?.some(r => r.jobTitle || r.employmentType)))
              ),
              documents: {
                ...(prev.documents || {}),
                resume: data.resume || prev.documents?.resume || '',
                coverLetter: data.coverLetter || prev.documents?.coverLetter || '',
                introVideo: data.introVideo || prev.documents?.introVideo || '',
                videoVisibility: data.videoVisibility || prev.documents?.videoVisibility || 'everyone'
              },
              videoVisibility: data.videoVisibility || 'everyone'
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest profile:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchLatestProfile();
  }, []);

  // Autosave to API debounced
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('userProfile', JSON.stringify(formData));
      localStorage.setItem('hasProfile', 'true');

      const timer = setTimeout(async () => {
        try {
          const token = localStorage.getItem('employeeToken');
          if (token) {
            await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(formData)
            });
          }
        } catch (err) {
          console.error("Profile autosave error:", err);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [formData, isLoaded]);

  // Intersection observer for sidebar highlight
  useEffect(() => {
    if (activeTab === 'security' || activeTab === 'privacy') return;

    const tabsList = ['basic', 'edu', 'work', 'skills'];
    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    tabsList.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeTab]);

  // Profile completion calculation
  const calculateProfileCompletion = () => {
    let score = 0;
    const missing = [];

    if (formData.firstName && formData.lastName) score += 10;
    else missing.push({ label: 'Add Full Name', points: 10, target: 'basic' });

    if (formData.phone) score += 10;
    else missing.push({ label: 'Add Phone Number', points: 10, target: 'basic' });

    if (!formData.isFresher) {
      if (formData.designation && formData.professionalDetails?.currentSalary) {
        score += 10;
      } else {
        missing.push({ label: 'Professional Overview', points: 10, target: 'skills' });
      }
    } else {
      if (formData.professionalDetails?.expectedSalary) {
        score += 10;
      } else {
        missing.push({ label: 'Professional Overview', points: 10, target: 'skills' });
      }
    }

    if (formData.brief) {
      score += 10;
    } else {
      missing.push({ label: 'Add Brief about yourself', target: 'basic', points: 10 });
    }

    if (formData.avatar) {
      score += 5;
    } else {
      missing.push({ label: 'Add Profile Picture', target: 'basic', points: 5 });
    }

    if (formData.qualifications && formData.qualifications.length > 0) score += 15;
    else missing.push({ label: 'Add Education', points: 15, target: 'edu' });

    if (formData.isFresher || (formData.experience && formData.experience.length > 0)) score += 15;
    else missing.push({ label: 'Add Work Experience', points: 15, target: 'work' });

    if (formData.professionalDetails?.skills) score += 10;
    else missing.push({ label: 'Add Skills', points: 10, target: 'skills' });

    if (formData.documents?.resume) {
      score += 15;
    } else {
      missing.push({ label: 'Upload Resume', target: 'basic', points: 15 });
    }

    return { score, missing };
  };

  const { score, missing } = calculateProfileCompletion();

  // Document Helpers
  const docs = formData.documents || {};
  const docsMeta = formData.documentsMeta || {};

  const setDoc = (field, val, file = null) => {
    const updatedDocs = { ...docs, [field]: val };
    const updatedMeta = { ...docsMeta };
    if (val && file) {
      updatedMeta[field] = {
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`
      };
    } else if (!val) {
      delete updatedMeta[field];
    }
    setFormData({
      ...formData,
      documents: updatedDocs,
      documentsMeta: updatedMeta
    });
  };

  const handleVisibilityChange = async (visibility) => {
    setFormData(prev => ({
      ...prev,
      videoVisibility: visibility,
      documents: { ...(prev.documents || {}), videoVisibility: visibility }
    }));

    try {
      const token = localStorage.getItem('employeeToken');
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoVisibility: visibility,
            documents: { videoVisibility: visibility }
          })
        });
      }
    } catch (err) {
      console.error("Direct visibility save error:", err);
    }
  };

  const getStepField = (stepKey, fieldKey, defaultLabel, defaultPlaceholder, defaultRequired = true) => {
    const field = cmsConfig?.[stepKey]?.fields?.[fieldKey];
    let ph = field?.placeholder;
    if (stepKey === 'step5' && (fieldKey === 'resume' || fieldKey === 'coverLetter')) {
      if (!ph || ph.includes('5MB') || ph.includes('5mb') || ph === 'Upload Cover Letter (PDF/DOCX)' || ph === 'Upload PDF or DOCX (Max 5MB)' || ph.toLowerCase().includes('pdf or docx') || ph.toLowerCase().includes('cover letter (pdf/docx)')) {
        ph = defaultPlaceholder || 'Supported Formats: doc, docx, pdf, upto 300KB';
      }
    }
    return {
      label: field?.label || defaultLabel,
      placeholder: ph || defaultPlaceholder,
      isRequired: field?.isRequired !== undefined ? field.isRequired : defaultRequired
    };
  };

  const getFileName = (url, fallback = 'Uploaded Document') => {
    if (!url) return '';
    if (!url.startsWith('http')) return url;
    return fallback;
  };

  const handleAttachVideoLink = (e) => {
    e?.preventDefault();
    if (!videoProfileLink.trim()) {
      setDocError(prev => ({ ...prev, introVideo: 'Please enter a valid video link (YouTube, Loom, Vimeo, Drive, or video URL)' }));
      return;
    }
    setDocError(prev => ({ ...prev, introVideo: '' }));
    setDoc('introVideo', videoProfileLink.trim());
    showToast('Video link attached');
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setDocError(prev => ({ ...prev, [type]: '' }));
    setIsUploading(true);
    setUploadingType(type);
    if (type === 'introVideo') setVideoUploadProgress(0);

    try {
      if (type === 'introVideo') {
        const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
        if (file.size > MAX_VIDEO_SIZE) {
          setDocError(prev => ({
            ...prev,
            introVideo: 'Video exceeds 200MB limit. Please choose a smaller video.'
          }));
          return;
        }

        const muxRes = await uploadVideoToMux(file, (p) => setVideoUploadProgress(p));
        const finalUrl = muxRes?.playbackId ? muxRes.playbackId : (muxRes?.streamUrl || '');
        if (finalUrl) {
          setDoc('introVideo', finalUrl, file);
        } else {
          const downloadURL = await uploadFileToStorage(file, 'employee_videos');
          setDoc('introVideo', downloadURL, file);
        }
        showToast('Video uploaded successfully');
      } else {
        // Resume or Cover letter: max 300KB
        const compressed = await compressFileIfNeeded(file);
        const MAX_DOC_SIZE = 300 * 1024;
        if (compressed.size > MAX_DOC_SIZE) {
          setDocError(prev => ({
            ...prev,
            [type]: `File size exceeds 300KB limit (${Math.round(compressed.size / 1024)}KB).`
          }));
          return;
        }

        const downloadURL = await uploadFileToStorage(compressed, `employee_${type}`);
        setDoc(type, downloadURL, compressed);
        showToast(`${type === 'resume' ? 'Resume' : 'Cover letter'} uploaded`);
      }
    } catch (error) {
      console.error(`Upload error for ${type}:`, error);
      setDocError(prev => ({
        ...prev,
        [type]: 'Upload failed. Please try again.'
      }));
    } finally {
      setIsUploading(false);
      setUploadingType(null);
      e.target.value = '';
    }
  };

  // Basic Details Modal Save
  const handleSaveBasicDetails = (updated) => {
    setFormData(prev => ({
      ...prev,
      firstName: updated.firstName,
      lastName: updated.lastName,
      countryCode: updated.countryCode,
      phone: updated.phone,
      location: updated.location,
      brief: updated.brief
    }));
    showToast('Basic details saved');
  };

  // Education Modal Handlers
  const handleOpenEducationModal = (idx = -1) => {
    setEditingEduIdx(idx);
    setIsEduModalOpen(true);
  };

  const handleSaveEducation = (updatedEdu, idx) => {
    setFormData(prev => {
      let quals = [...(prev.qualifications || [])];
      if (idx >= 0 && idx < quals.length) {
        quals[idx] = updatedEdu;
      } else {
        quals.push(updatedEdu);
      }

      if (updatedEdu.isPrimary) {
        quals = quals.map((q, i) => ({
          ...q,
          isPrimary: idx >= 0 ? i === idx : i === quals.length - 1
        }));
      } else if (!quals.some(q => q.isPrimary) && quals.length > 0) {
        quals[0].isPrimary = true;
      }

      const sorted = sortQualifications(quals);
      localStorage.setItem('userProfile', JSON.stringify({ ...prev, qualifications: sorted }));
      return { ...prev, qualifications: sorted };
    });
    showToast(idx >= 0 ? 'Education updated' : 'Education added');
  };

  const handleDeleteEducation = (idx) => {
    setFormData(prev => {
      let quals = [...(prev.qualifications || [])].filter((_, i) => i !== idx);
      if (quals.length > 0 && !quals.some(q => q.isPrimary)) {
        quals[0].isPrimary = true;
      }
      localStorage.setItem('userProfile', JSON.stringify({ ...prev, qualifications: quals }));
      return { ...prev, qualifications: quals };
    });
    showToast('Education removed');
  };

  // Experience Modal Handlers
  const handleOpenExperienceModal = (idx = -1) => {
    setEditingExpIdx(idx);
    setIsExpModalOpen(true);
  };

  const handleSaveExperience = (updatedExp, idx) => {
    setFormData(prev => {
      let exps = [...(prev.experience || [])];
      if (idx >= 0 && idx < exps.length) {
        exps[idx] = updatedExp;
      } else {
        exps.push(updatedExp);
      }
      const sorted = sortExperience(exps);
      localStorage.setItem('userProfile', JSON.stringify({ ...prev, experience: sorted }));
      return { ...prev, experience: sorted };
    });
    showToast(idx >= 0 ? 'Experience updated' : 'Experience added');
  };

  const handleDeleteExperience = (idx) => {
    setFormData(prev => {
      const exps = [...(prev.experience || [])].filter((_, i) => i !== idx);
      localStorage.setItem('userProfile', JSON.stringify({ ...prev, experience: exps }));
      return { ...prev, experience: exps };
    });
    showToast('Experience removed');
  };

  // Skills Modal Handlers
  const handleSaveSkills = (updated) => {
    setFormData(prev => {
      const updatedProf = {
        ...(prev.professionalDetails || {}),
        designation: updated.designation,
        function: updated.function,
        preferredLocation: updated.preferredLocation,
        totalExperience: updated.totalExperience,
        linkedinUrl: updated.linkedinUrl,
        salaryType: updated.salaryType,
        currency: updated.currency,
        currentSalary: updated.currentSalary,
        expectedSalary: updated.expectedSalary,
        skills: updated.skillsString
      };
      const next = {
        ...prev,
        designation: updated.designation,
        industry: updated.function,
        preferredLocation: updated.preferredLocation,
        totalExperience: updated.totalExperience,
        professionalDetails: updatedProf
      };
      localStorage.setItem('userProfile', JSON.stringify(next));
      return next;
    });
    showToast('Preferences saved');
  };

  const p = formData.professionalDetails || {};
  const currentSkills = p.skills
    ? p.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen sj-profile flex flex-col pb-16">
      {/* Navbar */}
      <EmployeeNavbar />

      {/* Main Wrap Container */}
      <main className="max-w-[1180px] w-full mx-auto px-4 sm:px-6 pt-5">
        {/* Back to Home Link */}
        <button
          type="button"
          onClick={() => navigate('/employee')}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold text-sm transition-colors mb-4 cursor-pointer"
        >
          <IconBack className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Hero Banner Component (Circular Avatar as requested) */}
        <ProfileHero
          formData={formData}
          score={score}
          missing={missing}
          onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
          onOpenMissingModal={() => {
            setModalMissingItems(missing);
            setIsMissingDetailsModalOpen(true);
          }}
        />

        {/* 2-Column Responsive Layout */}
        <div className="sj-lay">
          {/* Left Navigation Sidebar */}
          <ProfileSidebar
            activeTab={activeTab}
            onTabClick={handleTabClick}
            missing={missing}
            formData={formData}
            docs={docs}
          />

          {/* Right Main Content Sections */}
          <div className="min-w-0">
            {activeTab === 'security' ? (
              <AccountSecuritySection userEmail={formData.email} />
            ) : activeTab === 'privacy' ? (
              <PrivacySettingsSection userEmail={formData.email} />
            ) : (
              <div className="space-y-5">
                {/* 1. Basic Details Card */}
                <section className="sj-card sj-sec" id="basic">
                  <div className="sj-sh">
                    <div>
                      <h2>{cmsConfig?.step1?.title || 'Basic Details'}</h2>
                      <p>Your name, contact and location</p>
                    </div>
                    <button
                      type="button"
                      className="sj-sb2"
                      onClick={() => setIsBasicModalOpen(true)}
                    >
                      <IconPen className="w-4 h-4 text-emerald-700" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="sj-kv">
                    <div>
                      <span>First name</span>
                      <b>{formData.firstName || '—'}</b>
                    </div>
                    <div>
                      <span>Last name</span>
                      <b>{formData.lastName || '—'}</b>
                    </div>
                    <div>
                      <span>Current location</span>
                      <b>{formData.location || '—'}</b>
                    </div>
                    <div>
                      <span>Phone</span>
                      <b>{formData.countryCode ? `${formData.countryCode} ` : ''}{formData.phone || '—'}</b>
                    </div>
                    <div className="sj-w2">
                      <span>Email</span>
                      <b>{formData.email || '—'}</b>
                    </div>
                    <div className="sj-full">
                      <span>Brief about yourself</span>
                      <b>
                        {formData.brief || (
                          <em style={{ color: 'var(--sj-mut)', fontWeight: 500 }}>
                            Add a short introduction recruiters will see first.
                          </em>
                        )}
                      </b>
                    </div>
                  </div>
                </section>

                {/* 2. Education Card */}
                <section className="sj-card sj-sec" id="education">
                  <div className="sj-sh">
                    <div>
                      <h2>{cmsConfig?.step2?.title || 'Education'}</h2>
                      <p>Course, university and more help recruiters understand your background</p>
                    </div>
                    <button
                      type="button"
                      className="sj-sb2"
                      onClick={() => handleOpenEducationModal(-1)}
                    >
                      <IconPlus className="w-4 h-4 text-emerald-700" />
                      <span>Add</span>
                    </button>
                  </div>

                  {formData.qualifications && formData.qualifications.length > 0 ? (
                    <>
                      <div className="sj-tl sj-edl">
                        {formData.qualifications.map((edu, idx) => (
                          <div key={idx} className={`sj-r ${edu.isPrimary ? 'sj-cur' : ''}`}>
                            <div className="sj-rt2">
                              <b>{edu.course || edu.educationType}</b>
                              {edu.isPrimary && <span className="sj-tag">PRIMARY</span>}
                              <button
                                type="button"
                                className="sj-ib ml-auto"
                                onClick={() => handleOpenEducationModal(idx)}
                                aria-label={`Edit ${edu.course || edu.educationType}`}
                              >
                                <IconPen className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                            <small>{edu.university || edu.board || 'Institution not specified'}</small>
                            <small>
                              {edu.educationType}
                              {edu.courseType ? ` · ${edu.courseType}` : ''}
                              {edu.startYear ? ` · ${edu.startYear} – ${edu.endYear}` : (edu.endYear ? ` · Passing: ${edu.endYear}` : '')}
                              {edu.percentage ? ` · ${edu.percentage}${edu.gradingSystem && edu.gradingSystem.includes('%') ? '%' : ''}` : ''}
                            </small>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="sj-add"
                        onClick={() => handleOpenEducationModal(-1)}
                      >
                        <IconPlus className="w-4 h-4" />
                        <span>Add another education</span>
                      </button>
                    </>
                  ) : (
                    <div className="sj-empty">
                      <b>No education added yet</b>
                      <span>Add your highest qualification first.</span>
                      <div className="mt-3">
                        <button
                          type="button"
                          className="sj-btn sj-btn-p"
                          onClick={() => handleOpenEducationModal(-1)}
                        >
                          <IconPlus className="w-4 h-4" />
                          <span>Add education</span>
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* 3. Work Experience Card */}
                <section className="sj-card sj-sec" id="experience">
                  <div className="sj-sh">
                    <div>
                      <h2>{cmsConfig?.step3?.title || 'Work Experience'}</h2>
                      <p>Add details of your previous and current employment</p>
                    </div>
                    <div className="sj-seg">
                      <button
                        type="button"
                        className={formData.isFresher ? 'sj-on' : ''}
                        onClick={() => setFormData(prev => ({ ...prev, isFresher: true }))}
                      >
                        Fresher
                      </button>
                      <button
                        type="button"
                        className={!formData.isFresher ? 'sj-on' : ''}
                        onClick={() => setFormData(prev => ({ ...prev, isFresher: false }))}
                      >
                        Experienced
                      </button>
                    </div>
                  </div>

                  {formData.isFresher ? (
                    <div className="sj-empty">
                      <b>You’re listed as a fresher</b>
                      <span>No problem. Switch to “Experienced” whenever you add a job.</span>
                    </div>
                  ) : (
                    <>
                      {formData.experience && formData.experience.length > 0 ? (
                        <div className="space-y-3">
                          {formData.experience.map((co, cIdx) => {
                            const isCurrent = co.roles?.some(r => r.currentCompany);
                            return (
                              <div key={cIdx} className={`sj-co ${isCurrent ? 'sj-now' : ''}`}>
                                <div className="sj-co-head">
                                  <span className="sj-ic">
                                    {(co.companyName?.[0] || '?').toUpperCase()}
                                  </span>
                                  <div className="sj-cn">
                                    <h3>
                                      {co.companyName}
                                      {isCurrent && (
                                        <span className="sj-live">
                                          <i></i>Current company
                                        </span>
                                      )}
                                    </h3>
                                    <p>
                                      {calculateCompanyDuration(co)} · {co.roles?.length || 1} role{co.roles?.length > 1 ? 's' : ''}
                                      {co.noticePeriod ? ` · ${co.noticePeriod}` : ''}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className="sj-ib"
                                    onClick={() => handleOpenExperienceModal(cIdx)}
                                    aria-label={`Edit ${co.companyName}`}
                                  >
                                    <IconPen className="w-4 h-4 text-gray-500" />
                                  </button>
                                </div>

                                <div className="sj-tl">
                                  {co.roles?.map((role, rIdx) => (
                                    <div key={rIdx} className={`sj-r ${role.currentCompany ? 'sj-cur' : ''}`}>
                                      <div className="sj-rt2">
                                        <b>{role.jobTitle || 'Role'}</b>
                                        {role.currentCompany && <span className="sj-tag">CURRENT</span>}
                                      </div>
                                      <small>
                                        {role.employmentType || 'Full-time'}
                                        {role.joiningDate ? ` · ${formatMonthYear(role.joiningDate)} – ${role.currentCompany ? 'Present' : formatMonthYear(role.leavingDate)}` : ''}
                                      </small>
                                      {role.roleDescription && <p>{role.roleDescription}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="sj-empty">
                          <b>No experience added yet</b>
                          <span>Add companies and the roles you held.</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className="sj-add mt-3"
                        onClick={() => handleOpenExperienceModal(-1)}
                      >
                        <IconPlus className="w-4 h-4" />
                        <span>Add experience</span>
                      </button>
                    </>
                  )}
                </section>

                {/* 4. Key Skills & Preferences Card (Preserved title per user request) */}
                <section className="sj-card sj-sec" id="professional">
                  <div className="sj-sh">
                    <div>
                      <h2>{cmsConfig?.step4?.title || 'Key Skills & Preferences'}</h2>
                      <p>Highlight your skills and preferences to find matching jobs</p>
                    </div>
                    <button
                      type="button"
                      className="sj-sb2"
                      onClick={() => setIsSkillsModalOpen(true)}
                    >
                      <IconPen className="w-4 h-4 text-emerald-700" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="sj-kv">
                    <div>
                      <span>Designation / Role</span>
                      <b>{formData.designation || p.designation || '—'}</b>
                    </div>
                    <div>
                      <span>Function</span>
                      <b>{p.function || formData.industry || '—'}</b>
                    </div>
                    <div>
                      <span>Preferred location</span>
                      <b>{formData.preferredLocation || p.preferredLocation || '—'}</b>
                    </div>
                    <div>
                      <span>Total experience</span>
                      <b>{p.totalExperience || formData.totalExperience || (formData.isFresher ? 'Fresher' : '—')}</b>
                    </div>
                    <div>
                      <span>Current CTC</span>
                      <b>
                        {p.currentSalary
                          ? `${getCurrencySymbol(p.currency)} ${p.currentSalary} (${p.salaryType || 'Yearly'})`
                          : '—'}
                      </b>
                    </div>
                    <div>
                      <span>Expected CTC</span>
                      <b>
                        {p.expectedSalary
                          ? `${getCurrencySymbol(p.currency)} ${p.expectedSalary} (${p.salaryType || 'Yearly'})`
                          : '—'}
                      </b>
                    </div>
                    <div className="sj-full">
                      <span>LinkedIn</span>
                      <b>
                        {p.linkedinUrl ? (
                          <a
                            href={p.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline"
                          >
                            {p.linkedinUrl}
                          </a>
                        ) : (
                          '—'
                        )}
                      </b>
                    </div>
                  </div>

                  <div className="mt-5">
                    <span style={{ color: 'var(--sj-mut)', fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                      Key Skills
                    </span>
                    <div className="sj-sk">
                      {currentSkills.length > 0 ? (
                        currentSkills.map((s, idx) => (
                          <span key={idx} className="sj-pill">
                            {s}
                          </span>
                        ))
                      ) : (
                        <em style={{ color: 'var(--sj-mut)' }}>No skills added</em>
                      )}
                    </div>
                  </div>
                </section>

                {/* 5. Documents & Media Card (Exact original design restored) */}
                <section id="documents" className="scroll-mt-40 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8">
                  <div className="mb-6 pb-2 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800">{cmsConfig?.step5?.title || 'Documents & Media'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{cmsConfig?.step5?.subtitle || 'Manage your introductory video, resume, and cover letter.'}</p>
                  </div>
                  {(() => {
                    const vCfg = cmsConfig?.step5?.videoConfig || {};
                    const fIntro = getStepField('step5', 'introVideo', 'Introductory Video', 'Upload MP4/MOV or attach video link', false);
                    const videoSectionTitle = vCfg.sectionTitle || fIntro.label || 'Introductory Video';
                    const videoSectionSubtitle = vCfg.sectionSubtitle || fIntro.placeholder || 'Upload MP4/MOV or attach video link';
                    const uploadTabLabel = vCfg.uploadTabLabel || 'Upload File';
                    const linkTabLabel = vCfg.linkTabLabel || 'Paste Link';
                    const uploadDropzoneTitle = vCfg.uploadDropzoneTitle || 'Click or drag video to upload';
                    const uploadDropzoneSubtitle = vCfg.uploadDropzoneSubtitle || 'MP4, MOV, WebM up to 200MB (Max 3 mins)';
                    const linkInputPlaceholder = vCfg.linkInputPlaceholder || 'e.g. YouTube, Loom, Vimeo, Drive, or Mux stream link';
                    const linkAttachButtonText = vCfg.linkAttachButtonText || 'Attach';
                    const linkHelpText = vCfg.linkHelpText || 'Supported: YouTube, Loom, Vimeo, Google Drive, Mux Stream URLs, and MP4 links.';

                    return (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Resume Upload */}
                          <div className="p-4 border border-gray-200 rounded-xl">
                            <label className="block text-sm font-bold text-gray-900 mb-3">
                              {getStepField('step5', 'resume', 'Upload Resume', 'Supported Formats: doc, docx, pdf, upto 300KB', true).label}
                              {getStepField('step5', 'resume', '', '', true).isRequired && <span className="text-red-500 ml-0.5">*</span>}
                            </label>
                            <input key={docs.resume ? 'res-has' : 'res-empty'} type="file" disabled={isUploading} accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-palette-50 file:text-palette-900 hover:file:bg-palette-100 cursor-pointer disabled:opacity-50" onChange={e => handleFileUpload(e, 'resume')} />
                            {isUploading && uploadingType === 'resume' && (
                              <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 animate-pulse mt-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                                </span>
                                <span>Uploading {getStepField('step5', 'resume', 'Upload Resume', 'Supported Formats: doc, docx, pdf, upto 300KB', true).label || 'Resume'}...</span>
                              </div>
                            )}
                            {docError.resume && <p className="text-xs text-red-500 mt-2 font-medium">{docError.resume}</p>}
                            <p className="text-xs text-gray-500 mt-2 font-medium">
                              {getStepField('step5', 'resume', 'Upload Resume', 'Supported Formats: doc, docx, pdf, upto 300KB', true).placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}
                            </p>
                            {docs.resume && (
                              <div className="flex items-center justify-between mt-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0 truncate">
                                    <a 
                                      href={docs.resume.startsWith('http') ? docs.resume : '#'} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-xs sm:text-sm font-bold text-gray-900 hover:text-emerald-600 hover:underline truncate block"
                                    >
                                      {docsMeta?.resume?.name || getFileName(docs.resume, 'Resume Document')}
                                    </a>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                      {docsMeta?.resume?.size ? `${docsMeta.resume.size} • ` : ''}Uploaded Document
                                    </p>
                                  </div>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setDoc('resume', '')} 
                                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" 
                                  title="Remove Resume"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Cover Letter Upload */}
                          <div className="p-4 border border-gray-200 rounded-xl">
                            <label className="flex items-center justify-between text-sm font-bold text-gray-900 mb-3">
                              <span>{getStepField('step5', 'coverLetter', 'Upload Cover Letter', 'Supported Formats: doc, docx, pdf, upto 300KB').label}</span>
                              {getStepField('step5', 'coverLetter', '', '', false).isRequired && (
                                <span className="text-red-500 font-bold ml-0.5">*</span>
                              )}
                            </label>
                            <input key={docs.coverLetter ? 'cl-has' : 'cl-empty'} type="file" disabled={isUploading} accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-palette-50 file:text-palette-900 hover:file:bg-palette-100 cursor-pointer disabled:opacity-50" onChange={e => handleFileUpload(e, 'coverLetter')} />
                            {isUploading && uploadingType === 'coverLetter' && (
                              <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 animate-pulse mt-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                                </span>
                                <span>Uploading {getStepField('step5', 'coverLetter', 'Upload Cover Letter', 'Supported Formats: doc, docx, pdf, upto 300KB').label || 'Cover Letter'}...</span>
                              </div>
                            )}
                            {docError.coverLetter && <p className="text-xs text-red-500 mt-2 font-medium">{docError.coverLetter}</p>}
                            <p className="text-xs text-gray-500 mt-2 font-medium">
                              {getStepField('step5', 'coverLetter', 'Upload Cover Letter', 'Supported Formats: doc, docx, pdf, upto 300KB').placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}
                            </p>
                            {docs.coverLetter && (
                              <div className="flex items-center justify-between mt-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0 truncate">
                                    <a 
                                      href={docs.coverLetter.startsWith('http') ? docs.coverLetter : '#'} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-xs sm:text-sm font-bold text-gray-900 hover:text-emerald-600 hover:underline truncate block"
                                    >
                                      {docsMeta?.coverLetter?.name || getFileName(docs.coverLetter, 'Cover Letter Document')}
                                    </a>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                      {docsMeta?.coverLetter?.size ? `${docsMeta.coverLetter.size} • ` : ''}Uploaded Document
                                    </p>
                                  </div>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => setDoc('coverLetter', '')} 
                                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" 
                                  title="Remove Cover Letter"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Introductory Video Card in Profile */}
                          <div className="col-span-1 md:col-span-2 p-5 border border-emerald-100 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-white to-gray-50 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                  {videoSectionTitle}
                                  {fIntro.isRequired && (
                                    <span className="text-red-500 font-bold ml-0.5">*</span>
                                  )}
                                </label>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {videoSectionSubtitle}
                                </p>
                              </div>
                              <div className="flex bg-gray-200/80 p-1 rounded-xl text-xs font-semibold self-start">
                                <button
                                  type="button"
                                  onClick={() => setVideoProfileMode('upload')}
                                  className={`px-3 py-1 rounded-lg transition-all ${videoProfileMode === 'upload' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                  {uploadTabLabel}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setVideoProfileMode('link')}
                                  className={`px-3 py-1 rounded-lg transition-all ${videoProfileMode === 'link' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                  {linkTabLabel}
                                </button>
                              </div>
                            </div>

                            {videoProfileMode === 'upload' && !docs.introVideo && (
                              <div className="p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-white text-center hover:border-emerald-400 transition-all relative">
                                <input
                                  type="file"
                                  disabled={isUploading}
                                  accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.mov,.webm,.mkv,.m4v"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  onChange={e => handleFileUpload(e, 'introVideo')}
                                />
                                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                  {isUploading && uploadingType === 'introVideo' ? (
                                    <svg className="animate-spin w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </div>

                                {isUploading && uploadingType === 'introVideo' ? (
                                  <div className="max-w-xs mx-auto space-y-2 mt-1">
                                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                                      <span>Uploading video...</span>
                                      <span>{videoUploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                      <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-300 ease-out" 
                                        style={{ width: `${Math.max(videoUploadProgress, 5)}%` }}
                                      />
                                    </div>
                                    <p className="text-[11px] text-gray-400">Processing video stream, please wait...</p>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-sm font-semibold text-emerald-600 hover:underline">
                                      {uploadDropzoneTitle}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-1">{uploadDropzoneSubtitle}</p>
                                  </>
                                )}
                              </div>
                            )}

                            {videoProfileMode === 'link' && !docs.introVideo && (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    type="url"
                                    placeholder={linkInputPlaceholder}
                                    value={videoProfileLink}
                                    onChange={e => setVideoProfileLink(e.target.value)}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAttachVideoLink}
                                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 cursor-pointer"
                                  >
                                    {linkAttachButtonText}
                                  </button>
                                </div>
                                <p className="text-[11px] text-gray-400">{linkHelpText}</p>
                              </div>
                            )}

                            {docError.introVideo && (
                              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs shadow-xs animate-shake">
                                <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                  <span className="font-bold block text-red-800">Cannot upload video:</span>
                                  <p className="mt-0.5 leading-relaxed">{docError.introVideo}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setDocError(prev => ({ ...prev, introVideo: '' }))}
                                  className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                                  title="Dismiss"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            )}

                            {docs.introVideo && (
                              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                      Video Attached
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                      (formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      {(formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone' ? (
                                        <>
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                          Visible to All Employers
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                          Applied Job Only
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setDoc('introVideo', '')}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>

                                <VideoPlayer url={docs.introVideo} />

                                {/* Visibility / Sharing Options */}
                                <div className="pt-3 border-t border-gray-100 space-y-2">
                                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Who can see this video?
                                  </label>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {/* Option 1: Share to everyone */}
                                    <button
                                      type="button"
                                      onClick={() => handleVisibilityChange('everyone')}
                                      className={`w-full text-left p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                                        (formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone'
                                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                        (formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone'
                                          ? 'border-emerald-600 bg-emerald-600'
                                          : 'border-gray-300 bg-white'
                                      }`}>
                                        {(formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone' && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="text-xs font-bold text-gray-900">Share to everyone</p>
                                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">All Employees List</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                          All employers can view your introductory video in the all employee list.
                                        </p>
                                      </div>
                                    </button>

                                    {/* Option 2: Share to applied jobs */}
                                    <button
                                      type="button"
                                      onClick={() => handleVisibilityChange('applied')}
                                      className={`w-full text-left p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                                        (formData.videoVisibility || formData.documents?.videoVisibility) === 'applied'
                                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                        (formData.videoVisibility || formData.documents?.videoVisibility) === 'applied'
                                          ? 'border-emerald-600 bg-emerald-600'
                                          : 'border-gray-300 bg-white'
                                      }`}>
                                        {(formData.videoVisibility || formData.documents?.videoVisibility) === 'applied' && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <p className="text-xs font-bold text-gray-900">Share to applied jobs</p>
                                          <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Applied Only</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                          Only employers of jobs you specifically apply to can watch your video.
                                        </p>
                                      </div>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <BasicDetailsModal
        isOpen={isBasicModalOpen}
        onClose={() => setIsBasicModalOpen(false)}
        formData={formData}
        onSave={handleSaveBasicDetails}
        cmsConfig={cmsConfig}
      />

      <EducationModal
        isOpen={isEduModalOpen}
        onClose={() => setIsEduModalOpen(false)}
        initialData={editingEduIdx >= 0 ? formData.qualifications?.[editingEduIdx] : null}
        editIndex={editingEduIdx}
        onSave={handleSaveEducation}
        onDelete={handleDeleteEducation}
      />

      <ExperienceModal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        initialData={editingExpIdx >= 0 ? formData.experience?.[editingExpIdx] : null}
        editIndex={editingExpIdx}
        onSave={handleSaveExperience}
        onDelete={handleDeleteExperience}
      />

      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        formData={formData}
        onSave={handleSaveSkills}
      />

      {/* Avatar Image Cropper Modal */}
      <ImageCropperModal
        isOpen={!!cropFile}
        onClose={() => setCropFile(null)}
        imageFile={cropFile}
        onSave={async (croppedUrl) => {
          try {
            setIsUploading(true);
            const res = await fetch(croppedUrl);
            const blob = await res.blob();
            const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const downloadURL = await uploadFileToStorage(file, 'avatars');
            setFormData(prev => ({ ...prev, avatar: downloadURL }));
            showToast('Profile photo updated');
          } catch (error) {
            console.error("Avatar upload error:", error);
            alert("Failed to upload profile picture. Please try again.");
          } finally {
            setIsUploading(false);
            setCropFile(null);
          }
        }}
        onChangePhoto={() => {
          setCropFile(null);
          setIsAvatarModalOpen(true);
        }}
      />

      {/* Avatar Simple Selection Modal */}
      {isAvatarModalOpen && (
        <div className="sj-modal-backdrop" onClick={() => setIsAvatarModalOpen(false)}>
          <div className="sj-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="sj-mh">
              <h3>Profile Photo</h3>
              <button
                type="button"
                className="sj-ib"
                onClick={() => setIsAvatarModalOpen(false)}
                aria-label="Close"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center mb-4">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-4xl font-bold text-gray-400">
                    {(formData.firstName?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Profiles with photos have 40% higher recruiter engagement
              </p>
              <div className="w-full space-y-2">
                <label className="sj-btn sj-btn-p sj-btn-w cursor-pointer">
                  <IconUpload className="w-4 h-4" />
                  <span>{formData.avatar ? 'Replace Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setCropFile(e.target.files[0]);
                        setIsAvatarModalOpen(false);
                      }
                    }}
                  />
                </label>
                {formData.avatar && (
                  <button
                    type="button"
                    className="sj-btn sj-btn-d sj-btn-w"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, avatar: '' }));
                      setIsAvatarModalOpen(false);
                      showToast('Photo removed');
                    }}
                  >
                    <IconTrash className="w-4 h-4 text-red-500" />
                    <span>Remove current photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Missing Details Modal */}
      {isMissingDetailsModalOpen && (
        <div className="sj-modal-backdrop" onClick={() => setIsMissingDetailsModalOpen(false)}>
          <div className="sj-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sj-mh">
              <div>
                <h3>Complete Your Profile</h3>
                <p>Fill in the details below to reach 100%</p>
              </div>
              <button
                type="button"
                className="sj-ib"
                onClick={() => setIsMissingDetailsModalOpen(false)}
                aria-label="Close"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {modalMissingItems.map((item, idx) => {
                const completed = !missing.some(m => m.label === item.label);
                return (
                  <div
                    key={idx}
                    className={`p-4 border rounded-xl flex items-center justify-between transition-all ${
                      completed ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        completed ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {completed ? '✓' : idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded text-xs">
                        +{item.points}%
                      </span>
                      <button
                        type="button"
                        className="sj-btn sj-btn-sm sj-btn-o text-xs"
                        onClick={() => {
                          setIsMissingDetailsModalOpen(false);
                          if (item.target === 'basic') setIsBasicModalOpen(true);
                          else if (item.target === 'education') handleOpenEducationModal(-1);
                          else if (item.target === 'experience') handleOpenExperienceModal(-1);
                          else if (item.target === 'professional') setIsSkillsModalOpen(true);
                          else if (item.target === 'documents') {
                            document.getElementById('documents')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        Add &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="sj-mf">
              <button
                type="button"
                className="sj-btn sj-btn-p"
                onClick={() => setIsMissingDetailsModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`sj-toast ${toastMessage ? 'sj-show' : ''}`} role="status">
        {toastMessage}
      </div>
    </div>
  );
};

export default EmployeeProfile;
