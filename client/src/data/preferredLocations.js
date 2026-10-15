// Non-India locations present in our location directory or commonly referenced
export const NON_INDIA_LOCATIONS = [
  'abu dhabi', 'africa', 'bahrain', 'bangladesh', 'china', 'doha', 'dubai',
  'europe', 'hong kong', 'indonesia', 'japan', 'kuwait', 'london', 'malaysia',
  'mauritius', 'middle east', 'nepal', 'new zealand', 'oman', 'philippines',
  'qatar', 'russia', 'saudi arabia', 'singapore', 'south africa', 'sri lanka',
  'thailand', 'uae', 'uk', 'united kingdom', 'usa', 'united states', 'zambia', 'zimbabwe',
  'canada', 'germany', 'australia', 'france', 'netherlands'
];

export const isIndiaAnywhereQuery = (query = '') => {
  if (!query) return false;
  const q = String(query).trim().toLowerCase();
  return (
    q === 'anywhere in india' ||
    q === 'anywhere in india/multiple locations' ||
    q === 'india' ||
    q === 'pan india' ||
    q === 'pan-india' ||
    q === 'all india' ||
    q === 'all-india' ||
    q === 'in india' ||
    q === 'anywhere india' ||
    q === 'anywhere' ||
    q.includes('anywhere in india') ||
    q.includes('all india') ||
    q.includes('pan india') ||
    q.includes('across india')
  );
};

export const isJobInIndia = (jobLocation = '', workLocation = '') => {
  const loc = String(jobLocation || '').toLowerCase().trim();
  const workLoc = String(workLocation || '').toLowerCase().trim();
  
  // If location is blank or remote or explicitly mentions India
  if (!loc) return true;
  if (loc.includes('india') || loc.includes('pan india') || loc.includes('remote') || workLoc.includes('remote')) {
    return true;
  }

  // If location explicitly includes an international country/city without mentioning India
  const fullLocText = `${loc} ${workLoc}`;
  const isInternational = NON_INDIA_LOCATIONS.some((intl) => {
    // Word boundary check to avoid false positives (e.g. "uk" matching "lucknow")
    const regex = new RegExp(`(^|[^a-zA-Z])${intl}([^a-zA-Z]|$)`, 'i');
    return regex.test(fullLocText);
  });
  if (isInternational) {
    return false;
  }

  // All other domestic locations in the Indian job portal default to India
  return true;
};

export const isEmployeeInIndia = (empOrLoc = '', prefLoc = '') => {
  let loc = '';
  let pref = '';

  if (typeof empOrLoc === 'object' && empOrLoc !== null) {
    loc = String(empOrLoc.location || '').toLowerCase().trim();
    pref = String(empOrLoc.preferredLocation || '').toLowerCase().trim();
  } else {
    loc = String(empOrLoc || '').toLowerCase().trim();
    pref = String(prefLoc || '').toLowerCase().trim();
  }

  // If preferred location has India / anywhere in india
  if (isIndiaAnywhereQuery(pref) || pref.includes('anywhere in india') || pref.includes('india')) {
    return true;
  }

  // If location explicitly mentions India, Pan India, or Remote
  if (loc.includes('india') || loc.includes('pan india') || loc.includes('remote')) {
    return true;
  }

  // If location explicitly includes an international country/city without mentioning India
  const isInternational = NON_INDIA_LOCATIONS.some((intl) => loc.includes(intl));
  if (isInternational) {
    if (pref.includes('india') || isIndiaAnywhereQuery(pref)) {
      return true;
    }
    return false;
  }

  // All other domestic locations (e.g. Janjgir, Allahabad, Bangalore, Mumbai, etc., or empty) default to India
  return true;
};

export const isEmployeeCurrentLocationMatch = (emp, searchLocation = '') => {
  if (!searchLocation || searchLocation === 'All' || !searchLocation.trim()) return true;

  const empLoc = String(emp?.location || '').toLowerCase().trim();

  // If employer selects "Anywhere in India" / "India" for Location filter
  if (isIndiaAnywhereQuery(searchLocation)) {
    if (!empLoc) return true; // Default domestic in Indian job platform
    if (empLoc.includes('india') || empLoc.includes('pan india') || empLoc.includes('remote')) {
      return true;
    }
    const isInternational = NON_INDIA_LOCATIONS.some((intl) => empLoc.includes(intl));
    return !isInternational;
  }

  // Specific location selected (e.g. "Abu Dhabi", "Bangalore", "Allahabad/Prayagraj")
  if (!empLoc) return false;

  const cleanSearch = searchLocation.trim().toLowerCase().split(',')[0].trim();
  const cleanSearchParts = searchLocation.toLowerCase().split(/[\/,\(\)]/).map(p => p.trim()).filter(Boolean);

  if (empLoc.includes(cleanSearch) || cleanSearch.includes(empLoc)) {
    return true;
  }

  return cleanSearchParts.some(part => part.length > 2 && empLoc.includes(part));
};

