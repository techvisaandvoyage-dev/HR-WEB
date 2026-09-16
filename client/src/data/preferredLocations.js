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
    q === 'all india'
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
  const isInternational = NON_INDIA_LOCATIONS.some((intl) => loc.includes(intl));
  if (isInternational) {
    return false;
  }

  // All other domestic locations in the Indian job portal default to India
  return true;
};

export const isLocationMatch = (jobLocation = '', searchLocation = '', workLocation = '') => {
  if (!searchLocation || !searchLocation.trim()) return true;

  if (isIndiaAnywhereQuery(searchLocation)) {
    return isJobInIndia(jobLocation, workLocation);
  }

  const cleanSearch = searchLocation.trim().toLowerCase().split(',')[0].trim();
  const jobLoc = String(jobLocation || '').toLowerCase();
  const workLoc = String(workLocation || '').toLowerCase();

  return (
    jobLoc.includes(cleanSearch) ||
    workLoc.includes(cleanSearch) ||
    cleanSearch.includes(jobLoc)
  );
};

// IIMJobs-style locations used by the onboarding preferred-location selector.
const preferredLocations = [
  'Anywhere in India',
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
