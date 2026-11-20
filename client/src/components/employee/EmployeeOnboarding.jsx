import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomMonthPicker from '../common/CustomMonthPicker';
import CustomDropdown from '../common/CustomDropdown';
import MultiSelectLocationDropdown from '../common/MultiSelectLocationDropdown';
import { currentLocationOptions, preferredLocationOptions } from '../../data/preferredLocations';
import { allSkillsOptions, getSuggestedSkills } from '../../utils/skillsData';
import { uploadFileToStorage } from '../../utils/firebaseStorage';
import { uploadVideoToMux } from '../../utils/muxUpload';
import { compressFileIfNeeded, formatFileSize, calculateSavedPercent } from '../../utils/fileCompressor';
import FileCompressorModal from '../common/FileCompressorModal';
import DocumentPreviewModal from '../common/DocumentPreviewModal';
import VideoPlayer from '../common/VideoPlayer';
import InstituteAutocomplete from '../common/InstituteAutocomplete';
import JobTitleAutocomplete from '../common/JobTitleAutocomplete';
import CompanyAutocomplete from '../common/CompanyAutocomplete';
import CountryCodeDropdown from '../common/CountryCodeDropdown';
import { socket } from '../../utils/socket';
import EducationModal from './EducationModal';
import ExperienceModal from './ExperienceModal';
import './EmployeeProfile.css';

