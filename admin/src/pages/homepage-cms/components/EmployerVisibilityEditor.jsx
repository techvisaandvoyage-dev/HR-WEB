import React, { useState, useEffect } from 'react';
import {
  Eye,
  SlidersHorizontal,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_JOB_MATCH_BANNER_CONFIG = {
  enabled: true,
  badgeEmoji: '🎯',
  headerPrefix: 'MATCHED FOR',
  subheading: 'Matches your designation ({designation})',
  emptyMatchReason: 'This job matches your designation and role criteria.',
  designationChipText: '✓ Designation: {designation}',
  skillsChipText: '✓ Skills: {skills}',
  industryChipText: '✓ Industry Fit',
  cardBadgeText: '🎯 Matched for {designation}',
  cardBadgeEnabled: true,
  showDesignationChip: true,
  showSkillsChip: true,
  showIndustryChip: true
};

export default function EmployerVisibilityEditor({ onSaveSuccess }) {
  const [globalCardVisible, setGlobalCardVisible] = useState(true);
  const [globalCardLoading, setGlobalCardLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch site settings for global recruiter card visibility
        const resSettings = await fetch(`${API_URL}/api/admin/site-settings`);
        const dataSettings = await resSettings.json();
        if (dataSettings.success && dataSettings.data) {
          setGlobalCardVisible(!dataSettings.data.hidePostedByCardGlobally);
        }
      } catch (err) {
        console.error('Error loading visibility settings:', err);
        setErrorMessage('Failed to load visibility settings from server.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle Global "Posted by" Recruiter Card
  const handleToggleGlobalRecruiterCard = async () => {
    const newVisible = !globalCardVisible;
    try {
      setGlobalCardLoading(true);
      const res = await fetch(`${API_URL}/api/admin/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidePostedByCardGlobally: !newVisible })
      });
      const data = await res.json();
      if (data.success) {
        setGlobalCardVisible(newVisible);
        // Also update /api/homepage so both stay strictly in sync
        fetch(`${API_URL}/api/homepage`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hidePostedByCardGlobally: !newVisible })
        }).catch((e) => console.warn('Sync to homepage error:', e));

        showToast(
          newVisible
            ? 'Website-wide Recruiter Card ENABLED (Visible on job posts)'
            : 'Website-wide Recruiter Card DISABLED (Hidden on job posts)'
        );
        if (onSaveSuccess) onSaveSuccess();
      } else {
        alert(data.message || 'Failed to update visibility setting');
      }
    } catch (err) {
      console.error('Error toggling recruiter card visibility:', err);
      alert('Failed to connect to server');
    } finally {
      setGlobalCardLoading(false);
    }
  };

  // Save button handler
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/admin/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidePostedByCardGlobally: !globalCardVisible })
      });

      fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidePostedByCardGlobally: !globalCardVisible })
      }).catch((err) => console.warn('Sync to homepage error:', err));

      const data = await res.json();
      if (data.success) {
        showToast('Recruiter Card Visibility settings saved & published successfully!');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving visibility config:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-[100] bg-emerald-700 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 right-8 z-[100] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Eye className="w-7 h-7 text-emerald-600" />
            Recruiter Card Visibility Controls
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage website-wide "Posted by" recruiter identity card visibility on job postings across the entire platform.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving || loading || globalCardLoading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Visibility Settings</span>
        </button>
      </div>

      {/* Main 2-Column Split: Controls on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* GLOBAL RECRUITER CARD VISIBILITY CONTROLS */}
          <div className="bg-white rounded-2xl border border-emerald-200/90 p-6 sm:p-8 shadow-xs space-y-5 ring-1 ring-emerald-500/10">
            <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-gray-100">
              <div className="flex items-start gap-3.5 max-w-xl">
                <div className="w-11 h-11 rounded-xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs mt-0.5">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                      Website-wide "Posted by" Recruiter Card Visibility
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        globalCardVisible
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {globalCardVisible ? 'Global: ON' : 'Global: OFF'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Control whether recruiter identity cards (company name, recruiter profile, contact avatar) appear on public job postings across the entire platform.
                  </p>
                </div>
              </div>

              {/* Master Switch Button */}
              <button
                type="button"
                onClick={handleToggleGlobalRecruiterCard}
                disabled={globalCardLoading}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  globalCardVisible ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
                title="Toggle Recruiter Card Visibility"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    globalCardVisible ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 bg-gray-50/80 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-between gap-3 flex-wrap border border-gray-100">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-3 h-3 rounded-full ${
                    globalCardVisible ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                <span>
                  Current Status:{' '}
                  <strong>
                    {globalCardVisible
                      ? 'Enabled (Recruiter cards visible on job posts)'
                      : 'Disabled (Recruiter cards hidden globally)'}
                  </strong>
                </span>
              </div>
              {globalCardLoading && (
                <span className="text-xs text-emerald-600 flex items-center gap-1.5 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </span>
              )}
            </div>

            {/* Explanation card */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1.5">
              <div className="font-extrabold flex items-center gap-1.5 text-emerald-950">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                How Recruiter Card Visibility Works
              </div>
              <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                When <strong>Enabled</strong>, job seekers viewing job details will see recruiter information (name, designation, company size, and verification badge) in a dedicated "Posted by" card. When <strong>Disabled</strong>, recruiter personal details remain private and hidden website-wide.
              </p>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Live Visual Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                Live Visual Preview
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {globalCardVisible ? 'Card Visible' : 'Card Hidden'}
              </span>
            </div>

            {/* Preview: Website-wide "Posted by" Recruiter Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  "Posted by" Recruiter Card Preview
                </h4>
                {globalCardVisible ? (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Visible on Job Details
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    Hidden on Job Details
                  </span>
                )}
              </div>

              {globalCardVisible ? (
                <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-4">
                  <div>
                    <h5 className="text-xs text-gray-500 font-medium mb-3">Posted by</h5>
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-xs shrink-0 overflow-hidden">
                        <span className="text-base">👤</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">Yash Raj Singh</h4>
                        <p className="text-xs text-gray-700 mt-0.5 font-medium">Head of Retail at Amazone</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                            Verified Employer
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            • 11-50 employees
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">Last Active: Today</p>
                      </div>
                    </div>
                  </div>

                  {/* Job Analytics Stats Bar */}
                  <div className="bg-gray-50/90 rounded-xl p-3.5 border border-gray-100">
                    <div className="flex justify-around items-center text-center">
                      <div>
                        <div className="text-xl font-black font-serif text-gray-900">24</div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Job Views</div>
                      </div>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <div>
                        <div className="text-xl font-black font-serif text-gray-900">8</div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Applications</div>
                      </div>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <div>
                        <div className="text-xl font-black font-serif text-gray-900">3</div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Recruiter Actions</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-xl text-center text-xs text-gray-400 border border-dashed border-gray-200 space-y-1">
                  <p className="font-semibold text-gray-600">Recruiter card is currently disabled website-wide.</p>
                  <p className="text-[11px]">Job posts will only display company name without recruiter personal identity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
