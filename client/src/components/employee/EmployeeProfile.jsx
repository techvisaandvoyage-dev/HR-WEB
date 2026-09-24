import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageCropperModal from '../common/ImageCropperModal';
import EmployeeNavbar from '../common/EmployeeNavbar';
import CustomDropdown from '../common/CustomDropdown';
import InstituteAutocomplete from '../common/InstituteAutocomplete';
import JobTitleAutocomplete from '../common/JobTitleAutocomplete';
import CompanyAutocomplete from '../common/CompanyAutocomplete';
import CustomMonthPicker from '../common/CustomMonthPicker';
import MultiSelectLocationDropdown from '../common/MultiSelectLocationDropdown';
import { allSkillsOptions, getSuggestedSkills } from '../../utils/skillsData';
import { uploadFileToStorage } from '../../utils/firebaseStorage';
import { uploadVideoToMux } from '../../utils/muxUpload';
import { compressFileIfNeeded } from '../../utils/fileCompressor';
import VideoPlayer from '../common/VideoPlayer';
import AccountSecuritySection from './AccountSecuritySection';
import { currentLocationOptions, preferredLocationOptions } from '../../data/preferredLocations';
import { DEFAULT_EDUCATION_DATA, DEFAULT_BOARD_OPTIONS, DEFAULT_EMPLOYMENT_TYPE_OPTIONS, DEFAULT_MEDIUM_OPTIONS, sortQualifications, sortExperience } from './EmployeeOnboarding';

