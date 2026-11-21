import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { socket } from '../../../utils/socket';
import { formatPhoneWithCountryCode } from '../../../data/countryCodes';
import CandidateProfileFullScreen from '../dashboard/CandidateProfileFullScreen';

const EmployerChatDrawer = ({
  isOpen,
  onClose,
  application,
  employerProfile = null,
  updateCandidateStatus = null,
  triggerNavRefresh = null,
  onMessageSent = null,
  onStatusUpdated = null
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedBy, setBlockedBy] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('New');

  // Popovers & Modals
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const infoRef = useRef(null);
  const optionsRef = useRef(null);
  const statusRef = useRef(null);

  const appId = application?.appId || application?._id || application?.id;
  const candidate = application?.candidate || {};

  // Sync state when application changes
  useEffect(() => {
    if (application) {
      setIsBlocked(Boolean(application.isBlocked));
      setBlockedBy(application.blockedBy || null);
      setCurrentStatus(application.status || 'New');
      setAvatarFailed(false);
    }
  }, [application]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (infoRef.current && !infoRef.current.contains(e.target)) {
        setIsInfoOpen(false);
      }
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setIsOptionsOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isProfileModalOpen && !isBlockModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProfileModalOpen, isBlockModalOpen, onClose]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Helpers
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
    if (!name) return 'C';
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

  const getStatusBadgePill = (status) => {
    const s = (status || 'New').toLowerCase();
    if (s === 'viewed' || s === 'under review') {
      return {
        label: 'VIEWED',
        style: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]'
      };
    }
    if (s === 'hired') {
      return {
        label: 'HIRED',
        style: 'border-green-300 bg-green-100 text-green-800 font-bold'
      };
    }
    if (s === 'shortlisted') {
      return {
        label: 'SHORTLISTED',
        style: 'border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]'
      };
    }
    if (s === 'rejected' || s === 'withdrawn') {
      return {
        label: 'REJECTED',
        style: 'border-[#fecdd3] bg-[#fff1f2] text-[#be123c]'
      };
    }
    return {
      label: 'NEW',
      style: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
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

  // Fetch messages from backend
  const fetchMessages = async (targetAppId) => {
    if (!targetAppId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/applications/${targetAppId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
        if (data.application) {
          setIsBlocked(Boolean(data.application.isBlocked));
          setBlockedBy(data.application.blockedBy || null);
          if (data.application.status) setCurrentStatus(data.application.status);
        }
        if (triggerNavRefresh) triggerNavRefresh();
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  // Join Socket.IO room & listen for events
  useEffect(() => {
    if (isOpen && appId) {
      fetchMessages(appId);
      socket.emit('join_chat', appId);

      const handleReconnect = () => {
        socket.emit('join_chat', appId);
      };
      socket.on('connect', handleReconnect);

      const handleReceiveMessage = (msg) => {
        const msgAppId = typeof msg.applicationId === 'object' ? (msg.applicationId._id || msg.applicationId.id) : msg.applicationId;
        if (String(msgAppId) === String(appId)) {
          setMessages(prev => {
            if (prev.some(m => String(m._id) === String(msg._id))) return prev;
            return [...prev, msg];
          });

          if (msg.senderModel === 'Employee') {
            fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/applications/${appId}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
            }).catch(() => {});
            if (triggerNavRefresh) triggerNavRefresh();
          }
        }
      };

      const handleMessagesMarkedRead = (data) => {
        if (String(data.applicationId) === String(appId) && data.readBy === 'Employee') {
          setMessages(prev => prev.map(m => m.senderModel === 'Employer' ? { ...m, isRead: true } : m));
        }
      };

      const handleUserTyping = (data) => {
        if (String(data.applicationId) === String(appId) && data.senderModel === 'Employee') {
          setIsTyping(true);
        }
      };

      const handleUserStopTyping = (data) => {
        if (String(data.applicationId) === String(appId) && data.senderModel === 'Employee') {
          setIsTyping(false);
        }
      };

      const handleBlockToggled = (data) => {
        if (String(data.applicationId) === String(appId)) {
          setIsBlocked(Boolean(data.isBlocked));
          setBlockedBy(data.blockedBy || null);
        }
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('messages_marked_read', handleMessagesMarkedRead);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stop_typing', handleUserStopTyping);
      socket.on('conversation_block_toggled', handleBlockToggled);

      return () => {
        socket.emit('leave_chat', appId);
        socket.off('connect', handleReconnect);
        socket.off('receive_message', handleReceiveMessage);
        socket.off('messages_marked_read', handleMessagesMarkedRead);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stop_typing', handleUserStopTyping);
        socket.off('conversation_block_toggled', handleBlockToggled);
        setIsTyping(false);
      };
    } else {
      setMessages([]);
      setIsTyping(false);
    }
  }, [isOpen, appId]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    if (appId && !isBlocked) {
      socket.emit('typing', {
        applicationId: appId,
        senderModel: 'Employer'
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          applicationId: appId,
          senderModel: 'Employer'
        });
      }, 1500);
    }
  };

  const sendMessage = async (textToSend) => {
    const text = (textToSend !== undefined ? textToSend : newMessage).trim();
    if (!text || !appId || isBlocked) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', {
      applicationId: appId,
      senderModel: 'Employer'
    });

    setNewMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/applications/${appId}`, {
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

        if (onMessageSent) {
          onMessageSent(data.data);
        }
        if (triggerNavRefresh) triggerNavRefresh();
      } else {
        alert('Failed to send message: ' + data.message);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Network error sending message.');
    }
  };

  const handleUpdateStatus = (newStatus) => {
    if (!appId) return;
    setCurrentStatus(newStatus);
    if (updateCandidateStatus) {
      updateCandidateStatus(appId, newStatus);
    }
    if (onStatusUpdated) {
      onStatusUpdated(appId, newStatus);
    }
  };

  const handleToggleBlock = async () => {
    if (!appId) return;
    setIsBlockLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employer/messages/applications/${appId}/toggle-block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsBlocked(Boolean(data.data.isBlocked));
        setBlockedBy(data.data.blockedBy || null);
        setIsBlockModalOpen(false);
        setIsOptionsOpen(false);
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error('Error toggling block:', err);
      alert('Failed to toggle block status.');
    } finally {
      setIsBlockLoading(false);
    }
  };

  if (!isOpen || !application) return null;

  const quickReplies = [
    'Please share your updated CV',
    'Are you available for a call?',
    'When can you join?'
  ];

  const candAvatar = candidate.avatar || candidate.profilePhoto || candidate.profilePicture || candidate.photo || candidate.personalDetails?.profilePhoto;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
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
            {candAvatar && !avatarFailed ? (
              <img 
                src={candAvatar} 
                alt={candidate.name || 'Candidate'} 
                onError={() => setAvatarFailed(true)}
                className="w-11 h-11 rounded-full object-cover shrink-0 ring-1 ring-gray-200 shadow-none" 
              />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-none bg-slate-900">
                {getInitials(candidate.name)}
              </div>
            )}
            
            <div className="min-w-0">
              {/* Job Title Line */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#047857] truncate">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{application.jobTitle || 'General Application'}</span>
              </div>

              {/* Candidate Name & Status Pill Line */}
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                  {candidate.name || 'Candidate'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(prev => !prev)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-85 transition-opacity ${getStatusBadgePill(currentStatus).style}`}
                  title="Change status"
                >
                  • {currentStatus}
                </button>
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
                      #{application.displayAppId || application.applicationNumber || '500101'}
                    </span>
                  </div>

                  <div className="py-3 space-y-2.5 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">Email:</span>
                      <span className="text-gray-800 font-semibold truncate">{candidate.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">Phone:</span>
                      <span className="text-gray-800 font-semibold">{formatPhoneWithCountryCode(candidate.phone || candidate.mobileNumber || candidate.mobile, candidate.countryCode)}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">Qualification:</span>
                      <span className="text-gray-800 font-semibold text-right">{getHighestQualification(candidate)}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">Experience:</span>
                      <span className="text-gray-800 font-semibold">{getWorkExp(candidate)}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">Current role:</span>
                      <span className="text-gray-800 font-semibold text-right">{getCurrentDesignation(candidate)}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">Company:</span>
                      <span className="text-gray-800 font-semibold text-right">{getCurrentCompany(candidate)}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">Applied on:</span>
                      <span className="text-gray-800 font-semibold">{formatDate(application.appliedDate || application.date || application.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">Source:</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-100">
                        {application.sourceLink || 'Direct Apply'}
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
                    <span>{isBlocked ? 'Unblock this chat' : 'Block this chat'}</span>
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
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              title="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Action Row Below Header: Status Dropdown */}
        <div className="px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            <div className="relative inline-block" ref={statusRef} data-status-dropdown="true">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wider flex items-center gap-2 shadow-2xs transition-all cursor-pointer ${getStatusBadgePill(currentStatus).style}`}
              >
                <span>{getStatusBadgePill(currentStatus).label}</span>
                <svg className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {['New', 'Viewed', 'Shortlisted', 'Hired', 'Rejected'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        handleUpdateStatus(opt);
                        setIsStatusDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{opt}</span>
                      {(currentStatus || 'New').toLowerCase() === opt.toLowerCase() && (
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#f8fafc]">
          
          {/* Applied On Badge */}
          <div className="flex justify-center">
            <span className="bg-white border border-gray-200 text-gray-500 text-[10px] font-bold tracking-wider px-3.5 py-1 rounded-full uppercase shadow-2xs">
              APPLIED ON {formatDate(application.appliedDate || application.date || application.createdAt).toUpperCase()}
            </span>
          </div>

          {/* Date Separator */}
          <div className="flex justify-center">
            <span className="bg-gray-200/80 text-gray-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              {formatDate(application.appliedDate || application.date || application.createdAt).split(',')[0]}
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
        {!isBlocked && (
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
          {isBlocked ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between">
              <span>🚫 This conversation is blocked.</span>
              {blockedBy === 'Employer' && (
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

      {/* CANDIDATE FULL PROFILE FULLSCREEN */}
      {isProfileModalOpen && (
        <CandidateProfileFullScreen
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          candidate={candidate}
          application={application}
          updateCandidateStatus={updateCandidateStatus}
          employerProfile={employerProfile}
          backLabel="Chat"
        />
      )}

      {/* BLOCK CONFIRMATION MODAL */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => !isBlockLoading && setIsBlockModalOpen(false)} 
          />
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full z-[10004] relative shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900">
              {isBlocked ? 'Unblock Conversation?' : 'Block Conversation?'}
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {isBlocked
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
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition cursor-pointer ${
                  isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isBlockLoading ? 'Processing...' : (isBlocked ? 'Unblock' : 'Block')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default EmployerChatDrawer;
