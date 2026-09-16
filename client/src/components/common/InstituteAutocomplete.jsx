import React, { useState, useEffect, useRef } from 'react';
import rawColleges from '../../data/colleges.json';

const prominentColleges = [
  { name: "Rungta College of Engineering and Technology (RCET)", location: "Bhilai, Chhattisgarh, India" },
  { name: "Rungta College of Engineering and Technology", location: "Raipur, Chhattisgarh, India" },
  { name: "Rungta College of Dental Sciences and Research (RCDSR)", location: "Bhilai, Chhattisgarh, India" },
  { name: "Rungta College of Pharmaceutical Sciences and Research (RCPSR)", location: "Bhilai, Chhattisgarh, India" },
  { name: "Rungta College of Pharmaceutical Sciences and Research", location: "Raipur, Chhattisgarh, India" },
  { name: "Rungta College of Science and Technology (RCST)", location: "Durg, Chhattisgarh, India" },
  { name: "G D Rungta College of Engineering and Technology", location: "Bhilai, Chhattisgarh, India" },
  { name: "Santosh Rungta Group of Institutions", location: "Bhilai / Raipur, Chhattisgarh, India" },
  { name: "Indian Institute of Technology Bombay (IIT Bombay)", location: "Mumbai, Maharashtra, India" },
  { name: "Indian Institute of Technology Delhi (IIT Delhi)", location: "New Delhi, Delhi, India" },
  { name: "Indian Institute of Technology Madras (IIT Madras)", location: "Chennai, Tamil Nadu, India" },
  { name: "Indian Institute of Technology Kharagpur (IIT Kharagpur)", location: "Kharagpur, West Bengal, India" },
  { name: "Indian Institute of Technology Kanpur (IIT Kanpur)", location: "Kanpur, Uttar Pradesh, India" },
  { name: "Indian Institute of Technology Roorkee (IIT Roorkee)", location: "Roorkee, Uttarakhand, India" },
  { name: "Indian Institute of Technology Guwahati (IIT Guwahati)", location: "Guwahati, Assam, India" },
  { name: "Indian Institute of Management Ahmedabad (IIM Ahmedabad)", location: "Ahmedabad, Gujarat, India" },
  { name: "Indian Institute of Management Bangalore (IIM Bangalore)", location: "Bangalore, Karnataka, India" },
  { name: "Indian Institute of Management Calcutta (IIM Calcutta)", location: "Kolkata, West Bengal, India" },
  { name: "BITS Pilani", location: "Pilani, Rajasthan, India" },
  { name: "Vellore Institute of Technology (VIT)", location: "Vellore, Tamil Nadu, India" },
  { name: "SRM Institute of Science and Technology", location: "Chennai, Tamil Nadu, India" },
  { name: "Amity University", location: "Noida, Uttar Pradesh, India" },
  { name: "Manipal Academy of Higher Education", location: "Manipal, Karnataka, India" },
  { name: "Delhi University (DU)", location: "New Delhi, Delhi, India" },
  { name: "Banaras Hindu University (BHU)", location: "Varanasi, Uttar Pradesh, India" },
  { name: "National Institute of Technology Raipur (NIT Raipur)", location: "Raipur, Chhattisgarh, India" },
  { name: "National Institute of Technology Trichy (NIT Trichy)", location: "Tiruchirappalli, Tamil Nadu, India" },
  { name: "National Institute of Technology Surathkal (NIT Surathkal)", location: "Surathkal, Karnataka, India" },
  { name: "Anna University", location: "Chennai, Tamil Nadu, India" },
  { name: "Jadavpur University", location: "Kolkata, West Bengal, India" },
  { name: "Symbiosis International University", location: "Pune, Maharashtra, India" },
  { name: "Christ University", location: "Bangalore, Karnataka, India" },
  { name: "Lovely Professional University (LPU)", location: "Phagwara, Punjab, India" },
  { name: "Chandigarh University", location: "Mohali, Punjab, India" }
];

// Combine prominent list + json library
const allColleges = [...prominentColleges, ...(Array.isArray(rawColleges) ? rawColleges : [])];

const InstituteAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Search or enter university/institute...", 
  className = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" 
}) => {
  const [query, setQuery] = useState(value || '');
  const [localSuggestions, setLocalSuggestions] = useState([]);
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const wrapperRef = useRef(null);

  // Sync prop value to local state if changed externally
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant local search on keystroke
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      setLocalSuggestions([]);
      setApiSuggestions([]);
      return;
    }

    const words = q.split(/\s+/).filter(Boolean);
    const matches = [];
    const seen = new Set();

    for (let i = 0; i < allColleges.length; i++) {
      const item = allColleges[i];
      if (!item || !item.name) continue;
      const nameLower = item.name.toLowerCase();
      const locLower = (item.location || '').toLowerCase();

      // Check if all query words appear in name or location
      const isMatch = words.every(w => nameLower.includes(w) || locLower.includes(w));
      if (isMatch && !seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        matches.push(item);
        if (matches.length >= 20) break;
      }
    }

    setLocalSuggestions(matches);
  }, [query]);

  // Secondary live LocationIQ API search for rare institutions
  useEffect(() => {
    const q = query.trim();
    if (!q || q.length < 3) {
      setApiSuggestions([]);
      setIsLoadingApi(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoadingApi(true);
      try {
        const res = await fetch(
          `https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodeURIComponent(q)}&tag=amenity:university,amenity:college&limit=10`
        );
        
        if (!res.ok) throw new Error('API request failed');
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const apiFormatted = data.map(item => {
            const city = item.address?.city || item.address?.town || item.address?.village || item.address?.county || '';
            const state = item.address?.state || '';
            const country = item.address?.country || 'India';
            const locString = [city, state, country].filter(Boolean).join(', ');

            return {
              name: item.display_place || item.display_name.split(',')[0],
              location: locString
            };
          }).filter(item => item.name);

          setApiSuggestions(apiFormatted);
        } else {
          setApiSuggestions([]);
        }
      } catch (err) {
        setApiSuggestions([]);
      } finally {
        setIsLoadingApi(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (onChange) {
      onChange(val);
    }
  };

  const handleSelect = (instituteName) => {
    setQuery(instituteName);
    setIsOpen(false);
    if (onChange) {
      onChange(instituteName);
    }
  };

  // Combine suggestions without duplicate names
  const combinedSuggestions = [...localSuggestions];
  const localNames = new Set(localSuggestions.map(s => s.name.toLowerCase()));
  apiSuggestions.forEach(apiItem => {
    if (!localNames.has(apiItem.name.toLowerCase())) {
      combinedSuggestions.push(apiItem);
    }
  });

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute z-[200] w-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in duration-150 divide-y divide-gray-50">
          {combinedSuggestions.length > 0 ? (
            combinedSuggestions.map((item, index) => (
              <div 
                key={index}
                onClick={() => handleSelect(item.name)}
                className="px-4 py-3 cursor-pointer hover:bg-emerald-50/80 transition-colors flex justify-between items-center gap-4 text-left group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-800 transition-colors truncate">
                    {item.name}
                  </p>
                  {item.location && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.location}
                    </p>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  Select
                </span>
              </div>
            ))
          ) : isLoadingApi ? (
            <div className="px-4 py-4 text-xs text-gray-500 font-medium text-center flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching colleges...</span>
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-gray-500 text-center">
              No matching institute in directory. You can press Enter or continue with <span className="font-bold text-gray-800">"{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstituteAutocomplete;
