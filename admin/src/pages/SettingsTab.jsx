import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Mail, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sliders
} from 'lucide-react';
import DatabaseBackupManager from './DatabaseBackupManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState('backup');
  const [siteSettings, setSiteSettings] = useState({
    backupEmail: 'sonic16t@gmail.com'
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4500);
  };

  // Fetch Site Settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch(`${API_URL}/api/admin/site-settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setSiteSettings(prev => ({ 
          ...prev, 
          backupEmail: data.data.backupEmail || 'sonic16t@gmail.com' 
        }));
      }
    } catch (err) {
      console.error('Error fetching site settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch(`${API_URL}/api/admin/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Automated backup recipient email updated successfully!');
      } else {
        showError(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      showError('Error updating settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 w-full h-full overflow-y-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <AlertCircle className="w-5 h-5 text-white shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80">
              Admin Settings
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Database className="w-8 h-8 text-emerald-600" />
            Database & Backup Settings
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage single-file database backup & restore and automated email delivery.
          </p>
        </div>
      </div>

      {/* Settings Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-2 overflow-x-auto w-fit">
        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'backup'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <Database className="w-4 h-4" />
          Database Backup & Restore
        </button>

        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'general'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <Sliders className="w-4 h-4" />
          General & Automated Backup Email
        </button>
      </div>

      {/* SUB-TAB 1: DATABASE BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <DatabaseBackupManager />
      )}

      {/* SUB-TAB 2: GENERAL - ONLY AUTOMATED BACKUP RECIPIENT EMAIL */}
      {activeSubTab === 'general' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-xs max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Automated Backup Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Specify the email address where scheduled database backups will be sent automatically.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-800">
                Automated Backup Recipient Email
              </label>
              <input
                type="email"
                required
                value={siteSettings.backupEmail || ''}
                onChange={(e) => setSiteSettings({ ...siteSettings, backupEmail: e.target.value })}
                placeholder="sonic16t@gmail.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition-colors"
              />
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900 text-xs">
                <span className="font-bold">⏰ Scheduled Frequency:</span> The full database backup containing all collections (Admin, Employers, Employees, Jobs, CMS, Applications) will be dispatched to this email every 15 days as 1 single <code>.json</code> attachment.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings || loadingSettings}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Email Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