export const isEmployeePreferredLocationMatch = (emp, searchLocation = '') => {
  if (!searchLocation || searchLocation === 'All' || !searchLocation.trim()) return true;

  const empPrefLoc = String(emp?.preferredLocation || '').toLowerCase().trim();
  if (!empPrefLoc) return false;

  // If employer selects "Anywhere in India" for Preferred Location filter
  if (isIndiaAnywhereQuery(searchLocation)) {
    if (empPrefLoc.includes('anywhere in india') || empPrefLoc.includes('pan india') || empPrefLoc.includes('india')) {
      return true;
    }
    const isInternational = NON_INDIA_LOCATIONS.some((intl) => empPrefLoc.includes(intl));
    return !isInternational;
  }

  // Specific preferred location selected (e.g. "Abu Dhabi", "Bangalore")
  const cleanSearch = searchLocation.trim().toLowerCase().split(',')[0].trim();
  const cleanSearchParts = searchLocation.toLowerCase().split(/[\/,\(\)]/).map(p => p.trim()).filter(Boolean);

  if (empPrefLoc.includes(cleanSearch) || cleanSearch.includes(empPrefLoc)) {
    return true;
  }

  return cleanSearchParts.some(part => part.length > 2 && empPrefLoc.includes(part));
};

export const isLocationMatch = (jobLocation = '', searchLocation = '', workLocation = '', workplaceMode = '', job = null) => {
  if (!searchLocation || !searchLocation.trim() || searchLocation.trim().toLowerCase() === 'all') return true;

  // Handle object as first arg if passed
  let jobObj = job;
  let jobLoc = '';
  let workLoc = '';
  let wpMode = '';

  if (typeof jobLocation === 'object' && jobLocation !== null) {
    jobObj = jobLocation;
    jobLoc = String(jobObj.location || jobObj.employerId?.location || '').trim();
    workLoc = String(jobObj.details?.workLocation || '').trim();
    wpMode = String(jobObj.workplaceMode || jobObj.details?.workplaceMode || '').trim();
  } else {
    jobLoc = String(jobLocation || '').trim();
    workLoc = String(workLocation || '').trim();
    wpMode = String(workplaceMode || (jobObj ? (jobObj.workplaceMode || jobObj.details?.workplaceMode) : '') || '').trim();
  }

  // Extract detected mode & display location from badges helper
  const { displayLocation: badgeLoc, workplaceMode: detectedMode } = getJobLocationBadges(
    jobObj || { location: jobLoc, details: { workLocation: workLoc }, workplaceMode: wpMode }
  );

  const finalMode = (detectedMode || wpMode).toLowerCase();
  const fullLocText = `${jobLoc} ${workLoc} ${badgeLoc} ${finalMode} ${jobObj?.title || ''}`.toLowerCase();

  const s = searchLocation.trim().toLowerCase();

  if (isIndiaAnywhereQuery(s)) {
    return isJobInIndia(jobLoc, workLoc);
  }

  // Workplace Mode Search Queries: "remote", "hybrid", "wfh", "on-site", "onsite", "office"
  const isHybridQuery = s.includes('hybrid');
  const isRemoteQuery = s.includes('remote') || s.includes('wfh') || s.includes('work from home');
  const isOnsiteQuery = s.includes('on-site') || s.includes('onsite') || s.includes('in person') || s.includes('in-person') || s.includes('office');

  if (isHybridQuery || isRemoteQuery || isOnsiteQuery) {
    let modeMatched = false;
    if (isHybridQuery && (finalMode.includes('hybrid') || fullLocText.includes('hybrid'))) {
      modeMatched = true;
    }
    if (isRemoteQuery && (finalMode.includes('remote') || fullLocText.includes('remote') || fullLocText.includes('wfh') || fullLocText.includes('work from home'))) {
      modeMatched = true;
    }
    if (isOnsiteQuery && (finalMode.includes('on-site') || finalMode.includes('onsite') || fullLocText.includes('on-site') || fullLocText.includes('onsite') || fullLocText.includes('office'))) {
      modeMatched = true;
    }

    // Clean geo query by stripping mode keywords
    const cleanGeoQuery = s
      .replace(/\b(hybrid|remote|wfh|work from home|on-site|onsite|office|in person|in-person)\b/gi, '')
      .replace(/[\/,\-\•]/g, ' ')
      .trim();

    if (!cleanGeoQuery) {
      return modeMatched;
    }

    if (modeMatched) {
      if (fullLocText.includes(cleanGeoQuery)) return true;
      return true; // Match if workplace mode fits
    }
  }

  // Standard location matching
  const cleanSearch = s.split(',')[0].trim();

  // Direct substring matches
  if (
    fullLocText.includes(s) || 
    s.includes(jobLoc.toLowerCase()) || 
    (workLoc && s.includes(workLoc.toLowerCase())) ||
    (badgeLoc && s.includes(badgeLoc.toLowerCase())) ||
    (cleanSearch && fullLocText.includes(cleanSearch)) ||
    (cleanSearch && cleanSearch.includes(jobLoc.toLowerCase()))
  ) {
    return true;
  }

  // Token & component match (e.g., Allahabad/Prayagraj, Delhi NCR, Bangalore, Karnataka)
  const searchParts = s.split(/[\/,\(\)\-]+/).map(p => p.trim()).filter(p => p.length > 2);
  const jobParts = fullLocText.split(/[\/,\(\)\-]+/).map(p => p.trim()).filter(p => p.length > 2);

  for (const sp of searchParts) {
    if (jobParts.some(jp => jp.includes(sp) || sp.includes(jp))) {
      return true;
    }
  }

  const searchWords = s.split(/[\s\/,\(\)\-]+/).map(t => t.trim()).filter(t => t.length > 2);
  const jobWords = fullLocText.split(/[\s\/,\(\)\-]+/).map(t => t.trim()).filter(t => t.length > 2);
  for (const sw of searchWords) {
    if (jobWords.includes(sw)) {
      return true;
    }
  }

  return false;
};

