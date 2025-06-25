import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
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
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(label);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
        top: r.bottom + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        zIndex: 9999,
      });
    }
  }, [open]);

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
          className="
            group relative inline-flex items-center justify-between
            w-full px-4 py-2 font-body uppercase text-sm tracking-wide
            bg-[var(--color-navy)] text-softwhite
            border border-[var(--color-ember)] rounded-soft
            overflow-visible cursor-pointer transition-all duration-300
            hover:shadow-ember
          "
        >
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