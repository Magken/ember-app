import React, { useState, useMemo } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];

export const EmberButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [burst, setBurst] = useState(false);

  // Stationary ember particles (no movement)
  const emberCount = burst ? 20 : isHovered ? 12 : 8;

  // Generate stationary flame licks along button edges
  const flameLicks = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      left: `${15 + (i * 20) + Math.random() * 5}%`,
      top: `${Math.random() < 0.5 ? -2 : 102}%`,
      width: `${2 + Math.random() * 1}px`,
      height: `${4 + Math.random() * 2}px`,
      color: ['255,191,0', '255,140,0', '255,69,0'][Math.floor(Math.random() * 3)],
      opacity: Math.random() * 0.3 + 0.4
    }));
  }, []);

  const handleClick = () => {
    setBurst(true);
    onClick?.();
    setTimeout(() => setBurst(false), 400);
  };

  const baseClasses = `
    group relative inline-flex items-center justify-center
    font-body tracking-wide font-semibold text-white uppercase
    rounded-soft overflow-visible px-6 py-3
    transition-all duration-300 cursor-pointer z-10
    border-2 border-transparent
    backdrop-filter backdrop-blur-sm

    before:content-[""] before:absolute before:inset-0 before:-z-10 before:rounded-soft
    before:transition-all before:duration-300
    
    after:content-[""] after:absolute after:inset-0 after:-z-5 after:rounded-soft
    after:transition-all after:duration-500
  `;

  const variantMap: Record<string, string> = {
    primary: `
      bg-gradient-to-br from-[rgba(11,29,58,0.9)] via-[rgba(31,59,115,0.8)] to-[rgba(44,24,16,0.7)]
      border-ember hover:border-carmine
      before:bg-[radial-gradient(circle_at_center,_rgba(255,140,0,0.4),_rgba(255,69,0,0.3),_transparent)]
      before:opacity-40 hover:before:opacity-90
      before:blur-md hover:before:blur-xl
      before:scale-100 hover:before:scale-140
      after:bg-[radial-gradient(circle_at_center,_rgba(255,191,0,0.6),_rgba(150,0,24,0.4),_transparent)]
      after:opacity-0 hover:after:opacity-60
      after:blur-2xl after:scale-150
      hover:brightness-110 hover:shadow-ember
      hover:text-softwhite
    `,
    ghost: `
      bg-transparent text-ember border-ember
      before:bg-[radial-gradient(circle_at_center,_rgba(255,191,0,0.3),_transparent)]
      before:opacity-20 hover:before:opacity-50
      before:blur-lg hover:before:blur-xl
      before:scale-100 hover:before:scale-120
      after:bg-[linear-gradient(45deg,_rgba(255,140,0,0.2),_rgba(255,69,0,0.1))]
      after:opacity-0 hover:after:opacity-40
      hover:text-softwhite hover:shadow-glow hover:border-carmine
      hover:bg-[rgba(255,191,0,0.1)]
    `
  };

  const sizeMap: Record<string, string> = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4'
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Stationary flame licks along edges */}
      {(isHovered || burst) && flameLicks.map((flame, i) => (
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
        const offset = (Math.random() - 0.5) * 30;

        let x = 0, y = 0;
        switch (edge) {
          case 0: x = Math.random() * 100; y = 0 + offset; break;
          case 1: x = 100 + offset; y = Math.random() * 100; break;
          case 2: x = Math.random() * 100; y = 100 + offset; break;
          case 3: x = 0 + offset; y = Math.random() * 100; break;
        }

        const colorClass = emberColors[i % emberColors.length];
        const scaleFlicker = (0.7 + Math.random() * 0.6).toFixed(2);
        const opacityFlicker = (0.3 + Math.random() * 0.5).toFixed(2);

        return (
          <span
            key={i}
            className={`
              absolute w-[2px] h-[2px] ${colorClass} rounded-full pointer-events-none
              mix-blend-screen
            `}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              opacity: opacityFlicker,
              transform: `scale(${scaleFlicker})`,
              filter: `brightness(${burst ? 3 : isHovered ? 2.5 : 2}) blur(0.5px) drop-shadow(0 0 2px currentColor)`,
              boxShadow: `0 0 ${burst ? 4 : 2}px currentColor`
            }}
          />
        );
      })}
      <span className="relative z-10">{children}</span>
    </button>
  );
};