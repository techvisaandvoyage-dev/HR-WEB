import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select option", 
  searchPlaceholder = "",
  error = false, 
  className = "", 
  rounded = "rounded-xl",
  dropdownClassName = "",
  allowCustomValue = true,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize options so both strings and objects are safely supported without crashes
  const safeOptions = (Array.isArray(options) ? options : []).map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: String(opt), label: String(opt), keywords: [], isGroupLabel: false };
    }
    if (!opt || typeof opt !== 'object') {
      return { value: '', label: '', keywords: [], isGroupLabel: false };
    }
    return {
      value: opt.value !== undefined ? String(opt.value) : (opt.label ? String(opt.label) : ''),
      label: opt.label !== undefined ? String(opt.label) : (opt.value ? String(opt.value) : ''),
      keywords: Array.isArray(opt.keywords) ? opt.keywords : [],
      isGroupLabel: Boolean(opt.isGroupLabel)
    };
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (isOpen && searchTerm.trim() !== '') {
          const searchLower = searchTerm.trim().toLowerCase();
          const exactMatch = safeOptions.find(opt => 
            !opt.isGroupLabel && (
              opt.label.toLowerCase() === searchLower || 
              opt.value.toLowerCase() === searchLower ||
              opt.keywords.some(k => k.toLowerCase() === searchLower)
            )
          );
          if (exactMatch && exactMatch.value !== String(value ?? '')) {
            onChange(exactMatch.value);
          }
        }
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, searchTerm, onChange, safeOptions, value, allowCustomValue, disabled]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 280px below and more space above, open upward
      if (spaceBelow < 280 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  const cleanStr = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const searchClean = cleanStr(searchTerm);
  const searchTokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const selectedOption = value !== undefined && value !== null && String(value) !== ''
    ? safeOptions.find(opt => String(opt.value) === String(value) && !opt.isGroupLabel)
    : undefined;
  const isDropdownOpen = isOpen && !disabled;

  // Filter options based on search term (label, value, keywords, aliases, cleaned matches)
  const filteredOptions = safeOptions.filter(opt => {
    if (opt.isGroupLabel) return true;
    if (!searchTerm.trim()) return true;

    const labelStr = opt.label.toLowerCase();
    const valueStr = opt.value.toLowerCase();
    const keywordsStr = opt.keywords.join(' ').toLowerCase();

    // 1. Direct contains check
    if (labelStr.includes(searchTerm.toLowerCase()) || 
        valueStr.includes(searchTerm.toLowerCase()) || 
        keywordsStr.includes(searchTerm.toLowerCase())) {
      return true;
    }

    // 2. Cleaned / stripped match (e.g., "u.p." or "up board" matches "UPMSP")
    const combinedClean = cleanStr(opt.label) + ' ' + cleanStr(opt.value) + ' ' + cleanStr(keywordsStr);
    if (searchClean && combinedClean.includes(searchClean)) {
      return true;
    }

    // 3. Multi-token match (all words in search term present across fields)
    if (searchTokens.length > 1) {
      const combinedAll = labelStr + ' ' + valueStr + ' ' + keywordsStr;
      const allTokensMatch = searchTokens.every(tok => combinedAll.includes(tok));
      if (allTokensMatch) return true;
    }

    return false;
  });

  const labelTextSize = className.includes('text-xs') ? 'text-xs' : 'text-sm';

  return (
    <div className={`relative w-full text-left font-sans ${isOpen ? 'z-50' : 'z-0'}`} ref={wrapperRef}>
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        aria-disabled={disabled}
        className={`w-full ${className.includes('px-') ? '' : 'px-4'} ${className.includes('py-') ? '' : 'py-3'} min-h-[48px] bg-white border ${
          isDropdownOpen ? 'border-[#059669] ring-2 ring-[#059669]/20' : (error ? 'border-red-500 bg-red-50/20' : (className.includes('border-') ? '' : 'border-[#cfd7e4] hover:border-[#9fb0c8]'))
        } ${rounded} text-gray-700 flex justify-between items-center transition-all shadow-2xs ${disabled ? 'cursor-not-allowed bg-gray-100 opacity-70' : 'cursor-pointer'} text-sm ${className}`}
      >
        <div className="flex-1 overflow-hidden pr-2">
          <span className={selectedOption || value ? `text-gray-900 font-medium block truncate ${labelTextSize}` : `text-gray-400 block truncate ${labelTextSize}`}>
            {selectedOption ? selectedOption.label : (value || placeholder)}
          </span>
        </div>
        <div className="focus:outline-none flex-shrink-0">
          <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#059669]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isDropdownOpen && (
        <div className={`absolute z-50 min-w-full ${dropdownClassName || 'w-full'} ${openUpward ? 'bottom-full mb-2' : 'mt-1.5'} bg-white border border-gray-100 rounded-2xl shadow-xl flex flex-col overflow-hidden`}>
          {/* Search bar inside dropdown menu */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchTerm.trim() !== '') {
                      const firstMatch = filteredOptions.find(opt => !opt.isGroupLabel);
                      if (firstMatch && firstMatch.value !== String(value ?? '')) {
                        onChange(firstMatch.value);
                      } else if (allowCustomValue) {
                        if (searchTerm.trim() !== String(value ?? '')) onChange(searchTerm.trim());
                      }
                      if (firstMatch || allowCustomValue) {
                        setIsOpen(false);
                        setSearchTerm('');
                      }
                    }
                  }
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] transition-all text-gray-800 placeholder-gray-400"
                placeholder={searchPlaceholder || `Search ${placeholder || 'options'}...`}
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
            {filteredOptions.some(opt => !opt.isGroupLabel) ? filteredOptions.map((opt, idx) => {
              if (opt.isGroupLabel) {
                const nextGroupIdx = filteredOptions.findIndex((o, i) => i > idx && o.isGroupLabel);
                const children = filteredOptions.slice(idx + 1, nextGroupIdx === -1 ? filteredOptions.length : nextGroupIdx);
                if (children.length === 0) return null;

                return (
                  <div key={idx} className="px-3.5 py-1.5 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mt-1 first:mt-0">
                    {opt.label}
                  </div>
                );
              }
              const isSelected = String(value ?? '') === String(opt.value);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (opt.value !== String(value ?? '')) onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-[#e6f4ea] text-[#0d652d] font-bold' 
                      : 'hover:bg-gray-50 text-gray-700 font-medium'
                  }`}
                >
                  <div className="relative flex items-center mr-3 shrink-0">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#059669] bg-[#059669]'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] block truncate">
                      {opt.label}
                    </span>
                  </div>
                </div>
              );
            }) : (
              searchTerm.trim() !== '' && allowCustomValue ? (
                <div
                  onClick={() => {
                    onChange(searchTerm);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="px-3.5 py-2.5 cursor-pointer text-xs text-[#059669] hover:bg-emerald-50 transition-colors font-bold flex items-center gap-2 rounded-xl"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Add "{searchTerm}"
                </div>
              ) : (
                <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
                  No options found
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;