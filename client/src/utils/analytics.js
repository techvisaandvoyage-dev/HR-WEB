// Google Analytics 4 (GA4) Integration with Consent Mode v2

let isInitialized = false;
let currentGaId = null;
let shouldExcludeAdmin = true;

/**
 * Check if the current user has an admin session
 */
export const isAdminUser = () => {
  try {
    return Boolean(localStorage.getItem('adminToken') || localStorage.getItem('token'));
  } catch (_) {
    return false;
  }
};

/**
 * Check user cookie consent status from localStorage
 */
export const getConsentStatus = () => {
  try {
    return localStorage.getItem('sahijob_cookie_consent'); // 'granted', 'denied', or null
  } catch (_) {
    return null;
  }
};

/**
 * Initialize Google Analytics 4
 * @param {Object} options 
 * @param {string} options.measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
 * @param {boolean} options.enableAnalytics - Global toggle
 * @param {boolean} options.excludeAdmin - Whether to skip tracking for admin users
 */
export const initAnalytics = (options = {}) => {
  if (typeof window === 'undefined') return;

  const { measurementId, enableAnalytics = true, excludeAdmin = true } = options;

  if (!enableAnalytics || !measurementId || !measurementId.startsWith('G-')) {
    return;
  }

  shouldExcludeAdmin = excludeAdmin;
  if (shouldExcludeAdmin && isAdminUser()) {
    console.info('[GA4] Admin user detected — tracking disabled per settings.');
    return;
  }

  if (isInitialized && currentGaId === measurementId) {
    return;
  }

  currentGaId = measurementId;

  // Initialize dataLayer & gtag function
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // 1. Setup Google Consent Mode v2 (default to denied or saved preference)
  const savedConsent = getConsentStatus();
  const consentState = savedConsent === 'granted' ? 'granted' : 'denied';

  gtag('consent', 'default', {
    ad_storage: consentState,
    analytics_storage: consentState,
    ad_user_data: consentState,
    ad_personalization: consentState,
    wait_for_update: 500
  });

  // 2. Load gtag.js asynchronously
  const existingScript = document.getElementById('ga4-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  // 3. Configure GA4
  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: false, // We handle SPA page views manually
    anonymize_ip: true
  });

  isInitialized = true;
};

/**
 * Update user consent state (Consent Mode v2)
 * @param {boolean} granted 
 */
export const updateConsent = (granted) => {
  try {
    localStorage.setItem('sahijob_cookie_consent', granted ? 'granted' : 'denied');
  } catch (_) {}

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    const state = granted ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      ad_storage: state,
      analytics_storage: state,
      ad_user_data: state,
      ad_personalization: state
    });
  }
};

/**
 * Track Page Views (SPA Route Change)
 * @param {string} path 
 * @param {string} title 
 */
export const trackPageView = (path, title) => {
  if (typeof window === 'undefined' || !isInitialized) return;
  if (shouldExcludeAdmin && isAdminUser()) return;

  if (typeof window.gtag === 'function' && currentGaId) {
    window.gtag('event', 'page_view', {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      page_location: window.location.href
    });
  }
};

/**
 * Track custom event in GA4
 * @param {string} eventName 
 * @param {Object} params 
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined' || !isInitialized) return;
  if (shouldExcludeAdmin && isAdminUser()) return;

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...params,
      timestamp: new Date().toISOString()
    });
  }
};

/* -------------------------------------------------------------
 * Convenience Helpers for Key Job Portal Events
 * ------------------------------------------------------------- */

/** 1. Job View */
export const trackJobView = (job) => {
  if (!job) return;
  trackEvent('job_view', {
    job_id: job._id || job.id,
    job_title: job.title || job.jobTitle,
    company: job.company || (job.details && job.details.company),
    location: job.location,
    salary: job.salary
  });
};

/** 2. Job Apply Click */
export const trackJobApplyClick = (job, applyType = 'direct') => {
  if (!job) return;
  trackEvent('job_apply_click', {
    job_id: job._id || job.id,
    job_title: job.title || job.jobTitle,
    company: job.company,
    apply_type: applyType // 'easy_apply', 'external', 'direct'
  });
};

/** 3. Job Search */
export const trackJobSearch = (keyword = '', location = '', category = '', resultsCount = 0) => {
  trackEvent('job_search', {
    search_term: keyword,
    search_location: location,
    search_category: category,
    results_count: resultsCount
  });
};

/** 4. Job Save / Bookmark */
export const trackJobSave = (job) => {
  if (!job) return;
  trackEvent('job_save', {
    job_id: job._id || job.id,
    job_title: job.title
  });
};

/** 5. Signup */
export const trackSignup = (method = 'email', role = 'candidate') => {
  trackEvent('signup', {
    method,
    user_role: role
  });
};

/** 6. Login */
export const trackLogin = (method = 'email', role = 'candidate') => {
  trackEvent('login', {
    method,
    user_role: role
  });
};

/** 7. Share Click */
export const trackShareClick = (platform, job) => {
  trackEvent('share_click', {
    platform, // 'whatsapp', 'linkedin', 'twitter', 'facebook', 'copy_link'
    job_id: job?._id || job?.id,
    job_title: job?.title
  });
};

/** 8. WhatsApp / Telegram Direct Click */
export const trackCommunityClick = (channel, meta = {}) => {
  trackEvent('whatsapp_or_telegram_click', {
    channel, // 'whatsapp', 'telegram'
    ...meta
  });
};
