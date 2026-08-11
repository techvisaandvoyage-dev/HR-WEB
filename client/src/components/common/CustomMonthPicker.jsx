import React, { useState, useEffect } from 'react';

const CustomMonthPicker = ({ value, onChange, placeholder = "Select Month & Year" }) => {
  // value is expected to be in "YYYY-MM" format
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectingYear, setIsSelectingYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 80}, (_, i) => currentYear + 10 - i);

  const months = [
    { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
  ];

  useEffect(() => {
    if (value) {
      const [year, month] = value.split('-');
      if (year) setSelectedYear(parseInt(year, 10));
      if (month) setSelectedMonth(month);
    } else {
      setSelectedYear(new Date().getFullYear());
      setSelectedMonth('');
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

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={`w-full px-4 py-3 bg-white border ${isOpen ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'} rounded-xl flex justify-between items-center cursor-pointer hover:border-green-500 transition-all`}
      >
        <span className={displayValue ? 'text-gray-900 font-medium' : 'text-[#9CA3AF]'}>
          {displayValue || placeholder}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header: Year Selector */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-green-50/50">
              <button 
                type="button"
                onClick={() => setSelectedYear(y => y - 1)}
                className="p-2 text-green-700 hover:bg-white hover:shadow-sm rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                type="button"
                onClick={() => setIsSelectingYear(!isSelectingYear)}
                className="text-xl font-black text-green-800 tracking-wide hover:bg-green-100/80 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {selectedYear}
                <svg className={`w-4 h-4 text-green-700 transition-transform ${isSelectingYear ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <button 
                type="button"
                onClick={() => setSelectedYear(y => y + 1)}
                className="p-2 text-green-700 hover:bg-white hover:shadow-sm rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            
            {/* Body: Month or Year Grid */}
            {isSelectingYear ? (
              <div className="p-4 grid grid-cols-4 gap-2 h-[260px] overflow-y-auto custom-scrollbar">
                {years.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setSelectedYear(y);
                      setIsSelectingYear(false);
                    }}
                    className={`py-2 text-[14px] font-bold rounded-lg transition-all ${
                      selectedYear === y
                        ? 'bg-green-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-5 grid grid-cols-3 gap-x-3 gap-y-4">
                {months.map(m => {
                  const isSelected = selectedMonth === m.value && selectedYear === (value ? parseInt(value.split('-')[0]) : null);
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => handleMonthSelect(m.value)}
                      className={`py-3 text-[15px] font-bold rounded-xl transition-all duration-200 ${
                        isSelected
                          ? 'bg-green-600 text-white shadow-md shadow-green-200 scale-105'
                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700 hover:scale-105'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomMonthPicker;
