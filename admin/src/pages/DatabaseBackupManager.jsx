import React, { useState, useRef } from 'react';
import { 
  Database, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  HardDrive,
  FileCheck2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DatabaseBackupManager({ onRestoreComplete }) {
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedBackup, setParsedBackup] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // File Selection & Parsing for Restore
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json.collections || typeof json.collections !== 'object') {
          throw new Error('Invalid backup format: "collections" data not found in JSON.');
        }
        setParsedBackup(json);
      } catch (err) {
        console.error('JSON parse error:', err);
        setParseError(err.message || 'Invalid JSON file');
        setParsedBackup(null);
      }
    };
    reader.readAsText(file);
  };

  // Perform Restore
  const handleConfirmRestore = async () => {
    if (!parsedBackup) return;
    setRestoring(true);
    setConfirmModal(false);

    try {
      const res = await fetch(`${API_URL}/api/admin/backup/upload-restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData: parsedBackup })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Database restored successfully!');
        setSelectedFile(null);
        setParsedBackup(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onRestoreComplete) onRestoreComplete();
      } else {
        showError(data.message || 'Failed to restore database.');
      }
    } catch (err) {
      console.error('Restore error:', err);
      showError('Server error while restoring database.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-[300] bg-emerald-700 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 right-8 z-[300] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-200 shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">Restore Database Backup?</h3>
              <p className="text-xs text-gray-500">
                This will overwrite existing database records (Employers, Employees, Jobs, CMS settings, etc.) with data from:
              </p>
              <p className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block">
                {selectedFile?.name || 'Uploaded Backup'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Confirm & Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80 inline-block mb-1.5">
          Database Restoration
        </span>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <Database className="w-6 h-6 text-emerald-600" />
          Upload & Restore Database
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Upload your single-file backup JSON received via email to restore all portal data (Employees, Employers, Jobs, CMS, Applications) in 1 click.
        </p>
      </div>

      {/* Upload Backup File Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-xs space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Select Backup File (.json)</h3>
              <p className="text-xs text-gray-500">Attach the single `.json` backup file that was emailed to your inbox.</p>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`p-10 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
              selectedFile ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200 hover:border-emerald-400 bg-gray-50/50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
            <FileCheck2 className={`w-12 h-12 mx-auto mb-3 ${selectedFile ? 'text-emerald-600' : 'text-gray-400'}`} />
            <p className="text-sm font-bold text-gray-800">
              {selectedFile ? selectedFile.name : 'Click to Browse or Drag & Drop Backup .json file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports single-file complete SahiJob database backups
            </p>
          </div>

          {/* Error if parsing failed */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed File Preview */}
          {parsedBackup && (
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200/70 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span>Backup Verified — Ready to Restore:</span>
                <span className="text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {Object.keys(parsedBackup.collections || {}).length} Collections Detected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                {Object.keys(parsedBackup.collections || {}).map((colKey) => (
                  <div key={colKey} className="p-3 bg-white rounded-xl border border-gray-100 shadow-2xs">
                    <span className="font-semibold text-gray-600 block truncate">{colKey}</span>
                    <span className="font-black text-gray-900 text-xs">
                      {Array.isArray(parsedBackup.collections[colKey]) ? parsedBackup.collections[colKey].length : 0} records
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={!parsedBackup || restoring}
            onClick={() => setConfirmModal(true)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {restoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
            <span>Restore Database from Uploaded File</span>
          </button>
        </div>
      </div>
    </div>
  );
}
