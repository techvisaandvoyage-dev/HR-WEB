import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import LocationAutocomplete from '../common/LocationAutocomplete';
import CustomDropdown from '../common/CustomDropdown';

const EmployerRegisterModal = ({ isOpen, onClose, onLoginClick, onLoginSuccess }) => {
  const [step, setStep] = useState(1);
  
  // Step 1 state
  const [mobile, setMobile] = useState('');
  const [termsChecked, setTermsChecked] = useState(true);

  // Step 2 state
  const [accountType, setAccountType] = useState('company'); // 'company' or 'individual'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (showOtpBox) {
      setTimeout(() => {
        const firstOtp = document.getElementById('employer-otp-0');
        if (firstOtp) firstOtp.focus();
      }, 100);
    }
  }, [showOtpBox]);

  const handleGoogleSignUp = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setErrors({});
      try {
        const res = await fetch('http://localhost:5000/api/employer/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem('employerToken', data.token);
          onLoginSuccess?.(data);
        } else {
          setErrors({ google: data.message || 'Google signup failed' });
        }
      } catch (err) {
        setErrors({ google: 'Server error during Google signup' });
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setErrors({ google: 'Google signup failed' });
    }
  });

  // Step 3 state
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [employees, setEmployees] = useState('');
  const [designation, setDesignation] = useState('');
  
  // Location
  const [location, setLocation] = useState('');

  const [aboutCompany, setAboutCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [hiringFor, setHiringFor] = useState('your_company');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const industryOptions = [
    { value: 'Information Technology', label: 'Information Technology' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Education', label: 'Education' },
    { value: 'Other', label: 'Other' },
  ];

  const employeeOptions = [
    { value: '1-10', label: '1-10' },
    { value: '11-50', label: '11-50' },
    { value: '51-200', label: '51-200' },
    { value: '201-500', label: '201-500' },
    { value: '500+', label: '500+' },
  ];

  const designationOptions = [
    { value: 'HR Manager', label: 'HR Manager' },
    { value: 'Recruiter', label: 'Recruiter' },
    { value: 'Talent Acquisition', label: 'Talent Acquisition' },
    { value: 'Founder / CEO', label: 'Founder / CEO' },
    { value: 'Director', label: 'Director' },
    { value: 'Hiring Manager', label: 'Hiring Manager' },
    { value: 'Other', label: 'Other' },
  ];

  if (!isOpen) return null;

  const handleSendOtp = () => {
    // Implement OTP sending logic here
    setShowOtpBox(true);
  };

  const handleVerifyOtpAndContinue = () => {
    // Optional: add OTP verification logic here
    setStep(2);
  };

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

  const handleBasicDetailsSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Official email ID is required';
    if (!password) newErrors.password = 'Password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm password is required';

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
      setErrors({ password: 'Please ensure password meets all requirements' });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }
    
    setLoading(true);
    setErrors({});
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/employer/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Error checking email');
        return;
      }
      
      setStep(3);
    } catch (err) {
      setError('Email is already exist');
    } finally {
      setLoading(false);
    }
  };

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

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setLoading(true);
    setErrors({});
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/employer/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile,
          accountType,
          fullName,
          email,
          password,
          hiringFor,
          companyName,
          industry,
          employees,
          designation,
          location,
          aboutCompany,
          website
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('employerToken', data.token);
        setStep(4);
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
    <div className="fixed inset-0 z-[100] bg-[#f8fbff] overflow-y-auto">
      
      {/* Close Button (fixed to top right of screen) */}
      <button 
        onClick={onClose}
        className="fixed top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white rounded-full p-2 shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="min-h-screen px-4 py-10 flex flex-col items-center justify-center">
        {/* Stepper Header (Only for Step 2 and 3 ) */}
        {step >= 2 && step <= 3 && (
          <div className="flex items-center justify-center gap-3 mb-8 w-full max-w-lg">
          <div className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full ${step >= 2 ? 'bg-palette-400 ring-2 ring-palette-100' : 'bg-gray-200'}`}></div>
            <span className={`text-sm ${step >= 2 ? 'font-semibold text-palette-900' : 'font-medium text-gray-400'}`}>Basic details</span>
          </div>
          <div className={`h-px w-12 ${step >= 3 ? 'bg-palette-400' : 'bg-gray-300'}`}></div>
          <div className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full ${step >= 3 ? 'bg-palette-400 ring-2 ring-palette-100' : 'bg-gray-200'}`}></div>
            <span className={`text-sm ${step >= 3 ? 'font-semibold text-palette-900' : 'font-medium text-gray-400'}`}>Company details</span>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          
          {/* STEP 1 */}
          {step === 1 && (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Continue with mobile</h2>
              </div>

              {/* Form */}
              <div className="space-y-6">
                
                {/* Mobile Number Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">
                    Mobile number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center px-5 py-3.5 rounded-full border border-gray-300 focus-within:border-palette-400 focus-within:ring-1 focus-within:ring-palette-400 transition-all bg-white">
                    <span className="text-gray-900 font-semibold mr-1.5 whitespace-nowrap shrink-0 flex items-center gap-1">
                      +91 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                    <div className="h-5 w-px bg-gray-300 mx-2"></div>
                    <input 
                      type="tel" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter mobile number"
                      className="w-full bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 min-w-0"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={termsChecked}
                      onChange={(e) => setTermsChecked(e.target.checked)}
                      className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 accent-green-600"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a> and <a href="#" className="text-blue-500 hover:underline">Terms & Conditions</a>
                    </span>
                  </label>
                </div>

                {/* OTP Input Section */}
                {showOtpBox && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <label className="block text-sm font-bold text-gray-900 text-center">
                      Enter OTP sent to +91 {mobile}
                    </label>
                    <div className="flex justify-center gap-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          id={`employer-otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          autoFocus={index === 0}
                          className="w-12 h-12 text-center text-xl font-bold rounded-xl border border-gray-300 focus:border-palette-400 focus:ring-2 focus:ring-palette-400 outline-none transition-all bg-white"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Send OTP / Continue Button */}
                <div className="pt-2">
                  {!showOtpBox ? (
                    <button 
                      type="button"
                      onClick={handleSendOtp}
                      disabled={mobile.length < 10 || !termsChecked}
                      className={`w-full py-3.5 font-bold rounded-full transition-all duration-300 ${
                        mobile.length >= 10 && termsChecked
                          ? 'bg-palette-400 hover:bg-palette-900 text-white shadow-lg shadow-palette-400/40 hover:shadow-palette-900/30 transform hover:-translate-y-0.5' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Send OTP
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleVerifyOtpAndContinue}
                      disabled={otp.some(d => d === '')}
                      className={`w-full py-3.5 font-bold rounded-full transition-all duration-300 ${
                        !otp.some(d => d === '')
                          ? 'bg-palette-900 hover:bg-palette-400 text-white shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transform hover:-translate-y-0.5' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Continue
                    </button>
                  )}
                </div>
              </div>

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
                Sign up with Google
              </button>
              
              {/* Login instead link */}
              {onLoginClick && (
                <div className="mt-6 text-center">
                  <button onClick={onLoginClick} className="text-sm text-palette-900 font-semibold hover:text-palette-400 transition-colors">
                    Already have an account? Login
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              {/* Sub-header info */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-10 h-10 bg-palette-50 text-palette-400 rounded-xl flex items-center justify-center mb-3 border border-palette-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                  We need these details to identify you and create your account
                </p>
              </div>

              {/* Display Mobile */}
              <div className="mb-5 flex items-center gap-2">
                 <span className="text-sm font-semibold text-gray-900">
                   Mobile: +91 {mobile}
                 </span>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleBasicDetailsSubmit}>
                
                {/* Account Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    You're creating account as
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="accountType" 
                        value="company"
                        checked={accountType === 'company'}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 accent-green-600"
                      />
                      <span className="text-sm text-gray-700">Company/business</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="accountType" 
                        value="individual"
                        checked={accountType === 'individual'}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 accent-green-600"
                      />
                      <span className="text-sm text-gray-700">Individual/proprietor</span>
                    </label>
                  </div>
                </div>

                {/* Full Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); if(errors.fullName) setErrors({...errors, fullName: ''}); }}
                    placeholder="Name as per PAN"
                    className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
                  />
                  {errors.fullName && <p className="text-red-500 text-xs ml-2">{errors.fullName}</p>}
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">
                    Official email ID <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); }}
                    placeholder="Enter email ID"
                    className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs ml-2">{errors.email}</p>}
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">
                    Create password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''}); }}
                      placeholder="Enter new password"
                      className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
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
                  {errors.password && <p className="text-red-500 text-xs mt-1 ml-2">{errors.password}</p>}
                  {password && (
                    <div className="mt-3 space-y-2 text-sm font-medium px-1">
                      <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {/[a-z]/.test(password) ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        )}
                        At least one lowercase letter
                      </div>
                      <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-500' : 'text-gray-400'}`}>
                        {password.length >= 8 ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        )}
                        Minimum 8 characters
                      </div>
                      <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {/[A-Z]/.test(password) ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        )}
                        At least one uppercase letter
                      </div>
                      <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {/[0-9]/.test(password) ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        )}
                        At least one number
                      </div>
                      <div className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : 'text-gray-400'}`}>
                        {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        )}
                        At least one special character
                      </div>
                    </div>
                  )}
                </div>

                {/* Re-enter Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">
                    Re-enter password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if(errors.confirmPassword) setErrors({...errors, confirmPassword: ''}); }}
                      placeholder="Re-enter password"
                      className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? (
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
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-2">{errors.confirmPassword}</p>}
                </div>

                {error && <div className="text-red-500 text-sm font-semibold text-center">{error}</div>}

                {/* Register Button */}
                <div className="pt-2 flex items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="w-1/3 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all duration-300"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-3.5 bg-palette-400 hover:bg-palette-900 text-white font-bold rounded-full shadow-lg shadow-palette-400/40 hover:shadow-palette-900/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Checking...' : 'Continue'}
                  </button>
                </div>
              </form>

              {/* Login instead link */}
              {onLoginClick && (
                <div className="mt-6 text-center">
                  <button onClick={onLoginClick} className="text-sm text-palette-900 font-semibold hover:text-palette-400 transition-colors">
                    Already have an account? Login
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              {/* Sub-header info */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-10 h-10 bg-palette-50 text-palette-400 rounded-xl flex items-center justify-center mb-3 border border-palette-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                  Tell us about your company to complete registration
                </p>
              </div>

              {/* Summary of what was added so far */}
              <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Account Details</span>
                  <button type="button" onClick={() => setStep(2)} className="text-xs text-palette-400 font-bold hover:text-palette-900 transition-colors">Edit</button>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Name</span>
                    <span className="font-semibold text-gray-900 truncate block">{fullName || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Mobile</span>
                    <span className="font-semibold text-gray-900 truncate block">+91 {mobile}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-xs">Email</span>
                    <span className="font-semibold text-gray-900 truncate block">{email || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-xs">Account Type</span>
                    <span className="font-semibold text-gray-900 block">{accountType === 'company' ? 'Company/business' : 'Individual/proprietor'}</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form className="space-y-4" onSubmit={handleFinalRegister}>
                
                {/* Hiring For */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Hiring for
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hiringFor" 
                        value="your_company"
                        checked={hiringFor === 'your_company'}
                        onChange={(e) => setHiringFor(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 accent-green-600"
                      />
                      <span className="text-sm text-gray-700">Your company</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="hiringFor" 
                        value="consultant"
                        checked={hiringFor === 'consultant'}
                        onChange={(e) => setHiringFor(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 accent-green-600"
                      />
                      <span className="text-sm text-gray-700">Consultant</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Enter Company Name <span className="text-red-500">*</span></label>
                  <input type="text" value={companyName} onChange={(e) => { setCompanyName(e.target.value); if(errors.companyName) setErrors({...errors, companyName: ''}); }} placeholder="Company Name" className={`w-full px-5 py-3.5 rounded-full border outline-none transition-all placeholder-gray-400 ${errors.companyName ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`} />
                  {errors.companyName && <p className="text-red-500 text-xs ml-2">{errors.companyName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Select industry <span className="text-red-500">*</span></label>
                  <CustomDropdown 
                    options={industryOptions} 
                    value={industry} 
                    onChange={(val) => { setIndustry(val); if(errors.industry) setErrors({...errors, industry: ''}); }}
                    placeholder="Select industry" 
                  />
                  {errors.industry && <p className="text-red-500 text-xs ml-2">{errors.industry}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Number of Employees <span className="text-red-500">*</span></label>
                  <CustomDropdown 
                    options={employeeOptions} 
                    value={employees} 
                    onChange={(val) => { setEmployees(val); if(errors.employees) setErrors({...errors, employees: ''}); }}
                    placeholder="Select range" 
                  />
                  {errors.employees && <p className="text-red-500 text-xs ml-2">{errors.employees}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Your designation <span className="text-red-500">*</span></label>
                  <CustomDropdown 
                    options={designationOptions} 
                    value={designation} 
                    onChange={(val) => { setDesignation(val); if(errors.designation) setErrors({...errors, designation: ''}); }}
                    placeholder="e.g. HR Manager" 
                  />
                  {errors.designation && <p className="text-red-500 text-xs ml-2">{errors.designation}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Company Location <span className="text-red-500">*</span></label>
                  <LocationAutocomplete 
                    value={location}
                    onChange={(val) => { setLocation(val); if(errors.location) setErrors({...errors, location: ''}); }}
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                  {errors.location && <p className="text-red-500 text-xs ml-2">{errors.location}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">About Company <span className="text-red-500">*</span></label>
                  <textarea value={aboutCompany} onChange={(e) => { setAboutCompany(e.target.value); if(errors.aboutCompany) setErrors({...errors, aboutCompany: ''}); }} placeholder="Briefly describe your company..." rows="3" className={`w-full px-5 py-3.5 rounded-2xl border outline-none transition-all placeholder-gray-400 resize-none ${errors.aboutCompany ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'}`}></textarea>
                  {errors.aboutCompany && <p className="text-red-500 text-xs ml-2">{errors.aboutCompany}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Website link (Optional)</label>
                  <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.example.com" className="w-full px-5 py-3.5 rounded-full border border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400 outline-none transition-all placeholder-gray-400" />
                </div>

                {error && <div className="text-red-500 text-sm font-semibold text-center">{error}</div>}

                <div className="pt-2 flex items-center gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="w-1/3 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-full transition-all duration-300"
                  >
                    Back
                  </button>
                  <button disabled={loading} type="submit" className="w-2/3 py-3.5 bg-palette-400 hover:bg-palette-900 text-white font-bold rounded-full shadow-lg shadow-palette-400/40 hover:shadow-palette-900/30 transition-all duration-300 transform hover:-translate-y-0.5">
                    {loading ? 'Creating...' : 'Continue'}
                  </button>
                </div>
              </form>

              {/* Login instead link */}
              {onLoginClick && (
                <div className="mt-6 text-center">
                  <button onClick={onLoginClick} className="text-sm text-palette-900 font-semibold hover:text-palette-400 transition-colors">
                    Already have an account? Login
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center text-center py-6 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Congratulations</h2>
              <p className="text-gray-600 mb-10 max-w-[300px] leading-relaxed">
                Your recruiter account has been successfully created!
              </p>
              <button 
                onClick={() => onLoginSuccess?.()}
                className="w-full py-3.5 bg-palette-400 hover:bg-palette-900 text-white font-bold rounded-full shadow-lg shadow-palette-400/40 hover:shadow-palette-900/30 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Continue
              </button>
            </div>
          )}

        </div>
      </div>
      </div>
    </div>
  );
};

export default EmployerRegisterModal;
