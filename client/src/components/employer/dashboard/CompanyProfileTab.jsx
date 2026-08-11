import React, { useState } from 'react';

const CompanyProfileTab = () => {
  const [activeTab, setActiveTab] = useState('info');

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
            onClick={() => setActiveTab('info')}
            className={`pb-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-[#29953f] text-[#29953f]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            Company Information
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8 flex-1 flex flex-col md:flex-row gap-12">
          
          {/* Left Form Column */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Company Name</label>
                <input 
                  type="text" 
                  defaultValue="xyz" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Industry</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors appearance-none bg-white">
                  <option>Software/IT</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Website</label>
                <input 
                  type="text" 
                  defaultValue="xyz" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-blue-600 focus:outline-none focus:border-[#29953f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Company Size</label>
                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors appearance-none bg-white">
                  <option>51-200 employees</option>
                  <option>11-50 employees</option>
                  <option>201-500 employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">About Company</label>
              <textarea 
                rows="4" 
                defaultValue="xyz"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Company Email</label>
                <input 
                  type="email" 
                  defaultValue="xyz" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone Number</label>
                <input 
                  type="tel" 
                  defaultValue="xyz" 
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Office Location</label>
              <input 
                type="text" 
                defaultValue="xyz" 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors"
              />
            </div>
          </div>

          {/* Right Image Column */}
          <div className="w-full md:w-[280px] shrink-0 space-y-8 border-t md:border-t-0 md:border-l border-gray-100 pt-8 md:pt-0 md:pl-10">
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-3">Company Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[#29953f] text-white flex items-center justify-center text-3xl font-bold shadow-sm">
                  X
                </div>
                <div>
                  <button className="text-sm font-bold text-gray-700 hover:text-[#29953f] transition-colors">
                    Upload New Logo
                  </button>
                  <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG up to 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-3">Cover Image</label>
              <div className="w-full h-32 rounded-xl bg-gray-200 overflow-hidden mb-3 shadow-sm border border-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600" 
                  alt="Office Cover" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="text-sm font-bold text-gray-700 hover:text-[#29953f] transition-colors">
                Change Cover Image
              </button>
              <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG up to 5MB</p>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button className="px-8 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
            Save Changes
          </button>
        </div>

      </div>

    </div>
  );
};

export default CompanyProfileTab;
