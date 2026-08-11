import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LocationAutocomplete from '../../common/LocationAutocomplete';

const PostJob = ({ addJob }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [skillsList, setSkillsList] = useState([]);
  const [salaryType, setSalaryType] = useState('Yearly');
  const [currency, setCurrency] = useState('INR');
  const [salaryValues, setSalaryValues] = useState({
    Yearly: { min: '', max: '' },
    Monthly: { min: '', max: '' },
    Hourly: { min: '', max: '' }
  });
  const [qualification, setQualification] = useState('Select Qualification');
  const [customQualification, setCustomQualification] = useState('');
  const [stream, setStream] = useState('Select Stream');
  const [customStream, setCustomStream] = useState('');
  const [jobData, setJobData] = useState({
    title: '', employmentType: '', experience: '', openings: '', location: '', workplaceType: '',
    about: '', responsibilities: '', skills: '',
    qualification: '', stream: '', category: ''
  });
  
  const steps = [
    { id: 1, name: 'Job Details' },
    { id: 2, name: 'Job Description' },
    { id: 3, name: 'Salary & Requirements' },
    { id: 4, name: 'Preview' }
  ];

  const handleNext = () => setActiveStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 1));

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skillsList.includes(skillInput.trim())) {
        setSkillsList([...skillsList, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove));
  };

  const getCurrencySymbol = (code) => {
    switch(code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': default: return '₹';
    }
  };
  const cSym = getCurrencySymbol(currency);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-bold text-[#147a2e] tracking-tight uppercase">Post a New Job</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in the details to create a new job posting.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Column - Steps */}
        <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-8 shrink-0">
          <div className="space-y-8">
            {steps.map((step) => {
              const isActive = activeStep === step.id;
              const isPast = activeStep > step.id;
              return (
                <div key={step.id} className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveStep(step.id)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    isActive ? 'bg-green-100 text-[#29953f] border border-[#29953f]' :
                    isPast ? 'bg-[#29953f] text-white' : 'bg-white border border-gray-200 text-gray-400'
                  }`}>
                    {isPast ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className={`font-bold text-sm ${isActive ? 'text-[#29953f]' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex-1 p-8 md:p-10 flex flex-col">
          
          {/* Step 1: Job Details */}
          {activeStep === 1 && (
            <div className="flex-1 space-y-6 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Job Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Frontend Developer" 
                  value={jobData.title}
                  onChange={(e) => setJobData({...jobData, title: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Employment Type</label>
                  <select 
                    value={jobData.employmentType}
                    onChange={(e) => setJobData({...jobData, employmentType: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors appearance-none bg-white"
                  >
                    <option value="">Select employment type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Experience</label>
                  <select 
                    value={jobData.experience}
                    onChange={(e) => setJobData({...jobData, experience: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors appearance-none bg-white"
                  >
                    <option value="">Select experience</option>
                    <option value="0-1 Years (Fresher)">0-1 Years (Fresher)</option>
                    <option value="1-3 Years">1-3 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Workplace Type</label>
                  <select 
                    value={jobData.workplaceType}
                    onChange={(e) => setJobData({...jobData, workplaceType: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors appearance-none bg-white"
                  >
                    <option value="">Select type</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Openings</label>
                  <input 
                    type="number" 
                    placeholder="Number of openings" 
                    value={jobData.openings}
                    onChange={(e) => setJobData({...jobData, openings: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Job Location</label>
                  <LocationAutocomplete 
                    value={jobData.location}
                    onChange={(val) => setJobData({...jobData, location: val})}
                    placeholder="e.g. Bangalore, Karnataka"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Job Description */}
          {activeStep === 2 && (
            <div className="flex-1 space-y-6 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">About Role</label>
                <textarea 
                  rows="4" 
                  placeholder="Brief overview of the role..." 
                  value={jobData.about}
                  onChange={(e) => setJobData({...jobData, about: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Responsibilities</label>
                <textarea 
                  rows="4" 
                  placeholder="Key responsibilities and day-to-day tasks..." 
                  value={jobData.responsibilities}
                  onChange={(e) => setJobData({...jobData, responsibilities: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Skills Required</label>
                {skillsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skillsList.map((skill, index) => (
                      <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-[#29953f] border border-green-100 rounded-full text-xs font-bold">
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => removeSkill(skill)}
                          className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input 
                  type="text" 
                  placeholder="Type a skill and press Enter" 
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Step 3: Salary & Requirements */}
          {activeStep === 3 && (
            <div className="flex-1 space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Compensation</h3>
                  
                  <div className="mb-6 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Salary Type</label>
                      <div className="relative w-full">
                        <select 
                          value={salaryType}
                          onChange={(e) => setSalaryType(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all appearance-none bg-white cursor-pointer"
                        >
                          <option value="Yearly">Yearly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Hourly">Hourly</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Currency</label>
                      <div className="relative w-full">
                        <select 
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all appearance-none bg-white cursor-pointer"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300" key={salaryType}>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      {salaryType === 'Yearly' ? 'Annual Salary' : salaryType === 'Monthly' ? 'Monthly Salary' : 'Hourly Rate'}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input 
                          type="text" 
                          placeholder={salaryType === 'Yearly' ? `${cSym}5,00,000` : salaryType === 'Monthly' ? `${cSym}40,000` : `${cSym}300`}
                          value={salaryValues[salaryType].min}
                          onChange={(e) => setSalaryValues({...salaryValues, [salaryType]: {...salaryValues[salaryType], min: e.target.value}})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5 ml-1 font-semibold uppercase tracking-wide">Minimum</p>
                      </div>
                      <div>
                        <input 
                          type="text" 
                          placeholder={salaryType === 'Yearly' ? `${cSym}8,00,000` : salaryType === 'Monthly' ? `${cSym}60,000` : `${cSym}600`}
                          value={salaryValues[salaryType].max}
                          onChange={(e) => setSalaryValues({...salaryValues, [salaryType]: {...salaryValues[salaryType], max: e.target.value}})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5 ml-1 font-semibold uppercase tracking-wide">Maximum</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-3 font-medium flex items-center gap-1.5 bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                      This salary will be shown to candidates on the job listing.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Job Category</label>
                  <select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors appearance-none bg-white">
                    <option>Select category</option>
                    <option>Engineering</option>
                    <option>Design</option>
                    <option>Marketing</option>
                    <option>Sales</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Qualification</label>
                  <div className="relative mb-2">
                    <select 
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all appearance-none bg-white cursor-pointer"
                    >
                      <option value="Select Qualification">Select Qualification</option>
                      <option value="High School">High School</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                      <option value="Custom">Custom...</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                  {qualification === 'Custom' && (
                    <input 
                      type="text" 
                      placeholder="Enter custom qualification" 
                      value={customQualification}
                      onChange={(e) => setCustomQualification(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 animate-in slide-in-from-top-2 fade-in"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Stream / Major</label>
                  <div className="relative mb-2">
                    <select 
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all appearance-none bg-white cursor-pointer"
                    >
                      <option value="Select Stream">Select Stream</option>
                      <option value="Computer Science / IT">Computer Science / IT</option>
                      <option value="Engineering (Mechanical, Civil, etc.)">Engineering (Mechanical, Civil, etc.)</option>
                      <option value="Business Administration / Management">Business Administration / Management</option>
                      <option value="Commerce / Finance">Commerce / Finance</option>
                      <option value="Arts / Humanities">Arts / Humanities</option>
                      <option value="Custom">Custom...</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                  </div>
                  {stream === 'Custom' && (
                    <input 
                      type="text" 
                      placeholder="Enter custom stream" 
                      value={customStream}
                      onChange={(e) => setCustomStream(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 animate-in slide-in-from-top-2 fade-in"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {activeStep === 4 && (
            <div className="flex-1 space-y-6 animate-in fade-in">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-full flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4 mb-4">Job Preview</h3>
                
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-2xl font-bold text-[#147a2e]">{jobData.title || 'Untitled Job'}</h4>
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600 font-medium">
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> {jobData.employmentType || 'Not specified'}</span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> {jobData.workplaceType || 'Not specified'}</span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {jobData.location || 'Not specified'}</span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg> {jobData.experience || 'Not specified'}</span>
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {salaryValues[salaryType].min && salaryValues[salaryType].max ? `${cSym}${salaryValues[salaryType].min} - ${cSym}${salaryValues[salaryType].max} ${salaryType === 'Yearly' ? 'Annual' : salaryType === 'Monthly' ? 'Monthly' : 'Hourly'}` : 'Salary not specified'}</span>
                    </div>
                  </div>

                  {/* Requirements & Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Qualification</span>
                      <span className="font-semibold text-gray-900">{qualification === 'Custom' ? (customQualification || 'Not specified') : (qualification === 'Select Qualification' ? 'Not specified' : qualification)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Stream / Major</span>
                      <span className="font-semibold text-gray-900">{stream === 'Custom' ? (customStream || 'Not specified') : (stream === 'Select Stream' ? 'Not specified' : stream)}</span>
                    </div>
                  </div>

                  {/* About */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-2">About the Role</h5>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{jobData.about || 'No description provided.'}</p>
                  </div>

                  {/* Responsibilities */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-2">Key Responsibilities</h5>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{jobData.responsibilities || 'No responsibilities listed.'}</p>
                  </div>

                  {/* Skills */}
                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-3">Skills Required</h5>
                    {skillsList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillsList.map((skill, index) => (
                          <span key={index} className="px-3 py-1.5 bg-green-50 text-[#29953f] border border-green-100 rounded-md text-xs font-bold">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No specific skills requested.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
            {activeStep > 1 ? (
              <button onClick={handleBack} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                Back
              </button>
            ) : <div></div>}
            
            <div className="flex gap-4">
              {activeStep === 4 && (
                <button onClick={() => setActiveStep(1)} className="px-6 py-2.5 text-sm font-bold text-[#29953f] bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  Edit
                </button>
              )}
              <button 
                onClick={activeStep === 4 ? () => {
                  const newJob = {
                    id: Date.now(),
                    company: "My Company",
                    companyInitial: "M",
                    title: jobData.title || 'Untitled Job',
                    location: jobData.location || 'Not specified',
                    salary: salaryValues[salaryType].min && salaryValues[salaryType].max ? `${cSym}${salaryValues[salaryType].min} - ${cSym}${salaryValues[salaryType].max} ${salaryType === 'Yearly' ? 'per year' : salaryType === 'Monthly' ? 'per month' : 'per hour'}` : 'Not specified',
                    employerProvided: true,
                    postedAt: "Just now",
                    easyApply: true,
                    applications: 0,
                    qualifications: skillsList.map(s => ({ name: s, met: true })),
                    details: {
                      workLocation: jobData.workplaceType || "On-site",
                      jobTitle: jobData.title || 'Untitled Job',
                      employmentType: jobData.employmentType || "Full-Time",
                      experience: jobData.experience || "Not specified",
                      aboutRole: jobData.about || "",
                      responsibilities: jobData.responsibilities || "",
                      qualification: qualification === 'Custom' ? customQualification : (qualification === 'Select Qualification' ? '' : qualification),
                      stream: stream === 'Custom' ? customStream : (stream === 'Select Stream' ? '' : stream),
                      category: jobData.category || "General"
                    },
                    skills: skillsList
                  };
                  if (addJob) addJob(newJob);
                  alert("Job Published Successfully!");
                  navigate('/employer');
                } : handleNext}
                className="px-8 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                {activeStep === 4 ? 'Publish Job' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
        
      </div>

    </div>
  );
};

export default PostJob;
