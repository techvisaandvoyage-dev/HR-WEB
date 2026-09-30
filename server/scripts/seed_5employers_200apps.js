const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Employer = require('../employer/models/Employer');
const Employee = require('../employee/models/Employee');
const Job = require('../models/Job');
const Application = require('../models/Application');

const EMPLOYERS_DATA = [
  {
    fullName: 'Ananya Sharma',
    email: 'hr.googleindia@sahijob-dummy.com',
    mobile: '9811223344',
    accountType: 'company',
    hiringFor: 'your_company',
    companyName: 'Google Cloud India',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=200&auto=format&fit=crop&q=80',
    industry: 'Information Technology & Cloud',
    employees: '1000+ Employees',
    designation: 'Senior Lead Technical Recruiter',
    location: 'Bengaluru, Karnataka',
    aboutCompany: 'Google Cloud provides organizations with leading infrastructure, platform capabilities and industry solutions.',
    website: 'https://cloud.google.com',
    authProvider: 'local'
  },
  {
    fullName: 'Rajesh Verma',
    email: 'recruitment@tcs-enterprises.com',
    mobile: '9822334455',
    accountType: 'company',
    hiringFor: 'your_company',
    companyName: 'Tata Consultancy Services (TCS)',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80',
    industry: 'IT Services & Consulting',
    employees: '5000+ Employees',
    designation: 'Head of Talent Acquisition',
    location: 'Mumbai, Maharashtra',
    aboutCompany: 'TCS is a purpose-led transformation partner assisting top global enterprises in digital technology.',
    website: 'https://www.tcs.com',
    authProvider: 'local'
  },
  {
    fullName: 'Pooja Malhotra',
    email: 'careers@zomato-tech.com',
    mobile: '9833445566',
    accountType: 'company',
    hiringFor: 'your_company',
    companyName: 'Zomato Media Ltd',
    companyLogo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
    industry: 'E-commerce & FoodTech',
    employees: '500-1000 Employees',
    designation: 'HR Business Partner',
    location: 'Gurgaon, Haryana',
    aboutCompany: 'Zomato is an Indian multinational restaurant aggregator and food delivery company connecting millions daily.',
    website: 'https://www.zomato.com',
    authProvider: 'local'
  },
  {
    fullName: 'Vikram Sengupta',
    email: 'hr@swiggy-deliveries.com',
    mobile: '9844556677',
    accountType: 'company',
    hiringFor: 'your_company',
    companyName: 'Swiggy Technologies',
    companyLogo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&auto=format&fit=crop&q=80',
    industry: 'Logistics & Supply Chain Tech',
    employees: '1000+ Employees',
    designation: 'Director of Human Resources',
    location: 'Bengaluru, Karnataka',
    aboutCompany: 'Swiggy is India’s leading on-demand convenience platform with hyper-fast quick commerce delivery.',
    website: 'https://www.swiggy.com',
    authProvider: 'local'
  },
  {
    fullName: 'Kavita Deshmukh',
    email: 'hiring@flipkart-retail.com',
    mobile: '9855667788',
    accountType: 'company',
    hiringFor: 'your_company',
    companyName: 'Flipkart Internet Pvt Ltd',
    companyLogo: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=200&auto=format&fit=crop&q=80',
    industry: 'Retail & E-commerce',
    employees: '2000+ Employees',
    designation: 'Senior Talent Partner',
    location: 'Noida / Delhi NCR',
    aboutCompany: 'Flipkart is an Indian e-commerce powerhouse driving digital shopping and innovation across South Asia.',
    website: 'https://www.flipkart.com',
    authProvider: 'local'
  }
];

