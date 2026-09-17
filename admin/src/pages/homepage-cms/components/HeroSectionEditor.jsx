import React from 'react';
import CMSGuidelineBanner from './CMSGuidelineBanner';

/**
 * HeroSectionEditor Component
 * Allows administrators to customize the homepage hero heading, highlighted gradient text,
 * and supportive tagline.
 */
const HeroSectionEditor = ({ data, onChange, onSave, isSaving }) => {
  const hero = data?.hero || {
    titlePrefix: 'Find Your',
    titleHighlight: 'Dream Job',
    subtitle: 'Discover opportunities that align with your passion and expertise.'
  };

  const handleFieldChange = (field, value) => {
    onChange('hero', { ...hero, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Hero Section</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize the main headline and introduction text displayed at the top of the homepage.
        </p>
      </div>

      {/* Guidelines Card */}
      <CMSGuidelineBanner
        title="Hero Copywriting Tips"
        points={[
          "Title Prefix: Keep it short (2-3 words) to lead naturally into the highlighted phrase.",
          "Title Highlight: This portion receives the eye-catching vibrant green gradient styling.",
          "Subtitle: Write a concise, welcoming sentence (15-25 words) that explains your platform's core benefit."
        ]}
      />

      {/* Editor Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Live Preview Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Live Hero Section Preview
          </label>
          <div className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/30 to-white border border-dashed border-gray-300 rounded-2xl p-8 sm:p-10 text-center space-y-3 shadow-inner">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#A5D6A7]/30 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#66BB6A]/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="relative z-10 space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#1B5E20] leading-tight">
                <span>{hero.titlePrefix || 'Find Your'} </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66BB6A] to-[#1B5E20]">
                  {hero.titleHighlight || 'Dream Job'}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-[#1B5E20]/75 font-medium max-w-xl mx-auto">
                {hero.subtitle || 'Discover opportunities that align with your passion and expertise.'}
              </p>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-5 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Headline Prefix (Deep Green: #1B5E20)
              </label>
              <input
                type="text"
                value={hero.titlePrefix || ''}
                onChange={(e) => handleFieldChange('titlePrefix', e.target.value)}
                placeholder="e.g. Find Your"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-[#1B5E20]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Headline Highlight (Green Gradient: #66BB6A → #1B5E20)
              </label>
              <input
                type="text"
                value={hero.titleHighlight || ''}
                onChange={(e) => handleFieldChange('titleHighlight', e.target.value)}
                placeholder="e.g. Dream Job"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#66BB6A] to-[#1B5E20]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Hero Tagline / Subtitle
            </label>
            <textarea
              rows="3"
              value={hero.subtitle || ''}
              onChange={(e) => handleFieldChange('subtitle', e.target.value)}
              placeholder="e.g. Discover opportunities that align with your passion and expertise."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium text-[#1B5E20]/80"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold shadow-md shadow-green-700/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Hero Changes'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default HeroSectionEditor;