const DEFAULT_FUNCTIONS_DATA = {
  'IT & Software': ["Software Engineer", "Senior Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "DevOps Engineer", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "UI/UX Designer", "QA Engineer / Tester", "Cloud Architect", "System Administrator", "Cybersecurity Analyst", "Technical Lead"],
  'Finance & Accounts': ["Accountant", "Senior Accountant", "Financial Analyst", "Finance Manager", "Auditor", "Tax Consultant", "Investment Banker", "Chartered Accountant (CA)"],
  'Healthcare': ["Doctor", "Nurse", "Pharmacist", "Medical Representative", "Healthcare Administrator", "Lab Technician", "Physiotherapist", "Medical Coder"],
  'Manufacturing': ["Production Engineer", "Quality Analyst", "Plant Manager", "Maintenance Engineer", "Supply Chain Manager", "Safety Officer", "Mechanical Engineer"],
  'Marketing': ["Marketing Executive", "Digital Marketer", "Marketing Manager", "SEO Specialist", "Content Writer", "Social Media Manager", "Brand Manager"],
  'Sales': ["Sales Executive", "Sales Manager", "Business Development Executive", "Business Development Manager", "Account Manager", "Area Sales Manager", "Retail Store Manager"],
  'HR': ["HR Executive", "HR Manager", "Recruiter", "Talent Acquisition Specialist", "Payroll Executive", "Training & Development Manager", "HR Generalist"],
  'Other': ["Product Manager", "Project Manager", "Business Analyst", "Operations Manager"]
};

const formatMonthYear = (dateStr) => {
  if (!dateStr) return 'MM/YYYY';
  const [year, month] = dateStr.split('-');
  if (!year || !month) return 'MM/YYYY';
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthsList[parseInt(month, 10) - 1]} ${year}`;
};

const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ',
    CAD: '$', AUD: '$', SGD: '$', SAR: '﷼', QAR: '﷼',
    OMR: '﷼', KWD: 'د.ك', BHD: '.د.ب', JPY: '¥', CNY: '¥',
    CHF: 'Fr', HKD: '$', NZD: '$', MYR: 'RM', ZAR: 'R',
    THB: '฿', PHP: '₱', IDR: 'Rp', VND: '₫', BRL: 'R$',
    RUB: '₽', KRW: '₩', TRY: '₺', MXN: '$', EGP: 'E£',
    LKR: 'Rs', PKR: 'Rs', BDT: '৳', NPR: 'Rs'
  };
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

export const DEFAULT_GRADING_SYSTEMS = [
  {
    name: 'Scale 10 Grading System',
    label: 'Grade (out of 10)',
    placeholder: 'e.g. 8.5'
  },
  {
    name: 'Scale 4 Grading System',
    label: 'Grade (out of 4)',
    placeholder: 'e.g. 3.6'
  },
  {
    name: '% Marks of 100 Maximum',
    label: 'Marks / Percentage (%)',
    placeholder: 'e.g. 85'
  },
  {
    name: 'Not Applicable',
    label: 'Marks / Grade (Optional)',
    placeholder: 'e.g. Grade or Marks'
  }
];

export const normalizeGradingSystems = (list) => {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_GRADING_SYSTEMS;
  return list.map(item => {
    if (typeof item === 'string') {
      if (item === 'Scale 10 Grading System') {
        return { name: item, label: 'Grade (out of 10)', placeholder: 'e.g. 8.5' };
      } else if (item === 'Scale 4 Grading System') {
        return { name: item, label: 'Grade (out of 4)', placeholder: 'e.g. 3.6' };
      } else if (item === '% Marks of 100 Maximum') {
        return { name: item, label: 'Marks / Percentage (%)', placeholder: 'e.g. 85' };
      } else if (item === 'Not Applicable') {
        return { name: item, label: 'Marks / Grade (Optional)', placeholder: 'e.g. Grade or Marks' };
      }
      return { name: item, label: `${item} Marks / Grade`, placeholder: 'Enter grade or marks' };
    }
    return {
      name: item.name || '',
      label: item.label || 'Marks / Grade',
      placeholder: item.placeholder || 'Enter grade or marks'
    };
  });
};

export const getGradingValidation = (gradingSystem = '', value = '') => {
  if (!gradingSystem || gradingSystem === 'Not Applicable') return { isValid: true };
  if (value === undefined || value === null || String(value).trim() === '') return { isValid: true };

  const num = parseFloat(value);
  if (isNaN(num)) {
    return { isValid: false, message: 'Please enter a valid number' };
  }
  if (num < 0) {
    return { isValid: false, message: 'Value cannot be negative' };
  }

  const str = String(gradingSystem).toLowerCase();
  
  if (str.includes('scale 4') || str.includes('out of 4')) {
    if (num > 4) {
      return { isValid: false, message: 'Grade cannot be greater than 4 (e.g. 3.5, 4.0)', max: 4 };
    }
  } else if (str.includes('scale 10') || str.includes('out of 10')) {
    if (num > 10) {
      return { isValid: false, message: 'Grade cannot be greater than 10 (e.g. 8.5, 10.0)', max: 10 };
    }
  } else if (str.includes('scale 5') || str.includes('out of 5')) {
    if (num > 5) {
      return { isValid: false, message: 'Grade cannot be greater than 5', max: 5 };
    }
  } else if (str.includes('scale 7') || str.includes('out of 7')) {
    if (num > 7) {
      return { isValid: false, message: 'Grade cannot be greater than 7', max: 7 };
    }
  } else if (str.includes('scale 8') || str.includes('out of 8')) {
    if (num > 8) {
      return { isValid: false, message: 'Grade cannot be greater than 8', max: 8 };
    }
  } else if (str.includes('scale 9') || str.includes('out of 9')) {
    if (num > 9) {
      return { isValid: false, message: 'Grade cannot be greater than 9', max: 9 };
    }
  } else if (str.includes('100') || str.includes('percentage') || str.includes('%')) {
    if (num > 100) {
      return { isValid: false, message: 'Percentage cannot be greater than 100%', max: 100 };
    }
  } else {
    const match = str.match(/(?:scale\s*|out of\s*)(\d+(\.\d+)?)/i);
    if (match && match[1]) {
      const maxVal = parseFloat(match[1]);
      if (!isNaN(maxVal) && maxVal > 0 && num > maxVal) {
        return { isValid: false, message: `Grade cannot be greater than ${maxVal}`, max: maxVal };
      }
    }
  }

  return { isValid: true };
};

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

export const DEFAULT_COURSE_TYPE_OPTIONS = [
  'Full time',
  'Part time',
  'Correspondence/Distance learning'
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

export const DEFAULT_NOTICE_PERIOD_OPTIONS = [
  '15 Days',
  '30 Days',
  '60 Days',
  '90+ Days',
  'Immediately available'
];

export const noticePeriodOptions = DEFAULT_NOTICE_PERIOD_OPTIONS.map(opt => ({ value: opt, label: opt }));

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
  { value: 'AED', label: 'AED (د.إ)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
  { value: 'SGD', label: 'SGD ($)' },
  { value: 'SAR', label: 'SAR (﷼)' },
  { value: 'QAR', label: 'QAR (﷼)' },
  { value: 'OMR', label: 'OMR (﷼)' },
  { value: 'KWD', label: 'KWD (د.ك)' },
  { value: 'BHD', label: 'BHD (.د.ب)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'CHF', label: 'CHF (Fr)' },
  { value: 'HKD', label: 'HKD ($)' },
  { value: 'NZD', label: 'NZD ($)' },
  { value: 'MYR', label: 'MYR (RM)' },
  { value: 'ZAR', label: 'ZAR (R)' },
  { value: 'THB', label: 'THB (฿)' },
  { value: 'PHP', label: 'PHP (₱)' },
  { value: 'IDR', label: 'IDR (Rp)' },
  { value: 'VND', label: 'VND (₫)' },
  { value: 'BRL', label: 'BRL (R$)' },
  { value: 'RUB', label: 'RUB (₽)' },
  { value: 'KRW', label: 'KRW (₩)' },
  { value: 'TRY', label: 'TRY (₺)' },
  { value: 'MXN', label: 'MXN ($)' },
  { value: 'EGP', label: 'EGP (E£)' },
  { value: 'LKR', label: 'LKR (Rs)' },
  { value: 'PKR', label: 'PKR (Rs)' },
  { value: 'BDT', label: 'BDT (৳)' },
  { value: 'NPR', label: 'NPR (Rs)' }
];



const EmployeeProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.tab === 'security' || location.search.includes('tab=security') || location.hash === '#security') {
      return 'security';
    }
    return location.state?.tab || 'basic';
  });

  const handleTabClick = (tabId) => {
    isProgrammaticScrollRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    setActiveTab(tabId);
    if (tabId === 'security') {
      scrollToSecurity();
    } else {
      setTimeout(() => {
        document.getElementById(tabId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 850);
  };

  const scrollToSecurity = () => {
    const performScroll = () => {
      const el = document.getElementById('security');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };
    performScroll();
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 150);
    setTimeout(performScroll, 300);
  };

  useEffect(() => {
    if (activeTab === 'security') {
      scrollToSecurity();
    }
  }, [activeTab]);

  useEffect(() => {
    if (location.state?.tab === 'security' || location.search.includes('tab=security') || location.hash === '#security') {
      setActiveTab('security');
      scrollToSecurity();
    } else if (location.state?.tab && location.state.tab !== 'security') {
      setActiveTab(location.state.tab);
    }
  }, [location.state, location.search, location.hash]);
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
  const [isUploading, setIsUploading] = useState(false);
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
  const [cmsConfig, setCmsConfig] = useState(null);
  const [phoneError, setPhoneError] = useState('');

  const checkPhoneAvailability = async (phoneVal) => {
    const cleanPhone = String(phoneVal !== undefined ? phoneVal : (formData.phone || '')).trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('');
      return true;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/employee/auth/check-mobile-available`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobile: cleanPhone, 
          currentEmail: formData.email 
        })
      });
      const data = await res.json();
      if (data && data.available === false) {
        setPhoneError(data.message || 'This phone number is already registered with another account.');
        return false;
      } else {
        setPhoneError('');
        return true;
      }
    } catch (err) {
      console.error('Error checking phone availability in EmployeeProfile:', err);
      return true;
    }
  };

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employeeOnboarding) {
          setCmsConfig(data.data.employeeOnboarding);
        } else if (data?.employeeOnboarding) {
          setCmsConfig(data.employeeOnboarding);
        }
      } catch (err) {
        console.error("Failed to fetch CMS config in EmployeeProfile:", err);
      }
    };
    fetchCms();
  }, []);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      const saved = localStorage.getItem('userProfile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.qualifications && Array.isArray(parsed.qualifications)) {
            parsed.qualifications = sortQualifications(parsed.qualifications);
          }
          if (parsed.experience && Array.isArray(parsed.experience)) {
            parsed.experience = sortExperience(parsed.experience);
          }
          setFormData(parsed);
        } catch (e) {
          console.error("Failed to parse profile data");
        }
      }
      try {
        const token = localStorage.getItem('employeeToken');
        if (token) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data && data.email) {
            setFormData(prev => ({
              ...prev,
              ...data,
              qualifications: data.qualifications ? sortQualifications(data.qualifications) : sortQualifications(prev.qualifications),
              experience: data.experience ? sortExperience(data.experience) : (prev.experience ? sortExperience(prev.experience) : prev.experience),
              documents: {
                ...(prev.documents || {}),
                resume: data.resume || prev.documents?.resume || '',
                coverLetter: data.coverLetter || prev.documents?.coverLetter || '',
                introVideo: data.introVideo || prev.documents?.introVideo || '',
                videoVisibility: data.videoVisibility || 'everyone'
              },
              videoVisibility: data.videoVisibility || 'everyone'
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest profile:", err);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchLatestProfile();
  }, []);

  // Ensure any primary qualification is continuously kept at index 0
  useEffect(() => {
    if (formData.qualifications && Array.isArray(formData.qualifications)) {
      const primaryIdx = formData.qualifications.findIndex(q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1));
      if (primaryIdx > 0) {
        const sorted = sortQualifications(formData.qualifications);
        setFormData(prev => ({ ...prev, qualifications: sorted }));
      }
    }
  }, [formData.qualifications]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('userProfile', JSON.stringify(formData));
      localStorage.setItem('hasProfile', 'true');

      const timer = setTimeout(async () => {
        try {
          const token = localStorage.getItem('employeeToken');
          if (token) {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok && data && data.field === 'phone') {
              setPhoneError(data.message || 'This phone number is already registered with another account.');
            } else if (res.ok) {
              setPhoneError('');
            }
          }
        } catch (err) {
          console.error("Profile autosave error:", err);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [formData, isLoaded]);

  const [uploadingType, setUploadingType] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoProfileMode, setVideoProfileMode] = useState('upload');
  const [videoProfileLink, setVideoProfileLink] = useState('');
  const [docError, setDocError] = useState({ resume: '', coverLetter: '', introVideo: '' });

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (typeof bytes === 'string' && (bytes.includes('KB') || bytes.includes('MB') || bytes.includes('B'))) return bytes;
    const numBytes = Number(bytes);
    if (isNaN(numBytes) || numBytes <= 0) return '';
    if (numBytes < 1024) return `${numBytes} B`;
    if (numBytes < 1024 * 1024) return `${Math.round(numBytes / 1024)} KB`;
    return `${(numBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const p = formData.professionalDetails || {};
  const setP = (field, val) => setFormData({...formData, professionalDetails: {...p, [field]: val}});
  const docs = formData.documents || {};
  const docsMeta = formData.documentsMeta || {};
  const setDoc = (field, val, file = null) => {
    const updatedDocs = { ...docs, [field]: val };
    const updatedMeta = { ...docsMeta };
    if (val && file) {
      updatedMeta[field] = {
        name: file.name,
        size: formatFileSize(file.size)
      };
    } else if (!val) {
      delete updatedMeta[field];
    }
    setFormData({
      ...formData,
      documents: updatedDocs,
      documentsMeta: updatedMeta
    });
  };

  const handleVisibilityChange = async (visibility) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        videoVisibility: visibility,
        documents: { ...(prev.documents || {}), videoVisibility: visibility }
      };
      localStorage.setItem('userProfile', JSON.stringify(updated));
      return updated;
    });

    try {
      const token = localStorage.getItem('employeeToken');
      if (token) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoVisibility: visibility,
            documents: { videoVisibility: visibility }
          })
        });
      }
    } catch (err) {
      console.error("Direct visibility save error:", err);
    }
  };

  const handleFileUpload = async (e, type) => {
    let file = e.target.files[0];
    if (!file) return;

    setDocError(prev => ({...prev, [type]: ''}));
    setIsUploading(true);
    setUploadingType(type);
    if (type === 'introVideo') setVideoUploadProgress(0);

    // Size limits: 200MB for video, 300KB for docs
    if (type === 'introVideo') {
      const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
      if (file.size > MAX_VIDEO_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setDocError(prev => ({
          ...prev,
          introVideo: `Video file size (${fileSizeMB}MB) exceeds the 200MB limit. Videos over 200MB are not supported. Please choose a smaller video.`
        }));
        e.target.value = '';
        setIsUploading(false);
        setUploadingType(null);
        return;
      }

      // Check video duration (Max 3 minutes / 180 seconds)
      try {
        const duration = await new Promise((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          const url = URL.createObjectURL(file);
          video.src = url;
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(video.duration || 0);
          };
          video.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(0);
          };
        });

        const MAX_VIDEO_DURATION = 180; // 3 minutes in seconds
        if (duration > MAX_VIDEO_DURATION) {
          const mins = Math.floor(duration / 60);
          const secs = Math.round(duration % 60);
          const durationText = `${mins} min${mins > 1 ? 's' : ''}${secs > 0 ? ` ${secs} sec` : ''}`;
          setDocError(prev => ({
            ...prev,
            introVideo: `Video length (${durationText}) exceeds the 3-minute limit. Please upload a video under 3 minutes.`
          }));
          e.target.value = '';
          setIsUploading(false);
          setUploadingType(null);
          return;
        }
      } catch (err) {
        console.warn('Could not read video duration metadata:', err);
      }
    } else {
      const MAX_DOC_SIZE = 300 * 1024; // 300KB
      // Automatically attempt progressive compression on oversized document/image
      if (file.size > MAX_DOC_SIZE) {
        try {
          file = await compressFileIfNeeded(file, MAX_DOC_SIZE);
        } catch (cErr) {
          console.warn("Auto compression error/skipped:", cErr);
        }
      }
      if (file.size > MAX_DOC_SIZE) {
        const fileSizeKB = (file.size / 1024).toFixed(1);
        setDocError(prev => ({
          ...prev,
          [type]: `File size (${fileSizeKB}KB) exceeds the 300KB limit. Please upload a smaller document.`
        }));
        e.target.value = '';
        setIsUploading(false);
        setUploadingType(null);
        return;
      }
    }

    try {
      if (type === 'introVideo') {
        const muxResult = await uploadVideoToMux(file, (p) => setVideoUploadProgress(p));
        if (muxResult.isMux && muxResult.streamUrl) {
          setDoc('introVideo', muxResult.streamUrl, file);
          return;
        }
        const downloadURL = await uploadFileToStorage(file, 'intro-videos', (p) => setVideoUploadProgress(p));
        setDoc('introVideo', downloadURL, file);
      } else {
        const downloadURL = await uploadFileToStorage(file, 'resumes');
        setDoc(type, downloadURL, file);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setDocError(prev => ({...prev, [type]: 'Failed to upload document.'}));
    } finally {
      setIsUploading(false);
      setUploadingType(null);
    }
  };

  const handleAttachVideoLink = (e) => {
    e.preventDefault();
    if (!videoProfileLink.trim()) {
      setDocError(prev => ({...prev, introVideo: 'Please enter a valid video link (YouTube, Loom, Vimeo, Drive, or video URL)'}));
      return;
    }
    setDocError(prev => ({...prev, introVideo: ''}));
    setDoc('introVideo', videoProfileLink.trim());
  };

  const isDirectVideo = (url) => {
    if (!url) return false;
    return url.includes('firebasestorage') || /\.(mp4|webm|mov|m4v|mkv)($|\?)/i.test(url);
  };

  const getFileName = (url) => {
    if (!url) return '';
    if (!url.startsWith('http')) return url;
    return "Uploaded Document (Click to view)";
  };
  const updateArray = (field, index, key, value) => {
    let newArr = [...(formData[field] || [])];
    if (field === 'qualifications' && key === 'isPrimary') {
      if (value) {
        // Set all other qualifications isPrimary to false
        newArr = newArr.map((item, i) => ({
          ...item,
          isPrimary: i === index
        }));
        // Move marked primary item to index 0 (first in order)
        const [primaryItem] = newArr.splice(index, 1);
        newArr.unshift(primaryItem);
        setExpandedEduIndex(0);
      } else {
        newArr[index] = { ...newArr[index], isPrimary: false };
      }
    } else {
      newArr[index] = { ...newArr[index], [key]: value };
    }
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

  const removePreferredLocation = (locToRemove) => {
    const currentLocs = (formData.preferredLocation || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    setFormData({
      ...formData,
      preferredLocation: currentLocs.filter(s => s !== locToRemove).join(', ')
    });
  };

  const tabs = [
    { id: 'basic', label: cmsConfig?.step1?.title || 'Basic Details' },
    { id: 'education', label: cmsConfig?.step2?.title || 'Education' },
    { id: 'experience', label: cmsConfig?.step3?.title || 'Work Experience' },
    { id: 'professional', label: cmsConfig?.step4?.title || 'Professional Overview' },
    { id: 'documents', label: cmsConfig?.step5?.title || 'Documents' },
    { id: 'security', label: 'Security & Password' },
  ];

  useEffect(() => {
    if (activeTab === 'security') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    tabs.filter(tab => tab.id !== 'security').forEach(tab => {
      const el = document.getElementById(tab.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeTab]);

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
      <p className="text-[13px] text-gray-500 mb-6">Last updated today</p>

      {/* Mobile Tab Switcher */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => handleTabClick('basic')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab !== 'security'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('security')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'security'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Security &amp; Password
        </button>
      </div>

      {activeTab === 'security' ? (
        <div className="mb-6">
          <AccountSecuritySection userEmail={formData.email} />
        </div>
      ) : (
        <>
      {/* 4. Basic Details Card */}
      <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">{cmsConfig?.step1?.title || 'Basic details'}</h3>
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
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {getStepField('step1', 'firstName', 'First Name', 'Enter first name').label}
                {getStepField('step1', 'firstName').isRequired && <span className="text-red-500">*</span>}
              </label>
              <input type="text" placeholder={getStepField('step1', 'firstName', 'First Name', 'Enter first name').placeholder} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {getStepField('step1', 'lastName', 'Last Name', 'Enter last name').label}
                {getStepField('step1', 'lastName').isRequired && <span className="text-red-500">*</span>}
              </label>
              <input type="text" placeholder={getStepField('step1', 'lastName', 'Last Name', 'Enter last name').placeholder} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {getStepField('step1', 'phone', 'Phone Number', 'Enter 10-digit mobile number').label}
                {getStepField('step1', 'phone').isRequired && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="text" 
                placeholder={getStepField('step1', 'phone', 'Phone Number', 'Enter 10-digit mobile number').placeholder}
                className={`w-full px-4 py-3 bg-white border ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} 
                value={formData.phone || ''} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({...formData, phone: val});
                  setPhoneError('');
                  if (val.length === 10) checkPhoneAvailability(val);
                }}
                onBlur={() => {
                  if (formData.phone && formData.phone.length === 10) checkPhoneAvailability(formData.phone);
                }}
              />
              {phoneError && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {phoneError}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {getStepField('step1', 'email', 'Email (Read Only)', 'Enter email address').label}
              </label>
              <input type="text" disabled placeholder={getStepField('step1', 'email', 'Email (Read Only)', 'Enter email address').placeholder} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" value={formData.email || ''} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {getStepField('step1', 'location', 'Current Location', 'Select Current Location').label}
                {getStepField('step1', 'location').isRequired && <span className="text-red-500">*</span>}
              </label>
              <MultiSelectLocationDropdown
                options={(Array.isArray(cmsConfig?.step1?.locationCities) && cmsConfig.step1.locationCities.length > 0)
                  ? cmsConfig.step1.locationCities
                      .filter(c => c !== 'Anywhere in India' && c !== 'Anywhere in India/Multiple Locations')
                      .map(loc => ({ label: loc, value: loc, displayName: loc }))
                  : currentLocationOptions}
                value={formData.location || ''}
                onChange={(val) => setFormData({...formData, location: val})}
                multiple={false}
                placeholder={getStepField('step1', 'location', 'Current Location', 'Select Current Location').placeholder}
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
      </>
      )}
    </div>
    </>
  );

  const scrollToTarget = (targetId) => {
    setTimeout(() => {
      let targetEl = targetId ? document.getElementById(targetId) : null;
      if (!targetEl && targetId) {
        targetEl = document.querySelector(`[id="${targetId}"]`);
      }
      if (!targetEl) {
        targetEl = document.querySelector('.border-red-500, .ring-red-500, [aria-invalid="true"]');
      }
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inputEl = targetEl.tagName === 'INPUT' || targetEl.tagName === 'SELECT' || targetEl.tagName === 'TEXTAREA'
          ? targetEl
          : targetEl.querySelector('input, select, textarea, button');
        if (inputEl) {
          inputEl.focus({ preventScroll: true });
        }
      }
    }, 120);
  };

  const validateEducationData = (targetIdx = null) => {
    const qualifications = formData.qualifications || [];
    if (qualifications.length === 0) return { isValid: true };
    const eduData = cmsConfig?.step2?.educationData || DEFAULT_EDUCATION_DATA;
    const isPercentageRequired = cmsConfig?.step2?.fields?.percentage?.isRequired !== false;

    const indicesToCheck = (targetIdx !== null && targetIdx !== undefined && targetIdx >= 0) 
      ? [targetIdx] 
      : Array.from({ length: qualifications.length }, (_, i) => i);

    for (const eduIdx of indicesToCheck) {
      const currentEdu = qualifications[eduIdx];
      if (!currentEdu) continue;
      const errors = {};
      let hasError = false;
      let firstMissingId = null;

      if (!currentEdu.educationType) {
        errors.educationType = true;
        hasError = true;
        firstMissingId = `field-edu-type-${eduIdx}`;
      } else {
        const currentEduConfig = eduData[currentEdu.educationType];
        const isSchool = currentEduConfig ? currentEduConfig.category === 'school' : (currentEdu.educationType === '10th' || currentEdu.educationType === '12th');
        if (isSchool) {
          if (!currentEdu.board) { errors.board = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-board-${eduIdx}`; }
          if (!currentEdu.endYear) { errors.endYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-endYear-${eduIdx}`; }
          if (!currentEdu.schoolMedium) { errors.schoolMedium = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-schoolMedium-${eduIdx}`; }
          if (isPercentageRequired && !currentEdu.percentage) {
            errors.percentage = true;
            hasError = true;
            if (!firstMissingId) firstMissingId = `field-edu-percentage-${eduIdx}`;
          } else if (currentEdu.percentage) {
            const num = parseFloat(currentEdu.percentage);
            if (num > 100 || num < 0) {
              errors.percentage = 'Marks / Percentage cannot be greater than 100%';
              hasError = true;
              if (!firstMissingId) firstMissingId = `field-edu-percentage-${eduIdx}`;
            }
          }
        } else {
          if (!currentEdu.university) { errors.university = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-university-${eduIdx}`; }
          if (!currentEdu.course) { errors.course = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-course-${eduIdx}`; }
          if (!currentEdu.courseType) { errors.courseType = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-courseType-${eduIdx}`; }
          if (!currentEdu.startYear) { errors.startYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-startYear-${eduIdx}`; }
          if (!currentEdu.endYear) { errors.endYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-endYear-${eduIdx}`; }
          if (isPercentageRequired && currentEdu.gradingSystem && currentEdu.gradingSystem !== 'Not Applicable' && !currentEdu.percentage) {
            errors.percentage = true;
            hasError = true;
            if (!firstMissingId) firstMissingId = `field-edu-percentage-${eduIdx}`;
          } else if (currentEdu.percentage && currentEdu.gradingSystem && currentEdu.gradingSystem !== 'Not Applicable') {
            const gradeValidation = getGradingValidation(currentEdu.gradingSystem, currentEdu.percentage);
            if (!gradeValidation.isValid) {
              errors.percentage = gradeValidation.message;
              hasError = true;
              if (!firstMissingId) firstMissingId = `field-edu-percentage-${eduIdx}`;
            }
          }
        }
      }

      if (hasError) {
        return {
          isValid: false,
          eduIdx,
          errors,
          targetFieldId: firstMissingId
        };
      }
    }
    return { isValid: true };
  };

  const handleAddEducation = (e) => {
    if (e) e.preventDefault();
    const result = validateEducationData();
    if (!result.isValid) {
      setExpandedEduIndex(result.eduIdx);
      setEduFieldErrors(result.errors);
      setEduError('Fill details');
      scrollToTarget(result.targetFieldId);
      return;
    }
    setEduError('');
    setEduFieldErrors({});
    const newIdx = (formData.qualifications || []).length;
    setExpandedEduIndex(newIdx);
    addArrayItem('qualifications', { educationType: '', board: '', endYear: '', schoolMedium: '', percentage: '', university: '', course: '', startYear: '', gradingSystem: '', isPrimary: false });
    scrollToTarget(`field-edu-type-${newIdx}`);
  };

  const handleSaveEducation = (e) => {
    if (e) e.preventDefault();
    const result = validateEducationData(expandedEduIndex >= 0 ? expandedEduIndex : null);
    if (!result.isValid) {
      setExpandedEduIndex(result.eduIdx);
      setEduFieldErrors(result.errors);
      setEduError('Fill details');
      scrollToTarget(result.targetFieldId);
      return;
    }
    let updatedQuals = sortQualifications([...(formData.qualifications || [])]);
    const nextFormData = { ...formData, qualifications: updatedQuals };
    setFormData(nextFormData);
    localStorage.setItem('userProfile', JSON.stringify(nextFormData));

    setEduError('');
    setEduFieldErrors({});
    setExpandedEduIndex(-1);
  };

  const getStepField = (stepKey, fieldKey, defaultLabel, defaultPlaceholder, defaultRequired = true) => {
    const field = cmsConfig?.[stepKey]?.fields?.[fieldKey];
    let ph = field?.placeholder;
    if (stepKey === 'step5' && (fieldKey === 'resume' || fieldKey === 'coverLetter')) {
      if (!ph || ph.includes('5MB') || ph.includes('5mb') || ph === 'Upload Cover Letter (PDF/DOCX)' || ph === 'Upload PDF or DOCX (Max 5MB)' || ph.toLowerCase().includes('pdf or docx') || ph.toLowerCase().includes('cover letter (pdf/docx)')) {
        ph = defaultPlaceholder || 'Supported Formats: doc, docx, pdf, upto 300KB';
      }
    }
    return {
      label: field?.label || defaultLabel,
      placeholder: ph || defaultPlaceholder,
      isRequired: field?.isRequired !== undefined ? field.isRequired : defaultRequired
    };
  };

  const validateExperienceData = (targetIdx = null) => {
    if (formData.isFresher === true) return { isValid: true };
    const experience = formData.experience || [];
    if (experience.length === 0) return { isValid: true };

    const fCompany = getStepField('step3', 'companyName', 'Company Name', 'Enter company name', true);
    const fJobTitle = getStepField('step3', 'jobTitle', 'Job Title / Role', 'Enter job title', true);
    const fEmpType = getStepField('step3', 'employmentType', 'Employment Type', 'Select employment type', true);
    const fJoining = getStepField('step3', 'joiningDate', 'Joining Date', 'Select month & year', true);
    const fLeaving = getStepField('step3', 'leavingDate', 'Leaving Date', 'Select month & year', true);
    const fRoleDesc = getStepField('step3', 'roleDescription', 'Roles & Responsibilities', 'Briefly describe your roles & responsibilities', false);

    const indicesToCheck = (targetIdx !== null && targetIdx !== undefined && targetIdx >= 0)
      ? [targetIdx]
      : Array.from({ length: experience.length }, (_, i) => i);

    for (const cIdx of indicesToCheck) {
      const exp = experience[cIdx];
      if (!exp) continue;
      const errors = { roles: [] };
      let hasError = false;
      let firstMissingId = null;
      let firstInvalidRoleIdx = 0;

      if (fCompany.isRequired && !exp.companyName?.trim()) {
        errors.companyName = true;
        hasError = true;
        firstMissingId = `field-exp-company-${cIdx}`;
      }

      if (exp.roles && exp.roles.length > 0) {
        exp.roles.forEach((role, rIdx) => {
          const roleErrors = {};
          if (fJobTitle.isRequired && !role.jobTitle?.trim()) {
            roleErrors.jobTitle = true;
            hasError = true;
            if (!firstMissingId) {
              firstMissingId = `field-exp-jobTitle-${cIdx}-${rIdx}`;
              firstInvalidRoleIdx = rIdx;
            }
          }
          if (fEmpType.isRequired && !role.employmentType) {
            roleErrors.employmentType = true;
            hasError = true;
            if (!firstMissingId) {
              firstMissingId = `field-exp-empType-${cIdx}-${rIdx}`;
              firstInvalidRoleIdx = rIdx;
            }
          }
          if (fJoining.isRequired && !role.joiningDate) {
            roleErrors.joiningDate = true;
            hasError = true;
            if (!firstMissingId) {
              firstMissingId = `field-exp-joiningDate-${cIdx}-${rIdx}`;
              firstInvalidRoleIdx = rIdx;
            }
          }
          if (fLeaving.isRequired && !role.currentCompany && !role.leavingDate) {
            roleErrors.leavingDate = true;
            hasError = true;
            if (!firstMissingId) {
              firstMissingId = `field-exp-leavingDate-${cIdx}-${rIdx}`;
              firstInvalidRoleIdx = rIdx;
            }
          }
          if (fRoleDesc.isRequired && !role.roleDescription?.trim()) {
            roleErrors.roleDescription = true;
            hasError = true;
            if (!firstMissingId) {
              firstMissingId = `field-exp-roleDesc-${cIdx}-${rIdx}`;
              firstInvalidRoleIdx = rIdx;
            }
          }
          errors.roles[rIdx] = roleErrors;
        });
      }

      if (hasError) {
        return {
          isValid: false,
          cIdx,
          rIdx: firstInvalidRoleIdx,
          errors,
          targetFieldId: firstMissingId
        };
      }
    }

    return { isValid: true };
  };

  const handleAddExperience = (e) => {
    if (e) e.preventDefault();
    const result = validateExperienceData();
    if (!result.isValid) {
      setExpandedExpIndex(result.cIdx);
      setExpandedRoleIndex(result.rIdx);
      setExpFieldErrors(result.errors);
      setExpError('Fill details');
      scrollToTarget(result.targetFieldId);
      return;
    }
    setExpError('');
    setExpFieldErrors({});
    const newIdx = (formData.experience || []).length;
    setExpandedExpIndex(newIdx);
    setExpandedRoleIndex(0);
    addArrayItem('experience', { companyName: '', noticePeriod: '', roles: [{ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }] });
    scrollToTarget(`field-exp-company-${newIdx}`);
  };

  const handleSaveExperience = (e) => {
    if (e) e.preventDefault();
    const result = validateExperienceData(expandedExpIndex >= 0 ? expandedExpIndex : null);
    if (!result.isValid) {
      setExpandedExpIndex(result.cIdx);
      setExpandedRoleIndex(result.rIdx);
      setExpFieldErrors(result.errors);
      setExpError('Fill details');
      scrollToTarget(result.targetFieldId);
      return;
    }
    setExpError('');
    setExpFieldErrors({});
    const sorted = sortExperience(formData.experience || []);
    const nextFormData = { ...formData, experience: sorted };
    setFormData(nextFormData);
    localStorage.setItem('userProfile', JSON.stringify(nextFormData));
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
                            <select value={p.currency || 'INR'} onChange={e => setP('currency', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500 bg-white cursor-pointer">
                              {currencyOptions.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
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

          {/* Left Sticky Navigation Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0 sticky top-24 bg-white rounded-2xl border border-gray-200 p-3 shadow-xs space-y-3">
            
            {/* Group 1: Profile Sections */}
            <div className="space-y-1">
              <p className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Profile
              </p>
              {tabs.filter(t => t.id !== 'security').map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-between transition-all duration-150 ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Group 2: Account Settings (Differentiated) */}
            <div className="pt-2 border-t border-gray-100 space-y-1">
              <p className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Account Settings
              </p>
              <button
                type="button"
                onClick={() => handleTabClick('security')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-between transition-all duration-150 ${
                  activeTab === 'security'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className={`w-4 h-4 ${activeTab === 'security' ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Security &amp; Password</span>
                </div>
                {activeTab === 'security' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

          </div>

          {/* Right Content Area */}
          <div className="flex-1 w-full animate-fade-in space-y-6 min-h-[500px]">

            {activeTab === 'security' ? (
              <AccountSecuritySection userEmail={formData.email} />
            ) : (
              <>
                {/* Continuous Sections */}
                <section id="basic" className="hidden md:block scroll-mt-40 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="mb-6 pb-2 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">{cmsConfig?.step1?.title || 'Basic Details'}</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    {getStepField('step1', 'firstName', 'First Name', 'Enter first name').label}
                    {getStepField('step1', 'firstName').isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <input type="text" placeholder={getStepField('step1', 'firstName', 'First Name', 'Enter first name').placeholder} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.firstName || ''} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    {getStepField('step1', 'lastName', 'Last Name', 'Enter last name').label}
                    {getStepField('step1', 'lastName').isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <input type="text" placeholder={getStepField('step1', 'lastName', 'Last Name', 'Enter last name').placeholder} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" value={formData.lastName || ''} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    {getStepField('step1', 'phone', 'Phone Number', 'Enter 10-digit mobile number').label}
                    {getStepField('step1', 'phone').isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <input 
                    type="text" 
                    placeholder={getStepField('step1', 'phone', 'Phone Number', 'Enter 10-digit mobile number').placeholder}
                    className={`w-full px-4 py-3 bg-white border ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} 
                    value={formData.phone || ''} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, phone: val});
                      setPhoneError('');
                      if (val.length === 10) checkPhoneAvailability(val);
                    }}
                    onBlur={() => {
                      if (formData.phone && formData.phone.length === 10) checkPhoneAvailability(formData.phone);
                    }}
                  />
                  {phoneError && (
                    <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {phoneError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    {getStepField('step1', 'email', 'Email (Read Only)', 'Enter email address').label}
                  </label>
                  <input type="text" disabled placeholder={getStepField('step1', 'email', 'Email (Read Only)', 'Enter email address').placeholder} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" value={formData.email || ''} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    {getStepField('step1', 'location', 'Current Location', 'Select Current Location').label}
                    {getStepField('step1', 'location').isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <MultiSelectLocationDropdown
                    options={(Array.isArray(cmsConfig?.step1?.locationCities) && cmsConfig.step1.locationCities.length > 0)
                      ? cmsConfig.step1.locationCities
                          .filter(c => c !== 'Anywhere in India' && c !== 'Anywhere in India/Multiple Locations')
                          .map(loc => ({ label: loc, value: loc, displayName: loc }))
                      : currentLocationOptions}
                    value={formData.location || ''}
                    onChange={(val) => setFormData({...formData, location: val})}
                    multiple={false}
                    placeholder={getStepField('step1', 'location', 'Current Location', 'Select Current Location').placeholder}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    {getStepField('step1', 'brief', 'Brief about yourself', 'I am a passionate professional...').label}
                    {getStepField('step1', 'brief').isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <textarea 
                    rows="3"
                    placeholder={getStepField('step1', 'brief', 'Brief about yourself', 'I am a passionate professional...').placeholder}
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
                    <h3 className="text-xl font-bold text-gray-800">{cmsConfig?.step2?.title || 'Education'}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cmsConfig?.step2?.subtitle || 'Details like course, university, and more, help recruiters identify your educational background'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {eduError && <span className="text-red-500 text-xs font-medium">{eduError}</span>}
                    <button onClick={handleAddEducation} className="text-green-500 hover:text-green-600 font-semibold text-sm">
                      {cmsConfig?.step2?.addBtnText || 'Add +'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {sortQualifications(formData.qualifications || []).map((q, idx) => {
                    const eduData = cmsConfig?.step2?.educationData || DEFAULT_EDUCATION_DATA;
                    const currentEduConfig = eduData[q.educationType];
                    const isSchool = currentEduConfig ? currentEduConfig.category === 'school' : (q.educationType === '10th' || q.educationType === '12th');
                    const isHigher = q.educationType && !isSchool;
                    
                    if (expandedEduIndex !== idx) {
                      return (
                        <div key={idx} className="group relative">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-[15px]">
                              {isHigher ? (q.course || q.educationType || 'Higher Education') : 
                               isSchool ? (q.educationType === '12th' ? 'Class XII' : q.educationType === '10th' ? 'Class X' : (q.board || q.educationType)) : 
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
                          <div id={`field-edu-type-${idx}`}>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">
                              {getStepField('step2', 'educationType', 'Education', 'Select education type').label}
                              {getStepField('step2', 'educationType').isRequired && <span className="text-red-500">*</span>}
                            </label>
                            <CustomDropdown
                              options={Object.keys(eduData).map(k => ({ value: k, label: k }))}
                              value={q.educationType || ''}
                              onChange={val => {
                                updateArray('qualifications', idx, 'educationType', val);
                                setEduFieldErrors({...eduFieldErrors, educationType: false});
                                if (val) setEduError('');
                              }}
                              placeholder={getStepField('step2', 'educationType', 'Education', 'Select education type').placeholder}
                              error={eduFieldErrors.educationType || (!!eduError && !q.educationType)}
                            />
                          </div>

                          {isSchool && (
                            <>
                              <div id={`field-edu-board-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'board', 'Board', 'Select board').label}
                                  {getStepField('step2', 'board').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <CustomDropdown 
                                  options={(currentEduConfig?.options && currentEduConfig.options.length > 10)
                                    ? currentEduConfig.options.map(b => (typeof b === 'string' ? { value: b, label: b } : b))
                                    : DEFAULT_BOARD_OPTIONS}
                                  value={q.board || ''}
                                  onChange={val => { updateArray('qualifications', idx, 'board', val); setEduFieldErrors({...eduFieldErrors, board: false}); }}
                                  placeholder={getStepField('step2', 'board', 'Board', 'Select board').placeholder}
                                  error={eduFieldErrors.board}
                                />
                              </div>
                              <div id={`field-edu-endYear-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'endYear', 'Passing out year', 'Select passing out year').label}
                                  {getStepField('step2', 'endYear').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <CustomDropdown
                                  options={Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => ({ value: String(year), label: String(year) }))}
                                  value={q.endYear ? String(q.endYear) : ''}
                                  onChange={val => { updateArray('qualifications', idx, 'endYear', val); setEduFieldErrors({...eduFieldErrors, endYear: false}); }}
                                  placeholder={getStepField('step2', 'endYear', 'Passing out year', 'Select passing out year').placeholder}
                                  error={eduFieldErrors.endYear}
                                />
                              </div>
                              <div id={`field-edu-schoolMedium-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'schoolMedium', 'School medium', 'Select medium').label}
                                  {getStepField('step2', 'schoolMedium').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <CustomDropdown
                                  options={(cmsConfig?.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS).map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt))}
                                  value={q.schoolMedium || ''}
                                  onChange={val => { updateArray('qualifications', idx, 'schoolMedium', val); setEduFieldErrors({...eduFieldErrors, schoolMedium: false}); }}
                                  placeholder={getStepField('step2', 'schoolMedium', 'School medium', 'Select medium').placeholder}
                                  error={eduFieldErrors.schoolMedium}
                                />
                              </div>
                              <div id={`field-edu-percentage-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'percentage', 'Marks', '% marks of 100 maximum').label} {cmsConfig?.step2?.fields?.percentage?.isRequired !== false && <span className="text-red-500">*</span>}
                                </label>
                                <input type="text" className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.percentage ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} placeholder={getStepField('step2', 'percentage', 'Marks', '% marks of 100 maximum').placeholder} value={q.percentage || ''} onChange={e => { updateArray('qualifications', idx, 'percentage', e.target.value); setEduFieldErrors({...eduFieldErrors, percentage: false}); }} />
                              </div>
                            </>
                          )}

                          {isHigher && (
                            <>
                              <div id={`field-edu-university-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'university', 'University / Institute', 'Search global university/institute...').label}
                                  {getStepField('step2', 'university').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <InstituteAutocomplete 
                                  value={q.university || ''}
                                  onChange={val => { updateArray('qualifications', idx, 'university', val); setEduFieldErrors({...eduFieldErrors, university: false}); }}
                                  placeholder={getStepField('step2', 'university', 'University / Institute', 'Search global university/institute...').placeholder}
                                  className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.university ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-400`}
                                />
                              </div>
                              <div id={`field-edu-course-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'course', 'Course', 'Select course').label}
                                  {getStepField('step2', 'course').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <CustomDropdown
                                  options={
                                    (currentEduConfig?.options && currentEduConfig.options.length > 0)
                                      ? currentEduConfig.options.map(c => ({ value: c, label: c }))
                                      : (
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
                                      )
                                  }
                                  value={q.course || ''}
                                  onChange={val => { updateArray('qualifications', idx, 'course', val); setEduFieldErrors({...eduFieldErrors, course: false}); }}
                                  placeholder={getStepField('step2', 'course', 'Course', 'Select course').placeholder}
                                  error={eduFieldErrors.course}
                                />
                              </div>
                              <div id={`field-edu-courseType-${idx}`}>
                                <label className={`block text-sm font-bold ${eduFieldErrors.courseType ? 'text-red-500' : 'text-gray-900'} mb-3`}>
                                  {getStepField('step2', 'courseType', 'Course type', 'Select course type').label}
                                  {getStepField('step2', 'courseType').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <div className="flex flex-wrap items-center gap-6">
                                  {(cmsConfig?.step2?.courseTypeOptions || DEFAULT_COURSE_TYPE_OPTIONS).map((ct) => (
                                    <label key={ct} className="flex items-center cursor-pointer group">
                                      <input 
                                        type="radio" 
                                        name={`courseType-${idx}`} 
                                        value={ct} 
                                        className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" 
                                        checked={q.courseType === ct} 
                                        onChange={(e) => { 
                                          updateArray('qualifications', idx, 'courseType', e.target.value); 
                                          setEduFieldErrors({...eduFieldErrors, courseType: false}); 
                                        }} 
                                      />
                                      <span className={`ml-2.5 text-[15px] ${q.courseType === ct ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>
                                        {ct}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div id={`field-edu-startYear-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  Course duration {(getStepField('step2', 'startYear').isRequired || getStepField('step2', 'endYear').isRequired) && <span className="text-red-500">*</span>}
                                </label>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <CustomDropdown
                                      options={Array.from({length: 30}, (_, i) => new Date().getFullYear() - i).map(year => ({ value: String(year), label: String(year) }))}
                                      value={q.startYear ? String(q.startYear) : ''}
                                      onChange={val => { updateArray('qualifications', idx, 'startYear', val); setEduFieldErrors({...eduFieldErrors, startYear: false}); }}
                                      placeholder={getStepField('step2', 'startYear', 'Starting year', 'Starting year').placeholder}
                                      error={eduFieldErrors.startYear}
                                    />
                                  </div>
                                  <span className="font-bold text-gray-900">To</span>
                                  <div className="flex-1">
                                    <CustomDropdown
                                      options={Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => ({ value: String(year), label: String(year) }))}
                                      value={q.endYear ? String(q.endYear) : ''}
                                      onChange={val => { updateArray('qualifications', idx, 'endYear', val); setEduFieldErrors({...eduFieldErrors, endYear: false}); }}
                                      placeholder={getStepField('step2', 'endYear', 'Ending year', 'Ending year').placeholder}
                                      error={eduFieldErrors.endYear}
                                    />
                                  </div>
                                </div>
                              </div>
                              {(() => {
                                const currentGradingSystems = normalizeGradingSystems(cmsConfig?.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS);
                                const selectedGradingObj = currentGradingSystems.find(g => g.name === q.gradingSystem);
                                const dynamicMarksLabel = selectedGradingObj?.label || 'Marks';
                                const dynamicMarksPlaceholder = selectedGradingObj?.placeholder || 'Enter grade or marks';

                                return (
                                  <>
                                    <div>
                                      <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                        {getStepField('step2', 'gradingSystem', 'Grading system', 'Select grading system', false).label}
                                        {getStepField('step2', 'gradingSystem', 'Grading system', 'Select grading system', false).isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                                      </label>
                                      <CustomDropdown
                                        options={currentGradingSystems.map(gs => ({ value: gs.name, label: gs.name }))}
                                        value={q.gradingSystem || ''}
                                        onChange={val => updateArray('qualifications', idx, 'gradingSystem', val)}
                                        placeholder={getStepField('step2', 'gradingSystem', 'Grading system', 'Select grading system', false).placeholder}
                                      />
                                    </div>
                                    {q.gradingSystem && q.gradingSystem !== 'Not Applicable' && (() => {
                                      const gradeValidation = getGradingValidation(q.gradingSystem, q.percentage);
                                      const hasGradeError = eduFieldErrors.percentage || (!gradeValidation.isValid && q.percentage);
                                      const gradeErrorMsg = !gradeValidation.isValid 
                                        ? gradeValidation.message 
                                        : (typeof eduFieldErrors.percentage === 'string' ? eduFieldErrors.percentage : `Please enter ${dynamicMarksLabel}`);

                                      return (
                                        <div>
                                          <label className={`block text-sm font-bold ${hasGradeError ? 'text-red-500' : 'text-gray-900'} mb-1.5`}>
                                            {dynamicMarksLabel} {cmsConfig?.step2?.fields?.percentage?.isRequired !== false && <span className="text-red-500">*</span>}
                                          </label>
                                          <input 
                                            type="text" 
                                            className={`w-full px-4 py-3 bg-white border ${hasGradeError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} 
                                            placeholder={dynamicMarksPlaceholder} 
                                            value={q.percentage || ''} 
                                            onChange={e => { 
                                              updateArray('qualifications', idx, 'percentage', e.target.value.replace(/[^0-9.]/g, '')); 
                                              setEduFieldErrors({...eduFieldErrors, percentage: false}); 
                                            }} 
                                          />
                                          {hasGradeError && (
                                            <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                              </svg>
                                              {gradeErrorMsg}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </>
                                );
                              })()}
                            </>
                          )}
                          
                          {q.educationType && !q.isPrimary && (
                            <div className="flex items-center pt-2 border-t border-gray-100 mt-4 pb-2">
                              <input type="checkbox" id={`primary-edu-${idx}`} className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500" checked={q.isPrimary || false} onChange={e => updateArray('qualifications', idx, 'isPrimary', e.target.checked)} />
                              <label htmlFor={`primary-edu-${idx}`} className="ml-3 text-gray-700 font-medium cursor-pointer">Mark this as my primary education</label>
                            </div>
                          )}
                          {q.educationType && q.isPrimary && (
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-4 pb-2 text-xs font-bold text-green-700">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span>Primary Education</span>
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
                  <h3 className="text-xl font-bold text-gray-800">{cmsConfig?.step3?.title || 'Work Experience'}</h3>
                  {cmsConfig?.step3?.subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5">{cmsConfig.step3.subtitle}</p>
                  )}
                </div>
                {formData.isFresher !== true && (
                  <div className="flex items-center gap-3">
                    {expError && <span className="text-red-500 text-xs font-medium">{expError}</span>}
                    <button type="button" onClick={handleAddExperience} className="text-green-500 font-semibold hover:text-green-600 text-sm whitespace-nowrap">
                      {cmsConfig?.step3?.addBtnText || 'Add +'}
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                      <div className="flex flex-col items-start gap-3 mb-6">
                        <label className="text-sm font-medium text-gray-700">{cmsConfig?.step3?.fresherLabel || 'Are you a Fresher?'}</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center cursor-pointer group">
                            <input type="radio" name="isFresher_profile" value="yes" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={formData.isFresher === true} onChange={() => setFormData({...formData, isFresher: true})} />
                            <span className={`ml-2.5 text-[15px] ${formData.isFresher === true ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>I am a Fresher</span>
                          </label>
                          <label className="flex items-center cursor-pointer group">
                            <input 
                              type="radio" 
                              name="isFresher_profile" 
                              value="no" 
                              className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" 
                              checked={formData.isFresher === false} 
                              onChange={() => {
                                const isExpEmpty = !formData.experience || formData.experience.length === 0;
                                if (isExpEmpty) {
                                  setExpandedExpIndex(0);
                                  setFormData({
                                    ...formData,
                                    isFresher: false,
                                    experience: [{ companyName: '', noticePeriod: '', roles: [{ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }] }]
                                  });
                                } else {
                                  if (expandedExpIndex < 0) {
                                    setExpandedExpIndex(0);
                                  }
                                  setFormData({...formData, isFresher: false});
                                }
                              }} 
                            />
                            <span className={`ml-2.5 text-[15px] ${formData.isFresher === false ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>I have experience</span>
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
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-gray-800">{role.jobTitle || 'Job Title'}</p>
                                          {role.currentCompany && (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider rounded-full">Current Role</span>
                                          )}
                                        </div>
                                        <p className="text-gray-500 text-sm mt-0.5">
                                          {formatMonthYear(role.joiningDate)} - {role.currentCompany ? 'Present' : formatMonthYear(role.leavingDate)} | {role.employmentType || 'Employment Type'}{role.currentCompany && exp.noticePeriod ? ` | Notice: ${exp.noticePeriod}` : ''}
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
                                {(() => {
                                  const fCompany = getStepField('step3', 'companyName', 'Company Name', 'Enter or search company name...', true);
                                  const fJobTitle = getStepField('step3', 'jobTitle', 'Job Title', 'Enter or search job title...', true);
                                  const fEmpType = getStepField('step3', 'employmentType', 'Employment Type', 'Select', true);
                                  const fJoining = getStepField('step3', 'joiningDate', 'Joining', 'Select joining date', true);
                                  const fLeaving = getStepField('step3', 'leavingDate', 'Leaving', 'Select leaving date', true);
                                  const fCurrent = getStepField('step3', 'currentCompany', 'Current role', '', false);
                                  const fRoleDesc = getStepField('step3', 'roleDescription', 'Roles & Responsibilities', 'Briefly describe your roles & responsibilities', false);
                                  const fNotice = getStepField('step3', 'noticePeriod', 'Notice Period', 'Select', false);

                                  return (
                                    <>
                                      <div id={`field-exp-company-${cIdx}`}>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">{fCompany.label} {fCompany.isRequired && <span className="text-red-500">*</span>}</label>
                                        <CompanyAutocomplete 
                                          value={exp.companyName || ''} 
                                          className={`w-full px-4 py-3 bg-white border ${expFieldErrors.companyName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`}
                                          onChange={val => {
                                            const newExp = [...(formData.experience || [])];
                                            newExp[cIdx].companyName = val;
                                            setFormData({...formData, experience: newExp});
                                            setExpFieldErrors({...expFieldErrors, companyName: false});
                                          }} 
                                          placeholder={fCompany.placeholder || "Enter or search company name..."}
                                        />
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
                                                <div className={`${isRoleExpanded ? 'overflow-visible' : 'overflow-hidden'} min-h-0`}>
                                                  <div className="p-6 border-t border-gray-100 space-y-6 relative bg-white">
                                                    <button onClick={(e) => {
                                                      e.stopPropagation();
                                                      const newExp = [...(formData.experience || [])];
                                                      newExp[cIdx].roles.splice(rIdx, 1);
                                                      setFormData({...formData, experience: newExp});
                                                    }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors hidden md:block group-hover:block z-10">
                                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                    
                                                    <div id={`field-exp-jobTitle-${cIdx}-${rIdx}`}>
                                                      <label className="block text-sm font-bold text-gray-900 mb-1.5">{fJobTitle.label} {fJobTitle.isRequired && <span className="text-red-500">*</span>}</label>
                                                      <JobTitleAutocomplete 
                                                        value={role.jobTitle || ''} 
                                                        className={`w-full px-4 py-3 bg-white border ${expFieldErrors.roles?.[rIdx]?.jobTitle ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`}
                                                        onChange={val => {
                                                          const newExp = [...(formData.experience || [])];
                                                          newExp[cIdx].roles[rIdx].jobTitle = val;
                                                          setFormData({...formData, experience: newExp});
                                                          if (expFieldErrors.roles?.[rIdx]?.jobTitle) {
                                                            const newErrors = {...expFieldErrors};
                                                            newErrors.roles[rIdx].jobTitle = false;
                                                            setExpFieldErrors(newErrors);
                                                          }
                                                        }} 
                                                        placeholder={fJobTitle.placeholder || "Enter or search job title..."}
                                                      />
                                                    </div>
                                                    <div id={`field-exp-empType-${cIdx}-${rIdx}`}>
                                                      <label className="block text-sm font-bold text-gray-900 mb-1.5">{fEmpType.label} {fEmpType.isRequired && <span className="text-red-500">*</span>}</label>
                                                      <CustomDropdown
                                                        options={(cmsConfig?.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS).map(opt => ({ value: opt, label: opt }))}
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
                                                        placeholder={fEmpType.placeholder || "Select"}
                                                        error={expFieldErrors.roles?.[rIdx]?.employmentType}
                                                      />
                                                    </div>
                                                    <div className="flex items-center mt-6">
                                                      <input 
                                                        type="checkbox" 
                                                        id={`current-${cIdx}-${rIdx}`} 
                                                        className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500 mr-3 cursor-pointer" 
                                                        checked={role.currentCompany || false} 
                                                        onChange={e => {
                                                          const isChecked = e.target.checked;
                                                          const newExp = (formData.experience || []).map((expItem, compI) => ({
                                                            ...expItem,
                                                            roles: (expItem.roles || []).map((rItem, roleI) => ({
                                                              ...rItem,
                                                              currentCompany: (compI === cIdx && roleI === rIdx) ? isChecked : false,
                                                              leavingDate: (compI === cIdx && roleI === rIdx && isChecked) ? '' : rItem.leavingDate
                                                            }))
                                                          }));
                                                          setFormData({...formData, experience: newExp});
                                                        }} 
                                                      />
                                                      <label htmlFor={`current-${cIdx}-${rIdx}`} className="text-sm font-bold text-gray-900 cursor-pointer">
                                                        {fCurrent.label || 'Currently working here'}
                                                      </label>
                                                    </div>
                                                    <div className="space-y-6">
                                                      <div id={`field-exp-joiningDate-${cIdx}-${rIdx}`}>
                                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">{fJoining.label} {fJoining.isRequired && <span className="text-red-500">*</span>}</label>
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
                                                            placeholder={fJoining.placeholder || "Select joining date"}
                                                          />
                                                        </div>
                                                      </div>
                                                      {!role.currentCompany && (
                                                        <div id={`field-exp-leavingDate-${cIdx}-${rIdx}`}>
                                                          <label className="block text-sm font-bold text-gray-900 mb-1.5">{fLeaving.label} {fLeaving.isRequired && <span className="text-red-500">*</span>}</label>
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
                                                              placeholder={fLeaving.placeholder || "Select leaving date"}
                                                            />
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="col-span-2" id={`field-exp-roleDesc-${cIdx}-${rIdx}`}>
                                                      <label className="block text-sm font-bold text-gray-900 mb-1.5">{fRoleDesc.label} {fRoleDesc.isRequired && <span className="text-red-500">*</span>}</label>
                                                      <textarea 
                                                        className={`w-full px-4 py-3 bg-white border ${expFieldErrors.roles?.[rIdx]?.roleDescription ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 h-24 resize-none outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} 
                                                        placeholder={fRoleDesc.placeholder || "Briefly describe your roles & responsibilities"}
                                                        value={role.roleDescription || ''} 
                                                        onChange={e => {
                                                          const newExp = [...(formData.experience || [])];
                                                          newExp[cIdx].roles[rIdx].roleDescription = e.target.value;
                                                          setFormData({...formData, experience: newExp});
                                                          if (expFieldErrors.roles?.[rIdx]?.roleDescription) {
                                                            const newErrors = {...expFieldErrors};
                                                            if (newErrors.roles?.[rIdx]) newErrors.roles[rIdx].roleDescription = false;
                                                            setExpFieldErrors(newErrors);
                                                          }
                                                        }} 
                                                      />
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
                                          <label className="block text-sm font-bold text-gray-900 mb-1.5">{fNotice.label} {fNotice.isRequired && <span className="text-red-500">*</span>}</label>
                                          <div className="w-full md:w-1/2">
                                            <CustomDropdown
                                              options={(cmsConfig?.step3?.noticePeriodOptions || cmsConfig?.step4?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS).map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt))}
                                              value={exp.noticePeriod || ''}
                                              onChange={val => {
                                                const newExp = [...(formData.experience || [])];
                                                newExp[cIdx].noticePeriod = val;
                                                setFormData({...formData, experience: newExp});
                                              }}
                                              placeholder={fNotice.placeholder || "Select"}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
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
                              {cmsConfig?.step3?.addBtnText || 'Add +'}
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
                    <h3 className="text-xl font-bold text-gray-800">{cmsConfig?.step4?.title || 'Professional Overview'}</h3>
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
                    <h2 className="text-[18px] font-bold text-gray-900">Edit {cmsConfig?.step4?.title || 'Professional Overview'}</h2>
                    <button onClick={() => setIsEditingProfOverviewMobile(false)} className="text-gray-900 p-2 -mr-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                {/* Desktop Header */}
                <div className="hidden md:block mb-6 pb-2 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800">{cmsConfig?.step4?.title || 'Professional Overview'}</h3>
                  {cmsConfig?.step4?.subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5">{cmsConfig.step4.subtitle}</p>
                  )}
                </div>
                
                <div className={`grid-cols-1 md:grid-cols-2 gap-6 ${isEditingProfOverviewMobile ? 'grid p-4 pb-24 md:p-0' : 'hidden md:grid'}`}>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">
                      {getStepField('step1', 'industry', 'Function', 'Select Function').label}
                      {getStepField('step1', 'industry').isRequired && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <CustomDropdown
                      options={(() => {
                        const functionsMap = (cmsConfig?.step1?.functionsData && Object.keys(cmsConfig.step1.functionsData).length > 0)
                          ? cmsConfig.step1.functionsData
                          : DEFAULT_FUNCTIONS_DATA;
                        return Object.keys(functionsMap).map(ind => ({ value: ind, label: ind }));
                      })()}
                      value={formData.industry || ''}
                      onChange={val => {
                        setFormData({...formData, industry: val, designation: ''});
                      }}
                      placeholder={getStepField('step1', 'industry', 'Function', 'Select Function').placeholder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">
                      {getStepField('step1', 'designation', 'Current Designation', 'Search or type designation').label}
                      {getStepField('step1', 'designation').isRequired && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <CustomDropdown
                      options={(() => {
                        const functionsMap = (cmsConfig?.step1?.functionsData && Object.keys(cmsConfig.step1.functionsData).length > 0)
                          ? cmsConfig.step1.functionsData
                          : DEFAULT_FUNCTIONS_DATA;
                        if (formData.industry && functionsMap[formData.industry]) {
                          return [...functionsMap[formData.industry], "Other"].map(role => ({ value: role, label: role }));
                        }
                        const allRoles = [...new Set(Object.values(functionsMap).flat()), "Product Manager", "Project Manager", "Business Analyst", "Operations Manager", "Other"];
                        return allRoles.sort().map(role => ({ value: role, label: role }));
                      })()}
                      value={formData.designation || ''}
                      onChange={val => setFormData({...formData, designation: val})}
                      placeholder={getStepField('step1', 'designation', 'Current Designation', 'Search or type designation').placeholder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">
                      {getStepField('step1', 'preferredLocation', 'Preferred Location', 'Search Locations').label}
                      {getStepField('step1', 'preferredLocation').isRequired && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {(formData.preferredLocation ? formData.preferredLocation.split(',').map(s => s.trim()).filter(Boolean) : []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.preferredLocation.split(',').map(s => s.trim()).filter(Boolean).map(loc => (
                          <span 
                            key={loc} 
                            className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors shadow-2xs" 
                            onClick={() => removePreferredLocation(loc)} 
                            title="Click to remove"
                          >
                            {loc} <span className="text-[10px]">✕</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <MultiSelectLocationDropdown
                      options={(Array.isArray(cmsConfig?.step1?.locationCities) && cmsConfig.step1.locationCities.length > 0)
                        ? cmsConfig.step1.locationCities.map(loc => ({ label: loc, value: loc, displayName: loc }))
                        : preferredLocationOptions}
                      value={formData.preferredLocation || ''}
                      onChange={(val) => setFormData({...formData, preferredLocation: val})}
                      placeholder={getStepField('step1', 'preferredLocation', 'Preferred Location', 'Search Locations').placeholder}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">
                      {getStepField('step4', 'linkedinUrl', 'LinkedIn Profile URL', 'https://linkedin.com/in/...').label}
                      {getStepField('step4', 'linkedinUrl').isRequired && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input 
                      type="text" 
                      placeholder={getStepField('step4', 'linkedinUrl', 'LinkedIn Profile URL', 'https://linkedin.com/in/...').placeholder}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" 
                      value={p.linkedinUrl || ''} 
                      onChange={e => setP('linkedinUrl', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">
                      {getStepField('step1', 'totalExperience', 'Total Experience', 'Select Total Experience').label}
                      {getStepField('step1', 'totalExperience').isRequired && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <CustomDropdown
                      options={(Array.isArray(cmsConfig?.step1?.experienceOptions) && cmsConfig.step1.experienceOptions.length > 0)
                        ? cmsConfig.step1.experienceOptions.map(item => ({ value: item, label: item }))
                        : experienceOptions}
                      value={formData.totalExperience || ''}
                      onChange={val => setFormData({...formData, totalExperience: val})}
                      placeholder={getStepField('step1', 'totalExperience', 'Total Experience', 'Select Total Experience').placeholder}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            {p.salaryType === 'Monthly'
                              ? (getStepField('step4', 'currentSalary', 'Current Annual CTC').label ? getStepField('step4', 'currentSalary', 'Current Annual CTC').label.replace(/Annual CTC|Annual Salary|Annual/gi, 'Monthly CTC') : 'Current Monthly CTC')
                              : (getStepField('step4', 'currentSalary', 'Current Annual CTC').label || 'Current Annual CTC')}
                            {getStepField('step4', 'currentSalary').isRequired && <span className="text-red-500 ml-0.5">*</span>}
                          </label>
                          <input 
                            type="text" 
                            placeholder={p.salaryType === 'Monthly'
                              ? (getStepField('step4', 'currentSalary', 'Current Annual CTC', `e.g. ${getCurrencySymbol(p.currency)}40,000`).placeholder ? getStepField('step4', 'currentSalary', 'Current Annual CTC', `e.g. ${getCurrencySymbol(p.currency)}40,000`).placeholder.replace(/5,00,000|500000/g, '40,000') : `e.g. ${getCurrencySymbol(p.currency)}40,000`)
                              : (getStepField('step4', 'currentSalary', 'Current Annual CTC', `e.g. ${getCurrencySymbol(p.currency)}5,00,000`).placeholder || `e.g. ${getCurrencySymbol(p.currency)}5,00,000`)}
                            value={p.currentSalary || ''}
                            onChange={(e) => setP('currentSalary', formatIndianNumber(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            {p.salaryType === 'Monthly'
                              ? (getStepField('step4', 'expectedSalary', 'Expected Annual CTC').label ? getStepField('step4', 'expectedSalary', 'Expected Annual CTC').label.replace(/Annual CTC|Annual Salary|Annual/gi, 'Monthly CTC') : 'Expected Monthly CTC')
                              : (getStepField('step4', 'expectedSalary', 'Expected Annual CTC').label || 'Expected Annual CTC')}
                            {getStepField('step4', 'expectedSalary').isRequired && <span className="text-red-500 ml-0.5">*</span>}
                          </label>
                          <input 
                            type="text" 
                            placeholder={p.salaryType === 'Monthly'
                              ? (getStepField('step4', 'expectedSalary', 'Expected Annual CTC', `e.g. ${getCurrencySymbol(p.currency)}60,000`).placeholder ? getStepField('step4', 'expectedSalary', 'Expected Annual CTC', `e.g. ${getCurrencySymbol(p.currency)}60,000`).placeholder.replace(/7,50,000|750000|8,00,000|800000/g, '60,000') : `e.g. ${getCurrencySymbol(p.currency)}60,000`)
                              : (getStepField('step4', 'expectedSalary', 'Expected Annual CTC', `e.g. ${getCurrencySymbol(p.currency)}7,50,000`).placeholder || `e.g. ${getCurrencySymbol(p.currency)}7,50,000`)}
                            value={p.expectedSalary || ''}
                            onChange={(e) => setP('expectedSalary', formatIndianNumber(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]/20 transition-all placeholder:text-gray-400 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Merged Skills inside Professional Overview */}
                  <div className="col-span-1 md:col-span-2 mt-2 pt-6 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-900 mb-1.5">
                      {getStepField('step4', 'skills', 'Skills', 'Search or select a skill to add...').label}
                      {getStepField('step4', 'skills').isRequired && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : []).map(skill => (
                        <span key={skill} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[13px] font-bold border border-green-100 flex items-center gap-1.5 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors shadow-sm" onClick={() => removeSkill(skill)} title="Click to remove">
                          {skill} <span className="text-[10px] bg-green-200/50 text-green-800 rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-200 hover:text-red-800 transition-colors">✕</span>
                        </span>
                      ))}
                    </div>
                    <CustomDropdown
                      options={(() => {
                        if (Array.isArray(cmsConfig?.step4?.skillsOptions) && cmsConfig.step4.skillsOptions.length > 0) {
                          return cmsConfig.step4.skillsOptions.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
                        }
                        return allSkillsOptions;
                      })()}
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
                      placeholder={getStepField('step4', 'skills', 'Skills', 'Search or select a skill to add...').placeholder}
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
                                  const currentSkills = p.skills ? p.skills.split(',').map(s => s.trim()) : [];
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

              <section id="documents" className="scroll-mt-40 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <div className="mb-6 pb-2 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">{cmsConfig?.step5?.title || 'Documents & Media'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{cmsConfig?.step5?.subtitle || 'Manage your introductory video, resume, and cover letter.'}</p>
              </div>
              {(() => {
                const vCfg = cmsConfig?.step5?.videoConfig || {};
                const fIntro = getStepField('step5', 'introVideo', 'Introductory Video', 'Upload MP4/MOV or attach video link', false);
                const videoSectionTitle = vCfg.sectionTitle || fIntro.label || 'Introductory Video';
                const videoSectionSubtitle = vCfg.sectionSubtitle || fIntro.placeholder || 'Upload MP4/MOV or attach video link';
                const uploadTabLabel = vCfg.uploadTabLabel || 'Upload File';
                const linkTabLabel = vCfg.linkTabLabel || 'Paste Link';
                const uploadDropzoneTitle = vCfg.uploadDropzoneTitle || 'Click or drag video to upload';
                const uploadDropzoneSubtitle = vCfg.uploadDropzoneSubtitle || 'MP4, MOV, WebM up to 200MB (Max 3 mins)';
                const linkInputPlaceholder = vCfg.linkInputPlaceholder || 'e.g. YouTube, Loom, Vimeo, Drive, or Mux stream link';
                const linkAttachButtonText = vCfg.linkAttachButtonText || 'Attach';
                const linkHelpText = vCfg.linkHelpText || 'Supported: YouTube, Loom, Vimeo, Google Drive, Mux Stream URLs, and MP4 links.';

                return (
              <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Resume Upload */}
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <label className="block text-sm font-bold text-gray-900 mb-3">
                          {getStepField('step5', 'resume', 'Upload Resume', 'Supported Formats: doc, docx, pdf, upto 300KB', true).label}
                          {getStepField('step5', 'resume', '', '', true).isRequired && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        <input key={docs.resume ? 'res-has' : 'res-empty'} type="file" disabled={isUploading} accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-palette-50 file:text-palette-900 hover:file:bg-palette-100 cursor-pointer disabled:opacity-50" onChange={e => handleFileUpload(e, 'resume')} />
                        {isUploading && uploadingType === 'resume' && (
                          <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 animate-pulse mt-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                            </span>
                            <span>Uploading {getStepField('step5', 'resume', 'Upload Resume', 'Supported Formats: doc, docx, pdf, upto 300KB', true).label || 'Resume'}...</span>
                          </div>
                        )}
                        {docError.resume && <p className="text-xs text-red-500 mt-2 font-medium">{docError.resume}</p>}
                        <p className="text-xs text-black mt-2 font-medium">
                          {getStepField('step5', 'resume', 'Upload Resume', 'Supported Formats: doc, docx, pdf, upto 300KB', true).placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}
                        </p>
                        {docs.resume && (
                          <div className="flex items-center justify-between mt-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="min-w-0 truncate">
                                <a 
                                  href={docs.resume.startsWith('http') ? docs.resume : '#'} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-xs sm:text-sm font-bold text-gray-900 hover:text-emerald-600 hover:underline truncate block"
                                >
                                  {docsMeta?.resume?.name || getFileName(docs.resume, 'Resume Document')}
                                </a>
                                <p className="text-[11px] text-gray-500 font-medium">
                                  {docsMeta?.resume?.size ? `${docsMeta.resume.size} • ` : ''}Uploaded Document
                                </p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setDoc('resume', '')} 
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" 
                              title="Remove Resume"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                       {/* Cover Letter Upload */}
                      <div className="p-4 border border-gray-200 rounded-xl">
                        <label className="flex items-center justify-between text-sm font-bold text-gray-900 mb-3">
                          <span>{getStepField('step5', 'coverLetter', 'Upload Cover Letter', 'Supported Formats: doc, docx, pdf, upto 300KB').label}</span>
                          {getStepField('step5', 'coverLetter', '', '', false).isRequired && (
                            <span className="text-red-500 font-bold ml-0.5">*</span>
                          )}
                        </label>
                        <input key={docs.coverLetter ? 'cl-has' : 'cl-empty'} type="file" disabled={isUploading} accept=".pdf,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-palette-50 file:text-palette-900 hover:file:bg-palette-100 cursor-pointer disabled:opacity-50" onChange={e => handleFileUpload(e, 'coverLetter')} />
                        {isUploading && uploadingType === 'coverLetter' && (
                          <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 animate-pulse mt-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                            </span>
                            <span>Uploading {getStepField('step5', 'coverLetter', 'Upload Cover Letter', 'Supported Formats: doc, docx, pdf, upto 300KB').label || 'Cover Letter'}...</span>
                          </div>
                        )}
                        {docError.coverLetter && <p className="text-xs text-red-500 mt-2 font-medium">{docError.coverLetter}</p>}
                        <p className="text-xs text-black mt-2 font-medium">
                          {getStepField('step5', 'coverLetter', 'Upload Cover Letter', 'Supported Formats: doc, docx, pdf, upto 300KB').placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}
                        </p>
                        {docs.coverLetter && (
                          <div className="flex items-center justify-between mt-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="min-w-0 truncate">
                                <a 
                                  href={docs.coverLetter.startsWith('http') ? docs.coverLetter : '#'} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-xs sm:text-sm font-bold text-gray-900 hover:text-emerald-600 hover:underline truncate block"
                                >
                                  {docsMeta?.coverLetter?.name || getFileName(docs.coverLetter, 'Cover Letter Document')}
                                </a>
                                <p className="text-[11px] text-gray-500 font-medium">
                                  {docsMeta?.coverLetter?.size ? `${docsMeta.coverLetter.size} • ` : ''}Uploaded Document
                                </p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setDoc('coverLetter', '')} 
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" 
                              title="Remove Cover Letter"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Introductory Video Card in Profile */}
                      <div className="col-span-1 md:col-span-2 p-5 border border-emerald-100 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-white to-gray-50 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                              {videoSectionTitle}
                              {fIntro.isRequired && (
                                <span className="text-red-500 font-bold ml-0.5">*</span>
                              )}
                            </label>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {videoSectionSubtitle}
                            </p>
                          </div>
                          <div className="flex bg-gray-200/80 p-1 rounded-xl text-xs font-semibold self-start">
                            <button
                              type="button"
                              onClick={() => setVideoProfileMode('upload')}
                              className={`px-3 py-1 rounded-lg transition-all ${videoProfileMode === 'upload' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                              {uploadTabLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => setVideoProfileMode('link')}
                              className={`px-3 py-1 rounded-lg transition-all ${videoProfileMode === 'link' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                              {linkTabLabel}
                            </button>
                          </div>
                        </div>

                        {videoProfileMode === 'upload' && !docs.introVideo && (
                          <div className="p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-white text-center hover:border-emerald-400 transition-all relative">
                            <input
                              type="file"
                              disabled={isUploading}
                              accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.mov,.webm,.mkv,.m4v"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={e => handleFileUpload(e, 'introVideo')}
                            />
                            <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                              {isUploading && uploadingType === 'introVideo' ? (
                                <svg className="animate-spin w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>

                            {isUploading && uploadingType === 'introVideo' ? (
                              <div className="max-w-xs mx-auto space-y-2 mt-1">
                                <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                                  <span>Uploading video...</span>
                                  <span>{videoUploadProgress}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-300 ease-out" 
                                    style={{ width: `${Math.max(videoUploadProgress, 5)}%` }}
                                  />
                                </div>
                                <p className="text-[11px] text-gray-400">Processing video stream, please wait...</p>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm font-semibold text-emerald-600 hover:underline">
                                  {uploadDropzoneTitle}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">{uploadDropzoneSubtitle}</p>
                              </>
                            )}
                          </div>
                        )}

                        {videoProfileMode === 'link' && !docs.introVideo && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="url"
                                placeholder={linkInputPlaceholder}
                                value={videoProfileLink}
                                onChange={e => setVideoProfileLink(e.target.value)}
                                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                              <button
                                type="button"
                                onClick={handleAttachVideoLink}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 cursor-pointer"
                              >
                                {linkAttachButtonText}
                              </button>
                            </div>
                            <p className="text-[11px] text-gray-400">{linkHelpText}</p>
                          </div>
                        )}

                        {docError.introVideo && (
                          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs shadow-xs animate-shake">
                            <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <span className="font-bold block text-red-800">Cannot upload video:</span>
                              <p className="mt-0.5 leading-relaxed">{docError.introVideo}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocError(prev => ({ ...prev, introVideo: '' }))}
                              className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                              title="Dismiss"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}

                        {docs.introVideo && (
                          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  Video Attached
                                </span>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                  (formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {(formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone' ? (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                      Visible to All Employers
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                      Applied Job Only
                                    </>
                                  )}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDoc('introVideo', '')}
                                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>

                            <VideoPlayer url={docs.introVideo} />

                            {/* Visibility / Sharing Options */}
                            <div className="pt-3 border-t border-gray-100 space-y-2">
                              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Who can see this video?
                              </label>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {/* Option 1: Share to everyone */}
                                <button
                                  type="button"
                                  onClick={() => handleVisibilityChange('everyone')}
                                  className={`w-full text-left p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                                    (formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone'
                                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                    (formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone'
                                      ? 'border-emerald-600 bg-emerald-600'
                                      : 'border-gray-300 bg-white'
                                  }`}>
                                    {(formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone' && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-xs font-bold text-gray-900">Share to everyone</p>
                                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">All Employees List</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                      All employers can view your introductory video in the all employee list.
                                    </p>
                                  </div>
                                </button>

                                {/* Option 2: Share to applied jobs */}
                                <button
                                  type="button"
                                  onClick={() => handleVisibilityChange('applied')}
                                  className={`w-full text-left p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                                    (formData.videoVisibility || formData.documents?.videoVisibility) === 'applied'
                                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                                    (formData.videoVisibility || formData.documents?.videoVisibility) === 'applied'
                                      ? 'border-emerald-600 bg-emerald-600'
                                      : 'border-gray-300 bg-white'
                                  }`}>
                                    {(formData.videoVisibility || formData.documents?.videoVisibility) === 'applied' && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-xs font-bold text-gray-900">Share to applied jobs</p>
                                      <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">Applied Only</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                                      Only employers of jobs you specifically apply to can watch your video.
                                    </p>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
                );
              })()}
              </section>
              </>
            )}

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
