import React, { useState, useEffect, useRef } from 'react';

const CustomMonthPicker = ({ value, onChange, placeholder = "Select Month & Year" }) => {
  // value is expected to be in "YYYY-MM" format
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingYear, setIsSelectingYear] = useState(false);
  const containerRef = useRef(null);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState('');
  
  const [yearViewStart, setYearViewStart] = useState(currentYear - (currentYear % 12));

  const months = [
    { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' }, { value: '04', label: 'Apr' },
    { value: '05', label: 'May' }, { value: '06', label: 'Jun' }, { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
    { value: '09', label: 'Sep' }, { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsSelectingYear(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-');
      if (year) setSelectedYear(parseInt(year, 10));
      if (month) setSelectedMonth(month);
      if (year) {
        const y = parseInt(year, 10);
        // keep the year in the current yearViewStart range if possible, else update it
        if (y < yearViewStart || y >= yearViewStart + 12) {
          setYearViewStart(y - (y % 12));
        }
      }
    } else {
      setSelectedYear(currentYear);
      setSelectedMonth('');
      setYearViewStart(currentYear - (currentYear % 12));
    }
  }, [value, isOpen]);

  const handleMonthSelect = (monthVal) => {
    const newVal = `${selectedYear}-${monthVal}`;
    onChange(newVal);
    setIsOpen(false);
  };

  const displayValue = value ? (() => {
    const [year, month] = value.split('-');
    const monthObj = months.find(m => m.value === month);
    return monthObj ? `${monthObj.label} ${year}` : value;
  })() : '';

  const handlePrev = (e) => {
    e.stopPropagation();
    if (isSelectingYear) {
      setYearViewStart(prev => prev - 12);
    } else {
      setSelectedYear(prev => prev - 1);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (isSelectingYear) {
      setYearViewStart(prev => prev + 12);
    } else {
      setSelectedYear(prev => prev + 1);
    }
  };

  return (
    <div className={`relative w-full ${isOpen ? 'z-30' : 'z-0'}`} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border ${isOpen ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'} rounded-xl flex justify-between items-center cursor-pointer hover:border-green-500 transition-all shadow-sm`}
      >
        <span className={displayValue ? 'text-gray-900 font-medium' : 'text-[#9CA3AF]'}>
          {displayValue || placeholder}
        </span>
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-[200] bg-white border border-gray-100 shadow-2xl rounded-2xl w-[290px] p-3 animate-in fade-in duration-150 zoom-in-95">
          {/* Header */}
          <div className="flex justify-between items-center px-2 py-1.5 mb-2.5 border-b border-gray-100">
            <button type="button" onClick={handlePrev} className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setIsSelectingYear(!isSelectingYear); }}
              className="text-gray-800 text-[15px] font-bold hover:text-green-600 transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-green-50"
            >
              {isSelectingYear ? `${yearViewStart} - ${yearViewStart + 11}` : selectedYear}
            </button>

            <button type="button" onClick={handleNext} className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Grid */}
          {isSelectingYear ? (
            <div className="grid grid-cols-4 gap-2 px-0.5 pb-1">
              {Array.from({ length: 12 }).map((_, i) => {
                const y = yearViewStart + i;
                const isSelected = selectedYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedYear(y);
                      setIsSelectingYear(false);
                    }}
                    className={`py-2 text-[13px] font-medium rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-green-600 text-white shadow-md font-bold' 
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 px-0.5 pb-1">
              {months.map(m => {
                const isSelected = selectedMonth === m.value && selectedYear === (value ? parseInt(value.split('-')[0]) : null);
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMonthSelect(m.value);
                    }}
                    className={`py-2.5 text-[13px] font-medium rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-green-600 text-white shadow-md font-bold'
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomMonthPicker;
