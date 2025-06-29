import React, { useState, useMemo } from 'react';
import { InternalEmbers } from './InternalEmbers';
import { InternalFlameLicks } from './InternalFlameLicks';

interface ToggleButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  checked,
  onChange,
  label,
  className = ''
}) => {
  const [burst, setBurst] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  const componentId = useMemo(() => `toggle-${checked ? 'on' : 'off'}`, [checked]);
  
  // Reduced ember configuration (50% reduction)
  const emberConfig = useMemo(() => ({
    count: burst ? 10 : hovered ? 5 : 0,
    size: { min: 1, max: 2 },
    colors: ['255,191,0', '255,140,0', '255,69,0'],
    driftRange: { x: { min: -15, max: 15 }, y: { min: -20, max: -3 } },
    duration: { min: 0.9, max: 2.5 },
    delayRange: { min: 0, max: 0.3 }
  }), [burst, hovered]);

  // Reduced flame lick configuration (50% reduction)
  const flameLickConfig = useMemo(() => ({
    count: 4,
    size: { width: { min: 1, max: 2 }, height: { min: 2, max: 4 } },
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
        className="sr-only peer"
        checked={checked}
        onChange={handleChange}
      />

      <div className={`
        relative w-16 h-9 rounded-full transition-all duration-300
        backdrop-filter backdrop-blur-sm border-2 border-ember
        hover:shadow-ember hover:border-carmine overflow-visible
        ${checked 
          ? 'bg-gradient-to-r from-carmine via-ember to-deepblue' 
          : 'bg-gradient-to-r from-[rgba(11,29,58,0.8)] to-[rgba(44,24,16,0.6)]'
        }
        
        before:content-[''] before:absolute before:left-1 before:top-1
        before:w-7 before:h-7 before:rounded-full 
        before:bg-gradient-to-br before:from-softwhite before:to-ash
        before:transition-all before:duration-300 before:shadow-lg
        before:border before:border-ember/30
        peer-checked:before:translate-x-7
        ${checked ? 'before:shadow-ember' : 'before:shadow-md'}
        
        after:content-[""] after:absolute after:inset-0 after:-z-10 after:rounded-full
        after:transition-all after:duration-300
        after:bg-[radial-gradient(circle_at_center,_rgba(255,140,0,0.3),_transparent)]
        after:opacity-0 hover:after:opacity-50
        after:blur-lg after:scale-120
      `}>
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
      </div>

      {label && (
        <span className="select-none text-softwhite font-medium group-hover:text-ember transition-colors duration-300">
          {label}
        </span>
      )}
    </label>
  );
};