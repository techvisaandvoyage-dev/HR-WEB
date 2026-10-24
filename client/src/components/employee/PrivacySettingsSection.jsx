import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PrivacySettingsSection = ({ userEmail }) => {
  const [isProfilePrivate, setIsProfilePrivate] = useState(() => {
    try {
      const p = localStorage.getItem('userProfile');
      if (p && JSON.parse(p).isProfilePrivate !== undefined) return Boolean(JSON.parse(p).isProfilePrivate);
    } catch (_) {}
    return true;
  });

  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Fetch latest privacy status from profile API on mount
  useEffect(() => {
    const fetchPrivacyStatus = async () => {
      const token = localStorage.getItem('employeeToken');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/api/employee/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data && data.isProfilePrivate !== undefined) {
          setIsProfilePrivate(Boolean(data.isProfilePrivate));
        }
      } catch (err) {
        console.error('Failed to fetch privacy status:', err);
      }
    };

    fetchPrivacyStatus();
  }, []);

  const handleTogglePrivacy = async () => {
    if (isUpdatingPrivacy) return;
    const newStatus = !isProfilePrivate;
    setIsUpdatingPrivacy(true);

    try {
      const token = localStorage.getItem('employeeToken');
      const res = await fetch(`${API_BASE}/api/employee/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isProfilePrivate: newStatus })
      });

      if (res.ok) {
        setIsProfilePrivate(newStatus);
        try {
          const saved = localStorage.getItem('userProfile');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.isProfilePrivate = newStatus;
            localStorage.setItem('userProfile', JSON.stringify(parsed));
          }
        } catch (_) {}

        showToast(
          newStatus
            ? 'Private Mode Enabled! Your profile is now hidden from the candidate directory. Only employers of jobs you apply to can view your profile.'
            : 'Public Mode Enabled! Your profile is now visible to all verified employers.'
        );
      } else {
        showToast('Failed to update privacy settings. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Privacy update error:', err);
      showToast('Network error while updating privacy settings.', 'error');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toastMessage.type === 'error' ? (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 text-xs sm:text-sm font-semibold">
            {toastMessage.text}
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg sm:text-2xl font-extrabold text-gray-900 tracking-tight">Privacy Settings</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
              Manage your visibility preferences and control who can find your profile in the candidate directory.
            </p>
          </div>
        </div>
      </div>

      {/* Main Privacy Toggle Card */}
      <div className="border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50/60 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-gray-900">Hide Profile from Candidate Directory (Private Mode)</h4>
              {isProfilePrivate ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  🔒 Private (Hidden)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Public
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
              Your profile details will be private. Only employers of jobs you have applied to will be able to view your profile.
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center pt-1">
            <button
              type="button"
              disabled={isUpdatingPrivacy}
              onClick={handleTogglePrivacy}
              aria-label="Toggle profile privacy"
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isProfilePrivate ? 'bg-emerald-600' : 'bg-gray-300'
              } ${isUpdatingPrivacy ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isProfilePrivate ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Information / Privacy Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-2xs space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs sm:text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            When Public
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Verified recruiters and company employers can discover your profile when searching for candidates matching your skills, experience, and designation.
          </p>
        </div>

        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-2xs space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs sm:text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            When Private Mode is Enabled (Default)
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your profile is completely hidden from recruiter search lists. Only employers of jobs you personally submit an application to will be able to see your details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettingsSection;
