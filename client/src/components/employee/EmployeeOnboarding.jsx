import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomMonthPicker from '../common/CustomMonthPicker';
import CustomDropdown from '../common/CustomDropdown';
import MultiSelectLocationDropdown from '../common/MultiSelectLocationDropdown';
import { currentLocationOptions, preferredLocationOptions } from '../../data/preferredLocations';
import { allSkillsOptions, getSuggestedSkills } from '../../utils/skillsData';
import { uploadFileToStorage } from '../../utils/firebaseStorage';
import { uploadVideoToMux } from '../../utils/muxUpload';
import { compressFileIfNeeded } from '../../utils/fileCompressor';
import VideoPlayer from '../common/VideoPlayer';
import InstituteAutocomplete from '../common/InstituteAutocomplete';
import JobTitleAutocomplete from '../common/JobTitleAutocomplete';
import CompanyAutocomplete from '../common/CompanyAutocomplete';

const formatMonthYear = (dateStr) => {
  if (!dateStr) return 'MM/YYYY';
  const [year, month] = dateStr.split('-');
  if (!year || !month) return 'MM/YYYY';
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthsList[parseInt(month, 10) - 1]} ${year}`;
};

export const DEFAULT_CURRENCY_OPTIONS = [
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

export const getCurrencySymbol = (currencyCode) => {
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

export const DEFAULT_BOARD_OPTIONS = [
  { label: '----- Central & National Boards -----', isGroupLabel: true },
  { value: 'CBSE', label: 'CBSE (Central Board of Secondary Education)', keywords: ['cbse', 'central board', 'delhi cbse', 'all india', 'aissee', 'aissce', 'ncert'] },
  { value: 'ICSE / ISC', label: 'ICSE / ISC (Council for the Indian School Certificate Examinations - CISCE)', keywords: ['icse', 'isc', 'cisce', 'council', '10th icse', '12th isc'] },
  { value: 'NIOS', label: 'NIOS (National Institute of Open Schooling)', keywords: ['nios', 'open school', 'national open board', 'distance'] },
  { value: 'IB', label: 'IB (International Baccalaureate)', keywords: ['ib', 'international baccalaureate', 'ibdp', 'myp', 'pyp'] },
  { value: 'Cambridge', label: 'Cambridge International (IGCSE / A-Levels / O-Levels)', keywords: ['cambridge', 'igcse', 'cie', 'caie', 'a levels', 'o levels'] },
  
  { label: '----- State Boards (India) -----', isGroupLabel: true },
  { value: 'Uttar Pradesh Board (UPMSP / UP Board)', label: 'UP Board (UPMSP - Uttar Pradesh Madhyamik Shiksha Parishad)', keywords: ['up', 'up board', 'upmsp', 'uttar pradesh', 'allahabad board', 'prayagraj board', 'high school', 'intermediate', 'upboard'] },
  { value: 'Bihar Board (BSEB)', label: 'Bihar Board (BSEB - Bihar School Examination Board)', keywords: ['bihar', 'bseb', 'bihar board', 'patna board', 'matric', 'inter', 'bseb patna', 'br'] },
  { value: 'Maharashtra Board (MSBSHSE)', label: 'Maharashtra Board (MSBSHSE - Maharashtra State Board)', keywords: ['maharashtra', 'msbshse', 'maha board', 'ssc', 'hsc', 'pune board', 'mumbai board', 'mh'] },
  { value: 'Rajasthan Board (RBSE / BSER)', label: 'Rajasthan Board (RBSE / BSER - Ajmer Board)', keywords: ['rajasthan', 'rbse', 'bser', 'raj board', 'ajmer board', 'rbse ajmer', 'rj'] },
  { value: 'Madhya Pradesh Board (MPBSE)', label: 'MP Board (MPBSE - Madhya Pradesh Board of Secondary Education)', keywords: ['mp', 'mp board', 'mpbse', 'madhya pradesh', 'bhopal board'] },
  { value: 'Gujarat Board (GSEB / GSHSEB)', label: 'Gujarat Board (GSEB - Gujarat Secondary & Higher Secondary Education Board)', keywords: ['gujarat', 'gseb', 'gshseb', 'gujarat board', 'gandhinagar board', 'gj'] },
  { value: 'Haryana Board (HBSE / BSEH)', label: 'Haryana Board (HBSE / BSEH - Board of School Education Haryana)', keywords: ['haryana', 'hbse', 'bseh', 'haryana board', 'bhiwani board', 'hr'] },
  { value: 'Delhi Board (DBSE)', label: 'Delhi Board (DBSE - Delhi Board of School Education)', keywords: ['delhi', 'dbse', 'delhi board', 'dl'] },
  { value: 'Jharkhand Board (JAC)', label: 'Jharkhand Board (JAC - Jharkhand Academic Council)', keywords: ['jharkhand', 'jac', 'jharkhand board', 'ranchi board', 'jac ranchi', 'jh'] },
  { value: 'Karnataka Board (KSEEB / KSEAB)', label: 'Karnataka Board (KSEEB / KSEAB - Karnataka School Examination Board)', keywords: ['karnataka', 'kseeb', 'kseab', 'dpue', 'puc', 'sslc', 'bangalore board', 'ka'] },
  { value: 'Punjab Board (PSEB)', label: 'Punjab Board (PSEB - Punjab School Education Board)', keywords: ['punjab', 'pseb', 'punjab board', 'mohali board', 'pb'] },
  { value: 'West Bengal Board (WBBSE / WBCHSE)', label: 'West Bengal Board (WBBSE / WBCHSE - Madhyamik / HS)', keywords: ['west bengal', 'bengal', 'wb', 'wbbse', 'wbchse', 'madhyamik', 'hs', 'kolkata board'] },
  { value: 'Tamil Nadu Board (TNDGE)', label: 'Tamil Nadu Board (TNDGE - Directorate of Government Examinations)', keywords: ['tamil nadu', 'tn', 'tndge', 'samacheer', 'sslc', 'hsc', 'chennai board', 'tn board'] },
  { value: 'Telangana Board (TSBIE / BSE)', label: 'Telangana Board (TSBIE / BSE - Telangana State Board)', keywords: ['telangana', 'ts', 'tsbie', 'bse telangana', 'inter ts', 'hyderabad board', 'telangana board'] },
  { value: 'Andhra Pradesh Board (BSEAP / BIEAP)', label: 'Andhra Pradesh Board (BSEAP / BIEAP - AP Board)', keywords: ['andhra pradesh', 'ap', 'bseap', 'bieap', 'inter ap', 'andhra board', 'ap board'] },
  { value: 'Kerala Board (KBPE / DHSE)', label: 'Kerala Board (KBPE / DHSE - Kerala Board of Public Examinations)', keywords: ['kerala', 'kbpe', 'dhse', 'sslc kerala', 'plus two', 'kl', 'kerala board'] },
  { value: 'Odisha Board (BSE / CHSE)', label: 'Odisha Board (BSE / CHSE - Board of Secondary Education Odisha)', keywords: ['odisha', 'orissa', 'bse odisha', 'chse odisha', 'cuttack board', 'od', 'or'] },
  { value: 'Assam Board (SEBA / AHSEC)', label: 'Assam Board (SEBA / AHSEC - Board of Secondary Education Assam)', keywords: ['assam', 'seba', 'ahsec', 'guwahati board', 'as', 'assam board'] },
  { value: 'Chhattisgarh Board (CGBSE)', label: 'Chhattisgarh Board (CGBSE - CG Board Raipur)', keywords: ['chhattisgarh', 'cgbse', 'cg board', 'raipur board', 'cg'] },
  { value: 'Himachal Pradesh Board (HPBOSE)', label: 'Himachal Pradesh Board (HPBOSE - Dharamshala Board)', keywords: ['himachal', 'hp', 'hpbse', 'hpbose', 'dharamshala board', 'hp board'] },
  { value: 'Jammu & Kashmir Board (JKBOSE)', label: 'Jammu & Kashmir Board (JKBOSE - J&K State Board)', keywords: ['jammu', 'kashmir', 'j&k', 'jkbose', 'srinagar board', 'jammu board', 'jk'] },
  { value: 'Uttarakhand Board (UBSE)', label: 'Uttarakhand Board (UBSE - Uttarakhand Board of School Education)', keywords: ['uttarakhand', 'uk', 'ubse', 'ramnagar board', 'ua', 'uk board'] },
  { value: 'Goa Board (GBSHSE)', label: 'Goa Board (GBSHSE - Goa Board of Secondary & Higher Secondary Education)', keywords: ['goa', 'gbshse', 'goa board', 'ga'] },
  { value: 'Manipur Board (BOSEM / COHSEM)', label: 'Manipur Board (BOSEM / COHSEM - Board of Secondary Education Manipur)', keywords: ['manipur', 'bosem', 'cohsem', 'imphal', 'mn'] },
  { value: 'Meghalaya Board (MBOSE)', label: 'Meghalaya Board (MBOSE - Meghalaya Board of School Education)', keywords: ['meghalaya', 'mbose', 'shillong board', 'ml'] },
  { value: 'Mizoram Board (MBSE)', label: 'Mizoram Board (MBSE - Mizoram Board of School Education)', keywords: ['mizoram', 'mbse', 'aizawl board', 'mz'] },
  { value: 'Nagaland Board (NBSE)', label: 'Nagaland Board (NBSE - Nagaland Board of School Education)', keywords: ['nagaland', 'nbse', 'kohima board', 'nl'] },
  { value: 'Tripura Board (TBSE)', label: 'Tripura Board (TBSE - Tripura Board of Secondary Education)', keywords: ['tripura', 'tbse', 'agartala board', 'tr'] },
  { value: 'Arunachal Pradesh State Board', label: 'Arunachal Pradesh State Board of Secondary Education', keywords: ['arunachal', 'arunachal pradesh', 'itanagar', 'ar'] },
  { value: 'Sikkim Board', label: 'Sikkim Board of Secondary Education', keywords: ['sikkim', 'gangtok', 'sk'] },
  { value: 'Other State Board', label: 'Other State Board', keywords: ['state board', 'other state'] },
  { value: 'Other Board', label: 'Other Recognized Board', keywords: ['other', 'recognized', 'open board'] }
];

export const sortQualifications = (quals) => {
  if (!Array.isArray(quals)) return [];
  const arr = [...quals];
  const primaryIdx = arr.findIndex(q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1));
  if (primaryIdx > 0) {
    const [primaryItem] = arr.splice(primaryIdx, 1);
    arr.unshift(primaryItem);
  }
  return arr;
};

export const sortExperience = (expList) => {
  if (!Array.isArray(expList)) return [];
  const arr = expList.map(exp => {
    if (!exp) return exp;
    const roles = Array.isArray(exp.roles) ? [...exp.roles] : [];
    const currentRoleIdx = roles.findIndex(r => r && (r.currentCompany === true || r.currentCompany === 'true' || r.currentCompany === 1));
    if (currentRoleIdx > 0) {
      const [currentRole] = roles.splice(currentRoleIdx, 1);
      roles.unshift(currentRole);
    }
    return { ...exp, roles };
  });

  const currentCompanyIdx = arr.findIndex(exp => exp && Array.isArray(exp.roles) && exp.roles.some(r => r && (r.currentCompany === true || r.currentCompany === 'true' || r.currentCompany === 1)));
  if (currentCompanyIdx > 0) {
    const [currentComp] = arr.splice(currentCompanyIdx, 1);
    arr.unshift(currentComp);
  }
  return arr;
};

export const DEFAULT_GRADUATION_COURSES = [
  'B.Tech / B.E. (Bachelor of Technology / Engineering)',
  'B.Com (Bachelor of Commerce)',
  'B.Com (Hons.)',
  'B.Com in Accounting & Finance (BAF)',
  'B.Com in Banking & Insurance (BBI)',
  'B.Com in Financial Markets (BFM)',
  'B.Sc (Bachelor of Science)',
  'B.Sc in Computer Science',
  'B.Sc in Information Technology (IT)',
  'B.Sc in Nursing',
  'B.Sc in Agriculture',
  'B.Sc in Biotechnology',
  'BCA (Bachelor of Computer Applications)',
  'BBA (Bachelor of Business Administration)',
  'BMS (Bachelor of Management Studies)',
  'B.A (Bachelor of Arts)',
  'B.A (Hons.) in Economics',
  'B.A (Hons.) in English',
  'B.A (Hons.) in Psychology',
  'LLB (Bachelor of Legislative Law - 3 Years)',
  'Integrated B.A. LL.B / B.Com. LL.B / BBA. LL.B',
  'B.Pharm (Bachelor of Pharmacy)',
  'Pharm.D (Doctor of Pharmacy)',
  'MBBS (Bachelor of Medicine, Bachelor of Surgery)',
  'BDS (Bachelor of Dental Surgery)',
  'BPT (Bachelor of Physiotherapy)',
  'BAMS / BHMS / BUMS (Ayurveda / Homeopathy)',
  'B.Des (Bachelor of Design)',
  'B.Arch (Bachelor of Architecture)',
  'B.Ed (Bachelor of Education)',
  'BHM (Bachelor of Hotel Management)',
  'B.Voc (Bachelor of Vocation)',
  'Diploma in Engineering / Polytechnic',
  'Diploma in Pharmacy (D.Pharm)',
  'General Nursing and Midwifery (GNM)',
  'ITI Certification',
  'Other Bachelor Degree / Diploma'
];

export const DEFAULT_MASTERS_COURSES = [
  'MBA (Master of Business Administration)',
  'PGDM (Post Graduate Diploma in Management)',
  'Executive MBA / PGPM',
  'M.Com (Master of Commerce)',
  'M.Com in Accounting & Finance',
  'M.Tech / M.E. (Master of Technology / Engineering)',
  'MCA (Master of Computer Applications)',
  'M.Sc (Master of Science)',
  'M.Sc in Computer Science / IT',
  'M.Sc in Data Science / AI / ML',
  'M.Sc in Biotechnology / Microbiology',
  'M.Sc in Nursing',
  'M.A (Master of Arts)',
  'M.A in Economics',
  'M.A in Psychology',
  'M.A in English',
  'LLM (Master of Laws)',
  'M.Pharm (Master of Pharmacy)',
  'MD / MS (Doctor of Medicine / Master of Surgery)',
  'MDS (Master of Dental Surgery)',
  'MPT (Master of Physiotherapy)',
  'M.Des (Master of Design)',
  'M.Arch (Master of Architecture)',
  'M.Ed (Master of Education)',
  'MS (Master of Science - Global / Tech)',
  'Ph.D. / Doctorate',
  'Other Master / Post Graduate Degree'
];

export const DEFAULT_EDUCATION_DATA = {
  '10th': {
    category: 'school',
    options: DEFAULT_BOARD_OPTIONS.filter(b => !b.isGroupLabel).map(b => b.value)
  },
  '12th': {
    category: 'school',
    options: DEFAULT_BOARD_OPTIONS.filter(b => !b.isGroupLabel).map(b => b.value)
  },
  'Graduation/Diploma': {
    category: 'higher',
    options: [...DEFAULT_GRADUATION_COURSES]
  },
  'Masters/Post-Graduation': {
    category: 'higher',
    options: [...DEFAULT_MASTERS_COURSES]
  },
  'Accounting Degree': {
    category: 'higher',
    options: ['B.Com', 'B.Com (Hons.)', 'BBA in Finance', 'BBA in Accounting', 'B.Sc. in Accounting', 'Bachelor of Accounting / B.Acc.', 'BMS in Finance / Accounting', 'Other']
  },
  'Post Graduate Accounting & Finance': {
    category: 'higher',
    options: ['M.Com', 'M.Com in Accounting', 'M.Com in Finance', 'MBA in Finance', 'MBA in Accounting', 'M.Sc. in Accounting / Finance', 'Master of Accounting / M.Acc.', 'PG Diploma in Accounting', 'PG Diploma in Finance', 'Other']
  },
  'Professional Qualification': {
    category: 'higher',
    options: ['CA – Chartered Accountant', 'CMA – Cost and Management Accountant', 'CS – Company Secretary', 'ACCA', 'CPA – Certified Public Accountant', 'CFA – Chartered Financial Analyst', 'CIMA', 'CIA – Certified Internal Auditor', 'CGMA', 'Other']
  },
  'Accounting Certification': {
    category: 'higher',
    options: ['Certificate in Accounting', 'Certificate in Financial Accounting', 'Certificate in GST', 'Certificate in Tally', 'Certificate in Income Tax', 'Certificate in Payroll', 'DCA', 'PGDCA', 'Other Accounting Qualification', 'Other Finance Qualification', 'Other']
  },
  'Diploma': {
    category: 'higher',
    options: ['Diploma in Accounting', 'Diploma in Financial Accounting', 'Diploma in Taxation', 'Diploma in Computerized Accounting', 'Polytechnic / Technical Diploma', 'ITI', 'Other']
  },
  'Accounting Software': {
    category: 'higher',
    options: ['Tally / TallyPrime', 'Tally + GST', 'SAP FI', 'SAP FICO', 'QuickBooks', 'Zoho Books', 'BUSY Accounting Software', 'Oracle Financials', 'Sage Accounting', 'Advanced Excel for Accounting', 'MS Excel for Accounting', 'Other']
  },
  'Taxation': {
    category: 'higher',
    options: ['GST', 'GST Certification', 'Income Tax', 'Corporate Taxation', 'Tax Planning', 'Indirect Taxation', 'Transfer Pricing', 'Other']
  },
  'Audit': {
    category: 'higher',
    options: ['Financial Accounting', 'Advanced Financial Accounting', 'Corporate Accounting', 'Cost Accounting', 'Management Accounting', 'Auditing', 'Internal Audit', 'Forensic Accounting', 'Payroll Accounting', 'Financial Reporting', 'Accounts Payable (AP)', 'Accounts Receivable (AR)', 'Bank Reconciliation', 'Other']
  },
  'Finance': {
    category: 'higher',
    options: ['Financial Analysis', 'Financial Modeling', 'Corporate Finance', 'Investment Banking', 'Equity Research', 'Treasury Management', 'Risk Management', 'Financial Planning', 'Other']
  },
  'International Accounting': {
    category: 'higher',
    options: ['IFRS', 'Ind AS', 'US GAAP', 'International Accounting', 'Other']
  },
  'Doctorate / PhD': {
    category: 'higher',
    options: ['PhD in Computer Science', 'PhD in Management', 'PhD in Commerce/Finance', 'PhD in Economics', 'PhD in Engineering', 'PhD in Arts/Humanities', 'PhD in Science', 'Other']
  },
  'Other': {
    category: 'higher',
    options: ['Vocational Training', 'Certificate Course', 'Self-Taught / Bootcamp', 'Other']
  }
};

const educationTypeOptions = Object.keys(DEFAULT_EDUCATION_DATA).map(key => ({ value: key, label: key }));

export const DEFAULT_COURSE_TYPE_OPTIONS = [
  'Full time',
  'Part time',
  'Correspondence/Distance learning'
];

export const DEFAULT_MEDIUM_OPTIONS = [
  'English',
  'Hindi',
  'Other'
];

export const DEFAULT_EMPLOYMENT_TYPE_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance'
];

export const DEFAULT_NOTICE_PERIOD_OPTIONS = [
  '15 Days',
  '30 Days',
  '60 Days',
  '90+ Days',
  'Immediately available'
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
  const [currentStep, setCurrentStepState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStep = parseInt(params.get('step'), 10);
    if (urlStep >= 1 && urlStep <= 6) return urlStep;
    const savedStep = parseInt(localStorage.getItem('onboardingCurrentStep'), 10);
    if (savedStep >= 1 && savedStep <= 6) return savedStep;
    return 1;
  });

  const setCurrentStep = (newStep) => {
    setCurrentStepState((prev) => {
      const validStep = typeof newStep === 'function' ? newStep(prev) : newStep;
      localStorage.setItem('onboardingCurrentStep', validStep.toString());
      const params = new URLSearchParams(window.location.search);
      params.set('step', validStep.toString());
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
      saveToBackend({ ...formData, onboardingStep: validStep });
      return validStep;
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('step') !== currentStep.toString()) {
      params.set('step', currentStep.toString());
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [currentStep]);

  const totalSteps = 6;
  const [expandedEduIndex, setExpandedEduIndex] = useState(-1);
  const [expandedExpIndex, setExpandedExpIndex] = useState(-1);
  const [expandedRoleIndex, setExpandedRoleIndex] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expError, setExpError] = useState('');
  const [expFieldErrors, setExpFieldErrors] = useState({});
  const [eduError, setEduError] = useState('');
  const [eduFieldErrors, setEduFieldErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [showStep1Errors, setShowStep1Errors] = useState(false);
  const [showStep4Errors, setShowStep4Errors] = useState(false);
  const [showStep5Errors, setShowStep5Errors] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoMode, setVideoMode] = useState('upload');
  const [videoLink, setVideoLink] = useState('');
  const [docError, setDocError] = useState({ resume: '', coverLetter: '', introVideo: '' });
  const [cmsConfig, setCmsConfig] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const scrollToFirstError = (targetId) => {
    setTimeout(() => {
      let targetEl = targetId ? document.getElementById(targetId) : null;
      if (!targetEl) {
        targetEl = document.querySelector('.border-red-500, .ring-red-500, .text-red-500, [aria-invalid="true"]');
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
    }, 60);
  };

  const checkPhoneAvailability = async (phoneVal) => {
    const cleanPhone = String(phoneVal !== undefined ? phoneVal : (formData.phone || '')).trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('');
      return true;
    }
    try {
      setIsCheckingPhone(true);
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
      console.error('Error checking phone availability:', err);
      return true;
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Fetch Homepage & Onboarding CMS configuration on mount
  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.employeeOnboarding) {
          setCmsConfig(data.data.employeeOnboarding);
        }
      } catch (err) {
        console.error('Error fetching onboarding CMS config:', err);
      }
    };
    fetchCmsConfig();
  }, []);

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
        if (parsed.experience && Array.isArray(parsed.experience)) {
          parsed.experience = sortExperience(parsed.experience);
        }
        if (parsed.qualifications && Array.isArray(parsed.qualifications)) {
          parsed.qualifications = sortQualifications(parsed.qualifications);
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
        noticePeriod: '',
        skills: ''
      },

      documents: {
        resume: null,
        coverLetter: null,
        introVideo: null
      }
    };
  });

  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch Profile if exists
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('employeeToken');
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        // Profile controller directly returns the object, or a message on error
        if (res.ok && data && !data.message) {
          if (data.onboardingStep && data.onboardingStep >= 1 && data.onboardingStep <= 6) {
            const params = new URLSearchParams(window.location.search);
            if (!params.get('step')) {
              setCurrentStepState(data.onboardingStep);
              localStorage.setItem('onboardingCurrentStep', data.onboardingStep.toString());
            }
          }
          setFormData(prev => {
            const next = {
              ...prev,
              firstName: data.firstName || prev.firstName,
              lastName: data.lastName || prev.lastName,
              email: data.email || prev.email,
              phone: data.phone || prev.phone,
              isFresher: data.isFresher !== undefined ? data.isFresher : prev.isFresher,
              designation: data.designation || prev.designation,
              totalExperience: data.totalExperience || prev.totalExperience,
              location: data.location || prev.location,
              preferredLocation: data.preferredLocation || prev.preferredLocation,
              industry: data.industry || prev.industry,
              brief: data.brief || prev.brief,
              qualifications: (data.qualifications && data.qualifications.length > 0) ? sortQualifications(data.qualifications) : prev.qualifications,
              experience: (data.experience && data.experience.length > 0) ? sortExperience(data.experience) : prev.experience,
              professionalDetails: data.professionalDetails ? { ...(prev.professionalDetails || {}), ...data.professionalDetails } : prev.professionalDetails,
              documents: data.documents ? { ...(prev.documents || {}), ...data.documents } : prev.documents
            };
            localStorage.setItem('userProfile', JSON.stringify(next));
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to fetch initial profile", err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchProfile();
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

  const saveToBackend = async (dataToSave = formData) => {
    try {
      localStorage.setItem('userProfile', JSON.stringify(dataToSave));
      const token = localStorage.getItem('employeeToken');
      if (token) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataToSave)
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.profile) {
            localStorage.setItem('userProfile', JSON.stringify(data.profile));
          }
        }
      }
    } catch (err) {
      console.error("Autosave error:", err);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = cmsConfig?.step1?.fields;
      const isReq = (key, defaultReq) => step1Fields?.[key]?.isRequired !== undefined ? step1Fields[key].isRequired : defaultReq;

      const fNameErr = isReq('firstName', true) && !formData.firstName?.trim();
      const lNameErr = isReq('lastName', false) && !formData.lastName?.trim();
      const phoneErr = isReq('phone', true) && (!formData.phone?.trim() || formData.phone.trim().length < 10);
      const emailErr = isReq('email', false) && !formData.email?.trim();
      const industryErr = isReq('industry', true) && !formData.industry?.trim();
      const desigErr = isReq('designation', true) && !formData.designation?.trim();
      const expErr = isReq('totalExperience', true) && !formData.totalExperience?.trim();
      const locErr = isReq('location', true) && !formData.location?.trim();
      const prefLocErr = isReq('preferredLocation', false) && (!formData.preferredLocation || (typeof formData.preferredLocation === 'string' && !formData.preferredLocation.trim()) || (Array.isArray(formData.preferredLocation) && formData.preferredLocation.length === 0));
      const briefErr = isReq('brief', false) && !formData.brief?.trim();

      if (fNameErr || lNameErr || phoneErr || emailErr || industryErr || desigErr || expErr || locErr || prefLocErr || briefErr) {
        setShowStep1Errors(true);
        const firstErrId = fNameErr ? 'field-firstName'
          : lNameErr ? 'field-lastName'
          : phoneErr ? 'field-phone'
          : emailErr ? 'field-email'
          : industryErr ? 'field-industry'
          : desigErr ? 'field-designation'
          : expErr ? 'field-totalExperience'
          : locErr ? 'field-location'
          : prefLocErr ? 'field-preferredLocation'
          : 'field-brief';
        scrollToFirstError(firstErrId);
        return;
      }

      if (formData.phone && formData.phone.length === 10) {
        const isAvailable = await checkPhoneAvailability(formData.phone);
        if (!isAvailable) {
          setShowStep1Errors(true);
          scrollToFirstError('field-phone');
          return;
        }
      }

      if (phoneError) {
        setShowStep1Errors(true);
        scrollToFirstError('field-phone');
        return;
      }

      setShowStep1Errors(false);
    }
    if (currentStep === 2) {
      const result = validateEducationData(expandedEduIndex >= 0 ? expandedEduIndex : null);
      if (!result.isValid) {
        if (result.eduIdx !== undefined && result.eduIdx >= 0) {
          setExpandedEduIndex(result.eduIdx);
        }
        setEduFieldErrors(result.errors || {});
        setEduError(result.message || 'Please fill all required education fields (*)');
        scrollToFirstError(result.targetFieldId);
        return;
      }
      setEduError('');
      setEduFieldErrors({});
      setExpandedEduIndex(-1);
    }
    if (currentStep === 3) {
      const result = validateExperienceData(expandedExpIndex >= 0 ? expandedExpIndex : null);
      if (!result.isValid) {
        if (result.cIdx !== undefined && result.cIdx >= 0) {
          setExpandedExpIndex(result.cIdx);
          setExpandedRoleIndex(result.rIdx || 0);
        }
        setExpFieldErrors(result.errors || {});
        setExpError(result.message || 'Please fill all required work experience fields (*)');
        scrollToFirstError(result.targetFieldId);
        return;
      }
      setExpError('');
      setExpFieldErrors({});
      setExpandedExpIndex(-1);
    }
    if (currentStep === 4) {
      const p = formData.professionalDetails || {};
      const fLinkedin = getStepField('step4', 'linkedinUrl', 'LinkedIn Profile', 'https://linkedin.com/in/...', false);
      const fSalaryType = getStepField('step4', 'salaryType', 'Salary Type', 'Select salary type', false);
      const fCurrency = getStepField('step4', 'currency', 'Currency', 'Select currency', false);
      const fCurrentSalary = getStepField('step4', 'currentSalary', 'Current Annual CTC', 'e.g. 5,00,000', false);
      const fExpectedSalary = getStepField('step4', 'expectedSalary', 'Expected Annual CTC', 'e.g. 7,50,000', false);
      const fSkills = getStepField('step4', 'skills', 'Key Skills', 'Type skill and press Enter (e.g., React, Node.js)', false);

      const effectiveSalaryType = (p.salaryType !== undefined && p.salaryType !== '') ? p.salaryType : 'Yearly';
      const effectiveCurrency = (p.currency !== undefined && p.currency !== '') ? p.currency : 'INR';

      const linkedinErr = fLinkedin.isRequired && !p.linkedinUrl?.trim();
      const salaryTypeErr = fSalaryType.isRequired && !effectiveSalaryType?.trim();
      const currencyErr = fCurrency.isRequired && !effectiveCurrency?.trim();
      const currentSalaryErr = fCurrentSalary.isRequired && !p.currentSalary?.trim();
      const expectedSalaryErr = fExpectedSalary.isRequired && !p.expectedSalary?.trim();
      const skillsList = p.skills ? (typeof p.skills === 'string' ? p.skills.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(p.skills) ? p.skills : [])) : [];
      const skillsErr = fSkills.isRequired && skillsList.length === 0;

      if (linkedinErr || salaryTypeErr || currencyErr || currentSalaryErr || expectedSalaryErr || skillsErr) {
        setShowStep4Errors(true);
        const firstErrId = linkedinErr ? 'field-linkedinUrl'
          : salaryTypeErr ? 'field-salaryType'
          : currencyErr ? 'field-currency'
          : currentSalaryErr ? 'field-currentSalary'
          : expectedSalaryErr ? 'field-expectedSalary'
          : 'field-skills';
        scrollToFirstError(firstErrId);
        return;
      }
      setShowStep4Errors(false);
    }
    if (currentStep === 5) {
      const docs = formData.documents || {};
      const fResume = getStepField('step5', 'resume', 'Upload Resume', '', true);
      const fCoverLetter = getStepField('step5', 'coverLetter', 'Upload Cover Letter', '', false);
      const fIntroVideo = getStepField('step5', 'introVideo', 'Introductory Video', '', false);

      const resumeErr = fResume.isRequired && !docs.resume;
      const coverErr = fCoverLetter.isRequired && !docs.coverLetter;
      const videoErr = fIntroVideo.isRequired && !docs.introVideo;

      if (resumeErr || coverErr || videoErr) {
        setShowStep5Errors(true);
        const firstDocErrId = resumeErr ? 'field-resume' : coverErr ? 'field-coverLetter' : 'field-introVideo';
        scrollToFirstError(firstDocErrId);
        return;
      }
      setShowStep5Errors(false);
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
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    // Comprehensive validation check before final submission
    const step1Fields = cmsConfig?.step1?.fields;
    const isReq1 = (key, defaultReq) => step1Fields?.[key]?.isRequired !== undefined ? step1Fields[key].isRequired : defaultReq;
    const fNameErr = isReq1('firstName', true) && !formData.firstName?.trim();
    const lNameErr = isReq1('lastName', false) && !formData.lastName?.trim();
    const phoneErr = isReq1('phone', true) && (!formData.phone?.trim() || formData.phone.trim().length < 10);
    const industryErr = isReq1('industry', true) && !formData.industry?.trim();
    const desigErr = isReq1('designation', true) && !formData.designation?.trim();
    const expErr = isReq1('totalExperience', true) && !formData.totalExperience?.trim();
    const locErr = isReq1('location', true) && !formData.location?.trim();
    const prefLocErr = isReq1('preferredLocation', false) && !formData.preferredLocation?.trim();
    const briefErr = isReq1('brief', false) && !formData.brief?.trim();

    if (fNameErr || lNameErr || phoneErr || industryErr || desigErr || expErr || locErr || prefLocErr || briefErr || phoneError) {
      setCurrentStep(1);
      setShowStep1Errors(true);
      const firstErrId = fNameErr ? 'field-firstName'
        : lNameErr ? 'field-lastName'
        : (phoneErr || phoneError) ? 'field-phone'
        : industryErr ? 'field-industry'
        : desigErr ? 'field-designation'
        : expErr ? 'field-totalExperience'
        : locErr ? 'field-location'
        : prefLocErr ? 'field-preferredLocation'
        : 'field-brief';
      scrollToFirstError(firstErrId);
      return;
    }

    const eduRes = validateEducationData();
    if (!eduRes.isValid) {
      setCurrentStep(2);
      if (eduRes.eduIdx !== undefined && eduRes.eduIdx >= 0) {
        setExpandedEduIndex(eduRes.eduIdx);
      }
      setEduFieldErrors(eduRes.errors || {});
      setEduError(eduRes.message || 'Please fill all required education fields (*)');
      scrollToFirstError(eduRes.targetFieldId);
      return;
    }

    const expRes = validateExperienceData();
    if (!expRes.isValid) {
      setCurrentStep(3);
      if (expRes.cIdx !== undefined && expRes.cIdx >= 0) {
        setExpandedExpIndex(expRes.cIdx);
        setExpandedRoleIndex(expRes.rIdx || 0);
      }
      setExpFieldErrors(expRes.errors || {});
      setExpError(expRes.message || 'Please fill all required work experience fields (*)');
      scrollToFirstError(expRes.targetFieldId);
      return;
    }

    const p = formData.professionalDetails || {};
    const fLinkedin = getStepField('step4', 'linkedinUrl', 'LinkedIn Profile', 'https://linkedin.com/in/...', false);
    const fSalaryType = getStepField('step4', 'salaryType', 'Salary Type', 'Select salary type', false);
    const fCurrency = getStepField('step4', 'currency', 'Currency', 'Select currency', false);
    const fCurrentSalary = getStepField('step4', 'currentSalary', 'Current Annual CTC', 'e.g. 5,00,000', false);
    const fExpectedSalary = getStepField('step4', 'expectedSalary', 'Expected Annual CTC', 'e.g. 7,50,000', false);
    const fSkills = getStepField('step4', 'skills', 'Key Skills', 'Type skill and press Enter (e.g., React, Node.js)', false);

    const effectiveSalaryType = (p.salaryType !== undefined && p.salaryType !== '') ? p.salaryType : 'Yearly';
    const effectiveCurrency = (p.currency !== undefined && p.currency !== '') ? p.currency : 'INR';

    const s4LinkedinErr = fLinkedin.isRequired && !p.linkedinUrl?.trim();
    const s4SalaryTypeErr = fSalaryType.isRequired && !effectiveSalaryType?.trim();
    const s4CurrencyErr = fCurrency.isRequired && !effectiveCurrency?.trim();
    const s4CurrentSalaryErr = fCurrentSalary.isRequired && !p.currentSalary?.trim();
    const s4ExpectedSalaryErr = fExpectedSalary.isRequired && !p.expectedSalary?.trim();
    const skillsList = p.skills ? (typeof p.skills === 'string' ? p.skills.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(p.skills) ? p.skills : [])) : [];
    const s4SkillsErr = fSkills.isRequired && skillsList.length === 0;

    if (s4LinkedinErr || s4SalaryTypeErr || s4CurrencyErr || s4CurrentSalaryErr || s4ExpectedSalaryErr || s4SkillsErr) {
      setCurrentStep(4);
      setShowStep4Errors(true);
      const firstErrId = s4LinkedinErr ? 'field-linkedinUrl'
        : s4SalaryTypeErr ? 'field-salaryType'
        : s4CurrencyErr ? 'field-currency'
        : s4CurrentSalaryErr ? 'field-currentSalary'
        : s4ExpectedSalaryErr ? 'field-expectedSalary'
        : 'field-skills';
      scrollToFirstError(firstErrId);
      return;
    }

    const docs = formData.documents || {};
    const fResume = getStepField('step5', 'resume', 'Upload Resume', '', true);
    const fCoverLetter = getStepField('step5', 'coverLetter', 'Upload Cover Letter', '', false);
    const fIntroVideo = getStepField('step5', 'introVideo', 'Introductory Video', '', false);

    const s5ResumeErr = fResume.isRequired && !docs.resume;
    const s5CoverErr = fCoverLetter.isRequired && !docs.coverLetter;
    const s5VideoErr = fIntroVideo.isRequired && !docs.introVideo;

    if (s5ResumeErr || s5CoverErr || s5VideoErr) {
      setCurrentStep(5);
      setShowStep5Errors(true);
      const firstDocErrId = s5ResumeErr ? 'field-resume' : s5CoverErr ? 'field-coverLetter' : 'field-introVideo';
      scrollToFirstError(firstDocErrId);
      return;
    }

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
          body: JSON.stringify({ ...formData, isOnboardingCompleted: true, onboardingStep: 6 })
        });
        
        if (response.ok) {
          const data = await response.json();
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
      localStorage.removeItem('onboardingCurrentStep');
      setIsSubmitting(false);
      navigate('/employee', { state: { profileCreated: true } });
    }
  };

  const updateArray = (arrayName, index, field, value) => {
    let newArr = [...(formData[arrayName] || [])];
    if (arrayName === 'qualifications' && field === 'isPrimary') {
      if (value) {
        // Set all other qualifications isPrimary to false
        newArr = newArr.map((item, i) => ({
          ...item,
          isPrimary: i === index
        }));
        // Move the marked primary item to index 0 (first in order)
        const [primaryItem] = newArr.splice(index, 1);
        newArr.unshift(primaryItem);
        setExpandedEduIndex(0);
      } else {
        newArr[index] = { ...newArr[index], isPrimary: false };
      }
    } else {
      newArr[index] = { ...newArr[index], [field]: value };
    }
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


  const Step1BasicDetails = () => {
    const s1Title = cmsConfig?.step1?.title || 'Basic Details';
    const fFirstName = getStepField('step1', 'firstName', 'First Name', 'Enter first name', true);
    const fLastName = getStepField('step1', 'lastName', 'Last Name', 'Enter last name', false);
    const fPhone = getStepField('step1', 'phone', 'Phone Number', 'Enter 10-digit mobile number', true);
    const fEmail = getStepField('step1', 'email', 'Email (Read Only)', 'Enter email address', false);
    const fIndustry = getStepField('step1', 'industry', 'Function', 'Select Function', true);
    const fDesignation = getStepField('step1', 'designation', 'Designation / Role', 'Select Designation / Role', true);
    const fTotalExp = getStepField('step1', 'totalExperience', 'Total Experience', 'Select Total Experience', true);
    const fLocation = getStepField('step1', 'location', 'Current Location', 'Select Current Location', true);
    const fPreferredLocation = getStepField('step1', 'preferredLocation', 'Preferred Location', 'Select Preferred Locations', false);
    const fBrief = getStepField('step1', 'brief', 'Brief about yourself', 'I am a passionate professional...', false);

    return (
      <div className="space-y-6 animate-fade-in pb-2">
        <div className="mb-6 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{s1Title}</h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div id="field-firstName">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fFirstName.label} {fFirstName.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input type="text" className={`w-full px-4 py-3 bg-white border ${showStep1Errors && fFirstName.isRequired && !formData.firstName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`} placeholder={fFirstName.placeholder} value={formData.firstName || ''} onChange={e => { setFormData({...formData, firstName: e.target.value}); setShowStep1Errors(false); }} />
            {showStep1Errors && fFirstName.isRequired && !formData.firstName && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please enter {fFirstName.label || 'first name'}
              </p>
            )}
          </div>
          <div id="field-lastName">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fLastName.label} {fLastName.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input type="text" className={`w-full px-4 py-3 bg-white border ${showStep1Errors && fLastName.isRequired && !formData.lastName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`} placeholder={fLastName.placeholder} value={formData.lastName || ''} onChange={e => { setFormData({...formData, lastName: e.target.value}); setShowStep1Errors(false); }} />
            {showStep1Errors && fLastName.isRequired && !formData.lastName && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please enter {fLastName.label || 'last name'}
              </p>
            )}
          </div>
          <div id="field-phone">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fPhone.label} {fPhone.isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="flex">
              <span className={`px-4 py-3 border border-r-0 ${((showStep1Errors && fPhone.isRequired && (!formData.phone || formData.phone.length < 10)) || phoneError) ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-l-xl bg-gray-50 text-gray-500 font-semibold`}>+91</span>
              <input 
                type="text" 
                className={`w-full px-4 py-3 bg-white border ${((showStep1Errors && fPhone.isRequired && (!formData.phone || formData.phone.length < 10)) || phoneError) ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-r-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`} 
                placeholder={fPhone.placeholder} 
                value={formData.phone || ''} 
                onChange={e => { 
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({...formData, phone: val}); 
                  setShowStep1Errors(false); 
                  setPhoneError('');
                  if (val.length === 10) {
                    checkPhoneAvailability(val);
                  }
                }}
                onBlur={() => {
                  if (formData.phone && formData.phone.length === 10) {
                    checkPhoneAvailability(formData.phone);
                  }
                }}
              />
            </div>
            {showStep1Errors && fPhone.isRequired && (!formData.phone || formData.phone.length < 10) && !phoneError && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please enter a valid 10-digit mobile number
              </p>
            )}
            {phoneError && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {phoneError}
              </p>
            )}
          </div>
          <div id="field-email">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fEmail.label} {fEmail.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input type="email" disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" value={formData.email || ''} />
          </div>
          <div id="field-industry">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fIndustry.label} {fIndustry.isRequired && <span className="text-red-500">*</span>}
            </label>
            <CustomDropdown 
              options={(() => {
                const defaultFunctions = {
                  'IT & Software': ["Software Engineer", "Senior Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "DevOps Engineer", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "UI/UX Designer", "QA Engineer / Tester", "Cloud Architect", "System Administrator", "Cybersecurity Analyst", "Technical Lead"],
                  'Finance & Accounts': ["Accountant", "Senior Accountant", "Financial Analyst", "Finance Manager", "Auditor", "Tax Consultant", "Investment Banker", "Chartered Accountant (CA)"],
                  'Healthcare': ["Doctor", "Nurse", "Pharmacist", "Medical Representative", "Healthcare Administrator", "Lab Technician", "Physiotherapist", "Medical Coder"],
                  'Manufacturing': ["Production Engineer", "Quality Analyst", "Plant Manager", "Maintenance Engineer", "Supply Chain Manager", "Safety Officer", "Mechanical Engineer"],
                  'Marketing': ["Marketing Executive", "Digital Marketer", "Marketing Manager", "SEO Specialist", "Content Writer", "Social Media Manager", "Brand Manager"],
                  'Sales': ["Sales Executive", "Sales Manager", "Business Development Executive", "Business Development Manager", "Account Manager", "Area Sales Manager", "Retail Store Manager"],
                  'HR': ["HR Executive", "HR Manager", "Recruiter", "Talent Acquisition Specialist", "Payroll Executive", "Training & Development Manager", "HR Generalist"],
                  'Other': ["Product Manager", "Project Manager", "Business Analyst", "Operations Manager"]
                };
                const functionsMap = (cmsConfig?.step1?.functionsData && Object.keys(cmsConfig.step1.functionsData).length > 0)
                  ? cmsConfig.step1.functionsData
                  : defaultFunctions;
                return Object.keys(functionsMap).map(ind => ({ value: ind, label: ind }));
              })()}
              value={formData.industry}
              onChange={(val) => { setFormData({...formData, industry: val, designation: ''}); setShowStep1Errors(false); }}
              placeholder={fIndustry.placeholder}
              error={showStep1Errors && fIndustry.isRequired && !formData.industry}
            />
            {showStep1Errors && fIndustry.isRequired && !formData.industry && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please select {fIndustry.label || 'Function'}
              </p>
            )}
          </div>
          <div id="field-designation">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fDesignation.label} {fDesignation.isRequired && <span className="text-red-500">*</span>}
            </label>
            <CustomDropdown 
              options={(() => {
                const defaultFunctions = {
                  'IT & Software': ["Software Engineer", "Senior Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "DevOps Engineer", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "UI/UX Designer", "QA Engineer / Tester", "Cloud Architect", "System Administrator", "Cybersecurity Analyst", "Technical Lead"],
                  'Finance & Accounts': ["Accountant", "Senior Accountant", "Financial Analyst", "Finance Manager", "Auditor", "Tax Consultant", "Investment Banker", "Chartered Accountant (CA)"],
                  'Healthcare': ["Doctor", "Nurse", "Pharmacist", "Medical Representative", "Healthcare Administrator", "Lab Technician", "Physiotherapist", "Medical Coder"],
                  'Manufacturing': ["Production Engineer", "Quality Analyst", "Plant Manager", "Maintenance Engineer", "Supply Chain Manager", "Safety Officer", "Mechanical Engineer"],
                  'Marketing': ["Marketing Executive", "Digital Marketer", "Marketing Manager", "SEO Specialist", "Content Writer", "Social Media Manager", "Brand Manager"],
                  'Sales': ["Sales Executive", "Sales Manager", "Business Development Executive", "Business Development Manager", "Account Manager", "Area Sales Manager", "Retail Store Manager"],
                  'HR': ["HR Executive", "HR Manager", "Recruiter", "Talent Acquisition Specialist", "Payroll Executive", "Training & Development Manager", "HR Generalist"],
                  'Other': ["Product Manager", "Project Manager", "Business Analyst", "Operations Manager"]
                };
                const functionsMap = (cmsConfig?.step1?.functionsData && Object.keys(cmsConfig.step1.functionsData).length > 0)
                  ? cmsConfig.step1.functionsData
                  : defaultFunctions;
                if (formData.industry && functionsMap[formData.industry]) {
                  return [...functionsMap[formData.industry], "Other"].map(role => ({ value: role, label: role }));
                }
                const allRoles = [...new Set(Object.values(functionsMap).flat()), "Product Manager", "Project Manager", "Business Analyst", "Operations Manager", "Other"];
                return allRoles.sort().map(role => ({ value: role, label: role }));
              })()}
              value={formData.designation}
              onChange={(val) => { setFormData({...formData, designation: val}); setShowStep1Errors(false); }}
              placeholder={fDesignation.placeholder}
              error={showStep1Errors && fDesignation.isRequired && !formData.designation}
            />
            {showStep1Errors && fDesignation.isRequired && !formData.designation && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please select {fDesignation.label || 'Designation'}
              </p>
            )}
          </div>
          <div id="field-totalExperience">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fTotalExp.label} {fTotalExp.isRequired && <span className="text-red-500">*</span>}
            </label>
            <CustomDropdown 
              options={(() => {
                const defaultExp = [
                  '0 - 1 Yrs', '2 - 3 Yrs', '4 - 6 Yrs', '7 - 10 Yrs', 
                  '11 - 15 Yrs', '16 - 20 Yrs', '21 - 25 Yrs', '25+ yrs'
                ];
                const list = (Array.isArray(cmsConfig?.step1?.experienceOptions) && cmsConfig.step1.experienceOptions.length > 0)
                  ? cmsConfig.step1.experienceOptions
                  : defaultExp;
                return list.map(item => ({ value: item, label: item }));
              })()}
              value={formData.totalExperience}
              onChange={(val) => { setFormData({...formData, totalExperience: val}); setShowStep1Errors(false); }}
              placeholder={fTotalExp.placeholder}
              error={showStep1Errors && fTotalExp.isRequired && !formData.totalExperience}
            />
            {showStep1Errors && fTotalExp.isRequired && !formData.totalExperience && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please select {fTotalExp.label || 'Total Experience'}
              </p>
            )}
          </div>
          <div id="field-location">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fLocation.label} {fLocation.isRequired && <span className="text-red-500">*</span>}
            </label>
            <MultiSelectLocationDropdown 
              options={(() => {
                if (Array.isArray(cmsConfig?.step1?.locationCities) && cmsConfig.step1.locationCities.length > 0) {
                  return cmsConfig.step1.locationCities
                    .filter(c => c !== 'Anywhere in India' && c !== 'Anywhere in India/Multiple Locations')
                    .map(loc => ({ label: loc, value: loc, displayName: loc }));
                }
                return currentLocationOptions;
              })()}
              value={formData.location || ''}
              onChange={(val) => { setFormData({...formData, location: val}); setShowStep1Errors(false); }}
              multiple={false}
              placeholder={fLocation.placeholder}
              className={`w-full px-4 py-3 bg-white border ${showStep1Errors && fLocation.isRequired && !formData.location ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`}
            />
            {showStep1Errors && fLocation.isRequired && !formData.location && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please select {fLocation.label || 'Current Location'}
              </p>
            )}
          </div>
          <div id="field-preferredLocation" className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fPreferredLocation.label} {fPreferredLocation.isRequired && <span className="text-red-500">*</span>}
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
              options={(() => {
                if (Array.isArray(cmsConfig?.step1?.locationCities) && cmsConfig.step1.locationCities.length > 0) {
                  const cleaned = cmsConfig.step1.locationCities
                    .filter(c => c !== 'Anywhere in India' && c !== 'Anywhere in India/Multiple Locations');
                  return [
                    { label: 'Anywhere in India', value: 'Anywhere in India', displayName: 'Anywhere in India' },
                    ...cleaned.map(loc => ({ label: loc, value: loc, displayName: loc }))
                  ];
                }
                return preferredLocationOptions;
              })()}
              value={formData.preferredLocation || ''}
              onChange={(val) => { setFormData({...formData, preferredLocation: val}); setShowStep1Errors(false); }}
              multiple={true}
              placeholder={fPreferredLocation.placeholder}
              className={`w-full px-4 py-3 bg-white border ${showStep1Errors && fPreferredLocation.isRequired && !formData.preferredLocation ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`}
            />
            {showStep1Errors && fPreferredLocation.isRequired && !formData.preferredLocation && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please select {fPreferredLocation.label || 'Preferred Location'}
              </p>
            )}
          </div>
          <div id="field-brief" className="col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fBrief.label} {fBrief.isRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea 
              rows="3"
              placeholder={fBrief.placeholder}
              className={`w-full px-4 py-3 bg-white border ${showStep1Errors && fBrief.isRequired && !formData.brief ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all custom-scrollbar`} 
              value={formData.brief || ''} 
              onChange={e => setFormData({...formData, brief: e.target.value})} 
            ></textarea>
            {showStep1Errors && fBrief.isRequired && !formData.brief && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please enter {fBrief.label || 'brief about yourself'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const validateEducationData = (targetIdx = null) => {
    const qualifications = formData.qualifications || [];
    const eduData = cmsConfig?.step2?.educationData || DEFAULT_EDUCATION_DATA;
    const isEduTypeRequired = cmsConfig?.step2?.fields?.educationType?.isRequired !== false;
    const isUnivRequired = cmsConfig?.step2?.fields?.university?.isRequired !== false;
    const isCourseRequired = cmsConfig?.step2?.fields?.course?.isRequired !== false;
    const isMediumRequired = cmsConfig?.step2?.fields?.schoolMedium?.isRequired !== false;
    const isCourseTypeRequired = cmsConfig?.step2?.fields?.courseType?.isRequired !== false;
    const isDurationRequired = cmsConfig?.step2?.fields?.duration?.isRequired !== false;
    const isPercentageRequired = cmsConfig?.step2?.fields?.percentage?.isRequired !== false || cmsConfig?.step2?.fields?.gradingSystem?.isRequired !== false;

    if (qualifications.length === 0) {
      if (isEduTypeRequired) {
        return {
          isValid: false,
          message: 'Please add your education qualifications',
          targetFieldId: 'onboarding-add-edu-btn'
        };
      }
      return { isValid: true };
    }

    const indicesToCheck = (targetIdx !== null && targetIdx !== undefined && targetIdx >= 0) 
      ? [targetIdx] 
      : Array.from({ length: qualifications.length }, (_, i) => i);

    for (const eduIdx of indicesToCheck) {
      const currentEdu = qualifications[eduIdx];
      if (!currentEdu) continue;
      const errors = {};
      let hasError = false;
      let firstMissingId = null;

      if (isEduTypeRequired && !currentEdu.educationType) {
        errors.educationType = true;
        hasError = true;
        firstMissingId = `field-edu-type-${eduIdx}`;
      } else if (currentEdu.educationType) {
        const currentEduConfig = eduData[currentEdu.educationType];
        const isSchool = currentEduConfig ? currentEduConfig.category === 'school' : (currentEdu.educationType === '10th' || currentEdu.educationType === '12th');
        if (isSchool) {
          if (!currentEdu.board) { errors.board = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-board-${eduIdx}`; }
          if (isDurationRequired && !currentEdu.endYear) { errors.endYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-endYear-${eduIdx}`; }
          if (isMediumRequired && !currentEdu.schoolMedium) { errors.schoolMedium = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-schoolMedium-${eduIdx}`; }
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
          if (isUnivRequired && !currentEdu.university) { errors.university = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-university-${eduIdx}`; }
          if (isCourseRequired && !currentEdu.course) { errors.course = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-course-${eduIdx}`; }
          if (isCourseTypeRequired && !currentEdu.courseType) { errors.courseType = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-courseType-${eduIdx}`; }
          if (isDurationRequired && !currentEdu.startYear) { errors.startYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-startYear-${eduIdx}`; }
          if (isDurationRequired && !currentEdu.endYear) { errors.endYear = true; hasError = true; if (!firstMissingId) firstMissingId = `field-edu-endYear-${eduIdx}`; }
          if (isPercentageRequired && (!currentEdu.gradingSystem || (currentEdu.gradingSystem !== 'Not Applicable' && !currentEdu.percentage))) {
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
      scrollToFirstError(result.targetFieldId);
      return;
    }
    setEduError('');
    setEduFieldErrors({});
    const newIdx = (formData.qualifications || []).length;
    setExpandedEduIndex(newIdx);
    addArrayItem('qualifications', { educationType: '', board: '', endYear: '', schoolMedium: '', percentage: '', university: '', course: '', startYear: '', gradingSystem: '', isPrimary: false });
    scrollToFirstError(`field-edu-type-${newIdx}`);
  };

  const handleSaveEducation = (e) => {
    if (e) e.preventDefault();
    const result = validateEducationData(expandedEduIndex >= 0 ? expandedEduIndex : null);
    if (!result.isValid) {
      setExpandedEduIndex(result.eduIdx);
      setEduFieldErrors(result.errors);
      setEduError('Fill details');
      scrollToFirstError(result.targetFieldId);
      return;
    }
    let updatedQuals = sortQualifications([...(formData.qualifications || [])]);
    const nextFormData = { ...formData, qualifications: updatedQuals };
    setFormData(nextFormData);
    localStorage.setItem('userProfile', JSON.stringify(nextFormData));
    setEduError('');
    setEduFieldErrors({});
    setExpandedEduIndex(-1);
    saveToBackend(nextFormData);
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
    const fNotice = getStepField('step3', 'noticePeriod', 'Notice Period', 'Select notice period', false);

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

      if (fNotice.isRequired && !exp.noticePeriod?.trim()) {
        errors.noticePeriod = true;
        hasError = true;
        if (!firstMissingId) firstMissingId = `field-exp-notice-${cIdx}`;
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
      scrollToFirstError(result.targetFieldId);
      return;
    }
    setExpError('');
    setExpFieldErrors({});
    const newIdx = (formData.experience || []).length;
    setExpandedExpIndex(newIdx);
    setExpandedRoleIndex(0);
    addArrayItem('experience', { companyName: '', noticePeriod: '', roles: [{ jobTitle: '', employmentType: '', currentCompany: false, joiningDate: '', leavingDate: '', roleDescription: '' }] });
    scrollToFirstError(`field-exp-company-${newIdx}`);
  };

  const handleSaveExperience = (e) => {
    if (e) e.preventDefault();
    const result = validateExperienceData(expandedExpIndex >= 0 ? expandedExpIndex : null);
    if (!result.isValid) {
      setExpandedExpIndex(result.cIdx);
      setExpandedRoleIndex(result.rIdx);
      setExpFieldErrors(result.errors);
      setExpError('Fill details');
      scrollToFirstError(result.targetFieldId);
      return;
    }
    setExpError('');
    setExpFieldErrors({});
    const sorted = sortExperience(formData.experience || []);
    const nextFormData = { ...formData, experience: sorted };
    setFormData(nextFormData);
    localStorage.setItem('userProfile', JSON.stringify(nextFormData));
    setExpandedExpIndex(-1);
    saveToBackend(nextFormData);
  };

  const Step2Education = () => {
    const s2Title = cmsConfig?.step2?.title || 'Education';
    const s2Subtitle = cmsConfig?.step2?.subtitle || 'Details like course, university, and more, help recruiters identify your educational background';
    const s2AddBtn = cmsConfig?.step2?.addBtnText || 'Add +';

    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
        <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{s2Title}</h3>
            <p className="text-sm text-gray-500 mt-1">{s2Subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {eduError && <span className="text-red-500 text-xs font-medium">{eduError}</span>}
            <button type="button" onClick={handleAddEducation} className="text-green-500 hover:text-green-600 font-semibold text-sm">
              {s2AddBtn}
            </button>
          </div>
        </div>
                
                <div className="space-y-6">
                  {sortQualifications(formData.qualifications || []).map((q, idx) => {
                    const eduData = cmsConfig?.step2?.educationData || DEFAULT_EDUCATION_DATA;
                    const currentEduConfig = eduData[q.educationType];
                    const isSchool = currentEduConfig ? currentEduConfig.category === 'school' : (q.educationType === '10th' || q.educationType === '12th');
                    const isHigher = !isSchool && !!q.educationType;
                    
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
                          <div id={`field-edu-type-${idx}`}>
                            <label className="block text-sm font-bold text-gray-900 mb-1.5">Education <span className="text-red-500">*</span></label>
                            <CustomDropdown
                              options={Object.keys(eduData).map(t => ({ value: t, label: t }))}
                              value={q.educationType || ''}
                              onChange={val => {
                                updateArray('qualifications', idx, 'educationType', val);
                                setEduFieldErrors({...eduFieldErrors, educationType: false});
                                if (val) setEduError('');
                              }}
                              placeholder="Select education type"
                              error={eduFieldErrors.educationType}
                            />
                            {eduFieldErrors.educationType && (
                              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Please select education type
                              </p>
                            )}
                          </div>

                          {isSchool && (
                            <>
                              <div id={`field-edu-board-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'board', 'Board', 'Select board').label} {getStepField('step2', 'board').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <CustomDropdown
                                  options={(currentEduConfig?.options && currentEduConfig.options.length > 10)
                                    ? currentEduConfig.options.map(b => (typeof b === 'string' ? { value: b, label: b } : b))
                                    : DEFAULT_BOARD_OPTIONS}
                                  value={q.board || ''}
                                  onChange={val => {
                                    updateArray('qualifications', idx, 'board', val);
                                    setEduFieldErrors({...eduFieldErrors, board: false});
                                  }}
                                  placeholder={getStepField('step2', 'board', 'Board', 'Select board').placeholder || 'Select board'}
                                  error={eduFieldErrors.board}
                                />
                                {eduFieldErrors.board && (
                                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Please select board
                                  </p>
                                )}
                              </div>
                              <div id={`field-edu-endYear-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'endYear', 'Passing out year', 'Select passing out year').label} {getStepField('step2', 'endYear').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <CustomDropdown
                                  options={Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => ({ value: String(year), label: String(year) }))}
                                  value={q.endYear ? String(q.endYear) : ''}
                                  onChange={val => {
                                    updateArray('qualifications', idx, 'endYear', val);
                                    setEduFieldErrors({...eduFieldErrors, endYear: false});
                                  }}
                                  placeholder={getStepField('step2', 'endYear', 'Passing out year', 'Select passing out year').placeholder || 'Select passing out year'}
                                  error={eduFieldErrors.endYear}
                                />
                                {eduFieldErrors.endYear && (
                                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Please select passing out year
                                  </p>
                                )}
                              </div>
                              <div id={`field-edu-schoolMedium-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'schoolMedium', 'School medium', 'Select medium').label} {getStepField('step2', 'schoolMedium').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <CustomDropdown
                                  options={(cmsConfig?.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS).map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt))}
                                  value={q.schoolMedium || ''}
                                  onChange={val => {
                                    updateArray('qualifications', idx, 'schoolMedium', val);
                                    setEduFieldErrors({...eduFieldErrors, schoolMedium: false});
                                  }}
                                  placeholder={getStepField('step2', 'schoolMedium', 'School medium', 'Select medium').placeholder || 'Select medium'}
                                  error={eduFieldErrors.schoolMedium}
                                />
                                {eduFieldErrors.schoolMedium && (
                                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Please select school medium
                                  </p>
                                )}
                              </div>
                              {(() => {
                                const numMarks = parseFloat(q.percentage);
                                const isOver100 = !isNaN(numMarks) && numMarks > 100;
                                const hasMarksError = eduFieldErrors.percentage || isOver100;
                                const marksErrorMsg = isOver100 
                                  ? 'Marks / Percentage cannot be greater than 100%' 
                                  : (typeof eduFieldErrors.percentage === 'string' ? eduFieldErrors.percentage : 'Please enter marks / percentage');

                                return (
                                  <div id={`field-edu-percentage-${idx}`}>
                                    <label className={`block text-sm font-bold ${hasMarksError ? 'text-red-500' : 'text-gray-900'} mb-1.5`}>
                                      {getStepField('step2', 'percentage', 'Marks', '% marks of 100 maximum').label} {cmsConfig?.step2?.fields?.percentage?.isRequired !== false && <span className="text-red-500">*</span>}
                                    </label>
                                    <input 
                                      type="text" 
                                      className={`w-full px-4 py-3 bg-white border ${hasMarksError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`} 
                                      placeholder={getStepField('step2', 'percentage', 'Marks', '% marks of 100 maximum').placeholder || '% marks of 100 maximum'} 
                                      value={q.percentage || ''} 
                                      onChange={e => { 
                                        updateArray('qualifications', idx, 'percentage', e.target.value.replace(/[^0-9.]/g, '')); 
                                        setEduFieldErrors({...eduFieldErrors, percentage: false}); 
                                      }} 
                                    />
                                    {hasMarksError && (
                                      <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {marksErrorMsg}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          )}

                          {isHigher && (
                            <>
                              <div id={`field-edu-university-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'university', 'University / Institute', 'Search or enter university/institute...').label} {getStepField('step2', 'university').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <InstituteAutocomplete 
                                  value={q.university || ''} 
                                  onChange={val => { 
                                    updateArray('qualifications', idx, 'university', val); 
                                    setEduFieldErrors(prev => ({...prev, university: false})); 
                                  }} 
                                  placeholder={getStepField('step2', 'university', 'University / Institute', 'Search or enter university/institute...').placeholder || 'Search or enter university/institute...'} 
                                  className={`w-full px-4 py-3 bg-white border ${eduFieldErrors.university ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`} 
                                />
                                {eduFieldErrors.university && (
                                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Please enter or select university / institute
                                  </p>
                                )}
                              </div>
                              <div id={`field-edu-course-${idx}`}>
                                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                                  {getStepField('step2', 'course', 'Course', 'Select course').label} {getStepField('step2', 'course').isRequired && <span className="text-red-500">*</span>}
                                </label>
                                <CustomDropdown
                                  options={(() => {
                                    if (currentEduConfig?.options && currentEduConfig.options.length > 0) {
                                      return currentEduConfig.options.map(c => (typeof c === 'string' ? { value: c, label: c } : c));
                                    }
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
                                      return opts.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
                                    } else {
                                      return [
                                        { value: "B.Tech/B.E.", label: "B.Tech/B.E." },
                                        { value: "B.Sc", label: "B.Sc" },
                                        { value: "B.Com", label: "B.Com" },
                                        { value: "B.A", label: "B.A" },
                                        { value: "BBA", label: "BBA" },
                                        { value: "M.Tech/M.E.", label: "M.Tech/M.E." },
                                        { value: "MBA/PGDM", label: "MBA/PGDM" },
                                        { value: "MCA", label: "MCA" }
                                      ];
                                    }
                                  })()}
                                  value={q.course || ''}
                                  onChange={val => {
                                    updateArray('qualifications', idx, 'course', val);
                                    setEduFieldErrors({...eduFieldErrors, course: false});
                                  }}
                                  placeholder={getStepField('step2', 'course', 'Course', 'Select course').placeholder || 'Select course'}
                                  error={eduFieldErrors.course}
                                />
                                {eduFieldErrors.course && (
                                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Please select course
                                  </p>
                                )}
                              </div>
                              <div id={`field-edu-courseType-${idx}`}>
                                <label className={`block text-sm font-bold ${eduFieldErrors.courseType ? 'text-red-500' : 'text-gray-900'} mb-3`}>
                                  {getStepField('step2', 'courseType', 'Course type', 'Select course type').label} {getStepField('step2', 'courseType').isRequired && <span className="text-red-500">*</span>}
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
                                {eduFieldErrors.courseType && (
                                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Please select course type
                                  </p>
                                )}
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
                                      onChange={val => {
                                        updateArray('qualifications', idx, 'startYear', val);
                                        setEduFieldErrors({...eduFieldErrors, startYear: false});
                                      }}
                                      placeholder={getStepField('step2', 'startYear', 'Starting year', 'Starting year').placeholder || 'Starting year'}
                                      error={eduFieldErrors.startYear}
                                    />
                                  </div>
                                  <span className="font-bold text-gray-900">To</span>
                                  <div className="flex-1">
                                    <CustomDropdown
                                      options={Array.from({length: 30}, (_, i) => new Date().getFullYear() - i + 5).map(year => ({ value: String(year), label: String(year) }))}
                                      value={q.endYear ? String(q.endYear) : ''}
                                      onChange={val => {
                                        updateArray('qualifications', idx, 'endYear', val);
                                        setEduFieldErrors({...eduFieldErrors, endYear: false});
                                      }}
                                      placeholder={getStepField('step2', 'endYear', 'Ending year', 'Ending year').placeholder || 'Ending year'}
                                      error={eduFieldErrors.endYear}
                                    />
                                  </div>
                                </div>
                                {(eduFieldErrors.startYear || eduFieldErrors.endYear) && (
                                  <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Please select starting and ending year
                                  </p>
                                )}
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
                                        options={currentGradingSystems.map((gs) => ({ value: gs.name, label: gs.name }))}
                                        value={q.gradingSystem || ''} 
                                        onChange={val => updateArray('qualifications', idx, 'gradingSystem', val)}
                                        placeholder={getStepField('step2', 'gradingSystem', 'Grading system', 'Select grading system', false).placeholder || 'Select grading system'}
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
                            <div className="flex items-center pt-2 border-t border-gray-100 mt-4">
                              <input type="checkbox" id={`primary-edu-${idx}`} className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500" checked={q.isPrimary || false} onChange={e => updateArray('qualifications', idx, 'isPrimary', e.target.checked)} />
                              <label htmlFor={`primary-edu-${idx}`} className="ml-3 text-gray-700 font-medium cursor-pointer">Mark this as my primary education</label>
                            </div>
                          )}
                          {q.educationType && q.isPrimary && (
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-4 text-xs font-bold text-green-700">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span>Primary Education</span>
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

  const Step3Experience = () => {
    const s3Title = cmsConfig?.step3?.title || 'Work Experience';
    const s3AddBtn = cmsConfig?.step3?.addBtnText || 'Add +';
    const s3FresherLabel = cmsConfig?.step3?.fresherLabel || 'Are you a Fresher?';

    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
        <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{s3Title}</h3>
          </div>
          {!formData.isFresher && (
            <div className="flex items-center gap-3">
              {expError && <span className="text-red-500 text-xs font-medium">{expError}</span>}
              <button type="button" onClick={handleAddExperience} className="text-green-500 font-semibold hover:text-green-600 text-sm">
                {s3AddBtn}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div className="flex flex-col items-start gap-3 mb-6">
            <label className="text-sm font-medium text-gray-700">{s3FresherLabel}</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center cursor-pointer group">
                <input type="radio" name="isFresher_onboarding" value="yes" className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" checked={formData.isFresher === true} onChange={() => setFormData({...formData, isFresher: true})} />
                <span className={`ml-2.5 text-[15px] ${formData.isFresher === true ? 'text-gray-900 font-medium' : 'text-[#64748B]'}`}>I am a Fresher</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input 
                  type="radio" 
                  name="isFresher_onboarding" 
                  value="no" 
                  className="w-[18px] h-[18px] accent-gray-900 cursor-pointer" 
                  checked={formData.isFresher === false} 
                  onChange={() => {
                    const isExpEmpty = !formData.experience || formData.experience.length === 0;
                    if (isExpEmpty) {
                      setExpandedExpIndex(0);
                      setExpandedRoleIndex(0);
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
                              <div key={cIdx} className="p-4 border border-gray-200 rounded-xl space-y-4 bg-gray-50 relative">
                                <button type="button" onClick={() => { removeArrayItem('experience', cIdx); setExpandedExpIndex(-1); }} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                <h4 className="font-semibold text-gray-700 pr-8">Company {cIdx + 1}</h4>
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
                                        {expFieldErrors.companyName && (
                                          <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Please enter or search company name
                                          </p>
                                        )}
                                      </div>
                                      <div className="relative border-l-2 border-green-500 ml-3 mt-8 space-y-8 pb-4">
                                        {(exp.roles || []).map((role, rIdx) => {
                                          const isRoleExpanded = expandedRoleIndex === rIdx;
                                          return (
                                          <div key={rIdx} className="relative pl-6">
                                            <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-green-500 border-4 border-gray-50 shadow-sm"></div>
                                            
                                            <div className="border border-gray-200 rounded-xl bg-white shadow-sm relative group">
                                              {/* Clickable Header */}
                                              <div
                                                className={`p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors ${isRoleExpanded ? 'bg-gray-50 rounded-t-xl' : 'rounded-xl'}`}
                                                onClick={() => setExpandedRoleIndex(isRoleExpanded ? -1 : rIdx)}
                                              >
                                                <div>
                                                  <h5 className="font-bold text-gray-900">{role.jobTitle || `Role ${rIdx + 1}`}</h5>
                                                  <p className="text-sm text-gray-500 mt-0.5">{role.employmentType || 'Employment Type'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <button type="button" onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newExp = [...(formData.experience || [])];
                                                    newExp[cIdx].roles.splice(rIdx, 1);
                                                    setFormData({...formData, experience: newExp});
                                                    setExpandedRoleIndex(0);
                                                  }} className="text-gray-300 hover:text-red-500 transition-colors hidden group-hover:block">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                  </button>
                                                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isRoleExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                              </div>

                                              {/* Animated Body */}
                                              <div className={`grid transition-all duration-300 ease-in-out ${isRoleExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                <div className={`${isRoleExpanded ? 'overflow-visible' : 'overflow-hidden'} min-h-0`}>
                                                  <div className="p-6 border-t border-gray-100 space-y-6 bg-white rounded-b-xl">
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
                                                      {expFieldErrors.roles?.[rIdx]?.jobTitle && (
                                                        <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                          </svg>
                                                          Please enter or search job title
                                                        </p>
                                                      )}
                                                    </div>
                                                    <div id={`field-exp-empType-${cIdx}-${rIdx}`}>
                                                      <label className="block text-sm font-bold text-gray-900 mb-1.5">{fEmpType.label} {fEmpType.isRequired && <span className="text-red-500">*</span>}</label>
                                                      <CustomDropdown
                                                        options={(cmsConfig?.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS).map(opt => ({ value: typeof opt === 'string' ? opt : opt.value, label: typeof opt === 'string' ? opt : opt.label }))}
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
                                                        placeholder={fEmpType.placeholder || "Select employment type"}
                                                        error={expFieldErrors.roles?.[rIdx]?.employmentType}
                                                      />
                                                      {expFieldErrors.roles?.[rIdx]?.employmentType && (
                                                        <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                          </svg>
                                                          Please select employment type
                                                        </p>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center">
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
                                                        setFormData({ ...formData, experience: newExp });
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
                                                        {expFieldErrors.roles?.[rIdx]?.joiningDate && (
                                                          <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            Please select joining date
                                                          </p>
                                                        )}
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
                                                          {expFieldErrors.roles?.[rIdx]?.leavingDate && (
                                                            <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                              </svg>
                                                              Please select leaving date
                                                            </p>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="mt-2" id={`field-exp-roleDesc-${cIdx}-${rIdx}`}>
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
                                                      {expFieldErrors.roles?.[rIdx]?.roleDescription && (
                                                        <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                          </svg>
                                                          Please describe your roles & responsibilities
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          );
                                        })}

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
                                      <div className="mt-6 pt-6 border-t border-gray-200" id={`field-exp-noticePeriod-${cIdx}`}>
                                        <label className="block text-sm font-bold text-gray-900 mb-1.5">{fNotice.label} {fNotice.isRequired && <span className="text-red-500">*</span>}</label>
                                        <div className="w-full md:w-1/2">
                                          <CustomDropdown
                                            options={(cmsConfig?.step3?.noticePeriodOptions || cmsConfig?.step4?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS).map(opt => ({ value: typeof opt === 'string' ? opt : opt.value, label: typeof opt === 'string' ? opt : opt.label }))}
                                            value={exp.noticePeriod || ''}
                                            onChange={val => {
                                              const newExp = [...(formData.experience || [])];
                                              newExp[cIdx].noticePeriod = val;
                                              setFormData({...formData, experience: newExp});
                                              if (expFieldErrors.noticePeriod) {
                                                setExpFieldErrors({...expFieldErrors, noticePeriod: false});
                                              }
                                            }}
                                            placeholder={fNotice.placeholder || "Select notice period"}
                                            error={expFieldErrors.noticePeriod}
                                          />
                                        </div>
                                        {expFieldErrors.noticePeriod && (
                                          <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Please select notice period
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                                
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
                            <button type="button" onClick={handleAddExperience} className="text-green-500 font-semibold hover:text-green-600 text-sm whitespace-nowrap">
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
    const s4Title = cmsConfig?.step4?.title || 'Key Skills & Preferences';
    const s4Subtitle = cmsConfig?.step4?.subtitle || 'Highlight your key skills and preferences to find matching jobs';

    const fDesignation = getStepField('step4', 'currentDesignation', 'Current Designation', 'e.g. Software Engineer', false);
    const fLinkedin = getStepField('step4', 'linkedinUrl', 'LinkedIn Profile', 'https://linkedin.com/in/...', false);
    const fSalaryType = getStepField('step4', 'salaryType', 'Salary Type', 'Select salary type', false);
    const fCurrency = getStepField('step4', 'currency', 'Currency', 'Select currency', false);
    const fCurrentSalary = getStepField('step4', 'currentSalary', 'Current Annual CTC', 'e.g. 5,00,000', false);
    const fExpectedSalary = getStepField('step4', 'expectedSalary', 'Expected Annual CTC', 'e.g. 7,50,000', false);
    const fSkills = getStepField('step4', 'skills', 'Key Skills', 'Type skill and press Enter (e.g., React, Node.js)', false);

    const currentSalaryDisplayLabel = p.salaryType === 'Monthly'
      ? (fCurrentSalary.label ? fCurrentSalary.label.replace(/Annual CTC|Annual Salary|Annual/gi, 'Monthly CTC') : 'Current Monthly CTC')
      : (fCurrentSalary.label || 'Current Annual CTC');

    const expectedSalaryDisplayLabel = p.salaryType === 'Monthly'
      ? (fExpectedSalary.label ? fExpectedSalary.label.replace(/Annual CTC|Annual Salary|Annual/gi, 'Monthly CTC') : 'Expected Monthly CTC')
      : (fExpectedSalary.label || 'Expected Annual CTC');

    const currentSalaryDisplayPlaceholder = p.salaryType === 'Monthly'
      ? (fCurrentSalary.placeholder ? fCurrentSalary.placeholder.replace(/5,00,000|500000/g, '40,000') : `e.g. ${getCurrencySymbol(p.currency)}40,000`)
      : (fCurrentSalary.placeholder || `e.g. ${getCurrencySymbol(p.currency)}5,00,000`);

    const expectedSalaryDisplayPlaceholder = p.salaryType === 'Monthly'
      ? (fExpectedSalary.placeholder ? fExpectedSalary.placeholder.replace(/7,50,000|750000|8,00,000|800000/g, '60,000') : `e.g. ${getCurrencySymbol(p.currency)}60,000`)
      : (fExpectedSalary.placeholder || `e.g. ${getCurrencySymbol(p.currency)}7,50,000`);

    const skillsList = p.skills ? p.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
        <div className="mb-6 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{s4Title}</h3>
          {s4Subtitle && <p className="text-sm text-gray-500 mt-1">{s4Subtitle}</p>}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2" id="field-linkedinUrl">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fLinkedin.label} {fLinkedin.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input 
              type="url" 
              className={`w-full px-4 py-3 bg-white border ${showStep4Errors && fLinkedin.isRequired && !p.linkedinUrl ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`} 
              placeholder={fLinkedin.placeholder || 'https://linkedin.com/in/...'}
              value={p.linkedinUrl || ''} 
              onChange={e => {
                setP('linkedinUrl', e.target.value);
                if (showStep4Errors) setShowStep4Errors(false);
              }} 
            />
            {showStep4Errors && fLinkedin.isRequired && !p.linkedinUrl && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please enter {fLinkedin.label || 'LinkedIn Profile URL'}
              </p>
            )}
          </div>
          
          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div id="field-salaryType">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {fSalaryType.label || 'Salary Type'} {fSalaryType.isRequired && <span className="text-red-500">*</span>}
              </label>
              <select 
                className={`w-full px-4 py-3 bg-white border ${showStep4Errors && fSalaryType.isRequired && !p.salaryType ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all cursor-pointer`} 
                value={p.salaryType || 'Yearly'} 
                onChange={e => {
                  setP('salaryType', e.target.value);
                  if (showStep4Errors) setShowStep4Errors(false);
                }}
              >
                <option value="Yearly">Yearly</option>
                <option value="Monthly">Monthly</option>
              </select>
              {showStep4Errors && fSalaryType.isRequired && !p.salaryType && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please select {fSalaryType.label || 'Salary Type'}
                </p>
              )}
            </div>
            <div id="field-currency">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {fCurrency.label || 'Currency'} {fCurrency.isRequired && <span className="text-red-500">*</span>}
              </label>
              <select 
                className={`w-full px-4 py-3 bg-white border ${showStep4Errors && fCurrency.isRequired && !p.currency ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all cursor-pointer`} 
                value={p.currency || 'INR'} 
                onChange={e => {
                  setP('currency', e.target.value);
                  if (showStep4Errors) setShowStep4Errors(false);
                }}
              >
                {DEFAULT_CURRENCY_OPTIONS.map((curr) => (
                  <option key={curr.value} value={curr.value}>{curr.label}</option>
                ))}
              </select>
              {showStep4Errors && fCurrency.isRequired && !p.currency && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please select {fCurrency.label || 'Currency'}
                </p>
              )}
            </div>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-6">
            <div id="field-currentSalary">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {currentSalaryDisplayLabel} {fCurrentSalary.isRequired && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 bg-white border ${showStep4Errors && fCurrentSalary.isRequired && !p.currentSalary ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`} 
                placeholder={currentSalaryDisplayPlaceholder} 
                value={p.currentSalary || ''} 
                onChange={e => {
                  setP('currentSalary', formatIndianNumber(e.target.value));
                  if (showStep4Errors) setShowStep4Errors(false);
                }} 
              />
              {showStep4Errors && fCurrentSalary.isRequired && !p.currentSalary && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please enter {currentSalaryDisplayLabel}
                </p>
              )}
            </div>
            <div id="field-expectedSalary">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                {expectedSalaryDisplayLabel} {fExpectedSalary.isRequired && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="text" 
                className={`w-full px-4 py-3 bg-white border ${showStep4Errors && fExpectedSalary.isRequired && !p.expectedSalary ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all`} 
                placeholder={expectedSalaryDisplayPlaceholder} 
                value={p.expectedSalary || ''} 
                onChange={e => {
                  setP('expectedSalary', formatIndianNumber(e.target.value));
                  if (showStep4Errors) setShowStep4Errors(false);
                }} 
              />
              {showStep4Errors && fExpectedSalary.isRequired && !p.expectedSalary && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please enter {expectedSalaryDisplayLabel}
                </p>
              )}
            </div>
          </div>

          <div className="col-span-2" id="field-skills">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fSkills.label} {fSkills.isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : []).map(skill => (
                <span key={skill} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100 flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors" onClick={() => removeSkill(skill)} title="Click to remove">
                  {skill} <span className="text-[10px]">✕</span>
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
                  const currentSkills = p.skills ? p.skills.split(',').map(s => s.trim()).filter(s=>s) : [];
                  if (!currentSkills.includes(val)) {
                    currentSkills.push(val);
                    setFormData({...formData, professionalDetails: {...p, skills: currentSkills.join(', ')}});
                    if (showStep4Errors) setShowStep4Errors(false);
                  }
                }
              }}
              placeholder={fSkills.placeholder || "Search or select a skill to add..."}
              error={showStep4Errors && fSkills.isRequired && skillsList.length === 0}
            />
            {showStep4Errors && fSkills.isRequired && skillsList.length === 0 && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please add at least one {fSkills.label || 'Key Skill'}
              </p>
            )}
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
                            if (showStep4Errors) setShowStep4Errors(false);
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
      </div>
    );
  };

  const Step5Documents = () => {
    const docs = formData.documents || {};
    const setDoc = (field, val) => setFormData({...formData, documents: {...docs, [field]: val}});

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
          // Attempt Mux Video direct upload first
          const muxResult = await uploadVideoToMux(file, (p) => setVideoUploadProgress(p));
          if (muxResult.isMux && muxResult.streamUrl) {
            setDoc('introVideo', muxResult.streamUrl);
            if (showStep5Errors) setShowStep5Errors(false);
            return;
          }
          // Fallback to Firebase Storage if Mux is not configured
          const downloadURL = await uploadFileToStorage(file, 'intro-videos', (p) => setVideoUploadProgress(p));
          setDoc('introVideo', downloadURL);
          if (showStep5Errors) setShowStep5Errors(false);
        } else {
          const downloadURL = await uploadFileToStorage(file, 'resumes');
          setDoc(type, downloadURL);
          if (showStep5Errors) setShowStep5Errors(false);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setDocError(prev => ({...prev, [type]: 'Failed to upload file. Please try again.'}));
      } finally {
        setIsUploading(false);
        setUploadingType(null);
      }
    };

    const handleAttachVideoLink = (e) => {
      e.preventDefault();
      if (!videoLink.trim()) {
        setDocError(prev => ({...prev, introVideo: 'Please enter a valid video link (YouTube, Loom, Vimeo, Drive, or video URL)'}));
        return;
      }
      setDocError(prev => ({...prev, introVideo: ''}));
      setDoc('introVideo', videoLink.trim());
      if (showStep5Errors) setShowStep5Errors(false);
    };

    const getFileName = (url) => {
      if (!url) return '';
      if (!url.startsWith('http')) return url;
      return "Uploaded Document (Click to view)";
    };

    const isDirectVideo = (url) => {
      if (!url) return false;
      return url.includes('firebasestorage') || /\.(mp4|webm|mov|m4v|mkv)($|\?)/i.test(url);
    };

    const s5Title = cmsConfig?.step5?.title || 'Documents & Media';
    const s5Subtitle = cmsConfig?.step5?.subtitle || 'Upload your resume, cover letter, and introductory video';
    const fResume = getStepField('step5', 'resume', 'Resume (PDF/DOCX)', 'Supported Formats: doc, docx, pdf, upto 300KB', true);
    const fCoverLetter = getStepField('step5', 'coverLetter', 'Cover Letter', 'Supported Formats: doc, docx, pdf, upto 300KB', false);
    const fIntroVideo = getStepField('step5', 'introVideo', 'Introductory Video', 'Upload MP4/MOV or attach video link', false);

    const vCfg = cmsConfig?.step5?.videoConfig || {};
    const videoSectionTitle = vCfg.sectionTitle || fIntroVideo.label || 'Introductory Video';
    const videoSectionSubtitle = vCfg.sectionSubtitle || fIntroVideo.placeholder || 'Upload MP4/MOV or attach video link';
    const uploadTabLabel = vCfg.uploadTabLabel || 'Upload File';
    const linkTabLabel = vCfg.linkTabLabel || 'Paste Link';
    const uploadDropzoneTitle = vCfg.uploadDropzoneTitle || 'Click or drag video to upload';
    const uploadDropzoneSubtitle = vCfg.uploadDropzoneSubtitle || 'MP4, MOV, WebM up to 200MB (Max 3 mins)';
    const linkInputPlaceholder = vCfg.linkInputPlaceholder || 'e.g. YouTube, Loom, Vimeo, Drive, or Mux stream link';
    const linkAttachButtonText = vCfg.linkAttachButtonText || 'Attach';
    const linkHelpText = vCfg.linkHelpText || 'Supported: YouTube, Loom, Vimeo, Google Drive, Mux Stream URLs, and MP4 links.';

    return (
      <div className="space-y-6 animate-fade-in pb-1">
        <div className="mb-2 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{s5Title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{s5Subtitle || 'Manage your introductory video, resume, and cover letter.'}</p>
        </div>

        <div className="space-y-6">
          {/* 1 & 2: Side-by-Side Resume & Cover Letter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume Upload Card */}
            <div id="field-resume" className={`p-5 border ${showStep5Errors && fResume.isRequired && !docs.resume ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-2xl bg-white shadow-2xs space-y-3 transition-all`}>
              <label className="block text-sm font-bold text-gray-900">
                {fResume.label || 'Upload Resume'} {fResume.isRequired && <span className="text-red-500">*</span>}
              </label>
              <div>
                <input 
                  type="file" 
                  disabled={isUploading} 
                  accept=".pdf,.doc,.docx" 
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50 transition-all" 
                  onChange={e => handleFileUpload(e, 'resume')} 
                />
              </div>
              <p className="text-xs text-gray-700 font-medium">{fResume.placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}</p>
              {isUploading && uploadingType === 'resume' && (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 animate-pulse">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                  </span>
                  <span>Uploading {fResume.label || 'Resume'}...</span>
                </div>
              )}
              {docError.resume && <p className="text-xs text-red-500 font-medium">{docError.resume}</p>}
              {showStep5Errors && fResume.isRequired && !docs.resume && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please upload your {fResume.label || 'Resume'}
                </p>
              )}
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
                        {getFileName(docs.resume)}
                      </a>
                      <p className="text-[11px] text-gray-500 font-medium">Uploaded Document</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setDoc('resume', null)} 
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

            {/* Cover Letter Upload Card */}
            <div id="field-coverLetter" className={`p-5 border ${showStep5Errors && fCoverLetter.isRequired && !docs.coverLetter ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-2xl bg-white shadow-2xs space-y-3 transition-all`}>
              <label className="flex items-center justify-between text-sm font-bold text-gray-900">
                <span>{fCoverLetter.label || 'Upload Cover Letter'}</span>
                {fCoverLetter.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <div>
                <input 
                  type="file" 
                  disabled={isUploading} 
                  accept=".pdf,.doc,.docx" 
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50 transition-all" 
                  onChange={e => handleFileUpload(e, 'coverLetter')} 
                />
              </div>
              <p className="text-xs text-gray-700 font-medium">{fCoverLetter.placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}</p>
              {isUploading && uploadingType === 'coverLetter' && (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 animate-pulse">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                  </span>
                  <span>Uploading {fCoverLetter.label || 'Cover Letter'}...</span>
                </div>
              )}
              {docError.coverLetter && <p className="text-xs text-red-500 font-medium">{docError.coverLetter}</p>}
              {showStep5Errors && fCoverLetter.isRequired && !docs.coverLetter && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Please upload your {fCoverLetter.label || 'Cover Letter'}
                </p>
              )}
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
                        {getFileName(docs.coverLetter)}
                      </a>
                      <p className="text-[11px] text-gray-500 font-medium">Uploaded Document</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setDoc('coverLetter', null)} 
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
          </div>

          {/* 3: Introductory Video Card */}
          <div id="field-introVideo" className={`p-6 border ${showStep5Errors && fIntroVideo.isRequired && !docs.introVideo ? 'border-red-500 ring-1 ring-red-500' : 'border-emerald-200'} rounded-2xl bg-white shadow-2xs space-y-4 transition-all`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  {videoSectionTitle} {fIntroVideo.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
                <p className="text-xs text-gray-500 mt-0.5">{videoSectionSubtitle}</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold self-start">
                <button
                  type="button"
                  onClick={() => setVideoMode('upload')}
                  className={`px-3 py-1 rounded-lg transition-all ${videoMode === 'upload' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {uploadTabLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setVideoMode('link')}
                  className={`px-3 py-1 rounded-lg transition-all ${videoMode === 'link' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {linkTabLabel}
                </button>
              </div>
            </div>

            {showStep5Errors && fIntroVideo.isRequired && !docs.introVideo && (
              <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Please upload or attach your {videoSectionTitle}
              </p>
            )}

            {/* Mode 1: File Upload */}
            {videoMode === 'upload' && !docs.introVideo && (
              <div className={`p-6 border-2 border-dashed ${isUploading && uploadingType === 'introVideo' ? 'border-emerald-400 bg-emerald-50/40' : (showStep5Errors && fIntroVideo.isRequired && !docs.introVideo ? 'border-red-400 bg-red-50/30' : 'border-gray-300')} rounded-2xl bg-white text-center hover:border-emerald-400 transition-all cursor-pointer relative group flex flex-col items-center justify-center min-h-[140px]`}>
                <input 
                  type="file" 
                  disabled={isUploading} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.mov,.webm,.mkv,.m4v" 
                  onChange={e => handleFileUpload(e, 'introVideo')} 
                />
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
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
                <p className="text-sm font-bold text-emerald-600">
                  {isUploading && uploadingType === 'introVideo' ? `Uploading Video (${videoUploadProgress}%)...` : uploadDropzoneTitle}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{uploadDropzoneSubtitle}</p>
                
                {isUploading && uploadingType === 'introVideo' && (
                  <div className="w-full max-w-xs mx-auto mt-3">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${videoUploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Link Input */}
            {videoMode === 'link' && !docs.introVideo && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder={linkInputPlaceholder}
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAttachVideoLink}
                    className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-xs flex-shrink-0 cursor-pointer"
                  >
                    {linkAttachButtonText}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">{linkHelpText}</p>
              </div>
            )}

            {docs.introVideo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setDoc('introVideo', null);
                      setVideoLink('');
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                  >
                    Remove Video
                  </button>
                </div>

                <VideoPlayer url={docs.introVideo} maxPlayerHeight="150px" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Step6Review = () => {
    const s6Title = cmsConfig?.step6?.title || 'Final Review';
    const s6Subtitle = cmsConfig?.step6?.subtitle || 'Please review all the details you filled in before submitting.';
    const p = formData.professionalDetails || {};

    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar text-sm bg-blue-50/30 p-4 rounded-xl border border-blue-100">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-palette-900 mb-2">{s6Title}</h3>
          <p className="text-gray-500">{s6Subtitle}</p>
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
            <p className="font-medium text-palette-900">Fresher</p>
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
          <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Documents & Media</h4>
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 w-32">Resume:</span> 
              {formData.documents?.resume ? (
                <a href={formData.documents.resume} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
                  ✓ Resume Uploaded (Click to view)
                </a>
              ) : <span className="text-gray-400 italic">Not uploaded</span>}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 w-32">Cover Letter:</span> 
              {formData.documents?.coverLetter ? (
                <a href={formData.documents.coverLetter} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
                  ✓ Cover Letter Uploaded
                </a>
              ) : <span className="text-gray-400 italic">None</span>}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 w-32">Intro Video:</span> 
              {formData.documents?.introVideo ? (
                <a href={formData.documents.introVideo} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
                  📹 Introductory Video Attached (Click to watch)
                </a>
              ) : <span className="text-gray-400 italic">None</span>}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const headerTitle = cmsConfig?.header?.title || 'Create your Profile';
  const nextBtnText = cmsConfig?.buttons?.nextBtnText || 'Save & Continue';
  const backBtnText = cmsConfig?.buttons?.backBtnText || 'Back';
  const submitBtnText = cmsConfig?.buttons?.submitBtnText || 'Submit Profile';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in border border-gray-200">
        
        {/* Header & Progress */}
        <div className="pt-6 pb-4 px-8 border-b border-gray-100 flex-shrink-0 bg-white z-10 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black text-palette-900">{headerTitle}</h2>
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
                  key="onboarding-next-btn"
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="sm:w-auto px-10 py-3.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  {nextBtnText}
                </button>
              ) : (
                <button 
                  key="onboarding-submit-btn"
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit(e);
                  }}
                  disabled={isSubmitting}
                  className={`sm:w-auto px-10 py-3.5 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 shadow-green-600/30 hover:bg-green-700 hover:-translate-y-0.5'}`}
                >
                  {isSubmitting ? 'Saving...' : submitBtnText}
                </button>
              )}
              
              {currentStep > 1 && (
                <button 
                  key="onboarding-back-btn"
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleBack();
                  }} 
                  className="sm:w-auto px-10 py-3.5 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer"
                >
                  {backBtnText}
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
