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

const EmployerSettingsTab = ({ portalConfig }) => {
  const [securityData, setSecurityData] = useState({
    hasPassword: false,
    isGoogleConnected: false,
    email: '',
    fullName: '',
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

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);

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
    const token = localStorage.getItem('employerToken');
    if (!token) {
      setSecurityData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/employer/auth/security`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSecurityData({
          hasPassword: data.hasPassword,
          isGoogleConnected: data.isGoogleConnected,
          email: data.email || '',
          fullName: data.fullName || '',
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

  // Handle Submit: Set Password (For Google / Passwordless Users)
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
    const token = localStorage.getItem('employerToken');

    try {
      const res = await fetch(`${API_BASE}/api/employer/auth/set-password`, {
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
        showToast('Password created successfully! You can now log in using your email and password.');
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

  // Step 1 Submit: Request OTP for Changing Password
  const handleRequestChangePasswordOtp = async (e) => {
    e.preventDefault();
    setChangeForm(prev => ({ ...prev, error: '' }));

    if (!changeForm.currentPassword) {
      setChangeForm(prev => ({ ...prev, error: 'Please enter your current password.' }));
      return;
    }

    const criteria = checkPasswordCriteria(changeForm.newPassword);
    if (!criteria.isValid) {
      setChangeForm(prev => ({ ...prev, error: 'New password does not fulfill security requirements.' }));
      return;
    }

    if (changeForm.newPassword !== changeForm.confirmPassword) {
      setChangeForm(prev => ({ ...prev, error: 'New passwords do not match.' }));
      return;
    }

    if (changeForm.currentPassword === changeForm.newPassword) {
      setChangeForm(prev => ({ ...prev, error: 'New password must be different from current password.' }));
      return;
    }

    setChangeForm(prev => ({ ...prev, submitting: true }));
    const token = localStorage.getItem('employerToken');

    try {
      const res = await fetch(`${API_BASE}/api/employer/auth/change-password/send-otp`, {
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
          successInfo: data.message || `Verification code sent to ${maskEmail(securityData.email)}`
        }));
      } else {
        setChangeForm(prev => ({
          ...prev,
          error: data.message || 'Failed to verify current password.',
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
    setChangeForm(prev => ({ ...prev, resending: true, error: '' }));
    const token = localStorage.getItem('employerToken');

    try {
      const res = await fetch(`${API_BASE}/api/employer/auth/change-password/resend-otp`, {
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
          successInfo: data.message || 'A new verification code has been sent to your email.'
        }));
      } else {
        setChangeForm(prev => ({
          ...prev,
          resending: false,
          error: data.message || 'Failed to resend code.'
        }));
      }
    } catch (err) {
      setChangeForm(prev => ({
        ...prev,
        resending: false,
        error: 'Network error while resending OTP.'
      }));
    }
  };

  // Step 2 Submit: Verify OTP and Finalize Password Update
  const handleVerifyAndChangePassword = async (e) => {
    e.preventDefault();
    setChangeForm(prev => ({ ...prev, error: '' }));

    if (!changeForm.otp || changeForm.otp.trim().length < 4) {
      setChangeForm(prev => ({ ...prev, error: 'Please enter the valid OTP code.' }));
      return;
    }

    setChangeForm(prev => ({ ...prev, submitting: true }));
    const token = localStorage.getItem('employerToken');

    try {
      const res = await fetch(`${API_BASE}/api/employer/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: changeForm.currentPassword,
          newPassword: changeForm.newPassword,
          otp: changeForm.otp
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

  const displayEmail = securityData.email || 'your email';

  return (
    <div className="max-w-[760px] animate-in fade-in duration-150 pb-16">
      
      {/* Top Title */}
      <div className="mb-7">
        <h1 className="text-[26px] sm:text-[28px] font-bold text-[#101828] tracking-[-0.025em] leading-[1.2]">
          Settings &amp; security
        </h1>
        <p className="text-[#667085] text-[14px] mt-1">
          Manage how you sign in and keep your account safe.
        </p>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`mb-6 p-4 rounded-[10px] flex items-start gap-3 transition-all duration-300 border ${
            toastMessage.type === 'success'
              ? 'bg-[#ecfdf3] text-[#15803d] border-[#eaecf0]'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <svg className="w-5 h-5 text-[#16a34a] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div className="flex-1 text-[14px] font-medium leading-relaxed">{toastMessage.text}</div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Sign-in Methods Section */}
      <div className="space-y-1">
        <div className="mb-2">
          <h2 className="text-[18px] font-bold text-[#101828] tracking-[-0.01em]">Sign-in methods</h2>
          <p className="text-[#667085] text-[13.5px] mt-0.5">Linked authentication providers</p>
        </div>

        <div className="border-t border-[#eaecf0]">
          {/* Google Account Row */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4 py-4 border-b border-[#eaecf0] items-center min-h-[68px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 border border-[#eaecf0] rounded-[10px] flex items-center justify-center shrink-0 bg-white">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/>
                  <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/>
                  <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2l3.3-2.6z"/>
                  <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <strong className="font-semibold text-[14.5px] text-[#101828] block leading-tight">Google account</strong>
                <small className="block text-[#667085] text-[13px] leading-snug mt-0.5 truncate">{displayEmail} · Single sign-on enabled</small>
              </div>
            </div>

            <div className="justify-self-end sm:justify-self-auto">
              {securityData.isGoogleConnected ? (
                <span className="font-semibold text-[12px] bg-[#ecfdf3] text-[#15803d] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                  Connected
                </span>
              ) : (
                <span className="font-semibold text-[12px] bg-gray-100 text-[#667085] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                  Available
                </span>
              )}
            </div>
          </div>

          {/* Email & Password Row */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4 py-4 border-b border-[#eaecf0] items-center min-h-[68px]">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 border border-[#eaecf0] rounded-[10px] flex items-center justify-center shrink-0 bg-white text-[#667085]">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="15" r="4" />
                  <path d="m11 12 9-9M17 6l3 3" />
                </svg>
              </div>
              <div className="min-w-0">
                <strong className="font-semibold text-[14.5px] text-[#101828] block leading-tight">Email &amp; password</strong>
                <small className="block text-[#667085] text-[13px] leading-snug mt-0.5">
                  {securityData.hasPassword ? 'Password configured and active' : 'Password not set'}
                </small>
              </div>
            </div>

            <div className="justify-self-end sm:justify-self-auto">
              {securityData.hasPassword ? (
                <span className="font-semibold text-[12px] bg-[#ecfdf3] text-[#15803d] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                  Set
                </span>
              ) : (
                <span className="font-semibold text-[12px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Not set
                </span>
              )}
            </div>
          </div>

          {/* Password Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4 py-4 border-b border-[#eaecf0] items-center min-h-[68px]">
            <div>
              <strong className="font-semibold text-[14.5px] text-[#101828] block leading-tight">Password</strong>
              <p className="text-[#667085] text-[13.5px] mt-0.5 mb-0">
                {securityData.hasPassword
                  ? 'Your password is set. You can sign in with your email and password.'
                  : 'You signed in with Google. Set a password to also sign in with your email and password.'}
              </p>
            </div>

            <div className="justify-self-end sm:justify-self-auto">
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
                  className="border border-[#d0d5dd] rounded-[8px] px-4 py-2 text-[14px] font-semibold text-[#101828] hover:bg-[#f9fafb] transition-colors cursor-pointer"
                >
                  Set password
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
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
                    setIsChangeModalOpen(true);
                  }}
                  className="border border-[#d0d5dd] rounded-[8px] px-4 py-2 text-[14px] font-semibold text-[#101828] hover:bg-[#f9fafb] transition-colors cursor-pointer"
                >
                  Change password
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* MODAL 1: SET PASSWORD */}
        {isSetModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#101828]/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="bg-white rounded-[12px] max-w-md w-full p-6 sm:p-7 shadow-[0_12px_32px_rgba(16,24,40,0.12)] border border-[#eaecf0] relative animate-in fade-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#eaecf0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#ecfdf3] text-[#15803d] flex items-center justify-center border border-[#eaecf0]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#101828]">Set account password</h3>
                    <p className="text-[12.5px] text-[#667085]">Sign in with email and password</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSetModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-[#f9fafb] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSetPasswordSubmit} className="mt-5 space-y-4">
                {setForm.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-[13px] font-medium text-red-700 flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{setForm.error}</span>
                  </div>
                )}

                <div className="p-3 bg-[#f9fafb] rounded-[8px] border border-[#eaecf0] text-[13px] text-[#667085] leading-relaxed">
                  Setting a password allows you to log in with <strong className="text-[#101828] font-semibold">{displayEmail}</strong>. Your Google account connection will remain active.
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#101828] mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={setForm.showNew ? 'text' : 'password'}
                      value={setForm.newPassword}
                      onChange={e => setSetForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Create a strong password"
                      className="w-full px-3.5 py-2.5 pr-11 bg-white border border-[#d0d5dd] rounded-[8px] text-[14px] text-[#101828] placeholder-[#98a2b3] focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#ecfdf3] transition-all"
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

                  {setForm.newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#667085]">Password strength:</span>
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

                <div className="p-3 bg-[#f9fafb] rounded-[8px] border border-[#eaecf0] space-y-1 text-[12px] text-[#667085]">
                  <p className="font-semibold text-[#101828] text-[11px] uppercase tracking-wider mb-1">
                    Password requirements
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <div className={`flex items-center gap-1.5 ${setPasswordCriteria.minLength ? 'text-[#15803d] font-medium' : 'text-[#667085]'}`}>
                      <span>{setPasswordCriteria.minLength ? '✓' : '•'}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${setPasswordCriteria.hasUpper ? 'text-[#15803d] font-medium' : 'text-[#667085]'}`}>
                      <span>{setPasswordCriteria.hasUpper ? '✓' : '•'}</span>
                      <span>1 uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${setPasswordCriteria.hasLower ? 'text-[#15803d] font-medium' : 'text-[#667085]'}`}>
                      <span>{setPasswordCriteria.hasLower ? '✓' : '•'}</span>
                      <span>1 lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${setPasswordCriteria.hasNumberOrSymbol ? 'text-[#15803d] font-medium' : 'text-[#667085]'}`}>
                      <span>{setPasswordCriteria.hasNumberOrSymbol ? '✓' : '•'}</span>
                      <span>1 number or special symbol</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#101828] mb-1.5">Confirm password</label>
                  <div className="relative">
                    <input
                      type={setForm.showConfirm ? 'text' : 'password'}
                      value={setForm.confirmPassword}
                      onChange={e => setSetForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Re-enter your password"
                      className="w-full px-3.5 py-2.5 pr-11 bg-white border border-[#d0d5dd] rounded-[8px] text-[14px] text-[#101828] placeholder-[#98a2b3] focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#ecfdf3] transition-all"
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

                  {setForm.confirmPassword.length > 0 && (
                    <div className="mt-1.5 text-[12px]">
                      {setForm.newPassword === setForm.confirmPassword ? (
                        <span className="text-[#15803d] font-medium flex items-center gap-1">
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

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#eaecf0] mt-5">
                  <button
                    type="button"
                    onClick={() => setIsSetModalOpen(false)}
                    className="px-4 py-2 text-[14px] font-semibold text-[#667085] hover:bg-[#f9fafb] hover:text-[#101828] rounded-[8px] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={setForm.submitting || !setPasswordCriteria.isValid || setForm.newPassword !== setForm.confirmPassword}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-[8px] transition-all cursor-pointer shadow-none"
                  >
                    {setForm.submitting ? 'Saving...' : 'Set password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CHANGE PASSWORD */}
        {isChangeModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-[#101828]/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div
              className="bg-white rounded-[12px] max-w-md w-full p-6 sm:p-7 shadow-[0_12px_32px_rgba(16,24,40,0.12)] border border-[#eaecf0] relative animate-in fade-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#eaecf0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#ecfdf3] text-[#15803d] flex items-center justify-center border border-[#eaecf0]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#101828]">
                      {changeStep === 'form' ? 'Change password' : 'Enter verification code'}
                    </h3>
                    <p className="text-[12.5px] text-[#667085]">
                      {changeStep === 'form'
                        ? 'Update your security credentials'
                        : `Enter the code sent to ${maskEmail(securityData.email)}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseChangeModal}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-[#f9fafb] transition-colors"
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
                    <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-[13px] font-medium text-red-700 flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{changeForm.error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[13px] font-semibold text-[#101828] mb-1.5">Current password</label>
                    <div className="relative">
                      <input
                        type={changeForm.showCurrent ? 'text' : 'password'}
                        value={changeForm.currentPassword}
                        onChange={e => setChangeForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter your current password"
                        className="w-full px-3.5 py-2.5 pr-11 bg-white border border-[#d0d5dd] rounded-[8px] text-[14px] text-[#101828] placeholder-[#98a2b3] focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#ecfdf3] transition-all"
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

                  <div>
                    <label className="block text-[13px] font-semibold text-[#101828] mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        type={changeForm.showNew ? 'text' : 'password'}
                        value={changeForm.newPassword}
                        onChange={e => setChangeForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="w-full px-3.5 py-2.5 pr-11 bg-white border border-[#d0d5dd] rounded-[8px] text-[14px] text-[#101828] placeholder-[#98a2b3] focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#ecfdf3] transition-all"
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

                    {changeForm.newPassword.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#667085]">Strength:</span>
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

                  <div className="p-3 bg-[#f9fafb] rounded-[8px] border border-[#eaecf0] space-y-1 text-[12px] text-[#667085]">
                    <p className="font-semibold text-[#101828] text-[11px] uppercase tracking-wider mb-1">
                      New password requirements
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <div className={`flex items-center gap-1.5 ${changePasswordCriteria.minLength ? 'text-[#15803d] font-medium' : 'text-[#667085]'}`}>
                        <span>{changePasswordCriteria.minLength ? '✓' : '•'}</span>
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${changePasswordCriteria.hasUpper ? 'text-[#15803d] font-medium' : 'text-[#667085]'}`}>
                        <span>{changePasswordCriteria.hasUpper ? '✓' : '•'}</span>
                        <span>1 uppercase letter (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${changePasswordCriteria.hasLower ? 'text-[#15803d] font-medium' : 'text-[#667085]'}`}>
                        <span>{changePasswordCriteria.hasLower ? '✓' : '•'}</span>
                        <span>1 lowercase letter (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${changePasswordCriteria.hasNumberOrSymbol ? 'text-[#15803d] font-medium' : 'text-[#667085]'}`}>
                        <span>{changePasswordCriteria.hasNumberOrSymbol ? '✓' : '•'}</span>
                        <span>1 number or special symbol</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#101828] mb-1.5">Confirm new password</label>
                    <div className="relative">
                      <input
                        type={changeForm.showConfirm ? 'text' : 'password'}
                        value={changeForm.confirmPassword}
                        onChange={e => setChangeForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                        className="w-full px-3.5 py-2.5 pr-11 bg-white border border-[#d0d5dd] rounded-[8px] text-[14px] text-[#101828] placeholder-[#98a2b3] focus:outline-none focus:border-[#16a34a] focus:ring-2 focus:ring-[#ecfdf3] transition-all"
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

                    {changeForm.confirmPassword.length > 0 && (
                      <div className="mt-1.5 text-[12px]">
                        {changeForm.newPassword === changeForm.confirmPassword ? (
                          <span className="text-[#15803d] font-medium flex items-center gap-1">
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

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#eaecf0] mt-5">
                    <button
                      type="button"
                      onClick={handleCloseChangeModal}
                      className="px-4 py-2 text-[14px] font-semibold text-[#667085] hover:bg-[#f9fafb] hover:text-[#101828] rounded-[8px] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={changeForm.submitting || !changePasswordCriteria.isValid || changeForm.newPassword !== changeForm.confirmPassword || !changeForm.currentPassword}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-[8px] transition-all cursor-pointer shadow-none"
                    >
                      {changeForm.submitting ? 'Sending OTP...' : 'Send verification OTP'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: OTP VERIFICATION */}
              {changeStep === 'otp' && (
                <form onSubmit={handleVerifyAndChangePassword} className="mt-5 space-y-4">
                  {changeForm.successInfo && (
                    <div className="p-3 bg-[#ecfdf3] border border-[#eaecf0] rounded-[8px] text-[13px] font-medium text-[#15803d] flex items-start gap-2">
                      <svg className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{changeForm.successInfo}</span>
                    </div>
                  )}

                  {changeForm.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-[13px] font-medium text-red-700 flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{changeForm.error}</span>
                    </div>
                  )}

                  <div className="p-4 bg-[#f9fafb] border border-[#eaecf0] rounded-[8px] text-center space-y-3">
                    <label className="block text-[12px] font-semibold text-[#101828] uppercase tracking-wider">
                      Enter verification code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      value={changeForm.otp}
                      onChange={e => setChangeForm(prev => ({ ...prev, otp: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="• • • •"
                      className="w-44 mx-auto px-4 py-2.5 bg-white border border-[#16a34a] rounded-[8px] text-center font-mono font-bold text-xl tracking-[0.3em] text-[#101828] focus:outline-none ring-2 ring-[#ecfdf3] transition-all"
                      required
                    />
                    <p className="text-[12px] text-[#667085]">
                      A security code was sent to verify your identity before saving the new password.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[12.5px] px-1">
                    <span className="text-[#667085]">Didn't receive the email?</span>
                    {changeCooldown > 0 ? (
                      <span className="text-[#98a2b3] font-medium">
                        Resend in <span className="font-semibold text-[#101828]">{changeCooldown}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={changeForm.resending}
                        onClick={handleResendChangePasswordOtp}
                        className="text-[#15803d] hover:underline font-semibold disabled:opacity-50 cursor-pointer"
                      >
                        {changeForm.resending ? 'Sending...' : 'Resend code'}
                      </button>
                    )}
                  </div>

                  <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#eaecf0] mt-5">
                    <button
                      type="button"
                      onClick={() => setChangeStep('form')}
                      className="px-4 py-2 text-[14px] font-semibold text-[#667085] hover:bg-[#f9fafb] hover:text-[#101828] rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={changeForm.submitting || !changeForm.otp || changeForm.otp.trim().length < 4}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-[8px] transition-all cursor-pointer shadow-none"
                    >
                      {changeForm.submitting ? 'Verifying...' : 'Confirm & update password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default EmployerSettingsTab;
