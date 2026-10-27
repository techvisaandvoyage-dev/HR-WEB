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
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Lock,
  Unlock,
  Send,
  Copy,
} from 'lucide-react';
import OtpLockedUsers from './support/OtpLockedUsers';
import { socket } from '../utils/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SupportTab() {
  const [activeSubTab, setActiveSubTab] = useState('requests'); // 'requests' | 'otp-locks' | 'problems'

  // Metric counts
  const [counts, setCounts] = useState({ total: 0, pending: 0, resolved: 0 });

  // OTP Locked Users active cache for quick badges & actions
  const [activeLockedEmails, setActiveLockedEmails] = useState([]);
  const [activeLocks, setActiveLocks] = useState([]); // Array of { email, role }
  const [lockedCount, setLockedCount] = useState(0);
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
  const [problemRoleFilter, setProblemRoleFilter] = useState('all'); // 'all' | 'employee' | 'employer' | 'consultant' | 'universal'
  const [problemSearch, setProblemSearch] = useState('');

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

  // Fetch data on tab change or filter change
  useEffect(() => {
    if (activeSubTab === 'requests') {
      fetchRequests();
    } else if (activeSubTab === 'problems') {
      fetchProblems();
    } else if (activeSubTab === 'otp-locks') {
      fetchActiveLockedEmails();
    }
  }, [activeSubTab, fetchRequests, fetchProblems, fetchActiveLockedEmails]);

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
    const targetRole =
      prefilledRole ||
      (['employee', 'employer', 'consultant'].includes(problemRoleFilter)
        ? problemRoleFilter
        : 'employee');
    setProblemFormRole(targetRole);
    setProblemFormOrder(problems.length);
    setProblemFormActive(true);
    setProblemFormError('');
    setIsProblemModalOpen(true);
  };

  // Open problem modal for edit
  const handleOpenEditProblem = (prob) => {
    setEditingProblem(prob);
    setProblemFormTitle(prob.title);
    setProblemFormRole(prob.role || 'all');
    setProblemFormOrder(prob.order || 0);
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
        <div className="inline-flex items-center bg-gray-200/80 p-1 rounded-2xl shrink-0">
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

      {/* =========================================================
       * TAB 3: MANAGE PROBLEMS
       * ========================================================= */}
      {activeSubTab === 'problems' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-gray-900">Predefined Selection Problems</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage and customize the issue options available for Candidate, Employer, and Consultant in the support widget.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddProblem()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-sm shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>
                Add Problem {problemRoleFilter === 'employee' ? 'for Candidate' : problemRoleFilter === 'employer' ? 'for Employer' : problemRoleFilter === 'consultant' ? 'for Consultant' : ''}
              </span>
            </button>
          </div>

          {/* Role Summary & Filter Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setProblemRoleFilter('all')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                problemRoleFilter === 'all'
                  ? 'border-green-600 bg-green-50/60 shadow-xs ring-1 ring-green-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">All Roles</span>
                <span className="text-base font-extrabold text-gray-900">{problems.length}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Total defined choices</p>
            </button>

            <button
              type="button"
              onClick={() => setProblemRoleFilter('employee')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                problemRoleFilter === 'employee'
                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700">👨‍💼 Candidate</span>
                <span className="text-base font-extrabold text-blue-900">
                  {problems.filter((p) => p.role === 'employee' || p.role === 'all').length}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Options visible to candidates</p>
            </button>

            <button
              type="button"
              onClick={() => setProblemRoleFilter('employer')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                problemRoleFilter === 'employer'
                  ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-1 ring-purple-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700">🏢 Employer</span>
                <span className="text-base font-extrabold text-purple-900">
                  {problems.filter((p) => p.role === 'employer' || p.role === 'all').length}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Options visible to employers</p>
            </button>

            <button
              type="button"
              onClick={() => setProblemRoleFilter('consultant')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                problemRoleFilter === 'consultant'
                  ? 'border-amber-600 bg-amber-50/70 shadow-xs ring-1 ring-amber-600'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700">🤝 Consultant</span>
                <span className="text-base font-extrabold text-amber-900">
                  {problems.filter((p) => p.role === 'consultant' || p.role === 'all').length}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Options visible to consultants</p>
            </button>
          </div>

          {/* Filter Bar with Search and Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All Roles', count: problems.length },
                { id: 'employee', label: '👨‍💼 Candidate', count: problems.filter((p) => p.role === 'employee' || p.role === 'all').length },
                { id: 'employer', label: '🏢 Employer', count: problems.filter((p) => p.role === 'employer' || p.role === 'all').length },
                { id: 'consultant', label: '🤝 Consultant', count: problems.filter((p) => p.role === 'consultant' || p.role === 'all').length },
                { id: 'universal', label: '🌐 Universal Only', count: problems.filter((p) => p.role === 'all').length },
              ].map((tab) => {
                const isActive = problemRoleFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProblemRoleFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-green-700 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                placeholder="Search problem title..."
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
            ) : (() => {
              const displayList = problems.filter((prob) => {
                const matchesRole =
                  problemRoleFilter === 'all'
                    ? true
                    : problemRoleFilter === 'universal'
                    ? prob.role === 'all'
                    : prob.role === problemRoleFilter || prob.role === 'all';
                const matchesSearch = problemSearch.trim()
                  ? prob.title.toLowerCase().includes(problemSearch.toLowerCase())
                  : true;
                return matchesRole && matchesSearch;
              });

              return displayList.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <SlidersHorizontal className="w-10 h-10 text-gray-300 mx-auto" />
                  <h4 className="text-base font-bold text-gray-800">No support problems found</h4>
                  <p className="text-xs text-gray-500">
                    {problemSearch
                      ? `No problems matching "${problemSearch}"`
                      : 'No problems defined for this role filter.'}
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
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-500">
                        <th className="py-3.5 px-5 w-20">Order</th>
                        <th className="py-3.5 px-6">Problem Title</th>
                        <th className="py-3.5 px-4 w-36">Role</th>
                        <th className="py-3.5 px-5 w-28">Status</th>
                        <th className="py-3.5 px-5 w-32 text-center">Toggle Active</th>
                        <th className="py-3.5 px-5 text-right w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {displayList.map((prob) => {
                        return (
                          <tr key={prob._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-5 font-bold text-gray-500">
                              #{prob.order || 0}
                            </td>

                            <td className="py-4 px-6 font-bold text-gray-900">
                              {prob.title}
                            </td>

                            <td className="py-4 px-4">
                              {prob.role === 'employee' ? (
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

              {/* Visual Role Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Target Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'employee', label: 'Candidate', icon: '👨‍💼', desc: 'Job seeker issues' },
                    { id: 'employer', label: 'Employer', icon: '🏢', desc: 'Recruiter & company issues' },
                    { id: 'consultant', label: 'Consultant', icon: '🤝', desc: 'Agency / partner issues' },
                    { id: 'all', label: 'All Roles', icon: '🌐', desc: 'Universal to everyone' },
                  ].map((r) => {
                    const isSel = problemFormRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setProblemFormRole(r.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSel
                            ? 'border-green-600 bg-green-50/80 text-green-950 ring-1 ring-green-600 font-bold shadow-xs'
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
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Select which users will see this problem choice in their widget step 2.
                </p>
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
                  placeholder="e.g. OTP not received, Unable to login, Resume upload error"
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
                  value={problemFormOrder}
                  onChange={(e) => setProblemFormOrder(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                />
                <p className="text-[11px] text-gray-400 mt-1">Lower numbers appear first in the widget selection list.</p>
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