// IIMJobs-style locations used by the onboarding preferred-location selector + Workplace Modes
const preferredLocations = [
  'Anywhere in India',
  'Remote', 'Hybrid', 'On-site',
  'Abu Dhabi', 'Africa', 'Agra', 'Ahmedabad', 'Ajmer', 'Akola', 'Aligarh',
  'Allahabad/Prayagraj', 'Alwar', 'Amritsar', 'Andhra Pradesh', 'Ankleshwar',
  'Asansol', 'Aurangabad', 'Baddi', 'Bahrain', 'Bangalore', 'Bangladesh',
  'Bareilly', 'Belgaum', 'Bhagalpur', 'Bharuch', 'Bhatinda', 'Bhilai',
  'Bhiwadi', 'Bhopal', 'Bhubaneshwar', 'Bikaner', 'Bokaro', 'Burdwan',
  'Calicut/Kozhikode', 'Chandigarh', 'Chennai', 'China', 'Cochin/Kochi',
  'Coimbatore', 'Cuttack', 'Daman & Diu', 'Darjeeling', 'Dehradun', 'Delhi',
  'Delhi NCR', 'Dhanbad', 'Dharwad', 'Doha', 'Dubai', 'Durgapur', 'Europe',
  'Faridabad', 'Gandhidham', 'Gandhinagar', 'Gangtok', 'Ghaziabad', 'Goa',
  'Gorakhpur', 'Greater Noida', 'Gujarat', 'Gulbarga', 'Guntur',
  'Gurgaon/Gurugram', 'Guwahati', 'Gwalior', 'Haldia', 'Haridwar',
  'Himachal Pradesh', 'Hong Kong', 'Hosur', 'Howrah', 'Hubli', 'Hyderabad',
  'Indore', 'Indonesia', 'Jabalpur', 'Jaipur', 'Jalandhar', 'Jammu',
  'Jamnagar', 'Jamshedpur', 'Japan', 'Jharkhand', 'Jodhpur', 'Kanpur',
  'Karnal', 'Karnataka', 'Kharagpur', 'Kolhapur', 'Kolkata', 'Kota',
  'Kottayam', 'Kuwait', 'London', 'Lucknow', 'Ludhiana', 'Madurai',
  'Malaysia', 'Mangalore', 'Manipal', 'Mathura', 'Mauritius', 'Meerut',
  'Middle East', 'Mohali', 'Moradabad', 'Mumbai', 'Mysore', 'Nagpur',
  'Nashik', 'Navi Mumbai', 'Nellore', 'Nepal', 'New Zealand', 'Noida',
  'North India', 'Oman', 'Palakkad', 'Panchkula', 'Panipat', 'Patiala',
  'Patna', 'Philippines', 'Pondicherry', 'Pune', 'Punjab', 'Qatar', 'Raipur',
  'Rajahmundry', 'Rajkot', 'Rajasthan', 'Ranchi', 'Rewa', 'Rohtak', 'Roorkee',
  'Rourkela', 'Rudrapur', 'Russia', 'Saharanpur', 'Salem', 'Sangli', 'Satara',
  'Saudi Arabia', 'Shillong', 'Shimla', 'Siliguri', 'Singapore', 'Solapur',
  'South Africa', 'South India', 'Sri Lanka', 'Srinagar', 'Surat', 'Thane',
  'Thailand', 'Thanjavur', 'Thrissur', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupati', 'Trivandrum/Thiruvananthapuram', 'UAE', 'Udaipur', 'Udupi',
  'Ujjain', 'UK', 'USA', 'Uttar Pradesh', 'Uttarakhand', 'Vadodara/Baroda',
  'Vapi', 'Varanasi/Banaras', 'Vellore', 'Vijayawada',
  'Vishakhapatnam/Vizag', 'Warangal', 'West Bengal', 'Zambia', 'Zimbabwe',
];

