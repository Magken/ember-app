import React, { useMemo } from 'react';
import { SeededRandom, generateSeed } from '../../lib/randomSeed';

interface SparkleConfig {
  count: number;
  size: { min: number; max: number };
  colors: string[];
  animationDuration: { min: number; max: number };
  delayRange: { min: number; max: number };
  positionRange: { x: { min: number; max: number }; y: { min: number; max: number } };
}

interface InternalSparklesProps {
  componentId: string;
  config: SparkleConfig;
  className?: string;
  enabled?: boolean;
}

export const InternalSparkles: React.FC<InternalSparklesProps> = ({
  componentId,
  config,
  className = '',
  enabled = true
}) => {
  const sparkles = useMemo(() => {
    if (!enabled) return [];
    
    const seed = generateSeed(componentId, config);
    const random = new SeededRandom(seed);
    
    return Array.from({ length: config.count }).map((_, i) => {
      const x = random.nextFloat(config.positionRange.x.min, config.positionRange.x.max);
      const y = random.nextFloat(config.positionRange.y.min, config.positionRange.y.max);
      const size = random.nextFloat(config.size.min, config.size.max);
      const delay = random.nextFloat(config.delayRange.min, config.delayRange.max);
      const duration = random.nextFloat(config.animationDuration.min, config.animationDuration.max);
      const color = random.pick(config.colors);
      
      return {
        id: `${componentId}-sparkle-${i}`,
        x: `${x}%`,
        y: `${y}%`,
        size: `${size}px`,
        delay: `${delay}s`,
        duration: `${duration}s`,
        color
      };
    });
  }, [componentId, config, enabled]);

  if (!enabled || sparkles.length === 0) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute animate-sparkle"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: sparkle.color,
            animationDelay: sparkle.delay,
            animationDuration: sparkle.duration,
          }}
        />
      ))}
    </div>
  );
};