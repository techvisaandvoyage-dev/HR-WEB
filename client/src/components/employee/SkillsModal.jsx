import React, { useState, useEffect, useMemo, useRef } from 'react';
import JobTitleAutocomplete from '../common/JobTitleAutocomplete';
import MultiSelectLocationDropdown from '../common/MultiSelectLocationDropdown';
import { preferredLocationOptions } from '../../data/preferredLocations';
import { getSuggestedSkills, allSkillsOptions } from '../../utils/skillsData';
import { socket } from '../../utils/socket';
import { IconPen, IconClose, IconPlus } from './ProfileIcons';

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'AED', label: 'AED (د.إ)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'SGD', label: 'SGD ($)' },
  { value: 'SAR', label: 'SAR (﷼)' },
  { value: 'QAR', label: 'QAR (﷼)' },
  { value: 'OMR', label: 'OMR (﷼)' },
  { value: 'KWD', label: 'KWD (د.ك)' },
  { value: 'BHD', label: 'BHD (.د.b)' }
];

const TOTAL_EXP_OPTIONS = [
  '0 – 1 Yrs',
  '1 – 5 Yrs',
  '6 – 10 Yrs',
  '11 – 15 Yrs',
  '16 – 20 Yrs',
  '20+ Yrs'
];

const FUNCTION_OPTIONS = [
  'Finance & Accounting',
  'IT & Software',
  'Design & Creative',
  'Sales & Business Development',
  'Marketing & Communication',
  'Operations & Supply Chain',
  'Human Resources',
  'Healthcare & Pharmaceuticals',
  'Manufacturing & Production',
  'Other'
];

const DEFAULT_SUGGESTED_SKILLS = [
  'Tally',
  'QuickBooks',
  'Bookkeeping',
  'Financial Analysis',
  'Excel',
  'GST',
  'Auditing',
  'Accounting',
  'Taxation',
  'Compliance',
  '3D Modeling',
  'Python'
];

