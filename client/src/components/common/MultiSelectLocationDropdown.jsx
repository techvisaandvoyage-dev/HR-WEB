import React, { useState, useRef, useEffect } from 'react';

const MultiSelectLocationDropdown = ({ 
  options, 
  value, 
  onChange, 
  multiple = true,
  placeholder = "Select locations",
  className = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 transition-all shadow-sm"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fallbackOptions, setFallbackOptions] = useState([]);
  const [isLoadingFallback, setIsLoadingFallback] = useState(false);
  const wrapperRef = useRef(null);

  // Multi-select values are comma-separated; single-select values remain one location.
  const selectedValues = Array.isArray(value) 
    ? value 
    : (typeof value === 'string' && value ? value.split(',').map(v => v.trim()).filter(v => v) : []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckboxChange = (optValue) => {
    if (!multiple) {
      onChange(optValue);
      setIsOpen(false);
      return;
    }

    let newSelected;
    if (selectedValues.includes(optValue)) {
      newSelected = selectedValues.filter(v => v !== optValue);
    } else {
      newSelected = [...selectedValues, optValue];
    }
    onChange(newSelected.join(', '));
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const displayedOptions = filteredOptions.length > 0 ? filteredOptions : fallbackOptions;

  useEffect(() => {
    const query = searchTerm.trim();

    // The curated list is always preferred. When it has no match, show Indian
    // API results before international matches from the same location source.
    if (!query || filteredOptions.length > 0) {
      setFallbackOptions([]);
      setIsLoadingFallback(false);
      return undefined;
    }

    const fetchFallbackLocations = async () => {
      setIsLoadingFallback(true);
      try {
        const baseUrl = `https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodeURIComponent(query)}&limit=10&tag=place:city,place:town,place:village,place:state`;
        const [indiaResponse, internationalResponse] = await Promise.all([
          fetch(`${baseUrl}&countrycodes=in`),
          fetch(baseUrl),
        ]);
        const [indiaLocations, internationalLocations] = await Promise.all([
          indiaResponse.json(),
          internationalResponse.json(),
        ]);
        const uniqueLocations = new Map();

        const addLocations = (locations) => {
          if (!Array.isArray(locations)) return;

          locations.forEach((location) => {
            const address = location.address || {};
            const city = address.city || address.town || address.village || address.county || location.name;
            const state = address.state;
            const label = [city, state, address.country].filter(Boolean).join(', ');
            // Commas are the existing multi-select storage separator, so keep
            // fallback values delimiter-safe while preserving a readable label.
            const value = [city, state, address.country].filter(Boolean).join(' - ');

            if (label && value) uniqueLocations.set(value, { label, value });
          });
        };

        addLocations(indiaLocations);
        addLocations(internationalLocations);

        setFallbackOptions([...uniqueLocations.values()]);
      } catch (error) {
        console.error('Error fetching fallback locations:', error);
        setFallbackOptions([]);
      } finally {
        setIsLoadingFallback(false);
      }
    };

    const debounceTimer = setTimeout(fetchFallbackLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filteredOptions.length]);

  return (
    <div className="relative w-full text-left font-sans" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex justify-between items-center cursor-pointer ${isOpen ? 'border-green-500 ring-1 ring-green-500' : ''}`}
      >
        <div className="flex-1 overflow-hidden pr-2 truncate">
          {selectedValues.length > 0 ? (
            <span className="text-gray-900">{selectedValues.join(', ')}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <button
          type="button"
          className="focus:outline-none flex-shrink-0"
        >
          <svg className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-72">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search Locations"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              />
              {isLoadingFallback && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar p-2">
            {displayedOptions.length > 0 ? (
              displayedOptions.map((opt, idx) => (
                <label 
                  key={idx} 
                  className="flex items-center px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex items-center">
                    <input
                      type={multiple ? 'checkbox' : 'radio'}
                      checked={selectedValues.includes(opt.value)}
                      onChange={() => handleCheckboxChange(opt.value)}
                      className={`peer w-5 h-5 appearance-none border border-gray-300 cursor-pointer checked:bg-green-500 checked:border-green-500 transition-all ${multiple ? 'rounded' : 'rounded-full'}`}
                    />
                    <svg className="absolute w-3 h-3 text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={`ml-3 text-[14px] ${selectedValues.includes(opt.value) ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                </label>
              ))
            ) : isLoadingFallback ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Searching all locations...
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No locations found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectLocationDropdown;
