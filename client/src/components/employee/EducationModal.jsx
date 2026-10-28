import React, { useState, useEffect } from 'react';
import InstituteAutocomplete from '../common/InstituteAutocomplete';
import JobTitleAutocomplete from '../common/JobTitleAutocomplete';
import { IconPlus, IconGraduationCap, IconTrash, IconClose } from './ProfileIcons';
import { DEFAULT_EDUCATION_DATA, DEFAULT_BOARD_OPTIONS } from './EmployeeOnboarding';

const EducationModal = ({
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
  for (let y = currentYear + 6; y >= currentYear - 45; y--) {
    years.push(String(y));
  }

  const [form, setForm] = useState({
    educationType: '',
    board: '',
    university: '',
    course: '',
    courseType: 'Full time',
    startYear: '',
    endYear: '',
    gradingSystem: 'Percentage',
    percentage: '',
    schoolMedium: '',
    isPrimary: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          educationType: initialData.educationType || '',
          board: initialData.board || '',
          university: initialData.university || '',
          course: initialData.course || '',
          courseType: initialData.courseType || 'Full time',
          startYear: initialData.startYear || '',
          endYear: initialData.endYear || '',
          gradingSystem: initialData.gradingSystem || 'Percentage',
          percentage: initialData.percentage || '',
          schoolMedium: initialData.schoolMedium || '',
          isPrimary: Boolean(initialData.isPrimary)
        });
      } else {
        setForm({
          educationType: '',
          board: '',
          university: '',
          course: '',
          courseType: 'Full time',
          startYear: '',
          endYear: '',
          gradingSystem: 'Percentage',
          percentage: '',
          schoolMedium: '',
          isPrimary: false
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEdit = editIndex >= 0;
  const educationData = cmsConfig?.step2?.educationData && Object.keys(cmsConfig.step2.educationData).length
    ? cmsConfig.step2.educationData : DEFAULT_EDUCATION_DATA;
  const currentEducationConfig = educationData[form.educationType];
  const isSchool = currentEducationConfig
    ? currentEducationConfig.category === 'school'
    : (form.educationType === '10th' || form.educationType === '12th');
  const fields = cmsConfig?.step2?.fields || {};
  const field = (key, label, placeholder = '') => ({
    label: fields[key]?.label || label,
    placeholder: fields[key]?.placeholder || placeholder,
    isRequired: fields[key]?.isRequired !== false
  });
  const educationTypes = Object.keys(educationData).length
    ? Object.keys(educationData) : ['Masters/Post-Graduation', 'Graduation/Diploma', 'Doctorate/PhD', '12th', '10th'];
  const selectedOptions = Array.isArray(currentEducationConfig?.options) ? currentEducationConfig.options : [];
  const selectOptions = selectedOptions.map(item => ({
    value: typeof item === 'string' ? item : (item.value || item.label),
    label: typeof item === 'string' ? item : (item.label || item.value),
    isGroupLabel: Boolean(item?.isGroupLabel)
  })).filter(item => item.value || item.isGroupLabel);
  const courseTypes = Array.isArray(cmsConfig?.step2?.courseTypeOptions) && cmsConfig.step2.courseTypeOptions.length
    ? cmsConfig.step2.courseTypeOptions : ['Full time', 'Part time', 'Distance learning'];
  const mediums = Array.isArray(cmsConfig?.step2?.mediumOptions) && cmsConfig.step2.mediumOptions.length
    ? cmsConfig.step2.mediumOptions : ['English', 'Hindi', 'Other'];
  const gradingSystems = Array.isArray(cmsConfig?.step2?.gradingSystems) && cmsConfig.step2.gradingSystems.length
    ? cmsConfig.step2.gradingSystems : ['Percentage', 'CGPA (10)', 'CGPA (4)', 'Grade'];
  const educationType = field('educationType', 'Education', 'Select education type');
  const university = field('university', 'University / Institute', 'Enter University / Institute');
  const course = field('course', 'Course', 'Enter course (e.g. B.Tech, MBA, B.Com, CA)');
  const courseType = field('courseType', 'Course type');
  const schoolMedium = field('schoolMedium', 'School medium', 'Select medium');
  const startYear = field('startYear', 'Starting year', 'Select year');
  const endYear = field('endYear', 'Passing out year', 'Select year');
  const gradingSystem = field('gradingSystem', 'Grading system', 'Select grading system');
  const percentage = field('percentage', 'Marks / Grade', 'Enter percentage or grade');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (cmsConfig?.step2?.fields?.educationType?.isRequired !== false && !form.educationType) newErrors.educationType = 'Select education type';
    if (isSchool) {
      if (!form.board.trim()) newErrors.board = 'Board is required';
      if (cmsConfig?.step2?.fields?.endYear?.isRequired !== false && !form.endYear) newErrors.endYear = 'Passing out year is required';
    } else {
      if (cmsConfig?.step2?.fields?.university?.isRequired !== false && !form.university.trim()) newErrors.university = 'University / Institute is required';
      if (cmsConfig?.step2?.fields?.course?.isRequired !== false && !form.course.trim()) newErrors.course = 'Course is required';
      if (cmsConfig?.step2?.fields?.startYear?.isRequired !== false && !form.startYear) newErrors.startYear = 'Starting year is required';
      if (cmsConfig?.step2?.fields?.endYear?.isRequired !== false && !form.endYear) newErrors.endYear = 'Passing out year is required';
      if (form.startYear && form.endYear && Number(form.endYear) < Number(form.startYear)) {
        newErrors.endYear = 'Must be after the starting year';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(form, editIndex);
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
                {isEdit ? <IconGraduationCap /> : <IconPlus />}
              </span>
              <div>
                <h3>{isEdit ? 'Edit education' : 'Add education'}</h3>
                <p>Help recruiters understand your academic background</p>
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
            {/* Education Type */}
            <div className="sj-fld sj-full">
              <label className="sj-lb">
                {educationType.label} {educationType.isRequired && <span className="sj-req">*</span>}
              </label>
              <select
                className="sj-in"
                value={form.educationType}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    educationType: val,
                    board: '',
                    university: '',
                    course: '',
                    course: val === '10th' ? 'Class X' : val === '12th' ? 'Class XII' : prev.course
                  }));
                  setErrors(prev => ({ ...prev, educationType: '' }));
                }}
                aria-invalid={!!errors.educationType}
              >
                <option value="">{educationType.placeholder}</option>
                {educationTypes.map(item => { const value = typeof item === 'string' ? item : (item.value || item.label); const label = typeof item === 'string' ? item : (item.label || item.value); return <option key={value} value={value}>{label}</option>; })}
              </select>
              {errors.educationType && <p className="sj-err">{errors.educationType}</p>}
            </div>

            {/* School vs Higher Edu */}
            {isSchool ? (
              <>
                <div className="sj-fld sj-full">
                  <label className="sj-lb">
                    Board <span className="sj-req">*</span>
                  </label>
                  <select
                    className="sj-in"
                    value={form.board}
                    onChange={(e) => {
                      setForm({ ...form, board: e.target.value });
                      setErrors(prev => ({ ...prev, board: '' }));
                    }}
                    aria-invalid={!!errors.board}
                  >
                    <option value="">Select board</option>
                    {(selectOptions.length ? selectOptions : DEFAULT_BOARD_OPTIONS).map(item => item.isGroupLabel ? (
                      <option key={item.label} value="" disabled>{item.label}</option>
                    ) : <option key={item.value || item.label} value={item.value || item.label}>{item.label || item.value}</option>)}
                  </select>
                  {errors.board && <p className="sj-err">{errors.board}</p>}
                </div>

                <div className="sj-fld">
                  <label className="sj-lb">
                    {endYear.label} {endYear.isRequired && <span className="sj-req">*</span>}
                  </label>
                  <select
                    className="sj-in"
                    value={form.endYear}
                    onChange={(e) => {
                      setForm({ ...form, endYear: e.target.value });
                      setErrors(prev => ({ ...prev, endYear: '' }));
                    }}
                    aria-invalid={!!errors.endYear}
                  >
                    <option value="">{endYear.placeholder}</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.endYear && <p className="sj-err">{errors.endYear}</p>}
                </div>

                <div className="sj-fld">
                  <label className="sj-lb">{schoolMedium.label}</label>
                  <select
                    className="sj-in"
                    value={form.schoolMedium}
                    onChange={(e) => setForm({ ...form, schoolMedium: e.target.value })}
                  >
                    <option value="">{schoolMedium.placeholder}</option>
                    {mediums.map(item => { const value = typeof item === 'string' ? item : (item.value || item.label); const label = typeof item === 'string' ? item : (item.label || item.value); return <option key={value} value={value}>{label}</option>; })}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="sj-fld sj-full">
                  <label className="sj-lb">
                    {university.label} {university.isRequired && <span className="sj-req">*</span>}
                  </label>
                  <InstituteAutocomplete
                    value={form.university}
                    onChange={(val) => {
                      setForm({ ...form, university: val });
                      setErrors(prev => ({ ...prev, university: '' }));
                    }}
                    placeholder={university.placeholder}
                    className="sj-in"
                  />
                  {errors.university && <p className="sj-err">{errors.university}</p>}
                </div>

                <div className="sj-fld sj-full">
                  <label className="sj-lb">
                    {course.label} {course.isRequired && <span className="sj-req">*</span>}
                  </label>
                  <select
                    className="sj-in"
                    value={form.course}
                    onChange={(e) => {
                      setForm({ ...form, course: e.target.value });
                      setErrors(prev => ({ ...prev, course: '' }));
                    }}
                  >
                    <option value="">{course.placeholder}</option>
                    {selectOptions.map(item => item.isGroupLabel ? (
                      <option key={item.label} value="" disabled>{item.label}</option>
                    ) : <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  {errors.course && <p className="sj-err">{errors.course}</p>}
                </div>

                <div className="sj-fld sj-full">
                  <span className="sj-lb">{courseType.label}</span>
                  <div className="sj-rad">
                    {courseTypes.map(item => { const ct = typeof item === 'string' ? item : (item.value || item.label); const label = typeof item === 'string' ? item : (item.label || item.value); return (
                      <label
                        key={ct}
                        className={`sj-rad-label ${form.courseType === ct ? 'sj-on' : ''}`}
                        onClick={() => setForm({ ...form, courseType: ct })}
                      >
                        <span className="sj-rad-indicator">
                          {form.courseType === ct && <span className="sj-rad-dot" />}
                        </span>
                        <span>{label}</span>
                      </label>
                    ); })}
                  </div>
                </div>

                <div className="sj-fld">
                  <label className="sj-lb">
                    {startYear.label} {startYear.isRequired && <span className="sj-req">*</span>}
                  </label>
                  <select
                    className="sj-in"
                    value={form.startYear}
                    onChange={(e) => {
                      setForm({ ...form, startYear: e.target.value });
                      setErrors(prev => ({ ...prev, startYear: '' }));
                    }}
                    aria-invalid={!!errors.startYear}
                  >
                    <option value="">{startYear.placeholder}</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.startYear && <p className="sj-err">{errors.startYear}</p>}
                </div>

                <div className="sj-fld">
                  <label className="sj-lb">
                    {endYear.label} {endYear.isRequired && <span className="sj-req">*</span>}
                  </label>
                  <select
                    className="sj-in"
                    value={form.endYear}
                    onChange={(e) => {
                      setForm({ ...form, endYear: e.target.value });
                      setErrors(prev => ({ ...prev, endYear: '' }));
                    }}
                    aria-invalid={!!errors.endYear}
                  >
                    <option value="">{endYear.placeholder}</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.endYear && <p className="sj-err">{errors.endYear}</p>}
                </div>
              </>
            )}

            {/* Grading System & Score */}
            <div className="sj-fld">
              <label className="sj-lb">{gradingSystem.label}</label>
              <select
                className="sj-in"
                value={form.gradingSystem}
                onChange={(e) => setForm({ ...form, gradingSystem: e.target.value })}
              >
                {gradingSystems.map(item => { const value = typeof item === 'string' ? item : (item.value || item.label); const label = typeof item === 'string' ? item : (item.label || item.value); return <option key={value} value={value}>{label}</option>; })}
              </select>
            </div>

            <div className="sj-fld">
              <label className="sj-lb">{percentage.label}</label>
              <input
                type="text"
                className="sj-in"
                placeholder={percentage.placeholder || (form.gradingSystem === 'Percentage' ? 'e.g. 78.5' : 'e.g. 8.4')}
                value={form.percentage}
                onChange={(e) => setForm({ ...form, percentage: e.target.value })}
              />
            </div>

            {/* Primary Education checkbox */}
            <div className="sj-fld sj-full">
              <label className="sj-chk-wrap">
                <input
                  type="checkbox"
                  className="sj-chk"
                  checked={form.isPrimary}
                  onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                />
                <span>Mark this as my primary education</span>
              </label>
            </div>
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

export default EducationModal;
