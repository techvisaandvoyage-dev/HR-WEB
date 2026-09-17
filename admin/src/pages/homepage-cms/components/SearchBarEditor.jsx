import React from 'react';
import CMSGuidelineBanner from './CMSGuidelineBanner';

/**
 * SearchBarEditor Component
 * Allows administrators to customize the homepage search bar placeholders and button label.
 */
const SearchBarEditor = ({ data, onChange, onSave, isSaving }) => {
  const searchBar = data?.searchBar || {
    jobPlaceholder: 'Job title...',
    locationPlaceholder: 'City, state, or country...',
    buttonText: 'Search Jobs',
    showArrow: true
  };

  const handleFieldChange = (field, value) => {
    onChange('searchBar', { ...searchBar, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Search Bar</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize the placeholder prompts and action button text on the main search bar.
        </p>
      </div>

      {/* Guidelines Card */}
      <CMSGuidelineBanner
        title="Search Bar Best Practices"
        points={[
          "Job Input: Prompt candidates with clear, familiar terms like 'Job title...', 'Role, or domain...', etc.",
          "Location Input: Indicate coverage like 'City, state, or country...' or 'Preferred location...'.",
          "Button Text: Use active verbs like 'Search Jobs', 'Find Opportunities', or 'Explore Jobs'."
        ]}
      />

      {/* Configuration Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Live Preview Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Live Search Bar Preview
          </label>
          <div className="bg-gradient-to-r from-gray-50 to-green-50/30 border border-dashed border-gray-300 rounded-2xl p-6 flex justify-center items-center">
            <div className="w-full max-w-2xl bg-white p-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-3">
              {/* Job Title Preview */}
              <div className="flex-1 flex items-center pl-3">
                <svg className="w-4 h-4 text-green-600 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-gray-400 font-medium truncate">
                  {searchBar.jobPlaceholder || 'Job title...'}
                </span>
              </div>

              {/* Divider */}
              <div className="h-6 w-[1px] bg-gray-200"></div>

              {/* Location Preview */}
              <div className="flex-1 flex items-center pl-2">
                <svg className="w-4 h-4 text-green-600 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-400 font-medium truncate">
                  {searchBar.locationPlaceholder || 'City, state, or country...'}
                </span>
              </div>

              {/* Button Preview */}
              <button
                type="button"
                className="px-5 py-2.5 bg-green-700 text-white rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-green-700/20 pointer-events-none shrink-0"
              >
                <span>{searchBar.buttonText || 'Search Jobs'}</span>
                {searchBar.showArrow && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-5 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Job Title Input Placeholder
              </label>
              <input
                type="text"
                value={searchBar.jobPlaceholder || ''}
                onChange={(e) => handleFieldChange('jobPlaceholder', e.target.value)}
                placeholder="e.g. Job title..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Location Input Placeholder
              </label>
              <input
                type="text"
                value={searchBar.locationPlaceholder || ''}
                onChange={(e) => handleFieldChange('locationPlaceholder', e.target.value)}
                placeholder="e.g. City, state, or country..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Search Button Label
              </label>
              <input
                type="text"
                value={searchBar.buttonText || ''}
                onChange={(e) => handleFieldChange('buttonText', e.target.value)}
                placeholder="e.g. Search Jobs"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>

            <div className="sm:pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchBar.showArrow ?? true}
                  onChange={(e) => handleFieldChange('showArrow', e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Show Arrow Icon (→) in Search Button
                </span>
              </label>
            </div>
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
              'Save Search Bar Changes'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SearchBarEditor;
