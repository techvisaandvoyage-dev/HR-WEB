import React, { useState, useEffect, useRef } from 'react';
import { 
  Globe, 
  Search, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Moon, 
  Sun, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Trash2,
  Check
} from 'lucide-react';
import { uploadFileToStorage } from '../utils/firebaseStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEFAULT_SEO = {
  siteName: 'SahiJob',
  metaTitle: 'sahijob.com - Find Your Dream Job in India | Top Recruitment Portal',
  metaDescription: 'Search and apply for top jobs in IT, Sales, Marketing, and Engineering across India on sahijob.com. Connect with verified employers and get hired.',
  canonicalUrl: 'https://sahijob.com',
  metaKeywords: 'jobs in india, freshers jobs, it jobs, marketing careers, sahijob, recruitment portal',
  favicon: '',
  googleSiteVerification: '',
  gaMeasurementId: '',
  
  // 4 Core Sitelinks requested by user (matching Naukri.com)
  sitelinks: {
    candidateLogin: {
      title: 'Login or Register',
      description: 'Login Now & Get access to Jobs not posted publicly anywhere ...',
      url: 'https://sahijob.com/?auth=candidate'
    },
    searchJobs: {
      title: 'Search Jobs',
      description: 'Search thousands of Jobs across top companies in India ...',
      url: 'https://sahijob.com/?search=all'
    },
    employerLogin: {
      title: 'Employer Hiring Portal',
      description: 'Post jobs, search candidate resumes and hire top talent fast ...',
      url: 'https://sahijob.com/?auth=employer'
    },
    consultantLogin: {
      title: 'Consultant Login',
      description: 'Recruitment partner and consultant login to manage multiple clients ...',
      url: 'https://sahijob.com/?auth=consultant'
    }
  }
};

