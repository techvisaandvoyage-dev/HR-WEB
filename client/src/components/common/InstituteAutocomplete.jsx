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

  // Debounced search on query changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setNextCursor(null);
      setIsLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchInstitutions(query, null, false);
    }, 300);

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

  const handleSelect = (item) => {
    const name = typeof item === 'string' ? item : item.name;
    setQuery(name);
    setIsOpen(false);
    if (onChange) {
      onChange(name);
    }
  };

  const handleLoadMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (nextCursor && !isLoadingMore) {
      fetchInstitutions(query, nextCursor, true);
    }
  };

  // Helper to get formatted badge type
  const getTypeBadge = (item) => {
    if (item.sector === 'K12') return { label: 'School', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (item.type && item.type.toLowerCase().includes('university')) return { label: 'University', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (item.type && item.type.toLowerCase().includes('college')) return { label: 'College', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { label: item.type || 'Postsecondary', color: 'bg-purple-50 text-purple-700 border-purple-200' };
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
      />

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute z-[200] w-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
          {/* Results List */}
          <div className="divide-y divide-gray-50">
            {suggestions.length > 0 ? (
              <>
                {suggestions.map((item, index) => {
                  const badge = getTypeBadge(item);
                  const locationParts = [item.city, item.region, item.country].filter(Boolean);
                  const locationStr = locationParts.join(', ');

                  return (
                    <div 
                      key={item.id || index}
                      onClick={() => handleSelect(item)}
                      className="px-4 py-3 cursor-pointer hover:bg-emerald-50/70 transition-colors flex justify-between items-center gap-4 text-left group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-800 transition-colors truncate">
                            {item.name}
                          </p>
                          {item.acronym && (
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">
                              {item.acronym}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 border text-[10px] font-semibold rounded-full shrink-0 ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          {locationStr && (
                            <span className="truncate">
                              📍 {locationStr}
                            </span>
                          )}
                          {item.website && (
                            <span className="text-[10px] text-gray-400 font-mono truncate hidden sm:inline">
                              • {item.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        Select
                      </span>
                    </div>
                  );
                })}

                {/* Load More Pagination */}
                {nextCursor && (
                  <div className="p-2.5 text-center bg-gray-50/50">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
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
              <div className="px-4 py-6 text-xs text-gray-500 font-medium text-center flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Searching universities & institutes...</span>
              </div>
            ) : errorMessage ? (
              <div className="px-4 py-4 text-xs text-red-500 text-center">
                {errorMessage}
              </div>
            ) : (
              <div className="px-4 py-4 text-xs text-gray-500 text-center">
                No matching institutions found in directory. You can press Enter or continue with <span className="font-bold text-gray-800">"{query}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteAutocomplete;
