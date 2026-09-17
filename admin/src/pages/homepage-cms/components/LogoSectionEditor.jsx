import React, { useRef } from 'react';
import CMSGuidelineBanner from './CMSGuidelineBanner';

/**
 * LogoSectionEditor Component
 * Allows administrators to switch between branded text logos and custom uploaded image logos,
 * with real-time preview, size adjustments, and alt text configurations.
 */
const LogoSectionEditor = ({ data, onChange, onSave, isSaving }) => {
  const fileInputRef = useRef(null);

  const logo = data?.logo || {
    type: 'text',
    text: 'sahijob',
    accentText: '.com',
    imageUrl: '',
    altText: 'sahijob.com',
    height: 36
  };

  const handleTypeChange = (type) => {
    onChange('logo', { ...logo, type });
  };

  const handleFieldChange = (field, value) => {
    onChange('logo', { ...logo, [field]: value });
  };

  // Convert uploaded image to base64 data URL for direct instant preview & storage
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 2) {
      alert('Logo file size should be less than 2MB for fast page loads.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      onChange('logo', {
        ...logo,
        type: 'image',
        imageUrl: uploadEvent.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onChange('logo', {
      ...logo,
      type: 'text',
      imageUrl: ''
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Upload Logo</h2>
        <p className="text-sm text-gray-500 mt-1">
          Customize the main website logo displayed on the homepage navigation bar.
        </p>
      </div>

      {/* Guidelines Card */}
      <CMSGuidelineBanner
        title="Logo Requirements & Recommendations"
        points={[
          "Format: Transparent WebP or PNG (no background) for optimal visual clarity.",
          "Dimensions: The header automatically scales logos proportionally to fit cleanly in the top bar.",
          "Orientation: Both horizontal (recommended) and square logos are fully supported.",
          "File Size: Please keep files under 500KB to maintain lightning-fast page speed."
        ]}
      />

      {/* Logo Configuration Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Logo Format Selector (Text vs Image) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Logo Display Type</label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => handleTypeChange('text')}
              className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                logo.type === 'text'
                  ? 'border-green-600 bg-green-50 text-green-800 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
              Branded Text Logo
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('image')}
              className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                logo.type === 'image'
                  ? 'border-green-600 bg-green-50 text-green-800 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Custom Image Logo
            </button>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Live Navigation Bar Preview
          </label>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/60 border border-dashed border-gray-300 rounded-2xl p-6 flex items-center justify-between min-h-[90px]">
            {/* Logo Preview */}
            <div className="flex items-center">
              {logo.type === 'image' && logo.imageUrl ? (
                <img
                  src={logo.imageUrl}
                  alt={logo.altText || 'Website Logo'}
                  style={{ height: `${logo.height || 36}px` }}
                  className="object-contain max-w-[240px]"
                />
              ) : logo.type === 'image' && !logo.imageUrl ? (
                <span className="text-sm font-medium text-gray-400 italic">
                  No image uploaded yet (click Choose File below)
                </span>
              ) : (
                <div className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight select-none">
                  <span>{logo.text || 'sahijob'}</span>
                  <span className="text-green-600">{logo.accentText || '.com'}</span>
                </div>
              )}
            </div>

            {/* Fake Nav Buttons to demonstrate header context */}
            <div className="hidden sm:flex items-center gap-3 opacity-60 pointer-events-none">
              <span className="text-xs font-semibold text-gray-700">Employee Login</span>
              <span className="px-3 py-1 bg-green-800 text-white rounded-full text-xs font-semibold">Employer Login</span>
            </div>
          </div>
        </div>

        {/* Dynamic Controls based on selected type */}
        {logo.type === 'image' ? (
          <div className="space-y-6 pt-4 border-t border-gray-100">
            {/* File Upload Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload New Logo Image
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleFileUpload}
                  className="block w-full max-w-md text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                />
                {logo.imageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>

            {/* Height & Alt Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Logo Height in Header ({logo.height || 36}px)
                </label>
                <input
                  type="range"
                  min="24"
                  max="60"
                  step="2"
                  value={logo.height || 36}
                  onChange={(e) => handleFieldChange('height', Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Logo Image Alt Text
                </label>
                <input
                  type="text"
                  value={logo.altText || ''}
                  onChange={(e) => handleFieldChange('altText', e.target.value)}
                  placeholder="e.g. sahijob.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Primary Text (Dark)
                </label>
                <input
                  type="text"
                  value={logo.text || ''}
                  onChange={(e) => handleFieldChange('text', e.target.value)}
                  placeholder="e.g. sahijob"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Accent Text (Green)
                </label>
                <input
                  type="text"
                  value={logo.accentText || ''}
                  onChange={(e) => handleFieldChange('accentText', e.target.value)}
                  placeholder="e.g. .com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>
            </div>
          </div>
        )}

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
              'Save Logo Changes'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LogoSectionEditor;
