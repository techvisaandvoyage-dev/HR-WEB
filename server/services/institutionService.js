const Institution = require('../models/Institution');

// In-memory cache for ultra-fast query responses (3 min TTL)
const queryCache = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of queryCache.entries()) {
    if (now - v.timestamp > CACHE_TTL_MS) queryCache.delete(k);
  }
}, 5 * 60 * 1000);

// Stop words ignored during acronym generation
const STOP_WORDS = new Set([
  'of', 'and', 'the', 'in', 'for', 'at', 'on', 'to', 'a', 'an', 'de', 'la', 'da', 
  '&', 'autonomous', 'central', 'state', 'national'
]);

// Hindi / Sanskrit / Indian educational terminology mappings
const TERM_EQUIVALENTS = [
  { pattern: /\bvishwavidyalaya\b/gi, replacement: 'University', termAcronym: 'U', origAcronym: 'V' },
  { pattern: /\bvishwa vidyalaya\b/gi, replacement: 'University', termAcronym: 'U', origAcronym: 'V' },
  { pattern: /\bmahavidyalaya\b/gi, replacement: 'College', termAcronym: 'C', origAcronym: 'M' },
  { pattern: /\bmaha vidyalaya\b/gi, replacement: 'College', termAcronym: 'C', origAcronym: 'M' },
  { pattern: /\bsansthan\b/gi, replacement: 'Institute', termAcronym: 'I', origAcronym: 'S' },
  { pattern: /\bsanstha\b/gi, replacement: 'Institute', termAcronym: 'I', origAcronym: 'S' },
  { pattern: /\bvidyapeeth\b/gi, replacement: 'University', termAcronym: 'U', origAcronym: 'V' },
  { pattern: /\bvidyapeetha\b/gi, replacement: 'University', termAcronym: 'U', origAcronym: 'V' },
  { pattern: /\bkendra\b/gi, replacement: 'Centre', termAcronym: 'C', origAcronym: 'K' }
];

/**
 * Robust search query & text normalization
 */
const normalizeText = (text = '') => {
  if (typeof text !== 'string') return '';
  let normalized = text
    .toLowerCase()
    // Replace punctuation, hyphens, dots, brackets, slashes with spaces
    .replace(/[.\-_/,()[\]{}|:;+*]/g, ' ')
    // Collapse single-letter separated initials: e.g. "g g u" -> "ggu", "i i t" -> "iit"
    .replace(/\b([a-z])\s+([a-z])\s+([a-z])\b/g, '$1$2$3')
    .replace(/\b([a-z])\s+([a-z])\b/g, '$1$2')
    // Standard shorthand expansions
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
  return normalized;
};

/**
 * Determine institution type from name or sector
 */
const inferInstitutionType = (name = '', sourceSector = '') => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('university') || lower.includes('vishwavidyalaya') || lower.includes('vishwa vidyalaya') || lower.includes('deemed university') || lower.includes('vidyapeeth')) return 'university';
  if (lower.includes('college') || lower.includes('mahavidyalaya') || lower.includes('degree college')) return 'college';
  if (lower.includes('school') || lower.includes('vidyalaya') || lower.includes('academy') || sourceSector === 'K12') return 'school';
  if (lower.includes('institute') || lower.includes('iit') || lower.includes('iim') || lower.includes('nit') || lower.includes('aiims') || lower.includes('sansthan')) return 'institute';
  return 'college';
};

/**
 * Generic Acronym and Alias Generator
 * Extracts acronyms, initials, translation variants, and common aliases for any institution
 */
