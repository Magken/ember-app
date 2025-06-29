# Sparkle/Ember Performance Optimization Instructions for Bolt

## Problem Analysis

The current sparkle/ember system has severe performance issues:

1. **External Recalculation**: Sparkles are recalculated on every action (panning, clicking, etc.)
2. **Excessive Abundance**: Too many sparkle elements are generated
3. **No Caching**: Random positions are recalculated every second
4. **Performance Impact**: Causes significant lag during interactions

## Solution Overview

Transform sparkles from external, recalculated elements to internal, seeded components that:
- Use deterministic random seeds for consistent positioning
- Are internal to each element (not recalculated on external actions)
- Have reduced abundance for better performance
- Cache their positions and animations

## Implementation Instructions

### 1. Identify All Sparkle/Ember Components

**Search and locate these files:**
- `src/components/ui/Flame.tsx` - Main flame component with ember particles
- `src/components/ui/Card.tsx` - Burning paper card with ember particles
- `src/components/ui/Button.tsx` - Ember button with flame licks
- `src/components/ui/ToggleButton.tsx` - Toggle with flame licks
- `src/components/ui/CheckButton.tsx` - Checkbox with flame licks
- `src/components/ui/ChatInput.tsx` - Chat input with ember burst
- `src/components/ui/PixelEmbers.tsx` - Standalone ember component
- `src/components/LandingPage.tsx` - Landing page with flickering flames
- `src/components/ui/Hearth.tsx` - Hearth component with multiple flames

### 2. Create Seeded Random Generator

**Create a new utility file: `src/lib/seededRandom.ts`**

```typescript
// Seeded random number generator for consistent sparkle positioning
export class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  // Generate random number between 0 and 1
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  // Generate random integer between min and max (inclusive)
  randInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  
  // Generate random float between min and max
  randFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }
  
  // Pick random item from array
  pickRandom<T>(array: T[]): T {
    return array[Math.floor(this.random() * array.length)];
  }
  
  // Generate consistent position based on index
  getPosition(index: number, elementId: string): { x: number; y: number } {
    const positionSeed = this.seed + index + elementId.charCodeAt(0);
    const tempRandom = new SeededRandom(positionSeed);
    return {
      x: tempRandom.randFloat(-100, 100),
      y: tempRandom.randFloat(-100, 100)
    };
  }
}
```

### 3. Create Sparkle Configuration System

**Create: `src/lib/sparkleConfig.ts`**

```typescript
export interface SparkleConfig {
  elementId: string;
  sparkleCount: number;
  animationDuration: number;
  sizeRange: { min: number; max: number };
  colorPalette: string[];
  enabled: boolean;
}

export const DEFAULT_SPARKLE_CONFIG: SparkleConfig = {
  elementId: '',
  sparkleCount: 8, // Reduced from 40+
  animationDuration: 2.0,
  sizeRange: { min: 1, max: 3 },
  colorPalette: ['255,191,0', '255,140,0', '255,69,0'],
  enabled: true
};

// Performance-based configurations
export const PERFORMANCE_CONFIGS = {
  low: { sparkleCount: 4, animationDuration: 1.5 },
  medium: { sparkleCount: 8, animationDuration: 2.0 },
  high: { sparkleCount: 12, animationDuration: 2.5 }
};
```

### 4. Create Internal Sparkle Component

**Create: `src/components/ui/InternalSparkles.tsx`**

```typescript
import React, { useMemo } from 'react';
import { SeededRandom } from '../../lib/seededRandom';
import { SparkleConfig } from '../../lib/sparkleConfig';

interface InternalSparklesProps {
  config: SparkleConfig;
  className?: string;
  isActive?: boolean;
}

export const InternalSparkles: React.FC<InternalSparklesProps> = ({
  config,
  className = '',
  isActive = true
}) => {
  // Generate consistent sparkles using seeded random
  const sparkles = useMemo(() => {
    if (!config.enabled || !isActive) return [];
    
    const seededRandom = new SeededRandom(config.elementId.charCodeAt(0));
    
    return Array.from({ length: config.sparkleCount }, (_, i) => {
      const position = seededRandom.getPosition(i, config.elementId);
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
  }, [config.elementId, config.sparkleCount, config.enabled, isActive]);

  if (!config.enabled || sparkles.length === 0) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
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
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  );
};
```

