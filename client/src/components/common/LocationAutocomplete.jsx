import React, { useState, useEffect, useRef } from 'react';

const LocationAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "e.g. Mumbai, Maharashtra", 
  className = "w-full px-5 py-3.5 rounded-full border border-gray-300 focus:border-palette-400 focus:ring-1 focus:ring-palette-400 outline-none transition-all placeholder-gray-400"
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Update query if value prop changes externally (except during typing)
  useEffect(() => {
    if (value !== query && !isOpen) {
      setQuery(value || '');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (isOpen && query.trim() !== '') {
          onChange(query);
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      // Search as soon as there is at least 1 character
      if (!query || query.trim().length < 1) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // LocationIQ Autocomplete API - Filtered for cities and states in India
        const res = await fetch(`https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodeURIComponent(query)}&limit=10&tag=place:city,place:town,place:village,place:state&countrycodes=in`);
        const data = await res.json();
        setSuggestions(data);
        setIsOpen(true);
      } catch (err) {
        console.error("Error fetching locations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API call by 300ms to make it more responsive
    const debounceTimer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const formatLocationName = (suggestion) => {
    if (suggestion.address) {
      const city = suggestion.address.city || suggestion.address.town || suggestion.address.village || suggestion.address.county;
      const state = suggestion.address.state;
      const country = suggestion.address.country;
      
      const parts = [];
      if (city) parts.push(city);
      if (state && state !== city) parts.push(state);
      if (country) parts.push(country);
      
      if (parts.length > 0) return parts.join(', ');
    }
    
    // Fallback if address object is incomplete
    let parts = suggestion.display_name.split(',').map(p => p.trim());
    // Filter out pincodes (numbers)
    parts = parts.filter(p => isNaN(p));
    // If too many parts, just keep the most relevant (first, state, country)
    if (parts.length > 3) {
      return `${parts[0]}, ${parts[parts.length-2]}, ${parts[parts.length-1]}`;
    }
    return parts.join(', ');
  };

  const handleSelect = (suggestion) => {
    const locationName = formatLocationName(suggestion);
    setQuery(locationName);
    setIsOpen(false);
    if (onChange) {
      onChange(locationName);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
        placeholder={placeholder}
        className={className}
      />
      
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <li 
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 transition-colors text-left"
            >
              <div className="font-semibold text-gray-900 truncate">
                {suggestion.name || suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.display_name.split(',')[0]}
              </div>
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {formatLocationName(suggestion)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;

