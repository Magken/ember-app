// src/components/ui/DropdownButton.tsx
import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  CSSProperties,
} from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DropdownButtonProps {
  /** Initial placeholder (shown before any selection) */
  label: string;
  options: string[];
  onSelect: (option: string) => void;
  className?: string;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  label,
  options,
  onSelect,
  className = '',
}) => {
  const [open, setOpen]         = useState(false);
  const [hovered, setHovered]   = useState(false);
  const [burst, setBurst]       = useState(false);
  const [selected, setSelected] = useState<string>(label);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef      = useRef<HTMLDivElement>(null);

  // close on outside click (ignore inside)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // position menu
  useLayoutEffect(() => {
    if (open && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'absolute',
        top:    r.bottom + window.scrollY,
        left:   r.left   + window.scrollX,
        width:  r.width,
        zIndex: 9999,
      });
    }
  }, [open]);

  // burst on open toggle
  useEffect(() => {
    if (open) {
      setBurst(true);
      const t = setTimeout(() => setBurst(false), 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  const emberColors = ['bg-ember','bg-carmine','bg-deepblue','bg-softwhite'];
  const randInt     = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // continuous bursts when hovered, plus one‐off burst on open
  const emberCount = burst
    ? 40
    : hovered
      ? 20
      : 0;

  const toggleOpen = () => setOpen(o => !o);

  const handleSelect = (opt: string) => {
    setSelected(opt);
    setOpen(false);
    onSelect(opt);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`relative inline-block text-left ${className}`}
      >
        <button
          type="button"
          onClick={toggleOpen}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="
            group relative inline-flex items-center justify-between
            w-full px-4 py-2 font-body uppercase text-sm tracking-wide
            bg-[var(--color-navy)] text-softwhite
            border border-[var(--color-ember)] rounded-soft
            overflow-visible cursor-pointer transition-all duration-300
            hover:shadow-ember
          "
        >
          {/* Ember bursts */}
          {[...Array(emberCount)].map((_, i) => {
            const edge   = randInt(0, 3);
            const offset = (Math.random() - 0.5) * 20;
            let x = 0, y = 0;
            switch (edge) {
              case 0: x = Math.random() * 100; y = offset; break;
              case 1: x = 100 + offset; y = Math.random() * 100; break;
              case 2: x = Math.random() * 100; y = 100 + offset; break;
              default: x = offset; y = Math.random() * 100; break;
            }
            const angle    = Math.random() * Math.PI * 2;
            const dist     = 20 + Math.random() * 30;
            const tx       = Math.cos(angle) * dist;
            const ty       = Math.sin(angle) * dist;
            const color    = emberColors[i % emberColors.length];
            const delay    = (Math.random() * 0.3).toFixed(2);
            const duration = (0.4 + Math.random() * 0.4).toFixed(2);

            return (
              <span
                key={i}
                className={`
                  absolute w-[2px] h-[2px] ${color} rounded-sm
                  pointer-events-none animate-emberFromEdge mix-blend-screen
                `}
                style={{
                  left:              `${x}%`,
                  top:               `${y}%`,
                  animationDelay:    `${delay}s`,
                  animationDuration: `${duration}s`,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-out',
                  animationFillMode: 'forwards',
                  '--tx':            `${tx}px`,
                  '--ty':            `${ty}px`,
                } as CSSProperties}
              />
            );
          })}

          {/* Label */}
          <span className="relative z-10">{selected}</span>

          {/* Chevron */}
          {open
            ? <ChevronUp className="ml-2 w-4 h-4 relative z-10 text-[var(--color-ember)]" />
            : <ChevronDown className="ml-2 w-4 h-4 relative z-10 text-[var(--color-ember)]" />
          }
        </button>
      </div>

      {/* Menu portal */}
      {open && ReactDOM.createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="
            bg-[var(--color-navy)]
            border border-[var(--color-ember)]
            rounded-soft shadow-lg shadow-ember overflow-hidden
          "
        >
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(opt)}
              className="
                block w-full text-left px-4 py-2 font-body text-sm
                text-softwhite uppercase transition-all duration-200
                hover:bg-[var(--color-deep-blue)] hover:text-[var(--color-ember)]
              "
            >
              {opt}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};
