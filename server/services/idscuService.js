/**
 * IDSCU Public Education Directory Service
 * Documentation: https://idscu.org/api
 */

// Simple in-memory TTL cache for search queries
const searchCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Clean expired cache entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      searchCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

const getBaseUrl = () => {
  return process.env.IDSCU_BASE_URL || 'https://idscu.org/api/v1';
};

/**
 * Normalize raw IDSCU record into standard application format
 */
const normalizeRecord = (item) => {
  if (!item || typeof item !== 'object') return null;

  return {
    id: item.id || '',
    name: item.name_en || item.name_official || item.name || '',
    nameOfficial: item.name_official || '',
    acronym: item.acronym || '',
    slug: item.slug || '',
    country: item.country || '',
    countryCode: item.country_code || '',
    region: item.region || '',
    city: item.city || '',
    type: item.institution_type || (item.sector === 'K12' ? 'School' : 'Postsecondary'),
    sector: item.sector || '',
    pathway: item.primary_pathway || '',
    website: item.official_website || '',
    logoUrl: item.logo_url || null
  };
};

/**
 * Search IDSCU Directory
 * @param {Object} params - { q, country, sector, type, cursor }
 */
const searchInstitutions = async (params = {}) => {
  const { q = '', country = '', sector = '', type = '', cursor = '' } = params;
  
  // Build query string with valid parameters only
  const searchParams = new URLSearchParams();
  if (q && typeof q === 'string' && q.trim()) searchParams.set('q', q.trim());
  if (country && typeof country === 'string' && country.trim()) searchParams.set('country', country.trim());
  if (sector && typeof sector === 'string' && sector.trim()) searchParams.set('sector', sector.trim());
  if (type && typeof type === 'string' && type.trim()) searchParams.set('type', type.trim());
  if (cursor && typeof cursor === 'string' && cursor.trim()) searchParams.set('cursor', cursor.trim());

  const queryString = searchParams.toString();
  const cacheKey = `search:${queryString}`;

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const baseUrl = getBaseUrl();
  const targetUrl = `${baseUrl}/search${queryString ? `?${queryString}` : ''}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SahiJob-Education-Directory/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: true,
          data: [],
          nextCursor: null,
          message: 'No matching institutions found'
        };
      }
      throw new Error(`IDSCU API returned status ${res.status}`);
    }

    const rawData = await res.json();
    const rawItems = Array.isArray(rawData.data) ? rawData.data : [];
    const normalizedList = rawItems.map(normalizeRecord).filter(Boolean);
    const nextCursor = rawData.pagination?.next_cursor || rawData.next_cursor || null;

    const formattedResponse = {
      success: true,
      data: normalizedList,
      nextCursor: nextCursor,
      pagination: rawData.pagination || { next_cursor: nextCursor },
      filters: rawData.filters || {}
    };

    // Cache result
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: formattedResponse
    });

    return formattedResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('IDSCU search request timed out');
      return {
        success: false,
        data: [],
        nextCursor: null,
        message: 'Request timed out while contacting education directory.'
      };
    }

    console.error('IDSCU search service error:', error.message);
    return {
      success: false,
      data: [],
      nextCursor: null,
      message: 'Unable to fetch institutions from directory.'
    };
  }
};

/**
 * Get metadata release counts from IDSCU
 */
const getMetadata = async () => {
  const cacheKey = 'meta:release';
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 30 * 60 * 1000)) { // 30 min cache for meta
    return cached.data;
  }

  const baseUrl = getBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${baseUrl}/meta`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Meta status ${res.status}`);
    const metaData = await res.json();
    const result = { success: true, data: metaData };

    searchCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    return { success: false, message: 'Unable to retrieve directory metadata' };
  }
};

module.exports = {
  searchInstitutions,
  getMetadata
};
