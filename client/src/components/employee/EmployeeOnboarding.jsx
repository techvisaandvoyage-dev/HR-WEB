import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomMonthPicker from '../common/CustomMonthPicker';

const formatMonthYear = (dateStr) => {
  if (!dateStr) return 'MM/YYYY';
  const [year, month] = dateStr.split('-');
  if (!year || !month) return 'MM/YYYY';
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthsList[parseInt(month, 10) - 1]} ${year}`;
};

const getCurrencySymbol = (currencyCode) => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', CAD: '$', AUD: '$', SGD: '$', AED: 'د.إ' };
  return symbols[currencyCode || 'INR'] || '₹';
};

const formatIndianNumber = (val) => {
  if (!val) return '';
  const numStr = val.toString().replace(/\D/g, '');
  if (!numStr) return '';
  let lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
};

const EmployeeOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [expandedEduIndex, setExpandedEduIndex] = useState(0);
  const [expandedExpIndex, setExpandedExpIndex] = useState(0);
  const [skillInput, setSkillInput] = useState('');
  const [expError, setExpError] = useState('');

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.experience && parsed.experience.length > 0 && !parsed.experience[0].roles) {
          parsed.experience = parsed.experience.map(exp => ({
            companyName: exp.companyName,
            noticePeriod: exp.noticePeriod || '',
            roles: [{
              jobTitle: exp.jobTitle || '',
              employmentType: exp.employmentType || '',
              currentCompany: exp.currentCompany || false,
              joiningDate: exp.joiningDate || '',
              leavingDate: exp.leavingDate || '',
              roleDescription: exp.roleDescription || ''
            }]
          }));
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse profile data");
      }
    }
    return {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      brief: '',
      
      qualifications: [
        { educationType: '', board: '', startYear: '', endYear: '', percentage: '', schoolMedium: '', university: '', course: '', gradingSystem: '', isPrimary: false }
      ],

      isFresher: false,
      experience: [
        { 
          companyName: '', 
          noticePeriod: '',
          roles: [
            { jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }
          ]
        }
      ],

      professionalDetails: {
        currentDesignation: '',
        currentSalary: '',
        expectedSalary: '',
        currentLocation: '',
        preferredLocations: '',
        linkedinUrl: '',
        majorAchievements: '',
        skills: ''
      },

      documents: {
        resume: null,
        coverLetter: null
      }
    };
  });

  const saveToBackend = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      if (token) {
        const response = await fetch('https://hr-website-kzdw.onrender.com/api/employee/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('userProfile', JSON.stringify(data.profile));
        }
      }
    } catch (err) {
      console.error("Autosave error:", err);
    }
  };

  const handleNext = () => {
    if (currentStep === 4) {
      const p = formData.professionalDetails || {};
      if (!formData.isFresher && (!p.currentDesignation || !p.currentSalary)) {
        alert("Current Designation and Current Salary are required for experienced candidates.");
        return;
      }
      if (!p.expectedSalary) {
        alert("Expected Salary is required.");
        return;
      }
      if (!p.skills) {
        alert("Please add at least one skill.");
        return;
      }
    }

    saveToBackend();
    localStorage.setItem('userProfile', JSON.stringify(formData));
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('employeeToken');
      if (token) {
        const response = await fetch('https://hr-website-kzdw.onrender.com/api/employee/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update local storage with the returned profile just to be safe
          localStorage.setItem('userProfile', JSON.stringify(data.profile));
        } else {
          console.error("Failed to save profile to database");
          localStorage.setItem('userProfile', JSON.stringify(formData));
        }
      } else {
        localStorage.setItem('userProfile', JSON.stringify(formData));
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      localStorage.setItem('userProfile', JSON.stringify(formData));
    } finally {
      localStorage.setItem('hasProfile', 'true');
      setIsSubmitting(false);
      navigate('/employee', { state: { profileCreated: true } });
    }
  };

  const updateArray = (arrayName, index, field, value) => {
    const newArr = [...(formData[arrayName] || [])];
    newArr[index] = { ...newArr[index], [field]: value };
    setFormData({ ...formData, [arrayName]: newArr });
  };

  const addArrayItem = (arrayName, emptyItem) => {
    setFormData({ ...formData, [arrayName]: [...(formData[arrayName] || []), emptyItem] });
  };

  const removeArrayItem = (arrayName, index) => {
    const newArr = [...(formData[arrayName] || [])];
    newArr.splice(index, 1);
    setFormData({ ...formData, [arrayName]: newArr });
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val) {
        const p = formData.professionalDetails || {};
        const currentSkills = p.skills ? p.skills.split(',').filter(s => s.trim()) : [];
        if (!currentSkills.includes(val)) {
          setFormData({...formData, professionalDetails: {...p, skills: [...currentSkills, val].join(', ')}});
        }
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillToRemove) => {
    const p = formData.professionalDetails || {};
    const currentSkills = p.skills ? p.skills.split(',').map(s=>s.trim()).filter(s => s) : [];
    setFormData({...formData, professionalDetails: {...p, skills: currentSkills.filter(s => s !== skillToRemove).join(', ')}});
  };


  const Step1BasicDetails = () => (
    <div className="space-y-6 animate-fade-in pb-2">
      <div className="mb-6 pb-2 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-800">Basic Details</h3>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">First Name <span className="text-red-500">*</span></label>
          <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="John" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Last Name <span className="text-red-500">*</span></label>
          <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="Doe" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
          <div className="flex">
            <span className="px-4 py-3 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-500 font-semibold">+91</span>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-r-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="9876543210" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Email (Read Only)</label>
          <input type="email" disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" value={formData.email || ''} />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Brief about yourself</label>
          <textarea 
            rows="3"
            placeholder="I am a passionate professional..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all custom-scrollbar" 
            value={formData.brief || ''} 
            onChange={e => setFormData({...formData, brief: e.target.value})} 
          ></textarea>
        </div>
      </div>
    </div>
  );

  const Step2Education = () => { return (<div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
                <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Education</h3>
                    <p className="text-sm text-gray-500 mt-1">Details like course, university, and more, help recruiters identify your educational background</p>
                  </div>
                  <button type="button" onClick={() => { setExpandedEduIndex(formData.qualifications?.length || 0); addArrayItem('qualifications', { educationType: '', board: '', endYear: '', schoolMedium: '', percentage: '', university: '', course: '', startYear: '', gradingSystem: '', isPrimary: false }); }} className="text-green-500 hover:text-green-600 font-semibold text-sm">
                    Add +
                  </button>
                </div>
                
                <div className="space-y-6">
                  {(formData.qualifications || []).map((q, idx) => {
                    const isSchool = q.educationType === '10th' || q.educationType === '12th';
                    const isHigher = q.educationType === 'Graduation/Diploma' || q.educationType === 'Masters/Post-Graduation';
                    
                    if (expandedEduIndex !== idx) {
                      return (
                        <div key={idx} className="group relative">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-[15px]">
                              {isHigher ? (q.course || q.educationType || 'Higher Education') : 
                               isSchool ? (q.educationType === '12th' ? 'Class XII' : 'Class X') : 
                               (q.educationType || 'Education')}
                            </h4>
                            <button type="button" onClick={() => setExpandedEduIndex(idx)} className="text-gray-400 hover:text-blue-600 transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                          </div>
                          
                          <p className="text-gray-800 mt-1">
                            {isHigher ? (q.university || 'University not specified') : (q.board || 'Board not specified')}
                          </p>
                          
                          <p className="text-gray-500 text-sm mt-0.5">
                            {isHigher ? `${q.startYear || 'YYYY'} - ${q.endYear || 'YYYY'}` : (q.endYear || 'YYYY')}
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={idx} className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm relative">
                        <button type="button" onClick={() => { removeArrayItem('qualifications', idx); setExpandedEduIndex(-1); }} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        
                        <div className="space-y-6 pt-2">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Education <span className="text-red-500">*</span></label>
                            <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={q.educationType || ''} onChange={e => updateArray('qualifications', idx, 'educationType', e.target.value)}>
                              <option value="">Select education type</option>
                              <option value="10th">10th</option>
                              <option value="12th">12th</option>
                              <option value="Graduation/Diploma">Graduation/Diploma</option>
                              <option value="Masters/Post-Graduation">Masters/Post-Graduation</option>
                            </select>
                          </div>

                          {isSchool && (
                            <>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Board <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={q.board || ''} onChange={e => updateArray('qualifications', idx, 'board', e.target.value)}>
                                  <option value="">Select board</option>
                                  <option value="CBSE">CBSE</option>
                                  <option value="ICSE">ICSE</option>
                                  <option value="State Board">State Board</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Passing out year <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={q.endYear || ''} onChange={e => updateArray('qualifications', idx, 'endYear', e.target.value)}>
                                  <option value="">Select passing out year</option>
                                  {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">School medium <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={q.schoolMedium || ''} onChange={e => updateArray('qualifications', idx, 'schoolMedium', e.target.value)}>
                                  <option value="">Select medium</option>
                                  <option value="English">English</option>
                                  <option value="Hindi">Hindi</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Marks <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="% marks of 100 maximum" value={q.percentage || ''} onChange={e => updateArray('qualifications', idx, 'percentage', e.target.value.replace(/\D/g, ''))} />
                              </div>
                            </>
                          )}

                          {isHigher && (
                            <>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">University/Institute <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="Select university/institute" value={q.university || ''} onChange={e => updateArray('qualifications', idx, 'university', e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Course <span className="text-red-500">*</span></label>
                                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={q.course || ''} onChange={e => updateArray('qualifications', idx, 'course', e.target.value)}>
                                  <option value="">Select course</option>
                                  <option value="B.Tech/B.E.">B.Tech/B.E.</option>
                                  <option value="B.Sc">B.Sc</option>
                                  <option value="B.Com">B.Com</option>
                                  <option value="B.A">B.A</option>
                                  <option value="BBA">BBA</option>
                                  <option value="M.Tech/M.E.">M.Tech/M.E.</option>
                                  <option value="MBA/PGDM">MBA/PGDM</option>
                                  <option value="MCA">MCA</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-3">Course type <span className="text-red-500">*</span></label>
                                <div className="flex flex-wrap items-center gap-6">
                                  <label className="flex items-center cursor-pointer group">
                                    <input type="radio" name={`courseType-${idx}`} value="Full time" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={q.courseType === 'Full time'} onChange={(e) => updateArray('qualifications', idx, 'courseType', e.target.value)} />
                                    <span className={`ml-2.5 text-[15px] ${q.courseType === 'Full time' ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>Full time</span>
                                  </label>
                                  <label className="flex items-center cursor-pointer group">
                                    <input type="radio" name={`courseType-${idx}`} value="Part time" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={q.courseType === 'Part time'} onChange={(e) => updateArray('qualifications', idx, 'courseType', e.target.value)} />
                                    <span className={`ml-2.5 text-[15px] ${q.courseType === 'Part time' ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>Part time</span>
                                  </label>
                                  <label className="flex items-center cursor-pointer group">
                                    <input type="radio" name={`courseType-${idx}`} value="Correspondence/Distance learning" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={q.courseType === 'Correspondence/Distance learning'} onChange={(e) => updateArray('qualifications', idx, 'courseType', e.target.value)} />
                                    <span className={`ml-2.5 text-[15px] ${q.courseType === 'Correspondence/Distance learning' ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>Correspondence/Distance learning</span>
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Course duration <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-4">
                                  <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={q.startYear || ''} onChange={e => updateArray('qualifications', idx, 'startYear', e.target.value)}>
                                    <option value="">Starting year</option>
                                    {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                                  <span className="font-bold text-gray-900">To</span>
                                  <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={q.endYear || ''} onChange={e => updateArray('qualifications', idx, 'endYear', e.target.value)}>
                                    <option value="">Ending year</option>
                                    {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Grading system</label>
                                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={q.gradingSystem || ''} onChange={e => updateArray('qualifications', idx, 'gradingSystem', e.target.value)}>
                                  <option value="">Select grading system</option>
                                  <option value="Scale 10 Grading System">Scale 10 Grading System</option>
                                  <option value="Scale 4 Grading System">Scale 4 Grading System</option>
                                  <option value="% Marks of 100 Maximum">% Marks of 100 Maximum</option>
                                </select>
                              </div>
                              {q.gradingSystem && (
                                <div>
                                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Marks <span className="text-red-500">*</span></label>
                                  <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" placeholder="Enter grade or marks" value={q.percentage || ''} onChange={e => updateArray('qualifications', idx, 'percentage', e.target.value.replace(/\D/g, ''))} />
                                </div>
                              )}
                              {q.educationType === 'Graduation/Diploma' && (
                                <div className="flex items-center pt-2">
                                  <input type="checkbox" id={`primary-grad-${idx}`} className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500" checked={q.isPrimary || false} onChange={e => updateArray('qualifications', idx, 'isPrimary', e.target.checked)} />
                                  <label htmlFor={`primary-grad-${idx}`} className="ml-3 text-gray-700 font-medium">Make this as my primary graduation/diploma</label>
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="flex justify-end mt-4">
                            <button type="button" onClick={() => setExpandedEduIndex(-1)} className="px-6 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-sm">Save</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-4">
                    <button type="button" onClick={() => { setExpandedEduIndex(formData.qualifications?.length || 0); addArrayItem('qualifications', { educationType: '', board: '', endYear: '', schoolMedium: '', percentage: '', university: '', course: '', startYear: '', gradingSystem: '', isPrimary: false }); }} className="text-green-500 font-semibold hover:text-green-600 text-sm">
                      Add +
                    </button>
                  </div>
                </div>
              </div>); };

  const Step3Experience = () => { return (<div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
              <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Work Experience</h3>
                </div>
                <button type="button" onClick={() => { setExpandedExpIndex(formData.experience?.length || 0); addArrayItem('experience', { companyName: '', noticePeriod: '', roles: [{ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }] }); }} className="text-green-500 font-semibold hover:text-green-600 text-sm">
                  Add +
                </button>
              </div>
              <div className="space-y-6">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Are you a Fresher?</label>
                        <button type="button" onClick={() => setFormData({...formData, isFresher: !formData.isFresher})} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${formData.isFresher ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {formData.isFresher ? '✓ Yes, I am a Fresher' : 'No, I have experience'}
                        </button>
                      </div>
                      
                      {!formData.isFresher && (
                        <div className="space-y-6">
                          {(formData.experience || []).map((exp, cIdx) => {
                            const hasCurrentRole = (exp.roles || []).some(r => r.currentCompany);
                            
                            if (expandedExpIndex !== cIdx) {
                              return (
                                <div key={cIdx} className="group relative border-b border-gray-100 last:border-0 pb-6 mb-6 last:pb-0 last:mb-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-bold text-gray-900 text-[15px]">
                                      {exp.companyName || 'Company Name'}
                                    </h4>
                                    <button type="button" onClick={() => setExpandedExpIndex(cIdx)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                  </div>
                                  
                                  <div className="mt-4 pl-4 border-l-2 border-green-500 ml-2 space-y-5">
                                    {(exp.roles || []).map((role, rIdx) => (
                                      <div key={rIdx} className="relative">
                                        <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[23px] top-1.5 ring-4 ring-white"></div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-gray-800">{role.jobTitle || 'Job Title'}</p>
                                          {role.currentCompany && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider rounded-full">Current Role</span>
                                          )}
                                        </div>
                                        <p className="text-gray-500 text-sm mt-0.5">
                                          {formatMonthYear(role.joiningDate)} - {role.currentCompany ? 'Present' : formatMonthYear(role.leavingDate)} | {role.employmentType || 'Employment Type'}
                                        </p>
                                        {role.roleDescription && (
                                          <p className="text-gray-600 text-sm mt-2">{role.roleDescription}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <div key={cIdx} className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50 relative">
                                <button type="button" onClick={() => { removeArrayItem('experience', cIdx); setExpandedExpIndex(-1); }} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                <h4 className="font-semibold text-gray-700 pr-8">Company {cIdx + 1}</h4>
                                <div>
                                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                                  <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={exp.companyName || ''} onChange={e => {
                                    const newExp = [...(formData.experience || [])];
                                    newExp[cIdx].companyName = e.target.value;
                                    setFormData({...formData, experience: newExp});
                                  }} />
                                </div>
                                <div className="relative border-l-2 border-green-500 ml-3 mt-8 space-y-8 pb-4">
                                  {(exp.roles || []).map((role, rIdx) => (
                                    <div key={rIdx} className="relative pl-6">
                                      <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-green-500 border-4 border-gray-50 shadow-sm"></div>
                                      
                                      <div className="p-6 border border-gray-200 rounded-xl space-y-6 bg-white shadow-sm relative group">
                                        <button type="button" onClick={() => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].roles.splice(rIdx, 1);
                                          setFormData({...formData, experience: newExp});
                                        }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors hidden group-hover:block">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                        
                                        <div className="absolute -top-3 left-4 bg-white px-3 text-sm font-bold text-green-600 border border-green-100 rounded-full shadow-sm">Role {rIdx + 1}</div>
                                        
                                        <div className="space-y-6 pt-2">
                                      <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Job Title <span className="text-red-500">*</span></label>
                                        <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={role.jobTitle || ''} onChange={e => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].roles[rIdx].jobTitle = e.target.value;
                                          setFormData({...formData, experience: newExp});
                                        }} />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Employment Type <span className="text-red-500">*</span></label>
                                        <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={role.employmentType || ''} onChange={e => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].roles[rIdx].employmentType = e.target.value;
                                          setFormData({...formData, experience: newExp});
                                        }}>
                                          <option value="">Select</option>
                                          <option value="Full-time">Full-time</option>
                                          <option value="Part-time">Part-time</option>
                                          <option value="Contract">Contract</option>
                                        </select>
                                      </div>
                                      <div className="flex items-center mt-6">
                                        <input type="checkbox" id={`current-${cIdx}-${rIdx}`} className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500 mr-3" checked={role.currentCompany || false} onChange={e => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].roles[rIdx].currentCompany = e.target.checked;
                                          if (e.target.checked) newExp[cIdx].roles[rIdx].leavingDate = '';
                                          setFormData({...formData, experience: newExp});
                                        }} />
                                        <label htmlFor={`current-${cIdx}-${rIdx}`} className="text-sm font-bold text-gray-900">Current role</label>
                                      </div>
                                      <div className="space-y-6">
                                        <div>
                                          <label className="block text-sm font-bold text-gray-900 mb-1.5">Joining <span className="text-red-500">*</span></label>
                                          <CustomMonthPicker
                                            value={role.joiningDate || ''}
                                            onChange={val => {
                                              const newExp = [...(formData.experience || [])];
                                              newExp[cIdx].roles[rIdx].joiningDate = val;
                                              setFormData({...formData, experience: newExp});
                                            }}
                                            placeholder="Select joining date"
                                          />
                                        </div>
                                        {!role.currentCompany && (
                                          <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Leaving <span className="text-red-500">*</span></label>
                                            <CustomMonthPicker
                                              value={role.leavingDate || ''}
                                              onChange={val => {
                                                const newExp = [...(formData.experience || [])];
                                                newExp[cIdx].roles[rIdx].leavingDate = val;
                                                setFormData({...formData, experience: newExp});
                                              }}
                                              placeholder="Select leaving date"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Role Description</label>
                                        <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 h-24 resize-none outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={role.roleDescription || ''} onChange={e => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].roles[rIdx].roleDescription = e.target.value;
                                          setFormData({...formData, experience: newExp});
                                        }} />
                                      </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}

                                  <div className="relative pl-6">
                                    <div className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-gray-300 border-2 border-gray-50"></div>
                                    <button type="button" onClick={() => {
                                      const newExp = [...(formData.experience || [])];
                                      newExp[cIdx].roles.push({ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' });
                                      setFormData({...formData, experience: newExp});
                                    }} className="flex items-center gap-1 text-sm font-bold text-green-600 hover:text-green-700 transition-colors">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                      Add Role
                                    </button>
                                  </div>
                                </div>

                                {hasCurrentRole && (
                                  <div className="mt-6 pt-6 border-t border-gray-200">
                                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Notice Period</label>
                                    <select className="w-1/2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={exp.noticePeriod || ''} onChange={e => {
                                      const newExp = [...(formData.experience || [])];
                                      newExp[cIdx].noticePeriod = e.target.value;
                                      setFormData({...formData, experience: newExp});
                                    }}>
                                      <option value="">Select</option>
                                      <option value="15 Days">15 Days</option>
                                      <option value="30 Days">30 Days</option>
                                      <option value="60 Days">60 Days</option>
                                      <option value="90+ Days">90+ Days</option>
                                    </select>
                                  </div>
                                )}
                                <div className="flex justify-end mt-4">
                                  <button type="button" onClick={() => setExpandedExpIndex(-1)} className="px-6 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-sm">Save</button>
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="pt-4">
                        {formData.isFresher !== true && (
                    <div className="flex items-center gap-3">
                      {expError && <span className="text-red-500 text-xs font-medium">{expError}</span>}
                      <button type="button" onClick={(e) => {
                        e.preventDefault();
                        const experiences = formData.experience || [];
                        if (experiences.length > 0) {
                          const lastExp = experiences[experiences.length - 1];
                          const lastRole = lastExp.roles && lastExp.roles.length > 0 ? lastExp.roles[lastExp.roles.length - 1] : {};
                          if (!lastExp.companyName || !lastRole.jobTitle || !lastRole.roleDescription) {
                            setExpError('Fill details');
                            return;
                          }
                        }
                        setExpError('');
                        setExpandedExpIndex(experiences.length); addArrayItem('experience', { companyName: '', noticePeriod: '', roles: [{ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }] });
                      }} className="text-green-500 font-semibold hover:text-green-600 text-sm whitespace-nowrap">
                        Add +
                      </button>
                    </div>
                  )}          </div>
                        </div>
                      )}
                    </div>
              </div>); };

  const Step4Professional = () => {
    const p = formData.professionalDetails || {};
    const setP = (field, val) => setFormData({...formData, professionalDetails: {...p, [field]: val}});
    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
        <div className="mb-6 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Professional Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {!formData.isFresher && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Designation <span className="text-red-500">*</span></label>
              <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={p.currentDesignation || ''} onChange={e => setP('currentDesignation', e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">LinkedIn Profile URL</label>
            <input type="url" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={p.linkedinUrl || ''} onChange={e => setP('linkedinUrl', e.target.value)} />
          </div>
          
          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Salary Type <span className="text-red-500">*</span></label>
              <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={p.salaryType || 'Yearly'} onChange={e => setP('salaryType', e.target.value)}>
                <option value="Yearly">Yearly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Currency <span className="text-red-500">*</span></label>
              <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" value={p.currency || 'INR'} onChange={e => setP('currency', e.target.value)}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Salary</label>
              <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder={p.salaryType === 'Monthly' ? `e.g. ${getCurrencySymbol(p.currency)}40,000` : `e.g. ${getCurrencySymbol(p.currency)}5,00,000`} value={p.currentSalary || ''} onChange={e => setP('currentSalary', formatIndianNumber(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Expected Salary <span className="text-red-500">*</span></label>
              <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder={p.salaryType === 'Monthly' ? `e.g. ${getCurrencySymbol(p.currency)}60,000` : `e.g. ${getCurrencySymbol(p.currency)}8,00,000`} value={p.expectedSalary || ''} onChange={e => setP('expectedSalary', formatIndianNumber(e.target.value))} />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Skills <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(p.skills ? p.skills.split(',').filter(s => s.trim()) : []).map(skill => (
                <span key={skill} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors" onClick={() => removeSkill(skill)} title="Click to remove">
                  {skill} <span className="text-[10px]">✕</span>
                </span>
              ))}
            </div>
            <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all" placeholder="Type a skill and hit Enter" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Major Achievements</label>
            <textarea className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all h-24 resize-none" value={p.majorAchievements || ''} onChange={e => setP('majorAchievements', e.target.value)} />
          </div>
        </div>
      </div>
    );
  };

  const Step5Documents = () => {
    const docs = formData.documents || {};
    const setDoc = (field, val) => setFormData({...formData, documents: {...docs, [field]: val}});
    return (
      <div className="space-y-6 animate-fade-in pb-2">
        <div className="mb-6 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Documents</h3>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">Upload Resume <span className="text-red-500">*</span></label>
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center hover:bg-gray-100 hover:border-green-400 transition-all cursor-pointer relative group">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx,.rtf" onChange={e => setDoc('resume', e.target.files[0]?.name || '')} />
              <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-green-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                <span className="relative cursor-pointer bg-white rounded-md font-semibold text-green-600 hover:text-green-500">
                  <span>Upload a file</span>
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-black mt-2 font-medium">Supported Formats: doc, docx, rtf, pdf, upto 300kb</p>
            </div>
            {docs.resume && <p className="text-sm text-gray-600 mt-3 flex items-center gap-2"><svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> {docs.resume}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">Upload Cover Letter (Optional)</label>
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center hover:bg-gray-100 hover:border-green-400 transition-all cursor-pointer relative group">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".pdf,.doc,.docx,.rtf" onChange={e => setDoc('coverLetter', e.target.files[0]?.name || '')} />
              <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-green-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                <span className="relative cursor-pointer bg-white rounded-md font-semibold text-green-600 hover:text-green-500">
                  <span>Upload a file</span>
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-black mt-2 font-medium">Supported Formats: doc, docx, rtf, pdf, upto 300kb</p>
            </div>
            {docs.coverLetter && <p className="text-sm text-gray-600 mt-3 flex items-center gap-2"><svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> {docs.coverLetter}</p>}
          </div>
        </div>
      </div>
    );
  };

  const Step6Review = () => {
    const p = formData.professionalDetails || {};
    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar text-sm bg-blue-50/30 p-4 rounded-xl border border-blue-100">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-palette-900 mb-2">Final Review</h3>
          <p className="text-gray-500">Please review all the details you filled in before submitting.</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Basic Details</h4>
          <p><span className="font-semibold text-gray-600">Name:</span> {(formData.firstName || formData.lastName) ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim() : 'N/A'}</p>
          <p><span className="font-semibold text-gray-600">Phone:</span> {formData.phone || 'N/A'}</p>
          <p><span className="font-semibold text-gray-600">Email:</span> {formData.email || 'N/A'}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Education</h4>
          {(!formData.qualifications || formData.qualifications.length === 0) ? (
            <p className="text-gray-500 italic">N/A</p>
          ) : (
            formData.qualifications.map((q, i) => (
              <p key={i}>• {q.educationType || 'N/A'} {q.university || q.board || 'N/A'} ({q.startYear || 'N/A'}-{q.endYear || 'N/A'}) - {q.percentage || 'N/A'}</p>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Work Experience</h4>
          {formData.isFresher ? (
            <p className="font-medium text-palette-900">Fresher (No Experience)</p>
          ) : (!formData.experience || formData.experience.length === 0) ? (
            <p className="text-gray-500 italic">N/A</p>
          ) : (
            formData.experience.map((e, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <p className="font-bold text-palette-900">{e.companyName || 'N/A'}</p>
                <div className="pl-3 mt-1 border-l-2 border-gray-200 space-y-2">
                  {e.roles && e.roles.length > 0 ? e.roles.map((r, rIdx) => (
                    <div key={rIdx}>
                      <p className="font-semibold text-gray-700">• {r.jobTitle || 'N/A'}</p>
                      <p className="text-gray-500 text-xs pl-3">({formatMonthYear(r.joiningDate)} to {r.currentCompany ? 'Present' : formatMonthYear(r.leavingDate)})</p>
                    </div>
                  )) : (
                    <p className="text-gray-500 italic text-xs">Roles: N/A</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-2">
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Professional Details</h4>
          <div className="grid grid-cols-2 gap-3">
            <p><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Designation</span> {p.currentDesignation || 'N/A'}</p>
            <p><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Current Salary</span> {p.currentSalary || 'N/A'}</p>
            <p><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Expected Salary</span> {p.expectedSalary || 'N/A'}</p>
            <p className="col-span-2"><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Preferred Locations</span> {p.preferredLocations || 'N/A'}</p>
            <p className="col-span-2"><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">Skills</span> {p.skills || 'N/A'}</p>
            <p className="col-span-2"><span className="font-semibold text-gray-600 block text-xs uppercase tracking-wider mb-1">LinkedIn</span> {p.linkedinUrl || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in border border-gray-200">
        
        {/* Header & Progress */}
        <div className="pt-6 pb-4 px-8 border-b border-gray-100 flex-shrink-0 bg-white z-10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-palette-900">Create your Profile</h2>
            <button type="button" onClick={() => navigate('/profile')} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">
              Skip for now
            </button>
          </div>
          
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-bold inline-block py-1 px-3 uppercase rounded-full text-green-700 bg-green-50 border border-green-100">
                  {Math.round((currentStep / totalSteps) * 100)}% Completed
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-100 inset-shadow">
              <div style={{ width: `${(currentStep / totalSteps) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"></div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-8 py-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col bg-gray-50/30">
          <form id="onboardingForm" onSubmit={handleSubmit} className="flex flex-col flex-1 max-w-3xl w-full mx-auto">
            <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              {currentStep === 1 && Step1BasicDetails()}
              {currentStep === 2 && Step2Education()}
              {currentStep === 3 && Step3Experience()}
              {currentStep === 4 && Step4Professional()}
              {currentStep === 5 && Step5Documents()}
              {currentStep === 6 && Step6Review()}
            </div>

            {/* Footer Actions */}
            <div className="mt-8 mb-4 flex flex-col sm:flex-row-reverse gap-4 justify-between max-w-3xl w-full mx-auto">
              {currentStep < totalSteps ? (
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="sm:w-auto px-10 py-3.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all hover:-translate-y-0.5"
                >
                  Save & Continue
                </button>
              ) : (
                <button 
                  type="submit" 
                  form="onboardingForm"
                  disabled={isSubmitting}
                  className={`sm:w-auto px-10 py-3.5 text-white font-bold rounded-xl shadow-lg transition-all ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 shadow-green-600/30 hover:bg-green-700 hover:-translate-y-0.5'}`}
                >
                  {isSubmitting ? 'Saving...' : 'Submit Profile'}
                </button>
              )}
              
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={handleBack} 
                  className="sm:w-auto px-10 py-3.5 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  Back
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboarding;
