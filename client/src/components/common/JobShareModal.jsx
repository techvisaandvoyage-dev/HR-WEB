import React, { useState } from 'react';

const JobShareModal = ({ isOpen, onClose, job, isNewlyPublished = false }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !job) return null;

  const jobId = job._id || job.id;
  const baseUrl = window.location.origin;
  const applyUrl = `${baseUrl}/apply-job/${jobId}`;
  const jobTitle = job.title || job.details?.jobTitle || 'Job Opening';
  const companyName = job.company || job.companyName || 'Company';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `🔥 Hiring Alert: *${jobTitle}* at *${companyName}*\n\n` +
    `Apply directly using this link:\n${applyUrl}\n\n` +
    `Explore more jobs on https://sahijob.com`
  );

  const emailSubject = encodeURIComponent(`Job Opportunity: ${jobTitle} at ${companyName}`);
  const emailBody = encodeURIComponent(
    `Hi,\n\nI wanted to share this job opening for ${jobTitle} at ${companyName}.\n\nYou can apply directly here:\n${applyUrl}\n\nBest regards.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {isNewlyPublished ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-green-100 text-green-800">
                  🎉 Published Successfully!
                </span>
              </div>
            ) : (
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Direct Candidate Application Link
              </span>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
              {isNewlyPublished ? "Share Direct Apply Link" : `Share "${jobTitle}"`}
            </h3>
            <p className="text-xs text-gray-500">
              Anyone opening this link can directly login/register, answer screening questions, and upload their CV.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Job Mini Preview */}
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 font-black flex items-center justify-center text-sm shrink-0">
            {job.companyInitial || companyName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-gray-900 truncate">{jobTitle}</h4>
            <p className="text-[11px] text-gray-500 truncate">{companyName} • {job.location || 'Hybrid'}</p>
          </div>
        </div>

        {/* Copy Link Input Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700">Direct Application Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={applyUrl}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-700 focus:outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[#29953f] hover:bg-green-700 text-white'
              }`}
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="space-y-2 pt-1">
          <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Share</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
            >
              <span>💬</span> WhatsApp
            </a>

            {/* Email */}
            <a
              href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
              className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-colors"
            >
              <span>✉️</span> Email
            </a>

            {/* Preview Link */}
            <a
              href={applyUrl}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-colors"
            >
              <span>↗</span> Open Preview
            </a>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default JobShareModal;
