import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const checkPasswordCriteria = (pwd) => {
  const minLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(pwd);
  
  let score = 0;
  if (minLength) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumberOrSymbol) score++;

  return {
    minLength,
    hasUpper,
    hasLower,
    hasNumberOrSymbol,
    isValid: minLength && hasUpper && hasLower && hasNumberOrSymbol,
    score // 0 to 4
  };
};

const getStrengthLabel = (score) => {
  switch (score) {
    case 1:
      return { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' };
    case 2:
      return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
    case 3:
      return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
    case 4:
      return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
    default:
      return { label: '', color: 'bg-gray-200', text: 'text-gray-400' };
  }
};

const EyeIcon = ({ visible }) => (
  visible ? (
    <svg className="w-5 h-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  ) : (
    <svg className="w-5 h-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
);

const AccountSecuritySection = ({ userEmail }) => {
  const [securityData, setSecurityData] = useState({
    hasPassword: false,
    isGoogleConnected: false,
    email: userEmail || '',
    authProvider: 'local',
    loading: true
  });

  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  // Set Password Form State
  const [setForm, setSetForm] = useState({
    newPassword: '',
    confirmPassword: '',
    showNew: false,
    showConfirm: false,
    error: '',
    submitting: false
  });

  // Change Password Form State & 2-Step OTP Verification
  const [changeStep, setChangeStep] = useState('form'); // 'form' | 'otp'
  const [changeCooldown, setChangeCooldown] = useState(0);
  const [changeForm, setChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    error: '',
    successInfo: '',
    submitting: false,
    resending: false,
  });

  // Alert/Toast State
  const [toastMessage, setToastMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (changeCooldown > 0) {
      timer = setInterval(() => {
        setChangeCooldown(prev => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [changeCooldown]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (!domain) return email;
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user.slice(0, 2)}${'*'.repeat(Math.min(user.length - 2, 5))}@${domain}`;
  };

  const fetchSecurityStatus = async () => {
    const token = localStorage.getItem('employeeToken');
    if (!token) {
      setSecurityData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/employee/auth/security`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSecurityData({
          hasPassword: data.hasPassword,
          isGoogleConnected: data.isGoogleConnected,
          email: data.email || userEmail || '',
          authProvider: data.authProvider,
          loading: false
        });
      } else {
        setSecurityData(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Failed to fetch security status:', err);
      setSecurityData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  // Handle Submit: Set Password (For Google Users)
  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    setSetForm(prev => ({ ...prev, error: '' }));

    const criteria = checkPasswordCriteria(setForm.newPassword);
    if (!criteria.isValid) {
      setSetForm(prev => ({ ...prev, error: 'Please fulfill all password requirements below.' }));
      return;
    }

    if (setForm.newPassword !== setForm.confirmPassword) {
      setSetForm(prev => ({ ...prev, error: 'Passwords do not match.' }));
      return;
    }

    setSetForm(prev => ({ ...prev, submitting: true }));
    const token = localStorage.getItem('employeeToken');

    try {
      const res = await fetch(`${API_BASE}/api/employee/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: setForm.newPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSecurityData(prev => ({
          ...prev,
          hasPassword: true
        }));
        setIsSetModalOpen(false);
        setSetForm({
          newPassword: '',
          confirmPassword: '',
          showNew: false,
          showConfirm: false,
          error: '',
          submitting: false
        });
        showToast('Password set successfully! You can now sign in with your email & password or continue with Google.');
      } else {
        setSetForm(prev => ({
          ...prev,
          error: data.message || 'Failed to set password. Please try again.',
          submitting: false
        }));
      }
    } catch (err) {
      setSetForm(prev => ({
        ...prev,
        error: 'Network error. Please try again later.',
        submitting: false
      }));
    }
  };

  // Step 1: Request OTP to Change Password
  const handleRequestChangePasswordOtp = async (e) => {
    e.preventDefault();
    setChangeForm(prev => ({ ...prev, error: '', successInfo: '' }));

    if (!changeForm.currentPassword) {
      setChangeForm(prev => ({ ...prev, error: 'Please enter your current password.' }));
      return;
    }

    const criteria = checkPasswordCriteria(changeForm.newPassword);
    if (!criteria.isValid) {
      setChangeForm(prev => ({ ...prev, error: 'Please fulfill all new password requirements below.' }));
      return;
    }

    if (changeForm.newPassword === changeForm.currentPassword) {
      setChangeForm(prev => ({ ...prev, error: 'New password must be different from your current password.' }));
      return;
    }

    if (changeForm.newPassword !== changeForm.confirmPassword) {
      setChangeForm(prev => ({ ...prev, error: 'New passwords do not match.' }));
      return;
    }

    setChangeForm(prev => ({ ...prev, submitting: true }));
    const token = localStorage.getItem('employeeToken');

    try {
      const res = await fetch(`${API_BASE}/api/employee/auth/change-password/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: changeForm.currentPassword,
          newPassword: changeForm.newPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setChangeStep('otp');
        setChangeCooldown(data.cooldownSeconds || 30);
        setChangeForm(prev => ({
          ...prev,
          submitting: false,
          error: '',
          successInfo: `Verification code sent to ${maskEmail(data.email || securityData.email)}.`
        }));
      } else {
        setChangeForm(prev => ({
          ...prev,
          error: data.message || 'Failed to send OTP. Please check your current password.',
          submitting: false
        }));
      }
    } catch (err) {
      setChangeForm(prev => ({
        ...prev,
        error: 'Network error. Please try again later.',
        submitting: false
      }));
    }
  };

  // Resend OTP in Step 2
  const handleResendChangePasswordOtp = async () => {
    if (changeCooldown > 0 || changeForm.resending) return;
    setChangeForm(prev => ({ ...prev, resending: true, error: '', successInfo: '' }));
    const token = localStorage.getItem('employeeToken');

    try {
      const res = await fetch(`${API_BASE}/api/employee/auth/change-password/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setChangeCooldown(data.cooldownSeconds || 30);
        setChangeForm(prev => ({
          ...prev,
          resending: false,
          successInfo: 'A fresh verification OTP has been sent to your email.'
        }));
      } else {
        setChangeForm(prev => ({
          ...prev,
          resending: false,
          error: data.message || 'Failed to resend OTP. Please try again.'
        }));
      }
    } catch (err) {
      setChangeForm(prev => ({
        ...prev,
        resending: false,
        error: 'Network error. Please try again later.'
      }));
    }
  };

  // Step 2: Verify OTP and finalize Password Change
  const handleVerifyAndChangePassword = async (e) => {
    e.preventDefault();
    setChangeForm(prev => ({ ...prev, error: '', successInfo: '' }));

    if (!changeForm.otp || changeForm.otp.trim().length < 4) {
      setChangeForm(prev => ({ ...prev, error: 'Please enter the complete verification code.' }));
      return;
    }

    setChangeForm(prev => ({ ...prev, submitting: true }));
    const token = localStorage.getItem('employeeToken');

    try {
      const res = await fetch(`${API_BASE}/api/employee/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: changeForm.currentPassword,
          newPassword: changeForm.newPassword,
          otp: changeForm.otp.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsChangeModalOpen(false);
        setChangeStep('form');
        setChangeForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          otp: '',
          showCurrent: false,
          showNew: false,
          showConfirm: false,
          error: '',
          successInfo: '',
          submitting: false,
          resending: false
        });
        showToast('Your password has been updated successfully. Keep it secure!');
      } else {
        setChangeForm(prev => ({
          ...prev,
          error: data.message || 'Invalid or expired OTP code. Please try again.',
          submitting: false
        }));
      }
    } catch (err) {
      setChangeForm(prev => ({
        ...prev,
        error: 'Network error. Please try again later.',
        submitting: false
      }));
    }
  };

  const handleCloseChangeModal = () => {
    setIsChangeModalOpen(false);
    setChangeStep('form');
    setChangeForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      otp: '',
      showCurrent: false,
      showNew: false,
      showConfirm: false,
      error: '',
      successInfo: '',
      submitting: false,
      resending: false
    });
  };

  const setPasswordCriteria = checkPasswordCriteria(setForm.newPassword);
  const setStrength = getStrengthLabel(setPasswordCriteria.score);

  const changePasswordCriteria = checkPasswordCriteria(changeForm.newPassword);
  const changeStrength = getStrengthLabel(changePasswordCriteria.score);

  const displayEmail = securityData.email || userEmail || 'your email';

  return (
    <section id="security" className="scroll-mt-40 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-100 gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Security &amp; Password</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your sign-in methods, password credentials, and authentication security.
          </p>
        </div>
      </div>

      {/* Toast / Notification Banner */}
      {toastMessage && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-2 border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div className="flex-1 text-sm font-medium leading-relaxed">{toastMessage.text}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 1. SIGN-IN METHODS SECTION */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sign-in methods</h4>
          <span className="text-xs text-gray-400">Linked authentication providers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Sign-in Card */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-gray-200/80 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">Google Account</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px] sm:max-w-xs">{displayEmail}</p>
                <p className="text-[11px] text-gray-400 mt-1">Single Sign-On enabled</p>
              </div>
            </div>

            <div>
              {securityData.isGoogleConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                  Available
                </span>
              )}
            </div>
          </div>

          {/* Password Sign-in Card */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-gray-200/80 flex items-center justify-center flex-shrink-0 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900">Email &amp; Password</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {securityData.hasPassword
                    ? 'Password configured and active'
                    : 'Not set (Google sign-in only)'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Direct account authentication</p>
              </div>
            </div>

            <div>
              {securityData.hasPassword ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Set
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Not set
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Informative Guidance Banner for Google Users */}
        {securityData.isGoogleConnected && !securityData.hasPassword && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-bold text-blue-950">Flexibility Notice:</span> Setting a password will securely attach to this account without creating a duplicate. You will still be able to continue signing in with Google at any time.
            </div>
          </div>
        )}
      </div>

      {/* 2. PASSWORD MANAGEMENT CARD (Dynamic according to auth state) */}
      <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-white to-gray-50/60 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-gray-900">Password</h4>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xl leading-relaxed">
              {!securityData.hasPassword
                ? 'You signed in with Google. Set a password to also sign in with your email and password.'
                : 'Your password is set. You can now sign in with your email and password.'}
            </p>
          </div>

          <div className="flex-shrink-0">
            {!securityData.hasPassword ? (
              <button
                type="button"
                onClick={() => {
                  setSetForm({
                    newPassword: '',
                    confirmPassword: '',
                    showNew: false,
                    showConfirm: false,
                    error: '',
                    submitting: false
                  });
                  setIsSetModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Set Password
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setChangeForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                    showCurrent: false,
                    showNew: false,
                    showConfirm: false,
                    error: '',
                    submitting: false
                  });
                  setIsChangeModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300 active:scale-[0.98]"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Change Password
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SET PASSWORD (For Google / Passwordless users)                    */}
      {/* ========================================================================= */}
      {isSetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Set Account Password</h3>
                  <p className="text-xs text-gray-500">Sign in with email and password</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSetPasswordSubmit} className="mt-5 space-y-4">
              {setForm.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{setForm.error}</span>
                </div>
              )}

              {/* Context Info */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 text-xs text-gray-600 leading-relaxed">
                Setting a password allows you to log in with <strong className="text-gray-900">{displayEmail}</strong>. Your Google account connection will remain active.
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={setForm.showNew ? 'text' : 'password'}
                    value={setForm.newPassword}
                    onChange={e => setSetForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Create a strong password"
                    className="w-full px-3.5 py-2.5 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSetForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    tabIndex="-1"
                  >
                    <EyeIcon visible={setForm.showNew} />
                  </button>
                </div>

                {/* Password Strength Meter */}
                {setForm.newPassword.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">Password strength:</span>
                      <span className={`font-bold ${setStrength.text}`}>{setStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className={`rounded-full transition-all duration-300 ${
                            setPasswordCriteria.score >= idx ? setStrength.color : 'bg-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements Checklist */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/60 space-y-1.5 text-xs text-gray-600">
                <p className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                  Password Requirements
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${setPasswordCriteria.minLength ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                    <span>{setPasswordCriteria.minLength ? '✓' : '•'}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${setPasswordCriteria.hasUpper ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                    <span>{setPasswordCriteria.hasUpper ? '✓' : '•'}</span>
                    <span>1 uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${setPasswordCriteria.hasLower ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                    <span>{setPasswordCriteria.hasLower ? '✓' : '•'}</span>
                    <span>1 lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${setPasswordCriteria.hasNumberOrSymbol ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                    <span>{setPasswordCriteria.hasNumberOrSymbol ? '✓' : '•'}</span>
                    <span>1 number or special symbol</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={setForm.showConfirm ? 'text' : 'password'}
                    value={setForm.confirmPassword}
                    onChange={e => setSetForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter your password"
                    className="w-full px-3.5 py-2.5 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSetForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    tabIndex="-1"
                  >
                    <EyeIcon visible={setForm.showConfirm} />
                  </button>
                </div>

                {/* Match indicator */}
                {setForm.confirmPassword.length > 0 && (
                  <div className="mt-1.5 text-xs">
                    {setForm.newPassword === setForm.confirmPassword ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        ✓ Passwords match
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        ✕ Passwords do not match yet
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSetModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setForm.submitting || !setPasswordCriteria.isValid || setForm.newPassword !== setForm.confirmPassword}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {setForm.submitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Set Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHANGE PASSWORD (With OTP Verification)                           */}
      {/* ========================================================================= */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {changeStep === 'form' ? 'Change Password' : 'Enter Verification Code'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {changeStep === 'form'
                      ? 'Update your security credentials'
                      : `Enter the code sent to ${maskEmail(securityData.email)}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseChangeModal}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* STEP 1: PASSWORD FORM */}
            {changeStep === 'form' && (
              <form onSubmit={handleRequestChangePasswordOtp} className="mt-5 space-y-4">
                {changeForm.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{changeForm.error}</span>
                  </div>
                )}

                {/* Current Password Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={changeForm.showCurrent ? 'text' : 'password'}
                      value={changeForm.currentPassword}
                      onChange={e => setChangeForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter your current password"
                      className="w-full px-3.5 py-2.5 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setChangeForm(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      tabIndex="-1"
                    >
                      <EyeIcon visible={changeForm.showCurrent} />
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={changeForm.showNew ? 'text' : 'password'}
                      value={changeForm.newPassword}
                      onChange={e => setChangeForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className="w-full px-3.5 py-2.5 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setChangeForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      tabIndex="-1"
                    >
                      <EyeIcon visible={changeForm.showNew} />
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {changeForm.newPassword.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Strength:</span>
                        <span className={`font-bold ${changeStrength.text}`}>{changeStrength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map(idx => (
                          <div
                            key={idx}
                            className={`rounded-full transition-all duration-300 ${
                              changePasswordCriteria.score >= idx ? changeStrength.color : 'bg-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Requirements Checklist */}
                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/60 space-y-1.5 text-xs text-gray-600">
                  <p className="font-semibold text-gray-700 text-[11px] uppercase tracking-wider mb-1">
                    New Password Requirements
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 ${changePasswordCriteria.minLength ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                      <span>{changePasswordCriteria.minLength ? '✓' : '•'}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${changePasswordCriteria.hasUpper ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                      <span>{changePasswordCriteria.hasUpper ? '✓' : '•'}</span>
                      <span>1 uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${changePasswordCriteria.hasLower ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                      <span>{changePasswordCriteria.hasLower ? '✓' : '•'}</span>
                      <span>1 lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${changePasswordCriteria.hasNumberOrSymbol ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                      <span>{changePasswordCriteria.hasNumberOrSymbol ? '✓' : '•'}</span>
                      <span>1 number or special symbol</span>
                    </div>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={changeForm.showConfirm ? 'text' : 'password'}
                      value={changeForm.confirmPassword}
                      onChange={e => setChangeForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setChangeForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      tabIndex="-1"
                    >
                      <EyeIcon visible={changeForm.showConfirm} />
                    </button>
                  </div>

                  {/* Match indicator */}
                  {changeForm.confirmPassword.length > 0 && (
                    <div className="mt-1.5 text-xs">
                      {changeForm.newPassword === changeForm.confirmPassword ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          ✓ Passwords match
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          ✕ Passwords do not match yet
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseChangeModal}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changeForm.submitting || !changePasswordCriteria.isValid || changeForm.newPassword !== changeForm.confirmPassword || !changeForm.currentPassword}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                  >
                    {changeForm.submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      'Send Verification OTP'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION STEP */}
            {changeStep === 'otp' && (
              <form onSubmit={handleVerifyAndChangePassword} className="mt-5 space-y-4">
                {changeForm.successInfo && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-800 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{changeForm.successInfo}</span>
                  </div>
                )}

                {changeForm.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{changeForm.error}</span>
                  </div>
                )}

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Enter Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={changeForm.otp}
                    onChange={e => setChangeForm(prev => ({ ...prev, otp: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="• • • •"
                    className="w-44 mx-auto px-4 py-3 bg-white border-2 border-blue-400 rounded-xl text-center font-mono font-bold text-xl tracking-[0.3em] text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
                    required
                  />
                  <p className="text-[11px] text-gray-500">
                    A security code was sent to verify your identity before saving the new password.
                  </p>
                </div>

                {/* Resend OTP Row */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-gray-500">Didn't receive the email?</span>
                  {changeCooldown > 0 ? (
                    <span className="text-gray-400 font-medium">
                      Resend in <span className="font-bold text-gray-700">{changeCooldown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={changeForm.resending}
                      onClick={handleResendChangePasswordOtp}
                      className="text-blue-600 hover:text-blue-700 font-bold hover:underline disabled:opacity-50"
                    >
                      {changeForm.resending ? 'Sending...' : 'Resend Code'}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center justify-between gap-3 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setChangeStep('form')}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={changeForm.submitting || !changeForm.otp || changeForm.otp.trim().length < 4}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                  >
                    {changeForm.submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      'Confirm & Update Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountSecuritySection;
