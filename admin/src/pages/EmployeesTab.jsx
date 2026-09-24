import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  LogIn,
  ShieldCheck,
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  LayoutDashboard,
  ToggleLeft,
  ToggleRight,
  Lock,
  UserCheck,
  GraduationCap,
  Briefcase,
  Award,
  FileUp,
  CheckSquare,
  Plus,
  Trash2,
  Tag,
  RotateCcw,
  Layers,
  FolderPlus,
  SlidersHorizontal,
  GripVertical,
  X,
  Pencil,
  Check,
  MapPin,
  Search,
  Building2,
  Shield,
  BookOpen,
  School,
  Video,
  Calendar
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DEFAULT_FUNCTIONS_DATA = {
  'IT & Software': [
    "Software Engineer", "Senior Software Engineer", "Frontend Developer", "Backend Developer", 
    "Full Stack Developer", "Mobile App Developer", "DevOps Engineer", "Data Scientist", 
    "Data Analyst", "Machine Learning Engineer", "UI/UX Designer", "QA Engineer / Tester", 
    "Cloud Architect", "System Administrator", "Cybersecurity Analyst", "Technical Lead"
  ],
  'Finance & Accounts': [
    "Accountant", "Senior Accountant", "Financial Analyst", "Finance Manager", 
    "Auditor", "Tax Consultant", "Investment Banker", "Chartered Accountant (CA)"
  ],
  'Healthcare': [
    "Doctor", "Nurse", "Pharmacist", "Medical Representative", 
    "Healthcare Administrator", "Lab Technician", "Physiotherapist", "Medical Coder"
  ],
  'Manufacturing': [
    "Production Engineer", "Quality Analyst", "Plant Manager", "Maintenance Engineer", 
    "Supply Chain Manager", "Safety Officer", "Mechanical Engineer"
  ],
  'Marketing': [
    "Marketing Executive", "Digital Marketer", "Marketing Manager", 
    "SEO Specialist", "Content Writer", "Social Media Manager", "Brand Manager"
  ],
  'Sales': [
    "Sales Executive", "Sales Manager", "Business Development Executive", 
    "Business Development Manager", "Account Manager", "Area Sales Manager", "Retail Store Manager"
  ],
  'HR': [
    "HR Executive", "HR Manager", "Recruiter", "Talent Acquisition Specialist", 
    "Payroll Executive", "Training & Development Manager", "HR Generalist"
  ],
  'Other': [
    "Product Manager", "Project Manager", "Business Analyst", "Operations Manager"
  ]
};

export const DEFAULT_EXPERIENCE_OPTIONS = [
  '0 - 1 Yrs',
  '2 - 3 Yrs',
  '4 - 6 Yrs',
  '7 - 10 Yrs',
  '11 - 15 Yrs',
  '16 - 20 Yrs',
  '21 - 25 Yrs',
  '25+ yrs'
];

export const DEFAULT_LOCATION_CITIES = [
  'Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad',
  'Gurgaon/Gurugram', 'Noida', 'Navi Mumbai', 'Chandigarh', 'Jaipur', 'Indore', 'Surat',
  'Cochin/Kochi', 'Lucknow', 'Bhopal', 'Visakhapatnam/Vizag', 'Nagpur', 'Patna', 'Vadodara/Baroda',
  'Coimbatore', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Varanasi/Banaras',
  'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad/Prayagraj', 'Ranchi', 'Howrah',
  'Gwalior', 'Jabalpur', 'Vijayawada', 'Jodhpur', 'Raipur', 'Kota', 'Guwahati',
  'Thane', 'Trivandrum/Thiruvananthapuram', 'Mangalore', 'Mysore', 'Bhubaneshwar', 'Dehradun',
  'Goa', 'Remote', 'Dubai', 'Singapore', 'Abu Dhabi', 'London', 'USA'
];

