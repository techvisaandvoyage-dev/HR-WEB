import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronDown, ShieldAlert, Unlock, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const adminHeaders = (json = false) => {
  const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken');
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export default function AccountStatusControl({ account, accountId, email, role, onUpdate, mode = 'both' }) {
  const status = account?.status === 'blocked' ? 'blocked' : 'active';
  const [dialog, setDialog] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const controlRef = useRef(null);
  const ownAdminEmail = (sessionStorage.getItem('adminEmail') || localStorage.getItem('adminEmail') || '').toLowerCase();
  const isOwnAccount = Boolean(ownAdminEmail && email?.toLowerCase() === ownAdminEmail);
  const showStatus = mode !== 'action';
  const showActionButton = mode === 'action' || mode === 'both';
  const showDialogs = true;

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeMenu = (event) => {
      if (!controlRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [menuOpen]);

  const saveStatus = async () => {
    if (dialog === 'block' && !reason.trim()) {
      setError('Please enter a reason before blocking this account.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const method = 'PATCH';
      const endpointAction = dialog === 'block' ? 'block' : 'unblock';
      const response = await fetch(`${API_URL}/api/admin/users/${role}/${accountId}/${endpointAction}`, {
        method,
        headers: adminHeaders(true),
        ...(dialog === 'block' ? { body: JSON.stringify({ reason: reason.trim() }) } : {})
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to update account status.');
      onUpdate?.(result.data);
      setToast(result.warning
        ? `${result.message || 'Account status updated.'} ${result.warning}`
        : result.message || (dialog === 'block' ? 'Account blocked.' : 'Account unblocked.'));
      setDialog('');
      setReason('');
      setTimeout(() => setToast(''), 3500);
    } catch (requestError) {
      setError(requestError.message || 'Network error while updating account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={controlRef} className={`relative flex ${mode === 'both' ? 'flex-col items-end gap-2' : 'items-center justify-center'}`}>
      {showStatus && (
        isOwnAccount ? (
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
            status === 'blocked'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {status === 'blocked' ? 'Blocked' : 'Active'}
          </span>
        ) : mode === 'status' ? (
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
              status === 'blocked'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {status === 'blocked' ? 'Blocked' : 'Active'}
            <ChevronDown className="h-3 w-3" />
          </button>
        ) : (
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
            status === 'blocked'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {status === 'blocked' ? 'Blocked' : 'Active'}
          </span>
        )
      )}
      {mode === 'status' && menuOpen && !isOwnAccount && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 min-w-32 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setError('');
              setDialog(status === 'blocked' ? 'unblock' : 'block');
            }}
            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
              status === 'blocked'
                ? 'text-emerald-700 hover:bg-emerald-50'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            {status === 'blocked' ? 'Unblock' : 'Block'}
          </button>
        </div>
      )}
      {showActionButton && !isOwnAccount && (
        <button
          type="button"
          onClick={() => { setError(''); setDialog(status === 'blocked' ? 'unblock' : 'block'); }}
          className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
            status === 'blocked'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          {status === 'blocked' ? 'Unblock' : 'Block'}
        </button>
      )}

      {showDialogs && toast && (
        <div className="fixed right-6 top-6 z-[140] flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-lg">
          {toast}
          <button type="button" onClick={() => setToast('')} aria-label="Dismiss notification"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {showDialogs && dialog && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${dialog === 'block' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
              {dialog === 'block' ? <ShieldAlert className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">{dialog === 'block' ? 'Block this account?' : 'Unblock this account?'}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {dialog === 'block'
                  ? `This account (${email}) will no longer be able to sign in.`
                  : `This account (${email}) will be able to sign in again.`}
              </p>
            </div>
            {dialog === 'block' && (
              <div className="w-full min-w-0">
                <label htmlFor={`account-block-reason-${accountId}`} className="block text-xs font-bold text-gray-700">
                  Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id={`account-block-reason-${accountId}`}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Provide a reason for blocking this account..."
                  className="mt-1.5 block box-border min-h-28 w-full min-w-0 resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium leading-5 text-gray-800 outline-none focus:border-emerald-500"
                />
                <span className="mt-1 block text-right font-normal text-gray-400">{reason.length}/500</span>
              </div>
            )}
            {error && <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-600"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => setDialog('')} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={saving} onClick={saveStatus} className={`rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${dialog === 'block' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {saving ? 'Saving...' : dialog === 'block' ? 'Block Account' : 'Confirm Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
