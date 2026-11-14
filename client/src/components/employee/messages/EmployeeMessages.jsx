import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SjLoggedInHeader from '../../sj-home/SjLoggedInHeader';
import SjGuestHeader from '../../sj-home/SjGuestHeader';
import { getEmployeeStoredValue } from '../../../utils/employeeStorage';
import { socket } from '../../../utils/socket';

function getCandidateProfile() {
  try {
    let profile = null;
    const raw = localStorage.getItem('userProfile');
    if (raw) {
      try {
        profile = JSON.parse(raw);
      } catch (_) {}
    }

    if (!profile) {
      const empRaw = localStorage.getItem('employeeUser');
      if (empRaw) {
        try {
          const empParsed = JSON.parse(empRaw);
          profile = empParsed?.profile || empParsed;
          if (profile && empParsed?.name && !profile.name) profile.name = empParsed.name;
          if (profile && empParsed?.email && !profile.email) profile.email = empParsed.email;
          if (profile && empParsed?.avatar && !profile.avatar) profile.avatar = empParsed.avatar;
        } catch (_) {}
      }
    }
    return profile;
  } catch (e) {
    return null;
  }
}

const EmployeeMessages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshNav, setRefreshNav] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [applicationsMap, setApplicationsMap] = useState({});
  const [allJobsList, setAllJobsList] = useState([]);

  // Profile and login state for header matching Homepage
  const [candidateProfile, setCandidateProfile] = useState(() => getCandidateProfile());
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(localStorage.getItem('employeeToken') || localStorage.getItem('token'))
  );
  const [homepageConfig, setHomepageConfig] = useState(null);
  const [savedJobsCount, setSavedJobsCount] = useState(() => getEmployeeStoredValue('savedJobs', []).length);

  // Header search state (navigates to /employee on search)
  const [navSearchKeyword, setNavSearchKeyword] = useState('');
  const [navSearchLocation, setNavSearchLocation] = useState('');
  const [navSearchExperience, setNavSearchExperience] = useState('All');
  const [navSearchPostingDate, setNavSearchPostingDate] = useState('Any time');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to top on initial page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-scroll messages list to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch homepage config (for brand logo)
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/homepage`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json?.data) {
          setHomepageConfig(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch candidate profile to ensure avatar is fresh
  useEffect(() => {
    const token = localStorage.getItem('employeeToken') || localStorage.getItem('token');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/employee/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data?.data) {
          setCandidateProfile(data.data);
          try {
            localStorage.setItem('userProfile', JSON.stringify(data.data));
          } catch (_) {}
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('token');
    localStorage.removeItem('employeeUser');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    navigate('/employee');
  };

  const handleHeaderSearch = (q, loc, exp, date) => {
    navigate('/employee', {
      state: {
        searchFilters: {
          keyword: q !== undefined ? q : navSearchKeyword,
          location: loc !== undefined ? loc : navSearchLocation,
          experience: exp !== undefined ? exp : navSearchExperience,
          postingDate: date !== undefined ? date : navSearchPostingDate,
        }
      }
    });
  };

  // Global socket listener for conversation updates
  useEffect(() => {
    const handleConversationUpdated = (data) => {
      setConversations(prev => {
        const exists = prev.find(c => c.applicationId === data.applicationId);
        const isCurrentChat = selectedChat?.applicationId === data.applicationId;

        if (exists) {
          return prev.map(c => 
            c.applicationId === data.applicationId 
              ? { 
                  ...c, 
                  lastMessage: data.lastMessage, 
                  lastMessageTime: data.lastMessageTime,
                  unreadCount: (data.senderModel === 'Employer' && !isCurrentChat) ? (c.unreadCount || 0) + 1 : (isCurrentChat ? 0 : c.unreadCount)
                } 
              : c
          ).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        } else {
          fetchConversations();
          return prev;
        }
      });
      setRefreshNav(prev => !prev);
    };

    const handleConversationBlockToggled = (data) => {
      setConversations(prev => prev.map(c => 
        c.applicationId === data.applicationId 
          ? { ...c, isBlocked: data.isBlocked, blockedBy: data.blockedBy, blockedAt: data.blockedAt }
          : c
      ));
      setSelectedChat(prev => {
        if (prev?.applicationId === data.applicationId) {
          return {
            ...prev,
            isBlocked: data.isBlocked,
            blockedBy: data.blockedBy,
            blockedAt: data.blockedAt
          };
        }
        return prev;
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('conversation_block_toggled', handleConversationBlockToggled);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('conversation_block_toggled', handleConversationBlockToggled);
    };
  }, [selectedChat]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('employeeToken');
      const [res, appsRes, jobsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/employee/messages/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs/my-applications`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${import.meta.env.VITE_API_URL}/api/employee/jobs`).catch(() => null)
      ]);

      const data = await res.json();
      if (data.success) {
        setConversations(data.data || []);
      }

      if (appsRes && appsRes.ok) {
        const appsData = await appsRes.json();
        if (appsData.success && Array.isArray(appsData.data)) {
          const map = {};
          appsData.data.forEach(app => {
            if (app._id) {
              map[app._id] = app.jobId;
            }
          });
          setApplicationsMap(map);
        }
      }

      if (jobsRes && jobsRes.ok) {
        const jobsData = await jobsRes.json();
        if (jobsData.success && Array.isArray(jobsData.data)) {
          setAllJobsList(jobsData.data);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages and join socket room when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      const appId = selectedChat.applicationId;
      fetchMessages(appId);

      socket.emit('join_chat', appId);

      const handleReceiveMessage = (msg) => {
        if (msg.applicationId === appId) {
          setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          if (msg.senderModel === 'Employer') {
            fetch(`${import.meta.env.VITE_API_URL}/api/employee/messages/applications/${appId}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` }
            }).catch(() => {});
            setConversations(prev => prev.map(c => 
              c.applicationId === appId ? { ...c, unreadCount: 0 } : c
            ));
            setRefreshNav(prev => !prev);
          }
        }
      };

      const handleMessagesMarkedRead = (data) => {
        if (data.applicationId === appId && data.readBy === 'Employer') {
          setMessages(prev => prev.map(m => m.senderModel === 'Employee' ? { ...m, isRead: true } : m));
        }
      };

      const handleUserTyping = (data) => {
        if (data.applicationId === appId && data.senderModel === 'Employer') {
          setIsTyping(true);
        }
      };

      const handleUserStopTyping = (data) => {
        if (data.applicationId === appId && data.senderModel === 'Employer') {
          setIsTyping(false);
        }
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('messages_marked_read', handleMessagesMarkedRead);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stop_typing', handleUserStopTyping);

      return () => {
        socket.emit('leave_chat', appId);
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
  }, [selectedChat?.applicationId]);

  const fetchMessages = async (applicationId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/messages/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
        if (data.application) {
          setSelectedChat(prev => ({
            ...prev,
            isBlocked: data.application.isBlocked,
            blockedBy: data.application.blockedBy,
            blockedAt: data.application.blockedAt,
            job: data.application.job || prev?.job,
            jobDetails: data.application.job?.details || prev?.jobDetails,
            salary: data.application.job?.salary || prev?.salary,
            jobId: data.application.job?._id || prev?.jobId
          }));
        }
        setConversations(prev => prev.map(c => 
          c.applicationId === applicationId ? { ...c, unreadCount: 0 } : c
        ));
        setRefreshNav(prev => !prev);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const openBlockModal = () => {
    if (!selectedChat) return;
    if (selectedChat.isBlocked && selectedChat.blockedBy === 'Employer') {
      return;
    }
    setIsBlockModalOpen(true);
  };

  const handleConfirmToggleBlock = async () => {
    if (!selectedChat) return;
    setIsBlockLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/messages/applications/${selectedChat.applicationId}/toggle-block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedChat(prev => ({
          ...prev,
          isBlocked: data.data.isBlocked,
          blockedBy: data.data.blockedBy,
          blockedAt: data.data.blockedAt
        }));
        setConversations(prev => prev.map(c => 
          c.applicationId === selectedChat.applicationId
            ? { ...c, isBlocked: data.data.isBlocked, blockedBy: data.data.blockedBy, blockedAt: data.data.blockedAt }
            : c
        ));
        setIsBlockModalOpen(false);
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

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    if (selectedChat && !selectedChat.isBlocked) {
      socket.emit('typing', {
        applicationId: selectedChat.applicationId,
        senderModel: 'Employee'
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          applicationId: selectedChat.applicationId,
          senderModel: 'Employee'
        });
      }, 1500);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || selectedChat.isBlocked) return;
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', {
      applicationId: selectedChat.applicationId,
      senderModel: 'Employee'
    });

    const msgContent = newMessage.trim();
    setNewMessage('');
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/messages/applications/${selectedChat.applicationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('employeeToken')}`
        },
        body: JSON.stringify({ content: msgContent })
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages(prev => {
          if (prev.some(m => m._id === data.data._id)) return prev;
          return [...prev, data.data];
        });
        
        setConversations(prev => prev.map(c => 
          c.applicationId === selectedChat.applicationId 
            ? { ...c, lastMessage: data.data.content, lastMessageTime: data.data.createdAt }
            : c
        ));
      } else {
        alert(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleQuickReply = (text) => {
    setNewMessage(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Helper date formatting
  const formatConversationTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday) {
      return 'Yesterday';
    }
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDateGroupLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const label = getDateGroupLabel(msg.createdAt);
    if (!acc.length || acc[acc.length - 1].label !== label) {
      acc.push({ label, messages: [msg] });
    } else {
      acc[acc.length - 1].messages.push(msg);
    }
    return acc;
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = !searchQuery.trim() || 
      c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = filterTab === 'all' || (filterTab === 'unread' && (c.unreadCount || 0) > 0);
    return matchesSearch && matchesTab;
  });

  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const QUICK_REPLIES = [
    "Hi, thank you for reaching out!",
    "I am available for an interview.",
    "Please let me know the next steps.",
    "Could you share more details about the role?"
  ];

  const getCompanyGradient = (name = '') => {
    const gradients = [
      'from-emerald-600 to-teal-700',
      'from-green-600 to-emerald-800',
      'from-teal-600 to-emerald-700',
      'from-emerald-700 to-green-800',
      'from-teal-700 to-cyan-800',
    ];
    const code = name.charCodeAt(0) || 0;
    return gradients[code % gradients.length];
  };

  const currentActiveJob = selectedChat ? (
    applicationsMap[selectedChat.applicationId] ||
    selectedChat.job ||
    allJobsList.find(j => {
      const chatJid = String(selectedChat.jobId?._id || selectedChat.jobId || '');
      const matchId = chatJid && (String(j._id) === chatJid || String(j.id) === chatJid);
      const matchTitleCompany = j.title?.trim().toLowerCase() === selectedChat.jobTitle?.trim().toLowerCase() && 
                                j.company?.trim().toLowerCase() === selectedChat.companyName?.trim().toLowerCase();
      return matchId || matchTitleCompany;
    }) ||
    selectedChat
  ) : null;

  const currentJobId = currentActiveJob?._id || currentActiveJob?.id || selectedChat?.jobId?._id || selectedChat?.jobId;

  const getJobTypeDisplay = (job, chat) => {
    if (job?.details?.employmentType) return job.details.employmentType;
    if (job?.employmentType) return job.employmentType;
    if (Array.isArray(job?.jobType) && job.jobType.length > 0) return job.jobType.join(', ');
    if (typeof job?.jobType === 'string' && job.jobType.trim()) return job.jobType;
    if (Array.isArray(chat?.jobType) && chat.jobType.length > 0) return chat.jobType.join(', ');
    if (typeof chat?.jobType === 'string' && chat.jobType.trim()) return chat.jobType;
    return 'Full-time';
  };

  const handleViewJob = () => {
    setIsJobDetailsOpen(false);
    const targetId = currentJobId ? String(currentJobId) : undefined;
    navigate('/employee', { 
      state: { 
        selectedJobId: targetId,
        jobTitle: selectedChat?.jobTitle,
        companyName: selectedChat?.companyName,
        openDetails: true,
        clearFilters: true
      } 
    });
  };

  const cleanHtmlText = (str = '') => {
    if (!str) return '';
    return str
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#F8FAFC] flex flex-col font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Modern Navbar matching Homepage */}
      {isLoggedIn ? (
        <SjLoggedInHeader
          logoConfig={homepageConfig?.logo}
          searchTerm={navSearchKeyword}
          onSearchTermChange={(val) => {
            setNavSearchKeyword(val);
            handleHeaderSearch(val, navSearchLocation, navSearchExperience, navSearchPostingDate);
          }}
          searchLocation={navSearchLocation}
          onSearchLocationChange={(val) => {
            setNavSearchLocation(val);
            handleHeaderSearch(navSearchKeyword, val, navSearchExperience, navSearchPostingDate);
          }}
          experience={navSearchExperience}
          onExperienceChange={(val) => {
            setNavSearchExperience(val);
            handleHeaderSearch(navSearchKeyword, navSearchLocation, val, navSearchPostingDate);
          }}
          postingDate={navSearchPostingDate}
          onPostingDateChange={(val) => {
            setNavSearchPostingDate(val);
            handleHeaderSearch(navSearchKeyword, navSearchLocation, navSearchExperience, val);
          }}
          jobs={allJobsList}
          userProfile={candidateProfile}
          savedCount={savedJobsCount}
          hasUnreadMessages={totalUnreadCount > 0}
          onNavigateSaved={() => navigate('/employee/myjobs?tab=saved')}
          onNavigateApplied={() => navigate('/employee/myjobs?tab=applied')}
          onNavigateMessages={() => {}}
          onNavigateProfile={() => navigate('/employee/profile')}
          onNavigateSecurity={() => navigate('/employee/profile?tab=security')}
          onSignOut={handleSignOut}
          onLogoClick={() => navigate('/employee')}
        />
      ) : (
        <SjGuestHeader
          logoConfig={homepageConfig?.logo}
          onOpenEmployeeLogin={() => navigate('/employee')}
          onOpenEmployerLogin={() => navigate('/employer')}
          onLogoClick={() => navigate('/employee')}
        />
      )}
      
      <div className="flex-1 min-h-0 w-full max-w-[1360px] mx-auto p-2 sm:p-4 md:p-6 flex overflow-hidden">
        {/* Unified Card Container (matches screenshot) */}
        <div className="w-full h-full bg-white rounded-3xl border border-slate-200/90 shadow-sm flex overflow-hidden">
          
          {/* Left Column: Messages List (visible on desktop or mobile when no chat is open) */}
          <div className={`w-full md:w-[320px] lg:w-[350px] border-r border-slate-100 flex flex-col h-full overflow-hidden shrink-0 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Header: Title, Pill Search, Tabs */}
            <div className="p-5 border-b border-slate-100 bg-white shrink-0">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Messages</h1>

              {/* Pill Search Input */}
              <div className="relative mb-3.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by company or job title..."
                  className="w-full px-4 py-2.5 bg-white text-xs text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-300 focus:border-slate-800 focus:outline-none transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                    filterTab === 'all' 
                      ? 'bg-[#0b1320] text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  All Messages ({conversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterTab === 'unread' 
                      ? 'bg-[#0b1320] text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Unread</span>
                  {totalUnreadCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${filterTab === 'unread' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 bg-white">
              {isLoading ? (
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-medium">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                  <p className="font-bold text-slate-700 text-sm">
                    {searchQuery || filterTab !== 'all' ? 'No matching conversations' : 'No messages yet'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-[200px]">
                    {searchQuery || filterTab !== 'all'
                      ? 'Try adjusting your search terms.'
                      : 'When recruiters message you, their chats will show up here.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map(chat => {
                  const isSelected = selectedChat?.applicationId === chat.applicationId;
                  const companyInitial = chat.companyName?.trim()?.charAt(0)?.toUpperCase() || 'C';

                  return (
                    <div 
                      key={chat.applicationId} 
                      className={`p-3 rounded-2xl cursor-pointer transition-all flex gap-3 items-start group ${
                        isSelected 
                          ? 'bg-[#ecfdf5] border border-emerald-200/60 shadow-2xs' 
                          : 'bg-white hover:bg-slate-50 border border-transparent'
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      {/* Dark Squircle Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-[#0b1320] text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {companyInitial}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Company Name + Time */}
                        <div className="flex justify-between items-baseline gap-2 mb-1">
                          <h3 className="font-bold text-sm text-slate-900 truncate">
                            {chat.companyName}
                          </h3>
                          <span className="text-[11px] font-semibold text-emerald-600 shrink-0">
                            {formatConversationTime(chat.lastMessageTime)}
                          </span>
                        </div>

                        {/* Row 2: Job Title Pill */}
                        <div className="mb-1">
                          <span className="inline-block bg-white border border-slate-200 text-[11px] font-medium text-slate-700 px-2.5 py-0.5 rounded-full truncate max-w-[170px] shadow-2xs">
                            {chat.jobTitle || 'Role'}
                          </span>
                        </div>

                        {/* Row 3: Last Message */}
                        <p className="text-xs text-slate-500 truncate leading-tight">
                          {chat.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className={`flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-[#f8fafc] ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
            {selectedChat ? (
              <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
                
                {/* Chat Top Header */}
                <div className="px-5 md:px-7 py-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                  <div className="flex gap-3 items-center min-w-0">
                    {/* Back arrow on mobile to return to inbox */}
                    <button
                      type="button"
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors shrink-0 -ml-1 active:scale-95"
                      title="Back to messages"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Dark Squircle Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-[#0b1320] text-white font-bold flex items-center justify-center text-base shrink-0 shadow-2xs">
                      {selectedChat.companyName?.trim()?.charAt(0)?.toUpperCase() || 'C'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-bold text-slate-900 text-base leading-none">
                          {selectedChat.companyName}
                        </h2>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <span>•</span>
                          <span>Recruiter</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-1 font-medium">
                        <span>{selectedChat.jobTitle}</span>
                        {selectedChat.location && (
                          <span> • {selectedChat.location}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Top Action Buttons (Pill outlines) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      type="button"
                      onClick={handleViewJob}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-full transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      title="View Job"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>View Job</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setIsJobDetailsOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-full transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      title="Job Details"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth="2" />
                        <line x1="12" y1="8" x2="12" y2="8.01" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="12" y1="11" x2="12" y2="16" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span>Job Details</span>
                    </button>

                    {selectedChat.isBlocked ? (
                      selectedChat.blockedBy === 'Employee' && (
                        <button 
                          onClick={openBlockModal}
                          className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-full transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          Unblock
                        </button>
                      )
                    ) : (
                      <button 
                        onClick={openBlockModal}
                        className="px-3.5 py-1.5 text-xs font-bold text-red-600 bg-white hover:bg-red-50 border border-red-300 rounded-full transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                        title="Block this chat"
                      >
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeWidth="2" />
                        </svg>
                        <span>Block</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-[#f8fafc] flex flex-col gap-4">
                  {groupedMessages.length > 0 ? (
                    groupedMessages.map((group, groupIdx) => (
                      <React.Fragment key={groupIdx}>
                        {/* Centered Date Badge (e.g. "Today") */}
                        <div className="flex items-center justify-center my-1.5">
                          <span className="bg-white border border-slate-200/90 text-slate-600 text-[11px] font-semibold px-3 py-0.5 rounded-full shadow-2xs">
                            {group.label}
                          </span>
                        </div>

                        {/* Messages */}
                        {group.messages.map(msg => {
                          const isMe = msg.senderModel === 'Employee';

                          return (
                            <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              {isMe ? (
                                /* Outgoing Bubble (Candidate: Dark Navy/Black) */
                                <div className="bg-[#0b1320] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-2xs max-w-sm sm:max-w-md">
                                  <div className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                  </div>
                                  <div className="text-[10px] text-slate-300 mt-1 flex items-center justify-end gap-1">
                                    <span>{formatMessageTime(msg.createdAt)}</span>
                                    <span className={msg.isRead ? 'text-emerald-400 font-bold' : 'text-slate-400'}>✓</span>
                                  </div>
                                </div>
                              ) : (
                                /* Incoming Bubble (Recruiter: White with border) */
                                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-2xs max-w-sm sm:max-w-md">
                                  <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    {formatMessageTime(msg.createdAt)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-2xs border border-slate-200 flex items-center justify-center text-2xl">
                        💬
                      </div>
                      <h3 className="text-slate-900 font-bold text-base">Start the Conversation</h3>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        Send a message to <strong>{selectedChat.companyName}</strong> to introduce yourself or ask questions.
                      </p>
                    </div>
                  )}

                  {/* Typing Indicator */}
                  {isTyping && !selectedChat.isBlocked && (
                    <div className="flex items-start gap-2">
                      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-2xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        <span className="text-xs text-slate-400 font-medium ml-1">{selectedChat.companyName} is typing...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggestions / Quick Replies */}
                {!selectedChat.isBlocked && (
                  <div className="px-5 md:px-7 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                    <span className="text-xs text-slate-400 font-semibold shrink-0">Suggestions:</span>
                    {QUICK_REPLIES.map((reply, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickReply(reply)}
                        className="px-3.5 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded-full text-xs font-medium border border-slate-300 transition-all shrink-0 active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Input Composer */}
                {!selectedChat.isBlocked ? (
                  <div className="p-4 md:px-7 bg-white border-t border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                      <input
                        ref={textareaRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder={`Write a message to ${selectedChat.companyName}... (Press Enter to send)`}
                        className="flex-1 bg-white border border-slate-300 rounded-full px-5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 transition-all shadow-2xs"
                      />

                      <button
                        type="button"
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm ${
                          !newMessage.trim()
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#0b1320] text-white hover:bg-black active:scale-95'
                        }`}
                        title="Send message"
                      >
                        <svg className="w-5 h-5 transform rotate-45 -translate-y-0.5 -translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border-t border-red-100 shrink-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-bold text-sm">Conversation Blocked</span>
                    </div>
                    {selectedChat.blockedBy === 'Employee' && (
                      <button
                        onClick={openBlockModal}
                        className="px-4 py-1.5 bg-white text-red-700 border border-red-300 rounded-full text-xs font-bold shadow-2xs cursor-pointer"
                      >
                        Unblock
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Desktop Empty State */
              <div className="flex-1 bg-white hidden md:flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center text-3xl mb-4 border border-slate-200/80 shadow-2xs">
                  💬
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Messages</h2>
                <p className="text-slate-500 text-xs font-medium max-w-xs">
                  Select a conversation from the left to read messages, reply, or view job details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          CONFIRMATION MODAL FOR BLOCK / UNBLOCK
         ======================================================== */}
      {isBlockModalOpen && selectedChat && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => !isBlockLoading && setIsBlockModalOpen(false)}
          ></div>

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 z-10 border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-150">
            {selectedChat.isBlocked ? (
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-4 border border-emerald-100 shadow-xs">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl mb-4 border border-red-100 shadow-xs">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
              </div>
            )}

            <h3 className="text-lg font-bold text-slate-900 mb-1.5">
              {selectedChat.isBlocked ? 'Unblock this chat?' : 'Block this chat?'}
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              {selectedChat.isBlocked
                ? `You will resume communication with ${selectedChat.companyName} for this job application.`
                : `You will stop receiving messages from ${selectedChat.companyName} regarding this role until unblocked.`}
            </p>

            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                disabled={isBlockLoading}
                onClick={() => setIsBlockModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBlockLoading}
                onClick={handleConfirmToggleBlock}
                className={`flex-1 py-2.5 px-4 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 ${
                  selectedChat.isBlocked 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } ${isBlockLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isBlockLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Please wait...
                  </>
                ) : (
                  selectedChat.isBlocked ? 'Unblock' : 'Block Chat'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL / DRAWER FOR FULL JOB DETAILS
         ======================================================== */}
      {isJobDetailsOpen && selectedChat && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsJobDetailsOpen(false)}
          ></div>
          
          <div className="relative bg-white w-full sm:max-w-lg max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl z-[210] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Job Details</h2>
              </div>
              <button 
                onClick={() => setIsJobDetailsOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
              {/* Job Summary Card */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getCompanyGradient(selectedChat.companyName)} flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0`}>
                    {selectedChat.companyName?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {selectedChat.jobTitle || currentActiveJob?.title || 'Job Title'}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-700 mt-0.5">
                      {selectedChat.companyName || currentActiveJob?.company}
                    </p>
                  </div>
                </div>

                {/* Basic Details 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  {/* Location */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Location</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                      <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      {currentActiveJob?.location || selectedChat.location || 'Abu Dhabi'}
                    </span>
                  </div>

                  {/* Salary */}
                  <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/70">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">Salary</span>
                    <span className="font-bold text-emerald-900 truncate block">
                      {currentActiveJob?.salary || currentActiveJob?.details?.salary || selectedChat.salary || 'Competitive'}
                    </span>
                  </div>

                  {/* Job Type */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Job Type</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {getJobTypeDisplay(currentActiveJob, selectedChat)}
                    </span>
                  </div>

                  {/* Experience */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Experience</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {currentActiveJob?.details?.experience || 'Any experience'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role Overview */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">About The Role</h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {cleanHtmlText(currentActiveJob?.details?.aboutRole || currentActiveJob?.description) || `You have applied for the ${selectedChat.jobTitle} position at ${selectedChat.companyName}. You can discuss details, schedule interviews, or ask questions directly with the recruiter.`}
                </p>
              </div>

              {/* Skills Required if available */}
              {(currentActiveJob?.details?.skillsRequired || currentActiveJob?.skills) && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Skills & Requirements</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cleanHtmlText(currentActiveJob?.details?.skillsRequired || currentActiveJob?.skills)}
                  </p>
                </div>
              )}

              {/* Recruiter channel banner */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                  <h4 className="font-bold text-emerald-900 text-xs">Direct Recruiter Conversation</h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  You are chatting directly with the recruitment team at <strong>{selectedChat.companyName}</strong>.
                </p>
              </div>
            </div>
            
            {/* Modal Footer Buttons */}
            <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white shrink-0 flex items-center gap-3">
              <button 
                type="button"
                onClick={handleViewJob} 
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl text-sm transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>View Job</span>
              </button>

              <button 
                type="button"
                onClick={() => setIsJobDetailsOpen(false)} 
                className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 rounded-xl text-sm transition-colors flex items-center justify-center text-center cursor-pointer active:scale-95"
              >
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMessages;
