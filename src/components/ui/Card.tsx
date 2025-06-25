// BurningPaperCard.tsx
import React, { useMemo } from 'react';

interface CardProps {
  children: React.ReactNode;
  glowOnHover?: boolean;
  className?: string;
}

const EMBER_COLORS = [
  '255,191,0',   // ember yellow
  '255,140,0',   // orange
  '150,0,24',    // carmine
  '153,101,21',  // amber
  '255,69,0',    // red-orange
];

const ASH_COLORS = [
  '169,169,169', // dark gray
  '128,128,128', // gray
  '105,105,105', // dim gray
  '192,192,192', // silver
];

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const rand = (a: number, b: number) => Math.random() * (b - a) + a;
const randColor = (colors: string[]) =>
  colors[randInt(0, colors.length - 1)];

export const BurningPaperCard: React.FC<CardProps> = ({
  children,
  glowOnHover = false,
  className = ''
}) => {
  // More controlled jagged clip-path with limited x-direction cuts
  const { clipPath } = useMemo(() => {
    // Limit x-direction cuts to max 15px (1.5% of 100% width for typical card sizes)
    const maxXCut = 1.5;
    
    const corners = [
      { x: rand(-maxXCut, maxXCut), y: rand(-8, 8) },
      { x: rand(100 - maxXCut, 100 + maxXCut), y: rand(-8, 8) },
      { x: rand(100 - maxXCut, 100 + maxXCut), y: rand(92, 108) },
      { x: rand(-maxXCut, maxXCut), y: rand(92, 108) }
    ];
    
    // More irregular mid-points for burned edges but limited x-cuts
    const mids = [
      { x: rand(20, 80), y: rand(-12, 5) },
      { x: rand(100 - maxXCut, 100 + maxXCut), y: rand(20, 80) },
      { x: rand(20, 80), y: rand(95, 112) },
      { x: rand(-maxXCut, maxXCut), y: rand(20, 80) }
    ];
    
    // Additional points for more irregular burning with controlled x-cuts
    const extras = [
      { x: rand(10, 30), y: rand(-6, 3) },
      { x: rand(70, 90), y: rand(-6, 3) },
      { x: rand(100 - maxXCut, 100 + maxXCut), y: rand(10, 30) },
      { x: rand(100 - maxXCut, 100 + maxXCut), y: rand(70, 90) },
      { x: rand(70, 90), y: rand(97, 106) },
      { x: rand(10, 30), y: rand(97, 106) },
      { x: rand(-maxXCut, maxXCut), y: rand(70, 90) },
      { x: rand(-maxXCut, maxXCut), y: rand(10, 30) }
    ];
    
    const pts = [
      corners[0], extras[0], mids[0], extras[1],
      corners[1], extras[2], mids[1], extras[3],
      corners[2], extras[4], mids[2], extras[5],
      corners[3], extras[6], mids[3], extras[7]
    ];
    
    return {
      clipPath: `polygon(${pts.map(p => `${p.x}% ${p.y}%`).join(', ')})`,
    };
  }, []);

  return (
    <div className={`relative overflow-visible ${className}`}>
      {/* Charred paper background with burn progression - NO ANIMATIONS */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          clipPath,
          WebkitClipPath: clipPath,
          background: `
            linear-gradient(45deg, 
              rgba(44, 24, 16, 0.9) 0%,
              rgba(139, 69, 19, 0.8) 25%,
              rgba(101, 67, 33, 0.7) 50%,
              rgba(160, 82, 45, 0.6) 75%,
              rgba(210, 180, 140, 0.4) 100%
            ),
            radial-gradient(circle at 30% 70%, rgba(255, 140, 0, 0.3), transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(255, 69, 0, 0.2), transparent 50%)
          `,
          backgroundSize: '200% 200%, 100% 100%, 100% 100%',
          filter: 'contrast(1.1) brightness(0.9)',
          mixBlendMode: 'multiply'
        }}
      />

      {/* Static ember glow behind edges - NO ANIMATIONS */}
      <div
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          clipPath,
          WebkitClipPath: clipPath,
          background: 'radial-gradient(closest-side, rgba(255,140,0,0.4), rgba(255,69,0,0.2) 40%, transparent 70%)',
          filter: 'blur(12px)',
          mixBlendMode: 'screen'
        }}
      />

      {/* Card content container with charred edges and static glow - NO ANIMATIONS */}
      <div
        className={`relative z-20 p-8 transition-all duration-500 overflow-visible ${
          glowOnHover ? 'hover:shadow-charred' : ''
        }`}
        style={{
          clipPath,
          WebkitClipPath: clipPath,
          background: `
            linear-gradient(135deg, 
              rgba(11, 29, 58, 0.95) 0%,
              rgba(31, 59, 115, 0.9) 30%,
              rgba(44, 24, 16, 0.8) 70%,
              rgba(139, 69, 19, 0.7) 100%
            )
          `,
          backdropFilter: 'blur(1px)',
          border: '1px solid rgba(255, 140, 0, 0.3)',
          boxShadow: `
            inset 0 0 20px rgba(139, 69, 19, 0.6),
            inset 0 0 40px rgba(44, 24, 16, 0.4),
            0 0 15px rgba(255, 140, 0, 0.3)
          `,
        }}
      >
        {children}
      </div>
    </div>
  );
};