const generateAcronymsAndAliases = (name = '', city = '', state = '', customAliases = [], customAcronyms = []) => {
  const aliasesSet = new Set();
  const acronymsSet = new Set();

  if (Array.isArray(customAliases)) {
    customAliases.forEach(a => { if (a && typeof a === 'string') aliasesSet.add(a.trim()); });
  }
  if (Array.isArray(customAcronyms)) {
    customAcronyms.forEach(a => { if (a && typeof a === 'string') acronymsSet.add(a.trim().toUpperCase()); });
  }

  const rawClean = name.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // 1. Extract bracketed/parenthesized aliases from name (e.g. "IIT Delhi", "GGU", "RCET")
  const bracketMatches = name.match(/\(([^)]+)\)/g);
  if (bracketMatches) {
    bracketMatches.forEach(b => {
      const inner = b.replace(/[()]/g, '').trim();
      if (inner.length >= 2) {
        aliasesSet.add(inner);
        if (inner.length <= 8 && !inner.includes(' ')) {
          acronymsSet.add(inner.toUpperCase());
        }
      }
    });
  }

  // 2. Generate standard initialism from words
  const cleanTokens = rawClean.split(/\s+/).filter(w => w.length > 0);
  const significantTokens = cleanTokens.filter(w => !STOP_WORDS.has(w.toLowerCase()));

  if (significantTokens.length >= 2) {
    const primaryAcronym = significantTokens.map(w => w[0].toUpperCase()).join('');
    if (primaryAcronym.length >= 2 && primaryAcronym.length <= 7) {
      acronymsSet.add(primaryAcronym);
    }
  }

  // 3. Indian Language Term Translations (e.g., Vishwavidyalaya <-> University)
  let translatedName = name;
  let hasTranslation = false;
  TERM_EQUIVALENTS.forEach(({ pattern, replacement }) => {
    if (pattern.test(translatedName)) {
      translatedName = translatedName.replace(pattern, replacement);
      hasTranslation = true;
    }
  });

  if (hasTranslation) {
    aliasesSet.add(translatedName);
    const transTokens = translatedName.replace(/[()]/g, ' ').split(/\s+/).filter(w => w && !STOP_WORDS.has(w.toLowerCase()));
    if (transTokens.length >= 2) {
      const transAcronym = transTokens.map(w => w[0].toUpperCase()).join('');
      if (transAcronym.length >= 2 && transAcronym.length <= 7) {
        acronymsSet.add(transAcronym);
      }
    }
  }

  // 4. Common Premier Institutes compound abbreviations (e.g. IIT + Delhi -> IITD, IIM + Ahmedabad -> IIMA)
  const cityClean = (city || '').trim();
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('indian institute of technology') || lowerName.includes('iit')) {
    acronymsSet.add('IIT');
    if (cityClean) {
      aliasesSet.add(`IIT ${cityClean}`);
      acronymsSet.add(`IIT${cityClean[0].toUpperCase()}`);
    }
  } else if (lowerName.includes('indian institute of management') || lowerName.includes('iim')) {
    acronymsSet.add('IIM');
    if (cityClean) {
      aliasesSet.add(`IIM ${cityClean}`);
      acronymsSet.add(`IIM${cityClean[0].toUpperCase()}`);
    }
  } else if (lowerName.includes('national institute of technology') || lowerName.includes('nit')) {
    acronymsSet.add('NIT');
    if (cityClean) {
      aliasesSet.add(`NIT ${cityClean}`);
      acronymsSet.add(`NIT${cityClean[0].toUpperCase()}`);
    }
  } else if (lowerName.includes('all india institute of medical sciences') || lowerName.includes('aiims')) {
    acronymsSet.add('AIIMS');
    if (cityClean) {
      aliasesSet.add(`AIIMS ${cityClean}`);
    }
  } else if (lowerName.includes('university of delhi') || lowerName.includes('delhi university')) {
    acronymsSet.add('DU');
    aliasesSet.add('DU Delhi');
    aliasesSet.add('Delhi University');
  } else if (lowerName.includes('jawaharlal nehru university')) {
    acronymsSet.add('JNU');
    aliasesSet.add('JNU Delhi');
  } else if (lowerName.includes('banaras hindu university')) {
    acronymsSet.add('BHU');
    aliasesSet.add('BHU Varanasi');
  }

  // Add Acronym + City to aliases
  for (const acr of acronymsSet) {
    if (cityClean) {
      aliasesSet.add(`${acr} ${cityClean}`);
    }
  }

  const aliases = Array.from(aliasesSet);
  const normalizedAliases = Array.from(new Set(aliases.map(a => normalizeText(a)).filter(Boolean)));
  const acronyms = Array.from(acronymsSet);
  const normalizedAcronyms = Array.from(new Set(acronyms.map(a => a.toLowerCase())));

  return {
    aliases,
    normalizedAliases,
    acronyms,
    normalizedAcronyms
  };
};

/**
 * Score and rank matched institutions based on exactness, acronyms, and location awareness
 */
