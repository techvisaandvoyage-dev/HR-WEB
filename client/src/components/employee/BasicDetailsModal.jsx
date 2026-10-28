import React, { useState, useEffect } from 'react';
import CountryCodeDropdown from '../common/CountryCodeDropdown';
import MultiSelectLocationDropdown from '../common/MultiSelectLocationDropdown';
import { currentLocationOptions } from '../../data/preferredLocations';
import { IconUser, IconClose } from './ProfileIcons';

const BasicDetailsModal = ({
  isOpen,
  onClose,
  formData,
  onSave,
  cmsConfig
}) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    countryCode: '+91',
    phone: '',
    email: '',
    location: '',
    brief: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && formData) {
      setForm({
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        countryCode: formData.countryCode || '+91',
        phone: formData.phone || '',
        email: formData.email || '',
        location: formData.location || '',
        brief: formData.brief || ''
      });
      setErrors({});
    }
  }, [isOpen, formData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (cmsConfig?.step1?.fields?.firstName?.isRequired !== false && !form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (cmsConfig?.step1?.fields?.lastName?.isRequired === true && !form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (cmsConfig?.step1?.fields?.phone?.isRequired !== false && !form.phone.trim()) newErrors.phone = 'Phone number is required';
    if (cmsConfig?.step1?.fields?.location?.isRequired !== false && !form.location) newErrors.location = 'Current location is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(form);
    onClose();
  };

  const locationOptions = (Array.isArray(cmsConfig?.step1?.locationCities) && cmsConfig.step1.locationCities.length > 0)
    ? cmsConfig.step1.locationCities
        .filter(c => c !== 'Anywhere in India' && c !== 'Anywhere in India/Multiple Locations')
        .map(loc => ({ label: loc, value: loc, displayName: loc }))
    : currentLocationOptions;
  const field = (key, label, placeholder = '') => ({
    label: cmsConfig?.step1?.fields?.[key]?.label || label,
    placeholder: cmsConfig?.step1?.fields?.[key]?.placeholder || placeholder,
    isRequired: cmsConfig?.step1?.fields?.[key]?.isRequired !== false
  });
  const firstName = field('firstName', 'First name', 'Enter first name');
  const lastName = field('lastName', 'Last name', 'Enter last name');
  const phone = field('phone', 'Phone number', 'Enter 10-digit mobile number');
  const email = field('email', 'Email (read only)');
  const location = field('location', 'Current location', 'Select Current Location');
  const brief = field('brief', 'Brief about yourself', 'Write a short introduction recruiters will see first...');

  return (
    <div className="sj-modal-backdrop" onClick={onClose}>
      <div className="sj-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sj-mh">
            <div className="flex items-center gap-3">
              <span className="sj-mi">
                <IconUser />
              </span>
              <div>
                <h3>Basic details</h3>
                <p>Keep your contact details up to date</p>
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
            <div className="sj-fld">
              <label className="sj-lb">
                {firstName.label} {firstName.isRequired && <span className="sj-req">*</span>}
              </label>
              <input
                type="text"
                className="sj-in"
                placeholder={firstName.placeholder}
                value={form.firstName}
                onChange={(e) => {
                  setForm({ ...form, firstName: e.target.value });
                  setErrors(prev => ({ ...prev, firstName: '' }));
                }}
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && <p className="sj-err">{errors.firstName}</p>}
            </div>

            <div className="sj-fld">
              <label className="sj-lb">
                {lastName.label} {lastName.isRequired && <span className="sj-req">*</span>}
              </label>
              <input
                type="text"
                className="sj-in"
                placeholder={lastName.placeholder}
                value={form.lastName}
                onChange={(e) => {
                  setForm({ ...form, lastName: e.target.value });
                  setErrors(prev => ({ ...prev, lastName: '' }));
                }}
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && <p className="sj-err">{errors.lastName}</p>}
            </div>

            <div className="sj-fld">
              <label className="sj-lb">
                {phone.label} {phone.isRequired && <span className="sj-req">*</span>}
              </label>
              <div className="flex">
                <CountryCodeDropdown
                  value={form.countryCode}
                  onChange={(code) => setForm({ ...form, countryCode: code })}
                />
                <input
                  type="text"
                  className="sj-in"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 0 }}
                  placeholder={phone.placeholder}
                  value={form.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm({ ...form, phone: val });
                    setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  aria-invalid={!!errors.phone}
                />
              </div>
              {errors.phone && <p className="sj-err">{errors.phone}</p>}
            </div>

            <div className="sj-fld">
              <label className="sj-lb">{email.label}</label>
              <input
                type="text"
                className="sj-in"
                value={form.email}
                disabled
                readOnly
              />
            </div>

            <div className="sj-fld sj-full">
              <label className="sj-lb">
                {location.label} {location.isRequired && <span className="sj-req">*</span>}
              </label>
              <MultiSelectLocationDropdown
                options={locationOptions}
                value={form.location}
                onChange={(val) => {
                  setForm({ ...form, location: val });
                  setErrors(prev => ({ ...prev, location: '' }));
                }}
                multiple={false}
                placeholder={location.placeholder}
                className="sj-in"
              />
              {errors.location && <p className="sj-err">{errors.location}</p>}
            </div>

            <div className="sj-fld sj-full">
              <label className="sj-lb">{brief.label}</label>
              <textarea
                rows={3}
                className="sj-in"
                style={{ minHeight: 90, paddingTop: 10 }}
                placeholder={brief.placeholder}
                value={form.brief}
                maxLength={600}
                onChange={(e) => setForm({ ...form, brief: e.target.value })}
              ></textarea>
              <div className="sj-hint">
                <span>{form.brief.length}</span>/600
              </div>
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
              Save details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BasicDetailsModal;
