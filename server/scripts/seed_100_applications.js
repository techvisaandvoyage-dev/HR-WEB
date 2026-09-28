const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const Job = require('../models/Job');
const Application = require('../models/Application');
const Employee = require('../employee/models/Employee');
const Employer = require('../employer/models/Employer');

const EMPLOYER_ID = '6ab10b19c2de6b4333a7da4f'; // yash raj singh

const JOBS_DATA = [
  {
    title: 'Senior Full Stack Developer (MERN)',
    company: 'Yash Infotech Solutions',
    companyInitial: 'Y',
    location: 'Noida, Uttar Pradesh (Hybrid)',
    salary: '₹12,00,000 - ₹18,00,000 / year',
    status: 'Active',
    easyApply: true,
    details: {
      workLocation: 'Noida / Hybrid',
      jobTitle: 'Senior Full Stack Developer (MERN)',
      employmentType: 'Full Time',
      experience: '3 - 6 Years',
      aboutRole: 'We are seeking an experienced Full Stack Developer to lead our core web architecture.',
      responsibilities: 'Build scalable REST APIs, architect MongoDB schemas, optimize React frontends.',
      skillsRequired: 'React.js, Node.js, Express, MongoDB, Redux, TailwindCSS, AWS, TypeScript',
      salary: '₹12,00,000 - ₹18,00,000 / year',
      salaryType: 'Annual',
      currency: 'INR',
      openings: '3',
      qualification: 'B.Tech / B.E. / MCA',
      stream: 'Computer Science / IT',
      jobCategory: 'IT & Software',
      industry: 'Information Technology'
    },
    screeningQuestions: [
      { question: 'Do you have at least 3+ years of experience with React.js & Node.js?', type: 'Yes/No', required: true },
      { question: 'Are you comfortable with MongoDB complex aggregations & query indexing?', type: 'Yes/No', required: true },
      { question: 'What is your official notice period (in days)?', type: 'Short Text', required: true },
      { question: 'What is your current and expected annual CTC (in LPA)?', type: 'Short Text', required: true },
      { question: 'Can you work from our Noida office in a hybrid setup?', type: 'Yes/No', required: true }
    ]
  },
  {
    title: 'Business Development Executive (Corporate Sales)',
    company: 'Yash Infotech Solutions',
    companyInitial: 'Y',
    location: 'Delhi NCR / Gurgaon',
    salary: '₹4,50,000 - ₹7,50,000 / year + Incentives',
    status: 'Active',
    easyApply: true,
    details: {
      workLocation: 'Delhi NCR / On-Site',
      jobTitle: 'Business Development Executive (Corporate Sales)',
      employmentType: 'Full Time',
      experience: '1 - 4 Years',
      aboutRole: 'Drive new business acquisitions, lead generation, and B2B client presentations.',
      responsibilities: 'Identify prospective corporate clients, conduct product demos, close enterprise deals.',
      skillsRequired: 'B2B Sales, Lead Generation, Cold Calling, CRM, Client Negotiation, Presentation',
      salary: '₹4,50,000 - ₹7,50,000 / year',
      salaryType: 'Annual',
      currency: 'INR',
      openings: '5',
      qualification: 'BBA / MBA / Any Graduate',
      stream: 'Marketing / Sales / Business',
      jobCategory: 'Sales & Business Development',
      industry: 'Corporate Services'
    },
    screeningQuestions: [
      { question: 'Do you have active B2B corporate sales & client acquisition experience?', type: 'Yes/No', required: true },
      { question: 'Are you comfortable traveling for on-site client meetings & product demos?', type: 'Yes/No', required: true },
      { question: 'What was your highest quarterly revenue/sales target achieved?', type: 'Short Text', required: true },
      { question: 'How would you rate your English & Hindi communication skills (1 to 10)?', type: 'Short Text', required: true },
      { question: 'What is your expected fixed and variable CTC structure?', type: 'Short Text', required: true }
    ]
  },
  {
    title: 'Senior UI/UX & Graphic Designer',
    company: 'Yash Infotech Solutions',
    companyInitial: 'Y',
    location: 'Remote / Delhi NCR',
    salary: '₹8,00,000 - ₹12,50,000 / year',
    status: 'Active',
    easyApply: true,
    details: {
      workLocation: 'Remote',
      jobTitle: 'Senior UI/UX & Graphic Designer',
      employmentType: 'Full Time',
      experience: '2 - 5 Years',
      aboutRole: 'Design pixel-perfect web/mobile application interfaces and marketing design systems.',
      responsibilities: 'Create wireframes, high-fidelity prototypes, user journeys, brand guidelines.',
      skillsRequired: 'Figma, Adobe XD, Photoshop, Illustrator, Design Systems, Prototyping, Wireframing',
      salary: '₹8,00,000 - ₹12,50,000 / year',
      salaryType: 'Annual',
      currency: 'INR',
      openings: '2',
      qualification: 'B.Des / BFA / BCA / Any Graduate',
      stream: 'Design / Animation / Computer Applications',
      jobCategory: 'Design & Creative',
      industry: 'Design & Tech'
    },
    screeningQuestions: [
      { question: 'Please share your live design portfolio link (Behance / Dribbble / Figma / Website):', type: 'Short Text', required: true },
      { question: 'Are you proficient in Figma design systems, components, and auto-layout?', type: 'Yes/No', required: true },
      { question: 'How many years of dedicated SaaS web & mobile UI/UX experience do you have?', type: 'Short Text', required: true },
      { question: 'Are you open to completing a 2-3 hour practical design test?', type: 'Yes/No', required: true },
      { question: 'What is your current notice period and location?', type: 'Short Text', required: true }
    ]
  }
];

