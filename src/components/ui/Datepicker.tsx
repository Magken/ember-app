import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatepickerProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  className?: string;
}

export const Datepicker: React.FC<DatepickerProps> = ({
  selectedDate,
  onSelect,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync viewDate
  const [viewDate, setViewDate] = useState<Date>(
    () => selectedDate || new Date()
  );
  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedDate]);

  // Outside click closes
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

  // Position portal
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
  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Ember particles
  const emberColors = ['bg-ember', 'bg-carmine', 'bg-deepblue', 'bg-softwhite'];

  // Stationary embers while open (no movement)
  const emberCount = open ? 15 : 0;

  // Build weeks
  const weeks = useMemo(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const arr: Date[][] = [];
    let week: Date[] = [];
    for (let i = 0; i < start.getDay(); i++) week.push(new Date(NaN));
    for (let d = 1; d <= end.getDate(); d++) {
      week.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
      if (week.length === 7) { arr.push(week); week = []; }
    }
    while (week.length < 7) week.push(new Date(NaN));
    arr.push(week);
    return arr;
  }, [viewDate]);

  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString()
    : 'Select Date';

  // Toggle button
  const button = (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
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
        {/* Stationary ember bursts */}
        {Array.from({ length: emberCount }).map((_, i) => {
          const edge = Math.floor(Math.random() * 4);
          const offset = (Math.random() - 0.5) * 20;
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
                opacity: 0.7,
                filter: 'brightness(2) blur(0.5px)',
                boxShadow: '0 0 2px currentColor'
              }}
            />
          );
        })}

        <span className="relative z-10">{displayLabel}</span>
        {open
          ? <ChevronUp className="ml-2 w-4 h-4 relative z-10 text-[var(--color-ember)]" />
          : <ChevronDown className="ml-2 w-4 h-4 relative z-10 text-[var(--color-ember)]" />
        }
      </button>
    </div>
  );

  // Calendar portal
  const menu = open && ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="
        bg-[var(--color-navy)]
        border border-[var(--color-ember)]
        rounded-soft shadow-lg shadow-ember overflow-visible
        p-6 min-w-[20rem]
      "
    >
      {/* Month header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <button onClick={prevMonth} className="p-2 hover:bg-[var(--color-deep-blue)] rounded-full">
          <ChevronLeft className="w-6 h-6 text-[var(--color-ember)]" />
        </button>
        <div className="font-body uppercase text-base text-softwhite">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-[var(--color-deep-blue)] rounded-full">
          <ChevronRight className="w-6 h-6 text-[var(--color-ember)]" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-4 text-center text-sm text-softwhite mb-4">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="font-body uppercase">{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-4 text-center">
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            const valid = !isNaN(day.getTime());
            const isSel = selectedDate && valid && day.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={`${wi}-${di}`}
                onClick={() => valid && onSelect(day)}
                disabled={!valid}
                className={`
                  relative py-3 rounded-soft transition-all duration-200
                  ${valid ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${isSel
                    ? 'bg-[var(--color-ember)] text-[var(--color-dark)]'
                    : 'text-softwhite hover:bg-[var(--color-deep-blue)] hover:text-[var(--color-ember)]'}
                `}
              >
                {valid && (
                  <span className="
                    absolute inset-0 rounded-soft
                    before:content-[''] before:absolute before:inset-0
                    before:rounded-soft
                    before:bg-[radial-gradient(circle_at_center,_theme(colors.ember),_transparent)]
                    before:opacity-0 hover:before:opacity-50 before:blur-sm hover:blur-lg
                    transition-all duration-300
                  " />
                )}
                <span className="relative z-10">{valid ? day.getDate() : ''}</span>
              </button>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {button}
      {menu}
    </>
  );
};