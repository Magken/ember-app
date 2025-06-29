import React, { useState, useMemo } from 'react';
import { InternalSparkles } from './InternalSparkles';
import { SparkleConfig, COLOR_PALETTES } from '../../lib/sparkleConfig';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
    setBurst(true);
    setTimeout(() => setBurst(false), 500);
  };

  // Generate unique toggle ID for consistent sparkles
  const toggleId = useMemo(() => 
    `toggle-${label?.slice(0, 10) || 'toggle'}-${checked}`, 
    [label, checked]
  );

  // Optimized sparkle configuration
  const sparkleConfig: SparkleConfig = useMemo(() => ({
    elementId: toggleId,
    sparkleCount: burst ? 10 : hovered ? 5 : 0, // Reduced from 20+
    animationDuration: burst ? 0.9 : 2.5,
    sizeRange: { min: 1.5, max: 2.5 },
    colorPalette: checked ? COLOR_PALETTES.ember : COLOR_PALETTES.blue,
    enabled: true,
    pattern: 'edge'
  }), [toggleId, burst, hovered, checked]);

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
        {/* Optimized sparkle system */}
        <InternalSparkles 
          config={sparkleConfig}
          isActive={true}
          intensity={burst ? 2 : 1}
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