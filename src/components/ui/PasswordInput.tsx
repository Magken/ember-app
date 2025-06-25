import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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

  return (
    <div className={`relative inline-block w-full ${className}`}>
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