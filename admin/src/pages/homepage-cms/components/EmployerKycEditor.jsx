import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  FileText, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Check,
  Sparkles,
  Layers,
  HelpCircle,
  FileCheck,
  Building,
  UploadCloud,
  X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_EMPLOYER_KYC_CONFIG = {
  // Page Header & Meta
  pageTitle: 'Get your company verified',
  pageSubtitle: 'Upload 2 documents. Our team reviews them and your jobs go live for candidates.',
  breadcrumbLabel: '/ Employer Verification',

  // Stepper Labels
  step1Label: 'Tax document',
  step2Label: 'Incorporation document',
  step3Label: 'Submit for review',
  step3ResubmitLabel: 'Re-submit for review',

  // Alert Banners Texts
  verifiedBanner: {
    title: 'Account Verified Successfully!',
    description: 'Your business is verified. All your active jobs are now live and visible to candidates with the green Verified Employer badge.',
    badgeText: 'Verified'
  },
  pendingBanner: {
    title: 'Verification Under Review',
    description: 'Your documents were submitted recently. Document uploads are locked while our compliance team reviews your business registration.',
    badgeText: 'Under Review'
  },
  rejectedBanner: {
    title: 'Verification Submission Rejected',
    descriptionPrefix: 'Reason from Admin:',
    defaultReason: 'Documents did not meet criteria. Please re-upload clearer documents.',
    helperText: 'Remove the rejected documents below, upload updated documents under 300 KB, and re-submit for review.',
    badgeText: 'Verification Rejected'
  },
  unverifiedBadgeText: 'Unverified',

  // STEP 1: TAX DOCUMENT SETTINGS
  taxDoc: {
    title: 'Tax document',
    helpText: 'Any one is enough. Document must be in your company name.',
    isMandatory: true, // Required vs Optional
    requiredBadgeText: 'Required',
    optionalBadgeText: 'Optional',
    doneBadgeText: 'Done',
    options: [
      { id: 'gst_certificate', label: 'GST Certificate', fullLabel: 'GST Registration Certificate (Form GST REG-06)', enabled: true },
      { id: 'pan_card_company', label: 'Company PAN', fullLabel: 'Company PAN Card', enabled: true },
      { id: 'tan_certificate', label: 'TAN', fullLabel: 'TAN Allotment Certificate', enabled: true },
      { id: 'itr_acknowledgement', label: 'ITR-V', fullLabel: 'Latest ITR-V / Acknowledgement', enabled: true },
      { id: 'professional_tax_certificate', label: 'Professional Tax', fullLabel: 'Professional Tax Certificate', enabled: true }
    ]
  },

  // STEP 2: INCORPORATION DOCUMENT SETTINGS
  incorpDoc: {
    title: 'Incorporation document',
    helpText: 'Proof that your business is legally registered. Pick one and upload it.',
    isMandatory: true, // Required vs Optional
    requiredBadgeText: 'Required',
    optionalBadgeText: 'Optional',
    doneBadgeText: 'Done',
    options: [
      { id: 'certificate_of_incorporation', label: 'Certificate of Incorporation', fullLabel: 'Certificate of Incorporation (COI)', enabled: true },
      { id: 'cin_document', label: 'CIN / MCA Master Data', fullLabel: 'CIN / MCA Company Master Data', enabled: true },
      { id: 'moa_aoa', label: 'MOA / AOA', fullLabel: 'Memorandum & Articles of Association (MOA/AOA)', enabled: true },
      { id: 'partnership_deed', label: 'Partnership Deed', fullLabel: 'Registered Partnership Deed', enabled: true },
      { id: 'llp_agreement', label: 'LLP Agreement', fullLabel: 'LLP Agreement', enabled: true },
      { id: 'msme_udyam_certificate', label: 'Udyam / MSME', fullLabel: 'Udyam / MSME Registration Certificate', enabled: true },
      { id: 'shop_establishment_license', label: 'Shop & Establishment', fullLabel: 'Shop & Establishment License', enabled: true },
      { id: 'gumasta_trade_license', label: 'Trade License', fullLabel: 'Gumasta / Trade License', enabled: true }
    ]
  },

  // STEP 3: EXTRA / SUPPORTING DOCUMENTS SETTINGS
  extraDoc: {
    title: 'Extra documents',
    helpText: 'Address proof, authorization letter, signatory ID, staffing license. Speeds up approval.',
    isMandatory: false, // Required vs Optional
    requiredBadgeText: 'Required',
    optionalBadgeText: 'Optional',
    options: [
      { id: 'address_proof', label: 'Address Proof', category: 'address', fullLabel: 'Company Address Proof (Utility Bill / Lease)', enabled: true },
      { id: 'authorization_letter', label: 'Authorization Letter', category: 'authorized_signatory', fullLabel: 'Board / Owner Authorization Letter', enabled: true },
      { id: 'authorized_person_id', label: 'Signatory ID', category: 'authorized_signatory', fullLabel: 'Authorized Signatory Govt ID', enabled: true },
      { id: 'staffing_license', label: 'Staffing License', category: 'license', consultantOnly: true, fullLabel: 'Staffing / Recruitment Agency License', enabled: true },
      { id: 'other', label: 'Other Document', category: 'other', fullLabel: 'Other Supporting Business Proof', enabled: true }
    ]
  },

  // Progress & Submission Card Texts
  progressCard: {
    title: 'Your progress',
    submitButtonText: 'Submit for verification',
    resubmitButtonText: 'Re-submit for verification',
    submittingText: 'Submitting...',
    resubmittingText: 'Re-submitting...',
    requirementsMetText: 'All requirements met! Ready to submit.',
    resubmitReadyText: 'Updated documents ready! Click to re-submit for review.',
    lockedPendingTitle: 'Verification In Review',
    lockedPendingDesc: 'Our team is reviewing your documents.',
    lockedVerifiedTitle: 'Account Verified',
    lockedVerifiedDesc: 'All candidate visibility privileges are active.'
  },

  // Benefits Card Texts
  benefitsCard: {
    title: 'After approval you get',
    benefits: [
      'Green Verified Employer badge',
      'Your jobs visible to all candidates',
      'Tracked application links enabled'
    ]
  }
};

