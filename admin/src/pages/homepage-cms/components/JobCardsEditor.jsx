import React from 'react';
import CMSGuidelineBanner from './CMSGuidelineBanner';

/**
 * JobCardsEditor Component
 * Allows administrators to customize the homepage job cards section heading, count subtext,
 * button text, and the number of job cards rendered on the initial page load (6, 9, 12, etc.).
 */
const JobCardsEditor = ({ data, onChange, onSave, isSaving }) => {
  const jobCards = data?.jobCards || {
    heading: 'Latest Opportunities',
    showSparkleIcon: true,
    subtextTemplate: 'Showing {count} jobs',
    viewAllButtonText: 'View All Jobs',
    initialCount: 6,
    showMoreCount: 6
  };

  const handleFieldChange = (field, value) => {
    onChange('jobCards', { ...jobCards, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Job Cards Section</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure section title, job card display limits (e.g. 6, 9, 12), and action button text.
        </p>
      </div>

      {/* Guidelines Card */}
      <CMSGuidelineBanner
        title="Job Cards Section Settings"
        points={[
          "Section Heading: Prominently introduces the job listings feed (e.g. 'Latest Opportunities', 'Featured Jobs').",
          "Initial Card Limit: Choose how many job cards load initially (recommended: 6 to 12 cards for fast performance and clean layout).",
          "Subtext Template: Use {count} as a dynamic placeholder (e.g. 'Showing {count} jobs' displays 'Showing 6 jobs').",
          "Show More: Additional jobs load seamlessly when visitors click 'Show More' or 'View All'."
        ]}
      />

      {/* Configuration Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Live Preview Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Live Section Header Preview
          </label>
          <div className="bg-gradient-to-r from-gray-50 to-green-50/20 border border-dashed border-gray-300 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-green-950 flex items-center gap-2">
                  <span>{jobCards.heading || 'Latest Opportunities'}</span>
                  {jobCards.showSparkleIcon && (
                    <span className="text-green-600 text-xl font-normal">✨</span>
                  )}
                </h3>
                <p className="text-xs font-semibold text-gray-500 mt-1">
                  {(jobCards.subtextTemplate || 'Showing {count} jobs').replace('{count}', jobCards.initialCount || 6)}
                </p>
              </div>

              {/* View All Button Preview */}
              <div className="px-4 py-1.5 rounded-full border border-green-200 text-green-800 text-xs font-bold bg-white shadow-sm flex items-center gap-1">
                <span>{jobCards.viewAllButtonText || 'View All Jobs'}</span>
                <span>→</span>
              </div>
            </div>

            {/* Dummy Mini Cards Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-200/60">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs flex items-center gap-2.5 opacity-80">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center font-bold text-green-800 text-xs">
                    {i === 1 ? 'A' : i === 2 ? 'F' : 'T'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Sample Position #{i}</div>
                    <div className="text-[11px] text-gray-500">Tech • Anywhere</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-3 text-[11px] text-gray-400 font-medium">
              Showing first {jobCards.initialCount || 6} jobs on homepage load
            </div>
          </div>
        </div>

        {/* Configuration Inputs */}
        <div className="space-y-5 pt-4 border-t border-gray-100">
          
          {/* Heading & Subtext */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Section Heading
              </label>
              <input
                type="text"
                value={jobCards.heading || ''}
                onChange={(e) => handleFieldChange('heading', e.target.value)}
                placeholder="e.g. Latest Opportunities"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Subtext Template (use {'{count}'})
              </label>
              <input
                type="text"
                value={jobCards.subtextTemplate || ''}
                onChange={(e) => handleFieldChange('subtextTemplate', e.target.value)}
                placeholder="e.g. Showing {count} jobs"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>
          </div>

          {/* Action Button & Sparkle Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                "View All" Button Text
              </label>
              <input
                type="text"
                value={jobCards.viewAllButtonText || ''}
                onChange={(e) => handleFieldChange('viewAllButtonText', e.target.value)}
                placeholder="e.g. View All Jobs"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              />
            </div>

            <div className="sm:pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={jobCards.showSparkleIcon ?? true}
                  onChange={(e) => handleFieldChange('showSparkleIcon', e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Show Sparkle Icon (✨) next to Heading
                </span>
              </label>
            </div>
          </div>

          {/* Job Card Limits Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Initial Cards Count on Page Load
              </label>
              <select
                value={jobCards.initialCount || 6}
                onChange={(e) => handleFieldChange('initialCount', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 font-medium cursor-pointer"
              >
                <option value={3}>3 Jobs (1 row)</option>
                <option value={6}>6 Jobs (2 rows - Recommended)</option>
                <option value={9}>9 Jobs (3 rows)</option>
                <option value={12}>12 Jobs (4 rows)</option>
                <option value={15}>15 Jobs (5 rows)</option>
                <option value={18}>18 Jobs (6 rows)</option>
                <option value={999}>All Jobs (No initial limit)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Number of job cards loaded before clicking "Show More" / "View All".
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Cards Added per "Show More" Click
              </label>
              <select
                value={jobCards.showMoreCount || 6}
                onChange={(e) => handleFieldChange('showMoreCount', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 font-medium cursor-pointer"
              >
                <option value={3}>3 Jobs</option>
                <option value={6}>6 Jobs (Recommended)</option>
                <option value={9}>9 Jobs</option>
                <option value={12}>12 Jobs</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Additional cards appended when the user clicks "Show More".
              </p>
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
              'Save Job Cards Changes'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default JobCardsEditor;