### 5. Update CSS Animations

**Add to: `src/index.css`**

```css
/* Internal sparkle animation - optimized for performance */
@keyframes internalSparkle {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(-20px) scale(1.2);
  }
}

.animate-internal-sparkle {
  animation-name: internalSparkle;
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}
```

### 6. Refactor Flame Component

**Update: `src/components/ui/Flame.tsx`**

**Replace the current ember particle generation with:**

```typescript
// Remove these lines:
// const emberParticles = useMemo(() => { ... }, [particleCount, size, isWeak, colorPalette, clampedStrength]);
// const twinkles = useMemo(() => { ... }, [twinkleCount, size]);
// const flameLicks = useMemo(() => { ... }, [flameCount, size, isWeak, isStrong]);

// Add this instead:
const sparkleConfig: SparkleConfig = useMemo(() => ({
  elementId: `flame-${strength}-${size}`,
  sparkleCount: Math.floor(clampedStrength * 8) + (hovered ? 4 : 0), // Reduced from 40+
  animationDuration: isWeak ? 3 : 2,
  sizeRange: { min: isWeak ? 0.5 : 1, max: isWeak ? 1.5 : 3 },
  colorPalette: isWeak ? WEAK_COLORS : EMBER_COLORS,
  enabled: true
}), [clampedStrength, hovered, isWeak, size]);

// In the JSX, replace all ember particle rendering with:
<InternalSparkles 
  config={sparkleConfig}
  isActive={animated}
  className="z-10"
/>
```

### 7. Refactor Other Components

**Apply similar changes to:**

1. **Card.tsx**: Replace ember particle generation with InternalSparkles
2. **Button.tsx**: Replace flame lick generation with InternalSparkles
3. **ToggleButton.tsx**: Replace ember generation with InternalSparkles
4. **CheckButton.tsx**: Replace ember generation with InternalSparkles
5. **ChatInput.tsx**: Replace ember burst with InternalSparkles
6. **LandingPage.tsx**: Replace flickering flames with InternalSparkles

### 8. Performance Monitoring

**Add to components:**

```typescript
// Add performance monitoring
const [performanceMode, setPerformanceMode] = useState<'low' | 'medium' | 'high'>('medium');

// Adjust sparkle count based on performance
const adjustedSparkleCount = useMemo(() => {
  const baseCount = sparkleConfig.sparkleCount;
  switch (performanceMode) {
    case 'low': return Math.floor(baseCount * 0.5);
    case 'medium': return baseCount;
    case 'high': return Math.floor(baseCount * 1.5);
  }
}, [sparkleConfig.sparkleCount, performanceMode]);
```

### 9. Remove External Dependencies

**Remove these patterns from all components:**

1. **Random position calculations on every render**
2. **useMemo dependencies on external state changes**
3. **Dynamic sparkle generation based on hover/click events**
4. **Array.from with Math.random() calls**

### 10. Testing Instructions

**Test the following scenarios:**

1. **Panning**: Sparkles should not recalculate when panning the hearth
2. **Clicking**: Sparkles should maintain consistent positions
3. **Hovering**: Sparkles should only change intensity, not position
4. **Performance**: Monitor FPS during interactions
5. **Consistency**: Sparkles should appear in the same positions on each render

### 11. Migration Checklist

- [ ] Create seeded random utility
- [ ] Create sparkle configuration system
- [ ] Create InternalSparkles component
- [ ] Update CSS animations
- [ ] Refactor Flame component
- [ ] Refactor Card component
- [ ] Refactor Button components
- [ ] Refactor ChatInput component
- [ ] Refactor LandingPage component
- [ ] Add performance monitoring
- [ ] Test all interactions
- [ ] Verify performance improvements

### 12. Expected Results

After implementation:
- **Performance**: 60+ FPS during all interactions
- **Consistency**: Sparkles maintain positions across actions
- **Reduced Load**: 70% reduction in sparkle calculations
- **Better UX**: Smooth interactions without lag
- **Maintainability**: Centralized sparkle management

### 13. Rollback Plan

If issues arise:
1. Keep original components as backup
2. Implement feature flags for sparkle system
3. Add performance monitoring to detect regressions
4. Maintain both systems during transition period

This optimization will transform the sparkle system from a performance bottleneck to a smooth, consistent visual enhancement that doesn't impact user interactions. 