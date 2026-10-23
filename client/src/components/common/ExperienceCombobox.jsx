import React, { useState, useRef, useEffect, useMemo } from 'react';

const DEFAULT_EXPERIENCE_PRESETS = [
  { value: '0 - 1 Yrs', label: '0 - 1 Yrs (Fresher)' },
  { value: '1 - 2 Yrs', label: '1 - 2 Yrs' },
  { value: '1 - 3 Yrs', label: '1 - 3 Yrs' },
  { value: '2 - 3 Yrs', label: '2 - 3 Yrs' },
  { value: '2 - 4 Yrs', label: '2 - 4 Yrs' },
  { value: '3 - 5 Yrs', label: '3 - 5 Yrs' },
  { value: '4 - 6 Yrs', label: '4 - 6 Yrs' },
  { value: '5 - 7 Yrs', label: '5 - 7 Yrs' },
  { value: '5 - 8 Yrs', label: '5 - 8 Yrs' },
  { value: '7 - 10 Yrs', label: '7 - 10 Yrs' },
  { value: '10 - 15 Yrs', label: '10 - 15 Yrs' },
  { value: '15+ Yrs', label: '15+ Yrs' }
];

const ExperienceCombobox = ({
  value = '',
  onChange,
  options = [],
  placeholder = 'e.g. 2 - 4 Yrs or Fresher',
  error = false,
  className = '',
  id = 'experience-combobox-input',
  showQuickChips = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [minYrs, setMinYrs] = useState('');
  const [maxYrs, setMaxYrs] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Normalize options passed from parent (e.g. CMS config) or use DEFAULT_EXPERIENCE_PRESETS
  const safeOptions = useMemo(() => {
    const list = Array.isArray(options) && options.length > 0 ? options : DEFAULT_EXPERIENCE_PRESETS;
    return list.map(opt => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: String(opt), label: String(opt) };
      }
      return {
        value: String(opt?.value ?? opt?.label ?? ''),
        label: String(opt?.label ?? opt?.value ?? '')
      };
    }).filter(opt => opt.value);
  }, [options]);

  // Handle outside clicks to close dropdown (preserves user-typed value)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check upward positioning when opening
  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    onChange(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectOption = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const applyMinMax = () => {
    const min = minYrs.trim();
    const max = maxYrs.trim();
    if (!min && !max) return;

    let rangeStr = '';
    if (min && max) {
      const minNum = Number(min);
      const maxNum = Number(max);
      if (!isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum) {
        rangeStr = `${max} - ${min} Yrs`;
      } else if (min === '0' && max === '1') {
        rangeStr = '0 - 1 Yrs (Fresher)';
      } else {
        rangeStr = `${min} - ${max} Yrs`;
      }
    } else if (min) {
      rangeStr = `${min}+ Yrs`;
    } else if (max) {
      rangeStr = `0 - ${max} Yrs`;
    }

    if (rangeStr) {
      onChange(rangeStr);
      setMinYrs('');
      setMaxYrs('');
      setIsOpen(false);
    }
  };

  // Filter options based on typed input
  const query = (value || '').trim().toLowerCase();
  const filteredOptions = safeOptions.filter(opt =>
    !query || opt.label.toLowerCase().includes(query) || opt.value.toLowerCase().includes(query)
  );

  const isExactPresetMatch = safeOptions.some(opt =>
    opt.value.toLowerCase() === query || opt.label.toLowerCase() === query
  );

  const quickPillOptions = ['Fresher', '1 - 2 Yrs', '2 - 4 Yrs', '3 - 5 Yrs', '5 - 8 Yrs', '8+ Yrs'];

  return (
    <div className={`relative w-full text-left font-sans ${isOpen ? 'z-50' : 'z-0'}`} ref={wrapperRef}>
      {/* Input container */}
      <div
        className={`w-full px-3.5 py-2.5 bg-white border ${
          isOpen
            ? 'border-[#29953f] ring-1 ring-[#29953f]'
            : error
              ? 'border-red-500 bg-red-50/20'
              : 'border-gray-200 hover:border-gray-300'
        } rounded-lg text-gray-700 flex items-center justify-between transition-all shadow-2xs ${className}`}
      >
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setIsOpen(false);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm font-normal"
        />

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                inputRef.current?.focus();
              }}
              title="Clear"
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            title="Toggle options"
            className="text-gray-400 hover:text-gray-600 p-0.5 focus:outline-none cursor-pointer"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#29953f]' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Picks Chips */}
      {showQuickChips && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-gray-400 mr-0.5 select-none">Quick picks:</span>
          {quickPillOptions.map((chip) => {
            const valLower = (value || '').toLowerCase();
            const isActive = valLower === chip.toLowerCase() ||
              (chip === 'Fresher' && (valLower.includes('fresher') || valLower === '0 - 1 yrs'));
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  const targetVal = chip === 'Fresher' ? '0 - 1 Yrs (Fresher)' : chip;
                  onChange(targetVal);
                  setIsOpen(false);
                }}
                className={`px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-green-50 text-[#29953f] border-green-300 font-semibold shadow-2xs ring-1 ring-green-300'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full ${
            openUpward ? 'bottom-full mb-2' : 'mt-1.5'
          } bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden`}
        >
          {/* Quick Custom Range Builder header */}
          <div className="p-3 bg-gray-50/90 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5 select-none">
                <svg className="w-3.5 h-3.5 text-[#29953f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Custom Range Builder
              </span>
              <span className="text-[11px] text-gray-400 select-none">in Years</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#29953f] focus-within:ring-1 focus-within:ring-[#29953f]">
                <span className="text-xs text-gray-400 font-medium select-none">Min:</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={minYrs}
                  onChange={(e) => setMinYrs(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs text-gray-800 outline-none bg-transparent"
                />
              </div>
              <span className="text-xs text-gray-400 font-semibold select-none">to</span>
              <div className="flex-1 flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#29953f] focus-within:ring-1 focus-within:ring-[#29953f]">
                <span className="text-xs text-gray-400 font-medium select-none">Max:</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={maxYrs}
                  onChange={(e) => setMaxYrs(e.target.value)}
                  placeholder="3"
                  className="w-full text-xs text-gray-800 outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyMinMax();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={applyMinMax}
                className="px-3.5 py-1.5 bg-[#29953f] hover:bg-[#237d35] text-white text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Active Custom Value Confirmation item (when employer typed something custom) */}
          {query && !isExactPresetMatch && (
            <div
              onClick={() => setIsOpen(false)}
              className="px-4 py-2.5 bg-green-50/70 border-b border-green-100 cursor-pointer text-sm text-[#29953f] hover:bg-green-100/70 flex items-center justify-between font-medium transition-colors"
            >
              <span className="flex items-center gap-2 truncate">
                <svg className="w-4 h-4 shrink-0 text-[#29953f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="truncate">Use typed: <strong className="font-semibold">"{value}"</strong></span>
              </span>
              <span className="text-[10px] text-[#29953f] uppercase font-bold tracking-wider shrink-0 bg-white px-2 py-0.5 rounded border border-green-200 ml-2">
                Custom
              </span>
            </div>
          )}

          {/* Preset list title */}
          <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
            <span>Standard Presets</span>
            <span className="text-[10px] text-gray-400 font-normal">Click to pick</span>
          </div>

          {/* Scrollable list of presets */}
          <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = value?.toLowerCase() === opt.value.toLowerCase() || value?.toLowerCase() === opt.label.toLowerCase();
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`px-4 py-2 cursor-pointer text-sm flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-green-50 text-[#29953f] font-semibold'
                        : 'text-gray-700 hover:bg-green-50/60 hover:text-[#29953f]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-[#29953f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-gray-500 text-center font-medium">
                No standard presets match "{value}". You can still use your custom entered text!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceCombobox;