const JOBS_METADATA = [
  {
    title: 'Lead Full Stack Engineer (React + Node.js)',
    location: 'Bengaluru, Karnataka (Hybrid)',
    salary: '₹18,00,000 - ₹28,00,000 / year',
    employerProvided: true,
    rating: '4.8',
    easyApply: true,
    details: {
      workLocation: 'Bengaluru / Hybrid',
      jobTitle: 'Lead Full Stack Engineer',
      employmentType: 'Full Time',
      experience: '4 - 8 Years',
      aboutRole: 'Lead architecture, build microservices, and manage high-scale web distributed cloud applications.',
      responsibilities: 'Design robust APIs, scale MongoDB/PostgreSQL clusters, build slick React interfaces and mentor engineers.',
      skillsRequired: 'React.js, Node.js, Express, MongoDB, AWS, Docker, TypeScript, Microservices, Redis',
      salary: '₹18,00,000 - ₹28,00,000 / year',
      salaryType: 'Annual',
      currency: 'INR',
      salaryMin: '1800000',
      salaryMax: '2800000',
      openings: '4',
      qualification: 'B.Tech / B.E. / M.Tech / MCA',
      stream: 'Computer Science / Information Technology',
      jobCategory: 'IT & Software Engineering',
      industry: 'Information Technology'
    },
    screeningQuestions: [
      { question: 'Do you have 4+ years of hands-on experience in React.js and Node.js backend systems?', type: 'Yes/No', required: true },
      { question: 'Have you designed and deployed microservices on AWS or GCP in production?', type: 'Yes/No', required: true },
      { question: 'What is your official notice period (in days)?', type: 'Short Text', required: true },
      { question: 'What is your current CTC and expected annual CTC (in LPA)?', type: 'Short Text', required: true },
      { question: 'Can you work in our Bengaluru office in a 3-day hybrid model?', type: 'Yes/No', required: true }
    ]
  },
  {
    title: 'Senior Enterprise Cloud & DevOps Architect',
    location: 'Mumbai, Maharashtra (On-Site)',
    salary: '₹22,00,000 - ₹35,00,000 / year',
    employerProvided: true,
    rating: '4.7',
    easyApply: true,
    details: {
      workLocation: 'Mumbai / On-Site',
      jobTitle: 'Senior Cloud & DevOps Architect',
      employmentType: 'Full Time',
      experience: '5 - 10 Years',
      aboutRole: 'Drive cloud transformation pipelines, Kubernetes orchestration, CI/CD automation and enterprise security posture.',
      responsibilities: 'Manage Kubernetes infrastructure, automate deployments with Terraform and CI/CD, monitor AWS cloud workloads.',
      skillsRequired: 'AWS, Azure, Kubernetes, Docker, Terraform, CI/CD, Linux, Python, Monitoring (Prometheus/Grafana)',
      salary: '₹22,00,000 - ₹35,00,000 / year',
      salaryType: 'Annual',
      currency: 'INR',
      salaryMin: '2200000',
      salaryMax: '3500000',
      openings: '3',
      qualification: 'B.Tech / B.E. / MCA',
      stream: 'Computer Science / Cloud Systems',
      jobCategory: 'DevOps & Cloud Engineering',
      industry: 'IT Services & Consulting'
    },
    screeningQuestions: [
      { question: 'Are you certified in AWS Solutions Architect or CKA (Kubernetes)?', type: 'Yes/No', required: true },
      { question: 'Do you have production experience writing Terraform infrastructure-as-code modules?', type: 'Yes/No', required: true },
      { question: 'What is your current notice period in days?', type: 'Short Text', required: true },
      { question: 'What is your current and expected salary package?', type: 'Short Text', required: true },
      { question: 'Are you open to working on-site at our Mumbai campus?', type: 'Yes/No', required: true }
    ]
  },
  {
    title: 'Senior Product Manager (Consumer Growth & Retention)',
    location: 'Gurgaon, Haryana (Hybrid)',
    salary: '₹20,00,000 - ₹32,00,000 / year + ESOPs',
    employerProvided: true,
    rating: '4.9',
    easyApply: true,
    details: {
      workLocation: 'Gurgaon / Hybrid',
      jobTitle: 'Senior Product Manager (Growth)',
      employmentType: 'Full Time',
      experience: '3 - 7 Years',
      aboutRole: 'Own growth product roadmap, user acquisition funnels, retention algorithms, and cross-functional product delivery.',
      responsibilities: 'Analyze funnel metrics, run A/B growth experiments, coordinate with engineering, UX and marketing teams.',
      skillsRequired: 'Product Management, Growth Hacking, SQL, A/B Testing, User Research, Wireframing, Agile Scrum, Mixpanel',
      salary: '₹20,00,000 - ₹32,00,000 / year',
      salaryType: 'Annual',
      currency: 'INR',
      salaryMin: '2000000',
      salaryMax: '3200000',
      openings: '2',
      qualification: 'MBA / B.Tech / Any Graduate',
      stream: 'Management / Computer Science',
      jobCategory: 'Product Management',
      industry: 'E-commerce & Consumer Tech'
    },
    screeningQuestions: [
      { question: 'Have you managed high-volume B2C consumer app product growth before?', type: 'Yes/No', required: true },
      { question: 'Can you write SQL queries to independently pull analytics and run user cohort analysis?', type: 'Yes/No', required: true },
      { question: 'Mention 1 major growth metric / experiment you successfully scaled in your previous role:', type: 'Short Text', required: true },
      { question: 'What is your current CTC and expected CTC (in LPA)?', type: 'Short Text', required: true },
      { question: 'What is your notice period (immediate/30/60/90 days)?', type: 'Short Text', required: true }
    ]
  },
  {
    title: 'Lead UI/UX & Product Design Specialist',
    location: 'Bengaluru, Karnataka (Remote / Hybrid)',
    salary: '₹14,00,000 - ₹22,00,000 / year',
    employerProvided: true,
    rating: '4.6',
    easyApply: true,
    details: {
      workLocation: 'Remote / Bengaluru',
      jobTitle: 'Lead UI/UX & Product Designer',
      employmentType: 'Full Time',
      experience: '3 - 6 Years',
      aboutRole: 'Craft high-converting user journeys, design systems, interactive prototypes and delightful mobile experiences.',
      responsibilities: 'Build scalable Figma design tokens, conduct usability testing, collaborate with developers on UI delivery.',
      skillsRequired: 'Figma, Design Systems, Prototyping, Wireframing, User Journey Mapping, Adobe XD, Mobile App Design',
      salary: '₹14,00,000 - ₹22,00,000 / year',
      salaryType: 'Annual',
      currency: 'INR',
      salaryMin: '1400000',
      salaryMax: '2200000',
      openings: '3',
      qualification: 'B.Des / M.Des / BFA / BCA / Graduate',
      stream: 'Interaction Design / Graphic Design / Tech',
      jobCategory: 'Design & Creative',
      industry: 'Logistics & Supply Chain Tech'
    },
    screeningQuestions: [
      { question: 'Please share your live design portfolio link (Figma, Behance, Dribbble or Personal Site):', type: 'Short Text', required: true },
      { question: 'Are you advanced in building atomic design systems and auto-layout in Figma?', type: 'Yes/No', required: true },
      { question: 'How many years of mobile app UI/UX experience do you possess?', type: 'Short Text', required: true },
      { question: 'Are you comfortable participating in design review rounds and practical design challenges?', type: 'Yes/No', required: true },
      { question: 'What is your current notice period and location?', type: 'Short Text', required: true }
    ]
  },
  {
    title: 'Senior Corporate Business Development & Sales Manager',
    location: 'Noida / Delhi NCR (On-Site)',
    salary: '₹8,00,000 - ₹15,00,000 / year + High Incentives',
    employerProvided: true,
    rating: '4.8',
    easyApply: true,
    details: {
      workLocation: 'Noida / Delhi NCR',
      jobTitle: 'Senior Business Development Manager',
      employmentType: 'Full Time',
      experience: '2 - 6 Years',
      aboutRole: 'Drive B2B enterprise partnerships, corporate client acquisitions, strategic deal structuring and team revenue targets.',
      responsibilities: 'Pitch to CXO-level corporate executives, negotiate contracts, nurture enterprise key accounts, manage pipeline.',
      skillsRequired: 'B2B Sales, Enterprise Account Management, Lead Generation, CRM, Contract Negotiation, Strategic Partnerships',
      salary: '₹8,00,000 - ₹15,00,000 / year',
      salaryType: 'Annual',
      currency: 'INR',
      salaryMin: '800000',
      salaryMax: '1500000',
      openings: '5',
      qualification: 'BBA / MBA / Any Graduate',
      stream: 'Business Administration / Marketing / Commerce',
      jobCategory: 'Sales & Business Development',
      industry: 'Retail & E-commerce'
    },
    screeningQuestions: [
      { question: 'Do you have proven track record in B2B corporate sales and enterprise client acquisition?', type: 'Yes/No', required: true },
      { question: 'Are you comfortable with in-person client presentations and on-site business meetings across Delhi NCR?', type: 'Yes/No', required: true },
      { question: 'What was your highest quarterly revenue milestone achieved in your career?', type: 'Short Text', required: true },
      { question: 'What is your current salary and expected fixed + variable compensation package?', type: 'Short Text', required: true },
      { question: 'What is your joining notice period (in days)?', type: 'Short Text', required: true }
    ]
  }
];

