import React, { useState, useRef } from 'react';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}

export const InputBox: React.FC<InputBoxProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  type = 'text'
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {/* Actual text input */}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="
          w-full
          px-4 py-2
          bg-[var(--color-navy)] text-softwhite placeholder:text-[var(--color-gray)]
          border border-[var(--color-ember)] rounded-soft
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[var(--color-ember)]
          hover:shadow-ember
        "
      />
    </div>
  );
};