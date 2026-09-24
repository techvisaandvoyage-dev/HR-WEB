// Comprehensive dataset of Indian Central, State, and International School Boards & UGC / AISHE Courses

const SCHOOL_BOARDS = [
  // Central & National Boards
  { code: 'CBSE', name: 'CBSE (Central Board of Secondary Education)', state: 'Central / National', type: 'Central' },
  { code: 'ICSE_ISC', name: 'CISCE (ICSE / ISC - Council for Indian School Certificate Examinations)', state: 'Central / National', type: 'Central' },
  { code: 'NIOS', name: 'NIOS (National Institute of Open Schooling)', state: 'Central / National', type: 'Open School' },
  { code: 'IB', name: 'IB (International Baccalaureate)', state: 'International', type: 'International' },
  { code: 'CAMBRIDGE', name: 'Cambridge Assessment (IGCSE / A-Levels)', state: 'International', type: 'International' },

  // State Boards (Alphabetical by State)
  { code: 'AP_BSE', name: 'Andhra Pradesh Board of Secondary Education (BSEAP)', state: 'Andhra Pradesh', type: 'State' },
  { code: 'AP_BIE', name: 'Andhra Pradesh Board of Intermediate Education (BIEAP)', state: 'Andhra Pradesh', type: 'State' },
  { code: 'AR_BSE', name: 'Arunachal Pradesh State Board', state: 'Arunachal Pradesh', type: 'State' },
  { code: 'AS_SEBA', name: 'Assam Board of Secondary Education (SEBA)', state: 'Assam', type: 'State' },
  { code: 'AS_AHSEC', name: 'Assam Higher Secondary Education Council (AHSEC)', state: 'Assam', type: 'State' },
  { code: 'BR_BSEB', name: 'Bihar School Examination Board (BSEB)', state: 'Bihar', type: 'State' },
  { code: 'CG_CGBSE', name: 'Chhattisgarh Board of Secondary Education (CGBSE)', state: 'Chhattisgarh', type: 'State' },
  { code: 'DL_DBSE', name: 'Delhi Board of School Education (DBSE)', state: 'Delhi', type: 'State' },
  { code: 'GA_GBSHSE', name: 'Goa Board of Secondary and Higher Secondary Education (GBSHSE)', state: 'Goa', type: 'State' },
  { code: 'GJ_GSEB', name: 'Gujarat Secondary and Higher Secondary Education Board (GSEB)', state: 'Gujarat', type: 'State' },
  { code: 'HR_BSEH', name: 'Haryana Board of School Education (HBSE / BSEH)', state: 'Haryana', type: 'State' },
  { code: 'HP_HPBOSE', name: 'Himachal Pradesh Board of School Education (HPBOSE)', state: 'Himachal Pradesh', type: 'State' },
  { code: 'JK_JKBOSE', name: 'Jammu & Kashmir Board of School Education (JKBOSE)', state: 'Jammu & Kashmir', type: 'State' },
  { code: 'JH_JAC', name: 'Jharkhand Academic Council (JAC)', state: 'Jharkhand', type: 'State' },
  { code: 'KA_KSEEB', name: 'Karnataka Secondary Education Examination Board (KSEEB / KSEAB)', state: 'Karnataka', type: 'State' },
  { code: 'KA_DPUE', name: 'Karnataka Department of Pre-University Education (DPUE / PUC)', state: 'Karnataka', type: 'State' },
  { code: 'KL_KBPE', name: 'Kerala Board of Public Examinations (KBPE / SSLC)', state: 'Kerala', type: 'State' },
  { code: 'KL_DHSE', name: 'Kerala Directorate of Higher Secondary Education (DHSE Kerala)', state: 'Kerala', type: 'State' },
  { code: 'MP_MPBSE', name: 'Madhya Pradesh Board of Secondary Education (MPBSE)', state: 'Madhya Pradesh', type: 'State' },
  { code: 'MH_MSBSHSE', name: 'Maharashtra State Board of Secondary and Higher Secondary Education (MSBSHSE)', state: 'Maharashtra', type: 'State' },
  { code: 'MN_BOSEM', name: 'Manipur Board of Secondary Education (BOSEM)', state: 'Manipur', type: 'State' },
  { code: 'MN_COHSEM', name: 'Manipur Council of Higher Secondary Education (COHSEM)', state: 'Manipur', type: 'State' },
  { code: 'ML_MBOSE', name: 'Meghalaya Board of School Education (MBOSE)', state: 'Meghalaya', type: 'State' },
  { code: 'MZ_MBSE', name: 'Mizoram Board of School Education (MBSE)', state: 'Mizoram', type: 'State' },
  { code: 'NL_NBSE', name: 'Nagaland Board of School Education (NBSE)', state: 'Nagaland', type: 'State' },
  { code: 'OR_BSE', name: 'Odisha Board of Secondary Education (BSE Odisha)', state: 'Odisha', type: 'State' },
  { code: 'OR_CHSE', name: 'Odisha Council of Higher Secondary Education (CHSE Odisha)', state: 'Odisha', type: 'State' },
  { code: 'PB_PSEB', name: 'Punjab School Education Board (PSEB)', state: 'Punjab', type: 'State' },
  { code: 'RJ_RBSE', name: 'Rajasthan Board of Secondary Education (RBSE / BSER)', state: 'Rajasthan', type: 'State' },
  { code: 'SK_SBSE', name: 'Sikkim Board of Secondary Education', state: 'Sikkim', type: 'State' },
  { code: 'TN_TNDGE', name: 'Tamil Nadu Directorate of Government Examinations (TNDGE / State Board)', state: 'Tamil Nadu', type: 'State' },
  { code: 'TS_BSE', name: 'Telangana Board of Secondary Education (BSE Telangana)', state: 'Telangana', type: 'State' },
  { code: 'TS_BIE', name: 'Telangana State Board of Intermediate Education (TSBIE)', state: 'Telangana', type: 'State' },
  { code: 'TR_TBSE', name: 'Tripura Board of Secondary Education (TBSE)', state: 'Tripura', type: 'State' },
  { code: 'UP_UPMSP', name: 'Uttar Pradesh Madhyamik Shiksha Parishad (UPMSP / UP Board)', state: 'Uttar Pradesh', type: 'State' },
  { code: 'UK_UBSE', name: 'Uttarakhand Board of School Education (UBSE)', state: 'Uttarakhand', type: 'State' },
  { code: 'WB_WBBSE', name: 'West Bengal Board of Secondary Education (WBBSE - Madhyamik)', state: 'West Bengal', type: 'State' },
  { code: 'WB_WBCHSE', name: 'West Bengal Council of Higher Secondary Education (WBCHSE - HS)', state: 'West Bengal', type: 'State' },
  { code: 'OTHER', name: 'Other Recognized State / National Board', state: 'Other', type: 'Other' }
];

