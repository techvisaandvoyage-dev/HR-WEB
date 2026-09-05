import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCropperModal from '../common/ImageCropperModal';
import EmployeeNavbar from '../common/EmployeeNavbar';
import CustomDropdown from '../common/CustomDropdown';
import InstituteAutocomplete from '../common/InstituteAutocomplete';
import CustomMonthPicker from '../common/CustomMonthPicker';
import MultiSelectLocationDropdown from '../common/MultiSelectLocationDropdown';
import { allSkillsOptions, getSuggestedSkills } from '../../utils/skillsData';
import { currentLocationOptions, preferredLocationOptions } from '../../data/preferredLocations';
import { uploadFileToStorage } from '../../utils/firebaseStorage';

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

const boardOptions = [
  { label: '-----All India-----', isGroupLabel: true },
  { value: 'CBSE', label: 'CBSE (Central Board of Secondary Education)' },
  { value: 'ICSE', label: 'ICSE/ISC (Council for the Indian School Certificate Examinations)' },
  { value: 'NIOS', label: 'NIOS (National Open School)' },
  { value: 'IB/IGCSE', label: 'IB (International Baccalaureate)' },
  { label: '-----State Boards-----', isGroupLabel: true },
  { value: 'Andhra Pradesh Board', label: 'Andhra Pradesh Board of Secondary Education' },
  { value: 'Assam Board', label: 'Assam Board of Secondary Education' },
  { value: 'Bihar Board', label: 'Bihar School Examination Board' },
  { value: 'Chhattisgarh Board', label: 'Chhattisgarh Board of Secondary Education' },
  { value: 'Goa Board', label: 'Goa Board of Secondary & Higher Secondary Education' },
  { value: 'Gujarat Board', label: 'Gujarat Secondary & Higher Secondary Education Board' },
  { value: 'Haryana Board', label: 'Haryana Board of School Education' },
  { value: 'Himachal Pradesh Board', label: 'Himachal Pradesh Board of School Education' },
  { value: 'J&K Board', label: 'J&K State Board of School Education' },
  { value: 'Jharkhand Board', label: 'Jharkhand Academic Council' },
  { value: 'Karnataka Board', label: 'Karnataka Secondary Education Examination Board' },
  { value: 'Kerala Board', label: 'Kerala Board of Public Examinations' },
  { value: 'Madhya Pradesh Board', label: 'Madhya Pradesh Board of Secondary Education' },
  { value: 'Maharashtra Board', label: 'Maharashtra State Board of Secondary & Higher Secondary Education' },
  { value: 'Manipur Board', label: 'Manipur Board of Secondary Education' },
  { value: 'Meghalaya Board', label: 'Meghalaya Board of School Education' },
  { value: 'Mizoram Board', label: 'Mizoram Board of School Education' },
  { value: 'Nagaland Board', label: 'Nagaland Board of School Education' },
  { value: 'Odisha Board', label: 'Odisha Board of Secondary Education' },
  { value: 'Punjab Board', label: 'Punjab School Education Board' },
  { value: 'Rajasthan Board', label: 'Rajasthan Board of Secondary Education' },
  { value: 'Tamil Nadu Board', label: 'Tamil Nadu Board of Secondary Education' },
  { value: 'Telangana Board', label: 'Telangana Board of Secondary Education' },
  { value: 'Tripura Board', label: 'Tripura Board of Secondary Education' },
  { value: 'UP Board', label: 'Uttar Pradesh Madhyamik Shiksha Parishad' },
  { value: 'Uttarakhand Board', label: 'Uttarakhand Board of School Education' },
  { value: 'West Bengal Board', label: 'West Bengal Board of Secondary Education' },
  { value: 'Other State Board', label: 'Other State Board' },
];

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

const gradingSystemOptions = [
  { value: 'Scale 10 Grading System', label: 'Scale 10 Grading System' },
  { value: 'Scale 4 Grading System', label: 'Scale 4 Grading System' },
  { value: '% Marks of 100 Maximum', label: '% Marks of 100 Maximum' },
  { value: 'Not Applicable', label: 'Not Applicable' }
];

const startYearOptions = Array.from({length: 30}, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: String(year), label: String(year) };
});

const endYearOptions = Array.from({length: 30}, (_, i) => {
  const year = new Date().getFullYear() - i + 5;
  return { value: String(year), label: String(year) };
});

const undergradCourses = [
  { value: 'B.A', label: 'B.A (Bachelor of Arts)' },
  { value: 'B.Sc', label: 'B.Sc (Bachelor of Science)' },
  { value: 'B.Com', label: 'B.Com (Bachelor of Commerce)' },
  { value: 'B.Tech/B.E.', label: 'B.Tech/B.E. (Bachelor of Technology/Engineering)' },
  { value: 'BBA', label: 'BBA (Bachelor of Business Administration)' },
  { value: 'BCA', label: 'BCA (Bachelor of Computer Applications)' },
  { value: 'B.Arch', label: 'B.Arch (Bachelor of Architecture)' },
  { value: 'B.Des', label: 'B.Des (Bachelor of Design)' },
  { value: 'B.Ed', label: 'B.Ed (Bachelor of Education)' },
  { value: 'BFA', label: 'BFA (Bachelor of Fine Arts)' },
  { value: 'B.Pharm', label: 'B.Pharm (Bachelor of Pharmacy)' },
  { value: 'BSN', label: 'BSN (Bachelor of Science in Nursing)' },
  { value: 'LLB', label: 'LLB (Bachelor of Laws)' },
  { value: 'MBBS', label: 'MBBS (Bachelor of Medicine)' },
  { value: 'BDS', label: 'BDS (Bachelor of Dental Surgery)' },
  { value: 'BPT', label: 'BPT (Bachelor of Physiotherapy)' },
  { value: 'BAMS', label: 'BAMS (Bachelor of Ayurvedic Medicine and Surgery)' },
  { value: 'BHMS', label: 'BHMS (Bachelor of Homeopathic Medicine and Surgery)' },
  { value: 'B.V.Sc', label: 'B.V.Sc (Bachelor of Veterinary Science)' },
  { value: 'BHM', label: 'BHM (Bachelor of Hotel Management)' },
  { value: 'B.Sc (Agriculture)', label: 'B.Sc (Agriculture)' },
  { value: 'B.Sc (IT)', label: 'B.Sc (Information Technology)' },
  { value: 'B.Sc (Computer Science)', label: 'B.Sc (Computer Science)' },
  { value: 'BMM', label: 'BMM (Bachelor of Mass Media)' },
  { value: 'BJMC', label: 'BJMC (Bachelor of Journalism and Mass Communication)' },
  { value: 'BMS', label: 'BMS (Bachelor of Management Studies)' },
  { value: 'BBA LLB', label: 'BBA LLB' },
  { value: 'B.A. LLB', label: 'B.A. LLB' }
];

const postgradCourses = [
  { value: 'M.A', label: 'M.A (Master of Arts)' },
  { value: 'M.Sc', label: 'M.Sc (Master of Science)' },
  { value: 'M.Com', label: 'M.Com (Master of Commerce)' },
  { value: 'M.Tech/M.E.', label: 'M.Tech/M.E. (Master of Technology/Engineering)' },
  { value: 'MBA/PGDM', label: 'MBA/PGDM (Master of Business Administration)' },
  { value: 'MCA', label: 'MCA (Master of Computer Applications)' },
  { value: 'M.Arch', label: 'M.Arch (Master of Architecture)' },
  { value: 'M.Des', label: 'M.Des (Master of Design)' },
  { value: 'M.Ed', label: 'M.Ed (Master of Education)' },
  { value: 'M.Pharm', label: 'M.Pharm (Master of Pharmacy)' },
  { value: 'LLM', label: 'LLM (Master of Laws)' },
  { value: 'MD/MS', label: 'MD/MS (Doctor of Medicine/Master of Surgery)' },
  { value: 'MDS', label: 'MDS (Master of Dental Surgery)' },
  { value: 'MPT', label: 'MPT (Master of Physiotherapy)' },
  { value: 'MHA', label: 'MHA (Master of Hospital Administration)' },
  { value: 'MPH', label: 'MPH (Master of Public Health)' },
  { value: 'M.V.Sc', label: 'M.V.Sc (Master of Veterinary Science)' },
  { value: 'MHM', label: 'MHM (Master of Hotel Management)' },
  { value: 'M.Sc (Agriculture)', label: 'M.Sc (Agriculture)' },
  { value: 'M.Sc (IT)', label: 'M.Sc (Information Technology)' },
  { value: 'MSW', label: 'MSW (Master of Social Work)' },
  { value: 'MFC', label: 'MFC (Master of Finance and Control)' },
  { value: 'MHRM', label: 'MHRM (Master of Human Resource Management)' }
];