const formatMonthYear = (dateStr) => {
  if (!dateStr) return 'MM/YYYY';
  const [year, month] = dateStr.split('-');
  if (!year || !month) return 'MM/YYYY';
  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthsList[parseInt(month, 10) - 1]} ${year}`;
};

const calculateCompanyDuration = (co) => {
  if (!co || !co.roles || co.roles.length === 0) return '';
  const parseYearMonth = (str) => {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length < 2) return null;
    return parseInt(parts[0], 10) * 12 + parseInt(parts[1], 10) - 1;
  };

  let earliest = Infinity;
  let latest = -Infinity;
  const now = new Date();
  const currentMonthIdx = now.getFullYear() * 12 + now.getMonth();

  co.roles.forEach(r => {
    const j = parseYearMonth(r.joiningDate);
    if (j !== null && j < earliest) earliest = j;

    if (r.currentCompany) {
      if (currentMonthIdx > latest) latest = currentMonthIdx;
    } else {
      const l = parseYearMonth(r.leavingDate);
      if (l !== null && l > latest) latest = l;
    }
  });

  if (earliest === Infinity || latest === -Infinity || latest < earliest) return '';
  const totalMonths = Math.max(1, latest - earliest + 1);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let res = '';
  if (years > 0) res += `${years} yr${years > 1 ? 's' : ''}`;
  if (years > 0 && months > 0) res += ' ';
  if (months > 0) res += `${months} month${months > 1 ? 's' : ''}`;
  return res || '1 month';
};

const calculateRoleDuration = (joiningDate, leavingDate, isCurrent) => {
  if (!joiningDate) return '';
  const parseYearMonth = (str) => {
    if (!str) return null;
    const parts = str.split('-');
    if (parts.length < 2) return null;
    return parseInt(parts[0], 10) * 12 + parseInt(parts[1], 10) - 1;
  };
  const j = parseYearMonth(joiningDate);
  if (j === null) return '';
  const now = new Date();
  const currentMonthIdx = now.getFullYear() * 12 + now.getMonth();
  const l = isCurrent ? currentMonthIdx : parseYearMonth(leavingDate);
  if (l === null || l < j) return '';
  const totalMonths = Math.max(1, l - j + 1);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let res = '';
  if (years > 0) res += `${years} yr${years > 1 ? 's' : ''}`;
  if (years > 0 && months > 0) res += ' ';
  if (months > 0) res += `${months} month${months > 1 ? 's' : ''}`;
  return res || '1 month';
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

// Education start and end year dropdowns (automatically increments by 1 year every new calendar year, with 100 past years)
const getStartYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 100 }, (_, i) => currentYear - i).map(year => ({
    value: String(year),
    label: String(year)
  }));
};

const getEndYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 100 }, (_, i) => currentYear - i).map(year => ({
    value: String(year),
    label: String(year)
  }));
};

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
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [editingEduIdx, setEditingEduIdx] = useState(-1);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpIdx, setEditingExpIdx] = useState(-1);
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
  const [isCompressorModalOpen, setIsCompressorModalOpen] = useState(false);
  const [compressorTargetField, setCompressorTargetField] = useState('resume');
  const [isCompressingDoc, setIsCompressingDoc] = useState(false);
  const [compressingType, setCompressingType] = useState(null);
  const [compressionBadge, setCompressionBadge] = useState({ resume: null, coverLetter: null });
  const [previewDocData, setPreviewDocData] = useState(null);
  const [cmsConfig, setCmsConfig] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const resumeFileRef = useRef(null);
  const coverLetterFileRef = useRef(null);

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
    // Multiple user accounts are allowed to use the same mobile number
    setPhoneError('');
    return true;
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

  useEffect(() => {
    const handleCmsUpdate = ({ employeeOnboarding }) => {
      if (employeeOnboarding && typeof employeeOnboarding === 'object') setCmsConfig(employeeOnboarding);
    };
    socket.on('employee_onboarding_config_updated', handleCmsUpdate);
    return () => socket.off('employee_onboarding_config_updated', handleCmsUpdate);
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
        if (!parsed.videoVisibility) {
          parsed.videoVisibility = parsed.documents?.videoVisibility || 'everyone';
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse profile data");
      }
    }
    return {
      firstName: '',
      lastName: '',
      countryCode: '+91',
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
        introVideo: null,
        videoVisibility: 'everyone'
      },
      videoVisibility: 'everyone',
      isProfilePrivate: true
    };
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const sessionTokenRef = useRef(localStorage.getItem('employeeToken'));
  const loadedAccountEmailRef = useRef('');

  // Fetch Profile if exists
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('employeeToken');
        sessionTokenRef.current = token;
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        // Profile controller directly returns the object, or a message on error
        if (res.ok && data && !data.message) {
          loadedAccountEmailRef.current = String(data.email || '').trim().toLowerCase();
          if (data.onboardingStep && data.onboardingStep >= 1 && data.onboardingStep <= 6) {
            const params = new URLSearchParams(window.location.search);
            if (!params.get('step')) {
              setCurrentStepState(data.onboardingStep);
              localStorage.setItem('onboardingCurrentStep', data.onboardingStep.toString());
            }
          }
          setFormData(prev => {
            const isSameUser =
              prev?.email &&
              data?.email &&
              String(prev.email).trim().toLowerCase() === String(data.email).trim().toLowerCase();
            const base = isSameUser ? prev : {};
            const next = {
              _id: data._id || base._id || '',
              firstName: data.firstName ?? (isSameUser ? base.firstName || '' : ''),
              lastName: data.lastName ?? (isSameUser ? base.lastName || '' : ''),
              countryCode: data.countryCode || (isSameUser ? base.countryCode : '+91') || '+91',
              email: data.email || '',
              phone: data.phone ?? (isSameUser ? base.phone || '' : ''),
              avatar: data.avatar ?? (isSameUser ? base.avatar || '' : ''),
              isFresher: data.isFresher !== undefined ? Boolean(data.isFresher) : (isSameUser ? Boolean(base.isFresher) : false),
              designation: data.designation ?? (isSameUser ? base.designation || '' : ''),
              totalExperience: data.totalExperience ?? (isSameUser ? base.totalExperience || '' : ''),
              noticePeriod: data.noticePeriod ?? (isSameUser ? base.noticePeriod || '' : ''),
              location: data.location ?? (isSameUser ? base.location || '' : ''),
              preferredLocation: data.preferredLocation ?? (isSameUser ? base.preferredLocation || '' : ''),
              industry: data.industry ?? (isSameUser ? base.industry || '' : ''),
              brief: data.brief ?? (isSameUser ? base.brief || '' : ''),
              qualifications: Array.isArray(data.qualifications)
                ? sortQualifications(data.qualifications)
                : [],
              experience: Array.isArray(data.experience)
                ? sortExperience(data.experience)
                : [],
              professionalDetails: {
                currentDesignation: '',
                currentSalary: '',
                expectedSalary: '',
                noticePeriod: '',
                skills: '',
                ...(isSameUser ? (base.professionalDetails || {}) : {}),
                ...(data.professionalDetails || {})
              },
              videoVisibility: data.videoVisibility || data.documents?.videoVisibility || 'everyone',
              documents: {
                resume: data.resume || data.documents?.resume || null,
                coverLetter: data.coverLetter || data.documents?.coverLetter || null,
                introVideo: data.introVideo || data.documents?.introVideo || null,
                videoVisibility: data.videoVisibility || data.documents?.videoVisibility || 'everyone'
              },
              isProfilePrivate: data.isProfilePrivate !== undefined ? Boolean(data.isProfilePrivate) : true
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
      const token = localStorage.getItem('employeeToken');
      if (!token) return;
      // Guard against cross-tab account switch: never write Account A's data with Account B's token
      if (sessionTokenRef.current && token !== sessionTokenRef.current) {
        console.warn('[EmployeeOnboarding] Session switched to another account in another tab; skipping save.');
        return;
      }
      if (
        loadedAccountEmailRef.current &&
        dataToSave?.email &&
        String(dataToSave.email).trim().toLowerCase() !== loadedAccountEmailRef.current
      ) {
        console.warn('[EmployeeOnboarding] Account email mismatch; skipping save.');
        return;
      }
      localStorage.setItem('userProfile', JSON.stringify(dataToSave));
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
      const isEduRequired = cmsConfig?.step2?.fields?.educationType?.isRequired !== false;
      const quals = formData.qualifications || [];
      if (isEduRequired && quals.length === 0) {
        setEduError('Please add at least one education qualification');
        handleOpenEducationModal(-1);
        return;
      }
      setEduError('');
      setEduFieldErrors({});
    }
    if (currentStep === 3) {
      if (!formData.isFresher) {
        const exps = formData.experience || [];
        const isExpReq = cmsConfig?.step3?.fields?.companyName?.isRequired !== false;
        if (isExpReq && exps.length === 0) {
          setExpError('Please add at least one work experience or choose Fresher');
          handleOpenExperienceModal(-1);
          return;
        }
      }
      setExpError('');
      setExpFieldErrors({});
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

    if (!formData.isFresher) {
      const exps = formData.experience || [];
      const isExpReq = cmsConfig?.step3?.fields?.companyName?.isRequired !== false;
      if (isExpReq && exps.length === 0) {
        setCurrentStep(3);
        setExpError('Please add at least one work experience or choose Fresher');
        return;
      }
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
        <div className="mb-4 sm:mb-6 pb-2 border-b border-gray-100">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">{s1Title}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div id="field-firstName">
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
              {fFirstName.label} {fFirstName.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input 
              type="text" 
              className={`w-full px-4 py-2.5 sm:py-3 bg-white border ${showStep1Errors && fFirstName.isRequired && !formData.firstName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'} rounded-xl text-gray-800 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] transition-all text-sm`} 
              placeholder={fFirstName.placeholder} 
              value={formData.firstName || ''} 
              onChange={e => { setFormData({...formData, firstName: e.target.value}); setShowStep1Errors(false); }} 
            />
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
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
              {fLastName.label} {fLastName.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input 
              type="text" 
              className={`w-full px-4 py-2.5 sm:py-3 bg-white border ${showStep1Errors && fLastName.isRequired && !formData.lastName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'} rounded-xl text-gray-800 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] transition-all text-sm`} 
              placeholder={fLastName.placeholder} 
              value={formData.lastName || ''} 
              onChange={e => { setFormData({...formData, lastName: e.target.value}); setShowStep1Errors(false); }} 
            />
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
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
              {fPhone.label} {fPhone.isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className={`flex items-center bg-white border ${((showStep1Errors && fPhone.isRequired && (!formData.phone || formData.phone.length < 10)) || phoneError) ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'} rounded-xl focus-within:border-[#059669] focus-within:ring-1 focus-within:ring-[#059669] transition-all`}>
              <CountryCodeDropdown
                value={formData.countryCode || '+91'}
                onChange={(code) => setFormData({ ...formData, countryCode: code })}
              />
              <input 
                type="text" 
                className="w-full px-4 py-2.5 sm:py-3 bg-transparent text-gray-800 outline-none rounded-r-xl transition-all text-sm" 
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
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
              {fEmail.label} {fEmail.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input type="email" disabled className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed text-sm" value={formData.email || ''} />
          </div>
          <div id="field-industry">
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
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
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
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
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
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
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
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
              className={`w-full px-4 py-2.5 sm:py-3 bg-white border ${showStep1Errors && fLocation.isRequired && !formData.location ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'} rounded-xl text-gray-800 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] transition-all text-sm`}
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
          <div id="field-preferredLocation" className="col-span-1 sm:col-span-2">
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
              {fPreferredLocation.label} {fPreferredLocation.isRequired && <span className="text-red-500">*</span>}
            </label>
            {(formData.preferredLocation ? formData.preferredLocation.split(',').map(s => s.trim()).filter(Boolean) : []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.preferredLocation.split(',').map(s => s.trim()).filter(Boolean).map(loc => (
                  <span 
                    key={loc} 
                    className="px-3 py-1 bg-emerald-50 text-[#059669] rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1.5 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-2xs" 
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
              className={`w-full px-4 py-2.5 sm:py-3 bg-white border ${showStep1Errors && fPreferredLocation.isRequired && !formData.preferredLocation ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'} rounded-xl text-gray-800 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] transition-all text-sm`}
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
          <div id="field-brief" className="col-span-1 sm:col-span-2">
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
              {fBrief.label} {fBrief.isRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea 
              rows="3"
              placeholder={fBrief.placeholder}
              className={`w-full px-4 py-2.5 sm:py-3 bg-white border ${showStep1Errors && fBrief.isRequired && !formData.brief ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-gray-300'} rounded-xl text-gray-800 outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] transition-all custom-scrollbar text-sm`} 
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
    const quals = formData.qualifications || [];
    if (quals.length > 0 && expandedEduIndex >= 0) {
      const result = validateEducationData(expandedEduIndex);
      if (!result.isValid) {
        setExpandedEduIndex(result.eduIdx !== undefined ? result.eduIdx : expandedEduIndex);
        setEduFieldErrors(result.errors || {});
        setEduError('Fill details');
        scrollToFirstError(result.targetFieldId);
        return;
      }
    }
    setEduError('');
    setEduFieldErrors({});
    const newIdx = quals.length;
    setExpandedEduIndex(newIdx);
    addArrayItem('qualifications', { 
      educationType: '', 
      board: '', 
      endYear: '', 
      schoolMedium: '', 
      percentage: '', 
      university: '', 
      course: '', 
      startYear: '', 
      gradingSystem: '', 
      isPrimary: newIdx === 0 
    });
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

  const handleOpenExperienceModal = (idx = -1) => {
    setEditingExpIdx(idx);
    setIsExpModalOpen(true);
    setExpError('');
  };

  const handleSaveExperienceModal = (updatedExp, idx) => {
    setFormData(prev => {
      let exps = [...(prev.experience || [])];
      const hasCurrentRole = (updatedExp.roles || []).some(role => role?.currentCompany === true);
      if (hasCurrentRole) {
        exps = exps.map((experience, experienceIndex) => {
          if (experienceIndex === idx) return experience;
          return {
            ...experience,
            noticePeriod: '',
            roles: (experience.roles || []).map(role => ({
              ...role,
              currentCompany: false,
              leavingDate: role.leavingDate || new Date().toISOString().slice(0, 7)
            }))
          };
        });
      } else {
        updatedExp = { ...updatedExp, noticePeriod: '' };
      }
      if (idx >= 0 && idx < exps.length) {
        exps[idx] = updatedExp;
      } else {
        exps.push(updatedExp);
      }
      const sorted = sortExperience(exps);
      const activeNotice = hasCurrentRole ? (updatedExp.noticePeriod || '') : (sorted.find(e => e.roles?.some(r => r.currentCompany))?.noticePeriod || '');
      const nextFormData = {
        ...prev,
        isFresher: false,
        experience: sorted,
        noticePeriod: activeNotice || prev.noticePeriod,
        professionalDetails: {
          ...(prev.professionalDetails || {}),
          noticePeriod: activeNotice || prev.professionalDetails?.noticePeriod
        }
      };
      try {
        localStorage.setItem('userProfile', JSON.stringify(nextFormData));
      } catch (_) {}
      saveToBackend(nextFormData);
      return nextFormData;
    });
    setExpError('');
    setExpFieldErrors({});
    setIsExpModalOpen(false);
    setEditingExpIdx(-1);
  };

  const handleDeleteExperienceModal = (idx) => {
    setFormData(prev => {
      let exps = [...(prev.experience || [])];
      if (idx >= 0 && idx < exps.length) {
        exps.splice(idx, 1);
      }
      const nextFormData = { ...prev, experience: exps };
      try {
        localStorage.setItem('userProfile', JSON.stringify(nextFormData));
      } catch (_) {}
      saveToBackend(nextFormData);
      return nextFormData;
    });
    setIsExpModalOpen(false);
    setEditingExpIdx(-1);
  };


  const handleOpenEducationModal = (idx = -1) => {
    setEditingEduIdx(idx);
    setIsEduModalOpen(true);
    setEduError('');
  };

  const handleSaveEducationModal = (updatedEdu, idx) => {
    setFormData(prev => {
      let quals = [...(prev.qualifications || [])];
      if (idx >= 0 && idx < quals.length) {
        quals[idx] = updatedEdu;
      } else {
        quals.push(updatedEdu);
      }

      if (updatedEdu.isPrimary) {
        quals = quals.map((q, i) => ({
          ...q,
          isPrimary: idx >= 0 ? i === idx : i === quals.length - 1
        }));
      } else if (!quals.some(q => q.isPrimary) && quals.length > 0) {
        quals[0].isPrimary = true;
      }

      const sorted = sortQualifications(quals);
      const nextFormData = { ...prev, qualifications: sorted };
      try {
        localStorage.setItem('userProfile', JSON.stringify(nextFormData));
      } catch (_) {}
      saveToBackend(nextFormData);
      return nextFormData;
    });
    setEduError('');
    setEduFieldErrors({});
    setIsEduModalOpen(false);
    setEditingEduIdx(-1);
  };

  const handleDeleteEducationModal = (idx) => {
    setFormData(prev => {
      let quals = [...(prev.qualifications || [])];
      if (idx >= 0 && idx < quals.length) {
        quals.splice(idx, 1);
      }
      if (quals.length > 0 && !quals.some(q => q.isPrimary)) {
        quals[0].isPrimary = true;
      }
      const nextFormData = { ...prev, qualifications: quals };
      try {
        localStorage.setItem('userProfile', JSON.stringify(nextFormData));
      } catch (_) {}
      saveToBackend(nextFormData);
      return nextFormData;
    });
    setIsEduModalOpen(false);
    setEditingEduIdx(-1);
  };

  const Step2Education = () => {
    const s2Title = cmsConfig?.step2?.title || 'Education';
    const s2Subtitle = cmsConfig?.step2?.subtitle || 'Details help recruiters identify your background';
    const s2AddBtn = cmsConfig?.step2?.addBtnText || '+ Add';
    const quals = formData.qualifications || [];

    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
        <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{s2Title}</h3>
            <p className="text-sm text-gray-500 mt-1">{s2Subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {eduError && (
              <span className="text-red-500 text-xs font-semibold">
                {eduError}
              </span>
            )}
            <button 
              type="button" 
              onClick={() => handleOpenEducationModal(-1)} 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#e6f6ef] hover:bg-emerald-100 text-[#047857] border border-[#bfe3d2] font-bold text-xs sm:text-sm rounded-full transition-all cursor-pointer shadow-2xs"
            >
              <span className="text-base leading-none font-bold">+</span>
              <span>{s2AddBtn}</span>
            </button>
          </div>
        </div>

        {quals.length === 0 ? (
          <div 
            onClick={() => handleOpenEducationModal(-1)}
            className="p-8 border-2 border-dashed border-gray-200 hover:border-[#059669] rounded-2xl bg-gray-50/50 hover:bg-emerald-50/30 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#e6f6ef] text-[#047857] flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-800">Add Your Education</p>
            <p className="text-xs text-gray-500 max-w-sm">
              Click here to add your degree, diploma, school, or other educational qualifications.
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEducationModal(-1);
              }}
              className="mt-2 px-5 py-2.5 bg-[#047857] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              + Add Education Details
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {quals.map((q, idx) => {
              const isSchool = q.educationType === '10th' || q.educationType === '12th';
              const title = q.course || (isSchool ? (q.educationType === '12th' ? 'Class XII' : 'Class X') : q.educationType) || 'Education';
              const institution = isSchool ? (q.board || 'Board not specified') : (q.university || 'University not specified');
              const yearsText = q.startYear && q.endYear ? `${q.startYear} – ${q.endYear}` : (q.endYear ? `Passing: ${q.endYear}` : '');

              return (
                <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-emerald-300 bg-white shadow-2xs transition-all relative group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-[15px] sm:text-base">
                          {title}
                        </h4>
                        {q.isPrimary && (
                          <span className="px-2.5 py-0.5 bg-[#e6f6ef] text-[#047857] border border-[#bfe3d2] text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm font-medium mt-1">
                        {institution}
                      </p>
                      <p className="text-gray-500 text-xs mt-1 flex items-center gap-2 flex-wrap">
                        <span>{q.educationType}</span>
                        {q.courseType && <span>• {q.courseType}</span>}
                        {yearsText && <span>• {yearsText}</span>}
                        {q.percentage && <span>• {q.gradingSystem || 'Marks'}: {q.percentage}{q.gradingSystem === 'Percentage' ? '%' : ''}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEducationModal(idx)}
                        className="p-2 text-gray-400 hover:text-[#047857] hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                        title="Edit education"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEducationModal(idx)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete education"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => handleOpenEducationModal(-1)}
              className="w-full py-3 px-4 border border-dashed border-[#bfe3d2] hover:border-[#047857] hover:bg-[#e6f6ef]/40 text-[#047857] font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <span className="text-lg leading-none font-bold">+</span>
              <span>{cmsConfig?.step2?.addAnotherBtnText || 'Add another education'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const Step3Experience = () => {
    const s3Title = cmsConfig?.step3?.title || 'Work Experience';
    const s3Subtitle = cmsConfig?.step3?.subtitle || 'Add details of your previous or current employment';
    const s3AddBtn = cmsConfig?.step3?.addBtnText || '+ Add';
    const s3FresherLabel = cmsConfig?.step3?.fresherLabel || 'Are you a Fresher?';
    const exps = formData.experience || [];

    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar pb-2">
        <div className="flex justify-between items-start mb-6 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{s3Title}</h3>
            <p className="text-sm text-gray-500 mt-1">{s3Subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {expError && (
              <span className="text-red-500 text-xs font-semibold">
                {expError}
              </span>
            )}
            {!formData.isFresher && (
              <button 
                type="button" 
                onClick={() => handleOpenExperienceModal(-1)} 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#e6f6ef] hover:bg-emerald-100 text-[#047857] border border-[#bfe3d2] font-bold text-xs sm:text-sm rounded-full transition-all cursor-pointer shadow-2xs"
              >
                <span className="text-base leading-none font-bold">+</span>
                <span>{s3AddBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Fresher vs Experience Radio */}
        <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-2">
          <label className="text-sm font-bold text-gray-800">{s3FresherLabel}</label>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center cursor-pointer group select-none">
              <input 
                type="radio" 
                name="isFresher_onboarding" 
                value="yes" 
                className="w-[18px] h-[18px] accent-[#047857] cursor-pointer" 
                checked={formData.isFresher === true} 
                onChange={() => {
                  setFormData({ ...formData, isFresher: true });
                  setExpError('');
                }} 
              />
              <span className={`ml-2.5 text-sm ${formData.isFresher === true ? 'text-gray-900 font-bold' : 'text-gray-600 font-medium'}`}>
                I am a Fresher (No Experience)
              </span>
            </label>
            <label className="flex items-center cursor-pointer group select-none">
              <input 
                type="radio" 
                name="isFresher_onboarding" 
                value="no" 
                className="w-[18px] h-[18px] accent-[#047857] cursor-pointer" 
                checked={formData.isFresher === false} 
                onChange={() => {
                  setFormData({ ...formData, isFresher: false });
                  setExpError('');
                  if ((formData.experience || []).length === 0) {
                    handleOpenExperienceModal(-1);
                  }
                }} 
              />
              <span className={`ml-2.5 text-sm ${formData.isFresher === false ? 'text-gray-900 font-bold' : 'text-gray-600 font-medium'}`}>
                I have experience
              </span>
            </label>
          </div>
        </div>

        {formData.isFresher ? (
          <div className="p-6 border border-emerald-100 bg-[#e6f6ef]/40 rounded-2xl text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#047857] mx-auto flex items-center justify-center font-bold text-lg mb-2">
              ✓
            </div>
            <p className="font-bold text-[#047857] text-sm sm:text-base">Fresher Profile Selected</p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              No work experience required. Click "Save & Continue" to proceed to skills & preferences.
            </p>
          </div>
        ) : exps.length === 0 ? (
          <div 
            onClick={() => handleOpenExperienceModal(-1)}
            className="p-8 border-2 border-dashed border-gray-200 hover:border-[#059669] rounded-2xl bg-gray-50/50 hover:bg-emerald-50/30 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-12 h-12 rounded-full bg-[#e6f6ef] text-[#047857] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-bold leading-none">+</span>
            </div>
            <p className="font-bold text-gray-800 text-sm sm:text-base">Add Your Work Experience</p>
            <p className="text-xs text-gray-500 max-w-sm">Click here to add companies, designations, employment types, and duration.</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenExperienceModal(-1);
              }}
              className="mt-2 px-5 py-2.5 bg-[#047857] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              + Add Experience Details
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {exps.map((co, cIdx) => {
              const hasCurrent = (co.roles || []).some(r => r.currentCompany);
              return (
                <div key={cIdx} className="p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-emerald-300 bg-white shadow-2xs transition-all relative group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#e6f6ef] text-[#047857] flex items-center justify-center font-bold text-base shrink-0 border border-[#bfe3d2]">
                        {(co.companyName?.[0] || 'C').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-[15px] sm:text-base">
                            {co.companyName || 'Company Name'}
                          </h4>
                          {hasCurrent && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f6ef] text-[#047857] border border-[#bfe3d2] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]"></span>
                              Current company
                            </span>
                          )}
                          {hasCurrent && co.noticePeriod && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Notice: {co.noticePeriod}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {calculateCompanyDuration(co)} {co.roles?.length ? `· ${co.roles.length} role${co.roles.length > 1 ? 's' : ''}` : ''}
                        </p>
                        {/* Roles list */}
                        <div className="mt-3 space-y-2.5 pl-3 border-l-2 border-emerald-500/40">
                          {co.roles?.map((role, rIdx) => (
                            <div key={rIdx} className="text-xs text-gray-600">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-xs sm:text-sm">{role.jobTitle || 'Role'}</span>
                                {role.currentCompany && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                    Current
                                  </span>
                                )}
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600">{role.employmentType || 'Full-time'}</span>
                              </div>
                              <p className="text-gray-500 mt-0.5">
                                {role.joiningDate ? formatMonthYear(role.joiningDate) : ''} – {role.currentCompany ? 'Present' : (role.leavingDate ? formatMonthYear(role.leavingDate) : '')}
                                {calculateRoleDuration(role.joiningDate, role.leavingDate, role.currentCompany) ? ` (${calculateRoleDuration(role.joiningDate, role.leavingDate, role.currentCompany)})` : ''}
                              </p>
                              {role.roleDescription && (
                                <p className="text-gray-600 mt-1 line-clamp-2">{role.roleDescription}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenExperienceModal(cIdx)}
                        className="p-2 text-gray-400 hover:text-[#047857] hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                        title="Edit experience"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExperienceModal(cIdx)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Delete experience"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => handleOpenExperienceModal(-1)}
              className="w-full py-3 px-4 border border-dashed border-[#bfe3d2] hover:border-[#047857] hover:bg-[#e6f6ef]/40 text-[#047857] font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              <span className="text-lg leading-none font-bold">+</span>
              <span>{cmsConfig?.step3?.addAnotherBtnText || 'Add another company experience'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="col-span-1 sm:col-span-2" id="field-linkedinUrl">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              {fLinkedin.label} {fLinkedin.isRequired && <span className="text-red-500">*</span>}
            </label>
            <input 
              type="url" 
              className={`w-full px-4 py-3 bg-white border ${showStep4Errors && fLinkedin.isRequired && !p.linkedinUrl ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-xl text-gray-700 outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 transition-all`} 
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
          
          <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div id="field-salaryType">
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
                {fSalaryType.label || 'Salary Type'} {fSalaryType.isRequired && <span className="text-red-500">*</span>}
              </label>
              <CustomDropdown
                options={[
                  { value: 'Yearly', label: 'Yearly' },
                  { value: 'Monthly', label: 'Monthly' }
                ]}
                value={p.salaryType || 'Yearly'}
                onChange={(val) => {
                  setP('salaryType', val);
                  if (showStep4Errors) setShowStep4Errors(false);
                }}
                placeholder="Select Salary Type"
                error={showStep4Errors && fSalaryType.isRequired && !p.salaryType}
              />
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
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
                {fCurrency.label || 'Currency'} {fCurrency.isRequired && <span className="text-red-500">*</span>}
              </label>
              <CustomDropdown
                options={DEFAULT_CURRENCY_OPTIONS}
                value={p.currency || 'INR'}
                onChange={(val) => {
                  setP('currency', val);
                  if (showStep4Errors) setShowStep4Errors(false);
                }}
                placeholder="Select Currency"
                error={showStep4Errors && fCurrency.isRequired && !p.currency}
              />
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

          <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div id="field-currentSalary">
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
                {currentSalaryDisplayLabel} {fCurrentSalary.isRequired && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="text" 
                className={`w-full px-4 py-2.5 sm:py-3 bg-white border ${showStep4Errors && fCurrentSalary.isRequired && !p.currentSalary ? 'border-red-500 ring-1 ring-red-500' : 'border-[#cfd7e4] hover:border-[#9fb0c8]'} rounded-xl text-gray-800 outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 transition-all text-sm`} 
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
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
                {expectedSalaryDisplayLabel} {fExpectedSalary.isRequired && <span className="text-red-500">*</span>}
              </label>
              <input 
                type="text" 
                className={`w-full px-4 py-2.5 sm:py-3 bg-white border ${showStep4Errors && fExpectedSalary.isRequired && !p.expectedSalary ? 'border-red-500 ring-1 ring-red-500' : 'border-[#cfd7e4] hover:border-[#9fb0c8]'} rounded-xl text-gray-800 outline-none focus:border-[#059669] focus:ring-4 focus:ring-[#059669]/15 transition-all text-sm`} 
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

          <div className="col-span-1 sm:col-span-2" id="field-skills">
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5">
              {fSkills.label} {fSkills.isRequired && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : []).map(skill => (
                <span key={skill} className="px-3 py-1 bg-emerald-50 text-[#047857] rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1.5 cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" onClick={() => removeSkill(skill)} title="Click to remove">
                  {skill} <span className="text-[10px]">✕</span>
                </span>
              ))}
            </div>
            <CustomDropdown
              options={(() => {
                if (Array.isArray(cmsConfig?.step4?.skillsOptions) && cmsConfig.step4.skillsOptions.length > 0) {
                  return cmsConfig.step4.skillsOptions
                    .map(opt => {
                      const str = (typeof opt === 'string' ? opt : (opt?.value || opt?.label || '')).trim();
                      return str ? { value: str, label: str } : null;
                    })
                    .filter(Boolean);
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
              const currentList = p.skills ? p.skills.split(',').map(s => s.trim()).filter(s => s) : [];
              const dynamicSuggested = getSuggestedSkills(currentList);
              const defaultPool = (Array.isArray(cmsConfig?.step4?.skillsOptions) && cmsConfig.step4.skillsOptions.length > 0)
                ? cmsConfig.step4.skillsOptions.map(s => (typeof s === 'string' ? s : (s?.label || s?.value || '')).trim()).filter(Boolean)
                : [];
              const suggested = dynamicSuggested.length > 0 
                ? dynamicSuggested 
                : defaultPool.filter(s => !currentList.some(c => c.toLowerCase() === s.toLowerCase())).slice(0, 8);

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
                        className="px-4 py-2 bg-white text-slate-700 rounded-full text-[13px] font-medium border border-[#cfd7e4] hover:border-[#059669] hover:text-[#047857] hover:bg-emerald-50 transition-all flex items-center gap-1.5 shadow-2xs"
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
    const docsMeta = formData.documentsMeta || {};
    const setDoc = (field, val, meta = null) => {
      setFormData(prev => {
        const updatedDocs = { ...(prev.documents || {}), [field]: val };
        const updatedMeta = { ...(prev.documentsMeta || {}) };
        if (!val) {
          delete updatedMeta[field];
        } else if (meta) {
          updatedMeta[field] = meta;
        }
        const extraVideoFields = field === 'introVideo'
          ? (val
              ? { isVideoApproved: false, videoApprovalStatus: 'pending', videoUploadedAt: new Date().toISOString() }
              : { isVideoApproved: false, videoApprovalStatus: 'none', videoUploadedAt: null, videoApprovedAt: null })
          : {};
        const updated = {
          ...prev,
          [field]: val || '',
          ...extraVideoFields,
          documents: updatedDocs,
          documentsMeta: updatedMeta
        };
        localStorage.setItem('userProfile', JSON.stringify(updated));
        saveToBackend(updated);
        return updated;
      });
    };

    const handleVisibilityChange = (visibility) => {
      setFormData(prev => {
        const updated = {
          ...prev,
          videoVisibility: visibility,
          documents: { ...(prev.documents || {}), videoVisibility: visibility }
        };
        localStorage.setItem('userProfile', JSON.stringify(updated));
        saveToBackend(updated);
        return updated;
      });
    };

    const handleFileUpload = async (e, type, directFile = null) => {
      let file = directFile || e?.target?.files?.[0];
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

            let resolved = false;
            const done = (dur) => {
              if (!resolved) {
                resolved = true;
                URL.revokeObjectURL(url);
                resolve(dur || 0);
              }
            };

            video.onloadedmetadata = () => done(video.duration);
            video.ondurationchange = () => {
              if (video.duration && !resolved) done(video.duration);
            };
            video.onerror = () => done(0);
            setTimeout(() => done(0), 4000);
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
            if (e?.target) e.target.value = '';
            setIsUploading(false);
            setUploadingType(null);
            return;
          }
        } catch (err) {
          console.warn('Could not read video duration metadata:', err);
        }
        } else {
          const MAX_DOC_SIZE = 300 * 1024; // 300KB
          const originalFileSize = file.originalSize || file.size;
          let wasCompressed = file.wasCompressed || false;
          let compSavings = file.savedPercent || 0;

          // Automatically attempt progressive compression on oversized document/image
          if (file.size > MAX_DOC_SIZE) {
            setIsCompressingDoc(true);
            setCompressingType(type);
            try {
              const compressed = await compressFileIfNeeded(file, MAX_DOC_SIZE);
              if (compressed && compressed.size < originalFileSize) {
                file = compressed;
                wasCompressed = true;
                compSavings = calculateSavedPercent(originalFileSize, compressed.size);
                setCompressionBadge(prev => ({
                  ...prev,
                  [type]: {
                    original: formatFileSize(originalFileSize),
                    compressed: formatFileSize(compressed.size),
                    size: formatFileSize(compressed.size),
                    saved: compSavings,
                    wasCompressed: true
                  }
                }));
              }
            } catch (cErr) {
              console.warn("Auto compression error/skipped:", cErr);
            } finally {
              setIsCompressingDoc(false);
              setCompressingType(null);
            }
          } else if (file.wasCompressed) {
            wasCompressed = true;
            compSavings = file.savedPercent || calculateSavedPercent(originalFileSize, file.size);
            setCompressionBadge(prev => ({
              ...prev,
              [type]: {
                original: formatFileSize(originalFileSize),
                compressed: formatFileSize(file.size),
                size: formatFileSize(file.size),
                saved: compSavings,
                wasCompressed: true
              }
            }));
          } else {
            // Document already within size limit (no compression needed)
            setCompressionBadge(prev => ({
              ...prev,
              [type]: {
                original: formatFileSize(originalFileSize),
                compressed: formatFileSize(file.size),
                size: formatFileSize(file.size),
                saved: 0,
                wasCompressed: false
              }
            }));
          }

          if (file.size > MAX_DOC_SIZE) {
            const fileSizeKB = (file.size / 1024).toFixed(1);
            setDocError(prev => ({
              ...prev,
              [type]: `File size (${fileSizeKB}KB) exceeds the 300KB limit even after compression. Please upload a smaller document.`
            }));
            if (e?.target) e.target.value = '';
            setIsUploading(false);
            setUploadingType(null);
            return;
          }

          try {
            const downloadURL = await uploadFileToStorage(file, 'resumes');
            const meta = {
              name: file.name,
              size: formatFileSize(file.size),
              rawSize: file.size,
              wasCompressed: wasCompressed || originalFileSize > file.size,
              originalSize: formatFileSize(originalFileSize),
              compressedSize: formatFileSize(file.size),
              savedPercent: compSavings || calculateSavedPercent(originalFileSize, file.size)
            };
            setDoc(type, downloadURL, meta);
            if (showStep5Errors) setShowStep5Errors(false);
          } catch (error) {
            console.error("Upload error:", error);
            setDocError(prev => ({...prev, [type]: 'Failed to upload file. Please try again.'}));
          } finally {
            setIsUploading(false);
            setUploadingType(null);
            if (e?.target) e.target.value = '';
          }
          return;
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
          }
        } catch (error) {
          console.error("Upload error:", error);
          setDocError(prev => ({...prev, [type]: 'Failed to upload file. Please try again.'}));
        } finally {
          setIsUploading(false);
          setUploadingType(null);
          if (e?.target) e.target.value = '';
        }
      };

      const openCompressorModal = (type) => {
        setCompressorTargetField(type);
        setIsCompressorModalOpen(true);
      };

      const handleApplyCompressedFromModal = (compressedFile, type) => {
        if (compressedFile) {
          handleFileUpload(null, type, compressedFile);
        }
      };

      const handleOpenPreview = (type) => {
        const url = docs[type];
        if (!url) return;
        const meta = docsMeta[type];
        const name = meta?.name || (type === 'resume' ? 'Resume Document' : 'Cover Letter Document');
        setPreviewDocData({
          url,
          name,
          meta
        });
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

              {!docs.resume && (
                <>
                  <div>
                    <input 
                      ref={resumeFileRef}
                      type="file" 
                      disabled={isUploading} 
                      accept=".pdf,.doc,.docx" 
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50 transition-all"
                      onChange={e => handleFileUpload(e, 'resume')} 
                    />
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    {fResume.placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}
                  </p>
                </>
              )}

              {docs.resume && (
                <input 
                  ref={resumeFileRef}
                  type="file" 
                  disabled={isUploading} 
                  accept=".pdf,.doc,.docx" 
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'resume')} 
                />
              )}

              {isCompressingDoc && compressingType === 'resume' && (
                <div className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 animate-pulse">
                  <svg className="animate-spin w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>⚡ Compressing & optimizing {fResume.label || 'Resume'} to fit under 300KB...</span>
                </div>
              )}

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
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-xs space-y-3">
                  {/* File info row */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200 shadow-xs">
                        {(docsMeta?.resume?.name || '').toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate" title={docsMeta?.resume?.name || getFileName(docs.resume)}>
                          {docsMeta?.resume?.name || getFileName(docs.resume)}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold whitespace-nowrap">
                            ✓ Attached &amp; Ready
                          </span>
                          {(() => {
                            const meta = docsMeta?.resume;
                            const badge = compressionBadge.resume;
                            const isComp = meta?.wasCompressed || badge?.wasCompressed || (meta?.savedPercent && meta.savedPercent > 0) || (badge?.saved && badge.saved > 0);
                            const sizeStr = meta?.compressedSize || badge?.compressed || meta?.size || badge?.size || (meta?.rawSize ? formatFileSize(meta.rawSize) : null);
                            const savedStr = meta?.savedPercent || badge?.saved;

                            return (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300 whitespace-nowrap">
                                ⚡ {sizeStr || '300 KB'} {isComp && savedStr ? `(${savedStr}% saved)` : ''}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDoc('resume', null)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove resume"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100/90">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview('resume')}
                      className="inline-flex items-center justify-center gap-1 px-1.5 py-2 text-xs font-bold text-emerald-800 bg-white rounded-xl border border-emerald-300 hover:bg-emerald-50 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => resumeFileRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1 px-1.5 py-2 text-xs font-bold text-gray-700 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Replace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDoc('resume', null)}
                      className="inline-flex items-center justify-center gap-1 px-1.5 py-2 text-xs font-bold text-red-600 bg-white rounded-xl border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cover Letter Upload Card */}
            <div id="field-coverLetter" className={`p-5 border ${showStep5Errors && fCoverLetter.isRequired && !docs.coverLetter ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'} rounded-2xl bg-white shadow-2xs space-y-3 transition-all`}>
              <label className="flex items-center text-sm font-bold text-gray-900">
                <span>{fCoverLetter.label || 'Upload Cover Letter'}</span>
                {fCoverLetter.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>

              {!docs.coverLetter && (
                <>
                  <div>
                    <input 
                      ref={coverLetterFileRef}
                      type="file" 
                      disabled={isUploading} 
                      accept=".pdf,.doc,.docx" 
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer disabled:opacity-50 transition-all"
                      onChange={e => handleFileUpload(e, 'coverLetter')} 
                    />
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    {fCoverLetter.placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}
                  </p>
                </>
              )}

              {docs.coverLetter && (
                <input 
                  ref={coverLetterFileRef}
                  type="file" 
                  disabled={isUploading} 
                  accept=".pdf,.doc,.docx" 
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'coverLetter')} 
                />
              )}

              {isCompressingDoc && compressingType === 'coverLetter' && (
                <div className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 animate-pulse">
                  <svg className="animate-spin w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>⚡ Compressing & optimizing {fCoverLetter.label || 'Cover Letter'} to fit under 300KB...</span>
                </div>
              )}

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
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-xs space-y-3">
                  {/* File info row */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200 shadow-xs">
                        {(docsMeta?.coverLetter?.name || '').toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate" title={docsMeta?.coverLetter?.name || getFileName(docs.coverLetter)}>
                          {docsMeta?.coverLetter?.name || getFileName(docs.coverLetter)}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold whitespace-nowrap">
                            ✓ Attached &amp; Ready
                          </span>
                          {(() => {
                            const meta = docsMeta?.coverLetter;
                            const badge = compressionBadge.coverLetter;
                            const isComp = meta?.wasCompressed || badge?.wasCompressed || (meta?.savedPercent && meta.savedPercent > 0) || (badge?.saved && badge.saved > 0);
                            const sizeStr = meta?.compressedSize || badge?.compressed || meta?.size || badge?.size || (meta?.rawSize ? formatFileSize(meta.rawSize) : null);
                            const savedStr = meta?.savedPercent || badge?.saved;

                            return (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300 whitespace-nowrap">
                                ⚡ {sizeStr || '< 300 KB'} {isComp && savedStr ? `(${savedStr}% saved)` : ''}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDoc('coverLetter', null)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove cover letter"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100/90">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview('coverLetter')}
                      className="inline-flex items-center justify-center gap-1 px-1.5 py-2 text-xs font-bold text-emerald-800 bg-white rounded-xl border border-emerald-300 hover:bg-emerald-50 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => coverLetterFileRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1 px-1.5 py-2 text-xs font-bold text-gray-700 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Replace</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDoc('coverLetter', null)}
                      className="inline-flex items-center justify-center gap-1 px-1.5 py-2 text-xs font-bold text-red-600 bg-white rounded-xl border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3: Introductory Video Card */}
          <div id="field-introVideo" className={`p-3.5 sm:p-6 border ${showStep5Errors && fIntroVideo.isRequired && !docs.introVideo ? 'border-red-500 ring-1 ring-red-500' : 'border-emerald-200'} rounded-2xl bg-white shadow-2xs space-y-4 transition-all`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  {videoSectionTitle} {fIntroVideo.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
                <p className="text-xs text-gray-500 mt-0.5">{videoSectionSubtitle}</p>
              </div>
              {!docs.introVideo && (
                <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-gray-200 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setVideoMode('upload')}
                    className={`flex-1 sm:flex-initial text-center px-4 py-2 sm:py-1 rounded-lg transition-all ${videoMode === 'upload' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {uploadTabLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('link')}
                    className={`flex-1 sm:flex-initial text-center px-4 py-2 sm:py-1 rounded-lg transition-all ${videoMode === 'link' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {linkTabLabel}
                  </button>
                </div>
              )}
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
                    className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#059669] font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAttachVideoLink}
                    className="px-4 py-2 bg-[#047857] text-white text-xs font-bold rounded-lg hover:bg-[#059669] transition-colors shadow-xs flex-shrink-0 cursor-pointer"
                  >
                    {linkAttachButtonText}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">{linkHelpText}</p>
              </div>
            )}

            {docError.introVideo && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs shadow-xs">
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
                  className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            {docs.introVideo && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between gap-2.5 pb-0.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Video Attached</span>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-xs shrink-0 ${
                      (formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {(formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone' ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>Visible to All Employers</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          <span>Applied Job Only</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDoc('introVideo', null);
                      setVideoLink('');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/90 px-2.5 py-1 rounded-lg border border-red-200 transition-colors cursor-pointer shrink-0"
                    title="Remove attached video"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Remove Video</span>
                  </button>
                </div>

                <div className="w-full rounded-2xl overflow-hidden shadow-xs border border-gray-100 bg-black">
                  <VideoPlayer url={docs.introVideo} />
                </div>

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
                        <p className="text-xs font-bold text-gray-900">Share to everyone</p>
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
                        <p className="text-xs font-bold text-gray-900">Share to applied jobs</p>
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

        <FileCompressorModal
          isOpen={isCompressorModalOpen}
          onClose={() => setIsCompressorModalOpen(false)}
          targetField={compressorTargetField}
          onApplyCompressedFile={handleApplyCompressedFromModal}
        />

        <DocumentPreviewModal
          isOpen={!!previewDocData}
          onClose={() => setPreviewDocData(null)}
          docUrl={previewDocData?.url}
          docName={previewDocData?.name}
          docMeta={previewDocData?.meta}
        />
      </div>
    );
  };

  const Step6Review = () => {
    const s6Title = cmsConfig?.step6?.title || 'Final Review';
    const s6Subtitle = cmsConfig?.step6?.subtitle || 'Please review all the details you filled in before submitting.';
    const p = formData.professionalDetails || {};

    return (
      <div className="space-y-6 animate-fade-in pr-2 custom-scrollbar text-sm bg-emerald-50/30 p-4 sm:p-6 rounded-2xl border border-emerald-100">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-[#047857] mb-2">{s6Title}</h3>
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
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-600 w-32">Intro Video:</span> 
              {formData.documents?.introVideo ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={formData.documents.introVideo} target="_blank" rel="noreferrer" className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
                    📹 Introductory Video Attached (Click to watch)
                  </a>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {(formData.videoVisibility || formData.documents?.videoVisibility || 'everyone') === 'everyone' ? 'Visible to All Employers' : 'Applied Job Only'}
                  </span>
                </div>
              ) : <span className="text-gray-400 italic">None</span>}
            </div>
          </div>
        </div>

        {/* Privacy & Directory Visibility Settings */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Privacy & Directory Visibility</h4>
                <p className="text-xs text-gray-500">Control your visibility in the recruiter candidate directory</p>
              </div>
            </div>
            {formData.isProfilePrivate ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                🔒 Private (Hidden)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Public (Visible)
              </span>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">Hide Profile from Candidate Directory (Private Mode)</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Your profile details will be private. Only employers of jobs you have applied to will be able to view your profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !formData.isProfilePrivate;
                setFormData(prev => ({ ...prev, isProfilePrivate: nextVal }));
                try {
                  const saved = localStorage.getItem('userProfile');
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    parsed.isProfilePrivate = nextVal;
                    localStorage.setItem('userProfile', JSON.stringify(parsed));
                  }
                } catch (_) {}
              }}
              aria-label="Toggle profile privacy"
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                formData.isProfilePrivate ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.isProfilePrivate ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div 
              onClick={() => {
                setFormData(prev => ({ ...prev, isProfilePrivate: false }));
                try {
                  const saved = localStorage.getItem('userProfile');
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    parsed.isProfilePrivate = false;
                    localStorage.setItem('userProfile', JSON.stringify(parsed));
                  }
                } catch (_) {}
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${!formData.isProfilePrivate ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/40' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                When Public
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Verified recruiters and company employers can discover your profile when searching for candidates matching your skills, experience, and designation.
              </p>
            </div>

            <div 
              onClick={() => {
                setFormData(prev => ({ ...prev, isProfilePrivate: true }));
                try {
                  const saved = localStorage.getItem('userProfile');
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    parsed.isProfilePrivate = true;
                    localStorage.setItem('userProfile', JSON.stringify(parsed));
                  }
                } catch (_) {}
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${formData.isProfilePrivate ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/40' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                When Private Mode is Enabled (Default)
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your profile is completely hidden from recruiter search lists. Only employers of jobs you personally submit an application to will be able to see your details.
              </p>
            </div>
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
    <div className="min-h-screen sj-profile sj-theme flex items-center justify-center p-0 sm:p-4 md:p-8 font-['DM_Sans',sans-serif] bg-[#f3f5fa] text-[#101828]">
      <div className="w-full max-w-4xl h-screen sm:h-[90vh] sm:max-h-[920px] bg-white rounded-none sm:rounded-[28px] shadow-[0_20px_50px_-15px_rgba(16,24,40,0.12)] flex flex-col overflow-hidden animate-fade-in border-0 sm:border sm:border-[#e3e8f0]">
        
        {/* Header & Progress */}
        <div className="pt-5 sm:pt-7 pb-4 sm:pb-5 px-5 sm:px-8 border-b border-[#e3e8f0] flex-shrink-0 bg-white z-10 shadow-2xs">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight flex items-center gap-2.5">
              <span className="w-2.5 h-6 rounded-full bg-[#047857]"></span>
              {headerTitle}
            </h2>
          </div>
          
          <div className="relative pt-1">
            <div className="flex mb-2.5 items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold inline-flex items-center gap-1.5 py-1 px-3 uppercase rounded-full text-[#047857] bg-[#e6f6ef] border border-[#bfe3d2] tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#047857] animate-pulse"></span>
                  {Math.round((currentStep / totalSteps) * 100)}% COMPLETED
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 sm:h-2.5 text-xs flex rounded-full bg-[#e3e8f0]">
              <div style={{ width: `${(currentStep / totalSteps) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-[#047857] to-[#059669] transition-all duration-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col bg-[#f8fafc]/60">
          <form id="onboardingForm" onSubmit={handleSubmit} className="flex flex-col flex-1 max-w-3xl w-full mx-auto">
            <div className="flex-1 bg-white p-5 sm:p-7 md:p-8 rounded-2xl shadow-xs border border-[#e3e8f0]">
              {currentStep === 1 && Step1BasicDetails()}
              {currentStep === 2 && Step2Education()}
              {currentStep === 3 && Step3Experience()}
              {currentStep === 4 && Step4Professional()}
              {currentStep === 5 && Step5Documents()}
              {currentStep === 6 && Step6Review()}
            </div>

            {/* Footer Actions */}
            <div className="mt-5 sm:mt-7 mb-3 flex flex-col sm:flex-row-reverse gap-3 sm:gap-4 justify-between max-w-3xl w-full mx-auto">
              {currentStep < totalSteps ? (
                <button 
                  key="onboarding-next-btn"
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="w-full sm:w-auto px-8 sm:px-10 py-3.5 bg-[#047857] hover:bg-[#059669] active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-emerald-900/15 transition-all cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <span>{nextBtnText}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
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
                  className={`w-full sm:w-auto px-8 sm:px-10 py-3.5 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2 ${isSubmitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-[#047857] hover:bg-[#059669] shadow-emerald-900/15 active:scale-[0.98]'}`}
                >
                  <span>{isSubmitting ? 'Saving...' : submitBtnText}</span>
                  {!isSubmitting && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
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
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-[#e3e8f0] transition-colors cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  <span>{backBtnText}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {/* Education Modal popup matching Employee Profile */}
      <EducationModal
        isOpen={isEduModalOpen}
        onClose={() => {
          setIsEduModalOpen(false);
          setEditingEduIdx(-1);
        }}
        initialData={editingEduIdx >= 0 ? (formData.qualifications || [])[editingEduIdx] : null}
        editIndex={editingEduIdx}
        onSave={handleSaveEducationModal}
        onDelete={handleDeleteEducationModal}
        cmsConfig={cmsConfig}
      />
      {/* Experience Modal popup matching Employee Profile */}
      <ExperienceModal
        isOpen={isExpModalOpen}
        onClose={() => {
          setIsExpModalOpen(false);
          setEditingExpIdx(-1);
        }}
        initialData={editingExpIdx >= 0 ? (formData.experience || [])[editingExpIdx] : null}
        editIndex={editingExpIdx}
        onSave={handleSaveExperienceModal}
        onDelete={handleDeleteExperienceModal}
        cmsConfig={cmsConfig}
      />
    </div>
  );
};


export default EmployeeOnboarding;
