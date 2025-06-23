import React, { useState, CSSProperties } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // When focused, we show a constant stream of embers
  const emberCount = focused ? 100 : 0;

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {/* Continuous ember particles */}
      {[...Array(emberCount)].map((_, i) => {
        const edge   = randInt(0, 3);
        const offset = (Math.random() - 0.5) * 100;
        let x = 0, y = 0;
        switch (edge) {
          case 0: x = Math.random() * 100; y = offset; break;
          case 1: x = 100 + offset;       y = Math.random() * 100; break;
          case 2: x = Math.random() * 100; y = 100 + offset;       break;
          default: x = offset;            y = Math.random() * 100; break;
        }
        const angle    = Math.random() * Math.PI * 2;
        const dist     = 10 + Math.random() * 10;
        const tx       = Math.cos(angle) * dist;
        const ty       = Math.sin(angle) * dist;
        const color    = emberColors[i % emberColors.length];
        const delay    = (Math.random() * 0.5).toFixed(2);
        const duration = (1 + Math.random() * 1).toFixed(2);

        return (
          <span
            key={i}
            className={`
              absolute w-[2px] h-[2px] ${color} rounded-sm
              pointer-events-none mix-blend-screen
            `}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationName: 'emberFromEdge',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
            } as CSSProperties}
          />
        );
      })}

      {/* Input container */}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="
            w-full
            px-4 py-2 pr-12
            bg-[var(--color-navy)] text-softwhite placeholder:text-[var(--color-gray)]
            border border-[var(--color-ember)] rounded-soft
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--color-ember)]
            hover:shadow-ember
          "
        />
        
        {/* Toggle visibility button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="
            absolute right-3 top-1/2 transform -translate-y-1/2
            text-[var(--color-gray)] hover:text-[var(--color-ember)]
            transition-colors duration-200
            focus:outline-none
          "
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};