export default function EmployerKycEditor({ onSaveSuccess }) {
  const [config, setConfig] = useState(DEFAULT_EMPLOYER_KYC_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements' | 'texts' | 'banners' | 'preview'

  // New doc item inputs
  const [newDocSection, setNewDocSection] = useState(null); // 'taxDoc' | 'incorpDoc' | 'extraDoc' | null
  const [newDocLabel, setNewDocLabel] = useState('');
  const [newDocFullLabel, setNewDocFullLabel] = useState('');

  // Fetch Homepage Config from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/homepage`);
        const json = await res.json();
        if (json.success && json.data && json.data.employerKyc) {
          const fetched = json.data.employerKyc;
          setConfig({
            ...DEFAULT_EMPLOYER_KYC_CONFIG,
            ...fetched,
            verifiedBanner: { ...DEFAULT_EMPLOYER_KYC_CONFIG.verifiedBanner, ...(fetched.verifiedBanner || {}) },
            pendingBanner: { ...DEFAULT_EMPLOYER_KYC_CONFIG.pendingBanner, ...(fetched.pendingBanner || {}) },
            rejectedBanner: { ...DEFAULT_EMPLOYER_KYC_CONFIG.rejectedBanner, ...(fetched.rejectedBanner || {}) },
            taxDoc: {
              ...DEFAULT_EMPLOYER_KYC_CONFIG.taxDoc,
              ...(fetched.taxDoc || {}),
              options: Array.isArray(fetched.taxDoc?.options) && fetched.taxDoc.options.length > 0 
                ? fetched.taxDoc.options 
                : DEFAULT_EMPLOYER_KYC_CONFIG.taxDoc.options
            },
            incorpDoc: {
              ...DEFAULT_EMPLOYER_KYC_CONFIG.incorpDoc,
              ...(fetched.incorpDoc || {}),
              options: Array.isArray(fetched.incorpDoc?.options) && fetched.incorpDoc.options.length > 0 
                ? fetched.incorpDoc.options 
                : DEFAULT_EMPLOYER_KYC_CONFIG.incorpDoc.options
            },
            extraDoc: {
              ...DEFAULT_EMPLOYER_KYC_CONFIG.extraDoc,
              ...(fetched.extraDoc || {}),
              options: Array.isArray(fetched.extraDoc?.options) && fetched.extraDoc.options.length > 0 
                ? fetched.extraDoc.options 
                : DEFAULT_EMPLOYER_KYC_CONFIG.extraDoc.options
            },
            progressCard: { ...DEFAULT_EMPLOYER_KYC_CONFIG.progressCard, ...(fetched.progressCard || {}) },
            benefitsCard: {
              ...DEFAULT_EMPLOYER_KYC_CONFIG.benefitsCard,
              ...(fetched.benefitsCard || {}),
              benefits: Array.isArray(fetched.benefitsCard?.benefits) ? fetched.benefitsCard.benefits : DEFAULT_EMPLOYER_KYC_CONFIG.benefitsCard.benefits
            }
          });
        }
      } catch (err) {
        console.error('Error fetching KYC CMS config:', err);
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

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all KYC & Verification Page settings back to original defaults?')) {
      setConfig(DEFAULT_EMPLOYER_KYC_CONFIG);
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
          employerKyc: config
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('KYC & Verification Page settings saved & published successfully!');
        if (onSaveSuccess) onSaveSuccess();
      } else {
        setErrorMessage(data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving KYC config:', err);
      setErrorMessage('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  // Generic update helper
  const updateNested = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // Toggle mandatory flag for a step
  const toggleMandatory = (section) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        isMandatory: !prev[section].isMandatory
      }
    }));
  };

  // Toggle option enabled status
  const toggleOptionEnabled = (section, optionId) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        options: prev[section].options.map(opt => 
          (opt.id === optionId || opt.type === optionId)
            ? { ...opt, enabled: opt.enabled === false ? true : false }
            : opt
        )
      }
    }));
  };

  // Update option label
  const updateOption = (section, optionId, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        options: prev[section].options.map(opt => 
          (opt.id === optionId || opt.type === optionId)
            ? { ...opt, [field]: value }
            : opt
        )
      }
    }));
  };

  // Delete custom document option
  const deleteOption = (section, optionId) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        options: prev[section].options.filter(opt => (opt.id !== optionId && opt.type !== optionId))
      }
    }));
  };

  // Add new document option
  const handleAddOption = (section) => {
    if (!newDocLabel.trim()) return;
    const generatedId = newDocLabel.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const newOpt = {
      id: generatedId,
      type: generatedId,
      label: newDocLabel.trim(),
      fullLabel: newDocFullLabel.trim() || newDocLabel.trim(),
      enabled: true,
      category: section === 'taxDoc' ? 'tax' : (section === 'incorpDoc' ? 'incorporation' : 'other'),
      isCustom: true
    };

    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        options: [...prev[section].options, newOpt]
      }
    }));

    setNewDocLabel('');
    setNewDocFullLabel('');
    setNewDocSection(null);
    showToast(`Added "${newOpt.label}" to ${section === 'taxDoc' ? 'Tax' : section === 'incorpDoc' ? 'Incorporation' : 'Extra'} documents!`);
  };

  // Benefits list handlers
  const handleUpdateBenefit = (index, value) => {
    setConfig(prev => {
      const next = [...prev.benefitsCard.benefits];
      next[index] = value;
      return {
        ...prev,
        benefitsCard: { ...prev.benefitsCard, benefits: next }
      };
    });
  };

  const handleAddBenefit = () => {
    setConfig(prev => ({
      ...prev,
      benefitsCard: {
        ...prev.benefitsCard,
        benefits: [...prev.benefitsCard.benefits, 'New verified benefit item']
      }
    }));
  };

  const handleDeleteBenefit = (index) => {
    setConfig(prev => ({
      ...prev,
      benefitsCard: {
        ...prev.benefitsCard,
        benefits: prev.benefitsCard.benefits.filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm">Loading KYC CMS controls...</p>
      </div>
    );
  }

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

      {/* Header Card with Save & Reset Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-base border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Employer KYC & Verification Page Controls
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Configure all texts, mandatory vs optional requirements, and manage accepted document types.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-4 py-2 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save KYC Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'requirements'
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Documents & Mandatory Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('texts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'texts'
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Page Headings & Stepper Texts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'banners'
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Status Banners & Benefits</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Live Interactive Preview</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DOCUMENTS & MANDATORY SETTINGS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">

          {/* STEP 1: TAX DOCUMENT */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center">
                  1
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Step 1: Tax Document Controls</h3>
                  <p className="text-xs text-gray-500 font-medium">Control title, instructions, mandatory flag, and accepted document types.</p>
                </div>
              </div>

              {/* Mandatory Toggle Button */}
              <div className="flex items-center gap-2.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 pl-2">Requirement:</span>
                <button
                  type="button"
                  onClick={() => toggleMandatory('taxDoc')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    config.taxDoc.isMandatory
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {config.taxDoc.isMandatory ? '✓ Mandatory (Required)' : '○ Optional (Non-Mandatory)'}
                </button>
              </div>
            </div>

            {/* Inputs: Title, Help Text & Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Step Card Title</label>
                <input
                  type="text"
                  value={config.taxDoc.title || ''}
                  onChange={(e) => updateNested('taxDoc', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Tax document"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Instruction / Help Text</label>
                <input
                  type="text"
                  value={config.taxDoc.helpText || ''}
                  onChange={(e) => updateNested('taxDoc', 'helpText', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Any one is enough. Document must be in your company name."
                />
              </div>
            </div>

            {/* Document Types Management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Accepted Tax Document Types ({config.taxDoc.options.filter(o => o.enabled !== false).length} Active)
                </label>
                <button
                  type="button"
                  onClick={() => setNewDocSection(newDocSection === 'taxDoc' ? null : 'taxDoc')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document Type</span>
                </button>
              </div>

              {/* Add New Doc Box */}
              {newDocSection === 'taxDoc' && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl mb-3 space-y-2 animate-in fade-in">
                  <div className="text-xs font-bold text-emerald-900">Add New Tax Document Type:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Short Pill Label (e.g. Sales Tax)"
                      value={newDocLabel}
                      onChange={(e) => setNewDocLabel(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Full Name (e.g. State Sales Tax Registration)"
                      value={newDocFullLabel}
                      onChange={(e) => setNewDocFullLabel(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setNewDocSection(null); setNewDocLabel(''); setNewDocFullLabel(''); }}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddOption('taxDoc')}
                      className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Save Document
                    </button>
                  </div>
                </div>
              )}

              {/* List of Tax Document Options */}
              <div className="space-y-2">
                {config.taxDoc.options.map((opt) => {
                  const optId = opt.id || opt.type;
                  const isEnabled = opt.enabled !== false;
                  return (
                    <div
                      key={optId}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        isEnabled ? 'bg-white border-gray-200 shadow-2xs' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleOptionEnabled('taxDoc', optId)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center border cursor-pointer transition-colors ${
                            isEnabled ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-transparent'
                          }`}
                          title={isEnabled ? 'Enabled in dropdown' : 'Disabled'}
                        >
                          <Check className="w-4 h-4 stroke-3" />
                        </button>

                        <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={opt.label || ''}
                            onChange={(e) => updateOption('taxDoc', optId, 'label', e.target.value)}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 outline-none focus:border-emerald-500"
                            placeholder="Short Label"
                          />
                          <input
                            type="text"
                            value={opt.fullLabel || ''}
                            onChange={(e) => updateOption('taxDoc', optId, 'fullLabel', e.target.value)}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 outline-none focus:border-emerald-500"
                            placeholder="Full Document Name"
                          />
                        </div>
                      </div>

                      {opt.isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteOption('taxDoc', optId)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Remove custom option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 2: INCORPORATION DOCUMENT */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-sm flex items-center justify-center">
                  2
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Step 2: Incorporation Document Controls</h3>
                  <p className="text-xs text-gray-500 font-medium">Control title, instructions, mandatory flag, and entity registration types.</p>
                </div>
              </div>

              {/* Mandatory Toggle Button */}
              <div className="flex items-center gap-2.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 pl-2">Requirement:</span>
                <button
                  type="button"
                  onClick={() => toggleMandatory('incorpDoc')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    config.incorpDoc.isMandatory
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {config.incorpDoc.isMandatory ? '✓ Mandatory (Required)' : '○ Optional (Non-Mandatory)'}
                </button>
              </div>
            </div>

            {/* Inputs: Title & Help Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Step Card Title</label>
                <input
                  type="text"
                  value={config.incorpDoc.title || ''}
                  onChange={(e) => updateNested('incorpDoc', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Incorporation document"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Instruction / Help Text</label>
                <input
                  type="text"
                  value={config.incorpDoc.helpText || ''}
                  onChange={(e) => updateNested('incorpDoc', 'helpText', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Proof that your business is legally registered. Pick one and upload it."
                />
              </div>
            </div>

            {/* Document Types Management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Accepted Incorporation Document Types ({config.incorpDoc.options.filter(o => o.enabled !== false).length} Active)
                </label>
                <button
                  type="button"
                  onClick={() => setNewDocSection(newDocSection === 'incorpDoc' ? null : 'incorpDoc')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document Type</span>
                </button>
              </div>

              {/* Add New Doc Box */}
              {newDocSection === 'incorpDoc' && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl mb-3 space-y-2 animate-in fade-in">
                  <div className="text-xs font-bold text-blue-900">Add New Incorporation Document Type:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Short Pill Label (e.g. Society Certificate)"
                      value={newDocLabel}
                      onChange={(e) => setNewDocLabel(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Full Name (e.g. Registered Society Registration Document)"
                      value={newDocFullLabel}
                      onChange={(e) => setNewDocFullLabel(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setNewDocSection(null); setNewDocLabel(''); setNewDocFullLabel(''); }}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddOption('incorpDoc')}
                      className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Save Document
                    </button>
                  </div>
                </div>
              )}

              {/* List of Incorporation Document Options */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {config.incorpDoc.options.map((opt) => {
                  const optId = opt.id || opt.type;
                  const isEnabled = opt.enabled !== false;
                  return (
                    <div
                      key={optId}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        isEnabled ? 'bg-white border-gray-200 shadow-2xs' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleOptionEnabled('incorpDoc', optId)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center border cursor-pointer transition-colors ${
                            isEnabled ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-transparent'
                          }`}
                          title={isEnabled ? 'Enabled in dropdown' : 'Disabled'}
                        >
                          <Check className="w-4 h-4 stroke-3" />
                        </button>

                        <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={opt.label || ''}
                            onChange={(e) => updateOption('incorpDoc', optId, 'label', e.target.value)}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 outline-none focus:border-emerald-500"
                            placeholder="Short Label"
                          />
                          <input
                            type="text"
                            value={opt.fullLabel || ''}
                            onChange={(e) => updateOption('incorpDoc', optId, 'fullLabel', e.target.value)}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 outline-none focus:border-emerald-500"
                            placeholder="Full Document Name"
                          />
                        </div>
                      </div>

                      {opt.isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteOption('incorpDoc', optId)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Remove custom option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3: EXTRA / SUPPORTING DOCUMENTS */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-extrabold text-sm flex items-center justify-center">
                  3
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Step 3: Extra / Supporting Documents</h3>
                  <p className="text-xs text-gray-500 font-medium">Control optional/mandatory status, title, and extra proof documents.</p>
                </div>
              </div>

              {/* Mandatory Toggle Button */}
              <div className="flex items-center gap-2.5 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 pl-2">Requirement:</span>
                <button
                  type="button"
                  onClick={() => toggleMandatory('extraDoc')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    config.extraDoc.isMandatory
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {config.extraDoc.isMandatory ? '✓ Mandatory (Required)' : '○ Optional (Non-Mandatory)'}
                </button>
              </div>
            </div>

            {/* Inputs: Title & Help Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={config.extraDoc.title || ''}
                  onChange={(e) => updateNested('extraDoc', 'title', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Extra documents"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Instruction / Help Text</label>
                <input
                  type="text"
                  value={config.extraDoc.helpText || ''}
                  onChange={(e) => updateNested('extraDoc', 'helpText', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Address proof, authorization letter, signatory ID, staffing license."
                />
              </div>
            </div>

            {/* Extra Options Management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Accepted Supporting Documents ({config.extraDoc.options.filter(o => o.enabled !== false).length} Active)
                </label>
                <button
                  type="button"
                  onClick={() => setNewDocSection(newDocSection === 'extraDoc' ? null : 'extraDoc')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Document Type</span>
                </button>
              </div>

              {/* Add New Doc Box */}
              {newDocSection === 'extraDoc' && (
                <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl mb-3 space-y-2 animate-in fade-in">
                  <div className="text-xs font-bold text-purple-900">Add New Extra Document Type:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Short Pill Label (e.g. Bank Statement)"
                      value={newDocLabel}
                      onChange={(e) => setNewDocLabel(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Full Name (e.g. Company Bank Account Statement)"
                      value={newDocFullLabel}
                      onChange={(e) => setNewDocFullLabel(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setNewDocSection(null); setNewDocLabel(''); setNewDocFullLabel(''); }}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddOption('extraDoc')}
                      className="px-3.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Save Document
                    </button>
                  </div>
                </div>
              )}

              {/* List of Extra Doc Options */}
              <div className="space-y-2">
                {config.extraDoc.options.map((opt) => {
                  const optId = opt.id || opt.type;
                  const isEnabled = opt.enabled !== false;
                  return (
                    <div
                      key={optId}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        isEnabled ? 'bg-white border-gray-200 shadow-2xs' : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleOptionEnabled('extraDoc', optId)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center border cursor-pointer transition-colors ${
                            isEnabled ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-transparent'
                          }`}
                          title={isEnabled ? 'Enabled in dropdown' : 'Disabled'}
                        >
                          <Check className="w-4 h-4 stroke-3" />
                        </button>

                        <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={opt.label || ''}
                            onChange={(e) => updateOption('extraDoc', optId, 'label', e.target.value)}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 outline-none focus:border-emerald-500"
                            placeholder="Short Label"
                          />
                          <input
                            type="text"
                            value={opt.fullLabel || ''}
                            onChange={(e) => updateOption('extraDoc', optId, 'fullLabel', e.target.value)}
                            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 outline-none focus:border-emerald-500"
                            placeholder="Full Document Name"
                          />
                        </div>
                      </div>

                      {opt.isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteOption('extraDoc', optId)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Remove custom option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAGE HEADINGS & STEPPER TEXTS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'texts' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200/90 shadow-xs space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h3 className="text-base font-extrabold text-gray-900">Page Headings & Stepper Navigation Texts</h3>
            <p className="text-xs text-gray-500 font-medium">Control the main headline, subtitle, breadcrumb, and top step labels.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Main Page Title (H1)</label>
              <input
                type="text"
                value={config.pageTitle || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, pageTitle: e.target.value }))}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-emerald-500"
                placeholder="e.g. Get your company verified"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Page Subtitle</label>
              <input
                type="text"
                value={config.pageSubtitle || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, pageSubtitle: e.target.value }))}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:border-emerald-500"
                placeholder="e.g. Upload 2 documents. Our team reviews them and your jobs go live for candidates."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Breadcrumb Label</label>
              <input
                type="text"
                value={config.breadcrumbLabel || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, breadcrumbLabel: e.target.value }))}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:border-emerald-500"
                placeholder="e.g. / Employer Verification"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Progress Card Title</label>
              <input
                type="text"
                value={config.progressCard?.title || ''}
                onChange={(e) => updateNested('progressCard', 'title', e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:border-emerald-500"
                placeholder="e.g. Your progress"
              />
            </div>
          </div>

          {/* Stepper Steps Labels */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3">Top Stepper Steps Labels</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Step 1 Name</label>
                <input
                  type="text"
                  value={config.step1Label || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, step1Label: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                  placeholder="Tax document"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Step 2 Name</label>
                <input
                  type="text"
                  value={config.step2Label || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, step2Label: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                  placeholder="Incorporation document"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Step 3 Initial Name</label>
                <input
                  type="text"
                  value={config.step3Label || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, step3Label: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                  placeholder="Submit for review"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Step 3 Re-submit Name</label>
                <input
                  type="text"
                  value={config.step3ResubmitLabel || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, step3ResubmitLabel: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                  placeholder="Re-submit for review"
                />
              </div>
            </div>
          </div>

          {/* Submission Buttons Texts */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3">Submit Button Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Submit Button Text</label>
                <input
                  type="text"
                  value={config.progressCard?.submitButtonText || ''}
                  onChange={(e) => updateNested('progressCard', 'submitButtonText', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                  placeholder="Submit for verification"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Re-submit Button Text</label>
                <input
                  type="text"
                  value={config.progressCard?.resubmitButtonText || ''}
                  onChange={(e) => updateNested('progressCard', 'resubmitButtonText', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                  placeholder="Re-submit for verification"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STATUS BANNERS & BENEFITS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'banners' && (
        <div className="space-y-6">

          {/* VERIFIED STATUS BANNER */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                ✓
              </span>
              <h4 className="text-sm font-extrabold text-emerald-950">Verified Status Alert Banner</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={config.verifiedBanner?.title || ''}
                  onChange={(e) => updateNested('verifiedBanner', 'title', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Header Pill Text</label>
                <input
                  type="text"
                  value={config.verifiedBanner?.badgeText || ''}
                  onChange={(e) => updateNested('verifiedBanner', 'badgeText', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Banner Description</label>
                <textarea
                  rows={2}
                  value={config.verifiedBanner?.description || ''}
                  onChange={(e) => updateNested('verifiedBanner', 'description', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* UNDER REVIEW STATUS BANNER */}
          <div className="bg-white rounded-2xl p-6 border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                ⏱
              </span>
              <h4 className="text-sm font-extrabold text-amber-950">Under Review (Pending) Alert Banner</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={config.pendingBanner?.title || ''}
                  onChange={(e) => updateNested('pendingBanner', 'title', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Header Pill Text</label>
                <input
                  type="text"
                  value={config.pendingBanner?.badgeText || ''}
                  onChange={(e) => updateNested('pendingBanner', 'badgeText', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Banner Description</label>
                <textarea
                  rows={2}
                  value={config.pendingBanner?.description || ''}
                  onChange={(e) => updateNested('pendingBanner', 'description', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* REJECTED STATUS BANNER */}
          <div className="bg-white rounded-2xl p-6 border border-red-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                !
              </span>
              <h4 className="text-sm font-extrabold text-red-950">Rejection Alert Banner</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={config.rejectedBanner?.title || ''}
                  onChange={(e) => updateNested('rejectedBanner', 'title', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Header Pill Text</label>
                <input
                  type="text"
                  value={config.rejectedBanner?.badgeText || ''}
                  onChange={(e) => updateNested('rejectedBanner', 'badgeText', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Guidance / Helper Instruction Text</label>
                <textarea
                  rows={2}
                  value={config.rejectedBanner?.helperText || ''}
                  onChange={(e) => updateNested('rejectedBanner', 'helperText', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* BENEFITS CARD CONTROLS */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  ★
                </span>
                <h4 className="text-sm font-extrabold text-gray-900">"After Approval You Get" Benefits Card</h4>
              </div>
              <button
                type="button"
                onClick={handleAddBenefit}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Benefit Item</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Card Title</label>
              <input
                type="text"
                value={config.benefitsCard?.title || ''}
                onChange={(e) => updateNested('benefitsCard', 'title', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-600">Benefit Bullet Points:</label>
              {(config.benefitsCard?.benefits || []).map((b, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                  <input
                    type="text"
                    value={b}
                    onChange={(e) => handleUpdateBenefit(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteBenefit(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LIVE INTERACTIVE PREVIEW                                           */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="bg-[#f5f7f6] rounded-2xl p-6 border border-gray-300 shadow-inner">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Live Preview of Employer Verification Page
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Live CMS Rendering
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 max-w-4xl mx-auto space-y-6">
            {/* Header Preview */}
            <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">sahijob<span className="text-emerald-600">.com</span></span>
                <span className="text-xs text-gray-400 font-medium">{config.breadcrumbLabel}</span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fff1e3] text-[#b4540a] border border-[#fbd8b5]">
                {config.unverifiedBadgeText || 'Unverified'}
              </span>
            </div>

            {/* Title & Subtitle Preview */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{config.pageTitle}</h2>
              <p className="text-sm text-gray-500 mt-1">{config.pageSubtitle}</p>
            </div>

            {/* Stepper Preview */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 text-xs font-bold">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                <span>{config.step1Label}</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200" />
              <div className="flex items-center gap-2 text-gray-700">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">2</span>
                <span>{config.step2Label}</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200" />
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs">3</span>
                <span>{config.step3Label}</span>
              </div>
            </div>

            {/* Cards Grid Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-4">
                {/* Step 1 Card */}
                <div className="border border-emerald-500/80 rounded-xl p-4 bg-emerald-50/20">
                  <div className="flex items-center justify-between mb-1">
                    <b className="text-sm text-gray-900">{config.taxDoc.title}</b>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      config.taxDoc.isMandatory ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {config.taxDoc.isMandatory ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{config.taxDoc.helpText}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {config.taxDoc.options.filter(o => o.enabled !== false).map(opt => (
                      <span key={opt.id || opt.type} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-gray-300 text-gray-700 shadow-2xs">
                        {opt.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Step 2 Card */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <b className="text-sm text-gray-900">{config.incorpDoc.title}</b>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      config.incorpDoc.isMandatory ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {config.incorpDoc.isMandatory ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{config.incorpDoc.helpText}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {config.incorpDoc.options.filter(o => o.enabled !== false).map(opt => (
                      <span key={opt.id || opt.type} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-gray-300 text-gray-700 shadow-2xs">
                        {opt.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Progress Card Preview */}
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs">
                  <b className="text-xs text-gray-900 block mb-2">{config.progressCard.title}</b>
                  <div className="h-1.5 bg-gray-200 rounded-full mb-3" />
                  <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                    <div>○ {config.taxDoc.title} ({config.taxDoc.isMandatory ? 'Required' : 'Optional'})</div>
                    <div>○ {config.incorpDoc.title} ({config.incorpDoc.isMandatory ? 'Required' : 'Optional'})</div>
                  </div>
                  <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                    {config.progressCard.submitButtonText}
                  </button>
                </div>

                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 text-xs">
                  <b className="text-gray-900 block mb-2">{config.benefitsCard.title}</b>
                  <div className="space-y-1.5 text-gray-700">
                    {config.benefitsCard.benefits.map((b, i) => (
                      <div key={i}>✓ {b}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
