import React, { useState } from 'react';

interface CheckButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export const CheckButton: React.FC<CheckButtonProps> = ({
  checked,
  onChange,
  label,
  className = ''
}) => {
  const [hovered, setHovered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <label 
      className={`inline-flex items-center gap-4 cursor-pointer group ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={handleChange}
      />

      <div
        className={`
          relative w-7 h-7
          rounded-soft
          border-2 border-ember
          flex items-center justify-center
          overflow-visible
          transition-all duration-300
          backdrop-filter backdrop-blur-sm
          hover:shadow-ember hover:border-carmine
          ${checked 
            ? 'bg-gradient-to-br from-ember via-carmine to-deepblue shadow-ember' 
            : 'bg-gradient-to-br from-[rgba(11,29,58,0.8)] to-[rgba(44,24,16,0.6)]'
          }
          
          before:content-[""] before:absolute before:inset-0 before:-z-10 before:rounded-soft
          before:transition-all before:duration-300
          before:bg-[radial-gradient(circle_at_center,_rgba(255,140,0,0.3),_transparent)]
          before:opacity-0 hover:before:opacity-50
          before:blur-lg before:scale-120
        `}
      >
        <div
          className={`
            w-full h-full
            rounded-soft
            flex items-center justify-center
            transition-all duration-300
            ${checked ? 'text-dark' : 'text-transparent'}
          `}
        >
          {checked && (
            <svg
              className="w-5 h-5 drop-shadow-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>

      <span className="select-none text-softwhite font-medium group-hover:text-ember transition-colors duration-300">
        {label}
      </span>
    </label>
  );
};