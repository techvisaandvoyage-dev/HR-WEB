import React, { useState, useEffect, useMemo } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import MultiSelectLocationDropdown from '../common/MultiSelectLocationDropdown';
import { currentLocationOptions } from '../../data/preferredLocations';
import CustomDropdown from '../common/CustomDropdown';
import { EMPLOYER_INDUSTRIES, getDesignationsForIndustry } from '../../data/employerIndustryDesignations';

const EmployerRegisterModal = ({ isOpen, initialData, onClose, onLoginClick, onLoginSuccess }) => {
  const [step, setStep] = useState(1); // 1: Email & Account, 2: Company Details, 3: Success
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  // Step 1 states
  const [accountType, setAccountType] = useState('company'); // 'company' or 'individual'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsChecked, setTermsChecked] = useState(true);

  // OTP states
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);

  // Step 2 (Company) states
  const [hiringFor, setHiringFor] = useState('your_company');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [employees, setEmployees] = useState('');
  const [designation, setDesignation] = useState('');
  const [location, setLocation] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');
  const [website, setWebsite] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cmsConfig, setCmsConfig] = useState(null);

  // Fetch Employer Register CMS config
  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employerRegister) {
          setCmsConfig(data.data.employerRegister);
        }
      } catch (err) {
        console.error('Error fetching employer register CMS config:', err);
      }
    };
    if (isOpen) {
      fetchCmsConfig();
    }
  }, [isOpen]);

  // Industry options: use CMS industriesData or industryOptions if available, else use data file
  const industryOptions = useMemo(() => {
    if (cmsConfig?.step2?.industriesData && Object.keys(cmsConfig.step2.industriesData).length > 0) {
      return Object.keys(cmsConfig.step2.industriesData).map(ind => ({ value: ind, label: ind }));
    }
    if (cmsConfig?.step2?.industryOptions && cmsConfig.step2.industryOptions.length > 0) {
      return cmsConfig.step2.industryOptions.map(ind => ({ value: ind, label: ind }));
    }
    return EMPLOYER_INDUSTRIES.map(ind => ({ value: ind, label: ind }));
  }, [cmsConfig]);

  const employeeOptions = (cmsConfig?.step2?.employeeSizeOptions && cmsConfig.step2.employeeSizeOptions.length > 0)
    ? cmsConfig.step2.employeeSizeOptions.map(size => ({ value: size, label: size }))
    : [
        { value: '1-10', label: '1-10' },
        { value: '11-50', label: '11-50' },
        { value: '51-200', label: '51-200' },
        { value: '201-500', label: '201-500' },
        { value: '500+', label: '500+' },
      ];

  // Designation options: dynamic based on selected industry and CMS industriesData
  const designationOptions = useMemo(() => {
    // 1. Check if CMS has specific designations for this industry in industriesData
    if (cmsConfig?.step2?.industriesData && industry && cmsConfig.step2.industriesData[industry]) {
      const roles = cmsConfig.step2.industriesData[industry];
      if (Array.isArray(roles) && roles.length > 0) {
        return roles.map(desig => ({ value: desig, label: desig }));
      }
    }
    // 2. Check if general designationOptions override is defined in CMS
    if (cmsConfig?.step2?.designationOptions && cmsConfig.step2.designationOptions.length > 0) {
      return cmsConfig.step2.designationOptions.map(desig => ({ value: desig, label: desig }));
    }
    // 3. Fallback to default industry-specific designations
    if (industry) {
      return getDesignationsForIndustry(industry);
    }
    // Default: show generic options before industry is chosen
    return [
      { value: 'Founder / CEO', label: 'Founder / CEO' },
      { value: 'HR Manager', label: 'HR Manager' },
      { value: 'Hiring Manager', label: 'Hiring Manager' },
      { value: 'Talent Acquisition', label: 'Talent Acquisition' },
      { value: 'Recruiter', label: 'Recruiter' },
      { value: 'Director', label: 'Director' },
      { value: 'Other', label: 'Other' },
    ];
  }, [industry, cmsConfig]);

  // Resend OTP countdown
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialData?.step === 2) {
        setStep(2);
        setFullName(initialData.fullName || '');
        setEmail(initialData.email || '');
        setMobile(initialData.mobile || '');
        setIsGoogleAuth(initialData.isGoogleAuth || false);
      } else {
        setStep(1);
        setFullName('');
        setEmail('');
        setMobile('');
        setIsGoogleAuth(false);
      }
      setAccountType('company');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setTermsChecked(true);
      setShowOtpBox(false);
      setOtp(['', '', '', '']);
      setResendTimer(0);
      setHiringFor('your_company');
      setCompanyName('');
      setIndustry('');
      setEmployees('');
      setDesignation('');
      setLocation('');
      setAboutCompany('');
      setWebsite('');
      setError('');
      setErrors({});
      setSuccessMessage('');
      setLoading(false);
    }
  }, [isOpen, initialData]);

  // Focus first OTP field when OTP box opens
  useEffect(() => {
    if (showOtpBox) {
      setTimeout(() => {
        const firstOtp = document.getElementById('employer-otp-0');
        if (firstOtp) firstOtp.focus();
      }, 100);
    }
  }, [showOtpBox]);

  if (!isOpen) return null;

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      // Auto-focus next input
      if (value !== '' && index < 3) {
        const nextInput = document.getElementById(`employer-otp-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const prevInput = document.getElementById(`employer-otp-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setErrors({});
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/employer/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('employerToken', data.token);
        if (data.isNewUser) {
          // New user -> Go directly to Step 2 (Company Details)!
          setFullName(data.fullName || '');
          setEmail(data.email || '');
          setIsGoogleAuth(true);
          setStep(2);
        } else {
          onLoginSuccess?.(data);
        }
      } else {
        setError(data.message || 'Google signup failed');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Validate fields and send Email OTP
  const handleSendEmailOtp = async (e) => {
    if (e) e.preventDefault();

    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Official email ID is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Please enter a valid email address';

    if (!mobile.trim()) newErrors.mobile = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(mobile.trim())) newErrors.mobile = 'Please enter a valid 10-digit mobile number';

    if (!password) newErrors.password = 'Password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isValidPassword =
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!isValidPassword) {
      setErrors({ password: 'Password must be at least 8 characters with upper, lower, number & special symbol.' });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    if (!termsChecked) {
      setError('Please accept the Terms and Privacy Policy to continue');
      return;
    }

    setLoading(true);
    setErrors({});
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), mobile: mobile.trim(), fullName: fullName.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.field === 'email') {
          setErrors({ email: data.message });
        } else if (data.field === 'mobile') {
          setErrors({ mobile: data.message });
        } else {
          setError(data.message || 'Failed to send OTP');
        }
      } else {
        setShowOtpBox(true);
        setOtp(['', '', '', '']);
        setResendTimer(data.cooldownSeconds || 30);
        setSuccessMessage('A 4-digit verification code has been sent to your email.');
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Resend OTP
  const handleResendEmailOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    setErrors({});
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), mobile: mobile.trim(), fullName: fullName.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.cooldownRemaining) {
          setResendTimer(data.cooldownRemaining);
        }
        setError(data.message || 'Failed to resend OTP');
      } else {
        setOtp(['', '', '', '']);
        setResendTimer(data.cooldownSeconds || 30);
        setSuccessMessage('A fresh OTP has been sent to your email!');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify OTP and continue to Company Details (Step 2)
  const handleVerifyOtpAndContinue = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: enteredOtp }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid or expired OTP');
      } else {
        setSuccessMessage('');
        setError('');
        setStep(2);
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Final Registration
  const handleFinalRegister = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!industry) newErrors.industry = 'Industry is required';
    if (!employees) newErrors.employees = 'Number of employees is required';
    if (!designation) newErrors.designation = 'Designation is required';
    if (!location) newErrors.location = 'Location is required';
    if (!aboutCompany.trim()) newErrors.aboutCompany = 'About company is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setError('');

    try {
      // For Google-authenticated users, use the existing token stored during Google sign-in
      const headers = { 'Content-Type': 'application/json' };
      if (isGoogleAuth) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('employerToken')}`;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/employer/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountType,
          fullName: fullName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          // Skip password & OTP for Google auth users
          ...(isGoogleAuth ? {} : { password, otp: otp.join('') }),
          hiringFor,
          companyName: companyName.trim(),
          industry,
          employees,
          designation,
          location,
          aboutCompany: aboutCompany.trim(),
          website: website.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('employerToken', data.token);
        if (isGoogleAuth) {
          // Google user: skip the success screen and go straight to dashboard
          onLoginSuccess?.(data);
        } else {
          setStep(3);
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 py-10">
        <div className="w-full max-w-lg">

        {/* Form Card */}
        <div className="relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors z-20 p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Stepper Header (Step 1 and 2) - inside card */}
          {step >= 1 && step <= 2 && (
            <div className="flex items-center justify-center gap-3 pt-6 pb-0 w-full">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-palette-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <span className={`text-sm ${step === 1 ? 'font-bold text-palette-900' : 'font-medium text-gray-400'}`}>
                  Account &amp; Email
                </span>
              </div>
              <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-palette-400' : 'bg-gray-300'}`}></div>
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-palette-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <span className={`text-sm ${step === 2 ? 'font-bold text-palette-900' : 'font-medium text-gray-400'}`}>
                  Company Details
                </span>
              </div>
            </div>
          )}

          <div className="p-8">
            {/* STEP 1: Account Details & Email OTP */}
            {step === 1 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showOtpBox ? 'Verify Email Address' : 'Create Employer Account'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {showOtpBox
                      ? `We sent a 4-digit code to ${email}`
                      : 'Register to find qualified talent and post job on sahijob.com'}
                  </p>
                </div>

                {/* Google Sign Up (Only in pre-OTP mode) */}
                {!showOtpBox && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleSignUp}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition-all font-semibold text-gray-700 shadow-xs mb-5 disabled:opacity-60"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      Continue with Google
                    </button>

                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-px bg-gray-200 flex-1"></div>
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Or with email</span>
                      <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                  </>
                )}

                {/* Alerts */}
                {successMessage && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{successMessage}</span>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {!showOtpBox ? (
                  /* Mode 1: Fill Account Details */
                  <form className="space-y-4" onSubmit={handleSendEmailOtp}>
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        Full Name / Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (errors.fullName) setErrors({ ...errors, fullName: '' });
                        }}
                        placeholder="e.g. John Doe"
                        className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm ${
                          errors.fullName
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                        }`}
                      />
                      {errors.fullName && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.fullName}
                        </div>
                      )}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        {cmsConfig?.step1?.fields?.email?.label || 'Official Email ID'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        placeholder={cmsConfig?.step1?.fields?.email?.placeholder || 'e.g. hr@company.com'}
                        className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                        }`}
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
                        {cmsConfig?.step1?.fields?.mobile?.label || 'Mobile Number'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 10) setMobile(val);
                          if (errors.mobile) setErrors({ ...errors, mobile: '' });
                        }}
                        placeholder={cmsConfig?.step1?.fields?.mobile?.placeholder || 'e.g. 9876543210'}
                        className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm ${
                          errors.mobile
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                        }`}
                      />
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
                        Create Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors({ ...errors, password: '' });
                          }}
                          placeholder="Enter strong password"
                          className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm pr-12 ${
                            errors.password
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                              : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.password}
                        </div>
                      )}

                      {password && (
                        <div className="mt-3 space-y-1.5 text-xs font-medium px-1">
                          <div className={`flex items-center gap-1.5 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            At least one lowercase letter
                          </div>
                          <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            At least one uppercase letter
                          </div>
                          <div className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Minimum 8 characters
                          </div>
                          <div className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            At least one number
                          </div>
                          <div className={`flex items-center gap-1.5 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            At least one special character
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                          }}
                          placeholder="Re-enter password"
                          className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm pr-12 ${
                            errors.confirmPassword
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                              : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                          {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={termsChecked}
                          onChange={(e) => setTermsChecked(e.target.checked)}
                          className="mt-1 w-4 h-4 text-palette-900 rounded border-gray-300 focus:ring-palette-400 accent-palette-900"
                        />
                        <span className="text-xs text-gray-600 leading-relaxed">
                          I agree to the <a href="/page/privacy-policy" target="_blank" className="text-palette-400 hover:underline font-semibold">Privacy Policy</a> and <a href="/page/terms-of-service" target="_blank" className="text-palette-400 hover:underline font-semibold">Terms &amp; Conditions</a>
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                      {loading ? 'Sending verification code...' : 'Continue & Verify Email'}
                    </button>
                  </form>
                ) : (
                  /* Mode 2: OTP Verification Box */
                  <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-900 text-center">
                        Enter 4-Digit OTP Code <span className="text-red-500">*</span>
                      </label>
                      <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`employer-otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                            onFocus={(e) => e.target.select()}
                            className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:border-palette-400 focus:ring-2 focus:ring-palette-400 outline-none transition-all bg-white shadow-xs"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Resend & Change Email */}
                    <div className="flex items-center justify-between text-xs px-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpBox(false);
                          setOtp(['', '', '', '']);
                          setError('');
                          setSuccessMessage('');
                        }}
                        className="font-bold text-palette-400 hover:text-palette-900 transition-colors"
                      >
                        ← Change Email
                      </button>

                      {resendTimer > 0 ? (
                        <span className="text-gray-400 font-medium">
                          Resend in <span className="font-bold text-gray-700">{resendTimer}s</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleResendEmailOtp}
                          className="font-bold text-palette-400 hover:text-palette-900 transition-colors disabled:opacity-50"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtpAndContinue}
                      disabled={otp.join('').length !== 4 || loading}
                      className={`w-full py-3.5 text-white font-bold rounded-full transition-all duration-300 ${
                        otp.join('').length === 4 && !loading
                          ? 'bg-palette-900 hover:bg-palette-400 shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transform hover:-translate-y-0.5'
                          : 'bg-palette-200 cursor-not-allowed'
                      }`}
                    >
                      {loading ? 'Verifying code...' : 'Verify & Continue'}
                    </button>
                  </div>
                )}

                {/* Login link */}
                {onLoginClick && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        onClick={onLoginClick}
                        className="text-palette-400 font-bold hover:text-palette-900 transition-colors"
                      >
                        Login
                      </button>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* STEP 2: Company Details */}
            {step === 2 && (
              <>
                <div className="mb-5">
                  <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Provide your organization details to complete your recruiter profile
                  </p>
                </div>

                {/* Account Summary Card */}
                <div className="mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Account Details</span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-palette-400 font-bold hover:text-palette-900 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                    <div>
                      <span className="text-gray-500 block text-xs">Name</span>
                      <span className="font-semibold text-gray-900 truncate block">{fullName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Verified Email</span>
                      <span className="font-semibold text-gray-900 truncate block">{email}</span>
                    </div>
                    {mobile && (
                      <div>
                        <span className="text-gray-500 block text-xs">Mobile Number</span>
                        <span className="font-semibold text-gray-900 truncate block">{mobile}</span>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold text-center flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleFinalRegister}>
                  {/* Hiring For */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {cmsConfig?.hiringForLabel || 'Hiring For'}
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {(cmsConfig?.hiringForOptions && cmsConfig.hiringForOptions.length > 0
                        ? cmsConfig.hiringForOptions
                        : [
                            { id: 'your_company', value: 'your_company', label: cmsConfig?.hiringForCompanyLabel || 'Your Company' },
                            { id: 'consultant', value: 'consultant', label: cmsConfig?.hiringForConsultantLabel || 'Consultant / Staffing Agency' }
                          ]
                      ).map((opt) => {
                        const optVal = opt.value || opt.id;
                        return (
                          <label key={optVal} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="hiringFor"
                              value={optVal}
                              checked={hiringFor === optVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setHiringFor(val);
                                setAccountType(val.toLowerCase().includes('company') || val.toLowerCase().includes('business') ? 'company' : 'individual');
                              }}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 accent-emerald-600"
                            />
                            <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">
                      Company / Organization Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (errors.companyName) setErrors({ ...errors, companyName: '' });
                      }}
                      placeholder="e.g. Acme Innovations Pvt Ltd"
                      className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 text-sm ${
                        errors.companyName
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                      }`}
                    />
                    {errors.companyName && (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.companyName}
                      </div>
                    )}
                  </div>

                  {/* Industry */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">
                      Industry Domain <span className="text-red-500">*</span>
                    </label>
                    <CustomDropdown
                      options={industryOptions}
                      value={industry}
                      onChange={(val) => {
                        setIndustry(val);
                        // Reset designation when industry changes
                        setDesignation('');
                        if (errors.industry) setErrors({ ...errors, industry: '' });
                        if (errors.designation) setErrors(prev => ({ ...prev, designation: '' }));
                      }}
                      placeholder="Select Industry"
                    />
                    {errors.industry && (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.industry}
                      </div>
                    )}
                  </div>

                  {/* Employees Range */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">
                      Company Size (Employees) <span className="text-red-500">*</span>
                    </label>
                    <CustomDropdown
                      options={employeeOptions}
                      value={employees}
                      onChange={(val) => {
                        setEmployees(val);
                        if (errors.employees) setErrors({ ...errors, employees: '' });
                      }}
                      placeholder="Select Number of Employees"
                    />
                    {errors.employees && (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.employees}
                      </div>
                    )}
                  </div>

                  {/* Designation — changes based on selected industry */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">
                      Your Designation / Role <span className="text-red-500">*</span>
                    </label>
                    {!industry && (
                      <p className="text-xs text-gray-400 mb-1">Select an industry first to see relevant designations</p>
                    )}
                    <CustomDropdown
                      options={designationOptions}
                      value={designation}
                      onChange={(val) => {
                        setDesignation(val);
                        if (errors.designation) setErrors({ ...errors, designation: '' });
                      }}
                      placeholder={industry ? `Select your role in ${industry}` : 'Select designation'}
                    />
                    {errors.designation && (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.designation}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">
                      Headquarters / Primary Location <span className="text-red-500">*</span>
                    </label>
                    <MultiSelectLocationDropdown
                      options={currentLocationOptions}
                      value={location}
                      onChange={(val) => {
                        setLocation(val);
                        if (errors.location) setErrors({ ...errors, location: '' });
                      }}
                      multiple={false}
                      placeholder="Select City / Location"
                      className={`w-full px-5 py-3.5 rounded-2xl border ${
                        errors.location
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                      } outline-none transition-all placeholder-gray-400 text-sm`}
                    />
                    {errors.location && (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.location}
                      </div>
                    )}
                  </div>

                  {/* About Company */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">
                      About Company <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={aboutCompany}
                      onChange={(e) => {
                        setAboutCompany(e.target.value);
                        if (errors.aboutCompany) setErrors({ ...errors, aboutCompany: '' });
                      }}
                      placeholder="Briefly describe what your organization does..."
                      rows="3"
                      className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all placeholder-gray-400 resize-none text-sm ${
                        errors.aboutCompany
                          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                      }`}
                    ></textarea>
                    {errors.aboutCompany && (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.aboutCompany}
                      </div>
                    )}
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">Company Website (Optional)</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-5 py-3.5 rounded-full border border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400 outline-none transition-all placeholder-gray-400 text-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all duration-300 text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-2/3 py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-60 text-sm"
                    >
                      {loading ? 'Creating account...' : 'Complete Registration'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 3: Congratulations Screen */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center text-center py-6 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Congratulations!</h2>
                <p className="text-gray-600 mb-8 max-w-[320px] text-sm leading-relaxed">
                  Your employer recruiter account for <strong className="text-gray-900">{companyName}</strong> has been successfully set up.
                </p>
                <button
                  onClick={() => onLoginSuccess?.()}
                  className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Go to Employer Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerRegisterModal;
