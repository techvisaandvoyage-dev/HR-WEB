import React from 'react';
import VideoPlayer from './VideoPlayer';

export default function CandidateVideoCard({
  videoUrl,
  hasVideo = false,
  isVideoLocked = false,
  videoVisibility = 'everyone',
  appliedToYou = false,
  employerProfile = null,
  maxPlayerHeight = '240px',
  className = ''
}) {
  // If candidate chose 'applied' and hasn't applied to this employer, it's hidden
  if (videoVisibility === 'applied' && !appliedToYou) {
    return null;
  }

  // Check if candidate actually has a video
  const candidateHasVideo = Boolean(videoUrl || hasVideo || isVideoLocked);
  if (!candidateHasVideo) return null;

  // Video is unlocked if server provided a valid video URL and it is not locked
  const canViewVideo = Boolean(videoUrl && !isVideoLocked);

  const handleOpenSupport = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-support-widget', {
      detail: {
        tab: 'new',
        prefillMessage: "Hello Support Team, I would like to request access to view candidate introductory videos on our recruiter account."
      }
    }));
  };

  const mailtoSubject = encodeURIComponent("Request to Unlock Candidate Introductory Video Feature");
  const employerIdentifier = employerProfile?.companyName || employerProfile?.fullName || 'Employer';
  const employerEmail = employerProfile?.email || '';
  const employerPhone = employerProfile?.mobile ? `${employerProfile?.countryCode || '+91'} ${employerProfile?.mobile}` : '';
  const mailtoBody = encodeURIComponent(
    `Hello SahiJob Support Team,\n\nI would like to request access to view candidate introductory videos on our recruiter account.\n\nRecruiter / Company: ${employerIdentifier}\nEmail: ${employerEmail}\nPhone: ${employerPhone}\n\nPlease help activate this premium feature.\n\nThank you!`
  );

  const handleComposeEmail = (e) => {
    if (e) e.preventDefault();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=support@sahijob.com&su=${mailtoSubject}&body=${mailtoBody}`;
    const mailtoUrl = `mailto:support@sahijob.com?subject=${mailtoSubject}&body=${mailtoBody}`;
    
    // Direct open web email composer in new tab
    const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = mailtoUrl;
    }
  };

  // 1. UNLOCKED STATE (Admin has granted access)
  if (canViewVideo && videoUrl) {
    return (
      <div className={`p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-2.5 shadow-2xs ${className}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">Introductory Video</p>
              <p className="text-[11px] text-gray-500 truncate">Candidate Video Introduction</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Unlocked
            </span>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="px-3 py-1.5 bg-[#0c7844] hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
            >
              Watch Video
            </a>
          </div>
        </div>
        <VideoPlayer url={videoUrl} maxPlayerHeight={maxPlayerHeight} className="mt-2" />
      </div>
    );
  }

  // 2. LOCKED STATE (Default: Requires Support contact or email to activate)
  return (
    <div className={`p-4 bg-linear-to-br from-amber-50/90 via-orange-50/70 to-amber-50/90 rounded-2xl border border-amber-200/90 shadow-2xs space-y-3.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate flex items-center gap-1.5">
              <span>Candidate Introduction Video</span>
            </h4>
            <p className="text-[11px] text-gray-500 truncate">Personalized video profile uploaded by candidate</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shrink-0 shadow-2xs">
          <svg className="w-3 h-3 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Premium Feature</span>
        </span>
      </div>

      {/* Locked message box */}
      <div className="bg-white/90 backdrop-blur-xs rounded-xl p-3.5 border border-amber-200/80 space-y-2.5">
        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          This candidate has uploaded an introductory video profile. To view candidate introduction videos, please contact our <strong className="text-gray-900">Support Team</strong> or email us at{' '}
          <button
            type="button"
            onClick={handleComposeEmail}
            className="text-[#0c7844] font-bold hover:underline cursor-pointer inline p-0 bg-transparent border-0"
          >
            support@sahijob.com
          </button>{' '}
          to activate this premium feature for your recruiter account.
        </p>

        {/* Action Buttons */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenSupport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0c7844] hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Contact Support Team</span>
          </button>

          <button
            type="button"
            onClick={handleComposeEmail}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-gray-800 font-bold text-xs rounded-lg border border-amber-300 transition-colors shadow-2xs cursor-pointer"
            title="Compose direct email to support@sahijob.com"
          >
            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email: support@sahijob.com</span>
          </button>
        </div>
      </div>
    </div>
  );
}

