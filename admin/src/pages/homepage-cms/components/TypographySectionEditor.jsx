import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import CMSGuidelineBanner from './CMSGuidelineBanner';
import { uploadFileToStorage, deleteFileFromStorage } from '../../../utils/firebaseStorage';

/**
 * Curated list of popular modern Google Fonts
 */
const POPULAR_GOOGLE_FONTS = [
  { name: 'Inter', category: 'Sans-Serif (Clean, Highly Legible UI)', weights: '400, 500, 600, 700, 800' },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif (Modern Geometric, Tech)', weights: '400, 500, 600, 700, 800' },
  { name: 'Roboto', category: 'Sans-Serif (Neutral, Universal)', weights: '400, 500, 700, 900' },
  { name: 'Outfit', category: 'Sans-Serif (Trendy, High-End Display)', weights: '400, 500, 600, 700, 800' },
  { name: 'Poppins', category: 'Geometric Sans (Friendly, Polished)', weights: '400, 500, 600, 700, 800' },
  { name: 'Montserrat', category: 'Sans-Serif (Bold, Editorial Display)', weights: '400, 500, 600, 700, 800' },
  { name: 'Urbanist', category: 'Geometric Sans (Minimalist, Contemporary)', weights: '400, 500, 600, 700, 800' },
  { name: 'DM Sans', category: 'Sans-Serif (Precision, Corporate)', weights: '400, 500, 700' },
  { name: 'Lato', category: 'Sans-Serif (Warm, Readable)', weights: '400, 700, 900' },
  { name: 'Open Sans', category: 'Humanist Sans (Clear, Friendly)', weights: '400, 600, 700, 800' },
  { name: 'Playfair Display', category: 'Serif (Elegant, Luxury, Editorial)', weights: '400, 600, 700, 900' }
];

/**
 * Helper to dynamically load Google Font into DOM for live preview
 */
const loadGoogleFontToDOM = (fontFamily) => {
  if (!fontFamily) return;
  const cleanFamily = fontFamily.trim();
  const fontId = `google-font-${cleanFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (!document.getElementById(fontId)) {
    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${cleanFamily.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
    link.onerror = () => {
      link.href = `https://fonts.googleapis.com/css2?family=${cleanFamily.replace(/\s+/g, '+')}&display=swap`;
    };
    document.head.appendChild(link);
  }
};

/**
 * Helper to inject custom font @font-face rule and load via FontFace API.
 * Fetches the font as a blob first to guarantee CORS-free loading.
 * Returns a Promise that resolves when the font is ready in document.fonts.
 */
const injectCustomFontFace = async (fontFamily, fontUrl) => {
  if (!fontFamily || !fontUrl) return;
  const cleanFamily = fontFamily.trim();
  const styleId = `custom-font-${cleanFamily.replace(/\s+/g, '-').toLowerCase()}`;

  // Always update the CSS @font-face rule (fallback for browsers without FontFace API)
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  try {
    // Fetch the font as binary blob to avoid CORS restrictions on the URL
    let fontSrc = fontUrl;
    try {
      const res = await fetch(fontUrl);
      if (res.ok) {
        const blob = await res.blob();
        fontSrc = URL.createObjectURL(blob);
      }
    } catch (_fetchErr) {
      // If fetch fails, fall back to the original URL
      fontSrc = fontUrl;
    }

    // Write @font-face CSS with the resolved src
    styleEl.innerHTML = `
      @font-face {
        font-family: '${cleanFamily}';
        src: url('${fontSrc}');
        font-display: block;
      }
    `;

    // Load via FontFace API so document.fonts.has() reflects the loaded state
    if (typeof FontFace !== 'undefined') {
      const fontFace = new FontFace(cleanFamily, `url('${fontSrc}')`);
      const loaded = await fontFace.load();
      document.fonts.add(loaded);
    }
  } catch (e) {
    // Still write the fallback @font-face with the original URL
    styleEl.innerHTML = `
      @font-face {
        font-family: '${cleanFamily}';
        src: url('${fontUrl}');
        font-display: swap;
      }
    `;
    console.warn('Custom font load notice:', e);
  }
};

/**
 * Helper to inject a font via a CSS stylesheet link (Google Fonts, CDN, etc.)
 * Returns a Promise that resolves when the stylesheet loads.
 */
