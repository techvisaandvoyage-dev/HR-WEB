import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const JobTitleAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Enter or search job title (e.g. Software Engineer)...", 
  className = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all",
  required = false
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync prop value
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

  // Fetch occupations from ESCO-powered backend proxy
  const fetchOccupations = useCallback(async (searchQuery) => {
    const q = (searchQuery || '').trim();
    if (!q) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/occupations/search?q=${encodeURIComponent(q)}&limit=15`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setSuggestions(data.data);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.warn('Occupation search error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search on query changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchOccupations(query);
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchOccupations]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (onChange) {
      onChange(val);
    }
  };

  const handleSelect = (item) => {
    const title = typeof item === 'string' ? item : item.title || item.name;
    setQuery(title);
    setIsOpen(false);
    if (onChange) {
      onChange(title);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => {
          if (query.trim().length >= 2 || suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        required={required}
      />

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute z-[200] w-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
          <div className="divide-y divide-gray-50">
            {suggestions.length > 0 ? (
              <>
                <div className="px-3.5 py-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                  <span>ESCO / Official Occupations</span>
                  <span className="text-emerald-600 font-bold">Standardized</span>
                </div>
                {suggestions.map((item, index) => (
                  <div 
                    key={item.uri || index}
                    onClick={() => handleSelect(item)}
                    className="px-4 py-2.5 cursor-pointer hover:bg-emerald-50/70 transition-colors flex justify-between items-center gap-3 text-left group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-800 transition-colors truncate">
                        {item.title}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select
                    </span>
                  </div>
                ))}
              </>
            ) : isLoading ? (
              <div className="px-4 py-5 text-xs text-gray-500 font-medium text-center flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Searching occupations...</span>
              </div>
            ) : (
              <div className="px-4 py-3.5 text-xs text-gray-500 text-center">
                Press Enter or continue typing with <span className="font-bold text-gray-800">"{query}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTitleAutocomplete;
