import React, { useState } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Track */}
      <div className="relative h-2 bg-navy rounded-full border border-ember/30">
        {/* Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-ember to-carmine rounded-full transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Glow effect */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-ember to-carmine rounded-full opacity-50 blur-sm transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      {/* Thumb */}
      <div
        className={`absolute top-1/2 w-6 h-6 bg-gradient-to-br from-ember to-carmine rounded-full border-2 border-softwhite transform -translate-y-1/2 transition-all duration-200 ${
          isDragging ? 'scale-125 shadow-ember' : 'hover:scale-110'
        }`}
        style={{ left: `calc(${percentage}% - 12px)` }}
      >
        <div className="absolute inset-1 bg-gradient-to-br from-softwhite to-ember rounded-full" />
      </div>
    </div>
  );
};