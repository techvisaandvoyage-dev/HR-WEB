/**
 * Utility for Source Attribution & Job Link Tracking
 * 
 * Resilient to:
 * - In-app browsers (WhatsApp, Instagram, Facebook WebViews)
 * - Blocked or restricted localStorage
 * - Survives page refreshes, redirects, and multi-step auth modals
 */

const STORAGE_KEY = 'sahijob_attribution';
const COOKIE_NAME = 'sahijob_attribution';
const COOKIE_EXPIRY_DAYS = 30;

// In-memory fallback if both localStorage and cookies are unavailable
let memoryAttribution = null;

/**
 * Cookie Helpers
 */
export const setCookie = (name, value, days = COOKIE_EXPIRY_DAYS) => {
  try {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    const serialized = encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : String(value));
    document.cookie = `${name}=${serialized}; ${expires}; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn('[Attribution] Cookie set failed:', err);
  }
};

export const getCookie = (name) => {
  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const raw = decodeURIComponent(c.substring(nameEQ.length, c.length));
        try {
          return JSON.parse(raw);
        } catch (_) {
          return raw;
        }
      }
    }
  } catch (err) {
    console.warn('[Attribution] Cookie read failed:', err);
  }
  return null;
};

export const deleteCookie = (name) => {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn('[Attribution] Cookie delete failed:', err);
  }
};

/**
 * Extract UTM and referral params from a URL search string or URLSearchParams
 */
export const extractSourceParams = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const utmSource = params.get('utm_source') || params.get('ref') || params.get('source') || '';
  const utmMedium = params.get('utm_medium') || '';
  const utmCampaign = params.get('utm_campaign') || '';

  return {
    utmSource: utmSource ? utmSource.trim() : null,
    utmMedium: utmMedium ? utmMedium.trim() : null,
    utmCampaign: utmCampaign ? utmCampaign.trim() : null,
  };
};

/**
 * Capture and store job link attribution
 * - Stores in localStorage AND 30-day first-party cookie
 * - Multiple job links before signup: first-touch is preserved in storage
 */
export const captureJobAttribution = (jobId, optionalParams = null) => {
  if (!jobId) return null;

  try {
    const existing = getStoredAttribution();
    const sourceParams = optionalParams || extractSourceParams();

    // If first-touch attribution is already recorded for this browser session, keep original first-touch
    if (existing && existing.jobId) {
      return existing;
    }

    const attribution = {
      jobId: String(jobId).trim(),
      slug: String(jobId).trim(),
      utmSource: sourceParams.utmSource || null,
      landedAt: new Date().toISOString()
    };

    // 1. Try LocalStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    } catch (lsErr) {
      console.warn('[Attribution] localStorage write blocked (in-app browser?), falling back to cookie:', lsErr);
    }

    // 2. Set first-party cookie (30 days expiry)
    setCookie(COOKIE_NAME, attribution, COOKIE_EXPIRY_DAYS);

    // 3. Memory fallback
    memoryAttribution = attribution;

    return attribution;
  } catch (err) {
    console.warn('[Attribution] captureJobAttribution error:', err);
    return null;
  }
};

/**
 * Retrieve currently stored attribution from localStorage, cookie, or in-app fallback
 */
export const getStoredAttribution = () => {
  try {
    // 1. Check LocalStorage
    try {
      const lsRaw = localStorage.getItem(STORAGE_KEY);
      if (lsRaw) {
        const parsed = JSON.parse(lsRaw);
        if (parsed && parsed.jobId) return parsed;
      }
    } catch (_) {}

    // 2. Check Cookie
    const cookieVal = getCookie(COOKIE_NAME);
    if (cookieVal && typeof cookieVal === 'object' && cookieVal.jobId) {
      return cookieVal;
    }

    // 3. Check In-Memory
    if (memoryAttribution && memoryAttribution.jobId) {
      return memoryAttribution;
    }

    // 4. In-App browser fallback from URL query if user is currently on an apply-job URL
    const pathname = window.location.pathname;
    const match = pathname.match(/\/(?:apply-job|apply|jobs|job)\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const { utmSource } = extractSourceParams();
      return {
        jobId: match[1],
        slug: match[1],
        utmSource: utmSource || null,
        landedAt: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('[Attribution] getStoredAttribution error:', err);
  }
  return null;
};

/**
 * Clear stored attribution after successful signup or attribution confirmation
 */
export const clearStoredAttribution = () => {
  try {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    deleteCookie(COOKIE_NAME);
    memoryAttribution = null;
  } catch (err) {
    console.warn('[Attribution] clearStoredAttribution error:', err);
  }
};

/**
 * Log a job visit interaction event to backend API
 * Events: 'landed', 'started_application', 'applied'
 */
export const logJobVisitEvent = async (jobId, event = 'landed', customUtm = null) => {
  if (!jobId) return;

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token') || localStorage.getItem('employeeToken');
    const stored = getStoredAttribution();
    const utmSource = customUtm || stored?.utmSource || extractSourceParams().utmSource;

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`${API_URL}/api/employee/jobs/${jobId}/visit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event,
        utmSource: utmSource || undefined
      })
    });
  } catch (err) {
    // Non-blocking telemetry
    console.warn('[Attribution] Telemetry visit ping failed:', err.message);
  }
};
