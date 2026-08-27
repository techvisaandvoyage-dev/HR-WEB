import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomMonthPicker from '../common/CustomMonthPicker';
import CustomDropdown from '../common/CustomDropdown';
import LocationAutocomplete from '../common/LocationAutocomplete';
import { allSkillsOptions, getSuggestedSkills } from '../../utils/skillsData';

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

const educationTypeOptions = [
  { value: '10th', label: '10th' },
  { value: '12th', label: '12th' },
  { value: 'Graduation/Diploma', label: 'Graduation/Diploma' },
  { value: 'Masters/Post-Graduation', label: 'Masters/Post-Graduation' },
  { value: 'Accounting Degree', label: 'Accounting Degree' },
  { value: 'Post Graduate Accounting & Finance', label: 'Post Graduate Accounting & Finance' },
  { value: 'Professional Qualification', label: 'Professional Qualification' },
  { value: 'Accounting Certification', label: 'Accounting Certification' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Accounting Software', label: 'Accounting Software' },
  { value: 'Taxation', label: 'Taxation' },
  { value: 'Audit', label: 'Audit' },
  { value: 'Finance', label: 'Finance' },
  { value: 'International Accounting', label: 'International Accounting' },
  { value: 'Other', label: 'Other' },
];

const diplomaCourses = [
  { value: 'Diploma in Accounting', label: 'Diploma in Accounting' },
  { value: 'Diploma in Financial Accounting', label: 'Diploma in Financial Accounting' },
  { value: 'Diploma in Taxation', label: 'Diploma in Taxation' },
  { value: 'Diploma in Computerized Accounting', label: 'Diploma in Computerized Accounting' },
  { value: 'Polytechnic / Technical Diploma', label: 'Polytechnic / Technical Diploma' },
  { value: 'ITI', label: 'ITI' }
];

const accountingDegrees = [
  { value: 'B.Com', label: 'B.Com' },
  { value: 'B.Com (Hons.)', label: 'B.Com (Hons.)' },
  { value: 'BBA in Finance', label: 'BBA in Finance' },
  { value: 'BBA in Accounting', label: 'BBA in Accounting' },
  { value: 'B.Sc. in Accounting', label: 'B.Sc. in Accounting' },
  { value: 'Bachelor of Accounting / B.Acc.', label: 'Bachelor of Accounting / B.Acc.' },
  { value: 'BMS in Finance / Accounting', label: 'BMS in Finance / Accounting' }
];

const postGradAccountingDegrees = [
  { value: 'M.Com', label: 'M.Com' },
  { value: 'M.Com in Accounting', label: 'M.Com in Accounting' },
  { value: 'M.Com in Finance', label: 'M.Com in Finance' },
  { value: 'MBA in Finance', label: 'MBA in Finance' },
  { value: 'MBA in Accounting', label: 'MBA in Accounting' },
  { value: 'M.Sc. in Accounting / Finance', label: 'M.Sc. in Accounting / Finance' },
  { value: 'Master of Accounting / M.Acc.', label: 'Master of Accounting / M.Acc.' },
  { value: 'PG Diploma in Accounting', label: 'PG Diploma in Accounting' },
  { value: 'PG Diploma in Finance', label: 'PG Diploma in Finance' }
];

const professionalQualifications = [
  { value: 'CA', label: 'CA – Chartered Accountant' },
  { value: 'CMA', label: 'CMA – Cost and Management Accountant' },
  { value: 'CS', label: 'CS – Company Secretary' },
  { value: 'ACCA', label: 'ACCA' },
  { value: 'CPA', label: 'CPA – Certified Public Accountant' },
  { value: 'CFA', label: 'CFA – Chartered Financial Analyst' },
  { value: 'CIMA', label: 'CIMA' },
  { value: 'CIA', label: 'CIA – Certified Internal Auditor' },
  { value: 'CGMA', label: 'CGMA' }
];

const accountingSoftwareCourses = [
  { value: 'Tally / TallyPrime', label: 'Tally / TallyPrime' },
  { value: 'Tally + GST', label: 'Tally + GST' },
  { value: 'SAP FI', label: 'SAP FI' },
  { value: 'SAP FICO', label: 'SAP FICO' },
  { value: 'QuickBooks', label: 'QuickBooks' },
  { value: 'Zoho Books', label: 'Zoho Books' },
  { value: 'BUSY Accounting Software', label: 'BUSY Accounting Software' },
  { value: 'Oracle Financials', label: 'Oracle Financials' },
  { value: 'Sage Accounting', label: 'Sage Accounting' },
  { value: 'Advanced Excel for Accounting', label: 'Advanced Excel for Accounting' },
  { value: 'MS Excel for Accounting', label: 'MS Excel for Accounting' }
];

const taxationCourses = [
  { value: 'GST', label: 'GST' },
  { value: 'GST Certification', label: 'GST Certification' },
  { value: 'Income Tax', label: 'Income Tax' },
  { value: 'Corporate Taxation', label: 'Corporate Taxation' },
  { value: 'Tax Planning', label: 'Tax Planning' },
  { value: 'Indirect Taxation', label: 'Indirect Taxation' },
  { value: 'Transfer Pricing', label: 'Transfer Pricing' }
];

const auditCourses = [
  { value: 'Financial Accounting', label: 'Financial Accounting' },
  { value: 'Advanced Financial Accounting', label: 'Advanced Financial Accounting' },
  { value: 'Corporate Accounting', label: 'Corporate Accounting' },
  { value: 'Cost Accounting', label: 'Cost Accounting' },
  { value: 'Management Accounting', label: 'Management Accounting' },
  { value: 'Auditing', label: 'Auditing' },
  { value: 'Internal Audit', label: 'Internal Audit' },
  { value: 'Forensic Accounting', label: 'Forensic Accounting' },
  { value: 'Payroll Accounting', label: 'Payroll Accounting' },
  { value: 'Financial Reporting', label: 'Financial Reporting' },
  { value: 'Accounts Payable (AP)', label: 'Accounts Payable (AP)' },
  { value: 'Accounts Receivable (AR)', label: 'Accounts Receivable (AR)' },
  { value: 'Bank Reconciliation', label: 'Bank Reconciliation' }
];

const financeCourses = [
  { value: 'Financial Analysis', label: 'Financial Analysis' },
  { value: 'Financial Modeling', label: 'Financial Modeling' },
  { value: 'Corporate Finance', label: 'Corporate Finance' },
  { value: 'Investment Banking', label: 'Investment Banking' },
  { value: 'Equity Research', label: 'Equity Research' },
  { value: 'Treasury Management', label: 'Treasury Management' },
  { value: 'Risk Management', label: 'Risk Management' },
  { value: 'Financial Planning', label: 'Financial Planning' }
];

const internationalAccountingCourses = [
  { value: 'IFRS', label: 'IFRS' },
  { value: 'Ind AS', label: 'Ind AS' },
  { value: 'US GAAP', label: 'US GAAP' },
  { value: 'International Accounting', label: 'International Accounting' }
];

const accountingCertifications = [
  { value: 'Certificate in Accounting', label: 'Certificate in Accounting' },
  { value: 'Certificate in Financial Accounting', label: 'Certificate in Financial Accounting' },
  { value: 'Certificate in GST', label: 'Certificate in GST' },
  { value: 'Certificate in Tally', label: 'Certificate in Tally' },
  { value: 'Certificate in Income Tax', label: 'Certificate in Income Tax' },
  { value: 'Certificate in Payroll', label: 'Certificate in Payroll' },
  { value: 'DCA', label: 'DCA' },
  { value: 'PGDCA', label: 'PGDCA' },
  { value: 'Other Accounting Qualification', label: 'Other Accounting Qualification' },
  { value: 'Other Finance Qualification', label: 'Other Finance Qualification' }
];



const EmployeeOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [expandedEduIndex, setExpandedEduIndex] = useState(-1);
  const [expandedExpIndex, setExpandedExpIndex] = useState(-1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expError, setExpError] = useState('');
  const [expFieldErrors, setExpFieldErrors] = useState({});
  const [eduError, setEduError] = useState('');
  const [eduFieldErrors, setEduFieldErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');

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
      designation: '',
      totalExperience: '',
      
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
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
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.designation || !formData.industry || !formData.totalExperience || !formData.location) {
        alert("Please fill in all mandatory fields (marked with *) to continue.");
        return;
      }
    }
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
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
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
        const currentSkills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : [];
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
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Industry <span className="text-red-500">*</span></label>
          <CustomDropdown 
            options={[
              'IT & Software', 'BPO/KPO', 'Finance & Accounts', 'Healthcare',
              'Manufacturing', 'Education', 'Marketing', 'Sales', 'HR', 'Other'
            ].sort().map(ind => ({ value: ind, label: ind }))}
            value={formData.industry}
            onChange={(val) => setFormData({...formData, industry: val, designation: ''})}
            placeholder="Select Industry"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Designation / Role <span className="text-red-500">*</span></label>
          <CustomDropdown 
            options={(() => {
              const rolesByIndustry = {
                'IT & Software': ["Software Engineer", "Senior Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "DevOps Engineer", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "UI/UX Designer", "QA Engineer / Tester", "Cloud Architect", "System Administrator", "Cybersecurity Analyst", "Technical Lead"],
                'BPO/KPO': ["Customer Support Executive", "Technical Support Executive", "BPO Executive", "Team Leader", "Quality Analyst", "Process Trainer", "Operations Manager"],
                'Finance & Accounts': ["Accountant", "Senior Accountant", "Financial Analyst", "Finance Manager", "Auditor", "Tax Consultant", "Investment Banker", "Chartered Accountant (CA)"],
                'Healthcare': ["Doctor", "Nurse", "Pharmacist", "Medical Representative", "Healthcare Administrator", "Lab Technician", "Physiotherapist", "Medical Coder"],
                'Manufacturing': ["Production Engineer", "Quality Analyst", "Plant Manager", "Maintenance Engineer", "Supply Chain Manager", "Safety Officer", "Mechanical Engineer"],
                'Education': ["Teacher", "Professor", "Assistant Professor", "Principal", "Admin", "Counselor", "Curriculum Developer", "Librarian"],
                'Marketing': ["Marketing Executive", "Digital Marketer", "Marketing Manager", "SEO Specialist", "Content Writer", "Social Media Manager", "Brand Manager"],
                'Sales': ["Sales Executive", "Sales Manager", "Business Development Executive", "Business Development Manager", "Account Manager", "Area Sales Manager", "Retail Store Manager"],
                'HR': ["HR Executive", "HR Manager", "Recruiter", "Talent Acquisition Specialist", "Payroll Executive", "Training & Development Manager", "HR Generalist"]
              };
              if (formData.industry && rolesByIndustry[formData.industry]) {
                return [...rolesByIndustry[formData.industry], "Other"].map(role => ({ value: role, label: role }));
              }
              const allRoles = [...new Set(Object.values(rolesByIndustry).flat()), "Product Manager", "Project Manager", "Business Analyst", "Operations Manager", "Other"];
              return allRoles.sort().map(role => ({ value: role, label: role }));
            })()}
            value={formData.designation}
            onChange={(val) => setFormData({...formData, designation: val})}
            placeholder="Select Designation / Role"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Total Experience <span className="text-red-500">*</span></label>
          <CustomDropdown 
            options={[
              { value: '0 - 1 Yrs', label: '0 - 1 Yrs' },
              { value: '2 - 3 Yrs', label: '2 - 3 Yrs' },
              { value: '4 - 6 Yrs', label: '4 - 6 Yrs' },
              { value: '7 - 10 Yrs', label: '7 - 10 Yrs' },
              { value: '11 - 15 Yrs', label: '11 - 15 Yrs' },
              { value: '16 - 20 Yrs', label: '16 - 20 Yrs' },
              { value: '21 - 25 Yrs', label: '21 - 25 Yrs' },
              { value: '25+ yrs', label: '25+ yrs' }
            ]}
            value={formData.totalExperience}
            onChange={(val) => setFormData({...formData, totalExperience: val})}
            placeholder="Select Total Experience"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Location <span className="text-red-500">*</span></label>
          <LocationAutocomplete 
            value={formData.location || ''}
            onChange={(val) => setFormData({...formData, location: val?.label || val})}
            placeholder="e.g. Pune, Maharashtra"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-1.5">Preferred Location</label>
          <LocationAutocomplete 
            value={formData.preferredLocation || ''}
            onChange={(val) => setFormData({...formData, preferredLocation: val?.label || val})}
            placeholder="e.g. Mumbai, Maharashtra"
          />
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

  const handleAddEducation = (e) => {
    e.preventDefault();
    const qualifications = formData.qualifications || [];
    if (qualifications.length > 0) {
      const lastEdu = qualifications[qualifications.length - 1];
      let isValid = true;
      const errors = {};
      if (!lastEdu.educationType) {
        isValid = false;
        errors.educationType = true;
      } else {
        const isSchool = lastEdu.educationType === '10th' || lastEdu.educationType === '12th';
        if (isSchool) {
          if (!lastEdu.board) errors.board = true;
          if (!lastEdu.endYear) errors.endYear = true;
          if (!lastEdu.schoolMedium) errors.schoolMedium = true;
          if (!lastEdu.percentage) errors.percentage = true;
        } else {
          if (!lastEdu.university) errors.university = true;
          if (!lastEdu.course) errors.course = true;
          if (!lastEdu.courseType) errors.courseType = true;
          if (!lastEdu.startYear) errors.startYear = true;
          if (!lastEdu.endYear) errors.endYear = true;
          if (lastEdu.gradingSystem && lastEdu.gradingSystem !== 'Not Applicable' && !lastEdu.percentage) errors.percentage = true;
        }
        if (Object.keys(errors).length > 0) isValid = false;
      }
      setEduFieldErrors(errors);
      if (!isValid) {
        setEduError('Fill details');
        return;
      }
    }
    setEduError('');
    setEduFieldErrors({});
    setExpandedEduIndex(qualifications.length);
    addArrayItem('qualifications', { educationType: '', board: '', endYear: '', schoolMedium: '', percentage: '', university: '', course: '', startYear: '', gradingSystem: '', isPrimary: false });
  };

  const handleSaveEducation = (e) => {
    if (e) e.preventDefault();
    const qualifications = formData.qualifications || [];
    if (qualifications.length > 0 && expandedEduIndex >= 0 && expandedEduIndex < qualifications.length) {
      const currentEdu = qualifications[expandedEduIndex];
      let isValid = true;
      const errors = {};
      if (!currentEdu.educationType) {
        isValid = false;
        errors.educationType = true;
      } else {
        const isSchool = currentEdu.educationType === '10th' || currentEdu.educationType === '12th';
        if (isSchool) {
          if (!currentEdu.board) errors.board = true;
          if (!currentEdu.endYear) errors.endYear = true;
          if (!currentEdu.schoolMedium) errors.schoolMedium = true;
          if (!currentEdu.percentage) errors.percentage = true;
        } else {
          if (!currentEdu.university) errors.university = true;
          if (!currentEdu.course) errors.course = true;
          if (!currentEdu.courseType) errors.courseType = true;
          if (!currentEdu.startYear) errors.startYear = true;
          if (!currentEdu.endYear) errors.endYear = true;
          if (currentEdu.gradingSystem && currentEdu.gradingSystem !== 'Not Applicable' && !currentEdu.percentage) errors.percentage = true;
        }
        if (Object.keys(errors).length > 0) isValid = false;
      }
      setEduFieldErrors(errors);
      if (!isValid) {
        setEduError('Fill details');
        return;
      }
    }
    setEduError('');
    setEduFieldErrors({});
    setExpandedEduIndex(-1);
  };

  const handleAddExperience = (e) => {
    if (e) e.preventDefault();
    const experience = formData.experience || [];
    if (experience.length > 0) {
      const lastExp = experience[experience.length - 1];
      let isValid = true;
      const errors = { roles: [] };
      if (!lastExp.companyName) {
        isValid = false;
        errors.companyName = true;
      }
      if (lastExp.roles) {
        lastExp.roles.forEach((role, idx) => {
          const roleErrors = {};
          if (!role.jobTitle) { isValid = false; roleErrors.jobTitle = true; }
          if (!role.employmentType) { isValid = false; roleErrors.employmentType = true; }
          if (!role.joiningDate) { isValid = false; roleErrors.joiningDate = true; }
          if (!role.currentCompany && !role.leavingDate) { isValid = false; roleErrors.leavingDate = true; }
          errors.roles[idx] = roleErrors;
        });
      }
      setExpFieldErrors(errors);
      if (!isValid) {
        setExpError('Fill details');
        return;
      }
    }
    setExpError('');
    setExpFieldErrors({});
    setExpandedExpIndex(experience.length);
    addArrayItem('experience', { companyName: '', noticePeriod: '', roles: [{ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }] });
  };

  const handleSaveExperience = (e) => {
    if (e) e.preventDefault();
    const experience = formData.experience || [];
    if (experience.length > 0 && expandedExpIndex >= 0 && expandedExpIndex < experience.length) {
      const currentExp = experience[expandedExpIndex];
      let isValid = true;
      const errors = { roles: [] };
      if (!currentExp.companyName) {
        isValid = false;
        errors.companyName = true;
      }
      if (currentExp.roles) {
        currentExp.roles.forEach((role, idx) => {
          const roleErrors = {};
          if (!role.jobTitle) { isValid = false; roleErrors.jobTitle = true; }
          if (!role.employmentType) { isValid = false; roleErrors.employmentType = true; }
          if (!role.joiningDate) { isValid = false; roleErrors.joiningDate = true; }
          if (!role.currentCompany && !role.leavingDate) { isValid = false; roleErrors.leavingDate = true; }
          errors.roles[idx] = roleErrors;
        });
      }
      setExpFieldErrors(errors);
      if (!isValid) {
        setExpError('Fill details');
        return;
      }
    }
    setExpError('');
    setExpFieldErrors({});
    setExpandedExpIndex(-1);
  };

  const Step2Education = () => { return (<div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
                <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Education</h3>
                    <p className="text-sm text-gray-500 mt-1">Details like course, university, and more, help recruiters identify your educational background</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {eduError && <span className="text-red-500 text-xs font-medium">{eduError}</span>}
                    <button type="button" onClick={handleAddEducation} className="text-green-500 hover:text-green-600 font-semibold text-sm">
                      Add +
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {(formData.qualifications || []).map((q, idx) => {
                    const isSchool = q.educationType === '10th' || q.educationType === '12th';
                    const isHigher = q.educationType && !isSchool;
                    
                    if (expandedEduIndex !== idx) {
                      return (
                        <div key={idx} className="group relative">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-[15px]">
                              {isHigher ? (q.course || q.educationType || 'Higher Education') : 
                               isSchool ? (q.educationType === '12th' ? 'Class XII' : 'Class X') : 
                               (q.educationType || 'Education')}
                            </h4>
                            {q.isPrimary && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">Primary</span>
                            )}
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
                            <select 
                              className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.educationType ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} 
                              value={q.educationType || ''} 
                              onChange={e => {
                                updateArray('qualifications', idx, 'educationType', e.target.value);
                                setEduFieldErrors({...eduFieldErrors, educationType: false});
                                if (e.target.value) setEduError('');
                              }}
                            >
                              <option value="">Select education type</option>
                              {educationTypeOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          {isSchool && (
                            <>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Board <span className="text-red-500">*</span></label>
                                <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.board ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.board || ''} onChange={e => { updateArray('qualifications', idx, 'board', e.target.value); setEduFieldErrors({...eduFieldErrors, board: false}); }}>
                                  <option value="">Select board</option>
                                  <option value="CBSE">CBSE</option>
                                  <option value="ICSE">ICSE</option>
                                  <option value="State Board">State Board</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Passing out year <span className="text-red-500">*</span></label>
                                <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.endYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.endYear || ''} onChange={e => { updateArray('qualifications', idx, 'endYear', e.target.value); setEduFieldErrors({...eduFieldErrors, endYear: false}); }}>
                                  <option value="">Select passing out year</option>
                                  {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">School medium <span className="text-red-500">*</span></label>
                                <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.schoolMedium ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.schoolMedium || ''} onChange={e => { updateArray('qualifications', idx, 'schoolMedium', e.target.value); setEduFieldErrors({...eduFieldErrors, schoolMedium: false}); }}>
                                  <option value="">Select medium</option>
                                  <option value="English">English</option>
                                  <option value="Hindi">Hindi</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Marks <span className="text-red-500">*</span></label>
                                <input type="text" className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.percentage ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} placeholder="% marks of 100 maximum" value={q.percentage || ''} onChange={e => { updateArray('qualifications', idx, 'percentage', e.target.value.replace(/\D/g, '')); setEduFieldErrors({...eduFieldErrors, percentage: false}); }} />
                              </div>
                            </>
                          )}

                          {isHigher && (
                            <>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">University/Institute <span className="text-red-500">*</span></label>
                                <input type="text" className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.university ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} placeholder="Select university/institute" value={q.university || ''} onChange={e => { updateArray('qualifications', idx, 'university', e.target.value); setEduFieldErrors({...eduFieldErrors, university: false}); }} />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Course <span className="text-red-500">*</span></label>
                                <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.course ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.course || ''} onChange={e => { updateArray('qualifications', idx, 'course', e.target.value); setEduFieldErrors({...eduFieldErrors, course: false}); }}>
                                  <option value="">Select course</option>
                                  {(() => {
                                    const opts = q.educationType === 'Accounting Degree' ? accountingDegrees :
                                      q.educationType === 'Post Graduate Accounting & Finance' ? postGradAccountingDegrees :
                                      q.educationType === 'Professional Qualification' ? professionalQualifications :
                                      q.educationType === 'Accounting Certification' ? accountingCertifications :
                                      q.educationType === 'Diploma' ? diplomaCourses :
                                      q.educationType === 'Accounting Software' ? accountingSoftwareCourses :
                                      q.educationType === 'Taxation' ? taxationCourses :
                                      q.educationType === 'Audit' ? auditCourses :
                                      q.educationType === 'Finance' ? financeCourses :
                                      q.educationType === 'International Accounting' ? internationalAccountingCourses :
                                      null;
                                      
                                      if (opts) {
                                        return opts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>);
                                      } else {
                                        return (
                                          <>
                                            <option value="B.Tech/B.E.">B.Tech/B.E.</option>
                                            <option value="B.Sc">B.Sc</option>
                                            <option value="B.Com">B.Com</option>
                                            <option value="B.A">B.A</option>
                                            <option value="BBA">BBA</option>
                                            <option value="M.Tech/M.E.">M.Tech/M.E.</option>
                                            <option value="MBA/PGDM">MBA/PGDM</option>
                                            <option value="MCA">MCA</option>
                                          </>
                                        );
                                      }
                                  })()}
                                </select>
                              </div>
                              <div>
                                <label className={`block text-sm font-bold ${eduFieldErrors.courseType ? 'text-red-500' : 'text-gray-900'} mb-3`}>Course type <span className="text-red-500">*</span></label>
                                <div className="flex flex-wrap items-center gap-6">
                                  <label className="flex items-center cursor-pointer group">
                                    <input type="radio" name={`courseType-${idx}`} value="Full time" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={q.courseType === 'Full time'} onChange={(e) => { updateArray('qualifications', idx, 'courseType', e.target.value); setEduFieldErrors({...eduFieldErrors, courseType: false}); }} />
                                    <span className={`ml-2.5 text-[15px] ${q.courseType === 'Full time' ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>Full time</span>
                                  </label>
                                  <label className="flex items-center cursor-pointer group">
                                    <input type="radio" name={`courseType-${idx}`} value="Part time" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={q.courseType === 'Part time'} onChange={(e) => { updateArray('qualifications', idx, 'courseType', e.target.value); setEduFieldErrors({...eduFieldErrors, courseType: false}); }} />
                                    <span className={`ml-2.5 text-[15px] ${q.courseType === 'Part time' ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>Part time</span>
                                  </label>
                                  <label className="flex items-center cursor-pointer group">
                                    <input type="radio" name={`courseType-${idx}`} value="Correspondence/Distance learning" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={q.courseType === 'Correspondence/Distance learning'} onChange={(e) => { updateArray('qualifications', idx, 'courseType', e.target.value); setEduFieldErrors({...eduFieldErrors, courseType: false}); }} />
                                    <span className={`ml-2.5 text-[15px] ${q.courseType === 'Correspondence/Distance learning' ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>Correspondence/Distance learning</span>
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Course duration <span className="text-red-500">*</span></label>
                                <div className="flex items-center gap-4">
                                  <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.startYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.startYear || ''} onChange={e => { updateArray('qualifications', idx, 'startYear', e.target.value); setEduFieldErrors({...eduFieldErrors, startYear: false}); }}>
                                    <option value="">Starting year</option>
                                    {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                                  <span className="font-bold text-gray-900">To</span>
                                  <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.endYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.endYear || ''} onChange={e => { updateArray('qualifications', idx, 'endYear', e.target.value); setEduFieldErrors({...eduFieldErrors, endYear: false}); }}>
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
                                  <option value="Not Applicable">Not Applicable</option>
                                </select>
                              </div>
                              {q.gradingSystem && q.gradingSystem !== 'Not Applicable' && (
                                <div>
                                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Marks <span className="text-red-500">*</span></label>
                                  <input type="text" className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.percentage ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} placeholder="Enter grade or marks" value={q.percentage || ''} onChange={e => { updateArray('qualifications', idx, 'percentage', e.target.value.replace(/[^0-9.]/g, '')); setEduFieldErrors({...eduFieldErrors, percentage: false}); }} />
                                </div>
                              )}
                            </>
                          )}
                          
                          {q.educationType && (
                            <div className="flex items-center pt-2 border-t border-gray-100 mt-4">
                              <input type="checkbox" id={`primary-edu-${idx}`} className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500" checked={q.isPrimary || false} onChange={e => updateArray('qualifications', idx, 'isPrimary', e.target.checked)} />
                              <label htmlFor={`primary-edu-${idx}`} className="ml-3 text-gray-700 font-medium">Mark this as my primary education</label>
                            </div>
                          )}

                          <div className="flex justify-end mt-4">
                            <button type="button" onClick={handleSaveEducation} className="px-6 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-sm">Save</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-4">
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                      {eduError && <span className="text-red-500 text-xs font-medium">{eduError}</span>}
                      <button type="button" onClick={handleAddEducation} className="text-green-500 font-semibold hover:text-green-600 text-sm">
                        Add +
                      </button>
                    </div>
                  </div>
                </div>
              </div>); };

  const Step3Experience = () => { return (<div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
              <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Work Experience</h3>
                </div>
                <div className="flex items-center gap-3">
                  {expError && <span className="text-red-500 text-xs font-medium">{expError}</span>}
                  <button type="button" onClick={handleAddExperience} className="text-green-500 font-semibold hover:text-green-600 text-sm">
                    Add +
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                      <div className="flex flex-col items-start gap-3 mb-6">
                        <label className="text-sm font-medium text-gray-700">Are you a Fresher?</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center cursor-pointer group">
                            <input type="radio" name="isFresher_onboarding" value="yes" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={formData.isFresher === true} onChange={() => setFormData({...formData, isFresher: true})} />
                            <span className={`ml-2.5 text-[15px] ${formData.isFresher === true ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>Yes, I am a Fresher</span>
                          </label>
                          <label className="flex items-center cursor-pointer group">
                            <input type="radio" name="isFresher_onboarding" value="no" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={formData.isFresher === false} onChange={() => setFormData({...formData, isFresher: false})} />
                            <span className={`ml-2.5 text-[15px] ${formData.isFresher === false ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>No, I have experience</span>
                          </label>
                        </div>
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
                                  <input type="text" className={`w-full px-4 py-3 bg-white border ${expFieldErrors.companyName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={exp.companyName || ''} onChange={e => {
                                    const newExp = [...(formData.experience || [])];
                                    newExp[cIdx].companyName = e.target.value;
                                    setFormData({...formData, experience: newExp});
                                    setExpFieldErrors({...expFieldErrors, companyName: false});
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
                                        <input type="text" className={`w-full px-4 py-3 bg-white border ${expFieldErrors.roles?.[rIdx]?.jobTitle ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={role.jobTitle || ''} onChange={e => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].roles[rIdx].jobTitle = e.target.value;
                                          setFormData({...formData, experience: newExp});
                                          if (expFieldErrors.roles?.[rIdx]?.jobTitle) {
                                            const newErrors = {...expFieldErrors};
                                            newErrors.roles[rIdx].jobTitle = false;
                                            setExpFieldErrors(newErrors);
                                          }
                                        }} />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">Employment Type <span className="text-red-500">*</span></label>
                                        <select className={`w-full px-4 py-3 bg-white border ${expFieldErrors.roles?.[rIdx]?.employmentType ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={role.employmentType || ''} onChange={e => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].roles[rIdx].employmentType = e.target.value;
                                          setFormData({...formData, experience: newExp});
                                          if (expFieldErrors.roles?.[rIdx]?.employmentType) {
                                            const newErrors = {...expFieldErrors};
                                            newErrors.roles[rIdx].employmentType = false;
                                            setExpFieldErrors(newErrors);
                                          }
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
                                          <div className={`${expFieldErrors.roles?.[rIdx]?.joiningDate ? 'rounded-xl ring-1 ring-red-500 border-red-500' : ''}`}>
                                            <CustomMonthPicker
                                              value={role.joiningDate || ''}
                                              onChange={val => {
                                                const newExp = [...(formData.experience || [])];
                                                newExp[cIdx].roles[rIdx].joiningDate = val;
                                                setFormData({...formData, experience: newExp});
                                                if (expFieldErrors.roles?.[rIdx]?.joiningDate) {
                                                  const newErrors = {...expFieldErrors};
                                                  newErrors.roles[rIdx].joiningDate = false;
                                                  setExpFieldErrors(newErrors);
                                                }
                                              }}
                                              placeholder="Select joining date"
                                            />
                                          </div>
                                        </div>
                                        {!role.currentCompany && (
                                          <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Leaving <span className="text-red-500">*</span></label>
                                            <div className={`${expFieldErrors.roles?.[rIdx]?.leavingDate ? 'rounded-xl ring-1 ring-red-500 border-red-500' : ''}`}>
                                              <CustomMonthPicker
                                                value={role.leavingDate || ''}
                                                onChange={val => {
                                                  const newExp = [...(formData.experience || [])];
                                                  newExp[cIdx].roles[rIdx].leavingDate = val;
                                                  setFormData({...formData, experience: newExp});
                                                  if (expFieldErrors.roles?.[rIdx]?.leavingDate) {
                                                    const newErrors = {...expFieldErrors};
                                                    newErrors.roles[rIdx].leavingDate = false;
                                                    setExpFieldErrors(newErrors);
                                                  }
                                                }}
                                                placeholder="Select leaving date"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="col-span-2 mt-6">
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
                                      <option value="45 Days">45 Days</option>
                                      <option value="60 Days">60 Days</option>
                                      <option value="90 Days">90 Days</option>
                                    </select>
                                  </div>
                                )}
                                
                                <div className="flex justify-end pt-4 mt-2">
                                  <button type="button" onClick={handleSaveExperience} className="px-6 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors shadow-sm">Save</button>
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
              {(p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : []).map(skill => (
                <span key={skill} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors" onClick={() => removeSkill(skill)} title="Click to remove">
                  {skill} <span className="text-[10px]">✕</span>
                </span>
              ))}
            </div>
            <CustomDropdown
              options={allSkillsOptions}
              value=""
              onChange={val => {
                if (val) {
                  const currentSkills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(s=>s) : [];
                  if (!currentSkills.includes(val)) {
                    currentSkills.push(val);
                    setFormData({...formData, professionalDetails: {...p, skills: currentSkills.join(', ')}});
                  }
                }
              }}
              placeholder="Search or select a skill to add..."
            />
            {(() => {
              const suggested = getSuggestedSkills(p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : []);
              if (suggested.length === 0) return null;
              return (
                <div className="mt-5">
                  <p className="text-[13px] text-gray-500 font-medium mb-3">Based on your current selection</p>
                  <div className="flex flex-wrap gap-2">
                    {suggested.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          const currentSkills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(s=>s) : [];
                          if (!currentSkills.includes(suggestion)) {
                            currentSkills.push(suggestion);
                            setFormData({...formData, professionalDetails: {...p, skills: currentSkills.join(', ')}});
                          }
                        }}
                        className="px-4 py-2 bg-white text-[#64748B] rounded-full text-[13px] font-medium border border-gray-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all flex items-center gap-1 shadow-sm"
                      >
                        {suggestion} <span className="text-lg leading-none font-normal">+</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
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
            {currentStep !== 1 && (
              <button type="button" onClick={() => navigate('/profile')} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                Skip for now
              </button>
            )}
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
