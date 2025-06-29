import React, { useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InternalEmbers } from './InternalEmbers';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const componentId = useMemo(() => `password-input`, []);

  // Reduced ember configuration (80% reduction)
  const emberConfig = useMemo(() => ({
    count: focused ? 20 : 0, // Reduced from 100 to 20
    size: { min: 1, max: 2 },
    colors: ['255,191,0', '255,140,0', '255,69,0'],
    driftRange: { x: { min: -10, max: 10 }, y: { min: -15, max: -5 } },
    duration: { min: 1, max: 2 },
    delayRange: { min: 0, max: 0.5 }
  }), [focused]);

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {/* Internal ember system */}
      <InternalEmbers
        componentId={componentId}
        config={emberConfig}
        enabled={focused}
        className="z-5"
      />

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