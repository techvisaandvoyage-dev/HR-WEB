import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  Unlock,
  X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAdminHeaders = (json = false) => {
  const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const roleLabel = (role) => ({
  candidate: 'Candidate',
  employer: 'Employer',
  consultant: 'Consultant'
}[role] || role);

const formatDate = (value) => value
  ? new Date(value).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  : '—';

export default function BlockedAccounts({ onCountChange }) {
  const [accounts, setAccounts] = useState([]);
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({ total: 0, auto: 0, manual: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [source, setSource] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [error, setError] = useState('');
  const [eventsError, setEventsError] = useState('');
  const [showEvents, setShowEvents] = useState(false);
  const [pendingUnblock, setPendingUnblock] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      role,
      source
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    try {
      const response = await fetch(`${API_URL}/api/admin/blocked-accounts?${params}`, {
        headers: getAdminHeaders()
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load blocked accounts.');
      setAccounts(result.data || []);
      setCounts(result.counts || { total: 0, auto: 0, manual: 0 });
      setTotalPages(result.pagination?.totalPages || 1);
      onCountChange?.(result.counts?.total || 0);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load blocked accounts.');
    } finally {
      setLoading(false);
    }
  }, [page, role, source, debouncedSearch, onCountChange]);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    setEventsError('');
    try {
      const response = await fetch(`${API_URL}/api/admin/security-events?page=1&limit=20`, {
        headers: getAdminHeaders()
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to load security events.');
      setEvents(result.data || []);
    } catch (requestError) {
      setEventsError(requestError.message || 'Unable to load security events.');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (showEvents && events.length === 0 && !eventsError) fetchEvents();
  }, [showEvents, events.length, eventsError, fetchEvents]);

  const confirmUnblock = async () => {
    if (!pendingUnblock) return;
    const account = pendingUnblock;
    setBusyId(String(account._id));
    setPendingUnblock(null);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${account.role}/${account._id}/unblock`,
        { method: 'PATCH', headers: getAdminHeaders(true) }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Failed to unblock account.');
      setAccounts((current) => current.filter((entry) => String(entry._id) !== String(account._id)));
      setCounts((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
        [account.source]: Math.max(0, current[account.source] - 1)
      }));
      setToast(result.warning
        ? `${result.message || `Unblocked ${account.name || account.email}.`} ${result.warning}`
        : `Unblocked ${account.name || account.email}.`);
    } catch (requestError) {
      setToast(requestError.message || 'Failed to unblock account.');
    } finally {
      setBusyId('');
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-6 right-6 z-[120] flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-800 shadow-xl">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-900">Blocked Accounts</h2>
          <p className="mt-1 text-xs text-gray-500">
            Accounts blocked automatically for suspicious activity or manually by admins.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Total blocked', counts.total, 'text-rose-700'],
            ['Auto-blocked', counts.auto, 'text-amber-700'],
            ['Manually blocked', counts.manual, 'text-gray-700']
          ].map(([label, count, color]) => (
            <div key={label} className="min-w-[88px] rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <span className="block text-[10px] font-bold uppercase text-gray-500">{label}</span>
              <span className={`text-lg font-black ${color}`}>{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs md:flex-row md:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, or phone..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs outline-none focus:border-green-600 focus:bg-white"
          />
        </div>
        <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-700">
          <option value="all">All Roles</option>
          <option value="candidate">Candidate</option>
          <option value="employer">Employer</option>
          <option value="consultant">Consultant</option>
        </select>
        <select value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-700">
          <option value="all">All Sources</option>
          <option value="auto">Auto</option>
          <option value="manual">Manual</option>
        </select>
        <button type="button" onClick={fetchAccounts} disabled={loading} title="Refresh blocked accounts" className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-sm font-bold text-gray-500">Loading blocked accounts...</div>
        ) : error ? (
          <div className="space-y-3 py-16 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button type="button" onClick={fetchAccounts} className="rounded-xl bg-green-700 px-4 py-2 text-xs font-bold text-white">Retry</button>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="mt-3 text-base font-bold text-gray-800">No blocked accounts. All clear!</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email / Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Block reason</th>
                  <th className="px-4 py-3">Blocked by</th>
                  <th className="px-4 py-3">Blocked on</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((account) => (
                  <tr key={`${account.role}:${account._id}`} className="hover:bg-rose-50/20">
                    <td className="px-4 py-3.5 font-bold text-gray-900">
                      <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 font-black text-rose-700">
                        {(account.name || 'U').charAt(0).toUpperCase()}
                      </span>
                      {account.name || 'Account'}
                    </td>
                    <td className="space-y-1 px-4 py-3.5 text-gray-600">
                      <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{account.email}</span>
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{account.phone || '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        account.role === 'candidate' ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : account.role === 'consultant' ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-purple-200 bg-purple-50 text-purple-700'
                      }`}>{roleLabel(account.role)}</span>
                    </td>
                    <td className="max-w-[240px] whitespace-normal px-4 py-3.5 text-gray-700">{account.blockReason || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        account.source === 'auto' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>{account.source === 'auto' ? 'System' : account.blockedByName || 'Admin'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-gray-600">{formatDate(account.blockedAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button type="button" onClick={() => setPendingUnblock(account)} disabled={busyId === String(account._id)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                        {busyId === String(account._id) ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4">
            <span className="text-xs font-bold text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40"><ChevronLeft className="inline h-3.5 w-3.5" /> Previous</button>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs disabled:opacity-40">Next <ChevronRight className="inline h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <button type="button" onClick={() => setShowEvents((value) => !value)} className="flex w-full items-center justify-between p-4 text-left">
          <span className="font-bold text-gray-900">Security Log</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showEvents ? 'rotate-180' : ''}`} />
        </button>
        {showEvents && (
          <div className="border-t border-gray-100">
            {loadingEvents ? <p className="p-6 text-center text-xs text-gray-500">Loading security events...</p>
              : eventsError ? <p className="p-6 text-center text-xs text-rose-600">{eventsError}</p>
                : events.length === 0 ? <p className="p-6 text-center text-xs text-gray-500">No recent security events.</p>
                  : <div className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <div key={event._id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_2fr] sm:items-center">
                        <span className="flex items-center gap-1.5 text-gray-600"><Clock className="h-3.5 w-3.5" />{formatDate(event.createdAt)}</span>
                        <span className="font-semibold text-gray-900">{event.userName} {event.email && <span className="block font-normal text-gray-500">{event.email}</span>}</span>
                        <span className="capitalize text-gray-600">{roleLabel(event.role)}</span>
                        <span className="w-fit rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700">{event.type}</span>
                        <span className="font-mono text-gray-600">{event.ip || '—'}</span>
                        <span className="text-gray-600">{event.note || event.path || '—'}</span>
                      </div>
                    ))}
                  </div>}
          </div>
        )}
      </section>

      {pendingUnblock && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Unlock className="h-5 w-5" /></div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Unblock this account?</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">{pendingUnblock.name} ({pendingUnblock.email}) will be able to sign in again.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPendingUnblock(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700">Cancel</button>
              <button type="button" onClick={confirmUnblock} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Confirm Unblock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
