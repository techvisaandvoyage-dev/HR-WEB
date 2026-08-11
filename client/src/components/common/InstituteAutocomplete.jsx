import React, { useState, useEffect, useRef } from 'react';

const InstituteAutocomplete = ({ value, onChange, placeholder, className }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Sync prop value to local state if it changes externally
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Only filter if the user is typing, not if they just selected an option
    if (query === value) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Use LocationIQ API to fetch all local universities and colleges based on map data!
        // This ensures every tiny local college in every city/state in the WORLD is searchable.
        const res = await fetch(`https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodeURIComponent(query)}&tag=amenity:university,amenity:college&limit=15`);
        
        if (!res.ok) {
          throw new Error('API request failed');
        }
        
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // Format data to extract clean name and city/state location
          const formattedData = data.map(item => {
            let city = item.address?.city || item.address?.town || item.address?.village || item.address?.county || '';
            let state = item.address?.state || '';
            
            let locString = [city, state].filter(Boolean).join(', ');
            if (!locString) locString = 'India';

            return {
              name: item.display_place || item.display_name.split(',')[0],
              location: locString
            };
          });

          // Remove exact duplicates by name to keep dropdown clean
          const uniqueData = Array.from(new Set(formattedData.map(a => a.name)))
            .map(name => {
              return formattedData.find(a => a.name === name);
            });

          setSuggestions(uniqueData);
          setIsOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Error fetching institutes:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 600); // 600ms debounce to prevent API limits

    return () => clearTimeout(delayDebounceFn);
  }, [query, value]);

  const handleSelect = (instituteName) => {
    setQuery(instituteName);
    setIsOpen(false);
    onChange(instituteName);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // if user clears the input, clear the parent value as well
          if(e.target.value === '') {
            onChange('');
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-[150] w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 font-medium">Searching map for colleges...</div>
          ) : (
            suggestions.map((item, index) => (
              <div 
                key={index}
                onClick={() => handleSelect(item.name)}
                className="px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors border-b border-gray-50 last:border-b-0 flex justify-between items-center gap-4"
              >
                <div className="font-semibold text-gray-800 text-[15px] truncate">{item.name}</div>
                {item.location && <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{item.location}</div>}
              </div>
            ))
          )}
          
          {!isLoading && suggestions.length === 0 && query.length >= 2 && (
             <div className="px-4 py-3 text-sm text-gray-500 text-center">No colleges found. Try typing the city name.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstituteAutocomplete;
