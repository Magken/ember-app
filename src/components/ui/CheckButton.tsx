import React, { useState, useMemo } from 'react';

interface CheckButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];

export const CheckButton: React.FC<CheckButtonProps> = ({
  checked,
  onChange,
  label,
  className = ''
}) => {
  const [burst, setBurst] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  // Generate stationary flame licks along checkbox edges
  const flameLicks = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      left: `${15 + (i * 20) + Math.random() * 5}%`,
      top: `${Math.random() < 0.5 ? -3 : 103}%`,
      width: `${1.5 + Math.random() * 1}px`,
      height: `${3 + Math.random() * 2}px`,
      color: ['255,191,0', '255,140,0', '255,69,0'][Math.floor(Math.random() * 3)],
      opacity: Math.random() * 0.4 + 0.3
    }));
  }, []);
  
  // Stationary ember particles (no movement)
  const emberCount = burst ? 12 : hovered ? 6 : 0;

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
        {/* Stationary flame licks along edges */}
        {(hovered || burst) && flameLicks.map((flame, i) => (
          <div
            key={`flame-${i}`}
            className="absolute pointer-events-none z-5"
            style={{
              width: flame.width,
              height: flame.height,
              left: flame.left,
              top: flame.top,
              background: `linear-gradient(to top, rgb(${flame.color}), rgba(${flame.color}, 0.6), transparent)`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              filter: 'blur(0.5px)',
              mixBlendMode: 'screen',
              opacity: flame.opacity
            }}
          />
        ))}

        {/* Stationary ember particles */}
        {Array.from({ length: emberCount }).map((_, i) => {
          const edge = Math.floor(Math.random() * 4);
          const offset = (Math.random() - 0.5) * 25;
          let x = 0, y = 0;
          switch (edge) {
            case 0: x = Math.random() * 100; y = offset; break;
            case 1: x = 100 + offset; y = Math.random() * 100; break;
            case 2: x = Math.random() * 100; y = 100 + offset; break;
            default: x = offset; y = Math.random() * 100; break;
          }
          const color = emberColors[i % emberColors.length];

          return (
            <span
              key={i}
              className={`absolute w-[2px] h-[2px] ${color} rounded-full pointer-events-none mix-blend-screen`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                filter: `brightness(${burst ? 3 : 2}) blur(0.5px)`,
                boxShadow: `0 0 ${burst ? 3 : 2}px currentColor`,
                opacity: 0.6
              }}
            />
          );
        })}

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