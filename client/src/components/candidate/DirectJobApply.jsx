import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { uploadFileToStorage } from '../../utils/firebaseStorage';

const DirectJobApply = ({ onAuthSuccess }) => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  // Job data & loading
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [jobError, setJobError] = useState('');

  // Current Step: 1: Auth, 2: Questions, 3: CV, 4: Review, 5: Success
  const [step, setStep] = useState(1);

  // User auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  // Auth form state (Step 1)
  const [authTab, setAuthTab] = useState('register'); // 'register' | 'login'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authMobile, setAuthMobile] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Screening questions (Step 2)
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [questionsError, setQuestionsError] = useState('');
  const [questionFieldErrors, setQuestionFieldErrors] = useState({});

  // CV / Resume (Step 3)
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvError, setCvError] = useState('');
  const [showCvModal, setShowCvModal] = useState(false);
  const fileInputRef = useRef(null);

  // Submission state (Step 4 & 5)
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Dynamic CMS Configuration from Admin
  const [cmsConfig, setCmsConfig] = useState(null);

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const json = await res.json();
        if (json.success && json.data?.directJobApply) {
          setCmsConfig(json.data.directJobApply);
        }
      } catch (e) {
        console.error('Error fetching directJobApply CMS:', e);
      }
    };
    fetchCms();
  }, []);

  const general = cmsConfig?.general || {};
  const stepper = cmsConfig?.stepper || {};
  const s1 = cmsConfig?.step1 || {};
  const s2 = cmsConfig?.step2 || {};
  const s3 = cmsConfig?.step3 || {};
  const s4 = cmsConfig?.step4 || {};
  const s5 = cmsConfig?.step5 || {};
  const maxLimitKb = s3.maxFileSizeKb || 300;

  // Check initial user login from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('employeeToken');
    const storedUserStr = localStorage.getItem('employeeUser') || localStorage.getItem('user');
    
    if (storedToken) {
      setToken(storedToken);
      if (storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          setUser(parsed);
          if (parsed.resume) {
            setResumeUrl(parsed.resume);
            setResumeName(parsed.resume.split('/').pop().split('?')[0] || 'My_Resume.pdf');
          }
          if (parsed.mobile) setAuthMobile(parsed.mobile);
          if (parsed.name) setAuthName(parsed.name);
          if (parsed.email) setAuthEmail(parsed.email);
        } catch (e) {
          console.error(e);
        }
      }
      // If user already logged in, automatically proceed directly to Step 2 (Questions)
      setStep(2);
      fetchUserProfile(storedToken);
    }
  }, []);

  const fetchUserProfile = async (authToken) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data) {
        setUser(prev => ({ ...prev, ...data }));
        if (data.resume) {
          setResumeUrl(data.resume);
          setResumeName(data.resume.split('/').pop().split('?')[0] || 'My_Resume.pdf');
        }
        if (data.phone) setAuthMobile(data.phone);
        if (data.email) setAuthEmail(data.email);
        if (data.firstName) setAuthName(`${data.firstName} ${data.lastName || ''}`.trim());
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      setLoadingJob(true);
      setJobError('');
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs/${jobId}`);
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setJob(data.data);
          // Initialize screening answers
          if (data.data.screeningQuestions && data.data.screeningQuestions.length > 0) {
            const initial = {};
            data.data.screeningQuestions.forEach((q, idx) => {
              initial[idx] = '';
            });
            setScreeningAnswers(initial);
          }
        } else {
          setJobError(data.message || 'Job posting not found or has been closed.');
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setJobError('Failed to load job details. Please check your internet connection.');
      } finally {
        setLoadingJob(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  // Handle Candidate Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim()) {
      setAuthError('Please enter your email address');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long');
      return;
    }
    if (!authMobile.trim()) {
      setAuthError('Please enter your mobile number');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/quick-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName.trim() || authEmail.split('@')[0],
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
          mobile: authMobile.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const authToken = data.token;
        setToken(authToken);
        setUser(data);
        localStorage.setItem('token', authToken);
        localStorage.setItem('employeeToken', authToken);
        localStorage.setItem('employeeUser', JSON.stringify(data));
        localStorage.setItem('userRole', 'employee');
        if (onAuthSuccess) onAuthSuccess(data);

        // Move to Step 2 (Questions)
        setStep(2);
      } else {
        setAuthError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Candidate Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim()) {
      setAuthError('Please enter your email address');
      return;
    }
    if (!authPassword) {
      setAuthError('Please enter your password');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          password: authPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const authToken = data.token;
        setToken(authToken);
        setUser(data);
        localStorage.setItem('token', authToken);
        localStorage.setItem('employeeToken', authToken);
        localStorage.setItem('employeeUser', JSON.stringify(data));
        localStorage.setItem('userRole', 'employee');

        if (data.profile?.resume) {
          setResumeUrl(data.profile.resume);
          setResumeName(data.profile.resume.split('/').pop().split('?')[0] || 'My_Resume.pdf');
        }
        if (data.mobile) setAuthMobile(data.mobile);
        if (data.name) setAuthName(data.name);

        if (onAuthSuccess) onAuthSuccess(data);

        // Move to Step 2
        setStep(2);
      } else {
        setAuthError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Server connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Google Login / Registration
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const authToken = data.token;
        setToken(authToken);
        setUser(data);
        localStorage.setItem('token', authToken);
        localStorage.setItem('employeeToken', authToken);
        localStorage.setItem('employeeUser', JSON.stringify(data));
        localStorage.setItem('userRole', 'employee');

        if (data.profile?.resume) {
          setResumeUrl(data.profile.resume);
          setResumeName(data.profile.resume.split('/').pop().split('?')[0] || 'My_Resume.pdf');
        }
        if (data.mobile || data.phone) setAuthMobile(data.mobile || data.phone || '');
        if (data.name) setAuthName(data.name);
        if (data.email) setAuthEmail(data.email);

        if (onAuthSuccess) onAuthSuccess(data);

        // Move to Step 2
        setStep(2);
      } else {
        setAuthError(data.message || 'Google login failed');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google authentication failed');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Continue with already logged-in account
  const handleContinueAsLoggedIn = () => {
    setStep(2);
  };

  // Logout/switch account
  const handleSwitchAccount = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeUser');
    setUser(null);
    setToken('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthMobile('');
    setResumeUrl('');
    setResumeName('');
    setStep(1);
  };

  // Handle screening answer change & clear individual error
  const handleAnswerChange = (idx, value) => {
    setScreeningAnswers(prev => ({ ...prev, [idx]: value }));
    if (questionFieldErrors[idx]) {
      setQuestionFieldErrors(prev => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
    }
  };

  // Step 2: Validate Questions and move to Step 3
  const handleQuestionsSubmit = () => {
    setQuestionsError('');
    const newFieldErrors = {};
    let firstErrorIdx = null;

    if (job?.screeningQuestions && job.screeningQuestions.length > 0) {
      for (let i = 0; i < job.screeningQuestions.length; i++) {
        const q = job.screeningQuestions[i];
        const ans = screeningAnswers[i];
        if (q.required !== false && (!ans || String(ans).trim() === '')) {
          newFieldErrors[i] = `Please provide an answer for this question.`;
          if (firstErrorIdx === null) firstErrorIdx = i;
        }
      }
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setQuestionFieldErrors(newFieldErrors);
      setQuestionsError('Please answer the required question(s) highlighted in red below.');
      
      // Auto-scroll smoothly to first error element
      setTimeout(() => {
        const el = document.getElementById(`question_card_${firstErrorIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setQuestionFieldErrors({});
    setStep(3);
  };

  // Step 3: Handle CV Upload (Firebase or fallback)
  const handleCvFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size from CMS (default 300KB)
    if (file.size > maxLimitKb * 1024) {
      setCvError(`File size exceeds ${maxLimitKb}KB limit. Please upload a smaller file (Max ${maxLimitKb}KB).`);
      return;
    }

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setCvError('Invalid format. Please upload PDF, DOC, or DOCX file.');
      return;
    }

    setCvError('');
    setUploadingResume(true);
    setUploadProgress(10);

    try {
      const downloadURL = await uploadFileToStorage(file, 'resumes', (progress) => {
        setUploadProgress(progress);
      });

      if (downloadURL) {
        setResumeUrl(downloadURL);
        setResumeName(file.name);
        setUploadProgress(100);
      } else {
        setCvError('Upload failed. Please try again.');
      }
    } catch (err) {
      console.error('CV upload error:', err);
      setCvError('Error uploading resume. Please try again.');
    } finally {
      setUploadingResume(false);
    }
  };

  // Step 3: Validate CV and move to Step 4
  const handleCvNext = () => {
    setCvError('');
    if (!resumeUrl) {
      setCvError('CV / Resume upload is compulsory. Please attach your resume to continue.');
      return;
    }
    setStep(4);
  };

  // Step 4: Final Submit Application
  const handleSubmitFinalApplication = async () => {
    setSubmitting(true);
    setSubmitError('');

    const formattedAnswers = job?.screeningQuestions?.map((sq, i) => ({
      question: sq.question,
      answer: screeningAnswers[i] || ''
    })) || [];

    try {
      const activeToken = token || localStorage.getItem('token') || localStorage.getItem('employeeToken');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          screeningAnswers: formattedAnswers,
          resume: resumeUrl,
          mobile: authMobile || user?.mobile || user?.phone,
          name: authName || user?.name
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Sync appliedJobs in localStorage so MyJobs immediately reflects this application
        try {
          const savedApplied = localStorage.getItem('appliedJobs');
          let appliedList = savedApplied ? JSON.parse(savedApplied) : [];
          const jobIdentifier = job?._id || job?.id || jobId;
          if (!appliedList.some(a => String(a.id) === String(jobIdentifier))) {
            appliedList.unshift({
              id: jobIdentifier,
              status: 'Applied',
              date: new Date().toLocaleDateString(),
              jobDetails: job ? { ...job, id: jobIdentifier, _id: jobIdentifier } : null
            });
            localStorage.setItem('appliedJobs', JSON.stringify(appliedList));
          }
        } catch (storageErr) {
          console.error('Error saving appliedJobs in localStorage:', storageErr);
        }

        setStep(5); // Success step!
      } else if (data.message && data.message.includes('already applied')) {
        try {
          const savedApplied = localStorage.getItem('appliedJobs');
          let appliedList = savedApplied ? JSON.parse(savedApplied) : [];
          const jobIdentifier = job?._id || job?.id || jobId;
          if (!appliedList.some(a => String(a.id) === String(jobIdentifier))) {
            appliedList.unshift({
              id: jobIdentifier,
              status: 'Applied',
              date: new Date().toLocaleDateString(),
              jobDetails: job ? { ...job, id: jobIdentifier, _id: jobIdentifier } : null
            });
            localStorage.setItem('appliedJobs', JSON.stringify(appliedList));
          }
        } catch (storageErr) {
          console.error('Error saving appliedJobs in localStorage:', storageErr);
        }

        setAlreadyApplied(true);
        setStep(5);
      } else {
        setSubmitError(data.message || 'Failed to submit application. Please try again.');
      }
    } catch (err) {
      console.error('Submit application error:', err);
      setSubmitError('Connection error while submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading Screen
  if (loadingJob) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium text-sm animate-pulse">Loading Job Application...</p>
      </div>
    );
  }

  // Job Error / Not Found Screen
  if (jobError || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900">Job Not Available</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {jobError || "This job posting is no longer active or could not be found."}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
            >
              Browse Active Jobs on SahiJob
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-green-700 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
              S
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-green-700 transition-colors">
              sahijob<span className="text-[#29953f]">.com</span>
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
            <span className="hidden sm:inline">{general.portalBadgeText || 'Direct Application Portal'}</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
              {general.verifiedJobBadgeText || 'Verified Job'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        
        {/* Job Header Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-2xl shrink-0 overflow-hidden shadow-xs">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                job.companyInitial || job.company?.charAt(0)?.toUpperCase() || 'J'
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#29953f] uppercase tracking-wider">{general.applyingForLabel || 'Applying For'}</span>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate leading-tight mt-0.5">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium mt-1">
                <span className="font-semibold text-gray-700">{job.company}</span>
                <span>•</span>
                <span>{job.location}</span>
                {job.salary && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">{job.salary}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">
              {job.details?.employmentType || 'Full-Time'}
            </span>
          </div>
        </div>

        {/* Multi-Step Progress Tracker */}
        {step < 5 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
            <div className="grid grid-cols-4 gap-2 text-center relative">
              
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 1 ? 'bg-green-600 text-white' : step === 1 ? 'bg-[#29953f] text-white ring-4 ring-green-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <span className={`text-[11px] font-bold ${step === 1 ? 'text-green-700' : 'text-gray-500'}`}>
                  {stepper.step1Title || 'Account'}
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 2 ? 'bg-green-600 text-white' : step === 2 ? 'bg-[#29953f] text-white ring-4 ring-green-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <span className={`text-[11px] font-bold ${step === 2 ? 'text-green-700' : 'text-gray-500'}`}>
                  {stepper.step2Title || 'Questions'}
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > 3 ? 'bg-green-600 text-white' : step === 3 ? 'bg-[#29953f] text-white ring-4 ring-green-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > 3 ? '✓' : '3'}
                </div>
                <span className={`text-[11px] font-bold ${step === 3 ? 'text-green-700' : 'text-gray-500'}`}>
                  {stepper.step3Title || 'Upload CV *'}
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 4 ? 'bg-[#29953f] text-white ring-4 ring-green-100' : 'bg-gray-100 text-gray-400'
                }`}>
                  4
                </div>
                <span className={`text-[11px] font-bold ${step === 4 ? 'text-green-700' : 'text-gray-500'}`}>
                  {stepper.step4Title || 'Review'}
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: AUTHENTICATION (LOGIN OR REGISTER)                                 */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
            
            {/* If user is already logged in */}
            {user && token ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-green-100">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {s1.loggedInWelcomeTitle || 'Welcome back'}, {user.name || user.firstName || 'Candidate'}!
                  </h3>
                  <p className="text-sm text-gray-500">
                    Logged in with <span className="font-semibold text-gray-800">{user.email}</span>
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleContinueAsLoggedIn}
                    className="w-full sm:w-auto px-8 py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    {(s1.continueAsBtnText || 'Continue Application →').replace('{name}', user.name || user.firstName || 'Candidate')}
                  </button>
                  <button
                    onClick={handleSwitchAccount}
                    className="w-full sm:w-auto px-5 py-3 text-gray-500 hover:text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {s1.switchAccountBtnText || 'Switch Account / Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{s1.heading || 'Candidate Login / Registration'}</h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {s1.subtitle || 'Please log in or create a free candidate profile to proceed with your application.'}
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setAuthError(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authTab === 'register' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {s1.tabRegisterText || 'New Candidate? Register'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthError(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      authTab === 'login' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {s1.tabLoginText || 'Already Registered? Login'}
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 max-w-md mx-auto">
                    <span className="font-bold">⚠️</span> {authError}
                  </div>
                )}

                {/* Google One-Click Login / Register */}
                <div className="max-w-md mx-auto mb-6 space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                    className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm border border-gray-300 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60 hover:shadow-sm"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>{s1.googleBtnText || 'Continue with Google'}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{s1.dividerText || 'OR WITH EMAIL'}</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                </div>

                {/* Register Form */}
                {authTab === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{s1.fullNameLabel || 'Full Name'} *</label>
                      <input
                        type="text"
                        required
                        placeholder={s1.fullNamePlaceholder || 'e.g. Rahul Sharma'}
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{s1.emailLabel || 'Email Address'} *</label>
                      <input
                        type="email"
                        required
                        placeholder={s1.emailPlaceholder || 'yourname@gmail.com'}
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{s1.mobileLabel || 'Mobile Number'} *</label>
                      <input
                        type="tel"
                        required
                        placeholder={s1.mobilePlaceholder || 'e.g. 9876543210'}
                        value={authMobile}
                        onChange={(e) => setAuthMobile(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{s1.passwordLabel || 'Create Password'} *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder={s1.passwordPlaceholder || 'At least 6 characters'}
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                      {authLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        s1.registerSubmitBtnText || "Create Account & Continue →"
                      )}
                    </button>
                  </form>
                )}

                {/* Login Form */}
                {authTab === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{s1.emailLabel || 'Email Address'} *</label>
                      <input
                        type="email"
                        required
                        placeholder={s1.emailPlaceholder || 'yourname@gmail.com'}
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">{s1.passwordLabel || 'Password'} *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder={s1.passwordPlaceholder || 'Your password'}
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                    >
                      {authLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        s1.loginSubmitBtnText || "Login & Continue →"
                      )}
                    </button>
                  </form>
                )}

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: JOB SCREENING QUESTIONS                                            */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold text-[#29953f] uppercase tracking-wider">Step 2 of 4</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{s2.heading || 'Screening Questions'}</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {s2.subtitle || "Please answer the employer's specific screening questions for this position."}
              </p>
            </div>

            {job.screeningQuestions && job.screeningQuestions.length > 0 ? (
              <div className="space-y-5">
                {job.screeningQuestions.map((q, idx) => {
                  const hasError = !!questionFieldErrors[idx];
                  return (
                    <div 
                      key={idx} 
                      id={`question_card_${idx}`}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-2.5 ${
                        hasError 
                          ? 'border-red-400 bg-red-50/25 ring-2 ring-red-100 shadow-xs' 
                          : 'border-gray-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className={`text-sm font-bold leading-snug ${hasError ? 'text-red-900' : 'text-gray-800'}`}>
                          {idx + 1}. {q.question}
                          {q.required !== false && <span className="text-red-500 ml-1 font-extrabold">*</span>}
                        </label>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                          hasError ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {q.type || 'Short Text'}
                        </span>
                      </div>

                      {q.type === 'Yes/No' ? (
                        <div className="flex items-center gap-3 pt-1">
                          {['Yes', 'No'].map((opt) => (
                            <label
                              key={opt}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                screeningAnswers[idx] === opt
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-100'
                                  : hasError
                                    ? 'bg-white border-red-300 text-gray-700 hover:border-red-400'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question_${idx}`}
                                value={opt}
                                checked={screeningAnswers[idx] === opt}
                                onChange={() => handleAnswerChange(idx, opt)}
                                className="accent-[#29953f]"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          rows={2}
                          placeholder="Type your answer here..."
                          value={screeningAnswers[idx] || ''}
                          onChange={(e) => handleAnswerChange(idx, e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none transition-all ${
                            hasError
                              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                              : 'border-gray-200 focus:border-[#29953f] focus:ring-1 focus:ring-[#29953f]'
                          }`}
                        />
                      )}

                      {/* Inline Field Error Message Underneath Question */}
                      {hasError && (
                        <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-200">
                          <span className="font-extrabold text-red-500">⚠️</span>
                          <span>{questionFieldErrors[idx]}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                <div className="text-2xl">✨</div>
                <h4 className="font-bold text-gray-800 text-sm">{s2.noQuestionsHeading || 'No screening questions required'}</h4>
                <p className="text-xs text-gray-500">
                  {s2.noQuestionsSubtitle || 'The employer has not set any custom screening questions. You can proceed directly to CV upload.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {s2.backBtnText || '← Back'}
              </button>
              <button
                type="button"
                onClick={handleQuestionsSubmit}
                className="px-7 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {s2.continueBtnText || 'Continue to CV Upload →'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CV / RESUME UPLOAD                                                 */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold text-[#29953f] uppercase tracking-wider">Step 3 of 4</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {s3.heading || 'Upload Your CV / Resume *'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {s3.subtitle || `Please attach your latest resume in PDF, DOC, or DOCX format (Max ${maxLimitKb}KB).`}
              </p>
            </div>

            {/* Current Resume Preview if already available */}
            {resumeUrl && (
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {resumeName || 'My_Resume.pdf'}
                    </p>
                    <span className="text-[11px] text-emerald-700 font-semibold">{s3.attachedBadgeText || '✓ Attached & Ready'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowCvModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-white rounded-xl border border-emerald-300 hover:bg-emerald-50 transition-all shadow-xs whitespace-nowrap cursor-pointer hover:shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{s3.viewFileBtnText || 'View File'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all shadow-xs whitespace-nowrap cursor-pointer hover:shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{s3.replaceBtnText || 'Replace'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Upload Drag & Drop Area */}
            <div className="space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all group ${
                  cvError
                    ? 'border-red-400 bg-red-50/25 ring-2 ring-red-100'
                    : 'border-gray-300 hover:border-[#29953f] bg-slate-50/60 hover:bg-green-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleCvFileChange}
                  className="hidden"
                />

                <div className={`w-14 h-14 bg-white rounded-2xl shadow-xs border flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform ${
                  cvError ? 'border-red-300 text-red-500' : 'border-gray-200 text-emerald-600'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <h4 className={`text-sm font-bold ${cvError ? 'text-red-900' : 'text-gray-800'}`}>
                  {uploadingResume ? "Uploading Resume..." : (s3.uploadBoxTitle || "Click or Drag to Upload Resume")}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {s3.uploadBoxSubtitle || `Supports PDF, DOC, DOCX up to ${maxLimitKb}KB`}
                </p>

                {uploadingResume && (
                  <div className="mt-4 max-w-xs mx-auto space-y-1.5">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#29953f] h-2 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700">{uploadProgress}% uploaded</span>
                  </div>
                )}
              </div>

              {/* Inline Error Message Underneath Upload Box */}
              {cvError && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 pt-1 animate-in fade-in duration-200">
                  <span className="font-extrabold text-red-500">⚠️</span>
                  <span>{cvError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {s3.backBtnText || '← Back'}
              </button>
              <button
                type="button"
                onClick={handleCvNext}
                disabled={uploadingResume}
                className="px-7 py-2.5 bg-[#29953f] hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {s3.continueBtnText || 'Review & Submit →'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: REVIEW & SUBMIT APPLICATION                                        */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
            <div>
              <span className="text-xs font-bold text-[#29953f] uppercase tracking-wider">Step 4 of 4</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{s4.heading || 'Review Your Application'}</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {s4.subtitle || 'Please verify your contact details and responses before final submission.'}
              </p>
            </div>

            {submitError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <span className="font-bold">⚠️</span> {submitError}
              </div>
            )}

            {/* Candidate Details Card (Auto-filled) */}
            <div className="p-5 rounded-2xl border border-gray-100 bg-slate-50/70 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {s4.candidateInfoHeading || 'Candidate Information'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Full Name</span>
                  <span className="font-bold text-gray-900">
                    {authName || user?.name || user?.firstName || 'Candidate'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Email Address</span>
                  <span className="font-bold text-gray-900">{authEmail || user?.email}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Mobile Number</span>
                  <span className="font-bold text-gray-900">{authMobile || user?.mobile || user?.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Attached Resume</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-emerald-700 truncate max-w-[200px]">
                      📄 {resumeName || 'Resume.pdf'}
                    </span>
                    {resumeUrl && (
                      <button
                        type="button"
                        onClick={() => setShowCvModal(true)}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Screening Questions Review */}
            {job.screeningQuestions && job.screeningQuestions.length > 0 && (
              <div className="p-5 rounded-2xl border border-gray-100 bg-slate-50/70 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {s4.screeningReviewHeading || 'Screening Answers'}
                </h3>
                <div className="space-y-2.5">
                  {job.screeningQuestions.map((q, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-bold text-gray-700">{idx + 1}. {q.question}</p>
                      <p className="text-emerald-800 font-semibold bg-white p-2 rounded-lg border border-gray-200 mt-1">
                        {screeningAnswers[idx] || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {s4.backBtnText || '← Back'}
              </button>
              <button
                type="button"
                onClick={handleSubmitFinalApplication}
                disabled={submitting}
                className="px-8 py-3 bg-[#29953f] hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {s4.submittingBtnText || "Submitting Application..."}
                  </>
                ) : (
                  s4.submitBtnText || "Submit Application Now 🚀"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: SUCCESS CONFIRMATION & PORTAL INVITATION                          */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/80 shadow-md text-center space-y-6">
            
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl font-black shadow-inner">
              ✓
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {alreadyApplied ? (s5.alreadyAppliedHeading || "Already Applied!") : (s5.successHeading || "Application Submitted!")}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {(s5.successSubtitle || "Your application for {title} at {company} has been received successfully by the hiring team.")
                  .replace('{title}', job.title)
                  .replace('{company}', job.company)}
              </p>
            </div>

            {/* Special Highlighted Message */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2 shadow-xs max-w-lg mx-auto">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <span>{s5.promoMessageTitle || "📢 Important Information:"}</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-emerald-800 leading-relaxed">
                {s5.promoMessageText || "Aap sahijob.com ke candidate portal me login karke hazaron verified companies ki jobs explore aur apply kar sakte hain!"}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center max-w-md mx-auto">
              <button
                type="button"
                onClick={() => navigate('/employee', { state: { showOnboardingPrompt: true, loggedIn: true } })}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{s5.exploreMoreJobsBtnText || "Explore More Jobs on SahiJob →"}</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* CV Preview Modal Popup */}
      {showCvModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowCvModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                  PDF
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {resumeName || 'Resume_Preview.pdf'}
                  </h3>
                  <p className="text-[11px] text-gray-500">CV Document Preview</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
                  title="Open in new window"
                >
                  <span>↗</span> Open New Tab
                </a>
                <button
                  onClick={() => setShowCvModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-200/80 hover:bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 bg-gray-100 relative">
              <iframe
                src={
                  resumeUrl?.toLowerCase()?.endsWith('.pdf') || resumeUrl?.includes('pdf')
                    ? resumeUrl
                    : `https://docs.google.com/viewer?url=${encodeURIComponent(resumeUrl)}&embedded=true`
                }
                title="CV Preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DirectJobApply;
