import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import MultiSelectLocationDropdown from '../../common/MultiSelectLocationDropdown';
import { currentLocationOptions } from '../../../data/preferredLocations';
import { uploadFileToStorage, deleteFileFromStorage } from '../../../utils/firebaseStorage';
import { COUNTRY_CODES, formatPhoneWithCountryCode } from '../../../data/countryCodes';

const CompanyProfileTab = ({ portalConfig, employerProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const storedTab = localStorage.getItem('employer_profile_active_tab');
  const initialTab = (tabFromUrl === 'company' || tabFromUrl === 'account')
    ? tabFromUrl
    : (storedTab === 'company' || storedTab === 'account' ? storedTab : 'account');

  const [activeTab, setActiveTabState] = useState(initialTab);
  const [editingField, setEditingField] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleTabChange = (tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
    localStorage.setItem('employer_profile_active_tab', tab);
  };

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab && (tabFromUrl === 'company' || tabFromUrl === 'account')) {
      setActiveTabState(tabFromUrl);
    }
  }, [tabFromUrl]);

  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    accountType: 'Company/business'
  });
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const countryDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountryObj = useMemo(() => {
    return COUNTRY_CODES.find(c => c.code === (accountData.countryCode || '+91')) || COUNTRY_CODES[0];
  }, [accountData.countryCode]);

  const filteredCountryCodes = useMemo(() => {
    return COUNTRY_CODES.filter(c => 
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
      c.code.includes(countrySearch)
    );
  }, [countrySearch]);

  const [companyData, setCompanyData] = useState({
    hiringFor: 'your_company',
    isConsultant: false,
    companyName: '',
    companyLogo: '',
    industry: '',
    employees: '',
    designation: '',
    location: '',
    about: '',
    website: ''
  });

  const [cmsHiringForOptions, setCmsHiringForOptions] = useState([]);
  const [cmsHiringForLabel, setCmsHiringForLabel] = useState('Hiring for');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const isConsultant = Boolean(employerProfile?.isConsultant === true || companyData?.isConsultant === true);

  // Fetch Homepage CMS config to dynamically read Hiring For options and label
  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data) {
          const regConfig = (isConsultant && data.data.consultantRegister && Object.keys(data.data.consultantRegister).length > 0)
            ? data.data.consultantRegister
            : data.data.employerRegister;

          if (regConfig?.hiringForLabel) {
            setCmsHiringForLabel(regConfig.hiringForLabel);
          }

          const rawOptions = (regConfig?.hiringForOptions && regConfig.hiringForOptions.length > 0)
            ? regConfig.hiringForOptions
            : (regConfig?.step2?.hiringForOptions && regConfig.step2.hiringForOptions.length > 0)
              ? regConfig.step2.hiringForOptions
              : null;

          if (rawOptions && Array.isArray(rawOptions) && rawOptions.length > 0) {
            const formatted = rawOptions.map(opt => {
              if (typeof opt === 'string') return { value: opt, label: opt };
              return {
                value: opt.value || opt.id || opt.label,
                label: opt.label || opt.value || opt.id
              };
            });
            setCmsHiringForOptions(formatted);
          }
        }
      } catch (err) {
        console.error('Error fetching CMS config in CompanyProfileTab:', err);
      }
    };

    fetchCmsConfig();
  }, [isConsultant]);

  const getHiringForDisplayLabel = (value) => {
    if (!value) return 'N/A';
    const match = cmsHiringForOptions.find(opt => 
      String(opt.value || '').trim().toLowerCase() === String(value).trim().toLowerCase() ||
      String(opt.id || '').trim().toLowerCase() === String(value).trim().toLowerCase() ||
      String(opt.label || '').trim().toLowerCase() === String(value).trim().toLowerCase()
    );
    if (match) return match.label;

    if (value === 'your_company') return 'Company Business';
    if (value === 'consultant') return 'Individual  Proprietor';

    return value;
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      if (!token) return;
      const response = await fetch(`${apiUrl}/api/employer/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const emp = data.data;

        let rawMobile = String(emp.mobile || '').trim();
        let detectedCode = emp.countryCode || '+91';

        if (rawMobile.startsWith('+')) {
          const matched = COUNTRY_CODES.find(c => rawMobile.startsWith(c.code));
          if (matched) {
            detectedCode = matched.code;
            rawMobile = rawMobile.slice(matched.code.length).trim();
          }
        }
        const digitsOnly = rawMobile.replace(/\D/g, '').slice(0, 10);

        setAccountData({
          name: emp.fullName || '',
          email: emp.email || '',
          phone: digitsOnly,
          countryCode: detectedCode,
          accountType: emp.accountType || 'Company/business'
        });
        setCompanyData({
          hiringFor: emp.hiringFor || 'your_company',
          isConsultant: Boolean(emp.isConsultant === true),
          companyName: emp.companyName || '',
          companyLogo: emp.companyLogo || '',
          industry: emp.industry || '',
          employees: emp.employees || '',
          designation: emp.designation || '',
          location: emp.location || '',
          about: emp.aboutCompany || '',
          website: emp.website || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEdit = (field) => setEditingField(field);
  
  const handleSaveField = async () => {
    if (editingField === 'account.phone' && accountData.phone && accountData.phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      return;
    }
    setPhoneError('');
    setEditingField(null);
    await handleSaveAll(false);
  };

  const handleSaveAll = async (showAlert = true) => {
    if (accountData.phone && accountData.phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      if (showAlert) alert('Phone number must be exactly 10 digits.');
      return;
    }
    setPhoneError('');

    try {
      const token = localStorage.getItem('employerToken');
      if (!token) return;

      const formattedMobile = accountData.phone 
        ? `${accountData.countryCode || '+91'} ${accountData.phone}`.trim() 
        : '';

      const payload = {
        fullName: accountData.name,
        mobile: formattedMobile,
        countryCode: accountData.countryCode || '+91',
        companyName: companyData.companyName,
        companyLogo: companyData.companyLogo,
        industry: companyData.industry,
        employees: companyData.employees,
        designation: companyData.designation,
        location: companyData.location,
        aboutCompany: companyData.about,
        website: companyData.website,
        hiringFor: isConsultant ? 'consultant' : 'employer'
      };
      
      const response = await fetch(`${apiUrl}/api/employer/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setEditingField(null);
        if (showAlert) {
          showToast('Profile updated successfully!');
        }
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (showAlert) alert('Failed to update profile: ' + (error.message || 'Please try again.'));
    }
  };

  const convertImageToBase64 = (file, maxWidth = 500, maxHeight = 500) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      setUploadProgress(0);

      let finalLogoUrl = '';

      // Try uploading to Firebase Storage first
      try {
        finalLogoUrl = await uploadFileToStorage(file, 'employer_logos', (progress) => {
          setUploadProgress(progress);
        });
      } catch (firebaseErr) {
        console.warn('Firebase storage upload failed, falling back to optimized direct upload:', firebaseErr);
        // Fallback: Convert to compressed Base64 data URL
        finalLogoUrl = await convertImageToBase64(file);
      }

      if (!finalLogoUrl) {
        throw new Error('Could not process image file');
      }

      setCompanyData(prev => ({ ...prev, companyLogo: finalLogoUrl }));

      // Immediately persist logo update to backend database
      const token = localStorage.getItem('employerToken');
      if (token) {
        const res = await fetch(`${apiUrl}/api/employer/auth/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ companyLogo: finalLogoUrl })
        });
        const resData = await res.json();
        if (!resData.success) {
          throw new Error(resData.message || 'Failed to save logo to database');
        }
      }

      showToast('Logo uploaded and saved successfully!');
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo: ' + (err.message || 'Please try again'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the company logo?')) return;
    try {
      const oldUrl = companyData.companyLogo;
      setCompanyData(prev => ({ ...prev, companyLogo: '' }));
      const token = localStorage.getItem('employerToken');
      if (token) {
        await fetch(`${apiUrl}/api/employer/auth/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ companyLogo: '' })
        });
      }
      if (oldUrl) {
        deleteFileFromStorage(oldUrl);
      }
      showToast('Logo removed successfully.');
    } catch (err) {
      console.error('Error removing logo:', err);
    }
  };

  const handleChange = (section, field, value) => {
    if (section === 'account') {
      setAccountData(prev => ({ ...prev, [field]: value }));
    } else {
      setCompanyData(prev => ({ ...prev, [field]: value }));
    }
  };

  const renderRow = (section, field, label, value, type = 'text', isEditable = true) => {
    const isEditing = editingField === `${section}.${field}`;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr_auto] gap-2 sm:gap-4 items-center py-4 border-b border-[#eaecf0] min-h-[64px]">
        <label className="text-[#667085] font-medium text-[14px] sm:w-[190px]">{label}</label>
        <div className="min-w-0">
          {isEditing ? (
            type === 'textarea' ? (
              <textarea 
                value={value}
                onChange={(e) => handleChange(section, field, e.target.value)}
                className="w-full max-w-[420px] px-3 py-2 border border-[#16a34a] rounded-[8px] text-[14px] text-[#101828] focus:outline-none ring-2 ring-[#ecfdf3] resize-none"
                rows="3"
                autoFocus
              />
            ) : type === 'select-industry' ? (
              <select value={value} onChange={(e) => handleChange(section, field, e.target.value)} className="w-full max-w-[360px] px-3 py-2 border border-[#16a34a] rounded-[8px] text-[14px] text-[#101828] focus:outline-none ring-2 ring-[#ecfdf3] bg-white cursor-pointer font-medium">
                <option>Information Technology</option><option>Finance</option><option>Healthcare</option><option>Manufacturing</option><option>Education</option><option>Other</option>
              </select>
            ) : type === 'select-employees' ? (
              <select value={value} onChange={(e) => handleChange(section, field, e.target.value)} className="w-full max-w-[360px] px-3 py-2 border border-[#16a34a] rounded-[8px] text-[14px] text-[#101828] focus:outline-none ring-2 ring-[#ecfdf3] bg-white cursor-pointer font-medium">
                <option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option><option>1000+</option>
              </select>
            ) : type === 'select-designation' ? (
              <select value={value} onChange={(e) => handleChange(section, field, e.target.value)} className="w-full max-w-[360px] px-3 py-2 border border-[#16a34a] rounded-[8px] text-[14px] text-[#101828] focus:outline-none ring-2 ring-[#ecfdf3] bg-white cursor-pointer font-medium">
                <option>HR Manager</option><option>Recruiter</option><option>Talent Acquisition</option><option>Founder / CEO</option><option>Director</option><option>Other</option>
              </select>
            ) : type === 'location' ? (
              <MultiSelectLocationDropdown 
                options={currentLocationOptions} 
                value={value} 
                onChange={(val) => handleChange(section, field, val)} 
                multiple={false} 
                className="w-full max-w-[360px] px-3 py-2 border border-[#16a34a] rounded-[8px] text-[14px] text-[#101828] focus:outline-none ring-2 ring-[#ecfdf3]" 
                placeholder="Select location" 
              />
            ) : field === 'phone' ? (
              <div className="space-y-1.5">
                <div className={`flex items-center w-full max-w-[380px] bg-white border rounded-[8px] px-3 py-2 ring-2 relative transition-all ${phoneError ? 'border-red-500 ring-red-100' : 'border-[#16a34a] ring-[#ecfdf3]'}`}>
                  {/* Custom Country Code Dropdown Trigger */}
                  <div className="relative shrink-0" ref={countryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="flex items-center gap-1.5 text-gray-900 font-bold border-none outline-none cursor-pointer pr-2 text-[14px] hover:text-[#16a34a] transition-colors"
                    >
                      <span className="text-base leading-none">{selectedCountryObj.flag}</span>
                      <span>{selectedCountryObj.code}</span>
                      <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu Popup */}
                    {isCountryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Search Box */}
                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search country or code..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-[#16a34a] text-gray-900"
                            autoFocus
                          />
                        </div>

                        {/* Scrollable Country List */}
                        <div className="max-h-52 overflow-y-auto py-1">
                          {filteredCountryCodes.length === 0 ? (
                            <div className="p-3 text-xs text-center text-gray-400 font-medium">No country found</div>
                          ) : (
                            filteredCountryCodes.map((c, idx) => (
                              <button
                                key={`${c.country}-${c.code}-${idx}`}
                                type="button"
                                onClick={() => {
                                  setAccountData(prev => ({ ...prev, countryCode: c.code }));
                                  setIsCountryDropdownOpen(false);
                                  setCountrySearch('');
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-[#ecfdf3] transition-colors ${c.code === (accountData.countryCode || '+91') ? 'bg-[#ecfdf3] font-bold text-[#15803d]' : 'text-gray-700'}`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-base leading-none">{c.flag}</span>
                                  <span className="truncate">{c.name}</span>
                                </div>
                                <span className="font-semibold text-gray-400 shrink-0 ml-2">{c.code}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-gray-300 mr-2.5 shrink-0">|</span>

                  {/* 10-Digit Mobile Input */}
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={accountData.phone} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) {
                        setAccountData(prev => ({ ...prev, phone: val }));
                      }
                      if (phoneError) setPhoneError('');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveField(); }}
                    placeholder="10-digit mobile number"
                    className="w-full border-none outline-none text-[14px] text-[#101828] bg-transparent font-medium"
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="text-red-500 text-xs font-semibold pl-1">{phoneError}</p>
                )}
              </div>
            ) : (
              <input 
                type={type} 
                value={value} 
                onChange={(e) => handleChange(section, field, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveField(); }}
                className="w-full max-w-[360px] px-3 py-2 border border-[#16a34a] rounded-[8px] text-[14px] text-[#101828] focus:outline-none ring-2 ring-[#ecfdf3]"
                autoFocus
              />
            )
          ) : (
            <span className={`text-[14.5px] font-medium ${field === 'website' ? 'text-[#16a34a] hover:underline' : 'text-[#101828]'} ${type === 'textarea' ? 'block max-w-md break-words' : 'truncate block'}`}>
              {field === 'phone' ? (
                accountData.phone ? (
                  <span className="font-mono">
                    {accountData.countryCode || '+91'} {accountData.phone}
                  </span>
                ) : '—'
              ) : (value || '—')}
            </span>
          )}
        </div>
        <div className="justify-self-end">
          {isEditable && (
            isEditing ? (
              <button 
                type="button"
                onClick={handleSaveField} 
                className="text-[13.5px] font-semibold text-[#15803d] hover:bg-[#ecfdf3] px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer"
              >
                Done
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => handleEdit(`${section}.${field}`)} 
                className="text-[13.5px] font-semibold text-[#15803d] hover:bg-[#ecfdf3] px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer"
              >
                Edit
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  const pageTitle = isConsultant 
    ? (portalConfig?.consultantTitle || 'Consultant profile')
    : (portalConfig?.title || 'Company profile');

  const pageSubtitle = isConsultant
    ? (portalConfig?.consultantSubtitle || 'Manage your consultant profile, staffing details and branding.')
    : (portalConfig?.subtitle || 'Manage your company information, branding and details.');

  return (
    <div className="max-w-[760px] animate-in fade-in duration-150 pb-16">
      
      {/* Top Title */}
      <div className="mb-7">
        <h1 className="text-[26px] sm:text-[28px] font-bold text-[#101828] tracking-[-0.025em] leading-[1.2]">
          {pageTitle}
        </h1>
        <p className="text-[#667085] text-[14px] mt-1">
          {pageSubtitle}
        </p>
      </div>

      {/* Underline Tabs */}
      <div className="flex gap-6 border-b border-[#eaecf0] mb-7">
        <button 
          type="button"
          onClick={() => handleTabChange('account')}
          className={`pb-3 text-[14.5px] font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'account' ? 'border-[#16a34a] text-[#15803d]' : 'border-transparent text-[#667085] hover:text-[#101828]'}`}
        >
          {portalConfig?.accountTabLabel || 'Account details'}
        </button>
        <button 
          type="button"
          onClick={() => handleTabChange('company')}
          className={`pb-3 text-[14.5px] font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'company' ? 'border-[#16a34a] text-[#15803d]' : 'border-transparent text-[#667085] hover:text-[#101828]'}`}
        >
          {isConsultant ? (portalConfig?.consultantTabLabel || 'Consultant details') : (portalConfig?.companyTabLabel || 'Company details')}
        </button>
      </div>

      {/* Account Details Tab */}
      {activeTab === 'account' && (
        <div className="space-y-1">
          <div className="mb-2">
            <h2 className="text-[18px] font-bold text-[#101828] tracking-[-0.01em]">Personal info</h2>
            <p className="text-[#667085] text-[13.5px] mt-0.5">Your name or role may be visible to jobseekers and your team.</p>
          </div>

          <div className="border-t border-[#eaecf0]">
            {renderRow('account', 'name', 'Name', accountData.name)}
            {renderRow('account', 'email', 'Email', accountData.email, 'email', false)}
            {renderRow('account', 'phone', 'Phone', accountData.phone, 'tel')}
          </div>
        </div>
      )}

      {/* Company Details Tab */}
      {activeTab === 'company' && (
        <div className="space-y-1">
          <div className="mb-2">
            <h2 className="text-[18px] font-bold text-[#101828] tracking-[-0.01em]">
              {isConsultant ? (portalConfig?.consultantDetailsTitle || 'Consultant details') : (portalConfig?.companyDetailsTitle || 'Company details')}
            </h2>
            <p className="text-[#667085] text-[13.5px] mt-0.5">
              {isConsultant 
                ? (portalConfig?.consultantDetailsSubtitle || 'Manage your consultant information, staffing details and branding.') 
                : (portalConfig?.companyDetailsSubtitle || 'Manage your company information and branding.')}
            </p>
          </div>

          <div className="border-t border-[#eaecf0]">
            {/* Company Logo Row */}
            <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr_auto] gap-2 sm:gap-4 items-center py-4 border-b border-[#eaecf0] min-h-[68px]">
              <label className="text-[#667085] font-medium text-[14px]">Company logo</label>
              <div className="flex items-center gap-3.5">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleLogoFileChange} 
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml" 
                  className="hidden" 
                />
                
                {companyData.companyLogo ? (
                  <div className="w-12 h-12 rounded-[10px] border border-[#eaecf0] bg-white flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={companyData.companyLogo} 
                      alt={companyData.companyName || 'Company logo'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-[10px] bg-[#16a34a] text-white flex items-center justify-center text-[20px] font-bold uppercase shrink-0">
                    {(companyData.companyName || accountData.name || 'C').charAt(0)}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {uploadingLogo ? (
                    <span className="text-[13.5px] font-semibold text-[#15803d]">
                      Uploading {uploadProgress > 0 ? `${uploadProgress}%` : '...'}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-[#d0d5dd] rounded-[8px] px-3.5 py-1.5 text-[13.5px] font-semibold text-[#101828] hover:bg-[#f9fafb] transition-colors cursor-pointer"
                      >
                        {companyData.companyLogo ? 'Change logo' : 'Upload new logo'}
                      </button>
                      {companyData.companyLogo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="text-[13px] font-semibold text-[#d92d20] hover:bg-red-50 px-2 py-1 rounded-[6px] transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <span className="hidden sm:inline"></span>
            </div>

            {/* Hiring for (read-only) */}
            <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr_auto] gap-2 sm:gap-4 items-center py-4 border-b border-[#eaecf0] min-h-[64px]">
              <label className="text-[#667085] font-medium text-[14px]">Hiring for</label>
              <span className="text-[14.5px] font-medium text-[#101828]">
                {isConsultant ? 'Consultant' : 'Employer'}
              </span>
              <span className="hidden sm:inline"></span>
            </div>

            {renderRow('company', 'companyName', 'Company name', companyData.companyName)}
            {renderRow('company', 'industry', 'Industry', companyData.industry, 'select-industry')}
            {renderRow('company', 'employees', 'Number of employees', companyData.employees, 'select-employees')}
            {renderRow('company', 'designation', 'Designation', companyData.designation, 'select-designation')}
            {renderRow('company', 'location', 'Location', companyData.location, 'location')}
            {renderRow('company', 'about', 'About company', companyData.about, 'textarea')}
            {renderRow('company', 'website', 'Website link', companyData.website, 'url')}
          </div>
        </div>
      )}

      {/* Save changes button below the content */}
      <div className="mt-8 flex items-center gap-3">
        <button 
          type="button"
          onClick={() => handleSaveAll(true)} 
          className="inline-flex items-center gap-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-[14px] px-5 py-2.5 rounded-[8px] transition-colors shadow-none cursor-pointer"
        >
          Save changes
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101828] text-white px-4 py-2.5 rounded-[10px] font-semibold text-[13.5px] shadow-lg animate-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

    </div>
  );
};

export default CompanyProfileTab;
