import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Lock,
  AlertTriangle,
  Info,
  KeyRound,
  X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AuthorizedAdminsManager() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingEmail, setRemovingEmail] = useState(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);

  // OTP Verification Modal State
  const [otpModal, setOtpModal] = useState(null); // { email: '', otp: '', cooldown: 30 }
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const currentLoggedInEmail = (
    sessionStorage.getItem('adminEmail') ||
    localStorage.getItem('adminEmail') ||
    ''
  ).toLowerCase();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4500);
  };

  // Cooldown countdown timer for OTP modal
  useEffect(() => {
    if (!otpModal || otpModal.cooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpModal((prev) => (prev && prev.cooldown > 0 ? { ...prev, cooldown: prev.cooldown - 1 } : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpModal?.cooldown]);

  const getHeaders = () => {
    const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
    const headers = {
      'Content-Type': 'application/json',
      'x-admin-auth': 'true',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch authorized emails from backend
  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/auth/emails`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.emails)) {
        setEmails(data.emails);

        // If the current logged-in user was deleted, immediately log them out
        if (
          currentLoggedInEmail &&
          !data.emails.map((e) => e.toLowerCase()).includes(currentLoggedInEmail)
        ) {
          showToast('Your admin account is no longer authorized. Logging out...');
          sessionStorage.clear();
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('adminAuthenticated');
          setTimeout(() => {
            window.location.href = window.location.pathname;
          }, 800);
          return;
        }
      } else {
        showError(data.message || 'Failed to load authorized emails.');
      }
    } catch (err) {
      showError('Network error while fetching authorized admin emails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  // Step 1: Send OTP to new email address to initiate authorization
  const handleInitiateAdd = async (e) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();

    if (!clean) {
      showError('Please enter an email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      showError('Please enter a valid email address.');
      return;
    }

    if (emails.map((e) => e.toLowerCase()).includes(clean)) {
      showError('This email is already in the authorized administrator list.');
      return;
    }

    try {
      setAdding(true);
      const res = await fetch(`${API_URL}/api/admin/auth/emails/send-otp`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email: clean }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpModal({
          email: clean,
          otp: '',
          cooldown: data.cooldownSeconds || 30,
        });
        setOtpError('');
        showToast(data.message || `Verification OTP sent to ${clean}`);
      } else {
        showError(data.message || 'Failed to send OTP to this email.');
      }
    } catch (err) {
      showError('Network error while requesting verification OTP.');
    } finally {
      setAdding(false);
    }
  };

  // Resend OTP to the email being authorized
  const handleResendOtp = async () => {
    if (!otpModal?.email || otpModal.cooldown > 0 || resendingOtp) return;
    try {
      setResendingOtp(true);
      setOtpError('');
      const res = await fetch(`${API_URL}/api/admin/auth/emails/resend-otp`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email: otpModal.email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpModal((prev) => ({ ...prev, cooldown: data.cooldownSeconds || 30 }));
        showToast(`Verification code resent to ${otpModal.email}`);
      } else {
        setOtpError(data.message || 'Failed to resend verification code.');
      }
    } catch (err) {
      setOtpError('Network error while resending code.');
    } finally {
      setResendingOtp(false);
    }
  };

  // Step 2: Verify OTP and authorize email in database
  const handleVerifyAndAdd = async (e) => {
    e.preventDefault();
    if (!otpModal?.otp || otpModal.otp.trim().length < 4) {
      setOtpError('Please enter the 4-digit verification code.');
      return;
    }

    try {
      setVerifyingOtp(true);
      setOtpError('');
      const res = await fetch(`${API_URL}/api/admin/auth/emails`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          email: otpModal.email,
          otp: otpModal.otp.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `${otpModal.email} authorized successfully!`);
        setEmails(data.emails || [...emails, otpModal.email]);
        setNewEmail('');
        setOtpModal(null);
      } else {
        setOtpError(data.message || 'Failed to verify OTP code.');
      }
    } catch (err) {
      setOtpError('Network error while verifying OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Remove email
  const handleRemoveEmail = async (emailToRemove) => {
    if (emails.length <= 1) {
      showError('Cannot delete the last remaining administrator email.');
      setConfirmDeleteModal(null);
      return;
    }

    const cleanEmailToRemove = String(emailToRemove).trim().toLowerCase();
    const isSelfDelete = cleanEmailToRemove === currentLoggedInEmail;

    try {
      setRemovingEmail(emailToRemove);
      const res = await fetch(`${API_URL}/api/admin/auth/emails`, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ email: emailToRemove }),
      });

      const data = await res.json();
      if (data.success) {
        if (isSelfDelete) {
          showToast('You removed your own admin access. Logging out now...');
          sessionStorage.clear();
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('adminAuthenticated');
          setTimeout(() => {
            window.location.href = window.location.pathname;
          }, 800);
          return;
        }

        showToast(data.message || 'Admin email removed successfully!');
        setEmails(data.emails || emails.filter((e) => e.toLowerCase() !== emailToRemove.toLowerCase()));
      } else {
        showError(data.message || 'Failed to remove admin email.');
      }
    } catch (err) {
      showError('Network error while removing admin email.');
    } finally {
      setRemovingEmail(null);
      setConfirmDeleteModal(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-white shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {/* OTP Verification Modal for Adding New Admin Email */}
      {otpModal && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">
                    Verify Administrator Email
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Security confirmation code required
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOtpModal(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-600 leading-relaxed">
                We sent a 4-digit verification code to:
              </p>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 truncate">
                <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">{otpModal.email}</span>
              </div>
            </div>

            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Enter 4-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpModal.otp}
                  onChange={(e) => {
                    setOtpModal((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }));
                    setOtpError('');
                  }}
                  placeholder="• • • •"
                  autoFocus
                  required
                  className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:bg-white focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all text-gray-900"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-400">Didn't receive code?</span>
                {otpModal.cooldown > 0 ? (
                  <span className="text-gray-400 font-bold">
                    Resend in {otpModal.cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendingOtp}
                    className="font-bold text-green-700 hover:text-green-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    {resendingOtp && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Resend Code</span>
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOtpModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || !otpModal.otp || otpModal.otp.trim().length < 4}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyingOtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Authorize</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-gray-900">
                  {confirmDeleteModal?.toLowerCase() === currentLoggedInEmail
                    ? 'Remove Your Own Admin Access?'
                    : 'Remove Admin Access?'}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {confirmDeleteModal?.toLowerCase() === currentLoggedInEmail ? (
                    <span className="text-red-600 font-bold block bg-red-50 p-2.5 rounded-xl border border-red-200 mt-1">
                      ⚠️ You are removing your own email ({confirmDeleteModal}). You will be logged out of the Admin Portal immediately!
                    </span>
                  ) : (
                    <>
                      Are you sure you want to remove <strong className="text-gray-900 font-bold">{confirmDeleteModal}</strong>? This user will no longer be able to log in or receive OTP codes.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveEmail(confirmDeleteModal)}
                disabled={removingEmail === confirmDeleteModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {removingEmail === confirmDeleteModal ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80">
              Access Control & Security
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
            <span>Authorized Administrator Emails</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Manage the list of administrator Gmail addresses authorized to sign in to the SahiJob Admin Portal via password-free OTP verification.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEmails}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-gray-500'}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Top Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Whitelisted</div>
          <div className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
            <span>{emails.length}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Active Admins
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Authentication Mode</div>
          <div className="text-sm font-black text-gray-900 mt-1 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Gmail + OTP Verification</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Passwords completely disabled</div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Security Protection</div>
          <div className="text-sm font-black text-emerald-700 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Strict Whitelist Active</span>
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Unauthorized emails blocked</div>
        </div>
      </div>

      {/* CARD 1: ADD NEW AUTHORIZED EMAIL */}
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Add New Administrator Email</h3>
            <p className="text-xs text-gray-500">Authorize a new email address. A verification OTP will be sent to confirm authorization.</p>
          </div>
        </div>

        <form onSubmit={handleInitiateAdd} className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. newadmin@gmail.com"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={adding || !newEmail.trim()}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending OTP...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add Authorized Email</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* CARD 2: CURRENT AUTHORIZED ADMIN LIST */}
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900">Active Authorized Administrators</h3>
            <p className="text-xs text-gray-500">Only the emails listed below can request OTPs and access the Admin panel.</p>
          </div>
          <span className="text-xs font-bold text-gray-400">{emails.length} total</span>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-gray-500">Loading authorized emails...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No authorized emails configured</p>
            <p className="text-xs text-gray-500">Add an administrator email above to ensure access is granted.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {emails.map((emailItem, index) => {
              const isCurrentUser = currentLoggedInEmail === emailItem.toLowerCase();
              const initial = (emailItem[0] || 'A').toUpperCase();

              return (
                <div
                  key={emailItem}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Initial Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {emailItem}
                        </span>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            You (Current Session)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>Administrator #{index + 1} • Full Privileges</span>
                      </div>
                    </div>
                  </div>

                  {/* Remove Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteModal(emailItem)}
                      disabled={emails.length <= 1}
                      title={emails.length <= 1 ? 'Cannot delete the only remaining admin' : 'Remove access'}
                      className={`p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer ${
                        emails.length <= 1 ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-gray-400 hover:border-transparent' : ''
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Info Notice */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Important Security Note: </strong>
          Any Gmail address added here will have full administrator permissions over jobs, candidate applications, employer controls, database backups, and SEO settings. Always double-check before adding an email.
        </div>
      </div>
    </div>
  );
}
