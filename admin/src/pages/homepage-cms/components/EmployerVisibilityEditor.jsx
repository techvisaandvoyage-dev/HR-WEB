import React, { useState, useEffect } from 'react';
import {
  Eye,
  SlidersHorizontal,
  Save,
  RefreshCw,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tag,
  Award,
  Target,
  Sliders,
  ShieldCheck,
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
  const [bannerConfig, setBannerConfig] = useState(DEFAULT_JOB_MATCH_BANNER_CONFIG);
  const [globalCardVisible, setGlobalCardVisible] = useState(true);
  const [globalCardLoading, setGlobalCardLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Live tester sandbox states
  const [previewDesignation, setPreviewDesignation] = useState('Auditor');
  const [previewSkills, setPreviewSkills] = useState('Auditing, Compliance, Taxation');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch CMS homepage settings for match banner
        const resHome = await fetch(`${API_URL}/api/homepage`);
        const dataHome = await resHome.json();
        if (dataHome.success && dataHome.data) {
          const step6 = dataHome.data.employerPostJob?.step6 || dataHome.data.jobMatchBanner;
          if (step6) {
            setBannerConfig(prev => ({
              ...prev,
              ...step6
            }));
          }
        }

        // 2. Fetch site settings for global recruiter card visibility
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
        showToast(newVisible ? 'Website-wide Recruiter Card ENABLED (Visible on job posts)' : 'Website-wide Recruiter Card DISABLED (Hidden on job posts)');
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

  // Field change handler for Banner Config
  const handleBannerPropChange = (key, value) => {
    setBannerConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save Settings Function for Match Banner
  const handleSaveBannerConfig = async () => {
    try {
      setSaving(true);
      setToastMessage('');
      setErrorMessage('');

      // Fetch existing employerPostJob config to preserve all other steps
      const resHome = await fetch(`${API_URL}/api/homepage`);
      const dataHome = await resHome.json();
      const existingEmployerPostJob = (dataHome.success && dataHome.data?.employerPostJob) ? dataHome.data.employerPostJob : {};

      const updatedEmployerPostJob = {
        ...existingEmployerPostJob,
        step6: bannerConfig
      };

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerPostJob: updatedEmployerPostJob,
          jobMatchBanner: bannerConfig
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Display & Visibility settings saved & published successfully!');
        if (onSaveSuccess) onSaveSuccess(bannerConfig);
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving Visibility config:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-xs">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-600 mb-3" />
        <p className="text-xs font-bold text-gray-500">Loading Display & Visibility Controls...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 pb-12">
      
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
            Job Display & Visibility Controls
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage website-wide recruiter card visibility and customize the candidate job match highlight banner & badges.
          </p>
        </div>

        <button
          onClick={handleSaveBannerConfig}
          disabled={saving || loading}
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
          
          {/* SECTION 1: CANDIDATE JOB MATCH HIGHLIGHT BANNER & BADGES */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    Candidate Job Match Highlight Banner
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customize the highlight banner, labels, and badges displayed when a candidate's profile matches job criteria.
                  </p>
                </div>
              </div>

              {/* Match Banner Toggle */}
              <div className="flex items-center gap-2.5 bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700">
                  {bannerConfig?.enabled !== false ? 'Active' : 'Disabled'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerConfig?.enabled !== false}
                    onChange={(e) => handleBannerPropChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Banner Title & Subtitle Texts */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Banner Heading & Subtitle Texts
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700">Banner Title Prefix</label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      Auto + Designation
                    </span>
                  </div>
                  <input
                    type="text"
                    value={bannerConfig?.headerPrefix || 'MATCHED FOR'}
                    onChange={(e) => handleBannerPropChange('headerPrefix', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. MATCHED FOR"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Prefix added before designation, e.g. <strong className="text-gray-600">🎯 MATCHED FOR AUDITOR</strong>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700">Banner Subtitle Template</label>
                    <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      {'{designation}'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={bannerConfig?.subheading || 'Matches your designation ({designation})'}
                    onChange={(e) => handleBannerPropChange('subheading', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Matches your designation ({designation})"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Example: <strong className="text-gray-600">Matches your designation (Auditor)</strong>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fallback Match Reason</label>
                <input
                  type="text"
                  value={bannerConfig?.emptyMatchReason || 'This job matches your designation and role criteria.'}
                  onChange={(e) => handleBannerPropChange('emptyMatchReason', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. This job matches your designation and role criteria."
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown if no specific designation or skills match reason is generated.
                </p>
              </div>
            </div>

            {/* Match Highlight Chips Customization */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                Match Highlight Chips / Pills
              </h4>

              {/* Designation Chip */}
              <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <label className="text-xs font-bold text-gray-800">Designation Chip Text</label>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig?.showDesignationChip !== false}
                      onChange={(e) => handleBannerPropChange('showDesignationChip', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Show Chip</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={bannerConfig?.designationChipText || '✓ Designation: {designation}'}
                  onChange={(e) => handleBannerPropChange('designationChipText', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. ✓ Designation: {designation}"
                />
              </div>

              {/* Skills Chip */}
              <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <label className="text-xs font-bold text-gray-800">Skills Chip Text</label>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig?.showSkillsChip !== false}
                      onChange={(e) => handleBannerPropChange('showSkillsChip', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Show Chip</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={bannerConfig?.skillsChipText || '✓ Skills: {skills}'}
                  onChange={(e) => handleBannerPropChange('skillsChipText', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. ✓ Skills: {skills}"
                />
              </div>

              {/* Industry Fit Chip */}
              <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <label className="text-xs font-bold text-gray-800">Industry Fit Chip Text</label>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bannerConfig?.showIndustryChip !== false}
                      onChange={(e) => handleBannerPropChange('showIndustryChip', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Show Chip</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={bannerConfig?.industryChipText || '✓ Industry Fit'}
                  onChange={(e) => handleBannerPropChange('industryChipText', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. ✓ Industry Fit"
                />
              </div>
            </div>

            {/* Job Card List Badge */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Job Card List Badge
                </h4>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerConfig?.cardBadgeEnabled !== false}
                    onChange={(e) => handleBannerPropChange('cardBadgeEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Show on Job Cards</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Badge Text Template</label>
                <input
                  type="text"
                  value={bannerConfig?.cardBadgeText || '🎯 Matched for {designation}'}
                  onChange={(e) => handleBannerPropChange('cardBadgeText', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 🎯 Matched for {designation}"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown as a highlight badge at the top of each matching job card on the candidate homepage.
                </p>
              </div>
            </div>

            {/* Helpful Variables Note */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1.5">
              <div className="font-extrabold flex items-center gap-1.5 text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                Available Dynamic Variables
              </div>
              <p className="text-[11px] text-emerald-800">
                You can use these dynamic placeholder tags in text fields — they will be automatically replaced with candidate profile data:
              </p>
              <div className="flex gap-2 flex-wrap pt-1">
                <span className="font-mono font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  {'{designation}'}
                </span>
                <span className="font-mono font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  {'{skills}'}
                </span>
              </div>
            </div>

          </div>

          {/* SECTION 2: GLOBAL RECRUITER CARD VISIBILITY CONTROLS */}
          <div className="bg-white rounded-2xl border border-emerald-200/90 p-6 shadow-xs space-y-4 ring-1 ring-emerald-500/10">
            <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-gray-100">
              <div className="flex items-start gap-3 max-w-xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs mt-0.5">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                      Website-wide "Posted by" Recruiter Card Visibility
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      globalCardVisible 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {globalCardVisible ? 'Global: ON' : 'Global: OFF'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Control whether recruiter identity cards (company name, recruiter profile, contact avatar) appear on public job postings across the entire platform.
                  </p>
                </div>
              </div>

              {/* Master Switch Button */}
              <button
                type="button"
                onClick={handleToggleGlobalRecruiterCard}
                disabled={globalCardLoading}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  globalCardVisible ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    globalCardVisible ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 bg-gray-50/80 rounded-xl text-xs font-medium text-gray-700 flex items-center justify-between gap-3 flex-wrap border border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${globalCardVisible ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span>
                  Current Status: <strong>{globalCardVisible ? 'Enabled (Recruiter cards visible on job posts)' : 'Disabled (Recruiter cards hidden globally)'}</strong>
                </span>
              </div>
              {globalCardLoading && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Right 5 Columns: Live Visual Preview & Interactive Playground */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                Live Visual Preview
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Interactive Tester
              </span>
            </div>

            {/* Interactive Test Inputs */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
              <div className="text-xs font-extrabold text-gray-800 flex items-center justify-between">
                <span>Test with Custom Values:</span>
                <span className="text-[10px] text-gray-400 font-normal">Type below to see instant update</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Test Designation</label>
                  <input
                    type="text"
                    value={previewDesignation}
                    onChange={(e) => setPreviewDesignation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Auditor"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Test Skills</label>
                  <input
                    type="text"
                    value={previewSkills}
                    onChange={(e) => setPreviewSkills(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Auditing, Excel"
                  />
                </div>
              </div>
            </div>

            {/* Preview 1: Candidate Job Details Highlight Banner */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Candidate Details Page Banner
                </h4>
                {bannerConfig?.enabled !== false ? (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Enabled
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    Hidden
                  </span>
                )}
              </div>

              {bannerConfig?.enabled !== false ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                          🎯 {(bannerConfig?.headerPrefix || 'MATCHED FOR').trim()} {(previewDesignation || 'AUDITOR').toUpperCase()}
                        </h4>
                      </div>
                      <p className="text-xs font-medium text-emerald-950">
                        {(bannerConfig?.subheading || 'Matches your designation ({designation})').replace(/\{designation\}/gi, previewDesignation || 'Auditor')}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {bannerConfig?.showDesignationChip !== false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                            {(bannerConfig?.designationChipText || '✓ Designation: {designation}').replace(/\{designation\}/gi, previewDesignation || 'Auditor')}
                          </span>
                        )}

                        {bannerConfig?.showSkillsChip !== false && previewSkills && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                            {(bannerConfig?.skillsChipText || '✓ Skills: {skills}').replace(/\{skills\}/gi, previewSkills || 'Auditing')}
                          </span>
                        )}

                        {bannerConfig?.showIndustryChip !== false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                            {bannerConfig?.industryChipText || '✓ Industry Fit'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-xl text-center text-xs text-gray-400 border border-dashed border-gray-200">
                  Banner is currently disabled. Toggle active to preview.
                </div>
              )}
            </div>

            {/* Preview 2: Left Job Card Badge */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Job Card in Listings
                </h4>
                {bannerConfig?.cardBadgeEnabled !== false ? (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Badge Visible
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    Badge Hidden
                  </span>
                )}
              </div>

              <div className="p-4 bg-white border border-emerald-500/60 rounded-xl shadow-xs space-y-3">
                {bannerConfig?.cardBadgeEnabled !== false && (
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-emerald-100">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>
                        {(bannerConfig?.cardBadgeText || '🎯 Matched for {designation}').replace(/\{designation\}/gi, previewDesignation || 'Auditor')}
                      </span>
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Alpha Global Ltd.</h4>
                    <h3 className="text-base font-bold text-emerald-700">{previewDesignation || 'Senior Auditor'}</h3>
                    <p className="text-xs text-gray-500">Bangalore, Karnataka • Full-time • ₹ 8-14 LPA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview 3: Website-wide "Posted by" Recruiter Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                  "Posted by" Recruiter Card Live Preview
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
                        <h4 className="text-sm font-bold text-gray-900 leading-tight">yash raj singh</h4>
                        <p className="text-xs text-gray-700 mt-0.5 font-medium">Finance Manager at Abc</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                            Company / Business
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            • 11-50 employees Employees
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
                        <div className="text-xl font-black font-serif text-gray-900">1</div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Job Views</div>
                      </div>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <div>
                        <div className="text-xl font-black font-serif text-gray-900">6</div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Applications</div>
                      </div>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <div>
                        <div className="text-xl font-black font-serif text-gray-900">0</div>
                        <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider mt-0.5">Recruiter Actions</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gray-50 rounded-xl text-center text-xs text-gray-400 border border-dashed border-gray-200">
                  Recruiter card is currently disabled website-wide.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
