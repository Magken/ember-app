import React, { useMemo } from 'react';
import { SeededRandom, generateSeed } from '../../lib/randomSeed';

interface FlameLickConfig {
  count: number;
  size: { width: { min: number; max: number }; height: { min: number; max: number } };
  colors: string[];
  duration: { min: number; max: number };
  delayRange: { min: number; max: number };
  positionRange: { x: { min: number; max: number }; y: { min: number; max: number } };
}

interface InternalFlameLicksProps {
  componentId: string;
  config: FlameLickConfig;
  className?: string;
  enabled?: boolean;
}

export const InternalFlameLicks: React.FC<InternalFlameLicksProps> = ({
  componentId,
  config,
  className = '',
  enabled = true
}) => {
  const flameLicks = useMemo(() => {
    if (!enabled) return [];
    
    const seed = generateSeed(componentId, config);
    const random = new SeededRandom(seed);
    
    return Array.from({ length: config.count }).map((_, i) => {
      const x = random.nextFloat(config.positionRange.x.min, config.positionRange.x.max);
      const y = random.nextFloat(config.positionRange.y.min, config.positionRange.y.max);
      const width = random.nextFloat(config.size.width.min, config.size.width.max);
      const height = random.nextFloat(config.size.height.min, config.size.height.max);
      const delay = random.nextFloat(config.delayRange.min, config.delayRange.max);
      const duration = random.nextFloat(config.duration.min, config.duration.max);
      const color = random.pick(config.colors);
      
      return {
        id: `${componentId}-flame-${i}`,
        x: `${x}%`,
        y: `${y}%`,
        width: `${width}px`,
        height: `${height}px`,
        delay: `${delay}s`,
        duration: `${duration}s`,
        color
      };
    });
  }, [componentId, config, enabled]);

  if (!enabled || flameLicks.length === 0) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {flameLicks.map((flame) => (
        <div
          key={flame.id}
          className="absolute animate-flameLick"
          style={{
            left: flame.x,
            top: flame.y,
            width: flame.width,
            height: flame.height,
            background: `linear-gradient(to top, rgb(${flame.color}), rgba(${flame.color}, 0.6), transparent)`,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            animationDelay: flame.delay,
            animationDuration: flame.duration,
            filter: 'blur(0.5px)',
            mixBlendMode: 'screen'
          }}
        />
      ))}
    </div>
  );
};