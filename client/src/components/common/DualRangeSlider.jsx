import React, { useState, useEffect, useCallback, useRef } from 'react';

const DualRangeSlider = ({ min, max, step, minVal, maxVal, onChange, formatTooltip }) => {
  const [minValState, setMinValState] = useState(minVal);
  const [maxValState, setMaxValState] = useState(maxVal);
  const minValRef = useRef(minVal);
  const maxValRef = useRef(maxVal);
  const range = useRef(null);

  // Convert to percentage
  const getPercent = useCallback(
    (value) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  useEffect(() => {
    setMinValState(minVal);
    minValRef.current = minVal;
  }, [minVal]);

  useEffect(() => {
    setMaxValState(maxVal);
    maxValRef.current = maxVal;
  }, [maxVal]);

  // Set width of the range to decrease from the left side
  useEffect(() => {
    const minPercent = getPercent(minValState);
    const maxPercent = getPercent(maxValRef.current);

    if (range.current) {
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minValState, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    const minPercent = getPercent(minValRef.current);
    const maxPercent = getPercent(maxValState);

    if (range.current) {
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [maxValState, getPercent]);

  return (
    <div className="relative w-full flex items-center justify-center mt-12 mb-8">
      {/* Tooltip for Minimum */}
      <div 
        className="absolute z-50 bg-white border border-gray-200 shadow-sm text-xs font-bold px-2 py-1 rounded top-[-36px] transform -translate-x-1/2 text-gray-700 whitespace-nowrap"
        style={{ left: `${getPercent(minValState)}%` }}
      >
        {formatTooltip ? formatTooltip(minValState) : minValState}
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white drop-shadow-sm"></div>
      </div>

      {/* Tooltip for Maximum */}
      <div 
        className="absolute z-50 bg-white border border-gray-200 shadow-sm text-xs font-bold px-2 py-1 rounded top-[-36px] transform -translate-x-1/2 text-gray-700 whitespace-nowrap"
        style={{ left: `${getPercent(maxValState)}%` }}
      >
        {formatTooltip ? formatTooltip(maxValState) : maxValState}
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white drop-shadow-sm"></div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minValState}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), maxValState - step);
          setMinValState(value);
          minValRef.current = value;
          onChange(value, maxValState);
        }}
        className="absolute w-full h-0 z-30 pointer-events-none appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#29953f] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#29953f] [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxValState}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), minValState + step);
          setMaxValState(value);
          maxValRef.current = value;
          onChange(minValState, value);
        }}
        className="absolute w-full h-0 z-40 pointer-events-none appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#29953f] [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#29953f] [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
      />

      {/* Track */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full inset-0 shadow-inner overflow-hidden">
        <div ref={range} className="absolute h-full bg-[#29953f] rounded-full" />
      </div>
    </div>
  );
};

export default DualRangeSlider;
