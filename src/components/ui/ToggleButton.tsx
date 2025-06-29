import React, { useState, useMemo } from 'react';

interface ToggleButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  checked,
  onChange,
  label,
  className = ''
}) => {
  const [burst, setBurst] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  // Generate flame licks along toggle edges
  const flameLicks = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      left: `${8 + (i * 10) + Math.random() * 5}%`,
      top: `${Math.random() < 0.5 ? -3 : 103}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${0.5 + Math.random() * 0.4}s`,
      width: `${1.5 + Math.random() * 1.5}px`,
      height: `${3 + Math.random() * 2}px`,
      color: ['255,191,0', '255,140,0', '255,69,0'][Math.floor(Math.random() * 3)]
    }));
  }, []);
  
  // Reduced ember counts by 50%
  const emberCount = burst ? 20 : hovered ? 10 : 0;

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
        {/* Flame licks along edges */}
        {(hovered || burst) && flameLicks.map((flame, i) => (
          <div
            key={`flame-${i}`}
            className="absolute pointer-events-none z-5 flame-lick"
            style={{
              width: flame.width,
              height: flame.height,
              left: flame.left,
              top: flame.top,
              background: `linear-gradient(to top, rgb(${flame.color}), rgba(${flame.color}, 0.6), transparent)`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              animationDelay: flame.delay,
              animationDuration: flame.duration,
              filter: 'blur(0.5px)',
              mixBlendMode: 'screen'
            } as React.CSSProperties}
          />
        ))}

        {[...Array(emberCount)].map((_, i) => {
          const edge = Math.floor(Math.random() * 4);
          const offset = (Math.random() - 0.5) * 25;
          let x = 0, y = 0;
          switch (edge) {
            case 0: x = Math.random() * 100; y = offset; break;
            case 1: x = 100 + offset; y = Math.random() * 100; break;
            case 2: x = Math.random() * 100; y = 100 + offset; break;
            default: x = offset; y = Math.random() * 100; break;
          }
          const angle = Math.random() * Math.PI * 2;
          const dist = burst ? 35 : 20;
          const tx = Math.cos(angle) * dist;
          const ty = Math.sin(angle) * dist - 3; // Slight upward drift
          const color = emberColors[i % emberColors.length];
          const delay = (Math.random() * 0.3).toFixed(2);
          const duration = (burst ? 0.9 : 2.5) + Math.random() * 0.8;

          return (
            <span
              key={i}
              className={`
                absolute w-[2px] h-[2px] ${color} rounded-full
                pointer-events-none animate-emberFromEdge mix-blend-screen
              `}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                animationTimingFunction: 'ease-out',
                animationIterationCount: '1',
                animationFillMode: 'forwards',
                '--tx': `${tx}px`,
                '--ty': `${ty}px`,
                filter: `brightness(${burst ? 3 : 2}) blur(0.5px)`,
                boxShadow: `0 0 ${burst ? 3 : 2}px currentColor`
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {label && (
        <span className="select-none text-softwhite font-medium group-hover:text-ember transition-colors duration-300">
          {label}
        </span>
      )}
    </label>
  );
};