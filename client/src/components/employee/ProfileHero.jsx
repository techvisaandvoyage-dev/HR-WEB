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

  return (
    <>
      {/* DESKTOP HEADER (Original exact design restored) */}
      <div className="hidden md:flex bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex-row gap-8 items-center">
        
        {/* Left: Avatar with progress ring */}
        <div className="relative flex-shrink-0 group">
          <div className="cursor-pointer block relative z-10" onClick={onOpenAvatarModal}>
            <div className="w-32 h-32 rounded-full border-4 border-[#F3F4F6] flex items-center justify-center bg-[#E5E7EB] overflow-hidden group-hover:opacity-90 transition-opacity relative">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-20 h-20 text-white translate-y-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>

            {/* Edit Pen Icon */}
            <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-gray-500 group-hover:text-green-600 group-hover:bg-green-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </div>
          </div>

          {/* SVG overlay for circular progress */}
          <svg className="absolute inset-0 w-32 h-32 transform -rotate-90 pointer-events-none transition-all duration-1000 ease-out z-0">
             <circle cx="64" cy="64" r="60" stroke={score === 100 ? "#16a34a" : "#F59E0B"} strokeWidth="4" fill="none" strokeDasharray="377" strokeDashoffset={dashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 rounded-full text-xs font-bold border border-gray-100 shadow-md transition-colors duration-1000 z-20 ${score === 100 ? 'text-green-600' : 'text-orange-500'}`}>
            {score}%
          </div>
        </div>

        {/* Middle: Name and details */}
        <div className="flex-1 space-y-5">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-sm text-gray-400 mt-1">Profile last updated - Today</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
            <div className="space-y-3">
              <p className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {formData.location || 'Location not set'}
              </p>
              <p className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {formData.isFresher ? 'Fresher' : (formData.designation || 'Experienced')}
              </p>
            </div>
            <div className="space-y-3 sm:border-l sm:border-gray-100 sm:pl-6">
              <p className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {formData.phone ? `${formData.countryCode ? formData.countryCode + ' ' : ''}${formData.phone}` : 'N/A'}
                <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </p>
              <p className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {formData.email}
                <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Missing details widget */}
        <div className="w-full md:w-80 bg-[#FFF8EE] rounded-xl p-6 border border-orange-100 space-y-5 flex-shrink-0 self-stretch flex flex-col justify-between">
          <ul className="space-y-4 text-sm font-semibold text-gray-700">
            {missing.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-center justify-between cursor-pointer group" onClick={() => {
                if (item.label === 'Add Profile Picture') {
                  onOpenAvatarModal();
                } else {
                  document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' });
                }
              }}>
                <span className="flex items-center gap-3 group-hover:text-green-600 transition-colors">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 text-gray-500 shadow-sm group-hover:border-green-300 group-hover:text-green-600 transition-colors">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </div>
                  {item.label}
                </span>
                <span className="text-green-600 font-bold bg-white px-2 py-1 rounded border border-green-100 text-xs shadow-sm">↑ {item.points}%</span>
              </li>
            ))}
            {missing.length === 0 && (
              <li className="text-green-600 font-bold text-center py-8">
                <span className="text-3xl block mb-2">🎉</span>
                Your profile is 100% complete!
              </li>
            )}
          </ul>
          {missing.length > 0 && (
            <button onClick={onOpenMissingModal} className="w-full py-2.5 mt-2 bg-[#F05A41] hover:bg-[#d94a32] text-white font-bold rounded-full transition-all shadow-lg shadow-[#F05A41]/30 hover:shadow-[#F05A41]/50 transform hover:-translate-y-0.5">
              Add {missing.length} missing detail{missing.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

      </div>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex flex-col pt-4 pb-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-4">
        {/* 1. Avatar Section */}
        <div className="mb-4 flex items-center gap-4">
          <div className="relative inline-block" onClick={onOpenAvatarModal}>
            <div className="w-[88px] h-[88px] rounded-full bg-[#EAEAF0] flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-14 h-14 text-white translate-y-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            {/* Edit Pen Icon */}
            <div className="absolute bottom-0 right-0 bg-white rounded-full w-[28px] h-[28px] flex items-center justify-center border border-gray-200 text-gray-600 shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-xs text-gray-500 mt-1">Profile last updated - Today</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${score}%` }}></div>
              </div>
              <span className="text-xs font-bold text-amber-600">{score}%</span>
            </div>
          </div>
        </div>

        {missing.length > 0 && (
          <button
            onClick={onOpenMissingModal}
            className="w-full py-2.5 bg-[#F05A41] hover:bg-[#d94a32] text-white text-sm font-bold rounded-full transition-all shadow-md shadow-[#F05A41]/25 mt-2"
          >
            Add {missing.length} missing detail{missing.length > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </>
  );
};

export default ProfileHero;
