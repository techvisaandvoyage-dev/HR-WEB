import React, { useState, useEffect } from 'react';
import LocationAutocomplete from '../../common/LocationAutocomplete';

const CompanyProfileTab = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [editingField, setEditingField] = useState(null);

  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phone: '',
    accountType: 'Company/business'
  });

  const [companyData, setCompanyData] = useState({
    hiringFor: 'your_company',
    companyName: '',
    industry: '',
    employees: '',
    designation: '',
    location: '',
    about: '',
    website: ''
  });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      const response = await fetch(`\${import.meta.env.VITE_API_URL}/api/employer/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
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
  const handleSaveField = () => setEditingField(null);

  const handleSaveAll = async () => {
    try {
      const token = localStorage.getItem('employerToken');
      const payload = {
        fullName: accountData.name,
        mobile: accountData.phone,
        companyName: companyData.companyName,
        industry: companyData.industry,
        employees: companyData.employees,
        designation: companyData.designation,
        location: companyData.location,
        aboutCompany: companyData.about,
        website: companyData.website,
        hiringFor: companyData.hiringFor
      };
      
      const response = await fetch(`\${import.meta.env.VITE_API_URL}/api/employer/auth/update`, {
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
        alert('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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
              <LocationAutocomplete value={value} onChange={(val) => handleChange(section, field, val)} className="w-full px-3 py-2 border border-[#29953f] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#29953f]" placeholder="e.g. Mumbai" />
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
            onClick={() => setActiveTab('account')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'account' ? 'border-[#29953f] text-[#29953f]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Account Details
          </button>
          <button 
            onClick={() => setActiveTab('company')}
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
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
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
                  {renderRow('account', 'email', 'Email', accountData.email, 'email')}
                  {renderRow('account', 'phone', 'Phone', accountData.phone, 'tel')}
                  {renderRow('account', 'accountType', 'Account Type', accountData.accountType)}
                </div>
              </div>
            )}

            {/* Company Details Section */}
            {activeTab === 'company' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
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
                  <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                    <div className="w-1/3 text-sm text-gray-500">Company Logo</div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#29953f] text-white flex items-center justify-center text-xl font-bold shadow-sm">
                        X
                      </div>
                      <button className="text-sm font-bold text-blue-600 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Upload New Logo
                      </button>
                    </div>
                  </div>
                  {renderRow('company', 'hiringFor', 'Hiring for', companyData.hiringFor, 'text', false)}
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

    </div>
  );
};

export default CompanyProfileTab;
