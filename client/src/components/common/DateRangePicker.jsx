import React, { useState, useEffect, useRef } from 'react';

const DateRangePicker = ({ dateRange, onRangeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (dateRange && !dateRange.start && !dateRange.end) {
      setStartDate(null);
      setEndDate(null);
    }
  }, [dateRange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday(0) to 6, and Monday(1) to 0
  };

  const getMonthData = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  const month1Days = getMonthData(currentDate);
  const month2Days = getMonthData(nextMonthDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1, d2) => d1 && d2 && d1.toDateString() === d2.toDateString();
  const isBefore = (d1, d2) => d1 && d2 && d1 < d2;
  const isAfter = (d1, d2) => d1 && d2 && d1 > d2;
  
  const isInRange = (day) => {
    if (!day || !startDate) return false;
    if (startDate && endDate) return isAfter(day, startDate) && isBefore(day, endDate);
    if (startDate && hoverDate && isAfter(hoverDate, startDate)) return isAfter(day, startDate) && isBefore(day, hoverDate);
    if (startDate && hoverDate && isBefore(hoverDate, startDate)) return isBefore(day, startDate) && isAfter(day, hoverDate);
    return false;
  };

  const handleDayClick = (day) => {
    if (!day) return;
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else {
      if (isBefore(day, startDate)) {
        setEndDate(startDate);
        setStartDate(day);
      } else {
        setEndDate(day);
      }
    }
  };

  const handleApply = () => {
    setIsOpen(false);
    if (onRangeChange) {
      onRangeChange({ 
        start: startDate ? startDate.toISOString().split('T')[0] : '', 
        end: endDate ? endDate.toISOString().split('T')[0] : '' 
      });
    }
  };

  const handleCancel = () => {
    setStartDate(null);
    setEndDate(null);
    setIsOpen(false);
    if (onRangeChange) {
      onRangeChange({ start: '', end: '' });
    }
  };

  const formatDate = (date) => date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const displayRange = startDate ? `${formatDate(startDate)}${endDate ? ' — ' + formatDate(endDate) : ''}` : 'Select Date';
  
  const diffDays = startDate && endDate ? Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : 0;

  const renderCalendar = (date, days) => (
    <div className="flex-1 w-[280px]">
      <div className="flex justify-center items-center mb-6 relative px-2">
        <span className="font-bold text-gray-800 text-sm">
          {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-y-2 mb-2">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-[13px] font-semibold text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} className="h-10"></div>;
          
          const isStart = isSameDay(day, startDate);
          const isEnd = isSameDay(day, endDate);
          const inRange = isInRange(day);
          
          let wrapperClass = "h-10 flex items-center justify-center relative cursor-pointer group";
          
          if (inRange) {
             wrapperClass += " bg-[#efeaff]";
          }
          if (isStart && (endDate || (hoverDate && isAfter(hoverDate, startDate)))) {
             wrapperClass += " bg-gradient-to-r from-transparent 50% to-[#efeaff] 50%";
          }
          if (isStart && hoverDate && isBefore(hoverDate, startDate) && !endDate) {
             wrapperClass += " bg-gradient-to-l from-transparent 50% to-[#efeaff] 50%";
          }
          if (isEnd) {
             wrapperClass += " bg-gradient-to-l from-transparent 50% to-[#efeaff] 50%";
          }

          let innerClass = "w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium z-10 transition-colors";
          
          if (isStart || isEnd) {
            innerClass += " bg-[#4f46e5] text-white shadow-sm";
          } else if (inRange) {
            innerClass += " text-gray-800";
          } else {
            innerClass += " text-gray-700 hover:bg-gray-100";
          }

          return (
            <div 
              key={i} 
              className={wrapperClass}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => setHoverDate(day)}
              onMouseLeave={() => setHoverDate(null)}
            >
              <div className={innerClass}>{day.getDate()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center bg-[#FDFDFD] border border-[#ECECEC] rounded-xl px-4 hover:border-[#D1D1D1] transition-colors h-[42px] min-w-[200px] w-full outline-none focus-within:border-[#999999] focus-within:ring-1 focus-within:ring-[#999999]"
      >
        <span className="text-[12px] font-bold text-[#666666] tracking-wider uppercase mr-3 shrink-0">Date</span>
        <span className="text-[14px] font-semibold text-[#111111] truncate flex-1 text-left">{displayRange}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#888888] ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2}/>
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2}/>
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2}/>
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2}/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-6 min-w-max animate-in fade-in slide-in-from-top-2 duration-200">
          
          <div className="flex gap-8 mb-6 relative">
            <button onClick={handlePrevMonth} className="absolute left-0 top-0 p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={handleNextMonth} className="absolute right-0 top-0 p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            
            {renderCalendar(currentDate, month1Days)}
            {renderCalendar(nextMonthDate, month2Days)}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-600">
              {diffDays > 0 ? `${diffDays} days` : ''}
            </span>
            <div className="flex gap-3">
              <button 
                onClick={handleCancel}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApply}
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
