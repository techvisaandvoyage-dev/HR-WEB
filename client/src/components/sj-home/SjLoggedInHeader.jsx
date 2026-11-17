import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './headers.css';
import SjProfileDropdown from './SjProfileDropdown';
import LocationAutocomplete from '../common/LocationAutocomplete';
import BrandLogo from '../common/BrandLogo';
import { preferredLocationOptions } from '../../data/preferredLocations';
import { socket } from '../../utils/socket';

const EXPERIENCE_OPTIONS = [
  { label: 'Any Experience', value: 'All' },
  { label: '0 - 1 Yrs', value: '0 - 1 Yrs' },
  { label: '1 - 2 Yrs', value: '1 - 2 Yrs' },
  { label: '2 - 3 Yrs', value: '2 - 3 Yrs' },
  { label: '3 - 5 Yrs', value: '3 - 5 Yrs' },
  { label: '4 - 6 Yrs', value: '4 - 6 Yrs' },
  { label: '5 - 8 Yrs', value: '5 - 8 Yrs' },
  { label: '7 - 10 Yrs', value: '7 - 10 Yrs' },
  { label: '11 - 15 Yrs', value: '11 - 15 Yrs' },
  { label: '16 - 20 Yrs', value: '16 - 20 Yrs' },
  { label: '21 - 25 Yrs', value: '21 - 25 Yrs' },
  { label: '25+ yrs', value: '25+ yrs' },
];

const POSTING_DATE_OPTIONS = [
  { label: 'Any time', value: 'Any time' },
  { label: 'Past 24 hours', value: 'Past 24 hours' },
  { label: 'Past 3 days', value: 'Past 3 days' },
  { label: 'Past week', value: 'Past week' },
  { label: 'Past month', value: 'Past month' },
];

// Shared cache for all SjLoggedInHeader instances so jobs are available instantly on every page
let cachedGlobalJobs = [];
let isFetchingGlobalJobs = false;
const globalJobsListeners = new Set();