export default function SEOSettingsManager() {
  const [seo, setSeo] = useState(DEFAULT_SEO);
  const [previewTheme, setPreviewTheme] = useState('dark'); // 'dark' | 'light' (matches user's Google Dark mode screenshot)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [rebuildingSitemap, setRebuildingSitemap] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const faviconInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4500);
  };

  // Fetch current SEO settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/site-settings`);
      const data = await res.json();
      if (data.success && data.data?.seo) {
        const fetched = data.data.seo;
        setSeo({
          siteName: fetched.siteName || DEFAULT_SEO.siteName,
          metaTitle: fetched.metaTitle || DEFAULT_SEO.metaTitle,
          metaDescription: fetched.metaDescription || DEFAULT_SEO.metaDescription,
          canonicalUrl: fetched.canonicalUrl || DEFAULT_SEO.canonicalUrl,
          metaKeywords: fetched.metaKeywords || DEFAULT_SEO.metaKeywords,
          favicon: fetched.favicon || '',
          googleSiteVerification: fetched.googleSiteVerification || '',
          gaMeasurementId: fetched.gaMeasurementId || '',
          sitelinks: {
            candidateLogin: {
              title: fetched.sitelinks?.candidateLogin?.title || DEFAULT_SEO.sitelinks.candidateLogin.title,
              description: fetched.sitelinks?.candidateLogin?.description || DEFAULT_SEO.sitelinks.candidateLogin.description,
              url: fetched.sitelinks?.candidateLogin?.url || DEFAULT_SEO.sitelinks.candidateLogin.url
            },
            searchJobs: {
              title: fetched.sitelinks?.searchJobs?.title || DEFAULT_SEO.sitelinks.searchJobs.title,
              description: fetched.sitelinks?.searchJobs?.description || DEFAULT_SEO.sitelinks.searchJobs.description,
              url: fetched.sitelinks?.searchJobs?.url || DEFAULT_SEO.sitelinks.searchJobs.url
            },
            employerLogin: {
              title: fetched.sitelinks?.employerLogin?.title || DEFAULT_SEO.sitelinks.employerLogin.title,
              description: fetched.sitelinks?.employerLogin?.description || DEFAULT_SEO.sitelinks.employerLogin.description,
              url: fetched.sitelinks?.employerLogin?.url || DEFAULT_SEO.sitelinks.employerLogin.url
            },
            consultantLogin: {
              title: fetched.sitelinks?.consultantLogin?.title || DEFAULT_SEO.sitelinks.consultantLogin.title,
              description: fetched.sitelinks?.consultantLogin?.description || DEFAULT_SEO.sitelinks.consultantLogin.description,
              url: fetched.sitelinks?.consultantLogin?.url || DEFAULT_SEO.sitelinks.consultantLogin.url
            }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching SEO settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Favicon Upload Handler
  const handleFaviconFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image') && !file.name.endsWith('.ico') && !file.name.endsWith('.svg')) {
      showError('Please upload an image file (.png, .ico, .svg, .jpg).');
      return;
    }

    try {
      setUploadingFavicon(true);
      let downloadUrl = '';
      try {
        downloadUrl = await uploadFileToStorage(file, 'favicons');
      } catch (fbErr) {
        // Fallback to base64 Data URL if Firebase has an issue
        downloadUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setSeo(prev => ({ ...prev, favicon: downloadUrl }));
      showToast('Favicon uploaded! Click "Save Changes" to publish it.');
    } catch (err) {
      console.error('Favicon upload error:', err);
      showError('Failed to upload favicon. Please try again.');
    } finally {
      setUploadingFavicon(false);
    }
  };

  // Remove custom favicon
  const handleRemoveFavicon = () => {
    setSeo(prev => ({ ...prev, favicon: '' }));
    if (faviconInputRef.current) faviconInputRef.current.value = '';
    showToast('Favicon removed (reverted to default logo). Click "Save Changes" to publish.');
  };

  // Save changes
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/admin/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seo })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Google Search & Favicon settings saved successfully!');
      } else {
        showError(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      showError('Error saving SEO settings.');
    } finally {
      setSaving(false);
    }
  };

  // Rebuild Sitemap
  const handleRebuildSitemap = async () => {
    try {
      setRebuildingSitemap(true);
      const res = await fetch(`${API_URL}/api/seo/admin/regenerate-sitemap`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Sitemap rebuilt successfully! (${data.totalUrls} URLs indexed)`);
      } else {
        showError('Could not rebuild sitemap.');
      }
    } catch (err) {
      showError('Error rebuilding sitemap.');
    } finally {
      setRebuildingSitemap(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-gray-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-[300] bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <AlertCircle className="w-5 h-5 text-white shrink-0" />
          <span className="text-xs font-bold">{errorMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Google Search Result, Favicon & Sitelinks
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Globe className="w-7 h-7 text-emerald-600 shrink-0" />
            SEO & Google Visibility
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Replace the generic fallback title/description on Google, upload your custom site favicon, and configure the 4 core Google Sitelinks (Candidate, Search Jobs, Employer, Consultant).
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-7 py-3 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* CARD 1: LIVE GOOGLE SEARCH PREVIEW (EXACT NAUKRI STYLE)                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Live Google Search Result Preview
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This preview shows how SahiJob appears on Google search results after your changes are saved.
            </p>
          </div>

          {/* Dark / Light Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPreviewTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewTheme === 'dark' ? 'bg-gray-900 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Google Dark Mode</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewTheme === 'light' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Google Light Mode</span>
            </button>
          </div>
        </div>

        {/* Google SERP Preview Box */}
        <div className={`p-6 sm:p-8 rounded-2xl transition-colors font-sans ${
          previewTheme === 'dark' ? 'bg-[#202124] text-[#bdc1c6]' : 'bg-[#ffffff] text-[#4d5156] border border-gray-200'
        }`}>
          
          {/* Google Result Header (Favicon + Domain + URL) */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#1a73e8] flex items-center justify-center overflow-hidden shadow-xs shrink-0">
              {seo.favicon ? (
                <img src={seo.favicon} alt="Favicon" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-extrabold text-xs">S</span>
              )}
            </div>
            <div className="min-w-0">
              <div className={`text-[14px] font-normal leading-none ${previewTheme === 'dark' ? 'text-[#dadce0]' : 'text-[#202124]'}`}>
                {seo.siteName || 'SahiJob.com'}
              </div>
              <div className={`text-[12px] truncate leading-tight mt-0.5 ${previewTheme === 'dark' ? 'text-[#bdc1c6]' : 'text-[#5f6368]'}`}>
                {seo.canonicalUrl || 'https://sahijob.com'}
              </div>
            </div>
            <div className={`ml-auto text-base ${previewTheme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#70757a]'}`}>
              ⋮
            </div>
          </div>

          {/* Main Title (replaces the old 'sahijob.com - Find Jobs & Hire Talent') */}
          <h3 className={`text-[20px] sm:text-[22px] font-normal leading-snug hover:underline cursor-pointer mb-1.5 ${
            previewTheme === 'dark' ? 'text-[#99c3ff]' : 'text-[#1a0dab]'
          }`}>
            {seo.metaTitle || 'SahiJob: Jobs - Recruitment - Job Search - Employment in India'}
          </h3>

          {/* Main Snippet (replaces the old fake contact email/phone) */}
          <p className={`text-[13px] sm:text-[14px] leading-relaxed mb-6 max-w-3xl ${
            previewTheme === 'dark' ? 'text-[#bdc1c6]' : 'text-[#4d5156]'
          }`}>
            <span className="font-semibold">{seo.siteName || 'SahiJob'}: </span>
            {seo.metaDescription || 'Connect with 10,000+ employers. Apply to thousands of job opportunities across top companies, industries and locations in India.'}
          </p>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: FAVICON UPLOAD SECTION (REQUESTED BY USER)                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Favicon Upload</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload your official site icon. Google displays this favicon beside your website title in search results.
            </p>
          </div>
        </div>

        <div className="p-5 bg-gray-50/70 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
          {/* Favicon Preview */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center p-2 shadow-2xs overflow-hidden">
              {seo.favicon ? (
                <img src={seo.favicon} alt="Favicon" className="w-full h-full object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center text-white font-extrabold text-base">
                  S
                </div>
              )}
            </div>
            {seo.favicon && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Upload Controls */}
          <div className="space-y-2.5 flex-1 text-center sm:text-left">
            <div>
              <h4 className="text-xs font-bold text-gray-900">
                {seo.favicon ? 'Custom Favicon Active' : 'Default Favicon Active'}
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Recommended: Square image (.png, .ico, .svg, .jpg), at least 48x48px or 96x96px.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <input
                ref={faviconInputRef}
                type="file"
                accept=".ico,.png,.svg,.jpg,.jpeg,.webp"
                onChange={handleFaviconFileChange}
                className="hidden"
                id="favicon-upload-input"
              />
              <label
                htmlFor="favicon-upload-input"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                  uploadingFavicon ? 'opacity-60 cursor-wait' : ''
                }`}
              >
                {uploadingFavicon ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploadingFavicon ? 'Uploading...' : 'Upload Favicon Image'}</span>
              </label>

              {seo.favicon && (
                <button
                  type="button"
                  onClick={handleRemoveFavicon}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Favicon</span>
                </button>
              )}
            </div>

            {/* Direct URL input fallback */}
            <div className="pt-2">
              <input
                type="url"
                value={seo.favicon}
                onChange={(e) => setSeo({ ...seo, favicon: e.target.value })}
                placeholder="Or paste direct Favicon URL (e.g. https://sahijob.com/favicon.png)"
                className="w-full max-w-lg px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:border-indigo-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 3: MAIN SITE SEARCH SETTINGS                                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Main Google Search Result Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Controls the title and description shown on Google search results (replaces the old fake contact info).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Site Brand Name</label>
            <input
              type="text"
              value={seo.siteName}
              onChange={(e) => setSeo({ ...seo, siteName: e.target.value })}
              placeholder="SahiJob"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#29953f] focus:bg-white outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Official Website URL</label>
            <input
              type="url"
              value={seo.canonicalUrl}
              onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
              placeholder="https://sahijob.com"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#29953f] focus:bg-white outline-none font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">Google Search Title (Meta Title)</label>
              <span className={`text-[11px] font-semibold ${seo.metaTitle?.length > 60 ? 'text-amber-600' : 'text-gray-400'}`}>
                {seo.metaTitle?.length || 0} / 60 characters recommended
              </span>
            </div>
            <input
              type="text"
              value={seo.metaTitle}
              onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
              placeholder="SahiJob: Jobs - Recruitment - Job Search - Employment in India"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#29953f] focus:bg-white outline-none font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">Google Search Description (Meta Description)</label>
              <span className={`text-[11px] font-semibold ${seo.metaDescription?.length > 160 ? 'text-amber-600' : 'text-gray-400'}`}>
                {seo.metaDescription?.length || 0} / 160 characters recommended
              </span>
            </div>
            <textarea
              rows={3}
              value={seo.metaDescription}
              onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
              placeholder="Connect with 10,000+ employers. Apply to thousands of job opportunities across top companies, industries and locations in India. Apply online."
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-[#29953f] focus:bg-white outline-none font-medium"
            />
          </div>
        </div>
      </div>




      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#29953f] hover:bg-green-700 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save All Changes</span>
        </button>
      </div>

    </div>
  );
}
