import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './SupportWidget.css';
import { COUNTRY_CODES } from '../../data/countryCodes';
import { socket } from '../../utils/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ROLE_LABELS = {
  candidate: 'Candidate',
  employer: 'Employer',
  consultant: 'Consultant',
};

// Predefined follow-up quick replies matching backend ALLOWED_USER_FOLLOWUPS
const DEFAULT_QUICK_REPLIES = [
  'Yes, my issue is resolved. Thank you!',
  'I tried again, but still getting error',
  'Please call me on my phone number',
  'Waiting for resolution, please check soon',
];

const getInitials = (n) => {
  if (!n) return '?';
  const parts = String(n).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getFirstName = (n) => {
  if (!n) return 'there';
  const first = String(n).trim().split(/\s+/)[0];
  return first || 'there';
};

export default function SupportWidget() {
  const location = useLocation();

  // Hide widget completely on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // AUTH STATE (Read-Only)
  // ---------------------------------------------------------------------------
  const readCurrentAuth = useCallback(() => {
    try {
      const empToken = localStorage.getItem('employerToken');
      const candToken = localStorage.getItem('employeeToken');
      const isValid = (t) => t && t !== 'null' && t !== 'undefined' && t !== 'false' && String(t).trim().length > 10;

      // 1. Candidate / Employee
      if (isValid(candToken)) {
        let profile = {};
        try {
          const stored = localStorage.getItem('userProfile');
          if (stored) profile = JSON.parse(stored);
        } catch (_) {}

        const fullName = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Candidate';
        const email = profile.email || '';
        const phone = (profile.mobile || profile.phone || '').toString().replace(/\D/g, '').slice(-10);

        return {
          isLoggedIn: true,
          role: 'candidate',
          backendRole: 'employee',
          name: fullName,
          email,
          phone,
          token: candToken,
          isEmployer: false,
        };
      }

      // 2. Employer or Consultant
      if (isValid(empToken)) {
        const isConsultantRoute = window.location.pathname.startsWith('/consultant');
        return {
          isLoggedIn: true,
          role: isConsultantRoute ? 'consultant' : 'employer',
          backendRole: isConsultantRoute ? 'consultant' : 'employer',
          name: '',
          email: '',
          phone: '',
          token: empToken,
          isEmployer: true,
        };
      }

      // 3. Guest
      return {
        isLoggedIn: false,
        role: 'candidate',
        backendRole: 'employee',
        name: '',
        email: '',
        phone: '',
        token: null,
        isEmployer: false,
      };
    } catch (_) {
      return {
        isLoggedIn: false,
        role: 'candidate',
        backendRole: 'employee',
        name: '',
        email: '',
        phone: '',
        token: null,
        isEmployer: false,
      };
    }
  }, []);

  const [authData, setAuthData] = useState(() => readCurrentAuth());

  // Fetch employer details if employer token is present
  const syncAuthState = useCallback(async () => {
    const current = readCurrentAuth();
    if (!current.isLoggedIn) {
      setAuthData(current);
      return;
    }

    if (current.isEmployer && current.token) {
      try {
        const res = await fetch(`${API_URL}/api/employer/auth/me`, {
          headers: { Authorization: `Bearer ${current.token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const emp = json.data;
          const isConsultant = Boolean(emp.isConsultant || window.location.pathname.startsWith('/consultant'));
          setAuthData({
            isLoggedIn: true,
            role: isConsultant ? 'consultant' : 'employer',
            backendRole: isConsultant ? 'consultant' : 'employer',
            name: emp.fullName || emp.companyName || 'Employer',
            email: emp.email || '',
            phone: (emp.mobile || '').toString().replace(/\D/g, '').slice(-10),
            token: current.token,
            isEmployer: true,
          });
          return;
        }
      } catch (_) {}
    }

    setAuthData(current);
  }, [readCurrentAuth]);

  // ---------------------------------------------------------------------------
  // WIDGET UI STATE
  // ---------------------------------------------------------------------------
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'upd'

  // Guest flow state: Step 1 (contact form), Step 2 (role & issue selection)
  const [guestStep, setGuestStep] = useState(1);
  const [guestRole, setGuestRole] = useState('candidate'); // 'candidate' | 'employer' | 'consultant'
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [countryCode, setCountryCode] = useState('+91');
  const [contactErrors, setContactErrors] = useState({});

  // Problems list & selection
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemFetchError, setProblemFetchError] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState('');

  // Active / Submitted request tracking state
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

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const messagesEndRef = useRef(null);

  // ---------------------------------------------------------------------------
  // SYNC AUTH ON EVENT / PERIODICALLY WHEN OPEN
  // ---------------------------------------------------------------------------
  useEffect(() => {
    syncAuthState();
    const handleStorageChange = () => syncAuthState();
    window.addEventListener('storage', handleStorageChange);

    // Periodically re-check auth state while widget is open (detects login/logout on the same page)
    let interval = null;
    if (isOpen) {
      interval = setInterval(() => {
        syncAuthState();
      }, 1000);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (interval) clearInterval(interval);
    };
  }, [isOpen, syncAuthState]);

  // When widget opens: refresh problems & details
  useEffect(() => {
    if (isOpen) {
      fetchProblems();
      if (activeRequest?.id) {
        fetchRequestDetails(activeRequest.id);
      }
    }
  }, [isOpen]);

  // Close panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Scroll messages to bottom when updated
  useEffect(() => {
    if (activeTab === 'upd' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [requestDetails?.messages, activeTab]);

  // ---------------------------------------------------------------------------
  // SOCKET.IO REAL-TIME SUPPORT CHAT INTEGRATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!activeRequest?.id) return;
    const reqId = activeRequest.id.toString();

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join_support', reqId);

    const handleSupportMessage = (payload) => {
      const payloadId = (payload?.requestId || payload?._id || '').toString();
      if (payloadId === reqId) {
        setRequestDetails((prev) => {
          if (!prev) {
            return {
              _id: reqId,
              status: payload.status || 'pending',
              messages: payload.allMessages || (payload.message ? [payload.message] : []),
              hasUnreadAdminReply: payload.hasUnreadAdminReply ?? true,
            };
          }
          return {
            ...prev,
            status: payload.status || prev.status,
            messages: payload.allMessages || [...(prev.messages || []), payload.message],
            hasUnreadAdminReply: payload.hasUnreadAdminReply ?? true,
          };
        });
      }
    };

    const handleStatusChange = (payload) => {
      const payloadId = (payload?.requestId || payload?._id || '').toString();
      if (payloadId === reqId) {
        setRequestDetails((prev) => (prev ? { ...prev, status: payload.status } : null));
      }
    };

    const handleDeleted = (payload) => {
      const payloadId = (payload?.requestId || payload?._id || '').toString();
      if (payloadId === reqId) {
        handleClearAndNewRequest();
      }
    };

    socket.on('support_message', handleSupportMessage);
    socket.on('support_status_change', handleStatusChange);
    socket.on('support_request_deleted', handleDeleted);

    return () => {
      socket.emit('leave_support', reqId);
      socket.off('support_message', handleSupportMessage);
      socket.off('support_status_change', handleStatusChange);
      socket.off('support_request_deleted', handleDeleted);
    };
  }, [activeRequest?.id]);

  // Periodic silent polling backup (every 3s) while widget is open & on updates tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'upd' || !activeRequest?.id) return;
    const timer = setInterval(() => {
      fetchRequestDetails(activeRequest.id, true);
    }, 3000);
    return () => clearInterval(timer);
  }, [isOpen, activeTab, activeRequest?.id]);

  // ---------------------------------------------------------------------------
  // API CALLS (Existing endpoints reused exactly)
  // ---------------------------------------------------------------------------
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
    } catch (_) {
      setProblemFetchError('Unable to connect to support service. Please try again.');
    } finally {
      setLoadingProblems(false);
    }
  };

  const fetchRequestDetails = async (reqId, isSilent = false) => {
    if (!reqId) return;
    if (!isSilent) setLoadingDetails(true);
    try {
      const res = await fetch(`${API_URL}/api/support/requests/${reqId}/messages`);
      const data = await res.json();
      if (data.success && data.data) {
        setRequestDetails(data.data);
      }
    } catch (_) {
    } finally {
      if (!isSilent) setLoadingDetails(false);
    }
  };

  const handleSendFollowUpOption = async (optionText) => {
    if (!activeRequest?.id || sendingFollowUp) return;
    setSendingFollowUp(true);
    setFollowUpSuccessMsg('');

    // Instant optimistic update
    const optimisticMsg = {
      sender: 'user',
      text: optionText,
      createdAt: new Date().toISOString(),
    };
    setRequestDetails((prev) => (prev ? {
      ...prev,
      messages: [...(prev.messages || []), optimisticMsg],
    } : prev));

    try {
      const res = await fetch(`${API_URL}/api/support/requests/${activeRequest.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionText }),
      });
      const data = await res.json();
      if (data.success) {
        setFollowUpSuccessMsg('Response sent to support team.');
        if (optionText.toLowerCase().includes('resolved')) {
          setRequestDetails((prev) => (prev ? { ...prev, status: 'resolved' } : null));
        }
        if (data.allMessages) {
          setRequestDetails((prev) => (prev ? { ...prev, messages: data.allMessages } : null));
        }
        setTimeout(() => setFollowUpSuccessMsg(''), 3000);
      }
    } catch (_) {
    } finally {
      setSendingFollowUp(false);
    }
  };

  // ---------------------------------------------------------------------------
  // VALIDATION & SUBMISSION
  // ---------------------------------------------------------------------------
  const validateContactForm = () => {
    const errors = {};
    if (!contactForm.name.trim() || contactForm.name.trim().length < 2) {
      errors.name = 'Enter your full name';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!contactForm.email.trim() || !emailRegex.test(contactForm.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    const cleanPhone = contactForm.phone.replace(/\D/g, '');
    if (countryCode === '+91') {
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        errors.phone = 'Enter a valid 10-digit mobile number';
      }
    } else {
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        errors.phone = 'Enter a valid mobile number';
      }
    }
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGuestContinue = (e) => {
    e.preventDefault();
    if (!validateContactForm()) return;
    setGuestStep(2);
    setSubmitError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProblemId || isSubmitting) return;

    // For guest users, verify contact details are filled
    if (!authData.isLoggedIn) {
      if (!validateContactForm()) {
        setGuestStep(1);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const activeToken = authData.isLoggedIn ? authData.token : null;
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const activeName = authData.isLoggedIn
        ? (authData.name || 'User')
        : contactForm.name.trim();

      const activeEmail = authData.isLoggedIn
        ? (authData.email || '')
        : contactForm.email.trim().toLowerCase();

      const rawPhone = authData.isLoggedIn
        ? (authData.phone || '')
        : contactForm.phone.trim();

      const fullPhone = rawPhone
        ? (authData.isLoggedIn
            ? (rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`)
            : `${countryCode} ${rawPhone}`)
        : '';
      const targetRole = authData.isLoggedIn
        ? authData.backendRole
        : (guestRole === 'candidate' ? 'employee' : guestRole);

      const bodyPayload = {
        problemId: selectedProblemId,
        targetRole,
        name: activeName,
        email: activeEmail,
        phone: fullPhone,
      };

      const res = await fetch(`${API_URL}/api/support/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const reqInfo = {
          id: data.data._id,
          problemText: data.data.problemText,
          email: activeEmail,
          submittedAt: Date.now(),
        };
        localStorage.setItem('sahijob_active_support_request', JSON.stringify(reqInfo));
        setActiveRequest(reqInfo);
        fetchRequestDetails(reqInfo.id);

        setSubmitSuccess(true);
      } else {
        setSubmitError(data.message || 'Failed to submit support request. Please try again.');
      }
    } catch (_) {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to create a new request
  const handleStartNewRequest = () => {
    setSelectedProblemId('');
    setSubmitSuccess(false);
    setSubmitError('');
    setActiveTab('new');
    if (!authData.isLoggedIn) {
      setGuestStep(1);
    }
  };

  // Clear current active request and start fresh
  const handleClearAndNewRequest = () => {
    try {
      localStorage.removeItem('sahijob_active_support_request');
    } catch (_) {}
    setActiveRequest(null);
    setRequestDetails(null);
    handleStartNewRequest();
  };

  // ---------------------------------------------------------------------------
  // FILTER PROBLEMS BY CURRENT EFFECTIVE ROLE & COUNTRY
  // ---------------------------------------------------------------------------
  const currentRole = authData.isLoggedIn ? authData.role : guestRole;
  const currentBackendRole = currentRole === 'candidate' ? 'employee' : currentRole;
  const currentCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  const filteredProblems = problems.filter(
    (p) => !p.role || p.role === 'all' || p.role === currentBackendRole || p.role === currentRole
  );

  // Unread badge indicator for Updates & Chat tab
  const hasUnread = Boolean(
    activeRequest &&
    activeTab !== 'upd' &&
    (requestDetails?.hasUnreadAdminReply || requestDetails?.status !== 'resolved')
  );

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        id="sjFab"
        type="button"
        className="sj-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="sjPanel"
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      >
        {isOpen ? (
          <svg className="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <>
            <svg className="i-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5Z" />
            </svg>
            <span className="sj-fab-ping">
              <span className="sj-fab-ping-ring" />
              <span className="sj-fab-ping-dot" />
            </span>
          </>
        )}
      </button>

      {/* Floating Support Panel Dialog */}
      <section
        id="sjPanel"
        className="sj-panel"
        role="dialog"
        aria-label="SahiJob Support"
        hidden={!isOpen}
      >
        {/* Header */}
        <header className="sj-head">
          <div className="sj-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3.5" />
              <path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
            </svg>
          </div>
          <div className="grow">
            <h2>SahiJob Support</h2>
            <p>Quick resolution assistance</p>
          </div>
          <button
            type="button"
            id="sjClose"
            className="sj-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close support"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="sj-tabs" role="tablist">
          <button
            type="button"
            className="sj-tab"
            role="tab"
            id="tabNew"
            aria-selected={activeTab === 'new'}
            onClick={() => {
              setActiveTab('new');
              if (submitSuccess) setSubmitSuccess(false);
            }}
          >
            New request
          </button>
          <button
            type="button"
            className="sj-tab"
            role="tab"
            id="tabUpd"
            aria-selected={activeTab === 'upd'}
            onClick={() => {
              setActiveTab('upd');
              if (activeRequest?.id) fetchRequestDetails(activeRequest.id);
            }}
          >
            Updates &amp; chat
            <span className={`sj-dot ${hasUnread ? 'on' : ''}`} id="sjDot" />
          </button>
        </div>

        {/* Panel Body */}
        <div className="sj-body" id="sjBody">
          {/* TAB 1: UPDATES & CHAT */}
          {activeTab === 'upd' ? (
            !activeRequest ? (
              <div className="sj-empty">
                <b>No active requests</b>
                When you submit a request, its status and replies will show here.
              </div>
            ) : (
              <>
                {/* Request Status Banner */}
                <div className="sj-status">
                  <span className={`sj-badge ${requestDetails?.status === 'resolved' ? 'done' : ''}`}>
                    {requestDetails?.status === 'resolved' ? 'Resolved' : 'In progress'}
                  </span>
                  <small>Request status</small>
                  <b>{requestDetails?.problemText || activeRequest.problemText}</b>
                </div>

                {/* Follow-up success notification */}
                {followUpSuccessMsg && (
                  <div className="sj-alert-success">{followUpSuccessMsg}</div>
                )}

                {/* Messages Thread */}
                <div className="sj-msgs" aria-live="polite">
                  <div className="sj-msg sys">
                    Request received. Our support team has been notified. Replies will appear here.
                  </div>

                  {loadingDetails && (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ink3)', padding: '12px 0' }}>
                      Checking for updates...
                    </div>
                  )}

                  {requestDetails?.messages?.map((msg, idx) => {
                    const isAdmin = msg.sender === 'admin';
                    const timeStr = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    return (
                      <div key={idx} className={`sj-msg ${isAdmin ? 'sys' : 'me'}`}>
                        <span className="sj-msg-meta">
                          {isAdmin ? 'Support Admin' : 'You'} {timeStr ? `• ${timeStr}` : ''}
                        </span>
                        <div>{msg.text}</div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Predefined Quick Replies (Allowed only while request is in progress) */}
                {requestDetails?.status !== 'resolved' && (
                  <div className="sj-quick">
                    <p>Send a quick update to support</p>
                    {(requestDetails?.allowedFollowUps || DEFAULT_QUICK_REPLIES).map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={sendingFollowUp}
                        onClick={() => handleSendFollowUpOption(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )
          ) : submitSuccess ? (
            /* SUCCESS STATE AFTER SUBMISSION */
            <div className="sj-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="m8 12.5 2.8 2.8L16 9.5" />
              </svg>
              <b style={{ marginTop: '10px' }}>Request submitted</b>
              Our support team has been notified. We will reply in Updates &amp; chat.
            </div>
          ) : !authData.isLoggedIn && guestStep === 1 ? (
            /* =========================================================
             * A) GUEST STEP 1: CONTACT DETAILS FORM
             * ========================================================= */
            <form id="contactForm" onSubmit={handleGuestContinue} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="sj-title">
                <div>
                  <h3>Your contact details</h3>
                  <p>Fill in your details to see support options</p>
                </div>
                <span className="sj-step">Step 1 of 2</span>
              </div>

              {/* Full Name */}
              <div className="sj-field">
                <label htmlFor="fName">Full name <i>*</i></label>
                <input
                  id="fName"
                  className={`sj-input ${contactErrors.name ? 'bad' : ''}`}
                  autoComplete="name"
                  placeholder="e.g. Rahul Sharma"
                  value={contactForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setContactForm((prev) => ({ ...prev, name: val }));
                    if (contactErrors.name) setContactErrors((prev) => ({ ...prev, name: '' }));
                  }}
                />
                {contactErrors.name && <div className="sj-err">{contactErrors.name}</div>}
              </div>

              {/* Email ID */}
              <div className="sj-field">
                <label htmlFor="fEmail">Email ID <i>*</i></label>
                <input
                  id="fEmail"
                  type="email"
                  className={`sj-input ${contactErrors.email ? 'bad' : ''}`}
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={contactForm.email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setContactForm((prev) => ({ ...prev, email: val }));
                    if (contactErrors.email) setContactErrors((prev) => ({ ...prev, email: '' }));
                  }}
                />
                {contactErrors.email && <div className="sj-err">{contactErrors.email}</div>}
              </div>

              {/* Mobile Number */}
              <div className="sj-field">
                <label htmlFor="fPhone">Mobile number <i>*</i></label>
                <div className="sj-phone">
                  <div className="sj-cc-wrap" title="Select country code">
                    <span className="sj-cc-flag">{currentCountry.flag}</span>
                    <span className="sj-cc-code">{countryCode}</span>
                    <svg className="sj-cc-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <select
                      id="fCountryCode"
                      className="sj-cc-select-overlay"
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        if (contactErrors.phone) setContactErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      aria-label="Select Country Code"
                    >
                      {COUNTRY_CODES.map((c, i) => (
                        <option key={`${c.country}-${c.code}-${i}`} value={c.code}>
                          {c.flag} {c.code} &mdash; {c.name.split(' (')[0]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    id="fPhone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={countryCode === '+91' ? 10 : 15}
                    className={`sj-input ${contactErrors.phone ? 'bad' : ''}`}
                    autoComplete="tel-national"
                    placeholder={countryCode === '+91' ? '9876543210' : 'Mobile number'}
                    value={contactForm.phone}
                    onChange={(e) => {
                      const maxLen = countryCode === '+91' ? 10 : 15;
                      const clean = e.target.value.replace(/\D/g, '').slice(0, maxLen);
                      setContactForm((prev) => ({ ...prev, phone: clean }));
                      if (contactErrors.phone) setContactErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                  />
                </div>
                {contactErrors.phone ? (
                  <div className="sj-err">{contactErrors.phone}</div>
                ) : (
                  <div className="sj-hint">
                    {countryCode === '+91'
                      ? 'Enter a 10-digit mobile number'
                      : 'Enter a valid mobile number'}
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* =========================================================
             * B) STEP 2 (GUEST) OR DIRECT ISSUE VIEW (LOGGED-IN USER)
             * ========================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* User summary card */}
              {authData.isLoggedIn ? (
                /* Logged-In User Card: Avatar, Name, Email, Role badge */
                <div className="sj-chip">
                  <div className="sj-av">{getInitials(authData.name)}</div>
                  <div className="grow">
                    <b>Hi, {getFirstName(authData.name)}</b>
                    <span>{authData.email || 'Logged in user'}</span>
                  </div>
                </div>
              ) : (
                /* Guest summary chip with Back & Edit buttons */
                <>
                  <button
                    type="button"
                    className="sj-link"
                    id="goBack"
                    onClick={() => {
                      setGuestStep(1);
                      setSubmitError('');
                    }}
                  >
                    ← Back to details
                  </button>
                  <div className="sj-chip">
                    <div className="sj-av">{getInitials(contactForm.name)}</div>
                    <div className="grow">
                      <b>{contactForm.name}</b>
                      <span>{contactForm.email} · {countryCode} {contactForm.phone}</span>
                    </div>
                    <button
                      type="button"
                      className="sj-link"
                      id="goEdit"
                      style={{ color: 'var(--g800)' }}
                      onClick={() => {
                        setGuestStep(1);
                        setSubmitError('');
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </>
              )}

              {/* Segmented role switch (ONLY shown for Guest users) */}
              {!authData.isLoggedIn && (
                <div>
                  <div className="sj-q" style={{ marginBottom: '8px' }}>Who is this issue for?</div>
                  <div className="sj-seg" role="radiogroup" aria-label="Account type">
                    {Object.keys(ROLE_LABELS).map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={guestRole === r}
                        onClick={() => {
                          setGuestRole(r);
                          setSelectedProblemId('');
                          setSubmitError('');
                        }}
                      >
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Error alert */}
              {submitError && (
                <div className="sj-alert-err">{submitError}</div>
              )}

              {/* Issues header & counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="sj-q">
                  {authData.isLoggedIn ? 'What do you need help with?' : `Select an issue for ${ROLE_LABELS[guestRole]}`}
                </div>
                <span className="sj-count">{filteredProblems.length} options</span>
              </div>

              {/* Predefined Issues List */}
              {loadingProblems ? (
                <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink3)', padding: '24px 0' }}>
                  Loading issues...
                </div>
              ) : problemFetchError ? (
                <div className="sj-alert-err">
                  <span>{problemFetchError}</span>
                  <button
                    type="button"
                    onClick={fetchProblems}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--err)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Retry
                  </button>
                </div>
              ) : filteredProblems.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink3)', padding: '20px 0' }}>
                  No issues available for this role.
                </div>
              ) : (
                <ul className="sj-issues" role="radiogroup" aria-label="Issue">
                  {filteredProblems.map((p) => {
                    const isSelected = selectedProblemId === p._id;
                    return (
                      <li key={p._id}>
                        <button
                          type="button"
                          className="sj-issue"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setSelectedProblemId(p._id);
                            setSubmitError('');
                          }}
                        >
                          <span>{p.title}</span>
                          <span className="r" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Panel Footer (Sticky Bottom) */}
        <footer className="sj-foot" id="sjFoot">
          {activeTab === 'upd' ? (
            <button
              type="button"
              className="sj-btn sj-btn-secondary"
              id="startNew"
              onClick={handleClearAndNewRequest}
            >
              Start a new request
            </button>
          ) : submitSuccess ? (
            <button
              type="button"
              className="sj-btn"
              id="viewUpd"
              onClick={() => {
                setSubmitSuccess(false);
                setActiveTab('upd');
                if (activeRequest?.id) fetchRequestDetails(activeRequest.id);
              }}
            >
              View updates
            </button>
          ) : !authData.isLoggedIn && guestStep === 1 ? (
            <button
              type="button"
              className="sj-btn"
              id="goNext"
              onClick={handleGuestContinue}
            >
              <span>Continue</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="sj-btn"
              id="sjSend"
              disabled={!selectedProblemId || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? 'Sending…'
                : selectedProblemId
                ? 'Submit request'
                : 'Select an issue above'}
            </button>
          )}
        </footer>
      </section>
    </>
  );
}
