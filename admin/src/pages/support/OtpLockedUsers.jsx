import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function OtpLockedUsers({ onLocksUpdated }) {
  const [lockedUsers, setLockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Keep ref to onLocksUpdated to avoid infinite render loops
  const onLocksUpdatedRef = useRef(onLocksUpdated);
  useEffect(() => {
    onLocksUpdatedRef.current = onLocksUpdated;
  }, [onLocksUpdated]);

  // Filters & Search
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'employee' | 'employer' | 'consultant'
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Row action loading map: userIdentifier -> boolean
  const [actionLoading, setActionLoading] = useState({});

  // Unlock Confirmation Modal
  const [userToUnlock, setUserToUnlock] = useState(null);

  // Toast Notification state: { show: boolean, type: 'success' | 'error', message: string }
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch locked users
  const fetchLockedUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`${API_URL}/api/admin/otp-locks?${params.toString()}`, {
        headers: {
          'x-admin-auth': 'true',
        },
      });
      const json = await res.json();

      if (json.success) {
        setLockedUsers(json.data || []);
        setTotalCount(json.counts?.totalLocked || (json.data ? json.data.length : 0));
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
        }
        if (onLocksUpdatedRef.current && typeof onLocksUpdatedRef.current === 'function') {
          onLocksUpdatedRef.current(json.activeLockedEmails || []);
        }
      } else {
        setError(json.message || 'Failed to load locked users');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, debouncedSearch]);

  useEffect(() => {
    fetchLockedUsers();
  }, [fetchLockedUsers]);

  // Perform Unlock
  const handleConfirmUnlock = async () => {
    if (!userToUnlock) return;

    const rowKey = `${userToUnlock.role}:${userToUnlock.email}`;
    setActionLoading((prev) => ({ ...prev, [rowKey]: true }));
    const target = userToUnlock;
    setUserToUnlock(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/otp-locks/unlock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': 'true',
        },
        body: JSON.stringify({
          role: target.role,
          userId: target.userId,
          email: target.email,
          phone: target.phone !== 'N/A' ? target.phone : '',
          reason: 'Manual unlock by administrator from dashboard',
        }),
      });

      const json = await res.json();

      if (json.success) {
        showToast(json.message || `OTP lock removed for ${target.email}`, 'success');
        fetchLockedUsers();
      } else {
        showToast(json.message || 'Failed to unlock user', 'error');
      }
    } catch (err) {
      showToast('Network error while unlocking user.', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [rowKey]: false }));
    }
  };

  // Render Role Badge
  const renderRoleBadge = (role) => {
    switch (role) {
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
            General
          </span>
        );
    }
  };

  // Format Lock Date Helper
  const formatLockDate = (dateStr) => {
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
    }) + ' IST';
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">OTP Locked Users</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Users temporarily locked out after 5 consecutive failed OTP attempts (24h lockout period).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Currently Locked</span>
            <span className="text-2xl font-black text-rose-600">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Box */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="otp-locks-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-600 focus:ring-2 focus:ring-green-600/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter & Refresh */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              id="otp-locks-role-filter"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-600 transition-colors cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="employee">Candidate (Employee)</option>
              <option value="employer">Employer</option>
              <option value="consultant">Consultant</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchLockedUsers}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-green-700 hover:bg-green-50 border border-gray-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Locked Users Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-green-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-bold text-gray-500">Checking locked accounts...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <button
              type="button"
              onClick={fetchLockedUsers}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : lockedUsers.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-gray-800">No locked accounts</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {search || roleFilter !== 'all'
                ? 'No locked accounts match your active search or role filter.'
                : 'All clear! No users are currently locked out of OTP verification.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-center">Failed Attempts</th>
                  <th className="py-3.5 px-5">Locked Until</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {lockedUsers.map((user) => {
                  const rowKey = `${user.role}:${user.email}`;
                  const isRowLoading = actionLoading[rowKey];

                  return (
                    <tr key={rowKey} className="hover:bg-rose-50/30 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-5 font-bold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center font-black text-xs shrink-0">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{user.name || 'Registration Pending'}</span>
                            {user.userId && (
                              <span className="text-[10px] text-gray-400 font-mono">ID: {String(user.userId).slice(-6)}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-gray-700">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={user.email}>{user.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{user.phone || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4">
                        {renderRoleBadge(user.role)}
                      </td>

                      {/* Failed Attempts */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                          {user.failedAttempts} / 5
                        </span>
                      </td>

                      {/* Locked Until */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-800 font-bold">
                            <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{formatLockDate(user.lockUntil)}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-rose-600 block pl-5">
                            {user.remainingLockTime}
                          </span>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setUserToUnlock(user)}
                          disabled={isRowLoading}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                          title="Manually remove OTP lock for this user"
                        >
                          {isRowLoading ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                          <span>Unlock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">
              Page {page} of {totalPages} ({totalCount} locked {totalCount === 1 ? 'user' : 'users'})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {userToUnlock && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Unlock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900">Remove OTP lock for this user?</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                This will reset failed OTP attempts to 0 and immediately clear the 24-hour lockout for{' '}
                <strong className="text-gray-900">{userToUnlock.email}</strong> under role{' '}
                <span className="capitalize font-bold text-green-700">{userToUnlock.role}</span>. The user will be able to request and verify OTP right away.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">User:</span>
                <span className="font-bold text-gray-900">{userToUnlock.name || 'Registration'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Email:</span>
                <span className="font-bold text-gray-900">{userToUnlock.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Locked Until:</span>
                <span className="font-bold text-rose-600">{userToUnlock.remainingLockTime}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToUnlock(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Yes, Remove Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
