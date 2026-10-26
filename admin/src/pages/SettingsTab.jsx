import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  Database, 
  Mail, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Send,
  Sparkles,
  Globe,
  Search,
  Share2,
  Eye,
  KeyRound,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import DatabaseBackupManager from './DatabaseBackupManager';
import SEOSettingsManager from './SEOSettingsManager';
import AuthorizedAdminsManager from './AuthorizedAdminsManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SettingsTab({ initialSubTab }) {
  const [activeSidebarTab, setActiveSidebarTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subtab') || (params.get('tab') === 'seo' ? 'seo' : null);
    if (sub === 'seo' || sub === 'backup' || sub === 'admins') return sub;
    return initialSubTab || 'backup';
  });

  const handleSelectSidebarTab = (tabId) => {
    setActiveSidebarTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set('subtab', tabId);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };
  const [siteSettings, setSiteSettings] = useState({
    backupEmail: 'sonic16t@gmail.com'
  });
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: 'sahijob.com - Find Your Dream Job in India | Top Recruitment Portal',
    metaDescription: 'Search and apply for top jobs in IT, Sales, Marketing, and Engineering across India on sahijob.com. Connect with verified employers and get hired.',
    metaKeywords: 'jobs in india, freshers jobs, it jobs, marketing careers, sahijob, recruitment portal',
    canonicalUrl: 'https://sahijob.com',
    ogTitle: 'sahijob.com - Find Your Dream Job in India',
    ogDescription: 'Connect with top verified employers and fast-track your career with SahiJob.',
    ogImage: '',
    googleSiteVerification: '',
    googleAnalyticsId: '',
    robotsDirective: 'index, follow'
  });

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [downloadingInstant, setDownloadingInstant] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const sidebarTabs = [
    {
      id: 'backup',
      label: 'Backup',
      description: 'Database & Auto Email',
      icon: Database
    },
    {
      id: 'seo',
      label: 'SEO',
      description: 'Meta Tags & Search',
      icon: Globe
    },
    {
      id: 'admins',
      label: 'Admin Access',
      description: 'Authorized Login Emails',
      icon: ShieldCheck
    }
  ];

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
          backupEmail: data.data.backupEmail || 'sonic16t@gmail.com',
          lastBackupSentAt: data.data.lastBackupSentAt || '2026-09-25T14:06:31.000Z'
        }));
        if (data.data.seo) {
          setSeoSettings(prev => ({ ...prev, ...data.data.seo }));
        }
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

  const handleSaveSeo = async (e) => {
    e.preventDefault();
    try {
      setSavingSeo(true);
      const res = await fetch(`${API_URL}/api/admin/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo: seoSettings })
      });
      const data = await res.json();
      if (data.success) {
        showToast('SEO settings saved and published successfully!');
      } else {
        showError(data.message || 'Failed to save SEO settings.');
      }
    } catch (err) {
      showError('Error saving SEO settings.');
    } finally {
      setSavingSeo(false);
    }
  };

  // Instant send backup to email right now
  const handleSendBackupNow = async () => {
    if (!siteSettings.backupEmail) {
      showError('Please enter an email address first.');
      return;
    }
    try {
      setSendingTestEmail(true);
      const res = await fetch(`${API_URL}/api/admin/backup/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: siteSettings.backupEmail })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Backup successfully emailed to ${siteSettings.backupEmail}!`);
        fetchSettings();
      } else {
        showError(data.message || 'Failed to email backup file.');
      }
    } catch (err) {
      console.error('Error sending test backup email:', err);
      showError('Server error while sending backup email.');
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Direct download instant backup file (.json)
  const handleDownloadBackup = async () => {
    try {
      setDownloadingInstant(true);
      const res = await fetch(`${API_URL}/api/admin/backup/download-instant`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `sahijob_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Database backup downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      showError('Could not download instant backup.');
    } finally {
      setDownloadingInstant(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-[#f8fafc]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <AlertCircle className="w-5 h-5 text-white shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-white border-r border-gray-200/80 p-5 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                Settings
              </h2>
              <p className="text-[11px] text-gray-500">
                Portal Management
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          {sidebarTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSidebarTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectSidebarTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{tab.label}</div>
                  {tab.description && (
                    <div className="text-[10px] font-normal text-gray-400 truncate">{tab.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Info Banner */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100/80 rounded-2xl text-xs space-y-1">
          <p className="font-bold text-emerald-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            System Automation
          </p>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            Keep your portal database and search ranking optimized.
          </p>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-6 lg:p-8 space-y-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* TAB 1: BACKUP */}
          {activeSidebarTab === 'backup' && (
            <>
              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80">
                      System & Database
                    </span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                    <Database className="w-8 h-8 text-emerald-600 shrink-0" />
                    Database Backup & Restore
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm max-w-2xl">
                    Configure scheduled database automated email deliveries and restore your complete portal database from single-file JSON backups.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={downloadingInstant}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl border border-gray-200/90 shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
                  title="Download direct JSON backup to your computer"
                >
                  {downloadingInstant ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <Download className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>Download Backup (.json)</span>
                </button>
              </div>

              {/* SECTION 1: AUTOMATED BACKUP EMAIL SETTINGS */}
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Automated Backup Settings</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Specify the email address where scheduled database backups will be sent automatically.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-5 pt-1">
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
                    
                    <div className="p-4 bg-emerald-50/70 border border-emerald-100/90 rounded-2xl text-emerald-900 text-xs space-y-2">
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 flex-1">
                          <span className="font-bold">⏰ Scheduled Frequency (Every 15 Days):</span>
                          <p className="text-emerald-800 text-[11px] leading-relaxed">
                            The full database backup containing all collections (Admin, Employers, Employees, Jobs, CMS, Applications) is automatically dispatched to this email every 15 days as 1 single attached <code>.json</code> file.
                          </p>
                        </div>
                      </div>

                      {siteSettings.lastBackupSentAt && (
                        <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px]">
                          <div>
                            <span className="text-emerald-700 font-medium">Last Sent: </span>
                            <strong className="text-emerald-950 font-bold">
                              {new Date(siteSettings.lastBackupSentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </strong>
                          </div>
                          <div>
                            <span className="text-emerald-700 font-medium">Next Scheduled: </span>
                            <strong className="text-emerald-950 font-bold">
                              {new Date(new Date(siteSettings.lastBackupSentAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleSendBackupNow}
                      disabled={sendingTestEmail || !siteSettings.backupEmail}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      {sendingTestEmail ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>Send Backup Now to Email</span>
                    </button>

                    <button
                      type="submit"
                      disabled={savingSettings || loadingSettings}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {savingSettings ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Email Settings</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION 2: DATABASE BACKUP & RESTORE */}
              <div className="space-y-4">
                <DatabaseBackupManager hideHeader={true} />
              </div>
            </>
          )}

          {/* TAB 2: SEO */}
          {activeSidebarTab === 'seo' && (
            <SEOSettingsManager />
          )}

          {/* TAB 3: AUTHORIZED ADMINS */}
          {activeSidebarTab === 'admins' && (
            <AuthorizedAdminsManager />
          )}

        </div>
      </main>

    </div>
  );
}
