import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import MultiSelectLocationDropdown from '../../common/MultiSelectLocationDropdown';
import { currentLocationOptions } from '../../../data/preferredLocations';
import { uploadFileToStorage, deleteFileFromStorage } from '../../../utils/firebaseStorage';

const CompanyProfileTab = () => {
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
    accountType: 'Company/business'
  });

  const [companyData, setCompanyData] = useState({
    hiringFor: 'your_company',
    companyName: '',
    companyLogo: '',
    industry: '',
    employees: '',
    designation: '',
    location: '',
    about: '',
    website: ''
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
        setAccountData({
          name: emp.fullName || '',
          email: emp.email || '',
          phone: emp.mobile || '',
          accountType: emp.accountType || 'Company/business'
        });
        setCompanyData({
          hiringFor: emp.hiringFor || 'your_company',
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
    setEditingField(null);
    await handleSaveAll(false);
  };

  const handleSaveAll = async (showAlert = true) => {
    try {
      const token = localStorage.getItem('employerToken');
      if (!token) return;

      const payload = {
        fullName: accountData.name,
        mobile: accountData.phone,
        companyName: companyData.companyName,
        companyLogo: companyData.companyLogo,
        industry: companyData.industry,
        employees: companyData.employees,
        designation: companyData.designation,
        location: companyData.location,
        aboutCompany: companyData.about,
        website: companyData.website,
        hiringFor: companyData.hiringFor
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
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (showAlert) alert('Failed to update profile. Please try again.');
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
      <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors min-h-[80px]">
        <div className="w-1/3 text-sm text-gray-500">{label}</div>
        <div className="flex-1">
          {isEditing ? (
            type === 'textarea' ? (
              <textarea 
                value={value}
                onChange={(e) => handleChange(section, field, e.target.value)}
                className="w-full px-3 py-2 border border-[#29953f] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29953f] resize-none"
                rows="3"
                autoFocus
              />
            ) : type === 'select-industry' ? (
              <select value={value} onChange={(e) => handleChange(section, field, e.target.value)} className="w-full px-3 py-2 border border-[#29953f] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29953f] bg-white">
                <option>Information Technology</option><option>Finance</option><option>Healthcare</option><option>Manufacturing</option><option>Education</option><option>Other</option>
              </select>
            ) : type === 'select-employees' ? (
              <select value={value} onChange={(e) => handleChange(section, field, e.target.value)} className="w-full px-3 py-2 border border-[#29953f] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29953f] bg-white">
                <option>1-10</option><option>11-50</option><option>51-200</option><option>201-500</option><option>500+</option>
              </select>
            ) : type === 'select-designation' ? (
              <select value={value} onChange={(e) => handleChange(section, field, e.target.value)} className="w-full px-3 py-2 border border-[#29953f] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29953f] bg-white">
                <option>HR Manager</option><option>Recruiter</option><option>Talent Acquisition</option><option>Founder / CEO</option><option>Director</option><option>Other</option>
              </select>
            ) : type === 'location' ? (
              <MultiSelectLocationDropdown 
                options={currentLocationOptions} 
                value={value} 
                onChange={(val) => handleChange(section, field, val)} 
                multiple={false} 
                className="w-full px-3 py-2 border border-[#29953f] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29953f]" 
                placeholder="Select Location" 
              />
            ) : (
              <input 
                type={type} 
                value={value} 
                onChange={(e) => handleChange(section, field, e.target.value)}
                className="w-full px-3 py-2 border border-[#29953f] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29953f]"
                autoFocus
              />
            )
          ) : (
            <span className={`text-sm ${field === 'website' ? 'text-blue-600' : 'text-gray-600'} ${type === 'textarea' ? 'truncate block max-w-sm' : ''}`}>
              {value}
            </span>
          )}
        </div>
        {isEditable && (
          <div className="ml-4 shrink-0">
            {isEditing ? (
              <button onClick={handleSaveField} className="text-sm font-bold text-white bg-[#29953f] px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                Save
              </button>
            ) : (
              <button onClick={() => handleEdit(`${section}.${field}`)} className="text-gray-400 hover:text-gray-700 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-bold text-[#147a2e] tracking-tight uppercase">Company Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your company information and branding.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Tabs Navigation */}
        <div className="px-8 pt-4 border-b border-gray-100 flex items-center gap-8">
          <button 
            type="button"
            onClick={() => handleTabChange('account')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'account' ? 'border-[#29953f] text-[#29953f]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Account Details
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange('company')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'company' ? 'border-[#29953f] text-[#29953f]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Company Details
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 flex-1 flex flex-col md:flex-row gap-12">
          
          {/* Left Form Column */}
          <div className="flex-1 space-y-8">
            
            {/* Account Details Section */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Personal info</h2>
                  </div>
                  <p className="text-sm text-gray-500 ml-14">Your name and/or role may be visible to jobseekers and other members of your organisation.</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {renderRow('account', 'name', 'Name', accountData.name)}
                  {renderRow('account', 'email', 'Email', accountData.email, 'email', false)}
                  {renderRow('account', 'phone', 'Phone', accountData.phone, 'tel')}
                </div>
              </div>
            )}

            {/* Company Details Section */}
            {activeTab === 'company' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
                  </div>
                  <p className="text-sm text-gray-500 ml-14">Manage your company information and branding.</p>
                </div>

                <div className="divide-y divide-gray-100">
                  {/* Company Logo Row */}
                  <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors min-h-[90px]">
                    <div className="w-1/3 text-sm text-gray-500">Company Logo</div>
                    <div className="flex-1 flex items-center gap-4">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoFileChange} 
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml" 
                        className="hidden" 
                      />
                      
                      {/* Logo preview or initial box */}
                      <div className="relative group shrink-0">
                        {companyData.companyLogo ? (
                          <div className="w-14 h-14 rounded-xl border border-gray-200 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                            <img 
                              src={companyData.companyLogo} 
                              alt={companyData.companyName || 'Company Logo'} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-palette-400 text-white flex items-center justify-center text-xl font-bold shadow-sm uppercase">
                            {(companyData.companyName || accountData.name || 'C').charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Upload button or progress indicator */}
                      <div className="flex items-center gap-3">
                        {uploadingLogo ? (
                          <div className="flex items-center gap-2 text-sm font-semibold text-palette-400">
                            <svg className="animate-spin h-5 w-5 text-palette-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Uploading {uploadProgress > 0 ? `${uploadProgress}%` : '...'}</span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-sm font-bold text-palette-400 px-4 py-2 border border-palette-400/30 rounded-lg hover:bg-palette-50 hover:border-palette-400 transition-colors shadow-sm"
                            >
                              {companyData.companyLogo ? 'Change Logo' : 'Upload New Logo'}
                            </button>
                            {companyData.companyLogo && (
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="text-sm font-semibold text-red-500 hover:text-red-700 px-2 py-1 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {renderRow('company', 'hiringFor', 'Hiring for', companyData.hiringFor === 'consultant' ? 'Consultant / Staffing Agency' : 'Your Company', 'text', false)}
                  {renderRow('company', 'companyName', 'Company Name', companyData.companyName)}
                  {renderRow('company', 'industry', 'Industry', companyData.industry, 'select-industry')}
                  {renderRow('company', 'employees', 'Number of Employees', companyData.employees, 'select-employees')}
                  {renderRow('company', 'designation', 'Designation', companyData.designation, 'select-designation')}
                  {renderRow('company', 'location', 'Company Location', companyData.location, 'location')}
                  {renderRow('company', 'about', 'About Company', companyData.about, 'textarea')}
                  {renderRow('company', 'website', 'Website link', companyData.website, 'url')}
                </div>
              </div>
            )}

          </div>



        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={handleSaveAll} className="px-8 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
            Save Changes
          </button>
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#29953f] text-white px-5 py-3 rounded-xl shadow-lg font-semibold text-sm flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

export default CompanyProfileTab;