const FIRST_NAMES = [
  'Aarav', 'Rohan', 'Priya', 'Ananya', 'Vikram', 'Aditya', 'Neha', 'Sneha', 'Rahul', 'Karan',
  'Pooja', 'Amit', 'Divya', 'Siddharth', 'Riya', 'Manish', 'Kritika', 'Abhishek', 'Shreya', 'Gaurav',
  'Megha', 'Varun', 'Swati', 'Harsh', 'Tanvi', 'Deepak', 'Simran', 'Naveen', 'Isha', 'Akash',
  'Preeti', 'Kunal', 'Rashmi', 'Mayank', 'Nidhi', 'Sachin', 'Sonali', 'Alok', 'Pallavi', 'Tarun',
  'Kavita', 'Mohit', 'Anjali', 'Nitin', 'Payal'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Mishra', 'Joshi', 'Chauhan', 'Yadav',
  'Trivedi', 'Mehta', 'Nair', 'Reddy', 'Saxena', 'Bhatia', 'Malhotra', 'Agarwal', 'Pandey', 'Kashyap'
];

const INSTITUTES = [
  'Delhi University (DU)', 'IIT Delhi', 'DTU, Delhi', 'Amity University, Noida', 'Jamia Millia Islamia',
  'BITS Pilani', 'IP University, Delhi', 'NIT Kurukshetra', 'Chandigarh University', 'Symbiosis Pune',
  'SRM University', 'Manipal University', 'IIT Roorkee', 'Jaypee Institute of IT, Noida', 'Galgotias University'
];

