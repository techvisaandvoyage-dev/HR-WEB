import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const GooglePrivacyModal = ({ isOpen, user, onComplete }) => {
  const [isProfilePrivate, setIsProfilePrivate] = useState(() => {
    return Boolean(user?.profile?.isProfilePrivate || false);
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const firstName = user?.profile?.firstName || user?.name?.split(' ')[0] || 'there';

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    const token = user?.token || localStorage.getItem('employeeToken');

    try {
      if (token) {
        const res = await fetch(`${API_BASE}/api/employee/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ isProfilePrivate })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.profile) {
            localStorage.setItem('userProfile', JSON.stringify(data.profile));
          }
        }
      }

      // Also ensure localStorage userProfile reflects current choice
      try {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.isProfilePrivate = isProfilePrivate;
          localStorage.setItem('userProfile', JSON.stringify(parsed));
        }
      } catch (_) {}
    } catch (err) {
      console.error('Error saving Google privacy settings:', err);
    } finally {
      setIsSaving(false);
      onComplete?.(isProfilePrivate);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 flex flex-col space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0 shadow-xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Privacy & Directory Settings</h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Welcome, <span className="text-palette-900 font-bold">{firstName}</span>! Choose how recruiters find your profile before heading to your homepage.
            </p>
          </div>
        </div>

        {/* Toggle Card */}
        <div className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-white to-gray-50/60 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-gray-900">
                  Hide Profile from Candidate Directory (Private Mode)
                </span>
                {isProfilePrivate ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    🔒 Private (Hidden)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Public (Visible)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                When enabled, your profile is hidden from general recruiter searches. Only employers whose jobs you apply to will view your details.
              </p>
            </div>

            <div className="flex-shrink-0 pt-1">
              <button
                type="button"
                onClick={() => setIsProfilePrivate(prev => !prev)}
                aria-label="Toggle profile privacy"
                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  isProfilePrivate ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
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

        {/* Guide Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => setIsProfilePrivate(false)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              !isProfilePrivate
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/40'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              When Public (Default)
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Verified recruiters & employers can find you when searching for matching skills and experience.
            </p>
          </div>

          <div
            onClick={() => setIsProfilePrivate(true)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              isProfilePrivate
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              When Private Mode is Enabled
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Completely hidden from recruiter search lists. Only visible to employers of jobs you personally apply to.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={isSaving}
            className="w-full sm:w-auto flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Preferences...
              </>
            ) : (
              'Save & Continue to Homepage →'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default GooglePrivacyModal;
