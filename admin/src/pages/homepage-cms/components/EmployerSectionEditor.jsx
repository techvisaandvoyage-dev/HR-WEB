import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  LogIn, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Lock, 
  Plus, 
  X, 
  RotateCcw,
  Check
} from 'lucide-react';
import { 
  DEFAULT_EMPLOYER_REGISTER_CONFIG, 
  DEFAULT_EMPLOYER_LOGIN_CONFIG,
  DEFAULT_EMPLOYER_INDUSTRY_OPTIONS,
  DEFAULT_EMPLOYER_SIZE_OPTIONS,
  DEFAULT_EMPLOYER_DESIGNATION_OPTIONS
} from '../../EmployersTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EmployerSectionEditor({ onSaveSuccess }) {
  const [authSubTab, setAuthSubTab] = useState('register'); // 'register' | 'login'
  const [registerConfig, setRegisterConfig] = useState(DEFAULT_EMPLOYER_REGISTER_CONFIG);
  const [loginConfig, setLoginConfig] = useState(DEFAULT_EMPLOYER_LOGIN_CONFIG);

  const [previewRegisterStep, setPreviewRegisterStep] = useState(1);
  const [previewAccountType, setPreviewAccountType] = useState('company');
  const [previewHiringFor, setPreviewHiringFor] = useState('your_company');

  const [newIndustryInput, setNewIndustryInput] = useState('');
  const [newSizeInput, setNewSizeInput] = useState('');
  const [newDesignationInput, setNewDesignationInput] = useState('');

  const [cmsLoading, setCmsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        setCmsLoading(true);
        const res = await fetch(`${API_URL}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.employerRegister) {
            setRegisterConfig({
              ...DEFAULT_EMPLOYER_REGISTER_CONFIG,
              ...data.data.employerRegister,
              step1: {
                ...DEFAULT_EMPLOYER_REGISTER_CONFIG.step1,
                ...(data.data.employerRegister.step1 || {}),
                fields: {
                  ...DEFAULT_EMPLOYER_REGISTER_CONFIG.step1.fields,
                  ...(data.data.employerRegister.step1?.fields || {})
                }
              },
              step2: {
                ...DEFAULT_EMPLOYER_REGISTER_CONFIG.step2,
                ...(data.data.employerRegister.step2 || {}),
                industryOptions: data.data.employerRegister.step2?.industryOptions || DEFAULT_EMPLOYER_INDUSTRY_OPTIONS,
                employeeSizeOptions: data.data.employerRegister.step2?.employeeSizeOptions || DEFAULT_EMPLOYER_SIZE_OPTIONS,
                designationOptions: data.data.employerRegister.step2?.designationOptions || DEFAULT_EMPLOYER_DESIGNATION_OPTIONS,
                fields: {
                  ...DEFAULT_EMPLOYER_REGISTER_CONFIG.step2.fields,
                  ...(data.data.employerRegister.step2?.fields || {})
                }
              }
            });
          }
          if (data.data.employerLogin) {
            setLoginConfig({
              ...DEFAULT_EMPLOYER_LOGIN_CONFIG,
              ...data.data.employerLogin,
              fields: {
                ...DEFAULT_EMPLOYER_LOGIN_CONFIG.fields,
                ...(data.data.employerLogin.fields || {})
              }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching employer CMS config:', err);
      } finally {
        setCmsLoading(false);
      }
    };

    fetchCmsConfig();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setToastMessage('');
      setErrorMessage('');

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerRegister: registerConfig,
          employerLogin: loginConfig
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Employer authentication controls saved successfully!');
        onSaveSuccess?.();
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving employer config:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  // Step 1 Field Handlers
  const handleStep1FieldChange = (key, prop, value) => {
    setRegisterConfig(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        fields: {
          ...prev.step1.fields,
          [key]: {
            ...prev.step1.fields[key],
            [prop]: value
          }
        }
      }
    }));
  };

  const handleToggleStep1Mandatory = (key) => {
    setRegisterConfig(prev => {
      const current = prev.step1?.fields?.[key]?.isRequired !== false;
      return {
        ...prev,
        step1: {
          ...prev.step1,
          fields: {
            ...prev.step1.fields,
            [key]: {
              ...prev.step1.fields[key],
              isRequired: !current
            }
          }
        }
      };
    });
  };

  // Step 2 Field Handlers
  const handleStep2FieldChange = (key, prop, value) => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        fields: {
          ...prev.step2.fields,
          [key]: {
            ...prev.step2.fields[key],
            [prop]: value
          }
        }
      }
    }));
  };

  const handleToggleStep2Mandatory = (key) => {
    setRegisterConfig(prev => {
      const current = prev.step2?.fields?.[key]?.isRequired !== false;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          fields: {
            ...prev.step2.fields,
            [key]: {
              ...prev.step2.fields[key],
              isRequired: !current
            }
          }
        }
      };
    });
  };

  // Option lists handlers
  const handleAddIndustry = () => {
    const val = newIndustryInput.trim();
    if (!val) return;
    setRegisterConfig(prev => {
      const current = prev.step2?.industryOptions || DEFAULT_EMPLOYER_INDUSTRY_OPTIONS;
      if (current.some(item => item.toLowerCase() === val.toLowerCase())) return prev;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          industryOptions: [...current, val]
        }
      };
    });
    setNewIndustryInput('');
  };

  const handleDeleteIndustry = (idx) => {
    setRegisterConfig(prev => {
      const current = prev.step2?.industryOptions || DEFAULT_EMPLOYER_INDUSTRY_OPTIONS;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          industryOptions: current.filter((_, i) => i !== idx)
        }
      };
    });
  };

  const handleResetIndustries = () => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        industryOptions: DEFAULT_EMPLOYER_INDUSTRY_OPTIONS
      }
    }));
  };

  const handleAddCompanySize = () => {
    const val = newSizeInput.trim();
    if (!val) return;
    setRegisterConfig(prev => {
      const current = prev.step2?.employeeSizeOptions || DEFAULT_EMPLOYER_SIZE_OPTIONS;
      if (current.some(item => item.toLowerCase() === val.toLowerCase())) return prev;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          employeeSizeOptions: [...current, val]
        }
      };
    });
    setNewSizeInput('');
  };

  const handleDeleteCompanySize = (idx) => {
    setRegisterConfig(prev => {
      const current = prev.step2?.employeeSizeOptions || DEFAULT_EMPLOYER_SIZE_OPTIONS;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          employeeSizeOptions: current.filter((_, i) => i !== idx)
        }
      };
    });
  };

  const handleResetCompanySizes = () => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        employeeSizeOptions: DEFAULT_EMPLOYER_SIZE_OPTIONS
      }
    }));
  };

  const handleAddDesignation = () => {
    const val = newDesignationInput.trim();
    if (!val) return;
    setRegisterConfig(prev => {
      const current = prev.step2?.designationOptions || DEFAULT_EMPLOYER_DESIGNATION_OPTIONS;
      if (current.some(item => item.toLowerCase() === val.toLowerCase())) return prev;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          designationOptions: [...current, val]
        }
      };
    });
    setNewDesignationInput('');
  };

  const handleDeleteDesignation = (idx) => {
    setRegisterConfig(prev => {
      const current = prev.step2?.designationOptions || DEFAULT_EMPLOYER_DESIGNATION_OPTIONS;
      return {
        ...prev,
        step2: {
          ...prev.step2,
          designationOptions: current.filter((_, i) => i !== idx)
        }
      };
    });
  };

  const handleResetDesignations = () => {
    setRegisterConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        designationOptions: DEFAULT_EMPLOYER_DESIGNATION_OPTIONS
      }
    }));
  };

  // Login Field change handler
  const handleLoginFieldChange = (key, prop, value) => {
    setLoginConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: {
          ...prev.fields[key],
          [prop]: value
        }
      }
    }));
  };

  const step1FieldKeys = [
    { key: 'fullName', title: 'Full Name' },
    { key: 'email', title: 'Official Email ID' },
    { key: 'password', title: 'Password' },
    { key: 'confirmPassword', title: 'Confirm Password' }
  ];

  const step2FieldKeys = [
    { key: 'companyName', title: 'Company / Business Name' },
    { key: 'industry', title: 'Industry (Dropdown)' },
    { key: 'employees', title: 'Company Size (Dropdown)' },
    { key: 'designation', title: 'Your Designation (Dropdown)' },
    { key: 'location', title: 'Company Location' },
    { key: 'website', title: 'Company Website' },
    { key: 'aboutCompany', title: 'About Company' }
  ];

  const loginFieldKeys = [
    { key: 'email', title: 'Official Email ID' },
    { key: 'password', title: 'Password' },
    { key: 'mobile', title: 'Mobile Number (for OTP)' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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

      {/* Sub-Navigation Tabs: Login vs Register */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-xs w-fit">
        <button
          type="button"
          onClick={() => setAuthSubTab('login')}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            authSubTab === 'login'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Employer Login Controls</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthSubTab('register')}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            authSubTab === 'register'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Employer Register Controls</span>
        </button>
      </div>

      {/* SUBTAB 1: REGISTER */}
      {authSubTab === 'register' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                <FileText className="w-7 h-7 text-blue-600" />
                Employer Register Page Controls
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Customize modal headers, text labels, placeholders, dropdown options, and toggle mandatory (<span className="text-red-500 font-bold">*</span>) fields.
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving || cmsLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Register Settings</span>
            </button>
          </div>

          {cmsLoading ? (
            <div className="py-20 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <span>Loading employer registration controls...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Controls */}
              <div className="lg:col-span-7 space-y-6">
                {/* Modal Headers */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Modal Header & Button Texts
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-gray-700 mb-1">Modal Title</label>
                      <input
                        type="text"
                        value={registerConfig.modalTitle || ''}
                        onChange={(e) => setRegisterConfig(prev => ({ ...prev, modalTitle: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-gray-700 mb-1">Modal Subtitle</label>
                      <input
                        type="text"
                        value={registerConfig.modalSubtitle || ''}
                        onChange={(e) => setRegisterConfig(prev => ({ ...prev, modalSubtitle: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Google Button Text</label>
                      <input
                        type="text"
                        value={registerConfig.googleBtnText || ''}
                        onChange={(e) => setRegisterConfig(prev => ({ ...prev, googleBtnText: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Divider Text</label>
                      <input
                        type="text"
                        value={registerConfig.dividerText || ''}
                        onChange={(e) => setRegisterConfig(prev => ({ ...prev, dividerText: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Step 1 Submit / Next Button</label>
                      <input
                        type="text"
                        value={registerConfig.submitBtnText || ''}
                        onChange={(e) => setRegisterConfig(prev => ({ ...prev, submitBtnText: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Step 2 Complete Button</label>
                      <input
                        type="text"
                        value={registerConfig.finalSubmitBtnText || ''}
                        onChange={(e) => setRegisterConfig(prev => ({ ...prev, finalSubmitBtnText: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 1 Fields */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-600" />
                        Step 1: Account Details Fields
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Customize labels, placeholders, and mandatory toggles.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {step1FieldKeys.map(item => {
                      const fieldData = registerConfig.step1?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                      const isReq = fieldData.isRequired !== false;
                      return (
                        <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                              {item.title}
                              {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleStep1Mandatory(item.key)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                isReq
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              {isReq ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Mandatory (*)
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                  Optional
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label</label>
                              <input
                                type="text"
                                value={fieldData.label || ''}
                                onChange={(e) => handleStep1FieldChange(item.key, 'label', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder</label>
                              <input
                                type="text"
                                value={fieldData.placeholder || ''}
                                onChange={(e) => handleStep1FieldChange(item.key, 'placeholder', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2 Fields & Options */}
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Step 2: Company Details Fields & Options
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Configure company profile fields and option lists.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {step2FieldKeys.map(item => {
                      const fieldData = registerConfig.step2?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                      const isReq = fieldData.isRequired !== false;
                      return (
                        <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                              {item.title}
                              {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleStep2Mandatory(item.key)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                isReq
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                              }`}
                            >
                              {isReq ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Mandatory (*)
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                  Optional
                                </>
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label</label>
                              <input
                                type="text"
                                value={fieldData.label || ''}
                                onChange={(e) => handleStep2FieldChange(item.key, 'label', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder</label>
                              <input
                                type="text"
                                value={fieldData.placeholder || ''}
                                onChange={(e) => handleStep2FieldChange(item.key, 'placeholder', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Industry Options */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Industry Options ({registerConfig.step2?.industryOptions?.length || 0})</span>
                      <button
                        type="button"
                        onClick={handleResetIndustries}
                        className="text-[11px] text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new industry..."
                        value={newIndustryInput}
                        onChange={(e) => setNewIndustryInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIndustry())}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddIndustry}
                        className="px-3.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                      {(registerConfig.step2?.industryOptions || DEFAULT_EMPLOYER_INDUSTRY_OPTIONS).map((ind, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-gray-800 text-[11px] rounded-lg font-medium shadow-2xs">
                          {ind}
                          <button type="button" onClick={() => handleDeleteIndustry(idx)} className="text-gray-400 hover:text-red-500 ml-0.5 cursor-pointer">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Preview</span>
                    <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPreviewRegisterStep(1)}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          previewRegisterStep === 1 ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                        }`}
                      >
                        Step 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewRegisterStep(2)}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          previewRegisterStep === 2 ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                        }`}
                      >
                        Step 2
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-5 text-left">
                    <div>
                      <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Employer Portal
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 mt-1">{registerConfig.modalTitle || 'Create Employer Account'}</h2>
                      {registerConfig.modalSubtitle && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{registerConfig.modalSubtitle}</p>
                      )}
                    </div>

                    {previewRegisterStep === 1 && (
                      <div className="space-y-4 text-xs animate-in fade-in duration-150">
                        <div className="py-2.5 px-4 border border-gray-200 rounded-full text-xs font-bold text-gray-700 flex items-center justify-center gap-2 bg-gray-50/50">
                          <span>🌐</span> {registerConfig.googleBtnText || 'Sign up with Google'}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <span className="uppercase tracking-widest">{registerConfig.dividerText || 'Or continue with email'}</span>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>

                        {step1FieldKeys.map(item => {
                          const fData = registerConfig.step1?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                          return (
                            <div key={item.key} className="space-y-1">
                              <label className="block font-bold text-gray-800 text-xs">
                                {fData.label} {fData.isRequired !== false && <span className="text-red-500">*</span>}
                              </label>
                              <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs truncate">
                                {fData.placeholder || 'Enter value...'}
                              </div>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setPreviewRegisterStep(2)}
                          className="w-full py-3 bg-blue-600 text-white font-bold text-xs text-center rounded-xl shadow-md cursor-pointer"
                        >
                          {registerConfig.submitBtnText || 'Continue to Company Details'} →
                        </button>
                      </div>
                    )}

                    {previewRegisterStep === 2 && (
                      <div className="space-y-4 text-xs animate-in fade-in duration-150">
                        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                          <p className="font-bold text-blue-900 text-xs">Step 2: Company Details</p>
                          <button type="button" onClick={() => setPreviewRegisterStep(1)} className="text-[11px] text-blue-700 underline font-bold">
                            ← Back
                          </button>
                        </div>

                        {step2FieldKeys.slice(0, 4).map(item => {
                          const fData = registerConfig.step2?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                          return (
                            <div key={item.key} className="space-y-1">
                              <label className="block font-bold text-gray-800 text-xs">
                                {fData.label} {fData.isRequired !== false && <span className="text-red-500">*</span>}
                              </label>
                              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs truncate">
                                {fData.placeholder || 'Enter value...'}
                              </div>
                            </div>
                          );
                        })}

                        <div className="w-full py-3 bg-emerald-600 text-white font-bold text-xs text-center rounded-xl shadow-md">
                          {registerConfig.finalSubmitBtnText || 'Complete Registration'} ✓
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: LOGIN */}
      {authSubTab === 'login' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                <LogIn className="w-7 h-7 text-blue-600" />
                Employer Login Page Controls
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Customize titles, button texts, social logins, OTP controls, and field labels for recruiter login.
              </p>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving || cmsLoading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Login Settings</span>
            </button>
          </div>

          {cmsLoading ? (
            <div className="py-20 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <span>Loading employer login controls...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Controls */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Modal Header & Action Texts
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-gray-700 mb-1">Modal Title</label>
                      <input
                        type="text"
                        value={loginConfig.modalTitle || ''}
                        onChange={(e) => setLoginConfig(prev => ({ ...prev, modalTitle: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-gray-700 mb-1">Modal Subtitle</label>
                      <input
                        type="text"
                        value={loginConfig.modalSubtitle || ''}
                        onChange={(e) => setLoginConfig(prev => ({ ...prev, modalSubtitle: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Google Button Text</label>
                      <input
                        type="text"
                        value={loginConfig.googleBtnText || ''}
                        onChange={(e) => setLoginConfig(prev => ({ ...prev, googleBtnText: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Divider Text</label>
                      <input
                        type="text"
                        value={loginConfig.dividerText || ''}
                        onChange={(e) => setLoginConfig(prev => ({ ...prev, dividerText: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Submit Button Text</label>
                      <input
                        type="text"
                        value={loginConfig.submitBtnText || ''}
                        onChange={(e) => setLoginConfig(prev => ({ ...prev, submitBtnText: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">OTP Button Text</label>
                      <input
                        type="text"
                        value={loginConfig.otpBtnText || ''}
                        onChange={(e) => setLoginConfig(prev => ({ ...prev, otpBtnText: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Field Labels & Placeholders
                  </h3>

                  <div className="space-y-3">
                    {loginFieldKeys.map(item => {
                      const fData = loginConfig.fields?.[item.key] || { label: item.title, placeholder: '' };
                      return (
                        <div key={item.key} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">{item.title} Label</label>
                            <input
                              type="text"
                              value={fData.label || ''}
                              onChange={(e) => handleLoginFieldChange(item.key, 'label', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">{item.title} Placeholder</label>
                            <input
                              type="text"
                              value={fData.placeholder || ''}
                              onChange={(e) => handleLoginFieldChange(item.key, 'placeholder', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Preview</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">Real-time</span>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-5 text-left">
                    <div>
                      <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Employer Portal
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 mt-1">{loginConfig.modalTitle || 'Welcome to Employer Portal'}</h2>
                      {loginConfig.modalSubtitle && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{loginConfig.modalSubtitle}</p>
                      )}
                    </div>

                    <div className="py-2.5 px-4 border border-gray-200 rounded-full text-xs font-bold text-gray-700 flex items-center justify-center gap-2 bg-gray-50/50">
                      <span>🌐</span> {loginConfig.googleBtnText || 'Continue with Google'}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="uppercase tracking-widest">{loginConfig.dividerText || 'Or with email'}</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="block font-bold text-gray-800">
                          {loginConfig.fields?.email?.label || 'Official Email ID'} <span className="text-red-500">*</span>
                        </label>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs truncate">
                          {loginConfig.fields?.email?.placeholder || 'name@company.com'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-gray-800">
                          {loginConfig.fields?.password?.label || 'Password'} <span className="text-red-500">*</span>
                        </label>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 text-xs truncate">
                          {loginConfig.fields?.password?.placeholder || '••••••••'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2.5">
                      <div className="w-full py-3 bg-blue-600 text-white font-bold text-xs text-center rounded-xl shadow-md">
                        {loginConfig.submitBtnText || 'Sign In'}
                      </div>
                      <div className="w-full py-2.5 bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs text-center rounded-xl">
                        {loginConfig.otpBtnText || 'Use OTP to Login'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
