import React, { useMemo, useState } from 'react';

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

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const rand = (a: number, b: number) => Math.random() * (b - a) + a;
const randColor = (colors: string[]) =>
  colors[randInt(0, colors.length - 1)];

export const Flame: React.FC<FlameProps> = ({
  strength = 0.7,
  size = 60,
  animated = false, // Default to false for stationary flames
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
  const particleCount = Math.floor(clampedStrength * 20) + (hovered ? 10 : 0);
  const twinkleCount = Math.floor(clampedStrength * 8) + (hovered ? 5 : 0);
  const flameCount = Math.floor(clampedStrength * 6) + (hovered ? 4 : 0);
  
  // Color selection based on strength
  const colorPalette = isWeak ? WEAK_COLORS : EMBER_COLORS;
  const primaryColor = isWeak ? '139,69,19' : isStrong ? '255,191,0' : '255,140,0';
  
  // Generate stationary ember particles in radial pattern
  const emberParticles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      // Create perfect radial distribution
      const angleStep = (Math.PI * 2) / particleCount;
      const baseAngle = angleStep * i;
      const angleVariation = rand(-0.2, 0.2); // Small random variation
      const angle = baseAngle + angleVariation;
      
      // Distance varies based on strength and adds some randomness
      const baseDistance = size * (0.6 + clampedStrength * 0.8);
      const distanceVariation = rand(0.7, 1.3);
      const distance = baseDistance * distanceVariation;
      
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      return {
        x,
        y,
        angle,
        size: rand(isWeak ? 0.5 : 1, isWeak ? 1.5 : 3),
        color: randColor(colorPalette),
        intensity: rand(isWeak ? 0.3 : 0.8, isWeak ? 0.6 : 1.5),
        opacity: rand(0.4, 0.9)
      };
    });
  }, [particleCount, size, isWeak, colorPalette, clampedStrength]);

  // Generate stationary twinkling stars in radial pattern around the flame
  const twinkles = useMemo(() => {
    return Array.from({ length: twinkleCount }).map((_, i) => {
      // Radial distribution for twinkles
      const angleStep = (Math.PI * 2) / twinkleCount;
      const baseAngle = angleStep * i;
      const angleVariation = rand(-0.3, 0.3);
      const angle = baseAngle + angleVariation;
      
      const distance = rand(size * 1.2, size * 2.5);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      return {
        x,
        y,
        size: rand(1, 2),
        intensity: rand(0.6, 1.2),
        opacity: rand(0.3, 0.8)
      };
    });
  }, [twinkleCount, size]);

  // Generate stationary flame licks radiating outward from center for strong flames
  const flameLicks = useMemo(() => {
    if (isWeak) return [];
    
    return Array.from({ length: flameCount }).map((_, i) => {
      // Perfect radial distribution for flame licks
      const angleStep = (Math.PI * 2) / flameCount;
      const baseAngle = angleStep * i;
      const angleVariation = rand(-0.15, 0.15);
      const angle = baseAngle + angleVariation;
      
      // Flame licks start closer to center and extend outward
      const distance = rand(size * 0.2, size * 0.5);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      return {
        x,
        y,
        angle,
        width: rand(2, isStrong ? 6 : 4),
        height: rand(6, isStrong ? 15 : 10),
        color: randColor(EMBER_COLORS.slice(0, 3)),
        intensity: rand(0.8, isStrong ? 2 : 1.3),
        opacity: rand(0.5, 0.9)
      };
    });
  }, [flameCount, size, isWeak, isStrong]);

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
          background: `radial-gradient(circle, rgba(${primaryColor}, 0.3) 0%, rgba(${primaryColor}, 0.1) 40%, transparent 70%)`,
          filter: `blur(${isWeak ? 8 : 15}px)`,
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
          background: `radial-gradient(circle, rgba(${primaryColor}, 0.6) 0%, rgba(${primaryColor}, 0.3) 50%, transparent 80%)`,
          filter: `blur(${isWeak ? 4 : 8}px)`,
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
          transform: `translate(-50%, -50%) scale(${hovered ? 1.4 : 1})`,
          transition: 'transform 0.3s ease-out',
          boxShadow: `0 0 ${isWeak ? 5 : 15}px rgba(${primaryColor}, 0.8)`
        }}
      />

      {/* Stationary flame licks - all upright, positioned radially around center */}
      {!isWeak && flameLicks.map((flame, i) => (
        <div
          key={`flame-${i}`}
          className="absolute pointer-events-none"
          style={{
            width: flame.width,
            height: flame.height,
            left: `calc(50% + ${flame.x}px)`,
            top: `calc(50% + ${flame.y}px)`,
            background: `linear-gradient(to top, rgba(${flame.color}, ${flame.intensity}), rgba(${flame.color}, ${flame.intensity * 0.6}), transparent)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            filter: 'blur(0.5px)',
            mixBlendMode: 'screen',
            // Keep flames upright - no rotation
            transform: `translate(-50%, -50%) scale(${hovered ? 1.2 : 1})`,
            transformOrigin: 'center bottom',
            transition: 'transform 0.3s ease-out',
            opacity: flame.opacity
          }}
        />
      ))}

      {/* Stationary ember particles radiating outward in perfect radial pattern */}
      {emberParticles.map((ember, i) => (
        <span
          key={`ember-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: ember.size,
            height: ember.size,
            backgroundColor: `rgba(${ember.color}, ${ember.intensity})`,
            left: `calc(50% + ${ember.x}px)`,
            top: `calc(50% + ${ember.y}px)`,
            filter: `blur(0.5px) brightness(${ember.intensity})`,
            boxShadow: `0 0 ${ember.size * 2}px rgba(${ember.color}, ${ember.intensity * 0.8})`,
            mixBlendMode: 'screen',
            transform: `translate(-50%, -50%) scale(${hovered ? 1.3 : 1})`,
            transition: 'transform 0.3s ease-out',
            opacity: ember.opacity
          }}
        />
      ))}

      {/* Stationary twinkling stars in radial pattern */}
      {twinkles.map((twinkle, i) => (
        <span
          key={`twinkle-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: twinkle.size,
            height: twinkle.size,
            backgroundColor: `rgba(255,255,255, ${twinkle.intensity})`,
            left: `calc(50% + ${twinkle.x}px)`,
            top: `calc(50% + ${twinkle.y}px)`,
            filter: 'blur(0.5px)',
            boxShadow: `0 0 ${twinkle.size * 3}px rgba(255,255,255, ${twinkle.intensity})`,
            mixBlendMode: 'screen',
            transform: `translate(-50%, -50%) scale(${hovered ? 1.2 : 1})`,
            transition: 'transform 0.3s ease-out',
            opacity: twinkle.opacity
          }}
        />
      ))}

      {/* Central bright point for strong flames */}
      {isStrong && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 4,
            height: 4,
            background: 'rgba(255,255,255, 1)',
            filter: 'blur(0.5px)',
            boxShadow: '0 0 8px rgba(255,255,255, 1)',
            transform: `translate(-50%, -50%) scale(${hovered ? 2 : 1})`,
            transition: 'transform 0.3s ease-out'
          }}
        />
      )}
    </div>
  );
};