export const DEFAULT_SCHOOL_BOARDS = [
  'CBSE (Central Board of Secondary Education)',
  'ICSE / ISC (Council for the Indian School Certificate Examinations)',
  'NIOS (National Institute of Open Schooling)',
  'IB (International Baccalaureate)',
  'Cambridge International (IGCSE / A-Levels)',
  'UP Board (UPMSP - Uttar Pradesh)',
  'Bihar Board (BSEB - Bihar)',
  'Maharashtra Board (MSBSHSE - Maharashtra)',
  'Rajasthan Board (RBSE / BSER - Rajasthan)',
  'MP Board (MPBSE - Madhya Pradesh)',
  'Gujarat Board (GSEB - Gujarat)',
  'Haryana Board (HBSE / BSEH - Haryana)',
  'Delhi Board (DBSE - Delhi)',
  'Jharkhand Board (JAC - Jharkhand)',
  'Karnataka Board (KSEEB / KSEAB - Karnataka)',
  'Punjab Board (PSEB - Punjab)',
  'West Bengal Board (WBBSE / WBCHSE - West Bengal)',
  'Tamil Nadu Board (TNDGE - Tamil Nadu)',
  'Telangana Board (TSBIE / BSE - Telangana)',
  'Andhra Pradesh Board (BSEAP / BIEAP - Andhra Pradesh)',
  'Kerala Board (KBPE / DHSE - Kerala)',
  'Odisha Board (BSE / CHSE - Odisha)',
  'Assam Board (SEBA / AHSEC - Assam)',
  'Chhattisgarh Board (CGBSE - Chhattisgarh)',
  'Himachal Pradesh Board (HPBOSE - Himachal Pradesh)',
  'Jammu & Kashmir Board (JKBOSE - J&K)',
  'Uttarakhand Board (UBSE - Uttarakhand)',
  'Goa Board (GBSHSE - Goa)',
  'Manipur Board (BOSEM / COHSEM - Manipur)',
  'Meghalaya Board (MBOSE - Meghalaya)',
  'Mizoram Board (MBSE - Mizoram)',
  'Nagaland Board (NBSE - Nagaland)',
  'Tripura Board (TBSE - Tripura)',
  'Arunachal Pradesh State Board',
  'Sikkim State Board',
  'Other State Board',
  'Other Board'
];

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
    options: [...DEFAULT_SCHOOL_BOARDS]
  },
  '12th': {
    category: 'school',
    options: [...DEFAULT_SCHOOL_BOARDS]
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

export const DEFAULT_EDUCATION_TYPES = Object.keys(DEFAULT_EDUCATION_DATA);

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

export const DEFAULT_SKILLS_OPTIONS = [
  '3D Modeling', 'ASP.NET', 'AWS', 'Account Management', 'Accounting', 'Adobe After Effects',
  'Adobe Illustrator', 'Adobe InDesign', 'Adobe Lightroom', 'Adobe Photoshop', 'Adobe Premiere Pro',
  'Adobe XD', 'Agile', 'Alpine.js', 'Android Development', 'Angular', 'Animation', 'Ansible',
  'Ant Design', 'Apache', 'Appcelerator', 'ArangoDB', 'Artificial Intelligence', 'Assembly',
  'Auditing', 'AutoCAD', 'Axure', 'B2B Sales', 'Babel', 'Backbone.js', 'Backend Development',
  'Balsamiq', 'Big Data', 'Blender', 'Blogging', 'Bookkeeping', 'Bootstrap', 'Brand Management',
  'Business Development', 'C#', 'C++', 'CI/CD', 'CakePHP', 'Cassandra', 'Chakra UI', 'Chef',
  'Cinema 4D', 'CircleCI', 'Cloud Security', 'CodeIgniter', 'Communication', 'Compliance',
  'Computer Vision', 'Confluence', 'Content Marketing', 'Copywriting', 'Cordova', 'CorelDRAW',
  'Corporate Finance', 'CouchDB', 'Couchbase', 'Critical Thinking', 'Cryptography', 'Customer Service',
  'Customer Success', 'Cybersecurity', 'Dart', 'Data Analysis', 'Data Entry', 'Data Mining',
  'Data Science', 'Database Management', 'DaVinci Resolve', 'Deep Learning', 'Digital Marketing',
  'DigitalOcean', 'Django', 'Docker', 'DynamoDB', 'Editing', 'Elasticsearch', 'Ember.js',
  'Email Marketing', 'Employee Relations', 'Ethical Hacking', 'Event Planning', 'Excel',
  'Express.js', 'Facebook Ads', 'FastAPI', 'Figma', 'Final Cut Pro', 'Financial Analysis',
  'Financial Modeling', 'Firebase', 'Firewalls', 'Flask', 'Flutter', 'Forensics',
  'Frontend Development', 'Game Development', 'Git', 'GitHub', 'GitLab', 'Go', 'Google Ads',
  'Google Analytics', 'Google Cloud (GCP)', 'GraphQL', 'Groovy', 'HIPAA', 'HTML', 'HBase',
  'Hadoop', 'Haskell', 'Heroku', 'Human Resources', 'IAM', 'ISO 27001', 'Incident Response',
  'Information Security', 'InVision', 'Inventory Management', 'Investment Banking', 'Ionic',
  'Java', 'JavaScript', 'Jenkins', 'Jetpack Compose', 'Jira', 'Kafka', 'Keras', 'Koa',
  'Kotlin', 'Kubernetes', 'Laravel', 'Lean Six Sigma', 'Linux', 'Logistics', 'Looker',
  'Lua', 'MATLAB', 'Machine Learning', 'MariaDB', 'Market Research', 'Marvel', 'Material UI',
  'Maya', 'Memcached', 'Meteor', 'Microservices', 'Microsoft Azure', 'Microsoft Office',
  'Microsoft SQL Server', 'MongoDB', 'MySQL', 'NLP', 'NativeScript', 'Negotiation',
  'Neo4j', 'NestJS', 'Netlify', 'Network Security', 'Next.js', 'Nginx', 'Node.js',
  'NumPy', 'Nuke', 'Nuxt.js', 'Objective-C', 'Onboarding', 'Operations Management',
  'Oracle', 'PCI DSS', 'PHP', 'Pandas', 'Payroll', 'Penetration Testing',
  'Performance Management', 'Perl', 'PhoneGap', 'Photography', 'Podcasting',
  'PostgreSQL', 'Power BI', 'PowerShell', 'Problem Solving', 'Procurement',
  'Product Management', 'Project Management', 'Prototyping', 'Public Relations',
  'Public Speaking', 'Puppet', 'PyTorch', 'Python', 'QlikView', 'Quality Assurance',
  'QuickBooks', 'R', 'REST API', 'React Native', 'React.js', 'Reactjs Workflows',
  'Recruiting', 'Redis', 'Redux', 'Research', 'RethinkDB', 'Risk Management',
  'Ruby', 'Ruby on Rails', 'Rust', 'SEO', 'SIEM', 'SOC', 'SQL', 'SQLite',
  'Sails.js', 'Sales', 'Scala', 'Scikit-learn', 'Scrum', 'Shell', 'Sketch',
  'Social Media Marketing', 'SolidWorks', 'Sound Design', 'Spark', 'Spring Boot',
  'Styled Components', 'Substance Painter', 'Supply Chain Management', 'Svelte',
  'Swift', 'SwiftUI', 'Symphony', 'Tableau', 'Tailwind CSS', 'Talent Acquisition',
  'Tally', 'Tax Preparation', 'Team Leadership', 'Technical Writing', 'TensorFlow',
  'Terraform', 'Time Management', 'Translation', 'Travis CI', 'TypeScript', 'Typing',
  'UI Design', 'UX Research', 'Unity', 'Unreal Engine', 'VBA', 'VPN', 'Vagrant',
  'Vercel', 'Video Editing', 'Vlogging', 'Vue.js', 'Vulnerability Assessment',
  'Wealth Management', 'Webpack', 'Wireframing', 'Writing', 'Xamarin', 'ZBrush',
  'Zend Framework', 'Zeplin', 'jQuery', 'iOS Development'
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

export default function EmployeesTab() {
  const [activeSection, setActiveSectionState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section') || params.get('subtab');
    if (sec && ['auth', 'onboarding', 'overview'].includes(sec)) return sec;
    const saved = localStorage.getItem('adminEmployeesSection');
    if (saved && ['auth', 'onboarding', 'overview'].includes(saved)) return saved;
    return 'onboarding';
  });

  const [authSubTab, setAuthSubTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('authSub');
    if (sub && ['login', 'register'].includes(sub)) return sub;
    const saved = localStorage.getItem('adminEmployeesAuthSub');
    if (saved && ['login', 'register'].includes(saved)) return saved;
    return 'login';
  });

  const [onboardingSubTab, setOnboardingSubTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get('step');
    if (step && ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'].includes(step)) return step;
    const saved = localStorage.getItem('adminEmployeesOnboardingStep');
    if (saved && ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'].includes(saved)) return saved;
    return 'step1';
  });

  const setActiveSection = (newSec) => {
    setActiveSectionState(newSec);
    localStorage.setItem('adminEmployeesSection', newSec);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'employees');
    params.set('section', newSec);
    if (newSec === 'onboarding') {
      params.set('step', onboardingSubTab);
      params.delete('authSub');
    } else if (newSec === 'auth') {
      params.set('authSub', authSubTab);
      params.delete('step');
    } else {
      params.delete('step');
      params.delete('authSub');
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const setAuthSubTab = (newAuthSub) => {
    setAuthSubTabState(newAuthSub);
    localStorage.setItem('adminEmployeesAuthSub', newAuthSub);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'employees');
    params.set('section', 'auth');
    params.set('authSub', newAuthSub);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const setOnboardingSubTab = (newStep) => {
    setOnboardingSubTabState(newStep);
    localStorage.setItem('adminEmployeesOnboardingStep', newStep);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'employees');
    params.set('section', 'onboarding');
    params.set('step', newStep);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Function & Designation management state & Modal popup state
  const [isFunctionsModalOpen, setIsFunctionsModalOpen] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState('IT & Software');
  const [newFunctionName, setNewFunctionName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');

  // Drag and Drop reordering state for functions
  const [draggedFunctionIndex, setDraggedFunctionIndex] = useState(null);
  const [dragOverFunctionIndex, setDragOverFunctionIndex] = useState(null);

  // Total Experience Options management & Modal state
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [newExperienceOption, setNewExperienceOption] = useState('');
  const [draggedExpIndex, setDraggedExpIndex] = useState(null);
  const [dragOverExpIndex, setDragOverExpIndex] = useState(null);

  // Pre-visible Location Cities management & Modal state (Current & Preferred)
  const [isLocationsModalOpen, setIsLocationsModalOpen] = useState(false);
  const [newLocationCity, setNewLocationCity] = useState('');
  const [locationFilterSearch, setLocationFilterSearch] = useState('');
  const [draggedLocIndex, setDraggedLocIndex] = useState(null);
  const [dragOverLocIndex, setDragOverLocIndex] = useState(null);

  // Education & Courses/Boards management state & Modal state
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [selectedEduType, setSelectedEduType] = useState('10th');
  const [newEducationType, setNewEducationType] = useState('');
  const [newEduCategory, setNewEduCategory] = useState('higher'); // 'higher' (course based) | 'school' (board based)
  const [newEduOptionName, setNewEduOptionName] = useState('');
  const [draggedEduIndex, setDraggedEduIndex] = useState(null);
  const [dragOverEduIndex, setDragOverEduIndex] = useState(null);

  // Course Type Options management & Modal state
  const [isCourseTypeModalOpen, setIsCourseTypeModalOpen] = useState(false);
  const [newCourseTypeOption, setNewCourseTypeOption] = useState('');
  const [draggedCourseTypeIndex, setDraggedCourseTypeIndex] = useState(null);
  const [dragOverCourseTypeIndex, setDragOverCourseTypeIndex] = useState(null);

  // School Medium Options management & Modal state (Step 2)
  const [isMediumModalOpen, setIsMediumModalOpen] = useState(false);
  const [newMediumOption, setNewMediumOption] = useState('');
  const [draggedMediumIndex, setDraggedMediumIndex] = useState(null);
  const [dragOverMediumIndex, setDragOverMediumIndex] = useState(null);

  // Employment Type Options management & Modal state (Step 3)
  const [isEmploymentTypeModalOpen, setIsEmploymentTypeModalOpen] = useState(false);
  const [newEmploymentTypeOption, setNewEmploymentTypeOption] = useState('');
  const [draggedEmploymentTypeIndex, setDraggedEmploymentTypeIndex] = useState(null);
  const [dragOverEmploymentTypeIndex, setDragOverEmploymentTypeIndex] = useState(null);

  // Notice Period Options management & Modal state (Step 3 & 4)
  const [isNoticePeriodModalOpen, setIsNoticePeriodModalOpen] = useState(false);
  const [newNoticePeriodOption, setNewNoticePeriodOption] = useState('');
  const [draggedNoticePeriodIndex, setDraggedNoticePeriodIndex] = useState(null);
  const [dragOverNoticePeriodIndex, setDragOverNoticePeriodIndex] = useState(null);
  // Grading Systems management state & Modal state
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [newGradingName, setNewGradingName] = useState('');
  const [newGradingLabel, setNewGradingLabel] = useState('');
  const [newGradingPlaceholder, setNewGradingPlaceholder] = useState('');
  const [draggedGradingIndex, setDraggedGradingIndex] = useState(null);
  const [dragOverGradingIndex, setDragOverGradingIndex] = useState(null);
  const [previewGradingSelection, setPreviewGradingSelection] = useState('Scale 10 Grading System');

  // Key Skills Options management & Modal state (Step 4)
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [newSkillOption, setNewSkillOption] = useState('');
  const [skillFilterSearch, setSkillFilterSearch] = useState('');
  const [draggedSkillIndex, setDraggedSkillIndex] = useState(null);
  const [dragOverSkillIndex, setDragOverSkillIndex] = useState(null);
  const [previewSalaryType, setPreviewSalaryType] = useState('Yearly');
  const [previewVideoTab, setPreviewVideoTab] = useState('upload');

  // 1. Employee Register CMS State
  const [registerConfig, setRegisterConfig] = useState({
    modalTitle: 'Register',
    modalSubtitle: '',
    googleBtnText: 'Continue with Google',
    dividerText: 'Or',
    submitBtnText: 'Register now',
    fields: {
      name: { label: 'Full Name', placeholder: 'What is your name?', isRequired: true },
      email: { label: 'Email ID', placeholder: 'Tell us your Email ID', isRequired: true },
      mobile: { label: 'Mobile number', placeholder: 'Enter your mobile number', isRequired: true },
      password: { label: 'Password', placeholder: 'Create a strong password', isRequired: true },
      confirmPassword: { label: 'Re-enter password', placeholder: 'Confirm your password', isRequired: true }
    }
  });

  // 2. Employee Login CMS State
  const [loginConfig, setLoginConfig] = useState({
    modalTitle: 'Login to your account',
    modalSubtitle: 'Welcome back! Please enter your details.',
    googleBtnText: 'Continue with Google',
    dividerText: 'Or with email',
    submitBtnText: 'Login',
    otpBtnText: 'Use OTP to Login',
    fields: {
      email: { label: 'Email ID', placeholder: 'Enter your active Email ID', isRequired: true },
      password: { label: 'Password', placeholder: 'Enter your password', isRequired: true }
    }
  });

  // 3. Employee Onboarding CMS State (All 6 Steps)
  const [onboardingConfig, setOnboardingConfig] = useState({
    header: {
      title: 'Create your Profile',
      subtitle: 'Complete all steps to get verified & discovered by recruiters'
    },
    buttons: {
      nextBtnText: 'Save & Continue',
      backBtnText: 'Back',
      submitBtnText: 'Submit Profile'
    },
    step1: {
      title: 'Basic Details',
      functionsData: DEFAULT_FUNCTIONS_DATA,
      experienceOptions: DEFAULT_EXPERIENCE_OPTIONS,
      locationCities: DEFAULT_LOCATION_CITIES,
      fields: {
        firstName: { label: 'First Name', placeholder: 'Enter first name', isRequired: true },
        lastName: { label: 'Last Name', placeholder: 'Enter last name', isRequired: false },
        phone: { label: 'Phone Number', placeholder: 'Enter 10-digit mobile number', isRequired: true },
        email: { label: 'Email ID (Read Only)', placeholder: 'Enter email address', isRequired: false },
        industry: { label: 'Function', placeholder: 'Select Function', isRequired: true },
        designation: { label: 'Designation / Role', placeholder: 'Select Designation / Role', isRequired: true },
        totalExperience: { label: 'Total Experience', placeholder: 'Select Total Experience', isRequired: true },
        location: { label: 'Current Location', placeholder: 'Select Current Location', isRequired: true },
        preferredLocation: { label: 'Preferred Location', placeholder: 'Select Preferred Locations', isRequired: false },
        brief: { label: 'Brief about yourself', placeholder: 'I am a passionate professional...', isRequired: false }
      }
    },
    step2: {
      title: 'Education',
      subtitle: 'Details help recruiters identify your background',
      addBtnText: 'Add +',
      educationData: DEFAULT_EDUCATION_DATA,
      educationTypes: DEFAULT_EDUCATION_TYPES,
      courseTypeOptions: DEFAULT_COURSE_TYPE_OPTIONS,
      mediumOptions: DEFAULT_MEDIUM_OPTIONS,
      gradingSystems: DEFAULT_GRADING_SYSTEMS,
      fields: {
        educationType: { label: 'Education', placeholder: 'Select education type', isRequired: true },
        university: { label: 'University / Institute', placeholder: 'Search or enter university/institute...', isRequired: true },
        course: { label: 'Course', placeholder: 'Select course', isRequired: true },
        schoolMedium: { label: 'School medium', placeholder: 'Select medium', isRequired: true },
        courseType: { label: 'Course Type', placeholder: 'Select course type', isRequired: true },
        startYear: { label: 'Starting Year', placeholder: 'Select starting year', isRequired: true },
        endYear: { label: 'Passing Out Year', placeholder: 'Select passing out year', isRequired: true },
        gradingSystem: { label: 'Grading System', placeholder: 'Select grading system', isRequired: true },
        percentage: { label: 'Marks / Grade', placeholder: 'Enter percentage or grade', isRequired: true }
      }
    },
    step3: {
      title: 'Work Experience',
      subtitle: 'Highlight your professional journey',
      addBtnText: 'Add +',
      fresherLabel: 'I am a fresher (No Experience)',
      employmentTypeOptions: DEFAULT_EMPLOYMENT_TYPE_OPTIONS,
      noticePeriodOptions: DEFAULT_NOTICE_PERIOD_OPTIONS,
      fields: {
        companyName: { label: 'Company Name', placeholder: 'Enter company name', isRequired: true },
        jobTitle: { label: 'Job Title / Role', placeholder: 'Enter job title', isRequired: true },
        employmentType: { label: 'Employment Type', placeholder: 'Select employment type', isRequired: true },
        joiningDate: { label: 'Joining Date', placeholder: 'Select month & year', isRequired: true },
        leavingDate: { label: 'Leaving Date', placeholder: 'Select month & year', isRequired: true },
        currentCompany: { label: 'Currently working here', isRequired: false },
        roleDescription: { label: 'Roles & Responsibilities', placeholder: 'Briefly describe your roles & responsibilities', isRequired: false },
        noticePeriod: { label: 'Notice Period', placeholder: 'Select notice period', isRequired: false }
      }
    },
    step4: {
      title: 'Key Skills & Preferences',
      subtitle: 'Highlight your key skills and preferences to find matching jobs',
      skillsOptions: DEFAULT_SKILLS_OPTIONS,
      fields: {
        linkedinUrl: { label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/...', isRequired: false },
        salaryType: { label: 'Salary Type', placeholder: 'Select salary type', isRequired: true },
        currency: { label: 'Currency', placeholder: 'Select currency', isRequired: true },
        currentSalary: { label: 'Current Annual CTC', placeholder: 'e.g. 5,00,000', isRequired: false },
        expectedSalary: { label: 'Expected Annual CTC', placeholder: 'e.g. 7,50,000', isRequired: false },
        skills: { label: 'Key Skills', placeholder: 'Type skill and press Enter (e.g., React, Node.js)', isRequired: false }
      }
    },
    step5: {
      title: 'Documents & Media',
      subtitle: 'Upload your resume, cover letter, and introductory video',
      videoConfig: {
        sectionTitle: 'Introductory Video',
        sectionSubtitle: 'Upload MP4/MOV (Max 3 mins, 200MB) or attach video link',
        uploadTabLabel: 'Upload File',
        linkTabLabel: 'Paste Link',
        uploadDropzoneTitle: 'Click or drag video to upload',
        uploadDropzoneSubtitle: 'MP4, MOV, WebM up to 200MB (Max 3 mins)',
        linkInputPlaceholder: 'e.g. YouTube, Loom, Vimeo, Drive, or Mux stream link',
        linkAttachButtonText: 'Attach',
        linkHelpText: 'Supported: YouTube, Loom, Vimeo, Google Drive, Mux Stream URLs, and MP4 links.'
      },
      fields: {
        resume: { label: 'Resume (PDF/DOCX)', placeholder: 'Supported Formats: doc, docx, pdf, upto 300KB', isRequired: true },
        coverLetter: { label: 'Cover Letter', placeholder: 'Supported Formats: doc, docx, pdf, upto 300KB', isRequired: false },
        introVideo: { label: 'Introductory Video', placeholder: 'Upload MP4/MOV or attach video link', isRequired: false }
      }
    },
    step6: {
      title: 'Final Review',
      subtitle: 'Please review all the details you filled in before submitting.'
    }
  });

  // Fetch Homepage, Register, Login & Onboarding Config on Mount
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/homepage`);
      const data = await res.json();
      if (data.success) {
        if (data.data?.employeeRegister) {
          setRegisterConfig(prev => ({
            ...prev,
            ...data.data.employeeRegister,
            fields: {
              ...prev.fields,
              ...(data.data.employeeRegister.fields || {})
            }
          }));
        }
        if (data.data?.employeeLogin) {
          setLoginConfig(prev => ({
            ...prev,
            ...data.data.employeeLogin,
            fields: {
              ...prev.fields,
              ...(data.data.employeeLogin.fields || {})
            }
          }));
        }
        if (data.data?.employeeOnboarding) {
          setOnboardingConfig(prev => ({
            ...prev,
            ...data.data.employeeOnboarding,
            header: { ...prev.header, ...(data.data.employeeOnboarding.header || {}) },
            buttons: { ...prev.buttons, ...(data.data.employeeOnboarding.buttons || {}) },
            step1: {
              ...prev.step1,
              ...(data.data.employeeOnboarding.step1 || {}),
              functionsData: (data.data.employeeOnboarding.step1?.functionsData && typeof data.data.employeeOnboarding.step1.functionsData === 'object' && Object.keys(data.data.employeeOnboarding.step1.functionsData).length > 0)
                ? data.data.employeeOnboarding.step1.functionsData
                : (prev.step1?.functionsData || DEFAULT_FUNCTIONS_DATA),
              experienceOptions: (Array.isArray(data.data.employeeOnboarding.step1?.experienceOptions) && data.data.employeeOnboarding.step1.experienceOptions.length > 0)
                ? data.data.employeeOnboarding.step1.experienceOptions
                : (prev.step1?.experienceOptions || DEFAULT_EXPERIENCE_OPTIONS),
              locationCities: (Array.isArray(data.data.employeeOnboarding.step1?.locationCities) && data.data.employeeOnboarding.step1.locationCities.length > 0)
                ? data.data.employeeOnboarding.step1.locationCities
                : (prev.step1?.locationCities || DEFAULT_LOCATION_CITIES),
              fields: { ...prev.step1.fields, ...(data.data.employeeOnboarding.step1?.fields || {}) }
            },
            step2: {
              ...prev.step2,
              ...(data.data.employeeOnboarding.step2 || {}),
              educationData: (() => {
                const incoming = data.data.employeeOnboarding.step2?.educationData;
                if (incoming && typeof incoming === 'object' && Object.keys(incoming).length > 0) {
                  const merged = { ...DEFAULT_EDUCATION_DATA, ...incoming };
                  // If 10th or 12th has legacy 6 boards or empty, upgrade them to full DEFAULT_EDUCATION_DATA boards
                  if (merged['10th'] && (!merged['10th'].options || merged['10th'].options.length <= 6)) {
                    merged['10th'] = { ...merged['10th'], category: 'school', options: [...DEFAULT_SCHOOL_BOARDS] };
                  }
                  if (merged['12th'] && (!merged['12th'].options || merged['12th'].options.length <= 6)) {
                    merged['12th'] = { ...merged['12th'], category: 'school', options: [...DEFAULT_SCHOOL_BOARDS] };
                  }
                  return merged;
                }
                return prev.step2?.educationData || DEFAULT_EDUCATION_DATA;
              })(),
              educationTypes: (Array.isArray(data.data.employeeOnboarding.step2?.educationTypes) && data.data.employeeOnboarding.step2.educationTypes.length > 0)
                ? data.data.employeeOnboarding.step2.educationTypes
                : (prev.step2?.educationTypes || DEFAULT_EDUCATION_TYPES),
              courseTypeOptions: (Array.isArray(data.data.employeeOnboarding.step2?.courseTypeOptions) && data.data.employeeOnboarding.step2.courseTypeOptions.length > 0)
                ? data.data.employeeOnboarding.step2.courseTypeOptions
                : (prev.step2?.courseTypeOptions || DEFAULT_COURSE_TYPE_OPTIONS),
              mediumOptions: (Array.isArray(data.data.employeeOnboarding.step2?.mediumOptions) && data.data.employeeOnboarding.step2.mediumOptions.length > 0)
                ? data.data.employeeOnboarding.step2.mediumOptions
                : (prev.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS),
              gradingSystems: (Array.isArray(data.data.employeeOnboarding.step2?.gradingSystems) && data.data.employeeOnboarding.step2.gradingSystems.length > 0)
                ? normalizeGradingSystems(data.data.employeeOnboarding.step2.gradingSystems)
                : (prev.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS),
              fields: { ...prev.step2.fields, ...(data.data.employeeOnboarding.step2?.fields || {}) }
            },
            step3: {
              ...prev.step3,
              ...(data.data.employeeOnboarding.step3 || {}),
              employmentTypeOptions: (Array.isArray(data.data.employeeOnboarding.step3?.employmentTypeOptions) && data.data.employeeOnboarding.step3.employmentTypeOptions.length > 0)
                ? data.data.employeeOnboarding.step3.employmentTypeOptions
                : (prev.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS),
              noticePeriodOptions: (Array.isArray(data.data.employeeOnboarding.step3?.noticePeriodOptions) && data.data.employeeOnboarding.step3.noticePeriodOptions.length > 0)
                ? data.data.employeeOnboarding.step3.noticePeriodOptions
                : (prev.step3?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS),
              fields: { ...prev.step3.fields, ...(data.data.employeeOnboarding.step3?.fields || {}) }
            },
            step4: {
              ...prev.step4,
              ...(data.data.employeeOnboarding.step4 || {}),
              noticePeriodOptions: (Array.isArray(data.data.employeeOnboarding.step4?.noticePeriodOptions) && data.data.employeeOnboarding.step4.noticePeriodOptions.length > 0)
                ? data.data.employeeOnboarding.step4.noticePeriodOptions
                : (data.data.employeeOnboarding.step3?.noticePeriodOptions || prev.step4?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS),
              skillsOptions: (Array.isArray(data.data.employeeOnboarding.step4?.skillsOptions) && data.data.employeeOnboarding.step4.skillsOptions.length > 0)
                ? data.data.employeeOnboarding.step4.skillsOptions
                : (prev.step4?.skillsOptions || DEFAULT_SKILLS_OPTIONS),
              fields: { ...prev.step4.fields, ...(data.data.employeeOnboarding.step4?.fields || {}) }
            },
            step5: {
              ...prev.step5,
              title: data.data.employeeOnboarding.step5?.title || 'Documents & Media',
              subtitle: data.data.employeeOnboarding.step5?.subtitle || 'Upload your resume, cover letter, and introductory video',
              videoConfig: {
                sectionTitle: data.data.employeeOnboarding.step5?.videoConfig?.sectionTitle || data.data.employeeOnboarding.step5?.fields?.introVideo?.label || 'Introductory Video',
                sectionSubtitle: data.data.employeeOnboarding.step5?.videoConfig?.sectionSubtitle || (data.data.employeeOnboarding.step5?.fields?.introVideo?.placeholder && !data.data.employeeOnboarding.step5.fields.introVideo.placeholder.includes('Short video') ? data.data.employeeOnboarding.step5.fields.introVideo.placeholder : 'Upload MP4/MOV (Max 3 mins, 200MB) or attach video link'),
                uploadTabLabel: data.data.employeeOnboarding.step5?.videoConfig?.uploadTabLabel || 'Upload File',
                linkTabLabel: data.data.employeeOnboarding.step5?.videoConfig?.linkTabLabel || 'Paste Link',
                uploadDropzoneTitle: data.data.employeeOnboarding.step5?.videoConfig?.uploadDropzoneTitle || 'Click or drag video to upload',
                uploadDropzoneSubtitle: data.data.employeeOnboarding.step5?.videoConfig?.uploadDropzoneSubtitle || 'MP4, MOV, WebM up to 200MB (Max 3 mins)',
                linkInputPlaceholder: data.data.employeeOnboarding.step5?.videoConfig?.linkInputPlaceholder || 'e.g. YouTube, Loom, Vimeo, Drive, or Mux stream link',
                linkAttachButtonText: data.data.employeeOnboarding.step5?.videoConfig?.linkAttachButtonText || 'Attach',
                linkHelpText: data.data.employeeOnboarding.step5?.videoConfig?.linkHelpText || 'Supported: YouTube, Loom, Vimeo, Google Drive, Mux Stream URLs, and MP4 links.',
                ...(data.data.employeeOnboarding.step5?.videoConfig || {})
              },
              fields: {
                resume: { 
                  label: data.data.employeeOnboarding.step5?.fields?.resume?.label || 'Resume (PDF/DOCX)', 
                  placeholder: (!data.data.employeeOnboarding.step5?.fields?.resume?.placeholder || data.data.employeeOnboarding.step5.fields.resume.placeholder.includes('5MB') || data.data.employeeOnboarding.step5.fields.resume.placeholder === 'Upload PDF or DOCX (Max 5MB)' || data.data.employeeOnboarding.step5.fields.resume.placeholder.toLowerCase().includes('pdf or docx')) 
                    ? 'Supported Formats: doc, docx, pdf, upto 300KB' 
                    : data.data.employeeOnboarding.step5.fields.resume.placeholder, 
                  isRequired: data.data.employeeOnboarding.step5?.fields?.resume?.isRequired !== undefined ? data.data.employeeOnboarding.step5.fields.resume.isRequired : true 
                },
                coverLetter: { 
                  label: data.data.employeeOnboarding.step5?.fields?.coverLetter?.label || 'Cover Letter', 
                  placeholder: (!data.data.employeeOnboarding.step5?.fields?.coverLetter?.placeholder || data.data.employeeOnboarding.step5.fields.coverLetter.placeholder.includes('5MB') || data.data.employeeOnboarding.step5.fields.coverLetter.placeholder === 'Upload Cover Letter (PDF/DOCX)' || data.data.employeeOnboarding.step5.fields.coverLetter.placeholder.toLowerCase().includes('cover letter (pdf/docx)')) 
                    ? 'Supported Formats: doc, docx, pdf, upto 300KB' 
                    : data.data.employeeOnboarding.step5.fields.coverLetter.placeholder, 
                  isRequired: data.data.employeeOnboarding.step5?.fields?.coverLetter?.isRequired !== undefined ? data.data.employeeOnboarding.step5.fields.coverLetter.isRequired : false 
                },
                introVideo: { 
                  label: data.data.employeeOnboarding.step5?.fields?.introVideo?.label || 'Introductory Video', 
                  placeholder: data.data.employeeOnboarding.step5?.fields?.introVideo?.placeholder || 'Upload MP4/MOV or attach video link', 
                  isRequired: data.data.employeeOnboarding.step5?.fields?.introVideo?.isRequired !== undefined ? data.data.employeeOnboarding.step5.fields.introVideo.isRequired : false 
                }
              }
            },
            step6: {
              ...prev.step6,
              ...(data.data.employeeOnboarding.step6 || {})
            }
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching CMS config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'employees');
    params.set('section', activeSection);
    if (activeSection === 'onboarding') {
      params.set('step', onboardingSubTab);
      params.delete('authSub');
    } else if (activeSection === 'auth') {
      params.set('authSub', authSubTab);
      params.delete('step');
    } else {
      params.delete('step');
      params.delete('authSub');
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      const sec = p.get('section') || p.get('subtab');
      if (sec && ['auth', 'onboarding', 'overview'].includes(sec)) {
        setActiveSectionState(sec);
      }
      const authSub = p.get('authSub');
      if (authSub && ['login', 'register'].includes(authSub)) {
        setAuthSubTabState(authSub);
      }
      const step = p.get('step');
      if (step && ['step1', 'step2', 'step3', 'step4', 'step5', 'step6'].includes(step)) {
        setOnboardingSubTabState(step);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeSection, authSubTab, onboardingSubTab]);

  // Field change handler for Register
  const handleFieldChange = (fieldKey, property, value) => {
    setRegisterConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldKey]: {
          ...(prev.fields[fieldKey] || {}),
          [property]: value
        }
      }
    }));
  };

  // Field change handler for Login
  const handleLoginFieldChange = (fieldKey, property, value) => {
    setLoginConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldKey]: {
          ...(prev.fields[fieldKey] || {}),
          [property]: value
        }
      }
    }));
  };

  // Mandatory toggle handler for Register
  const handleMandatoryToggle = (fieldKey) => {
    setRegisterConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldKey]: {
          ...(prev.fields[fieldKey] || {}),
          isRequired: !prev.fields[fieldKey]?.isRequired
        }
      }
    }));
  };

  // Onboarding field change handler
  const handleOnboardingFieldChange = (stepKey, fieldKey, property, value) => {
    setOnboardingConfig(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        fields: {
          ...prev[stepKey]?.fields,
          [fieldKey]: {
            ...(prev[stepKey]?.fields?.[fieldKey] || {}),
            [property]: value
          }
        }
      }
    }));
  };

  // Onboarding mandatory toggle handler
  const handleOnboardingMandatoryToggle = (stepKey, fieldKey) => {
    setOnboardingConfig(prev => {
      const current = prev[stepKey]?.fields?.[fieldKey]?.isRequired;
      return {
        ...prev,
        [stepKey]: {
          ...prev[stepKey],
          fields: {
            ...prev[stepKey]?.fields,
            [fieldKey]: {
              ...(prev[stepKey]?.fields?.[fieldKey] || {}),
              isRequired: !current
            }
          }
        }
      };
    });
  };

  // Functions & Roles management handlers (Pure functional updates)
  const handleAddFunction = () => {
    const trimmed = newFunctionName.trim();
    if (!trimmed) return;
    setOnboardingConfig(prev => {
      const currentFunctions = prev.step1?.functionsData || DEFAULT_FUNCTIONS_DATA;
      if (currentFunctions[trimmed]) {
        return prev;
      }
      return {
        ...prev,
        step1: {
          ...prev.step1,
          functionsData: {
            ...currentFunctions,
            [trimmed]: []
          }
        }
      };
    });
    setSelectedFunction(trimmed);
    setNewFunctionName('');
  };

  const handleDeleteFunction = (funcName) => {
    setOnboardingConfig(prev => {
      const currentFunctions = { ...(prev.step1?.functionsData || DEFAULT_FUNCTIONS_DATA) };
      delete currentFunctions[funcName];
      const remainingKeys = Object.keys(currentFunctions);
      if (selectedFunction === funcName) {
        setSelectedFunction(remainingKeys.length > 0 ? remainingKeys[0] : '');
      }
      return {
        ...prev,
        step1: {
          ...prev.step1,
          functionsData: currentFunctions
        }
      };
    });
  };

  const handleAddRole = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed || !selectedFunction) return;
    setOnboardingConfig(prev => {
      const currentFunctions = prev.step1?.functionsData || DEFAULT_FUNCTIONS_DATA;
      const currentRoles = currentFunctions[selectedFunction] || [];
      if (currentRoles.includes(trimmed)) {
        return prev;
      }
      return {
        ...prev,
        step1: {
          ...prev.step1,
          functionsData: {
            ...currentFunctions,
            [selectedFunction]: [...currentRoles, trimmed]
          }
        }
      };
    });
    setNewRoleName('');
  };

  const handleDeleteRole = (funcName, roleIndex) => {
    setOnboardingConfig(prev => {
      const currentFunctions = prev.step1?.functionsData || DEFAULT_FUNCTIONS_DATA;
      const currentRoles = [...(currentFunctions[funcName] || [])];
      currentRoles.splice(roleIndex, 1);
      return {
        ...prev,
        step1: {
          ...prev.step1,
          functionsData: {
            ...currentFunctions,
            [funcName]: currentRoles
          }
        }
      };
    });
  };

  const handleResetFunctions = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        functionsData: DEFAULT_FUNCTIONS_DATA
      }
    }));
    setSelectedFunction('IT & Software');
  };

  // Functions Drag & Drop Reordering handlers with preview
  const handleFunctionDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedFunctionIndex(index);
  };

  const handleFunctionDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFunctionIndex !== index) {
      setDragOverFunctionIndex(index);
    }
  };

  const handleFunctionDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedFunctionIndex === null || draggedFunctionIndex === dropIndex) {
      setDraggedFunctionIndex(null);
      setDragOverFunctionIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentFunctions = prev.step1?.functionsData || DEFAULT_FUNCTIONS_DATA;
      const entries = Object.entries(currentFunctions);
      const [draggedItem] = entries.splice(draggedFunctionIndex, 1);
      entries.splice(dropIndex, 0, draggedItem);
      const reordered = Object.fromEntries(entries);
      return {
        ...prev,
        step1: {
          ...prev.step1,
          functionsData: reordered
        }
      };
    });

    setDraggedFunctionIndex(null);
    setDragOverFunctionIndex(null);
  };

  const handleFunctionDragEnd = () => {
    setDraggedFunctionIndex(null);
    setDragOverFunctionIndex(null);
  };

  // Total Experience Options management & Drag handlers
  const handleAddExperienceOption = () => {
    const trimmed = newExperienceOption.trim();
    if (!trimmed) return;
    setOnboardingConfig(prev => {
      const currentList = prev.step1?.experienceOptions || DEFAULT_EXPERIENCE_OPTIONS;
      if (currentList.includes(trimmed)) {
        return prev;
      }
      return {
        ...prev,
        step1: {
          ...prev.step1,
          experienceOptions: [...currentList, trimmed]
        }
      };
    });
    setNewExperienceOption('');
  };

  const handleDeleteExperienceOption = (indexToDelete) => {
    setOnboardingConfig(prev => {
      const currentList = [...(prev.step1?.experienceOptions || DEFAULT_EXPERIENCE_OPTIONS)];
      currentList.splice(indexToDelete, 1);
      return {
        ...prev,
        step1: {
          ...prev.step1,
          experienceOptions: currentList
        }
      };
    });
  };

  const handleResetExperienceOptions = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        experienceOptions: DEFAULT_EXPERIENCE_OPTIONS
      }
    }));
  };

  const handleExpDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedExpIndex(index);
  };

  const handleExpDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverExpIndex !== index) {
      setDragOverExpIndex(index);
    }
  };

  const handleExpDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedExpIndex === null || draggedExpIndex === dropIndex) {
      setDraggedExpIndex(null);
      setDragOverExpIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = [...(prev.step1?.experienceOptions || DEFAULT_EXPERIENCE_OPTIONS)];
      const [draggedItem] = currentList.splice(draggedExpIndex, 1);
      currentList.splice(dropIndex, 0, draggedItem);
      return {
        ...prev,
        step1: {
          ...prev.step1,
          experienceOptions: currentList
        }
      };
    });

    setDraggedExpIndex(null);
    setDragOverExpIndex(null);
  };

  const handleExpDragEnd = () => {
    setDraggedExpIndex(null);
    setDragOverExpIndex(null);
  };

  // Location Cities management (Current & Preferred) & Drag handlers
  const handleAddLocationCity = (cityNameToAdd) => {
    const raw = (typeof cityNameToAdd === 'string' ? cityNameToAdd : newLocationCity).trim();
    if (!raw) return;

    if (raw.toLowerCase() === 'anywhere in india') {
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = prev.step1?.locationCities || DEFAULT_LOCATION_CITIES;
      if (currentList.some(c => c.toLowerCase() === raw.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        step1: {
          ...prev.step1,
          locationCities: [...currentList, raw]
        }
      };
    });
    setNewLocationCity('');
  };

  const handleDeleteLocationCity = (indexToDelete) => {
    setOnboardingConfig(prev => {
      const currentList = [...(prev.step1?.locationCities || DEFAULT_LOCATION_CITIES)];
      const target = currentList[indexToDelete];
      if (target && target.toLowerCase() === 'anywhere in india') {
        return prev;
      }
      currentList.splice(indexToDelete, 1);
      return {
        ...prev,
        step1: {
          ...prev.step1,
          locationCities: currentList
        }
      };
    });
  };

  const handleResetLocationCities = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step1: {
        ...prev.step1,
        locationCities: DEFAULT_LOCATION_CITIES
      }
    }));
  };

  const handleLocDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedLocIndex(index);
  };

  const handleLocDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLocIndex !== index) {
      setDragOverLocIndex(index);
    }
  };

  const handleLocDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedLocIndex === null || draggedLocIndex === dropIndex) {
      setDraggedLocIndex(null);
      setDragOverLocIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = [...(prev.step1?.locationCities || DEFAULT_LOCATION_CITIES)];
      const [draggedItem] = currentList.splice(draggedLocIndex, 1);
      currentList.splice(dropIndex, 0, draggedItem);
      return {
        ...prev,
        step1: {
          ...prev.step1,
          locationCities: currentList
        }
      };
    });

    setDraggedLocIndex(null);
    setDragOverLocIndex(null);
  };

  const handleLocDragEnd = () => {
    setDraggedLocIndex(null);
    setDragOverLocIndex(null);
  };

  // Education Types & Linked Courses / Boards management (Step 2) Handlers
  const [editingEduKey, setEditingEduKey] = useState(null);
  const [editingEduName, setEditingEduName] = useState('');

  const handleStartRenameEduType = (eduKey, e) => {
    if (e) e.stopPropagation();
    setEditingEduKey(eduKey);
    setEditingEduName(eduKey);
  };

  const handleCancelRenameEduType = (e) => {
    if (e) e.stopPropagation();
    setEditingEduKey(null);
    setEditingEduName('');
  };

  const handleSaveRenameEduType = (oldKey, e) => {
    if (e) e.stopPropagation();
    const trimmed = editingEduName.trim();
    if (!trimmed || trimmed === oldKey) {
      setEditingEduKey(null);
      setEditingEduName('');
      return;
    }

    setOnboardingConfig(prev => {
      const currentEduData = prev.step2?.educationData || DEFAULT_EDUCATION_DATA;
      const currentEduTypes = prev.step2?.educationTypes || Object.keys(currentEduData);

      if (currentEduData[trimmed] && trimmed !== oldKey) {
        alert(`An education type named "${trimmed}" already exists.`);
        return prev;
      }

      const newEduData = {};
      Object.keys(currentEduData).forEach(k => {
        if (k === oldKey) {
          newEduData[trimmed] = currentEduData[oldKey];
        } else {
          newEduData[k] = currentEduData[k];
        }
      });

      const newEduTypes = currentEduTypes.map(k => k === oldKey ? trimmed : k);

      return {
        ...prev,
        step2: {
          ...prev.step2,
          educationData: newEduData,
          educationTypes: newEduTypes
        }
      };
    });

    if (selectedEduType === oldKey) {
      setSelectedEduType(trimmed);
    }
    setEditingEduKey(null);
    setEditingEduName('');
  };

  const handleAddEducationType = () => {
    const trimmed = newEducationType.trim();
    if (!trimmed) return;
    setOnboardingConfig(prev => {
      const currentEduData = prev.step2?.educationData || DEFAULT_EDUCATION_DATA;
      if (currentEduData[trimmed]) {
        return prev;
      }
      return {
        ...prev,
        step2: {
          ...prev.step2,
          educationData: {
            ...currentEduData,
            [trimmed]: {
              category: newEduCategory,
              options: newEduCategory === 'school' ? [...DEFAULT_SCHOOL_BOARDS] : []
            }
          },
          educationTypes: [...Object.keys(currentEduData), trimmed]
        }
      };
    });
    setSelectedEduType(trimmed);
    setNewEducationType('');
  };

  const handleToggleEduCategory = (eduKey) => {
    setOnboardingConfig(prev => {
      const currentEduData = { ...(prev.step2?.educationData || DEFAULT_EDUCATION_DATA) };
      if (!currentEduData[eduKey]) return prev;
      const currentCat = currentEduData[eduKey].category || 'higher';
      const nextCat = currentCat === 'school' ? 'higher' : 'school';
      let nextOptions = currentEduData[eduKey].options || [];
      if (nextCat === 'school' && nextOptions.length === 0) {
        nextOptions = [...DEFAULT_SCHOOL_BOARDS];
      }
      return {
        ...prev,
        step2: {
          ...prev.step2,
          educationData: {
            ...currentEduData,
            [eduKey]: {
              ...currentEduData[eduKey],
              category: nextCat,
              options: nextOptions
            }
          }
        }
      };
    });
  };

  const handleDeleteEducationType = (eduKey) => {
    setOnboardingConfig(prev => {
      const currentEduData = { ...(prev.step2?.educationData || DEFAULT_EDUCATION_DATA) };
      delete currentEduData[eduKey];
      const remainingKeys = Object.keys(currentEduData);
      if (selectedEduType === eduKey) {
        setSelectedEduType(remainingKeys.length > 0 ? remainingKeys[0] : '');
      }
      return {
        ...prev,
        step2: {
          ...prev.step2,
          educationData: currentEduData,
          educationTypes: remainingKeys
        }
      };
    });
  };

  const handleAddEduOption = () => {
    const trimmed = newEduOptionName.trim();
    if (!trimmed || !selectedEduType) return;
    setOnboardingConfig(prev => {
      const currentEduData = prev.step2?.educationData || DEFAULT_EDUCATION_DATA;
      const targetObj = currentEduData[selectedEduType] || { category: 'higher', options: [] };
      const currentOpts = targetObj.options || [];
      if (currentOpts.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        step2: {
          ...prev.step2,
          educationData: {
            ...currentEduData,
            [selectedEduType]: {
              ...targetObj,
              options: [...currentOpts, trimmed]
            }
          }
        }
      };
    });
    setNewEduOptionName('');
  };

  const handleDeleteEduOption = (eduKey, optIndex) => {
    setOnboardingConfig(prev => {
      const currentEduData = prev.step2?.educationData || DEFAULT_EDUCATION_DATA;
      const targetObj = currentEduData[eduKey] || { category: 'higher', options: [] };
      const currentOpts = [...(targetObj.options || [])];
      currentOpts.splice(optIndex, 1);
      return {
        ...prev,
        step2: {
          ...prev.step2,
          educationData: {
            ...currentEduData,
            [eduKey]: {
              ...targetObj,
              options: currentOpts
            }
          }
        }
      };
    });
  };

  const handleResetEducationData = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        educationData: DEFAULT_EDUCATION_DATA,
        educationTypes: Object.keys(DEFAULT_EDUCATION_DATA)
      }
    }));
    setSelectedEduType('10th');
  };

  const handleEduDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedEduIndex(index);
  };

  const handleEduDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverEduIndex !== index) {
      setDragOverEduIndex(index);
    }
  };

  const handleEduDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedEduIndex === null || draggedEduIndex === dropIndex) {
      setDraggedEduIndex(null);
      setDragOverEduIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentEduData = prev.step2?.educationData || DEFAULT_EDUCATION_DATA;
      const entries = Object.entries(currentEduData);
      const [draggedItem] = entries.splice(draggedEduIndex, 1);
      entries.splice(dropIndex, 0, draggedItem);
      const reordered = Object.fromEntries(entries);
      return {
        ...prev,
        step2: {
          ...prev.step2,
          educationData: reordered,
          educationTypes: Object.keys(reordered)
        }
      };
    });

    setDraggedEduIndex(null);
    setDragOverEduIndex(null);
  };

  const handleEduDragEnd = () => {
    setDraggedEduIndex(null);
    setDragOverEduIndex(null);
  };

  // Course Types Handlers
  const handleAddCourseTypeOption = () => {
    const trimmed = newCourseTypeOption.trim();
    if (!trimmed) return;
    setOnboardingConfig(prev => {
      const currentList = prev.step2?.courseTypeOptions || DEFAULT_COURSE_TYPE_OPTIONS;
      if (currentList.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        step2: {
          ...prev.step2,
          courseTypeOptions: [...currentList, trimmed]
        }
      };
    });
    setNewCourseTypeOption('');
  };

  const handleDeleteCourseTypeOption = (idxToDelete) => {
    setOnboardingConfig(prev => {
      const currentList = prev.step2?.courseTypeOptions || DEFAULT_COURSE_TYPE_OPTIONS;
      const updated = currentList.filter((_, idx) => idx !== idxToDelete);
      return {
        ...prev,
        step2: {
          ...prev.step2,
          courseTypeOptions: updated
        }
      };
    });
  };

  const handleResetCourseTypeOptions = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        courseTypeOptions: DEFAULT_COURSE_TYPE_OPTIONS
      }
    }));
  };

  const handleCourseTypeDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedCourseTypeIndex(index);
  };

  const handleCourseTypeDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCourseTypeIndex !== index) {
      setDragOverCourseTypeIndex(index);
    }
  };

  const handleCourseTypeDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedCourseTypeIndex === null || draggedCourseTypeIndex === dropIndex) {
      setDraggedCourseTypeIndex(null);
      setDragOverCourseTypeIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = [...(prev.step2?.courseTypeOptions || DEFAULT_COURSE_TYPE_OPTIONS)];
      const [draggedItem] = currentList.splice(draggedCourseTypeIndex, 1);
      currentList.splice(dropIndex, 0, draggedItem);
      return {
        ...prev,
        step2: {
          ...prev.step2,
          courseTypeOptions: currentList
        }
      };
    });

    setDraggedCourseTypeIndex(null);
    setDragOverCourseTypeIndex(null);
  };

  const handleCourseTypeDragEnd = () => {
    setDraggedCourseTypeIndex(null);
    setDragOverCourseTypeIndex(null);
  };

  // School Medium Types Handlers (Step 2)
  const handleAddMediumOption = () => {
    const trimmed = newMediumOption.trim();
    if (!trimmed) return;
    setOnboardingConfig(prev => {
      const currentList = prev.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS;
      if (currentList.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        step2: {
          ...prev.step2,
          mediumOptions: [...currentList, trimmed]
        }
      };
    });
    setNewMediumOption('');
  };

  const handleDeleteMediumOption = (idxToDelete) => {
    setOnboardingConfig(prev => {
      const currentList = prev.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS;
      const updated = currentList.filter((_, idx) => idx !== idxToDelete);
      return {
        ...prev,
        step2: {
          ...prev.step2,
          mediumOptions: updated
        }
      };
    });
  };

  const handleResetMediumOptions = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        mediumOptions: DEFAULT_MEDIUM_OPTIONS
      }
    }));
  };

  const handleMediumDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedMediumIndex(index);
  };

  const handleMediumDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverMediumIndex !== index) {
      setDragOverMediumIndex(index);
    }
  };

  const handleMediumDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedMediumIndex === null || draggedMediumIndex === dropIndex) {
      setDraggedMediumIndex(null);
      setDragOverMediumIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = [...(prev.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS)];
      const [draggedItem] = currentList.splice(draggedMediumIndex, 1);
      currentList.splice(dropIndex, 0, draggedItem);
      return {
        ...prev,
        step2: {
          ...prev.step2,
          mediumOptions: currentList
        }
      };
    });

    setDraggedMediumIndex(null);
    setDragOverMediumIndex(null);
  };

  const handleMediumDragEnd = () => {
    setDraggedMediumIndex(null);
    setDragOverMediumIndex(null);
  };

  // Employment Type Handlers (Step 3)
  const handleAddEmploymentTypeOption = () => {
    const trimmed = newEmploymentTypeOption.trim();
    if (!trimmed) return;
    setOnboardingConfig(prev => {
      const currentList = prev.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS;
      if (currentList.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        step3: {
          ...prev.step3,
          employmentTypeOptions: [...currentList, trimmed]
        }
      };
    });
    setNewEmploymentTypeOption('');
  };

  const handleDeleteEmploymentTypeOption = (idxToDelete) => {
    setOnboardingConfig(prev => {
      const currentList = prev.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS;
      const updated = currentList.filter((_, idx) => idx !== idxToDelete);
      return {
        ...prev,
        step3: {
          ...prev.step3,
          employmentTypeOptions: updated
        }
      };
    });
  };

  const handleResetEmploymentTypeOptions = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step3: {
        ...prev.step3,
        employmentTypeOptions: DEFAULT_EMPLOYMENT_TYPE_OPTIONS
      }
    }));
  };

  const handleEmploymentTypeDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedEmploymentTypeIndex(index);
  };

  const handleEmploymentTypeDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverEmploymentTypeIndex !== index) {
      setDragOverEmploymentTypeIndex(index);
    }
  };

  const handleEmploymentTypeDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedEmploymentTypeIndex === null || draggedEmploymentTypeIndex === dropIndex) {
      setDraggedEmploymentTypeIndex(null);
      setDragOverEmploymentTypeIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = [...(prev.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS)];
      const [draggedItem] = currentList.splice(draggedEmploymentTypeIndex, 1);
      currentList.splice(dropIndex, 0, draggedItem);
      return {
        ...prev,
        step3: {
          ...prev.step3,
          employmentTypeOptions: currentList
        }
      };
    });

    setDraggedEmploymentTypeIndex(null);
    setDragOverEmploymentTypeIndex(null);
  };

  const handleEmploymentTypeDragEnd = () => {
    setDraggedEmploymentTypeIndex(null);
    setDragOverEmploymentTypeIndex(null);
  };

  // Notice Period Handlers (Step 3 & Step 4)
  const handleAddNoticePeriodOption = () => {
    const trimmed = newNoticePeriodOption.trim();
    if (!trimmed) return;
    setOnboardingConfig(prev => {
      const currentList = prev.step3?.noticePeriodOptions || prev.step4?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS;
      if (currentList.some(o => o.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      const updated = [...currentList, trimmed];
      return {
        ...prev,
        step3: {
          ...prev.step3,
          noticePeriodOptions: updated
        },
        step4: {
          ...prev.step4,
          noticePeriodOptions: updated
        }
      };
    });
    setNewNoticePeriodOption('');
  };

  const handleDeleteNoticePeriodOption = (idxToDelete) => {
    setOnboardingConfig(prev => {
      const currentList = prev.step3?.noticePeriodOptions || prev.step4?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS;
      const updated = currentList.filter((_, idx) => idx !== idxToDelete);
      return {
        ...prev,
        step3: {
          ...prev.step3,
          noticePeriodOptions: updated
        },
        step4: {
          ...prev.step4,
          noticePeriodOptions: updated
        }
      };
    });
  };

  const handleResetNoticePeriodOptions = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step3: {
        ...prev.step3,
        noticePeriodOptions: DEFAULT_NOTICE_PERIOD_OPTIONS
      },
      step4: {
        ...prev.step4,
        noticePeriodOptions: DEFAULT_NOTICE_PERIOD_OPTIONS
      }
    }));
  };

  const handleNoticePeriodDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedNoticePeriodIndex(index);
  };

  const handleNoticePeriodDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverNoticePeriodIndex !== index) {
      setDragOverNoticePeriodIndex(index);
    }
  };

  const handleNoticePeriodDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedNoticePeriodIndex === null || draggedNoticePeriodIndex === dropIndex) {
      setDraggedNoticePeriodIndex(null);
      setDragOverNoticePeriodIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = [...(prev.step3?.noticePeriodOptions || prev.step4?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS)];
      const [draggedItem] = currentList.splice(draggedNoticePeriodIndex, 1);
      currentList.splice(dropIndex, 0, draggedItem);
      return {
        ...prev,
        step3: {
          ...prev.step3,
          noticePeriodOptions: currentList
        },
        step4: {
          ...prev.step4,
          noticePeriodOptions: currentList
        }
      };
    });

    setDraggedNoticePeriodIndex(null);
    setDragOverNoticePeriodIndex(null);
  };

  const handleNoticePeriodDragEnd = () => {
    setDraggedNoticePeriodIndex(null);
    setDragOverNoticePeriodIndex(null);
  };

  // Grading Systems Handlers
  const handleAddGradingSystem = () => {
    const trimmedName = newGradingName.trim();
    if (!trimmedName) return;
    setOnboardingConfig(prev => {
      const currentList = normalizeGradingSystems(prev.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS);
      if (currentList.some(o => o.name.toLowerCase() === trimmedName.toLowerCase())) {
        return prev;
      }
      const newObj = {
        name: trimmedName,
        label: newGradingLabel.trim() || `${trimmedName} Score`,
        placeholder: newGradingPlaceholder.trim() || 'Enter grade or marks'
      };
      return {
        ...prev,
        step2: {
          ...prev.step2,
          gradingSystems: [...currentList, newObj]
        }
      };
    });
    setNewGradingName('');
    setNewGradingLabel('');
    setNewGradingPlaceholder('');
  };

  const handleUpdateGradingItem = (index, field, value) => {
    setOnboardingConfig(prev => {
      const currentList = normalizeGradingSystems(prev.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS);
      const updated = currentList.map((item, idx) => {
        if (idx === index) {
          return { ...item, [field]: value };
        }
        return item;
      });
      return {
        ...prev,
        step2: {
          ...prev.step2,
          gradingSystems: updated
        }
      };
    });
  };

  const handleDeleteGradingSystem = (idxToDelete) => {
    setOnboardingConfig(prev => {
      const currentList = normalizeGradingSystems(prev.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS);
      const updated = currentList.filter((_, idx) => idx !== idxToDelete);
      return {
        ...prev,
        step2: {
          ...prev.step2,
          gradingSystems: updated
        }
      };
    });
  };

  const handleResetGradingSystems = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        gradingSystems: DEFAULT_GRADING_SYSTEMS
      }
    }));
  };

  const handleGradingDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedGradingIndex(index);
  };

  const handleGradingDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverGradingIndex !== index) {
      setDragOverGradingIndex(index);
    }
  };

  const handleGradingDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedGradingIndex === null || draggedGradingIndex === dropIndex) {
      setDraggedGradingIndex(null);
      setDragOverGradingIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = [...normalizeGradingSystems(prev.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS)];
      const [draggedItem] = currentList.splice(draggedGradingIndex, 1);
      currentList.splice(dropIndex, 0, draggedItem);
      return {
        ...prev,
        step2: {
          ...prev.step2,
          gradingSystems: currentList
        }
      };
    });

    setDraggedGradingIndex(null);
    setDragOverGradingIndex(null);
  };

  const handleGradingDragEnd = () => {
    setDraggedGradingIndex(null);
    setDragOverGradingIndex(null);
  };

  // Key Skills Options Handlers (Step 4)
  const handleAddSkillOption = () => {
    const raw = newSkillOption.trim();
    if (!raw) return;
    
    // Support adding comma-separated skills in bulk
    const itemsToAdd = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (itemsToAdd.length === 0) return;

    setOnboardingConfig(prev => {
      const currentList = prev.step4?.skillsOptions || DEFAULT_SKILLS_OPTIONS;
      const lowerExisting = new Set(currentList.map(s => s.toLowerCase()));
      const uniqueNew = itemsToAdd.filter(item => !lowerExisting.has(item.toLowerCase()));

      if (uniqueNew.length === 0) {
        return prev;
      }

      return {
        ...prev,
        step4: {
          ...prev.step4,
          skillsOptions: [...currentList, ...uniqueNew]
        }
      };
    });
    setNewSkillOption('');
  };

  const handleDeleteSkillOption = (idxToDelete) => {
    setOnboardingConfig(prev => {
      const currentList = prev.step4?.skillsOptions || DEFAULT_SKILLS_OPTIONS;
      const updated = currentList.filter((_, idx) => idx !== idxToDelete);
      return {
        ...prev,
        step4: {
          ...prev.step4,
          skillsOptions: updated
        }
      };
    });
  };

  const handleResetSkillsOptions = () => {
    setOnboardingConfig(prev => ({
      ...prev,
      step4: {
        ...prev.step4,
        skillsOptions: DEFAULT_SKILLS_OPTIONS
      }
    }));
  };

  const handleSkillDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedSkillIndex(index);
  };

  const handleSkillDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSkillIndex !== index) {
      setDragOverSkillIndex(index);
    }
  };

  const handleSkillDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedSkillIndex === null || draggedSkillIndex === dropIndex) {
      setDraggedSkillIndex(null);
      setDragOverSkillIndex(null);
      return;
    }

    setOnboardingConfig(prev => {
      const currentList = [...(prev.step4?.skillsOptions || DEFAULT_SKILLS_OPTIONS)];
      const [draggedItem] = currentList.splice(draggedSkillIndex, 1);
      currentList.splice(dropIndex, 0, draggedItem);
      return {
        ...prev,
        step4: {
          ...prev.step4,
          skillsOptions: currentList
        }
      };
    });

    setDraggedSkillIndex(null);
    setDragOverSkillIndex(null);
  };

  const handleSkillDragEnd = () => {
    setDraggedSkillIndex(null);
    setDragOverSkillIndex(null);
  };

  // Save Config to Backend
  const handleSave = async (customOnboarding) => {
    try {
      if (customOnboarding && typeof customOnboarding.preventDefault === 'function') {
        customOnboarding.preventDefault();
      }
      setSaving(true);
      setToastMessage('');
      setErrorMessage('');

      // Check if customOnboarding is an actual onboarding configuration object, not a React SyntheticEvent
      const isConfigObject = customOnboarding && 
        typeof customOnboarding === 'object' && 
        !customOnboarding.nativeEvent && 
        !customOnboarding.target && 
        !customOnboarding._reactName &&
        (customOnboarding.step1 || customOnboarding.step2 || customOnboarding.header || customOnboarding.buttons);

      const targetOnboarding = isConfigObject ? customOnboarding : onboardingConfig;

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeRegister: registerConfig,
          employeeLogin: loginConfig,
          employeeOnboarding: targetOnboarding
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage('Employee controls & text settings saved successfully!');
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        setErrorMessage(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      setErrorMessage('Unable to connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const sidebarSections = [
    { id: 'auth', label: 'Authentication', icon: ShieldCheck },
    { id: 'onboarding', label: 'Onboarding', icon: UserCheck },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard }
  ];

  const fieldKeys = [
    { key: 'name', title: 'Full Name' },
    { key: 'email', title: 'Email ID' },
    { key: 'mobile', title: 'Mobile Number' },
    { key: 'password', title: 'Password' },
    { key: 'confirmPassword', title: 'Confirm Password' }
  ];

  const loginFieldKeys = [
    { key: 'email', title: 'Email ID' },
    { key: 'password', title: 'Password' }
  ];

  const onboardingSteps = [
    { id: 'step1', stepNumber: 'Step 1', title: 'Basic Details', icon: Users },
    { id: 'step2', stepNumber: 'Step 2', title: 'Education', icon: GraduationCap },
    { id: 'step3', stepNumber: 'Step 3', title: 'Work Experience', icon: Briefcase },
    { id: 'step4', stepNumber: 'Step 4', title: 'Key Skills', icon: Award },
    { id: 'step5', stepNumber: 'Step 5', title: 'Documents & Media', icon: FileUp },
    { id: 'step6', stepNumber: 'Step 6', title: 'Final Review', icon: CheckSquare }
  ];

  const step1FieldKeys = [
    { key: 'firstName', title: 'First Name' },
    { key: 'lastName', title: 'Last Name' },
    { key: 'phone', title: 'Phone Number' },
    { key: 'email', title: 'Email (Read Only)' },
    { key: 'industry', title: 'Function' },
    { key: 'designation', title: 'Designation / Role' },
    { key: 'totalExperience', title: 'Total Experience' },
    { key: 'location', title: 'Current Location' },
    { key: 'preferredLocation', title: 'Preferred Location' },
    { key: 'brief', title: 'Brief about yourself' }
  ];

  const step2FieldKeys = [
    { key: 'educationType', title: 'Education' },
    { key: 'board', title: 'Board' },
    { key: 'university', title: 'University / Institute' },
    { key: 'course', title: 'Course' },
    { key: 'schoolMedium', title: 'Medium' },
    { key: 'courseType', title: 'Course Type' },
    { key: 'duration', title: 'Duration' },
    { key: 'gradingSystem', title: 'Grading System' }
  ];

  const step3FieldKeys = [
    { key: 'companyName', title: 'Company Name' },
    { key: 'jobTitle', title: 'Job Title / Role' },
    { key: 'employmentType', title: 'Employment Type' },
    { key: 'joiningDate', title: 'Joining Date' },
    { key: 'leavingDate', title: 'Leaving Date' },
    { key: 'currentCompany', title: 'Currently Working Here' },
    { key: 'roleDescription', title: 'Roles & Responsibilities' },
    { key: 'noticePeriod', title: 'Notice Period' }
  ];

  const step4FieldKeys = [
    { key: 'linkedinUrl', title: 'LinkedIn Profile' },
    { key: 'salaryType', title: 'Salary Type' },
    { key: 'currency', title: 'Currency' },
    { key: 'currentSalary', title: 'Current Annual CTC' },
    { key: 'expectedSalary', title: 'Expected Annual CTC' },
    { key: 'skills', title: 'Key Skills' }
  ];

  const step5FieldKeys = [
    { key: 'resume', title: 'Upload Resume', defaultLabel: 'Resume (PDF/DOCX)', defaultPlaceholder: 'Supported Formats: doc, docx, pdf, upto 300KB', defaultRequired: true },
    { key: 'coverLetter', title: 'Upload Cover Letter', defaultLabel: 'Cover Letter', defaultPlaceholder: 'Supported Formats: doc, docx, pdf, upto 300KB', defaultRequired: false },
    { key: 'introVideo', title: 'Introductory Video', defaultLabel: 'Introductory Video', defaultPlaceholder: 'Short video introducing yourself (1–2 mins). Supports MP4, MOV, WebM (Max 100MB) or link.', defaultRequired: false }
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-[#f8fafc]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-[100] bg-emerald-700 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 right-8 z-[100] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-white border-r border-gray-200/80 p-5 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Employees
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Authentication & Onboarding Controls
          </p>
        </div>

        <nav className="space-y-1.5 flex-1">
          {sidebarSections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-gray-400'}`} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-6 lg:p-8 space-y-8">

        {/* 1. Authentication Section */}
        {activeSection === 'auth' && (
          <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
            
            {/* Top Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-xs w-fit">
              <button
                type="button"
                onClick={() => setAuthSubTab('login')}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  authSubTab === 'login'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthSubTab('register')}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  authSubTab === 'register'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Register</span>
              </button>
            </div>

            {/* SubTab 1: REGISTER */}
            {authSubTab === 'register' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                      <FileText className="w-7 h-7 text-emerald-600" />
                      Employee Register Page Controls
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Customize text labels, placeholders, and toggle mandatory (<span className="text-red-500 font-bold">*</span>) fields for candidate registration.
                    </p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Register Settings</span>
                  </button>
                </div>

                {loading ? (
                  <div className="py-20 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                    <span>Loading registration controls...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Modal Header & Button Texts
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Modal Title</label>
                            <input
                              type="text"
                              value={registerConfig.modalTitle || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, modalTitle: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Google Button Text</label>
                            <input
                              type="text"
                              value={registerConfig.googleBtnText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, googleBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Submit Button Text</label>
                            <input
                              type="text"
                              value={registerConfig.submitBtnText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, submitBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Divider Text</label>
                            <input
                              type="text"
                              value={registerConfig.dividerText || ''}
                              onChange={(e) => setRegisterConfig(prev => ({ ...prev, dividerText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <Lock className="w-4 h-4 text-emerald-600" />
                              Registration Fields Text Controls
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Customize field labels, placeholders, and toggle mandatory status.</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {fieldKeys.map(item => {
                            const fieldData = registerConfig.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                            const isReq = fieldData.isRequired !== false;
                            return (
                              <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                    {item.title}
                                    {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleMandatoryToggle(item.key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                      isReq
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}
                                  >
                                    {isReq ? (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Mandatory (*)
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Optional
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.label || ''}
                                      onChange={(e) => handleFieldChange(item.key, 'label', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.placeholder || ''}
                                      onChange={(e) => handleFieldChange(item.key, 'placeholder', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                      <div className="sticky top-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Modal Preview</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Real-time</span>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-5 text-left">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">{registerConfig.modalTitle || 'Register'}</h2>
                          </div>

                          <div className="py-2.5 px-4 border border-gray-200 rounded-full text-xs font-bold text-gray-700 flex items-center justify-center gap-2 bg-gray-50/50">
                            <span>🌐</span> {registerConfig.googleBtnText || 'Continue with Google'}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="uppercase tracking-widest">{registerConfig.dividerText || 'Or'}</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>

                          <div className="space-y-3 text-xs">
                            {fieldKeys.map(item => {
                              const fData = registerConfig.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                              return (
                                <div key={item.key} className="space-y-1">
                                  <label className="block font-bold text-gray-800">
                                    {fData.label}
                                    {fData.isRequired && (
                                      <span className="text-red-500 font-bold ml-1">*</span>
                                    )}
                                  </label>
                                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-gray-400 text-xs">
                                    {fData.placeholder || 'Enter value...'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2">
                            <div className="py-3 bg-emerald-600 text-white font-bold text-xs text-center rounded-full shadow-md">
                              {registerConfig.submitBtnText || 'Register now'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SubTab 2: LOGIN */}
            {authSubTab === 'login' && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                  <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                      <LogIn className="w-7 h-7 text-emerald-600" />
                      Employee Login Page Controls
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Customize text labels, placeholders, and button texts for candidate login. Email and Password are mandatory by default (<span className="text-red-500 font-bold">*</span>).
                    </p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Login Settings</span>
                  </button>
                </div>

                {loading ? (
                  <div className="py-20 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                    <span>Loading login controls...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Modal Header & Button Texts
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Modal Title</label>
                            <input
                              type="text"
                              value={loginConfig.modalTitle || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, modalTitle: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Google Button Text</label>
                            <input
                              type="text"
                              value={loginConfig.googleBtnText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, googleBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Submit Button Text</label>
                            <input
                              type="text"
                              value={loginConfig.submitBtnText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, submitBtnText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Divider Text</label>
                            <input
                              type="text"
                              value={loginConfig.dividerText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, dividerText: e.target.value }))}
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block font-bold text-gray-700 mb-1">OTP Button Text</label>
                            <input
                              type="text"
                              value={loginConfig.otpBtnText || ''}
                              onChange={(e) => setLoginConfig(prev => ({ ...prev, otpBtnText: e.target.value }))}
                              placeholder="Use OTP to Login"
                              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <div>
                            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <Lock className="w-4 h-4 text-emerald-600" />
                              Login Fields Text Controls
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">Customize text labels and placeholder texts for login inputs. Mandatory by default (<span className="text-red-500 font-bold">*</span>).</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {loginFieldKeys.map(item => {
                            const fieldData = loginConfig.fields?.[item.key] || { label: item.title, placeholder: '' };
                            return (
                              <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                    {item.title}
                                    <span className="text-red-500 text-sm font-bold">*</span>
                                  </span>

                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Mandatory by default
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.label || ''}
                                      onChange={(e) => handleLoginFieldChange(item.key, 'label', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                    <input
                                      type="text"
                                      value={fieldData.placeholder || ''}
                                      onChange={(e) => handleLoginFieldChange(item.key, 'placeholder', e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    <div className="lg:col-span-5 space-y-4">
                      <div className="sticky top-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Modal Preview</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Real-time</span>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 space-y-5 text-left">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">{loginConfig.modalTitle || 'Employee Login'}</h2>
                          </div>

                          <div className="py-2.5 px-4 border border-gray-200 rounded-full text-xs font-bold text-gray-700 flex items-center justify-center gap-2 bg-gray-50/50">
                            <span>🌐</span> {loginConfig.googleBtnText || 'Continue with Google'}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="uppercase tracking-widest">{loginConfig.dividerText || 'Or with email'}</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                          </div>

                          <div className="space-y-3 text-xs">
                            {loginFieldKeys.map(item => {
                              const fData = loginConfig.fields?.[item.key] || { label: item.title, placeholder: '' };
                              return (
                                <div key={item.key} className="space-y-1">
                                  <label className="block font-bold text-gray-800">
                                    {fData.label}
                                    <span className="text-red-500 font-bold ml-1">*</span>
                                  </label>
                                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-gray-400 text-xs">
                                    {fData.placeholder || 'Enter value...'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 space-y-3">
                            <div className="py-3 bg-emerald-800 text-white font-bold text-xs text-center rounded-full shadow-md">
                              {loginConfig.submitBtnText || 'Login'}
                            </div>

                            <div className="text-center">
                              <span className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                                {loginConfig.otpBtnText || 'Use OTP to Login'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* 2. Onboarding Section */}
        {activeSection === 'onboarding' && (
          <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
            
            {/* Header with Save Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                  <UserCheck className="w-7 h-7 text-emerald-600" />
                  Employee Onboarding Controls
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Customize step headers, labels, placeholders, and toggle mandatory (<span className="text-red-500 font-bold">*</span>) fields across all onboarding steps.
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Onboarding Settings</span>
              </button>
            </div>

            {/* Top Sub-Navigation Steps Bar */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200/80 shadow-xs overflow-x-auto custom-scrollbar">
              {onboardingSteps.map(step => {
                const Icon = step.icon;
                const isActive = onboardingSubTab === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setOnboardingSubTab(step.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{step.stepNumber}: {step.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Global Header & Action Buttons Control Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Global Page Header & Navigation Button Texts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Page Title</label>
                  <input
                    type="text"
                    value={onboardingConfig.header?.title || ''}
                    onChange={(e) => setOnboardingConfig(prev => ({ ...prev, header: { ...prev.header, title: e.target.value } }))}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Next Button Text</label>
                  <input
                    type="text"
                    value={onboardingConfig.buttons?.nextBtnText || ''}
                    onChange={(e) => setOnboardingConfig(prev => ({ ...prev, buttons: { ...prev.buttons, nextBtnText: e.target.value } }))}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Submit Button Text</label>
                  <input
                    type="text"
                    value={onboardingConfig.buttons?.submitBtnText || ''}
                    onChange={(e) => setOnboardingConfig(prev => ({ ...prev, buttons: { ...prev.buttons, submitBtnText: e.target.value } }))}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* STEP 1: BASIC DETAILS */}
            {onboardingSubTab === 'step1' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                {/* Left 7 Columns: Step 1 Controls */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600" />
                          Step 1: Basic Details Controls
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Customize labels, placeholders, and toggle required fields for Step 1.</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Section Header Title</label>
                      <input
                        type="text"
                        value={onboardingConfig.step1?.title || ''}
                        onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step1: { ...prev.step1, title: e.target.value } }))}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-4 pt-2">
                      {step1FieldKeys.map(item => {
                        const fieldData = onboardingConfig.step1?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                        const isReq = fieldData.isRequired !== false;
                        return (
                          <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                {item.title}
                                {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                              </span>

                              <div className="flex items-center gap-2">
                                {item.key === 'industry' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsFunctionsModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Functions & Designation Roles Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Functions & Roles</span>
                                  </button>
                                )}

                                {item.key === 'totalExperience' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsExperienceModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Total Experience Options Editor"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Experience Ranges</span>
                                  </button>
                                )}

                                {(item.key === 'location' || item.key === 'preferredLocation') && (
                                  <button
                                    type="button"
                                    onClick={() => setIsLocationsModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Pre-visible Cities Editor (Current & Preferred Location)"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Cities List</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOnboardingMandatoryToggle('step1', item.key)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                    isReq
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                                  }`}
                                >
                                  {isReq ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      Mandatory (*)
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                      Optional
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                <input
                                  type="text"
                                  value={fieldData.label || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step1', item.key, 'label', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                <input
                                  type="text"
                                  value={fieldData.placeholder || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step1', item.key, 'placeholder', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Functions & Roles Management Modal Popup */}
                {isFunctionsModalOpen && (
                  <div 
                    className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setIsFunctionsModalOpen(false)}
                  >
                    <div 
                      className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              Functions & Designation Roles
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Add custom functions and configure their specific linked designation / job roles.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleResetFunctions}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Reset all functions and roles to standard default dictionary"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset to Defaults</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              await handleSave();
                              setIsFunctionsModalOpen(false);
                            }}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Save Changes</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsFunctionsModalOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                            title="Close popup"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Modal Body: 2-Column Split Manager */}
                      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                          
                          {/* Left Sub-Column (5 Cols): Function List & Add Function */}
                          <div className="md:col-span-5 space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/70">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                                Functions ({Object.keys(onboardingConfig.step1?.functionsData || DEFAULT_FUNCTIONS_DATA).length})
                              </span>
                            </div>

                            {/* Add Function Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="New function..."
                                value={newFunctionName}
                                onChange={(e) => setNewFunctionName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFunction(); } }}
                                className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={handleAddFunction}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </button>
                            </div>

                            {/* Function Items List with Drag & Drop Reordering */}
                            <div 
                              className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1"
                              onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                  setDragOverFunctionIndex(null);
                                }
                              }}
                            >
                              {Object.keys(onboardingConfig.step1?.functionsData || DEFAULT_FUNCTIONS_DATA).map((funcName, fIdx) => {
                                const isSelected = selectedFunction === funcName;
                                const isDragging = draggedFunctionIndex === fIdx;
                                const isDragOver = dragOverFunctionIndex === fIdx && draggedFunctionIndex !== fIdx;
                                const roleCount = ((onboardingConfig.step1?.functionsData || DEFAULT_FUNCTIONS_DATA)[funcName] || []).length;
                                return (
                                  <div
                                    key={funcName}
                                    draggable
                                    onDragStart={(e) => handleFunctionDragStart(e, fIdx)}
                                    onDragOver={(e) => handleFunctionDragOver(e, fIdx)}
                                    onDrop={(e) => handleFunctionDrop(e, fIdx)}
                                    onDragEnd={handleFunctionDragEnd}
                                    onClick={() => setSelectedFunction(funcName)}
                                    className={`relative flex items-center justify-between p-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 select-none ${
                                      isDragging
                                        ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                        : isDragOver
                                        ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                        : isSelected
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-white hover:bg-emerald-50/60 text-gray-700 border border-gray-200/80 hover:border-emerald-300'
                                    }`}
                                  >
                                    {/* Visual Drop Placement Preview Line */}
                                    {isDragOver && (
                                      <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                    )}

                                    <div className="flex items-center gap-1.5 truncate">
                                      {/* Drag Handle Icon */}
                                      <span 
                                        className={`cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors ${
                                          isSelected ? 'text-emerald-200 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                                        }`}
                                        title="Drag to change position"
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </span>

                                      <span className="truncate">{funcName}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                        isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-100 text-gray-500'
                                      }`}>
                                        {roleCount}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFunction(funcName);
                                      }}
                                      className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${
                                        isSelected ? 'text-emerald-200' : 'text-gray-400 hover:text-red-600'
                                      }`}
                                      title={`Delete function "${funcName}"`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Sub-Column (7 Cols): Designation Roles for Selected Function */}
                          <div className="md:col-span-7 space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/70">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 truncate">
                                <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                Roles in <span className="text-emerald-700 font-extrabold truncate">"{selectedFunction || 'None'}"</span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                                  {((onboardingConfig.step1?.functionsData || DEFAULT_FUNCTIONS_DATA)[selectedFunction] || []).length} Roles
                                </span>
                              </span>
                            </div>

                            {/* Add Role Input */}
                            {selectedFunction ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Add role to ${selectedFunction}...`}
                                  value={newRoleName}
                                  onChange={(e) => setNewRoleName(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRole(); } }}
                                  className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddRole}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Role</span>
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Select a function from the left to manage designations.</p>
                            )}

                            {/* Roles Pills Grid */}
                            <div className="min-h-[160px] max-h-72 overflow-y-auto custom-scrollbar p-3 bg-white border border-gray-200/80 rounded-xl">
                              {((onboardingConfig.step1?.functionsData || DEFAULT_FUNCTIONS_DATA)[selectedFunction] || []).length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-8">
                                  <Tag className="w-6 h-6 text-gray-300 mb-1" />
                                  <span className="text-xs font-medium">No designations added for this function yet.</span>
                                  <span className="text-[11px] text-gray-400 mt-0.5">Type above and click "Add Role"</span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {((onboardingConfig.step1?.functionsData || DEFAULT_FUNCTIONS_DATA)[selectedFunction] || []).map((role, rIdx) => (
                                    <span
                                      key={rIdx}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-[11px] font-bold"
                                    >
                                      <span>{role}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteRole(selectedFunction, rIdx)}
                                        className="text-emerald-500 hover:text-red-600 transition-colors p-0.5 rounded cursor-pointer"
                                        title="Remove designation"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">
                          Click <strong className="text-emerald-700">"Save & Apply"</strong> to persist your functions & roles to the database.
                        </span>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsFunctionsModalOpen(false)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await handleSave();
                              setIsFunctionsModalOpen(false);
                            }}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Save & Apply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Experience Options Management Modal Popup */}
                {isExperienceModalOpen && (
                  <div 
                    className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setIsExperienceModalOpen(false)}
                  >
                    <div 
                      className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              Total Experience Options
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Add, remove, or drag & drop to reorder experience year ranges for candidates.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleResetExperienceOptions}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Reset to standard experience ranges"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Defaults</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              await handleSave();
                              setIsExperienceModalOpen(false);
                            }}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Save Changes</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsExperienceModalOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                            title="Close popup"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                        {/* Add Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add new experience range (e.g. 30+ yrs, 0 - 6 Months)..."
                            value={newExperienceOption}
                            onChange={(e) => setNewExperienceOption(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddExperienceOption(); } }}
                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                          />
                          <button
                            type="button"
                            onClick={handleAddExperienceOption}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Range</span>
                          </button>
                        </div>

                        {/* Reorderable Items List */}
                        <div 
                          className="space-y-2 pt-2"
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              setDragOverExpIndex(null);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
                            <span>Current Options ({(onboardingConfig.step1?.experienceOptions || DEFAULT_EXPERIENCE_OPTIONS).length})</span>
                            <span className="text-[11px] text-gray-400">Drag items by handle to reorder</span>
                          </div>

                          {(onboardingConfig.step1?.experienceOptions || DEFAULT_EXPERIENCE_OPTIONS).map((opt, idx) => {
                            const isDragging = draggedExpIndex === idx;
                            const isDragOver = dragOverExpIndex === idx && draggedExpIndex !== idx;

                            return (
                              <div
                                key={opt + idx}
                                draggable
                                onDragStart={(e) => handleExpDragStart(e, idx)}
                                onDragOver={(e) => handleExpDragOver(e, idx)}
                                onDrop={(e) => handleExpDrop(e, idx)}
                                onDragEnd={handleExpDragEnd}
                                className={`relative flex items-center justify-between p-3 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 select-none ${
                                  isDragging
                                    ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                    : isDragOver
                                    ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                    : 'bg-white hover:bg-emerald-50/50 text-gray-800 border border-gray-200 shadow-2xs hover:border-emerald-300'
                                }`}
                              >
                                {isDragOver && (
                                  <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                )}

                                <div className="flex items-center gap-2.5">
                                  <span 
                                    className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                    title="Drag to change position"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </span>
                                  <span className="text-gray-900 font-extrabold">{opt}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteExperienceOption(idx)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title={`Delete range "${opt}"`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">
                          Click <strong className="text-emerald-700">"Save & Apply"</strong> to save updated options to the database.
                        </span>
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsExperienceModalOpen(false)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await handleSave();
                              setIsExperienceModalOpen(false);
                            }}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Save & Apply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pre-visible Location Cities Management Modal Popup (Current & Preferred) */}
                {isLocationsModalOpen && (() => {
                  const currentCities = onboardingConfig.step1?.locationCities || DEFAULT_LOCATION_CITIES;
                  const trimmedInput = newLocationCity.trim();
                  const lowerInput = trimmedInput.toLowerCase();
                  
                  const isAnywhereInIndia = lowerInput === 'anywhere in india';
                  const isExactMatch = isAnywhereInIndia || currentCities.some(c => c.toLowerCase() === lowerInput);
                  
                  const matchingSuggestions = trimmedInput.length > 0
                    ? currentCities.filter(c => c.toLowerCase().includes(lowerInput) && c.toLowerCase() !== lowerInput)
                    : [];

                  const filteredCities = locationFilterSearch.trim()
                    ? currentCities.filter(c => c.toLowerCase().includes(locationFilterSearch.trim().toLowerCase()))
                    : currentCities;

                  return (
                    <div 
                      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                      onClick={() => setIsLocationsModalOpen(false)}
                    >
                      <div 
                        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                Pre-visible Location Cities
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Manage top visible cities for both <strong>Current Location</strong> and <strong>Preferred Location</strong> dropdowns.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={handleResetLocationCities}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              title="Reset all cities to standard default list"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reset Defaults</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsLocationsModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save Changes</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsLocationsModalOpen(false)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                              title="Close popup"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                          
                          {/* Compulsory Item Banner: Anywhere in India */}
                          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Shield className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-extrabold text-gray-900">Anywhere in India</h4>
                                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                                    Compulsory for Preferred Location
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  Automatically pinned at the top of Preferred Location. Hidden from Current Location (requires specific city).
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white/90 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0">
                              <Lock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>System Fixed</span>
                            </div>
                          </div>

                          {/* Add New City Input with Smart Suggestions & Duplicate Alerts */}
                          <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-3">
                            <label className="block text-xs font-extrabold text-gray-800 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                                Add New Pre-visible City
                              </span>
                              {trimmedInput && !isExactMatch && (
                                <span className="text-[11px] text-emerald-700 font-bold">
                                  ✓ Ready to add
                                </span>
                              )}
                            </label>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type city name (e.g., Surat, Chandigarh, Dubai, London)..."
                                value={newLocationCity}
                                onChange={(e) => setNewLocationCity(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (!isExactMatch && trimmedInput) {
                                      handleAddLocationCity();
                                    }
                                  }
                                }}
                                className={`flex-1 px-4 py-2.5 bg-white border rounded-xl text-xs font-medium focus:outline-none transition-all ${
                                  isExactMatch
                                    ? 'border-amber-400 ring-2 ring-amber-100'
                                    : 'border-gray-200 focus:border-emerald-500'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddLocationCity()}
                                disabled={!trimmedInput || isExactMatch}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add City</span>
                              </button>
                            </div>

                            {/* Duplicate Warning */}
                            {trimmedInput && isExactMatch && (
                              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium animate-in fade-in duration-150">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  <strong>"{trimmedInput}"</strong> is already present in the pre-visible cities list or is a system fixed option!
                                </span>
                              </div>
                            )}

                            {/* Similar Existing Suggestions */}
                            {matchingSuggestions.length > 0 && !isExactMatch && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-semibold text-gray-500">Matching existing cities:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {matchingSuggestions.slice(0, 6).map(sug => (
                                    <span
                                      key={sug}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-medium text-gray-700 shadow-2xs"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      {sug}
                                    </span>
                                  ))}
                                  {matchingSuggestions.length > 6 && (
                                    <span className="text-[10px] text-gray-400 self-center">
                                      +{matchingSuggestions.length - 6} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Existing Cities List with Search Filter and Drag & Drop */}
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-800">
                                  Configured Cities ({currentCities.length})
                                </span>
                                <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                                  Applies to Step 1 Form
                                </span>
                              </div>

                              {/* Search in existing list */}
                              <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Search list..."
                                  value={locationFilterSearch}
                                  onChange={(e) => setLocationFilterSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white focus:border-emerald-500"
                                />
                                {locationFilterSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setLocationFilterSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* City Items List */}
                            <div 
                              className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar p-1"
                              onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                  setDragOverLocIndex(null);
                                }
                              }}
                            >
                              {filteredCities.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                                  No cities matching "{locationFilterSearch}"
                                </div>
                              ) : (
                                filteredCities.map((city) => {
                                  const origIndex = currentCities.indexOf(city);
                                  const isDragging = draggedLocIndex === origIndex;
                                  const isDragOver = dragOverLocIndex === origIndex && draggedLocIndex !== origIndex;
                                  const isFilterActive = !!locationFilterSearch.trim();

                                  return (
                                    <div
                                      key={city + origIndex}
                                      draggable={!isFilterActive}
                                      onDragStart={(e) => !isFilterActive && handleLocDragStart(e, origIndex)}
                                      onDragOver={(e) => !isFilterActive && handleLocDragOver(e, origIndex)}
                                      onDrop={(e) => !isFilterActive && handleLocDrop(e, origIndex)}
                                      onDragEnd={handleLocDragEnd}
                                      className={`relative flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all duration-150 select-none ${
                                        isDragging
                                          ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                          : isDragOver
                                          ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                          : 'bg-white hover:bg-emerald-50/40 text-gray-800 border border-gray-200 shadow-2xs hover:border-emerald-300'
                                      }`}
                                    >
                                      {isDragOver && (
                                        <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                      )}

                                      <div className="flex items-center gap-2">
                                        {!isFilterActive && (
                                          <span 
                                            className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                            title="Drag to change display order"
                                          >
                                            <GripVertical className="w-3.5 h-3.5" />
                                          </span>
                                        )}
                                        <span className="text-[10px] text-gray-400 font-mono w-6">#{origIndex + 1}</span>
                                        <span className="text-gray-900 font-extrabold">{city}</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLocationCity(origIndex)}
                                        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        title={`Delete city "${city}"`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">
                            Click <strong className="text-emerald-700">"Save & Apply"</strong> to persist city options to the database.
                          </span>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsLocationsModalOpen(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsLocationsModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save & Apply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Right 5 Columns: Step 1 Live Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Onboarding Preview</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 1: 17% Completed</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                      {/* Top Header Card */}
                      <div className="p-5 border-b border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-black text-gray-900 text-base">{onboardingConfig.header?.title || 'Create your Profile'}</h3>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                            17% Completed
                          </span>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '17%' }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Step 1 Inner Form */}
                      <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                        <div className="border-b border-gray-200 pb-2">
                          <h4 className="font-bold text-gray-800 text-sm">{onboardingConfig.step1?.title || 'Basic Details'}</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {step1FieldKeys.map(item => {
                            const fData = onboardingConfig.step1?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                            const isColSpan2 = item.key === 'brief';
                            return (
                              <div key={item.key} className={isColSpan2 ? 'col-span-2 space-y-1' : 'space-y-1'}>
                                <label className="block font-bold text-gray-700 text-[11px]">
                                  {fData.label}
                                  {fData.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                                </label>
                                <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px] truncate shadow-2xs">
                                  {item.key === 'phone' ? '+91 ' + (fData.placeholder || '9876543210') : (fData.placeholder || 'Enter value...')}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-3 flex justify-end">
                          <div className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md text-center">
                            {onboardingConfig.buttons?.nextBtnText || 'Save & Continue'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: EDUCATION */}
            {onboardingSubTab === 'step2' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-emerald-600" />
                          Step 2: Education Controls
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Customize educational step texts, labels, and mandatory fields.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Section Header Title</label>
                        <input
                          type="text"
                          value={onboardingConfig.step2?.title || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step2: { ...prev.step2, title: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Add Button Text</label>
                        <input
                          type="text"
                          value={onboardingConfig.step2?.addBtnText || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step2: { ...prev.step2, addBtnText: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-gray-700 mb-1">Section Subtitle / Description</label>
                        <input
                          type="text"
                          value={onboardingConfig.step2?.subtitle || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step2: { ...prev.step2, subtitle: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      {step2FieldKeys.map(item => {
                        if (item.key === 'duration') {
                          const startFieldData = onboardingConfig.step2?.fields?.startYear || { label: 'Starting Year', placeholder: 'Select starting year', isRequired: true };
                          const endFieldData = onboardingConfig.step2?.fields?.endYear || { label: 'Passing Out Year', placeholder: 'Select passing out year', isRequired: true };
                          const isStartReq = startFieldData.isRequired !== false;
                          const isEndReq = endFieldData.isRequired !== false;

                          return (
                            <div key="duration" className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                  Duration (Starting Year & Passing Out Year)
                                  {(isStartReq || isEndReq) && <span className="text-red-500 text-sm font-bold">*</span>}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {/* Starting Year */}
                                <div className="p-3 bg-white rounded-lg border border-gray-200/80 space-y-2.5 shadow-2xs">
                                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                                      Starting Year
                                      {isStartReq && <span className="text-red-500 font-bold">*</span>}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOnboardingMandatoryToggle('step2', 'startYear')}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                        isStartReq
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                                      }`}
                                    >
                                      {isStartReq ? (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          Mandatory (*)
                                        </>
                                      ) : (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                          Optional
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                      <input
                                        type="text"
                                        value={startFieldData.label || ''}
                                        onChange={(e) => handleOnboardingFieldChange('step2', 'startYear', 'label', e.target.value)}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                        placeholder="Starting Year"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                      <input
                                        type="text"
                                        value={startFieldData.placeholder || ''}
                                        onChange={(e) => handleOnboardingFieldChange('step2', 'startYear', 'placeholder', e.target.value)}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                        placeholder="Select starting year"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Passing Out Year */}
                                <div className="p-3 bg-white rounded-lg border border-gray-200/80 space-y-2.5 shadow-2xs">
                                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                                    <span className="text-[11px] font-bold text-gray-800 flex items-center gap-1">
                                      Passing Out Year
                                      {isEndReq && <span className="text-red-500 font-bold">*</span>}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOnboardingMandatoryToggle('step2', 'endYear')}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                        isEndReq
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                                      }`}
                                    >
                                      {isEndReq ? (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          Mandatory (*)
                                        </>
                                      ) : (
                                        <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                          Optional
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="space-y-2 text-xs">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                      <input
                                        type="text"
                                        value={endFieldData.label || ''}
                                        onChange={(e) => handleOnboardingFieldChange('step2', 'endYear', 'label', e.target.value)}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                        placeholder="Passing Out Year"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                      <input
                                        type="text"
                                        value={endFieldData.placeholder || ''}
                                        onChange={(e) => handleOnboardingFieldChange('step2', 'endYear', 'placeholder', e.target.value)}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                        placeholder="Select passing out year"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const fieldData = onboardingConfig.step2?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                        const isReq = fieldData.isRequired !== false;
                        return (
                          <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                {item.title}
                                {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                              </span>

                              <div className="flex items-center gap-2">
                                {item.key === 'educationType' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsEducationModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Education Types Management Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Education Types</span>
                                  </button>
                                )}

                                {item.key === 'board' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedEduType('10th');
                                      setIsEducationModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open School Boards Management Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Edit School Boards</span>
                                  </button>
                                )}

                                {item.key === 'courseType' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsCourseTypeModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Course Types Management Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Course Types</span>
                                  </button>
                                )}

                                {item.key === 'schoolMedium' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsMediumModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open School Medium Options Management Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Medium Options ({((onboardingConfig.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS)).length})</span>
                                  </button>
                                )}

                                {item.key === 'gradingSystem' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsGradingModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Grading Systems Management Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Grading Systems</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOnboardingMandatoryToggle('step2', item.key)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                    isReq
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                                  }`}
                                >
                                  {isReq ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      Mandatory (*)
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                      Optional
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                <input
                                  type="text"
                                  value={fieldData.label || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step2', item.key, 'label', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                <input
                                  type="text"
                                  value={fieldData.placeholder || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step2', item.key, 'placeholder', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Education & Courses/Boards Management Modal Popup (2-Column Split Manager) */}
                {isEducationModalOpen && (() => {
                  const currentEduData = onboardingConfig.step2?.educationData || DEFAULT_EDUCATION_DATA;
                  const eduKeys = Object.keys(currentEduData);
                  const activeEdu = currentEduData[selectedEduType] || (eduKeys.length > 0 ? currentEduData[eduKeys[0]] : null);
                  const activeKey = currentEduData[selectedEduType] ? selectedEduType : (eduKeys.length > 0 ? eduKeys[0] : '');
                  const isSchoolActive = activeEdu?.category === 'school';
                  const activeOptions = activeEdu?.options || [];

                  const trimmedEduName = newEducationType.trim();
                  const isEduDuplicate = trimmedEduName && eduKeys.some(k => k.toLowerCase() === trimmedEduName.toLowerCase());

                  const trimmedOptName = newEduOptionName.trim();
                  const isOptDuplicate = trimmedOptName && activeOptions.some(o => o.toLowerCase() === trimmedOptName.toLowerCase());

                  return (
                    <div 
                      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                      onClick={() => setIsEducationModalOpen(false)}
                    >
                      <div 
                        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                Education Types & Courses / Boards
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Add education levels and configure whether candidates select Boards (School) or Courses / Degrees (Higher Education).
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsEducationModalOpen(false)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                              title="Close popup"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body: 2-Column Split Manager */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            
                            {/* Left Sub-Column (5 Cols): Education Types List & Add */}
                            <div className="md:col-span-5 space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/70">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                  <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                                  Education Types ({eduKeys.length})
                                </span>
                                <span className="text-[10px] bg-gray-200/80 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                                  Drag to reorder
                                </span>
                              </div>

                              {/* Add Education Section */}
                              <div className="space-y-2 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                                <input
                                  type="text"
                                  placeholder="New education type..."
                                  value={newEducationType}
                                  onChange={(e) => setNewEducationType(e.target.value)}
                                  onKeyDown={(e) => { 
                                    if (e.key === 'Enter') { 
                                      e.preventDefault(); 
                                      if (trimmedEduName && !isEduDuplicate) handleAddEducationType(); 
                                    } 
                                  }}
                                  className={`w-full px-3 py-1.5 bg-gray-50 border rounded-lg text-xs font-medium focus:outline-none focus:bg-white transition-all ${
                                    isEduDuplicate ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-200 focus:border-emerald-500'
                                  }`}
                                />

                                {/* Category Selector for New Education Type */}
                                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                                  <div className="inline-flex p-0.5 bg-gray-100 rounded-lg text-[11px] font-bold">
                                    <button
                                      type="button"
                                      onClick={() => setNewEduCategory('higher')}
                                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                        newEduCategory === 'higher'
                                          ? 'bg-emerald-600 text-white shadow-2xs'
                                          : 'text-gray-600 hover:text-gray-900'
                                      }`}
                                      title="Higher Education uses Courses / Degrees"
                                    >
                                      🎓 Course
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setNewEduCategory('school')}
                                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                        newEduCategory === 'school'
                                          ? 'bg-amber-600 text-white shadow-2xs'
                                          : 'text-gray-600 hover:text-gray-900'
                                      }`}
                                      title="School uses Boards"
                                    >
                                      🏫 Board
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleAddEducationType}
                                    disabled={!trimmedEduName || isEduDuplicate}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add</span>
                                  </button>
                                </div>

                                {trimmedEduName && isEduDuplicate && (
                                  <p className="text-[10px] text-amber-700 font-semibold">"{trimmedEduName}" already exists!</p>
                                )}
                              </div>

                              {/* Education Types List with Drag & Drop */}
                              <div 
                                className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1"
                                onDragLeave={(e) => {
                                  if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setDragOverEduIndex(null);
                                  }
                                }}
                              >
                                {eduKeys.map((eduKey, fIdx) => {
                                  const itemConfig = currentEduData[eduKey] || { category: 'higher', options: [] };
                                  const isSelected = activeKey === eduKey;
                                  const isDragging = draggedEduIndex === fIdx;
                                  const isDragOver = dragOverEduIndex === fIdx && draggedEduIndex !== fIdx;
                                  const isSchool = itemConfig.category === 'school';
                                  const optCount = (itemConfig.options || []).length;

                                  return (
                                    <div
                                      key={eduKey}
                                      draggable={editingEduKey !== eduKey}
                                      onDragStart={(e) => handleEduDragStart(e, fIdx)}
                                      onDragOver={(e) => handleEduDragOver(e, fIdx)}
                                      onDrop={(e) => handleEduDrop(e, fIdx)}
                                      onDragEnd={handleEduDragEnd}
                                      onClick={() => {
                                        if (editingEduKey !== eduKey) {
                                          setSelectedEduType(eduKey);
                                        }
                                      }}
                                      className={`relative flex items-center justify-between p-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 select-none ${
                                        isDragging
                                          ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                          : isDragOver
                                          ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                          : isSelected
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-white hover:bg-emerald-50/60 text-gray-700 border border-gray-200/80 hover:border-emerald-300'
                                      }`}
                                    >
                                      {/* Drop Placement Preview Line */}
                                      {isDragOver && (
                                        <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                      )}

                                      {editingEduKey === eduKey ? (
                                        <div 
                                          className="flex items-center gap-1.5 w-full"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="text"
                                            value={editingEduName}
                                            onChange={(e) => setEditingEduName(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveRenameEduType(eduKey, e);
                                              if (e.key === 'Escape') handleCancelRenameEduType(e);
                                            }}
                                            autoFocus
                                            className="flex-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-400 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                          />
                                          <button
                                            type="button"
                                            onClick={(e) => handleSaveRenameEduType(eduKey, e)}
                                            disabled={!editingEduName.trim()}
                                            className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer disabled:opacity-40"
                                            title="Save name"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleCancelRenameEduType}
                                            className="p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors cursor-pointer"
                                            title="Cancel"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center gap-1.5 truncate">
                                            {/* Drag Handle Icon */}
                                            <span 
                                              className={`cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors ${
                                                isSelected ? 'text-emerald-200 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                                              }`}
                                              title="Drag to change position"
                                              onMouseDown={(e) => e.stopPropagation()}
                                            >
                                              <GripVertical className="w-3.5 h-3.5" />
                                            </span>

                                            <span className="truncate">{eduKey}</span>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            {/* Category Badge */}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                                              isSelected
                                                ? isSchool ? 'bg-amber-500 text-white' : 'bg-emerald-700 text-emerald-100'
                                                : isSchool ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'
                                            }`}>
                                              {isSchool ? '🏫 Board' : '🎓 Course'}
                                            </span>

                                            {/* Options count */}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                              isSelected ? 'bg-emerald-800/80 text-emerald-100' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                              {optCount}
                                            </span>

                                            {/* Edit Button */}
                                            <button
                                              type="button"
                                              onClick={(e) => handleStartRenameEduType(eduKey, e)}
                                              className={`p-1 rounded hover:bg-blue-500 hover:text-white transition-colors cursor-pointer ${
                                                isSelected ? 'text-emerald-200 hover:bg-emerald-700' : 'text-gray-400 hover:text-blue-600'
                                              }`}
                                              title={`Edit text for "${eduKey}"`}
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteEducationType(eduKey);
                                              }}
                                              className={`p-1 rounded hover:bg-red-500 hover:text-white transition-colors cursor-pointer ${
                                                isSelected ? 'text-emerald-200' : 'text-gray-400 hover:text-red-600'
                                              }`}
                                              title={`Delete education type "${eduKey}"`}
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right Sub-Column (7 Cols): Courses or Boards for Selected Education Type */}
                            <div className="md:col-span-7 space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/70">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 truncate">
                                  {isSchoolActive ? (
                                    <School className="w-4 h-4 text-amber-600 shrink-0" />
                                  ) : (
                                    <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                                  )}
                                  <span className="text-xs font-bold text-gray-800 truncate">
                                    {isSchoolActive ? 'Boards' : 'Courses'} in <span className="text-emerald-700 font-extrabold truncate">"{activeKey || 'None'}"</span>
                                  </span>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                                    {activeOptions.length} {isSchoolActive ? 'Boards' : 'Courses'}
                                  </span>
                                </div>

                                {/* Category Toggle Switcher for the active education type */}
                                {activeKey && (
                                  <div className="flex items-center gap-1.5 shrink-0 bg-white px-2 py-1 rounded-xl border border-gray-200 shadow-2xs">
                                    <span className="text-[10px] font-bold text-gray-500">Show in form:</span>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleEduCategory(activeKey)}
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                                        isSchoolActive
                                          ? 'bg-amber-500 text-white shadow-xs'
                                          : 'bg-emerald-600 text-white shadow-xs'
                                      }`}
                                      title="Click to switch between School (Board) and Higher/Degree (Course)"
                                    >
                                      {isSchoolActive ? '🏫 Board Dropdown' : '🎓 Course Dropdown'}
                                      <span className="text-[9px] underline opacity-90 ml-0.5">(Switch)</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Explanatory Info Card */}
                              <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                                isSchoolActive 
                                  ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              }`}>
                                <span className="text-sm shrink-0 mt-0.5">{isSchoolActive ? '🏫' : '🎓'}</span>
                                <div>
                                  {isSchoolActive ? (
                                    <span>
                                      <strong>School Mode:</strong> Candidates who select <strong>"{activeKey}"</strong> will be asked for their <strong>Board</strong> (from the list below) along with School Medium, Marks & Passing Year.
                                    </span>
                                  ) : (
                                    <span>
                                      <strong>Higher Education Mode:</strong> Candidates who select <strong>"{activeKey}"</strong> will be asked for their <strong>University/Institute</strong> and <strong>Course</strong> (from the list below) along with Course Type & Passing Year.
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Add Option Input */}
                              {activeKey ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder={`Add new ${isSchoolActive ? 'Board (e.g. CBSE, ICSE, State Board)' : 'Course / Degree (e.g. B.Tech, M.Com, CA, MBA)'}...`}
                                      value={newEduOptionName}
                                      onChange={(e) => setNewEduOptionName(e.target.value)}
                                      onKeyDown={(e) => { 
                                        if (e.key === 'Enter') { 
                                          e.preventDefault(); 
                                          if (trimmedOptName && !isOptDuplicate) handleAddEduOption(); 
                                        } 
                                      }}
                                      className={`flex-1 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium focus:outline-none transition-all ${
                                        isOptDuplicate ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-200 focus:border-emerald-500'
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={handleAddEduOption}
                                      disabled={!trimmedOptName || isOptDuplicate}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add {isSchoolActive ? 'Board' : 'Course'}</span>
                                    </button>
                                  </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Select an education type from the left to manage options.</p>
                              )}

                              {trimmedOptName && isOptDuplicate && (
                                <p className="text-[10px] text-amber-700 font-semibold px-1">
                                  "{trimmedOptName}" is already in the {isSchoolActive ? 'board' : 'course'} list!
                                </p>
                              )}

                              {/* Options Pills Grid */}
                              <div className="min-h-[160px] max-h-72 overflow-y-auto custom-scrollbar p-3 bg-white border border-gray-200/80 rounded-xl">
                                {activeOptions.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-8">
                                    <Tag className="w-6 h-6 text-gray-300 mb-1" />
                                    <span className="text-xs font-medium">No {isSchoolActive ? 'boards' : 'courses'} added for "{activeKey}" yet.</span>
                                    <span className="text-[11px] text-gray-400 mt-0.5">
                                      Type above and click "Add {isSchoolActive ? 'Board' : 'Course'}"
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {activeOptions.map((opt, oIdx) => (
                                      <span
                                        key={oIdx}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                          isSchoolActive
                                            ? 'bg-amber-50 text-amber-900 border-amber-200/80'
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                        }`}
                                      >
                                        <span>{opt}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteEduOption(activeKey, oIdx)}
                                          className={`transition-colors p-0.5 rounded cursor-pointer ${
                                            isSchoolActive ? 'text-amber-500 hover:text-red-600' : 'text-emerald-500 hover:text-red-600'
                                          }`}
                                          title={`Remove ${isSchoolActive ? 'board' : 'course'}`}
                                        >
                                          ✕
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">
                            Click <strong className="text-emerald-700">"Save & Apply"</strong> to persist your education types, courses & boards to the database.
                          </span>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsEducationModalOpen(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsEducationModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save & Apply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Course Types Management Modal Popup */}
                {isCourseTypeModalOpen && (() => {
                  const currentOptions = onboardingConfig.step2?.courseTypeOptions || DEFAULT_COURSE_TYPE_OPTIONS;
                  const trimmedName = newCourseTypeOption.trim();
                  const isDuplicate = trimmedName && currentOptions.some(o => o.toLowerCase() === trimmedName.toLowerCase());

                  return (
                    <div 
                      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                      onClick={() => setIsCourseTypeModalOpen(false)}
                    >
                      <div 
                        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                Course Types Management
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Add, remove, or drag & drop to reorder course types for candidates.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsCourseTypeModalOpen(false)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                              title="Close popup"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                          {/* Add Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add new course type (e.g. Online, Hybrid, Evening Batch, Executive)..."
                              value={newCourseTypeOption}
                              onChange={(e) => setNewCourseTypeOption(e.target.value)}
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter') { 
                                  e.preventDefault(); 
                                  if (trimmedName && !isDuplicate) handleAddCourseTypeOption(); 
                                } 
                              }}
                              className={`flex-1 px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition-all ${
                                isDuplicate ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-200 focus:border-emerald-500'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={handleAddCourseTypeOption}
                              disabled={!trimmedName || isDuplicate}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Type</span>
                            </button>
                          </div>

                          {trimmedName && isDuplicate && (
                            <p className="text-[10px] text-amber-700 font-semibold px-1">
                              "{trimmedName}" already exists in course types!
                            </p>
                          )}

                          {/* Reorderable Items List */}
                          <div 
                            className="space-y-2 pt-2"
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setDragOverCourseTypeIndex(null);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
                              <span>Current Course Types ({currentOptions.length})</span>
                              <span className="text-[11px] text-gray-400">Drag items by handle to reorder</span>
                            </div>

                            {currentOptions.map((opt, idx) => {
                              const isDragging = draggedCourseTypeIndex === idx;
                              const isDragOver = dragOverCourseTypeIndex === idx && draggedCourseTypeIndex !== idx;

                              return (
                                <div
                                  key={opt + idx}
                                  draggable
                                  onDragStart={(e) => handleCourseTypeDragStart(e, idx)}
                                  onDragOver={(e) => handleCourseTypeDragOver(e, idx)}
                                  onDrop={(e) => handleCourseTypeDrop(e, idx)}
                                  onDragEnd={handleCourseTypeDragEnd}
                                  className={`relative flex items-center justify-between p-3 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 select-none ${
                                    isDragging
                                      ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                      : isDragOver
                                      ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                      : 'bg-white hover:bg-emerald-50/50 text-gray-800 border border-gray-200 shadow-2xs hover:border-emerald-300'
                                  }`}
                                >
                                  {isDragOver && (
                                    <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                  )}

                                  <div className="flex items-center gap-2.5">
                                    <span 
                                      className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                      title="Drag to change position"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </span>
                                    <span className="text-gray-900 font-extrabold">{opt}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCourseTypeOption(idx)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title={`Delete course type "${opt}"`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleResetCourseTypeOptions}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Reset to standard course types"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Defaults</span>
                          </button>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsCourseTypeModalOpen(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsCourseTypeModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save & Apply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* School Medium Options Management Modal Popup */}
                {isMediumModalOpen && (() => {
                  const currentOptions = onboardingConfig.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS;
                  const trimmedName = newMediumOption.trim();
                  const isDuplicate = trimmedName && currentOptions.some(o => o.toLowerCase() === trimmedName.toLowerCase());

                  return (
                    <div 
                      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                      onClick={() => setIsMediumModalOpen(false)}
                    >
                      <div 
                        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                School Medium Options
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Add, remove, and reorder medium of instruction options available in dropdowns.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsMediumModalOpen(false)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                              title="Close popup"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                          
                          {/* Add New Option Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="New medium (e.g. Marathi, Tamil, Bengali)..."
                              value={newMediumOption}
                              onChange={(e) => setNewMediumOption(e.target.value)}
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter') { 
                                  e.preventDefault(); 
                                  if (trimmedName && !isDuplicate) handleAddMediumOption(); 
                                } 
                              }}
                              className={`flex-1 px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition-all ${
                                isDuplicate ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-200 focus:border-emerald-500'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={handleAddMediumOption}
                              disabled={!trimmedName || isDuplicate}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Medium</span>
                            </button>
                          </div>

                          {trimmedName && isDuplicate && (
                            <p className="text-[10px] text-amber-700 font-semibold px-1">
                              "{trimmedName}" already exists in medium options!
                            </p>
                          )}

                          {/* Reorderable Items List */}
                          <div 
                            className="space-y-2 pt-2"
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setDragOverMediumIndex(null);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
                              <span>Current Medium Options ({currentOptions.length})</span>
                              <span className="text-[11px] text-gray-400">Drag items by handle to reorder</span>
                            </div>

                            {currentOptions.map((opt, idx) => {
                              const isDragging = draggedMediumIndex === idx;
                              const isDragOver = dragOverMediumIndex === idx && draggedMediumIndex !== idx;

                              return (
                                <div
                                  key={opt + idx}
                                  draggable
                                  onDragStart={(e) => handleMediumDragStart(e, idx)}
                                  onDragOver={(e) => handleMediumDragOver(e, idx)}
                                  onDrop={(e) => handleMediumDrop(e, idx)}
                                  onDragEnd={handleMediumDragEnd}
                                  className={`relative flex items-center justify-between p-3 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 select-none ${
                                    isDragging
                                      ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                      : isDragOver
                                      ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                      : 'bg-white hover:bg-emerald-50/50 text-gray-800 border border-gray-200 shadow-2xs hover:border-emerald-300'
                                  }`}
                                >
                                  {isDragOver && (
                                    <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                  )}

                                  <div className="flex items-center gap-2.5">
                                    <span 
                                      className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                      title="Drag to change position"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </span>
                                    <span className="text-gray-900 font-extrabold">{opt}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMediumOption(idx)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title={`Delete medium "${opt}"`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleResetMediumOptions}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Reset to standard medium options"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Defaults</span>
                          </button>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsMediumModalOpen(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsMediumModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save & Apply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Grading Systems Management Modal Popup */}
                {isGradingModalOpen && (() => {
                  const currentList = normalizeGradingSystems(onboardingConfig.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS);
                  const trimmedName = newGradingName.trim();
                  const isDuplicate = trimmedName && currentList.some(o => o.name.toLowerCase() === trimmedName.toLowerCase());
                  const activePreviewObj = currentList.find(g => g.name === previewGradingSelection) || currentList[0] || { name: 'Scale 10 Grading System', label: 'Grade (out of 10)', placeholder: 'e.g. 8.5' };

                  return (
                    <div 
                      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                      onClick={() => setIsGradingModalOpen(false)}
                    >
                      <div 
                        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                Grading Systems Management
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Add grading options and configure the dynamic text box label & placeholder shown below when candidates select each option.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsGradingModalOpen(false)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                              title="Close popup"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                          
                          {/* Add New Grading System Form Card */}
                          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                Add New Grading System
                              </span>
                              <span className="text-[11px] text-gray-400">Specify dropdown option name, plus dynamic input label & placeholder</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                              <div className="sm:col-span-5">
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Option Name in Dropdown <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Scale 7 Grading System, Letter Grade (A-F)"
                                  value={newGradingName}
                                  onChange={(e) => setNewGradingName(e.target.value)}
                                  className={`w-full px-3 py-2 bg-white border rounded-xl font-medium text-xs focus:outline-none transition-all ${
                                    isDuplicate ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-200 focus:border-emerald-500'
                                  }`}
                                />
                              </div>

                              <div className="sm:col-span-4">
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Below Input Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Grade (out of 7), Grade Letter"
                                  value={newGradingLabel}
                                  onChange={(e) => setNewGradingLabel(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-medium text-xs focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div className="sm:col-span-3 flex flex-col justify-end">
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  Placeholder
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="e.g. e.g. 5.8"
                                    value={newGradingPlaceholder}
                                    onChange={(e) => setNewGradingPlaceholder(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-medium text-xs focus:outline-none focus:border-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddGradingSystem}
                                    disabled={!trimmedName || isDuplicate}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {trimmedName && isDuplicate && (
                              <p className="text-[10px] text-amber-700 font-semibold px-1">
                                "{trimmedName}" already exists in grading systems!
                              </p>
                            )}
                          </div>

                          {/* Live Interactive Simulator */}
                          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Live Candidate Dropdown & Label Simulator
                              </span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Test Behavior
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block font-bold text-gray-800 text-[11px]">
                                  Candidate selects Grading System:
                                </label>
                                <select
                                  value={previewGradingSelection}
                                  onChange={(e) => setPreviewGradingSelection(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                  {currentList.map((gs) => (
                                    <option key={gs.name} value={gs.name}>{gs.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block font-bold text-emerald-950 text-[11px]">
                                  Input Label & Placeholder below automatically updates to:
                                </label>
                                <div className="p-2.5 bg-white border border-emerald-300 rounded-xl space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-black text-emerald-800">
                                    <span>Label: "{activePreviewObj.label || 'Marks'}"</span>
                                    <span className="text-red-500">*</span>
                                  </div>
                                  <div className="text-[10px] text-gray-400 italic">
                                    Placeholder: "{activePreviewObj.placeholder || 'Enter grade or marks'}"
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Reorderable Items List */}
                          <div 
                            className="space-y-2 pt-1"
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setDragOverGradingIndex(null);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
                              <span>Configured Grading Systems ({currentList.length})</span>
                              <span className="text-[11px] text-gray-400">Drag items to change dropdown order</span>
                            </div>

                            {currentList.map((gs, idx) => {
                              const isDragging = draggedGradingIndex === idx;
                              const isDragOver = dragOverGradingIndex === idx && draggedGradingIndex !== idx;

                              return (
                                <div
                                  key={gs.name + idx}
                                  draggable
                                  onDragStart={(e) => handleGradingDragStart(e, idx)}
                                  onDragOver={(e) => handleGradingDragOver(e, idx)}
                                  onDrop={(e) => handleGradingDrop(e, idx)}
                                  onDragEnd={handleGradingDragEnd}
                                  className={`relative p-3.5 rounded-2xl text-xs transition-all duration-150 select-none border ${
                                    isDragging
                                      ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                      : isDragOver
                                      ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                      : 'bg-white hover:bg-gray-50/70 text-gray-800 border-gray-200 shadow-2xs hover:border-emerald-300'
                                  }`}
                                >
                                  {isDragOver && (
                                    <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                                    <div className="sm:col-span-4 flex items-center gap-2">
                                      <span 
                                        className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                        title="Drag to change dropdown order"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </span>
                                      <input
                                        type="text"
                                        value={gs.name}
                                        onChange={(e) => handleUpdateGradingItem(idx, 'name', e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                                        title="Dropdown Option Name"
                                      />
                                    </div>

                                    <div className="sm:col-span-4">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-gray-400 shrink-0">Label:</span>
                                        <input
                                          type="text"
                                          value={gs.label || ''}
                                          onChange={(e) => handleUpdateGradingItem(idx, 'label', e.target.value)}
                                          placeholder="Below input label"
                                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-gray-400 shrink-0">Ph:</span>
                                        <input
                                          type="text"
                                          value={gs.placeholder || ''}
                                          onChange={(e) => handleUpdateGradingItem(idx, 'placeholder', e.target.value)}
                                          placeholder="Placeholder"
                                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>

                                    <div className="sm:col-span-1 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteGradingSystem(idx)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        title={`Delete "${gs.name}"`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleResetGradingSystems}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Reset to standard grading systems"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Defaults</span>
                          </button>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsGradingModalOpen(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsGradingModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save & Apply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Right 5 Columns: Step 2 Live Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Onboarding Preview</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 2: 33% Completed</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                      <div className="p-5 border-b border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-black text-gray-900 text-base">{onboardingConfig.header?.title || 'Create your Profile'}</h3>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                            33% Completed
                          </span>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '33%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                        <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm">{onboardingConfig.step2?.title || 'Education'}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">{onboardingConfig.step2?.subtitle || 'Details help recruiters identify your background'}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 cursor-pointer">{onboardingConfig.step2?.addBtnText || 'Add +'}</span>
                        </div>

                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2.5 shadow-2xs">
                          {/* 1. Education */}
                          <div className="space-y-1">
                            <label className="block font-bold text-gray-700 text-[11px]">
                              {onboardingConfig.step2?.fields?.educationType?.label || 'Education'}
                              {onboardingConfig.step2?.fields?.educationType?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-[11px]">
                              {onboardingConfig.step2?.fields?.educationType?.placeholder || 'Select education type'}
                            </div>
                          </div>

                          {/* 2. University & 3. Course */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {onboardingConfig.step2?.fields?.university?.label || 'University / Institute'}
                                {onboardingConfig.step2?.fields?.university?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-[11px] truncate">
                                {onboardingConfig.step2?.fields?.university?.placeholder || 'Enter university'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {onboardingConfig.step2?.fields?.course?.label || 'Course'}
                                {onboardingConfig.step2?.fields?.course?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-[11px]">
                                {onboardingConfig.step2?.fields?.course?.placeholder || 'Select course'}
                              </div>
                            </div>
                          </div>

                          {/* 4. School Medium */}
                          <div className="space-y-1 pt-1">
                            <label className="block font-bold text-gray-700 text-[11px]">
                              {onboardingConfig.step2?.fields?.schoolMedium?.label || 'Medium'}
                              {onboardingConfig.step2?.fields?.schoolMedium?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                            </label>
                            <select className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium text-[11px] focus:outline-none">
                              <option value="">{onboardingConfig.step2?.fields?.schoolMedium?.placeholder || 'Select medium'}</option>
                              {(onboardingConfig.step2?.mediumOptions || DEFAULT_MEDIUM_OPTIONS).map((m, mIdx) => (
                                <option key={mIdx} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>

                          {/* 5. Course Type */}
                          <div className="space-y-1 pt-1">
                            <label className="block font-bold text-gray-700 text-[11px]">
                              {onboardingConfig.step2?.fields?.courseType?.label || 'Course Type'}
                              {onboardingConfig.step2?.fields?.courseType?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                            </label>
                            <div className="flex flex-wrap items-center gap-3 pt-0.5">
                              {(onboardingConfig.step2?.courseTypeOptions || DEFAULT_COURSE_TYPE_OPTIONS).map((ct, ctIdx) => (
                                <label key={ctIdx} className="flex items-center gap-1.5 text-[11px] text-gray-700 font-medium">
                                  <input type="radio" name="previewCourseType" checked={ctIdx === 0} readOnly className="w-3.5 h-3.5 accent-emerald-600" />
                                  <span>{ct}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* 6. Duration */}
                          <div className="space-y-1 pt-1 border-t border-gray-100">
                            <label className="block font-bold text-gray-700 text-[11px]">
                              Course Duration {(onboardingConfig.step2?.fields?.startYear?.isRequired || onboardingConfig.step2?.fields?.endYear?.isRequired) && <span className="text-red-500 font-bold ml-0.5">*</span>}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-gray-500 font-medium">{onboardingConfig.step2?.fields?.startYear?.label || 'Starting Year'}</span>
                                <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-[11px]">
                                  {onboardingConfig.step2?.fields?.startYear?.placeholder || 'Select starting year'}
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-gray-500 font-medium">{onboardingConfig.step2?.fields?.endYear?.label || 'Passing Out Year'}</span>
                                <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-[11px]">
                                  {onboardingConfig.step2?.fields?.endYear?.placeholder || 'Select passing out year'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 7. Dynamic Grading System & Marks in Live Preview */}
                          {(() => {
                            const currentGradingSystems = normalizeGradingSystems(onboardingConfig.step2?.gradingSystems || DEFAULT_GRADING_SYSTEMS);
                            const selectedGradingObj = currentGradingSystems.find(g => g.name === previewGradingSelection) || currentGradingSystems[0] || { name: 'Scale 10 Grading System', label: 'Grade (out of 10)', placeholder: 'e.g. 8.5' };
                            const dynamicLabel = selectedGradingObj?.label || 'Marks';
                            const dynamicPlaceholder = selectedGradingObj?.placeholder || 'Enter grade or marks';

                            return (
                              <div className="space-y-2 pt-1 border-t border-gray-100 mt-2">
                                <div className="space-y-1">
                                  <label className="block font-bold text-gray-700 text-[11px]">
                                    {onboardingConfig.step2?.fields?.gradingSystem?.label || 'Grading System'}
                                    {onboardingConfig.step2?.fields?.gradingSystem?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                                  </label>
                                  <select 
                                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium text-[11px] focus:outline-none"
                                    value={previewGradingSelection}
                                    onChange={(e) => setPreviewGradingSelection(e.target.value)}
                                  >
                                    {currentGradingSystems.map((gs) => (
                                      <option key={gs.name} value={gs.name}>{gs.name}</option>
                                    ))}
                                  </select>
                                </div>

                                {selectedGradingObj.name !== 'Not Applicable' && (
                                  <div className="space-y-1 animate-in fade-in duration-150">
                                    <label className="block font-bold text-emerald-800 text-[11px]">
                                      {dynamicLabel}
                                      {onboardingConfig.step2?.fields?.percentage?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                                    </label>
                                    <div className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-gray-400 text-[11px]">
                                      {dynamicPlaceholder}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="pt-3 flex justify-between">
                          <div className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">{onboardingConfig.buttons?.backBtnText || 'Back'}</div>
                          <div className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">{onboardingConfig.buttons?.nextBtnText || 'Save & Continue'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: WORK EXPERIENCE */}
            {onboardingSubTab === 'step3' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-emerald-600" />
                          Step 3: Work Experience Controls
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Customize work experience headers, fresher label, and fields.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Section Header Title</label>
                        <input
                          type="text"
                          value={onboardingConfig.step3?.title || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step3: { ...prev.step3, title: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Add Experience Button Text</label>
                        <input
                          type="text"
                          value={onboardingConfig.step3?.addBtnText || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step3: { ...prev.step3, addBtnText: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-gray-700 mb-1">Fresher Toggle Label</label>
                        <input
                          type="text"
                          value={onboardingConfig.step3?.fresherLabel || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step3: { ...prev.step3, fresherLabel: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      {step3FieldKeys.map(item => {
                        const fieldData = onboardingConfig.step3?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: true };
                        const isReq = fieldData.isRequired !== false;
                        return (
                          <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                {item.title}
                                {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                              </span>

                              <div className="flex items-center gap-2">
                                {item.key === 'employmentType' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsEmploymentTypeModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Employment Types Management Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Employment Types ({((onboardingConfig.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS)).length})</span>
                                  </button>
                                )}

                                {item.key === 'noticePeriod' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsNoticePeriodModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Notice Period Options Management Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Notice Period Options ({((onboardingConfig.step3?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS)).length})</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOnboardingMandatoryToggle('step3', item.key)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                    isReq
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                                  }`}
                                >
                                  {isReq ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      Mandatory (*)
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                      Optional
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                <input
                                  type="text"
                                  value={fieldData.label || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step3', item.key, 'label', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                <input
                                  type="text"
                                  value={fieldData.placeholder || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step3', item.key, 'placeholder', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Employment Types Management Modal Popup */}
                {isEmploymentTypeModalOpen && (() => {
                  const currentOptions = onboardingConfig.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS;
                  const trimmedName = newEmploymentTypeOption.trim();
                  const isDuplicate = trimmedName && currentOptions.some(o => o.toLowerCase() === trimmedName.toLowerCase());

                  return (
                    <div 
                      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                      onClick={() => setIsEmploymentTypeModalOpen(false)}
                    >
                      <div 
                        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                Employment Types Management
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Add, remove, or drag & drop to reorder employment types (e.g. Full-time, Part-time, Contract, Internship) for candidates.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsEmploymentTypeModalOpen(false)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                              title="Close popup"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                          {/* Add Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add new employment type (e.g. Full-time, Part-time, Contract, Internship, Freelance)..."
                              value={newEmploymentTypeOption}
                              onChange={(e) => setNewEmploymentTypeOption(e.target.value)}
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter') { 
                                  e.preventDefault(); 
                                  if (trimmedName && !isDuplicate) handleAddEmploymentTypeOption(); 
                                } 
                              }}
                              className={`flex-1 px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition-all ${
                                isDuplicate ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-200 focus:border-emerald-500'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={handleAddEmploymentTypeOption}
                              disabled={!trimmedName || isDuplicate}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Type</span>
                            </button>
                          </div>

                          {trimmedName && isDuplicate && (
                            <p className="text-[10px] text-amber-700 font-semibold px-1">
                              "{trimmedName}" already exists in employment types!
                            </p>
                          )}

                          {/* Reorderable Items List */}
                          <div 
                            className="space-y-2 pt-2"
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setDragOverEmploymentTypeIndex(null);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
                              <span>Current Employment Types ({currentOptions.length})</span>
                              <span className="text-[11px] text-gray-400">Drag items by handle to reorder</span>
                            </div>

                            {currentOptions.map((opt, idx) => {
                              const isDragging = draggedEmploymentTypeIndex === idx;
                              const isDragOver = dragOverEmploymentTypeIndex === idx && draggedEmploymentTypeIndex !== idx;

                              return (
                                <div
                                  key={opt + idx}
                                  draggable
                                  onDragStart={(e) => handleEmploymentTypeDragStart(e, idx)}
                                  onDragOver={(e) => handleEmploymentTypeDragOver(e, idx)}
                                  onDrop={(e) => handleEmploymentTypeDrop(e, idx)}
                                  onDragEnd={handleEmploymentTypeDragEnd}
                                  className={`relative flex items-center justify-between p-3 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 select-none ${
                                    isDragging
                                      ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                      : isDragOver
                                      ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                      : 'bg-white hover:bg-emerald-50/50 text-gray-800 border border-gray-200 shadow-2xs hover:border-emerald-300'
                                  }`}
                                >
                                  {isDragOver && (
                                    <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                  )}

                                  <div className="flex items-center gap-2.5">
                                    <span 
                                      className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                      title="Drag to change position"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </span>
                                    <span className="text-gray-900 font-extrabold">{opt}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEmploymentTypeOption(idx)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title={`Delete employment type "${opt}"`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleResetEmploymentTypeOptions}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Reset to standard employment types"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Defaults</span>
                          </button>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsEmploymentTypeModalOpen(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsEmploymentTypeModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save & Apply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Notice Period Options Management Modal Popup */}
                {isNoticePeriodModalOpen && (() => {
                  const currentOptions = onboardingConfig.step3?.noticePeriodOptions || onboardingConfig.step4?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS;
                  const trimmedName = newNoticePeriodOption.trim();
                  const isDuplicate = trimmedName && currentOptions.some(o => o.toLowerCase() === trimmedName.toLowerCase());

                  return (
                    <div 
                      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                      onClick={() => setIsNoticePeriodModalOpen(false)}
                    >
                      <div 
                        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <SlidersHorizontal className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                Notice Period Options Management
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Add, remove, or drag & drop to reorder notice period options (e.g. 15 Days, 30 Days, Immediately available) for candidates.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsNoticePeriodModalOpen(false)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                              title="Close popup"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                          {/* Add Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Add new notice period (e.g. 15 Days, 30 Days, 45 Days, Immediately available)..."
                              value={newNoticePeriodOption}
                              onChange={(e) => setNewNoticePeriodOption(e.target.value)}
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter') { 
                                  e.preventDefault(); 
                                  if (trimmedName && !isDuplicate) handleAddNoticePeriodOption(); 
                                } 
                              }}
                              className={`flex-1 px-4 py-2.5 bg-gray-50 border rounded-xl text-xs font-medium focus:outline-none focus:bg-white transition-all ${
                                isDuplicate ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-200 focus:border-emerald-500'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={handleAddNoticePeriodOption}
                              disabled={!trimmedName || isDuplicate}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Option</span>
                            </button>
                          </div>

                          {trimmedName && isDuplicate && (
                            <p className="text-[10px] text-amber-700 font-semibold px-1">
                              "{trimmedName}" already exists in notice period options!
                            </p>
                          )}

                          {/* Reorderable Items List */}
                          <div 
                            className="space-y-2 pt-2"
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setDragOverNoticePeriodIndex(null);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
                              <span>Current Notice Period Options ({currentOptions.length})</span>
                              <span className="text-[11px] text-gray-400">Drag items by handle to reorder</span>
                            </div>

                            {currentOptions.map((opt, idx) => {
                              const isDragging = draggedNoticePeriodIndex === idx;
                              const isDragOver = dragOverNoticePeriodIndex === idx && draggedNoticePeriodIndex !== idx;

                              return (
                                <div
                                  key={opt + idx}
                                  draggable
                                  onDragStart={(e) => handleNoticePeriodDragStart(e, idx)}
                                  onDragOver={(e) => handleNoticePeriodDragOver(e, idx)}
                                  onDrop={(e) => handleNoticePeriodDrop(e, idx)}
                                  onDragEnd={handleNoticePeriodDragEnd}
                                  className={`relative flex items-center justify-between p-3 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 select-none ${
                                    isDragging
                                      ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                      : isDragOver
                                      ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                      : 'bg-white hover:bg-emerald-50/50 text-gray-800 border border-gray-200 shadow-2xs hover:border-emerald-300'
                                  }`}
                                >
                                  {isDragOver && (
                                    <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                  )}

                                  <div className="flex items-center gap-2.5">
                                    <span 
                                      className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                      title="Drag to change position"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </span>
                                    <span className="text-gray-900 font-extrabold">{opt}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNoticePeriodOption(idx)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title={`Delete notice period "${opt}"`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleResetNoticePeriodOptions}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Reset to standard notice periods"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Defaults</span>
                          </button>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsNoticePeriodModalOpen(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsNoticePeriodModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save & Apply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Right 5 Columns: Step 3 Live Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Onboarding Preview</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 3: 50% Completed</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                      <div className="p-5 border-b border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-black text-gray-900 text-base">{onboardingConfig.header?.title || 'Create your Profile'}</h3>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                            50% Completed
                          </span>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '50%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                        <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                          <h4 className="font-bold text-gray-800 text-sm">{onboardingConfig.step3?.title || 'Work Experience'}</h4>
                          <span className="text-xs font-bold text-emerald-600 cursor-pointer">{onboardingConfig.step3?.addBtnText || 'Add +'}</span>
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                          <span className="font-bold text-emerald-800 text-[11px]">{onboardingConfig.step3?.fresherLabel || 'I am a fresher (No Experience)'}</span>
                          <span className="w-8 h-4 bg-emerald-500 rounded-full inline-block"></span>
                        </div>

                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2 shadow-2xs">
                          <div className="space-y-1">
                            <label className="block font-bold text-gray-700 text-[11px]">
                              {onboardingConfig.step3?.fields?.companyName?.label || 'Company Name'}
                              {onboardingConfig.step3?.fields?.companyName?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                            </label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-[11px]">
                              {onboardingConfig.step3?.fields?.companyName?.placeholder || 'Enter company name'}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {onboardingConfig.step3?.fields?.jobTitle?.label || 'Job Title'}
                                {onboardingConfig.step3?.fields?.jobTitle?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-400 text-[11px]">
                                {onboardingConfig.step3?.fields?.jobTitle?.placeholder || 'Enter job title'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {onboardingConfig.step3?.fields?.employmentType?.label || 'Employment Type'}
                                {onboardingConfig.step3?.fields?.employmentType?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <select 
                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium text-[11px] focus:outline-none"
                                defaultValue=""
                              >
                                <option value="">{onboardingConfig.step3?.fields?.employmentType?.placeholder || 'Select employment type'}</option>
                                {(onboardingConfig.step3?.employmentTypeOptions || DEFAULT_EMPLOYMENT_TYPE_OPTIONS).map((opt, optIdx) => (
                                  <option key={optIdx} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="space-y-1 pt-1">
                            <label className="block font-bold text-gray-700 text-[11px]">
                              {onboardingConfig.step3?.fields?.noticePeriod?.label || 'Notice Period'}
                              {onboardingConfig.step3?.fields?.noticePeriod?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                            </label>
                            <select 
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium text-[11px] focus:outline-none"
                              defaultValue=""
                            >
                              <option value="">{onboardingConfig.step3?.fields?.noticePeriod?.placeholder || 'Select notice period'}</option>
                              {(onboardingConfig.step3?.noticePeriodOptions || DEFAULT_NOTICE_PERIOD_OPTIONS).map((opt, optIdx) => (
                                <option key={optIdx} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="pt-3 flex justify-between">
                          <div className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">{onboardingConfig.buttons?.backBtnText || 'Back'}</div>
                          <div className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">{onboardingConfig.buttons?.nextBtnText || 'Save & Continue'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: KEY SKILLS */}
            {onboardingSubTab === 'step4' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-600" />
                          Step 4: Key Skills & Preferences Controls
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Customize skills, salary, notice period, and resume headline labels.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Section Header Title</label>
                        <input
                          type="text"
                          value={onboardingConfig.step4?.title || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step4: { ...prev.step4, title: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Section Subtitle</label>
                        <input
                          type="text"
                          value={onboardingConfig.step4?.subtitle || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step4: { ...prev.step4, subtitle: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      {step4FieldKeys.map(item => {
                        const fieldData = onboardingConfig.step4?.fields?.[item.key] || { label: item.title, placeholder: '', isRequired: false };
                        const isReq = fieldData.isRequired === true;
                        return (
                          <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                {item.title}
                                {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                              </span>

                              <div className="flex items-center gap-2">
                                {item.key === 'skills' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsSkillsModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
                                    title="Open Key Skills Options Management Popup"
                                  >
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Edit Skills List ({((onboardingConfig.step4?.skillsOptions || DEFAULT_SKILLS_OPTIONS)).length})</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOnboardingMandatoryToggle('step4', item.key)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                    isReq
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                                  }`}
                                >
                                  {isReq ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      Mandatory (*)
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                      Optional
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                <input
                                  type="text"
                                  value={fieldData.label || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step4', item.key, 'label', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Placeholder Text</label>
                                <input
                                  type="text"
                                  value={fieldData.placeholder || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step4', item.key, 'placeholder', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Key Skills Options Management Modal Popup */}
                {isSkillsModalOpen && (() => {
                  const currentSkillsList = onboardingConfig.step4?.skillsOptions || DEFAULT_SKILLS_OPTIONS;
                  const trimmedInput = newSkillOption.trim();
                  const isDuplicate = trimmedInput && currentSkillsList.some(s => s.toLowerCase() === trimmedInput.toLowerCase());
                  
                  const filteredList = currentSkillsList.filter(s => 
                    !skillFilterSearch || s.toLowerCase().includes(skillFilterSearch.toLowerCase())
                  );

                  return (
                    <div 
                      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                      onClick={() => setIsSkillsModalOpen(false)}
                    >
                      <div 
                        className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <Award className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                Key Skills Options Manager
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Add, delete, search, and reorder skills available in candidate onboarding & profile dropdowns.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={handleResetSkillsOptions}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              title="Reset to default standard skills list"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reset Defaults</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsSkillsModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save Changes</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsSkillsModalOpen(false)}
                              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                              title="Close popup"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                          {/* Add New Skill Card with Comma-separated Bulk Add Support */}
                          <div className="p-4 bg-gray-50 border border-gray-200/80 rounded-2xl space-y-3">
                            <label className="block text-xs font-extrabold text-gray-800 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                Add Skill to Dropdown (Single or comma-separated for bulk add)
                              </span>
                              {trimmedInput && !isDuplicate && (
                                <span className="text-[11px] text-emerald-700 font-bold">✓ Ready to add</span>
                              )}
                            </label>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type skill name e.g. React, Next.js, Python, Power BI (or comma-separated)..."
                                value={newSkillOption}
                                onChange={(e) => setNewSkillOption(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSkillOption();
                                  }
                                }}
                                className={`flex-1 px-4 py-2.5 bg-white border rounded-xl text-xs font-medium focus:outline-none transition-all ${
                                  isDuplicate
                                    ? 'border-amber-400 ring-2 ring-amber-100'
                                    : 'border-gray-200 focus:border-emerald-500'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={handleAddSkillOption}
                                disabled={!trimmedInput}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Add Skill</span>
                              </button>
                            </div>

                            {isDuplicate && (
                              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium animate-in fade-in duration-150">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span><strong>"{trimmedInput}"</strong> is already in the skills list!</span>
                              </div>
                            )}
                          </div>

                          {/* Search Filter and Count Bar */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                            <div className="relative w-full sm:w-72">
                              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Search skills..."
                                value={skillFilterSearch}
                                onChange={(e) => setSkillFilterSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:border-emerald-500"
                              />
                              {skillFilterSearch && (
                                <button
                                  type="button"
                                  onClick={() => setSkillFilterSearch('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 font-semibold self-end sm:self-center">
                              Total Configured Skills: <span className="text-emerald-700 font-bold">{currentSkillsList.length}</span>
                              {skillFilterSearch && (
                                <span className="ml-1 text-gray-400">({filteredList.length} filtered)</span>
                              )}
                            </div>
                          </div>

                          {/* Skills Grid / Reorderable List */}
                          <div 
                            className="space-y-1.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1"
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setDragOverSkillIndex(null);
                              }
                            }}
                          >
                            {filteredList.length === 0 ? (
                              <div className="py-12 text-center text-gray-400 text-xs font-medium">
                                No skills match "{skillFilterSearch}"
                              </div>
                            ) : (
                              filteredList.map((skillName) => {
                                const originalIndex = currentSkillsList.indexOf(skillName);
                                const isDragging = draggedSkillIndex === originalIndex;
                                const isDragOver = dragOverSkillIndex === originalIndex && draggedSkillIndex !== originalIndex;

                                return (
                                  <div
                                    key={skillName + originalIndex}
                                    draggable
                                    onDragStart={(e) => handleSkillDragStart(e, originalIndex)}
                                    onDragOver={(e) => handleSkillDragOver(e, originalIndex)}
                                    onDrop={(e) => handleSkillDrop(e, originalIndex)}
                                    onDragEnd={handleSkillDragEnd}
                                    className={`relative flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all duration-150 select-none border ${
                                      isDragging
                                        ? 'opacity-30 border-2 border-dashed border-emerald-400 bg-emerald-50/50 scale-[0.98]'
                                        : isDragOver
                                        ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] shadow-md ring-2 ring-emerald-400/50'
                                        : 'bg-white hover:bg-gray-50/80 text-gray-800 border-gray-200/80 shadow-2xs hover:border-emerald-300'
                                    }`}
                                  >
                                    {isDragOver && (
                                      <div className="absolute -top-1 left-2 right-2 h-1 bg-emerald-500 rounded-full animate-pulse z-20 pointer-events-none" />
                                    )}

                                    <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                                      <span
                                        className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-400 hover:text-gray-700 transition-colors"
                                        title="Drag to change dropdown order"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </span>
                                      <span className="w-7 text-[10px] text-gray-400 font-mono font-bold shrink-0">
                                        #{originalIndex + 1}
                                      </span>
                                      <span className="font-bold text-gray-900 truncate">
                                        {skillName}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSkillOption(originalIndex)}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                                      title={`Delete skill "${skillName}"`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleResetSkillsOptions}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Reset to default standard skills"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reset Defaults</span>
                          </button>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsSkillsModalOpen(false)}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleSave();
                                setIsSkillsModalOpen(false);
                              }}
                              disabled={saving}
                              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save & Apply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Right 5 Columns: Step 4 Live Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Onboarding Preview</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 4: 67% Completed</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                      <div className="p-5 border-b border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-black text-gray-900 text-base">{onboardingConfig.header?.title || 'Create your Profile'}</h3>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                            67% Completed
                          </span>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '67%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                        <div className="border-b border-gray-200 pb-2">
                          <h4 className="font-bold text-gray-800 text-sm">{onboardingConfig.step4?.title || 'Key Skills & Preferences'}</h4>
                          {onboardingConfig.step4?.subtitle && (
                            <p className="text-[11px] text-gray-500 mt-0.5">{onboardingConfig.step4?.subtitle}</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* 1. LinkedIn Profile */}
                          <div className="space-y-1">
                            <label className="block font-bold text-gray-700 text-[11px]">
                              {onboardingConfig.step4?.fields?.linkedinUrl?.label || 'LinkedIn Profile'}
                              {onboardingConfig.step4?.fields?.linkedinUrl?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                            </label>
                            <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px]">
                              {onboardingConfig.step4?.fields?.linkedinUrl?.placeholder || 'https://linkedin.com/in/...'}
                            </div>
                          </div>

                          {/* 2. Salary Type & Currency */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {onboardingConfig.step4?.fields?.salaryType?.label || 'Salary Type'}
                                {onboardingConfig.step4?.fields?.salaryType?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <select 
                                value={previewSalaryType} 
                                onChange={(e) => setPreviewSalaryType(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium text-[11px] focus:outline-none cursor-pointer"
                              >
                                <option value="Yearly">Yearly</option>
                                <option value="Monthly">Monthly</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {onboardingConfig.step4?.fields?.currency?.label || 'Currency'}
                                {onboardingConfig.step4?.fields?.currency?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <select 
                                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium text-[11px] focus:outline-none cursor-pointer"
                                defaultValue="INR"
                              >
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="AED">AED (د.إ)</option>
                                <option value="CAD">CAD ($)</option>
                                <option value="AUD">AUD ($)</option>
                                <option value="SGD">SGD ($)</option>
                                <option value="SAR">SAR (﷼)</option>
                                <option value="QAR">QAR (﷼)</option>
                                <option value="OMR">OMR (﷼)</option>
                                <option value="KWD">KWD (د.ك)</option>
                                <option value="BHD">BHD (.د.ب)</option>
                                <option value="JPY">JPY (¥)</option>
                                <option value="CNY">CNY (¥)</option>
                                <option value="CHF">CHF (Fr)</option>
                                <option value="HKD">HKD ($)</option>
                                <option value="NZD">NZD ($)</option>
                                <option value="MYR">MYR (RM)</option>
                                <option value="ZAR">ZAR (R)</option>
                                <option value="THB">THB (฿)</option>
                                <option value="PHP">PHP (₱)</option>
                                <option value="IDR">IDR (Rp)</option>
                                <option value="VND">VND (₫)</option>
                                <option value="BRL">BRL (R$)</option>
                                <option value="RUB">RUB (₽)</option>
                                <option value="KRW">KRW (₩)</option>
                                <option value="TRY">TRY (₺)</option>
                                <option value="MXN">MXN ($)</option>
                                <option value="EGP">EGP (E£)</option>
                                <option value="LKR">LKR (Rs)</option>
                                <option value="PKR">PKR (Rs)</option>
                                <option value="BDT">BDT (৳)</option>
                                <option value="NPR">NPR (Rs)</option>
                              </select>
                            </div>
                          </div>

                          {/* 3. Current & Expected CTC / Salary (Dynamic based on Salary Type) */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {previewSalaryType === 'Monthly'
                                  ? (onboardingConfig.step4?.fields?.currentSalary?.label ? onboardingConfig.step4.fields.currentSalary.label.replace(/Annual CTC|Annual Salary|Annual/gi, 'Monthly CTC') : 'Current Monthly CTC')
                                  : (onboardingConfig.step4?.fields?.currentSalary?.label || 'Current Annual CTC')}
                                {onboardingConfig.step4?.fields?.currentSalary?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px]">
                                {previewSalaryType === 'Monthly'
                                  ? (onboardingConfig.step4?.fields?.currentSalary?.placeholder ? onboardingConfig.step4.fields.currentSalary.placeholder.replace(/5,00,000|500000/g, '40,000') : 'e.g. 40,000')
                                  : (onboardingConfig.step4?.fields?.currentSalary?.placeholder || 'e.g. 5,00,000')}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {previewSalaryType === 'Monthly'
                                  ? (onboardingConfig.step4?.fields?.expectedSalary?.label ? onboardingConfig.step4.fields.expectedSalary.label.replace(/Annual CTC|Annual Salary|Annual/gi, 'Monthly CTC') : 'Expected Monthly CTC')
                                  : (onboardingConfig.step4?.fields?.expectedSalary?.label || 'Expected Annual CTC')}
                                {onboardingConfig.step4?.fields?.expectedSalary?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px]">
                                {previewSalaryType === 'Monthly'
                                  ? (onboardingConfig.step4?.fields?.expectedSalary?.placeholder ? onboardingConfig.step4.fields.expectedSalary.placeholder.replace(/7,50,000|750000|8,00,000|800000/g, '60,000') : 'e.g. 60,000')
                                  : (onboardingConfig.step4?.fields?.expectedSalary?.placeholder || 'e.g. 7,50,000')}
                              </div>
                            </div>
                          </div>

                          {/* 4. Key Skills */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block font-bold text-gray-700 text-[11px]">
                                {onboardingConfig.step4?.fields?.skills?.label || 'Key Skills'}
                                {onboardingConfig.step4?.fields?.skills?.isRequired && <span className="text-red-500 font-bold ml-0.5">*</span>}
                              </label>
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                {(onboardingConfig.step4?.skillsOptions || DEFAULT_SKILLS_OPTIONS).length} options configured
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {((onboardingConfig.step4?.skillsOptions || DEFAULT_SKILLS_OPTIONS).slice(0, 4)).map(s => (
                                <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100">
                                  {s} ✕
                                </span>
                              ))}
                            </div>
                            <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-400 text-[11px]">
                              {onboardingConfig.step4?.fields?.skills?.placeholder || 'Search or select a skill to add...'}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 flex justify-between">
                          <div className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">{onboardingConfig.buttons?.backBtnText || 'Back'}</div>
                          <div className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">{onboardingConfig.buttons?.nextBtnText || 'Save & Continue'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: DOCUMENTS */}
            {onboardingSubTab === 'step5' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <FileUp className="w-4 h-4 text-emerald-600" />
                          Step 5: Documents & Media Controls
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Customize resume, cover letter, and intro video labels and requirement settings.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Section Header Title</label>
                        <input
                          type="text"
                          value={onboardingConfig.step5?.title || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step5: { ...prev.step5, title: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Section Subtitle</label>
                        <input
                          type="text"
                          value={onboardingConfig.step5?.subtitle || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step5: { ...prev.step5, subtitle: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      {step5FieldKeys.filter(k => k.key !== 'introVideo').map(item => {
                        const defaultStep5Fields = {
                          resume: { label: 'Resume (PDF/DOCX)', placeholder: 'Supported Formats: doc, docx, pdf, upto 300KB', isRequired: true },
                          coverLetter: { label: 'Cover Letter', placeholder: 'Supported Formats: doc, docx, pdf, upto 300KB', isRequired: false }
                        };
                        const fieldData = onboardingConfig.step5?.fields?.[item.key] || defaultStep5Fields[item.key] || { label: item.defaultLabel || item.title, placeholder: item.defaultPlaceholder || '', isRequired: item.key === 'resume' };
                        const isReq = fieldData.isRequired !== false;
                        return (
                          <div key={item.key} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/70 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                {item.title}
                                {isReq && <span className="text-red-500 text-sm font-bold">*</span>}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleOnboardingMandatoryToggle('step5', item.key)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                  isReq
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}
                              >
                                {isReq ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Mandatory (*)
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    Optional
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Field Label Text</label>
                                <input
                                  type="text"
                                  value={fieldData.label || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step5', item.key, 'label', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Helper / Placeholder Text</label>
                                <input
                                  type="text"
                                  value={fieldData.placeholder || ''}
                                  onChange={(e) => handleOnboardingFieldChange('step5', item.key, 'placeholder', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Introductory Video & Paste Link Full Customization Card */}
                      {(() => {
                        const vCfg = onboardingConfig.step5?.videoConfig || {};
                        const vReq = onboardingConfig.step5?.fields?.introVideo?.isRequired === true;
                        
                        const updateVideoCfg = (key, val) => {
                          setOnboardingConfig(prev => ({
                            ...prev,
                            step5: {
                              ...prev.step5,
                              videoConfig: {
                                ...(prev.step5?.videoConfig || {}),
                                [key]: val
                              }
                            }
                          }));
                        };

                        return (
                          <div className="p-5 bg-gradient-to-br from-emerald-50/50 via-white to-gray-50/80 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between border-b border-emerald-100/80 pb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                  <Video className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-extrabold text-gray-900 block">
                                    Introductory Video & Link Customization
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    Customize all labels, tabs, dropzone texts, URL placeholder, and attach button
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOnboardingMandatoryToggle('step5', 'introVideo')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                  vReq
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}
                              >
                                {vReq ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Mandatory (*)
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    Optional
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Section Title</label>
                                <input
                                  type="text"
                                  value={vCfg.sectionTitle !== undefined ? vCfg.sectionTitle : 'Introductory Video'}
                                  onChange={(e) => updateVideoCfg('sectionTitle', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Section Subtitle</label>
                                <input
                                  type="text"
                                  value={vCfg.sectionSubtitle !== undefined ? vCfg.sectionSubtitle : 'Upload MP4/MOV or attach video link'}
                                  onChange={(e) => updateVideoCfg('sectionSubtitle', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">"Upload File" Tab Button Text</label>
                                <input
                                  type="text"
                                  value={vCfg.uploadTabLabel !== undefined ? vCfg.uploadTabLabel : 'Upload File'}
                                  onChange={(e) => updateVideoCfg('uploadTabLabel', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">"Paste Link" Tab Button Text</label>
                                <input
                                  type="text"
                                  value={vCfg.linkTabLabel !== undefined ? vCfg.linkTabLabel : 'Paste Link'}
                                  onChange={(e) => updateVideoCfg('linkTabLabel', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Dropzone Title (Upload File)</label>
                                <input
                                  type="text"
                                  value={vCfg.uploadDropzoneTitle !== undefined ? vCfg.uploadDropzoneTitle : 'Click or drag video to upload'}
                                  onChange={(e) => updateVideoCfg('uploadDropzoneTitle', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Dropzone Subtitle (Format Limits)</label>
                                <input
                                  type="text"
                                  value={vCfg.uploadDropzoneSubtitle !== undefined ? vCfg.uploadDropzoneSubtitle : 'MP4, MOV, WebM up to 200MB (Max 3 mins)'}
                                  onChange={(e) => updateVideoCfg('uploadDropzoneSubtitle', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Link Input Placeholder (Paste Link Mode)</label>
                                <input
                                  type="text"
                                  value={vCfg.linkInputPlaceholder !== undefined ? vCfg.linkInputPlaceholder : 'e.g. YouTube, Loom, Vimeo, Drive, or Mux stream link'}
                                  onChange={(e) => updateVideoCfg('linkInputPlaceholder', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Link "Attach" Button Text</label>
                                <input
                                  type="text"
                                  value={vCfg.linkAttachButtonText !== undefined ? vCfg.linkAttachButtonText : 'Attach'}
                                  onChange={(e) => updateVideoCfg('linkAttachButtonText', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Supported Links Help Text</label>
                                <input
                                  type="text"
                                  value={vCfg.linkHelpText !== undefined ? vCfg.linkHelpText : 'Supported: YouTube, Loom, Vimeo, Google Drive, Mux Stream URLs, and MP4 links.'}
                                  onChange={(e) => updateVideoCfg('linkHelpText', e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Right 5 Columns: Step 5 Live Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Onboarding Preview</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 5: 83% Completed</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                      <div className="p-5 border-b border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-black text-gray-900 text-base">{onboardingConfig.header?.title || 'Create your Profile'}</h3>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                            83% Completed
                          </span>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '83%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                        <div className="border-b border-gray-200 pb-2">
                          <h4 className="font-bold text-gray-800 text-sm">{onboardingConfig.step5?.title || 'Documents & Media'}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">{onboardingConfig.step5?.subtitle || 'Upload your resume, cover letter, and introductory video'}</p>
                        </div>

                        {/* Side by side 2 cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Resume Upload Card */}
                          <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2">
                            <label className="block font-bold text-gray-900 text-xs">
                              {onboardingConfig.step5?.fields?.resume?.label || 'Resume (PDF/DOCX)'}
                              {onboardingConfig.step5?.fields?.resume?.isRequired !== false && <span className="text-red-500 font-bold ml-1">*</span>}
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full text-[10px]">Choose File</span>
                              <span className="text-[10px] text-gray-500">No file chosen</span>
                            </div>
                            <p className="text-[10px] text-gray-600 font-medium">{onboardingConfig.step5?.fields?.resume?.placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}</p>
                          </div>

                          {/* Cover Letter Upload Card */}
                          <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2">
                            <label className="block font-bold text-gray-900 text-xs">
                              {onboardingConfig.step5?.fields?.coverLetter?.label || 'Cover Letter'}
                              {onboardingConfig.step5?.fields?.coverLetter?.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full text-[10px]">Choose File</span>
                              <span className="text-[10px] text-gray-500">No file chosen</span>
                            </div>
                            <p className="text-[10px] text-gray-600 font-medium">{onboardingConfig.step5?.fields?.coverLetter?.placeholder || 'Supported Formats: doc, docx, pdf, upto 300KB'}</p>
                          </div>
                        </div>

                        {/* Introductory Video Card */}
                        {(() => {
                          const vCfg = onboardingConfig.step5?.videoConfig || {};
                          const vTitle = vCfg.sectionTitle || onboardingConfig.step5?.fields?.introVideo?.label || 'Introductory Video';
                          const vSub = vCfg.sectionSubtitle || onboardingConfig.step5?.fields?.introVideo?.placeholder || 'Upload MP4/MOV or attach video link';
                          const vUploadTab = vCfg.uploadTabLabel || 'Upload File';
                          const vLinkTab = vCfg.linkTabLabel || 'Paste Link';
                          const vDropTitle = vCfg.uploadDropzoneTitle || 'Click or drag video to upload';
                          const vDropSub = vCfg.uploadDropzoneSubtitle || 'MP4, MOV, WebM up to 200MB (Max 3 mins)';
                          const vPlaceholder = vCfg.linkInputPlaceholder || 'e.g. YouTube, Loom, Vimeo, Drive, or Mux stream link';
                          const vAttach = vCfg.linkAttachButtonText || 'Attach';
                          const vHelp = vCfg.linkHelpText || 'Supported: YouTube, Loom, Vimeo, Google Drive, Mux Stream URLs, and MP4 links.';

                          return (
                            <div className="p-4 border border-emerald-200 rounded-2xl bg-white space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>{vTitle}</span>
                                    {onboardingConfig.step5?.fields?.introVideo?.isRequired && (
                                      <span className="text-red-500 font-bold ml-0.5">*</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">{vSub}</p>
                                </div>
                                <div className="flex bg-gray-100 p-0.5 rounded-lg text-[10px] font-semibold shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewVideoTab('upload')}
                                    className={`px-2 py-0.5 rounded-md transition-all ${previewVideoTab === 'upload' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500'}`}
                                  >
                                    {vUploadTab}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewVideoTab('link')}
                                    className={`px-2 py-0.5 rounded-md transition-all ${previewVideoTab === 'link' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-500'}`}
                                  >
                                    {vLinkTab}
                                  </button>
                                </div>
                              </div>

                              {previewVideoTab === 'upload' ? (
                                <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center flex flex-col items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
                                    <Video className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-bold text-emerald-600 block">{vDropTitle}</span>
                                  <span className="text-[10px] text-gray-400 block mt-0.5">{vDropSub}</span>
                                </div>
                              ) : (
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-left">
                                  <div className="flex gap-2">
                                    <div className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-400 truncate">
                                      {vPlaceholder}
                                    </div>
                                    <span className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg shrink-0">
                                      {vAttach}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-gray-400">{vHelp}</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="pt-3 flex justify-between">
                          <div className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">{onboardingConfig.buttons?.backBtnText || 'Back'}</div>
                          <div className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">{onboardingConfig.buttons?.nextBtnText || 'Save & Continue'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: FINAL REVIEW */}
            {onboardingSubTab === 'step6' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                          Step 6: Final Review Controls
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Customize final review title, subtitle, and final submission button.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Final Review Title</label>
                        <input
                          type="text"
                          value={onboardingConfig.step6?.title || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step6: { ...prev.step6, title: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Submit Button Text</label>
                        <input
                          type="text"
                          value={onboardingConfig.buttons?.submitBtnText || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, buttons: { ...prev.buttons, submitBtnText: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-gray-700 mb-1">Final Review Subtitle</label>
                        <input
                          type="text"
                          value={onboardingConfig.step6?.subtitle || ''}
                          onChange={(e) => setOnboardingConfig(prev => ({ ...prev, step6: { ...prev.step6, subtitle: e.target.value } }))}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 Columns: Step 6 Live Preview */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="sticky top-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Live Onboarding Preview</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Step 6: 100% Completed</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-left">
                      <div className="p-5 border-b border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-black text-gray-900 text-base">{onboardingConfig.header?.title || 'Create your Profile'}</h3>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold py-0.5 px-2 uppercase rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 inline-block">
                            100% Completed
                          </span>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 text-xs bg-gray-50/40">
                        <div className="text-center">
                          <h4 className="font-black text-gray-900 text-sm">{onboardingConfig.step6?.title || 'Final Review'}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{onboardingConfig.step6?.subtitle || 'Please review all details before submitting.'}</p>
                        </div>

                        <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1">
                          <span className="font-bold text-gray-800 text-[11px]">Basic Details Summary</span>
                          <p className="text-gray-500 text-[10px]">Sonic 16t • 9876543210 • sonic16t@gmail.com</p>
                        </div>

                        <div className="pt-3 flex justify-between">
                          <div className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">{onboardingConfig.buttons?.backBtnText || 'Back'}</div>
                          <div className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md">{onboardingConfig.buttons?.submitBtnText || 'Submit Profile'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 3. Overview Section */}
        {activeSection === 'overview' && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-8 shadow-xs text-center py-20 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Employees Management & CMS</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Select <b>Authentication</b> (Login & Register) or <b>Onboarding</b> (Steps 1 to 6) in the left sidebar to edit live page controls, text labels, and required field settings!
            </p>
          </div>
        )}

      </main>

    </div>
  );
}
