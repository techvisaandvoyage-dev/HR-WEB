import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ options, value, onChange, placeholder = "Select option", error = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (isOpen && searchTerm.trim() !== '') {
          const exactMatch = options.find(opt => opt.label.toLowerCase() === searchTerm.trim().toLowerCase() && !opt.isGroupLabel);
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
  }, [isOpen, searchTerm, onChange]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter(opt => {
    if (opt.isGroupLabel) return true;
    return opt.label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="relative w-full text-left font-sans" ref={wrapperRef}>
      <div
        onClick={() => setIsOpen(true)}
        className={`w-full px-4 py-3 bg-white border ${isOpen ? 'border-green-500 ring-1 ring-green-500' : (error ? 'border-red-500' : 'border-gray-200')} rounded-xl text-gray-700 flex justify-between items-center transition-all shadow-sm cursor-text`}
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
                    onChange(searchTerm.trim());
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                }
              }}
              className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400"
              placeholder={selectedOption ? selectedOption.label : (value || placeholder)}
            />
          ) : (
            <span className={selectedOption || value ? 'text-gray-900 block truncate' : 'text-[#9CA3AF] block truncate'}>
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
          <svg className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-40 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar py-2">
          {filteredOptions.some(opt => !opt.isGroupLabel) ? filteredOptions.map((opt, idx) => {
            if (opt.isGroupLabel) {
              // Hide group label if it has no children matching the search
              const nextGroupIdx = filteredOptions.findIndex((o, i) => i > idx && o.isGroupLabel);
              const children = filteredOptions.slice(idx + 1, nextGroupIdx === -1 ? filteredOptions.length : nextGroupIdx);
              if (children.length === 0) return null;

              return (
                <div key={idx} className="px-5 py-2 text-sm font-semibold text-[#9CA3AF] mt-1 first:mt-0 tracking-wide">
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
                className={`px-5 py-2.5 cursor-pointer text-[15px] hover:bg-gray-50 transition-colors ${value === opt.value ? 'bg-green-50 text-green-700 font-semibold' : 'text-[#374151]'}`}
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
                className="px-5 py-3 cursor-pointer text-[14px] text-green-700 hover:bg-green-50 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add "{searchTerm}"
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-500 text-center font-medium">
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
