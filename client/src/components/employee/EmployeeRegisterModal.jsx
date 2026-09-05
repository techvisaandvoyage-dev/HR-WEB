import React, { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';

const EmployeeRegisterModal = ({ isOpen, onClose, onLoginClick, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobile, setMobile] = useState('');
  
  // Registration flow states
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setErrors({});
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
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  // Password validation logic
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!email) newErrors.email = 'Please enter your email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address.';
    if (!password) newErrors.password = 'Please create a password.';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    if (!mobile) newErrors.mobile = 'Please enter a phone number.';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (!hasLowercase || !hasUppercase || !hasNumber || !hasMinLength || !hasSpecialChar) {
      setErrors({ password: 'Please ensure your password meets all requirements.' });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/check-existence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (data.field === 'email') setErrors({ email: data.message });
        else if (data.field === 'mobile') setErrors({ mobile: data.message });
        else setErrors({ general: data.message });
        setIsLoading(false);
        return;
      }
      
      setStep(2); // Move to OTP verification
    } catch (err) {
      setErrors({ general: 'Failed to verify details. Please try again.' });
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
        body: JSON.stringify({ name, email, password, mobile }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.message && data.message.toLowerCase().includes('email')) {
          setErrors({ email: data.message });
          setStep(1); // Go back if email exists
        } else if (data.message && data.message.toLowerCase().includes('phone')) {
          setErrors({ mobile: data.message });
          setStep(1); // Go back if phone exists
        } else {
          setErrors({ general: (data.message + (data.error ? `: ${data.error}` : '')) || 'Registration failed' });
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
        localStorage.setItem('hasProfile', 'true');
        
        onLoginSuccess?.({ isNewUser: true });
      }
    } catch (err) {
      console.error("Register Error:", err);
      setErrors({ general: `Client Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-palette-900">
              {step === 1 ? 'Register' : 'Verify Mobile'}
            </h2>
            {onLoginClick && (
              <button onClick={onLoginClick} className="text-palette-400 font-semibold hover:text-palette-900 transition-colors">
                Login instead
              </button>
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
              {/* Form */}
              <form className="space-y-6" onSubmit={handleStep1Submit}>
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                Email ID<span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({...errors, email: ''}); }}
                placeholder="Tell us your Email ID"
                className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.email ? 'border-red-600 focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-red-50/30' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
              />
              {errors.email ? (
                <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1 pl-2">We'll send relevant jobs and updates to this email</p>
              )}
            </div>

            {/* Mobile Number Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                Mobile number<span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center px-5 py-3.5 rounded-full border transition-all bg-white ${errors.mobile ? 'border-red-600 focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 bg-red-50/30' : 'border-gray-300 focus-within:border-palette-400 focus-within:ring-1 focus-within:ring-palette-400'}`}>
                <span className="text-gray-900 font-semibold mr-1.5 whitespace-nowrap shrink-0">+91</span>
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors({...errors, mobile: ''}); }}
                  placeholder="Enter your mobile number"
                  className="w-full bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 min-w-0"
                />
              </div>
              {errors.mobile ? (
                <div className="flex items-center gap-1.5 mt-1 text-red-600 text-sm font-semibold pl-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.mobile}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1 pl-2">Recruiters will contact you on this number</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-900">
                Password<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({...errors, password: ''}); }}
                  placeholder="Create a strong password"
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
                Re-enter password<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
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
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
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
                className="w-full py-3.5 bg-palette-400 hover:bg-palette-900 text-white font-bold rounded-full shadow-lg shadow-palette-400/40 hover:shadow-palette-900/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Register now
              </button>
            </div>
          </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-sm text-gray-400 font-medium">Or</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              {/* Google Sign Up */}
              {errors.google && (
                <div className="text-center text-red-600 text-sm font-semibold mb-3">
                  {errors.google}
                </div>
              )}
              <button type="button" onClick={() => handleGoogleSignUp()} disabled={isLoading} className="w-full py-3 flex items-center justify-center gap-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-semibold text-gray-700 disabled:opacity-70 disabled:cursor-not-allowed">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-2">We have sent a verification code to</p>
                <p className="font-bold text-gray-900 text-lg">+91 {mobile}</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-6 mt-8">
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

                <div className="pt-6 space-y-4">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full shadow-lg shadow-palette-900/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying & Creating Profile...' : 'Verify & Continue'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="w-full py-3 text-palette-400 font-semibold hover:text-palette-900 transition-colors"
                  >
                    Back to Edit Details
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmployeeRegisterModal;