const SkillsModal = ({
  isOpen,
  onClose,
  formData,
  onSave,
  cmsConfig
}) => {
  const [form, setForm] = useState({
    designation: '',
    function: '',
    preferredLocation: '',
    totalExperience: '',
    linkedinUrl: '',
    salaryType: 'Yearly',
    currency: 'INR',
    currentSalary: '',
    expectedSalary: '',
    skills: []
  });

  const [skillInput, setSkillInput] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [errors, setErrors] = useState({});
  const skillWrapperRef = useRef(null);
  const [internalCmsConfig, setInternalCmsConfig] = useState(null);

  // Fetch CMS config if not provided from parent
  useEffect(() => {
    if (isOpen && !cmsConfig && !internalCmsConfig) {
      const fetchCms = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
          const data = await res.json();
          if (data?.success && data?.data?.employeeOnboarding) {
            setInternalCmsConfig(data.data.employeeOnboarding);
          } else if (data?.employeeOnboarding) {
            setInternalCmsConfig(data.employeeOnboarding);
          }
        } catch (err) {
          console.error("Failed to fetch CMS config in SkillsModal:", err);
        }
      };
      fetchCms();
    }
  }, [isOpen, cmsConfig, internalCmsConfig]);

  // Keep CMS config updated in real-time when admin changes skills options
  useEffect(() => {
    const handleCmsUpdate = ({ employeeOnboarding }) => {
      if (employeeOnboarding && typeof employeeOnboarding === 'object') {
        setInternalCmsConfig(employeeOnboarding);
      }
    };
    socket.on('employee_onboarding_config_updated', handleCmsUpdate);
    return () => socket.off('employee_onboarding_config_updated', handleCmsUpdate);
  }, []);

  // Click outside listener to close skill dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (skillWrapperRef.current && !skillWrapperRef.current.contains(e.target)) {
        setShowSkillDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && formData) {
      const p = formData.professionalDetails || {};
      let initialSkills = [];
      if (p.skills) {
        if (Array.isArray(p.skills)) {
          initialSkills = p.skills.map(s => (typeof s === 'string' ? s : (s?.name || s?.label || String(s || '')))).filter(Boolean);
        } else if (typeof p.skills === 'string') {
          initialSkills = p.skills.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      setForm({
        designation: formData.designation || p.designation || '',
        function: p.function || formData.industry || '',
        preferredLocation: formData.preferredLocation || p.preferredLocation || '',
        totalExperience: p.totalExperience || formData.totalExperience || '',
        linkedinUrl: p.linkedinUrl || '',
        salaryType: p.salaryType || 'Yearly',
        currency: p.currency || 'INR',
        currentSalary: p.currentSalary || '',
        expectedSalary: p.expectedSalary || '',
        skills: initialSkills
      });
      setSkillInput('');
      setShowSkillDropdown(false);
      setHighlightedIndex(-1);
      setErrors({});
    }
  }, [isOpen, formData]);

  const activeCms = cmsConfig || internalCmsConfig;
  const fields = activeCms?.step4?.fields || {};
  const field = (key, label, placeholder = '') => ({ label: fields[key]?.label || label, placeholder: fields[key]?.placeholder || placeholder, isRequired: fields[key]?.isRequired !== false });
  const functionsMap = activeCms?.step1?.functionsData;
  const functionOptions = functionsMap && typeof functionsMap === 'object' && Object.keys(functionsMap).length
    ? Object.keys(functionsMap) : FUNCTION_OPTIONS;
  const experienceOptions = Array.isArray(activeCms?.step1?.experienceOptions) && activeCms.step1.experienceOptions.length ? activeCms.step1.experienceOptions : TOTAL_EXP_OPTIONS;
  const locationOptions = Array.isArray(activeCms?.step1?.locationCities) && activeCms.step1.locationCities.length
    ? activeCms.step1.locationCities.map(item => ({ value: typeof item === 'string' ? item : (item.value || item.label), label: typeof item === 'string' ? item : (item.label || item.value) })) : preferredLocationOptions;
  const designation = field('designation', 'Designation / Role', 'Select or type designation');
  const industry = field('industry', 'Function', 'Select Function');
  const preferredLocation = field('preferredLocation', 'Preferred location', 'Select Preferred Locations');
  const totalExperience = field('totalExperience', 'Total experience', 'Select Experience');
  const linkedinUrl = field('linkedinUrl', 'LinkedIn profile URL', 'https://linkedin.com/in/username');
  const salaryType = field('salaryType', 'Salary type', 'Select salary type');
  const currency = field('currency', 'Currency', 'Select currency');
  const currentSalary = field('currentSalary', 'Current annual CTC', 'e.g. 12,00,000');
  const expectedSalary = field('expectedSalary', 'Expected annual CTC', 'e.g. 15,00,000');
  const skills = field('skills', 'Key skills', 'Search or type a skill (e.g. React, Tally, Python)...');

  // Dynamic skills options configured by admin (fallback to allSkillsOptions if not configured)
  const allAvailableSkills = useMemo(() => {
    if (Array.isArray(activeCms?.step4?.skillsOptions) && activeCms.step4.skillsOptions.length > 0) {
      return activeCms.step4.skillsOptions.map(opt => {
        const val = (typeof opt === 'string' ? opt : (opt?.value || opt?.label || '')).trim();
        const lbl = (typeof opt === 'string' ? opt : (opt?.label || opt?.value || '')).trim();
        return { value: val, label: lbl };
      }).filter(item => item.value);
    }
    return (allSkillsOptions || []).map(opt => ({
      value: (typeof opt === 'string' ? opt : (opt?.value || opt?.label || '')).trim(),
      label: (typeof opt === 'string' ? opt : (opt?.label || opt?.value || '')).trim()
    })).filter(item => item.value);
  }, [activeCms?.step4?.skillsOptions]);

  // Matching skills from CMS configured list / dictionary
  const matchingSkills = useMemo(() => {
    const q = (skillInput || '').trim().toLowerCase();
    if (!q) return [];
    
    const lowerAdded = new Set(form.skills.map(s => String(s || '').toLowerCase()));
    
    const matched = allAvailableSkills.filter(item => {
      const itemLower = String(item.label || item.value || '').toLowerCase();
      if (lowerAdded.has(itemLower)) return false;
      return itemLower.includes(q);
    });

    // Smart sort: exact match first, then starts-with, then alphabetical
    matched.sort((a, b) => {
      const aLower = String(a.label || a.value || '').toLowerCase();
      const bLower = String(b.label || b.value || '').toLowerCase();
      const aExact = aLower === q;
      const bExact = bLower === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aLower.startsWith(q);
      const bStarts = bLower.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return aLower.localeCompare(bLower);
    });

    return matched.slice(0, 15);
  }, [skillInput, form.skills, allAvailableSkills]);

  // Suggested skills: based on current selection or top configured skills
  const defaultSkillsPool = useMemo(() => {
    if (Array.isArray(activeCms?.step4?.skillsOptions) && activeCms.step4.skillsOptions.length > 0) {
      return activeCms.step4.skillsOptions
        .map(s => (typeof s === 'string' ? s : (s?.label || s?.value || '')).trim())
        .filter(Boolean);
    }
    return DEFAULT_SUGGESTED_SKILLS;
  }, [activeCms?.step4?.skillsOptions]);

  const dynamicSuggestions = useMemo(() => {
    return form.skills.length > 0 ? getSuggestedSkills(form.skills) : [];
  }, [form.skills]);

  const availableSuggestions = useMemo(() => {
    const basePool = dynamicSuggestions.length > 0 ? dynamicSuggestions : defaultSkillsPool;
    const lowerAdded = new Set(form.skills.map(s => String(s || '').toLowerCase()));
    return basePool.filter(s => !lowerAdded.has(String(s || '').toLowerCase())).slice(0, 8);
  }, [dynamicSuggestions, defaultSkillsPool, form.skills]);

  // Hooks must run on every render, including while the modal is closed.
  // Keep this guard after useMemo to preserve a stable hook order.
  if (!isOpen) return null;

  const handleAddSkill = (skillToAdd) => {
    const raw = (skillToAdd || '').trim();
    if (!raw) return;

    // Support single or comma-separated bulk skills
    const itemsToAdd = raw.includes(',')
      ? raw.split(',').map(s => s.trim()).filter(Boolean)
      : [raw];

    if (itemsToAdd.length === 0) return;

    setForm(prev => {
      const lowerExisting = new Set(prev.skills.map(s => String(s || '').toLowerCase()));
      const uniqueNew = itemsToAdd.filter(item => !lowerExisting.has(item.toLowerCase()));
      if (uniqueNew.length === 0) return prev;
      return {
        ...prev,
        skills: [...prev.skills, ...uniqueNew]
      };
    });

    setSkillInput('');
    setShowSkillDropdown(false);
    setHighlightedIndex(-1);
    setErrors(prev => ({ ...prev, skills: '' }));
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => String(s || '').toLowerCase() !== String(skillToRemove || '').toLowerCase())
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (matchingSkills.length > 0) {
        e.preventDefault();
        setHighlightedIndex(prev => (prev < matchingSkills.length - 1 ? prev + 1 : 0));
        setShowSkillDropdown(true);
      }
    } else if (e.key === 'ArrowUp') {
      if (matchingSkills.length > 0) {
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : matchingSkills.length - 1));
        setShowSkillDropdown(true);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (showSkillDropdown && highlightedIndex >= 0 && matchingSkills[highlightedIndex]) {
        handleAddSkill(matchingSkills[highlightedIndex].label || matchingSkills[highlightedIndex].value);
      } else {
        handleAddSkill(skillInput);
      }
      setShowSkillDropdown(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowSkillDropdown(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (cmsConfig?.step1?.fields?.designation?.isRequired !== false && !form.designation.trim()) {
      newErrors.designation = 'Designation / Role is required';
    }
    if (cmsConfig?.step4?.fields?.skills?.isRequired === true && form.skills.length === 0) {
      newErrors.skills = 'Add at least one skill';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...form,
      skillsString: form.skills.join(', ')
    });

    onClose();
  };

