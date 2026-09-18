const queryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// Top common occupational roles for instantaneous zero-latency suggestions
const COMMON_OCCUPATIONS = [
  { title: "Software Engineer", uri: "http://data.europa.eu/esco/occupation/528f90ed-e250-48bd-aacc-ffb7b1de5654", code: "2512" },
  { title: "Software Developer", uri: "http://data.europa.eu/esco/occupation/bd272aee-adc9-4a06-a15c-a73b4b4a46a7", code: "2514" },
  { title: "Frontend Developer", uri: "http://data.europa.eu/esco/occupation/bd272aee-adc9-4a06-a15c-a73b4b4a46a7", code: "2514" },
  { title: "Backend Developer", uri: "http://data.europa.eu/esco/occupation/bd272aee-adc9-4a06-a15c-a73b4b4a46a7", code: "2514" },
  { title: "Full Stack Developer", uri: "http://data.europa.eu/esco/occupation/bd272aee-adc9-4a06-a15c-a73b4b4a46a7", code: "2514" },
  { title: "Data Scientist", uri: "http://data.europa.eu/esco/occupation/85d68d14-b153-4ff3-9aa4-47f6ff6dc412", code: "2511" },
  { title: "Data Analyst", uri: "http://data.europa.eu/esco/occupation/572d427d-faec-460d-a3df-61264c1ecdf6", code: "2511" },
  { title: "Product Manager", uri: "http://data.europa.eu/esco/occupation/a618d7aa-d579-4bc2-8418-47700201ae84", code: "1219" },
  { title: "Project Manager", uri: "http://data.europa.eu/esco/occupation/a618d7aa-d579-4bc2-8418-47700201ae84", code: "1219" },
  { title: "UI/UX Designer", uri: "http://data.europa.eu/esco/occupation/3cbdf917-fa24-4f0e-be08-59cce32d201e", code: "2166" },
  { title: "Human Resources Manager", uri: "http://data.europa.eu/esco/occupation/5b47a195-2aa0-449e-ba02-463212853245", code: "1212" },
  { title: "Accountant", uri: "http://data.europa.eu/esco/occupation/00b46be6-4444-4ec5-b0aa-fb01bc5bdf8e", code: "2411" },
  { title: "Financial Analyst", uri: "http://data.europa.eu/esco/occupation/69d31ecf-1fc4-4e2b-be2b-2d7c0410ff24", code: "2413" },
  { title: "Marketing Specialist", uri: "http://data.europa.eu/esco/occupation/9d3752e2-eb82-4115-b778-d75e03248381", code: "2431" },
  { title: "Sales Executive", uri: "http://data.europa.eu/esco/occupation/06db31b3-469b-4e08-963a-bb2a4ce1f67f", code: "3322" },
  { title: "Business Analyst", uri: "http://data.europa.eu/esco/occupation/572d427d-faec-460d-a3df-61264c1ecdf6", code: "2421" },
  { title: "DevOps Engineer", uri: "http://data.europa.eu/esco/occupation/bd272aee-adc9-4a06-a15c-a73b4b4a46a7", code: "2514" },
  { title: "Mechanical Engineer", uri: "http://data.europa.eu/esco/occupation/85ca95e7-a9a3-4a11-bdfc-da83c6179379", code: "2144" },
  { title: "Civil Engineer", uri: "http://data.europa.eu/esco/occupation/e5d8db76-58cb-4654-be8d-71b31a31d9df", code: "2142" },
  { title: "Electrical Engineer", uri: "http://data.europa.eu/esco/occupation/76cebb1a-fec0-4a81-b6a4-6bc1df6be342", code: "2151" }
];

/**
 * Search ESCO occupations by query string
 * Official ESCO API: https://ec.europa.eu/esco/api/search
 */
const searchEscoOccupations = async (query = '', limit = 20) => {
  const cleanQ = (query || '').trim();
  const numLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  if (!cleanQ) {
    return {
      success: true,
      data: COMMON_OCCUPATIONS.slice(0, numLimit)
    };
  }

  const cacheKey = `esco:${cleanQ.toLowerCase()}:${numLimit}`;
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `https://ec.europa.eu/esco/api/search?text=${encodeURIComponent(cleanQ)}&language=en&type=occupation&limit=${numLimit}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SahiJob-ESCO-Occupation-Search/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`ESCO API responded with status ${res.status}`);
    }

    const json = await res.json();
    const results = json._embedded?.results || [];

    const formatted = results.map(item => {
      // Capitalize first letter of each word for clean UI presentation
      const rawTitle = item.preferredLabel?.en || item.title || item.searchHit || '';
      const displayTitle = rawTitle.replace(/\b\w/g, char => char.toUpperCase());

      return {
        title: displayTitle,
        uri: item.uri || item._links?.self?.uri || '',
        code: item.code || '',
        searchHit: item.searchHit || ''
      };
    });

    const output = {
      success: true,
      data: formatted
    };

    queryCache.set(cacheKey, { timestamp: Date.now(), data: output });
    return output;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('ESCO search live query fallback:', err.message);

    // Fallback: search in local common occupations
    const lowerQ = cleanQ.toLowerCase();
    const localFiltered = COMMON_OCCUPATIONS.filter(o => 
      o.title.toLowerCase().includes(lowerQ)
    );

    return {
      success: true,
      data: localFiltered.length > 0 ? localFiltered : [{ title: cleanQ, uri: '', code: '' }]
    };
  }
};

module.exports = {
  searchEscoOccupations,
  COMMON_OCCUPATIONS
};
