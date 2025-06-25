import React, { useState } from 'react';

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

  const handleClick = () => {
    onClick?.();
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
      <span className="relative z-10">{children}</span>
    </button>
  );
};