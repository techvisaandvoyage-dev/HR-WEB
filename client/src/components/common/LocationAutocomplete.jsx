import React, { useState, useEffect, useRef } from 'react';
import { preferredLocationOptions } from '../../data/preferredLocations';

const LocationAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "City, state, region or remote", 
  className = "w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500"
}) => {
  const [query, setQuery] = useState(value || '');
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Update query if value prop changes externally (except when user is actively interacting)
  useEffect(() => {
    if (value !== query && !isOpen) {
      setQuery(value || '');
    }
  }, [value, isOpen]);

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
      setApiSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fetchLocations = async () => {
      try {
        const res = await fetch(`https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodeURIComponent(query)}&limit=8&tag=place:city,place:town,place:village,place:state&countrycodes=in`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setApiSuggestions(data);
        } else {
          setApiSuggestions([]);
        }
      } catch (err) {
        setApiSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchLocations, 250);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const formatApiLocation = (item) => {
    const cleanTerm = (text) => {
      if (!text) return '';
      return text
        .replace(/\b(tahsil|tehsil|taluk|taluka|sub-district|subdistrict|district|mandal|division|block)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    if (item.address) {
      const city = cleanTerm(item.address.city || item.address.town || item.address.village || item.address.county || item.name);
      const state = cleanTerm(item.address.state);
      const parts = [];
      if (city) parts.push(city);
      if (state && state.toLowerCase() !== city.toLowerCase()) parts.push(state);
      if (parts.length > 0) return parts.join(', ');
    }
    
    let parts = (item.display_name || '')
      .split(',')
      .map(p => cleanTerm(p.trim()))
      .filter(p => isNaN(p) && p.toLowerCase() !== 'india' && Boolean(p));

    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[parts.length - 1]}`;
    }
    return parts.join(', ');
  };

  const handleSelectValue = (val) => {
    setQuery(val);
    setIsOpen(false);
    if (onChange) {
      onChange(val);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (onChange) {
      onChange(val);
    }
  };

  const filteredOptions = preferredLocationOptions.filter(loc => 
    !query || loc.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center w-full">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        
        {query && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              if (onChange) onChange('');
              setIsOpen(true);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors mr-1"
            title="Clear location"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {isLoading && (
          <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin shrink-0 mr-1"></div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+10px)] left-0 min-w-[280px] w-full max-w-[360px] bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[150] max-h-72 overflow-y-auto animate-in fade-in duration-150">
          {!query && (
            <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Locations ({preferredLocationOptions.length})
            </div>
          )}

          {/* Cities from Location Dropdown */}
          {filteredOptions.length > 0 && (
            <div>
              {filteredOptions.map((loc, idx) => (
                <div
                  key={`loc-${idx}`}
                  onClick={() => handleSelectValue(loc.value)}
                  className="px-3.5 py-2.5 hover:bg-emerald-50/70 cursor-pointer flex items-center gap-2.5 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{loc.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* API Realtime Suggestions if typing something outside curated list */}
          {apiSuggestions.length > 0 && (
            <div>
              <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/70 border-t border-gray-100">
                Other Matching Places
              </div>
              {apiSuggestions.map((item) => {
                const formatted = formatApiLocation(item);
                const title = item.name || item.address?.city || item.address?.town || item.address?.village || formatted.split(',')[0];
                return (
                  <div
                    key={item.place_id}
                    onClick={() => handleSelectValue(formatted)}
                    className="px-3.5 py-2.5 hover:bg-emerald-50/60 cursor-pointer flex items-center gap-2.5 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{title}</p>
                      <p className="text-[11px] text-gray-500 truncate">{formatted}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {query && filteredOptions.length === 0 && apiSuggestions.length === 0 && !isLoading && (
            <div className="px-4 py-3 text-xs text-gray-500 text-center">
              Press Enter or type your custom city: <span className="font-semibold text-gray-800">"{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;

