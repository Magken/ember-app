import React, { useMemo, useState } from 'react';
import { InternalEmbers } from './InternalEmbers';
import { InternalFlameLicks } from './InternalFlameLicks';

interface FlameProps {
  /** Strength of the flame from 0 (dying) to 1 (blazing) */
  strength?: number;
  /** Size of the flame in pixels */
  size?: number;
  /** Whether the flame should pulse/flicker */
  animated?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when flame is clicked */
  onClick?: () => void;
  /** Whether the flame is interactive (hover effects) */
  interactive?: boolean;
}

const EMBER_COLORS = [
  '255,191,0',   // ember yellow
  '255,140,0',   // orange
  '150,0,24',    // carmine
  '153,101,21',  // amber
  '255,69,0',    // red-orange
];

const WEAK_COLORS = [
  '139,69,19',   // brown
  '105,105,105', // dim gray
  '128,128,128', // gray
];

export const Flame: React.FC<FlameProps> = ({
  strength = 0.7,
  size = 60,
  animated = true,
  className = '',
  onClick,
  interactive = true
}) => {
  const [hovered, setHovered] = useState(false);
  
  // Clamp strength between 0 and 1
  const clampedStrength = Math.max(0, Math.min(1, strength));
  
  // Calculate flame properties based on strength
  const isWeak = clampedStrength < 0.3;
  const isMedium = clampedStrength >= 0.3 && clampedStrength < 0.7;
  const isStrong = clampedStrength >= 0.7;
  
  // Dynamic properties based on strength
  const coreSize = size * (0.3 + clampedStrength * 0.7);
  const glowSize = size * (0.8 + clampedStrength * 1.2);
  
  // Generate component ID for seeded randomness
  const componentId = useMemo(() => `flame-${size}-${strength.toFixed(2)}`, [size, strength]);

  // Reduced ember configuration (50% reduction)
  const emberConfig = useMemo(() => ({
    count: Math.floor(clampedStrength * 20) + (hovered ? 5 : 0),
    size: { min: isWeak ? 0.5 : 1, max: isWeak ? 1.5 : 2.5 },
    colors: isWeak ? WEAK_COLORS : EMBER_COLORS,
    driftRange: { x: { min: -15, max: 15 }, y: { min: -25, max: -5 } },
    duration: { min: isWeak ? 2 : 1, max: isWeak ? 4 : 2.5 },
    delayRange: { min: 0, max: 2 }
  }), [clampedStrength, isWeak, hovered]);

  // Reduced flame lick configuration (33% reduction)
  const flameLickConfig = useMemo(() => ({
    count: isWeak ? 0 : Math.floor(clampedStrength * 8) + (hovered ? 4 : 0),
    size: { width: { min: 1, max: 2.5 }, height: { min: 3, max: 6 } },
    colors: EMBER_COLORS.slice(0, 3),
    duration: { min: 0.6, max: 1.2 },
    delayRange: { min: 0, max: 1 },
    positionRange: { x: { min: -20, max: 20 }, y: { min: -20, max: 20 } }
  }), [clampedStrength, isWeak, hovered]);

  // Color selection based on strength
  const primaryColor = isWeak ? '139,69,19' : isStrong ? '255,191,0' : '255,140,0';
  
  // Pulsing animation timing based on strength
  const pulseSpeed = isWeak ? '4s' : isMedium ? '2s' : '1s';
  const pulseIntensity = isWeak ? 0.3 : isMedium ? 0.6 : 1;

  return (
    <div
      className={`relative inline-block cursor-pointer transition-all duration-500 ${className}`}
      style={{ width: size * 2, height: size * 2 }}
      onClick={onClick}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
    >
      {/* Outer glow rings */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: glowSize * 2,
          height: glowSize * 2,
          background: `radial-gradient(circle, rgba(${primaryColor}, ${pulseIntensity * 0.3}) 0%, rgba(${primaryColor}, ${pulseIntensity * 0.1}) 40%, transparent 70%)`,
          filter: `blur(${isWeak ? 8 : 15}px)`,
          animation: animated ? `emberPulse ${pulseSpeed} ease-in-out infinite` : 'none',
          transform: `translate(-50%, -50%) scale(${hovered ? 1.3 : 1})`,
          transition: 'transform 0.5s ease-out'
        }}
      />

      {/* Middle glow */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle, rgba(${primaryColor}, ${pulseIntensity * 0.6}) 0%, rgba(${primaryColor}, ${pulseIntensity * 0.3}) 50%, transparent 80%)`,
          filter: `blur(${isWeak ? 4 : 8}px)`,
          animation: animated ? `emberPulse ${pulseSpeed} ease-in-out infinite reverse` : 'none',
          animationDelay: '0.5s',
          transform: `translate(-50%, -50%) scale(${hovered ? 1.2 : 1})`,
          transition: 'transform 0.3s ease-out'
        }}
      />

      {/* Core flame */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: coreSize,
          height: coreSize,
          background: isWeak 
            ? `radial-gradient(circle, rgba(${primaryColor}, 0.8) 0%, rgba(${primaryColor}, 0.4) 60%, transparent 90%)`
            : `radial-gradient(circle, rgba(255,255,255, 0.9) 0%, rgba(${primaryColor}, 1) 30%, rgba(${primaryColor}, 0.6) 70%, transparent 90%)`,
          filter: `blur(${isWeak ? 1 : 0.5}px)`,
          animation: animated ? `emberPulse ${pulseSpeed} ease-in-out infinite` : 'none',
          animationDelay: '0.25s',
          transform: `translate(-50%, -50%) scale(${hovered ? 1.4 : 1})`,
          transition: 'transform 0.3s ease-out',
          boxShadow: `0 0 ${isWeak ? 5 : 15}px rgba(${primaryColor}, ${pulseIntensity})`
        }}
      />

      {/* Internal ember system */}
      <InternalEmbers
        componentId={componentId}
        config={emberConfig}
        enabled={animated}
        className="z-10"
      />
      
      {/* Internal flame lick system */}
      <InternalFlameLicks
        componentId={componentId}
        config={flameLickConfig}
        enabled={animated && !isWeak}
        className="z-12"
      />

      {/* Central bright point for strong flames */}
      {isStrong && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 4,
            height: 4,
            background: 'rgba(255,255,255, 1)',
            filter: 'blur(0.5px)',
            animation: animated ? `emberPulse 0.5s ease-in-out infinite` : 'none',
            boxShadow: '0 0 8px rgba(255,255,255, 1)',
            transform: `translate(-50%, -50%) scale(${hovered ? 2 : 1})`,
            transition: 'transform 0.3s ease-out'
          }}
        />
      )}
    </div>
  );
};