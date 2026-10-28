import React, { useState, useEffect } from 'react';
import CompanyAutocomplete from '../common/CompanyAutocomplete';
import JobTitleAutocomplete from '../common/JobTitleAutocomplete';
import { IconPlus, IconBag, IconTrash, IconClose, IconChevronDown } from './ProfileIcons';

const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' }
];

const NOTICE_PERIODS = [
  'Immediate',
  '15 Days',
  '30 Days',
  '45 Days',
  '60 Days',
  '90 Days'
];

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Contract',
  'Freelance'
];

const ExperienceModal = ({
  isOpen,
  onClose,
  initialData,
  editIndex,
  onSave,
  onDelete,
  cmsConfig
}) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 45; y--) {
    years.push(String(y));
  }

  const [companyName, setCompanyName] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [isCustomNotice, setIsCustomNotice] = useState(false);
  const [customDays, setCustomDays] = useState('');
  const [roles, setRoles] = useState([
    {
      jobTitle: '',
      employmentType: 'Full-time',
      currentCompany: true,
      joiningDate: '',
      leavingDate: '',
      roleDescription: ''
    }
  ]);
  const [collapsedRoles, setCollapsedRoles] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCompanyName(initialData.companyName || '');
        const initialRoles = (initialData.roles && initialData.roles.length > 0)
          ? initialData.roles.map(r => ({
              jobTitle: r.jobTitle || '',
              employmentType: r.employmentType || 'Full-time',
              currentCompany: Boolean(r.currentCompany),
              joiningDate: r.joiningDate || '',
              leavingDate: r.leavingDate || '',
              roleDescription: r.roleDescription || ''
            }))
          : [
              {
                jobTitle: '',
                employmentType: 'Full-time',
                currentCompany: true,
                joiningDate: '',
                leavingDate: '',
                roleDescription: ''
              }
            ];
        const isCurrent = initialRoles.some(r => r.currentCompany);
        const rawNotice = isCurrent ? (initialData.noticePeriod || '') : '';
        setNoticePeriod(rawNotice);
        if (rawNotice) {
          const isStandard = ['immediate', '15 days', '30 days', '45 days', '60 days', '90 days'].includes(rawNotice.trim().toLowerCase());
          if (!isStandard && /\d+/.test(rawNotice)) {
            setIsCustomNotice(true);
            const digits = rawNotice.match(/\d+/);
            setCustomDays(digits ? digits[0] : '');
          } else {
            setIsCustomNotice(false);
            setCustomDays('');
          }
        } else {
          setIsCustomNotice(false);
          setCustomDays('');
        }
        setRoles(initialRoles);
        // Only keep the first role expanded by default, or all expanded if only 1
        const collapseState = {};
        initialRoles.forEach((_, i) => {
          if (i > 0) collapseState[i] = true;
        });
        setCollapsedRoles(collapseState);
      } else {
        setCompanyName('');
        setNoticePeriod('');
        setIsCustomNotice(false);
        setCustomDays('');
        setRoles([
          {
            jobTitle: '',
            employmentType: 'Full-time',
            currentCompany: true,
            joiningDate: '',
            leavingDate: '',
            roleDescription: ''
          }
        ]);
        setCollapsedRoles({});
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEdit = editIndex >= 0;
  const fields = cmsConfig?.step3?.fields || {};
  const field = (key, label, placeholder = '') => ({ label: fields[key]?.label || label, placeholder: fields[key]?.placeholder || placeholder, isRequired: fields[key]?.isRequired !== false });
  const employmentTypes = Array.isArray(cmsConfig?.step3?.employmentTypeOptions) && cmsConfig.step3.employmentTypeOptions.length ? cmsConfig.step3.employmentTypeOptions : EMPLOYMENT_TYPES;
  const noticePeriods = Array.isArray(cmsConfig?.step3?.noticePeriodOptions) && cmsConfig.step3.noticePeriodOptions.length ? cmsConfig.step3.noticePeriodOptions : NOTICE_PERIODS;
  const company = field('companyName', 'Company name', 'Enter company name');
  const notice = field('noticePeriod', 'Notice Period', 'Select notice period');
  const jobTitle = field('jobTitle', 'Job title / Role', 'Enter job title');
  const employmentType = field('employmentType', 'Employment type', 'Select employment type');
  const joiningDate = field('joiningDate', 'Joining date');
  const leavingDate = field('leavingDate', 'Leaving date');
  const currentCompany = field('currentCompany', 'I currently work here');
  const roleDescription = field('roleDescription', 'Roles & responsibilities', 'Briefly describe your roles & responsibilities');

  const toggleRoleCollapse = (idx) => {
    setCollapsedRoles(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleRoleChange = (idx, field, value) => {
    setRoles(prev => {
      const updated = field === 'currentCompany' && value === true
        ? prev.map((role, roleIndex) => roleIndex === idx ? role : {
            ...role,
            currentCompany: false,
            leavingDate: role.leavingDate || new Date().toISOString().slice(0, 7)
          })
        : [...prev];
      const targetRole = { ...updated[idx], [field]: value };
      if (field === 'currentCompany' && value === true) {
        targetRole.leavingDate = '';
      }
      updated[idx] = targetRole;
      if (!updated.some(r => r.currentCompany)) {
        setNoticePeriod('');
      }
      return updated;
    });
  };

  const handleMonthYearChange = (idx, type, part, value) => {
    setRoles(prev => {
      const updated = [...prev];
      const targetRole = { ...updated[idx] };
      const field = type === 'join' ? 'joiningDate' : 'leavingDate';
      const curVal = targetRole[field] || '';
      const [curYear, curMonth] = curVal.split('-');

      let newYear = curYear || '';
      let newMonth = curMonth || '';

      if (part === 'month') newMonth = value;
      if (part === 'year') newYear = value;

      if (newYear && newMonth) {
        targetRole[field] = `${newYear}-${newMonth}`;
      } else if (!newYear && !newMonth) {
        targetRole[field] = '';
      } else {
        targetRole[field] = `${newYear || ''}-${newMonth || ''}`;
      }

      updated[idx] = targetRole;
      return updated;
    });
  };

  const handleAddRole = () => {
    const newCollapse = {};
    roles.forEach((_, i) => {
      newCollapse[i] = true;
    });
    setCollapsedRoles(newCollapse);

    setRoles(prev => [
      ...prev,
      {
        jobTitle: '',
        employmentType: 'Full-time',
        currentCompany: false,
        joiningDate: '',
        leavingDate: '',
        roleDescription: ''
      }
    ]);
  };

  const handleRemoveRole = (idx, e) => {
    e.stopPropagation();
    if (roles.length <= 1) {
      alert('At least one role is required');
      return;
    }
    setRoles(prev => prev.filter((_, i) => i !== idx));
  };

  const formatSummary = (r) => {
    const title = r.jobTitle || 'Enter role details';
    if (!r.joiningDate) return title;
    
    const [jy, jm] = r.joiningDate.split('-');
    const jMonthLabel = MONTHS.find(m => m.value === jm)?.label || '';
    const joinStr = jMonthLabel ? `${jMonthLabel} ${jy}` : jy;

    let leaveStr = 'Present';
    if (!r.currentCompany) {
      if (r.leavingDate) {
        const [ly, lm] = r.leavingDate.split('-');
        const lMonthLabel = MONTHS.find(m => m.value === lm)?.label || '';
        leaveStr = lMonthLabel ? `${lMonthLabel} ${ly}` : ly;
      } else {
        leaveStr = '…';
      }
    }

    return `${title} · ${joinStr} – ${leaveStr}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (cmsConfig?.step3?.fields?.companyName?.isRequired !== false && !companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    let hasRoleError = false;
    roles.forEach((role, i) => {
      if ((cmsConfig?.step3?.fields?.jobTitle?.isRequired !== false && !role.jobTitle.trim()) || (cmsConfig?.step3?.fields?.employmentType?.isRequired !== false && !role.employmentType) || (cmsConfig?.step3?.fields?.joiningDate?.isRequired !== false && !role.joiningDate)) {
        hasRoleError = true;
        // Auto-expand role with error
        setCollapsedRoles(prev => ({ ...prev, [i]: false }));
      }
      if (cmsConfig?.step3?.fields?.leavingDate?.isRequired === true && !role.currentCompany && !role.leavingDate) {
        hasRoleError = true;
        setCollapsedRoles(prev => ({ ...prev, [i]: false }));
      }
      if (role.joiningDate && role.leavingDate && role.leavingDate < role.joiningDate) {
        newErrors[`role_${i}_dates`] = 'Leaving date must be after joining date';
        setCollapsedRoles(prev => ({ ...prev, [i]: false }));
      }
    });

    if (hasRoleError) {
      newErrors.roles = 'Please fill all required fields in the roles';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const isCurrent = roles.some(r => r.currentCompany);
    onSave({
      companyName,
      noticePeriod: isCurrent ? noticePeriod : '',
      roles
    }, editIndex);

    onClose();
  };

  return (
    <div className="sj-modal-backdrop" onClick={onClose}>
      <div className="sj-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sj-mh">
            <div className="flex items-center gap-3">
              <span className="sj-mi">
                {isEdit ? <IconBag /> : <IconPlus />}
              </span>
              <div>
                <h3>{isEdit ? 'Edit experience' : 'Add experience'}</h3>
                <p>Add a company and the roles you held there</p>
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
            {/* Company Name */}
            <div className="sj-fld sj-full">
              <label className="sj-lb">
                {company.label} {company.isRequired && <span className="sj-req">*</span>}
              </label>
              <CompanyAutocomplete
                value={companyName}
                onChange={(val) => {
                  setCompanyName(val);
                  setErrors(prev => ({ ...prev, companyName: '' }));
                }}
                placeholder={company.placeholder}
                className="sj-in"
              />
              {errors.companyName && <p className="sj-err">{errors.companyName}</p>}
            </div>

            {/* Notice Period (Only for Current Company) */}
            {roles.some(r => r.currentCompany) && (
              <div className="sj-fld sj-full">
                <div className="flex items-center justify-between mb-1">
                  <label className="sj-lb !mb-0">{notice.label}</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCustomNotice) {
                        setIsCustomNotice(true);
                        const digits = (noticePeriod || '').match(/\d+/);
                        const d = digits ? digits[0] : '';
                        setCustomDays(d);
                        if (d) setNoticePeriod(`${d} Days`);
                      } else {
                        setIsCustomNotice(false);
                        setCustomDays('');
                      }
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    {isCustomNotice ? 'Choose from list' : '+ Custom days'}
                  </button>
                </div>
                {!isCustomNotice ? (
                  <select
                    className="sj-in"
                    value={noticePeriod}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomNotice(true);
                        setCustomDays('');
                      } else {
                        setNoticePeriod(val);
                      }
                    }}
                  >
                    <option value="">{notice.placeholder}</option>
                    {noticePeriods.map(item => { const np = typeof item === 'string' ? item : (item.value || item.label); const label = typeof item === 'string' ? item : (item.label || item.value); return (
                      <option key={np} value={np}>{label}</option>
                    ); })}
                    <option value="__custom__">Custom (Enter Days)</option>
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      placeholder="e.g. 45"
                      value={customDays}
                      onChange={(e) => {
                        const num = e.target.value.replace(/\D/g, '');
                        setCustomDays(num);
                        setNoticePeriod(num ? `${num} Days` : '');
                      }}
                      className="sj-in pr-16 font-medium"
                      autoFocus
                    />
                    <div className="absolute right-3 pointer-events-none flex items-center">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 select-none">
                        Days
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Roles Accordion List */}
            <div className="sj-full flex flex-col gap-3">
              {roles.map((role, idx) => {
                const isCollapsed = Boolean(collapsedRoles[idx]);
                const [joinYear = '', joinMonth = ''] = (role.joiningDate || '').split('-');
                const [leaveYear = '', leaveMonth = ''] = (role.leavingDate || '').split('-');
                const dateError = errors[`role_${idx}_dates`];

                return (
                  <div
                    key={idx}
                    className={`sj-role-card ${!isCollapsed ? 'sj-open' : ''}`}
                  >
                    {/* Role Header */}
                    <div
                      className="sj-role-header"
                      onClick={() => toggleRoleCollapse(idx)}
                    >
                      <span className="sj-role-dot"></span>
                      <div className="sj-role-meta">
                        <b>Role {idx + 1}</b>
                        <small>{formatSummary(role)}</small>
                      </div>
                      {roles.length > 1 && (
                        <button
                          type="button"
                          className="sj-ib text-gray-400 hover:text-red-500"
                          onClick={(e) => handleRemoveRole(idx, e)}
                          title="Delete role"
                          aria-label="Delete role"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      )}
                      <IconChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          !isCollapsed ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {/* Role Body (Collapsible) */}
                    {!isCollapsed && (
                      <div className="sj-role-body">
                        {/* Job title / Role */}
                        <div className="sj-fld sj-full">
                          <label className="sj-lb">
                            {jobTitle.label} {jobTitle.isRequired && <span className="sj-req">*</span>}
                          </label>
                          <JobTitleAutocomplete
                            value={role.jobTitle}
                            onChange={(val) => handleRoleChange(idx, 'jobTitle', val)}
                            placeholder={jobTitle.placeholder}
                            className="sj-in"
                          />
                        </div>

                        {/* Employment type */}
                        <div className="sj-fld sj-full">
                          <label className="sj-lb">
                            {employmentType.label} {employmentType.isRequired && <span className="sj-req">*</span>}
                          </label>
                          <select
                            className="sj-in"
                            value={role.employmentType}
                            onChange={(e) => handleRoleChange(idx, 'employmentType', e.target.value)}
                          >
                            <option value="">{employmentType.placeholder}</option>
                            {employmentTypes.map(item => { const t = typeof item === 'string' ? item : (item.value || item.label); const label = typeof item === 'string' ? item : (item.label || item.value); return <option key={t} value={t}>{label}</option>; })}
                          </select>
                        </div>

                        {/* I currently work here */}
                        <div className="sj-fld sj-full">
                          <label className="sj-chk-wrap">
                            <input
                              type="checkbox"
                              className="sj-chk"
                              checked={role.currentCompany}
                              onChange={(e) => handleRoleChange(idx, 'currentCompany', e.target.checked)}
                            />
                            <span>{currentCompany.label}</span>
                          </label>
                        </div>

                        {/* Joining date */}
                        <div className="sj-fld">
                          <label className="sj-lb">
                            {joiningDate.label} {joiningDate.isRequired && <span className="sj-req">*</span>}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              className="sj-in"
                              value={joinMonth}
                              onChange={(e) => handleMonthYearChange(idx, 'join', 'month', e.target.value)}
                            >
                              <option value="">Month</option>
                              {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                              ))}
                            </select>
                            <select
                              className="sj-in"
                              value={joinYear}
                              onChange={(e) => handleMonthYearChange(idx, 'join', 'year', e.target.value)}
                            >
                              <option value="">Year</option>
                              {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Leaving date */}
                        <div className="sj-fld">
                          <label className="sj-lb">{leavingDate.label}</label>
                          {role.currentCompany ? (
                            <input
                              type="text"
                              className="sj-in"
                              value="Present"
                              disabled
                              readOnly
                            />
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                className="sj-in"
                                value={leaveMonth}
                                onChange={(e) => handleMonthYearChange(idx, 'leave', 'month', e.target.value)}
                              >
                                <option value="">Month</option>
                                {MONTHS.map(m => (
                                  <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                              </select>
                              <select
                                className="sj-in"
                                value={leaveYear}
                                onChange={(e) => handleMonthYearChange(idx, 'leave', 'year', e.target.value)}
                              >
                                <option value="">Year</option>
                                {years.map(y => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {dateError && <p className="sj-err">{dateError}</p>}
                        </div>

                        {/* Roles & responsibilities */}
                        <div className="sj-fld sj-full">
                          <label className="sj-lb">{roleDescription.label}</label>
                          <textarea
                            rows={3}
                            className="sj-in"
                            style={{ minHeight: 88, paddingTop: 10 }}
                            placeholder={roleDescription.placeholder}
                            value={role.roleDescription}
                            maxLength={500}
                            onChange={(e) => handleRoleChange(idx, 'roleDescription', e.target.value)}
                          ></textarea>
                          <div className="sj-hint">
                            <span>{(role.roleDescription || '').length}</span>/500
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="w-full border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
                onClick={handleAddRole}
              >
                <IconPlus className="w-4 h-4" />
                <span>Add another role</span>
              </button>
            </div>
            {errors.roles && <p className="sj-err sj-full">{errors.roles}</p>}
          </div>

          {/* Footer */}
          <div className="sj-mf">
            {isEdit && onDelete ? (
              <button
                type="button"
                className="sj-btn-del"
                onClick={() => {
                  onDelete(editIndex);
                  onClose();
                }}
              >
                <IconTrash className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : null}
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
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperienceModal;
