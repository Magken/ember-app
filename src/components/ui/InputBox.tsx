import React, { useState, useRef } from 'react';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}

const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];

export const InputBox: React.FC<InputBoxProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  type = 'text'
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stationary ember particles when focused (no movement)
  const emberCount = focused ? 50 : 0;

  return (
    <div className={`relative inline-block w-full ${className}`}>
      {/* Stationary ember particles */}
      {Array.from({ length: emberCount }).map((_, i) => {
        const edge = Math.floor(Math.random() * 4);
        const offset = (Math.random() - 0.5) * 100;
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
            className={`
              absolute w-[2px] h-[2px] ${color} rounded-sm
              pointer-events-none mix-blend-screen
            `}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              opacity: 0.6,
              filter: 'brightness(2) blur(0.5px)',
              boxShadow: '0 0 2px currentColor'
            }}
          />
        );
      })}

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