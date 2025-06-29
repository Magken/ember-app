import React, { useMemo } from 'react';
import { SeededRandom } from '../../lib/seededRandom';
import { SparkleConfig } from '../../lib/sparkleConfig';

interface InternalSparklesProps {
  config: SparkleConfig;
  className?: string;
  isActive?: boolean;
  intensity?: number; // 0-1 multiplier for sparkle count
}

export const InternalSparkles: React.FC<InternalSparklesProps> = ({
  config,
  className = '',
  isActive = true,
  intensity = 1
}) => {
  // Generate consistent sparkles using seeded random
  const sparkles = useMemo(() => {
    if (!config.enabled || !isActive) return [];
    
    const seededRandom = new SeededRandom(config.elementId.charCodeAt(0));
    const adjustedCount = Math.floor(config.sparkleCount * intensity);
    
    return Array.from({ length: adjustedCount }, (_, i) => {
      let position;
      
      // Generate position based on pattern
      switch (config.pattern) {
        case 'radial':
          position = seededRandom.getRadialPosition(i, config.elementId, config.radius || 50);
          break;
        case 'edge':
          // Generate positions along edges
          const edge = seededRandom.randInt(0, 3);
          const offset = seededRandom.randFloat(-30, 30);
          switch (edge) {
            case 0: position = { x: seededRandom.randFloat(-100, 100), y: offset }; break;
            case 1: position = { x: 100 + offset, y: seededRandom.randFloat(-100, 100) }; break;
            case 2: position = { x: seededRandom.randFloat(-100, 100), y: 100 + offset }; break;
            default: position = { x: offset, y: seededRandom.randFloat(-100, 100) }; break;
          }
          break;
        default:
          position = seededRandom.getPosition(i, config.elementId);
      }
      
      const size = seededRandom.randFloat(config.sizeRange.min, config.sizeRange.max);
      const color = seededRandom.pickRandom(config.colorPalette);
      const delay = seededRandom.randFloat(0, 2);
      const duration = config.animationDuration + seededRandom.randFloat(-0.5, 0.5);
      
      return {
        id: `${config.elementId}-sparkle-${i}`,
        x: position.x,
        y: position.y,
        size,
        color,
        delay,
        duration,
        intensity: seededRandom.randFloat(0.6, 1.2)
      };
    });
  }, [config.elementId, config.sparkleCount, config.enabled, isActive, intensity, config.pattern, config.radius]);

  if (!config.enabled || sparkles.length === 0) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="absolute rounded-full animate-internal-sparkle"
          style={{
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: `rgba(${sparkle.color}, ${sparkle.intensity})`,
            left: `calc(50% + ${sparkle.x}px)`,
            top: `calc(50% + ${sparkle.y}px)`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`,
            filter: 'blur(0.5px)',
            boxShadow: `0 0 ${sparkle.size * 2}px rgba(${sparkle.color}, ${sparkle.intensity * 0.8})`,
            mixBlendMode: 'screen',
            transform: 'translate(-50%, -50%)',
            willChange: 'transform, opacity'
          }}
        />
      ))}
    </div>
  );
};