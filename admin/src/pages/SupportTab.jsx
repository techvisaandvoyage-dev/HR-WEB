import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  User,
  Mail,
  Phone,
  Check,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Lock,
  Unlock,
  Send,
  Copy,
  Sparkles,
  ArrowRight,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import OtpLockedUsers from './support/OtpLockedUsers';
import BlockedAccounts from './support/BlockedAccounts';
import { socket } from '../utils/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SupportTab() {
  const [activeSubTab, setActiveSubTab] = useState('requests'); // 'requests' | 'otp-locks' | 'problems' | 'quick-replies'

  // Metric counts
  const [counts, setCounts] = useState({ total: 0, pending: 0, resolved: 0 });

  // OTP Locked Users active cache for quick badges & actions
  const [activeLockedEmails, setActiveLockedEmails] = useState([]);
  const [activeLocks, setActiveLocks] = useState([]); // Array of { email, role }
  const [lockedCount, setLockedCount] = useState(0);
  const [blockedAccountCount, setBlockedAccountCount] = useState(0);
  const [unlockToast, setUnlockToast] = useState(null);

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'resolved'
  const [filterUserType, setFilterUserType] = useState('all'); // 'all' | 'guest' | 'employee' | 'employer' | 'consultant'
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Row action loading states (map of requestId -> boolean)
  const [actionLoading, setActionLoading] = useState({});

  // Problems state
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemsError, setProblemsError] = useState('');
  const [problemPrimaryScope, setProblemPrimaryScope] = useState('without_login'); // 'without_login' | 'after_login'
  const [postLoginRoleFilter, setPostLoginRoleFilter] = useState('employee'); // 'employee' | 'employer' | 'consultant' | 'universal' | 'all'
  const [problemStatusFilter, setProblemStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [problemSearch, setProblemSearch] = useState('');
  const [isSeedingGuest, setIsSeedingGuest] = useState(false);

  // Problem modal state
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [problemFormTitle, setProblemFormTitle] = useState('');
  const [problemFormRole, setProblemFormRole] = useState('all');
  const [problemFormOrder, setProblemFormOrder] = useState(0);
  const [problemFormActive, setProblemFormActive] = useState(true);
  const [problemFormError, setProblemFormError] = useState('');
  const [isSavingProblem, setIsSavingProblem] = useState(false);

  // Delete problem confirmation
  const [problemToDelete, setProblemToDelete] = useState(null);

  // Quick Replies state (Send a quick update to support)
  const [quickReplies, setQuickReplies] = useState([]);
  const [loadingQuickReplies, setLoadingQuickReplies] = useState(false);
  const [quickRepliesError, setQuickRepliesError] = useState('');
  const [quickReplySearch, setQuickReplySearch] = useState('');

  // Quick Reply modal state
  const [isQuickReplyModalOpen, setIsQuickReplyModalOpen] = useState(false);
  const [editingQuickReply, setEditingQuickReply] = useState(null);
  const [quickReplyFormTitle, setQuickReplyFormTitle] = useState('');
  const [quickReplyFormOrder, setQuickReplyFormOrder] = useState(0);
  const [quickReplyFormActive, setQuickReplyFormActive] = useState(true);
  const [quickReplyFormError, setQuickReplyFormError] = useState('');
  const [isSavingQuickReply, setIsSavingQuickReply] = useState(false);

  // Delete quick reply confirmation
  const [quickReplyToDelete, setQuickReplyToDelete] = useState(null);

  // Reply Modal State
  const [replyRequest, setReplyRequest] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyError, setReplyError] = useState('');

  const handleOpenReplyModal = (reqItem) => {
    setReplyRequest(reqItem);
    setReplyText('');
    setReplyError('');
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !replyRequest) return;
    setIsSendingReply(true);
    setReplyError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/support/requests/${replyRequest._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedMessages = data.allMessages || [...(replyRequest.messages || []), data.data];
        setReplyRequest((prev) => ({ ...prev, messages: updatedMessages }));
        setRequests((prev) =>
          prev.map((r) => (r._id === replyRequest._id ? { ...r, messages: updatedMessages, hasUnreadAdminReply: true } : r))
        );
        setReplyText('');
      } else {
        setReplyError(data.message || 'Failed to send reply');
      }
    } catch (err) {
      setReplyError('Network error sending reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch active locked emails from OTP lock system for instant badge rendering
  const fetchActiveLockedEmails = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/otp-locks?limit=100`, {
        headers: {
          'x-admin-auth': 'true',
        },
      });
      const json = await res.json();
      if (json.success) {
        setActiveLockedEmails(json.activeLockedEmails || []);
        setActiveLocks(
          json.activeLocks ||
          (json.data || []).map((d) => ({
            email: (d.email || '').toLowerCase().trim(),
            role: (d.role || '').toLowerCase().trim(),
          }))
        );
        setLockedCount(json.counts?.totalLocked || 0);
      }
    } catch (_) {}
  }, []);

  const handleLocksUpdated = useCallback((emails, locks) => {
    setActiveLockedEmails(emails || []);
    if (locks) setActiveLocks(locks);
    setLockedCount((emails || []).length);
  }, []);

  // Determine if a specific support request's user is locked for THAT specific role
  const isRequestLocked = useCallback((reqItem) => {
    if (!reqItem || reqItem.status !== 'pending' || !reqItem.email) return false;
    const email = reqItem.email.toLowerCase().trim();
    const userType = (reqItem.userType || 'guest').toLowerCase();

    // 1. Employee / Candidate ticket: only locked if role is employee
    if (userType === 'employee' || userType === 'candidate') {
      return activeLocks.some((l) => l.email === email && (l.role === 'employee' || l.role === 'all'));
    }

    // 2. Employer ticket: only locked if role is employer
    if (userType === 'employer') {
      return activeLocks.some((l) => l.email === email && (l.role === 'employer' || l.role === 'all'));
    }

    // 3. Consultant ticket: only locked if role is consultant
    if (userType === 'consultant') {
      return activeLocks.some((l) => l.email === email && (l.role === 'consultant' || l.role === 'all'));
    }

    // 4. Guest ticket: match problem category if defined
    const problemRole = (reqItem.problemId?.role || '').toLowerCase();
    if (problemRole === 'employer') {
      return activeLocks.some((l) => l.email === email && (l.role === 'employer' || l.role === 'all'));
    }
    if (problemRole === 'consultant') {
      return activeLocks.some((l) => l.email === email && (l.role === 'consultant' || l.role === 'all'));
    }
    if (problemRole === 'employee' || problemRole === 'candidate') {
      return activeLocks.some((l) => l.email === email && (l.role === 'employee' || l.role === 'all'));
    }

    // Default guest fallback: check employee lock
    return activeLocks.some((l) => l.email === email && l.role === 'employee');
  }, [activeLocks]);

  // Fetch request messages (used by admin reply modal)
  const fetchRequestMessages = useCallback(async (reqId) => {
    if (!reqId) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/support/requests/${reqId}/messages`);
      const json = await res.json();
      if (json.success && json.data) {
        setReplyRequest((prev) => {
          if (!prev || (prev._id !== reqId && prev._id?.toString() !== reqId.toString())) return prev;
          return {
            ...prev,
            messages: json.data.messages || [],
            status: json.data.status || prev.status,
            hasUnreadAdminReply: json.data.hasUnreadAdminReply,
          };
        });
      }
    } catch (_) {}
  }, []);

  // Fetch support requests
  const fetchRequests = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingRequests(true);
    setRequestsError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus);
      if (filterUserType && filterUserType !== 'all') params.set('userType', filterUserType);
      if (debouncedSearch && debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`${API_URL}/api/admin/support/requests?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setRequests(json.data || []);
        if (json.counts) setCounts(json.counts);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
          setTotalRecords(json.pagination.totalRecords || 0);
        }
      } else {
        setRequestsError(json.message || 'Failed to load support requests');
      }
    } catch (err) {
      setRequestsError('Network error while fetching requests');
    } finally {
      if (!isSilent) setLoadingRequests(false);
      fetchActiveLockedEmails();
    }
  }, [page, limit, filterStatus, filterUserType, debouncedSearch, fetchActiveLockedEmails]);

  // Socket.io integration for instant admin support updates
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('join_support_admin');

    const handleSupportRequestUpdated = (data) => {
      fetchRequests(true);
      if (replyRequest && (replyRequest._id === data?.requestId || replyRequest._id?.toString() === data?.requestId?.toString())) {
        fetchRequestMessages(replyRequest._id);
      }
    };

    const handleSupportRequestNew = () => {
      fetchRequests(true);
    };

    socket.on('support_request_updated', handleSupportRequestUpdated);
    socket.on('support_request_new', handleSupportRequestNew);

    return () => {
      socket.emit('leave_support_admin');
      socket.off('support_request_updated', handleSupportRequestUpdated);
      socket.off('support_request_new', handleSupportRequestNew);
    };
  }, [fetchRequests, fetchRequestMessages, replyRequest]);

  // When Reply Modal is open, listen directly to messages room and poll silently every 3s
  useEffect(() => {
    if (!replyRequest?._id) return;
    const reqId = replyRequest._id.toString();

    socket.emit('join_support', reqId);

    const handleIncomingMessage = (data) => {
      const pId = (data?.requestId || data?._id || '').toString();
      if (pId === reqId) {
        if (data.allMessages) {
          setReplyRequest((prev) => (prev ? { ...prev, messages: data.allMessages, status: data.status || prev.status } : prev));
        } else if (data.message) {
          setReplyRequest((prev) => (prev ? { ...prev, messages: [...(prev.messages || []), data.message], status: data.status || prev.status } : prev));
        }
      }
    };

    const handleIncomingStatus = (data) => {
      const pId = (data?.requestId || data?._id || '').toString();
      if (pId === reqId) {
        setReplyRequest((prev) => (prev ? { ...prev, status: data.status } : prev));
      }
    };

    socket.on('support_message', handleIncomingMessage);
    socket.on('support_status_change', handleIncomingStatus);

    const pollInterval = setInterval(() => {
      fetchRequestMessages(reqId);
    }, 3000);

    return () => {
      socket.emit('leave_support', reqId);
      socket.off('support_message', handleIncomingMessage);
      socket.off('support_status_change', handleIncomingStatus);
      clearInterval(pollInterval);
    };
  }, [replyRequest?._id, fetchRequestMessages]);

  // Fetch problems list
  const fetchProblems = useCallback(async () => {
    setLoadingProblems(true);
    setProblemsError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/support/problems`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProblems(json.data);
      } else {
        setProblemsError(json.message || 'Failed to load support problems');
      }
    } catch (err) {
      setProblemsError('Network error while fetching problems');
    } finally {
      setLoadingProblems(false);
    }
  }, []);

  // Fetch quick replies list
  const fetchQuickReplies = useCallback(async () => {
    setLoadingQuickReplies(true);
    setQuickRepliesError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/support/quick-replies`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setQuickReplies(json.data);
      } else {
        setQuickRepliesError(json.message || 'Failed to load quick replies');
      }
    } catch (err) {
      setQuickRepliesError('Network error while fetching quick replies');
    } finally {
      setLoadingQuickReplies(false);
    }
  }, []);

  // Fetch data on tab change or filter change
  useEffect(() => {
    if (activeSubTab === 'requests') {
      fetchRequests();
    } else if (activeSubTab === 'problems') {
      fetchProblems();
    } else if (activeSubTab === 'otp-locks') {
      fetchActiveLockedEmails();
    } else if (activeSubTab === 'quick-replies') {
      fetchQuickReplies();
    }
  }, [activeSubTab, fetchRequests, fetchProblems, fetchActiveLockedEmails, fetchQuickReplies]);

  // Initial fetch for quickReplies count so tab badge shows accurate count
  useEffect(() => {
    fetchQuickReplies();
  }, [fetchQuickReplies]);

  // Handle manual unlock directly from a Support Request row
  const handleUnlockFromRequest = async (reqItem) => {
    if (!window.confirm(`Remove OTP lock for ${reqItem.email}?`)) {
      return;
    }

    const actionKey = `unlock_${reqItem._id}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      const userType = (reqItem.userType || 'guest').toLowerCase();
      const matchingLock = activeLocks.find(
        (l) => l.email === reqItem.email?.toLowerCase().trim() && (userType === 'guest' || l.role === userType)
      );
      const targetRole = matchingLock ? matchingLock.role : (userType !== 'guest' ? userType : 'employee');
      const res = await fetch(`${API_URL}/api/admin/otp-locks/unlock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true',
        },
        body: JSON.stringify({
          role: targetRole,
          email: reqItem.email,
          phone: reqItem.phone,
          reason: 'Manual unlock from Support Requests table',
        }),
      });

      const json = await res.json();

      if (json.success) {
        setUnlockToast({ type: 'success', message: json.message });
        setTimeout(() => setUnlockToast(null), 4500);
        await fetchActiveLockedEmails();
      } else {
        alert(json.message || 'Failed to unlock user');
      }
    } catch (err) {
      alert('Network error while unlocking user.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Handle Resolve
  const handleResolve = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/admin/support/requests/${id}/resolve`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json.success) {
        // Optimistic UI update
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: 'resolved', resolvedAt: new Date() } : r))
        );
        setCounts((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          resolved: prev.resolved + 1,
        }));
      } else {
        alert(json.message || 'Failed to resolve request');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Handle Reopen
  const handleReopen = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/admin/support/requests/${id}/reopen`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json.success) {
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: 'pending', resolvedAt: null } : r))
        );
        setCounts((prev) => ({
          ...prev,
          pending: prev.pending + 1,
          resolved: Math.max(0, prev.resolved - 1),
        }));
      } else {
        alert(json.message || 'Failed to reopen request');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Handle Delete Request
  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this support request permanently?')) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/admin/support/requests/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setRequests((prev) => prev.filter((r) => r._id !== id));
        fetchRequests();
      } else {
        alert(json.message || 'Failed to delete request');
      }
    } catch (err) {
      alert('Error deleting request');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Open problem modal for add
  const handleOpenAddProblem = (prefilledRole) => {
    setEditingProblem(null);
    setProblemFormTitle('');
    let targetRole = 'guest';
    if (prefilledRole) {
      targetRole = prefilledRole;
    } else if (problemPrimaryScope === 'without_login') {
      targetRole = 'guest';
    } else if (problemPrimaryScope === 'after_login') {
      targetRole = postLoginRoleFilter === 'all' || postLoginRoleFilter === 'universal' ? 'employee' : postLoginRoleFilter;
    }
    setProblemFormRole(targetRole);
    const roleProblems = problems.filter((p) => p.role === targetRole);
    setProblemFormOrder(roleProblems.length);
    setProblemFormActive(true);
    setProblemFormError('');
    setIsProblemModalOpen(true);
  };

  // Seed / restore default guest problems
  const handleSeedGuestProblems = async () => {
    setIsSeedingGuest(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/support/problems/seed-guest`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.data)) {
          setProblems(json.data);
        } else {
          fetchProblems();
        }
      } else {
        alert(json.message || 'Failed to seed standard pre-login problems');
      }
    } catch (err) {
      alert('Network error seeding pre-login problems');
    } finally {
      setIsSeedingGuest(false);
    }
  };

  // Quick reassign role (e.g. Move to Without Login or Move to Candidate)
  const handleQuickReassignRole = async (prob, newRole) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/support/problems/${prob._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        fetchProblems();
      } else {
        alert(json.message || 'Failed to update problem role');
      }
    } catch (err) {
      alert('Error updating problem role');
    }
  };

  // Open problem modal for edit
  const handleOpenEditProblem = (prob) => {
    setEditingProblem(prob);
    setProblemFormTitle(prob.title);
    setProblemFormRole(prob.role || 'all');
    setProblemFormOrder(prob.order !== undefined ? prob.order : 0);
    setProblemFormActive(Boolean(prob.isActive));
    setProblemFormError('');
    setIsProblemModalOpen(true);
  };

  // Duplicate problem
  const handleDuplicateProblem = (prob) => {
    setEditingProblem(null);
    setProblemFormTitle(`${prob.title}`);
    setProblemFormRole(prob.role || 'all');
    setProblemFormOrder((prob.order || 0) + 1);
    setProblemFormActive(true);
    setProblemFormError('');
    setIsProblemModalOpen(true);
  };

  // Move problem position up or down
  const handleMoveProblem = async (probId, direction) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/support/problems/${probId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      const json = await res.json();
      if (json.success) {
        fetchProblems();
      } else {
        alert(json.message || 'Failed to move problem');
      }
    } catch (err) {
      alert('Error moving problem');
    }
  };

  // Toggle problem active status
  const handleToggleProblem = async (prob) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/support/problems/${prob._id}/toggle`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json.success) {
        setProblems((prev) =>
          prev.map((p) => (p._id === prob._id ? { ...p, isActive: !p.isActive } : p))
        );
      } else {
        alert(json.message || 'Failed to toggle status');
      }
    } catch (err) {
      alert('Error toggling problem status');
    }
  };

  // Save Problem (Create or Update)
  const handleSaveProblem = async (e) => {
    e.preventDefault();
    if (!problemFormTitle.trim()) {
      setProblemFormError('Problem title is required');
      return;
    }

    setIsSavingProblem(true);
    setProblemFormError('');

    try {
      const url = editingProblem
        ? `${API_URL}/api/admin/support/problems/${editingProblem._id}`
        : `${API_URL}/api/admin/support/problems`;
      const method = editingProblem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: problemFormTitle.trim(),
          role: problemFormRole || 'all',
          order: Number(problemFormOrder) || 0,
          isActive: problemFormActive,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsProblemModalOpen(false);
        fetchProblems();
      } else {
        setProblemFormError(json.message || 'Failed to save problem');
      }
    } catch (err) {
      setProblemFormError('Network error saving problem');
    } finally {
      setIsSavingProblem(false);
    }
  };

  // Confirm delete problem
  const handleDeleteProblem = async () => {
    if (!problemToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/support/problems/${problemToDelete._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setProblems((prev) => prev.filter((p) => p._id !== problemToDelete._id));
        setProblemToDelete(null);
      } else {
        alert(json.message || 'Failed to delete problem');
      }
    } catch (err) {
      alert('Error deleting problem');
    }
  };

  // -------------------------------------------------------------
  // QUICK REPLIES HANDLERS (CMS for user quick updates in chat)
  // -------------------------------------------------------------
  const handleOpenAddQuickReply = () => {
    setEditingQuickReply(null);
    setQuickReplyFormTitle('');
    setQuickReplyFormOrder(quickReplies.length);
    setQuickReplyFormActive(true);
    setQuickReplyFormError('');
    setIsQuickReplyModalOpen(true);
  };

  const handleOpenEditQuickReply = (qr) => {
    setEditingQuickReply(qr);
    setQuickReplyFormTitle(qr.title);
    setQuickReplyFormOrder(qr.order !== undefined ? qr.order : 0);
    setQuickReplyFormActive(Boolean(qr.isActive));
    setQuickReplyFormError('');
    setIsQuickReplyModalOpen(true);
  };

  const handleDuplicateQuickReply = (qr) => {
    setEditingQuickReply(null);
    setQuickReplyFormTitle(`${qr.title} (Copy)`);
    setQuickReplyFormOrder((qr.order || 0) + 1);
    setQuickReplyFormActive(true);
    setQuickReplyFormError('');
    setIsQuickReplyModalOpen(true);
  };

  const handleMoveQuickReply = async (qrId, direction) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/support/quick-replies/${qrId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      const json = await res.json();
      if (json.success) {
        fetchQuickReplies();
      } else {
        alert(json.message || 'Failed to move quick reply');
      }
    } catch (err) {
      alert('Error moving quick reply');
    }
  };

  const handleToggleQuickReply = async (qr) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/support/quick-replies/${qr._id}/toggle`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json.success) {
        setQuickReplies((prev) =>
          prev.map((item) => (item._id === qr._id ? { ...item, isActive: !item.isActive } : item))
        );
      } else {
        alert(json.message || 'Failed to toggle quick reply status');
      }
    } catch (err) {
      alert('Error toggling quick reply status');
    }
  };

  const handleSaveQuickReply = async (e) => {
    e.preventDefault();
    if (!quickReplyFormTitle.trim()) {
      setQuickReplyFormError('Quick reply text is required');
      return;
    }

    setIsSavingQuickReply(true);
    setQuickReplyFormError('');

    try {
      const url = editingQuickReply
        ? `${API_URL}/api/admin/support/quick-replies/${editingQuickReply._id}`
        : `${API_URL}/api/admin/support/quick-replies`;
      const method = editingQuickReply ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickReplyFormTitle.trim(),
          order: Number(quickReplyFormOrder) || 0,
          isActive: quickReplyFormActive,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsQuickReplyModalOpen(false);
        fetchQuickReplies();
      } else {
        setQuickReplyFormError(json.message || 'Failed to save quick reply');
      }
    } catch (err) {
      setQuickReplyFormError('Network error saving quick reply');
    } finally {
      setIsSavingQuickReply(false);
    }
  };

  const handleDeleteQuickReply = async () => {
    if (!quickReplyToDelete) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/support/quick-replies/${quickReplyToDelete._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setQuickReplies((prev) => prev.filter((item) => item._id !== quickReplyToDelete._id));
        setQuickReplyToDelete(null);
      } else {
        alert(json.message || 'Failed to delete quick reply');
      }
    } catch (err) {
      alert('Error deleting quick reply');
    }
  };

  // Render User Type badge
  const renderUserTypeBadge = (type) => {
    switch (type) {
      case 'employee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Candidate
          </span>
        );
      case 'employer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Employer
          </span>
        );
      case 'consultant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Consultant
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            Guest
          </span>
        );
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-gray-50/60 p-4 sm:p-8 lg:p-10 space-y-8">
      {/* Toast Alert for Instant Feedback */}
      {unlockToast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{unlockToast.message}</span>
          <button
            type="button"
            onClick={() => setUnlockToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Title & Subtabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-8 h-8 text-green-700" />
            Support Helpdesk
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review incoming user support requests, monitor OTP lockouts, and manage predefined selection problems.
          </p>
        </div>

        {/* Subtabs Switcher */}
        <div className="inline-flex flex-wrap items-center bg-gray-200/80 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeSubTab === 'requests'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Support Requests</span>
            {counts.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white">
                {counts.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('otp-locks')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeSubTab === 'otp-locks'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="w-4 h-4 text-rose-600" />
            <span>OTP Locked Users</span>
            {lockedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white animate-pulse">
                {lockedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('problems')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeSubTab === 'problems'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Manage Problems</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('quick-replies')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeSubTab === 'quick-replies'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LifeBuoy className="w-4 h-4 text-emerald-600" />
            <span>Quick Updates</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
              {quickReplies.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('blocked-accounts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeSubTab === 'blocked-accounts'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Blocked Accounts</span>
            {blockedAccountCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white">
                {blockedAccountCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================
       * TAB 1: SUPPORT REQUESTS
       * ========================================================= */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total Requests */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Requests</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{counts.total}</p>
                <p className="text-xs text-gray-400 mt-1">All time inquiries</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-amber-50/30">
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Action</p>
                <p className="text-3xl font-black text-amber-800 mt-1">{counts.pending}</p>
                <p className="text-xs text-amber-600 mt-1">Requires resolution</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* Resolved Requests */}
            <div className="bg-white rounded-2xl border border-emerald-200/80 p-6 shadow-xs flex items-center justify-between bg-gradient-to-br from-white to-emerald-50/30">
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Resolved</p>
                <p className="text-3xl font-black text-emerald-800 mt-1">{counts.resolved}</p>
                <p className="text-xs text-emerald-600 mt-1">Completed inquiries</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, phone, problem..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-gray-50/50"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white outline-none focus:border-green-600 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* User Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Role:</span>
                <select
                  value={filterUserType}
                  onChange={(e) => { setFilterUserType(e.target.value); setPage(1); }}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white outline-none focus:border-green-600 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="employee">Candidate</option>
                  <option value="employer">Employer</option>
                  <option value="consultant">Consultant</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchRequests}
                disabled={loadingRequests}
                className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                title="Refresh requests"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRequests ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {loadingRequests ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-bold text-gray-500">Loading support inquiries...</p>
              </div>
            ) : requestsError ? (
              <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="text-sm font-bold text-red-600">{requestsError}</p>
                <button
                  type="button"
                  onClick={fetchRequests}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-800">No support requests found</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {searchTerm || filterStatus !== 'all' || filterUserType !== 'all'
                    ? 'No records match your active filters. Try resetting search or filter options.'
                    : 'Great job! There are currently no pending or past support requests.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-500">
                      <th className="py-3.5 px-5 whitespace-nowrap min-w-[170px]">User</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Contact</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Role</th>
                      <th className="py-3.5 px-5 whitespace-nowrap">Problem Selected</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Submitted At</th>
                      <th className="py-3.5 px-5 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {requests.map((reqItem) => {
                      const isPending = reqItem.status === 'pending';
                      const isLoadingRow = actionLoading[reqItem._id];

                      return (
                        <tr key={reqItem._id} className="hover:bg-gray-50/60 transition-colors">
                          {/* Name & Avatar */}
                          <td className="py-4 px-5 font-bold text-gray-900 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center font-black text-xs shrink-0">
                                {reqItem.name ? reqItem.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="font-bold text-gray-900 whitespace-nowrap" title={reqItem.name}>
                                {reqItem.name || 'Anonymous'}
                              </span>
                            </div>
                          </td>

                          {/* Email & Phone */}
                          <td className="py-4 px-4 text-gray-600">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-gray-700 flex-wrap">
                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="font-medium truncate max-w-[170px]" title={reqItem.email}>{reqItem.email}</span>
                                {isRequestLocked(reqItem) && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200" title="User is currently locked out of OTP">
                                    <Lock className="w-2.5 h-2.5" />
                                    Locked
                                  </span>
                                )}
                              </div>
                              {reqItem.phone && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span>{reqItem.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-4 px-4">
                            {renderUserTypeBadge(reqItem.userType)}
                          </td>

                          {/* Problem Snapshot */}
                          <td className="py-4 px-5">
                            <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-xl inline-block max-w-[260px] truncate" title={reqItem.problemText}>
                              {reqItem.problemText}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Resolved
                              </span>
                            )}
                          </td>

                          {/* Date/Time */}
                          <td className="py-4 px-4 text-gray-500 whitespace-nowrap">
                            {formatDate(reqItem.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {isRequestLocked(reqItem) && (
                                <button
                                  type="button"
                                  onClick={() => handleUnlockFromRequest(reqItem)}
                                  disabled={actionLoading[`unlock_${reqItem._id}`]}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Remove OTP lock for this user"
                                >
                                  {actionLoading[`unlock_${reqItem._id}`] ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Unlock className="w-3.5 h-3.5" />
                                  )}
                                  <span>Unlock OTP</span>
                                </button>
                              )}

                              {/* Reply / Chat Thread Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenReplyModal(reqItem)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                                title="Reply to this request"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Reply</span>
                                {reqItem.messages && reqItem.messages.length > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-extrabold">
                                    {reqItem.messages.length}
                                  </span>
                                )}
                              </button>

                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => handleResolve(reqItem._id)}
                                  disabled={isLoadingRow}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Mark as resolved"
                                >
                                  {isLoadingRow ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>Mark Resolved</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReopen(reqItem._id)}
                                  disabled={isLoadingRow}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                                  title="Reopen request"
                                >
                                  {isLoadingRow ? (
                                    <div className="w-3 h-3 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                                  )}
                                  <span>Reopen</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(reqItem._id)}
                                disabled={isLoadingRow}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <span>
                  Showing page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong> ({totalRecords} requests)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
       * TAB 2: OTP LOCKED USERS
       * ========================================================= */}
      {activeSubTab === 'otp-locks' && (
        <OtpLockedUsers
          onLocksUpdated={handleLocksUpdated}
        />
      )}
      {activeSubTab === 'blocked-accounts' && (
        <BlockedAccounts onCountChange={setBlockedAccountCount} />
      )}

      {/* =========================================================
       * TAB 3: MANAGE PROBLEMS (PREDEFINED ISSUE CHOICES)
       * ========================================================= */}
      {activeSubTab === 'problems' && (() => {
        const withoutLoginList = problems.filter((p) => p.role === 'guest');
        const postLoginList = problems.filter((p) => p.role !== 'guest');

        const candidateCount = problems.filter((p) => p.role === 'employee').length;
        const employerCount = problems.filter((p) => p.role === 'employer').length;
        const consultantCount = problems.filter((p) => p.role === 'consultant').length;
        const universalCount = problems.filter((p) => p.role === 'all').length;

        // Current display list based on Primary Scope
        let currentScopeList = [];
        if (problemPrimaryScope === 'without_login') {
          currentScopeList = withoutLoginList;
        } else {
          currentScopeList = postLoginList.filter((p) => {
            if (postLoginRoleFilter === 'all') return true;
            if (postLoginRoleFilter === 'universal') return p.role === 'all';
            return p.role === postLoginRoleFilter || p.role === 'all';
          });
        }

        // Apply search & status filters
        const displayList = currentScopeList
          .filter((prob) => {
            const matchesSearch = problemSearch.trim()
              ? prob.title.toLowerCase().includes(problemSearch.toLowerCase())
              : true;
            const matchesStatus =
              problemStatusFilter === 'active'
                ? prob.isActive
                : problemStatusFilter === 'inactive'
                ? !prob.isActive
                : true;
            return matchesSearch && matchesStatus;
          })
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return (
          <div className="space-y-6">
            {/* Top Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">Predefined Support Problems</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-green-50 text-green-700 border border-green-200">
                    {problems.length} Total Options
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Manage and customize the issue options available for visitors before login and users inside their logged-in dashboards.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSeedGuestProblems}
                  disabled={isSeedingGuest}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Seed or restore standard login and guest issues"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSeedingGuest ? 'animate-spin' : ''}`} />
                  <span>{isSeedingGuest ? 'Restoring...' : 'Seed Standard Login Issues'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddProblem()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Add Problem {problemPrimaryScope === 'without_login' ? 'for Without Login' : `for ${postLoginRoleFilter === 'employee' ? 'Candidate' : postLoginRoleFilter === 'employer' ? 'Employer' : postLoginRoleFilter === 'consultant' ? 'Consultant' : 'Logged-in'}`}
                  </span>
                </button>
              </div>
            </div>

            {/* PRIMARY EXPERIENCE SELECTOR: Without Login vs After Login */}
            <div className="bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* Mode 1: Without Login (Pre-Login / Guest) */}
                <button
                  type="button"
                  onClick={() => {
                    setProblemPrimaryScope('without_login');
                    setProblemSearch('');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    problemPrimaryScope === 'without_login'
                      ? 'border-sky-500 bg-gradient-to-br from-sky-50/90 to-blue-50/50 shadow-xs ring-2 ring-sky-500'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        problemPrimaryScope === 'without_login'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-sky-100 text-sky-700'
                      }`}>
                        🔓
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900">
                            1. Without Login (Pre-Login Issues)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                            problemPrimaryScope === 'without_login'
                              ? 'bg-sky-600 text-white'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {withoutLoginList.length} Options
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Shown on Homepage, Login &amp; Register before signing in
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-sky-100/80 flex items-center gap-3 text-[11px] text-sky-800 font-semibold flex-wrap">
                    <span>• Login problems</span>
                    <span>• OTP not received</span>
                    <span>• Account locked</span>
                    <span>• Registration error</span>
                  </div>
                </button>

                {/* Mode 2: After Login (Logged-In User Roles) */}
                <button
                  type="button"
                  onClick={() => {
                    setProblemPrimaryScope('after_login');
                    setProblemSearch('');
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    problemPrimaryScope === 'after_login'
                      ? 'border-emerald-600 bg-gradient-to-br from-emerald-50/90 to-green-50/50 shadow-xs ring-2 ring-emerald-600'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        problemPrimaryScope === 'after_login'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        🔐
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900">
                            2. After Login (Logged-In Roles)
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                            problemPrimaryScope === 'after_login'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {postLoginList.length} Options
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Role-specific options shown inside Candidate, Employer &amp; Consultant portals
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-emerald-100/80 flex items-center gap-3 text-[11px] text-emerald-800 font-semibold flex-wrap">
                    <span>👨‍💼 Candidate ({candidateCount})</span>
                    <span>🏢 Employer ({employerCount})</span>
                    <span>🤝 Consultant ({consultantCount})</span>
                    <span>🌐 Universal ({universalCount})</span>
                  </div>
                </button>
              </div>
            </div>

            {/* SCOPE 1: WITHOUT LOGIN BANNER */}
            {problemPrimaryScope === 'without_login' && (
              <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 text-base shadow-xs">
                    🔓
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sky-950 text-sm">
                      Pre-Login &amp; Guest Support Options
                    </h4>
                    <p className="text-sky-800 mt-0.5 leading-relaxed">
                      These issue options appear when visitors open the support widget <strong>before logging in</strong>.
                      Visitors selecting these will provide their Name, Email, and Phone number so support staff can reach them.
                    </p>
                  </div>
                </div>

                {withoutLoginList.length === 0 && (
                  <button
                    type="button"
                    onClick={handleSeedGuestProblems}
                    disabled={isSeedingGuest}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs whitespace-nowrap shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Populate 6 Standard Pre-Login Issues</span>
                  </button>
                )}
              </div>
            )}

            {/* SCOPE 2: AFTER LOGIN SUB-ROLE TABS */}
            {problemPrimaryScope === 'after_login' && (
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Select Logged-In User Role:
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Each role sees only problems relevant to their dashboard
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'employee', label: 'Candidate', icon: '👨‍💼', count: candidateCount },
                    { id: 'employer', label: 'Employer', icon: '🏢', count: employerCount },
                    { id: 'consultant', label: 'Consultant', icon: '🤝', count: consultantCount },
                    { id: 'universal', label: 'Universal', icon: '🌐', count: universalCount },
                    { id: 'all', label: 'All Logged-In', icon: '📋', count: postLoginList.length },
                  ].map((sub) => {
                    const isSel = postLoginRoleFilter === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setPostLoginRoleFilter(sub.id);
                          setProblemSearch('');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSel
                            ? 'border-green-600 bg-green-50/70 ring-1 ring-green-600 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{sub.icon}</span>
                          <span className={`text-xs font-bold ${isSel ? 'text-green-950 font-black' : 'text-gray-700'}`}>
                            {sub.label}
                          </span>
                        </div>
                        <span className={`text-[11px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          isSel ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {sub.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-gray-50 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>
                    {postLoginRoleFilter === 'employee' && '👨‍💼 Displayed to job seekers in Candidate Portal, Job Feed, and Application Drawer.'}
                    {postLoginRoleFilter === 'employer' && '🏢 Displayed to employers & recruiters in Employer Dashboard, Job Posting, and Verification.'}
                    {postLoginRoleFilter === 'consultant' && '🤝 Displayed to partner consultants in Consultant Portal and Client Referral.'}
                    {postLoginRoleFilter === 'universal' && '🌐 Universal options visible across all logged-in roles.'}
                    {postLoginRoleFilter === 'all' && '📋 Overview showing all options across all logged-in user roles.'}
                  </span>
                </div>
              </div>
            )}

            {/* Filter Toolbar (Search + Status Filter) */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-bold text-gray-500 mr-1">Status:</span>
                {[
                  { id: 'all', label: 'All Status' },
                  { id: 'active', label: 'Active Only' },
                  { id: 'inactive', label: 'Inactive Only' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setProblemStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      problemStatusFilter === st.id
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  placeholder={`Search ${problemPrimaryScope === 'without_login' ? 'pre-login' : 'post-login'} problems...`}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                />
                {problemSearch && (
                  <button
                    type="button"
                    onClick={() => setProblemSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Problems List Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              {loadingProblems ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-bold text-gray-500">Loading problems...</p>
                </div>
              ) : problemsError ? (
                <div className="py-16 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                  <p className="text-sm font-bold text-red-600">{problemsError}</p>
                  <button
                    type="button"
                    onClick={fetchProblems}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : displayList.length === 0 ? (
                problemPrimaryScope === 'without_login' && withoutLoginList.length === 0 ? (
                  <div className="py-16 text-center space-y-3 p-6">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto text-2xl shadow-xs">
                      🔓
                    </div>
                    <h4 className="text-base font-bold text-gray-900">No Without-Login Problems Defined</h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                      Visitors who are not logged in currently have 0 problem choices in the support widget.
                      Click below to immediately create the 6 standard pre-login choices (Unable to login, OTP not received, Account locked, Registration error, etc.).
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSeedGuestProblems}
                        disabled={isSeedingGuest}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isSeedingGuest ? 'Seeding...' : '⚡ Seed Standard Pre-Login Issues'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddProblem('guest')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-xl text-xs border border-gray-300 transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Custom Pre-Login Issue</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-3">
                    <SlidersHorizontal className="w-10 h-10 text-gray-300 mx-auto" />
                    <h4 className="text-base font-bold text-gray-800">No support problems found</h4>
                    <p className="text-xs text-gray-500">
                      {problemSearch
                        ? `No problems matching "${problemSearch}"`
                        : 'No problems defined for this filter.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddProblem()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Problem Option</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-500">
                        <th className="py-3.5 px-5 w-24">Order</th>
                        <th className="py-3.5 px-6">Problem Title</th>
                        <th className="py-3.5 px-4 w-40">Audience / Role</th>
                        <th className="py-3.5 px-5 w-28">Status</th>
                        <th className="py-3.5 px-5 w-28 text-center">Toggle Active</th>
                        <th className="py-3.5 px-4 w-44">Quick Reassign</th>
                        <th className="py-3.5 px-5 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {displayList.map((prob, index) => {
                        return (
                          <tr key={prob._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold font-mono text-xs border border-gray-200">
                                  #{index + 1}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => handleMoveProblem(prob._id, 'up')}
                                    title="Move Up"
                                    className="p-0.5 rounded text-gray-400 hover:text-green-700 hover:bg-green-50 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === displayList.length - 1}
                                    onClick={() => handleMoveProblem(prob._id, 'down')}
                                    title="Move Down"
                                    className="p-0.5 rounded text-gray-400 hover:text-green-700 hover:bg-green-50 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 font-bold text-gray-900">
                              {prob.title}
                            </td>

                            <td className="py-4 px-4">
                              {prob.role === 'guest' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                  <span>🔓</span>
                                  <span>Without Login</span>
                                </span>
                              ) : prob.role === 'employee' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <span>👨‍💼</span>
                                  <span>Candidate</span>
                                </span>
                              ) : prob.role === 'employer' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  <span>🏢</span>
                                  <span>Employer</span>
                                </span>
                              ) : prob.role === 'consultant' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span>🤝</span>
                                  <span>Consultant</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span>🌐</span>
                                  <span>All Roles</span>
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-5">
                              {prob.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                  Inactive
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-5 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleProblem(prob)}
                                className="cursor-pointer focus:outline-none transition-transform active:scale-95"
                                title={prob.isActive ? 'Deactivate problem' : 'Activate problem'}
                              >
                                {prob.isActive ? (
                                  <ToggleRight className="w-7 h-7 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-7 h-7 text-gray-300" />
                                )}
                              </button>
                            </td>

                            {/* Quick Reassign Role Action */}
                            <td className="py-4 px-4">
                              {prob.role !== 'guest' ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickReassignRole(prob, 'guest')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors cursor-pointer"
                                  title="Transfer this problem to Without Login"
                                >
                                  <span>🔓</span>
                                  <span>Move to Without Login</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-400 font-semibold mr-0.5">Move:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReassignRole(prob, 'employee')}
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer"
                                    title="Move to Candidate"
                                  >
                                    Cand.
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReassignRole(prob, 'employer')}
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 cursor-pointer"
                                    title="Move to Employer"
                                  >
                                    Emp.
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReassignRole(prob, 'consultant')}
                                    className="px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 cursor-pointer"
                                    title="Move to Consultant"
                                  >
                                    Cons.
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateProblem(prob)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Duplicate problem to another role"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProblem(prob)}
                                  className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit problem"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setProblemToDelete(prob)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete problem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* =========================================================
       * TAB 4: USER QUICK UPDATES RESPONSES (CMS)
       * ========================================================= */}
      {activeSubTab === 'quick-replies' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900">User Quick Update Responses</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage the predefined response buttons that users see in the support chat widget under &quot;Send a quick update to support&quot;.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddQuickReply}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-sm shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Quick Reply</span>
            </button>
          </div>

          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Total Quick Replies</span>
                <span className="text-base font-extrabold text-gray-900">{quickReplies.length}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Total configured responses</p>
            </div>
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Active in Chat Widget</span>
                <span className="text-base font-extrabold text-emerald-900">
                  {quickReplies.filter((q) => q.isActive).length}
                </span>
              </div>
              <p className="text-[11px] text-emerald-600/70 mt-1">Currently shown to users in chat</p>
            </div>
            <div className="p-4 rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Inactive / Hidden</span>
                <span className="text-base font-extrabold text-gray-600">
                  {quickReplies.filter((q) => !q.isActive).length}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Hidden from user chat view</p>
            </div>
          </div>

          {/* Search & Info Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Users tap these buttons to send an instant response to support without typing manually.</span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickReplySearch}
                onChange={(e) => setQuickReplySearch(e.target.value)}
                placeholder="Search quick reply text..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
              {quickReplySearch && (
                <button
                  type="button"
                  onClick={() => setQuickReplySearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Replies List Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            {loadingQuickReplies ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm font-bold text-gray-500">Loading quick replies...</p>
              </div>
            ) : quickRepliesError ? (
              <div className="py-16 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="text-sm font-bold text-red-600">{quickRepliesError}</p>
                <button
                  type="button"
                  onClick={fetchQuickReplies}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (() => {
              const displayList = quickReplies
                .filter((qr) =>
                  quickReplySearch.trim()
                    ? qr.title.toLowerCase().includes(quickReplySearch.toLowerCase())
                    : true
                )
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

              return displayList.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <LifeBuoy className="w-10 h-10 text-gray-300 mx-auto" />
                  <h4 className="text-base font-bold text-gray-800">No quick replies found</h4>
                  <p className="text-xs text-gray-500">
                    {quickReplySearch
                      ? `No quick replies matching "${quickReplySearch}"`
                      : 'Get started by creating your first quick reply.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                        <th className="py-3.5 px-4 w-28">Order</th>
                        <th className="py-3.5 px-4">Response Text (User Quick Reply)</th>
                        <th className="py-3.5 px-4 w-32">Status</th>
                        <th className="py-3.5 px-4 w-28 text-center">Toggle</th>
                        <th className="py-3.5 px-4 w-36 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {displayList.map((qr, idx) => (
                        <tr key={qr._id} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="py-3 px-4 font-bold text-gray-700">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-extrabold text-[11px] flex items-center justify-center">
                                #{qr.order ?? idx}
                              </span>
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveQuickReply(qr._id, 'up')}
                                  title="Move Up"
                                  className="p-0.5 text-gray-400 hover:text-gray-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === displayList.length - 1}
                                  onClick={() => handleMoveQuickReply(qr._id, 'down')}
                                  title="Move Down"
                                  className="p-0.5 text-gray-400 hover:text-gray-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="font-semibold text-gray-900">{qr.title}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {qr.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleQuickReply(qr)}
                              title={qr.isActive ? 'Deactivate' : 'Activate'}
                              className="cursor-pointer text-gray-500 hover:text-gray-800 transition-transform active:scale-95"
                            >
                              {qr.isActive ? (
                                <ToggleRight className="w-6 h-6 text-green-600 inline-block" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-gray-400 inline-block" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDuplicateQuickReply(qr)}
                                title="Duplicate"
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditQuickReply(qr)}
                                title="Edit Quick Reply"
                                className="p-1.5 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickReplyToDelete(qr)}
                                title="Delete Quick Reply"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================
       * MODAL: ADD / EDIT PROBLEM (WITH VISUAL ROLE SELECTOR)
       * ========================================================= */}
      {isProblemModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  {editingProblem ? 'Edit Support Problem Option' : 'Add New Support Problem Option'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure the problem choice shown in the user support widget.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProblemModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="p-6 space-y-4">
              {problemFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{problemFormError}</span>
                </div>
              )}

              {/* Visual Role Picker with clear Pre-Login vs Post-Login Segmentation */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Target Audience / Where will this show? <span className="text-red-500">*</span>
                </label>

                {/* Section 1: Pre-login (Without Login) */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block mb-1.5 flex items-center gap-1">
                    <span>🔓</span>
                    <span>1. Pre-Login Audience (Without Login)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setProblemFormRole('guest')}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      problemFormRole === 'guest'
                        ? 'border-sky-600 bg-sky-50 text-sky-950 ring-2 ring-sky-600 font-bold shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white font-medium'
                    }`}
                  >
                    <span className="text-2xl">🔓</span>
                    <div>
                      <div className="text-xs font-bold text-sky-900">Without Login (Guest &amp; Visitors)</div>
                      <div className="text-[11px] text-gray-500 leading-snug mt-0.5">
                        Shown to visitors on Homepage, Login &amp; Register before signing in (Login trouble, OTP locked, Sign up issue)
                      </div>
                    </div>
                  </button>
                </div>

                {/* Section 2: Post-login Roles */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1.5 flex items-center gap-1">
                    <span>🔐</span>
                    <span>2. After-Login Audiences (Logged-In Portals)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'employee', label: 'Candidate', icon: '👨‍💼', desc: 'Job seeker portal & application drawer' },
                      { id: 'employer', label: 'Employer', icon: '🏢', desc: 'Recruiter dashboard & job posting CMS' },
                      { id: 'consultant', label: 'Consultant', icon: '🤝', desc: 'Agency partner portal & referrals' },
                      { id: 'all', label: 'Universal (All Roles)', icon: '🌐', desc: 'Common issues visible across all roles' },
                    ].map((r) => {
                      const isSel = problemFormRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setProblemFormRole(r.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSel
                              ? 'border-green-600 bg-green-50/80 text-green-950 ring-2 ring-green-600 font-bold shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white font-medium'
                          }`}
                        >
                          <span className="text-lg">{r.icon}</span>
                          <div>
                            <div className="text-xs font-bold">{r.label}</div>
                            <div className="text-[10px] text-gray-400 leading-tight">{r.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Problem Title Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Problem Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={problemFormTitle}
                  onChange={(e) => setProblemFormTitle(e.target.value)}
                  placeholder={
                    problemFormRole === 'guest'
                      ? 'e.g. I am unable to login, OTP not received, Account locked'
                      : problemFormRole === 'employee'
                      ? 'e.g. Resume upload issue, Job application status, Profile error'
                      : problemFormRole === 'employer'
                      ? 'e.g. Job posting approval, Candidate CV download problem'
                      : problemFormRole === 'consultant'
                      ? 'e.g. Commission payout inquiry, Client candidate mapping'
                      : 'e.g. Technical bug, Website error, Payment issue'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 font-medium"
                  required
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={problemFormOrder}
                  onChange={(e) => setProblemFormOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 font-semibold"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Lower numbers appear first. Setting an existing order automatically shifts subsequent options down without duplicates.
                </p>
              </div>

              {/* Active Toggle Checkbox */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="problem-active-chk"
                  checked={problemFormActive}
                  onChange={(e) => setProblemFormActive(e.target.checked)}
                  className="w-4 h-4 text-green-700 rounded border-gray-300 focus:ring-green-600 cursor-pointer"
                />
                <label htmlFor="problem-active-chk" className="text-xs font-bold text-gray-800 cursor-pointer">
                  Active (visible in floating widget for users)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProblemModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingProblem}
                  className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingProblem ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProblem ? 'Update Problem Option' : 'Create Problem Option'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
       * MODAL: CONFIRM DELETE PROBLEM
       * ========================================================= */}
      {problemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">Delete Support Problem?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete <strong className="text-gray-800">"{problemToDelete.title}"</strong>? Existing support requests will preserve this problem's historical title snapshot.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProblemToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProblem}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
       * MODAL: ADD / EDIT QUICK REPLY RESPONSE
       * ========================================================= */}
      {isQuickReplyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                  <LifeBuoy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {editingQuickReply ? 'Edit Quick Reply Response' : 'Add Quick Reply Response'}
                  </h3>
                  <p className="text-emerald-100 text-xs font-medium">
                    Configure user follow-up options for the support chat widget
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickReplyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickReply} className="p-6 space-y-4">
              {quickReplyFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{quickReplyFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Quick Reply Text <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickReplyFormTitle}
                  onChange={(e) => setQuickReplyFormTitle(e.target.value)}
                  placeholder="e.g. Yes, my issue is resolved. Thank you!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 font-medium"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  This button text will be presented to the user under &quot;Send a quick update to support&quot;.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={quickReplyFormOrder}
                  onChange={(e) => setQuickReplyFormOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 font-semibold"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Lower numbers appear first. Setting an existing order automatically shifts subsequent options down.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="quickreply-active-chk"
                  checked={quickReplyFormActive}
                  onChange={(e) => setQuickReplyFormActive(e.target.checked)}
                  className="w-4 h-4 text-green-700 rounded border-gray-300 focus:ring-green-600 cursor-pointer"
                />
                <label htmlFor="quickreply-active-chk" className="text-xs font-bold text-gray-800 cursor-pointer">
                  Active (visible in floating widget for users)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsQuickReplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuickReply}
                  className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingQuickReply ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingQuickReply ? 'Update Quick Reply' : 'Create Quick Reply'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
       * MODAL: CONFIRM DELETE QUICK REPLY
       * ========================================================= */}
      {quickReplyToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-gray-900">Delete Quick Reply?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to delete <strong className="text-gray-800">&quot;{quickReplyToDelete.title}&quot;</strong>? This option will no longer appear in the support chat widget.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickReplyToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuickReply}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
       * MODAL: ADMIN REPLY & THREAD VIEWER
       * ========================================================= */}
      {replyRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white p-5 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base leading-tight">{replyRequest.name}</h3>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {replyRequest.userType}
                    </span>
                  </div>
                  <p className="text-emerald-100 text-xs font-medium">
                    {replyRequest.email} • {replyRequest.phone}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReplyRequest(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Problem Details Banner */}
            <div className="bg-emerald-50/60 border-b border-emerald-100 px-5 py-3 flex items-center justify-between gap-3 text-xs">
              <div className="truncate">
                <span className="font-bold text-gray-500">Problem: </span>
                <span className="font-extrabold text-gray-900">{replyRequest.problemText}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                replyRequest.status === 'resolved' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {replyRequest.status === 'resolved' ? 'Resolved' : 'Pending'}
              </span>
            </div>

            {/* Messages Thread */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3 bg-gray-50/50">
              {(!replyRequest.messages || replyRequest.messages.length === 0) ? (
                <div className="py-10 text-center space-y-2 text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs font-semibold">No messages in this thread yet.</p>
                  <p className="text-[11px] text-gray-400">Send a reply below to reach out to the user.</p>
                </div>
              ) : (
                replyRequest.messages.map((m, idx) => {
                  const isAdmin = m.sender === 'admin';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">
                        {isAdmin ? 'Admin' : `${replyRequest.name} (User Option)`} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs font-medium shadow-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-emerald-700 text-white rounded-tr-xs'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Error banner */}
            {replyError && (
              <div className="px-5 py-2 bg-red-50 text-red-600 text-xs font-semibold flex items-center gap-1.5 border-t border-red-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{replyError}</span>
              </div>
            )}

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-gray-200 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a message to the user..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-gray-50/50"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyText.trim()}
                  className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isSendingReply ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send</span>
                </button>
              </div>

              {/* Quick action buttons inside drawer */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-2">
                  {isRequestLocked(replyRequest) && (
                    <button
                      type="button"
                      onClick={() => handleUnlockFromRequest(replyRequest)}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Unlock User OTP</span>
                    </button>
                  )}
                  {replyRequest.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleResolve(replyRequest._id);
                        setReplyRequest((p) => ({ ...p, status: 'resolved' }));
                      }}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleReopen(replyRequest._id);
                        setReplyRequest((p) => ({ ...p, status: 'pending' }));
                      }}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reopen</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setReplyRequest(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
