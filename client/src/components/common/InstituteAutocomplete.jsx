import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InstituteAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Search or enter university / institute...", 
  className = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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

  // Fetch institutions from backend proxy (all universities/institutes globally)
  const fetchInstitutions = useCallback(async (searchQuery, cursor = null, isAppend = false) => {
    const q = (searchQuery || '').trim();
    if (!q && !cursor) {
      setSuggestions([]);
      setNextCursor(null);
      setIsLoading(false);
      return;
    }

    if (isAppend) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setErrorMessage('');
    }

    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`${API_URL}/api/institutions/search?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        if (isAppend) {
          setSuggestions(prev => {
            const seenIds = new Set(prev.map(item => item.id || item.name));
            const newItems = data.data.filter(item => !seenIds.has(item.id || item.name));
            return [...prev, ...newItems];
          });
        } else {
          setSuggestions(data.data);
        }
        setNextCursor(data.nextCursor || null);
      } else {
        if (!isAppend) setSuggestions([]);
        setNextCursor(null);
      }
    } catch (err) {
      console.warn('Education search error:', err);
      if (!isAppend) {
        setErrorMessage('Unable to load institutions. Please try again.');
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Debounced search on query changes (starting from 1 char)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      setNextCursor(null);
      setIsLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchInstitutions(query, null, false);
    }, 100);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchInstitutions]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (onChange) {
      onChange(val);
    }
  };

  const [activeIndex, setActiveIndex] = useState(-1);

  const getFullDisplayString = (item) => {
    if (typeof item === 'string') return item;
    const name = (item.name || '').trim();
    const acronymPart = item.acronym && !name.includes(`(${item.acronym})`) && !name.includes(item.acronym)
      ? ` (${item.acronym})`
      : '';
    
    // Construct location parts (City, State, Country if foreign)
    const locParts = [];
    const city = (item.city || '').trim();
    const state = (item.state || item.region || '').trim();
    const country = (item.country || '').trim();

    if (city) {
      locParts.push(city);
    }
    if (state && (!city || city.toLowerCase() !== state.toLowerCase())) {
      locParts.push(state);
    }
    if (country && country !== 'India' && country !== 'IN' && !locParts.includes(country)) {
      locParts.push(country);
    }

    const locStr = locParts.length > 0 ? `, ${locParts.join(', ')}` : '';
    return `${name}${acronymPart}${locStr}`;
  };

  const handleSelect = (item) => {
    const fullStr = getFullDisplayString(item);
    setQuery(fullStr);
    setIsOpen(false);
    setActiveIndex(-1);
    if (onChange) {
      onChange(fullStr);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleLoadMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (nextCursor && !isLoadingMore) {
      fetchInstitutions(query, nextCursor, true);
    }
  };

  // Helper to highlight matching text prefixes in bold (matching Naukri/Indeed style)
  const renderHighlightedText = (text, searchStr) => {
    if (!searchStr || !searchStr.trim()) return <span>{text}</span>;
    const qTrim = searchStr.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(qTrim);
    if (idx === -1) return <span>{text}</span>;

    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + qTrim.length);
    const after = text.substring(idx + qTrim.length);

    return (
      <span>
        {before}
        <strong className="font-extrabold text-gray-900">{match}</strong>
        <span className="font-normal text-gray-700">{after}</span>
      </span>
    );
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (query.trim().length >= 1 || suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {isOpen && query.trim().length >= 1 && (
        <div className="absolute z-[200] w-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in duration-150 py-1">
          {/* Results List */}
          <div className="divide-y divide-gray-50">
            {suggestions.length > 0 ? (
              <>
                {suggestions.map((item, index) => {
                  const fullDisplay = getFullDisplayString(item);
                  const isSelected = activeIndex === index;

                  return (
                    <div 
                      key={item.id || index}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center justify-between text-left group ${
                        isSelected ? 'bg-emerald-50 text-emerald-950' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-[14px] text-gray-800 truncate flex-1 pr-2">
                        {renderHighlightedText(fullDisplay, query)}
                      </div>
                    </div>
                  );
                })}

                {/* Load More Pagination */}
                {nextCursor && (
                  <div className="p-2 text-center bg-gray-50/50">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading more...</span>
                        </>
                      ) : (
                        <span>Load more institutions ↓</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : isLoading ? (
              <div className="px-4 py-5 text-xs text-gray-500 font-medium text-center flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Searching universities & colleges...</span>
              </div>
            ) : errorMessage ? (
              <div className="px-4 py-3 text-xs text-red-500 text-center">
                {errorMessage}
              </div>
            ) : (
              <div className="px-4 py-3.5 text-xs text-gray-500 text-center">
                Press Enter or continue typing <span className="font-bold text-gray-800">"{query}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteAutocomplete;
