import React, { useState, useEffect, useRef } from 'react';
import BrandLogo from '../components/common/BrandLogo';
import { ShieldCheck, Mail, KeyRound, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// STRICT Whitelist: Only these 3 emails are permitted for Admin Login
const ALLOWED_ADMIN_EMAILS = [
  'yashrajsingh28359@gmail.com',
  'gauravajm@gmail.com',
  'merakimovies@gmail.com',
];

export default function AdminLogin({ onLogin }) {
  // Steps: 'email' | 'otp'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [allowedEmails, setAllowedEmails] = useState(ALLOWED_ADMIN_EMAILS);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRef = useRef(null);

  // Sync dynamic authorized emails from backend on mount
  useEffect(() => {
    const fetchAllowedEmails = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/auth/allowed-emails`);
        const data = await res.json();
        if (data.success && Array.isArray(data.emails) && data.emails.length > 0) {
          setAllowedEmails(data.emails.map((e) => e.trim().toLowerCase()));
        }
      } catch (_) {}
    };
    fetchAllowedEmails();
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your administrator email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // STRICT Whitelist validation: Only authorized emails are allowed
    if (allowedEmails.length > 0 && !allowedEmails.includes(cleanEmail)) {
      setError('Access Denied: This email is not authorized for Admin access. Only whitelisted administrators are permitted.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep('otp');
        setOtp('');
        setCooldown(data.cooldownSeconds || 30);
        setSuccessMsg(data.message || 'Verification code sent to your email.');
      } else {
        setError(data.message || 'Unable to send verification code. Please try again.');
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining);
        }
      }
    } catch (err) {
      setError('Connection error. Please ensure the server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`${API_URL}/api/admin/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCooldown(data.cooldownSeconds || 30);
        setSuccessMsg(data.message || 'New verification code sent to your email.');
      } else {
        setError(data.message || 'Failed to resend code.');
        if (data.cooldownRemaining) {
          setCooldown(data.cooldownRemaining);
        }
      }
    } catch (err) {
      setError('Network error while resending verification code.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP & Sign In
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim().replace(/\D/g, '');

    if (!cleanOtp) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`${API_URL}/api/admin/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Store authenticated session
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminEmail', cleanEmail);
        if (data.token) {
          sessionStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminToken', data.token);
        }

        onLogin();
      } else {
        setError(data.message || 'Invalid verification code. Please check and try again.');
      }
    } catch (err) {
      setError('Network error during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <BrandLogo defaultHeight={36} />
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Admin Portal
            </span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xl p-7 sm:p-9 text-gray-900">
          
          {/* STEP 1: EMAIL INPUT */}
          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  Administrator Sign In
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Password-free login. Enter your authorized administrator email to receive a secure one-time passcode.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Email Input Field */}
              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="block text-xs font-bold text-gray-700">
                  Authorized Admin Email <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter authorized email"
                    autoComplete="email"
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all font-medium"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                  Strictly whitelisted for authorized administrator accounts only.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change Email
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Step 2 of 2
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600" />
                  Enter Verification Code
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  We sent a secure one-time passcode to:
                </p>
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 truncate">
                  <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              </div>

              {/* Success Notification */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Error Notification */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* OTP Input Field */}
              <div className="space-y-1.5">
                <label htmlFor="admin-otp" className="block text-xs font-bold text-gray-700">
                  One-Time Passcode (OTP)
                </label>
                <input
                  id="admin-otp"
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(clean);
                    setError('');
                  }}
                  placeholder="• • • •"
                  maxLength={6}
                  required
                  className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 bg-white border border-gray-300 rounded-xl text-green-700 placeholder:text-gray-300 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all font-mono"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-gray-400">Valid for 2 minutes</span>
                  
                  {/* Resend button */}
                  {cooldown > 0 ? (
                    <span className="text-[11px] font-bold text-gray-400">
                      Resend in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="text-[11px] font-bold text-green-700 hover:text-green-800 hover:underline transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      {resending ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Resending...</span>
                        </>
                      ) : (
                        <span>Resend Code</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || !otp.trim()}
                className="w-full py-3.5 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Enter Admin Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security Notice Footer */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Factor OTP Protected • SahiJob Admin Infrastructure</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}