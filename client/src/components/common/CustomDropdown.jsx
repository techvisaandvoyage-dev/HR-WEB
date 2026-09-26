import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ options = [], value, onChange, placeholder = "Select option", error = false, className = "", rounded = "rounded-lg" }) => {
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
          if (exactMatch) {
            onChange(exactMatch.value);
          }
        }
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, searchTerm, onChange, safeOptions]);

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
      // If less than 260px below and more space above, open upward
      if (spaceBelow < 260 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  const cleanStr = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  const searchClean = cleanStr(searchTerm);
  const searchTokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const selectedOption = safeOptions.find(opt => String(opt.value) === String(value) && !opt.isGroupLabel);

  // Filter options based on search term (label, value, keywords, aliases, cleaned matches)
  const filteredOptions = safeOptions.filter(opt => {
    if (opt.isGroupLabel) return true;
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

  return (
    <div className={`relative w-full text-left font-sans ${isOpen ? 'z-50' : 'z-0'}`} ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(true)}
        className={`w-full px-4 py-2.5 bg-white border ${
          isOpen ? 'border-palette-400 ring-1 ring-palette-400' : (error ? 'border-red-500 bg-red-50/20' : 'border-gray-200')
        } ${rounded} text-gray-700 flex justify-between items-center transition-all shadow-2xs cursor-text text-sm ${className}`}
      >
        <div className="flex-1 overflow-hidden pr-2">
          {isOpen ? (
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
                    if (firstMatch) {
                      onChange(firstMatch.value);
                    } else {
                      onChange(searchTerm.trim());
                    }
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                }
              }}
              className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
              placeholder={selectedOption ? selectedOption.label : (value || placeholder)}
            />
          ) : (
            <span className={selectedOption || value ? 'text-gray-900 block truncate text-sm' : 'text-[#9CA3AF] block truncate text-sm'}>
              {selectedOption ? selectedOption.label : (value || placeholder)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
            if (isOpen) setSearchTerm('');
          }}
          className="focus:outline-none flex-shrink-0"
        >
          <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {isOpen && (
        <div className={`absolute z-50 w-full ${openUpward ? 'bottom-full mb-2' : 'mt-1.5'} bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar py-1.5`}>
          {filteredOptions.some(opt => !opt.isGroupLabel) ? filteredOptions.map((opt, idx) => {
            if (opt.isGroupLabel) {
              // Hide group label if it has no children matching the search
              const nextGroupIdx = filteredOptions.findIndex((o, i) => i > idx && o.isGroupLabel);
              const children = filteredOptions.slice(idx + 1, nextGroupIdx === -1 ? filteredOptions.length : nextGroupIdx);
              if (children.length === 0) return null;

              return (
                <div key={idx} className="px-4 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mt-1 first:mt-0">
                  {opt.label}
                </div>
              );
            }
            return (
              <div
                key={idx}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`px-4 py-2 cursor-pointer text-sm hover:bg-green-50/70 hover:text-[#29953f] transition-colors ${value === opt.value ? 'bg-green-50 text-[#29953f] font-semibold' : 'text-gray-700'}`}
              >
                {opt.label}
              </div>
            );
          }) : (
            searchTerm.trim() !== '' ? (
              <div
                onClick={() => {
                  onChange(searchTerm);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="px-4 py-2.5 cursor-pointer text-sm text-[#29953f] hover:bg-green-50 transition-colors font-medium flex items-center gap-2"
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
      )}
    </div>
  );
};

export default CustomDropdown;
