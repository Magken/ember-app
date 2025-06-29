import React, { useState, useMemo } from 'react';
import { InternalSparkles } from './InternalSparkles';
import { SparkleConfig, COLOR_PALETTES } from '../../lib/sparkleConfig';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

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

  const handleClick = () => {
    if (disabled) return;
    setBurst(true);
    onClick?.();
    setTimeout(() => setBurst(false), 400);
  };

  // Generate unique button ID for consistent sparkles
  const buttonId = useMemo(() => 
    `button-${variant}-${size}-${children?.toString().slice(0, 10) || 'btn'}`, 
    [variant, size, children]
  );

  // Optimized sparkle configuration
  const sparkleConfig: SparkleConfig = useMemo(() => ({
    elementId: buttonId,
    sparkleCount: burst ? 15 : isHovered ? 8 : 0, // Reduced from 60+
    animationDuration: burst ? 0.8 : 2,
    sizeRange: { min: 1.5, max: 3 },
    colorPalette: variant === 'primary' ? COLOR_PALETTES.ember : COLOR_PALETTES.carmine,
    enabled: true,
    pattern: 'edge'
  }), [buttonId, burst, isHovered, variant]);

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
      hover:before:animate-pulse
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
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Optimized sparkle system */}
      <InternalSparkles 
        config={sparkleConfig}
        isActive={!disabled}
        intensity={burst ? 2 : 1}
        className="z-5"
      />

      <span className="relative z-10">{children}</span>
    </button>
  );
};