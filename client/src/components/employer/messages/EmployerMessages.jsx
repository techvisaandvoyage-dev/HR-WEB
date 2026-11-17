import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { socket } from '../../../utils/socket';
import { formatPhoneWithCountryCode } from '../../../data/countryCodes';
import CandidateProfileFullScreen from '../dashboard/CandidateProfileFullScreen';
import MultiSelectLocationDropdown from '../../common/MultiSelectLocationDropdown';

const EmployerMessages = ({ 
  portalConfig, 
  candidates = [], 
  jobs = [], 
  triggerNavRefresh, 
  updateCandidateStatus, 
  employerProfile = null 
}) => {
  const location = useLocation();
  const initialEmployeeData = location.state?.initialEmployee;
  const initialApplicationData = location.state?.initialApplication;

  // Conversations & Chat State
  const [backendConversations, setBackendConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Two-Panel Job & Candidate View State
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState('jobs'); // 'jobs' | 'candidates'

  // Candidate Filters on the Right Panel
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('All');
  const [candidateChatFilter, setCandidateChatFilter] = useState('All');

  // Popovers & Modals
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [activeStatusDropdownAppId, setActiveStatusDropdownAppId] = useState(null);
  const [avatarFailedMap, setAvatarFailedMap] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const infoRef = useRef(null);
  const optionsRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        setIsInfoOpen(false);
      }
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setIsOptionsOpen(false);
      }
      if (!e.target.closest('[data-status-dropdown]')) {
        setActiveStatusDropdownAppId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isDrawerOpen]);

  // Helper functions for Candidate details
  const getWorkExp = (cand) => {
    if (!cand) return 'Fresher';
    if (cand.professionalDetails?.totalExperience && cand.professionalDetails.totalExperience !== 'N/A' && cand.professionalDetails.totalExperience !== '') {
      return cand.professionalDetails.totalExperience;
    }
    if (cand.totalExperience && cand.totalExperience !== 'N/A' && cand.totalExperience !== '') {
      return cand.totalExperience;
    }
    if (cand.isFresher) return 'Fresher';
    if (cand.experience && cand.experience.length > 0) {
      const count = cand.experience.length;
      return `${count} - ${count + 2} Yrs`;
    }
    return 'Fresher';
  };

  const getCurrentDesignation = (cand) => {
    if (!cand) return 'Candidate';
    if (cand.currentDesignation) return cand.currentDesignation;
    if (cand.designation && cand.designation !== 'N/A' && cand.designation !== '') {
      return cand.designation;
    }
    const exps = cand.experience || [];
    if (Array.isArray(exps)) {
      const currentRole = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob))?.roles?.find(r => r.currentCompany || r.currentJob);
      if (currentRole?.jobTitle || currentRole?.title || currentRole?.role) return currentRole.jobTitle || currentRole.title || currentRole.role;
      if (exps[0]?.roles?.[0]?.jobTitle) return exps[0].roles[0].jobTitle;
      if (exps[0]?.role) return exps[0].role;
    }
    return 'Applicant';
  };

  const getCurrentCompany = (cand) => {
    if (!cand) return 'N/A';
    if (cand.currentCompany) return cand.currentCompany;
    const exps = cand.experience || [];
    if (Array.isArray(exps)) {
      const currentExp = exps.find(e => e.roles?.some(r => r.currentCompany || r.currentJob) || e.currentCompany || e.currentJob) || exps[0];
      if (currentExp?.companyName || currentExp?.company) return currentExp.companyName || currentExp.company;
    }
    if (cand.professionalDetails?.currentCompany) {
      return cand.professionalDetails.currentCompany;
    }
    return cand.company || 'N/A';
  };

  const getHighestQualification = (cand) => {
    if (!cand) return 'Graduate';
    const quals = cand.qualifications || cand.education || [];
    if (!Array.isArray(quals) || quals.length === 0) return 'Graduate';
    const primary = quals.find(q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1)) || quals[0];
    return primary?.course || primary?.educationType || primary?.degree || primary?.university || 'Graduate';
  };

  const getInitials = (name = '') => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // 1. Fetch conversations metadata
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setBackendConversations(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Global socket listeners for real-time conversation updates
  useEffect(() => {
    const handleConversationUpdated = (data) => {
      setBackendConversations(prev => {
        const isCurrentChat = selectedAppId && String(selectedAppId) === String(data.applicationId);
        const exists = prev.find(c => String(c.applicationId || c.id || c._id) === String(data.applicationId));
        
        if (exists) {
          return prev.map(c => 
            String(c.applicationId || c.id || c._id) === String(data.applicationId) 
              ? { 
                  ...c, 
                  lastMessage: data.lastMessage, 
                  lastMessageTime: data.lastMessageTime,
                  unreadCount: (data.senderModel === 'Employee' && !isCurrentChat) ? (c.unreadCount || 0) + 1 : (isCurrentChat ? 0 : c.unreadCount)
                } 
              : c
          ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        } else {
          return [{
            applicationId: data.applicationId,
            lastMessage: data.lastMessage,
            lastMessageTime: data.lastMessageTime,
            unreadCount: (data.senderModel === 'Employee' && !isCurrentChat) ? 1 : 0
          }, ...prev];
        }
      });
      if (triggerNavRefresh) triggerNavRefresh();
    };

    const handleConversationBlockToggled = (data) => {
      setBackendConversations(prev => prev.map(c => 
        String(c.applicationId || c.id || c._id) === String(data.applicationId) 
          ? { ...c, isBlocked: data.isBlocked, blockedBy: data.blockedBy, blockedAt: data.blockedAt }
          : c
      ));
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('conversation_block_toggled', handleConversationBlockToggled);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('conversation_block_toggled', handleConversationBlockToggled);
    };
  }, [selectedAppId, triggerNavRefresh]);

  // Build flattened applications list with stable displayAppId & enriched conversation data
  const allConversations = useMemo(() => {
    const list = [];
    (candidates || []).forEach(cand => {
      const history = cand.history || [];
      if (history.length === 0) {
        list.push({
          appId: cand.id || `app-${cand.email}`,
          applicationNumber: cand.applicationNumber,
          jobTitle: cand.appliedJob || 'General Application',
          status: cand.status || 'New',
          appliedDate: cand.date || new Date().toLocaleDateString(),
          createdAt: cand.createdAt || cand.date,
          screeningAnswers: cand.screeningAnswers || [],
          sourceLink: cand.sourceLink || 'Direct Apply',
          resume: cand.resume || cand.documents?.resume || '',
          coverLetter: cand.coverLetter || cand.documents?.coverLetter || '',
          introVideo: cand.introVideo || cand.documents?.introVideo || '',
          hasIntroVideo: Boolean(cand.hasIntroVideo || cand.introVideo || cand.documents?.introVideo),
          candidate: cand
        });
      } else {
        history.forEach(app => {
          list.push({
            appId: app.appId || `${cand.id}-${app.title}`,
            applicationNumber: app.applicationNumber,
            jobTitle: app.title || 'Unknown Job',
            status: app.status || 'New',
            appliedDate: app.date || cand.date,
            createdAt: app.createdAt || cand.createdAt || app.date,
            screeningAnswers: app.screeningAnswers || [],
            sourceLink: app.sourceLink || cand.sourceLink || 'Direct Apply',
            resume: app.resume || cand.resume || cand.documents?.resume || '',
            coverLetter: app.coverLetter || cand.coverLetter || cand.documents?.coverLetter || '',
            introVideo: app.introVideo || cand.introVideo || cand.documents?.introVideo || '',
            hasIntroVideo: Boolean(app.hasIntroVideo || cand.hasIntroVideo || app.introVideo || cand.introVideo || cand.documents?.introVideo),
            candidate: cand
          });
        });
      }
    });

    // Chronological stable sort to assign sequential Application IDs starting from 500101
    const sortedChronological = [...list].sort((a, b) => new Date(a.createdAt || a.appliedDate || 0) - new Date(b.createdAt || b.appliedDate || 0));
    const appIdMap = new Map();
    sortedChronological.forEach((item, index) => {
      const seqId = 500101 + index;
      appIdMap.set(item.appId, item.applicationNumber || seqId);
    });

    return list.map(item => {
      const conv = backendConversations.find(c => String(c.applicationId || c.id || c._id) === String(item.appId));
      const jobInfo = (jobs || []).find(j => (j.title || j.jobTitle || '').toLowerCase() === (item.jobTitle || '').toLowerCase());
      
      const openings = jobInfo?.openings || jobInfo?.vacancies || jobInfo?.numberOfOpenings || 1;
      const jobStatus = jobInfo?.status || 'Active';

      return {
        ...item,
        displayAppId: appIdMap.get(item.appId) || 500101,
        openings,
        jobStatus,
        lastMessage: conv?.lastMessage || '',
        lastMessageTime: conv?.lastMessageTime || item.appliedDate,
        unreadCount: conv?.unreadCount || 0,
        isBlocked: Boolean(conv?.isBlocked),
        blockedBy: conv?.blockedBy || null
      };
    }).sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      return new Date(b.lastMessageTime || b.createdAt || 0) - new Date(a.lastMessageTime || a.createdAt || 0);
    });
  }, [candidates, backendConversations, jobs]);

  // Master List of Posted Jobs (Compiled from jobs prop + applications)
  const postedJobsList = useMemo(() => {
    const jobMap = new Map();

    // 1. Add posted jobs from employer database
    (jobs || []).forEach(j => {
      const title = j.title || j.jobTitle;
      if (!title) return;
      const key = title.trim().toLowerCase();
      jobMap.set(key, {
        id: j._id || j.id || key,
        title: title.trim(),
        status: j.status || 'Active',
        openings: j.openings || j.vacancies || j.numberOfOpenings || 1,
        jobType: j.jobType || j.type || 'Full-time',
        workMode: j.workMode || j.workLocation || (j.isRemote ? 'Remote' : (j.location || 'Remote')),
        createdAt: j.createdAt || j.date || 0,
        postedDate: j.postedDate || j.date,
        jobObject: j
      });
    });

    // 2. Also ensure any job title from existing candidate applications exists
    allConversations.forEach(app => {
      const title = app.jobTitle;
      if (!title) return;
      const key = title.trim().toLowerCase();
      if (!jobMap.has(key)) {
        jobMap.set(key, {
          id: `job-${key}`,
          title: title.trim(),
          status: app.jobStatus || 'Active',
          openings: app.openings || 1,
          jobType: 'Full-time',
          workMode: 'Remote',
          createdAt: app.createdAt || 0,
          postedDate: app.appliedDate,
          jobObject: null
        });
      }
    });

    // 3. For each job, count applicants and unread messages
    const list = Array.from(jobMap.values()).map(job => {
      const jobApps = allConversations.filter(app => 
        (app.jobTitle || '').trim().toLowerCase() === job.title.toLowerCase()
      );
      const applicantsCount = jobApps.length;
      const unreadCount = jobApps.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
      
      const latestActivity = jobApps.reduce((max, curr) => {
        const t = new Date(curr.lastMessageTime || curr.createdAt || 0).getTime();
        return t > max ? t : max;
      }, new Date(job.createdAt || 0).getTime());

      return {
        ...job,
        applicantsCount,
        unreadCount,
        latestActivity
      };
    });

    // Sort: jobs with unread messages first, then by latest activity or creation
    return list.sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      return b.latestActivity - a.latestActivity;
    });
  }, [jobs, allConversations]);

  // Filter posted jobs list by search term
  const filteredPostedJobs = useMemo(() => {
    if (!jobSearchTerm.trim()) return postedJobsList;
    const q = jobSearchTerm.toLowerCase().trim();
    return postedJobsList.filter(j => 
      j.title.toLowerCase().includes(q) || 
      (j.workMode && j.workMode.toLowerCase().includes(q)) ||
      (j.jobType && j.jobType.toLowerCase().includes(q))
    );
  }, [postedJobsList, jobSearchTerm]);

  // Handle route state initial selection or default select first job
  useEffect(() => {
    if (initialApplicationData || initialEmployeeData) {
      const targetAppId = initialApplicationData?.appId || initialApplicationData?.id;
      const targetEmail = (initialEmployeeData?.email || '').toLowerCase();

      const matched = allConversations.find(a => 
        (targetAppId && a.appId === targetAppId) ||
        (targetEmail && a.candidate?.email?.toLowerCase() === targetEmail)
      );

      if (matched) {
        setSelectedJobTitle(matched.jobTitle);
        setSelectedAppId(matched.appId);
        setIsDrawerOpen(true);
        setMobileView('candidates');
        return;
      }
    }

    if (postedJobsList.length > 0) {
      setSelectedJobTitle(prev => {
        if (prev && postedJobsList.some(j => j.title.toLowerCase() === prev.toLowerCase())) {
          return prev;
        }
        return postedJobsList[0].title;
      });
    }
  }, [initialApplicationData, initialEmployeeData, allConversations, postedJobsList]);

  // Current selected job object
  const activeSelectedJob = useMemo(() => {
    if (!selectedJobTitle) return postedJobsList[0] || null;
    return postedJobsList.find(j => j.title.toLowerCase() === selectedJobTitle.toLowerCase()) || postedJobsList[0] || null;
  }, [selectedJobTitle, postedJobsList]);

  // Only candidates who applied for the selected job
  const candidatesForSelectedJob = useMemo(() => {
    if (!activeSelectedJob) return [];
    return allConversations.filter(app => 
      (app.jobTitle || '').trim().toLowerCase() === activeSelectedJob.title.toLowerCase()
    );
  }, [activeSelectedJob, allConversations]);

  // Status counts for selected job
  const jobStatusCounts = useMemo(() => {
    const counts = {
      All: candidatesForSelectedJob.length,
      New: 0,
      Viewed: 0,
      Shortlisted: 0,
      Rejected: 0
    };

    candidatesForSelectedJob.forEach(item => {
      const s = (item.status || '').toLowerCase();
      if (s === 'new' || s === 'applied') {
        counts.New++;
      } else if (s === 'viewed' || s === 'under review') {
        counts.Viewed++;
      } else if (s === 'shortlisted' || s === 'interview scheduled' || s === 'technical round' || s === 'hr round' || s === 'offer sent' || s === 'hired') {
        counts.Shortlisted++;
      } else if (s === 'rejected' || s === 'withdrawn') {
        counts.Rejected++;
      }
    });

    return counts;
  }, [candidatesForSelectedJob]);

  // Filtered candidate list for the selected job
  const filteredCandidates = useMemo(() => {
    return candidatesForSelectedJob.filter(app => {
      // 1. Status filter
      if (candidateStatusFilter !== 'All') {
        const s = (app.status || '').toLowerCase();
        if (candidateStatusFilter === 'New' && s !== 'new' && s !== 'applied') return false;
        if (candidateStatusFilter === 'Viewed' && s !== 'viewed' && s !== 'under review') return false;
        if (candidateStatusFilter === 'Shortlisted' && !['shortlisted', 'interview scheduled', 'technical round', 'hr round', 'offer sent', 'hired'].includes(s)) return false;
        if (candidateStatusFilter === 'Rejected' && s !== 'rejected' && s !== 'withdrawn') return false;
      }

      // 2. Chat status filter
      if (candidateChatFilter === 'Unread') {
        if (!app.unreadCount || app.unreadCount <= 0) return false;
      }

      // 3. Search query
      if (candidateSearch.trim()) {
        const q = candidateSearch.toLowerCase().trim();
        const candName = app.candidate?.name?.toLowerCase() || '';
        const candEmail = app.candidate?.email?.toLowerCase() || '';
        const candPhone = app.candidate?.phone || '';
        const appId = String(app.displayAppId || '');
        if (!candName.includes(q) && !candEmail.includes(q) && !candPhone.includes(q) && !appId.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [candidatesForSelectedJob, candidateStatusFilter, candidateChatFilter, candidateSearch]);

  const hasActiveCandidateFilters = Boolean(
    candidateSearch.trim() ||
    candidateStatusFilter !== 'All' ||
    candidateChatFilter !== 'All'
  );

  const resetCandidateFilters = () => {
    setCandidateSearch('');
    setCandidateStatusFilter('All');
    setCandidateChatFilter('All');
  };

  // Active selected conversation object
  const activeConversation = useMemo(() => {
    if (!selectedAppId) return null;
    return allConversations.find(c => c.appId === selectedAppId) || null;
  }, [selectedAppId, allConversations]);

  // Fetch messages and join live socket room when selectedAppId changes
  useEffect(() => {
    if (selectedAppId && isDrawerOpen) {
      fetchMessages(selectedAppId);
      socket.emit('join_chat', selectedAppId);

      const handleReconnect = () => {
        socket.emit('join_chat', selectedAppId);
      };
      socket.on('connect', handleReconnect);

      const handleReceiveMessage = (msg) => {
        const msgAppId = typeof msg.applicationId === 'object' ? (msg.applicationId._id || msg.applicationId.id) : msg.applicationId;
        if (String(msgAppId) === String(selectedAppId)) {
          setMessages(prev => {
            if (prev.some(m => String(m._id) === String(msg._id))) return prev;
            return [...prev, msg];
          });
          
          if (msg.senderModel === 'Employee') {
            fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/applications/${selectedAppId}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
            }).catch(() => {});
            
            setBackendConversations(prev => prev.map(c => 
              String(c.applicationId || c.id) === String(selectedAppId) ? { ...c, unreadCount: 0 } : c
            ));
            if (triggerNavRefresh) triggerNavRefresh();
          }
        }
      };

      const handleMessagesMarkedRead = (data) => {
        if (String(data.applicationId) === String(selectedAppId) && data.readBy === 'Employee') {
          setMessages(prev => prev.map(m => m.senderModel === 'Employer' ? { ...m, isRead: true } : m));
        }
      };

      const handleUserTyping = (data) => {
        if (String(data.applicationId) === String(selectedAppId) && data.senderModel === 'Employee') {
          setIsTyping(true);
        }
      };

      const handleUserStopTyping = (data) => {
        if (String(data.applicationId) === String(selectedAppId) && data.senderModel === 'Employee') {
          setIsTyping(false);
        }
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('messages_marked_read', handleMessagesMarkedRead);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stop_typing', handleUserStopTyping);

      return () => {
        socket.emit('leave_chat', selectedAppId);
        socket.off('connect', handleReconnect);
        socket.off('receive_message', handleReceiveMessage);
        socket.off('messages_marked_read', handleMessagesMarkedRead);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stop_typing', handleUserStopTyping);
        setIsTyping(false);
      };
    } else {
      setMessages([]);
      setIsTyping(false);
    }
  }, [selectedAppId, isDrawerOpen]);

  const fetchMessages = async (appId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/applications/${appId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
        setBackendConversations(prev => prev.map(c => 
          String(c.applicationId || c.id) === String(appId) ? { 
            ...c, 
            unreadCount: 0,
            ...(data.application ? { isBlocked: data.application.isBlocked, blockedBy: data.application.blockedBy } : {})
          } : c
        ));
        if (triggerNavRefresh) triggerNavRefresh();
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    if (selectedAppId && activeConversation && !activeConversation.isBlocked) {
      socket.emit('typing', {
        applicationId: selectedAppId,
        senderModel: 'Employer'
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          applicationId: selectedAppId,
          senderModel: 'Employer'
        });
      }, 1500);
    }
  };

  const sendMessage = async (textToSend) => {
    const text = (textToSend !== undefined ? textToSend : newMessage).trim();
    if (!text || !selectedAppId || (activeConversation && activeConversation.isBlocked)) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', {
      applicationId: selectedAppId,
      senderModel: 'Employer'
    });

    setNewMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/applications/${selectedAppId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('employerToken')}`
        },
        body: JSON.stringify({ content: text })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => {
          if (prev.some(m => String(m._id) === String(data.data._id))) return prev;
          return [...prev, data.data];
        });

        setBackendConversations(prev => {
          const exists = prev.find(c => String(c.applicationId || c.id) === String(selectedAppId));
          if (exists) {
            return prev.map(c => 
              String(c.applicationId || c.id) === String(selectedAppId) 
                ? { ...c, lastMessage: data.data.content, lastMessageTime: data.data.createdAt }
                : c
            );
          } else {
            return [{
              applicationId: selectedAppId,
              lastMessage: data.data.content,
              lastMessageTime: data.data.createdAt,
              unreadCount: 0
            }, ...prev];
          }
        });
      } else {
        alert("Failed to send message: " + data.message);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Network error sending message.");
    }
  };

  const handleUpdateStatus = (appId, newStatus) => {
    if (updateCandidateStatus) {
      updateCandidateStatus(appId, newStatus);
    }

    const targetConv = allConversations.find(a => a.appId === appId);
    if (targetConv && targetConv.candidate && targetConv.candidate.history) {
      targetConv.candidate.history = targetConv.candidate.history.map(h => 
        h.appId === appId ? { ...h, status: newStatus } : h
      );
    }
    if (targetConv) {
      targetConv.status = newStatus;
    }

    setActiveStatusDropdownAppId(null);
  };

  const handleToggleBlock = async () => {
    if (!selectedAppId || !activeConversation) return;
    setIsBlockLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/applications/${selectedAppId}/toggle-block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setBackendConversations(prev => prev.map(c => 
          String(c.applicationId || c.id) === String(selectedAppId)
            ? { ...c, isBlocked: data.data.isBlocked, blockedBy: data.data.blockedBy, blockedAt: data.data.blockedAt }
            : c
        ));
        setIsBlockModalOpen(false);
        setIsOptionsOpen(false);
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error("Error toggling block:", err);
      alert("Failed to toggle block status.");
    } finally {
      setIsBlockLoading(false);
    }
  };

  const openChatDrawer = (app) => {
    setSelectedAppId(app.appId);
    setIsDrawerOpen(true);
    setIsInfoOpen(false);
    setIsOptionsOpen(false);

    // Auto update status from New/Applied to Viewed upon viewing
    const curStatus = (app.status || '').toLowerCase();
    if (curStatus === 'new' || curStatus === 'applied') {
      handleUpdateStatus(app.appId, 'Viewed');
    }
  };

  const closeChatDrawer = () => {
    setIsDrawerOpen(false);
    setIsInfoOpen(false);
    setIsOptionsOpen(false);
  };

  const getStatusBadgePill = (status) => {
    const s = (status || 'New').toLowerCase();
    if (s === 'viewed' || s === 'under review') {
      return {
        label: 'VIEWED',
        style: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309] hover:bg-[#fef3c7]'
      };
    }
    if (s === 'shortlisted' || s === 'hired') {
      return {
        label: 'SHORTLISTED',
        style: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46] hover:bg-[#d1fae5]'
      };
    }
    if (s === 'rejected' || s === 'withdrawn') {
      return {
        label: 'REJECTED',
        style: 'border-[#fecdd3] bg-[#fff1f2] text-[#be123c] hover:bg-[#ffe4e6]'
      };
    }
    return {
      label: 'NEW',
      style: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe]'
    };
  };

  const formatDate = (d) => {
    if (!d) return 'Today';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const formatTime = (d) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const quickReplies = [
    "Please share your updated CV",
    "Are you available for a call?",
    "When can you join?"
  ];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-gray-500 font-semibold animate-pulse">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. TOP HEADER CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {portalConfig?.title || 'Messages'}
            </h1>
            <span className="px-3 py-1 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full text-xs font-bold whitespace-nowrap">
              {postedJobsList.length} Posted Job{postedJobsList.length === 1 ? '' : 's'} • {allConversations.length} Applicants
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            {portalConfig?.subtitle || 'Select a posted job to view applicants and start messaging.'}
          </p>
        </div>

        {/* Selected Job Quick Badge on Mobile */}
        {activeSelectedJob && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Current Job:</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold truncate max-w-[220px]">
              {activeSelectedJob.title}
            </span>
          </div>
        )}
      </div>

      {/* 2. TWO-PANEL MASTER-DETAIL VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================= */}
        {/* LEFT PANEL: POSTED JOBS LIST (col-span-12 lg:col-span-4)  */}
        {/* ========================================================= */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col lg:col-span-4 ${
          mobileView === 'candidates' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                Posted Jobs
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                {postedJobsList.length}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-gray-400">
              Select a job to view applicants
            </span>
          </div>

          {/* Search Posted Jobs */}
          <div className="relative mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              value={jobSearchTerm}
              onChange={(e) => setJobSearchTerm(e.target.value)}
              placeholder="Search posted jobs..." 
              className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-800 focus:outline-none focus:border-[#059669] transition-all placeholder-gray-400"
            />
            {jobSearchTerm && (
              <button 
                type="button"
                onClick={() => setJobSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Jobs List */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredPostedJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-xs font-semibold text-gray-500">No posted jobs found</p>
                <p className="text-[11px] text-gray-400 mt-1">Try another search keyword.</p>
              </div>
            ) : (
              filteredPostedJobs.map((job) => {
                const isSelected = activeSelectedJob && activeSelectedJob.title.toLowerCase() === job.title.toLowerCase();

                return (
                  <button
                    key={job.id || job.title}
                    type="button"
                    onClick={() => {
                      setSelectedJobTitle(job.title);
                      setMobileView('candidates');
                    }}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#059669] bg-emerald-50/40 shadow-xs ring-1 ring-[#059669]/40'
                        : 'border-gray-200/80 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-[#059669] rounded-r-full" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-bold text-sm leading-snug line-clamp-2 ${isSelected ? 'text-[#059669]' : 'text-gray-900'}`}>
                        {job.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        job.status?.toLowerCase() === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {job.status || 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5 font-medium">
                      <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{job.workMode}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                          {job.applicantsCount} applicant{job.applicantsCount === 1 ? '' : 's'}
                        </span>
                        {job.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-[#059669] animate-pulse">
                            {job.unreadCount} unread
                          </span>
                        )}
                      </div>

                      <span className={`text-xs font-bold flex items-center gap-1 shrink-0 ${isSelected ? 'text-[#059669]' : 'text-gray-400'}`}>
                        <span>View</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* RIGHT PANEL: APPLICANTS FOR SELECTED JOB (col-span-12 lg:col-8) */}
        {/* =============================================================== */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 flex flex-col lg:col-span-8 overflow-visible relative ${
          mobileView === 'jobs' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {activeSelectedJob ? (
            <>
              {/* Top Banner for Selected Job */}
              <div className="pb-4 border-b border-gray-100 mb-5">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setMobileView('jobs')}
                  className="lg:hidden mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] hover:text-[#047857] cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>← Back to All Jobs</span>
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-gray-400">
                        Applicants for
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeSelectedJob.status?.toLowerCase() === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {activeSelectedJob.status}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-950 mt-0.5">
                      {activeSelectedJob.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      {activeSelectedJob.openings} opening{activeSelectedJob.openings > 1 ? 's' : ''} • {activeSelectedJob.workMode} • {activeSelectedJob.jobType}
                    </p>
                  </div>

                  {/* Applicants Counter Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-[#059669] border border-emerald-200 whitespace-nowrap">
                      {hasActiveCandidateFilters 
                        ? `${filteredCandidates.length} of ${candidatesForSelectedJob.length} Candidates` 
                        : `${candidatesForSelectedJob.length} Candidates Applied`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Round Filters Row matching Candidates Tab */}
              <div className="mb-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Candidate Search input */}
                  <div>
                    <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Search Candidate</span>
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input 
                        type="text" 
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        placeholder="Name, email or phone..." 
                        className="w-full pl-9 pr-8 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-gray-300 focus:outline-none focus:border-[#059669] transition-colors placeholder-gray-400 shadow-none"
                      />
                      {candidateSearch && (
                        <button 
                          type="button"
                          onClick={() => setCandidateSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Candidate Status Dropdown */}
                  <div>
                    <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</span>
                    <MultiSelectLocationDropdown
                      options={[
                        { value: 'All', label: `All Statuses (${jobStatusCounts.All})` },
                        { value: 'New', label: `New (${jobStatusCounts.New})` },
                        { value: 'Viewed', label: `Viewed (${jobStatusCounts.Viewed})` },
                        { value: 'Shortlisted', label: `Shortlisted (${jobStatusCounts.Shortlisted})` },
                        { value: 'Rejected', label: `Rejected (${jobStatusCounts.Rejected})` },
                      ]}
                      value={candidateStatusFilter}
                      onChange={(val) => setCandidateStatusFilter(val)}
                      multiple={false}
                      isLocation={false}
                      searchPlaceholder="Search status..."
                      placeholder="All Status"
                      className="w-full px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-gray-300 transition-colors shadow-none"
                    />
                  </div>

                  {/* Chat Status Dropdown */}
                  <div>
                    <span className="block text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Chat Status</span>
                    <MultiSelectLocationDropdown
                      options={[
                        { value: 'All', label: 'All Chats' },
                        { value: 'Unread', label: 'Unread Only' },
                      ]}
                      value={candidateChatFilter}
                      onChange={(val) => setCandidateChatFilter(val)}
                      multiple={false}
                      isLocation={false}
                      searchPlaceholder="Search chat status..."
                      placeholder="All Chats"
                      className="w-full px-3.5 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-800 hover:border-gray-300 transition-colors shadow-none"
                    />
                  </div>
                </div>

                {hasActiveCandidateFilters && (
                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={resetCandidateFilters}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-none"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Reset Filters</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Candidates Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="px-5 py-3.5 min-w-[220px] whitespace-nowrap">Candidate</th>
                      <th className="px-5 py-3.5 min-w-[140px] whitespace-nowrap">Candidate Status</th>
                      <th className="px-5 py-3.5 text-right min-w-[120px] whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-16 text-center text-gray-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="font-bold text-gray-600">No candidates found for this job</p>
                            <p className="text-xs text-gray-400">
                              {hasActiveCandidateFilters ? 'Try adjusting your filters.' : 'Candidates who apply for this job will appear here.'}
                            </p>
                            {hasActiveCandidateFilters && (
                              <button
                                type="button"
                                onClick={resetCandidateFilters}
                                className="mt-2 px-3.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full cursor-pointer"
                              >
                                Clear filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((app) => {
                        const cand = app.candidate || {};
                        const candAvatar = cand.avatar || cand.profilePhoto || cand.profilePicture || cand.photo || cand.personalDetails?.profilePhoto;
                        const candKey = cand._id || cand.id || cand.email || app.appId;
                        const statusPill = getStatusBadgePill(app.status);

                        return (
                          <tr 
                            key={app.appId} 
                            className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                            onClick={() => openChatDrawer(app)}
                          >
                            {/* 1. CANDIDATE */}
                            <td className="px-5 py-3.5 align-middle">
                              <div className="flex items-center gap-3">
                                {candAvatar && !avatarFailedMap[candKey] ? (
                                  <img 
                                    src={candAvatar} 
                                    alt={cand.name || 'Candidate'} 
                                    onError={() => setAvatarFailedMap(prev => ({ ...prev, [candKey]: true }))}
                                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-gray-200 shadow-none" 
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-none bg-slate-900">
                                    {getInitials(cand.name)}
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-gray-900 group-hover:text-[#059669] transition-colors leading-tight truncate">
                                    {cand.name || 'Candidate'}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate mt-0.5">
                                    {cand.email || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 2. CANDIDATE STATUS */}
                            <td className="px-5 py-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
                              <div className="relative inline-block" data-status-dropdown="true">
                                <button
                                  type="button"
                                  onClick={() => setActiveStatusDropdownAppId(prev => prev === app.appId ? null : app.appId)}
                                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-wider flex items-center justify-between gap-2 shadow-2xs transition-colors cursor-pointer ${statusPill.style}`}
                                >
                                  <span>{statusPill.label}</span>
                                  <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {activeStatusDropdownAppId === app.appId && (
                                  <div className="absolute left-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                                    {['New', 'Viewed', 'Shortlisted', 'Rejected'].map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleUpdateStatus(app.appId, opt)}
                                        className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between transition-colors cursor-pointer"
                                      >
                                        <span>{opt}</span>
                                        {app.status?.toLowerCase() === opt.toLowerCase() && (
                                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 3. MESSAGE BUTTON ONLY */}
                            <td className="px-5 py-3.5 align-middle text-right">
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openChatDrawer(app);
                                  }}
                                  className="bg-[#059669] hover:bg-[#047857] text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
                                >
                                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span>Message</span>
                                  {app.unreadCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-white text-[#059669] text-[10px] font-black flex items-center justify-center shrink-0">
                                      {app.unreadCount > 9 ? '9+' : app.unreadCount}
                                    </span>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="font-bold text-gray-700">No Job Selected</p>
              <p className="text-xs text-gray-400 mt-1">Select a job post from the left to view its applicants.</p>
            </div>
          )}
        </div>

      </div>

      {/* 4. SLIDE-IN RIGHT CHAT DRAWER */}
      {isDrawerOpen && activeConversation && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden font-sans">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeChatDrawer}
          />

          {/* Drawer Container */}
          <div 
            data-right-drawer="true"
            data-chat-drawer="true"
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] md:w-[540px] bg-white shadow-2xl z-[10000] flex flex-col h-full border-l border-gray-200 animate-in slide-in-from-right duration-300"
          >
            
            {/* Header Top Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const activeCand = activeConversation.candidate || {};
                  const activeCandAvatar = activeCand.avatar || activeCand.profilePhoto || activeCand.profilePicture || activeCand.photo || activeCand.personalDetails?.profilePhoto;
                  const activeCandKey = activeCand._id || activeCand.id || activeCand.email || activeConversation.appId;
                  if (activeCandAvatar && !avatarFailedMap[activeCandKey]) {
                    return (
                      <img 
                        src={activeCandAvatar} 
                        alt={activeCand.name || 'Candidate'} 
                        onError={() => setAvatarFailedMap(prev => ({ ...prev, [activeCandKey]: true }))}
                        className="w-11 h-11 rounded-full object-cover shrink-0 ring-1 ring-gray-200 shadow-none" 
                      />
                    );
                  }
                  return (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-none bg-slate-900">
                      {getInitials(activeCand.name)}
                    </div>
                  );
                })()}
                
                <div className="min-w-0">
                  {/* Job Title Line */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#047857] truncate">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{activeConversation.jobTitle}</span>
                  </div>

                  {/* Candidate Name & Status Pill Line */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                      {activeConversation.candidate?.name || 'Candidate'}
                    </h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgePill(activeConversation.status).style}`}>
                      • {activeConversation.status || 'New'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Icons Right */}
              <div className="flex items-center gap-1 shrink-0 relative">
                {/* ⓘ Info Button */}
                <div className="relative" ref={infoRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInfoOpen(prev => !prev);
                      setIsOptionsOpen(false);
                    }}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      isInfoOpen ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    title="Candidate info"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>

                  {/* Candidate Info Popover */}
                  {isInfoOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="font-bold text-gray-900 text-sm">Candidate info</span>
                        <span className="font-mono font-bold text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                          #{activeConversation.displayAppId}
                        </span>
                      </div>

                      <div className="py-3 space-y-2.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Email:</span>
                          <span className="text-gray-800 font-semibold truncate">{activeConversation.candidate?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Phone:</span>
                          <span className="text-gray-800 font-semibold">{formatPhoneWithCountryCode(activeConversation.candidate?.phone || activeConversation.candidate?.mobileNumber)}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Qualification:</span>
                          <span className="text-gray-800 font-semibold text-right">{getHighestQualification(activeConversation.candidate)}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Experience:</span>
                          <span className="text-gray-800 font-semibold">{getWorkExp(activeConversation.candidate)}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Current role:</span>
                          <span className="text-gray-800 font-semibold text-right">{getCurrentDesignation(activeConversation.candidate)}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Company:</span>
                          <span className="text-gray-800 font-semibold text-right">{getCurrentCompany(activeConversation.candidate)}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Applied on:</span>
                          <span className="text-gray-800 font-semibold">{formatDate(activeConversation.appliedDate)}</span>
                        </div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-gray-400 font-medium shrink-0">Source:</span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-100">
                            {activeConversation.sourceLink || 'Direct Apply'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsInfoOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full mt-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View full profile</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ⋯ Three Dots More Options Menu */}
                <div className="relative" ref={optionsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsOpen(prev => !prev);
                      setIsInfoOpen(false);
                    }}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      isOptionsOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    title="More options"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {isOptionsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOptionsOpen(false);
                          setIsBlockModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span>{activeConversation.isBlocked ? 'Unblock this chat' : 'Block this chat'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOptionsOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View full profile</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ✕ Close Button */}
                <button
                  type="button"
                  onClick={closeChatDrawer}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Action Row Below Header: ✓ Shortlist & ✕ Reject */}
            <div className="px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleUpdateStatus(activeConversation.appId, 'Shortlisted')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  activeConversation.status?.toLowerCase() === 'shortlisted'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#059669] hover:bg-[#047857] text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>{activeConversation.status?.toLowerCase() === 'shortlisted' ? 'Shortlisted ✓' : 'Shortlist'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateStatus(activeConversation.appId, 'Rejected')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  activeConversation.status?.toLowerCase() === 'rejected'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'border border-rose-300 text-rose-600 hover:bg-rose-50'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{activeConversation.status?.toLowerCase() === 'rejected' ? 'Rejected ✓' : 'Reject'}</span>
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#f8fafc]">
              
              {/* Applied On Badge */}
              <div className="flex justify-center">
                <span className="bg-white border border-gray-200 text-gray-500 text-[10px] font-bold tracking-wider px-3.5 py-1 rounded-full uppercase shadow-2xs">
                  APPLIED ON {formatDate(activeConversation.appliedDate).toUpperCase()}
                </span>
              </div>

              {/* Date Separator */}
              <div className="flex justify-center">
                <span className="bg-gray-200/80 text-gray-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {formatDate(activeConversation.appliedDate).split(',')[0]}
                </span>
              </div>

              {/* Messages Thread */}
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-xs font-medium">No messages yet. Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isEmployer = msg.senderModel === 'Employer';
                  return (
                    <div 
                      key={msg._id || idx}
                      className={`flex flex-col ${isEmployer ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                          isEmployer 
                            ? 'bg-[#059669] text-white rounded-tr-sm' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>

                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] text-gray-400 font-medium">
                          {formatTime(msg.createdAt)}
                        </span>
                        {isEmployer && (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Real-time Candidate Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <div className="bg-white border border-gray-200 rounded-2xl px-3.5 py-2 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    <span className="text-[11px] text-gray-500 ml-1">Candidate is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Suggestions Chips */}
            {!activeConversation.isBlocked && (
              <div className="px-5 py-2.5 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
                {quickReplies.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => {
                      setNewMessage(qr);
                      inputRef.current?.focus();
                    }}
                    className="bg-white border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 text-xs px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap shadow-2xs transition-colors cursor-pointer"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              {activeConversation.isBlocked ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between">
                  <span>🚫 This conversation is blocked.</span>
                  {activeConversation.blockedBy === 'Employer' && (
                    <button
                      type="button"
                      onClick={handleToggleBlock}
                      className="underline text-rose-800 hover:text-rose-900 cursor-pointer"
                    >
                      Unblock
                    </button>
                  )}
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="relative flex items-center"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:bg-white text-gray-800 placeholder-gray-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`absolute right-2 p-2 rounded-xl text-white transition-all shadow-sm ${
                      newMessage.trim() 
                        ? 'bg-[#059669] hover:bg-[#047857] active:scale-95 cursor-pointer' 
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 5. CANDIDATE FULL PROFILE FULLSCREEN */}
      <CandidateProfileFullScreen
        isOpen={isProfileModalOpen && Boolean(activeConversation)}
        onClose={() => setIsProfileModalOpen(false)}
        candidate={activeConversation?.candidate}
        application={activeConversation}
        updateCandidateStatus={handleUpdateStatus}
        employerProfile={employerProfile}
        backLabel="Messages"
      />

      {/* 6. BLOCK CONFIRMATION MODAL */}
      {isBlockModalOpen && activeConversation && createPortal(
        <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => !isBlockLoading && setIsBlockModalOpen(false)} 
          />
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full z-[10004] relative shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900">
              {activeConversation.isBlocked ? 'Unblock Conversation?' : 'Block Conversation?'}
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {activeConversation.isBlocked
                ? 'Candidate will be able to send messages again.'
                : 'Blocking this chat will prevent the candidate from sending further messages.'}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isBlockLoading}
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBlockLoading}
                onClick={handleToggleBlock}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer ${
                  activeConversation.isBlocked
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isBlockLoading ? 'Processing...' : (activeConversation.isBlocked ? 'Yes, Unblock' : 'Yes, Block')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default EmployerMessages;
