import React, { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { getStoredAttribution, clearStoredAttribution } from '../../utils/attribution';

const EmployeeLoginModal = ({ isOpen, onClose, onRegisterClick, onLoginSuccess }) => {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'otp' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);
  const [cmsConfig, setCmsConfig] = useState(null);

  // Fetch Homepage & Login CMS configuration
  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employeeLogin) {
          setCmsConfig(data.data.employeeLogin);
        }
      } catch (err) {
        console.error('Error fetching login CMS config:', err);
      }
    };
    if (isOpen) {
      fetchCmsConfig();
    }
  }, [isOpen]);

  const getFieldConfig = (key, defaultLabel, defaultPlaceholder) => {
    const field = cmsConfig?.fields?.[key];
    return {
      label: field?.label || defaultLabel,
      placeholder: field?.placeholder || defaultPlaceholder
    };
  };

  const emailConfig = getFieldConfig('email', 'Email ID', 'Enter your active Email ID');
  const passwordConfig = getFieldConfig('password', 'Password', 'Enter your password');

  const handleGoogleLogin = async () => {
    setIsGoogleAuthenticating(true);
    setErrors({});
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Close modal immediately so the login page and "Logging in..." button do not reappear
      onClose();

      const idToken = await result.user.getIdToken();
      const storedAttribution = getStoredAttribution();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken, attribution: storedAttribution })
      });
      const data = await res.json();
      if (res.ok) {
        clearStoredAttribution();
        localStorage.setItem('employeeToken', data.token);
        const googleName = data.name || result.user?.displayName || (data.email ? data.email.split('@')[0] : 'User');
        const firstName = data.profile?.firstName || googleName.split(' ')[0];
        const lastName = data.profile?.lastName || (googleName.split(' ').length > 1 ? googleName.split(' ').slice(1).join(' ') : '');

        let newProfile = data.profile || {
          firstName: firstName,
          lastName: lastName,
          name: googleName,
          phone: data.mobile || result.user?.phoneNumber || '',
          email: data.email || result.user?.email || '',
          brief: '',
          avatar: data.avatar || result.user?.photoURL || '',
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

        if (data.isOnboardingCompleted) {
          localStorage.setItem('hasProfile', 'true');
          localStorage.removeItem('onboardingCurrentStep');
        } else {
          localStorage.setItem('hasProfile', 'false');
          if (data.onboardingStep) {
            localStorage.setItem('onboardingCurrentStep', data.onboardingStep.toString());
          }
        }

        localStorage.setItem('userProfile', JSON.stringify(newProfile));

        onLoginSuccess?.(data);
      } else {
        alert(data.message || 'Google login failed');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        alert(err.message || 'Google login failed');
      }
    } finally {
      setIsGoogleAuthenticating(false);
      setIsLoading(false);
    }
  };

  // Forgot password states
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [validityTimer, setValidityTimer] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const isOtpLocked = Boolean(
    isLocked ||
    (errors.otp && (errors.otp.toLowerCase().includes('locked') || errors.otp.toLowerCase().includes('too many failed attempts'))) ||
    (errors.email && (errors.email.toLowerCase().includes('locked') || errors.email.toLowerCase().includes('too many failed attempts'))) ||
    (errors.forgotOtp && (errors.forgotOtp.toLowerCase().includes('locked') || errors.forgotOtp.toLowerCase().includes('too many failed attempts'))) ||
    (errors.forgot && (errors.forgot.toLowerCase().includes('locked') || errors.forgot.toLowerCase().includes('too many failed attempts')))
  );

  const formatLockMessage = (msg) => {
    if (!msg) return '';
    const lower = String(msg).toLowerCase();
    if ((lower.includes('locked') || lower.includes('too many failed attempts')) && !lower.includes('google')) {
      const clean = String(msg).trim().replace(/\.$/, '');
      return `${clean}. Continue with Google or login with password instead.`;
    }
    return msg;
  };

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

  // Countdown timer for Lockout (30s after 3 wrong attempts)
  useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  // Countdown timer for OTP validity (1 minute / 60 seconds)
  useEffect(() => {
    let interval = null;
    if (validityTimer > 0) {
      interval = setInterval(() => {
        setValidityTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [validityTimer]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setMobile('');
      setOtpSent(false);
      setOtp(['', '', '', '']);
      setErrors({});
      setLoginMethod('email');
      setShowPassword(false);
      setForgotStep(1);
      setForgotIdentifier('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccessMessage('');
      setShowResetPassword(false);
      setResendTimer(0);
      setLockoutTimer(0);
      setValidityTimer(0);
      setIsGoogleAuthenticating(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (otpSent || forgotStep === 2) {
      setTimeout(() => {
        const firstOtp = document.getElementById('employee-otp-0');
        if (firstOtp) firstOtp.focus();
      }, 100);
    }
  }, [otpSent, forgotStep]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Front-end validation
    const newErrors = {};
    if (!email) newErrors.email = 'Please enter your email address.';
    if (!password) newErrors.password = 'Please enter your password.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const storedAttribution = getStoredAttribution();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, attribution: storedAttribution }),
      });
      const data = await response.json();

      if (!response.ok) {
        const errorState = {};
        if (data.message && data.message.toLowerCase().includes('google')) {
          errorState.isGoogleAccount = true;
          errorState.email = 'Google Account';
        } else if (data.field === 'email' || (data.message && (data.message.toLowerCase().includes('account') || data.message.toLowerCase().includes('email') || data.message.toLowerCase().includes('find') || data.message.toLowerCase().includes('register') || data.message.toLowerCase().includes('credential')))) {
          errorState.email = (data.message && !data.message.toLowerCase().includes('credential'))
            ? data.message
            : "We couldn't find an account with this email. Please register first to continue.";
        } else if (data.field === 'password' || (data.message && data.message.toLowerCase().includes('password'))) {
          errorState.password = data.message || "Invalid password. Please check and try again.";
        } else {
          errorState.email = "We couldn't find an account with this email. Please register first to continue.";
        }
        setErrors(errorState);
      } else {
        clearStoredAttribution();
        localStorage.setItem('employeeToken', data.token);
        
        let newProfile = data.profile || {
          firstName: data.name ? data.name.split(' ')[0] : '',
          lastName: data.name && data.name.split(' ').length > 1 ? data.name.split(' ').slice(1).join(' ') : '',
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

        if (data.isOnboardingCompleted) {
          localStorage.setItem('hasProfile', 'true');
          localStorage.removeItem('onboardingCurrentStep');
        } else {
          localStorage.setItem('hasProfile', 'false');
          if (data.onboardingStep) {
            localStorage.setItem('onboardingCurrentStep', data.onboardingStep.toString());
          }
        }
        
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
        
        onLoginSuccess?.(data);
      }
    } catch (err) {
      setErrors({ general: 'Server error, please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetEmailOtp = async () => {
    setErrors({});
    setSuccessMessage('');
    if (!email || !email.trim()) {
      setErrors({ email: 'Please enter your registered email address.' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/.test(cleanEmail)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/login/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.isLocked) {
          setIsLocked(true);
        }
        setErrors({ email: data.message || 'Failed to send OTP' });
      } else {
        setOtpSent(true);
        setOtp(['', '', '', '']);
        setResendTimer(data.cooldownSeconds || 30);
        setValidityTimer(data.expiresInSeconds || 120);
        setLockoutTimer(0);
        setSuccessMessage(data.message || 'OTP sent successfully to your registered email');
      }
    } catch (err) {
      setErrors({ email: 'Server error, please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    setErrors({});
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/login/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.isLocked) {
          setIsLocked(true);
        }
        if (data.cooldownRemaining) {
          setResendTimer(data.cooldownRemaining);
        }
        setErrors({ otp: data.message || 'Failed to resend OTP' });
      } else {
        setOtp(['', '', '', '']);
        setResendTimer(data.cooldownSeconds || 30);
        setValidityTimer(data.expiresInSeconds || 120);
        setLockoutTimer(0);
        setSuccessMessage('A fresh OTP has been sent to your email!');
      }
    } catch (err) {
      setErrors({ otp: 'Server error, please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      setErrors({ otp: 'Please enter the complete 4-digit OTP' });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const storedAttribution = getStoredAttribution();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/login/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: enteredOtp, attribution: storedAttribution }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.isLocked) {
          setIsLocked(true);
        }
        if (data.cooldownRemaining) {
          setLockoutTimer(data.cooldownRemaining);
        }
        setErrors({ otp: data.message || 'Invalid or expired OTP' });
      } else {
        clearStoredAttribution();
        localStorage.setItem('employeeToken', data.token);

        let newProfile = data.profile || {
          firstName: data.name ? data.name.split(' ')[0] : '',
          lastName: data.name && data.name.split(' ').length > 1 ? data.name.split(' ').slice(1).join(' ') : '',
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

        if (data.isOnboardingCompleted) {
          localStorage.setItem('hasProfile', 'true');
          localStorage.removeItem('onboardingCurrentStep');
        } else {
          localStorage.setItem('hasProfile', 'false');
          if (data.onboardingStep) {
            localStorage.setItem('onboardingCurrentStep', data.onboardingStep.toString());
          }
        }

        localStorage.setItem('userProfile', JSON.stringify(newProfile));
        onLoginSuccess?.(data);
      }
    } catch (err) {
      setErrors({ otp: 'Failed to verify OTP. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotGetOtp = async () => {
    setErrors({});
    setSuccessMessage('');
    if (!forgotIdentifier) {
      setErrors({ forgot: 'Please enter your registered email address.' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/forgot-password/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.message && data.message.toLowerCase().includes('google')) {
          setErrors({ forgot: "This account was created with Google. Please log in using 'Continue with Google' or 'Use OTP to Login'. After logging in, you can create a password under Profile > Security & Password." });
        } else {
          setErrors({ forgot: data.message || 'User not found' });
        }
      } else {
        setForgotStep(2);
        setOtp(['', '', '', '']);
        setResendTimer(data.cooldownSeconds || 30);
        setValidityTimer(data.expiresInSeconds || 120);
        setLockoutTimer(0);
        setSuccessMessage(data.message || 'Password reset OTP sent to your registered email');
      }
    } catch (err) {
      setErrors({ forgot: 'Server error, please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrors({});
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/forgot-password/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.cooldownRemaining) {
          setResendTimer(data.cooldownRemaining);
        }
        setErrors({ forgotOtp: data.message || 'Failed to resend OTP' });
      } else {
        setOtp(['', '', '', '']);
        setResendTimer(data.cooldownSeconds || 30);
        setValidityTimer(data.expiresInSeconds || 120);
        setLockoutTimer(0);
        setSuccessMessage('OTP resent successfully to your email!');
      }
    } catch (err) {
      setErrors({ forgotOtp: 'Server error, please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 4) {
      setErrors({ forgotOtp: 'Please enter 4-digit OTP' });
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier, otp: enteredOtp }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.isLocked) {
          setIsLocked(true);
        }
        if (data.cooldownRemaining) {
          setLockoutTimer(data.cooldownRemaining);
        }
        setErrors({ forgotOtp: data.message || 'Invalid or expired OTP' });
      } else {
        setForgotStep(3);
        setSuccessMessage('');
      }
    } catch (err) {
      setErrors({ forgotOtp: 'Failed to verify OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrors({});
    if (!newPassword || !confirmNewPassword) {
      setErrors({ reset: 'Please fill all password fields' });
      return;
    }
    
    const isValidPassword = newPassword.length >= 8 && 
                            /[a-z]/.test(newPassword) && 
                            /[A-Z]/.test(newPassword) && 
                            /[0-9]/.test(newPassword) && 
                            /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
                            
    if (!isValidPassword) {
      setErrors({ reset: 'Please meet all password requirements' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrors({ reset: 'Passwords do not match' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier, password: newPassword, otp: otp.join('') }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors({ reset: data.message || 'Error resetting password' });
      } else {
        setSuccessMessage('Password reset successfully! You can now log in.');
        setTimeout(() => {
          setForgotStep(1);
          setLoginMethod('email');
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err) {
      setErrors({ reset: 'Server error, please try again later' });
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          {!isGoogleAuthenticating && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-palette-900">{cmsConfig?.modalTitle || 'Candidate Login'}</h2>
            </div>
          )}

          {isGoogleAuthenticating ? (
            <div className="py-14 px-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-full border-3 border-gray-100 border-t-[#16a34a] animate-spin mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Logging you in...</h3>
              <p className="text-sm text-gray-500 mt-1">Authenticating with Google, please wait.</p>
            </div>
          ) : loginMethod === 'forgot' ? (
            <>
              {forgotStep === 1 && (
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleForgotGetOtp(); }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Password</h3>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">Email Address</label>
                    <input 
                      type="email" 
                      value={forgotIdentifier}
                      onChange={(e) => { setForgotIdentifier(e.target.value); setErrors({...errors, forgot: ''}); }}
                      placeholder="Enter your registered email"
                      className="w-full px-5 py-3.5 rounded-full border border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400 outline-none transition-all"
                    />
                    {errors.forgot && (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.forgot}
                      </div>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Get OTP'}
                  </button>
                  <div className="mt-4 text-center">
                    <button type="button" onClick={() => setLoginMethod('email')} className="text-sm font-semibold text-palette-400 hover:text-palette-900 transition-colors">
                      Back to Login
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 2 && (
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleForgotVerifyOtp(); }}>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Verify OTP</h3>
                    <p className="text-sm text-gray-500">Code sent to <span className="font-bold text-gray-900">{forgotIdentifier}</span></p>
                  </div>

                  {/* Success Alert */}
                  {successMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium text-center flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Error Alert */}
                  {errors.forgotOtp && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold text-center flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{errors.forgotOtp}</span>
                    </div>
                  )}

                  {/* OTP Validity Countdown & Lockout Alert */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 pb-1">
                    {validityTimer > 0 ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Valid for: <strong className="font-bold">{Math.floor(validityTimer / 60)}:{String(validityTimer % 60).padStart(2, '0')}</strong> (2 min)
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        OTP expired (2 min validity). Please click Resend.
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 animate-fade-in pb-2">
                    <label className="block text-sm font-bold text-gray-900 text-center">Enter 4-digit OTP</label>
                    <div className="flex justify-center gap-3">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          id={`employee-otp-${index}`}
                          type="text"
                          maxLength="1"
                          disabled={lockoutTimer > 0 || isLoading}
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          onFocus={(e) => e.target.select()}
                          className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:border-palette-400 focus:ring-2 focus:ring-palette-400 transition-all bg-white outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={otp.join('').length !== 4 || isLoading || lockoutTimer > 0}
                    className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  {!isOtpLocked && (
                    <div className="flex items-center justify-center pt-1">
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
                          onClick={handleForgotResendOtp}
                          disabled={isLoading}
                          className="text-sm font-bold text-palette-400 hover:text-palette-900 transition-colors disabled:opacity-70"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  )}

                  <div className="text-center">
                    <button type="button" onClick={() => { setForgotStep(1); setOtp(['', '', '', '']); setSuccessMessage(''); setResendTimer(0); setErrors({}); setIsLocked(false); }} className="text-sm font-semibold text-gray-500 hover:text-palette-900 transition-colors">
                      Back
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Set New Password</h3>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">New Password</label>
                    <div className="relative">
                      <input 
                        type={showResetPassword ? "text" : "password"} 
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setErrors({...errors, reset: ''}); }}
                        placeholder="Enter new password"
                        className="w-full px-5 py-3.5 rounded-full border border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400 outline-none transition-all placeholder-gray-400 pr-12"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-palette-900 transition-colors"
                      >
                        {showResetPassword ? (
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
                    {newPassword && (
                      <div className="mt-3 space-y-2 text-sm font-medium">
                        <div className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                          {/[a-z]/.test(newPassword) ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          )}
                          At least one lowercase letter
                        </div>
                        <div className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
                          {newPassword.length >= 8 ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          )}
                          Minimum 8 characters
                        </div>
                        <div className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                          {/[A-Z]/.test(newPassword) ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          )}
                          At least one uppercase letter
                        </div>
                        <div className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                          {/[0-9]/.test(newPassword) ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          )}
                          At least one number
                        </div>
                        <div className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-green-500' : 'text-gray-400'}`}>
                          {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          )}
                          At least one special character
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">Re-enter New Password</label>
                    <div className="relative">
                      <input 
                        type={showResetPassword ? "text" : "password"} 
                        value={confirmNewPassword}
                        onChange={(e) => { setConfirmNewPassword(e.target.value); setErrors({...errors, reset: ''}); }}
                        placeholder="Confirm new password"
                        className="w-full px-5 py-3.5 rounded-full border border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400 outline-none transition-all placeholder-gray-400 pr-12"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-palette-900 transition-colors"
                      >
                        {showResetPassword ? (
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
                    {errors.reset && (
                      <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.reset}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </>
          ) : loginMethod === 'email' ? (
            <>
              {/* Google Sign In - Top */}
              {errors.google && (
                <div className="text-center text-red-600 text-sm font-semibold mb-3">
                  {errors.google}
                </div>
              )}
              <button type="button" onClick={() => handleGoogleLogin()} disabled={isLoading} className="w-full py-3 flex items-center justify-center gap-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-semibold text-gray-700 disabled:opacity-70 disabled:cursor-not-allowed">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {cmsConfig?.googleBtnText || 'Continue with Google'}
              </button>

              {/* OR WITH EMAIL Divider */}
              <div className="flex items-center gap-4 my-5">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 font-semibold tracking-widest uppercase">{cmsConfig?.dividerText || 'Or with email'}</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm font-semibold rounded-lg border border-green-200 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </div>
              )}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-200 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.general}
                </div>
              )}
              {/* Form */}
              <form className="space-y-5" onSubmit={handleLogin}>
                
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">{emailConfig.label} <span className="text-red-500 font-bold">*</span></label>
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors({...errors, email: '', general: '', isGoogleAccount: false}); }}
                    placeholder={emailConfig.placeholder}
                    className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.email ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
                  />
                  {errors.isGoogleAccount ? (
                    <div className="mt-2.5 p-3.5 sm:p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-2 text-red-800 font-bold text-xs sm:text-sm">
                        <svg className="w-4 h-4 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>This account is registered with Google</span>
                      </div>

                      <div className="space-y-2 text-xs sm:text-[13px] text-gray-700 pl-0.5">
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                          <span>
                            Click <strong className="text-gray-900 font-bold">Continue with Google</strong> above to log in directly.
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                          <span>
                            Or click <button type="button" onClick={() => setLoginMethod('otp')} className="font-bold text-palette-900 underline hover:text-emerald-700">Use OTP to Login</button> below to log in via verification code.
                          </span>
                        </div>
                        <div className="flex items-start gap-2 pt-2 border-t border-red-200/60 text-gray-600">
                          <span className="text-gray-400 font-bold mt-0.5">•</span>
                          <span>
                            Want to log in with a password in future? Go to <strong className="font-bold text-gray-900">Profile &gt; Security &amp; Password</strong> after logging in to create one.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : errors.email ? (
                    <div className="flex items-start gap-1.5 mt-1.5 text-red-600 text-xs sm:text-sm font-semibold leading-relaxed pl-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.email}</span>
                    </div>
                  ) : null}
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">{passwordConfig.label} <span className="text-red-500 font-bold">*</span></label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors({...errors, password: '', general: '', isGoogleAccount: false}); }}
                      placeholder={passwordConfig.placeholder}
                      className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all tracking-widest placeholder-gray-400 pr-16 ${errors.password ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30' : 'border-gray-300 bg-gray-50 focus:bg-white focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
                  <div className="flex justify-end pt-1">
                    <button type="button" onClick={() => setLoginMethod('forgot')} className="text-sm font-semibold text-palette-400 hover:text-palette-900 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Logging in...' : (cmsConfig?.submitBtnText || 'Login')}
                </button>
              </form>

              {/* OTP Login Link */}
              <div className="mt-5 text-center">
                <button 
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className="text-palette-400 font-bold hover:text-palette-900 transition-colors py-1.5 px-4 rounded-full hover:bg-palette-50 inline-block text-sm cursor-pointer"
                >
                  {cmsConfig?.otpBtnText || 'Use OTP to Login'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Email OTP Login Form */}
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (otpSent) handleVerifyEmailOtp(); else handleGetEmailOtp(); }}>
                
                {/* Mode 1: Enter Email ID */}
                {!otpSent && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-gray-900">Email ID</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors({...errors, email: '', otp: ''}); }}
                        placeholder="Enter your registered Email ID"
                        className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.email ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
                      />
                      {errors.email && (
                        <div className="flex items-start gap-1.5 mt-1.5 text-red-600 text-sm font-semibold pl-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span>{formatLockMessage(errors.email)}</span>
                        </div>
                      )}
                      {!errors.email && <p className="text-xs text-gray-500 mt-1 pl-2">We will send a 4-digit verification code to your email</p>}
                    </div>

                    <button 
                      type="submit"
                      disabled={!email.trim() || isLoading}
                      className={`w-full py-3.5 text-white font-bold rounded-full transition-all duration-300 ${
                        email.trim() && !isLoading
                          ? 'bg-palette-900 hover:bg-palette-400 shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transform hover:-translate-y-0.5' 
                          : 'bg-palette-200 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Sending OTP...' : 'Get OTP'}
                    </button>
                  </>
                )}

                {/* Mode 2: Enter OTP */}
                {otpSent && (
                  <div className="space-y-4 animate-fade-in pb-2">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        Verification code sent to <span className="font-bold text-gray-900">{email}</span>
                      </p>
                    </div>

                    {/* Success Alert */}
                    {successMessage && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{successMessage}</span>
                      </div>
                    )}

                    {/* Error Alert */}
                    {errors.otp && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold text-center flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatLockMessage(errors.otp)}</span>
                      </div>
                    )}

                    {/* OTP Validity Countdown (hidden when locked) */}
                    {!isOtpLocked && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 pb-1">
                        {validityTimer > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Valid for: <strong className="font-bold">{Math.floor(validityTimer / 60)}:{String(validityTimer % 60).padStart(2, '0')}</strong> (2 min)
                          </span>
                        ) : (
                          <span className="text-red-500 font-semibold flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            OTP expired (2 min validity). Please click Resend.
                          </span>
                        )}
                      </div>
                    )}

                    <label className="block text-sm font-bold text-gray-900 text-center">Enter 4-digit OTP</label>
                    <div className="flex justify-center gap-3">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          id={`employee-otp-${index}`}
                          type="text"
                          maxLength="1"
                          disabled={lockoutTimer > 0 || isLoading}
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          onFocus={(e) => e.target.select()}
                          autoFocus={index === 0}
                          className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:border-palette-400 focus:ring-2 focus:ring-palette-400 transition-all bg-white outline-none shadow-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      ))}
                    </div>

                    {/* Resend & Change Email Row */}
                    <div className={`flex items-center ${isOtpLocked ? 'justify-start' : 'justify-between'} text-xs px-2 pt-1`}>
                      <button 
                        type="button" 
                        onClick={() => { setOtpSent(false); setOtp(['', '', '', '']); setErrors({}); setSuccessMessage(''); setIsLocked(false); }} 
                        className="font-bold text-palette-400 hover:text-palette-900 transition-colors"
                      >
                        ← Change Email
                      </button>

                      {!isOtpLocked && (
                        resendTimer > 0 ? (
                          <span className="text-gray-400 font-medium">
                            Resend in <span className="font-bold text-gray-700">{resendTimer}s</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={handleResendEmailOtp}
                            className="font-bold text-palette-400 hover:text-palette-900 transition-colors disabled:opacity-50"
                          >
                            Resend OTP
                          </button>
                        )
                      )}
                    </div>

                    <button 
                      type="submit"
                      disabled={otp.join('').length !== 4 || isLoading || lockoutTimer > 0 || isOtpLocked}
                      className={`w-full py-3.5 text-white font-bold rounded-full transition-all duration-300 ${
                        otp.join('').length === 4 && !isLoading && lockoutTimer === 0 && !isOtpLocked
                          ? 'bg-palette-900 hover:bg-palette-400 shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transform hover:-translate-y-0.5' 
                          : 'bg-palette-200 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {isLoading ? 'Verifying...' : isOtpLocked ? 'Locked for 24 Hours' : 'Verify & Login'}
                    </button>
                  </div>
                )}
              </form>

              {/* Password Login Link */}
              <div className="mt-6 text-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-sm text-gray-400 font-medium">Or</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <button 
                  onClick={() => { setLoginMethod('email'); setOtpSent(false); setOtp(['', '', '', '']); setErrors({}); setSuccessMessage(''); }}
                  className="w-full py-3 border border-palette-400 text-palette-400 font-semibold rounded-full hover:bg-palette-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-palette-400 focus:ring-offset-2"
                >
                  Use Password to Login
                </button>
              </div>
            </>
          )}



          {/* Register Link */}
          {onRegisterClick && (
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button 
                  onClick={onRegisterClick}
                  className="text-palette-400 font-bold hover:text-palette-900 transition-colors"
                >
                  Register for free
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmployeeLoginModal;
