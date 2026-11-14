import React from 'react';

const ProfileHero = ({
  formData,
  score,
  missing,
  onOpenAvatarModal,
  onOpenMissingModal,
  activeTab,
  onTabClick
}) => {
  const dashoffset = 377 - (377 * score / 100);
  const initials = ((formData.firstName?.[0] || 'U') + (formData.lastName?.[0] || '')).toUpperCase();

  return (
    <>
      {/* DESKTOP HEADER */}
      <div className="hidden md:flex bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex-row gap-8 items-center mb-6">
        
        {/* Left: Avatar with progress ring */}
        <div className="relative flex-shrink-0 group">
          <div className="cursor-pointer block relative z-10" onClick={onOpenAvatarModal}>
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-slate-100 flex items-center justify-center bg-slate-900 text-white font-extrabold text-2xl overflow-hidden group-hover:opacity-95 transition-opacity relative shadow-xs">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="tracking-wider">{initials}</span>
              )}
            </div>

            {/* Edit Pen Icon */}
            <div
              className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md border border-slate-200 text-slate-600 group-hover:text-emerald-700 group-hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Change profile photo"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>

          {/* SVG overlay for circular progress */}
          <svg className="absolute inset-0 w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90 pointer-events-none transition-all duration-1000 ease-out z-0">
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke={score === 100 ? "#059669" : "#F59E0B"}
              strokeWidth="4"
              fill="none"
              strokeDasharray="377"
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 rounded-full text-xs font-bold border border-slate-200 shadow-md transition-colors duration-1000 z-20 ${
              score === 100 ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {score}%
          </div>
        </div>

        {/* Middle: Name and details */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Profile last updated - Today</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-3">
            <div className="space-y-2.5">
              <p className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{formData.location || 'Location not set'}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{formData.isFresher ? 'Fresher' : (formData.designation || 'Experienced')}</span>
              </p>
            </div>
            <div className="space-y-2.5 sm:border-l sm:border-slate-100 sm:pl-6">
              <p className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{formData.phone ? `${formData.countryCode ? formData.countryCode + ' ' : ''}${formData.phone}` : 'N/A'}</span>
              </p>
              <p className="flex items-center gap-2.5 min-w-0">
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{formData.email}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-1" title="Verified email" />
              </p>
            </div>
          </div>
        </div>

        {/* Right: Missing details widget or 100% complete card */}
        {score === 100 || missing.length === 0 ? (
          <div className="w-full md:w-72 bg-emerald-50/70 rounded-2xl p-6 border border-emerald-200/90 flex-shrink-0 self-stretch flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-3xl font-black text-slate-900 block tracking-tight">100%</span>
            <span className="text-xs font-bold text-emerald-800 mt-1 block">Your profile is 100% complete!</span>
          </div>
        ) : (
          <div className="w-full md:w-80 bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-4 flex-shrink-0 self-stretch flex flex-col justify-between shadow-xs">
            <ul className="space-y-3 text-xs font-bold text-slate-700">
              {missing.slice(0, 3).map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => {
                    if (item.label === 'Add Profile Picture') {
                      onOpenAvatarModal();
                    } else {
                      document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <span className="flex items-center gap-2.5 group-hover:text-emerald-700 transition-colors truncate">
                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 shadow-xs group-hover:border-emerald-300 group-hover:text-emerald-700 transition-colors shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-full border border-emerald-200 text-[11px] shadow-xs shrink-0">
                    ↑ {item.points}%
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={onOpenMissingModal}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs hover:shadow cursor-pointer"
            >
              Add {missing.length} missing detail{missing.length > 1 ? 's' : ''}
            </button>
          </div>
        )}

      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex flex-col pt-4 pb-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-4">
        {/* 1. Avatar Section */}
        <div className="mb-4 flex items-center gap-4">
          <div className="relative inline-block cursor-pointer" onClick={onOpenAvatarModal}>
            <div className="w-[84px] h-[84px] rounded-full bg-slate-900 text-white font-black text-xl flex items-center justify-center overflow-hidden border-2 border-white shadow-xs">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="tracking-wider">{initials}</span>
              )}
            </div>
            {/* Edit Pen Icon */}
            <div className="absolute bottom-0 right-0 bg-white rounded-full w-[26px] h-[26px] flex items-center justify-center border border-slate-200 text-slate-600 shadow-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900 leading-tight truncate">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Profile last updated - Today</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${score}%` }}></div>
              </div>
              <span className="text-xs font-bold text-emerald-700">{score}%</span>
            </div>
          </div>
        </div>

        {missing.length > 0 && (
          <button
            onClick={onOpenMissingModal}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer mt-2"
          >
            Add {missing.length} missing detail{missing.length > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </>
  );
};

export default ProfileHero;