const FIRST_NAMES = [
  'Aarav', 'Rohan', 'Priya', 'Ananya', 'Vikram', 'Aditya', 'Neha', 'Sneha', 'Rahul', 'Karan',
  'Pooja', 'Amit', 'Divya', 'Siddharth', 'Riya', 'Manish', 'Kritika', 'Abhishek', 'Shreya', 'Gaurav',
  'Megha', 'Varun', 'Swati', 'Harsh', 'Tanvi', 'Deepak', 'Simran', 'Naveen', 'Isha', 'Akash',
  'Preeti', 'Kunal', 'Rashmi', 'Mayank', 'Nidhi', 'Sachin', 'Sonali', 'Alok', 'Pallavi', 'Tarun',
  'Kavita', 'Mohit', 'Anjali', 'Nitin', 'Payal', 'Yash', 'Shruti', 'Arjun', 'Bhavna', 'Girish',
  'Aishwarya', 'Vivek', 'Rupal', 'Sunil', 'Garima', 'Parth', 'Twinkle', 'Kartik', 'Kajal', 'Harish',
  'Monika', 'Dev', 'Shalini', 'Rajat', 'Bhumika', 'Chirag', 'Tanya', 'Prashant', 'Deepika', 'Aakash',
  'Barkha', 'Hemant', 'Komal', 'Saurabh', 'Jyoti', 'Chetan', 'Urvashi', 'Sumit', 'Sakshi', 'Lokesh',
  'Nandini', 'Vipin', 'Sapna', 'Gagan', 'Archana', 'Aman', 'Himanshi', 'Pradeep', 'Juhi', 'Pankaj',
  'Muskan', 'Rajesh', 'Dimple', 'Lalit', 'Shweta', 'Kamal', 'Ritu', 'Bhupendra', 'Mansi', 'Ojas'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Mishra', 'Joshi', 'Chauhan', 'Yadav',
  'Trivedi', 'Mehta', 'Nair', 'Reddy', 'Saxena', 'Bhatia', 'Malhotra', 'Agarwal', 'Pandey', 'Kashyap',
  'Iyer', 'Menon', 'Rao', 'Deshmukh', 'Kulkarni', 'Bose', 'Chatterjee', 'Das', 'Sen', 'Mukherjee'
];