const scoreCandidate = (inst, rawQuery, normalizedQuery, queryTokens) => {
  let score = 0;
  const instNormName = inst.normalizedName || normalizeText(inst.name);
  const instAliases = (inst.normalizedAliases || []).concat((inst.aliases || []).map(a => normalizeText(a)));
  const instAcronyms = (inst.normalizedAcronyms || []).concat((inst.acronyms || []).map(a => a.toLowerCase()));
  const instCity = normalizeText(inst.city);
  const instState = normalizeText(inst.state);
  const instDistrict = normalizeText(inst.district);
  const instCountry = normalizeText(inst.country);

  // 1. Highest: Exact full name match
  if (instNormName === normalizedQuery) {
    return 10000;
  }

  // 2. Exact alias match (e.g. "guru ghasidas university" -> Guru Ghasidas Vishwavidyalaya)
  if (instAliases.includes(normalizedQuery)) {
    score = Math.max(score, 9000);
  }

  // 3. Exact acronym match (e.g. query "ggu" or "ggv" -> Guru Ghasidas Vishwavidyalaya)
  if (instAcronyms.includes(normalizedQuery)) {
    score = Math.max(score, 8500);
  }

  // 4. Acronym + Location compound match (e.g. query "ggu bilaspur", "ggu chhattisgarh", "ggu bilaspur chhattisgarh")
  if (queryTokens.length >= 2) {
    const hasAcronymMatch = queryTokens.some(t => instAcronyms.includes(t));
    const locationTokens = queryTokens.filter(t => !instAcronyms.includes(t));
    const hasLocationMatch = locationTokens.length > 0 && locationTokens.every(t => 
      instCity.includes(t) || instState.includes(t) || instDistrict.includes(t) || instCountry.includes(t)
    );

    if (hasAcronymMatch && hasLocationMatch) {
      score = Math.max(score, 8000 + (queryTokens.length * 100));
    }
  }

  // 5. Name tokens + Location compound match (e.g. "guru ghasidas bilaspur")
  if (queryTokens.length >= 2) {
    let nameTokenMatches = 0;
    let locTokenMatches = 0;

    queryTokens.forEach(t => {
      if (instNormName.includes(t) || instAliases.some(a => a.includes(t))) {
        nameTokenMatches++;
      }
      if (instCity.includes(t) || instState.includes(t) || instDistrict.includes(t) || instCountry.includes(t)) {
        locTokenMatches++;
      }
    });

    if (nameTokenMatches >= 1 && locTokenMatches >= 1 && (nameTokenMatches + locTokenMatches >= queryTokens.length)) {
      score = Math.max(score, 7500 + (nameTokenMatches * 100) + (locTokenMatches * 50));
    }
  }

  // 6. All query tokens present in institution name
  const allTokensInName = queryTokens.length > 0 && queryTokens.every(t => instNormName.includes(t));
  if (allTokensInName) {
    score = Math.max(score, 7000 + (instNormName.startsWith(normalizedQuery) ? 500 : 0));
  }

  // 7. All query tokens present in any alias
  const allTokensInAlias = queryTokens.length > 0 && instAliases.some(a => queryTokens.every(t => a.includes(t)));
  if (allTokensInAlias) {
    score = Math.max(score, 6500);
  }

  // 8. Prefix match on institution name
  if (instNormName.startsWith(normalizedQuery)) {
    score = Math.max(score, 6000);
  }

  // 9. Substring match on institution name
  if (instNormName.includes(normalizedQuery)) {
    score = Math.max(score, 5000);
  }

  // 10. Partial token matches
  let matchedTokens = 0;
  queryTokens.forEach(t => {
    if (instNormName.includes(t) || instAcronyms.includes(t) || instAliases.some(a => a.includes(t))) {
      matchedTokens++;
    }
  });

  if (matchedTokens > 0) {
    score = Math.max(score, 1000 + (matchedTokens * 500));
  }

  // Type & Status Boost
  if (inst.status === 'verified') score += 50;
  if (inst.sector === 'higher_education') score += 30;
  if (inst.type === 'university') score += 20;

  return score;
};

const ALL_INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry', 
  'Jammu & Kashmir', 'Ladakh'
];

