import React from 'react';

/**
 * CMSGuidelineBanner Component
 * Renders an informational guideline box with instructions and best practices
 * for content editors.
 *
 * @param {string} title - The header title of the recommendation box
 * @param {Array<string>} points - Bullet points of instructions
 */
const CMSGuidelineBanner = ({ title, points = [] }) => {
  return (
    <div className="bg-blue-50/70 border-l-4 border-blue-500 rounded-r-xl p-5 mb-6 text-sm text-blue-900 shadow-sm transition-all duration-200">
      <div className="font-bold text-blue-950 text-base mb-2 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {title}
      </div>
      <ul className="space-y-1.5 list-disc list-inside text-blue-800 leading-relaxed pl-1">
        {points.map((point, index) => (
          <li key={index} className="text-[13.5px]">
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CMSGuidelineBanner;
