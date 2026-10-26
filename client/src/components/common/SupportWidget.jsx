import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { COUNTRY_CODES } from '../../data/countryCodes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SupportWidget() {
  const location = useLocation();

  // Hide widget completely on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'updates'
  const [step, setStep] = useState(1); // 1 = Contact Details Form first, 2 = Options & Issue selection
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemFetchError, setProblemFetchError] = useState('');

  // Selected role & problem
  const [selectedRole, setSelectedRole] = useState('employee'); // 'employee' | 'employer' | 'consultant'
  const [selectedProblemId, setSelectedProblemId] = useState('');

  // Contact details fields (Shown FIRST in Step 1)
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [countryIso, setCountryIso] = useState('IN');
  const [countryCode, setCountryCode] = useState('+91');
  const [contactPhone, setContactPhone] = useState('');
  const [contactErrors, setContactErrors] = useState({});

  // Active / Submitted Request Tracking state
  const [activeRequest, setActiveRequest] = useState(() => {
    try {
      const saved = localStorage.getItem('sahijob_active_support_request');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [requestDetails, setRequestDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [followUpSuccessMsg, setFollowUpSuccessMsg] = useState('');

  // Predefined options for user follow-up (No typing allowed)
  const userQuickOptions = [
    "Yes, my issue is resolved. Thank you!",
    "Still facing issue with OTP verification",
    "I tried again, but still getting error",
    "Please call me on my phone number",
    "Waiting for resolution, please check soon",
    "Please unlock my account, still showing locked"
  ];

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Auto pre-fill contact details from logged-in userProfile or drafts if available, but ALWAYS allow editing
  const prefillFromStorage = () => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        const nameCandidate = parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim();
        if (nameCandidate && !contactName) setContactName(nameCandidate);
        if (parsed.email && !contactEmail) setContactEmail(parsed.email);
        if (parsed.countryCode) {
          const match = COUNTRY_CODES.find(c => c.code === parsed.countryCode);
          if (match) {
            setCountryCode(match.code);
            setCountryIso(match.country);
          } else {
            setCountryCode(parsed.countryCode);
          }
        }
        if (parsed.mobile && !contactPhone) {
          const rawMob = String(parsed.mobile).trim();
          if (rawMob.startsWith('+')) {
            const parts = rawMob.split(' ');
            if (parts.length > 1) {
              const codeCandidate = parts[0];
              const match = COUNTRY_CODES.find(c => c.code === codeCandidate);
              if (match) {
                setCountryCode(match.code);
                setCountryIso(match.country);
              }
              setContactPhone(parts.slice(1).join('').replace(/\D/g, '').slice(0, 10));
            } else {
              setContactPhone(rawMob.replace(/\D/g, '').slice(-10));
            }
          } else {
            setContactPhone(rawMob.replace(/\D/g, '').slice(0, 10));
          }
        }
      }
    } catch (_) {}
  };

  // When widget is opened
  useEffect(() => {
    if (isOpen) {
      setStep(1); // ALWAYS show contact form first
      prefillFromStorage();
      fetchProblems();

      // Check if there is an active tracked request
      try {
        const saved = localStorage.getItem('sahijob_active_support_request');
        if (saved) {
          const parsed = JSON.parse(saved);
          setActiveRequest(parsed);
          fetchRequestDetails(parsed.id);
        }
      } catch (_) {}
    }
  }, [isOpen]);

  const fetchProblems = async () => {
    setLoadingProblems(true);
    setProblemFetchError('');
    try {
      const res = await fetch(`${API_URL}/api/support/problems`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProblems(data.data);
      } else {
        setProblemFetchError(data.message || 'Unable to load support options');
      }
    } catch (err) {
      setProblemFetchError('Unable to connect to support service. Please try again.');
    } finally {
      setLoadingProblems(false);
    }
  };

  const fetchRequestDetails = async (reqId) => {
    if (!reqId) return;
    setLoadingDetails(true);
    try {
      const res = await fetch(`${API_URL}/api/support/requests/${reqId}/messages`);
      const data = await res.json();
      if (data.success && data.data) {
        setRequestDetails(data.data);
      }
    } catch (_) {
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSendFollowUpOption = async (optionText) => {
    if (!activeRequest?.id || sendingFollowUp) return;
    setSendingFollowUp(true);
    setFollowUpSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/support/requests/${activeRequest.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionText }),
      });
      const data = await res.json();
      if (data.success) {
        setFollowUpSuccessMsg('Response sent to support team.');
        fetchRequestDetails(activeRequest.id);
        setTimeout(() => setFollowUpSuccessMsg(''), 3000);
      }
    } catch (_) {
    } finally {
      setSendingFollowUp(false);
    }
  };

  const handleReset = () => {
    setSelectedProblemId('');
    setContactErrors({});
    setSubmitError('');
    setSubmitSuccess(false);
    setStep(1);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (submitSuccess) {
      handleReset();
    }
  };

  const validateContact = () => {
    const errors = {};
    if (!contactName.trim()) {
      errors.name = 'Please enter your full name';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim() || !emailRegex.test(contactEmail.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    const cleanPhone = contactPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToIssues = (e) => {
    e.preventDefault();
    if (!validateContact()) {
      return;
    }
    setStep(2);
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProblemId) {
      setSubmitError('Please select an issue option from the list.');
      return;
    }

    if (!validateContact()) {
      setStep(1);
      setSubmitError('Please verify your contact details.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const employerToken = localStorage.getItem('employerToken');
      const employeeToken = localStorage.getItem('employeeToken');
      const activeToken = employerToken || employeeToken;

      const headers = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const fullPhone = `${countryCode} ${contactPhone.trim()}`.trim();
      const bodyPayload = {
        problemId: selectedProblemId,
        targetRole: selectedRole,
        name: contactName.trim(),
        email: contactEmail.trim().toLowerCase(),
        phone: fullPhone,
      };

      const res = await fetch(`${API_URL}/api/support/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.data?._id) {
          const reqInfo = {
            id: data.data._id,
            problemText: data.data.problemText,
            email: contactEmail.trim().toLowerCase(),
            submittedAt: Date.now(),
          };
          localStorage.setItem('sahijob_active_support_request', JSON.stringify(reqInfo));
          setActiveRequest(reqInfo);
          fetchRequestDetails(reqInfo.id);
        }
        // Directly transition to Updates & Chat screen
        setActiveTab('updates');
        setSubmitSuccess(false);
        setFollowUpSuccessMsg('Request submitted successfully! Our support team has been notified.');
        setTimeout(() => setFollowUpSuccessMsg(''), 5000);
      } else {
        setSubmitError(data.message || 'Failed to submit support request. Please try again.');
      }
    } catch (err) {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter problems by selected role or generic 'all'
  const filteredProblems = problems.filter(
    (p) => !p.role || p.role === 'all' || p.role === selectedRole
  );

  const roleTabs = [
    { id: 'employee', label: 'Candidate', icon: '👨‍💼' },
    { id: 'employer', label: 'Employer', icon: '🏢' },
    { id: 'consultant', label: 'Consultant', icon: '🤝' },
  ];

  return (
    <>
      {/* Floating Circular Trigger Button */}
      <div className="fixed bottom-6 right-6 z-[90]">
        <button
          id="sahijob-support-widget-btn"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Need Help? Open Support Widget"
          className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-palette-900 hover:bg-palette-400 text-white shadow-2xl shadow-palette-900/40 hover:shadow-palette-400/50 transition-all duration-300 transform hover:scale-105 focus:outline-none cursor-pointer"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}

          {/* Pulse ring animation */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>
          )}

          {/* Tooltip on hover */}
          {!isOpen && (
            <span className="hidden sm:block absolute right-full mr-3 px-3 py-1.5 bg-gray-900/90 backdrop-blur-xs text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Need Help? Support
            </span>
          )}
        </button>
      </div>

      {/* Floating Popup Panel */}
      {isOpen && (
        <div 
          id="sahijob-support-widget-panel"
          className="fixed bottom-24 right-4 sm:right-6 z-[95] w-[390px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-palette-900 via-[#25732c] to-palette-400 text-white p-4 sm:p-5 shrink-0 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">SahiJob Support</h3>
                <p className="text-emerald-100 text-xs font-medium">Quick resolution assistance</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close support panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sub Navigation Bar: [New Request] vs [Track Request / Messages] */}
          {activeRequest && (
            <div className="flex items-center border-b border-gray-100 bg-gray-50/70 p-1.5 shrink-0 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setActiveTab('new'); setSubmitSuccess(false); setStep(1); }}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                  activeTab === 'new'
                    ? 'bg-white text-palette-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                + New Request
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('updates');
                  fetchRequestDetails(activeRequest.id);
                }}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'updates'
                    ? 'bg-white text-palette-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>💬 Updates & Chat</span>
                {requestDetails?.messages?.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">
                    {requestDetails.messages.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Panel Content Area */}
          <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
            {/* VIEW 1: ACTIVE REQUEST TRACKING & CHAT */}
            {activeTab === 'updates' && activeRequest ? (
              <div className="space-y-4">
                {/* Request Header Banner */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                      Request Status
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      requestDetails?.status === 'resolved'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {requestDetails?.status === 'resolved' ? '✅ Resolved' : '⏳ In Progress'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-900">
                    {requestDetails?.problemText || activeRequest.problemText}
                  </p>
                </div>

                {/* Messages List */}
                <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {loadingDetails ? (
                    <div className="py-8 text-center text-xs text-gray-400">Loading conversation...</div>
                  ) : (!requestDetails?.messages || requestDetails.messages.length === 0) ? (
                    <div className="py-6 text-center space-y-1 bg-gray-50 rounded-2xl border border-gray-100 p-4">
                      <p className="text-xs font-bold text-gray-700">Request received!</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Our support admin has been notified. Any replies will appear here.
                      </p>
                    </div>
                  ) : (
                    requestDetails.messages.map((msg, idx) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div key={idx} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                          <span className="text-[10px] font-bold text-gray-400 px-1 mb-0.5">
                            {isAdmin ? 'Admin Support' : 'You'} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className={`p-3 rounded-2xl text-xs font-medium max-w-[88%] leading-relaxed ${
                            isAdmin
                              ? 'bg-palette-900 text-white rounded-tl-xs shadow-xs'
                              : 'bg-gray-100 text-gray-800 rounded-tr-xs'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Predefined Quick Option Reply Section */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <p className="text-[11px] font-extrabold text-gray-700">
                    Send quick update to Admin:
                  </p>

                  {followUpSuccessMsg && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold text-center">
                      {followUpSuccessMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-1.5">
                    {userQuickOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendFollowUpOption(opt)}
                        disabled={sendingFollowUp}
                        className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-palette-900 hover:bg-emerald-50/50 text-gray-800 text-[11px] font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-between"
                      >
                        <span>{opt}</span>
                        <span className="text-gray-400 hover:text-palette-900">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : submitSuccess ? (
              /* SUCCESS STATE */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-palette-900 flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-palette-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="space-y-2 px-2">
                  <h4 className="text-lg font-bold text-gray-900">Request Submitted!</h4>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">
                    Your support request has been submitted. Our team will review it and reply shortly.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  {activeRequest && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('updates');
                        fetchRequestDetails(activeRequest.id);
                      }}
                      className="w-full py-3 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-xs"
                    >
                      💬 View Updates & Chat
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : step === 1 ? (
              /* ========================================================
               * STEP 1: ONLY CONTACT DETAILS FORM (FIRST)
               * ======================================================== */
              <form onSubmit={handleProceedToIssues} className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Your Contact Details</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Please fill your details to see support options</p>
                  </div>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Step 1 of 2
                  </span>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{submitError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      setContactErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all placeholder:text-gray-400 ${
                      contactErrors.name
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                    }`}
                  />
                  {contactErrors.name && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{contactErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      setContactErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="name@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all placeholder:text-gray-400 ${
                      contactErrors.email
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                    }`}
                  />
                  {contactErrors.email && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{contactErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-center rounded-xl border bg-white transition-all overflow-hidden ${
                      contactErrors.phone
                        ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                        : 'border-gray-300 focus-within:border-palette-400 focus-within:ring-1 focus-within:ring-palette-400'
                    }`}
                  >
                    {/* Country Code Dropdown */}
                    <div className="relative shrink-0 flex items-center bg-gray-50 hover:bg-gray-100 rounded-l-xl border-r border-gray-200 transition-colors">
                      <select
                        value={countryIso}
                        onChange={(e) => {
                          const iso = e.target.value;
                          setCountryIso(iso);
                          const found = COUNTRY_CODES.find((c) => c.country === iso);
                          if (found) {
                            setCountryCode(found.code);
                          }
                        }}
                        className="appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs font-bold text-gray-800 cursor-pointer outline-none max-w-[125px] truncate"
                        aria-label="Country Code"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={`${c.country}-${c.code}`} value={c.country} className="text-gray-800 font-medium py-1">
                            {c.flag} {c.code} ({c.name.split(' (')[0]})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-2 text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* 10-digit mobile number input */}
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={contactPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setContactPhone(val);
                        setContactErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full px-3 py-2.5 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400 font-medium"
                    />
                  </div>
                  {contactErrors.phone ? (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">{contactErrors.phone}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">Enter 10-digit mobile number</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer text-xs flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>Next: Select Your Issue</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
            ) : (
              /* ========================================================
               * STEP 2: OPTIONS & ISSUE SELECTION (AFTER FORM FILLED)
               * ======================================================== */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Back button & User summary */}
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setSubmitError(''); }}
                    className="text-xs font-bold text-gray-500 hover:text-palette-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    ← Back to Details
                  </button>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Step 2 of 2
                  </span>
                </div>

                {/* Contact Pill Banner */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2 text-xs flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-extrabold text-gray-900">{contactName}</span>
                    <span className="text-gray-500 text-[11px]"> ({contactEmail} • {countryCode} {contactPhone})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] font-bold text-palette-900 hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{submitError}</span>
                  </div>
                )}

                {/* 1. Role Selection */}
                <div className="space-y-1.5 pb-1">
                  <label className="block text-xs font-bold text-gray-800">
                    Whose issue is this?
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl border border-gray-200/60">
                    {roleTabs.map((tab) => {
                      const isActive = selectedRole === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setSelectedRole(tab.id);
                            setSelectedProblemId('');
                          }}
                          className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-palette-900 text-white shadow-sm scale-[1.02]'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                          }`}
                        >
                          <span className="text-sm">{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Predefined Problems List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-800">
                      Select issue for {selectedRole === 'employee' ? 'Candidate' : selectedRole === 'employer' ? 'Employer' : 'Consultant'}:
                    </label>
                    <span className="text-[10px] font-bold text-gray-400">
                      {filteredProblems.length} options
                    </span>
                  </div>

                  {loadingProblems ? (
                    <div className="py-8 text-center space-y-2 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="w-5 h-5 border-2 border-palette-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs text-gray-500">Loading issues...</p>
                    </div>
                  ) : problemFetchError ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                      {problemFetchError}
                    </div>
                  ) : filteredProblems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      No issues found for this role.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-emerald-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      {filteredProblems.map((problem) => {
                        const isSelected = selectedProblemId === problem._id;
                        return (
                          <div
                            key={problem._id}
                            onClick={() => { setSelectedProblemId(problem._id); setSubmitError(''); }}
                            className={`group flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all duration-200 select-none ${
                              isSelected
                                ? 'border-palette-900 bg-emerald-50/80 text-palette-900 shadow-sm ring-1 ring-palette-900/30'
                                : 'border-gray-200 hover:border-palette-400/80 hover:bg-emerald-50/20 bg-white text-gray-700 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 pr-2">
                              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-palette-900' : 'bg-gray-300 group-hover:bg-palette-400'}`} />
                              <span className="leading-snug">{problem.title}</span>
                            </div>

                            <div className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-palette-900 bg-palette-900 text-white shadow-xs'
                                : 'border-gray-300 bg-gray-50 group-hover:border-palette-400'
                            }`}>
                              {isSelected ? (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-gray-200 transition-colors" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedProblemId || loadingProblems}
                  className={`w-full py-3 font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                    !selectedProblemId || isSubmitting
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-palette-900 hover:bg-palette-400 text-white cursor-pointer hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>{selectedProblemId ? 'Submit Request' : 'Select an issue above'}</span>
                      {selectedProblemId && <span>→</span>}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
