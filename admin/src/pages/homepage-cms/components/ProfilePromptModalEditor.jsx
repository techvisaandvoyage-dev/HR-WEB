import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  RefreshCw, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  FileText, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  HelpCircle,
  Pencil
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_PROFILE_MODAL_CONFIG = {
  isEnabled: true,
  modalIcon: '📝',
  title: 'Complete Your Profile Details',
  subtitle: 'Apni education, experience aur personal details fill karein taaki recruiters aapko top matching jobs ke liye direct shortlist kar sakein!',
  showBenefitBanner: true,
  benefitIcon: '⚡',
  benefitText: 'Complete profile hone se candidates ko 5x jyada interview calls aur direct employer messages milte hain.',
  benefitHighlightText: '5x jyada interview calls',
  primaryButtonText: 'Fill Details Now →',
  primaryButtonLink: '/employee/onboarding',
  secondaryButtonText: 'Explore Jobs First',
  showCloseButton: true,
  cooldownDays: 3
};

export default function ProfilePromptModalEditor({ onSaveSuccess }) {
  const [config, setConfig] = useState(DEFAULT_PROFILE_MODAL_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'appearance' | 'behavior'

  // Fetch Homepage Config from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/homepage`);
        const json = await res.json();
        if (json.success && json.data && json.data.profilePromptModal) {
          setConfig({
            ...DEFAULT_PROFILE_MODAL_CONFIG,
            ...json.data.profilePromptModal
          });
        }
      } catch (err) {
        console.error('Error fetching profile prompt modal config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all Profile Completion Modal settings back to original defaults?')) {
      setConfig(DEFAULT_PROFILE_MODAL_CONFIG);
      showToast('Reset to default settings (Click Save to publish)');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profilePromptModal: config
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Profile Prompt Modal settings saved & published successfully!');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setErrorMessage(data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving profile modal config:', err);
      setErrorMessage('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      
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

      {/* Header card with Save button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-base border border-emerald-100">
              📝
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                Candidate Profile Completion Modal CMS
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize the modal popup shown to candidates on login / registration prompting them to complete profile details & education.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            title="Reset to default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save & Publish</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm flex items-center justify-center gap-2 bg-white rounded-2xl border border-gray-100">
          <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
          <span>Loading Modal CMS Configuration...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Master Toggle Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                  config.isEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  ✨
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Enable Profile Completion Popup</h3>
                  <p className="text-xs text-gray-500">
                    When enabled, uncompleted candidate accounts will see this modal prompt upon visiting the portal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleChange('isEnabled', !config.isEnabled)}
                className="cursor-pointer transition-transform active:scale-95 text-emerald-600"
              >
                {config.isEnabled ? (
                  <ToggleRight className="w-9 h-9 fill-emerald-600 text-white" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-300" />
                )}
              </button>
            </div>

            {/* Modal Content Controls Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="w-4 h-4 text-emerald-600" />
                Modal Headers & Messaging
              </h3>

              {/* Modal Icon / Emoji */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Modal Center Emoji / Icon
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={config.modalIcon}
                    onChange={(e) => handleChange('modalIcon', e.target.value)}
                    placeholder="e.g. 📝"
                    className="w-20 px-4 py-2.5 text-center text-xl bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600 font-bold"
                  />
                  <div className="flex items-center gap-1.5">
                    {['📝', '💼', '🚀', '🎯', '✨', '🎓'].map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => handleChange('modalIcon', emo)}
                        className={`w-9 h-9 rounded-xl text-sm border flex items-center justify-center cursor-pointer transition-all ${
                          config.modalIcon === emo ? 'border-emerald-600 bg-emerald-50 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Modal Heading Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g. Complete Your Profile Details"
                  className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600 text-gray-900 font-semibold"
                />
              </div>

              {/* Modal Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Modal Subtitle / Body Description
                </label>
                <textarea
                  rows={3}
                  value={config.subtitle}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  placeholder="e.g. Apni education, experience aur personal details fill karein..."
                  className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600 text-gray-900 leading-relaxed"
                />
              </div>

              {/* Close Button Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div>
                  <span className="text-xs font-bold text-gray-800">Show Top-Right Close Button (✕)</span>
                  <p className="text-[11px] text-gray-500">Allow candidate to dismiss modal popup via the close icon</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('showCloseButton', !config.showCloseButton)}
                  className="cursor-pointer text-emerald-600"
                >
                  {config.showCloseButton ? (
                    <ToggleRight className="w-8 h-8 fill-emerald-600 text-white" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Benefit / Highlight Banner Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Benefit & Incentive Highlight Box
                </h3>
                <button
                  type="button"
                  onClick={() => handleChange('showBenefitBanner', !config.showBenefitBanner)}
                  className="cursor-pointer text-emerald-600"
                >
                  {config.showBenefitBanner ? (
                    <ToggleRight className="w-8 h-8 fill-emerald-600 text-white" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-300" />
                  )}
                </button>
              </div>

              {config.showBenefitBanner && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="block text-xs font-bold text-gray-700">Banner Icon</label>
                      <input
                        type="text"
                        value={config.benefitIcon}
                        onChange={(e) => handleChange('benefitIcon', e.target.value)}
                        placeholder="⚡"
                        className="w-full px-3 py-2 text-center text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-700">Highlight Text (Bold Word)</label>
                      <input
                        type="text"
                        value={config.benefitHighlightText}
                        onChange={(e) => handleChange('benefitHighlightText', e.target.value)}
                        placeholder="5x jyada interview calls"
                        className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600 font-bold text-emerald-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Full Incentive / Tip Message
                    </label>
                    <textarea
                      rows={2}
                      value={config.benefitText}
                      onChange={(e) => handleChange('benefitText', e.target.value)}
                      placeholder="e.g. Complete profile hone se candidates ko 5x jyada interview calls aur direct employer messages milte hain."
                      className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600 text-gray-900 leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                <Award className="w-4 h-4 text-emerald-600" />
                Action Buttons & Target Links
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Primary Button Label (Green)
                  </label>
                  <input
                    type="text"
                    value={config.primaryButtonText}
                    onChange={(e) => handleChange('primaryButtonText', e.target.value)}
                    placeholder="Fill Details Now →"
                    className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600 font-bold text-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Primary Button Route / Action
                  </label>
                  <input
                    type="text"
                    value={config.primaryButtonLink}
                    onChange={(e) => handleChange('primaryButtonLink', e.target.value)}
                    placeholder="/employee/onboarding"
                    className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600 text-gray-600 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Secondary Button Label (Gray / Dismiss)
                </label>
                <input
                  type="text"
                  value={config.secondaryButtonText}
                  onChange={(e) => handleChange('secondaryButtonText', e.target.value)}
                  placeholder="Explore Jobs First"
                  className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-600 text-gray-800 font-medium"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Live Interactive Visual Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-6">
              <div className="bg-slate-900 text-white px-5 py-3 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">Live Modal Preview</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                  config.isEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {config.isEnabled ? 'Modal Active' : 'Modal Disabled'}
                </span>
              </div>

              <div className="bg-slate-100 p-6 rounded-b-2xl border-x border-b border-gray-200 shadow-inner min-h-[480px] flex items-center justify-center relative overflow-hidden">
                
                {/* Background Dim Backdrop Mock */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                {/* The Live Modal Card */}
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 text-center relative z-10 animate-in zoom-in-95 duration-200">
                  
                  {/* Close button preview */}
                  {config.showCloseButton && (
                    <button
                      type="button"
                      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      ✕
                    </button>
                  )}
                  
                  {/* Top Emoji Badge */}
                  <div className="w-13 h-13 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-xs">
                    {config.modalIcon || '📝'}
                  </div>

                  {/* Title and Subtitle */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {config.title || 'Complete Your Profile Details'}
                    </h3>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      {config.subtitle || 'Apni education, experience aur personal details fill karein taaki recruiters aapko top matching jobs ke liye direct shortlist kar sakein!'}
                    </p>
                  </div>

                  {/* Incentive Banner */}
                  {config.showBenefitBanner && (
                    <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-left flex items-start gap-2">
                      <span className="text-sm shrink-0">{config.benefitIcon || '⚡'}</span>
                      <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                        {config.benefitText}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      className="w-full py-2.5 bg-[#29953f] hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>{config.primaryButtonText || 'Fill Details Now →'}</span>
                    </button>
                    <button
                      type="button"
                      className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] rounded-xl transition-colors cursor-pointer"
                    >
                      {config.secondaryButtonText || 'Explore Jobs First'}
                    </button>
                  </div>

                </div>

              </div>

              <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200/80 text-xs text-gray-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All edits in the form immediately update the live preview above. Click <strong>Save & Publish</strong> to update on the live website.</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
