import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { socket } from '../../../utils/socket';
import { formatPhoneWithCountryCode } from '../../../data/countryCodes';
import CandidateProfileFullScreen from '../dashboard/CandidateProfileFullScreen';

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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedJobFilter, setSelectedJobFilter] = useState('All jobs');
  const [candidateColFilter, setCandidateColFilter] = useState('');
  const [selectedChatFilter, setSelectedChatFilter] = useState('All');

  // Popovers & Modals
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [activeStatusDropdownAppId, setActiveStatusDropdownAppId] = useState(null);

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
    if (!cand) return 'N/A';
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
    return 'Quality Analyst';
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
    return cand.company || 'Infosys Limited';
  };

  const getHighestQualification = (cand) => {
    if (!cand) return 'Bachelor of Commerce (B.Com)';
    const quals = cand.qualifications || cand.education || [];
    if (!Array.isArray(quals) || quals.length === 0) return 'Bachelor of Commerce (B.Com)';
    const primary = quals.find(q => q && (q.isPrimary === true || q.isPrimary === 'true' || q.isPrimary === 1)) || quals[0];
    return primary?.course || primary?.educationType || primary?.degree || primary?.university || 'Bachelor of Commerce (B.Com)';
  };

  const getInitials = (name = '') => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarBg = (name = '') => {
    const colors = [
      'bg-purple-600',
      'bg-slate-900',
      'bg-emerald-600',
      'bg-blue-600',
      'bg-indigo-600',
      'bg-teal-600',
      'bg-rose-600',
      'bg-amber-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
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
      // Sort with conversations with recent messages or unreads first
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      return new Date(b.lastMessageTime || b.createdAt || 0) - new Date(a.lastMessageTime || a.createdAt || 0);
    });
  }, [candidates, backendConversations, jobs]);

  // Unique jobs for filter dropdown
  const uniqueJobs = useMemo(() => {
    const list = [
      ...(jobs || []).map(j => j.title || j.jobTitle),
      ...allConversations.map(a => a.jobTitle)
    ].filter(Boolean);
    return ['All jobs', ...new Set(list)];
  }, [jobs, allConversations]);

  // Counts for top status pills
  const statusCounts = useMemo(() => {
    const counts = {
      All: allConversations.length,
      New: 0,
      Viewed: 0,
      Shortlisted: 0,
      Rejected: 0
    };

    allConversations.forEach(item => {
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
  }, [allConversations]);

  // Filtered conversations list
  const filteredConversations = useMemo(() => {
    return allConversations.filter(item => {
      // 1. Status filter
      if (selectedStatusFilter !== 'All') {
        const s = (item.status || '').toLowerCase();
        if (selectedStatusFilter === 'New' && s !== 'new' && s !== 'applied') return false;
        if (selectedStatusFilter === 'Viewed' && s !== 'viewed' && s !== 'under review') return false;
        if (selectedStatusFilter === 'Shortlisted' && !['shortlisted', 'interview scheduled', 'technical round', 'hr round', 'offer sent', 'hired'].includes(s)) return false;
        if (selectedStatusFilter === 'Rejected' && s !== 'rejected' && s !== 'withdrawn') return false;
      }

      // 2. Job dropdown filter
      if (selectedJobFilter !== 'All jobs' && selectedJobFilter !== 'All') {
        if ((item.jobTitle || '').toLowerCase() !== selectedJobFilter.toLowerCase()) return false;
      }

      // 3. Candidate dedicated column filter
      if (candidateColFilter.trim()) {
        const cq = candidateColFilter.toLowerCase().trim();
        const candName = item.candidate?.name?.toLowerCase() || '';
        const candEmail = item.candidate?.email?.toLowerCase() || '';
        if (!candName.includes(cq) && !candEmail.includes(cq)) return false;
      }

      // 4. Chat filter (All / Unread)
      if (selectedChatFilter === 'Unread') {
        if (!item.unreadCount || item.unreadCount <= 0) return false;
      }

      // 5. Global Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const candName = item.candidate?.name?.toLowerCase() || '';
        const candEmail = item.candidate?.email?.toLowerCase() || '';
        const job = item.jobTitle?.toLowerCase() || '';
        const appId = String(item.displayAppId);
        if (!candName.includes(q) && !candEmail.includes(q) && !job.includes(q) && !appId.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allConversations, selectedStatusFilter, selectedJobFilter, candidateColFilter, selectedChatFilter, searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    (selectedJobFilter !== 'All jobs' && selectedJobFilter !== 'All') ||
    selectedStatusFilter !== 'All' ||
    candidateColFilter.trim() ||
    selectedChatFilter !== 'All'
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedJobFilter('All jobs');
    setSelectedStatusFilter('All');
    setCandidateColFilter('');
    setSelectedChatFilter('All');
  };

  // Handle route state initial selection
  useEffect(() => {
    if (initialApplicationData || initialEmployeeData) {
      const targetAppId = initialApplicationData?.appId || initialApplicationData?.id;
      const targetEmail = (initialEmployeeData?.email || '').toLowerCase();

      const matched = allConversations.find(a => 
        (targetAppId && a.appId === targetAppId) ||
        (targetEmail && a.candidate?.email?.toLowerCase() === targetEmail)
      );

      if (matched) {
        setSelectedAppId(matched.appId);
        setIsDrawerOpen(true);
      }
    }
  }, [initialApplicationData, initialEmployeeData, allConversations]);

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

    // Immediately mark as read locally so unread highlight resets to normal instantly!
    setBackendConversations(prev => prev.map(c => 
      String(c.applicationId || c.id || c._id) === String(app.appId) ? { ...c, unreadCount: 0 } : c
    ));
    if (triggerNavRefresh) triggerNavRefresh();

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
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <span className="bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] px-3 py-1 rounded-full text-xs font-bold shrink-0">
              {filteredConversations.length} of {allConversations.length} conversations
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Chat with candidates about their applications.
          </p>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedStatusFilter === 'All'
                ? 'bg-[#0f172a] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All: {statusCounts.All}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('New')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              selectedStatusFilter === 'New'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe] hover:bg-blue-100'
            }`}
          >
            New: {statusCounts.New}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Viewed')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              selectedStatusFilter === 'Viewed'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-[#fffbeb] text-[#d97706] border-[#fde68a] hover:bg-amber-100'
            }`}
          >
            Viewed: {statusCounts.Viewed}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Shortlisted')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              selectedStatusFilter === 'Shortlisted'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0] hover:bg-emerald-100'
            }`}
          >
            Shortlisted: {statusCounts.Shortlisted}
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Rejected')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
              selectedStatusFilter === 'Rejected'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-[#fff1f2] text-[#e11d48] border-[#fecdd3] hover:bg-rose-100'
            }`}
          >
            Rejected: {statusCounts.Rejected}
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER ROW */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by candidate, email or job"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] focus:bg-white text-gray-800 placeholder-gray-400 transition"
          />
        </div>

        {/* Job Filter Dropdown */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <div className="relative inline-block w-full md:w-64">
            <select
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 px-4 py-2 pr-9 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#059669] cursor-pointer shadow-2xs"
            >
              {uniqueJobs.map(job => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONVERSATIONS TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Row 1: Column Headers */}
              <tr className="bg-[#f8fafc] border-b border-gray-100 text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                <th className="py-3 px-6 font-semibold min-w-[220px]">JOB TITLE</th>
                <th className="py-3 px-6 font-semibold min-w-[200px]">CANDIDATE</th>
                <th className="py-3 px-6 font-semibold min-w-[150px]">CANDIDATE STATUS</th>
                <th className="py-3 px-6 font-semibold min-w-[260px]">CHAT</th>
              </tr>

              {/* Row 2: In-Column Dedicated Filters for All Columns */}
              <tr className="bg-gray-50/90 border-b border-gray-200">
                {/* Column 1: Job Filter */}
                <th className="py-2 px-6">
                  <div className="relative">
                    <select
                      value={selectedJobFilter}
                      onChange={(e) => setSelectedJobFilter(e.target.value)}
                      className="w-full h-8 px-2.5 pr-7 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer appearance-none"
                    >
                      <option value="All jobs">All jobs</option>
                      {uniqueJobs.filter(j => j !== 'All jobs').map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </th>

                {/* Column 2: Candidate Name / Email Filter */}
                <th className="py-2 px-6">
                  <input
                    type="text"
                    value={candidateColFilter}
                    onChange={(e) => setCandidateColFilter(e.target.value)}
                    placeholder="Filter candidate / email..."
                    className="w-full h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:border-emerald-500 placeholder-gray-400 shadow-2xs"
                  />
                </th>

                {/* Column 3: Status Filter */}
                <th className="py-2 px-6">
                  <div className="relative">
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="w-full h-8 px-2.5 pr-7 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer appearance-none"
                    >
                      <option value="All">All Status</option>
                      <option value="New">New</option>
                      <option value="Viewed">Viewed</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </th>

                {/* Column 4: Chat Filter & Reset */}
                <th className="py-2 px-6">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value={selectedChatFilter}
                        onChange={(e) => setSelectedChatFilter(e.target.value)}
                        className="w-full h-8 px-2.5 pr-7 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer appearance-none"
                      >
                        <option value="All">All Chats</option>
                        <option value="Unread">Unread Only</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="h-8 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="Reset all filters"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredConversations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="font-semibold text-gray-500">No conversations found</p>
                      <p className="text-xs text-gray-400">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                  </tr>
                ) : (
                  filteredConversations.map((app) => {
                    const cand = app.candidate || {};
                    const candAvatar = cand.avatar || cand.profilePhoto || cand.profilePicture || cand.photo;
                    const avatarBg = cand.bg || getAvatarBg(cand.name || '');
                    const statusPill = getStatusBadgePill(app.status);
                    const isUnread = Boolean(app.unreadCount && app.unreadCount > 0);

                    return (
                      <tr 
                        key={app.appId} 
                        className={`transition-all duration-200 group cursor-pointer border-l-4 ${
                          isUnread
                            ? 'bg-[#f0f9ff] hover:bg-[#e0f2fe] border-l-[#0284c7] shadow-2xs'
                            : 'bg-white hover:bg-gray-50/70 border-l-transparent'
                        }`}
                        onClick={() => openChatDrawer(app)}
                      >
                        {/* 1. JOB TITLE */}
                        <td className="py-4 px-6 align-middle">
                          <div className="flex flex-col">
                            <span className={`leading-tight transition-colors ${
                              isUnread 
                                ? 'font-black text-gray-950 group-hover:text-[#0284c7]' 
                                : 'font-bold text-gray-800 group-hover:text-[#059669]'
                            }`}>
                              {app.jobTitle}
                            </span>
                            <span className={`text-xs mt-1 font-medium ${isUnread ? 'text-gray-600 font-semibold' : 'text-gray-400'}`}>
                              {app.jobStatus} • {app.openings} opening{app.openings > 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>

                        {/* 2. CANDIDATE */}
                        <td className="py-4 px-6 align-middle">
                          <div className="flex items-center gap-3">
                            {candAvatar ? (
                              <div className="relative shrink-0">
                                <img 
                                  src={candAvatar} 
                                  alt={cand.name} 
                                  className={`w-10 h-10 rounded-full object-cover shrink-0 border ${
                                    isUnread ? 'border-[#0284c7] ring-2 ring-[#0284c7]/20' : 'border-gray-100'
                                  }`} 
                                />
                                {isUnread && (
                                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#0284c7] border-2 border-white rounded-full"></span>
                                )}
                              </div>
                            ) : (
                              <div className="relative shrink-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs ${
                                  isUnread ? 'bg-[#0284c7] ring-2 ring-[#0284c7]/20' : avatarBg
                                }`}>
                                  {getInitials(cand.name)}
                                </div>
                                {isUnread && (
                                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#0284c7] border-2 border-white rounded-full"></span>
                                )}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`leading-tight truncate ${
                                  isUnread ? 'font-black text-gray-950 text-[14.5px]' : 'font-bold text-gray-900'
                                }`}>
                                  {cand.name || 'Candidate'}
                                </span>
                                {isUnread && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0284c7] text-white shadow-xs tracking-wider uppercase shrink-0">
                                    New
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs truncate mt-0.5 ${
                                isUnread ? 'text-gray-700 font-semibold' : 'text-gray-500 font-normal'
                              }`}>
                                {cand.email || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. CANDIDATE STATUS */}
                        <td className="py-4 px-6 align-middle" onClick={(e) => e.stopPropagation()}>
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

                        {/* 4. CHAT */}
                        <td className="py-4 px-6 align-middle">
                          <div className="flex items-center justify-between gap-4">
                            <span className={`text-xs truncate max-w-[240px] md:max-w-[280px] ${
                              isUnread ? 'font-bold text-gray-950' : 'text-gray-500 font-normal'
                            }`}>
                              {app.lastMessage || 'Hi, I have applied for this role...'}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openChatDrawer(app);
                              }}
                              className={`${
                                isUnread
                                  ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white ring-2 ring-[#0284c7]/30 shadow-sm'
                                  : 'bg-[#059669] hover:bg-[#047857] text-white'
                              } px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer`}
                            >
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>Message</span>
                              {isUnread && (
                                <span className="min-w-4 h-4 px-1 rounded-full bg-white text-[#0284c7] text-[10px] font-black flex items-center justify-center shrink-0">
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
                {activeConversation.candidate?.avatar || activeConversation.candidate?.profilePhoto ? (
                  <img 
                    src={activeConversation.candidate.avatar || activeConversation.candidate.profilePhoto} 
                    alt={activeConversation.candidate.name} 
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-100" 
                  />
                ) : (
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-2xs ${activeConversation.candidate?.bg || getAvatarBg(activeConversation.candidate?.name || '')}`}>
                    {getInitials(activeConversation.candidate?.name)}
                  </div>
                )}
                
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

                  {/* Candidate Info Popover (Image 3) */}
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

                {/* ⋯ Three Dots More Options Menu (Image 4) */}
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
