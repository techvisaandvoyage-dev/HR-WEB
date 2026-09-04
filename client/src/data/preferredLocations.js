// IIMJobs-style locations used by the onboarding preferred-location selector.
const preferredLocations = [
  'Anywhere in India/Multiple Locations',
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
}));

// A current location must be one specific place, unlike a job preference.
export const currentLocationOptions = preferredLocationOptions.filter(
  ({ value }) => value !== 'Anywhere in India/Multiple Locations'
);
