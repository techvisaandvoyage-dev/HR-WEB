import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CustomMonthPicker from '../common/CustomMonthPicker';
import CustomDropdown from '../common/CustomDropdown';
import InstituteAutocomplete from '../common/InstituteAutocomplete';
import JobTitleAutocomplete from '../common/JobTitleAutocomplete';
import CompanyAutocomplete from '../common/CompanyAutocomplete';
import { DEFAULT_EDUCATION_DATA, DEFAULT_BOARD_OPTIONS, DEFAULT_COURSE_TYPE_OPTIONS, DEFAULT_MEDIUM_OPTIONS, DEFAULT_EMPLOYMENT_TYPE_OPTIONS, DEFAULT_NOTICE_PERIOD_OPTIONS, DEFAULT_GRADING_SYSTEMS, normalizeGradingSystems, sortQualifications, sortExperience } from './EmployeeOnboarding';
import { uploadFileToStorage } from '../../utils/firebaseStorage';
import { getEmployeeStoredValue, setEmployeeStoredValue } from '../../utils/employeeStorage';

const formatMonthYear = (dateStr) => {
  if (!dateStr) return 'MM/YYYY';
  const [year, month] = dateStr.split('-');
  if (!year || !month) return 'MM/YYYY';
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthsList[parseInt(month, 10) - 1]} ${year}`;
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

const formatIndianNumber = (val) => {
  if (!val) return '';
  const numStr = val.toString().replace(/\D/g, '');
  if (!numStr) return '';
  let lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
};

const getProfileDesignation = (profile) => {
  if (!profile) return '';

  return profile.designation
    || profile.professionalDetails?.currentDesignation
    || profile.experience?.find((experience) => experience.roles?.some((role) => role.currentCompany))?.roles?.find((role) => role.currentCompany)?.jobTitle
    || profile.experience?.[0]?.roles?.[0]?.jobTitle
    || '';
};

const getProfileCompany = (profile) => {
  if (!profile) return '';

  return profile.experience?.find((experience) => experience.roles?.some((role) => role.currentCompany))?.companyName
    || profile.experience?.[0]?.companyName
    || '';
};

const isScreeningQuestionRequired = (question) => (
  question?.required === true || question?.required === 'true'
);

const JobApplicationModal = ({ isOpen, onClose, job, applyToJob }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const hasQuestions = job?.screeningQuestions && job.screeningQuestions.length > 0;
  const totalSteps = hasQuestions ? 7 : 6;
  const totalFastSteps = hasQuestions ? 4 : 3;
  const [expandedEduIndex, setExpandedEduIndex] = useState(-1);
  const [expandedExpIndex, setExpandedExpIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [expError, setExpError] = useState('');
  const [expFieldErrors, setExpFieldErrors] = useState({});
  const [eduError, setEduError] = useState('');
  const [eduFieldErrors, setEduFieldErrors] = useState({});
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState('');

  const scrollToTarget = (targetId) => {
    setTimeout(() => {
      let targetEl = targetId ? document.getElementById(targetId) : null;
      if (!targetEl && targetId) {
        targetEl = document.querySelector(`[id="${targetId}"]`);
      }
      if (!targetEl) {
        targetEl = document.querySelector('.border-red-500, .ring-red-500, [aria-invalid="true"]');
      }
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inputEl = targetEl.tagName === 'INPUT' || targetEl.tagName === 'SELECT' || targetEl.tagName === 'TEXTAREA'
          ? targetEl
          : targetEl.querySelector('input, select, textarea, button');
        if (inputEl) {
          inputEl.focus({ preventScroll: true });
        }
      }
    }, 120);
  };

  const validateEducationData = (targetIdx = null) => {
    const qualifications = formData.qualifications || [];
    if (qualifications.length === 0) return { isValid: true };
    const eduData = cmsConfig?.step2?.educationData || DEFAULT_EDUCATION_DATA;
    const isPercentageRequired = cmsConfig?.step2?.fields?.percentage?.isRequired !== false;

    const indicesToCheck = (targetIdx !== null && targetIdx !== undefined && targetIdx >= 0) 
      ? [targetIdx] 
      : Array.from({ length: qualifications.length }, (_, i) => i);

    for (const eduIdx of indicesToCheck) {
      const currentEdu = qualifications[eduIdx];
      if (!currentEdu) continue;
      const errors = {};
      let hasError = false;
      let firstMissingId = null;

      if (!currentEdu.educationType) {
        errors.educationType = true;
        hasError = true;
        firstMissingId = `field-modal-edu-type-${eduIdx}`;
      } else {
        const currentEduConfig = eduData[currentEdu.educationType];
        const isSchool = currentEduConfig ? currentEduConfig.category === 'school' : (currentEdu.educationType === '10th' || currentEdu.educationType === '12th');
        if (isSchool) {
          if (!currentEdu.board) { errors.board = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-board-${eduIdx}`; }
          if (!currentEdu.endYear) { errors.endYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-endYear-${eduIdx}`; }
          if (!currentEdu.schoolMedium) { errors.schoolMedium = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-schoolMedium-${eduIdx}`; }
          if (isPercentageRequired && !currentEdu.percentage) { errors.percentage = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-percentage-${eduIdx}`; }
        } else {
          if (!currentEdu.university) { errors.university = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-university-${eduIdx}`; }
          if (!currentEdu.course) { errors.course = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-course-${eduIdx}`; }
          if (!currentEdu.courseType) { errors.courseType = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-courseType-${eduIdx}`; }
          if (!currentEdu.startYear) { errors.startYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-startYear-${eduIdx}`; }
          if (!currentEdu.endYear) { errors.endYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-modal-edu-endYear-${eduIdx}`; }
          if (isPercentageRequired && currentEdu.gradingSystem && currentEdu.gradingSystem !== 'Not Applicable' && !currentEdu.percentage) {
            errors.percentage = true;
            hasError = true;
            if (!firstMissingId) firstMissingId = `field-modal-edu-percentage-${eduIdx}`;
          }
        }
      }

      if (hasError) {
        return {
          isValid: false,
          eduIdx,
          errors,
          targetFieldId: firstMissingId
        };
      }
    }
    return { isValid: true };
  };

  const validateExperienceData = (targetIdx = null) => {
    if (formData.isFresher === true) return { isValid: true };
    const experience = formData.experience || [];
    if (experience.length === 0) return { isValid: true };

    const indicesToCheck = (targetIdx !== null && targetIdx !== undefined && targetIdx >= 0)
      ? [targetIdx]
      : Array.from({ length: experience.length }, (_, i) => i);

    for (const cIdx of indicesToCheck) {
      const exp = experience[cIdx];
      if (!exp) continue;
      const errors = { roles: [] };
      let hasError = false;
      let firstMissingId = null;

      if (!exp.companyName?.trim()) {
        errors.companyName = true;
        hasError = true;
        firstMissingId = `field-modal-exp-company-${cIdx}`;
      }

      if (exp.roles && exp.roles.length > 0) {
        exp.roles.forEach((role, rIdx) => {
          const roleErrors = {};
          if (!role.jobTitle?.trim()) {
            roleErrors.jobTitle = true;
            hasError = true;
            if (!firstMissingId) firstMissingId = `field-modal-exp-jobTitle-${cIdx}-${rIdx}`;
          }
          if (!role.employmentType) {
            roleErrors.employmentType = true;
            hasError = true;
            if (!firstMissingId) firstMissingId = `field-modal-exp-empType-${cIdx}-${rIdx}`;
          }
          if (!role.joiningDate) {
            roleErrors.joiningDate = true;
            hasError = true;
            if (!firstMissingId) firstMissingId = `field-modal-exp-joiningDate-${cIdx}-${rIdx}`;
          }
          if (!role.currentCompany && !role.leavingDate) {
            roleErrors.leavingDate = true;
            hasError = true;
            if (!firstMissingId) firstMissingId = `field-modal-exp-leavingDate-${cIdx}-${rIdx}`;
          }
          errors.roles[rIdx] = roleErrors;
        });
      }

      if (hasError) {
        return {
          isValid: false,
          cIdx,
          errors,
          targetFieldId: firstMissingId
        };
      }
    }

    return { isValid: true };
  };

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.experience && parsed.experience.length > 0 && !parsed.experience[0].roles) {
          parsed.experience = parsed.experience.map(exp => ({
            companyName: exp.companyName,
            noticePeriod: exp.noticePeriod || '',
            roles: [{
              jobTitle: exp.jobTitle || '',
              employmentType: exp.employmentType || '',
              currentCompany: exp.currentCompany || false,
              joiningDate: exp.joiningDate || '',
              leavingDate: exp.leavingDate || '',
              roleDescription: exp.roleDescription || ''
            }]
          }));
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse profile data");
      }
    }
    return {
      firstName: '',
      lastName: '',
      phone: '',
      email: 'user@example.com',
      brief: '',
      
      qualifications: [
        { stream: '', school: '', board: '', startYear: '', endYear: '', percentage: '' }
      ],

      isFresher: false,
      experience: [
        { 
          companyName: '', 
          noticePeriod: '',
          roles: [
            { jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }
          ]
        }
      ],

      professionalDetails: {
        currentDesignation: '',
        currentSalary: '',
        expectedSalary: '',
        currentLocation: '',
        preferredLocations: [],
        linkedinUrl: '',
        majorAchievements: '',
        skills: ''
      },

      documents: {
        resume: null,
        coverLetter: null
      }
    };
  });

  const [fastStep, setFastStep] = useState(1);
  const [isOldUser, setIsOldUser] = useState(false);


  const [fastFormData, setFastFormData] = useState(() => ({
    relevantJobTitle: getProfileDesignation(formData),
    relevantCompany: getProfileCompany(formData)
  }));
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [questionErrors, setQuestionErrors] = useState({});
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);
  const [cmsConfig, setCmsConfig] = useState(null);

  const getCleanFileName = (urlOrName, fallback = 'Resume.pdf') => {
    if (!urlOrName) return fallback;
    if (!urlOrName.startsWith('http')) return urlOrName;
    try {
      const decoded = decodeURIComponent(urlOrName.split('?')[0]);
      const segments = decoded.split('/');
      const rawFileName = segments[segments.length - 1];
      const clean = rawFileName.replace(/^\d+[-_]/, '');
      return clean || fallback;
    } catch {
      return fallback;
    }
  };

  const handleDownloadResume = async () => {
    const resumeUrl = fastFormData.resume || formData.documents?.resume || formData.resume;
    if (!resumeUrl) return;

    const rawName = getCleanFileName(resumeUrl) || 'Resume.pdf';
    const fileName = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`;

    if (resumeUrl.startsWith('http') || resumeUrl.startsWith('blob:') || resumeUrl.startsWith('data:')) {
      try {
        const response = await fetch(resumeUrl, { mode: 'cors' });
        if (!response.ok) throw new Error('Fetch failed');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } catch (err) {
        // Fallback: direct download link
        const link = document.createElement('a');
        link.href = resumeUrl;
        link.setAttribute('download', fileName);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      alert("Resume file ready: " + (resumeUrl || 'Resume.pdf'));
    }
  };

  const validateQuestions = () => {
    let isValid = true;
    const errors = {};
    if (job?.screeningQuestions) {
      job.screeningQuestions.forEach((sq, i) => {
        if (isScreeningQuestionRequired(sq) && (!screeningAnswers[i] || screeningAnswers[i].trim() === '')) {
          errors[i] = true;
          isValid = false;
        }
      });
    }
    setQuestionErrors(errors);
    return isValid;
  };

  React.useEffect(() => {
    if (isOpen) {
      try {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          const latestProfile = JSON.parse(savedProfile);
          setFormData(latestProfile);
          setFastFormData({
            relevantJobTitle: getProfileDesignation(latestProfile),
            relevantCompany: getProfileCompany(latestProfile)
          });
        }
      } catch (error) {
        console.error('Failed to parse profile data', error);
      }

      // Fetch CMS Config
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.employeeOnboarding) {
            setCmsConfig(data.data.employeeOnboarding);
          }
        })
        .catch(err => console.error("Failed to fetch CMS config in JobApplicationModal:", err));

      setCurrentStep(1);
      setFastStep(1);
      setIsOldUser(localStorage.getItem('hasProfile') === 'true');
      setIsSubmitted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || isResumePreviewOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isResumePreviewOpen]);

  if (!isOpen || !job) return null;

  const handleNext = () => {
    if (isOldUser) {
      if (hasQuestions && fastStep === 3) {
        if (!validateQuestions()) return;
      }
      
      if (fastStep === totalFastSteps - 1) {
        setIsLoadingReview(true);
        setTimeout(() => {
          setIsLoadingReview(false);
          setFastStep(totalFastSteps);
        }, 2500);
      } else if (fastStep < totalFastSteps) {
        setFastStep(fastStep + 1);
      }
    } else {
      if (currentStep === 2) {
        const valRes = validateEducationData();
        if (!valRes.isValid) {
          setExpandedEduIndex(valRes.eduIdx);
          setEduFieldErrors(valRes.errors);
          scrollToTarget(valRes.targetFieldId);
          return;
        }
      }
      if (currentStep === 3) {
        const valRes = validateExperienceData();
        if (!valRes.isValid) {
          setExpandedExpIndex(valRes.cIdx);
          setExpFieldErrors(valRes.errors);
          scrollToTarget(valRes.targetFieldId);
          return;
        }
      }
      if (hasQuestions && currentStep === 6) {
        if (!validateQuestions()) return;
      }
      if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (isOldUser) {
      if (fastStep > 1) setFastStep(fastStep - 1);
    } else {
      if (currentStep > 1) setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    localStorage.setItem('userProfile', JSON.stringify(formData));
    localStorage.setItem('hasProfile', 'true');
    
    // Save to applied jobs (scoped per employee so MyJobs & EmployeeHomepage pick it up)
    if (job) {
      try {
        let appliedJobs = getEmployeeStoredValue('appliedJobs', []);
          // Add if not already applied
          if (!appliedJobs.some(a => String(a.id) === String(job.id))) {
            appliedJobs.unshift({
              id: job.id,
              _id: job.id,
              status: 'Applied',
              date: new Date().toLocaleDateString(),
              jobDetails: job
            });
            setEmployeeStoredValue('appliedJobs', appliedJobs);
            localStorage.removeItem('appliedJobs'); // clean up old un-scoped key
            
            // Save candidate profile to backend first
            try {
              const token = localStorage.getItem('employeeToken');
              if (token) {
                await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ ...formData, isOnboardingCompleted: true, onboardingStep: 6 })
                });
              }
            } catch (err) {
              console.error("Failed to save profile to backend before applying", err);
            }
            
            // Send candidate data to global state
            if (applyToJob) {
            const result = await applyToJob(job.id, {
              name: (formData.firstName || formData.lastName) ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim() : 'Applicant',
              email: formData.email,
              phone: formData.phone,
              location: formData.professionalDetails?.currentLocation,
              initials: (formData.firstName ? formData.firstName.charAt(0) : 'A') + (formData.lastName ? formData.lastName.charAt(0) : ''),
              bg: 'bg-green-600',
              apps: 1,
              exp: isOldUser 
                ? (fastFormData.relevantJobTitle || 'Not specified')
                : (formData.isFresher 
                    ? 'Fresher' 
                    : (formData.experience?.[0]?.roles?.[0]?.jobTitle || formData.professionalDetails?.currentDesignation || 'Not specified')),
              currentCTC: formData.professionalDetails?.currentSalary || 'N/A',
              expectedCTC: formData.professionalDetails?.expectedSalary || 'N/A',
              summary: formData.brief || formData.professionalDetails?.majorAchievements,
              skills: formData.professionalDetails?.skills ? formData.professionalDetails.skills.split(',').map(s => s.trim()) : null,
              experience: formData.experience,
              education: formData.qualifications,
              resume: formData.documents?.resume || formData.resume || '',
              coverLetter: formData.documents?.coverLetter || formData.coverLetter || '',
              introVideo: formData.documents?.introVideo || formData.introVideo || '',
              history: [
                { 
                  title: job.title, 
                  status: 'Applied', 
                  color: 'bg-blue-50 text-blue-600 border border-blue-100',
                  resume: formData.documents?.resume || formData.resume || '',
                  coverLetter: formData.documents?.coverLetter || formData.coverLetter || '',
                  introVideo: formData.documents?.introVideo || formData.introVideo || ''
                }
              ],
              screeningAnswers: job.screeningQuestions ? job.screeningQuestions.map((sq, i) => ({ question: sq.question, answer: screeningAnswers[i] })).filter(item => item.answer && item.answer.trim() !== '') : []
            });
            if (!result.success) {
              setSubmitError(result.message);
              return; // Application failed on backend
            }
          }
        }
      } catch (err) {
        console.error("Error saving applied job", err);
      }
    }

    setIsSubmitted(true);
  };

  const updateArray = (arrayName, index, field, value) => {
    let newArr = [...(formData[arrayName] || [])];
    if (arrayName === 'qualifications' && field === 'isPrimary') {
      if (value) {
        // Set all other qualifications isPrimary to false
        newArr = newArr.map((item, i) => ({
          ...item,
          isPrimary: i === index
        }));
        // Move marked primary item to index 0 (first in order)
        const [primaryItem] = newArr.splice(index, 1);
        newArr.unshift(primaryItem);
        setExpandedEduIndex(0);
      } else {
        newArr[index] = { ...newArr[index], isPrimary: false };
      }
    } else {
      newArr[index] = { ...newArr[index], [field]: value };
    }
    setFormData({ ...formData, [arrayName]: newArr });
  };

  const addArrayItem = (arrayName, emptyItem) => {
    setFormData({ ...formData, [arrayName]: [...(formData[arrayName] || []), emptyItem] });
  };

  const removeArrayItem = (arrayName, index) => {
    const newArr = [...(formData[arrayName] || [])];
    newArr.splice(index, 1);
    setFormData({ ...formData, [arrayName]: newArr });
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val) {
        const p = formData.professionalDetails || {};
        const currentSkills = p.skills ? p.skills.split(',').filter(s => s.trim()) : [];
        if (!currentSkills.includes(val)) {
          setFormData({...formData, professionalDetails: {...p, skills: [...currentSkills, val].join(', ')}});
        }
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillToRemove) => {
const p = formData.professionalDetails || {};
    const currentSkills = p.skills ? p.skills.split(',').map(s=>s.trim()).filter(s => s) : [];
    setFormData({...formData, professionalDetails: {...p, skills: currentSkills.filter(s => s !== skillToRemove).join(', ')}});
  };

  // --- New Questions Step ---
  const StepQuestions = () => (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto py-6">
      <div className="text-center sm:text-left">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Employer Questions</h3>
        <p className="text-sm text-gray-500 mt-1">Please answer the questions below to continue with your application.</p>
      </div>

      <div className="space-y-4">
        {job.screeningQuestions && job.screeningQuestions.map((sq, i) => {
          const isRequired = isScreeningQuestionRequired(sq);
          const hasError = questionErrors[i];
          const isYesNo = sq.type === 'Yes/No';

          return (
            <div 
              key={i} 
              className={`bg-white border rounded-2xl p-6 transition-all shadow-sm ${
                hasError ? 'border-red-300 ring-2 ring-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Question Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                    Question {i + 1}
                  </span>
                  {isRequired ? (
                    <span className="text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      Required *
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  )}
                </div>
                <h4 className="text-[15px] font-bold text-gray-900 leading-snug">
                  {sq.question}
                </h4>
              </div>

              {/* Question Input */}
              {isYesNo ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {['Yes', 'No'].map((choice) => {
                    const isSelected = screeningAnswers[i] === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => {
                          setScreeningAnswers({ ...screeningAnswers, [i]: choice });
                          if (questionErrors[i]) {
                            setQuestionErrors({ ...questionErrors, [i]: false });
                          }
                        }}
                        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-[#29953f] bg-green-50/70 text-[#147a2e] ring-1 ring-[#29953f]/30 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70 text-gray-700'
                        }`}
                      >
                        {/* Custom Radio Button */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-[#29953f] bg-[#29953f]'
                              : 'border-gray-300 bg-white group-hover:border-gray-400'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white animate-scale-in" />
                          )}
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-[#147a2e]' : 'text-gray-800'}`}>
                          {choice}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-1 space-y-1">
                  <input
                    type="text"
                    maxLength={16}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all shadow-sm ${
                      hasError
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-[#29953f] focus:ring-2 focus:ring-green-100'
                    }`}
                    placeholder="Type your answer (max 16 chars)..."
                    value={screeningAnswers[i] || ''}
                    onChange={(e) => {
                      setScreeningAnswers({ ...screeningAnswers, [i]: e.target.value.slice(0, 16) });
                      if (questionErrors[i]) {
                        setQuestionErrors({ ...questionErrors, [i]: false });
                      }
                    }}
                  />
                  <div className="flex justify-end">
                    <span className={`text-[10px] font-semibold ${
                      (screeningAnswers[i]?.length || 0) >= 16 ? 'text-amber-600 font-bold' : 'text-gray-400'
                    }`}>
                      {screeningAnswers[i]?.length || 0}/16 characters
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {hasError && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs font-semibold mt-2.5 animate-in fade-in duration-200">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Please {isYesNo ? 'select Yes or No' : 'type an answer'} to continue.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const SuccessScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] animate-fade-in w-full max-w-xl mx-auto py-8 text-center px-4">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h3 className="text-3xl font-black text-gray-900 mb-4">Application Submitted!</h3>
      <p className="text-gray-500 mb-8 text-lg">Your application has been successfully sent to the employer. Good luck!</p>
      <button 
        onClick={onClose}
        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 hover:bg-green-700 hover:shadow-green-700/40 transition-all duration-300 text-lg"
      >
        Return to Job Search
      </button>
    </div>
  );

  const LoadingReview = () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[350px] animate-fade-in w-full max-w-md mx-auto py-12 text-center">
      <div className="w-14 h-14 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-6"></div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Preparing your application</h3>
      <p className="text-sm text-gray-500">Reviewing your profile details before final submission...</p>
    </div>
  );

  const FastStep1Experience = () => (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto py-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Enter a job that shows relevant experience</h3>
      <p className="text-gray-500 mb-6 text-sm">We share one job title with the employer to introduce you as a candidate.</p>
      
      <div className="space-y-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Job title</label>
          <input 
            type="text" 
            placeholder="e.g. Software Engineer"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" 
            value={fastFormData.relevantJobTitle || ''} 
            onChange={e => setFastFormData({...fastFormData, relevantJobTitle: e.target.value})} 
          />
        </div>
      </div>
    </div>
  );

  const FastStep2Resume = () => {
    const handleFileChange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      
      if (file.size > 300 * 1024) {
        setResumeUploadError(`File size (${(file.size / 1024).toFixed(1)}KB) exceeds 300KB limit.`);
        return;
      }
      setResumeUploadError('');
      setUploadingResume(true);
      try {
        const downloadURL = await uploadFileToStorage(file, 'resumes');
        setFastFormData(prev => ({ ...prev, resume: downloadURL }));
        setFormData(prev => ({
          ...prev,
          documents: { ...(prev.documents || {}), resume: downloadURL }
        }));
      } catch (err) {
        console.error('Failed to upload resume in modal', err);
        setFastFormData(prev => ({ ...prev, resume: file.name }));
      } finally {
        setUploadingResume(false);
      }
    };
    
    const activeResume = fastFormData.resume || formData.documents?.resume || formData.resume;

    return (
      <div className="space-y-6 animate-fade-in max-w-md mx-auto py-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Add a resume</h3>
        <p className="text-gray-500 mb-6 text-sm">Employers use your resume to review your experience and qualifications.</p>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          {activeResume ? (
            <div 
              onClick={() => setIsResumePreviewOpen(true)}
              className="flex items-center justify-between p-4 border border-green-200 rounded-xl bg-green-50/50 hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-900 group-hover:text-green-800 transition-colors truncate text-sm">{getCleanFileName(activeResume)}</p>
                  <p className="text-xs text-green-600 font-semibold">Attached from profile • Click to preview</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsResumePreviewOpen(true);
                }}
                className="text-xs font-bold text-green-700 bg-white border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </div>
          ) : (
            <div className="p-4 border border-amber-200 rounded-xl bg-amber-50 text-amber-800 text-sm font-medium">
              No resume attached yet. Please upload one below.
            </div>
          )}
          
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
             <input type="file" disabled={uploadingResume} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
             <p className="text-sm font-semibold text-green-600 group-hover:text-green-700">
               {uploadingResume ? 'Uploading resume...' : (activeResume ? 'Upload a different resume' : 'Upload Resume (Max: 300KB)')}
             </p>
          </div>
          {resumeUploadError && (
            <p className="text-xs text-red-500 font-medium">{resumeUploadError}</p>
          )}
        </div>
      </div>
    );
  };

  const FastStep3Review = () => (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto py-8 pb-4">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Review your application</h3>
      <p className="text-gray-500 mb-6 text-sm">You will not be able to edit your application after you submit.</p>
      
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-bold text-gray-900">Contact information</h4>
        <button type="button" onClick={() => setFastStep(1)} className="text-green-600 font-bold hover:underline text-sm">Edit</button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 mb-8">
        <div>
          <p className="text-sm text-gray-500 mb-1">Full name</p>
          <p className="font-bold text-gray-900">{(formData.firstName || formData.lastName) ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim() : 'Applicant'}</p>
        </div>
        <hr className="border-gray-100" />
        <div>
          <p className="text-sm text-gray-500 mb-1">Email</p>
          <p className="font-bold text-gray-900">{formData.email || 'N/A'}</p>
          <p className="text-xs text-gray-500 mt-1">To reduce fraud, we may hide your contact information from the employer.</p>
        </div>
        <hr className="border-gray-100" />
        <div>
          <p className="text-sm text-gray-500 mb-1">Phone number</p>
          <p className="font-bold text-gray-900">{formData.phone ? `+91 ${formData.phone}` : 'N/A'}</p>
        </div>
        {formData.location && (
          <>
            <hr className="border-gray-100" />
            <div>
              <p className="text-sm text-gray-500 mb-1">Location</p>
              <p className="font-bold text-gray-900">{formData.location}</p>
            </div>
          </>
        )}
      </div>
      
      <div className="flex justify-between items-center mb-2 mt-8">
        <h4 className="text-lg font-bold text-gray-900">Resume</h4>
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => setIsResumePreviewOpen(true)} 
            className="text-green-600 font-bold hover:underline inline-flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
          <button 
            type="button" 
            onClick={handleDownloadResume} 
            className="text-green-600 font-bold hover:underline inline-flex items-center gap-1.5 text-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button 
            type="button" 
            onClick={() => setFastStep(2)} 
            className="text-green-600 font-bold hover:underline text-sm cursor-pointer"
          >
            Edit
          </button>
        </div>
      </div>
      
      <div 
        onClick={() => setIsResumePreviewOpen(true)}
        className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-green-300 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors truncate text-sm">
              {getCleanFileName(fastFormData.resume || formData.documents?.resume || formData.resume)}
            </p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Click to preview document</p>
          </div>
        </div>
        
        <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg shrink-0 group-hover:bg-green-100 transition-colors flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </span>
      </div>

      <div className="flex justify-between items-center mb-2 mt-8">
        <h4 className="text-lg font-bold text-gray-900">Relevant Experience</h4>
        <button type="button" onClick={() => setFastStep(1)} className="text-green-600 font-bold hover:underline text-sm">Edit</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Job title</p>
          <p className="font-bold text-gray-900">{fastFormData.relevantJobTitle || getProfileDesignation(formData) || 'Software Engineer'}</p>
        </div>
      </div>
    </div>
  );

  // --- Step Components ---

  const Step1BasicDetails = () => (
    <div className="space-y-6 animate-fade-in pb-2">
      <div className="mb-6 pb-2 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-800">Basic Details</h3>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">First Name <span className="text-red-500">*</span></label>
          <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="John" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Last Name <span className="text-red-500">*</span></label>
          <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="Doe" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
          <div className="flex">
            <span className="px-4 py-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-500 font-semibold">+91</span>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-r-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="9876543210" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Email (Read Only)</label>
          <input type="email" disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" value={formData.email || ''} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Brief about yourself</label>
          <textarea 
            rows="3"
            placeholder="I am a passionate professional..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all custom-scrollbar" 
            value={formData.brief || ''} 
            onChange={e => setFormData({...formData, brief: e.target.value})} 
          ></textarea>
        </div>
      </div>
    </div>
  );

  const Step2Education = () => {
    const handleAddEducation = () => {
      const qualifications = formData.qualifications || [];
      if (qualifications.length > 0) {
        const valRes = validateEducationData();
        if (!valRes.isValid) {
          setExpandedEduIndex(valRes.eduIdx);
          setEduFieldErrors(valRes.errors);
          scrollToTarget(valRes.targetFieldId);
          return;
        }
      }
      setEduFieldErrors({});
      setExpandedEduIndex(qualifications.length);
      addArrayItem('qualifications', { educationType: '', board: '', endYear: '', schoolMedium: '', percentage: '', university: '', course: '', startYear: '', gradingSystem: '', isPrimary: false });
    };

    return (
      <div className="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-2">
        <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Education</h3>
            <p className="text-sm text-gray-500 mt-1">Details like course, university, and more, help recruiters identify your educational background</p>
          </div>
          <button type="button" onClick={handleAddEducation} className="text-green-500 hover:text-green-600 font-semibold text-sm">
            Add +
          </button>
        </div>
        
        <div className="space-y-6">
          {sortQualifications(formData.qualifications || []).map((q, idx) => {
            const isSchool = q.educationType === '10th' || q.educationType === '12th';
            const isHigher = q.educationType && !isSchool;
            
            if (expandedEduIndex !== idx) {
              return (
                <div key={idx} className="group relative">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-[15px]">
                      {isHigher ? (q.course || q.educationType || 'Higher Education') : 
                       isSchool ? (q.educationType === '12th' ? 'Class XII' : 'Class X') : 
                       (q.educationType || 'Education')}
                    </h4>
                    {q.isPrimary && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">Primary</span>
                    )}
                    <button type="button" onClick={() => { setEduFieldErrors({}); setExpandedEduIndex(idx); }} className="text-gray-400 hover:text-blue-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                  
                  <p className="text-gray-800 mt-1">
                    {isHigher ? (q.university || 'University not specified') : (q.board || 'Board not specified')}
                  </p>
                  
                  <p className="text-gray-500 text-sm mt-0.5">
                    {isHigher ? `${q.startYear || 'YYYY'} - ${q.endYear || 'YYYY'}` : (q.endYear || 'YYYY')}
                  </p>
                </div>
              );
            }
            
            return (
              <div key={idx} className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm relative">
                <button type="button" onClick={() => { removeArrayItem('qualifications', idx); setExpandedEduIndex(-1); setEduFieldErrors({}); }} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                
                <div className="space-y-6 pt-2">
                  <div id={`field-modal-edu-type-${idx}`}>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Education <span className="text-red-500">*</span></label>
                    <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.educationType ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.educationType || ''} onChange={e => { updateArray('qualifications', idx, 'educationType', e.target.value); setEduFieldErrors({...eduFieldErrors, educationType: false}); }}>
                      <option value="">Select education type</option>
                      {Object.keys(DEFAULT_EDUCATION_DATA).map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>

                  {isSchool && (
                    <>
                      <div id={`field-modal-edu-board-${idx}`}>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Board <span className="text-red-500">*</span></label>
                        <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.board ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.board || ''} onChange={e => { updateArray('qualifications', idx, 'board', e.target.value); setEduFieldErrors({...eduFieldErrors, board: false}); }}>
                          <option value="">Select board</option>
                          {DEFAULT_BOARD_OPTIONS.filter(b => !b.isGroupLabel).map(b => (
                            <option key={b.value} value={b.value}>{b.label}</option>
                          ))}
                        </select>
                      </div>
                      <div id={`field-modal-edu-endYear-${idx}`}>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Passing out year <span className="text-red-500">*</span></label>
                        <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.endYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.endYear || ''} onChange={e => { updateArray('qualifications', idx, 'endYear', e.target.value); setEduFieldErrors({...eduFieldErrors, endYear: false}); }}>
                          <option value="">Select passing out year</option>
                          {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div id={`field-modal-edu-schoolMedium-${idx}`}>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">School medium <span className="text-red-500">*</span></label>
                        <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.schoolMedium ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.schoolMedium || ''} onChange={e => { updateArray('qualifications', idx, 'schoolMedium', e.target.value); setEduFieldErrors({...eduFieldErrors, schoolMedium: false}); }}>
                          <option value="">Select medium</option>
                          {(cmsConfig?.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS).map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div id={`field-modal-edu-percentage-${idx}`}>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Marks <span className="text-red-500">*</span></label>
                        <input type="text" className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.percentage ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} placeholder="% marks of 100 maximum" value={q.percentage || ''} onChange={e => { updateArray('qualifications', idx, 'percentage', e.target.value.replace(/\D/g, '')); setEduFieldErrors({...eduFieldErrors, percentage: false}); }} />
                      </div>
                    </>
                  )}

                  {isHigher && (
                    <>
                      <div id={`field-modal-edu-university-${idx}`}>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">University/Institute <span className="text-red-500">*</span></label>
                        <InstituteAutocomplete 
                          value={q.university || ''} 
                          onChange={val => { updateArray('qualifications', idx, 'university', val); setEduFieldErrors({...eduFieldErrors, university: false}); }} 
                          placeholder="Search or enter university/institute..." 
                          className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.university ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} 
                        />
                      </div>
                      <div id={`field-modal-edu-course-${idx}`}>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Course <span className="text-red-500">*</span></label>
                        <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.course ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.course || ''} onChange={e => { updateArray('qualifications', idx, 'course', e.target.value); setEduFieldErrors({...eduFieldErrors, course: false}); }}>
                          <option value="">Select course</option>
                          {(DEFAULT_EDUCATION_DATA[q.educationType]?.options || ['B.Tech/B.E.', 'B.Sc', 'B.Com', 'B.A', 'BBA', 'M.Tech/M.E.', 'MBA/PGDM', 'MCA', 'Other']).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div id={`field-modal-edu-courseType-${idx}`}>
                        <label className="block text-sm font-bold text-gray-900 mb-3">Course type <span className="text-red-500">*</span></label>
                        <div className={`flex flex-wrap items-center gap-6 ${eduFieldErrors.courseType ? 'ring-2 ring-red-500 rounded-lg p-1.5' : ''}`}>
                          {(cmsConfig?.step2?.courseTypeOptions || DEFAULT_COURSE_TYPE_OPTIONS).map((ct) => (
                            <label key={ct} className="flex items-center cursor-pointer group">
                              <input 
                                type="radio" 
                                name={`courseType-${idx}`} 
                                value={ct} 
                                className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" 
                                checked={q.courseType === ct} 
                                onChange={(e) => { updateArray('qualifications', idx, 'courseType', e.target.value); setEduFieldErrors({...eduFieldErrors, courseType: false}); }} 
                              />
                              <span className={`ml-2.5 text-[15px] ${q.courseType === ct ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>
                                {ct}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div id={`field-modal-edu-startYear-${idx}`}>
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Course duration <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-4">
                          <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.startYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.startYear || ''} onChange={e => { updateArray('qualifications', idx, 'startYear', e.target.value); setEduFieldErrors({...eduFieldErrors, startYear: false}); }}>
                            <option value="">Starting year</option>
                            {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          <span className="font-bold text-gray-900">To</span>
                          <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.endYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.endYear || ''} onChange={e => { updateArray('qualifications', idx, 'endYear', e.target.value); setEduFieldErrors({...eduFieldErrors, endYear: false}); }}>
                            <option value="">Ending year</option>
                            {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(() => {
                        const currentGradingSystems = normalizeGradingSystems(cmsConfig?.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS);
                        const selectedGradingObj = currentGradingSystems.find(g => g.name === q.gradingSystem);
                        const dynamicMarksLabel = selectedGradingObj?.label || 'Marks';
                        const dynamicMarksPlaceholder = selectedGradingObj?.placeholder || 'Enter grade or marks';

                        return (
                          <>
                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-1.5">Grading system</label>
                              <select 
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" 
                                value={q.gradingSystem || ''} 
                                onChange={e => updateArray('qualifications', idx, 'gradingSystem', e.target.value)}
                              >
                                <option value="">Select grading system</option>
                                {currentGradingSystems.map((gs) => (
                                  <option key={gs.name} value={gs.name}>{gs.name}</option>
                                ))}
                              </select>
                            </div>
                            {q.gradingSystem && q.gradingSystem !== 'Not Applicable' && (
                              <div id={`field-modal-edu-percentage-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">{dynamicMarksLabel} <span className="text-red-500">*</span></label>
                                <input 
                                  type="text" 
                                  className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.percentage ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} 
                                  placeholder={dynamicMarksPlaceholder} 
                                  value={q.percentage || ''} 
                                  onChange={e => { updateArray('qualifications', idx, 'percentage', e.target.value.replace(/[^0-9.]/g, '')); setEduFieldErrors({...eduFieldErrors, percentage: false}); }} 
                                />
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {q.educationType !== 'Masters/Post-Graduation' && !q.isPrimary && (
                        <div className="flex items-center pt-2">
                          <input type="checkbox" id={`primary-grad-${idx}`} className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500" checked={q.isPrimary || false} onChange={e => updateArray('qualifications', idx, 'isPrimary', e.target.checked)} />
                          <label htmlFor={`primary-grad-${idx}`} className="ml-3 text-gray-700 font-medium cursor-pointer">Make this as my primary graduation/diploma</label>
                        </div>
                      )}
                      {q.educationType !== 'Masters/Post-Graduation' && q.isPrimary && (
                        <div className="flex items-center gap-2 pt-2 text-xs font-bold text-green-700">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span>Primary Education</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        const valRes = validateEducationData(idx);
                        if (!valRes.isValid) {
                          setEduFieldErrors(valRes.errors);
                          scrollToTarget(valRes.targetFieldId);
                          return;
                        }
                        setEduFieldErrors({});
                        let updatedQuals = [...(formData.qualifications || [])];
                        const primaryIdx = updatedQuals.findIndex(q => q.isPrimary);
                        if (primaryIdx > 0) {
                          const [primaryItem] = updatedQuals.splice(primaryIdx, 1);
                          updatedQuals.unshift(primaryItem);
                          setFormData(prev => ({ ...prev, qualifications: updatedQuals }));
                        }
                        setExpandedEduIndex(-1);
                      }} 
                      className="px-6 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="pt-4">
            <button type="button" onClick={handleAddEducation} className="text-green-500 font-semibold hover:text-green-600 text-sm">
              Add +
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Step3Experience = () => {
    const handleAddExperience = (e) => {
      if (e) e.preventDefault();
      const experiences = formData.experience || [];
      if (experiences.length > 0) {
        const valRes = validateExperienceData();
        if (!valRes.isValid) {
          setExpError('Fill details');
          setExpandedExpIndex(valRes.cIdx);
          setExpFieldErrors(valRes.errors);
          scrollToTarget(valRes.targetFieldId);
          return;
        }
      }
      setExpError('');
      setExpFieldErrors({});
      setExpandedExpIndex(experiences.length); 
      addArrayItem('experience', { companyName: '', noticePeriod: '', roles: [{ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }] });
    };

    return (
      <div className="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-2">
        <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Work Experience</h3>
          </div>
          {!formData.isFresher && (
            <button type="button" onClick={handleAddExperience} className="text-green-500 font-semibold hover:text-green-600 text-sm">
              Add +
            </button>
          )}
        </div>
        <div className="space-y-6">
          <div className="flex flex-col items-start gap-3 mb-6">
            <label className="text-sm font-medium text-gray-700">Are you a Fresher?</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center cursor-pointer group">
                <input type="radio" name="isFresher_jobapp" value="yes" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={formData.isFresher === true} onChange={() => setFormData({...formData, isFresher: true})} />
                <span className={`ml-2.5 text-[15px] ${formData.isFresher === true ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>I am a Fresher</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input 
                  type="radio" 
                  name="isFresher_jobapp" 
                  value="no" 
                  className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" 
                  checked={formData.isFresher === false} 
                  onChange={() => {
                    const isExpEmpty = !formData.experience || formData.experience.length === 0;
                    if (isExpEmpty) {
                      setExpandedExpIndex(0);
                      setFormData({
                        ...formData,
                        isFresher: false,
                        experience: [{ companyName: '', noticePeriod: '', roles: [{ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }] }]
                      });
                    } else {
                      if (expandedExpIndex < 0) {
                        setExpandedExpIndex(0);
                      }
                      setFormData({...formData, isFresher: false});
                    }
                  }} 
                />
                <span className={`ml-2.5 text-[15px] ${formData.isFresher === false ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>I have experience</span>
              </label>
            </div>
          </div>
          
          {!formData.isFresher && (
            <div className="space-y-6">
              {(formData.experience || []).map((exp, cIdx) => {
                const hasCurrentRole = (exp.roles || []).some(r => r.currentCompany);
                
                if (expandedExpIndex !== cIdx) {
                  return (
                    <div key={cIdx} className="group relative border-b border-gray-100 last:border-0 pb-6 mb-6 last:pb-0 last:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900 text-[15px]">
                          {exp.companyName || 'Company Name'}
                        </h4>
                        <button type="button" onClick={() => { setExpFieldErrors({}); setExpandedExpIndex(cIdx); }} className="text-gray-400 hover:text-blue-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </div>
                      
                      <div className="mt-4 pl-4 border-l-2 border-green-500 ml-2 space-y-5">
                        {(exp.roles || []).map((role, rIdx) => (
                          <div key={rIdx} className="relative">
                            <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[23px] top-1.5 ring-4 ring-white"></div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-800">{role.jobTitle || 'Job Title'}</p>
                              {role.currentCompany && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider rounded-full">Current Role</span>
                              )}
                            </div>
                            <p className="text-gray-500 text-sm mt-0.5">
                              {formatMonthYear(role.joiningDate)} - {role.currentCompany ? 'Present' : formatMonthYear(role.leavingDate)} | {role.employmentType || 'Employment Type'}{role.currentCompany && exp.noticePeriod ? ` | Notice: ${exp.noticePeriod}` : ''}
                            </p>
                            {role.roleDescription && (
                              <p className="text-gray-600 text-sm mt-2">{role.roleDescription}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={cIdx} className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50 relative">
                    <button type="button" onClick={() => { removeArrayItem('experience', cIdx); setExpandedExpIndex(-1); setExpFieldErrors({}); }} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <h4 className="font-semibold text-gray-700 pr-8">Company {cIdx + 1}</h4>
                    <div id={`field-modal-exp-company-${cIdx}`}>
                      <label className="block text-sm font-bold text-gray-900 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                      <CompanyAutocomplete 
                        value={exp.companyName || ''} 
                        className={`w-full px-4 py-3 bg-white border ${expFieldErrors.companyName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`}
                        onChange={val => {
                          const newExp = [...(formData.experience || [])];
                          newExp[cIdx].companyName = val;
                          setFormData({...formData, experience: newExp});
                          setExpFieldErrors(prev => ({ ...prev, companyName: false }));
                        }} 
                        placeholder="Enter or search company name..."
                      />
                    </div>
                    <div className="relative border-l-2 border-green-500 ml-3 mt-8 space-y-8 pb-4">
                      {(exp.roles || []).map((role, rIdx) => (
                        <div key={rIdx} className="relative pl-6">
                          <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-green-500 border-4 border-gray-50 shadow-sm"></div>
                          
                          <div className="p-6 border border-gray-200 rounded-xl space-y-6 bg-white shadow-sm relative group">
                            <button type="button" onClick={() => {
                              const newExp = [...(formData.experience || [])];
                              newExp[cIdx].roles.splice(rIdx, 1);
                              setFormData({...formData, experience: newExp});
                            }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors hidden group-hover:block">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                            
                            <div className="absolute -top-3 left-4 bg-white px-3 text-sm font-bold text-green-600 border border-green-100 rounded-full shadow-sm">Role {rIdx + 1}</div>
                            
                            <div className="space-y-6 pt-2">
                              <div id={`field-modal-exp-jobTitle-${cIdx}-${rIdx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Job Title <span className="text-red-500">*</span></label>
                                <JobTitleAutocomplete 
                                  value={role.jobTitle || ''} 
                                  className={`w-full px-4 py-3 bg-white border ${expFieldErrors.roles?.[rIdx]?.jobTitle ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`}
                                  onChange={val => {
                                    const newExp = [...(formData.experience || [])];
                                    newExp[cIdx].roles[rIdx].jobTitle = val;
                                    setFormData({...formData, experience: newExp});
                                    if (expFieldErrors.roles?.[rIdx]?.jobTitle) {
                                      const updatedRoles = [...(expFieldErrors.roles || [])];
                                      if (updatedRoles[rIdx]) updatedRoles[rIdx].jobTitle = false;
                                      setExpFieldErrors(prev => ({ ...prev, roles: updatedRoles }));
                                    }
                                  }}
                                  placeholder="Enter or search job title..."
                                />
                              </div>
                              <div id={`field-modal-exp-empType-${cIdx}-${rIdx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">{cmsConfig?.step3?.fields?.employmentType?.label || 'Employment Type'} <span className="text-red-500">*</span></label>
                                <CustomDropdown
                                  options={(cmsConfig?.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS).map(opt => ({ value: typeof opt === 'string' ? opt : opt.value, label: typeof opt === 'string' ? opt : opt.label }))}
                                  value={role.employmentType || ''}
                                  onChange={val => {
                                    const newExp = [...(formData.experience || [])];
                                    newExp[cIdx].roles[rIdx].employmentType = val;
                                    setFormData({...formData, experience: newExp});
                                    if (expFieldErrors.roles?.[rIdx]?.employmentType) {
                                      const updatedRoles = [...(expFieldErrors.roles || [])];
                                      if (updatedRoles[rIdx]) updatedRoles[rIdx].employmentType = false;
                                      setExpFieldErrors(prev => ({ ...prev, roles: updatedRoles }));
                                    }
                                  }}
                                  placeholder={cmsConfig?.step3?.fields?.employmentType?.placeholder || "Select"}
                                  error={expFieldErrors.roles?.[rIdx]?.employmentType}
                                />
                              </div>
                              <div className="flex items-center mt-6">
                                <input 
                                  type="checkbox" 
                                  id={`current-${cIdx}-${rIdx}`} 
                                  className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500 mr-3 cursor-pointer" 
                                  checked={role.currentCompany || false} 
                                  onChange={e => {
                                    const isChecked = e.target.checked;
                                    const newExp = (formData.experience || []).map((expItem, compI) => ({
                                      ...expItem,
                                      roles: (expItem.roles || []).map((rItem, roleI) => ({
                                        ...rItem,
                                        currentCompany: (compI === cIdx && roleI === rIdx) ? isChecked : false,
                                        leavingDate: (compI === cIdx && roleI === rIdx && isChecked) ? '' : rItem.leavingDate
                                      }))
                                    }));
                                    setFormData({...formData, experience: newExp});
                                  }} 
                                />
                                <label htmlFor={`current-${cIdx}-${rIdx}`} className="text-sm font-bold text-gray-900 cursor-pointer">
                                  {cmsConfig?.step3?.fields?.currentCompany?.label || 'Currently working here'}
                                </label>
                              </div>
                              <div className="space-y-6">
                                <div id={`field-modal-exp-joiningDate-${cIdx}-${rIdx}`}>
                                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Joining <span className="text-red-500">*</span></label>
                                  <div className={expFieldErrors.roles?.[rIdx]?.joiningDate ? 'ring-2 ring-red-500 rounded-xl' : ''}>
                                    <CustomMonthPicker
                                      value={role.joiningDate || ''}
                                      onChange={val => {
                                        const newExp = [...(formData.experience || [])];
                                        newExp[cIdx].roles[rIdx].joiningDate = val;
                                        setFormData({...formData, experience: newExp});
                                        if (expFieldErrors.roles?.[rIdx]?.joiningDate) {
                                          const updatedRoles = [...(expFieldErrors.roles || [])];
                                          if (updatedRoles[rIdx]) updatedRoles[rIdx].joiningDate = false;
                                          setExpFieldErrors(prev => ({ ...prev, roles: updatedRoles }));
                                        }
                                      }}
                                      placeholder="Select joining date"
                                    />
                                  </div>
                                </div>
                                {!role.currentCompany && (
                                  <div id={`field-modal-exp-leavingDate-${cIdx}-${rIdx}`}>
                                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Leaving <span className="text-red-500">*</span></label>
                                    <div className={expFieldErrors.roles?.[rIdx]?.leavingDate ? 'ring-2 ring-red-500 rounded-xl' : ''}>
                                      <CustomMonthPicker
                                        value={role.leavingDate || ''}
                                        onChange={val => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].roles[rIdx].leavingDate = val;
                                          setFormData({...formData, experience: newExp});
                                          if (expFieldErrors.roles?.[rIdx]?.leavingDate) {
                                            const updatedRoles = [...(expFieldErrors.roles || [])];
                                            if (updatedRoles[rIdx]) updatedRoles[rIdx].leavingDate = false;
                                            setExpFieldErrors(prev => ({ ...prev, roles: updatedRoles }));
                                          }
                                        }}
                                        placeholder="Select leaving date"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Role Description</label>
                                <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 h-24 resize-none outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={role.roleDescription || ''} onChange={e => {
                                  const newExp = [...(formData.experience || [])];
                                  newExp[cIdx].roles[rIdx].roleDescription = e.target.value;
                                  setFormData({...formData, experience: newExp});
                                }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="relative pl-6">
                        <div className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-gray-300 border-2 border-gray-50"></div>
                        <button type="button" onClick={() => {
                          const newExp = [...(formData.experience || [])];
                          newExp[cIdx].roles.push({ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' });
                          setFormData({...formData, experience: newExp});
                        }} className="flex items-center gap-1 text-sm font-bold text-green-600 hover:text-green-700 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                          Add Role
                        </button>
                      </div>
                    </div>

                    {hasCurrentRole && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <label className="block text-sm font-bold text-gray-900 mb-1.5">{cmsConfig?.step3?.fields?.noticePeriod?.label || 'Notice Period'}</label>
                        <div className="w-full md:w-1/2">
                          <CustomDropdown
                            options={(cmsConfig?.step3?.noticePeriodOptions || cmsConfig?.step4?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS).map(opt => ({ value: typeof opt === 'string' ? opt : opt.value, label: typeof opt === 'string' ? opt : opt.label }))}
                            value={exp.noticePeriod || ''}
                            onChange={val => {
                              const newExp = [...(formData.experience || [])];
                              newExp[cIdx].noticePeriod = val;
                              setFormData({...formData, experience: newExp});
                            }}
                            placeholder={cmsConfig?.step3?.fields?.noticePeriod?.placeholder || "Select"}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end mt-4">
                      <button 
                        type="button"
                        onClick={() => {
                          const valRes = validateExperienceData(cIdx);
                          if (!valRes.isValid) {
                            setExpFieldErrors(valRes.errors);
                            scrollToTarget(valRes.targetFieldId);
                            return;
                          }
                          setExpFieldErrors({});
                          setExpError('');
                          setExpandedExpIndex(-1);
                        }} 
                        className="px-6 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4">
                {formData.isFresher !== true && (
                  <div className="flex items-center gap-3">
                    {expError && <span className="text-red-500 text-xs font-medium">{expError}</span>}
                    <button type="button" onClick={handleAddExperience} className="text-green-500 font-semibold hover:text-green-600 text-sm whitespace-nowrap">
                      Add +
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Step4Professional = () => {
    const p = formData.professionalDetails || {};
    const setP = (field, val) => setFormData({...formData, professionalDetails: {...p, [field]: val}});
    return (
      <div className="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pb-2">
        <div className="mb-6 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Professional Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Designation <span className="text-red-500">*</span></label>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={p.currentDesignation || ''} onChange={e => setP('currentDesignation', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">LinkedIn Profile URL <span className="text-red-500">*</span></label>
            <input type="url" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={p.linkedinUrl || ''} onChange={e => setP('linkedinUrl', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Location <span className="text-red-500">*</span></label>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={p.currentLocation || ''} onChange={e => setP('currentLocation', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Salary <span className="text-red-500">*</span></label>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder={`e.g. ${getCurrencySymbol(p.currency)}5,00,000`} value={p.currentSalary || ''} onChange={e => setP('currentSalary', formatIndianNumber(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Expected Salary <span className="text-red-500">*</span></label>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder={`e.g. ${getCurrencySymbol(p.currency)}6,00,000`} value={p.expectedSalary || ''} onChange={e => setP('expectedSalary', formatIndianNumber(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Skills <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(p.skills ? p.skills.split(',').filter(s => s.trim()) : []).map(skill => (
                <span key={skill} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors" onClick={() => removeSkill(skill)} title="Click to remove">
                  {skill} <span className="text-[10px]">✕</span>
                </span>
              ))}
            </div>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="Type a skill and hit Enter" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Preferred Locations</label>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="Bangalore, Pune..." value={p.preferredLocations || ''} onChange={e => setP('preferredLocations', e.target.value)} />
          </div>
        </div>
      </div>
    );
  };

  const Step5Documents = () => {
    const docs = formData.documents || {};
    const setDoc = (field, val) => setFormData({...formData, documents: {...docs, [field]: val}});
    return (
      <div className="space-y-6 animate-fade-in pb-2">
        <div className="mb-6 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Documents & Media</h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage your introductory video, resume, and cover letter.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Resume Upload Card */}
          <div className="p-5 border border-gray-200 rounded-2xl bg-white shadow-2xs space-y-3">
            <label className="block text-sm font-bold text-gray-900">
              Upload Resume <span className="text-red-500">*</span>
            </label>
            <div>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer transition-all" 
                onChange={e => setDoc('resume', e.target.files[0]?.name || '')} 
              />
            </div>
            <p className="text-xs text-gray-700 font-medium">Supported Formats: doc, docx, pdf, upto 300KB</p>
            {docs.resume && (
              <div className="flex items-center justify-between mt-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 truncate block">
                      {docs.resume}
                    </span>
                    <p className="text-[11px] text-gray-500 font-medium">Uploaded Document</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setDoc('resume', '')} 
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer"
                  title="Remove Resume"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Cover Letter Upload Card */}
          <div className="p-5 border border-gray-200 rounded-2xl bg-white shadow-2xs space-y-3">
            <label className="flex items-center justify-between text-sm font-bold text-gray-900">
              <span>Upload Cover Letter</span>
              <span className="text-gray-400 font-medium text-xs">(Optional)</span>
            </label>
            <div>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer transition-all" 
                onChange={e => setDoc('coverLetter', e.target.files[0]?.name || '')} 
              />
            </div>
            <p className="text-xs text-gray-700 font-medium">Supported Formats: doc, docx, pdf, upto 300KB</p>
            {docs.coverLetter && (
              <div className="flex items-center justify-between mt-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-xs sm:text-sm font-bold text-gray-900 truncate block">
                      {docs.coverLetter}
                    </span>
                    <p className="text-[11px] text-gray-500 font-medium">Uploaded Document</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setDoc('coverLetter', '')} 
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer"
                  title="Remove Cover Letter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Step6Review = () => {
    const p = formData.professionalDetails || {};
    return (
      <div className="space-y-6 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-sm bg-blue-50/30 p-4 rounded-xl border border-blue-100">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-palette-900 mb-2">Final Review (Page 6)</h3>
          <p className="text-gray-500">Please review all the details you filled in before submitting.</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Basic Details</h4>
          <p><span className="font-semibold text-gray-600">Name:</span> {(formData.firstName || formData.lastName) ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim() : 'N/A'}</p>
          <p><span className="font-semibold text-gray-600">Phone:</span> {formData.phone || 'N/A'}</p>
          <p><span className="font-semibold text-gray-600">Email:</span> {formData.email || 'N/A'}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Education</h4>
          {(!formData.qualifications || formData.qualifications.length === 0) ? (
            <p className="text-gray-500 italic">N/A</p>
          ) : (
            formData.qualifications.map((q, i) => (
              <p key={i}>• {q.stream || 'N/A'} from {q.school || 'N/A'} ({q.startYear || 'N/A'}-{q.endYear || 'N/A'}) - {q.percentage || 'N/A'}</p>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Work Experience</h4>
          {formData.isFresher ? (
            <p className="font-medium text-palette-900">Fresher</p>
          ) : (!formData.experience || formData.experience.length === 0) ? (
            <p className="text-gray-500 italic">N/A</p>
          ) : (
            formData.experience.map((e, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <p className="font-bold text-palette-900">{e.companyName || 'N/A'}</p>
                <div className="pl-3 mt-1 border-l-2 border-gray-200 space-y-2">
                  {e.roles && e.roles.length > 0 ? e.roles.map((r, rIdx) => (
                    <div key={rIdx}>
                      <p className="font-semibold text-gray-700">• {r.jobTitle || 'N/A'}</p>
                      <p className="text-gray-500 text-xs pl-3">({r.joiningDate ? r.joiningDate.split('-').reverse().join('/') : 'N/A'} to {r.currentCompany ? 'Present' : (r.leavingDate ? r.leavingDate.split('-').reverse().join('/') : 'N/A')})</p>
                    </div>
                  )) : (
                    <p className="text-gray-500 italic text-xs">Roles: N/A</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Professional Details</h4>
          <div className="grid grid-cols-2 gap-3">
            <p><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Designation</span> {p.currentDesignation || 'N/A'}</p>
            <p><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Current Salary</span> {p.currentSalary || 'N/A'}</p>
            <p><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Expected Salary</span> {p.expectedSalary || 'N/A'}</p>
            <p><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Current Location</span> {p.currentLocation || 'N/A'}</p>
            <p className="col-span-2"><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Preferred Locations</span> {p.preferredLocations || 'N/A'}</p>
            <p className="col-span-2"><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Skills</span> {p.skills || 'N/A'}</p>
            <p className="col-span-2"><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">LinkedIn</span> {p.linkedinUrl || 'N/A'}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Documents</h4>
          <p className="flex items-center gap-2 text-green-700 font-bold bg-green-50 p-2 rounded-lg w-max">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            Resume Ready
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-20 inset-x-0 bottom-0 z-[40] flex flex-col md:flex-row bg-white overflow-hidden border-t border-gray-200">
      <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Form Section */}
        <div className="w-full md:w-[60%] flex flex-col h-full bg-white relative z-10 overflow-hidden border-r border-gray-200">
          <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
            {/* Header & Progress (Hide on submit) */}
            {!isSubmitted && (
              <div className="pt-4 pb-4 px-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex justify-end items-center mb-3">
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-bold inline-block py-1 px-3 uppercase rounded-full text-green-700 bg-green-50">
                        {isOldUser ? Math.round((fastStep / totalFastSteps) * 100) : Math.round((currentStep / totalSteps) * 100)}% Completed
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-100">
                    <div style={{ width: `${isOldUser ? (fastStep / totalFastSteps) * 100 : (currentStep / totalSteps) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Body */}
            <div className="px-6 py-4 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
              {isSubmitted ? (
                <SuccessScreen />
              ) : (
              <form id="applicationForm" onSubmit={handleSubmit} className="flex flex-col flex-1">
                {isLoadingReview ? (
                  <LoadingReview />
                ) : isOldUser ? (
                  <>
                    {fastStep === 1 && FastStep1Experience()}
                    {fastStep === 2 && FastStep2Resume()}
                    {hasQuestions && fastStep === 3 && StepQuestions()}
                    {fastStep === totalFastSteps && FastStep3Review()}
                  </>
                ) : (
                  <>
                    {currentStep === 1 && Step1BasicDetails()}
                    {currentStep === 2 && Step2Education()}
                    {currentStep === 3 && Step3Experience()}
                    {currentStep === 4 && Step4Professional()}
                    {currentStep === 5 && Step5Documents()}
                    {hasQuestions && currentStep === 6 && StepQuestions()}
                    {currentStep === totalSteps && Step6Review()}
                  </>
                )}

                {/* Footer Actions */}
                {!isLoadingReview && (
                  <div className="mt-5 flex flex-col gap-3">
                    {submitError && (
                      <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-semibold border border-red-100 text-center mb-2">
                        {submitError}
                      </div>
                    )}
                    {(isOldUser ? fastStep < totalFastSteps : currentStep < totalSteps) ? (
                      <button 
                        type="button" 
                        onClick={handleNext}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-sm hover:bg-green-700 transition-colors"
                      >
                        {isOldUser ? 'Continue' : 'Save & Continue'}
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        form="applicationForm"
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-sm hover:bg-green-700 transition-colors"
                      >
                        Submit Application
                      </button>
                    )}
                    
                    {(isOldUser ? fastStep > 1 : currentStep > 1) && (
                      <button 
                        type="button" 
                        onClick={handleBack} 
                        className="w-full py-3 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                      >
                        Back
                      </button>
                    )}
                  </div>
              )}
            </form>
            )}
          </div>
          </div>
        </div>

        {/* Right Job Preview Section */}
        <div className="hidden md:flex md:w-[40%] bg-gray-50 flex-col h-full border-l border-gray-200 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-sm text-gray-900 space-y-5">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-50 text-green-700 font-bold rounded-full border border-green-200 flex items-center justify-center text-base overflow-hidden">
                  {(job.companyLogo || job.employerId?.companyLogo) ? (
                    <img src={job.companyLogo || job.employerId?.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                  ) : (
                    job.companyInitial || (job.company ? job.company.charAt(0).toUpperCase() : 'J')
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm">{job.company}</h3>
                  <p className="text-xs text-gray-500">{job.location}</p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-snug">{job.title}</h2>
            </div>

            {/* Badges / Key Metadata */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-lg font-medium">
                {job.location}
              </span>
              <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                {job.details?.workLocation || 'On-site'}
              </span>
              <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {(job.details?.openings || job.openings || '1')} {Number(job.details?.openings || job.openings || 1) === 1 ? 'Opening' : 'Openings'}
              </span>
              {(job.details?.employmentType || job.employmentType) && (
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                  {job.details?.employmentType || job.employmentType}
                </span>
              )}
              {(job.details?.experience || job.experience) && (
                <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                  {job.details?.experience || job.experience} Experience
                </span>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Compensation */}
            {job.salary && (
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-0.5">Pay / Salary</p>
                <p className="text-base font-bold text-gray-900">
                  {job.salary} {job.details?.employmentType === 'Full-time' && !job.salary.toLowerCase().includes('month') && !job.salary.toLowerCase().includes('year') && !job.salary.toLowerCase().includes('hour') ? 'per month' : ''}
                </p>
              </div>
            )}

            {/* Job Description */}
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-2">Job Description</h4>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">
                {job.details?.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Qualifications */}
            {job.qualifications && job.qualifications.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-2">Qualifications</h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
                  {job.qualifications.map((q, idx) => (
                    <li key={idx}>{q.name || q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.details?.benefits && job.details.benefits.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 text-sm mb-2">Benefits & Perks</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.details.benefits.map((b, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-[11px] px-2.5 py-1 rounded-md font-medium">
                      {typeof b === 'object' ? (b.name || b.label) : b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Resume Preview Modal Popup */}
      {isResumePreviewOpen && createPortal(
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 cursor-pointer"
            onClick={() => setIsResumePreviewOpen(false)}
          />
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200 z-10">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden mr-2">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 border border-green-200 flex items-center justify-center font-bold shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">
                    {getCleanFileName(fastFormData.resume || formData.documents?.resume || formData.resume)}
                  </h3>
                  <p className="text-xs text-gray-500">Resume Preview</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {(fastFormData.resume || formData.documents?.resume || formData.resume)?.startsWith('http') && (
                  <button
                    type="button"
                    onClick={handleDownloadResume}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsResumePreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  title="Close preview"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body / PDF Viewer with pure white background and clean presentation */}
            <div className="flex-1 bg-white p-0 overflow-hidden relative flex flex-col items-center justify-center">
              {(() => {
                const currentResume = fastFormData.resume || formData.documents?.resume || formData.resume;
                if (currentResume && (currentResume.startsWith('http') || currentResume.startsWith('blob:') || currentResume.startsWith('data:'))) {
                  const viewerUrl = currentResume.includes('google.com')
                    ? currentResume 
                    : `https://docs.google.com/viewer?url=${encodeURIComponent(currentResume)}&embedded=true`;

                  return (
                    <div className="relative w-full h-full bg-white overflow-hidden">
                      <iframe
                        src={viewerUrl}
                        title="Resume Preview"
                        className="w-full h-full border-0 bg-white"
                        style={{ border: 'none', background: '#ffffff', width: '100%', height: '100%' }}
                      />
                    </div>
                  );
                }
                return (
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center max-w-md shadow-xs">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">{currentResume || 'Resume Ready'}</h4>
                    <p className="text-xs text-gray-500 mb-4">This resume is attached and ready to submit with your application.</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default JobApplicationModal;
