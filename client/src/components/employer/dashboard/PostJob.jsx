import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LocationAutocomplete from '../../common/LocationAutocomplete';
import CustomDropdown from '../../common/CustomDropdown';

const formatIndianNumber = (numStr) => {
  const digits = String(numStr).replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('en-IN').format(Number(digits));
};

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
  const [jobData, setJobData] = useState({
    title: '', employmentType: '', experience: '', openings: '', location: '', workplaceType: '',
    about: '', responsibilities: '', skills: '',
    qualification: '', stream: '', category: '',
    screeningQuestions: []
  });
  const [employerDetails, setEmployerDetails] = useState({ companyName: 'My Company', industry: 'Company' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('employerToken');
        if (!token) return;
        const res = await fetch(`\${import.meta.env.VITE_API_URL}/api/employer/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setEmployerDetails({
            companyName: data.data.companyName || 'My Company',
            industry: data.data.industry || 'Company'
          });
        }
      } catch (err) {
        console.error("Failed to fetch employer profile", err);
      }
    };
    fetchProfile();
  }, []);
  
  const steps = [
    { id: 1, name: 'Job Details' },
    { id: 2, name: 'Job Description' },
    { id: 3, name: 'Salary & Requirements' },
    { id: 4, name: 'Screening Questions' },
    { id: 5, name: 'Preview' }
  ];

  const handleNext = () => setActiveStep(prev => Math.min(prev + 1, 5));
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
                  <CustomDropdown
                    options={[
                      { value: "Full-time", label: "Full-time" },
                      { value: "Part-time", label: "Part-time" },
                      { value: "Contract", label: "Contract" }
                    ]}
                    value={jobData.employmentType}
                    onChange={(val) => setJobData({...jobData, employmentType: val})}
                    placeholder="Select employment type"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Experience</label>
                  <CustomDropdown
                    options={[
                      { value: '0 - 1 Yrs', label: '0 - 1 Yrs (Fresher)' },
                      { value: '2 - 3 Yrs', label: '2 - 3 Yrs' },
                      { value: '4 - 6 Yrs', label: '4 - 6 Yrs' },
                      { value: '7 - 10 Yrs', label: '7 - 10 Yrs' },
                      { value: '11 - 15 Yrs', label: '11 - 15 Yrs' },
                      { value: '16 - 20 Yrs', label: '16 - 20 Yrs' },
                      { value: '21 - 25 Yrs', label: '21 - 25 Yrs' },
                      { value: '25+ yrs', label: '25+ yrs' }
                    ]}
                    value={jobData.experience}
                    onChange={(val) => setJobData({...jobData, experience: val})}
                    placeholder="Select experience"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Workplace Type</label>
                  <CustomDropdown
                    options={[
                      { value: "On-site", label: "On-site" },
                      { value: "Hybrid", label: "Hybrid" },
                      { value: "Remote", label: "Remote" }
                    ]}
                    value={jobData.workplaceType}
                    onChange={(val) => setJobData({...jobData, workplaceType: val})}
                    placeholder="Select type"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Openings</label>
                  <input 
                    type="number" 
                    placeholder="Number of openings" 
                    value={jobData.openings}
                    onChange={(e) => setJobData({...jobData, openings: e.target.value.replace(/\D/g, '')})}
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
                          placeholder={salaryType === 'Yearly' ? 'write the amount in LPA' : salaryType === 'Monthly' ? `${cSym}40,000` : `${cSym}300`}
                          value={salaryValues[salaryType].min}
                          onChange={(e) => setSalaryValues({...salaryValues, [salaryType]: {...salaryValues[salaryType], min: formatIndianNumber(e.target.value)}})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5 ml-1 font-semibold uppercase tracking-wide">Minimum</p>
                      </div>
                      <div>
                        <input 
                          type="text" 
                          placeholder={salaryType === 'Yearly' ? 'write the amount in LPA' : salaryType === 'Monthly' ? `${cSym}60,000` : `${cSym}600`}
                          value={salaryValues[salaryType].max}
                          onChange={(e) => setSalaryValues({...salaryValues, [salaryType]: {...salaryValues[salaryType], max: formatIndianNumber(e.target.value)}})}
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
                  <input 
                    list="job-categories"
                    value={jobData.category}
                    onChange={(e) => setJobData({...jobData, category: e.target.value})}
                    placeholder="Select or type a category"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors bg-white"
                  />
                  <datalist id="job-categories">
                    <option value="Engineering" />
                    <option value="Design" />
                    <option value="Marketing" />
                    <option value="Sales" />
                    <option value="Human Resources" />
                    <option value="Finance" />
                    <option value="Customer Support" />
                    <option value="Operations" />
                    <option value="Information Technology" />
                    <option value="Data Science" />
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Qualification</label>
                  <input 
                    list="qualifications"
                    value={jobData.qualification}
                    onChange={(e) => setJobData({...jobData, qualification: e.target.value})}
                    placeholder="Select or type qualification"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all bg-white"
                  />
                  <datalist id="qualifications">
                    <option value="High School" />
                    <option value="Diploma" />
                    <option value="Bachelor's Degree" />
                    <option value="Master's Degree" />
                    <option value="Doctorate (PhD)" />
                    <option value="B.Tech / B.E." />
                    <option value="M.Tech / M.E." />
                    <option value="MBA" />
                    <option value="BCA" />
                    <option value="MCA" />
                    <option value="B.Com" />
                    <option value="M.Com" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Stream / Major</label>
                  <input 
                    list="streams"
                    value={jobData.stream}
                    onChange={(e) => setJobData({...jobData, stream: e.target.value})}
                    placeholder="Select or type stream"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all bg-white"
                  />
                  <datalist id="streams">
                    <option value="Computer Science / IT" />
                    <option value="Engineering (Mechanical, Civil, etc.)" />
                    <option value="Business Administration / Management" />
                    <option value="Commerce / Finance" />
                    <option value="Arts / Humanities" />
                    <option value="Electronics & Communication" />
                    <option value="Electrical Engineering" />
                    <option value="Marketing" />
                    <option value="Human Resources" />
                    <option value="Data Science / AI" />
                  </datalist>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Screening Questions */}
          {activeStep === 4 && (
            <div className="flex-1 space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Applicant Screening Questions</h3>
                  <p className="text-sm text-gray-500 mt-1">Add optional questions for candidates to answer when applying.</p>
                </div>
                <button 
                  onClick={() => {
                    setJobData({
                      ...jobData, 
                      screeningQuestions: [...jobData.screeningQuestions, { question: '', type: 'Yes/No', required: true }]
                    });
                  }}
                  className="px-4 py-2 bg-green-50 text-[#29953f] hover:bg-green-100 rounded-lg text-sm font-bold transition-colors"
                >
                  + Add Question
                </button>
              </div>

              {jobData.screeningQuestions.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <p className="text-gray-500 font-medium">No screening questions added yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Add questions to pre-screen applicants (e.g., "Do you have a Bachelor's degree?").</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobData.screeningQuestions.map((q, index) => (
                    <div key={index} className="p-5 border border-gray-200 rounded-xl bg-white space-y-4 relative group">
                      <button 
                        onClick={() => {
                          const newQs = [...jobData.screeningQuestions];
                          newQs.splice(index, 1);
                          setJobData({...jobData, screeningQuestions: newQs});
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove Question"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Question {index + 1}</label>
                        <input 
                          type="text" 
                          placeholder="e.g., How many years of React experience do you have?" 
                          value={q.question}
                          onChange={(e) => {
                            const newQs = [...jobData.screeningQuestions];
                            newQs[index].question = e.target.value;
                            setJobData({...jobData, screeningQuestions: newQs});
                          }}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#29953f] transition-colors pr-10"
                        />
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">Response Type</label>
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const newQs = [...jobData.screeningQuestions];
                              newQs[index].type = e.target.value;
                              setJobData({...jobData, screeningQuestions: newQs});
                            }}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#29953f] transition-colors bg-white"
                          >
                            <option value="Yes/No">Yes/No</option>
                            <option value="Short Text">Short Text</option>
                          </select>
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={q.required}
                              onChange={(e) => {
                                const newQs = [...jobData.screeningQuestions];
                                newQs[index].required = e.target.checked;
                                setJobData({...jobData, screeningQuestions: newQs});
                              }}
                              className="w-4 h-4 text-[#29953f] rounded border-gray-300 focus:ring-[#29953f]"
                            />
                            <span className="text-sm font-bold text-gray-700">Required</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Preview */}
          {activeStep === 5 && (
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
                      <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {salaryValues[salaryType].min && salaryValues[salaryType].max ? (salaryType === 'Yearly' ? `${cSym} ${salaryValues[salaryType].min}-${salaryValues[salaryType].max} Lacs PA` : `${cSym}${salaryValues[salaryType].min} - ${cSym}${salaryValues[salaryType].max} ${salaryType === 'Monthly' ? 'Monthly' : 'Hourly'}`) : 'Salary not specified'}</span>
                    </div>
                  </div>

                  {/* Requirements & Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Qualification</span>
                      <span className="font-semibold text-gray-900">{jobData.qualification || 'Not specified'}</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Stream / Major</span>
                      <span className="font-semibold text-gray-900">{jobData.stream || 'Not specified'}</span>
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

                  {/* Screening Questions Preview */}
                  {jobData.screeningQuestions && jobData.screeningQuestions.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h5 className="text-sm font-bold text-gray-900 mb-3">Screening Questions ({jobData.screeningQuestions.length})</h5>
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {jobData.screeningQuestions.map((q, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{q.question || 'Empty Question'}</span> 
                            <span className="text-xs text-gray-400 ml-2">({q.type}{q.required ? ', Required' : ', Optional'})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
              {activeStep === 5 && (
                <button onClick={() => setActiveStep(1)} className="px-6 py-2.5 text-sm font-bold text-[#29953f] bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  Edit
                </button>
              )}
              <button 
                onClick={activeStep === 5 ? async () => {
                  const newJob = {
                    company: employerDetails.companyName,
                    companyInitial: employerDetails.companyName.charAt(0).toUpperCase() || "C",
                    title: jobData.title || 'Untitled Job',
                    location: jobData.location || 'Not specified',
                    salary: salaryValues[salaryType].min && salaryValues[salaryType].max ? (salaryType === 'Yearly' ? `${cSym} ${salaryValues[salaryType].min}-${salaryValues[salaryType].max} Lacs PA` : `${cSym}${salaryValues[salaryType].min} - ${cSym}${salaryValues[salaryType].max} ${salaryType === 'Monthly' ? 'per month' : 'per hour'}`) : 'Not specified',
                    employerProvided: true,
                    easyApply: true,
                    qualifications: skillsList.map(s => ({ name: s, met: true })),
                    screeningQuestions: jobData.screeningQuestions,
                    details: {
                      workLocation: jobData.workplaceType || "On-site",
                      jobTitle: jobData.title || 'Untitled Job',
                      employmentType: jobData.employmentType || "Full-Time",
                      experience: jobData.experience || "Not specified",
                      aboutRole: jobData.about || "",
                      responsibilities: jobData.responsibilities || "",
                      qualification: jobData.qualification || "",
                      stream: jobData.stream || "",
                      category: jobData.category || "General",
                      industry: employerDetails.industry
                    }
                  };
                  
                  try {
                    const res = await fetch(`\${import.meta.env.VITE_API_URL}/api/employer/jobs`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('employerToken')}`
                      },
                      body: JSON.stringify(newJob)
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                      if (addJob) addJob(data.data);
                      alert("Job Published Successfully!");
                      navigate('/employer');
                    } else {
                      alert("Error: " + data.message);
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Error publishing job");
                  }
                } : handleNext}
                className="px-8 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                {activeStep === 5 ? 'Publish Job' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
        
      </div>

    </div>
  );
};

export default PostJob;
