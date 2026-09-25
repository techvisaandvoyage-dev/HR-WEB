import React, { useState, useEffect } from 'react';
import {
  Link2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Sparkles,
  Lock,
  Layers,
  FileText,
  UserCheck,
  UploadCloud,
  Check,
  ShieldCheck,
  Megaphone,
  Briefcase,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_DIRECT_JOB_APPLY_CONFIG = {
  general: {
    portalBadgeText: 'Direct Application Portal',
    verifiedJobBadgeText: 'Verified Job',
    applyingForLabel: 'APPLYING FOR'
  },
  stepper: {
    step1Title: 'Account',
    step2Title: 'Questions',
    step3Title: 'Upload CV *',
    step4Title: 'Review'
  },
  step1: {
    heading: 'Candidate Login / Registration',
    subtitle: 'Please log in or create a free candidate profile to proceed with your application.',
    tabRegisterText: 'New Candidate? Register',
    tabLoginText: 'Already Registered? Login',
    googleBtnText: 'Continue with Google',
    dividerText: 'OR WITH EMAIL',
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'e.g. Rahul Sharma',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@example.com',
    mobileLabel: 'Mobile Number',
    mobilePlaceholder: 'e.g. 9876543210',
    passwordLabel: 'Create Password',
    passwordPlaceholder: 'At least 6 characters',
    registerSubmitBtnText: 'Register & Proceed to Questions →',
    loginSubmitBtnText: 'Login & Proceed →',
    loggedInWelcomeTitle: 'You are currently logged in as',
    continueAsBtnText: 'Continue as {name} →',
    switchAccountBtnText: 'Use Different Account'
  },
  step2: {
    heading: 'Employer Screening Questions',
    subtitle: "Please answer the employer's custom questions before proceeding.",
    noQuestionsHeading: 'No Screening Questions Required',
    noQuestionsSubtitle: 'The employer did not set any mandatory questions for this job. You can proceed directly to CV upload.',
    backBtnText: '← Back',
    continueBtnText: 'Continue to CV Upload →'
  },
  step3: {
    heading: 'Upload Your CV / Resume *',
    subtitle: 'Please attach your latest resume in PDF, DOC, or DOCX format (Max 300KB).',
    maxFileSizeKb: 300,
    uploadBoxTitle: 'Click or Drag to Upload Resume',
    uploadBoxSubtitle: 'Supports PDF, DOC, DOCX up to 300KB',
    attachedBadgeText: '✓ Attached & Ready',
    viewFileBtnText: 'View File',
    replaceBtnText: 'Replace',
    backBtnText: '← Back',
    continueBtnText: 'Review & Submit →'
  },
  step4: {
    heading: 'Review Your Application',
    subtitle: 'Please verify your details and screening answers before final submission.',
    candidateInfoHeading: 'Candidate Information',
    screeningReviewHeading: 'Screening Answers',
    backBtnText: '← Back',
    submitBtnText: 'Submit Application Now 🚀',
    submittingBtnText: 'Submitting Application...'
  },
  step5: {
    successHeading: 'Application Submitted!',
    alreadyAppliedHeading: 'Already Applied!',
    successSubtitle: 'Your application for {title} at {company} has been received successfully by the hiring team.',
    promoMessageTitle: '📢 Important Information:',
    promoMessageText: 'Aap sahijob.com ke candidate portal me login karke hazaron verified companies ki jobs explore aur apply kar sakte hain!',
    exploreMoreJobsBtnText: 'Explore More Jobs on SahiJob →'
  }
};

export default function DirectJobApplyEditor({ onSaveSuccess }) {
  const [activeTab, setActiveTab] = useState('step1'); // 'general', 'step1', 'step2', 'step3', 'step4', 'step5'
  const [previewStep, setPreviewStep] = useState(1);
  const [config, setConfig] = useState(DEFAULT_DIRECT_JOB_APPLY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.directJobApply) {
          const fetched = data.data.directJobApply;
          setConfig({
            general: { ...DEFAULT_DIRECT_JOB_APPLY_CONFIG.general, ...(fetched.general || {}) },
            stepper: { ...DEFAULT_DIRECT_JOB_APPLY_CONFIG.stepper, ...(fetched.stepper || {}) },
            step1: { ...DEFAULT_DIRECT_JOB_APPLY_CONFIG.step1, ...(fetched.step1 || {}) },
            step2: { ...DEFAULT_DIRECT_JOB_APPLY_CONFIG.step2, ...(fetched.step2 || {}) },
            step3: { ...DEFAULT_DIRECT_JOB_APPLY_CONFIG.step3, ...(fetched.step3 || {}) },
            step4: { ...DEFAULT_DIRECT_JOB_APPLY_CONFIG.step4, ...(fetched.step4 || {}) },
            step5: { ...DEFAULT_DIRECT_JOB_APPLY_CONFIG.step5, ...(fetched.step5 || {}) }
          });
        }
      } catch (err) {
        console.error('Error fetching directJobApply config:', err);
        setErrorMessage('Failed to load Direct Job Apply CMS configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleUpdate = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleReset = (section) => {
    if (window.confirm(`Reset ${section ? section.toUpperCase() : 'all'} settings to default?`)) {
      if (section) {
        setConfig(prev => ({
          ...prev,
          [section]: { ...DEFAULT_DIRECT_JOB_APPLY_CONFIG[section] }
        }));
        showToast(`${section.toUpperCase()} reset to default settings.`);
      } else {
        setConfig(DEFAULT_DIRECT_JOB_APPLY_CONFIG);
        showToast('All Direct Job Apply settings reset to default.');
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directJobApply: config })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Direct Job Apply CMS settings saved and live!');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setErrorMessage(data.message || 'Failed to save configuration');
      }
    } catch (err) {
      console.error('Error saving directJobApply config:', err);
      setErrorMessage('Connection error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-600">Loading Direct Job Apply CMS Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Link2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Direct Job Apply Link CMS
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Editor
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Employers direct shareable application links (<code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">/apply-job/:jobId</code>) ke sabhi steps, headings, messages, button texts aur validations ko customize karein.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            type="button"
            onClick={() => handleReset(null)}
            className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Reset all settings to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {[
          { id: 'general', label: 'Header & Stepper', icon: Layers },
          { id: 'step1', label: 'Step 1: Auth & Login', icon: UserCheck },
          { id: 'step2', label: 'Step 2: Questions', icon: HelpCircle },
          { id: 'step3', label: 'Step 3: CV Upload', icon: UploadCloud },
          { id: 'step4', label: 'Step 4: Review', icon: FileCheck },
          { id: 'step5', label: 'Step 5: Success & Promo', icon: Megaphone }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Form Editor (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: EDITABLE CONTROLS */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-xs space-y-6">
          
          {/* TAB 1: GENERAL / HEADER & STEPPER */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Header & Stepper Labels</h3>
                  <p className="text-xs text-gray-500">Top navigation badges and 4-step indicator titles</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReset('general')}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Top Portal Badge</label>
                  <input
                    type="text"
                    value={config.general?.portalBadgeText || ''}
                    onChange={(e) => handleUpdate('general', 'portalBadgeText', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    placeholder="Direct Application Portal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Verified Job Badge</label>
                  <input
                    type="text"
                    value={config.general?.verifiedJobBadgeText || ''}
                    onChange={(e) => handleUpdate('general', 'verifiedJobBadgeText', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                    placeholder="Verified Job"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Job Card Tagline ("APPLYING FOR")</label>
                <input
                  type="text"
                  value={config.general?.applyingForLabel || ''}
                  onChange={(e) => handleUpdate('general', 'applyingForLabel', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  placeholder="APPLYING FOR"
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-3">
                  Stepper Navigation Step Names
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Step 1</label>
                    <input
                      type="text"
                      value={config.stepper?.step1Title || ''}
                      onChange={(e) => handleUpdate('stepper', 'step1Title', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Step 2</label>
                    <input
                      type="text"
                      value={config.stepper?.step2Title || ''}
                      onChange={(e) => handleUpdate('stepper', 'step2Title', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Step 3</label>
                    <input
                      type="text"
                      value={config.stepper?.step3Title || ''}
                      onChange={(e) => handleUpdate('stepper', 'step3Title', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Step 4</label>
                    <input
                      type="text"
                      value={config.stepper?.step4Title || ''}
                      onChange={(e) => handleUpdate('stepper', 'step4Title', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP 1 (AUTH & LOGIN) */}
          {activeTab === 'step1' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Step 1: Account / Candidate Auth</h3>
                  <p className="text-xs text-gray-500">Google login, register, login form titles and field labels</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReset('step1')}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Step 1 Main Heading</label>
                  <input
                    type="text"
                    value={config.step1?.heading || ''}
                    onChange={(e) => handleUpdate('step1', 'heading', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Step 1 Subtitle</label>
                  <input
                    type="text"
                    value={config.step1?.subtitle || ''}
                    onChange={(e) => handleUpdate('step1', 'subtitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Register Tab Text</label>
                    <input
                      type="text"
                      value={config.step1?.tabRegisterText || ''}
                      onChange={(e) => handleUpdate('step1', 'tabRegisterText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Login Tab Text</label>
                    <input
                      type="text"
                      value={config.step1?.tabLoginText || ''}
                      onChange={(e) => handleUpdate('step1', 'tabLoginText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Google Button Text</label>
                    <input
                      type="text"
                      value={config.step1?.googleBtnText || ''}
                      onChange={(e) => handleUpdate('step1', 'googleBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Divider Text</label>
                    <input
                      type="text"
                      value={config.step1?.dividerText || ''}
                      onChange={(e) => handleUpdate('step1', 'dividerText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Register Submit Button</label>
                    <input
                      type="text"
                      value={config.step1?.registerSubmitBtnText || ''}
                      onChange={(e) => handleUpdate('step1', 'registerSubmitBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Login Submit Button</label>
                    <input
                      type="text"
                      value={config.step1?.loginSubmitBtnText || ''}
                      onChange={(e) => handleUpdate('step1', 'loginSubmitBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-3">
                    Already Logged In Account Box
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Continue As Button (use {"{name}"})</label>
                      <input
                        type="text"
                        value={config.step1?.continueAsBtnText || ''}
                        onChange={(e) => handleUpdate('step1', 'continueAsBtnText', e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Switch Account Button</label>
                      <input
                        type="text"
                        value={config.step1?.switchAccountBtnText || ''}
                        onChange={(e) => handleUpdate('step1', 'switchAccountBtnText', e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: STEP 2 (QUESTIONS) */}
          {activeTab === 'step2' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Step 2: Screening Questions</h3>
                  <p className="text-xs text-gray-500">Headings, empty state, and action buttons</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReset('step2')}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Step 2 Main Heading</label>
                  <input
                    type="text"
                    value={config.step2?.heading || ''}
                    onChange={(e) => handleUpdate('step2', 'heading', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Step 2 Subtitle</label>
                  <input
                    type="text"
                    value={config.step2?.subtitle || ''}
                    onChange={(e) => handleUpdate('step2', 'subtitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                    Empty State (When job has 0 questions)
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">No Questions Title</label>
                    <input
                      type="text"
                      value={config.step2?.noQuestionsHeading || ''}
                      onChange={(e) => handleUpdate('step2', 'noQuestionsHeading', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">No Questions Subtitle</label>
                    <input
                      type="text"
                      value={config.step2?.noQuestionsSubtitle || ''}
                      onChange={(e) => handleUpdate('step2', 'noQuestionsSubtitle', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Back Button</label>
                    <input
                      type="text"
                      value={config.step2?.backBtnText || ''}
                      onChange={(e) => handleUpdate('step2', 'backBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Continue to CV Button</label>
                    <input
                      type="text"
                      value={config.step2?.continueBtnText || ''}
                      onChange={(e) => handleUpdate('step2', 'continueBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STEP 3 (CV UPLOAD) */}
          {activeTab === 'step3' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Step 3: CV / Resume Upload</h3>
                  <p className="text-xs text-gray-500">File size limits, drag & drop box texts, button labels</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReset('step3')}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Step 3 Main Heading</label>
                  <input
                    type="text"
                    value={config.step3?.heading || ''}
                    onChange={(e) => handleUpdate('step3', 'heading', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Step 3 Subtitle</label>
                  <input
                    type="text"
                    value={config.step3?.subtitle || ''}
                    onChange={(e) => handleUpdate('step3', 'subtitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                  <label className="block text-xs font-extrabold text-emerald-900 mb-1">
                    Maximum CV File Size Limit (in KB)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="50"
                      max="10240"
                      value={config.step3?.maxFileSizeKb || 300}
                      onChange={(e) => handleUpdate('step3', 'maxFileSizeKb', Number(e.target.value))}
                      className="w-36 px-3.5 py-2 text-xs font-bold bg-white border border-emerald-300 rounded-xl focus:border-emerald-600 outline-none"
                    />
                    <span className="text-xs text-emerald-800 font-semibold">
                      KB ({((config.step3?.maxFileSizeKb || 300) / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload Box Title</label>
                    <input
                      type="text"
                      value={config.step3?.uploadBoxTitle || ''}
                      onChange={(e) => handleUpdate('step3', 'uploadBoxTitle', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload Box Subtitle</label>
                    <input
                      type="text"
                      value={config.step3?.uploadBoxSubtitle || ''}
                      onChange={(e) => handleUpdate('step3', 'uploadBoxSubtitle', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Attached Badge</label>
                    <input
                      type="text"
                      value={config.step3?.attachedBadgeText || ''}
                      onChange={(e) => handleUpdate('step3', 'attachedBadgeText', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">View File Button</label>
                    <input
                      type="text"
                      value={config.step3?.viewFileBtnText || ''}
                      onChange={(e) => handleUpdate('step3', 'viewFileBtnText', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Replace Button</label>
                    <input
                      type="text"
                      value={config.step3?.replaceBtnText || ''}
                      onChange={(e) => handleUpdate('step3', 'replaceBtnText', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Back Button</label>
                    <input
                      type="text"
                      value={config.step3?.backBtnText || ''}
                      onChange={(e) => handleUpdate('step3', 'backBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Review & Submit Button</label>
                    <input
                      type="text"
                      value={config.step3?.continueBtnText || ''}
                      onChange={(e) => handleUpdate('step3', 'continueBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STEP 4 (REVIEW) */}
          {activeTab === 'step4' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Step 4: Review & Submit</h3>
                  <p className="text-xs text-gray-500">Summary card titles and final submit buttons</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReset('step4')}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Step 4 Main Heading</label>
                  <input
                    type="text"
                    value={config.step4?.heading || ''}
                    onChange={(e) => handleUpdate('step4', 'heading', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Step 4 Subtitle</label>
                  <input
                    type="text"
                    value={config.step4?.subtitle || ''}
                    onChange={(e) => handleUpdate('step4', 'subtitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Candidate Info Section Title</label>
                    <input
                      type="text"
                      value={config.step4?.candidateInfoHeading || ''}
                      onChange={(e) => handleUpdate('step4', 'candidateInfoHeading', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Screening Review Section Title</label>
                    <input
                      type="text"
                      value={config.step4?.screeningReviewHeading || ''}
                      onChange={(e) => handleUpdate('step4', 'screeningReviewHeading', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Final Submit Button</label>
                    <input
                      type="text"
                      value={config.step4?.submitBtnText || ''}
                      onChange={(e) => handleUpdate('step4', 'submitBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Submitting Spinner Text</label>
                    <input
                      type="text"
                      value={config.step4?.submittingBtnText || ''}
                      onChange={(e) => handleUpdate('step4', 'submittingBtnText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: STEP 5 (SUCCESS & PROMO MESSAGE) */}
          {activeTab === 'step5' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Step 5: Success & Portal Invitation</h3>
                  <p className="text-xs text-gray-500">Confirmation messages, promo text, and CTA redirect button</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleReset('step5')}
                  className="text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Success Title</label>
                    <input
                      type="text"
                      value={config.step5?.successHeading || ''}
                      onChange={(e) => handleUpdate('step5', 'successHeading', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Already Applied Title</label>
                    <input
                      type="text"
                      value={config.step5?.alreadyAppliedHeading || ''}
                      onChange={(e) => handleUpdate('step5', 'alreadyAppliedHeading', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Success Subtitle (use {"{title}"} and {"{company}"})</label>
                  <textarea
                    rows={2}
                    value={config.step5?.successSubtitle || ''}
                    onChange={(e) => handleUpdate('step5', 'successSubtitle', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 space-y-3">
                  <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-emerald-700" />
                    Special Highlighted Portal Invitation Message
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">Message Banner Header</label>
                    <input
                      type="text"
                      value={config.step5?.promoMessageTitle || ''}
                      onChange={(e) => handleUpdate('step5', 'promoMessageTitle', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:border-emerald-600 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">Message Description Text</label>
                    <textarea
                      rows={2}
                      value={config.step5?.promoMessageText || ''}
                      onChange={(e) => handleUpdate('step5', 'promoMessageText', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Explore More Jobs CTA Button</label>
                  <input
                    type="text"
                    value={config.step5?.exploreMoreJobsBtnText || ''}
                    onChange={(e) => handleUpdate('step5', 'exploreMoreJobsBtnText', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: INTERACTIVE REAL-TIME LIVE PREVIEW */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">Live Preview</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                {[1, 2, 3, 4, 5].map(st => (
                  <button
                    key={st}
                    onClick={() => setPreviewStep(st)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      previewStep === st ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Viewport Container */}
            <div className="bg-white text-gray-900 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-inner space-y-4 text-left min-h-[380px]">
              
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="font-extrabold text-sm text-emerald-700">
                  sahijob<span className="text-slate-900">.com</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-gray-500">{config.general?.portalBadgeText}</span>
                  <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    {config.general?.verifiedJobBadgeText}
                  </span>
                </div>
              </div>

              {/* Preview Stepper */}
              <div className="grid grid-cols-4 gap-1 text-center border-b border-gray-100 pb-2">
                {[
                  { n: 1, title: config.stepper?.step1Title },
                  { n: 2, title: config.stepper?.step2Title },
                  { n: 3, title: config.stepper?.step3Title },
                  { n: 4, title: config.stepper?.step4Title }
                ].map(s => (
                  <div key={s.n} className="flex flex-col items-center">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      previewStep >= s.n ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {s.n}
                    </span>
                    <span className={`text-[8px] font-bold mt-0.5 truncate max-w-[60px] ${
                      previewStep === s.n ? 'text-emerald-700' : 'text-gray-400'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* STEP 1 PREVIEW */}
              {previewStep === 1 && (
                <div className="space-y-3">
                  <div className="text-center">
                    <h5 className="text-xs font-bold text-gray-900">{config.step1?.heading}</h5>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{config.step1?.subtitle}</p>
                  </div>
                  <div className="flex rounded-xl bg-gray-100 p-1 text-[10px] font-bold">
                    <span className="flex-1 py-1 text-center bg-white rounded-lg shadow-xs">{config.step1?.tabRegisterText}</span>
                    <span className="flex-1 py-1 text-center text-gray-500">{config.step1?.tabLoginText}</span>
                  </div>
                  <div className="w-full py-1.5 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 text-center flex items-center justify-center gap-1.5 shadow-xs">
                    <span>G</span> {config.step1?.googleBtnText}
                  </div>
                  <div className="text-[9px] font-bold text-gray-400 text-center">{config.step1?.dividerText}</div>
                  <div className="w-full py-2 bg-emerald-600 text-white font-bold text-[11px] rounded-xl text-center shadow-xs">
                    {config.step1?.registerSubmitBtnText}
                  </div>
                </div>
              )}

              {/* STEP 2 PREVIEW */}
              {previewStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{config.step2?.heading}</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">{config.step2?.subtitle}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-gray-200 bg-slate-50 space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-700">1. Years of experience? *</span>
                    <div className="w-full h-6 bg-white border border-gray-200 rounded-lg text-[10px] px-2 flex items-center text-gray-400">Answer...</div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-gray-500 font-bold">{config.step2?.backBtnText}</span>
                    <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">{config.step2?.continueBtnText}</span>
                  </div>
                </div>
              )}

              {/* STEP 3 PREVIEW */}
              {previewStep === 3 && (
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{config.step3?.heading}</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">{config.step3?.subtitle}</p>
                  </div>
                  <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center bg-slate-50 space-y-1">
                    <UploadCloud className="w-5 h-5 text-emerald-600 mx-auto" />
                    <div className="text-[11px] font-bold text-gray-800">{config.step3?.uploadBoxTitle}</div>
                    <div className="text-[9px] text-gray-400">{config.step3?.uploadBoxSubtitle}</div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-gray-500 font-bold">{config.step3?.backBtnText}</span>
                    <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">{config.step3?.continueBtnText}</span>
                  </div>
                </div>
              )}

              {/* STEP 4 PREVIEW */}
              {previewStep === 4 && (
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{config.step4?.heading}</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">{config.step4?.subtitle}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-gray-100 bg-slate-50 text-[10px]">
                    <span className="font-bold text-gray-500 uppercase text-[9px]">{config.step4?.candidateInfoHeading}</span>
                    <p className="font-bold text-gray-800 mt-1">Rahul Sharma • rahul@example.com</p>
                  </div>
                  <div className="w-full py-2 bg-emerald-600 text-white font-bold text-[11px] rounded-xl text-center shadow-xs">
                    {config.step4?.submitBtnText}
                  </div>
                </div>
              )}

              {/* STEP 5 PREVIEW */}
              {previewStep === 5 && (
                <div className="text-center space-y-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mx-auto">✓</div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{config.step5?.successHeading}</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">Application submitted successfully.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-1">
                    <div className="text-[10px] font-bold text-emerald-950">{config.step5?.promoMessageTitle}</div>
                    <p className="text-[9px] text-emerald-800 font-medium leading-relaxed">{config.step5?.promoMessageText}</p>
                  </div>
                  <div className="w-full py-2 bg-emerald-600 text-white font-bold text-[10px] rounded-xl text-center shadow-xs">
                    {config.step5?.exploreMoreJobsBtnText}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
