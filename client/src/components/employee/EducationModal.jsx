import React, { useState, useEffect } from 'react';
import InstituteAutocomplete from '../common/InstituteAutocomplete';
import JobTitleAutocomplete from '../common/JobTitleAutocomplete';
import { IconPlus, IconGraduationCap, IconTrash, IconClose } from './ProfileIcons';

const EducationModal = ({
  isOpen,
  onClose,
  initialData,
  editIndex,
  onSave,
  onDelete
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
  const isSchool = form.educationType === '10th' || form.educationType === '12th';

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.educationType) newErrors.educationType = 'Select education type';
    if (isSchool) {
      if (!form.board.trim()) newErrors.board = 'Board is required';
      if (!form.endYear) newErrors.endYear = 'Passing out year is required';
    } else {
      if (!form.university.trim()) newErrors.university = 'University / Institute is required';
      if (!form.course.trim()) newErrors.course = 'Course is required';
      if (!form.startYear) newErrors.startYear = 'Starting year is required';
      if (!form.endYear) newErrors.endYear = 'Passing out year is required';
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
                Education <span className="sj-req">*</span>
              </label>
              <select
                className="sj-in"
                value={form.educationType}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    educationType: val,
                    course: val === '10th' ? 'Class X' : val === '12th' ? 'Class XII' : prev.course
                  }));
                  setErrors(prev => ({ ...prev, educationType: '' }));
                }}
                aria-invalid={!!errors.educationType}
              >
                <option value="">Select education type</option>
                <option value="Masters/Post-Graduation">Masters/Post-Graduation</option>
                <option value="Graduation/Diploma">Graduation/Diploma</option>
                <option value="Doctorate/PhD">Doctorate/PhD</option>
                <option value="12th">12th</option>
                <option value="10th">10th</option>
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
                  <input
                    type="text"
                    className="sj-in"
                    placeholder="Enter board name (e.g. CBSE, ICSE, State Board)"
                    value={form.board}
                    onChange={(e) => {
                      setForm({ ...form, board: e.target.value });
                      setErrors(prev => ({ ...prev, board: '' }));
                    }}
                    aria-invalid={!!errors.board}
                  />
                  {errors.board && <p className="sj-err">{errors.board}</p>}
                </div>

                <div className="sj-fld">
                  <label className="sj-lb">
                    Passing out year <span className="sj-req">*</span>
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
                    <option value="">Select year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.endYear && <p className="sj-err">{errors.endYear}</p>}
                </div>

                <div className="sj-fld">
                  <label className="sj-lb">School medium</label>
                  <select
                    className="sj-in"
                    value={form.schoolMedium}
                    onChange={(e) => setForm({ ...form, schoolMedium: e.target.value })}
                  >
                    <option value="">Select medium</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="sj-fld sj-full">
                  <label className="sj-lb">
                    University / Institute <span className="sj-req">*</span>
                  </label>
                  <InstituteAutocomplete
                    value={form.university}
                    onChange={(val) => {
                      setForm({ ...form, university: val });
                      setErrors(prev => ({ ...prev, university: '' }));
                    }}
                    placeholder="Enter University / Institute"
                    className="sj-in"
                  />
                  {errors.university && <p className="sj-err">{errors.university}</p>}
                </div>

                <div className="sj-fld sj-full">
                  <label className="sj-lb">
                    Course <span className="sj-req">*</span>
                  </label>
                  <JobTitleAutocomplete
                    value={form.course}
                    onChange={(val) => {
                      setForm({ ...form, course: val });
                      setErrors(prev => ({ ...prev, course: '' }));
                    }}
                    placeholder="Enter course (e.g. B.Tech, MBA, B.Com, CA)"
                    className="sj-in"
                  />
                  {errors.course && <p className="sj-err">{errors.course}</p>}
                </div>

                <div className="sj-fld sj-full">
                  <span className="sj-lb">Course type</span>
                  <div className="sj-rad">
                    {['Full time', 'Part time', 'Distance learning'].map(ct => (
                      <label
                        key={ct}
                        className={`sj-rad-label ${form.courseType === ct ? 'sj-on' : ''}`}
                        onClick={() => setForm({ ...form, courseType: ct })}
                      >
                        <span className="sj-rad-indicator">
                          {form.courseType === ct && <span className="sj-rad-dot" />}
                        </span>
                        <span>{ct}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="sj-fld">
                  <label className="sj-lb">
                    Starting year <span className="sj-req">*</span>
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
                    <option value="">Select year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.startYear && <p className="sj-err">{errors.startYear}</p>}
                </div>

                <div className="sj-fld">
                  <label className="sj-lb">
                    Passing out year <span className="sj-req">*</span>
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
                    <option value="">Select year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.endYear && <p className="sj-err">{errors.endYear}</p>}
                </div>
              </>
            )}

            {/* Grading System & Score */}
            <div className="sj-fld">
              <label className="sj-lb">Grading system</label>
              <select
                className="sj-in"
                value={form.gradingSystem}
                onChange={(e) => setForm({ ...form, gradingSystem: e.target.value })}
              >
                <option value="Percentage">Percentage</option>
                <option value="CGPA (10)">CGPA (10 Point Scale)</option>
                <option value="CGPA (4)">CGPA (4 Point Scale)</option>
                <option value="Grade">Grade</option>
              </select>
            </div>

            <div className="sj-fld">
              <label className="sj-lb">Marks / Grade</label>
              <input
                type="text"
                className="sj-in"
                placeholder={form.gradingSystem === 'Percentage' ? 'e.g. 78.5' : 'e.g. 8.4'}
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
