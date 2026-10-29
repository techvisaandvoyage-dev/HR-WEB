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

  // ---------------------------------------------------------------------------
  // AUTH STATE (Read-Only)
  // ---------------------------------------------------------------------------
  const readCurrentAuth = useCallback(() => {
    try {
      const empToken = localStorage.getItem('employerToken');
      const candToken = localStorage.getItem('employeeToken') || localStorage.getItem('token');
      const isValid = (t) => t && t !== 'null' && t !== 'undefined' && t !== 'false' && String(t).trim().length > 10;

      const path = window.location.pathname;
      const isEmployerRoute = path.startsWith('/employer');
      const isConsultantRoute = path.startsWith('/consultant');
      const userRole = localStorage.getItem('userRole');

      // Decide if Employer or Consultant context should take priority
      const isEmployerContext = (isEmployerRoute || isConsultantRoute || userRole === 'employer' || userRole === 'consultant')
        ? isValid(empToken)
        : (isValid(empToken) && !isValid(candToken));

      // 1. Employer or Consultant
      if (isEmployerContext && isValid(empToken)) {
        let empInfo = {};
        try {
          const stored = localStorage.getItem('employerInfo') || localStorage.getItem('employerProfile') || localStorage.getItem('employerUser');
          if (stored) empInfo = JSON.parse(stored);
        } catch (_) {}

        const isConsultant = Boolean(empInfo.isConsultant || isConsultantRoute || userRole === 'consultant');
        const fullName = empInfo.fullName || empInfo.companyName || empInfo.name || (isConsultant ? 'Consultant' : 'Employer');
        const email = empInfo.email || '';
        const phone = (empInfo.mobile || empInfo.phone || '').toString().replace(/\D/g, '').slice(-10);
        const code = empInfo.countryCode || '+91';

        return {
          isLoggedIn: true,
          role: isConsultant ? 'consultant' : 'employer',
          backendRole: isConsultant ? 'consultant' : 'employer',
          name: fullName,
          email,
          phone,
          countryCode: code,
          token: empToken,
          isEmployer: true,
        };
      }

      // 2. Candidate / Employee
      if (isValid(candToken)) {
        let profile = {};
        try {
          const stored = localStorage.getItem('userProfile') || localStorage.getItem('employeeUser');
          if (stored) profile = JSON.parse(stored);
        } catch (_) {}

        const fullName = profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Candidate';
        const email = profile.email || '';
        const phone = (profile.mobile || profile.phone || '').toString().replace(/\D/g, '').slice(-10);
        const code = profile.countryCode || '+91';

        return {
          isLoggedIn: true,
          role: 'candidate',
          backendRole: 'employee',
          name: fullName,
          email,
          phone,
          countryCode: code,
          token: candToken,
          isEmployer: false,
        };
      }

      // 3. Fallback Employer if only empToken is valid
      if (isValid(empToken)) {
        let empInfo = {};
        try {
          const stored = localStorage.getItem('employerInfo') || localStorage.getItem('employerProfile');
          if (stored) empInfo = JSON.parse(stored);
        } catch (_) {}

        const isConsultant = Boolean(empInfo.isConsultant || isConsultantRoute || userRole === 'consultant');
        const fullName = empInfo.fullName || empInfo.companyName || empInfo.name || (isConsultant ? 'Consultant' : 'Employer');
        const email = empInfo.email || '';
        const phone = (empInfo.mobile || empInfo.phone || '').toString().replace(/\D/g, '').slice(-10);
        const code = empInfo.countryCode || '+91';

        return {
          isLoggedIn: true,
          role: isConsultant ? 'consultant' : 'employer',
          backendRole: isConsultant ? 'consultant' : 'employer',
          name: fullName,
          email,
          phone,
          countryCode: code,
          token: empToken,
          isEmployer: true,
        };
      }

      // 4. Guest / Logged Out
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

  // Fetch employer or candidate details if token is present
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
          try {
            localStorage.setItem('employerInfo', JSON.stringify(emp));
          } catch (_) {}
          const isConsultant = Boolean(emp.isConsultant || window.location.pathname.startsWith('/consultant'));
          const nextAuth = {
            isLoggedIn: true,
            role: isConsultant ? 'consultant' : 'employer',
            backendRole: isConsultant ? 'consultant' : 'employer',
            name: emp.fullName || emp.companyName || emp.name || (isConsultant ? 'Consultant' : 'Employer'),
            email: emp.email || '',
            phone: (emp.mobile || emp.phone || '').toString().replace(/\D/g, '').slice(-10),
            countryCode: emp.countryCode || '+91',
            token: current.token,
            isEmployer: true,
          };
          setAuthData((prev) => {
            if (
              prev.isLoggedIn === nextAuth.isLoggedIn &&
              prev.role === nextAuth.role &&
              prev.name === nextAuth.name &&
              prev.email === nextAuth.email &&
              prev.phone === nextAuth.phone &&
              prev.countryCode === nextAuth.countryCode &&
              prev.token === nextAuth.token
            ) {
              return prev;
            }
            return nextAuth;
          });
          return;
        }
      } catch (_) {}
    } else if (!current.isEmployer && current.token) {
      try {
        const res = await fetch(`${API_URL}/api/employee/profile`, {
          headers: { Authorization: `Bearer ${current.token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          const cand = json.data;
          try {
            localStorage.setItem('userProfile', JSON.stringify(cand));
          } catch (_) {}
          const nextAuth = {
            isLoggedIn: true,
            role: 'candidate',
            backendRole: 'employee',
            name: cand.name || `${cand.firstName || ''} ${cand.lastName || ''}`.trim() || 'Candidate',
            email: cand.email || '',
            phone: (cand.mobile || cand.phone || '').toString().replace(/\D/g, '').slice(-10),
            countryCode: cand.countryCode || '+91',
            token: current.token,
            isEmployer: false,
          };
          setAuthData((prev) => {
            if (
              prev.isLoggedIn === nextAuth.isLoggedIn &&
              prev.role === nextAuth.role &&
              prev.name === nextAuth.name &&
              prev.email === nextAuth.email &&
              prev.phone === nextAuth.phone &&
              prev.countryCode === nextAuth.countryCode &&
              prev.token === nextAuth.token
            ) {
              return prev;
            }
            return nextAuth;
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

  // Logged-in user missing/editable phone state
  const [loggedInPhoneInput, setLoggedInPhoneInput] = useState('');
  const [loggedInPhoneError, setLoggedInPhoneError] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  useEffect(() => {
    if (authData.phone) {
      setLoggedInPhoneInput(authData.phone);
    }
    if (authData.countryCode) {
      setCountryCode(authData.countryCode);
    }
  }, [authData.phone, authData.countryCode]);

  // Problems list & selection
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemFetchError, setProblemFetchError] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [customProblemText, setCustomProblemText] = useState('');

  // Multi-request state for Updates & chat
  const [userRequests, setUserRequests] = useState([]);
  const [loadingUserRequests, setLoadingUserRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(() => {
    try {
      const saved = localStorage.getItem('sahijob_active_support_request');
      return saved ? JSON.parse(saved)?.id : null;
    } catch (_) {
      return null;
    }
  });

  // Active / Submitted request tracking state
  const [activeRequest, setActiveRequest] = useState(() => {
    try {
      const saved = localStorage.getItem('sahijob_active_support_request');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [quickRepliesList, setQuickRepliesList] = useState(DEFAULT_QUICK_REPLIES);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [followUpSuccessMsg, setFollowUpSuccessMsg] = useState('');

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const messagesEndRef = useRef(null);
  const bodyRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const prevSelectedReqIdRef = useRef(null);

  // ---------------------------------------------------------------------------
  // API CALLS (Existing endpoints reused exactly)
  // ---------------------------------------------------------------------------
  const fetchProblems = useCallback(async () => {
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
  }, []);

  const fetchQuickReplies = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/support/quick-replies`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setQuickRepliesList(data.data);
      }
    } catch (_) {}
  }, []);

  const fetchRequestDetails = useCallback(async (reqId, isSilent = false) => {
    if (!reqId) return;

    if (!isSilent) setLoadingDetails(true);
    try {
      const res = await fetch(`${API_URL}/api/support/requests/${reqId}/messages`);
      const data = await res.json();
      if (data.success && data.data) {
        setRequestDetails((prev) => {
          if (!prev) return data.data;
          const prevMsgs = prev.messages || [];
          const newMsgs = data.data.messages || [];
          const statusChanged = prev.status !== data.data.status;
          const countChanged = prevMsgs.length !== newMsgs.length;
          const followUpsChanged = JSON.stringify(prev.allowedFollowUps || []) !== JSON.stringify(data.data.allowedFollowUps || []);
          if (!statusChanged && !countChanged && !followUpsChanged) {
            if (prevMsgs.length === 0 && newMsgs.length === 0) return prev;
            const lastPrev = prevMsgs[prevMsgs.length - 1];
            const lastNew = newMsgs[newMsgs.length - 1];
            if (lastPrev?._id === lastNew?._id && lastPrev?.text === lastNew?.text) {
              return prev;
            }
          }
          return data.data;
        });
      }
    } catch (_) {
    } finally {
      if (!isSilent) setLoadingDetails(false);
    }
  }, []);

  const fetchUserRequests = useCallback(async () => {
    setLoadingUserRequests(true);
    try {
      let storedIds = [];
      try {
        storedIds = JSON.parse(localStorage.getItem('sahijob_support_request_ids') || '[]');
      } catch (_) {}

      // Include active request ID or selected request ID if available
      try {
        const active = JSON.parse(localStorage.getItem('sahijob_active_support_request') || 'null');
        if (active?.id && !storedIds.includes(active.id)) {
          storedIds.unshift(active.id);
        }
      } catch (_) {}

      if (activeRequest?.id && !storedIds.includes(activeRequest.id)) {
        storedIds.unshift(activeRequest.id);
      }
      if (selectedRequestId && !storedIds.includes(selectedRequestId)) {
        storedIds.unshift(selectedRequestId);
      }

      // Sync unique IDs back to localStorage
      try {
        if (storedIds.length > 0) {
          localStorage.setItem('sahijob_support_request_ids', JSON.stringify([...new Set(storedIds)]));
        }
      } catch (_) {}

      const activeToken = authData.isLoggedIn ? authData.token : null;
      const headers = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      // Robust email extraction across all possible storage places
      let emailParam = authData.email;
      if (!emailParam) {
        try {
          const emp = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          if (emp.email) emailParam = emp.email;
        } catch (_) {}
      }
      if (!emailParam) {
        try {
          const prof = JSON.parse(localStorage.getItem('userProfile') || '{}');
          if (prof.email) emailParam = prof.email;
        } catch (_) {}
      }
      if (!emailParam) {
        try {
          const active = JSON.parse(localStorage.getItem('sahijob_active_support_request') || '{}');
          if (active.email) emailParam = active.email;
        } catch (_) {}
      }
      if (!emailParam) {
        emailParam = contactForm.email || '';
      }

      // Robust phone extraction
      let phoneParam = authData.phone || loggedInPhoneInput || '';
      if (!phoneParam) {
        try {
          const emp = JSON.parse(localStorage.getItem('employerInfo') || '{}');
          if (emp.mobile || emp.phone) phoneParam = (emp.mobile || emp.phone).toString();
        } catch (_) {}
      }
      if (!phoneParam) {
        try {
          const prof = JSON.parse(localStorage.getItem('userProfile') || '{}');
          if (prof.mobile || prof.phone) phoneParam = (prof.mobile || prof.phone).toString();
        } catch (_) {}
      }

      const queryParts = [];
      if (emailParam) queryParts.push(`email=${encodeURIComponent(emailParam.trim().toLowerCase())}`);
      if (phoneParam) queryParts.push(`phone=${encodeURIComponent(phoneParam.replace(/\D/g, '').slice(-10))}`);
      if (storedIds.length > 0) queryParts.push(`ids=${encodeURIComponent(storedIds.join(','))}`);

      const res = await fetch(`${API_URL}/api/support/my-requests?${queryParts.join('&')}`, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUserRequests((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(json.data)) return prev;
          return json.data;
        });

        // Update storedIds with all IDs returned by server
        const fetchedIds = json.data.map((r) => r._id).filter(Boolean);
        const merged = [...new Set([...storedIds, ...fetchedIds])];
        if (merged.length > 0) {
          try {
            localStorage.setItem('sahijob_support_request_ids', JSON.stringify(merged));
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('Error fetching user requests:', err);
    } finally {
      setLoadingUserRequests(false);
    }
  }, [authData.isLoggedIn, authData.token, authData.email, authData.phone, contactForm.email, loggedInPhoneInput, activeRequest?.id, selectedRequestId]);

  // ---------------------------------------------------------------------------
  // SYNC AUTH ON EVENT / PERIODICALLY WHEN OPEN
  // ---------------------------------------------------------------------------
  useEffect(() => {
    syncAuthState();
    const handleStorageChange = () => syncAuthState();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen, syncAuthState]);

  // Initial fetch on mount
  useEffect(() => {
    fetchQuickReplies();
  }, [fetchQuickReplies]);

  // When widget opens: refresh problems, quick replies, requests list & details
  useEffect(() => {
    if (isOpen) {
      fetchProblems();
      fetchQuickReplies();
      fetchUserRequests();
      const targetId = selectedRequestId || activeRequest?.id;
      if (targetId) {
        fetchRequestDetails(targetId);
      }
    }
  }, [isOpen, activeTab, fetchProblems, fetchQuickReplies, fetchUserRequests, fetchRequestDetails, selectedRequestId, activeRequest?.id]);

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

  // Scroll messages ONLY when a genuine new message is added (never repeatedly on background polling)
  useEffect(() => {
    if (activeTab !== 'upd') return;

    const currentMsgCount = requestDetails?.messages?.length || 0;
    const isDifferentTicket = selectedRequestId !== prevSelectedReqIdRef.current;
    prevSelectedReqIdRef.current = selectedRequestId;

    // When opening or switching to a ticket, ensure view starts at top so status & initial messages are visible
    if (isDifferentTicket) {
      prevMsgCountRef.current = currentMsgCount;
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }
      return;
    }

    // Only scroll down when a genuine NEW message is added
    if (currentMsgCount > prevMsgCountRef.current) {
      prevMsgCountRef.current = currentMsgCount;
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      prevMsgCountRef.current = currentMsgCount;
    }
  }, [requestDetails?.messages?.length, activeTab, selectedRequestId]);

  // ---------------------------------------------------------------------------
  // SOCKET.IO REAL-TIME SUPPORT CHAT INTEGRATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const currentId = selectedRequestId || activeRequest?.id;
    if (!currentId) return;
    const reqId = currentId.toString();

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
        fetchUserRequests();
      }
    };

    const handleStatusChange = (payload) => {
      const payloadId = (payload?.requestId || payload?._id || '').toString();
      if (payloadId === reqId) {
        setRequestDetails((prev) => (prev ? { ...prev, status: payload.status } : null));
        fetchUserRequests();
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
  }, [selectedRequestId, activeRequest?.id, fetchUserRequests]);

  // Periodic silent polling backup (every 3s) while widget is open & on updates tab
  useEffect(() => {
    const targetId = selectedRequestId || activeRequest?.id;
    if (!isOpen || activeTab !== 'upd' || !targetId) return;
    const timer = setInterval(() => {
      fetchRequestDetails(targetId, true);
    }, 3000);
    return () => clearInterval(timer);
  }, [isOpen, activeTab, selectedRequestId, activeRequest?.id, fetchRequestDetails]);

  const handleSendFollowUpOption = async (optionText) => {
    const currentReqId = selectedRequestId || activeRequest?.id;
    if (!currentReqId || sendingFollowUp) return;
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
      const res = await fetch(`${API_URL}/api/support/requests/${currentReqId}/followup`, {
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

  const handleSaveLoggedInPhone = async (e) => {
    if (e) e.preventDefault();
    const cleanDigits = (loggedInPhoneInput || '').replace(/\D/g, '');

    if (countryCode === '+91') {
      if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
        setLoggedInPhoneError('Please enter a valid 10-digit mobile number');
        return;
      }
    } else {
      if (!/^\d{7,15}$/.test(cleanDigits)) {
        setLoggedInPhoneError('Please enter a valid mobile number');
        return;
      }
    }

    setLoggedInPhoneError('');
    setIsSavingPhone(true);

    try {
      const activeToken = authData.token;
      const headers = { 'Content-Type': 'application/json' };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch(`${API_URL}/api/support/update-phone`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: cleanDigits,
          countryCode,
          email: authData.email,
          targetRole: authData.backendRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthData((prev) => ({
          ...prev,
          phone: cleanDigits,
          countryCode,
        }));
        setIsEditingPhone(false);

        // Update localStorage across all 3 verticals
        // 1. Employee / Candidate
        try {
          const stored = localStorage.getItem('userProfile');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.mobile = cleanDigits;
            parsed.phone = cleanDigits;
            parsed.countryCode = countryCode;
            localStorage.setItem('userProfile', JSON.stringify(parsed));
          }
        } catch (_) {}

        // 2 & 3. Employer & Consultant
        try {
          const storedEmp = localStorage.getItem('employerInfo');
          if (storedEmp) {
            const parsedEmp = JSON.parse(storedEmp);
            parsedEmp.mobile = cleanDigits;
            parsedEmp.phone = cleanDigits;
            parsedEmp.countryCode = countryCode;
            localStorage.setItem('employerInfo', JSON.stringify(parsedEmp));
          }
        } catch (_) {}
      } else {
        setLoggedInPhoneError(data.message || 'Failed to save mobile number.');
      }
    } catch (_) {
      setLoggedInPhoneError('Network error while saving phone number. Please try again.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if ((!selectedProblemId && !customProblemText.trim()) || isSubmitting) {
      if (!selectedProblemId && !customProblemText.trim()) {
        setSubmitError('Please select a problem from the list or type your issue.');
      }
      return;
    }

    // For guest users, verify contact details are filled
    if (!authData.isLoggedIn) {
      if (!validateContactForm()) {
        setGuestStep(1);
        return;
      }
    } else {
      // For logged-in users, verify they have a valid phone number
      const currentPhone = (loggedInPhoneInput.trim() || authData.phone || '').replace(/\D/g, '');
      const isInvalid = countryCode === '+91'
        ? !/^[6-9]\d{9}$/.test(currentPhone)
        : !/^\d{7,15}$/.test(currentPhone);

      if (isInvalid) {
        setIsEditingPhone(true);
        setLoggedInPhoneError(countryCode === '+91' ? 'Please enter a valid 10-digit mobile number' : 'Please enter a valid mobile number');
        setSubmitError('');
        return;
      }
      setLoggedInPhoneError('');
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
        ? (loggedInPhoneInput.trim() || authData.phone || '')
        : contactForm.phone.trim();

      const fullPhone = rawPhone
        ? (rawPhone.startsWith('+') ? rawPhone : `${countryCode} ${rawPhone.replace(/\D/g, '')}`)
        : '';

      const targetRole = authData.isLoggedIn
        ? authData.backendRole
        : (guestRole === 'candidate' ? 'employee' : guestRole);

      const bodyPayload = {
        problemId: selectedProblemId || null,
        customProblemText: customProblemText.trim(),
        targetRole,
        name: activeName,
        email: activeEmail,
        phone: fullPhone,
        countryCode,
      };

      const res = await fetch(`${API_URL}/api/support/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Automatically update local state and storage for all 3 verticals
        if (authData.isLoggedIn && rawPhone) {
          const cleanDigits = rawPhone.replace(/\D/g, '');
          setAuthData(prev => ({
            ...prev,
            phone: cleanDigits
          }));
          setIsEditingPhone(false);

          // 1. Candidate / Employee
          try {
            const stored = localStorage.getItem('userProfile');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.mobile = cleanDigits;
              parsed.phone = cleanDigits;
              parsed.countryCode = countryCode;
              localStorage.setItem('userProfile', JSON.stringify(parsed));
            }
          } catch (_) {}

          // 2 & 3. Employer & Consultant
          try {
            const storedEmp = localStorage.getItem('employerInfo');
            if (storedEmp) {
              const parsedEmp = JSON.parse(storedEmp);
              parsedEmp.mobile = cleanDigits;
              parsedEmp.phone = cleanDigits;
              parsedEmp.countryCode = countryCode;
              localStorage.setItem('employerInfo', JSON.stringify(parsedEmp));
            }
          } catch (_) {}
        }

        const reqInfo = {
          id: data.data._id,
          problemText: data.data.problemText,
          email: activeEmail,
          submittedAt: Date.now(),
        };
        localStorage.setItem('sahijob_active_support_request', JSON.stringify(reqInfo));
        try {
          const storedList = JSON.parse(localStorage.getItem('sahijob_support_request_ids') || '[]');
          if (!storedList.includes(data.data._id)) {
            storedList.unshift(data.data._id);
            localStorage.setItem('sahijob_support_request_ids', JSON.stringify(storedList));
          }
        } catch (_) {}

        setActiveRequest(reqInfo);
        setSelectedRequestId(data.data._id);
        fetchRequestDetails(reqInfo.id);
        fetchUserRequests();

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
    setCustomProblemText('');
    setSubmitSuccess(false);
    setSubmitError('');
    setIsEditingPhone(false);
    setLoggedInPhoneError('');
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
    setSelectedRequestId(null);
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
    userRequests.some((r) => r.hasUnreadAdminReply) ||
    (requestDetails?.hasUnreadAdminReply && activeTab !== 'upd')
  );

  // Hide widget completely on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

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
              fetchUserRequests();
              if (selectedRequestId) {
                fetchRequestDetails(selectedRequestId);
              }
            }}
          >
            Updates &amp; chat
            <span className={`sj-dot ${hasUnread ? 'on' : ''}`} id="sjDot" />
          </button>
        </div>

        {/* Panel Body */}
        <div className="sj-body" id="sjBody" ref={bodyRef}>
          {/* TAB 1: UPDATES & CHAT */}
          {activeTab === 'upd' ? (
            selectedRequestId && (requestDetails || activeRequest) ? (
              /* DETAIL / CHAT VIEW FOR SELECTED REQUEST */
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequestId(null);
                      fetchUserRequests();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--g800)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                    <span>All requests ({userRequests.length || 1})</span>
                  </button>
                </div>

                {/* Request Status Banner */}
                <div className="sj-status">
                  <span className={`sj-badge ${requestDetails?.status === 'resolved' ? 'done' : ''}`}>
                    {requestDetails?.status === 'resolved' ? 'Resolved' : 'In progress'}
                  </span>
                  <small>Request status</small>
                  <b>{requestDetails?.problemText || activeRequest?.problemText}</b>
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
                    {((requestDetails?.allowedFollowUps && requestDetails.allowedFollowUps.length > 0)
                      ? requestDetails.allowedFollowUps
                      : quickRepliesList
                    ).map((opt, i) => (
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
            ) : (
              /* LIST VIEW OF ALL USER'S REQUESTS */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <b style={{ fontSize: '14px', color: 'var(--ink)' }}>Your Support Requests</b>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink3)' }}>
                    {userRequests.length} total
                  </span>
                </div>

                {loadingUserRequests && userRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '12px', color: 'var(--ink3)' }}>
                    Loading your requests...
                  </div>
                ) : userRequests.length === 0 ? (
                  <div className="sj-empty" style={{ padding: '30px 10px' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
                      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.1A8.4 8.4 0 1 1 21 11.5Z" />
                    </svg>
                    <b>No support requests found</b>
                    <p style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '4px' }}>
                      You haven't submitted any requests yet. Start a new request below.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {userRequests.map((req) => {
                      const isResolved = req.status === 'resolved';
                      const createdStr = req.createdAt
                        ? new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                          ' • ' +
                          new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <div
                          key={req._id}
                          className="sj-req-card"
                          onClick={() => {
                            setSelectedRequestId(req._id);
                            fetchRequestDetails(req._id);
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: '1.5px solid var(--line)',
                            background: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                background: isResolved ? '#dcfce7' : '#fef3c7',
                                color: isResolved ? '#166534' : '#92400e',
                                border: `1px solid ${isResolved ? '#bbf7d0' : '#fde68a'}`,
                              }}
                            >
                              {isResolved ? 'Resolved' : 'In progress'}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{createdStr}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#16211a', lineHeight: '1.3' }}>
                              {req.problemText}
                            </span>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </div>

                          {req.description && (
                            <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{req.description}"
                            </div>
                          )}

                          {req.hasUnreadAdminReply && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                              New reply from support
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
          ) : authData.isLoggedIn && (!authData.phone || isEditingPhone) ? (
            /* =========================================================
             * B) LOGGED-IN STEP: ENTER PHONE NUMBER FIRST (ONLY PHONE SHOWN)
             * ========================================================= */
            <form onSubmit={handleSaveLoggedInPhone} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* User summary chip */}
              <div className="sj-chip">
                <div className="sj-av">{getInitials(authData.name)}</div>
                <div className="grow">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <b style={{ fontSize: '13.5px' }}>{authData.name || 'User'}</b>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '999px', background: '#ecfdf3', color: '#166534', border: '1px solid #bbf7d0', textTransform: 'capitalize' }}>
                      {ROLE_LABELS[authData.role] || authData.role}
                    </span>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', wordBreak: 'break-all' }}>
                    {authData.email || 'Logged in user'}
                  </span>
                </div>
                {isEditingPhone && authData.phone && (
                  <button
                    type="button"
                    className="sj-link"
                    style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}
                    onClick={() => {
                      setIsEditingPhone(false);
                      setLoggedInPhoneError('');
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Title & description */}
              <div className="sj-title" style={{ marginTop: '2px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Enter your mobile number</h3>
                  <p style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                    Please provide your contact number so our support team can assist you over call.
                  </p>
                </div>
              </div>

              {/* Mobile Input with Country Code */}
              <div className="sj-field">
                <label htmlFor="fLoggedInPhoneOnly" style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ink)' }}>
                  Contact mobile number <i style={{ color: 'var(--err)', fontStyle: 'normal' }}>*</i>
                </label>
                <div className="sj-phone">
                  <div className="sj-cc-wrap" title="Select country code">
                    <span className="sj-cc-flag">{currentCountry.flag}</span>
                    <span className="sj-cc-code">{countryCode}</span>
                    <svg className="sj-cc-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <select
                      id="fLoggedInPhoneOnlyCC"
                      className="sj-cc-select-overlay"
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        if (loggedInPhoneError) setLoggedInPhoneError('');
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
                    id="fLoggedInPhoneOnly"
                    type="tel"
                    autoFocus
                    inputMode="numeric"
                    maxLength={countryCode === '+91' ? 10 : 15}
                    className={`sj-input ${loggedInPhoneError ? 'bad' : ''}`}
                    autoComplete="tel-national"
                    placeholder={countryCode === '+91' ? 'Enter 10-digit mobile number' : 'Enter mobile number'}
                    value={loggedInPhoneInput}
                    onChange={(e) => {
                      const maxLen = countryCode === '+91' ? 10 : 15;
                      const clean = e.target.value.replace(/\D/g, '').slice(0, maxLen);
                      setLoggedInPhoneInput(clean);
                      if (loggedInPhoneError) setLoggedInPhoneError('');
                    }}
                  />
                </div>
                {loggedInPhoneError ? (
                  <div className="sj-err" style={{ marginTop: '4px' }}>{loggedInPhoneError}</div>
                ) : (
                  <div className="sj-hint" style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {countryCode === '+91'
                      ? 'This 10-digit number will be linked to your profile.'
                      : 'This number will be linked to your profile.'}
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* =========================================================
             * C) STEP 2 (GUEST) OR DIRECT ISSUE VIEW (LOGGED-IN WITH PHONE)
             * ========================================================= */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* User summary card */}
              {authData.isLoggedIn ? (
                /* Logged-In User Card: Avatar, Name, Email, Phone and Change button */
                <div className="sj-chip">
                  <div className="sj-av">{getInitials(authData.name)}</div>
                  <div className="grow">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <b style={{ fontSize: '13.5px' }}>{authData.name || 'User'}</b>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '999px', background: '#ecfdf3', color: '#166534', border: '1px solid #bbf7d0', textTransform: 'capitalize' }}>
                        {ROLE_LABELS[authData.role] || authData.role}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', wordBreak: 'break-all' }}>
                      {authData.email || 'Logged in user'}
                      {authData.phone ? ` • ${countryCode} ${authData.phone}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="sj-link"
                    style={{ color: 'var(--g800)', fontSize: '11px', fontWeight: 700 }}
                    onClick={() => {
                      setIsEditingPhone(true);
                      setLoggedInPhoneError('');
                    }}
                  >
                    Change No.
                  </button>
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
                            setCustomProblemText('');
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

              {/* Type your problem custom text field */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  htmlFor="fCustomProblem"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    color: 'var(--ink)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--g600)' }}>
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Type your problem <i style={{ color: 'var(--ink3)', fontWeight: 400, fontStyle: 'normal' }}>(describe your issue)</i>
                  </span>
                  {customProblemText && (
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                      {customProblemText.length}/500
                    </span>
                  )}
                </label>
                <textarea
                  id="fCustomProblem"
                  rows={3}
                  maxLength={500}
                  className="sj-input"
                  style={{
                    resize: 'vertical',
                    minHeight: '74px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    lineHeight: '1.45',
                    borderRadius: '12px',
                    border: '1.5px solid var(--line)',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Describe what problem you are facing in your own words..."
                  value={customProblemText}
                  onFocus={() => {
                    if (selectedProblemId) {
                      setSelectedProblemId('');
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomProblemText(val);
                    if (selectedProblemId) {
                      setSelectedProblemId('');
                    }
                    if (submitError) setSubmitError('');
                  }}
                />
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedProblemId
                    ? 'Optional: You can provide specific details or error messages.'
                    : 'You can type your problem directly if it is not listed above.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel Footer (Sticky Bottom) */}
        <footer className="sj-foot" id="sjFoot">
          {activeTab === 'upd' ? (
            selectedRequestId ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="sj-btn sj-btn-secondary"
                  onClick={() => {
                    setSelectedRequestId(null);
                    fetchUserRequests();
                  }}
                  style={{ flex: 1 }}
                >
                  ← All requests
                </button>
                <button
                  type="button"
                  className="sj-btn"
                  onClick={handleClearAndNewRequest}
                  style={{ flex: 1 }}
                >
                  + New request
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="sj-btn"
                id="startNew"
                onClick={handleStartNewRequest}
              >
                + Start a new request
              </button>
            )
          ) : submitSuccess ? (
            <button
              type="button"
              className="sj-btn"
              id="viewUpd"
              onClick={() => {
                setSubmitSuccess(false);
                setActiveTab('upd');
                fetchUserRequests();
                if (activeRequest?.id) {
                  setSelectedRequestId(activeRequest.id);
                  fetchRequestDetails(activeRequest.id);
                }
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
          ) : authData.isLoggedIn && (!authData.phone || isEditingPhone) ? (
            <button
              type="button"
              className="sj-btn"
              id="savePhoneContinue"
              disabled={isSavingPhone}
              onClick={handleSaveLoggedInPhone}
            >
              {isSavingPhone ? (
                'Saving…'
              ) : (
                <>
                  <span>Save &amp; Continue</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="sj-btn"
              id="sjSend"
              disabled={(!selectedProblemId && !customProblemText.trim()) || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? 'Sending…'
                : (selectedProblemId || customProblemText.trim())
                ? 'Submit request'
                : 'Select or type an issue above'}
            </button>
          )}
        </footer>
      </section>
    </>
  );
}