const UGC_COURSES = {
  graduation: [
    { name: 'B.Tech / B.E. (Bachelor of Technology / Engineering)', stream: 'Engineering & Technology' },
    { name: 'B.Com (Bachelor of Commerce - General / Honours)', stream: 'Commerce & Accounting' },
    { name: 'B.Com in Accounting and Finance (BAF)', stream: 'Commerce & Accounting' },
    { name: 'B.Com in Banking and Insurance (BBI)', stream: 'Commerce & Accounting' },
    { name: 'B.Com in Financial Markets (BFM)', stream: 'Commerce & Accounting' },
    { name: 'B.Sc (Bachelor of Science)', stream: 'Sciences' },
    { name: 'B.Sc in Computer Science / Information Technology (IT)', stream: 'Computer Applications & IT' },
    { name: 'BCA (Bachelor of Computer Applications)', stream: 'Computer Applications & IT' },
    { name: 'BBA (Bachelor of Business Administration)', stream: 'Management & Business' },
    { name: 'BMS (Bachelor of Management Studies)', stream: 'Management & Business' },
    { name: 'B.A (Bachelor of Arts)', stream: 'Humanities & Social Sciences' },
    { name: 'B.A in Economics', stream: 'Humanities & Social Sciences' },
    { name: 'LLB (Bachelor of Legislative Law - 3 Years)', stream: 'Law' },
    { name: 'Integrated B.A. LL.B / B.Com. LL.B / BBA. LL.B', stream: 'Law' },
    { name: 'B.Pharm (Bachelor of Pharmacy)', stream: 'Pharmacy & Healthcare' },
    { name: 'MBBS (Bachelor of Medicine, Bachelor of Surgery)', stream: 'Medical & Dental' },
    { name: 'BDS (Bachelor of Dental Surgery)', stream: 'Medical & Dental' },
    { name: 'B.Des (Bachelor of Design)', stream: 'Design & Media' },
    { name: 'B.Arch (Bachelor of Architecture)', stream: 'Architecture & Planning' },
    { name: 'B.Ed (Bachelor of Education)', stream: 'Education & Teaching' },
    { name: 'BHM / B.Sc in Hospitality & Hotel Management', stream: 'Hospitality & Tourism' },
    { name: 'B.Voc (Bachelor of Vocation)', stream: 'Vocational & Applied' },
    { name: 'Other Bachelor / Undergraduate Degree', stream: 'Other' }
  ],

  masters: [
    { name: 'MBA (Master of Business Administration - Finance, Mkt, HR, Ops)', stream: 'Management & Business' },
    { name: 'PGDM (Post Graduate Diploma in Management)', stream: 'Management & Business' },
    { name: 'M.Com (Master of Commerce - Accounting, Finance)', stream: 'Commerce & Accounting' },
    { name: 'M.Tech / M.E. (Master of Technology / Engineering)', stream: 'Engineering & Technology' },
    { name: 'MCA (Master of Computer Applications)', stream: 'Computer Applications & IT' },
    { name: 'M.Sc (Master of Science)', stream: 'Sciences' },
    { name: 'M.Sc in Computer Science / Data Science / IT', stream: 'Computer Applications & IT' },
    { name: 'M.A (Master of Arts)', stream: 'Humanities & Social Sciences' },
    { name: 'M.A in Economics / Econometrics', stream: 'Humanities & Social Sciences' },
    { name: 'LLM (Master of Laws)', stream: 'Law' },
    { name: 'M.Pharm (Master of Pharmacy)', stream: 'Pharmacy & Healthcare' },
    { name: 'MD / MS (Doctor of Medicine / Master of Surgery)', stream: 'Medical & Healthcare' },
    { name: 'M.Des (Master of Design)', stream: 'Design & Media' },
    { name: 'M.Arch (Master of Architecture)', stream: 'Architecture & Planning' },
    { name: 'M.Ed (Master of Education)', stream: 'Education & Teaching' },
    { name: 'Other Master / Post Graduate Degree', stream: 'Other' }
  ],

  doctorate: [
    { name: 'Ph.D. (Doctor of Philosophy)', stream: 'Research & Doctorate' },
    { name: 'Ph.D. in Commerce & Management', stream: 'Commerce & Management' },
    { name: 'Ph.D. in Engineering & Technology', stream: 'Engineering & Technology' },
    { name: 'Ph.D. in Computer Science & IT', stream: 'Computer Applications & IT' },
    { name: 'Ph.D. in Economics', stream: 'Humanities & Economics' },
    { name: 'Ph.D. in Science', stream: 'Sciences' },
    { name: 'Fellow Programme in Management (FPM - IIM)', stream: 'Management & Business' },
    { name: 'Post-Doctoral Fellowship (PDF)', stream: 'Research & Doctorate' },
    { name: 'Other Doctorate / Research Degree', stream: 'Other' }
  ],

  professional: [
    { name: 'CA (Chartered Accountant - ICAI)', stream: 'Chartered Accounting' },
    { name: 'CS (Company Secretary - ICSI)', stream: 'Corporate Governance & Law' },
    { name: 'CMA / ICWA (Cost and Management Accountant - ICMAI)', stream: 'Cost & Management Accounting' },
    { name: 'CPA (Certified Public Accountant - AICPA / US)', stream: 'International Accounting' },
    { name: 'ACCA (Association of Chartered Certified Accountants - UK)', stream: 'International Accounting' },
    { name: 'CFA (Chartered Financial Analyst - CFA Institute)', stream: 'Finance & Investment' },
    { name: 'FRM (Financial Risk Manager - GARP)', stream: 'Finance & Risk' },
    { name: 'CIMA (Chartered Institute of Management Accountants - UK)', stream: 'International Accounting' },
    { name: 'CIA (Certified Internal Auditor - IIA)', stream: 'Audit & Compliance' },
    { name: 'CFP (Certified Financial Planner)', stream: 'Financial Planning' },
    { name: 'CISA (Certified Information Systems Auditor - ISACA)', stream: 'Information Systems Audit' }
  ],

  diploma: [
    { name: 'Polytechnic / Engineering Diploma', stream: 'Technical & Engineering' },
    { name: 'Diploma in Accounting & Taxation (DAT)', stream: 'Commerce & Accounting' },
    { name: 'Diploma in Financial Accounting', stream: 'Commerce & Accounting' },
    { name: 'Diploma in Banking and Finance', stream: 'Banking & Finance' },
    { name: 'Diploma in Computer Applications (DCA)', stream: 'Computer Applications & IT' },
    { name: 'PGDCA (Post Graduate Diploma in Computer Applications)', stream: 'Computer Applications & IT' },
    { name: 'Diploma in Digital Marketing', stream: 'Marketing & Digital Media' },
    { name: 'Diploma in Human Resource Management (DHRM)', stream: 'Management & HR' },
    { name: 'Diploma in Business Management (DBM)', stream: 'Management & Business' },
    { name: 'ITI Certification (Industrial Training Institute)', stream: 'Vocational & Technical' },
    { name: 'Other Recognized Diploma / Certification', stream: 'Other' }
  ]
};

module.exports = {
  SCHOOL_BOARDS,
  UGC_COURSES
};