const INDIAN_CITY_STATE_MAP = {
  // Chhattisgarh
  'bhilai': { city: 'Bhilai', state: 'Chhattisgarh' },
  'raipur': { city: 'Raipur', state: 'Chhattisgarh' },
  'bilaspur': { city: 'Bilaspur', state: 'Chhattisgarh' },
  'durg': { city: 'Durg', state: 'Chhattisgarh' },
  'korba': { city: 'Korba', state: 'Chhattisgarh' },
  'rajnandgaon': { city: 'Rajnandgaon', state: 'Chhattisgarh' },
  'jagdalpur': { city: 'Jagdalpur', state: 'Chhattisgarh' },
  'raigarh': { city: 'Raigarh', state: 'Chhattisgarh' },
  'ambikapur': { city: 'Ambikapur', state: 'Chhattisgarh' },
  
  // Maharashtra
  'mumbai': { city: 'Mumbai', state: 'Maharashtra' },
  'pune': { city: 'Pune', state: 'Maharashtra' },
  'nagpur': { city: 'Nagpur', state: 'Maharashtra' },
  'nashik': { city: 'Nashik', state: 'Maharashtra' },
  'aurangabad': { city: 'Aurangabad', state: 'Maharashtra' },
  'chhatrapati sambhajinagar': { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra' },
  'navi mumbai': { city: 'Navi Mumbai', state: 'Maharashtra' },
  'thane': { city: 'Thane', state: 'Maharashtra' },
  'kolhapur': { city: 'Kolhapur', state: 'Maharashtra' },
  'solapur': { city: 'Solapur', state: 'Maharashtra' },
  'amravati': { city: 'Amravati', state: 'Maharashtra' },
  'nanded': { city: 'Nanded', state: 'Maharashtra' },
  
  // Karnataka
  'bengaluru': { city: 'Bengaluru', state: 'Karnataka' },
  'bangalore': { city: 'Bengaluru', state: 'Karnataka' },
  'mysuru': { city: 'Mysuru', state: 'Karnataka' },
  'mysore': { city: 'Mysuru', state: 'Karnataka' },
  'mangalore': { city: 'Mangalore', state: 'Karnataka' },
  'mangaluru': { city: 'Mangaluru', state: 'Karnataka' },
  'hubli': { city: 'Hubli', state: 'Karnataka' },
  'belgaum': { city: 'Belgaum', state: 'Karnataka' },
  'belagavi': { city: 'Belagavi', state: 'Karnataka' },
  'manipal': { city: 'Manipal', state: 'Karnataka' },
  'gulbarga': { city: 'Kalaburagi', state: 'Karnataka' },
  'kalaburagi': { city: 'Kalaburagi', state: 'Karnataka' },
  'dharwad': { city: 'Dharwad', state: 'Karnataka' },
  'shimoga': { city: 'Shivamogga', state: 'Karnataka' },

  // Delhi NCR / UP / Haryana
  'delhi': { city: 'Delhi', state: 'Delhi' },
  'new delhi': { city: 'New Delhi', state: 'Delhi' },
  'noida': { city: 'Noida', state: 'Uttar Pradesh' },
  'greater noida': { city: 'Greater Noida', state: 'Uttar Pradesh' },
  'ghaziabad': { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  'gurugram': { city: 'Gurugram', state: 'Haryana' },
  'gurgaon': { city: 'Gurugram', state: 'Haryana' },
  'faridabad': { city: 'Faridabad', state: 'Haryana' },

  // Uttar Pradesh
  'lucknow': { city: 'Lucknow', state: 'Uttar Pradesh' },
  'kanpur': { city: 'Kanpur', state: 'Uttar Pradesh' },
  'varanasi': { city: 'Varanasi', state: 'Uttar Pradesh' },
  'banaras': { city: 'Varanasi', state: 'Uttar Pradesh' },
  'kashi': { city: 'Varanasi', state: 'Uttar Pradesh' },
  'prayagraj': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  'allahabad': { city: 'Prayagraj', state: 'Uttar Pradesh' },
  'agra': { city: 'Agra', state: 'Uttar Pradesh' },
  'meerut': { city: 'Meerut', state: 'Uttar Pradesh' },
  'aligarh': { city: 'Aligarh', state: 'Uttar Pradesh' },
  'bareilly': { city: 'Bareilly', state: 'Uttar Pradesh' },
  'gorakhpur': { city: 'Gorakhpur', state: 'Uttar Pradesh' },
  'jhansi': { city: 'Jhansi', state: 'Uttar Pradesh' },
  'mathura': { city: 'Mathura', state: 'Uttar Pradesh' },
  'moradabad': { city: 'Moradabad', state: 'Uttar Pradesh' },
  'ayodhya': { city: 'Ayodhya', state: 'Uttar Pradesh' },

  // Tamil Nadu
  'chennai': { city: 'Chennai', state: 'Tamil Nadu' },
  'madras': { city: 'Chennai', state: 'Tamil Nadu' },
  'coimbatore': { city: 'Coimbatore', state: 'Tamil Nadu' },
  'madurai': { city: 'Madurai', state: 'Tamil Nadu' },
  'tiruchirappalli': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  'trichy': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
  'salem': { city: 'Salem', state: 'Tamil Nadu' },
  'vellore': { city: 'Vellore', state: 'Tamil Nadu' },
  'thanjavur': { city: 'Thanjavur', state: 'Tamil Nadu' },
  'tirunelveli': { city: 'Tirunelveli', state: 'Tamil Nadu' },
  'erode': { city: 'Erode', state: 'Tamil Nadu' },

  // Telangana
  'hyderabad': { city: 'Hyderabad', state: 'Telangana' },
  'secunderabad': { city: 'Secunderabad', state: 'Telangana' },
  'warangal': { city: 'Warangal', state: 'Telangana' },
  'nizamabad': { city: 'Nizamabad', state: 'Telangana' },
  'karimnagar': { city: 'Karimnagar', state: 'Telangana' },

  // Andhra Pradesh
  'visakhapatnam': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  'vizag': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  'vijayawada': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  'guntur': { city: 'Guntur', state: 'Andhra Pradesh' },
  'tirupati': { city: 'Tirupati', state: 'Andhra Pradesh' },
  'kurnool': { city: 'Kurnool', state: 'Andhra Pradesh' },
  'nellore': { city: 'Nellore', state: 'Andhra Pradesh' },
  'rajahmundry': { city: 'Rajahmundry', state: 'Andhra Pradesh' },

  // West Bengal
  'kolkata': { city: 'Kolkata', state: 'West Bengal' },
  'calcutta': { city: 'Kolkata', state: 'West Bengal' },
  'howrah': { city: 'Howrah', state: 'West Bengal' },
  'durgapur': { city: 'Durgapur', state: 'West Bengal' },
  'siliguri': { city: 'Siliguri', state: 'West Bengal' },
  'asansol': { city: 'Asansol', state: 'West Bengal' },
  'kharagpur': { city: 'Kharagpur', state: 'West Bengal' },
  'shantiniketan': { city: 'Shantiniketan', state: 'West Bengal' },

  // Rajasthan
  'jaipur': { city: 'Jaipur', state: 'Rajasthan' },
  'jodhpur': { city: 'Jodhpur', state: 'Rajasthan' },
  'kota': { city: 'Kota', state: 'Rajasthan' },
  'udaipur': { city: 'Udaipur', state: 'Rajasthan' },
  'bikaner': { city: 'Bikaner', state: 'Rajasthan' },
  'ajmer': { city: 'Ajmer', state: 'Rajasthan' },
  'pilani': { city: 'Pilani', state: 'Rajasthan' },
  'alwar': { city: 'Alwar', state: 'Rajasthan' },
  'bhilwara': { city: 'Bhilwara', state: 'Rajasthan' },

  // Gujarat
  'ahmedabad': { city: 'Ahmedabad', state: 'Gujarat' },
  'surat': { city: 'Surat', state: 'Gujarat' },
  'vadodara': { city: 'Vadodara', state: 'Gujarat' },
  'baroda': { city: 'Vadodara', state: 'Gujarat' },
  'rajkot': { city: 'Rajkot', state: 'Gujarat' },
  'gandhinagar': { city: 'Gandhinagar', state: 'Gujarat' },
  'anand': { city: 'Anand', state: 'Gujarat' },
  'bhavnagar': { city: 'Bhavnagar', state: 'Gujarat' },
  'jamnagar': { city: 'Jamnagar', state: 'Gujarat' },

  // Bihar
  'patna': { city: 'Patna', state: 'Bihar' },
  'gaya': { city: 'Gaya', state: 'Bihar' },
  'muzaffarpur': { city: 'Muzaffarpur', state: 'Bihar' },
  'bhagalpur': { city: 'Bhagalpur', state: 'Bihar' },
  'darbhanga': { city: 'Darbhanga', state: 'Bihar' },
  'purnia': { city: 'Purnia', state: 'Bihar' },

  // Madhya Pradesh
  'bhopal': { city: 'Bhopal', state: 'Madhya Pradesh' },
  'indore': { city: 'Indore', state: 'Madhya Pradesh' },
  'jabalpur': { city: 'Jabalpur', state: 'Madhya Pradesh' },
  'gwalior': { city: 'Gwalior', state: 'Madhya Pradesh' },
  'ujjain': { city: 'Ujjain', state: 'Madhya Pradesh' },
  'sagar': { city: 'Sagar', state: 'Madhya Pradesh' },
  'rewa': { city: 'Rewa', state: 'Madhya Pradesh' },

  // Punjab & Chandigarh
  'chandigarh': { city: 'Chandigarh', state: 'Chandigarh' },
  'mohali': { city: 'Mohali', state: 'Punjab' },
  'ludhiana': { city: 'Ludhiana', state: 'Punjab' },
  'amritsar': { city: 'Amritsar', state: 'Punjab' },
  'jalandhar': { city: 'Jalandhar', state: 'Punjab' },
  'patiala': { city: 'Patiala', state: 'Punjab' },
  'bathinda': { city: 'Bathinda', state: 'Punjab' },

  // Haryana
  'rohtak': { city: 'Rohtak', state: 'Haryana' },
  'panipat': { city: 'Panipat', state: 'Haryana' },
  'kurukshetra': { city: 'Kurukshetra', state: 'Haryana' },
  'sonipat': { city: 'Sonipat', state: 'Haryana' },
  'hisar': { city: 'Hisar', state: 'Haryana' },
  'ambala': { city: 'Ambala', state: 'Haryana' },
  'karnal': { city: 'Karnal', state: 'Haryana' },

  // Kerala
  'thiruvananthapuram': { city: 'Thiruvananthapuram', state: 'Kerala' },
  'trivandrum': { city: 'Thiruvananthapuram', state: 'Kerala' },
  'kochi': { city: 'Kochi', state: 'Kerala' },
  'cochin': { city: 'Kochi', state: 'Kerala' },
  'kozhikode': { city: 'Kozhikode', state: 'Kerala' },
  'calicut': { city: 'Kozhikode', state: 'Kerala' },
  'thrissur': { city: 'Thrissur', state: 'Kerala' },
  'kottayam': { city: 'Kottayam', state: 'Kerala' },
  'kollam': { city: 'Kollam', state: 'Kerala' },

  // Odisha
  'bhubaneswar': { city: 'Bhubaneswar', state: 'Odisha' },
  'cuttack': { city: 'Cuttack', state: 'Odisha' },
  'rourkela': { city: 'Rourkela', state: 'Odisha' },
  'sambalpur': { city: 'Sambalpur', state: 'Odisha' },
  'berhampur': { city: 'Berhampur', state: 'Odisha' },

  // Jharkhand
  'ranchi': { city: 'Ranchi', state: 'Jharkhand' },
  'jamshedpur': { city: 'Jamshedpur', state: 'Jharkhand' },
  'dhanbad': { city: 'Dhanbad', state: 'Jharkhand' },
  'bokaro': { city: 'Bokaro', state: 'Jharkhand' },
  'hazaribagh': { city: 'Hazaribagh', state: 'Jharkhand' },

  // Uttarakhand
  'dehradun': { city: 'Dehradun', state: 'Uttarakhand' },
  'haridwar': { city: 'Haridwar', state: 'Uttarakhand' },
  'roorkee': { city: 'Roorkee', state: 'Uttarakhand' },
  'nainital': { city: 'Nainital', state: 'Uttarakhand' },
  'pantnagar': { city: 'Pantnagar', state: 'Uttarakhand' },
  'rishikesh': { city: 'Rishikesh', state: 'Uttarakhand' },

  // Himachal Pradesh
  'shimla': { city: 'Shimla', state: 'Himachal Pradesh' },
  'dharamshala': { city: 'Dharamshala', state: 'Himachal Pradesh' },
  'solan': { city: 'Solan', state: 'Himachal Pradesh' },
  'mandi': { city: 'Mandi', state: 'Himachal Pradesh' },
  'hamirpur': { city: 'Hamirpur', state: 'Himachal Pradesh' },

  // Assam & North East
  'guwahati': { city: 'Guwahati', state: 'Assam' },
  'dibrugarh': { city: 'Dibrugarh', state: 'Assam' },
  'silchar': { city: 'Silchar', state: 'Assam' },
  'tezpur': { city: 'Tezpur', state: 'Assam' },
  'jorhat': { city: 'Jorhat', state: 'Assam' },
  'shillong': { city: 'Shillong', state: 'Meghalaya' },
  'agartala': { city: 'Agartala', state: 'Tripura' },
  'imphal': { city: 'Imphal', state: 'Manipur' },
  'aizawl': { city: 'Aizawl', state: 'Mizoram' },
  'kohima': { city: 'Kohima', state: 'Nagaland' },
  'dimapur': { city: 'Dimapur', state: 'Nagaland' },
  'gangtok': { city: 'Gangtok', state: 'Sikkim' },
  'itanagar': { city: 'Itanagar', state: 'Arunachal Pradesh' },

  // Jammu & Kashmir
  'srinagar': { city: 'Srinagar', state: 'Jammu & Kashmir' },
  'jammu': { city: 'Jammu', state: 'Jammu & Kashmir' },

  // Goa & Puducherry
  'panaji': { city: 'Panaji', state: 'Goa' },
  'goa': { city: 'Goa', state: 'Goa' },
  'puducherry': { city: 'Puducherry', state: 'Puducherry' },
  'pondicherry': { city: 'Puducherry', state: 'Puducherry' }
};

/**
 * Intelligent helper to resolve city and state for any institution
 */
const resolveLocationDetails = (name = '', description = '', city = '', state = '', country = 'India') => {
  let finalCity = (city || '').trim();
  let finalState = (state || '').trim();
  let finalCountry = (country || 'India').trim();

  const combinedText = `${name} ${description} ${finalCity} ${finalState}`.toLowerCase();

  // 1. Direct State Matches
  for (const st of ALL_INDIAN_STATES) {
    if (combinedText.includes(st.toLowerCase())) {
      finalState = st;
      finalCountry = 'India';
      break;
    }
  }

  // 2. City Dictionary Lookup
  for (const [keyCity, mapping] of Object.entries(INDIAN_CITY_STATE_MAP)) {
    const regex = new RegExp(`\\b${keyCity}\\b`, 'i');
    if (regex.test(combinedText)) {
      if (!finalCity || finalCity.toLowerCase() === finalState.toLowerCase()) {
        finalCity = mapping.city;
      }
      if (!finalState) {
        finalState = mapping.state;
      }
      finalCountry = 'India';
      break;
    }
  }

  // 3. Known special institution / group defaults
  if (!finalState && /rungta/i.test(name)) {
    if (!finalCity) finalCity = 'Bhilai';
    finalState = 'Chhattisgarh';
    finalCountry = 'India';
  }

  return {
    city: finalCity,
    state: finalState,
    country: finalCountry
  };
};

/**
 * Query Wikidata API for obscure colleges & institutions worldwide
 */
const fetchWikidataInstitutions = async (queryText) => {
  if (!queryText || queryText.length < 2) return [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(queryText)}&language=en&format=json&limit=10&type=item`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SahiJob-Master-Education/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const json = await res.json();
    const searchResults = Array.isArray(json.search) ? json.search : [];

    const validInstitutions = searchResults.filter(item => {
      const desc = (item.description || '').toLowerCase();
      const label = (item.label || '').toLowerCase();
      return (
        desc.includes('college') || desc.includes('university') || desc.includes('school') ||
        desc.includes('institute') || desc.includes('institution') || desc.includes('educational') ||
        desc.includes('academy') || label.includes('college') || label.includes('university') ||
        label.includes('institute') || label.includes('school')
      );
    }).map(item => {
      const desc = item.description || '';
      const loc = resolveLocationDetails(item.label, desc, '', '', 'India');

      const type = inferInstitutionType(item.label, '');
      const meta = generateAcronymsAndAliases(item.label, loc.city, loc.state);

      return {
        id: `WIKI-${item.id}`,
        name: item.label,
        normalizedName: normalizeText(item.label),
        aliases: meta.aliases,
        normalizedAliases: meta.normalizedAliases,
        acronyms: meta.acronyms,
        normalizedAcronyms: meta.normalizedAcronyms,
        type: type,
        sector: type === 'school' ? 'school' : 'higher_education',
        country: loc.country,
        countryCode: loc.country === 'India' ? 'IN' : '',
        state: loc.state,
        city: loc.city,
        website: '',
        source: 'WIKIDATA',
        sourceId: item.id
      };
    });

    return validInstitutions;
  } catch (e) {
    clearTimeout(timeoutId);
    return [];
  }
};

/**
 * Query IDSCU API as fallback
 */
const fetchIdscuInstitutions = async (queryText, country) => {
  if (!queryText || queryText.length < 2) return [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const params = new URLSearchParams({ q: queryText });
    if (country) params.set('country', country);

    const baseUrl = process.env.IDSCU_BASE_URL || 'https://idscu.org/api/v1';
    const res = await fetch(`${baseUrl}/search?${params.toString()}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SahiJob-Master-Education/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : [];

    return list.map(item => {
      const name = item.name_en || item.name_official;
      const loc = resolveLocationDetails(name, '', item.city, item.region, item.country || 'India');
      const type = inferInstitutionType(name, item.sector);
      const meta = generateAcronymsAndAliases(name, loc.city, loc.state);

      return {
        id: `IDSCU-${item.id}`,
        name: name,
        normalizedName: normalizeText(name),
        aliases: meta.aliases,
        normalizedAliases: meta.normalizedAliases,
        acronyms: meta.acronyms,
        normalizedAcronyms: meta.normalizedAcronyms,
        type: type,
        sector: item.sector === 'K12' ? 'school' : 'higher_education',
        country: loc.country,
        countryCode: item.country_code || (loc.country === 'India' ? 'IN' : ''),
        state: loc.state,
        city: loc.city,
        website: item.official_website || '',
        source: 'IDSCU',
        sourceId: item.id
      };
    });
  } catch (e) {
    clearTimeout(timeoutId);
    return [];
  }
};

/**
 * Query Hipo Universities API as fallback
 */
const fetchHipoInstitutions = async (queryText) => {
  if (!queryText || queryText.length < 2) return [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(queryText)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];

    return list.slice(0, 15).map(item => {
      const loc = resolveLocationDetails(item.name, '', item['state-province'], item['state-province'], item.country || '');
      const meta = generateAcronymsAndAliases(item.name, loc.city, loc.state);
      return {
        id: `HIPO-${item.alpha_two_code}-${normalizeText(item.name).replace(/\s+/g, '-')}`,
        name: item.name,
        normalizedName: normalizeText(item.name),
        aliases: meta.aliases,
        normalizedAliases: meta.normalizedAliases,
        acronyms: meta.acronyms,
        normalizedAcronyms: meta.normalizedAcronyms,
        type: 'university',
        sector: 'higher_education',
        country: loc.country,
        countryCode: item.alpha_two_code || '',
        state: loc.state,
        city: loc.city,
        website: item.web_pages?.[0] || '',
        source: 'HIPO',
        sourceId: item.name
      };
    });
  } catch (e) {
    clearTimeout(timeoutId);
    return [];
  }
};

