import React, { useState, useRef, useEffect } from 'react';
import { COUNTRY_CODES } from '../../data/countryCodes';

export default function CountryCodeDropdown({ value = '+91', onChange, disabled = false, size = 'md', buttonClassName = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedObj = COUNTRY_CODES.find(c => c.code === value) || {
    code: value || '+91',
    flag: '🇮🇳',
    name: 'India (+91)'
  };

  const filtered = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  const isSmall = size === 'sm';

  return (
    <div className="relative shrink-0 select-none" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearch('');
          }
        }}
        className={`flex items-center gap-1.5 ${
          isSmall ? 'px-2.5 py-2.5 text-xs' : 'px-3 py-3 text-sm'
        } font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-l-xl border-r border-gray-200 transition-colors cursor-pointer outline-none ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        } ${buttonClassName}`}
        aria-label="Select Country Code"
      >
        <span className={isSmall ? 'text-sm leading-none' : 'text-base leading-none'}>{selectedObj.flag}</span>
        <span className="font-bold text-gray-800">{selectedObj.code}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-gray-100 bg-gray-50/80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-green-500 text-gray-800"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-center text-gray-400 font-medium">No country found</div>
            ) : (
              filtered.map((c, idx) => (
                <button
                  key={`${c.country}-${c.code}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange?.(c.code);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-green-50 transition-colors cursor-pointer ${
                    c.code === value ? 'bg-green-50 font-bold text-green-800' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </div>
                  <span className="font-semibold text-gray-400 shrink-0 ml-2">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
