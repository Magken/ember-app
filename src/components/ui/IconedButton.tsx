import React, { useState, CSSProperties, useMemo } from 'react';

interface IconedButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const IconedButton: React.FC<IconedButtonProps> = ({
  icon,
  onClick,
  label,
  className = '',
  variant = 'primary',
  size = 'md',
}) => {
  const [hovered, setHovered] = useState(false);
  const [burst, setBurst] = useState(false);

  const handleClick = () => {
    setBurst(true);
    onClick?.();
    setTimeout(() => setBurst(false), 500);
  };

  // Reduced ember counts by 50%
  const emberCount = burst ? 30 : hovered ? 15 : 8;

  const sizeMap: Record<string, string> = {
    sm: 'w-10 h-10 p-2',
    md: 'w-12 h-12 p-3',
    lg: 'w-14 h-14 p-4',
  };

  const base = `
    relative inline-flex items-center justify-center
    rounded-full overflow-visible select-none
    transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-[var(--color-ember)]
    border-2 backdrop-filter backdrop-blur-sm
    
    before:content-[""] before:absolute before:inset-0 before:-z-10 before:rounded-full
    before:transition-all before:duration-300
    
    after:content-[""] after:absolute after:inset-0 after:-z-5 after:rounded-full
    after:transition-all after:duration-500
  `;

  const primary = `
    bg-gradient-to-br from-[rgba(11,29,58,0.9)] via-[rgba(31,59,115,0.8)] to-[rgba(44,24,16,0.7)]
    border-ember hover:border-carmine text-softwhite
    before:bg-[radial-gradient(circle_at_center,_rgba(255,140,0,0.4),_rgba(255,69,0,0.3),_transparent)]
    before:opacity-30 hover:before:opacity-80
    before:blur-md hover:before:blur-xl
    before:scale-100 hover:before:scale-130
    after:bg-[radial-gradient(circle_at_center,_rgba(255,191,0,0.5),_rgba(150,0,24,0.3),_transparent)]
    after:opacity-0 hover:after:opacity-50
    after:blur-xl after:scale-140
    hover:shadow-ember hover:brightness-110
  `;

  const ghost = `
    bg-transparent text-ember border-ember
    hover:bg-[rgba(255,191,0,0.2)] hover:text-softwhite hover:border-carmine
    before:bg-[radial-gradient(circle_at_center,_rgba(255,191,0,0.4),_rgba(255,140,0,0.2),_transparent)]
    before:opacity-0 hover:before:opacity-60
    before:blur-lg hover:before:blur-xl
    before:scale-100 hover:before:scale-120
    after:bg-[radial-gradient(circle_at_center,_rgba(255,140,0,0.3),_rgba(255,69,0,0.2),_transparent)]
    after:opacity-0 hover:after:opacity-40
    after:blur-md after:scale-110
    hover:shadow-glow
  `;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        ${base}
        ${sizeMap[size]}
        ${variant === 'primary' ? primary : ghost}
        ${className}
      `}
    >
      {[...Array(emberCount)].map((_, i) => {
        const edge = randInt(0, 3);
        const offset = (Math.random() - 0.5) * 30;
        let x = 0, y = 0;
        switch (edge) {
          case 0: x = Math.random() * 100; y = offset; break;
          case 1: x = 100 + offset; y = Math.random() * 100; break;
          case 2: x = Math.random() * 100; y = 100 + offset; break;
          default: x = offset; y = Math.random() * 100; break;
        }
        const angle = Math.random() * Math.PI * 2;
        const dist = burst ? 50 : hovered ? 30 : 20;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 5; // Slight upward drift
        const color = emberColors[i % emberColors.length];
        const delay = (Math.random() * 0.5).toFixed(2);
        const duration = (burst ? 0.8 : hovered ? 2 : 3) + Math.random() * (burst ? 0.5 : 1.5);

        return (
          <span
            key={i}
            className={`
              absolute w-[2px] h-[2px] ${color} rounded-full
              pointer-events-none mix-blend-screen animate-emberFromEdge
            `}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              filter: `brightness(${burst ? 3 : hovered ? 2.5 : 2}) blur(0.5px)`,
              boxShadow: `0 0 ${burst ? 3 : 2}px currentColor`
            } as CSSProperties}
          />
        );
      })}

      <span className={`relative z-10 transition-all duration-200 ${
        variant === 'ghost' && hovered ? 'drop-shadow-sm' : ''
      }`}>
        {icon}
      </span>
    </button>
  );
};