/**
 * Main Database-First Search Service with Tokenization, Acronym Matching & Location Awareness
 */
const searchMasterInstitutions = async (params = {}) => {
  const { q = '', country = '', state = '', city = '', type = '', limit = 20, cursor = 0 } = params;
  const rawQ = (q || '').trim();
  const normalizedQ = normalizeText(rawQ);

  const cacheKey = `search:${normalizedQ}:${country}:${state}:${city}:${type}:${limit}:${cursor}`;
  const cached = queryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const queryTokens = normalizedQ.split(/\s+/).filter(Boolean);
  const numLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skipCount = Math.max(parseInt(cursor, 10) || 0, 0);

  let candidateQuery = {};

  if (queryTokens.length > 0) {
    const escapedQuery = normalizedQ.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    if (queryTokens.length === 1) {
      const token = queryTokens[0];
      const escapedToken = token.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

      candidateQuery.$or = [
        { normalizedAcronyms: token },
        { normalizedAcronyms: { $regex: `^${escapedToken}`, $options: 'i' } },
        { acronyms: { $regex: `^${escapedToken}`, $options: 'i' } },
        { normalizedAliases: { $regex: escapedToken, $options: 'i' } },
        { normalizedName: { $regex: escapedToken, $options: 'i' } },
        { name: { $regex: escapedToken, $options: 'i' } }
      ];
    } else {
      // Multi-token query: Every token must match at least one field
      // (Name, Aliases, Acronyms, City, State, District, Country)
      const tokenConditions = queryTokens.map(t => {
        const esc = t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        return {
          $or: [
            { normalizedName: { $regex: esc, $options: 'i' } },
            { normalizedAliases: { $regex: esc, $options: 'i' } },
            { normalizedAcronyms: t },
            { acronyms: { $regex: `^${esc}$`, $options: 'i' } },
            { city: { $regex: esc, $options: 'i' } },
            { state: { $regex: esc, $options: 'i' } },
            { district: { $regex: esc, $options: 'i' } },
            { country: { $regex: esc, $options: 'i' } },
            { affiliatedUniversity: { $regex: esc, $options: 'i' } }
          ]
        };
      });

      candidateQuery.$or = [
        { $and: tokenConditions },
        { normalizedAliases: { $regex: escapedQuery, $options: 'i' } },
        { normalizedName: { $regex: escapedQuery, $options: 'i' } }
      ];
    }
  }

  if (country) {
    candidateQuery.country = { $regex: `^${country.trim()}$`, $options: 'i' };
  }
  if (state) {
    candidateQuery.state = { $regex: `^${state.trim()}$`, $options: 'i' };
  }
  if (city) {
    candidateQuery.city = { $regex: `^${city.trim()}$`, $options: 'i' };
  }
  if (type) {
    candidateQuery.type = type.toLowerCase();
  }

  // STEP 1: Search Local Database
  let dbResults = [];
  try {
    dbResults = await Institution.find(candidateQuery)
      .limit(100)
      .lean();
  } catch (err) {
    console.error('MongoDB institution search error:', err.message);
  }

  // STEP 2: Multi-source Live Fallback if local results are insufficient (< 5)
  if (dbResults.length < 5 && normalizedQ.length >= 2) {
    try {
      const [wikiItems, idscuItems, hipoItems] = await Promise.all([
        fetchWikidataInstitutions(rawQ),
        fetchIdscuInstitutions(rawQ, country),
        fetchHipoInstitutions(rawQ)
      ]);

      const externalCombined = [...wikiItems, ...idscuItems, ...hipoItems];

      // Deduplicate against local results
      const existingNames = new Set(dbResults.map(r => r.normalizedName));
      const newToInsert = [];

      for (const item of externalCombined) {
        if (!existingNames.has(item.normalizedName)) {
          existingNames.add(item.normalizedName);
          dbResults.push(item);
          newToInsert.push(item);
        }
      }

      // Persist newly discovered institutions to MongoDB asynchronously
      if (newToInsert.length > 0) {
        Institution.bulkWrite(
          newToInsert.map(inst => ({
            updateOne: {
              filter: { normalizedName: inst.normalizedName, country: inst.country },
              update: { $setOnInsert: inst },
              upsert: true
            }
          }))
        ).catch(e => console.warn('Bulk write institution cache error:', e.message));
      }
    } catch (fallbackErr) {
      console.warn('External education fallback error:', fallbackErr.message);
    }
  }

  // STEP 3: Score, Rank and Sort all candidates
  const scoredList = dbResults.map(inst => ({
    item: inst,
    score: scoreCandidate(inst, rawQ, normalizedQ, queryTokens)
  }));

  scoredList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.name.localeCompare(b.item.name);
  });

  // Filter out completely unrelated candidates (score <= 0)
  const filteredCandidates = scoredList.filter(s => s.score > 0).map(s => s.item);

  // Pagination & Response Sanitization
  const paginated = filteredCandidates.slice(skipCount, skipCount + numLimit);
  const seenMap = new Map();
  const formattedResults = [];

  for (const item of paginated) {
    const loc = resolveLocationDetails(item.name, item.description || '', item.city || item.district || '', item.state || '', item.country || 'India');
    const key = `${normalizeText(item.name)}|${(loc.country || '').toLowerCase()}|${(loc.city || loc.state || '').toLowerCase()}`;
    if (!seenMap.has(key)) {
      seenMap.set(key, true);
      formattedResults.push({
        id: item.id || item._id?.toString() || item.sourceId || '',
        name: item.name,
        type: item.type || 'college',
        sector: item.sector || 'higher_education',
        city: loc.city || item.city || item.district || '',
        state: loc.state || item.state || '',
        country: loc.country || item.country || 'India',
        countryCode: loc.country === 'India' ? 'IN' : (item.countryCode || ''),
        affiliatedUniversity: item.affiliatedUniversity || '',
        website: item.website || '',
        source: item.source || 'AISHE'
      });
    }
  }

  const nextCursor = (skipCount + formattedResults.length < filteredCandidates.length) ? skipCount + formattedResults.length : null;

  const result = {
    success: true,
    data: formattedResults,
    nextCursor: nextCursor,
    pagination: {
      limit: numLimit,
      currentCursor: skipCount,
      nextCursor: nextCursor,
      count: formattedResults.length
    }
  };

  queryCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
};

/**
 * Get institution by ID
 */
const getInstitutionById = async (id) => {
  if (!id) return null;
  const item = await Institution.findOne({
    $or: [{ id: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
  }).lean();
  return item;
};

module.exports = {
  normalizeText,
  inferInstitutionType,
  generateAcronymsAndAliases,
  scoreCandidate,
  searchMasterInstitutions,
  getInstitutionById
};
