import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const EmployerLoginModal = ({ isOpen, onClose, onRegisterClick, onLoginSuccess }) => {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'otp' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setMobile('');
      setOtpSent(false);
      setError('');
      setErrors({});
      setLoginMethod('email');
      setShowPassword(false);
      setForgotStep(1);
      setForgotIdentifier('');
      setOtp(['', '', '', '']);
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccessMessage('');
      setShowResetPassword(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (otpSent || forgotStep === 2) {
      setTimeout(() => {
        const firstOtp = document.getElementById('otp-0');
        if (firstOtp) firstOtp.focus();
      }, 100);
    }
  }, [otpSent, forgotStep]);

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

  const handleGetOtp = async () => {
    setErrors({});
    if (mobile.length !== 10) {
      setErrors({ mobile: 'Please enter a valid 10-digit mobile number' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/employer/auth/check-mobile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors({ mobile: data.message || 'Error checking mobile number' });
      } else {
        setOtpSent(true);
      }
    } catch (err) {
      setErrors({ mobile: 'Server error, please try again later' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
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
          setErrors({ google: data.message || 'Google login failed' });
        }
      } catch (err) {
        setErrors({ google: 'Server error during Google login' });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setErrors({ google: 'Google login failed' });
    }
  });

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/employer/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('employerToken', data.token);
        onLoginSuccess?.(data);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotGetOtp = async () => {
    setErrors({});
    setSuccessMessage('');
    if (!forgotIdentifier) {
      setErrors({ forgot: 'Please enter your mobile number or email.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/employer/auth/forgot-password/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors({ forgot: data.message || 'User not found' });
      } else {
        setForgotStep(2);
      }
    } catch (err) {
      setErrors({ forgot: 'Server error, please try again later' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = () => {
    if (otp.join('').length === 4) {
      setForgotStep(3);
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
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/employer/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier, password: newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors({ reset: data.message || 'Error resetting password' });
      } else {
        setLoginMethod('email');
        setForgotStep(1);
        setForgotIdentifier('');
        setOtp(['', '', '', '']);
        setNewPassword('');
        setConfirmNewPassword('');
        setSuccessMessage('Password reset successful. Please login with your new password.');
      }
    } catch (err) {
      setErrors({ reset: 'Server error, please try again later' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
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
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-palette-900">Employer Login</h2>
          </div>

          {loginMethod === 'forgot' ? (
            <>
              {forgotStep === 1 && (
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleForgotGetOtp(); }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Password</h3>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">Mobile Number or Email <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={forgotIdentifier}
                      onChange={(e) => { setForgotIdentifier(e.target.value); setErrors({...errors, forgot: ''}); }}
                      placeholder="Enter mobile no. or email"
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
                    disabled={loading}
                    className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Get OTP'}
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
                  <div className="space-y-3 animate-fade-in pb-2">
                    <label className="block text-sm font-bold text-gray-900 text-center">Enter 4-digit OTP <span className="text-red-500">*</span></label>
                    <div className="flex justify-center gap-3">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength="1"
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          onFocus={(e) => e.target.select()}
                          className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:border-palette-400 focus:ring-2 focus:ring-palette-400 transition-all bg-white outline-none"
                        />
                      ))}
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={otp.join('').length !== 4}
                    className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify OTP
                  </button>
                  <div className="mt-4 text-center">
                    <button type="button" onClick={() => { setForgotStep(1); setOtp(['', '', '', '']); }} className="text-sm font-semibold text-palette-400 hover:text-palette-900 transition-colors">
                      Back
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Set New Password</h3>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-900">New Password <span className="text-red-500">*</span></label>
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
                    <label className="block text-sm font-bold text-gray-900">Re-enter New Password <span className="text-red-500">*</span></label>
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
                    disabled={loading}
                    className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </>
          ) : loginMethod === 'email' ? (
            <>
              {/* Form */}
              <form className="space-y-5" onSubmit={handleLogin}>
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm font-semibold rounded-lg border border-green-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {successMessage}
                  </div>
                )}
                
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Email ID <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered Email ID"
                    className="w-full px-5 py-3.5 rounded-full border border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400 outline-none transition-all placeholder-gray-400"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••••"
                      className="w-full px-5 py-3.5 rounded-full border border-gray-300 bg-gray-50 focus:bg-white focus:border-palette-400 focus:ring-1 focus:ring-palette-400 outline-none transition-all tracking-widest placeholder-gray-400"
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
                  <div className="flex justify-end pt-1">
                    <button type="button" onClick={() => setLoginMethod('forgot')} className="text-sm font-semibold text-palette-400 hover:text-palette-900 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && <div className="text-red-500 text-sm font-semibold text-center">{error}</div>}

                {/* Login Button */}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-full shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* OTP Login Link */}
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setLoginMethod('otp')}
                  className="text-palette-400 font-bold hover:text-palette-900 transition-colors"
                >
                  Use OTP to Login
                </button>
              </div>
            </>
          ) : (
            <>
              {/* OTP Form */}
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onLoginSuccess?.(); }}>
                
                {/* Mobile Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-900">Mobile Number <span className="text-red-500">*</span></label>
                  <div className="flex items-center px-5 py-3.5 rounded-full border border-gray-300 focus-within:border-palette-400 focus-within:ring-1 focus-within:ring-palette-400 transition-all bg-white">
                    <span className="text-gray-900 font-semibold mr-1.5 whitespace-nowrap shrink-0">+91 -</span>
                    <input 
                      type="tel" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter your 10 digit mobile number"
                      className="w-full bg-transparent border-none outline-none placeholder-gray-400 text-gray-900 min-w-0"
                      disabled={otpSent}
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
                  {!otpSent && !errors.mobile && <p className="text-xs text-gray-500 mt-1">You will receive an OTP on this number</p>}
                </div>

                {/* OTP Input */}
                {otpSent && (
                  <div className="space-y-3 animate-fade-in pb-2">
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-500">Code sent to <span className="font-bold text-gray-900">+91 {mobile}</span></p>
                    </div>
                    <label className="block text-sm font-bold text-gray-900 text-center">Enter 4-digit OTP <span className="text-red-500">*</span></label>
                    <div className="flex justify-center gap-3">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength="1"
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          onFocus={(e) => e.target.select()}
                          className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:border-palette-400 focus:ring-2 focus:ring-palette-400 transition-all bg-white outline-none"
                        />
                      ))}
                    </div>
                    <div className="flex justify-center pt-2">
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(['', '', '', '']); }} className="text-xs font-bold text-palette-400 hover:text-palette-900 transition-colors">Change Number?</button>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {!otpSent ? (
                  <button 
                    type="button"
                    onClick={handleGetOtp}
                    disabled={mobile.length < 10 || loading}
                    className={`w-full py-3.5 text-white font-bold rounded-full transition-all duration-300 ${
                      mobile.length >= 10 && !loading
                        ? 'bg-palette-900 hover:bg-palette-400 shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transform hover:-translate-y-0.5' 
                        : 'bg-palette-200 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Checking...' : 'Get OTP'}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => onLoginSuccess?.()}
                    className={`w-full py-3.5 text-white font-bold rounded-full transition-all duration-300 ${
                      otp.join('').length === 4
                        ? 'bg-palette-900 hover:bg-palette-400 shadow-lg shadow-palette-900/30 hover:shadow-palette-400/40 transform hover:-translate-y-0.5' 
                        : 'bg-palette-200 cursor-not-allowed'
                    }`}
                    disabled={otp.join('').length !== 4}
                  >
                    Verify & Login
                  </button>
                )}
              </form>

              {/* Email Login Link */}
              <div className="mt-6 text-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-gray-200 flex-1"></div>
                  <span className="text-sm text-gray-400 font-medium">Or</span>
                  <div className="h-px bg-gray-200 flex-1"></div>
                </div>
                <button 
                  onClick={() => setLoginMethod('email')}
                  className="w-full py-3 border border-palette-400 text-palette-400 font-semibold rounded-full hover:bg-palette-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-palette-400 focus:ring-offset-2"
                >
                  Use Email to Login
                </button>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-sm text-gray-400 font-medium">Or</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          {/* Google Sign In */}
          {errors.google && (
            <div className="text-center text-red-600 text-sm font-semibold mb-3">
              {errors.google}
            </div>
          )}
          <button type="button" onClick={() => handleGoogleLogin()} disabled={loading} className="w-full py-3 flex items-center justify-center gap-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-semibold text-gray-700 disabled:opacity-70 disabled:cursor-not-allowed">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          {/* Create Account Link */}
          {onRegisterClick && (
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
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

export default EmployerLoginModal;
