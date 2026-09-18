const queryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Curated top global and Indian companies for instantaneous search
const TOP_COMPANIES = [
  { name: "Google", jurisdiction: "us", country: "United States", industry: "Technology", domain: "google.com" },
  { name: "Microsoft", jurisdiction: "us", country: "United States", industry: "Technology", domain: "microsoft.com" },
  { name: "Apple", jurisdiction: "us", country: "United States", industry: "Consumer Electronics", domain: "apple.com" },
  { name: "Amazon", jurisdiction: "us", country: "United States", industry: "E-commerce / Cloud", domain: "amazon.com" },
  { name: "Meta (Facebook)", jurisdiction: "us", country: "United States", industry: "Technology", domain: "meta.com" },
  { name: "Tata Consultancy Services (TCS)", jurisdiction: "in", country: "India", industry: "IT Services", domain: "tcs.com" },
  { name: "Infosys", jurisdiction: "in", country: "India", industry: "IT Services", domain: "infosys.com" },
  { name: "Wipro", jurisdiction: "in", country: "India", industry: "IT Services", domain: "wipro.com" },
  { name: "HCLTech", jurisdiction: "in", country: "India", industry: "IT Services", domain: "hcltech.com" },
  { name: "Reliance Industries", jurisdiction: "in", country: "India", industry: "Conglomerate", domain: "ril.com" },
  { name: "Accenture", jurisdiction: "ie", country: "Ireland", industry: "Consulting / IT", domain: "accenture.com" },
  { name: "Deloitte", jurisdiction: "us", country: "United States", industry: "Consulting", domain: "deloitte.com" },
  { name: "IBM", jurisdiction: "us", country: "United States", industry: "Technology", domain: "ibm.com" },
  { name: "Oracle", jurisdiction: "us", country: "United States", industry: "Software", domain: "oracle.com" },
  { name: "Cisco Systems", jurisdiction: "us", country: "United States", industry: "Networking", domain: "cisco.com" },
  { name: "Intel", jurisdiction: "us", country: "United States", industry: "Semiconductors", domain: "intel.com" },
  { name: "Adobe", jurisdiction: "us", country: "United States", industry: "Software", domain: "adobe.com" },
  { name: "Salesforce", jurisdiction: "us", country: "United States", industry: "Cloud Software", domain: "salesforce.com" },
  { name: "Capgemini", jurisdiction: "fr", country: "France", industry: "IT Consulting", domain: "capgemini.com" },
  { name: "Cognizant", jurisdiction: "us", country: "United States", industry: "IT Services", domain: "cognizant.com" },
  { name: "Larsen & Toubro (L&T)", jurisdiction: "in", country: "India", industry: "Engineering", domain: "larsentoubro.com" },
  { name: "Mahindra & Mahindra", jurisdiction: "in", country: "India", industry: "Automotive", domain: "mahindra.com" },
  { name: "Tata Motors", jurisdiction: "in", country: "India", industry: "Automotive", domain: "tatamotors.com" },
  { name: "State Bank of India (SBI)", jurisdiction: "in", country: "India", industry: "Banking", domain: "sbi.co.in" },
  { name: "HDFC Bank", jurisdiction: "in", country: "India", industry: "Banking", domain: "hdfcbank.com" },
  { name: "ICICI Bank", jurisdiction: "in", country: "India", industry: "Banking", domain: "icicibank.com" }
];

/**
 * Search OpenCorporates API
 */
const fetchOpenCorporates = async (query = '') => {
  const token = process.env.OPENCORPORATES_API_KEY || process.env.OPENCORPORATES_API_TOKEN;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = token 
      ? `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(query)}&api_token=${token}&per_page=15`
      : `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(query)}&per_page=15`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'SahiJob-Company-Search/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const json = await res.json();
    const companies = json.results?.companies || [];

    return companies.map(c => ({
      name: c.company?.name || '',
      jurisdiction: c.company?.jurisdiction_code || '',
      companyNumber: c.company?.company_number || '',
      opencorporatesUrl: c.company?.opencorporates_url || `https://opencorporates.com/companies/${c.company?.jurisdiction_code}/${c.company?.company_number}`,
      source: 'OPENCORPORATES'
    })).filter(c => c.name);
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
};

/**
 * Search Clearbit Company Autocomplete API
 */
const fetchClearbit = async (query = '') => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const list = await res.json();
    if (!Array.isArray(list)) return [];

    return list.map(item => ({
      name: item.name,
      domain: item.domain || '',
      logo: item.logo || '',
      source: 'CLEARBIT'
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
};

/**
 * Search Wikidata for Global & Indian Companies
 */
const fetchWikidataCompanies = async (query = '') => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=10&type=item`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SahiJob-Company-Search/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json.search) ? json.search : [];

    return list.filter(item => {
      const desc = (item.description || '').toLowerCase();
      return (
        desc.includes('company') || desc.includes('corporation') || desc.includes('enterprise') ||
        desc.includes('business') || desc.includes('firm') || desc.includes('conglomerate') ||
        desc.includes('technology company') || desc.includes('bank') || desc.includes('manufacturer')
      );
    }).map(item => ({
      name: item.label,
      description: item.description || '',
      source: 'WIKIDATA'
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
};

/**
 * Main Company Search Service
 */
const searchMasterCompanies = async (query = '', limit = 20) => {
  const cleanQ = (query || '').trim();
  const numLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  if (!cleanQ) {
    return {
      success: true,
      data: TOP_COMPANIES.slice(0, numLimit)
    };
  }

  const cacheKey = `company:${cleanQ.toLowerCase()}:${numLimit}`;
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Filter local fast list
  const lowerQ = cleanQ.toLowerCase();
  const localMatches = TOP_COMPANIES.filter(c => 
    c.name.toLowerCase().includes(lowerQ)
  );

  // Parallel fetch from external APIs
  const [openCorpList, clearbitList, wikiList] = await Promise.all([
    fetchOpenCorporates(cleanQ),
    fetchClearbit(cleanQ),
    fetchWikidataCompanies(cleanQ)
  ]);

  const combined = [...localMatches, ...openCorpList, ...clearbitList, ...wikiList];

  // Deduplicate by clean company name
  const seen = new Set();
  const formatted = [];

  for (const item of combined) {
    const key = (item.name || '').toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      formatted.push({
        name: item.name,
        jurisdiction: item.jurisdiction || '',
        domain: item.domain || '',
        logo: item.logo || '',
        opencorporatesUrl: item.opencorporatesUrl || '',
        description: item.description || item.industry || ''
      });
      if (formatted.length >= numLimit) break;
    }
  }

  // If no results from APIs, return the query as a valid option
  if (formatted.length === 0) {
    formatted.push({ name: cleanQ, jurisdiction: '', domain: '', logo: '' });
  }

  const result = {
    success: true,
    data: formatted
  };

  queryCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
};

module.exports = {
  searchMasterCompanies,
  TOP_COMPANIES
};