const INSTITUTES = [
  'IIT Delhi', 'IIT Bombay', 'IIT Roorkee', 'BITS Pilani', 'DTU, Delhi', 'Delhi University (DU)',
  'Amity University, Noida', 'Jamia Millia Islamia', 'IP University, Delhi', 'NIT Kurukshetra',
  'Chandigarh University', 'Symbiosis Pune', 'SRM University, Chennai', 'Manipal University',
  'Jaypee Institute of IT, Noida', 'Galgotias University', 'Christ University, Bangalore',
  'NMIMS Mumbai', 'VIT Vellore', 'Thapar Institute of Eng & Tech'
];

const PREV_COMPANIES = [
  'TCS', 'Infosys Ltd', 'Wipro Technologies', 'HCLTech', 'Cognizant', 'Tech Mahindra',
  'Accenture India', 'Zomato Media', 'Paytm', 'Swiggy', 'Urban Company', 'PolicyBazaar',
  'MakeMyTrip', 'Flipkart India', 'Nykaa Tech', 'Razorpay', 'CRED', 'PhonePe', 'Ola Cabs', 'Lenskart'
];

const CITIES = [
  'Bengaluru', 'Delhi NCR', 'Gurgaon', 'Noida', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh'
];

const DOMAINS = [
  {
    category: 'IT & Software',
    industry: 'Information Technology',
    designations: ['Software Engineer', 'Senior Full Stack Developer', 'Frontend Developer', 'Backend Engineer', 'React Developer'],
    skills: ['React.js', 'Node.js', 'MongoDB', 'TypeScript', 'Redux', 'AWS', 'Express.js', 'REST APIs', 'TailwindCSS'],
    degrees: ['B.Tech in Computer Science', 'MCA', 'B.E. in Information Technology', 'BCA', 'M.Tech Software Systems']
  },
  {
    category: 'DevOps & Cloud',
    industry: 'IT Services & Cloud',
    designations: ['DevOps Engineer', 'Cloud Architect', 'Site Reliability Engineer', 'AWS Cloud Engineer', 'System Admin'],
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD Pipelines', 'Linux', 'Python', 'Monitoring', 'Git'],
    degrees: ['B.Tech in CS / IT', 'B.E. in Electronics', 'MCA', 'B.Sc Computer Science']
  },
  {
    category: 'Product & Analytics',
    industry: 'E-commerce & Consumer Tech',
    designations: ['Product Manager', 'Associate Product Manager', 'Data Analyst', 'Business Analyst', 'Growth Strategist'],
    skills: ['Product Roadmap', 'SQL', 'Mixpanel', 'A/B Testing', 'User Research', 'Agile', 'Jira', 'Data Visualization'],
    degrees: ['MBA in Marketing / Tech', 'B.Tech + MBA', 'B.Sc Statistics / Mathematics', 'BBA in Analytics']
  },
  {
    category: 'Design & Creative',
    industry: 'Design & Media',
    designations: ['UI/UX Designer', 'Lead Product Designer', 'Visual Designer', 'Graphic & Motion Designer', 'Interaction Designer'],
    skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Design Systems', 'User Research', 'Wireframing', 'Prototyping'],
    degrees: ['B.Des in Interaction Design', 'BFA in Graphic Design', 'B.Sc Animation', 'M.Des Industrial Design']
  },
  {
    category: 'Sales & BD',
    industry: 'Corporate Sales & Business',
    designations: ['Business Development Manager', 'Corporate Sales Executive', 'Key Account Manager', 'Enterprise Sales Lead', 'Client Success Manager'],
    skills: ['B2B Sales', 'Lead Generation', 'CRM (Salesforce/Hubspot)', 'Cold Calling', 'Client Negotiation', 'Contract Closing'],
    degrees: ['BBA in Marketing', 'MBA in Sales & Marketing', 'B.Com Honours', 'BA in Communication']
  }
];

