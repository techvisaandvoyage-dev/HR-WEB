import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SupportWidget() {
  const location = useLocation();

  // Hide widget completely on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemFetchError, setProblemFetchError] = useState('');

  // Selected role & problem
  const [selectedRole, setSelectedRole] = useState('employee'); // 'employee' | 'employer' | 'consultant'
  const [selectedProblemId, setSelectedProblemId] = useState('');

  // Guest details state
  const [guestStep, setGuestStep] = useState(1); // 1 = Contact Details, 2 = Role & Problem
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestErrors, setGuestErrors] = useState({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Check login state dynamically whenever widget opens
  const getAuthInfo = () => {
    const employerToken = localStorage.getItem('employerToken');
    const employeeToken = localStorage.getItem('employeeToken') || localStorage.getItem('token');
    
    if (employerToken) {
      return { token: employerToken, role: 'employer' };
    }
    if (employeeToken) {
      return { token: employeeToken, role: 'employee' };
    }
    return { token: null, role: 'guest' };
  };

  const [authInfo, setAuthInfo] = useState(getAuthInfo());

  // Re-check auth whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const currentAuth = getAuthInfo();
      setAuthInfo(currentAuth);
      if (currentAuth.role === 'employer' || currentAuth.role === 'employee') {
        setSelectedRole(currentAuth.role);
      }
      fetchProblems();
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

  const handleReset = () => {
    setSelectedProblemId('');
    setGuestStep(1);
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setGuestErrors({});
    setSubmitError('');
    setSubmitSuccess(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (submitSuccess) {
      handleReset();
    }
  };

  const validateGuestContact = () => {
    const errors = {};
    if (!guestName.trim()) {
      errors.name = 'Please enter your name';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail.trim() || !emailRegex.test(guestEmail.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    const cleanPhone = guestPhone.replace(/\D/g, '');
    if (!guestPhone.trim() || cleanPhone.length < 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGuestProceedToContact = (e) => {
    e.preventDefault();
    if (!selectedProblemId) {
      setSubmitError('Please select a problem from the list.');
      return;
    }
    setGuestStep(2);
    setSubmitError('');
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (!validateGuestContact()) {
      return;
    }
    handleSubmit(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProblemId) {
      setSubmitError('Please select a problem from the list.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      if (authInfo.token) {
        headers['Authorization'] = `Bearer ${authInfo.token}`;
      }

      const bodyPayload = {
        problemId: selectedProblemId,
        targetRole: selectedRole,
      };

      // Only attach guest info if not logged in
      if (!authInfo.token) {
        bodyPayload.name = guestName.trim();
        bodyPayload.email = guestEmail.trim().toLowerCase();
        bodyPayload.phone = guestPhone.trim();
      }

      const res = await fetch(`${API_URL}/api/support/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(data.message || 'Failed to submit support request. Please try again.');
      }
    } catch (err) {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoggedInUser = Boolean(authInfo.token);

  // Filter problems by selected role or generic 'all'
  const filteredProblems = problems.filter(
    (p) => !p.role || p.role === 'all' || p.role === selectedRole
  );

  const roleTabs = [
    { id: 'employee', label: 'Candidate' },
    { id: 'employer', label: 'Employer' },
    { id: 'consultant', label: 'Consultant' },
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
            // Close X Icon
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Support / Chat Help Icon
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
          className="fixed bottom-24 right-4 sm:right-6 z-[95] w-[370px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[84vh] animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-palette-900 via-[#25732c] to-palette-400 text-white p-5 shrink-0 flex items-center justify-between shadow-xs">
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

          {/* Panel Content Area */}
          <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
            {/* SUCCESS STATE */}
            {submitSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-palette-900 flex items-center justify-center shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-palette-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="space-y-2 px-2">
                  <h4 className="text-lg font-bold text-gray-900">Request Submitted!</h4>
                  <p className="text-sm font-medium text-gray-600 leading-relaxed">
                    Your request has been submitted. Our team will contact you soon.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-3 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-sm"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Submit Error Alert */}
                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 mt-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Case 1: Guest Step 2 (Contact Details Form) */}
                {!isLoggedInUser && guestStep === 2 ? (
                  <form onSubmit={handleGuestSubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-1">
                      <button
                        type="button"
                        onClick={() => { setGuestStep(1); setSubmitError(''); }}
                        className="text-xs font-bold text-gray-500 hover:text-palette-900 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        ← Back to Issues
                      </button>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Step 2 of 2
                      </span>
                    </div>

                    {/* Selected Issue Preview Card */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Selected for {selectedRole === 'employee' ? 'Candidate' : selectedRole === 'employer' ? 'Employer' : 'Consultant'}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setGuestStep(1); setSubmitError(''); }}
                          className="text-[10px] font-bold text-palette-900 underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                      <p className="font-bold text-gray-900 leading-snug">
                        {problems.find((p) => p._id === selectedProblemId)?.title || 'Problem selected'}
                      </p>
                    </div>

                    <div className="text-left pt-1">
                      <p className="text-xs font-bold text-gray-800">Your Contact Details</p>
                      <p className="text-[11px] text-gray-500">Our support team will reach out on this information.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => { setGuestName(e.target.value); setGuestErrors({ ...guestErrors, name: '' }); }}
                        placeholder="e.g. Rahul Sharma"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all placeholder:text-gray-400 ${
                          guestErrors.name ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                        }`}
                      />
                      {guestErrors.name && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1">{guestErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email ID <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => { setGuestEmail(e.target.value); setGuestErrors({ ...guestErrors, email: '' }); }}
                        placeholder="name@example.com"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all placeholder:text-gray-400 ${
                          guestErrors.email ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                        }`}
                      />
                      {guestErrors.email && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1">{guestErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => { setGuestPhone(e.target.value); setGuestErrors({ ...guestErrors, phone: '' }); }}
                        placeholder="e.g. 9876543210"
                        maxLength={15}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all placeholder:text-gray-400 ${
                          guestErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400'
                        }`}
                      />
                      {guestErrors.phone && (
                        <p className="text-[10px] text-red-500 font-semibold mt-1">{guestErrors.phone}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </button>
                  </form>
                ) : (
                  /* Case 2: Role Selection + Questions List (Shown first for all users) */
                  <form onSubmit={isLoggedInUser ? handleSubmit : handleGuestProceedToContact} className="space-y-4">
                    {/* Role Selection Tabs */}
                    <div className="space-y-1.5 pb-1">
                      <label className="block text-xs font-bold text-gray-800">
                        Whose issue is this?
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl">
                        {roleTabs.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setSelectedRole(tab.id);
                              setSelectedProblemId('');
                              setSubmitError('');
                            }}
                            className={`py-2 px-1 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                              selectedRole === tab.id
                                ? 'bg-palette-900 text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-gray-800">
                        Select issue for {selectedRole === 'employee' ? 'Candidate' : selectedRole === 'employer' ? 'Employer' : 'Consultant'}:
                      </span>
                    </div>

                    {/* Predefined Problems List */}
                    {loadingProblems ? (
                      <div className="py-8 text-center space-y-2">
                        <div className="w-6 h-6 border-2 border-palette-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs text-gray-500 font-medium">Loading options...</p>
                      </div>
                    ) : problemFetchError ? (
                      <div className="py-4 text-center space-y-2">
                        <p className="text-xs text-red-500 font-medium">{problemFetchError}</p>
                        <button
                          type="button"
                          onClick={fetchProblems}
                          className="text-xs font-bold text-palette-900 underline cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    ) : filteredProblems.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No support options available for this role.</p>
                    ) : (
                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {filteredProblems.map((problem) => {
                          const isSelected = selectedProblemId === problem._id;
                          return (
                            <label
                              key={problem._id}
                              onClick={() => { setSelectedProblemId(problem._id); setSubmitError(''); }}
                              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-palette-900 bg-emerald-50/60 text-palette-900 shadow-xs'
                                  : 'border-gray-200 hover:border-palette-400 bg-white text-gray-700'
                              }`}
                            >
                              <span className="pr-2">{problem.title}</span>
                              <span className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-palette-900 bg-palette-900' : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedProblemId || loadingProblems}
                      className="w-full py-3 bg-palette-900 hover:bg-palette-400 text-white font-bold rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </>
                      ) : isLoggedInUser ? (
                        'Submit Request'
                      ) : (
                        <>
                          <span>Next: Contact Details</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