const COMPANIES = [
  'TCS (Tata Consultancy Services)', 'Infosys Ltd', 'Wipro Technologies', 'HCLTech', 'Cognizant',
  'Tech Mahindra', 'Accenture India', 'Zomato Media', 'Paytm', 'Swiggy', 'Urban Company',
  'PolicyBazaar', 'MakeMyTrip', 'Flipkart India', 'Nykaa Tech'
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Verify Employer
    const employer = await Employer.findById(EMPLOYER_ID);
    if (!employer) {
      console.error('Employer not found with ID:', EMPLOYER_ID);
      process.exit(1);
    }
    console.log(`Found Employer: ${employer.fullName} (${employer.companyName || 'Company'})`);

    // 2. Create the 3 Jobs
    const createdJobs = [];
    for (const jobData of JOBS_DATA) {
      const job = await Job.create({
        ...jobData,
        employerId: employer._id,
        company: employer.companyName || jobData.company,
        status: 'Active'
      });
      createdJobs.push(job);
      console.log(`Created Job: "${job.title}" with 5 Screening Questions [ID: ${job._id}]`);
    }

    // 3. Create ~45 diverse Candidates/Employees
    const createdEmployees = [];
    for (let i = 0; i < 45; i++) {
      const fName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lName = LAST_NAMES[i % LAST_NAMES.length];
      const name = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${100 + i}@gmail.com`;
      const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const expYears = (i % 6) + 1;
      const isFresher = expYears <= 1 && (i % 5 === 0);
      const institute = INSTITUTES[i % INSTITUTES.length];
      const prevCompany = COMPANIES[i % COMPANIES.length];
      const degree = i % 3 === 0 ? 'B.Tech in Computer Science' : (i % 3 === 1 ? 'BBA / MBA' : 'B.Des / Graphic Communication');
      const curSal = isFresher ? 'N/A' : `₹ ${3.5 + (expYears * 1.8)} LPA`;
      const expSal = isFresher ? '₹ 4.5 LPA' : `₹ ${5.5 + (expYears * 2.2)} LPA`;

      // Check if employee already exists by email
      let emp = await Employee.findOne({ email });
      if (!emp) {
        emp = await Employee.create({
          name,
          email,
          mobile,
          phone: mobile,
          isFresher,
          totalExperience: isFresher ? 'Fresher' : `${expYears} Years`,
          experienceLevel: isFresher ? 'Fresher' : `${expYears} Years`,
          currentCTC: curSal,
          expectedCTC: expSal,
          industry: i % 3 === 0 ? 'IT Software / Development' : (i % 3 === 1 ? 'Sales & BD' : 'UI/UX Design'),
          designation: isFresher ? 'Fresher / Trainee' : (i % 3 === 0 ? 'Software Engineer' : (i % 3 === 1 ? 'Sales Associate' : 'Visual Designer')),
          education: [{
            degree,
            institution: institute,
            yearOfPassing: `${2024 - expYears}`,
            score: `${70 + (i % 25)}%`
          }],
          experience: isFresher ? [] : [{
            companyName: prevCompany,
            title: i % 3 === 0 ? 'Software Developer' : (i % 3 === 1 ? 'Business Development' : 'UI Designer'),
            duration: `${expYears} Years`,
            description: 'Handled core responsibilities, client communications, and deliverables.'
          }],
          professionalDetails: {
            currentCompany: isFresher ? 'N/A' : prevCompany,
            currentDesignation: isFresher ? 'Fresher' : (i % 3 === 0 ? 'Software Developer' : (i % 3 === 1 ? 'Business Development' : 'UI Designer')),
            currentSalary: curSal,
            expectedSalary: expSal,
            functionalArea: i % 3 === 0 ? 'Software Development' : (i % 3 === 1 ? 'Sales & BD' : 'Design')
          },
          skills: i % 3 === 0 ? ['React.js', 'Node.js', 'MongoDB', 'JavaScript'] : (i % 3 === 1 ? ['B2B Sales', 'Lead Gen', 'CRM', 'Negotiation'] : ['Figma', 'Photoshop', 'Illustrator', 'UI Design'])
        });
      }
      createdEmployees.push(emp);
    }
    console.log(`Prepared ${createdEmployees.length} unique candidates.`);

    // 4. Create 100 Applications across the 3 Jobs
    // Some employees will apply to 2 or 3 jobs
    const statuses = ['New', 'Shortlisted', 'Viewed', 'Rejected'];
    let appNumber = 500101;
    const createdApplications = [];

    // Distribution:
    // Job 0 (Dev): ~40 apps
    // Job 1 (Sales): ~35 apps
    // Job 2 (Design): ~25 apps
    // Total: 100 apps

    const targetJobApps = [40, 35, 25];

    for (let jobIdx = 0; jobIdx < createdJobs.length; jobIdx++) {
      const targetJob = createdJobs[jobIdx];
      const appsCount = targetJobApps[jobIdx];
      const questions = targetJob.screeningQuestions;

      for (let k = 0; k < appsCount; k++) {
        // Pick candidate (cyclic with offset so same candidates apply to multiple jobs)
        const candidateIdx = (k + (jobIdx * 7)) % createdEmployees.length;
        const candidate = createdEmployees[candidateIdx];

        // Status distribution
        const status = statuses[(k + jobIdx) % statuses.length];

        // Generate tailored answers for this job's 5 screening questions
        const screeningAnswers = questions.map((q, qIdx) => {
          if (q.type === 'Yes/No') {
            return {
              question: q.question,
              answer: (k % 5 === 0) ? 'No' : 'Yes'
            };
          } else {
            // Short Text answers
            if (q.question.includes('notice period')) {
              return { question: q.question, answer: `${(k % 3 === 0) ? 'Immediate (0-15 Days)' : (k % 3 === 1 ? '30 Days' : '45 Days')}` };
            } else if (q.question.includes('CTC')) {
              return { question: q.question, answer: `Current: ${candidate.currentCTC || '6 LPA'}, Expected: ${candidate.expectedCTC || '9 LPA'}` };
            } else if (q.question.includes('portfolio')) {
              return { question: q.question, answer: `https://behance.net/${candidate.name.toLowerCase().replace(/\s+/g, '')}` };
            } else if (q.question.includes('revenue') || q.question.includes('target')) {
              return { question: q.question, answer: `Achieved ₹${15 + (k % 20)} Lakhs in Q3 (115% target completion)` };
            } else if (q.question.includes('communication')) {
              return { question: q.question, answer: 'English: 9/10, Hindi: 10/10 (Fluent)' };
            } else if (q.question.includes('experience')) {
              return { question: q.question, answer: `${candidate.totalExperience || '3+ Years'} dedicated experience` };
            } else {
              return { question: q.question, answer: 'Yes, fully aligned with the job requirements and available.' };
            }
          }
        });

        // Create application
        const app = await Application.create({
          applicationNumber: appNumber++,
          jobId: targetJob._id,
          employerId: employer._id,
          employeeId: candidate._id,
          status,
          statusColor: status === 'Shortlisted' ? 'bg-emerald-50 text-emerald-700' : (status === 'Viewed' ? 'bg-amber-50 text-amber-700' : (status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700')),
          screeningAnswers,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000))
        });

        createdApplications.push(app);
      }

      // Update applications count on the Job
      targetJob.applications = appsCount;
      targetJob.views = appsCount * 3 + 24;
      await targetJob.save();
    }

    console.log(`\n🎉 SUCCESS: Created 3 Jobs and ${createdApplications.length} Applications!`);
    console.log(`- Job 1: "${createdJobs[0].title}" -> 40 Applications`);
    console.log(`- Job 2: "${createdJobs[1].title}" -> 35 Applications`);
    console.log(`- Job 3: "${createdJobs[2].title}" -> 25 Applications`);
    console.log(`- Application Numbers: #500101 to #${appNumber - 1}`);
    console.log(`- Shared Candidates: Same candidates applied across 2-3 jobs as requested!`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
}

seed();
