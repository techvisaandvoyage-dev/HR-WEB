import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { uploadFileToStorage } from '../../utils/firebaseStorage';
import { getEmployeeStoredValue, setEmployeeStoredValue } from '../../utils/employeeStorage';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India (+91)' },
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States (+1)' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom (+44)' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'United Arab Emirates (+971)' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada (+1)' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia (+61)' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany (+49)' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France (+33)' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore (+65)' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia (+966)' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'Qatar (+974)' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'Oman (+968)' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'Kuwait (+965)' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'Bahrain (+973)' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan (+81)' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China (+86)' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea (+82)' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan (+92)' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh (+880)' },
  { code: '+94', country: 'LK', flag: '🇱🇰', name: 'Sri Lanka (+94)' },
  { code: '+977', country: 'NP', flag: '🇳🇵', name: 'Nepal (+977)' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia (+60)' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia (+62)' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines (+63)' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam (+84)' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand (+66)' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa (+27)' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt (+20)' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria (+234)' },
  { code: '+254', country: 'KE', flag: '🇰🇪', name: 'Kenya (+254)' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil (+55)' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico (+52)' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina (+54)' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile (+56)' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia (+57)' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain (+34)' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy (+39)' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands (+31)' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland (+41)' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden (+46)' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Norway (+47)' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Denmark (+45)' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finland (+358)' },
  { code: '+353', country: 'IE', flag: '🇮🇪', name: 'Ireland (+353)' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Belgium (+32)' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Austria (+43)' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland (+48)' },
  { code: '+420', country: 'CZ', flag: '🇨🇿', name: 'Czech Republic (+420)' },
  { code: '+36', country: 'HU', flag: '🇭🇺', name: 'Hungary (+36)' },
  { code: '+40', country: 'RO', flag: '🇷🇴', name: 'Romania (+40)' },
  { code: '+30', country: 'GR', flag: '🇬🇷', name: 'Greece (+30)' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal (+351)' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey (+90)' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia (+7)' },
  { code: '+380', country: 'UA', flag: '🇺🇦', name: 'Ukraine (+380)' },
  { code: '+972', country: 'IL', flag: '🇮🇱', name: 'Israel (+972)' },
  { code: '+961', country: 'LB', flag: '🇱🇧', name: 'Lebanon (+961)' },
  { code: '+962', country: 'JO', flag: '🇯🇴', name: 'Jordan (+962)' },
  { code: '+964', country: 'IQ', flag: '🇮🇶', name: 'Iraq (+964)' },
  { code: '+98', country: 'IR', flag: '🇮🇷', name: 'Iran (+98)' },
  { code: '+93', country: 'AF', flag: '🇦🇫', name: 'Afghanistan (+93)' },
  { code: '+994', country: 'AZ', flag: '🇦🇿', name: 'Azerbaijan (+994)' },
  { code: '+995', country: 'GE', flag: '🇬🇪', name: 'Georgia (+995)' },
  { code: '+996', country: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan (+996)' },
  { code: '+998', country: 'UZ', flag: 'UZ', name: 'Uzbekistan (+998)' },
  { code: '+852', country: 'HK', flag: '🇭🇰', name: 'Hong Kong (+852)' },
  { code: '+886', country: 'TW', flag: '🇹🇼', name: 'Taiwan (+886)' },
  { code: '+853', country: 'MO', flag: '🇲🇴', name: 'Macau (+853)' },
  { code: '+855', country: 'KH', flag: '🇰🇭', name: 'Cambodia (+855)' },
  { code: '+856', country: 'LA', flag: '🇱🇦', name: 'Laos (+856)' },
  { code: '+95', country: 'MM', flag: '🇲🇲', name: 'Myanmar (+95)' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', name: 'New Zealand (+64)' },
  { code: '+679', country: 'FJ', flag: '🇫🇯', name: 'Fiji (+679)' },
  { code: '+212', country: 'MA', flag: '🇲🇦', name: 'Morocco (+212)' },
  { code: '+213', country: 'DZ', flag: '🇩🇿', name: 'Algeria (+213)' },
  { code: '+216', country: 'TN', flag: '🇹🇳', name: 'Tunisia (+216)' },
  { code: '+233', country: 'GH', flag: '🇬🇭', name: 'Ghana (+233)' },
  { code: '+237', country: 'CM', flag: '🇨🇲', name: 'Cameroon (+237)' },
  { code: '+251', country: 'ET', flag: '🇪🇹', name: 'Ethiopia (+251)' },
  { code: '+255', country: 'TZ', flag: '🇹🇿', name: 'Tanzania (+255)' },
  { code: '+256', country: 'UG', flag: '🇺🇬', name: 'Uganda (+256)' },
  { code: '+260', country: 'ZM', flag: '🇿🇲', name: 'Zambia (+260)' },
  { code: '+263', country: 'ZW', flag: '🇿🇼', name: 'Zimbabwe (+263)' }
];

const DirectJobApply = ({ onAuthSuccess }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  // Job data & loading
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState('');

  // Current Step: 1: Auth, 2: Questions & CV, 3: Review, 4: Success
  const [step, setStep] = useState(1);

  // User auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  // Auth form state (Step 1)
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authMobile, setAuthMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authFieldErrors, setAuthFieldErrors] = useState({});
  const [authLoading, setAuthLoading] = useState(false);

  // Custom Country Code Dropdown State
  const countryDropdownRef = useRef(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountryObj = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  const filteredCountryCodes = COUNTRY_CODES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch) || 
    c.country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const hasLowercase = /[a-z]/.test(authPassword);
  const hasUppercase = /[A-Z]/.test(authPassword);
  const hasNumber = /[0-9]/.test(authPassword);
  const hasMinLength = authPassword.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(authPassword);

  // Registration OTP State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleOtpChange = (index, value) => {
    // Handle paste of full 4-digit code
    if (value.length > 1) {
      const pasteData = value.replace(/\D/g, '').slice(0, 4).split('');
      const newOtp = [...otp];
      pasteData.forEach((char, idx) => {
        if (index + idx < 4) newOtp[index + idx] = char;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + pasteData.length, 3);
      document.getElementById(`apply-otp-${nextIdx}`)?.focus();
      return;
    }

    const val = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Clear error
    if (authError) setAuthError('');

    // Auto move to next input
    if (val && index < 3) {
      document.getElementById(`apply-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`apply-otp-${index - 1}`)?.focus();
    }
  };

  // Screening questions (Step 2)
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [questionsError, setQuestionsError] = useState('');
  const [questionFieldErrors, setQuestionFieldErrors] = useState({});

  // CV / Resume (Step 3)
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvError, setCvError] = useState('');
  const [showCvModal, setShowCvModal] = useState(false);
  const fileInputRef = useRef(null);

  // Submission state (Step 4 & 5)
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Dynamic CMS Configuration from Admin
  const [cmsConfig, setCmsConfig] = useState(null);

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const json = await res.json();
        if (json.success && json.data?.directJobApply) {
          setCmsConfig(json.data.directJobApply);
        }
      } catch (e) {
        console.error('Error fetching directJobApply CMS:', e);
      }
    };
    fetchCms();
  }, []);

  const general = cmsConfig?.general || {};
  const stepper = cmsConfig?.stepper || {};
  const s1 = cmsConfig?.step1 || {};
  const s2 = cmsConfig?.step2 || {};
  const s3 = cmsConfig?.step3 || {};
  const s4 = cmsConfig?.step4 || {};
  const s5 = cmsConfig?.step5 || {};
  const maxLimitKb = s3.maxFileSizeKb || 300;

  // Dynamic field configuration helper
  const getFieldConfig = (key, defaultLabel, defaultPlaceholder, defaultRequired = true) => {
    const f = s1.fields?.[key];
    if (f) {
      return {
        label: f.label || defaultLabel,
        placeholder: f.placeholder || defaultPlaceholder,
        isRequired: f.isRequired !== undefined ? f.isRequired : defaultRequired
      };
    }
    // Fallback to top-level legacy keys
    if (key === 'name') {
      return {
        label: s1.fullNameLabel || defaultLabel,
        placeholder: s1.fullNamePlaceholder || defaultPlaceholder,
        isRequired: s1.fullNameRequired !== undefined ? s1.fullNameRequired : defaultRequired
      };
    }
    if (key === 'email') {
      return {
        label: s1.emailLabel || defaultLabel,
        placeholder: s1.emailPlaceholder || defaultPlaceholder,
        isRequired: s1.emailRequired !== undefined ? s1.emailRequired : defaultRequired
      };
    }
    if (key === 'mobile') {
      return {
        label: s1.mobileLabel || defaultLabel,
        placeholder: s1.mobilePlaceholder || defaultPlaceholder,
        isRequired: s1.mobileRequired !== undefined ? s1.mobileRequired : defaultRequired
      };
    }
    if (key === 'password') {
      return {
        label: s1.passwordLabel || defaultLabel,
        placeholder: s1.passwordPlaceholder || defaultPlaceholder,
        isRequired: s1.passwordRequired !== undefined ? s1.passwordRequired : defaultRequired
      };
    }
    if (key === 'confirmPassword') {
      return {
        label: s1.confirmPasswordLabel || defaultLabel,
        placeholder: s1.confirmPasswordPlaceholder || defaultPlaceholder,
        isRequired: s1.confirmPasswordRequired !== undefined ? s1.confirmPasswordRequired : defaultRequired
      };
    }
    if (key === 'loginEmail') {
      return {
        label: s1.emailLabel || defaultLabel,
        placeholder: s1.emailPlaceholder || defaultPlaceholder,
        isRequired: true
      };
    }
    if (key === 'loginPassword') {
      return {
        label: s1.passwordLabel || defaultLabel,
        placeholder: s1.passwordPlaceholder || defaultPlaceholder,
        isRequired: true
      };
    }
    return {
      label: defaultLabel,
      placeholder: defaultPlaceholder,
      isRequired: defaultRequired
    };
  };

  const nameConfig = getFieldConfig('name', 'Full Name', 'What is your name?', true);
  const emailConfig = getFieldConfig('email', 'Email ID', 'Tell us your Email ID', true);
  const mobileConfig = getFieldConfig('mobile', 'Mobile number', 'Enter your mobile number', false);
  const passwordConfig = getFieldConfig('password', 'Password', 'Create a strong password', true);
  const confirmPasswordConfig = getFieldConfig('confirmPassword', 'Re-enter password', 'Confirm your password', true);
  const loginEmailConfig = getFieldConfig('loginEmail', 'Email ID', 'Tell us your Email ID', true);
  const loginPasswordConfig = getFieldConfig('loginPassword', 'Password', 'Your password', true);

  // Check initial user login from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('employeeToken');
    const storedUserStr = localStorage.getItem('employeeUser') || localStorage.getItem('user');
    
    if (storedToken) {
      setToken(storedToken);
      if (storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          setUser(parsed);
          if (parsed.resume) {
            setResumeUrl(parsed.resume);
            setResumeName(parsed.resume.split('/').pop().split('?')[0] || 'My_Resume.pdf');
          }
          if (parsed.mobile) setAuthMobile(parsed.mobile);
          if (parsed.name) setAuthName(parsed.name);
          if (parsed.email) setAuthEmail(parsed.email);
        } catch (e) {
          console.error(e);
        }
      }
      // If user already logged in, automatically proceed directly to Step 2 (Questions)
      setStep(2);
      fetchUserProfile(storedToken);
    }
  }, []);

  const fetchUserProfile = async (authToken) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        setUser(prev => ({ ...prev, ...data }));
        if (data.resume) {
          setResumeUrl(data.resume);
          setResumeName(data.resume.split('/').pop().split('?')[0] || 'My_Resume.pdf');
        }
        if (data.phone) setAuthMobile(data.phone);
        if (data.email) setAuthEmail(data.email);
        if (data.firstName) setAuthName(`${data.firstName} ${data.lastName || ''}`.trim());
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      setLoadingJob(true);
      setJobError('');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs/${jobId}`);
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setJob(data.data);
          // Initialize screening answers
          if (data.data.screeningQuestions && data.data.screeningQuestions.length > 0) {
            const initial = {};
            data.data.screeningQuestions.forEach((q, idx) => {
              initial[idx] = '';
            });
            setScreeningAnswers(initial);
          }
        } else {
          setJobError(data.message || 'Job posting not found or has been closed.');
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setJobError('Failed to load job details. Please check your internet connection.');
      } finally {
        setLoadingJob(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  // Handle Candidate Register (Step 1: Validate and Send Email OTP)
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setOtpSuccessMessage('');
    const errors = {};

    if (nameConfig.isRequired && !authName.trim()) {
      errors.name = `Please enter your ${nameConfig.label.toLowerCase() || 'full name'}.`;
    }

    if (emailConfig.isRequired && !authEmail.trim()) {
      errors.email = `Please enter your ${emailConfig.label.toLowerCase() || 'email address'}.`;
    } else if (authEmail.trim() && !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10}$/.test(authEmail.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@gmail.com).';
    }

    const cleanMobile = authMobile.replace(/\D/g, '');
    if (mobileConfig.isRequired && !cleanMobile) {
      errors.mobile = `Please enter your ${mobileConfig.label.toLowerCase() || 'mobile number'}.`;
    } else if (cleanMobile && cleanMobile.length !== 10) {
      errors.mobile = 'Please enter a valid 10-digit mobile number.';
    }

    if (passwordConfig.isRequired && !authPassword) {
      errors.password = 'Please create a password.';
    } else if (authPassword) {
      const isValidPassword = authPassword.length >= 8 && 
                              /[a-z]/.test(authPassword) && 
                              /[A-Z]/.test(authPassword) && 
                              /[0-9]/.test(authPassword) && 
                              /[!@#$%^&*(),.?":{}|<>]/.test(authPassword);
      if (!isValidPassword) {
        errors.password = 'Password must be at least 8 chars long and contain lowercase, uppercase, numeric & special characters.';
      }
    }

    if (confirmPasswordConfig.isRequired && !authConfirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (authConfirmPassword && authPassword !== authConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setAuthFieldErrors(errors);
      setAuthError('Please correct the errors in the form.');
      return;
    }
    setAuthFieldErrors({});

    setAuthLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          mobile: cleanMobile || undefined
        })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field === 'email') {
          setAuthFieldErrors({ email: data.message });
        } else if (data.field === 'mobile') {
          setAuthFieldErrors({ mobile: data.message });
        } else {
          setAuthError(data.message || 'Failed to send verification OTP.');
        }
        setAuthLoading(false);
        return;
      }

      setOtp(['', '', '', '']);
      setResendTimer(data.cooldownSeconds || 30);
      setOtpSuccessMessage('A 4-digit verification code has been sent to your email.');
      setIsOtpStep(true);
    } catch (err) {
      console.error('Send OTP Error:', err);
      setAuthError('Failed to send verification OTP. Please check your internet connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setAuthLoading(true);
    setAuthError('');
    setOtpSuccessMessage('');
    try {
      const cleanMobile = authMobile.replace(/\D/g, '');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          mobile: cleanMobile || undefined
        })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.cooldownRemaining) {
          setResendTimer(data.cooldownRemaining);
        }
        setAuthError(data.message || 'Failed to resend OTP');
      } else {
        setOtp(['', '', '', '']);
        setResendTimer(data.cooldownSeconds || 30);
        setOtpSuccessMessage('Verification OTP resent successfully to your email!');
      }
    } catch (err) {
      console.error('Resend OTP Error:', err);
      setAuthError('Failed to resend OTP. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Verify OTP and Complete Registration
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setOtpSuccessMessage('');
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setAuthError('Please enter the 4-digit OTP sent to your email.');
      return;
    }

    setAuthLoading(true);
    try {
      const cleanMobile = authMobile.replace(/\D/g, '');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName.trim() || authEmail.split('@')[0],
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
          mobile: cleanMobile || undefined,
          otp: enteredOtp
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || 'OTP verification failed. Please try again.');
        setAuthLoading(false);
        return;
      }

      // Save token and user in localStorage
      const authToken = data.token;
      setToken(authToken);
      setUser(data);
      localStorage.setItem('token', authToken);
      localStorage.setItem('employeeToken', authToken);
      localStorage.setItem('employeeUser', JSON.stringify(data));
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('userRole', 'employee');
      setIsOtpStep(false);

      if (onAuthSuccess) onAuthSuccess(data);
 
      // Move to Step 2 (Questions & CV Upload)
      setStep(2);
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setAuthError('Server connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Candidate Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const errors = {};

    if (!authEmail.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!authPassword) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setAuthFieldErrors(errors);
      setAuthError('Please fill in all required fields marked with *');
      return;
    }
    setAuthFieldErrors({});

    setAuthLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          password: authPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const authToken = data.token;
        setToken(authToken);
        setUser(data);
        localStorage.setItem('token', authToken);
        localStorage.setItem('employeeToken', authToken);
        localStorage.setItem('employeeUser', JSON.stringify(data));
        localStorage.setItem('userRole', 'employee');

        if (data.profile?.resume) {
          setResumeUrl(data.profile.resume);
          setResumeName(data.profile.resume.split('/').pop().split('?')[0] || 'My_Resume.pdf');
        }
        if (data.mobile) setAuthMobile(data.mobile);
        if (data.name) setAuthName(data.name);

        if (onAuthSuccess) onAuthSuccess(data);

        // Move to Step 2
        setStep(2);
      } else {
        setAuthError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Google Login / Registration
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const authToken = data.token;
        setToken(authToken);
        setUser(data);
        localStorage.setItem('token', authToken);
        localStorage.setItem('employeeToken', authToken);
        localStorage.setItem('employeeUser', JSON.stringify(data));
        localStorage.setItem('userRole', 'employee');

        if (data.profile?.resume) {
          setResumeUrl(data.profile.resume);
          setResumeName(data.profile.resume.split('/').pop().split('?')[0] || 'My_Resume.pdf');
        }
        if (data.mobile || data.phone) setAuthMobile(data.mobile || data.phone || '');
        if (data.name) setAuthName(data.name);
        if (data.email) setAuthEmail(data.email);

        if (onAuthSuccess) onAuthSuccess(data);

        // Move to Step 2
        setStep(2);
      } else {
        setAuthError(data.message || 'Google login failed');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google authentication failed');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Continue with already logged-in account
  const handleContinueAsLoggedIn = () => {
    setStep(2);
  };

  // Logout/switch account
  const handleSwitchAccount = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeUser');
    setUser(null);
    setToken('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirmPassword('');
    setAuthName('');
    setAuthMobile('');
    setResumeUrl('');
    setResumeName('');
    setStep(1);
  };

  // Handle screening answer change & clear individual error
  const handleAnswerChange = (idx, value) => {
    setScreeningAnswers(prev => ({ ...prev, [idx]: value }));
    if (questionFieldErrors[idx]) {
      setQuestionFieldErrors(prev => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  // Step 2: Validate Questions + CV and move to Step 3 (Review)
  const handleStep2Submit = () => {
    setQuestionsError('');
    setCvError('');
    const newFieldErrors = {};
    let firstErrorIdx = null;

    if (job?.screeningQuestions && job.screeningQuestions.length > 0) {
      for (let i = 0; i < job.screeningQuestions.length; i++) {
        const q = job.screeningQuestions[i];
        const ans = screeningAnswers[i];
        if (q.required !== false && (!ans || String(ans).trim() === '')) {
          newFieldErrors[i] = `Please provide an answer for this question.`;
          if (firstErrorIdx === null) firstErrorIdx = i;
        }
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setQuestionFieldErrors(newFieldErrors);
      setQuestionsError('Please answer the required question(s) highlighted in red below.');
      
      // Auto-scroll smoothly to first error element
      setTimeout(() => {
        const el = document.getElementById(`question_card_${firstErrorIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setQuestionFieldErrors({});

    if (!resumeUrl) {
      setCvError('CV / Resume upload is compulsory. Please attach your resume to continue.');
      setTimeout(() => {
        const el = document.getElementById('cv_upload_section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setStep(3);
  };

  // Handle CV Upload (Firebase or fallback)
  const handleCvFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size from CMS (default 300KB)
    if (file.size > maxLimitKb * 1024) {
      setCvError(`File size exceeds ${maxLimitKb}KB limit. Please upload a smaller file (Max ${maxLimitKb}KB).`);
      return;
    }

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setCvError('Invalid format. Please upload PDF, DOC, or DOCX file.');
      return;
    }

    setCvError('');
    setUploadingResume(true);
    setUploadProgress(10);

    try {
      const downloadURL = await uploadFileToStorage(file, 'resumes', (progress) => {
        setUploadProgress(progress);
      });

      if (downloadURL) {
        setResumeUrl(downloadURL);
        setResumeName(file.name);
        setUploadProgress(100);
      } else {
        setCvError('Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('CV upload error:', err);
      setCvError('Error uploading resume. Please try again.');
    } finally {
      setUploadingResume(false);
    }
  };

  // Step 3: Final Submit Application
  const handleSubmitFinalApplication = async () => {
    setSubmitting(true);
    setSubmitError('');

    const formattedAnswers = job?.screeningQuestions?.map((sq, i) => ({
      question: sq.question,
      answer: screeningAnswers[i] || ''
    })) || [];

    try {
      const activeToken = token || localStorage.getItem('token') || localStorage.getItem('employeeToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          screeningAnswers: formattedAnswers,
          resume: resumeUrl,
          mobile: authMobile || user?.mobile || user?.phone,
          name: authName || user?.name
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Sync appliedJobs in scoped storage so MyJobs immediately reflects this application as 'Applied'
        try {
          const jobIdentifier = job?._id || job?.id || jobId;
          let appliedList = getEmployeeStoredValue('appliedJobs', []);
          if (!appliedList.some(a => String(a.id) === String(jobIdentifier))) {
            appliedList.unshift({
              id: jobIdentifier,
              status: 'Applied',
              date: new Date().toLocaleDateString(),
              jobDetails: job ? { ...job, id: jobIdentifier, _id: jobIdentifier } : null
            });
            setEmployeeStoredValue('appliedJobs', appliedList);
          }
          localStorage.removeItem('appliedJobs');
        } catch (storageErr) {
          console.error('Error saving appliedJobs in localStorage:', storageErr);
        }

        setStep(4); // Success step!
      } else if (data.message && data.message.includes('already applied')) {
        try {
          const jobIdentifier = job?._id || job?.id || jobId;
          let appliedList = getEmployeeStoredValue('appliedJobs', []);
          if (!appliedList.some(a => String(a.id) === String(jobIdentifier))) {
            appliedList.unshift({
              id: jobIdentifier,
              status: 'Applied',
              date: new Date().toLocaleDateString(),
              jobDetails: job ? { ...job, id: jobIdentifier, _id: jobIdentifier } : null
            });
            setEmployeeStoredValue('appliedJobs', appliedList);
          }
          localStorage.removeItem('appliedJobs');
        } catch (storageErr) {
          console.error('Error saving appliedJobs in localStorage:', storageErr);
        }

        setAlreadyApplied(true);
        setStep(4);
      } else {
        setSubmitError(data.message || 'Failed to submit application. Please try again.');
      }
    } catch (err) {
      console.error('Submit application error:', err);
      setSubmitError('Connection error while submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading Screen
  if (loadingJob) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium text-sm animate-pulse">Loading Job Application...</p>
      </div>
    );
  }

  // Job Error / Not Found Screen
  if (jobError || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900">Job Not Available</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {jobError || "This job posting is no longer active or could not be found."}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
            >
              Browse Active Jobs on SahiJob
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-green-700 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
              S
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-green-700 transition-colors">
              sahijob<span className="text-[#29953f]">.com</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
            <span className="hidden sm:inline">{general.portalBadgeText || 'Direct Application Portal'}</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
              {general.verifiedJobBadgeText || 'Verified Job'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        
        {/* Job Header Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-2xl shrink-0 overflow-hidden shadow-xs">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                job.companyInitial || job.company?.charAt(0)?.toUpperCase() || 'J'
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#29953f] uppercase tracking-wider">{general.applyingForLabel || 'Applying For'}</span>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate leading-tight mt-0.5">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium mt-1">
                <span className="font-semibold text-gray-700">{job.company}</span>
                <span>•</span>
                <span>{job.location}</span>
                {job.salary && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">{job.salary}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">
              {job.details?.employmentType || 'Full-Time'}
            </span>
          </div>
        </div>

        {/* Multi-Step Progress Tracker */}
        {step < 4 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
            <div className="grid grid-cols-3 gap-2 text-center relative">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 1 ? 'bg-green-600 text-white' : step === 1 ? 'bg-[#29953f] text-white ring-4 ring-green-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className={`text-[11px] font-bold ${step === 1 ? 'text-green-700' : 'text-gray-500'}`}>
                  {stepper.step1Title || 'Account'}
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 2 ? 'bg-green-600 text-white' : step === 2 ? 'bg-[#29953f] text-white ring-4 ring-green-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <span className={`text-[11px] font-bold ${step === 2 ? 'text-green-700' : 'text-gray-500'}`}>
                  {stepper.step2Title ? stepper.step2Title.replace(/\s*\*/g, '') : 'Details'}
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 3 ? 'bg-[#29953f] text-white ring-4 ring-green-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  3
                </div>
                <span className={`text-[11px] font-bold ${step === 3 ? 'text-green-700' : 'text-gray-500'}`}>
                  {stepper.step4Title || stepper.step3Title || 'Review'}
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: AUTHENTICATION (LOGIN OR REGISTER)                                 */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
            
            {/* If user is already logged in */}
            {user && token ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-green-100">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {s1.loggedInWelcomeTitle || 'Welcome back'}, {user.name || user.firstName || 'Candidate'}!
                  </h3>
                  <p className="text-sm text-gray-500">
                    Logged in with <span className="font-semibold text-gray-800">{user.email}</span>
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleContinueAsLoggedIn}
                    className="w-full sm:w-auto px-8 py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-full transition-all shadow-sm cursor-pointer"
                  >
                    {(s1.continueAsBtnText || 'Continue Application →').replace('{name}', user.name || user.firstName || 'Candidate')}
                  </button>
                  <button
                    onClick={handleSwitchAccount}
                    className="w-full sm:w-auto px-5 py-3 text-gray-500 hover:text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {s1.switchAccountBtnText || 'Switch Account / Logout'}
                  </button>
                </div>
              </div>
            ) : isOtpStep ? (
              <div className="max-w-md mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Registration Email OTP Verification View */}
                <div className="text-center space-y-1.5">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100 shadow-xs">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Verify Your Email Address</h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    We have sent a 4-digit verification code to <span className="font-bold text-gray-900">{authEmail}</span>
                  </p>
                </div>

                {/* Success Notification */}
                {otpSuccessMessage && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 animate-in fade-in duration-200">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{otpSuccessMessage}</span>
                  </div>
                )}

                {/* Error Notification */}
                {authError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 animate-in fade-in duration-200">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{authError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtpAndRegister} className="space-y-6">
                  {/* 4-Digit OTP Boxes */}
                  <div className="flex justify-center gap-3 sm:gap-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`apply-otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        autoFocus={index === 0}
                        className="w-14 h-14 text-center text-2xl font-black text-gray-900 rounded-2xl border border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none transition-all shadow-xs"
                      />
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3.5 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-full transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'Verify & Continue to Questions →'
                      )}
                    </button>

                    <div className="flex items-center justify-center pt-2">
                      {resendTimer > 0 ? (
                        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Resend OTP in <strong className="text-gray-900 font-bold">{resendTimer}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={authLoading}
                          className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors cursor-pointer disabled:opacity-60"
                        >
                          Resend OTP to Email
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOtpStep(false);
                        setAuthError('');
                        setOtpSuccessMessage('');
                        setOtp(['', '', '', '']);
                      }}
                      className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 font-bold transition-colors cursor-pointer"
                    >
                      ← Back to Edit Registration Details
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{s1.heading || 'Candidate Login / Registration'}</h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {s1.subtitle || 'Please log in or create a free candidate profile to proceed with your application.'}
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-full mb-6 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthError(''); setAuthFieldErrors({}); setIsOtpStep(false); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      authTab === 'login' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {s1.tabLoginText || 'Already Registered? Login'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setAuthError(''); setAuthFieldErrors({}); setIsOtpStep(false); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      authTab === 'register' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {s1.tabRegisterText || 'New Candidate? Register'}
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-center gap-2 max-w-md mx-auto animate-in fade-in duration-200">
                    <span className="font-bold text-red-500">⚠️</span> {authError}
                  </div>
                )}

                {/* Google One-Click Login / Register */}
                <div className="max-w-md mx-auto mb-6 space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                    className="w-full py-3.5 px-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm border border-gray-300 rounded-full transition-all shadow-xs cursor-pointer disabled:opacity-60 hover:shadow-sm"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>{s1.googleBtnText || 'Continue with Google'}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s1.dividerText || 'OR WITH EMAIL'}</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                </div>

                {/* Register Form */}
                {authTab === 'register' && (
                  <form onSubmit={handleRegister} noValidate autoComplete="off" className="space-y-4 max-w-md mx-auto">
                    {/* Full Name Input */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        {nameConfig.label} {nameConfig.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder={nameConfig.placeholder}
                        value={authName}
                        onChange={(e) => {
                          setAuthName(e.target.value);
                          if (authFieldErrors.name) setAuthFieldErrors(prev => ({ ...prev, name: '' }));
                        }}
                        className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm ${
                          authFieldErrors.name
                            ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30'
                            : 'border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
                        }`}
                      />
                      {authFieldErrors.name && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-semibold pl-2 animate-in fade-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{authFieldErrors.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Email ID Input */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        {emailConfig.label} {emailConfig.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                      </label>
                      <input
                        type="email"
                        placeholder={emailConfig.placeholder}
                        value={authEmail}
                        onChange={(e) => {
                          setAuthEmail(e.target.value);
                          if (authFieldErrors.email) setAuthFieldErrors(prev => ({ ...prev, email: '' }));
                        }}
                        className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm ${
                          authFieldErrors.email
                            ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30'
                            : 'border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
                        }`}
                      />
                      {authFieldErrors.email && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-semibold pl-2 animate-in fade-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{authFieldErrors.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Mobile number Input */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        {mobileConfig.label} {mobileConfig.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                      </label>
                      <div className={`flex items-center px-4 py-3.5 rounded-full border transition-all bg-white relative ${
                        authFieldErrors.mobile 
                          ? 'border-red-600 focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 bg-red-50/30' 
                          : 'border-gray-300 focus-within:border-green-600 focus-within:ring-1 focus-within:ring-green-600'
                      }`}>
                        {/* Custom Scrollable Country Code Dropdown */}
                        <div className="relative shrink-0" ref={countryDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                            className="flex items-center gap-1.5 text-gray-900 font-bold border-none outline-none cursor-pointer pr-2 text-sm hover:text-green-700 transition-colors"
                          >
                            <span className="text-xs font-bold text-gray-700">{selectedCountryObj.country}</span>
                            <span className="text-sm font-bold">{selectedCountryObj.code}</span>
                            <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Dropdown Menu Popup */}
                          {isCountryDropdownOpen && (
                            <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                              <div className="p-2.5 border-b border-gray-100 bg-gray-50/80">
                                <input
                                  type="text"
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  placeholder="Search country or code..."
                                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-green-600 text-gray-900"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-52 overflow-y-auto py-1">
                                {filteredCountryCodes.length === 0 ? (
                                  <div className="p-3 text-xs text-center text-gray-400 font-medium">No country found</div>
                                ) : (
                                  filteredCountryCodes.map((c, idx) => (
                                    <button
                                      key={`${c.country}-${c.code}-${idx}`}
                                      type="button"
                                      onClick={() => {
                                        setCountryCode(c.code);
                                        setIsCountryDropdownOpen(false);
                                        setCountrySearch('');
                                      }}
                                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-emerald-50 transition-colors ${c.code === countryCode ? 'bg-emerald-50/80 font-bold text-emerald-900' : 'text-gray-700 font-medium'}`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <span className="text-base leading-none">{c.flag}</span>
                                        <span className="truncate">{c.name}</span>
                                      </div>
                                      <span className="font-semibold text-gray-400 shrink-0 ml-2">{c.code}</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <span className="text-gray-300 mr-2.5 shrink-0">|</span>

                        {/* 10-Digit Max Mobile Input */}
                        <input
                          type="tel"
                          maxLength={10}
                          value={authMobile}
                          onChange={(e) => {
                            setAuthMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                            if (authFieldErrors.mobile) setAuthFieldErrors(prev => ({ ...prev, mobile: '' }));
                          }}
                          placeholder={mobileConfig.placeholder}
                          className="w-full bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 min-w-0 text-sm"
                        />
                      </div>
                      {authFieldErrors.mobile && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-semibold pl-2 animate-in fade-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{authFieldErrors.mobile}</span>
                        </div>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        {passwordConfig.label} {passwordConfig.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={authPassword}
                          onChange={(e) => {
                            setAuthPassword(e.target.value);
                            if (authFieldErrors.password) setAuthFieldErrors(prev => ({ ...prev, password: '' }));
                          }}
                          placeholder={passwordConfig.placeholder}
                          className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all pr-12 placeholder-gray-400 text-sm ${
                            authFieldErrors.password
                              ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30'
                              : 'border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Dynamic Password Checklist */}
                      {authPassword.length > 0 && (
                        <div className="mt-3 pl-3 space-y-2">
                          <div className={`flex items-center text-xs font-semibold transition-colors duration-200 ${hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {hasLowercase ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                            </svg>
                            <span className="ml-2.5">At least one lowercase letter</span>
                          </div>
                          <div className={`flex items-center text-xs font-semibold transition-colors duration-200 ${hasMinLength ? 'text-green-500' : 'text-gray-400'}`}>
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {hasMinLength ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                            </svg>
                            <span className="ml-2.5">Minimum 8 characters</span>
                          </div>
                          <div className={`flex items-center text-xs font-semibold transition-colors duration-200 ${hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {hasUppercase ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                            </svg>
                            <span className="ml-2.5">At least one uppercase letter</span>
                          </div>
                          <div className={`flex items-center text-xs font-semibold transition-colors duration-200 ${hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {hasNumber ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                            </svg>
                            <span className="ml-2.5">At least one number</span>
                          </div>
                          <div className={`flex items-center text-xs font-semibold transition-colors duration-200 ${hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`}>
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {hasSpecialChar ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                            </svg>
                            <span className="ml-2.5">At least one special character</span>
                          </div>
                        </div>
                      )}

                      {authFieldErrors.password && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-semibold pl-2 animate-in fade-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{authFieldErrors.password}</span>
                        </div>
                      )}
                    </div>

                    {/* Re-enter password Input */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        {confirmPasswordConfig.label} {confirmPasswordConfig.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={authConfirmPassword}
                          onChange={(e) => {
                            setAuthConfirmPassword(e.target.value);
                            if (authFieldErrors.confirmPassword) setAuthFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                          }}
                          placeholder={confirmPasswordConfig.placeholder}
                          className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all pr-12 text-sm ${
                            authConfirmPassword.length > 0
                              ? authPassword === authConfirmPassword
                                ? 'border-green-500 focus:border-green-600 focus:ring-1 focus:ring-green-600'
                                : 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/20'
                              : 'border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600 placeholder-gray-400'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          )}
                        </button>
                      </div>
                      {authConfirmPassword.length > 0 && authPassword !== authConfirmPassword ? (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-semibold pl-2 animate-in fade-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>Passwords do not match</span>
                        </div>
                      ) : authFieldErrors.confirmPassword ? (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-semibold pl-2 animate-in fade-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{authFieldErrors.confirmPassword}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3.5 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-full transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {authLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          s1.registerSubmitBtnText || "Register & Proceed to Questions →"
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Login Form */}
                {authTab === 'login' && (
                  <form onSubmit={handleLogin} noValidate className="space-y-4 max-w-md mx-auto">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        {loginEmailConfig.label} <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder={loginEmailConfig.placeholder}
                        value={authEmail}
                        onChange={(e) => {
                          setAuthEmail(e.target.value);
                          if (authFieldErrors.email) setAuthFieldErrors(prev => ({ ...prev, email: '' }));
                        }}
                        className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm ${
                          authFieldErrors.email
                            ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30'
                            : 'border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
                        }`}
                      />
                      {authFieldErrors.email && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-semibold pl-2 animate-in fade-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{authFieldErrors.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        {loginPasswordConfig.label} <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder={loginPasswordConfig.placeholder}
                          value={authPassword}
                          onChange={(e) => {
                            setAuthPassword(e.target.value);
                            if (authFieldErrors.password) setAuthFieldErrors(prev => ({ ...prev, password: '' }));
                          }}
                          className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all pr-12 placeholder-gray-400 text-sm ${
                            authFieldErrors.password
                              ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30'
                              : 'border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          )}
                        </button>
                      </div>
                      {authFieldErrors.password && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs font-semibold pl-2 animate-in fade-in duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{authFieldErrors.password}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3.5 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-full transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {authLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          s1.loginSubmitBtnText || "Login & Proceed →"
                        )}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: QUESTIONS & CV UPLOAD                                             */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-8">
            <div>
              <span className="text-xs font-bold text-[#29953f] uppercase tracking-wider">Step 2 of 3</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {job.screeningQuestions && job.screeningQuestions.length > 0
                  ? (s2.heading ? s2.heading.replace(/\s*\*/g, '') : 'Screening Questions & CV Upload')
                  : (s3.heading ? s3.heading.replace(/\s*\*/g, '') : 'Upload Your CV / Resume')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {job.screeningQuestions && job.screeningQuestions.length > 0
                  ? (s2.subtitle || "Please answer the screening questions and upload your latest resume.")
                  : (s3.subtitle || `Please attach your latest resume in PDF, DOC, or DOCX format (Max ${maxLimitKb}KB).`)}
              </p>
            </div>

            {/* SECTION 1: Screening Questions (if present) */}
            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <span>📋 Employer Screening Questions</span>
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-md">
                    {job.screeningQuestions.length} Questions
                  </span>
                </div>

                <div className="space-y-4">
                  {job.screeningQuestions.map((q, idx) => {
                    const hasError = !!questionFieldErrors[idx];
                    return (
                      <div 
                        key={idx} 
                        id={`question_card_${idx}`}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-2.5 ${
                          hasError 
                            ? 'border-red-400 bg-red-50/25 ring-2 ring-red-100 shadow-xs' 
                            : 'border-gray-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <label className={`text-sm font-bold leading-snug ${hasError ? 'text-red-900' : 'text-gray-800'}`}>
                            {idx + 1}. {q.question}
                            {q.required !== false && <span className="text-red-500 ml-1 font-extrabold">*</span>}
                          </label>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                            hasError ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {q.type || 'Short Text'}
                          </span>
                        </div>

                        {q.type === 'Yes/No' ? (
                          <div className="flex items-center gap-3 pt-1">
                            {['Yes', 'No'].map((opt) => (
                              <label
                                key={opt}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                  screeningAnswers[idx] === opt
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-100'
                                    : hasError
                                      ? 'bg-white border-red-300 text-gray-700 hover:border-red-400'
                                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${idx}`}
                                  value={opt}
                                  checked={screeningAnswers[idx] === opt}
                                  onChange={() => handleAnswerChange(idx, opt)}
                                  className="accent-[#29953f]"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="Type your answer (max 16 chars)..."
                              value={screeningAnswers[idx] || ''}
                              onChange={(e) => handleAnswerChange(idx, e.target.value.slice(0, 16))}
                              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                                hasError
                                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                  : 'border-gray-200 focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]'
                              }`}
                            />
                            <div className="flex justify-end">
                              <span className={`text-[10px] font-semibold ${
                                (screeningAnswers[idx]?.length || 0) >= 16 ? 'text-amber-600 font-bold' : 'text-gray-400'
                              }`}>
                                {screeningAnswers[idx]?.length || 0}/16 characters
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Inline Field Error Message Underneath Question */}
                        {hasError && (
                          <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
                            <span className="font-extrabold text-red-500">⚠️</span>
                            <span>{questionFieldErrors[idx]}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: CV / Resume Upload */}
            <div id="cv_upload_section" className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <span>📄 CV / Resume Upload</span>
                  <span className="text-red-500 font-extrabold">*</span>
                </h3>
                <span className="text-xs text-gray-500 font-medium">
                  Max {maxLimitKb}KB (PDF, DOC, DOCX)
                </span>
              </div>

              {/* Current Resume Preview if already available */}
              {resumeUrl && (
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {resumeName || 'My_Resume.pdf'}
                      </p>
                      <span className="text-[11px] text-emerald-700 font-semibold">{s3.attachedBadgeText || '✓ Attached & Ready'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setShowCvModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-white rounded-xl border border-emerald-300 hover:bg-emerald-50 transition-all shadow-xs whitespace-nowrap cursor-pointer hover:shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{s3.viewFileBtnText || 'View File'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-xs whitespace-nowrap cursor-pointer hover:shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{s3.replaceBtnText || 'Replace'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Drag & Drop Area */}
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all group ${
                    cvError
                      ? 'border-red-400 bg-red-50/25 ring-2 ring-red-100'
                      : 'border-gray-300 hover:border-[#29953f] bg-slate-50/60 hover:bg-green-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCvFileChange}
                    className="hidden"
                  />

                  <div className={`w-12 h-12 bg-white rounded-2xl shadow-xs border flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform ${
                    cvError ? 'border-red-300 text-red-500' : 'border-gray-200 text-emerald-600'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>

                  <h4 className={`text-sm font-bold ${cvError ? 'text-red-900' : 'text-gray-800'}`}>
                    {uploadingResume ? "Uploading Resume..." : (resumeUrl ? "Click or Drag to Upload Different Resume" : (s3.uploadBoxTitle || "Click or Drag to Upload Resume"))}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {s3.uploadBoxSubtitle || `Supports PDF, DOC, DOCX up to ${maxLimitKb}KB`}
                  </p>

                  {uploadingResume && (
                    <div className="mt-4 max-w-xs mx-auto space-y-1.5">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#29953f] h-2 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700">{uploadProgress}% uploaded</span>
                    </div>
                  )}
                </div>

                {/* Inline Error Message Underneath Upload Box */}
                {cvError && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 pt-1 animate-in fade-in duration-200">
                    <span className="font-extrabold text-red-500">⚠️</span>
                    <span>{cvError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Step 2 Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {s2.backBtnText || '← Back'}
              </button>
              <button
                type="button"
                onClick={handleStep2Submit}
                disabled={uploadingResume}
                className="px-7 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {s3.continueBtnText || 'Continue to Review →'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: REVIEW & SUBMIT APPLICATION                                        */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold text-[#29953f] uppercase tracking-wider">Step 3 of 3</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{s4.heading || 'Review Your Application'}</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {s4.subtitle || 'Please verify your contact details and responses before final submission.'}
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <span className="font-bold">⚠️</span> {submitError}
              </div>
            )}

            {/* Candidate Details Card (Auto-filled) */}
            <div className="p-5 rounded-2xl border border-gray-100 bg-slate-50/70 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {s4.candidateInfoHeading || 'Candidate Information'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Full Name</span>
                  <span className="font-bold text-gray-900">
                    {authName || user?.name || user?.firstName || 'Candidate'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Email Address</span>
                  <span className="font-bold text-gray-900">{authEmail || user?.email}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Mobile Number</span>
                  <span className="font-bold text-gray-900">{authMobile || user?.mobile || user?.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Attached Resume</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-emerald-700 truncate max-w-[200px]">
                      📄 {resumeName || 'Resume.pdf'}
                    </span>
                    {resumeUrl && (
                      <button
                        type="button"
                        onClick={() => setShowCvModal(true)}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Screening Questions Review */}
            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
              <div className="p-5 rounded-2xl border border-gray-100 bg-slate-50/70 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {s4.screeningReviewHeading || 'Screening Answers'}
                </h3>
                <div className="space-y-2.5">
                  {job.screeningQuestions.map((q, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-bold text-gray-700">{idx + 1}. {q.question}</p>
                      <p className="text-emerald-800 font-semibold bg-white p-2 rounded-lg border border-gray-200 mt-1">
                        {screeningAnswers[idx] || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {s4.backBtnText || '← Back'}
              </button>
              <button
                type="button"
                onClick={handleSubmitFinalApplication}
                disabled={submitting}
                className="px-8 py-3 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {s4.submittingBtnText || "Submitting Application..."}
                  </>
                ) : (
                  s4.submitBtnText || "Submit Application Now 🚀"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SUCCESS CONFIRMATION & PORTAL INVITATION                          */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/80 shadow-md text-center space-y-6">
            
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl font-black shadow-inner">
              ✓
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {alreadyApplied ? (s5.alreadyAppliedHeading || "Already Applied!") : (s5.successHeading || "Application Submitted!")}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {(s5.successSubtitle || "Your application for {title} at {company} has been received successfully by the hiring team.")
                  .replace('{title}', job.title)
                  .replace('{company}', job.company)}
              </p>
            </div>

            {/* Special Highlighted Message */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2 shadow-xs max-w-lg mx-auto">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <span>{s5.promoMessageTitle || "📢 Important Information:"}</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-emerald-800 leading-relaxed">
                {s5.promoMessageText || "Aap sahijob.com ke candidate portal me login karke hazaron verified companies ki jobs explore aur apply kar sakte hain!"}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center max-w-md mx-auto">
              <button
                type="button"
                onClick={() => navigate('/employee', { state: { showOnboardingPrompt: true, loggedIn: true } })}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{s5.exploreMoreJobsBtnText || "Explore More Jobs on SahiJob →"}</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* CV Preview Modal Popup */}
      {showCvModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowCvModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                  PDF
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {resumeName || 'Resume_Preview.pdf'}
                  </h3>
                  <p className="text-[11px] text-gray-500">CV Document Preview</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
                  title="Open in new window"
                >
                  <span>↗</span> Open New Tab
                </a>
                <button
                  onClick={() => setShowCvModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-200/80 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 bg-gray-100 relative">
              <iframe
                src={
                  resumeUrl?.toLowerCase()?.endsWith('.pdf') || resumeUrl?.includes('pdf')
                    ? resumeUrl
                    : `https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`
                }
                title="CV Preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DirectJobApply;