const fetchGlobalJobs = async () => {
  if (cachedGlobalJobs.length > 0 || isFetchingGlobalJobs) return;
  isFetchingGlobalJobs = true;
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiUrl}/api/employee/jobs`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      const normalized = data.data.map(j => {
        const comp = j.company || j.employerId?.companyName || j.companyName || 'SahiJob';
        return {
          ...j,
          id: j._id || j.id,
          title: j.title || j.t || '',
          company: comp,
          companyInitial: (comp.trim().charAt(0) || 'S').toUpperCase(),
          location: j.location || j.details?.workLocation || j.city || 'Anywhere in India'
        };
      });
      cachedGlobalJobs = normalized;
      globalJobsListeners.forEach(listener => {
        try { listener(normalized); } catch (_) {}
      });
    }
  } catch (err) {
    console.error("Error loading header jobs:", err);
  } finally {
    isFetchingGlobalJobs = false;
  }
};

function TopbarDropdown({
  placeholder,
  headerTitle,
  value,
  onChange,
  options,
  icon,
  isOpen,
  onToggle,
  onClose,
  multiple = true,
}) {
  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string' && value && value !== 'All' && value !== 'Any time') {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  const displayLabel = useMemo(() => {
    if (!multiple) {
      return value === 'All' || value === 'Any time' ? placeholder : value;
    }
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues[0]} +${selectedValues.length - 1}`;
  }, [multiple, value, selectedValues, placeholder]);

  const isAllOption = (optVal) => optVal === 'All' || optVal === 'Any time';

  const isSelected = (optVal) => {
    if (isAllOption(optVal)) {
      return selectedValues.length === 0 || selectedValues.includes(optVal);
    }
    return selectedValues.includes(optVal);
  };

  const handleSelectOption = (optVal) => {
    if (!multiple) {
      onChange?.(optVal);
      onClose();
      return;
    }

    if (isAllOption(optVal)) {
      onChange?.(optVal === 'All' ? 'All' : 'Any time');
      return;
    }

    let next;
    if (selectedValues.includes(optVal)) {
      next = selectedValues.filter((v) => v !== optVal);
    } else {
      next = [...selectedValues, optVal];
    }

    if (next.length === 0) {
      onChange?.(options[0]?.value || (placeholder === 'Date Posted' ? 'Any time' : 'All'));
    } else {
      onChange?.(next.join(', '));
    }
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange?.(options[0]?.value || (placeholder === 'Date Posted' ? 'Any time' : 'All'));
  };

  return (
    <div className="relative font-sans h-full flex items-center border-r border-gray-300 shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className={`px-3.5 py-1.5 h-full flex items-center gap-1.5 text-sm bg-transparent cursor-pointer font-medium transition-colors ${
          selectedValues.length > 0 ? 'text-emerald-700 font-bold' : 'text-gray-700 hover:text-gray-900'
        }`}
      >
        <span className="truncate max-w-[125px] text-left">{displayLabel}</span>
        {selectedValues.length > 1 && (
          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center justify-center shrink-0">
            {selectedValues.length}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="sj-search-dropdown-menu" onClick={(e) => e.stopPropagation()}>
          <div className="sj-search-dropdown-header flex items-center justify-between">
            <span>
              {headerTitle || placeholder} ({options.length})
            </span>
            {multiple && selectedValues.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-transparent cursor-pointer normal-case tracking-normal hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {options.map((opt) => {
              const selected = isSelected(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelectOption(opt.value)}
                  className={`sj-search-dropdown-item ${selected ? 'is-selected' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="sj-search-dropdown-icon">
                      {icon || (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {selected && (
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
          {multiple && (
            <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 pl-2">
                {selectedValues.length === 0 ? 'All included' : `${selectedValues.length} selected`}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopbarLocationDropdown({
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
}) {
  const [query, setQuery] = useState('');
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedLocations = useMemo(() => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'all') {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setApiSuggestions([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const fetchLocations = async () => {
      try {
        const res = await fetch(
          `https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodeURIComponent(
            query
          )}&limit=10&tag=place:city,place:town,place:village,place:state,place:suburb,place:hamlet&countrycodes=in`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setApiSuggestions(data);
        } else {
          setApiSuggestions([]);
        }
      } catch {
        setApiSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    const timer = setTimeout(fetchLocations, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const defaultLocations = [
    'Remote',
    'Anywhere in India',
    'Delhi NCR',
    'Bangalore',
    'Mumbai',
    'Hyderabad',
    'Pune',
    'Chennai',
    'Kolkata',
    'Noida',
    'Gurugram',
    'Ahmedabad',
    'Jaipur',
    'Chandigarh',
  ];

  const displayedOptions = useMemo(() => {
    if (query.trim().length >= 2 && apiSuggestions.length > 0) {
      return apiSuggestions.map((item) => {
        const address = item.address || {};
        const main = address.city || address.town || address.village || address.suburb || address.state_district || item.display_name.split(',')[0];
        const state = address.state || '';
        const label = state && main !== state ? `${main}, ${state}` : main;
        return { label, value: label };
      });
    }
    if (query.trim().length > 0) {
      return (preferredLocationOptions || [])
        .filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 15);
    }
    return defaultLocations.map((loc) => ({ label: loc, value: loc }));
  }, [query, apiSuggestions]);

  const handleToggleLoc = (locName) => {
    const isIndia = (v) => v.toLowerCase().includes('anywhere in india');
    let next;
    if (selectedLocations.some((l) => l.toLowerCase() === locName.toLowerCase())) {
      next = selectedLocations.filter((l) => l.toLowerCase() !== locName.toLowerCase());
    } else {
      if (isIndia(locName)) {
        next = [locName];
      } else {
        next = [...selectedLocations.filter((l) => !isIndia(l)), locName];
      }
    }
    onChange?.(next.length === 0 ? '' : next.join(', '));
  };

  const handleRemovePill = (e, locName) => {
    e.stopPropagation();
    const next = selectedLocations.filter((l) => l.toLowerCase() !== locName.toLowerCase());
    onChange?.(next.length === 0 ? '' : next.join(', '));
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    onChange?.('');
    setQuery('');
  };

  return (
    <div className="flex-1 flex items-center px-3 h-full min-w-0 relative">
      <svg className="w-5 h-5 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>

      {/* Trigger Area */}
      <div
        className="flex-1 flex items-center gap-1.5 min-w-0 cursor-pointer h-full"
        onClick={onToggle}
      >
        {selectedLocations.length === 0 ? (
          <span className="text-sm text-gray-500 truncate">City, state</span>
        ) : selectedLocations.length === 1 ? (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 max-w-[130px] truncate">
            <span className="truncate">{selectedLocations[0]}</span>
            <button
              type="button"
              onClick={(e) => handleRemovePill(e, selectedLocations[0])}
              className="text-emerald-600 hover:text-emerald-900 ml-0.5 cursor-pointer"
            >
              &times;
            </button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 max-w-[150px] truncate">
            <span className="truncate">{selectedLocations[0]}</span>
            <span className="bg-emerald-200/80 text-emerald-900 rounded-full px-1 text-[10px]">
              +{selectedLocations.length - 1}
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-emerald-600 hover:text-emerald-900 ml-0.5 cursor-pointer"
              title="Clear all locations"
            >
              &times;
            </button>
          </span>
        )}
      </div>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="sj-search-dropdown-menu w-[310px] left-0" onClick={(e) => e.stopPropagation()}>
          <div className="sj-search-dropdown-header flex items-center justify-between">
            <span>Location ({selectedLocations.length > 0 ? `${selectedLocations.length} selected` : 'Multi-select'})</span>
            {selectedLocations.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-transparent cursor-pointer normal-case tracking-normal hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search box inside popover */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative flex items-center">
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search city, state or remote..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    e.preventDefault();
                    handleToggleLoc(query.trim());
                    setQuery('');
                  }
                }}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                autoFocus
              />
              {isLoading && (
                <div className="w-3 h-3 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin absolute right-2.5" />
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto">
            {displayedOptions.map((opt) => {
              const optVal = opt.value || opt.label;
              const isChecked = selectedLocations.some(
                (l) => l.toLowerCase() === optVal.toLowerCase()
              );
              return (
                <div
                  key={optVal}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLoc(optVal);
                  }}
                  className={`sj-search-dropdown-item ${isChecked ? 'is-selected' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="sj-search-dropdown-icon">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="truncate text-xs">{opt.label}</span>
                  </div>
                  {isChecked && (
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer with Apply button */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 pl-2">
              {selectedLocations.length === 0 ? 'All locations' : `${selectedLocations.length} selected`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileFilterSheet({
  isOpen,
  type, // 'experience' | 'datePosted' | 'location'
  onClose,
  experience,
  onExperienceChange,
  postingDate,
  onPostingDateChange,
  searchLocation,
  onSearchLocationChange,
}) {
  const [locQuery, setLocQuery] = useState('');
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [locLoading, setLocLoading] = useState(false);

  // Parse current values
  const expSelected = useMemo(() => {
    if (!experience || experience === 'All') return [];
    return experience.split(',').map((s) => s.trim()).filter(Boolean);
  }, [experience]);

  const dateSelected = useMemo(() => {
    if (!postingDate || postingDate === 'Any time') return [];
    return postingDate.split(',').map((s) => s.trim()).filter(Boolean);
  }, [postingDate]);

  const locSelected = useMemo(() => {
    if (!searchLocation || searchLocation.trim().toLowerCase() === 'all') return [];
    return searchLocation.split(',').map((s) => s.trim()).filter(Boolean);
  }, [searchLocation]);

  // Location suggestions fetch
  useEffect(() => {
    if (!locQuery || locQuery.trim().length < 2) {
      setLocSuggestions([]);
      setLocLoading(false);
      return;
    }
    setLocLoading(true);
    const fetchLocs = async () => {
      try {
        const res = await fetch(
          `https://api.locationiq.com/v1/autocomplete.php?key=pk.7314b93604200f3007d3b610030e6f1b&q=${encodeURIComponent(
            locQuery
          )}&limit=10&tag=place:city,place:town,place:village,place:state,place:suburb,place:hamlet&countrycodes=in`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setLocSuggestions(data);
        } else {
          setLocSuggestions([]);
        }
      } catch {
        setLocSuggestions([]);
      } finally {
        setLocLoading(false);
      }
    };
    const timer = setTimeout(fetchLocs, 200);
    return () => clearTimeout(timer);
  }, [locQuery]);

  const popularLocations = [
    'Remote',
    'Anywhere in India',
    'Bangalore',
    'Mumbai',
    'Delhi NCR',
    'Hyderabad',
    'Pune',
    'Chennai',
    'Noida',
    'Gurugram',
    'Kolkata',
    'Ahmedabad',
  ];

  const displayedLocations = useMemo(() => {
    if (locQuery.trim().length >= 2 && locSuggestions.length > 0) {
      return locSuggestions.map((item) => {
        const address = item.address || {};
        const main = address.city || address.town || address.village || address.suburb || address.state_district || item.display_name.split(',')[0];
        const state = address.state || '';
        const label = state && main !== state ? `${main}, ${state}` : main;
        return { label, value: label };
      });
    }
    if (locQuery.trim().length > 0) {
      return (preferredLocationOptions || [])
        .filter((opt) => opt.label.toLowerCase().includes(locQuery.toLowerCase()))
        .slice(0, 15);
    }
    return popularLocations.map((l) => ({ label: l, value: l }));
  }, [locQuery, locSuggestions]);

  if (!isOpen || !type) return null;

  const handleToggleExp = (val) => {
    if (val === 'All') {
      onExperienceChange?.('All');
      return;
    }
    let next;
    if (expSelected.includes(val)) {
      next = expSelected.filter((v) => v !== val);
    } else {
      next = [...expSelected, val];
    }
    onExperienceChange?.(next.length === 0 ? 'All' : next.join(', '));
  };

  const handleToggleDate = (val) => {
    if (val === 'Any time') {
      onPostingDateChange?.('Any time');
      return;
    }
    let next;
    if (dateSelected.includes(val)) {
      next = dateSelected.filter((v) => v !== val);
    } else {
      next = [...dateSelected, val];
    }
    onPostingDateChange?.(next.length === 0 ? 'Any time' : next.join(', '));
  };

  const handleToggleLocation = (loc) => {
    const isIndia = (v) => v.toLowerCase().includes('anywhere in india');
    let next;
    if (locSelected.some((l) => l.toLowerCase() === loc.toLowerCase())) {
      next = locSelected.filter((l) => l.toLowerCase() !== loc.toLowerCase());
    } else {
      if (isIndia(loc)) {
        next = [loc];
      } else {
        next = [...locSelected.filter((l) => !isIndia(l)), loc];
      }
    }
    onSearchLocationChange?.(next.length === 0 ? '' : next.join(', '));
  };

  const getSheetTitle = () => {
    if (type === 'experience') return 'Filter by Experience';
    if (type === 'datePosted') return 'Filter by Date Posted';
    if (type === 'location') return 'Filter by Location';
    return 'Filter';
  };

  const sheetContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col z-[10000] animate-slideUp">
        {/* Drag handle pill */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{getSheetTitle()}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {type === 'experience' && (expSelected.length > 0 ? `${expSelected.length} selected` : 'Select experience ranges')}
              {type === 'datePosted' && (dateSelected.length > 0 ? `${dateSelected.length} selected` : 'Select job posting period')}
              {type === 'location' && (locSelected.length > 0 ? `${locSelected.length} locations selected` : 'Select cities or remote')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sheet Body */}
        <div className="overflow-y-auto p-4 flex-1">
          {/* 1. EXPERIENCE */}
          {type === 'experience' && (
            <div className="space-y-1.5">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isAll = opt.value === 'All';
                const checked = isAll ? expSelected.length === 0 : expSelected.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleExp(opt.value)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {checked && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. DATE POSTED */}
          {type === 'datePosted' && (
            <div className="space-y-1.5">
              {POSTING_DATE_OPTIONS.map((opt) => {
                const isAll = opt.value === 'Any time';
                const checked = isAll ? dateSelected.length === 0 : dateSelected.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggleDate(opt.value)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                      checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. LOCATION */}
          {type === 'location' && (
            <div className="space-y-3">
              {/* Search location input */}
              <div className="relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search city, state or remote..."
                  value={locQuery}
                  onChange={(e) => setLocQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                {locLoading && (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin absolute right-3 top-2.5" />
                )}
              </div>

              {/* Selected Pills */}
              {locSelected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                  {locSelected.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-2xs"
                    >
                      <span>{loc}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleLocation(loc)}
                        className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Suggestions / Popular locations list */}
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
                  {locQuery.trim().length >= 2 ? 'Search Results' : 'Popular Cities & Remote'}
                </div>
                {displayedLocations.map((item) => {
                  const locVal = item.value || item.label;
                  const isChecked = locSelected.some((l) => l.toLowerCase() === locVal.toLowerCase());
                  return (
                    <div
                      key={locVal}
                      onClick={() => handleToggleLocation(locVal)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs truncate">{item.label}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sheet Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (type === 'experience') onExperienceChange?.('All');
              if (type === 'datePosted') onPostingDateChange?.('Any time');
              if (type === 'location') onSearchLocationChange?.('');
            }}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-center"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(sheetContent, document.body)
    : sheetContent;
}

export default function SjLoggedInHeader({
  logoConfig,
  searchLabel = 'Search jobs here',
  onOpenSearch,
  searchTerm = '',
  onSearchTermChange,
  searchLocation = '',
  onSearchLocationChange,
  experience = 'All',
  onExperienceChange,
  postingDate = 'Any time',
  onPostingDateChange,
  jobs = [],
  userProfile = null,
  hasUnreadMessages = false,
  unreadCount = undefined,
  savedCount = 0,
  onSubmitSearch,
  onSelectSuggestion,
  onNavigateHome,
  onNavigateSaved,
  onNavigateApplied,
  onNavigateMessages,
  onNavigateProfile,
  onNavigateSecurity,
  onSignOut,
  onLogoClick,
  hideSearchOnMobile = false,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'experience' | 'datePosted' | 'suggestions' | null
  const searchRef = useRef(null);

  // Mobile Search & Filter state
  const [mobileFilterSheet, setMobileFilterSheet] = useState(null); // 'experience' | 'datePosted' | 'location' | null
  const [isMobileSuggestionsOpen, setIsMobileSuggestionsOpen] = useState(false);
  const mobileSearchRef = useRef(null);
  const headerRef = useRef(null);

  // Fallback internal jobs for pages that don't pass `jobs` prop
  const [internalJobs, setInternalJobs] = useState(cachedGlobalJobs);

  useEffect(() => {
    if (cachedGlobalJobs.length > 0) {
      setInternalJobs(cachedGlobalJobs);
    }
    const onJobsLoaded = (newJobs) => {
      setInternalJobs(newJobs);
    };
    globalJobsListeners.add(onJobsLoaded);

    if (!Array.isArray(jobs) || jobs.length === 0) {
      fetchGlobalJobs();
    }

    return () => {
      globalJobsListeners.delete(onJobsLoaded);
    };
  }, [jobs]);

  const effectiveJobsList = useMemo(() => {
    if (Array.isArray(jobs) && jobs.length > 0) return jobs;
    if (internalJobs.length > 0) return internalJobs;
    return cachedGlobalJobs;
  }, [jobs, internalJobs]);

  // Suggestions for job title input (matching or suggested jobs)
  const matchingJobs = useMemo(() => {
    if (!Array.isArray(effectiveJobsList) || effectiveJobsList.length === 0) return [];
    if (!searchTerm || !searchTerm.trim()) {
      return effectiveJobsList.slice(0, 5);
    }
    const q = searchTerm.toLowerCase().trim();
    return effectiveJobsList.filter((j) => {
      const title = (j.title || j.t || '').toLowerCase();
      const comp = (j.company || j.companyName || j.employerId?.companyName || j.c || '').toLowerCase();
      const loc = (j.location || j.details?.workLocation || j.city || '').toLowerCase();
      const skills = Array.isArray(j.skills) ? j.skills.join(' ').toLowerCase() : (j.skills || '').toLowerCase();
      return title.includes(q) || comp.includes(q) || loc.includes(q) || skills.includes(q);
    }).slice(0, 8);
  }, [searchTerm, effectiveJobsList]);

  // Click outside to close all search dropdowns
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setIsMobileSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, []);

  // Keyboard shortcut listener: press '/' to focus or open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      const isInputFocused = /INPUT|TEXTAREA|SELECT/.test(activeTag) || (document.activeElement && document.activeElement.isContentEditable);
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        const input = searchRef.current?.querySelector('input[type="text"]');
        if (input) {
          input.focus();
        } else if (onOpenSearch) {
          onOpenSearch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  let parsedEmployeeUser = null;
  try {
    const rawEmp = localStorage.getItem('employeeUser');
    if (rawEmp) parsedEmployeeUser = JSON.parse(rawEmp);
  } catch (e) {
    parsedEmployeeUser = null;
  }

  // Real-time unread messages count
  const [internalUnread, setInternalUnread] = useState(0);

  const fetchCandidateUnread = async () => {
    const token = localStorage.getItem('employeeToken');
    if (!token) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/employee/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && typeof data.count === 'number') {
        setInternalUnread(data.count);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchCandidateUnread();

    const empId = parsedEmployeeUser?.id || parsedEmployeeUser?._id;
    if (empId) {
      socket.emit('join_user', empId);
    }

    const handleUpdate = () => {
      fetchCandidateUnread();
    };

    socket.on('conversation_updated', handleUpdate);
    socket.on('receive_message', handleUpdate);
    socket.on('messages_marked_read', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('unread_messages_updated', handleUpdate);

    return () => {
      socket.off('conversation_updated', handleUpdate);
      socket.off('receive_message', handleUpdate);
      socket.off('messages_marked_read', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('unread_messages_updated', handleUpdate);
    };
  }, [parsedEmployeeUser?.id, parsedEmployeeUser?._id]);

  const effectiveUnread = unreadCount !== undefined ? unreadCount : internalUnread;
  const showUnreadBadge = effectiveUnread > 0 || hasUnreadMessages;

  const userEmail = 
    userProfile?.email || 
    parsedEmployeeUser?.email || 
    parsedEmployeeUser?.profile?.email || 
    parsedEmployeeUser?.user?.email || 
    localStorage.getItem('employeeEmail') || 
    '';

  const userName = 
    userProfile?.fullName ||
    userProfile?.name || 
    [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') || 
    parsedEmployeeUser?.name || 
    [parsedEmployeeUser?.profile?.firstName, parsedEmployeeUser?.profile?.lastName].filter(Boolean).join(' ') || 
    parsedEmployeeUser?.profile?.name || 
    (userEmail ? userEmail.split('@')[0] : 'User');

  const avatarUrl = 
    userProfile?.avatar || 
    parsedEmployeeUser?.avatar || 
    parsedEmployeeUser?.profile?.avatar || 
    '';

  const initial = (userName.charAt(0) || 'U').toUpperCase();

  const isImage = logoConfig?.type === 'image' && Boolean(logoConfig.imageUrl);
  const isCustomText =
    logoConfig?.type === 'text' &&
    Boolean(logoConfig.text) &&
    logoConfig.text.trim().toLowerCase() !== 'sahijob';
  const logoText = logoConfig?.text || 'SahiJob';
  const accentText =
    logoConfig?.accentText !== undefined ? logoConfig.accentText : '.com';

  return (
    <header className="sj-header" id="mh" ref={headerRef}>
      <div className="sj-nav-inner">
        {/* Brand Logo (Single line, scale cleanly on mobile) */}
        <div className="shrink-0 flex items-center max-w-[140px] sm:max-w-none sm:w-48">
          <BrandLogo onClick={onLogoClick} customConfig={logoConfig} />
        </div>

        {/* Multi-Segment Search Bar (Desktop only: >= 860px) */}
        <div className="sj-topbar-search hidden min-[860px]:flex" ref={searchRef}>
          <TopbarDropdown
            placeholder="Experience"
            headerTitle="Experience"
            value={experience}
            onChange={onExperienceChange}
            options={EXPERIENCE_OPTIONS}
            isOpen={openDropdown === 'experience'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'experience' ? null : 'experience'))}
            onClose={() => setOpenDropdown(null)}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <TopbarDropdown
            placeholder="Date Posted"
            headerTitle="Date Posted"
            value={postingDate}
            onChange={onPostingDateChange}
            options={POSTING_DATE_OPTIONS}
            isOpen={openDropdown === 'datePosted'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'datePosted' ? null : 'datePosted'))}
            onClose={() => setOpenDropdown(null)}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <div className="flex-1 flex items-center px-3 border-r border-gray-300 relative h-full min-w-0">
            <svg className="w-5 h-5 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Find your perfect job"
              value={searchTerm}
              onChange={(e) => {
                onSearchTermChange?.(e.target.value);
                setOpenDropdown('suggestions');
              }}
              onFocus={() => {
                setOpenDropdown('suggestions');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setOpenDropdown(null);
                  onSubmitSearch?.(searchTerm);
                }
              }}
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent text-sm text-gray-900 placeholder-gray-500 shadow-none ring-0"
            />
            {openDropdown === 'suggestions' && (
              <div className="sj-search-dropdown-menu w-[125%] min-w-[300px]">
                <div className="sj-search-dropdown-header">
                  {searchTerm && searchTerm.trim() ? `Matching Jobs (${matchingJobs.length})` : 'Suggested Jobs'}
                </div>
                {matchingJobs.length > 0 ? (
                  matchingJobs.map((job) => {
                    const compName = job.company || job.companyName || job.employerId?.companyName || 'SahiJob';
                    const compInitial = (job.companyInitial || compName.trim().charAt(0) || 'S').toUpperCase();
                    const jobTitle = job.title || job.t || 'Job Opening';
                    const jobLoc = job.location || job.details?.workLocation || job.city || 'Anywhere in India';

                    return (
                      <div
                        key={job.id || job._id}
                        onClick={() => {
                          onSearchTermChange?.(jobTitle);
                          setOpenDropdown(null);
                          if (onSelectSuggestion) {
                            onSelectSuggestion(job);
                          } else if (onSubmitSearch) {
                            onSubmitSearch(jobTitle);
                          }
                        }}
                        className="sj-search-dropdown-item"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="sj-search-dropdown-icon text-xs font-bold">
                            {compInitial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13.5px] font-bold text-gray-900 truncate leading-tight">
                              {jobTitle}
                            </div>
                            <div className="text-[11.5px] text-gray-500 truncate mt-0.5 font-medium">
                              {compName} • {jobLoc}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
                    No jobs found for "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          <TopbarLocationDropdown
            value={searchLocation}
            onChange={(val) => {
              onSearchLocationChange?.(val);
            }}
            isOpen={openDropdown === 'location'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'location' ? null : 'location'))}
            onClose={() => setOpenDropdown(null)}
          />
        </div>

        {/* Action Buttons (Messages + Profile Avatar, always visible on right) */}
        <div className="sj-actions-cluster flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {/* Messages Icon */}
          <div className="relative group flex items-center justify-center">
            <button
              type="button"
              className="sj-icon-btn relative"
              onClick={onNavigateMessages}
              aria-label="Messages"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16v12H8l-4 4Z" />
              </svg>
              {showUnreadBadge && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs pointer-events-none">
                  {effectiveUnread > 0 ? (effectiveUnread > 9 ? '9+' : effectiveUnread) : '1'}
                </span>
              )}
            </button>
            {/* Custom Tooltip on Hover */}
            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#0f172a] text-white text-[11px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 z-[120]">
              Messages
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0f172a] rotate-45"></div>
            </div>
          </div>

          {/* Profile Menu Trigger */}
          <button
            type="button"
            className="sj-icon-btn sj-profile-trigger cursor-pointer"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isDropdownOpen}
            aria-label="Profile Account Menu"
            title={userName || 'Account'}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover border border-[var(--sj-line)]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--sj-ink)] text-white text-xs font-bold flex items-center justify-center">
                {initial}
              </div>
            )}
          </button>

          {/* Profile Dropdown Component */}
          <SjProfileDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            email={userEmail}
            name={userName}
            onNavigateHome={onNavigateHome || onLogoClick}
            onNavigateProfile={onNavigateProfile}
            onNavigateMessages={onNavigateMessages}
            unreadCount={showUnreadBadge ? effectiveUnread : 0}
            savedCount={savedCount}
            onNavigateSaved={onNavigateSaved}
            onNavigateApplied={onNavigateApplied}
            onNavigateSecurity={onNavigateSecurity}
            onSignOut={onSignOut}
          />
        </div>
      </div>

      {/* Mobile Search & Filters Strip (< 860px) */}
      <div className={`sj-mobile-search-strip min-[860px]:hidden px-3.5 pb-2.5 pt-0.5 border-t border-slate-100/80 bg-white ${hideSearchOnMobile ? '!hidden' : ''}`}>
        {/* Mobile Search Input */}
        <div className="relative flex items-center mb-2" ref={mobileSearchRef}>
          <svg className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs by title, company, skills..."
            value={searchTerm}
            onChange={(e) => {
              onSearchTermChange?.(e.target.value);
              setIsMobileSuggestionsOpen(true);
            }}
            onFocus={() => {
              if (searchTerm) setIsMobileSuggestionsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsMobileSuggestionsOpen(false);
                onSubmitSearch?.(searchTerm);
              }
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                onSearchTermChange?.('');
                setIsMobileSuggestionsOpen(false);
              }}
              className="absolute right-2.5 w-5 h-5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}

          {/* Mobile Suggestions Popup */}
          {isMobileSuggestionsOpen && searchTerm && (
            <div className="absolute top-[calc(100%+6px)] inset-x-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[250px] overflow-y-auto">
              <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Matching Jobs ({matchingJobs.length})
              </div>
              {matchingJobs.length > 0 ? (
                matchingJobs.map((job) => {
                  const compName = job.company || job.companyName || job.employerId?.companyName || 'SahiJob';
                  const jobTitle = job.title || job.t || 'Job Opening';
                  const jobLoc = job.location || job.details?.workLocation || job.city || 'Anywhere in India';
                  return (
                    <div
                      key={job.id || job._id}
                      onClick={() => {
                        onSearchTermChange?.(jobTitle);
                        setIsMobileSuggestionsOpen(false);
                        if (onSelectSuggestion) onSelectSuggestion(job);
                        else if (onSubmitSearch) onSubmitSearch(jobTitle);
                      }}
                      className="p-2.5 border-b border-slate-50 hover:bg-emerald-50/60 active:bg-emerald-100/50 cursor-pointer flex items-center gap-2.5 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {(job.companyInitial || compName.trim().charAt(0) || 'S').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{jobTitle}</p>
                        <p className="text-[11px] text-slate-500 truncate">{compName} • {jobLoc}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 font-medium">
                  No jobs found for "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Pills Horizontal Scroll */}
        {(() => {
          const isExpActive = Boolean(experience && experience !== 'All');
          const isDateActive = Boolean(postingDate && postingDate !== 'Any time');
          const isLocActive = Boolean(searchLocation && searchLocation.trim() && searchLocation.toLowerCase() !== 'all');
          const isSearchActive = Boolean(searchTerm && searchTerm.trim());
          const hasActiveFilters = isExpActive || isDateActive || isLocActive || isSearchActive;

          const getExpText = () => {
            if (!isExpActive) return 'Experience';
            const parts = experience.split(',').map((s) => s.trim()).filter(Boolean);
            if (parts.length <= 1) return parts[0] || 'Experience';
            return `Exp (${parts.length})`;
          };

          const getDateText = () => {
            if (!isDateActive) return 'Date Posted';
            const parts = postingDate.split(',').map((s) => s.trim()).filter(Boolean);
            if (parts.length <= 1) return parts[0] || 'Date Posted';
            return `Date (${parts.length})`;
          };

          const getLocText = () => {
            if (!isLocActive) return 'Location';
            const parts = searchLocation.split(',').map((s) => s.trim()).filter(Boolean);
            if (parts.length <= 1) return parts[0] || 'Location';
            return `Location (${parts.length})`;
          };

          const handleClearFilters = () => {
            onSearchTermChange?.('');
            onExperienceChange?.('All');
            onPostingDateChange?.('Any time');
            onSearchLocationChange?.('');
          };

          return (
            <div className="sj-mobile-filter-pills">
              {/* Clear filters Chip (prominently visible at front when any filter or search is active) */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="sj-mobile-clear-chip"
                  title="Clear all filters"
                >
                  <span>✕ Clear filters</span>
                </button>
              )}

              {/* Experience Chip */}
              <button
                type="button"
                onClick={() => setMobileFilterSheet('experience')}
                className={`sj-mobile-filter-chip ${isExpActive ? 'is-active' : ''}`}
              >
                <span className="truncate max-w-[130px]">{getExpText()}</span>
                <svg className="w-3 h-3 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Date Posted Chip */}
              <button
                type="button"
                onClick={() => setMobileFilterSheet('datePosted')}
                className={`sj-mobile-filter-chip ${isDateActive ? 'is-active' : ''}`}
              >
                <span className="truncate max-w-[130px]">{getDateText()}</span>
                <svg className="w-3 h-3 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Location Chip */}
              <button
                type="button"
                onClick={() => setMobileFilterSheet('location')}
                className={`sj-mobile-filter-chip ${isLocActive ? 'is-active' : ''}`}
              >
                <span className="truncate max-w-[130px]">{getLocText()}</span>
                <svg className="w-3 h-3 opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          );
        })()}
      </div>

      {/* Mobile Filter Modal Bottom Sheet */}
      <MobileFilterSheet
        isOpen={Boolean(mobileFilterSheet)}
        type={mobileFilterSheet}
        onClose={() => setMobileFilterSheet(null)}
        experience={experience}
        onExperienceChange={onExperienceChange}
        postingDate={postingDate}
        onPostingDateChange={onPostingDateChange}
        searchLocation={searchLocation}
        onSearchLocationChange={onSearchLocationChange}
      />
    </header>
  );
}

