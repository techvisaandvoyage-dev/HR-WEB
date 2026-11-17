import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MultiSelectLocationDropdown from '../../common/MultiSelectLocationDropdown';
import CustomDropdown from '../../common/CustomDropdown';
import { currentLocationOptions } from '../../../data/preferredLocations';
import { uploadFileToStorage, deleteFileFromStorage } from '../../../utils/firebaseStorage';
import { COUNTRY_CODES } from '../../../data/countryCodes';
import VerificationPage from './VerificationPage';

const CompanyProfileTab = ({ portalConfig, employerProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const resolvedInitialTab = (tabFromUrl === 'verification' || tabFromUrl === 'company' || tabFromUrl === 'account')
    ? tabFromUrl
    : 'account';

  const [activeTab, setActiveTabState] = useState(resolvedInitialTab);
  const fileInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleTabChange = (tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
    localStorage.setItem('employer_profile_active_tab', tab);
  };

  useEffect(() => {
    if (tabFromUrl && (tabFromUrl === 'verification' || tabFromUrl === 'company' || tabFromUrl === 'account')) {
      setActiveTabState(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTabState('account');
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

  const [verificationStatus, setVerificationStatus] = useState(
    employerProfile?.verification?.status || 'unverified'
  );

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const isConsultant = Boolean(employerProfile?.isConsultant === true || companyData?.isConsultant === true);

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
          accountType: emp.accountType || (emp.isConsultant ? 'Consultant' : 'Company/business')
        });

        setCompanyData({
          hiringFor: emp.hiringFor || (emp.isConsultant ? 'consultant' : 'your_company'),
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

        if (emp.verification?.status) {
          setVerificationStatus(emp.verification.status);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveAccount = async (e) => {
    if (e) e.preventDefault();

    if (accountData.phone && accountData.phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      return;
    }
    setPhoneError('');

    try {
      setSavingAccount(true);
      const token = localStorage.getItem('employerToken');
      if (!token) return;

      const formattedMobile = accountData.phone 
        ? `${accountData.countryCode || '+91'} ${accountData.phone}`.trim() 
        : '';

      const payload = {
        fullName: accountData.name,
        mobile: formattedMobile,
        countryCode: accountData.countryCode || '+91'
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
        showToast('Personal account details updated successfully!');
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          empInfo.fullName = accountData.name;
          empInfo.mobile = formattedMobile;
          empInfo.countryCode = accountData.countryCode || '+91';
          localStorage.setItem('employerInfo', JSON.stringify(empInfo));
          window.dispatchEvent(new Event('employer-profile-updated'));
        } catch (_) {}
      } else {
        throw new Error(data.message || 'Failed to update account details');
      }
    } catch (err) {
      console.error('Error updating account:', err);
      alert('Failed to update account: ' + (err.message || 'Please try again.'));
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveCompany = async (e) => {
    if (e) e.preventDefault();

    try {
      setSavingCompany(true);
      const token = localStorage.getItem('employerToken');
      if (!token) return;

      const payload = {
        companyName: companyData.companyName,
        companyLogo: companyData.companyLogo,
        industry: companyData.industry,
        employees: companyData.employees,
        designation: companyData.designation,
        location: companyData.location,
        aboutCompany: companyData.about,
        website: companyData.website
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
        showToast(`${isConsultant ? 'Consultant' : 'Company'} details updated successfully!`);
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          empInfo.companyName = companyData.companyName;
          empInfo.companyLogo = companyData.companyLogo;
          empInfo.industry = companyData.industry;
          empInfo.location = companyData.location;
          empInfo.website = companyData.website;
          localStorage.setItem('employerInfo', JSON.stringify(empInfo));
          window.dispatchEvent(new Event('employer-profile-updated'));
        } catch (_) {}
      } else {
        throw new Error(data.message || 'Failed to update company details');
      }
    } catch (err) {
      console.error('Error updating company profile:', err);
      alert('Failed to update: ' + (err.message || 'Please try again.'));
    } finally {
      setSavingCompany(false);
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
          resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.9));
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

      try {
        finalLogoUrl = await uploadFileToStorage(file, 'employer_logos', (progress) => {
          setUploadProgress(progress);
        });
      } catch (firebaseErr) {
        console.warn('Storage upload fallback to optimized Base64:', firebaseErr);
        finalLogoUrl = await convertImageToBase64(file);
      }

      if (!finalLogoUrl) {
        throw new Error('Could not process image file');
      }

      setCompanyData(prev => ({ ...prev, companyLogo: finalLogoUrl }));

      const token = localStorage.getItem('employerToken');
      if (token) {
        await fetch(`${apiUrl}/api/employer/auth/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ companyLogo: finalLogoUrl })
        });
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          empInfo.companyLogo = finalLogoUrl;
          localStorage.setItem('employerInfo', JSON.stringify(empInfo));
          window.dispatchEvent(new Event('employer-profile-updated'));
        } catch (_) {}
      }

      showToast('Logo updated and saved successfully!');
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo: ' + (err.message || 'Please try again'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the logo?')) return;
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
        try {
          const empInfo = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          empInfo.companyLogo = '';
          localStorage.setItem('employerInfo', JSON.stringify(empInfo));
          window.dispatchEvent(new Event('employer-profile-updated'));
        } catch (_) {}
      }
      if (oldUrl) {
        deleteFileFromStorage(oldUrl);
      }
      showToast('Logo removed successfully.');
    } catch (err) {
      console.error('Error removing logo:', err);
    }
  };

  const getPageTitle = () => {
    if (activeTab === 'verification') return 'Verification & Compliance';
    if (activeTab === 'account') return 'Account Settings';
    return isConsultant
      ? (portalConfig?.consultantTitle || 'Consultant Profile')
      : (portalConfig?.title || 'Company Profile');
  };

  const getPageSubtitle = () => {
    if (activeTab === 'verification') {
      return 'Verify your identity and company documents to get verified badge and activate candidate access.';
    }
    if (activeTab === 'account') {
      return 'Manage your personal account credentials, mobile verification, and notification preferences.';
    }
    return isConsultant
      ? (portalConfig?.consultantSubtitle || 'Manage your consultant profile, staffing details and branding.')
      : (portalConfig?.subtitle || 'Manage your company information, branding and organizational details.');
  };

  const brandInitial = ((companyData.companyName || accountData.name || 'C')[0] || 'C').toUpperCase();

  return (
    <div className="max-w-[1000px] w-full mx-auto pb-20 animate-in fade-in duration-150">
      
      {/* Top Header Section */}
      <div className="mb-5 sm:mb-7">
        <h1 className="text-[20px] sm:text-[28px] font-bold text-[#101828] tracking-[-0.025em] leading-[1.2]">
          {getPageTitle()}
        </h1>
        <p className="text-[#667085] text-[12.5px] sm:text-[14px] mt-1">
          {getPageSubtitle()}
        </p>
      </div>

      {/* Unified Underline Navigation Tabs */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-[#eaecf0] mb-6 sm:mb-8 overflow-x-auto scrollbar-none">
        <button 
          type="button"
          onClick={() => handleTabChange('account')}
          className={`pb-3 text-[14.5px] font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'account' 
              ? 'border-[#059669] text-[#047857]' 
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span>{portalConfig?.accountTabLabel || 'Account details'}</span>
        </button>

        <button 
          type="button"
          onClick={() => handleTabChange('company')}
          className={`pb-3 text-[14.5px] font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'company' 
              ? 'border-[#059669] text-[#047857]' 
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span>{isConsultant ? (portalConfig?.consultantTabLabel || 'Consultant details') : (portalConfig?.companyTabLabel || 'Company details')}</span>
        </button>

        <button 
          type="button"
          onClick={() => handleTabChange('verification')}
          className={`pb-3 text-[14.5px] font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'verification' 
              ? 'border-[#059669] text-[#047857]' 
              : 'border-transparent text-[#667085] hover:text-[#101828]'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            {verificationStatus === 'verified' && <path d="m9 12 2 2 4-4"/>}
          </svg>
          <span>Verification</span>
          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
            verificationStatus === 'verified'
              ? 'bg-[#ecfdf3] text-[#047857]'
              : verificationStatus === 'pending'
              ? 'bg-[#fef0c7] text-[#b54708]'
              : verificationStatus === 'rejected'
              ? 'bg-[#fef2f2] text-[#b91c1c]'
              : 'bg-[#fff7ed] text-[#c2410c]'
          }`}>
            {verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Review' : verificationStatus === 'rejected' ? 'Fix' : 'Verify'}
          </span>
        </button>
      </div>

      {/* ================= TAB 1: ACCOUNT DETAILS ================= */}
      {activeTab === 'account' && (
        <form onSubmit={handleSaveAccount} className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#101828]">Personal Information</h2>
                <p className="text-[#667085] text-[13px] mt-0.5">Manage your identity, login email, and mobile phone details.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Full Name */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={accountData.name}
                    onChange={(e) => setAccountData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Yash Raj Singh"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    required
                  />
                </div>
                <p className="text-[12px] text-gray-400 mt-1.5">Your official name as the recruiter or account owner.</p>
              </div>

              {/* Email Address (Read-only) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13.5px] font-bold text-gray-700">
                    Email Address
                  </label>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ecfdf3] text-[#047857] border border-[#a6f4c5]">
                    <svg className="w-3 h-3 text-[#047857]" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" clipRule="evenodd" />
                    </svg>
                    <span>Verified</span>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={accountData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[12px] text-gray-400 mt-1.5">Registered account email. Used for candidate notifications and alerts.</p>
              </div>

              {/* Mobile Phone with Country Code */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5">
                  <div className={`flex items-center w-full bg-white border rounded-xl px-3 py-2 transition-all ${
                    phoneError ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10'
                  }`}>
                    {/* Custom Country Code Dropdown Trigger */}
                    <div className="relative shrink-0" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                        className="flex items-center gap-1.5 text-gray-900 font-bold border-none outline-none cursor-pointer pr-2 text-sm hover:text-emerald-700 transition-colors"
                      >
                        <span className="text-base leading-none">{selectedCountryObj.flag}</span>
                        <span>{selectedCountryObj.code}</span>
                        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu Popup */}
                      {isCountryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          <div className="p-2 border-b border-gray-100 bg-gray-50">
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Search country..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-emerald-600 text-gray-900"
                              autoFocus
                            />
                          </div>

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
                                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-emerald-50 transition-colors ${
                                    c.code === (accountData.countryCode || '+91') ? 'bg-emerald-50 font-bold text-emerald-800' : 'text-gray-700'
                                  }`}
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
                      placeholder="10-digit mobile number"
                      className="w-full border-none outline-none text-sm text-gray-900 bg-transparent font-medium"
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-red-500 text-xs font-semibold pl-1">{phoneError}</p>
                  ) : (
                    <p className="text-[12px] text-gray-400">Used for urgent SMS recruiter alerts and verification updates.</p>
                  )}
                </div>
              </div>

              {/* Account Classification */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800">
                  <span className={`w-2 h-2 rounded-full ${isConsultant ? 'bg-teal-500' : 'bg-emerald-500'}`} />
                  <span>{isConsultant ? 'Recruitment & Staffing Consultant' : 'Direct Employer / Company'}</span>
                </div>
                <p className="text-[12px] text-gray-400 mt-1.5">Determined during registration.</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={savingAccount}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {savingAccount && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{savingAccount ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ================= TAB 2: COMPANY / CONSULTANT DETAILS ================= */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="space-y-6 animate-in fade-in duration-200">
          
          {/* Card 1: Brand Logo Section */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#101828]">
                  {isConsultant ? 'Consultant Branding & Logo' : 'Company Branding & Logo'}
                </h2>
                <p className="text-[#667085] text-[13px] mt-0.5">
                  Your logo will appear on all your job postings, candidate chat threads, and recruiter profile.
                </p>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoFileChange} 
                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml" 
                className="hidden" 
              />

              {/* Logo Preview Container */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 flex items-center justify-center relative overflow-hidden group shadow-xs cursor-pointer transition-all shrink-0"
                title="Click to upload or change logo"
              >
                {companyData.companyLogo ? (
                  <>
                    <img 
                      src={companyData.companyLogo} 
                      alt={companyData.companyName || 'Company logo'} 
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/55 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                      <span className="text-[11px] font-bold">Change</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-extrabold text-3xl shadow-inner flex items-center justify-center">
                      {brandInitial}
                    </div>
                    <div className="absolute inset-0 bg-black/45 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span className="text-[11px] font-bold">Upload</span>
                    </div>
                  </>
                )}
              </div>

              {/* Actions & Specs */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:border-emerald-600 hover:text-emerald-700 text-gray-800 text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>{companyData.companyLogo ? 'Change logo' : 'Upload logo'}</span>
                  </button>

                  {companyData.companyLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {uploadingLogo && (
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading {uploadProgress > 0 ? `${uploadProgress}%` : '...'}</span>
                  </div>
                )}

                <p className="text-[12px] text-gray-400 leading-relaxed max-w-md">
                  Recommended: Square aspect ratio (min 400×400px). Supports PNG, JPG, WEBP, or SVG under 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Company Details Form */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 7v14M21 7v14M7 3h10v18H7z"/><circle cx="12" cy="8" r="1"/>
                </svg>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#101828]">
                  {isConsultant ? 'Consultant Firm Information' : 'Company Information'}
                </h2>
                <p className="text-[#667085] text-[13px] mt-0.5">
                  {isConsultant 
                    ? 'Provide complete information regarding your consultancy or recruitment practice.' 
                    : 'Provide comprehensive details regarding your company culture, industry, and headquarters.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Company / Agency Name */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  {isConsultant ? 'Consultancy / Firm Name' : 'Company Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder={isConsultant ? 'e.g. Apex Staffing Solutions' : 'e.g. TechCorp Technologies'}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Hiring For (Role classification) */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  Hiring Category
                </label>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{isConsultant ? 'Consultant / Staffing Partner' : 'Direct Company Employer'}</span>
                </div>
              </div>

              {/* Industry Dropdown */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  Industry Sector
                </label>
                <CustomDropdown
                  options={[
                    'Information Technology',
                    'Finance & Banking',
                    'Healthcare & Life Sciences',
                    'Manufacturing & Industrial',
                    'Education & EdTech',
                    'Retail & E-commerce',
                    'Telecommunications',
                    'Automobile & Transport',
                    'Media & Entertainment',
                    'Other'
                  ]}
                  value={companyData.industry}
                  onChange={(val) => setCompanyData(prev => ({ ...prev, industry: val }))}
                  allowCustomValue={false}
                  placeholder="Select industry sector"
                  className="w-full py-2.5 text-sm font-medium rounded-xl border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10"
                />
              </div>

              {/* Number of Employees */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  Number of Employees
                </label>
                <CustomDropdown
                  options={['1-10', '11-50', '51-200', '201-500', '500-1000', '1000+']}
                  value={companyData.employees}
                  onChange={(val) => setCompanyData(prev => ({ ...prev, employees: val }))}
                  allowCustomValue={false}
                  placeholder="Select company size"
                  className="w-full py-2.5 text-sm font-medium rounded-xl border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  Your Designation
                </label>
                <CustomDropdown
                  options={[
                    'HR Manager',
                    'Talent Acquisition Lead',
                    'Technical Recruiter',
                    'Founder / CEO',
                    'Managing Director',
                    'Staffing Partner',
                    'Hiring Manager',
                    'Other'
                  ]}
                  value={companyData.designation}
                  onChange={(val) => setCompanyData(prev => ({ ...prev, designation: val }))}
                  allowCustomValue={true}
                  placeholder="Select or enter your role"
                  className="w-full py-2.5 text-sm font-medium rounded-xl border-gray-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[13.5px] font-bold text-gray-700 mb-2">
                  Primary Location / City
                </label>
                <MultiSelectLocationDropdown 
                  options={currentLocationOptions} 
                  value={companyData.location} 
                  onChange={(val) => setCompanyData(prev => ({ ...prev, location: val }))} 
                  multiple={false} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" 
                  placeholder="Select city" 
                />
              </div>

              {/* Official Website */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13.5px] font-bold text-gray-700">
                    Official Website
                  </label>
                  {companyData.website && companyData.website.startsWith('http') && (
                    <a
                      href={companyData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <span>Preview website</span>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </span>
                  <input
                    type="url"
                    value={companyData.website}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              {/* About Company / Agency */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13.5px] font-bold text-gray-700">
                    {isConsultant ? 'About Recruitment Practice / Agency' : 'About Company'}
                  </label>
                  <span className="text-[11.5px] font-medium text-gray-400">
                    {companyData.about?.length || 0} / 1000 characters
                  </span>
                </div>
                <textarea
                  rows="4"
                  maxLength={1000}
                  value={companyData.about}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, about: e.target.value }))}
                  placeholder={isConsultant 
                    ? 'Highlight your client portfolio, recruitment specializations, hiring speed, and track record...' 
                    : 'Tell candidates about your company mission, workplace culture, benefits, and why they should join your team...'}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={savingCompany}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {savingCompany && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{savingCompany ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ================= TAB 3: VERIFICATION (EMBEDDED) ================= */}
      {activeTab === 'verification' && (
        <div className="animate-in fade-in duration-200">
          <VerificationPage 
            employerProfile={employerProfile} 
            portalConfig={portalConfig} 
            isEmbedded={true}
            onStatusChange={(data) => {
              if (data?.verification?.status) {
                setVerificationStatus(data.verification.status);
              }
              fetchProfile();
            }}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101828] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default CompanyProfileTab;