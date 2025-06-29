import React, { useMemo } from 'react';
import { SeededRandom, generateSeed } from '../../lib/randomSeed';

interface EmberConfig {
  count: number;
  size: { min: number; max: number };
  colors: string[];
  driftRange: { x: { min: number; max: number }; y: { min: number; max: number } };
  duration: { min: number; max: number };
  delayRange: { min: number; max: number };
}

interface InternalEmbersProps {
  componentId: string;
  config: EmberConfig;
  className?: string;
  enabled?: boolean;
}

export const InternalEmbers: React.FC<InternalEmbersProps> = ({
  componentId,
  config,
  className = '',
  enabled = true
}) => {
  const embers = useMemo(() => {
    if (!enabled) return [];
    
    const seed = generateSeed(componentId, config);
    const random = new SeededRandom(seed);
    
    return Array.from({ length: config.count }).map((_, i) => {
      const x = random.nextFloat(0, 100);
      const y = random.nextFloat(0, 100);
      const size = random.nextFloat(config.size.min, config.size.max);
      const delay = random.nextFloat(config.delayRange.min, config.delayRange.max);
      const duration = random.nextFloat(config.duration.min, config.duration.max);
      const driftX = random.nextFloat(config.driftRange.x.min, config.driftRange.x.max);
      const driftY = random.nextFloat(config.driftRange.y.min, config.driftRange.y.max);
      const color = random.pick(config.colors);
      
      return {
        id: `${componentId}-ember-${i}`,
        x: `${x}%`,
        y: `${y}%`,
        size: `${size}px`,
        delay: `${delay}s`,
        duration: `${duration}s`,
        driftX: `${driftX}px`,
        driftY: `${driftY}px`,
        color
      };
    });
  }, [componentId, config, enabled]);

  if (!enabled || embers.length === 0) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {embers.map((ember) => (
        <div
          key={ember.id}
          className="absolute animate-ember rounded-full mix-blend-screen"
          style={{
            left: ember.x,
            top: ember.y,
            width: ember.size,
            height: ember.size,
            backgroundColor: `rgb(${ember.color})`,
            animationDelay: ember.delay,
            animationDuration: ember.duration,
            '--drift-x': ember.driftX,
            '--drift-y': ember.driftY,
            filter: 'blur(0.5px) brightness(2)',
            boxShadow: `0 0 2px rgb(${ember.color})`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};