// Suggested skills already computed in hook above

  return (
    <div className="sj-modal-backdrop" onClick={onClose}>
      <div className="sj-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sj-mh">
            <div className="flex items-center gap-3">
              <span className="sj-mi">
                <IconPen />
              </span>
              <div>
                <h3>Key skills &amp; preferences</h3>
                <p>Used to match you with the right jobs</p>
              </div>
            </div>
            <button
              type="button"
              className="sj-ib"
              onClick={onClose}
              aria-label="Close"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="sj-mb">
            {/* Designation / Role */}
            <div className="sj-fld">
              <label className="sj-lb">
                {designation.label} {designation.isRequired && <span className="sj-req">*</span>}
              </label>
              <JobTitleAutocomplete
                value={form.designation}
                onChange={(val) => {
                  setForm({ ...form, designation: val });
                  setErrors(prev => ({ ...prev, designation: '' }));
                }}
                placeholder={designation.placeholder}
                className="sj-in"
              />
              {errors.designation && <p className="sj-err">{errors.designation}</p>}
            </div>

            {/* Function */}
            <div className="sj-fld">
              <label className="sj-lb">{industry.label}</label>
              <select
                className="sj-in"
                value={form.function}
                onChange={(e) => setForm({ ...form, function: e.target.value })}
              >
                <option value="">{industry.placeholder}</option>
                {functionOptions.map(item => { const fn = typeof item === 'string' ? item : (item.value || item.label); const label = typeof item === 'string' ? item : (item.label || item.value); return <option key={fn} value={fn}>{label}</option>; })}
              </select>
            </div>

            {/* Preferred Location */}
            <div className="sj-fld">
              <label className="sj-lb">{preferredLocation.label}</label>
              <MultiSelectLocationDropdown
                options={locationOptions}
                value={form.preferredLocation}
                onChange={(val) => setForm({ ...form, preferredLocation: val })}
                multiple={true}
                placeholder={preferredLocation.placeholder}
                className="sj-in"
              />
            </div>

            {/* Total Experience */}
            <div className="sj-fld">
              <label className="sj-lb">{totalExperience.label}</label>
              <select
                className="sj-in"
                value={form.totalExperience}
                onChange={(e) => setForm({ ...form, totalExperience: e.target.value })}
              >
                <option value="">{totalExperience.placeholder}</option>
                {experienceOptions.map(item => { const te = typeof item === 'string' ? item : (item.value || item.label); const label = typeof item === 'string' ? item : (item.label || item.value); return <option key={te} value={te}>{label}</option>; })}
              </select>
            </div>

            {/* LinkedIn Profile */}
            <div className="sj-fld sj-full">
              <label className="sj-lb">{linkedinUrl.label}</label>
              <input
                type="url"
                className="sj-in"
                placeholder={linkedinUrl.placeholder}
                value={form.linkedinUrl}
                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              />
            </div>

            {/* Salary Type */}
            <div className="sj-fld">
              <label className="sj-lb">{salaryType.label}</label>
              <select
                className="sj-in"
                value={form.salaryType}
                onChange={(e) => setForm({ ...form, salaryType: e.target.value })}
              >
                <option value="Yearly">Yearly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            {/* Currency */}
            <div className="sj-fld">
              <label className="sj-lb">{currency.label}</label>
              <select
                className="sj-in"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {CURRENCY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Current annual CTC */}
            <div className="sj-fld">
              <label className="sj-lb">{currentSalary.label}</label>
              <input
                type="text"
                className="sj-in"
                placeholder={currentSalary.placeholder}
                value={form.currentSalary}
                onChange={(e) => setForm({ ...form, currentSalary: e.target.value })}
              />
            </div>

            {/* Expected annual CTC */}
            <div className="sj-fld">
              <label className="sj-lb">{expectedSalary.label}</label>
              <input
                type="text"
                className="sj-in"
                placeholder={expectedSalary.placeholder}
                value={form.expectedSalary}
                onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })}
              />
            </div>

            {/* Key Skills */}
            <div className="sj-fld sj-full">
              <label className="sj-lb">
                {skills.label} {skills.isRequired && <span className="sj-req">*</span>}
              </label>

              {/* Added Skills Pill Container */}
              {form.skills.length > 0 && (
                <div className="sj-sk-pills">
                  {form.skills.map((s, idx) => (
                    <span key={idx} className="sj-sk-pill">
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        aria-label={`Remove ${s}`}
                      >
                        <IconClose className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add Skill Input with Autocomplete Dropdown */}
              <div className="flex gap-2">
                <div className="relative flex-1" ref={skillWrapperRef}>
                  <input
                    type="text"
                    className="sj-in w-full"
                    placeholder={skills.placeholder}
                    value={skillInput}
                    onChange={(e) => {
                      setSkillInput(e.target.value);
                      setShowSkillDropdown(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => {
                      if (skillInput.trim()) setShowSkillDropdown(true);
                    }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                  />

                  {/* Dropdown Menu */}
                  {showSkillDropdown && (
                    <div 
                      className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto py-1.5"
                      style={{ boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
                    >
                      {matchingSkills.length > 0 ? (
                        <>
                          <div className="px-3.5 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
                            <span>Suggested Skills ({matchingSkills.length})</span>
                            <span className="text-[10px] text-gray-400 font-normal">Use ↑↓ and Enter</span>
                          </div>
                          {matchingSkills.map((item, idx) => {
                            const skillName = item.label || item.value;
                            const isHighlighted = highlightedIndex === idx;
                            return (
                              <button
                                key={item.value || idx}
                                type="button"
                                className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors cursor-pointer ${
                                  isHighlighted 
                                    ? 'bg-emerald-50 text-emerald-800 font-semibold' 
                                    : 'text-gray-800 hover:bg-gray-50'
                                }`}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                onClick={() => handleAddSkill(skillName)}
                              >
                                <span className="truncate">{skillName}</span>
                                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0 flex items-center gap-1">
                                  <IconPlus className="w-3 h-3" /> Add
                                </span>
                              </button>
                            );
                          })}
                          {skillInput.trim() && !matchingSkills.some(m => (m.label || m.value || '').toLowerCase() === skillInput.trim().toLowerCase()) && (
                            <button
                              type="button"
                              className="w-full text-left px-3.5 py-2 text-xs border-t border-gray-100 text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                              onClick={() => handleAddSkill(skillInput)}
                            >
                              <span>Add custom skill <strong>"{skillInput.trim()}"</strong></span>
                              <span className="text-[11px] bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">Press Enter</span>
                            </button>
                          )}
                        </>
                      ) : (
                        skillInput.trim() && (
                          <div className="px-3.5 py-3 text-sm text-gray-600 flex items-center justify-between">
                            <span className="text-xs text-gray-500">No matching skill found</span>
                            <button
                              type="button"
                              onClick={() => handleAddSkill(skillInput)}
                              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <IconPlus className="w-3 h-3" /> Add "{skillInput.trim()}"
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="sj-btn-save flex-shrink-0"
                  onClick={() => handleAddSkill(skillInput)}
                  style={{ minHeight: 48, padding: '0 18px' }}
                >
                  <IconPlus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              {errors.skills && <p className="sj-err">{errors.skills}</p>}

              {/* Suggested Skills */}
              {availableSuggestions.length > 0 && (
                <div className="mt-3">
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--sj-mut)', display: 'block', marginBottom: 6 }}>
                    Suggested skills:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                        onClick={() => handleAddSkill(s)}
                      >
                        <span>{s}</span>
                        <IconPlus className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sj-mf">
            <span className="sj-sp"></span>
            <button
              type="button"
              className="sj-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sj-btn-save"
            >
              Save preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SkillsModal;
