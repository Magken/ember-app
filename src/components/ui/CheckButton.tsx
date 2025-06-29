import React, { useState, useMemo } from 'react';
import { InternalEmbers } from './InternalEmbers';
import { InternalFlameLicks } from './InternalFlameLicks';

interface CheckButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export const CheckButton: React.FC<CheckButtonProps> = ({
  checked,
  onChange,
  label,
  className = ''
}) => {
  const [burst, setBurst] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  const componentId = useMemo(() => `checkbox-${checked ? 'checked' : 'unchecked'}`, [checked]);
  
  // Reduced ember configuration (50% reduction)
  const emberConfig = useMemo(() => ({
    count: burst ? 10 : hovered ? 5 : 0,
    size: { min: 1, max: 2 },
    colors: ['255,191,0', '255,140,0', '255,69,0'],
    driftRange: { x: { min: -15, max: 15 }, y: { min: -20, max: -3 } },
    duration: { min: 0.8, max: 2 },
    delayRange: { min: 0, max: 0.4 }
  }), [burst, hovered]);

  // Reduced flame lick configuration (50% reduction)
  const flameLickConfig = useMemo(() => ({
    count: 3,
    size: { width: { min: 1, max: 1.5 }, height: { min: 2, max: 4 } },
    colors: ['255,191,0', '255,140,0', '255,69,0'],
    duration: { min: 0.5, max: 1 },
    delayRange: { min: 0, max: 1 },
    positionRange: { x: { min: 5, max: 95 }, y: { min: -5, max: 105 } }
  }), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
    setBurst(true);
    setTimeout(() => setBurst(false), 500);
  };

  return (
    <label 
      className={`inline-flex items-center gap-4 cursor-pointer group ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={handleChange}
      />

      <div
        className={`
          relative w-7 h-7
          rounded-soft
          border-2 border-ember
          flex items-center justify-center
          overflow-visible
          transition-all duration-300
          backdrop-filter backdrop-blur-sm
          hover:shadow-ember hover:border-carmine
          ${checked 
            ? 'bg-gradient-to-br from-ember via-carmine to-deepblue shadow-ember' 
            : 'bg-gradient-to-br from-[rgba(11,29,58,0.8)] to-[rgba(44,24,16,0.6)]'
          }
          
          before:content-[""] before:absolute before:inset-0 before:-z-10 before:rounded-soft
          before:transition-all before:duration-300
          before:bg-[radial-gradient(circle_at_center,_rgba(255,140,0,0.3),_transparent)]
          before:opacity-0 hover:before:opacity-50
          before:blur-lg before:scale-120
        `}
      >
        {/* Internal ember system */}
        <InternalEmbers
          componentId={componentId}
          config={emberConfig}
          enabled={emberConfig.count > 0}
          className="z-5"
        />
        
        {/* Internal flame lick system */}
        <InternalFlameLicks
          componentId={componentId}
          config={flameLickConfig}
          enabled={hovered || burst}
          className="z-5"
        />

        <div
          className={`
            w-full h-full
            rounded-soft
            flex items-center justify-center
            transition-all duration-300
            ${checked ? 'text-dark' : 'text-transparent'}
          `}
        >
          {checked && (
            <svg
              className="w-5 h-5 drop-shadow-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      <span className="select-none text-softwhite font-medium group-hover:text-ember transition-colors duration-300">
        {label}
      </span>
    </label>
  );
};