export const preferredLocationOptions = preferredLocations.map((location) => ({
  label: location,
  value: location,
  displayName: location,
}));

// A current location must be one specific place, unlike a job preference.
export const currentLocationOptions = preferredLocationOptions.filter(
  ({ value }) => value !== 'Anywhere in India' && value !== 'Anywhere in India/Multiple Locations'
);

export const getJobLocationBadges = (job) => {
  if (!job) return { displayLocation: '', workplaceMode: '' };
  
  let loc = String(job.location || '').trim();
  let workLoc = String(job.details?.workLocation || '').trim();
  let directMode = String(job.workplaceMode || job.details?.workplaceMode || '').trim();

  // If workLocation is identical to loc, avoid duplicate
  if (loc.toLowerCase() === workLoc.toLowerCase()) {
    workLoc = '';
  }

  // Check if loc contains mode in parentheses or after delimiter, e.g. "Gurgaon (Hybrid)" or "Abu Dhabi • Hybrid" or "Noida / Remote"
  let detectedMode = directMode;
  const modeRegex = /(?:\(|\/|\•|\-|\b)(hybrid|remote|on-site|onsite|in person|in-person|wfh|work from home)(?:\)|\b)/i;
  
  const locMatch = loc.match(modeRegex);
  if (locMatch) {
    if (!detectedMode) {
      if (/hybrid/i.test(locMatch[1])) detectedMode = 'Hybrid';
      else if (/remote|wfh|work from home/i.test(locMatch[1])) detectedMode = 'Remote';
      else detectedMode = 'On-site';
    }
    loc = loc.replace(/\s*(?:\(|\/|\•|\-)?\s*(hybrid|remote|on-site|onsite|in person|in-person|wfh|work from home)\s*\)?/gi, '').trim();
  }

  const workLocMatch = workLoc.match(modeRegex);
  if (workLocMatch) {
    if (!detectedMode) {
      if (/hybrid/i.test(workLocMatch[1])) detectedMode = 'Hybrid';
      else if (/remote|wfh|work from home/i.test(workLocMatch[1])) detectedMode = 'Remote';
      else detectedMode = 'On-site';
    }
    workLoc = workLoc.replace(/\s*(?:\(|\/|\•|\-)?\s*(hybrid|remote|on-site|onsite|in person|in-person|wfh|work from home)\s*\)?/gi, '').trim();
  }

  // If workLoc is now identical to loc or empty, clear it
  if (workLoc && workLoc.toLowerCase() === loc.toLowerCase()) {
    workLoc = '';
  }

  // Clean trailing punctuation
  loc = loc.replace(/[\/,\-\•\s]+$/, '').trim();
  workLoc = workLoc.replace(/[\/,\-\•\s]+$/, '').trim();

  const finalMode = detectedMode || (workLoc && workLoc.toLowerCase() !== loc.toLowerCase() ? workLoc : '');

  // If location itself is "Remote" and mode is "Remote", don't duplicate
  if (loc.toLowerCase() === 'remote' && finalMode.toLowerCase() === 'remote') {
    return {
      displayLocation: 'Remote',
      workplaceMode: ''
    };
  }

  return {
    displayLocation: loc || 'Not specified',
    workplaceMode: finalMode
  };
};

export const formatJobLocation = (job) => {
  const { displayLocation, workplaceMode } = getJobLocationBadges(job);
  if (!workplaceMode) return displayLocation;
  if (!displayLocation || displayLocation === 'Not specified') return workplaceMode;
  return `${displayLocation} • ${workplaceMode}`;
};

