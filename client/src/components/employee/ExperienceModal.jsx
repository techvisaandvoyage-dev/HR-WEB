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
  onDelete
}) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 45; y--) {
    years.push(String(y));
  }

  const [companyName, setCompanyName] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
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
        setNoticePeriod(initialData.noticePeriod || '');
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

  const toggleRoleCollapse = (idx) => {
    setCollapsedRoles(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleRoleChange = (idx, field, value) => {
    setRoles(prev => {
      const updated = [...prev];
      const targetRole = { ...updated[idx], [field]: value };
      if (field === 'currentCompany' && value === true) {
        targetRole.leavingDate = '';
      }
      updated[idx] = targetRole;
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

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    let hasRoleError = false;
    roles.forEach((role, i) => {
      if (!role.jobTitle.trim() || !role.employmentType || !role.joiningDate) {
        hasRoleError = true;
        // Auto-expand role with error
        setCollapsedRoles(prev => ({ ...prev, [i]: false }));
      }
      if (!role.currentCompany && !role.leavingDate) {
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

    onSave({
      companyName,
      noticePeriod,
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
                Company name <span className="sj-req">*</span>
              </label>
              <CompanyAutocomplete
                value={companyName}
                onChange={(val) => {
                  setCompanyName(val);
                  setErrors(prev => ({ ...prev, companyName: '' }));
                }}
                placeholder="Enter company name"
                className="sj-in"
              />
              {errors.companyName && <p className="sj-err">{errors.companyName}</p>}
            </div>

            {/* Notice Period */}
            <div className="sj-fld sj-full">
              <label className="sj-lb">Notice Period</label>
              <select
                className="sj-in"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
              >
                <option value="">Select notice period</option>
                {NOTICE_PERIODS.map(np => (
                  <option key={np} value={np}>{np}</option>
                ))}
              </select>
            </div>

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
                            Job title / Role <span className="sj-req">*</span>
                          </label>
                          <JobTitleAutocomplete
                            value={role.jobTitle}
                            onChange={(val) => handleRoleChange(idx, 'jobTitle', val)}
                            placeholder="Enter job title"
                            className="sj-in"
                          />
                        </div>

                        {/* Employment type */}
                        <div className="sj-fld sj-full">
                          <label className="sj-lb">
                            Employment type <span className="sj-req">*</span>
                          </label>
                          <select
                            className="sj-in"
                            value={role.employmentType}
                            onChange={(e) => handleRoleChange(idx, 'employmentType', e.target.value)}
                          >
                            {EMPLOYMENT_TYPES.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
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
                            <span>I currently work here</span>
                          </label>
                        </div>

                        {/* Joining date */}
                        <div className="sj-fld">
                          <label className="sj-lb">
                            Joining date <span className="sj-req">*</span>
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
                          <label className="sj-lb">Leaving date</label>
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
                          <label className="sj-lb">Roles &amp; responsibilities</label>
                          <textarea
                            rows={3}
                            className="sj-in"
                            style={{ minHeight: 88, paddingTop: 10 }}
                            placeholder="Briefly describe your roles & responsibilities"
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