async function runSeed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Successfully!');

    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // 1. Create or Update 5 Employers
    console.log('\n--- 1. CREATING 5 EMPLOYER ACCOUNTS ---');
    const createdEmployers = [];

    for (const empData of EMPLOYERS_DATA) {
      let employer = await Employer.findOne({ email: empData.email });
      if (employer) {
        await Employer.updateOne(
          { _id: employer._id },
          { $set: { ...empData, password: hashedPassword } }
        );
        employer = await Employer.findById(employer._id);
        console.log(`Updated employer: ${employer.fullName} (${employer.companyName}) [ID: ${employer._id}]`);
      } else {
        const insertRes = await Employer.collection.insertOne({
          ...empData,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        employer = await Employer.findById(insertRes.insertedId);
        console.log(`Created employer: ${empData.fullName} (${empData.companyName}) [ID: ${employer._id}]`);
      }
      createdEmployers.push(employer);
    }

    // 2. Create 5 Job Posts (1 for each employer)
    console.log('\n--- 2. CREATING 5 JOB POSTS ---');
    const createdJobs = [];

    for (let i = 0; i < createdEmployers.length; i++) {
      const employer = createdEmployers[i];
      const jobMeta = JOBS_METADATA[i];

      let job = await Job.findOne({ employerId: employer._id, title: jobMeta.title });
      if (!job) {
        const jobDoc = {
          employerId: employer._id,
          company: employer.companyName,
          companyInitial: employer.companyName.charAt(0).toUpperCase(),
          companyLogo: employer.companyLogo,
          title: jobMeta.title,
          location: jobMeta.location,
          salary: jobMeta.salary,
          employerProvided: jobMeta.employerProvided,
          rating: jobMeta.rating,
          easyApply: jobMeta.easyApply,
          status: 'Active',
          statusColor: 'bg-green-100 text-green-700',
          details: jobMeta.details,
          screeningQuestions: jobMeta.screeningQuestions,
          recruiterActions: Math.floor(Math.random() * 10) + 5,
          createdAt: new Date(Date.now() - (30 - i * 4) * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        };
        const insertRes = await Job.collection.insertOne(jobDoc);
        job = await Job.findById(insertRes.insertedId);
        console.log(`Created Job #${i + 1}: "${job.title}" for ${employer.companyName} [ID: ${job._id}]`);
      } else {
        console.log(`Using existing Job #${i + 1}: "${job.title}" for ${employer.companyName} [ID: ${job._id}]`);
      }
      createdJobs.push(job);
    }

    // 3. Create 100 Candidates (Employee records)
    console.log('\n--- 3. CREATING 100 DUMMY CANDIDATES ---');
    const lastCand = await Employee.findOne({ candidateId: { $exists: true, $ne: null } }).sort({ candidateId: -1 });
    let startCandidateId = (lastCand && lastCand.candidateId) ? lastCand.candidateId + 1 : 310001;

    const candidateDocsToInsert = [];
    const createdEmployees = [];

    for (let i = 0; i < 100; i++) {
      const fName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lName = LAST_NAMES[i % LAST_NAMES.length];
      const name = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${400 + i}@gmail.com`;
      const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const domain = DOMAINS[i % DOMAINS.length];
      const expYears = (i % 8) + 1;
      const isFresher = expYears <= 1 && (i % 6 === 0);
      const institute = INSTITUTES[i % INSTITUTES.length];
      const prevCompany = PREV_COMPANIES[i % PREV_COMPANIES.length];
      const location = CITIES[i % CITIES.length];
      const prefLocation = CITIES[(i + 2) % CITIES.length];
      const degree = domain.degrees[i % domain.degrees.length];
      const designation = isFresher ? 'Trainee / Associate' : domain.designations[i % domain.designations.length];
      const curSal = isFresher ? 'N/A' : `₹ ${(3.5 + (expYears * 1.75)).toFixed(1)} LPA`;
      const expSal = isFresher ? '₹ 4.5 LPA' : `₹ ${(5.5 + (expYears * 2.25)).toFixed(1)} LPA`;
      const resumeUrl = `https://sahijob.com/resumes/dummy_resume_${fName.toLowerCase()}_${i + 1}.pdf`;

      const existingEmp = await Employee.findOne({ email });
      if (existingEmp) {
        createdEmployees.push(existingEmp);
      } else {
        candidateDocsToInsert.push({
          candidateId: startCandidateId++,
          name,
          email,
          password: hashedPassword,
          authProvider: 'local',
          mobile,
          location,
          preferredLocation: prefLocation,
          designation,
          industry: domain.industry,
          totalExperience: isFresher ? 'Fresher' : `${expYears} Years`,
          brief: `Enthusiastic ${designation} with ${isFresher ? 'strong foundational knowledge' : `${expYears} years of expertise in ${domain.category}`}. Experienced in delivering scalable solutions and collaborative team contributions.`,
          avatar: `https://images.unsplash.com/photo-${1500000000000 + (i * 1234567) % 500000000}?w=150&auto=format&fit=crop&q=80`,
          resume: resumeUrl,
          coverLetter: `Hello Hiring Team, I am eager to apply and leverage my ${domain.category} skills to make a valuable impact at your esteemed organization.`,
          isFresher,
          qualifications: [{
            degree,
            institution: institute,
            yearOfPassing: `${2025 - expYears}`,
            score: `${72 + (i % 24)}%`
          }],
          experience: isFresher ? [] : [{
            companyName: prevCompany,
            title: designation,
            duration: `${expYears} Years`,
            description: `Key contributor at ${prevCompany} focusing on ${domain.skills.slice(0, 3).join(', ')}.`
          }],
          professionalDetails: {
            currentCompany: isFresher ? 'N/A' : prevCompany,
            currentDesignation: designation,
            currentSalary: curSal,
            expectedSalary: expSal,
            functionalArea: domain.category
          },
          skills: domain.skills,
          isOnboardingCompleted: true,
          onboardingStep: 4,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000)),
          updatedAt: new Date()
        });
      }
    }

    if (candidateDocsToInsert.length > 0) {
      const insertResult = await Employee.collection.insertMany(candidateDocsToInsert);
      const insertedIds = Object.values(insertResult.insertedIds);
      const newlyInsertedEmployees = await Employee.find({ _id: { $in: insertedIds } });
      createdEmployees.push(...newlyInsertedEmployees);
      console.log(`Inserted ${candidateDocsToInsert.length} new dummy candidates into MongoDB.`);
    }
    console.log(`Total Candidates pool: ${createdEmployees.length}`);

    // 4. Create 200 Applications across the 5 Jobs (40 apps each)
    console.log('\n--- 4. CREATING 200 APPLICATIONS ACROSS 5 JOBS ---');
    const lastApp = await Application.findOne({ applicationNumber: { $exists: true } }).sort({ applicationNumber: -1 });
    let appNumber = (lastApp && lastApp.applicationNumber) ? lastApp.applicationNumber + 1 : 600101;

    const APPS_PER_JOB = [40, 40, 40, 40, 40];
    const statuses = ['New', 'Shortlisted', 'Viewed', 'Rejected'];
    const allAppDocs = [];

    for (let jobIdx = 0; jobIdx < createdJobs.length; jobIdx++) {
      const job = createdJobs[jobIdx];
      const employer = createdEmployers[jobIdx];
      const targetCount = APPS_PER_JOB[jobIdx];
      const questions = job.screeningQuestions || [];

      for (let k = 0; k < targetCount; k++) {
        const candidateIdx = (k * 2 + jobIdx) % createdEmployees.length;
        const candidate = createdEmployees[candidateIdx];

        const status = statuses[(k + jobIdx) % statuses.length];
        const statusColor = status === 'Shortlisted' 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
          : (status === 'Viewed' 
            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
            : (status === 'Rejected' 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'));

        const screeningAnswers = questions.map((q) => {
          if (q.type === 'Yes/No') {
            return {
              question: q.question,
              answer: (k % 6 === 0) ? 'No' : 'Yes'
            };
          } else {
            const qLower = q.question.toLowerCase();
            if (qLower.includes('notice')) {
              return { question: q.question, answer: (k % 3 === 0) ? 'Immediate (15 Days)' : (k % 3 === 1 ? '30 Days' : '45 Days') };
            } else if (qLower.includes('ctc') || qLower.includes('salary')) {
              return { question: q.question, answer: `Current: ${candidate.professionalDetails?.currentSalary || '7 LPA'}, Expected: ${candidate.professionalDetails?.expectedSalary || '11 LPA'}` };
            } else if (qLower.includes('portfolio') || qLower.includes('link')) {
              return { question: q.question, answer: `https://portfolio.me/${candidate.name.toLowerCase().replace(/\s+/g, '')}` };
            } else if (qLower.includes('metric') || qLower.includes('revenue')) {
              return { question: q.question, answer: `Exceeded target by ${120 + (k % 25)}% in previous fiscal year` };
            } else if (qLower.includes('experience') || qLower.includes('years')) {
              return { question: q.question, answer: `${candidate.totalExperience || '3 Years'} relevant professional experience` };
            } else {
              return { question: q.question, answer: 'Yes, fully experienced and qualified for this position.' };
            }
          }
        });

        const appliedAt = new Date(Date.now() - Math.floor(Math.random() * 25 * 24 * 60 * 60 * 1000));

        allAppDocs.push({
          applicationNumber: appNumber++,
          jobId: job._id,
          employerId: employer._id,
          employeeId: candidate._id,
          status,
          statusColor,
          screeningAnswers,
          createdAt: appliedAt,
          updatedAt: appliedAt
        });
      }

      // Update Job metrics
      await Job.updateOne(
        { _id: job._id },
        { 
          $set: { 
            applications: targetCount, 
            views: targetCount * 3 + Math.floor(Math.random() * 40) + 30 
          } 
        }
      );
    }

    if (allAppDocs.length > 0) {
      await Application.collection.insertMany(allAppDocs);
      console.log(`Inserted ${allAppDocs.length} Applications successfully!`);
    }

    console.log('\n============================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`- 5 Employer Accounts:`);
    EMPLOYERS_DATA.forEach(e => console.log(`  • ${e.fullName} (${e.companyName}) -> Email: ${e.email} | Pass: Password@123`));
    console.log(`\n- 5 Active Jobs Created (40 applications each = 200 Total Applications)`);
    console.log(`- 100 Dummy Candidates seeded`);
    console.log(`- Total Applications seeded: ${allAppDocs.length}`);
    console.log('============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
}

runSeed();
