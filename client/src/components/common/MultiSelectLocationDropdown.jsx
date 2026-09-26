import React, { useState, useRef, useEffect } from 'react';

const cleanTerm = (text) => {
  if (!text) return '';
  return text
    .replace(/\b(tahsil|tehsil|taluk|taluka|sub-district|subdistrict|district|mandal|division|block)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatLocationIQItem = (loc) => {
  if (!loc) return null;
  const addr = loc.address || {};
  const place = cleanTerm(
    loc.display_place || 
    addr.name || 
    addr.village || 
    addr.hamlet || 
    addr.town || 
    addr.city || 
    addr.suburb || 
    addr.municipality || 
    loc.name || 
    ''
  );
  const district = cleanTerm(addr.county || addr.state_district || addr.district || '');
  const state = cleanTerm(addr.state || addr.country || '');

  if (!place && !state) return null;

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

  const label = parts.join(', ');
  return { label, value: label };
};

const formatPhotonItem = (feat) => {
  if (!feat || !feat.properties) return null;
  const p = feat.properties;
  const place = cleanTerm(p.name || p.city || p.town || p.village || '');
  const district = cleanTerm(p.county || p.district || '');
  const state = cleanTerm(p.state || p.country || '');

  if (!place && !state) return null;

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

  const label = parts.join(', ');
  return { label, value: label };
};

const MultiSelectLocationDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  multiple = true,
  placeholder = "Select locations",
  className = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 transition-all shadow-sm"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [liveOptions, setLiveOptions] = useState([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
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
    const isIndiaAnywhere = (v) => v === 'Anywhere in India' || v === 'Anywhere in India/Multiple Locations';

    if (selectedValues.includes(optValue)) {
      newSelected = selectedValues.filter(v => v !== optValue);
    } else {
      if (isIndiaAnywhere(optValue)) {
        newSelected = [optValue];
      } else {
        newSelected = [...selectedValues.filter(v => !isIndiaAnywhere(v)), optValue];
      }
    }
    onChange(newSelected.join(', '));
  };

  // Fetch live location combinations across India & worldwide (Villages, Towns, Cities, Districts, States)
  useEffect(() => {
    const query = searchTerm.trim();

    if (!query) {
      setLiveOptions([]);
      setIsLoadingLive(false);
      return undefined;
    }

    setIsLoadingLive(true);
    const fetchLiveLocations = async () => {
      try {
        const encodedQuery = encodeURIComponent(query);
        const locIqIndiaUrl = `https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodedQuery}&limit=15&countrycodes=in`;
        const locIqIntlUrl = `https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodedQuery}&limit=10`;
        const photonUrl = `https://photon.komoot.io/api/?q=${encodedQuery}&limit=15&lang=en`;

        const [indiaRes, intlRes, photonRes] = await Promise.allSettled([
          fetch(locIqIndiaUrl),
          fetch(locIqIntlUrl),
          fetch(photonUrl)
        ]);

        const uniqueMap = new Map();

        // 1. Curated / Default matching options
        (options || []).forEach(opt => {
          if (opt?.label?.toLowerCase().includes(query.toLowerCase())) {
            uniqueMap.set(opt.value.toLowerCase(), opt);
          }
        });

        // 2. LocationIQ India (Villages, Tehsils, Towns, Cities)
        if (indiaRes.status === 'fulfilled' && indiaRes.value.ok) {
          const indiaData = await indiaRes.value.json();
          if (Array.isArray(indiaData)) {
            indiaData.forEach(item => {
              const formatted = formatLocationIQItem(item);
              if (formatted && !uniqueMap.has(formatted.value.toLowerCase())) {
                uniqueMap.set(formatted.value.toLowerCase(), formatted);
              }
            });
          }
        }

        // 3. Photon Geocoder (deep coverage for tiny villages and towns)
        if (photonRes.status === 'fulfilled' && photonRes.value.ok) {
          const photonData = await photonRes.value.json();
          if (photonData && Array.isArray(photonData.features)) {
            photonData.features.forEach(feat => {
              const formatted = formatPhotonItem(feat);
              if (formatted && !uniqueMap.has(formatted.value.toLowerCase())) {
                uniqueMap.set(formatted.value.toLowerCase(), formatted);
              }
            });
          }
        }

        // 4. International LocationIQ
        if (intlRes.status === 'fulfilled' && intlRes.value.ok) {
          const intlData = await intlRes.value.json();
          if (Array.isArray(intlData)) {
            intlData.forEach(item => {
              const formatted = formatLocationIQItem(item);
              if (formatted && !uniqueMap.has(formatted.value.toLowerCase())) {
                uniqueMap.set(formatted.value.toLowerCase(), formatted);
              }
            });
          }
        }

        setLiveOptions([...uniqueMap.values()]);
      } catch (error) {
        console.error('Error fetching live locations:', error);
        const staticMatches = (options || []).filter(opt => 
          opt?.label?.toLowerCase().includes(query.toLowerCase())
        );
        setLiveOptions(staticMatches);
      } finally {
        setIsLoadingLive(false);
      }
    };

    const debounceTimer = setTimeout(fetchLiveLocations, 180);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, options]);

  // If searching, show live combinations. Otherwise show default popular options.
  const displayedOptions = searchTerm.trim().length > 0 ? liveOptions : options;

  return (
    <div className={`relative w-full text-left font-sans ${isOpen ? 'z-50' : 'z-0'}`} ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex justify-between items-center cursor-pointer ${isOpen ? 'border-green-500 ring-1 ring-green-500' : ''}`}
      >
        <div className="flex-1 overflow-hidden pr-2 truncate">
          {selectedValues.length > 0 ? (
            <span className="text-gray-900 font-medium">{selectedValues.join(', ')}</span>
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
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-80">
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Type city, village, tehsil or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-sm"
                autoFocus
              />
              {isLoadingLive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto custom-scrollbar p-2">
            {displayedOptions.length > 0 ? (
              displayedOptions.map((opt, idx) => {
                const isSelected = selectedValues.some(v => 
                  v.toLowerCase() === opt.value.toLowerCase() ||
                  v.toLowerCase() === opt.label.toLowerCase()
                );
                return (
                  <label 
                    key={`${opt.value}-${idx}`} 
                    className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-green-50/70 text-green-950 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative flex items-center">
                      <input
                        type={multiple ? 'checkbox' : 'radio'}
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(opt.value)}
                        className={`peer w-5 h-5 appearance-none border border-gray-300 cursor-pointer checked:bg-green-500 checked:border-green-500 transition-all ${multiple ? 'rounded-md' : 'rounded-full'}`}
                      />
                      <svg className="absolute w-3 h-3 text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <span className="text-[13.5px] block truncate">
                        {opt.label}
                      </span>
                    </div>
                  </label>
                );
              })
            ) : isLoadingLive ? (
              <div className="px-4 py-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
                <span>Searching cities, villages and states...</span>
              </div>
            ) : (
              <div className="px-4 py-4 text-sm text-gray-500 text-center">
                {searchTerm.trim() ? (
                  <div>
                    <p className="mb-1 text-gray-600">No exact match found for "{searchTerm}"</p>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange(searchTerm.trim())}
                      className="text-xs text-green-600 hover:text-green-700 font-semibold underline"
                    >
                      Use "{searchTerm.trim()}" as custom location
                    </button>
                  </div>
                ) : (
                  'No locations available'
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectLocationDropdown;
