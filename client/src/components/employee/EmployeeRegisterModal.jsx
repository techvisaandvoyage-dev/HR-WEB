import React, { useState, useEffect, useRef } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';

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
  { code: '+998', country: 'UZ', flag: '🇺🇿', name: 'Uzbekistan (+998)' },
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

const EmployeeRegisterModal = ({ isOpen, onClose, onLoginClick, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  
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
  
  // Registration flow states
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cmsConfig, setCmsConfig] = useState(null);

  // Fetch Homepage & Register CMS configuration
  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employeeRegister) {
          setCmsConfig(data.data.employeeRegister);
        }
      } catch (err) {
        console.error('Error fetching register CMS config:', err);
      }
    };
    if (isOpen) {
      fetchCmsConfig();
    }
  }, [isOpen]);

  const getFieldConfig = (key, defaultLabel, defaultPlaceholder, defaultRequired = true) => {
    const field = cmsConfig?.fields?.[key];
    return {
      label: field?.label || defaultLabel,
      placeholder: field?.placeholder || defaultPlaceholder,
      isRequired: field?.isRequired !== undefined ? field.isRequired : defaultRequired
    };
  };

  const nameConfig = getFieldConfig('name', 'Full Name', 'What is your name?', true);
  const emailConfig = getFieldConfig('email', 'Email ID', 'Tell us your Email ID', true);
  const mobileConfig = getFieldConfig('mobile', 'Mobile number', 'Enter your mobile number', true);
  const passwordConfig = getFieldConfig('password', 'Password', 'Create a strong password', true);
  const confirmPasswordConfig = getFieldConfig('confirmPassword', 'Re-enter password', 'Confirm your password', true);

  // Countdown timer for Resend OTP
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

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('employeeToken', data.token);
        if (data.isOnboardingCompleted) {
          localStorage.setItem('hasProfile', 'true');
          localStorage.removeItem('onboardingCurrentStep');
        } else {
          localStorage.setItem('hasProfile', 'false');
          if (data.onboardingStep) {
            localStorage.setItem('onboardingCurrentStep', data.onboardingStep.toString());
          }
        }
        onLoginSuccess?.(data);
      } else {
        setErrors({ google: data.message || 'Google signup failed' });
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrors({ google: err.message || 'Google signup failed' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setMobile('');
      setStep(1);
      setOtp(['', '', '', '']);
      setErrors({});
      setSuccessMessage('');
      setResendTimer(0);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      // Auto-focus next input
      if (value !== '' && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    // Front-end validation with dynamic CMS compulsory requirements
    const newErrors = {};

    if (nameConfig.isRequired && !name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }

    if (emailConfig.isRequired && !email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    
    if (mobileConfig.isRequired && !mobile.trim()) {
      newErrors.mobile = 'Please enter your mobile number.';
    } else if (mobile.trim() && mobile.length !== 10) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number.';
    }
    
    if (passwordConfig.isRequired && !password) {
      newErrors.password = 'Please create a password.';
    }

    if (confirmPasswordConfig.isRequired && !confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isValidPassword = password.length >= 8 && 
                            /[a-z]/.test(password) && 
                            /[A-Z]/.test(password) && 
                            /[0-9]/.test(password) && 
                            /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!isValidPassword) {
      setErrors({ password: 'Password must be at least 8 chars long and contain lowercase, uppercase, numeric & special characters.' });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (data.field === 'email') setErrors({ email: data.message });
        else if (data.field === 'mobile') setErrors({ mobile: data.message });
        else setErrors({ general: data.message || 'Failed to send OTP' });
        setIsLoading(false);
        return;
      }
      
      setOtp(['', '', '', '']);
      setResendTimer(data.cooldownSeconds || 30);
      setSuccessMessage('A 4-digit verification code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setErrors({ general: 'Failed to send OTP. Please try again.' });
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.cooldownRemaining) {
          setResendTimer(data.cooldownRemaining);
        }
        setErrors({ general: data.message || 'Failed to resend OTP' });
      } else {
        setOtp(['', '', '', '']);
        setResendTimer(data.cooldownSeconds || 30);
        setSuccessMessage('OTP resent successfully to your email!');
      }
    } catch (err) {
      setErrors({ general: 'Failed to resend OTP. Please try again.' });
    }
    setIsLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrors({ ...errors, general: '' });
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setErrors({ ...errors, general: 'Please enter the 4-digit OTP' });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, mobile, otp: enteredOtp }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.message && data.message.toLowerCase().includes('email') && data.message.toLowerCase().includes('exists')) {
          setErrors({ email: data.message });
          setStep(1);
        } else if (data.message && data.message.toLowerCase().includes('phone')) {
          setErrors({ mobile: data.message });
          setStep(1);
        } else {
          setErrors({ general: data.message || 'Registration failed' });
        }
      } else {
        localStorage.setItem('employeeToken', data.token);
        
        // Initialize profile with registered data
        const nameParts = data.name ? data.name.split(' ') : [''];
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        const newProfile = {
          firstName: firstName,
          lastName: lastName,
          phone: data.mobile || '',
          email: data.email || '',
          brief: '',
          avatar: '',
          qualifications: [],
          isFresher: true,
          experience: [],
          professionalDetails: {
            currentDesignation: '',
            currentSalary: '',
            expectedSalary: '',
            currentLocation: data.location || '',
            preferredLocations: '',
            linkedinUrl: '',
            majorAchievements: '',
            skills: ''
          }
        };
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
        localStorage.setItem('hasProfile', 'false');
        localStorage.setItem('onboardingCurrentStep', '1');
        
        onLoginSuccess?.({ ...data, isNewUser: true, isOnboardingCompleted: false, onboardingStep: 1 });
      }
    } catch (err) {
      console.error("Register Error:", err);
      setErrors({ general: `Client Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-palette-900">
              {step === 1 ? (cmsConfig?.modalTitle || 'Register') : 'Verify Email'}
            </h2>
            {step === 1 && cmsConfig?.modalSubtitle && (
              <p className="text-xs text-gray-500 mt-1">{cmsConfig.modalSubtitle}</p>
            )}
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-200 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.general}
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Google Sign Up at TOP */}
              {errors.google && (
                <div className="text-center text-red-600 text-sm font-semibold mb-3">
                  {errors.google}
                </div>
              )}
              <button 
                type="button" 
                onClick={() => handleGoogleSignUp()} 
                disabled={isLoading} 
                className="w-full py-3.5 flex items-center justify-center gap-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-semibold text-gray-700 disabled:opacity-70 disabled:cursor-not-allowed mb-6 shadow-2xs"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {cmsConfig?.googleBtnText || 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{cmsConfig?.dividerText || 'OR WITH EMAIL'}</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleStep1Submit} autoComplete="off">

            {/* Full Name Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                {nameConfig.label}{nameConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <input 
                type="text"
                name="user_fullname_register"
                autoComplete="off" 
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors({...errors, name: ''}); }}
                placeholder={nameConfig.placeholder}
                style={{ WebkitBoxShadow: '0 0 0 30px white inset' }}
                className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.name ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
              />
              {errors.name && (
                <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </div>
              )}
            </div>
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                {emailConfig.label}{emailConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <input 
                type="email"
                name="user_email_register"
                autoComplete="off" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({...errors, email: ''}); }}
                placeholder={emailConfig.placeholder}
                style={{ WebkitBoxShadow: '0 0 0 30px white inset' }}
                className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.email ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
              />
              {errors.email && (
                <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </div>
              )}
            </div>

            {/* Mobile Number Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                {mobileConfig.label}{mobileConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <div className={`flex items-center px-4 py-3.5 rounded-full border transition-all bg-white relative ${errors.mobile ? 'border-red-600 focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 bg-red-50/30' : 'border-gray-300 focus-within:border-palette-400 focus-within:ring-1 focus-within:ring-palette-400'}`}>
                
                {/* Custom Scrollable Country Code Dropdown */}
                <div className="relative shrink-0" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="flex items-center gap-1.5 text-gray-900 font-bold border-none outline-none cursor-pointer pr-2 text-sm hover:text-palette-900 transition-colors"
                  >
                    <span className="text-base leading-none">{selectedCountryObj.flag}</span>
                    <span>{selectedCountryObj.code}</span>
                    <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu Popup */}
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* Search Box */}
                      <div className="p-2.5 border-b border-gray-100 bg-gray-50/80">
                        <input
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Search country or code..."
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-palette-400 text-gray-900"
                          autoFocus
                        />
                      </div>

                      {/* Scrollable Country List */}
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
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left hover:bg-palette-50 transition-colors ${c.code === countryCode ? 'bg-palette-50/80 font-bold text-palette-900' : 'text-gray-700 font-medium'}`}
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
                  name="user_mobile_register"
                  autoComplete="off" 
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors({...errors, mobile: ''}); }}
                  placeholder={mobileConfig.placeholder}
                  style={{ WebkitBoxShadow: '0 0 0 30px white inset' }}
                  className="w-full bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 min-w-0"
                />
              </div>
              {errors.mobile && (
                <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.mobile}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                {passwordConfig.label}{passwordConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  name="user_password_register"
                  autoComplete="new-password" 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({...errors, password: ''}); }}
                  placeholder={passwordConfig.placeholder}
                  style={{ WebkitBoxShadow: '0 0 0 30px white inset' }}
                  className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all pr-12 placeholder-gray-400 ${errors.password ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
              
              {/* Dynamic Password Checklist */}
              {password.length > 0 && (
                <div className="mt-3 pl-3 space-y-2">
                  <div className={`flex items-center text-sm font-semibold transition-colors duration-200 ${hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {hasLowercase ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                    </svg>
                    <span className="ml-2.5">At least one lowercase letter</span>
                  </div>
                  <div className={`flex items-center text-sm font-semibold transition-colors duration-200 ${hasMinLength ? 'text-green-500' : 'text-gray-400'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {hasMinLength ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                    </svg>
                    <span className="ml-2.5">Minimum 8 characters</span>
                  </div>
                  <div className={`flex items-center text-sm font-semibold transition-colors duration-200 ${hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {hasUppercase ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                    </svg>
                    <span className="ml-2.5">At least one uppercase letter</span>
                  </div>
                  <div className={`flex items-center text-sm font-semibold transition-colors duration-200 ${hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {hasNumber ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                    </svg>
                    <span className="ml-2.5">At least one number</span>
                  </div>
                  <div className={`flex items-center text-sm font-semibold transition-colors duration-200 ${hasSpecialChar ? 'text-green-500' : 'text-gray-400'}`}>
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {hasSpecialChar ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />}
                    </svg>
                    <span className="ml-2.5">At least one special character</span>
                  </div>
                </div>
              )}
            </div>

            {/* Re-enter Password Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                {confirmPasswordConfig.label}{confirmPasswordConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={confirmPasswordConfig.placeholder}
                  className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all pr-12 ${
                    confirmPassword.length > 0 
                      ? password === confirmPassword 
                        ? 'border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500' 
                        : 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400 placeholder-gray-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword ? (
                <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Passwords do not match
                </div>
              ) : errors.confirmPassword ? (
                <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.confirmPassword}
                </div>
              ) : null}
            </div>

            {/* Register Button */}
            <div className="pt-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-palette-400 hover:bg-palette-900 text-white font-bold rounded-full shadow-lg shadow-palette-400/40 hover:shadow-palette-900/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending OTP...' : (cmsConfig?.submitBtnText || 'Register now')}
              </button>
            </div>
          </form>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-2">We have sent a verification code to</p>
                <p className="font-bold text-gray-900 text-lg break-all">{email}</p>
              </div>

              {/* Success Notification */}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium text-center animate-fade-in flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold text-center animate-shake flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-6 mt-6">
                <div className="flex justify-center gap-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      autoFocus={index === 0}
                      className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:border-palette-400 focus:ring-2 focus:ring-palette-400 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full shadow-lg shadow-palette-900/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying & Creating Profile...' : 'Verify & Continue'}
                  </button>
                  
                  <div className="flex items-center justify-center pt-2">
                    {resendTimer > 0 ? (
                      <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resend OTP in <strong className="text-palette-900 font-bold">{resendTimer}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-sm font-bold text-palette-400 hover:text-palette-900 transition-colors disabled:opacity-70"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => { setStep(1); setErrors({}); setOtp(['', '', '', '']); setSuccessMessage(''); setResendTimer(0); }}
                    className="w-full py-2 text-sm text-gray-600 hover:text-palette-900 font-semibold transition-colors"
                  >
                    Back to Edit Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bottom Login Link */}
          {onLoginClick && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={onLoginClick}
                  className="text-palette-400 font-bold hover:text-palette-900 transition-colors"
                >
                  Login
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmployeeRegisterModal;