const doctoralAndOtherCourses = [
  { value: 'Ph.D', label: 'Ph.D (Doctor of Philosophy)' },
  { value: 'M.Phil', label: 'M.Phil (Master of Philosophy)' },
  { value: 'Post Doctoral Fellow', label: 'Post Doctoral Fellow' },
  { value: 'PG Diploma', label: 'PG Diploma' },
  { value: 'Diploma', label: 'Diploma / Advanced Diploma' },
  { value: 'Associate Degree', label: 'Associate Degree (A.A. / A.S.)' },
  { value: 'Certificate', label: 'Certificate Course' },
  { value: 'ITI', label: 'ITI (Industrial Training Institute)' },
  { value: 'NCVT', label: 'NCVT (National Council for Vocational Training)' },
  { value: 'GNM', label: 'GNM (General Nursing and Midwifery)' },
  { value: 'ANM', label: 'ANM (Auxiliary Nurse Midwifery)' },
  { value: 'D.Pharm', label: 'D.Pharm (Diploma in Pharmacy)' },
  { value: 'Other', label: 'Other Course' }
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


const employmentTypeOptions = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Internship', label: 'Internship' }
];

const noticePeriodOptions = [
  { value: '15 Days', label: '15 Days' },
  { value: '30 Days', label: '30 Days' },
  { value: '60 Days', label: '60 Days' },
  { value: '90+ Days', label: '90+ Days' },
  { value: 'Immediately available', label: 'Immediately available' }
];

const designationOptions = [
  // Tech & Engineering
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'Senior Software Engineer', label: 'Senior Software Engineer' },
  { value: 'Frontend Developer', label: 'Frontend Developer' },
  { value: 'Backend Developer', label: 'Backend Developer' },
  { value: 'Full Stack Developer', label: 'Full Stack Developer' },
  { value: 'Mobile App Developer', label: 'Mobile App Developer' },
  { value: 'DevOps Engineer', label: 'DevOps Engineer' },
  { value: 'QA Engineer', label: 'QA Engineer' },
  { value: 'System Administrator', label: 'System Administrator' },
  { value: 'Database Administrator', label: 'Database Administrator' },
  { value: 'Cloud Architect', label: 'Cloud Architect' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'Data Analyst', label: 'Data Analyst' },
  { value: 'Machine Learning Engineer', label: 'Machine Learning Engineer' },
  { value: 'Network Engineer', label: 'Network Engineer' },
  { value: 'Security Analyst', label: 'Security Analyst' },
  
  // Product & Design
  { value: 'Product Manager', label: 'Product Manager' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Scrum Master', label: 'Scrum Master' },
  { value: 'UI/UX Designer', label: 'UI/UX Designer' },
  { value: 'Graphic Designer', label: 'Graphic Designer' },
  { value: 'Product Designer', label: 'Product Designer' },

  // Business, Sales & Marketing
  { value: 'Marketing Executive', label: 'Marketing Executive' },
  { value: 'Digital Marketing Manager', label: 'Digital Marketing Manager' },
  { value: 'Content Writer', label: 'Content Writer' },
  { value: 'SEO Specialist', label: 'SEO Specialist' },
  { value: 'Sales Manager', label: 'Sales Manager' },
  { value: 'Sales Executive', label: 'Sales Executive' },
  { value: 'Business Development Manager', label: 'Business Development Manager' },
  { value: 'Account Manager', label: 'Account Manager' },
  { value: 'Customer Success Manager', label: 'Customer Success Manager' },

  // Finance, HR & Ops
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'HR Executive', label: 'HR Executive' },
  { value: 'Talent Acquisition Specialist', label: 'Talent Acquisition Specialist' },
  { value: 'Financial Analyst', label: 'Financial Analyst' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Operations Manager', label: 'Operations Manager' },
  { value: 'Business Analyst', label: 'Business Analyst' },
  { value: 'Consultant', label: 'Consultant' },
  { value: 'Legal Advisor', label: 'Legal Advisor' },
  
  { value: 'Other', label: 'Other Designation' }
];

const experienceOptions = [
  { value: '0 - 1 Yrs', label: '0 - 1 Yrs' },
  { value: '2 - 3 Yrs', label: '2 - 3 Yrs' },
  { value: '4 - 6 Yrs', label: '4 - 6 Yrs' },
  { value: '7 - 10 Yrs', label: '7 - 10 Yrs' },
  { value: '11 - 15 Yrs', label: '11 - 15 Yrs' },
  { value: '16 - 20 Yrs', label: '16 - 20 Yrs' },
  { value: '21 - 25 Yrs', label: '21 - 25 Yrs' },
  { value: '25+ yrs', label: '25+ yrs' }
];

const salaryTypeOptions = [
  { value: 'Yearly', label: 'Yearly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Hourly', label: 'Hourly' }
];

const currencyOptions = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'SGD', label: 'SGD ($)' },
  { value: 'AED', label: 'AED (د.إ)' }
];



const EmployeeProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');
  const [expandedEduIndex, setExpandedEduIndex] = useState(-1);
  const [expandedExpIndex, setExpandedExpIndex] = useState(-1);
  const [expandedRoleIndex, setExpandedRoleIndex] = useState(0);
  const [skillInput, setSkillInput] = useState('');
  const [isMissingDetailsModalOpen, setIsMissingDetailsModalOpen] = useState(false);
  const [modalMissingItems, setModalMissingItems] = useState([]);
  const [expError, setExpError] = useState('');
  const [expFieldErrors, setExpFieldErrors] = useState({});
  const [eduError, setEduError] = useState('');
  const [eduFieldErrors, setEduFieldErrors] = useState({});
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [isEditingBasicOnMobile, setIsEditingBasicOnMobile] = useState(false);
  const [isEditingSummaryOnMobile, setIsEditingSummaryOnMobile] = useState(false);
  const [isEditingProfOverviewMobile, setIsEditingProfOverviewMobile] = useState(false);
  const [isEditingSkillsMobile, setIsEditingSkillsMobile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [docError, setDocError] = useState({ resume: '', coverLetter: '' });
  const [formData, setFormData] = useState({
    firstName: 'Yash Raj',
    lastName: 'Singh',
    phone: '9876543210',
    email: 'yash@example.com',
    brief: '',
    avatar: '',
    qualifications: [],
    isFresher: false,
    experience: [],
    location: '',
    preferredLocation: '',
    industry: '',
    designation: '',
    totalExperience: '',
    professionalDetails: {
      currentSalary: '',
      expectedSalary: '',
      linkedinUrl: '',
      majorAchievements: '',
      skills: ''
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse profile data");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('userProfile', JSON.stringify(formData));
      localStorage.setItem('hasProfile', 'true');

      const timer = setTimeout(async () => {
        try {
          const token = localStorage.getItem('employeeToken');
          if (token) {
            await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(formData)
            });
          }
        } catch (err) {
          console.error("Profile autosave error:", err);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [formData, isLoaded]);

  const p = formData.professionalDetails || {};
  const setP = (field, val) => setFormData({...formData, professionalDetails: {...p, [field]: val}});
  const docs = formData.documents || {};
  const setDoc = (field, val) => setFormData({...formData, documents: {...docs, [field]: val}});

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setDocError(prev => ({...prev, [type]: ''}));

    if (file.size > 300 * 1024) { // 300KB limit
      setDocError(prev => ({...prev, [type]: 'File size should not exceed 300KB'}));
      e.target.value = ''; // Reset input
      return;
    }

    setIsUploading(true);
    try {
      const downloadURL = await uploadFileToStorage(file, `resumes`);
      setDoc(type, downloadURL);
    } catch (error) {
      console.error("Upload error:", error);
      setDocError(prev => ({...prev, [type]: 'Failed to upload document.'}));
    } finally {
      setIsUploading(false);
    }
  };

  const getFileName = (url) => {
    if (!url) return '';
    if (!url.startsWith('http')) return url;
    return "Uploaded Document (Click to view)";
  };
  const updateArray = (field, index, key, value) => {
    const newArr = [...(formData[field] || [])];
    newArr[index] = { ...newArr[index], [key]: value };
    setFormData({ ...formData, [field]: newArr });
  };
  const addArrayItem = (field, defaultObj) => {
    setFormData({ ...formData, [field]: [...(formData[field] || []), defaultObj] });
  };
  const removeArrayItem = (field, index) => {
    const newArr = [...(formData[field] || [])];
    newArr.splice(index, 1);
    setFormData({ ...formData, [field]: newArr });
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val) {
        const currentSkills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : [];
        if (!currentSkills.includes(val)) {
          setP('skills', [...currentSkills, val].join(', '));
        }
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skillToRemove) => {
    const currentSkills = p.skills ? p.skills.split(',').map(s=>s.trim()).filter(s => s) : [];
    setP('skills', currentSkills.filter(s => s !== skillToRemove).join(', '));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Details' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Work Experience' },
    { id: 'professional', label: 'Professional Overview' },
    { id: 'documents', label: 'Documents' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    tabs.forEach(tab => {
      const el = document.getElementById(tab.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tabs]);

  const calculateProfileCompletion = () => {
    let score = 0;
    const missing = [];

    if (formData.firstName && formData.lastName) score += 10;
    else missing.push({ label: 'Add Full Name', points: 10, target: 'basic' });

    if (formData.phone) score += 10;
    else missing.push({ label: 'Add Phone Number', points: 10, target: 'basic' });

    if (!formData.isFresher) {
      if (formData.designation && formData.professionalDetails?.currentSalary) {
        score += 10;
      } else {
        missing.push({ label: 'Professional Overview', points: 10, target: 'professional' });
      }
    } else {
      if (formData.professionalDetails?.expectedSalary) {
        score += 10;
      } else {
        missing.push({ label: 'Professional Overview', points: 10, target: 'professional' });
      }
    }

    if (formData.brief) {
      score += 10;
    } else {
      missing.push({ label: 'Add Brief about yourself', target: 'basic', points: 10 });
    }

    if (formData.avatar) {
      score += 5;
    } else {
      missing.push({ label: 'Add Profile Picture', target: 'basic', points: 5 });
    }

    if (formData.qualifications && formData.qualifications.length > 0) score += 15;
    else missing.push({ label: 'Add Education', points: 15, target: 'education' });
    
    if (formData.isFresher || (formData.experience && formData.experience.length > 0)) score += 15;
    else missing.push({ label: 'Add Work Experience', points: 15, target: 'experience' });

    if (formData.professionalDetails?.skills) score += 10;
    else missing.push({ label: 'Add Skills', points: 10, target: 'professional' });

    if (docs.resume) {
      score += 15;
    } else {
      missing.push({ label: 'Upload Resume', target: 'documents', points: 15 });
    }

    return { score, missing };
  };

  const { score, missing } = calculateProfileCompletion();
  const dashoffset = 377 - (377 * score / 100);

  const renderHeader = () => (
    <>
    {/* DESKTOP HEADER */}
    <div className="hidden md:flex bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex-row gap-8 items-center">
      
      {/* Left: Avatar with progress ring */}
      <div className="relative flex-shrink-0 group">
        <div className="cursor-pointer block relative z-10" onClick={() => setIsAvatarModalOpen(true)}>
          <div className="w-32 h-32 rounded-full border-4 border-[#F3F4F6] flex items-center justify-center bg-[#E5E7EB] overflow-hidden group-hover:opacity-90 transition-opacity relative">
            {formData.avatar ? (
              <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-20 h-20 text-white translate-y-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>

          {/* Edit Pen Icon */}
          <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-gray-500 group-hover:text-green-600 group-hover:bg-green-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
        </div>
        {/* SVG overlay for circular progress */}
        <svg className="absolute inset-0 w-32 h-32 transform -rotate-90 pointer-events-none transition-all duration-1000 ease-out z-0">
           <circle cx="64" cy="64" r="60" stroke={score === 100 ? "#16a34a" : "#F59E0B"} strokeWidth="4" fill="none" strokeDasharray="377" strokeDashoffset={dashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 rounded-full text-xs font-bold border border-gray-100 shadow-md transition-colors duration-1000 z-20 ${score === 100 ? 'text-green-600' : 'text-orange-500'}`}>
          {score}%
        </div>
      </div>

      {/* Middle: Name and details */}
      <div className="flex-1 space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {formData.firstName} {formData.lastName}
            <button className="text-gray-400 hover:text-palette-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Profile last updated - Today</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
          <div className="space-y-3">
            <p className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {formData.location || 'Location not set'}
            </p>
            <p className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {formData.isFresher ? 'Fresher' : 'Experienced'}
            </p>

          </div>
          <div className="space-y-3 sm:border-l sm:border-gray-100 sm:pl-6">
            <p className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {formData.phone || 'N/A'}
              <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </p>
            <p className="flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {formData.email}
              <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Missing details widget */}
      <div className="w-full md:w-80 bg-[#FFF8EE] rounded-xl p-6 border border-orange-100 space-y-5 flex-shrink-0 self-stretch flex flex-col justify-between">
        <ul className="space-y-4 text-sm font-semibold text-gray-700">
          {missing.slice(0, 3).map((item, idx) => (
            <li key={idx} className="flex items-center justify-between cursor-pointer group" onClick={() => {
              if (item.label === 'Add Profile Picture') {
                setIsAvatarModalOpen(true);
              } else {
                document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' });
              }
            }}>
              <span className="flex items-center gap-3 group-hover:text-green-600 transition-colors">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-500 shadow-sm group-hover:border-green-300 group-hover:text-green-600 transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </div>
                {item.label}
              </span>
              <span className="text-green-600 font-bold bg-white px-2 py-1 rounded border border-green-100 text-xs shadow-sm">↑ {item.points}%</span>
            </li>
          ))}
          {missing.length === 0 && (
            <li className="text-green-600 font-bold text-center py-8">
              <span className="text-3xl block mb-2">🎉</span>
              Your profile is 100% complete!
            </li>
          )}
        </ul>
        {missing.length > 0 && (
          <button onClick={() => {
            setModalMissingItems(missing);
            setIsMissingDetailsModalOpen(true);
          }} className="w-full py-2.5 mt-2 bg-[#F05A41] hover:bg-[#d94a32] text-white font-bold rounded-full transition-all shadow-lg shadow-[#F05A41]/30 hover:shadow-[#F05A41]/50 transform hover:-translate-y-0.5">
            Add {missing.length} missing detail{missing.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

    </div>

    {/* MOBILE HEADER */}
    <div className="md:hidden flex flex-col pt-8 pb-4">
      
      {/* 1. Avatar Section */}
      <div className="mb-5">
        <div className="relative inline-block" onClick={() => setIsAvatarModalOpen(true)}>
          <div className="w-[104px] h-[104px] rounded-full bg-[#EAEAF0] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
            {formData.avatar ? (
              <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-16 h-16 text-white translate-y-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>
          {/* Blue + Icon */}
          <div className="absolute bottom-0 right-0 bg-[#2563EB] rounded-full w-[34px] h-[34px] flex items-center justify-center border-[3px] border-white text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          </div>
        </div>
      </div>

      {/* 2. Name & Subtitle */}
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-gray-900 leading-tight mb-1.5 tracking-tight">
          {formData.firstName} {formData.lastName}
        </h1>
        <p className="text-[16px] text-gray-600">
          {(() => {
            const eduList = formData.qualifications || [];
            let highestEdu = null;
            if (eduList.length > 0) {
              const order = ['10th', '12th', 'Graduation/Diploma', 'Masters/Post-Graduation', 'Doctorate/PhD'];
              let maxIdx = -1;
              eduList.forEach(q => {
                const idx = order.indexOf(q.educationType);
                if (idx > maxIdx) {
                  maxIdx = idx;
                  highestEdu = q;
                }
              });
            }
            
            let eduStr = null;
            if (highestEdu) {
              if (highestEdu.educationType === '10th') eduStr = 'Class X';
              else if (highestEdu.educationType === '12th') eduStr = 'Class XII';
              else eduStr = highestEdu.course || highestEdu.educationType;
            }
            
            const locStr = formData.location;
            
            const parts = [];
            if (eduStr) parts.push(eduStr);
            if (locStr) parts.push(locStr);
            
            return parts.length > 0 ? parts.join(', ') : 'Add education & location to complete profile';
          })()}
        </p>
      </div>

      {/* 3. Progress Bar */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-[#EAEAF0] rounded-full overflow-hidden">
          <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${score}%` }}></div>
        </div>
        <span className="text-[#F59E0B] font-bold text-[15px]">{score}%</span>
      </div>
      <p className="text-[13px] text-gray-500 mb-8">Last updated today</p>

      {/* 4. Basic Details Card */}
      <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Basic details</h3>
          {!isEditingBasicOnMobile && (
            <button className="text-[#6B7280] hover:text-[#2563EB] transition-colors" onClick={() => setIsEditingBasicOnMobile(true)}>
              <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>

        {isEditingBasicOnMobile ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">First Name</label>
              <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Last Name</label>
              <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Phone Number</label>
              <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Email (Read Only)</label>
              <input type="text" disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" value={formData.email || ''} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Location</label>
              <MultiSelectLocationDropdown
                options={currentLocationOptions}
                value={formData.location || ''}
                onChange={(val) => setFormData({...formData, location: val})}
                multiple={false}
                placeholder="Select Current Location"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-400"
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setIsEditingBasicOnMobile(false)}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4.5">
            <div className="flex items-center gap-4 mb-4">
              <svg className="w-[20px] h-[20px] text-[#6B7280] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-[16px] text-[#374151]">{formData.location || 'Location not set'}</span>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <svg className="w-[20px] h-[20px] text-[#6B7280] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span className="text-[16px] text-[#374151]">{formData.isFresher ? 'Fresher' : 'Experienced'}</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <svg className="w-[20px] h-[20px] text-[#6B7280] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <div className="flex items-center gap-2">
                <span className="text-[16px] text-[#374151] border-b border-[#9CA3AF] pb-[1px]">{formData.email}</span>
                <svg className="w-[18px] h-[18px] text-[#10B981]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <svg className="w-[20px] h-[20px] text-[#6B7280] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <div className="flex items-center gap-2">
                <span className="text-[16px] text-[#374151]">{formData.phone || '9399886418'}</span>
                {(formData.phone || true) && <svg className="w-[18px] h-[18px] text-[#10B981]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Professional Summary Card */}
      <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 mt-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Professional Summary</h3>
          {!isEditingSummaryOnMobile && (
            <button className="text-[#6B7280] hover:text-[#2563EB] transition-colors" onClick={() => setIsEditingSummaryOnMobile(true)}>
              <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
        
        {isEditingSummaryOnMobile ? (
          <div className="fixed inset-0 z-[120] bg-gray-50 overflow-y-auto md:overflow-visible md:relative md:inset-auto md:z-auto md:bg-transparent md:flex md:flex-col md:space-y-4">
            
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-[130] shadow-sm">
              <h2 className="text-[18px] font-bold text-gray-900">Edit Summary</h2>
              <button onClick={() => setIsEditingSummaryOnMobile(false)} className="text-gray-900 p-2 -mr-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-4 pt-6 md:p-0 flex-1 flex flex-col space-y-4 md:space-y-2">
              <textarea 
                rows="6"
                placeholder="I am a passionate professional..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all custom-scrollbar flex-1 md:flex-none" 
                value={formData.brief || ''} 
                onChange={e => setFormData({...formData, brief: e.target.value})} 
              ></textarea>
              
              {/* Mobile Save Button */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-[130]">
                <button 
                  onClick={() => setIsEditingSummaryOnMobile(false)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-md transition-colors text-[15px]"
                >
                  Save
                </button>
              </div>

              {/* Desktop Save Button */}
              <div className="hidden md:block pt-2">
                <button 
                  onClick={() => setIsEditingSummaryOnMobile(false)}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[15px] text-[#374151] leading-relaxed whitespace-pre-wrap">
            {formData.brief || <span className="text-gray-400 italic">Add a brief summary about yourself...</span>}
          </div>
        )}
      </div>
    </div>
    </>
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
    setExpandedRoleIndex(0);
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans pb-12">
      {/* Navbar */}
      <EmployeeNavbar />

      <ImageCropperModal 
        isOpen={!!cropFile} 
        onClose={() => setCropFile(null)} 
        imageFile={cropFile} 
        onSave={async (croppedUrl) => {
          try {
            setIsUploading(true);
            const res = await fetch(croppedUrl);
            const blob = await res.blob();
            const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const downloadURL = await uploadFileToStorage(file, 'avatars');
            setFormData({...formData, avatar: downloadURL});
          } catch (error) {
            console.error("Avatar upload error:", error);
            alert("Failed to upload profile picture. Please try again.");
          } finally {
            setIsUploading(false);
            setCropFile(null);
            setIsAvatarModalOpen(true);
          }
        }}
        onChangePhoto={() => {
          setCropFile(null);
          setIsAvatarModalOpen(true);
        }}
      />

      {/* Avatar Upload Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white md:bg-black/50 md:backdrop-blur-sm md:p-4 animate-fade-in" onClick={() => setIsAvatarModalOpen(false)}>
          {/* Mobile Top Bar */}
          <div className="md:hidden absolute top-0 left-0 right-0 p-4 z-20 flex items-center bg-white">
             <button onClick={() => setIsAvatarModalOpen(false)} className="text-gray-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
          </div>

          <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-w-2xl shadow-none md:shadow-2xl relative text-left md:text-center pt-[70px] md:pt-10 px-5 md:px-10 pb-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setIsAvatarModalOpen(false)} className="hidden md:block absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            {formData.avatar ? (
              <div className="flex-1 flex flex-col items-center text-center">
                <h3 className="text-2xl md:text-[1.75rem] font-bold text-gray-900 mb-8 mt-4 tracking-tight">Photo upload</h3>
                
                <div className="flex justify-center mb-8 flex-1 items-center">
                  <div className="w-48 h-48 md:w-40 md:h-40 rounded-full border border-gray-200 overflow-hidden shadow-sm">
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="mt-auto w-full">
                  <label className="block cursor-pointer w-full mb-4">
                    <span className="w-full md:w-auto md:px-10 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-full inline-block text-[15px] md:text-lg shadow-md transition-all">
                      Replace Photo
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      if (e.target.files[0]) {
                        setCropFile(e.target.files[0]);
                        setIsAvatarModalOpen(false);
                      }
                    }} />
                  </label>
                  
                  <div className="text-[15px] md:text-lg text-gray-500 mb-4">
                    or <button onClick={() => {
                      setFormData({...formData, avatar: ''});
                      setIsAvatarModalOpen(false);
                    }} className="text-green-600 font-semibold hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col text-left md:text-center">
                <h3 className="text-[26px] md:text-[1.75rem] font-bold text-gray-900 mb-3 md:mt-4 tracking-tight">Photo upload</h3>
                <p className="text-gray-900 md:text-gray-600 font-medium md:font-normal text-[15px] md:text-lg mb-4 md:mb-10 leading-snug">Profile with photo has 40% higher chances of getting noticed by recruiters</p>
                
                <div className="flex justify-center flex-1 items-center mb-8">
                  <div className="w-[260px] h-[260px] rounded-full bg-[#EAEAF0] flex items-center justify-center shadow-inner">
                     <svg className="w-[140px] h-[140px] text-white translate-y-8" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                     </svg>
                  </div>
                </div>

                <div className="mt-auto w-full text-center">
                  <label className="block cursor-pointer w-full mb-4">
                    <span className="w-full md:w-auto md:px-10 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-full inline-block text-[15px] md:text-lg shadow-md transition-all">
                      Upload Photo
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      if (e.target.files[0]) {
                        setCropFile(e.target.files[0]);
                        setIsAvatarModalOpen(false);
                      }
                    }} />
                  </label>

                  <div className="text-[13px] text-gray-500 leading-relaxed mb-4">
                    <p>Supported file formats: PNG, JPG, JPEG, GIF</p>
                    <p>Maximum file size: up to 2MB</p>
                    <a href="#" onClick={e => e.preventDefault()} className="text-green-600 mt-2 inline-block font-medium hover:underline">Terms of Service</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Missing Details Modal */}
      {isMissingDetailsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsMissingDetailsModalOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Complete Your Profile</h3>
                <p className="text-sm text-gray-500 mt-1">Fill in the details below to reach 100%</p>
              </div>
              <button onClick={() => setIsMissingDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors self-start">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {modalMissingItems.map((item, idx) => {
                const completed = !missing.some(m => m.label === item.label);
                return (
                  <div key={idx} className={`p-4 border rounded-xl transition-all ${completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className={`font-bold flex items-center gap-2 ${completed ? 'text-green-700' : 'text-gray-800'}`}>
                        {completed ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                        )}
                        {item.label}
                      </h4>
                      <span className={`${completed ? 'text-green-700 bg-green-100' : 'text-orange-600 bg-orange-100'} font-bold px-2 py-1 rounded text-xs shadow-sm`}>
                        +{item.points}%
                      </span>
                    </div>

                    <div className="pl-7">
                      {item.label === 'Add Full Name' && (
                        <div className="flex gap-3">
                          <input type="text" placeholder="First Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                          <input type="text" placeholder="Last Name" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                        </div>
                      )}

                      {item.label === 'Add Phone Number' && (
                        <input type="text" placeholder="Phone Number" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      )}

                      {item.label === 'Professional Overview' && (
                        <div className="flex flex-col gap-3">
                          <input type="text" placeholder="Current Designation" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500" value={formData.designation || ''} onChange={e => setFormData({...formData, designation: e.target.value})} />
                          <input type="url" placeholder="LinkedIn Profile URL" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500" value={p.linkedinUrl || ''} onChange={e => setP('linkedinUrl', e.target.value)} />
                          <div className="flex gap-3">
                            <select value={p.salaryType || 'Yearly'} onChange={e => setP('salaryType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500 bg-white">
                              <option value="Yearly">Yearly</option>
                              <option value="Monthly">Monthly</option>
                            </select>
                            <select value={p.currency || 'INR'} onChange={e => setP('currency', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500 bg-white">
                              <option value="INR">INR (₹)</option>
                              <option value="USD">USD ($)</option>
                            </select>
                          </div>
                          <div className="flex gap-3">
                            {!formData.isFresher && (
                              <input type="text" placeholder={`Current Salary (${getCurrencySymbol(p.currency)})`} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500" value={p.currentSalary || ''} onChange={e => setP('currentSalary', formatIndianNumber(e.target.value))} />
                            )}
                            <input type="text" placeholder={`Expected Salary (${getCurrencySymbol(p.currency)})`} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500" value={p.expectedSalary || ''} onChange={e => setP('expectedSalary', formatIndianNumber(e.target.value))} />
                          </div>
                        </div>
                      )}

                      {item.label === 'Add Brief about yourself' && (
                        <textarea rows="2" placeholder="Brief about yourself..." className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500 custom-scrollbar" value={formData.brief || ''} onChange={e => setFormData({...formData, brief: e.target.value})} />
                      )}

                      {item.label === 'Add Skills' && (
                        <div>
                          <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500" placeholder="Type a skill and hit Enter" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown} />
                        </div>
                      )}

                      {item.label === 'Upload Resume' && (
                        <>
                          <input type="file" accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" onChange={e => setDoc('resume', e.target.files[0]?.name || '')} />
                          <p className="text-[11px] text-black mt-1 font-medium">Supported Formats: doc, docx, pdf, upto 300kb</p>
                        </>
                      )}

                      {item.label === 'Add Profile Picture' && (
                        <input type="file" accept="image/*" className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer" onChange={e => {
                          if (e.target.files[0]) {
                            setCropFile(e.target.files[0]);
                            setIsMissingDetailsModalOpen(false);
                          }
                        }} />
                      )}

                      {(item.label === 'Add Education' || item.label === 'Add Work Experience') && (
                        <button 
                          onClick={() => {
                            setIsMissingDetailsModalOpen(false);
                            setTimeout(() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' }), 150);
                          }}
                          className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          Go to {item.target} section &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <button onClick={() => setIsMissingDetailsModalOpen(false)} className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-all shadow-md">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1200px] w-full mx-auto px-4 mt-6 space-y-6">
        {/* Back Button */}
        <div className="hidden md:block">
          <button 
            onClick={() => navigate('/employee')}
            className="text-gray-500 hover:text-gray-900 font-semibold text-sm flex items-center gap-2 transition-colors w-fit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </button>
        </div>

        {renderHeader()}

        <div className="flex flex-col md:flex-row gap-6 items-start">


          {/* Right Content Area */}
          <div className="flex-1 animate-fade-in space-y-6 min-h-[500px]">

            {/* Continuous Sections */}
            <section id="basic" className="hidden md:block scroll-mt-40 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="mb-6 pb-2 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">Basic Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">First Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Phone Number</label>
                  <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Email (Read Only)</label>
                  <input type="text" disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" value={formData.email || ''} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Location</label>
                  <MultiSelectLocationDropdown
                    options={currentLocationOptions}
                    value={formData.location || ''}
                    onChange={(val) => setFormData({...formData, location: val})}
                    multiple={false}
                    placeholder="Select Current Location"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-400"
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
              </section>

              <section id="education" className="scroll-mt-40 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Education</h3>
                    <p className="text-sm text-gray-500 mt-1">Details like course, university, and more, help recruiters identify your educational background</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {eduError && <span className="text-red-500 text-xs font-medium">{eduError}</span>}
                    <button onClick={handleAddEducation} className="text-green-500 hover:text-green-600 font-semibold text-sm">
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
                            <button onClick={() => setExpandedEduIndex(idx)} className="text-gray-400 hover:text-blue-600 transition-colors">
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
                      <div key={idx} className="fixed inset-0 z-[120] bg-white overflow-y-auto md:overflow-visible md:relative md:inset-auto md:z-auto md:p-6 md:border md:border-gray-200 md:rounded-xl md:shadow-sm md:flex md:flex-col">
                        
                        {/* Mobile Header */}
                        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-[130] shadow-sm">
                          <h2 className="text-[18px] font-bold text-gray-900">{q.educationType ? 'Edit Education' : 'Add Education'}</h2>
                          <button onClick={() => setExpandedEduIndex(-1)} className="text-gray-900 p-2 -mr-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>

                        {/* Desktop Delete Button */}
                        <button onClick={() => { removeArrayItem('qualifications', idx); setExpandedEduIndex(-1); }} className="hidden md:block absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors z-10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        
                        <div className="space-y-6 pt-6 px-4 pb-[140px] md:pt-2 md:px-0 md:pb-0 flex-1">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Education</label>
                            <CustomDropdown
                              options={educationTypeOptions}
                              value={q.educationType || ''}
                              onChange={val => {
                                updateArray('qualifications', idx, 'educationType', val);
                                setEduFieldErrors({...eduFieldErrors, educationType: false});
                                if (val) setEduError('');
                              }}
                              placeholder="Select education type"
                              error={eduFieldErrors.educationType || (!!eduError && !q.educationType)}
                            />
                          </div>

                          {isSchool && (
                            <>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Board</label>
                                <CustomDropdown 
                                  options={boardOptions}
                                  value={q.board || ''}
                                  onChange={val => { updateArray('qualifications', idx, 'board', val); setEduFieldErrors({...eduFieldErrors, board: false}); }}
                                  placeholder="Select board"
                                  error={eduFieldErrors.board}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Passing out year</label>
                                <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.endYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.endYear || ''} onChange={e => { updateArray('qualifications', idx, 'endYear', e.target.value); setEduFieldErrors({...eduFieldErrors, endYear: false}); }}>
                                  <option value="">Select passing out year</option>
                                  {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">School medium</label>
                                <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.schoolMedium ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.schoolMedium || ''} onChange={e => { updateArray('qualifications', idx, 'schoolMedium', e.target.value); setEduFieldErrors({...eduFieldErrors, schoolMedium: false}); }}>
                                  <option value="">Select medium</option>
                                  <option value="English">English</option>
                                  <option value="Hindi">Hindi</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Marks</label>
                                <input type="text" className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.percentage ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} placeholder="% marks of 100 maximum" value={q.percentage || ''} onChange={e => { updateArray('qualifications', idx, 'percentage', e.target.value); setEduFieldErrors({...eduFieldErrors, percentage: false}); }} />
                              </div>
                            </>
                          )}

                          {isHigher && (
                            <>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">University/Institute</label>
                                <InstituteAutocomplete 
                                  value={q.university || ''}
                                  onChange={val => { updateArray('qualifications', idx, 'university', val); setEduFieldErrors({...eduFieldErrors, university: false}); }}
                                  placeholder="Search global university/institute..."
                                  className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.university ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-400`}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Course</label>
                                <CustomDropdown
                                  options={
                                    q.educationType === 'Masters/Post-Graduation' ? [...postgradCourses, ...doctoralAndOtherCourses] :
                                    q.educationType === 'Accounting Degree' ? accountingDegrees :
                                    q.educationType === 'Post Graduate Accounting & Finance' ? postGradAccountingDegrees :
                                    q.educationType === 'Professional Qualification' ? professionalQualifications :
                                    q.educationType === 'Accounting Certification' ? accountingCertifications :
                                    q.educationType === 'Diploma' ? diplomaCourses :
                                    q.educationType === 'Accounting Software' ? accountingSoftwareCourses :
                                    q.educationType === 'Taxation' ? taxationCourses :
                                    q.educationType === 'Audit' ? auditCourses :
                                    q.educationType === 'Finance' ? financeCourses :
                                    q.educationType === 'International Accounting' ? internationalAccountingCourses :
                                    [...undergradCourses, ...doctoralAndOtherCourses]
                                  }
                                  value={q.course || ''}
                                  onChange={val => { updateArray('qualifications', idx, 'course', val); setEduFieldErrors({...eduFieldErrors, course: false}); }}
                                  placeholder="Select course"
                                  error={eduFieldErrors.course}
                                />
                              </div>
                              <div>
                                <label className={`block text-sm font-bold ${eduFieldErrors.courseType ? 'text-red-500' : 'text-gray-900'} mb-3`}>Course type</label>
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
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Course duration</label>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.startYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.startYear || ''} onChange={e => { updateArray('qualifications', idx, 'startYear', e.target.value); setEduFieldErrors({...eduFieldErrors, startYear: false}); }}>
                                      <option value="">Starting year</option>
                                      {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <span className="font-bold text-gray-900">To</span>
                                  <div className="flex-1">
                                    <select className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.endYear ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={q.endYear || ''} onChange={e => { updateArray('qualifications', idx, 'endYear', e.target.value); setEduFieldErrors({...eduFieldErrors, endYear: false}); }}>
                                      <option value="">Ending year</option>
                                      {Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Grading system</label>
                                <CustomDropdown
                                  options={gradingSystemOptions}
                                  value={q.gradingSystem || ''}
                                  onChange={val => updateArray('qualifications', idx, 'gradingSystem', val)}
                                  placeholder="Select grading system"
                                />
                              </div>
                              {q.gradingSystem && q.gradingSystem !== 'Not Applicable' && (
                                <div>
                                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Marks</label>
                                  <input type="text" className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.percentage ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} placeholder="Enter grade or marks" value={q.percentage || ''} onChange={e => { updateArray('qualifications', idx, 'percentage', e.target.value.replace(/[^0-9.]/g, '')); setEduFieldErrors({...eduFieldErrors, percentage: false}); }} />
                                </div>
                              )}
                            </>
                          )}
                          
                          {q.educationType && (
                            <div className="flex items-center pt-2 border-t border-gray-100 mt-4 pb-2">
                              <input type="checkbox" id={`primary-edu-${idx}`} className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500" checked={q.isPrimary || false} onChange={e => updateArray('qualifications', idx, 'isPrimary', e.target.checked)} />
                              <label htmlFor={`primary-edu-${idx}`} className="ml-3 text-gray-700 font-medium">Mark this as my primary education</label>
                            </div>
                          )}

                          {/* Mobile Save Button */}
                          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-[130] flex flex-col gap-3">
                             <button 
                               onClick={() => { removeArrayItem('qualifications', idx); setExpandedEduIndex(-1); }}
                               className="w-full bg-transparent border border-green-600 text-green-600 font-bold py-3 rounded-full hover:bg-green-50 transition-colors text-[15px]"
                             >
                               Remove Education
                             </button>
                             <button onClick={handleSaveEducation} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-full shadow-md transition-all text-[15px]">Save</button>
                          </div>
                          
                          {/* Desktop Save Button */}
                          <div className="hidden md:flex justify-end gap-4 mt-4">
                            <button 
                               onClick={() => { removeArrayItem('qualifications', idx); setExpandedEduIndex(-1); }}
                               className="px-6 py-2 rounded-full bg-transparent border border-green-600 text-green-600 font-semibold hover:bg-green-50 transition-colors"
                            >
                              Remove Education
                            </button>
                            <button onClick={handleSaveEducation} className="px-6 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-sm">Save</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="pt-4">
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                      {eduError && <span className="text-red-500 text-xs font-medium">{eduError}</span>}
                      <button onClick={handleAddEducation} className="text-green-500 font-semibold hover:text-green-600 text-sm">
                        Add +
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section id="experience" className="scroll-mt-40 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Work Experience</h3>
                </div>
                {formData.isFresher !== true && (
                  <div className="flex items-center gap-3">
                    {expError && <span className="text-red-500 text-xs font-medium">{expError}</span>}
                    <button type="button" onClick={handleAddExperience} className="text-green-500 font-semibold hover:text-green-600 text-sm whitespace-nowrap">
                      Add +
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                      <div className="flex flex-col items-start gap-3 mb-6">
                        <label className="text-sm font-medium text-gray-700">Are you a Fresher?</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center cursor-pointer group">
                            <input type="radio" name="isFresher_profile" value="yes" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={formData.isFresher === true} onChange={() => setFormData({...formData, isFresher: true})} />
                            <span className={`ml-2.5 text-[15px] ${formData.isFresher === true ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>Yes, I am a Fresher</span>
                          </label>
                          <label className="flex items-center cursor-pointer group">
                            <input type="radio" name="isFresher_profile" value="no" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={formData.isFresher === false} onChange={() => setFormData({...formData, isFresher: false})} />
                            <span className={`ml-2.5 text-[15px] ${formData.isFresher === false ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>No, I have experience</span>
                          </label>
                        </div>
                      </div>
                      
                      {formData.isFresher === false && (
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
                                    <button onClick={() => { setExpandedExpIndex(cIdx); setExpandedRoleIndex(0); }} className="text-gray-400 hover:text-blue-600 transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                  </div>
                                  
                                  <div className="mt-4 pl-4 border-l-2 border-green-500 ml-2 space-y-5">
                                    {(exp.roles || []).map((role, rIdx) => (
                                      <div key={rIdx} className="relative">
                                        <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[23px] top-1.5 ring-4 ring-white"></div>
                                        <p className="font-semibold text-gray-800">{role.jobTitle || 'Job Title'}</p>
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
                              <div key={cIdx} className="fixed inset-0 z-[120] bg-gray-50 overflow-y-auto md:overflow-visible md:relative md:inset-auto md:z-auto md:p-4 md:border md:border-gray-200 md:rounded-xl md:space-y-4 md:bg-gray-50 md:flex md:flex-col">
                                
                                {/* Mobile Header */}
                                <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-[130] shadow-sm">
                                  <h2 className="text-[18px] font-bold text-gray-900">{exp.companyName ? 'Edit Experience' : 'Add Experience'}</h2>
                                  <button onClick={() => setExpandedExpIndex(-1)} className="text-gray-900 p-2 -mr-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>

                                {/* Desktop Delete Button */}
                                <button onClick={() => { removeArrayItem('experience', cIdx); setExpandedExpIndex(-1); }} className="hidden md:block absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                
                                <div className="space-y-4 pt-6 px-4 pb-[140px] md:pt-0 md:px-0 md:pb-0 flex-1">
                                  <h4 className="hidden md:block font-semibold text-gray-700 pr-8">Company {cIdx + 1}</h4>
                                <div>
                                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Company Name</label>
                                  <input type="text" className={`w-full px-4 py-3 bg-white border ${expFieldErrors.companyName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} value={exp.companyName || ''} onChange={e => {
                                    const newExp = [...(formData.experience || [])];
                                    newExp[cIdx].companyName = e.target.value;
                                    setFormData({...formData, experience: newExp});
                                    setExpFieldErrors({...expFieldErrors, companyName: false});
                                  }} />
                                </div>
                                <div className="relative border-l-2 border-green-500 ml-3 mt-8 space-y-8 pb-4">
                                  {(exp.roles || []).map((role, rIdx) => {
                                    const isRoleExpanded = expandedRoleIndex === rIdx;
                                    
                                    return (
                                    <div key={rIdx} className="relative pl-6">
                                      <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-green-500 border-4 border-gray-50 shadow-sm"></div>
                                      
                                      <div className="border border-gray-200 rounded-xl bg-white shadow-sm relative group">
                                        
                                        {/* Header Row (Always visible) */}
                                        <div 
                                          className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${isRoleExpanded ? 'bg-gray-50' : ''}`}
                                          onClick={() => setExpandedRoleIndex(isRoleExpanded ? -1 : rIdx)}
                                        >
                                          <div>
                                            <h5 className="font-bold text-gray-900">{role.jobTitle || `Role ${rIdx + 1}`}</h5>
                                            <p className="text-sm text-gray-500 mt-1">{role.employmentType || 'Employment Type'}</p>
                                          </div>
                                          <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isRoleExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>

                                        {/* Animated Body */}
                                        <div className={`grid transition-all duration-300 ease-in-out ${isRoleExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                          <div>
                                            <div className="p-6 border-t border-gray-100 space-y-6 relative bg-white">
                                              <button onClick={(e) => {
                                                e.stopPropagation();
                                                const newExp = [...(formData.experience || [])];
                                                newExp[cIdx].roles.splice(rIdx, 1);
                                                setFormData({...formData, experience: newExp});
                                              }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors hidden md:block group-hover:block z-10">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              </button>
                                              
                                              <div>
                                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Job Title</label>
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
                                                <label className="block text-sm font-bold text-gray-900 mb-1.5">Employment Type</label>
                                                <CustomDropdown
                                                  options={employmentTypeOptions}
                                                  value={role.employmentType || ''}
                                                  onChange={val => {
                                                    const newExp = [...(formData.experience || [])];
                                                    newExp[cIdx].roles[rIdx].employmentType = val;
                                                    setFormData({...formData, experience: newExp});
                                                    if (expFieldErrors.roles?.[rIdx]?.employmentType) {
                                                      const newErrors = {...expFieldErrors};
                                                      newErrors.roles[rIdx].employmentType = false;
                                                      setExpFieldErrors(newErrors);
                                                    }
                                                  }}
                                                  placeholder="Select"
                                                  error={expFieldErrors.roles?.[rIdx]?.employmentType}
                                                />
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
                                                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Joining</label>
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
                                                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Leaving</label>
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
                                      </div>
                                    </div>
                                  )})}

                                  <div className="relative pl-6">
                                    <div className="absolute -left-[7px] top-2 w-3 h-3 rounded-full bg-gray-300 border-2 border-gray-50"></div>
                                    <button type="button" onClick={() => {
                                      const newExp = [...(formData.experience || [])];
                                      newExp[cIdx].roles.push({ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' });
                                      setFormData({...formData, experience: newExp});
                                      setExpandedRoleIndex(newExp[cIdx].roles.length - 1);
                                    }} className="flex items-center gap-1 text-sm font-bold text-green-600 hover:text-green-700 transition-colors">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                      Add Role
                                    </button>
                                  </div>
                                </div>

                                {hasCurrentRole && (
                                  <div className="mt-6 pt-6 border-t border-gray-200">
                                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Notice Period</label>
                                    <div className="w-full md:w-1/2">
                                      <CustomDropdown
                                        options={noticePeriodOptions}
                                        value={exp.noticePeriod || ''}
                                        onChange={val => {
                                          const newExp = [...(formData.experience || [])];
                                          newExp[cIdx].noticePeriod = val;
                                          setFormData({...formData, experience: newExp});
                                        }}
                                        placeholder="Select"
                                      />
                                    </div>
                                  </div>
                                )}
                                  {/* Mobile Save Button */}
                                  <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-[130] flex flex-col gap-3">
                                     <button 
                                       onClick={() => { removeArrayItem('experience', cIdx); setExpandedExpIndex(-1); }}
                                       className="w-full bg-transparent border border-green-600 text-green-600 font-bold py-3 rounded-full hover:bg-green-50 transition-colors text-[15px]"
                                     >
                                       Remove Company
                                     </button>
                                     <button onClick={handleSaveExperience} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-full shadow-md transition-all text-[15px]">Save</button>
                                  </div>
                                  
                                  {/* Desktop Save Button */}
                                  <div className="hidden md:flex justify-end gap-4 mt-4">
                                    <button 
                                       onClick={() => { removeArrayItem('experience', cIdx); setExpandedExpIndex(-1); }}
                                       className="px-6 py-2 rounded-full bg-transparent border border-green-600 text-green-600 font-semibold hover:bg-green-50 transition-colors"
                                    >
                                      Remove Company
                                    </button>
                                    <button onClick={handleSaveExperience} className="px-6 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-sm">Save</button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          <div className="pt-4">
                            <button onClick={handleAddExperience} className="text-green-500 font-semibold hover:text-green-600 text-sm">
                              Add +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
              </section>

              <section id="professional" className={`scroll-mt-40 bg-white shadow-sm md:border md:border-gray-200 md:rounded-2xl md:p-8 ${isEditingProfOverviewMobile ? 'fixed inset-0 z-[120] rounded-none border-none p-0 overflow-y-auto' : 'border border-gray-100 rounded-[20px] p-6 mt-4 md:mt-0'}`}>
                {/* Mobile Header (Read Mode) */}
                {!isEditingProfOverviewMobile && (
                  <div className="flex justify-between items-center md:hidden">
                    <h3 className="text-xl font-bold text-gray-800">Professional Overview</h3>
                    <button className="text-[#6B7280] hover:text-[#2563EB] transition-colors" onClick={() => setIsEditingProfOverviewMobile(true)}>
                      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Mobile Header (Edit Mode) */}
                {isEditingProfOverviewMobile && (
                  <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-[130] shadow-sm">
                    <h2 className="text-[18px] font-bold text-gray-900">Edit Professional Overview</h2>
                    <button onClick={() => setIsEditingProfOverviewMobile(false)} className="text-gray-900 p-2 -mr-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                {/* Desktop Header */}
                <div className="hidden md:block mb-6 pb-2 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800">Professional Overview</h3>
                </div>
                
                <div className={`grid-cols-1 md:grid-cols-2 gap-6 ${isEditingProfOverviewMobile ? 'grid p-4 pb-24 md:p-0' : 'hidden md:grid'}`}>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Function</label>
                    <CustomDropdown
                      options={[
                        'IT & Software', 'Finance & Accounts', 'Healthcare',
                        'Manufacturing', 'Education', 'Marketing', 'Sales', 'HR', 'Other'
                      ].sort().map(ind => ({ value: ind, label: ind }))}
                      value={formData.industry || ''}
                      onChange={val => {
                        setFormData({...formData, industry: val, designation: ''});
                      }}
                      placeholder="Select Function"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Current Designation</label>
                    <CustomDropdown
                      options={(() => {
                        const rolesByIndustry = {
                          'IT & Software': ["Software Engineer", "Senior Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "DevOps Engineer", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "UI/UX Designer", "QA Engineer / Tester", "Cloud Architect", "System Administrator", "Cybersecurity Analyst", "Technical Lead"],
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
                      value={formData.designation || ''}
                      onChange={val => setFormData({...formData, designation: val})}
                      placeholder="Search or type designation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Preferred Location</label>
                    <MultiSelectLocationDropdown
                      options={preferredLocationOptions}
                      value={formData.preferredLocation || ''}
                      onChange={(val) => setFormData({...formData, preferredLocation: val})}
                      placeholder="Search Locations"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">LinkedIn Profile URL</label>
                    <input type="text" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={p.linkedinUrl || ''} onChange={e => setP('linkedinUrl', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Total Experience</label>
                    <CustomDropdown
                      options={experienceOptions}
                      value={formData.totalExperience || ''}
                      onChange={val => setFormData({...formData, totalExperience: val})}
                      placeholder="Select Total Experience"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1 mt-2">
                    <div className="mb-6 flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Salary Type</label>
                        <CustomDropdown
                          options={salaryTypeOptions}
                          value={p.salaryType || 'Yearly'}
                          onChange={val => setP('salaryType', val)}
                          placeholder="Select"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Currency</label>
                        <CustomDropdown
                          options={currencyOptions}
                          value={p.currency || 'INR'}
                          onChange={val => setP('currency', val)}
                          placeholder="Select"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        {p.salaryType === 'Monthly' ? 'Monthly Salary' : p.salaryType === 'Hourly' ? 'Hourly Salary' : 'Annual Salary'}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input 
                            type="text" 
                            placeholder={p.salaryType === 'Monthly' ? `${getCurrencySymbol(p.currency)}40,000` : `${getCurrencySymbol(p.currency)}5,00,000`}
                            value={p.currentSalary || ''}
                            onChange={(e) => setP('currentSalary', formatIndianNumber(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                          />
                          <p className="text-[10px] text-gray-400 mt-1.5 ml-1 font-semibold uppercase tracking-wide">Current</p>
                        </div>
                        <div>
                          <input 
                            type="text" 
                            placeholder={p.salaryType === 'Monthly' ? `${getCurrencySymbol(p.currency)}60,000` : `${getCurrencySymbol(p.currency)}8,00,000`}
                            value={p.expectedSalary || ''}
                            onChange={(e) => setP('expectedSalary', formatIndianNumber(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                          />
                          <p className="text-[10px] text-gray-400 mt-1.5 ml-1 font-semibold uppercase tracking-wide">Expected</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Save Button (Edit Mode) */}
                {isEditingProfOverviewMobile && (
                  <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-[130]">
                    <button 
                      onClick={() => setIsEditingProfOverviewMobile(false)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-md transition-colors text-[15px]"
                    >
                      Save
                    </button>
                  </div>
                )}
              </section>

              <section id="skills" className={`scroll-mt-40 bg-white shadow-sm md:border md:border-gray-200 md:rounded-2xl md:p-8 ${isEditingSkillsMobile ? 'fixed inset-0 z-[120] rounded-none border-none p-0 overflow-y-auto' : 'border border-gray-100 rounded-[20px] p-6 mt-4 md:mt-8'}`}>
                {/* Mobile Header (Read Mode) */}
                {!isEditingSkillsMobile && (
                  <div className="flex justify-between items-center md:hidden">
                    <h3 className="text-xl font-bold text-gray-800">Skills</h3>
                    <button className="text-[#6B7280] hover:text-[#2563EB] transition-colors" onClick={() => setIsEditingSkillsMobile(true)}>
                      <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Mobile Header (Edit Mode) */}
                {isEditingSkillsMobile && (
                  <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-[130] shadow-sm">
                    <h2 className="text-[18px] font-bold text-gray-900">Edit Skills</h2>
                    <button onClick={() => setIsEditingSkillsMobile(false)} className="text-gray-900 p-2 -mr-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                {/* Desktop Header */}
                <div className="hidden md:block mb-6 pb-2 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800">Skills</h3>
                </div>
                
                <div className={`${isEditingSkillsMobile ? 'block p-4 pb-24 md:p-0' : 'hidden md:block'}`}>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">Add Skills</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : []).map(skill => (
                        <span key={skill} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[13px] font-bold border border-green-100 flex items-center gap-1.5 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors shadow-sm" onClick={() => removeSkill(skill)} title="Click to remove">
                          {skill} <span className="text-[10px] bg-green-200/50 text-green-800 rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-200 hover:text-red-800 transition-colors">✕</span>
                        </span>
                      ))}
                    </div>
                    <CustomDropdown
                      options={allSkillsOptions}
                      value=""
                      onChange={val => {
                        if (val) {
                          const currentSkills = p.skills ? p.skills.split(',').map(s => s.trim()) : [];
                          if (!currentSkills.includes(val)) {
                            currentSkills.push(val);
                            setP('skills', currentSkills.join(', '));
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
                                      const currentSkills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : [];
                                      if (!currentSkills.includes(suggestion)) {
                                        currentSkills.push(suggestion);
                                        setP('skills', currentSkills.join(', '));
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
                </div>

                {/* Mobile Save Button (Edit Mode) */}
                {isEditingSkillsMobile && (
                  <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-[130]">
                    <button 
                      onClick={() => setIsEditingSkillsMobile(false)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-md transition-colors text-[15px]"
                    >
                      Save
                    </button>
                  </div>
                )}
              </section>

              <section id="documents" className="scroll-mt-40 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="mb-6 pb-2 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">Documents</h3>
              </div>
              <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <label className="block text-sm font-bold text-gray-900 mb-3">Upload Resume</label>
                        <input key={docs.resume ? 'resume-has' : 'resume-empty'} type="file" disabled={isUploading} accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-palette-50 file:text-palette-900 hover:file:bg-palette-100 cursor-pointer disabled:opacity-50" onChange={e => handleFileUpload(e, 'resume')} />
                        {docError.resume && <p className="text-xs text-red-500 mt-2 font-medium">{docError.resume}</p>}
                        <p className="text-xs text-black mt-2 font-medium">Supported Formats: doc, docx, pdf, upto 300KB</p>
                        {docs.resume && (
                          <div className="flex items-center justify-between mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-700 flex items-center gap-2 truncate">
                              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> 
                              <a href={docs.resume.startsWith('http') ? docs.resume : '#'} target="_blank" rel="noreferrer" className="truncate hover:underline text-green-600 font-medium">{getFileName(docs.resume)}</a>
                            </p>
                            <button onClick={() => setDoc('resume', '')} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors flex-shrink-0" title="Remove Resume">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <label className="flex items-center justify-between text-sm font-bold text-gray-900 mb-3">
                          <span>Upload Cover Letter</span>
                          <span className="text-gray-400 font-medium text-xs">(Optional)</span>
                        </label>
                        <input key={docs.coverLetter ? 'cl-has' : 'cl-empty'} type="file" disabled={isUploading} accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-palette-50 file:text-palette-900 hover:file:bg-palette-100 cursor-pointer disabled:opacity-50" onChange={e => handleFileUpload(e, 'coverLetter')} />
                        {docError.coverLetter && <p className="text-xs text-red-500 mt-2 font-medium">{docError.coverLetter}</p>}
                        <p className="text-xs text-black mt-2 font-medium">Supported Formats: doc, docx, pdf, upto 300KB</p>
                        {docs.coverLetter && (
                          <div className="flex items-center justify-between mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-700 flex items-center gap-2 truncate">
                              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> 
                              <a href={docs.coverLetter.startsWith('http') ? docs.coverLetter : '#'} target="_blank" rel="noreferrer" className="truncate hover:underline text-green-600 font-medium">{getFileName(docs.coverLetter)}</a>
                            </p>
                            <button onClick={() => setDoc('coverLetter', '')} className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors flex-shrink-0" title="Remove Cover Letter">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              </section>

              {/* Mobile Sign Out Button */}
              <div className="md:hidden mt-8 pb-24">
                <button 
                  onClick={() => navigate('/')} 
                  className="w-full bg-white border border-red-500 text-red-500 font-bold py-3.5 rounded-[16px] shadow-sm hover:bg-red-50 transition-colors text-[16px]"
                >
                  Sign Out
                </button>
              </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeProfile;