const injectFontByLink = (fontFamily, linkUrl) => {
  if (!fontFamily || !linkUrl) return Promise.resolve();
  const linkId = `font-link-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  return new Promise((resolve) => {
    if (document.getElementById(linkId)) { resolve(); return; }
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = linkUrl;
    link.onload = resolve;
    link.onerror = resolve; // resolve even on error so promise doesn't hang
    document.head.appendChild(link);
  });
};

/**
 * Single Font Config Block Component
 */
const FontConfigCard = ({ 
  title, 
  badgeText, 
  roleDescription, 
  fontKey, 
  fontData, 
  customFontsLibrary = [],
  onAddCustomFont,
  onRemoveCustomFont,
  onChange,
  onUploadError
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [customFontNameInput, setCustomFontNameInput] = useState(fontData.family || '');
  const [extractedInfo, setExtractedInfo] = useState('');
  // 'url' = add by link/URL tab, 'file' = upload file tab
  const [addMode, setAddMode] = useState('url');
  const [urlFontName, setUrlFontName] = useState('');
  const [urlFontLink, setUrlFontLink] = useState('');
  const [urlAddError, setUrlAddError] = useState('');
  const [isAddingByUrl, setIsAddingByUrl] = useState(false);
  // Bumping this key forces the preview container to remount after the font loads
  const [previewKey, setPreviewKey] = useState(0);

  // Recommended weight guidance based on font key
  const weightGuidance = {
    primaryFont: {
      recommendedWeight: 'Regular (400) / Normal',
      acceptableWeights: 'Regular (400), Normal, Medium (500)',
      description: 'Suitable for Body & UI: Best for high readability in paragraph text, inputs, job listings, and forms.'
    },
    headingFont: {
      recommendedWeight: 'Bold (700) / Semi-Bold (600)',
      acceptableWeights: 'Bold (700), Semi-Bold (600), ExtraBold / Black (800/900)',
      description: 'Suitable for Headings: Best for bold visual hierarchy in hero titles, section headlines, and card titles.'
    },
    secondaryFont: {
      recommendedWeight: 'Semi-Bold (600) / Bold (700)',
      acceptableWeights: 'Semi-Bold (600), Bold (700), Medium (500)',
      description: 'Suitable for Highlights & Accents: Best for gradient hero highlights, status tags, badges, and chips.'
    }
  }[fontKey] || {
    recommendedWeight: 'Regular (400) or Bold (700)',
    acceptableWeights: 'Regular (400), Semi-Bold (600), Bold (700)',
    description: 'Upload your font file in your preferred weight.'
  };

  // Load font dynamically whenever family or source changes; bump previewKey when ready
  useEffect(() => {
    if (!fontData.family) return;
    if (fontData.source === 'google') {
      loadGoogleFontToDOM(fontData.family);
      setPreviewKey(k => k + 1);
    } else if (fontData.source === 'custom' && fontData.customUrl) {
      const isStylesheet = fontData.urlType === 'stylesheet';
      const inject = isStylesheet
        ? injectFontByLink(fontData.family, fontData.customUrl)
        : injectCustomFontFace(fontData.family, fontData.customUrl);
      inject.then(() => setPreviewKey(k => k + 1));
    }
  }, [fontData.source, fontData.family, fontData.customUrl, fontData.urlType]);

  // Synchronize customFontNameInput if family changes
  useEffect(() => {
    if (fontData.source === 'custom' && fontData.family) {
      setCustomFontNameInput(fontData.family);
    }
  }, [fontData.family, fontData.source]);

  // Determine current dropdown select value
  const getCurrentSelectValue = () => {
    if (fontData.source === 'custom') {
      const match = customFontsLibrary.find(cf => cf.family === fontData.family || cf.customUrl === fontData.customUrl);
      if (match) {
        return `custom::${match.family}::${match.customUrl}`;
      }
      return `custom::${fontData.family}::${fontData.customUrl || ''}`;
    }
    return `google::${fontData.family || 'Inter'}`;
  };

  // Handle unified dropdown changes
  const handleDropdownChange = async (e) => {
    const selectedVal = e.target.value;

    if (selectedVal.startsWith('custom::')) {
      const parts = selectedVal.split('::');
      const family = parts[1];
      const customUrl = parts[2] || '';
      // Find the font's urlType from the library
      const libEntry = customFontsLibrary.find(cf => cf.family === family || cf.customUrl === customUrl);
      const urlType = libEntry?.urlType || 'font-file';
      onChange(fontKey, { ...fontData, source: 'custom', family, customUrl, urlType });
      const inject = urlType === 'stylesheet'
        ? injectFontByLink(family, customUrl)
        : injectCustomFontFace(family, customUrl);
      await inject;
      setPreviewKey(k => k + 1);
    } else if (selectedVal.startsWith('google::')) {
      const family = selectedVal.replace('google::', '');
      onChange(fontKey, { ...fontData, source: 'google', family, customUrl: '', urlType: undefined });
      loadGoogleFontToDOM(family);
      setPreviewKey(k => k + 1);
    }
  };

  // Handle adding font by URL/Link
  const handleAddByUrl = async () => {
    setUrlAddError('');
    const name = urlFontName.trim();
    const link = urlFontLink.trim();
    if (!name) { setUrlAddError('Please enter a font family name.'); return; }
    if (!link) { setUrlAddError('Please paste a font URL or Google Fonts link.'); return; }
    if (!link.startsWith('http')) { setUrlAddError('URL must start with http:// or https://'); return; }

    // Detect if it's a direct font file or a CSS stylesheet
    const isDirectFont = /\.(woff2?|ttf|otf)(\?.*)?$/i.test(link);
    const urlType = isDirectFont ? 'font-file' : 'stylesheet';

    setIsAddingByUrl(true);
    try {
      if (urlType === 'stylesheet') {
        await injectFontByLink(name, link);
      } else {
        await injectCustomFontFace(name, link);
      }

      // Add to library
      onAddCustomFont?.({ family: name, customUrl: link, urlType, uploadedAt: new Date() });

      // Apply to active slot
      onChange(fontKey, { ...fontData, source: 'custom', family: name, customUrl: link, urlType });

      setPreviewKey(k => k + 1);
      setUrlFontName('');
      setUrlFontLink('');
    } catch (err) {
      setUrlAddError('Failed to load font from URL. Please check the link and try again.');
    } finally {
      setIsAddingByUrl(false);
    }
  };

  // Handle custom file upload (supports both unzipped .woff2, .woff, .ttf, .otf AND .zip archives)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractedInfo('');

    // Validate size (max 20MB for ZIP, 8MB for font)
    if (file.size > 20 * 1024 * 1024) {
      onUploadError?.("Uploaded file must be under 20MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      let targetFontFile = file;

      // Handle .zip auto-extraction
      if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const fontFileNames = [];
        
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir) {
            const lower = zipEntry.name.toLowerCase();
            if (lower.endsWith('.woff2') || lower.endsWith('.woff') || lower.endsWith('.ttf') || lower.endsWith('.otf')) {
              if (!lower.includes('__macosx') && !lower.startsWith('.')) {
                fontFileNames.push(zipEntry.name);
              }
            }
          }
        });

        if (fontFileNames.length === 0) {
          throw new Error("No valid font file (.woff2, .woff, .ttf, .otf) was found inside the uploaded ZIP archive.");
        }

        // Prioritize best format: .woff2 > .woff > .ttf > .otf
        let chosenFileName = fontFileNames.find(n => n.toLowerCase().endsWith('.woff2')) 
          || fontFileNames.find(n => n.toLowerCase().endsWith('.woff'))
          || fontFileNames.find(n => n.toLowerCase().endsWith('.ttf'))
          || fontFileNames[0];

        // Match weight preference
        if (fontKey === 'headingFont') {
          const boldMatch = fontFileNames.find(n => /bold|semibold|semi-bold|black/i.test(n));
          if (boldMatch) chosenFileName = boldMatch;
        } else if (fontKey === 'primaryFont') {
          const regularMatch = fontFileNames.find(n => /regular|normal|book|medium/i.test(n));
          if (regularMatch) chosenFileName = regularMatch;
        }

        const zipEntry = zip.file(chosenFileName);
        const fontBlob = await zipEntry.async('blob');
        const cleanExtractedName = chosenFileName.split('/').pop() || chosenFileName;
        
        targetFontFile = new File([fontBlob], cleanExtractedName, { type: 'font/woff2' });
        setExtractedInfo(`Auto-extracted "${cleanExtractedName}" from ZIP archive.`);
      } else {
        // Validate direct font extension
        const validExts = ['.woff2', '.woff', '.ttf', '.otf'];
        const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
        if (!hasValidExt) {
          onUploadError?.("Please select a valid font file (.woff2, .woff, .ttf, .otf) or a .zip archive containing fonts.");
          setIsUploading(false);
          return;
        }
      }

      // Infer font family name
      const inferredName = targetFontFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const finalName = customFontNameInput.trim() || inferredName;

      const downloadUrl = await uploadFileToStorage(targetFontFile, 'fonts', (progress) => {
        setUploadProgress(progress);
      });

      // Update the name input to show what was saved
      setCustomFontNameInput(finalName);

      // Save to library so all dropdowns immediately have it
      onAddCustomFont?.({
        family: finalName,
        customUrl: downloadUrl,
        uploadedAt: new Date()
      });

      // Apply to this slot
      onChange(fontKey, {
        ...fontData,
        source: 'custom',
        family: finalName,
        customUrl: downloadUrl
      });

      // Inject into DOM and await font load before bumping preview key
      await injectCustomFontFace(finalName, downloadUrl);
      setPreviewKey(k => k + 1);

    } catch (err) {
      console.error("Font upload error:", err);
      onUploadError?.(err.message || "Failed to process and upload font file. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  // Handle custom font removal from current slot
  const handleRemoveCustomFont = async () => {
    setExtractedInfo('');
    onChange(fontKey, {
      ...fontData,
      source: 'google',
      family: fontKey === 'primaryFont' ? 'Inter' : (fontKey === 'headingFont' ? 'Plus Jakarta Sans' : 'Roboto'),
      customUrl: '',
      urlType: undefined
    });
  };

  const currentFamilyStyle = {
    fontFamily: fontData.family ? `'${fontData.family}', sans-serif` : 'sans-serif'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
      
      {/* Header & Role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
              {badgeText}
            </span>
            {fontData.source === 'custom' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <span>⭐</span> Custom WebFont Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            <strong className="text-gray-700 font-semibold">Applied To: </strong>{roleDescription}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400">Current:</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold border border-gray-200">
            {fontData.family || 'Default'} ({fontData.source === 'custom' ? 'Custom' : 'Google'})
          </span>
        </div>
      </div>

      {/* Control Inputs Grid: Left 2 Options, Right Live Specimen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left: 2 Clean Options (1. Select Font Dropdown, 2. Upload Custom Font) */}
        <div className="space-y-5">
          
          {/* OPTION 1: ALL FONTS LIST DROPDOWN */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                1. Select Font
              </label>
              <span className="text-[11px] text-gray-400 font-medium">All Google &amp; Custom Fonts</span>
            </div>

            <select
              value={getCurrentSelectValue()}
              onChange={handleDropdownChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer shadow-xs"
            >
              {/* ⭐ Uploaded Custom Fonts Group */}
              <optgroup label="⭐ Uploaded Custom Fonts">
                {customFontsLibrary.length > 0 ? (
                  customFontsLibrary.map(cf => (
                    <option key={cf.family + cf.customUrl} value={`custom::${cf.family}::${cf.customUrl}`}>
                      ⭐ {cf.family} (Custom WebFont)
                    </option>
                  ))
                ) : (
                  <option disabled value="">
                    (No custom fonts uploaded yet — upload in Option 2 below)
                  </option>
                )}
              </optgroup>

              {/* 🌐 Google Fonts Group */}
              <optgroup label="🌐 Google Fonts Library">
                {POPULAR_GOOGLE_FONTS.map(f => (
                  <option key={f.name} value={`google::${f.name}`}>
                    {f.name} — {f.category}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* OPTION 2: CUSTOM FONT — URL/Link or Upload */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">

            {/* Tab Toggle */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setAddMode('url')}
                className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  addMode === 'url'
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                🔗 <span>2. Add by URL / Link</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('file')}
                className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-l border-gray-200 cursor-pointer ${
                  addMode === 'file'
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                📁 <span>Upload File</span>
              </button>
            </div>

            {/* TAB A: Add by URL */}
            {addMode === 'url' && (
              <div className="p-4 space-y-3">
                <p className="text-[11px] text-gray-500 leading-snug">
                  Paste any <strong>Google Fonts link</strong>, CDN stylesheet URL, or a direct font file URL (.woff2, .ttf, etc.).
                  These load reliably with instant preview.
                </p>

                {/* Example chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Google Fonts', example: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap', name: 'Bebas Neue' },
                    { label: 'Bunny Fonts', example: 'https://fonts.bunny.net/css?family=abel:400', name: 'Abel' },
                  ].map(ex => (
                    <button
                      key={ex.label}
                      type="button"
                      onClick={() => { setUrlFontLink(ex.example); setUrlFontName(ex.name); }}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      {ex.label} example
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={urlFontName}
                    onChange={e => setUrlFontName(e.target.value)}
                    placeholder="Font family name (e.g. Bebas Neue)"
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="url"
                    value={urlFontLink}
                    onChange={e => setUrlFontLink(e.target.value)}
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {urlAddError && (
                  <p className="text-[11px] text-red-600 font-semibold">{urlAddError}</p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddByUrl}
                    disabled={isAddingByUrl}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isAddingByUrl ? '⏳ Loading...' : '✓ Add Font to List'}
                  </button>
                  {fontData.source === 'custom' && (
                    <button
                      type="button"
                      onClick={() => onChange(fontKey, { ...fontData, source: 'google', family: fontKey === 'primaryFont' ? 'Inter' : (fontKey === 'headingFont' ? 'Plus Jakarta Sans' : 'Roboto'), customUrl: '', urlType: undefined })}
                      className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-300 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {fontData.source === 'custom' && fontData.customUrl && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Active: {fontData.family} ({fontData.urlType === 'stylesheet' ? 'Link' : 'File'})
                  </p>
                )}
              </div>
            )}

            {/* TAB B: Upload Font File */}
            {addMode === 'file' && (
              <div className="p-4 space-y-3">
                <p className="text-[11px] text-gray-500 leading-snug">
                  {weightGuidance.description} Upload <strong>.woff2, .woff, .ttf, .otf</strong> — saves to font library.
                </p>

                <input
                  type="text"
                  value={customFontNameInput}
                  onChange={(e) => setCustomFontNameInput(e.target.value)}
                  placeholder="Font Family Name (auto-inferred from filename)"
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <label className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                    <span>📁</span>
                    <span>{isUploading ? `Uploading ${uploadProgress}%...` : 'Choose Font File'}</span>
                    <input
                      type="file"
                      accept=".woff2,.woff,.ttf,.otf,.zip"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  {fontData.source === 'custom' && (
                    <button
                      type="button"
                      onClick={() => onChange(fontKey, { ...fontData, source: 'google', family: fontKey === 'primaryFont' ? 'Inter' : (fontKey === 'headingFont' ? 'Plus Jakarta Sans' : 'Roboto'), customUrl: '', urlType: undefined })}
                      className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-300 cursor-pointer"
                    >
                      Reset to Google Font
                    </button>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-green-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {extractedInfo && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-semibold">📦 {extractedInfo}</div>
                )}

                {fontData.source === 'custom' && fontData.customUrl && !isUploading && (
                  <p className="text-[11px] text-emerald-700 font-bold">✓ Active: {fontData.family} (Saved in Fonts List)</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right: Live Interactive Font Specimen Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              Specimen Preview ({fontData.family || 'Default'})
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold border ${
              fontData.source === 'custom' 
                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                : 'bg-white text-gray-600 border-gray-200'
            }`}>
              {fontData.source === 'google' ? 'Google Font' : '⭐ Custom WebFont'}
            </span>
          </div>

          {/*
            Use a <style> tag scoped to this card's unique class to force font-family with
            !important — this defeats Tailwind's global font-sans / body inheritance.
            The key on the wrapper forces React to remount and re-paint after font load.
          */}
          <style>{`
            .font-preview-${fontKey}-${previewKey} {
              font-family: '${fontData.family || 'sans-serif'}', sans-serif !important;
            }
          `}</style>
          <div
            key={`specimen-${fontKey}-${fontData.family}-${previewKey}`}
            className={`font-preview-${fontKey}-${previewKey} space-y-2`}
          >
            <div
              className={`font-preview-${fontKey}-${previewKey} text-xl sm:text-2xl font-bold text-gray-900 leading-snug`}
            >
              The quick brown fox jumps over the lazy dog.
            </div>

            <div
              className={`font-preview-${fontKey}-${previewKey} text-xs text-gray-500 tracking-wider`}
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
              abcdefghijklmnopqrstuvwxyz 0123456789
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

