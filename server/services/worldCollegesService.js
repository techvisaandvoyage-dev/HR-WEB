const fs = require('fs');
const path = require('path');

/**
 * World Colleges & Universities Service
 * High-performance in-memory service for the 50,000+ Colleges & Universities dataset.
 * Built with lazy loading, inverted token indexing, and zero-crash safe fallbacks.
 */

// Dataset file paths (checks server/data, root, and fallback path)
const DATA_FILE_PATHS = [
  path.join(__dirname, '../data/world_colleges_universities.json'),
  path.join(__dirname, '../../world_colleges_universities.json'),
  'C:\\Users\\yashr\\Downloads\\world_colleges_universities (1).json',
  'C:\\Users\\yashr\\Downloads\\world_colleges_universities.json'
];

let isLoaded = false;
let loadFailed = false;
let collegesList = []; // Array of normalized record objects
let collegesById = new Map(); // id (string & number) -> record
let tokenIndex = new Map(); // token -> array of indices in collegesList

/**
 * Text normalization helper (matches existing institutionService logic)
 */
const normalizeText = (text = '') => {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[.\-_/,()[\]{}|:;+*"'`]/g, ' ')
    .replace(/\b([a-z])\s+([a-z])\s+([a-z])\b/g, '$1$2$3')
    .replace(/\b([a-z])\s+([a-z])\b/g, '$1$2')
    .replace(/\bclg\b/g, 'college')
    .replace(/\bgovt\b/g, 'government')
    .replace(/\binst\b/g, 'institute')
    .replace(/\bdept\b/g, 'department')
    .replace(/\bengg\b/g, 'engineering')
    .replace(/\btech\b/g, 'technology')
    .replace(/\buniv\b/g, 'university')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Create composite unique key: (name + country + state + district)
 * Ensures colleges with identical names in different locations are preserved separately.
 */
const makeCompositeKey = (name = '', country = '', state = '', district = '') => {
  const n = normalizeText(name);
  const c = (country || 'India').trim().toLowerCase();
  const s = (state || '').trim().toLowerCase();
  const d = (district || '').trim().toLowerCase();
  return `${n}|${c}|${s}|${d}`;
};

/**
 * Infer type if missing or ambiguous
 */
const inferType = (name = '', rawType = '') => {
  const lower = (rawType || name || '').toLowerCase();
  if (lower.includes('university') || lower.includes('vishwavidyalaya')) return 'university';
  if (lower.includes('institute') || lower.includes('iit') || lower.includes('nit') || lower.includes('sansthan')) return 'institute';
  return 'college';
};

/**
 * Lazy load and index the dataset in memory once
 */
const ensureLoaded = () => {
  if (isLoaded || loadFailed) return;

  let filePathToUse = null;
  for (const fp of DATA_FILE_PATHS) {
    if (fs.existsSync(fp)) {
      filePathToUse = fp;
      break;
    }
  }

  if (!filePathToUse) {
    console.warn('[worldCollegesService] Warning: world_colleges_universities.json file not found. Falling back to primary dataset.');
    loadFailed = true;
    return;
  }

  const startTime = Date.now();
  try {
    const rawContent = fs.readFileSync(filePathToUse, 'utf8');
    const parsed = JSON.parse(rawContent);

    if (!Array.isArray(parsed)) {
      throw new Error('Dataset root is not an array.');
    }

    collegesList = new Array(parsed.length);
    collegesById = new Map();
    tokenIndex = new Map();

    for (let i = 0; i < parsed.length; i++) {
      const raw = parsed[i] || {};
      const rawName = String(raw.name || '')
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .replace(/\\"/g, '"')
        .trim();
      const normName = normalizeText(rawName);

      const stateStr = String(raw.state || '').trim();
      const districtStr = String(raw.district || '').trim();
      const countryStr = String(raw.country || 'India').trim();
      const parentUniv = String(raw.parent_university || '').trim();

      const websiteStr = raw.website
        ? String(raw.website).trim()
        : Array.isArray(raw.domains) && raw.domains[0]
        ? `https://${String(raw.domains[0]).trim()}`
        : '';

      const record = {
        id: `WCU-${raw.id}`,
        rawId: raw.id,
        name: rawName,
        normalizedName: normName,
        type: inferType(rawName, raw.type),
        sector: 'higher_education',
        collegeType: raw.college_type || '',
        country: countryStr,
        countryCode: countryStr.toLowerCase() === 'india' ? 'IN' : '',
        state: stateStr,
        district: districtStr,
        city: districtStr, // district acts as primary locality / city
        address: raw.address || '',
        website: websiteStr,
        domains: Array.isArray(raw.domains) ? raw.domains : [],
        affiliatedUniversity: parentUniv,
        institutionCode: raw.aishe_id || '',
        aisheId: raw.aishe_id || '',
        source: 'WCU',
        compositeKey: makeCompositeKey(rawName, countryStr, stateStr, districtStr)
      };

      collegesList[i] = record;
      collegesById.set(record.id, record);
      collegesById.set(String(raw.id), record);

      // Token indexing for fast lookup
      const tokens = normName.split(/\s+/).filter(Boolean);
      const seenTokensForRecord = new Set();

      for (const token of tokens) {
        if (token.length >= 2 && !seenTokensForRecord.has(token)) {
          seenTokensForRecord.add(token);
          let tokenArr = tokenIndex.get(token);
          if (!tokenArr) {
            tokenArr = [];
            tokenIndex.set(token, tokenArr);
          }
          tokenArr.push(i);
        }
      }

      // Also index state and district tokens so queries like "rungta bhilai" or "girls college ajmer" match
      const locTokens = normalizeText(`${districtStr} ${stateStr}`).split(/\s+/).filter(Boolean);
      for (const locToken of locTokens) {
        if (locToken.length >= 3 && !seenTokensForRecord.has(locToken)) {
          seenTokensForRecord.add(locToken);
          let locArr = tokenIndex.get(locToken);
          if (!locArr) {
            locArr = [];
            tokenIndex.set(locToken, locArr);
          }
          locArr.push(i);
        }
      }
    }

    isLoaded = true;
    console.log(`[worldCollegesService] Loaded & indexed ${collegesList.length} institutions in ${Date.now() - startTime}ms.`);
  } catch (err) {
    console.error('[worldCollegesService] Error loading world colleges JSON:', err.message);
    loadFailed = true;
  }
};

/**
 * Score a matching institution record for query ranking
 */
const scoreRecord = (item, rawQuery, normQuery, queryTokens) => {
  let score = 0;
  const itemNorm = item.normalizedName;
  const itemDist = normalizeText(item.district);
  const itemState = normalizeText(item.state);

  // Exact full name match
  if (itemNorm === normQuery) {
    return 8000;
  }

  // Name starts with query
  if (itemNorm.startsWith(normQuery)) {
    score += 4000;
  } else if (itemNorm.includes(normQuery)) {
    score += 2500;
  }

  // Token matching
  let matchedNameTokens = 0;
  let matchedLocTokens = 0;

  for (const t of queryTokens) {
    if (itemNorm.includes(t)) {
      matchedNameTokens++;
    } else if (itemDist.includes(t) || itemState.includes(t)) {
      matchedLocTokens++;
    }
  }

  score += (matchedNameTokens * 400) + (matchedLocTokens * 250);

  // Bonus if all query tokens are accounted for in name or location
  if (matchedNameTokens + matchedLocTokens >= queryTokens.length) {
    score += 1500;
  }

  // Bonus if university vs college
  if (item.type === 'university') score += 50;
  if (item.website) score += 20;

  return score;
};

/**
 * Search the 50k+ Colleges & Universities dataset
 * @param {Object} params - { q, country, state, district, type, limit }
 * @returns {Array<Object>} List of matched institution objects
 */
const searchWorldColleges = (params = {}) => {
  try {
    ensureLoaded();
  } catch (_) {}

  if (!isLoaded || collegesList.length === 0) {
    return [];
  }

  const {
    q = '',
    country = '',
    state = '',
    district = '',
    type = '',
    limit = 30
  } = params;

  const rawQ = String(q || '').trim();
  const normQ = normalizeText(rawQ);
  const queryTokens = normQ.split(/\s+/).filter(Boolean);
  const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);

  // Candidate index set
  let candidateIndices = null;

  if (queryTokens.length > 0) {
    // Find candidate records matching at least the first/significant tokens
    for (const token of queryTokens) {
      if (token.length < 2) continue;

      let exactMatches = tokenIndex.get(token);
      let matchingSet = new Set(exactMatches || []);

      // If token is >= 3 chars, also check prefix matches in token index
      if (token.length >= 3) {
        for (const [idxToken, indices] of tokenIndex.entries()) {
          if (idxToken !== token && idxToken.startsWith(token)) {
            for (const idx of indices) {
              matchingSet.add(idx);
            }
          }
        }
      }

      if (candidateIndices === null) {
        candidateIndices = matchingSet;
      } else {
        // Intersect candidate indices
        const intersection = new Set();
        for (const idx of candidateIndices) {
          if (matchingSet.has(idx)) {
            intersection.add(idx);
          }
        }
        // If intersection is non-empty, narrow down; otherwise keep candidates for scoring
        if (intersection.size > 0) {
          candidateIndices = intersection;
        }
      }
    }
  }

  let candidates = [];
  if (candidateIndices && candidateIndices.size > 0) {
    for (const idx of candidateIndices) {
      candidates.push(collegesList[idx]);
    }
  } else if (normQ.length >= 2) {
    // Fallback: substring linear scan if index didn't capture token
    candidates = collegesList.filter(item => item.normalizedName.includes(normQ));
  } else if (!normQ && (state || district || country)) {
    // Location-only filtering without text query
    candidates = collegesList;
  } else {
    return [];
  }

  // Apply optional filters safely
  if (country) {
    const cLow = country.trim().toLowerCase();
    candidates = candidates.filter(item => item.country.toLowerCase() === cLow);
  }
  if (state) {
    const sLow = state.trim().toLowerCase();
    candidates = candidates.filter(item => item.state.toLowerCase().includes(sLow));
  }
  if (district) {
    const dLow = district.trim().toLowerCase();
    candidates = candidates.filter(item => item.district.toLowerCase().includes(dLow) || item.city.toLowerCase().includes(dLow));
  }
  if (type) {
    const tLow = type.trim().toLowerCase();
    candidates = candidates.filter(item => item.type.toLowerCase() === tLow);
  }

  // Score and sort candidates
  const scored = candidates.map(item => ({
    item,
    score: scoreRecord(item, rawQ, normQ, queryTokens)
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxLimit).map(s => s.item);
};

/**
 * Get a specific institution by WCU ID or raw number
 */
const getWorldCollegeById = (id) => {
  try {
    ensureLoaded();
  } catch (_) {}

  if (!isLoaded || !id) return null;
  return collegesById.get(String(id)) || null;
};

/**
 * Get service dataset statistics
 */
const getStats = () => {
  try {
    ensureLoaded();
  } catch (_) {}
  return {
    isLoaded,
    totalRecords: collegesList.length,
    indexedTokens: tokenIndex.size
  };
};

module.exports = {
  searchWorldColleges,
  getWorldCollegeById,
  getStats,
  makeCompositeKey,
  normalizeText
};
