import React, { useState, useEffect, useRef } from 'react';
import { preferredLocationOptions } from '../../data/preferredLocations';

const LocationAutocomplete = ({ 
  value, 
  onChange, 
  onSelect,
  onKeyDown,
  id,
  placeholder = "City, state", 
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
        const res = await fetch(`https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodeURIComponent(query)}&limit=15&tag=place:city,place:town,place:village,place:state,place:suburb,place:hamlet&countrycodes=in`);
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

    const debounceTimer = setTimeout(fetchLocations, 200);
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
      const place = cleanTerm(
        item.display_place || 
        item.address.name || 
        item.address.village || 
        item.address.hamlet || 
        item.address.town || 
        item.address.city || 
        item.address.suburb || 
        item.name || 
        ''
      );
      const district = cleanTerm(item.address.county || item.address.state_district || item.address.district || '');
      const state = cleanTerm(item.address.state || item.address.country || '');

      const parts = [];
      if (place) {
        if (district && district.toLowerCase() !== place.toLowerCase() && district.toLowerCase() !== state.toLowerCase()) {
          parts.push(`${place} (${district})`);
        } else {
          parts.push(place);
        }
      }
      if (state && state.toLowerCase() !== place.toLowerCase()) {
        parts.push(state);
      }
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
    if (onSelect) {
      onSelect(val);
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
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`${className || ''} outline-none border-none focus:outline-none focus:ring-0 focus:border-transparent shadow-none ring-0`}
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
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors mr-1 shrink-0"
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
        <div className="sj-location-menu">
          {!query && (
            <div className="sj-location-header">
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
                  className="sj-location-item"
                >
                  <div className="sj-location-icon">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="sj-location-title">{loc.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* API Realtime Suggestions if typing something outside curated list */}
          {apiSuggestions.length > 0 && (
            <div>
              <div className="sj-location-header">
                Other Matching Places
              </div>
              {apiSuggestions.map((item) => {
                const formatted = formatApiLocation(item);
                const title = item.name || item.address?.city || item.address?.town || item.address?.village || formatted.split(',')[0];
                return (
                  <div
                    key={item.place_id}
                    onClick={() => handleSelectValue(formatted)}
                    className="sj-location-item"
                  >
                    <div className="sj-location-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="sj-location-title">{title}</div>
                      <div className="sj-location-subtitle">{formatted}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {query && filteredOptions.length === 0 && apiSuggestions.length === 0 && !isLoading && (
            <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
              Press Enter or type your custom city: <span className="font-semibold text-gray-800">"{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;