/**
 * TypographySectionEditor Component
 */
const TypographySectionEditor = ({ data, onChange, onSave, isSaving }) => {
  const [toastError, setToastError] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState('homepage'); // 'homepage' | 'employee_profile' | 'employee_jobs' | 'employer_dash'

  // Pre-load all curated popular Google Fonts into the page on mount
  useEffect(() => {
    POPULAR_GOOGLE_FONTS.forEach(f => loadGoogleFontToDOM(f.name));
  }, []);

  const typography = data?.typography || {
    primaryFont: {
      source: 'google',
      family: 'Inter',
      customUrl: '',
      appliedTo: 'Body text, general UI, navigation links, buttons, form inputs, candidate & employer tables'
    },
    headingFont: {
      source: 'google',
      family: 'Plus Jakarta Sans',
      customUrl: '',
      appliedTo: 'Hero headlines, H1-H6 titles, section headers, card titles, and modal headers'
    },
    secondaryFont: {
      source: 'google',
      family: 'Roboto',
      customUrl: '',
      appliedTo: 'Hero highlighted typography, badges, metadata chips, status tags, and stats'
    }
  };

  // Derive all uploaded custom fonts from data.customFontsLibrary and existing typography
  const customFontsLibrary = React.useMemo(() => {
    const library = Array.isArray(data?.customFontsLibrary) ? [...data.customFontsLibrary] : [];
    ['primaryFont', 'headingFont', 'secondaryFont'].forEach(key => {
      const f = typography[key];
      if (f && f.source === 'custom' && f.family && f.customUrl) {
        if (!library.some(cf => cf.family.toLowerCase() === f.family.toLowerCase() || cf.customUrl === f.customUrl)) {
          library.push({ family: f.family, customUrl: f.customUrl, uploadedAt: new Date() });
        }
      }
    });
    return library;
  }, [data?.customFontsLibrary, typography]);

  const primaryFamily = typography.primaryFont?.family || 'Inter';
  const headingFamily = typography.headingFont?.family || 'Plus Jakarta Sans';
  const secondaryFamily = typography.secondaryFont?.family || 'Roboto';

  // Load active fonts into DOM
  useEffect(() => {
    if (typography.primaryFont?.source === 'google') loadGoogleFontToDOM(primaryFamily);
    if (typography.headingFont?.source === 'google') loadGoogleFontToDOM(headingFamily);
    if (typography.secondaryFont?.source === 'google') loadGoogleFontToDOM(secondaryFamily);
  }, [primaryFamily, headingFamily, secondaryFamily]);

  // Pre-load all uploaded custom fonts from library into @font-face rules
  useEffect(() => {
    customFontsLibrary.forEach(cf => {
      if (cf.family && cf.customUrl) {
        injectCustomFontFace(cf.family, cf.customUrl);
      }
    });
  }, [customFontsLibrary]);

  const handleFontCategoryChange = (fontKey, updatedFontData) => {
    onChange('typography', {
      ...typography,
      [fontKey]: updatedFontData
    });
  };

  // Handler to add a font to customFontsLibrary
  const handleAddCustomFont = (newFont) => {
    const existing = (data?.customFontsLibrary || []).filter(
      f => f.family.toLowerCase() !== newFont.family.toLowerCase()
    );
    const updatedLibrary = [newFont, ...existing];
    onChange('customFontsLibrary', updatedLibrary);
  };

  // Handler to remove a font from customFontsLibrary
  const handleRemoveCustomFontFromLibrary = async (fontToRemove) => {
    if (fontToRemove.customUrl) {
      try {
        await deleteFileFromStorage(fontToRemove.customUrl);
      } catch (err) {
        console.warn('Could not remove font from storage:', err);
      }
    }
    const updatedLibrary = (data?.customFontsLibrary || []).filter(
      f => f.family.toLowerCase() !== fontToRemove.family.toLowerCase() && f.customUrl !== fontToRemove.customUrl
    );
    onChange('customFontsLibrary', updatedLibrary);

    // If active typography used this font, reset that slot to default Google Font
    let updatedTypography = { ...typography };
    let changed = false;
    ['primaryFont', 'headingFont', 'secondaryFont'].forEach(key => {
      const f = updatedTypography[key];
      if (f && f.source === 'custom' && (f.family === fontToRemove.family || f.customUrl === fontToRemove.customUrl)) {
        changed = true;
        updatedTypography[key] = {
          ...f,
          source: 'google',
          family: key === 'primaryFont' ? 'Inter' : (key === 'headingFont' ? 'Plus Jakarta Sans' : 'Roboto'),
          customUrl: ''
        };
      }
    });
    if (changed) {
      onChange('typography', updatedTypography);
    }
  };

  // Quick apply custom font to a slot
  const handleQuickApplyCustomFont = (font, fontKey) => {
    onChange('typography', {
      ...typography,
      [fontKey]: {
        ...typography[fontKey],
        source: 'custom',
        family: font.family,
        customUrl: font.customUrl
      }
    });
    injectCustomFontFace(font.family, font.customUrl);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Error if any */}
      {toastError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{toastError}</span>
          <button onClick={() => setToastError('')} className="font-bold">✕</button>
        </div>
      )}

      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Typography &amp; Fonts</h2>
        <p className="text-sm text-gray-500 mt-1">
          Inspect, configure, and upload the typography used universally across the Landing Page, Employee Portal, Employer Dashboard, and Admin CMS.
        </p>
      </div>

      {/* Guidelines Card */}
      <CMSGuidelineBanner
        title="Typography Architecture &amp; Font System"
        points={[
          "Primary Font (Body & UI): Powers paragraph text, form inputs, buttons, and general interface elements. We recommend clean, high-legibility fonts like Inter.",
          "Heading Font (Titles & H1-H6): Powers major page headers, candidate names, and section headlines. We recommend geometric, modern fonts like Plus Jakarta Sans or Outfit.",
          "Secondary Font (Accents & Highlights): Powers experience chips, status badges, hero highlights, and tag pills. We recommend versatile fonts like Roboto or Poppins.",
          "Live Page Switcher: Use the tabs below to preview how your fonts harmonize across Home, Employee, Employer Job Page, and Employer Dash."
        ]}
      />

      {/* Universal Live Composite Typography Mockup with Multi-Page Preview Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Header & Page Switcher Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
              Universal Platform Live Typography Harmony Preview
            </label>
            <p className="text-xs text-gray-400 mt-0.5">
              Primary: <strong className="text-gray-700">{primaryFamily}</strong> &bull; Heading: <strong className="text-gray-700">{headingFamily}</strong> &bull; Secondary: <strong className="text-gray-700">{secondaryFamily}</strong>
            </p>
          </div>

          {/* Interactive Preview View Switcher: Home -> Employee -> Employer Job Page -> Employer Dash */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl self-start lg:self-auto">
            {/* 1. Home */}
            <button
              type="button"
              onClick={() => setActivePreviewTab('homepage')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePreviewTab === 'homepage'
                  ? 'bg-green-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <span>🏠</span>
              <span>Home</span>
            </button>

            {/* 2. Employee */}
            <button
              type="button"
              onClick={() => setActivePreviewTab('employee_profile')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePreviewTab === 'employee_profile'
                  ? 'bg-green-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <span>👤</span>
              <span>Employee</span>
            </button>

            {/* 3. Employer Job Page */}
            <button
              type="button"
              onClick={() => setActivePreviewTab('employee_jobs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePreviewTab === 'employee_jobs'
                  ? 'bg-green-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <span>💼</span>
              <span>Employer Job Page</span>
            </button>

            {/* 4. Employer Dash */}
            <button
              type="button"
              onClick={() => setActivePreviewTab('employer_dash')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activePreviewTab === 'employer_dash'
                  ? 'bg-green-700 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <span>🏢</span>
              <span>Employer Dash</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            VIEW 1: EMPLOYEE PROFILE PREVIEW
            ======================================================== */}
        {activePreviewTab === 'employee_profile' && (
          <div className="bg-gradient-to-b from-gray-50/90 to-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            
            {/* Top Profile Header Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                {/* Avatar with Initials */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
                  <span style={{ fontFamily: `'${headingFamily}', sans-serif` }}>YR</span>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Candidate Name in Heading Font */}
                    <h2 
                      style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                      className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight"
                    >
                      Yash Raj Singh
                    </h2>
                    {/* Verified Badge in Secondary Font */}
                    <span 
                      style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 flex items-center gap-1"
                    >
                      ✓ Verified Candidate
                    </span>
                  </div>

                  {/* Designation in Primary Font */}
                  <p 
                    style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                    className="text-sm sm:text-base font-semibold text-emerald-800"
                  >
                    Senior UI/UX Designer &amp; Full-Stack React Engineer
                  </p>

                  {/* Metadata chips in Secondary Font */}
                  <div 
                    style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                    className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1"
                  >
                    <span className="flex items-center gap-1">📍 Bangalore, India</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">💼 4.5 Yrs Experience</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">📧 yash@example.com</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Primary Font */}
              <div 
                style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto"
              >
                <button 
                  type="button" 
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Download Resume
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Edit Profile
                </button>
              </div>

            </div>

            {/* Profile Content 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Left 2 Cols: Summary & Experience */}
              <div className="md:col-span-2 space-y-5">
                
                {/* Professional Summary Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
                  <h3 
                    style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                    className="text-base font-bold text-gray-900 flex items-center gap-2"
                  >
                    <span>📝</span>
                    <span>Professional Summary</span>
                  </h3>
                  <p 
                    style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                    className="text-sm text-gray-600 leading-relaxed font-normal"
                  >
                    Passionate product developer and UX engineer with over 4 years of experience building modern, responsive, and accessible web applications using React, Node.js, and Tailwind CSS. Proven track record in rapid prototyping and building enterprise design systems.
                  </p>
                </div>

                {/* Experience Item Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
                  <h3 
                    style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                    className="text-base font-bold text-gray-900 flex items-center gap-2"
                  >
                    <span>💼</span>
                    <span>Work Experience</span>
                  </h3>
                  
                  <div className="border-l-2 border-green-600 pl-4 space-y-1">
                    <h4 
                      style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                      className="text-sm font-bold text-gray-900"
                    >
                      Senior Frontend Engineer &bull; Meraki Tech
                    </h4>
                    <span 
                      style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block"
                    >
                      2022 — Present &bull; Full-Time
                    </span>
                    <p 
                      style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                      className="text-xs text-gray-600 pt-1"
                    >
                      Spearheaded complete portal UI overhaul, reducing initial load latency by 45% and implementing customizable multi-tenant styling systems.
                    </p>
                  </div>
                </div>

              </div>

              {/* Right 1 Col: Skills & Education */}
              <div className="space-y-5">
                
                {/* Skills Pills Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
                  <h3 
                    style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                    className="text-base font-bold text-gray-900 flex items-center gap-2"
                  >
                    <span>⚡</span>
                    <span>Key Skills</span>
                  </h3>
                  <div 
                    style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                    className="flex flex-wrap gap-2"
                  >
                    {['React.js', 'Tailwind CSS', 'Figma', 'Node.js', 'MongoDB', 'TypeScript', 'UI/UX Design'].map((skill) => (
                      <span 
                        key={skill}
                        className="px-2.5 py-1 bg-green-50 text-green-800 border border-green-200 rounded-lg text-xs font-bold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
                  <h3 
                    style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                    className="text-base font-bold text-gray-900 flex items-center gap-2"
                  >
                    <span>🎓</span>
                    <span>Education</span>
                  </h3>
                  <div className="space-y-1">
                    <h4 
                      style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                      className="text-xs font-bold text-gray-900"
                    >
                      B.Tech in Computer Science
                    </h4>
                    <p 
                      style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                      className="text-xs text-gray-500"
                    >
                      Visvesvaraya Technological University
                    </p>
                    <span 
                      style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                      className="text-[11px] text-emerald-700 font-semibold"
                    >
                      Graduated 2021 &bull; First Class
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            VIEW 2: EMPLOYEE JOBS PAGE PREVIEW
            ======================================================== */}
        {activePreviewTab === 'employee_jobs' && (
          <div className="bg-gradient-to-b from-gray-50/90 to-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            
            {/* Search and Filters Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h3 
                  style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                  className="text-xl sm:text-2xl font-black text-gray-900"
                >
                  Explore 1,240+ Active Job Openings
                </h3>
                <p 
                  style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                  className="text-xs text-gray-500 mt-0.5 font-medium"
                >
                  Filter by role, salary package, remote status, and required experience level.
                </p>
              </div>

              {/* Tag filters in Secondary Font */}
              <div 
                style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                className="flex items-center gap-2 overflow-x-auto"
              >
                <span className="px-3 py-1 bg-green-700 text-white rounded-full text-xs font-bold cursor-pointer">
                  All Roles
                </span>
                <span className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-bold cursor-pointer hover:bg-gray-50">
                  ⚡ Remote Only
                </span>
                <span className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-bold cursor-pointer hover:bg-gray-50">
                  💼 Full-Time
                </span>
              </div>
            </div>

            {/* Job Cards Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Job Card 1 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-green-300 transition-all space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm">
                      ST
                    </div>
                    <div>
                      <h4 
                        style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                        className="text-base font-bold text-gray-900 leading-snug"
                      >
                        Lead Full-Stack Developer
                      </h4>
                      <p 
                        style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                        className="text-xs font-semibold text-gray-500"
                      >
                        sahijob.com Cloud Technologies
                      </p>
                    </div>
                  </div>
                  <span 
                    style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                    className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200 shrink-0"
                  >
                    🔥 Urgently Hiring
                  </span>
                </div>

                {/* Salary & Details in Primary Font */}
                <div 
                  style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                  className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-xs"
                >
                  <div>
                    <span className="text-gray-400 block text-[10px]">Salary</span>
                    <strong className="text-gray-800 font-bold">₹18 - ₹24 LPA</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Location</span>
                    <strong className="text-gray-800 font-bold">Bangalore / Remote</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Experience</span>
                    <strong className="text-gray-800 font-bold">3 - 6 Yrs</strong>
                  </div>
                </div>

                {/* Tags in Secondary Font & CTA in Primary Font */}
                <div className="flex items-center justify-between pt-1">
                  <div 
                    style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-md">React</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-md">Node.js</span>
                  </div>

                  <button 
                    type="button"
                    style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                    className="px-4 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Apply Now
                  </button>
                </div>
              </div>

              {/* Job Card 2 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-green-300 transition-all space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
                      UI
                    </div>
                    <div>
                      <h4 
                        style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                        className="text-base font-bold text-gray-900 leading-snug"
                      >
                        Product Designer (UI/UX)
                      </h4>
                      <p 
                        style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                        className="text-xs font-semibold text-gray-500"
                      >
                        NextGen Digital Solutions
                      </p>
                    </div>
                  </div>
                  <span 
                    style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                    className="px-2.5 py-0.5 bg-blue-50 text-blue-800 text-[11px] font-bold rounded-full border border-blue-200 shrink-0"
                  >
                    🌐 Hybrid
                  </span>
                </div>

                {/* Salary & Details in Primary Font */}
                <div 
                  style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                  className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 text-xs"
                >
                  <div>
                    <span className="text-gray-400 block text-[10px]">Salary</span>
                    <strong className="text-gray-800 font-bold">₹14 - ₹20 LPA</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Location</span>
                    <strong className="text-gray-800 font-bold">Mumbai, India</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Experience</span>
                    <strong className="text-gray-800 font-bold">2 - 5 Yrs</strong>
                  </div>
                </div>

                {/* Tags in Secondary Font & CTA in Primary Font */}
                <div className="flex items-center justify-between pt-1">
                  <div 
                    style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-md">Figma</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-md">Design Systems</span>
                  </div>

                  <button 
                    type="button"
                    style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                    className="px-4 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Apply Now
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            VIEW 3: HOMEPAGE HERO PREVIEW
            ======================================================== */}
        {activePreviewTab === 'homepage' && (
          <div className="relative overflow-hidden bg-gradient-to-b from-gray-50/90 via-white to-green-50/30 border border-dashed border-gray-300 rounded-2xl p-8 sm:p-10 space-y-6 animate-in fade-in duration-300">
            
            {/* Badge using Secondary Font */}
            <div className="flex items-center gap-3">
              <span 
                style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                className="px-3.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 tracking-wide uppercase shadow-xs"
              >
                ★ Universal Typography Engine Active
              </span>
              <span 
                style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                className="text-xs text-gray-500 font-medium"
              >
                Primary: <strong className="text-gray-800">{primaryFamily}</strong> &bull; Heading: <strong className="text-gray-800">{headingFamily}</strong>
              </span>
            </div>

            {/* Heading using Heading Font + Highlight using Secondary Font */}
            <div className="space-y-2">
              <h1 
                style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1B5E20] tracking-tight leading-tight"
              >
                <span>Find Your </span>
                <span 
                  style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[#66BB6A] to-[#1B5E20] font-black"
                >
                  Dream Job
                </span>
              </h1>

              {/* Body using Primary Font */}
              <p 
                style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                className="text-base sm:text-lg text-gray-600 font-normal leading-relaxed max-w-2xl"
              >
                Discover opportunities that align with your passion and expertise. Connect directly with verified employers worldwide.
              </p>
            </div>

            {/* Action Buttons using Primary Font */}
            <div 
              style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
              className="flex items-center gap-3 pt-2"
            >
              <button 
                type="button" 
                className="px-5 py-2.5 bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-green-800 transition-colors"
              >
                Search Jobs
              </button>
              <button 
                type="button" 
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Register as Employer
              </button>
            </div>

          </div>
        )}

        {/* ========================================================
            VIEW 4: EMPLOYER DASHBOARD PREVIEW
            ======================================================== */}
        {activePreviewTab === 'employer_dash' && (
          <div className="bg-gradient-to-b from-gray-50/90 to-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 
                  style={{ fontFamily: `'${headingFamily}', sans-serif` }}
                  className="text-xl font-bold text-gray-900"
                >
                  Employer Hiring Console
                </h3>
                <p 
                  style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                  className="text-xs text-gray-500 mt-0.5"
                >
                  Real-time pipeline metrics and applicant processing
                </p>
              </div>

              <button 
                type="button"
                style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                className="px-4 py-2 bg-green-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                + Post New Job Opening
              </button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <span 
                  style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                  className="text-xs text-gray-500 font-semibold"
                >
                  Active Job Posts
                </span>
                <h4 
                  style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                  className="text-2xl font-black text-emerald-800 mt-1"
                >
                  12 Active
                </h4>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <span 
                  style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                  className="text-xs text-gray-500 font-semibold"
                >
                  Total Candidates
                </span>
                <h4 
                  style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                  className="text-2xl font-black text-emerald-800 mt-1"
                >
                  284 Applicants
                </h4>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                <span 
                  style={{ fontFamily: `'${primaryFamily}', sans-serif` }}
                  className="text-xs text-gray-500 font-semibold"
                >
                  Shortlisted
                </span>
                <h4 
                  style={{ fontFamily: `'${secondaryFamily}', sans-serif` }}
                  className="text-2xl font-black text-emerald-800 mt-1"
                >
                  36 Selected
                </h4>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Uploaded Custom Fonts Library Overview (Always Visible) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📁</span>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Uploaded Custom Fonts Library ({customFontsLibrary.length})
              </h3>
              <p className="text-xs text-gray-500">
                These fonts are universally available in the dropdown selector across Primary, Heading, and Secondary typography.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 self-start sm:self-auto">
            ⭐ {customFontsLibrary.length > 0 ? `${customFontsLibrary.length} Active in Dropdowns` : 'Ready for Uploads'}
          </span>
        </div>

        {customFontsLibrary.length > 0 ? (
          /* List of Custom Fonts with quick 1-click apply buttons and delete */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customFontsLibrary.map((cf) => (
              <div 
                key={cf.family + cf.customUrl}
                className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      style={{ fontFamily: `'${cf.family}', sans-serif` }}
                      className="text-base font-bold text-gray-900 truncate"
                    >
                      {cf.family}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomFontFromLibrary(cf)}
                      className="text-gray-400 hover:text-red-600 p-1 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      title="Delete font from library"
                    >
                      🗑️
                    </button>
                  </div>
                  <p 
                    style={{ fontFamily: `'${cf.family}', sans-serif` }}
                    className="text-xs text-gray-600 mt-1 leading-snug line-clamp-1"
                  >
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </div>

                {/* 1-Click Quick Assignment Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block w-full mb-0.5">
                    Quick Assign:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickApplyCustomFont(cf, 'primaryFont')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      typography.primaryFont?.source === 'custom' && typography.primaryFont?.family === cf.family
                        ? 'bg-green-700 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {typography.primaryFont?.source === 'custom' && typography.primaryFont?.family === cf.family ? '✓ Primary' : '+ Primary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickApplyCustomFont(cf, 'headingFont')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      typography.headingFont?.source === 'custom' && typography.headingFont?.family === cf.family
                        ? 'bg-green-700 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {typography.headingFont?.source === 'custom' && typography.headingFont?.family === cf.family ? '✓ Heading' : '+ Heading'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickApplyCustomFont(cf, 'secondaryFont')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      typography.secondaryFont?.source === 'custom' && typography.secondaryFont?.family === cf.family
                        ? 'bg-green-700 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {typography.secondaryFont?.source === 'custom' && typography.secondaryFont?.family === cf.family ? '✓ Secondary' : '+ Secondary'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 border border-dashed border-amber-200 rounded-xl p-5 text-center space-y-1">
            <p className="text-xs font-bold text-amber-950">
              No custom fonts uploaded yet
            </p>
            <p className="text-[11px] text-gray-500 max-w-lg mx-auto">
              Upload any font file (<strong>.woff2, .woff, .ttf, .otf</strong>) or <strong>.zip</strong> archive using the <strong>Upload Font / ZIP</strong> button in any card below. It will immediately appear here and across all font dropdowns!
            </p>
          </div>
        )}
      </div>

      {/* Font Configuration Cards for Each Category */}
      <div className="space-y-5">
        
        {/* 1. Primary Font */}
        <FontConfigCard
          title="1. Primary Font (Body &amp; Core UI)"
          badgeText="Default / Base"
          roleDescription={typography.primaryFont?.appliedTo || 'Body paragraphs, buttons, form inputs, candidate cards, and general UI'}
          fontKey="primaryFont"
          fontData={typography.primaryFont || { source: 'google', family: 'Inter', customUrl: '' }}
          customFontsLibrary={customFontsLibrary}
          onAddCustomFont={handleAddCustomFont}
          onRemoveCustomFont={handleRemoveCustomFontFromLibrary}
          onChange={handleFontCategoryChange}
          onUploadError={(err) => setToastError(err)}
        />

        {/* 2. Heading Font */}
        <FontConfigCard
          title="2. Heading Font (Titles &amp; Headlines)"
          badgeText="H1 — H6 &amp; Titles"
          roleDescription={typography.headingFont?.appliedTo || 'Hero headlines, candidate names, section headers, card titles, and modal headers'}
          fontKey="headingFont"
          fontData={typography.headingFont || { source: 'google', family: 'Plus Jakarta Sans', customUrl: '' }}
          customFontsLibrary={customFontsLibrary}
          onAddCustomFont={handleAddCustomFont}
          onRemoveCustomFont={handleRemoveCustomFontFromLibrary}
          onChange={handleFontCategoryChange}
          onUploadError={(err) => setToastError(err)}
        />

        {/* 3. Secondary Font */}
        <FontConfigCard
          title="3. Secondary Font (Highlights &amp; Accents)"
          badgeText="Accents &amp; Badges"
          roleDescription={typography.secondaryFont?.appliedTo || 'Hero highlighted typography, badges, metadata chips, status tags, and stats'}
          fontKey="secondaryFont"
          fontData={typography.secondaryFont || { source: 'google', family: 'Roboto', customUrl: '' }}
          customFontsLibrary={customFontsLibrary}
          onAddCustomFont={handleAddCustomFont}
          onRemoveCustomFont={handleRemoveCustomFontFromLibrary}
          onChange={handleFontCategoryChange}
          onUploadError={(err) => setToastError(err)}
        />

      </div>

      {/* Save Button */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Apply Universal Typography Settings</h4>
          <p className="text-xs text-gray-500 mt-0.5">Saves font selections and updates the entire website live.</p>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold shadow-md shadow-green-700/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
            'Save Typography Settings'
          )}
        </button>
      </div>

    </div>
  );
};

export default TypographySectionEditor;
