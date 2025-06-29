import React, { useState, useRef, useMemo } from 'react';
import { InternalEmbers } from './InternalEmbers';

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

  const componentId = useMemo(() => `input-${type}`, [type]);

  // Reduced ember configuration (80% reduction)
  const emberConfig = useMemo(() => ({
    count: focused ? 20 : 0,
    size: { min: 1, max: 2 },
    colors: ['255,191,0', '255,140,0', '255,69,0'],
    driftRange: { x: { min: -5, max: 5 }, y: { min: -10, max: -5 } },
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